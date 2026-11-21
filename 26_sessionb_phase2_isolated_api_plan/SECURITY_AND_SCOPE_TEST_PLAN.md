# SECURITY AND SCOPE TEST PLAN · 安全与 Scope 测试计划（计划稿）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE2-SEC-001 |
| 版本 | v0.1-draft（计划；不接入真实 OAuth Provider、不生成真实凭证） |
| 对象 | 获批实施后的隔离 Runtime（W-1）+ Client 原型（W-3） |
| 状态词汇 | 同主计划；`BLOCKED_BY_DECISION` 标注依赖 |

---

## 1. 三类 Token 身份严格分离（不得混用）

| 身份 | 流程 | Issuer | Audience | Scope 空间 | 存储 | 测试关注 |
|---|---|---|---|---|---|---|
| **T1 内部机器身份** | OAuth2 Client Credentials（工作台/同步程序 → Business API） | Ds Bit AS（方案） | Ds Bit Business API RS | `product.read` 等 5 scope | 工作台服务端 secret vault；永不进前端 | scope 门禁、撤销传播、TTL |
| **T2 Morrishk 用户** | OIDC Authorization Code + PKCE（用户 → 社媒工作台登录） | Morrishk IdP（方案） | 社媒工作台 | 工作台自身会话/角色 | 工作台会话 | 与 T1 **不共享** scope/存储；不得以用户身份直调 Business API |
| **T3 外部社媒平台** | 各平台官方 OAuth（工作台 → Meta/LinkedIn/X 等） | 各平台 | 各平台 API | 平台自有 | 工作台平台凭据库 | 与 T1/T2 互不可换；business API 不得接受 T3 |

负向断言（获批实施后）：
- T2 用户 Token 调用 Business API → 40101（audience/issuer 不符）；
- T3 平台 Token 调用 Business API → 40101；
- T1 Token 不得出现在 T2 会话或 T3 平台调用链中（日志与存储隔离断言）。

## 2. 场景矩阵（13 组）

| # | 场景 | 输入 | 预期 | 关联错误码 | 状态/依赖 | 覆盖端点 |
|---|---|---|---|---|---|---|
| SEC-01 | 无 Token | 无 Authorization 头 | 401 INVALID_TOKEN | 40101 | PROPOSED | 全部业务端点抽样 ≥5 |
| SEC-02 | 无效 Token | 畸形/未知opaque token | 401 INVALID_TOKEN | 40101 | PROPOSED | 同上 |
| SEC-03 | 过期 Token | TTL 过期（本地 AS 桩注入，数值挂 IQ-12） | 401 TOKEN_EXPIRED | 40102 | PROPOSED；数值 BLOCKED_BY_DECISION(IQ-12) | 全部抽样 |
| SEC-04 | 错误 Audience | aud≠Business API 的 Token（本地 AS 桩签发） | 401 INVALID_TOKEN | 40101 | PROPOSED；audience 方案挂 W-4 设计 | 全部抽样 |
| SEC-05 | 错误 Client | 未注册 client_id / 错 secret（本地桩） | OP-01 401 invalid_client（RFC 形状） | OAuthError | PROPOSED；注册责任挂 IQ-11；凭证形态挂 IQ-21 | OP-01 |
| SEC-06 | Scope 缺失 | 无 `product.category.read` 调分类端点 | 403 INSUFFICIENT_SCOPE | 40301 | PROPOSED（R-OA-05） | OP-07..16 |
| SEC-07 | Scope 不匹配 | 有 `product.read` 无 `product.evidence.read` 调 /evidence | 403 INSUFFICIENT_SCOPE | 40301 | PROPOSED | OP-06 |
| SEC-08 | 越权资源访问 | `internal_only=true` 仅持单 scope；PENDING_*/REVOKED/PENDING 过滤缺 publish scope；include_unreleased 缺 scope | 403 INSUFFICIENT_SCOPE（不得静默忽略） | 40301 | PROPOSED | OP-02/OP-07 |
| SEC-09 | 非公开状态商品访问 | 无 publish scope 读未发布/已撤回产品详情 | 403 PRODUCT_NOT_RELEASED / 410 REVOKED | 40302/41001 | PROPOSED；410 终态行为 R-ST-06 | OP-03/OP-05/OP-06/OP-07 |
| SEC-10 | 未批准证据访问 | 证据公开范围未裁（B8）：fixture 含"内部待批"证据 | 断言挂起：暴露字段集合 `BLOCKED_BY_DECISION(B8/IQ-08)`；scope 缺失路径可先测（40301） | 40301 | **BLOCKED(B8)** | OP-06 |
| SEC-11 | 速率限制 | 超 60rpm 全局 / 10rpm 树 / 30rpm 搜索（数值 PROPOSED 挂 IQ-12） | 429 RATE_LIMITED + Retry-After | 42901 | PROPOSED；数值 BLOCKED_BY_DECISION(IQ-12) | 全部（重点 OP-02/OP-11） |
| SEC-12 | 缓存与 304 | 同资源二次请求带 If-None-Match；ETag 变更后 200 | 304 无体非错误；200 新 ETag；`data_version` 驱动 | —（304 非错误） | PROPOSED（R-VER-02；Mock 缺 304=DIFF-MOCK-03） | OP-03/OP-09/OP-10/OP-11 |
| SEC-13 | 请求追踪与审计 | 带 8–64 `[A-Za-z0-9_-]` X-Request-Id；不带；重复值 | 回显/生成规则（**P1-2 未裁：回显 vs 重新生成**）；日志零 Token/secret；request_id 头体一致 | — | PENDING(P1-2)；日志脱敏为硬性断言（CONFIRMED 纪律） | 全部抽样 |

