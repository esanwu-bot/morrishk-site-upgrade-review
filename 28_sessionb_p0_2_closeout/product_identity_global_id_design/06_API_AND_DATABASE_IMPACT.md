# API 与数据库影响分析

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-006 |
| 版本 | v2.1-R2.1 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 性质 | 影响分析；**不修改** OpenAPI、75 矩阵正式状态或数据库 |
| 事实基线 | 契约候选 `CANDIDATE_NOT_FROZEN`；75 项 0/75 可执行；无 Business API 实现 |
| 相关决策 | D-05、D-08、D-09、D-10、D-24…D-34 |

## 1. 16 个 API operations 的影响

| # | operation（候选） | 现有 Scope | 身份影响 | 影响 |
|---|---|---|---|---|
| 1 | `issueToken` | —（OAuth） | 无直接身份；token 主体绑定 tenant/site/client | 不新增 scope；不得用身份数据替代授权 |
| 2 | `searchProducts` | `product.read` | MPN/Brand 入参、自然键/别名解析 | 需明确 brand 缺失/冲突错误；只返回 tenant ACL 可见产品 |
| 3 | `getProduct` | `product.read` | 路径参数 `pbk1_` vs `product_uid` | 需 D-08 决定；DTO 增加 uid/brand/mpn_norm/variant_state |
| 4 | `getProductStatus` | `product.publish.read` | 同上 | 状态与身份分离；不泄露内部 ID |
| 5 | `listProductVersions` | `product.version.read` | 产品/版本关系 | 需明确版本是否独立身份 |
| 6 | `listProductEvidence` | `product.evidence.read` | 产品→文档→证据 | 证据链接到 document/page/bbox；私有证据受租户 ACL |
| 7 | `getProductCategories` | `product.category.read` + `product.publish.read` | 产品→分类 | 分类不是产品身份；不改 API 线形 |
| 8 | `listTaxonomies` | `product.category.read` | 无直接产品身份 | 影响小 |
| 9 | `getTaxonomy` | `product.category.read` | 无直接产品身份 | 影响小 |
| 10 | `getTaxonomyVersion` | `product.category.read` | 无直接产品身份 | 影响小 |
| 11 | `listCategories` | `product.category.read` | 无直接产品身份 | 影响小 |
| 12 | `listTaxonomyChanges` | `product.category.read` | 无直接产品身份 | 影响小 |
| 13 | `getCategory` | `product.category.read` | 无直接产品身份 | 影响小 |
| 14 | `listCategoryChildren` | `product.category.read` | 无直接产品身份 | 影响小 |
| 15 | `listCategoryAncestors` | `product.category.read` | 无直接产品身份 | 影响小 |
| 16 | `listCategoryProducts` | `product.category.read` | 分类→产品 | 需产品 UID/自然键映射，并按 tenant ACL 过滤 |

> 16 操作 = 13 必需 + 3 可选（含 issueToken）；具体 operationId 以候选 OpenAPI 为准。本文件不修改 OpenAPI。

## 2. 75 项 Scope × Endpoint 矩阵

- 现状：候选 75/75；CONFIRMED 0/75；正式可执行 **0/75**；R-OA-05 = PROPOSED。
- 本设计不改变任何矩阵状态。
- 影响：
  - 产品身份/UID 不改变 scope 语义；scope 仍是授权边界的第一层；
  - `searchProducts`/`getProduct` 等路径参数变化可能影响 75 行的 endpoint 标识；
  - 若新增“身份管理/合并/拆分/待确认裁决”运维操作，需另立 scope，不得塞进现有 5 scope；
  - 75 行刷新必须由 SA-1/SA-2 授权后执行，不能由本设计直接改状态。

## 3. Repository 接口影响

候选接口（不实现）：

