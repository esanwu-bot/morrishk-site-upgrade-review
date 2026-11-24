# 回归矩阵（Round 37 更新）

说明：

- **独立测试**：本轮新执行的请求/查询，具备本轮原始证据。
- **重复场景**：上轮已验收、本轮未改动相关代码，沿用上轮证据；本轮只做必要的回归抽查或环境一致性说明。
- 本轮运行环境：PHP 7.4.3 (NTS) + MySQL 8.0.12 + Nginx 1.15.11 + php-cgi 7.4.3，端口 8096。
- 目标环境（PHP 7.4.33 + MySQL 5.6.50）为 **BLOCKED**，表中所有“PASS”均指上述本机环境。

| 编号 | 项目 | 类型 | 实际 | 证据 |
|---|---|---|---|---|
| R-01 | 首页 `/` 200 | 独立 | **200**（48133 B） | `evidence/nginx_matrix.txt` |
| R-02 | `/products.html` 路由 | 独立 | **200** | 同上 |
| R-03 | `/about.html` 路由 | 独立 | **200** | 同上 |
| R-04 | `/sitemap.xml` | 独立 | **200**，`application/xml` | 同上 |
| R-05 | `/robots.txt` | 独立 | **200** | 同上 |
| R-06 | 尾斜杠 301 | 独立 | `/products.html/` → **301** `/products.html` | 同上（上轮另在 `.htaccess` / `router.php` 验证） |
| R-07 | 敏感目录不可访问 | 独立 | `/uploads`、`/runtime`、`/config`、`/db`、`/vendor`、`/tests` 全部 **403** | 同上 |
| R-08 | 未登录下载 | 独立 | **403** | `evidence/download_auth_matrix.txt` T3 |
| R-09 | 不存在附件下载 | 独立 | **404** | 同上 T5 |
| R-10 | 上传者下载自己附件 | 独立 | **200** + `attachment` + `nosniff` | 同上 T1 |
| R-11 | 其他普通员工下载 | 独立 | **403** | 同上 T2 |
| R-12 | 管理员跨用户下载 | 独立 | **200** | 同上 T4 |
| R-13 | 路径穿越 | 独立 | **403 / 403 / 400** | 同上 T6 |
| R-14 | 篡改询价/附件 ID | 独立 | owner 200（参数不参与授权）；其他员工 403 | 同上 T7 |
| R-15 | 登记记录与真实文件不一致 | 独立 | **404**，恢复后 200 | 同上 T8 |
| R-16 | 删除询价后下载 | 独立 | owner/admin/guest 全 **404** | 同上 T9 |
| R-17 | 后台登录 | 独立 | qa_tester/qa_other/qa_admin 均 **302** → `/ejadmin-index.html` | 同上登录行 |
| R-18 | 后台 `news/add` CKEditor | 独立 | GET **200**，合法 CSRF POST **200** | `evidence/admin_news_add.txt` |
| R-19 | 上传随机名 / 5MB / MIME 校验 | 重复 | 上轮 PASS，本轮未改上传代码 | `36_.../04_UPLOAD_SECURITY_VALIDATION.md` |
| R-20 | CSRF 非法请求拒绝 | 重复 | 上轮 PASS；本轮合法 CSRF 200 复核 | `36_.../06_CSRF_URL_VALIDATION.md`、`evidence/admin_news_add.txt` |
| R-21 | PDP 询价写入 + Mock 发送 | 重复 | 上轮 PASS；本轮合成询价写入 DB 成功 | 上轮证据 + `evidence/db_verification.txt` |
| R-22 | URL 归一 / 搜索路由 | 重复 | 上轮 PASS，本轮未改 | `36_.../06_CSRF_URL_VALIDATION.md` |
| R-23 | JSON-LD brand/image | 重复 | 上轮 PASS，本轮未改 | 上轮证据 |
| R-24 | Composer 平台检查 | 独立 | 7.4.3 全部 success，exit=0 | `evidence/composer_platform_check.txt` |
| R-25 | 标准依赖安装 | 独立 | lock 驱动 71 包，autoload 生成 | `evidence/composer_install.txt` |
| R-26 | 目标 PHP 7.4.33 | — | **BLOCKED** | `evidence/platform_probe.txt` |
| R-27 | 目标 MySQL 5.6.50 | — | **BLOCKED** | 同上 |
| R-28 | 目标环境核心矩阵重跑 | — | **BLOCKED**（依赖 R-26/R-27） | `02_TARGET_ENVIRONMENT_BLOCKED.md` |

## 未闭环项

- R-26–R-28：目标版本不可得，保持 BLOCKED。
- 若业务要求“全员共享附件”，R-10~R-16 的策略需重新定义并获得业务确认。
