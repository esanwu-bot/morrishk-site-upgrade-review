# 流水线构件：对象布局、两级 Manifest、Parquet、DuckDB、状态机与协调器

本文件是主文档的附件，所有示例均为 `PROPOSED` 构造样例，**不是**真实运行产物。
唯一可复核的真实产物是 `lake/` 中的 V101 单件 Demo（见主文档 §2.7）。

v1.1 变更：任务身份改为完整 SHA-256（R5）；Run Manifest 与 Batch/Partition Manifest 分离（R2）；
`reproducibility_key` v2（R4）；新增协调器协议（R1）；新增真实存储一致性测试引用（R6）。

---

## 1. 对象存储目录布局

```
s3://<bucket>/dsbit-lake/v1/
├─ raw/
│  ├─ pdf/<aa>/<sha256>.pdf                     # 原始 PDF，内容寻址
│  └─ meta/<aa>/<sha256>.json                   # RAW.json
├─ parse/
│  ├─ runs/<run_id>/manifest.json               # Run Manifest（单 run）
│  ├─ runs/<run_id>/config_snapshot.json
│  ├─ runs/<run_id>/attempt.json                # 任务/尝试/租约/fencing 元数据
│  ├─ blobs/<aa>/<sha256>/<artifact_name>       # 9 个 JSON 产物，内容寻址
│  └─ tables/
│     ├─ table=candidates/batch=<batch_id>/part-00001.parquet
│     ├─ table=candidates/batch=<batch_id>/part_manifest.json
│     ├─ table=documents/batch=<batch_id>/part-00001.parquet
│     ├─ table=documents/batch=<batch_id>/part_manifest.json
│     ├─ table=tables/batch=<batch_id>/part-00001.parquet
│     └─ table=tables/batch=<batch_id>/part_manifest.json
├─ eval/
│  ├─ gold/<gold_version>/GOLD_MANIFEST.json
│  ├─ gold/<gold_version>/<gold_files>.csv
│  ├─ results/<eval_id>.json
│  ├─ attribution/<eval_id>.csv
│  ├─ reviews/<batch_id>/reviews.jsonl          # 追加
│  └─ tables/table=metrics/batch=<batch_id>/{part-00001.parquet, part_manifest.json}
├─ control/
│  ├─ ingest/<batch_id>/ingest.jsonl            # 每次输入一条，不可变
│  ├─ batches/<batch_id>/tasks.jsonl            # 去重后的任务清单
│  ├─ batches/<batch_id>/plan.json              # OPEN：批次元数据
│  ├─ batches/<batch_id>/close.json             # CLOSING：未完成清单
│  ├─ batches/<batch_id>/closed.json            # CLOSED：终态标记
│  ├─ coordinator/<batch_id>/state-<seq>.json   # 协调器检查点（单写）
│  ├─ events/<batch_id>/<worker_id>.jsonl       # Worker 事件（追加，定期上传）
│  ├─ events/<batch_id>/coordinator/<event_id>.json  # 协调器事件（一事件一对象）
│  ├─ tasks/<task_id>/final.json                # 终态（协调器确认）
│  ├─ tasks/<task_id>/committed.json            # receipt（协调器写；generation + token）
│  ├─ deadletter/<batch_id>/<task_id>.json
│  └─ tombstones/<kind>/<key>/<ts>.json
├─ catalog/
│  └─ snapshots/<snapshot_id>/
│     ├─ catalog.duckdb
│     └─ manifest.json
└─ logs/
   ├─ worker/<date>/<worker_id>.jsonl
   ├─ coordinator/<date>.jsonl
   └─ query/<date>.jsonl
```

### 1.1 命名规则

| 名称 | 规则 | 示例 |
|---|---|---|
| 前缀目录 `<aa>` | `sha256` 前 2 位十六进制 | `05/059d448c…` |
| `run_id` | `<doc8>-<UTC>-a<attempt>-g<generation>-<rand4>` | `doc-059d448c-20261117T021103Z-a1-g1-7f3c` |
| `batch_id` | `<plan>-<UTC>` | `B1-20261117T020000Z` |
| `eval_id` | `<run_id>__<gold_version>__<evalfp8>` | `doc-059d…-g1-7f3c__gold_v1.0.0__a1b2c3d4` |
| `snapshot_id` | `snap-<UTC>-<rand8>` | `snap-20261117T021500Z-9f3c1a2b` |
| `input_key` | `sha256(canonical_json(source_sha256, requested_mpn))`（完整 64 位） | `3f9c…` |
| `task_id` | `<batch_id>:<input_key>`；**批次内唯一** | `B1-20261117T020000Z:3f9c…` |
| `ingest_id` | `<batch_id>:<sha256>:<seq>`；同 sha 的输入序号 | `B1-…:059d448c…:2` |

**R5 说明**：v1.0 的 `task_id` 用 SHA 前 16 位；v1.1 改为完整 SHA；v1.2 进一步把 `requested_mpn` 纳入 `input_key`，并明确 `task_id` 是**批次内**身份。
同一 PDF 同 MPN 的重复输入只生成一个 task，多条 ingest 记录；同 PDF 不同 MPN 生成不同 task（`product.json` 不同），共享同一 raw 对象。

### 1.2 单件对象数量预算

| 类别 | 每份文档对象数 | 568,830 份总量 |
|---|---|---|
| Raw PDF + RAW.json | 2 | 1,137,660 |
| 9 个 JSON blob | 9（内容相同可复用） | ≤ 5,120,000 |
| Run Manifest + 配置 + attempt | 3 | 1,706,490 |
| 任务终态 / receipt | 2 | ≤ 1,137,660 |
| ingest 记录 | 1 / 1000（按批合并 JSONL） | ≈ 569 |
| Parquet（按 1000 份/文件/表） | 3 ÷ 1000 | ≈ 1,707 |
| part_manifest | 3 ÷ 1000 | ≈ 1,707 |
| 合计 | ≈ 16（不含批次级对象） | **≈ 910 万对象** |

> 对象数比 v1.0 多约 100 万，主要来自每个任务两份小状态文件。若担心 list/请求成本，可把 `final.json` / `committed.json` 合并为每 Worker 一个追加日志；该选择列入 OD-15。

