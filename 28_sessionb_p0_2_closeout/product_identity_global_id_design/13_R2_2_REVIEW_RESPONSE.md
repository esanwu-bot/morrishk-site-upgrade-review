# R2.2 复核回应（最小约束闭环修订）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-013 |
| 版本 | v1.0-R2.2 |
| 日期 | 2026-11-23 |
| 状态 | **DESIGN_PACKAGE_R2_2_SUBMITTED** |
| 性质 | 对 Reviewer R2.2 四项约束闭环问题的逐条回应；不是架构批准、不是实现、不是契约冻结 |
| 基线 | 分支 `docs/sessionb-product-identity-global-id-design`，基线提交 `4a0448cc0c449b7a478c4e8866bc8e3bd3fed282`；本轮为独立追加提交，不 amend、不 rebase |
| 范围 | 仅四项约束闭环与配套测试向量；不重复 R2.1 六项工作，不扩大为通用多租户平台设计 |

## 0. 本轮结论

- R2.2-1…R2.2-4 四项已在文档层面闭环，新增 V-71…V-76 设计测试（未执行）。
- 未改 Ds Bit 源码、OpenAPI、75 矩阵、数据库、OAuth 实现；未重跑或修改 83 项测试证据。
- 所有规则仍为候选，全部待负责人签署；本轮不构成架构批准。
- 状态仅为 `DESIGN_PACKAGE_R2_2_SUBMITTED`，等待最后一轮架构审核。

## 1. R2.2-1：Alias 有效期与唯一约束冲突

| 项 | 内容 |
|---|---|
| 修改前问题 | 唯一约束与“历史行保留”存在语义冲突：若对 `(tenant_id, brand_id, alias_norm)` 直接建全量唯一索引，历史别名行无法共存；未说明有效期重叠与并发写入如何防止冲突 |
| 修改后的规则 | 1) 新增 `is_current` 标记；2) **当前映射唯一**：`brand_alias` GLOBAL(`alias_norm WHERE is_current`)、TENANT(`tenant_id, alias_norm WHERE is_current`)；`mpn_alias` GLOBAL(`brand_id, alias_norm WHERE is_current`)、TENANT(`tenant_id, brand_id, alias_norm WHERE is_current`)；3) **历史映射可保留多行**（`is_current=false` 不参与唯一冲突）；4) **有效期不能重叠**：半开区间 `[valid_from, valid_to)`，同唯一键不得重叠指向不同目标；5) 变更时同一事务内“关闭旧行 + 插入新行”；6) **并发写入**：行锁/advisory lock/SERIALIZABLE + 事务内区间校验，冲突回滚返回可重试/`PENDING_CONFLICT`，并支持幂等键 |
| 修改文件及章节 | `01_BRAND_IDENTITY.md` §6.5.1；`02_MPN_NORMALIZATION.md` §4.6；`04_GLOBAL_ID_REGISTRY.md` §3（`is_current`）/ §3.3.1；`06_API_AND_DATABASE_IMPACT.md` §4（索引行）；`07_TEST_VECTORS.md` V-71/V-72 |
| 对首期 Morrishk 接入的影响 | 首期单 Tenant 下当前映射唯一；品牌/型号更名、替代料、normalizer 升级产生历史行时不阻塞新映射，历史可回溯；并发导入不会双写或产生重叠区间 |
| 仍需负责人签署 | D-16/D-17/D-18（Alias 作用域/冲突/独立注册表）、D-44（唯一约束与有效期） |

## 2. R2.2-2：Tenant / Site 资源归属规则冲突

