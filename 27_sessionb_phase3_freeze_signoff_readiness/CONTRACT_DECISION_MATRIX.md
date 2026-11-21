# CONTRACT DECISION MATRIX · 契约决策矩阵（决策输入，非选定）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE3-CDM-001 |
| 版本 | v1.0-draft |
| 用途 | 把每个契约级未决事项的冲突来源、候选方案、影响、决策人与"决定后需更新的文件"集中成一张可审阅的矩阵；**不替决策人选定答案** |
| 口径 | 每项候选方案地位平等；影响分析为中性陈述；状态保持权威登记原值 |

## CM-1 搜索返回 DTO 形态（DIFF-CONTRACT-01，PENDING）

| 维度 | 内容 |
|---|---|
| 冲突来源 | 候选 OpenAPI `ProductListEnvelope.data.items` = **`Product[]`**（完整 DTO，必含 technical/categories/documents/release/data_version；无 visible_state/content_version）；`API_CONTRACT_EXAMPLES.md` EX-17/17b 为**扁平身份行**；MD §6.4 只定义参数未定义条目形状 |
| 现有证据 | `openapi.candidate.v1.json:1307-1325`、`:1041-1055`；`API_CONTRACT_EXAMPLES.md:1101-1140`；MD §6.4（`:887-903`）；`25_/DIFF_CHECK_REPORT.md` §2.1；Mock 与 EX-17 一致（`mock-api.js:247-261`） |
| 候选 A：完整 `Product[]` | 消费方一次取全量 DTO；同步流量大（含 technical/categories/documents）；与 §6.4"默认只返回 RELEASED+CONFIRMED"轻量语义不完全匹配；需补 `data_version` 一致性语义 |
| 候选 B：扁平身份行 | 与 EX-17/Mock/增量同步语义一致；轻量；但消费方需二次调用详情；需要独立 schema 定义（如 SearchItem）并修订 OpenAPI |
| 候选 C：独立 SearchItem schema | 兼顾两方：显式定义搜索条目字段集（含 visible_state/content_version 与否待定）；OpenAPI 与示例同向修订 |
| 对 Morrishk 兼容性影响 | 同步循环条目数与流量；客户端反序列化模型；增量游标语义；Phase 2 W-1/W-3 双形态占位随裁定收敛 |
| 决策人 | 设计文档维护人（修订候选）→ Reviewer 复核 |
| 决定后需更新 | OpenAPI `ProductListEnvelope`/新增 schema；EX-17 示例；MD §6.4 补条目形状；`25_` DIFF 登记；W-1 序列化与 W-3 反序列化占位；测试矩阵 OP-02 断言 |
| 当前状态 | PENDING（执行 Agent 不改契约） |

## CM-2 缺 brand 错误码（DIFF-CONTRACT-03，PENDING）

| 维度 | 内容 |
|---|---|
| 冲突来源 | MD §6.4 与候选 §4.5：缺 brand → **422 PRODUCT_IDENTITY_INCOMPLETE（missing=["brand"]）**；EX-17 说明文字：缺 brand → **400 INVALID_ARGUMENT** |
| 现有证据 | MD `:889-891`；`API_CONTRACT_CANDIDATE_v1.md:147`；`API_CONTRACT_EXAMPLES.md:1141-1143`；Mock = 422（`mock-api.js:217-219`，与 MD/候选一致） |
| 候选 A：422/42201 | 语义更精确（身份不完整 ≠ 参数非法）；与 MD/候选/Mock 三方一致；meta.missing=["brand"]；degraded_allowed=true |
| 候选 B：400/40001 | 与 EX-17 说明一致；把缺参视为参数校验失败；与候选 §4.5 现文冲突，需修订候选正文与 Mock |
| 对 Morrishk 兼容性影响 | Client 异常映射分支（AuthException/IllegalArgument vs IdentityIncomplete）；重试策略（两者均不重试）；错误提示语 |
| 决策人 | 设计文档维护人（修正示例或候选）→ Reviewer 一致性复验 |
| 决定后需更新 | EX-17 说明（或候选 §4.5）；`ERROR_CODE_TEST_MATRIX.md` 42201 行收敛为单向量的正式断言；W-1/W-3 错误映射；`25_` DIFF 登记 |
| 当前状态 | PENDING（双候选向量均 BLOCKED_BY_DECISION，保持分别断言、不得合并） |

