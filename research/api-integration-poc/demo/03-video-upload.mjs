import { loadEnv, loadConfig } from '../src/config.js';
import { createLogger } from '../src/log.js';
import { createProviders } from '../src/factory.js';

loadEnv();
const config = loadConfig();
const logger = createLogger(config.logLevel);
const { video } = createProviders(config, logger);

function makeDummyVideo(bytes = 180 * 1024) {
  const buf = Buffer.alloc(bytes, 0x11);
  buf.writeUInt32BE(24, 0);
  buf.write('ftypisom', 4, 'ascii');
  buf.write('isomiso2avc1mp41', 12, 'ascii');
  return buf;
}

const results = [];
function record(step, status, detail) {
  results.push({ step, status, detail });
  console.log(`[${status}] ${step}${detail ? ` - ${detail}` : ''}`);
}

try {
  const buffer = makeDummyVideo();
  record('0. 准备测试文件', 'PASS_MOCK', `${buffer.length} 字节（模拟字节流，非可播放视频）`);

  const upload = await video.mux.createUpload({ passthrough: 'poc-demo-001' });
  record('1. 创建上传任务', 'PASS_MOCK', `uploadId=${upload.id}, status=${upload.status}`);

  const uploaded = await video.mux.uploadFile({
    uploadId: upload.id,
    uploadUrl: upload.url,
    buffer,
    chunkSize: 64 * 1024
  });
  record('2. 分片上传', 'PASS_MOCK', `${uploaded.chunks} 片，共 ${uploaded.bytes} 字节`);

  const status = await video.mux.getUpload(upload.id);
  record('3. 查询上传状态', 'PASS_MOCK', `status=${status.status}, assetId=${status.assetId}`);

  const asset = await video.mux.getAsset(status.assetId);
  record('4. 查询处理结果', 'PASS_MOCK', `status=${asset.status}, duration=${asset.duration}s, ${asset.aspectRatio}`);

  record('5. 播放地址', 'PASS_MOCK', video.mux.playbackUrl(asset.playbackId));
  record('6. 缩略图', 'PASS_MOCK', video.mux.thumbnailUrl(asset.playbackId));

  record('真实接口验证', 'BLOCKED_CREDENTIAL', '未提供 MUX_TOKEN_ID / MUX_TOKEN_SECRET');
  record('社媒视频发布', 'NOT_TESTED', '需各平台 OAuth 与审核，参见 docs/API_RESEARCH.md §3.2');
} catch (err) {
  record('执行中断', 'FAIL', err.message);
  process.exitCode = 1;
}

console.log('\n证据摘要：');
for (const r of results) console.log(`- ${r.status}\t${r.step}\t${r.detail || ''}`);
