# P0-2 Owner 决策证据包（7 项）

| 项 | 值 |
|---|---|
| 文档编号 | REVIEW-P02-OWNER-EVIDENCE-20261125 |
| 版本 | v1.0（证据收集与选项分析；**不代裁、不实施**） |
| 日期 | 2026-11-25（Asia/Shanghai） |
| 代码权威基线 | `feat/gate6a-audit@5dcecd21a9bf3f7f7046cc8c769fcfbcd2adf1e5` |
| 代码决策分支 | `docs/p0-2-dc-decision-20261125@75a0f31` |
| 证据评审仓 | `E:\workspace\独立站\morrishk-site-upgrade-review`（`origin=https://github.com/esanwu-bot/morrishk-site-upgrade-review.git`） |
| 引证提交 | `27e62b159394b2a95002e0ffb98c054f164aef7b`（`27e62b1`，2026-11-23） |
| 性质 | 事实+推断+建议；**不含 Owner 裁决、不含代码/DDL/API 变更** |

**标记约定：** 【事实】= 直接引用/实测；【推断】= 由事实推出的判断；【建议】= 供 Owner 参考，未获批准。
**状态词：** `OPEN`（待裁）、`NOT_SPECIFIED`（无权威声明）、`SOURCE_UNAVAILABLE`（原文不可得）、`PROPOSED`（候选未冻结）。

---

## 0. 基线与证据来源核验

【事实】执行前核验：

| 项 | 实测 |
|---|---|
| 工作分支 | `docs/p0-2-dc-decision-20261125` |
| 工作 HEAD | `75a0f31233b37f9732fa58852e406f7c0511201f` |
| 权威分支 `feat/gate6a-audit` | `5dcecd21a9bf3f7f7046cc8c769fcfbcd2adf1e5`（未变） |
| 远端 `origin/feat/gate6a-audit` | 同 SHA |
| 工作区 | clean（0 变更） |
| `stash@{0}` | `P0-2 exclude 20 worktree items 2026-11-23`（未触碰） |

【事实】评审仓可访问（本地 clone + GitHub origin）。当前工作树 HEAD 为 `c22dc4d`（分支 `docs/postiz-agpl-compliance-audit`，有 7 项未提交改动）；本轮**从被引证提交 `27e62b1` 读取不可变 blob** 作为证据，避免受工作树改动影响。

**引证更正（重要）**：任务给出的 IQ-01 原文位置 `16_/FREEZE_READINESS_REVIEW.md:166-176`，在 `27e62b1` 上实际是 **P0-2（Ds Bit 权威分支复验）** 段落，**不是** IQ-01。IQ-01 相关内容位于同文件 **P0-3（`:178-183`）**，其正文在 `14_/DECISION_REGISTER.md §2.1` 与 `14_/IQ01_PRODUCT_IDENTITY_ADJUDICATION.md §9`。详见 §2。

---

## 1. DB engine / version

### 1.1 事实

| 证据 | 路径:行 | 内容 |
|---|---|---|
| Phase 0 无数据库 | `docs/DECISIONS.md:54-57`（D09） | "No database in Phase 0… pipeline must run without a DB. Run artifacts are JSON files under `runs/<run_id>/`."；"SQLite may store run metadata later" |
| 拒绝 ORM | `docs/DECISIONS.md:8-9`（D01） | "Rejected: SQLAlchemy models in Phase 0 (would make the DB a runtime prerequisite)." |
| 解析服务不建库 | `workbench/serve_parser.py:18` | "不接入任何 LLM Provider，不建数据库，不写 PostgreSQL。" |
| 解析 worker 不建库 | `workbench/parse_worker.py:17` | "不 import fastapi、不接入 LLM、不连数据库、不写 PostgreSQL…" |
| 依赖无 DB 驱动/ORM | `pyproject.toml:12-20` | 仅 pymupdf/pydantic/typer/rich/python-dotenv/pillow/pyyaml；dev 仅 pytest |
| 环境模板无 DSN | `.env.example` | 仅 DASHSCOPE/LLM/RENDER_DPI/RUNS_DIR，无 DB 连接串 |
| 分析湖用 DuckDB | `lake/README.md:4,20`；`lake/catalog.duckdb` | DuckDB + Parquet；三张表 `raw_docs`/`parse_runs`/`eval_results`（`14_/DSBIT_AUTHORITY_BASELINE.md:96`），无产品主表 |
| 依赖锁含 PyMySQL | `lake/parse_layer/_dependency_lock.txt:1` | `PyMySQL==1.2.3`（整机 pip freeze 快照，含 celery/redis/fastapi/duckdb 等） |
| IQ-15 未裁定 | `14_/DECISION_REGISTER.md:36` | "IQ-15 新表引擎与字符集 | 运维 + Morrishk 技术负责人 | — | …"（空=未裁） |
| 建议性方向（未决） | `12_/INTEGRATION_OPEN_QUESTIONS.md:293-299` | 选项 A："Ds Bit 新建知识库（**推荐 PostgreSQL**），存产品/分类/版本/审批/发布"；"Phase 1 可先用 SQLite/PostgreSQL 本地实例，但表结构必须按生产设计" |