## CM-3 默认公开状态过滤（DIFF-MOCK-05，OPEN）

| 维度 | 内容 |
|---|---|
| 当前 Mock 表现 | 无 release_state 参数时**不过滤**，返回全部 CONFIRMED 产品（含 PENDING/REVOKED 行）（`mock-api.js:233-239`） |
| Phase 2 PLAN 候选设计 | 候选 A/B 双向量均 `BLOCKED_BY_DECISION(DIFF-MOCK-05)`；W-1/W-2 不预置任何确定默认值；FIXTURE 保留双向量测试数据 |
| 尚缺权威依据 | 公开查询过滤规则的正式裁定（现有"默认 RELEASED"仅见于 MD §6.4/OpenAPI 默认声明，属候选语义 + R-OA-05/授权规则同层级的 PROPOSED 体系） |
| 候选 A：默认仅 RELEASED | 安全/隐私更优（未发布数据默认不出线）；与 MD/OpenAPI 现声明一致；消费方获取 REVOKED 流需显式参数（撤回发现语义仍 V1_REQUIRED） |
| 候选 B：不自动过滤 | 灵活；客户端显式控制；风险 = 客户端漏过滤导致 PENDING/REVOKED 外露（安全/隐私风险上移至消费方）；与"默认公开最小化"原则冲突 |
| 兼容性影响 | Morrishk 同步循环默认行为；缓存策略；撤回发现路径；漏过滤的合规风险归属 |
| 待确认决策问题 | 默认值取 A 或 B；PENDING/REVOKED 行是否需要独立授权（product.publish.read）才可见；两参数（release_state/identity_state）默认值是否联动 |
| 决策人 | 客户业务负责人 + Reviewer |
| 决定后需更新 | MD §6.4/OpenAPI 参数默认值；`25_`/`26_` 矩阵双向量收敛；W-1/W-2 默认值注入；OP-02/OP-16 断言；Client 缓存语义 |
| 当前状态 | OPEN（双向量均不计入行为验收 PASS） |

## CM-4 证据字段承载与公开范围（DIFF-MOCK-11，OPEN → IQ-08/B8）

| 维度 | 内容 |
|---|---|
| 当前 Mock 表现 | 仅 `evidence_ids` 字符串数组；无页码/bbox/原文（`mock-products.json`）；`ACCEPTANCE_PACKAGE.md:134` 声明与数据不符（已在 `25_/DIFF_CHECK_REPORT.md` 登记） |
| Phase 2 PLAN 候选设计 | FIXTURE 按 `EvidenceItem` 全量构造（bbox×4/page_number/raw_text≤500/screenshot_reference）；Repository 提供待裁过滤层（默认全含，标记 pending）；暴露集合 = BLOCKED_BY_DECISION(B8) |
| 尚缺权威依据 | IQ-08 证据公开范围裁定（客户法务/业务）；文档口径统一（候选 §11.2 列 B8 为冻结阻断 vs 主文档附录 A.3 标 IQ-08 为 Phase 2） |
| 方案影响 | 全量暴露：证据可溯源性最强，但 datasheet 原文/截图涉及 IPR 与许可边界；最小暴露（仅 evidence_id+页码引用）：合规风险最小，消费方验证能力弱；中间方案：短原文（≤500）+ 页码/bbox、截图仅相对路径——需法务确认 |
| 兼容性影响 | Morrishk 页面"证据可溯源"展示能力；缓存与再分发边界；`screenshot_reference` 是否提供下载（当前候选：仅相对路径，非下载 URL） |
| 待确认决策问题 | 公开字段白名单；短原文长度上限是否调整；截图获取通道；`RELEASE_APPROVED` 与营销内容批准的边界执行（R-EV-03） |
| 决策人 | 口径统一：Reviewer + 设计文档维护人；范围裁定：客户法务/业务（IQ-08） |
| 决定后需更新 | OpenAPI `EvidenceItem`/`EvidenceEnvelope`；MD 附录 A.3 与候选 §11.2 口径统一；`ERROR_CODE_TEST_MATRIX.md` OP-06 断言；W-1/W-2 过滤层；`25_` DIFF 登记 |
| 当前状态 | OPEN（承载能力已具备设计，暴露范围 BLOCKED_BY_DECISION(B8)） |

