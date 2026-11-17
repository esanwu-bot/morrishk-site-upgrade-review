# 交付报告 · MRH-DSBIT-LAKE-001

| 项 | 值 |
|---|---|
| 交付编号 | MRH-DSBIT-LAKE-001 |
| 交付日期 | 2026-11-17 |
| 版本 | **v1.11**（第十一轮：B1 INSERT SQL 与 `last_put_started_at`；B5 预留计数与实测计数分离） |
| 性质 | 设计送审（DESIGN ONLY） |
| 主文档 | `DS_BIT_DUCKDB_S3_PIPELINE_DESIGN_v1.md` |
| Reviewer 结论（第十一轮） | v1.10 为 PASS WITH REQUIRED REVISIONS；B1/B5 待定向复核；B2–B4 沿用 PASS；契约冻结与 Stage A 仍不批准 |
| v1.0 提交 | 设计 `a62c70d644ced735ccfe079b086aca744f142f93`；报告 `ce6ba2db2839cb49a69702d3251482c4b58ba633` |
| v1.1 设计修订提交 | `f8b8085fa12d57050e176bc8517a5a4856eaceef` |
| v1.1 报告与校验清单 | `cdc61147387801c1b758deae89bb871467ef92d7` |
| v1.2 设计修订提交 | `473497dd276e65cf9f6ca326bfddf9cb29865a39` |
| v1.2 报告与校验清单 | `e9a56ca9b42db114b57a0fab62bcb258d7718ee4` |
| v1.3 设计修订提交 | `7d00abee8edb6e238bd8f90f321afe7ba1dd058a` |
| v1.3 报告与校验清单 | `4da074097354874b95278b3702e624864faf7335` |
| v1.4 设计修订提交 | `8d6760538655121dde369f8618e9a9d4010ce0a5` |
| v1.4 报告与校验清单 | `dc0239cd29ca72055d4d8dc466f9b706d4f3a19e` |
| v1.5 设计修订提交 | `a7fc084b0daf0f9e798dc2e171c5960926008e7f` |
| v1.5 报告与校验清单 | `10f36064e448dc75df1d7f38c005e88384d9a7dd` |
| v1.6 设计修订提交 | `19505459d975c1315a07dae91032b136d23f8b08` |
| v1.6 报告与校验清单 | `696f2ab4b9f9f852e502490ea84a5f38cae7f652` |
| v1.7 设计修订提交 | `01c95754b13cf2ada6cb29fe2ee76065006ea465` |
| v1.7 报告与校验清单 | `8c45f63bd61a9a8edfc284989e8f52c6d1365754` |
| v1.8 设计修订提交 | `59eff5b6dd39ede7cf5353fc4fc150c8f5869046` |
| v1.8 报告与校验清单 | `5fa7c5ca7acb4a2780811de03b50a7e6b8f30fa5` |
| v1.9 设计修订提交 | `0b50f38daa2f751458a0d77c5e58d022b097ec48` |
| v1.9 报告与校验清单 | `edd2f9947f4101630966287886610b0b510ee98b` |
| v1.10 设计修订提交 | `95d32a227c564a3694824ecf24dcc96c16b04647` |
| v1.10 报告与校验清单 | `3ecb54b137a7bbfcd23c02e56dd2eed851a2156f` |
| v1.11 设计修订提交 | `（提交后回填）` |
| v1.11 报告与校验清单 | 紧随 v1.11 设计提交（SHA 见 `git log`） |
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
| `DELIVERY_REPORT.md` | 本文件 | v1.5 重写 |

**文件数量口径（避免混淆）**：

| 口径 | 数量 |
|---|---|
| 目录内文件总数 | **8** |
| v1.4 两个提交累计修改的不同文件 | **6**（另 2 个未变） |
| v1.5 两个提交累计修改的不同文件 | 以本次 `git show --stat` 为准 |
| `SHA256SUMS.txt` 覆盖文件数 | **7**（不含自身） |

