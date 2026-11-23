# API 与数据库影响分析

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-006 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 性质 | 影响分析；**不修改** OpenAPI、75 矩阵正式状态或数据库 |
| 事实基线 | 契约候选 `CANDIDATE_NOT_FROZEN`；75 项 0/75 可执行；无 Business API 实现 |
| 相关决策 | D-05、D-08、D-09、D-10 |

## 1. 16 个 API operations 的影响

| # | operation（候选） | 现有 Scope | 身份影响 | 影响 |
|---|---|---|---|---|
| 1 | `issueToken` | —（OAuth） | 无直接身份；token 主体/租户 | 不新增 scope；不得用身份数据替代授权 |
| 2 | `searchProducts` | `product.read` | MPN/Brand 入参、自然键/别名解析 | 需明确 brand 缺失/冲突错误；结果身份字段 |
| 3 | `getProduct` | `product.read` | 路径参数 `pbk1_` vs `product_uid` | 需 D-08 决定；DTO 增加 uid/brand/mpn_norm |
| 4 | `getProductStatus` | `product.publish.read` | 同上 | 状态与身份分离；不泄露内部 ID |
| 5 | `listProductVersions` | `product.version.read` | 产品/版本关系 | 需明确版本是否独立身份 |
| 6 | `listProductEvidence` | `product.evidence.read` | 产品→文档→证据 | 证据链接到 document/page/bbox |
| 7 | `getProductCategories` | `product.category.read` + `product.publish.read` | 产品→分类 | 分类不是产品身份；不改 API 线形 |
| 8 | `listTaxonomies` | `product.category.read` | 无直接产品身份 | 影响小 |
| 9 | `getTaxonomy` | `product.category.read` | 无直接产品身份 | 影响小 |
| 10 | `getTaxonomyVersion` | `product.category.read` | 无直接产品身份 | 影响小 |
| 11 | `listCategories` | `product.category.read` | 无直接产品身份 | 影响小 |
| 12 | `listTaxonomyChanges` | `product.category.read` | 无直接产品身份 | 影响小 |
| 13 | `getCategory` | `product.category.read` | 无直接产品身份 | 影响小 |
| 14 | `listCategoryChildren` | `product.category.read` | 无直接产品身份 | 影响小 |
| 15 | `listCategoryAncestors` | `product.category.read` | 无直接产品身份 | 影响小 |
| 16 | `listCategoryProducts` | `product.category.read` | 分类→产品 | 需产品 UID/自然键映射 |

> 16 操作 = 13 必需 + 3 可选（含 issueToken）；具体 operationId 以候选 OpenAPI 为准。本文件不修改 OpenAPI。

## 2. 75 项 Scope × Endpoint 矩阵

- 现状：候选 75/75；CONFIRMED 0/75；正式可执行 **0/75**；R-OA-05 = PROPOSED。
- 本设计不改变任何矩阵状态。
- 影响：
  - 产品身份/UID 不改变 scope 语义；scope 仍是授权边界；
  - `searchProducts`/`getProduct` 等路径参数变化可能影响 75 行的 endpoint 标识；
  - 若新增“身份管理/合并/拆分”运维操作，需另立 scope，不得塞进现有 5 scope；
  - 75 行刷新必须由 SA-1/SA-2 授权后执行，不能由本设计直接改状态。

## 3. Repository 接口影响

候选接口（不实现）：

```text
resolve_product(mpn_raw, brand_raw, hints) -> MatchResult
  MatchResult: CONFIRMED(uid) / PENDING_BRAND / PENDING_CONFLICT / INVALID_MPN

get_product(product_uid | pbk1_ | legacy_product_id) -> ProductRecord
link_document(product_uid, document_id, relation, evidence)
record_import(idempotency_key, document_id, run_id, result, product_uid)
merge_products(source_uid, target_uid, reason, approval)
split_product(source_uid, new_identity, reason, approval)
get_lineage(product_uid)
```

- 现有 Parser 产物不直接改；由适配层写入身份。
- 不接生产 DB；隔离实现用内存/fixture。
- 接口需幂等、可审计、可回滚。

## 4. 数据库/索引影响（候选）

| 表 | 关键列 | 索引/约束 |
|---|---|---|
| `brand_registry` | brand_id, brand_norm, status | unique(brand_norm), index(status) |
| `brand_alias` | alias_norm, brand_id | unique(alias_norm), index(brand_id) |
| `product_registry` | product_uid, brand_id, mpn_norm, variant_key, status | unique(natural key candidate), index(status/brand) |
| `product_document` | product_uid, document_id | PK(product_uid, document_id), index(document_id) |
| `product_alias` | alias_type, alias_value, product_uid | unique(alias_type, alias_value) |
| `product_lineage` | event_id, from_uid, to_uid, type | index(from/to) |
| `product_import_event` | idempotency_key, document_id, run_id | unique(idempotency_key) |
| `legacy_map` | legacy_product_id, product_uid, document_id | unique(legacy_product_id) |

- 自然键唯一约束是候选，不是已批准；变体/多版本字段待 D-04。
- 迁移/DDL 不在本轮执行。