```text
resolve_product(tenant_id, site_id, mpn_raw, brand_raw, hints) -> MatchResult
  MatchResult: CONFIRMED(product_uid) / PENDING_BRAND / PENDING_VARIANT /
               PENDING_CONFLICT / INVALID_MPN

get_product(tenant_id, site_id, product_uid | pbk1_ | legacy_product_id) -> ProductRecord
  # 先校验 tenant ACL 与 site 绑定，再解析身份

list_visible_products(tenant_id, site_id, filter) -> [ProductRecord]
  # 只返回 tenant_product_access 内且资源策略允许的产品

link_tenant_document(tenant_id, site_id, document_id, product_uid?, ownership, evidence)
record_import(tenant_id, site_id, idempotency_key, document_id, run_id, result, product_uid?, pending_id?)
merge_products(source_uid, target_uid, reason, approval)
split_product(source_uid, new_identity, reason, approval)
adjudicate_pending(pending_id | conflict_id, decision, actor, approval)
get_lineage(product_uid)
```

- 现有 Parser 产物不直接改；由适配层写入身份。
- 不接生产 DB；隔离实现用内存/fixture。
- 接口需幂等、可审计、可回滚，且所有入口显式带 `tenant_id`/`site_id`。

## 4. 数据库/索引影响（候选）

| 表 | 关键列 | 索引/约束 | 首期归属 |
|---|---|---|---|
| `tenant` | tenant_id, tenant_code, status | unique(tenant_code) | 首期必需 |
| `site` | site_id, tenant_id, domain, status | unique(tenant_id, domain); index(tenant_id) | 首期必需 |
| `oauth_client` | client_id, site_id, tenant_id, scopes, status | unique(client_id); index(site_id) | 首期必需 |
| `global_product` | product_uid, brand_id, mpn_norm, variant_state, variant_key, lifecycle_state | 部分唯一 `(brand_id, mpn_norm, variant_state, variant_key) WHERE lifecycle_state='ACTIVE'` | 首期必需 |
| `tenant_product_access` | tenant_id, product_uid, access_level, valid_from/to, revoked_at | PK(tenant_id, product_uid); index(product_uid) | 首期必需 |
| `tenant_document` | tenant_id, site_id, document_id, product_uid?, ownership | unique(tenant_id, document_id); index(site_id) | 首期必需 |
| `tenant_evidence` | tenant_id, site_id, evidence_id, document_id, run_id?, visibility, license_ref | unique(tenant_id, site_id, evidence_id); CHECK(site.tenant_id = tenant_id); index(document_id) | 首期必需 |
| `audit_log` | audit_id, scope, tenant_id?, site_id?, actor, action, ref, at | CHECK((scope='GLOBAL' AND tenant_id IS NULL) OR (scope='TENANT' AND tenant_id IS NOT NULL)); index(tenant_id, at); index(ref) | 首期必需 |
| `identity_pending` | pending_id, tenant_id, site_id, reason, status, idempotency_key | unique(idempotency_key); index(status) | 支撑身份 |
| `identity_conflict` | conflict_id, pending_id?, scope, tenant_id?, conflict_type, status | index(status) | 支撑身份 |
| `brand_registry` / `brand_alias` | brand_id / alias_norm, brand_id, scope, tenant_id? | `brand_registry` GLOBAL 无 tenant_id；`brand_alias` 部分唯一：GLOBAL(`alias_norm`)、TENANT(`tenant_id, alias_norm`)，并 CHECK scope/tenant_id 一致 | 支撑身份 |
| `mpn_alias` / `mpn_profile` | alias_norm, brand_id, mpn_norm, scope, tenant_id? / profile_scope, status | `mpn_alias` 部分唯一：GLOBAL(`brand_id, alias_norm`)、TENANT(`tenant_id, brand_id, alias_norm`)；`brand_id NOT NULL`；`mpn_profile` GLOBAL 无 tenant_id | 支撑身份 |
| `tenant_assertion` / `global_adjudication` | tenant_id, site_id, status / subject_type, decision, decided_by, approved_by | `tenant_assertion` 仅 TENANT；`global_adjudication` 仅 GLOBAL 且无 tenant_id；二者独立记录 | 支撑治理 |
| `global_product_alias` | alias_type, alias_value, product_uid | unique(alias_type, alias_value) | 兼容 |
| `product_lineage` / `product_import_event` | event_id, from/to, type / idempotency_key | index(from/to); unique(idempotency_key) | 审计/幂等 |
| `legacy_map` | legacy_product_id, product_uid, tenant_id, site_id | unique(legacy_product_id) | 兼容 |

