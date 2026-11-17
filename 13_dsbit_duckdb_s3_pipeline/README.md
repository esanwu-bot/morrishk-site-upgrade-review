# 13 · Ds Bit · DuckDB + S3 离线解析流水线设计

| 项 | 值 |
|---|---|
| 交付编号 | MRH-DSBIT-LAKE-001 |
| 版本 | v1.12（第十二轮：B1 预留时间字段；B5 普通 GET 先预留、episode 保护与审计口径） |
| 日期 | 2026-11-17 |
| 修订 | v1.12 只补 B1/B5 的预留语义与崩溃测试；A3/A4、B2–B4 保持关闭，R5、R2–R4/R6 与总体架构不动 |
| 性质 | 架构与实施设计；**不是**生产实现、不是部署、不是数据迁移 |
| 状态 | 送 Reviewer 定向复核；v1.11 契约冻结与 Stage A 均未批准 |
| 目标产物 | `DS_BIT_DUCKDB_S3_PIPELINE_DESIGN_v1.md` |
| 上游依据 | ① Ds Bit 仓库 `E:\workspace\icpdf-extractor`（HEAD `600439a5eee69fb3a1cec2715e37080e48ca9840`）② `lake/` Stage B 单件血缘 Demo ③ Morrishk 技术方案 v1.2 §7「Ds Bit 参数化」④ 已批准的 DuckDB + S3 兼容对象存储离线架构方向 |
| 全量口径 | 去重 PDF **568,830** 份（约 56.9 万；任务书中的「56.8 万」是 56.883 万截断后的写法，两者同源） |

---

## 1. 本目录内容

| 文件 | 说明 |
|---|---|
| `DS_BIT_DUCKDB_S3_PIPELINE_DESIGN_v1.md` | 主设计文档（18 章 + 附录 A–C） |
| `PIPELINE_ARTIFACTS.md` | 对象存储目录、两级 Manifest、Parquet 分区、DuckDB SQL、Worker 状态机、协调器协议、重试策略 |
| `INVARIANT_AND_NEGATIVE_TEST_MATRIX.md` | 13 条数据不变量 + 15 项必测 + 6 项回归负向测试（N-12 另有 a–g 子用例） |
| `BENCHMARK_AND_COST_PLANS.md` | 单件 Demo / 1000 份基准 / 3–5 万试跑 / 成本估算方法 |
| `OPEN_DECISIONS.md` | OD-01 ~ OD-21 未决事项、影响、选项、建议与决策人 |
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
| 本送审仓库 | `E:\workspace\独立站\morrishk-site-upgrade-review` | 分支 `main`；**任务启动时基线** `0fa9d34`；**设计提交直接父提交** `fc4bcc5` |

> 两个基线必须分开写：从 `0fa9d34` 比较到设计提交会包含 `12_` 目录的并发改动；从 `fc4bcc5` 比较，变更只有 `13_` 目录的 7 个文件。v1.0 的 `DELIVERY_REPORT.md` 曾把前者写成唯一基线，v1.1 已修正。

> 基线时效性：本文的 `CONFIRMED` 仅指上述代码快照下成立的事实，不等同于 Ds Bit 权威分支或未来生产状态。
> 本次未对 `main` 分支重新核对；若 Reviewer 要求，应在干净提交上重跑附录 A 的复现命令。

---

## 3. 复核路径（10–15 分钟）

1. 读主文档 **§2**：`CONFIRMED / PROPOSED / OPEN` 三类清单与证据位置。
2. 读 **§0.13 + §5.2.5**：v1.12 的 B1 预留时间字段、B5 普通 GET 先预留与审计口径。
3. 读 **§5.6 + §7.2**：v1.1 对 R2 的两级 Manifest 与三级行数对账。
4. 读 **§10.2**：v1.1 对 R3 的样本池 P/Q 与五类失败率分母。
5. 读 **§5.4.1**：v1.1 对 R4 的 `reproducibility_key` v2 字段表。
6. 读 **§10.1.1**：v1.1 对 R6 的真实对象存储一致性测试 C1–C10。
7. 读 **§4–§7**：Raw / Parse / Eval 三层与 DuckDB 职责边界。
8. 读 **§9 + `INVARIANT_AND_NEGATIVE_TEST_MATRIX.md`**：13 条不变量与负向测试（15 项必测 + 6 项回归）。
9. 读 **`OPEN_DECISIONS.md`**：21 个未决项的阻断级别与决策人（P0：OD-01 / OD-02 / OD-03 / OD-05 / OD-19）。
10. 校验完整性：