---

## 2. 两级 Manifest

### 2.1 Run Manifest（单 run）

`parse/runs/<run_id>/manifest.json`：

```json
{
  "schema": "lakehouse/run-manifest/v2",
  "run_id": "doc-059d448c-20261117T021103Z-a1-g1-7f3c",
  "task_id": "B1-20261117T020000Z:3f9c…",
  "attempt": 1,
  "batch_id": "B1-20261117T020000Z",
  "created_at": "2026-11-17T02:11:03Z",
  "status": "complete",

  "identity": {
    "worker_id": "worker-02",
    "input_key": "3f9c…",
    "ingest_ids": ["B1-20261117T020000Z:059d448c…:1"],
    "lease_generation": 1,
    "commit_receipt_key": "control/tasks/B1-20261117T020000Z:3f9c…/committed.json",
    "run_id_role": "唯一执行身份；同条件重复执行必须产生新 run_id 且全部保留",
    "token_note": "commit_token 不在 Manifest 中；只存在于协调器 commits 表与 receipt（R1-2）"
  },

  "reproducibility": {
    "reproducibility_key_version": 2,
    "reproducibility_key": "b7d1c0e5…",
    "role": "v2 = sha256(canonical_json(source, requested_mpn, parser_fp, config, table_params, deps, dpi, python, platform_family))",
    "source_sha256": "059d448c5a34a4b1f45f02038f5076b82633f372372a15c395940803dc7f3a2b",
    "requested_mpn": "LM358",
    "parser_fingerprint": "7e70c1f801004c54667b062934efdce28fb5624f461da9bd1625d62872132dca",
    "config_hash": "ab9f12527767c7dffe670f4b49e516202f224902af996a73eb155aaa420d3d5c",
    "table_params_sha256": "82d4df4d1cb3cac9741831b0db36e19fa80c1829abc18b3f8b1ab4ee1c6b9f0a",
    "dependency_lock_sha256": "5c1f...",
    "effective_dpi": 150,
    "python_version": "3.13.15",
    "platform_family": "linux",
    "audit": {"platform": "Linux-6.8.0-x86_64", "hostname": "worker-02"}
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

  "parquet_contribution": {
    "table": "candidates",
    "batch_id": "B1-20261117T020000Z",
    "rows": 1448,
    "part_manifest": {
      "key": "parse/tables/table=candidates/batch=B1-20261117T020000Z/part_manifest.json",
      "sha256": "…"
    }
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

**关键点（R2）**：

- `counts.candidate_count` 与 `parquet_contribution.rows` 都是**单 run** 的 1448；
- Run Manifest **不记录**批次 Parquet 文件的总行数；
- 批次总行数只在 `part_manifest.json` 中维护；
- `lease_generation` 与协调器 commit 记录 + receipt 共同证明该 run 是协调器确认的成功者；Manifest 本身不含 token。

**校验规则（不完整即拒绝）**：

1. 必填：`schema`、`run_id`、`task_id`、`attempt`、`lease_generation`、`reproducibility.reproducibility_key`、`reproducibility_key_version`、`source_sha256`、`parser_fingerprint`、`config_hash`、`table_params_sha256`、`dependency_lock_sha256`、`effective_dpi`、`source.key`、`source.bytes`、`artifacts`、`parquet_contribution`、`counts.page_count`。
2. `status` 必须为 `complete` 才可被 Eval 消费；`partial` 只用于诊断。
3. `artifacts` 中每一项 `object_key` 必须能 HEAD 到，且字节数一致。
4. `source_sha256` 必须等于 `source.key` 的文件名（去掉 `.pdf`）。
5. `reproducibility_key` 必须能由 v2 字段重算得到。
6. **Manifest 不含 `commit_token`**；成功判定必须读取协调器 commit 记录与 `committed.json`，并要求 token/manifest_sha 一致。
7. Manifest 自身 SHA-256 记录在 `attempt.json` 与任务事件中；上传后 GET 回读校验。

### 2.2 Batch / Partition Manifest

`parse/tables/table=<t>/batch=<batch_id>/part_manifest.json`：

```json
{
  "schema": "lakehouse/part-manifest/v1",
  "table": "candidates",
  "batch_id": "B1-20261117T020000Z",
  "created_at": "2026-11-17T02:20:00Z",
  "files": [
    {"name": "part-00001.parquet", "sha256": "…", "bytes": 28332, "rows": 2896}
  ],
  "total_rows": 2896,
  "rows_by_run": {
    "doc-059d448c-20261117T021103Z-a1-g1-7f3c": 1448,
    "doc-059d448c-20261117T021118Z-a1-g2-9a1b": 1448
  },
  "compaction": {"generation": 1, "previous": null}
}
```

**对账等式**：

```text
SUM(part_manifest.total_rows)
  == SUM(part_manifest.rows_by_run.values())
  == SUM(run_manifest.parquet_contribution.rows)
