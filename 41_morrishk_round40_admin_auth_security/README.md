# Round 40 — 后台导航 SQL 修复与 AuthKey 安全修订

| 项 | 结果 |
|---|---|
| F-13 菜单 SQL | **已修复**：`GROUP BY Pid ORDER BY Pid`，`ONLY_FULL_GROUP_BY` 保持开启；员工/管理员后台首页 200，菜单层级/权限/顺序/去重全部验证 |
| AuthKey | **已改为独立 Secret**（`MORRISHK_AUTH_KEY_SECRET`，≥32 字符），密码哈希不再作为密钥；缺失 503 fail closed；轮换/改密/改名后旧 Cookie 失效 |
| 回归 | 23 个场景：PASS 22 / FAIL 1（登出后复制走的持久 Cookie 仍有效，属 Yii 无状态限制） |
| Composer | 只做处置决策，不升级；6 个 runtime 包逐项列明可利用路径、修复版本与隔离措施 |
| Nginx/生产 | 未验证（NOT_TESTED） |

## 目录

- `01_F13_SQL_FIX.md`
- `02_AUTHKEY_SECRET_DESIGN.md`
- `03_REGRESSION_MATRIX.md`
- `04_COMPOSER_RUNTIME_RISK_DECISIONS.md`
- `05_REMAINING_RISKS.md`
- `evidence/`（修复前后 SQL 复现、回归原始输出）
- `SHA256SUMS`

## 代码修改文件

- `modules/ejadmin/views/layouts/header.php`
- `modules/ejadmin/models/SnSiiManage.php`
- `controllers/SiteController.php`
- `config/params.php`

## 边界

不构成 V1 功能验收或生产验收；未标记任何 READY / ACCEPTED / RELEASE 状态；未部署生产、未改生产库、未连真实 SMTP/第三方。
