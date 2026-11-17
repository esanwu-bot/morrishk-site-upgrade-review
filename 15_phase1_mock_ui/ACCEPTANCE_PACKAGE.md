# Phase 1 Mock UI 验收包

| 项 | 值 |
|---|---|
| 文档编号 | MRH-PHASE1-MOCK-ACC-001 |
| 版本 | v1.1（按独立复核 B1/B2 修订：scope 名称、错误目录跨文档测试） |
| 日期 | 2026-11-17 |
| 验收对象 | `15_phase1_mock_ui/`（Mock UI 代码基线 `0474b19`） |
| 本轮新增 | 契约候选一致性测试 19 项 + 错误目录跨文档一致性测试 10 项、Business API 契约候选稿、`14_` 签署登记与四项决策简报 |
| 结论状态 | **`PENDING_REVIEW`（待独立 Reviewer 复核；本包不自行授予 `PASS_MOCK`）** |
| 契约候选 | `12_/API_CONTRACT_CANDIDATE_v1.md` + `contract/openapi.candidate.v1.json`，SHA-256 `fdeec48ecf44439776e61245ca7b98fc94f7ce0d481a7c9aea639900f1e71023` |
| 性质 | 验收材料汇编；**不是**自验收结论、**不是**契约冻结、**不是**生产实现授权 |

> 阅读顺序：先看 §1 的非声明与 §2 的基线，再看 §3–§8 的功能证据，
> 最后按 §19 的清单独立复核。`PASS_MOCK` 只能由独立 Reviewer 在复跑后填写。

---

## 1. 结论与非声明

### 1.1 执行 Agent 申报

| 项 | 结果 |
|---|---|
| 单元/契约测试 | 71 / 71 通过（22 归一化 + 20 Mock API + 19 契约候选 + 10 错误目录跨文档） |
| 浏览器冒烟 | 9 / 9 通过（在 `0474b19` 修订后执行；本轮未改 UI 资产，未重新执行） |
| 8 视图 | 全部存在并可切换；关键交互有冒烟记录 |
| 文件哈希 | `15_`、`12_`、`14_` 三份 `SHA256SUMS.txt` 自校验通过 |
| `13_` 修改 | 无 |

### 1.2 明确不声明

| 不声明 | 说明 |
|---|---|
| `PASS_MOCK` | 本包状态为 `PENDING_REVIEW`；执行 Agent 无权自授 |
| 真实数据已验证 | 全部数据为 `DEMO_FIXTURE` |
| 生产 API 可用 | Ds Bit 无生产 Business API 实现 |
| 契约已冻结 | 契约状态为 `CANDIDATE_NOT_FROZEN` |
| 生产 OAuth2 已就绪 | 无任何凭证签发或注册 |
| 同步链路已接通 | 仅本地内存控制流模拟 |
| 浏览器兼容/无障碍通过 | 仅 Chromium 窄视口冒烟，未做专项 |

---

## 2. 验收基线与证据分级

| 项 | 值 |
|---|---|
| Mock UI 代码基线 | `0474b19`（Reviewer 已就 B1–B3 给出提交边界 PASS） |
| 本轮代码改动 | UI 资产（`assets/`、`data/`、`index.html`）**未改**；仅新增测试与文档 |
| 契约候选基线 | 本仓库 `main@3ecb54b`（编制时 HEAD） |
| 决策依据 | `14_/DECISION_REGISTER.md` §2.1–2.3（IQ-01/02/13） |
| 测试环境 | Windows 10.0.19045 x64；Node.js v24.18.0（本轮）/ v24.21.0（`0474b19` 冒烟时）；Chromium via browser-use |

> 基线说明：编制期间 Session A 在 `13_dsbit_duckdb_s3_pipeline/` 追加了 `647b4f0`、`77afeb0`，
> 仓库 HEAD 已从 `3ecb54b` 前进到 `77afeb0`。这两个提交只改 `13_`，未触碰 `12_` / `14_` / `15_`；
> 本包对 `3ecb54b` 的引用是编制基线，不是对当前 HEAD 的断言。

证据分级沿用 `15_/TEST_REPORT.md`：

