# TEST REPORT · Phase 1 Mock UI

| 项 | 值 |
|---|---|
| 日期 | 2026-11-17 |
| 环境 | Windows 10.0.19045 x64；Node.js v24.21.0；Python 3（仅静态文件服务器）；浏览器经 browser-use 驱动 |
| 被测对象 | `15_phase1_mock_ui/` |
| 结论 | 单元/契约测试 73/73 通过；浏览器冒烟 9 项全部通过；**未执行**任何生产接口、数据库或凭证操作 |
| 修订 | v1.5：按 Reviewer 复测意见澄清映射行数口径（分类映射表 4 行 / 平台映射预览 6 行），无测试与 UI 变更；v1.4：补逐操作响应 `$ref` 断言与 OAuth RFC 错误隔离断言（合计 73），并修正 §7 复现命令；v1.3：按 Reviewer B1 修正 scope 名称、按 B2 新增错误目录跨文档一致性测试 10 项（合计 71）；v1.2 新增契约候选一致性测试 19 项（合计 61）；v1.1 B1/B2 修订后重跑（新增 3 项候选冲突用例 + 4 项搜索非法输入用例）；本节结论由执行 Agent 运行得出，Reviewer 未独立复跑 |

---

## 1. 证据分级

本报告严格区分三类结论：

- **实际运行（RUN）**：本次真实执行命令或浏览器操作得到的输出。
- **静态检查（STATIC）**：读取文件、比对字段/哈希，不运行行为。
- **设计声明（CLAIM）**：来自 `12_` / `14_` 的设计约束，本次未做生产验证。

---

## 2. 单元测试（RUN）

命令：

```bash
cd 15_phase1_mock_ui
node --test tests/mpn-normalizer.test.js tests/mock-api.test.js tests/contract-candidate.test.js tests/contract-error-catalog.test.js
```

实际结果：

```text
tests 73
pass 73
fail 0
cancelled 0
skipped 0
todo 0
duration_ms ≈1.1e3（单次运行，随机器波动）
```

> 耗时为单次运行记录值，复跑会波动；判定只看 `pass/fail`。

### 2.1 归一化与业务键（22 项）

| 用例 | 断言 | 结果 |
|---|---|---|
| SHA-256 FIPS 向量 | `abc` / 空串 / 标准长串 | PASS |
| SHA-256 对照 `node:crypto` | 含中文、é、1000 字符 | PASS |
| `utf8Length` | ASCII/2/3/4 字节 | PASS |
| trim + 大写 | `  lm358dr  ` → `LM358DR` | PASS |
| 内部空白折叠 | 双空格、全角空格、NBSP+TAB → 单空格 | PASS |
| NFKC / 零宽 / 连字符 | 全角、U+200B/U+FEFF、U+2013/U+2212/U+FF0D | PASS |
| 连接符与后缀 | `/ _ . -` 保留；不剥离品牌后缀 | PASS |
| 非法输入 | 非字符串、C0 控制符、孤立代理项 | PASS |
| 业务键对照契约示例 | 6 组 MPN+Brand 全部一致 | PASS |
| 键格式 | 长 69、`pbk1_` + 64 位小写 hex、不截断 | PASS |
| 确定性与品牌区分 | 同输入同键；异 Brand 异键 | PASS |
| 字节长度定界 | `("A","é") ≠ ("A","éA")`，并与手工 canonical 一致 | PASS |
| 完整身份 | 保留 raw、生成键、版本号 | PASS |
| 缺 Brand | `null/undefined/""/"   "` → `PENDING_BRAND` | PASS |
| 空/非法 MPN | `EMPTY_MPN` / `INVALID_MPN`，无键 | PASS |
| 等价写法合并 | 大小写/零宽/全角空格 → 同一键 | PASS |
| 同 MPN 异 Brand | 两个独立身份 | PASS |
| 候选聚合 | 重复文档 → 1 个身份 | PASS |
| 候选冲突 | `LM358DR` vs `LM358D` → `PENDING_CONFLICT` | PASS |
| 空候选列表（B1） | `[]` → `INVALID` / `NO_CANDIDATES`，不返回 `CONFIRMED` | PASS |
| 缺 Brand 候选参与冲突判定（B1） | `LM358DR+Brand` 与 `LM358D+null` → `PENDING_CONFLICT`，`mpn_norms` 长度 2 | PASS |
| 同 MPN 异 Brand 冲突（B1） | `LM358DR` × 两个 Brand → `PENDING_CONFLICT`，`brand_norms`/`keys` 各 2 | PASS |
| 状态传播 | `PENDING_BRAND` / `INVALID` | PASS |

