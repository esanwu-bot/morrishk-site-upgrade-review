# 06 · 缺口、重复实现与口径冲突分析

> 输入：`00`–`05` 五份盘点文档（证据均指向原始代码/结构/原型）。
> 本文只做两件事：**把缺口列清、把重复和同名不同物列清**。
> 不给出目标架构、不排期、不判断优先级「应该」怎么做；处置建议统一收敛到 `07` 由业务负责人确认。
>
> 判定沿用 `00` 的状态口径。特别提醒：`NOT_FOUND` 仅表示「本次调查范围内未发现」，不是「绝对不存在」。
> 证据边界：本轮未做线上探针；文中 `EXISTS_PRODUCTION` 均等价于 `EXISTS_PRODUCTION_SNAPSHOT`（2024-11-30 快照 + 代码），不表示当前线上实时可用。

---

## 1. 缺口总览

| 调查域 | 任务书要求 | 生产快照可用 | 部分/仅代码 | 未发现 | 结论一句话 |
|---|---|---|---|---|---|
| A 用户前台 | 11 类能力 | 首页/分类/搜索/详情/参数/询盘/多语言 | Datasheet、库存、价格、移动端、广告 | 替代料、客户账户、订阅/社媒 | 展示链路完整，**交易与账户链路缺失** |
| B 商城后台 | 10 类能力 | 商品、分类、内容（新闻/信息） | 库存价、广告、账号、语言 | 品牌/供应商、询盘/客户/订单、审核、报表、审计 | 是「商品维护工具」，不是运营中台 |
| C 营销工作台 | 14 类能力 + 5 渠道 | SEO 元信息（代码拼接） | Sitemap/Indexing、GA4 采集、线索数据 | 计划、活动、关键词、GEO、AI 内容、审核、社媒、邮件、自动化、归因、协作、外链 | **几乎从零开始** |
| D Ds Bit | 10 类能力 | — | 本地确定性解析、证据模型、运行产物（本地运行证据，非生产运行证据）；参数候选、部署冻结 | 生产解析执行、持久化、审核流、知识版本、发布授权/记录、队列、审计 | 本地解析链路有运行证据；**生产解析尚未执行**；正式知识工作台尚不存在 |
| E 平台管理 | 9 类能力 | 旧后台登录、菜单、账号 | 语言配置、迁移、契约 | RBAC、审计、任务监控、系统配置、API 实现、后台应用 | 只有「旧后台」，**新管理中心未建** |

> 统计口径：`生产快照可用` 只计 E1（2024-11-30 快照 + 代码，未实时验证）；`部分/仅代码` 含 `PARTIAL`、`EXISTS_CODE`、`EXISTS_PROTOTYPE` 中的可执行部分；`未发现` 为 `NOT_FOUND`。

---

## 2. 重复实现：同一业务对象存在多套载体

### 2.1 产品参数：至少三套模型，互不映射

| 载体 | 结构 | 数据现状 | 证据 | 用途 |
|---|---|---|---|---|
| 旧站商品参数 | `snsii_product.DataAttr`（TEXT，手工 JSON/键值） | 10M 商品主表的一部分 | `02_table_inventory.csv:19`；`03_column_inventory.csv:141` | 前台详情页参数表 |
| 新平台参数 | `pd_param_def` + `pd_model.attrs_json` + Ds Bit `Parameter` / `FormalParameterSet` | 新表为结构就绪；数据加载靠 fixture | `db/migrations/20261116_0001/0002`；`icpdf/src/icpdf/domain/parameter.py:22-27` | 新前台与知识库 |
| 后台原型参数审核 | Demo 参数对象（含证据、状态、审核） | 仅前端内存 | `07_prototypes/admin/assets/views-knowledge.js` | 交互演示 |

