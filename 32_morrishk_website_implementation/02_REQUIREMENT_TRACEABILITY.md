# 客户需求与实施任务追踪

| 项目 | 内容 |
|---|---|
| 文档编号 | 32-02 |
| 版本 | V1.0 |
| 需求来源 | 客户商务包 02《项目功能范围确认书》V1.0（未签署） |
| 基线提交 | `cf2210e15ba8085b118cdb3a6e2730e03e51354a` |
| 范围数字 | 227 项：**当前规划建议纳入 119**（保留 32 / 升级 66 / 新建 21）、待确认 104、建议不纳入 4 |
| 新增交付 | 15 项（3 软件 / 9 服务 / 3 运营），全部待确认 |
| 状态口径 | PARTIAL/MISSING 仅表示静态代码存在性，不代表功能验收通过 |

---

## 1. 追踪规则

1. 119 项为**当前规划建议纳入范围**，除非存在独立客户范围确认文件，否则不表述为“已签约范围”；104 项待确认与 15 项新增交付不默认实施。
2. “当前代码证据”来自对 `morrishk-site@cdb9c04` 的静态审计，未运行功能测试。
3. “实施任务”对应 `03_IMPLEMENTATION_BACKLOG.md` 的任务编号。
4. 每项最终验收以客户确认的范围、验收标准与测试证据为准，不以本文档代替。

## 2. 功能域分布（纳入 119）

| 功能域 | 保留 | 升级 | 新建 | 纳入小计 |
|---|---:|---:|---:|---:|
| 用户前台 FR-1 | 15 | 20 | 2 | 37 |
| 商城运营后台 FR-2 | 7 | 14 | 3 | 24 |
| 营销工作台 FR-3 | 2 | 4 | 5 | 11 |
| Ds Bit 产品知识工作台 FR-4 | 2 | 19 | 9 | 30 |
| 平台管理中心 FR-5 | 6 | 9 | 2 | 17 |
| 合计 | 32 | 66 | 21 | 119 |

