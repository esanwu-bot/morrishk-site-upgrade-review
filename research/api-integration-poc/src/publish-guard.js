import { PocError, ErrorCode } from './errors.js';

export function assertPublishAllowed(config, { confirmPublish = false, targets = [] } = {}) {
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
  const rejected = targets.filter((target) => !allowlist.includes(target));
  if (rejected.length) {
    throw new PocError(
      ErrorCode.POLICY_BLOCKED,
      `发布目标不在白名单：${rejected.join(', ')}`,
      { details: { targets, allowlist } }
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
