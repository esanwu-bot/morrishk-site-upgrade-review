# P0-2 五项代码独立自检（对比结果报告）

- 自检对象：`E:\workspace\独立站\morrishk-site`
- 分支：`feat/morrishk-website-implementation`
- HEAD：`d80491bcbb0efe4d930a333308a9ffef599c4318`
- 被检提交：`25afffb`（robots）、`0891ce6`（成功路由 + 首页 H1）、`d80491b`（canonical/OG/JSON-LD）
- 自检方式：`git show --stat`、`git grep`（限定 HEAD，排除工作区幽灵文件）、逐行读源码、`php -l` 语法检查
- 自检性质：**代码级独立自检**（不依赖框架启动、不调用数据库、不调用第三方）
- 执行时间：2026-11-23

## 0. 结论先行

| 编号 | 自检项 | 对应提交 | 声明 | 代码实测 | 判定 |
|---|---|---|---|---|---|
| C1 | robots meta 支持 + 询价/搜索页 noindex + robots.txt `Allow: /` | `25afffb` | 已实现 | 全部命中 | **PASS** |
| C2 | 询盘成功跳转由 `/order/success` 改为站内 `/cart/success` | `0891ce6` | 已实现 | HEAD 中 `order/success` 引用数 = 0，目标路由存在 | **PASS** |
| C3 | 首页 H1 唯一化 | `0891ce6` | 已实现 | 首页模板仅 1 个 `<h1>` | **PASS** |
| C4 | canonical 覆盖首页/分类/子分类/PDP | `d80491b` | 已实现 | 4 类页面均注入 canonical | **PASS（范围有注记）** |
| C5 | Open Graph + Product JSON-LD 输出 | `d80491b` | 已实现 | OG 4 类页面齐全，JSON-LD 入 head 且转义正确 | **PASS（有 2 项风险注记）** |

**代码级验收：5/5 PASS。**
**运行时验收：BLOCKED——当前副本 `vendor/yiisoft/yii2/Yii.php` 缺失，应用无法启动（见 §7）。本报告不把代码级 PASS 写成运行时 PASS。**

---

## 1. C1 robots 能力与 noindex 覆盖

### 声明
提交 `25afffb feat(seo): add robots meta support and noindex inquiry/search pages`，变更 4 文件：`commands/SnSiiController.php`、`controllers/CartController.php`、`controllers/SearchController.php`、`web/robots.txt`。

### 实测证据

