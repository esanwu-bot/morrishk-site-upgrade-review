# 03 Round 40 回归矩阵

环境：PHP 8.5.13 + MySQL 8.4.13（`ONLY_FULL_GROUP_BY` 保持开启），内置服务器 8099，测试库 `morrishk_r39`。未关闭错误报告，未使用测试入口注入业务参数。

| # | 场景 | 结果 | 判定 |
|---|---|---|---|
| 1 | 员工登录 | GET 200 / POST 302 | PASS |
| 2 | 管理员登录 | GET 200 / POST 302 | PASS |
| 3 | 错误密码 | POST 200 + `Incorrect username or password` | PASS |
| 4 | 不存在账号 | POST 200 + 错误文案 | PASS |
| 5 | 员工 `/ejadmin-index.html` | 200 | PASS |
| 6 | 管理员 `/ejadmin-index.html` | 200 | PASS |
| 7 | 菜单父子层级 | 父项均在子项之前 | PASS |
| 8 | 菜单权限隔离 | 员工页面无 `News`/`Accounts` | PASS |
| 9 | 重复菜单 | 无 | PASS |
| 10 | 排序稳定性 | 两次导航片段完全一致 | PASS |
| 11 | 持久登录 Cookie | 仅携带 `_identity` 时 200 | PASS |
| 12 | Secret 轮换后旧 Cookie | 302（失效） | PASS |
| 13 | Secret 恢复后旧 Cookie | 200（同 Secret 下有效） | PASS（语义正确） |
| 14 | 密码变更后旧 Cookie | 302 | PASS |
| 15 | 用户名变更后旧 Cookie | 302 | PASS |
| 16 | Secret 缺失 GET 登录页 | 503 | PASS |
| 17 | Secret 缺失 POST 登录 | 503 | PASS |
| 18 | 退出登录 | 302 → `/`，Session 失效 | PASS |
| 19 | 退出后复制走的持久 Cookie | **200（仍有效）** | **FAIL / 已知限制** |
| 20 | 下载：本人 | 200 + `attachment` + `nosniff` | PASS |
| 21 | 下载：其他员工 | 403 | PASS |
| 22 | 下载：管理员 | 200 + `attachment` + `nosniff` | PASS |
| 23 | 下载：未登录 | 403 | PASS |

统计：23 个场景，**PASS 22 / FAIL 1（#19）**；无 BLOCKED。

说明：

- #19 是 Yii 无状态持久 Cookie 的固有限制，不是本轮引入；处置方案见 `02_AUTHKEY_SECRET_DESIGN.md` 第 5 节。
- #13 表示在 Secret 恢复原值后，旧 Cookie 再次有效——HMAC 语义正确，不视为缺陷。
- 原始逐条输出：`evidence/regression_matrix.txt`。

## 未覆盖

- 生产 Nginx/PHP-FPM 与真实 Secret 注入方式；
- 并发登录、多设备吊销；
- 后台其余页面逐页回归。
