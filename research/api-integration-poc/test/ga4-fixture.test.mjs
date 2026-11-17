import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import { GA4Provider, flattenAccountSummaries } from '../src/providers/analytics/ga4.js';

const page1 = JSON.parse(fs.readFileSync(new URL('./fixtures/ga4-account-summaries-page1.json', import.meta.url), 'utf8'));
const page2 = JSON.parse(fs.readFileSync(new URL('./fixtures/ga4-account-summaries-page2.json', import.meta.url), 'utf8'));
const reportFixture = JSON.parse(fs.readFileSync(new URL('./fixtures/ga4-run-report.json', import.meta.url), 'utf8'));

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

const config = {
  ga4: { accessToken: 'fixture-token', credentialsPath: '', propertyId: '', measurementId: '', apiSecret: '' }
};

test('flattenAccountSummaries 按真实结构展平 accountSummaries[].propertySummaries[]', () => {
  const flat = flattenAccountSummaries(page1);
  assert.equal(flat.length, 2);
  assert.deepEqual(flat[0], {
    propertyId: '123456789',
    propertyName: 'properties/123456789',
    displayName: 'Morrishk - Global',
    propertyType: 'PROPERTY_TYPE_ORDINARY',
    parent: 'accounts/100',
    account: 'Morrishk',
    accountName: 'accounts/100'
  });
});

test('真实模式 listProperties 展平并跟随 nextPageToken', async () => {
  const calls = [];
  const srv = await startServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    calls.push({ path: url.pathname, query: Object.fromEntries(url.searchParams), auth: req.headers.authorization });
    res.setHeader('content-type', 'application/json');
    if (url.pathname === '/v1beta/accountSummaries') {
      res.end(JSON.stringify(url.searchParams.get('pageToken') === 'fixture-page-2' ? page2 : page1));
      return;
    }
    res.statusCode = 404;
    res.end('{}');
  });
  try {
    const provider = new GA4Provider({
      mode: 'real',
      config,
      logger: null,
      adminBase: `${srv.baseUrl}/v1beta`,
      dataBase: `${srv.baseUrl}/v1beta`
    });
    const properties = await provider.listProperties();

    assert.deepEqual(properties.map((p) => p.propertyId), ['123456789', '222222222', '333333333']);
    assert.equal(properties[2].account, 'Morrishk APAC');
    assert.equal(calls.length, 2);
    assert.equal(calls[0].query.pageSize, '200');
    assert.equal(calls[1].query.pageToken, 'fixture-page-2');
    assert.equal(calls[0].auth, 'Bearer fixture-token');
  } finally {
    await srv.close();
  }
});

test('真实模式 runReport 使用 fixture 返回结构', async () => {
  let captured = null;
  const srv = await startServer((req, res) => {
    if (req.url.startsWith('/v1beta/properties/123456789:runReport')) {
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        captured = JSON.parse(raw);
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(reportFixture));
      });
      return;
    }
    res.statusCode = 404;
    res.end('{}');
  });
  try {
    const provider = new GA4Provider({
      mode: 'real',
      config,
      logger: null,
      adminBase: `${srv.baseUrl}/v1beta`,
      dataBase: `${srv.baseUrl}/v1beta`
    });
    const report = await provider.runReport({
      propertyId: '123456789',
      dateRanges: [
        { startDate: '2026-10-01', endDate: '2026-10-31', name: 'current' },
        { startDate: '2026-09-01', endDate: '2026-09-30', name: 'previous' }
      ],
      dimensions: ['sessionSource', 'sessionMedium'],
      metrics: ['sessions', 'totalUsers'],
      limit: 10,
      offset: 0
    });

    assert.deepEqual(report, reportFixture);
    assert.deepEqual(captured.dateRanges[0], {
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      name: 'current'
    });
    assert.deepEqual(captured.dimensions, [{ name: 'sessionSource' }, { name: 'sessionMedium' }]);
    assert.deepEqual(captured.metrics, [{ name: 'sessions' }, { name: 'totalUsers' }]);
  } finally {
    await srv.close();
  }
});

test('Mock 与真实 listProperties 的结构字段一致', async () => {
  const mock = await new GA4Provider({ mode: 'mock', config, logger: null }).listProperties();
  const real = flattenAccountSummaries(page1);
  assert.deepEqual(Object.keys(mock[0]).sort(), Object.keys(real[0]).sort());
});
