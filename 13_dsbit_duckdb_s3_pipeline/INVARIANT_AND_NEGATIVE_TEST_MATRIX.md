# 不变量与负向测试矩阵

本文件定义 10 条数据不变量与 15 项负向测试。**除特别标注「已执行」的三项外，全部为 `PROPOSED` 测试设计，本轮未执行。**

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

---

## 2. 十五项负向测试

> 通用断言：任何失败都**不得**产生「看似成功」的 run（无 manifest 即不成功）；
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
| 预期 | 重扫分片；`SUCCEEDED` 跳过；未完成重新领取；不重复成功 |
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

### N-12 同一任务并发执行

| 项 | 内容 |
|---|---|
| 注入 | 两个 Worker 同时处理同一 `task_id`（模拟分片重叠） |
| 预期 | 条件写/分片保证只有一个成功；另一个 `SKIPPED_DUPLICATE` 或失败退出；raw 只一个对象 |
| 自动重试 | 否 |
| 断言 | 两 Worker 的 run_id 不同；只有一个 canonical；raw 对象数 1 |
| 状态 | 设计 |

### N-13 任务重试产生重复结果

| 项 | 内容 |
|---|---|
| 注入 | 让同一任务前两次超时，第三次成功 |
| 预期 | 3 个 `run_id`、3 个 `attempt`；2 个 `TIMED_OUT`、1 个 `SUCCEEDED`；canonical 唯一 |
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

---

## 3. 测试方法与环境

| 测试组 | 环境 | 是否触碰真实数据 |
|---|---|---|
| N-01 / N-02 / N-06 / N-07 / N-12 / N-14 | 本地 MinIO + 临时桶 | 否 |
| N-03 / N-04 / N-05 / N-08 / N-09 / N-13 | 本地 2 Worker + 故障注入 | 否 |
| N-10 / N-11 | 本地快照副本 | 否 |
| N-15 | MinIO（开启版本化） | 否 |
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
