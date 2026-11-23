# 01 测试环境说明（独立运行副本）

## 1. 副本信息

| 项 | 值 |
|---|---|
| 副本绝对路径 | `E:\workspace\独立站\morrishk-site-runtime-wt-session-a` |
| 建立方式 | `git clone --local` 自原工作区，再 `git checkout --detach d80491b` |
| Git 分支 | detached HEAD（无本地分支） |
| HEAD SHA | `d80491bcbb0efe4d930a333308a9ffef599c4318` |
| 原工作区 | `E:\workspace\独立站\morrishk-site`（未被修改；其未跟踪 `web/router.php` 仍保留） |
| PHP | 8.0.2 NTS（`D:\phpstudy_pro\Extensions\php\php8.0.2nts\php.exe`） |
| 备用 PHP | 7.3.4 NTS（因依赖平台约束要求 PHP ≥ 7.4，无法启动，见 §5） |
| Composer | 2.5.8（`D:\phpstudy_pro\Extensions\composer2.5.8\composer.phar`） |
| MySQL | 8.0.12，`127.0.0.1`，测试库 `morrishk_demo` |
| Web 服务器 | PHP 内置服务器 `php -S 127.0.0.1:8093 -t web web/router.php` |

## 2. 依赖与 lock 完整性

```
composer.lock  SHA256 = 86E058AEDDCEEBAED6C4F81C807AE625BF7B553149A9B9FB3BA7DFFA20638E4D
composer.json  SHA256 = D0BDB9B7869FBE8FA004B5A123BA9A0E419B915AA48C5CCE772A68134DA322DA
```

- `git status --short` 在副本中仅显示 3 项测试专用改动（见 §4），**`composer.json` 与 `composer.lock` 未被修改**，上述哈希与基线一致。
- `vendor/autoload.php`：存在
- `vendor/yiisoft/yii2/Yii.php`：存在
- `vendor` 顶层命名空间目录数：30，lock 内 71 个包全部落地

### 2.1 `composer install` 实际结果（如实记录）

标准命令：

```powershell
composer install --no-scripts --no-interaction --prefer-dist --no-dev --ignore-platform-reqs
```

结果：**未能在本机完成**。

- 首个失败点：默认源 `api.github.com` 下载速度约 12–40 KB/s。
- 阻断点：`google/apiclient-services v0.355.0` 含 25,957 个文件；本机（Windows Defender 实时扫描）解压速度约 25 文件/秒，单包解压 > 15 分钟且无进展；Composer 在 “Extracting archive” 阶段长时间挂起。
- 全程未修改 lock、未升级任何依赖。

采用的等价方案（保持 lock 精确引用）：

1. 依据 `composer.lock` 的 `dist.reference`，将各包原始 zip 预置到 Composer 全局缓存 `%LOCALAPPDATA%\Composer\files\<vendor>/<pkg>/<ref>.zip`；
2. 以 lock 为准手工解压到 `vendor/`（脚本按 zip 根目录剥离），并生成 `vendor/composer/installed.json`；
3. `composer dump-autoload --no-scripts` 生成自动加载（日志：`Generated autoload files`）。

结果：70 个包内容完整；`google/apiclient-services` 仅落地 `composer.json`（占位，`src/` 与 `autoload.php` 为空占位）。

**影响评估**：被测页面（首页/分类/PDP/搜索/询价/成功页）不加载该包任何类；`Google\Service\*` 不可用不影响 R1–R5。该偏差已在此处明示，不计为通过。

## 3. 数据库（非生产）

- 库名：`morrishk_demo`（本地实例，31 张表）
- 数据来源：`04_database/01_schema.sql` + 本地种子（非生产数据）
- 产品：`id=1 M4T28-BR12SH1`、`id=2 STM32F103C8T6`（均 `IsPut=1`，`BigCat=32`，`SmallCat=3301`）
- 分类：`32 Electronic Components`、`33 Semiconductor Solutions`、`3301 Integrated Circuits`、`3302 Passive Components`、`3303 Connectors & Switches`
- 为验证 JSON-LD `image` 分支，测试库中：
  - 产品 1 `Image=https://cdn.example.invalid/img/M4T28-BR12SH1.jpg`（绝对地址）
  - 产品 2 `Image=/uploads/STM32F103C8T6.jpg`（相对地址，用于暴露风险）
- `snsii_product_cache` 为空（确保 PDP 走数据库查询分支）

## 4. 副本内测试专用改动（不进入基线）

| 文件 | 改动 | 原因 |
|---|---|---|
| `web/index.php` | `YII_ENV` 改 `prod`；`YII_DEBUG` 改 `false`；加入 `error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING & ~E_DEPRECATED)` | 本机 PHP 8 将 7.4 的 Notice 升级为 Warning/异常；此设置对齐生产 7.4 的报错严重度。另含临时 `runtime/debug_req.log` 路由诊断 |
| `config/web.php` | `mailer.useFileTransport=true`、`fileTransportPath=@runtime/mail` | Mock Inquiry Mail Adapter，禁止真实 SMTP |
| `web/router.php` | 新增 | PHP 内置服务器前端控制器，并归一化 `SCRIPT_NAME/SCRIPT_FILENAME/PHP_SELF` |

以上均只存在于运行副本，未提交、未回写原工作区。

## 5. 与生产配置的差异

| 项 | 生产（文档口径） | 本测试环境 | 影响 |
|---|---|---|---|
| PHP | 7.4.33 | 8.0.2（屏蔽 Notice/Warning 模拟 7.4 严重度） | 存在 PHP 8 严格类型差异，已单独标注（见 06） |
| Web 服务器 | Nginx/Apache + 伪静态 | PHP 内置服务器 + router | 路由变量需归一化，已验证 pathInfo 正确 |
| 数据库 | MySQL 5.6.50 生产库 | 本地 MySQL 8.0.12 `morrishk_demo` | 用测试数据，非生产 |
| 邮件 | Gmail/企业 SMTP | `useFileTransport` 写 `.eml` | 不产生任何真实邮件 |
| 域名/HTTPS | 生产域名 + TLS | `http://127.0.0.1:8093` | canonical/og:url 为 localhost，属预期 |
| 第三方询盘 API | `https://wm.zokoko.cn/api/sendEmail`（浏览器端 JS） | 服务端无调用；测试不执行页面 JS | 浏览器端第三方调用**未被触发**，也未被 Mock |

## 6. 启动命令（可复现）

```powershell
cd 'E:\workspace\独立站\morrishk-site-runtime-wt-session-a'
$env:MORRISHK_DB_DSN='mysql:host=127.0.0.1;dbname=morrishk_demo'
$env:MORRISHK_DB_USERNAME='root'
$env:MORRISHK_DB_PASSWORD='root'
$env:MORRISHK_COOKIE_VALIDATION_KEY='local-demo-cookie-key-0123456789abcdef'
$env:MORRISHK_SMTP_HOST='127.0.0.1'
$env:MORRISHK_MAIL_FROM='no-reply@example.invalid'
php -S 127.0.0.1:8093 -t web web/router.php
```

原始证据目录：`...\morrishk-site-runtime-wt-session-a\runtime\evidence\`
