# 04 Composer 补丁获取与升级（F-19）

## 1. 结论

| 包 | 升级前 | 升级后 | 目标 | 结果 |
|---|---|---|---|---|
| `yiisoft/yii2` | 2.0.53 | **2.0.55** | 修复 CVE-2026-39850 | **PASS** |
| `yiisoft/yii2-redis` | 2.0.17 | **2.0.20** | 修复 CVE-2025-48493 | **PASS** |
| 附带升级 | — | `ezyang/htmlpurifier` 4.19.0 → 4.19.1；`bower-asset/punycode` v1.4.1 → v2.3.1 | — | 间接依赖联动 |

- 未修改全局 Composer 配置；未手工覆盖 `vendor/`；未使用 `--ignore-platform-reqs`。
- 未使用 `--no-scripts` 绕过；`composer install` 正常执行。
- 本轮升级只改动 `composer.lock`（`composer.json` 约束无需变更）。

## 2. 环境

| 项 | 值 |
|---|---|
| PHP | 8.5.13 NTS（`D:\dev\php\php-8.5.13\php.exe`） |
| Composer | 2.11.2（`D:\dev\tools\composer.phar`） |
| 应用 worktree | `E:\workspace\独立站\morrishk-site-r39-wt` |
| 全局 Composer 源（未改） | `https://mirrors.aliyun.com/composer/`（Round 41 BLOCKED 的原因） |
| 本轮临时 COMPOSER_HOME | `D:\dev\tmp\r42-ch` |
| 网络 | `https://repo.packagist.org/p2/yiisoft/yii2.json` HTTP 200，含 `2.0.55` |

网络证据：`evidence/packagist_reachability.txt`。
本轮 `composer.lock` 的 unified diff：`evidence/round42_composer_lock.diff`。

## 3. 执行命令

```powershell
$php = "D:\dev\php\php-8.5.13\php.exe"
$c   = "D:\dev\tools\composer.phar"
$w   = "E:\workspace\独立站\morrishk-site-r39-wt"

# 仅本次进程使用临时 COMPOSER_HOME；不写全局配置
$env:COMPOSER_HOME = "D:\dev\tmp\r42-ch"

& $php $c update yiisoft/yii2 yiisoft/yii2-redis -W --no-interaction --working-dir=$w
& $php $c install --no-interaction --prefer-dist --no-progress --working-dir=$w
& $php $c check-platform-reqs --working-dir=$w
& $php $c audit --format=json --working-dir=$w
```

### 3.1 关键输出（`evidence/composer_update.log`）

```text
Loading composer repositories with package information
Updating dependencies
Lock file operations: 0 installs, 4 updates, 0 removals
  - Upgrading bower-asset/punycode (v1.4.1 => v2.3.1)
  - Upgrading ezyang/htmlpurifier (v4.19.0 => v4.19.1)
  - Upgrading yiisoft/yii2 (2.0.53 => 2.0.55)
  - Upgrading yiisoft/yii2-redis (2.0.17 => 2.0.20)
Writing lock file
...
Package swiftmailer/swiftmailer is abandoned, you should avoid using it. Use symfony/mailer instead.
Generating autoload files
...
Found 68 security vulnerability advisories affecting 12 packages.
```

> `swiftmailer` 的 “abandoned” 提示是既有状态，不是本轮引入。

### 3.2 安装与平台检查

```text
# evidence/composer_install_after.txt
Verifying lock file contents can be installed on current platform.
Nothing to install, update or remove
Generating autoload files
exit_code=0

# evidence/composer_platform_after.txt
composer-plugin-api  2.11.0     success
composer-runtime-api 2.2.2      success
ext-ctype            *          success provided by symfony/polyfill-ctype
ext-curl             8.5.13     success
ext-dom              20031129   success
ext-fileinfo         8.5.13     success
ext-gd               8.5.13     success
ext-iconv            *          success provided by symfony/polyfill-iconv
exit_code=0
```

