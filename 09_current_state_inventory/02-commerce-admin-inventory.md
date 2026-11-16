# 02 · 商城运营后台功能盘点（旧 Yii2 `modules/ejadmin`）

> 对象：`E:\workspace\独立站\morries\newPlan\morrishk.net\modules\ejadmin`
> 规模：10 个控制器、**43 个 action**（`grep -h "public function action"` 计数）
> 说明：后台判断基于代码与 2024-11-30 库结构导出；本轮未登录生产后台、未执行任何写操作。

---

## 1. 后台整体结构

```text
modules/ejadmin/
├── controllers/  Account  Ad  Api  Category  Default  Help  Info  Manage  News  Product
├── models/       *Search 查询模型 + SnSiiProduct / SnSiiNav / SnSiiManage
└── views/        account ad category default help info layouts manage news product
```

- 菜单并非硬编码：由 `snsii_nav` 表 + 当前用户 `snsii_manage.NavList` 动态生成（`views/layouts/header.php:16-43`）。
- 登录：与前台共用 `SiteController::actionLogin`，成功后跳 `/ejadmin-index`（`controllers/SiteController.php:175-200`）。
- 鉴权：`AdminController::behaviors()` 用 `AccessControl` 要求登录（`commands/AdminController.php:38-58`）；**未见按角色/按 action 的服务端权限判断**，`NavList` 只影响菜单可见性。
- 后台语言被强制设为 `zh-CN`（`commands/AdminController.php:30`）。

---

## 2. 功能定义

### 2.1 登录、外壳与总览

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| CA-01 | 管理员登录 | 账号密码登录 | 管理员 | 用户名/密码 | 会话 | 登录成功跳 `/ejadmin-index`；失败回显错误 | `snsii_manage`、`LoginForm` |
| CA-02 | 登出 | 退出登录 | 管理员 | 无 | 回首页 | `SiteController::actionLogout` | Session |
| CA-03 | 后台外壳/菜单 | 按权限渲染菜单 | 管理员 | `NavList` | 导航 | `NavList` 为空且 `UserId=1` 时显示全部菜单 | `snsii_nav` |
| CA-04 | 后台首页 | 登录后的默认页 | 管理员 | 无 | 页面 | **实际是图标展示页**（"New Icons / iOS 7 inspired vector icons"），无业务 KPI | `views/default/index.php:7` |
| CA-05 | 个人资料 | 查看/修改本人信息 | 管理员 | 资料 | 保存 | `AccountController::actionMy` | `snsii_manage` |
| CA-06 | 修改密码 | 修改本人密码 | 管理员 | 旧/新密码 | 密码哈希 | `generatePasswordHash` | `AccountController.php:35-60` |

### 2.2 商品

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| CA-07 | 商品列表 | 分页查看/搜索商品 | 运营 | 关键词/分类 | 列表 | `actionIndex`；列表含 `PartNumber` 等列 | `snsii_product` |
| CA-08 | 商品新增 | 创建商品 | 运营 | 基础字段+参数 | 新商品 | 自动生成 `PartUrl`（`Str::getLinks`）与 `Md5`；同步插入 `snsii_product_search` | 商品表、搜索表 |
| CA-09 | 商品编辑 | 修改商品 | 运营 | 字段 | 更新 | `actionEdit`；**无版本/审批** | 商品表 |
| CA-10 | 上下架/状态 | 切换 `IsPut` | 运营 | 状态值 | 行内 AJAX | `IsPut` 直接保存；无发布检查 | 商品表 |
| CA-11 | 热销位/库存价 | 设置首页热销、数量、单价 | 运营 | 数量/单价 | 热销记录 + 主表更新 | 同时写 `snsii_product_hot` 并 `UPDATE snsii_product` | 热销表、商品表 |
| CA-12 | 商品删除 | 删除商品 | — | — | — | **未发现**：`ProductController` 无 `actionDelete` | 无 |
| CA-13 | 参数编辑 | 编辑 `DataAttr` | 运营 | JSON/键值文本 | 参数文本 | 表单为 8 行 textarea，手工维护 JSON；无单位/来源校验 | `product/form.php:112` |
| CA-14 | 生命周期/RoHS | 设置生命周期与 RoHS | 运营 | 下拉值 | 字段 | 仅存字段，前台未渲染 | `product/form.php:97-98` |
| CA-15 | 批量导入/导出 | Excel/CSV 导入导出 | — | — | — | **未发现**：无导入控制器/脚本 | 无 |
| CA-16 | 商品 SEO 字段 | 单独维护 Title/Description | 运营 | — | — | **未发现**：商品表无 SEO 字段，标题由控制器拼接 | `ProController.php:390-392` |

