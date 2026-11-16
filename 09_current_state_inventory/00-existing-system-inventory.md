# 00 · 现有系统现状与证据索引

> 文档版本：inventory-2026-11-16
> 调查性质：**只读盘点**。本轮不修改任何业务代码、数据库、Migration、API 契约或服务器配置，不推送代码，不调用生产写接口，不执行真实社媒/邮件发布。
> 结论性质：本文只回答「现在有什么、在哪里、处于什么状态」，**不构成**产品架构决策、开发排期或生产可用性承诺。

---

## 1. 文档定位

本目录（`09_current_state_inventory/`）为下一阶段产品规划提供**现状事实底稿**。八份文档分工：

| 文件 | 覆盖对象 | 主要回答 |
|---|---|---|
| `00-existing-system-inventory.md` | 全部调查对象 | 证据从哪来、状态怎么判定、系统由哪几块组成 |
| `01-frontend-feature-inventory.md` | 旧 Yii2 用户前台 | 访客能看到/能做什么，哪些是代码存在但未证明可用 |
| `02-commerce-admin-inventory.md` | 旧 Yii2 商城后台（`modules/ejadmin`） | 运营人员实际能操作什么，哪些菜单/动作是空壳 |
| `03-marketing-workspace-inventory.md` | 旧站营销能力 + 原型营销工作台 | SEO/GEO/内容/社媒/邮件/线索/归因的真实起点 |
| `04-dsbit-workspace-inventory.md` | Ds Bit / `icpdf-extractor` | 文档解析与证据链的真实完成度，三层闸门落在哪里 |
| `05-platform-admin-inventory.md` | 新平台工程、Phase 1 契约、后台原型 | 哪些是新工程已写的代码，哪些只是规划/原型 |
| `06-gap-and-duplication-analysis.md` | 跨文档 | 缺口、重复实现、口径冲突、同名不同物 |
| `07-open-questions.md` | 跨文档 | 必须由业务负责人/Reviewer 拍板的问题清单 |

阅读顺序建议：`00 → 01/02 → 03 → 04 → 05 → 06 → 07`。

---

## 2. 调查范围与证据来源

### 2.1 纳入范围

| 编号 | 对象 | 路径 | 性质 |
|---|---|---|---|
| S1 | 旧站 Yii2 代码快照 | `E:\workspace\独立站\morries\newPlan\morrishk.net` | 生产站代码快照（只读） |
| S2 | 旧站数据库结构审计 | `E:\workspace\独立站\morries\mysql_schema_audit` | 生产库结构导出（2024-11-30 静态终态） |
| S3 | 老站升级权威规划 | `E:\workspace\独立站\morries\newPlan\老站架构升级与重构规划书.md`（v2.0） | 规划文档 |
| S4 | 项目级约束 | `E:\workspace\独立站\morries\agent.md` | 约束文档 |
| S5 | 新平台工程 | `E:\workspace\独立站\morries\platform` | 在建工程 + 归档原型 |
| S6 | Ds Bit 解析引擎 | `E:\workspace\icpdf-extractor` | 独立引擎工程 |
| S7 | Ds Bit UI 原型 | `E:\workspace\DsBit\prototype.html` | 原型 |
| S8 | 管理后台原型 | `E:\workspace\独立站\morrishk-site-upgrade-review\07_prototypes\admin` | 静态 HTML/JS 原型（Demo 数据） |
| S9 | 客户版方案 | `E:\workspace\phpworkspace\tqx_2026\test\morrishk.net_老站升级与增长方案_客户版.md` | 对客方案（含规划能力，非实现） |
| S10 | 送审仓库既有材料 | `00_project_baseline` ～ `08_php84_compatibility` | 已冻结的基线/方案/证据 |

### 2.2 明确不在范围

- 未连接生产服务器、未执行线上 URL 探针、未读取线上实时数据库。
- 未调用任何生产 API、未提交任何表单、未触发任何社媒/邮件发送。
- 未打开旧站后台进行写操作；后台功能判断基于代码与库结构。
- `08_php84_compatibility` 只作为背景，不在本次功能盘点内展开。