| 项 | 内容 |
|---|---|
| 修改前问题 | 仅区分 GLOBAL/TENANT，未明确“Tenant 级但有 Site”与“Site 级”的差别；`site_id` 是否必填在不同表中不一致，存在归属混用空间 |
| 修改后的规则 | 明确三类归属：1) **Global-level**：`tenant_id`、`site_id` 均必须为 NULL（`global_product`、`brand_registry`、GLOBAL 作用域 alias、`mpn_profile`、`global_adjudication`、`product_lineage`）；2) **Tenant-level**：`tenant_id` NOT NULL、`site_id` 必须为 NULL（`tenant_product_access`、`tenant`、TENANT 作用域 `identity_conflict`）；3) **Site-level**：`tenant_id` NOT NULL 且 `site_id` NOT NULL，且 `site.tenant_id = tenant_id`（`tenant_document`、`tenant_evidence`、`tenant_assertion`、`identity_pending`、`oauth_client`、`site`）。归属混用一律拒绝 |
| 修改文件及章节 | `06_API_AND_DATABASE_IMPACT.md` §8.12（三类归属表）；`10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` §2（三类约束）/ §4（B-09）/ §8；`07_TEST_VECTORS.md` V-73 |
| 对首期 Morrishk 接入的影响 | 首期 Morrishk 数据只落在 Tenant-level 与 Site-level；全局产品/品牌/裁决由 Ds Bit 侧写入且不带 tenant/site；新增 Site 不改结构 |
| 仍需负责人签署 | D-24/D-25（全局产品与 tenant-only）、D-31（Tenant/Site 边界）、D-43（三类归属） |

## 3. R2.2-3：Tenant Assertion 与 Global Adjudication 审批链

| 项 | 内容 |
|---|---|
| 修改前问题 | 仅笼统写“执行/批准分离”，未区分提交者、Tenant 审批者、Global 决策者、Global 审批者；未明确审批前不得更新 `global_product`，也未定义中间状态 |
| 修改后的规则 | 四角色审批链：提交者（`tenant.editor`，`SUBMITTED`）→ Tenant 审批者（`tenant.admin`，`TENANT_APPROVED`）→ Global 决策者（`identity.admin`，`decision_status=PROPOSED`）→ Global 审批者（`identity.approver`，`decision_status=APPROVED`）。1) **只有 `APPROVED` 后才允许写 `global_product`**，步骤 1–3 均不得触碰；2) 决策者与审批者必须不同人，提交者不得自我审批；3) 未完成 Tenant 审批不得进入全局流程；4) 客户原始 assertion 永久保留，全局拒绝/修改只追加引用 |
| 修改文件及章节 | `03_PRODUCT_IDENTITY_MODEL.md` §4.4（四角色链 + 状态机）；`04_GLOBAL_ID_REGISTRY.md` §3（`submitted_by`/`tenant_approved_by`/`decision_status`/`approved_at`）；`06_API_AND_DATABASE_IMPACT.md` §8.11；`08_DECISION_REGISTER.md` D-41/D-42；`10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` §4（B-14）/ §7；`07_TEST_VECTORS.md` V-74 |
| 对首期 Morrishk 接入的影响 | Morrishk 可提交并完成 Tenant 审批，但无 `identity.admin`/`identity.approver`，不能完成全局写入；审批链缺任一步时身份停留在中间态，不会误写全局产品 |
| 仍需负责人签署 | D-15（执行/批准分离）、D-27（客户确认与全局治理）、D-41（Tenant Assertion）、D-42（Global Adjudication 角色） |

## 4. R2.2-4：Audit 与 Evidence 隔离规则

| 项 | 内容 |
|---|---|
| 修改前问题 | `audit_log` 的 GLOBAL 记录是否允许 `tenant_id=NULL` 未明确许可（易被误解为必须归属 Morrishk）；`tenant_evidence.visibility` 枚举含 `SHARED`/`PUBLIC`，首期却未禁止跨租户证据共享 |
| 修改后的规则 | 1) `audit_log` 的 GLOBAL 记录**允许且要求 `tenant_id = NULL`**（`scope='GLOBAL'`），TENANT 记录必须带 `tenant_id`（及 `site_id`）；2) 首期 `tenant_evidence.visibility` **只支持 `PRIVATE`**，`SHARED`/`PUBLIC` 仅作枚举预留；3) 跨租户证据共享暂缓（D-38），任何跨租户读取一律拒绝；4) 私有证据不因产品全局化而共享 |
| 修改文件及章节 | `04_GLOBAL_ID_REGISTRY.md` §3（`tenant_evidence.visibility`）；`06_API_AND_DATABASE_IMPACT.md` §8.5 / §8.12；`10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` §4（B-13）/ §6 / §7；`08_DECISION_REGISTER.md` D-46；`07_TEST_VECTORS.md` V-75/V-76 |
| 对首期 Morrishk 接入的影响 | 全局裁决审计不归属客户；Morrishk 只能看到自己的 PRIVATE 证据；未来开放共享时需另行签署，不改变首期模型 |
| 仍需负责人签署 | D-34（资源可见性）、D-38（跨租户共享延后）、D-43（审计归属）、D-46（首期 Evidence 可见性） |

