# DIFF CHECK REPORT · Mock ↔ 契约候选 ↔ 主设计文档 三方差异核对

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-DIFF-001 |
| 版本 | v1.0 |
| 日期 | 2026-11-21 |
| 执行者 | Session B 执行 Agent |
| 分支 | `sessionb/phase1-contract-closure`（基于 `778d4d3` ≡ `main@22259b6` 四目录内容） |
| 性质 | 只读差异核对 + 差异登记；**不修改** `12_`/`14_`/`15_`/`16_` 任何文件，不修改契约候选 |
| 核对对象 | ①`15_phase1_mock_ui/`（assets + data，SHA256SUMS 16/16 OK 基线）②`12_/contract/openapi.candidate.v1.json`（SHA-256 `fdeec48e…1023`）③`12_/API_CONTRACT_CANDIDATE_v1.md`（§4–§10）④`12_/API_CONTRACT_EXAMPLES.md`（EX-17 等）⑤`12_/Ds Bit ↔ Morrishk Business API Integration Design v1.md`（§6.2/6.4/9 等） |
| 判定基线 | `FREEZE_READINESS_REVIEW.md` v1.1（P0/P1/P2 编号沿用）；R1–R4 为 **HANDOVER-CONFIRMED**（交接确认），仓库内无批准记录 |
| 状态词汇 | 每条差异标注 `[CONFIRMED]`（已核实的事实差异）/ `[PROPOSED]`（处置建议待确认）/ `[PENDING]`（待维护人/决策人裁定）/ `[BLOCKED]`（被未决 IQ/B 阻断，不得自行处置） |

> 阅读规则：本报告只**登记**差异与处置建议。凡涉及契约语义取舍（尤其 P1-1/2/3/6、DIFF-CONTRACT-01/03），
> 处置权在设计文档维护人与 Reviewer；执行 Agent 不得据此修改 `12_` 或宣称已对齐。
> 编号规则：`DIFF-CONTRACT-xx` = 契约候选内部或候选↔主文档差异；`DIFF-MOCK-xx` = Mock ↔ 契约差异；
> 已在 Freeze 报告登记的差异沿用其 P1/P2 编号，不另起新号。

---

## 1. 核对方法与覆盖范围

### 1.1 实际读取（全文）

- `15_/assets/mock-api.js`（471 行，全部端点模拟逻辑）
- `15_/assets/mpn-normalizer.js`（253 行，MPN-NORM-v1 参考实现 + 纯 JS SHA-256）
- `15_/data/mock-products.json`（440 行，8 条记录）
- `15_/data/mock-dictionary.json`（51 行，3 条 DEMO_FIXTURE 参数）
- `15_/data/mock-taxonomies.json`（155 行，技术树 6 节点 + 导航树 4 节点 + 4 行映射）
- `12_/contract/openapi.candidate.v1.json`（1,498 行全文，16 paths / 16 ops / 45 schemas）
- `12_/API_CONTRACT_CANDIDATE_v1.md`（524 行全文，此前轮已读）
- `12_/API_CONTRACT_EXAMPLES.md` EX-17/17b/17c（搜索与增量示例段）
- `12_/Ds Bit ↔ ... Design v1.md` §6.2、§6.2.1、§6.4、§6.5（本轮精读段）

### 1.2 比对维度

端点覆盖、请求参数、响应包形状、错误目录、身份字段与状态机、分页、版本/ETag、OAuth2、状态枚举、数据 ID 模式、证据字段。

---

## 2. 差异总表

### 2.1 契约候选内部 / 候选 ↔ 主文档差异（DIFF-CONTRACT）

