# Owner 裁定记录｜F-04 基准与 BLK-A…BLK-D（2026-11-27）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-OD72-001 |
| 版本 | v0.1-DRAFT |
| 日期 | 2026-11-27 |
| 状态 | **DRAFT — RECORDED_FROM_CONVERSATION — NOT_REGISTERED — NOT_EFFECTIVE** |
| `DECISION_ID` | `NOT_GENERATED` |
| 决策来源 | Owner 在 AWS Quick 对话中逐项选择（2026-11-27 14:29、14:30 Asia/Shanghai） |
| 起草方 | 执行代理（AWS Quick）；**非 Owner 原文、非 Reviewer 结论** |
| 写入授权 | Owner 2026-11-27 14:30：起草裁定记录 + B5 下一版草案；DRAFT / NOT_EFFECTIVE；仅新建、不覆盖、不 commit；写入 `.scratch` 工作树 |
| 依据材料 | `61_/BLK_A_D_OWNER_DECISION_BRIEF.md`；`60_/B5_FULL_REVIEW_R3.md`；`70_/OD_BLK_A_B1_D01_ENUM_01.md` |

> 本文件是对话中 Owner 选择的**转录**。Owner 未提供逐字理由；“裁定内容”栏以 61_ Brief 的选项原文为准。本文件不构成规则批准、B5 冻结、P-06 批准或 B-1 授权。

## 1. 裁定表

| # | 事项 | Owner 选择 | 裁定内容（引自 61_ Brief / 对话选项） | 效力 |
|---|---|---|---|---|
| 1 | F-04 六要素对账基准 | **以 v2.1 为基准** | 以 `batch1_od_drafts/OD_DRAFT_D01_v2.1.md`（SHA-256 `d197de4f16f4b4380bf71b8e0d90c6b5cf6c447d53c6591e8aafe735ca83c269`）为六要素对账基准；接受正式 OD ② 的标识替换 `D-0x → BLK-A-B1-D-0x` | F-04 → `CLOSURE_CANDIDATE — PENDING_INDEPENDENT_REVIEW` |
| 2 | BLK-A（Brand B2 与状态机冲突） | **A1** | B2 改为：`TRUSTED` 但 authority / evidence / 实体分离缺失或无效 → `PENDING_BRAND / BRAND_TRUST_INVALID`，补原因码；与 §4 / B5 / Product 一致；P2 维持 `PROPOSED` | Owner 方向；未生效 |
| 3 | BLK-B（T8 向量承接冲突） | **B1** | 下一版修订 T8 表：T8-11 → `INVALID_INPUT`；T8-12 → `NEEDS_REVIEW`；T8-07 → `ACCEPT_WITH_FLAG`（按 48_ OD-47-03a/04） | Owner 方向；未生效 |
| 3a | T8-06 / T8-09 / T8-15 | **三项均 ACCEPT** | T8-06 开尔文符号 `U+212A → k`；T8-09 希腊 `ΟΣ → οσ`；T8-15 `e + U+0301 → é`：均 `ACCEPT`。此前三项无 48_ 裁定，本裁定为其 Owner 依据 | Owner 方向；未生效 |
| 4 | BLK-C（算法本体缺失与空白集冲突） | **C1 + 允许 TAB/LF/CR** | 下一版 B5 内联完整算法（原始扫描、NFKC、空白、casefold、标点、幂等）；51_ / 52_ 转历史；明确 U+0009 / U+000A / U+000D 为允许空白 | Owner 方向；未生效 |
| 5 | BLK-D（P1 `REJECTED → INVALID_INPUT` 依据） | **D1** | 确认 59_ 现状：`brand_trust_status = REJECTED → INVALID_INPUT / BRAND_REJECTED`；本记录即为 Brief 所要求的独立 OD-49 Owner 依据记录 | Owner 方向；未生效 |

## 2. F-04 关闭候选（执行方自检，非 Reviewer PASS）

| 对象 | SHA-256（执行方 2026-11-27 复算） | 六要素与 v2.1 比较 |
|---|---|---|
| `batch1_od_drafts/OD_DRAFT_D01_v2.1.md` | `d197de4f16f4b4380bf71b8e0d90c6b5cf6c447d53c6591e8aafe735ca83c269` | 基准 |
| `batch1_od_drafts/OD_DRAFT_D01_v2.2.md` | `330373175f697481240cbd0efd527617555dcb81143bc20575c57262741124fc` | 逐字一致 |
| `batch1_od_drafts/OD_DRAFT_D01_v2.3.md` | `01f34bc0fc58d64d38474302465de49d160c62e04c6d4194cdc57e333a791e82` | 逐字一致 |
| `batch1_od_drafts/pre_correction_DERIVED/OD_DRAFT_D01_v2.3_DERIVED_pre_correction.md` | `93e7ee2bf23c08e825aaabf4076db6e4fe96b19f966e4520fc739278bb5430ce` | 逐字一致 |
| `70_…/OD_BLK_A_B1_D01_ENUM_01.md` | `b7ad0fec7539a33f5930e66a67a3882d8a07c633eeaa5699533ce2b94a0fee74` | 仅 ② 标识替换（OD §0.1 第 4 项已披露） |
| `70_…/pre_correction_DERIVED/OD_BLK_A_B1_D01_ENUM_01_DERIVED_pre_correction.md` | `2915fa81b101680039e5c2b6bab5c907b06427483a321056d8b0ee7ffe14df56` | 仅 ② 标识替换 |
| `batch1_ballot_v0.4_merged/BLK_A_BATCH1_OWNER_ADJUDICATION_BALLOT_v0.4-MERGED.md` | `d2b6dcaca9221499b4b96a1b32daba69f1c3c586e276dc4310c5eaaa540a7bdc` | 填写区全部空白；与 OD §7 自报值一致 |

保留限制：

1. 基准由 Owner 指定，而非与 Reviewer 原始建议稿逐字比对得出；OD `OPEN-01`（建议稿无文件）仍成立。
2. 关闭 F-04 需独立 Reviewer 复核本节；执行方不得自行关闭。
3. F-04 的关闭不传递给 F-02（`OPEN / HIGH`）或 F-03（`CLOSED_WITH_SCOPE_LIMITATION`）。

## 3. 后续动作（本记录允许的范围）

| 动作 | 状态 |
|---|---|
| 起草 B5 v0.6（落实 #2–#5） | 见 `73_sessionb_b1_b5_contract_r5/`（DRAFT） |
| 独立 Reviewer 复核 F-04 关闭候选与 B5 v0.6 | 待安排 |
| B5 冻结 | 需另行 Owner Decision |

## 4. 明确不包含的授权

- 不修改 29_–71_ 任何既有文件（含 59_ 与 70_ OD）；
- 不登记、不生成 `DECISION_ID`；
- 不冻结 B5、不批准 P2 / C5 / OD-BLK-A-01；
- 不关闭 P-05 / P-06 / P-07 / P-08 / P-09b / P-19，不签发 B-1；
- 不修改代码、测试、DB、DDL、API、OAuth 或生产；
- 不 commit、不 push。
