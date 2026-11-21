# API OPERATION TEST MATRIX · 16 操作测试矩阵（计划稿）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE2-OPS-001 |
| 版本 | v0.1-draft（计划；预期结果为获批实施后的验收目标，非现状断言） |
| 输入 | `25_/contract/openapi.candidate.v1.1-draft.json`（零线形变更于基线 `fdeec48e…1023`）+ `25_/RULE_STATUS_REGISTER.md`（55 条规则） |
| 状态词汇 | 规则状态沿用 registry（CONFIRMED/PROPOSED/PENDING/BLOCKED）；`BLOCKED_BY_DECISION` = 该断言/实现依赖未决裁定，标注依赖编号 |
| 覆盖声明 | 16 操作全部入矩阵；不自行补全未获批业务语义 |

> 通用验收证据口径（获批实施后）：每条 RUN = 隔离 Runtime 真实 HTTP 交互记录（请求/响应/状态码/头/体摘要 + request_id）。
> 通用前置：W-1 Runtime + FIXTURE 就绪；scope 门禁测试另见 `SECURITY_AND_SCOPE_TEST_PLAN.md`。

---

## OP-01 `issueToken` — POST `/oauth/token`

| 维度 | 内容 |
|---|---|
| 认证/Scope | 客户端认证 = `client_secret_basic`（HTTP Basic）；无 Bearer scope |
| 请求 | `application/x-www-form-urlencoded`：`grant_type=client_credentials`（必填，const）、`scope`（空格分隔子集） |
| 响应 200 | RFC 6749 形状（TokenResponse：`access_token/token_type=Bearer/expires_in=900/scope`）——**不使用** JSON 包 |
| 异常 | 400 `invalid_request`/`invalid_scope`/`unsupported_grant_type`；401 `invalid_client`（OAuthError 形状）；429/500 复用业务包（P1-6 双轨登记） |
| 边界 | `grant_type` 非法值；scope 超出注册子集；重复请求幂等性；Basic 头缺失/格式错 |
| 规则状态 | R-OA-01/02 PROPOSED；R-OA-03 PROPOSED；R-OA-04 PENDING（P1-7）；R-OA-06 BLOCKED（IQ-21）；P1-8（expires_in const）PENDING |
| 预期/证据 | 200 形状断言 + RFC 错误形状断言；凭证有效性流程测试 `BLOCKED_BY_DECISION(IQ-21)`（本地 AS 桩形态待裁）；TTL 数值断言挂 IQ-12 |
| 错误码 | OAuth 形状（不在 20 码目录）+ 42901/50001 |

## OP-02 `searchProducts` — GET `/products/search`

