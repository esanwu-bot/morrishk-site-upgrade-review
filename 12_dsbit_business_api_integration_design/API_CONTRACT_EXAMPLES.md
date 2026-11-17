# API Contract Examples — Ds Bit ↔ Morrishk Business API v1

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-INT-001-EX |
| 版本 | v1.2.1（R5 60 秒边界修订；未冻结；全部为构造样例） |
| 日期 | 2026-11-17 |
| 关联文档 | `Ds Bit ↔ Morrishk Business API Integration Design v1.md`（主文档） |
| 状态 | 全部 `PROPOSED` / 构造示例 |

> **这些示例全部是设计的构造样例，不是真实响应。**
>
> - 未调用任何 Ds Bit 服务，未访问 `dsb.0668xgwl.com`，未连接任何数据库。
> - 示例中的 `product_id`、`category_id`、型号、参数值、SHA-256、bbox 均为**手工构造**，
>   不代表任何真实器件的解析结果，也不得作为数据正确性的证据。
> - `client_secret`、`access_token` 一律以 `***` / `<REDACTED>` 表示；本文档不含任何真实凭据。
> - Base URL 使用占位域名 `https://dsbit.example.com/api/v1`；实际域名见主文档 §5.1（`OPEN` IQ-10）。
> - 示例 ID 采用 **`<type>_<ULID>`**：前缀（`prd_` / `cat_` / `tax_` / `ev_` / `rel_` 等）
>   加下划线，再接 26 字符 Crockford Base32 ULID（统一大写）；总长度不超过 32。
>   前缀不参与唯一性判断；示例中的后缀均为合法 ULID（主文档 §5.3）。

---

## 0. 示例索引

| 编号 | 场景 | 对应主文档章节 |
|---|---|---|
| EX-01 | Token 成功 | §4.5 |
| EX-02 | Token 失败 | §4.5 |
| EX-03 | 分类体系列表 | §7.4 / §7.5.1 |
| EX-04 | 分类体系详情（含 ETag） | §7.4 |
| EX-05 | 分类树（`mode=tree`） | §5.5 / §7.5.2 |
| EX-06 | 单分类 + 父子引用 | §7.5.3 |
| EX-07 | 产品分类归属（边） | §7.5.4 |
| EX-07b | 产品分类归属：未发布产品 403 | §4.4 / §7.4 |
| EX-07c | 产品分类归属：内部读取（双 scope + `internal_only`） | §4.4 / §8.3 |
| EX-08 | 分类版本 | §7.5.5 / §7.6 |
| EX-09 | 分类变更 | §7.3 / §7.5.5 |
| EX-10 | 分类停用 / 合并 / 410 | §7.5.6 |
| EX-11 | 已发布产品详情 | §6.3 |
| EX-12 | 未发布产品 403 | §5.8 / §8.3 |
| EX-13 | 撤回产品 410 | §5.8 / §8.3 |
| EX-14 | 产品状态（三层门禁） | §6.5 |
| EX-15 | 产品版本列表 | §6.6 |
| EX-16 | 产品证据 | §6.7 |
| EX-17 | 产品搜索 / 增量同步 | §6.4 |
| EX-18 | 通用错误（400 / 404 / 500） | §5.7 / §5.8 |
| EX-19 | 304 Not Modified | §5.14 / §7.6 |
| EX-20 | 429 限流 | §5.11 |
| EX-21 | Morrishk 映射表行 | §7.8.1 |
| EX-22 | 同步状态行 | §9.4.1 |

**两种错误形状必须先分清：**

| 端点类型 | 错误形状 | 依据 |
|---|---|---|
| `POST /oauth/token` | RFC 6749 §5.2 的 `{"error": "...", "error_description": "..."}` | OAuth2 标准端点 |
| 全部 `/api/v1/*` 业务端点 | 项目统一包 `{"code","message","data","request_id","meta"}` | 主文档 §5.7 |

OAuth2 端点**不套用**业务响应包，避免破坏标准客户端库兼容性；但仍回显 `request_id` 便于追踪。

---

## EX-01 Token 成功

**请求**

```http
POST /oauth/token HTTP/1.1
Host: dsbit.example.com
Authorization: Basic <BASE64(client_id:client_secret)>
Content-Type: application/x-www-form-urlencoded
Accept: application/json
X-Request-Id: req_01J8Z9K2V3ABCDEFGHJKMNPQRT

grant_type=client_credentials
&scope=product.read%20product.category.read%20product.evidence.read%20product.version.read
```

**响应 `200 OK`**

```http
Content-Type: application/json; charset=utf-8
Cache-Control: no-store
Pragma: no-cache
X-Request-Id: req_01J8Z9K2V3ABCDEFGHJKMNPQRT
```

```json
{
  "access_token": "<REDACTED_ACCESS_TOKEN>",
  "token_type": "Bearer",
  "expires_in": 900,
  "scope": "product.read product.category.read product.evidence.read product.version.read"
}
```

说明：

- 不签发 `refresh_token`（Client Credentials 直接重新获取）。
- 响应必须 `Cache-Control: no-store`，避免中间层缓存 Token。
- `scope` 为服务端实际授予值，可能小于请求值；客户端必须以返回值为准。
- 本示例使用 `client_secret_basic`；staging 与生产示例**不得**把 `client_secret` 放入表单体。
- Basic 凭据按 RFC 6749 §2.3.1 构造：`client_id` 与 `client_secret` 先分别做
  `application/x-www-form-urlencoded` 编码，再用 `:` 拼接并 Base64；不得直接拼接原始字符串。
