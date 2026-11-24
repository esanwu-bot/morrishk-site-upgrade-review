# Round 37 — 附件授权与目标环境最终验收

本轮只处理 Round 37 指令中的 P0-1、P0-2、P1 与安全材料，不新增业务功能。
应用代码追加在 `fix/morrishk-v1-runtime-defects`，Review 材料位于本目录。

## 1. 结论总览

| 编号 | 事项 | 结果 | 说明 |
|---|---|---|---|
| P0-1 | 附件资源授权（U7） | **PASS（策略已实现）** | 归属字段 + 归属人/管理员双重校验；U7 由“任意登录可下载”改为 owner 或 Role=1 管理员 |
| P0-1 | 下载测试矩阵（9 组） | **PASS** | T1–T9 全部按预期；原始请求/响应/审计见 `evidence/download_auth_matrix.txt` |
| P0-2 | PHP 7.4.33 + MySQL 5.6.50 目标环境 | **BLOCKED** | 本机无这两个精确版本，Docker 不可用；未用 7.4.3 / 8.0.12 冒充 |
| P0-2 | Composer 锁文件平台检查 | **PASS（7.4.3 上）** | `check-platform-reqs` 全部 success，exit=0；未使用 `--ignore-platform-reqs` |
| P1 | 后台 `news/add` CKEditor 500 | **PASS** | 别名补齐后 GET 200、合法 CSRF POST 200，无 `Invalid path alias` |
| P1 | Nginx 等效配置 | **PASS（已提交并实测）** | `.html`、`/download`、sitemap.xml、尾斜杠 301、敏感目录 403 均实测 |
| P1 | 下载 `attachment` + `nosniff` | **PASS** | `Content-Disposition: attachment`、`X-Content-Type-Options: nosniff` |
| — | 安全材料（明文口令/轮换） | **PASS** | 36_ 文档明文口令已移除；旧口令实测失效；新口令不入库 |
| — | 交付一致性 | **PASS** | diff check、文件白名单、父提交、远端同步、SHA256SUMS 均见 `06_COMMITS_AND_DELIVERY.md` |

**未标记**：DEMO_READY、FUNCTION_ACCEPTED、PRODUCTION_READY、RELEASE_APPROVED 均为 NO。

## 2. 环境与边界

- 应用代码提交：`23f9986902edfe971fcf963137162466c775cdf5`（父 `af4765f`）
- 运行/测试环境：PHP 7.4.3 (NTS) + MySQL 8.0.12 + Nginx 1.15.11 + php-cgi 7.4.3（本机）
- 未执行：生产部署、真实客户数据操作、真实 SMTP/第三方调用；询价发送继续使用 Mock。
- 测试数据全部为合成数据（`ROUND37-SYNTHETIC`），未使用真实询价内容或真实附件。

## 3. 文档索引

| 文件 | 内容 |
|---|---|
| `01_ATTACHMENT_AUTHORIZATION.md` | 权限模型核查、归属方案、代码位置、T1–T9 实测、U7 判定 |
| `02_TARGET_ENVIRONMENT_BLOCKED.md` | 版本探测、Composer 平台检查、scripts 影响、BLOCKED 理由 |
| `03_NGINX_WEB_SERVER.md` | 提交的 Nginx 配置、测试环境差异、请求矩阵实测结果 |
| `04_REGRESSION_MATRIX.md` | 回归矩阵（独立测试 / 重复场景），逐项结果 |
| `05_SECURITY_MATERIALS.md` | 明文口令移除、轮换结果、数据边界 |
| `06_COMMITS_AND_DELIVERY.md` | 提交 SHA/父提交、文件白名单、远端同步、SHA256SUMS |
| `evidence/` | 原始命令输出、请求/响应、DB 校验、审计日志、配置文件副本 |
| `scripts/` | 可复跑的验证脚本（下载授权矩阵、Nginx 路由矩阵） |

## 4. 需要 Reviewer / 业务确认的点

1. **附件可见范围**：本轮按“仅归属人 + Role=1 管理员”实现。若业务实际要求“所有后台员工共享全部询价附件”，需要业务书面确认后改为显式授权模型；在此之前 U7 不应被视为“全员共享”已放行。
2. **目标版本**：PHP 7.4.33 与 MySQL 5.6.50 的兼容性仍未取得实测证据，保持 BLOCKED。
3. **生产 Nginx 版本**：实测用的是 Nginx 1.15.11；生产若为其他版本，需在目标机重跑 `scripts/run_nginx_matrix.ps1` 的等价请求集。
