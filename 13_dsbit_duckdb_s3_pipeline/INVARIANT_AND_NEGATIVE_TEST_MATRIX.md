# 不变量与负向测试矩阵

本文件定义 13 条数据不变量与 15 项必测 + 6 项回归负向测试（N-12 另有 a–g 子用例）。**除特别标注「已执行」的三项外，全部为 `PROPOSED` 测试设计，本轮未执行。**

已执行的三项来自 `lake/_negative_tests.py`（本次运行 3/3 PASS）：

- 反例 1：原始层被篡改 → 内容寻址失配；
- 反例 2：新 Gold 不覆盖旧版；
- 反例 3：无 manifest 的 eval 被拒绝。

---

## 1. 十条数据不变量

### I-1 Raw 对象不可被 Parse 或 Eval 覆盖

| 项 | 内容 |
|---|---|
| 定义 | `raw/pdf/...` 下任何对象的字节，在写入后不得改变；Parse/Eval 只能读，不能写该前缀 |
| 实现 | ① 应用层只使用 `PUT ... If-None-Match: *`；② 代码中不存在覆盖 raw 的 `put_object` 路径（静态扫描 + 代码审查）；③ 桶开启 Versioning；④ 可选 Object Lock |
| 检测 | 对象历史版本；`verify_lineage` 重算哈希 |
| 测试 | N-15；单测：构造「已存在不同字节」的条件写，断言收到 412/409 且原对象版本不变 |
| 失败后果 | 原始证据被替换，所有下游追溯失效 → 立即停止批次 |

### I-2 SHA-256 必须与原始 PDF 内容一致

| 项 | 内容 |
|---|---|
| 定义 | Raw 键名中的 `<sha256>` 必须等于对象字节的 SHA-256 |
| 实现 | 流式哈希（1 MiB chunk）→ 临时文件 → 校验 → 条件写；读时重算 |
| 检测 | `verify_lineage` 对每个被引用 raw 对象重算 |
| 测试 | N-01；单测：篡改 1 bit → 键名不匹配 → 拒绝提交 |
| 失败后果 | 身份错误 → 追溯链断裂 |

### I-3 同一 PDF 的重复输入必须可识别

| 项 | 内容 |
|---|---|
| 定义 | 同一字节流只对应一个 raw 对象；同一 `PdfId` 内容变化必须是新对象 + 新 Revision |
| 实现 | 内容寻址 + `HEAD`/条件写；`raw_docs.unique_sha256`；批次重复率统计 |
| 检测 | `Q7` 重复查询；`unique_sha256 / total_inputs` |
| 测试 | N-02；单测：同字节两次上传 → 1 个对象、2 条 ingest 记录（同 sha，不同 task） |
| 失败后果 | 重复解析浪费算力；统计分母失真 |

### I-4 每个 Parse 结果必须能追溯到唯一 Raw 对象

| 项 | 内容 |
|---|---|
| 定义 | Manifest 必含 `source_sha256`、`source.key`、`source.version_id`；该 raw 对象必须存在且哈希一致 |
| 实现 | Manifest schema 必填校验；发布前 `HEAD` 检查 |
| 检测 | `_verify_lineage` 扩展版（对象存储） |
| 测试 | N-14；单测：删除 raw（沙箱）→ 校验失败 |
| 失败后果 | 结果无法解释来源 |

### I-5 每个 Parse 结果必须记录 Parser 和配置指纹

| 项 | 内容 |
|---|---|
| 定义 | Manifest 必含 `parser_fingerprint`、`config_hash`、`dependency_lock_sha256`、`parser_fingerprint_scope` |
| 实现 | 运行时计算；批次 `plan.json` 固定；漂移即停 |
| 检测 | Manifest 校验；`Q2`；批次 plan 比对 |
| 测试 | N-08 / N-09 |
| 失败后果 | 不可复现，无法判断结果由哪版代码产生 |

### I-6 每个 Eval 结果必须能追溯到 Parse 版本

