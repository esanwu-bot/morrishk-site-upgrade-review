# Phase 0 — Baseline & Blocker Audit（只读盘点，2026-11-28）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-PHASE0-AUDIT-001 |
| 状态 | **DRAFT — READ_ONLY_INVENTORY — NO_STATE_CHANGE** |
| 性质 | 只读盘点；不构成裁定、批准、授权，不是 S2 申请本身 |
| 范围 | 对应 `Ds Bit Product Lifecycle — Execution Roadmap v1` 的 Phase 0 |
| 代码仓库 | `E:\workspace\icpdf-extractor`（HEAD `f348237`，分支 `docs/p0-2-dc-decision-20261125`） |
| 治理仓库 | `E:\workspace\.scratch\morrishk-owner-decision`（HEAD `22a09c0`） |
| 方法 | 只读读取代码与目录结构；未运行测试；未修改任何文件；未访问数据库 |

## 1. 现有能力复用清单

| 模块 | 路径 | 能力 | 对路线图的复用价值 |
|---|---|---|---|
| `domain/product.py` | `src/icpdf/domain/product.py` | `Product` 模型：`product_id`、`document_id`、`requested_mpn`、`normalized_mpn`、`identity_scope`、`identity_evidence` | **单文档内**的产品身份模型已存在；`product_id` 当前绑定单一文档（见 §2），不能直接当跨文档 Global ID 使用 |
| `domain/evidence.py` | `src/icpdf/domain/evidence.py` | `Evidence` 模型：`document_sha256`、`page_number`、`table_id/row_id/cell_id`、`bbox`、`raw_text`、`evidence_type` | **可直接复用**：字段来源、页码、单元格级追溯已经是强类型模型，Phase 3/4 的 Evidence 集成可以在此基础上扩展，不需要重写 |
| `domain/candidate.py` | `src/icpdf/domain/candidate.py` | `ColumnRole` 等候选列角色定义 | 候选机制已存在（表格候选列级别），可参考其候选/确认模式用于 Phase 1 的跨文档候选关联，但这是表格候选，不是产品身份候选，不能直接套用 |
| `parser/candidate_registry.py` | 同名 | `build_candidates` 候选注册 | 候选生成的代码模式可复用（如何产生候选、如何登记），但只适用于当前的表格/列候选场景 |
| `parser/logical_evidence.py`、`logical_decision.py`、`logical_candidates.py` | 同名 | 解析阶段的证据/决策/候选逻辑 | Phase 3（Ingestion/Parsing/Evidence Integration）可直接在这条已有流水线上接入，无需重写解析器 |
| `pipeline.py` | `src/icpdf/parser/pipeline.py` | `parse_pdf(pdf_path, requested_mpn, runs_root, *, dpi, run_id, config_path)` | 现有解析入口；**无 Brand 参数**（见 §2），Phase 1 若要接入 Brand 判断需要新增参数或新函数，不能直接在现有签名上扩展（受字节快照锁定，见 §2 CAND-09） |
| `storage/run_store.py`、`artifact_store.py` | 同名 | 单次运行的产物存储（JSON/字节写入、manifest） | 可复用的运行产物存储机制；**不含**任何跨运行、跨文档的产品主记录存储 |
| `audit/__init__.py` | `src/icpdf/audit/` | 空文件 | **占位目录，无实现**；Phase 2 的状态转换审计记录需要从零设计，不能复用现有代码 |

## 2. 真实缺口（逐项核验，区分“未实现”与“设计未裁定”）

| 缺口 | 核验方式 | 结果 | 分类 |
|---|---|---|---|
| Brand 字段与 `brand_trust_status` | 全仓文本搜索 `brand`（大小写不敏感） | `src` 下 **0 处**涉及 Brand 判断逻辑；`domain/product.py` 仅有 `manufacturer: str \| None`（原始字段，非规范化 Brand） | **未实现**（技术缺口） |
| Product Business Key（`pbk1_` + SHA-256） | 搜索 `pbk1_`、`business_key`、`brand_norm`、`mpn_norm` | **0 命中** | **未实现**（技术缺口） |
| `identity_status`（`RESOLVED`/`PENDING_BRAND`/`NEEDS_REVIEW`/`INVALID_INPUT`） | 同上 | **0 命中** | **未实现**（技术缺口） |
| Global Product ID（跨文档稳定主键） | 检索 `run_store.py`、`pdf_loader.py`、`_build_lake.py` | `product_id` 当前实现为 `prod-{document_id}`（即与单文档绑定），同一 MPN 两份 PDF 得到不同 `product_id`（与 `28_/reverification/06` 第 2 项 FAIL 一致） | **未实现**（技术缺口，且已有独立复核 FAIL 记录） |
| Document ID 与 Product ID 的区分 | 同上 | 当前两者是一一绑定关系（`product_id` 由 `document_id` 派生），不存在独立的跨文档产品主键 | **未实现**（技术缺口） |
| 审计/状态转换记录（`audit` 模块） | `audit/__init__.py` 内容为空 | 无任何代码 | **未实现**（技术缺口） |
| B5 归一化规则（M1/M2/空白处理等） | 本次搜索范围限于 `icpdf-extractor` 代码仓库 | 代码仓库中 **0 命中**；B5 规范本身已在治理仓库冻结（`f469e1d`，不含 P2），但**从未被引入代码仓库** | **未实现**（规范已冻结，代码未接入；不是设计未裁定） |
| Tenant/ACL/OAuth Scope（29_ D-24…D-34、D-41…D-49） | 对照 29_ 登记表 | 49 项全部 `PENDING_OWNER`；代码仓库中无任何 Tenant/ACL/OAuth 相关代码 | **设计未裁定**（不是技术实现问题，是业务规则未定） |
| CAND-09（Brand 可信输入测试） | 此前多轮核验：目标测试文件不存在、Brand 参数不存在 | `BLOCKED`，0/5 满足 | **未实现**（技术缺口，且是现有阻断 finding） |

