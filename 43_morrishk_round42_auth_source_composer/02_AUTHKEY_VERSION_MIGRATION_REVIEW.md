# 02 AuthKeyVersion 迁移审查材料（F-17）

## 1. 结论摘要

| 项 | 结果 |
|---|---|
| 列 `snsii_manage.AuthKeyVersion` | `int NOT NULL DEFAULT 0`，注释 `persistent login revocation version` |
| 幂等执行 | PASS：连续执行两次，列只存在一份，第二次 exit=0 |
| 回滚脚本 | PASS：删除列后表结构恢复（仅测试库） |
| 生产数据库 | **未执行**（本轮禁止）；未连接生产库 |
| 迁移账号 | `morrishk_migrator`（仅对临时库授权；口令通过 option file 传入，未打印） |

## 2. 执行环境

| 项 | 值 |
|---|---|
| 客户端 | `D:\dev\mysql\mysql-8.4.13-winx64\bin\mysql.exe` |
| 服务端 | MySQL 8.4.13，`127.0.0.1:3307`（本地实例） |
| 临时库 | `morrishk_r42_mig`（本轮为本次验证新建，非生产、非既有测试库） |
| 表 | 最小结构 `snsii_manage(id, UserName, PassWord, Status)`，仅用于验证 DDL |

> 生产库与任何既有业务库都**未**执行迁移/回滚。

## 3. 实际执行命令与结果

完整记录见 `evidence/migration_run.log`。

### 3.1 迁移前

```text
mysql --defaults-file=<migrator.cnf> morrishk_r42_mig -e "SHOW COLUMNS FROM snsii_manage"
Field       Type          Null  Key  Default  Extra
id          int           NO    PRI  NULL     auto_increment
UserName    varchar(50)   YES        NULL
PassWord    varchar(255)  YES        NULL
Status      int           NO         1
```

### 3.2 执行迁移

```text
mysql --defaults-file=<migrator.cnf> morrishk_r42_mig --execute="source D:/dev/tmp/r42_mig.sql"
COLUMN_NAME      COLUMN_TYPE  IS_NULLABLE  COLUMN_DEFAULT
AuthKeyVersion   int          NO           0
exit_code=0
```

### 3.3 幂等复跑（同一脚本第二次）

```text
COLUMN_NAME      COLUMN_TYPE  IS_NULLABLE  COLUMN_DEFAULT
AuthKeyVersion   int          NO           0
exit_code=0
```

### 3.4 迁移后的列定义

```text
`AuthKeyVersion` int NOT NULL DEFAULT '0' COMMENT 'persistent login revocation version'
```

### 3.5 回滚

```text
mysql --defaults-file=<migrator.cnf> morrishk_r42_mig --execute="source D:/dev/tmp/r42_mig_rollback.sql"
exit_code=0
```

回滚后 `SHOW COLUMNS` 只剩 `id / UserName / PassWord / Status`，`AuthKeyVersion` 已移除。

## 4. 迁移安全性说明

1. **加列不重写业务数据**：`int NOT NULL DEFAULT 0` 对既有行使用默认值；不涉及 `UPDATE` 全表。
2. **无数据迁移窗口问题**：列默认值为 0，旧版本应用即使短暂共存也不会因缺列报错
   （旧代码不读取该列）。
3. **幂等**：`information_schema.columns` 判断避免了重复 `ALTER TABLE` 失败。
4. **存储过程残留**：脚本在执行后 `DROP PROCEDURE`，不会在库中留下对象。
5. **权限要求**：执行账号需要 `ALTER`、`CREATE ROUTINE`、`DROP ROUTINE`、`SELECT`（information_schema）。
   本轮临时库使用 `ALL PRIVILEGES` 仅用于验证；生产应按最小权限单独授权。
6. **回滚风险**：删除列会使该账号所有持久 Cookie 的版本信息丢失；回滚后旧版本应用恢复可用，
   但吊销能力同时失效。回滚前必须确认不需要吊销语义。

## 5. 运行时依赖检查

- `assertAuthKeyVersionColumn()` 在每次 `getAuthKey()` 前调用；列缺失 → 抛异常 → 登录 503。
- `validateAuthKey()` 在列缺失时返回 `false`（不抛到用户层）。
- 因此：**未执行迁移的实例不会静默降级为“无吊销”**，而是登录/持久登录直接失败（fail closed）。
  这一行为已由 Round 41 的无版本库测试验证（`morrishk_r41_noversion`）。

## 6. 未测试 / 边界

- 未在生产备份副本上执行迁移耗时测量。
- 未验证 MySQL 8.0.12（旧实例）上的 `information_schema` 行为；本轮仅覆盖 8.4.13。
- 未验证 `ALTER TABLE` 期间高并发写入的锁等待时长。
