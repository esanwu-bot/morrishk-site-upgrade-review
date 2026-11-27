# F-02 后续综合报告：重新确认记录归档 / DEFER 六要素缺口 / 审计规范版本对照（2026-11-27）

| 项 | 值 |
|---|---|
| 状态 | **REVIEW_REQUESTED — 执行方自检，非 Reviewer 结论** |
| 起草方 | 执行代理（AWS Quick） |
| 效力 | 不关闭 F-02；不修改任何历史文件或 Owner 确认记录；不构成任何授权 |

## 1. 归档执行回执（Owner 本机执行，执行方转录）

| 项 | 结果 |
|---|---|
| 仓库 / 分支 | `esanwu-bot/morrishk-site-upgrade-review` / `docs/sessionb-owner-decision-register`（工作树 `E:\workspace\.scratch\morrishk-owner-decision`） |
| 执行前预检 | `git fetch origin` 后 `HEAD` = `origin/docs/sessionb-owner-decision-register` = `ac96ccb347ce5a5cf67d1e8e68a18828233ba14b`；`git status --short --branch` 无 ahead/behind |
| 暂存内容 | 仅 `79_sessionb_b1_blk_a_owner_reconfirmation/OWNER_RECONFIRMATION_D01_D09_20261127.md` 与同目录 `SHA256SUMS`（2 × `A`） |
| commit | `22a09c088a5a740981e0047048ed2048c643af94`，父 `ac96ccb`；2 files, +111；AuthorDate 2026-11-27 16:55:21 +0800 |
| 提交说明 | `docs(dsbit): archive Owner reconfirmation of D-01/D-09 field decisions (2026-11-27, not retroactive)` |
| push | `ac96ccb..22a09c0`，fast-forward，无 force |
| 执行后 | 再次 fetch：`HEAD` = `origin/...` = `22a09c088a5a740981e0047048ed2048c643af94` |
| 远端回读 | `git show origin/docs/sessionb-owner-decision-register:79_.../OWNER_RECONFIRMATION_D01_D09_20261127.md` → `certutil` SHA-256 = `09ffb000a4a136ccc1990f31cd270475bdd2be09808cba86be136e8e268b1efd`，与写入时一致 |
| CRLF 风险 | 回读内容即提交 blob 字节，与写入文件 SHA-256 一致 ⇒ 提交时未发生换行转换 |
| 未修改 | 原 ballot、正式 D-01 OD、草案 v2.x、DERIVED、F-03（71_）、F-04 记录均不在该提交内 |
| F-02 | 仍 `OPEN / HIGH`；不由执行方关闭 |

## 2. DEFER 六要素缺口

### 2.1 规则原文（ballot `d2b6dcac…7bdc`）

- §1.4（第 52 行）：“`DEFER` 必须同时具备六要素，缺一即视为该字段未完成：①原因 ②影响范围 ③缺失信息 ④补齐责任方 ⑤期限或触发条件 ⑥临时处置。”
- §3.1 第 116 行：`RETENTION_PERIOD` 的 `DEFER`（六要素）。
- §3.3 第 3 条（第 134 行）：`INTERIM_RETENTION_POLICY` 的 `DEFER`“必须六要素完整（§1.4）”。
- §3.6 补充硬规则 1（第 181 行）：“六要素不全的 `DEFER` 视为字段未完成，不计入有效 `DEFER`；若没有其他符合 `DEFERRED` 条件的字段，整卡应为 `PARTIALLY_DECIDED`。”

### 2.2 适用性与缺口

| 卡 / 字段 | 79_ 重新确认 | 六要素现状 | 缺口 |
|---|---|---|---|
| D-01 `MODEL` | `DEFER` | §1.4 为通则，**同样适用**。正式 OD §3 已有六要素文本（来源 Reviewer 建议稿，`NOT_OWNER_VERBATIM = TRUE`；F-04 `CLOSED_WITH_FINDINGS`，OPEN-01 保留） | 79_ §2 **未重述**六要素，只写“不因本记录改变”。本次 Owner 重新确认是否**采纳** OD §3 六要素，未明示 |
| D-09 `RETENTION_PERIOD` | `DEFER` | 无任何六要素文本 | **①②③④⑤⑥ 全缺** |
| D-09 `INTERIM_RETENTION_POLICY` | `DEFER`（因 `RETENTION_PERIOD = DEFER` 而适用，§3.3 第 1 条） | 无任何六要素文本 | **①②③④⑤⑥ 全缺** |

