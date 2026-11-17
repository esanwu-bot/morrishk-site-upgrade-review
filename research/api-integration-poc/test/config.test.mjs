import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadEnv, loadConfig, requireValue } from '../src/config.js';

test('默认模式为 mock', () => {
  const prev = process.env.POC_MODE;
  delete process.env.POC_MODE;
  try {
    assert.equal(loadConfig().mode, 'mock');
  } finally {
    if (prev !== undefined) process.env.POC_MODE = prev;
  }
});

test('非法 POC_MODE 被拒绝', () => {
  assert.throws(() => loadConfig({ mode: 'production' }), /POC_MODE/);
});

test('ALLOW_REAL_PUBLISH 仅在显式 true 时启用', () => {
  const prev = process.env.ALLOW_REAL_PUBLISH;
  process.env.ALLOW_REAL_PUBLISH = 'TRUE';
  try {
    assert.equal(loadConfig().allowRealPublish, false);
    process.env.ALLOW_REAL_PUBLISH = 'true';
    assert.equal(loadConfig().allowRealPublish, true);
  } finally {
    if (prev === undefined) delete process.env.ALLOW_REAL_PUBLISH;
    else process.env.ALLOW_REAL_PUBLISH = prev;
  }
});

test('真实发布与 MP 写入开关默认关闭，白名单为空', () => {
  const keys = ['ALLOW_REAL_PUBLISH', 'ALLOW_REAL_MP', 'PUBLISH_TARGET_ALLOWLIST'];
  const prev = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  for (const k of keys) delete process.env[k];
  try {
    const cfg = loadConfig({ mode: 'mock' });
    assert.equal(cfg.allowRealPublish, false);
    assert.equal(cfg.allowRealMp, false);
    assert.deepEqual(cfg.publishAllowlist, []);
    assert.equal(cfg.linkedin.authorUrn, '');
    assert.equal(cfg.linkedin.organizationId, '');
  } finally {
    for (const k of keys) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
  }
});

test('LinkedIn API 版本与组织发现默认保守', () => {
  const keys = ['LINKEDIN_API_BASE', 'LINKEDIN_API_VERSION', 'LINKEDIN_ORG_ADMIN_DISCOVERY'];
  const prev = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  for (const k of keys) delete process.env[k];
  try {
    const cfg = loadConfig({ mode: 'mock' });
    assert.equal(cfg.linkedin.apiBase, 'https://api.linkedin.com');
    assert.equal(cfg.linkedin.apiVersion, '202610');
    assert.equal(cfg.linkedin.orgAdminDiscovery, false);
  } finally {
    for (const k of keys) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
  }
});

test('发布目标白名单按逗号解析并去除空白', () => {
  const prev = process.env.PUBLISH_TARGET_ALLOWLIST;
  process.env.PUBLISH_TARGET_ALLOWLIST = ' ayrshare:linkedin:page-1 , linkedin:linkedin:1001 ,,';
  try {
    assert.deepEqual(loadConfig().publishAllowlist, ['ayrshare:linkedin:page-1', 'linkedin:linkedin:1001']);
  } finally {
    if (prev === undefined) delete process.env.PUBLISH_TARGET_ALLOWLIST;
    else process.env.PUBLISH_TARGET_ALLOWLIST = prev;
  }
});

test('requireValue 缺值时抛 CONFIG_MISSING', () => {
  assert.throws(
    () => requireValue('', 'MUX_TOKEN_ID'),
    (err) => err.code === 'CONFIG_MISSING' && /MUX_TOKEN_ID/.test(err.message)
  );
  assert.equal(requireValue('ok', 'X'), 'ok');
});

test('loadEnv 读取引号值且不覆盖已有环境变量', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'poc-env-'));
  const file = path.join(dir, '.env');
  fs.writeFileSync(file, 'POC_TEST_A="quoted value"\nPOC_TEST_B=plain\nPOC_TEST_C=\'single\'\n# comment\nPOC_TEST_D=keep\n');
  process.env.POC_TEST_D = 'existing';
  try {
    loadEnv(dir, '.env');
    assert.equal(process.env.POC_TEST_A, 'quoted value');
    assert.equal(process.env.POC_TEST_B, 'plain');
    assert.equal(process.env.POC_TEST_C, 'single');
    assert.equal(process.env.POC_TEST_D, 'existing');
  } finally {
    for (const k of ['POC_TEST_A', 'POC_TEST_B', 'POC_TEST_C', 'POC_TEST_D']) delete process.env[k];
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
