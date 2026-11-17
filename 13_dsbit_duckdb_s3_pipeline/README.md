# 13 · Ds Bit · DuckDB + S3 离线解析流水线设计

| 项 | 值 |
|---|---|
| 交付编号 | MRH-DSBIT-LAKE-001 |
| 版本 | v1.0（首轮送审） |
| 日期 | 2026-11-17 |
| 性质 | 架构与实施设计；**不是**生产实现、不是部署、不是数据迁移 |
| 状态 | 送 Reviewer 复核 |
| 目标产物 | `DS_BIT_DUCKDB_S3_PIPELINE_DESIGN_v1.md` |
| 上游依据 | ① Ds Bit 仓库 `E:\workspace\icpdf-extractor`（HEAD `600439a5eee69fb3a1cec2715e37080e48ca9840`）② `lake/` Stage B 单件血缘 Demo ③ Morrishk 技术方案 v1.2 §7「Ds Bit 参数化」④ 已批准的 DuckDB + S3 兼容对象存储离线架构方向 |
| 全量口径 | 去重 PDF **568,830** 份（约 56.9 万；任务书中的「56.8 万」是 56.883 万截断后的写法，两者同源） |

---

## 1. 本目录内容

| 文件 | 说明 |
|---|---|
| `DS_BIT_DUCKDB_S3_PIPELINE_DESIGN_v1.md` | 主设计文档（18 章 + 附录 A–C） |
| `PIPELINE_ARTIFACTS.md` | 对象存储目录、RAW/Manifest JSON、Parquet 分区、DuckDB SQL、Worker 状态机、重试策略 |
| `INVARIANT_AND_NEGATIVE_TEST_MATRIX.md` | 10 条数据不变量 + 15 项负向测试的期望行为与测试方法 |
| `BENCHMARK_AND_COST_PLANS.md` | 单件 Demo / 1000 份基准 / 3–5 万试跑 / 成本估算方法 |
| `OPEN_DECISIONS.md` | OD-01 ~ OD-18 未决事项、影响、选项、建议与决策人 |
| `README.md` | 本文件：基线、复核路径、未执行操作声明 |
| `SHA256SUMS.txt` | 本目录文件的 SHA-256 校验清单 |

---

## 2. 基线（本次只读检查的对象）

