# OWNER DECISION · D-C 产品身份设计方案

| 项 | 值 |
|---|---|
| 决策编号 | D-C |
| 决策状态 | **`OWNER_DECISION_ACCEPTED`**（架构建议已接受；契约未全部冻结） |
| 决策日期 | 2026-11-25（Asia/Shanghai，实际执行日期） |
| 决策人 | 项目 Owner |
| Owner acceptance | **已接受 D-C 设计方向与 7 项决策建议**（见「验收证据」） |
| Final Decision Round | **D-1…D-7 原则已接受（`OWNER_DECIDED`）；技术验证/精确规范仍 `OPEN` / `NOT_READY`；正式 Sign-off Pending** |
| Acceptance evidence | 本轮 Owner 指令（Session B「Owner Final Decision Round 执行指令」，2026-11-25） |
| Decision scope | **设计/架构裁决**，不是代码实施授权 |
| Implementation authorization | **NOT_GRANTED** |
| IQ-01 interpretation | **`OWNER_INTERPRETED`**：Owner 已裁定（解释性）；原文事实与解释分列见 §3。IQ-01 **签署仍 PENDING** |
| 记录性质 | 决策转录；**不含电子签名、身份验证、时间戳凭证或外部签署件**；不构成实现授权、契约冻结、架构验收或生产准入 |

---

## 1. 基线

| 项 | 值 |
|---|---|
| 权威仓库 | `E:\workspace\icpdf-extractor` |
| 权威分支 | `feat/gate6a-audit` |
| 权威基线 | `5dcecd21a9bf3f7f7046cc8c769fcfbcd2adf1e5` |
| 设计准备分支 | `docs/p0-2-design-preparation-20261125` |
| 设计准备提交 | `10343388d55b79265478be50ba94021ebba53433` |
| 身份设计候选 | `reviewer/p0_2_design_preparation_20261125/PRODUCT_IDENTITY_AND_GLOBAL_ID_DESIGN.md`（`@1034338`） |
| 后端数据模型设计 | `reviewer/p0_2_design_preparation_20261125/BACKEND_DATA_MODEL_AND_MIGRATION_DESIGN.md`（`@1034338`） |
| D-B 结论归档 | `E:\workspace\_p0_2_revalidation_20261125\REVIEWER_D_B_CONCLUSION_ARCHIVE_20261125.md`，SHA-256 `CD4473F6CF4A8EE1B893BF3423B4241958CFE951653FDE18C5904AA430231562` |

> 本决策记录不改变权威基线；`stash@{0}` 不属于基线、不得恢复或合并。

---

## 2. Owner 已接受的设计方向（正式记录）

### D-C-01 Product Identity
采用系统内部稳定且不可变的 `product_id`（代理键）。
`product_id` **不直接**由 MPN、Brand 或 Manufacturer 计算。

### D-C-02 Natural Key
规范化后的 `MPN + 可信 Brand/Manufacturer` 作为**身份匹配依据**，**不作为主键**。
自然键相同**不**代表在所有情况下都可以自动合并。

### D-C-03 Document Relationship
Document 是来源文件，**不等于** Product。
多个 Document 可通过显式 Product-Document 关系关联到同一 Product。
每份 Document 保留自己的 hash、来源、版本与 parse history。

### D-C-04 Registry Scope
本阶段**不引入外部 Global Product Registry**（Owner 已裁定：禁止 Ds Bit 跨系统统一产品身份
注册、分配与共享的外部全局注册服务）。
**允许**业务系统内部建立 **Product Identity Table** 作为内部持久化实体（Owner 解释性裁决，详见 §3）。
IQ-01 原文事实、Owner 解释与本轮新增决策必须分列，**不得**声称 IQ-01 原文已明确允许内部身份表。
内部代理键不得授权未经批准的跨租户共享。

### D-C-05 Identity Scope
默认在授权 Tenant / Product Catalog 作用域内匹配产品。
跨 Tenant 产品共享**不属于**本阶段范围。

### D-C-06 Conflict Handling
MPN 缺失、Brand 缺失、自然键冲突、关键属性冲突或规范化歧义时，**不得静默合并**。
必须支持 `unresolved / human review` 的设计路径。
产品 `merge / split / alias correction / identity reassignment` 必须**可审计**。

### D-C-07 Authorization Boundary
Owner 接受 D-C 设计方向，**不等于**批准代码实施。
本轮不得实施代码、数据库迁移、API、OAuth、Contract Freeze 或生产发布。

