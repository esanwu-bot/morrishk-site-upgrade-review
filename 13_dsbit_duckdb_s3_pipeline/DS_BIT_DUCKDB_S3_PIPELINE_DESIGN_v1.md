# Ds Bit · DuckDB + S3 离线解析流水线实施设计 v1

| 项 | 值 |
|---|---|
| 交付编号 | MRH-DSBIT-LAKE-001 |
| 文档版本 | v1.0（首轮送审，未冻结） |
| 日期 | 2026-11-17 |
| 性质 | 架构与实施设计（DESIGN ONLY） |
| 实现状态 | **未实现**；本文件不含生产代码、不含部署、不含数据迁移 |
| 基线仓库 | `E:\workspace\icpdf-extractor` |
| 基线分支 / HEAD | `backup/full-local-20261114` / `600439a5eee69fb3a1cec2715e37080e48ca9840` |
| 工作树 | **不干净**：`deploy/dsb/*` 已暂存；`workbench/b2b/serve_b2b.py`、`deploy/dsb/evidence/`、`docs/g0_evidence/` 未跟踪 |
| 全量口径 | 去重 PDF **568,830** 份（约 56.9 万） |
| 上游决策 | Raw / Parse / Eval 三层；原始 PDF 不可变；Parse 记录 Parser/配置/依赖/run_id；Eval 记录 Gold/指标/归因/审核；跨层引用；先单件再 1000 份再 3–5 万 |

---

## 0. 阅读约定

1. **`CONFIRMED`**：在 §2 的代码快照下，由文件、行号或已执行的只读脚本直接证实的事实。
2. **`PROPOSED`**：本设计提出的做法，尚未实现，需 Reviewer 批准后才可进入实现。
3. **`OPEN`**：需要 Reviewer / 甲方裁定，或需要实测数据才能决定的事项，编号见 `OPEN_DECISIONS.md`。
4. **不把讨论当实现**：`lake/` 只是单件 Demo；除它之外，本设计提到的 Worker、队列、对象存储上传、分区、合并、重试、评估流水线均为 `PROPOSED`。
5. **数字纪律**：56.8 万 / 56.9 万均指 `568,830`，以 `568,830` 为唯一权威值。任何耗时、吞吐、成本数字，若未由本设计的基准实测产生，一律标注「外推示例，不是承诺」。

### 0.1 任务书所称「已有 Stage B 设计」的对应物

基线中不存在一份名为「Stage B」的独立设计文档。任务书所指在基线上对应两处，本文分别使用：

| 对应物 | 位置 | 本文如何使用 |
|---|---|---|
| **批次口径**：B0 / B1 / B2 / B3 | Morrishk 技术方案 v1.2 §7.2（送审仓库 `02_technical_design/`） | 作为「先验证、再 1000 份、再 3–5 万、最后外推全量」的阶段来源 |
| **技术骨架**：三层血缘 Demo | 仓库 `lake/`（commit `7d8ab3f`，README 与 4 个脚本） | 作为 Raw / Parse / Eval 的最小可运行原型与四条不变量来源 |

二者**都不是**生产实现，也不构成对批量的证明。

---

## 1. 文档定位、范围与不做什么

### 1.1 目标

为 Ds Bit 产品技术数据平台建立可持续运行的离线数据底座：

1. 568,830 份原始 PDF 可追溯、不可变、可去重；
2. 每份解析结果可回答「谁、用什么代码、什么配置、什么依赖、在什么时间、对哪份原始字节」；
3. 每份评估可回答「用哪版 Gold、哪个评估器、对哪次解析、哪些错误」；
4. 以 DuckDB + Parquet 支撑批量统计与质量分析，且不引入独立数据库服务器；
5. 用单件 → 1000 份 → 3–5 万份三级验证，给全量外推提供实测依据。

### 1.2 本轮范围

- 只读检查、架构设计、数据模型、对象布局、Manifest、Parquet 分区、DuckDB 查询口径；
- 负向测试矩阵、基准计划、试跑计划、成本估算方法、风险与 OPEN 清单；
- 允许的本地验证：只读脚本、临时目录实验。

### 1.3 明确不在本轮范围

- 生产 Parser API、真实公网流量、生产部署与灰度；
- LLM 调用、自动 Repair、Gold 自动回写；
- 568,830 份批量处理、大规模 ECS 采购、数据库迁移；
- OCR / 扫描版修复；
- 参数正式发布到 Morrishk 详情页（那是技术方案 §7.5–§7.9 的另一条链路）。

### 1.4 与既有文档的关系

| 文档 | 关系 |
|---|---|
| Morrishk 技术方案 v1.2 §3.4–§3.5、§7 | 定义业务表与参数化规则；本文只解决「解析数据怎么落、怎么追溯、怎么批量」，不重新定义业务表 |
| `docs/PHASE1_4_S2.md` / `S2A` / `S2B` | 解析引擎内部结构；本文不修改其语义，只消费其产物 |
| `docs/New_Gate_受控灰度方案.md` | 在线灰度口径；本文的离线 Worker 复用它已验证的超时/强杀/冻结思想，但不是在线服务 |
| `lake/README.md` | 单件血缘 Demo；本文把它升级为批量设计，并指出其硬编码与缺口 |

---

## 2. 基线检查与三清单

### 2.1 仓库与工作树（CONFIRMED）

| 事实 | 证据 |
|---|---|
| HEAD = `600439a5eee69fb3a1cec2715e37080e48ca9840` | `git rev-parse HEAD` |
| 分支 = `backup/full-local-20261114`（非 `main`） | `git branch --show-current` |
| 工作树不干净：`deploy/dsb/*` 已暂存；`workbench/index.html`、`workbench/serve_parser.py`、`.gitignore` 已修改；`workbench/b2b/serve_b2b.py` 未跟踪 | `git status --short` |
| 最近提交包含 Stage B Demo 与工作台入库 | `7d8ab3f feat(lake): Stage B 三层血缘 Demo（raw / parse / eval）+ 工作台运行时代码入库` |
| Ds Bit 前台在 `workbench/`，解析引擎在 `src/icpdf/` | `workbench/` 与 `src/` 目录结构 |

> 该分支名与「backup」语义不符，但这是仓库现状，不改写、不推断。

### 2.2 解析流水线与产物（CONFIRMED）

**唯一正式入口**：`src/icpdf/parser/pipeline.py:94`

```text
parse_pdf(pdf_path, requested_mpn, runs_root="runs", *, dpi=None, run_id=None, config_path=None)
  -> load_config()                       pipeline.py:97   （返回 config + 配置字节 SHA-256）
  -> load_pdf()                          pipeline.py:99   （拒绝加密、0 页；document_id = doc-<sha[:12]>）
  -> RunStore.create()                   pipeline.py:101  （同名 run 目录已存在即抛 FileExistsError）
  -> run.copy_source()                   pipeline.py:102  （复制 source.pdf 并返回 SHA-256）
  -> 逐页：extract_text_blocks / detect_tables_with_evidence / build_table / render_page
                                          pipeline.py:114-134
  -> build_candidates                    pipeline.py:138
  -> analyse_document + serialize_boundary_decisions
                                          pipeline.py:144-147
  -> Product + run_config                pipeline.py:151-161
  -> write_manifest                      pipeline.py:163-188
```

**写出的 9 个 JSON + 2 类伴生产物**：

| 产物 | 生成位置 | 内容 |
|---|---|---|
| `run_manifest.json` | `pipeline.py:163` | 版本、指纹、计数、边界摘要、artifacts 清单 |
| `document.json` | `pipeline.py:104` | `Document` |
| `text_blocks.json` | `pipeline.py:136` | 文本块列表 |
| `tables.json` | `pipeline.py:137` | `Table` 列表 |
| `candidates.json` | `pipeline.py:139` | `CandidateSet` |
| `boundary_decisions.json` | `pipeline.py:146-147` | 规范字节（`sort_keys=True`） |
| `product.json` | `pipeline.py:159` | `Product` |
| `run_config.json` | `pipeline.py:160` | 脱敏配置快照 |
| `pages/geometry.json` | `pipeline.py:105` | 页几何 |
| `source.pdf` | `run_store.py:32-36` | 原始字节副本 |
| `pages/page-XXXX.png` | `pipeline.py:124-126` | 仅检测到表格的页才渲染 |

**Manifest 已含的身份字段**（`pipeline.py:163-188`）：
`run_id`、`document_id`、`document_sha256`、`requested_mpn`、`python_version`、`project_version`、`parser_version`、`contract_version`、`parser_config`、`parser_config_sha256`、`table_params`、`table_params_sha256`、`platform`、`dpi`、`page_count`、`table_count`、`boundary_decisions`、`candidate_count`、`detection_methods`、`rendered_pages`、`model`、`prompt_version`、`artifacts`。

> 关键缺口：manifest **没有** `parser_fingerprint`（源码字节指纹）、`dependency_lock_sha256`、`worker_id`、`attempt`、`task_id`。这些是本设计要新增的（`PROPOSED`）。

### 2.3 数据模型（CONFIRMED）

