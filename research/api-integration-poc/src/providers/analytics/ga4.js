import fs from 'node:fs';
import crypto from 'node:crypto';
import { AnalyticsProvider } from './provider.js';
import { PocError, ErrorCode, blockedCredential } from '../../errors.js';
import { request, jsonHeaders } from '../../http.js';

const DATA_BASE = 'https://analyticsdata.googleapis.com/v1beta';
const ADMIN_BASE = 'https://analyticsadmin.googleapis.com/v1beta';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const READ_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

// 真实 accountSummaries 返回 { accountSummaries: [{ account, displayName, propertySummaries: [{ property, displayName, propertyType, parent }] }], nextPageToken }
export function flattenAccountSummaries(raw) {
  const out = [];
  for (const account of raw?.accountSummaries || []) {
    for (const summary of account.propertySummaries || []) {
      out.push({
        propertyId: String(summary.property || '').replace(/^properties\//, ''),
        propertyName: summary.property || null,
        displayName: summary.displayName || null,
        propertyType: summary.propertyType || null,
        parent: summary.parent || null,
        account: account.displayName || null,
        accountName: account.account || null
      });
    }
  }
  return out;
}

const MOCK_ACCOUNT_SUMMARIES = {
  accountSummaries: [
    {
      account: 'accounts/100',
      displayName: 'Morrishk',
      propertySummaries: [
        { property: 'properties/123456789', displayName: 'Morrishk - Global', propertyType: 'PROPERTY_TYPE_ORDINARY', parent: 'accounts/100' },
        { property: 'properties/987654321', displayName: 'Morrishk - DE', propertyType: 'PROPERTY_TYPE_ORDINARY', parent: 'accounts/100' }
      ]
    }
  ]
};

export class GoogleAuth {
  constructor({ mode, config, logger, scope = READ_SCOPE, tokenUrl = TOKEN_URL }) {
    this.mode = mode;
    this.config = config;
    this.logger = logger;
    this.scope = scope;
    this.tokenUrl = tokenUrl;
    this.cached = null;
  }

  async getAccessToken() {
    if (this.mode === 'mock') return 'mock-access-token';
    if (this.config.ga4.accessToken) {
      return this.config.ga4.accessToken;
    }
    if (!this.config.ga4.credentialsPath) {
      throw blockedCredential('ga4', ['GOOGLE_APPLICATION_CREDENTIALS 或 GOOGLE_ACCESS_TOKEN']);
    }
    if (this.cached && this.cached.expiresAt > Date.now() + 60_000) {
      return this.cached.token;
    }

    const creds = JSON.parse(fs.readFileSync(this.config.ga4.credentialsPath, 'utf8'));
    const now = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claims = b64url(
      JSON.stringify({
        iss: creds.client_email,
        scope: this.scope,
        aud: this.tokenUrl,
        iat: now,
        exp: now + 3600
      })
    );
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(`${header}.${claims}`);
    const signature = signer.sign(creds.private_key).toString('base64url');
    const assertion = `${header}.${claims}.${signature}`;

    const form = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    });
    const res = await request({
      provider: 'ga4',
      url: this.tokenUrl,
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      logger: this.logger
    });
    this.cached = {
      token: res.body.access_token,
      expiresAt: Date.now() + Number(res.body.expires_in || 3600) * 1000
    };
    return this.cached.token;
  }
}

export class GA4Provider extends AnalyticsProvider {
  constructor({ mode, config, logger, auth = null, dataBase = DATA_BASE, adminBase = ADMIN_BASE }) {
    super({ mode });
    this.config = config;
    this.logger = logger;
    this.auth = auth || new GoogleAuth({ mode, config, logger });
    this.dataBase = dataBase;
    this.adminBase = adminBase;
  }

  get name() {
    return 'ga4';
  }