> 目录 8 个文件不等于每轮修改 8 个文件。哈希为本机计算，Reviewer 尚未独立复算 7/7。

完整性校验：

```bash
cd 13_dsbit_duckdb_s3_pipeline
sha256sum -c SHA256SUMS.txt
```

---

## 3. 变更文件列表

v1.1–v1.11 的 Session A 提交只修改上述 `13_` 目录内的文件；**本轮 Session A 提交（`95d32a2`、`3ecb54b` 及 v1.11 两个提交）未修改**：

- Ds Bit 仓库任何文件；
- 送审仓库 `12_`、`14_`、`15_` 目录；
- `00_`–`11_` 既有目录；
- `10_scope_confirmation/` 下未跟踪的 `.docx`。

> 范围口径说明：`0474b19`（`15_phase1_mock_ui` 的 Session B 修订）位于 `edd2f99` 与 v1.10 设计提交之间，属 Session B，不计入 Session A 本轮范围；因此不应使用 `edd2f99..HEAD` 的整体 diff 判断本轮的目录边界。

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

### 4.4 第四轮 R1-3（v1.4）

| 编号 | Reviewer 要求 | v1.4 处置 | 复核位置 |
|---|---|---|---|
| **R1-3e** | orphan receipt 发现与隔离 | 启动/定时/按需/提交四路发现；仅按批次清单有界扫描；quarantine 记录 + `QUARANTINED`；不补 commit、不删/覆盖 receipt | 主文档 §5.2.5.5；附件 §9.10；N-12g4 |
| **R1-3f** | 统一 PUT 后回读 404 | `verify_receipt` 四态；404=`ABSENT` 不算冲突；仅 ABSENT 可条件重写；UNKNOWN 只读不写 | 主文档 §5.2.5.1–.2；附件 §9.9；N-12f5 |
| **R1-3g** | N-12g3 可执行化 | 临时 MinIO + 临时 SQLite 的步骤、SQL、HTTP、A1–A8 断言与清理 | 矩阵 N-12g3 |

### 4.5 第五轮 R1-3e/f/g（v1.5）

| 编号 | Reviewer 要求 | v1.5 处置 | 复核位置 |
|---|---|---|---|
| **R1-3e-1** | 批次索引权威来源/状态/SQLite 恢复 | 权威改为对象存储 `plan.json` + `closed.json`；OPEN→CLOSING→CLOSED 持久化；SQLite 丢失按前缀重建 | 主文档 §5.2.5.5.1；附件 §9.10 |
| **R1-3e-2** | 扫描覆盖范围 | 明确只保证「已登记批次内的已知 task_id」；CLOSED/未登记/损坏/全桶不在自动保证内 | 主文档 §5.2.5.5.2 |
| **R1-3e-3** | 事件幂等 | `event_id=sha256(batch|task|reason|receipt_sha)`；对象存储日志去重 + SQLite UNIQUE；固定写入顺序 | 主文档 §5.2.5.5.3；附件 §9.2/§9.10 |
| **R1-3f-1** | PUT 200 后 404 重写/OD-19 | 默认只回读；重写需 C1/C2 + 冷却 + 预算 + 仍 ABSENT；不支持条件写禁止重写 | 主文档 §5.2.5.2.1；附件 §9.9；N-12f5 |
| **R1-3f-2** | 任务级预算 | 固定 6 参数并持久化；重启不重置；1 h 未写入 → `QUARANTINED` | 主文档 §5.2.5.2.1；附件 §9.9 |
| **R1-3g-1** | SHA 命令歧义 | `sha256sum | awk '{print $1}'`；对远端原始字节计算 | 矩阵 N-12g3 |
| **R1-3g-2** | 测试前提与独立路径 | 补批次 OPEN、任务在清单、原状态、不删 receipt、重复 reconcile、清理；N-12g4 不调用 reconcile | 矩阵 N-12g3/N-12g4 |

### 4.6 第六轮 R1-3e/f/g（v1.6）