| 模型 | 关键字段 | 已实现的不变量 |
|---|---|---|
| `Document`（`domain/document.py:21`） | `document_id`、`filename`、`sha256`、`page_count`、`parser_version`、`created_at`、`page_sizes`、`page_rotations` | frozen + `extra=forbid`；`page_count ≥ 1`；`created_at` 必须带时区；页尺寸/旋转必须覆盖全部页；无「当前状态」可变字段 |
| `Table`（`domain/table.py`） | `table_id`、`page_number`、`bbox`、`headers`、`header_rows`、`header_path`、`header_cells`、`rows`、`region_components`、`visual_boundaries`、`visual_boundary_status` | 视觉列与边界一致性校验（`table.py:169-180`） |
| `Candidate`（`domain/candidate.py`） | `candidate_id`、`table_id`、`row_id`、`cell_id`、`page_number`、`bbox`、`raw_text`、`normalized_value`、`unit`、`column_role`、`role_source` | 文档内 candidate 唯一；`unknown` 角色必须 `fail_closed` |
| `Product`（`domain/product.py:37`） | `product_id`、`document_id`、`requested_mpn`、`normalized_mpn`、`identity_evidence` | 两个 MPN 不得互相覆盖；不一致时必须带证据 |
| `Parameter` / `FormalParameterSet`（`domain/parameter.py`） | `parameter_id`、`name`、`value/min/typ/max`、`conditional`、`applicable_mpn`、`table_id`、`evidence_ids`、`verification_status` | 正式容器只接受 `verified/audited`；正式参数必须带证据；非正式状态必须写原因 |
| `EvidenceRecord`（`domain/evidence.py`） | `document_sha256`、`page_number`、`bbox`、`raw_text` | 证据身份 = 文档哈希 + 页 + 框 + 原文 |

**ID 规则（CONFIRMED）**：

| ID | 生成规则 | 位置 |
|---|---|---|
| `document_id` | `doc-<sha256 前 12 位>` | `pdf_loader.py:59` |
| `product_id` | `prod-<document_id>` | `pipeline.py:152` |
| `candidate_id` | `<document_id>:<cell_id>` | `candidate_registry.py:71` |
| `run_id` | `<UTC 时间戳>-<6 位随机>`（RunStore 默认） | `run_store.py:25` |
| `table_id` | 由表重建器生成（`<document_id>` 前缀） | `table_rebuilder.py` |

> 注意：`document_id` 只取 SHA 前 12 位，理论上存在碰撞可能（56 万份时概率极低但非零）。本设计不改变既有 ID，但**要求**在所有对象键与索引中使用**完整 64 位 SHA-256**，`document_id` 只作为人读标识（`PROPOSED`，OD-06）。

### 2.4 测试与已知失败（CONFIRMED）

命令：`python -m pytest -q`
结果：**893 passed, 1 failed, 2 xfailed，236.67 s**。

失败项：

```text
tests/unit/test_assembly.py::test_a1_10_pipeline_py_is_byte_identical_to_the_authorised_snapshot
  actual   sha256(pipeline.py) = 86c0054969572c17f8bc19d5bd14f332053a5926c0a2300777c79ac6ab1b2fa5
  expected PIPELINE_A3_W1_SHA256 = 3394bb66e94c000fd726d466cb5c56ab6a0747c9bcfdfee3f44684a11d4bef0a
```

含义：仓库自己的 A1-10 门禁认定「当前 `pipeline.py` 不是 A3-W1 授权快照」。`pipeline.py` 最后变更是 `2bb1c78 C2: wire the evidence layer into parse_pdf`。

**这是本设计的前置阻断项**：如果 Parser 代码字节本身未被授权，`parser_fingerprint` 再精确也只能记录「一份未授权代码」。在冻结任何批量基准前，必须由 Reviewer 裁定：
(a) 更新授权快照并说明差异；或
(b) 回退到授权快照；或
(c) 书面接受当前字节为新基线。
在此之前，§10 的 Stage B 基准只能作为**工程演练**，不能作为质量验收（OD-02）。

### 2.5 任务队列与状态存储现状（CONFIRMED）

| 检查 | 结果 |
|---|---|
| `src/`、`workbench/`、`tools/` 中 `celery` / `redis` / `boto3` / `duckdb` 引用 | **0 处**（`Select-String` 计数 0） |
| 是否存在任务表 / 任务状态库 | 不存在；唯一持久状态是 `runs/<run_id>/` 目录 |
| 工作台并发控制 | `asyncio.Semaphore`，默认 2（`workbench/serve_parser.py:94`、`:245-249`） |
| 单件超时 | 180 s（`serve_parser.py:92`） |
| 上传上限 | 50 MiB（`serve_parser.py:90`） |
| 冻结闸门 | `ICEX_WORKBENCH_ALLOW_PARSE` 默认 `0`（`serve_parser.py:211`） |
| 子进程 | `asyncio.create_subprocess_exec`（`serve_parser.py:691`），超时杀进程（`:620-624`） |
| 运行目录 | `runs/<run_id>/`，同名拒绝覆盖（`run_store.py:27-29`） |

结论：**当前没有离线批量能力**。工作台是「在线、单件、内存信号量」的调试入口，不能承担 568,830 份。

### 2.6 产品 ID 体系（CONFIRMED）

- 当前 `Product` 只在单文档内成立：`product_id = prod-<document_id>`，`requested_mpn` 与 `normalized_mpn` 分开保存。
- **不存在**跨文档产品主键、产品族、跨批次稳定 ID、产品-文档关联表。
- Morrishk 侧的 `ProId` / `DocumentId` 属于业务库（技术方案 §3.4），与本仓库的 `document_id` 不是同一体系。
- 本设计只保证「解析数据层的文档身份」；产品级 ID 归并属于 §7.5 关联审核，**不在本文范围**（OD-11）。

### 2.7 Stage B 单件血缘 Demo 现状（CONFIRMED，已实际运行）

`lake/` 目录（commit `7d8ab3f`）已实现：

| 层 | 内容 |
|---|---|
| `raw_layer/<sha256>/` | `source.pdf` + `RAW.json`；文件 `chmod 0444`；目录名即内容哈希 |
| `parse_layer/_blobs/<sha256>/<name>` | 8 个产物按内容寻址去重 |
| `parse_layer/<run_id>/` | `run_manifest.json`（四绑定）+ `config_snapshot.json` + `candidates.parquet` |
| `parse_layer/_dependency_lock.txt` | `pip freeze` 过滤后的依赖锁 + 哈希 |
| `eval_layer/gold/gold_v1.0.0/` | 4 个 Gold CSV + `GOLD_MANIFEST.json` |
| `eval_layer/<run_id>/` | `eval.json` + `attribution.csv` |
| `catalog.duckdb` | 3 张表（`raw_docs` / `parse_runs` / `eval_results`）+ 2 个视图（`candidates` / `v_lineage`） |

本次实测（只读脚本，未改数据）：

| 脚本 | 结果 |
|---|---|
| `_verify_lineage.py` | 2 个 run，失败 0；两条链均为 `run_id → raw 059d448c5a34… → gold_v1.0.0 → semantic 0.00%` |
| `_query_demo.py` | Q1 跨三层正常；Q2 同一 `reproducibility_key` 保留 2 个 `run_id`；Q3 该 run 1448 candidates / 11 pages / 14 tables / 1025 value cells；Q4 `parse_runs` PK=1、UNIQUE=0 |
| `_negative_tests.py` | 3/3 PASS（篡改 1 bit、Gold 不覆盖、缺 manifest 拒绝） |
| `_s3_connectivity_test.py --local` | 2896 行 / 2 runs / 14 tables / 11 pages / 2050 value cells，103 ms |
| `_s3_connectivity_test.py --s3` | **未执行**：无任何 S3 凭据；脚本按设计退出码 2 |

**Demo 的已知局限（`lake/README.md:98-103` 与代码）**：

1. 只有 1 个样本（V101），无批量、无并发；
2. `PARSER_FINGERPRINT` 是**硬编码常量**（`_build_lake.py:58`），不是运行时计算；
3. `page_count=21`、`table_count=14` 硬编码（`_build_lake.py:262-263`）；
4. `catalog.duckdb` 每次重建先 `unlink`（`_build_lake.py:359-362`），没有快照；
5. Parquet 每 run 一个文件，没有分区、没有合并；
6. 没有任何对象存储上传代码；S3 分支只是「DuckDB 直读」连通性脚本；
7. 没有任务、租约、重试、断点续跑、死信；
8. `eval` 只读固定样本路径与固定错误矩阵，不能按文档扩展。

### 2.8 依赖、对象存储与 UI 现状（CONFIRMED）

| 项 | 事实 |
|---|---|
| `pyproject.toml` 依赖 | `pymupdf`、`pydantic`、`typer`、`rich`、`python-dotenv`、`pillow`、`pyyaml`；**没有** `duckdb` / `pyarrow` / `boto3` |
| 本机已安装 | `duckdb 2.0.0`、`pyarrow 26.0.1`、`pandas`；`boto3` **未安装** |
| 现有 S3 代码 | 只有 `lake/_s3_connectivity_test.py`（DuckDB `httpfs` 查询），无上传、无 multipart、无重试 |
| 现有对象存储凭据 | 无；`S3_ENDPOINT/BUCKET/KEY/SECRET` 均未配置 |
| 现有对象存储桶 | 无（本次未创建、未连接） |
| 本地 UI | `workbench/index.html`（Parser Lab）、`workbench/b2b/qa_console.html`（B2B 校对台） |
| 本地接口 | `workbench/serve_parser.py`：`/`、`/api/health`、`/api/parse`、`/api/process`、`/api/page`；`workbench/b2b/serve_b2b.py`：只读回放 `runs/_pilot/V101` |
| 已部署环境 | `deploy/dsb/README.md` 记录 G0 冻结环境（`ALLOW_PARSE=0`），**不是**生产解析服务 |

### 2.9 三清单

#### CONFIRMED（可直接复核）

1. `parse_pdf()` 是唯一入口，写出 9 个 JSON + `source.pdf` + 条件渲染 PNG。
2. `RunStore.create()` 拒绝覆盖同名 run；`source.pdf` 哈希与 manifest `document_sha256` 同源。
3. Manifest 已含 Python/项目/Parser 版本、配置哈希、表参数快照哈希、平台、DPI、计数。
4. 领域模型均 frozen + `extra=forbid`，并有 `Parameter` / `Document` 不变量校验。
5. 当前无任务队列、无任务状态库、无对象存储上传、无分区/合并、无重试。
6. `lake/` 单件血缘 Demo 可运行：2 个 run、3 个反例、4 条 SQL、S3 本地模式通过。
7. `lake/` 的 Parser 指纹、页数、表数均为硬编码常量。
8. 全量测试 893 passed / 1 failed / 2 xfailed；失败为 `pipeline.py` 授权快照不一致。
9. `duckdb` / `pyarrow` 未进入项目依赖声明，只在环境与 `lake/` 脚本中使用。
10. 工作台并发 2、超时 180 s、上传 50 MiB、冻结默认开启。

