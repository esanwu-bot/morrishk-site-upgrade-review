# Morrishk 现有网站审计

| 项目 | 内容 |
|---|---|
| 文档编号 | 32-01 |
| 版本 | V1.0 |
| 审计日期 | 2026-11-23 |
| 审计对象 | `morrishk-site` @ `cdb9c04`（静态）+ 生产 `https://www.morrishk.net/`（只读抓取） |
| 方法 | 代码静态审计、Git 历史、`php -l`、HTTP 抓取与 HTML 静态检查 |
| 未做 | 未登录服务器、未连数据库、未执行功能/性能/端到端测试 |

---

## 1. 架构与技术栈

| 项 | 结论 |
|---|---|
| 应用形态 | Yii2 Basic 单应用；无 frontend/backend/common 分层 |
| 前台控制器 | 8 个（Site/Pro/Mfr/Blog/Page/Search/Cart/Lang），32 个 action |
| 后台 | `modules/ejadmin`，10 个控制器；权限为菜单级 |
| 数据访问 | 18 个 ActiveRecord 模型，表前缀 `snsii_` |
| 多语言 | `params.DuoLang` 配置 80 个域名/语种；`messages/` 80 个语言目录 |
| URL | `enablePrettyUrl`、`suffix=.html`、15 条规则 + 单段兜底 `/<Links>.html` |
| 缓存 | FileCache（`directoryLevel=3`） |
| 静态资源 | `web/` 下 CSS/JS/图片；无构建链 |
| 依赖 | `vendor/` 未入库；`composer.lock` 已提交 |

### 1.1 现状架构判断

- 属于“传统 PHP 单体 + 文件缓存”，可维护但耦合较高。
- 前后台共用同一应用与数据库，缺少服务层和统一鉴权层。
- 无数据库迁移、无队列、无审计层。
- 有 `commands/MapController.php` 可生成 sitemap/robots，但未见定时任务与产物入库。

---

## 2. 页面与路由现状

| 业务 | 路由 | 控制器/视图 |
|---|---|---|
| 首页 | `/` | `SiteController::actionIndex` / `views/site/index.php` |
| 产品总览 | `/products.html` | `ProController::actionIndex` / `views/pro/index.php` |
| 一级分类 | `/big-categories/c-<Mid>-<Cid>/<Links>.html` | `ProController::actionList` / `views/pro/list.php` |
| 二级分类 | `/sub-categories/c-<Mid>-<Cid>/<Links>.html` | `ProController::actionSub` / `views/pro/sub.php` |
| 商品详情 | `/products/<8位ID>/<PartUrl>.html` | `ProController::actionItem` / `views/pro/item.php` |
| 搜索 | `/search/index.html?keyword=` | `SearchController::actionIndex` / `views/search/index.php` |
| 品牌/制造商 | `/manufacturer/<Links>.html` | `MfrController::actionItem` |
| 博客 | `/blog/...` | `BlogController` |
| 静态页 | `/<Links>.html` | `PageController::actionInfo` |
| 询价车/RFQ | `/shopping-cart.html` | `CartController::actionIndex` / `views/cart/index.php` |
| 后台 | `/ejadmin-index.html` 等 | `modules/ejadmin` |

> 单段兜底路由会把未知单段 URL 交给 `PageController`；未知 slug 的 404/410 行为需实测，当前未见显式 410 实现。

---

## 3. 生产站点只读检查（2026-11-23）

| URL | 状态 | 备注 |
|---|---|---|
| `https://www.morrishk.net/` | 200 | HTML 约 203 KB |
| `/products.html` | 200 | 约 100 KB |
| `/shopping-cart.html` | 200 | 约 93 KB |
| `/search/index.html?keyword=STM32` | 200 | 约 110 KB |
| `/robots.txt` | 200 | 547 B |
| `/sitemap.xml` | **404** | 根 sitemap 不存在 |

### 3.1 关键 SEO 缺陷（生产 HTML 静态检查）