- **RUN**：实际执行命令或浏览器操作。
- **STATIC**：读文件、比对字段/哈希。
- **CLAIM**：设计声明，未做生产验证。

---

## 3. 8 视图验收清单

| # | 视图（`data-view`） | 验收要点 | 执行证据 | 级别 | 结果 |
|---|---|---|---|---|---|
| 1 | 产品身份（`products`） | 8 条演示产品；选中行显示 `product_business_key`、身份字段、发布状态；计数正确 | 冒烟 #1/#2 | RUN | PASS（执行观察） |
| 2 | MPN 归一化（`normalizer`） | 边界样例 `LM–358DR` → `LM-358DR`；品牌大写；业务键随规则变化；非法输入有提示 | 冒烟 #3；归一化测试 22 项 | RUN | PASS（执行观察） |
| 3 | 身份冲突（`conflicts`） | 聚合状态 `PENDING_CONFLICT` / `CONFLICTING_IDENTITY`；`mpn_norms` / `brand_norms` / `keys` 计数正确；待确认队列按钮禁用 | 冒烟 #4/#5；B1 边界测试 3 项 | RUN | PASS（执行观察） |
| 4 | 技术参数字典（`dictionary`） | 3 条 `DEMO_FIXTURE` 参数；状态可从 `DRAFT` → `REVIEWED`；明确提示“仅内存、未写数据库” | 冒烟 #6 | RUN | PASS（执行观察） |
| 5 | 两套分类（`taxonomy`） | 技术参数树 6 节点（含参数编码）与业务导航树 4 节点（含 URL 路径）分离展示；不共享 ID | 冒烟 #7 | RUN | PASS（执行观察） |
| 6 | 平台映射预览（`mapping`） | 4 行映射；`morrishk_target=PLATFORM_PD`；`platform_model_id` 标注为内部主键 | 冒烟 #7；`TEST_REPORT` §4 | RUN + STATIC | PASS（执行观察） |
| 7 | Mock API（`api`） | 200/403/410/404/422/401/409/429/503；控制字符/空 MPN/Brand 的 400/422；合法精确搜索返回 `pbk1_e65e…` | 冒烟 #8；Mock API 测试 20 项 | RUN | PASS（执行观察） |
| 8 | 同步与重试（`sync`） | `OK → ERROR → ERROR → OK → DONE`；重试不跳页；退避 300/600ms；结束提示“无生产写入”；`REVOKED` 流可发现 1 条 | 冒烟 #9；同步测试 4 项 | RUN | PASS（执行观察） |

**说明：** 上表“PASS（执行观察）”只表示执行 Agent 在本地观察到预期行为，
不等于 Reviewer 已独立复跑，也不构成整体 `PASS_MOCK`。

---

## 4. 产品身份与冲突验收

### 4.1 已实现的规则（`MPN-NORM-v1`，仍为 `PROPOSED`）

| 规则 | 验收点 |
|---|---|
| NFKC、零宽移除、连字符统一 | `LM–358DR`（U+2013）归一为 `LM-358DR` |
| 空白折叠、大小写 | 前后空白与全角空格不改变命中；输出大写 |
| 保留 `- / _ .` | 不删除承载型号语义的符号 |
| 不剥离品牌后缀 | 品牌仅做 Unicode/空白/大小写归一 |
| 非法输入拒绝 | 非字符串、控制字符、孤立代理项 → `INVALID` |
| 缺 Brand | → `PENDING_BRAND`，不生成业务键 |
| 冲突 | 多个互斥候选或同 MPN 异 Brand → `PENDING_CONFLICT`，不自动合并 |
| 候选聚合 | 空列表 → `INVALID/NO_CANDIDATES`；重复文档 → 一个身份 |
| 业务键 | `pbk1_` + 完整 64 位小写 SHA-256，共 69 字符 |

### 4.2 键一致性与边界

- 6 组示例键与 `API_CONTRACT_EXAMPLES.md` 逐一比对一致（STATIC）。
- 长度前缀使用 UTF-8 字节长度；`("A","é") ≠ ("A","éA")`（RUN）。
- 同 MPN 异 Brand 生成两个键；同 MPN+Brand 多文档只生成一个身份（RUN）。

