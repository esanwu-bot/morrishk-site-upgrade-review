import test from 'node:test';
import assert from 'node:assert/strict';
import { assertPublishAllowed } from '../src/publish-guard.js';
import { ErrorCode } from '../src/errors.js';

test('mock 模式始终允许，且不视为真实发布', () => {
  assert.deepEqual(assertPublishAllowed({ mode: 'mock', allowRealPublish: false }), { allowed: true, real: false });
  assert.deepEqual(assertPublishAllowed({ mode: 'mock', allowRealPublish: true }, { confirmPublish: true }), {
    allowed: true,
    real: false
  });
});

test('真实模式默认拒绝：总开关关闭', async () => {
  await assert.rejects(
    async () => assertPublishAllowed({ mode: 'real', allowRealPublish: false }, { confirmPublish: true }),
    (err) => err.code === ErrorCode.POLICY_BLOCKED && /ALLOW_REAL_PUBLISH/.test(err.message)
  );
});

test('真实模式缺少人工确认参数时拒绝', async () => {
  await assert.rejects(
    async () => assertPublishAllowed({ mode: 'real', allowRealPublish: true }, { confirmPublish: false }),
    (err) => err.code === ErrorCode.POLICY_BLOCKED && /confirm-publish/.test(err.message)
  );
});

test('真实模式双开关同时满足才放行', () => {
  assert.deepEqual(assertPublishAllowed({ mode: 'real', allowRealPublish: true }, { confirmPublish: true }), {
    allowed: true,
    real: true
  });
});
