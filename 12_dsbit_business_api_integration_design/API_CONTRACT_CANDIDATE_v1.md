# Business API 契约候选稿 v1

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-CONTRACT-001 |
| 版本 | `v1.0-candidate` |
| 日期 | 2026-11-17 |
| 状态 | **`CANDIDATE_NOT_FROZEN`（候选，未冻结，未获批实现）** |
| 机器可读稿 | `contract/openapi.candidate.v1.json`（OpenAPI 3.1.0） |
| 机器可读稿 SHA-256 | `fdeec48ecf44439776e61245ca7b98fc94f7ce0d481a7c9aea639900f1e71023` |
| 上游设计 | `Ds Bit ↔ Morrishk Business API Integration Design v1.md`（v1.3） |
| 编制基线 | 本仓库 `main@3ecb54b`（编制时 HEAD）；Phase 1 Mock 验收基线 `0474b19` |
| 基线时效 | 编制后 Session A 在 `13_` 追加 `647b4f0`、`77afeb0`（仅 `13_`），HEAD 前移但 `12_`/`14_`/`15_` 内容未变 |
| 决策依据 | `14_phase0_authority_adjudication/DECISION_REGISTER.md` §2.1 / §2.2 / §2.3（IQ-01 / IQ-02 / IQ-13，2026-11-17） |
| 性质 | 契约**候选**与接口示例；**不是**冻结契约、**不是**生产实现、**不是**部署或凭证签发 |

> 本文件是供独立 Contract Freeze 评审的候选输入。它**不**把任何 `PROPOSED` 项升级为 `DECIDED`，
> **不**把任何 `OPEN` 项标为已裁定，也**不**构成生产实现授权。
> 机器可读稿中的 `x-contract-status` 必须保持 `CANDIDATE_NOT_FROZEN`，直到独立冻结记录签发。

---

## 1. 本候选稿的范围与非声明

### 1.1 包含

1. 12 个 **V1_REQUIRED** 唯一路径 + `POST /oauth/token`，共 13 个必需操作；另有 3 个 **V1_OPTIONAL** 操作（合计 16 个操作）。见 §6。
2. 统一响应包、20 个业务错误码与 4 个错误判定维度；见 §7。
3. 产品业务身份与 `product_business_key` 候选编码；见 §4。
4. 技术参数字典的字段边界与 `DEMO_FIXTURE` 隔离规则；见 §5。
5. 发布/撤回语义、`visible_state` 派生规则与消费方行为；见 §9。
6. OAuth2 Client Credentials 的参数、TTL、撤销传播上限；见 §8。
7. 分页、版本、ETag、幂等、限流、弃用策略；见 §7.5–§7.9。
8. Mock 与契约、生产之间的差异矩阵；见 §10。

### 1.2 不包含 / 明确不声明

| 不声明 | 说明 |
|---|---|
| 冻结契约 | 状态为 `CANDIDATE_NOT_FROZEN`；冻结需独立评审记录，当前无 |
| 生产 API 可用 | Ds Bit 当前无生产 Business API 实现 |
| OAuth2 生产凭证 | 未创建、未签发、未注册任何生产客户端 |
| 生产数据库 | 未连接、未迁移、未写入 |
| 真实同步 | 未执行任何真实产品/分类同步 |
| MpnNormalizer 已批准 | 规则集仍为 `PROPOSED`，需评审冻结 |
| 未决问题已裁定 | IQ-05 / IQ-09 / IQ-15 / IQ-21 仍为 `OPEN`；其余未决项见 §11 |
| Mock 结果等同真实数据 | 所有 Mock 数据为 `DEMO_FIXTURE`，不构成真实数据验证 |
| 已修改 13_ | 本次未改动 `13_dsbit_duckdb_s3_pipeline/` 任何文件 |

---

## 2. 状态词汇（严格区分）

