import { SocialProvider } from './provider.js';
import { PocError, ErrorCode, blockedCredential } from '../../errors.js';
import { request, jsonHeaders } from '../../http.js';

export class AyrshareProvider extends SocialProvider {
  constructor({ mode, config, logger }) {
    super({ mode });
    this.config = config;
    this.logger = logger;
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

  authHeaders() {
    return { ...jsonHeaders(), authorization: `Bearer ${this.config.ayrshare.apiKey}` };
  }

  async publish({ text, platforms = ['linkedin'], mediaUrls = [], scheduleDate, idempotencyKey }) {
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
        idempotencyKey: idempotencyKey || null
      };
    }

    if (this.missingConfig().length) throw blockedCredential('ayrshare', this.missingConfig());
    const res = await request({
      provider: 'ayrshare',
      url: `${this.config.ayrshare.baseUrl}/api/post`,
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({
        post: text,
        platforms,
        mediaUrls: mediaUrls.length ? mediaUrls : undefined,
        scheduleDate: scheduleDate || undefined
      }),
      logger: this.logger
    });
    return { ...res.body, mode: 'real', idempotencyKey: idempotencyKey || null };
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
      logger: this.logger
    });
    return res.body;
  }

  async disconnect() {
    return { disconnected: true, mode: this.mode, note: '聚合模式下解除关联需在供应商控制台确认' };
  }
}
