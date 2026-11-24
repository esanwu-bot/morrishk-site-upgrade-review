# P0-1 附件资源授权

## 1. 权限模型核查（先查后改）

| 对象 | 现状 | 结论 |
|---|---|---|
| `snsii_manage`（后台用户） | `id`、`UserName`、`Role`、`Status`；`Role=1` 为管理员，`Role=0` 为普通员工 | 已有角色字段，可直接用于跨用户授权判断 |
| `snsii_cart`（询价记录） | 原始表无创建人字段，仅有 `Files`（`uploads/<随机名>`） | 无法表达归属，这是 U7 的根因 |
| 附件存储 | `@runtime/uploads`（Web 根之外），文件名为 24 位随机串 | 文件名不可枚举，但不能作为授权依据 |
| 下载入口 | `DownloadController::actionIndex` 原实现仅校验“登录 + 记录存在” | 任意后台账号可下载任意附件 → U7 FAIL |

结论：不能依赖文件名或“已登录”授权，必须建立**询价记录归属**并逐次校验。

## 2. 授权策略（本轮实现）

1. 附件必须能关联到一条 `snsii_cart` 记录（`Files = uploads/<file>`），否则 404。
2. 记录新增 `OwnerUserId`：提交时由服务端会话写入；访客为 `0`。
3. 下载判定：
   - 未登录 → **403**；
   - `OwnerUserId > 0` 且等于当前用户 id → 允许；
   - 当前用户 `Role === 1`（管理员）→ 允许跨用户；
   - 其余 → **403**；
   - 访客提交的记录（`OwnerUserId = 0`）仅管理员可下载。
4. 物理文件校验：`realpath` 必须位于 `@runtime/uploads` 之内且为普通文件，否则 404（防路径穿越、防登记与真实文件不一致）。
5. 文件名白名单：`^[A-Za-z0-9_-]{16,64}\.(xls|xlsx|csv|doc|docx|pdf|txt)$`。
6. 审计：允许/拒绝/未命中全部写 `runtime/audit/download-YYYYMMDD.log`（JSON 行：time/action/file/inquiry_id/user_id/role/ip）。
7. 响应：`Content-Disposition: attachment`、`Content-Type: application/octet-stream`、`X-Content-Type-Options: nosniff`。

代码位置：`controllers/DownloadController.php`（授权与审计）、`controllers/CartController.php`、`controllers/ProController.php`（写入 `OwnerUserId`）、`models/SnSiiCart.php`（`Files` 空串兜底，`OwnerUserId` 不加入 `safe`，防止 POST 批量赋值篡改归属）、`db/2026-11-24_cart_owner.sql`（加列与索引）。

数据库变更：

```sql
ALTER TABLE `snsii_cart`
    ADD COLUMN `OwnerUserId` int(8) NOT NULL DEFAULT 0 COMMENT 'creator admin user id, 0=guest' AFTER `Status`,
    ADD KEY `idx_owner` (`OwnerUserId`);
```

## 3. 实测结果（Nginx + php-cgi，`evidence/download_auth_matrix.txt`）

测试夹具：合成询价 `id=2416`，`OwnerUserId=198`（qa_other），文件 `r37authprobe0123456789.txt`，内容为合成文本。

| 用例 | 操作 | 期望 | 实际 |
|---|---|---|---|
| T1 | 上传者 qa_other 下载自己的附件 | 200 | **200**，`attachment; filename="r37authprobe0123456789.txt"`，`nosniff`，`application/octet-stream` |
| T2 | 其他普通员工 qa_tester（Role=0）下载 | 403 | **403**（连续两次一致） |
| T3 | 未登录下载 | 403 | **403** |
| T4 | 管理员 qa_admin（Role=1）跨用户下载 | 200 | **200** |
| T5 | 不存在的附件 | 404 | **404**（审计 `not_found`） |
| T6 | 路径穿越：`..%2Fconfig%2Fdb.php`、`%2e%2e%2fdb/...`、`..%5C..%5Cweb%2Findex.php` | 非 200 | **403 / 403 / 400** |
| T7 | 篡改询价 ID / 附件 ID：`?Id=2416`、`?Oid=2416`、换成他人附件文件名 | 归属人不受影响；他人仍 403 | owner `?Id` → **200**（参数不参与授权）；qa_tester → **403**；换文件名 → **403** |
| T8 | DB 有登记、真实文件被改名 | 404 | **404**（审计 `deny_missing_file`）；文件恢复后 **200** |
| T9 | 删除询价记录后再下载 | 404（按“记录即授权载体”策略） | owner **404**、admin **404**、guest **404**（审计 `not_found`） |

审计日志摘录（同一次运行）：

```json
{"time":"2026-11-24T11:26:28+08:00","action":"allow","file":"r37authprobe0123456789.txt","inquiry_id":2416,"user_id":198,"role":0,"ip":"127.0.0.1"}
{"time":"2026-11-24T11:26:29+08:00","action":"deny_forbidden","file":"r37authprobe0123456789.txt","inquiry_id":2416,"user_id":197,"role":0,"ip":"127.0.0.1"}
{"time":"2026-11-24T11:26:29+08:00","action":"deny_guest","file":"r37authprobe0123456789.txt","inquiry_id":2416,"user_id":0,"role":-1,"ip":"127.0.0.1"}
{"time":"2026-11-24T11:26:29+08:00","action":"allow","file":"r37authprobe0123456789.txt","inquiry_id":2416,"user_id":199,"role":1,"ip":"127.0.0.1"}
{"time":"2026-11-24T11:26:30+08:00","action":"deny_missing_file","file":"r37authprobe0123456789.txt","inquiry_id":2416,"user_id":198,"role":0,"ip":"127.0.0.1"}
{"time":"2026-11-24T11:26:31+08:00","action":"not_found","file":"r37authprobe0123456789.txt","inquiry_id":null,"user_id":198,"role":0,"ip":"127.0.0.1"}
```

## 4. U7 判定

- 原 U7：`qa_other` 下载 `qa_tester` 附件 → 200 → FAIL。
- 本轮：同一场景改为 **403**；上传者/管理员 200；未登录 403；不存在 404；穿越 403/400；登记与文件不一致 404；删除记录后 404。
- **U7 新判定：PASS（按“归属人 + Role=1 管理员”策略）**。

策略前提：此结论成立的条件是业务认可“普通员工只能看自己创建的询价附件、管理员可跨用户”。若业务要求全员共享，需另行提交授权模型并等待确认，不得据本轮结果放行。