| 状态 | 含义 | 本文件中的用法 |
|---|---|---|
| `DECIDED` | 已有书面裁定并登记 | 仅用于 IQ-01 / IQ-02 / IQ-13；**不等于**已签署或已验收 |
| `PROPOSED` | 设计建议，可被评审修改 | 用于身份编码、枚举、限流数值等 |
| `OPEN` | 尚无裁定 | 用于 IQ 未决项，必须列为冻结阻断 |
| `CANDIDATE_NOT_FROZEN` | 本文件与 OpenAPI 的当前状态 | 唯一允许的契约状态 |
| `PASS_MOCK` | Mock UI 独立验收通过 | 仅由 Reviewer 判定；本文件不自行授予 |
| `FROZEN` | 契约冻结 | **当前不存在** |

---

## 3. 输入与权威边界

### 3.1 已有书面裁定（直接引用，不重新讨论）

| IQ | 裁定要点 | 对契约的影响 |
|---|---|---|
| IQ-01 | 跨系统产品身份为 `MPN + Brand`；唯一键 `(mpn_norm, brand_norm)`；`prod-{document_id}` 不得作产品身份 | 路由参数使用 `product_business_key`；产品 DTO 保留 `mpn_raw/mpn_norm/brand_raw/brand_norm/normalizer_version` |
| IQ-02 | 技术参数分类归 Ds Bit；业务导航分类归 Morrishk；两套 ID 不共享；PM 提供种子 | `/taxonomies` 与 `/categories` 仅承载技术分类；不提供业务导航分类端点 |
| IQ-13 | 目标系统为 Morrishk 新平台业务库；旧站不作目标；两侧自增 ID 不作跨系统身份 | 同步与映射候选仅指向新平台 `pd_*`；契约不出现旧站 ID 语义 |

裁定登记见 `14_phase0_authority_adjudication/DECISION_REGISTER.md`。
三项裁定均**待签署**、**未完成独立 Reviewer 验收**，不得表述为已验收。

### 3.2 上游设计文档内部待协调项

| 编号 | 现象 | 处理 |
|---|---|---|
| VISIBLE-STATE-RECONCILIATION | §6.4 的查询参数 `release_state` 取 `RELEASED/REVOKED/PENDING`；§8.2 的派生 `visible_state` 取 `DRAFT/IN_REVIEW/RELEASED/WITHDRAWN`；§8.1 的闸门名用 `PIPELINE_PASS/CONTENT_APPROVED/RELEASE_APPROVED` | 本候选稿保留三者原义并显式标注为**不同命名空间**；枚举对齐列为冻结阻断（§11 B6）。**不**由执行 Agent 自行合并或改名 |

---

## 4. 产品业务身份规则

### 4.1 身份字段（`PROPOSED`）

| 字段 | 规则 |
|---|---|
| `mpn_raw` | 原样保留大小写、空白、原始字符 |
| `brand_raw` | 原样保留；可空 |
| 归一化输入 | 必须是 UTF-8 字符串；NUL/控制字符/非法 UTF-8 → `INVALID` |
| Unicode | NFKC；移除零宽字符（U+200B–U+200D、U+FEFF） |
| 空白 | 去首尾；内部连续空白折叠为单个 ASCII 空格；不删除内部空格 |
| 大小写 | Unicode 大写 |
| 连接符 | U+2010–U+2015、U+2212、U+FF0D → ASCII `-`；保留 `- / _ .` |
| 品牌 | 与 MPN 同一套规则；**不**剥离公司后缀、**不**做别名合并 |
| 空值 | MPN 归一后为空 → `INVALID_MPN`；Brand 缺失/归一为空 → `PENDING_BRAND` |
| 冲突 | 多个互斥候选或落入多个既有身份 → `PENDING_CONFLICT`；不自动合并 |
| 原始保留 | 始终保存 raw 值与 `normalizer_version` |

规则集名称：`MPN-NORM-v1`。状态：`PROPOSED`，需评审冻结；冻结后任何规则变化必须升版本号。

### 4.2 身份状态机

| 状态 | 进入条件 | 是否生成跨系统身份 |
|---|---|---|
| `CONFIRMED` | MPN 与 Brand 均归一成功且唯一 | 是 |
| `PENDING_BRAND` | Brand 缺失或归一为空 | 否 |
| `PENDING_CONFLICT` | 同一来源给出互斥候选，或归一结果落入多个既有身份 | 否 |
| `INVALID` | MPN 非法/为空，或含控制字符/孤立代理项 | 否 |

