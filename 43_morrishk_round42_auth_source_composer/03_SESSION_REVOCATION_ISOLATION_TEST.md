# 03 独立 Session 吊销隔离测试（F-18）

## 1. 目标

Round 41 报告中出现一个需要解释的现象：文档声明 `AuthKeyVersion` 不保证立即吊销已建立的
PHP Session，但测试矩阵第 6 项记录“其他设备活动 Session 返回 302”。

本文件用 A/B 两套完全独立的会话复现，并给出**机制级解释**与**语义边界**。
不实现服务端票据表，不修改本轮代码。

## 2. 测试环境

| 项 | 值 |
|---|---|
| Web 服务 | PHP 8.5.13 内置服务器，`http://127.0.0.1:8099`，独立测试库 `morrishk_r39` |
| `session.save_handler` | `files` |
| `session.save_path` | 空（PHP 默认）→ `C:\Users\ADMINI~1\AppData\Local\Temp` |
| `session.name` | `PHPSESSID`，`cookie_lifetime=0`，`use_strict_mode=0` |
| `session.gc_maxlifetime` | 1440 秒（与吊销无关） |
| `user.enableAutoLogin` | `true`（`config/web.php` L34–L38） |
| 测试账号 | `qa_r39_a`（id 195，Role 0） |
| 测试脚本 | 仓库外 `D:\dev\tmp\r42_session_iso.php`、`r42_session_deep.php`、`r42_session_cookie_meta.php` |

证据：

- `evidence/session_isolation.txt`（隔离测试主结果）
- `evidence/session_isolation_deep.txt`（会话文件与 Location 追踪）
- `evidence/session_cookie_attributes.txt`（session 存储位置与 Cookie 属性）

## 3. 严格隔离步骤

1. 浏览器 A：`qa_r39_a` 登录（`rememberMe=1`），保存独立 `PHPSESSID-A` 与 `_identity-A`。
2. 浏览器 B：同一账号登录，保存独立 `PHPSESSID-B` 与 `_identity-B`。
3. 确认 `PHPSESSID-A ≠ PHPSESSID-B`，`_identity-A ≠ _identity-B`。
4. 确认 B 全量 Cookie 可访问 `/ejadmin-index.html`。
5. 确认 B **仅带** `PHPSESSID-B` 也可访问（不依赖 `_identity-B`）。
6. A 执行 logout（`POST /site/logout.html` + CSRF），服务端 `AuthKeyVersion` 递增。
7. B **仅带** `PHPSESSID-B` 访问受保护页（不携带 `_identity-B`）。
8. B **仅带** 旧 `_identity-B` 访问受保护页。
9. 记录会话文件、Cookie 属性、HTTP 状态与 `Location`。

## 4. 实际结果

### 4.1 隔离测试主结果

```text
login_A                                        http=302
login_B                                        http=302
A_session_cookie                               present
B_session_cookie                               present
session_ids_differ                             yes
identity_cookies_differ                        yes(same account, different sessions)
B_full_jar_before_logout_A                     http=200
B_session_only_before                          http=200
logout_A                                       http=302
A_after_logout                                 http=302
B_session_only_after_A_logout                  http=302
B_identity_only_after_A_logout                 http=302
session_save_path                              (php.ini default)
session_handler                                files
```

### 4.2 会话文件级追踪

```text
sidA=<SID-A-REDACTED>  sidB=<SID-B-REDACTED>
A_file: ...\sess_<A> 107 bytes
        data=__flash|a:0:{}__id|i:195;__authKey|s:64:"<omac>";
B_file_after_login: ...\sess_<B> 107 bytes
        data=__flash|a:0:{}__id|i:195;__authKey|s:64:"<omac>";
B_session_only_before: http=200 location=
logout_A: http=302 location=http://127.0.0.1:8099/
A_file_after_logout: ...\sess_<A> MISSING
B_file_after_A_logout: ...\sess_<B> 107 bytes
        data=__flash|a:0:{}__id|i:195;__authKey|s:64:"<omac>";
B_session_only_after: http=302 location=http://127.0.0.1:8099/site/login.html
B_file_after_request: ...\sess_<B> 107 bytes
        data=...__id|i:195;__authKey|s:64:"<omac>";__returnUrl|s:40:"http://127.0.0.1:8099/ejadmin-index.html";
B_identity_only_after: http=302 location=http://127.0.0.1:8099/site/login.html
```

（`<omac>` 为占位符，实际 value 未写入本包。）

### 4.3 Cookie 与存储

```text
session.save_handler   = files
session.save_path      = (empty) → C:\Users\ADMINI~1\AppData\Local\Temp
Set-Cookie PHPSESSID   value_len=32  attributes=path=/; HttpOnly
Set-Cookie _identity   value_len=230 attributes=expires=+30d; Max-Age=2592000; path=/; HttpOnly; SameSite=Lax
Set-Cookie _csrf       value_len=166 attributes=path=/; HttpOnly; SameSite=Lax
protected_with_session_http=200
protected_anonymous_http=302
```

## 5. 机制解释（源码级）

### 5.1 Session 中保存了 AuthKey

登录时 Yii2 `User::switchIdentity()` 会把 `getAuthKey()` 的结果写入当前 PHP Session：

- `vendor/yiisoft/yii2/web/User.php` L661：`$session->remove($this->authKeyParam);`
- L665：`$session->set($this->authKeyParam, $identity->getAuthKey());`
- 参数名 `authKeyParam = '__authKey'`（L139）。

因此 B 的会话文件内容为 `__id|i:195;__authKey|s:64:"..."`。