```bash
cd 13_dsbit_duckdb_s3_pipeline
sha256sum -c SHA256SUMS.txt
```

11. 若需复跑基线证据：见主文档 **附录 A**（全部为只读或临时目录操作）。

### 3.1 R1–R6 响应索引

| 编号 | Reviewer 结论 | v1.2 位置 | 仍需 Reviewer 确认 |
|---|---|---|---|
| R1 | 第二轮 FAIL：租约过期窗口、token 循环、receipt 崩溃 | §5.2.2–§5.2.5、`PIPELINE_ARTIFACTS.md` §9 | 三项修复是否闭合 |
| R2 | PASS | §5.6、§7.2 | 不改 |
| R3 | PASS | §10.2（补 Q 子类配额） | 不改 |
| R4 | PASS | §5.4.1 | 不改 |
| R5 | 第二轮 FAIL：重复输入身份冲突 | §5.2.2（input_key + ingest） | 方案 A + MPN 维度是否接受 |
| R6 | PASS（设计层） | §10.1.1 | 真实存储仍未测 |

### 3.2 第二轮复核响应

| 编号 | Reviewer 结论 | v1.2 处置 |
|---|---|---|
| R1-1 | 租约过期但扫描未跑，旧 Worker 仍可续租/提交 | HEARTBEAT/COMMIT 同事务校验 owner/generation/expires_at/plan_epoch；过期即失效（N-12e） |
| R1-2 | Manifest 的 token 与「先算 SHA 再提交」循环 | Manifest 删除 `commit_token`；token 只在 commit 记录与 receipt（N-12b） |
| R1-3 | SQLite COMMIT 后 receipt 未写崩溃 | 协调器 receipt outbox + reconciler；COMMIT 幂等；不一致隔离（N-12f/N-12g） |
| R5 | 同 PDF 重复输入 `task_id` 冲突 | `input_key = sha256(source+MPN)`；同 PDF 同 MPN = 1 task + 多 ingest；不同 MPN = 2 task（N-21） |

### 3.3 第三轮复核响应（v1.3）

| 编号 | Reviewer 问题 | v1.3 处置 |
|---|---|---|
| R1-3a | receipt 已存在时如何读取/比较/不覆盖 | GET → `receipt_sha256` 比较 → 仅 404 才条件写 → 回读；不同内容一律 `conflict`，不 PUT |
| R1-3b | 写超时但实际成功如何区分 | 超时不盲目重试；先 GET 回读，一致即 `written`，不一致 `conflict` |
| R1-3c | PUT 成功、SQLite 状态未更新时崩溃 | 重启 `pending` → GET 回读一致 → 只更新状态，不重复 PUT |
| R1-3d | N-12f/N-12g 覆盖不足 | 拆为 N-12f1–f4、N-12g1–g3 |
| — | R5 的 canonical_json / MPN 规范化 | 本轮不改 R5；记录为 OD-21（实现前冻结） |

### 3.4 第四轮复核响应（v1.4）

| 编号 | Reviewer 要求 | v1.4 处置 |
|---|---|---|
| R1-3e | orphan Receipt 发现与隔离 | 启动/定时/按需/提交路径四路发现；仅按批次清单有界扫描；orphan → quarantine 记录 + `QUARANTINED`；不补 commit、不删/覆盖 receipt |
| R1-3f | 统一 PUT 后回读 404 | `verify_receipt` 四态：`WRITTEN/ABSENT/CONFLICT/UNKNOWN`；404 = `ABSENT`，不算冲突；仅 ABSENT 可条件重写；UNKNOWN 只读不写 |
| R1-3g | N-12g3 可执行化 | 临时 MinIO + 临时 SQLite 的步骤、SQL、HTTP、A1–A8 断言与清理；补 N-12f5/N-12g4 |

### 3.5 第五轮复核响应（v1.5）

