# DC-03 · A.5 回滚补测结果

| 项 | 值 |
|---|---|
| 文档编号 | REVIEW-P02-DC03-A5-RESULTS-20261125 |
| 版本 | v1.0 |
| 日期 | 2026-11-25（Asia/Shanghai） |
| Owner 授权依据 | 本轮 Owner 指令：「Owner 已明确授权执行 D-1 / A.5 隔离回滚补测」 |
| 原 SQL | `a5_rollback_supplement.sql`，SHA-256 `917a6a553444f8d0a983c7c45b3b012fe8adb60a563dd8a7cae89d8536bfbe99`（**未修改**） |
| 原始输出 | `a5_rollback_supplement_output.txt`，SHA-256 `d0ddc722206197ddd7e0b6791798891d71264399eeb87ed43c45ee7275eec774` |
| 执行结论 | **`PASS`** |
| 暂记状态 | `A5_TRANSACTION_ROLLBACK_SUPPLEMENT = PASS`；`D1_ISOLATED_TEST_SUITE = PARTIAL_PENDING_REVIEW`；`D1_PRODUCTION_VALIDATION = NOT_TESTED` |

---

## 1. 执行环境（实测）

| 项 | 值 |
|---|---|
| Server | MySQL Community Server **8.4.13** |
| 地址 / 端口 | `127.0.0.1:3317`（仅本机绑定，未对外） |
| 数据库 | `p02_a5_rollback_test`（测试专用，可重建） |
| 账号 | 隔离实例 root（空口令；仅本机临时实例，非生产） |
| datadir | 独立目录（本轮独立初始化，非系统服务数据目录） |
| 连接方式 | TCP `--protocol=TCP`，`--no-defaults` |

**隔离说明**：未连接生产库；未使用系统服务 `MySQL84LTS`；未使用既有 `3308` 评审实例；测试实例为本轮独立 datadir，测试后已关闭（`3317` 无监听）。

## 2. 执行命令

```powershell
Get-Content -Raw -Encoding UTF8 -LiteralPath a5_rollback_supplement.sql |
  & "D:\dev\mysql\mysql-8.4.13-winx64\bin\mysql.exe" --no-defaults `
    -h 127.0.0.1 -P 3317 -u root --protocol=TCP `
    --default-character-set=utf8mb4 --force --table `
    > a5_rollback_supplement_output.txt 2>&1
```

说明：原 SQL 文件头部保留 `STATUS: NOT EXECUTED`（该文件为提交前准备物，按要求未修改）；本次实际执行以本结果与原始输出为准。

## 3. 三阶段 SQL 与原始输出

| 阶段 | SQL（原文件行） | 实际结果 |
|---|---|---|
| 事务前 | `SELECT COUNT(*) AS pre_count …`（L36） | `pre_count = 0` |
| `START TRANSACTION` + `INSERT` | L38-L39 | 插入成功（无错误） |
| 事务内 | `SELECT COUNT(*) AS in_txn_count …`（L42） | `in_txn_count = 1` |
| `ROLLBACK` | L44 | 回滚成功 |
| 回滚后 | `SELECT COUNT(*) AS post_count …`（L47） | `post_count = 0` |

原始输出摘录：

```
=== A5 ENV ===         mysql_version=8.4.13  charset_server=utf8mb4  collation_server=utf8mb4_0900_ai_ci
=== A5 PRE (expect 0) ===      pre_count    = 0
=== A5 IN-TXN (expect 1) ===   in_txn_count = 1
=== A5 POST (expect 0) ===     post_count   = 0
=== DONE ===
```

## 4. 预期 vs 实际

| 阶段 | 预期 | 实际 | 结论 |
|---|---:|---:|---|
| 事务前 | 0 | 0 | PASS |
| 事务内插入后 | 1 | 1 | PASS |
| 回滚后 | 0 | 0 | PASS |

**A.5 双向回滚验证 = `PASS`。**

## 5. 时间与时区

- 执行与归档时点：**2026-11-25T11:26 +08:00**（Asia/Shanghai）。

## 6. 证据局限与异常

1. 本结果**仅代表隔离实例**（8.4.13）；**生产验证 `NOT_TESTED`**。
2. 不把本次 PASS 扩展为 D-1 整套 PASS；`D1_ISOLATED_TEST_SUITE = PARTIAL_PENDING_REVIEW`，等待独立 Reviewer 复核。
3. 原始输出由 PowerShell 捕获为 CRLF；已规范化为 LF（内容与 BOM 不变），使工作区/提交 blob/清单一致。
4. 原有 `dc03_collation_test.sql` 与 `dc03_collation_output.txt` **未修改**。
5. 无异常错误；`mysql` 退出码 0。

## 7. 新增文件 SHA-256

| 文件 | SHA-256 |
|---|---|
| `a5_rollback_supplement_output.txt` | `d0ddc722206197ddd7e0b6791798891d71264399eeb87ed43c45ee7275eec774` |
| `DC-03_A5_ROLLBACK_SUPPLEMENT_RESULTS.md` | 见 `closure_pack_01/SHA256SUMS` |
