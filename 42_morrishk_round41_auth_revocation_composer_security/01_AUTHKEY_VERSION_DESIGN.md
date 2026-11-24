# 01 AuthKeyVersion 设计与迁移

## 1. 模型与字段

| 项 | 值 |
|---|---|
| 身份表 | `snsii_manage`（`SnSiiManage`，实现 `IdentityInterface`） |
| 新字段 | `AuthKeyVersion int NOT NULL DEFAULT 0`（账号级吊销版本） |
| 迁移 | `db/2026-11-25_auth_key_version.sql`（`information_schema` + 存储过程，可重复执行） |
| 回滚 | `db/rollback_auth_key_version.sql`（`DROP COLUMN`，仅在确认不需要吊销时执行） |
| 生产 | **未执行**任何生产 DDL |

## 2. 语义

- **账号级、全部设备吊销**：任意设备登出 → 该账号 `AuthKeyVersion + 1` → 该账号此前签发的所有持久登录 Cookie 立即失效。
- 不提供单设备登出；若业务需要“其他设备继续有效”，应另行评估服务端票据表（本轮未实现）。
- 版本只影响持久 Cookie（`_identity`）；已建立的 PHP Session 不随版本立即失效，按 Session 生命周期自然过期（见 `03` 文档“会话边界”）。

## 3. 实现要点

1. `getAuthKey()` 读取 `AuthKeyVersion` 并纳入 HMAC 载荷。
2. `bumpAuthKeyVersion($id)` 使用 `UPDATE ... SET AuthKeyVersion = AuthKeyVersion + 1 WHERE id = :id`，返回受影响行数；≠1 即抛异常。
3. 递增发生在**服务端**，不接收任何客户端版本值。
4. 登出后调用 `Yii::$app->user->logout()`，不会再用旧模型对象生成票据。
5. `assertAuthKeyVersionColumn()`：列缺失 → `InvalidConfigException`；`validateAuthKey()` 捕获后返回 false（fail closed）。
6. 更新失败：登出返回 **503**，不执行“静默登出”，避免出现“看似已登出但旧 Cookie 仍有效”。

## 4. 迁移与回滚

升级：

```
mysql -u <migrator> -p <db> < db/2026-11-25_auth_key_version.sql
```

- 幂等：连续执行两次均 exit=0（`evidence/migration_idempotency.txt`）。
- 空表/存量账号：默认值 0，无需回填。

回滚：

```
mysql -u <migrator> -p <db> < db/rollback_auth_key_version.sql
```

回滚后旧版应用可用，但**持久 Cookie 吊销能力同时消失**，须同时回滚应用代码。

## 5. 并发与重放

| 场景 | 结果 |
|---|---|
| 两个并发登出 | 均 302；版本单调递增；旧 Cookie 失效 |
| 登出后并发旧 Cookie 请求 | 3/3 返回 302 |
| 旧 Cookie 重放 | 版本已变 → 校验失败 |
| 递增影响行数 ≠ 1 | 抛异常（fail closed） |
| AuthKeyVersion 列缺失 | 抛异常 / 校验返回 false（fail closed） |

原始输出：`evidence/revocation_matrix.txt`、`evidence/cli_checks.txt`。