| 项 | 内容 |
|---|---|
| 定义 | `eval_result.run_id` 必须存在对应 parse manifest；`gold_version` 与 `evaluator_fingerprint` 必填 |
| 实现 | 加载器先查 manifest，缺失即 `ManifestMissing`（已有实现，`lake/_negative_tests.py:97-105`） |
| 检测 | `verify_lineage` |
| 测试 | N-14；反例 3（已执行） |
| 失败后果 | 指标无法归因 |

### I-7 不允许用新 Parse 结果覆盖历史结果

| 项 | 内容 |
|---|---|
| 定义 | 每次执行产生新 `run_id`；旧 `run_id` 的对象、manifest、eval 均保留 |
| 实现 | `run_id` 含时间戳与随机；对象条件写；Catalog `run_id` 主键；`(source_sha256, parser_fingerprint, config_hash)` **不加唯一约束**（适当重复执行） |
| 检测 | `Q2`；`duckdb_constraints()` |
| 测试 | N-13；`lake` Q4 已证明 PK=1 / UNIQUE=0（已执行） |
| 失败后果 | 历史被抹掉，无法回溯 |

### I-8 失败重试不得产生不可区分的重复结果

| 项 | 内容 |
|---|---|
| 定义 | 同一任务的每次尝试必须有 `attempt`、独立 `run_id`、可识别的状态；统计时能区分 canonical 与历史 attempt |
| 实现 | `attempt` 字段；`canonical_of`；`v_canonical_runs` 视图；任务事件 |
| 检测 | `Q5`；按 `task_id` 折叠事件 |
| 测试 | N-13 |
| 失败后果 | 重复计数、质量指标被污染 |

### I-9 DuckDB 查询结果必须能够定位到具体数据快照

| 项 | 内容 |
|---|---|
| 定义 | 每条发布查询必须携带 `snapshot_id`；快照 manifest 列出所用 Parquet 文件的 SHA-256 与行数 |
| 实现 | 快照目录 + manifest；读者先读 manifest；查询日志记录 `snapshot_id` |
| 检测 | `Q6`；查询日志 |
| 测试 | N-11；单测：篡改快照中的一个文件 → 校验失败 |
| 失败后果 | 报表无法复现 |

### I-10 删除、失效和重处理必须有审计记录

| 项 | 内容 |
|---|---|
| 定义 | 不允许物理删除 raw/parse/eval；失效 = 墓碑；重处理 = 新 run + 墓碑指向替代 |
| 实现 | `control/tombstones/<kind>/<key>/<ts>.json`；对象存储删除权限不给 Worker；保留策略只归档不删除 |
| 检测 | 墓碑全量保留；快照 manifest 记录排除项 |
| 测试 | N-15；单测：写墓碑后对象仍存在、原快照不变、新快照可排除 |
| 失败后果 | 无法解释「为什么某份数据不见了」 |

### I-11 批次 Parquet 行数只能统计一次（v1.1 新增，R2）

| 项 | 内容 |
|---|---|
| 定义 | 批次 Parquet 的总行数只由 `part_manifest.total_rows` 表达；Run Manifest 只记录本 run 的 `parquet_contribution`；Catalog 不得按 run 引用次数累加文件行数 |
| 实现 | 两级 Manifest（主文档 §5.6）；Catalog 构建时做三级对账（§7.2）；不一致即中止发布 |
| 检测 | Q8；快照 manifest 的 `row_reconciliation.delta` |
| 测试 | N-19：2 个 run 共享 1 个文件（2896），总行数必须是 2896 而不是 5792 |
| 失败后果 | 统计虚高、质量指标分母错误 |

### I-12 任务最多一个成功标记（v1.2 修订，R1）

| 项 | 内容 |
|---|---|
| 定义 | 同一 `task_id` 最多一个成功 commit；只有持有当前 `lease_generation` 且未过期的 Worker 能触发 commit；成功 = commit 记录 + receipt 一致 |
| 实现 | 协调器 SQLite `commits.task_id` 主键；COMMIT 事务校验 owner/generation/expires_at/epoch/state；token 只存 commit 与 receipt；receipt 由协调器 outbox 写 |
| 检测 | `commits` 表；receipt 的 token/manifest_sha；任务终态 |
| 测试 | N-12a–N-12g、N-20 |
| 失败后果 | 同一任务两个成功结果，或「协调器成功、下游未成功」的双重状态 |