【事实】MySQL 相关证据均**不属于 Ds Bit 目标库**：
- 旧站：`12_/INTEGRATION_OPEN_QUESTIONS.md:649`（Yii2 / MySQL 5.6.50 / MyISAM）；
- 新平台迁移：`12_/…Integration Design v1.md:219`（MySQL 8.0.12，明确禁止 production）；
- `04_database/06_compatibility_scan.txt`（MySQL 5.6→8.4）针对旧站 schema。

### 1.2 推断

- 【推断】当前仓库**不存在**产品身份数据库的权威 engine/version 声明；`lake` 的 DuckDB 是分析湖，不是产品主数据存储。
- 【推断】`_dependency_lock.txt` 的 `PyMySQL` 是**环境快照副产物**，不能作为"目标库为 MySQL"的声明（同一文件还含 celery/redis/fastapi，均非本项目运行依赖）。
- 【推断】评审仓对持久化的**建议**是 PostgreSQL，但属开放问题（IQ-15）选项，不是裁定。

### 1.3 状态

`DB engine / version = NOT_SPECIFIED`（代码仓与评审仓均无权威裁定；IQ-15 仍空）。

### 1.4 可选方案与影响

| 方案 | 迁移/兼容影响 | 备注 |
|---|---|---|
| A. PostgreSQL（评审仓建议，未裁） | 支持部分唯一索引、CHECK、JSON、timestamptz；与设计候选类型贴合；需新建部署 | 与旧站 MySQL 不同栈，需独立运维 |
| B. MySQL 8.4 | 支持部分唯一索引（8.0.13+）、CHECK；与"旧站/新平台"同栈运维熟悉 | 需处理 MyISAM→InnoDB、utf8mb4 兼容历史 |
| C. MySQL 5.6 兼容 | **无部分唯一索引/CHECK/JSON**（设计中的 ACTIVE 部分唯一需应用层保证） | 仅当必须与旧库同机同版本；不推荐作新产品库 |
| D. SQLite（本地/单机） | 仅适合本地/测试；并发与多租户能力弱 | 不满足生产多租户 |
| E. 维持无库（runs/ JSON） | 无法满足 D-C 跨文档身份与唯一性 | 与 P0-2 目标冲突 |

【建议】不代裁。若 Owner 需要参考：优先在 A/B 中选定并写明版本；无论哪种，都必须同时裁定 IQ-15（引擎与字符集）与迁移/回滚策略。

### 1.5 Owner decision（留空）

| 字段 | 值 |
|---|---|
| Owner decision | ________（A/B/C/D/E 或其他） |
| Engine / Version | ________ |
| 决策日期 / 签署 | ________ |

---

## 2. IQ-01（registry constraint）

### 2.1 原文可达性【事实】

