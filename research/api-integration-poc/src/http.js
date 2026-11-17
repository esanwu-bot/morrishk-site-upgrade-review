import { randomUUID } from 'node:crypto';
import { PocError, ErrorCode, classifyHttpError, isRetryableStatus } from './errors.js';
import { redactUrl } from './redact.js';

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 2;

function parseRetryAfter(value) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const at = Date.parse(value);
  if (Number.isFinite(at)) return Math.max(0, at - Date.now());
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function request({
  provider,
  url,
  method = 'GET',
  headers = {},
  body,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  retries = DEFAULT_RETRIES,
  retryBaseMs = 250,
  retryNonIdempotent = false,
  logger,
  signal
}) {
  // POST 默认不自动重试：发布类请求一旦在服务端生效，重发可能产生重复内容。
  // 只读 POST（如 GA4 runReport）必须显式传 retryNonIdempotent: true。
  const maxRetries = method === 'POST' && !retryNonIdempotent ? 0 : retries;
  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    const requestId = randomUUID();
    const started = Date.now();
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: { 'x-request-id': requestId, ...headers },
        body,
        signal: controller.signal
      });

      const text = await response.text();
      let parsed = text;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        // 保留原始文本
      }

      const durationMs = Date.now() - started;
      logger?.debug('http.request', {
        provider,
        method,
        url: redactUrl(url),
        status: response.status,
        durationMs,
        requestId
      });

      if (response.ok) {
        return { status: response.status, headers: response.headers, body: parsed, requestId, durationMs };
      }

      const err = classifyHttpError({ provider, status: response.status, body: parsed, requestId });
      err.details = { method, url: redactUrl(url), attempt };

      if (!isRetryableStatus(response.status) || attempt === maxRetries) {
        if (err.code === ErrorCode.RATE_LIMITED && attempt === maxRetries) {
          throw new PocError(ErrorCode.RETRY_EXHAUSTED, `重试耗尽：${err.message}`, {
            provider,
            status: response.status,
            requestId
          });
        }
        throw err;
      }

      lastError = err;
      const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
      const backoff = retryAfter ?? retryBaseMs * 2 ** attempt + Math.floor(Math.random() * 100);
      logger?.warn('http.retry', { provider, status: response.status, attempt, waitMs: backoff, requestId });
      await sleep(backoff);
    } catch (err) {
      if (err instanceof PocError) throw err;
      const aborted = err?.name === 'AbortError';
      const wrapped = aborted
        ? new PocError(ErrorCode.TIMEOUT, `请求超时（${timeoutMs}ms）`, { provider, retryable: true })
        : new PocError(ErrorCode.PLATFORM_ERROR, `网络错误：${err?.message || err}`, {
            provider,
            retryable: true,
            cause: err
          });
      if (attempt === maxRetries) {
        throw new PocError(ErrorCode.RETRY_EXHAUSTED, wrapped.message, { provider, cause: err });
      }
      lastError = wrapped;
      const backoff = retryBaseMs * 2 ** attempt + Math.floor(Math.random() * 100);
      logger?.warn('http.network_retry', { provider, attempt, waitMs: backoff, error: wrapped.message });
      await sleep(backoff);
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', onAbort);
    }
    attempt++;
  }

  throw lastError || new PocError(ErrorCode.PLATFORM_ERROR, '未知请求失败', { provider });
}

export function jsonHeaders(extra = {}) {
  return { 'content-type': 'application/json', accept: 'application/json', ...extra };
}
