# 独立 Reviewer 复核请求：B5 v0.8（2026-11-27）

| 项 | 值 |
|---|---|
| 状态 | **REVIEW_REQUESTED — 执行方自检完成，非 Reviewer 结论** |
| 对象 | B5 v0.8-DRAFT 与向量 v0.8-DRAFT |
| 原件 | `E:\workspace\.scratch\morrishk-owner-decision\75_sessionb_b1_b5_contract_r7\`（未跟踪；本目录为逐字节副本） |
| 触发 | Reviewer 对 commit `e784034` 的复核意见：§2.1 第 9 步幂等性与 M1/M2 冲突；P2 执行边界 |
| 前序复核包 | `8130120`（F-04 / B5 v0.6）；`e784034`（B5 v0.7） |
| 效力 | 不构成冻结、批准或授权 |

## 0. 内容

| 文件 | 说明 |
|---|---|
| `B5_MINIMAL_NORMALIZATION_RULES_v0_8_DRAFT.md` | v0.8 草稿 |
| `T8_VECTORS_AND_DISPOSITION_v0_8_DRAFT.md` | 53 项向量（新增 IDEM-01…05） |
| `baseline_v0_7/` | v0.7 两个文件逐字节副本，便于 diff |
| `REVIEW_REQUEST.md` / `SHA256SUMS` | 本文件 / 校验清单 |

## 1. 请复核

1. v0.7 → v0.8 diff 是否与 §0 变更表一致，有无未披露变更；
2. §2.6 三分输出（`diagnostic_norm` 字符串幂等 / `identity_status` 仅由原始输入判定 / `review_triggers`）是否消除了第 9 步的冲突；
3. §2.6 约束 3–5（禁止回灌、不继承不丢失、仅人工解除）是否充分回应“诊断值作新输入时不得继承或丢失风险来源”；
4. IDEM-01…05 是否覆盖该问题；IDEM-05 作为对照是否恰当；
5. §8.1 P2 四条执行边界是否足够明确；
6. 在项目环境（Python 3.13.15 / Unicode 15.1.0）独立复算 53 项向量及 §2.6 穷举；
7. 给出 B5 v0.8 结论（READY_FOR_FREEZE / NOT_READY_FOR_FREEZE）。

## 2. 已知未决项（不要求 Reviewer 裁定）

算法版本是否升为 `b5-min-v0.2`（Reviewer 已建议升版，Owner 未裁定）；P2 批准；P2 排除期间处置；Brand 契约 B2 新版。
