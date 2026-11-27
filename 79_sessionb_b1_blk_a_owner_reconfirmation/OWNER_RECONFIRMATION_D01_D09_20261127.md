# BLK-A Batch 1｜D-01 / D-09 Owner 逐字段重新确认记录（2026-11-27）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-BLK-A-RECONFIRM-001 |
| 版本 | v1.0 |
| 记录日期 | 2026-11-27 |
| 记录性质 | **Owner 新一轮逐字段重新确认（RECONFIRMATION）**；不是对历史裁定的追溯证明 |
| 决定来源 | Owner 于 2026-11-27 在 ChatGPT 对话中作出的重新确认，经 Owner 以执行任务书形式转交执行代理（AWS Quick）归档 |
| 证据性质 | Owner 授权的执行代理转录；本文件不含 Owner 对话原文，也不含 Owner 签名 |
| 登记状态 | `NOT_REGISTERED`；`DECISION_ID = NOT_GENERATED` |
| 效力 | 仅证明本次重新确认；**不**使任何决定生效（EFFECTIVE），**不**构成规范批准、实施授权、存储授权或生产授权 |
| 起草方 | 执行代理（转录）；非 Owner 原文、非 Reviewer 结论 |

## 1. 记录目的与边界

1. 针对 finding **F-02**（裁定载体空白，无法独立证明 Owner 已作出 D-01 / D-09 逐字段裁定），提供一份**新的**、可追溯的 Owner 决定证据。
2. 本次确认的日期为 2026-11-27，内容为下文 §2–§4 所列字段值；**不得**将本记录的日期或内容冒充为原始裁定的日期、原始会话原话或原始签署。
3. 本记录不补填、不改写原 ballot；不修改正式 D-01 OD 或其历史草案；不创建 D-09 历史 OD。
4. F-02 是否关闭，由独立 Reviewer 依据本记录及原始证据链另行复核；执行代理不自行关闭。

## 2. D-01（GAP-01 Product identity enum 兼容）重新确认

| 字段 | 决定类型 | 选项值 | 说明 |
|---|---|---|---|
| `MODEL` | `DEFER` | —（不填） | — |
| `NEW_FIELD_NAME` | 未裁定（`PENDING`） | — | 仍待 `MODEL` 结论；不预填 `N/A` |
| `LEGACY_VALUES_RETAINED` | `ACCEPT` | `YES` | 按 ballot §2.1 第 3 行：仅回答 59_ 现有字段与取值是否继续存在，**不等于**写权限，**不等于** `MISSING`/`REJECTED` 语义已定 |
| `RULE_VERSION_POLICY` | `ACCEPT` | `NEW_VERSION` | — |

`MODEL = DEFER` 的六要素本记录**不重新给出**；正式 OD `OD-BLK-A-B1-D01-ENUM-01` §3 的六要素文本及其 F-04 关闭范围（commit `ca267f9`，`CLOSED_WITH_FINDINGS`，OPEN-01 保留）不因本记录改变。

## 3. D-09（GAP-09 审计授权与格式）重新确认

| 字段 | 决定类型 | 选项值 | 说明 |
|---|---|---|---|
| `AUDIT_FIELD_SET` | `ACCEPT` | `A`（11 必填字段 + append-only） | 字段清单见 §3.1 |
| `AUDIT_ROLE_MATRIX` | `ACCEPT` | `ADOPT_AS_PROPOSED` | 按 ballot §3.1：角色定义与委派本身仍属 GAP-13；不构成权限或操作授权 |
| `RETENTION_PERIOD` | `DEFER` | — | 六要素：**本次重新确认未提供**（见 §6 未决） |
| `INTERIM_RETENTION_POLICY` | `DEFER` | — | 按 ballot §3.3 第 1 条在 `RETENTION_PERIOD = DEFER` 时适用；六要素：**本次重新确认未提供**（见 §6 未决） |

### 3.1 选项 A 的 11 个必填字段（引用原文，不改写）

来源：ballot `BLK_A_BATCH1_OWNER_ADJUDICATION_BALLOT_v0.4-MERGED.md` 第 114 行写明“11 字段取自审计规范 §1（`transition_id` … `decision_record_id`）”。对应原文为 `63_sessionb_blk_a_dual_state_alignment/BLK_A_STATE_TRANSITION_AUDIT_SPEC.md`（v0.1-DRAFT，SHA-256 `4426cf130f99ff8e1e3c61ee310ea51ed8d1cd732273525c3da8f709348792aa`）§1 第 23–35 行，逐行引用如下：

| # | 字段 | 类型（逻辑） | 必填 | 说明 |
|---|---|---|---|---|
| 1 | `transition_id` | string（全局唯一） | 是 | 转换记录主键；一经分配不复用 |
| 2 | `brand_id` | string | 是 | 被转换的 Brand 稳定标识（非显示名；与 `brand_provided_by_entity_id`/`brand_trust_authority_entity_id` 区分） |
| 3 | `previous_status` | enum | 是 | 转换前 `brand_trust_status`；首次建立时允许 `NULL`（约定值 `NONE`） |
| 4 | `new_status` | enum | 是 | 转换后 `brand_trust_status`（`UNVERIFIED`/`PENDING_BRAND`/`TRUSTED`/`BRAND_TRUST_INVALID`，PROPOSED） |
| 5 | `reason_code` | enum | 是 | 来自 `BLK_A_REASON_CODE_STATE_MAPPING.md` 注册表；尚未批准的候选码不得使用 |
| 6 | `evidence_ref` | string | 是 | 不可变证据引用（内容寻址/版本化引用）；不得内联可变路径 |
| 7 | `authority_ref` | string | 条件必填 | 授权/背书记录引用；`TRUSTED` 与 `BRAND_TRUST_INVALID` 相关转换必需 |
| 8 | `reviewer_id` | string | 条件必填 | 人工复核者稳定标识；`强制人工复核=是` 的原因码必需 |
| 9 | `decision_timestamp` | timestamp（UTC） | 是 | 决定实际发生时间；不得回填/倒签 |
| 10 | `rule_version` | string | 是 | 转换所依据的规则版本（当前候选 `b5-min-v0.1`） |
| 11 | `decision_record_id` | string | 是 | 指向批准/决定记录（Owner 或授权方）；不得为空或自引用 |

