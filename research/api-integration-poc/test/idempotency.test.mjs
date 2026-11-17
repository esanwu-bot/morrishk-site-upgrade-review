import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryIdempotencyStore } from '../src/idempotency.js';
import { ErrorCode } from '../src/errors.js';

test('相同幂等键与指纹只执行一次并返回缓存结果', async () => {
  const store = new MemoryIdempotencyStore();
  let calls = 0;
  const fn = async () => {
    calls += 1;
    return { id: `post-${calls}` };
  };
  const first = await store.run('k1', 'same-content', fn);
  const second = await store.run('k1', 'same-content', fn);
  assert.equal(calls, 1);
  assert.deepEqual(first, second);
  assert.equal(second.id, 'post-1');
});

test('相同幂等键不同内容被拒绝', async () => {
  const store = new MemoryIdempotencyStore();
  await store.run('k2', 'content-a', async () => ({ id: 'a' }));
  await assert.rejects(
    () => store.run('k2', 'content-b', async () => ({ id: 'b' })),
    (err) => err.code === ErrorCode.IDEMPOTENCY_CONFLICT
  );
});

test('并发请求共享同一个 in-flight Promise', async () => {
  const store = new MemoryIdempotencyStore();
  let calls = 0;
  const fn = () => {
    calls += 1;
    return new Promise((resolve) => setTimeout(() => resolve({ id: 'slow' }), 30));
  };
  const [a, b] = await Promise.all([
    store.run('k3', 'fp', fn),
    store.run('k3', 'fp', fn)
  ]);
  assert.equal(calls, 1);
  assert.deepEqual(a, b);
});

test('失败不缓存，重试会重新执行', async () => {
  const store = new MemoryIdempotencyStore();
  let calls = 0;
  const failing = async () => {
    calls += 1;
    throw new Error('platform down');
  };
  await assert.rejects(() => store.run('k4', 'fp', failing), /platform down/);
  await assert.rejects(() => store.run('k4', 'fp', failing), /platform down/);
  assert.equal(calls, 2);
});

test('空幂等键直接执行且不记录', async () => {
  const store = new MemoryIdempotencyStore();
  const result = await store.run('', 'fp', async () => 'ok');
  assert.equal(result, 'ok');
  assert.equal(store.entries.size, 0);
});

test('超过 TTL 后允许重新执行', async () => {
  let now = 1000;
  const store = new MemoryIdempotencyStore({ ttlMs: 100, now: () => now });
  let calls = 0;
  await store.run('k5', 'fp', async () => (calls += 1));
  now += 200;
  await store.run('k5', 'fp', async () => (calls += 1));
  assert.equal(calls, 2);
});