| 项 | 值 |
|---|---|
| 评审仓 | `E:\workspace\独立站\morrishk-site-upgrade-review` |
| 引证提交 | `27e62b159394b2a95002e0ffb98c054f164aef7b` |
| `16_/FREEZE_READINESS_REVIEW.md` SHA-256 | `5bd5bf1b293e455877a411bf89e441c6c41818f0f2543d2379bb033709fd3542` |
| `14_/DECISION_REGISTER.md` SHA-256 | `68b6b259ac1d61ceab59f4bfa61849dae49097e68711d8c9a23e6af828b8daf0` |
| `14_/IQ01_PRODUCT_IDENTITY_ADJUDICATION.md` SHA-256 | `2e19b28944f1ad025920502f737ac1fe954373645133afbf0e73989637fcb491` |

原文关键行（`14_/DECISION_REGISTER.md §2.1`，`:46-59`）：

- `:46` 正式废弃 `doc-id` 作为跨系统产品主键。
- `:47` `prod-{document_id}` 仅作文档处理/解析/流转的内部临时凭证；**不得**作产品主键、跨系统业务键、永久身份、分类映射键。
- `:48` 正式采用 **MPN + Brand** 作为统一跨系统产品业务身份。
- `:52` 唯一键为 `(mpn_norm, brand_norm)`。
- `:54` `product_business_key` 必须确定性生成；须文档化编码/分隔/空值/哈希算法；**不得**只用未经碰撞分析的截断哈希。
- `:57` 缺 Brand/无法确认/归一冲突 → 待确认状态，不得自行合并。
- `:58` **推翻的既有假定**：原 IQ-01 建议 A（**Ds Bit 全局注册表 + ULID `product_id`**）…
- `:59` **不在裁定内**：`product_business_key` 的哈希/编码、`MpnNormalizer` 细节、`identity_scope` 是否入键。

`14_/IQ01_PRODUCT_IDENTITY_ADJUDICATION.md §9`：

- `:263` "**不引入 Ds Bit 全局注册表**；`prod-{document_id}` 降级…；跨系统身份由 `product_business_key` 承载"。
- `:279` 本文 §5 选项 A（Ds Bit 注册表 + ULID）**不再是方向**。
- `:285` 仍开放：`MpnNormalizer` 规则与版本号、`product_business_key` 哈希/编码、`identity_scope` 是否入键、Brand 主数据来源。

签署状态【事实】：`DECISION_REGISTER.md §2.4:92` IQ-01 = **待签署 / 独立 Reviewer 验收未完成**；`16_/FREEZE_READINESS_REVIEW.md:178-183` P0-3 记录同一状态。

### 2.2 推断

- 【推断】IQ-01 的措辞针对 **"Ds Bit 全局注册表"** 与 **"注册表签发 ULID 型 product_id"**，并未逐字覆盖"某个租户/本地内部身份表"。
- 【推断】因此"内部 Product Identity Table 是否合规"仍属**解释性空白**：既未明确允许，也未明确禁止。
- 【推断】字面最接近的是"采用自然键、拒绝注册表"（选项 B 路线），D-C 的 surrogate `product_uid` 需要 Owner 明确再审。

### 2.3 状态

- 原文：**可取得**（非 `SOURCE_UNAVAILABLE`）。
- 约束解释：**`OPEN`**（不得改判为 `RESOLVED`）。

### 2.4 两种解释及影响

| 解释 | 含义 | 对 D-C 的影响 | 对跨 PDF 身份的影响 |
|---|---|---|---|
| **A** | 禁止**外部** Global Product Registry；允许**内部** Product Identity Table | D-C-01 内部不可变 `product_uid` 可保留；内部表按 Tenant/Catalog 限定 | 同 `(mpn_norm,brand_norm)` 跨 PDF → 同一 `product_uid`；注册表仅本地、非跨系统 |
| **B** | 禁止**任何**内部或外部产品身份注册机制 | D-C-01 的代理键注册表**不可用**；身份只能由确定性自然键承载（否则需修订 D-C） | 跨 PDF 身份 = 确定性 `pbk`（mpn+brand）相等即同一；merge/split/alias 需靠确定性重算+审计日志，无注册表 |

【建议】请 Owner 二选一并书面记录；若选 B，需同步修订 D-C-01（代理键）与迁移策略；若选 A，需明确"内部表"不得对外充当全局注册服务。

### 2.5 Owner decision（留空）

| 字段 | 值 |
|---|---|
| IQ-01 interpretation | ________（A / B / 其他） |
| 说明 | ________ |
| 决策日期 / 签署 | ________ |

