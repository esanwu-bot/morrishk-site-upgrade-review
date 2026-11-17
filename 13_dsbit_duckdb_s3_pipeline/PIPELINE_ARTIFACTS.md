# 流水线构件：对象布局、Manifest、Parquet、DuckDB、状态机与重试

本文件是主文档的附件，所有示例均为 `PROPOSED` 构造样例，**不是**真实运行产物。
唯一可复核的真实产物是 `lake/` 中的 V101 单件 Demo（见主文档 §2.7）。

---

## 1. 对象存储目录布局

```
s3://<bucket>/dsbit-lake/v1/
├─ raw/
│  ├─ pdf/<aa>/<sha256>.pdf                     # 原始 PDF，内容寻址
│  └─ meta/<aa>/<sha256>.json                   # RAW.json
├─ parse/
│  ├─ runs/<run_id>/manifest.json               # 提交点
│  ├─ runs/<run_id>/config_snapshot.json
│  ├─ runs/<run_id>/attempt.json                # 任务/尝试元数据
│  ├─ blobs/<aa>/<sha256>/<artifact_name>       # 9 个 JSON 产物，内容寻址
│  └─ tables/
│     ├─ table=candidates/batch=<batch_id>/part-00001.parquet
│     ├─ table=documents/batch=<batch_id>/part-00001.parquet
│     └─ table=tables/batch=<batch_id>/part-00001.parquet
├─ eval/
│  ├─ gold/<gold_version>/GOLD_MANIFEST.json
│  ├─ gold/<gold_version>/<gold_files>.csv
│  ├─ results/<eval_id>.json
│  ├─ attribution/<eval_id>.csv
│  ├─ reviews/<batch_id>/reviews.jsonl          # 追加
│  └─ tables/table=metrics/batch=<batch_id>/part-00001.parquet
├─ control/
│  ├─ batches/<batch_id>/tasks.jsonl            # 不可变批次清单
│  ├─ batches/<batch_id>/plan.json              # 批次元数据（样本、分片数、指纹）
│  ├─ events/<batch_id>/<shard>-<worker_id>.jsonl
│  ├─ tasks/<task_id>/final.json                # 仅终态
│  ├─ deadletter/<batch_id>/<task_id>.json
│  └─ tombstones/<kind>/<key>/<ts>.json
├─ catalog/
│  └─ snapshots/<snapshot_id>/
│     ├─ catalog.duckdb
│     └─ manifest.json
└─ logs/
   ├─ worker/<date>/<worker_id>.jsonl
   └─ query/<date>.jsonl
```

### 1.1 命名规则

| 名称 | 规则 | 示例 |
|---|---|---|
| 前缀目录 `<aa>` | `sha256` 前 2 位十六进制 | `05/059d448c…` |
| `run_id` | `<doc8>-<UTC>-a<attempt>-<rand4>` | `doc-059d448c-20261117T021103Z-a1-7f3c` |
| `batch_id` | `<plan>-<UTC>` | `B1-20261117T020000Z` |
| `eval_id` | `<run_id>__<gold_version>__<evalfp8>` | `doc-059d…-a1-7f3c__gold_v1.0.0__a1b2c3d4` |
| `snapshot_id` | `snap-<UTC>-<rand8>` | `snap-20261117T021500Z-9f3c1a2b` |
| `task_id` | `<batch_id>:<sha256 前 16 位>` | `B1-20261117T020000Z:059d448c5a34a4b1` |

### 1.2 单件对象数量预算

| 类别 | 每份文档对象数 | 568,830 份总量 |
|---|---|---|
| Raw PDF + RAW.json | 2 | 1,137,660 |
| 9 个 JSON blob | 9（内容相同可复用） | ≤ 5,120,000 |
| Manifest + 配置 + attempt | 3 | 1,706,490 |
| Parquet（按 1000 份/文件/表） | 3 ÷ 1000 | ≈ 1,707 |
| 合计 | ≈ 14（不含 Parquet） | **≈ 800 万对象** |

> 这是选择「按批次打包 Parquet」而不是「每 run 一个 Parquet」的直接原因：后者会额外增加 568,830 个对象。
> 800 万对象对一个桶是可管理的，但 list/生命周期规则必须按前缀设计，不能全桶扫描。

