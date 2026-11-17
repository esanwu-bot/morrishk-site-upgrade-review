import { SocialProvider } from './provider.js';
import { PocError, ErrorCode, blockedCredential } from '../../errors.js';
import { request, jsonHeaders } from '../../http.js';

// platform 只是渠道，不是账号身份；这些占位值不得作为真实目标。
const PLACEHOLDER_PROFILES = new Set(['default', 'all', '*', 'any', 'profile']);

export class AyrshareProvider extends SocialProvider {
  constructor({ mode, config, logger, timeoutMs = 15_000 }) {
    super({ mode });
    this.config = config;
    this.logger = logger;
    this.timeoutMs = timeoutMs;
    this.counter = 0;
  }

  get name() {
    return 'ayrshare';
  }

  missingConfig() {
    return this.config.ayrshare.apiKey ? [] : ['AYRSHARE_API_KEY'];
  }

  async connect() {
    if (this.mode === 'real') {
      throw new PocError(
        ErrorCode.NOT_IMPLEMENTED,
        'Ayrshare 的账号关联需在其控制台/JWT 流程完成，本 Demo 未实现真实关联'
      );
    }
    return {
      authorizationUrl: 'mock://ayrshare/connect',
      note: '聚合模式下由客户在各平台完成 OAuth 关联，Demo 以 Mock 代替'
    };
  }

  async handleCallback() {
    throw new PocError(ErrorCode.NOT_IMPLEMENTED, 'Ayrshare 无标准 OAuth 回调，Demo 不适用');
  }

  async listAccounts() {
    if (this.mode === 'mock') {
      return [
        { platform: 'linkedin', handle: 'morrishk-test', mode: 'mock' },
        { platform: 'facebook', handle: 'morrishk-test-page', mode: 'mock' },
        { platform: 'instagram', handle: 'morrishk.test', mode: 'mock' }
      ];
    }
    if (this.missingConfig().length) throw blockedCredential('ayrshare', this.missingConfig());
    const res = await request({
      provider: 'ayrshare',
      url: `${this.config.ayrshare.baseUrl}/api/user`,
      headers: this.authHeaders(),
      logger: this.logger
    });
    return res.body;
  }

  async getAccount() {
    const accounts = await this.listAccounts();
    return Array.isArray(accounts) ? accounts[0] : accounts;
  }

  authHeaders(profileKey) {
    const headers = { ...jsonHeaders(), authorization: `Bearer ${this.config.ayrshare.apiKey}` };
    // 官方文档：发布到指定 User Profile 时，Profile-Key 放在请求头，不放 body
    if (profileKey) headers['Profile-Key'] = profileKey;
    return headers;
  }

  assertProfileKey(profileKey) {
    const key = String(profileKey || '').trim();
    if (!key) {
      throw new PocError(
        ErrorCode.POLICY_BLOCKED,
        'Ayrshare 真实发布必须显式指定 Profile Key（account），platform 不能代替账号身份'
      );
    }
    if (PLACEHOLDER_PROFILES.has(key.toLowerCase())) {
      throw new PocError(
        ErrorCode.POLICY_BLOCKED,
        `account=${key} 是占位值，不是真实 Ayrshare Profile，禁止真实发布`
      );
    }
    return key;
  }

  async resolvePublishTarget({ profileKey, platform }) {
    const key = this.assertProfileKey(profileKey);
    if (!platform) {
      throw new PocError(ErrorCode.BAD_REQUEST, 'Ayrshare 目标必须指定 platform');
    }
    if (this.mode === 'mock') {
      return { profileKey: key, platform, platforms: [platform], mode: 'mock' };
    }
    if (this.missingConfig().length) throw blockedCredential('ayrshare', this.missingConfig());

    // 发布前预检：/api/user 带 Profile-Key 返回该 Profile 已关联的社交账号。
    // 若无法确认该 Profile 与目标平台的唯一绑定，直接拒绝，不发送 POST /api/post。
    const res = await request({
      provider: 'ayrshare',
      url: `${this.config.ayrshare.baseUrl}/api/user`,
      headers: this.authHeaders(key),
      logger: this.logger
    });
    const body = res.body;
    const list = Array.isArray(body)
      ? body
      : body?.activeSocialAccounts || body?.accounts || body?.socialAccounts || [];
    const platforms = list
      .map((item) => (typeof item === 'string' ? item : item?.platform || item?.type || ''))
      .filter(Boolean);
    if (!platforms.length) {
      throw new PocError(
        ErrorCode.BLOCKED_PERMISSION,
        'Ayrshare 无法从 /api/user 确认该 Profile 的已关联平台，拒绝真实发布',
        { provider: 'ayrshare', details: { profileKey: key } }
      );
    }
    const matches = platforms.filter((item) => item === platform).length;
    if (matches === 0) {
      throw new PocError(
        ErrorCode.BLOCKED_PERMISSION,
        `Ayrshare Profile ${key} 未关联平台 ${platform}，拒绝真实发布`,
        { provider: 'ayrshare', details: { profileKey: key, platform, platforms } }
      );
    }
    if (matches > 1) {
      throw new PocError(
        ErrorCode.BLOCKED_PERMISSION,
        `Ayrshare Profile ${key} 在平台 ${platform} 有多个已关联账号，无法确认唯一目标，拒绝真实发布`,
        { provider: 'ayrshare', details: { profileKey: key, platform, platforms } }
      );
    }
    return { profileKey: key, platform, platforms, source: '/api/user' };
  }