## 3. P0-2 / B-1 / S2 / 存储授权等现存限制 → 具体工作项映射

| 现存限制 | 映射到的路线图工作项 | 说明 |
|---|---|---|
| P0-2 四项 FAIL（产品身份、全局 ID、B2B 能力、后端实现） | Phase 1（Product Identity）、Phase 2（Lifecycle）、Phase 5（API） | 这三项 Phase 的实现内容正是 P0-2 待关闭的技术对象；完成这些 Phase 的实现与独立验证，才是解除 P0-2 对应 FAIL 的途径（见第 14 节 P0-2 分阶段验收裁定） |
| S2 有限实施授权 `NOT_ISSUED` | Phase 1–5 全部 | 路线图 Phase 1 至 5 的任何代码修改或数据库写入，在 S2 签发前**不得启动** |
| B-1 执行授权 `NOT_GRANTED` | 与 CAND-09 相关的测试/快照修改 | Phase 1 如需修改 `pipeline.py` 或其字节快照，需先获得 B-1 执行授权，不在 S2 范围内自动包含 |
| 29_ 49 项 `PENDING_OWNER` | Phase 2（Lifecycle 的 Tenant/ACL）、Phase 5（OAuth Scope、Tenant/Product/Field ACL） | 这些 Phase 的具体实现方案依赖尚未裁定的业务规则，**不得由实现方自行决定**，S2 申请中应将这些子项列为 `BLOCKED — PENDING_OWNER`，排除在首批可实施范围之外 |
| 存储/DB 授权 `NOT_GRANTED`（D-09 `STORAGE_AUTHORIZATION` 恒为 `NOT_GRANTED`） | Phase 2（Product Master 持久化）、Phase 4（确认记录持久化） | 任何数据库表结构设计可以作为**文档准备**，但表的创建、迁移执行、数据写入需要单独的存储授权 |
| 五道 Gate 全 `NO` | Phase 6（End-to-End Validation） | Phase 6 的生产发布相关验收（`PRODUCTION_READY`）在这些 Gate 打开前不适用；Phase 6 的只读端到端验证本身可以在 S2 范围内进行 |

## 4. 可执行与受阻任务清单

### 4.1 S2 签发前，当前即可执行（只读/文档类，不涉及代码修改或 DB 写入）

| # | 任务 | 性质 |
|---|---|---|
| 1 | 起草 Product Business Key、Global ID、`identity_status` 的详细技术设计文档（基于已冻结的 B5 v0.8.1/`b5-min-v0.2`） | 文档 |
| 2 | 起草 Product Master / Lifecycle 状态机的详细数据模型设计（DRAFT→CANDIDATE→REVIEW_REQUIRED→CONFIRMED→CONFLICTED/SUPERSEDED/INACTIVE） | 文档 |
| 3 | 起草 Phase 3（Pipeline 接入）的具体接入点设计，基于 §1 列出的现有 `logical_evidence.py`/`logical_decision.py` | 文档 |
| 4 | 起草只读 Business API 的接口契约草案（不含实现） | 文档 |
| 5 | 整理 29_ 中与 Phase 2/5 相关的未裁定字段清单，供 Owner 优先裁定参考 | 文档/盘点 |

### 4.2 受阻，需 S2 签发后才可执行

| # | 任务 | 阻塞原因 |
|---|---|---|
| 1 | Brand/MPN 归一化代码实现（接入已冻结的 B5 规则） | S2 未签发；需同时考虑是否触及 `pipeline.py` 快照（需 B-1） |
| 2 | Product Business Key / `identity_status` 代码实现 | S2 未签发 |
| 3 | Global Product ID 跨文档主键的代码与数据模型实现 | S2 未签发；且涉及数据库表结构（需存储授权） |
| 4 | CAND-09 测试编写与运行 | S2 未签发；CAND-09 本身仍 `BLOCKED` |
| 5 | Product Master / 状态机代码实现 | S2 未签发；存储授权 `NOT_GRANTED` |
| 6 | Tenant/ACL/OAuth 相关代码 | S2 未签发；且 29_ 49 项未裁定，不得由实现方自行决定方案 |
| 7 | 只读 Business API 的代码实现与部署 | S2 未签发；五道 Gate 仍全 `NO` |
| 8 | Phase 6 端到端验证（涉及实际运行与数据） | 依赖 Phase 1–5 的代码实现，同样受 S2 限制 |

## 5. 声明

1. 本报告不构成现状/缺口矩阵之外的任何裁定；不建立新的治理体系；
2. 未在未授权范围内进行任何数据库写入或代码修改；
3. 历史测试通过（如 Evidence 的 83/83 测试）仅代表该模块当时的测试覆盖，不等同于当前端到端能力通过，也不代表 Phase 1–6 的验收已满足；
4. §4.1 列出的"可执行任务"均为文档/设计性质，不涉及代码提交或数据库操作；若需要落实为代码，仍需等待 §4.2 对应的授权；
5. 本报告可作为 S2 授权申请中"范围限定"部分的参考材料，但不等同于 S2 申请本身，也不预先固化任何实施范围。