---

## 2. Manifest v2 示例

`parse/runs/<run_id>/manifest.json`：

```json
{
  "schema": "lakehouse/run-manifest/v2",
  "run_id": "doc-059d448c-20261117T021103Z-a1-7f3c",
  "task_id": "B1-20261117T020000Z:059d448c5a34a4b1",
  "attempt": 1,
  "batch_id": "B1-20261117T020000Z",
  "created_at": "2026-11-17T02:11:03Z",
  "status": "complete",

  "identity": {
    "worker_id": "worker-02",
    "run_id_role": "唯一执行身份；同条件重复执行必须产生新 run_id 且全部保留"
  },

  "reproducibility": {
    "reproducibility_key": "8a88bf9479cfcd2f6e344e19cfa46ee0ad48a8659ba17f8dfff2733d83c07194",
    "role": "可复现条件 = sha256(source_sha256|parser_fingerprint|config_hash)",
    "source_sha256": "059d448c5a34a4b1f45f02038f5076b82633f372372a15c395940803dc7f3a2b",
    "parser_fingerprint": "7e70c1f801004c54667b062934efdce28fb5624f461da9bd1625d62872132dca",
    "config_hash": "ab9f12527767c7dffe670f4b49e516202f224902af996a73eb155aaa420d3d5c",
    "table_params_sha256": "82d4df4d1cb3cac9741831b0db36e19fa80c1829abc18b3f8b1ab4ee1c6b9f0a",
    "dependency_lock_sha256": "5c1f...",
    "python_version": "3.13.15",
    "platform": "Linux-6.8.0-x86_64",
    "icpdf_version": "0.1.0",
    "parser_version": "0.1.0-phase1",
    "contract_version": "data-contract/v0.2"
  },

  "parser_fingerprint_scope": {
    "algorithm": "sha256 over sorted '<relpath>:<file_sha256>' lines, LF",
    "file_count": 34,
    "files": [
      {"path": "src/icpdf/parser/pipeline.py", "sha256": "86c0054969572c17f8bc19d5bd14f332053a5926c0a2300777c79ac6ab1b2fa5"},
      {"path": "src/icpdf/parser/table_detector.py", "sha256": "..."}
    ]
  },

  "source": {
    "bucket": "<bucket>",
    "key": "dsbit-lake/v1/raw/pdf/05/059d448c5a34a4b1f45f02038f5076b82633f372372a15c395940803dc7f3a2b.pdf",
    "bytes": 1224626,
    "version_id": "3HL4kqtJlcpXroDTDmJ+rmSpXd3dIbrHY+MTRCxf3vjVBH40Nr8X8gdRQBpUMLUo",
    "etag": "\"5f2c1e...\""
  },

  "config_snapshot": "config_snapshot.json",
  "dependency_lock": "deps/dependency_lock.txt",

  "artifacts": [
    {"name": "document.json", "sha256": "…", "bytes": 1481,
     "object_key": "parse/blobs/1a/…/document.json"},
    {"name": "tables.json", "sha256": "…", "bytes": 973956,
     "object_key": "parse/blobs/9c/…/tables.json"},
    {"name": "candidates.json", "sha256": "…", "bytes": 1022972,
     "object_key": "parse/blobs/44/…/candidates.json"},
    {"name": "boundary_decisions.json", "sha256": "…", "bytes": 229422,
     "object_key": "parse/blobs/6f/…/boundary_decisions.json"},
    {"name": "text_blocks.json", "sha256": "…", "bytes": 2413613,
     "object_key": "parse/blobs/7d/…/text_blocks.json"},
    {"name": "product.json", "sha256": "…", "bytes": 278,
     "object_key": "parse/blobs/2e/…/product.json"},
    {"name": "run_config.json", "sha256": "…", "bytes": 2568,
     "object_key": "parse/blobs/b1/…/run_config.json"},
    {"name": "pages/geometry.json", "sha256": "…", "bytes": 4096,
     "object_key": "parse/blobs/c3/…/geometry.json"}
  ],

  "parquet": {
    "table": "candidates",
    "batch_id": "B1-20261117T020000Z",
    "files": [
      {"key": "parse/tables/table=candidates/batch=B1-20261117T020000Z/part-00001.parquet",
       "sha256": "…", "bytes": 512000000, "rows": 1448000}
    ],
    "row_count": 1448
  },

  "counts": {
    "page_count": 21,
    "table_count": 14,
    "candidate_count": 1448
  },

  "timings": {
    "load_seconds": 0.41,
    "parse_seconds": 16.8,
    "write_seconds": 1.2,
    "upload_seconds": 2.4,
    "total_seconds": 20.8
  },

  "warnings": []
}
```

