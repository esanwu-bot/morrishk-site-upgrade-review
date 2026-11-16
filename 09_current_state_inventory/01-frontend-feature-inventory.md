# 01 · 用户前台功能盘点（旧 Yii2 站）

> 对象：`E:\workspace\独立站\morries\newPlan\morrishk.net`（生产代码快照）
> 数据证据：`E:\workspace\独立站\morries\mysql_schema_audit`（2024-11-30 生产库静态导出）
> 说明：本轮未做线上探针。`EXISTS_PRODUCTION` 表示「生产代码 + 生产库数据」可互相印证，**不表示**本轮已重新验证线上可用性。

---

## 1. 模块划分

| 编号段 | 二级模块 |
|---|---|
| FE-01 ～ FE-05 | 首页与全局导航 |
| FE-06 ～ FE-10 | 搜索 |
| FE-11 ～ FE-16 | 分类与列表 |
| FE-17 ～ FE-28 | 商品详情 |
| FE-29 ～ FE-34 | 询盘 / RFQ / 联系 |
| FE-35 ～ FE-38 | 客户账户与订单 |
| FE-39 ～ FE-43 | 多语言与域名 |
| FE-44 ～ FE-51 | SEO、分析与内容 |
| FE-52 ～ FE-55 | 移动端、广告位、订阅、社媒 |

---

## 2. 功能定义

### 2.1 首页与全局导航

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| FE-01 | 首页 | 聚合展示热门商品、品牌、分类入口与公告 | 访客 | 生产库商品/分类/供应商数据 | 首页 HTML | 首页分类取 `Number>100` 且 `Pid=0` 的前 8 个；每类最多 10 个子类 | MySQL、缓存 |
| FE-02 | 顶部工具条 | 邮箱、RFQ 入口、语言入口、电话 | 访客 | 无 | 链接与弹窗 | 邮箱取 `params['SalesEmail']`；语言以 Modal 打开 | `config/params.php` |
| FE-03 | 分类 Mega 菜单 | 多级分类导航 | 访客 | 分类树 | 下拉菜单 | 一级分类在 `SnSiiController::init()` 组装进 `params['CatList']` | 分类表 |
| FE-04 | 制造商入口 | 进入制造商/品牌列表 | 访客 | 供应商表 | 品牌页 | 仅展示 `ProNum>0` 的供应商 | `snsii_supplier` |
| FE-05 | 博客入口 | Blog & Articles / Application / Solution | 访客 | 新闻表 | 列表页 | 三个菜单项均指向同一 `NewsIndex()` | `snsii_news` |

### 2.2 搜索

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| FE-06 | 搜索表单（桌面） | 顶部 MPN 搜索 | 访客 | `PartNumber` 文本 | POST 到 `/search/index` | 仅桌面端有完整表单（`d-none d-lg-flex`） | `views/layouts/header.php:51-58` |
| FE-07 | 关键词搜索 | 按料号前缀检索 | 访客 | 关键词 | 结果列表（每页 50） | `LIKE 'keyword%'`，非全文、无相关性排序、无同义词 | `SearchController.php:47` |
| FE-08 | 零结果处理 | 无结果时转到 RFQ 页 | 访客 | 关键词 | 购物车/RFQ 页面 | 查不到商品直接 `redirect(['/cart/index','part'=>keyword])` | `SearchController.php:60-62` |
| FE-09 | 搜索分页 | 结果分页 | 访客 | 页码 | 分页链接 | `Pagination` 默认 50 条 | `views/search/index.php:17,51-52` |
| FE-10 | 搜索词记录 | 记录搜索词/零结果词 | 运营 | — | — | **无**：代码未写搜索日志，库中无搜索词表 | 无 |

