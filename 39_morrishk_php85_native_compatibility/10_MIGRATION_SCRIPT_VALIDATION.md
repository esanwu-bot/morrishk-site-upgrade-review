# 10 F-06 迁移脚本补充验证

仅在独立测试库执行；未触碰生产库，应用账号未获得 DDL 权限。

## 1. 环境

| 项 | 值 |
|---|---|
| 测试库 | `morrishk_r39_mig`（utf8mb4_0900_ai_ci） |
| 结构来源 | `04_database/01_schema.sql`（31 表，源 MySQL 5.6.50） |
| 迁移脚本 | `db/2026-11-24_cart_owner.sql`（存储过程 + `information_schema` 判断） |
| 迁移账号 | `morrishk_migrator@127.0.0.1`（仅测试库 DDL，凭据不入 Git） |
| 应用账号 | `morrishk_app@127.0.0.1`（仅 DML） |

## 2. 场景与结果

| # | 场景 | 操作 | 结果 |
|---|---|---|---|
| 1 | 迁移前结构 | 导入 31 表后查询 | 无 `OwnerUserId`，无 `idx_owner` |
| 2 | 空数据库首次迁移 | 首次执行脚本 | **exit=0**，列 + 索引创建成功 |
| 3 | 重复执行（列/索引均存在） | 再次执行 | **exit=0**，无报错、无重复 |
| 4 | 部分迁移（仅删索引） | `DROP INDEX idx_owner` 后执行 | **exit=0**，索引被补回 |
| 5 | 权限不足 | 用 `morrishk_app` 执行 `ALTER TABLE` | **exit=1**，`ERROR 1142 ALTER command denied` |
| 6 | 迁移后结构核验 | 查询 `SHOW COLUMNS` / `SHOW INDEX` | `OwnerUserId int NOT NULL DEFAULT 0` + `idx_owner(OwnerUserId)` |

原始输出：`evidence/migration_validation.log`。

## 3. 幂等实现要点

```sql
IF NOT EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = DATABASE() AND table_name='snsii_cart' AND column_name='OwnerUserId')
THEN ALTER TABLE `snsii_cart` ADD COLUMN ...
```

- 列存在、索引缺失 → 只补索引；
- 列与索引都存在 → 空操作；
- 不依赖 MySQL 8.0.29+ 的 `ADD COLUMN IF NOT EXISTS`（兼容性更稳）；
- 脚本尾部的 `SELECT` 作为迁移后自检输出。

## 4. 应用侧诊断

`db/check_schema.php`（CLI）：

- 表缺失 / 缺列 / 缺索引 → 中文诊断，`exit=1`；
- 全部就绪 → `SCHEMA CHECK OK`，`exit=0`；
- 询价入口 `SnSiiCart::assertOwnerColumn()` 在缺列时抛 `UserException`，避免 `UnknownPropertyException` 500。

## 5. 权限边界验证

| 检查 | 结果 |
|---|---|
| `morrishk_app` 执行 DDL | 拒绝（1142） |
| `morrishk_app` 执行 DML | 允许（询价/上传测试已使用） |
| `morrishk_migrator` 凭据落盘 | `D:\dev\mysql\credentials\morrishk_migrator.cnf`，ACL 仅本机管理员可读 |
| 凭据是否进入 Git/报告 | 否（报告只写账号名与权限，不写口令） |

## 6. 未覆盖

- 生产数据量下的迁移耗时与锁表；
- 并发执行同一迁移（两个会话同时进入存储过程）——本轮为串行验证；
- 回滚脚本（当前迁移为增量、可通过 `DROP COLUMN/INDEX` 手工回退，未纳入自动脚本）。
