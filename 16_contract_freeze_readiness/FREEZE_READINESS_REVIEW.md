# Phase 1 Business API 契约冻结就绪度审查报告

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-FREEZE-READINESS-001 |
| 版本 | v1.1（Reviewer 复核后最小修订；结论不变） |
| 日期 | 2026-11-17 |
| 状态 | `REVISED_AWAITING_REVIEW` |
| 审查对象 | `12_dsbit_business_api_integration_design/API_CONTRACT_CANDIDATE_v1.md`（`v1.0-candidate`）；`12_dsbit_business_api_integration_design/contract/openapi.candidate.v1.json`（OpenAPI 3.1.0）；`14_phase0_authority_adjudication/` Phase 0 裁定登记与证据包 |
| 审查基线 | `main@b7d5c803af43c14c747de4140cf1ab76d49a8d36`（`12_`/`14_`/`15_` 内容基线） |
| 审查方式 | 只读；未调用任何 API、未连接任何数据库、未生成 Token 或凭据、未启动任何服务 |
| 结论 | **`NOT_READY`** |
| 性质 | Session B 的审查建议；**不是**冻结批准、**不是**独立 Reviewer 验收、**不是**生产实现授权 |

---

## 0. 修订说明（v1.0 → v1.1）

本次修订只回应 Reviewer 的四项意见。**结论、证据基线、审查范围、IQ 状态、验收对象均未改变**；
`12_` 契约候选稿与 OpenAPI、`14_` 决策登记、`15_` Mock 均未修改。

| 编号 | Reviewer 意见 | 修订位置 | 处理方式 |
|---|---|---|---|
| R1 | 端点分级错误：`/categories/{category_id}/children` 属 `V1_REQUIRED`；`V1_OPTIONAL` 应为 `/taxonomies/{taxonomy_id}/changes`、`/categories/{category_id}/ancestors`、`/categories/{category_id}/products` | §2 A.1 / A.2 / A.3 | 按 `API_CONTRACT_CANDIDATE_v1.md` §6.1 / §6.2 重排：`children` 归入必需 #13，`changes` 归入可选 #14；编号与统计同步修正，合计仍为 13 必需 + 3 可选 = 16 操作 |
| R2 | `CategoryDetail` 的 `allOf` 是 schema 交集，`children` 同时满足 `CategoryNode` 与 `CategoryRefShort` 并不导致不可满足；真正问题是「compact child references」与继承的完整 `CategoryNode` 字段约束不一致 | §4 C.2 P1-3 | 删除「不可校验 / 不可满足」结论，改写为契约语义冲突；由 P0 降为 P1，P0 列表重排 |
| R3 | `/oauth/revoke` 只是候选方案（RFC 7009 或管理端禁用），不应称为遗漏的必需端点 | §4 C.1 P0-1、§4 C.2 P1-7 | 改为「撤销机制尚未选择、未进入机器契约」；不作为必需端点缺失计 |
| R4 | 合并原 P0-3 与 P0-9（同属 Ds Bit 权威分支与干净提交证据复验） | §4 C.1 P0-2 | 合并为单一阻断项，分别列出两个关闭条件 |

**未改动项（明确声明）：**

1. 结论仍为 `NOT_READY`，未上调。
2. 证据基线仍为 `b7d5c803`；本报告未新增对 Ds Bit 生产源码或 Morrishk 生产库的取证。
3. 未改变任何 IQ 的 `OPEN` / `DECIDED` 状态，未新增签署或验收。
4. 未新增验收对象，未扩大 `PASS_MOCK` 范围。
5. 未修改 `12_`（契约候选稿、OpenAPI、示例、IQ 文档）、`14_`（登记表、证据包）、`15_`（Mock UI）任何文件。
6. 本文件为新增独立目录，既不进入 `12_`/`14_`/`15_` 的 `SHA256SUMS.txt`，也不改动仓库根 `README.md`。

---

## 1. 审查范围、基线与方法

### 1.1 基线