| 编号 | 差异 | 证据 | 状态 | 处置建议 | 关联 |
|---|---|---|---|---|---|
| **DIFF-CONTRACT-01** | **搜索返回条目形状自相矛盾**：OpenAPI `ProductListEnvelope.data.items` = **`Product[]`**（完整 DTO：必含 `technical`/`categories`/`documents`/`release`/`data_version`，且 `Product` 无 `visible_state`/`content_version`）；而 `API_CONTRACT_EXAMPLES.md` EX-17/17b 的搜索条目是**扁平身份行**（`product_business_key/identity_state/mpn_raw/mpn_norm/brand_raw/brand_norm/normalizer_version/package/visible_state/content_version/updated_at`）；MD §6.4 只定义参数、未定义条目形状 | `openapi.candidate.v1.json:1307-1325`（items→Product）；`:1041-1055`（Product 必填、无 visible_state）；`API_CONTRACT_EXAMPLES.md:1101-1140`（EX-17 扁平行）；MD §6.4（`:887-903`） | `[PENDING]` | 由设计文档维护人裁定 v1 搜索条目形状（完整 Product 或扁平行或独立 SearchItem schema），写入候选；**执行 Agent 不改契约** | P1-9（visible_state 分工）、R-PRD-01/02 |
| **DIFF-CONTRACT-02** | `FREEZE_READINESS_REVIEW.md` 状态仍为 `REVISED_AWAITING_REVIEW`，R1–R4 通过仅存在于交接文书 | `FREEZE_READINESS_REVIEW.md:8`；`git log cf150a3..main -- 16_` 为空 | `[CONFIRMED]`（事实） | 按 v1.2 恢复报告 §6 双层次口径引用；批准记录待 Reviewer 落库 | — |
| **DIFF-CONTRACT-03** | **缺 `brand` 的错误语义三处不一致**：MD §6.4 与契约候选 §4.5 均为 **`422 PRODUCT_IDENTITY_INCOMPLETE`（missing=["brand"]）**；EX-17 说明文字写「缺少 `brand` 返回 `400 INVALID_ARGUMENT`」。Mock 实现为 422（与 MD/候选一致，与示例冲突） | MD `:889-891`（§6.4 参数表「否则 422」）；`API_CONTRACT_CANDIDATE_v1.md:147`（§4.5）；`API_CONTRACT_EXAMPLES.md:1141-1143`（「400 INVALID_ARGUMENT」说明）；`mock-api.js:217-219`（422） | `[PENDING]` | 示例文档说明文字待维护人更正为 422；Mock 行为与 MD/候选一致，**不视为 Mock 缺陷** | R-ID-09 |
| **DIFF-CONTRACT-04** | `sort` 白名单仅存在于 MD §7.6，OpenAPI 两个端点无 `sort` 参数 | `FREEZE_READINESS_REVIEW.md:220`（P1-1） | `[PENDING]` | 沿用 P1-1 关闭条件：补参数或书面声明 v1 不支持排序 | P1-1 |
| **DIFF-CONTRACT-05** | `X-Request-Id` 回显语义与值域歧义（请求头未声明；体 `request_id` 强制 `req_+ULID26`） | `FREEZE_READINESS_REVIEW.md:221`（P1-2） | `[PENDING]` | 沿用 P1-2 关闭条件 | P1-2 |
| **DIFF-CONTRACT-06** | `CategoryDetail.children` 交集语义冲突（compact 引用 + max200 vs 继承完整节点 + depth4/5000） | `FREEZE_READINESS_REVIEW.md:222`（P1-3）；`openapi.candidate.v1.json:1212-1232` | `[PENDING]` | 沿用 P1-3 关闭条件：显式覆盖或拆分 schema | P1-3 |
| **DIFF-CONTRACT-07** | Token 端点错误体双轨（400/401=OAuthError；429/500=业务 ErrorEnvelope） | `FREEZE_READINESS_REVIEW.md:225`（P1-6）；`openapi.candidate.v1.json:116-133` | `[PENDING]` | 沿用 P1-6：统一或在契约中声明「仅 400/401 为 RFC 形状」 | P1-6 |
| **DIFF-CONTRACT-08** | `x-open-blockers` 机器清单缺 B7/B8（仅列 IQ-05/09/15/21 + MPN-NORM-v1 + VISIBLE-STATE-RECONCILIATION 六项） | `openapi.candidate.v1.json:30-67`；`API_CONTRACT_CANDIDATE_v1.md:440-447`（§11.2 含 B7/B8）；`FREEZE_READINESS_REVIEW.md:224`（P1-5） | `[PENDING]` | 沿用 P1-5：补齐机器清单或书面说明 | P1-5；本次 registry（§4）已把 B7/B8 纳入机器可读登记（不改动候选本体） |
| **DIFF-CONTRACT-09** | `expires_in` 固化 `const 900`，而 IQ-12（TTL/配额）为 PROPOSED | `openapi.candidate.v1.json:947`；`FREEZE_READINESS_REVIEW.md:227`（P1-8） | `[PENDING]` | 沿用 P1-8 | P1-8 |
| **DIFF-CONTRACT-10** | 撤销机制未选择（RFC 7009 vs 管理端禁用），机器契约无撤销端点 | `FREEZE_READINESS_REVIEW.md:226`（P1-7） | `[PENDING]` | 沿用 P1-7；**不得**表述为「遗漏必需端点」 | P1-7 |
| **DIFF-CONTRACT-11** | `EvidenceEnvelope` 未绑定 `PageMeta`，而 `/evidence` 已声明 `limit`/`cursor`（P1-10，cf150a3 补正后口径） | `FREEZE_READINESS_REVIEW.md:229`（P1-10）；`openapi.candidate.v1.json:273-303,1376-1387` | `[PENDING]` | 沿用 P1-10：明确证据是否分页并统一 meta 绑定 | P1-10 |
| **DIFF-CONTRACT-12** | P2 级记录项 8 条（全局 security 双 scope 不生效、children 无 headers、Gate.state 自由串、PUBLISHED/is_active 重叠、错误组件无限流头、token 无 503、PageMeta 冲突时序、x-mock-baseline.commit=0474b19 与 PASS_MOCK 范围差） | `FREEZE_READINESS_REVIEW.md:233-242`（P2-1…P2-8） | `[CONFIRMED]`（登记事实） | 冻结记录中一并说明 | P2-1…8 |