```

- 2 个 run 共享 1 个文件时，`total_rows=2896`，两个 run 各 1448；
- Catalog 只按 `part_manifest` 计一次，不能按 run 引用次数累加；
- 测试 N-19 固定该行为。

---

## 3. Parquet 分区与文件

### 3.1 目录与命名

```
parse/tables/table=candidates/batch=B1-20261117T020000Z/part-00001.parquet
parse/tables/table=candidates/batch=B1-20261117T020000Z/part_manifest.json
```

- 只按 `batch` 一级分区；**不加** `year=/month=/day=`，避免文件过小。
- 每张表每批目标 1–4 个文件；单文件 128–512 MB。
- 文件序号单调递增；合并不覆盖旧文件（见 §3.4）。

### 3.2 Schema

**candidates**

| 列 | 类型 | 可空 | 说明 |
|---|---|---|---|
| `run_id` | VARCHAR | 否 | 外键 |
| `batch_id` | VARCHAR | 否 | 批次 |
| `task_id` | VARCHAR | 否 | 任务（完整 SHA） |
| `attempt` | INTEGER | 否 | 尝试序号 |
| `lease_generation` | INTEGER | 否 | 提交时的租约代次 |
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

`run_id, batch_id, task_id, attempt, lease_generation, source_sha256, document_id, page_count, table_count, candidate_count, parser_fingerprint, config_hash, created_at`

**tables**

`run_id, batch_id, task_id, attempt, lease_generation, source_sha256, document_id, table_id, page_number, page_end, row_count, column_count, header_rows, table_type, visual_boundary_status, reconstruction_status`

### 3.3 写入参数

```python
pq.write_table(
    table,
    path,
    compression="zstd",
    row_group_size=128 * 1024 * 1024 // 64,
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
3. 生成新的 `part_manifest.json`（新 `total_rows`、新 `rows_by_run`、新文件哈希）；
4. 新快照只引用新清单；旧清单与旧文件保留，写墓碑说明「已被快照 X 取代」。

**不跨批次合并**：批次是审计边界。

### 3.5 行数对账

每次写入与合并后更新 `part_manifest.json`。Catalog 构建时：

```text
part_total_rows      = SUM(part_manifest.total_rows)
rows_by_run_sum      = SUM(part_manifest.rows_by_run.values())
run_contribution_sum = SUM(run_manifest.parquet_contribution.rows)
要求 part_total_rows == rows_by_run_sum == run_contribution_sum
```

任一不等 → 中止发布，写 `row_reconciliation.delta`，不生成快照。

---

## 4. RAW.json 与 attempt.json

### 4.1 RAW.json

见主文档 §4.6。

### 4.2 attempt.json

`parse/runs/<run_id>/attempt.json`：

```json
{
  "schema": "lakehouse/attempt/v1",
  "task_id": "B1-20261117T020000Z:3f9c…",
  "run_id": "doc-059d448c-20261117T021103Z-a1-g1-7f3c",
  "attempt": 1,
  "lease_generation": 1,
  "worker_id": "worker-02",
  "started_at": "2026-11-17T02:10:42Z",
  "finished_at": "2026-11-17T02:11:03Z",
  "exit": {"code": 0, "signal": null, "timed_out": false},
  "stages": [
    {"name": "raw_head", "ok": true, "ms": 31},
    {"name": "parse_pdf", "ok": true, "ms": 16800},
    {"name": "upload_blobs", "ok": true, "ms": 2400},
    {"name": "coordinator_commit", "ok": true, "ms": 12},
    {"name": "receipt", "ok": true, "ms": 18, "written_by": "coordinator"}
  ],
  "manifest_sha256": "…",
  "receipt_state": "written",
  "s3_request_id": "…",
  "log_key": "logs/worker/2026-11-17/worker-02.jsonl"
}
```

> v1.2：`attempt.json` 不再记录 `commit_token`；token 只在协调器 `commits` 与 `committed.json`。

---

## 5. DuckDB 查询示例

所有查询必须绑定 `snapshot_id`；以下用 `:snapshot` 表示快照目录。

```sql
-- duckdb.connect('<snapshot>/catalog.duckdb', read_only=True)
```

### Q1 跨三层血缘（给定 run_id）

```sql
SELECT  e.run_id,
        e.source_sha256,
        p.parser_fingerprint,
        p.config_hash,
        p.table_params_sha256,
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

`snapshot_files` 由 Catalog 构建器从快照 manifest 生成；与对象 HEAD 结果比对。

### Q7 重复输入比例

```sql
SELECT  count(*)                                AS raw_objects,
        count(DISTINCT source_sha256)           AS distinct_sha,
        count(*) - count(DISTINCT source_sha256) AS duplicates
FROM    raw_docs;
```

### Q8 三级行数对账（R2）

```sql
SELECT  pm.batch_id,
        pm.table,
        sum(pm.total_rows)                                      AS part_total_rows,
        (SELECT sum(v)
         FROM (SELECT unnest(rows_by_run) AS v FROM part_manifests pm2
               WHERE pm2.batch_id = pm.batch_id AND pm2.table = pm.table)) AS rows_by_run_sum,
        (SELECT sum(parquet_contribution_rows)
         FROM run_contributions rc
         WHERE rc.batch_id = pm.batch_id AND rc.table = pm.table) AS run_contribution_sum,
        part_total_rows - rows_by_run_sum                       AS delta1,
        part_total_rows - run_contribution_sum                  AS delta2
FROM    part_manifests pm
GROUP BY pm.batch_id, pm.table
HAVING  delta1 <> 0 OR delta2 <> 0;
```

> 返回 0 行才算对账通过。具体表名以 Catalog 构建器实现为准；语义固定为三级相等。

---

## 6. Worker 状态机

### 6.1 状态

| 状态 | 含义 | 终态 |
|---|---|---|
| `PENDING` | 在批次清单中，未分配或已过期 | 否 |
| `CLAIMED` | 协调器已发租约（含 `lease_generation`） | 否 |
| `RUNNING` | 子进程执行中 | 否 |
| `COMMITTED_PENDING_RECEIPT` | 协调器 COMMIT 事务成功，receipt 未写 | 否（不算成功） |
| `SUCCEEDED` | commit 与 receipt 一致 | 是 |
| `SKIPPED_DUPLICATE` | 同 `reproducibility_key` 已有成功结果 | 是 |
| `INVALID_INPUT` | PDF 非法/加密/0 页/无文本层 | 是 |
| `FAILED_RETRYABLE` | 可重试失败，等待退避 | 否 |
| `TIMED_OUT` | 超时被杀 | 否（可转重试或永久） |
| `LEASE_EXPIRED` | `expires_at <= now`（无论扫描是否执行） | 否（可重派） |
| `STALE_ABORTED` | Worker 收到 409 `STALE_LEASE` / `NOT_OWNER` / `LEASE_EXPIRED` | 否（任务回 PENDING） |
| `FAILED_PERMANENT` | 不可重试失败或超过最大次数 | 是 |
| `QUARANTINED` | 证据/血缘/对象冲突/receipt 不一致 | 是 |
| `TOMBSTONED` | 批次失效或人工撤销 | 是 |

### 6.2 转换表

| 从 | 事件 | 到 | 条件 |
|---|---|---|---|
| PENDING | `grant`（协调器） | CLAIMED | 协调器事务成功；generation +1 |
| CLAIMED | `start` | RUNNING | 本地工作区就绪 |
| RUNNING | `commit_tx_ok` | COMMITTED_PENDING_RECEIPT | SQLite 事务插入 commit |
| COMMITTED_PENDING_RECEIPT | `receipt_written` | SUCCEEDED | receipt 写入且 token/manifest_sha 与 commit 一致 |
| COMMITTED_PENDING_RECEIPT | `receipt_conflict` | QUARANTINED | token/manifest_sha 不一致或 receipt 已存在但 commit 缺失 |
| RUNNING | `duplicate_found` | SKIPPED_DUPLICATE | 查到同 repro key 的成功 run |
| RUNNING | `invalid_input` | INVALID_INPUT | 魔数/加密/页数/文本层 |
| RUNNING | `retryable_error` | FAILED_RETRYABLE | 网络/存储/资源 |
| RUNNING | `timeout` | TIMED_OUT | 超过阈值并杀进程 |
| RUNNING | `stale_lease` | STALE_ABORTED | 协调器返回 409 |
| TIMED_OUT | `schedule_retry` | FAILED_RETRYABLE | attempt < max |
| TIMED_OUT | `give_up` | FAILED_PERMANENT | attempt ≥ max |
| FAILED_RETRYABLE | `backoff_elapsed` | PENDING | 退避到期 |
| CLAIMED/RUNNING | `lease_expired`（协调器或 expires_at） | LEASE_EXPIRED | `expires_at <= now` |
| LEASE_EXPIRED | `grant`（协调器） | CLAIMED | generation +1 |
| STALE_ABORTED | `requeue`（协调器） | PENDING | 旧 Worker 已停止 |
| RUNNING | `evidence_conflict` | QUARANTINED | 哈希不符/对象冲突/血缘失败 |
| any | `tombstone` | TOMBSTONED | 批次撤销（需审计） |

### 6.3 事件格式

```json
{
  "event_id": "ev-01J9Z3K7Q8V6N5M4L3K2J1H0G9",
  "task_id": "B1-20261117T020000Z:3f9c…",
  "attempt": 1,
  "lease_generation": 1,
  "from": "PENDING",
  "to": "CLAIMED",
  "at": "2026-11-17T02:10:40Z",
  "worker_id": "worker-02",
  "run_id": null,
  "error_class": null,
  "evidence": {"grant_mode": "coordinator"}
}
```

- `event_id` 为 ULID/时间有序 ID；
- 事件只追加，不修改；
- 状态以协调器 SQLite 为准；事件用于审计与重建。

---

## 7. 失败重试策略

### 7.1 错误分类

| `error_class` | 可重试 | 退避 | 最大 attempt | 备注 |
|---|---|---|---|---|
| `OBJECT_STORE_5XX` | 是 | 60/300/900 s + 抖动 | 3 | 不写半成品 |
| `NETWORK_TIMEOUT` | 是 | 同上 | 3 | 区分连接/读取 |
| `WORKER_CRASH` | 是 | 立即（新 generation） | 3 | 租约过期触发 |
| `PARSE_TIMEOUT` | 是 | 300 s | 2 | 大件阈值见 OD-05 |
| `DISK_FULL` | 是 | 300 s | 2 | 清理后可重试 |
| `STALE_LEASE` | 否 | — | — | generation 不符；Worker 立即中止；协调器重派 |
| `NOT_OWNER` | 否 | — | — | owner 不符；Worker 立即中止 |
| `LEASE_EXPIRED` | 否 | — | — | `expires_at <= now`；不续期、不提交（不等扫描） |
| `EPOCH_MISMATCH` | 否 | — | — | plan_epoch 不符；批次停止 |
| `COMMIT_CONFLICT` | 否 | — | — | 同 generation 不同 manifest；隔离 |
| `RECEIPT_PENDING` | 不适用 | reconciler 30 s | — | commit 已存在、receipt 未写；不算成功 |
| `COORDINATOR_UNREACHABLE` | 否 | — | — | 暂停；不提交；重连 |
| `PDF_INVALID` | 否 | — | 1 | 魔数/加密/0 页 |
| `NO_TEXT_LAYER` | 否 | — | 1 | 本轮不做 OCR |
| `PARSER_EXCEPTION` | 否 | — | 1 | 代码错误，需修代码 |
| `CONFIG_INVALID` | 否 | — | 1 | 批次停止 |
| `FINGERPRINT_DRIFT` | 否 | — | 1 | 批次停止并告警 |
| `EVIDENCE_CONFLICT` | 否 | — | 1 | 隔离，人工 |
| `MANIFEST_INVALID` | 否 | — | 1 | 隔离，人工 |

### 7.2 去重与 canonical

- 每次 attempt 独立 `run_id`（含 `g<generation>`）；
- `parse_runs` 增加 `attempt`、`lease_generation`、`canonical_of`（可空）；
- 视图 `v_canonical_runs`：同一 `reproducibility_key` 下，取 `status='complete'` 且 `created_at` 最小的一条为 canonical；
- 统计与发布默认只读 canonical；历史 attempt 保留可查；
- **禁止**用新结果覆盖 canonical 记录。

### 7.3 死信

```
control/deadletter/<batch_id>/<task_id>.json
```

内容：任务、每次 attempt 的 `run_id` / `generation` / 错误类、最后 200 行日志键、证据键、建议处置。
死信不自动重试；人工处理后以新批次重跑。

---

## 8. 批次清单示例

`control/batches/<batch_id>/tasks.jsonl`（已按 `input_key` 去重；重复输入在 `ingest.jsonl`）：

```json
{"task_id":"B1-20261117T020000Z:3f9c…","batch_id":"B1-20261117T020000Z","input_key":"3f9c…","document_sha256":"059d448c5a34a4b1f45f02038f5076b82633f372372a15c395940803dc7f3a2b","requested_mpn":"LM358","ingest_ids":["B1-20261117T020000Z:059d448c…:1"],"pool":"P","priority":42,"created_at":"2026-11-17T02:00:00Z"}
```

`control/ingest/<batch_id>/ingest.jsonl`：

```json
{"ingest_id":"B1-20261117T020000Z:059d448c…:1","task_id":"B1-20261117T020000Z:3f9c…","document_sha256":"059d448c…","requested_mpn":"LM358","source_uri":"https://.../LM358.pdf","received_at":"2026-11-17T01:59:00Z","seq":1}
{"ingest_id":"B1-20261117T020000Z:059d448c…:2","task_id":"B1-20261117T020000Z:3f9c…","document_sha256":"059d448c…","requested_mpn":"LM358","source_uri":"https://.../LM358-dup.pdf","received_at":"2026-11-17T01:59:05Z","seq":2}
```

> 两条 ingest 指向同一个 `task_id`（同 PDF 同 MPN），只解析一次；`requested_mpn` 不同的输入会得到不同 `input_key`，因此是两个 task。

`plan.json`：

```json
{
  "schema": "lakehouse/batch-plan/v3",
  "batch_id": "B1-20261117T020000Z",
  "created_at": "2026-11-17T02:00:00Z",
  "coordinator_epoch": 1,
  "sample": {
    "pool_p": {"source": "document_asset", "filter": "FetchStatus=1 AND HasTextLayer=1",
               "requested": 950, "actual": 950},
    "pool_q": {
      "source": "document_asset",
      "requested": 50, "actual": 50,
      "subquota": {"no_text": 20, "scan": 15, "encrypted": 10, "zero_page": 5}
    }
  },
  "pinned": {
    "parser_fingerprint": "…",
    "config_hash": "…",
    "table_params_sha256": "…",
    "dependency_lock_sha256": "…"
  },
  "limits": {"max_attempts": 3, "timeout_base_s": 180, "timeout_per_page_s": 6,
             "lease_ttl_s": 90, "heartbeat_s": 15},
  "owner": "乙方",
  "status": "open"
}
```

> v1.1 删除 `shard_count`：任务分配由协调器动态发放，不再静态分片。
> `plan.json` 的 `pinned` 是批次级冻结；Worker 启动时比对，不一致即拒绝接单。
> v1.2：`sample.pool_q.subquota` 明确 50 份的子类配额，避免全部来自同一拒绝类型。

---

## 9. 协调器协议（v1.2）

### 9.1 部署

- 单进程；本地 SQLite（WAL）；可选独立 2 vCPU / 4 GB 实例；
- 只监听私有网络；Worker 通过 `COORDINATOR_URL` 连接；
- 不是数据库服务器、不是 DuckDB、不是队列中间件。

### 9.2 表结构（SQLite）

```sql
CREATE TABLE tasks (
  task_id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  input_key TEXT NOT NULL,
  document_sha256 TEXT NOT NULL,
  requested_mpn TEXT NOT NULL,
  state TEXT NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 0,
  generation INTEGER NOT NULL DEFAULT 0,
  owner TEXT,
  expires_at TEXT,
  run_id TEXT,
  error_class TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE (batch_id, input_key)
);

CREATE TABLE commits (
  task_id TEXT PRIMARY KEY,
  generation INTEGER NOT NULL,
  manifest_sha256 TEXT NOT NULL,
  token TEXT NOT NULL,
  run_id TEXT NOT NULL,
  committed_at TEXT NOT NULL,
  receipt_sha256 TEXT NOT NULL,                   -- 期望 receipt 字节的 SHA-256
  receipt_state TEXT NOT NULL DEFAULT 'pending',  -- pending|written|conflict
  receipt_attempts INTEGER NOT NULL DEFAULT 0,
  put_attempts INTEGER NOT NULL DEFAULT 0,        -- 任务级 PUT 预算（≤2）
  verify_attempts_reserved INTEGER NOT NULL DEFAULT 0, -- 已预留预算（含未完成 REC，上限 20）
  verify_attempts_total INTEGER NOT NULL DEFAULT 0,    -- 结果已持久化的 GET 次数（审计）
  episode_attempts INTEGER NOT NULL DEFAULT 0,    -- 单 episode
  episode_started_at TEXT,
  recovery_attempts INTEGER NOT NULL DEFAULT 0,  -- 恢复通道已预留尝试数（≤10，含未发出/未落盘）
  recovery_started_at TEXT,                       -- 恢复通道 300 s 窗口起点
  last_observed_receipt_state TEXT,               -- 最近观察结果（不覆盖 rec_state）
  pending_since TEXT,
  next_retry_at TEXT,
  rec_attempted INTEGER NOT NULL DEFAULT 0,       -- 执行 REC GET 前先置 1（B5）
  rec_state TEXT,                                 -- in_flight|written|conflict|absent|unknown
  rec_at TEXT,
  token_key_id TEXT NOT NULL,
  recovered_from_receipt INTEGER NOT NULL DEFAULT 0,
  receipt_error TEXT,
  receipt_written_at TEXT
);

CREATE TABLE events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,                  -- sha256(batch|task|reason|receipt_sha)
  task_id TEXT NOT NULL,
  attempt INTEGER,
  generation INTEGER,
  from_state TEXT,
  to_state TEXT,
  at TEXT NOT NULL,
  worker_id TEXT,
  error_class TEXT,
  receipt_state TEXT,
  put_attempts INTEGER NOT NULL DEFAULT 0,        -- 事件 PUT 预算（B1，只减不增）
  event_state TEXT NOT NULL DEFAULT 'pending',    -- pending|written|conflict|unresolved
  put_started_at TEXT,                            -- 首次预留预算时间
  last_put_reserved_at TEXT                       -- 最近一次预留预算时间（不代表 PUT 已发出/完成）
);
```

### 9.3 接口（语义）

| 方法 | 路径 | 作用 |
|---|---|---|
| POST | `/v1/hello` | Worker 注册，校验 `batch_id` / `plan_epoch` / 指纹 |
| POST | `/v1/lease` | 申请一个任务；返回 `task_id, generation, expires_at` |
| POST | `/v1/heartbeat` | 续租；校验 owner/generation/expires_at/epoch/state |
| POST | `/v1/commit` | 提交；幂等；校验 owner/generation/expires_at/epoch/state；返回 token 或 409 |
| GET | `/v1/state/<task_id>` | 查询当前状态（审计/排障） |
| GET | `/v1/receipt/<task_id>` | 返回 commit 记录的规范 receipt body；用于核对/补写 |
| POST | `/v1/close` | 关闭批次；生成 recovery 批次所需未完成清单 |
| POST | `/v1/reconcile` | 手动触发 receipt outbox 补写（运维用） |

### 9.4 不变量

1. `generation` 只增不减；每次重新发租约 +1；
2. HEARTBEAT/COMMIT 的**非幂等分支**必须在同一事务内校验：`owner`、`generation`、`expires_at > now`、`plan_epoch`、批次状态；
3. `expires_at <= now` 即失效，不依赖过期扫描；
4. 同 task、同 generation、同 `manifest_sha256` 的 COMMIT 幂等，返回同一 token（**该分支先于 expires_at 检查**）；不同 manifest → `409 COMMIT_CONFLICT`；
5. `commits.task_id` 主键唯一 → 一个 task 最多一个成功 commit；
6. receipt 由协调器写；`pending` 由 reconciler 补写；`conflict` → `QUARANTINED`；
7. 成功 = commit 存在 ∧ receipt 存在 ∧ token/manifest_sha 一致；
8. 协调器重启后先 reconcile，再发新租约；状态不确定时关闭批次并开 recovery 批次，不猜。

### 9.5 序列示例（正常）

```
W: POST /v1/hello {batch, worker, plan_epoch: 1}
C: 200 {lease_ttl_s: 90}
W: POST /v1/lease {worker}
C: 200 {task_id: T, generation: 1, expires_at: ...}
W: parse...
W: POST /v1/heartbeat {task: T, generation: 1}       (每 15 s)
C: 200
W: POST /v1/commit {task: T, generation: 1, manifest_sha256: M}
C: BEGIN; checks; INSERT commit(token); state=COMMITTED_PENDING_RECEIPT; COMMIT;
C: PUT control/tasks/T/committed.json {generation:1, token:ct-..., manifest_sha256:M, run_id:R}
C: receipt_state=written
C: 200 {token: ct-...}
```

### 9.6 序列示例（租约已过期、扫描尚未执行）

```
W1: 租约 expires_at=10:00:00
C: 过期扫描下一次在 10:00:05
W1: 10:00:02 POST /v1/heartbeat {generation: 1}
C: expires_at <= now -> 409 LEASE_EXPIRED（generation 仍为 1，但拒绝）
W1: 停止；不提交
```

### 9.7 序列示例（旧 Worker 恢复）

```
W1: generation=1, 网络中断
C: 租约过期；generation=2 分配给 W2
W1: 恢复，POST /v1/commit {generation:1}
C: 409 STALE_LEASE {current_owner: W2, current_generation: 2}
W1: 停止；不写任何 receipt；本地工作区清理
W1 已上传的 manifest 成为孤儿，不被 Eval/Catalog 消费
```

### 9.8 序列示例（COMMIT 后、receipt 前崩溃）

```
W: POST /v1/commit {generation:1, manifest_sha256:M}
C: SQLite COMMIT 成功（receipt_state=pending）
C: 崩溃，未写 committed.json
C: 重启 -> 加载 SQLite -> reconciler 发现 pending
C: PUT committed.json（同 token、同 body）
C: receipt_state=written
W: 重试 POST /v1/commit {generation:1, manifest_sha256:M}
C: 200 {token: 同一 token}（幂等，不产生第二条 commit）
```

> 在 receipt 补齐前，Eval/Catalog 不消费该 run；任务状态为 `COMMITTED_PENDING_RECEIPT`，不是成功。

### 9.9 Receipt 写入协议（v1.3，R1-3）

**规范字节**：`canonical_json`（键排序、UTF-8、无 BOM、LF、无多余空白），字段：

```json
{
  "schema": "lakehouse/commit-receipt/v2",
  "task_id": "...",
  "generation": 1,
  "token": "...",
  "token_key_id": "k1",
  "manifest_sha256": "...",
  "run_id": "...",
  "committed_at": "..."
}
```

> v2 必填 `token_key_id`；`receipt_sha256` 覆盖含该字段的规范字节。v1（无 key id）仅在显式配置 `legacy_receipt_key_id` 时允许 L3。

`commits` 行在事务内记录 `receipt_sha256`（期望字节的 SHA-256），因此期望字节可精确重建。

```text
verify_receipt(expected) -> WRITTEN | ABSENT | CONFLICT | UNKNOWN
  GET receipt:
    200 且 bytes == expected  -> WRITTEN
    200 且 bytes != expected  -> CONFLICT
    404（10 次 / 60 s 窗口）   -> ABSENT
    403/5xx/超时（重试后）      -> UNKNOWN