---

## 5. 技术参数字典与 Fixture 隔离

| 检查 | 结果 | 证据 |
|---|---|---|
| 参数字典数据均标 `DEMO_FIXTURE` | PASS | `data/mock-dictionary.json`；`TEST_REPORT` §4 |
| 参数 ID 使用演示前缀（如 `DEMO_FIXTURE_VOLTAGE`） | PASS | 冒烟 #2 |
| 编辑仅改内存，不写数据库 | PASS | 冒烟 #6 提示文案 |
| 正式 `formal_dictionary=false` / `formal_taxonomy=false` | PASS | Mock API 测试 |
| 未声称 Fixture 为 PM 真实种子 | PASS | `README` / `DELIVERY_REPORT` 边界声明 |
| 未把 Fixture 通过表述为真实数据验证 | PASS | 本包 §1.2 |

PM 真实种子尚未提交；字典**结构**已固定，**内容**未固定（IQ-02 裁定后的开放项）。

---

## 6. 详情、证据与发布状态

| 检查 | 结果 | 证据 |
|---|---|---|
| 产品详情分层显示 identity / technical / categories / documents / release | PASS | 冒烟 #2；`Product` schema 分层 |
| 证据引用含 `ev_demo_0001`、页码/bbox/原文 | PASS | 冒烟 #2；`data/mock-products.json` |
| 未发布产品返回 403 `PRODUCT_NOT_RELEASED` | PASS | Mock API 测试 |
| 已撤回产品返回 410 `PRODUCT_RELEASE_REVOKED` | PASS | Mock API 测试 |
| 未知产品返回 404 `PRODUCT_NOT_FOUND` | PASS | Mock API 测试 |
| 撤回后同步可发现（`REVOKED` 流） | PASS | 同步测试；冒烟 #9 |

> Mock 的 `visible_state` 使用 `RELEASED` / `PENDING` / `REVOKED`，是演示简化；
> 契约枚举为 `DRAFT` / `IN_REVIEW` / `RELEASED` / `WITHDRAWN`。
> 该差异已登记为契约冻结阻断 B6，**不得**据此修改契约或声称已对齐。

---

## 7. Mock 错误路径

| 场景 | Mock 结果 | 契约目标 | 一致性 |
|---|---|---|---|
| 缺 `mpn` | 400 / `INVALID_ARGUMENT` | 400 / 40001 | 一致 |
| MPN 控制字符 | 400 / `field=mpn` / `ILLEGAL_CHAR` | 400 / 40001 | 一致 |
| MPN 归一为空 | 400 / `field=mpn` / `EMPTY_MPN` | 400 / 40001 | 一致 |
| 缺 Brand | 422 / `PRODUCT_IDENTITY_INCOMPLETE` | 422 / 42201 | 一致 |
| Brand 控制字符 | 400 / `field=brand` | 400 / 40001 | 一致 |
| Brand 归一为空 | 422 / `missing=["brand"]` | 422 / 42201 | 一致 |
| 归一化冲突 | 422 / `MPN_NORMALIZATION_CONFLICT` | 422 / 42202 | 一致 |
| scope 不足 | 403 / `INSUFFICIENT_SCOPE` | 403 / 40301 | 一致 |
| 产品未发布 | 403 / `PRODUCT_NOT_RELEASED` | 403 / 40302 | 一致 |
| 已撤回 | 410 / `PRODUCT_RELEASE_REVOKED` | 410 / 41001 | 一致 |
| 不存在 | 404 / `PRODUCT_NOT_FOUND` | 404 / 40401 | 一致 |
| 限流 | 429 / `RATE_LIMITED` | 429 / 42901 | 一致 |
| 服务不可用 | 503 / `SERVICE_UNAVAILABLE` | 503 / 50301 | 一致 |
| 条件请求命中 | Mock 未实现 `304` | 304 / `NOT_MODIFIED` | **差异**（Mock 未覆盖） |

Mock 的错误包为 `{code, message, data, request_id, meta}`，与契约候选方向一致；
最终包形状仍为 `OPEN`（IQ-09）。

---

## 8. 同步、重试与恢复