**冲突点**：
- 参数键名在旧站用 md5 翻译（`02` CA-13），新平台用结构化 `pd_param_def`；**没有迁移/对齐脚本**。
- 单位、精度、条件（温度/电压）没有统一标准；三套模型都未定义单位字典。
- Ds Bit 的 `Parameter` 带证据绑定，旧站 `DataAttr` 不带来源；**同一参数在两边可能值不同且无法判定谁对**。

### 2.2 内容：至少四类载体 + 两个「内容库」概念

| 载体 | 数据 | 证据 | 发布方式 |
|---|---|---|---|
| 新闻/博客 | `snsii_news`（186 行） | `03_column_inventory.csv`；`NewsController` | 保存即生效 |
| 信息页 | `snsii_info`（6 行） | `InfoController`；`PageController::actionInfo` | 保存即生效 |
| 商品详情 | `snsii_product.Description` / `DataAttr` / `Pdf` | `ProController`、`views/pro/item.php` | 随商品保存 |
| 品牌/供应商介绍 | `snsii_supplier.Content` / `Description` | `SnSiiSupplier` | 随供应商保存 |
| 帮助中心 | 代码引用 `snsii_help`，但表与模型均不存在 | `HelpController.php:19-22`；31 表清单 | **不可执行** |
| 新平台内容资产 | **无表** | 12 张迁移表无内容表 | — |
| 原型内容资产库 | Demo 内容对象（审核/发布双状态） | `views-ops.js` 内容段；`admin.js` PAGES | 前端演示 |

**冲突点**：
- 「内容」在旧站是四个互不相干的表，没有统一 ID、分类、标签、版本、作者、审核状态。
- 原型把「内容资产库」做成统一对象，但**没有任何后端表**承接；迁移时无法一一映射。
- `snsii_help` 缺失说明「帮助中心」可能从未上线，或被删除后代码残留。

### 2.3 询盘与客户：四条数据路径，三个「询盘」定义

| 路径 | 落点 | 数据量 | 证据 | 是否可管理 |
|---|---|---|---|---|
| 商品页询盘 | **第三方** `wm.zokoko.cn/api/sendEmail` | 本站无记录 | `views/pro/item.php:226` | 否 |
| 购物车/RFQ | `snsii_cart`，并由 console 同步到 `db2` | 2,397 | `commands/CartController.php:32-83` | 否（无后台） |
| 联系表单 | `snsii_contact` | 1,606 | `SiteController.php` 联系逻辑；表清单 | 否（无后台） |
| 新平台询盘 | `biz_inquiry` 等 5 表 | 未上线 | `20261116_0003__biz_inquiry.up.sql` | 无后台 |
| 原型询盘 | Demo 对象 | — | `views-ops.js` 询盘段 | 仅演示 |

> 数据量列取自 `02_table_inventory.csv` 的 **AUTO_INCREMENT 上界**，不是精确行数；仅用于量级判断。

**冲突点**：
- 「询盘」在生产上指第三方邮件，在库内又指 `snsii_contact` 与 `snsii_cart`，在新平台指 `biz_inquiry`；**四者字段、编号、状态、归属均不同**。
- `commands/CartController.php:52` 使用 `Yii::$app->db2`，但 `config/` 中**未定义 `db2` 组件**；该同步命令一旦执行会失败。
- 没有客户主数据（`snsii_manage` 是管理员，不是客户），因此询盘无法归属到客户。
- 原型中的「客户/线索/报价」均无数据源。

### 2.4 搜索：四套实现/计划

| 实现 | 状态 | 证据 | 特点 |
|---|---|---|---|
| 旧站 MySQL LIKE 前缀搜索 | EXISTS_PRODUCTION | `controllers/SearchController.php:32-80` | 只能前缀匹配；未命中 302 |
| 辅助表 `snsii_product_search` | EXISTS_PRODUCTION | AUTO_INCREMENT 约 1,009 万；`SnSiiProductSearch` | 与主表字段重复，仅服务搜索/分类计数 |
| 新平台 Phase 1 `/search` + `/suggest` | EXISTS_CODE（仅契约/归档） | `03-api-contract.yaml:203,304` | 契约未在 Yii2 实现 |
| Meilisearch 全量索引 | 规划 | `老站架构升级与重构规划书.md:46,352-449` | 有方案，无代码 |
| 原型搜索管理（热词/零结果/同义词） | EXISTS_PROTOTYPE | `views-ops.js` search 段 | 无搜索日志支撑 |

