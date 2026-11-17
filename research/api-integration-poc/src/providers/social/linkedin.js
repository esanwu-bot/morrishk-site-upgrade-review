import { randomUUID } from 'node:crypto';
import { SocialProvider } from './provider.js';
import { PocError, ErrorCode, blockedCredential } from '../../errors.js';
import { request, jsonHeaders } from '../../http.js';
import { isExpired } from '../../token-store.js';

const AUTH_BASE = 'https://www.linkedin.com/oauth/v2/authorization';
const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const API_BASE = 'https://api.linkedin.com';
const SCOPES = ['openid', 'profile', 'w_organization_social'];

export class LinkedInProvider extends SocialProvider {
  constructor({ mode, config, tokenStore, logger, authBase = AUTH_BASE, tokenUrl = TOKEN_URL, apiBase = API_BASE }) {
    super({ mode });
    this.config = config;
    this.tokenStore = tokenStore;
    this.logger = logger;
    this.authBase = authBase;
    this.tokenUrl = tokenUrl;
    this.apiBase = apiBase;
    this.counter = 0;
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

  async connect({ state = randomUUID() } = {}) {
    if (this.mode === 'real' && this.missingConfig().length) {
      throw blockedCredential('linkedin', this.missingConfig());
    }
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.mode === 'mock' ? 'mock-client' : this.config.linkedin.clientId,
      redirect_uri: this.config.linkedin.redirectUri,
      state,
      scope: SCOPES.join(' ')
    });
    return { authorizationUrl: `${this.authBase}?${params.toString()}`, state };
  }

  async handleCallback({ code, state, expectedState }) {
    if (expectedState && state !== expectedState) {
      throw new PocError(ErrorCode.BAD_REQUEST, 'OAuth state 不匹配，拒绝回调');
    }
    if (!code) throw new PocError(ErrorCode.BAD_REQUEST, '回调缺少 code');
    const tokens = await this.exchangeCode(code);
    this.tokenStore.save('linkedin', tokens);
    const account = await this.getAccount();
    return { tokens: { expiresAt: tokens.expiresAt, scope: tokens.scope }, account };
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
      scope: body.scope || SCOPES.join(' '),
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
      return { id: 'mock-org-1001', name: 'Morrishk Test Page', type: 'organization', mode: 'mock' };
    }
    const tokens = await this.ensureToken();
    const res = await request({
      provider: 'linkedin',
      url: `${this.apiBase}/v2/userinfo`,
      headers: { authorization: `Bearer ${tokens.accessToken}` },
      logger: this.logger
    });
    return res.body;
  }

  async listAccounts() {
    return [await this.getAccount()];
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
      throw new PocError(ErrorCode.CONFIG_MISSING, '真实发布需要 authorUrn（LINKEDIN_AUTHOR_URN）');
    }
    const res = await request({
      provider: 'linkedin',
      url: `${this.apiBase}/rest/posts`,
      method: 'POST',
      headers: {
        ...jsonHeaders(),
        authorization: `Bearer ${tokens.accessToken}`,
        'LinkedIn-Version': '202506',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        author: authorUrn,
        commentary: text,
        visibility,
        distribution: { feedDistribution: 'MAIN_FEED' },
        lifecycleState: 'PUBLISHED'
      }),
      logger: this.logger
    });
    return {
      id: res.headers.get('x-restli-id'),
      platform: 'linkedin',
      status: 'PUBLISHED',
      mode: 'real',
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
        'LinkedIn-Version': '202506'
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