---

## 3. IQ-01 Owner 裁决（解释性）

### 3.1 三类事实分列

| 类别 | 内容 | 性质 |
|---|---|---|
| **A. IQ-01 原文事实** | 2026-11-17 `DECIDED`：业务身份 `MPN + Brand`，唯一键 `(mpn_norm, brand_norm)`；`prod-{document_id}` 降级为文档内部临时凭证；**推翻原建议 A「Ds Bit 全局注册表 + ULID `product_id`」**；跨系统身份由 `product_business_key` 承载 | 原文，不可改写 |
| **B. Owner 解释性裁决（本轮）** | IQ-01 禁止的是 **Ds Bit 跨系统统一产品身份注册、分配与共享的外部全局注册服务**；**允许**业务系统内部建立 **Product Identity Table** 作为内部持久化实体 | Owner 对原文适用范围的正式解释（非原文改写） |
| **C. 本轮新增决策** | 内部 `product_uid` 仅技术主键、非业务身份；`product_business_key` 仍由规范化 MPN+Brand 确定性生成；内部代理键不得授权未经批准的跨租户共享；merge/split/alias 必须可审计且不得改变冻结的业务身份规则 | 本轮新增 |

### 3.2 原文位置与证据

| 项 | 值 |
|---|---|
| 评审仓 | `E:\workspace\独立站\morrishk-site-upgrade-review`（origin `https://github.com/esanwu-bot/morrishk-site-upgrade-review.git`） |
| 引证提交 | `27e62b159394b2a95002e0ffb98c054f164aef7b`（`27e62b1`） |
| 原文 | `14_phase0_authority_adjudication/DECISION_REGISTER.md §2.1:46-59`；`14_phase0_authority_adjudication/IQ01_PRODUCT_IDENTITY_ADJUDICATION.md §9:263,279,285` |
| 文件 SHA-256 | `DECISION_REGISTER.md`=`68b6b259ac1d61ceab59f4bfa61849dae49097e68711d8c9a23e6af828b8daf0`；`IQ01_PRODUCT_IDENTITY_ADJUDICATION.md`=`2e19b28944f1ad025920502f737ac1fe954373645133afbf0e73989637fcb491` |
| 引证更正 | 早前引用 `16_/FREEZE_READINESS_REVIEW.md:166-176` 实为 **P0-2** 段落，非 IQ-01；IQ-01 见同文件 `:178-183`，其正文在 `DECISION_REGISTER §2.1` |

### 3.3 解释结论

- **不声称** IQ-01 原文已明确允许内部身份表——这是 **Owner 对原文适用范围作出的正式解释**（类别 B）。
- 原文字面推翻的是"Ds Bit 全局注册表 + ULID 签发"；本轮 Owner 明确：**外部全局注册服务禁止，内部 Product Identity Table 允许**。
- 该解释**解除**了 D-C 与 IQ-01 的冲突；但 IQ-01 的**签署与独立验收仍未完成**（`DECISION_REGISTER §2.4:92`「待签署 / 未完成」），不得改写该状态。

状态：`IQ-01 interpretation = OWNER_INTERPRETED`；`IQ-01 signing = PENDING`（未变）。

---

## 3A. Owner 裁决：DB engine / version

| 项 | 决策 | 状态 |
|---|---|---|
| Engine | **MySQL** | `OWNER_SELECTED` |
| Version | **8.4 LTS** | `OWNER_SELECTED` |
| Character set | **`utf8mb4`** | `OWNER_SELECTED` |
| Collation | **Owner 首选验证候选：`utf8mb4_0900_as_cs`**（备选 `utf8mb4_bin` / `utf8mb4_0900_bin`） | **`OWNER_DECIDED`（候选） + 技术验证 `NOT_READY`**（需 MySQL 8.4 实例验证大小写/重音/尾随空格/唯一键/索引） |

核查依据（未发现冲突）：

| 检查 | 证据 |
|---|---|
| 无 ORM / DB 驱动 | `pyproject.toml:12-20`（仅 pymupdf/pydantic/typer/rich/dotenv/pillow/pyyaml + dev pytest） |
| Phase 0 无库 | `docs/DECISIONS.md:8-9`（D01 拒绝 SQLAlchemy）、`:54-57`（D09 无库、JSON 产物） |
| 解析服务不建库 | `workbench/serve_parser.py:18`、`workbench/parse_worker.py:17` |
| 无部署/迁移工件 | 本轮检索无 Dockerfile/compose/alembic/migration/requirements/`.sql`；`configs/{parser,extraction}.yaml` 无 DB 配置 |
| 旧站/新平台/湖不构成证据 | 旧站 MySQL 5.6、新平台 MySQL 8.0.12、lake DuckDB 均**不**作业务 API 库已确定的证据 |