| 项 | 值 |
|---|---|
| 内容基线 | `main@b7d5c803af43c14c747de4140cf1ab76d49a8d36` |
| 审查时点 HEAD | `d5d79e3cf469317888df2e022101a25ce6b9c961` |
| 基线一致性 | `git diff b7d5c80..HEAD -- 12_dsbit_business_api_integration_design 14_phase0_authority_adjudication 15_phase1_mock_ui` 输出为空：期间仅 Session A 推进 `13_`（`006dd32` / `87090ff` / `d5d79e3`） |
| OpenAPI SHA-256 | `fdeec48ecf44439776e61245ca7b98fc94f7ce0d481a7c9aea639900f1e71023`（与契约候选稿表头登记一致） |
| 契约候选稿 SHA-256 | `948da30aaf31f40094920cbf488ab568fce6055dbd0074747ee1340c133d3b0a` |
| 主设计文档 SHA-256 | `8d161917394d90758c35e9de6b1348969772ac6b805c374ca3d6568ac0e19fd8`（v1.3） |
| `13_` 处理 | 未读取其新增内容作为契约证据，未修改、未暂存、未提交 |

### 1.2 已读对象

- `12_/API_CONTRACT_CANDIDATE_v1.md`（全文）
- `12_/contract/openapi.candidate.v1.json`（全文，1,497 行）
- `12_/Ds Bit ↔ Morrishk Business API Integration Design v1.md`（§2、§4、§5、§6、§7、§8、§9、§11、§13、§14、附录 A）
- `14_/DECISION_REGISTER.md`、`14_/PHASE0_OPEN_QUESTIONS_MATRIX.md`、`14_/IQ05_IQ09_IQ15_IQ21_DECISION_BRIEFS.md`、`14_/IQ01_PRODUCT_IDENTITY_ADJUDICATION.md`、`14_/IQ02_TAXONOMY_AUTHORITY_ADJUDICATION.md`、`14_/DSBIT_AUTHORITY_BASELINE.md`、`14_/EVIDENCE_INDEX.md`、`14_/README.md`
- `12_/README.md`（§2.1 五项待复验事实、§8 契约候选登记）
- `15_/ACCEPTANCE_PACKAGE.md`（仅用于确认 `PASS_MOCK` 范围，不作为契约证据）

### 1.3 判定口径

| 等级 | 含义 |
|---|---|
| P0 | 不关闭则契约**不得**进入冻结评审；对应 MD §11「冻结阻断项」或 Phase 0 门槛 |
| P1 | 冻结前应解决或书面豁免；不单独构成冻结否决，但会改变线形或消费方行为 |
| P2 | 记录项；不影响冻结判定，建议在冻结记录中一并说明 |

状态记法沿用既有口径：`DECIDED`（已登记）≠ 已签署 ≠ 已验收；`PROPOSED` ≠ 已实现；`OPEN` 未关闭；
`CANDIDATE_NOT_FROZEN` 不得表述为冻结；`PASS_MOCK` 不覆盖契约冻结。

---

## 2. A. 契约文档 ↔ OpenAPI 端点分级一致性矩阵

分级依据：`API_CONTRACT_CANDIDATE_v1.md` §6.1（必需）/ §6.2（可选）；OpenAPI 中
`x-endpoint-status` 缺省视为 `V1_REQUIRED`（全文仅 3 处 `V1_OPTIONAL`，见 `:491`、`:581`、`:613`）。

### 2.1 A.1 `V1_REQUIRED`（12 个唯一路径 / 13 个操作，含 Token）