**冲突点**：搜索日志不存在，因此原型中的「零结果词/同义词/热词排序」没有数据来源；Meilisearch 方案与 Phase 1 契约的字段/排序规则未对齐。

### 2.5 商品、品牌、分类：新旧两套主数据

| 对象 | 旧站 | 新平台 | 冲突 |
|---|---|---|---|
| 商品 | `snsii_product`（约 1,009 万） | `pd_model`（含 `legacy_id`） | 新表有 `stock_qty/price_from/price_tiers/attrs_json`，与旧表 `Quantity/InStock/UnitPrice/PriceNew/DataAttr` 重复；**无同步路径**（`sync_outbox` 无消费者） |
| 品牌 | `snsii_supplier`（1,428） | `pd_brand` | 旧站「品牌=供应商」，新平台拆成两个概念；映射规则未定 |
| 分类 | `snsii_product_category`（1,055） | `pd_category` | 旧站 `BigCat/SmallCat/Mid` 与新品类的层级/根分类未映射 |
| 替代料 | **无** | `pd_alt`（relation/source/confidence） | 新表有结构、无数据、无审核流程 |

> `pd_model.stock_qty` 的注释写明「口径待 D-04 确认」；`pd_alt` 的 `source/confidence` 也说明替代关系来源未定。这两项都属于**结构先行、业务未定**。

### 2.6 文档与 Datasheet：三种「文档」

| 对象 | 载体 | 证据 | 状态 |
|---|---|---|---|
| 前台 Datasheet 链接 | `snsii_product.Pdf` / `PdfId` | `views/pro/item.php:114-117` | 有字段，展示不完整 |
| 新平台文档元数据 | `pd_model_doc`（url/file_key/checksum） | `20261116_0002` | 结构就绪，无数据 |
| Ds Bit 文档 | PDF 文件 + `runs/<run_id>` 产物 | `icpdf-extractor/README.md` | 有解析，无持久化 |
| 原型文档管理 | Demo 文档对象（上传/解析状态/重试） | `views-knowledge.js` | 前端演示 |

**冲突点**：`pd_model_doc.checksum` 与 Ds Bit 的 `document_sha256` 语义接近但未约定同一算法/存储；`pd_model_doc.file_key` 指向对象存储，而 Ds Bit 目前只落本地 `runs/`。

### 2.7 语言：目标决策 / 当前实现 / 过期文档 / 旧域名四层事实

| 口径 | 内容 | 证据 | 状态 |
|---|---|---|---|
| **客户确认的目标语言（权威）** | **5 种：`en/de/ja/es/fr`**；默认 `en`；`id`、`zh` 不属于目标语言；印度市场暂以英文支持 | 客户最终决策（Reviewer 任务书，2026-11-16）；`07` Q-01 | 已确认决策 |
| 当前代码实现 | 5 种：`en/de/ja/es/id`；**`fr` 尚未实现，`id` 为遗留实现差异** | `web/src/i18n/locales.ts:18` | EXISTS_CODE |
| 平台文档 | 多处仍写 6 种 `en/zh/ja/de/es/id` | `04-web-frontend-plan.md:125`；`05-frontend-routing-and-acceptance.md:82` | 文档过期/冲突 |
| 旧站域名路由 | `DuoLang` **80 条**，一个域名/目录对应一语种 | `config/params.php:12` | EXISTS_PRODUCTION（快照） |
| 旧域名映射文档 | 被引用但**文件不存在** | `locales.ts` 注释引用 `07-language-and-legacy-domain-mapping.md` | NOT_FOUND |

