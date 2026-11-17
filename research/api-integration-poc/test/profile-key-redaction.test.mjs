import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SECRET = 'TEST_PROFILE_SECRET_123';

// 异步 spawn：spawnSync 会阻塞事件循环，本地 Mock Server 无法响应子进程请求。
function runNode(args, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
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

function runDemo(args, env) {
  return runNode([path.join(root, 'demo', '02-social-publish.mjs'), ...args], env);
}

function runPublishFixture(env) {
  return runNode([path.join(root, 'demo', 'fixtures', 'publish-ayrshare-once.mjs')], env);
}

async function startServer(handler) {
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
    count: (method, prefix) =>
      requests.filter((r) => r.method === method && r.path.startsWith(prefix)).length,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections?.();
        server.close(resolve);
      })
  };
}

function realEnv(baseUrl, allowlist) {
  return {
    POC_MODE: 'real',
    ALLOW_REAL_PUBLISH: 'true',
    PUBLISH_TARGET_ALLOWLIST: allowlist,
    AYRSHARE_BASE_URL: baseUrl,
    AYRSHARE_API_KEY: 'fixture-key'
  };
}

function assertNoSecret(res) {
  assert.ok(!res.stdout.includes(SECRET), `stdout 泄露完整 Profile-Key：${res.stdout}`);
  assert.ok(!res.stderr.includes(SECRET), `stderr 泄露完整 Profile-Key：${res.stderr}`);
}

function assertHeader(requests, method, prefix) {
  const matched = requests.filter((r) => r.method === method && r.path.startsWith(prefix));
  assert.ok(matched.length > 0, `${method} ${prefix} 未发出请求`);
  for (const req of matched) {
    assert.equal(req.headers['profile-key'], SECRET, '请求头必须携带真实 Profile-Key');
  }
}

test('Ayrshare 真实发布成功路径：stdout/stderr 无完整 Profile-Key，请求头保留真实值', async () => {
  const srv = await startServer((req, res) => {
    if (req.method === 'GET' && req.url.startsWith('/api/user')) {
      res.end(JSON.stringify({ activeSocialAccounts: ['linkedin'] }));
      return;
    }
    if (req.method === 'POST' && req.url.startsWith('/api/post')) {
      res.end(JSON.stringify({ id: 'fixture-post-1', status: 'PUBLISHED' }));
      return;
    }
    res.statusCode = 404;
    res.end('{}');
  });
  try {
    const res = await runPublishFixture({
      AYRSHARE_BASE_URL: srv.baseUrl,
      TEST_PROFILE_KEY: SECRET
    });
    assert.equal(res.status, 0, res.stderr);
    assertNoSecret(res);
    assert.match(res.stdout, /"profileKey":"\*\*\*"/);
    assert.match(res.stdout, /"target":\{"profileKey":"\*\*\*","platform":"linkedin"\}/);
    assert.equal(res.stdout.includes('PASS_REAL_API'), false, 'Mock Server 结果不得标记为 PASS_REAL_API');

    assert.equal(srv.count('GET', '/api/user'), 1);
    assert.equal(srv.count('POST', '/api/post'), 1);
    assert.equal(srv.requests.length, 2);
    assertHeader(srv.requests, 'GET', '/api/user');
    assertHeader(srv.requests, 'POST', '/api/post');
  } finally {
    await srv.close();
  }
});

test('Profile 预检失败路径：拒绝发布，错误输出已脱敏，预检请求头保留真实值', async () => {
  const srv = await startServer((req, res) => res.end('{}'));
  try {
    const res = await runDemo(
      [
        '--provider=ayrshare',
        '--platform=linkedin',
        `--account=${SECRET}`,
        '--confirm-publish'
      ],
      realEnv(srv.baseUrl, `ayrshare:linkedin:${SECRET}`)
    );
    assert.equal(res.status, 0, res.stderr);
    assertNoSecret(res);
    assert.match(res.stdout, /BLOCKED_PERMISSION/);
    assert.match(res.stdout, /无法从 \/api\/user 确认/);
    assert.ok(res.stdout.includes('***'));

    assert.equal(srv.count('GET', '/api/user'), 1);
    assert.equal(srv.count('POST', '/api/post'), 0);
    assertHeader(srv.requests, 'GET', '/api/user');
  } finally {
    await srv.close();
  }
});

