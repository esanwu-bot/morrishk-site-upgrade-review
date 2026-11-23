# SEO 基础设施实现

| 项目 | 内容 |
|---|---|
| 文档编号 | 33-05 |
| 版本 | V1.0 |
| 提交 | `25afffb`、`d80491b` |
| 状态 | 部分代码完成；Sitemap/运行验证 BLOCKED |

## 1. 已实现

| 能力 | 位置 | 说明 |
|---|---|---|
| robots meta 参数 | `SnSiiController::seo()` | 支持 `robots`，注册 `meta-robots` |
| 搜索页 noindex | `SearchController` | `noindex,follow` |
| 询价/成功页 noindex | `CartController` | `noindex,follow` / `noindex,nofollow` |
| canonical | `seo()` + 首页/产品列表/分类/PDP | 自指绝对 URL，去 query |
| Open Graph | 同上 | `og:type/title/description/url` |
| Product JSON-LD | PDP | 仅真实字段；无价格/库存/评分 |
| robots.txt | `web/robots.txt` | `Allow: /` 格式规范化 |

## 2. 未实现/阻塞

| 项 | 原因 | 状态 |
|---|---|---|
| 根 sitemap 200 | 生产 404；需生成/发布 | BLOCKED |
| sitemap 仅含可索引 URL | 需数据库与发布流程 | BLOCKED |
| robots 加 Sitemap 行 | 依赖 sitemap 可访问 | PENDING |
| hreflang head 输出 | 第一阶段仅 en；80 域名策略未定 | NOT DOING |
| 分类/PDP Title/Desc 模板优化 | 需关键词确认 | PENDING |
| 搜索页不进入 sitemap | 依赖 sitemap 生成器改造 | PENDING |

## 3. 规则遵守

- 不生成 80 种 hreflang。
- 不把 robots.txt 当访问控制。
- 不虚构 canonical 语言版本。
- 未迁移任何 URL。

## 4. 待验证

| 断言 | 方式 | 状态 |
|---|---|---|
| 首页/分类/PDP canonical 输出 | HTML 抓取 | BLOCKED |
| 搜索/询价 noindex | HTML 抓取 | BLOCKED |
| JSON-LD 可解析 | JSON 解析/Rich Results | BLOCKED |
| sitemap 200 且不含 noindex | 抓取 | BLOCKED |
