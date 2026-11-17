import { randomUUID } from 'node:crypto';
import { SocialProvider } from './provider.js';
import { PocError, ErrorCode, blockedCredential } from '../../errors.js';
import { request, jsonHeaders } from '../../http.js';
import { isExpired } from '../../token-store.js';

const AUTH_BASE = 'https://www.linkedin.com/oauth/v2/authorization';
const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const API_BASE = 'https://api.linkedin.com';
const DEFAULT_API_VERSION = '202610';
// 发布与组织发现是两套权限：w_organization_social 只能发帖，不能枚举 organizationAcls。
export const PUBLISH_SCOPES = ['openid', 'profile', 'w_organization_social'];
export const ORG_ADMIN_SCOPE = 'rw_organization_admin';

export class LinkedInProvider extends SocialProvider {
  constructor({
    mode,
    config,
    tokenStore,
    logger,
    timeoutMs = 15_000,
    authBase = AUTH_BASE,
    tokenUrl = TOKEN_URL,
    apiBase = API_BASE,
    apiVersion = DEFAULT_API_VERSION
  }) {
    super({ mode });
    this.config = config;
    this.tokenStore = tokenStore;
    this.logger = logger;
    this.timeoutMs = timeoutMs;
    this.authBase = authBase;
    this.tokenUrl = tokenUrl;
    this.apiBase = apiBase;
    this.apiVersion = apiVersion;
    this.counter = 0;
    this.issuedStates = new Set();
  }

  get name() {
    return 'linkedin';
  }

  missingConfig() {
    const missing = [];
    if (!this.config.linkedin.clientId) missing.push('LINKEDIN_CLIENT_ID');
    if (!this.config.linkedin.clientSecret) missing.push('LINKEDIN_CLIENT_SECRET');
    return missing;
  }

