# Morrishk 前台技术 SEO 元素及页面规范 V1.0

| 项 | 内容 |
|---|---|
| 文件性质 | 技术 SEO 第一版规划底稿（送审稿） |
| 编制日期 | 2026-11-19 |
| 适用项目 | morrishk.net 升级项目 · 前台技术 SEO |
| 当前状态 | **待 Reviewer 审核**；不是需求冻结、不是开发批准、不是上线授权 |
| 配套文件 | `Morrishk_SEO_Elements_and_Page_Spec_V1.0.xlsx`、`Morrishk_SEO_Evidence_Index_V1.0.md` |
| 参考样本 | `E:\workspace\seocases\lcsc.com\seo元素及其作用一览表.xlsx`（只参考元素组织方式与分析深度，不照搬栏目与业务结构） |

---

## 1. 编制依据

本规范只基于以下已存在资料与只读代码证据编制：

1. `10_scope_confirmation/Morrishk 全项目开发总规划.md`
2. `10_scope_confirmation/Morrishk_功能范围确认书_V1.0.md`
3. `02_technical_design/morrishk_technical_plan_v1.2.md`（尤其 §7.8、§8.1–8.8）
4. `01_business_plan/morrishk_growth_plan_v1.1.md`（现有 SEO 诊断、URL 生命线、Phase 2 规划）
5. `07_prototypes/DESIGN.md`、`07_prototypes/README.md`（四类原型与详情页七段结构）
6. `09_current_state_inventory/01-frontend-feature-inventory.md`、`00-existing-system-inventory.md`
7. `11_seo_google_indexed_urls/README.md`（Google site 可见 URL 样本，不是全量索引）
8. `14_phase0_authority_adjudication/IQ01_PRODUCT_IDENTITY_ADJUDICATION.md`、`IQ02_TAXONOMY_AUTHORITY_ADJUDICATION.md`
9. `16_contract_freeze_readiness/FREEZE_READINESS_REVIEW.md`
10. `12_dsbit_business_api_integration_design/Ds Bit ↔ Morrishk Business API Integration Design v1.md`
11. 现有 Yii2 应用代码快照 `E:\workspace\独立站\morrishk-site`
12. 新平台工程 `E:\workspace\独立站\morries\platform`（Next.js 16 组件层与路由辅助，尚无 `page.tsx` / `layout.tsx`）
13. 用户提供的 LCSC SEO Excel 截图与任务书

资料优先级：已确认项目决策与客户范围 > 已批准页面规划 > 实际代码现状 > 本 Agent 规划建议。LCSC 仅作参考。

---

## 2. 页面范围与当前归属

| 代码 | 页面类型 | 第一阶段归属 | 索引 | SEO 优先级 |
|---|---|---|---|---|
| HOME | 首页 | Next.js Phase 1（规划，未实现） | 是 | P0 |
| PLP | 商品列表页 `/products` | Yii2 保留；Next.js 迁移待确认 | 是 | P1 |
| CATEGORY | 商品分类页（一级/二级） | Yii2 保留；Next.js 迁移待确认 | 是 | P0 |
| PDP | 商品详情页 | Next.js Phase 1（M1 规划，未实现） | 条件（发布门禁 + Tier） | P0 |
| SEARCH | 搜索结果页 | Next.js Phase 1（规划，未实现） | 否（noindex,follow） | P1 |
| BRAND_LIST | 品牌/制造商列表 | Yii2 保留；迁移待确认 | 是 | P1 |
| BRAND_DETAIL | 品牌/制造商详情 | Yii2 保留；迁移待确认 | 是 | P1 |
| INQUIRY | 询价/RFQ 及成功页 | Next.js Phase 1（规划，未实现） | 否（noindex,follow） | P1 |
| BLOG_LIST | 博客/标签列表 | Yii2 保留；迁移待确认 | 是（低价值标签可 noindex） | P2 |
| BLOG_ARTICLE | 文章详情 | Yii2 保留；迁移待确认 | 是 | P2 |
| STATIC_PAGE | 关于/联系/政策等信息页 | Yii2 保留；迁移待确认 | 是（低价值工具页可 noindex） | P2 |

说明：

- `04-web-frontend-plan.md` §1 只定义首页、搜索、详情、询盘四个 Phase 1 页面及公共骨架；PLP、CATEGORY、BRAND、BLOG、STATIC 属于“旧站保留、渐进迁移”，其 Next.js 路由与模板尚未设计。
- 商品列表页（`/products`）与分类页（一级/二级）在旧站是不同模板（`pro/index`、`pro/list`、`pro/sub`），本规范分别建模；大/子分类共用 CATEGORY 规则。
- 搜索结果页与可索引 SEO 落地页严格分开：搜索页固定 `noindex,follow`，不进入 Sitemap，不作为关键词落地页。
- 询价表单、提交成功、购物车相关页面不默认作为索引页；联系信息页（关于/联系）可索引并可使用 ContactPage。