| 编号 | Reviewer 要求 | v1.6 处置 | 复核位置 |
|---|---|---|---|
| **R1-3e-1a** | 批次状态互斥 | OPEN/CLOSING/CLOSED 改为互斥判定；CLOSED 优先；冲突 → `INVALID_BATCH` | 主文档 §5.2.5.5.1；附件 §9.10 |
| **R1-3e-1b** | 事件去重原子性 | 一事件一对象 `coordinator/<event_id>.json`；条件写去重；放弃整文件 JSONL | 主文档 §5.2.5.5.3；附件 §9.10 |
| **R1-3e-1c** | SQLite 丢失精确恢复 | L1 备份 → L2 隔离 → L3 人工审批重建 commit（6 项校验 + `recovered_from_receipt`） | 主文档 §5.2.5.5.1；附件 §9.10 |
| **R1-3e-1d** | 附件旧模型 | 附件 §9.2/§9.9/§9.10 已同步 | `PIPELINE_ARTIFACTS.md` |
| **R1-3f-1/2** | 预算周期/第二次 PUT | episode 定义；单 episode 10 次/60 s；第二次 PUT 后新 episode；总量持久化不重置 | 主文档 §5.2.5.2.1；附件 §9.9；N-12f5 |
| **R1-3g-1/2/3** | A8/A9/哈希 | A8 允许 batch-prefix list；远端哈希落盘计算；A9 提供 404/空桶/DB 不存在证明 | 矩阵 N-12g3/N-12g4 |

### 4.7 第七轮 A1–A6（v1.7）

| 编号 | Reviewer 要求 | v1.7 处置 | 复核位置 |
|---|---|---|---|
| **A1** | 事件门禁/超时/稳定字节 | `storage_atomic` 需 C1/C2；否则 `coordinator_serialized`；事件体固定字段、无动态时间；超时只回读 | 主文档 §5.2.5.5.3；N-12g5 |
| **A2** | token/generation 权威 | token = 确定性 HMAC + 全局 token 账本；generation = 每批次 watermark；缺失禁止 L3 | 主文档 §5.2.5.5.1 |
| **A3** | 恢复口径统一 | §5.2.5.4 改为引用 L1/L2/L3，删除「自动重建」 | 主文档 §5.2.5.4 |
| **A4** | 附件扫描范围 | §9.10 改为 OPEN ∪ CLOSING；标题与伪代码同步 | `PIPELINE_ARTIFACTS.md` §9.10 |
| **A5** | episode 生命周期 | `episode_no≤1`；普通 reconcile 延续；重启恢复；总量上限 20 | 主文档 §5.2.5.2.1；附件 §9.9 |
| **A6** | 条件写统一/A9 | 无 CAS 仅首次串行创建、永不重写；A9 补 `-wal`/`-shm` 与「空桶 ≠ 桶已删除」 | 主文档 §5.2.5.1；矩阵 N-12g3 |

### 4.8 第八轮 B1–B5（v1.8）

| 编号 | Reviewer 要求 | v1.8 处置 | 复核位置 |
|---|---|---|---|
| **B1** | 事件两种模式/无 CAS 超时 | `storage_atomic` 条件 PUT ≤3 次；`coordinator_serialized` 普通 PUT ≤2 次；分别定义回读与冲突 | 主文档 §5.2.5.5.3 |
| **B2** | HMAC key 版本/轮换 | `token_key_id`；历史密钥受控保留；L3 按 key_id 验签；不可得禁止 | 主文档 §5.2.5.5.1 |
| **B3** | generation 严格相等/顺序 | `generation == watermark`；发租约顺序 watermark→回读→SQLite→返回 | 主文档 §5.2.4、§5.2.5.5.1 |
| **B4** | token 账本顺序/失败/冲突 | commit → 账本 → receipt；冲突隔离；失败不阻断成功但阻断 L3 | 主文档 §5.2.5.5.1 |
| **B5** | episode 0 后重写路径 | 一次 REC（1 GET，计入总量）；episode 1 上限 `min(10,20-total)`；耗尽后仅 observation | 主文档 §5.2.5.2.1；附件 §9.9 |

