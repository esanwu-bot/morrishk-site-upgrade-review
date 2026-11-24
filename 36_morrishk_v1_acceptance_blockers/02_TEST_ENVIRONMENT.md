# 02 测试环境

## 1. 副本与版本

| 项 | 值 |
|---|---|
| 标准安装副本 | `E:\workspace\独立站\morrishk-site-clean-install-session-a` |
| 副本 HEAD | `af4765f81509ef1d1e58b0104f59ba9963e2c37b` |
| 手工 vendor 运行副本 | `E:\workspace\独立站\morrishk-site-runtime-wt-session-a`（同 HEAD） |
| PHP | **7.4.3 NTS**（`D:\phpstudy_pro\Extensions\php\php7.4.3nts\php.exe`） |
| 目标 PHP | 7.4.33（本机无此版本） |
| Composer | 2.5.8 |
| MySQL | 8.0.12（本机另有 5.7.26；无 5.6.50） |
| 数据库 | `morrishk_demo`（本地测试库，31 表） |
| 端口 | 标准安装副本 `:8095`；手工 vendor 副本 `:8094` |

## 2. 标准 Composer 安装（干净副本）

```powershell
git clone --local <repo> E:\workspace\独立站\morrishk-site-clean-install-session-a
git checkout d740112   # 随后 fetch 并切到 af4765f
composer install --no-scripts --no-interaction --prefer-dist --no-dev --ignore-platform-reqs --no-progress
```

结果（`install.log`）：

```
Verifying lock file contents can be installed on current platform.
Package operations: 71 installs, 0 updates, 0 removals
...
- Installing yiisoft/yii2 (2.0.44): Extracting archive
...
Generating autoload files
```

- 71 个 lock 包全部由 Composer 自身下载/解压完成；
- `vendor/autoload.php` 生成；`vendor/yiisoft/yii2/Yii.php` 存在；
- `google/apiclient-services` 由 Composer 解压 25,375 个文件；
- **无手工解压、无元数据占位**。

耗时说明：`google/apiclient-services` 解压约 20 分钟（Windows Defender 实时扫描），属本机 I/O 限制，不影响结果真实性。

## 3. lock 完整性

```
composer.lock  SHA256 = 86E058AEDDCEEBAED6C4F81C807AE625BF7B553149A9B9FB3BA7DFFA20638E4D
composer.json  SHA256 = D0BDB9B7869FBE8FA004B5A123BA9A0E419B915AA48C5CCE772A68134DA322DA
```

与基线一致，未修改。

## 4. 非生产配置（仅副本，不提交）

| 文件 | 改动 |
|---|---|
| `config/web.php` | `mailer.useFileTransport=true`、`fileTransportPath=@runtime/mail`；`inquirySender` 默认 Mock（该组件本身已进入源码） |
| `config/db.php` | `on afterOpen` 会话级放宽 `ONLY_FULL_GROUP_BY`（MySQL 8 兼容旧 SQL，仅测试） |
| `web/index.php` | `YII_DEBUG=false`、`YII_ENV=prod` |
| `web/router.php` | 内置服务器前端控制器 + 尾斜杠 301（测试专用） |

## 5. 测试账号（仅测试库）

| 用户名 | 密码 | 用途 |
|---|---|---|
| `qa_tester` | 不在文档中记录（见安全材料说明） | 已登录下载/后台 CSRF 测试 |
| `qa_other` | 不在文档中记录（见安全材料说明） | 跨用户下载策略测试 |

凭据以一次性随机口令生成，仅在被测运行环境内通过受控渠道（本机临时文件，测试结束即删除）传递，不写入仓库。
Round 37 已轮换：旧口令失效，新口令同样不入库；轮换与失效验证见 `37_morrishk_v1_final_acceptance/05_SECURITY_MATERIALS.md`。

插入方式：`password_hash(..., PASSWORD_BCRYPT, ['cost' => 13])`，与 `Yii::$app->security->validatePassword` 兼容。

## 6. Mock

- 邮件：file transport → `runtime/mail/*.eml`
- 询盘日志：`runtime/inquiry/inquiry-*.log`
- 无 SMTP、无第三方请求。

## 7. 结论

| 项 | 判定 |
|---|---|
| 干净标准 composer install | **PASS**（PHP 7.4.3） |
| PHP 7.4 系列 | PASS |
| PHP 7.4.33 精确目标 | **BLOCKED**（本机无该版本） |
| MySQL 5.6.50 精确目标 | **BLOCKED**（本机无该版本） |
| lock 未修改 | PASS |
| 依赖完整 | PASS |
