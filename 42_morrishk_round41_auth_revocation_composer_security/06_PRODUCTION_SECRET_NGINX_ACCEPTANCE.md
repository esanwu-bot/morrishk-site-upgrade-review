# 06 生产部署验收准备（只准备，未部署）

本轮未连接生产数据库、未修改生产 Nginx/PHP-FPM、未执行生产 DDL。以下为可执行验收清单，状态均为 **NOT_EXECUTED（仅本地替代验证）**。

## 1. 环境变量注入（PHP-FPM）

| 项 | 做法 |
|---|---|
| 推荐 | PHP-FPM pool 配置 `env[MORRISHK_AUTH_KEY_SECRET] = <secret>` + `clear_env = no` |
| 备选 | systemd `EnvironmentFile=`（权限 600，属主 root） |
| 禁止 | 写入仓库、镜像层、Nginx `fastcgi_param` 明文日志、部署脚本参数 |
| 验证 | `php-fpm -tt` 后，在应用内读取 `getenv('MORRISHK_AUTH_KEY_SECRET')` 长度 ≥32（不打印值） |

## 2. Secret 生成/保存/轮换/退役

1. 生成：`openssl rand -base64 48`（≥32 字符、非占位词）；
2. 保存：密钥管理系统或 600 权限环境文件，仅部署账号可读；
3. 轮换：更新环境 → 平滑重启 FPM → 所有用户重新登录（旧 Cookie 失效）；
4. 退役：旧值立即删除并记录轮换台账；**不得**回滚到旧 Secret；
5. 审计：变更前后各执行一次“登录成功 / 旧 Cookie 失效 / 新 Cookie 有效”检查。

## 3. 多 worker / 多实例一致性

- 所有 FPM worker 与所有 Web 实例必须注入同一 Secret；
- 验证：从实例 A 登录 → 将 `_identity` Cookie 请求实例 B → 应 200；
- 本地已用 8099/8101 验证同一 Secret 下身份 Cookie 互通（`evidence/multiworker.txt`）。

## 4. 登录 fail-closed

- 临时移除 Secret → `GET/POST /site/login.html` 必须 503；
- 恢复 Secret → 登录恢复；
- 本地已验证 503。

## 5. Cookie 轮换与吊销

- 登录 → 复制 `_identity` → 点击退出 → 复制件访问受保护页应 302/403；
- 重新登录后新 Cookie 可用；
- 本地已验证（`evidence/revocation_matrix.txt`）。

## 6. Nginx 路径与下载

| 检查 | 期望 |
|---|---|
| `/config`、`/runtime`、`/vendor`、`/.env`、`/composer.json` | 404 |
| `/uploads/` | 403 或 404 |
| 正常页面、sitemap、robots | 200 |
| 下载：本人/管理员 | 200 + `Content-Disposition: attachment` + `X-Content-Type-Options: nosniff` |
| 下载：他人/未登录 | 403 |
| 路径穿越 | 404 |
| `client_max_body_size` | 与 5MB 上传上限对齐 |

本地 Nginx 1.15.11 测试实例已覆盖上述路径（Round 39.2），**生产配置本身 NOT_TESTED**。

## 7. 日志脱敏

- 确认日志中不出现 `MORRISHK_AUTH_KEY_SECRET`、`_identity` 值、密码摘要；
- 检查 `runtime/logs/app.log`、PHP error log、Nginx access log 的查询串（下载文件名允许出现，Cookie 不允许）。

## 8. FPM 重启与配置变更后验证

1. `php-fpm -t` 配置校验；
2. 平滑 reload；
3. 登录 → 菜单 → 下载 → 登出 → 旧 Cookie 失效；
4. 检查 5 分钟内无 5xx 峰值；
5. 记录变更单与回滚点（回滚仅回滚代码/配置，不回滚 Secret 到旧值）。
