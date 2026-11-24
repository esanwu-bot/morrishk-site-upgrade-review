# 05 Composer 升级回归报告（F-19）

## 1. 结论

| 项 | 结果 |
|---|---|
| Composer 补丁升级 | **已执行**（`yii2 2.0.55`、`yii2-redis 2.0.20`） |
| `composer install` | PASS（exit=0，Nothing to install） |
| `check-platform-reqs` | PASS（exit=0） |
| `composer audit` | 已执行；目标 CVE 已消失；其余风险仍在（见 04） |
| PHP 8.5 兼容性 | PASS（无 fatal/deprecated；平台检查全 success） |
| 认证/吊销矩阵 | PASS（19 项，见 3.1） |
| 业务功能回归 | PASS（登录、后台菜单、PDP、询价、上传、下载、SEO） |
| 生产形态（Nginx + php-fpm） | **NOT TESTED**（本轮不部署） |

本文件记录的是**升级后**的实际回归；不是 Round 41 的复用结论。

## 2. 环境

- 应用 worktree：`E:\workspace\独立站\morrishk-site-r39-wt`，HEAD `b7e8933` + 未提交的 `composer.lock`。
- Web：PHP 8.5.13 内置服务器 `http://127.0.0.1:8099`。
- DB：本地 MySQL 8.4.13，测试库 `morrishk_r39`（`ONLY_FULL_GROUP_BY` 开启）。
- 测试脚本（仓库外）：`D:\dev\tmp\r41_matrix.php`、`r42_checks.php`、`r42_session_iso.php` 等。
- 证据：
  - `evidence/revocation_matrix_after_upgrade.txt`
  - `evidence/regression_after_upgrade.txt`
  - `evidence/composer_install_after.txt`
  - `evidence/composer_platform_after.txt`
  - `evidence/composer_audit_after.json`
  - `evidence/session_isolation*.txt`

## 3. 认证与吊销矩阵（升级后重跑）

```text
login[qa_r39_a]                                  POST=302
copy1                                            yes
copy2                                            yes
cookie_valid_before_logout                       http=200
logout_device1                                   http=302
authkey_version                                  4 -> 5
copied_cookie_after_logout                       http=302
other_device_cookie_after_logout                 http=302
other_device_session_after_logout                http=302
new_cookie_valid                                 http=200
concurrent_logout_codes                          302,302
cookie_after_concurrent_logout                   http=302
concurrent_stale_cookie_codes                    302,302,302
cookie_after_password_change                     http=302
cookie_after_username_change                     http=302
cookie_after_status_change                       http=302
cookie_after_secret_rotation                     http=302
weak_secret_login                                http=503
missing_secret_login                             http=503
download[owner]                                  http=200
download[other]                                  http=403
download[admin]                                  http=200
download[guest]                                  http=403
```

判定：

- 持久 Cookie 在登出、改密、改用户名、改状态、轮换 Secret 后均失效（302）。
- 并发登出两次均 302；并发旧 Cookie 全部 302。
- 弱/缺失 Secret 登录 503（fail closed）。
- 下载授权矩阵：owner 200、other 403、admin 200、guest 403，未被升级破坏。
- 版本递增实测 `4 -> 5`。

## 4. 业务功能回归（升级后）

```text
admin_login        http=302
admin_dashboard    http=200 menu_products=yes menu_accounts=yes
pdp                http=200 canonical=yes jsonld=yes
upload_pdf         http=200 success=yes
pdp_inquiry        http=302
```

补充：

```text
sitemap.xml  http=200 bytes=478
robots.txt   http=200 bytes=596
```

- 后台菜单 Products / Accounts 正常渲染（Round 40 的 `ONLY_FULL_GROUP_BY` 修复未被升级影响）。
- PDP 的 canonical 与 JSON-LD 仍输出。
- PDF 上传成功并落库；XLS/XLSX 仍被拒绝（白名单未回退）。
- PDP 询价 POST 返回 302（提交成功跳转）。

### 4.1 关于首次 `pdp_inquiry http=400` 的说明

首次运行 `r42_checks.php` 时记录到 `pdp_inquiry http=400`。排查结果：

- 测试脚本在**无 Cookie** 的请求中抓取 PDP 页面，拿到的 CSRF token 属于一个**匿名会话**；
  POST 却携带了另一个（已登录）会话的 Cookie，token 与 Session 不匹配 → Yii CSRF 校验失败（400）。
- 单独复测（同一 Cookie 会话先 GET PDP、再取 `_csrf` 提交）：

```text
pdp_get http=200 csrf_len=88
pdp_inquiry http=302
```

- 因此 400 是**测试脚本的会话/CSRF 对齐问题**，不是应用缺陷，也不是升级回归。
  修正脚本后全量重跑，结果如第 4 节（302）。
- 本轮**未**因此修改应用代码。

## 5. PHP 8.5 兼容性

- `composer check-platform-reqs` 全部 success（PHP 8.5.13、ext-curl、ext-fileinfo、ext-gd 等）。
- 升级后应用日志仅出现 1 条**预期内**的 warning：
  `Invalid cookie auth key attempted for user '195'`（来自吊销测试，属正常拒绝路径）。
- 未发现 `PHP Fatal` / `Uncaught` / `Deprecated` 记录。
- Yii 2.0.55 升级说明中的不兼容点（移除 XCache/ZendDataCache、PHP ≥7.4、静态分析注解）
  与本项目无关：未使用这两类缓存组件，运行环境 PHP 8.5。

## 6. 未测试 / 边界

| 项 | 状态 | 说明 |
|---|---|---|
| 生产 Nginx + php-fpm | NOT TESTED | 本轮不部署 |
| Redis 作为 Session/Cache | NOT TESTED | 未启用；`save_handler=files` |
| 真实 SMTP / 第三方 API | NOT TESTED | 沿用 Mock 发送器 |
| 真实浏览器（非 curl） | NOT TESTED | 本轮为 HTTP 级验证 |
| 并发压力 / 长连接 | NOT TESTED | 仅 2 并发登出场景 |
| 其余 12 包 / 68 条 advisory | 未处理 | 超出本轮范围；见 04/06 |

## 7. PASS / FAIL 汇总

- PASS：依赖升级、install、platform-reqs、认证/吊销矩阵、登录、后台菜单、PDP、询价、上传、
  下载授权、SEO 端点、PHP 8.5 运行。
- FAIL：无。
- BLOCKED：无（Round 41 的镜像阻塞已通过临时 `COMPOSER_HOME` + 官方 Packagist 解除）。
- NOT TESTED：见第 6 节。
