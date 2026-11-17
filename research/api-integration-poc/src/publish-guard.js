import { PocError, ErrorCode } from './errors.js';
import { maskProfileKey, maskTarget } from './redact.js';

// 占位值不是账号身份；真实发布必须能唯一落到某个账号/组织/Profile。
const PLACEHOLDER_ACCOUNTS = new Set(['default', 'all', '*', 'any', 'profile']);

export function requireExplicitTarget({ provider, platform, account }) {
  const missing = [];
  if (!provider) missing.push('--provider');
  if (!platform) missing.push('--platform');
  if (!account) missing.push('--account');
  if (missing.length) {
    throw new PocError(
      ErrorCode.POLICY_BLOCKED,
      `真实发布必须显式传入 ${missing.join('、')}；不提供任何默认目标`
    );
  }
  if (PLACEHOLDER_ACCOUNTS.has(String(account).trim().toLowerCase())) {
    throw new PocError(
      ErrorCode.POLICY_BLOCKED,
      `account=${maskProfileKey(account)} 是占位值，不是真实账号身份，禁止真实发布`
    );
  }
  return `${provider}:${platform}:${account}`;
}

function assertTargetShape(targets) {
  for (const target of targets) {
    const parts = String(target).split(':');
    if (parts.length !== 3 || parts.some((part) => !part)) {
      throw new PocError(
        ErrorCode.POLICY_BLOCKED,
        `发布目标格式必须是 provider:platform:account，当前为 ${maskTarget(target)}`
      );
    }
    if (PLACEHOLDER_ACCOUNTS.has(parts[2].toLowerCase())) {
      throw new PocError(
        ErrorCode.POLICY_BLOCKED,
        `account=${maskProfileKey(parts[2])} 是占位值，不是真实账号身份，禁止真实发布`
      );
    }
  }
}

function assertLinkedInAuthorBinding(targets, authorUrn) {
  const linkedinTargets = targets.filter((target) => target.startsWith('linkedin:'));
  if (!linkedinTargets.length) return;
  if (!authorUrn) {
    throw new PocError(
      ErrorCode.POLICY_BLOCKED,
      'LinkedIn 真实发布必须提供最终 authorUrn，用于与白名单目标绑定'
    );
  }
  const match = /^urn:li:organization:(\d+)$/.exec(String(authorUrn));
  if (!match) {
    throw new PocError(
      ErrorCode.POLICY_BLOCKED,
      'LinkedIn authorUrn 必须是 urn:li:organization:{数字}，禁止使用个人身份或占位组织'
    );
  }
  const mismatched = linkedinTargets.filter((target) => target.split(':')[2] !== match[1]);
  if (mismatched.length) {
    throw new PocError(
      ErrorCode.POLICY_BLOCKED,
      `白名单目标与最终 authorUrn 不匹配：${mismatched.map(maskTarget).join(', ')} ≠ ${authorUrn}`,
      { details: { targets: targets.map(maskTarget), authorUrn } }
    );
  }
}

export function assertPublishAllowed(config, { confirmPublish = false, targets = [], authorUrn = null } = {}) {
  if (config.mode === 'mock') return { allowed: true, real: false };

  if (!config.allowRealPublish) {
    throw new PocError(
      ErrorCode.POLICY_BLOCKED,
      '真实发布总开关未开启（ALLOW_REAL_PUBLISH=false），默认禁止对外发布'
    );
  }
  if (!confirmPublish) {
    throw new PocError(
      ErrorCode.POLICY_BLOCKED,
      '缺少人工确认参数 --confirm-publish，已阻止真实发布'
    );
  }
  const allowlist = config.publishAllowlist || [];
  if (!allowlist.length) {
    throw new PocError(
      ErrorCode.POLICY_BLOCKED,
      '未配置 PUBLISH_TARGET_ALLOWLIST，真实发布一律禁止'
    );
  }
  if (!targets.length) {
    throw new PocError(
      ErrorCode.POLICY_BLOCKED,
      '真实发布必须显式指定目标（provider:platform:account），禁止默认多平台发布'
    );
  }
  assertTargetShape(targets);
  assertLinkedInAuthorBinding(targets, authorUrn);
  const rejected = targets.filter((target) => !allowlist.includes(target));
  if (rejected.length) {
    throw new PocError(
      ErrorCode.POLICY_BLOCKED,
      `发布目标不在白名单：${rejected.map(maskTarget).join(', ')}`,
      { details: { targets: targets.map(maskTarget), allowlist: allowlist.map(maskTarget) } }
    );
  }
  return { allowed: true, real: true, targets };
}

export function assertMpWriteAllowed(config, { confirmMp = false } = {}) {
  if (config.mode === 'mock') return { allowed: true, real: false };
  if (!config.allowRealMp) {
    throw new PocError(
      ErrorCode.POLICY_BLOCKED,
      'GA4 Measurement Protocol 真实写入未开启（ALLOW_REAL_MP=false）'
    );
  }
  if (!confirmMp) {
    throw new PocError(
      ErrorCode.POLICY_BLOCKED,
      '缺少人工确认参数 --confirm-mp，已阻止真实事件写入'
    );
  }
  return { allowed: true, real: true };
}

// 真实与 Mock 的状态标签必须从同一处产生，禁止在 Demo 中手写混淆
export function statusLabel(real, ok) {
  if (!ok) return 'FAIL';
  return real ? 'PASS_REAL_API' : 'PASS_MOCK';
}