### 2.3 分类与列表

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| FE-11 | 一级分类页 | 展示某大类商品 | 访客 | 分类 `Links`/`Cid` | 商品列表 | `actionList` 按分类取商品 | `ProController.php:81` |
| FE-12 | 子分类页 | 展示子类商品 | 访客 | `Cid`/`Mid` | 商品列表 | `actionSub` | `ProController.php:144` |
| FE-13 | 分类面包屑 | 显示上级分类 | 访客 | 分类 ID | 面包屑 | 取 `SmallRow`→`BigRow` | 分类表 |
| FE-14 | 品牌筛选 | 按制造商筛选 | 访客 | 品牌 ID | 商品列表 | 分类页内按 `Mid` 关联供应商 | `snsii_supplier` |
| FE-15 | 排序/多维筛选 | 价格/库存/参数筛选 | 访客 | — | — | **未发现**：列表无参数分面与排序控件 | 无 |
| FE-16 | 列表缓存 | 列表页缓存 | 系统 | 分类/品牌/页码 | 缓存 JSON | 列表缓存逻辑在代码中被注释，实际未启用 | `ProController.php:220,238` |

### 2.4 商品详情

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| FE-17 | 详情页读取 | 按 8 位 ID 展示商品 | 访客 | 商品 ID | 详情 HTML | 先读 `snsii_product_cache.Json`，无缓存再查主表 | `ProController.php:262-282` |
| FE-18 | URL 形态 | `/products/{id8}/{PartUrl}.html` | 系统 | 商品 ID/PartUrl | 301/200 | `.html` 后缀由 `urlManager.suffix` 固定 | `config/web.php:120-124` |
| FE-19 | 基础信息 | 料号、品牌、描述、图片 | 访客 | 商品行 | 页面区块 | 图片经 `ImgId`/`Image` 处理 | `models/SnSiiProduct.php:81-90` |
| FE-20 | 参数表 | 展示 `DataAttr` 中的键值 | 访客 | `DataAttr` JSON | 参数表 | 键名经 `Yii::t('attr', md5($Name))` 翻译；值为原始文本 | `ProController.php:288-295` |
| FE-21 | 参数来源/证据 | 展示参数出处 | 访客 | — | — | **无**：无文档版本、页码、表格、原文、置信度字段 | 无 |
| FE-22 | Datasheet 入口 | 下载/查看 PDF | 访客 | `Pdf`/`PdfId` | PDF URL | 模型有 `getPdfUrl()`，但详情模板固定输出 `-` | `models/SnSiiProduct.php:99-102`；`views/pro/item.php:114-117` |
| FE-23 | 库存显示 | 显示可售数量 | 访客 | `Quantity`/`InStock` | 文本 | 直接展示 `Quantity`；`snsii_product_stock` 表为空 | `views/pro/item.php:104-106,296-313` |
| FE-24 | 价格显示 | 单价/阶梯价 | 访客 | `UnitPrice`/`PriceNew` | 文本 | `PriceNew` 以 `:` 判断后 JSON 解码为阶梯价；分类 `PriceSwitch/PriceRatio` 已取出但模板未使用 | `views/pro/item.php:24-31,296-313` |
| FE-25 | 交期/最小起订 | 显示交期、MOQ | 访客 | — | — | **未发现**：详情页无交期/MOQ 字段 | 无 |
| FE-26 | 替代料 | 展示可替代型号 | 访客 | — | — | **调查范围内未发现**：无替代料表、无交叉参考逻辑 | 无 |
| FE-27 | 相关推荐 | 同分类推荐 | 访客 | 分类 | 商品卡片 | 推荐逻辑在控制器中被注释，`ProList=[]` | `ProController.php:275-281` |
| FE-28 | 生命周期/RoHS | 展示生命周期与 RoHS | 访客 | `Lifecycle`/`RoHS` | 文本 | 后台可编辑，前台详情模板未渲染 | 商品表字段 |