## 3. 越权矩阵（5 Scope × 15 业务端点 = 75 组合，完整展开）

**口径声明（修正 R3）**：本节为**完整计划矩阵 75/75**，逐组合展开，不再是抽样描述；每个单 scope Token 依次对 15 个业务端点各请求一次。
- 5 个 Scope：`product.read`（S1）、`product.category.read`（S2）、`product.evidence.read`（S3）、`product.version.read`（S4）、`product.publish.read`（S5）。
- 15 个业务端点：`searchProducts`、`getProduct`、`getProductStatus`、`listProductVersions`、`listProductEvidence`、`getProductCategories`、`listTaxonomies`、`getTaxonomy`、`getTaxonomyVersion`、`listCategories`、`listTaxonomyChanges`、`getCategory`、`listCategoryChildren`、`listCategoryAncestors`、`listCategoryProducts`（= 16 操作减 `issueToken`）。
- 每行所需 scope 取自基线 OpenAPI 各操作的 `security` 声明；"允许/拒绝"为**候选语义**（R-OA-05 PROPOSED：缺 scope→403/40301，不降级不回退）。该声明属 `CANDIDATE_AUTHORIZATION`，**不得自动提升为已裁定授权规则**（修正 R5）。
- **统计分列（R5）**：授权依据类型逐行标注——本矩阵**全部 75 行 = `CANDIDATE_AUTHORIZATION`**；`CONFIRMED_AUTHORIZATION` = **0**；授权规则待裁定 = **75**；另有 **5** 行叠加业务语义阻断（DIFF-CONTRACT-01 / B6 / B8 / P1-3 / DIFF-MOCK-05）。**正式可执行测试数量 = 0**（详见 §3 末统计块）。
- 双 scope 组合语义（如 `internal_only` 需 `product.category.read`+`product.publish.read`）属**复合测试**，在 SEC-08 单列，不计入本 75 组合（本矩阵 Token 均为单 scope）。