### 2.3 证据分级

为避免把「印象」写成「缺陷」，本文所有判断按以下级别标注：

| 级别 | 含义 | 示例 |
|---|---|---|
| E1 | **生产数据 + 生产代码**双重证据 | `snsii_product` 约 1,009 万 AUTO_INCREMENT + 详情路由代码 |
| E2 | 仅代码/结构存在，未证明生产使用 | 某 console command 存在但无定时任务证据 |
| E3 | 规划/契约/设计文档 | Phase 1 API 契约、三层闸门定义 |
| E4 | 原型/Demo | `07_prototypes/admin`、`DsBit/prototype.html` |
| E5 | 推断 | 由命名/注释推断，需后续核实 |

文档中的「状态」列与「证据级别」列配合阅读：**E2 + EXISTS_PRODUCTION 的组合不会出现**；只有 E1 才允许判定生产使用。

---

## 3. 状态口径

严格采用任务书定义，不合并、不替换：

| 状态 | 判定规则 | 本目录中的典型对象 |
|---|---|---|
| `EXISTS_PRODUCTION` | 有生产数据/生产配置证据，且代码路径可对应 | 旧站商品详情、分类、搜索、询盘邮件、GA4 标签 |
| `EXISTS_CODE` | 代码存在，但本轮无生产使用证据 | 旧站 Google Indexing 命令、Ads 后台、platform 组件 |
| `EXISTS_PROTOTYPE` | 仅存在于 HTML/静态原型，无后端实现 | 后台 34 路由中的营销/审核/权限页面 |
| `PARTIAL` | 主链路存在但关键环节缺失/不可用/仅部分数据 | Datasheet 展示、库存、订单跟踪、广告位 |
| `NOT_FOUND` | **在本次调查范围内**未发现，不表示绝对不存在 | 替代料、客户账户、社媒发布、审计日志 |
| `UNKNOWN` | 资料不足，无法判断 | 生产定时任务是否仍在运行、第三方服务当前可用性 |

> `NOT_FOUND` 的使用约定：一律写「调查范围内未发现」，并在「待确认」列说明还需查什么。

---

## 4. 系统组成（现状）

```text
                         ┌──────────────────────────────────────────┐
                         │  旧站 Yii2（生产，URL 冻结）               │
                         │  www.morrishk.net + 79 个语种域名          │
                         │  snsii_* 表 31 张 / 商品约 1,009 万        │
                         └───────────────┬──────────────────────────┘
                                         │ 第三方邮件接口（wm.zokoko.cn）
                                         │ GA4 / GTM / Yandex / Clarity
                                         ▼
┌──────────────────┐   只读参考   ┌──────────────────────────────────┐
│ Ds Bit 解析引擎   │◀───────────│  新平台工程 platform/             │
│ icpdf-extractor  │            │  Next.js 组件（无页面）           │
│ 无数据库/无 LLM   │            │  Phase 1 契约 9 端点              │
└────────┬─────────┘            │  12 张 morris_v2 迁移表           │
         │ 原型概念               │  归档 ThinkPHP 8 端点             │
         ▼                       └───────────────┬──────────────────┘
┌──────────────────────────────────────────────┐│
│ 管理后台原型 07_prototypes/admin（34 路由）   ││ 未来后台（未开工）
│ 全部 Demo 数据，不写库、不连外部系统          ││
└──────────────────────────────────────────────┘▼
```

### 4.1 三套「商品/参数」数据源并存

| 数据源 | 载体 | 现状 | 证据 |
|---|---|---|---|
| 旧站商品参数 | `snsii_product.DataAttr`（JSON 文本） | 生产使用；后台手工编辑 | `models/SnSiiProduct.php`、`modules/ejadmin/views/product/form.php:112` |
| 新平台参数模型 | `pd_param_def` / `pd_model` 等 12 表 | Migration 已写，未接生产数据 | `platform/db/migrations/*.up.sql` |
| Ds Bit 参数候选 | `src/icpdf/domain/parameter.py` + `runs/<run_id>` | 代码可运行，未入生产库 | `icpdf-extractor/src/icpdf/domain/`、`workbench/serve_parser.py` |