---

## 3. 核心决策摘要

### 3.1 四个概念分开

遵循技术方案 §8.1：

| 概念 | 控制方式 |
|---|---|
| 页面能否访问 | 应用逻辑与业务存在性 |
| 是否允许爬取 | `robots.txt` / `X-Robots-Tag` |
| 是否进入索引 | `meta robots`（noindex） |
| 是否进入 Sitemap | Sitemap 生成规则 |

“可访问 + 不可索引”“可索引 + 不进 Sitemap”均为合法组合，不允许混为一谈。

### 3.2 Canonical 与 noindex

- 所有可索引页：canonical 使用绝对 URL 并自指。
- noindex 页：canonical 必须自指或省略；禁止 canonical 指向其他 URL 后再 noindex，避免信号冲突（技术方案 §8.3.1）。
- 参数页：筛选/排序 `noindex,follow` + 自指 canonical；真正的重复（仅参数顺序、追踪参数）用 301。
- 分页：`page=1` canonical 指向无参数基础页；`page>1` 自指；`page>50` `noindex,follow`。

### 3.3 商品详情与发布门禁

- 商品业务身份为 `(mpn_norm, brand_norm)`，不是 document_id（IQ-01 §9.1）。
- 只有满足 `RELEASE_APPROVED` 的商品可作为正式公开详情页；`PIPELINE_PASS`、`CONTENT_APPROVED` 不得等同发布（总规划 §2；09 库存清单 §5）。
- 当前服务端三层门禁尚无持久化实现，仅有 HTML 原型演示（09 库存清单:174-179）；因此“发布门禁”在本规范中标记为待确认/待开发。
- PDP 索引按 Tier A–E 执行：A/B 进 Sitemap；C 可索引但不进 Sitemap；D `noindex,follow`；E 保留可索引但不进 Sitemap（技术方案 §8.4）。

### 3.4 URL 与历史兼容

- Morrishk 自己控制公开 URL、canonical 与 301。
- `category_id`、`document_id` 不进入公开 URL；业务导航分类与技术参数分类严格分离（IQ-02 §10.1）。
- 分类映射变化不得自动触发 URL 变更或 301；301 只用于人工确认的语义等价迁移。
- 旧站 URL 为 `.html` 形态（如 `/products/{8位ID}/{PartUrl}.html`），新站 URL 形态变化必须依赖独立 `legacy-url-redirects.csv`；当前该文件只有表头/注释，无实际映射，标记为待确认。
- 未知商品/分类必须返回 404/410，不得返回 200 软 404；旧站 `die('error')` 行为必须在迁移中修复。

### 3.5 多语言

- 第一阶段实际启用英文，URL 不加语言前缀；架构保留 `next-intl` 的 `localePrefix: as-needed`。
- 只有对应语言内容真实存在时才输出 hreflang；未发布语言不得输出虚假 hreflang。
- 语言清单存在冲突：任务书为 en/de/ja/es/fr；`locales.ts` 为 en/de/ja/es/id；技术方案 §8.6 为 en/de/es/ja/id；`04` §7 为 en/zh/ja/de/es/id。该项不自行裁决，见 C-01。

### 3.6 结构化数据

- 只使用页面真实可见的数据；没有真实价格/库存/评分/认证，不输出 Offer、库存、评分或认证。
- `inquiry_only` 商品省略 `offers`；停产商品使用 `Discontinued`（仅在真实状态下）。
- Organization、WebSite、BreadcrumbList、CollectionPage、ItemList、Product、Article、AboutPage、ContactPage 按页面类型使用；当前页面范围没有 FAQ/视频详情页，不虚构 FAQPage/VideoObject。
- 所有 JSON-LD 必须经过 Rich Results / Schema Validator 校验，0 错误只是最低要求。

### 3.7 SSR 与性能

- 关键 SEO 元数据、结构化数据、H1、面包屑、参数/列表与内链必须服务端输出，不依赖客户端 JS 执行后才生成。
- Next.js 页面采用 RSC/SSR；旧站 Yii2 已是服务端渲染，但迁移到 Next.js 后需重新验证。
- 性能目标来自 `05-frontend-routing-and-acceptance.md` §2.1：搜索 API P95 ≤500ms、详情/搜索 TTFB ≤800ms、首页接口 P95 ≤300ms；CWV 目标 LCP≤2.5s、INP≤200ms、CLS≤0.1。目标不等于实测通过。

### 3.8 GEO 与技术 SEO 区分