### 2.2 Mock ↔ 契约候选差异（DIFF-MOCK）

| 编号 | 差异 | 证据 | 状态 | 处置建议 | 关联 |
|---|---|---|---|---|---|
| **DIFF-MOCK-01** | **错误明细放在 `data`**：Mock 的 42201/42202/40302/41001 响应在 `data` 放身份明细/撤回信息（非 null），而候选 `ErrorEnvelope` 要求错误时 `data: {type:"null"}`、明细在 `meta`（`field`/`missing` 已支持） | `mock-api.js:82-101,104-124,127-141,144-160`（data 非空）；`openapi.candidate.v1.json:892-904`（data type null）；`:905-940`（ErrorMeta.field/missing） | `[BLOCKED]`（IQ-09 未决：明细放 data 还是 meta 属包形状问题） | 登记；IQ-09 裁定时一并裁定错误明细承载位置；Mock 不改动（验收基线） | IQ-09；R-ENV-02 |
| **DIFF-MOCK-02** | search `limit` 默认 10（`Math.min(Number||10, 200)`），契约默认 50、最大 200 | `mock-api.js:198`；`openapi.candidate.v1.json:742-747` | `[PROPOSED]`（Mock 演示简化） | Mock 基线不改；隔离 Mock API（下一阶段）按契约默认 50 实现 | R-PTG-01 |
| **DIFF-MOCK-03** | 304/ETag/If-None-Match 未实现（条件请求路径缺失） | `ACCEPTANCE_PACKAGE.md:163`（已自登记）；`mock-api.js` 无 304 分支 | `[CONFIRMED]`（已知差异） | 隔离 Mock API 实现 304 | R-VER-02 |
| **DIFF-MOCK-04** | 无 Token/scope 校验：`identity_state=PENDING_*`、`release_state=REVOKED/PENDING`、`include_unreleased`、`internal_only` 在契约需 `product.publish.read` 等双 scope，Mock 全部不校验 | `mock-api.js:233-239`（过滤无 scope）；`openapi.candidate.v1.json:682,695,709-722` | `[CONFIRMED]`（已知；`ACCEPTANCE_PACKAGE.md:365`） | 隔离 Mock API 实现 scope 门禁矩阵 | R-OA-05 |
| **DIFF-MOCK-05** | **search 默认未过滤 `release_state=RELEASED`**：无 `release_state` 参数时返回全部 `CONFIRMED` 产品（含 PENDING/REVOKED 行）；契约/MD 默认只返回 RELEASED | `mock-api.js:233-239`（`!query.release_state ||` 短路）；`mock-products.json:178,232`（PENDING/REVOKED 记录）；MD `:897-899`（§6.4「默认只返回 RELEASED 且 CONFIRMED」）；`openapi.candidate.v1.json:142,694` | `[CONFIRMED]`（新发现行为差异） | 登记；隔离 Mock API 按契约默认过滤；**不得**据此改契约 | R-ST-05 |
| **DIFF-MOCK-06** | `visible_state` 用 `RELEASED/PENDING/REVOKED`（混用 release_state 词表），非契约枚举 `DRAFT/IN_REVIEW/RELEASED/WITHDRAWN` | `mock-products.json:19,178,232,278,335,382,414`；`API_CONTRACT_CANDIDATE_v1.md:383-388`（§9.3） | `[BLOCKED]`（B6） | 已登记为冻结阻断 B6；Mock 基线不改 | B6；R-ST-02/03/04 |
| **DIFF-MOCK-07** | `request_id` 格式 `req_demo_000001`，不满足契约 `^req_[0-9A-HJKMNP-TV-Z]{26}$`；无 X-Request-Id 回显 | `mock-api.js:19-22`；`openapi.candidate.v1.json:849-852` | `[PROPOSED]`（演示简化） | 隔离 Mock API 用 ULID 形态 + 回显逻辑（待 P1-2 口径） | R-ENV-04/05；P1-2 |
| **DIFF-MOCK-08** | 演示 ID 全部不符合契约 ULID 模式（`tax_demo_*`、`cat_demo_*`、`par_demo_*`、`ev_demo_*`、`rel_demo_*`、`doc_demo_*`）——有意 DEMO 标记 | `mock-products.json:21,80,85` 等；`openapi.candidate.v1.json:837-847,977,1025,1036,1114` | `[CONFIRMED]`（有意为之） | 隔离 Mock API 的固定测试数据改用符合模式但显式 `DEMO` 前缀段的 ULID（如 `cat_01DEMO…` 不可行时用合法 ULID + registry 映射），不得复用正式空间语义 | — |
| **DIFF-MOCK-09** | search 条目含 `visible_state`/`content_version`（与 EX-17 扁平行一致，与 OpenAPI items=Product 矛盾） | `mock-api.js:247-261`；EX-17；DIFF-CONTRACT-01 | `[PENDING]` | 随 DIFF-CONTRACT-01 一并裁定后再对齐 | DIFF-CONTRACT-01 |
| **DIFF-MOCK-10** | 端点覆盖仅 2/13 必需操作（search、getProduct）+ 8 个演示错误场景 + 字典/分类/归一化 UI 支撑端点（非契约端点）；`/status`、`/versions`、`/evidence`、`/categories`、全部 taxonomy 端点无 Mock；search 未实现 `updated_since`/`taxonomy_id`/`category_id`/`mpn_match`/`include_unreleased` 参数；未知过滤参数静默忽略（契约要求 400 UNKNOWN_FILTER） | `mock-api.js:452-462`（API 面）；`openapi.candidate.v1.json:81-615`（16 ops） | `[CONFIRMED]`（覆盖缺口，`ACCEPTANCE_PACKAGE.md` §16 已声明 Mock ≠ 契约全集） | 隔离 Mock API 补齐 16 操作矩阵与未知过滤 40002 | — |
| **DIFF-MOCK-11** | **证据明细字段在 Mock 数据中不存在**：`mock-products.json` 仅有 `evidence_ids: ["ev_demo_0001",…]` 字符串数组，无页码/bbox/raw_text；`ACCEPTANCE_PACKAGE.md:134` 声称「证据引用含 `ev_demo_0001`、页码/bbox/原文（冒烟 #2；`data/mock-products.json`）」与实际数据不符；`app.js:165` 仅渲染 evidence_ids 拼接 | `mock-products.json:39,51,61,73`（仅 evidence_ids）；`app.js:165`；`ACCEPTANCE_PACKAGE.md:134` | `[CONFIRMED]`（新发现：验收包声明与数据不符） | 提请 Reviewer 复核时注意该声明偏差；隔离 Mock API 按契约 `EvidenceItem`（bbox×4、page_number、raw_text≤500）构造完整证据 Fixture；`15_` 原始基线不改动 | R-EV-01 |
| **DIFF-MOCK-12** | Mock 产品 DTO 字段集与契约 `Product` 必填集差异：Mock 多 `visible_state`/`platform`/`fixture`，缺顶层 `data_version`（`data_version` 在 meta 中以 `content_version` 充当）；`platform` 为 Mock-only 映射预览扩展，契约无此字段 | `mock-api.js:50-64`（publicProduct）；`:162-168`（meta.data_version）；`openapi.candidate.v1.json:1041-1055` | `[PENDING]`（P1-9 分工待书面化；platform 字段去留随 DIFF-CONTRACT-01/IQ-13 映射治理） | 契约不含 `platform`（`[CONFIRMED]` 事实）；隔离 Mock 按最终裁定对齐 | P1-9；R-PRD-01/03 |
| **DIFF-MOCK-13** | `Release` 对象 Mock 扩展 `revoked_at`/`reason_code`（撤回产品记录），契约 `Release` schema 未定义这两个字段（410 信息只在错误体） | `mock-products.json:233-240`；`openapi.candidate.v1.json:1032-1040` | `[PROPOSED]` | 登记为候选可选扩展建议（撤回审计字段），待 DIFF-MOCK-01/IQ-09 一并裁定 | R-ST-06 |
| **DIFF-MOCK-14** | 错误场景覆盖缺口（演示层）：40102/40301/40303/41301/50302 无 Mock 场景；40901 在 Mock 有场景而契约标「v1 只读不触发（预留）」 | `mock-api.js:311-368`（scenario 表）；`API_CONTRACT_CANDIDATE_v1.md:278-280`（409 预留） | `[CONFIRMED]`（演示覆盖缺口） | 隔离 Mock API 补齐 20 错误码场景矩阵（除 409 预留语义按契约） | R-ENV-03 |
| **DIFF-MOCK-15** | taxonomy/字典数据结构与契约 schema 不一致：mock taxonomy 无 `taxonomy_code`/`taxonomy_version`（用 `version`）、节点缺 `is_active`/`sort_order`/`path_ids`/`path_codes`/`status`/`data_version`；字典条目结构接近候选 §5.2 但非契约 schema（契约无字典端点） | `mock-taxonomies.json:5-62`；`mock-dictionary.json`；`openapi.candidate.v1.json:1135-1200` | `[CONFIRMED]`（UI 演示结构） | 隔离 Mock API 的 taxonomy/字典 Fixture 按契约 schema 构造；字典端点是否入契约属 B7 后续（当前 16 操作不含字典） | R-DIC-01/04 |
| **DIFF-MOCK-16** | 游标为可解析偏移 `demo_<offset>`，契约要求不透明游标（客户端不得解析/构造） | `mock-api.js:199,243,377`；`openapi.candidate.v1.json:748-754` | `[PROPOSED]`（演示简化） | 隔离 Mock API 用 base64 不透明游标 | R-PTG-01 |