- `client_secret_post`（表单体传凭据）只允许出现在 stub 模式或受控内网的**例外示例**中，
  且必须显式标注；同一次请求不得同时使用两种认证方式。

---

## EX-02 Token 失败

### EX-02a 客户端凭据无效

**请求** 同 EX-01（`client_secret_basic`），Basic 头部中的 `client_secret` 错误：

```http
Authorization: Basic <BASE64(client_id:WRONG_SECRET)>
```

不允许改为在表单体提交凭据来规避 Basic 校验。

**响应 `401 Unauthorized`**

```json
{
  "error": "invalid_client",
  "error_description": "Client authentication failed",
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRV"
}
```

### EX-02b 请求的 scope 超出授权

**响应 `400 Bad Request`**

```json
{
  "error": "invalid_scope",
  "error_description": "Requested scope exceeds client registration",
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRW"
}
```

### EX-02c 参数缺失

**响应 `400 Bad Request`**

```json
{
  "error": "invalid_request",
  "error_description": "grant_type is required",
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRX"
}
```

说明：`error` 取值遵循 RFC 6749 §5.2（`invalid_request` / `invalid_client` / `invalid_grant` / `invalid_scope` / `unauthorized_client` / `unsupported_grant_type`）。`request_id` 为扩展字段，不改变标准字段语义。

---

## EX-03 分类体系列表

**请求**

```http
GET /api/v1/taxonomies?status=PUBLISHED&limit=50 HTTP/1.1
Host: dsbit.example.com
Authorization: Bearer <REDACTED_ACCESS_TOKEN>
Accept: application/json
X-Request-Id: req_01J8Z9K2V3ABCDEFGHJKMNPQRY
```

**响应 `200 OK`**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      {
        "taxonomy_id": "tax_01J8Z9K2V3ABCDEFGHJKMNPQRS",
        "taxonomy_code": "electronic-components",
        "name": "Electronic Components",
        "description": "Technical taxonomy for semiconductor and passive components",
        "taxonomy_version": 42,
        "status": "PUBLISHED",
        "root_category_ids": [
          "cat_01J8A000000000000000000000",
          "cat_01J8B000000000000000000000"
        ],
        "created_at": "2026-10-01T00:00:00Z",
        "updated_at": "2026-11-15T06:00:00Z",
        "published_at": "2026-10-02T00:00:00Z"
      }
    ]
  },
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRY",
  "meta": {
    "limit": 50,
    "next_cursor": null,
    "has_more": false
  }
}
```

说明：`status` 过滤为可选；未带 `product.publish.read` 的客户端只能看到 `PUBLISHED` 体系，请求 `DRAFT` 时返回空列表而非报错。

---

## EX-04 分类体系详情（含 ETag）

**请求**

```http
GET /api/v1/taxonomies/tax_01J8Z9K2V3ABCDEFGHJKMNPQRS HTTP/1.1
Host: dsbit.example.com
Authorization: Bearer <REDACTED_ACCESS_TOKEN>
If-None-Match: "sha256:9f2c0b7d..."
```

**响应 `200 OK`**

```http
ETag: "sha256:9f2c0b7d..."
Last-Modified: Sat, 15 Nov 2026 06:00:00 GMT
X-Request-Id: req_01J8Z9K2V3ABCDEFGHJKMNPQRZ
X-Data-Version: 42
X-Taxonomy-Version: 42
Cache-Control: private, max-age=0, must-revalidate
```

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "taxonomy_id": "tax_01J8Z9K2V3ABCDEFGHJKMNPQRS",
    "taxonomy_code": "electronic-components",
    "name": "Electronic Components",
    "description": "Technical taxonomy for semiconductor and passive components",
    "taxonomy_version": 42,
    "status": "PUBLISHED",
    "root_category_ids": [
      "cat_01J8A000000000000000000000",
      "cat_01J8B000000000000000000000"
    ],
    "created_at": "2026-10-01T00:00:00Z",
    "updated_at": "2026-11-15T06:00:00Z",
    "published_at": "2026-10-02T00:00:00Z"
  },
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRZ",
  "meta": {}
}
```

说明：`ETag` 为强 ETag，按规范化 JSON 的 SHA-256 生成；`If-None-Match` 命中时返回 EX-19 的 304。

---

## EX-05 分类树（`mode=tree`）

**请求**

```http
GET /api/v1/taxonomies/tax_01J8Z9K2V3ABCDEFGHJKMNPQRS/categories?mode=tree&depth=2&max_nodes=5000 HTTP/1.1
Host: dsbit.example.com
Authorization: Bearer <REDACTED_ACCESS_TOKEN>
```