候选项聚合（Mock 与契约方向一致）：
无候选 → `INVALID/NO_CANDIDATES`；含非法候选 → `INVALID/INVALID_INPUT`；
MPN、Brand 或键任一出现多个 → `PENDING_CONFLICT/CONFLICTING_IDENTITY`；
否则含缺 Brand 候选 → `PENDING_BRAND/MISSING_BRAND`；否则 `CONFIRMED`。

### 4.3 `product_business_key` 候选编码（`PROPOSED`）

```text
canonical = "PBK1\n" + utf8ByteLen(mpn_norm) + ":" + mpn_norm
                   + "\n" + utf8ByteLen(brand_norm) + ":" + brand_norm
key       = "pbk1_" + lowercase_hex(sha256(UTF-8(canonical)))
```

- `utf8ByteLen` 是 UTF-8 **字节**长度，不是字符数。
- 使用完整 SHA-256，不截断；`pbk1_` + 64 位小写十六进制，共 69 字符。
- `normalizer_version` **不进入**哈希；作为并列元数据保存。
- 缺 Brand 不生成键。
- 编码本身仍为候选，冻结前允许调整；一旦冻结，变更视为不兼容变更。

### 4.4 唯一性规则

1. 同一 `mpn_norm` + 不同 `brand_norm` → 两个独立身份。
2. 同一 `(mpn_norm, brand_norm)` + 多文档 → 一个身份，文档为关联记录。
3. 唯一键在数据库层为 `(mpn_norm, brand_norm)`；不得因当前数据稀疏而退化为仅 MPN。
4. `document_id` 仅用于文档去重与证据定位；**不得**出现在任何产品身份路由或身份字段中。

### 4.5 精确查找语义

- `GET /products/search?mpn=...&brand=...&mpn_match=exact`：
  - 缺 `mpn` → `400 INVALID_ARGUMENT`；
  - MPN 含控制字符 → `400 INVALID_ARGUMENT`（`field=mpn`）；
  - MPN 归一后为空 → `400 INVALID_ARGUMENT`（`field=mpn`）；
  - 缺 `brand` → `422 PRODUCT_IDENTITY_INCOMPLETE`（`missing=["brand"]`）；
  - Brand 含控制字符 → `400 INVALID_ARGUMENT`（`field=brand`）；
  - Brand 归一后为空 → `422 PRODUCT_IDENTITY_INCOMPLETE`；
  - 冲突 → `422 MPN_NORMALIZATION_CONFLICT`。
- 不得把非法输入伪装为空结果；不得返回 `200` 空列表代替错误。
- `mpn_match=loose` 仍为 `OPEN`（IQ-20），v1 默认不启用。

---

## 5. 技术参数字典规则

### 5.1 职责边界（IQ-02 裁定）

- 技术参数分类与参数字典由 **Ds Bit** 管理并生成。
- 业务导航分类（旧站 `snsii_product_category`、新平台 `pd_category`）由 **Morrishk** 管理，**不**通过本 API 读取或写入。
- 两套分类 ID **不得**直接共享；业务导航分类的 `category_id` 不得冒充技术分类 ID。

### 5.2 字典字段候选（`PROPOSED`）

`parameter_code`、`canonical_name`、`display_name`、`definition`、`data_type`、
`canonical_unit`、`applicable_scope`、`synonyms`、`source`、`dictionary_version`、`status`。

候选核心字段：`Package`、`Voltage`、`Operating_Temperature`。
正式 code、定义、单位、数据类型、适用范围以 **PM 确认的真实种子**为准；执行 Agent 不得臆定。

### 5.3 Fixture 边界

- 所有开发数据必须显式标记 `DEMO_FIXTURE`。
- Fixture 不得作为正式种子、不得混入正式字典、不得写入正式业务数据。
- UI 使用 Fixture 时必须显示演示数据标识。
- Fixture 测试通过**不得**表述为真实数据验证通过。
- PM 种子尚未提交；在收到种子前，契约只固定**结构**，不固定**字典内容**。

---

## 6. 端点清单

Base path：`/api/v1`。所有业务端点返回统一响应包；`POST /oauth/token` 遵循 RFC 6749，不使用响应包。

