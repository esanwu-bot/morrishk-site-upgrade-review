import { PocError, ErrorCode } from './errors.js';

export class MemoryIdempotencyStore {
  constructor({ ttlMs = 24 * 60 * 60 * 1000, now = () => Date.now() } = {}) {
    this.ttlMs = ttlMs;
    this.now = now;
    this.entries = new Map();
  }

  async run(key, fingerprint, fn) {
    if (!key) return fn();
    const existing = this.entries.get(key);
    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        throw new PocError(ErrorCode.IDEMPOTENCY_CONFLICT, `幂等键 ${key} 已用于不同内容`, {
          details: { key }
        });
      }
      if (existing.promise) return existing.promise;
      if (existing.expiresAt > this.now()) return existing.result;
    }

    const promise = (async () => fn())();
    const entry = {
      fingerprint,
      promise,
      result: null,
      expiresAt: this.now() + this.ttlMs
    };
    this.entries.set(key, entry);
    try {
      const result = await promise;
      entry.result = result;
      entry.promise = null;
      return result;
    } catch (err) {
      this.entries.delete(key);
      throw err;
    }
  }
}