### 4.9 第九轮 B1/B2/B5（v1.9）

| 编号 | Reviewer 要求 | v1.9 处置 | 复核位置 |
|---|---|---|---|
| **B1-1** | `≤3`/`≤2` 是重试次数还是总尝试次数 | 统一改为**总 PUT 次数（含首次）**：`storage_atomic` 总 PUT ≤3（最多 2 次重试）；`coordinator_serialized` 总 PUT ≤2（最多 1 次重试）；预算按总次数持久化 | 主文档 §5.2.5.5.3；附件 §9.10 |
| **B1-2** | 两模式缺独立负向测试 | 新增 N-12h1（atomic：条件 PUT/总次数≤3/超时回读/unresolved）与 N-12h2（serialized：普通 PUT/总次数≤2/不得标 atomic） | 矩阵 N-12h1/N-12h2 |
| **B2-1** | Receipt Schema 缺 `token_key_id` | 规范 Schema 升级为 `lakehouse/commit-receipt/v2`，`token_key_id` **必填**；`receipt_sha256` 覆盖该字段规范字节 | 主文档 §5.2.5.1 |
| **B2-2** | 旧 v1 Receipt 的 L3 兼容 | 旧 v1 无 key_id：仅在配置显式 `legacy_receipt_key_id` 时允许 L3，否则 `LEGACY_RECEIPT_NO_KEY_ID` 隔离；不静默改写 v1 字段契约 | 主文档 §5.2.5.5.1；矩阵 N-12i |
| **B2-3** | key 生命周期 | key registry 三态 `active / verify_only / revoked`；revoked 不参与签发与验签；新增 N-12i 覆盖轮换/未知/不可用 | 主文档 §5.2.5.5.1 |
| **B5-1** | REC `UNKNOWN` 后允许什么 | 新增 `REC_PENDING_UNKNOWN`：不重跑 REC、不开 episode 1；普通 GET 计数继续、成功仍有效；总量 20 后 observation-only；3600 s 未决 `QUARANTINED`；观察到 WRITTEN 只告警 | 主文档 §5.2.5.2.1；附件 §9.9；矩阵 N-12l |
| **B5-2** | REC 状态持久化 | `commits` 持久化 `rec_attempted/rec_state/rec_at`；重启后不再触发一次性 REC | 主文档 §5.2.5.2.1；附件 §9.2 |
| **测试** | B1–B5 负向设计 | 新增 N-12h1/h2、N-12i（key）、N-12j（watermark）、N-12k（token 账本）、N-12l（REC） | 矩阵 |

> 本轮仍为设计层修订：未改代码、未重跑测试、未做真实存储验证。

### 4.10 第十轮 B1/B5（v1.10）

