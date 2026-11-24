# 08 剩余风险

## 1. 阻断级

| 编号 | 风险 | 证据 | 影响 |
|---|---|---|---|
| R-01 | 附件无用户级归属：任一后台账号可下载任一已登记附件 | 04/U7：`qa_other` 下载 `qa_tester` 流程附件 → 200 | 未满足严格“资源归属/越权”要求；单租户、单后台角色的现有模型无法表达归属 |
| R-02 | 目标环境未达成：PHP 7.4.33、MySQL 5.6.50 均不在本机 | 本机仅 7.4.3 / 7.3.4 / 8.0.2；MySQL 5.7.26 / 8.0.12 | 不能宣称生产版本兼容；本轮所有结论仅代表 PHP 7.4.3 + MySQL 8.0.12 |

## 2. 环境相关

| 编号 | 风险 | 说明 |
|---|---|---|
| R-03 | MySQL 8 `ONLY_FULL_GROUP_BY` 与旧 SQL 冲突 | 后台页面在不放宽 `sql_mode` 时 500（1055）；测试副本通过 `on afterOpen` 会话级放宽。MySQL 5.6 默认无此限制，但未实测 |
| R-04 | 后台 `news/add` 500：`@mihaildev/ckeditor` 别名缺失 | CSRF 已通过后进入视图失败；属既有依赖/别名问题，未在本轮修复 |
| R-05 | 生产 Web 服务器规则未落地 | 301 与 `/download`、`.html` 重写在 `web/.htaccess`（Apache）；Nginx 需等效配置 |

## 3. 功能/安全残留

| 编号 | 风险 | 说明 |
|---|---|---|
| R-06 | 下载响应内联类型 | `sendFile` 默认按扩展名输出 `application/pdf` 等；若未来允许 HTML/SVG 类扩展需强制 `Content-Disposition: attachment`。当前白名单不含 html/svg |
| R-07 | 上传仍存于 `runtime/uploads` 单目录 | 无病毒扫描、无配额；随机名 + 认证下载已缓解 |
| R-08 | csrf 头依赖 jQuery 已加载 | 布局注入 `$.ajaxSetup`；若页面在 jQuery 前发起 POST AJAX，会被 400 拒绝（安全默认，不是漏洞） |
| R-09 | 尾斜杠 301 仅覆盖以 `/` 结尾 | 重复斜杠 `//`、大小写路径未做 301；canonical 已归一 |
| R-10 | sitemap 使用固定正式域名 | 多域名/多语言站点若共用此配置会输出同一域名；当前单站点成立 |

## 4. 已确认消除

- 浏览器端 `wm.zokoko.cn` 直接调用：0 引用（PDP/购物车）。
- 无附件询价 500：已修复（`Files=''`）。
- 子分类 500：已修复（cache 86400）。
- JSON-LD `brand="Array"` 与相对 image：已修复。
- 上传静态直链：404。
- 后台 7 控制器写操作 CSRF：已恢复（无 token=400）。

## 5. 判定

**DEMO_READY：NO｜FUNCTION_ACCEPTED：NO｜PRODUCTION_READY：NO｜RELEASE_APPROVED：NO**

R-01（附件归属）与 R-02（目标版本环境）为本轮阻断项，需 Reviewer 决定关闭方式。