| # | 方法 | 路径 | MD §6.1 | OpenAPI 路径行 | OpenAPI 分级声明 | 判定 |
|---|---|---|---|---|---|---|
| 1 | POST | `/oauth/token` | #1 | `:81-136` | 缺省 → 必需 | MATCH |
| 2 | GET | `/products/search` | #2 | `:137-178` | 缺省 → 必需 | MATCH |
| 3 | GET | `/products/{product_business_key}` | #3 | `:179-211` | 缺省 → 必需 | MATCH |
| 4 | GET | `/products/{product_business_key}/status` | #4 | `:212-241` | 缺省 → 必需 | MATCH |
| 5 | GET | `/products/{product_business_key}/versions` | #5 | `:242-272` | 缺省 → 必需 | MATCH |
| 6 | GET | `/products/{product_business_key}/evidence` | #6 | `:273-303` | 缺省 → 必需 | MATCH |
| 7 | GET | `/products/{product_business_key}/categories` | #7 | `:304-336` | 缺省 → 必需 | MATCH |
| 8 | GET | `/taxonomies` | #8 | `:337-365` | 缺省 → 必需 | MATCH |
| 9 | GET | `/taxonomies/{taxonomy_id}` | #9 | `:366-395` | 缺省 → 必需 | MATCH |
| 10 | GET | `/taxonomies/{taxonomy_id}/version` | #10 | `:396-424` | 缺省 → 必需 | MATCH |
| 11 | GET | `/taxonomies/{taxonomy_id}/categories` | #11 | `:425-461` | 缺省 → 必需 | MATCH |
| 12 | GET | `/categories/{category_id}` | #12 | `:494-524` | 缺省 → 必需 | MATCH |
| 13 | GET | `/categories/{category_id}/children` | **#13** | `:525-554` | 缺省 → 必需 | MATCH（v1.0 误列 OPTIONAL，已纠正） |

### 2.2 A.2 `V1_OPTIONAL`（3 个操作）

| # | 方法 | 路径 | MD §6.2 | OpenAPI 路径行 | `x-endpoint-status` | 判定 |
|---|---|---|---|---|---|---|
| 14 | GET | `/taxonomies/{taxonomy_id}/changes` | 第 1 项 | `:462-493` | `V1_OPTIONAL`（`:491`） | MATCH（v1.0 遗漏，已补） |
| 15 | GET | `/categories/{category_id}/ancestors` | 第 2 项 | `:555-583` | `V1_OPTIONAL`（`:581`） | MATCH |
| 16 | GET | `/categories/{category_id}/products` | 第 3 项 | `:584-615` | `V1_OPTIONAL`（`:613`） | MATCH |

### 2.3 A.3 统计与分级判定

| 指标 | 值 |
|---|---|
| 路径数 / 操作数 | 16 / 16（每路径 1 个 GET 或 POST） |
| `V1_REQUIRED` | 13 个操作 = 12 个业务路径 + `POST /oauth/token` |
| `V1_OPTIONAL` | 3 个操作 |
| MD 与 OpenAPI 分级冲突 | **0** |
| 分级判定 | **PASS（一致）** |

更正说明：v1.0 把 `/categories/{category_id}/children` 列为可选、并遗漏 `/taxonomies/{taxonomy_id}/changes`，
由此得出「13 必需（含 changes）/ 3 可选（含 children）」的错误对应。本次按 MD §6.1 / §6.2 与
OpenAPI `x-endpoint-status` 重排后，**总数不变**（13 + 3 = 16），仅具体条目归属纠正。

### 2.4 A.4 端点级其他差异（不影响分级，缺陷见 §4）

| 编号 | 端点 | 差异 | 归入 |
|---|---|---|---|
| A-1 | `GET /products/search`（`:144-157`）、`GET /taxonomies/{id}/categories`（`:433-439`） | MD §7.6 定义 `sort=field:asc|desc` 白名单，OpenAPI 全文无 `sort` 参数（仅有 `sort_order` 属性，`:1167`） | P1-1 |
| A-2 | `POST /oauth/token`（`:116-133`） | 400/401 返回 `OAuthError`，429/500 复用业务错误组件 `ErrorEnvelope` | P1-6 |
| A-3 | `GET /categories/{category_id}`（`:508`） | 200 响应 `CategoryDetail` 的 `children` 在 `allOf` 中同时受 `CategoryNode` 与 `CategoryRefShort` 约束 | P1-3 |
| A-4 | `GET /categories/{category_id}/children`（`:537-543`） | 200 响应未声明 `headers`，与同资源族其他端点不一致（无 ETag / `X-Request-Id` / 限流头） | P2-2 |

---

