# 交付报告 · MRH-DSBIT-LAKE-001

| 项 | 值 |
|---|---|
| 交付编号 | MRH-DSBIT-LAKE-001 |
| 交付日期 | 2026-11-17 |
| 版本 | **v1.3**（第三轮：补齐 R1-3 receipt 冲突与崩溃边界） |
| 性质 | 设计送审（DESIGN ONLY） |
| 主文档 | `DS_BIT_DUCKDB_S3_PIPELINE_DESIGN_v1.md` |
| Reviewer 结论（第三轮） | 提交/远端 PASS；R5 PASS；R1-1/R1-2 PASS；**R1-3 仍需补强**；契约冻结与 Stage A 均不批准 |
| v1.0 提交 | 设计 `a62c70d644ced735ccfe079b086aca744f142f93`；报告 `ce6ba2db2839cb49a69702d3251482c4b58ba633` |
| v1.1 设计修订提交 | `f8b8085fa12d57050e176bc8517a5a4856eaceef` |
| v1.1 报告与校验清单 | `cdc61147387801c1b758deae89bb871467ef92d7` |
| v1.2 设计修订提交 | `473497dd276e65cf9f6ca326bfddf9cb29865a39` |
| v1.2 报告与校验清单 | `e9a56ca9b42db114b57a0fab62bcb258d7718ee4` |
| v1.3 设计修订提交 | `（提交后回填）` |
| v1.3 报告与校验清单 | 紧随 v1.3 设计提交（SHA 见 `git log`） |
| Ds Bit 基线 | `600439a5eee69fb3a1cec2715e37080e48ca9840`（分支 `backup/full-local-20261114`） |
| 送审仓库任务启动基线 | `0fa9d34` |
| 送审仓库设计提交直接父提交（v1.0） | `fc4bcc5` |

---

## 1. 基线（区分两个概念）

| 概念 | SHA | 说明 |
|---|---|---|
| Ds Bit 代码基线 | `600439a5…` | 本轮只读检查的代码快照；工作树不干净 |
| 送审仓库**任务启动时**基线 | `0fa9d34` | 开始本轮设计时远端 HEAD |
| v1.0 设计提交的**直接父提交** | `fc4bcc5` | 从该提交比较，变更只有 `13_` 目录 |
| v1.0 设计提交 | `a62c70d` | 7 个文件 |
| v1.0 报告提交 | `ce6ba2d` | 新增报告 + 更新校验清单 |

> v1.0 报告曾把 `0fa9d34` 写成唯一基线，导致从 `0fa9d34` 比较时看到 `12_` 的并发改动。
> v1.1 明确区分「任务启动基线」与「直接父提交」：**没有证据表明设计提交修改了 `12_`**。

---

## 2. 文件路径与清单

目录：`13_dsbit_duckdb_s3_pipeline/`

| 文件 | 作用 | v1.1 变更 |
|---|---|---|
| `DS_BIT_DUCKDB_S3_PIPELINE_DESIGN_v1.md` | 主设计（18 章 + 附录） | 新增 §0.2 修订记录；重写 §5.2 并发协议、§5.4.1 key v2、§5.6 两级 Manifest、§7.2 对账、§10.1.1 真实存储测试、§10.2 样本池 |
| `PIPELINE_ARTIFACTS.md` | 目录、Manifest、Parquet、DuckDB、状态机、协调器 | 重写：两级 Manifest 示例、part_manifest、Q8、协调器协议、完整 SHA task_id |
| `INVARIANT_AND_NEGATIVE_TEST_MATRIX.md` | 不变量与负向测试 | 新增 I-11/I-12；N-12 拆 a–d；新增 N-16–N-20 |
| `BENCHMARK_AND_COST_PLANS.md` | 三阶段与成本 | 新增真实存储 C1–C10；样本池 P/Q；五类失败率；协调器拓扑 |
| `OPEN_DECISIONS.md` | 未决事项 | OD-03 给出协调器方案；OD-05 上调 P0；新增 OD-19/OD-20 |
| `README.md` | 送审说明 | 版本 v1.1、基线区分、R1–R6 索引、结论更新 |
| `SHA256SUMS.txt` | 校验清单 | 随本报告更新 |
| `DELIVERY_REPORT.md` | 本文件 | v1.1 重写 |

