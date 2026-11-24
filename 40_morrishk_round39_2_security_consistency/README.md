# Round 39.2 — 安全一致性修订与 F-12 修复

基于 Review `1965239` 与应用 `4e99cf5`，本轮完成：

| 项 | 结果 |
|---|---|
| Composer 审计口径对齐 | 14 包 / 70 条（runtime 9 包 61 条、dev 5 包 9 条；critical 3 / high 28 / medium 29 / low 8 / unknown 2） |
| F-12 后台登录 | **已修复**：authKey 由账号信息 + 密码哈希派生，无 DDL；登录/失败/保持/登出/角色隔离全部验证 |
| 下载授权矩阵 | 13 项全部符合预期（owner 200、other 403、admin 200、guest 403、OwnerUserId=0 策略、404、穿越、篡改参数、删除文件、响应头） |
| Nginx | 独立测试实例（8100）验证：敏感路径 404/403，正常页面 200，下载 200 + attachment + nosniff；生产 Nginx **NOT_TESTED** |
| 新发现 | F-13：后台导航页 500（`ONLY_FULL_GROUP_BY`），记录未修 |

## 目录

- `01_COMPOSER_AUDIT_RECONCILIATION.md`
- `02_F12_AUTH_FIX.md`
- `03_AUTHORIZATION_MATRIX.md`
- `04_NGINX_SECURITY_VALIDATION.md`
- `05_REMAINING_RISKS.md`
- `evidence/`（审计 JSON、权威统计、登录/授权原始输出、Nginx 探测、F-12/F-13 错误）
- `SHA256SUMS`

## 提交

| 仓库 | 分支 | 提交 |
|---|---|---|
| 应用 | `fix/morrishk-r39-php85-native` | 见推送报告 |
| Review | `feat/morrishk-website-implementation` | 见推送报告 |

未部署生产、未修改生产数据库、未连接真实 SMTP/第三方服务；不标记任何 READY / ACCEPTED / RELEASE 状态；本轮不构成 V1 功能验收或生产验收。
