import { loadEnv, loadConfig } from '../src/config.js';
import { createLogger } from '../src/log.js';
import { createProviders } from '../src/factory.js';
import { MemoryIdempotencyStore } from '../src/idempotency.js';
import { assertPublishAllowed } from '../src/publish-guard.js';
import { PocError } from '../src/errors.js';

loadEnv();
const config = loadConfig();
const logger = createLogger(config.logLevel);
const { social } = createProviders(config, logger);
const guard = assertPublishAllowed(config, { confirmPublish: process.argv.includes('--confirm-publish') });
const store = new MemoryIdempotencyStore();
const results = [];

function record(step, status, detail) {
  results.push({ step, status, detail });
  console.log(`[${status}] ${step}${detail ? ` - ${detail}` : ''}`);
}

async function publishWithIdempotency(key, payload) {
  return store.run(key, JSON.stringify(payload), () => social.ayrshare.publish({ ...payload, idempotencyKey: key }));
}

try {
  const textPost = await publishWithIdempotency('poc-post-001', {
    text: 'Morrishk API 预研测试帖（Mock）',
    platforms: ['linkedin', 'facebook']
  });
  record('1. 文本发布', guard.real ? 'PASS_REAL_API' : 'PASS_MOCK', `id=${textPost.id}, status=${textPost.status}`);

  const duplicate = await publishWithIdempotency('poc-post-001', {
    text: 'Morrishk API 预研测试帖（Mock）',
    platforms: ['linkedin', 'facebook']
  });
  record('2. 幂等重放', textPost.id === duplicate.id ? 'PASS_MOCK' : 'FAIL', '相同幂等键返回同一结果，未重复提交');

  try {
    await publishWithIdempotency('poc-post-001', {
      text: '不同内容但复用同一幂等键',
      platforms: ['linkedin']
    });
    record('3. 幂等键冲突', 'FAIL', '未拦截');
  } catch (err) {
    record('3. 幂等键冲突', err instanceof PocError ? 'PASS_MOCK' : 'FAIL', err.code);
  }

  const imagePost = await social.ayrshare.publish({
    text: '图片发布测试（Mock）',
    platforms: ['instagram'],
    mediaUrls: ['https://example.com/poc-image.jpg']
  });
  record('4. 图片发布', 'PASS_MOCK', `id=${imagePost.id}`);

  const videoPost = await social.ayrshare.publish({
    text: '视频发布测试（Mock）',
    platforms: ['tiktok', 'youtube'],
    mediaUrls: ['https://example.com/poc-video.mp4']
  });
  record('5. 视频发布', 'PASS_MOCK', `id=${videoPost.id}`);

  try {
    await social.ayrshare.publish({ text: 'FAIL_DEMO 触发平台拒绝', platforms: ['linkedin'] });
    record('6. 发布失败处理', 'FAIL', '未抛出预期错误');
  } catch (err) {
    record('6. 发布失败处理', err.code === 'BAD_REQUEST' ? 'PASS_MOCK' : 'FAIL', err.message);
  }

  const scheduled = await social.ayrshare.publish({
    text: '定时发布测试（Mock）',
    platforms: ['linkedin'],
    scheduleDate: '2026-11-20T09:00:00Z'
  });
  record('7. 定时发布', 'PASS_MOCK', `status=${scheduled.status}, at=${scheduled.scheduledAt}`);

  const liPost = await social.linkedin.publish({ text: 'LinkedIn 官方接口发布测试（Mock）' });
  record('8. LinkedIn 官方发布', 'PASS_MOCK', `id=${liPost.id}`);

  record('真实发布', guard.real ? 'NOT_TESTED' : 'POLICY_BLOCKED', 'ALLOW_REAL_PUBLISH 默认 false，需单独授权');
} catch (err) {
  record('执行中断', 'FAIL', err.message);
  process.exitCode = 1;
}

console.log('\n证据摘要：');
for (const r of results) console.log(`- ${r.status}\t${r.step}\t${r.detail || ''}`);