**校验规则（Manifest 不完整即拒绝）**：

1. 必填：`schema`、`run_id`、`reproducibility.reproducibility_key`、`source_sha256`、`parser_fingerprint`、`config_hash`、`source.key`、`source.bytes`、`artifacts`、`counts.page_count`。
2. `status` 必须为 `complete` 才可被 Eval 消费；`partial` 只用于诊断。
3. `artifacts` 中每一项 `object_key` 必须能被 HEAD 到，且字节数一致。
4. `source_sha256` 必须等于 `source.key` 的文件名（去掉 `.pdf`）。
5. `reproducibility_key` 必须能由三个字段重算得到。
6. Manifest 自身的 SHA-256 记录在 `attempt.json` 与任务事件中；上传后用 GET 回读校验。

---

## 3. Parquet 分区与文件

### 3.1 目录与命名

```
parse/tables/table=candidates/batch=B1-20261117T020000Z/part-00001.parquet
parse/tables/table=documents/batch=B1-20261117T020000Z/part-00001.parquet
parse/tables/table=tables/batch=B1-20261117T020000Z/part-00001.parquet
```

- 只按 `batch` 一级分区；**不加** `year=/month=/day=`，避免文件过小。
- 每张表每批目标 1–4 个文件；单文件 128–512 MB。
- 文件序号单调递增；合并不覆盖旧文件（见 §3.4）。

### 3.2 Schema

**candidates**

| 列 | 类型 | 可空 | 说明 |
|---|---|---|---|
| `run_id` | VARCHAR | 否 | 外键 |
| `task_id` | VARCHAR | 否 | 任务 |
| `attempt` | INTEGER | 否 | 尝试序号 |
| `batch_id` | VARCHAR | 否 | 批次 |
| `source_sha256` | VARCHAR | 否 | 原始字节 |
| `candidate_id` | VARCHAR | 否 | 既有 ID |
| `document_id` | VARCHAR | 否 | 既有 ID |
| `table_id` | VARCHAR | 否 | 既有 ID |
| `row_id` | VARCHAR | 否 | 既有 ID |
| `cell_id` | VARCHAR | 否 | 既有 ID |
| `page_number` | INTEGER | 否 | 页 |
| `bbox_x0/y0/x1/y1` | DOUBLE | 否 | 坐标（PDF 点） |
| `raw_text` | VARCHAR | 是 | 原文 |
| `normalized_value` | VARCHAR | 是 | 归一值 |
| `unit` | VARCHAR | 是 | 单位 |
| `column_role` | VARCHAR | 否 | 角色 |
| `role_source` | VARCHAR | 否 | 来源 |
| `candidate_type` | VARCHAR | 否 | 类型 |
| `extraction_method` | VARCHAR | 否 | 方法 |
| `source_text_type` | VARCHAR | 否 | 文本来源 |
| `reconstruction_status` | VARCHAR | 否 | 重建状态 |

**documents**

`run_id, task_id, attempt, batch_id, source_sha256, document_id, page_count, table_count, candidate_count, parser_fingerprint, config_hash, created_at`

**tables**

`run_id, task_id, attempt, batch_id, source_sha256, document_id, table_id, page_number, page_end, row_count, column_count, header_rows, table_type, visual_boundary_status, reconstruction_status`

> 列定义与现有 `domain` 字段保持一致；新增的只有 `task_id` / `attempt` / `batch_id`。

### 3.3 写入参数

