# OD 记录｜BLK-A-B1-D-01（GAP-01）Product identity enum 兼容

| 项 | 值 |
|---|---|
| 文档编号 | `OD-BLK-A-B1-D01-ENUM-01`（`OD_ID` 由 Owner 2026-11-27 指定；未登记） |
| 文档类型 | OD 记录（正式文件）；**未登记、未生效** |
| 对应卡 / GAP | `BLK-A-B1-D-01` / GAP-01（Product identity enum 兼容） |
| 卡规范标识 | `BLK-A-B1-D-01`（正式记录不使用裸 `D-01` 作主标识） |
| 决定主体 | Owner（签名标识 `wuxiaoxian`） |
| Owner 确认时间 | 2026-11-27 |
| 编制授权 | `OD-D01 DRAFTING AUTHORIZED`（Owner 2026-11-27；仅限 `BLK-A-B1-D-01`） |
| 写入授权 | D-01 单文件正式写入（Owner 2026-11-27；仅本文件；不授权 commit／push） |
| 内容基线 | `OD-DRAFT-D01-v2.3`（v2.2、v2.1 草案原件保留） |
| 状态 | `OWNER_CONFIRMED｜RECORDED｜NOT_REGISTERED｜NOT_EFFECTIVE｜DECISION_ID = NOT_GENERATED` |
| 效力层 | L1 方向已确认；L2 正式文本已写入（待独立核验）；L3 未批准；L4 未生效；L5 无实施授权 |

## 0. 编制说明（非实质性）

1. 本记录依 Owner 2026-11-27 的 `BLK-A-B1-D-01` 编制授权编制，内容基线为 `OD-DRAFT-D01-v2.3`；v2.3 的基线为 `OD-DRAFT-D01-v2.2`。
2. 除封面、编制说明、授权边界、标识限定化及章节重编号外，其余内容以 `OD-DRAFT-D01-v2.3` 为基线；本记录相对 v2.3 的差异见 §0.1，实测 `diff` 列于写入回执，未完成字节级比较前不作“逐字节一致”声明。
3. 本记录未新增任何裁定、未修改任何 Owner 已确认字段值、未对未确认事项作出解释或推定。
4. 本记录位于治理文档 Git 仓库 `morrishk-owner-decision` 的工作树内（`70_sessionb_b1_blk_a_d01_enum_od/`），当前为未跟踪文件；未进入原项目治理目录、未登记、未 commit。
5. 本记录中的卡引用统一使用限定标识 `BLK-A-B1-D-xx`。29_ 登记表及 `08_DECISION_REGISTER.md` 中的 `D-01` 仍指「Brand 权威来源与注册表」，不因本记录改变；`OD_BLK_A_01_BRAND_TRUST_STATE_MODEL.md`（`OD-BLK-A-01`，62_）为上游拟议材料，与本记录不是同一决策对象。

### 0.1 本记录相对 v2.3 的差异清单

| # | 位置 | 差异 | 性质 |
|---|---|---|---|
| 1 | 标题、封面 | 标题改「OD 记录」；封面改正式记录口径（文档编号／文档类型／新增「写入授权」行／内容基线 v2.3／状态／效力层）；删除草案专用「OD_ID（预留）」行（`OD_ID` 并入文档编号）；「卡规范标识」提示语由「不得」改「不使用」 | 形式性 |
| 2 | §0 | 第 1、2、4 条改正式记录口径（基线链、`diff` 指向、仓库位置）；新增第 5 条（标识限定说明与 62_ 关系）；§0.1 标题、表头与清单内容随本记录重写（即本表） | 记录性 |
| 3 | §1 | 新增 `OD_ID` 来源行（`OWNER_DESIGNATED`） | 记录性 |
| 4 | §3、§5、§6 | 卡引用 `D-01`→`BLK-A-B1-D-01`、`D-02`→`BLK-A-B1-D-02`、`D-04`→`BLK-A-B1-D-04`；§6 非包含范围按本记录写入事实调整 | 机械替换＋事实调整，无裁定变更 |
| 5 | §7 | 表内「已补入 v2.1」改「已补入 v2.3 基线」；附注「本 OD 草案」改「本记录」 | 措辞对齐 |
| 6 | §7.1 | 改为「版本来源链」，覆盖 v2.1→v2.2→v2.3→本记录 | 记录性 |
| 7 | §8 | `OPEN-03` 覆盖范围改「v2.x 原件及本记录」；`CLARIFY-01` 闭合表述改为「不登记、不分配 `DECISION_ID`」 | 措辞对齐 |
| 8 | §9 | 标题注明「编制授权原文，2026-11-27」 | 形式性 |
| 9 | §10 | 新增「写入边界」 | 记录性 |

