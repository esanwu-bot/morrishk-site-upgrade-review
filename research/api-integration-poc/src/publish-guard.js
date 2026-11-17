import { PocError, ErrorCode } from './errors.js';

export function assertPublishAllowed({ mode, allowRealPublish }, { confirmPublish = false } = {}) {
  if (mode === 'mock') return { allowed: true, real: false };
  if (!allowRealPublish) {
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
  return { allowed: true, real: true };
}
