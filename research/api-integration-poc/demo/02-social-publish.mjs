import { loadEnv, loadConfig } from '../src/config.js';
import { createLogger } from '../src/log.js';
import { createProviders } from '../src/factory.js';
import { MemoryIdempotencyStore } from '../src/idempotency.js';
import { assertPublishAllowed, requireExplicitTarget, statusLabel } from '../src/publish-guard.js';
import { PocError, ErrorCode } from '../src/errors.js';
import { maskProfileKey, maskTarget, redactSecrets } from '../src/redact.js';

loadEnv();
const config = loadConfig();
const logger = createLogger(config.logLevel);
const { social } = createProviders(config, logger);
const store = new MemoryIdempotencyStore();
const results = [];
const real = config.mode === 'real';

function readArg(name) {
  const prefix = `--${name}=`;
  for (let i = 0; i < process.argv.length; i += 1) {
    const arg = process.argv[i];
    if (arg.startsWith(prefix)) return arg.slice(prefix.length);
    if (arg === `--${name}`) {
      const next = process.argv[i + 1];
      return next && !next.startsWith('--') ? next : '';
    }
  }
  return null;
}

// Ayrshare 的 account 是 Profile-Key（凭据），任何输出都必须按敏感值兜底替换。
function sensitiveValues() {
  if (readArg('provider') !== 'ayrshare') return [];
  return [readArg('account')].filter(Boolean);
}

function record(step, status, detail) {
  const safeDetail = redactSecrets(detail, sensitiveValues());
  results.push({ step, status, detail: safeDetail });
  console.log(`[${status}] ${step}${safeDetail ? ` - ${safeDetail}` : ''}`);
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
  const provider = readArg('provider');
  const platform = readArg('platform');
  const rawAccount = readArg('account');
  const text = readArg('text') || 'Morrishk API 预研真实发布测试（单平台单次）';

  // 1. provider / platform / account 必须全部显式传入，且不能是占位值（不触网）
  requireExplicitTarget({ provider, platform, account: rawAccount });

  // 2. 解析最终账号身份：LinkedIn 绑定组织 URN，Ayrshare 绑定 Profile Key（不触网）
  let account = rawAccount;
  let authorUrn = null;
  if (provider === 'linkedin') {
    if (platform !== 'linkedin') {
      throw new PocError(ErrorCode.BLOCKED_PLATFORM, 'LinkedIn 官方接口只支持 platform=linkedin');
    }
    const match = /^(?:urn:li:organization:)?(\d+)$/.exec(String(rawAccount).trim());
    if (!match) {
      throw new PocError(
        ErrorCode.POLICY_BLOCKED,
        'LinkedIn account 必须是组织数字 ID（或 organization URN），禁止使用 default/占位值'
      );
    }
    account = match[1];
    authorUrn = `urn:li:organization:${account}`;
  }
  const target = `${provider}:${platform}:${account}`;

  // 3. 白名单校验必须在任何发布请求之前完成；LinkedIn 同时校验最终 authorUrn
  const guard = assertPublishAllowed(config, {
    confirmPublish: process.argv.includes('--confirm-publish'),
    targets: [target],
    authorUrn
  });
  record('真实发布目标', 'INFO', `${maskTarget(target)}${authorUrn ? `，author=${authorUrn}` : ''}，单平台单次`);

  // 4. 发布：一次、一个目标、一个平台
  if (provider === 'ayrshare') {
    const res = await social.ayrshare.publish({
      text,
      platforms: [platform],
      profileKey: account,
      idempotencyKey: `poc-real-${Date.now()}`
    });
    record('真实发布', statusLabel(guard.real, true), `id=${res.id}, status=${res.status}, profile=${maskProfileKey(res.profileKey)}`);
  } else if (provider === 'linkedin') {
    const res = await social.linkedin.publish({ text, authorUrn });
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