| 编号 | Reviewer 要求 | v1.10 处置 | 复核位置 |
|---|---|---|---|
| **B1-3** | 事件 PUT 预算无持久化数据结构 | 预算归属 SQLite `events` 行：新增 `put_attempts`、`event_state`、`put_started_at`、`last_put_at`；明确与 `commits.put_attempts`（仅 receipt）分离 | 主文档 §5.2.5.5.3；附件 §9.2/§9.10 |
| **B1-4** | PUT 前原子占预算 | 同事务 `UPDATE events SET put_attempts=put_attempts+1 WHERE event_id=? AND put_attempts < :max_puts`，仅 `changes()=1` 才发 PUT；预算只减不增，PUT 前崩溃不退回 | 主文档 §5.2.5.5.3 |
| **B1-5** | 重启与回读边界 | 重启按 `put_attempts` 续算，终态不再 PUT；回读（成功/失败/超时/404）不计 PUT 预算；N-12h1/h2 增重启与回读断言 | 矩阵 N-12h1/N-12h2 |
| **B5-3** | REC 一次性标记先于 GET | 顺序改为：① SQLite 提交 `rec_attempted=1, rec_state='in_flight', rec_at=now, verify_attempts_total+=1` → ② 单次 GET → ③ 提交结果 | 主文档 §5.2.5.2.1；附件 §9.9 |
| **B5-4** | `in_flight` 崩溃恢复与状态归属 | `in_flight` 一律按 `unknown` 恢复、不重发；`REC_PENDING_UNKNOWN` 为 `COMMITTED_PENDING_RECEIPT` 内部子状态，权威字段 `commits.rec_state`，不新增 `tasks.state` | 主文档 §5.2.5.2.1；矩阵 N-12l |
| **B5-5** | 两个崩溃点测试 | N-12l 增「`in_flight` 已提交、GET 前崩溃」与「GET 已返回、结果未持久化崩溃」 | 矩阵 N-12l |
| — | B2 非阻断建议 | N-12i 增「legacy key 已 revoked/不可读仍拒绝 L3」 | 矩阵 N-12i |

> 本轮仍为设计层修订：未改代码、未重跑测试、未做真实存储验证。

### 4.11 第十一轮 B1/B5（v1.11）

| 编号 | Reviewer 要求 | v1.11 处置 | 复核位置 |
|---|---|---|---|
| **B1-R1** | 示例 `INSERT` 不是合法 SQL | 改为 `INSERT OR IGNORE INTO events(列名...) VALUES(...)`；与预算 `UPDATE` 同一事务，`COMMIT` 成功后才发 PUT | 主文档 §5.2.5.5.3；附件 §9.10 |
| **B1-R2** | `last_put_at` 语义 | 重命名为 `last_put_started_at`，明确为 PUT **开始**时间，不代表已完成 | 主文档 §5.2.5.5.3；附件 §9.2/§9.10 |
| **B5-R1** | 预留与实际 GET 计数混用 | 分离 `verify_attempts_reserved`（含 `in_flight`，20 次上限按此计）与 `verify_attempts_total`（已完成 GET 审计）；REC 先占 reserved，第 3 步才 +total | 主文档 §5.2.5.2.1；附件 §9.2/§9.9 |
| **B5-R2** | N-12l 断言口径 | 崩溃点 1/2 分别断言 `reserved=1,total=0`；新增 `total ≤ reserved` 与 20 次按 reserved 计 | 矩阵 N-12l |
| **测试** | SQLite 实际执行验证 | 新增 N-12m（合法 INSERT、预算并发、PUT 前崩溃、回读、REC 两崩溃点、重启幂等）；本轮已在临时 SQLite 执行 SQL 语义验证，见 §7 | 矩阵 N-12m |
| **范围口径** | 更正 `edd2f99..HEAD` 表述 | 改为「本轮 Session A 提交（`95d32a2`、`3ecb54b`）未修改 `12_/14_/15_`」；`0474b19` 属 Session B，不计入本轮范围 | §3 |

> 本轮仍为设计层修订：未改生产代码、未重跑 Ds Bit 测试、未做真实对象存储验证。

---

## 5. 关键架构决策（v1.11）

