# OD 草案｜D-01（GAP-01）Product identity enum 兼容

| 项 | 值 |
|---|---|
| 文档编号 | `OD-DRAFT-D01-v2.2`（正式 `OD_ID = NOT_ASSIGNED`） |
| 文档类型 | OD 草案（`DRAFT`）；**非正式 OD 登记件** |
| 对应卡 / GAP | D-01 / GAP-01（Product identity enum 兼容） |
| 决定主体 | Owner（签名标识 `wuxiaoxian`） |
| Owner 确认时间 | 2026-11-27 |
| 编制授权 | `OD-D01 DRAFTING AUTHORIZED`（Owner 2026-11-27；仅限 D-01） |
| 内容基线 | `OD-DRAFT-D01-v2.1`（`CONTENT_BASELINE = v2.1`） |
| 状态 | `OWNER_CONFIRMED｜DRAFT｜NOT_REGISTERED｜NOT_FORMAL_OD｜DECISION_ID = NOT_GENERATED｜正式写文件授权 = NOT_GRANTED` |
| 效力层 | L1 方向已确认；L2 正式文本落实未授权；L3 未批准；L4 未生效；L5 无实施授权 |

## 0. 编制说明（非实质性）

1. 本文件依 Owner 2026-11-27 的 D-01 编制授权编制，内容基线为 `OD-DRAFT-D01-v2.1`。
2. 除封面、编制说明、授权边界及章节重编号外，其余内容按 v2.1 对话基线复现。由于 v2.1 未形成独立源文件，本轮未完成完整逐字或字节级比对；不得将内容复现表述为已通过逐字核验。
3. 本文件未新增任何裁定、未修改任何 Owner 已确认字段值、未对未确认事项作出解释或推定。
4. 本文件存放于仓库之外的 `.scratch` 工作目录，用于编制与哈希核验；**不构成正式 OD 登记**，仓库写入未获授权。

## 1. 决策来源与归属

| 项目 | 记录 |
|---|---|
| 决策来源 | Owner 在对话中确认采纳 Reviewer 逐字段建议 |
| 决策主体 | Owner（签名标识 `wuxiaoxian`，2026-11-27） |
| Reviewer 建议来源 | 本对话《BLK-A 批次 1｜逐字段评估（Reviewer 建议稿）》 |
| 建议稿文件路径 | `NOT_PROVIDED` |
| OD 裁定归属 | `OWNER_DECISION` |
| `DECISION_BASIS` | `OWNER_CONFIRMATION_OF_REVIEWER_PROPOSED_ADJUDICATION` |
| `INDIVIDUAL_REASON` | `NOT_STATED_BY_OWNER` |
| `REVIEWER_RATIONALE` | `AVAILABLE_IN_CONVERSATION` |

## 2. 逐字段裁定

| 字段 | 决策类型 | 选项值 | 备注 |
|---|---|---|---|
| `MODEL` | `DEFER` | —（不填） | 已完成的裁定字段；不因 `DEFER` 回填 `PENDING_FIELDS` |
| `NEW_FIELD_NAME` | 未裁定（`PENDING`） | — | Owner 标注 `PENDING — MODEL=DEFER`；按 `FILLING_NOTE-01` 不得预填 `N/A` |
| `LEGACY_VALUES_RETAINED` | `ACCEPT` | `YES` | 仅回答 59_ 现有字段/取值是否继续存在，不等于写权限、不等于 `MISSING`/`REJECTED` 语义已定 |
| `RULE_VERSION_POLICY` | `ACCEPT` | `NEW_VERSION` | — |

Owner 补充原话（**仅适用于 `MODEL`**）：“字段命名仍待模型决定”。

## 3. DEFER 六要素（`MODEL`）

来源标记：`SIX_ELEMENTS_SOURCE = REVIEWER 建议稿（本对话）`｜`TEXT_FIDELITY = 按 Reviewer 建议稿复现；如有编辑性调整，以本段实际文字为准`｜`NOT_OWNER_VERBATIM = TRUE`｜`EVIDENCE_IN_SESSION = PRESENT`｜`EVIDENCE_AS_FILE = NOT_PROVIDED`｜`REVIEW_STATUS = PENDING_EXACT_TEXT_RECONCILIATION`