- 八类首期实体为 `tenant`、`site`、`oauth_client`、`global_product`、`tenant_product_access`、`tenant_document`、`tenant_evidence`、`audit_log`；其余为身份/兼容支撑表，见 `10` §3。
- 归属必须按表区分：`global_product`、`brand_registry`、GLOBAL 作用域的 `brand_alias`/`mpn_alias`/`mpn_profile`、`global_adjudication` 为 GLOBAL-scoped，**不得带 `tenant_id`**；`tenant_document`、`tenant_evidence`、`tenant_assertion`、`identity_pending`、`tenant_product_access` 为 TENANT-scoped，**`tenant_id` NOT NULL**；`audit_log`/`identity_conflict` 为混合作用域，按 `scope` 判定归属。
- 自然键唯一约束是候选，不是已批准；仅对 CONFIRMED+ACTIVE 生效。
- 迁移/DDL 不在本轮执行。

## 5. DTO 与错误码影响

候选 DTO 字段：

```text
product_uid (new)
product_id (legacy, document-scoped; 保留)
mpn_raw / mpn_norm
brand_raw / brand_norm / brand_id
variant_state / variant_key
normalizer_version
product_business_key (pbk1_ candidate; optional)
identity_status
document_ids / version info
tenant_id / site_id (由 token 上下文注入，不信任客户端自报)
```

候选错误：

| 错误 | 场景 |
|---|---|
| `INVALID_MPN` | MPN 归一为空/非法 |
| `PRODUCT_IDENTITY_INCOMPLETE` / `MISSING_BRAND` | 缺 Brand（422） |
| `PENDING_BRAND` / `PENDING_VARIANT` / `PENDING_CONFLICT` | 身份未确认，非正式产品 |
| `CONFLICTING_IDENTITY` | 多候选/冲突 |
| `PRODUCT_NOT_FOUND` | 无匹配或不可见 |
| `PRODUCT_MERGED` / `PRODUCT_SPLIT` | 旧 ID 已合并/拆分（可重定向） |
| `IDEMPOTENCY_CONFLICT` | 同幂等键不同请求 |
| `SCOPE_REQUIRED` / `INSUFFICIENT_SCOPE` | 授权边界（沿用） |
| `TENANT_ACCESS_DENIED` | 产品不在 tenant_product_access |
| `SITE_BINDING_INVALID` | token 的 site 不属于其 tenant |
| `RESOURCE_POLICY_DENIED` | 文档/证据可见性不允许 |

> 错误码最终以契约冻结为准；本文件不修改现有错误目录。

## 6. 审计、幂等与并发

- 审计：身份创建/匹配/冲突/合并/拆分/别名/迁移/授权拒绝全部记录 actor/approved_by/time/tenant/site/evidence。
- 幂等：`idempotency_key` 唯一；重复请求返回同一结果。
- 并发：自然键部分唯一约束 + 事务 + 乐观锁；冲突返回明确错误，不创建重复。
- 审计日志不得含 token/secret；只记录 ID/原因/证据引用。
- 拒绝访问也必须审计（防止枚举探测）。

## 7. OAuth2 授权边界

- 身份数据不等于授权数据；`product_uid`/Brand 不是 scope。
- 5 scope/75 矩阵保持不变；新增身份管理操作需单独评估 scope。
- Token 必须绑定 `tenant_id`、`site_id`、`client_id`；`Site 1:N OAuth Client`，client 不得跨 Site 复用。
- 本轮不配置真实 OAuth、不签发生产凭证、不改 token 端点。
- T1/T2/T3 三身份分离不变。

### 7.1 Token 可信上下文来源（R2.1）

