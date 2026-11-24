# 07 Round 42 交付总结

## 1. 仓库状态（提交前核对）

| 项 | 应用仓库 | Review 仓库 |
|---|---|---|
| 路径 | `E:\workspace\独立站\morrishk-site-r39-wt` | `E:\workspace\独立站\morrishk-site-upgrade-review-wt-session-a` |
| 分支 | `fix/morrishk-r39-php85-native` | `feat/morrishk-website-implementation` |
| 基线 / 当前 HEAD | `b7e8933`（parent `2478920`） | `4fcf385`（parent `2dd2cf1`） |
| 远端 | `codeup.aliyun.com/.../morrishk-site.git` | `github.com/esanwu-bot/morrishk-site-upgrade-review.git` |
| 远端同名分支 | `b7e8933`（一致） | 本轮提交前需推送；推送时复核 |
| 未提交改动 | `composer.lock`（本轮升级） | `43_.../`（本轮新增）；另有 Round 37 既有修改未纳入提交 |

Round 37 的既有未提交修改（`37_morrishk_v1_final_acceptance/scripts/run_download_auth_matrix.ps1`）
保持原样，未覆盖、未清理、未混入本轮提交。

## 2. 应用仓库改动

| 文件 | 变化 |
|---|---|
| `composer.lock` | `yiisoft/yii2` 2.0.53 → 2.0.55；`yiisoft/yii2-redis` 2.0.17 → 2.0.20；`ezyang/htmlpurifier` 4.19.0 → 4.19.1；`bower-asset/punycode` 1.4.1 → 2.3.1（unified diff：`evidence/round42_composer_lock.diff`） |
| `composer.json` | 无变化（约束已允许） |
| 源码 / SQL | **无变化**（F-17 仅提供材料；F-18 仅测试；上传策略不变） |

`git diff --stat`：

```text
 composer.lock | 102 +++++++++++++++++++++++++------------------------------------
 1 file changed, 39 insertions(+), 63 deletions(-)
```

## 3. F-17 材料

- `01_AUTHKEY_SOURCE_REVIEW.md`：`SnSiiManage.php` L123–L209、`SiteController.php` L185–L238、
  `config/params.php` L11、两份 SQL 全文、unified diff 摘要、文件 SHA256。
- `02_AUTHKEY_VERSION_MIGRATION_REVIEW.md`：迁移/幂等/回滚的实际命令与结果。
- `evidence/source_*.txt`、`round41_changes.diff`、`round41_changes.stat.txt`、
  `file_sha256.txt`、`migration_run.log`。

## 4. F-18 结论

| 语义 | 结果 |
|---|---|
| 持久 Cookie 账号级吊销 | **成立**：A 登出后，B 仅带旧 `_identity-B` → 302，服务端拒绝并下发删除指令 |
| 当前 PHP Session 被删除 | 仅 A（`logout` 销毁）；**B 的 Session 文件仍存在**（107 bytes，含 `__id`、`__authKey`） |
| 其他设备在线会话 | **认证状态失效**：B 仅带 `PHPSESSID-B` → 302；机制是 Yii `renewAuthStatus()` 每请求重校验 `__authKey` |
| 所有在线会话强制下线 | 对当前登录流程建立的会话成立，但依赖“下一次请求”；**不是**服务端主动断连；无票据表 |

Round 41 的“302”不是 Session 被删除，而是 `__authKey` 版本失效导致 identity 被置空。
详见 `03_SESSION_REVOCATION_ISOLATION_TEST.md`。

## 5. F-19 结论

| 项 | 结果 |
|---|---|
| `yii2` | **2.0.55（PASS）** |
| `yii2-redis` | **2.0.20（PASS）** |
| `composer install` | PASS（Nothing to install） |
| `check-platform-reqs` | PASS |
| `composer audit` | 12 包 / 68 条（升级前 14 / 70）；yii2、yii2-redis 的 advisory 已消失 |
| 业务回归 | PASS：登录、后台菜单、PDP、询价、上传、下载授权、SEO |
| BLOCKED | **无** |

## 6. 上传策略

- 维持 `csv, doc, docx, pdf, txt`；XLS/XLSX 关闭且本轮复核仍被拒。
- 无客户明确 Excel 需求证据；未来如需解析，单独升级并隔离进程。
- 详见 `06_UPLOAD_FORMAT_DECISION.md`。

## 7. 测试统计

| 类别 | 数量 | 结果 |
|---|---|---|
| 认证/吊销矩阵 | 23 行输出（含 19 个判定点） | PASS |
| 功能回归 | 5 项 + sitemap/robots | PASS |
| 上传格式 | 3 种（xlsx/csv/pdf） | PASS（xlsx 拒绝、csv/pdf 接受） |
| Session 隔离 | 10 项主结果 + 会话文件级追踪 | PASS（结论见 03） |
| 迁移 | 迁移 / 幂等 / 回滚 | PASS（仅临时库） |
| Composer | update / install / platform / audit | PASS |

## 8. 未测试事项

- 生产 Nginx + php-fpm 形态、真实域名/HTTPS。
- Redis 作为 Session/Cache 的场景。
- 真实 SMTP / 第三方 API（仍为 Mock）。
- 真实浏览器交互（本轮为 HTTP 级）。
- 其余 12 包 / 68 条 advisory 的修复。
- 无 `__authKey` 的历史 Session 在版本递增后的行为。
- 生产库迁移耗时与锁等待。

## 9. 状态声明

本轮**未**设置也未暗示以下任何状态：

`V1_READY`、`FUNCTION_ACCEPTED`、`PRODUCTION_READY`、`RELEASE_APPROVED`。

未部署生产、未修改生产数据库、未扩展网站业务功能。

## 10. 停止点

Round 42 工作到此停止，等待 Reviewer 复核。不进入 Round 43。
