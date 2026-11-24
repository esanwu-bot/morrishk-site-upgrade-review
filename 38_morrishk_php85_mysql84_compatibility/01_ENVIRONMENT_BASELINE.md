# 01 环境与基线

## 1. 应用代码基线（Round 37 核对）

| 项 | 值 |
|---|---|
| 仓库 | `morrishk-site` |
| 分支 | `fix/morrishk-v1-runtime-defects` |
| Round 37 提交 | `23f9986902edfe971fcf963137162466c775cdf5` |
| 父提交 | `af4765f81509ef1d1e58b0104f59ba9963e2c37b` |
| 远端 | `origin/fix/morrishk-v1-runtime-defects` = `23f9986` |
| 依据 | `37_morrishk_v1_final_acceptance/06_COMMITS_AND_DELIVERY.md` |

本轮**未覆盖任何既有分支**，未 `amend`、未 `rebase`。在基线提交上新建隔离 worktree：

| 项 | 值 |
|---|---|
| worktree | `E:\workspace\独立站\morrishk-site-r38-wt` |
| 新分支 | `test/morrishk-r38-php85-mysql84` |
| HEAD | `23f9986`（与 Round 37 完全一致） |
| 变更 | 无（本轮未修改应用源码） |

## 2. 依赖清单哈希

| 文件 | SHA256 |
|---|---|
| `composer.json` | `D0BDB9B7869FBE8FA004B5A123BA9A0E419B915AA48C5CCE772A68134DA322DA` |
| `composer.lock` | `86E058AEDDCEEBAED6C4F81C807AE625BF7B553149A9B9FB3BA7DFFA20638E4D` |

## 3. PHP 运行环境

| 项 | 值 |
|---|---|
| 可执行文件 | `D:\dev\php\php-8.5.13\php.exe` |
| 版本 | PHP 8.5.13 (cli) NTS Visual C++ 2022 x64 |
| 配置 | `D:\dev\php\php-8.5.13\php.ini`（`php --ini` 仅加载这一份） |
| 扩展目录 | `D:/dev/php/php-8.5.13/ext` |
| 已启用扩展 | curl、exif、fileinfo、gd、intl、mbstring、mysqli、openssl、PDO、pdo_mysql、sockets、sodium、zip、Zend OPcache |
| 时区 | UTC |
| Composer | `D:\dev\tools\composer.phar` 2.11.2（2026-11-10），以 PHP 8.5.13 运行 |

未修改系统 `PATH`，未卸载 PHP 7.3/7.4/8.0；应用调用一律使用上述绝对路径。

## 4. MySQL 运行环境

| 项 | 值 |
|---|---|
| 实例 | MySQL 8.4.13 Community，`127.0.0.1:3307` |
| 服务 | `MySQL84LTS`（本机独立实例，非 phpstudy） |
| 服务器字符集 | `utf8mb4` / `utf8mb4_0900_ai_ci` |
| 时区 | `+00:00` |
| `sql_mode` | `ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION` |
| 默认隔离级别 | `REPEATABLE-READ` |

### 4.1 账号与权限边界

| 账号 | 来源 | 权限 | 用途 |
|---|---|---|---|
| `morrishk_app` | 127.0.0.1 | `SELECT/INSERT/UPDATE/DELETE` on `morrishk_%`.* | **仅应用运行**（本轮 HTTP/PDO 测试全部使用该账号） |
| `morrishk_migrator` | 127.0.0.1 | 仅测试库 `morrishk_r38_php85`.* 的 DDL | 本轮建库/导入结构/应用 `db/2026-11-24_cart_owner.sql`，用后保留但不在应用配置中使用 |
| `root` | localhost | 管理 | 仅运维，未进入任何应用配置 |

未通过扩大 `morrishk_app` 权限解决 DDL 需求；应用配置只引用 `morrishk_app`。

### 4.2 隔离测试库

| 项 | 值 |
|---|---|
| 库名 | `morrishk_r38_php85` |
| 字符集 | `utf8mb4` / `utf8mb4_0900_ai_ci` |
| 结构来源 | `04_database/01_schema.sql` + `04_database/05_other_objects.sql`（MySQL 5.6.50 导出，31 表） |
| 应用迁移 | `db/2026-11-24_cart_owner.sql`（新增 `OwnerUserId`） |
| 合成数据 | 商家 id=0、大类 3801、小类 3802、产品 38000001（`R38-TEST-0001`） |
| 生产数据 | 未使用、未读取、未写入 |

## 5. `morrishk_r38` 库的归属核对

| 检查 | 结果 |
|---|---|
| 表清单 | 30 张 `snsii_*` 表，与 `04_database/01_schema.sql` 一致 |
| 创建时间 | 2026-11-24 13:37（账号）/ 13:39:41–13:39:51（表） |
| 数据 | `snsii_cart` 16 行、`snsii_manage` 3 行、`snsii_product` 2 行等，属既有站点库的恢复测试数据 |
| 判定 | **属于 Session A 既有测试数据**（Round 38 前置的库恢复试验） |
| 本轮处置 | 未删除、未清空、未覆盖；未解锁其账号（`morrishk_r38` 仍为 `ACCOUNT LOCK`） |

是否保留由 Owner/Reviewer 决定；建议在确认 Round 38 不再需要后另行清理，清理前先导出留档。

## 6. 测试入口（不属于应用仓库）

| 文件 | 作用 |
|---|---|
| `D:\dev\tmp\router_r38.php` | PHP 内置服务器入口：从受 ACL 保护的文件读取应用账号口令，设置 `MORRISHK_*` 环境变量，测试引导三项调整 |
| `D:\dev\tmp\seed_r38.php` | 合成数据写入（应用账号，仅 DML） |
| `D:\dev\tmp\mysql_r38_test.php` | MySQL 8.4 兼容性测试（应用账号） |

凭据文件位于 `D:\dev\mysql\credentials\`，ACL 仅当前管理员可读；本包、日志与命令历史中均无明文口令。
