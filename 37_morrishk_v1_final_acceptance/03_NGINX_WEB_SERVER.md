# P1 后台与 Web 服务器

## 1. 后台 `news/add` CKEditor 500

- 根因：`@mihaildev/ckeditor/editor` 别名不存在 → `Invalid path alias` → 500。
- 修复：`config/web.php` 增加
  ```php
  '@mihaildev' => '@vendor/mihaildev',
  '@mihaildev/ckeditor' => '@vendor/mihaildev/yii2-ckeditor',
  ```
- 实测（`evidence/admin_news_add.txt`，Nginx 8096）：
  - `GET /ejadmin/news/add.html` → **200**，页面含 CKEditor（mihaildev）引用；
  - 同会话合法 CSRF（88 字符）`POST /ejadmin/news/add.html` → **200**，响应无 `Internal Server Error` / `Invalid path alias`。

## 2. Nginx 配置（已提交）

生产配置：`deploy/nginx/morrishk.conf`（同时复制到 `evidence/production_nginx.conf`）。

覆盖点：

| 要求 | 配置 |
|---|---|
| `.html` 路由 | `location / { try_files $uri $uri/ /index.php$is_args$args; }` + Yii `urlManager` |
| `/download` | 同上，交给 `DownloadController`；附件在 `runtime/uploads`，Web 根之外 |
| Sitemap | 同上；`sitemap.xml` 规则在 `config/params.php` 中 `suffix => ''` |
| 尾斜杠 301 | `rewrite ^/(.+)/$ /$1 permanent;` |
| 禁止 runtime/配置/上传存储 | `location ^~ /uploads/ { deny all; }`、`location ^~ /runtime/ { deny all; }`、`location ~* ^/(config|db|vendor|tests?)/ { deny all; }` |
| 隐藏文件 | `location ~ /\.(?!well-known) { deny all; }` |
| 安全响应头 | `add_header X-Content-Type-Options nosniff always;` |

## 3. 实际请求验证（Nginx 1.15.11 + php-cgi 7.4.3）

证据：`evidence/nginx_matrix.txt`、`evidence/nginx_test.conf`。

| 路径 | 结果 |
|---|---|
| `/` | 200（48133 B） |
| `/products.html` | 200 |
| `/about.html` | 200 |
| `/sitemap.xml` | 200，`Content-Type: application/xml; charset=UTF-8` |
| `/robots.txt` | 200 |
| `/products.html/` | **301** → `/products.html`（Location 正确） |
| `/download/24ggpujdNQulsi0_rNo5A4XM.txt`（未登录） | **403** |
| `/download/does-not-exist.txt` | **404** |
| `/uploads/images/logo.png` | **403** |
| `/runtime/logs/app.log` | **403** |
| `/config/db.php` | **403** |
| `/db/2026-11-24_cart_owner.sql` | **403** |
| `/vendor/autoload.php` | **403** |
| `/tests/probe.txt` | **403** |
| `/no-such-page.html` | 404 |

下载响应头（登录用户，`evidence/download_auth_matrix.txt`）：

```
HTTP/1.1 200 OK
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="r37authprobe0123456789.txt"
X-Content-Type-Options: nosniff
```

说明：Nginx `add_header` 与 PHP 控制器都会输出 `X-Content-Type-Options: nosniff`，响应中出现重复头；浏览器语义一致，不影响安全性。若需要唯一头，可在 Nginx 侧对 `/download` 关闭 `add_header`。

## 4. 测试环境与生产配置的差异（必须说明）

测试实例是隔离前缀 `C:\nginx_r37`（端口 8096，root `C:/r37app/web`），与生产配置的差异：

1. `root` / `fastcgi_pass` 端口不同（测试 `127.0.0.1:9001`，生产 `127.0.0.1:9000`）。
2. 测试配置**不使用** `include fastcgi_params`，改为显式列出 FastCGI 参数并**不发送 `DOCUMENT_ROOT`**。
   原因：本机 php-cgi 7.4.3 (NTS, Windows) 在该变量存在时对同一 `SCRIPT_FILENAME` 返回 `404 No input file specified.`（已在 CGI 模拟中逐项复现：存在 `DOCUMENT_ROOT` 即失败，移除即成功）。这是本机 php-cgi 的兼容问题，与生产 PHP-FPM 无关；生产配置保留标准 `include fastcgi_params`。
3. 测试环境 `php.ini` 使用副本（移除 phpstudy 的 `open_basedir` 限制），仅影响本机验证，不进入仓库。

## 5. 结论

- 后台 CKEditor 500：**PASS**。
- Nginx 等效配置与请求验证：**PASS（Nginx 1.15.11 实测）**。
- 生产 Nginx 版本未知，若与 1.15.11 不同，需在目标机重跑 `scripts/run_nginx_matrix.ps1`。
- 下载 `attachment` + `nosniff`：**PASS**。
