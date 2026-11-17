import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { AyrshareProvider } from '../src/providers/social/ayrshare.js';
import { MemoryIdempotencyStore } from '../src/idempotency.js';
import { ErrorCode } from '../src/errors.js';

async function startServer(handler) {
  const sockets = new Set();
  const server = http.createServer(handler);
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve) => {
        for (const socket of sockets) socket.destroy();
        server.close(resolve);
      })
  };
}

function makeProvider(baseUrl, { timeoutMs = 15_000 } = {}) {
  return new AyrshareProvider({
    mode: 'real',
    config: { ayrshare: { apiKey: 'fixture-key', baseUrl } },
    logger: null,
    timeoutMs
  });
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => resolve(JSON.parse(raw)));
  });
}

test('idempotencyKey 进入真实 POST Body，并与本地幂等区分', async () => {
  const bodies = [];
  const srv = await startServer(async (req, res) => {
    if (req.url === '/api/user' && req.method === 'GET') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ activeSocialAccounts: ['linkedin'] }));
      return;
    }
    if (req.url === '/api/post' && req.method === 'POST') {
      bodies.push(await readBody(req));
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ status: 'success', id: 'post-1', postIds: [{ platform: 'linkedin', id: 'li-1' }] }));
      return;
    }
    res.statusCode = 404;
    res.end('{}');
  });
  try {
    const provider = makeProvider(srv.baseUrl);
    const result = await provider.publish({
      text: 'hello',
      platforms: ['linkedin'],
      profileKey: 'profile-fixture',
      idempotencyKey: 'idem-real-1'
    });

    assert.equal(bodies.length, 1);
    assert.equal(bodies[0].idempotencyKey, 'idem-real-1');
    assert.equal(result.idempotency.key, 'idem-real-1');
    assert.equal(result.idempotency.vendor.field, 'idempotencyKey');
    assert.equal(result.idempotency.vendor.sent, true);
    assert.equal(result.idempotency.vendor.verified, false);
    assert.match(result.idempotency.localStore, /MemoryIdempotencyStore/);
  } finally {
    await srv.close();
  }
});

test('本地幂等：重复调用只产生一次真实 POST，冲突内容被拒绝', async () => {
  let posts = 0;
  const srv = await startServer(async (req, res) => {
    if (req.url === '/api/user' && req.method === 'GET') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ activeSocialAccounts: ['linkedin'] }));
      return;
    }
    if (req.url === '/api/post' && req.method === 'POST') {
      posts += 1;
      await readBody(req);
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ status: 'success', id: `post-${posts}` }));
      return;
    }
    res.statusCode = 404;
    res.end('{}');
  });
  try {
    const provider = makeProvider(srv.baseUrl);
    const store = new MemoryIdempotencyStore();
    const payload = { text: 'same', platforms: ['linkedin'], profileKey: 'profile-fixture', idempotencyKey: 'idem-local-1' };
    const run = () => store.run('idem-local-1', JSON.stringify(payload), () => provider.publish(payload));

    const first = await run();
    const second = await run();
    assert.equal(posts, 1);
    assert.deepEqual(first, second);

    await assert.rejects(
      () => store.run('idem-local-1', JSON.stringify({ ...payload, text: 'different' }), () => provider.publish(payload)),
      (err) => err.code === ErrorCode.IDEMPOTENCY_CONFLICT
    );
    assert.equal(posts, 1);
  } finally {
    await srv.close();
  }
});

test('发布 POST 超时只发送一次，不做无保护重试', async () => {
  let posts = 0;
  const srv = await startServer((req, res) => {
    if (req.url === '/api/user' && req.method === 'GET') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ activeSocialAccounts: ['linkedin'] }));
      return;
    }
    if (req.url === '/api/post' && req.method === 'POST') {
      posts += 1;
      req.resume();
      return; // 永不响应
    }
    res.statusCode = 404;
    res.end('{}');
  });
  try {
    const provider = makeProvider(srv.baseUrl, { timeoutMs: 60 });
    await assert.rejects(
      () => provider.publish({ text: 'timeout', platforms: ['linkedin'], profileKey: 'profile-fixture', idempotencyKey: 'idem-timeout' }),
      (err) => err.code === ErrorCode.RETRY_EXHAUSTED && /超时/.test(err.message)
    );
    assert.equal(posts, 1);
  } finally {
    await srv.close();
  }
});

test('发布 POST 遇到 5xx 默认不重试', async () => {
  let posts = 0;
  const srv = await startServer((req, res) => {
    if (req.url === '/api/user' && req.method === 'GET') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ activeSocialAccounts: ['linkedin'] }));
      return;
    }
    if (req.url === '/api/post' && req.method === 'POST') {
      posts += 1;
      req.resume();
      res.statusCode = 503;
      res.end('unavailable');
      return;
    }
    res.statusCode = 404;
    res.end('{}');
  });
  try {
    const provider = makeProvider(srv.baseUrl);
    await assert.rejects(
      () => provider.publish({ text: 'fail', platforms: ['linkedin'], profileKey: 'profile-fixture' }),
      (err) => err.code === ErrorCode.PLATFORM_ERROR
    );
    assert.equal(posts, 1);
  } finally {
    await srv.close();
  }
});

test('Mock 结果明确标注供应商幂等字段未发送', async () => {
  const provider = new AyrshareProvider({
    mode: 'mock',
    config: { ayrshare: { apiKey: '', baseUrl: '' } },
    logger: null
  });
  const result = await provider.publish({ text: 'mock', platforms: ['linkedin'], idempotencyKey: 'idem-mock' });
  assert.equal(result.idempotency.key, 'idem-mock');
  assert.equal(result.idempotency.vendor.sent, false);
  assert.equal(result.idempotency.vendor.verified, false);
});
