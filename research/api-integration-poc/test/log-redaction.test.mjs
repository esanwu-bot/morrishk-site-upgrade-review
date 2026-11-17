import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createLogger } from '../src/log.js';
import { MeasurementProtocolClient } from '../src/providers/analytics/measurement-protocol.js';

async function startServer(handler) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections?.();
        server.close(resolve);
      })
  };
}

function captureLogger() {
  const lines = [];
  const sink = {
    log: (line) => lines.push(line),
    warn: (line) => lines.push(line),
    error: (line) => lines.push(line)
  };
  return { logger: createLogger('debug', sink), text: () => lines.join('\n') };
}

test('MP 成功请求日志中的 api_secret 不出现', async () => {
  const srv = await startServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ validationMessages: [] }));
  });
  try {
    const { logger, text } = captureLogger();
    const client = new MeasurementProtocolClient({
      mode: 'real',
      config: { ga4: { measurementId: 'G-FIXTURE', apiSecret: 'SUPER_SECRET_VALUE' } },
      logger,
      debugUrl: `${srv.baseUrl}/debug/mp/collect`,
      mpUrl: `${srv.baseUrl}/mp/collect`
    });
    await client.send({ clientId: 'c1', events: [{ name: 'generate_lead' }], debug: true });

    const logs = text();
    assert.ok(logs.includes('http.request'));
    assert.ok(!logs.includes('SUPER_SECRET_VALUE'));
    assert.ok(!logs.includes('api_secret=SUPER'));
    assert.match(logs, /api_secret=/);
  } finally {
    await srv.close();
  }
});

test('普通日志中的 Profile-Key 字段、target 与消息均脱敏', () => {
  const { logger, text } = captureLogger();
  logger.info('profileKey=TEST_PROFILE_SECRET_123', {
    profileKey: 'TEST_PROFILE_SECRET_123',
    target: 'ayrshare:linkedin:TEST_PROFILE_SECRET_123',
    publishAllowlist: ['ayrshare:linkedin:TEST_PROFILE_SECRET_123']
  });
  const logs = text();
  assert.ok(!logs.includes('TEST_PROFILE_SECRET_123'));
  assert.match(logs, /"profileKey":"\*\*\*"/);
  assert.match(logs, /ayrshare:linkedin:\*\*\*/);
});

test('HTTP 错误详情 URL 对查询参数脱敏', async () => {
  const srv = await startServer((req, res) => {
    res.statusCode = 500;
    res.end('boom');
  });
  try {
    const { logger, text } = captureLogger();
    const client = new MeasurementProtocolClient({
      mode: 'real',
      config: { ga4: { measurementId: 'G-FIXTURE', apiSecret: 'ERROR_SECRET_VALUE' } },
      logger,
      debugUrl: `${srv.baseUrl}/debug/mp/collect`,
      mpUrl: `${srv.baseUrl}/mp/collect`
    });
    await assert.rejects(
      () => client.send({ clientId: 'c1', events: [{ name: 'x' }] }),
      (err) => {
        assert.ok(!JSON.stringify(err.details).includes('ERROR_SECRET_VALUE'));
        return err.code === 'PLATFORM_ERROR';
      }
    );
    assert.ok(!text().includes('ERROR_SECRET_VALUE'));
  } finally {
    await srv.close();
  }
});