| 维度 | 内容 |
|---|---|
| 认证/Scope | Bearer；`product.read`；`identity_state=PENDING_*`、`release_state=REVOKED/PENDING`、`include_unreleased=true` 需 `product.publish.read` |
| 参数 | `mpn`/`brand`/`mpn_match`/`identity_state`/`updated_since`/`release_state`/`taxonomy_id`/`category_id`/`include_unreleased`/`limit`/`cursor`/`If-None-Match` |
| 响应 200 | `ProductListEnvelope`（OpenAPI=items→Product[]；EX-17=扁平行）——**形态冲突未裁** |
| 正常 | 精确查找命中（mpn+brand+exact）；增量同步（updated_since）；REVOKED 流（V1_REQUIRED 语义） |
| 异常 | 缺 mpn→400/40001；mpn 非法/归一空→400/40001(field=mpn)；**缺 brand 双候选向量**：候选-422（422/42201, missing=[brand]；MD §6.4+候选 §4.5 方向）/ 候选-400（400/40001, field=brand；EX-17 说明方向）——均 `BLOCKED_BY_DECISION(DIFF-CONTRACT-03)`，分别断言、不得合并为单一响应；brand 非法→400（无争议）；归一化冲突→422/42202 **仅限未来经 B5 裁定确认的归一化冲突**（F-11 `NORMALIZATION_CONFLICT_CANDIDATE_PENDING_B5` 占位，当前无可执行向量，`BLOCKED_BY_DECISION(B5)`）；F-10 `SOURCE_IDENTITY_CONFLICT` 为来源层冲突候选，**不属于 42202 触发条件**（外部错误表达待裁定）；F-07 同 MPN 异 Brand 为两个合法身份，不触发冲突；未知过滤→400/40002；scope 不足→403/40301 |
| 边界 | limit 0/201/超型；cursor 伪造；mpn 200 字符上限；空结果 vs 错误不得互伪装 |
| 规则状态 | R-ID-01/02/03 CONFIRMED；R-ID-04..06 PROPOSED(B5)；R-ID-08 PROPOSED；R-ID-09 BLOCKED(IQ-20)；R-ST-04 BLOCKED(B6)；R-ST-05 PROPOSED（**默认过滤未裁**：DIFF-MOCK-05 OPEN，候选 A/B 双向量）；R-PTG-01 PROPOSED |
| 预期/证据 | 命中/错误/分页 RUN 记录；**响应条目形态断言 `BLOCKED_BY_DECISION(DIFF-CONTRACT-01)`**；**默认过滤双向量均 `BLOCKED_BY_DECISION(DIFF-MOCK-05)`**（候选 A：默认仅 RELEASED / 候选 B：不自动过滤），裁定前任一向量不计入行为验收 PASS，W-1/W-2 不预置默认值 |
| 错误码 | 40001/40002/40101/40102/40301/40302/42201/42202/42901/50001/50301 |

## OP-03 `getProduct` — GET `/products/{product_business_key}`

| 维度 | 内容 |
|---|---|
| 认证/Scope | Bearer；`product.read` |
| 响应 200 | `ProductEnvelope`→Product（必填集含 `data_version`，不含 `visible_state`：P1-9） |
| 正常 | RELEASED 产品全量 DTO；ETag 命中→304 |
| 异常 | 404/40401 不存在；403/40302 存在未发布（不返回 404，候选 §6.4）；410/41001 已撤回（终态，degraded_allowed=false） |
| 边界 | pbk 格式非法（非 `^pbk1_[0-9a-f]{64}$`）→400；大小写敏感；`If-None-Match` 弱校验器 |
| 规则状态 | R-ID-01/06 CONFIRMED/PROPOSED；R-ST-06 PROPOSED；R-PRD-01 PROPOSED(P1-9)；R-PRD-03 CONFIRMED（platform 不入契约） |
| 预期/证据 | 三态（200/403/410）+404+304 RUN 记录 |
| 错误码 | 40001/40101/40302/40401/41001/42901/50001/50301 |

## OP-04 `getProductStatus` — GET `/products/{pbk}/status`

| 维度 | 内容 |
|---|---|
| 认证/Scope | Bearer；**`product.publish.read`** |
| 响应 200 | `ProductStatusEnvelope`：gates.pipeline/content/release + derived `visible_state` |
| 正常 | 三闸门齐全；派生规则（release=APPROVED→RELEASED；REVOKED→WITHDRAWN；content=APPROVED→IN_REVIEW；else DRAFT） |
| 异常 | 404；403（缺 publish scope）；闸门顺序断言（上游未过下游不得 APPROVED，R-ST-01） |
| 边界 | Gate.state 自由串（P2-3）；`PIPELINE_PASS`/`CONTENT_APPROVED`/`RELEASE_APPROVED` 三命名空间**不得混用**（B6） |
| 规则状态 | R-ST-01 PROPOSED(B6)；R-ST-02/03 **BLOCKED(B6,P0-5)**；R-ST-06 PROPOSED |
| 预期/证据 | 派生矩阵 4 行 RUN（fixture 各状态各一）；**枚举命名冻结断言 `BLOCKED_BY_DECISION(B6)`** |
| 错误码 | 40101/40102/40301/40401/42901/50001 |