| # | 规则 | 说明 |
|---|---|---|
| R2.1-O1 | `issueToken` 依据服务端 `oauth_client` 注册记录解析 `client_id` | 不接受请求体自报的 `client_id` 作为可信来源；未注册/禁用 client 直接拒绝 |
| R2.1-O2 | `tenant_id` / `site_id` 由服务端数据库关系派生 | `client.site_id` → `site.tenant_id`；请求体中的 `tenant_id`/`site_id` 只作为待校验输入，不作为授权依据 |
| R2.1-O3 | 请求体中的 `tenant_id` / `site_id` **不得**直接写入 Token 作为授权依据 | 若与派生值不一致，直接拒绝（`SITE_BINDING_INVALID` / `TENANT_BINDING_INVALID`），不得“以请求体为准” |
| R2.1-O4 | `client`、`site`、`tenant` 三者必须一致 | `site.tenant_id` 是唯一真值；`oauth_client.tenant_id` 必须等于 `site.tenant_id`；不一致视为配置/凭证错误 |
| R2.1-O5 | Client/Site 禁用、撤销或绑定变化后的 Token 处理 | 见 §7.2 |
| R2.1-O6 | API 运行期必须重新校验可信认证上下文与资源归属 | 不得只信任 Token 内声明；四因子见 §8.3 |
| R2.1-O7 | 拒绝场景必须有测试向量 | 见 `07` V-66…V-70 |

### 7.2 Client/Site 状态变化后的 Token 规则（R2.1）

| 事件 | 已签发 Token 的候选处理 | 新 Token 申请 |
|---|---|---|
| `oauth_client.status` → DISABLED/REVOKED | 运行期校验即拒绝（不等过期）；可配合主动吊销 | 拒绝 |
| `site.status` → DISABLED | 该 site 的 client token 一律拒绝 | 拒绝 |
| Site 从一个 Tenant 迁移到另一 Tenant | 该 site 下 client 的既有 token 全部失效 | 需重新签发并绑定新 tenant |
| Client 重新绑定到其他 Site | 既有 token 携带旧 site 绑定 → 运行期拒绝 | 用新绑定签发 |
| `tenant.status` → SUSPENDED | 该 tenant 所有 token 拒绝 | 拒绝 |

- Token 内可缓存 `tenant_id`/`site_id`/`client_id`，但运行期必须以数据库当前关系为准复核；缓存不得成为绕过禁用/撤销的通道。
- 吊销/状态变更必须写审计；不得只依赖 Token 自然过期。

### 7.3 运行期校验顺序（R2.1）

```text
1. 解析并验证 Token 签名/有效期
2. 由 client_id 读取 oauth_client 当前状态（禁用/撤销 → 拒绝）
3. 由 site_id 读取 site 当前状态与 tenant 归属（禁用/不匹配 → 拒绝）
4. 校验 token 的 tenant_id/site_id/client_id 与服务端关系一致
5. 校验 scope
6. 校验 tenant_product_access（ACL）
7. 校验资源可见性（public/shared/private）
```

任一步失败即拒绝；拒绝也写 `audit_log`（含 scope 归属），不泄露资源是否存在（见 §8.7）。

## 8. Morrishk-first 租户隔离（R2-1）

> 本章回应 R2-1：首期只收敛 Morrishk 单 Tenant 的 Tenant / Site / OAuth Client / Global Product / Tenant Product Access 边界，不扩展为通用 SaaS 多租户平台。

### 8.1 首期实体与关系

```text
tenant                      -- 首期唯一：Morrishk
  tenant_id
  tenant_code
  status

site                        -- Tenant 1:N Site；首期只启用官网一个
  site_id
  tenant_id                 FK -> tenant
  primary_domain
  status

oauth_client                -- Site 1:N OAuth Client
  client_id
  site_id                   FK -> site
  tenant_id                 FK -> tenant（冗余校验，须与 site.tenant_id 一致）
  allowed_scopes
  status

global_product              -- 仅 CONFIRMED，详见 04
  product_uid
  brand_id / mpn_norm / variant_state / variant_key
  lifecycle_state

tenant_product_access       -- Tenant N:M Global Product
  tenant_id
  product_uid
  access_level              QUERYABLE / EXECUTABLE [候选]
  source                    CONTRACT / CUSTOMER_GRANT / DEFAULT
  valid_from / valid_to
  revoked_at

tenant_document
  tenant_id / site_id / document_id / product_uid? / ownership

tenant_evidence        -- Site 级私有证据；TENANT-scoped
  tenant_id / site_id / evidence_id / document_id / run_id?
  product_uid? / visibility / license_ref
  -- 约束：site.tenant_id = tenant_evidence.tenant_id；私有证据不跨租户

audit_log              -- 混合审计：GLOBAL/TENANT 分开
  audit_id / scope / tenant_id? / site_id?
  actor / action / target_ref / at
  -- CHECK：(scope='GLOBAL' AND tenant_id IS NULL) OR (scope='TENANT' AND tenant_id IS NOT NULL)
```

