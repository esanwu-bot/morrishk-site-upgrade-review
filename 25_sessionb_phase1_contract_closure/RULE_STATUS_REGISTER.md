# RULE STATUS REGISTER · 契约候选规则状态登记（人读版）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-RULEREG-001 |
| 版本 | 1.0.0-draft（与 `rules/rule_registry.json` 同步；以 JSON 为机器可读唯一源） |
| 日期 | 2026-11-21 |
| 分支 | `sessionb/phase1-contract-closure` |
| 状态词表 | `CONFIRMED` = 已登记书面裁定/已核实事实（方向不得违反，技术细节仍可能待冻结）；`PROPOSED` = 契约候选设计建议，未冻结；`PENDING` = 待维护人/决策人裁定；`BLOCKED` = 被未决 IQ/B5–B8/P0 阻断，关闭前不得冻结、不得实现为正式行为 |
| 裁定前提 | IQ-01/02/13 为**已登记裁定**（2026-11-17），均**待签署**、独立验收**未完成**——其 CONFIRMED 仅指裁定方向已登记，不指已生效 |
| 证据 | 每条规则的 `source` 见 `rules/rule_registry.json`（file:line 级引用） |
| 用途 | 注入 `contract/openapi.candidate.v1.1-draft.json` 的 `x-rule-registry` 与逐操作 `x-rule-status`（仅 x-* 元数据，零线形变更，测试 T03 强制） |

统计：**55 条规则** = CONFIRMED 9 / PROPOSED 26 / PENDING 8 / BLOCKED 12。

## 1. 身份域（identity）— 9 条

| ID | 规则 | 状态 | 阻断 |
|---|---|---|---|
| R-ID-01 | 跨系统身份 = MPN + Brand，唯一键 `(mpn_norm, brand_norm)` | **CONFIRMED**（IQ-01 裁定登记，待签署） | — |
| R-ID-02 | `document_id`/`prod-{document_id}` 不得作产品身份或入身份路由 | **CONFIRMED**（同上） | — |
| R-ID-03 | raw 三元组（`mpn_raw`/`brand_raw`/`normalizer_version`）必留 | **CONFIRMED**（同上） | — |
| R-ID-04 | 身份状态机枚举 CONFIRMED/PENDING_BRAND/PENDING_CONFLICT/INVALID | PROPOSED | B5 |
| R-ID-05 | MPN-NORM-v1 九步归一规则集 | PROPOSED | **B5**, P0-4 |
| R-ID-06 | `pbk1_` 编码（长度前缀 canonical + 完整 SHA-256；`normalizer_version` 不入哈希；缺 Brand 不生成键） | PROPOSED | **B5**, P0-4 |
| R-ID-07 | `identity_scope` 是否入业务键 | PENDING | IQ-01 |
| R-ID-08 | 精确查找必须带 brand；缺 brand→422；非法输入→400；不得伪装空结果 | PROPOSED | DIFF-CONTRACT-03 |
| R-ID-09 | `mpn_match=loose` v1 不启用 | BLOCKED | IQ-20 |

## 2. 响应包/错误域（envelope）— 5 条

| ID | 规则 | 状态 | 阻断 |
|---|---|---|---|
| R-ENV-01 | 统一包 `{code,message,data,request_id,meta}`（15 个业务操作） | **BLOCKED** | **IQ-09**, P0-1 |
| R-ENV-02 | 错误时 `data=null`、明细在 `meta`（error_key/retryable/degraded_allowed/field/missing） | **BLOCKED** | **IQ-09**, P0-1（Mock 把明细放 data：DIFF-MOCK-01，随 IQ-09 一并裁定） |
| R-ENV-03 | 20 错误码目录（40901 预留不触发） | PROPOSED | —（外层形状随 IQ-09，码值不变） |
| R-ENV-04 | 服务端 `request_id` = `req_` + ULID26 | PROPOSED | P1-2 |
| R-ENV-05 | 客户端 `X-Request-Id` 回显语义 | PENDING | P1-2 |