结论：当前代码/配置/依赖**未见**与 MySQL 8.4 LTS 冲突，Engine/Version 记为 Owner 已选定；
**Collation 保持 `OPEN`**；无部署文档，故**不**宣称"生产部署已验证"。

---

## 3B. Owner 裁决：身份契约

| 字段 | 定义 | 状态 |
|---|---|---|
| `mpn_norm` | 规范化 MPN | 业务身份组成；归一规则 `PROPOSED`（未冻结） |
| `brand_norm` | 规范化 Brand | 业务身份组成；归一规则 `PROPOSED`（未冻结） |
| `product_business_key` | 由规范化 MPN+Brand 确定性生成（`pbk1_`+SHA-256 全长十六进制方向已接受） | **设计方向 `OWNER_DECIDED`；精确编码 `OPEN`；`NOT_FROZEN`** |
| `product_uid` | 内部技术主键 | `OWNER_DECIDED`（不替代业务身份） |
| `identity_scope` | `DEVICE/BOARD/ONBOARD_DEVICE/UNKNOWN`，分类/审计字段 | `OWNER_DECIDED`：**首期不入业务键** |
| `document_id` | 独立文档身份 | 保持 |
| `parse_run_id` | 独立解析运行身份 | 保持 |

### B5 冻结前置（缺项清单）

| # | 前置项 | 状态 |
|---|---|---|
| 1 | MPN/Brand 规范化规则（MPN-NORM-v1） | `PROPOSED`，未冻结 |
| 2 | 无歧义序列化 | 候选 §4.3 已有长度前缀方案（`"PBK1\n" + utf8ByteLen(k)+":"+v`），仍 `PROPOSED` |
| 3 | 缺失 MPN/Brand 的 fail-closed 规则 | **方向 `OWNER_DECIDED`**：缺 MPN 或 Brand 拒绝生成身份键；精确错误码/消息 `OPEN` |
| 4 | 大小写/空白/连字符/Unicode/Brand alias 处理 | 规则未冻结 |
| 5 | 编码版本升级与迁移策略 | 未定（冻结后变更=不兼容） |
| 6 | 测试向量及期望输出 | **未齐全**：`TEST_AND_ACCEPTANCE_CRITERIA.md §B-2` 要求；`FIXTURE_DATA_SPEC` F-11 明确"当前无已验证向量" |

> 不得简单拼接两字符串后哈希；须使用已定义的无歧义编码（候选 §4.3）。未确认规则一律 `OPEN / OWNER_CONFIRMATION_REQUIRED`。

### Identity Table / merge / split

- Product Identity Table 为**内部实体存储**；
- `ProductDocument` 关系分离产品与文档；
- `ParsingJob/ParseRun` 与产品、文档身份分离；
- 同一 `MPN+Brand` 的跨 PDF 聚合由**确定性业务键**实现；
- 缺失/冲突身份信息**不得自动合并**；
- merge/split/alias 需**审计 + 人工授权**规则。

---

## 3C. Owner 裁决：Tenant / Product Catalog

- 首期采用**最小内部 Catalog 概念**，不建设完整产品主数据平台（`OWNER_DECIDED`）。
- `product_uid` 为**内部技术主键**；Product Identity 保存规范化 MPN、Brand 与身份版本。
- Catalog Product 为**租户范围内**可管理的产品记录；Document / ParseRun 独立记录来源与解析。
- 产品身份**不得**由 `document_id` 或 `parse_run_id` 决定；同一身份可关联多个来源文档与解析记录。
- `pbk` **不作为**外部 API 授权凭证；首期采用**租户内 Catalog**，不引入全局 Catalog 或跨租户共享。
- 每个 Tenant 拥有独立 **Product Catalog scope**；产品、文档、解析结果、证据与查询均需 tenant scope。
- **默认禁止**跨租户读取、搜索、关联、共享；相同 `pbk` **不代表**跨租户共享或访问授权。
- 跨租户共享需**另行 Owner 决策**及授权模型。
- 现有设计未单独定义 Product Catalog；本记录仅补充概念模型与关系说明，**不创建代码或数据库表**。

