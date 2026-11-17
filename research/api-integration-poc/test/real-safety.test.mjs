import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function runDemo(script, { env = {}, args = [] } = {}) {
  const res = spawnSync(process.execPath, [path.join(root, 'demo', script), ...args], {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    timeout: 30_000
  });
  return { status: res.status, stdout: res.stdout || '', stderr: res.stderr || '' };
}

test('Demo 02 Mock 只输出 PASS_MOCK，不出现 PASS_REAL_API', () => {
  const res = runDemo('02-social-publish.mjs', {
    env: { POC_MODE: 'mock', ALLOW_REAL_PUBLISH: '', PUBLISH_TARGET_ALLOWLIST: '' }
  });
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /PASS_MOCK/);
  assert.ok(!res.stdout.includes('PASS_REAL_API'));
  assert.match(res.stdout, /POLICY_BLOCKED/);
});

test('Demo 02 Real 未确认时不发布，也不冒用 Mock 标签', () => {
  const res = runDemo('02-social-publish.mjs', {
    env: {
      POC_MODE: 'real',
      ALLOW_REAL_PUBLISH: 'true',
      PUBLISH_TARGET_ALLOWLIST: 'ayrshare:linkedin:default'
    }
  });
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /POLICY_BLOCKED/);
  assert.ok(!res.stdout.includes('PASS_REAL_API'));
  assert.ok(!res.stdout.includes('PASS_MOCK'));
});

test('Demo 02 Real 目标不在白名单时拒绝', () => {
  const res = runDemo('02-social-publish.mjs', {
    env: {
      POC_MODE: 'real',
      ALLOW_REAL_PUBLISH: 'true',
      PUBLISH_TARGET_ALLOWLIST: 'ayrshare:facebook:other-page'
    },
    args: ['--confirm-publish']
  });
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /POLICY_BLOCKED/);
  assert.match(res.stdout, /不在白名单/);
  assert.ok(!res.stdout.includes('PASS_REAL_API'));
});

test('Demo 05 Real 未确认时 MP 写入被拒绝', () => {
  const res = runDemo('05-ga4-measurement-protocol.mjs', {
    env: { POC_MODE: 'real', ALLOW_REAL_MP: 'true' }
  });
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /POLICY_BLOCKED/);
  assert.match(res.stdout, /confirm-mp/);
  assert.ok(!res.stdout.includes('PASS_REAL_API'));
  assert.ok(!res.stdout.includes('PASS_MOCK'));
});