## 5. DTO 与错误码影响

候选 DTO 字段：

```text
product_uid (new)
product_id (legacy, document-scoped; 保留)
mpn_raw / mpn_norm
brand_raw / brand_norm / brand_id
normalizer_version
product_business_key (pbk1_ candidate; optional)
identity_status
document_ids / version info
```

候选错误：

| 错误 | 场景 |
|---|---|
| `INVALID_MPN` | MPN 归一为空/非法 |
| `PRODUCT_IDENTITY_INCOMPLETE` / `MISSING_BRAND` | 缺 Brand（422） |
| `PENDING_CONFLICT` / `CONFLICTING_IDENTITY` | 多候选/冲突 |
| `PRODUCT_NOT_FOUND` | 无匹配 |
| `PRODUCT_MERGED` / `PRODUCT_SPLIT` | 旧 ID 已合并/拆分（可重定向） |
| `IDEMPOTENCY_CONFLICT` | 同幂等键不同请求 |
| `SCOPE_REQUIRED` / `INSUFFICIENT_SCOPE` | 授权边界（沿用） |

> 错误码最终以契约冻结为准；本文件不修改现有错误目录。

## 6. 审计、幂等与并发

- 审计：身份创建/匹配/冲突/合并/拆分/别名/迁移全部记录 actor/approved_by/time/evidence。
- 幂等：`idempotency_key` 唯一；重复请求返回同一结果。
- 并发：自然键唯一约束 + 事务 + 乐观锁；冲突返回明确错误，不创建重复。
- 审计日志不得含 token/secret；只记录 ID/原因/证据引用。

## 7. OAuth2 授权边界

- 身份数据不等于授权数据；`product_uid`/Brand 不是 scope。
- 5 scope/75 矩阵保持不变；新增身份管理操作需单独评估 scope。
- 本轮不配置真实 OAuth、不签发生产凭证、不改 token 端点。
- T1/T2/T3 三身份分离不变。

## 8. Global Product Identity vs Tenant Product Access

> 本章回应 Reviewer R1：全局产品身份与租户访问必须分层，不能把“同一产品”与“同一客户可见数据”混为一谈。

### 8.1 概念分层

| 层 | 含义 | 是否跨客户共享 | 例子 |
|---|---|---|---|
| Global Canonical Product | 标准化后的产品身份与公共属性 | 可共享（受治理） | `(brand_norm, mpn_norm, variant)` 规范身份 |
| Tenant Product Access | 某客户/组织对产品的可见/可用关系 | 不共享 | 客户 A 可看产品 X；客户 B 不可见 |
| Tenant Private Data | 客户私有 PDF、解析结果、证据、备注、私有产品 | 不共享 | 客户上传的 datasheet、内部报价、私有证据 |
| Public/Canonical Evidence | 可公开/已授权的证据引用 | 受来源与许可约束 | 厂商公开 datasheet 的页码/bbox |

### 8.2 方案比较

| 方案 | 描述 | 优点 | 风险 | 迁移成本 | 适用 |
|---|---|---|---|---|---|
| A. 完全全局产品注册表 | 所有客户共享一个产品库与证据库 | 去重最好、搜索最全 | 客户私有数据/证据泄露；客户 A 的确认影响 B；合规风险 | 低（但安全风险高） | 仅公开数据、单租户 |
| B. 每租户独立产品注册表 | 每个租户一套产品/文档/证据 | 隔离最强 | 同一产品重复、跨租户无法复用、运维成本高 | 中 | 强隔离/单客户部署 |
| C. 全局 Canonical Product + Tenant Product Access 映射（推荐候选） | 全局规范产品 + 租户访问关系/私有数据分层 | 可复用、可隔离、可审计 | 需要 tenant ACL/映射/治理 | 中高 | 多客户 SaaS/平台 |

**推荐 C**，但需负责人确认：
- 全局产品是否允许跨客户共享；
- 哪些字段属于全局公共属性，哪些属于租户私有；
- 客户私有 PDF/证据是否允许进入全局产品（默认：不允许，除非明确授权）。

### 8.3 候选关系模型（不执行 DDL）

```text
tenant
  tenant_id / organization_id
  status

global_product
  product_uid
  brand_id / mpn_norm / variant_key
  canonical_status
  public_fields_policy

tenant_product_access
  tenant_id
  product_uid
  access_level          VISIBLE / QUERYABLE / EXECUTABLE [候选]
  source                CUSTOMER_GRANT / CONTRACT / DEFAULT
  valid_from / valid_to
  revoked_at

tenant_document
  tenant_id
  document_id
  product_uid           nullable
  ownership             CUSTOMER_PRIVATE / SHARED_PUBLIC
  source / evidence_ref

tenant_evidence_acl
  tenant_id
  evidence_id
  visibility            PRIVATE / SHARED / PUBLIC
  license_ref
```

- 全局产品表不直接存客户私有 PDF/证据；私有数据放租户层。
- 一个 `product_uid` 可被多个 tenant 通过 `tenant_product_access` 访问；一个 tenant 可有私有产品/文档。
- 租户私有产品是否进入全局 Canonical：默认否；需客户授权/治理流程。

