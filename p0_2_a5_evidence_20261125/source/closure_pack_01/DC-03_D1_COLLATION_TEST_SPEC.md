# DC-03 · D-1 Collation 测试规范

| 项 | 值 |
|---|---|
| 文档编号 | REVIEW-P02-DC03-SPEC-20261125 |
| 版本 | v1.0（测试规范） |
| 日期 | 2026-11-25（Asia/Shanghai） |
| 对象 | MySQL 8.4 LTS；`utf8mb4_0900_as_cs`（首选候选） |
| 对照 | `utf8mb4_0900_ai_ci`、`utf8mb4_bin`、`utf8mb4_0900_bin` |
| SQL | `dc03_collation_test.sql`（同目录） |
| 原始输出 | `dc03_collation_output.txt`（同目录） |
| 隔离边界 | 专用 datadir + 专用库 `p02_collation_test`；仅 `127.0.0.1`；不连生产 |

---

## 1. 目标

验证 `utf8mb4_0900_as_cs` 在身份键 `(mpn_norm, brand_norm)` 上的比较与唯一约束行为，覆盖任务要求的 8 项：

1. 大小写敏感性；2. 重音敏感性；3. 尾随空格；4. UNIQUE 冲突；5. 索引行为；6. MPN+Brand 组合键；7. 字符集/Collation 元数据；8. 事务回滚与重复插入。

## 2. 非目标

- 不验证生产实例、不做生产 DDL、不连接生产库。
- 不冻结 Collation 契约；不做性能压测。
- 不实现 Product Identity / Catalog / API。

## 3. 环境

| 项 | 值 |
|---|---|
| Server | MySQL Community Server 8.4.13 |
| 连接 | `127.0.0.1:3317`，TCP，仅本机（未对外绑定） |
| datadir | 独立空目录（`--initialize-insecure` 新建），与系统服务/其他实例隔离 |
| 数据库 | `p02_collation_test`（测试专用，可重建） |
| 账号 | 测试实例 root（空口令，仅本机临时实例；不用于任何生产） |

> 隔离说明：未连接 `MySQL84LTS` 系统服务，也未使用既有 3308 评审实例；测试实例为本轮独立初始化。

## 4. 测试数据与用例

初始基线：`('ABC-1','BrandX')`。

| Case | 输入 | 目的 |
|---|---|---|
| C1 | `ABC-1 / BrandX` | 基线插入 |
| C2 | `abc-1 / BrandX` | 大小写敏感性 |
| C3 | `e / BrandX`、`é / BrandX` | 重音敏感性 |
| C4 | `ABC-2 / BrandX`、`ABC-2␠ / BrandX` | 尾随空格（PAD/NO PAD） |
| C5 | `SAME / BrandA`、`SAME / BrandB` | 复合键：同 MPN 不同 Brand |
| C6 | 再次 `ABC-1 / BrandX` | 精确重复 → 1062 |
| C7 | 事务前计数、事务内插入后计数、`ROLLBACK` 后计数 | 双向回滚验证 |
| C8 | `SHOW INDEX` / `EXPLAIN` | 索引与查询计划 |
| C9 | 各表行数 | 汇总核对 |

## 5. 预期结果（先验）

| Case | `utf8mb4_0900_as_cs` | `utf8mb4_bin` | `utf8mb4_0900_bin` | `utf8mb4_0900_ai_ci` |
|---|---|---|---|---|
| C1 基线 | 成功 | 成功 | 成功 | 成功 |
| C2 大小写 | 成功（区分） | 成功（区分） | 成功（区分） | **1062**（不区分） |
| C3 重音 | 成功（区分） | 成功（区分） | 成功（区分） | **1062**（不区分） |
| C4 尾随空格 | 成功（NO PAD） | **1062**（PAD SPACE） | 成功（NO PAD） | 成功（NO PAD） |
| C5 组合键 | 成功 | 成功 | 成功 | 成功 |
| C6 精确重复 | **1062** | **1062** | **1062** | **1062** |
| C7 回滚 | 事务前 0 → 事务内 1 → 回滚后 0 | — | — | — |
| C8 索引 | BTREE，复合唯一，key_len=1028 | — | — | — |
| C9 行数 | 8 | 7 | 8 | 6 |

> 上述为**基于 MySQL 8.4 collation 语义的先验预期**，实际结果以 `dc03_collation_output.txt` 为准；两者对照见 `DC-03_D1_COLLATION_TEST_RESULTS.md`。

## 6. 通过判据（针对 `utf8mb4_0900_as_cs`）

1. 大小写与重音均区分（C2/C3 不产生 1062）；
2. NO PAD：尾随空格可区分（C4 不产生 1062）；
3. 精确重复触发 1062（C6）；
4. 复合键行为正确（C5，同 MPN 不同 Brand 允许）；
5. 索引为 BTREE 复合唯一（C8）；
6. 事务回滚**双向**：事务前 0 → 事务内插入后 1 → 回滚后 0；仅回滚后 0 视为 `PARTIAL`；
7. 元数据与字符集正确（ENV / COLLATIONS METADATA）。

## 7. 可复现步骤

1. 准备独立空 datadir，执行 `mysqld --no-defaults --initialize-insecure --basedir=<基于> --datadir=<隔离目录>`。
2. 启动：`mysqld --no-defaults --basedir=<基于> --datadir=<隔离目录> --port=3317 --bind-address=127.0.0.1 --mysqlx=0 --skip-log-bin`。
3. 执行：`mysql --no-defaults -h 127.0.0.1 -P 3317 -u root --protocol=TCP --default-character-set=utf8mb4 --force --table < dc03_collation_test.sql > dc03_collation_output.txt 2>&1`。
4. 关闭：`mysqladmin ... shutdown`。

## 8. 安全声明

- 仅隔离测试实例与测试库；未连接生产库；未执行生产 DDL/迁移/删除业务数据。
- 未使用既有实例的未知凭据；测试实例为本轮独立初始化、空口令、仅本机。