### 2.5 询盘 / RFQ / 联系

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| FE-29 | 商品页询盘 | 填写公司/联系人/数量/目标价 | 访客 | 表单字段 | 邮件 | **AJAX 直发第三方** `https://wm.zokoko.cn/api/sendEmail`；成功后跳 `/cart/success`；本站不落库 | `views/pro/item.php:195-245` |
| FE-30 | 购物车/RFQ | 会话内维护询价清单 | 访客 | 料号/数量 | 会话 `CartList` | 仅 Session，不写数据库；清空/编辑均操作 Session | `controllers/CartController.php:21-200` |
| FE-31 | RFQ 提交 | 提交整单询价 | 访客 | 订单号 | 邮件 | `actionSend` 用 Yii mailer 发到 `adminEmail` | `controllers/CartController.php:209-232` |
| FE-32 | 联系表单 | `contact-us` 页面提交 | 访客 | 表单 | 入库 `snsii_contact` | 保存成功刷新页面；**不发送邮件** | `controllers/PageController.php:30-40` |
| FE-33 | 热卖商品询盘 | 首页热卖位询盘 | 访客 | 料号/数量 | `snsii_cart` 记录 | `actionHotPart` 写入购物车表 | `controllers/CartController.php:246-270` |
| FE-34 | 询盘归因 | 记录来源/UTM/落地页 | 运营 | — | — | **无**：表单无 UTM/来源字段，第三方接口只收到表单字段 | 无 |

### 2.6 客户账户与订单

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| FE-35 | 客户注册 | 访客注册账户 | 访客 | — | — | **调查范围内未发现** | 无 |
| FE-36 | 客户登录 | 客户登录查看订单/价格 | 访客 | — | — | **不存在客户登录**：唯一登录入口是管理员登录 | `SiteController.php:175-200` |
| FE-37 | 会员价/分级价 | 登录后可见价格 | 客户 | — | — | **未发现**：无客户等级、无价格权限 | 无 |
| FE-38 | 订单跟踪 | 查询历史订单 | 客户 | — | — | 顶部菜单有 `Order tracking`，链接指向 `/`；`snsii_track_order` 表存在但前台无读取代码 | `views/layouts/header.php:32` |

### 2.7 多语言与域名

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| FE-39 | 域名=语种 | 按访问域名决定语言 | 系统 | Host | `Yii::$app->language` | 从 `DuoLang` 取域名对应语言，默认 `en` | `commands/SnSiiController.php:70-79` |
| FE-40 | 语言清单 | 展示可切换语言 | 访客 | 无 | 语言列表 | `DuoLang` 共 80 条 | `config/params.php:12` |
| FE-41 | 语言切换 | 跳转到对应域名 | 访客 | 语言/域名 | 跳转链接 | `LangController::actionList/actionDomain/actionDomainList` | `controllers/LangController.php:41-75` |
| FE-42 | 语言包 | 界面文案翻译 | 系统 | 当前语言 | 文案 | `messages/<lang>/` 共 80 个目录 | `messages/` |
| FE-43 | 语言域名接口 | 输出域名→语言映射 | 系统 | 无 | 列表/JS | `actionDomain` 读取 `params['DuoLangOK']`，但**该参数在代码中未定义** | `controllers/LangController.php:55` |

### 2.8 SEO、分析与内容

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| FE-44 | 页面 Title | 每页标题 | 运营/系统 | 商品/分类 | `<title>` | 控制器调用 `seo(['title'=>...])` | `commands/SnSiiController.php:84-99` |
| FE-45 | Meta Description | 描述标签 | 系统 | 拼接文案 | `<meta name=description>` | 商品页由料号/品牌/描述拼接 | `ProController.php:390-392` |
| FE-46 | Meta Keywords | 关键词标签 | — | — | — | 商品页 keywords 已被注释 | `ProController.php:390` |
| FE-47 | Canonical / OG / JSON-LD | 规范化与结构化数据 | — | — | — | **调查范围内未发现**：`registerMetaTag` 仅注册 keywords/description | 无 |
| FE-48 | hreflang | 多语言互指 | — | — | `<a hreflang>` | 仅在页脚输出语言链接的 `hreflang` 属性，非 `<link rel="alternate">` | `views/layouts/footer.php:123` |
| FE-49 | Sitemap / Robots | 生成并提交站点地图 | 系统 | 商品/分类 | XML、robots.txt | 命令生成分页 sitemap 并 ping Google；`web/txt/<domain>/robots.txt` 已存在 80 份 | `commands/MapController.php:32-210` |
| FE-50 | Google Indexing | 批量提交 URL | 系统 | URL 文件 | Indexing API 调用 | 代码存在，使用服务账号密钥文件；是否仍有定时任务未验证 | `commands/CController.php:115-147` |
| FE-51 | 分析标签 | GA4/GTM/Yandex/Clarity | 系统 | 容器 ID | 前端脚本 | 4 类标签硬编码在布局 | `views/layouts/main.php:20-27,39-47,54-56,61-63,111` |