```python
pq.write_table(
    table,
    path,
    compression="zstd",
    row_group_size=128 * 1024 * 1024 // 64,   # 约 128 MB 行组，按实际行宽调整
    use_dictionary=["column_role", "role_source", "candidate_type",
                    "extraction_method", "source_text_type", "reconstruction_status"],
    write_statistics=True,
)
```

### 3.4 合并（compaction）

触发条件（批次结束后检查）：

- 分区内文件数 > 4；或
- 平均文件 < 64 MB。

动作：

1. 读取该分区全部行；
2. 写 `part-<新序号>.parquet`（新键，不覆盖）；
3. 新快照 manifest 只引用新文件；
4. 旧文件保留，写墓碑说明「已被快照 X 取代」，不删除。

**不跨批次合并**：批次是审计边界。

### 3.5 行数对账

每次写入与合并后记录：

```json
{"part": "part-00001.parquet", "rows": 1448000, "sha256": "...", "bytes": 512000000}
```

Catalog 构建时 SUM(rows) 必须等于 manifest 中 `row_count` 之和；不一致即中止发布。

---

## 4. RAW.json 与 attempt.json

### 4.1 RAW.json

见主文档 §4.6。

### 4.2 attempt.json

`parse/runs/<run_id>/attempt.json`：

```json
{
  "schema": "lakehouse/attempt/v1",
  "task_id": "B1-20261117T020000Z:059d448c5a34a4b1",
  "run_id": "doc-059d448c-20261117T021103Z-a1-7f3c",
  "attempt": 1,
  "worker_id": "worker-02",
  "started_at": "2026-11-17T02:10:42Z",
  "finished_at": "2026-11-17T02:11:03Z",
  "exit": {"code": 0, "signal": null, "timed_out": false},
  "stages": [
    {"name": "raw_head", "ok": true, "ms": 31},
    {"name": "parse_pdf", "ok": true, "ms": 16800},
    {"name": "upload_blobs", "ok": true, "ms": 2400},
    {"name": "manifest", "ok": true, "ms": 12}
  ],
  "manifest_sha256": "…",
  "log_key": "logs/worker/2026-11-17/worker-02.jsonl"
}
```

---

## 5. DuckDB 查询示例

所有查询必须绑定 `snapshot_id`；以下用 `:snapshot` 表示快照目录。

```sql
-- 打开快照（只读）
-- duckdb.connect('<snapshot>/catalog.duckdb', read_only=True)
```

### Q1 跨三层血缘（给定 run_id）

```sql
SELECT  e.run_id,
        e.source_sha256,
        p.parser_fingerprint,
        p.config_hash,
        p.dependency_lock_sha256,
        r.object_key        AS raw_key,
        r.bytes             AS raw_bytes,
        r.version_id        AS raw_version,
        e.gold_version,
        e.evaluator_fingerprint,
        e.semantic_hit_rate
FROM    eval_results e
JOIN    parse_runs   p USING (run_id)
JOIN    raw_docs     r ON r.source_sha256 = p.source_sha256
WHERE   e.run_id = ?;
```

### Q2 同一可复现条件下的多次执行

```sql
SELECT  reproducibility_key,
        count(*)               AS runs,
        count(DISTINCT run_id) AS distinct_runs,
        min(created_at)        AS first_run,
        max(created_at)        AS last_run,
        sum(CASE WHEN attempt = 1 THEN 1 ELSE 0 END) AS first_attempts
FROM    parse_runs
GROUP BY reproducibility_key
HAVING  count(*) > 1
ORDER BY runs DESC;
```

### Q3 按批次与列角色聚合

```sql
SELECT  batch_id,
        column_role,
        count(*)                                      AS candidates,
        count(DISTINCT run_id)                        AS runs,
        count(DISTINCT table_id)                      AS tables,
        sum(CASE WHEN normalized_value IS NOT NULL THEN 1 ELSE 0 END) AS numeric
FROM    candidates
GROUP BY batch_id, column_role
ORDER BY batch_id, candidates DESC;
```

### Q4 证据完整性