---

## 3. B5 `pbk` encoding

### 3.1 事实

| 证据 | 路径:行 | 内容 |
|---|---|---|
| 候选编码 | `12_/API_CONTRACT_CANDIDATE_v1.md:120-132` | `canonical = "PBK1\n" + utf8ByteLen(mpn_norm)+":"+mpn_norm + "\n" + utf8ByteLen(brand_norm)+":"+brand_norm`；`key = "pbk1_" + lowercase_hex(sha256(UTF-8(canonical)))` |
| 约束 | 同上 `:128-132` | UTF-8 字节长度；完整 SHA-256 不截断；`pbk1_`+64 位小写 hex=69 字符；`normalizer_version` **不进入**哈希；缺 Brand 不生成键；编码仍候选，冻结后变更=不兼容 |
| 状态 | `12_/API_CONTRACT_CANDIDATE_v1.md:444`（§11.2 B5） | `B5 … PROPOSED，未评审冻结` |
| 未裁项 | `14_/DECISION_REGISTER.md:59` | `product_business_key` 的哈希/编码仍为设计待定 |
| 依赖 | `27_/B5_B8_DEPENDENCY_MATRIX.md:13,22-27` | 影响 OP-02/03/05/06/07 的 `product_business_key`；模式 `^pbk1_[0-9a-f]{64}$`；需向量化测试+碰撞分析；冻结后变更=不兼容 |

【事实】`pbk` 是**外部可见**标识：产品路由 `/products/{pbk}`（`12_/API_CONTRACT_CANDIDATE_v1.md:344-348`），DTO 字段 `product_business_key`（`API_CONTRACT_EXAMPLES.md`）。
【事实】当前**无生产数据、无实现、无调用方**：仓库无 DB/API 实现（D-B `05_backend.txt`）；契约示例中的 pbk 值仅为示例。

### 3.2 推断

- 【推断】`pbk` 的**正式定义存在为候选（PROPOSED）**，但**未冻结**，不构成权威规范。
- 【推断】由于无生产/调用方，当前调整 `pbk` 的兼容成本接近零；一旦冻结并对外发布，变更即为破坏性。

### 3.3 状态

`B5 = PROPOSED / NOT_FROZEN`。

### 3.4 可选方案与风险

| 方案 | 做法 | 风险 |
|---|---|---|
| 1. 保留现有候选编码并冻结 | 以 §4.3 的 `pbk1_` 公式为准，补向量化测试+碰撞分析后冻结 | 需一次冻结评审；若归一规则后续变化需 pbk2 |
| 2. 版本化迁移 | 冻结后如需改，发 `pbk2_`，保留 `pbk1_`→`pbk2_` 映射与双读 | 迁移/映射成本；下游需兼容两版 |
| 3. 允许调整（冻结前） | 在 B5 冻结前修订候选（如加入/排除字段、改 canonical） | 无生产影响；但必须文档化并重新评审，不得静默改 |

【建议】优先方案 1：在**实现前**冻结 §4.3 候选，并补齐"固定输入→期望 pbk"的跨版本向量测试与完整 SHA-256 碰撞说明；不做无依据的编码改动。

### 3.5 Owner decision（留空）

| 字段 | 值 |
|---|---|
| B5 方案 | ________（1 / 2 / 3） |
| 是否冻结 `pbk1_`（§4.3） | ________ |
| 决策日期 / 签署 | ________ |

---

## 4. `identity_scope`

### 4.1 事实

| 证据 | 路径:行 | 内容 |
|---|---|---|
| 枚举定义 | `src/icpdf/domain/product.py:12-16` | `DEVICE / BOARD / ONBOARD_DEVICE / UNKNOWN` |
| 字段 | `src/icpdf/domain/product.py:50` | `identity_scope: IdentityScope = UNKNOWN` |
| 运行链恒为 unknown | `src/icpdf/parser/pipeline.py:156` | `identity_scope="unknown"` |
| 契约枚举 | `12_/contract/openapi.candidate.v1.json:969` | `["DEVICE","BOARD","ONBOARD_DEVICE","UNKNOWN"]` |
| 是否入键 | `14_/DECISION_REGISTER.md:59`；`14_/IQ01…§9.4`；`12_/…Integration Design v1.md:752` | 均标 `OPEN`（"是否入键 OPEN"） |
| 地位问题 | `12_/INTEGRATION_OPEN_QUESTIONS.md:74` | 同 MPN 可能对应裸芯片与评估板（`AFE7950` vs `AFE7950EVM`），当前链路不能可靠区分 |