**冲突点**：
- **目标语言以客户确认的 5 种为准**；当前代码中的 `id` 不能反过来作为目标依据，`fr` 未实现属于实现差异。
- 平台文档仍写 6 种含 zh，既不符合客户决策，也不符合当前代码；需修订文档（不改代码）。
- 80 个旧域名如何处置是**独立迁移问题**，不与「新版支持哪 5 种语言」混为一谈；该问题仍保留在 `07` Q-02。
- `snsii_language` 表 203 行是 country-list（国家/地区），**不能当作语种清单**，避免混淆。

### 2.8 审计与日志：三种「日志」互不相干

| 日志 | 内容 | 数据 | 证据 | 是否业务审计 |
|---|---|---|---|---|
| `snsii_cf_logs` | Cloudflare 日志 | 14,393 | 表清单 | 否 |
| `snsii_all_logs` | 外部写入的日志（字段含 HostName/Url/Number） | **表不在 31 表清单** | `ApiController.php:22-45` | 否，且接口未鉴权 |
| 原型操作审计 | 操作人/动作/对象 | Demo | `views-system.js` audit 段 | 仅演示 |
| Ds Bit 审计模块 | `src/icpdf/audit/__init__.py` 6 行 | 未实现 | 文件本身 | 否 |

**冲突点**：没有任何一处记录「谁改了商品/库存/价格/权限」。`snsii_all_logs` 即便存在，其字段也无法满足业务审计（无操作者、无前后值、无对象类型）。

### 2.9 任务与异步：三种「任务」

| 对象 | 载体 | 证据 | 状态 |
|---|---|---|---|
| 服务器定时任务 | Yii2 console 命令（sitemap、Indexing、供应商统计、购物车同步） | `commands/*` | 是否在跑未知 |
| `sync_outbox` | 新平台出站表 | `20261116_0004` | 有表，无生产者/消费者 |
| 原型待办/任务监控 | Demo | `views-system.js` tasks 段 | 仅演示 |
| Ds Bit 解析 run | `runs/<run_id>` | `icpdf-extractor` | 有产物，无调度 |

---

## 3. 同名不同物：必须逐项改名或定义

| 术语 | 出现位置 | 实际含义 | 风险 |
|---|---|---|---|
| 「内容审核」 | 旧站 / 原型 / Ds Bit | 旧站=无（保存即发布）；原型=内容资产审批；Ds Bit=`CONTENT_APPROVED`（引用参数的内容版本） | 三方会议里说的不是同一件事 |
| 「发布」 | 旧站商品 / 原型内容 / Ds Bit | `IsPut` 上下架；内容发布；`RELEASE_APPROVED` 发布批次 | 权限边界容易混淆 |
| 「参数」 | `DataAttr` / `pd_param_def` / Ds Bit `Parameter` | 商品属性文本；参数定义；带证据的正式参数 | 数据迁移与验收对象不清 |
| 「文档」 | 前台 Datasheet / `pd_model_doc` / Ds Bit document | PDF 链接；文档元数据；被解析的 PDF | 资产归属不清 |
| 「询盘」 | zokoko / `snsii_contact` / `snsii_cart` / `biz_inquiry` | 邮件通知；联系表单；RFQ 购物车；新平台线索 | 统计口径不可比 |
| 「知识版本」 | 原型 / Ds Bit | 原型=知识库版本+回滚；Ds Bit=版本快照（未实现） | 版本对象是参数、文档还是内容未定 |
| 「任务」 | console cron / 原型待办 / Ds Bit run | 定时脚本；人工待办；解析运行 | 监控与 SLA 对象不清 |
| 「品牌」 | 旧站 `snsii_supplier` / `pd_brand` / 原型 brands | 供应商；品牌主数据；品牌运营页 | 主数据归属冲突 |
| 「审核」 | 原型 approvals / Ds Bit 人工审核 / 内容审核 | 通用审批；参数证据审核；内容审批 | 审批人/权限模型无法合并 |
| 「三层闸门」 | 原型 / Ds Bit 设计 | `PIPELINE_PASS` / `CONTENT_APPROVED` / `RELEASE_APPROVED` | **不得合并**；HTML 原型有前端演示，正式后端 0 实现 |

