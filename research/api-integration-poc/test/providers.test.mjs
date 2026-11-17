import test from 'node:test';
import assert from 'node:assert/strict';
import { AyrshareProvider } from '../src/providers/social/ayrshare.js';
import { MuxProvider } from '../src/providers/video/mux.js';
import { GA4Provider } from '../src/providers/analytics/ga4.js';
import { MeasurementProtocolClient } from '../src/providers/analytics/measurement-protocol.js';
import { ErrorCode } from '../src/errors.js';

function ayrshare(mode = 'mock') {
  return new AyrshareProvider({
    mode,
    config: { ayrshare: { apiKey: '', baseUrl: 'http://127.0.0.1:1' } },
    logger: null
  });
}

function mux(mode = 'mock') {
  return new MuxProvider({
    mode,
    config: { mux: { tokenId: '', tokenSecret: '' } },
    logger: null
  });
}

function ga4(mode = 'mock') {
  return new GA4Provider({
    mode,
    config: { ga4: { accessToken: '', credentialsPath: '', propertyId: '', measurementId: '', apiSecret: '' } },
    logger: null
  });
}

function mp(mode = 'mock') {
  return new MeasurementProtocolClient({
    mode,
    config: { ga4: { measurementId: '', apiSecret: '' } },
    logger: null
  });
}

const ranges = [{ startDate: '2026-10-01', endDate: '2026-10-31' }];

test('Ayrshare mock：发布返回 PUBLISHED 并回传幂等键', async () => {
  const post = await ayrshare().publish({ text: 'hello', platforms: ['linkedin'], idempotencyKey: 'k1' });
  assert.equal(post.status, 'PUBLISHED');
  assert.equal(post.mode, 'mock');
  assert.equal(post.idempotencyKey, 'k1');
  assert.deepEqual(post.platforms, [{ platform: 'linkedin', ok: true }]);
});

test('Ayrshare mock：带排期返回 SCHEDULED', async () => {
  const post = await ayrshare().publish({
    text: 'later',
    platforms: ['linkedin'],
    scheduleDate: '2026-11-20T09:00:00Z'
  });
  assert.equal(post.status, 'SCHEDULED');
  assert.equal(post.scheduledAt, '2026-11-20T09:00:00Z');
});

test('Ayrshare mock：FAIL_DEMO 模拟平台拒绝', async () => {
  await assert.rejects(
    () => ayrshare().publish({ text: 'FAIL_DEMO', platforms: ['linkedin'] }),
    (err) => err.code === ErrorCode.BAD_REQUEST
  );
});

test('Ayrshare 参数校验：空文本与空平台列表', async () => {
  await assert.rejects(() => ayrshare().publish({ text: '  ', platforms: ['linkedin'] }), /不能为空/);
  await assert.rejects(() => ayrshare().publish({ text: 'ok', platforms: [] }), /至少选择一个平台/);
});

test('Ayrshare mock：账号列表与分析数据结构', async () => {
  const accounts = await ayrshare().listAccounts();
  assert.equal(accounts.length, 3);
  const metrics = await ayrshare().fetchMetrics({ platforms: ['linkedin', 'facebook'] });
  assert.equal(metrics.mode, 'mock');
  assert.equal(metrics.platforms.length, 2);
});

test('Ayrshare 真实模式缺凭证时标记 BLOCKED_CREDENTIAL', async () => {
  await assert.rejects(
    () => ayrshare('real').listAccounts(),
    (err) => err.code === ErrorCode.BLOCKED_CREDENTIAL && /AYRSHARE_API_KEY/.test(err.message)
  );
  await assert.rejects(
    () => ayrshare('real').publish({ text: 'x', platforms: ['linkedin'] }),
    (err) => err.code === ErrorCode.BLOCKED_CREDENTIAL
  );
});

test('Ayrshare 真实模式账号关联未实现，明确抛 NOT_IMPLEMENTED', async () => {
  await assert.rejects(() => ayrshare('real').connect(), (err) => err.code === ErrorCode.NOT_IMPLEMENTED);
});

test('Mux mock：直传流程从创建到播放地址', async () => {
  const provider = mux();
  const upload = await provider.createUpload({ passthrough: 'demo' });
  assert.equal(upload.status, 'waiting');
  assert.equal(upload.assetId, null);
  assert.equal(upload.mode, 'mock');

  const buffer = Buffer.alloc(180 * 1024, 0x11);
  const uploaded = await provider.uploadFile({ uploadId: upload.id, uploadUrl: upload.url, buffer, chunkSize: 64 * 1024 });
  assert.equal(uploaded.chunks, 3);
  assert.equal(uploaded.bytes, 180 * 1024);

  const status = await provider.getUpload(upload.id);
  assert.equal(status.status, 'asset_created');
  assert.equal(status.assetId, 'mock-asset-1');

  const asset = await provider.getAsset(status.assetId);
  assert.equal(asset.status, 'ready');
  assert.equal(asset.aspectRatio, '16:9');
  assert.match(provider.playbackUrl(asset.playbackId), /^https:\/\/stream\.mux\.com\/.+\.m3u8$/);
  assert.match(provider.thumbnailUrl(asset.playbackId, { width: 320, time: 2 }), /width=320&time=2/);
});