## 5. 文件变更

| 文件 | 变更 |
|---|---|
| `00_DESIGN_OVERVIEW.md` | v2.2-R2.2；阅读顺序加入 `13`；R2.2 摘要 |
| `01_BRAND_IDENTITY.md` | v2.2-R2.2；§6.5.1 当前/历史映射、并发写入 |
| `02_MPN_NORMALIZATION.md` | v2.2-R2.2；§4.6 当前/历史映射、并发写入 |
| `03_PRODUCT_IDENTITY_MODEL.md` | v2.2-R2.2；§4.4 四角色审批链与状态机 |
| `04_GLOBAL_ID_REGISTRY.md` | v2.2-R2.2；`is_current`、§3.3.1、evidence PRIVATE、审批字段 |
| `06_API_AND_DATABASE_IMPACT.md` | v2.2-R2.2；§4 索引、§8.5、§8.11、§8.12 三类归属 |
| `07_TEST_VECTORS.md` | v2.2-R2.2；新增 V-71…V-76 |
| `08_DECISION_REGISTER.md` | v2.2-R2.2；D-41/D-42/D-43/D-44 收敛，新增 D-46 |
| `10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` | v1.2-R2.2；三类归属、B-13/B-14、首期范围 |
| `13_R2_2_REVIEW_RESPONSE.md` | 本文件（新增） |
| `SHA256SUMS` / `../DESIGN_AND_TEST_SHA256SUMS.txt` | 重新生成 |

## 6. 未改变（禁止事项核对）

- 未修改 Ds Bit 源码；未触碰 Ds Bit stash。
- 未修改 OpenAPI；未修改 75 Scope × 15 Endpoints 正式矩阵。
- 未实现 Business API；未生成或执行 DDL；未修改数据库。
- 未接真实 OAuth；未部署、未执行生产操作。
- 未重跑或修改 `../test_evidence_83/`（83 项测试证据与 R2 基线一致）。
- 未把 R2.2 修订写成架构批准或契约冻结。

## 7. 仍需负责人签署的事项

- D-01/D-02/D-03/D-16/D-17/D-18/D-19：Brand 与 MPN 治理、Alias 作用域。
- D-24/D-25/D-26/D-27/D-30/D-31/D-32/D-34：全局产品、租户/站点/客户端、私有数据、四因子授权。
- D-41：Tenant Assertion 与四角色审批链。
- D-42：Global Identity Adjudication 角色与承担方。
- D-43：Global/Tenant/Site 三类归属与全局审计归属。
- D-44：Brand/MPN Alias 唯一约束与有效期。
- D-45：OAuth Token 可信上下文。
- D-46：首期 Evidence visibility 仅 PRIVATE。
- V-71…V-76 的验收范围。

全部决策当前 `PROPOSED_NOT_APPROVED`，签署栏留白。

## 8. 状态

- 本轮：`DESIGN_PACKAGE_R2_2_SUBMITTED`。
- 未标记：`ARCHITECTURE_APPROVED` / `CONTRACT_FROZEN` / `P0_2_CLOSED` / `BUSINESS_API_IMPLEMENTATION_AUTHORIZED` / `PRODUCTION_READY`。
- 等待 Reviewer 最后一轮架构审核；审核通过前不推进实现、契约冻结或生产接入。