## 3. B. Phase 0 裁定对契约的影响矩阵

裁定状态取自 `14_/DECISION_REGISTER.md`（§2.4：三项均**待签署**、独立 Reviewer 验收**未完成**）与
`14_/PHASE0_OPEN_QUESTIONS_MATRIX.md`（Phase 0 阻断项 7 项，当前 3/7）。

| IQ | 14_ 状态 | 契约中的体现 | 对冻结的影响 | 关联阻断 |
|---|---|---|---|---|
| IQ-01 | `DECIDED`（登记，未签署/未验收）；§2.4 注明 `MpnNormalizer` 规则细节、`identity_scope` 仍待设计固定 | `x-decision-refs`（`:26-30`）；`ProductBusinessKey`、`(mpn_norm, brand_norm)` 唯一键、`normalizer_version` | 身份规则方向已写入，但归一化规则集与 `pbk1_` 编码未评审冻结 → 算法一变，全部 `pbk` 与路由失效 | P0-3、P0-4 |
| IQ-02 | `DECIDED`（同上）；**§10.5 明确「体系数量」仍开放** | 技术分类归 Ds Bit、两套 ID 不共享；`CategoryEdges.taxonomy_id` 为单值必填（`:1248-1256`） | 体系数量未裁定，单体系假设不可冻结；多体系则边结构需改形 | P0-3、P1-4 |
| IQ-05 | `OPEN` | `/categories/{id}` 的 `DEPRECATED` / `410 CATEGORY_RETIRED` 与保留窗口（`:497`） | 保留期未定 → 分类下线时序与消费方回退行为不可冻结 | P0-1 |
| IQ-08 | `OPEN`（附录 A.3 标 Phase 2；MD §11.2 B8 列为冻结阻断） | `Evidence` 字段集合、`screenshot_reference` | 公开范围未定 → 证据 DTO 可暴露字段不可冻结；且上述两处口径需先统一 | P0-7 |
| IQ-09 | `OPEN` | 统一响应包形状（`EnvelopeBase`，`:881-891`）；契约候选稿 §7.3 自认 OPEN | 外层替换会改动全部 16 操作的响应形状 | P0-1 |
| IQ-13 | `DECIDED`（同上）；§2.4 注明新平台生产能力与迁移授权未获批 | 目标为新平台业务库；`product_business_key` 为跨系统身份；两侧自增 ID 不作身份 | 方向已写入；`visible_state` / `release_state` / 闸门命名协调仍缺（B6） | P0-3、P0-5 |
| IQ-15 | `OPEN` | 表引擎与字符集；`x-open-blockers` 注明「no wire-shape change」（`:44-48`） | 不改线形，但属 Phase 0 冻结门槛，未关闭则不得冻结 | P0-1 |
| IQ-21 | `OPEN` | `POST /oauth/token`；`x-open-blockers` 注明影响本地/预发联调（`:50-54`） | 是否允许非生产凭证未定 → 联调与安全审计方案不可定 | P0-1 |
| IQ-03 / IQ-04 | `PROPOSED` / `PARTIALLY_CONFIRMED`（MD §11.3，Phase 1 实施前参数） | `category_code` 生成；同一产品是否可跨体系多主分类 | 不单独阻断冻结，但与 IQ-02 体系数量、`CategoryEdges` 单值结构强相关 | P1-4 |

**小结：** 7 项 Phase 0 阻断项中仅 3 项 `DECIDED`，且 3 项均未签署、未独立验收；4 项仍 `OPEN`。
冻结门槛（7/7 裁定 + 权威分支 + 证据复验 + 独立冻结记录）未达成。

---

## 4. C. 阻断项

### 4.1 C.1 P0（不关闭则不得进入冻结评审）

#### P0-1 四项 Phase 0 阻断问题仍 `OPEN`，且其契约影响未闭合

- **证据**：`14_/DECISION_REGISTER.md` §6「未裁定 Phase 0 问题 4 / 7」；`14_/IQ05_IQ09_IQ15_IQ21_DECISION_BRIEFS.md`
  四项裁定记录均为空；OpenAPI `x-open-blockers`（`:30-66`）逐项列出 IQ-05 / IQ-09 / IQ-15 / IQ-21 为 `OPEN`。