### 2.9 内容、移动端与其余

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| FE-52 | 博客列表/详情/标签 | 新闻资讯 | 访客 | 新闻表 | 列表/详情 | `BlogController::actionIndex/actionItem/actionTags` | `controllers/BlogController.php:31-103` |
| FE-53 | 信息页/帮助 | About/Contact/Help 等 | 访客 | `snsii_info` | 静态内容页 | `PageController::actionInfo` 按 `Links` 取 | `controllers/PageController.php:30` |
| FE-54 | 制造商/品牌页 | 品牌介绍与商品 | 访客 | `snsii_supplier` | 品牌页 | `MfrController` 按 `Links` 查询 | `controllers/MfrController.php:35-57` |
| FE-55 | 移动端搜索 | 移动端搜索入口 | 访客 | — | — | **不可用**：移动端只有 `<input>`，无 `form`、无 `name`、无提交按钮 | `views/layouts/header.php:74-77` |
| FE-56 | 广告位 | 站内广告展示 | 运营 | `snsii_ad` | 广告区块 | 后台有广告 CRUD，前台**未发现**渲染代码 | `modules/ejadmin/controllers/AdController.php` |
| FE-57 | 邮件订阅 | Newsletter 订阅 | 访客 | 邮箱 | 订阅记录 | **未发现**：模板 JS 有订阅表单处理，但页面无订阅表单、无后端接口 | 无 |
| FE-58 | 社媒分享/关注 | 分享文章、关注账号 | 访客 | 无 | 外链 | 页脚链接为平台首页（非 Morris 账号）；文章分享按钮 `href="#"` | `views/layouts/footer.php:54`、`views/blog/item.php:51` |
| FE-59 | 页面静态缓存 | 页面级缓存 | 系统 | 页面 ID | 缓存 JSON | `snsii/PageCache.php` 引用 `app\models\SnSiiPageCache`，**该类不存在** → 死代码 | `snsii/PageCache.php` |
| FE-60 | Cloudflare 集成 | DNS/域名自动化 | 系统 | 域名/IP | CF API 调用 | `snsii/Cf.php` 含硬编码第三方 API 凭据（本文不复述），属安全风险 | `snsii/Cf.php:20-30` |

---

## 3. 现状判断

> 「仅原型」列：旧站前台功能均在旧代码中，除注明外不依赖后台原型。
> 「重复实现」：与本目录其他系统的同名能力对照，详见 `06`。