### 6.1 V1_REQUIRED（12 个唯一路径 / 13 个操作，含 Token）

| # | 方法 | 路径 | 必需 scope | 说明 |
|---|---|---|---|---|
| 1 | POST | `/oauth/token` | —（Basic 客户端认证） | Client Credentials 签发 opaque Token |
| 2 | GET | `/products/search` | `product.read` | 搜索、MPN 精确查找、增量同步；支持 `release_state=REVOKED` |
| 3 | GET | `/products/{product_business_key}` | `product.read` | 产品业务 DTO |
| 4 | GET | `/products/{product_business_key}/status` | `product.publish.read` | 三层闸门 + `visible_state` |
| 5 | GET | `/products/{product_business_key}/versions` | `product.version.read` | 内容版本列表 |
| 6 | GET | `/products/{product_business_key}/evidence` | `product.evidence.read` | 证据引用与短原文 |
| 7 | GET | `/products/{product_business_key}/categories` | `product.category.read`（内部读取另需 `product.publish.read`） | 产品分类边；受产品发布门禁约束 |
| 8 | GET | `/taxonomies` | `product.category.read` | 分类体系列表 |
| 9 | GET | `/taxonomies/{taxonomy_id}` | `product.category.read` | 分类体系详情 |
| 10 | GET | `/taxonomies/{taxonomy_id}/version` | `product.version.read` | 版本与 ETag；同步前置检查 |
| 11 | GET | `/taxonomies/{taxonomy_id}/categories` | `product.category.read` | `mode=flat|tree`；增量 `updated_since` + `cursor` |
| 12 | GET | `/categories/{category_id}` | `product.category.read` | 单节点 + 父/子引用；含 `DEPRECATED` 兼容语义 |
| 13 | GET | `/categories/{category_id}/children` | `product.category.read` | 直接子节点 |

### 6.2 V1_OPTIONAL（3 个操作）

| 方法 | 路径 | 必需 scope | 说明 |
|---|---|---|---|
| GET | `/taxonomies/{taxonomy_id}/changes` | `product.version.read` | 变更记录；若要求自动识别合并/拆分则升级为必需 |
| GET | `/categories/{category_id}/ancestors` | `product.category.read` | 祖先链；可由 `path_ids` 推导 |
| GET | `/categories/{category_id}/products` | `product.category.read` | 分类→产品；v1 可由本地反查 |

### 6.3 FUTURE（不在本候选稿中定义）

`GET /taxonomies/{taxonomy_id}/tree`（独立全量树快照）、任何 `POST/PUT/PATCH/DELETE` 写端点。

### 6.4 端点级特殊门禁

| 场景 | 结果 |
|---|---|
| 产品存在但未发布，无 `product.publish.read` | `403 40302 PRODUCT_NOT_RELEASED`（**不返回 404**） |
| 产品曾发布但已撤回 | `410 41001 PRODUCT_RELEASE_REVOKED`；`degraded_allowed=false` |
| 分类为 `DRAFT` / `REVIEWED` | `403 40303 CATEGORY_NOT_PUBLISHED` |
| 分类已停用但仍在保留期 | `200`，`status=DEPRECATED`，带 `merged_into` / `split_into` |
| 分类保留期结束 | `410 41002 CATEGORY_RETIRED`；`degraded_allowed=true` |
| 普通客户端传 `internal_only=true` 但缺 `product.publish.read` | `403 40301 INSUFFICIENT_SCOPE`；不得静默忽略 |
| 内部客户端缺 `product.category.read` | `403 40301 INSUFFICIENT_SCOPE`；必须双 scope |
| 内部读取未发布产品的分类边 | `200`，`data.internal_only=true`；仅当前有效 `APPROVED`/`PROPOSED` 边 |
| 条件请求命中 | `304`，无响应体，**不是错误** |

---

## 7. 响应包、错误码与传输规范