**响应 `200 OK`**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "taxonomy_id": "tax_01J8Z9K2V3ABCDEFGHJKMNPQRS",
    "taxonomy_version": 42,
    "mode": "tree",
    "nodes": [
      {
        "category_id": "cat_01J8A000000000000000000000",
        "category_code": "integrated-circuits",
        "name": "Integrated Circuits",
        "slug": "integrated-circuits",
        "level": 1,
        "path_ids": ["cat_01J8A000000000000000000000"],
        "path_codes": ["integrated-circuits"],
        "is_active": true,
        "sort_order": 10,
        "status": "PUBLISHED",
        "data_version": 5,
        "children": [
          {
            "category_id": "cat_01J8C000000000000000000000",
            "category_code": "amplifiers",
            "name": "Amplifiers",
            "slug": "amplifiers",
            "level": 2,
            "path_ids": [
              "cat_01J8A000000000000000000000",
              "cat_01J8C000000000000000000000"
            ],
            "path_codes": ["integrated-circuits", "amplifiers"],
            "is_active": true,
            "sort_order": 20,
            "status": "PUBLISHED",
            "data_version": 3,
            "children": []
          }
        ]
      }
    ]
  },
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQR0",
  "meta": {
    "mode": "tree",
    "depth": 2,
    "node_count": 2,
    "truncated": false
  }
}
```

**超出上限 `413`**

```json
{
  "code": 41301,
  "message": "Tree exceeds limits; use mode=flat with cursor",
  "data": null,
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQR1",
  "meta": {
    "error_key": "TREE_TOO_LARGE",
    "retryable": false,
    "degraded_allowed": true,
    "limits": {"max_depth": 4, "max_nodes": 5000}
  }
}
```

说明：`tree` 默认最大深度 4、节点上限 5000；超限不回退、不截断（`truncated` 恒为 `false` 或返回 413），必须改用 `mode=flat` + 游标分页。

---

## EX-06 单分类 + 父子引用

**请求**

```http
GET /api/v1/categories/cat_01J8C000000000000000000000 HTTP/1.1
Host: dsbit.example.com
Authorization: Bearer <REDACTED_ACCESS_TOKEN>
```

**响应 `200 OK`**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "category_id": "cat_01J8C000000000000000000000",
    "taxonomy_id": "tax_01J8Z9K2V3ABCDEFGHJKMNPQRS",
    "parent_id": "cat_01J8A000000000000000000000",
    "category_code": "amplifiers",
    "name": "Amplifiers",
    "slug": "amplifiers",
    "description": "Signal amplification devices",
    "level": 2,
    "path_ids": [
      "cat_01J8A000000000000000000000",
      "cat_01J8C000000000000000000000"
    ],
    "path_codes": ["integrated-circuits", "amplifiers"],
    "is_active": true,
    "sort_order": 20,
    "aliases": [
      {"lang": "en", "value": "Op Amps"},
      {"lang": "zh", "value": "放大器"}
    ],
    "external_codes": [
      {"scheme": "morrishk_legacy", "code": "101"},
      {"scheme": "morrishk_legacy", "code": "102"}
    ],
    "status": "PUBLISHED",
    "merged_into": null,
    "split_into": [],
    "created_at": "2026-10-05T00:00:00Z",
    "updated_at": "2026-11-10T08:00:00Z",
    "published_at": "2026-10-06T00:00:00Z",
    "data_version": 3,
    "parent": {
      "category_id": "cat_01J8A000000000000000000000",
      "category_code": "integrated-circuits",
      "name": "Integrated Circuits",
      "level": 1
    },
    "children": [
      {
        "category_id": "cat_01J8D000000000000000000000",
        "category_code": "general-purpose-op-amps",
        "name": "General Purpose Op Amps",
        "level": 3
      }
    ]
  },
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQR2",
  "meta": {
    "children_truncated": false,
    "children_max_inline": 200
  }
}
```

说明：`parent` / `children` 为**精简引用**；`children` 内联最多 200 个，超出请调用 `/categories/{id}/children` 分页。`external_codes` 可携带多个 Morrishk 旧分类编码，但**不得**据此自动建立映射（主文档 §7.8.3）。

---

## EX-07 产品分类归属（边）

**请求**

```http
GET /api/v1/products/prd_01J8Z9K2V4ABCDEFGHJKMNPQRS/categories HTTP/1.1
Host: dsbit.example.com
Authorization: Bearer <REDACTED_ACCESS_TOKEN>
```

