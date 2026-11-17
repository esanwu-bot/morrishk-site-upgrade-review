import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import { MuxProvider } from '../src/providers/video/mux.js';

const uploadWaiting = JSON.parse(fs.readFileSync(new URL('./fixtures/mux-upload-waiting.json', import.meta.url), 'utf8'));
const uploadCreated = JSON.parse(fs.readFileSync(new URL('./fixtures/mux-upload-asset-created.json', import.meta.url), 'utf8'));
const assetReady = JSON.parse(fs.readFileSync(new URL('./fixtures/mux-asset-ready.json', import.meta.url), 'utf8'));

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

test('真实模式直传链路使用 playback_policies 并归一化 snake_case', async () => {
  const captured = { createBody: null, uploadBytes: 0, auth: null };
  let baseUrl = '';
  const srv = await startServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    captured.auth = req.headers.authorization;
    res.setHeader('content-type', 'application/json');

    if (req.method === 'POST' && url.pathname === '/video/v1/uploads') {
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        captured.createBody = JSON.parse(raw);
        const body = JSON.parse(JSON.stringify(uploadWaiting).replace('__UPLOAD_URL__', `${baseUrl}/upload-target`));
        res.end(JSON.stringify(body));
      });
      return;
    }
    if (req.method === 'PUT' && url.pathname === '/upload-target') {
      req.on('data', (c) => (captured.uploadBytes += c.length));
      req.on('end', () => res.end(JSON.stringify({ ok: true })));
      return;
    }
    if (req.method === 'GET' && url.pathname === '/video/v1/uploads/u-fixture-1') {
      res.end(JSON.stringify(JSON.parse(JSON.stringify(uploadCreated).replace('__UPLOAD_URL__', `${baseUrl}/upload-target`))));
      return;
    }
    if (req.method === 'GET' && url.pathname === '/video/v1/assets/a-fixture-1') {
      res.end(JSON.stringify(assetReady));
      return;
    }
    res.statusCode = 404;
    res.end('{}');
  });
  baseUrl = srv.baseUrl;

  try {
    const provider = new MuxProvider({
      mode: 'real',
      config: { mux: { tokenId: 'fixture-id', tokenSecret: 'fixture-secret' } },
      logger: null,
      apiBase: baseUrl
    });

    const upload = await provider.createUpload({ playbackPolicy: 'public', passthrough: 'fixture-pass' });
    assert.equal(upload.id, 'u-fixture-1');
    assert.equal(upload.status, 'waiting');
    assert.equal(upload.assetId, null);
    assert.equal(upload.url, `${baseUrl}/upload-target`);

    assert.deepEqual(captured.createBody.new_asset_settings.playback_policies, ['public']);
    assert.equal('playback_policy' in captured.createBody.new_asset_settings, false);
    assert.match(captured.auth, /^Basic /);

    const uploaded = await provider.uploadFile({
      uploadId: upload.id,
      uploadUrl: upload.url,
      buffer: Buffer.alloc(1024, 0x11)
    });
    assert.equal(uploaded.status, 200);
    assert.equal(captured.uploadBytes, 1024);

    const created = await provider.getUpload(upload.id);
    assert.equal(created.status, 'asset_created');
    assert.equal(created.assetId, 'a-fixture-1');
    assert.equal(created.asset_id, undefined);

    const asset = await provider.getAsset(created.assetId);
    assert.equal(asset.status, 'ready');
    assert.equal(asset.duration, 12.5);
    assert.equal(asset.aspectRatio, '16:9');
    assert.equal(asset.playbackId, 'p-fixture-1');
    assert.equal(asset.playbackPolicy, 'public');
    assert.equal(asset.aspect_ratio, undefined);
    assert.equal(asset.playback_ids, undefined);
  } finally {
    await srv.close();
  }
});

test('Mock 与真实 asset 的核心字段一致', async () => {
  const mock = new MuxProvider({ mode: 'mock', config: { mux: { tokenId: '', tokenSecret: '' } }, logger: null });
  const upload = await mock.createUpload();
  await mock.uploadFile({ uploadId: upload.id, uploadUrl: upload.url, buffer: Buffer.alloc(128) });
  const status = await mock.getUpload(upload.id);
  const asset = await mock.getAsset(status.assetId);
  for (const key of ['id', 'status', 'duration', 'aspectRatio', 'playbackId']) {
    assert.ok(key in asset, `缺少字段 ${key}`);
  }
});