### 8.4 租户/组织与产品关系

- Tenant 1..* Organization（若客户有多个组织/子公司）；ACL 至少绑定 tenant_id，必要时 organization_id。
- 产品访问是 tenant↔product 多对多；不得用 owner_tenant 单一字段替代 ACL。
- 客户私有产品可有 `tenant_id` owner；全局产品不归属单一客户。
- 客户身份确认（如客户 A 确认某 Brand/MPN）**不得影响其他客户**；全局规则变更需独立治理/签署。

### 8.5 私有 PDF/解析结果/证据边界

| 数据 | 默认归属 | 跨租户可见 | 说明 |
|---|---|---|---|
| 客户上传 PDF | 租户私有 | 否 | 除非客户明确授权共享 |
| 解析 run/候选/表格 | 租户私有 | 否 | 由私有 PDF 派生 |
| 证据 bbox/页码/短原文 | 随来源 | 仅共享来源 | 客户私有证据不得进入公共产品 |
| 全局公开 datasheet 证据 | 全局/公共 | 可共享（受许可） | 需来源与许可记录 |
| 客户备注/报价/内部状态 | 租户私有 | 否 | 不进全局产品 |

- 搜索/详情/证据接口必须同时检查 **scope + tenant ACL + evidence visibility**。
- 不得通过“产品是全局的”推断“所有客户可见其私有证据”。

### 8.6 OAuth Scope 与 Tenant/Org ACL 组合

```text
allowed = scope_allows(operation) AND tenant_acl_allows(tenant, resource)
```

- Scope 授权“操作类别”；Tenant ACL 授权“数据范围”；两者缺一不可。
- 不得用 scope 替代 tenant ACL；也不得用 tenant ACL 绕过 scope。
- Token 必须绑定 tenant/organization（或可由 client 解析）；跨租户 token 不得复用。
- 客户 A 的 token 不得因全局产品共享而访问客户 B 的私有文档/证据。
- OAuth2 仍是候选/未实现；本轮不配置真实 OAuth。

### 8.7 各接口隔离规则（候选）

| 接口 | 租户隔离规则 | 失败行为 |
|---|---|---|
| `searchProducts` | 只返回 tenant ACL 可见的全局/私有产品；私有产品不跨租户 | 不泄露存在性；按策略 404/空结果 |
| `getProduct` | `product_uid` + tenant ACL；私有产品仅 owner 可见 | 403/404（不泄露） |
| `getProductStatus` | 同上；状态可含租户私有状态（不共享） | 403/404 |
| `listProductVersions` | 只返回该产品下租户可见版本/文档 | 过滤不可见版本 |
| `listProductEvidence` | scope + tenant ACL + evidence visibility | 403/404；不返回私有 bbox/原文 |
| `getProductCategories` / 分类接口 | 分类可全局，但产品-分类关系受 tenant ACL | 过滤不可见产品 |
| `issueToken` | token 绑定 tenant/org；不得跨租户 | 401/403 |

- 具体 404 vs 403 策略需负责人/安全确认（避免存在性泄露 vs 可诊断性）。
- 75 矩阵状态不变；tenant ACL 是 scope 之外的第二层，不改变 5 scope 定义。

### 8.8 若最终选择单租户

必须明确写出：

- 假设：只有一个 tenant/organization，全局产品 = 该租户可见产品；
- 限制：不能直接扩展到多租户；私有/公共证据边界不完整；
- 未来扩展成本：需增加 tenant ACL、数据回填、接口过滤、OAuth tenant 绑定、迁移/回归；
- 不得把单租户实现表述为“多租户就绪”。

### 8.9 R1 待决事项

- D-24：全局产品是否跨客户共享，共享字段范围；
- D-25：Tenant/Organization 模型与 ACL 粒度；
- D-26：客户私有 PDF/解析/证据的默认边界与共享授权；
- D-27：客户确认是否影响其他客户/全局规则治理；
- D-28：404/403 存在性泄露策略与审计。
- 当前 `PROPOSED_NOT_APPROVED`；不执行 DDL/实现。

## 9. 对契约冻结的影响

- 本设计不修改 OpenAPI、不改变 `CANDIDATE_NOT_FROZEN`。
- 若 D-08 选择“路径参数改为 product_uid”，属于潜在不兼容变更，需走契约修订/版本化（`/api/v2` 或重新裁定）。
- 在契约冻结前，应完成 D-04/D-05/D-08 的负责人签署。

## 10. 决策点

- D-08：API 暴露 `pbk1_`、`product_uid` 或双字段；
- D-09：16 操作/75 矩阵的路径与 DTO 修订范围；
- D-10：迁移/幂等/并发/回滚；
- D-24：全局产品共享与字段边界；
- D-25：Tenant/Organization/ACL 模型；
- D-26：私有 PDF/解析/证据边界；
- D-27：客户确认与全局治理；
- D-28：404/403 存在性泄露策略。
- 当前 `PROPOSED_NOT_APPROVED`；不修改 OpenAPI/75 正式状态。