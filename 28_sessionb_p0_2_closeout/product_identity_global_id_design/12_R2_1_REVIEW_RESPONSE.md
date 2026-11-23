# R2.1 复核回应（Reviewer 定点修订）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-012 |
| 版本 | v1.0-R2.1 |
| 日期 | 2026-11-23 |
| 状态 | **DESIGN_PACKAGE_R2_1_SUBMITTED** |
| 性质 | 对 Reviewer 六项问题与编号问题的逐条回应；不是架构批准、不是实现、不是契约冻结 |
| 基线 | 分支 `docs/sessionb-product-identity-global-id-design`，基线提交 `dfde642f34e1d131297381761c5ae8355d807731`；本轮为独立追加提交，不 amend、不 rebase |
| 范围 | 仅文档定点修订；不重新设计架构、不扩大业务范围、不修改 Ds Bit 源码 |

## 0. 本轮结论

- 六项问题与测试向量编号问题均已在文档层面修复。
- 不生成 DDL、不执行迁移、不改数据库、不接真实 OAuth、不修改 OpenAPI/75 矩阵/83 项测试证据。
- 所有新增规则仍为候选，全部待负责人签署。
- 本轮不构成架构批准；状态仅为 `DESIGN_PACKAGE_R2_1_SUBMITTED`。

## 1. R2.1-1：MPN Alias 强制 Brand 上下文

| 项 | 内容 |
|---|---|
| 修改前问题 | `mpn_alias` 的 Brand 归属不明确，存在仅凭 MPN 原文跨 Brand 解析、以及 `brand_id` 可空的歧义；查找顺序未显式锁定 Brand |
| 修改后的规则 | 1) `mpn_alias.brand_id` **NOT NULL**；2) 每条 MPN Alias 必须归属一个 `brand_id`（缺 Brand 不得入库）；3) 禁止仅凭 MPN 原文跨 Brand 解析，必须先锁定 Brand；4) `GLOBAL` 不允许带 `tenant_id`、`TENANT` 必须带 `tenant_id`；5) 同作用域、同 Brand、同 Alias 指向多个 canonical MPN → `PENDING_CONFLICT`，不得自动选一 |
| 修改文件及章节 | `01_BRAND_IDENTITY.md` §6.5；`02_MPN_NORMALIZATION.md` §3 / §4.6；`04_GLOBAL_ID_REGISTRY.md` §3（`mpn_alias` 结构）/ §3.3 / §3.3.1 / §4 |
| 对首期 Morrishk 接入的影响 | Morrishk 的 MPN 别名只能在已确定 Brand 的前提下解析；无 Brand 的历史别名必须先补 Brand 才能参与身份确认；冲突别名进入待确认队列，不阻塞其他产品 |
| 仍需负责人签署 | D-01/D-02（Brand 权威来源与别名治理）、D-03/D-19（MPN Profile）、D-18（Alias 独立注册表与作用域） |

## 2. R2.1-2：Alias 唯一约束与有效期

| 项 | 内容 |
|---|---|
| 修改前问题 | 仅笼统写“按作用域唯一”，未给出可实施唯一键；未定义 `scope` 与 `tenant_id` 一致性、有效期区间语义、重叠处理、失效后再分配、版本保留；`06` 仍出现被禁止的 `unique(alias_norm, scope, tenant_id)` |
| 修改后的规则 | 1) GLOBAL Brand Alias：`alias_norm` 全局唯一；2) TENANT Brand Alias：`(tenant_id, alias_norm)` 唯一；3) GLOBAL MPN Alias：`(brand_id, alias_norm)` 唯一；4) TENANT MPN Alias：`(tenant_id, brand_id, alias_norm)` 唯一；5) `CHECK (scope='GLOBAL' AND tenant_id IS NULL) OR (scope='TENANT' AND tenant_id IS NOT NULL)`；6) `valid_from` 必填、`valid_to` 可空，半开区间 `[valid_from, valid_to)` 且 `valid_to > valid_from`；7) 同唯一键有效期不得重叠指向不同目标，重叠拒绝或 `PENDING_CONFLICT`；8) 失效别名允许重新分配，但必须新增行并保留旧行；9) `normalizer_version` 变更只新增行、不改旧行，旧版本可回溯；10) 实现形式为部分唯一索引 + 区间排斥约束/应用层事务校验，本轮不生成 DDL |
| 修改文件及章节 | `01_BRAND_IDENTITY.md` §6.5.1；`02_MPN_NORMALIZATION.md` §4.6；`04_GLOBAL_ID_REGISTRY.md` §3（注释约束）/ §3.3.1；`06_API_AND_DATABASE_IMPACT.md` §4（索引/约束行） |
| 对首期 Morrishk 接入的影响 | 首期单 Tenant 下，TENANT 唯一键退化为 `(Morrishk, alias_norm)` 与 `(Morrishk, brand_id, alias_norm)`；GLOBAL 别名由 Ds Bit 治理；历史别名保留可查 |
| 仍需负责人签署 | D-16/D-17/D-18（Alias 作用域/冲突/独立注册表）、D-44（唯一约束与有效期） |

