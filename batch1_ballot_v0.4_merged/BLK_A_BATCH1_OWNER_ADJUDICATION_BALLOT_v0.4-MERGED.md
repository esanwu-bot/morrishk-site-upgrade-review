# BLK-A 批次 1｜Owner 裁定空白答题纸（v0.4-MERGED 定稿）

| 项 | 值 |
|---|---|
| 文档标识 | MRH-DSBIT-SESSIONB-B1-BATCH1-BALLOT-v0.4-MERGED |
| 版本标识 | `v0.4-MERGED — REVIEWED (TEXT-LEVEL CONSISTENCY)`，本文件为其**空白定稿**（FINAL BLANK BALLOT） |
| 日期 | 2026-11-27 |
| 适用 | 批次 1：D-01（GAP-01）、D-09（GAP-09）；两卡独立成卷、互不合并 |
| 依据 | 批次 1 答题材料 v0.4（`REVIEWED (TEXT-LEVEL)`）+ Reviewer 补回要求 F-01／F-02／F-03 + 合并稿一致性复核 PASS |
| 状态 | **NOT_SIGNED｜NOT_FILLED｜DECISION_ID = NOT_GENERATED｜OD 记录未生成｜写文件授权未授予** |
| 效力 | 全部裁定位空白；任何后续填写仍属 `PROPOSED`，不构成 `OWNER_ACCEPTED`／`APPROVED`／`EFFECTIVE` |
| 文件自哈希 | 不内嵌（文件不自哈希），由外部提交回执给出 |

本文件位于仓库之外的 `.scratch` 工作目录；未写入仓库，未修改 50_–69_ 任何文件。

---

## 0. 本卷性质与使用

1. 本卷是**空白答题纸**：逐字承接已复核的 v0.4-MERGED 文本，不新增规则、不改字段、不改选项值、不改状态优先级。
2. `D-01`、`D-09` 的全部 Owner 决定字段保持空白；卷内出现的“允许取值”仅为选项说明，不构成任何裁定。
3. `STORAGE_AUTHORIZATION` 与 `STATUS_FIELD_NAMESPACE` 为**只读固定值**，不属于 Owner 决定字段，已预置。
4. 填写完成后本卷**不自动成为 OD 记录**；进入治理链仍须“一张卡 → 一份 OD 记录 → 一次独立写文件授权”。
5. 本卷不是批准文件，不产生 `DECISION_ID`，不改变任何既有状态。

---

## 1. 通用填写规则

### 1.1 决策类型 ≠ 选项值（不得合并、不得简写）

| 层 | 取值 | 说明 |
|---|---|---|
| 决策类型 | `ACCEPT` / `DEFER` / `REJECT` | 每个必填字段各自选一个 |
| 选项值 | 字段内枚举（如 D-01 `COEXIST`/`REPLACE`；D-09 `A`/`B`/`C`） | 仅在 `ACCEPT` 时需要填写；`DEFER`／`REJECT` 下不填选项值 |

不得用 `A`／`D`／`R` 代替 `ACCEPT`／`DEFER`／`REJECT`，也不得以“选了某个选项”倒推决策类型。

### 1.2 子字段独立裁定

每个必填字段单独记录决策类型与理由；**不允许**以整卡一次 `ACCEPT` 覆盖多个字段，也不允许批次接受自动合并为一个决定。

### 1.3 REJECT 替代路径通则

1. **每个字段**若裁定为 `REJECT`，必须在该字段的 `REJECT_REPLACEMENT_PATH` 写明**该字段自己的**替代方向；不得只在卡级写一条路径替代所有字段的 REJECT。
2. **不得因 REJECT 某一方案而自动接受另一方案**。A、B 两个方案均被拒时，D-01 保持 `UNRESOLVED`，其下游依赖（含 D-02 及经 D-02 可达的 D-04）继续停摆。
3. `REJECT` 不得被解释为“默认为另一选项”“默认为不实施”“默认为维持现状生效”。
4. 替代路径必须是可执行的下一步（谁、依据什么、产出什么），不得写成“以后再议”。

### 1.4 DEFER 六要素

`DEFER` 必须同时具备六要素，缺一即视为该字段未完成：①原因 ②影响范围 ③缺失信息 ④补齐责任方 ⑤期限或触发条件 ⑥临时处置。

### 1.5 效力