| # | Scope | operationId | 具备所需权限 | 候选预期 | 候选 HTTP/错误码 | 规则来源（候选） | 授权依据类型 | 验收分类（含阻断来源） |
|---|---|---|---|---|---|---|---|---|
| 1 | S1 `product.read` | `searchProducts` | 是 | 允许 | 200 | R-OA-05 + OpenAPI security 声明 | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED ＋ 业务语义阻断：DIFF-CONTRACT-01 条目形态） |
| 2 | S1 `product.read` | `getProduct` | 是 | 允许 | 200 | R-OA-05 + OpenAPI security 声明 | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 3 | S1 `product.read` | `getProductStatus` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 4 | S1 `product.read` | `listProductVersions` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 5 | S1 `product.read` | `listProductEvidence` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 6 | S1 `product.read` | `getProductCategories` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 7 | S1 `product.read` | `listTaxonomies` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 8 | S1 `product.read` | `getTaxonomy` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 9 | S1 `product.read` | `getTaxonomyVersion` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 10 | S1 `product.read` | `listCategories` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 11 | S1 `product.read` | `listTaxonomyChanges` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 12 | S1 `product.read` | `getCategory` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 13 | S1 `product.read` | `listCategoryChildren` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 14 | S1 `product.read` | `listCategoryAncestors` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 15 | S1 `product.read` | `listCategoryProducts` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 16 | S2 `product.category.read` | `searchProducts` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 17 | S2 `product.category.read` | `getProduct` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 18 | S2 `product.category.read` | `getProductStatus` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 19 | S2 `product.category.read` | `listProductVersions` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 20 | S2 `product.category.read` | `listProductEvidence` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 21 | S2 `product.category.read` | `getProductCategories` | 是 | 允许 | 200 | R-OA-05 + OpenAPI security 声明 | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 22 | S2 `product.category.read` | `listTaxonomies` | 是 | 允许 | 200 | R-OA-05 + OpenAPI security 声明 | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 23 | S2 `product.category.read` | `getTaxonomy` | 是 | 允许 | 200 | R-OA-05 + OpenAPI security 声明 | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 24 | S2 `product.category.read` | `getTaxonomyVersion` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 25 | S2 `product.category.read` | `listCategories` | 是 | 允许 | 200 | R-OA-05 + OpenAPI security 声明 | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 26 | S2 `product.category.read` | `listTaxonomyChanges` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 27 | S2 `product.category.read` | `getCategory` | 是 | 允许 | 200 | R-OA-05 + OpenAPI security 声明 | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED ＋ 业务语义阻断：P1-3 children 形态） |
| 28 | S2 `product.category.read` | `listCategoryChildren` | 是 | 允许 | 200 | R-OA-05 + OpenAPI security 声明 | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 29 | S2 `product.category.read` | `listCategoryAncestors` | 是 | 允许 | 200 | R-OA-05 + OpenAPI security 声明 | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 30 | S2 `product.category.read` | `listCategoryProducts` | 是 | 允许 | 200 | R-OA-05 + OpenAPI security 声明 | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED ＋ 业务语义阻断：DIFF-MOCK-05 默认过滤） |
| 31 | S3 `product.evidence.read` | `searchProducts` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 32 | S3 `product.evidence.read` | `getProduct` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 33 | S3 `product.evidence.read` | `getProductStatus` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 34 | S3 `product.evidence.read` | `listProductVersions` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 35 | S3 `product.evidence.read` | `listProductEvidence` | 是 | 允许 | 200 | R-OA-05 + OpenAPI security 声明 | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED ＋ 业务语义阻断：B8 证据暴露范围） |
| 36 | S3 `product.evidence.read` | `getProductCategories` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 37 | S3 `product.evidence.read` | `listTaxonomies` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 38 | S3 `product.evidence.read` | `getTaxonomy` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 39 | S3 `product.evidence.read` | `getTaxonomyVersion` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 40 | S3 `product.evidence.read` | `listCategories` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 41 | S3 `product.evidence.read` | `listTaxonomyChanges` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 42 | S3 `product.evidence.read` | `getCategory` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 43 | S3 `product.evidence.read` | `listCategoryChildren` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 44 | S3 `product.evidence.read` | `listCategoryAncestors` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 45 | S3 `product.evidence.read` | `listCategoryProducts` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 46 | S4 `product.version.read` | `searchProducts` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 47 | S4 `product.version.read` | `getProduct` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 48 | S4 `product.version.read` | `getProductStatus` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 49 | S4 `product.version.read` | `listProductVersions` | 是 | 允许 | 200 | R-OA-05 + OpenAPI security 声明 | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 50 | S4 `product.version.read` | `listProductEvidence` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 51 | S4 `product.version.read` | `getProductCategories` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 52 | S4 `product.version.read` | `listTaxonomies` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 53 | S4 `product.version.read` | `getTaxonomy` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 54 | S4 `product.version.read` | `getTaxonomyVersion` | 是 | 允许 | 200 | R-OA-05 + OpenAPI security 声明 | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 55 | S4 `product.version.read` | `listCategories` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 56 | S4 `product.version.read` | `listTaxonomyChanges` | 是 | 允许 | 200 | R-OA-05 + OpenAPI security 声明 | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 57 | S4 `product.version.read` | `getCategory` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 58 | S4 `product.version.read` | `listCategoryChildren` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 59 | S4 `product.version.read` | `listCategoryAncestors` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 60 | S4 `product.version.read` | `listCategoryProducts` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 61 | S5 `product.publish.read` | `searchProducts` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 62 | S5 `product.publish.read` | `getProduct` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 63 | S5 `product.publish.read` | `getProductStatus` | 是 | 允许 | 200 | R-OA-05 + OpenAPI security 声明 | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED ＋ 业务语义阻断：B6 状态枚举） |
| 64 | S5 `product.publish.read` | `listProductVersions` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 65 | S5 `product.publish.read` | `listProductEvidence` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 66 | S5 `product.publish.read` | `getProductCategories` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 67 | S5 `product.publish.read` | `listTaxonomies` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 68 | S5 `product.publish.read` | `getTaxonomy` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 69 | S5 `product.publish.read` | `getTaxonomyVersion` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 70 | S5 `product.publish.read` | `listCategories` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 71 | S5 `product.publish.read` | `listTaxonomyChanges` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 72 | S5 `product.publish.read` | `getCategory` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 73 | S5 `product.publish.read` | `listCategoryChildren` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 74 | S5 `product.publish.read` | `listCategoryAncestors` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |
| 75 | S5 `product.publish.read` | `listCategoryProducts` | 否 | 拒绝 | 403/40301 | R-OA-05（缺 scope 不降级） | PROPOSED | CANDIDATE_AUTHORIZATION | 挂起（授权待裁定：R-OA-05 PROPOSED，无 CONFIRMED 授权依据） |