**响应 `200 OK`**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "product_id": "prd_01J8Z9K2V4ABCDEFGHJKMNPQRS",
    "taxonomy_id": "tax_01J8Z9K2V3ABCDEFGHJKMNPQRS",
    "taxonomy_version": 42,
    "categories": [
      {
        "category_id": "cat_01J8D000000000000000000000",
        "category_code": "general-purpose-op-amps",
        "role": "PRIMARY",
        "assignment_source": "MANUAL",
        "confidence": null,
        "status": "APPROVED",
        "assigned_at": "2026-11-10T08:00:00Z"
      },
      {
        "category_id": "cat_01J8E000000000000000000000",
        "category_code": "low-power-op-amps",
        "role": "SECONDARY",
        "assignment_source": "PARSER",
        "confidence": 78.5,
        "status": "APPROVED",
        "assigned_at": "2026-11-09T02:00:00Z"
      }
    ]
  },
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQR3",
  "meta": {}
}
```

说明：

- 只返回 `status=APPROVED` 且 `valid_to IS NULL` 的边。
- 同一 `taxonomy_id` 下最多一个 `PRIMARY`（`OPEN` IQ-04）。
- 这里的 `category_id` 是 **Ds Bit 分类 ID**，绝不能直接写入 `snsii_product.BigCat/SmallCat`。
- **授权门禁（回应 R4）**：调用者需要 `product.category.read`，且产品必须为 `RELEASE_APPROVED`；
  该端点不得绕过产品详情门禁。未发布产品在无 `product.publish.read` 时返回 403（见 EX-07b）。

---

## EX-07b 产品分类归属：未发布产品被拒（构造样例）

**请求**

```http
GET /api/v1/products/prd_01J8Z9K2V4ABCDEFGHJKMNPQRT/categories HTTP/1.1
Host: dsbit.example.com
Authorization: Bearer <REDACTED_ACCESS_TOKEN>
```

**响应 `403 Forbidden`**

```json
{
  "code": 40302,
  "message": "product is not released for external access",
  "data": null,
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQR4",
  "meta": {
    "error_key": "PRODUCT_NOT_RELEASED",
    "retryable": false,
    "degraded_allowed": true
  }
}
```

说明：仅持 `product.category.read` 时无法读取未发布产品的分类边；内部客户端需同时具备
`product.publish.read` 并显式传 `internal_only=true`（主文档 §4.4 规则 4）。

---

## EX-07c 产品分类归属：内部读取未发布产品（构造样例）

**请求**

```http
GET /api/v1/products/prd_01J8Z9K2V4ABCDEFGHJKMNPQRT/categories?internal_only=true HTTP/1.1
Host: dsbit.example.com
Authorization: Bearer <REDACTED_ACCESS_TOKEN>
```

前置条件：Token 同时具备 `product.category.read` 与 `product.publish.read`；产品状态为 `PIPELINE_PASS`。
缺少任一 scope 时返回 `403 INSUFFICIENT_SCOPE`，不得静默忽略 `internal_only` 参数。

**响应 `200 OK`**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "product_id": "prd_01J8Z9K2V4ABCDEFGHJKMNPQRT",
    "taxonomy_id": "tax_01J8Z9K2V3ABCDEFGHJKMNPQRS",
    "taxonomy_version": 42,
    "internal_only": true,
    "visible_state": "PIPELINE_PASS",
    "categories": [
      {
        "edge_id": "edg_01J8Z000000000000000000000",
        "category_id": "cat_01J8C000000000000000000000",
        "category_code": "low-power-op-amps",
        "role": "PRIMARY",
        "assignment_source": "PARSER",
        "confidence": 81.2,
        "status": "APPROVED",
        "valid_from": "2026-11-12T04:00:00Z",
        "data_version": 7
      },
      {
        "edge_id": "edg_01J8Z000000000000000000001",
        "category_id": "cat_01J8D000000000000000000000",
        "category_code": "rail-to-rail-op-amps",
        "role": "SECONDARY",
        "assignment_source": "PARSER",
        "confidence": 64.0,
        "status": "PROPOSED",
        "valid_from": "2026-11-12T04:00:00Z",
        "data_version": 7
      }
    ]
  },
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRX",
  "meta": {}
}
```

说明：

- `internal_only=true` 回显在 `data` 中，消费方不得把它当作公开数据。
- 内部读取只返回当前有效（`valid_to IS NULL`）的 `APPROVED` / `PROPOSED` 边；
  `REJECTED` 边与任何 `valid_to` 非空的历史边均不得返回。
- `REVOKED` 产品即使具备双 scope 也不可读取业务数据。
- 此示例中的 `edg_` ID 仅用于展示，不得与 `cat_` / `tax_` 等 ID 混用。

---

## EX-08 分类版本

**请求**

```http
GET /api/v1/taxonomies/tax_01J8Z9K2V3ABCDEFGHJKMNPQRS/version HTTP/1.1
Host: dsbit.example.com
Authorization: Bearer <REDACTED_ACCESS_TOKEN>
```

**响应 `200 OK`**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "taxonomy_id": "tax_01J8Z9K2V3ABCDEFGHJKMNPQRS",
    "taxonomy_version": 42,
    "status": "PUBLISHED",
    "published_at": "2026-11-15T06:00:00Z",
    "etag": "\"sha256:9f2c0b7d...\"",
    "last_change_id": "chg_01J8F000000000000000000000"
  },
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQR4",
  "meta": {}
}
```

说明：同步任务先取版本，与本地记录比较；相同则跳过整树拉取。

---

## EX-09 分类变更

**请求**

```http
GET /api/v1/taxonomies/tax_01J8Z9K2V3ABCDEFGHJKMNPQRS/changes?since_version=40&limit=50 HTTP/1.1
Host: dsbit.example.com
Authorization: Bearer <REDACTED_ACCESS_TOKEN>
```

**响应 `200 OK`**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "taxonomy_id": "tax_01J8Z9K2V3ABCDEFGHJKMNPQRS",
    "since_version": 40,
    "taxonomy_version": 42,
    "changes": [
      {
        "change_id": "chg_01J8F000000000000000000000",
        "taxonomy_version": 41,
        "event": "CATEGORY_MERGED",
        "occurred_at": "2026-11-14T02:00:00Z",
        "category_id": "cat_01J8X000000000000000000000",
        "payload": {
          "merged_into": "cat_01J8Y000000000000000000000",
          "reason": "duplicate definition"
        }
      },
      {
        "change_id": "chg_01J8W000000000000000000000",
        "taxonomy_version": 42,
        "event": "CATEGORY_RENAMED",
        "occurred_at": "2026-11-15T06:00:00Z",
        "category_id": "cat_01J8C000000000000000000000",
        "payload": {
          "old_name": "Amplifier",
          "new_name": "Amplifiers"
        }
      }
    ]
  },
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQR5",
  "meta": {
    "limit": 50,
    "next_cursor": null,
    "has_more": false
  }
}
```

说明：`CATEGORY_MERGED` / `CATEGORY_SPLIT` / `CATEGORY_DEPRECATED` 会影响 Morrishk 映射，必须人工处理（`dsbit_category_mapping.mapping_status → STALE`），**不得自动改 URL 或自动 301**。

---

## EX-10 分类停用 / 合并 / 410

### EX-10a 保留期内（`200`）

**请求**

```http
GET /api/v1/categories/cat_01J8X000000000000000000000 HTTP/1.1
Host: dsbit.example.com
Authorization: Bearer <REDACTED_ACCESS_TOKEN>
```

