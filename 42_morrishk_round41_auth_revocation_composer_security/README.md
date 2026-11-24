# Round 41 — AuthKey 登出吊销、Composer 安全补丁与部署验收准备

| 项 | 结果 |
|---|---|
| F-14 持久 Cookie 吊销 | **PASS**：`snsii_manage.AuthKeyVersion` + 登出递增；复制/其他设备旧 Cookie 失效；并发登出与并发旧 Cookie 均被拒 |
| AuthKey 细节 | **PASS**：规范化 JSON 载荷、完整 SHA-256、Secret 强度校验、fail closed、多 worker 一致、轮换失效 |
| F-15 Composer 补丁 | **BLOCKED**：镜像源无 `yii2 2.0.55` / `yii2-redis 2.0.20`，未伪造升级；`.xls/.xlsx` 上传已关闭 |
| F-16 生产验收 | 清单已编制，**未部署** |
| 回归 | 19 项吊销/认证 + 既有菜单/RBAC/下载场景全部 PASS |

## 目录

- `01_AUTHKEY_VERSION_DESIGN.md`
- `02_AUTHKEY_IMPLEMENTATION.md`
- `03_LOGOUT_REVOCATION_TESTS.md`
- `04_COMPOSER_PATCH_REPORT.md`
- `05_REMAINING_DEPENDENCY_RISKS.md`
- `06_PRODUCTION_SECRET_NGINX_ACCEPTANCE.md`
- `07_ROUND41_REVIEW_SUMMARY.md`
- `evidence/`、`SHA256SUMS`

## 应用代码改动

- `modules/ejadmin/models/SnSiiManage.php`
- `controllers/SiteController.php`
- `models/SnSiiCart.php`
- `db/2026-11-25_auth_key_version.sql`
- `db/rollback_auth_key_version.sql`

未部署生产、未改生产库、未连真实 SMTP/第三方；未设置任何 READY / ACCEPTED / RELEASE 状态。
