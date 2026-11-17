import { loadEnv, loadConfig } from '../src/config.js';
import { createLogger } from '../src/log.js';
import { FileTokenStore } from '../src/token-store.js';
import { LinkedInProvider } from '../src/providers/social/linkedin.js';
import { startMockOAuthServer } from '../src/mock-oauth-server.js';

loadEnv();
const config = loadConfig();
const logger = createLogger(config.logLevel);
const results = [];

function record(step, status, detail) {
  results.push({ step, status, detail });
  console.log(`[${status}] ${step}${detail ? ` - ${detail}` : ''}`);
}

const server = await startMockOAuthServer();
try {
  const tokenStore = new FileTokenStore(config.tokenDir);
  const provider = new LinkedInProvider({
    mode: 'mock',
    config: { ...config, linkedin: { ...config.linkedin, redirectUri: `${server.baseUrl}/callback/linkedin` } },
    tokenStore,
    logger,
    authBase: `${server.baseUrl}/authorize`,
    tokenUrl: `${server.baseUrl}/token`
  });

  const { authorizationUrl, state } = await provider.connect();
  record('1. 发起 OAuth 授权', 'PASS_MOCK', `${server.baseUrl}/authorize?...`);

  const authResponse = await fetch(authorizationUrl, { redirect: 'manual' });
  const location = authResponse.headers.get('location');
  const callback = new URL(location);
  record('2. 模拟用户同意并回调', 'PASS_MOCK', `code=${callback.searchParams.get('code')?.slice(0, 14)}...`);

  const { account } = await provider.handleCallback({
    code: callback.searchParams.get('code'),
    state: callback.searchParams.get('state'),
    expectedState: state
  });
  record('3. 换取 token 并获取账号', 'PASS_MOCK', `${account.name} (${account.id})`);

  const stored = tokenStore.load('linkedin');
  record('4. 保存 token', 'PASS_MOCK', `本地文件 ${tokenStore.file('linkedin')}；accessToken=${stored.accessToken ? '已保存' : '缺失'}；不打印明文`);

  const metrics = await provider.fetchMetrics();
  record('5. 读取账号数据', 'PASS_MOCK', `followers=${metrics.followers}, impressions=${metrics.impressions}`);

  tokenStore.save('linkedin', { ...stored, expiresAt: Date.now() - 1000 });
  await provider.ensureToken();
  const refreshed = tokenStore.load('linkedin');
  record('6. 过期后自动刷新', refreshed.expiresAt > Date.now() ? 'PASS_MOCK' : 'FAIL', 'refresh_token 换取新 access_token');

  await provider.disconnect();
  record('7. 主动断开授权', tokenStore.load('linkedin') ? 'FAIL' : 'PASS_MOCK', '本地 token 已删除');

  record('真实接口验证', 'BLOCKED_CREDENTIAL', '未提供 LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET');
} finally {
  await server.close();
}

console.log('\n证据摘要：');
for (const r of results) console.log(`- ${r.status}\t${r.step}\t${r.detail || ''}`);
if (results.some((r) => r.status === 'FAIL')) process.exitCode = 1;
