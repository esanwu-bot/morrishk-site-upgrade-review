# 01 生产 Cookie 安全属性（F-20）

## 1. 结论

| Cookie | Secure | HttpOnly | SameSite | Path | Domain | 结果 |
|---|---|---|---|---|---|---|
| `PHPSESSID` | HTTPS 下 **有** | 有 | **Lax** | `/` | 未设置（host-only） | PASS |
| `_identity` | HTTPS 下 **有** | 有 | **Lax** | `/` | host-only | PASS |
| `_csrf` | HTTPS 下 **有** | 有 | **Lax** | `/` | host-only | PASS |
| 其他认证 Cookie | 未发现 | — | — | — | — | — |

- 修复前（HEAD `fa35a95`）在 HTTPS 下三者**均无 Secure**，`PHPSESSID` 的 SameSite 为空。证据：
  `evidence/cookie_https_before_fix.txt`。
- 修复后在 `https://127.0.0.1:8443` 三者均为 `Secure; HttpOnly; SameSite=Lax; Path=/`。证据：
  `evidence/cookie_https_after_fix.txt`。

## 2. 问题定位

Yii2 默认值：

- `Cookie::$secure = false`，`httpOnly = true`，`sameSite = 'Lax'`。
- `Request::$csrfCookie = ['httpOnly' => true]`。
- `User::$identityCookie = ['name' => '_identity', 'httpOnly' => true]`。
- `Session::$_cookieParams = ['httponly' => true]`；`session.cookie_secure=0`、`session.cookie_samesite` 为空。

因此如果不显式配置，HTTPS 生产环境会下发不带 `Secure` 的认证 Cookie，且 `PHPSESSID` 没有 SameSite。

## 3. 修复（`config/web.php`）

```php
$httpsOn = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== '' && strcasecmp($_SERVER['HTTPS'], 'off') !== 0;
$proxyHttps = getenv('MORRISHK_TRUST_PROXY_HEADERS') === '1'
    && isset($_SERVER['HTTP_X_FORWARDED_PROTO'])
    && strcasecmp($_SERVER['HTTP_X_FORWARDED_PROTO'], 'https') === 0;
$secureCookies = $httpsOn || $proxyHttps || getenv('MORRISHK_FORCE_SECURE_COOKIES') === '1';
$authCookieOptions = ['httpOnly' => true, 'secure' => $secureCookies, 'sameSite' => 'Lax'];

'request' => [
    ...
    'csrfCookie' => $authCookieOptions,
],
'user' => [
    ...
    'identityCookie' => array_merge(['name' => '_identity'], $authCookieOptions),
],
'session' => [
    'cookieParams' => ['httponly' => true, 'secure' => $secureCookies, 'samesite' => 'Lax'],
],
```

设计要点：

- **按请求判定**，不是编译期常量；同一份代码在 HTTP 与 HTTPS 下行为不同。
- HTTP 下不设置 Secure（否则浏览器不会回传 Cookie，登录直接坏掉）；HTTPS 下强制设置。
- 没有“本地测试把 Secure 关掉”的开关混入生产：`MORRISHK_FORCE_SECURE_COOKIES=1` 只会**加强**，不会关闭。
- `MORRISHK_TRUST_PROXY_HEADERS` 默认关闭。只有显式开启且代理覆盖 `X-Forwarded-Proto` 时才信任该头。

## 4. 反向代理与 HTTPS 识别

- 直接 TLS 终止：Nginx 必须传 `fastcgi_param HTTPS on;`，Yii `Request::getIsSecureConnection()` 才能识别。
- 反向代理终止 TLS：两种方式二选一：
  1. 代理传 `HTTPS on` 给 FPM（推荐，不依赖转发头）；
  2. 代理覆盖 `X-Forwarded-Proto: https`，并在应用环境设置 `MORRISHK_TRUST_PROXY_HEADERS=1`。
- 代理必须**覆盖**而不是透传客户端传入的 `X-Forwarded-Proto`，否则客户端可伪造 HTTPS 判定。

实测矩阵（`evidence/cookie_http_vs_proxy.txt`）：

| 场景 | `PHPSESSID` Secure | 说明 |
|---|---|---|
| HTTPS 8443（`HTTPS on`） | **有** | 正常生产形态 |
| HTTP 8080（无 TLS） | 无 | 不误设 Secure |
| HTTP 8080 + 客户端伪造 `X-Forwarded-Proto: https` | **无** | 未开启 trust，伪造被忽略 |
| HTTP 8081 + 代理头 + `MORRISHK_TRUST_PROXY_HEADERS=1` | **有** | 可信代理形态 |

## 5. 认证流程验证（HTTPS）

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

- CSRF：缺少 `_csrf` 的登录 POST 返回 400。
- 持久登录：仅 `_identity` 可访问受保护页（200）。
- 登出：`_identity` 被清除（`Max-Age=0`，见 after_fix 证据），旧 Session 与旧 `_identity` 均 302。

## 6. Path / Domain

- `Path=/`：全站统一，符合当前单域部署。
- `Domain` 未设置：host-only Cookie。生产若使用 `www.morrishk.net` 与裸域并存，需要确认是否要共享登录态；当前未设置 Domain 是更保守的选择。
- `_identity` 有效期 30 天（`Max-Age=2592000`），`PHPSESSID`/`_csrf` 为会话 Cookie。

## 7. 未测试 / 边界

- 未在真实受信任证书的浏览器中验证 Secure 回传；HTTPS 测试使用 curl `-k` 与自签名证书。浏览器交互测试走 HTTP staging（F-22），因此“浏览器在 HTTPS 下是否回传 Secure Cookie”属 **NOT_TESTED**。
- 未验证多级代理（CDN → Nginx → FPM）链路；只验证单级 Nginx。
- 未验证 `__Host-` / `__Secure-` Cookie 前缀方案；当前保持 `_identity`/`_csrf`/`PHPSESSID` 名称不变，避免兼容性变化。
- 未修改 `session.use_strict_mode`（仍为 0）；建议生产开启，但本轮未改，见 07。