| 检查 | 结果 | 说明 |
|---|---|---|
| 正常分页 | PASS | 两页各 2 条，`next_cursor` 结束后为 `null` |
| 失败重试 | PASS | 第 2 页连续失败 2 次后成功，不跳页 |
| 退避 | PASS | 测试注入 1/2ms；冒烟观察 300/600ms |
| 断点恢复 | PASS | 从最后成功游标继续，不重复写 |
| 撤回发现 | PASS | `release_state=REVOKED` 返回 1 条正确键 |
| 无生产写入 | PASS | 结束提示 `no production write performed` |

> 同步测试验证的是控制流，不是真实网络、真实限流或真实事务；生产调度仍为 `OPEN`（IQ-14）。

---

## 9. 测试与冒烟证据

### 9.1 单元/契约测试（RUN）

```bash
cd 15_phase1_mock_ui
node --test tests/mpn-normalizer.test.js tests/mock-api.test.js tests/contract-candidate.test.js tests/contract-error-catalog.test.js
```

```text
tests 71
pass 71
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 1227.6269
```

> 耗时为单次运行实测值，复跑会波动；判定只看 `pass/fail`。

明细：

| 文件 | 项数 | 覆盖 |
|---|---:|---|
| `tests/mpn-normalizer.test.js` | 22 | SHA-256、UTF-8 长度、归一化、非法输入、键格式、B1 冲突边界 |
| `tests/mock-api.test.js` | 20 | 200/403/410/404/422、B2 非法输入、分页、字典/分类、同步重试、撤回 |
| `tests/contract-candidate.test.js` | 19 | 候选状态、端点清单、scope、错误目录、键格式、文档身份隔离、阻断项 |
| `tests/contract-error-catalog.test.js` | 10 | Markdown 错误表 ↔ OpenAPI `ErrorMeta`/responses ↔ Mock 三元组；码值编码、可达性、409 保留项 |

### 9.2 浏览器冒烟（RUN，`0474b19` 修订后执行）

| # | 场景 | 结果 |
|---|---|---|
| 1 | 首屏 8 行、计数正确、控制台无消息 | PASS |
| 2 | 选中首行，详情含业务键/参数/证据 | PASS |
| 3 | 归一化边界样例 | PASS |
| 4 | 候选冲突聚合与计数 | PASS |
| 5 | 冲突队列 2 行、按钮禁用 | PASS |
| 6 | 字典内存编辑 → `REVIEWED` | PASS |
| 7 | 两套分类分离 + 映射表 | PASS |
| 8 | Mock API 非法输入与合法搜索 | PASS |
| 9 | 同步状态序列与退避 | PASS |

本轮**未重新执行**浏览器冒烟，因为 `assets/`、`data/`、`index.html` 未改动；
Reviewer 应在独立复核时重新执行，并以自己的观察为准。

### 9.3 静态检查（STATIC）

| 检查 | 结果 |
|---|---|
| `13_` 工作树无改动 | PASS |
| Fixture 标记齐全 | PASS |
| 无外部网络依赖 | PASS（代码审阅） |
| 契约候选 SHA-256 与文档一致 | PASS |
| 契约状态为 `CANDIDATE_NOT_FROZEN` | PASS |
| 错误码 Markdown ↔ OpenAPI ↔ Mock 三向一致 | PASS（`tests/contract-error-catalog.test.js` 10 项；409 为显式预留项） |
| 三份 `SHA256SUMS.txt` 自校验 | PASS |

---

## 10. 哈希证据

| 目录 | 校验命令 | 结果 |
|---|---|---|
| `12_dsbit_business_api_integration_design` | `sha256sum -c SHA256SUMS.txt` | 6/6 OK |
| `14_phase0_authority_adjudication` | `sha256sum -c SHA256SUMS.txt` | 8/8 OK |
| `15_phase1_mock_ui` | `sha256sum -c SHA256SUMS.txt` | 全文件 OK |

契约候选 OpenAPI 的独立哈希：

```text
fdeec48ecf44439776e61245ca7b98fc94f7ce0d481a7c9aea639900f1e71023  contract/openapi.candidate.v1.json
```

---

## 11. 已有书面裁定的 IQ（3 项）