test('白名单不匹配路径：拒绝发布，目标与白名单均脱敏，0 请求', async () => {
  const srv = await startServer((req, res) => res.end('{}'));
  try {
    const res = await runDemo(
      [
        '--provider=ayrshare',
        '--platform=linkedin',
        `--account=${SECRET}`,
        '--confirm-publish'
      ],
      realEnv(srv.baseUrl, 'ayrshare:linkedin:OTHER_ACCOUNT')
    );
    assert.equal(res.status, 0, res.stderr);
    assertNoSecret(res);
    assert.match(res.stdout, /POLICY_BLOCKED/);
    assert.match(res.stdout, /不在白名单/);
    assert.ok(res.stdout.includes('ayrshare:linkedin:***'));
    // 白名单校验先于任何请求；0 请求意味着不存在携带错误 Profile-Key 的请求头
    assert.equal(srv.requests.length, 0);
  } finally {
    await srv.close();
  }
});

test('目标绑定错误路径：拼接目标被脱敏，0 请求', async () => {
  const srv = await startServer((req, res) => res.end('{}'));
  try {
    const res = await runDemo(
      [
        '--provider=ayrshare',
        '--platform=linkedin',
        `--account=${SECRET}:extra`,
        '--confirm-publish'
      ],
      realEnv(srv.baseUrl, `ayrshare:linkedin:${SECRET}:extra`)
    );
    assert.equal(res.status, 0, res.stderr);
    assertNoSecret(res);
    assert.match(res.stdout, /POLICY_BLOCKED/);
    assert.match(res.stdout, /格式/);
    assert.ok(res.stdout.includes('***'));
    assert.equal(srv.requests.length, 0);
  } finally {
    await srv.close();
  }
});

test('Profile 未关联目标平台：错误消息不含完整 Profile-Key，0 发布请求', async () => {
  const srv = await startServer((req, res) => {
    res.end(JSON.stringify({ activeSocialAccounts: ['facebook'] }));
  });
  try {
    const res = await runDemo(
      [
        '--provider=ayrshare',
        '--platform=linkedin',
        `--account=${SECRET}`,
        '--confirm-publish'
      ],
      realEnv(srv.baseUrl, `ayrshare:linkedin:${SECRET}`)
    );
    assert.equal(res.status, 0, res.stderr);
    assertNoSecret(res);
    assert.match(res.stdout, /BLOCKED_PERMISSION/);
    assert.match(res.stdout, /未关联平台 linkedin/);
    assert.equal(srv.count('POST', '/api/post'), 0);
    assertHeader(srv.requests, 'GET', '/api/user');
  } finally {
    await srv.close();
  }
});

test('同一 Profile 在目标平台多账号：错误消息不含完整 Profile-Key，0 发布请求', async () => {
  const srv = await startServer((req, res) => {
    res.end(JSON.stringify({ activeSocialAccounts: ['linkedin', 'linkedin'] }));
  });
  try {
    const res = await runDemo(
      [
        '--provider=ayrshare',
        '--platform=linkedin',
        `--account=${SECRET}`,
        '--confirm-publish'
      ],
      realEnv(srv.baseUrl, `ayrshare:linkedin:${SECRET}`)
    );
    assert.equal(res.status, 0, res.stderr);
    assertNoSecret(res);
    assert.match(res.stdout, /BLOCKED_PERMISSION/);
    assert.match(res.stdout, /无法确认唯一目标/);
    assert.equal(srv.count('POST', '/api/post'), 0);
    assertHeader(srv.requests, 'GET', '/api/user');
  } finally {
    await srv.close();
  }
});
