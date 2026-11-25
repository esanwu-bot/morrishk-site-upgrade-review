# P0-2 身份实施方案范围提案（Scope Proposal）

| 项 | 值 |
|---|---|
| 文档编号 | REVIEW-P02-IDENTITY-SCOPE-20261125 |
| 版本 | v1.2（Owner Final Decision Round 已归档；**仍未获批、未实施**） |
| Owner decision | **`OWNER_DECISION_ACCEPTED`**（D-1…D-7 方向已接受；Sign-off Pending；契约未全部冻结） |
| 日期 | 2026-11-25 |
| 权威基线 | `feat/gate6a-audit@5dcecd21a9bf3f7f7046cc8c769fcfbcd2adf1e5` |
| 上游 | `D-C_OWNER_IDENTITY_DECISION.md`（`OWNER_DECISION_ACCEPTED`）；D-B FAIL 结果 |
| 性质 | 范围与验收设计；**不**构成实现授权、架构验收或生产准入 |
| 事实约束 | 下列"现有实现"均以 D-B 实测为准；**不得**虚构已有数据库、表结构或 API |

---

## 1. 现行基线事实（来自 D-B 独立复验，非推测）

| 事实 | 证据 |
|---|---|
| 无数据库 / ORM / migration / DDL 实现 | D-B `05_backend.txt`；`src/**` 无 sqlalchemy/psycopg/pymysql 等导入 |
| 无 Business API / OpenAPI / OAuth 实现 | D-B `04_static_b2b.txt`；`git ls-tree` path-name 匹配 `NONE` |
| `Product` 为单文档模型 | `src/icpdf/domain/product.py` |
| `product_id = prod-{document_id}` | `src/icpdf/parser/pipeline.py:152` |
| `normalized_mpn = requested_mpn`（未真正归一） | `src/icpdf/parser/pipeline.py:154-155` |
| `identity_scope = "unknown"` | `src/icpdf/parser/pipeline.py:156` |
| 无 Brand 字段 / 无 `pbk` / 无产品注册表 | D-B 静态检索 0 命中 |
| `Evidence` / `FormalParameterSet` 仅类定义、生产链零实例化 | `src/icpdf/domain/evidence.py:20`、`domain/parameter.py:84` |
| `evidence.json` / `qc_report.json` 未生成 | 三 run 目录及全树 0 命中 |
| 声明依赖无 DB/ORM/Web 框架 | `pyproject.toml`：pymupdf/pydantic/typer/rich/dotenv/pillow/pyyaml + dev pytest |

> 结论：当前是**纯解析库 + 本地 run 产物**，没有任何持久层与 API。本提案的所有实体/约束均为**候选**。

---

## 2. 最小可行 P0 实施范围（覆盖任务要求的 10 项）

> 「P0 最小范围」= 关闭 D-B 中可被代码验证的身份/证据失败项，且不越过 D-C-07 授权边界。

### 2.1 Product 身份持久化
- 引入不可变代理键 `product_uid`（UUIDv7/ULID 候选），所有外键引用它。
- 自然键 `(mpn_norm, brand_norm)` 作为匹配/唯一依据，**不**作主键。
- `product_business_key`（`pbk1_…`）**暂不编码实现**，待 B5 冻结（见 §4）。

### 2.2 Document 与 Product 关联模型
- `Document`（sha256 唯一）与 `Product` 经 `product_document` 桥表多对多关联。
- 关系含 `relation`（primary/alternate/errata/guide）与 `version_label`。
- 文档保留自身 hash/来源/parse history；同一 document 不因重解析产生新文档。

### 2.3 MPN / Brand / Manufacturer 归一化与匹配
- 版本化 `MpnNormalizer`（规则集 + `normalizer_version`），保留 `mpn_raw`。
- Brand 归一与别名（`brand_alias`）；Manufacturer 与 Brand 分离。
- 自然键匹配规则：同 `(mpn_norm, brand_norm)` → 同一产品；同 MPN 不同 Brand → 不同产品。

### 2.4 ambiguous / conflict / human review
- MPN 缺失、Brand 缺失、自然键冲突、关键属性冲突、规范化歧义 → `identity_pending`，**不静默合并**。
- 提供 `PENDING_BRAND` / `UNRESOLVED` 状态与人工复核队列（设计路径，落地深度见 §4）。