| 编号 | Reviewer 问题 | v1.5 处置 |
|---|---|---|
| R1-3e-1 | `open_batches` 权威来源未定义 | 权威改为对象存储 `plan.json` + `closed.json`；OPEN/CLOSING/CLOSED 持久化；SQLite 丢失按前缀重建 |
| R1-3e-2 | 扫描覆盖范围不清 | 明确只保证「已登记批次内的已知 task_id」；CLOSED、未登记、损坏清单、全桶 orphan 不在自动保证内 |
| R1-3e-3 | 事件幂等无依据 | `event_id = sha256(batch|task|reason|receipt_sha)`；对象存储日志去重 + SQLite UNIQUE；固定写入顺序 |
| R1-3f-1 | PUT 200 后 404 是否重写 / OD-19 | 默认只回读；重写需 C1/C2 + 冷却 + 预算 + 仍 ABSENT；不支持条件写时禁止重写 |
| R1-3f-2 | 重试预算不精确 | 固定 6 个参数并持久化计数；重启不重置；1 h 未写入 → `QUARANTINED` |
| R1-3g-1 | `sha256sum` 变量歧义 | 改为 `sha256sum | awk '{print $1}'`；明确对远端原始字节计算 |
| R1-3g-2 | 测试前提不完整 | 补批次 OPEN、任务在清单、原状态 SUCCEEDED、receipt 不删、重复 reconcile、清理校验；N-12g4 不调用 reconcile |

### 3.6 第六轮复核响应（v1.6）

| 编号 | Reviewer 问题 | v1.6 处置 |
|---|---|---|
| R1-3e-1a | 批次状态不互斥 | OPEN/CLOSING/CLOSED 改为互斥条件；CLOSED 优先；冲突 → `INVALID_BATCH` |
| R1-3e-1b | 事件去重原子性 | 改为一事件一对象 `coordinator/<event_id>.json`；条件写天然去重；放弃整文件 JSONL |
| R1-3e-1c | SQLite 丢失精确恢复 | L1 备份 → L2 隔离 → L3 人工审批重建 commit（6 项校验 + `recovered_from_receipt`） |
| R1-3e-1d | 附件旧模型 | 附件 §9.2/§9.9/§9.10 已同步状态、事件对象、恢复与预算字段 |
| R1-3f-1 | 预算周期边界 | 定义 episode；单 episode 10 次/60 s；总量持久化不重置 |
| R1-3f-2 | 第二次 PUT 后验证 | 新 episode；`put_attempts=2` 封顶；再次 ABSENT 不再 PUT |
| R1-3g-1 | A8 与启动扫描冲突 | A8 允许 `control/batches/` 有界 list；禁止全桶与 `control/tasks/` list；N-12g4 单独断言 |
| R1-3g-2 | 远端哈希校验 | `aws s3api get-object` 落盘 + `sha256sum | awk` + 长度/ETag |
| R1-3g-3 | A9 清理证明 | head-bucket 404 / ls 空 / DB 与目录不存在 / 退出码记录 |

### 3.7 第七轮复核响应（v1.7）

| 编号 | Reviewer 要求 | v1.7 处置 |
|---|---|---|
| A1 | 事件存储门禁/超时/稳定字节 | `storage_atomic` 仅在 C1/C2 通过后声明；否则 `coordinator_serialized`；事件体去掉动态时间，重放字节一致；超时只回读 |
| A2 | token/generation 权威 | token = 确定性 HMAC + 全局 token 账本；generation 权威 = 每批次 watermark；缺失禁止 L3 |
| A3 | 恢复口径统一 | §5.2.5.4 改为引用 L1/L2/L3，不再写「自动重建」 |
| A4 | 附件扫描范围 | §9.10 改为 OPEN ∪ CLOSING；标题/伪代码同步 |
| A5 | episode 生命周期 | `episode_no≤1`；普通 reconcile 延续；重启恢复原 episode；总量上限 20 |
| A6 | 条件写规则统一 + A9 | 无 CAS 仅首次串行创建、永不重写；A9 补 `-wal`/`-shm` 与空桶区分 |

### 3.8 第八轮复核响应（v1.8）

