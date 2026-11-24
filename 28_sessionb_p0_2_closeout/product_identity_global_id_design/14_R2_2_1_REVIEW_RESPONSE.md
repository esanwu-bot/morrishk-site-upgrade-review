# R2.2.1 复核回应（约束闭环补强）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-014 |
| 版本 | v1.0-R2.2.1 |
| 日期 | 2026-11-24 |
| 状态 | **DESIGN_PACKAGE_R2_2_1_SUBMITTED** |
| 性质 | 对 Reviewer R2.2.1 三组缺口（Alias 时间语义、三类资源数据库约束、四角色可信身份/原子事务）的逐条回应；不是架构批准、不是实现、不是契约冻结 |
| 基线 | 分支 `docs/sessionb-product-identity-global-id-design`，父提交 `b150aca0dd4221f8d9eff8432ad179e4734b4d51`；本轮为独立追加提交，不 amend、不 rebase |
| 范围 | 仅三组约束闭环与测试向量；不重复 R2.2 摘要，不扩大为通用多租户平台设计 |

## 0. 本轮结论

- R2.2.1 三组修订均已执行，落到可实施的约束定义（CHECK / 复合外键 / 排斥约束 / 事务顺序 / 身份来源）。
- 新增 V-77…V-86 共 10 个设计测试，全部**未执行**。
- 未改 Ds Bit 源码、OpenAPI、75 矩阵、数据库、OAuth 实现；未重跑或修改 83 项测试证据。
- 状态仅为 `DESIGN_PACKAGE_R2_2_1_SUBMITTED`，等待架构审核。

## 1. A 组：Alias 时间语义与并发约束

| 项 | 内容 |
|---|---|
| 修改前问题 | 仅定义 `is_current` 与“不得重叠”，缺少可判定的时间字段一致性、重叠判定口径（同目标是否允许）、数据库级互斥实现与并发切换顺序 |
| 修改后的规则 | 1) 时间统一 UTC `timestamptz`，半开区间 `[valid_from, valid_to)`；2) `CHECK (valid_to IS NULL OR valid_to > valid_from)`；3) `CHECK ((is_current AND valid_to IS NULL) OR (NOT is_current AND valid_to IS NOT NULL))`；4) 同一唯一键任意两行区间不得重叠（含同目标），仅允许首尾相接；5) 当前映射部分唯一索引 + 历史区间排斥约束（`EXCLUDE USING gist`）同时生效；6) 并发切换对唯一键加行锁/`pg_advisory_xact_lock`，事务内“关闭旧行 + 插入新行”，必要时 `SERIALIZABLE` + 重试，冲突返回 `409 ALIAS_CONFLICT`/`PENDING_CONFLICT`；7) 幂等键与时间来源（服务端时钟/审批生效时间）约束 |
| 修改文件及章节 | `01_BRAND_IDENTITY.md` §6.5.1（时间语义与区间互斥、并发写入防护）；`02_MPN_NORMALIZATION.md` §4.6（同）；`04_GLOBAL_ID_REGISTRY.md` §3（CHECK 注释）/ §3.3.1（时间语义与并发闭环）；`06_API_AND_DATABASE_IMPACT.md` §4（索引/约束行） |
| 对首期 Morrishk 接入的影响 | 品牌/型号别名更名、替代料、normalizer 升级时不会产生重叠区间或双当前映射；并发导入按锁串行化，冲突可重试 |
| 仍需负责人签署 | D-16/D-17/D-18（Alias 作用域/冲突/独立注册表）、D-44（唯一约束与有效期） |

## 2. B 组：三类资源复合外键与 CHECK

| 项 | 内容 |
|---|---|
| 修改前问题 | 仅用文字表描述 Global/Tenant/Site 三类归属，缺少数据库级可验证约束；`site_id` 单列外键无法保证 Site 属于该 Tenant |
| 修改后的规则 | 1) `site` 增加 `UNIQUE (tenant_id, site_id)` 作为复合外键锚点；2) Global-level：`CHECK (tenant_id IS NULL AND site_id IS NULL)`；3) Tenant-level：`CHECK (tenant_id IS NOT NULL AND site_id IS NULL)` + `FK(tenant_id) → tenant`；4) Site-level：`CHECK (tenant_id IS NOT NULL AND site_id IS NOT NULL)` + 复合外键 `(tenant_id, site_id) → site(tenant_id, site_id)`；5) `audit_log` 按 `scope` CHECK（GLOBAL 两列均 NULL；TENANT 必带 tenant_id），`site_id` 非空时复合外键；6) 归属混用在数据库层直接失败，不依赖应用层 |
| 修改文件及章节 | `04_GLOBAL_ID_REGISTRY.md` §3.3.2（三类资源约束）；`06_API_AND_DATABASE_IMPACT.md` §4（`site`/`oauth_client`/`tenant_document`/`tenant_evidence`/`audit_log` 约束）/ §8.12（复合外键与 CHECK）；`10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` §2 / §4（B-09） |
| 对首期 Morrishk 接入的影响 | 首期 Morrishk 的 Site-level 行只能引用 `(Morrishk, 官网 Site)`；伪造 tenant/site 组合在写库时失败；全局行无法被填入 tenant/site |
| 仍需负责人签署 | D-24/D-25（全局产品与 tenant-only）、D-31（Tenant/Site 边界）、D-43（三类归属与审计归属） |

## 3. C 组：四角色可信身份、身份分离与原子事务

