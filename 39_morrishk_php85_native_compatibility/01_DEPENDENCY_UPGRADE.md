# 01 依赖升级

## 1. 升级范围（仅 PHP 8.5 兼容所需）

| 包 | 旧 | 新 | 原因 |
|---|---|---|---|
| `yiisoft/yii2` | 2.0.44 | **2.0.53** | 唯一支持 PHP 8.5 的 2.0.x 维护线；补 `#[\ReturnTypeWillChange]` 与 null 参数处理 |
| `egulias/email-validator` | 3.1.2 | **3.2.6** | 3.2.x 已移除 `utf8_encode()`；保持 `swiftmailer ^3.1` 约束可满足 |
| `codeception/codeception` | 4.1.29 | **5.3.1** | 4.x 平台约束上限 ≤8.1 |
| `codeception/module-yii2` | 1.1.5 | **v2.0.3** | 1.x 要求 PHP ≤8.1 |
| `codeception/module-asserts` | 1.3.1 | **3.2.1** | 与 Codeception 5 配套 |
| `codeception/module-filesystem` | 1.0.3 | **3.0.2** | 同上 |
| `codeception/verify` | 1.1.0 | **3.2.0** | 同上 |
| `symfony/browser-kit` | 4.2.4 | **7.4.0** | 4.2 要求 PHP ^7.1 |
| `doctrine/lexer` | 1.2.2 | **2.1.1** | email-validator 3.2.6 传递依赖 |

### 1.1 移除的 dev 依赖

| 包 | 原因 |
|---|---|
| `codeception/specify` 0.4.6 | 最高 2.0.0 仍锁定 `phpunit ^8|^9`，与 Codeception 5 冲突；仓库内无 `tests/` 使用 |
| `phpspec/prophecy`（传递） | 随 Codeception 5 / PHPUnit 新版不再需要 |
| `codeception/phpunit-wrapper`（传递） | Codeception 5 已内置 |

### 1.2 保留不动

- `swiftmailer/swiftmailer 6.3.0` + `yiisoft/yii2-swiftmailer 2.1.3`：`email-validator` 升至 4.x 会与 `swiftmailer ^3.1` 冲突；3.2.6 已消除 `utf8_encode()` 弃用，故本轮不换邮件栈。
- `google/apiclient v2.12.1`、`guzzlehttp/guzzle 7.4.1` 等运行时包：未变更；其 PHP 8.5 弃用见 `07_REMAINING_RISKS.md`。

## 2. 变更文件

- `composer.json`：`php: >=8.1`；dev 依赖版本调整；移除 `codeception/specify`。
- `composer.lock`：定向 `composer update`（8 个直接包 + `--with-all-dependencies`），无无关全量升级。
- 完整差异：`evidence/dependency_diff.txt`。

## 3. 执行与结果

```
php composer.phar update yiisoft/yii2 egulias/email-validator \
  codeception/codeception codeception/verify codeception/module-yii2 \
  codeception/module-asserts codeception/module-filesystem symfony/browser-kit \
  --with-all-dependencies --prefer-dist
```

| 检查 | 结果 |
|---|---|
| `composer install`（含 dev） | exit=0，`Nothing to install, update or remove`（lock 完整可复现） |
| `composer check-platform-reqs`（含 dev） | 全部 success，exit=0（php 8.5.13、ext-*、lib-pcre 10.44） |
| Composer 安全审计 | 70 条 advisories / 14 个受影响包（runtime 9 包 61 条、dev 5 包 9 条），未在本轮升级，详见 `08_COMPOSER_SECURITY_AUDIT.md` |
| `php -l` | 改动的 11 个 PHP 文件全部 No syntax errors |
| Codeception | 2 tests / 6 assertions 全通过 |

原始输出：`evidence/composer_update.log`、`evidence/composer_install_verify.log`、`evidence/composer_platform_check.log`、`evidence/codecept_unit.log`。

## 4. 未使用的手段（合规声明）

- 未使用 `--ignore-platform-reqs`；
- 未手工覆盖 vendor 文件；
- 未修改 lock 之外的传递依赖版本；
- 未升级与 PHP 8.5 无关的运行时包。
