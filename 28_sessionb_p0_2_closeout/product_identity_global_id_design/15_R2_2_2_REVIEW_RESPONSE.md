# R2.2.2 复核回应（最小一致性修订）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-015 |
| 版本 | v1.0-R2.2.2 |
| 日期 | 2026-11-24 |
| 状态 | **DESIGN_PACKAGE_R2_2_2_SUBMITTED** |
| 性质 | 对 Reviewer A/B/C 三组残留问题的逐条回应；不是架构批准、不是实现、不是契约冻结 |
| 基线 | 分支 `docs/sessionb-product-identity-global-id-design`，父提交 `381f46c5664c2114a93d2f22b9a0513c1227d21e`；本轮独立追加提交，不 amend、不 rebase |
| 范围 | 仅 A/B/C 三组一致性修订；不重新设计八实体模型，不扩大为通用多租户平台 |

## 0. 本轮结论

- A 组：废止“同目标重叠可合并”，统一任意区间不重叠；`is_current` 当且仅当语义；空键首次插入改为唯一键级 advisory lock。
- B 组：`identity_pending` 明确 Site-level；`identity_conflict` 采用 GLOBAL/TENANT 双作用域并给出各自完整约束；`audit_log` 改为 GLOBAL/TENANT/SITE 三作用域；五张 Site-level 表逐表确认复合外键。
- C 组：新增服务端稳定 `principal_id` 与角色域互斥；审批状态与批准字段强一致 CHECK；两阶段事务边界（Tenant 前置独立提交，Global 最终事务重校验）。
- 新增 V-87…V-94 共 8 个设计测试，全部**未执行**。
- 状态仅为 `DESIGN_PACKAGE_R2_2_2_SUBMITTED`。

## 1. A 组：Alias 规则统一

| 项 | 内容 |
|---|---|
| 修改前问题 | 仍保留“同目标重叠可合并”；`is_current` 语义未写成当且仅当；并发首次插入把空结果 `FOR UPDATE` 当作已获锁；约束职责表述可被理解为应用层可替代数据库约束 |
| 修改后的规则 | 1) **废止“同目标重叠可合并”**；同一唯一键任意两个区间均不得重叠（含同目标），仅允许首尾相接；2) `is_current = true` ⟺ `valid_to IS NULL`，首期禁止未来生效行；3) 空键首次插入必须用唯一键级 `pg_advisory_xact_lock` 或等效机制，明确空结果行锁不等于获锁；4) 已存在记录时在唯一键互斥后锁行，同一事务完成区间校验、关闭旧行、插入新行、写审计；5) 部分唯一索引负责当前映射唯一、数据库排斥约束负责历史不重叠，应用层仅补充；6) Brand Alias 与 MPN Alias 唯一键分别列明 |
| 修改文件及章节 | `01_BRAND_IDENTITY.md` §6.5.1；`02_MPN_NORMALIZATION.md` §4.6；`04_GLOBAL_ID_REGISTRY.md` §3.3.1；`06_API_AND_DATABASE_IMPACT.md` §4（索引/约束职责） |
| 对首期 Morrishk 接入的影响 | 品牌/型号别名更名与替代料场景不会产生重叠区间；并发首次导入由 advisory lock 串行化；不存在“先重叠后合并”的隐式路径 |
| 仍需负责人签署 | D-16/D-17/D-18、D-44 |

## 2. B 组：三类资源归属约束补齐