> 第 10 项是本项目已冻结的语义：三层闸门必须保持独立，任何把「内容审核通过」等同于「可发布」的实现都属越权（见 `04` §5 与既有 `REVIEW-RESPONSE-v2.md`）。

---

## 4. 代码重复与死代码

| 项 | 路径 | 事实 | 影响 |
|---|---|---|---|
| 旧商品控制器备份 | `controllers/ProController_bak.php` | 与 `ProController.php` 并存 | 读代码时易误判当前实现 |
| 旧页面控制器备份 | `controllers/PageController_bak0609.php` | 同上 | 同上 |
| 旧 CController 备份 | `commands/CControllerBF.php` | 与 `commands/CController.php`（Indexing）并存 | 定时任务指向不明 |
| 购物车视图备份 | `views/cart/index_bak.php` | 与 `views/cart/index.php` 并存 | 同上 |
| 商品缓存副本 | `snsii_product_cache_copy1` | AUTO_INCREMENT 10,093,685，**0 行插入** | 空表占用同名空间，易误用 |
| 页面缓存 | `snsii/PageCache.php` | `use app\models\SnSiiPageCache`，**该模型不存在** | 缓存路径不可执行 |
| 购物车同步 | `commands/CartController.php:52` | 使用未配置的 `Yii::$app->db2` | 命令不可执行 |
| 广告模型 | `AdController.php` | 引用不存在的 `SnSiiAd` | 广告模块部分不可执行 |
| 帮助模型 | `HelpController.php:19-22` | 引用不存在的 `SnSiiHelp*` | 帮助模块不可执行 |
| 归档后端 | `platform/_archive/platform_server` | 8 条路由的 ThinkPHP 原型，已冻结 | 与 Phase 1 契约并行，**不可当生产实现** |
| 原型页面 | `07_prototypes/admin` | 34 路由 Demo | 与旧后台菜单高度重叠，但不是实现 |

> 这些死代码/备份不构成本轮修改对象；登记的目的是避免后续把「文件存在」当成「功能可用」。

---

## 5. 按域的详细缺口

### 5.1 A 用户前台

| 缺口 | 现状 | 证据 | 影响 |
|---|---|---|---|
| 替代料 | `NOT_FOUND`（旧站无表无页面） | 31 表清单；`views/pro/item.php` | 新平台 `pd_alt` 无数据来源 |
| 客户账户 | `NOT_FOUND`（无客户表/登录/订单） | 31 表清单；`SiteController` 仅管理员登录 | 无法做询盘历史、报价、复购 |
| Datasheet | `PARTIAL`：有 `Pdf/PdfId` 字段，详情页展示不完整 | `views/pro/item.php:114-117` | 客户拿不到完整文档 |
| 库存 | `PARTIAL`：主表 `Quantity/InStock`；`snsii_product_stock` 空表 | 列清单；表清单 | 库存口径与状态不可信 |
| 价格 | `PARTIAL`：分类 `PriceSwitch` 控制显示；价格固定 Request Quote | `CategoryController`；`views/pro/item.php` | 无价梯/币种规则 |
| 移动端搜索 | `PARTIAL`：输入框存在但无 form 提交 | `views/layouts/header.php:74-77` | 移动端搜索不可用 |
| 广告位 | `PARTIAL`：`snsii_ad` 仅 4 行，前台展示不明 | `AdController`；表清单 | 运营位几乎空置 |
| 订阅/社媒 | `NOT_FOUND`（页脚占位链接） | `views/layouts/footer.php:54,123` | 无邮件订阅、无社媒分发 |
| 多语言 | 80 域名路由；商品参数单语 | `config/params.php:12`；`DataAttr` | 翻译覆盖不可控 |
| 询盘闭环 | 第三方邮件，无本地记录/状态 | `views/pro/item.php:226` | 无法追踪与归因 |

