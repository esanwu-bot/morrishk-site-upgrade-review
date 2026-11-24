# 04 AuthKeyVersion 迁移兼容性（F-23）

## 1. 生产事实（材料核实）

来自既有 Review 材料 `04_database/01_schema.sql`、`00_project_baseline/existing_system_baseline.md`：

| 项 | 值 |
|---|---|
| 生产 MySQL | **5.6.50-log**（mysqldump 10.13） |
| 库 / 前缀 | `morris` / `snsii_` |
| 表数量 | 31（30 MyISAM + 1 InnoDB） |
| `snsii_manage` 引擎 | **MyISAM**，`DEFAULT CHARSET=utf8`，`id int(8)` |
| 字符集 | utf8（mb3） |

**未连接、未修改生产数据库。**

## 2. 精确版本可用性

| 版本 | 本机 | 结论 |
|---|---|---|
| MySQL 5.6.50 | 无 | **BLOCKED**（无法在精确版本实测） |
| MySQL 5.7.26 | 有（`D:\phpstudy_pro\Extensions\MySQL5.7.26`） | 用于“更老的 5.x”兼容验证 |
| MySQL 8.0.12 | 有 | 本轮未用（F-23 已覆盖 5.7 与 8.4） |
| MySQL 8.4.13 | 有（3307） | 用于当前目标版本验证 |

因此：**生产精确版本 5.6.50 = BLOCKED**；以下 PASS 结论仅代表 5.7.26 / 8.4.13 + 真实生产表结构副本，不能表述为“5.6.50 已验证”。

## 3. 测试库与 schema

- 5.7.26：`morris_r43`（导入 `04_database/01_schema.sql`，1,000 行 `snsii_manage`）。
- 8.4.13：`morrishk_r43_schema`（同一 dump，1,000 行）。
- 两个库的 `snsii_manage` 均为 **MyISAM**，与生产一致。
- 迁移脚本：`db/2026-11-25_auth_key_version.sql`（与 Round 41 相同）。
- 回滚脚本：`db/rollback_auth_key_version.sql`。

## 4. 实测结果

### 4.1 MySQL 5.7.26（`evidence/mysql57_migration.txt`）

```text
server_version: 5.7.26
snsii_manage_engine: MyISAM
rows: 1000
ALTER(us): 69352
idempotent(us): 3341
rollback(us): 60123
column_after_rollback: 0
```

- 首次迁移（含创建/删除存储过程 + `ALTER TABLE`）：约 **69 ms**（1,000 行）。
- 幂等复跑：约 **3.3 ms**（只做 `information_schema` 判断）。
- 回滚：约 **60 ms**。
- 结构：`AuthKeyVersion int(11) NOT NULL DEFAULT 0`。

### 4.2 MySQL 8.4.13（`evidence/mysql84_migration.txt`）

```text
server_version: 8.4.13
snsii_manage_engine: MyISAM
rows: 1000
ALTER(us): 359920
idempotent(us): 144056
rollback(us): 433261
column_after_rollback: 0
```

- 8.4 的 DDL 明显慢于 5.7（MyISAM 表复制 + 元数据开销），但仍在亚秒级。
- 兼容：`int(8)` 显示宽度在 8.4 被接受（有弃用语义），`utf8` 解析为 `utf8mb3`。
- 迁移后 `SHOW COLUMNS` 返回 `int`，默认 `0`。

### 4.3 表锁等待（5.7.26，`evidence/mysql57_lock_and_privilege.txt`）

```text
ALTER_under_global_read_lock(us): 7708052
```

- 在另一个会话持有 `FLUSH TABLES WITH READ LOCK` 时，迁移等待约 **7.7 s** 才执行。
- 说明 MyISAM 的 `ALTER TABLE ADD COLUMN` 不是在线 DDL，会与表/全局锁冲突，必须在维护窗口执行。
- 正常无竞争时：69 ms（5.7）/ 360 ms（8.4，1,000 行）。

### 4.4 最小权限迁移账号（5.7.26）

可用权限集：

```text
GRANT SELECT, ALTER, EXECUTE, CREATE ROUTINE, ALTER ROUTINE ON `morris_r43`.* TO 'r43_mig'@'127.0.0.1'
```

- 使用该账号执行迁移：**exit 0**，列创建成功。
- 撤销 `CREATE ROUTINE` 后再执行：**exit 1**，在 `CREATE PROCEDURE` 处报
  `ERROR 1044 Access denied ... to database 'morris_r43'`。
- 使用该账号执行回滚（`ALTER TABLE DROP COLUMN`）：**exit 0**。

结论：生产迁移账号至少需要 `SELECT, ALTER, EXECUTE, CREATE ROUTINE, ALTER ROUTINE`；
不需要 `SUPER`、`GRANT OPTION`、`FILE`、`CREATE`、`DROP`（表级）。

## 5. 迁移失败与恢复流程

1. **前置备份**：`mysqldump --single-transaction` 对 `snsii_manage` 不适用（MyISAM），需使用
   `--lock-tables` 或停机窗口内的物理/逻辑备份；至少导出 `snsii_manage` 全表与 `AuthKeyVersion` 状态。
2. **维护窗口**：MyISAM `ALTER TABLE` 会持有表级锁；避免与写入并发。
3. **失败处理**：MyISAM 的 `ALTER TABLE` 通过临时表重建，失败通常保留原表；但仍以备份为准。
   若进程被强杀/磁盘满，先 `CHECK TABLE snsii_manage`，必要时从备份恢复。
4. **应用侧 fail closed**：缺少 `AuthKeyVersion` 列时，登录/持久登录直接失败（503/校验 false），
   不会静默降级为无吊销。因此迁移失败不会造成“看似正常但无吊销”的状态。
5. **回滚顺序**：先回滚应用代码（不再依赖列），再执行 `rollback_auth_key_version.sql`；
   删除列会丢失版本信息，旧 Cookie 的吊销能力同时消失，需在确认不需要吊销时执行。
6. **重试**：迁移脚本幂等，可在修复权限/连接后直接重跑。

## 6. 结论

| 项 | 结果 |
|---|---|
| 生产 schema 结构核实 | PASS（MyISAM / utf8 / 31 表，来自既有 dump） |
| MySQL 5.7.26 + 真实结构 | PASS（迁移/幂等/回滚/耗时/锁等待/最小权限） |
| MySQL 8.4.13 + 真实结构 | PASS（迁移/幂等/回滚/耗时） |
| MySQL 5.6.50 精确版本 | **BLOCKED**（本机无该版本） |
| 生产执行 | **未执行** |

不得把本节的 5.7/8.4 结果表述为“生产 5.6.50 已验证”；生产执行前仍需在 5.6.50 的备份副本上复跑一次。