### 2.3 分类、属性、品牌与供应商

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| CA-17 | 分类列表 | 查看/快速编辑分类 | 运营 | 分类字段 | 更新 | 行内编辑；可改 `PriceSwitch` | `snsii_product_category` |
| CA-18 | 属性模板 | 维护属性名称 | 运营 | 属性名 | 属性记录 | `CategoryController::actionAttr`，行内编辑 | `snsii_attr_name` |
| CA-19 | 分类层级 | 新增/删除分类 | 运营 | 分类信息 | 分类树 | **未发现完整 CRUD**：仅有列表与行内编辑，无独立新增/删除 action | 分类表 |
| CA-20 | 品牌管理 | 品牌资料维护 | — | — | — | **未发现独立品牌后台**：品牌来自 `snsii_supplier`，仅作为商品表单下拉 | `SnSiiSupplier` |
| CA-21 | 供应商管理 | 供应商增删改 | — | — | — | **未发现后台入口**；仅有 console `SupplierController::actionProNum` 统计商品数 | `snsii_supplier` |
| CA-22 | 属性翻译 | 多语言属性名 | 运营 | 译文 | `snsii_attr_name_lang` | 表存在；后台未见维护入口 | `snsii_attr_name_lang` |

### 2.4 交易、客户与询盘

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| CA-23 | 询盘管理 | 查看/处理商品询盘 | 销售 | — | — | **未发现**：商品页询盘直发第三方，本站无记录可管 | 无 |
| CA-24 | 联系表单管理 | 查看 contact-us 提交 | 销售 | — | — | **未发现**：`snsii_contact` AUTO_INCREMENT 1,606，但后台无对应控制器 | `snsii_contact` |
| CA-25 | 购物车/订单管理 | 查看 RFQ/订单 | 销售 | — | — | **未发现后台入口**：`snsii_cart` AUTO_INCREMENT 2,397，仅前台写入 | `snsii_cart` |
| CA-26 | 客户管理 | 客户资料/等级 | — | — | — | **未发现**：无客户表、无客户控制器 | 无 |
| CA-27 | 报价/合同 | 报价单与合同 | — | — | — | **未发现** | 无 |
| CA-28 | 订单跟踪 | 维护物流/订单状态 | — | — | — | `snsii_track_order` 表存在，但无后台 CRUD 与前台读取 | 表存在 |

### 2.5 内容与站点

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| CA-29 | 新闻/博客 CRUD | 新闻增删改与分类 | 运营 | 标题/正文/分类 | 文章 | `NewsController` 8 个 action；`IsPut` 状态切换 | `snsii_news` |
| CA-30 | 帮助中心 CRUD | 帮助文章与分类 | 运营 | 内容 | 帮助页 | `HelpController` 8 个 action；**引用的 `SnSiiHelp` / `SnSiiHelpCategory` 模型类不存在** | `snsii_help`（表不在 31 表清单） |
| CA-31 | 信息页 CRUD | About/Contact 等信息页 | 运营 | 内容 | 信息页 | `InfoController` 8 个 action | `snsii_info` |
| CA-32 | 内容审核 | 发布前审核 | — | — | — | **未发现**：内容保存即生效，无审核状态机 | 无 |
| CA-33 | 内容版本 | 版本/回滚 | — | — | — | **未发现** | 无 |
| CA-34 | 广告管理 | 广告增改与图表 | 运营 | 广告名/链接 | 广告记录 | 列表/新增/编辑存在；**引用的 `app\models\SnSiiAd` 类不存在**；视图含 delete 链接但控制器无 delete action | `snsii_ad`（4 行） |
| CA-35 | 导航管理 | 维护后台/前台导航 | — | — | — | **未发现 CRUD**：`snsii_nav` 仅被读取用于菜单与权限分配 | `snsii_nav` |
| CA-36 | 站点基础配置 | 站点参数/SEO 默认值 | — | — | — | **未发现后台配置页**：参数写死在 `config/params.php` | 无 |
| CA-37 | 多语言内容 | 同一条内容的多语版本 | 运营 | 译文 | 多语内容 | 属性有 `_lang` 表；商品 `DataAttr` 为单语文本；无统一多语内容管理 | 多个表 |