## 3. 分页/版本/传输（pagination/versioning/transport）— 7 条

| ID | 规则 | 状态 | 阻断 |
|---|---|---|---|
| R-PTG-01 | 游标分页：limit 默认 50 / 最大 200；游标不透明 | PROPOSED | —（Mock 默认 10/可解析游标 = DIFF-MOCK-02/16） |
| R-PTG-02 | PageMeta 三字段；`has_more` vs `next_cursor` 冲突时序（P2-7） | PROPOSED | P1-10 |
| R-VER-01 | `updated_at`/`data_version`/`etag`；分类加 `taxonomy_version`；并发只用 data_version/ETag | PROPOSED | — |
| R-VER-02 | If-None-Match → 304 无体、非错误 | PROPOSED | —（Mock 未实现 = DIFF-MOCK-03） |
| R-SRT-01 | `sort` 白名单只在 MD、OpenAPI 缺失 | PENDING | P1-1 |
| R-TRC-01 | 限流数值（60/20、树 10、搜索 30）+ 429 Retry-After | PROPOSED | IQ-12 |
| R-DEP-01 | 弃用流程与 v1/v2 兼容窗（90/180 天） | PROPOSED | — |

## 4. OAuth2（oauth）— 7 条

| ID | 规则 | 状态 | 阻断 |
|---|---|---|---|
| R-OA-01 | Client Credentials + opaque token + `client_secret_basic` | PROPOSED | IQ-21 |
| R-OA-02 | TTL 900s / 提前刷新 120s / 偏差 60s / 无 refresh token | PROPOSED | IQ-12, P1-8 |
| R-OA-03 | 撤销传播：60 秒起全体 RS 必须拒绝 | PROPOSED | — |
| R-OA-04 | 撤销机制二选一（RFC 7009 vs 管理端禁用） | PENDING | P1-7 |
| R-OA-05 | 5 scopes；缺 scope 403 不降级；`internal_only` 双 scope；同步最小授权 = 前四 scope | PROPOSED | —（Mock 无校验 = DIFF-MOCK-04） |
| R-OA-06 | 是否允许非生产凭证 | **BLOCKED** | **IQ-21**, P0-1 |
| R-OA-07 | 生产客户端注册/密钥轮换责任人 | **BLOCKED** | IQ-11 |

## 5. 发布/状态域（release-state）— 6 条

| ID | 规则 | 状态 | 阻断 |
|---|---|---|---|
| R-ST-01 | 三闸门顺序固定 pipeline→content→release | PROPOSED | B6 |
| R-ST-02 | 闸门状态三套枚举、三命名空间不得合并（**`PIPELINE_PASS`≠`CONTENT_APPROVED`≠`RELEASE_APPROVED`**） | **BLOCKED** | **B6**, P0-5 |
| R-ST-03 | `visible_state` 枚举 DRAFT/IN_REVIEW/RELEASED/WITHDRAWN + 派生规则 | **BLOCKED** | **B6**, P0-5 |
| R-ST-04 | `release_state` 查询枚举 RELEASED/REVOKED/PENDING（独立命名空间） | **BLOCKED** | **B6**, P0-5 |
| R-ST-05 | 搜索默认 `release_state=RELEASED` + `identity_state=CONFIRMED` | PROPOSED | DIFF-CONTRACT-01（Mock 默认未过滤 = DIFF-MOCK-05） |
| R-ST-06 | 消费方行为表（403 不重试、410 终止态、REVOKED 流必需、304 视为成功） | PROPOSED | — |

## 6. 分类域（taxonomy）— 8 条