### 4.2 分析【推断】

- 关系链：`Manufacturer`（法律实体）→ `Brand`（商业品牌）→ `Product`（`mpn_norm + brand_norm`）；`identity_scope` 描述**物理形态**（裸片/评估板/板载）。
- **入键方案**：`(mpn_norm, brand_norm, identity_scope)`，`pbk` 需相应纳入 scope → 与当前 §4.3（仅 mpn+brand）冲突，等同 B5 变更；优点是避免 EVM/芯片误合并；缺点依赖可靠的 scope 判定（当前不可靠）。
- **仅匹配范围方案**：键仍为 `(mpn_norm,brand_norm)`；scope 仅用于过滤/标注；风险是 EVM 与芯片同 MPN 同品牌时可能被合并 → 必须把 scope 冲突作为**人工复核触发**，不得自动合并。
- 与 Tenant/Product Catalog：scope 不是租户维度；身份匹配在授权 Tenant/Catalog 内进行（D-C-05）。
- 跨 Tenant 共享需求：设计文档无已批准需求；首期禁止（`OAUTH…:61`，D-38 延后），待 Owner。

### 4.3 状态

`identity_scope 是否入键 = OPEN`。

### 4.4 可选方案与影响

| 方案 | 对重复产品 | 对租户隔离 | 对合并/查询 |
|---|---|---|---|
| 入键 | 减少 EVM/芯片误合并 | 不影响（scope 非租户） | pbk 需变更；查询可按 scope 精确过滤 |
| 不入键（仅匹配范围+冲突复核） | 可能产生同 MPN 多形态歧义，需人工 | 不影响 | 保持现有 pbk；查询依赖标注 |

【建议】不代裁。参考方向：v1 **不入键**、把 scope 冲突升级为人工复核（保护现有 pbk 与不可靠的 scope 判定），待 scope 判定可靠后再以 `pbk2` 纳入；但这是建议，须 Owner 决定。

### 4.5 Owner decision（留空）

| 字段 | 值 |
|---|---|
| identity_scope 是否入键 | ________（入键 / 不入键 / 其他） |
| 冲突处理 | ________ |
| 决策日期 / 签署 | ________ |

---

## 5. Tenant / Product Catalog isolation

### 5.1 事实

| 证据 | 路径:行 | 内容 |
|---|---|---|
| Tenant/Site/TPA 为**设计候选** | `reviewer/p0_2_design_preparation_20261125/OAUTH_TENANT_SITE_TPA_ARCHITECTURE.md:4-8` | "v1.0 设计候选（**未实现**）" |
| 租户上下文只从 Token 派生 | 同上 `:50-52` | 请求体/查询参数中的 tenant/site 不采信 |
| TPA 级别与判定顺序 | 同上 `:55-61` | `QUERYABLE`/`EXECUTABLE`；Token→Scope→TPA→可见性 |
| 跨租户共享首期禁止 | 同上 `:61` | "跨租户共享/协作首期禁止（D-38），是否允许由 Owner 决策" |
| 全局 vs 私有边界 | `BACKEND_DATA_MODEL_AND_MIGRATION_DESIGN.md:77-83` | Product/Brand/Manufacturer 全局；Document/Evidence 带 `owner_tenant_uid` 默认私有 |
| 无实现 | D-B `05_backend.txt` | 无 DB/API/OAuth 实现 |
| 75 矩阵不编码租户 | `75_ITEM_AUTHORIZATION_READINESS.md` | Scope 回答"能读哪类资源"，租户由 TPA 决定 |

### 5.2 推断