- 关系：`Tenant 1:N Site 1:N OAuth Client`；`Tenant N:M Global Product`（经 `tenant_product_access`）。
- 不建 `organization`、`organization_member`、`role_inheritance`、`billing_account`、`cross_tenant_share` 等首期实体。
- `tenant_document`/`tenant_evidence` 中的 `product_uid` 只可指向 CONFIRMED；PENDING 记录只关联待确认队列。

### 8.2 边界规则

| 规则 | 内容 |
|---|---|
| R2-1-T1 | **TENANT-scoped 业务行**（`tenant_document`、`tenant_evidence`、`tenant_assertion`、`identity_pending`、`tenant_product_access`）必须带 `tenant_id`；缺失即拒绝写入。**GLOBAL-scoped 行**（`global_product`、`brand_registry`、GLOBAL 作用域 alias、`mpn_profile`、`global_adjudication`）不得伪造 `tenant_id`；`site_id` 仅在 TENANT 行必填 |
| R2-1-T2 | 所有 token 必须绑定 `tenant_id + site_id + client_id`，三者必须自洽；绑定值来自服务端关系，不采信请求体（见 §7.1） |
| R2-1-T3 | Site 不可跨 Tenant；OAuth Client 不可跨 Site；`site.tenant_id` 是唯一真值 |
| R2-1-T4 | Global Product 只承载 CONFIRMED 身份与公共字段，不存客户私有 PDF/证据 |
| R2-1-T5 | 租户私有数据（PDF/解析/证据/备注）默认不出租户；共享需显式记录 |
| R2-1-T6 | Tenant Product Access 是产品可见性的唯一真值；不得用“全局产品存在”推断可访问 |
| R2-1-T7 | 客户确认（Tenant Assertion）仅作用于本租户，**不得直接写/改 `global_product`**；只有全局裁决（Global Adjudication）通过后才写 `global_product`，两层状态不得共用（见 §8.11） |
| R2-1-T8 | 首期只有 Morrishk 一个 Tenant；其他 tenant_id 不得出现在生产数据中 |
| R2-1-T9 | 全局身份治理事件写 `audit_log(scope='GLOBAL')`，`tenant_id` 必须为 NULL，不得强行归属 Morrishk；租户侧确认/拒绝写 `audit_log(scope='TENANT')` |
| R2-1-T10 | 同一产品私有证据不因产品全局化而跨租户共享；`tenant_evidence` 始终属于其 `tenant_id+site_id` |

### 8.3 四因子授权公式

```text
ALLOW = OAuth Scope
        AND Tenant ACL
        AND Site-to-Tenant Binding
        AND Resource Access Policy
```

| 因子 | 判定内容 | 失败语义 |
|---|---|---|
| OAuth Scope | token 是否含该 operation 所需 scope | `403 INSUFFICIENT_SCOPE` |
| Tenant ACL | `tenant_product_access` 是否允许该产品（有效期内、未撤销） | `403 TENANT_ACCESS_DENIED` 或 `404`（按 D-28） |
| Site-to-Tenant Binding | token 的 `site_id` 属于其 `tenant_id`，client 属于该 site | `403 SITE_BINDING_INVALID` |
| Resource Access Policy | 文档/证据可见性（私有/共享/公开）是否允许该租户 | `403 RESOURCE_POLICY_DENIED` 或过滤 |

- 四者缺一即拒绝；Scope 不替代 Tenant ACL；全局产品身份不替代访问权。
- `PENDING_*` 不参与产品可见性判断（无正式身份）；只能由具备待确认权限的内部角色访问。