## 3. R2.1-3：Global 与 Tenant 数据归属

| 项 | 内容 |
|---|---|
| 修改前问题 | 文档存在“所有业务行必须带 `tenant_id`”的过度宽泛表述，未区分全局数据；`audit_log` 未区分 GLOBAL/TENANT 事件，可能把全局治理事件强行归属 Morrishk |
| 修改后的规则 | 1) TENANT-scoped 表 `tenant_id` NOT NULL；2) GLOBAL-scoped 表不得伪造 `tenant_id`；3) 混合表（`audit_log`、`identity_conflict`）按 `scope` 判定；4) 明确 `global_product`、`brand_registry`、GLOBAL Brand Alias、全局 MPN Profile、`global_adjudication`、`product_lineage` 为全局归属；5) 全局身份治理事件写 `audit_log(scope='GLOBAL')` 且 `tenant_id IS NULL`，不得归属 Morrishk；附录给出逐表归属对照 |
| 修改文件及章节 | `06_API_AND_DATABASE_IMPACT.md` §8.1 / §8.2（R2-1-T1、T9）/ §8.9 / §8.12；`10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` §2 / §4（B-09、B-10）/ §6 / §8 |
| 对首期 Morrishk 接入的影响 | Morrishk 只拥有 TENANT 行；全局产品/品牌/裁决由 Ds Bit 侧治理与审计；Morrishk 无法通过写入 `tenant_id` 伪造全局归属 |
| 仍需负责人签署 | D-24（全局产品与租户访问）、D-25（tenant-only）、D-43（数据归属与审计归属） |

## 4. R2.1-4：tenant_evidence 的 Site 边界

| 项 | 内容 |
|---|---|
| 修改前问题 | 各文件对 `tenant_evidence` 的 Tenant/Site 归属口径不一致（部分仅 `tenant_id`），未定义 Site 一致性约束；未说明产品全局化后私有证据是否共享 |
| 修改后的规则 | 统一为 **Site 级、TENANT-scoped** 资源：1) 必带 `tenant_id` 与 `site_id`；2) `site.tenant_id = tenant_evidence.tenant_id`；3) 必须关联来源 `document_id`（及可选的来源 `run_id`），至少之一可追溯；4) `product_uid` 只可指向 CONFIRMED 且不改变证据归属；5) 私有 Evidence 不因产品全局化而跨租户共享；6) 唯一键 `(tenant_id, site_id, evidence_id)` |
| 修改文件及章节 | `04_GLOBAL_ID_REGISTRY.md` §3（`tenant_evidence` 结构与约束）；`06_API_AND_DATABASE_IMPACT.md` §4 / §8.1 / §8.2（T10）/ §8.12；`10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` §2 / §4（B-11）/ §6 |
| 对首期 Morrishk 接入的影响 | 首期 evidence 全部归属 `Morrishk + 官网 Site`；后续新增 Site 时证据天然按 Site 隔离，不需改表；私有 bbox/原文不出租户 |
| 仍需负责人签署 | D-26（私有 PDF/解析/证据边界）、D-34（资源可见性）、D-39（多 Site 预留） |

## 5. R2.1-5：Tenant Assertion 与 Global Identity Adjudication