- 技术 SEO：抓取、索引、canonical、结构化数据、状态码、Sitemap、SSR。
- 内容 SEO：标题、描述、关键词主题、内容质量、内链。
- GEO：实体一致性、事实表达、可引用内容结构、AI 搜索可理解性；不是新增某个“AI 专用 meta 标签”。
- 当前旧站 robots.txt 屏蔽 GPTBot/CCBot（`web/robots.txt:19-20,31-32`），与 GEO 目标存在潜在冲突，需业务决策（C-09）。

---

## 4. 工作簿结构

| Sheet | 内容 | 规模 |
|---|---|---|
| 1-项目SEO总览 | 11 类页面：用途、归属、索引、Canonical、Schema、OG、多语言、Sitemap、优先级、规划状态、待确认 | 11 行 |
| 2-页面SEO元素明细 | 11 类页面 × 28 项 = 308 条；每条含标签、示例、作用、必需性、实现位置、数据源、验收方法、当前状态、证据等级、优先级 | 308 行 |
| 3-Title与Description规划 | 每类页面的 Title/Description 模板、示例、变量、长度、重复风险、生成位置、验收 | 11 行 |
| 4-JSON-LD结构化数据规划 | Organization、WebSite、BreadcrumbList、CollectionPage、ItemList、Product、Offer、Article、AboutPage、ContactPage 及不适用项 | 15 行 |
| 5-URL与索引规则 | Home、PLP、Category、PDP、Search、Brand、Inquiry、Blog、Static、分页、筛选、删除、Sitemap、robots、发布门禁、旧 URL 迁移 | 19 行 |
| 6-多语言SEO规划 | 当前英文、未来语言、hreflang、canonical、语言切换、Sitemap、旧域名、翻译边界、冲突 | 16 行 |
| 7-SEO验收清单 | 开发/测试可执行的 37 项检查 | 37 行 |
| 8-待确认与冲突 | 16 项资料冲突/未决事项 | 16 行 |

格式：表头冻结、自动筛选、状态/证据/优先级颜色区分、自动换行与列宽。所有必填字段均为非空；不适用项均写明原因。

---

## 5. 状态与证据口径

### 5.1 内容状态（Sheet 2“当前状态”）

- `已有`：当前代码或运行站已存在。
- `部分已有`：存在但不完整或不符合目标规范。
- `待开发`：规范已定，尚未实现。
- `待确认`：缺少项目决策或资料，不能直接开发。
- `不适用`：该页面类型不需要该元素，已写明原因。

### 5.2 证据等级（Sheet 2“证据等级”）

- `已确认`：项目资料/决策明确规定（如技术方案 §8.3.2、IQ-01）。
- `现状已实现`：有实际代码证据；`Evidence Index` 给出文件与行号。
- `规划建议`：Agent 根据项目需求提出，未获批准。
- `待确认`：缺少项目决策或业务资料。
- `不适用`：该页面类型不需要该元素。

### 5.3 本轮代码证据边界

- 代码证据来自本地快照 `E:\workspace\独立站\morrishk-site` 与 `E:\workspace\独立站\morries\platform`，未做线上实时探针。
- “已有”仅表示代码快照中存在；“线上实时可用”未被验证，不写成本轮结论。
- Next.js 前台 `platform/web/src/app` 当前只有 `globals.css`，没有 `page.tsx`/`layout.tsx`；因此所有 Next.js SEO 输出均为“待开发”。
- 旧站 sitemap/robots 命令存在，但快照中无生成后的 `sitemap/` 目录，线上是否运行未验证（FE-49）。

---

## 6. 关键现状结论（旧站 Yii2）

1. Title 与 Meta Description 已实现：`commands/SnSiiController.php:84-99` 注册 keywords/description；首页、列表、分类、详情、询价等控制器分别拼接标题与描述。
2. 无 canonical、无 Open Graph、无 Twitter Card、无 JSON-LD：全仓检索 `rel="canonical"`、`og:`、`ld+json`、`twitter:card` 均为 0 条。
3. hreflang 仅页脚 `<a hreflang>`，不是 `<link rel="alternate">`（`views/layouts/footer.php:123`；FE-48）。
4. 旧站服务端渲染存在，但首页有 3 个 H1（`views/site/index.php:37,49,61`）；分类/品牌/搜索页缺 H1；商品详情 H1 仅 MPN（`views/pro/item.php:63`）。
5. 详情页不存在时 `die('error')` 返回 200 软 404（`ProController.php:284-286`；基线 T4）；搜索零结果 302 到 `/cart`（`SearchController.php:60-62`）；搜索页当前无 noindex。
6. URL 固定 `.html` 后缀（`config/web.php:120-124`），详情 URL 使用 8 位 ID + PartUrl（`config/params.php:97`），与“MPN + Brand 业务身份/公开 URL 不依赖 ID”的新规范存在迁移差距。
7. sitemap 命令存在（`commands/MapController.php:82-141`），按 10,093,673 商品全量生成，未按 Tier 过滤；快照无生成目录；线上状态未验证。
8. `web/robots.txt` 未声明 Sitemap（第 2 行 `Allow:/` 也缺空格），并屏蔽 GPTBot/CCBot 等 AI 爬虫；与生成的 robots 内容不一致。
9. `platform/web/src/app` 无页面文件；Next.js 的 metadata/schema/sitemap/robots 均未实现（README §5.1：SEO/Staging 验收“未开始”）。