完整性校验：

```bash
cd 13_dsbit_duckdb_s3_pipeline
sha256sum -c SHA256SUMS.txt
```

---

## 3. 变更文件列表

v1.1/v1.2 只修改上述 `13_` 目录内的文件；**未修改**：

- Ds Bit 仓库任何文件；
- 送审仓库 `00_`–`12_` 既有目录；
- `10_scope_confirmation/` 下未跟踪的 `.docx`。

---

## 4. Reviewer 响应

### 4.1 第一轮 R1–R6（v1.1）

| 编号 | Reviewer 问题 | v1.1 处置 | 复核位置 |
|---|---|---|---|
| **R1** | 任务领取/租约/接管/fencing 未形成可证明协议；分片与条件写两套语义并存 | 改为**单写协调器 + 租约代次 + 两阶段提交**；删除「分片承担互斥」；补 N-12a–d、N-19/N-20 | 主文档 §5.2；`PIPELINE_ARTIFACTS.md` §6/§9；矩阵 N-12a–d/N-20 |
| **R2** | Run Manifest 与 Batch Parquet 行数口径冲突，可能重复累计 | 拆分 Run Manifest 与 Batch/Partition Manifest；三级对账等式；N-19 固定「2 run 共享 1 文件只计一次」 | 主文档 §5.6/§7.2；附件 §2/§3；矩阵 I-11/N-19 |
| **R3** | 1000 份样本筛选与 S5 矛盾；失败率分母不清 | 拆为 P（950）+ Q（50）；五类比率各有分母；≤2% 只约束 P | 主文档 §10.2；计划 §2；矩阵无改动 |
| **R4** | `reproducibility_key` 未覆盖 `table_params_sha256`、依赖锁 | 升级 v2，纳入表参数、依赖锁、DPI、Python、平台族、`requested_mpn`；区分审计字段 | 主文档 §5.4.1；附件 §2；矩阵 N-16–N-18 |
| **R5** | `task_id` 用 SHA 前 16 位，存在碰撞 | 改为完整 64 位 SHA-256；同 ID 不同内容即致命错误 | 主文档 §5.2.2；附件 §1；矩阵无改动 |
| **R6** | MinIO 不能代替真实对象存储 | Stage A 增加真实存储 C1–C10；MinIO 仅开发；OD-05 上调 P0；新增 OD-19 fallback | 主文档 §10.1.1；计划 §1.3；`OPEN_DECISIONS.md` OD-05/OD-19 |

### 4.2 第二轮 R1/R5（v1.2）

| 编号 | Reviewer 问题 | v1.2 处置 | 复核位置 |
|---|---|---|---|
| **R1-1** | 租约过期后、5 s 扫描前，旧 Worker 仍可续租/提交 | HEARTBEAT/COMMIT 在同一事务校验 `owner` / `generation` / `expires_at > now` / `plan_epoch` / 批次状态；过期即失效 | 主文档 §5.2.3、§5.2.4；附件 §9.4；N-12e |
| **R1-2** | Manifest 含 `commit_token`，与「先算 SHA 再提交」循环 | 从 Run Manifest **删除 token**；token 只在协调器 `commits` 与 receipt；Manifest 记录 `input_key`/`ingest_ids`/`lease_generation`/`commit_receipt_key` | 主文档 §5.5、§5.6；附件 §2、§4.2 |
| **R1-3** | SQLite COMMIT 成功、receipt 未写崩溃的恢复不完整 | 协调器是 receipt 唯一写者 + outbox + reconciler；COMMIT 幂等（同参数同 token）；不一致 `QUARANTINED`；成功 = commit + receipt 一致 | 主文档 §5.2.5；附件 §9.2、§9.8；N-12f/N-12g |
| **R5** | 完整 SHA 的 `task_id` 与「同 PDF 两条 task」冲突 | 方案 A + MPN：`input_key = sha256(source_sha256 + requested_mpn)`；同 PDF 同 MPN = 1 task + 多 ingest；不同 MPN = 2 task；`task_id` 明确为批次内身份 | 主文档 §5.2.2；附件 §1、§8；N-21 |

