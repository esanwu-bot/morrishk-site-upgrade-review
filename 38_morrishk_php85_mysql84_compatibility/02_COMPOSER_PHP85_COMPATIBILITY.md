# 02 Composer 与 PHP 8.5.13 兼容性

## 1. 标准安装结果

执行命令（工作目录为隔离 worktree）：

```
D:\dev\php\php-8.5.13\php.exe D:\dev\tools\composer.phar install --no-interaction --prefer-dist
```

### 1.1 完整安装（含 dev）：FAIL

```
Your lock file does not contain a compatible set of packages. Please run composer update.
```

| # | 包 | 锁定版本 | 平台约束 | 冲突点 |
|---|---|---|---|---|
| 1 | `codeception/module-yii2` | 1.1.5 | `php >=5.6.0 <=8.1 \| ~8.1.0` | PHP 8.5.13 不满足 |
| 2 | `phpspec/prophecy` | v1.15.0 | `php ^7.2 \|\| ~8.0, <8.2` | PHP 8.5.13 不满足 |
| 3 | `symfony/browser-kit` | v4.2.4 | `php ^7.1.3` | PHP 8.5.13 不满足 |
| 4 | `symfony/service-contracts` | v1.1.2 | `php ^7.1.3` | PHP 8.5.13 不满足 |
| 5 | `symfony/console` | v5.4.3 | 依赖 `symfony/service-contracts ^1.1\|^2\|^3` | 只能解析到 1.1.2，进而违反 PHP 约束 |

原始输出：`evidence/composer_install_devdeps_fail.log`。

处置：**未使用 `--ignore-platform-reqs`，未修改 lock，未手工覆盖 vendor**。按生产运行时只装非 dev 依赖继续验证。

### 1.2 生产依赖安装：PASS

```
... composer.phar install --no-dev --no-interaction --prefer-dist
```

- 全部非 dev 包安装完成（含 `yiisoft/yii2 2.0.44`、`swiftmailer/swiftmailer 6.3.0`、`google/apiclient 2.12.1`、`guzzlehttp/guzzle 7.4.1`、`phpoffice/phpspreadsheet 1.19.0`、`yiisoft/yii2-imagine 2.3.0`、`yiisoft/yii2-redis 2.0.17`、`yiisoft/yii2-elasticsearch 2.0.7`、`moonlandsoft/yii2-phpexcel 2.0.0`、`kartik-v/yii2-grid dev-master 09f8e76`、`egulias/email-validator 3.1.2` 等）。
- `Generating autoload files` 与 `yii\composer\Installer::postInstall` 正常结束。
- Composer 提示 `swiftmailer/swiftmailer`、`phpunit/php-token-stream` 已废弃（后者属 dev 依赖，未被安装）。
- 原始输出：`evidence/composer_install_nodev.log`。

### 1.3 平台要求检查（非 dev）

```
composer check-platform-reqs --no-dev   -> exit=0
```

| 要求 | 当前 | 结果 |
|---|---|---|
| `composer-plugin-api` | 2.11.0 | success |
| `php` | 8.5.13 | success |
| `ext-ctype / curl / dom / fileinfo / gd / json / libxml / openssl / simplexml / xml / xmlreader / xmlwriter / zip / zlib` | 8.5.13 / 1.22.8 | success |
| `ext-iconv` | — | success（由 `symfony/polyfill-iconv` 提供） |
| `ext-mbstring` | — | success（由 `symfony/polyfill-mbstring` 提供） |
| `lib-pcre` | 10.44 | success |

原始输出：`evidence/composer_platform_check.log`。

## 2. PHP 8.5 运行期弃用与告警

采集方式：测试入口以 `error_reporting(E_ALL)` 运行，弃用/告警只记录不中断（记录到独立日志），随后统计。**未通过关闭报错掩盖问题**。

| 指标 | 值 |
|---|---|
| 记录条数 | 2023（按请求重复计入） |
| 严重级别 | `Deprecated` 约 1.2k、`Warning` 约 70（其余为堆栈行） |
| 主要来源 | 见下表 |

| 次数 | 位置 | 消息摘要 |
|---|---|---|
| 215 | `vendor/egulias/email-validator/src/EmailLexer.php:275` | `utf8_encode()` 自 8.2 起弃用 |
| 172 | `vendor/yiisoft/yii2/helpers/BaseHtml.php:118` | `htmlspecialchars(): Passing null` |
| 51×5 | `vendor/yiisoft/yii2/web/HeaderCollection.php` | `ArrayAccess`/`Countable`/`IteratorAggregate` 返回类型缺 `#[\ReturnTypeWillChange]` |
| 51×5 | `vendor/yiisoft/yii2/caching/Cache.php` | 同上 |
| 48×4 | `vendor/yiisoft/yii2/base/Model.php` | 同上 |
| 38 | `vendor/yiisoft/yii2/web/CookieCollection.php` | 同上 |
| 20 | `vendor/yiisoft/yii2/web/UrlRule.php:339` | `strncmp(): Passing null` |
| 少量 | 应用代码 | `Undefined array key`/`Undefined variable`（见 06 文档） |

完整清单：`evidence/php85_deprecations.txt`。

### 2.1 关键影响

PHP 8.5 下这些弃用**本身不致命**，但 Yii2 的错误处理器会把 `E_DEPRECATED/E_WARNING/E_NOTICE` 升级为 `ErrorException`。实测后果：

- 未做入口层处理时，`/products/...`、`/big-categories/...`、404 与 403 路径都会变成 **500**；
- 其中 `yii\web\HeaderCollection`、`yii\caching\Cache` 的返回类型弃用在每次请求都会触发。

本轮在**测试入口**做“记录但不中断”处理（见 01 文档第 6 节），应用源码未改。

## 3. 最小修复建议（未执行）

按“单包、可回退”原则，不做批量升级：

1. `yiisoft/yii2` 2.0.44 → 同系列最新 2.0.x（补 `#[\ReturnTypeWillChange]` 与 null 参数处理），只升这一个包并重跑本回归。
2. `egulias/email-validator` 3.1.2 → 4.x（移除 `utf8_encode()`），需确认 `swiftmailer 6.3.0` 的兼容性。
3. dev 依赖（`codeception/*`、`phpspec/prophecy`、`symfony/browser-kit`、`symfony/console`）单独升级到支持 8.5 的版本，仅在测试环境使用。
4. `swiftmailer` 已废弃，后续迁移到 `symfony/mailer`，本轮不处理。

## 4. 未覆盖项

- 未验证 dev 测试框架（Codeception）在 PHP 8.5 下运行。
- 未验证 `google/apiclient`、`phpspreadsheet`、`elasticsearch`、`redis`、`imagine` 的深度调用路径（仅安装与平台检查通过）。
- 未做静态分析（PHPStan/Psalm）。