三者字段、状态语义、证据模型均不同，详见 `06-gap-and-duplication-analysis.md`。

### 4.2 四套「内容」载体并存

| 载体 | 现状 | 证据 |
|---|---|---|
| 旧站 News/Info/Help | 生产使用（后台 CRUD） | `modules/ejadmin/controllers/NewsController.php` 等 |
| 旧站 Blog（前台读取 News） | 生产使用 | `controllers/BlogController.php` |
| 后台原型「内容资产库」 | 仅 Demo | `07_prototypes/admin/assets/data.js` |
| Ds Bit「技术内容生成」 | 仅原型/设计 | `07_prototypes/admin/assets/views-knowledge.js` |

---

## 5. 关键事实基线

| 事实 | 数值/结论 | 证据 |
|---|---|---|
| 旧站框架 | Yii2 Basic（`yii\web\Application`） | `web/index.php`、`config/web.php` |
| URL 规则 | `enablePrettyUrl=true`，`suffix='.html'` | `config/web.php:120-124` |
| 商品规模 | `snsii_product` AUTO_INCREMENT = `10093686`（约 1,009 万） | `mysql_schema_audit/02_table_inventory.csv:20` |
| 表数量 | 31 张（30 MyISAM + 1 InnoDB），无外键 | `mysql_schema_audit/01_schema.sql`、`06_compatibility_scan.txt` |
| 语种/域名 | `DuoLang` 80 条；`domain.txt` 80 行；`messages/` 80 个目录 | `config/params.php:12`、`domain.txt`、`messages/` |
| 商品详情缓存 | `snsii_product_cache`（按 ProId 存整页 JSON），另有 `_copy1` | `controllers/ProController.php:269`、表清单 |
| 询盘主路径 | 商品页 AJAX 直发 `https://wm.zokoko.cn/api/sendEmail`，**不落本站库** | `views/pro/item.php:195-238`、`views/cart/index.php:238` |
| 联系表单路径 | `contact-us` 表单写入 `snsii_contact` | `controllers/PageController.php:30-40` |
| 管理后台 | `modules/ejadmin`，43 个 action | `modules/ejadmin/controllers/*.php` |
| 后台账号 | `snsii_manage`（195 AUTO_INCREMENT，含 `Role`/`NavList`） | `03_column_inventory.csv:88-96` |
| 后台登录 | 与前台共用 `SiteController::actionLogin`，成功后跳 `/ejadmin-index` | `controllers/SiteController.php:175-200` |
| 新平台前台 | Next.js 16 + React 19，仅有组件与 mock，**无 `page.tsx`/`layout.tsx`** | `platform/web/src/app/`（仅 `globals.css`） |
| 新平台 API 契约 | 9 个端点 | `platform/docs/phase1/03-api-contract.yaml` |
| 归档 API 实现 | ThinkPHP 6.1，8 个端点（无 `/home`） | `platform/_archive/platform_server/route/app.php` |
| 新平台迁移 | 4 组 up/down，12 张表，**0 条 ALTER** | `platform/db/migrations/` |
| 新前台语言 | 代码 5 种：`en,de,ja,es,id` | `platform/web/src/i18n/locales.ts:18` |
| 文档中的语言 | 文档写 6 种：`en,zh,ja,de,es,id` | `04-web-frontend-plan.md:125`、`05-frontend-routing-and-acceptance.md:82` |
| 客户最终语种（记忆/客户确认） | 5 种 `en,de,ja,es,fr`（待本轮以文件核实） | 见 `07-open-questions.md` Q1 |
| Ds Bit 解析器 | Phase 1 完成；确定性解析 + 候选；**无 LLM、无数据库** | `icpdf-extractor/README.md:3-6`、`workbench/serve_parser.py:18` |
| Ds Bit 运行产物 | `runs/` 下 51 个目录 | `icpdf-extractor/runs/` |
| 三层闸门 | 仅存在于原型与设计文档，代码中 0 命中 | `07_prototypes/admin/assets/views-knowledge.js:52-54`；`grep` 结果为空 |
| 后台原型 | 单页 Hash 路由，34 个页面，全部 Demo | `07_prototypes/admin/assets/admin.js:22-57` |

