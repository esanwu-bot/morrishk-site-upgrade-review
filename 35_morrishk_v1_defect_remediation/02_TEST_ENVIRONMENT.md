# 02 测试环境（PHP 7.4）

## 1. 版本与路径

| 项 | 值 |
|---|---|
| 运行副本 | `E:\workspace\独立站\morrishk-site-runtime-wt-session-a` |
| 副本 HEAD | `d74011209f57fb138cc30762f32399255b52e27d`（detached） |
| 修复分支 | `fix/morrishk-v1-runtime-defects`（应用仓库 worktree） |
| PHP | **7.4.3 NTS**（`D:\phpstudy_pro\Extensions\php\php7.4.3nts\php.exe`） |
| 生产 PHP（文档口径） | 7.4.33 |
| Composer | 2.5.8 |
| MySQL | 8.0.12（`127.0.0.1`，库 `morrishk_demo`） |
| Web 服务器 | PHP 内置服务器 `php -S 127.0.0.1:8094 -t web web/router.php` |
| 证据目录 | `...\runtime\evidence74\` |

**版本差异（必须明示）**：本机为 PHP 7.4.3，生产为 7.4.33，同属 7.4 次版本但 patch 不同。
本轮结论只代表 **PHP 7.4 系列**运行结果，不等价于 7.4.33 逐补丁验证。

## 2. lock 完整性

```
composer.lock  SHA256 = 86E058AEDDCEEBAED6C4F81C807AE625BF7B553149A9B9FB3BA7DFFA20638E4D
composer.json  SHA256 = D0BDB9B7869FBE8FA004B5A123BA9A0E419B915AA48C5CCE772A68134DA322DA
```

- 两文件在运行副本中与基线一致，`git status` 仅显示测试专用改动（见 §4）。
- `vendor/yiisoft/yii2/Yii.php` 存在；lock 内 71 个包全部落地。
- `google/apiclient-services`：**内容完整**，25,375 个文件，含真实 `composer.json`、`src/`、`autoload.php`；PSR-4 映射已生成：

```
'Google\\Service\\' => array($vendorDir . '/google/apiclient-services/src'),
```

### 2.1 依赖落地方式（如实记录）

本机标准 `composer install` 在上一轮已证实会卡在 `google/apiclient-services`（25,957 个条目，Defender 扫描下解压约 25 文件/秒）。本轮沿用并完成了同一策略：

1. 按 `composer.lock` 的 `dist.reference` 从 Composer 缓存取精确版本；
2. 手工解压到 `vendor/`（zip 根目录剥离），生成 `vendor/composer/installed.json`；
3. `composer dump-autoload --no-scripts` 生成自动加载。

**未修改 composer.json / composer.lock，未升级任何依赖**。但本轮同样**没有**跑通标准 `composer install` 的完整流程，因此不得把本轮环境描述为「标准 Composer 安装成功」。

## 3. 非生产数据与 Mock

- 数据库：`morrishk_demo`（本地，31 表），非生产数据。
- 产品：`1 M4T28-BR12SH1`、`2 STM32F103C8T6`；分类 32/33/3301/3302/3303。
- 产品图片测试数据：产品 1 绝对 URL；产品 2 相对路径（用于验证补全逻辑）。
- 邮件：`config/web.php` 中 `useFileTransport=true`、`fileTransportPath=@runtime/mail`，Mock 落地 `.eml`，无 SMTP 出网。
- 第三方询盘：未调用。

## 4. 副本内测试专用改动（不提交）

| 文件 | 改动 |
|---|---|
| `config/web.php` | `mailer.useFileTransport=true` + `fileTransportPath=@runtime/mail` |
| `web/index.php` | `YII_DEBUG=false`、`YII_ENV=prod`（与生产一致；PHP 7.4 默认 `error_reporting=32759`，未再额外屏蔽） |
| `web/router.php` | 新增（内置服务器前端控制器，归一化 `SCRIPT_NAME/SCRIPT_FILENAME/PHP_SELF`） |

## 5. 启动命令

```powershell
cd 'E:\workspace\独立站\morrishk-site-runtime-wt-session-a'
$env:MORRISHK_DB_DSN='mysql:host=127.0.0.1;dbname=morrishk_demo'
$env:MORRISHK_DB_USERNAME='root'
$env:MORRISHK_DB_PASSWORD='root'
$env:MORRISHK_COOKIE_VALIDATION_KEY='local-demo-cookie-key-0123456789abcdef'
$env:MORRISHK_SMTP_HOST='127.0.0.1'
$env:MORRISHK_MAIL_FROM='no-reply@example.invalid'
& 'D:\phpstudy_pro\Extensions\php\php7.4.3nts\php.exe' -S 127.0.0.1:8094 -t web web/router.php
```

## 6. 环境判定

| 项 | 判定 |
|---|---|
| 独立非生产副本 | PASS |
| PHP 7.4 系列 | PASS |
| 与生产 7.4.33 完全一致 | **FAIL/部分满足**（本机 7.4.3） |
| lock 未修改 | PASS |
| 依赖内容完整 | PASS |
| 标准 composer install 跑通 | **NOT_TESTED / 未达成**（见 §2.1） |
| Mock 邮件 | PASS |