| 编号 | Reviewer 问题 | v1.8 处置 |
|---|---|---|
| B1 | 事件两种模式冲突 | `storage_atomic`（条件 PUT，≤3 次）与 `coordinator_serialized`（普通 PUT，≤2 次）分别定义超时/重试；后者不宣称原子去重 |
| B2 | HMAC 密钥生命周期 | token 增加 `token_key_id`；历史 key 受控保留；L3 按 receipt key_id 验签；key 不可得禁止 L3 |
| B3 | generation 严格相等/顺序 | L3 改为 `generation == watermark`；发租约顺序固定为 watermark→回读→SQLite→返回 |
| B4 | token 账本顺序/失败/冲突 | commit → 账本条件写 → receipt；冲突隔离；账本失败不阻断成功但阻断 L3 |
| B5 | episode 0 后重写路径 | 引入一次 REC（1 GET，计入总量）；episode 1 上限 `min(10,20-total)`；耗尽后仅 observation，不提升成功 |

### 3.9 第九轮复核响应（v1.9）

| 编号 | Reviewer 问题 | v1.9 处置 |
|---|---|---|
| B1-1 | 次数口径 | 明确为总 PUT 次数（含首次）：atomic ≤3、serialized ≤2 |
| B1-2 | 双模式测试缺失 | 新增 N-12h1/N-12h2，分别断言 PUT 类型、次数、超时、unresolved |
| B2-1 | Schema 缺 key id | Receipt 升级 v2，`token_key_id` 必填；SHA 覆盖含该字段字节 |
| B2-2 | v1 兼容 | 仅显式 `legacy_receipt_key_id` 时允许；否则 `LEGACY_RECEIPT_NO_KEY_ID` 隔离 |
| B2-3 | key 生命周期 | `active/verify_only/revoked` 三态 registry；revoked 禁止 L3 |
| B5-1 | REC UNKNOWN | 新增 `REC_PENDING_UNKNOWN`；不重跑 REC；普通 GET 计数；20 次后 observation；3600 s 隔离 |
| B5-2 | REC 重启 | `rec_attempted/rec_state/rec_at` 持久化，重启不重复 |
| 测试 | B1–B5 矩阵 | 新增 N-12h/i/j/k/l |

### 3.10 第十轮复核响应（v1.10）

| 编号 | Reviewer 问题 | v1.10 处置 |
|---|---|---|
| B1-3 | 事件 PUT 预算无持久化数据结构 | 预算归属 `events` 行：`put_attempts/event_state/put_started_at/last_put_at`；与 `commits.put_attempts` 分离 |
| B1-4 | PUT 前如何原子占预算 | 同事务 `UPDATE ... WHERE put_attempts < max`，`changes()=1` 才 PUT；预算只减不增 |
| B1-5 | 重启/回读边界 | 重启按 `put_attempts` 续算；回读不计 PUT 预算；N-12h1/h2 增重启与回读断言 |
| B5-3 | REC 一次性标记顺序 | 先提交 `rec_attempted=1, rec_state='in_flight'`，再执行单次 GET，最后提交结果 |
| B5-4 | 崩溃恢复/状态归属 | `in_flight` 崩溃按 `unknown` 恢复；`REC_PENDING_UNKNOWN` 为内部子状态，权威 `commits.rec_state` |
| B5-5 | 崩溃点测试 | N-12l 增「GET 前崩溃」「结果未持久化崩溃」两项 |
| — | B2 非阻断建议 | N-12i 增 legacy key 已 revoked/不可读仍拒绝 L3 |

### 3.11 第十一轮复核响应（v1.11）

| 编号 | Reviewer 问题 | v1.11 处置 |
|---|---|---|
| B1-R1 | INSERT 示例非法 | 改为列名 + `VALUES`；INSERT/UPDATE 同一事务，COMMIT 后才发 PUT |
| B1-R2 | `last_put_at` 语义 | 重命名 `last_put_started_at`，明确为 PUT 开始时间 |
| B5-R1 | 预留与实测计数混用 | `verify_attempts_reserved`（上限 20，含 `in_flight`）与 `verify_attempts_total`（已完成 GET）分离 |
| B5-R2 | 断言口径 | N-12l 断言 `reserved=1,total=0`；新增 `total ≤ reserved` |
| 测试 | SQLite 实际执行验证 | 新增 N-12m；本地临时 SQLite 已执行 SQL/事务语义验证（见交付报告 §7） |
| 范围 | `edd2f99..HEAD` 表述 | 改为「本轮 Session A 提交未修改 `12_/14_/15_`」，`0474b19` 属 Session B |

