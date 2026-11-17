import { VideoProvider } from './provider.js';
import { PocError, ErrorCode, blockedCredential } from '../../errors.js';
import { request, jsonHeaders } from '../../http.js';

const API_BASE = 'https://api.mux.com';

// Mux 真实 API 使用 snake_case；Provider 对外统一 camelCase。
export function normalizeUpload(data, mode) {
  return {
    id: data.id,
    url: data.url,
    status: data.status,
    assetId: data.asset_id ?? null,
    mode
  };
}

export function normalizeAsset(data, mode) {
  const playback = Array.isArray(data.playback_ids) ? data.playback_ids[0] : null;
  return {
    id: data.id,
    status: data.status,
    duration: data.duration ?? null,
    aspectRatio: data.aspect_ratio ?? null,
    playbackId: playback?.id ?? null,
    playbackPolicy: playback?.policy ?? null,
    mode
  };
}

export class MuxProvider extends VideoProvider {
  constructor({ mode, config, logger, apiBase = API_BASE }) {
    super({ mode });
    this.config = config;
    this.logger = logger;
    this.apiBase = apiBase;
    this.uploads = new Map();
    this.counter = 0;
  }

  get name() {
    return 'mux';
  }

  missingConfig() {
    const missing = [];
    if (!this.config.mux.tokenId) missing.push('MUX_TOKEN_ID');
    if (!this.config.mux.tokenSecret) missing.push('MUX_TOKEN_SECRET');
    return missing;
  }

  authHeaders() {
    const raw = `${this.config.mux.tokenId}:${this.config.mux.tokenSecret}`;
    return { ...jsonHeaders(), authorization: `Basic ${Buffer.from(raw).toString('base64')}` };
  }

  async createUpload({ playbackPolicy = 'public', passthrough = null } = {}) {
    if (this.mode === 'mock') {
      this.counter += 1;
      const id = `mock-upload-${this.counter}`;
      const record = {
        id,
        url: `mock://mux/upload/${id}`,
        status: 'waiting',
        assetId: null,
        uploadedBytes: 0,
        polls: 0,
        passthrough
      };
      this.uploads.set(id, record);
      return { id, url: record.url, status: record.status, assetId: null, mode: 'mock' };
    }
    if (this.missingConfig().length) throw blockedCredential('mux', this.missingConfig());
    const res = await request({
      provider: 'mux',
      url: `${this.apiBase}/video/v1/uploads`,
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({
        cors_origin: '*',
        new_asset_settings: { playback_policies: [playbackPolicy], passthrough }
      }),
      logger: this.logger
    });
    return normalizeUpload(res.body.data, 'real');
  }

  async uploadFile({ uploadId, uploadUrl, buffer, chunkSize = 64 * 1024 }) {
    if (this.mode === 'mock') {
      const record = this.uploads.get(uploadId);
      if (!record) throw new PocError(ErrorCode.BAD_REQUEST, `未知上传任务：${uploadId}`);
      const chunks = Math.ceil(buffer.length / chunkSize);
      for (let i = 0; i < chunks; i++) {
        record.uploadedBytes += Math.min(chunkSize, buffer.length - i * chunkSize);
      }
      record.status = 'asset_created';
      record.assetId = `mock-asset-${uploadId.replace('mock-upload-', '')}`;
      return { uploadId, bytes: record.uploadedBytes, chunks, status: record.status, mode: 'mock' };
    }
    if (this.missingConfig().length) throw blockedCredential('mux', this.missingConfig());
    const res = await request({
      provider: 'mux',
      url: uploadUrl,
      method: 'PUT',
      headers: { 'content-type': 'application/octet-stream' },
      body: buffer,
      timeoutMs: 120_000,
      // 直传 PUT 不做自动重试：Mock 的分片计数不代表真实可恢复续传
      retries: 0,
      logger: this.logger
    });
    return { uploadId, status: res.status, mode: 'real' };
  }

  async getUpload(uploadId) {
    if (this.mode === 'mock') {
      const record = this.uploads.get(uploadId);
      if (!record) throw new PocError(ErrorCode.BAD_REQUEST, `未知上传任务：${uploadId}`);
      record.polls += 1;
      return {
        id: record.id,
        status: record.status,
        assetId: record.assetId,
        uploadedBytes: record.uploadedBytes,
        mode: 'mock'
      };
    }
    if (this.missingConfig().length) throw blockedCredential('mux', this.missingConfig());
    const res = await request({
      provider: 'mux',
      url: `${this.apiBase}/video/v1/uploads/${encodeURIComponent(uploadId)}`,
      headers: this.authHeaders(),
      logger: this.logger
    });
    return normalizeUpload(res.body.data, 'real');
  }

  async getAsset(assetId) {
    if (this.mode === 'mock') {
      const upload = [...this.uploads.values()].find((u) => u.assetId === assetId);
      if (!upload) throw new PocError(ErrorCode.BAD_REQUEST, `未知资产：${assetId}`);
      return {
        id: assetId,
        status: 'ready',
        duration: 12.5,
        aspectRatio: '16:9',
        playbackId: `mock-playback-${assetId}`,
        thumbnailUrl: `https://image.mux.com/mock-playback-${assetId}/thumbnail.jpg`,
        mode: 'mock'
      };
    }
    if (this.missingConfig().length) throw blockedCredential('mux', this.missingConfig());
    const res = await request({
      provider: 'mux',
      url: `${this.apiBase}/video/v1/assets/${encodeURIComponent(assetId)}`,
      headers: this.authHeaders(),
      logger: this.logger
    });
    return normalizeAsset(res.body.data, 'real');
  }

  playbackUrl(playbackId) {
    return `https://stream.mux.com/${playbackId}.m3u8`;
  }

  thumbnailUrl(playbackId, { width = 640, time = 1 } = {}) {
    return `https://image.mux.com/${playbackId}/thumbnail.jpg?width=${width}&time=${time}`;
  }
}