- **契约影响**：IQ-09 决定全部 16 操作的响应外层；IQ-05 决定分类 `410` 语义；IQ-15 阻塞持久化选型（不改线形）；
  IQ-21 决定是否允许非生产凭证。
- **关闭条件**：四项均由决策人书面裁定并进入 `DECISION_REGISTER.md` §2 对应行并签署。

#### P0-2 Ds Bit 权威分支与干净提交证据复验未完成（原 P0-3 + P0-9 合并）

- **证据**：`14_/DSBIT_AUTHORITY_BASELINE.md` §1「权威分支：`DECISION_REQUIRED`」，列出三个候选口径
  （`backup/full-local-20261114` / `origin/feat/gate6a-audit` / `main`），工作树存在未提交内容；
  `12_/README.md` §2.1 要求在权威分支干净提交上重新核对五项事实。
- **契约影响**：`CONFIRMED` 仅对 `600439a` 快照成立；若权威分支变更，契约中「现状」依据需整体重核。
- **关闭条件（两项分别满足，缺一不可）**：
  1. **分支与基线书面确定**：决策人书面指定权威分支与提交 SHA，并明确未提交工作树内容是否纳入基线；
  2. **干净提交复验**：在该干净提交上复验 `12_/README.md` §2.1 的五项（产品身份模型、产品全局 ID 唯一性、
     解析器输出与证据模型、静态 B2B 桩状态、数据库/审核/版本/发布四类后端进度），结果写入冻结记录；
     任一项不成立，对应 `CONFIRMED` 降级为 `OPEN`。

#### P0-3 IQ-01 / IQ-02 / IQ-13 已登记但未签署、未独立验收

- **证据**：`14_/DECISION_REGISTER.md` §2.4：三项均为「待签署」、签署人「未指定」、独立 Reviewer 验收「未完成」；
  §2.4 登记口径第 4 条：「在签署与验收完成前，三项裁定仍不能作为契约冻结或生产实现的依据」。
- **契约影响**：`x-decision-refs` 把三项作为契约依据，但依据尚未生效。
- **关闭条件**：指定签署人并完成签署；由非执行 Agent 完成独立验收并留下验收记录。

#### P0-4 B5：`MpnNormalizer` 规则集与 `product_business_key` 编码未评审冻结

- **证据**：`API_CONTRACT_CANDIDATE_v1.md` §11.2 B5「`PROPOSED`，未评审冻结」；
  OpenAPI `x-open-blockers`「MPN-NORM-v1」（`:56-60`），影响「all product identity fields and routes」。
- **契约影响**：`pbk1_ + sha256(规范化 MPN + 规范化 Brand)` 是全部产品路由的主键；规则或编码一变，
  已发出的 `pbk` 全部失效，且跨系统对齐失败。
- **关闭条件**：`MPN-NORM-v1` 规则集与编码书面冻结，并有向量化测试证据（同一输入跨版本可复算）。

#### P0-5 B6：`visible_state` / `release_state` / 闸门状态三套枚举未协调

- **证据**：`API_CONTRACT_CANDIDATE_v1.md` §9.3（三命名空间对照表，明示「不一致，列为冻结阻断 B6」）；
  OpenAPI `x-open-blockers`「VISIBLE-STATE-RECONCILIATION」（`:62-66`）；
  `release_state` 参数描述自认「reconciliation is OPEN」（`:690-695`）。
- **契约影响**：`/products/search` 过滤值与 `/status.visible_state` 语义不同，消费方易误用；
  冻结会把错误命名固化到客户端。
- **关闭条件**：由设计文档维护人书面统一命名或明确映射关系，写入契约；执行 Agent 不得自行改名或合并。

#### P0-6 B7：技术参数字典正式种子与命名标准未提交