### 3.12 第十二轮复核响应（v1.12）

| 编号 | Reviewer 问题 | v1.12 处置 |
|---|---|---|
| B1-R3 | `last_put_started_at` 实为预留时间 | 重命名 `last_put_reserved_at`；`put_started_at` 注释改为首次预留时间 |
| B5-R2 | 普通 GET 完成后才占预算 | 普通与 REC 统一先预留（`reserved+1`、`episode_attempts+1`）再 GET，返回后才 `total+1` |
| B5-R2a | episode 10 次上限可被崩溃绕过 | 预留事务内原子 +1 并校验 `<10`；崩溃不返还、重启不重置 |
| B5-R3 | `total` 审计定义过强 | 改为「结果已持久化的 GET 次数」；物理请求数需外部日志 |
| 测试 | 崩溃与并发 | 新增 N-12n；N-12m 增双连接并发实测 |

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

1. **评审状态**：Reviewer 已给出「设计 v1：有条件通过方向评审」；提交完整性与架构方向 PASS，数据契约要求修订，P0 决策 OPEN，**Stage A 未批准**。
2. **架构方向不变**：Raw（内容寻址、只读）/ Parse（run 级不可变、四指纹）/ Eval（Gold 版本化、评估器指纹）三层保留。
3. **DuckDB 只做分析查询**：它不是队列、不是锁、不是多写并发数据库、不是事实源；`catalog.duckdb` 是可由对象存储重建的派生物。
4. **批量路径采用「本地处理 → 大批 Parquet → 上传 → 批量查询」**：拒绝 DuckDB 直扫 56 万个小文件；同区对象存储才讨论直读。
5. **任务分配（v1.8）**：单写协调器 + 租约代次；receipt 四态 + `episode_no≤1` + 一次性 REC；事件写入分 `storage_atomic/coordinator_serialized` 两种模式；L3 需 key-version HMAC、token 账本与严格相等的 generation watermark。
6. **任务身份（v1.2）**：`input_key = sha256(source_sha256 + requested_mpn)`；同 PDF 同 MPN 只生成 1 个 task + 多条 ingest；同 PDF 不同 MPN 才是 2 个 task；`task_id` 是批次内身份。
7. **数据契约**：Run Manifest 与 Batch/Partition Manifest 分离；`reproducibility_key` v2；Manifest 不含 token。
8. **基准口径**：可解析池 950 + 预期拒绝池 50（含子类配额）；五类失败率各有分母；≤2% 只约束可解析池。
9. **当前仍缺**：对象存储上传、协调器/receipt 实现、真实存储一致性测试、运行时指纹、Parquet 分区/合并、Catalog 快照、失败重试与死信、1000 份基准与成本实测。
10. **一个必须先处理的基线问题**：`pipeline.py` 与 A3-W1 授权快照不一致（实测 `86c005…`，期望 `3394bb…`）；不裁定，Parser 指纹无法成为可复现基线。
11. **本包不能作为**：数据契约冻结、Stage A 开工许可、1000 份基准许可、3–5 万试跑许可或生产实施依据。

---

## 6. 判定边界建议

| 判定 | 适用 |
|---|---|
| `PASS` / `PARTIAL` / `FAIL` | 架构完整性、三层不变量、失败路径覆盖、DuckDB 职责边界、可执行性 |
| `NOT VERIFIABLE` | 真实对象存储吞吐、真实批量耗时、成本金额、ECS 规格是否够用、568,830 份的实际成功率 |
| 不接受的口径 | 把 `lake/` 单件 Demo 当作批量能力；把设计文档当作已实现；用外推数字当作交付承诺；把 MinIO 结果当作真实存储结论 |
| 当前阶段 | Stage A **NOT APPROVED**；本包只请求 R1–R6 的设计闭合复核 |

---

## 7. 版本与冻结约定

- 本包为 **v1.1**（v1.0 首轮送审 + R1–R6 修订），**未冻结**。
- Reviewer 意见以新 commit 追加，不覆盖本目录历史版本。
- 任何实现工作必须在 Reviewer 对本设计与 `OPEN_DECISIONS.md` 的阻断项给出裁定后另行立项。
