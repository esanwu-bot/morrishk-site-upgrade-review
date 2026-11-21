# ERROR CODE TEST MATRIX · 20 错误码测试矩阵（计划稿）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE2-ERR-001 |
| 版本 | v0.1-draft（计划；"当前状态"列引自候选 §7.2 与 `RULE_STATUS_REGISTER.md`，未做任何新裁定） |
| 语义来源 | `12_/API_CONTRACT_CANDIDATE_v1.md` §7.2（20 码全集）+ `openapi.candidate.v1.json` ErrorMeta 枚举 |
| 包形状声明 | 错误**外层形状**受 IQ-09 约束（BLOCKED）：候选方向 = `data:null` + `meta{error_key,retryable,degraded_allowed,...}`；Mock 曾把明细放 data（DIFF-MOCK-01）。**未裁定前不得把任一承载方式写成正式行为** |
| 覆盖声明 | 20/20 全部入矩阵；不自行补全语义 |

通用字段约定（PROPOSED，随 IQ-09）：错误响应体含 `code`（稳定整数）、`message`、`request_id`、`meta.error_key`（枚举）、`meta.retryable`、`meta.degraded_allowed`，可含 `meta.field`、`meta.missing`。`data` 期望 null（候选方向）。

| # | code | HTTP | error_key | 触发条件（测试场景） | 返回字段要点 | retryable | degraded_allowed | 规则来源 | 当前状态 | 测试场景编号 |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 40001 | 400 | `INVALID_ARGUMENT` | 缺 mpn；mpn/brand 控制字符；mpn 归一后为空；非法分页参数；pbk 格式非法 | meta.field（mpn/brand 等）、meta.reason | 否 | 否 | 候选 §7.2；R-ID-08 | PROPOSED | E-40001-01..05 |
| 2 | 40002 | 400 | `UNKNOWN_FILTER` | 未知查询参数（如 `?foo=1`）——不静默忽略 | — | 否 | 否 | 候选 §7.6；Mock 缺失=DIFF-MOCK-10 | PROPOSED | E-40002-01 |
| 3 | 40101 | 401 | `INVALID_TOKEN` | 无 Token / Token 无效 / 签名错 | RFC 形状外仍走业务包（业务端点） | 刷新后一次 | 是 | 候选 §7.2 | PROPOSED | SEC-01/SEC-02 |
| 4 | 40102 | 401 | `TOKEN_EXPIRED` | Token 过期（TTL 900s，IQ-12 PROPOSED） | 同上 | 刷新后一次 | 是 | 候选 §7.2；R-OA-02 | PROPOSED | SEC-03 |
| 5 | 40301 | 403 | `INSUFFICIENT_SCOPE` | 缺必需 scope；internal_only 缺双 scope；PENDING_*/REVOKED 过滤缺 publish scope | — | 否 | 是 | 候选 §8 规则；R-OA-05 | PROPOSED | SEC-06/SEC-07/SEC-08 |
| 6 | 40302 | 403 | `PRODUCT_NOT_RELEASED` | 产品存在但未发布且无 publish scope（**不返回 404**） | data 可含 pbk（承载位置挂 IQ-09） | 否 | 是 | 候选 §6.4/§7.2 | PROPOSED | SEC-09 |
| 7 | 40303 | 403 | `CATEGORY_NOT_PUBLISHED` | 分类 DRAFT/REVIEWED 被访问 | — | 否 | 是 | 候选 §6.4 | PROPOSED | E-40303-01 |
| 8 | 40401 | 404 | `PRODUCT_NOT_FOUND` | pbk 不存在 | — | 否 | 视情况 | 候选 §7.2 | PROPOSED | E-40401-01 |
| 9 | 40402 | 404 | `CATEGORY_NOT_FOUND` | category_id 不存在 | — | 否 | 视情况 | 候选 §7.2 | PROPOSED | E-40402-01 |
| 10 | 40403 | 404 | `TAXONOMY_NOT_FOUND` | taxonomy_id 不存在 | — | 否 | 视情况 | 候选 §7.2 | PROPOSED | E-40403-01 |
| 11 | 40901 | 409 | `VERSION_CONFLICT` | **预留码**：v1 全只读、无 If-Match 写语义，任何操作不触发 | — | 是（重新拉取） | 是 | 候选 §7.2 显式预留 | PROPOSED（预留） | E-40901-RESERVED：断言 v1 无操作返回 40901（负向测试） |
| 12 | 41001 | 410 | `PRODUCT_RELEASE_REVOKED` | 产品曾发布后被撤回 | release_id/version、revoked_at（承载位置挂 IQ-09/DIFF-MOCK-13） | **否**（终态） | **否** | 候选 §6.4/§9.4；R-ST-06 | PROPOSED | E-41001-01；消费方必须识别为终止态 |
| 13 | 41002 | 410 | `CATEGORY_RETIRED` | 分类保留期结束（**窗口数值未裁 IQ-05**） | merged_into/split_into | 否 | 是 | 候选 §6.4；R-TAX-04 | **BLOCKED(IQ-05)** | E-41002-01（fixture 驱动，窗口不实现） |
| 14 | 41301 | 413 | `TREE_TOO_LARGE` | mode=tree 超 depth4/5000 节点 | — | 否（改 flat） | 是 | 候选 §7.5；R-TAX-07 | PROPOSED | E-41301-01 |
| 15 | 42201 | 422 | `PRODUCT_IDENTITY_INCOMPLETE` | 精确查找缺 brand（missing=["brand"]）；brand 归一为空 | meta.missing | 否 | 是 | 候选 §4.5/§7.2；DIFF-CONTRACT-03 登记示例冲突 | PROPOSED | E-42201-01/02（按 MD+候选断言 422；示例更正待维护人） |
| 16 | 42202 | 422 | `MPN_NORMALIZATION_CONFLICT` | 归一结果落入多个既有身份 / 互斥候选 | conflict_source | 否 | 是 | 候选 §4.1/§7.2 | PROPOSED（受 B5） | E-42202-01 |
| 17 | 42901 | 429 | `RATE_LIMITED` | 超限（60rpm/树10/搜索30——数值 PROPOSED 挂 IQ-12） | Retry-After 头 | 是 | 是 | 候选 §7.9；R-TRC-01 | PROPOSED | SEC-11（数值断言挂 IQ-12） |
| 18 | 50001 | 500 | `INTERNAL_ERROR` | 服务端内部错误（隔离环境以注入故障模拟） | — | 是 | 是 | 候选 §7.2 | PROPOSED | E-50001-01（故障注入） |
| 19 | 50301 | 503 | `SERVICE_UNAVAILABLE` | 服务不可用（模拟） | — | 是 | 是 | 候选 §7.2 | PROPOSED | E-50301-01 |
| 20 | 50302 | 503 | `DATA_NOT_READY` | 数据未就绪（模拟：字典/流水线数据未加载） | — | 是 | 是 | 候选 §7.2 | PROPOSED | E-50302-01 |

## 交叉一致性断言（获批实施后作为契约测试）

1. 每个非预留 error_key 至少被一个操作的 `responses` 声明（40901 除外——显式预留）。
2. error_key 枚举 = ErrorMeta 20 项，与候选 §7.2 表逐行一致（延续 `15_/tests/contract-error-catalog.test.js` 口径，独立重实现）。
3. retryable/degraded_allowed 取值与上表逐行一致。
4. OAuth 端点 400/401 使用 RFC 形状（`OAuthError`），**不进入** 20 码目录；429/500 复用业务包（P1-6 双轨登记，统一方案待维护人）。

## 未裁定语义的处理纪律

- `41002` 的保留期数值、`42901` 的配额数值、`40102` 的 TTL：**不实现具体数值**，测试以注入/fixture 驱动并标注 `BLOCKED_BY_DECISION(IQ-05/IQ-12)`。
- 错误明细承载（data vs meta）：按候选方向实现断言 + 登记双分支，**不**宣称已定（IQ-09）。
