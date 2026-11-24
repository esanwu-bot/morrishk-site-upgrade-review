# 01 修复变更清单（验收阻断项收敛）

- 修复分支：`fix/morrishk-v1-runtime-defects`
- 本轮提交：`af4765f81509ef1d1e58b0104f59ba9963e2c37b`
- 父提交：`d74011209f57fb138cc30762f32399255b52e27d`
- 基线：`d80491bcbb0efe4d930a333308a9ffef599c4318`
- 原工作区未修改；其未跟踪 `web/router.php` 仍保留

## 1. 上传安全闭环

| 项 | 改动 |
|---|---|
| 存储位置 | `web/uploads/` → `@runtime/uploads`（`runtime` 在 Web 根之外） |
| 文件名 | 原始名完全弃用，`generateRandomString(24) + 扩展名` |
| 数据登记 | `snsii_cart.Files = uploads/<随机名>.<ext>` |
| 静态访问 | 新文件不在 Web 根，`/uploads/<name>` 返回 404 |
| 受控下载 | 新增 `controllers/DownloadController.php`：仅登录后台人员；文件名正则；必须命中数据库记录；`realpath` 前缀校验 |
| 路由 | `['pattern' => 'download/<file:...>', 'route' => 'download/index', 'suffix' => '']` |
| 校验保留 | 5 MiB、扩展名白名单、`checkExtensionByMimeType=true` |

## 2. PDP 询价端到端

| 项 | 改动 |
|---|---|
| 第三方调用 | 删除 `views/pro/item.php` 与 `views/cart/index.php` 中对 `https://wm.zokoko.cn/api/sendEmail`、`/api/upload/image` 的全部调用 |
| 表单提交 | PDP 表单恢复原生 POST 到 `/products/<id>/<part>.html`（`ProController::actionItem`）；购物车表单原生 multipart POST 到 `/shopping-cart.html` |
| 适配器 | 新增 `service/inquiry/InquirySenderInterface.php`、`MockInquirySender.php` |
| 组件 | `config/web.php` 增加 `inquirySender`，默认 Mock，可用 `MORRISHK_INQUIRY_SENDER_CLASS` 替换 |
| 调用点 | `ProController::actionItem`、`CartController::actionIndex` 保存成功后调用；异常只记日志，不丢询盘 |
| Mock 行为 | 写 `runtime/inquiry/inquiry-YYYYMMDD.log` + 通过 file transport 生成 `.eml`，无 SMTP/第三方出网 |

## 3. CSRF 与 URL

| 项 | 改动 |
|---|---|
| 后台 7 控制器 | 删除 `Ad/Api/Category/Help/Info/News/Product` 的 `enableCsrfValidation=false` |
| 购物车 AJAX | 取消 `add/del/clear/hot-part` 豁免（删除 `beforeAction` 覆盖）；全站注入 `X-CSRF-Token` 头（Yii 2.0.44 支持该头） |
| 尾斜杠 301 | `web/.htaccess` 新增规则：`^(/.+)/$ → /$1 [R=301,L]`；测试环境在 `web/router.php` 提供等价行为 |
| 正式域名 | `params['SiteUrl']`（默认 `https://www.morrishk.net`，可环境变量覆盖），`canonicalUrl()` 与 Sitemap 统一使用；不再输出 localhost |

## 4. 变更文件清单

修改：

```
commands/SnSiiController.php
config/params.php
config/web.php
controllers/CartController.php
controllers/ProController.php
modules/ejadmin/controllers/{Ad,Api,Category,Help,Info,News,Product}Controller.php
views/cart/index.php
views/layouts/main.php
views/pro/item.php
web/.htaccess
```

新增：

```
controllers/DownloadController.php
service/inquiry/InquirySenderInterface.php
service/inquiry/MockInquirySender.php
```

## 5. 与上一轮的关系

- 上一轮（`d740112`）已关闭 P0-1~P0-5 的运行时 500/404/SEO 问题；
- 本轮只处理验收阻断项（上传闭环、询价闭环、CSRF 收尾、URL 归一、环境），未扩大业务功能；
- `composer.json` / `composer.lock` 未修改；数据库结构未修改。