- 【推断】Tenant / Site / TPA / Product 均为**设计候选，未实现**，不得描述为现有功能。
- 【推断】**Product Catalog** 在现有设计中**未作为独立实体定义**；当前是"全局 Product + TPA 授权"，而非"租户自有目录"。
- 【推断】"共享产品与租户私有属性如何区分"未定：设计只区分全局实体与租户私有文档/证据，未定义租户级产品属性覆盖。

### 5.3 状态

`Tenant/TPA = DESIGN_CANDIDATE_NOT_IMPLEMENTED`；跨租户共享 = `OPEN`；Product Catalog 定义 = `OPEN`。

### 5.4 需 Owner 决策事项

1. Product Catalog 是"全局产品集 + TPA 过滤"还是"租户自有目录"？
2. 是否允许跨租户共享产品（D-38）？
3. 共享产品与租户私有属性（价格/备注/可见性）如何分层存储与鉴权？
4. 隔离实现模型（行级多租户 vs 分库/分 schema）——与 §1 DB 选型联动。

### 5.5 Owner decision（留空）

| 字段 | 值 |
|---|---|
| Product Catalog 模型 | ________ |
| 跨租户共享 | ________（允许/禁止/延后） |
| 私有属性分层 | ________ |
| 决策日期 / 签署 | ________ |

---

## 6. B8 evidence exposure

### 6.1 事实

| 证据 | 路径:行 | 内容 |
|---|---|---|
| B8 状态 | `12_/API_CONTRACT_CANDIDATE_v1.md:447`（§11.2） | `B8 证据公开范围与截图可获取性 | OPEN（IQ-08）` |
| 口径不一致 | `16_/FREEZE_READINESS_REVIEW.md:208-214`（P0-7） | 候选 §11.2 列 B8 为冻结阻断；主文档附录 A.3 标 Phase 2 → 需先统一口径，再裁定或书面豁免 |
| 影响面 | `27_/B5_B8_DEPENDENCY_MATRIX.md:51-60` | 影响 OP-06 `/evidence` 暴露白名单、OP-03 证据关联；75 矩阵行 35；SEC-10；截图通道；`RELEASE_APPROVED` ≠ 证据无限制公开 |
| 证据规范可见性 | `PARSER_EVIDENCE_ARTIFACT_SPEC.md:155-160` | 首期 `visibility=PRIVATE`；公开字段白名单需 Owner/法务（B8）；保留策略 SB-04 `OPEN` |

### 6.2 建议访问层级（【建议】，非批准策略）

| 数据类别 | 外部 API | 租户内部（TPA+可见性） | 管理员 |
|---|---|---|---|
| 原始 PDF / 原始文件 URL | **禁止公开**（建议短期签名链接，不暴露存储路径） | 授权可见 | 允许 |
| `evidence.json` | 仅按 B8 裁定的**脱敏子集**（默认不暴露） | 按 TPA + visibility | 允许 |
| `qc_report` | **不对外**（内部质检） | 仅摘要 | 允许 |
| 页码 / bbox / 文本片段 | 仅白名单字段（raw_text 限长、可脱敏） | 允许（限长/脱敏） | 允许 |
| 供应商来源信息 | **禁止** | 受限/脱敏 | 允许 |
| parser/model error | **禁止原文**（仅错误码） | 脱敏错误码 | 允许完整 |
| 内部路径 / 堆栈 / 日志 / token | **禁止** | **禁止** | 日志允许；**token 永不出库/出日志** |

【推断】当前无任何已批准的公开白名单；上表仅为最小暴露原则的建议，须 Owner/法务裁定后方可写入契约。

### 6.3 状态

`B8 = OPEN (IQ-08)`；口径 `OPEN`。

### 6.4 Owner decision（留空）

| 字段 | 值 |
|---|---|
| B8 是否属冻结阻断 | ________ |
| 公开白名单（逐类） | ________ |
| 截图获取通道 | ________ |
| 决策日期 / 签署（含法务/业务） | ________ |

---

## 7. CRLF snapshot test

### 7.1 事实