### I-13 重复输入不产生重复任务（v1.2 新增，R5）

| 项 | 内容 |
|---|---|
| 定义 | 同一批次、同一 PDF、同一 MPN 的多次输入只生成一个 `task_id`；每次输入是一条 `ingest_id` 记录；同 PDF 不同 MPN 才是不同 task |
| 实现 | `input_key = sha256(source_sha256 + requested_mpn)`；`tasks` 表 `UNIQUE(batch_id, input_key)`；ingest.jsonl 记录每次输入 |
| 检测 | `tasks` 与 `ingest` 计数；`task_id` 唯一性 |
| 测试 | N-21 |
| 失败后果 | 同一内容被重复解析，或两条输入共用同一个 `task_id` 但被当成两个任务 |

---

## 2. 负向测试（15 项必测 + 6 项回归 + N-12 子用例）

> 通用断言：任何失败都**不得**产生「看似成功」的 run（无 commit + receipt 一致即不成功）；
> 不得覆盖既有对象；必须写任务事件；错误必须可分类。

### N-01 PDF 上传后 SHA 校验失败

| 项 | 内容 |
|---|---|
| 注入 | 上传过程中篡改 1 字节，或声明哈希与实际不同 |
| 预期 | `INVALID_INPUT`；不创建 raw 对象；不调用 `parse_pdf`；事件记录 `sha_mismatch` |
| 自动重试 | 否 |
| 断言 | `raw/pdf/<sha>` 不存在；任务终态；无 manifest |
| 状态 | 设计 |

### N-02 相同 PDF 重复上传

| 项 | 内容 |
|---|---|
| 注入 | 同一字节流以两个 task 提交 |
| 预期 | 第一个创建 raw 对象；第二个识别为 `DUPLICATE`；若已有同 `reproducibility_key` 成功 run，则 `SKIPPED_DUPLICATE` 并记录 `canonical_run_id` |
| 自动重试 | 否 |
| 断言 | raw 对象数 = 1；ingest 记录 = 2；解析调用次数 = 1；重复率统计正确 |
| 状态 | 设计（`lake` 反例 1 提供底层哈希依据） |

### N-03 对象存储暂时不可用

| 项 | 内容 |
|---|---|
| 注入 | 把 `S3_ENDPOINT` 指向不可达地址，或注入 503 |
| 预期 | 指数退避重试；任务保持 `FAILED_RETRYABLE`；不产生半成品；超过最大次数 → `FAILED_PERMANENT` |
| 自动重试 | 是（3 次） |
| 断言 | 无 manifest；无部分上传的可见对象；事件含每次退避时间 |
| 状态 | 设计 |

### N-04 Worker 执行中断

| 项 | 内容 |
|---|---|
| 注入 | 解析中 `kill -9` Worker |
| 预期 | 租约到期 → `LEASE_EXPIRED` → 另一 Worker 领取；脏临时目录清理；已上传 blob 可复用 |
| 自动重试 | 是 |
| 断言 | 旧 run 无 manifest；新 attempt 产生新 `run_id`；无同 `run_id` 的两个 manifest |
| 状态 | 设计 |

### N-05 Worker 重启

| 项 | 内容 |
|---|---|
| 注入 | 处理到一半重启进程 |
| 预期 | 向协调器重新注册；`SUCCEEDED` 跳过；未完成任务按租约过期重派；不重复成功 |
| 自动重试 | 不适用 |
| 断言 | 每任务最多一个 `SUCCEEDED`；事件连续；总调用次数 = 任务数 + 重试数 |
| 状态 | 设计 |

### N-06 Parse 结果写入失败

| 项 | 内容 |
|---|---|
| 注入 | 上传 blob 时让第 3 个产物返回 500 |
| 预期 | 不写 manifest；任务 `FAILED_RETRYABLE`；已上传的前 2 个孤儿 blob 允许存在 |
| 自动重试 | 是 |
| 断言 | 无 manifest；无 `SUCCEEDED` 事件；重试成功后 manifest 完整 |
| 状态 | 设计 |