### 2.2 Mock API 与同步（20 项）

| 用例 | 断言 | 结果 |
|---|---|---|
| 已发布产品 | 200、`code=0`、`fixture=DEMO_FIXTURE`、身份字段 | PASS |
| 未发布 | 403 / 40302 / `PRODUCT_NOT_RELEASED` | PASS |
| 已撤回 | 410 / 41001 / `PRODUCT_RELEASE_REVOKED` | PASS |
| 未知产品 | 404 / 40401 | PASS |
| 缺 Brand 预览 | 422 / 42201 / `PENDING_BRAND` | PASS |
| 归一化冲突 | 422 / 42202 / `PENDING_CONFLICT` | PASS |
| 通用错误 | 401/409/429/503 与 `error_key` | PASS |
| 搜索缺 mpn | 400 / `INVALID_ARGUMENT` | PASS |
| 搜索缺 brand | 422 / 42201 | PASS |
| 搜索 MPN 含非法控制字符（B2） | 400 / 40001 / `field=mpn` / `reason=ILLEGAL_CHAR`，`data=null` | PASS |
| 搜索 MPN 归一后为空（B2） | 400 / 40001 / `field=mpn` / `reason=EMPTY_MPN`，`data=null` | PASS |
| 搜索 Brand 含非法控制字符（B2） | 400 / 40001 / `field=brand` / `reason=ILLEGAL_CHAR`，`data=null` | PASS |
| 搜索 Brand 归一后为空（B2） | 422 / 42201 / `PENDING_BRAND` / `missing=["brand"]` | PASS |
| 搜索归一化 | 前后空白/全角空格仍精确命中，`total=1` | PASS |
| 分页游标 | `demo_1` 偏移后为空页、`next_cursor=null` | PASS |
| 字典/分类获取 | `formal_dictionary=false` / `formal_taxonomy=false` | PASS |
| 同步重试 | 事件序列 `OK(1) → ERROR(2,1) → ERROR(2,2) → OK(2,3) → DONE`，重试不跳页，退避 1/2ms | PASS |
| 撤回发现 | `REVOKED` 返回 1 条且键正确 | PASS |
| 正常分页 | 两页各 2 条，`demo_2` 后结束 | PASS |
| 请求 ID | 连续递增、不复用 | PASS |

> 同步测试使用 `delayMs=1` 注入等待，验证的是控制流，不是真实网络退避。

### 2.3 契约候选一致性（19 项）

被测对象：`12_dsbit_business_api_integration_design/contract/openapi.candidate.v1.json`（只读）。

| 用例 | 断言 | 结果 |
|---|---|---|
| 候选状态 | OpenAPI 3.1.0；`x-contract-status=CANDIDATE_NOT_FROZEN`；描述含 "NOT frozen" | PASS |
| 端点清单 | 13 个 `V1_REQUIRED` 操作与 3 个 `V1_OPTIONAL` 操作，集合完全一致 | PASS |
| 只读性 | 除 `POST /oauth/token` 外全部为 GET | PASS |
| 操作完整性 | `operationId` 唯一且每个操作都有 responses | PASS |
| 安全声明 | 除 Token 外每个操作都声明 `oauth2`，Token 的 `security=[]` | PASS |
| Scope 集合 | 恰好 5 个：`product.read` / `product.category.read` / `product.evidence.read` / `product.version.read` / `product.publish.read`（名称逐字取自 OpenAPI `securitySchemes.oauth2.flows.clientCredentials.scopes`） | PASS |
| 响应包 | `EnvelopeBase.required` 为 `code/message/data/request_id/meta`；错误包为两段 `allOf` | PASS |
| 错误 meta | 必须含 `error_key` / `retryable` / `degraded_allowed` | PASS |
| 错误目录 | 20 个稳定 `error_key`，无重复，含 40302/41001/41002/42201/42202 | PASS |
| 业务键格式 | `^pbk1_[0-9a-f]{64}$`；拒绝 `doc_`、`prd_`、63 位 hex | PASS |
| 文档身份隔离 | 产品路由与 `Identity` schema 均不含 `document_id` | PASS |
| DTO 分层 | `Product.required` 含 identity/technical/categories/documents/release/data_version | PASS |
| 发布闸门 | `gates` 必含 pipeline/content/release；`visible_state` 含 RELEASED/WITHDRAWN | PASS |
| 冻结阻断 | 登记 IQ-05/09/15/21、MPN-NORM-v1、VISIBLE-STATE-RECONCILIATION | PASS |
| 阻断状态 | 所有阻断项状态只能是 `OPEN` 或 `PROPOSED`，不得写成已裁定 | PASS |
| Server 占位 | 仅 `.invalid` 或 `127.0.0.1`，无生产域名 | PASS |
| Token 形状 | 必填 `access_token/token_type/expires_in/scope`；`expires_in=900` | PASS |
| 搜索语义 | 含 mpn/brand/mpn_match/release_state；release_state 为 RELEASED/REVOKED/PENDING | PASS |
| 分类边门禁 | `internal_only` 存在；特殊门禁说明含 `INSUFFICIENT_SCOPE` | PASS |