### 7.1 统一响应包

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRT",
  "meta": {}
}
```

失败时 `code` 为稳定整数，`data=null`，`meta` 至少含 `error_key`、`retryable`、`degraded_allowed`。

### 7.2 错误码全集（20 个错误 + 成功/304）

| HTTP | `code` | `error_key` | retryable | degraded_allowed |
|---|---|---|---|---|
| 200 | 0 | `OK` | — | — |
| 304 | 0 | `NOT_MODIFIED` | — | — |
| 400 | 40001 | `INVALID_ARGUMENT` | 否 | 否 |
| 400 | 40002 | `UNKNOWN_FILTER` | 否 | 否 |
| 401 | 40101 | `INVALID_TOKEN` | 刷新后一次 | 是 |
| 401 | 40102 | `TOKEN_EXPIRED` | 刷新后一次 | 是 |
| 403 | 40301 | `INSUFFICIENT_SCOPE` | 否 | 是 |
| 403 | 40302 | `PRODUCT_NOT_RELEASED` | 否 | 是 |
| 403 | 40303 | `CATEGORY_NOT_PUBLISHED` | 否 | 是 |
| 404 | 40401 | `PRODUCT_NOT_FOUND` | 否 | 视情况 |
| 404 | 40402 | `CATEGORY_NOT_FOUND` | 否 | 视情况 |
| 404 | 40403 | `TAXONOMY_NOT_FOUND` | 否 | 视情况 |
| 409 | 40901 | `VERSION_CONFLICT` | 是（重新拉取） | 是 |
| 410 | 41001 | `PRODUCT_RELEASE_REVOKED` | 否 | **否** |
| 410 | 41002 | `CATEGORY_RETIRED` | 否 | 是 |
| 413 | 41301 | `TREE_TOO_LARGE` | 否（改 flat） | 是 |
| 422 | 42201 | `PRODUCT_IDENTITY_INCOMPLETE` | 否 | 是 |
| 422 | 42202 | `MPN_NORMALIZATION_CONFLICT` | 否 | 是 |
| 429 | 42901 | `RATE_LIMITED` | 是 | 是 |
| 500 | 50001 | `INTERNAL_ERROR` | 是 | 是 |
| 503 | 50301 | `SERVICE_UNAVAILABLE` | 是 | 是 |
| 503 | 50302 | `DATA_NOT_READY` | 是 | 是 |

**OAuth2 错误不使用该表**：Token 端点按 RFC 6749 返回 `invalid_request` / `invalid_client` /
`invalid_scope`（400）/ `unsupported_grant_type`（400）。

**保留码**：`409 / 40901 VERSION_CONFLICT` 在当前 v1 全部只读操作中**不会触发**（无 `If-Match` 写语义），
随 `Idempotency-Key` 与写端点（§6.3 FUTURE、§7.8）一并预留；它是本表中唯一未被任何操作声明的状态。
除该保留项外，表中每个 `error_key` 都至少被一个操作响应的 `responses` 声明。

### 7.3 响应包形状仍为 `OPEN`

IQ-09 未裁定。本候选稿采用设计文档建议的现有包形状（选项 A），但：
- 不得表述为最终形状；
- 若决策人选择 `error` 对象或双写，错误码与重试语义不变，只替换外层；
- 冻结前必须由 Reviewer + Ds Bit 负责人书面确认。

### 7.4 请求追踪

- 客户端可发 `X-Request-Id`（8–64 字符，`A-Za-z0-9_-`）。
- 服务端回显；未提供则生成 `req_<ULID>`。
- 响应头与响应体 `request_id` 必须一致。
- 日志不得记录 Token 或 secret。

### 7.5 分页

- 游标分页；`limit` 默认 50、最大 200；`cursor` 不透明。
- `meta` 含 `limit`、`next_cursor`、`has_more`。
- `mode=tree` 最大深度 4、节点上限 5000；超限 `413 TREE_TOO_LARGE`。

### 7.6 排序与过滤

- `sort=field:asc|desc`；白名单：`updated_at`、`sort_order`、`level`、`category_code`。
- 未知过滤参数 → `400 UNKNOWN_FILTER`，不静默忽略。

### 7.7 版本标识

每个资源带 `updated_at`、`data_version`、`etag`；分类资源另带 `taxonomy_version`。
`updated_at` 不用于并发控制；并发控制用 `data_version` / ETag。

### 7.8 幂等性

v1 全部只读 GET，天然幂等。`Idempotency-Key` 仅为未来写接口保留，v1 不启用。

### 7.9 限流与弃用

- 每客户端 60 请求/分钟、突发 20；分类树 10/分钟；搜索 30/分钟。
- 超限 `429 RATE_LIMITED` + `Retry-After`。
- 弃用：文档标注 → `Deprecation: true` + `Sunset` → 至少 90 天 → 下线。
- v1 内只做加法；破坏性变更升 `/api/v2`，v1 至少保留 180 天。
- 数值均为 `PROPOSED`，受 IQ-12 影响。

---

## 8. OAuth2

| 项 | 候选值 | 状态 |
|---|---|---|
| 模式 | Client Credentials | `PROPOSED` |
| Token 形态 | opaque Token（256 位随机，Base64URL） | `PROPOSED` |
| 客户端认证 | `client_secret_basic`（首选） | `PROPOSED` |
| `expires_in` | 900 秒 | `PROPOSED` |
| 提前刷新 | 剩余 TTL ≤ 120 秒 | `PROPOSED` |
| 时钟偏差 | 60 秒 | `PROPOSED` |
| refresh token | 不签发 | `PROPOSED` |
| 撤销传播 | 撤销后第 60 秒起（含）全体 Resource Server 必须拒绝 | `PROPOSED` |
| 撤销端点 | RFC 7009 `/oauth/revoke` 或管理端禁用 | `PROPOSED` |

Scopes：

| Scope | 覆盖端点 |
|---|---|
| `product.read` | `/products/search`、`/products/{pbk}` |
| `product.category.read` | `/taxonomies/*`、`/categories/*`、`/products/{pbk}/categories` |
| `product.evidence.read` | `/products/{pbk}/evidence` |
| `product.version.read` | `/products/{pbk}/versions`、`/taxonomies/{id}/version`、`/changes` |
| `product.publish.read` | `/products/{pbk}/status`、`include_unreleased=true`、`internal_only=true` |

规则：
1. 缺 scope → `403 INSUFFICIENT_SCOPE`，不回退、不静默降级。
2. `internal_only=true` 必须同时具备 `product.category.read` 与 `product.publish.read`。
3. Morrishk 站点同步的最小授权为前四个 scope；`product.publish.read` 仅给内部审核/运维客户端。
4. 生产客户端注册、secret 存储与轮换责任人为 `OPEN`（IQ-11）；非生产凭证是否允许为 `OPEN`（IQ-21）。

---

## 9. 发布、撤回与 `visible_state`

### 9.1 三层闸门（`PROPOSED`，未实现）

| 闸门 | 状态值 | 依赖 |
|---|---|---|
| Pipeline | `PENDING` / `PASS` / `FAILED` | — |
| Content | `PENDING` / `APPROVED` / `REJECTED` | Pipeline 通过 |
| Release | `PENDING` / `APPROVED` / `REVOKED` | Content 通过 |

顺序固定，上游未通过时下游不得标记为已批准。

### 9.2 `visible_state` 派生（`PROPOSED`，枚举待协调）

```text
if release == APPROVED: visible_state = RELEASED
elif release == REVOKED: visible_state = WITHDRAWN
elif content == APPROVED: visible_state = IN_REVIEW
else: visible_state = DRAFT
```

### 9.3 三个命名空间不得混用

| 名称 | 取值 | 用途 | 注意 |
|---|---|---|---|
| 闸门状态 | `PENDING/PASS/FAILED`、`PENDING/APPROVED/REJECTED`、`PENDING/APPROVED/REVOKED` | `/status.gates.*.state` | 与下面两者不同 |
| `release_state` 查询参数 | `RELEASED/REVOKED/PENDING` | `/products/search` 过滤 | 不是 `visible_state` |
| `visible_state` | `DRAFT/IN_REVIEW/RELEASED/WITHDRAWN` | 派生展示态 | 与查询参数枚举**不一致** |

该不一致列为冻结阻断 B6，必须在冻结前由设计文档维护人书面统一；
执行 Agent **不**自行改名、不自行合并枚举。

### 9.4 消费方行为（Morrishk）

| 响应 | 必须行为 |
|---|---|
| `200` + `RELEASED` | 可展示；按 `data_version`/ETag 更新本地缓存 |
| `403 PRODUCT_NOT_RELEASED` | 不重试；保留本地已发布版本，等待 |
| `404 PRODUCT_NOT_FOUND` | 不重试；标记资源不存在 |
| `410 PRODUCT_RELEASE_REVOKED` | 立即停止公开展示；**不得**继续读产品缓存或技术数据 |
| `410 CATEGORY_RETIRED` | 停止该分类新同步；保留旧分类页与历史映射；不得新建归属 |
| `403 CATEGORY_NOT_PUBLISHED` | 不使用该分类；本地映射保留 |
| `304` | 视为成功，不更新响应体 |

撤回传播依赖 Morrishk 主动增量轮询；`410` 必须被识别为终止态，不能被通用重试逻辑吞掉。
`release_state=REVOKED` 流为 `V1_REQUIRED`，否则撤回无法被发现。

---

## 10. Mock、契约候选与生产的差异

| 维度 | Phase 1 Mock（`15_`） | 本契约候选 | 生产目标 |
|---|---|---|---|
| 数据来源 | `DEMO_FIXTURE` 静态 JSON + 浏览器内存 | 无数据 | Ds Bit 审核/发布后的真实数据 |
| 身份规则 | `MPN-NORM-v1` 的 JS 实现（Mock 用） | 同一候选规则，`PROPOSED` | 服务端统一实现，冻结后不得偏离 |
| `visible_state` | 使用 `RELEASED` / `PENDING` / `REVOKED`（Mock 简化，混用了 `release_state`） | `DRAFT` / `IN_REVIEW` / `RELEASED` / `WITHDRAWN` | 契约枚举（待 B6 协调后） |
| 错误包 | `{code,message,data,request_id,meta}` | 同左，形状 `OPEN`（IQ-09） | 同左 |
| 分页 | 简单 `limit`/`cursor`/`meta` | 同左，含 `next_cursor`/`has_more` | 同左 |
| OAuth | Mock 不校验凭据 | Client Credentials 候选 | 真实 opaque Token |
| 持久化 | 无 | 无 | 新平台 `pd_*`（引擎/字符集 `OPEN`，IQ-15） |
| 字典内容 | Fixture 演示字段 | 仅结构，内容待 PM 种子 | PM 种子 + Ds Bit 管理 |
| 传输 | `file://` 或本地静态服务 | HTTPS（stub 除外） | HTTPS |
| 可用性 | 仅本地演示 | 可执行契约测试（本地） | 未部署 |

**Mock 的 `PENDING` / `REVOKED` 标签不是契约枚举**，不得据此修改契约，也不得据此声称契约已对齐。
Mock 仅证明交互与错误路径方向，不证明生产契约成立。

---

## 11. 冻结阻断项

冻结（Contract Freeze）至少需要全部满足；以下任一项未关闭，契约状态必须保持 `CANDIDATE_NOT_FROZEN`。

### 11.1 Phase 0 未决（阻断冻结）

| 编号 | 问题 | 当前状态 | 影响 |
|---|---|---|---|
| B1 / IQ-05 | 分类保留期与 `410 CATEGORY_RETIRED` 时机 | `OPEN` | `/categories/{id}` 兼容窗口、消费方行为 |
| B2 / IQ-09 | 错误响应包最终形状 | `OPEN` | 全部端点 |
| B3 / IQ-15 | 新表引擎与字符集 | `OPEN` | 持久化与性能；不改变线形 |
| B4 / IQ-21 | 是否允许非生产 OAuth2 凭证 | `OPEN` | 本地/预发联调与安全审计 |

### 11.2 设计内部阻断

| 编号 | 问题 | 当前状态 |
|---|---|---|
| B5 | `MpnNormalizer` 规则集与 `product_business_key` 编码 | `PROPOSED`，未评审冻结 |
| B6 | `visible_state` / `release_state` / 闸门状态枚举命名不一致 | `OPEN`（本文件 §9.3） |
| B7 | 技术参数字典正式种子与命名标准 | 待 PM 提交（IQ-02 裁定后开放） |
| B8 | 证据公开范围与截图可获取性 | `OPEN`（IQ-08） |

### 11.3 Phase 1 实现前参数（不改变线形，但不得默认已批准）

| 编号 | 问题 | 当前状态 |
|---|---|---|
| IQ-03 | `category_id` / `category_code` 治理与生成 | `PROPOSED` |
| IQ-04 | 同一产品是否允许跨体系多个主分类 | `PARTIALLY_CONFIRMED` |
| IQ-06 | 发布状态存储位置 | `NOT_FOUND` |
| IQ-12 | Token TTL 与限流配额 | `PROPOSED` |
| IQ-20 | 是否开放 MPN 模糊查找 | `PARTIALLY_CONFIRMED` |

### 11.4 Phase 2 / 4（不阻断契约冻结，但阻断生产）

IQ-07（审核角色）、IQ-10（域名与拓扑）、IQ-11（客户端注册与轮换责任人）、
IQ-14（调度位置）、IQ-17（JSON-LD）、IQ-18（URL/301）、IQ-19（日志保留）、
IQ-22（网络路径）。

---

## 12. 审批状态矩阵

| 事项 | 状态 | 证据 |
|---|---|---|
| IQ-01 / IQ-02 / IQ-13 书面裁定 | `DECIDED` | `DECISION_REGISTER.md` §2.1–2.3 |
| 三项裁定签署 | **待签署** | 登记表「签署」列 |
| 三项裁定独立 Reviewer 验收 | **未完成** | 登记表 §6 |
| Phase 1 Mock `0474b19` 的 B1–B3 | Reviewer PASS（仅提交边界） | Reviewer 结论 |
| Phase 1 Mock 整体验收 | **PENDING** | 待 `15_/ACCEPTANCE_PACKAGE.md` 独立复核 |
| 本契约候选 | `CANDIDATE_NOT_FROZEN` | 本文件与 OpenAPI `x-contract-status` |
| 契约冻结 | **NO** | §11 阻断未关闭 |
| 生产 Business API | **NOT APPROVED** | 本轮授权边界 |
| 生产 OAuth2 凭证 | **NOT APPROVED** | 本轮授权边界 |
| 生产数据库迁移/写入 | **NOT APPROVED** | 本轮授权边界 |
| 真实同步/发布/撤回 | **NOT APPROVED** | 本轮授权边界 |
| 修改 `13_` | 未发生 | `git diff -- 13_...` 为空 |

---

## 13. 校验方法

```bash
cd 12_dsbit_business_api_integration_design

# JSON 语法与端点计数（应输出 requiredOps 13 / paths 16）
node -e "
const j=JSON.parse(require('fs').readFileSync('contract/openapi.candidate.v1.json','utf8'));
const paths=Object.keys(j.paths);
let ops=0, req=0;
for (const p of paths) for (const m of Object.keys(j.paths[p])) {
  ops++; if ((j.paths[p][m]['x-endpoint-status']||'V1_REQUIRED')==='V1_REQUIRED') req++;
}
console.log('status', j['x-contract-status']);
console.log('paths', paths.length, 'ops', ops, 'requiredOps', req);
"

# 文件哈希
sha256sum contract/openapi.candidate.v1.json

# 目录校验
sha256sum -c SHA256SUMS.txt
```

预期：
- `status` = `CANDIDATE_NOT_FROZEN`
- `paths` = 16，`ops` = 16，`requiredOps` = 13
- OpenAPI 文件 SHA-256 = `fdeec48ecf44439776e61245ca7b98fc94f7ce0d481a7c9aea639900f1e71023`

契约一致性测试见 `15_phase1_mock_ui/tests/contract-candidate.test.js`。

---

## 14. 变更控制

1. 本文件与 OpenAPI 的任何改动都必须在提交信息中注明 `contract-candidate`，并记录新 SHA-256。
2. 冻结前允许调整；冻结后任何不兼容变更必须升 `/api/v2` 或重新裁定。
3. 不得在未登记书面裁定的情况下，把 §11 任一阻断项从 `OPEN` 改为已关闭。
4. 不得把本文件描述为「契约已冻结」「生产 API 已就绪」「Mock 已验证真实数据」。
5. 本文件不替代 `14_` 的裁定登记；裁定以 `DECISION_REGISTER.md` 的书面记录与签署为准。