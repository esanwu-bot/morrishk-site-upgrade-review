import fs from 'node:fs';
import path from 'node:path';

function parseEnv(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function loadEnv(cwd = process.cwd(), envFile = '.env') {
  const file = path.resolve(cwd, envFile);
  if (!fs.existsSync(file)) return {};
  const parsed = parseEnv(fs.readFileSync(file, 'utf8'));
  for (const [k, v] of Object.entries(parsed)) {
    if (process.env[k] === undefined) process.env[k] = v;
  }
  return parsed;
}

export function loadConfig(overrides = {}) {
  const mode = (overrides.mode || process.env.POC_MODE || 'mock').toLowerCase();
  if (!['mock', 'real'].includes(mode)) {
    throw new Error(`POC_MODE 必须是 mock 或 real，当前为 ${mode}`);
  }
  return {
    mode,
    allowRealPublish: String(process.env.ALLOW_REAL_PUBLISH || 'false') === 'true',
    logLevel: process.env.LOG_LEVEL || 'info',
    tokenDir: path.resolve(process.env.POC_TOKEN_DIR || './.tokens'),
    ayrshare: {
      apiKey: process.env.AYRSHARE_API_KEY || '',
      baseUrl: process.env.AYRSHARE_BASE_URL || 'https://api.ayrshare.com'
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      redirectUri: process.env.LINKEDIN_REDIRECT_URI || 'http://127.0.0.1:8787/callback/linkedin'
    },
    mux: {
      tokenId: process.env.MUX_TOKEN_ID || '',
      tokenSecret: process.env.MUX_TOKEN_SECRET || ''
    },
    ga4: {
      credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
      accessToken: process.env.GOOGLE_ACCESS_TOKEN || '',
      propertyId: process.env.GA4_PROPERTY_ID || '',
      measurementId: process.env.GA4_MEASUREMENT_ID || '',
      apiSecret: process.env.GA4_API_SECRET || ''
    },
    ...overrides
  };
}

export function requireValue(value, name) {
  if (!value) {
    const err = new Error(`缺少配置：${name}`);
    err.code = 'CONFIG_MISSING';
    throw err;
  }
  return value;
}