| 检查项 | 首页 | 产品列表 | 搜索页 | 询价页 | 样例 PDP |
|---|---|---|---|---|---|
| `<title>` | 有（通用长标题） | 有 | 有 | 有 | 有 |
| `meta description` | 有（通用文案） | 有 | **无** | 有 | 有 |
| `meta robots` | 无 | 无 | **无** | **无** | 无 |
| `rel=canonical` | **0** | **0** | **0** | **0** | **0** |
| `hreflang`（head alternate） | **0** | 0 | 0 | 0 | **0** |
| JSON-LD / Schema | **0** | 0 | 0 | 0 | **0** |
| Open Graph / Twitter | **0** | 0 | 0 | 0 | **0** |
| H1 数量 | **3**（轮播三张） | 1 | 1 | 1 | 1 |

其他事实：

- 语言互指仅体现在页脚 80 个语言链接的 `hreflang` 属性上（部分页面），不是 `<head>` 的 alternate 标签。
- `web/robots.txt` 首行为 `Allow:/`，属于**格式规范化问题**（建议写作 `Allow: /`）；是否被具体爬虫接受取决于其解析器，本文不据此断言“语法无效”。
- 根 `sitemap.xml` 返回 404；`commands/MapController.php` 能生成 sitemap，但未证明生产已生成或定时更新。

#### 3.1.1 robots.txt 细项复核

| 检查项 | 现状 | 影响/建议 |
|---|---|---|
| User-agent 分组 | `*` 后连续多个 UA 组，部分组之间无空行 | 部分爬虫按最近 UA 组解析；建议每组之间空行分隔 |
| `Allow`/`Disallow` 适用范围 | `User-agent: *` 仅 `Allow: /`，无 Disallow | 对未列出的爬虫等于全站允许 |
| 重复规则 | `GPTBot`、`facebookexternalhit`、`Amazonbot` 多次出现 | 同一 UA 多组时行为依实现而异；建议合并为单组 |
| Crawl-delay | `Amazonbot`、`facebookexternalhit` 先有 `Crawl-delay:10`，后又 `Disallow: /` | 两条规则语义冲突；建议保留一种策略 |
| Sitemap 声明 | 无 `Sitemap:` 行 | 建议在根 robots 声明 sitemap（前提是 sitemap 可访问） |
| 目标搜索引擎行为 | Google 忽略 Crawl-delay；Bing/Yandex 支持程度不同 | 需按实际目标引擎验证，不能仅凭文件文本判断 |
| 生产与仓库一致性 | 生产 `/robots.txt` 与本轮修改前仓库内容一致 | 说明生产尚未应用本轮修改 |

> 结论：当前问题应描述为“格式与分组不规范、规则重复/冲突、缺少 Sitemap 声明”，而不是“缺少空格导致语法无效”。
- 标题/描述在多个页面重复使用同一模板文案，未与具体分类/型号/意图一一对应。

### 3.2 分析与追踪

生产页面已加载：

| 系统 | 标识 | 位置 |
|---|---|---|
| GA4 | `G-TH2K769D0K` | `views/layouts/main.php` |
| GTM | `GTM-PSPFVS47` | 同上 |
| Yandex Metrika | `96097301` | 同上 |
| Microsoft Clarity | `kjywme44gi` | 同上 |

未发现 Cookie 同意/隐私偏好组件；GA4 事件字典（`rfq_click`、`rfq_start`、`rfq_submit_success` 等）未在代码中实现。

---

## 4. 询盘与转化链路

| 检查项 | 结论 |
|---|---|
| PDP 询价表单 | 存在，字段含 Company/Contact/Phone/Email/Country/Quantity/Target Price/Content |
| 提交方式 | 前端 JS 拦截，POST 到 **第三方** `https://wm.zokoko.cn/api/sendEmail` |
| 发件人 | 前端硬编码 `from_address: 106212887@QQ.COM`、`from_name: Morris HK System` |
| 后端保存 | `CartController::actionSend` 存在，但表单默认提交被 JS 拦截；是否落库取决于实际路径 |
| 成功跳转 | `actionSend` 重定向 `/order/success`，但仓库中**没有 OrderController**，该路由在代码层面不可达 |
| CSRF | `CartController`、`SearchController` 设置 `enableCsrfValidation=false` |
| 文件上传 | 询价支持上传文件，保存到 `web/uploads/`，未见类型/大小/病毒扫描策略 |
| 有效询盘口径 | 未实现审核状态、去重标记（`duplicate/bot_suspected/internal_test/spam`）或报表 |

