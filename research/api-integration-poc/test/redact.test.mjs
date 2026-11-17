import test from 'node:test';
import assert from 'node:assert/strict';
import { redact, redactString, redactUrl } from '../src/redact.js';

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

test('null 与原始类型原样返回', () => {
  assert.equal(redact(null), null);
  assert.equal(redact(42), 42);
  assert.equal(redact(true), true);
});