| 关注点 | 位置 | 实测代码 |
|---|---|---|
| seo() 支持 robots | [SnSiiController.php](file:///E:/workspace/独立站/morrishk-site/commands/SnSiiController.php#L98-L99) | `registerMetaTag(['name'=>'robots','content'=>$res['robots']], 'meta-robots')` |
| 询价（无型号）页 | [CartController.php](file:///E:/workspace/独立站/morrishk-site/controllers/CartController.php#L74-L77) | `'robots' => 'noindex,follow'` |
| 询价（带型号）页 | [CartController.php](file:///E:/workspace/独立站/morrishk-site/controllers/CartController.php#L91-L95) | `'robots' => 'noindex,follow'` |
| 询盘成功页 | [CartController.php](file:///E:/workspace/独立站/morrishk-site/controllers/CartController.php#L279-L282) | `'robots' => 'noindex,nofollow'` |
| 搜索结果页 | [SearchController.php](file:///E:/workspace/独立站/morrishk-site/controllers/SearchController.php#L79-L82) | `'robots' => 'noindex,follow'` |
| robots.txt 语法 | [robots.txt](file:///E:/workspace/独立站/morrishk-site/web/robots.txt#L1-L3) | `User-agent: *` / `Allow: /`（空格已补） |

### 差异/注记
- `robots.txt` 仅修正了 `Allow:/` → `Allow: /`。**文件内仍存在重复 UA 分组与相互冲突的规则**（`Amazonbot`、`GPTBot`、`facebookexternalhit` 各出现两次，且 `Disallow` 与 `Crawl-delay` 冲突）。这是既有问题，本提交未处理，不计入本项失败，但需在后续 SEO 项中单列。
- 静态代码正确，但“页面 `<head>` 中确实出现该 meta”属运行时行为，本轮未取得 HTTP 证据（见 §7）。

**判定：PASS（代码级）。**

---

## 2. C2 询盘成功路由内链化

### 声明
`0891ce6`：`CartController::actionSend` 由 `/order/success` 改为 `/cart/success`。

### 实测证据
- `git grep -n "order/success" HEAD` → **0 条**。
- [CartController.php](file:///E:/workspace/独立站/morrishk-site/controllers/CartController.php#L273) → `return $this->redirect(['/cart/success']);`
- [CartController.php](file:///E:/workspace/独立站/morrishk-site/controllers/CartController.php#L276) → `actionSuccess()` 存在（Yii 默认路由 `cart/success` 可命中）。
- 前端 JS 同步指向：`views/cart/index.php:251`、`views/pro/item.php:240` 均为 `Url::to(['/cart/success'])`。

### 差异/注记
- `PageController.php:42`、`ProController.php:397` 也跳 `/cart/success` 且额外带 `Oid` 参数；`actionSuccess()` 不接收/不使用 `Oid`，无副作用。
- 仓库内仍有 `PageController_bak0609.php`、`ProController_bak.php` 等历史备份文件引用旧路径--它们不参与路由，属死文件，不影响判定（建议后续清理，不属本项）。

**判定：PASS（代码级）。**

---

## 3. C3 首页 H1 唯一化

### 实测证据
`views/site/index.php` 全文 `<h1>` 扫描：

| 行 | 标签 | 内容 |
|---|---|---|
| 37 | `<h1 class="text-light display-4 from-bottom delay-1">` | `a reliable and trusted` |

同页其余原 `<h1>` 已降级为 `<h2>`：第 36、48、49、60、61 行。

全仓 `views/` 目录 `<h1>` 分布（每页各自唯一）：
- `views/site/index.php:37`（首页 1 个）
- `views/pro/index.php:23`、`views/pro/item.php:63`、`views/pro/new-product.php:34`
- `views/blog/item.php:29`、`views/page/item.php:74`、`views/site/error.php:16`

布局 `views/layouts/main.php` 未含任何 `<h1>`，不会追加。

### 差异/注记
无。首页模板 H1 计数 = 1。

**判定：PASS（代码级）。**

---

## 4. C4 canonical 覆盖

### 实测证据

| 页面 | 位置 | 生成式 |
|---|---|---|
| 首页 | [SiteController.php](file:///E:/workspace/独立站/morrishk-site/controllers/SiteController.php#L121-L128) | `rtrim(hostInfo,'/') . '/'` |
| 一级分类 | [ProController.php](file:///E:/workspace/独立站/morrishk-site/controllers/ProController.php#L141-L150) | `hostInfo . strtok(request->url,'?')` |
| 子分类 | [ProController.php](file:///E:/workspace/独立站/morrishk-site/controllers/ProController.php#L270-L280) | 同上 |
| 产品详情 PDP | [ProController.php](file:///E:/workspace/独立站/morrishk-site/controllers/ProController.php#L421-L441) | 同上 |
| 搜索页 | [SearchController.php](file:///E:/workspace/独立站/morrishk-site/controllers/SearchController.php#L79-L82) | **无 canonical**（该页 `noindex,follow`） |
| 询价/成功页 | CartController | **无 canonical**（`noindex`） |

注入机制：[SnSiiController.php](file:///E:/workspace/独立站/morrishk-site/commands/SnSiiController.php#L100-L101) 以固定 key `canonical` 注册 `<link rel="canonical">`，Yii 保证同 key 只输出一次。

### 差异/注记
- 覆盖范围为“可索引页面”，`noindex` 页不设 canonical 属合理设计，不计失败。
- **风险 R1**：canonical 直接取 `hostInfo + request->url`，未做小写化/去尾斜杠/去 `index.php` 归一。同一内容的 `//`、大小写域名、带尾斜杠变体会产生不同 canonical，削弱去重效果。

**判定：PASS（代码级，范围注记 + R1）。**

---

## 5. C5 Open Graph 与 Product JSON-LD

### 实测证据

**OG 覆盖**

| 页面 | 位置 |
|---|---|
| 首页 | [SiteController.php](file:///E:/workspace/独立站/morrishk-site/controllers/SiteController.php#L129-L134)（`og:type/website,titledescription,url`） |
| 一级分类 | [ProController.php](file:///E:/workspace/独立站/morrishk-site/controllers/ProController.php#L151-L156) |
| 子分类 | [ProController.php](file:///E:/workspace/独立站/morrishk-site/controllers/ProController.php#L281-L286) |
| PDP | [ProController.php](file:///E:/workspace/独立站/morrishk-site/controllers/ProController.php#L442-L447)（`og:type/product`） |

空值跳过逻辑：`$content === '' || $content === null` → `continue`，不会输出空 OG。

**Product JSON-LD**

- 数据结构：[ProController.php](file:///E:/workspace/独立站/morrishk-site/controllers/ProController.php#L423-L432)
  - `@context`=`https://schema.org`，`@type`=`Product`
  - `name`/`sku`/`mpn` = `PartNumber`
  - `brand.@type`=`Brand`，`brand.name`=`$MRow['Name']`
  - `description`、`url`=canonical
  - 有条件追加 `image`（仅 `ProRow['Image']` 非空）
- 序列化与转义：[SnSiiController.php](file:///E:/workspace/独立站/morrishk-site/commands/SnSiiController.php#L110-L114)
  `JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP`
- 输出位置：[main.php](file:///E:/workspace/独立站/morrishk-site/views/layouts/main.php#L32-L35)，位于 `<title>` 之后、`<head>` 内（`$this->head()` 在 L52）

### 差异/注记
- **R2**：JSON-LD 无 `offers`（无 price / priceCurrency / availability）。与设计口径“PDP 不输出 offers”一致，但**不满足 Google Product 富媒体结果的必填条件**，属产品取舍，需在验收文档明示。
- **R3**：`image` 直接取 `ProRow['Image']` 原值。若库中该字段是相对路径（如 `/uploads/xx.jpg`），JSON-LD 的 `image` 不是绝对 URL，Schema 校验会失败。需数据侧保证为绝对地址或在代码中补 host 前缀。
- `brand.name` 依赖 `$MRow['Name']`；厂商为空时会输出空字符串，建议数据侧约束。

**判定：PASS（代码级，R2/R3 注记）。**

---

## 6. 语法与提交完整性

`php -l` 全部通过：

```
commands\SnSiiController.php          No syntax errors detected
controllers\SiteController.php        No syntax errors detected
controllers\ProController.php         No syntax errors detected
controllers\CartController.php        No syntax errors detected
controllers\SearchController.php      No syntax errors detected
views\site\index.php                  No syntax errors detected
views\layouts\main.php                No syntax errors detected
```

提交完整性：三个提交均在 `feat/morrishk-website-implementation` 上，HEAD=`d80491b`；工作区仅有未跟踪的临时文件 `web/router.php`（测试用，未提交，验收后应删除）。

---

## 7. 运行时验收状态（必须如实标注）

| 检查 | 结果 |
|---|---|
| `vendor/autoload.php` | 存在 |
| `vendor/yiisoft/yii2/Yii.php` | **不存在** |
| `vendor/yiisoft/yii2/` 目录 | **不存在** |
| `web/index.php:8` 依赖 | `require .../vendor/yiisoft/yii2/Yii.php` → 启动即 Fatal |

结论：本副本**无法启动 Yii 应用**，因此本轮**没有** HTTP 层的首页/分类/PDP/搜索/成功页响应、`<head>` 实际输出、canonical/OG/JSON-LD 渲染结果、询盘端到端、CSRF 实测证据。

§1–§6 的 PASS 仅代表**代码与提交声明一致**，不代表 `DEMO_READY` 或 `FUNCTION_ACCEPTED`。这两项当前仍为 **NO**。

若依赖已在其他副本安装完成，请把该副本路径给出，我将在其上直接补跑运行时五项（首页 200 / 分类页 / PDP / 搜索 noindex / 成功页），并输出真实 HTML 片段作为证据。

---

## 8. 证据复现命令

```powershell
cd 'E:\workspace\独立站\morrishk-site'
git log --oneline -3
git show --stat 25afffb 0891ce6 d80491b
git grep -n "order/success" HEAD
git grep -n "cart/success" HEAD
Select-String -Path views\site\index.php -Pattern '<h1|<h2'
Get-Content web\robots.txt
php -l controllers\ProController.php
Test-Path vendor\yiisoft\yii2\Yii.php
```