### 8.4 允许/拒绝矩阵（10 场景）

| # | 场景 | Scope | Tenant ACL | Site 绑定 | 资源策略 | 结果 |
|---|---|---|---|---|---|---|
| S-01 | Morrishk token 查询 ACL 内已确认产品的公共文档 | 有 | 有 | 有效 | 公开 | **ALLOW** |
| S-02 | Morrishk token 查询不在 ACL 的产品 | 有 | 无 | 有效 | 公开 | **DENY**（403/404 按 D-28） |
| S-03 | token 缺 `product.read` 查询产品 | 无 | 有 | 有效 | 公开 | **DENY**（403） |
| S-04 | token 的 site 不属于其 tenant（伪造/错配） | 有 | 有 | 无效 | 公开 | **DENY**（403 SITE_BINDING_INVALID） |
| S-05 | token 的 client 属于其他 site（跨 site 复用） | 有 | 有 | 无效 | 公开 | **DENY**（403） |
| S-06 | 全局产品可见，但请求其他租户的私有证据 | 有 | 有 | 有效 | 私有且非本租户 | **DENY**（403 或过滤） |
| S-07 | 请求本租户私有证据（ACL 内产品） | 有 | 有 | 有效 | 本租户私有 | **ALLOW** |
| S-08 | 查询 `PENDING_*` 身份（未裁决） | 有 | — | 有效 | — | **DENY/NOT_FOUND**（无正式身份） |
| S-09 | 无 `identity.admin` 的角色执行合并/裁决 | 无 | — | 有效 | — | **DENY**（403） |
| S-10 | `issueToken` 请求未知或停用 site | — | — | 无效 | — | **DENY**（401/403） |
| S-11 | 请求体伪造 `tenant_id`/`site_id`，与服务端 client→site→tenant 派生值不一致 | 有 | — | 无效 | — | **DENY**（403，不采信请求体） |
| S-12 | client 或 site 已禁用/撤销后继续使用既有 token | 有 | — | 无效 | — | **DENY**（运行期复核状态） |

- 场景 S-04/S-05/S-11/S-12 在首期只有单 Site 时仍必须实现（防止配置错误/未来扩展/伪造请求）。
- 拒绝结果不得泄露资源是否存在；审计记录拒绝原因（内部）。

### 8.5 全局数据 vs 租户私有数据

| 数据 | 归属 | 跨租户 | 说明 |
|---|---|---|---|
| `global_product` 公共属性 | 全局 Canonical | 受 access 控制 | 仅规范化身份与公共字段 |
| 厂商公开 datasheet 证据 | 全局/公共 | 受许可与策略 | 记录来源与 license |
| 客户上传 PDF | `tenant_document` 私有 | 否 | 默认不出租户 |
| 解析 run/候选/表格 | 私有派生 | 否 | 随源 PDF |
| 客户私有证据 bbox/原文 | `tenant_evidence` 私有 | 否 | 不进 `global_product` |
| 客户备注/报价/内部状态 | 私有 | 否 | 不进全局 |
| 待确认/冲突记录 | 租户可见 | 否（首期） | 不含其他租户候选 |

- 全局产品与租户访问是两层：产品可以全局存在而不被某租户访问；产品被租户访问也不代表其私有证据可被别家访问。

### 8.6 各接口隔离规则（候选）

| 接口 | 四因子应用 | 失败行为 |
|---|---|---|
| `issueToken` | Site 必须存在且启用；client 由服务端注册记录解析并属于 site；tenant/site 由 DB 关系派生，不采信请求体 | 401/403 |
| `searchProducts` | scope + tenant ACL + site 绑定；PENDING 不出现 | 过滤 + 不泄露存在性 |
| `getProduct` | 先 ACL 再返回；私有产品不可见 | 403/404 按 D-28 |
| `getProductStatus` | 同上；租户私有状态不共享 | 403/404 |
| `listProductVersions` | 只返回租户可见版本/文档 | 过滤不可见版本 |
| `listProductEvidence` | scope + ACL + evidence visibility | 403/过滤，不返回私有 bbox |
| `getProductCategories` / 分类接口 | 分类可全局，产品-分类关系受 tenant ACL | 过滤不可见产品 |
| `listCategoryProducts` | 按 tenant ACL 过滤产品 | 过滤 |
| 合并/拆分/裁决（未来） | 需独立 `identity.admin` scope + 审批 | 403 |

