import { loadEnv, loadConfig } from '../src/config.js';
import { createLogger } from '../src/log.js';
import { createProviders } from '../src/factory.js';
import { MemoryIdempotencyStore } from '../src/idempotency.js';
import { assertPublishAllowed, statusLabel } from '../src/publish-guard.js';
import { PocError } from '../src/errors.js';

loadEnv();
const config = loadConfig();
const logger = createLogger(config.logLevel);
const { social } = createProviders(config, logger);
const store = new MemoryIdempotencyStore();
const results = [];
const real = config.mode === 'real';

function argValue(name, fallback = null) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function record(step, status, detail) {
  results.push({ step, status, detail });
  console.log(`[${status}] ${step}${detail ? ` - ${detail}` : ''}`);
}

function recordError(step, err) {
  const blocked =
    err instanceof PocError && (err.code === 'POLICY_BLOCKED' || err.code.startsWith('BLOCKED_'));
  const status = blocked ? err.code : 'FAIL';
  record(step, status, err.message);
  if (status === 'FAIL') process.exitCode = 1;
}

async function runMockFlows() {
  const guard = assertPublishAllowed(config, {});

  async function publishWithIdempotency(key, payload) {
    return store.run(key, JSON.stringify(payload), () => social.ayrshare.publish({ ...payload, idempotencyKey: key }));
  }

  const textPost = await publishWithIdempotency('poc-post-001', {
    text: 'Morrishk API 预研测试帖（Mock）',
    platforms: ['linkedin', 'facebook']
  });
  record('1. 文本发布', statusLabel(guard.real, true), `id=${textPost.id}, status=${textPost.status}`);

  const duplicate = await publishWithIdempotency('poc-post-001', {
    text: 'Morrishk API 预研测试帖（Mock）',
    platforms: ['linkedin', 'facebook']
  });
  record('2. 幂等重放', textPost.id === duplicate.id ? statusLabel(false, true) : 'FAIL', '相同幂等键返回同一结果，未重复提交');

  try {
    await publishWithIdempotency('poc-post-001', {
      text: '不同内容但复用同一幂等键',
      platforms: ['linkedin']
    });
    record('3. 幂等键冲突', 'FAIL', '未拦截');
    process.exitCode = 1;
  } catch (err) {
    record('3. 幂等键冲突', err instanceof PocError && err.code === 'IDEMPOTENCY_CONFLICT' ? statusLabel(false, true) : 'FAIL', err.code);
  }

  const imagePost = await social.ayrshare.publish({
    text: '图片发布测试（Mock）',
    platforms: ['instagram'],
    mediaUrls: ['https://example.com/poc-image.jpg']
  });
  record('4. 图片发布', statusLabel(false, true), `id=${imagePost.id}`);

  const videoPost = await social.ayrshare.publish({
    text: '视频发布测试（Mock）',
    platforms: ['tiktok', 'youtube'],
    mediaUrls: ['https://example.com/poc-video.mp4']
  });
  record('5. 视频发布', statusLabel(false, true), `id=${videoPost.id}`);

  try {
    await social.ayrshare.publish({ text: 'FAIL_DEMO 触发平台拒绝', platforms: ['linkedin'] });
    record('6. 发布失败处理', 'FAIL', '未抛出预期错误');
    process.exitCode = 1;
  } catch (err) {
    record('6. 发布失败处理', err.code === 'BAD_REQUEST' ? statusLabel(false, true) : 'FAIL', err.message);
  }

  const scheduled = await social.ayrshare.publish({
    text: '定时发布测试（Mock）',
    platforms: ['linkedin'],
    scheduleDate: '2026-11-20T09:00:00Z'
  });
  record('7. 定时发布', statusLabel(false, true), `status=${scheduled.status}, at=${scheduled.scheduledAt}`);

  const liPost = await social.linkedin.publish({ text: 'LinkedIn 官方接口发布测试（Mock）' });
  record('8. LinkedIn 官方发布', statusLabel(false, true), `id=${liPost.id}`);

  record('真实发布', 'POLICY_BLOCKED', 'Mock 模式不执行真实发布；真实发布需独立授权');
}

async function runSingleRealPublish() {
  const provider = argValue('provider', 'ayrshare');
  const platform = argValue('platform', 'linkedin');
  const account = argValue('account', 'default');
  const text = argValue('text', 'Morrishk API 预研真实发布测试（单平台单次）');
  const target = `${provider}:${platform}:${account}`;

  // 真实模式只允许一次、一个目标、一个平台；不做批量或媒体混合发布
  const guard = assertPublishAllowed(config, {
    confirmPublish: process.argv.includes('--confirm-publish'),
    targets: [target]
  });
  record('真实发布目标', 'INFO', `${target}，单平台单次`);

  if (provider === 'ayrshare') {
    const res = await social.ayrshare.publish({
      text,
      platforms: [platform],
      idempotencyKey: `poc-real-${Date.now()}`
    });
    record('真实发布', statusLabel(guard.real, true), `id=${res.id}, status=${res.status}`);
  } else if (provider === 'linkedin') {
    const res = await social.linkedin.publish({
      text,
      authorUrn: account === 'default' ? undefined : `urn:li:organization:${account}`
    });
    record('真实发布', statusLabel(guard.real, true), `id=${res.id}, author=${res.authorUrn}`);
  } else {
    record('真实发布', 'BLOCKED_PLATFORM', `Demo 未实现 provider=${provider}`);
  }
}

try {
  if (real) {
    await runSingleRealPublish();
  } else {
    await runMockFlows();
  }
} catch (err) {
  recordError(real ? '真实发布' : '执行中断', err);
}

console.log('\n证据摘要：');
for (const r of results) console.log(`- ${r.status}\t${r.step}\t${r.detail || ''}`);