填写=候选裁定记录；写入 OD 需独立授权；OD 仍不等于 `EFFECTIVE`（生效另属 Gate N-B）。

---

## 2. D-01 答题区（GAP-01 Product identity enum 兼容）

**卡信息**：前置 `NONE`；对 D-02 为条件依赖（`MODEL=REPLACE` 构成硬前置；`MODEL=COEXIST` 可并行，但 D-04 须待 D-01 与 D-02 均裁定后放行）。

### 2.1 必填字段与允许取值

| # | 字段 | 允许取值 | 备注 |
|---|---|---|---|
| 1 | `MODEL` | `ACCEPT`（值：`COEXIST` / `REPLACE`）、`DEFER`、`REJECT` | `COEXIST`＝59_ 现行枚举与四值模型并存、限定名引用；`REPLACE`＝以四值替换并显式迁移 `MISSING`/`REJECTED`（须先有 GAP-02 结论） |
| 2 | `NEW_FIELD_NAME` | 文本 | 仅 `COEXIST` 下必填；`REPLACE` 下填 `N/A`；`MODEL` 未裁定时本字段按待定处理，不得预填 `N/A` |
| 3 | `LEGACY_VALUES_RETAINED` | `ACCEPT`（值：`YES` / `NO`）、`DEFER`、`REJECT` | 仅回答“59_ 现有字段与取值是否继续存在”，**不等于**写权限，也**不等于** `MISSING`/`REJECTED` 语义已定 |
| 4 | `RULE_VERSION_POLICY` | `ACCEPT`（值：`NEW_VERSION` / `REUSE_V0_1_WITH_ANNEX`）、`DEFER`、`REJECT` | 版本升级策略；`REJECT` 须给替代版本策略 |

### 2.2 字段级 REJECT 替代路径要求

| 字段 | REJECT 时必须填写（字段级，非卡级） |
|---|---|
| `MODEL` | 写明若 `COEXIST` 与 `REPLACE` 均不接受，字段模型改走何种第三条路径；未给则可执行性不足 |
| `NEW_FIELD_NAME` | 写明命名改由何种方式确定（谁命名、依据什么、何时定稿） |
| `LEGACY_VALUES_RETAINED` | 写明旧值去留交由哪一决定或哪一文件裁定；不得默认为“删除” |
| `RULE_VERSION_POLICY` | 写明替代的版本化方式；不得默认为“无版本” |

### 2.3 Owner 填写区（全部空白）

```
CARD: D-01 (GAP-01)
MODEL: <空白 — 待 Owner 裁定>
  REJECT_REPLACEMENT_PATH: <空白>
NEW_FIELD_NAME: <空白 — 待 Owner 裁定>
  REJECT_REPLACEMENT_PATH: <空白>
LEGACY_VALUES_RETAINED: <空白 — 待 Owner 裁定>
  REJECT_REPLACEMENT_PATH: <空白>
RULE_VERSION_POLICY: <空白 — 待 Owner 裁定>
  REJECT_REPLACEMENT_PATH: <空白>
```

### 2.4 卡级推导字段（Owner 不直接填写，由 §3.6 规则推导）

```
PENDING_FIELDS: <裁定后推导>
BLOCKING_DEPENDENCY: NONE（D-01 无前置）
CARD_OVERALL: <裁定后推导>
```

---

## 3. D-09 答题区（GAP-09 审计授权与格式）

**卡信息**：与 D-01 独立并行推进；因命名空间占位，D-01 未定前 D-09 不得 `COMPLETE`（见 §3.6）。

### 3.1 必填字段（4 项）+ 只读字段（2 项）

| # | 字段 | 允许取值 | 备注 |
|---|---|---|---|
| 1 | `AUDIT_FIELD_SET` | `ACCEPT`（值：`A`＝11 必填字段 + append-only／`B`＝最小 5 字段／`C`＝其他，须附清单）、`DEFER`、`REJECT`（＝要求重新设计字段集） | 11 字段取自审计规范 §1（`transition_id` … `decision_record_id`） |
| 2 | `AUDIT_ROLE_MATRIX` | `ACCEPT`（值：`ADOPT_AS_PROPOSED`）、`DEFER`、`REJECT`（＝重新设计角色权限） | 角色定义与委派本身仍属 GAP-13 |
| 3 | `RETENTION_PERIOD` | `ACCEPT`（须给**具体期限 + 适用范围**）、`DEFER`（六要素）、`REJECT`（替代保留处理方向） | 不得以“未定”充当 `ACCEPT` |
| 4 | `INTERIM_RETENTION_POLICY` | 见 §3.3 适用条件 | 仅当 `RETENTION_PERIOD=DEFER` 时进入裁定 |
| R1 | `STORAGE_AUTHORIZATION` | 固定 `NOT_GRANTED`（只读） | 存储/DB/API 实施不在本卡授权范围 |
| R2 | `STATUS_FIELD_NAMESPACE` | 固定 `PENDING_D01_OUTCOME`（只读） | 仅约束“不得 `COMPLETE`”，不降级 `DEFERRED` |

