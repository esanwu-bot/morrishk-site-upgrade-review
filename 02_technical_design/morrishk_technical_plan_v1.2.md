# morrishk.net 老站升级详细技术方案

| 项 | 内容 |
|---|---|
| 项目 | morrishk.net 电子元器件 B2B 独立站 |
| 文档版本 | 技术版 v1.2（第二轮评审修订版） |
| 上一版本 | 技术版 v1.1（2026-11-15） |
| 日期 | 2026-11-15 |
| 修订依据 | 第一轮评审：P0 六项、P1 六项（R01–R12）；第二轮评审：P0 四项、P1 六项、验收补充一项（S01–S11） |
| 代码基线 | 线上打包快照 `newPlan\morrishk.net` |
| 数据基线 | 2024-11-30 导出，静态终态 |
| 关系 | 客户版方案的配套技术附件；商务报价另行提供 |
| 约束 | 不改老 URL、不换框架、不改千万行主表结构 |

---

## 0. 本版修订说明

### 0.1 修订定位

v1.0 的问题不在于技术路线错误，而在于它是一份"技术改造功能清单"，不是可以直接拆任务、执行迁移和验收的工程实施方案。结合甲方已明确的业务方向——**前期重点是详情页、外链、社媒引流，最终目标是询盘**——v1.0 的技术投入顺序与业务目标不一致：询盘转化没有被当作核心工作流，社媒与归因被排在最后，BOM 与大规模参数解析却占用了前期资源。

v1.1 只集中改三件事：

1. **数据模型纠错**：PDF 资产、产品文档关联、解析结果三层拆分；参数记录改为不可变版本 + 证据追溯。
2. **询盘转化闭环**：新增独立的询盘数据模型、归因链路、销售跟进与业务验收指标。
3. **实施优先级重排**：由"M0–M6 串行"改为"四阶段、获客优先"，并重新核算工作量与依赖关系。

其余技术细节按阶段细化，不在本版一次性展开。

v1.2 针对第二轮评审（第 8–15 章及附录）继续收敛，只解决四类问题，不新增功能范围：

1. **规则冲突**：canonical 与 noindex 同时使用造成的信号冲突（S02）；Tier C/D 仅凭"历史流量"分层造成的判定不足（S01、S05）。
2. **状态定义不完整**：BOM 附件安全与状态机（S03）；询盘故障降级与线索不丢失（S04）；社媒发布幂等与审计（S07）。
3. **运维与验收口径**：MyISAM 备份一致性（S08）；升级路线硬性日期（S09）；验收指标的分子分母定义（S10）。
4. **WBS 边界**：P1-4 与 P1-7 的工作重复（S06）。

第二轮评审提到"第 2–7 章尚未出现在可核对材料中"，属材料传递问题：完整稿包含第 2–7 章，R01–R03、R05、R08、R09 的落地设计分别在 3.4、3.5、3.8、第 5 章、6.3/6.8、5.6。为避免再次出现缺章，本版在第 0.6 节补了完整章节索引，并标注每章对应的评审编号。

### 0.2 评审意见响应表

| 编号 | 评审意见 | 本版处理 | 章节 |
|---|---|---|---|
| R01 | 拆分 PDF 资产、产品文档关联、解析任务三层数据模型 | 已修订：单表设计废弃，改为三张表，唯一键矛盾消除 | 3.4 |
| R02 | 修正参数表版本化与证据追溯设计 | 已修订：新增 DocumentId / ParseRunId / ValueKind / Conditions / CellBBox / ReviewStatus，历史记录不可变 | 3.5 |
| R03 | 修正缓存表切换与回滚方案 | 已修订：应用层双读开关为主，`RENAME` 降级为最终收敛手段；补 12 项前置检查与磁盘核算 | 3.8 |
| R04 | 统一不存在商品的 301、404、410 规则 | 已修订：按 8 类情形分别判定，取消"商品不存在即 301 到分类"的兜底 | 8.2 |
| R05 | 增加询盘数据模型、归因及销售闭环 | 已新增：4 张表 + 状态机 + 通知 + 反垃圾 + 业务验收 | 第 5 章 |
| R06 | 将详情页、询盘、外链、社媒引流提前 | 已重排：四阶段，Phase 1 定义为"获客基础" | 14.1 |
| R07 | 将 BOM 自动化与智能替代料移至后期 | 已拆分：Phase 1 仅文件上传 + 多型号录入 + 人工处理；智能匹配移至 Phase 4 | 第 10 章 |
| R08 | 补充 Meilisearch 真实型号测试与性能基准 | 已补：四层检索规则、500–1,000 条测试集、基准方法与通过线，目标值改为"待基准确认" | 6.3、6.8 |
| R09 | 完善 GA4 事件幂等与隐私处理 | 已修订：后端为唯一正式事件源，以 LeadNo 做业务幂等；明确 client_id 不具备去重能力 | 5.6 |
| R10 | 明确千万商品的索引 / noindex / Sitemap 策略 | 已补：访问、爬取、索引、Sitemap 四概念分离 + 六层商品分级 | 8.4 |
| R11 | 明确 PHP 8、MySQL 升级路线 | 已补：三阶段独立路线与时间窗，不与本次改造捆绑 | 11.2 |
| R12 | 重新核算工作量、并行关系与 staging 验收 | 已重算：按阶段给出区间与依赖，补 staging 演练清单与业务验收指标 | 13.5、14.2 |

### 0.3 第二轮评审响应表

| 编号 | 评审意见 | 本版处理 | 章节 |
|---|---|---|---|
| S01 | Tier C 不能只依据历史流量判定 | 已修订：改为"内容有效 + 三项外部信号之一"的机器判定，补阈值、人工例外、抽样验收 | 8.4.2–8.4.4 |
| S02 | canonical 与 noindex 信号冲突 | 已修订：给出 URL 类型 × 状态码 × robots × canonical × sitemap 完整矩阵；noindex 页一律自指 canonical，不再指向无参数页 | 8.3 |
| S03 | BOM 上传缺少文件安全控制 | 已补：双层校验、随机文件名、私有存储、签名下载、宏与压缩炸弹防护、扫描隔离、状态机与验收用例 | 10.4 |
| S04 | 询盘回滚不能只靠关闭开关 | 已修订：四级降级模式 + 文件级 spool 暂存 + 补偿重放 + 故障演练脚本 | 5.10 |
| S05 | Tier D 276 万页面持续消耗抓取资源 | 已修订：D 拆为 D1（有信号无内容）/D2（无信号无内容），删除与失效走 8.2 不进入分层；明确 robots 不得屏蔽需要读取 noindex 的页面 | 8.4.1、8.4.5 |
| S06 | Sitemap 月度全量重建不够精细 | 已修订：日增量 + 月全量校验；分片 manifest 记录生成时间/URL 数/SHA-256；失效 URL 自动清理；50MB 按未压缩 XML 计 | 8.4.6 |
| S07 | 社媒任务缺少幂等与审计 | 已补：内容版本号 + 幂等键 + 独立发布尝试表 + 错误分类 + 账号外键 | 9.3 |
| S08 | 备份与 MyISAM 引擎不一致 | 已修订：区分停写窗口与逐表快照，明确工具参数、锁表时长、校验与恢复演练规模 | 12.3 |
| S09 | PHP 8 / MySQL 升级缺硬性日期 | 已补：S2/S3 的启动、完成与决策日期，逾期升级为项目风险 | 11.2 |
| S10 | P1-4 与 P1-7 工作重复 | 已修订：通用附件能力归 P1-4，P1-7 只计 BOM 专属部分；人日重算 | 14.1、14.2 |
| S11 | 验收指标无法复现 | 已补：每个指标的分子分母、抽样方法、错误分类与判定人 | 13.4 |

### 0.4 本版仍待验证的事项

以下 6 项在 v1.0 中被当作已知条件使用，本版明确列为**待验证**，验证结论回填后才进入对应阶段实施。

| # | 待验证项 | 影响 | 验证方式 | 责任方 | 时限 |
|---|---|---|---|---|---|
| V1 | `PartNumber` 是否真有唯一索引、重复率多少 | 精确命中与去重逻辑 | `SHOW INDEX` + 重复值统计 | 乙方 | Phase 1 第 1 周 |
| V2 | `PdfId` 共享度与文档类型分布 | 三层模型规模与审核工作量 | 抽样 5,000 行 + 人工标注文档类型 | 乙方 | Phase 1 第 1 周 |
| V3 | Meilisearch 在 500 万 / 1,000 万文档下的内存与延迟 | 实例规格与成本 | 两档基准测试（见 6.8） | 乙方 | Phase 2 启动前 |
| V4 | 新缓存表实际体积与索引体积 | 磁盘核算与切换窗口 | staging 灌 100 万行外推 | 乙方 | Phase 1 内 |
| V5 | 现网询盘量与来源结构 | 转化基线、渠道 ROI | 表单埋点 + 历史邮件归档统计 | 甲方 | Phase 1 第 1 周 |
| V6 | `IsPut` 4/6/0/1 的业务语义 | 索引策略与状态码规则 | 业务确认 + 抽样核对 | 甲方 | Phase 1 第 1 周 |

### 0.5 章节对照（v1.0 → v1.1）

| v1.0 | v1.1 | 变化 |
|---|---|---|
| 3.4 参数值、3.5 PDF 解析元数据 | 3.4 文档三层模型、3.5 参数值 | 重构 |
| 3.7 新版详情缓存 | 3.8 新版详情缓存 | 切换方案重写 |
| 6.1 / 6.5 301 与 404 | 8.2 状态码统一规则 | 合并重写 |
| 7.6 GA4 服务端回传 | 5.6 询盘归因与 GA4 | 移入询盘章节并重写 |
| — | 第 5 章 询盘转化 | 新增 |
| — | 第 4 章 产品详情页改造 | 新增 |
| — | 第 10 章 BOM 分阶段 | 新增 |
| 10.1 WBS（M0–M6） | 14.1 四阶段 WBS | 重排 |

### 0.6 完整章节索引（含评审编号）

供评审逐章核对，避免缺章误判。

| 章 | 标题 | 阶段 | 对应评审编号 |
|---|---|---|---|
| 0 | 本版修订说明 | — | R01–R12、S01–S10 汇总 |
| 1 | 技术基线 | — | 数据事实（1.4）支撑 R01 |
| 2 | 总体架构 | — | R06（2.7 业务域映射） |
| 3 | 数据层设计 | P1/P3 | R01（3.4）、R02（3.5）、R03（3.8） |
| 4 | 产品详情页改造 | P1 | R06、T10/T14 |
| 5 | 询盘转化与归因 | P1 | R05、R09、S04（5.10） |
| 6 | 搜索子系统 | P2 | R08（6.3、6.8） |
| 7 | Ds Bit 参数化 | P3 | R01、R02、R08（归属判定） |
| 8 | SEO 与多语种 | P1/P2 | R04（8.2）、R10（8.4）、S01/S02/S05/S06 |
| 9 | 社媒与视频 | P2 | R06、S07（9.3） |
| 10 | BOM 分阶段 | P1/P4 | R07、S03（10.4） |
| 11 | 安全与运行时升级 | P1 | R11、S09（11.2） |
| 12 | 稳定性与运维 | P1 | S08（12.3）、S04（12.5） |
| 13 | 测试与验收 | 全程 | R12、S11（13.4） |
| 14 | 实施排期与资源 | — | R06、R12、S10（14.1） |
| 15 | 风险登记册 | — | 全部 |
| 附录 A–G | 路由 / DDL / Settings / 用例 / 阈值 / 术语 / 范围 | — | — |

---

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

> **口径说明：56.8 万与 56.9 万是同一个数（P0-04）**
>
> 二者均指上文的 **568,830 个去重 PDF**，不是两套统计口径，也不是两个数据集：
> 568,830 ÷ 10,000 = 56.883 万，**四舍五入取一位小数为 56.9 万，直接截断为 56.8 万**。
> 此前客户版沿用截断值、技术版沿用四舍五入值，同一份材料里出现两个数字，读起来像是口径分歧，实为取整差异。
>
> 本版起统一处理：**以 568,830 为唯一权威值**，文字表述统一写作「约 56.9 万（568,830）」，
> 不再使用 56.8 万。凡引用该数字处，若与 568,830 不符，一律以 568,830 为准。
> 统计方法为 `COUNT(DISTINCT PdfId)`，统计时点 2024-11-30，属于**文件数**，不是商品数。

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

## 2. 总体架构

### 2.1 逻辑分层

```
接入层：nginx（TLS、限速、静态缓存、规范化 301）
应用层：Yii2（路由不变、控制器改造、开关控制）
转化层：详情页 CTA / 询盘表单 / 询价车 / BOM 上传 / 线索落库与通知
检索层：Meilisearch（版本化索引 + 别名）
数据层：MySQL（主数据只读 + 新参数/新缓存/新询盘表）
离线层：导出/清洗/索引构建；PDF 下载/解析/质量门/物化
观测层：日志、指标、告警、审计、转化漏斗
```

与 v1.0 的差别：**新增"转化层"，并把它放在与检索层同级的位置**。原因是本项目的最终交付目标是询盘，而不是索引或参数库；检索与解析都是为详情页和询盘服务的中间能力。

### 2.2 部署拓扑

| 组件 | 部署 | 规格建议 | 说明 |
|---|---|---|---|
| Web/应用 | 现有服务器 | 维持 | 不与离线任务混部 |
| MySQL | 现有服务器 | 维持 + 独立磁盘配额 | 大表只读 |
| Meilisearch | 独立实例/容器 | 内存规格待基准确认（见 6.8） | 千万文档索引 |
| 离线 Worker | 独立容器/机器 | 按解析并发 | 可中断、可扩容 |
| 对象存储 + CDN | 云服务 | 按量 | PDF、图片、BOM 附件、sitemap |
| 邮件服务 | 现有 SMTP 或第三方 | 按量 | 询盘通知，需可观测送达率 |
| 监控 | 独立 | 轻量 | 5xx、磁盘、证书、检索健康、询盘通知失败 |

### 2.3 环境划分

| 环境 | 用途 | 数据 |
|---|---|---|
| prod | 线上 | 真实数据，只读为主 |
| staging | 预发/回归/切换演练 | 脱敏子集（1–5%） |
| offline | 导出、索引、解析 | 快照或从库 |
| sandbox | 解析算法调试、搜索基准 | 单件样本 / 真实型号测试集 |

### 2.4 配置与密钥

- 数据库、SMTP、GA4 API Secret、社媒 Token 全部移出代码，使用环境变量或本地受控配置文件（权限 600）。
- **密钥必须实际轮换，而不只是移动位置**。凡在代码、历史提交、日志、备份中出现过的凭据，一律视为已泄露：先签发新凭据，再切换，最后作废旧凭据并检查访问日志。
- 新增独立数据库连接 `dbSpec`，`charset=utf8mb4`，仅用于新表，避免影响老连接。
- 任何文档不记录明文凭据。

### 2.5 开关矩阵

| 开关 | 作用 | 默认 | 回滚 |
|---|---|---|---|
| `lead_enabled` | 详情页询盘 CTA 与表单 | `off` → 灰度 `on` | **不用于回滚**；故障时按 5.10 分级降级，禁止退回"只发邮件不入库" |
| `lead_notify` | 询盘通知（邮件/后台） | `on` | 关闭仅入库不通知 |
| `lead_ga4_server` | 服务端回传 GA4 | `off` | 关闭即停止回传，不影响入库 |
| `lead_dedupe_window` | 重复提交判定窗口（分钟） | `30` | 调整参数 |
| `search_engine` | `mysql` / `meili` | `mysql` | 切回 `mysql` |
| `search_fallback` | 检索故障自动回退 | `on` | — |
| `spec_enabled` | 详情页使用新参数表 | `off` | 关闭即回 `DataAttr` |
| `spec_publish_mode` | `draft` / `reviewed` | `reviewed` | 切回 `draft` 仅内部可见 |
| `jsonld_enabled` | 输出结构化数据 | `off` | 关闭即撤下 |
| `cache_read_mode` | `legacy` / `dual` / `v2` | `legacy` | 逐级回退 |
| `cache_v2_pct` | 双读阶段新缓存命中比例 | `0` | 调回 0 |
| `sitemap_enabled` | 输出 sitemap | `off` | 关闭即 404 |
| `index_policy` | `safe` / `expand` | `safe` | 回 `safe` 收紧索引 |
| `social_enabled` | 社媒分发任务 | `off` | 停止任务 |
| `video_enabled` | 视频嵌入与标记 | `off` | 关闭即隐藏 |

开关配置放独立文件/环境变量，不写库，避免故障时依赖数据库。开关文件需设置读取缓存 TTL ≤ 5 秒，并在变更后主动失效，避免 PHP-FPM 多进程读到不同值。

### 2.6 灰度维度

- 询盘：按页面类型（详情页 → 分类页 → 首页）逐层放开，先内部账号验证。
- 搜索：按流量比例 5% → 20% → 50% → 100%。
- 参数：按分类白名单 → 10% → 50% → 100%。
- 前端：按页面类型逐页替换。
- 社媒：按平台逐个接入。

### 2.7 业务域与阶段映射

| 业务域 | 核心产出 | 所属阶段 |
|---|---|---|
| 稳定与安全 | 可观测、可备份、可回滚 | Phase 1 |
| 详情页与转化 | 详情页信息完整、询盘可提交、线索可跟进 | Phase 1 |
| 归因 | 每个询盘可追溯到渠道与落地页 | Phase 1 |
| 技术 SEO 基线 | URL 状态码、canonical、索引策略正确 | Phase 1 |
| 搜索 | 型号检索准确、可容错 | Phase 2 |
| 内容与流量 | 外链、社媒、视频持续导入流量 | Phase 2 |
| 参数数据能力 | 参数可信、可追溯、可发布 | Phase 3 |
| BOM 与智能化 | BOM 智能匹配、替代料、AI 助手 | Phase 4 |

---
## 3. 数据层设计

### 3.1 设计原则

1. **主表零 ALTER**：1009 万行 MyISAM 加列会全表重建并持写锁，本期不动。
2. **新表 InnoDB + utf8mb4**：支持事务、行锁、4 字节字符。
3. **职责单一**：文档资产、业务关联、解析结果、参数值分表存储，任何一张表只回答一个问题。
4. **历史不可变**：解析结果与参数记录一经写入不再修改，修正产生新记录并标记取代关系；发布状态与"当前生效"由独立字段维护。
5. **证据可追溯**：每条参数必须能定位到文档、解析运行、页码、表格行列与单元格坐标。
6. **切换优先在应用层**：表名切换（`RENAME`）只作为最终收敛手段，不作为第一版上线的主要切换方式。
7. **幂等**：所有离线写入以业务唯一键去重，可重复执行，重复执行不产生重复数据。

### 3.2 新表清单

| 表 | 作用 | 预估行数 | 阶段 |
|---|---|---:|---|
| `snsii_product_attr_dict` | 参数主数据（Key/英文名/类型/单位） | 1–3 千 | Phase 3 |
| `snsii_product_spec` | 参数值（不可变版本 + 证据） | 数千万 | Phase 3 |
| `snsii_product_document_asset` | 文档资产（按内容去重） | 56.9 万 | Phase 3 |
| `snsii_product_document_link` | 产品 ↔ 文档业务关联 | 563 万 | Phase 3 |
| `snsii_document_parse_run` | 文档解析运行记录 | 60–120 万 | Phase 3 |
| `snsii_product_spec_i18n` | 参数名五语种 | 1–2 万 | Phase 3 |
| `snsii_product_cache_v2` | 新版详情缓存（含参数与 JSON-LD） | 1009 万 | Phase 1 |
| `snsii_legacy_url_map` | 8 位编号 → 商品映射 | 1009 万 | Phase 1 |
| `snsii_url_policy` | 301/410 显式策略 | 万级 | Phase 1 |
| `snsii_page_quality` | 索引分层判定结果与输入快照 | 1009 万 | Phase 1 |
| `snsii_index_exception` | 索引分层人工例外 | 千级 | Phase 1 |
| `snsii_lead` | 询盘主表 | 万级/年 | Phase 1 |
| `snsii_lead_item` | 询盘明细（多型号） | 十万级/年 | Phase 1 |
| `snsii_lead_activity` | 跟进流水 | 十万级/年 | Phase 1 |
| `snsii_lead_attachment` | BOM 与附件 | 万级/年 | Phase 1 |
| `snsii_social_post` | 社媒内容与发布队列 | 万级 | Phase 2 |
| `snsii_social_publish_attempt` | 社媒发布尝试记录（幂等与审计） | 十万级 | Phase 2 |
| `snsii_social_account` | 平台账号与权限引用 | 十级 | Phase 2 |
| `snsii_video_asset` | 视频与商品关联 | 百–千级 | Phase 2 |
| `snsii_utm_link` | UTM 链接登记 | 万级 | Phase 1 |