| 证据 | 路径:行 | 内容 |
|---|---|---|
| 测试 | `tests/unit/test_assembly.py:579-595` | 读取 `src/icpdf/parser/pipeline.py` 字节并 `sha256`，断言等于 `PIPELINE_A3_W1_SHA256` |
| 期望值 | `tests/unit/test_assembly.py:72-74` | `3394bb66e94c000fd726d466cb5c56ab6a0747c9bcfdfee3f44684a11d4bef0a` |
| 实测失败值 | D-B `07_full_pytest.log` | `86c0054969572c17f8bc19d5bd14f332053a5926c0a2300777c79ac6ab1b2fa5` |

【事实】本轮独立复算（只读）：

| 度量 | 值 |
|---|---|
| 工作区文件 bytes sha256 | `86c0054969572c17f8bc19d5bd14f332053a5926c0a2300777c79ac6ab1b2fa5` |
| 工作区 CRLF 数 / 裸 LF 数 | 198 / 0 |
| 工作区 **CRLF→LF 归一** 后 sha256 | `3394bb66e94c000fd726d466cb5c56ab6a0747c9bcfdfee3f44684a11d4bef0a`（= 期望值） |
| `HEAD` blob 内容 sha256 | `3394bb66e94c000fd726d466cb5c56ab6a0747c9bcfdfee3f44684a11d4bef0a`（CRLF 数 0） |
| `core.autocrlf` | `true`；仓库根无 `.gitattributes` |
| `lake/.gitattributes:1-4` | `* -text`（为字节保真关闭换行转换） |

### 7.2 推断

- 【推断】失败**纯由换行符**导致：仓库内 blob 为 LF（`3394bb…`），工作区被 autocrlf 检出为 CRLF（`86c005…`）；LF 归一后与期望完全一致。
- 【推断】不影响业务行为，仅影响字节级快照断言；测试其余语义断言（`detect_tables_with_evidence` 等）仍有效。
- 【推断】该失败为既有问题；D-B 回归 `1 failed / 21 skipped / 2 xfailed` 不得重分类为通过。

### 7.3 状态

`root cause = CONFIRMED (line-ending)`；处置方式 = `OPEN`。

### 7.4 可选方案与影响

| 方案 | 做法 | 影响 |
|---|---|---|
| **A** 保持跨平台字节一致 | 为被固定文件加 `.gitattributes` `-text`（或 `eol=lf`）确保检出=blob；测试不变 | 需评估对全仓换行策略影响；最严格字节保证 |
| **B** 规范化测试方式 | 测试内先把 `\r\n`→`\n` 再哈希；保留字节/语义断言 | 改动最小、跨平台；断言语义从"绝对字节"变"LF 归一字节" |
| **C** Owner 正式豁免 | 书面豁免该断言，记录风险与范围（仅环境换行） | 失去防线；须有替代语义测试 |

【建议】优先 **B**（测试内 EOL 归一且保留语义断言），若要求绝对字节一致则用 **A**；无论哪种，**D-C 实现修改 `pipeline.py` 后，快照哈希必须另行重新授权**（两件事相互独立）。不得自行修改测试或把失败标为通过。

### 7.5 Owner decision（留空）

| 字段 | 值 |
|---|---|
| CRLF 处置 | ________（A / B / C） |
| 是否同步重授权 pipeline 新快照 | ________ |
| 决策日期 / 签署 | ________ |

---

## 8. 汇总：状态与 Owner 决策待办

| # | 决策项 | 当前状态 | 建议（不代裁） | Owner decision |
|---|---|---|---|---|
| 1 | DB engine / version | `NOT_SPECIFIED` | 在 PostgreSQL / MySQL 8.4 中选定并同时裁 IQ-15 | ________ |
| 2 | IQ-01 registry constraint | 原文可得；解释 `OPEN` | 明确 A（允许内部表）/ B（禁止注册机制） | ________ |
| 3 | B5 `pbk` encoding | `PROPOSED / NOT_FROZEN` | 按 §4.3 冻结 + 向量/碰撞测试 | ________ |
| 4 | `identity_scope` | `OPEN` | 建议 v1 不入键、冲突转人工复核 | ________ |
| 5 | Tenant / Product Catalog | `DESIGN_CANDIDATE / NOT_IMPLEMENTED` | 明确 Catalog 模型、跨租户共享、私有属性分层 | ________ |
| 6 | B8 evidence exposure | `OPEN (IQ-08)` | 先统一口径，再裁白名单或书面豁免 | ________ |
| 7 | CRLF snapshot | 根因已确认；处置 `OPEN` | 方案 B（或 A），并另批 pipeline 快照重授权 | ________ |