> 本包不使用“已关闭”表述。按 `14_/DECISION_REGISTER.md`，`DECIDED` 仅表示书面裁定已登记，
> **不等于**已签署、**不等于**独立 Reviewer 已验收、**不等于**契约已冻结。

| IQ | 裁定摘要 | 登记 | 签署 | 验收 |
|---|---|---|---|---|
| IQ-01 | 跨系统身份改为 `MPN + Brand`；唯一键 `(mpn_norm, brand_norm)`；废弃 `doc-id` 作产品身份 | 已登记 | 待签署 | 未完成 |
| IQ-02 | 技术参数分类归 Ds Bit、业务导航分类归 Morrishk；两套 ID 不共享；PM 提供种子 | 已登记 | 待签署 | 未完成 |
| IQ-13 | 目标系统为 Morrishk 新平台业务库；旧站不作目标；自增 ID 不作跨系统身份 | 已登记 | 待签署 | 未完成 |

---

## 12. 仍为 `OPEN` 的 IQ（19 项）

来源：`14_/PHASE0_OPEN_QUESTIONS_MATRIX.md`。下表“证据状态”是调查结论，不是裁定状态；19 项均为 `OPEN`。

| IQ | 问题 | 目标阶段 | 阻断级别 | 证据状态 |
|---|---|---|---|---|
| IQ-03 | `category_id` / `category_code` 治理与生成 | Phase 1 | `BLOCKER_PHASE1` | `PROPOSED` |
| IQ-04 | 同一产品跨体系多个主分类 | Phase 1 | `BLOCKER_PHASE1` | `PARTIALLY_CONFIRMED` |
| IQ-05 | 分类保留期与 410 时机 | Phase 0 | `BLOCKER_PHASE0` | `CONFIRMED`（现状无生命周期） |
| IQ-06 | 发布状态存储位置 | Phase 1 | `BLOCKER_PHASE1` | `NOT_FOUND` |
| IQ-07 | 内容审核与发布授权角色 | Phase 2 | `BLOCKER_PHASE2` | `NOT_FOUND` |
| IQ-08 | 证据公开范围与版权 | Phase 2 | `BLOCKER_PHASE2` | `PARTIALLY_CONFIRMED` |
| IQ-09 | 错误响应包最终形状 | Phase 0 | `BLOCKER_PHASE0` | `CONFIRMED` |
| IQ-10 | API 域名与环境拓扑 | Phase 4 | `BLOCKER_PHASE4` | `PARTIALLY_CONFIRMED` |
| IQ-11 | OAuth 客户端注册与轮换责任人 | Phase 4 | `BLOCKER_PHASE4` | `NOT_FOUND` |
| IQ-12 | Token TTL 与限流配额 | Phase 1 | `BLOCKER_PHASE1` | `PROPOSED` |
| IQ-14 | 同步任务调度位置 | Phase 2 | `BLOCKER_PHASE2` | `PARTIALLY_CONFIRMED` |
| IQ-15 | 新表引擎与字符集 | Phase 0 | `BLOCKER_PHASE0` | `CONFIRMED` |
| IQ-16 | 是否需要 `categories/{id}/products` | Phase 1 | `NON_BLOCKING` | `PROPOSED` |
| IQ-17 | JSON-LD 字段范围与审核 | Phase 2 | `BLOCKER_PHASE2` | `CONFIRMED` |
| IQ-18 | URL/301 变更流程与保留期 | Phase 2 | `BLOCKER_PHASE2` | `CONFIRMED` |
| IQ-19 | 同步日志保留期 | Phase 2 | `NON_BLOCKING` | `PROPOSED` |
| IQ-20 | 是否开放 MPN 模糊查找 | Phase 1 | `BLOCKER_PHASE1` | `PARTIALLY_CONFIRMED` |
| IQ-21 | 是否允许非生产凭证 | Phase 0 | `BLOCKER_PHASE0` | `CONFIRMED` |
| IQ-22 | 网络路径（公网/专线/IP 白名单） | Phase 4 | `BLOCKER_PHASE4` | `PARTIALLY_CONFIRMED` |