#### PROPOSED（本文设计，未实现）

1. Raw 层对象布局、内容寻址、条件写、对象版本、损坏恢复。
2. Parse 层 Worker 模型、任务租约、分片、断点续跑、幂等、四类指纹、Manifest v2。
3. Eval 层 Gold 版本化、字段级/结构/证据完整性指标、人工审核记录、质量门。
4. DuckDB 职责边界、Parquet 分区与合并、本地暂存、快照发布、并发限制。
5. 调度与基础设施：本地 / MinIO / ECS / 对象存储 / 日志 / 失败队列 / 成本方法。
6. 10 条数据不变量、15 项负向测试、三级性能验证、成本公式。
7. 对 `lake/` 的升级路径与必须删除的硬编码。

#### OPEN（需裁定）

见 `OPEN_DECISIONS.md`。其中阻断级（P0）三项：

- **OD-01**：对象存储选型与区域（决定能否同区直读、成本与合规）。
- **OD-02**：`pipeline.py` 授权快照不一致（决定能否冻结 Parser 指纹）。
- **OD-03**：任务领取机制（确定性分片 vs 条件写抢占）在目标对象存储上的可用性。

---

## 3. 总体架构

### 3.1 分层

```
┌────────────────────────────────────────────────────────────────────┐
│ 控制面（无独立数据库）                                              │
│  批次清单（不可变 JSONL）· 分片 · 租约 · 事件日志 · 死信 · 墓碑      │
└───────────────┬────────────────────────────────────────────────────┘
                │ 读取任务 / 写回状态
┌───────────────▼────────────────────────────────────────────────────┐
│ 计算面：Worker（2–4 台 ECS，8 vCPU / 16 GB 起）                     │
│  单件子进程 parse_pdf → 本地暂存 → Parquet → 上传 → Manifest         │
└───────────────┬────────────────────────────────────────────────────┘
                │ 只写新对象（If-None-Match），不覆盖
┌───────────────▼────────────────────────────────────────────────────┐
│ 存储面：S3 兼容对象存储（同区、私有桶、版本化）                      │
│  raw/  parse/  eval/  control/  catalog/  logs/                     │
└───────────────┬────────────────────────────────────────────────────┘
                │ 只读
┌───────────────▼────────────────────────────────────────────────────┐
│ 分析面：DuckDB（单写者构建快照，多读者只读）                        │
│  catalog/snapshots/<snapshot_id>/catalog.duckdb + manifest.json      │
└────────────────────────────────────────────────────────────────────┘
```

### 3.2 单件与批量数据流

**单件（Stage A 验收路径）**

```
PDF 字节
  → [1] Raw 入口：流式 SHA-256 → 临时键 → 条件写 raw/pdf/<aa>/<sha256>.pdf
  → [2] 任务：写 task 事件 PENDING → CLAIMED → RUNNING
  → [3] Worker：本地工作区 work/<task_id>/，调用 parse_pdf(run_id=...)
  → [4] 产物：JSON 按内容寻址上传 parse/blobs/<aa>/<sha256>/<name>
  → [5] Parquet：candidates/rows 追加到本地批次缓冲，达阈值刷盘并上传
  → [6] Manifest v2：最后写；写成功即该 run 的提交点
  → [7] Eval：按 Gold 版本 + 评估器指纹生成 eval.json + attribution.csv
  → [8] Catalog：构建新快照 snapshot_id；DuckDB 只读查询
  → [9] Lineage：verify_lineage 校验 eval → parse → raw → snapshot
```

**批量（Stage B / C）**

```
批次清单（tasks.jsonl，不可变）
  → 按 sha256 分片到 N 个 Worker（确定性，无协调）
  → 每 Worker 串行/小并发处理自己的分片
  → 每 1000 份（或 256 MB）刷一个 Parquet 分片并上传
  → 每完成一个分片，写事件日志检查点
  → 批次结束：构建快照 + 全量 lineage 校验 + 汇总指标
```

### 3.3 DuckDB 与对象存储的四种组合（本设计的关键评估）

任务书要求特别评估「Worker 本地处理 → 批量生成 Parquet → 上传对象存储 → DuckDB 批量查询」。逐项比较：

| 模式 | 做法 | 优点 | 致命问题 | 结论 |
|---|---|---|---|---|
| **A 直读远程零碎文件** | DuckDB `read_parquet('s3://…/<run_id>/candidates.parquet')` 扫 56 万个对象 | 无本地复制 | 每次 scan 触发逐对象 HEAD + range 请求；单对象 28–100 KB；56 万对象会产生百万级请求与分钟级冷启动；跨区 RTT 放大数十倍；重试与限流不可控 | **拒绝**用于批量；只允许单件调试 |
| **B 本地处理 → 大批 Parquet → 上传 → 批量查询** | Worker 本地累积、按 1000 份/256 MB 写一个文件；DuckDB 读少量大文件（本地 NVMe 或 S3） | 请求数下降 2–3 个数量级；文件内列裁剪与谓词下推有效；与现有单件链路兼容 | 需要本地暂存与合并；上传失败要重试；快照发布需单写者 | **采用（主路径）** |
| **C 本地物化 + 查询缓存** | 从对象存储把某个分区下载到 NVMe，再本地查询 | 查询延迟最低；可离线 | 需要磁盘与缓存淘汰；数据新鲜度靠快照 | **采用（查询侧默认）** |
| **D 远程直读少量大文件** | 同区、单文件 ≥128 MB、分区裁剪明确 | 无本地复制，延迟可接受 | 依赖同区与文件大小；并发 scan 会抢带宽 | **允许（有前置条件）** |

**决策 D-01（PROPOSED）**：批量路径采用 **B + C**；D 只作为「同区 + 大文件」的补充；A 禁止进入任何批量作业或基准对比之外的生产查询。

**理由（可复核）**：

- 单件 Parquet 实测 28,332 B（`lake/parse_layer/<run_id>/candidates.parquet`）；按 568,830 份计约 16 GB，但对象数同为 568,830；DuckDB 每次 `read_parquet` glob 都要列出并打开这些对象。
- 本机 `--local` 聚合 2,896 行耗时 103 ms；这是**本地 2 个文件**的结果，不能外推为 S3 上 56 万个文件的性能。
- `lake/_s3_connectivity_test.py` 的 docstring 已写明：跨区直读会被 RTT 放大，应先物化（`_s3_connectivity_test.py:11-14`）。

### 3.4 关键架构决策清单

| 编号 | 决策 | 类型 | 依据 |
|---|---|---|---|
| D-01 | 批量采用「本地 → 大批 Parquet → 上传 → 批量查询」 | PROPOSED | §3.3；请求数与文件大小 |
| D-02 | DuckDB 不是队列、不是锁、不是多写库、不是事实源 | PROPOSED | §7.1；避免把分析引擎当 OLTP |
| D-03 | 原始 PDF 以完整 SHA-256 内容寻址，只增不改 | PROPOSED（Demo 已实现） | `lake/_build_lake.py:107-133` |
| D-04 | Parse 以 `run_id` 为执行身份，`reproducibility_key` 为可复现条件 | PROPOSED（Demo 已实现） | `lake/_build_lake.py:229-249` |
| D-05 | 任务状态用「不可变批次清单 + 确定性分片 + 追加事件 + 租约」，不引入队列服务器 | PROPOSED | §5.2；2–4 台规模不需要中间件 |
| D-06 | 发布顺序：blob → parquet → manifest → 任务成功；manifest 是提交点 | PROPOSED | §5.5；缺失即失败 |
| D-07 | 历史结果只增不改；压缩/合并产生新对象与新快照，不覆盖旧对象 | PROPOSED | §7.5；可审计 |
| D-08 | 每次查询必须绑定 `snapshot_id` | PROPOSED | 不变量 9 |
| D-09 | Parser 指纹必须运行时计算，禁止硬编码 | PROPOSED | 修正 `lake/_build_lake.py:58` |
| D-10 | 失败重试必须带 `attempt` 与独立 `run_id`，结果不合并、不覆盖 | PROPOSED | 不变量 8 |
| D-11 | 删除一律改为墓碑；对象存储开启版本化与保留策略 | PROPOSED | 不变量 10 |
| D-12 | 不引入独立数据库服务器、不引入 Redis/Kafka/Celery | PROPOSED | 规模与运维成本；任务书要求 |

---

## 4. Raw Layer

### 4.1 设计目标

1. 原始 PDF 字节不可变，任何 Parse/Eval 都不能改写；
2. 同一内容只存一份，重复输入可识别；
3. 任何一份 Parse 都能精确定位到唯一原始对象；
4. 上传中断、网络抖动、对象存储短暂不可用都不产生半个对象；
5. 对象损坏能被发现，并能从源站重新取得同一字节。

### 4.2 对象布局与命名

```
s3://<bucket>/dsbit-lake/v1/raw/
  pdf/<aa>/<sha256>.pdf
  meta/<aa>/<sha256>.json
```

- `<aa>` = SHA-256 前 2 个十六进制字符（256 个前缀目录）；568,830 个对象时平均每目录约 2,222 个，避免单目录百万对象。
- 文件名 = **完整** 64 位小写 SHA-256，扩展名固定 `.pdf`。
- 不使用原始文件名、不使用 `PdfId`、不使用厂商/型号作为键。
- `meta/<aa>/<sha256>.json` 是 `RAW.json`，只记录元数据，不承载内容。