| ID | 规则 | 状态 | 阻断 |
|---|---|---|---|
| R-TAX-01 | 技术分类归 Ds Bit / 导航分类归 Morrishk / ID 空间不共享 / 导航分类不经本 API | **CONFIRMED**（IQ-02 裁定登记，待签署） | — |
| R-TAX-02 | 16 操作清单与 13+3 分级（R1 修正后一致性已核） | PROPOSED | —（分级一致性=HANDOVER-CONFIRMED；冻结未批） |
| R-TAX-03 | 单 `taxonomy_id` 假设 vs 体系数量未裁 | **BLOCKED** | IQ-02(§10.5), P1-4 |
| R-TAX-04 | 分类生命周期 + DEPRECATED 保留期 + 410 CATEGORY_RETIRED | **BLOCKED** | **IQ-05**, P0-1 |
| R-TAX-05 | `category_code` 治理与生成 | PENDING | IQ-03 |
| R-TAX-06 | 跨体系多主分类 | PENDING | IQ-04 |
| R-TAX-07 | tree 深度 4 / 5000 节点；超限 413 回退 flat | PROPOSED | — |
| R-TAX-08 | changes 事件枚举 9 种（可选端点） | PROPOSED | — |

## 7. 字典/参数域（dictionary）— 4 条

| ID | 规则 | 状态 | 阻断 |
|---|---|---|---|
| R-DIC-01 | 字典**结构** 11 字段候选 | PROPOSED | B7 |
| R-DIC-02 | 字典**内容** = PM 正式种子（Package/Voltage/Operating_Temperature 待定） | **BLOCKED** | **B7**, P0-6 |
| R-DIC-03 | `DEMO_FIXTURE` 隔离纪律 | **CONFIRMED**（IQ-02 裁定明文） | — |
| R-DIC-04 | `TechnicalParameter` 对外字段集 | PROPOSED | B7, B8 |

## 8. 证据域（evidence）— 3 条

| ID | 规则 | 状态 | 阻断 |
|---|---|---|---|
| R-EV-01 | `EvidenceItem` 字段集（bbox×4/page_number/raw_text≤500/screenshot_reference…） | PROPOSED | B8 |
| R-EV-02 | 证据公开范围未裁 + 文档口径不一致（§11.2 vs 附录 A.3） | **BLOCKED** | **B8**, P0-7, IQ-08 |
| R-EV-03 | 边界：`RELEASE_APPROVED` ≠ 证据无限制公开；产品发布批准 ≠ Morrishk 营销内容批准 | **CONFIRMED**（交接指令边界 + 验收包非声明一致；属交接确认，非库内批准记录） | — |

## 9. 产品 DTO 域（product-dto）— 3 条

| ID | 规则 | 状态 | 阻断 |
|---|---|---|---|
| R-PRD-01 | Product 必填集；`visible_state` 只在 /status（分工待书面化） | PROPOSED | P1-9 |
| R-PRD-02 | 搜索条目形状：完整 Product[]（OpenAPI）vs 扁平身份行（EX-17/Mock）——候选内部矛盾 | PENDING | DIFF-CONTRACT-01, P1-9 |
| R-PRD-03 | `platform` 映射信息是 Mock-only 演示数据、**不是**契约的一部分 | **CONFIRMED**（已核实事实） | — |

## 10. 全局治理（governance）— 3 条

| ID | 规则 | 状态 | 阻断 |
|---|---|---|---|
| R-GLOB-01 | 契约状态保持 `CANDIDATE_NOT_FROZEN` 直至独立冻结记录 | **CONFIRMED**（Reviewer 报告已核实事实） | — |
| R-GLOB-02 | 冻结门槛 = 7/7 裁定+签署 + 权威分支 + 五项复验 + 独立冻结记录 | **BLOCKED** | P0-1, P0-2, P0-3 |
| R-GLOB-03 | 目标系统 = Morrishk 新平台业务库；旧站不作目标；自增 ID 不作跨系统身份 | **CONFIRMED**（IQ-13 裁定登记，待签署） | — |

---

**登记口径声明**：本登记不改变任何 IQ/裁定状态；CONFIRMED 的 IQ-01/02/13 相关条目均带「已登记、待签署、未独立验收」注记；本登记**不是**冻结记录，也不是对任何 PENDING/BLOCKED 项的代裁。