除上表所列外，无其他实质性差异；准确边界以写入回执所列实测 `diff` 为准。

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
| `OD_ID` 来源 | `OWNER_DESIGNATED`（2026-11-27，`OD-BLK-A-B1-D01-ENUM-01`） |

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
| ② 影响范围 | `BLK-A-B1-D-01` 模型决定、`BLK-A-B1-D-02` 条件依赖、`BLK-A-B1-D-04` 放行条件 |
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

`MODEL` 未定 ⇒ `BLK-A-B1-D-02` 的 `REPLACE` 硬前置未满足、`COEXIST` 分支未获选 ⇒ `BLK-A-B1-D-02` 不可定稿，`BLK-A-B1-D-04` 继续停摆；GAP-02 未决，后续即使选 `REPLACE` 亦无法迁移；59_ 字段契约与测试期望不得据此冻结。

## 6. 非包含

不含 `BLK-A-B1-D-02`／`BLK-A-B1-D-04` 裁定、GAP-02 裁定、版本发布、代码实施、除本文件外的仓库写入。

## 7. 证据状态

| 项目 | 状态 |
|---|---|
| Reviewer 建议稿在对话中存在 | `PRESENT` |
| Reviewer 建议稿独立文件 | `NOT_PROVIDED` |
| 六要素文本已补入 v2.3 基线 | `PRESENT` |
| 六要素严格逐字比对 | `PENDING` |
| 用户提供的答题纸 SHA-256 | `OWNER_REPORTED` |
| 本次独立文件哈希核验 | `NOT_PERFORMED` |

附注：答题纸哈希由本对话提交方在本地计算并自报（`d2b6dcac…540a7bdc`，13,271 B，UTF-8/LF），不构成 Reviewer 已核验；文件路径可读，供任何独立核验方自行复算。本记录自身哈希由写入回执给出，不内嵌于本文件。

### 7.1 版本来源链

| 版本 | 文件 | SHA-256（提交方报告） | 状态 |
|---|---|---|---|
| v2.1 | `batch1_od_drafts/OD_DRAFT_D01_v2.1.md` | `d197de4f16f4b4380bf71b8e0d90c6b5cf6c447d53c6591e8aafe735ca83c269` | 保留，未改 |
| v2.2 | `batch1_od_drafts/OD_DRAFT_D01_v2.2.md` | `330373175f697481240cbd0efd527617555dcb81143bc20575c57262741124fc` | 冻结原件，保留，未改 |
| v2.3 | `batch1_od_drafts/OD_DRAFT_D01_v2.3.md` | `93e7ee2bf23c08e825aaabf4076db6e4fe96b19f966e4520fc739278bb5430ce` | 本记录内容基线 |
| 正式记录 | 本文件 | 见写入回执 | `RECORDED — NOT_REGISTERED — NOT_EFFECTIVE` |

## 8. 遗留事项

| 编号 | 事项 | 状态 |
|---|---|---|
| `OPEN-01` | 建议稿无文件路径 | `EVIDENCE_AS_FILE = NOT_PROVIDED` |
| `OPEN-02` | 六要素与最早建议稿原件的逐字比对 | `PENDING` |
| `OPEN-03` | 答题纸、v2.x 原件及本记录的 SHA-256 均未由 Reviewer 独立复算；当前哈希值均为提交方报告 | `NOT_PERFORMED`（提交方报告） |
| `CLARIFY-01` | 授权句中“创建 DECISION_ID 以外的额外治理记录”按“不新增治理登记、编号仍未分配”执行 | `CLOSED` — 本轮明确为不登记、不分配 `DECISION_ID`。 |

## 9. 授权边界（编制授权原文，2026-11-27）

1. 本授权仅允许 D-01 OD 编制，不自动授权正式文件写入。
2. 不得修改 D-09。
3. 不得修改 50_–69_ 其他文件。
4. 不得实施代码、数据库、DDL、API 或业务规则变更。
5. 不得创建额外治理登记记录；`DECISION_ID = NOT_GENERATED`。
6. 不得 commit、push 或扩大仓库修改范围。

## 10. 写入边界（单文件写入授权，2026-11-27）

1. 仅创建本文件；新建目录 `70_sessionb_b1_blk_a_d01_enum_od/`（`CREATE_DIR = YES`）。
2. 不修改 29_、62_、66_、68_、69_ 等既有材料。
3. 不覆盖任何已有文件（`OVERWRITE = NO`）。
4. 不创建 `SHA256SUMS`。
5. 不修改业务代码、数据库、DDL、API 或其他治理记录。
6. 不 commit、不 push。
7. 写入后文件保持未跟踪（`UNTRACKED_ACCEPTED = YES`），不代表已登记或已生效。

本记录不产生 `DECISION_ID`、不改变任何既有 Gate 状态；`OD_ID` 已由 Owner 指定但未登记、未生效。
