# P0-2 目标环境（PHP 7.4.33 + MySQL 5.6.50）— BLOCKED

## 1. 版本探测（`evidence/platform_probe.txt`）

| 项 | 探测结果 |
|---|---|
| PHP | 7.4.3 (cli) NTS VC15 x64；php-cgi 7.4.3 |
| MySQL | 8.0.12（`@@sql_mode` 含 `ONLY_FULL_GROUP_BY`） |
| 目标 PHP 7.4.33 | 本机 phpstudy 目录下无该版本（匹配目录数 0） |
| 目标 MySQL 5.6.50 | 本机 phpstudy 目录下无该版本（匹配目录数 0） |
| Docker | `docker` 命令不存在，无法启动隔离容器 |

未使用 PHP 7.4.3 或 MySQL 8.0.12 的测试结果替代目标版本结论。

## 2. Composer 锁文件平台检查（在 PHP 7.4.3 上）

`evidence/composer_platform_check.txt`：

- `composer check-platform-reqs` → **exit_code=0**，`php 7.4.3 success`，所有扩展 success（ext-ctype/curl/dom/fileinfo/gd/json/libxml/openssl/simplexml/xml/xmlreader/xmlwriter/zip/zlib、lib-pcre 10.33）。
- 全程未使用 `--ignore-platform-reqs`。
- 注意：这只能证明“锁文件在 7.4.3 上可解析/可安装”，**不能**证明 7.4.33 的目标平台通过。

## 3. 标准依赖安装

`evidence/composer_install.txt`：

- 命令：`php composer.phar install --no-dev --no-scripts --no-interaction`（干净副本，lock 驱动）
- 结果：71 个运行时包安装成功，`vendor/autoload.php` 生成。
- 追加 `composer install --dry-run`：仍提示 60 个 **require-dev** 包未安装（codeception/phpunit/gii/debug 等），运行时依赖集合完整。

## 4. Composer scripts：是否执行与影响

- **未执行**：安装使用 `--no-scripts`。
- 原因：`post-install-cmd` / `post-create-project-cmd` 会运行 vendor 内脚本并改写应用源码与目录权限，Review 环境不允许第三方安装钩子修改检出树。
- 未执行项与影响：

| 脚本 | 实际作用 | 影响 | 处置 |
|---|---|---|---|
| `yii\composer\Installer::postInstall` | `generateCookieValidationKey` 写入 `config/web.php` | `cookieValidationKey` 为空，Cookie 签名不可用 | 所有验证运行通过 `MORRISHK_COOKIE_VALIDATION_KEY` 环境变量注入；生产需在生产机执行一次或同样用环境变量 |
| `yii\composer\Installer::postCreateProject` | 脚手架/目录权限（runtime 0777、web/assets 0777、yii 0755） | 目录权限未自动设置 | 测试前显式创建 `runtime/{logs,cache,uploads,audit}`、`web/assets` 并确保可写 |
| `post-create-project-cmd` 整体 | 新项目初始化 | 对既有应用无实际作用 | 不适用 |

## 5. 目标环境必须完成、但本轮无法获得的验证

按指令要求，以下项目**未在目标版本执行**，因此整体保持 BLOCKED：

1. PHP 7.4.33 版本确认；
2. MySQL 5.6.50 版本确认；
3. 在 7.4.33 上重跑 `composer check-platform-reqs` 与 `composer install`；
4. 在 MySQL 5.6.50 上建表、执行 `db/2026-11-24_cart_owner.sql`、询价写入、附件登记、后台查询；
5. 在目标组合上重跑核心回归矩阵。

## 6. 已完成的等价替代与不等价说明

- 已完成（PHP 7.4.3 + MySQL 8.0.12）：建表与 `OwnerUserId` 迁移、询价写入、附件登记、后台查询、下载授权矩阵、Nginx 路由矩阵、CKEditor 页面。
- 不等价风险：
  - MySQL 5.6 不支持部分 8.0 默认行为；本测试通过 `SET SESSION sql_mode=...` 放宽 `ONLY_FULL_GROUP_BY` 仅是**测试期兼容**，不代表 5.6 语义一致。
  - PHP 7.4.33 相对 7.4.3 为补丁版本，理论上兼容，但未实测。

结论：**P0-2 = BLOCKED**，不得以 7.4.3 / 8.0.12 结果声明目标环境通过。
