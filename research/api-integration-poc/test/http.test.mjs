import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { request, jsonHeaders } from '../src/http.js';
import { ErrorCode } from '../src/errors.js';

async function startServer(handler) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections?.();
        server.close(resolve);
      })
  };
}

test('成功响应解析 JSON 并返回 requestId', async () => {
  const srv = await startServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, echo: req.headers['x-request-id'], custom: req.headers['x-custom'] }));
  });
  try {
    const res = await request({
      provider: 'test',
      url: `${srv.url}/ok`,
      headers: { 'x-custom': 'yes' },
      retries: 0
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.custom, 'yes');
    assert.equal(res.body.echo, res.requestId);
    assert.match(res.requestId, /^[0-9a-f-]{36}$/);
  } finally {
    await srv.close();
  }
});

test('非 JSON 响应保留原始文本', async () => {
  const srv = await startServer((req, res) => res.end('plain-text'));
  try {
    const res = await request({ provider: 'test', url: srv.url, retries: 0 });
    assert.equal(res.body, 'plain-text');
  } finally {
    await srv.close();
  }
});

test('400 不重试并抛出 BAD_REQUEST', async () => {
  let calls = 0;
  const srv = await startServer((req, res) => {
    calls += 1;
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'invalid payload' }));
  });
  try {
    await assert.rejects(
      () => request({ provider: 'test', url: srv.url, retries: 2, retryBaseMs: 5 }),
      (err) => err.code === ErrorCode.BAD_REQUEST && err.retryable === false
    );
    assert.equal(calls, 1);
  } finally {
    await srv.close();
  }
});

test('429 按 Retry-After 重试后成功', async () => {
  let calls = 0;
  const srv = await startServer((req, res) => {
    calls += 1;
    if (calls === 1) {
      res.statusCode = 429;
      res.setHeader('retry-after', '0');
      res.end(JSON.stringify({ message: 'slow down' }));
      return;
    }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
  });
  try {
    const res = await request({ provider: 'test', url: srv.url, retryBaseMs: 5 });
    assert.equal(res.status, 200);
    assert.equal(calls, 2);
  } finally {
    await srv.close();
  }
});

test('5xx 重试两次后成功', async () => {
  let calls = 0;
  const srv = await startServer((req, res) => {
    calls += 1;
    if (calls < 3) {
      res.statusCode = 503;
      res.end('unavailable');
      return;
    }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, calls }));
  });
  try {
    const res = await request({ provider: 'test', url: srv.url, retries: 2, retryBaseMs: 5 });
    assert.equal(res.body.ok, true);
    assert.equal(calls, 3);
  } finally {
    await srv.close();
  }
});

test('401 映射为 AUTH_EXPIRED 且不重试', async () => {
  const srv = await startServer((req, res) => {
    res.statusCode = 401;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ message: 'token expired' }));
  });
  try {
    await assert.rejects(
      () => request({ provider: 'test', url: srv.url, retries: 1, retryBaseMs: 5 }),
      (err) => err.code === ErrorCode.AUTH_EXPIRED && /token expired/.test(err.message)
    );
  } finally {
    await srv.close();
  }
});

test('超时触发重试并在耗尽后抛 RETRY_EXHAUSTED', async () => {
  const srv = await startServer((req, res) => {
    setTimeout(() => {
      if (!res.writableEnded) res.end('late');
    }, 300);
  });
  try {
    await assert.rejects(
      () => request({ provider: 'test', url: srv.url, timeoutMs: 50, retries: 1, retryBaseMs: 5 }),
      (err) => err.code === ErrorCode.RETRY_EXHAUSTED && /请求超时/.test(err.message)
    );
  } finally {
    await srv.close();
  }
});

test('连接失败归为网络错误并耗尽重试', async () => {
  await assert.rejects(
    () => request({ provider: 'test', url: 'http://127.0.0.1:1/never', timeoutMs: 500, retries: 0, retryBaseMs: 5 }),
    (err) => err.code === ErrorCode.RETRY_EXHAUSTED && /网络错误/.test(err.message)
  );
});

test('POST 默认不自动重试（防止发布重复）', async () => {
  let calls = 0;
  const srv = await startServer((req, res) => {
    calls += 1;
    req.resume();
    res.statusCode = 503;
    res.end('unavailable');
  });
  try {
    await assert.rejects(
      () => request({ provider: 'test', url: srv.url, method: 'POST', body: 'x', retries: 3, retryBaseMs: 5 }),
      (err) => err.code === ErrorCode.PLATFORM_ERROR
    );
    assert.equal(calls, 1);
  } finally {
    await srv.close();
  }
});

test('只读 POST 显式声明后可重试', async () => {
  let calls = 0;
  const srv = await startServer((req, res) => {
    calls += 1;
    req.resume();
    if (calls === 1) {
      res.statusCode = 503;
      res.end('unavailable');
      return;
    }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
  });
  try {
    const res = await request({
      provider: 'test',
      url: srv.url,
      method: 'POST',
      body: '{}',
      retries: 1,
      retryBaseMs: 5,
      retryNonIdempotent: true
    });
    assert.equal(res.body.ok, true);
    assert.equal(calls, 2);
  } finally {
    await srv.close();
  }
});

test('jsonHeaders 返回 JSON 请求头', () => {
  assert.deepEqual(jsonHeaders({ 'x-a': '1' }), {
    'content-type': 'application/json',
    accept: 'application/json',
    'x-a': '1'
  });
});