| 项 | 内容 |
|---|---|
| 修改前问题 | `identity_pending` 未在表定义中写明复合外键；`identity_conflict` 在 §3.3.2 与 §8.12 分别被描述为 Tenant-level 与混合，口径矛盾；`audit_log` 的 TENANT 事件未区分是否有 site；Site-level 表约束散落 |
| 修改后的规则 | 1) `identity_pending`：`tenant_id`/`site_id` NOT NULL + CHECK + 复合外键 `(tenant_id, site_id) → site`，并增加 `UNIQUE (tenant_id, site_id, pending_id)`；2) `identity_conflict`：**GLOBAL/TENANT 双作用域**——GLOBAL 三列均 NULL 且不引用 pending；TENANT 三列均 NOT NULL，分别走 `(tenant_id, site_id)` 与 `(tenant_id, site_id, pending_id)` 复合外键；3) `audit_log`：**GLOBAL/TENANT/SITE 三作用域**，GLOBAL 两列 NULL、TENANT 带 tenant 且 site NULL、SITE 两列均必填并走复合外键；4) `oauth_client`、`tenant_document`、`tenant_evidence`、`tenant_assertion`、`identity_pending` 五张 Site-level 表逐表确认复合外键；5) Global/ Tenant/ Site 逐表列明，不再只在概述中写规则 |
| 修改文件及章节 | `04_GLOBAL_ID_REGISTRY.md` §3（`identity_pending`/`identity_conflict`/`audit_log`）/ §3.3.2（逐表归属与约束）；`06_API_AND_DATABASE_IMPACT.md` §4 / §8.12；`10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` §2 / §4（B-09/B-10） |
| 对首期 Morrishk 接入的影响 | 冲突记录只能以 GLOBAL（无租户）或 TENANT（Morrishk + 官网 Site）两种合法形态存在；审计事件按三级归属落库，无法把全局事件写进 Morrishk |
| 仍需负责人签署 | D-24/D-25、D-31、D-43 |

## 3. C 组：可信身份与审批状态约束补齐

| 项 | 内容 |
|---|---|
| 修改前问题 | `client_id + subject` 被当作自然人的可信标识，未处理同一自然人跨 Client 的 subject 差异；角色互斥只写“绑定表需有约束”未说明对象与禁止组合；审批状态与批准字段没有 CHECK；把 Tenant 审批与 Global 最终审批写进同一跨阶段事务，边界过重 |
| 修改后的规则 | 1) **稳定主体**：新增服务端 `principal_id`，`client_subject_binding (client_id, subject) → principal_id` 多对一；四个审批字段统一引用 `principal_id`，禁用请求体自报 actor；2) **角色来源与互斥**：角色来自 `principal_role`，含 `role_domain`（TENANT/GLOBAL）；同一 principal 不得同时持有 `{tenant.editor, tenant.admin}` 与 `{identity.admin, identity.approver}`，以唯一/排斥约束强制；3) **状态 CHECK**：`PROPOSED` 批准字段均 NULL、`APPROVED` 均 NOT NULL、`REJECTED` 均 NULL；`decided_by_principal_id <> approved_by_principal_id`；Tenant Assertion 的 `SUBMITTED`/`UNDER_REVIEW` 批准字段 NULL，`TENANT_APPROVED` 及之后均 NOT NULL；4) **两阶段事务**：Tenant 审批独立提交 `TENANT_APPROVED`；Global 最终阶段在新事务内锁定并重新验证该状态，再原子完成裁决批准、`global_product`、alias/lineage、GLOBAL audit；失败整体回滚；重复/并发审批幂等 |
| 修改文件及章节 | `03_PRODUCT_IDENTITY_MODEL.md` §4.4；`04_GLOBAL_ID_REGISTRY.md` §3（`principal`/`client_subject_binding`/`principal_role`/审批字段与 CHECK）；`06_API_AND_DATABASE_IMPACT.md` §8.12；`07_TEST_VECTORS.md` §2.6；`08_DECISION_REGISTER.md` D-42/D-47/D-48；`10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` §4（B-15…B-19） |
| 对首期 Morrishk 接入的影响 | Morrishk 用户经不同 Client 登录仍归一到同一 principal，无法通过换 Client 规避角色互斥；Tenant 审批与全局裁决分阶段提交，任一阶段失败不会产生半成品 |
| 仍需负责人签署 | D-15、D-27、D-41、D-42、D-47、D-48 |

## 4. 新增测试向量（V-87…V-94，全部未执行）

