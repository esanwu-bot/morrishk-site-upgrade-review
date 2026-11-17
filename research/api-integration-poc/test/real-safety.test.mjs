import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// 必须用异步 spawn：spawnSync 会阻塞事件循环，本地 Mock Server 无法响应子进程请求。
function runDemo(script, { env = {}, args = [] } = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(root, 'demo', script), ...args], {
      cwd: root,
      env: { ...process.env, ...env }
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill(), 30_000);
    child.stdout.on('data', (data) => (stdout += data));
    child.stderr.on('data', (data) => (stderr += data));
    child.on('close', (status) => {
      clearTimeout(timer);
      resolve({ status, stdout, stderr });
    });
  });
}

async function startCountingServer(handler) {
  const requests = [];
  const server = http.createServer((req, res) => {
    requests.push({ method: req.method, path: req.url, headers: req.headers });
    res.setHeader('content-type', 'application/json');
    handler(req, res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    requests,
    publishRequests: () =>
      requests.filter(
        (r) => r.method === 'POST' && (r.path.startsWith('/api/post') || r.path.startsWith('/rest/posts'))
      ).length,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections?.();
        server.close(resolve);
      })
  };
}

const realEnv = (baseUrl, allowlist) => ({
  POC_MODE: 'real',
  ALLOW_REAL_PUBLISH: 'true',
  PUBLISH_TARGET_ALLOWLIST: allowlist,
  AYRSHARE_BASE_URL: baseUrl,
  AYRSHARE_API_KEY: 'fixture-key',
  LINKEDIN_API_BASE: baseUrl,
  LINKEDIN_API_VERSION: '202610',
  LINKEDIN_CLIENT_ID: 'fixture-client',
  LINKEDIN_CLIENT_SECRET: 'fixture-secret',
  LINKEDIN_REDIRECT_URI: `${baseUrl}/callback/linkedin`
});

test('Demo 02 Mock 只输出 PASS_MOCK，不出现 PASS_REAL_API', async () => {
  const res = await runDemo('02-social-publish.mjs', {
    env: { POC_MODE: 'mock', ALLOW_REAL_PUBLISH: '', PUBLISH_TARGET_ALLOWLIST: '' }
  });
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /PASS_MOCK/);
  assert.ok(!res.stdout.includes('PASS_REAL_API'));
  assert.match(res.stdout, /POLICY_BLOCKED/);
});

test('Demo 02 Real 不传任何目标参数：拒绝且真实发布请求为 0', async () => {
  const srv = await startCountingServer((req, res) => res.end('{}'));
  try {
    const res = await runDemo('02-social-publish.mjs', {
      env: realEnv(srv.baseUrl, 'ayrshare:linkedin:profile-abc'),
      args: ['--confirm-publish']
    });
    assert.equal(res.status, 0, res.stderr);
    assert.match(res.stdout, /POLICY_BLOCKED/);
    assert.match(res.stdout, /--provider/);
    assert.ok(!res.stdout.includes('PASS_REAL_API'));
    assert.equal(srv.publishRequests(), 0);
    assert.equal(srv.requests.length, 0);
  } finally {
    await srv.close();
  }
});

test('Demo 02 Real 只传部分参数：拒绝且真实发布请求为 0', async () => {
  const srv = await startCountingServer((req, res) => res.end('{}'));
  try {
    const res = await runDemo('02-social-publish.mjs', {
      env: realEnv(srv.baseUrl, 'ayrshare:linkedin:profile-abc'),
      args: ['--provider', 'ayrshare', '--confirm-publish']
    });
    assert.equal(res.status, 0, res.stderr);
    assert.match(res.stdout, /POLICY_BLOCKED/);
    assert.match(res.stdout, /--platform/);
    assert.match(res.stdout, /--account/);
    assert.equal(srv.publishRequests(), 0);
    assert.equal(srv.requests.length, 0);
  } finally {
    await srv.close();
  }
});

test('Demo 02 Real 显式传 account=default：拒绝且真实发布请求为 0', async () => {
  const srv = await startCountingServer((req, res) => res.end('{}'));
  try {
    const res = await runDemo('02-social-publish.mjs', {
      env: realEnv(srv.baseUrl, 'ayrshare:linkedin:default'),
      args: ['--provider=ayrshare', '--platform=linkedin', '--account=default', '--confirm-publish']
    });
    assert.equal(res.status, 0, res.stderr);
    assert.match(res.stdout, /POLICY_BLOCKED/);
    assert.match(res.stdout, /占位值/);
    assert.ok(!res.stdout.includes('PASS_REAL_API'));
    assert.equal(srv.publishRequests(), 0);
    assert.equal(srv.requests.length, 0);
  } finally {
    await srv.close();
  }
});

test('Demo 02 Real 白名单与最终 LinkedIn 目标不匹配：拒绝且真实发布请求为 0', async () => {
  const srv = await startCountingServer((req, res) => res.end('{}'));
  try {
    const res = await runDemo('02-social-publish.mjs', {
      env: realEnv(srv.baseUrl, 'linkedin:linkedin:2002'),
      args: ['--provider=linkedin', '--platform=linkedin', '--account=1001', '--confirm-publish']
    });
    assert.equal(res.status, 0, res.stderr);
    assert.match(res.stdout, /POLICY_BLOCKED/);
    assert.match(res.stdout, /不在白名单/);
    assert.equal(srv.publishRequests(), 0);
    assert.equal(srv.requests.length, 0);
  } finally {
    await srv.close();
  }
});

test('Demo 02 Real Ayrshare 无法解析唯一 Profile：拒绝且真实发布请求为 0', async () => {
  const srv = await startCountingServer((req, res) => {
    res.end('{}');
  });
  try {
    const res = await runDemo('02-social-publish.mjs', {
      env: realEnv(srv.baseUrl, 'ayrshare:linkedin:profile-abc'),
      args: ['--provider', 'ayrshare', '--platform', 'linkedin', '--account', 'profile-abc', '--confirm-publish']
    });
    assert.equal(res.status, 0, res.stderr);
    assert.match(res.stdout, /BLOCKED_PERMISSION/);
    assert.match(res.stdout, /无法从 \/api\/user 确认/);
    assert.ok(!res.stdout.includes('PASS_REAL_API'));
    assert.equal(srv.publishRequests(), 0);
    // 预检请求确实到达 Mock Server，说明计数有效（非 0 请求被观测到）
    assert.equal(srv.requests.filter((r) => r.method === 'GET' && r.path.startsWith('/api/user')).length, 1);
  } finally {
    await srv.close();
  }
});

test('Demo 05 Real 未确认时 MP 写入被拒绝', async () => {
  const res = await runDemo('05-ga4-measurement-protocol.mjs', {
    env: { POC_MODE: 'real', ALLOW_REAL_MP: 'true' }
  });
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /POLICY_BLOCKED/);
  assert.match(res.stdout, /confirm-mp/);
  assert.ok(!res.stdout.includes('PASS_REAL_API'));
  assert.ok(!res.stdout.includes('PASS_MOCK'));
});