append-only 依据同文件 §0 第 2 条：“记录一经写入不得修改或删除；更正以新记录表达。”

引用注记（只陈述，不裁定）：
1. 该规范状态为 `DRAFT / NOT_APPROVED / NOT_EFFECTIVE`；本次确认选项 A **不**使该规范批准或生效。
2. 原文第 10 行写“当前候选 `b5-min-v0.1`”；B5 冻结记录（commit `f469e1d`）的算法版本为 `b5-min-v0.2`。本记录照原文引用，不改写；两者如何对齐须另行处理。
3. 第 4 行引用 `BRAND_TRUST_INVALID`（PROPOSED）；B5 冻结已将 P2 / `BRAND_TRUST_INVALID` 排除在外。本记录不改变其 `PROPOSED` 状态。
4. 66_ 目录有该规范的修订版（`66_sessionb_blk_a_alignment_revision/BLK_A_STATE_TRANSITION_AUDIT_SPEC.md`，SHA-256 `891006a1835e59630b8cfbfacf1039dc45d97e47150aef8d08cd8ecdf853b7fc`，`REVISION_ACCEPTED — NOT_EFFECTIVE`），其章节结构不同。ballot 第 114 行所指为“审计规范 §1（`transition_id` … `decision_record_id`）”，与 63_ v0.1 §1 一致；**选项 A 指向哪一版，以 Reviewer 核对为准**。

## 4. Owner 明确保留的限制

| 字段 | 状态 |
|---|---|
| `STORAGE_AUTHORIZATION` | `NOT_GRANTED` |
| `STATUS_FIELD_NAMESPACE` | `PENDING_D01_OUTCOME` |

D-09 的字段确认**不得**解释为存储授权、数据迁移授权、实施授权或生产授权。

## 5. 与历史记录的关系

| 对象 | 关系 |
|---|---|
| 原 ballot `batch1_ballot_v0.4_merged/BLK_A_BATCH1_OWNER_ADJUDICATION_BALLOT_v0.4-MERGED.md`（SHA-256 `d2b6dcaca9221499b4b96a1b32daba69f1c3c586e276dc4310c5eaaa540a7bdc`） | 保持 `NOT_SIGNED / NOT_FILLED / DECISION_ID = NOT_GENERATED`；**不补填、不改写** |
| 正式 D-01 OD `70_sessionb_b1_blk_a_d01_enum_od/OD_BLK_A_B1_D01_ENUM_01.md`（SHA-256 `b7ad0fec7539a33f5930e66a67a3882d8a07c633eeaa5699533ce2b94a0fee74`） | 保持不变；本记录不修改其历史内容，不补造历史签名。其 §2 四项字段值与本记录 §2 一致（执行代理比对；待 Reviewer 核对） |
| D-01 草案 v2.1 / v2.2 / v2.3 及 DERIVED | 保持不变 |
| D-09 OD | 仓库中**不存在**；本记录不是 D-09 OD，也不使 D-09 OD 被视为历史上已存在 |
| F-02 | 维持 `OPEN / HIGH`；本记录是其关闭复核的输入，不是关闭 |
| F-03 | `CLOSED_WITH_SCOPE_LIMITATION`，不变 |
| F-04 | `CLOSED_WITH_FINDINGS`（commit `ca267f9`），OPEN-01 保留，不变 |

## 6. 未决与已知缺口（只陈述）

1. **D-09 两项 DEFER 的六要素**：ballot §1.4 / §3.3 第 3 条要求 `DEFER` 须六要素完整，否则视为字段未完成。本次重新确认只给出决定类型 `DEFER`，**未提供**六要素；执行代理不代填。按 ballot §3.6 规则，D-09 卡级状态因此尚不能推导为 `DEFERRED`，留待 Owner 补充及 Reviewer 判定。
2. **D-09 卡级推导字段**（`PENDING_FIELDS` / `BLOCKING_DEPENDENCY` / `CARD_OVERALL`）：本记录不推导，交 Reviewer 按 ballot §3.6 判定。
3. **选项 A 指向的规范版本**：见 §3.1 引用注记第 4 条。
4. **决定原文**：本记录为转录；Owner 对话原文未随本记录归档。

## 7. 未授权事项

本记录**不**授权：补填原 ballot；修改正式 OD 或冻结件；创建 D-09 OD；生成 `DECISION_ID`；规范批准或生效；代码、数据库、DDL、存储、迁移、API、OAuth 或生产操作；B-1 执行；Business API 实施。

## 8. Reviewer 后续复核要求

1. 核对本记录 §2 与正式 D-01 OD §2 是否逐字段一致；
2. 核对 §3.1 的 11 字段与 63_ 审计规范 §1 原文逐行一致，并判断选项 A 应指向哪一版规范；
3. 判断本记录（Owner 重新确认 + 执行代理转录、无签名、无对话原文）能否作为 F-02 的关闭依据，以及关闭范围；
4. 判断 D-09 两项 `DEFER` 缺六要素对 F-02 关闭及 D-09 卡级状态的影响；
5. 给出 F-02 结论。

## 9. 文件身份

本文件不内嵌自身哈希；SHA-256 见同目录 `SHA256SUMS` 及提交回执。
