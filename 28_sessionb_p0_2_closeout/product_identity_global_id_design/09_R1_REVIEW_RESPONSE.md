# R1 复核回应（Product Identity + Global ID）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-009 |
| 版本 | v1.0-R1 |
| 日期 | 2026-11-23 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 性质 | 对 Reviewer R1/R2/R3 的逐条回应；不是架构批准、不是实现、不是冻结 |
| 基线 | 原设计提交 `6f4eaa0c598c01174b57d45bb7540ab1cd7fd58e`；本轮 R1 为追加提交 |

## 1. R1：租户/客户身份隔离

| Reviewer 要求 | 修改前 | 修改方案/位置 | 是否待决 |
|---|---|---|---|
| 1. 全局 product_uid 是否跨客户共享 | 未讨论 | `06` §8.2 方案 A/B/C；推荐 C（全局 Canonical + Tenant Access） | 是，D-24 |
| 2. 客户私有数据 vs 全局产品身份 | 未区分 | `06` §8.1 分层表、§8.5 私有数据边界 | 是，D-26 |
| 3. Tenant/Organization 与 Product 关系 | 未建模 | `06` §8.3 候选关系模型、§8.4 | 是，D-25 |
| 4. 私有 PDF/解析/证据访问边界 | 未建模 | `06` §8.5；默认私有、显式共享 | 是，D-26 |
| 5. 客户确认是否影响其他客户 | 未讨论 | `06` §8.4/§8.9；客户确认仅本租户，全局规则独立治理 | 是，D-27 |
| 6. OAuth Scope + Tenant ACL 组合 | 仅讨论 scope | `06` §8.6：`allowed = scope AND tenant_acl` | 是，D-30 |
| 7. 搜索/详情/版本/证据/分类隔离 | 未逐接口 | `06` §8.7 逐接口隔离规则 | 是，D-28 |

### 1.1 方案比较（`06` §8.2）

- A 完全全局：去重最好，但私有数据/证据跨客户泄露、客户确认互相影响；仅适合公开数据/单租户。
- B 每租户独立：隔离最强，但同一产品重复、无法跨租户复用、运维成本高。
- C 全局 Canonical + Tenant Access（推荐候选）：全局规范产品 + 租户访问/私有数据分层，可复用、可隔离、可审计；需 tenant ACL/映射/治理。

### 1.2 单租户假设

`06` §8.8 已写明：若选择单租户，必须明确“全局产品=该租户可见产品”、私有/公共边界不完整、未来多租户需 ACL/回填/接口过滤/OAuth tenant 绑定等扩展成本；不得表述为多租户就绪。

### 1.3 仍待决

D-24（共享字段）、D-25（Tenant/Org/ACL）、D-26（私有数据边界）、D-27（客户确认/全局治理）、D-28（404/403）、D-30（scope+ACL）。均需负责人/安全签署。

## 2. R2：自然键唯一约束与状态机

| Reviewer 要求 | 修改后规则 | 位置 |
|---|---|---|
| 1. 正式唯一约束适用状态 | 仅 `CONFIRMED`；部分唯一索引/独立 confirmed 表 | `03` §4.1；`04` §3.1 |
| 2. PENDING_BRAND 是否进入正式注册表 | 否；进入待确认队列，不占正式键 | `03` §4.1；`04` §3.1 |
| 3. PENDING_CONFLICT 是否占用正式键 | 否；冲突记录单独保存 | `03` §4.1；`04` §3.1 |
| 4. variant_key 未定是否允许 CONFIRMED | 否；新增 `PENDING_VARIANT` | `03` §4/§4.1；`04` §3.1 |
| 5. 同 Brand/MPN 不同封装 | 按 D-04：独立产品或 variant 属性；未裁定前 PENDING_VARIANT | `03` §3.1/§4.1；V-22 |
| 6. 合并时旧自然键 | 保留为 alias/旧键，重定向；不删除/不复用 | `04` §3.1/§5；V-23 |
| 7. 拆分时新自然键 | 新键/新 uid；旧键 SPLIT/别名+谱系 | `04` §3.1；V-24 |
| 8. normalizer_version 升级 | 旧 norm 进 alias/历史；新 norm 重算+审计；不静默重写 | `04` §3.1；V-25 |
| 9. 并发导入防重复 | 唯一约束+事务+幂等键；冲突返回明确状态 | `04` §8；V-11/V-26 |

### 2.1 新增测试向量（≥5）

`07` 新增 V-19…V-26（8 个 R2 向量）+ V-27/V-28（R1 租户/私有证据）：

- V-19 PENDING_BRAND 不占正式键；
- V-20 PENDING_CONFLICT 不占正式键；
- V-21 variant 未裁定 → PENDING_VARIANT；
- V-22 同 Brand/MPN 不同封装；
- V-23 合并旧自然键 alias；
- V-24 拆分新自然键；
- V-25 normalizer 版本升级；
- V-26 并发 PENDING_CONFLICT；
- V-27 全局产品 vs 租户 ACL；
- V-28 私有证据隔离。