| 项 | 内容 |
|---|---|
| 修改前问题 | 四角色仅停留在文字职责，未定义身份来源（token vs 请求体）、数据库级身份分离、审批与全局写入的事务边界 |
| 修改后的规则 | 1) 四个身份字段一律来自校验后的 token 上下文（`client_id` + `subject` + 服务端角色绑定），不采信请求体自报 actor/tenant/site，记录 `auth_context_ref` 与角色快照；2) `CHECK (submitted_by <> tenant_approved_by)`、`CHECK (decided_by <> approved_by)`；3) 角色绑定互斥：Morrishk 仅 `tenant.editor`/`tenant.admin`，`identity.admin`/`identity.approver` 仅 Ds Bit 治理侧；4) **原子事务**：`decision_status→APPROVED`、`approved_at`、`global_product` 写入、alias/lineage、`audit_log` 同事务提交，任一步失败整体回滚；5) 幂等：同一 `(subject_type, subject_ref, decision_version)` 仅一次 APPROVED 生效；6) Tenant 侧接口不持有写 `global_product` 权限，Global 侧不复用 Tenant 审批代码路径 |
| 修改文件及章节 | `03_PRODUCT_IDENTITY_MODEL.md` §4.4（四角色链 + 可信身份与分离约束）；`04_GLOBAL_ID_REGISTRY.md` §3（`submitted_by`/`tenant_approved_by`/`decided_by`/`approved_by`/`auth_context_ref`）；`06_API_AND_DATABASE_IMPACT.md` §8.11 / §8.12（审批分离段）；`08_DECISION_REGISTER.md` D-41/D-42；`10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` §4（B-14/B-15/B-16） |
| 对首期 Morrishk 接入的影响 | Morrishk 可提交并完成 Tenant 审批，但无法伪造审批人、无法自我审批、无法持有全局角色；审批未完成时全局产品不变；事务失败不会产生半成品 |
| 仍需负责人签署 | D-15（执行/批准分离）、D-27（客户确认与全局治理）、D-41（Tenant Assertion）、D-42（Global Adjudication 角色与承担方） |

## 4. 新增测试向量（V-77…V-86，全部未执行）

| # | 覆盖 |
|---|---|
| V-77 | Alias `is_current` 与 `valid_to` 一致性 CHECK |
| V-78 | Alias 区间互斥（含同目标；首尾相接允许） |
| V-79 | Alias 并发切换（锁/重试/无双当前行） |
| V-80 | Site-level 复合外键（跨租户 site 拒绝） |
| V-81 | 三类归属 CHECK 混用拒绝 |
| V-82 | 审计 scope CHECK 与复合外键 |
| V-83 | 可信身份来自 token，请求体自报不一致拒绝 |
| V-84 | 角色分离（提交≠租户审批；决策≠全局批准） |
| V-85 | 审批原子事务（故障注入整体回滚） |
| V-86 | 角色绑定互斥（Morrishk 不得持有 identity.*） |

> 全部标记为设计测试、**未执行**；位于 `07_TEST_VECTORS.md` §2.5。

## 5. 文件变更

| 文件 | 变更 |
|---|---|
| `00_DESIGN_OVERVIEW.md` | v2.3-R2.2.1；阅读顺序加入 `14`；R2.2.1 摘要 |
| `01_BRAND_IDENTITY.md` | v2.3-R2.2.1；§6.5.1 时间语义、区间互斥、并发 |
| `02_MPN_NORMALIZATION.md` | v2.3-R2.2.1；§4.6 时间语义、区间互斥、并发 |
| `03_PRODUCT_IDENTITY_MODEL.md` | v2.3-R2.2.1；§4.4 可信身份、角色分离、原子事务 |
| `04_GLOBAL_ID_REGISTRY.md` | v2.3-R2.2.1；§3.3.1/§3.3.2、审批字段与 `auth_context_ref` |
| `06_API_AND_DATABASE_IMPACT.md` | v2.3-R2.2.1；§4 复合外键/索引、§8.12 约束与审批分离 |
| `07_TEST_VECTORS.md` | v2.3-R2.2.1；新增 V-77…V-86 |
| `08_DECISION_REGISTER.md` | v2.3-R2.2.1；D-42/D-43/D-44 约束化 |
| `10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` | v1.3-R2.2.1；三类约束、B-15/B-16/B-17 |
| `14_R2_2_1_REVIEW_RESPONSE.md` | 本文件（新增） |
| `SHA256SUMS` / `../DESIGN_AND_TEST_SHA256SUMS.txt` | 重新生成 |

## 6. 未改变（禁止事项核对）

- 未修改 Ds Bit 源码或 stash；未修改 OpenAPI、75 矩阵正式状态。
- 未实现 Business API；未生成或执行 DDL；未修改数据库。
- 未接真实 OAuth；未部署、未执行生产操作。
- 未重跑或修改 `../test_evidence_83/`。
- 未把本轮修订写成架构批准或契约冻结。

## 7. 仍需负责人签署

- D-41/D-42：Tenant Assertion 与 Global Adjudication 的角色、身份来源、审批分离与原子事务。
- D-43：三类资源归属、复合外键/CHECK 与全局审计归属。
- D-44：Alias 唯一约束、UTC 区间语义、区间互斥与并发处理。
- D-45/D-46：Token 可信上下文、首期 Evidence 可见性。
- V-77…V-86 的验收范围。

全部决策当前 `PROPOSED_NOT_APPROVED`，签署栏留白。

## 8. 状态

- 本轮：`DESIGN_PACKAGE_R2_2_1_SUBMITTED`。
- 未标记：`ARCHITECTURE_APPROVED` / `CONTRACT_FROZEN` / `P0_2_CLOSED` / `BUSINESS_API_IMPLEMENTATION_AUTHORIZED` / `PRODUCTION_READY`。
- 等待 Reviewer 架构审核；审核通过前不推进实现、契约冻结或生产接入。