- 75 矩阵状态不变；tenant ACL/site 绑定是 scope 之外的第二、三层，不改变 5 scope 定义。
- 具体 404 vs 403 由 D-28 裁定。

### 8.7 404/403 策略（D-28）

| 条件 | 候选行为 | 理由 |
|---|---|---|
| 资源存在但无 ACL | 404（默认）或 403（可诊断模式） | 防枚举 |
| 资源不存在 | 404 | 一致 |
| 缺 scope | 403 | 授权失败非存在性 |
| site 绑定无效 | 403 | 配置/凭证错误 |
| 私有证据越权 | 403 或过滤 | 防泄露 |

- 策略需安全评审；两种模式不得混用导致可推断存在性。

### 8.8 延后清单（reason / future impact）

| 延后项 | 原因 | 未来影响 | 决策 |
|---|---|---|---|
| Organization Tree（组织层级） | 首期单客户，无多组织授权需求 | 需新增 org 表、tenant 内层级、ACL 继承、数据回填 | D-35 |
| 复杂权限继承（角色/策略树） | 首期四因子已足够，继承规则未定义 | 需策略引擎、冲突消解、审计扩展 | D-36 |
| 计费/订阅 | 非本期商业范围 | 需 billing 实体、计量、对账；与 ACL 解耦 | D-37 |
| 跨租户协作/共享 | 无客户需求，安全风险高 | 需显式共享协议、授权、审计、撤回 | D-38 |
| 多 Site 运营 | 首期只有官网 | 实体已预留 `site_id`；需站点级配置/策略 | D-39 |
| 第三方 OAuth Client / 多客户端治理 | 首期单一自有 client | 需 client 注册、scope 审批、密钥轮换 | D-40 |

- 以上均**不在首期实现**；不建表、不写接口、不承诺时间。
- 架构预留：TENANT-scoped 行保留 `tenant_id` 并在文档/证据/断言层保留 `site_id`；GLOBAL-scoped 行不带 `tenant_id`；`access_level` 使用可扩展枚举。

### 8.9 首期 / 预留 / 延后 分类

| 类别 | 内容 |
|---|---|
| 首期必需 | `tenant`、`site`、`oauth_client`、`global_product`、`tenant_product_access`、`tenant_document`、`tenant_evidence`、`audit_log`；四因子校验 |
| 架构预留 | `site_id` 字段、`access_level` 枚举、TENANT-scoped 表 `tenant_id`、`client_id` 绑定 |
| 明确延后 | Organization Tree、权限继承、计费、跨租户协作、多 Site 运营、第三方 OAuth |

### 8.10 R2 待决事项

- D-31：Tenant/Site/OAuth Client 首期边界与唯一性；
- D-32：Site-to-Tenant Binding 与 OAuth Client 绑定规则；
- D-33：Tenant Product Access 模型与访问级别（QUERYABLE/EXECUTABLE 等）；
- D-34：Resource Access Policy 与 allow/deny 语义；
- D-35…D-40：延后项（Organization Tree、权限继承、计费、跨租户协作、多 Site、第三方 OAuth）。
- 当前 `PROPOSED_NOT_APPROVED`；不执行 DDL/实现。

### 8.11 Tenant Assertion 与 Global Identity Adjudication（R2.1）

两层必须分开，**不得共用同一个 CONFIRMED 状态**：

| 层 | 主体 | 作用域 | 允许 | 禁止 | 持久化 |
|---|---|---|---|---|---|
| Tenant Assertion | Morrishk（未来其他租户）授权用户 | 仅本租户 | 对自己上传资料、产品归属、Brand/MPN 提出确认/修正；附证据 | 写/改 `global_product`；代表他租户；替代全局审核 | `tenant_assertion`（`tenant_id`/`site_id` NOT NULL）+ `audit_log(scope='TENANT')` |
| Global Identity Adjudication | Ds Bit 全局治理角色 | 全局 | 审核 pending/conflict/assertion；批准后写 `global_product` | 覆盖/删除客户原始 assertion 记录 | `global_adjudication`（无 `tenant_id`）+ `audit_log(scope='GLOBAL')` |