> 以上是**设计层修订**，不代表 Reviewer 已认可；R1/R5 仍需定向复核。

### 4.3 第三轮 R1-3（v1.3）

| 编号 | Reviewer 问题 | v1.3 处置 | 复核位置 |
|---|---|---|---|
| **R1-3a** | receipt 已存在时如何读取/比较/不覆盖 | `GET → receipt_sha256 比较 → 仅 404 条件写 → 回读`；不同内容 `conflict`，不 PUT | 主文档 §5.2.5.1；附件 §9.9；N-12g1/g2 |
| **R1-3b** | 写超时但实际成功如何区分 | 超时视为未知；先 GET 回读，一致即 `written`，不一致 `conflict`；未回读前禁止重复 PUT | 主文档 §5.2.5.2；N-12f3 |
| **R1-3c** | PUT 成功、SQLite 状态未更新时崩溃 | 重启 `pending` → GET 回读一致 → 只更新状态，不重复 PUT | 主文档 §5.2.5.3；N-12f2 |
| **R1-3d** | N-12f/N-12g 覆盖不足 | 拆为 N-12f1–f4（崩溃/状态未写/超时成功/412 同内容）与 N-12g1–g3（token 不同/manifest 不同/commit 缺失） | 矩阵 N-12f/N-12g |
| — | R5 的 canonical_json / MPN 规范化 | 不改 R5；记录为 OD-21（实现前冻结） | `OPEN_DECISIONS.md` OD-21 |

---

## 5. 关键架构决策（v1.3）

1. 批量路径仍是「本地处理 → 大批 Parquet → 上传 → 批量查询」；
2. DuckDB 仍只做分析查询，单写快照，不是队列/锁/事实源；
3. 任务分配为**单写协调器 + `lease_generation` + COMMIT 事务**；**租约到期即失效**；
4. **成功提交点**不是 manifest，而是「协调器 commit 记录 + receipt 一致」；
5. receipt 写入固定为 **GET → sha 比较 → 仅 404 条件写 → 回读**；已存在不同内容一律 `conflict`，绝不覆盖；超时不盲目重试；
6. Run Manifest 与 Batch/Partition Manifest 分离，Catalog 只按 part_manifest 计总行数；
7. `reproducibility_key` v2 覆盖所有影响结果的输入；
8. `task_id` = `<batch_id>:<sha256(source_sha256 + requested_mpn)>`；同 PDF 同 MPN = 1 task + 多 ingest；
9. Stage A 必须在最终选型存储上通过 C1–C10。

---

## 6. 已实现与拟议的区别

| 部分 | 状态 |
|---|---|
| `lake/` 单件三层 Demo | 已实现（`7d8ab3f`）；本次实跑 4 个脚本 |
| 协调器 / 租约 / fencing / 提交裁决 | 未实现 |
| receipt outbox / reconciler | 未实现 |
| ingest 记录与任务去重 | 未实现 |
| 对象存储上传/下载 | 未实现 |
| 真实存储一致性 C1–C10 | 未执行 |
| 运行时 Parser 指纹 | 未实现（Demo 硬编码） |
| `reproducibility_key` v2 | 未实现（Demo 为 v1 三字段） |
| 两级 Manifest / part_manifest | 未实现 |
| Parquet 分区/合并、Catalog 快照 | 未实现 |
| 其余设计 | PROPOSED |

---

## 7. 测试结果

v1.1/v1.2 **只改设计文档，未改代码**；以下结果仍来自 v1.0 的同一代码快照：