### 2.6 账号、权限与系统

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| CA-38 | 管理员账号 | 管理员增删改 | 超级管理员 | 账号/角色/菜单 | 账号记录 | `ManageController` 仅操作 `Role=2` 的账号 | `snsii_manage` |
| CA-39 | 角色/权限 | 角色与菜单授权 | 超级管理员 | `Role`/`NavList` | 菜单可见性 | 只有菜单级授权；**无 action 级权限校验** | `snsii_manage`、`snsii_nav` |
| CA-40 | 审计日志 | 记录后台操作 | 管理员 | 操作 | 日志 | **未发现**：无审计表、无写入；`snsii_cf_logs` 是 Cloudflare 日志 | 无 |
| CA-41 | 操作日志接口 | 接收外部日志写入 | 系统 | 日志字段 | 写 `snsii_all_logs` | `ApiController` 继承前台基类，**未要求登录**、关闭 CSRF；该表不在 31 表审计清单中 | `snsii_all_logs`（待核实） |
| CA-42 | 报表/看板 | 销售/流量/商品报表 | 运营 | — | — | **未发现**：首页是图标页；广告有 `actionChart` 单图 | 无 |
| CA-43 | 图片/媒体库 | 上传与管理图片 | 运营 | 文件 | 图片 URL | **未发现统一媒体库**；商品图片字段手工维护；购物车图片上传走第三方 | `web/upload` |
| CA-44 | 缓存管理 | 清理/重建缓存 | 运维 | — | — | **未发现后台入口**；缓存重建靠 console 命令 | 缓存 |
| CA-45 | 定时任务/队列 | 任务编排与监控 | 运维 | — | — | **未发现**：只有 console 命令，无调度配置/监控界面 | 服务器 cron |
| CA-46 | 数据备份/恢复 | 备份数据库 | 运维 | — | — | **未发现** | 无 |
| CA-47 | 邮件/通知 | 模板与发送记录 | 运营 | — | 邮件 | 仅 SMTP 配置；无模板管理、无发送日志 | `config/web.php` |
| CA-48 | MFA/SSO | 双因素/单点登录 | 管理员 | — | — | **未发现** | 无 |

---

## 3. 现状判断