---

## 7. 主要待确认与冲突

完整 16 项见 Sheet 8，前六项：

| 编号 | 事项 | 影响 |
|---|---|---|
| C-01 | 最终语言清单冲突（fr vs id vs zh） | hreflang、sitemap、语言切换 |
| C-02 | 商品详情 URL 三种写法（`/products/{mpn}`、`/product/{mpn}`、`/[locale]/product/[mpn]`） | canonical、301、内链 |
| C-03 | 分类/品牌/内容页是否迁入 Next.js、新路由 | 页面覆盖与 URL |
| C-04 | 旧 URL 301 映射 CSV 为空 | 千万级旧 URL 迁移 |
| C-05 | Tier D / `IsPut=4` 是否进 Sitemap（D-05） | 约 247 万页面索引策略 |
| C-06 | 三层发布门禁服务端未实现 | 商品详情索引资格 |

---

## 8. 交付统计与自检

| 项 | 数值 |
|---|---|
| 页面类型 | **11** |
| 每页元素 | **28** |
| 元素明细总条数 | **308** |
| 现状已实现（含代码证据） | **164** 条（164/308，53.2%） |
| 已确认规则 | **95** 条 |
| 规划建议 | **11** 条 |
| 待确认项（元素级） | **11** 条 |
| 不适用项 | **27** 条 |
| 优先级 | P0 106 / P1 141 / P2 61 |
| 验收检查项 | **37** 项 |
| URL/索引规则 | **19** 条 |
| JSON-LD 规划 | **15** 条 |
| 多语言规划 | **16** 条 |
| 待确认/冲突 | **16** 项 |

自检结果：

1. 11 类页面均有独立 28 项分析，无空白必填字段。
2. Title/Description/Schema/Canonical/Hreflang 无相互矛盾；第一阶段 hreflang 统一标记“不适用（仅 en）”。
3. 商品详情发布门禁已写入 PDP、URL 规则、验收清单与待确认项，未被绕过。
4. 旧 URL 兼容要求已纳入 URL 规则与待确认项；映射清单缺失被明确标注。
5. 所有“现状已实现”均在 Evidence Index 中给出文件/行号或章节。
6. 工作簿可正常打开、筛选、编辑；Markdown 与 Excel 页面范围一致。

---

## 9. 使用说明

1. 先看 `1-项目SEO总览` 确认页面范围与索引策略。
2. 开发按 `2-页面SEO元素明细` 的实现位置与验收方法落地；`3`/`4` 提供文案与 Schema 模板。
3. 开发/测试按 `7-SEO验收清单` 逐项验收；状态默认“待验收”，不得口头通过。
4. 任何涉及 URL、canonical、301、Sitemap、发布门禁、语言清单的改动，先解决 `8-待确认与冲突` 中对应项，再由 Reviewer 审核。
5. `规划建议` 不等于已批准需求；`已确认` 只代表资料有明确规定，不代表已实现或已验收。

---

## 10. 边界与非承诺

- 本轮未修改任何 Next.js/Yii2/Ds Bit 业务代码、数据库、URL、生产路由、Nginx/CDN/WAF。
- 未生成或执行任何 301，未向搜索引擎提交 URL，未修改 sitemap。
- 不承诺搜索排名、收录速度、自然流量或询盘数量。
- 不把“已实现”写成“已验收”；不把 `PASS_MOCK` 写成契约冻结；不把 `PIPELINE_PASS` 写成发布资格。
- 本文件为送审稿；Reviewer 审核通过前，不宣布 SEO 方案冻结或进入开发实施。

---

## 11. 文件清单

1. `Morrishk_SEO_Elements_and_Page_Spec_V1.0.xlsx`
2. `Morrishk_SEO_Elements_and_Page_Spec_V1.0.md`（本文件）
3. `Morrishk_SEO_Evidence_Index_V1.0.md`
4. `SHA256SUMS.txt`（三份交付文件的 SHA-256）

保存目录：`E:\workspace\独立站\morrishk-site-upgrade-review\17_morrishk_seo_solution_design`