### 2.5 产品 merge / split / alias 可审计
- `product_lineage`（from/to/action/reason/approved_by/at）；不物理删除历史键。
- 旧 `prod-doc-*` 作为文档内部引用保留，提供只读映射。

### 2.6 Tenant / Product Catalog 身份作用域
- 身份匹配默认在授权 Tenant / Product Catalog 作用域内。
- 跨 Tenant 共享**不在**本阶段；`identity_scope` 是否入唯一键见 §4。

### 2.7 `evidence.json` / `qc_report.json` 及失败语义
- 每次 Run 产出 `evidence.json`（schema `evidence/v1`）与 `qc_report.json`（schema `qc/v1`），并登记进 `run_manifest.json`。
- 字段/约束沿用 `PARSER_EVIDENCE_ARTIFACT_SPEC.md`。
- 失败语义端到端：bbox 越界、正式参数缺证据、身份冲突等 → `qc.status=FAIL` 且不进正式结果。

### 2.8 数据库约束 / 迁移 / 兼容 / 回滚
- 仅**新增**表与约束；无破坏性 DDL；软删除/状态位。
- 迁移顺序：Manufacturer → Brand → BrandAlias → Product → ProductLineage → Document → ProductDocument → ParsingJob → ParsingResult → Evidence → Parameter → Tenant/Site/TPA/Audit（按需裁剪）。
- 回滚：停写 → 回退读路径 → 新表保留只读；保留旧 ID 映射与双读开关。

### 2.9 API / 契约影响分析（**不实现**）
- 仅分析身份模型对候选契约（16 paths，`CANDIDATE_NOT_FROZEN`）的影响：`product_id`/`product_business_key`/version/evidence 字段。
- **不**新增端点、**不**修改 OpenAPI、**不**推进 G1–G6。

### 2.10 自动化测试、回归与 D-B 失败项验收
- 见 §3 验收标准与 §5 测试计划。

---

## 3. 验收标准（对齐 D-B FAIL 项）

| # | D-B 失败项 | 验收标准（可自动化） |
|---|---|---|
| 1 | 跨 PDF 产品身份 FAIL | 两个不同 PDF、同 `MPN+Brand` → 同一 `product_uid`，两条 `product_document` |
| 2 | Global ID 稳定性 FAIL | 同一自然键跨批次/跨 run → 同一 `product_uid`；唯一约束阻止重复注册 |
| 3 | 同 PDF 重复解析 PASS（保持） | 同一 PDF 两次解析：`document_id` 稳定、`product_uid` 稳定、候选逐字段稳定；`run_id` 变化 |
| 4 | `evidence.json` FAIL | 每次 Run 生成 `evidence.json`；schema 校验通过；`document_sha256` 三方一致 |
| 5 | `qc_report` FAIL | 每次 Run 生成 `qc_report.json`；检查项有 PASS/FAIL；失败项对应产物置 FAIL |
| 6 | evidence linkage FAIL | `evidence → parameter → product → document` 检索链可解析；`product_ref` 正确回填 |
| 7 | error semantics PARTIAL | 缺失证据、身份冲突在**运行链**可触发并产出失败记录（非仅领域层） |
| 8 | 差异分析 已完成（保持） | 不涉及实现；保持历史记录不改写 |

> 额外：自然键相同但 Brand 缺失/冲突时，**必须**进入 `identity_pending`，不得合并（D-C-06）。

---

## 4. 范围分类

### 4.1 本轮（P0 最小）必须实施
- §2.1–§2.3、§2.4（最小挂起态）、§2.5（谱系最小集）、§2.7、§2.8（新增表 + 迁移 + 回滚骨架）、§2.10。

### 4.2 后续可延迟
- 完整人工复核工作流 UI/SLA；品牌别名治理后台；跨系统 `pbk` 对齐；版本标签来源自动化；旧 URL/外链 301 策略实现。

### 4.3 Owner 已裁定（`OWNER_DECISION_ACCEPTED`）