- **证据**：`API_CONTRACT_CANDIDATE_v1.md` §11.2 B7「待 PM 提交（IQ-02 裁定后开放）」。
- **契约影响**：技术参数分类树的 `category_code` / `name` 集合与层级不可冻结；Fixture 不得冒充正式种子。
- **关闭条件**：PM 提交正式种子与命名标准，并在冻结记录中登记来源与版本。

#### P0-7 B8：证据公开范围未裁定，且文档内部口径不一致

- **证据**：`API_CONTRACT_CANDIDATE_v1.md` §11.2 B8「`OPEN`（IQ-08）」；
  同时主设计文档附录 A.3 把 IQ-08 标为 Phase 2（`Ds Bit ↔ Morrishk Business API Integration Design v1.md:2433`）。
- **契约影响**：`/evidence` 可返回的字段（尤其 `screenshot_reference` 与短原文）取决于公开范围；
  若按附录口径视为 Phase 2，则需书面豁免 B8，否则不得冻结。
- **关闭条件**：先统一「B8 是否属冻结阻断」的口径，再要么裁定公开范围，要么在冻结记录中书面豁免并说明理由。

### 4.2 C.2 P1（冻结前应解决或书面豁免）

| 编号 | 问题 | 证据 | 关闭条件 |
|---|---|---|---|
| P1-1 | `sort` 白名单不可机读 | MD §7.6 定义 `sort=field:asc|desc` 与四项白名单；OpenAPI 全文无 `sort` 参数（`/products/search:144-157`、`/taxonomies/{id}/categories:433-439`） | 在相关端点补 `sort` 参数与枚举，或书面声明 v1 不支持排序 |
| P1-2 | `X-Request-Id` 回显语义与值域歧义 | MD §7.4「客户端可发 8–64 字符 `[A-Za-z0-9_-]`，服务端回显，响应头与体 `request_id` 必须一致」；OpenAPI 仅在响应头声明（`:763-770`、`:779`），从未定义请求头参数；体 `request_id` 强制 `^req_[0-9A-HJKMNP-TV-Z]{26}$`（`:849-852`） | 明确回显值是否必须等于客户端值、客户端值不满足 `req_` 格式时体/头分别取什么；补请求头参数或改写正则约束 |
| P1-3 | `CategoryDetail.children` 语义冲突（原 P0-8，降级） | `CategoryDetail` 为 `allOf`（`:1212-1232`）：第一支继承 `CategoryNode`，其 `children` 为完整 `CategoryNode[]`、描述「Only present in mode=tree, capped at depth 4 / 5000 nodes」（`:1195-1199`）；第二支又声明 `children` 为 `CategoryRefShort[]`、描述「Compact child references, max 200」（`:1224-1229`）。`CategoryRefShort` 仅要求 `category_id` 且未设 `additionalProperties:false`（`:1202-1210`） | 交集**可满足**（完整节点同时满足两支），不构成「不可校验」；但「紧凑引用 + 200 上限」与继承的「完整节点 + 4 层/5000 节点」在描述与基数上冲突，且按交集服务端必须输出完整节点，与 compact 意图相反。冻结前应改为显式覆盖 `children`（或拆分独立 schema），并统一基数与描述 |
| P1-4 | 单一 `taxonomy_id` 假设与 IQ-02 §10.5 冲突 | `CategoryEdges` 要求单值 `taxonomy_id`（`:1248-1256`）；`IQ02_TAXONOMY_AUTHORITY_ADJUDICATION.md` §10.5「体系数量……仍开放」；MD §11.3 IQ-04 为 `PARTIALLY_CONFIRMED` | 裁定 v1 单体系（并记录），或改契约支持多体系边 |
| P1-5 | `x-open-blockers` 少列 B7/B8 | 机器契约列 6 项（`:30-66`）；MD §11.2 的冻结阻断含 B7、B8 | 补齐机器可读阻断清单，或书面说明 B7/B8 不属冻结阻断 |
| P1-6 | Token 端点两种错误体 | `/oauth/token` 400/401 为 `OAuthError`（`:116-130`），429/500 复用业务 `RateLimited` / `InternalError`（`:132-133`）；MD §4.5 规定 Token 端点遵循 RFC 6749 | 统一 token 端点错误体，或在契约中明确「仅 400/401 为 RFC 形状」 |
| P1-7 | 撤销机制尚未选择、未进入机器契约 | MD §4.3（`:377`）把「RFC 7009 `/oauth/revoke`**或**管理端禁用」并列为候选；OpenAPI 无任何撤销或客户端禁用端点 | 明确 v1 采用哪种撤销/禁用机制并写入契约，或书面声明 v1 仅支持管理端禁用且不提供端点。**不得**表述为「遗漏必需端点」 |
| P1-8 | `expires_in` 被固化为 `const 900` | OpenAPI `:947`；MD §11.3 IQ-12「Token TTL 与限流配额」为 `PROPOSED` | IQ-12 裁定后改为普通整数或确认固定值并写明不可配置 |
| P1-9 | `Product` DTO 不含 `visible_state` 的分工未书面化 | `Product` 必填字段无 `visible_state`（`:1041-1055`），仅 `ProductStatus` 有（`:1093`）；搜索默认按 `release_state=RELEASED` 过滤（`:142`） | 在冻结记录中明确「可见性只在 `/status` 暴露」的消费方约定，避免误判 |
| P1-10 | `EvidenceEnvelope` 的 `meta` 语义与分页口径 | `EvidenceEnvelope` 仅 `allOf` `EnvelopeBase` + `Evidence`（`:1376-1387`）；`EnvelopeBase` 必填 `meta` 但 `meta` 为自由 object（`:881-891`）；MD §6.7 返回含 `items` 数组的证据对象、未定义分页（`:953-970`） | 明确证据响应是否分页、`meta` 为空时仍须存在，或在证据信封中绑定 `PageMeta` 并声明上限 |