  async connect({ state = randomUUID(), includeOrgAdmin = this.config.linkedin?.orgAdminDiscovery === true } = {}) {
    if (this.mode === 'real' && this.missingConfig().length) {
      throw blockedCredential('linkedin', this.missingConfig());
    }
    const scopes = includeOrgAdmin ? [...PUBLISH_SCOPES, ORG_ADMIN_SCOPE] : [...PUBLISH_SCOPES];
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.mode === 'mock' ? 'mock-client' : this.config.linkedin.clientId,
      redirect_uri: this.config.linkedin.redirectUri,
      state,
      scope: scopes.join(' ')
    });
    this.issuedStates.add(state);
    return { authorizationUrl: `${this.authBase}?${params.toString()}`, state, scopes, includeOrgAdmin };
  }

  async handleCallback({ code, state, expectedState }) {
    if (!expectedState) {
      throw new PocError(ErrorCode.BAD_REQUEST, '缺少 expectedState，拒绝回调（state 必须强制校验）');
    }
    if (!state || state !== expectedState) {
      throw new PocError(ErrorCode.BAD_REQUEST, 'OAuth state 不匹配，拒绝回调');
    }
    if (!this.issuedStates.has(expectedState)) {
      throw new PocError(ErrorCode.BAD_REQUEST, 'OAuth state 未知或已被使用，拒绝回调');
    }
    if (!code) throw new PocError(ErrorCode.BAD_REQUEST, '回调缺少 code');
    const tokens = await this.exchangeCode(code);
    this.issuedStates.delete(expectedState);
    this.tokenStore.save('linkedin', tokens);
    const account = await this.getAccount();
    const organization = await this.getOrganization();
    return { tokens: { expiresAt: tokens.expiresAt, scope: tokens.scope }, account, organization };
  }

  async exchangeCode(code) {
    const form = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.linkedin.redirectUri,
      client_id: this.mode === 'mock' ? 'mock-client' : this.config.linkedin.clientId,
      client_secret: this.mode === 'mock' ? 'mock-secret' : this.config.linkedin.clientSecret
    });
    const res = await request({
      provider: 'linkedin',
      url: this.tokenUrl,
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      logger: this.logger
    });
    return this.normalizeTokens(res.body);
  }

  normalizeTokens(body) {
    return {
      accessToken: body.access_token,
      refreshToken: body.refresh_token || null,
      expiresAt: Date.now() + Number(body.expires_in || 0) * 1000,
      scope: body.scope || PUBLISH_SCOPES.join(' '),
      tokenType: body.token_type || 'Bearer'
    };
  }

  async ensureToken() {
    const tokens = this.tokenStore.load('linkedin');
    if (!tokens) throw new PocError(ErrorCode.AUTH_EXPIRED, '本地无 LinkedIn token，请先授权');
    if (!isExpired(tokens, 60_000)) return tokens;
    if (!tokens.refreshToken) {
      throw new PocError(ErrorCode.AUTH_EXPIRED, 'LinkedIn token 已过期且无 refresh token，需重新授权');
    }
    const form = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
      client_id: this.mode === 'mock' ? 'mock-client' : this.config.linkedin.clientId,
      client_secret: this.mode === 'mock' ? 'mock-secret' : this.config.linkedin.clientSecret
    });
    const res = await request({
      provider: 'linkedin',
      url: this.tokenUrl,
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      logger: this.logger
    });
    const next = { ...this.normalizeTokens(res.body), refreshToken: res.body.refresh_token || tokens.refreshToken };
    this.tokenStore.save('linkedin', next);
    return next;
  }

  async getAccount() {
    if (this.mode === 'mock') {
      return { id: 'mock-person-2001', name: 'Morrishk Test User', type: 'person', mode: 'mock' };
    }
    const tokens = await this.ensureToken();
    const res = await request({
      provider: 'linkedin',
      url: `${this.apiBase}/v2/userinfo`,
      headers: { authorization: `Bearer ${tokens.accessToken}` },
      logger: this.logger
    });
    return { id: res.body.sub, name: res.body.name, email: res.body.email, type: 'person', mode: 'real' };
  }

  organizationIdFromConfig() {
    const configured = this.config.linkedin?.organizationId;
    if (configured) return String(configured);
    const match = /^urn:li:organization:(\d+)$/.exec(this.config.linkedin?.authorUrn || '');
    return match ? match[1] : null;
  }

  async getOrganization({ organizationId } = {}) {
    const id = organizationId || this.organizationIdFromConfig();
    if (this.mode === 'mock') {
      return {
        id: id || 'mock-org-1001',
        name: 'Morrishk Test Page',
        type: 'organization',
        mode: 'mock',
        verified: false,
        note: 'Mock 组织身份，仅用于演示，不代表真实组织验证'
      };
    }
    if (!id) {
      throw new PocError(
        ErrorCode.CONFIG_MISSING,
        '组织主页操作需要 LINKEDIN_ORGANIZATION_ID 或 LINKEDIN_AUTHOR_URN'
      );
    }
    const tokens = await this.ensureToken();
    const res = await request({
      provider: 'linkedin',
      url: `${this.apiBase}/rest/organizations/${encodeURIComponent(id)}`,
      headers: {
        authorization: `Bearer ${tokens.accessToken}`,
        'LinkedIn-Version': this.apiVersion
      },
      logger: this.logger
    });
    return {
      id: String(res.body.id ?? id),
      name: res.body.localizedName || null,
      vanityName: res.body.vanityName || null,
      type: 'organization',
      mode: 'real'
    };
  }

  async discoverOrganizations() {
    if (this.mode === 'mock') {
      return [{ id: 'mock-org-1001', urn: 'urn:li:organization:mock-1001', role: 'ADMINISTRATOR', state: 'APPROVED', mode: 'mock' }];
    }
    const tokens = await this.ensureToken();
    const scopes = String(tokens.scope || '').split(/\s+/);
    if (!scopes.includes(ORG_ADMIN_SCOPE)) {
      throw new PocError(
        ErrorCode.BLOCKED_PERMISSION,
        `组织发现需要 ${ORG_ADMIN_SCOPE}；w_organization_social 仅授予发帖，不能枚举 organizationAcls`,
        { provider: 'linkedin', details: { granted: tokens.scope || null, required: ORG_ADMIN_SCOPE } }
      );
    }
    // 官方文档：GET /rest/organizationAcls?q=roleAssignee，需 X-Restli-Protocol-Version 与 LinkedIn-Version
    const url = new URL(`${this.apiBase}/rest/organizationAcls`);
    url.searchParams.set('q', 'roleAssignee');
    url.searchParams.set('role', 'ADMINISTRATOR');
    url.searchParams.set('state', 'APPROVED');
    url.searchParams.set('count', '10');
    const res = await request({
      provider: 'linkedin',
      url: url.toString(),
      headers: {
        authorization: `Bearer ${tokens.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': this.apiVersion
      },
      logger: this.logger
    });
    return (res.body.elements || [])
      .map((el) => {
        // 官方响应两种字段名都出现过：organization / organizationTarget
        const urn = el.organization || el.organizationTarget || '';
        return {
          urn,
          id: String(urn).split(':').pop(),
          role: el.role || null,
          state: el.state || null
        };
      })
      .filter((el) => el.urn);
  }

  async resolveAuthorUrn() {
    if (this.config.linkedin?.authorUrn) return this.config.linkedin.authorUrn;
    const orgId = this.organizationIdFromConfig();
    if (orgId) return `urn:li:organization:${orgId}`;
    if (this.mode === 'mock') return 'urn:li:organization:mock-1001';
    const orgs = await this.discoverOrganizations();
    if (!orgs.length) {
      throw new PocError(
        ErrorCode.BLOCKED_PERMISSION,
        '未找到可发布的组织主页：授权用户没有 ADMINISTRATOR 角色，或未授予组织管理权限',
        { provider: 'linkedin', details: { required: ORG_ADMIN_SCOPE } }
      );
    }
    return orgs[0].urn;
  }

  async listAccounts() {
    const person = await this.getAccount();
    if (this.mode === 'mock') {
      return [person, await this.getOrganization()];
    }
    if (this.organizationIdFromConfig()) {
      return [person, await this.getOrganization()];
    }
    return [person];
  }

  async publish({ text, authorUrn, visibility = 'PUBLIC', idempotencyKey, mediaUrls = [] }) {
    if (!text || !text.trim()) throw new PocError(ErrorCode.BAD_REQUEST, '发布内容不能为空');
    if (mediaUrls.length) {
      throw new PocError(ErrorCode.NOT_IMPLEMENTED, 'LinkedIn 图片/视频上传未在本 Demo 实现');
    }
    if (this.mode === 'mock') {
      this.counter += 1;
      return {
        id: `urn:li:share:mock-${this.counter}`,
        platform: 'linkedin',
        status: 'PUBLISHED',
        url: 'https://www.linkedin.com/feed/update/mock',
        mode: 'mock',
        idempotencyKey: idempotencyKey || null
      };
    }
    const tokens = await this.ensureToken();
    if (!authorUrn) {
      throw new PocError(
        ErrorCode.CONFIG_MISSING,
        'LinkedIn 真实发布必须显式传入最终 authorUrn，禁止隐式解析或默认组织'
      );
    }
    const urn = authorUrn;
    const res = await request({
      provider: 'linkedin',
      url: `${this.apiBase}/rest/posts`,
      method: 'POST',
      headers: {
        ...jsonHeaders(),
        authorization: `Bearer ${tokens.accessToken}`,
        'LinkedIn-Version': this.apiVersion,
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        author: urn,
        commentary: text,
        visibility,
        distribution: { feedDistribution: 'MAIN_FEED' },
        lifecycleState: 'PUBLISHED'
      }),
      timeoutMs: this.timeoutMs,
      // 发布 POST 不自动重试，避免重复发帖
      retries: 0,
      logger: this.logger
    });
    return {
      id: res.headers.get('x-restli-id'),
      platform: 'linkedin',
      status: 'PUBLISHED',
      mode: 'real',
      authorUrn: urn,
      idempotencyKey: idempotencyKey || null
    };
  }

  async getPost(id) {
    if (this.mode === 'mock') return { id, status: 'PUBLISHED', mode: 'mock' };
    const tokens = await this.ensureToken();
    const res = await request({
      provider: 'linkedin',
      url: `${this.apiBase}/rest/posts/${encodeURIComponent(id)}`,
      headers: {
        authorization: `Bearer ${tokens.accessToken}`,
        'LinkedIn-Version': this.apiVersion
      },
      logger: this.logger
    });
    return res.body;
  }

  async fetchMetrics() {
    if (this.mode === 'mock') {
      return {
        platform: 'linkedin',
        followers: 1284,
        impressions: 53210,
        engagements: 1760,
        mode: 'mock',
        note: '示例数据，非真实接口结果'
      };
    }
    throw new PocError(
      ErrorCode.NOT_IMPLEMENTED,
      '组织页统计需 r_organization_social 权限，本 Demo 未申请，未验证'
    );
  }

  async disconnect() {
    this.tokenStore.remove('linkedin');
    return { disconnected: true, mode: this.mode };
  }
}