## OP-05 `listProductVersions` — GET `/products/{pbk}/versions`

| 维度 | 内容 |
|---|---|
| 认证/Scope | Bearer；`product.version.read` |
| 响应 200 | `VersionListEnvelope`→VersionItem[]（`is_current` 必填） |
| 正常 | 多版本列表；仅当前版本 `is_current=true`；分页 |
| 异常 | 404；410（撤回产品）；limit/cursor 非法→400 |
| 边界 | 版本单降序/稳定排序（候选未明示→登记）；未发布参数值不得越 scope 泄露（描述语义） |
| 规则状态 | R-VER-01 PROPOSED；R-PTG-01 PROPOSED |
| 预期/证据 | 分页与 is_current 唯一性 RUN |
| 错误码 | 40001/40101/40301/40401/41001/42901/50001 |

## OP-06 `listProductEvidence` — GET `/products/{pbk}/evidence`

| 维度 | 内容 |
|---|---|
| 认证/Scope | Bearer；`product.evidence.read` |
| 响应 200 | `EvidenceEnvelope`→Evidence（EvidenceItem：bbox×4/page_number/raw_text≤500/screenshot_reference） |
| 正常 | 证据引用列表；document_sha256 关联 |
| 异常 | 404；410；403（缺 scope 或证据未批准公开） |
| 边界 | 分页已声明 limit/cursor 但信封未绑 PageMeta（P1-10）；`screenshot_reference` 为本地相对路径非下载 URL；公开范围未裁（B8/IQ-08） |
| 规则状态 | R-EV-01 PROPOSED；R-EV-02 **BLOCKED(B8,P0-7,IQ-08)**；R-EV-03 CONFIRMED（边界） |
| 预期/证据 | Fixture 全量字段构造 RUN；**可暴露字段断言 `BLOCKED_BY_DECISION(B8)`**；分页 meta 绑定断言挂 P1-10 |
| 错误码 | 40001/40101/40301/40302(未发布产品)/40401/41001/42901/50001 |

## OP-07 `getProductCategories` — GET `/products/{pbk}/categories`

| 维度 | 内容 |
|---|---|
| 认证/Scope | Bearer；`product.category.read`；`internal_only=true` 另需 `product.publish.read`（双 scope，缺一 40301，不得静默忽略） |
| 响应 200 | `CategoryEdgesEnvelope`→CategoryEdges（单值 `taxonomy_id`：R-TAX-03 BLOCKED） |
| 正常 | 已发布产品分类边；内部读取（internal_only+双 scope）返回 internal_only=true 与当前有效边 |
| 异常 | 未发布产品→403/40302；404；越权 internal_only→403/40301 |
| 边界 | 双 scope 组合矩阵（有/无×有/无）；产品撤回→410 |
| 规则状态 | R-TAX-01 CONFIRMED；R-TAX-03 **BLOCKED(IQ-02 体系数量,P1-4)**；R-ST-06 PROPOSED；R-OA-05 PROPOSED |
| 预期/证据 | scope 2×2 矩阵 + 三态 RUN；**多体系形态断言 `BLOCKED_BY_DECISION(IQ-02/P1-4)`** |
| 错误码 | 40001/40101/40301/40302/40401/41001/42901/50001 |

## OP-08 `listTaxonomies` — GET `/taxonomies`

| 维度 | 内容 |
|---|---|
| 认证/Scope | Bearer；`product.category.read` |
| 参数 | limit/cursor/status（PUBLISHED/DEPRECATED） |
| 响应 200 | `TaxonomyListEnvelope`→Taxonomy[] |
| 正常 | 仅 PUBLISHED + 保留期 DEPRECATED 可见（DRAFT/REVIEWED 永不外露） |
| 异常 | 非法 status→400；分页边界 |
| 规则状态 | R-TAX-01 CONFIRMED；R-TAX-04 **BLOCKED(IQ-05)** |
| 预期/证据 | 可见性过滤 RUN（fixture 含 DRAFT 分类不出现） |
| 错误码 | 40001/40002/40101/40301/42901/50001 |