- 客户断言状态：`SUBMITTED` / `UNDER_REVIEW` / `ACCEPTED_BY_GLOBAL` / `REJECTED_BY_GLOBAL` / `WITHDRAWN`；**不存在**客户可直接达成的 `CONFIRMED`。
- `ACCEPTED_BY_GLOBAL` 只表示全局采纳了断言，不等于 `global_product` 已创建；写入全局身份仍由 `global_adjudication` 的执行/批准分离流程完成。
- 全局拒绝或修改客户断言时，只追加裁决引用，**不得覆盖**客户原始记录。
- 首期角色边界：Morrishk 可提交 Tenant Assertion（建议 `tenant.editor` 提交、`tenant.admin` 确认），但**不得**持有 `identity.admin`，不得执行 Global Adjudication。
- 裁决接口属未来身份管理操作，需独立 scope 评估；本轮不实现、不接真实 OAuth。

### 8.12 全局/租户数据归属对照（R2.1）

| 数据 | 归属 | `tenant_id` | `site_id` | 审计 scope |
|---|---|---|---|---|
| `global_product` | GLOBAL | 禁止出现 | 禁止出现 | GLOBAL |
| `brand_registry` | GLOBAL | 禁止出现 | 禁止出现 | GLOBAL |
| `brand_alias` / `mpn_alias` | 按 `scope` 判定 | `TENANT` 必填；`GLOBAL` 必须为 NULL | 不需要 | 按 scope |
| `mpn_profile` | GLOBAL | 禁止出现 | 禁止出现 | GLOBAL |
| `global_adjudication` / `product_lineage` | GLOBAL | 禁止出现 | 禁止出现 | GLOBAL |
| `tenant_document` / `tenant_evidence` | TENANT | 必填 | 必填 | TENANT |
| `tenant_assertion` | TENANT | 必填 | 必填 | TENANT |
| `tenant_product_access` | TENANT | 必填 | 不需要 | TENANT |
| `identity_pending` | TENANT | 必填 | 必填 | TENANT |
| `identity_conflict` | 混合（`scope`） | `TENANT` 必填 / `GLOBAL` 必须为 NULL | `TENANT` 必填 | 按 scope |
| `audit_log` | 混合（`scope`） | `TENANT` 必填 / `GLOBAL` 必须为 NULL | `TENANT` 必填 | 自身 |

- “所有业务行必须带 `tenant_id`”是过度宽泛表述，已废止；改为按上表判定。
- 全局身份治理事件不得强行归属 Morrishk；若事件实际由 Morrishk 的断言触发，则同时保留 TENANT 侧 assertion 记录与 GLOBAL 侧裁决记录，二者独立可追溯。

## 9. 对契约冻结的影响

- 本设计不修改 OpenAPI、不改变 `CANDIDATE_NOT_FROZEN`。
- 若 D-08 选择“路径参数改为 product_uid”，属于潜在不兼容变更，需走契约修订/版本化（`/api/v2` 或重新裁定）。
- 在契约冻结前，应完成 D-04/D-05/D-08/D-31…D-34 的负责人签署。

## 10. 决策点

- D-08：API 暴露 `pbk1_`、`product_uid` 或双字段；
- D-09：16 操作/75 矩阵的路径与 DTO 修订范围；
- D-10：迁移/幂等/并发/回滚；
- D-24：全局产品共享与字段边界；
- D-25：Tenant 模型（R2 收敛为仅 tenant，Organization 延后）；
- D-26：私有 PDF/解析/证据边界；
- D-27：客户确认与全局治理；
- D-28：404/403 存在性泄露策略；
- D-31/D-32/D-33/D-34：首期租户/站点/客户端/访问模型；
- D-35…D-40：延后项。
- 当前 `PROPOSED_NOT_APPROVED`；不修改 OpenAPI/75 正式状态。