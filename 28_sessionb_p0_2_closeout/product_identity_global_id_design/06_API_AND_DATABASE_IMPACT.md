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

## 8. 对契约冻结的影响

- 本设计不修改 OpenAPI、不改变 `CANDIDATE_NOT_FROZEN`。
- 若 D-08 选择“路径参数改为 product_uid”，属于潜在不兼容变更，需走契约修订/版本化（`/api/v2` 或重新裁定）。
- 在契约冻结前，应完成 D-04/D-05/D-08 的负责人签署。

## 9. 决策点

- D-08：API 暴露 `pbk1_`、`product_uid` 或双字段；
- D-09：16 操作/75 矩阵的路径与 DTO 修订范围；
- D-10：迁移/幂等/并发/回滚。
- 当前 `PROPOSED_NOT_APPROVED`；不修改 OpenAPI/75 正式状态。