**仍需明确（`OPEN`）**：同租户重复身份幂等处理；Brand alias / 身份冲突处理；Catalog Product 与 Product Identity 的具体关系；重复记录自动关联与人工审核的边界。

状态：`Tenant isolation = OWNER_DECIDED（首期隔离）`；`minimal internal Catalog 方向 = OWNER_DECIDED`；`首期概念模型 = OPEN`；`Cross-tenant sharing = PROHIBITED_BY_DEFAULT / 需另行决策`。

---

## 3D. Owner 裁决：B8 evidence exposure

**首期不包含**：B8 summary API、原始 evidence API、`/evidence` 访问能力（`OWNER_DECIDED`）。
相关能力作为 **Phase 2** 单独评审，不进入首期交付。

| 类别 | 首期策略 |
|---|---|
| 允许的后续受控候选（Phase 2） | 证据页码；字段名；受控来源类型；经审核的简短定位摘要 |
| 首期默认禁止暴露 | 原始 PDF/整页内容；未审核长文本摘录；内部 prompt/模型输出/调试信息；内部文件路径；其他租户证据 |

口径冲突处理：
- 记录 Owner 本轮决定：**首期无 summary / 无 raw evidence / 无 `/evidence` API**；
- 受控 `evidence summary` 字段白名单 `OPEN`，列为 **Phase 2 / NOT_FROZEN**；
- **不**宣称 B8 全部契约已完成。

状态：`首期 no-summary / no-raw / no-/evidence = OWNER_DECIDED`；`summary 白名单 = OPEN`；`Phase 2 summary = NOT_FROZEN`；`B8 freeze = NOT_READY`。

---

## 3E. Owner 裁决：CRLF 快照处置

- 已签署、归档、被证据引用的**历史快照保持原样**，**不重写**、**不改原始哈希**。
- **未来另批**生成 **LF 规范化**的新快照。
- Git blob / LF 内容作为**规范化校验依据**；Windows 工作区 CRLF 不应被误判为内容损坏。
- 新快照须具备独立版本、生成时间、来源 commit 与 SHA-256 清单。
- 本项**独立记录**，不与身份/数据库/API 实施混在同一代码变更。

状态：`historical snapshot = PRESERVED`；`future LF snapshot = PENDING_SEPARATE_BATCH`。

---

## 4. 与 D-B 结论的关系

| 项 | 记录 |
|---|---|
| D-B 冻结结论 | `ACCEPT_D_B_FAIL_RESULT`（已完成并独立审查，结果 FAIL；不重复复验） |
| 证据完整性 | PASS（20/20 + 33/33 哈希匹配） |
| 跨 PDF 产品身份 | FAIL |
| Global ID 稳定性 | FAIL |
| 同 PDF 重复解析稳定性 | PASS |
| `evidence.json` | FAIL（未生成） |
| `qc_report` | FAIL（未生成） |
| evidence linkage | FAIL |
| Item 7 error semantics | **PARTIAL**（Session D 原判 FAIL；Reviewer 复判 PARTIAL；总体仍 FAIL） |
| 差异分析 | 已完成 |
| 回归结果 | 816 collected / 792 passed / 1 failed / 21 skipped / 2 xfailed |
| 保留项 | CRLF byte-consistency failure、missing frozen artifacts skips、S3 gate xfails **不得**重新分类为 PASS |

> D-C 是对上述 FAIL 项的**设计裁决**，不改变 D-B 的 FAIL 事实，也不构成修复完成的证据。

---

## 5. 授权边界声明

1. 本文件固化 Owner 对 D-C 设计方向与 7 项决策建议的接受，属**设计/架构裁决**。
2. **不**构成代码实施授权、数据库迁移授权、API/OAuth 实施授权、契约冻结、架构验收或生产准入。
3. 任何实现须另行取得 Owner 书面授权（见 `P0_2_IMPLEMENTATION_AUTHORIZATION_REQUEST.md`，当前状态 `NOT_GRANTED`）。
4. 本文件不改变任何状态门槛（见 §6）。
5. 仅以下项达到 `OWNER_DECIDED`：IQ-01 解释、DB Engine/Version/Charset、`product_uid` 技术主键、`identity_scope` 不入键、Tenant 首期隔离、B8 首期不暴露原始 evidence、CRLF 历史快照保持。
   **仍 `OPEN` / 未冻结**：Collation、B5 规范化规则与测试向量、`pbk` 冻结、Product Catalog 概念模型、B8 受控 summary 契约、跨租户共享模型。

