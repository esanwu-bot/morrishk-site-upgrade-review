# 06 Staging 回归（生产预验收）

## 1. 环境

| 项 | 值 |
|---|---|
| Web | Nginx 1.15.11（Windows）→ php-cgi 8.5.13（FastCGI 9100） |
| HTTPS | `https://127.0.0.1:8443`（自签名证书） |
| HTTP | `http://127.0.0.1:8080`（直连，仅对照） |
| DB | MySQL 8.4.13 `morrishk_r39` |
| 应用副本 | `D:\dev\tmp\r43src`（仓库源码副本；未纳入 Git） |
| 生产配置 | 未连接、未修改 |

## 2. 业务回归

命令：`php r43_staging_checks.php`（Round 42 脚本，base 改为 `http://127.0.0.1:8080`）。

```text
admin_login                              http=302
admin_dashboard                          http=200 menu_products=yes menu_accounts=yes
pdp                                      http=200 canonical=yes jsonld=yes
upload_pdf                               http=200 success=yes
pdp_inquiry                              http=302
sitemap http=200
robots http=200
```

退出码：0。证据：`evidence/staging_regression.txt`。

- 后台菜单 Products / Accounts 正常。
- PDP canonical / JSON-LD 正常。
- PDF 上传成功。
- PDP 询价 POST 302（成功跳转）。
- sitemap / robots 200。

## 3. 认证与 Cookie

### 3.1 HTTPS Cookie 属性

见 01；证据 `evidence/cookie_https_after_fix.txt`。

### 3.2 认证流程

`evidence/https_auth_flows.txt`：

```text
login_without_csrf http=400
login_with_csrf http=302
persistent_cookie_only http=200
session_cookie_only http=200
logout http=302
session_after_logout http=302
identity_after_logout http=302
```

结论：

- CSRF 保护有效。
- 持久登录（仅 `_identity`）可访问受保护页。
- 登出后旧 Session 与旧 `_identity` 均失效。

## 4. Secret 轮换

见 02；证据 `evidence/secret_rotation.txt`。

- 仅切换 Secret：旧 Cookie 可复活（FAIL）。
- 切换 + `auth-key/rotate`：旧 Cookie 永久失效（PASS）。

## 5. 浏览器交互

见 03；证据：`evidence/browser_*.jpg`、`evidence/mobile_home_390x844.png`、
`evidence/access_log_resources.txt`。

- 首页 / 产品列表 / PDP / 后台菜单：PASS，无 JS error。
- 真实页面未加载 `punycode.js`（count=0）。
- 移动端 390×844：结构生效，但 Hero 文案重叠、部分本地图片 404（仓库缺失）→ PARTIAL。

## 6. 未执行 / NOT_TESTED

| 项 | 状态 | 原因 |
|---|---|---|
| 下载授权矩阵（owner/other/admin/guest） | NOT_TESTED（本轮 staging） | Round 42 升级后已在 8099 通过；本轮未在 8443/8080 重跑 |
| 真实 SMTP / 第三方 API | NOT_TESTED | 无客户授权与配置；仍用 Mock |
| 生产 Nginx 配置 / 真实证书 | NOT_TESTED | 本轮不部署 |
| 真实移动设备 / Safari / Firefox | NOT_TESTED | 只有 Chromium 与 Edge headless |
| Redis Session | NOT_TESTED | 未启用 |
| 生产 MySQL 5.6.50 | BLOCKED | 本机无该版本（见 04） |

## 7. 判定

- 业务回归：PASS。
- Cookie/认证：PASS（HTTPS 头级）。
- Secret 轮换：PASS（按新 runbook）。
- 浏览器桌面：PASS；移动端：PARTIAL。
- 未部署、未改生产、未开真实客户流量。