### 2.3 按 §3.6 推导的后果（执行方推导，待 Reviewer 确认）

| 卡 | `PENDING_FIELDS` | `BLOCKING_DEPENDENCY` | `CARD_OVERALL` |
|---|---|---|---|
| D-01 | `{NEW_FIELD_NAME}` | `NONE` | 若 MODEL 六要素被确认采纳 ⇒ `DEFERRED`；否则 ⇒ `PARTIALLY_DECIDED` |
| D-09 | `{RETENTION_PERIOD, INTERIM_RETENTION_POLICY}`（DEFER 无效，计为未完成） | `STATUS_FIELD_NAMESPACE = PENDING_D01_OUTCOME`（仅禁止 COMPLETE） | `PARTIALLY_DECIDED`（无有效 DEFER） |

执行方不代 Owner 填写任何要素。

## 3. 审计规范 63_ / 66_ 对照

| 项 | 63_ | 66_ |
|---|---|---|
| 路径 | `63_sessionb_blk_a_dual_state_alignment/BLK_A_STATE_TRANSITION_AUDIT_SPEC.md` | `66_sessionb_blk_a_alignment_revision/BLK_A_STATE_TRANSITION_AUDIT_SPEC.md` |
| SHA-256 | `4426cf130f99ff8e1e3c61ee310ea51ed8d1cd732273525c3da8f709348792aa` | `891006a1835e59630b8cfbfacf1039dc45d97e47150aef8d08cd8ecdf853b7fc`（与 69_ §2.1 记载一致） |
| 文档编号 / 版本 | `MRH-DSBIT-SESSIONB-B1-BLK-A-AUDIT-001` / `v0.1-DRAFT` | 同编号 / `v0.2-REVISION-DRAFT`（“63_ 的修订候选；不覆盖 63_ 原件”） |
| 文件头状态 | `DRAFT / NOT_APPROVED / NOT_EFFECTIVE` | `REVISION_DRAFT / NOT_APPROVED / NOT_EFFECTIVE` |
| Owner 处置 | 无 | 69_ `OD-BLK-A-R2-ACCEPT-01`（`OWNER_ACCEPTED — NOT_EFFECTIVE`）A 项接受 R2 五处修订；§3 第 1 条：“66_ 不生效：`REVISION_ACCEPTED — NOT_EFFECTIVE`；最终规范批准仍 `PENDING_OWNER_REVIEW`” |
| “§1” 内容 | **必填字段（最小集合）11 项** | **记录种类 K1–K4**；字段改在 §3“字段条件矩阵”，共 24 项 |
| 跟踪状态 | 未跟踪（`??`） | 未跟踪（`??`） |

### 3.1 11 个字段逐项差异

| 63_ §1 | 66_ §3 | 差异 |
|---|---|---|
| 1 `transition_id`，是 | #1，K1 恒必填 | K2 改用 #2 `attempt_id` |
| 2 `brand_id`，是 | #3，K1/K2 恒必填 | 基本一致 |
| 3 `previous_status`，是（首次 `NONE`） | #5，K1 恒必填；K2 可 `NULL` | K2 放宽 |
| 4 `new_status`，是 | #6，K1 恒必填；K2 可 `NULL` | K2 放宽 |
| 5 `reason_code`，是 | #7，K1 须在注册表；K2 可 `NULL` | K2 放宽；增加候选码拒绝码 |
| 6 `evidence_ref`，是 | #8，K1 恒必填（BT-1 以请求引用充当）；K2 可选 | K2 放宽；BT-1 特例 |
| 7 `authority_ref`，条件必填 | #10，条件增加 BT-7 | 条件扩大 |
| 8 `reviewer_id`，条件必填 | #11，条件增加 `BRAND_REJECTED` / `UNICODE_REVIEW_REQUIRED` / BT-4 / BT-7 / 任一 `PROPOSED_NEW` 码 | 条件扩大 |
| 9 `decision_timestamp`，是 | #15，恒必填 | 增加 `BACKDATED_TIMESTAMP` 校验 |
| 10 `rule_version`，是（“当前候选 `b5-min-v0.1`”） | #14，K1 须等于当前版本；K2 记请求值 | 去掉版本字面值 |
| 11 `decision_record_id`，是（指向 Owner 或授权方） | #12，K1 恒必填；**可指向 Owner 决定记录或系统不可变触发记录**（§11.1） | **语义扩大** |