### 4.3 C.3 P2（记录项）

| 编号 | 问题 | 证据 |
|---|---|---|
| P2-1 | 全局 `security` 声明为双 scope，但 16 个操作均各自声明 `security`（token 为 `[]`），全局声明实际不生效，易被误读为「必须同时具备」 | OpenAPI `:77-79` 与各 operation 的 `security` |
| P2-2 | `/categories/{id}/children` 200 未声明 `headers` | OpenAPI `:537-543`；对照 `/categories/{id}` `:508` |
| P2-3 | `Gate.state` 为自由字符串，无枚举 | OpenAPI `:1065-1069` |
| P2-4 | `CategoryStatus.PUBLISHED` 与 `CategoryNode.is_active` 语义重叠 | OpenAPI `:862-865`、`:1166` |
| P2-5 | `RateLimited` / `InternalError` 等错误组件未声明限流头 | OpenAPI `:814-824` |
| P2-6 | `/oauth/token` 无 503，而业务端点有 `Unavailable` | OpenAPI `:132-133` vs `:175` |
| P2-7 | `PageMeta` 中 `next_cursor` 可为 `null`、`has_more` 必填，二者冲突时以谁为准未规定 | OpenAPI `:870-880` |
| P2-8 | `x-mock-baseline.commit` 固定为 `0474b19`，而 `PASS_MOCK` 范围为 `090cae9` + `b7d5c80` 文档修订；该字段为记录信息，不改契约形状 | OpenAPI `:68-71`；`15_/ACCEPTANCE_PACKAGE.md` |

### 4.4 C.4 若只做最小改动（供冻结评审排序，不构成本轮实现授权）

| 顺序 | 最小动作 | 覆盖 |
|---|---|---|
| 1 | 关闭四项 `OPEN` IQ 并完成三项签署/验收 | P0-1、P0-3 |
| 2 | 书面确定权威分支与 SHA，并在干净提交上复验五项 | P0-2 |
| 3 | 冻结 B5（归一化与编码）、统一 B6（状态命名） | P0-4、P0-5 |
| 4 | 提交 B7 正式种子；统一 B8 口径并裁定或豁免 | P0-6、P0-7 |
| 5 | 修正 P1-3（`CategoryDetail`）、P1-1（`sort`）、P1-2（`X-Request-Id`）、P1-6（token 错误体） | P1-1 / 2 / 3 / 6 |
| 6 | 补齐 `x-open-blockers` 并对 P1-4/5/7/8/9/10 逐项记录结论 | 其余 P1 |

