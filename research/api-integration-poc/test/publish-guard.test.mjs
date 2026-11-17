import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertPublishAllowed,
  assertMpWriteAllowed,
  statusLabel
} from '../src/publish-guard.js';
import { ErrorCode } from '../src/errors.js';

const allowedConfig = {
  mode: 'real',
  allowRealPublish: true,
  allowRealMp: true,
  publishAllowlist: ['ayrshare:linkedin:page-1']
};

test('mock 模式始终允许，且不视为真实发布', () => {
  assert.deepEqual(assertPublishAllowed({ mode: 'mock', allowRealPublish: false }), { allowed: true, real: false });
  assert.deepEqual(assertPublishAllowed({ mode: 'mock', allowRealPublish: true }), { allowed: true, real: false });
});

test('真实模式默认拒绝：总开关关闭', async () => {
  await assert.rejects(
    async () => assertPublishAllowed({ ...allowedConfig, allowRealPublish: false }, { confirmPublish: true, targets: ['ayrshare:linkedin:page-1'] }),
    (err) => err.code === ErrorCode.POLICY_BLOCKED && /ALLOW_REAL_PUBLISH/.test(err.message)
  );
});

test('真实模式缺少人工确认参数时拒绝', async () => {
  await assert.rejects(
    async () => assertPublishAllowed(allowedConfig, { confirmPublish: false, targets: ['ayrshare:linkedin:page-1'] }),
    (err) => err.code === ErrorCode.POLICY_BLOCKED && /confirm-publish/.test(err.message)
  );
});

test('真实模式未配置目标白名单时拒绝', async () => {
  await assert.rejects(
    async () => assertPublishAllowed({ ...allowedConfig, publishAllowlist: [] }, { confirmPublish: true, targets: ['ayrshare:linkedin:page-1'] }),
    (err) => err.code === ErrorCode.POLICY_BLOCKED && /ALLOWLIST/.test(err.message)
  );
});

test('真实模式未指定目标时拒绝（禁止默认多平台）', async () => {
  await assert.rejects(
    async () => assertPublishAllowed(allowedConfig, { confirmPublish: true, targets: [] }),
    (err) => err.code === ErrorCode.POLICY_BLOCKED && /指定目标/.test(err.message)
  );
});

test('目标不在白名单时拒绝并回显目标', async () => {
  await assert.rejects(
    async () => assertPublishAllowed(allowedConfig, { confirmPublish: true, targets: ['ayrshare:facebook:other-page'] }),
    (err) =>
      err.code === ErrorCode.POLICY_BLOCKED &&
      /不在白名单/.test(err.message) &&
      err.details.targets[0] === 'ayrshare:facebook:other-page'
  );
});

test('白名单目标 + 双开关同时满足才放行', () => {
  assert.deepEqual(assertPublishAllowed(allowedConfig, { confirmPublish: true, targets: ['ayrshare:linkedin:page-1'] }), {
    allowed: true,
    real: true,
    targets: ['ayrshare:linkedin:page-1']
  });
});

test('MP 真实写入有独立开关，不继承发布授权', async () => {
  assert.deepEqual(assertMpWriteAllowed({ mode: 'mock' }), { allowed: true, real: false });
  await assert.rejects(
    async () => assertMpWriteAllowed({ mode: 'real', allowRealMp: false }, { confirmMp: true }),
    (err) => err.code === ErrorCode.POLICY_BLOCKED && /ALLOW_REAL_MP/.test(err.message)
  );
  await assert.rejects(
    async () => assertMpWriteAllowed({ mode: 'real', allowRealMp: true }, { confirmMp: false }),
    (err) => err.code === ErrorCode.POLICY_BLOCKED && /confirm-mp/.test(err.message)
  );
  assert.deepEqual(assertMpWriteAllowed({ mode: 'real', allowRealMp: true }, { confirmMp: true }), {
    allowed: true,
    real: true
  });
});

test('状态标签：Mock 与 Real 不可互换', () => {
  assert.equal(statusLabel(false, true), 'PASS_MOCK');
  assert.equal(statusLabel(true, true), 'PASS_REAL_API');
  assert.equal(statusLabel(true, false), 'FAIL');
  assert.notEqual(statusLabel(false, true), 'PASS_REAL_API');
  assert.notEqual(statusLabel(true, true), 'PASS_MOCK');
});