**响应 `200 OK`**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "category_id": "cat_01J8X000000000000000000000",
    "taxonomy_id": "tax_01J8Z9K2V3ABCDEFGHJKMNPQRS",
    "parent_id": "cat_01J8A000000000000000000000",
    "category_code": "op-amps-legacy",
    "name": "Op Amps (Legacy)",
    "level": 2,
    "path_ids": [
      "cat_01J8A000000000000000000000",
      "cat_01J8X000000000000000000000"
    ],
    "path_codes": ["integrated-circuits", "op-amps-legacy"],
    "is_active": false,
    "status": "DEPRECATED",
    "merged_into": "cat_01J8Y000000000000000000000",
    "split_into": [],
    "deprecated_at": "2026-11-14T02:00:00Z",
    "updated_at": "2026-11-14T02:00:00Z",
    "data_version": 9
  },
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQR6",
  "meta": {}
}
```

### EX-10b 保留期后（`410`）

```json
{
  "code": 41002,
  "message": "Category retired",
  "data": {
    "category_id": "cat_01J8X000000000000000000000",
    "retired_at": "2027-05-13T00:00:00Z",
    "merged_into": "cat_01J8Y000000000000000000000"
  },
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQR7",
  "meta": {
    "error_key": "CATEGORY_RETIRED",
    "retryable": false,
    "degraded_allowed": true
  }
}
```

说明：

- API **不返回 301/302**；URL 由 Morrishk 自己控制。
- `410` 时 `degraded_allowed=true` 表示 Morrishk **可以保留旧分类页**，但不得新建关联。
- 保留期建议 180 天（`OPEN` IQ-05）。

---

## EX-11 已发布产品详情

> 参数、型号、SHA-256、bbox 均为构造示例，非真实解析结果。

**请求**

```http
GET /api/v1/products/prd_01J8Z9K2V4ABCDEFGHJKMNPQRS HTTP/1.1
Host: dsbit.example.com
Authorization: Bearer <REDACTED_ACCESS_TOKEN>
Accept: application/json
```

**响应 `200 OK`**

```http
ETag: "sha256:7a1d3e9b..."
X-Data-Version: 7
X-Request-Id: req_01J8Z9K2V3ABCDEFGHJKMNPQR8
```

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "product_id": "prd_01J8Z9K2V4ABCDEFGHJKMNPQRS",
    "identity": {
      "mpn": "LM358DR",
      "mpn_norm": "LM358DR",
      "manufacturer": "Example Semiconductor",
      "package": "SOIC-8",
      "identity_scope": "DEVICE",
      "product_type": "IC"
    },
    "technical": {
      "parameter_set_version": 7,
      "parameters": [
        {
          "parameter_id": "par_01J8H000000000000000000000",
          "name": "Supply Voltage",
          "category": "ELECTRICAL",
          "value": null,
          "min": "3",
          "typ": null,
          "max": "32",
          "unit": "V",
          "conditions": "TA = 25 C",
          "verification_status": "VERIFIED",
          "evidence_ids": ["ev_01J8J000000000000000000000"]
        },
        {
          "parameter_id": "par_01J8K000000000000000000000",
          "name": "Input Offset Voltage",
          "category": "ELECTRICAL",
          "value": null,
          "min": null,
          "typ": "2",
          "max": "7",
          "unit": "mV",
          "conditions": "VCC = 5 V, TA = 25 C",
          "verification_status": "AUDITED",
          "evidence_ids": ["ev_01J8M000000000000000000000"]
        }
      ],
      "normalization": {
        "unit_system": "SI",
        "normalized_at": "2026-11-10T08:00:00Z"
      }
    },
    "categories": {
      "taxonomy_id": "tax_01J8Z9K2V3ABCDEFGHJKMNPQRS",
      "refs": [
        {
          "category_id": "cat_01J8D000000000000000000000",
          "role": "PRIMARY",
          "assigned_at": "2026-11-10T08:00:00Z"
        }
      ],
      "note": "完整分类节点请调用 /categories/{category_id}；产品响应只给引用。"
    },
    "documents": [
      {
        "document_id": "doc_01J8N000000000000000000000",
        "document_sha256": "059d448c5a34a4b1e0f1c2d3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a21",
        "document_type": "datasheet",
        "page_count": 24
      }
    ],
    "release": {
      "content_version": 7,
      "release_id": "rel_01J8P000000000000000000000",
      "release_version": 3,
      "released_at": "2026-11-12T10:00:00Z"
    },
    "updated_at": "2026-11-12T10:00:00Z",
    "data_version": 7
  },
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQR8",
  "meta": {}
}
```

说明：

- 只包含通过正式容器的参数（`VERIFIED` / `AUDITED`）。
- 不返回解析中间产物（`candidates.json`、`param_blocks`、`gold_eval`）。
- `categories.refs` 只有引用，没有名称/路径；分类改名不导致产品缓存失效。
- `documents` 不含 PDF 二进制或下载 URL。

---

## EX-12 未发布产品 403

**请求**

```http
GET /api/v1/products/prd_01J8Q000000000000000000000 HTTP/1.1
Host: dsbit.example.com
Authorization: Bearer <REDACTED_ACCESS_TOKEN>
```

**响应 `403 Forbidden`**

```json
{
  "code": 40302,
  "message": "Product data is not released",
  "data": {
    "product_id": "prd_01J8Q000000000000000000000",
    "visible_state": "PENDING"
  },
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQR9",
  "meta": {
    "error_key": "PRODUCT_NOT_RELEASED",
    "retryable": false,
    "degraded_allowed": true
  }
}
```

