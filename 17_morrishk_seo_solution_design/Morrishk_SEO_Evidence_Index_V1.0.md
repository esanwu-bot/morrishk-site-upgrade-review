# Morrishk SEO Evidence Index V1.0

| 项 | 内容 |
|---|---|
| 文件性质 | 证据索引（只读调研记录） |
| 编制日期 | 2026-11-19 |
| 配套文件 | `Morrishk_SEO_Elements_and_Page_Spec_V1.0.xlsx`、`Morrishk_SEO_Elements_and_Page_Spec_V1.0.md` |
| 证据基线 | 本地代码快照 + 项目文档；未做线上实时写入或生产探针 |

## 0. 证据等级

| 等级 | 含义 |
|---|---|
| `CONFIRMED` | 项目资料/决策已明确规定；不等于已签署、已批准或已实现 |
| `DECIDED_UNSIGNED` | 裁定已登记（DECIDED），但未签署、未独立验收；只能作为当前设计依据，正式生效待签署 |
| `IMPLEMENTED_SNAPSHOT` | 本地代码快照中存在；不等于线上实时可用 |
| `PROPOSED` | Agent 规划建议，未获批准 |
| `PENDING` | 缺少项目决策/资料，不能开发 |
| `N/A` | 该页面类型不需要该元素 |
| `NOT_VERIFIABLE` | 当前环境无法验证（线上、GSC、生产任务） |
| `NOT_FOUND` | 在指定检索范围内不存在 |

路径约定：

- 文档根：`E:\workspace\独立站\morrishk-site-upgrade-review`
- 旧站代码：`E:\workspace\独立站\morrishk-site`
- 新平台：`E:\workspace\独立站\morries\platform`

---

## 1. 项目决策、范围与页面规划