| 编号 | 状态 | 证据级别 | 证据 | 仅原型 | 重复实现 | 已知问题 / 待确认 |
|---|---|---|---|---|---|---|
| FE-01 | EXISTS_PRODUCTION | E1 | `SiteController.php:27-129`；生产库分类/商品数据 | 否 | 新平台 `/home` 规划（未实现） | 首页模块是否仍按业务需要排序，待确认 |
| FE-02 | EXISTS_PRODUCTION | E1 | `views/layouts/header.php:24-46` | 否 | 无 | 邮箱/电话为硬编码参数 |
| FE-03 | EXISTS_PRODUCTION | E1 | `commands/SnSiiController.php:30-52` | 否 | 新平台分类导航（组件未落地） | 分类树取数规则固定，无法在后台配置层级 |
| FE-04 | EXISTS_PRODUCTION | E1 | `controllers/MfrController.php`；`snsii_supplier` 数据 | 否 | 后台原型「品牌管理」 | 品牌页与供应商表是同一数据源，口径需确认 |
| FE-05 | EXISTS_PRODUCTION | E1 | `views/layouts/header.php:117-130` | 否 | 无 | 三个菜单指向同一列表，无独立栏目 |
| FE-06 | EXISTS_PRODUCTION | E1 | `views/layouts/header.php:51-58` | 否 | 新平台 `/search` 契约 | POST 搜索，URL 不带关键词参数（刷新丢结果） |
| FE-07 | EXISTS_PRODUCTION | E1 | `SearchController.php:47` | 否 | Meilisearch 规划；新平台 `/search` 契约 | 仅前缀匹配；无模糊/同义词/拼音；大小写与特殊字符未归一 |
| FE-08 | EXISTS_PRODUCTION | E1 | `SearchController.php:60-62` | 否 | 新平台零结果引导（规划） | 零结果直接跳 RFQ，用户可能误以为进入购物车 |
| FE-09 | EXISTS_PRODUCTION | E1 | `views/search/index.php:17,51-52` | 否 | 新平台游标分页 | 页码分页，深度翻页性能未验证 |
| FE-10 | NOT_FOUND | — | 无搜索日志表/写入 | 否 | 后台原型「搜索管理」有零结果词（Demo） | 需确认是否要保留搜索词资产 |
| FE-11 | EXISTS_PRODUCTION | E1 | `ProController.php:81-143` | 否 | 新平台 `/categories/{slug}` | 分类页 URL 与旧站规则绑定，不可改 |
| FE-12 | EXISTS_PRODUCTION | E1 | `ProController.php:144-260` | 否 | 同上 | 子类与品牌组合筛选能力有限 |
| FE-13 | EXISTS_PRODUCTION | E1 | `ProController.php:300-330` | 否 | 无 | 面包屑仅两级 |
| FE-14 | EXISTS_PRODUCTION | E1 | `ProController.php:173` | 否 | 新平台筛选（规划） | 品牌筛选与供应商表耦合 |
| FE-15 | NOT_FOUND | — | 列表模板无排序/分面控件 | 否 | 新平台分面（规划） | 是否需要在冻结 URL 下新增查询参数，需裁决 |
| FE-16 | EXISTS_CODE | E2 | `ProController.php:220,238`（均已注释） | 否 | 新平台缓存规划 | 列表缓存实际未启用 |
| FE-17 | EXISTS_PRODUCTION | E1 | `ProController.php:262-282`；`snsii_product_cache` 约 1,009 万主键 | 否 | 新平台 `/models/{mpn}` | 缓存与主表可能不一致（编辑后未失效） |
| FE-18 | EXISTS_PRODUCTION | E1 | `config/web.php:120-124`；`domain.txt` | 否 | 新平台路由（会改 URL，与 v2.0 冲突） | URL 为 SEO 资产，冻结 |
| FE-19 | EXISTS_PRODUCTION | E1 | `views/pro/item.php:24-39` | 否 | 新平台详情组件 | 图片 CDN 域名 `img2.morrishk.net` 可用性未验证 |
| FE-20 | EXISTS_PRODUCTION | E1 | `ProController.php:288-295`；`product/form.php:112` | 否 | `pd_param_def`/`pd_model`；Ds Bit 参数 | 参数为手工 JSON；无单位/条件/来源结构 |
| FE-21 | NOT_FOUND | — | 无证据字段 | 否 | Ds Bit 证据链（代码存在） | 是否要把证据链引入前台，需产品决策 |
| FE-22 | PARTIAL | E1 | `models/SnSiiProduct.php:99-102`；`views/pro/item.php:114-117` | 否 | 后台原型「Datasheet 文档管理」 | 有 URL 生成能力，但前台未展示；版权/托管未确认 |
| FE-23 | PARTIAL | E1 | `views/pro/item.php:104-106`；`snsii_product_stock` 为空 | 否 | 新平台库存状态组件 | 库存仅有商品表字段，无实时来源 |
| FE-24 | PARTIAL | E1 | `views/pro/item.php:24-31,296-313` | 否 | 新平台 `PriceLadder` 组件 | 阶梯价存在；`PriceSwitch/PriceRatio` 未在模板生效；是否公开价格需确认 |
| FE-25 | NOT_FOUND | — | 详情模板无字段 | 否 | 新平台交期展示（规划） | 交期数据源未知 |
| FE-26 | NOT_FOUND | — | 无替代料表/逻辑 | 否 | 后台原型「替代料」；新平台 `pd_alt` 表 | `pd_alt` 迁移已写但无数据、无前台 |
| FE-27 | EXISTS_CODE | E2 | `ProController.php:275-281`（注释） | 否 | 新平台推荐（规划） | 相关推荐实际关闭 |
| FE-28 | PARTIAL | E2 | `product/form.php:97-98`；详情模板未用 | 否 | 新平台状态展示 | 后台有字段，前台不展示 |
| FE-29 | EXISTS_PRODUCTION | E1 | `views/pro/item.php:195-245`；`snsii_cart` 有生产记录 | 否 | `biz_inquiry` 迁移；后台原型询盘管理 | 直发第三方、不落本站库；第三方服务归属/可用性/数据归属待确认 |
| FE-30 | EXISTS_PRODUCTION | E1 | `CartController.php:21-200`；`snsii_cart` 2,397 | 否 | 无 | Session 购物车，换设备丢失 |
| FE-31 | EXISTS_PRODUCTION | E1 | `CartController.php:209-232`；SMTP 配置 | 否 | `biz_inquiry` | 走 Gmail SMTP；发件成功率未验证 |
| FE-32 | EXISTS_PRODUCTION | E1 | `PageController.php:30-40`；`snsii_contact` 1,606 | 否 | `biz_inquiry` | 只入库不通知；后台无查看入口 |
| FE-33 | EXISTS_PRODUCTION | E2 | `CartController.php:246-270` | 否 | 无 | 热卖询盘写 `snsii_cart`，字段完整性未验证 |
| FE-34 | NOT_FOUND | — | 无 UTM/来源字段 | 否 | 后台原型询盘 UTM（Demo） | 归因口径需业务确认 |
| FE-35 | NOT_FOUND | — | 无注册控制器/视图 | 否 | 后台原型「客户管理」不存在 | 是否需要 B2B 客户账户，需决策 |
| FE-36 | NOT_FOUND | — | `views/user/login.php` 为管理员登录 | 否 | — | 客户与管理员账号未分离 |
| FE-37 | NOT_FOUND | — | 无等级/价格权限 | 否 | 后台原型「价格权限」未建模 | 若做会员价，需先定规则 |
| FE-38 | PARTIAL | E2 | `views/layouts/header.php:32`；`snsii_track_order` 表 | 否 | 新平台订单（无） | 链接无效；表无前台读取代码 |
| FE-39 | EXISTS_PRODUCTION | E1 | `commands/SnSiiController.php:70-79`；80 域名 | 否 | 新平台 5 语种（冲突） | 旧机制与新方案语种清单不一致，见 `07` Q1 |
| FE-40 | EXISTS_PRODUCTION | E1 | `config/params.php:12`；`messages/` 80 | 否 | 新平台 `locales.ts` | 80 域名是否全部保留，需决策 |
| FE-41 | PARTIAL | E2 | `LangController.php:41-75` | 否 | 新平台语言切换 | `actionDomain` 依赖未定义参数，运行会报错 |
| FE-42 | EXISTS_PRODUCTION | E1 | `messages/` 80 目录 | 否 | 新平台 `messages/*.json` | 旧翻译质量/完整性未评估 |
| FE-43 | PARTIAL | E2 | `LangController.php:55`；`params.php` 无 `DuoLangOK` | 否 | 无 | 未定义参数是明确代码缺陷 |
| FE-44 | EXISTS_PRODUCTION | E1 | `commands/SnSiiController.php:84-99` | 否 | 后台原型 SEO 管理（Demo） | 标题模板由代码拼接，运营不可配 |
| FE-45 | EXISTS_PRODUCTION | E1 | `ProController.php:390-392` | 否 | 同上 | 描述为自动拼接，非人工文案 |
| FE-46 | PARTIAL | E2 | `ProController.php:390`（注释） | 否 | 同上 | keywords 已停用 |
| FE-47 | NOT_FOUND | — | 全站无 `canonical`/`og:`/`ld+json` | 否 | 后台原型 SEO 检查（Demo） | 需确认是否新增（会改变页面输出，需授权） |
| FE-48 | PARTIAL | E1 | `views/layouts/footer.php:123` | 否 | 新平台 hreflang 规划 | 非标准 `<link rel=alternate>`，搜索引擎识别有限 |
| FE-49 | EXISTS_CODE | E2 | `commands/MapController.php:32-210`；`web/txt/*/robots.txt` 80 份 | 否 | 无 | 快照中无生成后的 `sitemap/` 目录；线上是否存在未验证 |
| FE-50 | EXISTS_CODE | E2 | `commands/CController.php:115-147` | 否 | 无 | 服务账号密钥路径为服务器绝对路径；是否仍运行未知 |
| FE-51 | EXISTS_PRODUCTION | E1 | `views/layouts/main.php` 多处 | 否 | 后台原型分析（Demo） | GA4 ID 硬编码；无 Consent 管理 |
| FE-52 | EXISTS_PRODUCTION | E1 | `BlogController.php:31-103`；`snsii_news` | 否 | 后台原型内容库 | 博客与新闻同源 |
| FE-53 | EXISTS_PRODUCTION | E1 | `PageController.php:30`；`snsii_info` | 否 | 后台原型站点内容 | 地址文案在代码中硬替换 |
| FE-54 | EXISTS_PRODUCTION | E1 | `MfrController.php:35-57`；`snsii_supplier` | 否 | 后台原型品牌管理 | 无独立品牌内容模型 |
| FE-55 | PARTIAL | E1 | `views/layouts/header.php:74-77` | 否 | 新平台响应式组件 | **移动端搜索不可用**（无 form/name/submit） |
| FE-56 | PARTIAL | E2 | `snsii_ad` 4 行；`AdController`；前台无渲染 | 否 | 后台原型广告位（无） | 后台引用的 `app\models\SnSiiAd` **类不存在**，广告 CRUD 可能直接报错 |
| FE-57 | NOT_FOUND | — | 无订阅表单/接口 | 否 | 后台原型邮件营销（无） | 是否建设邮件订阅需决策 |
| FE-58 | NOT_FOUND | E1 | `footer.php:54` 指向平台首页；`blog/item.php:51` `href="#"` | 否 | 后台原型社媒（Demo） | 现有「社媒」只是占位链接，不是账号运营 |
| FE-59 | EXISTS_CODE | E2 | `snsii/PageCache.php` 引用不存在的模型 | 否 | 新平台缓存 | 死代码；页面缓存未启用 |
| FE-60 | EXISTS_CODE | E2 | `snsii/Cf.php:20-30` | 否 | 无 | 含硬编码第三方凭据，需安全处置（不在本文复述） |

---

## 4. 前台结论摘要

1. **可确认为生产使用的主链路**：首页、分类、前缀搜索、商品详情、参数（手工）、库存/价格（静态字段）、商品页询盘（第三方邮件）、Session RFQ、联系表单入库、80 语种域名、4 类分析标签、博客/信息页/品牌页。
2. **明确不可用或缺失**：移动端搜索、客户账户、订单跟踪、替代料、Datasheet 前台入口、相关推荐、广告前台展示、订阅、社媒账号运营、Canonical/OG/JSON-LD。
3. **代码存在但未证明生产使用**：sitemap/Indexing 命令、页面缓存、Cloudflare 集成、广告后台。
4. **三类系统性缺口**：
   - 参数无来源/证据/单位/条件结构（与 Ds Bit 的能力不衔接）；
   - 询盘直发第三方、不落本站库（与新平台 `biz_inquiry` 规划不衔接）；
   - 80 语种域名机制与新平台 5 语种方案并存（口径冲突）。