# 交付报告 · MRH-DSBIT-LAKE-001

| 项 | 值 |
|---|---|
| 交付编号 | MRH-DSBIT-LAKE-001 |
| 交付日期 | 2026-11-17 |
| 性质 | 设计送审（DESIGN ONLY） |
| 主文档 | `DS_BIT_DUCKDB_S3_PIPELINE_DESIGN_v1.md` |
| 送审包提交 | `a62c70d644ced735ccfe079b086aca744f142f93` |
| 后续提交 | 本报告与更新后的 `SHA256SUMS.txt` 为同包第二次提交（`git log` 可查） |
| Ds Bit 基线 | `600439a5eee69fb3a1cec2715e37080e48ca9840`（分支 `backup/full-local-20261114`） |
| 送审仓库基线 | `main`，本包提交前为 `0fa9d34` |

---

## 1. 当前代码与设计基线

- 仓库：`E:\workspace\icpdf-extractor`
- 分支：`backup/full-local-20261114`
- HEAD：`600439a5eee69fb3a1cec2715e37080e48ca9840`
- 工作树：不干净（`deploy/dsb/*` 已暂存；`workbench/b2b/serve_b2b.py`、`deploy/dsb/evidence/`、`docs/g0_evidence/` 未跟踪）
- 关键基线文档：
  - `lake/README.md`（Stage B 单件血缘 Demo）
  - `docs/New_Gate_受控灰度方案.md`（并发/超时/冻结口径）
  - `docs/SLICE6_INTEGRATION_PLAN.md`（Parser 集成边界）
  - Morrishk 技术方案 v1.2 §7（Ds Bit 参数化、B0–B3 批次）

---

## 2. 文件路径与清单

目录：`13_dsbit_duckdb_s3_pipeline/`

| 文件 | 行数 | 作用 |
|---|---|---|
| `DS_BIT_DUCKDB_S3_PIPELINE_DESIGN_v1.md` | 1274 | 主设计（18 章 + 附录 A–C） |
| `PIPELINE_ARTIFACTS.md` | 547 | 目录布局、Manifest v2、Parquet、DuckDB SQL、状态机、重试 |
| `INVARIANT_AND_NEGATIVE_TEST_MATRIX.md` | 311 | 10 条不变量 + 15 项负向测试 |
| `BENCHMARK_AND_COST_PLANS.md` | 341 | Stage A/B/C、全量外推、成本方法 |
| `OPEN_DECISIONS.md` | 235 | OD-01 ~ OD-18 |
| `README.md` | 121 | 送审说明、复核路径、未执行操作 |
| `SHA256SUMS.txt` | 7 | 本目录校验清单（含本报告） |

完整性校验：

```bash
cd 13_dsbit_duckdb_s3_pipeline
sha256sum -c SHA256SUMS.txt
```

---

## 3. 变更文件列表

本包只新增上述目录，**未修改**：

- Ds Bit 仓库任何文件；
- 送审仓库既有目录（`00_`–`12_`）；
- `10_scope_confirmation/` 下的未跟踪 `.docx`（不属于本任务，未 add）。

---

## 4. 关键架构决策

1. **批量路径**：Worker 本地处理 → 按批次生成大批 Parquet → 上传对象存储 → DuckDB 批量查询。拒绝 DuckDB 直扫 56 万个远程小文件。
2. **DuckDB 边界**：只做分析查询；单写者构建不可变快照；不是队列、不是锁、不是多写库、不是事实源。
3. **任务状态**：不可变批次清单 + 确定性分片 + 追加事件日志 + 租约；不引入 Redis/数据库队列。
4. **三层不可变**：Raw 内容寻址只增；Parse 以 `run_id` 为执行身份；Eval 以 Gold 版本 + 评估器指纹冻结。
5. **指纹**：`parser_fingerprint` 必须运行时计算（修正 `lake` 硬编码），与 `config_hash`、`dependency_lock_sha256` 一起构成可复现条件。

---

## 5. 已实现与拟议的区别

| 部分 | 状态 |
|---|---|
| `lake/` 单件三层 Demo | 已实现（`7d8ab3f`）；本次实跑 4 个脚本 |
| 对象存储上传/下载 | 未实现 |
| 任务/租约/续跑/死信 | 未实现 |
| 运行时指纹 | 未实现（Demo 硬编码） |
| Parquet 分区/合并 | 未实现（Demo 每 run 一个文件） |
| Catalog 快照 | 未实现（Demo 重建即删） |
| Eval 按文档扩展 | 未实现（Demo 固定单样本） |
| 其余设计 | 拟议（PROPOSED） |

---

## 6. 测试结果

| 测试 | 结果 |
|---|---|
| `python -m pytest -q` | **893 passed, 1 failed, 2 xfailed**（236.67 s） |
| 失败项 | `tests/unit/test_assembly.py::test_a1_10_pipeline_py_is_byte_identical_to_the_authorised_snapshot`：实际 `86c00549…`，期望 `3394bb66…` |
| `python lake/_verify_lineage.py` | 2 个 run，失败 0 |
| `python lake/_query_demo.py` | Q1–Q4 正常；1448 candidates / 14 tables / 11 pages / 1025 value cells；PK=1 / UNIQUE=0 |
| `python lake/_negative_tests.py` | 3/3 PASS |
| `python lake/_s3_connectivity_test.py --local` | 2896 行，103 ms |
| `python lake/_s3_connectivity_test.py --s3` | 未执行（无凭据，脚本按设计退出码 2） |

> 失败的 A1-10 不是本次改动引入的：`pipeline.py` 最后变更为 `2bb1c78 C2`，工作树未修改该文件。
> 它是本设计的前置阻断项 OD-02，已写入主文档与 `OPEN_DECISIONS.md`。

---

## 7. 未解决问题

- **P0**：OD-01 对象存储选型/区域；OD-02 `pipeline.py` 授权快照；OD-03 任务领取机制。
- **P1**：OD-04 ~ OD-12（对象锁、MinIO 与大件、ID/指纹归一化、指纹范围、状态事实源、质量门阈值、Gold 权威来源、产品级 ID、扫描版处理）。
- **P2**：OD-13 ~ OD-18（单价、保留策略、对象数量、权限、合规、审核产能）。

完整表见 `OPEN_DECISIONS.md`。

---

## 8. 生产操作确认

**本次没有执行任何生产操作。** 具体地：

1. 未部署 Ds Bit 或 Morrishk 服务；
2. 未启动 `serve_parser.py` / `serve_b2b.py`；
3. 未访问 `dsb.0668xgwl.com`；
4. 未创建、配置或连接任何对象存储桶；
5. 未批量解析，未处理 1000 份或 3–5 万份数据；
6. 未修改任何生产数据库、URL、canonical、301 或 Gold；
7. 未调用 LLM、未做自动 Repair、未回写 Gold；
8. 未采购 ECS 或对象存储资源；
9. 未做数据库迁移；
10. 未修改 Ds Bit 仓库的代码、配置或运行产物。

本次只做：只读文件检查、只读 `git` 查询、只读/临时目录的本地验证脚本、送审仓库内的设计文档提交。

---

## 9. 下一步建议

1. Reviewer 先处理三项 P0（OD-01 ~ OD-03），特别是 OD-02；
2. 批准后按主文档 §10.1 做 Stage A（含 MinIO 真实读写与 5 项负向测试）；
3. Stage A 通过后再申请 1000 份基准；
4. 1000 份通过后再申请 3–5 万试跑；
5. 568,830 全量只按实测吞吐与成本外推，不预先承诺时间与金额。