### 5.2 每个请求都会重新校验 Session 中的 AuthKey

`User::renewAuthStatus()`（L688–L713）：

```php
$identity = $class::findIdentity($id);
...
$authKey = $session->get($this->authKeyParam);
if ($authKey !== null && !$identity->validateAuthKey($authKey)) {
    $identity = null;
    ...
}
$this->setIdentity($identity);
```

A 登出使 `AuthKeyVersion` 由 4 → 5；B 会话里保存的是版本 4 时签发的 MAC。
下一次请求 `validateAuthKey()` 重新计算 MAC（含 `v=5`）与旧值比较失败 →
`$identity = null` → 受保护页重定向 `/site/login.html`（302）。

**关键事实**：该分支只把内存中的 identity 置空，**不会删除** Session 文件，也不会移除
`__id` / `__authKey`。所以 B 的会话文件在 A 登出后仍然存在（107 bytes），
且请求后仍保留 `__id`、`__authKey`，只是每次请求都会被判定为 guest。

### 5.3 持久 Cookie 的路径

`User::getIdentityAndDurationFromCookie()`（L592–L616）：

```php
} elseif (!$identity->validateAuthKey($authKey)) {
    ... Yii::warning(...);
}
...
$this->removeIdentityCookie();
return null;
```

旧 `_identity-B` 同样因 `validateAuthKey()` 失败而被拒绝，并返回删除 Cookie 的指令
（`removeIdentityCookie()`）。这解释了 `B_identity_only_after_A_logout = 302`。

## 6. 三层语义（必须区分）

### 6.1 持久 Cookie 吊销（服务端立即生效）

- 生效范围：该账号**全部设备**的 `_identity` Cookie。
- 机制：Cookie 中的 MAC 含 `AuthKeyVersion`；登出递增版本 → 旧 MAC 校验失败 →
  `removeIdentityCookie()`。
- 证据：`B_identity_only_after_A_logout=302`；Round 41 矩阵中复制 Cookie / 其他设备旧 Cookie
  在登出后均为 302。
- 结论：**可以宣称“持久登录 Cookie 已账号级吊销”**。

### 6.2 当前 PHP Session 的失效（不是“销毁”）

- 本机 A：`logout()` 默认 `destroySession=true`，A 的 Session 文件被删除
  （`A_file_after_logout: MISSING`）。
- 其他设备 B：Session 文件**仍存在**，`__id` / `__authKey` **仍在**；
  但每个请求 `renewAuthStatus()` 会重新校验 `__authKey`，失败即视为 guest（302）。
- 因此准确表述是：**“Session 存储未被删除，但其中的认证状态在下次请求时被判定无效”**。
  不能表述为“服务端立即删除了所有设备的 Session”。

### 6.3 所有设备在线会话强制下线

- 本应用登录流程必然写入 `__authKey`（L661–L665），因此**由当前登录流程建立的会话**
  在版本递增后，下次请求都会被拒绝——效果上等价于“所有在线会话下线”。
- 设计边界：
  - 校验发生在**下一次 HTTP 请求**；纯长连接/WebSocket/未发起请求的标签页不会“推送”下线。
  - 若某个 Session 中**没有** `__authKey`（例如更早期版本遗留、或人为构造的会话），
    L706 的 `$authKey !== null` 不成立，该会话不会被版本校验拒绝。本应用当前登录流程
    不会产生这种会话，但这是明确的边界，不应外推为“任意历史会话都必然失效”。
  - 没有服务端票据表 / 会话黑名单；吊销依赖“版本 + 每请求校验”，不是“服务端主动断开”。

## 7. 对 Round 41 “测试矩阵第 6 项 302”的解释

第 6 项的 302 **不是**因为服务端删除了 B 的 Session，而是因为：
B 的 Session 中保存的 `__authKey` 在版本递增后无法通过 `validateAuthKey()`，
`renewAuthStatus()` 将 identity 置空，受保护页按 guest 处理并 302 到登录页。
该结果与“文档声明不保证立即吊销已建立的 PHP Session”并不矛盾：
**Session 文件没有被吊销/删除，被吊销的是其中的认证凭证有效性**。

## 8. 未测试 / 边界

- 未测试“无 `__authKey` 的历史 Session”在版本递增后的行为（当前登录流程不产生）。
- 未测试多台真实浏览器（本轮为同一 PHP 进程 + 两套独立 Cookie jar + 独立 Session ID，
  服务端无法区分两者，等价于两台设备）。
- 未测试 Redis/DB Session 存储；本轮 `save_handler=files`。
- 未测试 `authTimeout` / `absoluteAuthTimeout`（本应用未配置）。
- 未测试生产 Nginx + php-fpm 下的行为；机制在 Yii2 层，与 SAPI 无关，但仍需生产验收时复测。

## 9. 结论

| 语义 | 是否成立 | 依据 |
|---|---|---|
| 持久 Cookie 账号级吊销 | **成立**（立即） | 旧 `_identity` 302 + Cookie 删除指令 |
| 当前 PHP Session 被删除 | 仅当前设备（`logout` 销毁）；其他设备**未删除** | A 文件 MISSING，B 文件仍存在 |
| 其他设备 Session 认证状态失效 | **成立**（下次请求） | `__authKey` 重新校验失败 → 302 |
| 所有在线会话强制下线 | **对当前登录流程建立的会话成立**，但依赖“下次请求”，且不含无 `__authKey` 会话 | L688–L713 |
| 服务端票据表 / 主动断连 | **不存在**（本轮不实现） | 无相关表与代码 |