> 以上所有 `OPEN` / `NOT_SPECIFIED` 状态在 Owner 书面决定前保持原样。

---

## 9. 证据索引（路径 · 提交 · SHA-256）

### 9.1 代码仓（`E:\workspace\icpdf-extractor`）

| 文件 | 引用 |
|---|---|
| `docs/DECISIONS.md` | D01:8-9；D09:54-57 |
| `workbench/serve_parser.py` | :18 |
| `workbench/parse_worker.py` | :17 |
| `pyproject.toml` | :12-20 |
| `.env.example` | 全文 |
| `lake/README.md` / `lake/.gitattributes` / `lake/parse_layer/_dependency_lock.txt` | :1 / :1-4 / :1 |
| `src/icpdf/domain/product.py` | :12-16, :50 |
| `src/icpdf/parser/pipeline.py` | :152, :155, :156 |
| `tests/unit/test_assembly.py` | :72-74, :579-595 |

### 9.2 评审仓（`morrishk-site-upgrade-review @ 27e62b1`）

| 文件 | SHA-256（@27e62b1） |
|---|---|
| `16_contract_freeze_readiness/FREEZE_READINESS_REVIEW.md` | `5bd5bf1b293e455877a411bf89e441c6c41818f0f2543d2379bb033709fd3542` |
| `14_phase0_authority_adjudication/DECISION_REGISTER.md` | `68b6b259ac1d61ceab59f4bfa61849dae49097e68711d8c9a23e6af828b8daf0` |
| `14_phase0_authority_adjudication/IQ01_PRODUCT_IDENTITY_ADJUDICATION.md` | `2e19b28944f1ad025920502f737ac1fe954373645133afbf0e73989637fcb491` |
| `12_dsbit_business_api_integration_design/API_CONTRACT_CANDIDATE_v1.md` | `948da30aaf31f40094920cbf488ab568fce6055dbd0074747ee1340c133d3b0a` |
| `12_dsbit_business_api_integration_design/INTEGRATION_OPEN_QUESTIONS.md` | `28abef441a819c33160503929e3204f49a3e695091c4da693f966c913cf2037a` |
| `27_sessionb_phase3_freeze_signoff_readiness/B5_B8_DEPENDENCY_MATRIX.md` | `407e6e1584bb82f93457303391d16c5f12515b9d0438b89461ac40c524cffc61` |

### 9.3 本地设计包（`@1034338`，handoff 副本）

| 文件 | 用途 |
|---|---|
| `PRODUCT_IDENTITY_AND_GLOBAL_ID_DESIGN.md` | D-C 设计候选 |
| `BACKEND_DATA_MODEL_AND_MIGRATION_DESIGN.md` | 模型/隔离/迁移 |
| `OAUTH_TENANT_SITE_TPA_ARCHITECTURE.md` | Tenant/Site/TPA |
| `PARSER_EVIDENCE_ARTIFACT_SPEC.md` | evidence/qc/visibility |
| `P0_P1_DEPENDENCY_AND_CLOSURE_MATRIX.md` | P0/P1 依赖 |

---

## 10. 边界声明

- 本轮仅做证据收集、选项分析与决策材料准备；**未**实施代码、DDL、API、OAuth、数据库迁移。
- **未**修改原始 D-B 证据、`runs/`、原始哈希清单或 D-B 结论归档。
- **未**替 Owner 作出任何业务裁决；所有 Owner decision 字段留空。
- **未**把 `OPEN` / `NOT_SPECIFIED` / `PROPOSED` 改写为已解决/已批准/已冻结。
- **未**触碰权威分支与 `stash@{0}`；**未**推送、未合并。
- 状态门槛保持：P0-2 `BLOCKED`；C2 `FAIL`；Business API `NOT_APPROVED`；Contract Freeze `NOT_READY`；Backend Architecture `NO`；75-item `0/75`；Production-ready `NO`。
