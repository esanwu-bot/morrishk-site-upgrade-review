# 现有系统基线

> 本文为**逐字抽取**，来源：`02_technical_design/morrishk_technical_plan_v1.2.md` 第 1 章「技术基线」。
> 数据库层面的客观事实另见 `database_extraction_report.md` 与 `04_database/`。

## 1. 技术基线

### 1.1 运行环境

| 层 | 现状 | 备注 |
|---|---|---|
| 框架 | Yii 2 Basic（单应用） | 无 frontend/backend 分离 |
| PHP | 7.4.33 | 已停止官方安全支持；本期补偿加固，升级路线见 11.2 |
| Web | nginx + PHP-FPM（宝塔） | 与多个站点同机同盘 |
| 数据库 | MySQL 5.6.50，库 `morris`，前缀 `snsii_` | 全部 MyISAM；无 JSON 类型、无窗口函数 |
| 缓存 | Yii FileCache + 31.7GB 详情缓存表 | 缓存表是详情页主读路径 |
| 字符集 | `utf8`（mb3） | 新表统一 utf8mb4 |
| 磁盘 | 465G / 已用 58% / 剩 199G | 离线产物不得落在系统盘；核算见 3.8.3 |

### 1.2 关键入口

| 业务 | 路由 | 控制器 |
|---|---|---|
| 首页 | `/` | `SiteController::actionIndex` |
| 产品总览 | `/products.html` | `ProController::actionIndex` |
| 二级分类 | `/big-categories/c-{Mid}-{Cid}/{Links}.html` | `ProController::actionList` |
| 三级分类 | `/sub-categories/c-{Mid}-{Cid}/{Links}.html` | `ProController::actionSub` |
| 详情 | `/products/{id8}/{PartUrl}.html` | `ProController::actionItem` |
| 搜索 | `/search/index.html?keyword=` | `SearchController::actionIndex` |
| 品牌 | `/manufacturer/{Links}.html` | `MfrController` |
| 文章 | `/blog...` | `BlogController` |
| 兜底静态页 | `/{Links}.html` | `PageController::actionInfo` |
| 询价车 | `/shopping-cart.html` | `CartController` |
| 后台 | `/ejadmin-index.html` | `modules/ejadmin` |

### 1.3 URL 规则（不可变更基线）

```
/products/<id:8位数字>/<PartUrl:[0-9a-zA-Z\-]+>      -> /pro/item
/manufacturer/<Links:[0-9a-zA-Z\-]+>                 -> /mfr/item
/sub-categories/c-<Mid:\d+>-<Cid:\d+>/<Links>        -> /pro/sub
/big-categories/c-<Mid:\d+>-<Cid:\d+>/<Links>        -> /pro/list
/products                                            -> /pro/index
/manufacturers                                       -> /mfr/index
/shopping-cart                                       -> /cart/index
/new-products[/<Date>]                               -> /pro/new-product
/blog[/<Links>]                                      -> /blog/index
/blog/tags/<Links>                                   -> /blog/tags
/blog/details/<Links>                                -> /blog/item
/ejadmin-index                                       -> /ejadmin/default/index
/<Links>                                             -> /page/info   （兜底）
```

全局：`enablePrettyUrl=true`、`showScriptName=false`、`suffix='.html'`。

**技术约束**：任何新增 URL 规则必须插入兜底规则之前，并补充路由单测；禁止修改后缀、8 位编号与域名语种机制。

### 1.4 数据量表与数据事实

| 表 | 行数/体积 | 引擎 | 用途 |
|---|---:|---|---|
| `snsii_product` | 10,093,684；数据 6.7GB + 索引 1.27GB | MyISAM | 产品主表 |
| `snsii_product_cache` | 10,093,684；31.7GB | MyISAM | 详情页预渲染 JSON |
| `snsii_product_search` | 待实测 | MyISAM | 搜索/分类冗余表 |
| `snsii_product_category` | 982 | MyISAM | 分类树 |
| `snsii_supplier` | 1,427 | MyISAM | 品牌/供应商 |
| `snsii_news` | 183 | MyISAM | 文章 |