| 对象 | 路径 | 事实 |
|---|---|---|
| Ds Bit 项目仓库（解析引擎 + 工作台） | `E:\workspace\icpdf-extractor` | 分支 `backup/full-local-20261114`，HEAD `600439a5eee69fb3a1cec2715e37080e48ca9840`；工作树不干净（`deploy/dsb/` 已暂存，`workbench/b2b/serve_b2b.py` 未跟踪） |
| Stage B 单件血缘 Demo | `E:\workspace\icpdf-extractor\lake\` | 已提交（`7d8ab3f`），1 个样本（V101），2 个 run |
| 解析入口 | `src/icpdf/parser/pipeline.py:94` | `parse_pdf()` 是唯一正式入口 |
| Run 落盘 | `src/icpdf/storage/run_store.py:20` | `runs/<run_id>/`，同名拒绝覆盖 |
| 工作台 | `workbench/serve_parser.py` | 冻结闸门、并发 2、180 s 强杀（变量见 `:90`–`:94`） |
| 技术方案（Stage B 批次口径） | 送审仓库 `02_technical_design/morrishk_technical_plan_v1.2.md` §7.2 | B0 100–200 份 / B1 1–2 万份 / B2 按分类扩展 / B3 长尾；56.9 万口径见 §1.4 |
| 本送审仓库 | `E:\workspace\独立站\morrishk-site-upgrade-review` | 分支 `main`，基线 `0fa9d34`（拉取后） |

> 基线时效性：本文的 `CONFIRMED` 仅指上述代码快照下成立的事实，不等同于 Ds Bit 权威分支或未来生产状态。
> 本次未对 `main` 分支重新核对；若 Reviewer 要求，应在干净提交上重跑附录 A 的复现命令。

---

## 3. 复核路径（10–15 分钟）

1. 读主文档 **§2**：`CONFIRMED / PROPOSED / OPEN` 三类清单与证据位置。
2. 读 **§3.3**：为什么采用「Worker 本地处理 → 生成 Parquet → 上传对象存储 → DuckDB 批量查询」，以及另外两种模式为何不选。
3. 读 **§4–§6**：Raw / Parse / Eval 三层的不可变与追溯设计。
4. 读 **§7**：DuckDB 的职责边界、分区、小文件合并、快照与并发限制。
5. 读 **§9 + `INVARIANT_AND_NEGATIVE_TEST_MATRIX.md`**：10 条不变量是否逐条可测，15 项负向测试是否覆盖失败路径。
6. 读 **§11 + `BENCHMARK_AND_COST_PLANS.md`**：三阶段是否给出可执行口径，而不是承诺数字。
7. 读 **`OPEN_DECISIONS.md`**：18 个未决项的阻断级别与决策人。
8. 校验完整性：

```bash
cd 13_dsbit_duckdb_s3_pipeline
sha256sum -c SHA256SUMS.txt
```

9. 若需复跑基线证据：见主文档 **附录 A**（全部为只读或临时目录操作）。

---

## 4. 本次实际执行与未执行的操作

### 4.1 已执行（只读 / 本地验证脚本）

| 动作 | 结果 |
|---|---|
| `git` 只读检查（HEAD、分支、状态、日志） | 见 §2 |
| `python -m pytest -q` | **893 passed, 1 failed, 2 xfailed**（236.67 s）；失败项 `test_a1_10_pipeline_py_is_byte_identical_to_the_authorised_snapshot`，见主文档 §2.4 |
| `python lake/_verify_lineage.py` | 2 个 run，失败 0 |
| `python lake/_query_demo.py` | Q1–Q4 正常；1448 candidates / 14 tables / 11 pages / 1025 value cells |
| `python lake/_negative_tests.py` | 3 个反例全部 PASS |
| `python lake/_s3_connectivity_test.py --local` | 2896 行，103 ms；`--s3` 未执行（无凭据） |

### 4.2 未执行（明确声明）

1. 未部署任何服务，未启动 `serve_parser.py` / `serve_b2b.py`。
2. 未访问 `dsb.0668xgwl.com`，未调用 `/api/parse` / `/api/process`。
3. 未购买、配置或连接任何 S3/OSS 桶；`--s3` 分支只验证了「缺凭据明确拒绝」。
4. 未批量解析、未处理 1000 份或 3–5 万份数据。
5. 未修改 Ds Bit 或 Morrishk 的任何生产配置、数据库、URL、Gold。
6. 未调用 LLM、未做自动 Repair、未回写 Gold。
7. 未新增 ECS、未做容量采购、未做数据库迁移。
8. 未修改 `runs/`、`lake/raw_layer/`、`lake/eval_layer/` 的既有数据。
9. 未在 Ds Bit 仓库执行 `git add` / `commit` / `push`。

本次只做：只读文件检查、只读 `git` 查询、本地只读验证脚本、在本目录写设计文档。

---

## 5. 一页结论

1. **架构方向成立**：Raw（内容寻址、只读）/ Parse（run 级不可变、四指纹）/ Eval（Gold 版本化、评估器指纹）三层已在 `lake/` 用 1 个样本跑通，可作为 568,830 份的骨架。
2. **DuckDB 只做分析查询**：它不是队列、不是锁、不是多写并发数据库、不是事实源；`catalog.duckdb` 是可由对象存储重建的派生物。
3. **批量路径采用「本地处理 → 大批 Parquet → 上传 → 批量查询」**：拒绝 DuckDB 直扫 56 万个小文件；同区对象存储才讨论直读。
4. **任务状态不放进 DuckDB**：用「不可变批次清单 + 分片 + 追加式事件日志 + 租约」实现断点续跑与幂等，不引入独立数据库服务器。
5. **当前仍缺**：对象存储上传、任务队列/状态持久化、Parquet 分区与合并、真实 S3 连通性、运行时 Parser 指纹（`lake/` 中是硬编码常量）、失败重试与死信、1000 份基准与成本实测。
6. **一个必须先处理的基线问题**：`pipeline.py` 与 A3-W1 授权快照不一致（本机实测哈希 `86c005…`，测试期望 `3394bb…`），在冻结 Parser 指纹前必须由 Reviewer 裁定，否则「可复现条件」无法成立。

---

## 6. 判定边界建议

| 判定 | 适用 |
|---|---|
| `PASS` / `PARTIAL` / `FAIL` | 架构完整性、三层不变量、失败路径覆盖、DuckDB 职责边界、可执行性 |
| `NOT VERIFIABLE` | 真实 S3 吞吐、真实批量耗时、成本金额、ECS 规格是否够用、568,830 份的实际成功率 |
| 不接受的口径 | 把 `lake/` 单件 Demo 当作批量能力；把设计文档当作已实现；用外推数字当作交付承诺 |

---

## 7. 版本与冻结约定

- 本包为 **v1.0 首轮送审**，未冻结。
- Reviewer 意见以新 commit 追加，不覆盖本目录历史版本。
- 任何实现工作必须在 Reviewer 对本设计与 `OPEN_DECISIONS.md` 的阻断项给出裁定后另行立项。