### 4.3 上传协议（三步提交）

```
[1] 接收/下载到本地临时文件 tmp/<uuid>.part
[2] 流式计算 SHA-256（1 MiB chunk），同时校验：
      - 字节数 > 0
      - 前 5 字节为 "%PDF-"
      - （可选）能打开且页数 ≥ 1（解析前的轻校验，不替代 parse_pdf 的校验）
[3] 条件写：
      PUT raw/pdf/<aa>/<sha256>.pdf
        If-None-Match: *
      成功 → 新对象；412/409 → 已存在，转 [4]
[4] 已存在时：
      HEAD 取 ContentLength / ETag / VersionId
      与本地字节数比较；不一致 → 视为冲突，拒绝并告警（不得覆盖）
[5] 写 meta/<aa>/<sha256>.json（同样 If-None-Match: *；已存在则字节比对）
[6] 删除本地临时文件；向任务事件写 RAW_COMMITTED
```

**为什么先临时名、后改名**：避免对象存储里出现「半个 PDF」。条件写保证并发上传同一内容时只有一个成功，其余识别为重复。

### 4.4 不可变保护（三层）

| 层 | 机制 | 说明 |
|---|---|---|
| 应用层 | 只允许 `If-None-Match: *` 写 raw/；代码中不存在 `PUT` 覆盖 raw 的路径 | 代码审查 + 负向测试 |
| 对象存储 | 桶开启 **Versioning**；可选 **Object Lock（Governance/Compliance）** | 即使误覆盖也保留历史版本 |
| 校验层 | `verify_lineage` 重算对象字节 SHA-256，与键名比较 | 发现篡改立即失败 |

> 对象锁（Object Lock）需要桶创建时开启，且部分 S3 兼容实现不支持；是否启用列入 OD-04。即使不启用，应用层条件写 + 版本化已能覆盖本设计的威胁模型（误操作，不是恶意管理员）。

### 4.5 去重

- **内容级**：同一 SHA-256 只允许一个 `raw/pdf/...` 对象。
- **业务级**：同一 `PdfId` 内容变化 → 新 SHA-256 → 新对象 + 新 `document_asset` 记录（`Revision`），旧对象保留。
- **统计**：批次结束时报告 `unique_sha256 / total_inputs`；重复率是 Stage B 的必测项。
- **不做**：模糊去重、相似页去重、跨厂商模板去重（不在本轮）。

### 4.6 元数据（RAW.json）

```json
{
  "schema": "lakehouse/raw/v1",
  "source_sha256": "059d448c...",
  "bytes": 1224626,
  "content_type": "application/pdf",
  "immutable": true,
  "ingest": {
    "at": "2026-11-17T02:11:03Z",
    "by": "worker-02",
    "source": "origin_download",
    "source_uri": "https://.../LM358.pdf",
    "http_status": 200,
    "etag": "\"5f2c...\"",
    "object_version_id": "3HL4k..."
  },
  "checks": {
    "magic_ok": true,
    "size_ok": true,
    "sha256_ok": true,
    "pages": 21
  },
  "policy": "内容寻址；只增不改；应用层 If-None-Match；桶版本化"
}
```

> 不在 RAW.json 中写入任何密钥、Cookie、带签名的 URL 或内网地址。

### 4.7 损坏与恢复

| 场景 | 检测 | 处置 |
|---|---|---|
| 上传时字节损坏 | 本地 SHA-256 与源声明不一致 | 丢弃临时文件，任务 `INVALID_INPUT`，不提交 |
| 对象已存在但大小不符 | HEAD ContentLength 与本地不同 | 拒绝覆盖，标记 `RAW_CONFLICT`，人工核查 |
| 读时对象损坏 | `verify_lineage` 重算哈希失败 | 任务置 `QUARANTINED`；从源站重新下载；新字节若哈希相同则复用，不同则作为新 Revision |
| 对象存储不可用 | 请求超时/5xx | 指数退避重试；任务保持可运行；不写半成品 |
| 误删 | 版本化删除标记 | 恢复指定 `VersionId`；写墓碑审计 |

---

## 5. Parse Layer

### 5.1 Worker 运行模型

- **一台机器 = 一个 Worker 进程池**；每个任务在**独立子进程**中执行 `parse_pdf()`，父进程只负责超时、日志与状态。
- 子进程隔离沿用工作台已验证的做法（`workbench/serve_parser.py:691`、`:620-624`）：超时 → terminate → 宽限 5 s → kill；POSIX 杀进程组，Windows 用 `proc.kill()`。
- Parser 代码与依赖**按批次冻结**：Worker 启动时计算一次 `parser_fingerprint` 与配置哈希，整批不允许变化；变化即停止接新任务（见 §5.4）。
- 本地工作区：`/data/work/<batch_id>/<task_id>/`，任务结束（成功或失败）后清理；只保留日志与必要证据。

### 5.2 任务领取与状态持久化

**明确：DuckDB 不承担任务队列职责。** 任务状态不写入 `catalog.duckdb`，也不以 DuckDB 作为并发控制。

**任务来源**：批次清单是不可变 JSONL：

```
control/batches/<batch_id>/tasks.jsonl
  每行：{task_id, batch_id, document_sha256, source_uri, priority, shard, created_at}
```

**分片（默认）**：

```
shard = crc32(document_sha256) % shard_count
```

- 2–4 台 Worker 时，`shard_count = worker_count`，每台只处理自己的分片；
- 无中央协调、无抢占、无锁；重启后重扫自己的分片，已完成的任务通过事件日志/结果对象跳过；
- 扩容时重新分片需要新的批次（或支持 `shard_count` 变更并重算，代价是重复扫描，不重复解析——见幂等）。

**备选**：对象存储条件写抢占（`PUT control/tasks/<task_id>/claim If-None-Match: *`）。优点是可动态扩容；缺点是依赖各 S3 实现的 `If-None-Match` 语义，且每次领取多一次请求。列入 OD-03，默认不启用。

**状态存储（事件溯源）**：

```
control/events/<batch_id>/<shard>-<worker_id>.jsonl   # 追加写，定期上传
control/tasks/<task_id>/final.json                    # 仅终态（成功/永久失败/隔离）
```

- 事件是不可变事实：`{event_id, task_id, attempt, from, to, at, worker_id, run_id, error_class}`；
- 当前状态 = 按 `task_id` 折叠事件，取最大 `(at, event_seq)`；
- 每 30 s 或每 100 条事件上传一次分片日志；崩溃最多丢失一个窗口的事件，任务会被重新领取；
- 重复领取是安全的：结果按 `run_id` 唯一、按内容寻址，不会覆盖。

### 5.3 并发、超时与资源

| 项 | 建议值 | 依据 |
|---|---|---|
| 每机并发 | 起始 4，基准后按实测调 | 解析是 CPU 密集；工作台在 2 vCPU 上设 2（`New_Gate_受控灰度方案.md` §3） |
| 单件基础超时 | 180 s | 与工作台一致（`serve_parser.py:92`） |
| 大件超时 | `min(1800, 180 + 6 × page_count)` | **PROPOSED**，待 200 页级实测（OD-05） |
| 上传/下载超时 | 60 s 连接 + 600 s 总时长 | 大文件 multipart |
| 本地磁盘 | 单任务预留 `max(2 GB, 30 × PDF 大小)` | 产物 JSON 约为 PDF 的 3.8 倍（V101：1.22 MB → 4.65 MB，9 个 JSON 合计 4,651,886 B） |
| 内存 | 未测；起始按 4 GB/并发进程预留 | 峰值 RSS 未实测（`New_Gate_受控灰度方案.md` §6 已写明） |

### 5.4 四类指纹与 run_id

| 字段 | 计算方式 | 写入位置 | 用途 |
|---|---|---|---|
| `parser_fingerprint` | 对声明的源码文件列表（相对路径 + 每个文件 SHA-256）排序后拼接再 SHA-256 | Manifest `reproducibility` | 代码字节身份；不依赖 commit（工作树也可表达） |
| `config_hash` | `load_config()` 返回的配置文件字节 SHA-256 | Manifest | 解析参数身份 |
| `table_params_sha256` | 现有 `table_params_sha256()` | Manifest | 表格参数子集身份 |
| `dependency_lock_sha256` | `pip freeze` 过滤本地路径/VCS 后的文本 SHA-256 | Manifest + `parse/blobs/.../dependency_lock.txt` | 运行环境身份 |
| `run_id` | `<doc8>-<UTC>-a<attempt>-<rand4>` | Manifest / 目录名 | 唯一执行身份 |

**指纹范围（PROPOSED，需冻结）**：

```
src/icpdf/parser/**/*.py
src/icpdf/domain/*.py
src/icpdf/storage/*.py
src/icpdf/__init__.py
```

- 排除 `__pycache__`、`*.pyc`、测试、工具；
- 行尾按仓库 `.gitattributes` 统一为 LF 后计算；若工作树含 CRLF，先归一化，避免 Windows/Linux 指纹不同（OD-06）；
- Manifest 记录 `parser_fingerprint_scope`（文件列表及每个文件哈希），保证可重算；
- **禁止硬编码**：`lake/_build_lake.py:58` 的常量必须在实现时替换为运行时计算。

**为什么不用 commit SHA**：`lake/README.md:35-37` 已说明——v2 复跑跑在「修复已写好但未提交」的工作树上，commit SHA 描述不了那份字节。

### 5.5 上传与提交顺序（提交点）

```
1. 解析产物 JSON 逐个按内容寻址上传（幂等；同名同字节直接跳过）
2. candidates/tables/documents 行写入本地 Arrow 缓冲；达阈值 → 写 Parquet → 上传
3. 计算 manifest，上传 parse/runs/<run_id>/manifest.json（If-None-Match: *）
4. 写 task 事件 SUCCEEDED（携带 manifest_sha256、parquet 文件列表）
```

