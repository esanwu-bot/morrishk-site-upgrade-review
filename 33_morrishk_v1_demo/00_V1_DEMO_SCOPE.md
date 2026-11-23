# V1 可演示版本范围

| 项目 | 内容 |
|---|---|
| 文档编号 | 33-00 |
| 版本 | V1.0（第一轮） |
| 日期 | 2026-11-23 |
| 状态口径 | DEMO_READY / FUNCTION_ACCEPTED / PRODUCTION_READY / RELEASE_APPROVED 严格区分 |
| 当前判定 | **DEMO_READY：NO**；FUNCTION_ACCEPTED：NO；PRODUCTION_READY：NO；RELEASE_APPROVED：NO |

## 1. 本轮目标

形成可在独立开发/测试环境运行、浏览、演示和复核的 Morrishk 网站 V1；重点是询盘链路、首页、分类/PDP 模板与 SEO 基础设施。

## 2. 包含

| 范围 | 内容 |
|---|---|
| P0 | 询盘成功路由修复、流程审计、CSRF/第三方接口/校验风险记录 |
| P1 | 首页 H1 唯一化、Header/导航/搜索/语言/Footer 审计 |
| P2 | 分类页与 PDP 的 canonical、Open Graph、Product JSON-LD |
| P3 | robots meta、canonical、OG、JSON-LD、robots.txt 格式规范化 |
| P4 | 本地/测试环境准备说明与页面级检查方案（未完成运行） |

## 3. 不包含

- 227 项全功能、104 项待确认 FR、15 项新增交付。
- 生产部署、DNS/CDN/SSL、数据库迁移。
- 真实客户询盘提交、第三方付费接口调用。
- 80 语言 URL 结构迁移、hreflang 全量互指。
- 未冻结的 Session B Business API 接入。
- 虚构产品参数、库存、认证或价格。

## 4. 范围口径

119 项仍为**当前规划建议纳入范围**，不等于已签约；本轮只实现其中的技术切片，不代表功能验收。

## 5. 演示环境要求

需要：PHP 7.4/8.x、Composer 依赖、MySQL 测试库（非生产）、Web 服务器或本地路由脚本。当前本机缺少 `vendor/` 且 MySQL 服务未启动，故未形成可运行演示。
