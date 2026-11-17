import test from 'node:test';
import assert from 'node:assert/strict';
import {
  redact,
  redactString,
  redactUrl,
  redactSecrets,
  maskProfileKey,
  maskTarget
} from '../src/redact.js';

test('按字段名脱敏 token、secret、api key 等敏感字段', () => {
  const input = {
    authorization: 'Bearer abc',
    access_token: 'plain-token',
    clientSecret: 's3cr3t',
    apiKey: 'key-123',
    nested: { refresh_token: 'r1' },
    list: [{ cookie: 'session=1' }],
    normal: 'keep-me'
  };
  const out = redact(input);
  assert.equal(out.authorization, '***');
  assert.equal(out.access_token, '***');
  assert.equal(out.clientSecret, '***');
  assert.equal(out.apiKey, '***');
  assert.equal(out.nested.refresh_token, '***');
  assert.equal(out.list[0].cookie, '***');
  assert.equal(out.normal, 'keep-me');
});

test('字符串中的 Bearer / JWT / 长十六进制串被替换', () => {
  assert.equal(redactString('Authorization: Bearer abc.def-ghi_jkl'), 'Authorization: Bearer ***');
  assert.equal(redactString('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig-part'), '***');
  assert.equal(redactString(`hash=${'a'.repeat(40)}`), 'hash=***');
  assert.equal(redactString('普通文本'), '普通文本');
});

test('URL 查询参数中的敏感项被替换但不破坏其他参数', () => {
  const out = redactUrl('https://example.com/api?api_key=SECRET&page=2&access_token=abc');
  assert.ok(!out.includes('SECRET'));
  assert.ok(!out.includes('abc&'));
  assert.match(out, /page=2/);
  assert.match(out, /api_key=/);
});

test('非法 URL 回退为字符串脱敏', () => {
  assert.equal(redactUrl('not-a-url Bearer xyz'), 'not-a-url Bearer ***');
});

test('超深对象被截断而非无限递归', () => {
  let deep = { v: 1 };
  for (let i = 0; i < 10; i++) deep = { child: deep };
  const out = JSON.stringify(redact(deep));
  assert.match(out, /TRUNCATED/);
});

test('Profile-Key、target 与白名单字段统一脱敏', () => {
  const out = redact({
    profileKey: 'TEST_PROFILE_SECRET_123',
    'Profile-Key': 'TEST_PROFILE_SECRET_123',
    target: 'ayrshare:linkedin:TEST_PROFILE_SECRET_123',
    publishAllowlist: ['ayrshare:linkedin:TEST_PROFILE_SECRET_123'],
    nested: { profileKey: 'TEST_PROFILE_SECRET_123' }
  });
  assert.equal(out.profileKey, '***');
  assert.equal(out['Profile-Key'], '***');
  assert.equal(out.target, 'ayrshare:linkedin:***');
  assert.deepEqual(out.publishAllowlist, ['ayrshare:linkedin:***']);
  assert.equal(out.nested.profileKey, '***');
  assert.ok(!JSON.stringify(out).includes('TEST_PROFILE_SECRET_123'));
});

test('Profile-Key 头文本与已知敏感原值被替换', () => {
  assert.equal(redactString('Profile-Key: TEST_PROFILE_SECRET_123'), 'Profile-Key: ***');
  assert.equal(redactString('profileKey=TEST_PROFILE_SECRET_123'), 'profileKey: ***');
  assert.equal(redactSecrets('x TEST_PROFILE_SECRET_123 y', ['TEST_PROFILE_SECRET_123']), 'x *** y');
  assert.equal(redactSecrets('x y', []), 'x y');
});

test('maskProfileKey / maskTarget 只保留非敏感结构', () => {
  assert.equal(maskProfileKey('TEST_PROFILE_SECRET_123'), '***');
  assert.equal(maskProfileKey(''), '');
  assert.equal(maskProfileKey(null), null);
  assert.equal(maskTarget('ayrshare:linkedin:TEST_PROFILE_SECRET_123'), 'ayrshare:linkedin:***');
  assert.equal(maskTarget('ayrshare:linkedin:TEST_PROFILE_SECRET_123:extra'), '***');
  assert.equal(maskTarget('not-a-target'), '***');
});

test('null 与原始类型原样返回', () => {
  assert.equal(redact(null), null);
  assert.equal(redact(42), 42);
  assert.equal(redact(true), true);
});