> 这是本轮最高优先级的业务与合规风险：询盘数据经第三方 API 外发，且发件人身份硬编码；需客户确认数据处理与账号归属后才能改。

---

## 5. 后台与内容管理

| 能力 | 现状 |
|---|---|
| 商品管理 | `ProductController`（列表/新增/编辑/热门） |
| 分类 | `CategoryController`（列表/属性） |
| 内容 | `InfoController`、`NewsController`、`HelpController`（增删改、分类） |
| 广告 | `AdController`（列表/新增/编辑/图表） |
| 账号 | `AccountController`（个人资料/改密） |
| 权限 | 菜单级；未见操作级 RBAC、审计日志 |
| 发布门禁 | 未见 `RELEASE_APPROVED` 等状态机 |
| 多语言内容 | 无内容多语版本管理（FR-5-044 为待确认） |

---

## 6. 性能与移动端

| 项 | 结论 |
|---|---|
| 移动端 viewport | 有 |
| 响应式框架 | Bootstrap 4 |
| 首屏体积 | 首页 HTML 约 203 KB；CSS `style.min.css` 330 KB；图片来自 `img2.morrishk.net` |
| Core Web Vitals | **未测量**（无 Lighthouse/真实用户数据） |
| 图片优化 | 未见 `srcset`/WebP/懒加载统一策略 |
| 缓存头 | 未核验（需服务器/响应头检查） |

---

## 7. 主要风险清单

| 编号 | 风险 | 影响 | 级别 | 处理建议 |
|---|---|---|---|---|
| A-01 | 询盘经第三方 `wm.zokoko.cn` 外发，发件人硬编码 | 数据合规、送达率、身份可信 | P0 | 客户确认数据处理与账号归属；改为自有后端/受控 SMTP |
| A-02 | `/order/success` 无控制器 | 询价成功路径 404/异常 | P0 | 修复路由或改为当前页成功提示 |
| A-03 | 搜索/询价页无 noindex | 低质页面被索引 | P1 | 已在本轮分支修复（未部署） |
| A-04 | 无 canonical、无 JSON-LD、无 head hreflang | 重复内容、富结果缺失 | P1 | P1-07 技术 SEO |
| A-05 | 根 sitemap 404 | 收录效率低 | P1 | 生成并发布 sitemap index；robots 加 Sitemap |
| A-06 | robots.txt 格式/分组/重复规则 | 抓取策略不确定 | P2 | 已做格式规范化；分组与策略需客户确认 |
| A-07 | 首页 3 个 H1 | 语义结构混乱 | P2 | 保留一个 H1，其余改 H2 |
| A-08 | 80 域名/语种与“第一阶段仅 en”冲突 | 索引与 hreflang 混乱 | P1 | 第一阶段收敛 en；其余按阶段治理 |
| A-09 | CSRF 关闭 + 文件上传无限制 | 滥用/垃圾询盘/存储风险 | P1 | 开启 CSRF、限制类型大小、加验证码/速率限制 |
| A-10 | 无测试、无 CI、无迁移 | 回归与回滚能力弱 | P0 | P0-04/P0-07 |
| A-11 | PHP 7.4/MySQL 5.6 已 EOL | 安全与兼容风险 | P0 | P0-02/P0-03 评估升级 |
| A-12 | 生产代码版本无法对应 Git | 变更不可追溯 | P0 | P0-06 部署 SHA/发布记录 |

---

## 8. 审计结论

- 站点可访问，核心页面与后台代码齐全，具备在现有 Yii2 代码上渐进改造的条件。
- SEO 技术基础缺口明确：canonical/schema/head hreflang/sitemap 均缺失；搜索与询价页可索引。
- 询盘链路存在第三方外发与成功路由缺失，属于上线前必须解决的风险。
- 本轮只完成了静态审计与一个小范围、可回滚的 SEO 修复；**没有生产变更，也没有功能验收证据**。