| 编号 | 证据 | 位置 | 支撑判断 | 等级 |
|---|---|---|---|---|
| E-01 | Phase 1 只定义首页、搜索、详情、询盘四页及公共骨架 | `04-web-frontend-plan.md` §1 | 页面范围与迁移状态 | CONFIRMED |
| E-02 | Phase 1 = Next.js 16 新前端 + 现有 Yii2 后端，旧前台并行迁移 | `04-web-frontend-plan.md` §0、§10、§11 | 新旧站归属与渐进迁移 | CONFIRMED |
| E-03 | 六个 locale 写法、`localePrefix: as-needed`、hreflang 由 layout 统一产出 | `04-web-frontend-plan.md` §7 | 多语言架构 | CONFIRMED |
| E-04 | 路由表：`/`、`/search`、`/products/{mpn}`、`/rfq`；默认语言无前缀 | `05-frontend-routing-and-acceptance.md` §1.1、§1.2 | URL/Canonical 规则 | CONFIRMED |
| E-05 | MPN 仅前端 URL 编码，归一化由后端唯一实现 | `05-frontend-routing-and-acceptance.md` §1.3 | 商品 URL/重复控制 | CONFIRMED |
| E-06 | 301 映射由迁移方出 CSV，开发方实现与验证；禁止猜测 | `05-frontend-routing-and-acceptance.md` §1.4；`04` §9 | 旧 URL 301 | CONFIRMED |
| E-07 | 性能门槛：搜索 API P95 ≤500ms、详情/搜索 TTFB ≤800ms、首页接口 ≤300ms | `05-frontend-routing-and-acceptance.md` §2.1 | CWV/TTFB 验收 | CONFIRMED |
| E-08 | 六语种 `en/zh/ja/de/es/id`，无 JS 抓取，canonical/hreflang 规则 | `05-frontend-routing-and-acceptance.md` §2.3 | 多语言验收 | CONFIRMED（但与代码冲突，见 E-28） |
| E-09 | 五态状态机：DEVELOPMENT → BUILD_PASS → STAGING_PASS → CONTENT_APPROVED → RELEASE_APPROVED | `01-engineering-plan.md` §2.1 | 发布门禁与验收口径 | CONFIRMED |
| E-10 | M1-6 详情页 SEO：canonical、hreflang、Product/BreadcrumbList、noindex 规则 | `01-engineering-plan.md` §3 M1 | 详情页 SEO 范围 | CONFIRMED |
| E-11 | M4 SEO：元数据、结构化数据、canonical/hreflang、sitemap、OG/Twitter | `01-engineering-plan.md` §3 M4 | SEO 工作包 | CONFIRMED |
| E-12 | 功能范围：首页、分类、详情、搜索、品牌、询价、内容页、SEO 条目 | `Morrishk_功能范围确认书_V1.0.md` §3.1（FR-1-001…FR-1-060） | 页面类型覆盖 | CONFIRMED |
| E-13 | SEO 现状条目：Title/Description 已有；Canonical/OG/JSON-LD 未具备；hreflang 部分；Sitemap/robots 已具备未确认上线 | `Morrishk_功能范围确认书_V1.0.md` FR-1-044…FR-1-050、FR-3-005/006 | 现状与范围 | CONFIRMED |
| E-14 | 五种语言、语言路由前缀与互指 | `Morrishk_功能范围确认书_V1.0.md` FR-5-039/041 | 多语言范围 | CONFIRMED（清单未列名） |
| E-15 | 商品详情页、搜索、询价为主链路；升级不得破坏既有 URL/内容/询盘 | `Morrishk_功能范围确认书_V1.0.md` §4、§7 | URL 兼容红线 | CONFIRMED |
| E-16 | 产品业务键：MPN + Brand；document_id 不得作为产品身份 | `IQ01_PRODUCT_IDENTITY_ADJUDICATION.md` §9.1–9.2（§9 明示“独立 Reviewer 验收未完成，签署待补”） | PDP 身份/URL/去重 | DECIDED_UNSIGNED：仅设计依据，正式生效待签署 |
| E-17 | 业务导航分类与技术参数分类严格分离；不共享 ID | `IQ02_TAXONOMY_AUTHORITY_ADJUDICATION.md` §10.1（§10 明示“独立 Reviewer 验收未完成，签署待补”） | 分类 URL/SEO 分类 | DECIDED_UNSIGNED：仅设计依据，正式生效待签署 |
| E-18 | 技术分类体系数量、生命周期、category_code 仍开放 | `IQ02_TAXONOMY_AUTHORITY_ADJUDICATION.md` §10.5 | 分类 410/404 待确认 | PENDING |
| E-19 | 契约冻结审查结论 `NOT_READY` | `16_contract_freeze_readiness/FREEZE_READINESS_REVIEW.md` 表头、§2.4 | 不得宣称冻结 | CONFIRMED |
| E-20 | 三层发布门禁仅 HTML 原型演示，正式后端 0 实现 | `09_current_state_inventory/00-existing-system-inventory.md` §5（:174-179）；`04-dsbit-workspace-inventory.md` DSB-23 | PDP 索引门禁 | CONFIRMED |
| E-21 | 旧站 URL 为 `.html`，详情为 8 位 ID + PartUrl | `morrishk_growth_plan_v1.1.md` :151；`09_current_state_inventory/01-frontend-feature-inventory.md` FE-18 | URL 迁移 | CONFIRMED |
| E-22 | 旧站 SEO 诊断：无 sitemap、canonical、hreflang、JSON-LD | `morrishk_growth_plan_v1.1.md` :241-248 | 现状缺口 | CONFIRMED |
| E-23 | 技术 SEO 规则：状态码、索引矩阵、Tier、Sitemap、hreflang | `morrishk_technical_plan_v1.2.md` §8.1–8.8 | 规范主要依据 | CONFIRMED |
| E-24 | JSON-LD 规范：Product/Offer/additionalProperty/可见一致/预生成 | `morrishk_technical_plan_v1.2.md` §7.8（:1620-1646） | Schema 规划 | CONFIRMED |
| E-25 | robots 不得屏蔽需要读取 noindex 的路径 | `morrishk_technical_plan_v1.2.md` §8.4.5（:1890-1908） | Robots 规则 | CONFIRMED |
| E-26 | 10,000 条旧 URL 回归：状态码/Title/H1/canonical | `morrishk_growth_plan_v1.1.md` :875；`01-engineering-plan.md` §13.2 | 验收清单 | CONFIRMED |
| E-27 | Phase 1 前端当前状态：首页/详情/搜索 DEVELOPMENT；SEO/Staging 未开始 | `platform/README.md` §5.1 | Next.js 未实现 SEO | CONFIRMED |
| E-28 | 语言清单冲突：任务书 en/de/ja/es/fr；`locales.ts` en/de/ja/es/id；技术方案 en/de/es/ja/id；04 文档 en/zh/ja/de/es/id | 任务书；`web/src/i18n/locales.ts:18`；`morrishk_technical_plan_v1.2.md` §8.6；`04` §7 | C-01 待确认 | PENDING |
| E-29 | 商品 URL 三种写法冲突：`/products/{mpn}`、`/product/{mpn}`、`/[locale]/product/[mpn]` | `05` §1.2；`web/src/lib/routes.ts:5-7`；`04` §1 | C-02 待确认 | PENDING |
| E-30 | 301 映射 CSV 只有表头/注释，无实际映射（22 行） | `platform/docs/phase1/legacy-url-redirects.csv` | C-04 待确认 | PENDING |