---

## 5. D. 结论

### 5.1 判定

**`NOT_READY`**

契约当前**不具备冻结条件**。理由按权重排序：

1. **裁定门槛未达成**：7 项 Phase 0 阻断项仅 3 项 `DECIDED`，且 3 项均未签署、未独立验收；4 项仍 `OPEN`。
   （P0-1、P0-3）
2. **证据基线未固定**：Ds Bit 权威分支仍为 `DECISION_REQUIRED`，干净提交复验未完成。（P0-2）
3. **身份与状态语义未冻结**：`MpnNormalizer` / `pbk` 编码（B5）与三套状态命名（B6）仍属 `PROPOSED` / `OPEN`，
   二者直接决定路由主键与消费方行为。（P0-4、P0-5）
4. **机器契约仍有 P1 级语义冲突**：`CategoryDetail.children` 交集语义、`sort` 与 `X-Request-Id` 缺失、
   Token 端点错误体不一致等；单条不否决，但整体不满足可评审冻结的质量线。（P1-1 ~ P1-10）

### 5.2 关闭顺序建议

1. 决策人裁定 IQ-05 / IQ-09 / IQ-15 / IQ-21；签署 IQ-01 / IQ-02 / IQ-13；完成独立验收。
2. 书面确定 Ds Bit 权威分支与提交 SHA（含工作树口径），在干净提交上复验并记录。
3. 冻结 `MPN-NORM-v1`；书面统一三套状态命名。
4. 提交 B7 正式种子；统一 B8 口径并裁定或书面豁免。
5. 修正 P1-1 / P1-2 / P1-3 / P1-6 等契约语义问题，补齐 `x-open-blockers`。
6. 由独立 Reviewer 出具冻结记录；在此之前 `x-contract-status` 必须保持 `CANDIDATE_NOT_FROZEN`。

### 5.3 本报告不构成

1. 不构成契约冻结、冻结评审通过或生产实现授权。
2. 不构成对任何 IQ 的裁定、签署或验收；不改变任何 `OPEN` / `DECIDED` 状态。
3. 不构成对 `PASS_MOCK` 范围的扩大，也不构成 `PIPELINE_PASS` / `CONTENT_APPROVED` / `RELEASE_APPROVED`。
4. 不构成对 Ds Bit 权威分支、产品身份或分类权威的认定。
5. 不构成对 `12_` / `14_` / `15_` 任何文件的修改建议的强制执行；P1/P2 均为待 Reviewer 与维护人裁量的事项。

---

## 6. 复核方法（只读）

```bash
cd "E:/workspace/独立站/morrishk-site-upgrade-review"

# 1) 基线一致性：应输出为空
git diff --stat b7d5c80..HEAD -- 12_dsbit_business_api_integration_design 14_phase0_authority_adjudication 15_phase1_mock_ui

# 2) 契约产物哈希
sha256sum 12_dsbit_business_api_integration_design/contract/openapi.candidate.v1.json
sha256sum 12_dsbit_business_api_integration_design/API_CONTRACT_CANDIDATE_v1.md

# 3) 端点分级：应恰好 16 个路径键，仅 3 处 V1_OPTIONAL
grep -c '^    "/' 12_dsbit_business_api_integration_design/contract/openapi.candidate.v1.json
grep -n 'x-endpoint-status' 12_dsbit_business_api_integration_design/contract/openapi.candidate.v1.json

# 4) 冻结阻断状态
sed -n '30,66p' 12_dsbit_business_api_integration_design/contract/openapi.candidate.v1.json
sed -n '92,110p' 14_phase0_authority_adjudication/DECISION_REGISTER.md

# 5) 本报告哈希
sha256sum 16_contract_freeze_readiness/FREEZE_READINESS_REVIEW.md
```

本文件不内置自身 SHA-256（写入会改变哈希），校验值随提交说明单独提供。