**建表前置条件**：MySQL 5.6 默认 `innodb_file_format` 可能为 Antelope、`innodb_large_prefix` 可能为 OFF，此时 utf8mb4 下 767 字节键长限制会导致多列唯一键建表失败。执行前须确认 `innodb_file_format=Barracuda`、`innodb_large_prefix=ON`；若无法调整，则 `AttrKey` 降为 `VARCHAR(48)` 并对文本列使用前缀索引。

### 3.3 参数主数据

```sql
CREATE TABLE `snsii_product_attr_dict` (
  `AttrKey`     VARCHAR(64)  NOT NULL,
  `NameEn`      VARCHAR(191) NOT NULL,
  `ValueType`   TINYINT      NOT NULL DEFAULT 0,  -- 0文本 1数值 2枚举 3布尔 4区间
  `UnitDefault` VARCHAR(32)  NOT NULL DEFAULT '',
  `EnumJson`    TEXT         NULL,
  `GroupKey`    VARCHAR(32)  NOT NULL DEFAULT '', -- 电气/机械/热/封装/环境
  `IsKeyParam`  TINYINT(1)   NOT NULL DEFAULT 0,  -- 是否详情页首屏关键参数
  `Status`      TINYINT      NOT NULL DEFAULT 1,  -- 1启用 0停用
  `CreatedAt`   DATETIME     NOT NULL,
  PRIMARY KEY (`AttrKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