write_receipt(commit):
  expected = canonical_bytes(receipt_body(commit))
  r = verify_receipt(expected)
  WRITTEN  -> written（不 PUT）
  CONFLICT -> conflict（不 PUT）
  UNKNOWN  -> pending（只回读重试，不写）
  ABSENT   -> PUT If-None-Match: *
              200/412/超时 -> verify_receipt：
                  WRITTEN  -> written
                  ABSENT   -> pending（可条件重写，有上限）
                  CONFLICT -> conflict
                  UNKNOWN  -> pending（不写）
```

**404 统一语义**：404 = `ABSENT`（当前不可见），不是冲突、不是失败；只有 `ABSENT` 允许再次条件写，`UNKNOWN` 只读不写。

**任务级预算（持久化在 commits 行，重启不重置）**：

| 参数 | 值 |
|---|---|
| `receipt_verify_attempts_max` | 10 / **episode** |
| `receipt_verify_deadline_s` | 60 / **episode** |
| `receipt_put_attempts_max` | 2（首次 + 至多一次条件重写） |
| `receipt_reput_cooldown_s` | 60 |
| `receipt_pending_max_s` | 3600 → `QUARANTINED(receipt_absent_timeout)` |

**episode 状态机（A5/B5）**：`episode_no ∈ {0,1}`；普通 30 s reconcile **延续当前 episode**（不重置次数/截止）；只有第二次 PUT 后允许 `0→1`（此时 `episode_attempts=0`、`episode_started_at=now`）；重启恢复原 episode，不自动新增；`verify_attempts_reserved` 上限 20（`verify_attempts_total` 为结果已持久化的 GET 审计计数）；`pending_since` 3600 s 生命周期上限。

**普通 verification GET 的预留（B5）**：仅 episode 0/1 的普通 reconcile GET 使用本规则，必须**先预留、后执行**；REC 与 `REC_PENDING_UNKNOWN` 的恢复通道各自独立（见下），均不增加 `episode_attempts`。普通 GET 发请求前在同一事务执行：

```sql
UPDATE commits
   SET verify_attempts_reserved = verify_attempts_reserved + 1,
       episode_attempts = episode_attempts + 1,
       episode_started_at = COALESCE(episode_started_at, :now)
 WHERE task_id = :task_id
   AND verify_attempts_reserved < 20
   AND episode_attempts < 10
   AND (episode_started_at IS NULL OR :now < datetime(episode_started_at, '+60 seconds'));