| # | 覆盖 |
|---|---|
| V-87 | 同一自然人经不同 Client/subject 仍归一到同一 principal，不能承担互斥角色 |
| V-88 | `PROPOSED` 状态提前写 `approved_by`/`approved_at` 必须拒绝 |
| V-89 | `APPROVED` 状态缺少批准字段必须拒绝 |
| V-90 | Tenant Assertion 未 `TENANT_APPROVED` 时，Global Adjudication 不得写 `global_product` |
| V-91 | 空 Alias 键上两个并发首次插入，由 advisory lock 串行化、仅一条当前映射 |
| V-92 | 同目标区间重叠必须拒绝 |
| V-93 | `identity_conflict` 双作用域 CHECK/复合外键 |
| V-94 | `audit_log` 三作用域 CHECK/复合外键 |

> 全部标记为设计测试、**未执行**；位于 `07_TEST_VECTORS.md` §2.6。V-77…V-86 仍保持“未执行”。

## 5. 文件变更

| 文件 | 变更 |
|---|---|
| `00_DESIGN_OVERVIEW.md` | v2.4-R2.2.2；阅读顺序加入 `15`；R2.2.2 摘要 |
| `01_BRAND_IDENTITY.md` | v2.4-R2.2.2；§6.5.1 废止同目标合并、当且仅当语义、空键 advisory lock |
| `02_MPN_NORMALIZATION.md` | v2.4-R2.2.2；§4.6 同上 |
| `03_PRODUCT_IDENTITY_MODEL.md` | v2.4-R2.2.2；§4.4 principal、角色域、状态 CHECK、两阶段事务 |
| `04_GLOBAL_ID_REGISTRY.md` | v2.4-R2.2.2；§3.3.1/§3.3.2、principal 三表、双作用域冲突、三作用域审计 |
| `06_API_AND_DATABASE_IMPACT.md` | v2.4-R2.2.2；§4 约束、§8.12 逐表/双作用域/principal |
| `07_TEST_VECTORS.md` | v2.4-R2.2.2；新增 V-87…V-94 |
| `08_DECISION_REGISTER.md` | v2.4-R2.2.2；D-42/D-43/D-44 收敛，新增 D-47/D-48 |
| `10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` | v1.4-R2.2.2；双作用域冲突、三作用域审计、B-15…B-19 |
| `15_R2_2_2_REVIEW_RESPONSE.md` | 本文件（新增） |
| `SHA256SUMS` / `../DESIGN_AND_TEST_SHA256SUMS.txt` | 重新生成 |

## 6. 未改变（禁止事项核对）

- 未修改 Ds Bit 源码或 stash；未修改 OpenAPI、75 矩阵正式状态。
- 未生成或执行 DDL；未修改数据库；未接真实 OAuth。
- 未开始 Business API 实现；未部署、未执行生产操作。
- 未重跑或修改 `test_evidence_83/`。
- V-77…V-86 保持设计测试、未执行；V-87…V-94 同样未执行。
- 未把本轮提交标记为 `ARCHITECTURE_APPROVED`、`CONTRACT_FROZEN`、`P0_2_CLOSED` 或 `PRODUCTION_READY`。

## 7. 仍需负责人签署

- D-16/D-17/D-18/D-44：Alias 唯一约束、时间语义、并发与历史保留。
- D-24/D-25/D-31/D-43：三类归属、冲突双作用域、审计三作用域。
- D-41/D-42/D-47/D-48：Tenant Assertion、Global Adjudication、principal 与角色域互斥、审批状态与两阶段事务。
- D-45/D-46：Token 可信上下文、首期 Evidence 可见性。
- V-87…V-94 的验收范围。

全部决策当前 `PROPOSED_NOT_APPROVED`，签署栏留白。

## 8. 状态

- 本轮：`DESIGN_PACKAGE_R2_2_2_SUBMITTED`。
- 未标记：`ARCHITECTURE_APPROVED` / `CONTRACT_FROZEN` / `P0_2_CLOSED` / `BUSINESS_API_IMPLEMENTATION_AUTHORIZED` / `PRODUCTION_READY`。
- 等待 Reviewer 独立复核；复核通过前不推进实现、契约冻结或生产接入。