## OP-09 `getTaxonomy` — GET `/taxonomies/{taxonomy_id}`

| 维度 | 内容 |
|---|---|
| 认证/Scope | Bearer；`product.category.read` |
| 响应 200 | `TaxonomyEnvelope`（必填 taxonomy_id/code/name/version/status） |
| 正常 | PUBLISHED 详情；ETag/304 |
| 异常 | 404/40403；410（保留期结束，IQ-05）；403（未发布体系——候选口径 DRAFT/REVIEWED 不外露） |
| 边界 | taxonomy_id 格式 `^tax_[ULID26]$`；跨 taxonomy_id 越权读取 DRAFT |
| 规则状态 | R-TAX-03/04 BLOCKED；R-VER-02 PROPOSED |
| 预期/证据 | 200/404/410/304 RUN |
| 错误码 | 40001/40101/40301/40403/41002/42901/50001 |

## OP-10 `getTaxonomyVersion` — GET `/taxonomies/{id}/version`

| 维度 | 内容 |
|---|---|
| 认证/Scope | Bearer；`product.version.read` |
| 响应 200 | `TaxonomyVersionEnvelope`（taxonomy_version/status/etag/last_change_id） |
| 正常 | 同步前置检查；ETag→304 |
| 异常 | 404/40403 |
| 边界 | etag 与 taxonomy_version 一致性 |
| 规则状态 | R-VER-01 PROPOSED；R-TAX-04 BLOCKED |
| 预期/证据 | 版本/etag 一致 RUN |
| 错误码 | 40001/40101/40301/40403/42901/50001 |

## OP-11 `listCategories` — GET `/taxonomies/{id}/categories`

| 维度 | 内容 |
|---|---|
| 认证/Scope | Bearer；`product.category.read` |
| 参数 | mode=flat\|tree、updated_since、status、limit、cursor、If-None-Match |
| 响应 200 | `CategoryListEnvelope`→CategoryNode[] |
| 正常 | flat 分页；tree 深度 4/5000 节点内；增量 updated_since |
| 异常 | tree 超限→413/41301（回退 flat+增量）；未知过滤→40002；404/40403 |
| 边界 | 深度 4 边界（第 5 层拒绝）；5000 节点上限（fixture 缩比注入）；sort 白名单（P1-1：MD 有/OpenAPI 无 → `BLOCKED_BY_DECISION(P1-1)`） |
| 规则状态 | R-TAX-04/05/07 PROPOSED/PENDING/BLOCKED 组合；R-SRT-01 PENDING(P1-1) |
| 预期/证据 | flat/tree/413/增量 RUN；**排序断言 `BLOCKED_BY_DECISION(P1-1)`** |
| 错误码 | 40001/40002/40101/40301/40403/41301/42901/50001 |

## OP-12 `listTaxonomyChanges` — GET `/taxonomies/{id}/changes`（V1_OPTIONAL）

| 维度 | 内容 |
|---|---|
| 认证/Scope | Bearer；`product.version.read` |
| 参数 | since_version、limit、cursor |
| 响应 200 | `ChangeListEnvelope`→ChangeRecord[]（9 事件枚举） |
| 正常 | since_version 之后的变更流 |
| 异常 | 404；非法 since_version→400 |
| 边界 | 可选端点缺失容忍（消费方不得硬依赖，V1_OPTIONAL） |
| 规则状态 | R-TAX-08 PROPOSED |
| 预期/证据 | 变更流 RUN + 可选性声明断言 |
| 错误码 | 40001/40101/40301/40403/42901/50001 |

## OP-13 `getCategory` — GET `/categories/{category_id}`