1. 批量路径仍是「本地处理 → 大批 Parquet → 上传 → 批量查询」；
2. DuckDB 仍只做分析查询，单写快照，不是队列/锁/事实源；
3. 任务分配为**单写协调器 + `lease_generation` + COMMIT 事务**；发租约前先持久化 watermark；
4. **成功提交点**不是 manifest，而是「协调器 commit 记录 + receipt 一致」；
5. receipt 四态 + `episode_no≤1` + 一次性 REC；无 CAS 仅首次串行创建、永不重写；REC 先持久化 `in_flight` 与 `reserved+1` 再 GET，`in_flight` 崩溃按 `unknown` 恢复；`REC_PENDING_UNKNOWN` 是 `COMMITTED_PENDING_RECEIPT` 内部子状态（权威 `commits.rec_state`）；20 次上限按 `verify_attempts_reserved`，`verify_attempts_total` 只记已完成 GET；
6. orphan 事件分 `storage_atomic/coordinator_serialized` 两种模式，总 PUT 次数分别为 ≤3/≤2（含首次），预算持久化在 `events` 行（合法 INSERT + 同事务原子 +1、只减不增、回读不计、`last_put_started_at` 仅为开始时间）；L3 需 `commit-receipt/v2` 的 `token_key_id`、key registry（`active/verify_only/revoked`）、token 账本、严格相等 generation；
7. Run Manifest 与 Batch/Partition Manifest 分离，Catalog 只按 part_manifest 计总行数；
8. `reproducibility_key` v2；`task_id` = `<batch_id>:<sha256(source_sha256 + requested_mpn)>`；
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

**v1.11 临时 SQLite 语义验证（非生产代码、非正式测试）**：

在系统临时目录创建一次性 SQLite 库，按 N-12m 的 SQL 与事务顺序执行，执行后删除临时库：

| 验证项 | 结果 |
|---|---|
| 合法 INSERT + 同事务预算占用 | PASS：`put_attempts=1`、`event_state='pending'` |
| 预算上限（`<3`） | PASS：第 2、3 次 `changes()=1`；第 4 次起 `changes()=0`，`put_attempts` 保持 3 |
| 回读不改变预算 | PASS：`put_attempts=3` 与 `last_put_started_at` 均不变 |
| 重启持久化 | PASS：重开 DB 仍为 `put_attempts=3`、`pending` |
| REC `in_flight` 崩溃 | PASS：恢复为 `rec_state='unknown'`、`reserved=1`、`total=0`，不重发 |
| 完成 REC / 计数不变量 | PASS：`total=1 ≤ reserved=1` |

> 这是 SQL 语义与持久化行为的本地验证，不等于协调器实现、并发压测或真实存储测试；`893 passed / 1 failed / 2 xfailed` 基线未改变。

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

### 9.4 第四轮（v1.3）

| 项 | 结论 |
|---|---|
| R1-3 前序修订 | 方向认可，但 orphan / 404 / N-12g3 仍需补 |
| v1.4 状态 | 三项已补，待 Reviewer 定向复核 |
| 契约冻结 | **不批准** |
| Stage A / 1000 份 / 3–5 万 / 生产 | **不批准** |

> v1.4 只改 `13_` 内的 R1-3 相关章节；R5 与其他已通过项未改。

### 9.5 第五轮（v1.4）

| 项 | 结论 |
|---|---|
| R1-3e/f/g | PARTIAL（v1.5 已补三组） |
| v1.5 状态 | 待 Reviewer 定向复核 |
| 契约冻结 | **不批准** |
| Stage A / 1000 份 / 3–5 万 / 生产 | **不批准** |

> v1.5 只改 `13_` 内的 R1-3e/f/g；R5、R2/R3/R4/R6 与总体架构未改。

### 9.6 第六轮（v1.5）

| 项 | 结论 |
|---|---|
| R1-3e/f/g | PARTIAL（v1.6 已补未闭合项） |
| v1.6 状态 | 待 Reviewer 定向复核 |
| 契约冻结 | **不批准** |
| Stage A / 1000 份 / 3–5 万 / 生产 | **不批准** |

> v1.6 只改 `13_` 内的 R1-3e/f/g；R5、R2/R3/R4/R6 与总体架构未改。真实存储实测仍未进行。

### 9.7 第七轮（v1.6）

| 项 | 结论 |
|---|---|
| R1-3e-1a 状态互斥 | PASS（v1.6 已关闭） |
| R1-3e-1b/c/d | PARTIAL（v1.7 已补 A1/A2/A4） |
| R1-3f | PARTIAL（v1.7 已补 A5） |
| R1-3g | PARTIAL（v1.7 已补 A6 与 A9 断言） |
| v1.7 状态 | 待 Reviewer 定向复核 |
| 契约冻结 / Stage A / 基准 / 试跑 / 生产 | **不批准** |