  async publish({ text, platforms = ['linkedin'], mediaUrls = [], scheduleDate, idempotencyKey, profileKey }) {
    if (!text || !text.trim()) throw new PocError(ErrorCode.BAD_REQUEST, '发布内容不能为空');
    if (!Array.isArray(platforms) || !platforms.length) {
      throw new PocError(ErrorCode.BAD_REQUEST, '至少选择一个平台');
    }

    if (this.mode === 'mock') {
      if (text.includes('FAIL_DEMO')) {
        throw new PocError(ErrorCode.BAD_REQUEST, '模拟平台拒绝：内容包含 FAIL_DEMO', {
          provider: 'ayrshare',
          status: 400
        });
      }
      this.counter += 1;
      return {
        id: `ayrshare-mock-${this.counter}`,
        status: scheduleDate ? 'SCHEDULED' : 'PUBLISHED',
        scheduledAt: scheduleDate || null,
        platforms: platforms.map((p) => ({ platform: p, ok: true })),
        mode: 'mock',
        idempotencyKey: idempotencyKey || null,
        idempotency: {
          key: idempotencyKey || null,
          localStore: 'MemoryIdempotencyStore（Demo 本地）',
          vendor: { field: 'idempotencyKey', sent: false, verified: false }
        }
      };
    }

    if (this.missingConfig().length) throw blockedCredential('ayrshare', this.missingConfig());
    if (platforms.length !== 1) {
      throw new PocError(
        ErrorCode.POLICY_BLOCKED,
        'Ayrshare 真实发布一次只能指定一个平台，禁止用多平台替代账号身份'
      );
    }
    // platform 只决定渠道；账号身份必须由 Profile-Key 唯一确定，并在 POST 前完成绑定预检
    const key = this.assertProfileKey(profileKey);
    const target = await this.resolvePublishTarget({ profileKey: key, platform: platforms[0] });
    const res = await request({
      provider: 'ayrshare',
      url: `${this.config.ayrshare.baseUrl}/api/post`,
      method: 'POST',
      headers: this.authHeaders(key),
      body: JSON.stringify({
        post: text,
        platforms,
        mediaUrls: mediaUrls.length ? mediaUrls : undefined,
        scheduleDate: scheduleDate || undefined,
        ...(idempotencyKey ? { idempotencyKey } : {})
      }),
      timeoutMs: this.timeoutMs,
      // 发布 POST 不自动重试，避免超时后重复发帖
      retries: 0,
      retryNonIdempotent: false,
      logger: this.logger
    });
    return {
      ...res.body,
      mode: 'real',
      idempotencyKey: idempotencyKey || null,
      profileKey: key,
      target: { profileKey: key, platform: platforms[0] },
      preflight: { verified: true, source: target.source, platforms: target.platforms },
      idempotency: {
        key: idempotencyKey || null,
        localStore: 'MemoryIdempotencyStore（Demo 本地）',
        vendor: { field: 'idempotencyKey', sent: Boolean(idempotencyKey), verified: false }
      }
    };
  }

  async getPost(id) {
    if (this.mode === 'mock') return { id, status: 'PUBLISHED', mode: 'mock' };
    if (this.missingConfig().length) throw blockedCredential('ayrshare', this.missingConfig());
    const res = await request({
      provider: 'ayrshare',
      url: `${this.config.ayrshare.baseUrl}/api/post/${encodeURIComponent(id)}`,
      headers: this.authHeaders(),
      logger: this.logger
    });
    return res.body;
  }

  async fetchMetrics({ platforms = ['linkedin'], startDate, endDate } = {}) {
    if (this.mode === 'mock') {
      return {
        platforms: platforms.map((p) => ({
          platform: p,
          impressions: 12000 + p.length * 137,
          engagements: 340 + p.length
        })),
        range: { startDate: startDate || '2026-10-01', endDate: endDate || '2026-10-31' },
        mode: 'mock',
        note: '示例数据，非真实接口结果'
      };
    }
    if (this.missingConfig().length) throw blockedCredential('ayrshare', this.missingConfig());
    const res = await request({
      provider: 'ayrshare',
      url: `${this.config.ayrshare.baseUrl}/api/analytics/social`,
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({ platforms, startDate, endDate }),
      retryNonIdempotent: true,
      logger: this.logger
    });
    return res.body;
  }

  async disconnect() {
    return { disconnected: true, mode: this.mode, note: '聚合模式下解除关联需在供应商控制台确认' };
  }
}