  async listProperties({ maxPages = 50 } = {}) {
    if (this.mode === 'mock') {
      return flattenAccountSummaries(MOCK_ACCOUNT_SUMMARIES);
    }
    const token = await this.auth.getAccessToken();
    const properties = [];
    let pageToken = null;
    let pages = 0;
    do {
      const url = new URL(`${this.adminBase}/accountSummaries`);
      url.searchParams.set('pageSize', '200');
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const res = await request({
        provider: 'ga4',
        url: url.toString(),
        headers: { authorization: `Bearer ${token}` },
        logger: this.logger
      });
      properties.push(...flattenAccountSummaries(res.body));
      pageToken = res.body?.nextPageToken || null;
      pages += 1;
    } while (pageToken && pages < maxPages);
    if (pageToken) {
      throw new PocError(
        ErrorCode.PLATFORM_ERROR,
        `accountSummaries 分页超过 ${maxPages} 页仍未结束，结果不完整，已中止`,
        { provider: 'ga4', retryable: false, details: { pages, nextPageToken: pageToken } }
      );
    }
    return properties;
  }

  async runReport({ propertyId, dateRanges, dimensions = ['date'], metrics = ['sessions'], limit = 100, offset = 0 }) {
    if (!propertyId) throw new PocError(ErrorCode.BAD_REQUEST, 'propertyId 必填');
    if (!Array.isArray(dateRanges) || !dateRanges.length) {
      throw new PocError(ErrorCode.BAD_REQUEST, '至少需要一个日期范围');
    }
    if (dateRanges.length > 4) {
      throw new PocError(ErrorCode.BAD_REQUEST, '单请求最多 4 个日期范围');
    }

    if (this.mode === 'mock') {
      return this.mockReport({ propertyId, dateRanges, dimensions, metrics, limit, offset });
    }

    const token = await this.auth.getAccessToken();
    const res = await request({
      provider: 'ga4',
      url: `${this.dataBase}/properties/${encodeURIComponent(propertyId)}:runReport`,
      method: 'POST',
      headers: { ...jsonHeaders(), authorization: `Bearer ${token}` },
      body: JSON.stringify({
        dateRanges: dateRanges.map((r) => ({
          startDate: r.startDate,
          endDate: r.endDate,
          ...(r.name ? { name: r.name } : {})
        })),
        dimensions: dimensions.map((name) => ({ name })),
        metrics: metrics.map((name) => ({ name })),
        limit,
        offset
      }),
      // runReport 是只读 POST，可安全重试；发布类 POST 不具备该属性
      retryNonIdempotent: true,
      logger: this.logger
    });
    return res.body;
  }

  mockReport({ propertyId, dateRanges, dimensions, metrics, limit, offset }) {
    if (propertyId === 'forbidden') {
      throw new PocError(ErrorCode.BLOCKED_PERMISSION, '模拟：服务账号未获该 Property 权限', {
        provider: 'ga4',
        status: 403
      });
    }
    if (propertyId === 'quota') {
      throw new PocError(ErrorCode.RATE_LIMITED, '模拟：配额耗尽（429）', { provider: 'ga4', status: 429 });
    }
    const sources = [
      ['google', 'organic'],
      ['linkedin', 'social'],
      ['direct', '(none)']
    ];
    const rows = [];
    const base = 100 + Number(String(propertyId).replace(/\D/g, '').slice(-3) || 0);
    for (let i = 0; i < sources.length; i++) {
      const dims = {};
      for (const d of dimensions) {
        if (d === 'sessionSource') dims[d] = sources[i][0];
        else if (d === 'sessionMedium') dims[d] = sources[i][1];
        else if (d === 'pagePath') dims[d] = ['/', '/products/', '/contact/'][i];
        else if (d === 'date') dims[d] = '2026-11-16';
        else dims[d] = `mock-${d}`;
      }
      const vals = {};
      for (const m of metrics) {
        if (m === 'sessions') vals[m] = String(base * (3 - i));
        else if (m === 'totalUsers') vals[m] = String(base * (2 - i) + 17);
        else if (m === 'screenPageViews') vals[m] = String(base * (5 - i));
        else if (m === 'eventCount') vals[m] = String(base * (4 - i));
        else vals[m] = '0';
      }
      rows.push({ dimensionValues: dimensions.map((d) => ({ value: dims[d] })), metricValues: metrics.map((m) => ({ value: vals[m] })) });
    }
    const sliced = rows.slice(offset, offset + limit);
    return {
      dimensionHeaders: dimensions.map((name) => ({ name })),
      metricHeaders: metrics.map((name) => ({ name, type: 'TYPE_INTEGER' })),
      rows: sliced,
      rowCount: rows.length,
      metadata: { currencyCode: 'USD', timeZone: 'Etc/UTC' },
      kind: 'analyticsData#runReport'
    };
  }
}