说明：

- `403` 而非 `404`：产品**存在**但未发布，与"不存在"必须区分。
- `degraded_allowed=true`：Morrishk 可继续展示本地最后一次已发布快照（如果有），但不得展示 `PENDING` 内容。
- 若客户端只有 `product.read`，不返回 `visible_state` 细节也无妨；有 `product.publish.read` 时可返回。

---

## EX-13 撤回产品 410

**请求**

```http
GET /api/v1/products/prd_01J8R000000000000000000000 HTTP/1.1
Host: dsbit.example.com
Authorization: Bearer <REDACTED_ACCESS_TOKEN>
```

**响应 `410 Gone`**

```json
{
  "code": 41001,
  "message": "Product release revoked",
  "data": {
    "product_id": "prd_01J8R000000000000000000000",
    "release_id": "rel_01J8S000000000000000000000",
    "release_version": 2,
    "revoked_at": "2026-11-16T00:00:00Z",
    "reason_code": "CONTENT_WITHDRAWN"
  },
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRA",
  "meta": {
    "error_key": "PRODUCT_RELEASE_REVOKED",
    "retryable": false,
    "degraded_allowed": false
  }
}
```

说明：`degraded_allowed=false` 表示 Morrishk **必须停止公开展示**该产品，不能继续读缓存当正常数据。撤回 ≠ 删除；资源身份仍保留，便于审计与恢复。

---

## EX-14 产品状态（三层门禁）

**请求**

```http
GET /api/v1/products/prd_01J8Z9K2V4ABCDEFGHJKMNPQRS/status HTTP/1.1
Host: dsbit.example.com
Authorization: Bearer <REDACTED_ACCESS_TOKEN>
```

**响应 `200 OK`**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "product_id": "prd_01J8Z9K2V4ABCDEFGHJKMNPQRS",
    "gates": {
      "pipeline": {
        "state": "PASS",
        "pipeline_run_id": "V101-20261112T231416Z-ff12",
        "evaluated_at": "2026-11-12T09:00:00Z"
      },
      "content": {
        "state": "APPROVED",
        "approved_at": "2026-11-12T09:30:00Z",
        "approval_ref": "apr_01J8T000000000000000000000"
      },
      "release": {
        "state": "APPROVED",
        "release_id": "rel_01J8P000000000000000000000",
        "release_version": 3,
        "released_at": "2026-11-12T10:00:00Z"
      }
    },
    "visible_state": "RELEASED",
    "parameter_stats": {
      "formal": 42,
      "unresolved": 1,
      "quarantined": 0,
      "rejected": 0
    },
    "updated_at": "2026-11-12T10:00:00Z"
  },
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRB",
  "meta": {}
}
```

说明：三层状态必须独立返回，不得压成一个布尔值（主文档 §8.1）。`parameter_stats` 只给计数，不给未通过参数的内容。

---

## EX-15 产品版本列表

**请求**

```http
GET /api/v1/products/prd_01J8Z9K2V4ABCDEFGHJKMNPQRS/versions?limit=2 HTTP/1.1
Host: dsbit.example.com
Authorization: Bearer <REDACTED_ACCESS_TOKEN>
```

**响应 `200 OK`**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "product_id": "prd_01J8Z9K2V4ABCDEFGHJKMNPQRS",
    "items": [
      {
        "content_version": 7,
        "release_version": 3,
        "pipeline_run_id": "V101-20261112T231416Z-ff12",
        "content_approved_at": "2026-11-12T09:30:00Z",
        "released_at": "2026-11-12T10:00:00Z",
        "change_summary": "Corrected supply voltage max",
        "is_current": true
      },
      {
        "content_version": 6,
        "release_version": 2,
        "pipeline_run_id": "V101-20261105T080000Z-ab34",
        "content_approved_at": "2026-11-05T09:00:00Z",
        "released_at": "2026-11-05T10:00:00Z",
        "change_summary": null,
        "is_current": false
      }
    ]
  },
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRC",
  "meta": {
    "limit": 2,
    "next_cursor": "eyJ2Ijo2fQ",
    "has_more": true
  }
}
```

说明：v1 只读，不提供回滚操作。

---

## EX-16 产品证据

**请求**

```http
GET /api/v1/products/prd_01J8Z9K2V4ABCDEFGHJKMNPQRS/evidence HTTP/1.1
Host: dsbit.example.com
Authorization: Bearer <REDACTED_ACCESS_TOKEN>
```

**响应 `200 OK`**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "product_id": "prd_01J8Z9K2V4ABCDEFGHJKMNPQRS",
    "document_sha256": "059d448c5a34a4b1e0f1c2d3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a21",
    "items": [
      {
        "evidence_id": "ev_01J8J000000000000000000000",
        "evidence_type": "CELL_TEXT",
        "page_number": 7,
        "table_id": "tbl_3",
        "row_id": "r_12",
        "cell_id": "c_4",
        "bbox": [72.0, 410.5, 180.2, 421.0],
        "raw_text": "3 V to 32 V",
        "screenshot_reference": "runs/V101/pages/page-0007.png",
        "data_version": 2
      }
    ]
  },
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRD",
  "meta": {
    "truncated": false
  }
}
```

说明：

- `screenshot_reference` 是**本地相对路径**，不是 URL；是否提供下载需单独授权（`OPEN` IQ-08）。
- `raw_text` 建议 ≤ 500 字符。
- 只返回 `APPROVED` 参数的证据；未通过参数不在正式证据集中。

---

## EX-17 产品搜索 / 增量同步

### EX-17a MPN 精确查找

```http
GET /api/v1/products/search?mpn=LM358DR&mpn_match=exact&limit=10 HTTP/1.1
Host: dsbit.example.com
Authorization: Bearer <REDACTED_ACCESS_TOKEN>
```

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      {
        "product_id": "prd_01J8Z9K2V4ABCDEFGHJKMNPQRS",
        "mpn": "LM358DR",
        "mpn_norm": "LM358DR",
        "manufacturer": "Example Semiconductor",
        "package": "SOIC-8",
        "visible_state": "RELEASED",
        "content_version": 7,
        "updated_at": "2026-11-12T10:00:00Z"
      }
    ]
  },
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRE",
  "meta": {"limit": 10, "next_cursor": null, "has_more": false}
}
```

