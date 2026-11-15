# SEO 页面原型 — 第二轮提交（本轮未提交）

## 状态

**NOT SUBMITTED**。本目录在第二轮评审时提交，本轮（第一轮原型设计评审）不纳入判定范围。

## 为什么本轮不提交

Reviewer 建议先审首页、产品详情页、搜索页、询盘流程四个核心原型，确认设计体系与交互方向后
再扩展。SEO 与后台原型的评审价值依赖于设计体系已定，提前提交会放大返工面。

## 第二轮将提交什么

| 文件（计划） | 内容 | 对应方案 |
|---|---|---|
| `category.html` | 分类页：Tier 分级、canonical、分页 | 技术方案 8.3 / 8.4 |
| `brand.html` | 品牌页：`/manufacturer/{Links}.html` 保留 | 附录 A 路由全表 |
| `sitemap-preview.html` | 分层 sitemap 结构与分片 manifest 预览 | 8.4 |
| `hreflang.html` | 五语种互链与 hreflang 输出 | 8.5 / 8.6 |
| `status-matrix.html` | 状态码矩阵：200 / 404 / 410 / 301 | 8.2 |
| `jsonld.html` | 结构化数据输出与富媒体测试对照 | 12.8 / 13.2 |

## 本轮已覆盖的部分

详情页原型 `product_detail/index.html` 内已包含 **SEO output preview** 区块：
canonical、`Product` 类型 JSON-LD、以及「结构化数据必须与可见内容一致」的约束说明。
可先就这一区块给出意见。

## 需要 Reviewer 明确的判定边界

静态 HTML 只能验证「标签与内容是否齐备、是否自洽」，**无法验证**：

- 实际 HTTP 状态码（需服务端）
- canonical 在分页与筛选参数下的实际输出
- sitemap 生成成功与索引率
- hreflang 的互指完整性（需全站抓取）

以上项在第二轮仍应判 `NOT VERIFIABLE`，除非提供 staging 环境。