### 3.2 字段级 REJECT 替代路径要求

| 字段 | REJECT 时必须填写（字段级） |
|---|---|
| `AUDIT_FIELD_SET` | 写明替代字段集方向（哪些字段、谁定、何时定）；不得默认为“无审计字段” |
| `AUDIT_ROLE_MATRIX` | 写明角色权限改由何文件/何决定裁定 |
| `RETENTION_PERIOD` | 写明替代保留处理方向；不得默认为“可删除” |
| `INTERIM_RETENTION_POLICY` | 见 §3.3 第 4 条：必须给可执行的另一种保留处理方向 |

### 3.3 `INTERIM_RETENTION_POLICY` 完整条件

1. **适用性**：仅当 `RETENTION_PERIOD = DEFER` 时填写；其余情形一律填 `N/A`，不得借临时策略回避正式保留期裁定。
2. `ACCEPT`：必须给出**具体临时期限 + 适用范围**（适用哪些记录、从何时起、到何时止或何触发条件止）；只写“临时保留”视为未完成。
3. `DEFER`：必须六要素完整（§1.4）。
4. `REJECT`：**不得**解释为“允许删除审计记录”；必须在 `REJECT_REPLACEMENT_PATH` 给出**另一种可执行的保留处理方向**（例如冻结写入、只读封存、延长待裁期并指明朝向），否则视为字段未完成。

### 3.4 Owner 填写区（全部空白）

```
CARD: D-09 (GAP-09)
AUDIT_FIELD_SET: <空白 — 待 Owner 裁定>
  REJECT_REPLACEMENT_PATH: <空白>
AUDIT_ROLE_MATRIX: <空白 — 待 Owner 裁定>
  REJECT_REPLACEMENT_PATH: <空白>
RETENTION_PERIOD: <空白 — 待 Owner 裁定>
  REJECT_REPLACEMENT_PATH: <空白>
INTERIM_RETENTION_POLICY: <空白 — 待 Owner 裁定；仅 RETENTION_PERIOD=DEFER 时适用>
  REJECT_REPLACEMENT_PATH: <空白>
STORAGE_AUTHORIZATION: NOT_GRANTED
STATUS_FIELD_NAMESPACE: PENDING_D01_OUTCOME
```

### 3.5 卡级推导字段（Owner 不直接填写，由 §3.6 规则推导）

```
PENDING_FIELDS: <裁定后推导>
BLOCKING_DEPENDENCY: <裁定后推导>
CARD_OVERALL: <裁定后推导>
```

### 3.6 状态推导规则（统一口径）

先记两个显式字段：

- `PENDING_FIELDS`：尚未裁定的必填字段清单（全部裁定完则 `NONE`）。
- `BLOCKING_DEPENDENCY`：阻断依赖清单（无则 `NONE`）。

`CARD_OVERALL` 四值定义：

| 值 | 成立条件 |
|---|---|
| `REJECTED` | 整卡被拒且替代路径完整 |
| `DEFERRED` | 至少一个必填字段 `DEFER` **且该 DEFER 六要素完整** |
| `PARTIALLY_DECIDED` | 尚有必填字段待裁定或存在阻断依赖，**且没有符合 `DEFERRED` 条件的必填字段** |
| `COMPLETE` | 全部必填已裁定，`PENDING_FIELDS = NONE` 且 `BLOCKING_DEPENDENCY = NONE` |

优先级：`REJECTED` > `DEFERRED` > `PARTIALLY_DECIDED` > `COMPLETE`。

补充硬规则：