### 1.1 统计口径（与 Excel Sheet 2 一致）

三个维度独立；同一维度内互斥，跨维度不互斥；每行在每个维度各取一个值。

| 维度 | 取值与计数 | 合计 |
|---|---|---|
| 当前状态 | 已有 71；部分已有 93；待开发 106；待确认 11；不适用 27 | 308 |
| 证据等级 | 现状已实现 164；已确认 95；规划建议 11；待确认 11；不适用 27 | 308 |
| 优先级 | P0 106；P1 141；P2 61 | 308 |

共 7 条依赖 IQ-01/IQ-02（PDP 4 + CATEGORY 3），Excel 最后一列标“已登记未签署”；按证据等级拆分：`已确认 95` 中 5 条、`现状已实现 164` 中 2 条，其余 `已确认 90` 条与 `现状已实现 162` 条不依赖 IQ。逐行数据见 `Morrishk_SEO_Sheet2_Row_Stats_V1.0.csv`，程序化自检见 `Morrishk_SEO_SelfCheck_V1.0.md`。

---

## 2. 旧站代码证据（IMPLEMENTED_SNAPSHOT）

| 编号 | 证据 | 文件:行号 | 支撑判断 |
|---|---|---|---|
| C-01 | URL 规则：详情、品牌、分类、列表、博客、catch-all | `config/params.php:96-118` | URL 现状 |
| C-02 | 详情规则 `/products/<8位id>/<PartUrl>` | `config/params.php:97` | 详情 URL 依赖 ID |
| C-03 | 分类规则 `/big-categories/...`、`/sub-categories/...` | `config/params.php:99-100` | 分类 URL 现状 |
| C-04 | 品牌/列表规则 `/manufacturer/{Links}`、`/manufacturers` | `config/params.php:98,103` | 品牌 URL 现状 |
| C-05 | 博客规则 `/blog`、`/blog/tags/...`、`/blog/details/...` | `config/params.php:109-112` | 内容 URL 现状 |
| C-06 | 静态页 catch-all `/{Links}` | `config/params.php:115` | 软 404/冲突风险 |
| C-07 | 页面后缀固定 `.html` | `config/web.php:120-124` | URL 规范化现状 |
| C-08 | 分页参数含 `registerLinkTags=true` | `config/params.php:94` | 分页现状（但自定义 Pager 覆盖，见 C-23） |
| C-09 | `<html lang>`、charset、viewport、`<title>` | `views/layouts/main.php:17,19,30,32` | 已有基础项 |
| C-10 | layout 无 description/canonical/OG/Twitter/JSON-LD | `views/layouts/main.php` 全文；全仓 grep 0 结果 | 缺失项 |
| C-11 | SEO helper 注册 keywords/description/title | `commands/SnSiiController.php:84-99` | Title/Description 已实现 |
| C-12 | 语言由域名解析，默认 en | `commands/SnSiiController.php:62-79` | 旧站多语言机制 |
| C-13 | 首页 Title/Description | `controllers/SiteController.php:121-124` | 首页元数据 |
| C-14 | 商品列表 Title/Description | `controllers/ProController.php:71-75` | 列表元数据 |
| C-15 | 一级分类 Title/Description | `controllers/ProController.php:132-135` | 分类元数据 |
| C-16 | 子分类 Title/Description | `controllers/ProController.php:250-253` | 分类元数据 |
| C-17 | 详情 Title/Description（含 PartNumber/Brand） | `controllers/ProController.php:388-395` | 详情元数据 |
| C-18 | 详情不存在 `die('error')`，返回 200 | `controllers/ProController.php:284-286` | 软 404（T4） |
| C-19 | 搜索仅前缀 LIKE；零结果 302 到 `/cart` | `controllers/SearchController.php:47,60-62` | 搜索现状/索引风险 |
| C-20 | 搜索仅 title，无 desc/H1 | `controllers/SearchController.php:79-81`；`views/search/index.php:27` | 搜索 SEO 缺口 |
| C-21 | 品牌列表/详情仅 title（+keywords） | `controllers/MfrController.php:45-47,78-81` | 品牌元数据缺口 |
| C-22 | 品牌无商品 302 到 `/` | `controllers/MfrController.php:58-60` | 应为 301 的规则 |
| C-23 | `SnSiiLinkPager` 重写 `renderPageButtons`，未调用父类 rel 链接注册 | `snsii/SnSiiLinkPager.php:29-80` | rel next/prev 未输出风险 |
| C-24 | 博客列表/文章仅 title | `controllers/BlogController.php:59-61,125-126` | 内容元数据缺口 |
| C-25 | 静态页仅 title | `controllers/PageController.php:55-56` | 静态页元数据缺口 |
| C-26 | 询价页 title/description；无 noindex | `controllers/CartController.php:90-93` | 功能页索引风险 |
| C-27 | 首页 3 个 H1 | `views/site/index.php:37,49,61` | 多 H1 |
| C-28 | 首页 banner 图无 alt | `views/site/index.php:74,85` | 图片 alt 缺口 |
| C-29 | 商品图片有 alt，部分有 width/height | `views/pro/item.php:72,304,331` | 图片基础 |
| C-30 | 列表/搜索缩略图 alt 存在、height 缺失 | `views/pro/list.php:29`；`views/search/index.php:43` | 图片尺寸不完整 |
| C-31 | 品牌 Logo 无 alt | `views/mfr/item.php:26` | 图片 alt 缺口 |
| C-32 | 分类列表无 H1；子分类仅 H2 | `views/pro/list.php`（无 H1）；`views/pro/sub.php:63` | H1 缺口 |
| C-33 | 详情 H1 仅 PartNumber | `views/pro/item.php:63` | H1 不含品牌 |
| C-34 | 面包屑：分类/详情/博客/静态页存在 | `views/pro/list.php:17-18`；`views/pro/item.php:35-37`；`views/blog/item.php:19`；`views/page/item.php:46` | 可见面包屑现状 |
| C-35 | 品牌页无面包屑 | `views/mfr/item.php` 全文 | 面包屑缺口 |
| C-36 | 仅页脚 `<a hreflang>`，非 `<link rel=alternate>` | `views/layouts/footer.php:123` | hreflang 不符合 |
| C-37 | 分页组件用于分类/搜索/博客 | `views/pro/sub.php:19,89`；`views/search/index.php:17,52`；`views/blog/index.php:42` | 分页现状 |
| C-38 | sitemap 全量生成（10,093,673；`snsii_map`） | `commands/MapController.php:82-141`（:93,:109） | Sitemap 现状 |
| C-39 | robots 生成（含 Sitemap） | `commands/MapController.php:146-168` | Robots 生成逻辑 |
| C-40 | 实际 `web/robots.txt` 无 Sitemap，屏蔽 GPTBot/CCBot | `web/robots.txt:1-35` | Robots 现状/GEO 风险 |
| C-41 | 404 为 Nginx 静态页；无 410 路由 | `404.html` | 错误页现状 |
| C-42 | 分析标签 GA4/GTM/Yandex/Clarity 硬编码 | `views/layouts/main.php:20-27,33-47,51-57,59-65` | 统计现状（不影响 SEO 元数据） |