产品状态分布：`IsPut=6` 约 733 万、`IsPut=4` 约 276 万、`IsPut=0/1` 共 59 条。`PdfId` 非零约 563 万行，去重 PDF 568,830 个；显式 `Pdf` 路径 11,658 行。

**由上述数字可直接推出的事实**（v1.0 未据此修正模型，本版修正）：

- 563 万行关联 56.9 万个 PDF，**平均一个 PDF 被约 9.9 个产品引用**，产品与 PDF 是一对多，不是一对一。
- 因此"产品 + PDF + 解析版本"必须拆成三层，任何把三者放进一张表的设计都会产生唯一键冲突（见 3.4）。
- 56.9 万份文档、平均 9.9 个关联，意味着**文档级解析只需执行 56.9 万次，而不是 563 万次**，这是三层拆分带来的直接成本收益。

### 1.5 现有技术缺陷（实现层）

| # | 位置 | 问题 | 影响 | 处置阶段 |
|---|---|---|---|---|
| T1 | `web/index.php` | 生产启用调试模式 | 错误页泄露路径/SQL | Phase 1 |
| T2 | `config/*.php` | 密钥、数据库、SMTP 硬编码 | 泄露与轮换困难 | Phase 1 |
| T3 | `ProController.php:269` | 详情页 SQL 字符串拼接 | 输入校验风险 | Phase 1 |
| T4 | `ProController.php:285/305` | 商品不存在返回 200 + `die('error')` | 软 404，消耗抓取预算 | Phase 1 |
| T5 | `ProController.php:292` | 参数名翻译无回落，未命中显示 md5 | 详情页出现哈希串 | Phase 3 |
| T6 | `SearchController.php:47` | 仅前缀 LIKE，无容错/分词/分面 | 搜索流失 | Phase 2 |
| T7 | `SearchController.php:61` | 未命中 302 到询价车 | 用户被赶走 | Phase 2 |
| T8 | `SearchController.php:29` | 显式关闭 CSRF | 只读搜索可接受，写接口不得效仿 | Phase 1 复核 |
| T9 | 全局视图 | 无 canonical/hreflang/JSON-LD/sitemap | 结构化红利未释放 | Phase 1 基线 / Phase 2 扩展 |
| T10 | 全站 | `ImgId` 映射的图片资源不可用 | 转化与分享卡片受损 | Phase 1 |
| T11 | 详情页 | 参数只来自 `DataAttr` JSON | 内容薄、无法分面 | Phase 3 |
| T12 | 全站 | MyISAM 无事务、写锁 | 高峰期排队、崩溃修复慢 | 分阶段 |
| T13 | 询价车 / 邮件 | **无询盘业务表，询盘只存在于邮件与购物车** | 无法归因、无法跟进、无法验收 | Phase 1 |
| T14 | 详情页 | **无"Request a Quote"主 CTA，询价入口在购物车** | 询盘转化路径过长 | Phase 1 |
| T15 | 全站 | 无渠道/UTM 落地记录 | 无法判断哪个渠道带来询盘 | Phase 1 |

### 1.6 基线指标

| 指标 | 基线 |
|---|---|
| 详情页 TTFB（服务器侧） | 0.25–0.67s |
| 搜索命中规则 | 仅前缀；错字/中缀/空格失败 |
| 搜索无结果行为 | 302 到 `/shopping-cart.html?part=` |
| 分类展示上限 | 硬截断 1000 条 |
| 可索引页面 | 约 1009 万，隐藏品混入 |
| 结构化数据 | 0 |
| sitemap | 0 |
| 详情页询盘入口 | 无独立 CTA |
| 询盘记录 | 无结构化存储 |
| 渠道归因 | 无 |

> 询盘相关三项基线当前为"无"，需在 Phase 1 第 1 周由甲方提供历史邮件/表单归档，与埋点数据共同建立转化基线（对应 V5）。

---