```sql
SELECT  batch_id,
        count(*)                                              AS total,
        sum(CASE WHEN page_number IS NULL OR bbox_x1 IS NULL
                 THEN 1 ELSE 0 END)                           AS missing_evidence,
        round(1.0 - avg(CASE WHEN page_number IS NULL OR bbox_x1 IS NULL
                             THEN 1.0 ELSE 0.0 END), 6)        AS completeness
FROM    candidates
GROUP BY batch_id;
```

### Q5 失败与重试

```sql
SELECT  batch_id,
        attempt,
        count(*)                        AS runs,
        sum(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS complete,
        sum(CASE WHEN status = 'partial'  THEN 1 ELSE 0 END) AS partial
FROM    parse_runs
GROUP BY batch_id, attempt
ORDER BY batch_id, attempt;
```

### Q6 快照自校验

```sql
SELECT  count(*)                    AS files,
        sum(rows)                   AS declared_rows,
        sum(bytes)                  AS declared_bytes
FROM    snapshot_files;
```

`snapshot_files` 由 Catalog 构建器从快照 manifest 生成，与 `catalog.duckdb` 同一快照；查询前先比对该表与对象 HEAD 结果。

### Q7 重复输入比例

```sql
SELECT  count(*)                                AS raw_objects,
        count(DISTINCT source_sha256)           AS distinct_sha,
        count(*) - count(DISTINCT source_sha256) AS duplicates
FROM    raw_docs;
```

---

## 6. Worker 状态机

### 6.1 状态

| 状态 | 含义 | 终态 |
|---|---|---|
| `PENDING` | 在批次清单中，未被领取 | 否 |
| `CLAIMED` | 已取得租约 | 否 |
| `RUNNING` | 子进程执行中 | 否 |
| `SUCCEEDED` | manifest 已发布且校验通过 | 是 |
| `SKIPPED_DUPLICATE` | 同 `reproducibility_key` 已有成功结果 | 是 |
| `INVALID_INPUT` | PDF 非法/加密/0 页/无文本层 | 是 |
| `FAILED_RETRYABLE` | 可重试失败，等待退避 | 否 |
| `TIMED_OUT` | 超时被杀 | 否（可转重试或永久） |
| `LEASE_EXPIRED` | 租约到期，任务可被重新领取 | 否 |
| `FAILED_PERMANENT` | 不可重试失败或超过最大次数 | 是 |
| `QUARANTINED` | 证据/血缘/对象冲突，需人工 | 是 |
| `TOMBSTONED` | 批次失效或人工撤销 | 是 |

### 6.2 转换表

| 从 | 事件 | 到 | 条件 |
|---|---|---|---|
| PENDING | `claim` | CLAIMED | 分片匹配或条件写成功 |
| CLAIMED | `start` | RUNNING | 本地工作区就绪 |
| RUNNING | `manifest_ok` | SUCCEEDED | Manifest 校验 + 上传回读通过 |
| RUNNING | `duplicate_found` | SKIPPED_DUPLICATE | 查到同 repro key 的成功 run |
| RUNNING | `invalid_input` | INVALID_INPUT | 魔数/加密/页数/文本层 |
| RUNNING | `retryable_error` | FAILED_RETRYABLE | 网络/存储/资源 |
| RUNNING | `timeout` | TIMED_OUT | 超过阈值并杀进程 |
| TIMED_OUT | `schedule_retry` | FAILED_RETRYABLE | attempt < max |
| TIMED_OUT | `give_up` | FAILED_PERMANENT | attempt ≥ max |
| FAILED_RETRYABLE | `backoff_elapsed` | PENDING | 退避到期 |
| CLAIMED/RUNNING | `lease_expired` | LEASE_EXPIRED | 租约超时（Worker 崩溃） |
| LEASE_EXPIRED | `reclaim` | CLAIMED | 另一 Worker 领取 |
| RUNNING | `evidence_conflict` | QUARANTINED | 哈希不符/对象冲突/血缘失败 |
| any | `tombstone` | TOMBSTONED | 批次撤销（需审计） |

### 6.3 事件格式

```json
{
  "event_id": "ev-01J9Z3K7Q8V6N5M4L3K2J1H0G9",
  "task_id": "B1-20261117T020000Z:059d448c5a34a4b1",
  "attempt": 1,
  "from": "PENDING",
  "to": "CLAIMED",
  "at": "2026-11-17T02:10:40Z",
  "worker_id": "worker-02",
  "run_id": null,
  "error_class": null,
  "evidence": {"claim_mode": "shard"}
}
```

