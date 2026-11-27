# Owner 裁定：B5 G1 规定环境证据的满足方式（2026-11-27）

| 项 | 值 |
|---|---|
| 状态 | **OWNER_DECIDED — RECORDED_FROM_CONVERSATION — NOT_REGISTERED** |
| `DECISION_ID` | `NOT_GENERATED` |
| 裁定时间 | 2026-11-27 15:40 Asia/Shanghai（对话中选择） |
| 起草方 | 执行代理（转录）；非 Owner 原文、非 Reviewer 结论 |
| 对象 | B5 验证脚本 `ad96946:reviewer_packets/20261127_B5_v0_8_3/b5_v0_8_3_verify.py` 的 G1（Python 3.13.15 / Unicode 15.1.0） |

## 1. 裁定

接受以下两项**合并**作为 G1 规定环境证据的满足条件：

1. **Owner-run 证据**：Owner 本机 Python 3.13.15 / Unicode 15.1.0 运行 v0.8.3 原脚本，`RESULT PASS (exit 0)`，`%ERRORLEVEL%` = 0（2026-11-27 约 15:35，对话记录）；
2. **Reviewer 逻辑复算**：Reviewer 在 Python 3.13.5 / Unicode 15.1.0 对 G3、G4、G5 核心逻辑独立复算通过，G2 静态对照通过（Reviewer 2026-11-27 15:40 意见）。

## 2. 限制条件（须随冻结结论保留）

1. 规定环境（Python 3.13.15）下的原脚本运行**仅由 Owner 执行**，Reviewer 未在该环境独立运行；
2. Reviewer 环境的 Unicode 数据版本（15.1.0）与规定环境一致，Python 补丁版本不同（3.13.5 vs 3.13.15）；
3. 本裁定**不**改变 G1 脚本门禁本身，也不把 Owner-run 结果称为 Reviewer 独立 PASS；
4. 本裁定只解决 G1 证据方式，**不**构成 B5 冻结、规范批准、生效或实施授权；三个目录 SHA256SUMS 的 Reviewer 独立复算仍需完成。

## 3. 不变

`b5-min-v0.2`（OWNER_ACCEPTED）；P2 `PROPOSED` 及 §8.1 四条边界；B5 `NOT_READY_FOR_FREEZE`（待 Reviewer 重新评估）；F-04、CAND-09、B-1、Business API。