### N-07 Manifest 不完整

| 项 | 内容 |
|---|---|
| 注入 | 删除 `source_sha256` / `parser_fingerprint` / 一个 artifact 条目 |
| 预期 | Manifest 校验失败；Eval 拒绝消费；任务 `QUARANTINED` |
| 自动重试 | 否 |
| 断言 | 校验器报出缺失字段；`eval_results` 不新增 |
| 状态 | 设计（`lake` 反例 3 证明「缺 manifest 拒绝加载」） |

### N-08 Parser 版本发生变化

| 项 | 内容 |
|---|---|
| 注入 | 修改 `src/icpdf/parser/*.py` 一个字节后启动新批次 |
| 预期 | `parser_fingerprint` 变化；旧 run 不受影响；新批次 `plan.json` 记录新指纹；同批次内不允许混用 |
| 自动重试 | 否（批次级停止接单） |
| 断言 | 新旧指纹并存；旧 manifest 字节不变；批次事件记录 `FINGERPRINT_DRIFT` |
| 状态 | 设计 |

### N-09 配置指纹变化

| 项 | 内容 |
|---|---|
| 注入 | 修改 `configs/parser.yaml`（例如 `cell_gap_pt`） |
| 预期 | `config_hash` 变化；新批次新配置；旧结果不覆盖；若在批次中途变化 → 停止接单 |
| 自动重试 | 否 |
| 断言 | 两个 `config_hash` 的 run 并存；`reproducibility_key` 不同 |
| 状态 | 设计 |

### N-10 Parquet 文件损坏

| 项 | 内容 |
|---|---|
| 注入 | 翻转 Parquet 文件中段 1 字节 |
| 预期 | 查询失败（不是返回少行）；快照校验发现 SHA 不符；可从 `parse/blobs` 的 JSON 重新生成 |
| 自动重试 | 重建（新文件 + 新快照） |
| 断言 | 查询抛错；`snapshot_files` 与对象哈希不一致；重建后行数一致 |
| 状态 | 设计 |

### N-11 DuckDB 查询失败

| 项 | 内容 |
|---|---|
| 注入 | 查询不存在的快照 / 损坏文件 / 超时 |
| 预期 | 明确错误；不把部分结果当成功；客户端取消；查询日志记录失败 |
| 自动重试 | 只读重试 1 次 |
| 断言 | 无「成功」日志；无缓存写入；错误码非 0 |
| 状态 | 设计 |

### N-12 同一任务并发执行（v1.1 重写，R1）

v1.0 写「条件写/分片保证只有一个成功」不是证明。v1.1 拆成四个可执行用例，全部围绕协调器的 `lease_generation`：

#### N-12a 两个 Worker 同时申请同一 task

| 项 | 内容 |
|---|---|
| 注入 | 两个 Worker 同时调用 `/v1/lease` |
| 预期 | 协调器事务只发一个租约（generation=1）；另一个拿到其他任务或空 |
| 自动重试 | 否 |
| 断言 | `tasks.owner` 只有一个；两个 Worker 的 `lease_generation` 不重复；raw 对象数最终为 1 |
| 状态 | 设计 |

#### N-12b 旧 Worker 恢复后提交（generation 已过期）

| 项 | 内容 |
|---|---|
| 注入 | W1 租约过期；协调器把 generation 递增到 2 并派给 W2；W1 恢复后调用 `/v1/commit`（g=1） |
| 预期 | 409 `STALE_LEASE`；W1 不写任何 receipt；其已上传的 manifest 成为孤儿 |
| 自动重试 | 否（Worker 中止） |
| 断言 | `commits` 表只有 g=2 一行；receipt 只有一份；Eval/Catalog 不消费孤儿 manifest |
| 状态 | 设计 |

#### N-12c 协调器崩溃后重启