---

## 6. 术语与关键概念

| 术语 | 本目录中的含义 |
|---|---|
| 老站 / 旧站 | `www.morrishk.net` 及 79 个语种域名上的 Yii2 站点 |
| 语种域名 | `domain.txt`/`DuoLang` 中「一个域名对应一种语言」的机制，不是 URL 前缀 |
| 商城运营后台 | 旧站 `modules/ejadmin` |
| 管理后台原型 | `07_prototypes/admin` 的静态 SPA，仅用于评审，不是生产后台 |
| 营销工作台 | 任务书中定义的「计划/内容/渠道/排期/线索/分析」集合；现状仅有原型 |
| Ds Bit | 文档解析与参数证据引擎（`icpdf-extractor`），独立系统 |
| `PIPELINE_PASS` | 文档可解析、证据字段完整；**不等于**参数正确 |
| `CONTENT_APPROVED` | 引用该参数的内容版本通过内容审核；**不等于**可发布 |
| `RELEASE_APPROVED` | 指定发布批次获批；**不等于**历史内容自动获批 |
| 参数级 `ReviewStatus` | 单个参数的审核状态（`Verified` / `Needs Review` / `Rejected`），**不等于**三层闸门 |

> 三层闸门依赖顺序固定为 `PIPELINE_PASS → CONTENT_APPROVED → RELEASE_APPROVED`，上游未通过时下游不得标记为已批准。该语义在原型中已固化，但**代码中尚不存在**。

---

## 7. 本轮限制与未做的事

- 不修改 Yii2、数据库、Migration、API 契约。
- 不创建新的前端/后台工程。
- 不修改生产环境、Nginx、PHP、MySQL 或服务器配置。
- 不调用生产写接口、不创建生产测试数据。
- 不执行社交媒体、邮件等真实发布或发送。
- 不推送代码。
- 不把原型菜单当成真实业务实现；不把代码存在当成生产可用。
- 不进入产品设计、开发或实施阶段。

---

## 8. 证据索引（关键文件）

### 8.1 旧站前台

| 主题 | 文件 | 关键行 |
|---|---|---|
| 路由与后缀 | `config/web.php` | 120-124 |
| 语言判定 | `commands/SnSiiController.php` | 70-79 |
| 首页数据 | `controllers/SiteController.php` | 27-129 |
| 搜索 | `controllers/SearchController.php` | 32-73（LIKE 在 47） |
| 商品详情 | `controllers/ProController.php` | 262-330（缓存 269，参数 288-295，SEO 390-392） |
| 商品详情模板 | `views/pro/item.php` | 24-39、104-117、195-238 |
| 桌面搜索框 | `views/layouts/header.php` | 51-58 |
| 移动端搜索框 | `views/layouts/header.php` | 74-77 |
| 购物车会话 | `controllers/CartController.php` | 21-60 |
| 联系表单入库 | `controllers/PageController.php` | 30-40 |
| PDF URL 生成 | `models/SnSiiProduct.php` | 99-102 |
| 分析标签 | `views/layouts/main.php` | 20-27、39-47、54-56、61-63、111 |
| sitemap / ping | `commands/MapController.php` | 172-210 |
| Google Indexing | `commands/CController.php` | 115-147 |
| 语言清单 | `config/params.php` | 12 起 |
| 语种目录 | `messages/` | 80 个 |
| 域名清单 | `domain.txt` | 80 行 |

### 8.2 旧站后台

