import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { AyrshareProvider } from '../src/providers/social/ayrshare.js';

async function startServer(handler) {
  const requests = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      requests.push({ method: req.method, path: req.url, headers: req.headers, body: raw });
      handler(req, res, requests);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    requests,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections?.();
        server.close(resolve);
      })
  };
}

function makeProvider(baseUrl) {
  return new AyrshareProvider({
    mode: 'real',
    config: { ayrshare: { apiKey: 'fixture-key', baseUrl } },
    logger: null,
    timeoutMs: 5_000
  });
}

function postCount(requests) {
  return requests.filter((r) => r.method === 'POST' && r.path.startsWith('/api/post')).length;
}

function byPath(requests, method, path) {
  return requests.filter((r) => r.method === method && r.path.startsWith(path));
}

test('缺少 Profile Key 时拒绝，且不发出任何请求', async () => {
  const srv = await startServer((req, res) => {
    res.statusCode = 500;
    res.end('{}');
  });
  try {
    await assert.rejects(
      () => makeProvider(srv.baseUrl).publish({ text: 'x', platforms: ['linkedin'] }),
      (err) => err.code === 'POLICY_BLOCKED' && /Profile Key/.test(err.message)
    );
    assert.equal(srv.requests.length, 0);
  } finally {
    await srv.close();
  }
});

test('Profile Key 为占位值时拒绝，且不发出任何请求', async () => {
  const srv = await startServer((req, res) => {
    res.statusCode = 500;
    res.end('{}');
  });
  try {
    for (const profileKey of ['default', 'all', '*', 'any', 'profile']) {
      await assert.rejects(
        () => makeProvider(srv.baseUrl).publish({ text: 'x', platforms: ['linkedin'], profileKey }),
        (err) => err.code === 'POLICY_BLOCKED' && /占位值/.test(err.message),
        profileKey
      );
    }
    assert.equal(srv.requests.length, 0);
  } finally {
    await srv.close();
  }
});

test('多平台不能替代账号身份，拒绝且不发出任何请求', async () => {
  const srv = await startServer((req, res) => {
    res.statusCode = 500;
    res.end('{}');
  });
  try {
    await assert.rejects(
      () => makeProvider(srv.baseUrl).publish({ text: 'x', platforms: ['linkedin', 'facebook'], profileKey: 'profile-abc' }),
      (err) => err.code === 'POLICY_BLOCKED' && /一个平台/.test(err.message)
    );
    assert.equal(srv.requests.length, 0);
  } finally {
    await srv.close();
  }
});

test('/api/user 无法确认已关联平台时拒绝，且不发送 POST /api/post', async () => {
  const srv = await startServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end('{}');
  });
  try {
    await assert.rejects(
      () => makeProvider(srv.baseUrl).publish({ text: 'x', platforms: ['linkedin'], profileKey: 'profile-abc' }),
      (err) => err.code === 'BLOCKED_PERMISSION' && /无法从 \/api\/user 确认/.test(err.message)
    );
    const preflight = byPath(srv.requests, 'GET', '/api/user');
    assert.equal(preflight.length, 1);
    assert.equal(preflight[0].headers['profile-key'], 'profile-abc');
    assert.equal(postCount(srv.requests), 0);
  } finally {
    await srv.close();
  }
});

test('Profile 未关联目标平台时拒绝，且不发送 POST /api/post', async () => {
  const srv = await startServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ activeSocialAccounts: ['facebook'] }));
  });
  try {
    await assert.rejects(
      () => makeProvider(srv.baseUrl).publish({ text: 'x', platforms: ['linkedin'], profileKey: 'profile-abc' }),
      (err) => err.code === 'BLOCKED_PERMISSION' && /未关联平台 linkedin/.test(err.message)
    );
    assert.equal(postCount(srv.requests), 0);
  } finally {
    await srv.close();
  }
});

test('同一 Profile 在目标平台存在多个账号时拒绝，且不发送 POST /api/post', async () => {
  const srv = await startServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ activeSocialAccounts: ['linkedin', 'linkedin'] }));
  });
  try {
    await assert.rejects(
      () => makeProvider(srv.baseUrl).publish({ text: 'x', platforms: ['linkedin'], profileKey: 'profile-abc' }),
      (err) => err.code === 'BLOCKED_PERMISSION' && /无法确认唯一目标/.test(err.message)
    );
    assert.equal(postCount(srv.requests), 0);
  } finally {
    await srv.close();
  }
});

test('Profile 与平台一致时，POST 携带 Profile-Key 并返回绑定目标（本地 fixture）', async () => {
  const srv = await startServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.method === 'GET' && req.url.startsWith('/api/user')) {
      res.end(JSON.stringify({ activeSocialAccounts: [{ platform: 'linkedin' }, { platform: 'facebook' }] }));
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
    const result = await makeProvider(srv.baseUrl).publish({
      text: 'fixture post',
      platforms: ['linkedin'],
      profileKey: 'profile-abc',
      idempotencyKey: 'fixture-idem-1'
    });
    assert.equal(result.id, 'fixture-post-1');
    assert.equal(result.profileKey, 'profile-abc');
    assert.deepEqual(result.target, { profileKey: 'profile-abc', platform: 'linkedin' });
    assert.equal(result.preflight.verified, true);
    assert.deepEqual(result.preflight.platforms, ['linkedin', 'facebook']);

    const posts = byPath(srv.requests, 'POST', '/api/post');
    assert.equal(posts.length, 1);
    assert.equal(posts[0].headers['profile-key'], 'profile-abc');
    const body = JSON.parse(posts[0].body);
    assert.deepEqual(body.platforms, ['linkedin']);
    assert.equal(body.idempotencyKey, 'fixture-idem-1');
    assert.equal(result.idempotency.vendor.sent, true);
    assert.equal(result.idempotency.vendor.verified, false);
  } finally {
    await srv.close();
  }
});