### EX-17b 增量同步（含撤回）

```http
GET /api/v1/products/search?updated_since=2026-11-12T00:00:00Z&release_state=RELEASED&limit=200 HTTP/1.1
```

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      {
        "product_id": "prd_01J8Z9K2V4ABCDEFGHJKMNPQRS",
        "mpn": "LM358DR",
        "mpn_norm": "LM358DR",
        "visible_state": "RELEASED",
        "content_version": 7,
        "updated_at": "2026-11-12T10:00:00Z"
      }
    ]
  },
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRF",
  "meta": {
    "limit": 200,
    "next_cursor": "eyJ2Ijo3LCJpZCI6InByZF8wMUo4In0",
    "has_more": true
  }
}
```

### EX-17c 发现撤回（第二次增量）

```http
GET /api/v1/products/search?updated_since=2026-11-15T00:00:00Z&release_state=REVOKED HTTP/1.1
```

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      {
        "product_id": "prd_01J8R000000000000000000000",
        "mpn": "EXAMPLE-999",
        "visible_state": "REVOKED",
        "revoked_at": "2026-11-16T00:00:00Z"
      }
    ]
  },
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRG",
  "meta": {"limit": 200, "next_cursor": null, "has_more": false}
}
```

说明：`release_state=REVOKED` 是 `V1_REQUIRED`，没有它消费方无法感知撤回。Morrishk 收到后必须把对应产品标记为不可公开并停止从缓存展示。

---

## EX-18 通用错误

### EX-18a `400 INVALID_ARGUMENT`

```json
{
  "code": 40001,
  "message": "limit must be between 1 and 200",
  "data": null,
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRH",
  "meta": {
    "error_key": "INVALID_ARGUMENT",
    "retryable": false,
    "degraded_allowed": false,
    "field": "limit"
  }
}
```

### EX-18b `400 UNKNOWN_FILTER`

```json
{
  "code": 40002,
  "message": "Unknown query parameter: foo",
  "data": null,
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRJ",
  "meta": {
    "error_key": "UNKNOWN_FILTER",
    "retryable": false,
    "degraded_allowed": false,
    "parameter": "foo"
  }
}
```

### EX-18c `404 PRODUCT_NOT_FOUND`

```json
{
  "code": 40401,
  "message": "Product not found",
  "data": null,
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRK",
  "meta": {
    "error_key": "PRODUCT_NOT_FOUND",
    "retryable": false,
    "degraded_allowed": true
  }
}
```

### EX-18d `500 INTERNAL_ERROR`

```json
{
  "code": 50001,
  "message": "Internal server error",
  "data": null,
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRM",
  "meta": {
    "error_key": "INTERNAL_ERROR",
    "retryable": true,
    "degraded_allowed": true
  }
}
```

说明：`message` 面向开发者，不得包含堆栈、SQL、路径、Token。`meta` 只放稳定的机器可读字段。

---

## EX-19 304 Not Modified

**请求**

```http
GET /api/v1/products/prd_01J8Z9K2V4ABCDEFGHJKMNPQRS HTTP/1.1
Host: dsbit.example.com
Authorization: Bearer <REDACTED_ACCESS_TOKEN>
If-None-Match: "sha256:7a1d3e9b..."
```

**响应 `304 Not Modified`**

```http
ETag: "sha256:7a1d3e9b..."
X-Data-Version: 7
X-Request-Id: req_01J8Z9K2V3ABCDEFGHJKMNPQRN
```

无响应体。

说明：304 不返回业务包；客户端沿用本地副本。`code=0 / NOT_MODIFIED` 只用于日志归类，不出现在 HTTP 响应体中。

---

## EX-20 429 限流

**响应 `429 Too Many Requests`**

```http
Retry-After: 12
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1763352000
X-Request-Id: req_01J8Z9K2V3ABCDEFGHJKMNPQRP
```

```json
{
  "code": 42901,
  "message": "Rate limit exceeded",
  "data": null,
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRP",
  "meta": {
    "error_key": "RATE_LIMITED",
    "retryable": true,
    "degraded_allowed": true,
    "retry_after_seconds": 12
  }
}
```

说明：同步任务必须主动节流（串行 + 页间 sleep）；429 不是正常流控手段。

---

## EX-21 Morrishk 映射表行

> 以下为 `dsbit_category_mapping` 的候选行（`PROPOSED`，MySQL 5.6 兼容）。
> 映射必须人工审核；`mapping_source` 禁止 `NAME_MATCH`。

### EX-21a 一对一，已审核