- `event_id` 为 ULID/时间有序 ID，保证同一分片日志内可排序；
- 事件只追加，不修改；
- 状态折叠规则：同一 `task_id` 取 `(at, event_seq)` 最大者。

---

## 7. 失败重试策略

### 7.1 错误分类

| `error_class` | 可重试 | 退避 | 最大 attempt | 备注 |
|---|---|---|---|---|
| `OBJECT_STORE_5XX` | 是 | 60/300/900 s + 抖动 | 3 | 不写半成品 |
| `NETWORK_TIMEOUT` | 是 | 同上 | 3 | 区分连接/读取 |
| `WORKER_CRASH` | 是 | 立即 | 3 | 租约过期触发 |
| `PARSE_TIMEOUT` | 是 | 300 s | 2 | 大件阈值见 OD-05 |
| `DISK_FULL` | 是 | 300 s | 2 | 清理后可重试 |
| `PDF_INVALID` | 否 | — | 1 | 魔数/加密/0 页 |
| `NO_TEXT_LAYER` | 否 | — | 1 | 本轮不做 OCR |
| `PARSER_EXCEPTION` | 否 | — | 1 | 代码错误，需修代码 |
| `CONFIG_INVALID` | 否 | — | 1 | 批次停止 |
| `FINGERPRINT_DRIFT` | 否 | — | 1 | 批次停止并告警 |
| `EVIDENCE_CONFLICT` | 否 | — | 1 | 隔离，人工 |
| `MANIFEST_INVALID` | 否 | — | 1 | 隔离，人工 |

### 7.2 去重与 canonical

- 每次 attempt 独立 `run_id`；
- `parse_runs` 增加 `attempt` 与 `canonical_of`（可空）；
- 视图 `v_canonical_runs`：同一 `reproducibility_key` 下，取 `status='complete'` 且 `created_at` 最小的一条为 canonical；
- 统计与发布默认只读 canonical；历史 attempt 保留可查；
- **禁止**用新结果覆盖 canonical 记录；需要替换时写墓碑并产生新 canonical。

### 7.3 死信

```
control/deadletter/<batch_id>/<task_id>.json
```

内容：任务、每次 attempt 的 `run_id`、错误类、最后 200 行日志键、证据键、建议处置。
死信不自动重试；人工处理后以新批次重跑。

---

## 8. 批次清单示例

`control/batches/<batch_id>/tasks.jsonl`（一行一个任务，不可变）：

```json
{"task_id":"B1-20261117T020000Z:059d448c5a34a4b1","batch_id":"B1-20261117T020000Z","document_sha256":"059d448c5a34a4b1f45f02038f5076b82633f372372a15c395940803dc7f3a2b","source_uri":"https://.../LM358.pdf","priority":42,"shard":1,"created_at":"2026-11-17T02:00:00Z"}
{"task_id":"B1-20261117T020000Z:9ef667389897f02d","batch_id":"B1-20261117T020000Z","document_sha256":"9ef667389897f02dae8d94e8c3daecbe8cbd2ab45f4d62e1db1c474544180075","source_uri":"https://.../ADS1299.pdf","priority":38,"shard":0,"created_at":"2026-11-17T02:00:00Z"}
```

`plan.json`：

```json
{
  "schema": "lakehouse/batch-plan/v1",
  "batch_id": "B1-20261117T020000Z",
  "created_at": "2026-11-17T02:00:00Z",
  "sample": {"source": "document_asset", "filter": "FetchStatus=1 AND HasTextLayer=1",
             "requested": 1000, "actual": 1000},
  "shard_count": 2,
  "pinned": {
    "parser_fingerprint": "…",
    "config_hash": "…",
    "dependency_lock_sha256": "…"
  },
  "limits": {"max_attempts": 3, "timeout_base_s": 180, "timeout_per_page_s": 6},
  "owner": "乙方",
  "status": "open"
}
```

> `pinned` 是批次级冻结：Worker 启动时比对，不一致即拒绝接单。