另：66_ §3 新增 13 个字段（`attempt_id`、`domain`、`evidence_hash`、`approval_ref`、`effective_from`、`event_type`、`actor_id`、`actor_role`、`idempotency_key`、`supersedes_transition_id`、`correction_of_transition_id`、`previous_record_hash`、`denied_reason`）。

### 3.2 结论（只陈述）

1. ballot 第 114 行“11 字段取自审计规范 §1（`transition_id` … `decision_record_id`）”在**文本上只与 63_ v0.1 §1 对应**；66_ 的 §1 不是字段表。
2. 66_ 是已被 Owner 接受但**未生效**的修订版；63_ 与 66_ 均未批准、均未生效。
3. 79_ §3.1 引用的是 63_ v0.1 原文，并已注明版本归属待核对。选项 A 应绑定哪一版，**需 Owner 裁定**（见 §5 O-4）；执行方不选择。

## 4. B5 `b5-min-v0.1` / `b5-min-v0.2` 关系

1. 63_ 第 34 行“当前候选 `b5-min-v0.1`”是 2026-11-26 编写时对**当时候选值的描述**，位于 DRAFT 规范内，不是规范常量。
2. Owner 2026-11-27 15:14 `OWNER_ACCEPTED`：算法版本升至 `b5-min-v0.2`，替代 v0.1；B5 冻结记录（复核仓库 commit `f469e1d`）冻结 `b5-min-v0.2`（不含 P2）。
3. B5 v0.8.1 §5.1：`rule_version` 不同即 Key 不同，v0.1 下的 Key 不得与 v0.2 混用。
4. 66_ #14 的“须等于当前版本”与冻结后的 v0.2 **相容**；63_ 的字面值已**过时**。
5. 结论：不存在需要改写历史文件的冲突；但若选项 A 绑定 63_ v0.1 原文，须明确“当前候选 `b5-min-v0.1`”按冻结后的 `b5-min-v0.2` 理解（见 §5 O-5）。执行方不修改 63_、66_ 或 79_。

## 5. 需要 Owner 裁定的事项（合并）

| # | 事项 | 影响 |
|---|---|---|
| O-1 | D-09 `RETENTION_PERIOD`：补齐 DEFER 六要素，或改为 ACCEPT（具体期限 + 适用范围）/ REJECT（替代保留方向） | D-09 卡状态；F-02 |
| O-2 | D-09 `INTERIM_RETENTION_POLICY`：同上（适用 §3.3 第 2–4 条） | 同上 |
| O-3 | D-01 `MODEL = DEFER` 的重新确认是否采纳正式 OD §3 六要素文本 | D-01 卡是 `DEFERRED` 还是 `PARTIALLY_DECIDED`；F-02 |
| O-4 | D-09 选项 A 的 11 字段绑定 63_ v0.1 §1，还是 66_ §3 中对应字段（含其条件与 `decision_record_id` 语义扩大） | D-09 字段集含义 |
| O-5 | 若绑定 63_：确认 `rule_version` 示例值按冻结的 `b5-min-v0.2` 理解 | 与 B5 冻结一致 |

O-1 至 O-5 的回答记录方式（新建记录或补充 79_ 的后续记录）由 Owner 另行授权；执行方不修改已提交的 79_。

## 6. 请 Reviewer 复核

1. §1 回执是否足以证明 79_ 已按原文推送；
2. §2.2 缺口判断与 §2.3 推导是否正确；
3. §3.1 逐项差异是否准确；§3.2 与 §4 结论是否成立；
4. 在 O-1 至 O-5 裁定前，F-02 能否进入关闭复核，或维持 `OPEN / HIGH`。