**覆盖统计（五分法，修正 R5）**：
- 计划矩阵覆盖数量：**75/75**；
- 候选授权映射数量：**75**（全部行的授权结果仅来自候选 OpenAPI security 声明 + R-OA-05 **PROPOSED**，逐行标记 `CANDIDATE_AUTHORIZATION`）；
- 正式可执行测试数量：**0**（Rule Registry 中不存在 CONFIRMED 状态的 scope→endpoint 授权规则；如实报告为 0，不推断为 70）；
- 授权规则待裁定数量：**75**（R-OA-05 PROPOSED：全部 75 行的授权结果须待授权规则裁定/冻结后方可计入正式行为验收）；
- 其他业务语义待裁定数量：**5**（行 1/27/30/35/63：DIFF-CONTRACT-01 / B6 / B8 / P1-3 / DIFF-MOCK-05）。

旧口径「可执行 70」自本修正起**作废**，任何文件不得再引用。全部 75 行验收分类均为**挂起**；实施期 RUN 可产生执行记录，但**不构成正式行为验收 PASS**，直至授权依据类型升级为 `CONFIRMED_AUTHORIZATION`。

## 4. 非生产声明

- 本计划全部场景使用**本地 AS 桩**与**DEMO_FIXTURE**；
- 不注册生产 OAuth 应用、不申请真实 client secret、不抓取真实用户 Token；
- 三类 Token 的"混用负向断言"仅依赖本地签发形态，不依赖任何外部服务。