| 项 | 内容 |
|---|---|
| 注入 | 协调器在处理中途 `kill -9`，重启后加载 SQLite |
| 预期 | 过期租约按 §5.2.4 处理；已提交任务不重发；未提交任务 generation+1 重派；pending receipt 补写 |
| 自动重试 | 不适用 |
| 断言 | 每 task 最多一个 commit；无重复 receipt；事件连续 |
| 状态 | 设计 |

#### N-12d 协调器不可达超过 TTL

| 项 | 内容 |
|---|---|
| 注入 | 断开 Worker 与协调器网络 120 s |
| 预期 | Worker 心跳失败 → 停止任务；不产生成功；恢复后重新注册 |
| 自动重试 | 否（暂停） |
| 断言 | 无 manifest 被提交；无 receipt；任务回到可分配 |
| 状态 | 设计 |

#### N-12e 租约已到期、但过期扫描尚未执行（v1.2 新增，R1-1）

| 项 | 内容 |
|---|---|
| 注入 | `expires_at` 已过，协调器的 5 s 扫描尚未运行；W1 立即 HEARTBEAT 与 COMMIT |
| 预期 | 两者均返回 409 `LEASE_EXPIRED`；不续期、不提交；generation 仍为 g |
| 自动重试 | 否 |
| 断言 | `expires_at` 不再延长；无 commit；无 receipt；任务回到可分配 |
| 状态 | 设计 |

#### N-12f Receipt 写入/恢复的四种边界（v1.3 修订，R1-3）

共同断言：receipt 对象最终只有一份、字节与 commit 的期望字节一致；token 不重发；不允许重复 PUT 掩盖「已成功」。

##### N-12f1 SQLite COMMIT 后、PUT 前崩溃

| 项 | 内容 |
|---|---|
| 注入 | commit 事务提交后立即 `kill -9`，receipt 对象不存在 |
| 预期 | 重启 `pending` → GET 404 → PUT → 回读一致 → `written` |
| 断言 | 只有一条 commit；receipt 存在且字节一致；任务 `SUCCEEDED` |

##### N-12f2 PUT 成功、`receipt_state='written'` 未更新时崩溃

| 项 | 内容 |
|---|---|
| 注入 | PUT 返回 200 后、SQLite 更新前 `kill -9` |
| 预期 | 重启 `pending` → GET 200 且 `sha == receipt_sha256` → **只更新状态，不 PUT** |
| 断言 | PUT 调用计数不增加；receipt 字节不变；任务 `SUCCEEDED` |

##### N-12f3 PUT 超时但实际已成功

| 项 | 内容 |
|---|---|
| 注入 | 客户端收到超时，但服务端已写入 |
| 预期 | 不做盲目重试；GET 回读一致 → `written` |
| 断言 | PUT 总次数 = 1；无第二次写；任务 `SUCCEEDED` |

##### N-12f4 PUT 返回 412，已有同内容 receipt

| 项 | 内容 |
|---|---|
| 注入 | 先写入期望 receipt，再让协调器执行写入 |
| 预期 | 412 → GET 回读一致 → `written`，不覆盖 |
| 断言 | 原 receipt 字节哈希不变；无覆盖写；任务 `SUCCEEDED` |

#### N-12g Receipt 冲突的三种边界（v1.3 修订，R1-3）

共同断言：不覆盖、不猜测、不自动补 commit；原对象字节哈希与操作前一致；进入 `QUARANTINED`。

##### N-12g1 receipt 已存在但 token 不同

| 项 | 内容 |
|---|---|
| 注入 | 预置一个 token 不同的 receipt |
| 预期 | GET 200 → sha 不等 → `conflict`；**不 PUT** |
| 断言 | 原 receipt 字节不变；PUT 计数 0；任务 `QUARANTINED` |

##### N-12g2 receipt 已存在但 `manifest_sha256` 不同

| 项 | 内容 |
|---|---|
| 注入 | 预置一个 manifest_sha 不同的 receipt |
| 预期 | 同上 |
| 断言 | 原 receipt 字节不变；PUT 计数 0；任务 `QUARANTINED` |

##### N-12g3 receipt 存在但 commit 缺失

