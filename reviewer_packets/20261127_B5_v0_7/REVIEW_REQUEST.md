# 独立 Reviewer 复核请求：B5 v0.7（2026-11-27）

| 项 | 值 |
|---|---|
| 状态 | **REVIEW_REQUESTED — 执行方自检完成，非 Reviewer 结论** |
| 对象 | B5 v0.7-DRAFT 与 T8 / M1 / M2 / 空白向量 v0.7-DRAFT |
| 原件 | `E:\workspace\.scratch\morrishk-owner-decision\74_sessionb_b1_b5_contract_r6\`（未跟踪；本目录为逐字节副本） |
| 前一复核包 | commit `813012077b4ef89c74da6af1d2f4b1ba13e38fdf`，`reviewer_packets/20261127_F04_B5_v0_6/`（含 v0.6 依据源文件） |
| 效力 | 不构成冻结、批准或授权 |

## 0. 内容

| 文件 | 说明 |
|---|---|
| `B5_MINIMAL_NORMALIZATION_RULES_v0_7_DRAFT.md` | v0.7 草稿 |
| `T8_VECTORS_AND_DISPOSITION_v0_7_DRAFT.md` | 48 项向量与参考计算 |
| `baseline_v0_6/` | v0.6 两个文件的逐字节副本，便于 diff |
| `REVIEW_REQUEST.md` | 本文件 |
| `SHA256SUMS` | 本目录各文件 |

## 1. Owner 裁定（2026-11-27 15:01，对话记录）

- §2.2 casefold 展开机制：接受，纳入 v0.7 候选规则；
- §2.2 NFKC 兼容映射机制：接受，纳入 v0.7 候选规则；
- P2 `BRAND_TRUST_INVALID`：暂缓批准，保持 `PROPOSED`，排除在本版冻结范围之外。

## 2. 请复核

1. v0.6 → v0.7 的 diff 是否与 §0 变更表一致，有无未披露变更；
2. M2（§2.2.3）：`NFKC(c) ≠ NFC(c)` 且 `c ∉ E2`；E2 = U+FF01–U+FF5E + §2.3 允许空白。是否准确落实 OD-47-01/02，豁免是否过宽或过窄；
3. M1（§2.2.4）：NFKC 输出中 `len(casefold(c)) ≠ 1`。是否准确落实 OD-47-03/03a；
4. M2 置于原始扫描、M1 置于 NFKC 后的执行位置是否合理；
5. P2 是否确未被升级；§8.1 冻结范围声明与“排除 P2 后 TRUSTED 校验失败无确定原因码”的后果披露是否充分；
6. 独立复算 48 项向量（建议用项目 Python / Unicode 版本）；
7. 给出 B5 v0.7 结论（READY_FOR_FREEZE / NOT_READY_FOR_FREEZE）。

## 3. 执行方已知未决项（不要求 Reviewer 裁定）

算法版本是否升版；P2 批准；P2 排除期间的处置；正式测试 Unicode 基准（参考计算为 Python 3.12.16 / Unicode 15.0.0）；Brand 契约 B2 新版。