---

## 6. 状态门槛（只读快照，未作任何变更）

| 状态 | 值 |
|---|---|
| P0-2 | `BLOCKED` |
| C2（独立复验） | `FAIL`（已执行，结果失败） |
| Business API Approval | `NOT_APPROVED` |
| Contract Freeze | `NOT_READY` |
| Backend Architecture Acceptance | `NO` |
| 75-item authorization | `0/75` |
| Production / READY | `NO` |

---

## 7. Owner Final Decision Record（D-1…D-7，本轮归档）

> 归档依据：Owner 于 2026-11-25「Owner Final Decision Round 执行指令」接受 Reviewer 建议。
> **正式 Sign-off（姓名/签署/日期）待补**；本记录不构成电子签名。本轮**未新增任何 `FROZEN`**。
> 详细 15 字段见 `P0_2_OWNER_FINAL_DECISION_MATRIX.md`。

| ID | Owner Decision（已接受原则/方向） | Allowed Scope | Excluded Scope | Evidence Required | Status | 影响首期契约 | 实施授权前必须关闭 |
|---|---|---|---|---|---|---|---|
| D-1 | 首选验证候选 `utf8mb4_0900_as_cs` | 身份键 collation 候选 | 不得由实施 Agent 自行更换 | MySQL 8.4 实例验证：大小写/重音/尾随空格/唯一键/索引 | `OWNER_DECIDED`（候选）；技术 `NOT_READY` | 是 | **是** |
| D-2 | 保守、可版本化、可追溯的规范化方向 | 保留 raw；NFC；trim；不删型号字符；Brand alias 仅显式 map；缺失 fail-closed | 不自动补全未定规则 | 完整规范 + 版本 + 迁移/兼容性测试 | 方向 `OWNER_DECIDED`；完整规范 `OPEN` | 是 | **是** |
| D-3 | `pbk1_`+SHA-256 全长；输入顺序 MPN→Brand；版本化无歧义序列化；可重算指纹，非技术主键、非授权凭证；缺失拒绝生成 | 身份指纹编码方向 | 不得静默改变既有 `pbk1_` 含义 | 字节布局/长度前缀/UTF-8/测试向量与期望输出 | 方向 `OWNER_DECIDED`；精确规范 `OPEN`；向量 `NOT_READY` | 是 | **是** |
| D-4 | 首期最小内部 Catalog 概念，不建完整主数据平台 | `product_uid` 技术主键；Catalog Product 租户内；Document/ParseRun 独立；多文档关联同一身份 | 不建全局 Catalog / 跨租户共享 / 实际建表 | 同租户幂等、alias/冲突、Catalog↔Identity 关系、人工审核边界 | 方向 `OWNER_DECIDED`；概念模型 `OPEN` | 是 | **是** |
| D-5 | 首期不含 B8 summary API、原始 evidence API、`/evidence` | 首期 no-summary / no-raw | summary/raw evidence/`/evidence` 全部列 Phase 2 | Phase 2 单独评审；白名单 | 首期 `OWNER_DECIDED`；白名单 `OPEN`；Phase 2 `NOT_FROZEN` | 否（首期不含 API） | 条件性（若含 API 则必须） |
| D-6 | 首期严格租户隔离 | 默认禁止跨租户查询/搜索/关联/读取/共享；同 pbk 不共享、不授权 | 跨租户共享不在首期 | tenant ownership / scope / 重复身份与跨租户拒绝测试 | 首期隔离 `OWNER_DECIDED`；精确模型/测试 `OPEN` | 是 | **是**（首期隔离） |
| D-7 | 历史快照保持原样；未来另批 LF 新快照 | Git blob/LF 为校验依据；新快照独立版本/时间/来源 commit/清单 | 不重写历史、不改历史哈希 | 新快照批次与 SHA-256 清单；pipeline 单独重授权 | 历史 `OWNER_DECIDED`；新批次 `OPEN` | 否（独立批次） | 否（pipeline 变更需另批） |

**仍 `OPEN` / `NOT_READY`（不因 Owner 接受原则而关闭）**：Collation 实例验证、MPN-NORM-v1 完整规范、pbk 精确编码与测试向量、Catalog 首期概念模型、租户隔离精确模型与测试、B8 白名单、未来 LF 新快照。

**未新增 `FROZEN`；`IMPLEMENTATION_AUTHORIZATION = NOT_GRANTED`。**
