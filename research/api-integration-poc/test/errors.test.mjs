import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ErrorCode,
  PocError,
  classifyHttpError,
  isRetryableStatus,
  blockedCredential
} from '../src/errors.js';

test('HTTP 错误分类映射到稳定错误码', () => {
  assert.equal(classifyHttpError({ provider: 'p', status: 401, body: { message: 'expired' } }).code, ErrorCode.AUTH_EXPIRED);
  assert.equal(classifyHttpError({ provider: 'p', status: 403, body: {} }).code, ErrorCode.BLOCKED_PERMISSION);
  assert.equal(classifyHttpError({ provider: 'p', status: 429, body: {} }).code, ErrorCode.RATE_LIMITED);
  assert.equal(classifyHttpError({ provider: 'p', status: 500, body: '' }).code, ErrorCode.PLATFORM_ERROR);
  assert.equal(classifyHttpError({ provider: 'p', status: 400, body: { error: 'bad' } }).code, ErrorCode.BAD_REQUEST);
  assert.equal(classifyHttpError({ provider: 'p', status: 200, body: {} }), null);
});

test('401/403/400 不可重试，429/5xx 可重试', () => {
  assert.equal(classifyHttpError({ status: 401 }).retryable, false);
  assert.equal(classifyHttpError({ status: 403 }).retryable, false);
  assert.equal(classifyHttpError({ status: 400 }).retryable, false);
  assert.equal(classifyHttpError({ status: 429 }).retryable, true);
  assert.equal(classifyHttpError({ status: 503 }).retryable, true);
});

test('isRetryableStatus 覆盖 408 / 429 / 5xx', () => {
  assert.equal(isRetryableStatus(408), true);
  assert.equal(isRetryableStatus(429), true);
  assert.equal(isRetryableStatus(500), true);
  assert.equal(isRetryableStatus(599), true);
  assert.equal(isRetryableStatus(400), false);
  assert.equal(isRetryableStatus(600), false);
});

test('错误消息优先取平台错误描述并保留 requestId', () => {
  const err = classifyHttpError({
    provider: 'linkedin',
    status: 401,
    body: { error_description: 'token revoked' },
    requestId: 'req-1'
  });
  assert.match(err.message, /token revoked/);
  assert.equal(err.requestId, 'req-1');
  assert.equal(err.provider, 'linkedin');
});

test('缺少凭证时标记 BLOCKED_CREDENTIAL 且不可重试', () => {
  const err = blockedCredential('mux', ['MUX_TOKEN_ID', 'MUX_TOKEN_SECRET']);
  assert.equal(err.code, ErrorCode.BLOCKED_CREDENTIAL);
  assert.equal(err.retryable, false);
  assert.match(err.message, /MUX_TOKEN_ID, MUX_TOKEN_SECRET/);
  assert.match(err.message, /未验证/);
});

test('PocError.toJSON 输出可序列化证据', () => {
  const err = new PocError(ErrorCode.TIMEOUT, '超时', { provider: 'ga4', retryable: true });
  const json = err.toJSON();
  assert.equal(json.code, 'TIMEOUT');
  assert.equal(json.retryable, true);
  assert.equal(json.provider, 'ga4');
});
