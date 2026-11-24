# 11 新环境安全回归（PHP 8.5.13 / MySQL 8.4.13）

环境：PHP 8.5.13 内置服务器 `127.0.0.1:8099`，测试库 `morrishk_r39`，合成账号与附件。**Round 37 的 PASS 不作为本轮结论。**

## 1. 结果矩阵

| 编号 | 场景 | 本轮结果 | 判定 |
|---|---|---|---|
| S-01 | 后台登录（`/site/login.html`） | POST 后 **500**：`Undefined property: SnSiiManage::$authKey`（`Yii::$app->user->login()` 调用 `getAuthKey()`） | **BLOCKED（新缺陷 F-12）** |
| S-02 | 访客上传附件 | 购物车提交含 PDF → 200，落盘 `runtime/uploads/<24char>.pdf` | PASS |
| S-03 | 登录用户上传（OwnerUserId 归属） | 依赖 S-01，未取得登录态 | **NOT_TESTED** |
| S-04 | 上传者下载自己的附件 | 依赖 S-01 | **NOT_TESTED** |
| S-05 | 其他普通用户下载 | 依赖 S-01 | **NOT_TESTED** |
| S-06 | 管理员跨用户下载 | 依赖 S-01 | **NOT_TESTED** |
| S-07 | 未登录下载拒绝 | 403（无 `Content-Disposition`） | PASS |
| S-08 | 文件路径穿越（编码 `..%2F`） | 404 | PASS |
| S-09 | 直接访问 `runtime/uploads` 附件 | 404（`/download/..%2F..%2Fruntime/...`） | PASS |
| S-10 | 直接访问 `/uploads/<file>` | 404（`web/uploads` 不含运行时附件） | PASS |
| S-11 | 直接访问 `/config/db.php` | 404（docroot 为 `web/`） | PASS |
| S-12 | Nginx 路径访问控制（`/uploads`、`/runtime`、`/config`、`/vendor` 403） | 本轮为 PHP 内置服务器 | **NOT_TESTED** |
| S-13 | 下载响应 `attachment` + `nosniff` | 仅在被授权下载时设置；S-04/S-06 未执行 | **NOT_TESTED** |

原始输出：`evidence/security_matrix.txt`；登录缺陷栈：`evidence/admin_login_authkey_error.txt`。

## 2. 新缺陷 F-12（阻断后台相关复测）

| 项 | 内容 |
|---|---|
| 位置 | `modules/ejadmin/models/SnSiiManage.php`（实现 `IdentityInterface` 但缺 `getAuthKey()` / `validateAuthKey()`） |
| 现象 | 登录校验通过后 `Yii::$app->user->login()` 读取 `authKey` → PHP 8 "Undefined property" → Yii 转异常 → 500 |
| 影响 | 后台登录、RBAC 相关下载矩阵无法在本环境执行 |
| 建议 | 为模型补 `getAuthKey()`/`validateAuthKey()`（或改用独立 `auth_key` 列）；属 Round 40 修复项 |
| 本轮处置 | **未修改应用代码**（遵本轮约束），仅记录 |

## 3. 说明

- 内置服务器将 docroot 固定为 `web/`，因此 `/config`、`/runtime` 天然不可达；这**不能替代** Nginx 配置验证。
- `DownloadController` 仅在被允许时设置 `X-Content-Type-Options: nosniff` 且 `inline=false`（代码已确认，但本轮未能以被授权身份取到响应头）。
- 访客上传属于公开接口（无登录要求），本轮已确认可用；其归属 `OwnerUserId=0`，按设计仅管理员可下载。
