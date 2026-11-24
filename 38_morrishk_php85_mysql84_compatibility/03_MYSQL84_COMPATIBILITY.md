# 03 MySQL 8.4.13 兼容性

## 1. 初始化与结构导入

| 项 | 结果 |
|---|---|
| 目标库 | `morrishk_r38_php85`（utf8mb4 / utf8mb4_0900_ai_ci） |
| 结构来源 | `04_database/01_schema.sql` + `05_other_objects.sql`（源库 MySQL 5.6.50，31 表） |
| 导入结果 | **成功，31 表**，`mysql` 退出码 0 |
| 迁移脚本 | `db/2026-11-24_cart_owner.sql` 执行成功，`snsii_cart.OwnerUserId` 已存在 |

导入期告警（`evidence/schema_import.log`）：

| 代码 | 次数 | 内容 |
|---|---|---|
| 3719 | 每表 1 次 | `'utf8'` 目前是 UTF8MB3 别名，未来会变为 UTF8MB4，建议显式使用 utf8mb4 |
| 1681 | 多处 | `int(11)` 等整型显示宽度已弃用，未来版本移除 |

无错误、无失败表、无外键/视图/触发器/存储过程（`05_other_objects.sql` 说明源库本无这些对象）。

## 2. 引擎与排序规则

| 指标 | 值 |
|---|---|
| MyISAM | 30 表 |
| InnoDB | 1 表（`snsii_product_so`） |
| 表排序规则 | `utf8mb3_general_ci` 31 表 |
| 库排序规则 | `utf8mb4_0900_ai_ci` |

## 3. 兼容性测试结果

测试脚本以**应用账号**（仅 DML）执行，原始输出：`evidence/mysql84_compat.txt`。

| 用例 | 结果 | 说明 |
|---|---|---|
| 服务器版本/隔离级别/字符集 | 8.4.13 / REPEATABLE-READ / utf8mb4 | 正常 |
| `sql_mode` | 严格模式（含 `ONLY_FULL_GROUP_BY`、`STRICT_TRANS_TABLES`、`NO_ZERO_DATE`） | 与 5.6 默认不同 |
| CRUD：INSERT / UPDATE / DELETE | **PASS** | 自增主键、`lastInsertId` 正常 |
| 事务回滚（MyISAM） | **NOT_ROLLED_BACK** | `rollBack()` 后行仍存在（MyISAM 不支持事务） |
| 事务（InnoDB 表） | 引擎存在：`snsii_product_so` | 该表可用于需要事务的新逻辑 |
| utf8mb3 存 4 字节字符 | **REJECTED** `1366 Incorrect string value` | Emoji 无法写入 `Company` 等 utf8mb3 列 |
| 严格模式缺 NOT NULL 列 | **REJECTED** `1364 Field 'AddDate' doesn't have a default value` | 5.6 非严格模式下会被填默认值/零值 |
| 唯一约束（`PartNumber`） | **REJECTED** `1062 Duplicate entry` | 唯一索引行为正常 |
| 保留字列名（`Number`/`Sort`/`Pid`） | **PASS** | 反引号引用正常 |
| 隐式类型转换 | `PartNumber = 38000001` 返回 0 行、无错误 | 字符串列与整型比较不发生报错，但也不匹配 |
| 隔离级别切换 | READ COMMITTED / REPEATABLE READ / SERIALIZABLE 均可设置 | `SET SESSION TRANSACTION ISOLATION LEVEL` 正常 |
| 中文/多语言内容 | 页面与库内 utf8mb3 列正常读写 | 未做 4 字节字符场景 |

## 4. 事务与并发要点

1. **30/31 表为 MyISAM**：询价、商品、分类等主流程表均不支持事务。当前代码依赖逐条写入，一旦中途失败无法回滚。
2. `snsii_cart` 是 MyISAM：询价写入后立即生效，与 Round 37 的行为一致；本轮实测插入后立即可查。
3. InnoDB 仅 `snsii_product_so`，若未来引入“先写事件表再写业务表”的原子流程，需要新表或改引擎。
4. 并发压测未在本轮执行（单机内置服务器，无法构造可信并发证据）。

## 5. 与 MySQL 5.6 目标库的差异（本轮实测相关）

| 差异 | 5.6 | 8.4（本轮） | 影响 |
|---|---|---|---|
| 默认 `sql_mode` | 宽松 | 严格 + `ONLY_FULL_GROUP_BY` | 缺列/零日期/非聚合列查询会报错 |
| `utf8` 语义 | utf8mb3 | utf8mb3（别名，将变 utf8mb4） | 4 字节字符仍不可写；未来升级语义变化 |
| 整型显示宽度 | 有效 | 弃用 | `int(11)` 建表告警，功能不受影响 |
| 认证插件 | `mysql_native_password` | 默认 `caching_sha2_password` | 旧客户端/驱动需支持 TLS 或 RSA 交换 |
| 保留字 | 较少 | 增多（如 `rank`、`groups` 等） | 现有 schema 未使用新保留字，反引号写法安全 |
| 事务引擎 | MyISAM 常见 | 默认 InnoDB，但本 schema 仍是 MyISAM | 迁移不会自动改变引擎 |

## 6. 未覆盖项

- 未做 5.6 → 8.4 的真实数据迁移演练（只导入结构，未迁移生产数据）。
- 未做并发/锁等待/死锁实测。
- 未验证 `utf8mb4` 改造后全站排序与索引长度限制（`utf8mb4` 会使索引前缀更长）。
- 未做备份/恢复演练。
