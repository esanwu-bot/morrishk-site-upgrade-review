# 08 Round 43 总结

## 1. 任务状态

| 任务 | 状态 | 说明 |
|---|---|---|
| F-20 生产 Cookie 安全属性 | **PASS（头级）** | HTTPS 下 `PHPSESSID`/`_identity`/`_csrf` 均 `Secure; HttpOnly; SameSite=Lax; Path=/`；HTTP 不误设；伪造 `X-Forwarded-Proto` 被忽略；可信代理模式可开启 |
| F-21 Secret 轮换复活风险 | **PASS（按 runbook）** | 仅切换 Secret 会复活（FAIL）；切换 + `php yii auth-key/rotate` 后旧 Cookie 永久失效 |
| F-22 Punycode / 前端兼容 | **PASS（桌面）** | 真实浏览器首页/列表/PDP/后台菜单正常，无 JS error；未加载 punycode.js；移动端 PARTIAL |
| F-23 迁移兼容性 | **PARTIAL** | 5.7.26 / 8.4.13 + 真实结构 PASS；生产精确 5.6.50 **BLOCKED** |
| F-24 剩余 advisory | **已分级** | 12 包 / 68 条；六包逐项给出范围/修复/可达性/隔离/计划 |

## 2. 应用代码改动（相对 `fa35a95`）

| 文件 | 变化 |
|---|---|
| `config/web.php` | +26 行：按 HTTPS/可信代理设置 `Secure`，统一 HttpOnly/SameSite=Lax，新增 session cookieParams |
| `modules/ejadmin/models/SnSiiManage.php` | +14 行：`bumpAllAuthKeyVersions()` |
| `commands/AuthKeyController.php` | 新增 32 行：`auth-key/rotate` |

- 未新增数据库表/列/迁移；未改 vendor；未改业务功能。
- 完整 diff：`evidence/app_round43.diff`。

## 3. 关键证据

| 主题 | 文件 |
|---|---|
| 修复前 Cookie | `evidence/cookie_https_before_fix.txt` |
| 修复后 Cookie | `evidence/cookie_https_after_fix.txt` |
| HTTP/代理矩阵 | `evidence/cookie_http_vs_proxy.txt` |
| HTTPS 认证流程 | `evidence/https_auth_flows.txt` |
| Secret 轮换 | `evidence/secret_rotation.txt` |
| 浏览器资源 | `evidence/access_log_resources.txt`、`browser_*.jpg`、`mobile_home_390x844.png` |
| 5.7 迁移 | `evidence/mysql57_migration.txt`、`mysql57_lock_and_privilege.txt` |
| 8.4 迁移 | `evidence/mysql84_migration.txt` |
| CVE | `evidence/cve_advisories.txt`、`cve_call_paths.txt`、`composer_audit.json` |
| Staging 回归 | `evidence/staging_regression.txt` |

## 4. 测试统计

- 认证/Cookie：登录、持久登录、CSRF、登出、旧 Cookie/旧 Session、HTTP/HTTPS/代理 4 种场景。
- Secret 轮换：A→B→A 完整 6 步 + 无轮换负向控制。
- 浏览器：4 个页面（首页/列表/PDP/后台）+ 移动端截图。
- 迁移：2 个 MySQL 版本 ×（迁移/幂等/回滚）+ 锁等待 + 最小权限。
- 业务回归：5 项 + sitemap/robots。

## 5. PASS / FAIL / BLOCKED / NOT_TESTED

- PASS：F-20（HTTPS 头级）、F-21（runbook）、F-22 桌面、F-23 5.7/8.4、staging 业务回归。
- FAIL（作为缺陷已修复/已给出方案）：仅切换 Secret 的复活路径（已由 rotate 命令消除）。
- BLOCKED：MySQL 5.6.50 精确版本。
- NOT_TESTED：真实浏览器 HTTPS Secure 回传、生产 Nginx/证书、下载授权（staging）、真实 SMTP/第三方、Safari/Firefox、真实移动设备、Redis Session。

## 6. 未设置的状态

未设置、未暗示：

`V1_READY`、`FUNCTION_ACCEPTED`、`PRODUCTION_READY`、`RELEASE_APPROVED`。

未部署生产、未执行生产迁移、未开放真实客户流量。

## 7. 停止点

Round 43 到此停止，等待 Reviewer 复核；不进入 Round 44。