## CM-5 状态枚举命名统一（B6，OPEN）

| 维度 | 内容 |
|---|---|
| 冲突来源 | 三命名空间并存：闸门状态（PENDING/PASS/FAILED；PENDING/APPROVED/REJECTED；PENDING/APPROVED/REVOKED）、`visible_state`（DRAFT/IN_REVIEW/RELEASED/WITHDRAWN）、`release_state` 查询参数（RELEASED/REVOKED/PENDING） |
| 候选 A | 按候选枚举原样冻结（三命名空间显式隔离，写入冻结记录） |
| 候选 B | 重命名统一（如 release_state → publication_state），OpenAPI/MD/Mock/Client 全链修订 |
| 候选 C | 建立映射表（闸门态 ↔ visible_state ↔ 查询参数），契约附映射附录 |
| 影响 | 消费方误用风险（现最大）；Mock 已登记演示简化差异（DIFF-MOCK-06）；`PIPELINE_PASS≠CONTENT_APPROVED≠RELEASE_APPROVED` 语义边界 |
| 决策人 | 设计文档维护人（书面统一，执行 Agent 不得改名/合并） |
| 决定后需更新 | OpenAPI 枚举；MD §9；`ERROR_CODE_TEST_MATRIX.md` OP-04 派生断言；W-1 状态层；W-3 Client；Fixture gates 双存结构收敛 |
| 当前状态 | OPEN（P0-5） |

## CM-6 归一化规则与业务键编码冻结（B5，PROPOSED）

| 维度 | 内容 |
|---|---|
| 现状 | `MPN-NORM-v1` 九步规则 + `pbk1_` 编码（长度前缀 canonical + 完整 SHA-256）均为 PROPOSED；`identity_scope` 是否入键未决（R-ID-07）；冲突判定算法未定义（F-11 占位 `NORMALIZATION_CONFLICT_CANDIDATE_PENDING_B5`） |
| 冻结所需证据 | 规则集评审记录；向量化测试证据（固定输入→期望输出，跨版本可复算）；碰撞分析（完整 SHA-256 不截断）；`normalizer_version` 迁移策略 |
| 影响 | 一旦冻结：规则变化=不兼容变更（升 /api/v2 或重新裁定）；全部已签发 pbk 依赖该编码 |
| 决策人 | 评审冻结方（Reviewer/设计评审） |
| 决定后需更新 | 候选 §4.1–4.4 状态 PROPOSED→FROZEN；Registry R-ID-04..06；`26_` FIXTURE F-10/F-11 按裁定收敛（42202 触发条件随之明确）；W-2 Normalizer 实现与向量表 |
| 当前状态 | PROPOSED（F-10 来源冲突≠归一化冲突；F-11 占位不伪造向量） |

## CM-7 字典内容（B7，待 PM）

| 维度 | 内容 |
|---|---|
| 现状 | 字典结构 11 字段候选已固定（结构可入契约候选）；**内容**（正式 parameter_code/定义/单位/数据类型）无权威来源；Fixture 仅 DEMO |
| 所需 | PM 提交首个真实种子与命名标准；冻结记录登记来源与版本 |
| 决策人 | PM（提交）→ 冻结记录登记 |
| 决定后需更新 | 候选 §5.2/§5.3；Registry R-DIC-01/02；W-2 字典内容接口；DEMO Fixture 与正式种子的隔离边界保持 |
| 当前状态 | 待 PM 提交（IQ-02 裁定后开放） |

---

**矩阵纪律**：本矩阵不产生任何"选定"；所有候选的影响分析为中性决策输入；每项"决定后需更新"仅为范围预告，实际修订须按 `12_/API_CONTRACT_CANDIDATE_v1.md` §14 变更控制执行（contract-candidate 标注 + 新 SHA-256）。