| 测试 | 结果 |
|---|---|
| `python -m pytest -q` | **893 passed, 1 failed, 2 xfailed**（236.67 s） |
| 失败项 | `test_a1_10_pipeline_py_is_byte_identical_to_the_authorised_snapshot`：实际 `86c005…`，期望 `3394bb…` |
| `lake/_verify_lineage.py` | 2 runs，0 失败 |
| `lake/_query_demo.py` | Q1–Q4 正常；1448 candidates / 14 tables / 11 pages / 1025 value cells |
| `lake/_negative_tests.py` | 3/3 PASS |
| `lake/_s3_connectivity_test.py --local` | 2896 行，103 ms |
| 真实 S3 | 未执行（无凭据、无桶） |

> 不能把这套结果写成「全套测试通过」：A1-W1 授权快照不一致仍然存在。

---

## 8. 未解决问题

P0（5 项）：

- OD-01 对象存储选型/区域；
- OD-02 `pipeline.py` 授权快照不一致；
- OD-03 协调器方案待 Reviewer 确认；
- OD-05 真实存储一致性 + 大件实测；
- OD-19 条件写 fallback。

P1/P2 见 `OPEN_DECISIONS.md`。OD-16（权限/凭据）虽为 P2，但任何上传实现前必须落地。

---

## 9. 评审结论与边界

### 9.1 第一轮（v1.0/v1.1）

| 项 | 结论 |
|---|---|
| 提交完整性 | PASS |
| 架构方向 | PASS |
| 数据契约完整性 | REVISIONS REQUIRED（v1.1 已响应） |
| P0 决策 | OPEN |
| Stage A 启动 | **NOT APPROVED** |

### 9.2 第二轮（v1.1）

| 项 | 结论 |
|---|---|
| Git 提交与远端交付 | PASS |
| v1.1 架构方向 | PASS |
| R2 / R3 / R4 / R6 | PASS |
| R1 / R5 | **仍需修订**（v1.2 已响应） |
| v1.1 数据契约冻结 | **不批准** |
| Stage A | **不批准** |
| 1000 份基准、3–5 万试跑 | **不批准** |

### 9.3 第三轮（v1.2）

| 项 | 结论 |
|---|---|
| Git 提交与远端一致性 | PASS |
| R5 身份设计 | PASS |
| R1-1 租约过期窗口 | PASS（设计层） |
| R1-2 token 循环依赖 | PASS（设计层） |
| R1-3 Receipt outbox | **仍需补强**（v1.3 已响应） |
| R2 / R3 / R4 / R6 | 沿用此前 PASS，不代表本轮重跑 |
| v1.2 契约冻结 | **不批准** |
| Stage A / 1000 份 / 3–5 万 / 生产 | **不批准** |

本包**不批准**：设计冻结、Stage A 实现、1000 份基准、3–5 万试跑、任何生产操作。
R1-3 的修订仍需 Reviewer 定向复核；OD-01/OD-02/OD-03/OD-05/OD-19 仍是实质性阻断项。

---

## 10. 生产操作确认

**本次没有执行任何生产操作。** 具体地：

1. 未部署、未启动任何服务；
2. 未访问 `dsb.0668xgwl.com`；
3. 未创建、配置或连接任何对象存储桶；
4. 未批量解析，未处理 1000 份或 3–5 万份数据；
5. 未修改任何生产数据库、URL、canonical、301 或 Gold；
6. 未调用 LLM、未做自动 Repair、未回写 Gold；
7. 未采购 ECS 或对象存储资源；
8. 未做数据库迁移；
9. 未修改 Ds Bit 仓库的代码、配置或运行产物。

本次只做：只读文件检查、只读 `git` 查询、只读/临时目录的本地验证脚本、送审仓库内的设计文档提交。

---

## 11. 下一步建议

1. Reviewer 复核 R1–R6 是否闭合，尤其是协调器协议与两级 Manifest；
2. 裁定 P0（OD-01/02/03/05/19）；
3. 批准后才启动 Stage A（含真实存储 C1–C10）；
4. Stage A 通过后再申请 1000 份基准；
5. 568,830 全量只按实测吞吐与成本外推，不预先承诺时间与金额。