> 契约测试只验证**候选稿内部一致性**与“未冻结”声明，不验证生产 API 行为，也不构成契约冻结。

### 2.4 错误目录跨文档一致性（12 项，Reviewer B2）

被测对象（三者只读）：`12_/API_CONTRACT_CANDIDATE_v1.md` §7.2 表格、`12_/contract/openapi.candidate.v1.json`、
`15_/assets/mock-api.js`。

| 用例 | 断言 | 结果 |
|---|---|---|
| 表格解析 | §7.2 解析出恰好 20 条错误行 + `OK` / `NOT_MODIFIED` 两条成功行 | PASS |
| 唯一性 | 20 个整数 `code` 与 20 个 `error_key` 各自无重复 | PASS |
| 码值编码 | 每条 `code` 满足 `floor(code/100) === HTTP`（如 40302 → 403） | PASS |
| 键集合 | Markdown 的 20 个 `error_key` 与 OpenAPI `ErrorMeta.enum` 集合完全相等（双向） | PASS |
| 状态映射 | 11 个 HTTP 状态各对应一个 `components.responses`，其 schema `$ref` 均为 `ErrorEnvelope` | PASS |
| 组件描述 | 每个响应组件描述里列出的键，与该状态在表格中的键集合完全相等 | PASS |
| 可达性 | 除保留项外，每条错误都被至少一个操作 `responses` 声明 | PASS |
| 保留项显式化 | 未被任何操作声明的状态恰好是 `{409}`，且 §7.2 明写 `409 / 40901 VERSION_CONFLICT` 不触发 | PASS |
| 撤回语义 | `41001 PRODUCT_RELEASE_REVOKED` 为 410、不可重试、`degraded_allowed=否`，组件描述含禁止缓存展示 | PASS |
| 逐操作 `$ref` | 15 个业务操作当前共 95 处错误状态声明，`$ref` 全部指向 `#/components/responses/{Catalog 组件}`，无张冠李戴（如把 400 指到 Forbidden）；测试同时要求检查数 ≥ 50，避免空跑 | PASS |
| OAuth 隔离 | Token 端点 400/401 为内联 `OAuthError`，429/500 复用组件，且不出现 403/404/409/410/413/422/503 | PASS |
| Mock 对齐 | `mock-api.js` 中 10 组错误三元组 `(HTTP, code, key)` 全部与契约表逐项一致，无越界码 | PASS |

> 该组测试只证明**候选稿 Markdown、OpenAPI 与 Mock 三者内部一致**；不证明生产实现行为，也不改变
> `CANDIDATE_NOT_FROZEN` 状态。`409` 是唯一预留状态，已在 §7.2 与测试中显式标注，不是静默豁免。

---

## 3. 浏览器冒烟（RUN）

启动：

```bash
python -m http.server 8777 --bind 127.0.0.1
```

访问 `http://127.0.0.1:8777/index.html`（browser-use 驱动）。