test('Mux mock：未知上传任务返回 BAD_REQUEST', async () => {
  await assert.rejects(() => mux().getUpload('missing'), (err) => err.code === ErrorCode.BAD_REQUEST);
});

test('Mux 真实模式缺凭证时标记 BLOCKED_CREDENTIAL', async () => {
  await assert.rejects(
    () => mux('real').createUpload(),
    (err) => err.code === ErrorCode.BLOCKED_CREDENTIAL && /MUX_TOKEN_ID/.test(err.message)
  );
});

test('GA4 mock：Property 发现与来源/媒介报表', async () => {
  const provider = ga4();
  const properties = await provider.listProperties();
  assert.equal(properties.length, 2);

  const report = await provider.runReport({
    propertyId: properties[0].propertyId,
    dateRanges: ranges,
    dimensions: ['sessionSource', 'sessionMedium'],
    metrics: ['sessions', 'totalUsers', 'screenPageViews'],
    limit: 10
  });
  assert.equal(report.rowCount, 3);
  assert.equal(report.rows.length, 3);
  assert.deepEqual(report.dimensionHeaders.map((h) => h.name), ['sessionSource', 'sessionMedium']);
  assert.equal(report.rows[0].dimensionValues[0].value, 'google');
  assert.deepEqual(Object.keys(report).sort(), ['dimensionHeaders', 'kind', 'metadata', 'metricHeaders', 'rowCount', 'rows']);
});

test('GA4 mock：limit/offset 分页生效', async () => {
  const report = await ga4().runReport({
    propertyId: '123456789',
    dateRanges: ranges,
    dimensions: ['sessionSource'],
    metrics: ['sessions'],
    limit: 1,
    offset: 1
  });
  assert.equal(report.rows.length, 1);
  assert.equal(report.rows[0].dimensionValues[0].value, 'linkedin');
  assert.equal(report.rowCount, 3);
});

test('GA4 mock：最多 4 个日期范围，5 个被拒绝', async () => {
  const make = (n) => Array.from({ length: n }, (_, i) => ({ startDate: '2026-10-01', endDate: '2026-10-02', name: `r${i}` }));
  const ok = await ga4().runReport({ propertyId: '1', dateRanges: make(4), dimensions: ['date'], metrics: ['sessions'] });
  assert.equal(ok.rowCount, 3);
  await assert.rejects(
    () => ga4().runReport({ propertyId: '1', dateRanges: make(5), dimensions: ['date'], metrics: ['sessions'] }),
    (err) => err.code === ErrorCode.BAD_REQUEST
  );
});

test('GA4 mock：无权限与配额耗尽的可识别错误', async () => {
  await assert.rejects(
    () => ga4().runReport({ propertyId: 'forbidden', dateRanges: ranges }),
    (err) => err.code === ErrorCode.BLOCKED_PERMISSION && err.status === 403
  );
  await assert.rejects(
    () => ga4().runReport({ propertyId: 'quota', dateRanges: ranges }),
    (err) => err.code === ErrorCode.RATE_LIMITED && err.status === 429
  );
});

test('GA4 参数校验：缺 propertyId 或日期范围', async () => {
  await assert.rejects(() => ga4().runReport({ dateRanges: ranges }), /propertyId/);
  await assert.rejects(() => ga4().runReport({ propertyId: '1', dateRanges: [] }), /日期范围/);
});

test('GA4 真实模式无凭证时标记 BLOCKED_CREDENTIAL', async () => {
  await assert.rejects(
    () => ga4('real').runReport({ propertyId: '1', dateRanges: ranges }),
    (err) => err.code === ErrorCode.BLOCKED_CREDENTIAL && /GOOGLE_APPLICATION_CREDENTIALS/.test(err.message)
  );
});

test('Measurement Protocol mock：调试与发送', async () => {
  const events = [{ name: 'generate_lead', params: { form_id: 'contact' } }];
  const debug = await mp().send({ clientId: 'c1', events, debug: true });
  assert.deepEqual(debug.validationMessages, []);
  const sent = await mp().send({ clientId: 'c1', events });
  assert.equal(sent.eventCount, 1);
  assert.equal(sent.mode, 'mock');
});

test('Measurement Protocol 参数校验与缺凭证', async () => {
  await assert.rejects(() => mp().send({ events: [] }), /clientId/);
  await assert.rejects(() => mp().send({ clientId: 'c1', events: [] }), /至少一个事件/);
  await assert.rejects(
    () => mp('real').send({ clientId: 'c1', events: [{ name: 'x' }] }),
    (err) => err.code === ErrorCode.BLOCKED_CREDENTIAL && /GA4_MEASUREMENT_ID/.test(err.message)
  );
});