1. **六要素不全的 `DEFER` 视为字段未完成**，不计入有效 `DEFER`；若没有其他符合 `DEFERRED` 条件的字段，整卡应为 `PARTIALLY_DECIDED`。
2. `STATUS_FIELD_NAMESPACE = PENDING_D01_OUTCOME` **仅禁止 `COMPLETE`**，不把本可成立的 `DEFERRED` 降级。
3. 因此 D-09 先于 D-01 裁定时，结果只能是 `PARTIALLY_DECIDED` 或 `DEFERRED`，**不可能 `COMPLETE`**。
4. `PENDING_FIELDS`／`BLOCKING_DEPENDENCY` 与 `CARD_OVERALL` 必须自洽：`COMPLETE` 与任一非 `NONE` 同时出现即判为填写错误。

---

## 4. 卡片—记录—授权关系

1. 一张卡 → 一份 OD 记录 → 一次独立写文件授权；批次内两卡各自成记录，不合并、不代签。
2. 答题纸与 OD 记录均**不等于** `DECISION_ID`、**不等于** `APPROVED`、**不等于** `EFFECTIVE`。
3. D-09 的 `STORAGE_AUTHORIZATION` 恒为 `NOT_GRANTED`；任何存储/DB/API 实施须另行授权。
4. 起裁顺序：D-01、D-09 任一先行均可，不设先后约束。

---

## 5. 合并稿 ↔ 原文一致性核对（只核一致性，不重审规则）

| Reviewer 项 | 原文约束要点 | 本卷落点 | 一致性 |
|---|---|---|---|
| F-01 | 仅 `RETENTION_PERIOD=DEFER` 时适用；`ACCEPT` 须给具体期限+范围；`DEFER` 六要素；其余 `N/A`；拒绝不得暗示可删除，须给可执行替代 | §3.3 第 1–4 条；§3.2 末行 | 一致（补回，未改口径） |
| F-02 | 不得因 REJECT 某方案而自动接受另一方案；A、B 均拒则 D-01 `UNRESOLVED`、下游停摆；每字段 REJECT 需各自的替代路径 | §1.3 第 1–3 条；§2.2；§3.2 | 一致（补回，未改口径） |
| F-03 | 显式 `PENDING_FIELDS`／`BLOCKING_DEPENDENCY`；六要素不全的 DEFER 视为未完成，若无其他有效 DEFER 则整卡 `PARTIALLY_DECIDED`；四值与优先级 | §3.6 全部；§2.4／§3.5 | 一致（补回，未改口径） |

未列入上表的内容，均逐字保持 v0.4 已复核文本；本卷未新增第五处规则。

---

## 6. 附录 A：非规范性填写说明（Reviewer 已确认为非规则）

| 编号 | 字段 | 填写判定 | 与状态推导的联动 |
|---|---|---|---|
| `FILLING_NOTE-01` | D-01 `NEW_FIELD_NAME` | `MODEL=REPLACE` → `N/A`；`MODEL=COEXIST` → 须给具体字段名；`MODEL` 未裁定时不得预填 `N/A`，按待定处理 | `MODEL` 未定 ⇒ 本字段计入 `PENDING_FIELDS`，该卡不可能 `COMPLETE` |
| `FILLING_NOTE-02` | D-09 `INTERIM_RETENTION_POLICY` | `RETENTION_PERIOD ≠ DEFER` → `N/A`；`RETENTION_PERIOD = DEFER` → 本字段是独立裁定，自身 `DEFER` 仍须六要素完整 | `RETENTION_PERIOD` 的 `DEFER` 不自动完成本字段；六要素不全 ⇒ 不计入有效 `DEFER` |

两条均源自本卷已复核文本的适用条件（§2.1 备注、§3.3），属操作提示，非新增规则。

---

## 7. 非声明与提交回执

- 本卷 `NOT_SIGNED`、`NOT_FILLED`、`DECISION_ID = NOT_GENERATED`、OD 记录未生成、写文件授权未授予；未进入任何 `ACCEPTED`／`APPROVED`／`EFFECTIVE` 层。
- 本卷存放于仓库之外的 `.scratch` 工作目录；未写入仓库；未修改 50_–69_ 任何文件；未新增治理登记文件；未修改代码／API／DB／DDL／OAuth；未实施业务规则；未批准 K5；未解除 R-2／R-3；未冻结 B5；未签发 B-1；未进入 BLK-B／C／D；未 commit／push。
- 文件 SHA-256 见外部提交回执（本文件不自哈希）。
- 交接：Owner 逐字段填写后交回；随后仅整理为 OD 记录草稿，待独立写文件授权。