**Manifest 是提交点**：没有 manifest 的 run 一律视为未成功；Eval 与 Catalog 都拒绝消费。步骤 1–2 产生的孤儿 blob/parquet 允许存在（内容寻址，后续可按引用计数清理，但**不自动删除**）。

### 5.6 Manifest v2 格式

见 `PIPELINE_ARTIFACTS.md` §2（完整示例）。要点：

- 顶层 `schema = lakehouse/run-manifest/v2`；
- `identity`：`run_id` / `task_id` / `attempt` / `worker_id`；
- `reproducibility`：`reproducibility_key`（四元组哈希）、`source_sha256`、`parser_fingerprint`、`config_hash`、`dependency_lock_sha256`、`python_version`、`platform`；
- `source`：桶、键、字节、`version_id`、`etag`；
- `artifacts`：每个产物的 `name` / `sha256` / `bytes` / `object_key`；
- `parquet`：每张表的文件列表与行数；
- `counts`：页数、表数、候选数；
- `timings`：各阶段耗时；
- `status`：`complete` / `partial`（partial 不得被 Eval 消费）。

### 5.7 幂等与断点续跑

| 场景 | 行为 |
|---|---|
| 同一任务被重复领取 | 先查 `control/tasks/<task_id>/final.json`；已成功则跳过 |
| 同一输入 + 同一指纹 + 同一配置已成功 | 查 Catalog/对象存储中的 `reproducibility_key`；命中则 `SKIPPED_DUPLICATE`，记录 `canonical_run_id` |
| 解析中断（进程被杀） | 本地工作区丢弃；已上传的 blob 可复用；任务重试产生新 `run_id`（新 `attempt`） |
| 上传中断 | 用 multipart resume 或整文件重传；已存在同字节则跳过 |
| Worker 重启 | 重扫分片；已成功任务跳过；未完成任务按事件日志恢复 |
| 批次中途代码变化 | 指纹漂移 → 停止接新任务，已在跑的任务完成或标记；不允许同一批次混用两个指纹 |

---

## 6. Eval Layer

### 6.1 数据模型

| 实体 | 内容 | 不可变性 |
|---|---|---|
| `gold_version` 目录 | `eval/gold/<gold_version>/`：Gold CSV + `GOLD_MANIFEST.json` | 只增不改；新版本新目录 |
| `GOLD_MANIFEST.json` | 版本、创建时间、文件逐项 SHA-256、行数、来源、批准人 | 冻结 |
| `eval_result` | `eval_id`、`run_id`、`source_sha256`、`gold_version`、`evaluator_fingerprint`、指标、错误计数、质量门 | 按 `(run_id, gold_version, evaluator_fingerprint)` 唯一，只增 |
| `attribution` | 逐行归因 CSV（Gold 行 ↔ 解析行 ↔ 错误类别） | 随 eval 冻结 |
| `review_record` | 人工审核：审核人、样本、判定、原因码、证据引用 | 追加式 JSONL，不改写 |
| `quality_gate` | 通过/不通过与原因列表 | 随 eval 冻结 |

### 6.2 PDF 与 Gold 的关联

沿用现有评估器口径（`lake/_build_lake.py:299-352` 与 `workbench/gate6a_replay/audit/error_matrix_105.csv`）：

- Gold 项以 `(sample/document, page, bbox)` 定位；预测与 Gold 按同页 IoU ≥ 0.5 一对一匹配；
- `eval_result` 必须同时引用 `run_id` 与 `gold_version`；
- 同一 `run_id` 可以针对多个 `gold_version` 生成多份 eval；互不覆盖；
- 评估器代码变化 → 新 `evaluator_fingerprint` → 新 eval 记录。

### 6.3 指标

**字段级**（沿用 `v3_metrics.json` 已存在的键）：

- `located_rows` / `location_rate`
- `strict_hit_rows` / `strict_hit_rate`
- `soft_hit_rows` / `soft_hit_rate`
- `exact_rows` / `exact_rate`
- `symbol_gated_strict_hit_*`
- `condition_gated_strict_hit_*`
- `semantic_hit_*`
- `miss_rate`
- `field_level`：`value_match` / `unit_match` / `symbol_match` / `condition_match`

**表格结构**：

- 行数/列数一致率；
- 单元格文本多重集 F1（沿用 Gold 评估器口径）；
- 表头深度一致率；
- 合并单元格覆盖率。

**BBox 证据完整性**：

- 每个候选必须能给出 `run_id + candidate_id + page_number + bbox + cell_id`；
- 指标：`evidence_complete_rows / published_rows`，发布门槛 **100%**（沿用技术方案 §7.6「证据完整性」）；
- 无法给出证据的行只能进入 `unresolved`，不得发布。

**错误分类**（沿用现有列，不另造体系）：

`match_status`、`strict_hit`、`soft_reason`、`symbol_inheritance`、`condition_attribution`、`error_category`、`secondary_category`、`defect_owner`。

### 6.4 人工审核记录

```json
{
  "schema": "lakehouse/review/v1",
  "review_id": "rev-20261117-0001",
  "batch_id": "B1-20261117",
  "item": {"run_id": "...", "gold_row_id": "G068", "candidate_id": "..."},
  "reviewer": {"id": "r-03", "role": "annotator"},
  "verdict": "accept|reject|needs_second_review",
  "reason_codes": ["unit_mismatch", "wrong_row"],
  "evidence": {"page": 105, "bbox": [..], "crop_sha256": "..."},
  "at": "2026-11-17T09:12:00Z",
  "snapshot_before": "sha256 of the reviewed row payload"
}
```

- 审核记录**追加**，不修改 Gold；
- 若结论需要改 Gold，只能走「新 Gold 版本」流程（新目录 + 新清单 + 审批），不得原地改；
- 双人独立判定 + 第三人裁决沿用技术方案 §7.10。

### 6.5 质量门

| 检查 | 阈值 | 来源 | 不通过 |
|---|---|---|---|
| 参数行数 | ≥ 3 | 技术方案 §7.6 | `QualityStatus=3` |
| 关键参数 | 至少含 Package/Series/Mount 之一 | 同上 | 人工复核 |
| 置信度均值 | ≥ 0.75 | 同上 | 不发布 |
| 与 `DataAttr` 冲突 | 同名字段不一致 | 同上 | 人工裁决，不自动覆盖 |
| 单位合法性 | 白名单 | 同上 | 丢弃该条 |
| 数值范围 | 物理合理区间 | 同上 | 丢弃该条 |
| 文档类型 | 白名单 | 同上 | 整体降级 |
| 空文本/扫描版 | 文本层为空 | 同上 | 不解析 |
| 证据完整性 | `PageNo` + `CellBBox` 非空 | 同上 | 不发布 |
| **血缘完整性** | `verify_lineage` 通过 | 本文新增 | run 不得标记成功 |
| **Manifest 完整性** | 必填字段齐全、哈希可重算 | 本文新增 | 不得进入 Eval |
| **指纹一致** | 批次内 `parser_fingerprint` / `config_hash` 不变 | 本文新增 | 停止接任务并告警 |

> 前 9 行是已批准方案中的既有阈值；最后 3 行是本文新增，需 Reviewer 确认（OD-09）。

### 6.6 历史评估可复现

- `eval_result` 冻结后不改；重跑同一 `(run_id, gold_version, evaluator_fingerprint)` 必须得到相同指标（浮点按固定精度比较）；
- 评估器升级 → 新指纹 → 新 eval；旧 eval 保留；
- Gold 升级 → 新版本目录；旧 eval 仍指向旧版本，可复现；
- 任何「重算后覆盖旧 eval」的行为都视为违规（不变量 7）。

---

## 7. DuckDB + Parquet

### 7.1 职责边界（硬性）

| 允许 | 禁止 |
|---|---|
| 只读分析查询（统计、质量报表、血缘核对） | 作为任务队列 / 状态机 |
| 单写者构建快照 | 多个 Worker 同时写同一个 `.duckdb` 文件 |
| 读取 Parquet（本地或对象存储） | 作为原始数据唯一存储 |
| 生成派生的指标表 | 在 DuckDB 中保存不可重建的唯一事实 |
| 通过 `snapshot_id` 固定查询视图 | 直接查询「最新目录」而不记录版本 |

**一句话**：`catalog.duckdb` 是**派生物**，任何时候都应能从对象存储重建；重建不出的信息不允许只存在于 DuckDB。

### 7.2 Parquet 布局与分区

```
parse/tables/table=candidates/batch=<batch_id>/part-00001.parquet
parse/tables/table=documents/batch=<batch_id>/part-00001.parquet
parse/tables/table=tables/batch=<batch_id>/part-00001.parquet
eval/tables/table=metrics/batch=<batch_id>/part-00001.parquet
```

**分区决策（PROPOSED）**：

| 维度 | 选择 | 理由 |
|---|---|---|
| 主分区 | `batch_id`（约 1000 份/批） | 与基准/试跑边界一致；避免按 `run_id` 产生 56 万个小文件 |
| 次分区 | **不加** `year/month/day` | 多层分区会把单文件压到很小，反而恶化 |
| 单文件目标 | 128–512 MB（未压缩） | 列裁剪/谓词下推效率；对象请求数可控 |
| 压缩 | `zstd` | 已有 Demo 使用 `zstd`（`_build_lake.py:213`） |
| 文件命名 | `part-<5 位序号>.parquet`，分区内单调递增 | 不覆盖；新增文件用新序号 |

**字段设计（candidates 示例）**：