| 维度 | 内容 |
|---|---|
| 认证/Scope | Bearer；`product.category.read` |
| 响应 200 | `CategoryDetailEnvelope`→CategoryDetail（allOf：CategoryNode + parent/children 覆盖——**P1-3 语义冲突**） |
| 正常 | PUBLISHED 节点；DEPRECATED（保留期内）返回 200+merged_into/split_into |
| 异常 | DRAFT/REVIEWED→403/40303；404/40402；保留期结束→410/41002（degraded_allowed=true） |
| 边界 | children 交集语义（P1-3：compact+max200 vs 完整节点 depth4/5000）——断言挂起 |
| 规则状态 | R-TAX-04 **BLOCKED(IQ-05)**；R-TAX-05/06 PENDING；P1-3 PENDING |
| 预期/证据 | 四态 RUN（200 published/200 deprecated/403/404/410）；**children 形态断言 `BLOCKED_BY_DECISION(P1-3)`**；410 窗口 `BLOCKED_BY_DECISION(IQ-05)` |
| 错误码 | 40001/40101/40301/40303/40402/41002/42901/50001 |

## OP-14 `listCategoryChildren` — GET `/categories/{id}/children`

| 维度 | 内容 |
|---|---|
| 认证/Scope | Bearer；`product.category.read` |
| 响应 200 | `CategoryListEnvelope`→CategoryNode[] |
| 正常 | 直接子节点分页 |
| 异常 | 404/40402；410（IQ-05）；403/40303 |
| 边界 | 200 响应未声明 headers（P2-2 登记） |
| 规则状态 | R-TAX-04 BLOCKED；R-PTG-01 PROPOSED |
| 预期/证据 | 分页 RUN |
| 错误码 | 40001/40101/40301/40303/40402/41002/42901/50001 |

## OP-15 `listCategoryAncestors` — GET `/categories/{id}/ancestors`（V1_OPTIONAL）

| 维度 | 内容 |
|---|---|
| 认证/Scope | Bearer；`product.category.read` |
| 响应 200 | `CategoryListEnvelope`（祖先链） |
| 正常 | 根→父有序链（可由 path_ids 推导的对齐断言） |
| 异常 | 404；410（IQ-05） |
| 边界 | 与 `path_ids` 一致性（推导等价断言） |
| 规则状态 | R-TAX-04 BLOCKED |
| 预期/证据 | 链序 RUN + path_ids 等价 |
| 错误码 | 40101/40301/40402/41002/42901/50001 |

## OP-16 `listCategoryProducts` — GET `/categories/{id}/products`（V1_OPTIONAL）

| 维度 | 内容 |
|---|---|
| 认证/Scope | Bearer；`product.category.read` |
| 响应 200 | `ProductRefListEnvelope`→ProductRef[]（仅 pbk/mpn_norm/brand_norm） |
| 正常 | 分类→产品反查分页 |
| 异常 | 404；410 |
| 边界 | 默认过滤**未裁**（DIFF-MOCK-05 OPEN：候选 A/B，与 OP-02 联动，均 BLOCKED_BY_DECISION）；IQ-16（是否需要该端点）PROPOSED |
| 规则状态 | R-TAX-06 PENDING(IQ-04)；R-ST-05 PROPOSED |
| 预期/证据 | 反查 RUN；可选性断言 |
| 错误码 | 40001/40101/40301/40402/41002/42901/50001 |

---

## 覆盖统计

- 操作：**16/16** 入矩阵（13 V1_REQUIRED + 3 V1_OPTIONAL）。
- 涉及错误码：除 40901（预留，不属任何 v1 操作）外 19/19 被 OP 引用；40901 见 `ERROR_CODE_TEST_MATRIX.md` 预留行。
- `BLOCKED_BY_DECISION` 断言登记：DIFF-CONTRACT-01（OP-02）、P1-1（OP-11）、P1-3（OP-13）、IQ-05（OP-13/14/15/16）、IQ-21（OP-01）、IQ-02/P1-4（OP-07）、B6（OP-04）、B8（OP-06）、IQ-12（OP-01）。
