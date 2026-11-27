# B5 冻结记录（2026-11-27）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-B5-FREEZE-001 |
| 状态 | **OWNER_DECIDED — FREEZE B5 — RECORDED_FROM_CONVERSATION — NOT_REGISTERED** |
| `DECISION_ID` | `NOT_GENERATED` |
| Owner 决定 | `FREEZE B5`（2026-11-27 15:46 Asia/Shanghai，对话记录） |
| Reviewer 结论 | `READY_FOR_FREEZE`（Owner 转达，2026-11-27 15:46；仓内无 Reviewer 原始回执） |
| 起草方 | 执行代理（转录）；非 Owner 原文、非 Reviewer 结论 |

## 1. 冻结对象

| 对象 | 固定位置 | 身份 |
|---|---|---|
| B5 规范正文 v0.8.1 | commit `7ad594135e341fe8fcbcdf869b33778e4f7a4811`：`reviewer_packets/20261127_B5_v0_8_1/B5_MINIMAL_NORMALIZATION_RULES_v0_8_1_DRAFT.md` | SHA-256 `e4f737aa92d59e69fb5abf7c6dbd330788a2745c00365409fb1bebd443845006` |
| 向量文件 v0.8.1 | 同上目录 `T8_VECTORS_AND_DISPOSITION_v0_8_1_DRAFT.md` | SHA-256 `a58b71f2d884a71c6756d6c60f7435b4173b4117eefa85cfffc30f8c80fb751f` |
| 算法版本 | `b5-min-v0.2` | OWNER_ACCEPTED（2026-11-27 15:14） |
| 验证材料 v0.8.3 | commit `ad96946df898df97f99b5dba95ed429048026f2f`：`reviewer_packets/20261127_B5_v0_8_3/b5_v0_8_3_verify.py` | SHA-256 `f10e5a9ee115e2c141f123137e6dc4aae0aabd5a9ba3e70e71a21c07ea1a54dc` |
| G1 证据裁定 | commit `6c961386d0225a00cbad9d6a9eb44d99c7205263`：`reviewer_packets/20261127_B5_G1_OWNER_DECISION/` | SHA-256 `5f20ff3cc5635905022e0fa37284fe50fb5ae98698f423247fc93b13fbdf051b` |
| SHA256 清单 | v0.8.1 / v0.8.2 / v0.8.3 三目录 | Reviewer 独立复算 12/12 PASS（按固定提交取文件内容计算；未执行字面 `sha256sum -c`） |

> 注：v0.8.1 文件名仍含 `_DRAFT`、正文状态行仍写 `DRAFT — NOT_FROZEN`。为保持已复核字节不变，**不修改**该文件；其冻结状态以本记录为准。

## 2. 证据摘要

| 门禁 | 证据 |
|---|---|
| G1 | Owner-run（Python 3.13.15 / Unicode 15.1.0，`RESULT PASS (exit 0)`）+ Reviewer 逻辑复算（Python 3.13.5 / Unicode 15.1.0），依 `6c96138` 裁定 |
| G2 | 53/53；与 v0.8.2 静态对照一致 |
| G3 | 全码点字符串幂等 0 反例 |
| G4 | KEY-01 `pbk1_e71ca20eeb028ce1450e733f3d162a97fb72adb45061dc5ba642fde0f70affaf` |
| G5 | 重复触发计数 DUP-01…03 PASS |

## 3. 冻结边界

1. **P2 及原因码 `BRAND_TRUST_INVALID` 排除在冻结范围之外**，继续 `PROPOSED`；
2. v0.8.1 §8.1 四条 P2 执行边界继续有效：P2 非有效规则；`TRUSTED` 校验失败不生成 Business Key；不得映射为任何其他原因码或 `RESOLVED`；处置待 Owner 另定；
3. 冻结**不等于**：P2 批准、规范生效（EFFECTIVE）、实施授权（IMPLEMENTATION_AUTHORIZED）、生产授权；
4. F-04（`PENDING_INDEPENDENT_REVIEW`）、CAND-09（`BLOCKED`）、B-1（`NOT_GRANTED / NOT_EXECUTED`）、Business API（`NOT_READY`）状态不变；
5. 冻结后对冻结对象的任何语义修改须升算法版本并重新复核、重新冻结。

## 4. 保留限制

1. 规定环境（Python 3.13.15）的原脚本运行仅为 Owner-run；
2. Reviewer 复核结论与本次 Owner 决定均来自对话转达，仓内无原始回执；
3. 本记录未登记，`DECISION_ID` 未生成。

## 5. 状态

| 项 | 状态 |
|---|---|
| B5（不含 P2） | **FROZEN**（自本记录提交推送并核验后生效于仓库记录） |
| P2 | `PROPOSED` |
| `b5-min-v0.2` | `OWNER_ACCEPTED` |
| 规范生效 / 实施授权 | 未授予 |