| 字段 | 类型 | 说明 |
|---|---|---|
| `run_id` | VARCHAR | 外键到 parse manifest |
| `task_id` | VARCHAR | 任务 |
| `attempt` | INTEGER | 第几次尝试 |
| `source_sha256` | VARCHAR | 原始字节 |
| `candidate_id` | VARCHAR | 候选 |
| `document_id` / `table_id` / `row_id` / `cell_id` | VARCHAR | 既有 ID |
| `page_number` | INTEGER | 页 |
| `bbox` | LIST<DOUBLE> 或 4×DOUBLE | 坐标 |
| `raw_text` / `normalized_value` / `unit` | VARCHAR | 原文与归一 |
| `column_role` / `role_source` | VARCHAR | 角色与来源 |
| `candidate_type` / `extraction_method` / `source_text_type` / `reconstruction_status` | VARCHAR | 既有枚举 |

> 现有 `lake` 的 Parquet 字段即此集合（`_build_lake.py:186-209`），本文只增加 `task_id` / `attempt`。

### 7.3 小文件合并

- **写入侧**：本地 Arrow 缓冲，达到 256 MB 或 1000 份即刷一个文件；
- **合并侧**：批次结束扫描分区，若平均文件 < 64 MB 或文件数 > 4，重写为更大的 `part-000NN.parquet`；
- **不覆盖**：合并产物使用新文件名与新 `snapshot_id`；旧文件保留，快照 manifest 只引用新文件；
- **不跨批次合并**：批次是审计边界；跨批次合并会让「某批次到底跑了什么」不可回答；
- **清理**：不自动删除旧文件；由保留策略（OD-14）统一处理。

### 7.4 本地临时工作区

```
/data/work/<batch_id>/<task_id>/          # 单任务
/data/work/<batch_id>/_flush/             # Parquet 刷盘暂存
/data/work/<batch_id>/_cache/<snapshot>/  # 查询缓存（可选）
```

- 使用 NVMe；剩余空间低于 20% 时停止接新任务；
- 任务成功/失败后清理单任务目录；`_flush` 在文件上传成功后才删；
- 查询缓存按 `snapshot_id` 隔离，避免「缓存串版本」。

### 7.5 批量写入

- 单 Worker 内串行写一个 Parquet 文件（不并发写同一文件）；
- 行组（row group）建议 128 MB；写入时 `use_dictionary` 对 `column_role` / `candidate_type` 等低基数字段开启；
- 每批写完后计算文件 SHA-256，记入该分区的 `part_index.json`；
- 上传使用 multipart（≥ 64 MB）并校验 ETag/字节数。

### 7.6 并发访问限制

| 角色 | 允许 | 说明 |
|---|---|---|
| Worker | 只写 Parquet，不打开 catalog 写 | 避免多进程写同一 `.duckdb` |
| Catalog 构建器 | **唯一写者**；构建新快照 | 串行，单进程 |
| 查询读者 | `read_only=True` 打开快照 | 可多进程并发读 |
| 临时分析 | 复制快照到本地临时目录后写 | 不碰共享快照 |

DuckDB 单文件不支持多进程并发写；本设计通过「单写者 + 不可变快照」绕开，而不是加锁。

### 7.7 数据版本与快照

```
catalog/snapshots/<snapshot_id>/
  catalog.duckdb
  manifest.json
```

`snapshot_id = snap-<UTC>-<8 位随机>`；`manifest.json` 记录：

```json
{
  "schema": "lakehouse/catalog-snapshot/v1",
  "snapshot_id": "snap-20261117T021500Z-9f3c1a2b",
  "created_at": "2026-11-17T02:15:00Z",
  "builder": {"worker": "catalog-01", "duckdb_version": "2.0.0"},
  "inputs": {
    "manifest_prefix": "parse/runs/",
    "manifest_count": 1000,
    "max_run_created_at": "2026-11-17T02:10:00Z",
    "parquet_files": [
      {"key": "parse/tables/table=candidates/batch=B1-.../part-00001.parquet",
       "sha256": "...", "bytes": 123456789, "rows": 1234567}
    ]
  },
  "tables": {"raw_docs": 1000, "parse_runs": 1000, "eval_results": 0},
  "schema_version": "lakehouse/catalog/v1"
}
```

- 发布方式：先在本地构建 → 校验 → 上传到新前缀 → 最后上传 `manifest.json`（提交点）；
- 读者先读 manifest，再按清单打开文件；**不依赖目录列表**（对象存储 list 结果可能最终一致）；
- 快照只增不改；旧快照保留。

### 7.8 查询性能与资源监控

```sql
SET memory_limit = '8GB';
SET threads = 4;
SET temp_directory = '/data/tmp/duckdb';
SET preserve_insertion_order = false;
```

- 每条查询记录：`snapshot_id`、SQL 哈希、耗时、扫描字节、返回行数；
- `EXPLAIN ANALYZE` 用于慢查询；
- 客户端超时（例如 120 s）到点取消，不把半截结果当成功；
- 查询结果必须能回答「用的是哪个快照」（不变量 9）。

### 7.9 查询示例

见 `PIPELINE_ARTIFACTS.md` §5：

- Q1 跨三层血缘；
- Q2 同条件多次执行；
- Q3 按批次/角色聚合；
- Q4 证据完整性；
- Q5 失败与重试；
- Q6 快照自校验（文件哈希与行数）。

---

## 8. 调度与基础设施

### 8.1 环境矩阵

| 环境 | 用途 | 计算 | 存储 | 约束 |
|---|---|---|---|---|
| 开发（本机） | 写代码、单件调试 | Windows + Python 3.13 | 本地磁盘 | 不连生产桶；不批量 |
| 本地验证 | S3 语义、断点续跑 | 本机 + MinIO（Docker） | MinIO 本地卷 | 仅测试数据；**本轮未安装**（OD-05） |
| 云端 Worker | 1000 份 / 3–5 万试跑 | 2–4 × ECS 8 vCPU / 16 GB | 本地 NVMe 200–500 GB | 同区对象存储；私有网络 |
| 对象存储 | 事实存储 | — | S3 兼容桶，版本化 | 私有、加密、同区 |
| 分析节点 | 构建快照 / 查询 | 1 × 8 vCPU / 32 GB（建议） | 同上 | 单写者 |

> 现有 G0 环境（DigitalOcean 8 vCPU / 16 GB，`deploy/dsb/README.md`）可作为 Worker 规格参考，但它是**冻结的在线环境**，不得用于批量解析。

### 8.2 任务状态持久化

- 事实：`control/` 下的不可变批次清单 + 追加事件日志 + 终态文件；
- 本地缓存：Worker 可用 SQLite（WAL）保存「已处理 task_id」以加速重启，但**不是权威**；
- 恢复：以对象存储事件为准重放；
- 不引入 Redis / Kafka / Celery / 独立数据库（D-12）。

### 8.3 日志与监控

| 项 | 形式 | 保留 |
|---|---|---|
| Worker 运行日志 | JSONL（`logs/<date>/<worker_id>.jsonl`） | 30 天热存，之后归档 |
| 任务事件 | `control/events/...` | 全量保留 |
| 指标快照 | 每 30 s 一行 JSON（CPU、RSS、磁盘、队列剩余、失败数） | 批次结束汇总 |
| 失败/死信 | `control/deadletter/...` | 全量保留，人工处理 |
| 查询日志 | `logs/query/<date>.jsonl` | 90 天 |

**最小告警集**（与灰度方案 §6 对齐）：失败率、P95 耗时、重试率、磁盘水位、对象存储 5xx、指纹漂移。

### 8.4 失败队列与重试

- 可重试错误 → `RETRY_SCHEDULED`，进入重试队列（按 `next_attempt_at` 排序的本地文件/批次清单）；
- 达到最大次数 → `DEADLETTER`，不再自动重试；
- 人工处理后可以「新批次 + 新 attempt」重跑，**不复用旧 run**；
- 任何重试都写事件，不静默吞掉。

### 8.5 资源弹性

- 2–4 台固定 Worker 足够 3–5 万试跑；不做自动扩缩容（避免分片重算）；
- 扩容通过「新批次 + 新分片数」实现；
- 停机不丢任务：事件日志 + 结果对象 + 幂等重扫。

### 8.6 成本核算（方法）

```
月成本 =
    Σ(Worker 运行小时 × 每小时单价)
  + 对象存储 GB-月 × 单价
  + PUT/GET 请求数 × 单价
  + 出口流量 GB × 单价
  + 分析节点小时 × 单价
  + 运维人力（单列，不摊进单件成本）
```

单件成本 = 月成本 ÷ 当月成功处理的唯一文档数。完整公式与假设表见 `BENCHMARK_AND_COST_PLANS.md` §5；所有单价均为**待确认占位**，不是报价。

---

## 9. 数据不变量

逐条实现与测试方法见 `INVARIANT_AND_NEGATIVE_TEST_MATRIX.md`。这里给出定义与判定点。

| # | 不变量 | 实现方式 | 判定点 |
|---|---|---|---|
| I-1 | Raw 对象不可被 Parse/Eval 覆盖 | 应用层只允许 `If-None-Match: *`；桶版本化；代码中无 raw 覆盖路径 | 负向测试 N-15；对象历史版本 |
| I-2 | SHA-256 必须与原始 PDF 内容一致 | 流式哈希；键名即哈希；读时重算 | `verify_lineage`；N-01 |
| I-3 | 同一 PDF 重复输入可识别 | 内容寻址 + 条件写 + `unique_sha256 / inputs` 统计 | N-02 |
| I-4 | 每个 Parse 结果可追溯到唯一 Raw 对象 | Manifest 必填 `source_sha256` + `source.key` + `version_id`；raw 对象必须存在 | 血缘校验；N-14 |
| I-5 | 每个 Parse 记录 Parser 与配置指纹 | 运行时计算四类指纹；Manifest 必填 | Manifest schema 校验；N-08/N-09 |
| I-6 | 每个 Eval 可追溯到 Parse 版本 | `eval.run_id` 外键；缺 manifest 拒绝 | `ManifestMissing`；N-14 |
| I-7 | 不允许新 Parse 覆盖历史 | `run_id` 唯一；对象条件写；Catalog PK `run_id` | Q2；N-13 |
| I-8 | 失败重试不产生不可区分的重复结果 | `attempt` 编号 + 独立 `run_id` + `canonical_of` 字段；查询视图标记 primary | N-13 |
| I-9 | DuckDB 查询结果可定位到快照 | 每次查询绑定 `snapshot_id`；快照 manifest 列文件哈希 | Q6；N-11 |
| I-10 | 删除/失效/重处理必须审计 | 只写墓碑，不物理删除；墓碑含原因、操作者、时间、替代版本 | N-15 |