| 项 | 内容 |
|---|---|
| 修改前问题 | 客户确认与全局确认可能共用 `CONFIRMED` 语义；未区分两层记录，存在客户确认直接修改 `global_product` 的风险；首期 Morrishk 角色边界不清 |
| 修改后的规则 | A. **Tenant Assertion**：Morrishk 对自己上传资料/产品归属/MPN/Brand 提出确认或修正；仅在本租户生效；保存 `tenant_id`、`site_id`、actor、evidence、时间、状态（`SUBMITTED`/`UNDER_REVIEW`/`ACCEPTED_BY_GLOBAL`/`REJECTED_BY_GLOBAL`/`WITHDRAWN`），**不得直接修改 `global_product`**。B. **Global Identity Adjudication**：由 Ds Bit 全局治理角色审核，执行/批准分离；只有全局审核通过才允许写入 `global_product`；客户原始确认与全局裁决独立留存，全局拒绝/修改不得覆盖客户原记录。C. 两层不共用 `CONFIRMED` 状态。D. 首期 Morrishk 可提交 Tenant Assertion（`tenant.editor` 提交、`tenant.admin` 确认），但不得持有 `identity.admin`、不得执行 Global Adjudication |
| 修改文件及章节 | `03_PRODUCT_IDENTITY_MODEL.md` §4.4；`04_GLOBAL_ID_REGISTRY.md` §3（`tenant_assertion`/`global_adjudication`）；`06_API_AND_DATABASE_IMPACT.md` §8.2（T7）/ §8.11；`08_DECISION_REGISTER.md` D-41、D-42；`10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` §4（B-03）/ §6 |
| 对首期 Morrishk 接入的影响 | Morrishk 可提交确认并留痕，但身份是否全局生效取决于 Ds Bit 侧裁决；客户不会因“确认”而直接改写全局身份 |
| 仍需负责人签署 | D-15（执行/批准分离）、D-27（客户确认与全局治理）、D-41（Tenant Assertion 范围）、D-42（Global Adjudication 角色与承担方） |

## 6. R2.1-6：OAuth Token 可信上下文

| 项 | 内容 |
|---|---|
| 修改前问题 | 仅声明 token 绑定 tenant/site/client，未说明可信来源；请求体 `tenant_id`/`site_id` 可能被误当授权依据；未定义 client/site 禁用、撤销、绑定变化后的 token 行为；缺少对应拒绝向量 |
| 修改后的规则 | 1) `issueToken` 依服务端 `oauth_client` 注册记录解析 `client_id`，未注册/禁用即拒绝；2) `tenant_id`/`site_id` 由 `client.site_id` → `site.tenant_id` 派生；3) 请求体 `tenant_id`/`site_id` 只作待校验输入，不得直接成为授权依据，不一致即拒绝；4) client/site/tenant 三者必须一致；5) client/site/tenant 禁用、撤销、绑定变化后，既有 token 在运行期复核时一律拒绝，不得只依赖自然过期；6) API 运行期按“签名→client 状态→site 状态与 tenant 归属→三者一致→scope→ACL→资源策略”顺序复核；7) 新增拒绝向量 V-67…V-70 |
| 修改文件及章节 | `06_API_AND_DATABASE_IMPACT.md` §7.1–§7.3 / §8.4（S-11、S-12）/ §8.6；`10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` §4（B-05、B-12）/ §5 / §7；`07_TEST_VECTORS.md` §2.3 |
| 对首期 Morrishk 接入的影响 | 首期单 Site 仍强制执行 client→site→tenant 派生与运行期复核；Morrishk 无法通过请求体自报 tenant/site 提权；停用 client/site 后即时失效 |
| 仍需负责人签署 | D-30（四因子）、D-32（Site-to-Tenant Binding）、D-45（Token 可信上下文与状态处理） |

## 7. R2.1-7：测试向量编号与交叉一致性

