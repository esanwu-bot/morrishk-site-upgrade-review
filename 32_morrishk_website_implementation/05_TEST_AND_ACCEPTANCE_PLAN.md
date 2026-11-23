# 测试与验收计划

| 项目 | 内容 |
|---|---|
| 文档编号 | 32-05 |
| 版本 | V1.0 |
| 范围 | P0 基础、P1 核心页面/SEO/询盘、P2 迁移/性能、P3 运营 |
| 当前环境 | 无已验证的开发/测试/预发布环境 |
| 当前测试 | 仅 `php -l` 三个修改文件通过（见 32-07） |

---

## 1. 测试分层

| 层级 | 目标 | 方式 | 现状 |
|---|---|---|---|
| L0 静态检查 | 语法、编码、敏感信息 | `php -l`、`git diff --check`、密钥扫描 | 部分已执行 |
| L1 单元 | 纯逻辑（URL/SEO/字段） | PHPUnit/Codeception（需新增 tests/） | 未建立 |
| L2 集成 | 控制器/模型/DB | 测试库 + Codeception | 不可用（无环境/无 vendor） |
| L3 端到端 | 首页→分类→PDP→询盘 | Playwright/Cypress（需新增） | 未建立 |
| L4 SEO | 抓取/索引/结构化数据 | 爬虫 + GSC/Rich Results | 未执行 |
| L5 性能 | CWV/响应时间 | Lighthouse/WebPageTest | 未执行 |
| L6 迁移 | 旧 URL 301/404/410 | 回归脚本 + 抽样 | 未执行 |
| L7 UAT | 客户验收 | 客户验收人按清单签字 | 未开始 |

---

## 2. 本轮代码变更的测试用例（P1-02/P1-07 部分）

| 用例 | 步骤 | 预期 | 状态 |
|---|---|---|---|
| T-01 语法 | `php -l commands/SnSiiController.php` | 无语法错误 | PASS |
| T-02 语法 | `php -l controllers/SearchController.php` | 无语法错误 | PASS |
| T-03 语法 | `php -l controllers/CartController.php` | 无语法错误 | PASS |
| T-04 robots 参数 | 单元级调用 `seo(['title'=>'x','robots'=>'noindex,follow'])` | 注册 `meta-robots` | 未执行（无运行时） |
| T-05 搜索页 | 请求 `/search/index.html?keyword=STM32` | HTML head 含 `noindex,follow` | 未执行（未部署） |
| T-06 询价页 | 请求 `/shopping-cart.html` | HTML head 含 `noindex,follow` | 未执行 |
| T-07 成功页 | 请求成功页 | `noindex,nofollow`，HTTP 200 | 未执行；当前路由可能 404 |
| T-08 robots.txt | 抓取 `/robots.txt` | `Allow: /` 语法合法 | 未部署 |
| T-09 回归 | 首页/分类/PDP 仍可访问且无 robots 误加 | 200，正常索引 | 未执行 |

> T-04…T-09 需要可运行环境或部署后才能执行；本轮不得写成通过。

---

## 3. P0 验收（G0）

| 验收项 | 证据 | 状态 |
|---|---|---|
| 应用仓库、分支、HEAD | 32-00 | DONE |
| 生产代码目录与版本对应 | 部署 SHA/发布记录 | BLOCKED |
| 备份与恢复演练 | 备份日志、恢复记录 | BLOCKED |
| 权限与凭据 | 账号清单、轮换记录 | BLOCKED |
| 回滚预案 | 文档 + 演练 | PARTIAL |
| 测试环境 | 地址、部署记录 | BLOCKED |

**G0 结论：未通过**（仅基线仓库与分支部分完成）。

---

## 4. P1 验收

| 验收对象 | 标准 | 证据 | 状态 |
|---|---|---|---|
| 首页/导航 | 1 个 H1、导航无回归、移动端可用 | 截图/测试用例 | 未开始 |
| 分类/列表 | title/desc/canonical/H1 正确 | 抓取报告 | 未开始 |
| PDP | 可索引门禁、Product/Breadcrumb JSON-LD | Rich Results/抓取 | 未开始 |
| 搜索页 | `noindex,follow`、不进 sitemap | HTML 断言 | 代码完成未部署 |
| 询价页 | `noindex`、表单成功入库/通知 | E2E + 数据库核对 | 未通过（第三方 API/路由） |
| sitemap | 根 sitemap 200、只含可索引 URL | 抓取 | 未通过（当前 404） |
| robots | 语法合法、策略确认 | 文件与抓取 | 代码完成未部署 |
| 多语言 | 第一阶段 en 无 head hreflang | HTML 断言 | 未开始 |
| 后台 | 核心 CRUD 回归 | 测试用例 | 未开始 |
| 事件追踪 | `rfq_*` 事件抽样 | GA4 DebugView/日志 | 未开始 |

---

## 5. SEO 验收清单

- Title/Description：每类页面唯一、含意图，不堆砌。
- H1：每页 1 个；与 Title 语义一致。
- Canonical：自指绝对 URL；分页/筛选规则明确；不与 noindex 冲突。
- Robots：搜索/询价/成功页 noindex；CSS/JS 不被误屏蔽。
- Sitemap：仅可索引规范 URL；分类型；根 sitemap 200。
- Schema：Organization/WebSite、CollectionPage/ItemList、Product/Breadcrumb；Offer 仅真实价格。
- Hreflang：第一阶段 en 不输出；后续真实翻译后双向互指。
- 301/404/410：人工映射、无链式、未知 slug 404、永久删除 410。
- 结构化数据错误进入整改单。

---

## 6. 性能与兼容性

| 项 | 工具 | 门槛（建议，待确认） |
|---|---|---|
| LCP | Lighthouse/真实用户 | ≤ 2.5 s |
| CLS | 同上 | ≤ 0.1 |
| INP | 同上 | ≤ 200 ms |
| 首页 HTML | 传输大小 | 目标下降（当前约 203 KB） |
| 浏览器 | Chrome/Safari/Edge/Firefox 最新两个版本 | 无阻断 |
| 移动端 | 375/390/414 宽 | 无横向滚动/遮挡 |

门槛为建议值，需客户确认后写入验收。

---

## 7. 迁移验收

| 项 | 标准 |
|---|---|
| 全量盘点 | 旧 URL 100% 入台账 |
| 关键 URL | 100% 核验（首页/分类/品牌/重点产品/高流量/外链） |
| 其余抽样 | 按 URL 总量分层（见 03 §6.2） |
| 301 | 目标最终 200，无链式/循环 |
| 404/410 | 未知 404，永久删除 410，软 404 = 0 |
| 回滚 | 上线前演练，保留回切能力 |

---

## 8. 验收证据与流程

1. 开发提交交付物与证据清单（提交 SHA、测试日志、抓取报告、截图）。
2. 客户验收人按清单复核（建议 5 个工作日，待合同确认）。
3. 结论：通过 / 有条件通过 / 不通过；有条件通过须列整改项与期限。
4. 双方签署验收记录；未签署不视为通过。
5. 上线需单独书面授权，不以测试通过替代。

---

## 9. 当前测试结论

| 项 | 结论 |
|---|---|
| PHP 语法（3 文件） | PASS |
| 运行时代码路径 | NOT RUN |
| 功能/回归 | NOT RUN |
| SEO 抓取/索引 | NOT RUN（生产审计除外） |
| 性能/CWV | NOT RUN |
| 迁移 | NOT RUN |
| 生产验收 | 未申请、未授权 |

> 本轮只能证明“修改文件无 PHP 语法错误”，不能证明功能、SEO 或生产可用。