---

## 10. 性能与成本验证

### 10.1 阶段 A：单 PDF 端到端 Demo

**目标**：证明 Raw → Parse → Manifest → Eval → Parquet → Catalog → DuckDB 一条链在**对象存储**上闭合。

| 项 | 现状 | 需补 |
|---|---|---|
| Raw → Parse | `lake/` 已用本地目录实现 | 改为对象存储键；条件写 |
| Manifest | `lakehouse/run-manifest/v1` | 升级 v2；补指纹/任务/源对象 |
| Eval | 已实现单样本 | 支持按文档扩展 |
| Parquet | 每 run 一个文件 | 分区写入路径 |
| Catalog | 本地 `.duckdb`，重建即删 | 快照目录 + manifest |
| DuckDB 查询 | 本地通过 | 快照只读打开 + 查询日志 |
| S3 | 仅本地模式 | MinIO 真实读写（OD-05） |
| Lineage | 本地通过 | 扩展到对象存储与快照 |

**验收**：`verify_lineage` 在对象存储模式通过；`snapshot_id` 可定位；负向测试 N-01/N-02/N-07/N-14/N-15 通过；全程无覆盖、无删除。

### 10.2 阶段 B：1000 份基准

**样本**：从 `document_asset` 中按 `FetchStatus=1 且 HasTextLayer=1` 抽取 1000 份，分层：

| 分层 | 页数 | 份数（建议） |
|---|---|---|
| S1 | ≤ 20 | 300 |
| S2 | 21–50 | 300 |
| S3 | 51–100 | 250 |
| S4 | > 100 | 100 |
| S5 | 无文本层/扫描 | 50（预期拒绝） |

**每件测量**：墙钟耗时、CPU 时间、峰值 RSS、临时磁盘、9 个产物字节数、Parquet 字节数、上传字节/请求数、重试次数、错误类别。

**汇总**：P50/P90/P95/max、吞吐（份/小时/机）、失败率、重试率、重复率、证据完整率、血缘通过率、DuckDB 查询延迟（Q1–Q6）。

**通过门槛（PROPOSED，需 Reviewer 确认，OD-09）**：

- 血缘校验 100% 通过；
- 证据完整率 100%（发布口径）；
- 失败率 ≤ 2%，重试率 ≤ 5%；
- P95 解析耗时 ≤ 超时阈值的 50%；
- Parquet 写入与查询无丢行（行数对账一致）；
- 单件存储成本与单件耗时进入可外推区间。

**产出**：`benchmark_1000_report.json` + 逐件 CSV + 命令记录 + 环境快照；不可覆盖。

### 10.3 阶段 C：3–5 万份试跑

| 项 | 方案 |
|---|---|
| Worker | 2–4 × 8 vCPU / 16 GB；同区对象存储 |
| 并发 | 每机 4 起，按 Stage B 的 RSS/耗时实测调整 |
| 分片 | `crc32(sha256) % worker_count` |
| 批处理 | 每 1000 份一个 `batch_id`；每批结束构建快照 |
| 断点续跑 | 事件日志 + 结果对象；重启重扫分片 |
| 数据校验 | 全量 lineage + 每批 1% 人工抽检 + 行数对账 |
| 停止条件 | 失败率 > 5% 持续 30 min；指纹漂移；磁盘 > 90%；单位成本 > 预估 120%；任一血缘失败 |
| 回滚 | 停止 Worker；不发布新快照；保留全部数据；写墓碑标记批次失效；不删除对象 |

**明确**：3–5 万是**处理规模**，不等于 3–5 万个产品通过验收（技术方案 §7.5 口径）。

### 10.4 全量 568,830 份

只能外推：

```
预计机时 = 568,830 × mean_parse_seconds / (3600 × 有效并发)
预计月数 = 预计机时 / (worker_count × 730)
```

给出区间时必须同时给出：样本均值、P90、并发有效率、失败率、重试率。**不得**给出单一承诺日期或金额（任务书要求）。

---

## 11. 负向测试（摘要）

完整 15 项见 `INVARIANT_AND_NEGATIVE_TEST_MATRIX.md` §2。覆盖任务书全部要求：

| 编号 | 场景 | 期望 |
|---|---|---|
| N-01 | 上传后 SHA 校验失败 | 不提交 raw；`INVALID_INPUT`；无 manifest |
| N-02 | 相同 PDF 重复上传 | 单对象；第二次 `DUPLICATE`；不重复解析 |
| N-03 | 对象存储暂时不可用 | 退避重试；任务可运行；无半成品 |
| N-04 | Worker 执行中断 | 租约过期 → 重试；脏工作区清理 |
| N-05 | Worker 重启 | 跳过已完成；恢复未完成 |
| N-06 | Parse 结果写入失败 | 无 manifest → 不成功；重试 |
| N-07 | Manifest 不完整 | 校验拒绝；Eval 拒绝 |
| N-08 | Parser 版本变化 | 指纹变化；新 run；旧 run 不动 |
| N-09 | 配置指纹变化 | 批次停止接新任务；新批新配置 |
| N-10 | Parquet 损坏 | 查询失败；快照校验发现；可从产物重建 |
| N-11 | DuckDB 查询失败 | 明确报错；不返回部分结果 |
| N-12 | 同一任务并发执行 | 条件写/分片保证只有一个成功；其余退出 |
| N-13 | 重试产生重复结果 | 多 `run_id`、多 `attempt`；`canonical` 唯一 |
| N-14 | Eval 引用不存在的 Parse | `ManifestMissing`；退出码非 0 |
| N-15 | Raw 对象被意外覆盖 | 条件写/版本化拒绝；校验发现篡改 |

---

## 12. Worker 状态机（摘要）

完整转换表见 `PIPELINE_ARTIFACTS.md` §6。

```
PENDING
  → CLAIMED (租约获取)
  → RUNNING
      → SUCCEEDED
      → FAILED_RETRYABLE → (退避) → CLAIMED
      → FAILED_PERMANENT
      → TIMED_OUT → FAILED_RETRYABLE (≤ max) / FAILED_PERMANENT
      → LEASE_EXPIRED → CLAIMED
  → SKIPPED_DUPLICATE (同 repro key 已成功)
  → INVALID_INPUT (PDF 非法/加密/无页/无文本层)
  → QUARANTINED (证据/血缘/对象冲突)
  → TOMBSTONED (批次失效/人工撤销)
```

终态：`SUCCEEDED`、`FAILED_PERMANENT`、`INVALID_INPUT`、`QUARANTINED`、`TOMBSTONED`、`SKIPPED_DUPLICATE`。
每个转换必须写事件；不得存在「隐含成功」。

---

## 13. 失败重试策略（摘要）

| 类别 | 例子 | 重试 | 退避 | 最大次数 |
|---|---|---|---|---|
| 瞬时基础设施 | 对象存储 5xx、网络超时、DNS | 是 | 60 s / 300 s / 900 s + 抖动 | 3 |
| Worker 崩溃/被杀 | 租约过期、进程退出 | 是 | 立即（新 worker） | 3 |
| 解析超时 | 180 s/大件阈值 | 是（仅前 2 次） | 300 s | 2 |
| 输入非法 | 非 PDF、加密、0 页、无文本层 | 否 | — | 1（直接终态） |
| 代码/配置错误 | 指纹漂移、配置非法 | 否 | — | 1（批次停止） |
| 证据/血缘冲突 | 哈希不符、对象冲突 | 否 | — | 1（隔离） |

- 重试**不覆盖**旧 run；每次独立 `run_id` + `attempt`；
- 重试队列与主队列分离，避免抖动放大；
- 死信必须包含：任务、最后一次错误、所有 attempt 的 `run_id`、日志键、证据键。

---

## 14. 安全、权限与审计

| 项 | 要求 |
|---|---|
| 桶 | 私有；禁止公共读；禁止生成永久 URL |
| 加密 | 服务端加密（SSE-S3/SSE-KMS 或等价）；传输 TLS |
| 凭据 | 只从环境变量/实例角色读取；不落盘、不打印、不写入 manifest |
| 最小权限 | Worker 仅 `PutObject` 到 `raw/`、`parse/`、`control/events/`；只读 `control/batches/`；不得删除 |
| 审计 | 每次对象存储写操作记录 `request_id`；墓碑记录操作者与原因 |
| 数据保留 | Raw 永久；Parse 结果按保留策略（OD-14）；日志热存 30 天 |
| 敏感信息 | PDF 与解析产物中可能含厂商版权内容；桶不公开，导出需审批 |
| 合规 | 若对象存储跨区/跨境，需单独评估（OD-01） |

---

## 15. 实施边界

### 15.1 本轮允许

- 只读检查、技术设计、必要的本地验证代码、独立测试样例、不影响现有数据的本地实验。

### 15.2 本轮禁止

- 生产部署、生产数据批量处理、真实公网流量、生产 Parser API；
- LLM 自动调用、自动 Repair、Gold 自动回写；
- 大规模 ECS 采购、未经批准的数据库迁移、修改既有生产数据；
- 在 Ds Bit 仓库提交/推送（本轮只在送审仓库提交设计文档）。

### 15.3 实现启动的前置条件