## 3. 119 项纳入功能逐项追踪
| FR 编号 | 功能名称 | 功能域 | 阶段 | 分类 | 当前代码证据（静态） | 实施任务 | 状态 |
|---|---|---|---|---|---|---|---|
| FR-1-001 | 首页与导航 / 站点首页 | 用户前台 | P3 | 升级 | site/index.php、layouts/header.php | P1-01 首页与全局导航 | PARTIAL |
| FR-1-002 | 首页与导航 / 全局导航与联系入口 | 用户前台 | P3 | 保留 | site/index.php、layouts/header.php | P1-01 首页与全局导航 | PARTIAL |
| FR-1-003 | 首页与导航 / 分类导航 | 用户前台 | P3 | 升级 | site/index.php、layouts/header.php | P1-01 首页与全局导航 | PARTIAL |
| FR-1-004 | 首页与导航 / 制造商/品牌页 | 用户前台 | P3 | 保留 | site/index.php、layouts/header.php | P1-01 首页与全局导航 | PARTIAL |
| FR-1-005 | 首页与导航 / 顶部栏目入口 | 用户前台 | P3 | 保留 | site/index.php、layouts/header.php | P1-01 首页与全局导航 | PARTIAL |
| FR-1-006 | 站内搜索 / 搜索入口 | 用户前台 | P3 | 升级 | SearchController、views/search | P1-02 站内搜索 | PARTIAL |
| FR-1-007 | 站内搜索 / 型号搜索匹配 | 用户前台 | P3 | 升级 | SearchController、views/search | P1-02 站内搜索 | PARTIAL |
| FR-1-008 | 站内搜索 / 零结果处理 | 用户前台 | P3 | 升级 | SearchController、views/search | P1-02 站内搜索 | PARTIAL |
| FR-1-009 | 站内搜索 / 搜索结果分页 | 用户前台 | P3 | 升级 | SearchController、views/search | P1-02 站内搜索 | PARTIAL |
| FR-1-011 | 分类与列表 / 分类页 | 用户前台 | P3 | 保留 | ProController list/sub、views/pro | P1-03 分类/列表 | PARTIAL |
| FR-1-012 | 分类与列表 / 分类筛选 | 用户前台 | P3 | 保留 | ProController list/sub、views/pro | P1-03 分类/列表 | PARTIAL |
| FR-1-013 | 分类与列表 / 面包屑 | 用户前台 | P3 | 保留 | ProController list/sub、views/pro | P1-03 分类/列表 | PARTIAL |
| FR-1-014 | 分类与列表 / 品牌筛选 | 用户前台 | P3 | 保留 | ProController list/sub、views/pro | P1-03 分类/列表 | PARTIAL |
| FR-1-017 | 商品详情 / 商品详情页 | 用户前台 | P3 | 升级 | ProController item、views/pro/item.php | P1-04 商品详情页 | PARTIAL |
| FR-1-018 | 商品详情 / 商品访问地址 | 用户前台 | P3 | 保留 | ProController item、views/pro/item.php | P1-04 商品详情页 | PARTIAL |
| FR-1-019 | 商品详情 / 主图与图集 | 用户前台 | P3 | 保留 | ProController item、views/pro/item.php | P1-04 商品详情页 | PARTIAL |
| FR-1-020 | 商品详情 / 参数表 | 用户前台 | P3 | 升级 | ProController item、views/pro/item.php | P1-04 商品详情页 | PARTIAL |
| FR-1-029 | 询价与联系 / 商品页询价 | 用户前台 | P4 | 升级 | CartController、views/cart、PDP 表单 | P1-05 询盘链路 | PARTIAL |
| FR-1-031 | 询价与联系 / RFQ 提交 | 用户前台 | P4 | 升级 | CartController、views/cart、PDP 表单 | P1-05 询盘链路 | PARTIAL |
| FR-1-032 | 询价与联系 / 联系表单 | 用户前台 | P4 | 升级 | CartController、views/cart、PDP 表单 | P1-05 询盘链路 | PARTIAL |
| FR-1-033 | 询价与联系 / 热卖位询价 | 用户前台 | P4 | 升级 | CartController、views/cart、PDP 表单 | P1-05 询盘链路 | PARTIAL |
| FR-1-034 | 询价与联系 / 询盘归因 | 用户前台 | P4 | 新建 | CartController、views/cart、PDP 表单 | P1-05 询盘链路 | PARTIAL |
| FR-1-039 | 多语言与域名 / 域名对应语种 | 用户前台 | P5 | 保留 | LangController、params.DuoLang、messages | P1-06 多语言/域名 | PARTIAL |
| FR-1-040 | 多语言与域名 / 语言清单 | 用户前台 | P5 | 升级 | LangController、params.DuoLang、messages | P1-06 多语言/域名 | PARTIAL |
| FR-1-041 | 多语言与域名 / 语言切换 | 用户前台 | P5 | 升级 | LangController、params.DuoLang、messages | P1-06 多语言/域名 | PARTIAL |
| FR-1-042 | 多语言与域名 / 界面语言词条 | 用户前台 | P5 | 升级 | LangController、params.DuoLang、messages | P1-06 多语言/域名 | PARTIAL |
| FR-1-043 | 多语言与域名 / 语言域名映射接口 | 用户前台 | P5 | 升级 | LangController、params.DuoLang、messages | P1-06 多语言/域名 | PARTIAL |
| FR-1-044 | SEO 与分析 / 页面标题 | 用户前台 | P5 | 升级 | SnSiiController::seo、MapController、layouts | P1-07 SEO 技术基础 | PARTIAL |
| FR-1-045 | SEO 与分析 / 页面描述 | 用户前台 | P5 | 升级 | SnSiiController::seo、MapController、layouts | P1-07 SEO 技术基础 | PARTIAL |
| FR-1-047 | SEO 与分析 / 规范化与结构化数据 | 用户前台 | P5 | 新建 | SnSiiController::seo、MapController、layouts | P1-07 SEO 技术基础 | PARTIAL |
| FR-1-048 | SEO 与分析 / 多语言互指 | 用户前台 | P5 | 升级 | LangController、params.DuoLang、messages | P1-06 多语言/域名 | PARTIAL |
| FR-1-049 | SEO 与分析 / 站点地图与 robots | 用户前台 | P5 | 升级 | SnSiiController::seo、MapController、layouts | P1-07 SEO 技术基础 | PARTIAL |
| FR-1-050 | SEO 与分析 / 搜索引擎 URL 提交 | 用户前台 | P5 | 保留 | SearchController、views/search | P1-02 站内搜索 | PARTIAL |
| FR-1-051 | SEO 与分析 / 统计分析标签 | 用户前台 | P5 | 保留 | SnSiiController::seo、MapController、layouts | P1-07 SEO 技术基础 | PARTIAL |
| FR-1-052 | 内容与站点 / 新闻/博客 | 用户前台 | P5/P7 | 保留 | BlogController、PageController、views | P1-08 内容页 | PARTIAL |
| FR-1-053 | 内容与站点 / 信息页 | 用户前台 | P5/P7 | 保留 | BlogController、PageController、views | P1-08 内容页 | PARTIAL |
| FR-1-054 | 内容与站点 / 品牌介绍页 | 用户前台 | P5/P7 | 保留 | BlogController、PageController、views | P1-08 内容页 | PARTIAL |
| FR-2-001 | 登录与工作台 / 管理员登录 | 商城运营后台 | P7 | 升级 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-002 | 登录与工作台 / 登出 | 商城运营后台 | P7 | 保留 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-003 | 登录与工作台 / 后台菜单与外壳 | 商城运营后台 | P7 | 升级 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-005 | 登录与工作台 / 个人资料 | 商城运营后台 | P7 | 保留 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-006 | 登录与工作台 / 修改密码 | 商城运营后台 | P7 | 保留 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-007 | 商品管理 / 商品列表 | 商城运营后台 | P3 | 升级 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-008 | 商品管理 / 商品新增 | 商城运营后台 | P3 | 升级 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-009 | 商品管理 / 商品编辑 | 商城运营后台 | P3 | 升级 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-010 | 商品管理 / 上下架 | 商城运营后台 | P3 | 保留 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-011 | 商品管理 / 热销位与库存价 | 商城运营后台 | P3 | 升级 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-013 | 商品管理 / 参数编辑 | 商城运营后台 | P3 | 升级 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-014 | 商品管理 / 生命周期与 RoHS | 商城运营后台 | P3 | 保留 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-017 | 分类与主数据 / 分类列表 | 商城运营后台 | P3 | 升级 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-018 | 分类与主数据 / 属性模板 | 商城运营后台 | P3 | 升级 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-019 | 分类与主数据 / 分类层级管理 | 商城运营后台 | P3 | 升级 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-023 | 交易与客户 / 询盘管理 | 商城运营后台 | P3 | 新建 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-024 | 交易与客户 / 联系表单管理 | 商城运营后台 | P3 | 新建 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-029 | 内容与站点 / 新闻管理 | 商城运营后台 | P5/P6 | 保留 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-031 | 内容与站点 / 信息页管理 | 商城运营后台 | P5/P6 | 保留 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-037 | 内容与站点 / 多语言内容 | 商城运营后台 | P5/P6 | 升级 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-038 | 账号与系统 / 管理员账号 | 商城运营后台 | P5/P6 | 升级 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-039 | 账号与系统 / 角色与权限 | 商城运营后台 | P5/P6 | 升级 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-046 | 账号与系统 / 备份与恢复 | 商城运营后台 | P7 | 新建 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-2-047 | 账号与系统 / 邮件与通知 | 商城运营后台 | P7 | 升级 | modules/ejadmin（10 控制器） | P1-09 商城运营后台 | PARTIAL |
| FR-3-005 | SEO 与 GEO / 页面标题与描述 | 营销工作台 | P5 | 升级 | 无独立模块/页面证据 | P1-10 营销工作台 | MISSING |
| FR-3-006 | SEO 与 GEO / 站点地图与 robots | 营销工作台 | P5 | 升级 | 无独立模块/页面证据 | P1-10 营销工作台 | MISSING |
| FR-3-007 | SEO 与 GEO / 搜索引擎验证与提交 | 营销工作台 | P5 | 保留 | 无独立模块/页面证据 | P1-10 营销工作台 | MISSING |
| FR-3-016 | 内容生产 / 内容编辑 | 营销工作台 | P5 | 保留 | 无独立模块/页面证据 | P1-10 营销工作台 | MISSING |
| FR-3-030 | 邮件与线索 / 线索采集 | 营销工作台 | P6 | 升级 | 无独立模块/页面证据 | P1-10 营销工作台 | MISSING |
| FR-3-031 | 邮件与线索 / 线索管理 | 营销工作台 | P6 | 新建 | 无独立模块/页面证据 | P1-10 营销工作台 | MISSING |
| FR-3-034 | 邮件与线索 / 线索归因 | 营销工作台 | P6 | 新建 | 无独立模块/页面证据 | P1-10 营销工作台 | MISSING |
| FR-3-035 | 分析与协作 / 流量分析 | 营销工作台 | P6 | 升级 | 无独立模块/页面证据 | P1-10 营销工作台 | MISSING |
| FR-3-036 | 分析与协作 / 转化分析 | 营销工作台 | P6 | 新建 | 无独立模块/页面证据 | P1-10 营销工作台 | MISSING |
| FR-3-038 | 分析与协作 / 渠道对比 | 营销工作台 | P6 | 新建 | 无独立模块/页面证据 | P1-10 营销工作台 | MISSING |
| FR-3-040 | 分析与协作 / 外链与公关 | 营销工作台 | P6 | 新建 | 无独立模块/页面证据 | P1-10 营销工作台 | MISSING |
| FR-4-001 | 文档与任务 / 文档上传 | Ds Bit 产品知识工作台 | P2 | 升级 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-002 | 文档与任务 / 文档身份 | Ds Bit 产品知识工作台 | P2 | 升级 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-003 | 文档与任务 / 文档分类 | Ds Bit 产品知识工作台 | P2 | 升级 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-004 | 文档与任务 / 解析任务 | Ds Bit 产品知识工作台 | P2 | 升级 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-005 | 文档与任务 / 解析运行产物 | Ds Bit 产品知识工作台 | P2 | 升级 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-006 | 文档与任务 / 运行回放 | Ds Bit 产品知识工作台 | P2 | 升级 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-007 | 文档与任务 / 批量处理 | Ds Bit 产品知识工作台 | P2 | 升级 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-008 | 表格与参数 / 表格检测 | Ds Bit 产品知识工作台 | P2 | 升级 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-009 | 表格与参数 / 表格重建 | Ds Bit 产品知识工作台 | P2 | 升级 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-010 | 表格与参数 / 表头语义 | Ds Bit 产品知识工作台 | P2 | 升级 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-011 | 表格与参数 / 候选生成 | Ds Bit 产品知识工作台 | P2 | 升级 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-012 | 表格与参数 / 参数抽取 | Ds Bit 产品知识工作台 | P2 | 升级 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-013 | 表格与参数 / 单位处理 | Ds Bit 产品知识工作台 | P2 | 升级 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-014 | 表格与参数 / 适用条件 | Ds Bit 产品知识工作台 | P2 | 升级 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-016 | 表格与参数 / 型号归一 | Ds Bit 产品知识工作台 | P2 | 升级 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-017 | 证据与审核 / 证据记录 | Ds Bit 产品知识工作台 | P2 | 升级 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-018 | 证据与审核 / 证据一致性校验 | Ds Bit 产品知识工作台 | P2 | 升级 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-019 | 证据与审核 / 不变量校验 | Ds Bit 产品知识工作台 | P2 | 升级 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-020 | 证据与审核 / 质量状态 | Ds Bit 产品知识工作台 | P2 | 升级 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-021 | 证据与审核 / 人工审核 | Ds Bit 产品知识工作台 | P2 | 新建 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-023 | 证据与审核 / 发布授权 | Ds Bit 产品知识工作台 | P2 | 新建 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-024 | 证据与审核 / 发布记录 | Ds Bit 产品知识工作台 | P2 | 新建 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-025 | 证据与审核 / 三层闸门 | Ds Bit 产品知识工作台 | P2 | 新建 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-027 | 系统对接 / 产品与文档关联 | Ds Bit 产品知识工作台 | P2 | 新建 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-028 | 系统对接 / 商城后台对接 | Ds Bit 产品知识工作台 | P2 | 新建 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-029 | 系统对接 / 参数持久化 | Ds Bit 产品知识工作台 | P2 | 新建 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-030 | 系统对接 / 任务队列 | Ds Bit 产品知识工作台 | P2 | 新建 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-031 | 系统对接 / 运行监控 | Ds Bit 产品知识工作台 | P2 | 保留 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-032 | 系统对接 / 访问控制 | Ds Bit 产品知识工作台 | P2 | 保留 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-4-034 | 系统对接 / 前端工作台 | Ds Bit 产品知识工作台 | P2 | 新建 | 站点仓库无实现；依赖 Session B/流水线 | P2-01 Ds Bit 能力 | DEPENDENCY |
| FR-5-001 | 账号与认证 / 管理员登录 | 平台管理中心 | P7 | 升级 | modules/ejadmin（账号/权限/配置） | P1-11 平台管理 | PARTIAL |
| FR-5-002 | 账号与认证 / 登出 | 平台管理中心 | P7 | 保留 | modules/ejadmin（账号/权限/配置） | P1-11 平台管理 | PARTIAL |
| FR-5-005 | 账号与认证 / 管理员账号列表 | 平台管理中心 | P7 | 保留 | modules/ejadmin（账号/权限/配置） | P1-11 平台管理 | PARTIAL |
| FR-5-006 | 账号与认证 / 账号新增与编辑 | 平台管理中心 | P7 | 升级 | modules/ejadmin（账号/权限/配置） | P1-11 平台管理 | PARTIAL |
| FR-5-008 | 账号与认证 / 个人资料与改密 | 平台管理中心 | P7 | 保留 | modules/ejadmin（账号/权限/配置） | P1-11 平台管理 | PARTIAL |
| FR-5-009 | 角色与权限 / 角色定义 | 平台管理中心 | P7 | 升级 | modules/ejadmin（账号/权限/配置） | P1-11 平台管理 | PARTIAL |
| FR-5-011 | 角色与权限 / 菜单级授权 | 平台管理中心 | P7 | 升级 | modules/ejadmin（账号/权限/配置） | P1-11 平台管理 | PARTIAL |
| FR-5-012 | 角色与权限 / 操作级鉴权 | 平台管理中心 | P7 | 升级 | modules/ejadmin（账号/权限/配置） | P1-11 平台管理 | PARTIAL |
| FR-5-027 | 系统配置 / 语言与域名配置 | 平台管理中心 | P7 | 升级 | modules/ejadmin（账号/权限/配置） | P1-11 平台管理 | PARTIAL |
| FR-5-032 | API 管理 / 接口契约 | 平台管理中心 | P7 | 保留 | modules/ejadmin（账号/权限/配置） | P1-11 平台管理 | PARTIAL |
| FR-5-033 | API 管理 / 接口实现 | 平台管理中心 | P7 | 新建 | modules/ejadmin（账号/权限/配置） | P1-11 平台管理 | PARTIAL |
| FR-5-035 | API 管理 / 接口鉴权与限流 | 平台管理中心 | P7 | 新建 | modules/ejadmin（账号/权限/配置） | P1-11 平台管理 | PARTIAL |
| FR-5-036 | API 管理 / 健康检查 | 平台管理中心 | P7 | 保留 | modules/ejadmin（账号/权限/配置） | P1-11 平台管理 | PARTIAL |
| FR-5-039 | 多语言配置 / 新版语种清单 | 平台管理中心 | P5 | 升级 | modules/ejadmin（账号/权限/配置） | P1-11 平台管理 | PARTIAL |
| FR-5-040 | 多语言配置 / 消息词库 | 平台管理中心 | P5 | 升级 | modules/ejadmin（账号/权限/配置） | P1-11 平台管理 | PARTIAL |
| FR-5-041 | 多语言配置 / 路由前缀与互指 | 平台管理中心 | P5 | 升级 | modules/ejadmin（账号/权限/配置） | P1-11 平台管理 | PARTIAL |
| FR-5-043 | 多语言配置 / 后台界面语言 | 平台管理中心 | P5 | 保留 | modules/ejadmin（账号/权限/配置） | P1-11 平台管理 | PARTIAL |
## 4. 104 项待确认功能