### 2.2 明确禁止

**不得把未裁定的 `variant_key` 当作可安全忽略的 nullable 字段**；未裁定即 `PENDING_VARIANT`，不得 CONFIRMED/生成正式 `pbk1_`。

### 2.3 仍待决

D-21（唯一约束状态）、D-22（PENDING 队列）、D-23（历史键）；均需签署。

## 3. R3：Brand Alias 与 MPN Profile 统一

| Reviewer 要求 | 修改后规则 | 位置 |
|---|---|---|
| 1. Brand Alias 是否有作用域 | 有：`GLOBAL`/`TENANT`；租户别名不跨租户 | `01` §6.3；`04` §3.2；D-16 |
| 2. Alias 冲突处理 | 冲突→`PENDING_CONFLICT`+人工裁决；不静默覆盖 | `01` §6.3；D-17 |
| 3. 历史品牌名/更名保留 | 旧名 alias + `valid_to` + `merged_into`；不删除 | `01` §6.3；D-17 |
| 4. MPN Profile 适用范围/版本治理 | `GLOBAL`/`BRAND`/`MANUFACTURER` 作用域；独立版本/状态/审批 | `02` §4.3；D-19 |
| 5. 无 Profile 的 fallback | `GLOBAL` fallback + `LOW_CONFIDENCE`；不得 CONFIRMED | `02` §4.3/§8.1 |
| 6. 低置信度 MPN 能否正式确认 | 否；PENDING+人工/补充证据 | `02` §8.1；D-20 |
| 7. Brand Alias 与 MPN Alias 是否独立 | 独立注册表，不共用命名空间 | `01` §6.3；`02` §4.4；`04` §3.2；D-18 |

### 3.1 强制规则

- 没有可靠 Brand 或没有经批准的 MPN 规范化规则时，**不得自动确认身份或自动合并产品**；
- 无可靠 Brand → `PENDING_BRAND`；Alias/Profile 冲突 → `PENDING_CONFLICT`；variant 未定 → `PENDING_VARIANT`；
- 只有负责人签署的 Brand/MPN 规则可用于正式身份。

### 3.2 仍待决

D-16…D-20；均需签署。

## 4. 决策清单更新

- 原 D-01…D-15 保留，依赖图更新（`08` §3）；
- 新增 D-16…D-30，覆盖 Alias 作用域/冲突/独立注册表、Profile 治理、低置信度、唯一约束状态、PENDING 队列、历史键、租户/ACL/私有数据/存在性、单租户假设、scope+ACL；
- 新增“决策分类”表（`08` §1.2），每个决策标注业务/技术/安全租户隔离/数据迁移；
- 全部状态 `PROPOSED_NOT_APPROVED`；签署栏全空，未替负责人签署。

## 5. 文件变更

| 文件 | 变更 |
|---|---|
| `01_BRAND_IDENTITY.md` | Alias 作用域/冲突/历史名/独立注册表；无可靠 Brand 强制规则 |
| `02_MPN_NORMALIZATION.md` | Profile 治理/fallback/低置信度；MPN alias 独立 |
| `03_PRODUCT_IDENTITY_MODEL.md` | PENDING_VARIANT；唯一约束/状态规则；variant 不可忽略 |
| `04_GLOBAL_ID_REGISTRY.md` | 状态隔离/部分唯一约束；合并/拆分/版本历史键；alias 分离 |
| `06_API_AND_DATABASE_IMPACT.md` | 新增 §8 租户隔离（A/B/C、关系模型、接口规则、单租户假设） |
| `07_TEST_VECTORS.md` | 新增 V-19…V-28 与 R2 覆盖映射 |
| `08_DECISION_REGISTER.md` | D-16…D-30、分类表、签署栏、依赖图 |
| `09_R1_REVIEW_RESPONSE.md` | 本文件 |
| `SHA256SUMS` / `DESIGN_AND_TEST_SHA256SUMS.txt` | 重新生成 |

## 6. 未改变

- **83 项测试证据未修改/未重跑**；`test_evidence_83/` 保持原样。
- 未修改 Ds Bit 源码、stash、OpenAPI、75 矩阵正式状态、数据库、OAuth、生产环境。
- 未执行 Contract Freeze/Business API 实现。
- 未把任何推荐写成负责人已批准。

## 7. 状态

- 本轮：`DESIGN_PACKAGE_R1_SUBMITTED`。
- 仍未：`ARCHITECTURE_APPROVED` / `P0_2_CLOSED` / `BUSINESS_API_IMPLEMENTATION_AUTHORIZED`。
- Ds Bit 基线：`feat/gate6a-audit` / `600439a5`；stash 保留。