-- changes()=1 才发 GET；changes()=0 → 不发
COMMIT;
```

GET 返回后在另一事务中 `verify_attempts_total += 1` 并写入观察结果。崩溃语义：预留后未发 GET → `reserved/episode_attempts` 已消耗、`total` 不变、预算不返还；GET 已发出/已返回但结果未落盘 → 不重发该次、`total` 不增；结果落盘后才 `total+1`。

**`REC_PENDING_UNKNOWN` 恢复通道（B5）**：episode 0 已结束、episode 1 未开启，因此该状态的 GET 使用独立通道：

```sql
UPDATE commits
   SET verify_attempts_reserved = verify_attempts_reserved + 1,
       recovery_attempts = recovery_attempts + 1,
       recovery_started_at = COALESCE(recovery_started_at, :now)
 WHERE task_id = :task_id
   AND rec_state = 'unknown'
   AND verify_attempts_reserved < 20
   AND recovery_attempts < 10
   AND (recovery_started_at IS NULL OR :now < datetime(recovery_started_at, '+300 seconds'));
-- changes()=1 才发 GET
COMMIT;
```

不修改 `episode_no/episode_attempts/episode_started_at`；结果处理：`WRITTEN→SUCCEEDED`、`CONFLICT→QUARANTINED`、`ABSENT/UNKNOWN→保持 REC_PENDING_UNKNOWN` 并在剩余预算内继续。观察结果写入 `last_observed_receipt_state`，**不覆盖 `rec_state`**（准入仍用 `rec_state='unknown'`）。`recovery_attempts=10`、300 s 到期或 `reserved=20` → observation-only；`pending_since` 3600 s → 隔离；重启恢复 `recovery_attempts`/`recovery_started_at`/`last_observed_receipt_state`，不重置；已提交观察保留，未提交观察不得出现。

**REC（B5）**：episode 0 结束后允许一次 1 次 GET 的**重写资格检查**；独立预留：消耗 1 次 `verify_attempts_reserved`，**不增加 `episode_attempts`**、不受 10 次 / 60 s 窗口约束，只检查 `reserved < 20`；**执行顺序**：① SQLite 提交 `rec_attempted=1, rec_state='in_flight', rec_at=now, verify_attempts_reserved+=1` → ② 单次 GET → ③ 提交 `written|absent|conflict|unknown` 且 `verify_attempts_total+=1`；`WRITTEN` 直接成功、`CONFLICT` 隔离、`ABSENT` 且条件全满足才第二次 PUT、`UNKNOWN` 进入 `REC_PENDING_UNKNOWN`（不重跑 REC；恢复通道 GET 按 `recovery_attempts` 独立预留，10 次 / 300 s / reserved 20 后 observation，3600 s 隔离）；`rec_state='in_flight'` 时崩溃一律按 `unknown` 恢复、不重发（reserved 已消耗、total 不增加）；`rec_attempted/rec_state/rec_at` 持久化，重启不重复。`REC_PENDING_UNKNOWN` 是 `COMMITTED_PENDING_RECEIPT` 的内部子状态，`tasks.state` 不变。

**无 CAS 的退化（A6）**：仅允许**首次创建**走「GET 404 → 串行 PUT → 回读」，标记 `receipt_write_mode=serialized_no_cas`；**永不重写**；未知结果只读；OD-19 未批准时禁止写入。

**PUT 200 后回读 404**：默认只回读，不立即重写。仅当「首次 PUT 200 ∧ 存储通过 C1/C2 ∧ 冷却期已过 ∧ `put_attempts<2` ∧ 仍 ABSENT」全部满足时，允许**一次**条件重写；第二次 PUT 后再开新 episode，仍 ABSENT 则 pending、不再 PUT；不支持条件写时禁止重写。

| 边界 | 行为 |
|---|---|
| PUT 200 后回读 404 | `ABSENT`：**默认只回读**；仅在预算/冷却/C1-C2 全部满足时允许一次条件重写；否则 pending + 告警；**不算冲突** |
| receipt 已存在且内容一致 | 只更新 `receipt_state='written'`，**不 PUT** |
| receipt 已存在但内容不同 | `conflict` → `QUARANTINED`；**不 PUT**，原字节不变 |
| PUT 超时但实际成功 | 不做盲目重试；GET 回读一致 → `written` |
| PUT 成功、SQLite 状态未更新 | 重启 `pending` → GET 回读一致 → 只更新状态，不重复 PUT |
| 已 `written` 的 receipt 缺失/变化 | `QUARANTINED`；不自动重写 |
| receipt 存在但 commit 缺失 | `QUARANTINED`；不自动补 commit |

**不变量**：

1. 协调器是 receipt 唯一写者；其他角色无写权限（OD-16）；
2. 已存在的 receipt 永不覆盖；不同内容只能隔离；
3. 任何写入/恢复都必须回读校验，不能以「请求返回 200」代替内容验证；
4. token 在 COMMIT 事务内固定，恢复不重发。

### 9.10 Orphan Receipt 扫描（v1.7，R1-3e）

**定义**：`committed.json` 存在，但 `commits` 表无对应行（或无法对应）。

**批次索引（R1-3e-1）**：权威来源是对象存储，不是 SQLite。

| 状态 | 判定（互斥） |
|---|---|
| OPEN | `plan.json` 存在 ∧ `close.json` 不存在 ∧ `closed.json` 不存在 |
| CLOSING | `plan.json` 存在 ∧ `close.json` 存在 ∧ `closed.json` 不存在 |
| CLOSED | `plan.json` 存在 ∧ `closed.json` 存在（`close.json` 可缺，记异常） |
| INVALID_BATCH | `plan.json` 缺失/不可解析 |

- 优先级 `CLOSED > CLOSING > OPEN`，结果唯一；
- 内存索引只作缓存；SQLite 丢失时 list `control/batches/`（批次数量级）重建；
- 清单缺失/损坏 → `INVALID_BATCH`，不扫描、告警。

**SQLite 丢失恢复（R1-3e-1c）**：

1. **L1**：有备份 → 恢复 → 重放 receipt/事件 → 不一致隔离；
2. **L2**：无备份 → receipt 有 commit 无 → orphan 隔离，不自动补 commit；
3. **L3**：人工审批后按 receipt 重建 commit，必须逐项校验 receipt schema/hash、task 在清单、input_key/MPN 一致、manifest 存在且 `task_id/run_id/source_sha` 一致、**token 用 receipt.token_key_id 对应密钥重算且账本一致**、**generation 严格等于 watermark**；通过后记 `recovered_from_receipt=true`，失败保持隔离。

**token 账本顺序（B4）**：commit 事务 → token 账本条件写（冲突隔离；失败标 pending，不阻断本次成功但阻断 L3）→ receipt。**密钥版本（B2）**：receipt/账本记录 `token_key_id`；历史 key 受控保留；key 不可得则 L3 禁止。

**覆盖范围（R1-3e-2）**：自动保证仅限「已登记批次 + 清单可读」的 `tasks.jsonl` task_id；CLOSED 批次、未登记 task_id、丢失清单、全桶 orphan 不在自动保证内。CLOSED 批次可用 `POST /v1/audit?batch_id=...` 人工审计。

**事件幂等（R1-3e-3）**：

```text
event_id = sha256(f"{batch_id}|{task_id}|receipt_without_commit|{receipt_sha256}")
```

- **事件对象**：`control/events/<batch>/coordinator/<event_id>.json`（一事件一对象）；`event_id` 即键，`If-None-Match: *` 条件写；
- 已存在且字节一致 → 幂等成功；已存在且字节不同 → `EVENT_CONFLICT`，隔离不覆盖；
- SQLite `events.event_id` UNIQUE + `INSERT OR IGNORE`；
- **事件 PUT 预算（B1）**：预算记录在 `events` 行（`put_attempts/event_state/put_started_at/last_put_reserved_at`），与 `commits.put_attempts`（receipt）分离；首次 PUT 前在同一事务内先 `INSERT OR IGNORE INTO events(event_id,task_id,at,event_state,put_attempts) VALUES(:event_id,:task_id,:now,'pending',0)`，再执行 `UPDATE events SET put_attempts=put_attempts+1, put_started_at=COALESCE(put_started_at,:now), last_put_reserved_at=:now WHERE event_id=? AND put_attempts < :max_puts`，仅 `changes()=1` 才发 PUT，事务 COMMIT 成功后才发；上限 `storage_atomic=3` / `coordinator_serialized=2`（均含首次）；回读不计预算；重启按 `put_attempts` 续算，不退回、不重置；`put_started_at` / `last_put_reserved_at` 均只代表预算预留时间，不代表 PUT 已发出或完成；
- **不再使用整文件 JSONL**（PUT 是整对象替换，无法原子去重）；
- receipt_sha 变化 → 新 event_id，记录 `first_receipt_sha256` / `last_receipt_sha256` / `receipt_changed=true`。

**有界扫描**（不 list 全桶）：

```text
for batch in (OPEN ∪ CLOSING):          # 由 plan/close/closed 标记互斥判定
    for task_id in read_jsonl(control/batches/<batch>/tasks.jsonl):
        commit = SELECT * FROM commits WHERE task_id=?
        receipt = HEAD/GET control/tasks/<task_id>/committed.json
        if not commit and receipt.exists:
            quarantine(task_id, receipt)