| 项 | 内容 |
|---|---|
| 注入 | 保留 receipt，删除协调器 commit 行（模拟 SQLite 丢失后的残留） |
| 预期 | `QUARANTINED`；不自动补 commit、不重写 receipt |
| 断言 | 不新增 commit；receipt 字节不变；告警 |

### N-13 任务重试产生重复结果

| 项 | 内容 |
|---|---|
| 注入 | 让同一任务前两次超时，第三次成功 |
| 预期 | 3 个 `run_id`、3 个 `attempt`、3 个 `lease_generation`；2 个 `TIMED_OUT`、1 个 `SUCCEEDED`；canonical 唯一 |
| 自动重试 | 是（按策略） |
| 断言 | `Q5` 计数正确；`v_canonical_runs` 每 `reproducibility_key` 只有 1 行；无覆盖 |
| 状态 | 设计 |

### N-14 Eval 引用不存在的 Parse 版本

| 项 | 内容 |
|---|---|
| 注入 | 构造 `eval.json` 指向一个没有 manifest 的 `run_id` |
| 预期 | 加载器抛 `ManifestMissing`；`verify_lineage` 退出码 1 |
| 自动重试 | 否 |
| 断言 | 加载失败；不写 Catalog；已有 eval 不受影响 |
| 状态 | **已执行**（`lake/_negative_tests.py` 反例 3 PASS） |

### N-15 Raw 对象被意外覆盖

| 项 | 内容 |
|---|---|
| 注入 | 用不同字节对已存在的 raw 键执行 `PUT`（不带条件头）或带条件头 |
| 预期 | 带 `If-None-Match: *` → 412/409；不带条件头 → 版本化产生新版本，旧版本保留；`verify_lineage` 对当前版本哈希失配 |
| 自动重试 | 否 |
| 断言 | 原始版本仍可读；当前键的哈希与键名不一致被检出；事件记录 `RAW_CONFLICT` |
| 状态 | 设计（`lake` 反例 1 已证明「改 1 bit 后目录不匹配」，但未覆盖对象存储版本语义） |

### N-16 仅 `table_params_sha256` 变化（v1.1 新增，R4）

| 项 | 内容 |
|---|---|
| 注入 | 两份输入相同、只改 `configs/parser.yaml` 的表格参数子集（例如 `cell_gap_pt`） |
| 预期 | `reproducibility_key` v2 必须变化；两个 run 不被 canonical 合并 |
| 自动重试 | 否 |
| 断言 | 两个 key 不同；`v_canonical_runs` 两行；旧 run 不被覆盖 |
| 状态 | 设计 |

### N-17 仅 `dependency_lock_sha256` 变化（v1.1 新增，R4）

| 项 | 内容 |
|---|---|
| 注入 | 同一代码与配置，但依赖锁文件变化（例如 PyMuPDF 小版本） |
| 预期 | `reproducibility_key` 必须变化 |
| 自动重试 | 否 |
| 断言 | 两个 key 不同；manifest 记录不同 lock 哈希 |
| 状态 | 设计 |

### N-18 仅 `effective_dpi` 变化（v1.1 新增，R4）

| 项 | 内容 |
|---|---|
| 注入 | 用 `--dpi 200` 覆盖配置的 150，其他不变 |
| 预期 | `reproducibility_key` 必须变化；旧 run 的 key 不变 |
| 自动重试 | 否 |
| 断言 | 两个 key 不同；`effective_dpi` 分别记录 |
| 状态 | 设计 |

### N-19 2 个 run 共享 1 个 Parquet 文件（v1.1 新增，R2）

| 项 | 内容 |
|---|---|
| 注入 | 同一批次内两个 run 都写入 `candidates`，生成 1 个 `part-00001.parquet`（`total_rows=2896`） |
| 预期 | Catalog 总行数 = 2896；不是 5792 |
| 自动重试 | 否 |
| 断言 | `SUM(part_manifest.total_rows) == SUM(rows_by_run) == SUM(parquet_contribution) == 2896`；Q8 返回 0 行 |
| 状态 | 设计（数字来自 `lake` 实测：2 runs × 1448 = 2896） |

### N-20 协调器状态丢失后重建（v1.1 新增，R1）