| # | 操作 | 实际观察 | 结果 |
|---|---|---|---|
| 1 | 首屏加载 | 产品表 8 行，计数 `8 / 8 条`，控制台无消息 | PASS |
| 2 | 选择首行 | 详情含 `pbk1_e65e…`、`DEMO_FIXTURE_VOLTAGE`、`ev_demo_0001` | PASS |
| 3 | 归一化边界样例 | `LM–358DR` → `LM-358DR`；品牌 → `EXAMPLE SEMICONDUCTOR`；键随规则改变 | PASS |
| 4 | 候选冲突（B1） | 聚合 `PENDING_CONFLICT` / `CONFLICTING_IDENTITY`；`mpn_norms` 2 项、`brand_norms` 1 项、`keys` 2 项 | PASS |
| 5 | 冲突队列 | 2 行（缺 Brand / 互斥 MPN），按钮禁用 | PASS |
| 6 | 字典编辑 | 选中 `DEMO_FIXTURE_PACKAGE`，→ `REVIEWED`，表格状态列即时变为 `REVIEWED`，提示「已在内存中更新…未写入任何数据库」 | PASS |
| 7 | 两套分类 | 技术树 6 节点（含 Analog、参数编码）；导航树 4 节点（含 Amplifiers、URL 路径）；分类映射表 4 行且 `morrishk_target` 均为 `PLATFORM_PD`；同屏平台映射预览 6 行（全部 `CONFIRMED`：`APPROVED` 3 / `PROPOSED` 2 / `STALE` 1） | PASS |
| 8 | Mock API（B2） | 控制字符 MPN → 400 `ILLEGAL_CHAR`；全空格 MPN → 400 `EMPTY_MPN`；全空格 Brand → 422 `PRODUCT_IDENTITY_INCOMPLETE`；合法输入 → `code=0`、`total=1`、返回 `pbk1_e65e…` | PASS |
| 9 | 同步演示 | 状态序列 `OK, ERROR, ERROR, OK, DONE`；错误含 503 与退避 300/600ms；结束提示 `no production write performed` | PASS |

> 冒烟只覆盖桌面 Chromium 窄视口；未做多浏览器、移动端或无障碍专项。

---

## 4. 静态检查（STATIC）

| 检查 | 方法 | 结果 |
|---|---|---|
| 示例键一致性 | 单元测试比对 `API_CONTRACT_EXAMPLES.md` 中 6 个键 | 一致 |
| 脚本语法 | 页面加载后无控制台错误；Node `require` 成功 | 通过 |
| Fixture 标记 | `dataset` / `source` / `meta.fixture` 均为 `DEMO_FIXTURE` | 通过 |
| 无网络依赖 | 页面仅 `fetch` 本地 `data/*.json`；Mock API 全部在内存 | 通过（代码审阅） |
| 13_ 产品身份口径 | 只读 grep（基线 `8c45f63`，当前 HEAD `5fa7c5c` 同）：`product_id = prod-<document_id>` 被描述为**单文档内**成立，跨文档归并列 `OPEN_DECISIONS.md:134` **OD-11** `OPEN` | 未发现与 IQ-01 冲突的跨系统身份定义；OD-11 属 Ds Bit 内部产品族/版本/文档归并，不在 IQ-01 解决范围 |
| 13_ 未被修改 | `git status --porcelain -- 13_dsbit_duckdb_s3_pipeline` 为空 | 通过 |
| 契约候选哈希 | `sha256sum 12_/contract/openapi.candidate.v1.json` = `fdeec48e…e71023`，与候选文档一致 | 通过 |
| 契约未冻结 | OpenAPI `x-contract-status` 与文档状态均为 `CANDIDATE_NOT_FROZEN` | 通过 |

---

## 5. 设计声明（CLAIM，未验证）

以下内容来自设计文档，本次**没有**生产验证，不得写成 PASS：

1. 生产 Business API 可用性、限流、鉴权行为；
2. `pd_model` 唯一约束与生成列改造后的实际表现；
3. OAuth2 Token 生命周期与 scope；
4. 真实 Ds Bit 解析输出与证据模型；
5. PM 真实分类种子的字段与单位；
6. 契约冻结后的最终错误码与分页形态。

---

## 6. 未执行项

- 未调用 Ds Bit / Morrishk 任何生产接口；
- 未申请、存储或使用任何 OAuth2 凭证；
- 未连接、迁移或写入任何数据库；
- 未执行真实同步、发布或撤回；
- 未初始化生产分类树；
- 未运行 DuckDB + S3 流水线。

---

## 7. 复现命令

```bash
# 单元测试
cd 15_phase1_mock_ui
node --test tests/mpn-normalizer.test.js tests/mock-api.test.js tests/contract-candidate.test.js tests/contract-error-catalog.test.js

# 浏览器
python -m http.server 8777 --bind 127.0.0.1
# 打开 http://127.0.0.1:8777/index.html

# 校验交付文件
sha256sum -c SHA256SUMS.txt
```