1. Reviewer 对 `OPEN_DECISIONS.md` 的 P0 项给出裁定；
2. `pipeline.py` 授权快照问题关闭（OD-02）；
3. 对象存储与区域确定（OD-01）；
4. Stage A 的对象存储模式验收通过；
5. 任何实现单独立项，不沿用本设计的「送审」状态。

---

## 16. 交付物清单

| 交付物 | 位置 | 状态 |
|---|---|---|
| 主设计文档 | 本文件 | 完成 |
| Raw / Parse / Eval 数据模型 | §2.3、§4–§6 | 完成 |
| Manifest JSON 示例 | `PIPELINE_ARTIFACTS.md` §2 | 完成 |
| 对象存储目录示例 | `PIPELINE_ARTIFACTS.md` §1 | 完成 |
| Parquet 分区方案 | §7.2 + `PIPELINE_ARTIFACTS.md` §3 | 完成 |
| DuckDB 查询示例 | `PIPELINE_ARTIFACTS.md` §5 | 完成 |
| Worker 状态机 | `PIPELINE_ARTIFACTS.md` §6 | 完成 |
| 失败重试策略 | §13 + `PIPELINE_ARTIFACTS.md` §7 | 完成 |
| 不变量测试矩阵 | `INVARIANT_AND_NEGATIVE_TEST_MATRIX.md` | 完成 |
| 1000 份基准计划 | `BENCHMARK_AND_COST_PLANS.md` §2 | 完成 |
| 3–5 万试跑计划 | `BENCHMARK_AND_COST_PLANS.md` §3 | 完成 |
| 成本估算方法 | `BENCHMARK_AND_COST_PLANS.md` §5 | 完成 |
| 风险与 OPEN 清单 | `OPEN_DECISIONS.md` | 完成 |

---

## 17. 风险

| 编号 | 风险 | 影响 | 缓解 |
|---|---|---|---|
| R-01 | 对象存储直读被误用为默认查询方式 | 查询分钟级、成本失控 | D-01 明确禁止批量直读；基准只测 B/C |
| R-02 | 多 Worker 共写同一个 DuckDB | 文件损坏 | 单写者 + 不可变快照 |
| R-03 | Parser 指纹硬编码/漂移 | 不可复现 | 运行时计算 + 批次冻结 + 漂移告警 |
| R-04 | 失败重试产生重复结果 | 统计失真 | `attempt` + `canonical` 视图 |
| R-05 | 对象存储最终一致性导致「看不到刚写的对象」 | 状态误判 | 写后读用同一凭据 + 版本号；快照按 manifest 不按 list |
| R-06 | 大件超时 | 批次中断 | 超时分档 + 200 页实测（OD-05） |
| R-07 | 成本外推过度乐观 | 预算失真 | 只给区间 + 明确假设；1000 份实测后再外推 |
| R-08 | 审核人力不足 | 数据积压 | 分层抽检 + 质量门 + 不做全量人工 |
| R-09 | 跨区分层存储 | 延迟与出口费 | 同区；跨区只做异步归档 |
| R-10 | 设计被当成实现 | 过早承诺 | 文档全篇标注 DESIGN ONLY；不写完成日期 |

---

## 18. 交付报告

### 18.1 当前代码与设计基线

- 仓库：`E:\workspace\icpdf-extractor`
- 分支：`backup/full-local-20261114`
- HEAD：`600439a5eee69fb3a1cec2715e37080e48ca9840`
- 工作树：不干净（见 §2.1）
- 基线文档：`lake/README.md`、`docs/New_Gate_受控灰度方案.md`、`docs/SLICE6_INTEGRATION_PLAN.md`、Morrishk 技术方案 v1.2 §7

### 18.2 文件路径

- 主文档：`13_dsbit_duckdb_s3_pipeline/DS_BIT_DUCKDB_S3_PIPELINE_DESIGN_v1.md`
- 附件：见 §16 与本目录 `README.md`
- 送审仓库：`E:\workspace\独立站\morrishk-site-upgrade-review`

### 18.3 Git commit SHA

- Ds Bit 基线：`600439a5eee69fb3a1cec2715e37080e48ca9840`
- 本送审包提交：见 `DELIVERY_REPORT.md`（提交后写入实际 SHA，不预先编造）

### 18.4 变更文件列表

本轮只新增 `13_dsbit_duckdb_s3_pipeline/` 目录，不修改 Ds Bit 仓库、不修改送审仓库既有目录。
具体文件见 `SHA256SUMS.txt`。

### 18.5 关键架构决策

D-01 ～ D-12（§3.4）。最关键的三个：

1. 批量采用「本地 → 大批 Parquet → 上传 → 批量查询」，拒绝直扫远程小文件；
2. DuckDB 只做分析，单写者 + 不可变快照，不做队列/锁/多写库；
3. 任务状态用批次清单 + 分片 + 事件日志 + 租约，不引入独立数据库或队列服务器。

### 18.6 已实现与拟议的区别

| 部分 | 状态 |
|---|---|
| `lake/` 单件三层 Demo | **已实现**（commit `7d8ab3f`）；本次实际运行 4 个脚本 |
| 对象存储上传/下载 | **未实现** |
| 任务队列/租约/断点续跑 | **未实现** |
| 指纹运行时计算 | **未实现**（Demo 为硬编码） |
| Parquet 分区/合并 | **未实现**（Demo 每 run 一个文件） |
| Catalog 快照 | **未实现**（Demo 重建即删） |
| Eval 按文档扩展 | **未实现**（Demo 固定单样本） |
| 本文其余设计 | **PROPOSED** |

### 18.7 测试结果

| 测试 | 结果 |
|---|---|
| `python -m pytest -q` | 893 passed, 1 failed, 2 xfailed（236.67 s） |
| 失败项 | `test_a1_10_pipeline_py_is_byte_identical_to_the_authorised_snapshot`（实际 `86c005…` vs 期望 `3394bb…`） |
| `lake/_verify_lineage.py` | 2 runs，0 失败 |
| `lake/_query_demo.py` | Q1–Q4 正常 |
| `lake/_negative_tests.py` | 3/3 PASS |
| `lake/_s3_connectivity_test.py --local` | 103 ms，2896 行 |
| 真实 S3 | 未测试（无凭据、无桶） |

### 18.8 未解决问题

见 `OPEN_DECISIONS.md`（18 项）。P0：

- OD-01 对象存储选型/区域；
- OD-02 `pipeline.py` 授权快照不一致；
- OD-03 任务领取机制在目标对象存储上的可用性。

### 18.9 生产操作确认

**本次没有执行任何生产操作。** 具体地：

- 未部署、未启动任何服务；
- 未访问生产域名；
- 未连接或创建任何对象存储桶；
- 未批量解析、未写任何生产数据库；
- 未修改 Ds Bit 或 Morrishk 的代码、配置、Gold、URL；
- 未调用 LLM、未做自动 Repair、未回写 Gold；
- 未采购资源、未迁移数据。

---

## 附录 A · 基线复现命令（只读）

```powershell
# 1. 仓库状态
git -C E:\workspace\icpdf-extractor rev-parse HEAD
git -C E:\workspace\icpdf-extractor branch --show-current
git -C E:\workspace\icpdf-extractor status --short

# 2. 全量测试（约 4 分钟）
python -m pytest -q

# 3. 单件血缘（只读；不会改数据）
python lake\_verify_lineage.py
python lake\_query_demo.py
python lake\_s3_connectivity_test.py --local

# 4. 反例（在临时副本/临时目录操作，结束自动清理）
python lake\_negative_tests.py

# 5. 指纹与关键行
Get-FileHash src\icpdf\parser\pipeline.py -Algorithm SHA256
Select-String -Path workbench\serve_parser.py -Pattern "ICEX_PARSE_TIMEOUT|ICEX_WORKBENCH_MAX_CONCURRENCY"
```

> `lake/_build_lake.py` 会重建 `lake/raw_layer|parse_layer|eval_layer` 与 `catalog.duckdb`；除非在废弃副本上，**不要**运行 `--reset`。

## 附录 B · 关键文件索引

| 主题 | 文件 |
|---|---|
| 解析入口与产物 | `src/icpdf/parser/pipeline.py:94-198` |
| Run 落盘 | `src/icpdf/storage/run_store.py:20-61`、`artifact_store.py:23-88` |
| 文档身份 | `src/icpdf/parser/pdf_loader.py:41-76` |
| 候选与 ID | `src/icpdf/parser/candidate_registry.py:42-89` |
| 领域模型 | `src/icpdf/domain/{document,table,candidate,product,parameter,evidence}.py` |
| 单件血缘 Demo | `lake/README.md`、`lake/_build_lake.py`、`lake/_verify_lineage.py` |
| 反例 | `lake/_negative_tests.py` |
| S3 连通性 | `lake/_s3_connectivity_test.py` |
| 工作台 | `workbench/serve_parser.py`、`workbench/b2b/serve_b2b.py` |
| 灰度口径 | `docs/New_Gate_受控灰度方案.md` |
| 业务批次与质量门 | 送审仓库 `02_technical_design/morrishk_technical_plan_v1.2.md` §7 |

## 附录 C · 术语

| 术语 | 含义 |
|---|---|
| Raw | 原始 PDF 字节层，内容寻址，只读 |
| Parse | 一次解析执行的结果层，run 级不可变 |
| Eval | 评估层，Gold 版本化 + 指标 + 归因 + 审核 |
| `reproducibility_key` | `sha256(source_sha256 | parser_fingerprint | config_hash)`，表示「同输入、同代码、同配置」 |
| `run_id` | 唯一执行身份；同条件重复执行产生不同 `run_id` |
| `snapshot_id` | Catalog 快照身份；查询必须绑定 |
| 墓碑（tombstone） | 逻辑失效记录；不物理删除对象 |
| 分片（shard） | 按 `sha256` 取模分配到 Worker，无中央协调 |