| 项 | 内容 |
|---|---|
| 修改前问题 | 正文引用 `V-29…V-43`，实际表内已到 `V-50`，编号描述不一致；缺少 R2.1 新增场景 |
| 修改后的规则 | 1) 统一为 `V-29…V-50 共 22 个`；2) 新增 `V-51…V-70 共 20 个` R2.1 向量，覆盖 Brand 上下文 MPN Alias、Alias 有效期重叠/重分配/版本保留、Global/Tenant 归属、全局审计归属、Tenant Assertion、Global Adjudication、证据 Site 边界、伪造 tenant_id、禁用 Client/Site、未知 client；3) 全部标记为**设计测试，未执行**；4) 与 `03` §4.4、`04` §3.3.1、`06` §7/§8.11/§8.12、`08` D-41…D-45、`10` §4 交叉核对一致 |
| 修改文件及章节 | `07_TEST_VECTORS.md` §1 / §2.1 / §2.2 标题 / §2.3 / §5 |
| 对首期 Morrishk 接入的影响 | 实现期验收范围明确；未执行不代表已通过，接入前必须按签署后的决策补齐 |
| 仍需负责人签署 | D-41…D-45，以及 V-51…V-70 的验收口径（最小集 vs 全量） |

## 8. 文件变更

| 文件 | 变更 |
|---|---|
| `00_DESIGN_OVERVIEW.md` | v2.1-R2.1；阅读顺序加入 `12`；R2.1 摘要 |
| `01_BRAND_IDENTITY.md` | v2.1-R2.1；MPN Alias `brand_id` NOT NULL、Brand 锁定查找、Brand Alias 唯一约束与有效期 |
| `02_MPN_NORMALIZATION.md` | v2.1-R2.1；MPN Alias Brand 上下文、唯一键、有效期/版本保留 |
| `03_PRODUCT_IDENTITY_MODEL.md` | v2.1-R2.1；Tenant Assertion 与 Global Adjudication 分层 |
| `04_GLOBAL_ID_REGISTRY.md` | v2.1-R2.1；`mpn_alias` NOT NULL、§3.3.1 唯一约束与有效期、workflow 增加 alias 解析 |
| `06_API_AND_DATABASE_IMPACT.md` | v2.1-R2.1；归属规则、tenant_evidence site_id、OAuth 可信上下文、索引/约束修正、§8.11/§8.12 |
| `07_TEST_VECTORS.md` | v2.1-R2.1；修正 V-29…V-50 编号，新增 V-51…V-70 |
| `08_DECISION_REGISTER.md` | v2.1-R2.1；新增 D-41…D-45、分类/签署/依赖 |
| `10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` | v1.1-R2.1；数据归属、evidence Site 边界、token 上下文、首期范围项 |
| `12_R2_1_REVIEW_RESPONSE.md` | 本文件（新增） |
| `SHA256SUMS` / `../DESIGN_AND_TEST_SHA256SUMS.txt` | 重新生成 |

## 9. 未改变（禁止事项核对）

- 未修改 Ds Bit 源码；未触碰 Ds Bit stash。
- 未修改 OpenAPI；未修改 75 Scope × 15 Endpoints 正式矩阵。
- 未实现 Business API；未生成或执行 DDL；未修改数据库。
- 未接真实 OAuth；未部署、未执行生产操作。
- 未修改 `../test_evidence_83/`（83 项测试证据与 R2 提交一致）。
- 未把本轮修订写成架构批准。

## 10. 仍需负责人签署的事项

- D-01/D-02/D-03/D-16/D-17/D-18/D-19：Brand 与 MPN 治理、Alias 作用域。
- D-24/D-25/D-26/D-27/D-30/D-32/D-34：全局产品、租户/站点/客户端、私有数据、四因子授权。
- D-41：Tenant Assertion 模型与首期 Morrishk 可提交范围。
- D-42：Global Identity Adjudication 角色、执行/批准分离与首期承担方。
- D-43：GLOBAL/TENANT 数据归属与全局审计归属。
- D-44：Brand/MPN Alias 唯一约束与有效期。
- D-45：OAuth Token 可信上下文与 Client/Site 状态变化处理。
- V-51…V-70 的验收范围。

全部决策当前 `PROPOSED_NOT_APPROVED`，签署栏留白。

## 11. 状态

- 本轮：`DESIGN_PACKAGE_R2_1_SUBMITTED`。
- 未标记：`ARCHITECTURE_APPROVED` / `CONTRACT_FROZEN` / `P0_2_CLOSED` / `BUSINESS_API_IMPLEMENTATION_AUTHORIZED` / `PRODUCTION_READY`。
- 等待 Reviewer 独立复核；复核通过前不推进实现、契约冻结或生产接入。