| 要素 | 文本（按 Reviewer 建议稿复现；如有编辑性调整，以本段实际文字为准） |
|---|---|
| ① 原因 | 四值模型具体枚举值、语义、旧值映射和兼容读写规则尚未完整明确 |
| ② 影响范围 | D-01 模型决定、D-02 条件依赖、D-04 放行条件 |
| ③ 缺失信息 | 四值枚举定义、旧值映射、字段权威性、读写兼容规则和迁移方案 |
| ④ 补齐责任方 | Session B 提交技术对照材料；Reviewer 独立复核 |
| ⑤ 期限或触发条件 | 材料提交并通过独立复核后，重新提交 Owner 裁定 |
| ⑥ 临时处置 | 不改变现有 59_ 模型，不新增字段，不迁移数据，不启用四值模型 |

## 4. 卡级状态

| 项 | 值 |
|---|---|
| `PENDING_FIELDS` | `{NEW_FIELD_NAME}` |
| `BLOCKING_DEPENDENCY` | `NONE` |
| `CARD_OVERALL` | `DEFERRED`（前提：`MODEL` 六要素完整；六要素核验不通过时，`MODEL` 重新计入 `PENDING_FIELDS`，整卡回退 `PARTIALLY_DECIDED`） |
| 推导说明 | `MODEL=DEFER` 是已完成裁定，不因处于 DEFER 状态而进入 `PENDING_FIELDS`；`NEW_FIELD_NAME` 因模型未定而按未裁定计 |

## 5. 下游影响（仅记录）

`MODEL` 未定 ⇒ D-02 的 `REPLACE` 硬前置未满足、`COEXIST` 分支未获选 ⇒ D-02 不可定稿，D-04 继续停摆；GAP-02 未决，后续即使选 `REPLACE` 亦无法迁移；59_ 字段契约与测试期望不得据此冻结。

## 6. 非包含

不含 D-02／D-04 裁定、GAP-02 裁定、版本发布、代码实施、仓库写入。

## 7. 证据状态

| 项目 | 状态 |
|---|---|
| Reviewer 建议稿在对话中存在 | `PRESENT` |
| Reviewer 建议稿独立文件 | `NOT_PROVIDED` |
| 六要素文本已补入 v2.1 | `PRESENT` |
| 六要素严格逐字比对 | `PENDING` |
| 用户提供的答题纸 SHA-256 | `OWNER_REPORTED` |
| 本次独立文件哈希核验 | `NOT_PERFORMED` |

附注：答题纸哈希由本对话提交方在本地计算并自报（`d2b6dcac…540a7bdc`，13,271 B，UTF-8/LF），不构成 Reviewer 已核验；文件路径可读，供任何独立核验方自行复算。本 OD 草案自身哈希由提交回执给出，不内嵌于本文件。

## 8. 遗留事项

| 编号 | 事项 | 状态 |
|---|---|---|
| `OPEN-01` | 建议稿无文件路径 | `EVIDENCE_AS_FILE = NOT_PROVIDED` |
| `OPEN-02` | 六要素与最早建议稿原件的逐字比对 | `PENDING` |
| `OPEN-03` | 答题纸、v2.1 原件及 v2.2 草案的 SHA-256 均未由 Reviewer 独立复算；当前哈希值均为提交方报告 | `NOT_PERFORMED`（提交方报告） |
| `CLARIFY-01` | 授权句中“创建 DECISION_ID 以外的额外治理记录”按“不新增治理登记、编号仍未分配”执行 | `CLOSED` — 本轮明确为仓库外编制，不登记、不分配 `OD_ID` 或 `DECISION_ID`。 |

## 9. 授权边界（引自本轮 Owner 授权）

1. 本授权仅允许 D-01 OD 编制，不自动授权正式文件写入。
2. 不得修改 D-09。
3. 不得修改 50_–69_ 其他文件。
4. 不得实施代码、数据库、DDL、API 或业务规则变更。
5. 不得创建额外治理登记记录；`DECISION_ID = NOT_GENERATED`。
6. 不得 commit、push 或扩大仓库修改范围。

本草案不产生 `OD_ID`、不产生 `DECISION_ID`、不改变任何既有 Gate 状态。