### 2.3 一致性确认（Mock 与契约方向一致、无需处置）

| 项 | 证据 |
|---|---|
| 统一包五字段骨架 `{code,message,data,request_id,meta}` | `mock-api.js:24-48` ↔ `openapi.candidate.v1.json:880-891` |
| 20 错误码的 HTTP/code/error_key 映射（Mock 已覆盖 9 种） | `mock-api.js:76,127,144,202,340,345,351,358` ↔ `API_CONTRACT_CANDIDATE_v1.md:250-273` |
| MPN-NORM-v1 九步规则与 `MPN-NORM-v1` 版本串 | `mpn-normalizer.js:132-143` ↔ `API_CONTRACT_CANDIDATE_v1.md:88-104` |
| pbk1_ 编码：`"PBK1\n"+len+":"+mpn+"\n"+len+":"+brand`、UTF-8 字节长度、完整 SHA-256、`normalizer_version` 不入哈希、缺 Brand 不生成键 | `mpn-normalizer.js:145-150` ↔ `API_CONTRACT_CANDIDATE_v1.md:120-132` |
| 缺 brand → 422 `PRODUCT_IDENTITY_INCOMPLETE`（missing=["brand"]） | `mock-api.js:171-192` ↔ MD §6.4/候选 §4.5（EX-17 说明除外，DIFF-CONTRACT-03） |
| 候选冲突聚合：无候选→INVALID/NO_CANDIDATES；混入非法→INVALID/INVALID_INPUT；多 MPN/Brand/键→PENDING_CONFLICT；缺 Brand→PENDING_BRAND | `mpn-normalizer.js:200-241` ↔ `API_CONTRACT_CANDIDATE_v1.md:115-118` |
| 身份枚举 `CONFIRMED/PENDING_BRAND/PENDING_CONFLICT/INVALID` | `openapi.candidate.v1.json:853-856` ↔ fixture `identity_state` |
| Identity 字段集（raw/norm/version + package/identity_scope/product_type） | `mock-products.json:9-18` ↔ `openapi.candidate.v1.json:959-972` |
| 消费方行为方向：403 不重试保留本地、410 终止态停止展示、REVOKED 流必须可发现 | `mock-api.js:126-161` + `simulateSync` REVOKED 流 ↔ `API_CONTRACT_CANDIDATE_v1.md:390-403` |