104 项全部为 `待确认`，不进入本期开发与报价。客户逐项选择“纳入/推迟/不纳入”后，再进入范围与报价评估。重点示例：

| FR | 功能 | 影响 |
|---|---|---|
| FR-1-021 | 参数证据展示 | PDP 可信度 |
| FR-1-022 | Datasheet 获取 | 采购决策 |
| FR-1-023 | 库存状态 | 询盘承接 |
| FR-1-024 | 价格与阶梯价 | 询价转化 |
| FR-1-025 | 交期 | 询盘承接 |
| FR-1-026 | 替代料 | 型号替换/交叉参考页 |
| FR-1-030 | RFQ 清单 | 多型号询价 |
| FR-1-035…038 | 客户注册/登录/会员价/订单跟踪 | 账户体系 |
| FR-2-004 | 后台首页 | 运营效率 |
| FR-2-041 | 日志写入接口 | 审计 |
| FR-5-018 | 审计导出 | 合规 |
| FR-5-044 | 内容多语版本 | 后续语种 |

## 5. 15 项新增交付（全部待确认）

| 编号 | 类别 | 名称 | 本轮状态 |
|---|---|---|---|
| FR-1-061 | 软件 | 询盘转化事件与归因数据层 | 待确认；未实现 |
| FR-1-062 | 软件 | 重点落地页模板与组件 | 待确认；未实现 |
| FR-3-042 | 软件 | 旧域名/URL 迁移工具与回归脚本 | 待确认；未实现 |
| SD-01 | 服务 | SEO/询盘基线与数据接入 | 待确认；依赖账号 |
| SD-02 | 服务 | 重点产品池与关键词台账 | 待确认；单独报价 |
| SD-03 | 服务 | 首批落地页清单与发布台账 | 待确认 |
| SD-04 | 服务 | 旧域名/URL 盘点、映射与迁移管理 | 待确认；依赖旧 URL |
| SD-05 | 服务 | 有效询盘判定与归因口径 | 待确认；依赖审核人 |
| SD-06 | 服务 | 账号与数据归属及权限移交 | 待确认 |
| SD-07 | 服务 | 第三方费用与采购归属台账 | 待确认 |
| SD-08 | 服务 | 客户意见响应与对齐矩阵 | 待确认 |
| SD-09 | 服务 | 交付计划与前置条件 | 待确认 |
| OPS-01 | 运营 | 月度 SEO 运营 | 待确认 |
| OPS-02 | 运营 | 上线后监测与整改 | 待确认 |
| OPS-03 | 运营 | 月度报告与验收支持 | 待确认 |

## 6. 覆盖缺口（静态判断）

| 缺口 | 说明 | 影响任务 |
|---|---|---|
| 营销工作台 | 站点仓库无对应模块 | P1-10 |
| Ds Bit 能力 | 站点仓库无实现，依赖 Session B/流水线 | P2-01 |
| 询盘事件与归因 | 现有 GA4/GTM 无 `rfq_*` 事件实现 | P1-05、P2-05 |
| 发布门禁/审计 | 未见 `RELEASE_APPROVED`、操作级 RBAC、审计日志 | P1-11 |
| 迁移工具 | 无旧 URL 台账、301 工具、回归脚本 | P2-02 |

> 本文档不把“代码存在”写成“功能通过”；所有 119 项仍需按 32-05 的测试与验收计划取证。