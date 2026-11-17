const SECRET_KEY = /(token|secret|password|authorization|cookie|api[-_]?key|client[-_]?id)/i;
const BEARER = /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/g;
const JWT = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const LONG_HEX = /\b[a-f0-9]{32,}\b/gi;

export function redactString(value) {
  if (typeof value !== 'string') return value;
  return value.replace(BEARER, '$1 ***').replace(JWT, '***').replace(LONG_HEX, '***');
}

export function redact(value, depth = 0) {
  if (depth > 6) return '[TRUNCATED]';
  if (value == null) return value;
  if (typeof value === 'string') return redactString(value);
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = SECRET_KEY.test(k) ? '***' : redact(v, depth + 1);
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