---

## 3. 新平台代码证据

| 编号 | 证据 | 位置 | 支撑判断 | 等级 |
|---|---|---|---|---|
| N-01 | Next.js 16.4.6 / React 19 / next-intl 4.15.1 | `platform/web/package.json` | 技术栈 | CONFIRMED |
| N-02 | `src/app` 仅有 `globals.css`，无 `page.tsx`/`layout.tsx` | `platform/web/src/app/` | Next.js 页面/SEO 未实现 | IMPLEMENTED_SNAPSHOT |
| N-03 | 语言清单 en/de/ja/es/id；默认 en 无前缀；新增语种三条件 | `platform/web/src/i18n/locales.ts:11-23` | 多语言唯一代码事实源 | IMPLEMENTED_SNAPSHOT |
| N-04 | next-intl `localePrefix: as-needed` | `platform/web/src/i18n/routing.ts:19-23` | URL 前缀规则 | IMPLEMENTED_SNAPSHOT |
| N-05 | 详情路径 helper 为 `/product/{mpn}` | `platform/web/src/lib/routes.ts:5-7` | C-02 冲突 | IMPLEMENTED_SNAPSHOT |
| N-06 | 组件层已有库存/搜索/商品组件，无页面/SEO 组件 | `platform/web/src/components/` | 实现边界 | IMPLEMENTED_SNAPSHOT |
| N-07 | API client 与 OpenAPI 类型存在 | `platform/web/src/lib/api/client.ts`、`schema.d.ts` | 数据层规划 | IMPLEMENTED_SNAPSHOT |
| N-08 | Phase 1 前端状态 DEVELOPMENT；SEO/Staging 未开始 | `platform/README.md` §5.1 | 不得宣称已实现 | CONFIRMED |
| N-09 | 301 CSV 仅表头/注释 | `platform/docs/phase1/legacy-url-redirects.csv` | C-04 | IMPLEMENTED_SNAPSHOT |