| 编号 | 状态 | 证据级别 | 证据 | 仅原型 | 重复实现 | 已知问题 / 待确认 |
|---|---|---|---|---|---|---|
| CA-01 | EXISTS_PRODUCTION | E1 | `SiteController.php:175-200`；`snsii_manage` 195 | 否 | 后台原型「个人账号」 | 管理员与客户共用登录入口 |
| CA-02 | EXISTS_PRODUCTION | E1 | `SiteController.php:204-212` | 否 | 同上 | 无 |
| CA-03 | EXISTS_PRODUCTION | E1 | `modules/ejadmin/views/layouts/header.php:16-43` | 否 | 后台原型「菜单/权限」 | 菜单数据在库，快照无数据，无法逐项核对死链 |
| CA-04 | EXISTS_CODE | E2 | `DefaultController.php:17`；`views/default/index.php:7` | 否 | 后台原型「经营概览」 | **无业务总览**，只是图标示例页 |
| CA-05 | EXISTS_PRODUCTION | E1 | `AccountController.php:26` | 否 | 后台原型「个人账号」 | 无 |
| CA-06 | EXISTS_PRODUCTION | E1 | `AccountController.php:35-60` | 否 | 同上 | 密码策略未知 |
| CA-07 | EXISTS_PRODUCTION | E1 | `ProductController.php:32-89`；`snsii_product` 约 1,009 万 | 否 | 后台原型「商品管理」 | 10M 级主表上的搜索/分页性能未测 |
| CA-08 | EXISTS_PRODUCTION | E1 | `ProductController.php:90-120` | 否 | 后台原型「商品新增」 | 新增同步写搜索表，失败时无事务 |
| CA-09 | EXISTS_PRODUCTION | E1 | `ProductController.php:172+` | 否 | 后台原型「商品详情页管理」 | 无审批、无版本；详情缓存不失效 |
| CA-10 | EXISTS_PRODUCTION | E1 | `ProductController.php:70-72` | 否 | 后台原型「上下架」 | 无发布检查/定时发布 |
| CA-11 | EXISTS_PRODUCTION | E1 | `ProductController.php:125-172` | 否 | 后台原型「库存与价格」 | 直接改主表数量/单价；无变更审计 |
| CA-12 | NOT_FOUND | — | 控制器无 delete | 否 | 后台原型商品删除（有） | 是否需要删除/软删需决策 |
| CA-13 | EXISTS_PRODUCTION | E1 | `product/form.php:51-57,112` | 否 | `pd_param_def`；Ds Bit 参数 | 手工 JSON；键名用 md5 翻译；无校验/单位 |
| CA-14 | PARTIAL | E2 | `product/form.php:97-98` | 否 | 新平台状态展示 | 前台不展示 |
| CA-15 | NOT_FOUND | — | 无导入代码 | 否 | 新平台数据加载脚本（`seed_dev.php`） | 10M 商品如何维护需裁决 |
| CA-16 | NOT_FOUND | — | 商品表无 SEO 字段 | 否 | 后台原型 SEO 管理 | 现有 SEO 由代码拼接 |
| CA-17 | EXISTS_PRODUCTION | E1 | `CategoryController.php:31-73` | 否 | 后台原型「分类管理」 | 行内编辑直接保存 |
| CA-18 | EXISTS_PRODUCTION | E1 | `CategoryController.php:74-120` | 否 | 后台原型「属性模板」 | 无删除/排序 |
| CA-19 | PARTIAL | E2 | 仅 `actionIndex/actionAttr` | 否 | 后台原型分类树 | 无完整增删改 |
| CA-20 | NOT_FOUND | — | 无品牌控制器 | 否 | 后台原型「品牌管理」 | 品牌=供应商，口径需确认 |
| CA-21 | NOT_FOUND | — | 仅 console `SupplierController` | 否 | 后台原型「品牌管理」 | 供应商主数据无后台维护 |
| CA-22 | PARTIAL | E2 | 表存在，无后台入口 | 否 | 新平台多语种 | 属性翻译如何维护未知 |
| CA-23 | NOT_FOUND | — | 无控制器；询盘不落库 | 否 | 后台原型「询盘管理」；`biz_inquiry` | 现有询盘数据在第三方，是否回收需决策 |
| CA-24 | NOT_FOUND | — | `snsii_contact` 1,606，无后台读取 | 否 | 同上 | 历史联系数据无查看入口 |
| CA-25 | NOT_FOUND | — | `snsii_cart` 2,397，无后台读取 | 否 | 同上 | RFQ 数据仅存于库，无处理流程 |
| CA-26 | NOT_FOUND | — | 无客户表/控制器 | 否 | 后台原型无客户管理 | 是否需要客户主数据 |
| CA-27 | NOT_FOUND | — | 无 | 否 | 无 | — |
| CA-28 | PARTIAL | E2 | `snsii_track_order` 表；无 CRUD/读取 | 否 | 无 | 表用途待确认 |
| CA-29 | EXISTS_PRODUCTION | E1 | `NewsController.php:32-175` | 否 | 后台原型「站点内容」 | 保存即发布，无审核 |
| CA-30 | PARTIAL | E2 | `HelpController.php:19-22,32-170`；`models/` 无 `SnSiiHelp*`；31 表无 `snsii_help` | 否 | 后台原型「帮助中心」 | **代码引用不存在的模型类，模块不可执行**；前台也无 help 路由 |
| CA-31 | EXISTS_PRODUCTION | E1 | `InfoController.php:32-170` | 否 | 后台原型「信息页」 | 同上 |
| CA-32 | NOT_FOUND | — | 无审核字段/流程 | 否 | 后台原型「内容审核」；三层闸门 | 内容审核只在原型/设计中 |
| CA-33 | NOT_FOUND | — | 无版本表 | 否 | 后台原型「知识版本」 | 同上 |
| CA-34 | PARTIAL | E2 | `AdController.php:19-67`；`snsii_ad` 4 行 | 否 | 无 | **模型类缺失**、delete 链接无对应 action、前台不展示 |
| CA-35 | NOT_FOUND | — | 无 nav CRUD | 否 | 后台原型「菜单管理」 | 菜单需直接改库 |
| CA-36 | NOT_FOUND | — | 配置在 `params.php` | 否 | 后台原型「系统设置」 | 改配置需改代码 |
| CA-37 | PARTIAL | E2 | `snsii_attr_name_lang`；商品单语 | 否 | 新平台 5 语种 | 多语内容无统一入口 |
| CA-38 | EXISTS_PRODUCTION | E1 | `ManageController.php:27-87` | 否 | 后台原型「用户管理」 | 仅管理 `Role=2` |
| CA-39 | PARTIAL | E2 | `NavList` 菜单过滤；`AccessControl` 仅要求登录 | 否 | 后台原型「角色与权限」 | **无 action 级授权**；越权风险需评估 |
| CA-40 | NOT_FOUND | — | 无审计表/写入 | 否 | 后台原型「操作审计」 | 无操作留痕 |
| CA-41 | EXISTS_CODE | E2 | `ApiController.php:22-45`；`snsii_all_logs` 不在审计表清单 | 否 | 后台原型审计 | 未鉴权写入；目标表可能不存在 |
| CA-42 | NOT_FOUND | — | 首页图标页；仅广告 chart | 否 | 后台原型「经营概览/分析」 | 无经营报表 |
| CA-43 | PARTIAL | E2 | `web/upload`；商品图片字段 | 否 | 后台原型媒体库（无） | 无统一上传/裁剪/去重 |
| CA-44 | NOT_FOUND | — | 仅 console | 否 | 无 | 缓存重建靠命令 |
| CA-45 | NOT_FOUND | — | 仅 console | 否 | 后台原型「任务监控」 | 无调度与监控 |
| CA-46 | NOT_FOUND | — | 无 | 否 | 无 | — |
| CA-47 | PARTIAL | E2 | `config/web.php:49-60` SMTP | 否 | 后台原型通知 | 明文 SMTP 配置；无发送日志 |
| CA-48 | NOT_FOUND | — | 无 | 否 | 后台原型「MFA」 | 安全加固需求待确认 |

---

## 4. 后台结论摘要

1. **真正可用的后台能力**集中在：商品主数据（增/改/状态/热销/库存价）、分类与属性、新闻/信息页、管理员账号与改密。这些与生产库数据（10M 商品、195 管理员、1,606 联系、2,397 购物车）互相印证。**帮助中心模块代码引用不存在的模型类，不能计入可用能力。**
2. **后台首页不是业务看板**，而是 UI 图标示例页；无销售/流量/商品经营报表。
3. **交易闭环缺失**：询盘直发第三方、联系与 RFQ 数据无后台入口、无客户主数据、无订单/报价/跟踪处理。
4. **治理能力缺失**：无审计日志、无 action 级权限、无内容审核/版本、无定时任务监控、无配置管理。
5. **明确代码缺陷**：`AdController` 引用不存在的模型类；`ApiController` 写入不在审计清单中的表且未鉴权；广告视图有删除链接但无 delete action。
6. **原型中的大部分后台页面（内容审核、知识版本、任务监控、审计、RBAC、系统设置）在旧后台没有对应实现**，不能按「已有功能」理解。