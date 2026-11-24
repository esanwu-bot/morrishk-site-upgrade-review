# 01 修复变更清单（P0-1 ~ P1）

- 应用仓库：`E:\workspace\独立站\morrishk-site-fix-wt-session-a`（独立 worktree）
- 修复分支：`fix/morrishk-v1-runtime-defects`
- 提交 1：`95fa092295fa6290f20d743343854fd0c3debdc5`（P0-1~P0-5 + P1 主体）
- 提交 2：`d74011209f57fb138cc30762f32399255b52e27d`（sitemap.xml 路由后缀修正）
- 基线：`d80491bcbb0efe4d930a333308a9ffef599c4318`
- 原工作区未修改；未跟踪的 `web/router.php` 仍保留在原工作区

## 1. P0 修复

| 编号 | 问题 | 改动文件 | 修复方式 |
|---|---|---|---|
| P0-1 | 子分类 500：`Query::cache()` 收到字符串 | `controllers/ProController.php:172,179` | `->cache($Lang)` → `->cache(86400)`（明确 86400 秒 TTL）；未关闭缓存、未屏蔽错误 |
| P0-2 | 无附件询价 500（`Files` NOT NULL 无默认值） | `models/SnSiiCart.php` | `beforeSave()` 中 `Files = trim((string)$Files)`，无附件写入空串；保留数据库 NOT NULL 约束 |
| P0-3 | JSON-LD `brand="Array"` / `image` 相对路径 | `commands/SnSiiController.php:96-109`、`controllers/ProController.php:423-443` | seo() 仅对字符串值做占位符替换，跳过数组；brand 仅在厂商非空时输出 Brand 对象；image 非 http(s) 时补全 hostInfo |
| P0-4 | 购物车询价 CSRF 关闭、上传无大小限制 | `controllers/CartController.php`、`controllers/SearchController.php`、`models/SnSiiCart.php`、`web/uploads/.htaccess` | Cart 恢复 CSRF（仅 add/del/clear/hot-part 豁免）；Search 移除全局关闭；上传 `maxSize=5MB` + `checkExtensionByMimeType=true`；新增上传目录 .htaccess 禁止脚本执行 |
| P0-5 | 404 语义与路由劫持 | `controllers/PageController.php:34-37`、`controllers/ProController.php`（3 处 `die('error')`）、`config/params.php` | 空信息页/无效产品抛 `NotFoundHttpException`；新增 `/search`、`/search/index` 规则，避免 `/search.html` 落入 `/<Links>` 兜底 |

## 2. P1 修复

| 项 | 改动 | 说明 |
|---|---|---|
| robots.txt 去重 | `web/robots.txt` | 每个 UA 仅一个分组；移除 `Amazonbot`/`facebookexternalhit` 的 `Disallow` 与 `Crawl-delay` 冲突；`facebookexternalhit` 保留 `Crawl-delay: 10` 供社交预览 |
| 分类页 H1 | `views/pro/list.php:22`、`views/pro/sub.php:63` | 一级分类新增唯一 H1；子分类原 `<h2>` 改为 `<h1>` |
| canonical 归一化 | `commands/SnSiiController.php:83-94` + 5 处调用 | 新增 `canonicalUrl()`：主机小写、去 `index.php`、合并重复斜杠、去尾斜杠（根保留）；首页/分类/子分类/PDP/产品总览统一走该方法 |
| sitemap.xml | `controllers/SitemapController.php`（新增）、`config/params.php:107-108` | 实际输出 XML：首页 + 产品总览 + 5 个分类 + 2 个产品，共 9 条；规则显式 `suffix => ''` 以匹配 `.xml` |
| OG / noindex | 未改动 | 保持原有行为，回归验证通过 |

## 3. 变更文件清单（13 个）

```
commands/SnSiiController.php
config/params.php
controllers/CartController.php
controllers/PageController.php
controllers/ProController.php
controllers/SearchController.php
controllers/SiteController.php
controllers/SitemapController.php   (新增)
models/SnSiiCart.php
views/pro/list.php
views/pro/sub.php
web/robots.txt
web/uploads/.htaccess               (强制纳入，.gitignore 默认忽略 /web/uploads/*)
```

## 4. 回滚

```bash
git checkout d80491b   # 或 revert 95fa092 d740112
```

## 5. 未改动项（明确说明）

- `composer.json` / `composer.lock`：未修改（哈希见 02）。
- 数据库结构：未修改，`snsii_cart.Files` 仍为 `NOT NULL`。
- PDP 前端 JS 中的第三方询盘地址 `https://wm.zokoko.cn/api/sendEmail`：本轮未改动、未调用（见 07）。
- 历史备份文件 `ProController_bak.php`、`PageController_bak0609.php` 中的同类旧代码：未修改（不参与路由）。
