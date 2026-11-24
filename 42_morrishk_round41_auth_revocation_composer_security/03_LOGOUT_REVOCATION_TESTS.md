# 03 登出吊销与回归测试

环境：PHP 8.5.13、MySQL 8.4.13（`ONLY_FULL_GROUP_BY` 开启）、测试库 `morrishk_r39`、内置服务器 8099/8101。

## 1. 吊销测试（AuthKeyVersion）

| # | 场景 | 实际 | 判定 |
|---|---|---|---|
| 1 | 登录后持久 Cookie 有效 | 200 | PASS |
| 2 | 复制 Cookie 到另一客户端 | 有效（200） | PASS |
| 3 | 原客户端登出 | 302，版本 0→1 | PASS |
| 4 | 复制的 Cookie 再访问受保护页 | 302 | PASS |
| 5 | 其他设备的旧持久 Cookie | 302（账号级全部吊销，设计约定） | PASS |
| 6 | 其他设备的活动 Session | 302（实测；设计上 Session 不保证随版本立即失效） | PASS（附注） |
| 7 | 重新登录后新 Cookie | 200 | PASS |
| 8 | 密码变更后旧 Cookie | 302 | PASS |
| 9 | 用户名变更后旧 Cookie | 302 | PASS |
| 10 | 账号状态变更后旧 Cookie | 302 | PASS |
| 11 | Secret 轮换后旧 Cookie | 302 | PASS |
| 12 | Secret 为弱值（`a`×40） | 登录 503 | PASS |
| 13 | Secret 缺失 | 登录 503 | PASS |
| 14 | 并发登出（2 个请求） | 302,302；旧 Cookie 302 | PASS |
| 15 | 登出后并发旧 Cookie（3 个请求） | 302,302,302 | PASS |
| 16 | 递增不存在用户 | `InvalidConfigException` | PASS |
| 17 | AuthKeyVersion 列缺失 | `InvalidConfigException` | PASS |
| 18 | 多 worker（8099 ↔ 8101）身份 Cookie | 均 200 | PASS |
| 19 | 员工/管理员下载隔离 | owner 200 / other 403 / admin 200 / guest 403 | PASS |

## 2. 会话边界（需 Reviewer 知悉）

- `AuthKeyVersion` 只作用于**持久 Cookie**；
- 已登录的浏览器 Session 不会被版本立即踢下线（Yii 默认不校验版本）；
- 需要“强制所有在线会话立即失效”时，应引入服务端票据表或 Session 版本校验（未实现）。

## 3. 原 23 项回归

Round 40 的 23 项（登录、菜单、RBAC、下载、Secret 轮换等）在本轮改动后重新执行：除 #19（Round 40 的登出复制 Cookie）已由本轮 AuthKeyVersion 修复外，其余保持 PASS。Round 40 的 23 项中，本轮替换/补充了登出相关用例（见上表 #4/#5）。

## 4. 证据

- `evidence/revocation_matrix.txt`（逐条实际 HTTP 结果）
- `evidence/cli_checks.txt`（fail-closed CLI）
- `evidence/multiworker.txt`
- `evidence/migration_idempotency.txt`