```sql
INSERT INTO dsbit_category_mapping (
  dsbit_taxonomy_id, dsbit_category_id,
  morrishk_target, morrishk_category_id,
  mapping_type, is_primary,
  mapping_status, mapping_source,
  review_note, reviewed_by, reviewed_at,
  valid_from, valid_to,
  created_at, updated_at
) VALUES (
  'tax_01J8Z9K2V3ABCDEFGHJKMNPQRS',
  'cat_01J8D000000000000000000000',
  'LEGACY_SNSII', 102,
  'EXACT', 1,
  'APPROVED', 'MANUAL',
  '导航「放大器」对应技术分类 general-purpose-op-amps',
  'reviewer_a', '2026-11-16T08:00:00Z',
  '2026-11-16T08:00:00Z', NULL,
  '2026-11-16T08:00:00Z', '2026-11-16T08:00:00Z'
);
```

### EX-21b 聚合映射，待审核

```sql
INSERT INTO dsbit_category_mapping (
  dsbit_taxonomy_id, dsbit_category_id,
  morrishk_target, morrishk_category_id,
  mapping_type, is_primary,
  mapping_status, mapping_source,
  review_note, reviewed_by, reviewed_at,
  valid_from, valid_to,
  created_at, updated_at
) VALUES (
  'tax_01J8Z9K2V3ABCDEFGHJKMNPQRS',
  'cat_01J8E000000000000000000000',
  'LEGACY_SNSII', 102,
  'AGGREGATE', 0,
  'PROPOSED', 'SEED',
  '低功耗运放并入「放大器」导航，待业务确认',
  NULL, NULL,
  '2026-11-16T08:00:00Z', NULL,
  '2026-11-16T08:00:00Z', '2026-11-16T08:00:00Z'
);
```

### EX-21c 无法映射，进入人工队列

```sql
INSERT INTO dsbit_category_mapping (
  dsbit_taxonomy_id, dsbit_category_id,
  morrishk_target, morrishk_category_id,
  mapping_type, is_primary,
  mapping_status, mapping_source,
  review_note, reviewed_by, reviewed_at,
  valid_from, valid_to,
  created_at, updated_at
) VALUES (
  'tax_01J8Z9K2V3ABCDEFGHJKMNPQRS',
  'cat_01J8G000000000000000000000',
  'LEGACY_SNSII', 0,
  'MANUAL', 0,
  'UNMAPPED', 'IMPORT',
  '新技术分类，Morrishk 无对应导航项',
  NULL, NULL,
  '2026-11-16T08:00:00Z', NULL,
  '2026-11-16T08:00:00Z', '2026-11-16T08:00:00Z'
);
```

说明：

- `morrishk_category_id = 0` 仅用于 `UNMAPPED` 占位；**不得**写入 `snsii_product_category`。
- 同一 `dsbit_category_id` 可有多行（多目标/多类型），但同一 `(dsbit_category_id, morrishk_target, morrishk_category_id, valid_to IS NULL)` 应唯一，由应用层保证（5.6 无部分唯一索引）。
- 映射变化**不**触发 URL 变更或 301。

---

## EX-22 同步状态行

> `dsbit_sync_state` 候选行（`PROPOSED`）。

### EX-22a 正常运行

```sql
INSERT INTO dsbit_sync_state (
  sync_key, resource_type, resource_id,
  cursor, etag, remote_version,
  last_success_at, last_attempt_at,
  last_error_key, last_error_at,
  consecutive_failures, status, updated_at
) VALUES (
  'taxonomy:tax_01J8Z9K2V3ABCDEFGHJKMNPQRS',
  'TAXONOMY',
  'tax_01J8Z9K2V3ABCDEFGHJKMNPQRS',
  NULL,
  '"sha256:9f2c0b7d..."',
  '42',
  '2026-11-17T03:20:11Z', '2026-11-17T03:20:11Z',
  NULL, NULL,
  0, 'IDLE', '2026-11-17T03:20:11Z'
);
```

### EX-22b 降级（连续失败）

```sql
INSERT INTO dsbit_sync_state (
  sync_key, resource_type, resource_id,
  cursor, etag, remote_version,
  last_success_at, last_attempt_at,
  last_error_key, last_error_at,
  consecutive_failures, status, updated_at
) VALUES (
  'products',
  'PRODUCT',
  NULL,
  'eyJ2Ijo3LCJpZCI6InByZF8wMUo4In0',
  NULL,
  NULL,
  '2026-11-16T02:00:00Z', '2026-11-17T03:25:00Z',
  'SERVICE_UNAVAILABLE', '2026-11-17T03:25:00Z',
  5, 'DEGRADED', '2026-11-17T03:25:00Z'
);
```

说明：`status=DEGRADED` 时页面继续读本地缓存并告警；`consecutive_failures >= 5` 触发熔断（主文档 §4.8）。同步日志不记录 Token、secret、完整响应体。

---

## 附：示例与测试矩阵的对应

| 示例 | 覆盖测试项（主文档 §12） |
|---|---|
| EX-01 / EX-02 | OAuth2 成功、凭据错误、scope 拒绝 |
| EX-03 / EX-04 / EX-05 | 分类体系、ETag、树上限 |
| EX-06 / EX-07 / EX-08 / EX-09 | 分类节点、产品边、版本、变更 |
| EX-10 | 停用/合并兼容、410 |
| EX-11 / EX-12 / EX-13 | 产品 DTO、未发布 403、撤回 410 |
| EX-14 / EX-15 / EX-16 | 三层门禁、版本、证据 |
| EX-17 | MPN 精确/松散、增量、撤回发现 |
| EX-18 / EX-19 / EX-20 | 通用错误、304、429 |
| EX-21 / EX-22 | 映射与同步幂等、降级 |

> 本文件不包含任何真实数据、真实凭据或真实响应。所有数值和 ID 均为构造示例。