### 5.2 B 商城运营后台

| 缺口 | 现状 | 证据 |
|---|---|---|
| 询盘/联系/RFQ 管理 | `NOT_FOUND`（有数据、无入口） | `snsii_contact` 1,606；`snsii_cart` 2,397；无控制器 |
| 客户主数据 | `NOT_FOUND` | 无客户表 |
| 订单/报价/合同 | `NOT_FOUND` | 无表无控制器 |
| 品牌/供应商管理 | `NOT_FOUND`（品牌=供应商，仅商品下拉） | `snsii_supplier`；无控制器 |
| 商品删除/导入导出 | `NOT_FOUND` | `ProductController` 无 delete/import |
| 商品 SEO 字段 | `NOT_FOUND`（标题由代码拼接） | `ProController.php:390-392` |
| 内容审核/版本 | `NOT_FOUND`（保存即发布） | `NewsController`、`InfoController` |
| 审计日志 | `NOT_FOUND` | 无审计表 |
| action 级权限 | `NOT_FOUND`（仅有登录 + 菜单隐藏） | `AdminController.php:38-58` |
| 报表/看板 | `NOT_FOUND`（首页为图标页） | `views/default/index.php:7` |
| 定时任务监控 | `NOT_FOUND` | 仅 console 命令 |
| 帮助中心 | 代码断裂（模型/表不存在） | `HelpController.php:19-22` |

### 5.3 C 营销工作台

| 能力 | 状态 | 证据 |
|---|---|---|
| 计划/预算 | `NOT_FOUND` | 无表 |
| 活动/优惠/投放 | `NOT_FOUND` | 无表 |
| 关键词库/排名 | `NOT_FOUND` | 无表、无 GSC API |
| 零结果词/同义词 | `NOT_FOUND` | 无搜索日志 |
| GEO 就绪度/写作约束 | `NOT_FOUND` | 无实现 |
| AI 内容生成 | `NOT_FOUND`（Ds Bit 也无 LLM） | `icpdf-extractor/README.md:3-6` |
| 内容审核/发布 | `NOT_FOUND`（旧站保存即发布） | `NewsController` |
| 社媒账号/排期/发布 | 5 渠道均 `NOT_FOUND` | 见 `03` §3；页脚仅占位链接 |
| 邮件订阅/活动/模板 | `NOT_FOUND`（仅 SMTP 通知） | `config/web.php` |
| 线索管理 | `PARTIAL`（有数据、无管理） | `snsii_contact`、`snsii_cart` |
| 自动化/工作流 | `NOT_FOUND` | 无 |
| 分析看板 | `PARTIAL`（GA4/GTM 标签采集，无自有看板） | `views/layouts/main.php` |
| UTM/归因 | `NOT_FOUND`（表单无 UTM 字段） | `views/pro/item.php` |
| 协作/待办 | `NOT_FOUND` | 无 |
| 外链/PR | `NOT_FOUND` | 无 |

**五渠道结论（摘要，详见 `03`）**：

| 渠道 | 现有能力 | API 依赖 | 授权要求 | 状态 |
|---|---|---|---|---|
| LinkedIn | 仅页脚链接 | 未评估 | 公司主页管理员 + API 审批 | `NOT_FOUND` |
| Facebook | 仅页脚链接 | 未评估 | Meta App 审核 + 主页权限 | `NOT_FOUND` |
| X | 仅页脚链接 | 未评估 | Developer App + 写权限 | `NOT_FOUND` |
| Reddit | 仅页脚链接 | 未评估 | OAuth + 版规/反垃圾限制 | `NOT_FOUND` |
| YouTube | 仅页脚链接 | 未评估 | Google OAuth + 频道授权 | `NOT_FOUND` |