### 3.3 审计对比

| 口径 | 升级前（Round 41 记录） | 升级后（本轮实测） |
|---|---|---|
| 受影响包数 | 14 | **12** |
| advisory 条数 | 70 | **68** |
| `yiisoft/yii2` advisory | 有（2.0.53 受影响） | **0** |
| `yiisoft/yii2-redis` advisory | 有（2.0.17 受影响） | **0** |

升级后仍存在的 advisory（按包，条数）：

```text
firebase/php-jwt: 2
guzzlehttp/guzzle: 14
guzzlehttp/psr7: 4
league/flysystem: 1
phpoffice/phpspreadsheet: 31
phpseclib/phpseclib: 6
phpunit/phpunit: 1
psy/psysh: 1
symfony/dom-crawler: 1
symfony/polyfill-intl-idn: 1
symfony/yaml: 5
yiisoft/yii2-gii: 1
```

- 目标 CVE（yii2 / yii2-redis）在升级后不再出现在 audit 结果中。
- `yiisoft/yii2-gii` 仍余 1 条（dev 依赖，不随生产加载）。
- 其余包的风险状态见 05 文档；本轮**没有**把它们称为“已修复”。

## 4. Yii2 扩展版本约束检查

从 `composer.lock` 的实际 `require` 段提取（`evidence/composer_versions_constraints.txt`）：

| 包 | 对 `yiisoft/yii2` 的约束 | 与 2.0.55 兼容 |
|---|---|---|
| `mihaildev/yii2-ckeditor` | `*` | 是 |
| `moonlandsoft/yii2-phpexcel` | `*` | 是 |
| `yiisoft/yii2-bootstrap` | `~2.0.6` | 是 |
| `yiisoft/yii2-bootstrap4` | `~2.0` | 是 |
| `yiisoft/yii2-elasticsearch` | `~2.0.14` | 是 |
| `yiisoft/yii2-imagine` | `~2.0.0` | 是 |
| `yiisoft/yii2-redis` | `~2.0.39` | 是 |
| `yiisoft/yii2-swiftmailer` | `>=2.0.4` | 是 |
| `yiisoft/yii2-debug`（dev） | `~2.0.13` | 是 |
| `yiisoft/yii2-faker`（dev） | `~2.0.0` | 是 |
| `yiisoft/yii2-gii`（dev） | `~2.0.14` | 是 |

根 `composer.json`：`"yiisoft/yii2": "~2.0.14"`，`"yiisoft/yii2-redis": "~2.0.0"`，均允许补丁版本。

未发现任何扩展把上界锁在 `<2.0.55` 的约束；Composer 求解器也未报告冲突。

## 5. 实际版本确认

```text
Composer version 2.11.2 2026-11-10 10:09:37
yiisoft/yii2        * 2.0.55  (released 2026-05-09)
yiisoft/yii2-redis  * 2.0.20  (released 2025-06-05)
```

`composer install` 输出 `Nothing to install, update or remove`，说明 `vendor/` 与 lock 一致；
`composer show` 的 `path` 指向本项目 `vendor/`，非全局或共享目录。

## 6. 回滚方案

- 依赖回滚：`git checkout b7e8933 -- composer.lock`（或使用备份
  `D:\dev\tmp\r42_composer.lock.bak`）后执行 `composer install`。
- 本轮升级前备份：`composer.json.bak`、`r42_composer.lock.bak`（均在仓库外临时目录）。
- 回滚不影响数据库（本轮未改 schema）。

## 7. 未执行 / 边界

- 未升级 PHP 版本；PHP 仍为 8.5.13。
- 未处理其余 12 个包/68 条 advisory（本轮范围仅 yii2、yii2-redis）。
- 未在 Nginx + php-fpm 生产形态下安装；仅 PHP 内置服务器。
- 未对 `vendor/` 做字节级校验；以 `composer install` 与 `check-platform-reqs` 为准。