| 项 | 内容 |
|---|---|
| 注入 | 删除协调器 SQLite，只保留 receipt 与事件日志 |
| 预期 | 已提交集合可从 receipt 重建；无法判定的任务 `QUARANTINED`，不猜测、不重发 |
| 自动重试 | 否 |
| 断言 | 重建后的 commits 与 receipt 一致；无重复成功；隔离项有原因 |
| 状态 | 设计 |

### N-21 同批次同 PDF 重复输入（v1.2 新增，R5）

| 项 | 内容 |
|---|---|
| 注入 | 同一批次提交同一 PDF 两次：① 同 MPN；② 不同 MPN |
| 预期 | ① 生成 1 个 `task_id`、2 条 `ingest_id`、只解析一次；② 生成 2 个 `task_id`（`input_key` 不同），共享同一 raw 对象 |
| 自动重试 | 否 |
| 断言 | ① `tasks` 1 行、`ingest` 2 行；② `tasks` 2 行；两种情况下 `task_id` 都唯一且为批次内身份；raw 对象数 = 1 |
| 状态 | 设计 |

---

## 3. 测试方法与环境

| 测试组 | 环境 | 是否触碰真实数据 |
|---|---|---|
| N-01 / N-02 / N-06 / N-07 / N-12a–g / N-14 / N-19 / N-21 | 本地 MinIO + 临时桶 + 本地协调器 | 否 |
| N-03 / N-04 / N-05 / N-08 / N-09 / N-13 / N-20 | 本地 2 Worker + 协调器 + 故障注入 | 否 |
| N-10 / N-11 | 本地快照副本 | 否 |
| N-15 | MinIO（开启版本化） | 否 |
| N-16 / N-17 / N-18 | 本机纯函数测试（key 计算） | 否 |
| 现有 `lake/_negative_tests.py` | 本机 | 否（临时副本） |

**统一要求**：

1. 每个负向测试必须断言「失败的确实是失败」，而不是只看退出码；
2. 测试结束必须清理临时桶/目录，且不得触碰 `lake/raw_layer` 与真实 `runs/`；
3. 测试报告记录：用例、注入方式、期望、实际、命令、耗时、环境指纹；
4. 任一负向测试产生「静默成功」即视为不变量设计失败，必须回设计层修正，不得靠补日志掩盖。

---

## 4. 覆盖对照（任务书 15 项 → 本矩阵）

| 任务书要求 | 本文编号 |
|---|---|
| PDF 上传后 SHA 校验失败 | N-01 |
| 相同 PDF 重复上传 | N-02 |
| 对象存储暂时不可用 | N-03 |
| Worker 执行中断 | N-04 |
| Worker 重启 | N-05 |
| Parse 结果写入失败 | N-06 |
| Manifest 不完整 | N-07 |
| Parser 版本发生变化 | N-08 |
| 配置指纹变化 | N-09 |
| Parquet 文件损坏 | N-10 |
| DuckDB 查询失败 | N-11 |
| 同一任务并发执行 | N-12 |
| 任务重试产生重复结果 | N-13 |
| Eval 引用不存在的 Parse 版本 | N-14 |
| Raw 对象被意外覆盖 | N-15 |
| **v1.1 回归：`table_params` 变化 → key 变化** | N-16 |
| **v1.1 回归：依赖锁变化 → key 变化** | N-17 |
| **v1.1 回归：DPI 变化 → key 变化** | N-18 |
| **v1.1 回归：2 run 共享 1 文件只计一次** | N-19 |
| **v1.1 回归：协调器状态丢失后重建** | N-20 |
| **v1.2 回归：同 PDF 重复输入身份** | N-21 |

> N-12 的七个子用例（a–g）共同覆盖任务书「同一任务并发执行」，分别对应：并发申请、旧 Worker 复活、协调器崩溃、网络分区、租约过期但未扫描、COMMIT 后 receipt 崩溃、commit/receipt 不一致。
>
> 覆盖计数：任务书 15 项 → N-01…N-15；v1.1 追加 5 项 → N-16…N-20；v1.2 追加 1 项 → N-21；N-12 另有 a–g 七个子用例。