| 主题 | 文件 | 关键行 |
|---|---|---|
| 模块 | `modules/ejadmin/module.php` | 全文 |
| 菜单/权限渲染 | `modules/ejadmin/views/layouts/header.php` | 16-43 |
| 商品新增 | `modules/ejadmin/controllers/ProductController.php` | 90-120 |
| 热销/库存价格 | `modules/ejadmin/controllers/ProductController.php` | 125-172 |
| 参数编辑 | `modules/ejadmin/views/product/form.php` | 51-57、112 |
| 生命周期/RoHS | `modules/ejadmin/views/product/form.php` | 97-98 |
| 广告 | `modules/ejadmin/controllers/AdController.php` | 19-67 |
| 管理员 | `modules/ejadmin/controllers/ManageController.php` | 27-87 |
| 登录 | `controllers/SiteController.php` | 175-200 |
| 表结构 | `mysql_schema_audit/02_table_inventory.csv` | 全文 |

### 8.3 新平台

| 主题 | 文件 | 关键行 |
|---|---|---|
| 工程边界 | `platform/README.md` | 1-40 |
| 工程计划 | `docs/phase1/01-engineering-plan.md` | 全文章节 |
| DB 变更协议 | `docs/phase1/02-db-change-protocol.md` | 全文 |
| API 契约 | `docs/phase1/03-api-contract.yaml` | 9 个 path |
| 前端计划 | `docs/phase1/04-web-frontend-plan.md` | 125（六语种） |
| 路由验收 | `docs/phase1/05-frontend-routing-and-acceptance.md` | 15、82 |
| 后台技术决策 | `docs/phase1/06-admin-frontend-technology-decision.md` | §3、§9.1 |
| 后台阶段 0 | `docs/phase1/admin/00-project-scope.md` | §3-§6 |
| 迁移 | `db/migrations/*.up.sql` | 12 张表、0 ALTER |
| 归档路由 | `_archive/platform_server/route/app.php` | 8 端点 |
| 语言代码 | `web/src/i18n/locales.ts` | 18 |
| 语言文档冲突 | `04-web-frontend-plan.md` / `05-...md` | 125 / 82 |

### 8.4 Ds Bit

| 主题 | 文件 | 关键行 |
|---|---|---|
| 项目状态 | `icpdf-extractor/README.md` | 3-6 |
| 数据契约 | `docs/DATA_CONTRACT.md` | 不变量 I1/I14、证据校验 |
| 架构 | `docs/ARCHITECTURE.md` | §1-§5 |
| Parser Lab API | `workbench/serve_parser.py` | 1139、1180、1238、1289、1441 |
| 无数据库声明 | `workbench/serve_parser.py` | 18 |
| 运行产物 | `runs/<run_id>/` | 51 个目录 |
| 生产集成计划 | `docs/SLICE6_INTEGRATION_PLAN.md` | 状态 DRAFT、item 98 pending |
| 审计占位 | `src/icpdf/audit/__init__.py` | 6 行 |
| 三层闸门（原型） | `07_prototypes/admin/assets/views-knowledge.js` | 52-54、94-97 |

### 8.5 原型

| 主题 | 文件 | 关键行 |
|---|---|---|
| 34 个页面定义 | `07_prototypes/admin/assets/admin.js` | 22-57 |
| 内容发布授权 | `07_prototypes/admin/assets/admin.js` | `contentRelease` 313-355 |
| 内容数据 | `07_prototypes/admin/assets/data.js` | contents 段 |
| Ds Bit 视图 | `07_prototypes/admin/assets/views-knowledge.js` | 全文 |
| 设计说明 | `07_prototypes/admin/prototype-readme.md` | §六、§七 |
| 复核记录 | `07_prototypes/admin/REVIEW-RESPONSE-v2.md` | 第 2.4/2.5 节 |

---

## 9. 与既有送审材料的关系

- 本目录**不替换** `00_project_baseline` 的基线结论，只补充「功能级」现状。
- 本目录**不改变** `07_prototypes` 的冻结状态；原型仍为 Demo，不等于实现。
- 本目录**不进入** `08_php84_compatibility` 的兼容性结论。
- 任何与既有文档冲突之处，在 `06-gap-and-duplication-analysis.md` 单列，并在 `07-open-questions.md` 提出待裁决项。