# CLOSED 批次不进入自动扫描；仅 POST /v1/audit 人工触发
```

| 路径 | 范围 / 频率 |
|---|---|
| 启动扫描 | OPEN ∪ CLOSING 的 `tasks.jsonl`；每次协调器启动 |
| 定时扫描 | 同上；每 10 min |
| 按需扫描 | `POST /v1/reconcile`；`GET /v1/receipt/<task_id>` 时若发现无 commit 也记录 |
| 提交路径 | COMMIT 前若 receipt 已存在但 commit 缺失 → 立即隔离，不提交 |
| 人工审计 | `POST /v1/audit?batch_id=...`（含 CLOSED 批次） |

**隔离记录** `control/coordinator/<batch_id>/quarantine/<task_id>.json`：

```json
{
  "schema": "lakehouse/quarantine/v1",
  "task_id": "...",
  "reason": "receipt_without_commit",
  "detected_at": "...",
  "last_seen_at": "...",
  "receipt_key": "control/tasks/<task_id>/committed.json",
  "receipt_sha256": "...",
  "receipt_generation": 1,
  "receipt_manifest_sha256": "...",
  "receipt_run_id": "..."
}
```

**动作**：

1. 不创建 commit、不删除/覆盖 receipt；
2. `tasks` 表有该任务 → `QUARANTINED`；没有 → 仅记录；
3. 事件 `ORPHAN_RECEIPT_DETECTED`；
4. Eval/Catalog 排除该 run（成功要求 commit + receipt 一致）；
5. 重复出现只更新 `last_seen_at`。

**不自动恢复**：只能人工恢复 SQLite 备份、审批后补 commit，或放弃批次。系统不把 orphan receipt 当作成功。