> v1.7 只改 `13_` 内的 A1–A6；R5、R2/R3/R4/R6 与总体架构未改。

### 9.8 第八轮（v1.7）

| 项 | 结论 |
|---|---|
| A3 / A4 | PASS（可关闭） |
| A1 / A2 / A5 / A6 | PARTIAL（v1.8 已补 B1–B5） |
| v1.8 状态 | 待 Reviewer 定向复核 |
| 契约冻结 / Stage A / 基准 / 试跑 / 生产 | **不批准** |

> v1.8 只改 `13_` 内的 B1–B5；R5、R2/R3/R4/R6 与总体架构未改。

### 9.9 第九轮（v1.8）

| 项 | 结论 |
|---|---|
| 提交范围与目录边界 | PASS |
| A3 / A4 | PASS（保持） |
| B1 事件双模式 | PARTIAL（v1.9 已补尝试次数口径与 N-12h1/h2） |
| B2 HMAC 密钥版本 | REVISE（v1.9 已改 Receipt v2 + v1 兼容 + key registry） |
| B3 generation / watermark | PASS（保持） |
| B4 Token Ledger | PASS WITH CLARIFICATION（v1.9 已补 N-12k） |
| B5 REC / episode | PARTIAL（v1.9 已补 `REC_PENDING_UNKNOWN` 与持久化字段） |
| R1-3 总体 | **OPEN** |
| v1.9 状态 | 待 Reviewer 定向复核 |
| 契约冻结 / Stage A / 基准 / 试跑 / 生产 | **不批准** |

> v1.9 只改 `13_` 内的 B1/B2/B5 与对应测试设计；A3/A4、R5、R2–R4/R6 与总体架构未改。
> 代码未改、测试未重跑，历史基线仍为 `893 passed / 1 failed / 2 xfailed`。

### 9.10 第十轮（v1.9）

| 项 | 结论 |
|---|---|
| Git 提交与 A/B 边界 | PASS |
| B1 | PARTIAL（v1.10 已补事件 PUT 预算持久化、原子占用、重启与回读边界） |
| B2 | PASS（设计层，保持） |
| B3 / B4 | 沿用此前裁定 |
| B5 | PARTIAL（v1.10 已改为先 `in_flight` 再 GET，并补两个崩溃点） |
| R1-3 总体 | **OPEN** |
| v1.10 状态 | 待 Reviewer 定向复核 |
| 契约冻结 / Stage A / 基准 / 试跑 / 生产 | **不批准** |

> v1.10 只改 `13_` 内的 B1/B5 与对应测试设计；A3/A4、B2–B4、R5、R2–R4/R6 与总体架构未改。
> 代码未改、测试未重跑，历史基线仍为 `893 passed / 1 failed / 2 xfailed`。

### 9.11 第十一轮（v1.10）

| 项 | 结论 |
|---|---|
| Git 提交与 A/B 边界 | PASS（Session A 提交仅 `13_`；`0474b19` 属 Session B） |
| B1 核心预算模型 | PASS；SQL 示例与 `last_put_started_at`（v1.11 已修） |
| B5 崩溃恢复模型 | PASS；预留/实测计数语义（v1.11 已分离） |
| B2 | 沿用设计层 PASS |
| B3 / B4 | 沿用此前裁定 |
| A3/A4、R5、R2–R4/R6 | 不重新打开 |
| R1-3 总体 | **OPEN**（等待 v1.11 定向复核） |
| v1.11 状态 | 待 Reviewer 定向复核 |
| 契约冻结 / Stage A / 基准 / 试跑 / 生产 | **不批准** |

> v1.11 只改 `13_` 内的 B1/B5 与测试设计；未改生产代码、未重跑 Ds Bit 测试；临时 SQLite 仅验证 SQL/事务语义。

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
