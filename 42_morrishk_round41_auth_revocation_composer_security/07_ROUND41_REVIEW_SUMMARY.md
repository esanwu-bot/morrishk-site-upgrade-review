# 07 Round 41 复核摘要

## 1. 本轮完成

| 项 | 结果 |
|---|---|
| F-14 AuthKeyVersion 吊销 | **PASS**：账号级全部设备吊销；登出递增版本；复制/其他设备旧 Cookie 失效；并发登出与并发旧 Cookie 全部 302 |
| AuthKey 细节 | **PASS**：规范 JSON 载荷、完整 SHA-256、Secret 强度校验、fail closed、多 worker 一致、轮换失效 |
| F-15 Composer 补丁 | **BLOCKED**：镜像无 2.0.55 / 2.0.20；未伪造升级 |
| 上传白名单 | 已移除 `xls,xlsx`（无解析调用、无业务必要性证据）；`.xlsx` 被拒、`.pdf` 正常 |
| F-16 生产验收清单 | 已编制，全部为准备项，**未部署** |
| 回归 | 19 项吊销/认证 + Round 40 原有场景（菜单、RBAC、下载）全部 PASS |

## 2. 数据模型与迁移

- `snsii_manage.AuthKeyVersion int NOT NULL DEFAULT 0`；
- 迁移 `db/2026-11-25_auth_key_version.sql` 可重复执行（连续两次 exit=0）；
- 回滚 `db/rollback_auth_key_version.sql`（需同时回滚代码）。

## 3. 未解决 / NOT_TESTED

| 项 | 状态 |
|---|---|
| `yii2` 2.0.55、`yii2-redis` 2.0.20 | **BLOCKED**（镜像缺失） |
| 生产 Nginx/PHP-FPM、生产 Secret 注入 | **NOT_TESTED** |
| 服务端 Session 立即吊销（在线会话踢出） | 未实现（设计边界） |
| guzzle/phpseclib/php-jwt 联动升级 | 未执行 |
| MySQL 迁移演练 | 未执行 |

## 4. 需要 Reviewer 决策

1. 镜像补齐后，是否按本轮给出的命令执行 2.0.55 / 2.0.20 升级并回归。
2. “在线会话立即失效”是否纳入下一轮（需服务端票据表）。
3. 上传白名单移除 `xls/xlsx` 是否与业务预期一致。
4. 生产验收由谁执行、在哪个环境执行。

## 5. 状态声明

未设置 `V1_READY`、`FUNCTION_ACCEPTED`、`PRODUCTION_READY`、`RELEASE_APPROVED`；本轮不代表 V1 功能验收或生产验收通过。