```

`GroupKey` 与 `IsKeyParam` 是 v1.1 新增：详情页需要按"电气 / 机械 / 热 / 封装"分组折叠展示，并优先呈现 3–5 个关键参数，而不是把上百条参数平铺。这两个字段直接服务于 Phase 1 的详情页信息架构。

### 3.4 文档三层模型（R01）

#### 3.4.1 为什么必须拆

v1.0 的设计是：

```sql
UNIQUE KEY `uk_pdf_ver` (`PdfId`,`ParserVersion`)
```

而数据事实是"一个 PDF 被约 9.9 个产品共享"。产品 A 与产品 B 同时引用 PDF 123、同一解析器版本时，第二条记录直接违反唯一约束。这不是索引设计技巧问题，而是**三个不同实体被塞进了一张表**：

| 实体 | 回答的问题 | 变化频率 | 数量级 |
|---|---|---|---|
| 文档资产 | 这份 PDF 是什么、存在哪、内容有没有变 | 低 | 56.9 万 |
| 产品文档关联 | 这个产品为什么引用这份文档、适不适用 | 中 | 563 万 |
| 解析运行 | 这份文档被哪个解析器解析过、结果质量如何 | 高 | 60–120 万 |

三者变化频率不同、生命周期不同、审核责任人不同，必须分表。

#### 3.4.2 文档资产表

```sql
CREATE TABLE `snsii_product_document_asset` (
  `DocumentId`   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `PdfId`        INT UNSIGNED    NULL DEFAULT NULL,   -- 老系统 PdfId，仅溯源，不作主键
  `PdfHash`      CHAR(64)        NOT NULL,            -- SHA-256 内容指纹
  `PdfUrl`       VARCHAR(512)    NOT NULL DEFAULT '',
  `Revision`     SMALLINT UNSIGNED NOT NULL DEFAULT 1,-- 同一 PdfId 的内容版本序号
  `DocType`      TINYINT UNSIGNED NOT NULL DEFAULT 0, -- 0未知 1 Datasheet 2 AppNote 3 UserGuide 4 EVM 5 其它
  `DocSubject`   VARCHAR(191)    NOT NULL DEFAULT '', -- 文档主体型号/系列
  `PageCount`    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `FileSize`     INT UNSIGNED    NOT NULL DEFAULT 0,
  `HasTextLayer` TINYINT(1)      NOT NULL DEFAULT 0,
  `StorageKey`   VARCHAR(255)    NOT NULL DEFAULT '', -- 对象存储 key
  `FetchStatus`  TINYINT UNSIGNED NOT NULL DEFAULT 0, -- 0待下载 1已下载 2下载失败 3内容变更
  `ErrorCode`    VARCHAR(64)     NOT NULL DEFAULT '',
  `FirstSeenAt`  DATETIME        NOT NULL,
  `LastCheckedAt` DATETIME       NULL DEFAULT NULL,
  PRIMARY KEY (`DocumentId`),
  UNIQUE KEY `uk_hash` (`PdfHash`),
  KEY `idx_pdfid` (`PdfId`),
  KEY `idx_fetch` (`FetchStatus`),
  KEY `idx_type` (`DocType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
```

要点：

- 唯一键落在 `PdfHash` 上：同一份内容只存一行，跨产品天然复用。
- 同一 `PdfId` 内容变化（源站替换文件）时，`PdfHash` 变化产生新行，`Revision` 递增，旧资产保留，历史证据不断链。
- `DocType`、`DocSubject`、`HasTextLayer` 是后续判定"参数是否适用于本产品"的基础（见 3.5.4）。

#### 3.4.3 产品文档关联表

```sql
CREATE TABLE `snsii_product_document_link` (
  `LinkId`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ProId`         INT UNSIGNED    NOT NULL,
  `DocumentId`    BIGINT UNSIGNED NOT NULL,
  `LinkSource`    TINYINT UNSIGNED NOT NULL DEFAULT 0, -- 0 PdfId推导 1 显式Pdf路径 2 人工
  `DocType`       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `TargetDevice`  VARCHAR(191)    NOT NULL DEFAULT '', -- 适用器件/系列
  `Applicability` TINYINT UNSIGNED NOT NULL DEFAULT 0, -- 0未判定 1本型号 2同系列 3仅参考 4不适用
  `LinkStatus`    TINYINT UNSIGNED NOT NULL DEFAULT 0, -- 0待审核 1已确认 2已排除
  `Confidence`    DECIMAL(4,3)    NOT NULL DEFAULT 0.000,
  `ReviewerId`    INT UNSIGNED    NULL DEFAULT NULL,
  `ReviewedAt`    DATETIME        NULL DEFAULT NULL,
  `CreatedAt`     DATETIME        NOT NULL,
  PRIMARY KEY (`LinkId`),
  UNIQUE KEY `uk_pro_doc` (`ProId`,`DocumentId`),
  KEY `idx_doc` (`DocumentId`),
  KEY `idx_review` (`LinkStatus`),
  KEY `idx_pro_status` (`ProId`,`LinkStatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
```

要点：

- `uk_pro_doc (ProId, DocumentId)`：一个产品对同一份文档只有一条关联，重复引用自动合并，不会因为老数据重复而建表失败。
- `Applicability` 与 `LinkStatus` 分开：**"这个产品引用了这份 PDF"和"这份 PDF 的参数适用于这个产品"是两件事**。前者是事实，后者是判断，判断需要人工或规则确认。
- 一个产品可关联多份文档（Datasheet + Application Note + User Guide），通过 `DocType` 区分，详情页资料下载区按类型分组。

#### 3.4.4 解析运行表

```sql
CREATE TABLE `snsii_document_parse_run` (
  `ParseRunId`     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `DocumentId`     BIGINT UNSIGNED NOT NULL,
  `ParserVersion`  VARCHAR(32)     NOT NULL,
  `SchemaVersion`  VARCHAR(16)     NOT NULL DEFAULT '1',
  `ParseStatus`    TINYINT UNSIGNED NOT NULL DEFAULT 0, -- 0排队 1解析中 2成功 3质量不通过 9失败
  `QualityStatus`  TINYINT UNSIGNED NOT NULL DEFAULT 0, -- 0未评估 1通过 2复核 3拒绝
  `SpecCount`      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `UnmappedCount`  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `ErrorCode`      VARCHAR(64)     NOT NULL DEFAULT '',
  `EvidenceKey`    VARCHAR(255)    NOT NULL DEFAULT '', -- 证据包（截图/中间JSON）存储位置
  `StartedAt`      DATETIME        NULL DEFAULT NULL,
  `FinishedAt`     DATETIME        NULL DEFAULT NULL,
  `CreatedAt`      DATETIME        NOT NULL,
  PRIMARY KEY (`ParseRunId`),
  UNIQUE KEY `uk_doc_ver` (`DocumentId`,`ParserVersion`,`SchemaVersion`),
  KEY `idx_status` (`ParseStatus`),
  KEY `idx_quality` (`QualityStatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
```

要点：

- 唯一键是"文档 + 解析器版本 + schema 版本"，**不含产品**，因此一个 PDF 只解析一次，被 9.9 个产品共享结果，解析成本下降约 90%。
- 解析结果不可变：解析器升级后写新的 `ParseRunId`，旧记录与旧参数全部保留。
- `EvidenceKey` 指向证据包（每页渲染图 + 表格结构 JSON），用于质量审核与用户报错回溯。

#### 3.4.5 三层关系

```
document_asset (56.9万)          1 份文档
      │ 1
      ├──────────────< document_link (563万)  >── product (1009万)
      │                     │ 只描述"引用关系"与"适用性判断"
      │ 1
      └──────────────< document_parse_run (60–120万)
                            │ 1
                            └──────< product_spec (数千万)
                                     每条参数挂在"关联 + 解析运行"上
```

参数记录同时引用 `DocumentId` 与 `ParseRunId`，并携带 `ProId`：这样既能证明"数据来自哪份文档的哪一次解析"，也能证明"这条参数归属于哪个产品"，两者都可独立追溯，不依赖中间表连接推断。

### 3.5 参数值表（R02）

#### 3.5.1 v1.0 的问题

v1.0 的唯一键是 `UNIQUE KEY uk_pro_attr_seq (ProId, AttrKey, Seq)`，一个产品的某个参数序号只能有一条记录。但同一份方案又要求"解析器升级后保留旧结果、对比后切换、用户反馈后单条回滚"——这三件事在"只能有一条"的约束下无法同时成立，upsert 会直接覆盖历史。

| 版本 | 参数值 | 来源 |
|---|---|---|
| parser-v1 | 125℃ | PDF A |
| parser-v2 | 125℃ | PDF A |
| parser-v3 | 150℃ | PDF B |

按 v1.0 的 upsert，v1、v2 的历史值全部丢失，无法回答"这条参数什么时候变的、为什么变"。

#### 3.5.2 新表结构

```sql
CREATE TABLE `snsii_product_spec` (
  `SpecId`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ProId`           INT UNSIGNED    NOT NULL,
  `DocumentId`      BIGINT UNSIGNED NOT NULL,
  `ParseRunId`      BIGINT UNSIGNED NOT NULL,
  `AttrKey`         VARCHAR(64)     NOT NULL,
  `Seq`             TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `RawLabel`        VARCHAR(191)    NOT NULL DEFAULT '',
  `RawValue`        VARCHAR(512)    NOT NULL DEFAULT '',
  `NormalizedValue` VARCHAR(512)    NOT NULL DEFAULT '',
  `ValueNum`        DECIMAL(20,6)   NULL DEFAULT NULL,
  `Unit`            VARCHAR(32)     NOT NULL DEFAULT '',
  `ValueKind`       TINYINT UNSIGNED NOT NULL DEFAULT 0, -- 0未标注 1Min 2Typ 3Max 4AbsMax 5Range
  `Conditions`      VARCHAR(255)    NOT NULL DEFAULT '', -- 测试条件：Ta=25℃ / Vcc=5V
  `PageNo`          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `TableId`         SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `RowId`           SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `CellBBox`        VARCHAR(64)     NOT NULL DEFAULT '', -- "x0,y0,x1,y1" PDF 坐标
  `Confidence`      DECIMAL(4,3)    NOT NULL DEFAULT 0.000,
  `Source`          TINYINT UNSIGNED NOT NULL DEFAULT 0, -- 0 datasheet 1 dataattr 2 manual
  `ReviewStatus`    TINYINT UNSIGNED NOT NULL DEFAULT 0, -- 0待审 1通过 2拒绝 3冲突
  `IsCurrent`       TINYINT(1)      NOT NULL DEFAULT 0,  -- 是否为当前生效版本
  `SupersededBy`    BIGINT UNSIGNED NULL DEFAULT NULL,   -- 被哪条记录取代
  `ReviewerId`      INT UNSIGNED    NULL DEFAULT NULL,
  `ReviewedAt`      DATETIME        NULL DEFAULT NULL,
  `CreatedAt`       DATETIME        NOT NULL,
  PRIMARY KEY (`SpecId`),
  UNIQUE KEY `uk_evidence` (`ParseRunId`,`ProId`,`AttrKey`,`Seq`,`ValueKind`,`TableId`,`RowId`),
  KEY `idx_current` (`ProId`,`AttrKey`,`IsCurrent`,`ReviewStatus`),
  KEY `idx_attr_value` (`AttrKey`,`NormalizedValue`(64)),
  KEY `idx_doc` (`DocumentId`),
  KEY `idx_review` (`ReviewStatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
```

#### 3.5.3 关键字段说明

| 字段 | 为什么必须有 |
|---|---|
| `DocumentId` | 参数来自哪份文档。缺它就无法证明参数属于 Datasheet 还是应用笔记 |
| `ParseRunId` | 参数来自哪一次解析。缺它无法做版本对比与回滚 |
| `ValueKind` | 区分 Min / Typ / Max / Absolute Maximum。同一参数名在"推荐工作条件"和"极限参数"里含义完全不同 |
| `Conditions` | 测试条件（温度、电压、负载）。缺条件的参数在工程选型中不可用 |
| `CellBBox` | PDF 中的坐标证据，用于人工复核与用户报错定位 |
| `RawLabel` / `RawValue` | 保留原文，避免归一化引入不可逆的信息损失 |
| `ReviewStatus` | 区分待审 / 通过 / 拒绝 / 冲突，发布只认"通过" |
| `IsCurrent` | 当前生效版本标记，替代 v1.0 的覆盖式 upsert |
| `SupersededBy` | 版本链路，可回答"这条为什么被替换" |

#### 3.5.4 文档类型与适用性判定（证据不等于归属）

`CellBBox` 只能证明"这个数字出现在 PDF 的这一页这一格"，不能证明"这个参数适用于当前产品"。必须叠加三个判断：

| 判断 | 依据 | 不满足时的处理 |
|---|---|---|
| 文档类型是否匹配 | `DocType` 必须为 Datasheet 或同型号 UserGuide | Application Note / EVM 文档的参数降级为"参考值"，不进 `additionalProperty` |
| 文档主体是否匹配 | `DocSubject` 与产品型号/系列一致 | 记为 `Applicability=2/3`，需人工确认 |
| 关联是否已确认 | `LinkStatus=1` | 关联未确认时参数不发布 |

典型反例：

- 芯片 Datasheet 的热阻参数 → 可用于该芯片；
- EVM 评估板 User Guide 的热参数 → 属于评估板，不属于芯片；
- 应用笔记中的"推荐工作条件" → 属于参考设计，不等于器件极限值。

v1.0 把三类数据混在一张参数表里，会在详情页产生"参数正确但归属错误"的问题，这类错误比解析失败更难被发现，也更伤客户信任。

#### 3.5.5 版本升级与发布

```
新解析器上线
   ↓
对同一 DocumentId 产生新 ParseRunId
   ↓
写入新参数记录（IsCurrent=0，ReviewStatus=0）
   ↓
与 IsCurrent=1 的旧记录做差异对比（新增/变更/消失）
   ↓
差异抽样审核 + 质量门
   ↓
通过：新记录置 IsCurrent=1，旧记录置 IsCurrent=0、SupersededBy=新SpecId
不通过：新记录保持 IsCurrent=0，不影响线上
```

运行时只读 `IsCurrent=1 AND ReviewStatus=1`，用一条覆盖索引 `idx_current` 支撑，**不做按版本取 MAX 的子查询**——MySQL 5.6 无窗口函数，子查询在千万级表上不可接受。

单条回滚（用户报错场景）：

```
用户报错 -> 定位 ProId + AttrKey
        -> 查 SpecId / DocumentId / PageNo / CellBBox
        -> 若为解析错误：该 SpecId 置 ReviewStatus=2，回退到上一条 IsCurrent 记录
        -> 若为关联错误：document_link 置 LinkStatus=2，该文档产生的参数全部失效
        -> 修正规则或关联后重新解析，产生新 ParseRunId
```

### 3.6 参数名五语种

```sql
CREATE TABLE `snsii_product_spec_i18n` (
  `AttrKey` VARCHAR(64)  NOT NULL,
  `Lang`    CHAR(5)      NOT NULL,  -- en/ja/de/es/id
  `Name`    VARCHAR(191) NOT NULL,
  `Status`  TINYINT      NOT NULL DEFAULT 0, -- 0待审 1已发布
  PRIMARY KEY (`AttrKey`,`Lang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
```

**兼容策略**：发布时同步写入现有 `messages/{lang}/attr.php`，老页面无需改动；新页面优先读新表，读不到回落词库；词库再未命中时**显示英文原名而不是 md5**（修复 T5）。

### 3.7 新版详情缓存

```sql
CREATE TABLE `snsii_product_cache_v2` (
  `ProId`     INT UNSIGNED NOT NULL,
  `Version`   VARCHAR(16)  NOT NULL,   -- 缓存结构版本，用于整体失效
  `Json`      LONGTEXT     NOT NULL,   -- 页面渲染数据（含参数分组）
  `JsonLd`    MEDIUMTEXT   NULL,       -- 预生成结构化数据
  `SpecCount` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `HasLeadCta` TINYINT(1)  NOT NULL DEFAULT 1,
  `BuiltAt`   DATETIME     NOT NULL,
  PRIMARY KEY (`ProId`),
  KEY `idx_built` (`BuiltAt`),
  KEY `idx_version` (`Version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
```

- 读取：一次主键查询，拿到页面数据与 JSON-LD，运行时零解析。
- 体积：预计与旧表同量级（30GB 左右）；`ROW_FORMAT=COMPRESSED` 可降低磁盘占用，代价是 CPU，需在 staging 实测后再决定。
- `Version` 用于缓存结构升级时整体失效，避免新旧 JSON 结构混读导致模板报错。

### 3.8 缓存切换与回滚（R03）

#### 3.8.1 v1.0 的问题

v1.0 把 `RENAME TABLE` 当作"秒级、无风险"的切换手段。元数据切换确实很快，但**这不代表前后的数据构建、校验和业务兼容也很快**。以下七个问题 v1.0 没有回答：

1. 新表结构是否完全兼容旧代码的读取逻辑？
2. 旧代码是否仍直接依赖 `snsii_product_cache` 的字段结构？
3. 10,093,684 条记录是否全部生成成功？
4. 是否存在缺失、重复、JSON 格式异常？
5. 新表索引与旧表索引是否一致？
6. PHP-FPM 多进程在切换瞬间是否会读到不同版本？
7. 反向换名是否已在 staging 实际演练？

其中第 6 条尤其危险：`RENAME` 瞬间，已经打开旧表句柄的进程仍读旧表，新请求读新表，页面会出现同一商品两种内容。对 SEO 抓取与客户体验都是负面影响。

#### 3.8.2 本版方案：应用层双读优先

```
旧缓存继续提供服务（cache_read_mode=legacy）
        ↓
离线生成新缓存（全量，可分批）
        ↓
数据完整性检查（按 3.8.4 清单逐项核对）
        ↓
代码支持双读（cache_read_mode=dual，cache_v2_pct 从 1% 起）
        ↓
按 ProId 取模灰度：ProId % 100 < pct 读新缓存，其余读旧缓存
        ↓
观察业务指标与错误率（每级 ≥ 72 小时）
        ↓
pct 提升至 100，稳定 14 天
        ↓
（可选）最终收敛：RENAME 或保留双表由配置决定
```

要点：

- **切换粒度是商品，不是进程**。同一商品在同一时刻只有一个读取来源，避免同一 URL 返回两种内容。
- 灰度用 `ProId % 100` 取模，与 PHP-FPM 进程数无关，天然一致。
- 回滚只需把 `cache_v2_pct` 调回 0，秒级生效，不涉及 DDL。
- `RENAME` 从"上线切换手段"降级为"运行 14 天后的表名收敛动作"，且必须在 staging 演练过一次反向换名。

#### 3.8.3 空间核算

| 项 | 估算 | 说明 |
|---|---:|---|
| 旧缓存 `snsii_product_cache` | 31.7GB | 现状 |
| 新缓存数据 | 30–36GB | 含参数分组 JSON，需 V4 实测 |
| 新缓存索引 + JSON-LD | 4–6GB | 主键 + BuiltAt + JsonLd 列 |
| 迁移临时文件 | 4–8GB | 排序/导出临时表 |
| binlog 增量 | 6–10GB | 迁移期间写入放大 |
| 切换期备份 | 30–35GB | 切换前快照 |
| 离线产物落地 | 5–10GB | PDF/证据包临时文件 |
| 安全余量（≥ 15%） | 18–22GB | 预留其他业务增长 |
| **合计** | **约 100–128GB** | 当前可用 199GB |

结论：**空间满足，但余量并不宽裕**。因此规定：迁移期间冻结其他离线产物落地本盘；迁移完成后 30 天内不启动大规模索引重建；磁盘使用率超过 80% 时暂停一切离线任务。

#### 3.8.4 切换前置检查清单（12 项）

| # | 检查项 | 通过标准 |
|---|---|---|
| 1 | 新表行数 | 与源表差异 = 0 |
| 2 | 主键完整性 | 无重复 ProId |
| 3 | JSON 可解析率 | 100%（抽样 10 万条） |
| 4 | 关键字段非空 | `Json`、`Version`、`BuiltAt` 无空值 |
| 5 | 抽样逐字段比对 | 1,000 条，旧 JSON 与新 JSON 渲染结果一致 |
| 6 | 索引一致性 | 主键、BuiltAt 索引存在且可用 |
| 7 | 旧代码兼容性 | 双读分支单元测试通过，未读新表时行为不变 |
| 8 | 首字节耗时 | 新表读取 P95 ≤ 旧表 P95 + 20ms |
| 9 | 反向回滚 | staging 已演练，回滚 ≤ 1 分钟 |
| 10 | 业务抽样 | 200 个真实 URL 页面内容人工核对 |
| 11 | 错误监控 | 详情页 5xx 与"内容为空"告警已配置 |
| 12 | 数据快照 | 切换前完成一次可恢复快照并验证可读 |

### 3.9 老 URL 映射与状态策略

```sql
CREATE TABLE `snsii_legacy_url_map` (
  `Id8`     CHAR(8)      NOT NULL,
  `PartUrl` VARCHAR(191) NOT NULL,
  `ProId`   INT UNSIGNED NOT NULL,
  `Status`  TINYINT      NOT NULL DEFAULT 1, -- 1在售 2隐藏 3停产 4删除
  PRIMARY KEY (`Id8`),
  KEY `idx_parturl` (`PartUrl`(64)),
  KEY `idx_status` (`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;

CREATE TABLE `snsii_url_policy` (
  `PathHash`  CHAR(64)     NOT NULL,   -- md5(规范化路径)，避免长索引
  `Path`      VARCHAR(512) NOT NULL,
  `StatusCode` SMALLINT    NOT NULL,   -- 301 / 410
  `TargetPath` VARCHAR(512) NOT NULL DEFAULT '',
  `Reason`    VARCHAR(64)  NOT NULL DEFAULT '',
  `OperatorId` INT UNSIGNED NULL DEFAULT NULL,
  `CreatedAt` DATETIME     NOT NULL,
  PRIMARY KEY (`PathHash`),
  KEY `idx_code` (`StatusCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
```

用途：301 目标解析、sitemap 生成、URL 回归抽样、外部链接兼容、显式 410 登记。`snsii_url_policy` 的存在使"永久删除返回 410"成为可执行动作，而不是靠代码里写死规则。

### 3.10 迁移策略

| 阶段 | 对象 | 方式 | 停机 | 所属阶段 |
|---|---|---|---|---|
| D1 | 小表（购物车、联系） | InnoDB 转换 | 秒级 | Phase 1 |
| D2 | 新表（询盘、URL、缓存 v2） | 直接创建 | 无 | Phase 1 |
| D3 | `snsii_product_cache_v2` | 分批灌入 + 应用层双读 | 无 | Phase 1 |
| D4 | `snsii_legacy_url_map` | 分批导出 | 无 | Phase 1 |
| D5 | 文档三层表 + 参数表 | 直接创建，按批导入 | 无 | Phase 3 |
| D6 | 主表 | **本期不动** | — | — |

执行要求：

- 每批 5–10 万行，批间限速；记录断点表，可中断续跑。
- 修改前必须有可恢复快照，并在 staging 演练。
- 切换后校验：行数、抽样 1,000 行逐字段、核心页面、查询延迟。
- 全程只读源表，写入只进新表。
- 所有离线任务在独立磁盘路径运行，产物不得落在系统盘。

---
## 4. 产品详情页改造（Phase 1 核心）

### 4.1 为什么单列一章

详情页是"外链 → 落地 → 询盘"链路的唯一收口，也是本轮升级中业务价值最直接的部分。v1.0 把前端改造放在 M5，排在参数化之后，实际会让"数据能力"先于"获客能力"上线，与甲方方向相反。本版把详情页提到 Phase 1，并明确它不依赖 Ds Bit 参数化：**没有新参数表，详情页同样可以用现有 `DataAttr` 完成改版与询盘接入**。

### 4.2 页面信息架构

自上而下：

| 区块 | 内容 | 数据来源 | 降级策略 |
|---|---|---|---|
| 面包屑 | 分类路径 | `snsii_product_category` | 缺失时只显示首页 + 产品 |
| 首屏信息 | 型号、品牌、主图、关键参数 3–5 条、库存/交期、CTA | 主表 + `attr_dict.IsKeyParam` | 无参数时显示封装/安装方式 |
| 主 CTA | Request a Quote / Add to Inquiry Cart | 表单 | 开关关闭时回退邮件链接 |
| 资料下载 | Datasheet / AppNote / UserGuide 分组 | `document_link` | Phase 1 用现有 `Pdf` 字段 |
| 完整参数 | 按电气/机械/热/封装/环境分组折叠 | `product_spec` 或 `DataAttr` | 回落 `DataAttr`，再回落隐藏 |
| 替代与相关 | 同系列、同封装、交叉参考 | 规则查询 | 无结果时不显示该区块 |
| 信任区 | 认证、质保、发货、响应时效 | 静态配置 | 常显 |
| 询盘表单 | 数量、邮箱、需求、附件 | 表单 | 常显 |

设计原则：**首屏必须能完成"确认型号 → 看到关键参数 → 发起询盘"三件事**，不让用户滚动三屏才找到询盘入口。

### 4.3 参数渲染与降级链

```
新参数表 published（spec_enabled=on 且该商品有数据）
    ↓ 无数据
DataAttr JSON（现有）
    ↓ 无数据
按分类模板显示"该型号资料待补充"+ 询盘 CTA
```

- 参数名翻译三级回落：`spec_i18n` → `messages/{lang}/attr.php` → 英文原名。**任何情况下不得输出 md5**（修复 T5）。
- 参数值必须带单位；无单位数值不加单位，不猜测。
- `ValueKind` 为 Min/Max 时显示为范围形式（如 `-40℃ ~ +125℃`），不并列显示两条互斥记录。

### 4.4 图片与资料资产修复

`ImgId` 映射的图片资源当前不可用（T10），直接影响详情页转化与社媒分享卡片。处置：

| 项 | 动作 |
|---|---|
| 图片可用性盘点 | 抽样 5,000 个商品，统计主图可访问率 |
| 缺失处理 | 生成品牌/分类占位图，禁止破图 |
| 尺寸规范 | 主图 ≥ 800×800，输出 webp + jpg 兜底 |
| 外链与 CDN | 图片走 CDN，带长缓存与版本参数 |
| 分享卡片 | 每页输出 `og:image`，指向可访问 URL |

### 4.5 询盘 CTA 布局

| 位置 | 形式 | 说明 |
|---|---|---|
| 首屏右侧 | 主按钮 Request a Quote | 最高权重，移动端吸底 |
| 首屏参数下方 | 次级按钮 Add to Inquiry Cart | 多型号收集 |
| 资料下载区 | "需要完整规格书？" | 引导留邮箱 |
| 页面底部 | 完整表单 | 长表单，含数量与附件 |
| 分类/搜索结果 | 行内询价按钮 | Phase 2 接入 |

要求：所有 CTA 使用同一套埋点事件名，便于漏斗统计（见 5.6）。

### 4.6 替代型号（规则版）

Phase 1 只做**规则版**，不做智能匹配：

- 同系列（型号前缀相同）+ 同封装 + 在售，按库存排序取 3–6 条。
- 停产商品页面显示"推荐替代"，数据来自人工维护的映射表或同系列规则。
- 明确标注"推荐替代，需工程师确认"，不承诺电气等价。

智能交叉参考与替代料匹配放 Phase 4（见第 10 章）。

### 4.7 移动端与性能

| 项 | 目标 |
|---|---|
| 移动端首屏可交互 | ≤ 2.5s（4G） |
| 详情页 TTFB | < 300ms |
| LCP | < 1.8s |
| CLS | < 0.1 |
| 询盘表单可用性 | 单列、输入类型正确、可粘贴型号列表 |

### 4.8 模板改造点

| 文件 | 改动 |
|---|---|
| `views/pro/item.php` | 重构信息架构，插入 CTA 与参数分组 |
| `views/layouts/*` | 增加 canonical/hreflang 占位、og 标签、JSON-LD 挂载点 |
| `ProController::actionItem` | 读缓存 v2 → 回落旧缓存；输出 200/404/410 正确状态码 |
| 新增 `components/ProductViewBuilder` | 组装参数分组、资料列表、替代型号、CTA 配置 |
| 新增 `components/LeadFormWidget` | 表单渲染、字段校验、CSRF、埋点 |

### 4.9 详情页验收清单

| # | 项 | 标准 |
|---|---|---|
| 1 | 首屏含 CTA | 桌面与移动端均可见 |
| 2 | 关键参数 | 有数据的商品 100% 展示 ≥ 3 条 |
| 3 | 参数无 md5 | 抽样 1,000 页，0 例 |
| 4 | 资料下载 | 有 PDF 的商品可下载，链接不 404 |
| 5 | 图片 | 抽样 500 页无破图 |
| 6 | 状态码 | 不存在商品 404/410，不再返回 200 |
| 7 | 询盘提交 | 单型号/多型号/带附件均成功入库 |
| 8 | 移动端 | 表单可提交，无横向滚动 |
| 9 | 结构化数据 | 富媒体测试 0 错误（开关打开后） |
| 10 | 性能 | TTFB/LCP 达标 |

---

## 5. 询盘转化与归因（Phase 1 核心）

### 5.1 现状问题

当前询盘只存在于邮件与询价车里：没有询盘编号、没有来源记录、没有跟进状态、没有渠道归因。这意味着即使流量增长，也无法回答"哪个渠道带来了有效询盘"。对一个以询盘为最终目标的站点，这是比搜索不准更严重的缺项。

### 5.2 转化流程

```
客户进入产品详情页（落地页记录）
        ↓
查看参数 / Datasheet / 图片（行为埋点）
        ↓
点击 Request a Quote
        ↓
填写数量、邮箱、需求（可多型号、可传 BOM）
        ↓
前端生成 RequestId（UUID）并提交
        ↓
服务端校验 + 幂等 + 反垃圾评分
        ↓
写入 snsii_lead + snsii_lead_item + snsii_lead_activity
        ↓
生成 LeadNo（对客编号）
        ↓
通知销售（邮件/后台），记录通知结果
        ↓
GA4 服务端回传 generate_lead（可失败，不影响入库）
        ↓
销售跟进：新建 → 跟进中 → 已报价 → 成交 / 无效
```

### 5.3 询盘数据模型

```sql
CREATE TABLE `snsii_lead` (
  `LeadId`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `LeadNo`        CHAR(20)        NOT NULL,          -- 对客编号 LK20261115xxxx
  `RequestId`     CHAR(36)        NOT NULL,          -- 前端 UUID，幂等键
  `Email`         VARCHAR(191)    NOT NULL,
  `ContactName`   VARCHAR(128)    NOT NULL DEFAULT '',
  `Company`       VARCHAR(191)    NOT NULL DEFAULT '',
  `Country`       CHAR(2)         NOT NULL DEFAULT '',
  `Phone`         VARCHAR(64)     NOT NULL DEFAULT '',
  `Message`       TEXT            NULL,
  `QuantityTotal` INT UNSIGNED    NOT NULL DEFAULT 0,
  `Source`        VARCHAR(32)     NOT NULL DEFAULT '', -- product/bom/cart/search
  `LandingPage`   VARCHAR(512)    NOT NULL DEFAULT '',
  `Referrer`      VARCHAR(512)    NOT NULL DEFAULT '',
  `UtmSource`     VARCHAR(128)    NOT NULL DEFAULT '',
  `UtmMedium`     VARCHAR(128)    NOT NULL DEFAULT '',
  `UtmCampaign`   VARCHAR(128)    NOT NULL DEFAULT '',
  `UtmContent`    VARCHAR(128)    NOT NULL DEFAULT '',
  `UtmTerm`       VARCHAR(128)    NOT NULL DEFAULT '',
  `FirstTouchJson` TEXT           NULL,              -- 首次触点（落地页/UTM/时间）
  `ClientId`      VARCHAR(64)     NOT NULL DEFAULT '',-- GA4 client_id，需同意
  `ConsentStatus` TINYINT         NOT NULL DEFAULT 0, -- 0未采集 1已同意 2拒绝
  `SpamScore`     DECIMAL(4,3)    NOT NULL DEFAULT 0.000,
  `Status`        TINYINT         NOT NULL DEFAULT 0, -- 0新建 1已通知 2跟进中 3已报价 4成交 5无效 9垃圾
  `AssignedTo`    INT UNSIGNED    NULL DEFAULT NULL,
  `NotifyStatus`  TINYINT         NOT NULL DEFAULT 0, -- 0未发 1成功 2失败
  `NotifyError`   VARCHAR(255)    NOT NULL DEFAULT '',
  `GaSent`        TINYINT         NOT NULL DEFAULT 0,
  `IpHash`        CHAR(64)        NOT NULL DEFAULT '',
  `UserAgent`     VARCHAR(255)    NOT NULL DEFAULT '',
  `CreatedAt`     DATETIME        NOT NULL,
  `UpdatedAt`     DATETIME        NOT NULL,
  PRIMARY KEY (`LeadId`),
  UNIQUE KEY `uk_request` (`RequestId`),
  UNIQUE KEY `uk_leadno` (`LeadNo`),
  KEY `idx_status_time` (`Status`,`CreatedAt`),
  KEY `idx_email` (`Email`),
  KEY `idx_utm` (`UtmSource`,`UtmCampaign`),
  KEY `idx_assigned` (`AssignedTo`,`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
```

```sql
CREATE TABLE `snsii_lead_item` (
  `ItemId`     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `LeadId`     BIGINT UNSIGNED NOT NULL,
  `ProId`      INT UNSIGNED    NULL DEFAULT NULL,
  `PartNumber` VARCHAR(191)    NOT NULL,
  `Quantity`   INT UNSIGNED    NOT NULL DEFAULT 0,
  `TargetPrice` DECIMAL(12,4)  NULL DEFAULT NULL,
  `MatchStatus` TINYINT        NOT NULL DEFAULT 0, -- 0未匹配 1精确 2模糊 3无匹配
  `Remark`     VARCHAR(255)    NOT NULL DEFAULT '',
  PRIMARY KEY (`ItemId`),
  KEY `idx_lead` (`LeadId`),
  KEY `idx_part` (`PartNumber`(64)),
  KEY `idx_pro` (`ProId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;

CREATE TABLE `snsii_lead_activity` (
  `ActivityId` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `LeadId`     BIGINT UNSIGNED NOT NULL,
  `ActorId`    INT UNSIGNED    NULL DEFAULT NULL,
  `Action`     VARCHAR(32)     NOT NULL, -- created/notified/assigned/quoted/won/lost/note
  `Payload`    TEXT            NULL,
  `CreatedAt`  DATETIME        NOT NULL,
  PRIMARY KEY (`ActivityId`),
  KEY `idx_lead_time` (`LeadId`,`CreatedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;

CREATE TABLE `snsii_lead_attachment` (
  `AttachmentId` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `LeadId`       BIGINT UNSIGNED NOT NULL,
  `FileName`     VARCHAR(255)    NOT NULL,
  `FileSize`     INT UNSIGNED    NOT NULL DEFAULT 0,
  `MimeType`     VARCHAR(64)     NOT NULL DEFAULT '',
  `StorageKey`   VARCHAR(255)    NOT NULL,
  `ScanStatus`   TINYINT         NOT NULL DEFAULT 0, -- 0待检 1通过 2拒绝
  `CreatedAt`    DATETIME        NOT NULL,
  PRIMARY KEY (`AttachmentId`),
  KEY `idx_lead` (`LeadId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
```

设计说明：

- **询盘主数据存在 morrishk 自己的库里，GA4 只是统计系统**，不是询盘数据的唯一存储。即使 GA4 全部失败，销售仍然拿到完整线索。
- `RequestId` 是幂等键：网络重试、用户连点、浏览器回退再提交，都只会产生一条询盘。
- `LeadNo` 是对客编号，出现在自动回复邮件与后台，便于电话/邮件沟通时引用。
- `FirstTouchJson` 保留首次触点，主表字段保留末次触点，支持首末归因对比。
- `IpHash` 只存哈希，用于反垃圾与限频，不存明文 IP。
- `NotifyStatus` / `GaSent` 独立记录，使"通知失败""回传失败"可被监控与补发，而不是静默丢失。

### 5.4 表单规则

| 字段 | 必填 | 规则 |
|---|---|---|
| Email | 是 | 格式校验 + 一次性邮箱域名黑名单 |
| 型号 | 是 | 支持多行粘贴，按行/逗号/制表符拆分，上限 50 条 |
| 数量 | 否 | 数字，> 0，上限 1e9 |
| 需求描述 | 否 | 2,000 字上限，去 HTML |
| 附件 | 否 | pdf/xls/xlsx/csv/doc/docx，单文件 ≤ 10MB，合计 ≤ 3 个 |
| 公司/姓名/电话 | 否 | 长度限制 |
| 验证码 | 条件 | 触发风控时启用（见 5.5） |

交互要求：提交成功后展示 `LeadNo` 与"我们将在 X 小时内回复"；失败时保留表单内容，不清空。

### 5.5 反垃圾与幂等

| 机制 | 规则 |
|---|---|
| 幂等 | `RequestId` 唯一键；重复提交返回已有 `LeadNo`，不新建 |
| 重复内容 | 同邮箱 + 同型号集合 + 30 分钟内 → 合并为一条，`DuplicateOf` 记录 |
| 频率限制 | 单 IP 10 分钟 3 次、24 小时 20 次；超限返回提示不落库 |
| 蜜罐字段 | 隐藏字段被填写即判定为机器人 |
| 内容评分 | 关键词、链接数、字符分布、提交耗时 → `SpamScore`，> 0.8 进垃圾队列不通知销售 |
| 附件 | 类型白名单 + 病毒扫描 + 存储隔离 |
| 风控升级 | 同 IP 段异常时启用验证码 |

### 5.6 归因与 GA4（R09）

#### 5.6.1 v1.0 的错误结论

v1.0 写"前端事件与后端事件使用同一 `client_id`，保证去重"。这个结论不成立：相同 `client_id` 只表示同一浏览器实例，GA4 **不会**因为 `client_id` 相同就把两个独立的 `generate_lead` 事件合并。结果是询盘数被重复计算。

#### 5.6.2 本版规则

| 规则 | 内容 |
|---|---|
| 唯一正式事件源 | **后端**。服务端 Measurement Protocol 是唯一计入转化的事件来源 |
| 前端事件 | 只发 `quote_form_view`、`quote_form_start`、`quote_submit_intent` 等过程事件，不发 `generate_lead` |
| 幂等键 | `LeadNo` 写入事件参数 `event_id`（同时写 `lead_no`），报表侧按 `lead_no` 去重 |
| `client_id` | 仅用于会话归因与用户路径拼接，**不作为幂等依据** |
| 发送失败 | 只记 `GaSent=0` 与错误日志，进补发队列；**不影响询盘入库与通知** |
| 补发 | 每小时重试，最多 3 次，仍失败标记人工 |
| 时间参数 | 显式传 `timestamp_micros`，避免补发时时间错位 |

#### 5.6.3 隐私与同意

- 不向 GA4 传邮箱、电话、公司名、姓名、IP、User-Agent 原文。
- `ConsentStatus` 为 2（拒绝）时：不发服务端事件，也不写 `ClientId`，只保留 UTM 与落地页（属于聚合统计范畴）。
- GA4 侧开启 IP 匿名化与数据保留期限设置；Measurement Protocol 会自动带上请求来源 IP，需在 GA4 后台配置排除规则。
- 询盘表中的个人信息访问需权限控制与审计日志（见 5.8）。

#### 5.6.4 UTM 与渠道规范

```
utm_source   = linkedin | reddit | x | facebook | youtube | google | email
utm_medium   = social | video | cpc | organic | email
utm_campaign = {yyyyMM}_{theme}
utm_content  = {ProId | post_id}
utm_term     = {keyword}
```

- 生成器统一封装，禁止手工拼接。
- 落地页写入 `FirstTouchJson`（仅首次），后续页面访问不覆盖。
- 站内链接跳转保留 UTM 到提交环节，避免"点进详情页后归因丢失"。

### 5.7 通知与销售跟进

| 环节 | 要求 |
|---|---|
| 通知渠道 | 邮件（主）+ 后台待办（辅） |
| 通知内容 | LeadNo、型号清单、数量、邮箱、来源渠道、落地页 |
| 送达监控 | `NotifyStatus=2` 连续 3 次触发告警；每日汇总邮件 |
| 响应时效 | 目标 24 小时内首次回复，超时在后台标红 |
| 跟进记录 | 每次沟通写 `lead_activity`，状态变更留痕 |
| 分配 | 按国家/产品线规则自动分配，可手工改派 |
| 导出 | 支持按时间段/渠道/状态导出 CSV，用于周报 |

### 5.8 数据保留与权限

| 项 | 规则 |
|---|---|
| 保留周期 | 询盘主数据保留 36 个月；`lead_activity` 保留 36 个月；附件保留 12 个月 |
| 到期处理 | 到期归档到冷存储，主库删除或匿名化 |
| 访问权限 | 销售看自己名下；主管看全部；导出需二次确认并记审计 |
| 敏感字段 | 邮箱/电话在列表页脱敏显示，详情页可展开并记日志 |
| 删除请求 | 支持按邮箱删除个人信息，保留统计所需的匿名化记录 |

### 5.9 业务验收指标（Phase 1 门槛）

| # | 验收项 | 标准 |
|---|---|---|
| 1 | 详情页询盘按钮 | 桌面/移动端均可用，点击有埋点 |
| 2 | 移动端表单 | 可提交，字段校验正确 |
| 3 | 多型号询盘 | 一次提交 ≥ 3 个型号，明细完整入库 |
| 4 | BOM 上传 | 文件可上传、可下载、可扫描 |
| 5 | 询盘入库可靠性 | 100 次提交 100 条入库，0 丢失 |
| 6 | 销售通知 | 100% 收到，失败可告警 |
| 7 | UTM 保留 | 从落地到提交，UTM 完整写入 |
| 8 | 重复提交 | 同一 `RequestId` 重试 10 次只产生 1 条 |
| 9 | GA4 一致性 | 按 5.9.1 定义的两项独立指标分别验收：发送链路 ≤ 2%，端到端报表 ≤ 5% |
| 10 | 转化基线 | 上线 4 周后产出"渠道 → 询盘"报表 |

#### 5.9.1 GA4 对账口径（P0-02 修订 · rev.3）

v1.2 存在口径冲突：5.9 写「服务端事件数与询盘表条数差异 ≤ 2%」，追踪矩阵 C04 写「库内与 GA4 差异 ≤ 5%」。
两者量的不是同一件事，因此拆为两项独立指标。**rev.3 进一步修正两处逻辑缺口**：

1. 不能把 HTTP 2xx 等同于「GA4 已正确接收并处理事件」；
2. 指标 B 的排除项必须从**分母同步剔除**，否则差异率天然不为零、阈值无法解释。

##### 一、GA4 链路的三个状态（不可合并）

| 状态 | 含义 | 可观测证据 | 边界 |
|---|---|---|---|
| **S1 请求送达** | 后端调用 Measurement Protocol 收到 HTTP 2xx | 后端请求日志 | 仅证明网络层送达，**不代表事件被接受** |
| **S2 事件通过校验** | GA4 接收并完成参数与协议校验 | MP validation 响应、DebugView | 证明格式合法，仍不代表进入报表 |
| **S3 进入报表** | 事件在 GA4 报表中按 `lead_no` 去重后可查 | GA4 探索报表 | 端到端可见，受处理延迟与 consent 影响 |

> **表述纪律**：S1 达成不得写成「GA4 发送成功」。对外只能表述为「请求已送达」。
> 只有 S3 达成才可称「GA4 可见」。

##### 二、指标 A：发送链路完整性（S1 层）

| 项 | 定义 |
|---|---|
| 分母 | 合格询盘集合（定义见第四节） |
| 分子 | S1 成功的唯一 `lead_no` 数 |
| 阈值 | \|分子 − 分母\| ÷ 分母 ≤ **2%** |
| 窗口 | 提交后 T+1 小时 |
| 重试处理 | 重试窗口内（默认 3 次）的中间失败不计入分子，也不从分母剔除 |
| 附加要求 | S2 通过率 ≥ 99%；未通过事件须逐条列出原因 |

##### 三、指标 B：端到端可见性（S3 层）

**关键修正**：分子与分母必须取自**同一合格集合**，排除项从分母同步剔除，排除率单独报告。

每个对账窗口须同时产出以下七个数：

| # | 口径 | 定义 |
|---|---|---|
| ① | 总询盘数 | `snsii_lead` 按 `RequestId` 去重后的记录数 |
| ② | 可归因询盘数 | 有 `lead_no` 且 UTM / 落地页可解析 |
| ③ | **合格询盘数（指标 B 分母）** | ② 中排除 consent 拒绝与 MP 最终失败后的集合 |
| ④ | consent 拒绝数 | 用户拒绝统计同意 |
| ⑤ | MP 最终失败数 | 重试耗尽仍非 2xx，或 S2 未通过 |
| ⑥ | **GA4 报表可见数（指标 B 分子）** | 报表中 `generate_lead` 按 `lead_no` 去重后的计数 |
| ⑦ | 反向无法匹配数 | 报表有、库内无对应 `lead_no` 的记录 |

- 指标 B 差异率 = \|⑥ − ③\| ÷ ③ ≤ **5%**
- 排除率 = (④ + ⑤) ÷ ①，**单独报告**；排除率 > 3% 视为异常，须归因
- 窗口：提交后 T+3 日（覆盖 GA4 数据处理延迟）
- ⑦ 不并入差异率，但须逐条解释来源

> 上一版把 ④⑤ 只从分子排除、分母仍用全部询盘，导致「所有合格询盘都正确进入报表」时
> 分子分母仍不相等。本版已修正：**分母换成 ③，排除项在 ③ 之前就被剔除**。

##### 四、合格询盘集合的定义

同时满足以下条件的记录计入 ③：

1. `RequestId` 去重后保留首条；
2. `lead_no` 非空且格式合法；
3. 非测试单（`is_test = 1` 或内部 IP 提交）；
4. 非后台手工补录（`source = 'manual'`）；
5. 提交时间落在对账窗口内。

##### 五、仍未验证的前提（保持 OPEN）

GA4 报表侧无法直接按业务主键去重，须通过自定义维度 `lead_no` 上报，并在探索报表中按该维度去重计数。
**该能力尚未实测**，因此：

- 指标 B 在验证前不具备验收条件，只能标记 `NOT VERIFIABLE`；
- 指标 A 不依赖 `lead_no` 报表去重，可在 Phase 1 先行验收。

**口径纪律**：GA4 报表中的事件数不作为询盘库的真值，只作对照。不一致时以库内记录为准，
差异须逐条可解释（附对账表）。

### 5.10 故障降级与线索不丢失（S04）

v1.1 在 12.5 写的是"关闭 `lead_enabled` 并保留邮件入口"。这有静默丢线索的风险：关闭后如果表单只发邮件、不写库，询盘就脱离了统一跟进与归因体系，等于把最贵的资产退回到 Excel 和邮箱里。

本版改为**按故障面分级降级**，并明确一条底线：**任何一级都不允许把"只发邮件、不入库"作为可接受的长期状态。**

#### 5.10.1 四级降级

| 级别 | 故障面 | 系统行为 | 用户可见 | 线索去向 |
|---|---|---|---|---|
| L0 | 无故障 | 入库 + 通知 + GA4 回传 | 提交成功，显示 LeadNo | 库 |
| L1 | 通知服务异常 | 照常入库，`NotifyStatus=2`，后台待办可见，自动重试 | 提交成功 | 库（+后台待办） |
| L2 | GA4 异常 | 照常入库与通知，`GaSent=0`，进补发队列 | 无感知 | 库 |
| L3 | 数据库写入异常 | 先写本地 spool 并 `fsync`，再异步重放入库；返回"已收到，编号稍后确认" | 提交成功（带临时编号） | spool → 库 |
| L4 | 应用整体不可用 | 静态降级页 + 备用入口（邮件 / 第三方表单），页面明确说明 | 明确告知走备用渠道 | 备用渠道 → 人工补录 |

#### 5.10.2 spool 暂存机制

- 写入顺序：**先落 spool（追加写 + `fsync`），再写库**；写库成功后标记该条完成。
- spool 按小时切分文件，保留 72 小时；重放任务每 5 分钟扫描一次。
- 重放以 `RequestId` 去重，重复重放不产生重复询盘。
- spool 目录独立于 `runtime`，磁盘配额 1GB，超限告警；写满时**明确报错**，不静默丢弃。
- 对账口径：提交数 = 入库数 + spool 待重放数 + 明确失败数，三者必须相等。

#### 5.10.3 备用入口的线索回收

- 备用入口提交的线索必须带时间戳、可导出、可批量补录。
- 补录走同一张 `snsii_lead`，`Source=fallback`，`RequestId` 由补录工具生成（UUID），并在 `lead_activity` 记 `imported_from=fallback`。
- 补录去重：同邮箱 + 同型号集合 + 24 小时内视为同一条。

#### 5.10.4 故障演练（上线前必做）

| # | 场景 | 操作 | 期望 | 判定 |
|---|---|---|---|---|
| 1 | 数据库不可写 30 分钟 | 停写入或只读 | 表单仍提示成功，spool 累积，恢复后 10 分钟内全部入库 | 0 丢失 |
| 2 | 邮件服务不可用 | 关闭 SMTP | 入库正常，`NotifyStatus=2`，告警触发，恢复后补发成功 | 告警 + 补发 |
| 3 | 通知重复发送 | 强制重试 3 次 | 销售只收到 1 封，或后续标记"重复通知"，不产生重复跟进 | 无重复线索 |
| 4 | GA4 不可用 | 断外网 | 入库与通知正常，`GaSent=0`，恢复后补发，报表按 `lead_no` 去重 | 数据一致 |
| 5 | spool 磁盘写满 | 限制配额 | 明确报错并告警，不静默丢数据 | 无静默丢失 |

演练结论必须能对上账：**提交数 = 入库数 + spool 待重放数 + 明确失败数**。对不上即视为不通过。

---

## 6. 搜索子系统（Phase 2）

### 6.1 目标（改为待验证）

v1.0 把"16–32GB 内存、千万级、P95 < 100ms、编辑距离 1–2"写成设计结论。这些应作为**目标值**，在真实数据基准测试后确认（见 6.8）。

| 指标 | 目标值 | 状态 |
|---|---|---|
| 精确型号 Top1 命中 | 100% | 待测 |
| 前缀/中缀命中 | ≥ 95% | 待测 |
| 错字容错命中 | ≥ 85% | 待测 |
| 误召回（错型号排前） | ≤ 1% | 待测 |
| 查询延迟 | P95 < 100ms（服务端） | 待测 |
| 可用性 | 检索故障自动回退，不 500 | 设计保证 |

### 6.2 索引模型

索引命名：`products_v{yyyyMMddHHmm}`；线上别名 `products`。

| 字段 | 类型 | searchable | filterable | sortable |
|---|---|:-:|:-:|:-:|
| `id` | number | — | — | — |
| `part_number` | string | ✓ | — | ✓ |
| `part_number_normalized` | string | ✓ | — | — |
| `part_number_ngram` | string | ✓ | — | — |
| `brand` | string | ✓ | ✓ | — |
| `brand_slug` | string | — | ✓ | — |
| `category_l1/l2/l3` | string | ✓ | ✓ | — |
| `category_slugs` | array | — | ✓ | — |
| `description` | string | ✓ | — | — |
| `package` | string | — | ✓ | — |
| `mount` | string | — | ✓ | — |
| `rohs` | string | — | ✓ | — |
| `lifecycle` | string | — | ✓ | — |
| `stock` | number | — | ✓ | ✓ |
| `price` | number | — | — | ✓ |
| `has_pdf` | boolean | — | ✓ | — |
| `has_spec` | boolean | — | ✓ | — |
| `is_active` | boolean | — | ✓ | — |
| `index_tier` | string | — | ✓ | — |
| `url` | string | — | — | — |
| `updated_at` | number | — | — | ✓ |

新增 `part_number_ngram` 与 `index_tier`：前者支持中缀检索（电子元器件型号常用片段检索），后者支撑索引分层策略（见 8.4）。

### 6.3 四层检索规则（R08）

电子元器件型号搜索与电商商品搜索有本质差别：

```
M4T28-BR12SH1
M4T28-BR12SH2
M4T28-BR12SH3
```

只差一个字符就是完全不同的产品。若直接对型号开启模糊搜索，可能出现"错误型号排在精确型号前面"，这是比搜不到更严重的错误——客户会按错误型号下单。

| 层 | 规则 | 实现 | 优先级 |
|---|---|---|---|
| L1 精确型号 | 原始型号精确匹配 | MySQL `PartNumber` 唯一索引直查（需先验证存在，见 V1） | 最高，直接返回 |
| L2 规范化型号 | 大小写/空格/连字符/全角归一后全等 | `part_number_normalized` 全等匹配 | 高 |
| L3 前缀/中缀 | 型号片段检索 | `part_number` 前缀 + `part_number_ngram` 中缀 | 中 |
| L4 模糊 | 错字容错、描述检索 | typoTolerance，仅对非型号字段生效 | 低 |

关键约束：

- **`part_number` 字段关闭 typo**（Meilisearch `typoTolerance.disableOnAttributes`），型号只允许精确/前缀/中缀命中，不允许编辑距离命中。
- 错字容错只作用于 `description` 与品牌名，避免型号混淆。
- 排序规则中 `exactness` 权重前置，保证精确型号永远排第一。
- L1 命中时直接返回，不进入 Meilisearch，保证完整料号零延迟。

### 6.4 Settings 示例

```json
{
  "searchableAttributes": [
    "part_number",
    "part_number_normalized",
    "part_number_ngram",
    "brand",
    "category_l3",
    "category_l2",
    "description"
  ],
  "filterableAttributes": [
    "brand", "category_slugs", "package", "mount",
    "rohs", "lifecycle", "stock", "has_pdf", "has_spec",
    "is_active", "index_tier"
  ],
  "sortableAttributes": ["stock", "price", "part_number"],
  "rankingRules": [
    "words", "typo", "proximity", "attribute",
    "exactness", "sort", "stock:desc"
  ],
  "typoTolerance": {
    "enabled": true,
    "minWordSizeForTypos": { "oneTypo": 5, "twoTypos": 9 },
    "disableOnAttributes": ["part_number", "part_number_normalized", "part_number_ngram"]
  },
  "pagination": { "maxTotalHits": 10000 },
  "faceting": { "maxValuesPerFacet": 100 },
  "localizedAttributes": [
    {
      "attributePatterns": ["description"],
      "locales": ["eng", "jpn", "deu", "spa", "ind"]
    }
  ]
}
```

**注意**：

- `maxTotalHits` 默认 1000，千万级数据必须显式提高；超过上限的深翻页改为"缩小条件"引导。
- 日文分词依赖 Meilisearch 自带分词器；语言代码以所用版本支持为准，上线前用真实型号与日文参数验证。
- 同义词只人工维护少量，禁止自动生成，避免型号被替换。
- 上述 settings 是**起点值**，最终值以 6.7 基准测试结果为准。

### 6.5 全量构建流水线

```
1. 只读连接/快照
2. 按 id 区间分片（每片 20 万），导出 NDJSON
3. 清洗与字段裁剪（见 6.6）
4. 文档组装（只保留索引字段）
5. 批量导入（每批 1 万，waitForTask）
6. 写入 settings（导入前设置，避免二次重建）
7. 校验（文档数、抽样、典型查询）
8. swapIndexes 原子切换，旧索引保留 7 天
```

工程要求：

- 每片一个文件 + 一个 manifest（片号、行数、SHA-256、状态）。
- 导入失败只重跑该片；全流程可中断续跑。
- 索引构建在离线环境，限速写入，避免占满磁盘 I/O。
- 单次全量完成后输出报告：文档数、丢弃数、耗时、索引体积、内存峰值。

### 6.6 清洗规则

| 规则 | 处理 |
|---|---|
| 型号为空/纯符号 | 丢弃 |
| 型号重复 | 保留 `id` 最小且状态最优 |
| `IsPut=0/1` | 丢弃 |
| `IsPut=4` | `is_active=false`，是否入索引由 `index_policy` 决定 |
| 描述含 HTML | 去标签、压缩空白、截断 500 |
| 大小写/空格/连字符 | 保留原值，另生成归一化与 ngram 字段 |
| 价格异常 | 不写 `price`，标记询价 |
| 分类缺失 | 归入 `uncategorized` |
| 停产 | `lifecycle=obsolete`，降权但不丢弃 |

### 6.7 查询链路与熔断

```
keyword
  -> trim / 全角转半角 / 合并空格 / 去不可见字符
  -> L1 精确：MySQL PartNumber 唯一索引
       命中 -> 直接返回
  -> L2/L3/L4：Meilisearch 检索（query + facets + sort + page）
       成功 -> 结果页
       失败/超时(>300ms) -> 降级
  -> 降级：MySQL 前缀查询，LIMIT 200，超时 300ms
       失败 -> 静态空态页（不报错）
  -> 零结果 -> 200 空态页：相近型号 + 分类入口 + 询盘按钮
```

**熔断策略**（v1.0 缺失，必须补）：

| 项 | 规则 |
|---|---|
| 超时 | Meili 查询 300ms，MySQL 降级查询 300ms |
| 结果上限 | 降级查询 LIMIT 200，不分页 |
| 熔断阈值 | 30 秒内错误率 > 50% 或连续 20 次失败 |
| 熔断时长 | 60 秒，期间直接走静态空态页，不压老库 |
| 恢复 | 半开探测 5 次成功后续流 |
| 监控 | 每次查询记录 `fallback=true` 与耗时，便于事后分析 |

> 若不做熔断，Meilisearch 故障时全部流量会瞬间压到 MySQL 5.6 + MyISAM 的老库上，可能引发整站不可用——这是本项目最容易被忽视的次生故障。

**代码改造点**：

| 文件 | 改动 |
|---|---|
| `SearchController::actionIndex` | 接入检索客户端；保留 POST→GET 跳转；删除 302 到购物车 |
| 新增检索服务类 | 封装归一化、精确命中、Meili 查询、降级、熔断、日志 |
| `views/search/index.php` | 增加分面、排序、空态、结果计数 |
| 配置 | `search_engine`、`meili_host`、`meili_key`（环境变量） |

### 6.8 基准测试与通过线（R08）

**测试集**：500–1,000 条真实型号，构成如下。

| 类别 | 数量 | 说明 |
|---|---:|---|
| 精确完整型号 | 300 | 从线上随机抽取，含在售与隐藏 |
| 前缀片段 | 150 | 取型号前 6–10 位 |
| 中缀片段 | 100 | 取型号中间片段 |
| 大小写/空格/全角变体 | 100 | 模拟真实输入 |
| 错字变体 | 100 | 替换/遗漏/换位各 1 字符 |
| 近似型号（易混） | 100 | 如 `BR12SH1` vs `BR12SH2` |
| 无结果词 | 50 | 验证空态与不报错 |

**测试方法**：

1. 在 staging 分别构建 500 万与 1,000 万文档两档索引。
2. 记录索引体积、内存峰值、导入耗时。
3. 回放测试集，记录 Top1 / Top3 命中、误召回、P50/P95 延迟。
4. 调整 `typoTolerance`、`rankingRules`、`searchableAttributes` 后复测。

**通过线**：

| 指标 | 通过线 |
|---|---|
| 精确型号 Top1 | 100% |
| 前缀/中缀 Top3 | ≥ 95% |
| 错字 Top3 | ≥ 85% |
| 近似型号误召回（错误型号进 Top3） | ≤ 1% |
| P95 延迟 | < 100ms |
| 内存峰值 | 在实例规格 70% 以内 |

未达通过线时：优先调整 settings 与分词，其次调整实例规格，**不得通过放宽 typo 容错来"提高命中率"**。

### 6.9 验收用例

| # | 输入 | 期望 |
|---|---|---|
| 1 | `m4t28` | 命中，大小写不敏感 |
| 2 | `M4T28-BR12SH1` | 精确命中，第一条为目标型号 |
| 3 | `M4T28-BR12SH2` | 精确命中 SH2，不返回 SH1 作为首条 |
| 4 | `BR12SH1` | 中缀命中 |
| 5 | `M4T28 BR12SH1` | 空格归一化后命中 |
| 6 | 全角字符 | 归一化后命中 |
| 7 | `M4T28-BR12SH`（错字） | 容错命中，但精确项仍优先 |
| 8 | 无结果词 | 200 空态页，有推荐与询价 |
| 9 | 关闭 Meilisearch | 自动降级，页面不报错，耗时 < 800ms |
| 10 | 连续 20 次失败 | 熔断生效，直接返回空态页 |
| 11 | 分面筛选品牌 | 结果与计数一致 |
| 12 | 深翻页超过上限 | 提示缩小条件，不报错 |

---

## 7. Ds Bit 参数化子系统（Phase 3）

### 7.1 数据源与文档类型

| 来源 | 覆盖 | 优先级 |
|---|---|---|
| `PdfId` + 规则拼接 URL | 约 563 万商品，568,830 个去重 PDF | 主 |
| 显式 `Pdf` 路径 | 11,658 行 | 高（路径明确） |
| `DataAttr` JSON | 全量但字段有限 | 兜底与对照 |

文档类型分布需人工标注抽样（V2），因为类型直接决定参数是否可用于该产品：

| DocType | 参数可用性 | 说明 |
|---|---|---|
| Datasheet | 可用 | 型号主体，参数权威 |
| UserGuide（同型号） | 可用 | 需主体一致 |
| Application Note | 仅参考 | 推荐工作条件，不等于器件参数 |
| EVM / 评估板 | 不可用 | 属于评估板，不属于芯片 |
| 其它 | 需人工 | 默认不发布 |

### 7.2 任务生成（按文档，不按产品）

v1.0 按产品生成解析任务，会重复解析同一 PDF 约 9.9 次。本版按文档生成：

```
document_asset（56.9 万）
   -> 过滤：FetchStatus=1 且 HasTextLayer=1
   -> 优先级排序
   -> 生成 parse_run（每个 DocumentId + ParserVersion 一条）
```

优先级公式：

```
priority = 关联产品数权重 * 3
         + 关联产品的库存/流量权重 * 2
         + 显式 Pdf 路径 * 2
         - 历史解析失败次数 * 5
```

分批：

| 批次 | 范围 | 目的 |
|---|---|---|
| B0 | 100–200 份文档 | 算法与质量门校准，覆盖 5 种 DocType |
| B1 | 1–2 万份文档 | 高价值型号，验证成本与准确率 |
| B2 | 按分类扩展 | 覆盖主要目录 |
| B3 | 长尾 | 视预算与收益决定 |

### 7.3 下载与校验

- 并发 ≤ 8，遵守源站限速；失败指数退避。
- 校验：HTTP 200/206、`%PDF` magic、页数、文本层是否存在。
- 扫描版/空文本 PDF 直接标记，首轮不做 OCR。
- 去重：按 `PdfHash` 识别内容重复；同一 `PdfId` 内容变化则新增 `Revision`。
- 存储：对象存储 + CDN；本地只留 manifest 与证据包。

### 7.4 解析与归一化

```
PDF -> 表格检测 -> 行列还原 -> 合并单元格/跨页续表 -> 原始键值
    -> 文档类型与主体判定 -> 参数名映射（AttrKey） -> 单位换算
    -> 枚举白名单 -> 数值抽取（ValueNum） -> 条件抽取（Conditions）
    -> 值类型判定（Min/Typ/Max/AbsMax） -> 置信度 -> 证据坐标（PageNo/TableId/RowId/BBox）
```

规则：

- 未识别表头进入 `unmapped` 队列，人工确认后才进入发布。
- 单位统一（V/mA/Ω/pF/℃ 等）；无法换算的保留原文并标注单位。
- 枚举值只翻译白名单项（如 `Tube`→`管装`），其余保留原文。
- 同一参数多值用 `Seq` 区分；`Min/Max/Typ` 用 `ValueKind` 区分，不占用 `Seq`。
- 表头含"Absolute Maximum Ratings"时 `ValueKind` 必须为 4，且不与推荐工作条件合并。

### 7.5 关联审核（Applicability）

解析完成后，参数进入待发布状态，但**发布前必须确认关联适用性**：

| 检查 | 通过条件 | 不通过 |
|---|---|---|
| 文档类型 | Datasheet 或同型号 UserGuide | 降级为参考值，不进详情页主参数区 |
| 文档主体 | `DocSubject` 与产品型号/系列一致 | `Applicability=3`，人工确认 |
| 关联状态 | `LinkStatus=1` | 参数不发布 |
| 产品归属 | `ProId` 在 `document_link` 中存在 | 丢弃 |

> **计量单位（P0-04）**：B0 / B1 均按**文档份数**计。客户版 §9.3 已同步为本口径。
> 「3–5 万个重点型号」是详情页覆盖目标，不等于 3–5 万份 PDF；B1 的实际解析量按 1–2 万份文档估算。
> B1 按**经审核并成功关联的产品数**验收，而非按导入的文档数验收——两者差额即为解析或关联失败的部分。

**关联验收指标（P0-04 补）**

「1–2 万份文档」是**处理规模**，不是**验收结果**。二者之间隔着解析成功率、审核通过率、产品归属正确率三道损耗，
不能用文档数顶替产品数。B1 阶段按下表五项**分别独立计量**，各有自己的分子与分母：

| 指标 | 定义（分子 / 分母） | 说明 |
|---|---|---|
| 文档处理量 | 成功完成解析的唯一 `DocumentId` 数 / 本批次计划解析文档数 | 只说明流水线跑通，**不代表可发布** |
| 文档审核通过率 | 审核通过文档数 / 本批次应审核文档数 | 衡量解析质量；未通过部分回退重解析或降级为参考值 |
| 产品关联成功率 | 成功关联（`LinkStatus=1` 且 `ProId` 校验通过）的唯一产品数 / 本批次目标产品数 | 衡量"文档 → 产品"这一跳的损耗 |
| 参数发布覆盖率 | 至少有一份合格参数文档的产品数 / 目标产品数 | **最终业务指标**，直接对应详情页是否真有参数 |
| 归属错误率 | 经审核发现的错误产品归属数 / 抽检关联数 | 反向质量指标，须同时报告抽检样本量 |

> 五项指标一律以**本批次**为统计边界，跨批次不合并计算，避免早期低质量批次被后期批次稀释。
> 归属错误率按抽检样本计，必须同时给出样本量与抽样方法，否则比率不具解释力。
> 关键结论：**1–2 万份文档的处理规模，对应的是"文档处理量"，不等于 1–2 万个产品通过验收**——
> 产品侧是否达标，只看「参数发布覆盖率」。

审核工作量估算：约 56.9 万份（568,830）文档中，B1 批次 1–2 万份可覆盖大部分流量型号；其余按分类批量抽检，不做全量人工。

### 7.6 质量门

| 检查 | 阈值 | 不通过处理 |
|---|---|---|
| 参数行数 | ≥ 3 | `QualityStatus=3` |
| 关键参数 | 至少含 Package/Series/Mount 之一 | 人工复核 |
| 置信度均值 | ≥ 0.75 | 不发布 |
| 与 `DataAttr` 冲突 | 同名字段不一致 | 人工裁决，不自动覆盖 |
| 单位合法性 | 命中白名单 | 丢弃该条 |
| 数值范围 | 物理合理区间 | 丢弃该条 |
| 文档类型 | 白名单内 | 整体降级 |
| 空文本/扫描版 | 文本层为空 | 不解析 |
| 证据完整性 | `PageNo` 与 `CellBBox` 非空 | 不发布（无法追溯） |

### 7.7 入库与幂等

- 幂等键：`(ParseRunId, ProId, AttrKey, Seq, ValueKind, TableId, RowId)`，重复执行不产生重复行。
- 解析判定：`(DocumentId, ParserVersion, SchemaVersion)` 唯一，已成功则不重复解析。
- 版本升级写新记录，旧记录保留并置 `IsCurrent=0`、`SupersededBy`。
- 每件独立事务，单件失败不影响整批。
- 发布动作单独执行，只改 `IsCurrent` 与 `ReviewStatus`，不改参数值。

### 7.8 JSON-LD 规范

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "M4T28-BR12SH1",
  "brand": { "@type": "Brand", "name": "STMicroelectronics" },
  "sku": "M4T28-BR12SH1",
  "mpn": "M4T28-BR12SH1",
  "category": "Batteries / Battery Holders",
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "Package", "value": "SNAP-IN" },
    { "@type": "PropertyValue", "name": "Mounting Type", "value": "Through Hole" }
  ]
}
```

规则：

- 只有 `IsCurrent=1 AND ReviewStatus=1` 且关联已确认的参数进入 `additionalProperty`。
- **JSON-LD 必须与页面可见内容一致**：页面不展示的参数不得写入结构化数据。
- 有价商品输出 `offers`（`price`、`priceCurrency`、`availability`）；询价商品省略 `offers`，不虚构价格。
- 停产商品 `availability=Discontinued`。
- 页面含视频时增加 `VideoObject`；分类页输出 `BreadcrumbList`；首页输出 `Organization` 与 `WebSite`（含 `SearchAction`）。
- 预生成进 `snsii_product_cache_v2.JsonLd`，运行时直接输出。
- 生成 JSON-LD 不等于获得富媒体结果，需以富媒体测试工具 0 错误为准。

### 7.9 灰度与撤下

- 开关 `spec_enabled` 按分类白名单灰度。
- 每级观察 72 小时：跳出率、询盘转化、富媒体错误、参数报错反馈。
- 异常时关闭开关：页面回 `DataAttr`，JSON-LD 同步撤下。
- 用户报错闭环：`ProId + AttrKey → SpecId → DocumentId + PageNo + CellBBox → 单条 ReviewStatus=2 → 关联复核 → 重解析`。

### 7.10 抽检规范

| 项 | 规范 |
|---|---|
| 样本量 | 每批 ≥ 500 件，按分类与 DocType 分层 |
| 判定 | 参数名正确、值正确、单位正确、条件正确、归属正确、无缺失关键参数 |
| 通过线 | 准确率 ≥ 95%，归属错误率 ≤ 1% |
| 复核 | 两名标注员独立判定，分歧由第三人裁决 |
| 记录 | 每件保留页码与截图证据，可按 `SpecId` 回溯 |

---
## 8. SEO 与多语种

### 8.1 四个概念必须分开

v1.0 把"隐藏商品可访问"直接等同于"应该收录"，这是本轮改造最容易造成反效果的地方。以下四件事必须分别决策：

| 概念 | 由谁控制 | 判断依据 |
|---|---|---|
| 页面能否访问 | 应用逻辑 | 商品是否存在、是否有替代价值 |
| 页面是否允许爬取 | `robots.txt` / `X-Robots-Tag` | 是否需要被搜索引擎看到 |
| 页面是否进入索引 | `meta robots`（noindex） | 内容质量是否足以参与排名 |
| 页面是否进入 Sitemap | sitemap 生成规则 | 是否值得主动推送 |

"可访问 + 不可索引"是完全合法的组合；"可索引 + 不进 Sitemap"也是。混为一谈会导致两个错误：把低质量页面批量推进索引，或把有价值的老页面直接 404。

### 8.2 状态码统一规则（R04）

#### 8.2.1 v1.0 的矛盾

v1.0 第 6.1 节写"商品不存在：301 到所属分类页（不 404）"，第 6.5 节写"商品不存在：301 到分类；分类也不存在：404"。两处表述接近，但都没有区分"真正不存在 / 临时下架 / 永久下架 / URL 映射错误"。

把不存在的商品一律 301 到分类页，短期能降低 404 数量，长期会产生**软 404**：搜索引擎发现大量重定向最终指向内容不相关的分类页，会降低对这些 URL 的信任，已收录页面的排名也会受影响。

#### 8.2.2 本版规则

| 情况 | 判定依据 | 状态码 | 页面处理 | Sitemap |
|---|---|---|---|---|
| 正常在售 | `IsPut=6` 且有库存/可询价 | 200 | 正常详情页 | 是（Tier A） |
| 在售但内容较少 | 参数与资料均缺失 | 200 | 显示"资料待补充"+ 询盘 CTA | 视情况（Tier B） |
| 临时不可售 | `IsPut=4`，近期可能恢复 | 200 | 正常页面，标注状态 | 否 |
| 永久停产，有替代 | 停产标记 + 有同系列在售 | 200 | 保留页面 + 替代型号区块 | 否 |
| 永久停产，无替代 | 停产标记 + 无替代 | 200 | 保留页面 + "已停产"说明 | 否 |
| 永久删除，有高度相关替代 | 人工确认语义等价 | 301 | 跳转到替代页 | 否 |
| 永久删除，无替代 | 人工标记 | 410 | 极简说明页 | 否 |
| 彻底不存在 | `ProId` 不在库 | 404 | 404 页 + 搜索/分类入口 | 否 |
| URL 中 `PartUrl` 与 `ProId` 不匹配 | 映射校验失败 | 301 | 跳转到同 `ProId` 的规范 URL | 否 |
| 分类不存在 | `Cid` 无效 | 404 | 404 页 | 否 |
| 商品不属于该分类 | 归属校验失败 | 301 | 跳转到正确分类 | 否 |
| 品牌已无任何商品 | 品牌下商品数 = 0 且持续 90 天 | 301 | 跳转到 `/manufacturers.html` | 否 |

#### 8.2.3 执行规则

- **取消"商品不存在即 301 到分类页"的兜底**。分类页不是万能替代品。
- 301 只用于"语义等价"的迁移：同一商品换了 URL、同一内容换了归属。
- 410 用于"明确永久移除"，需在 `snsii_url_policy` 登记，可由运营撤销。
- 禁止 200 软 404：商品不存在时 `ProController::actionItem` 必须返回 404/410，不得 `die('error')` 后返回 200（修复 T4）。
- 禁止把 404 页做成"看起来像正常页面"的落地页。

#### 8.2.4 监控

| 指标 | 频率 | 阈值 |
|---|---|---|
| 404 数量与 Top URL | 每日 | 单日新增 > 1,000 需排查 |
| 301 链长度 | 每周 | 不允许出现链式跳转（A→B→C） |
| 软 404 抽样 | 每月 | 抽 500 条 200 页面，内容有效性人工判定 |
| Search Console 覆盖率 | 每周 | 已排除页面异常增长需定位 |

### 8.3 索引信号规则（S02）

#### 8.3.1 为什么会冲突

canonical 回答"哪个 URL 代表这份内容"，noindex 回答"这个 URL 要不要进索引"。当筛选页既输出 `canonical` 指向无参数版本、又输出 `noindex` 时，两个信号指向的对象不同：canonical 说"内容归属别处"，noindex 说"本页别收录"。搜索引擎可能先按 canonical 合并、再忽略 noindex，把筛选页当作无参数页的副本收录；也可能把 noindex 扩散到整组 URL，误伤可索引的规范页。

本版原则：

1. **一个 URL 只表达一个意图**：要么"合并到别处"（301 或 canonical），要么"不收录"（noindex），不用两个手段处理同一个问题。
2. **noindex 页面的 canonical 必须自指或省略**，不指向其他 URL。
3. **真正的重复用 301**：仅参数顺序不同、带追踪参数的 URL，301 到规范 URL，不用 canonical + noindex 组合。
4. **筛选/排序页用 `noindex,follow` + 自指 canonical**：它们不是"重复内容"，是"不需要收录的独立视图"。
5. 分页按"内容是否独立、是否可发现"决定是否索引，不搞一刀切。

#### 8.3.2 规则矩阵

| URL 类型 | 状态码 | robots meta | canonical | Sitemap | 说明 |
|---|---|---|---|---|---|
| 商品详情（Tier A/B/C/E） | 200 | `index,follow` | 自指绝对 URL | 是（A/B 首批） | 各语种域名自指 |
| 商品详情（Tier D1/D2） | 200 | `noindex,follow` | 自指 | 否 | 保留可访问，否则爬虫读不到 noindex |
| 商品已删除 → 有替代 | 301 | — | — | 否 | 仅语义等价时跳转 |
| 商品已删除 → 无替代 | 410 | `noindex` | — | 否 | `snsii_url_policy` 登记 |
| 商品不存在 | 404 | `noindex` | — | 否 | 不得返回 200 |
| 分类页（一/二/三级） | 200 | `index,follow` | 自指 | 是 | |
| 分类分页 `page=1` | 200 | `index,follow` | 指向无参数分类 URL | 否 | 与主分类重复，只保留一个入口 |
| 分类分页 `page>1` | 200 | `index,follow` | 自指 | 否 | 独立商品集合且可发现 |
| 分类分页 `page>50` | 200 | `noindex,follow` | 自指 | 否 | 深层分页收录价值低，但保留链接 |
| 筛选 / 排序参数页 | 200 | `noindex,follow` | 自指 | 否 | **不指向无参数版** |
| 品牌页 | 200 | `index,follow` | 自指 | 是 | |
| 品牌页无商品（持续 90 天） | 301 | — | — | 否 | 跳 `/manufacturers.html` |
| 搜索页 | 200 | `noindex,follow` | 自指 | 否 | |
| 购物车 / 询盘提交成功页 | 200 | `noindex,follow` | 自指 | 否 | |
| 文章 / 静态页 | 200 | `index,follow` | 自指 | 是 | |
| 后台 / 测试入口 | 403 或 404 | `noindex` | — | 否 | robots 同时 Disallow |
| 多语种同路径 | 200 | `index,follow` | 本语种自指 | 是 | hreflang 互指，不跨域 canonical |

#### 8.3.3 分页与可发现性

- 判断标准有两条：**分页是否有独立商品集合**、**是否能从站内链接到达**。
- 分类分页满足两条 → 允许索引；商品筛选分页只是子集、不构成独立内容 → `noindex`。
- 深层分页（`page>50`）`noindex` 但保留链接，保证爬虫仍能发现新上架商品；同时提供"按分类/品牌收窄"入口，减少对深翻页的依赖。
- 不把 `rel=next/prev` 当作索引方案（主流引擎已不将其作为索引信号），保留输出无副作用，但不作为设计依据。

#### 8.3.4 测试与验证

- 每种 URL 类型抽 30 条真实 URL，合计约 500 条，自动断言：状态码、`meta robots` 与 `X-Robots-Tag`、canonical 是否为绝对地址且指向自身、sitemap 是否包含。
- 断言脚本纳入 13.2 URL 回归，每次发布执行。
- 上线后 4 周内每周核对 Search Console「已排除」原因分布，确认 noindex 与 canonical 的处理结果符合预期；出现"已提交但被 noindex 排除"的 URL 即视为规则冲突。

### 8.4 索引与 Sitemap 分层（R10、S01、S05、S06）

#### 8.4.1 分层定义

| 层级 | 定义 | 可访问 | 可爬取 | 可索引 | Sitemap | 内链 |
|---|---|:-:|:-:|:-:|:-:|:-:|
| Tier A | 在售 + 内容有效 + 可询价 | ✓ | ✓ | ✓ | ✓ | 保留 |
| Tier B | 在售 + 内容较少 | ✓ | ✓ | ✓（观察） | 否 | 保留 |
| Tier C | 隐藏（`IsPut=4`）+ 内容有效 + 有外部信号 | ✓ | ✓ | ✓ | 否 | 保留 |
| Tier D1 | 隐藏 + 内容薄 + 有外部信号 | ✓ | ✓ | noindex | 否 | 保留（观察 90 天） |
| Tier D2 | 隐藏 + 内容薄 + 无外部信号 | ✓ | ✓ | noindex | 否 | 逐步移除 |
| Tier E | 停产（有替代或无替代） | ✓ | ✓ | ✓ | 否 | 保留 |

说明：

- **Tier C 不再以"有历史流量"作为唯一条件**（S01）。历史流量只能说明"曾经有人来"，不能说明"现在还值得收录"，必须叠加内容有效性判断。
- **Tier D 拆为 D1 / D2**（S05）。D1 有外部信号但内容薄，保留抓取、`noindex`，给 90 天补内容窗口；D2 无信号无内容，除 `noindex` 外还要切断内链，让抓取频次自然衰减。
- 永久删除与失效不进入分层，直接走 8.2 的 301/404/410 规则。
- 分层结果写入索引文档 `index_tier` 字段，同时落 `snsii_page_quality` 表留痕。

#### 8.4.2 Tier 判定字段与阈值（S01）

判定必须机器可算、可复算、可审计。输入字段如下：

| 字段 | 来源 | 计算方式 |
|---|---|---|
| `is_put` | `snsii_product.IsPut` | 直取 |
| `spec_count` | `snsii_product_spec` / `DataAttr` | 已发布参数条数 |
| `has_pdf` | `document_link` / `Pdf` 字段 | 存在可下载且状态正常的 PDF |
| `desc_len` | 主表描述 | 去标签后字符数 |
| `image_ok` | 图片探测任务 | 主图 HTTP 200 且 ≥ 400×400 |
| `dup_group` | 型号规范化 + 品牌 | 同组内仅保留 `id` 最小者 |
| `gsc_clicks_90d` | Search Console API | 近 90 天点击汇总 |
| `gsc_impr_90d` | Search Console API | 近 90 天展示汇总 |
| `backlink_domains` | GSC 链接报告 / 外链工具 | 引用域数量 |
| `has_alt` | 停产与替代映射 | 是否存在替代型号 |

判定逻辑：

```
content_ok      = spec_count >= 3  OR has_pdf  OR desc_len >= 200  OR image_ok
external_signal = gsc_clicks_90d >= 3  OR gsc_impr_90d >= 100  OR backlink_domains >= 1
not_dup         = 该页在 dup_group 内为保留页

Tier A  = is_put = 6  AND content_ok
Tier B  = is_put = 6  AND NOT content_ok
Tier C  = is_put = 4  AND content_ok  AND external_signal  AND not_dup
Tier D1 = is_put = 4  AND NOT content_ok  AND external_signal
Tier D2 = is_put = 4  AND NOT content_ok  AND NOT external_signal
Tier E  = 停产标记（优先于 A–D）
```

阈值全部写入配置文件，不硬编码。每月复核一次；调整阈值必须记录变更原因、影响的 URL 数量与抽样复核结果。

判定结果落表：

```sql
CREATE TABLE `snsii_page_quality` (
  `ProId`        INT UNSIGNED NOT NULL,
  `IsPut`        TINYINT      NOT NULL DEFAULT 0,
  `SpecCount`    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `HasPdf`       TINYINT(1)   NOT NULL DEFAULT 0,
  `DescLen`      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `ImageOk`      TINYINT(1)   NOT NULL DEFAULT 0,
  `DupGroup`     VARCHAR(64)  NOT NULL DEFAULT '',
  `GscClicks90`  INT UNSIGNED NOT NULL DEFAULT 0,
  `GscImpr90`    INT UNSIGNED NOT NULL DEFAULT 0,
  `BacklinkDomains` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `ContentOk`    TINYINT(1)   NOT NULL DEFAULT 0,
  `ExternalSignal` TINYINT(1) NOT NULL DEFAULT 0,
  `Tier`         CHAR(2)      NOT NULL DEFAULT '',
  `RuleVersion`  VARCHAR(16)  NOT NULL DEFAULT '1',
  `EvaluatedAt`  DATETIME     NOT NULL,
  PRIMARY KEY (`ProId`),
  KEY `idx_tier` (`Tier`),
  KEY `idx_eval` (`EvaluatedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
```

`RuleVersion` 用于回答"这条 URL 是按哪一版规则判的"，避免规则调整后无法回溯。

#### 8.4.3 人工例外机制

规则无法覆盖全部业务判断（重点型号、客户指定、活动页、法律要求），因此保留人工例外，但必须可追溯、会过期：

```sql
CREATE TABLE `snsii_index_exception` (
  `Id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ProId`      INT UNSIGNED NOT NULL,
  `Action`     TINYINT      NOT NULL,          -- 1 提升索引 2 降级 noindex
  `Reason`     VARCHAR(32)  NOT NULL,          -- 重点型号/客户指定/活动/法律/其他
  `Note`       VARCHAR(255) NOT NULL DEFAULT '',
  `OperatorId` INT UNSIGNED NOT NULL,
  `CreatedAt`  DATETIME     NOT NULL,
  `ExpiresAt`  DATETIME     NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `uk_pro_action` (`ProId`,`Action`),
  KEY `idx_expire` (`ExpiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
```

规则：

- 默认有效期 90 天，到期自动失效并按 8.4.2 重新判定。
- 例外总量上限 5,000 条，超出需业务负责人审批。
- 例外只能改变"是否索引"，**不改变 Sitemap 规则**：提升到 Tier C 的页面仍不进 sitemap。
- 每条例外必须有理由枚举，禁止填写"其他"后不作说明。

#### 8.4.4 抽样验收

| 项 | 规则 |
|---|---|
| 样本 | 每月 Tier C 抽 300 条、Tier D2 抽 300 条 |
| 分层 | 按"有外链 / 有展示无点击 / 有参数无信号 / 完全无信号"四层等额抽取 |
| 判定三问 | ① 页面是否有该型号的独立信息？② 内容是否多于同系列其他页？③ 客户是否会因这页停留或询盘？ |
| 通过线 | C 组"应保留索引" ≥ 90%；D2 组"应 noindex" ≥ 95% |
| 不达标处理 | C 组 < 90% → 提高 `external_signal` 阈值；D2 组 < 95% → 补充 `content_ok` 判据 |
| 记录 | 抽样清单 + 判定人 + 结论 + 规则版本，纳入月度报告 |

#### 8.4.5 抓取预算与 robots（S05）

**关键约束：`robots.txt` 不得 Disallow 需要被读取 noindex 的路径。** 一旦 Disallow，爬虫根本看不到页面上的 noindex，URL 可能因为外链长期留在索引里，形成"想删删不掉"的状态。robots 只用于"既不需要索引、也不需要被读取 noindex"的路径（后台、搜索、购物车）。

Tier D 的收敛按顺序执行，不靠 robots：

1. 从分类列表、相关推荐、站内搜索结果中移除；
2. 从 sitemap 中排除；
3. 保持 200 + `noindex,follow`；
4. 观察 Search Console 抓取频次，允许逐月自然衰减。

监控与目标：

| 指标 | 基线 | 目标 |
|---|---|---|
| GSC 抓取请求中 D 类 URL 占比 | 待测 | 6 个月内 ≤ 30% |
| 核心页（Tier A）日均抓取频次 | 待测 | 不低于改造前 |
| D 类 URL 索引量 | 待测 | 逐月下降 |

若 D2 规模严重挤占抓取预算（D 类占比 > 50% 且核心页抓取频次下降），可评估对"无外链、无流量、确认不可恢复"的 D2 返回 410。410 不可逆，须业务书面确认后执行，默认不采用。

#### 8.4.6 Sitemap 分层与增量（S06）

| 层 | 内容 | 首批规模 | 更新频率 |
|---|---|---:|---|
| L1 | Tier A 商品，英文 | 50–100 万 | 每日增量 |
| L2 | 分类 / 品牌 / 文章 / 静态页，5 语种 | 全量 | 每日增量 |
| L3 | Tier B/E 商品（观察期后按表现加入） | 分批 | 每月 |
| L4 | Tier C / D | 不推送 | — |

- **日增量 + 月全量**：每日按状态变化增量生成，每月做一次全量重建并校验，避免月内状态变化导致 sitemap 与实际不符。
- 分片 manifest：每个分片记录 `generated_at`、`url_count`、`sha256`、`last_mod_max`，汇总为 `sitemap_manifest.json`。
- 自动清理：URL 变为 301/404/410，或 Tier 变为不可推送时，下一次增量生成即剔除，不等月度重建。
- 上限校验：单文件 ≤ 50,000 URL，**且未压缩 XML ≤ 50MB**（gzip 后大小不作为判据）。
- 首批只推 L1 + L2，观察 4–6 周抓取率与索引率，再决定是否扩 L3。一次性提交 700 万 URL 会稀释抓取预算。
- 提交后监控：sitemap 索引率、抓取错误数、"已提交但被 noindex 排除"的 URL 数（应为 0）。

#### 8.4.7 结构化数据与页面一致性

- 只有页面真实可见的内容才写入 JSON-LD。
- 不在页面上展示的参数、价格、评分，不得出现在结构化数据中。
- 富媒体测试 0 错误只是最低要求，不代表一定获得富媒体展示。

### 8.5 hreflang

- 5 语种全展开 + `x-default` 指向英文。
- 只在存在对应翻译的页面输出。
- 与语言切换器使用同一映射表。
- 其余 75 个域名不进入 hreflang。
- hreflang 与 canonical 必须自洽：canonical 指向自身语种，不指向英文。

### 8.6 五语种路由与词库

| 语种 | 域名 | 词库 |
|---|---|---|
| en | `www.morrishk.net` | 现有 |
| de | `www.morris-de.com` | 现有，补新增 |
| es | `www.morris-es.com` | 现有，补新增 |
| ja | `www.morris-jp.com` | 现有，补新增 |
| id | `www.morris-id.com` | 现有，补新增 |

- 继续使用 Yii `PhpMessageSource`，不引入第二套 i18n。
- `Yii::$app->language` 由域名解析，保持现状。
- 参数名新增走 `snsii_product_spec_i18n`，发布时同步 `messages/{lang}/attr.php`。
- 语言切换只换域名，保留路径与查询参数。

### 8.7 翻译流水线

```
词条提取（UI/分类/参数/文章）
  -> 术语表约束
  -> AI 初翻
  -> 人工校对（抽样 + 全量关键页）
  -> 写入词库（pending）
  -> 抽检通过（published）
  -> 发布 + 缓存刷新
```

**不翻译**：型号、品牌、封装等事实值、产品描述原文。

### 8.8 Phase 1 就应完成的技术 SEO 基线

不等到 Phase 2，以下项目在 Phase 1 随详情页一起上线：

| 项 | 说明 |
|---|---|
| 状态码规则 | 8.2 全部规则落地，消除软 404 |
| 索引信号矩阵 | 8.3.2 的 17 类 URL 全部落地，noindex 页 canonical 自指 |
| robots.txt | 只 Disallow 后台、搜索、购物车等"无需读取 noindex"的路径；**不得屏蔽筛选/参数页**，否则 noindex 读不到 |
| 索引分层 | Tier A–E 判定上线（8.4.2），`index_policy=safe` |
| sitemap | L1 + L2 首批，日增量生成 + 月度全量校验 |
| title/description | 模板化，含型号与品牌，不堆关键词 |
| 内链 | 面包屑、同系列、相关分类 |

这些是"改造成本低、错误代价高"的项目，越晚做越难纠正。

---

## 9. 社媒与视频（Phase 2）

### 9.1 定位调整

v1.0 把社媒放在 M6（最后），与"社媒引流是前期重点"的方向相反。本版将社媒系统放到 Phase 2，与搜索、内容并行，并明确它的目标不是"发得多"，而是**把外部流量稳定导入详情页并产生可归因的询盘**。

### 9.2 数据模型

```sql
CREATE TABLE `snsii_social_post` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ProId`          INT UNSIGNED    NULL DEFAULT NULL,
  `Channel`        VARCHAR(32)     NOT NULL,   -- linkedin/reddit/x/facebook
  `AccountId`      INT UNSIGNED    NOT NULL,   -- 关联 snsii_social_account
  `ContentVersion` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  `ContentHash`    CHAR(64)        NOT NULL,   -- 内容指纹，判断是否需要新版本
  `IdempotencyKey` CHAR(64)        NOT NULL,   -- md5(Channel+AccountId+ContentVersion+ContentHash)
  `ContentJson`    TEXT            NOT NULL,   -- 各平台文案与媒体
  `TargetUrl`      VARCHAR(512)    NOT NULL DEFAULT '', -- 落地页（带 UTM）
  `Status`         TINYINT         NOT NULL DEFAULT 0,  -- 0草稿 1待审 2排队 3已发 4失败 5已取消
  `ScheduledAt`    DATETIME        NULL DEFAULT NULL,
  `PublishedAt`    DATETIME        NULL DEFAULT NULL,
  `ExternalId`     VARCHAR(128)    NOT NULL DEFAULT '', -- 最近一次成功的平台 ID
  `CreatedAt`      DATETIME        NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_idem` (`IdempotencyKey`),
  KEY `idx_status_time` (`Status`,`ScheduledAt`),
  KEY `idx_pro` (`ProId`),
  KEY `idx_account` (`AccountId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;

CREATE TABLE `snsii_social_account` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `Channel`      VARCHAR(32)  NOT NULL,
  `AccountName`  VARCHAR(128) NOT NULL DEFAULT '',
  `CredentialRef` VARCHAR(128) NOT NULL DEFAULT '', -- 指向密钥管理，不存明文
  `Status`       TINYINT      NOT NULL DEFAULT 1,
  `LastCheckAt`  DATETIME     NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_channel_account` (`Channel`,`AccountName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;

CREATE TABLE `snsii_video_asset` (
  `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ProId`     INT UNSIGNED NULL DEFAULT NULL,
  `Platform`  VARCHAR(32)  NOT NULL DEFAULT 'youtube',
  `VideoId`   VARCHAR(64)  NOT NULL,
  `Title`     VARCHAR(255) NOT NULL DEFAULT '',
  `Duration`  INT UNSIGNED NOT NULL DEFAULT 0,
  `Status`    TINYINT      NOT NULL DEFAULT 0,
  `CreatedAt` DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_platform_video` (`Platform`,`VideoId`),
  KEY `idx_pro` (`ProId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
```

`TargetUrl` 是 v1.1 新增：每条社媒内容必须绑定一个带 UTM 的落地页，否则无法归因，等于白做。

### 9.3 发布幂等与审计（S07）

#### 9.3.1 三个必须回答的问题

| 问题 | 错误做法 | 本版做法 |
|---|---|---|
| 同一条内容会不会被重复发布？ | 只靠 `Status` 标记 | `IdempotencyKey` 唯一键，插入冲突即视为已提交 |
| 超时但平台已接收，重试会不会发两遍？ | 重试前不查平台 | 重试前用 `ExternalId` 查平台确认；查不到再重试，且同一 `IdempotencyKey` 只允许一个"进行中"尝试 |
| 内容改了怎么办？ | 直接覆盖原记录 | 生成新 `ContentVersion` 与新 `ContentHash`，旧版本保留 |

#### 9.3.2 发布尝试记录表

`ExternalId` 在内容表上只能代表"最近一次成功"，无法承载审计。每次尝试单独记录：

```sql
CREATE TABLE `snsii_social_publish_attempt` (
  `AttemptId`   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `PostId`      BIGINT UNSIGNED NOT NULL,
  `Channel`     VARCHAR(32)     NOT NULL,
  `AccountId`   INT UNSIGNED    NOT NULL,
  `ContentVersion` SMALLINT UNSIGNED NOT NULL,
  `RequestHash` CHAR(64)        NOT NULL,   -- 请求体摘要
  `AttemptNo`   TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `HttpStatus`  SMALLINT        NOT NULL DEFAULT 0,
  `ExternalId`  VARCHAR(128)    NOT NULL DEFAULT '',
  `ResultCode`  TINYINT         NOT NULL DEFAULT 0, -- 0进行中 1成功 2可重试失败 3不可重试失败 4结果未知
  `ErrorClass`  VARCHAR(32)     NOT NULL DEFAULT '', -- rate_limit/auth/content_rejected/network/unknown
  `ErrorMsg`    VARCHAR(255)    NOT NULL DEFAULT '',
  `StartedAt`   DATETIME        NOT NULL,
  `FinishedAt`  DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`AttemptId`),
  UNIQUE KEY `uk_post_attempt` (`PostId`,`ContentVersion`,`AttemptNo`),
  UNIQUE KEY `uk_channel_external` (`Channel`,`ExternalId`),
  KEY `idx_post` (`PostId`),
  KEY `idx_result` (`ResultCode`,`ErrorClass`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC;
```

要点：

- `uk_channel_external` 保证一个平台 ID 只能对应一条尝试记录，从数据库层面阻断重复发布。
- `ResultCode=4`（结果未知）是超时场景：必须**先查询平台**再决定是否重试，不允许直接重试。
- `ErrorClass` 区分限流、鉴权失效、内容被拒、网络、未知，对应不同处置：限流顺延、鉴权重连、内容被拒转人工、网络重试。

#### 9.3.3 状态与重试规则

| ResultCode | 后续动作 | 重试 |
|---|---|---|
| 1 成功 | 回写 `post.Status=3`、`ExternalId`、`PublishedAt` | 否 |
| 2 可重试失败 | 指数退避，最多 3 次 | 是 |
| 3 不可重试失败 | 转人工，`post.Status=4` | 否 |
| 4 结果未知 | 调平台查询接口核对 | 核对后再定 |

- 同一 `PostId + ContentVersion` 同时只允许一个"进行中"尝试（`ResultCode=0`），由应用层加锁或唯一键约束保证。
- 账号与内容通过 `AccountId` 外键关联，账号被停用时其下所有排队任务自动转人工，不静默失败。

### 9.4 分发适配器

统一接口（概念）：

```
publish(post) -> {external_id, status}
validate(channel) -> {can_auto, limits, required_scopes}
```

| 平台 | 自动发布 | 主要限制 | 建议 |
|---|---|---|---|
| LinkedIn | 需应用审核与相应权限 | 权限范围、频率 | 有权限则自动，否则半自动 |
| Reddit | API 可用但社区规则严格 | 自我推广限制、版规 | 技术答疑为主，半自动 |
| X | API 分级付费 | 速率与配额 | 按配额排程 |
| Facebook | 需主页与权限 | 审核与权限 | 有权限则自动 |
| YouTube | 上传 API 可用 | 配额 | 批量上传 + 定时发布 |

**结论**：系统按"自动 + 半自动"设计，不承诺绕过平台限制，不做群发与刷量。

### 9.5 定时与限流

- 任务队列按 `ScheduledAt` 出队，单平台串行，失败退避。
- 每平台每日/每小时配额配置化，超限顺延。
- 发布前做内容审核状态检查；未审核不发布。
- 内容发布与询盘归因联动：每周产出"渠道 → 会话 → 询盘"报表。

### 9.6 视频与站内反哺

- 详情页按 `ProId` 查询 `snsii_video_asset`，渲染响应式嵌入。
- 使用 `youtube-nocookie` 域名，减少追踪与合规负担。
- 页面输出 `VideoObject`（名称、描述、缩略图、上传日期、时长、嵌入地址）。
- 视频页记录 `view_item` 与 `video_start` 事件。
- 视频描述区放置带 UTM 的详情页链接。

### 9.7 UTM 规范

见 5.6.4。社媒所有外链必须经统一生成器产出，禁止手工拼接；短链可选，但短链服务需自有域名与点击日志。

---

## 10. BOM 分阶段（R07）

### 10.1 结论

BOM 不作为本期核心交付。甲方已明确"BOM 的很多细节有点麻烦"，而 BOM 的完整能力（字段识别、参数校验、替代料推荐、库存价格匹配）依赖参数库、供应链数据与人工规则，属于独立专项。

**但 BOM 入口不能删**：客户上传 BOM 是真实采购需求，前期可以用"上传 + 人工处理"承接。

### 10.2 两阶段划分

| 阶段 | 功能 | 定位 | 工作量 |
|---|---|---|---|
| Phase 1 | BOM 文件上传、多型号录入、询盘提交、附件通知销售 | 简单业务功能 | 见 14.1（附件能力复用 P1-4） |
| Phase 4 | BOM 自动识别、字段校验、替代料推荐、库存价格匹配 | 独立专项 | 25–40 人日 |

> Phase 1 的附件上传、存储、权限、扫描与通知属于**通用能力**，由 P1-4 询盘模块统一实现；P1-7 只计 BOM 专属部分（上传页、文件类型约束、多型号录入、销售处理流程）。人日拆分见 14.1。

Phase 1 的 BOM 流程：

```
客户上传 BOM（xls/xlsx/csv/pdf）
        ↓
填写邮箱与需求
        ↓
生成 LeadNo，附件存对象存储
        ↓
通知销售，后台可下载原件
        ↓
销售人工录入/整理，线下报价
```

明确边界：

- **不承诺自动识别型号**，页面上写"上传后由工程师人工核对"。
- **不承诺替代料推荐**，尤其不能把"自动替代料"作为 BOM 功能的默认承诺。
- 不做库存价格实时匹配。

### 10.3 附件安全规范（S03）

BOM 文件包含客户采购清单、项目型号、目标价与商业信息，不能当普通图片附件处理。一旦泄露，损失的是客户信任；一旦被利用（宏、压缩炸弹、路径穿越），损失的是服务器安全。

#### 10.3.1 上传校验（双层）

| 项 | 规则 |
|---|---|
| 扩展名白名单 | `xls` / `xlsx` / `csv` / `pdf` |
| MIME 校验 | 服务端读文件头，**不信任** 客户端 `Content-Type` |
| Magic bytes | xls: `D0CF11E0`；xlsx: `PK\x03\x04` 且含 `[Content_Types].xml`；pdf: `%PDF-` |
| 大小 | 单文件 ≤ 10MB，单次合计 ≤ 30MB，单次 ≤ 3 个 |
| 文件名 | 忽略用户文件名；存储名 = UUID + 规范化扩展名，原名仅存库用于展示 |
| 存储路径 | 服务端生成 key，禁止拼接用户输入，禁止 `..` |
| 解压后大小 | xlsx 解压后 ≤ 200MB、条目 ≤ 5,000（防压缩炸弹） |
| 宏 | 检测 `vbaProject.bin`，命中则标记 `has_macro`，转人工 |
| 内容扫描 | 病毒扫描，未通过进隔离区，不通知、不可下载 |

#### 10.3.2 存储与访问

- 对象存储使用**私有桶**，禁止公共读，不生成永久 URL。
- 下载走签名 URL，有效期 ≤ 15 分钟，且绑定 `LeadId` + 操作人。
- 上传与下载均记审计：谁、何时、哪个 `LeadId`、哪个文件、IP 哈希。
- 生命周期与询盘一致：保留 12 个月（见 5.8），到期删除存储对象、保留元数据。

#### 10.3.3 状态机

```
0 待扫描 -> 1 扫描通过 -> 2 隔离（可疑）
         -> 3 拒绝（类型/大小/宏/内容）
         -> 9 上传失败
```

- 状态 0 / 2 / 3 的附件**不通知销售、不允许下载**。
- 扫描超时（> 60s）按隔离处理，不默认放行。

#### 10.3.4 失败与重试

| 场景 | 处理 |
|---|---|
| 上传中断 | 分片上传 + 断点续传；未完成分片 24 小时清理 |
| 扫描失败 | 重试 2 次，仍失败进隔离区并告警 |
| 通知失败 | 询盘照常入库，附件标记"待人工确认"，后台提示 |
| 重复提交 | 同一 `RequestId` 复用已有附件，不重复存储 |

#### 10.3.5 验收用例

| # | 用例 | 期望 |
|---|---|---|
| 1 | `.exe` 改名 `.pdf` 上传 | 拒绝（magic bytes 不匹配） |
| 2 | 上传 50MB xlsx | 拒绝（超限） |
| 3 | 上传含宏 xlsx | 标记 `has_macro`，转人工，不自动下发 |
| 4 | 压缩炸弹改名 xlsx | 解压阈值触发，拒绝 |
| 5 | 文件名含 `../` | 存储名重写，无路径穿越 |
| 6 | 未授权访问附件 URL | 403 |
| 7 | 签名 URL 过期 | 403 |
| 8 | 扫描超时 | 隔离，不通知销售 |
| 9 | 重复提交同一 BOM | 复用附件，不重复存储 |
| 10 | 附件到期 | 存储对象删除，元数据保留 |

### 10.4 Phase 4 前置条件

进入 Phase 4 前必须满足：

1. 参数库已覆盖主要目录（Phase 3 完成）。
2. 询盘量与线索质量已稳定（Phase 1–2 有数据）。
3. 人工处理 BOM 的工时统计已积累，可量化自动化收益。
4. 替代料规则已由工程团队确认，可形式化表达。

---

## 11. 安全与运行时升级

### 11.1 Phase 1：补偿性加固（不改框架）

| 项 | 动作 |
|---|---|
| 生产调试 | 关闭 `YII_DEBUG`，验证错误页无堆栈 |
| 密钥 | 轮换并移出代码，最小权限；历史泄露凭据一律作废 |
| 后台入口 | IP 白名单 / 独立域名 + Basic Auth |
| 测试入口 | `/test/{Act}.html` 下线或白名单 |
| SQL | 参数化 / `intval`，重点详情页与列表查询（T3） |
| 输入校验 | 统一过滤与长度限制 |
| 安全头 | `X-Content-Type-Options`、`Referrer-Policy`、基础 CSP |
| 爬虫 | 边缘限速、扫描路径快速拒绝 |
| 依赖 | `composer audit`，输出漏洞清单 |

### 11.2 升级路线（R11）

v1.0 的"PHP 7.4 暂时保留 + 后续评估"可以作为短期方案，但不能变成长期路线。PHP 7.4 已于 2022 年 11 月停止官方安全支持，MySQL 5.6 已于 2021 年 2 月结束常规生命周期，MyISAM 无事务与行级锁。每延后一个季度，漏洞暴露窗口就扩大一个季度。

本版拆为三条独立路线，**不与本次详情页/搜索改造捆绑**，但给出硬性日期。

#### 11.2.1 路线与硬性节点

以 **T0 = 合同生效日** 为锚点。绝对日期在项目启动会上写入合同附件，作为验收条件之一，不允许只停留在"后续评估"。

| 节点 | 内容 | 启动 | 完成 | 决策输出 |
|---|---|---|---|---|
| S1 | 运行时加固（11.1 全部项 + 备份告警 + 日志审计） | T0 | T0 + 4 周 | 加固清单 + 验证记录 |
| S2 | PHP 8 兼容评估（staging 部署 PHP 8.x、Yii2 依赖、扩展、全站回归） | T0 + 4 周 | T0 + 12 周 | 兼容问题清单（含每项改造量）+ 回归报告 + 升级时间表与预算 |
| S2-D | PHP 8 升级决策会 | — | T0 + 13 周 | 书面决策：升级 / 延期（延期须给出新日期与补偿措施） |
| S3 | MySQL 升级与 MyISAM→InnoDB 迁移可行性评估 | T0 + 16 周 | T0 + 24 周 | 迁移方案 + 停机窗口 + 磁盘与时间核算 |
| S3-D | 引擎迁移决策会 | — | T0 + 25 周 | 书面决策：迁移 / 分阶段 / 延期（须书面接受风险） |

#### 11.2.2 不可突破的底线

| 约束 | 期限 | 说明 |
|---|---|---|
| PHP 8 完成上线 | 不晚于 T0 + 9 个月 | 含兼容改造与回归 |
| MySQL 5.6 退出生产 | 不晚于 T0 + 18 个月 | 含引擎迁移或版本升级 |
| 决策不得空转 | 每个决策节点最多延期一次 | 第二次延期需甲方书面接受风险并记入风险登记册 |

#### 11.2.3 逾期处置

- S2 未在 T0 + 12 周完成 → 升级为项目 **P0 风险**，月度例会向甲方负责人上报。
- S2-D 未形成书面决策 → 默认按"升级"进入排期，预算另行申报。
- S3-D 未形成书面决策 → 默认按"分阶段迁移"立项，先迁小表与新增表，主表单独窗口。

S2 的验收物：兼容性问题清单（含每项改造量）、回归报告、切换与回滚方案。**不要求 S2 当场完成升级**，但必须给出可执行的时间表与预算。

S3 的约束：`snsii_product` 1009 万行 MyISAM 转 InnoDB 需要停机窗口或在线迁移工具，且索引体积会显著增长，必须单独核算磁盘与时间，不得与业务改造同批发布。

> 结论：升级路线可以晚于业务改造，但不能没有日期。给不出日期的"后续评估"，在工程上等同于不做。

### 11.3 密钥轮换的具体做法

```
1. 盘点：代码、配置、历史提交、日志、备份中出现的全部凭据
2. 签发新凭据（数据库、SMTP、GA4、社媒、对象存储）
3. 灰度切换：新凭据写入环境变量，重启验证
4. 作废旧凭据，观察 7 天访问日志确认无调用
5. 清理代码与配置中的明文，历史提交按需处理
```

仅把密钥从代码移到环境变量、不作废旧凭据，等于没有轮换。

---

## 12. 稳定性与运维

### 12.1 日志轮转

| 日志 | 策略 |
|---|---|
| nginx access/error | 按天，保留 14 天，压缩，`postrotate` 重开 |
| PHP-FPM | 按天，保留 7 天 |
| MySQL error/slow | 按天，保留 14 天 |
| 应用 runtime/logs | 保留现有上限，另加磁盘配额 |
| 离线任务 | 按任务分文件，保留 30 天 |
| 询盘与通知 | 单独文件，保留 90 天（含失败原因） |

### 12.2 监控阈值

| 指标 | 告警阈值 |
|---|---|
| 5xx 比例 | > 1% 持续 5 分钟 |
| 详情页 P95 | > 800ms |
| 搜索 P95 | > 300ms |
| 搜索错误率 | > 5% |
| 搜索降级率 | > 20% 持续 10 分钟 |
| 磁盘使用 | > 80% 警告，> 90% 严重 |
| inode | > 80% |
| MySQL 连接 | > 80% |
| Meilisearch 健康 | 连续 3 次失败 |
| 证书剩余 | < 14 天 |
| 备份失败 | 任意一次 |
| 备份校验失败 | 任意一次 |
| spool 积压 | > 100 条或 > 30 分钟未重放 |
| sitemap 提交错误 | 单次 > 50 条 |
| D 类 URL 抓取占比 | > 50% 持续 7 天 |
| **询盘入库失败** | 任意一次 |
| **询盘通知失败** | 连续 3 次 |
| **GA4 回传失败率** | > 10% |
| 缓存 v2 读取错误 | > 0.5% |

### 12.3 备份与恢复（S08）

#### 12.3.1 引擎差异带来的硬约束

现有主表、缓存表是 **MyISAM**，不支持事务一致性快照。`mysqldump --single-transaction` 对 MyISAM 表**不生效**——它只能保证 InnoDB 表的一致性，MyISAM 表在备份过程中被写入就会产生表间不一致（例如产品已删除但缓存仍在，或参数指向不存在的文档）。

因此备份策略必须按引擎分开，不能笼统写"逻辑备份"。

| 引擎 | 表 | 备份方式 | 一致性手段 |
|---|---|---|---|
| MyISAM | `snsii_product`、`snsii_product_cache`、`snsii_product_search` 等老表 | `mysqldump --lock-tables --flush-tables --master-data=2` | 备份期短时持读锁；或停写窗口内做文件级快照 |
| InnoDB | 全部新表（询盘、参数、缓存 v2 等） | `mysqldump --single-transaction --master-data=2` | 事务快照，不锁表 |
| 文件 | 附件、PDF、sitemap | 对象存储版本化 + 本地 rsync | 与数据库备份时间戳对齐 |

#### 12.3.2 备份窗口与锁表

| 项 | 规则 |
|---|---|
| 备份时间 | 每日 02:00–04:00（业务低峰） |
| 锁表时长 | MyISAM 读锁 ≤ 15 分钟；超时则中止本次备份并告警，不硬扛 |
| 业务可写性 | 备份期间业务**可写**（MyISAM 读锁允许读、阻塞写）；若写阻塞超过 60 秒，改用文件级快照 |
| 停写窗口 | 仅在缓存表切换、引擎迁移等场景使用，需提前公告并避开业务高峰 |
| 多表一致性 | 同一引擎内的表在同一备份事务/锁窗口内导出；跨引擎不追求强一致，靠校验脚本补 |
| 备份文件校验 | 每次备份后计算 SHA-256 并抽样 `mysql --one-database` 试恢复；校验失败即视为备份失败 |
| 异地传输 | 备份完成后 1 小时内同步至异地，传输失败告警 |

#### 12.3.3 恢复演练

| 项 | 规则 |
|---|---|
| 频率 | 每月一次，覆盖 MyISAM 表与 InnoDB 表各一次 |
| 数据规模 | 至少恢复到 staging 的 5% 子集 + 一次全量单表恢复（`snsii_product`） |
| RTO 目标 | 单表 ≤ 2 小时；整库 ≤ 8 小时 |
| RPO 目标 | ≤ 24 小时（日备份）；关键询盘表 ≤ 1 小时（binlog 增量） |
| 校验 | 恢复后跑行数比对、抽样 1,000 行逐字段、关键页面可访问 |
| 记录 | 每次演练输出报告：耗时、失败点、修正项 |

#### 12.3.4 备份对象清单

- 全库逻辑备份（按引擎分组导出）。
- `snsii_lead` 及关联表：单独加密备份，保留周期与 5.8 一致。
- 对象存储：BOM 附件、PDF、sitemap 分片。
- 配置与开关文件、nginx/php-fpm 配置、证书。
- 备份产物本身不得与生产同盘，且需保留至少 2 份（本地 + 异地）。

### 12.4 参数调优

| 组件 | 项 | 方向 |
|---|---|---|
| PHP-FPM | `pm.max_children` | 按内存核算，留 20% 余量 |
| PHP-FPM | `request_terminate_timeout` | 30–60s |
| PHP-FPM | `slowlog` | > 2s |
| MySQL | `slow_query_log` | > 1s |
| MySQL | `max_connections` | 按峰值 + 30% |
| MySQL | `tmp_table_size` | 按排序/分组需求 |
| nginx | `worker_connections` | 按并发 |

### 12.5 发布与回滚

- 发布前：备份、回归、开关预置、回滚脚本就绪。
- 发布中：灰度、观察 5xx/延迟/业务指标。
- 发布后：24 小时观察，异常按开关/别名/双读比例回滚。
- 回滚目标：搜索 < 1 分钟，索引 < 5 分钟，缓存 < 1 分钟（调 `cache_v2_pct`），前端 < 10 分钟。

**询盘模块不设"关闭开关"式回滚**（S04）。按 5.10 的四级降级处理：

| 级别 | 触发 | 处置 |
|---|---|---|
| L1 | 通知失败 | 入库照常，后台待办，自动重试 |
| L2 | GA4 失败 | 入库照常，补发队列 |
| L3 | 数据库写入异常 | 落 spool 并异步重放，页面仍提示成功 |
| L4 | 应用整体不可用 | 静态降级页 + 备用入口，线索可回收、可补录、可去重 |

底线：**不允许把"关掉表单、只发邮件"作为回滚手段**，因为那等于把线索移出跟进与归因体系，事后无法对账。

---

## 13. 测试与验收

### 13.1 测试层次

| 层次 | 内容 |
|---|---|
| 单元 | 归一化、清洗规则、质量门、URL 生成、幂等键 |
| 集成 | 搜索链路、详情页读缓存、参数入库、JSON-LD 输出、询盘入库与通知 |
| 回归 | 一万条老 URL 状态码/标题/canonical |
| 性能 | 详情页/搜索/分类压测 |
| 安全 | 输入校验、权限、敏感信息泄露扫描、表单反垃圾 |
| 数据 | 行数、抽样、冲突率、解析准确率 |
| 业务 | 询盘漏斗、渠道归因、通知送达 |

### 13.2 URL 回归清单

- 详情页 4,000 条（含隐藏品、停产品、无 PDF）。
- 分类页 2,000 条（二/三级）。
- 品牌页 1,000 条。
- 文章 500 条。
- 静态页 500 条。
- 异常路径 2,000 条（不存在、大小写、重复斜杠、PartUrl 不匹配）。

断言：状态码、`<title>`、`<h1>`、canonical、主要内链。**状态码断言是重点**，v1.0 的软 404 必须在本轮清零。

### 13.3 性能目标

| 页面 | TTFB | LCP |
|---|---|---|
| 首页 | < 300ms | < 2.0s |
| 分类 | < 350ms | < 2.2s |
| 详情 | < 300ms | < 1.8s |
| 搜索 | < 500ms | < 2.5s |

### 13.4 验收门槛（S11）

#### 13.4.1 门槛表

| 项 | 门槛 |
|---|---|
| 搜索容错用例 | 12/12 通过 |
| 搜索基准 | 达到 6.8 通过线 |
| 参数抽检 | ≥ 95%，归属错误率 ≤ 1% |
| 结构化数据 | 富媒体测试 0 错误 |
| URL 回归 | 错误率 < 0.5%，软 404 = 0 |
| 询盘业务验收 | 5.9 全部 10 项通过 |
| 询盘故障演练 | 5.10.4 五项全通过，且提交数 = 入库数 + 待重放 + 明确失败 |
| 缓存切换 | 3.8.4 的 12 项前置检查全通过 |
| 附件安全 | 10.3.5 十条用例全通过 |
| 连续稳定 | 7 天无 5xx 尖峰 |
| 回滚演练 | 13.5 全部达标 |

#### 13.4.2 指标口径定义

只写"≥ 95%"无法验收，必须定义分子、分母、抽样与判定人。

| 指标 | 分子 | 分母 | 抽样方法 | 判定 |
|---|---|---|---|---|
| 参数抽检通过率 | 判定为"完全正确"的参数条数 | 抽检参数总条数 | 按 **文档类型 × 品牌 × 参数类别** 分层抽样，每层 ≥ 30 条，每批总量 ≥ 500 条 | 单条需"名称 / 值 / 单位 / 条件 / 归属"五项全对才算通过 |
| 归属错误率 | 归属错误条数 | 抽检参数总条数 | 同上 | 错误分三类分别统计：①器件主体错误 ②文档类型错误 ③适用范围错误；合计 ≤ 1% |
| 搜索精确 Top1 | 首条即目标型号的查询数 | 精确型号查询数（300） | 固定测试集，见 6.8 | 首条不是目标型号即失败 |
| 前缀/中缀 Top3 | 目标型号进前 3 的查询数 | 前缀+中缀查询数（250） | 同上 | 目标型号不在前 3 即失败 |
| 错字容错 Top3 | 目标型号进前 3 的查询数 | 错字查询数（100） | 同上 | 同上 |
| 误召回率 | 错误型号进入 Top3 的查询数 | 易混型号查询数（100） | 同上 | 如 `BR12SH1` 查询返回 `BR12SH2` 进前 3 即计错 |
| URL 回归错误率 | 断言失败的 URL 数 | 回归样本总数（9,000，见 13.2） | 全量样本 | 状态码 / canonical / robots / title / h1 任一不符即失败；软 404 单独统计且必须为 0 |
| 富媒体错误 | Error 级问题数 | 抽样页面数（Tier A 抽 200） | 分层抽样 | Error 必须为 0；Warning 需逐条书面说明 |
| 连续稳定 | 5xx 比例 > 1% 的持续时长 | 7×24 小时 | 全量监控 | 无 > 5 分钟的连续 5xx 即通过 |

#### 13.4.3 通则

- 所有比例保留两位小数；**分母为 0 视为不通过**，不允许用"没有样本"代替"没有问题"。
- 抽样必须可复现：固定随机种子，抽样清单归档，任何人可按清单重跑。
- 每个门槛项需提供：执行脚本或操作步骤、原始数据、结论截图或日志、判定人签字。
- 未达门槛的项目不允许"带条件通过"，只能整改后复验。

### 13.5 staging 演练清单（R12）

以下演练必须在 staging 实际执行并留记录，不允许"设计上可行"替代演练：

| # | 演练项 | 通过标准 |
|---|---|---|
| 1 | 缓存双读灰度（1% → 10% → 50% → 100%） | 无 5xx，内容一致，回滚 ≤ 1 分钟 |
| 2 | 缓存表反向 `RENAME` | 成功，旧表可读，页面正常 |
| 3 | 搜索索引别名切换与回切 | 查询无中断，回切 ≤ 5 分钟 |
| 4 | Meilisearch 停机 | 自动降级，页面不报错 |
| 5 | 搜索连续失败触发熔断 | 熔断生效，老库 QPS 不升高 |
| 6 | 参数表版本升级与回滚 | 新旧版本并存，回滚只改标记 |
| 7 | 单条参数回滚 | 定位到 SpecId，页面回退到上一版本 |
| 8 | 询盘重复提交 | 同一 RequestId 10 次只产生 1 条 |
| 9 | 通知失败与补发 | 告警触发，补发成功 |
| 10 | GA4 回传失败 | 询盘照常入库，`GaSent=0`，补发成功 |
| 11 | 全站 URL 回归 | 错误率 < 0.5% |
| 12 | 备份恢复 | RTO/RPO 达标 |
| 13 | 索引信号断言 | 500 条 URL 全部符合 8.3.2 矩阵 |
| 14 | 索引分层判定 | Tier 分布符合预期，抽样通过 |
| 15 | BOM 附件安全 | 10.3.5 十条用例全通过 |
| 16 | 询盘四级降级 | 5.10.4 五项全通过，账目对得上 |

---

## 14. 实施排期与资源（R06、R12）

### 14.1 四阶段 WBS

#### Phase 1：获客基础（最高优先级）

目标：用户进入产品页后，能够快速获取信息并提交询盘，且每个询盘可追溯到渠道。

| 编号 | 工作流 | 关键任务 | 交付物 | 人日 |
|---|---|---|---|---:|
| P1-1 | 稳定与安全 | 日志、告警、备份、密钥轮换、调试关闭、限速、SQL 参数化 | 配置 + 验证记录 | 8–12 |
| P1-2 | 资产盘点与数据治理 | 商品/图片/PDF/URL 盘点、`IsPut` 语义确认、URL 映射表、文档类型抽样 | 清单 + 报告 | 8–12 |
| P1-3 | 详情页改造 | 信息架构、参数渲染与降级、图片修复、替代型号（规则）、移动端、性能 | 页面 + Lighthouse | 18–24 |
| P1-4 | 询盘闭环 + 通用附件能力 | 4 张表、表单、多型号、**附件上传/存储/扫描/签名下载/权限/审计**、反垃圾、通知、后台跟进、故障降级与 spool | 模块 + 后台 | 19–25 |
| P1-5 | 归因基础 | UTM 生成器、落地页记录、GA4 服务端回传、漏斗埋点 | 模块 + 报表 | 6–8 |
| P1-6 | 技术 SEO 基线 | 状态码规则、canonical/noindex 矩阵、robots、Tier 分层与判定、sitemap 日增量 | 规则 + 文件 | 9–12 |
| P1-7 | BOM 专属 | BOM 上传页、文件类型与数量约束提示、多型号批量录入交互、销售处理流程与导出（**不含通用附件能力**） | 功能 | 3–5 |
| | **小计** | | | **71–98** |

阶段门槛：5.9 询盘验收 10 项 + 5.10.4 故障演练 5 项 + 10.3.5 附件用例 10 条 + 13.5 演练第 1/8/9/10/13/14/15/16 项通过 + 软 404 清零。

> **P1-4 与 P1-7 的边界（S10）**：附件上传、对象存储、扫描隔离、签名下载、权限与审计属于通用能力，只在 P1-4 计一次；P1-7 只做 BOM 场景的页面与交互，不再重复计附件开发。v1.1 中 P1-4（15–20）与 P1-7（6–8）合计 21–28 人日，v1.2 合并去重后为 22–30 人日，差额来自新增的附件安全与故障降级，不是重复计算。

#### Phase 2：流量增长（高优先级）

目标：持续把外部流量导入产品页，并统计每个渠道产生的询盘。

| 编号 | 工作流 | 关键任务 | 交付物 | 人日 |
|---|---|---|---|---:|
| P2-1 | 搜索基准 | 测试集、两档基准、settings 调优 | 基准报告 | 5–7 |
| P2-2 | 搜索实现 | 导出、索引、查询改造、降级熔断、灰度 | 索引 + 服务 | 15–20 |
| P2-3 | SEO 扩展 | sitemap 分层扩展、hreflang、结构化数据、内链体系 | 报告 + 文件 | 12–16 |
| P2-4 | 外链与行业内容 | 落地页体系、内容模板、外链投放技术支撑 | 模板 + 页面 | 10–15 |
| P2-5 | 社媒系统 | 队列、适配器、审核、UTM 绑定、渠道报表 | 模块 + 报表 | 12–18 |
| P2-6 | 视频 | 上传、嵌入、`VideoObject`、商品关联 | 模块 | 6–10 |
| | **小计** | | | **60–86** |

阶段门槛：搜索基准通过 + 渠道归因报表可用 + 社媒内容带来可统计的会话与询盘。

#### Phase 3：参数数据能力

目标：用可靠参数提高详情页信息质量与搜索价值。

| 编号 | 工作流 | 关键任务 | 交付物 | 人日 |
|---|---|---|---|---:|
| P3-1 | 文档治理 | 三层表、去重、类型标注、关联审核 | 表 + 审核队列 | 10–14 |
| P3-2 | 解析流水线 | 下载、解析、归一化、证据、质量门 | 流水线 | 20–28 |
| P3-3 | 审核与抽检 | 标注工具、抽检报告、报错闭环 | 报告 | 12–18 |
| P3-4 | 参数化详情与 JSON-LD | 分组渲染、灰度、结构化数据 | 页面 + 规范 | 8–10 |
| | **小计** | | | **50–70** |

阶段门槛：抽检 ≥ 95%、归属错误率 ≤ 1%、灰度 4 周无异常。

#### Phase 4：智能化与扩展

| 编号 | 工作流 | 关键任务 | 人日 |
|---|---|---|---:|
| P4-1 | BOM 智能识别 | 解析、字段识别、校验、人工确认流 | 15–22 |
| P4-2 | 替代料与交叉参考 | 规则 + 匹配、人工确认、结果标注 | 12–18 |
| P4-3 | AI 助手 | 选型问答、参数解释、询盘前辅助 | 15–25 |
| P4-4 | 自动化运营 | 内容生成、分发优化、效果回收 | 10–15 |
| | **小计** | | **52–80** |

### 14.2 工作量重算说明（R12）

| 项 | v1.0 | v1.1 | v1.2 | 差异原因 |
|---|---:|---:|---:|---|
| 总计（人日） | 118–172 | 231–330 | **233–334** | 见下 |
| 详情页 | 含在 M5（20–30） | 18–24 | 18–24 | v1.0 把详情页当作"换肤"，实际是信息架构 + 参数渲染 + CTA 重构 |
| 询盘闭环 | 未单列 | 15–20 | 19–25 | v1.1 未计通用附件能力与故障降级；v1.2 合并 P1-7 的附件工作并补 5.10 降级设计 |
| 归因 | 含在 M6（15–20） | 6–8 | 6–8 | 拆分后归因本身不大，但必须与询盘同期上线 |
| 技术 SEO 基线 | 含在 M4（20–30） | 8–10 | 9–12 | 增加 canonical/noindex 矩阵、Tier 判定与 sitemap 日增量 |
| BOM 基础 | 未列 | 6–8 | 3–5 | 附件能力移入 P1-4 后，仅保留 BOM 专属页面与流程 |
| 搜索基准 | 未列 | 5–7 | 5–7 | v1.0 把目标值当结论，缺基准测试 |
| 参数化 | 30–45 | 50–70 | 50–70 | 增加文档三层治理、关联审核、人工抽检（v1.0 未计审核工时） |
| 社媒 | 15–20 | 12–18 + 运营 | 12–18 + 运营 | 技术侧相近，v1.2 增加发布幂等与审计，仍在该区间内 |

补充说明：

- 以上为**技术侧**参考区间，不含测试外包、翻译、视频拍摄、内容撰写与客户决策成本。
- 不含 15–20% 的缓冲，建议按阶段单独预留。
- v1.1 到 v1.2 的总量只增加 2 人日（+1%），因为 P1-4 与 P1-7 去重（−3 至 −3）与新增的附件安全、故障降级、SEO 规则矩阵（+5）基本抵消。这不是"改一版涨一次价"，而是把原来漏算的工作显性化。

### 14.3 依赖与并行（S10）

#### 14.3.1 依赖表

| 工作项 | 前置依赖 | 说明 |
|---|---|---|
| P1-1 | — | 起点 |
| P1-2 | P1-1 | 盘点需要稳定的观测与备份能力 |
| P1-3 | P1-2 | 详情页改造依赖资产盘点结果（图片可用性、URL 映射） |
| P1-4 | P1-3 | CTA 与表单挂在详情页上，页面结构未定无法接入 |
| P1-5 | P1-4 | 归因依赖询盘的落地页与 UTM 字段 |
| P1-6 | P1-2 | 状态码与 Tier 判定依赖 `IsPut` 语义与 URL 映射 |
| P1-7 | P1-4 | BOM 复用通用附件能力，不能先于 P1-4 |
| P2-1 | P1-2 | 基准测试需要清洗后的型号样本 |
| P2-2 | P2-1 | 索引参数以基准结果为准 |
| P2-3 | P1-6 | sitemap 扩展依赖 Tier 规则与首批验证结果 |
| P2-5 | P1-5 | 社媒必须绑定 UTM 落地页，否则无法归因 |
| P2-6 | P2-5 | 视频作为社媒内容的一种，复用分发与归因 |
| P3-1 | P1-2 | 文档三层依赖资产盘点与 `PdfId` 抽样 |
| P3-2 | P3-1 | 解析依赖文档资产表 |
| P3-3 | P3-2 | 审核依赖解析产出 |
| P3-4 | P3-3 | 参数化详情只发布已审核参数 |
| P4-* | P3-4、Phase 2 数据 | 智能化依赖参数库与真实流量 |

#### 14.3.2 关键路径

```
P1-1 -> P1-2 -> P1-3 -> P1-4 -> P1-5 -> P2-5 -> P2-6
                    └-> P1-6 -> P2-3
P1-2 -> P3-1 -> P3-2 -> P3-3 -> P3-4
```

可并行：P1-3 与 P1-6（同一阶段不同人）、P2-2 与 P2-3、Phase 3 与 Phase 2 后半段。
不可并行：P1-4 必须在 P1-3 之后；P1-7 必须在 P1-4 之后；P3-2 必须在 P3-1 之后；P3-4 必须在 P3-3 之后。

> v1.1 的依赖图漏了 P1-4→P1-7、P2-5→P1-5、P3-1→P1-2 三条，导致 P1-7 看起来可与 P1-3 并行。实际上 P1-7 复用 P1-4 的附件能力，必须排在 P1-4 之后，否则会重复开发两套上传逻辑。

### 14.4 交付物

1. 稳定性加固清单与验证记录。
2. 资产盘点报告与清洗差异清单。
3. 详情页改造说明与性能报告。
4. 询盘模块（含 4 张表、表单、通知、后台）、故障降级说明与业务验收报告。
5. 归因配置说明与渠道报表。
6. 技术 SEO 基线报告（状态码、索引信号矩阵、Tier 判定、sitemap 增量）。
7. 索引分层抽样报告与规则版本记录。
8. 搜索基准报告、索引构建脚本与运行手册。
9. 搜索服务与降级熔断说明。
10. 文档三层模型 DDL、关联审核记录。
11. 参数解析流水线、质量门与抽检报告。
12. JSON-LD 规范与样例。
13. 五语种词库与发布记录。
14. 社媒/视频模块、发布审计记录与报表。
15. 附件安全规范与 10 条验收用例记录。
16. 备份恢复演练报告（含 RTO/RPO 实测）。
17. 全量回归与性能报告。
18. staging 演练记录与回滚演练记录。

### 14.5 本版授权范围

本版可作为**设计与实施计划依据**，但以下事项仍需单独授权后才能执行：

| 事项 | 前置条件 |
|---|---|
| 创建正式参数表并启动大规模解析 | P0 数据模型评审通过 + B0 批次质量达标 |
| 迁移 1009 万条缓存 | 12 项前置检查全通过 + staging 双读演练完成 |
| 全量构建生产搜索索引 | 6.8 基准测试通过 + 实例规格确认 |
| 五语种全量 SEO 发布 | 首批 L1 sitemap 抓取率与索引率达标 |
| **Tier C 索引策略正式生效** | 8.4.2 判定字段与阈值经甲方确认 + 8.4.4 首月抽样通过 |
| **对任意 URL 执行 410** | 业务书面确认不可恢复 + `snsii_url_policy` 登记 |
| **robots.txt 调整** | 确认不屏蔽需要读取 noindex 的路径（8.4.5） |
| BOM 智能匹配开发 | Phase 3 完成 + 人工工时数据积累 |
| PHP 8 / MySQL 升级执行 | S2 评估报告完成 + S2-D 决策会通过 |
| 主表 MyISAM → InnoDB 迁移 | S3 方案与停机窗口获批 + 磁盘核算通过 |

---

## 15. 技术风险登记册

| # | 风险 | 触发信号 | 缓解 | 回滚 |
|---|---|---|---|---|
| R1 | 索引构建占满 I/O | 线上延迟上升 | 离线环境、限速、错峰 | 暂停构建 |
| R2 | 索引版本异常 | 抽样查询错误 | 版本化 + 别名 | 别名回切 |
| R3 | 深翻页拖垮实例 | 查询延迟飙升 | `maxTotalHits` + 引导 | 降级 MySQL |
| R4 | 参数误解析 | 抽检不达标 | 质量门 + 灰度 | 关闭开关 |
| R5 | 参数归属错误（文档适用性判错） | 客户反馈参数不符 | 类型/主体/关联三重校验 + 抽检 | 单条 ReviewStatus=2 |
| R6 | 缓存切换导致内容不一致 | 同 URL 两种内容 | 按 ProId 取模灰度 + 双读开关 | 调回 `cache_v2_pct=0` |
| R7 | 字符集问题 | 新表日文/符号乱码 | 独立 utf8mb4 连接 + 建表前置检查 | 回退旧字段 |
| R8 | 询盘丢失 | 表单提交成功但库中无记录 | 幂等 + 事务 + 入库失败告警 | 从日志补录 |
| R9 | 通知失败导致线索无人跟进 | `NotifyStatus=2` 连续出现 | 双通道 + 告警 + 后台待办 | 手工补发 |
| R10 | 询盘被重复计数 | GA4 转化数 > 询盘表 | 后端唯一事件源 + `lead_no` 去重 | 报表按库为准 |
| R11 | 软 404 泛滥 | Search Console 覆盖率异常 | 状态码规则 + 抽样 | 收紧规则 |
| R12 | 低质量页面批量入索引 | 索引量激增、排名下降 | 分层策略 + 首批限量 | `index_policy=safe` |
| R13 | 搜索故障压垮老库 | MySQL QPS 突增 | 熔断 + 结果上限 + 超时 | 静态空态页 |
| R14 | 平台 API 变更 | 发布失败率上升 | 适配器隔离 + 半自动 | 停用该平台 |
| R15 | 社媒账号受限 | 限流/封禁 | 多平台分散 + 合规 | 切换账号/渠道 |
| R16 | 磁盘不足 | 使用率 > 90% | 配额 + 告警 + 冻结离线任务 | 清理离线产物 |
| R17 | 依赖漏洞（PHP 7.4 生态） | 扫描告警 | 补丁/WAF + S2 评估 | 回滚版本 |
| R18 | 备份表间不一致（MyISAM 无事务快照） | 恢复演练发现数据对不上 | 分组备份 + 锁表窗口 + 校验脚本 | 重跑备份 |
| R19 | BOM 附件被利用（宏/压缩炸弹/路径穿越） | 扫描告警、异常解压 | 双层校验 + 私有存储 + 隔离区 | 拒绝并隔离 |
| R20 | 索引分层错误导致流量下滑 | Tier C 抽样不达标、排名下降 | 月度抽样 + 阈值可调 + 例外机制 | 回滚到上一版 Tier |
| R21 | 社媒内容重复发布 | 同内容多平台重复出现 | 幂等键 + 尝试表唯一约束 + 平台回查 | 删除多余帖子 |
| R22 | 升级路线无限延期 | S2/S3 决策节点逾期 | 硬性日期 + 逾期升级为 P0 风险 | 上报甲方负责人 |
| R23 | canonical 与 noindex 规则冲突 | 已提交 URL 被 noindex 排除 | 规则矩阵 + 500 条 URL 断言 | 修正规则并重测 |

---

## 附录 A：路由全表

| 老 URL | 控制器动作 |
|---|---|
| `/products/{id8}/{PartUrl}.html` | `pro/item` |
| `/manufacturer/{Links}.html` | `mfr/item` |
| `/sub-categories/c-{Mid}-{Cid}/{Links}.html` | `pro/sub` |
| `/big-categories/c-{Mid}-{Cid}/{Links}.html` | `pro/list` |
| `/products.html` | `pro/index` |
| `/manufacturers.html` | `mfr/index` |
| `/shopping-cart.html` | `cart/index` |
| `/new-products.html` | `pro/new-product` |
| `/blog.html`、`/blog/{Links}.html` | `blog/index` |
| `/blog/details/{Links}.html` | `blog/item` |
| `/blog/tags/{Links}.html` | `blog/tags` |
| `/ejadmin-index.html` | `ejadmin/default/index` |
| `/test/{Act}.html` | `site/test` |
| `/{Links}.html` | `page/info`（兜底） |

## 附录 B：新表 DDL 汇总

| 表 | 章节 | 阶段 |
|---|---|---|
| `snsii_product_attr_dict` | 3.3 | Phase 3 |
| `snsii_product_document_asset` | 3.4.2 | Phase 3 |
| `snsii_product_document_link` | 3.4.3 | Phase 3 |
| `snsii_document_parse_run` | 3.4.4 | Phase 3 |
| `snsii_product_spec` | 3.5.2 | Phase 3 |
| `snsii_product_spec_i18n` | 3.6 | Phase 3 |
| `snsii_product_cache_v2` | 3.7 | Phase 1 |
| `snsii_legacy_url_map` | 3.9 | Phase 1 |
| `snsii_url_policy` | 3.9 | Phase 1 |
| `snsii_page_quality` | 8.4.2 | Phase 1 |
| `snsii_index_exception` | 8.4.3 | Phase 1 |
| `snsii_lead` | 5.3 | Phase 1 |
| `snsii_lead_item` | 5.3 | Phase 1 |
| `snsii_lead_activity` | 5.3 | Phase 1 |
| `snsii_lead_attachment` | 5.3 | Phase 1 |
| `snsii_social_post` | 9.2 | Phase 2 |
| `snsii_social_publish_attempt` | 9.3 | Phase 2 |
| `snsii_social_account` | 9.2 | Phase 2 |
| `snsii_video_asset` | 9.2 | Phase 2 |

## 附录 C：索引 Settings

见 6.4。上线前用真实型号测试集验证日文分词与语言代码，最终值以 6.8 基准结果为准。

## 附录 D：验收用例索引

| 内容 | 章节 |
|---|---|
| 详情页验收 | 4.9 |
| 询盘业务验收 | 5.9 |
| 询盘故障演练 | 5.10.4 |
| 搜索验收 | 6.9 |
| 参数抽检 | 7.10 |
| 索引信号断言 | 8.3.4 |
| 索引分层抽样 | 8.4.4 |
| BOM 附件安全 | 10.3.5 |
| URL 回归 | 13.2 |
| 综合门槛与指标口径 | 13.4 |
| staging 演练 | 13.5 |

## 附录 E：监控阈值

见 12.2。

## 附录 F：术语

| 术语 | 说明 |
|---|---|
| 别名（alias） | 指向具体索引的稳定名称，用于原子切换 |
| 双读（dual read） | 新旧缓存并存，按商品比例分流读取 |
| 软 404 | 内容不存在但返回 200 |
| 质量门 | 参数发布前必须通过的检查集合 |
| 归属判定 | 判断参数是否适用于当前产品，而不只是出现在同一份 PDF 里 |
| 物化 | 把运行时计算提前算好并存储 |
| 幂等 | 同一任务重复执行结果一致 |
| 证据链 | 参数 → 解析运行 → 文档 → 页码/坐标 的可追溯路径 |

## 附录 G：本版未纳入范围

| 项 | 说明 |
|---|---|
| 主表结构变更 | `snsii_product` 1009 万行不动 |
| 框架替换 | 继续使用 Yii2，不迁移 |
| OCR | 扫描版 PDF 首轮不处理 |
| 实时库存/价格对接 | 本期不做供应链系统集成 |
| 多语言内容全量重写 | 只做词库与模板，不重写产品描述 |
| 移动 App / 小程序 | 不在范围内 |

---

**本文档为技术设计，不含实现代码与账号凭据；所有结构变更均需在 staging 演练并获授权后执行。v1.2 的核心结论未变：morrishk 这次升级首先是一个 B2B 获客与询盘转化项目，其次才是搜索、数据解析与 AI 能力升级项目。本版新增的规则矩阵、判定字段与指标口径，都是为了把这句结论变成可验收的工程条款，而不是停留在方向表述上。**
