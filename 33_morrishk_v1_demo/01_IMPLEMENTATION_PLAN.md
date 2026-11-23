# V1 实施计划

| 项目 | 内容 |
|---|---|
| 文档编号 | 33-01 |
| 版本 | V1.0 |
| 代码分支 | `feat/morrishk-website-implementation` |
| 基线 | `cdb9c04` |
| 本轮站点提交 | `25afffb`、`0891ce6`、`d80491b` |

## 1. 任务与状态

| 优先级 | 任务 | 依赖 | 状态 | 证据 |
|---|---|---|---|---|
| P0 | 询盘成功路由修复 | 无 | DONE（代码） | `0891ce6`；`CartController::actionSend` → `/cart/success` |
| P0 | 询盘流程/CSRF/第三方接口审计 | 客户决策 | PARTIAL/BLOCKED | 33-02；第三方 `wm.zokoko.cn` 未授权 |
| P0 | 服务端校验评估 | 运行环境 | PARTIAL | 现有 `SnSiiCart::rules()` 有必填/长度/邮箱类型未显式 |
| P0 | Mock Adapter | 架构/客户确认 | NOT STARTED | 设计见 33-02 §5 |
| P1 | 首页 H1 唯一化 | 无 | DONE（代码） | `0891ce6`；2 个 H1→H2 |
| P1 | Header/导航/搜索/语言/Footer 审计 | 运行环境 | PARTIAL | 33-03 |
| P2 | 分类页 canonical/OG | 无 | DONE（代码） | `d80491b` |
| P2 | PDP canonical/OG/JSON-LD | 无 | DONE（代码） | `d80491b` |
| P3 | robots meta 页面策略 | 无 | DONE（代码） | `25afffb` |
| P3 | robots.txt 格式规范化 | 无 | DONE（代码） | `25afffb` |
| P3 | Sitemap XML 生成/发布 | 数据库/部署 | BLOCKED | 现有 `MapController`，生产 404 |
| P4 | 本地/测试环境 | MySQL/vendor | BLOCKED | 本机无 MySQL 服务、无 vendor |
| P4 | 页面级 HTTP/自动化检查 | 环境 | BLOCKED | 无法启动应用 |

## 2. 文件所有权

| 文件 | 本轮修改 |
|---|---|
| `commands/SnSiiController.php` | `seo()` 增 robots/canonical/OG/jsonLd |
| `controllers/SearchController.php` | 搜索页 noindex |
| `controllers/CartController.php` | 询价/成功页 noindex；成功路由 |
| `controllers/SiteController.php` | 首页 canonical/OG |
| `controllers/ProController.php` | 产品列表/分类/PDP canonical/OG/PDP JSON-LD |
| `views/site/index.php` | H1 唯一化 |
| `views/layouts/main.php` | JSON-LD 输出 |
| `web/robots.txt` | 格式规范化 |

未改动路由配置、数据库、依赖、部署文件。

## 3. 顺序与并行

1. P0 路由（完成）。
2. P1 H1（完成）。
3. P2/P3 canonical/OG/schema（完成）。
4. P4 环境搭建（阻塞）。
5. 询盘第三方/Mock（等待客户决策）。

## 4. 里程碑

| 里程碑 | 条件 | 当前 |
|---|---|---|
| M1 代码切片 | 代码提交 + 静态检查 | 达成 |
| M2 可运行演示 | 测试环境 + 页面可访问 | 未达成 |
| M3 功能验收 | 测试证据 + Reviewer 复核 | 未达成 |
| M4 生产就绪 | 部署/回滚/安全/客户授权 | 未达成 |