Phase 0 四项（IQ-05 / IQ-09 / IQ-15 / IQ-21）的决策材料见
`14_/IQ05_IQ09_IQ15_IQ21_DECISION_BRIEFS.md`；简报不改变其 `OPEN` 状态。

---

## 13. Business API 契约候选（本包引用）

| 项 | 值 |
|---|---|
| 文档 | `12_/API_CONTRACT_CANDIDATE_v1.md`（`v1.0-candidate`） |
| 机器可读稿 | `12_/contract/openapi.candidate.v1.json`（OpenAPI 3.1.0） |
| SHA-256 | `fdeec48ecf44439776e61245ca7b98fc94f7ce0d481a7c9aea639900f1e71023` |
| 状态 | `CANDIDATE_NOT_FROZEN` |
| 路径 / 操作 | 16 路径 / 16 操作；其中 12 个必需唯一路径 + Token = 13 个必需操作；3 个可选操作 |
| 冻结阻断 | IQ-05、IQ-09、IQ-15、IQ-21、`MPN-NORM-v1`、`visible_state` 枚举协调、PM 字典种子、证据公开范围 |
| 生产可用 | **否** |

契约候选与 Mock 的逐项差异见 `12_/API_CONTRACT_CANDIDATE_v1.md` §10 与本包 §6/§7。

---

## 14. 业务身份与字典规则摘要

### 14.1 身份

- 唯一键 `(mpn_norm, brand_norm)`；同一 MPN 不同 Brand 为两个身份。
- `product_business_key = "pbk1_" + sha256(canonical)`，canonical 使用 UTF-8 字节长度前缀。
- `mpn_raw` / `brand_raw` / `normalizer_version` 必须保留。
- `document_id` 只用于文档定位与证据，不进入产品身份。
- `MpnNormalizer` 版本化；规则变化必须升版本，禁止各模块自行清洗。

### 14.2 字典

- 技术参数分类与字典由 Ds Bit 管理；业务导航分类由 Morrishk 管理；ID 不共享。
- 候选字段 `Package` / `Voltage` / `Operating_Temperature`；正式定义以 PM 种子为准。
- Fixture 必须标 `DEMO_FIXTURE`，不得进入正式数据，不得作为 PM 种子。
- 字典结构（字段名/类型）可作为契约候选；字典内容（code/定义/单位）未冻结。

---

## 15. 端点、Schema 与错误码摘要

| 类别 | 内容 |
|---|---|
| 产品端点 | `/products/search`、`/products/{pbk}`、`/status`、`/versions`、`/evidence`、`/categories` |
| 分类端点 | `/taxonomies`、`/taxonomies/{id}`、`/version`、`/categories`、`/categories/{id}`、`/children` |
| 可选端点 | `/taxonomies/{id}/changes`、`/categories/{id}/ancestors`、`/categories/{id}/products` |
| 鉴权 | `POST /oauth/token`（Client Credentials，opaque Token） |
| 主要 Schema | `Product`、`Identity`、`Technical`、`CategoryNode`、`CategoryEdge`、`Taxonomy`、`ProductStatus`、`ErrorEnvelope` |
| 错误码 | 20 个：40001/40002、40101/40102、40301/40302/40303、40401/40402/40403、40901、41001/41002、41301、42201/42202、42901、50001、50301/50302；`40901` 为预留（v1 只读端点不触发） |
| 响应包 | `{code, message, data, request_id, meta}`；错误 `meta` 含 `error_key` / `retryable` / `degraded_allowed` |
| 版本机制 | `data_version`、`etag`、`taxonomy_version`；游标分页；`If-None-Match` → 304 |

最终包形状仍受 IQ-09 约束；以上为候选，不是冻结契约。

---

## 16. Mock 与生产差异