> 原型中的「连接/发布/排期」全部是前端演示，不发真实请求（`prototype-readme.md`、`admin.js` Demo 状态）。

### 5.4 D Ds Bit 工作台

| 能力 | 状态 | 证据 |
|---|---|---|
| 文档上传/身份/分类 | `EXISTS_CODE`（本地/冻结环境） | `serve_parser.py`；`domain/document.py` |
| 解析任务/运行/回放 | `EXISTS_CODE` | `serve_parser.py:1238,1289`；`runs/` |
| 表格/候选/参数 | `EXISTS_CODE`（候选注册表） | `domain/candidate.py`、`parameter.py` |
| 证据追溯 | `EXISTS_CODE`（evidence 模型） | `domain/evidence.py`；`DATA_CONTRACT.md` |
| 质量状态 | `PARTIAL`（引擎校验，未落库） | `DATA_CONTRACT.md` |
| 人工审核 | `NOT_FOUND`（无审核表/接口） | 代码无 |
| 知识版本 | `NOT_FOUND` | 代码无 |
| 发布授权/记录 | `NOT_FOUND` | 代码无 |
| 三层闸门 | **仅原型/设计** | `views-knowledge.js:52-54`；正式后端代码 0 命中 |
| 持久化/队列/审计 | `NOT_FOUND` | `serve_parser.py:18`；`audit/__init__.py` 6 行 |
| LLM 抽取 | `NOT_FOUND`（Phase 2 预留） | `README.md:3-6` |

### 5.5 E 平台管理中心

| 能力 | 状态 | 证据 |
|---|---|---|
| 后台应用 | `NOT_FOUND`（无 admin 工程/无页面） | `platform/web/src` 0 个 page |
| 账号/登录 | `EXISTS_PRODUCTION`（旧后台） | `SiteController.php:175-200` |
| 角色/权限矩阵 | `NOT_FOUND` | 仅 `Role` 字段 + `NavList` |
| 菜单管理 | `NOT_FOUND` | 无 nav CRUD |
| 审计日志 | `NOT_FOUND` | 无审计表 |
| 任务监控 | `NOT_FOUND` | 无调度界面 |
| 系统配置 | `NOT_FOUND` | 配置在 `config/params.php` |
| API 管理 | `PARTIAL`（契约 + 归档实现，无生产实现） | `03-api-contract.yaml` |
| 多语言配置 | `PARTIAL`（目标 5 语种 `en/de/ja/es/fr`；代码 `en/de/ja/es/id`，`fr` 未实现；文档 6 种；旧站 80 域名） | `locales.ts:18`；`params.php:12` |

---

## 6. 上线前必须消除的阻断项

| 编号 | 阻断项 | 为什么阻断 | 证据 |
|---|---|---|---|
| B-01 | Phase 1 契约 9 条路径无 Yii2 实现 | 新前台无法取数 | `03-api-contract.yaml`；Yii2 无 `/api/v1` 路由 |
| B-02 | 旧 URL / 80 域名与 5 语种的映射缺失 | 直接上线会造成排名与流量损失 | `locales.ts` 注释引用的映射文档不存在 |
| B-03 | 新 `pd_model` 与旧 `snsii_product` 无同步/迁移方案 | 商品展示会出现两套数据 | `legacy_id`；`sync_outbox` 无消费者 |
| B-04 | 询盘落在第三方，新平台 `biz_inquiry` 无历史数据 | 上线即丢历史线索 | `views/pro/item.php:226`；`0003` 迁移 |
| B-05 | 价格/库存口径未定（`PriceSwitch`、`stock_qty` 注释 D-04） | 前台展示可能与实际不符 | `pd_model` 列注释；分类字段 |
| B-06 | 内容无统一模型/无审核 | 迁移无法映射，发布无闸门 | 四类内容表；原型内容库 |
| B-07 | 三层闸门无正式后端实现 | 知识内容可能绕过授权发布；原型演示不能作为审计依据 | `04` §5；后端 0 命中；原型 `contentRelease()` 仅前端演示 |
| B-08 | 旧后台无 action 级鉴权 | 任何登录账号可执行全部写操作 | `AdminController.php:38-58` |
| B-09 | 帮助模块/广告模块/页面缓存引用不存在的类 | 相关后台功能不可执行 | `HelpController.php:19-22`；`AdController`；`snsii/PageCache.php` |
| B-10 | 语言口径冲突（目标 5、代码含 `id` 缺 `fr`、文档 6、旧域名 80） | 需求与验收标准不一致 | `locales.ts:18`；`04-web-frontend-plan.md:125` |