---

## 4. 负面证据（检索为 0 / NOT_FOUND）

以下命令均在 `E:\workspace\独立站\morrishk-site` 执行，排除 `vendor/`：

```bash
grep -rn 'rel="canonical"' views/ controllers/ web/          # 0 条
grep -rn 'og:' views/ controllers/                          # 0 条
grep -rn 'twitter:card' views/ controllers/                  # 0 条
grep -rn 'application/ld+json' views/ controllers/          # 0 条
```

结论：旧站未输出 canonical、Open Graph、Twitter Card、JSON-LD；与技术方案 §8.8、范围书 FR-1-047 的缺口描述一致。

其他 NOT_FOUND：

| 项 | 检索范围 | 结论 |
|---|---|---|
| Next.js `page.tsx` / `layout.tsx` | `platform/web/src/app` | 不存在（仅 globals.css） |
| 生成后的 sitemap 文件 | `morrishk-site/web/sitemap` | 快照中不存在；快照外线上状态 NOT_VERIFIABLE |
| 410 处理实现 | `controllers/`、`config/` | 未发现 |
| 真实 301 映射 | `legacy-url-redirects.csv` | 只有表头/注释 |
| 三层发布门禁服务端实现 | 旧站代码、平台代码 | 未发现；仅原型演示 |
| 品牌/供应商业务语义裁定 | IQ-01 证据 | 旧站 `Mid` 是商家/供应商，不是产品厂牌；待确认 |

---

## 5. 不能验证（NOT_VERIFIABLE）与待确认

| 编号 | 项 | 原因 | 对规范的影响 |
|---|---|---|---|
| V-01 | 线上 sitemap 是否定时生成/提交 | 未做生产只读探针 | Sitemap 状态只写“快照存在命令、生成目录未见” |
| V-02 | GSC 覆盖率/索引量 | 无 GSC 授权 | 验收清单只定义方法，不写结论 |
| V-03 | 线上 robots 实际内容 | 本地快照与生成逻辑不一致 | 标记为现状风险，不判断线上 |
| V-04 | 旧站 80 域名/语种实际映射 | 未提供完整清单 | hreflang/301 待确认 |
| V-05 | 最终语言清单 | 任务书/代码/文档冲突 | C-01 待裁决 |
| V-06 | 分类/品牌/内容页 Next.js 路由 | Phase 1 只定义四页 | C-03 待确认 |
| V-07 | 商品发布门禁实际状态 | 服务端未实现 | C-06 待确认 |
| V-08 | MPN 归一化规则与版本 | IQ-01 §9.4 未定 | C-12 待确认 |
| V-09 | Offer 真实价格/库存数据源 | 业务数据未提供 | Sheet 4 标记条件输出 |
| V-10 | Organization logo/sameAs/contactPoint | 素材/账号未确认 | C-15 待确认 |

---

## 6. 复核方式

1. 文档：按上表路径打开对应 `.md`，核对章节/行号。
2. 代码：在旧站仓库执行 `grep`/`nl -ba` 复核；Next.js 在 `platform/web/src/app` 查看目录。
3. 工作簿：打开 `Morrishk_SEO_Elements_and_Page_Spec_V1.0.xlsx`，检查 8 个工作表、308 条明细与 `8-待确认与冲突`；程序化自检结果与逐行统计见 `Morrishk_SEO_SelfCheck_V1.0.md`、`Morrishk_SEO_Sheet2_Row_Stats_V1.0.csv`。
4. 哈希：执行 `sha256sum -c SHA256SUMS.txt`（在交付目录内）。
5. 未验证项不得凭文档推断为“线上已通过”；如需关闭 V-01/V-02/V-03，需另行授权做只读生产核验。

---

## 7. 本轮未做的事

- 未修改任何 Next.js/Yii2/Ds Bit 代码、数据库、URL、生产路由、Nginx/CDN/WAF。
- 未生成/执行 301，未修改 sitemap/robots，未向搜索引擎提交 URL。
- 未做线上实时探针、GSC 查询、日志分析。
- 未对 SEO 效果、排名、流量、询盘作承诺。