| 维度 | Mock（本包） | 契约候选 | 生产目标 |
|---|---|---|---|
| 数据 | `DEMO_FIXTURE` | 无数据 | Ds Bit 审核/发布后的真实数据 |
| `visible_state` | `RELEASED/PENDING/REVOKED`（演示简化） | `DRAFT/IN_REVIEW/RELEASED/WITHDRAWN` | 待 B6 协调 |
| 错误包 | 统一包 | 统一包（形状 `OPEN`） | 同左 |
| Token | 不校验 | Client Credentials 候选 | 真实 opaque Token |
| 304 | 未实现 | 已定义 | 需实现 |
| 持久化 | 无 | 无 | 新平台 `pd_*`（引擎/字符集 `OPEN`） |
| 同步 | 内存事件 | 轮询 + 增量 | 生产调度（IQ-14 `OPEN`） |
| 字典内容 | Fixture | 仅结构 | PM 种子 + Ds Bit 管理 |

---

## 17. 尚未获得的批准

| 事项 | 状态 |
|---|---|
| Phase 1 Mock UI 整体验收（`PASS_MOCK`） | **未获得**（本包待复核） |
| 契约冻结（Contract Freeze） | **未获得** |
| 生产 Business API 实现/部署 | **未批准** |
| 生产 OAuth2 客户端与凭证 | **未批准** |
| 生产数据库迁移/写入 | **未批准** |
| 真实同步、发布、撤回 | **未批准** |
| DuckDB + S3 Stage A / 批量试跑 | **未批准** |
| `13_` 交叉引用修改 | **未获授权** |
| PM 技术参数字典真实种子 | **未提交** |
| IQ-01 / IQ-02 / IQ-13 签署与独立验收 | **未完成** |

---

## 18. 禁止事项执行确认

| 禁止项 | 是否发生 | 证据 |
|---|---|---|
| 生产 Business API 实现或调用 | 否 | 无网络请求；Mock 全在内存 |
| 生产 OAuth2 凭证申请/存储/使用 | 否 | 示例 Token 为占位 |
| 生产数据库迁移或写入 | 否 | 未连接数据库 |
| 真实产品/分类同步 | 否 | 仅本地事件模拟 |
| 真实发布或撤回 | 否 | 仅 Fixture 字段 |
| 真实分类树初始化 | 否 | 仅 JSON Fixture |
| 擅自确定字典定义 | 否 | 全部 `DEMO_FIXTURE` |
| 修改 Ds Bit Parser 核心 | 否 | 未触碰 `icpdf-extractor` |
| 修改 `13_` | 否 | `git status` 该目录为空 |
| 扩大授权范围 | 否 | 未做契约冻结/Stage A/批量试跑 |

---

## 19. Reviewer 独立复核清单

请逐项勾选，并只在独立复跑后给出结论：

- [ ] 确认验收基线：UI 资产与 `0474b19` 一致（`git diff 0474b19 -- 15_phase1_mock_ui/assets 15_phase1_mock_ui/data 15_phase1_mock_ui/index.html` 为空）
- [ ] 运行 `node --test tests/mpn-normalizer.test.js tests/mock-api.test.js tests/contract-candidate.test.js tests/contract-error-catalog.test.js`，核对 71/71
- [ ] 启动 `python -m http.server 8777 --bind 127.0.0.1`，按 §9.2 重跑 9 项冒烟
- [ ] 抽查 8 视图：产品身份、归一化、冲突、字典、两套分类、映射、Mock API、同步
- [ ] 确认字典与分类 Fixture 均标 `DEMO_FIXTURE`，且无正式数据写入
- [ ] 确认冲突聚合、缺 Brand、非法输入、撤回、404 的错误码与 `error_key`
- [ ] 确认同步重试不跳页，且无生产写入
- [ ] 校验 `12_`、`14_`、`15_` 三份 `SHA256SUMS.txt`
- [ ] 校验契约候选 SHA-256 与 `CANDIDATE_NOT_FROZEN` 状态
- [ ] 确认 `13_` 无改动
- [ ] 确认本包未把 `DECIDED` 写成已签署/已验收，未把 Mock 写成真实数据验证

**验收结论（由 Reviewer 填写，执行 Agent 不填）：**

```text
Phase 1 Mock UI 整体验收：PENDING / PASS_MOCK / FAIL
复核人：
复核日期：
复核基线（提交 SHA）：
未通过项：
备注：
```

> 在 Reviewer 填写并签署前，Phase 1 整体验收保持 `PENDING`；
> 契约冻结保持 `NO`；生产实现保持 `NOT APPROVED`。