---

## 3. 差异统计与结论

| 类别 | 数量 | 其中新发现（本轮） | 已知/沿用登记 |
|---|---|---|---|
| DIFF-CONTRACT | 12 | **01（搜索条目形状矛盾）、03（缺 brand 400/422 示例冲突）**；02 为口径登记 | 04–12 沿用 P1/P2 |
| DIFF-MOCK | 16 | **05（默认未过滤 RELEASED）、11（证据明细字段缺失 vs 验收包声明）**；13/15/16 为细化登记 | 02/03/04/06/07/10/12/14 已知或演示简化 |
| 一致性确认 | 9 组 | — | — |

**结论**：
1. Mock 与契约候选在**身份规则、错误方向、包骨架**上方向一致；在**状态枚举（B6）、错误明细承载（IQ-09）、覆盖面（2/13 操作）、默认过滤、证据字段**上存在已登记差异。
2. 新发现两项契约候选内部矛盾（DIFF-CONTRACT-01/03）与两项 Mock 新行为差异（DIFF-MOCK-05/11），均已 `[PENDING]`/`[CONFIRMED]` 登记，**不自行修正任何一方**。
3. 本报告不构成契约冻结、不构成 Mock 缺陷认定（Mock 基线 `0474b19`/`090cae9` 不改动）、不改变任何 IQ/B 状态。
