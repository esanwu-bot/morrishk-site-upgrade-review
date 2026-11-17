export const ErrorCode = Object.freeze({
  CONFIG_MISSING: 'CONFIG_MISSING',
  BLOCKED_CREDENTIAL: 'BLOCKED_CREDENTIAL',
  BLOCKED_PERMISSION: 'BLOCKED_PERMISSION',
  BLOCKED_PLATFORM: 'BLOCKED_PLATFORM',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  PERMISSION_REVOKED: 'PERMISSION_REVOKED',
  RATE_LIMITED: 'RATE_LIMITED',
  RETRY_EXHAUSTED: 'RETRY_EXHAUSTED',
  TIMEOUT: 'TIMEOUT',
  BAD_REQUEST: 'BAD_REQUEST',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  PLATFORM_ERROR: 'PLATFORM_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  POLICY_BLOCKED: 'POLICY_BLOCKED'
});

const RETRYABLE = new Set([
  ErrorCode.RATE_LIMITED,
  ErrorCode.RETRY_EXHAUSTED,
  ErrorCode.TIMEOUT,
  ErrorCode.PLATFORM_ERROR
]);

export class PocError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'PocError';
    this.code = code;
    this.provider = options.provider || null;
    this.status = options.status ?? null;
    this.requestId = options.requestId || null;
    this.retryable = options.retryable ?? RETRYABLE.has(code);
    this.details = options.details || null;
    if (options.cause) this.cause = options.cause;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      provider: this.provider,
      status: this.status,
      requestId: this.requestId,
      retryable: this.retryable,
      details: this.details
    };
  }
}

export function isRetryableStatus(status) {
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

export function classifyHttpError({ provider, status, body, requestId }) {
  const message =
    (body && typeof body === 'object' && (body.error_description || body.message || body.error)) ||
    (typeof body === 'string' && body.slice(0, 300)) ||
    `HTTP ${status}`;

  if (status === 401) {
    return new PocError(ErrorCode.AUTH_EXPIRED, `授权失效：${message}`, { provider, status, requestId });
  }
  if (status === 403) {
    return new PocError(ErrorCode.BLOCKED_PERMISSION, `权限不足：${message}`, { provider, status, requestId });
  }
  if (status === 429) {
    return new PocError(ErrorCode.RATE_LIMITED, `触发限流：${message}`, { provider, status, requestId });
  }
  if (status >= 500) {
    return new PocError(ErrorCode.PLATFORM_ERROR, `平台错误：${message}`, { provider, status, requestId });
  }
  if (status >= 400) {
    return new PocError(ErrorCode.BAD_REQUEST, `请求无效：${message}`, { provider, status, requestId });
  }
  return null;
}

export function blockedCredential(provider, missing) {
  return new PocError(
    ErrorCode.BLOCKED_CREDENTIAL,
    `缺少 ${provider} 凭证：${missing.join(', ')}；真实接口未验证`,
    { provider, retryable: false }
  );
}