> B-01～B-07 属产品/数据决策；B-08/B-09 属代码缺陷；B-10 属文档口径。**本文不判断谁先做。**

---

## 7. 文档与证据不一致（需要在评审中先对齐）

| 编号 | 不一致 | 现状 | 处置 |
|---|---|---|---|
| D-01 | 平台文档写「六语种含 zh」 | 与客户确认的 5 种目标语言（`en/de/ja/es/fr`）冲突 | 以客户决策为准，文档需修订（不改代码） |
| D-02 | `07-language-and-legacy-domain-mapping.md` 被引用但不存在 | `locales.ts` 注释；`docs/phase1/` 无此文件 | 需补文档或删引用 |
| D-03 | `04-web-frontend-plan.md:125` 写 `en/zh/ja/de/es/id` | 与客户目标（fr）、当前代码（id）均不一致 | 文档按客户决策修订；代码差异登记为遗留实现 |
| D-04 | `02` 原判 `CA-30` 为 `EXISTS_PRODUCTION` | `SnSiiHelp*` 模型不存在、`snsii_help` 不在 31 表 | 已在本次盘点中下调为 `PARTIAL`（E2） |
| D-05 | `snsii_all_logs` 被代码引用但不在 31 表清单 | 可能审计导出不完整，或表已被删 | 需 DBA 只读核实 |
| D-06 | `snsii_language` 203 行易被误读为「语种」 | 实为国家/地区清单 | 文档中明确区分 |
| D-07 | 原型中的多语种/MFA/SSO 等文案 | 均为 Demo，未实现 | 评审时不得计入实现 |
| D-08 | 目标语言 `fr` 未实现，代码仍含 `id` | `locales.ts:18`；客户决策 2026-11-16 | 登记为实现差异，不在本轮改代码 |

---

## 8. 结论

1. **最大的问题不是「缺页面」，而是「同一业务对象有多套事实」**：参数、内容、询盘、语言、商品、文档、日志都存在两套以上载体，且没有映射或同步机制。
2. **旧站是「可运行但治理缺失」**：核心展示链路有生产数据支撑；后台只有商品维护，权限/审计/审核/任务监控均缺失；部分模块代码已断裂。
3. **新平台是「结构与契约先行，实现未跟上」**：目标 5 语种（代码仍为 `en/de/ja/es/id`，`fr` 未实现）、12 张表、9 条契约、组件层已就绪，但没有页面、没有 Yii2 实现、没有后台应用。
4. **原型不能作为实现证据**：34 个路由覆盖了完整信息架构，但全部是 Demo；三层闸门仅有前端演示，RBAC、审计、任务监控只存在于原型/设计，正式后端均未实现。
5. **Ds Bit 是唯一「技术底座真实存在」的新能力**，但工作台层（审核、版本、发布、审计）从零开始，且引擎本身无数据库、无 LLM。

> 以上事实需由业务负责人对 `07` 中的问题逐项确认后，才能进入产品设计与实施阶段。