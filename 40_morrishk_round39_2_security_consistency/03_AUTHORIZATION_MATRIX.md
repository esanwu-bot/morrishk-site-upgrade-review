# 03 下载授权矩阵（PHP 8.5.13 / MySQL 8.4.13）

环境：PHP 内置服务器 `127.0.0.1:8099`，测试库 `morrishk_r39`；账号 `qa_r39_a`（Role 0）、`qa_r39_b`（Role 0）、`qa_r39_admin`（Role 1）。附件为 A/B/访客各自上传的合成 PDF。

## 1. 登录请求澄清

`security_matrix.txt`（Round 39.1）中的 `login[...] http=200` 是 **GET 登录页** 的响应，不是登录成功。本轮已分开记录：

| 账号 | GET `/site/login.html` | POST `/site/login.html` | 结果 |
|---|---|---|---|
| qa_r39_a | 200 | **302** → `/ejadmin-index.html` | 成功 |
| qa_r39_b | 200 | **302** | 成功 |
| qa_r39_admin | 200 | **302** | 成功 |
| qa_r39_a + 错误密码 | 200 | **200** + 错误文案 | 失败（预期） |
| 不存在账号 | 200 | **200** + 错误文案 | 失败（预期） |

## 2. 授权矩阵

| # | 场景 | 实际身份 | HTTP | 响应头 | 服务端判定 |
|---|---|---|---|---|---|
| 1 | 上传者下载自己的附件 | owner A | **200** | `attachment; filename="…pdf"`、`nosniff` | allow（isOwner） |
| 2 | 普通用户下载他人附件 | staff B | **403** | 无 | deny_forbidden |
| 3 | 管理员下载他人附件 | admin | **200** | `attachment` + `nosniff` | allow（isAdmin） |
| 4 | 未登录下载 | guest | **403** | 无 | deny_guest |
| 5 | 访客上传（OwnerUserId=0）由员工下载 | staff A | **403** | 无 | deny_forbidden |
| 6 | 访客上传（OwnerUserId=0）由管理员下载 | admin | **200** | `attachment` + `nosniff` | allow（isAdmin） |
| 7 | 附件不存在 | owner A | **404** | 无 | not_found |
| 8 | 篡改 `inquiry_id`/`file_id` 查询参数（owner） | owner A | **200** | 同上 | allow（授权只用文件与记录归属） |
| 9 | 篡改 `inquiry_id`/`file_id`（他人） | staff B | **403** | 无 | deny_forbidden |
| 10 | 物理文件删除（记录仍在） | owner A | **404** | 无 | deny_missing_file |
| 11 | 恢复文件后重试 | owner A | **200** | 同上 | allow |
| 12 | 路径穿越 `..%2F..%2Fconfig%2Fdb.php` | owner A | **404** | 无 | deny_invalid_name |
| 13 | 路径穿越 `%2e%2e%2f…%2fweb%2findex.php` | owner A | **404** | 无 | deny_invalid_name |

补充：`/download/` 的文件名白名单为 `^[A-Za-z0-9_-]{16,64}\.(xls|xlsx|csv|doc|docx|pdf|txt)$`，短名/非法名直接 404。

## 3. 会话与登出

| 步骤 | 结果 |
|---|---|
| 登录后请求受保护下载（owner） | 200，证明会话有效 |
| 未登录请求 `/ejadmin-index.html` | 302 → `/site/login.html` |
| 登出（CSRF POST `/site/logout.html`） | 302 → `/` |
| 登出后再次下载原附件 | **403**（会话已销毁） |

## 4. 结论

- 授权逻辑只依赖“登录身份 + 记录归属 + 角色”，不依赖可篡改的查询参数；
- 角色隔离有效：staff 与 admin 行为不同；
- 访客上传附件的策略与代码注释一致（仅管理员可下载）；
- 响应头只在允许下载时设置 `attachment` + `nosniff`。

原始输出：`evidence/auth_matrix.txt`（含每一步的实际请求与响应）。
