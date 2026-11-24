# 09 错误报告审计（E_DEPRECATED 与 22527）

## 1. 位掩码对照（PHP 8.5.13）

| 常量 | 值 | 说明 |
|---|---|---|
| `E_ALL` | **30719** | 8.5 的 E_ALL（不含已移除的 E_STRICT） |
| `E_DEPRECATED` | **8192** | 弃用（用户级为 16384） |
| `E_WARNING` | 2 | 运行时警告 |
| `E_NOTICE` | 8 | 提示 |
| **22527** | `E_ALL & ~E_DEPRECATED` | `30719 - 8192 = 22527`，二进制 `101011111111111` |
| `E_STRICT` | 2048 | 8.4 起已移除，不在 E_ALL 中 |

`evidence/error_reporting_bitmask.txt`。

## 2. 为什么 Codeception 需要 22527

- `vendor/codeception/codeception/src/Codeception/Subscriber/Console.php:731` 使用反引号运算符探测终端宽度（`command -v tput …`）。
- PHP 8.5 将反引号运算符标记为弃用；Codeception 自身的错误处理把该弃用当作错误抛出，导致 `run` 直接失败（`Console.php line 731`）。
- 这是**工具链自身问题**，与被测应用无关。使用 `-d error_reporting=22527` 只在测试运行器进程中屏蔽 `E_DEPRECATED`。

运行命令：

```
php -d register_argc_argv=1 -d error_reporting=22527 vendor/bin/codecept run Unit
```

## 3. 被测 Web 进程配置

| 项 | 值 | 来源 |
|---|---|---|
| `error_reporting` | **30719（E_ALL）** | `D:\dev\php\php-8.5.13\php.ini` |
| `display_errors` | `STDOUT`（CLI/内置服务器） | 同上 |
| `log_errors` | `On` | 同上 |
| `error_log` | `D:/dev/php/php-8.5.13/logs/php_errors.log` | 同上 |
| `YII_DEBUG` / `YII_ENV` | **false / prod**（默认） | `web/index.php` |
| 应用错误处理器 | Yii 原生，未覆盖 | — |
| `errorAction` | 启用（`site/error`，专用布局） | `config/web.php` |

`evidence/php_ini_error_flags.txt`。

## 4. Web 运行时是否仍报 E_DEPRECATED

统计对象：`php_errors.log` 中提到应用 worktree 的条目。

| 范围 | 数量 |
|---|---|
| 全量（含修复前历史） | 630 |
| 其中来自 `vendor/` | 630 |
| 其中来自应用源码（controllers/models/views/…） | **0** |
| 修复完成窗口（07:25 UTC 之后） | **0** |

结论：
- 应用源码在已测路径上没有 Deprecated/Warning/Notice；
- 630 条历史弃用全部来自 vendor（Yii 旧版本等），且全部发生在修复前；
- 修复后窗口为 0，说明依赖升级 + 代码修复已消除已测路径的弃用。

Yii 日志侧同样为 0：修复后未出现 `ErrorException:8192`（见 `evidence/php85_deprecation_web.txt`）。

## 5. 应用层是否被抑制

| 检查 | 结果 |
|---|---|
| 应用是否设置 `error_reporting` / `ini_set` 屏蔽弃用 | 否（未在代码中出现） |
| 应用是否覆盖 `set_error_handler` | 否 |
| 测试入口是否覆盖错误处理器 | 否（Round 39 已移除） |
| 是否关闭 `errorAction` | 否 |
| 22527 是否用于 Web 进程 | **否**，仅用于 Codeception 运行器 |

## 6. 仍存在的第三方弃用（非应用代码）

CLI 加载时可见：`google/apiclient 2.12.1`、`guzzlehttp/promises 1.5.1`、`tightenco/collect 8.78.0`、`opis/closure 3.6.3` 的隐式 nullable 弃用。这些不在已测 Web 路径中，已在 `07_REMAINING_RISKS.md` 登记，未通过任何方式隐藏。
