# 04 Nginx 安全路径验证

## 1. 测试环境

| 项 | 值 |
|---|---|
| Nginx | 1.15.11（`D:\phpstudy_pro\Extensions\Nginx1.15.11`），独立 prefix `D:/dev/nginx-r392` |
| PHP | php-cgi 8.5.13，FastCGI `127.0.0.1:9123` |
| 站点 | `http://127.0.0.1:8100` |
| 文档根 | `D:/dev/r39web`（指向应用 `web/` 的 junction，ASCII 路径） |
| 入口 | `D:/dev/tmp/r392_entry.php`（仓库外）：注入 `MORRISHK_*` 环境变量后 include 应用 `web/index.php` |
| 数据库 | `morrishk_r39`（应用账号，DML） |

该实例是**独立测试 Nginx**，不是生产配置；生产 Nginx/证书/限流未验证。

## 2. 结果

| 路径 | 状态 | 判定 |
|---|---|---|
| `/` | 200 | 正常页面 |
| `/products.html` | 200 | 正常页面 |
| `/sitemap.xml` | 200 | 正常 |
| `/robots.txt` | 200 | 正常 |
| `/config/db.php` | **404** | 不可达 |
| `/config/params.php` | **404** | 不可达 |
| `/runtime/uploads/` | **404** | 不可达 |
| `/runtime/logs/app.log` | **404** | 不可达 |
| `/vendor/autoload.php` | **404** | 不可达 |
| `/uploads/` | **403** | 目录禁止列出 |
| `/web/uploads/` | **404** | 不可达 |
| `/composer.json` | **404** | 不可达 |
| `/README.md` | **404** | 不可达 |
| `/.gitignore` | **404** | 不可达 |
| `/.env` | **404** | 不可达 |
| `/download/AAAAAAAAAAAAAAAA.pdf` | **404** | 不存在附件 |

## 3. 下载接口（Nginx 下）

| 场景 | 结果 |
|---|---|
| 登录（`qa_r39_a`） | GET 200 / POST **302** |
| 上传者下载自己的附件 | **200**，`Content-Disposition: attachment; filename="…pdf"`，`X-Content-Type-Options: nosniff` |
| 未登录下载同一附件 | **403** |

原始输出：`evidence/nginx_probe.txt`、`evidence/nginx_auth_download.txt`。

## 4. 配置要点（测试实例）

```nginx
root D:/dev/r39web;
location / { try_files $uri $uri/ /__r392.php$is_args$args; }
location = /__r392.php {
    fastcgi_pass 127.0.0.1:9123;
    fastcgi_param SCRIPT_FILENAME D:/dev/tmp/r392_entry.php;
    fastcgi_param SCRIPT_NAME /index.php;
    ...
}
```

- docroot 仅暴露 `web/`，`config/`、`runtime/`、`vendor/` 在根之外；
- `web/uploads/` 存在但无运行时附件（附件写入 `runtime/uploads`），目录列表被禁止。

## 5. 局限与未覆盖

| 项 | 状态 |
|---|---|
| 生产 Nginx 配置（TLS、HTTP/2、限流、真实 vhost） | **NOT_TESTED** |
| 生产 `client_max_body_size` 与上传上限对齐 | **NOT_TESTED** |
| Windows 生产/容器环境差异 | 未覆盖 |
| 长时间压测与并发连接 | 未执行 |

本轮结论：**独立测试 Nginx 下敏感路径不可达，下载授权与响应头与内置服务器一致**；不能据此认定生产 Nginx 已验收。
