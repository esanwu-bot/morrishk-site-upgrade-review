const SECRET_KEY = /(token|secret|password|authorization|cookie|api[-_]?key|client[-_]?id|profile[-_]?key)/i;
const TARGET_KEY = /^(target|targets)$/i;
const ALLOWLIST_KEY = /allow[-_]?list$/i;
const BEARER = /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/g;
const JWT = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const LONG_HEX = /\b[a-f0-9]{32,}\b/gi;
const PROFILE_KEY_HEADER = /\b(profile[-_]?key)\s*[:=]\s*["']?[^"',;\s}]+/gi;

export function redactString(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(BEARER, '$1 ***')
    .replace(PROFILE_KEY_HEADER, '$1: ***')
    .replace(JWT, '***')
    .replace(LONG_HEX, '***');
}

// Profile-Key 是代表 User Profile 的凭据：允许展示「已脱敏」标识，禁止回显原值。
export function maskProfileKey(value) {
  if (value == null) return value;
  const key = String(value);
  return key ? '***' : key;
}

// target 形如 provider:platform:account；account 可能是 Profile-Key，统一遮蔽。
export function maskTarget(value) {
  if (typeof value !== 'string') return value;
  const parts = value.split(':');
  if (parts.length !== 3 || parts.some((part) => !part)) return '***';
  return `${parts[0]}:${parts[1]}:***`;
}

// 已知敏感原值的兜底替换，用于异常消息等无法按字段名识别的字符串。
export function redactSecrets(value, secrets = []) {
  if (typeof value !== 'string') return value;
  const known = [...new Set(secrets)]
    .filter((secret) => typeof secret === 'string' && secret)
    .sort((a, b) => b.length - a.length);
  let out = value;
  for (const secret of known) out = out.split(secret).join('***');
  return out;
}

export function redact(value, depth = 0) {
  if (depth > 6) return '[TRUNCATED]';
  if (value == null) return value;
  if (typeof value === 'string') return redactString(value);
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (SECRET_KEY.test(k)) out[k] = '***';
    else if (TARGET_KEY.test(k)) out[k] = Array.isArray(v) ? v.map(maskTarget) : maskTarget(v);
    else if (ALLOWLIST_KEY.test(k)) out[k] = Array.isArray(v) ? v.map(maskTarget) : maskTarget(v);
    else out[k] = redact(v, depth + 1);
  }
  return out;
}

export function redactUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    for (const key of [...url.searchParams.keys()]) {
      if (SECRET_KEY.test(key)) url.searchParams.set(key, '***');
    }
    return url.toString();
  } catch {
    return redactString(rawUrl);
  }
}