| 决策 | 结论 |
|---|---|
| **首期范围** | **内部产品身份 + 最小租户内 Catalog 基础能力；不含 Business API、B8 summary、原始 evidence API、`/evidence`** |
| IQ-01 | 禁止 **外部**全局注册服务；**允许**内部 Product Identity Table；`product_uid` 仅技术主键 |
| DB Engine / Version / Charset | **MySQL / 8.4 LTS / `utf8mb4`**；Collation 首选候选 `utf8mb4_0900_as_cs`（技术 `NOT_READY`） |
| 身份契约 | `MPN+Brand` 确定性业务身份；`pbk1_`+SHA-256 为已接受方向；`identity_scope` **首期不入键** |
| Tenant / Product Catalog | 首期严格租户隔离，**默认禁止**跨租户共享；最小内部 Catalog 方向已接受 |
| B8 | 首期 **no-summary / no-raw / 无 `/evidence`**；Phase 2 单独评审 |
| CRLF | 历史快照保持原样；未来另批建立 LF 规范化新快照 |

### 4.3b 仍 `OPEN` / 未冻结（阻断对应契约标记 `FROZEN`）

| 项 | 说明 |
|---|---|
| Collation | 首选候选已定；**实例验证 `NOT_READY`**（唯一键/索引/大小写/重音/尾随空格） |
| B5 规范化规则 | 方向已定；**完整规范 `OPEN`**（空白/大小写/连字符/Unicode/Brand alias） |
| B5 测试向量 | **未齐全**（`TEST_AND_ACCEPTANCE_CRITERIA.md §B-2` 要求；`FIXTURE_DATA_SPEC` F-11 无已验证向量） |
| `pbk` 精确规范/冻结 | 方向已定；精确编码 `OPEN`；未评审冻结 |
| Product Catalog 概念模型 | 方向已定；首期概念模型 `OPEN` |
| B8 summary 白名单 | `OPEN`（Phase 2） |
| 跨租户共享模型 | 需另行 Owner 决策 |
| CRLF 新快照 | 未来独立批次；`pipeline.py` 变更需另批重授权快照 |

### 4.4 不纳入本次授权
- OAuth / Tenant / Site / TPA 实际实现；Business API 端点实现；Contract Freeze（G1–G6）；75 项授权；生产发布/灰度；恢复 stash；修改原始证据；改变任何状态门槛。

---

## 5. 测试计划

| 层 | 内容 |
|---|---|
| 单元 | `MpnNormalizer` 规则/版本；自然键匹配；冲突挂起；`product_uid` 不可变；幂等键 |
| 集成 | 固定样本 A/B（`ceecef86…` / `3c3221a8…`）跨 PDF 同 MPN+Brand → 同一产品；同 PDF 重解析稳定 |
| 产物 | `evidence.json` / `qc_report.json` schema 与哈希一致；manifest 登记；失败语义 FAIL |
| 迁移 | 空库建表；回滚脚本 dry-run；双读一致性；不得覆盖旧数据 |
| 回归 | 全量 pytest 保持 **816 collected**；**零新增失败**；CRLF 项按 §6 处理 |
| 安全/隔离 | 跨 Tenant 读写拒绝；证据按 owner_tenant 过滤；审计记录三作用域 |

---

## 6. 关键依赖：CRLF 快照测试

- 现状：`tests/unit/test_assembly.py::test_a1_10_pipeline_py_is_byte_identical_to_the_authorised_snapshot`
  断言 `pipeline.py` 字节等于授权快照（D-B 中即为既有失败，hash `86c005…` ≠ `3394bb…`）。
- 若实施 D-C 修改 `pipeline.py`，该断言必然失败。
- Owner 裁决（`D-C §3E`）：**历史快照保持原样、不重写、不改哈希**；未来**另批**建立 LF 规范化新快照；Git blob/LF 内容为规范化校验依据。
- 因此实现授权须另行决定 `pipeline.py` 变更后的**新快照重授权**（独立批次），且不得把既有 CRLF 失败改写为通过或修改测试掩盖。

---

## 7. 非实现声明

- 本文件未创建任何表、迁移、API、代码或数据库。
- 所有实体/约束/字段均为候选，不代表已存在。
- 不构成 Backend Architecture Acceptance、Contract Freeze 或实现授权。
