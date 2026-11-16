# 05 · 平台管理中心现状盘点

> 覆盖对象：
> - 旧站管理后台 `modules/ejadmin`（历史生产快照中唯一在用的管理入口；本轮未实时验证）
> - 新平台工程 `E:\workspace\独立站\morries\platform`（前台脚手架 + 契约 + 迁移 + 归档后端）
> - 管理后台原型 `07_prototypes/admin`（Demo）
> - `08_php84_compatibility` 仅作背景，不在本文展开
>
> 阅读前提：**「新工程里有代码」「原型里有页面」「文档里有方案」三者互不等于「平台管理中心已具备该能力」。**
> 本文状态严格按 `00` 文档定义。`EXISTS_PRODUCTION` 在本目录等价于 `EXISTS_PRODUCTION_SNAPSHOT`：仅表示 2024-11-30 快照与代码可对应，不表示当前线上实时可用；实时验证后才可标记 `EXISTS_PRODUCTION_VERIFIED`。

---

## 1. 三种「管理中心」必须先分开

| 形态 | 路径 | 是否运行 | 能管理什么 | 证据 |
|---|---|---|---|---|
| 旧 Yii2 后台 | `newPlan/morrishk.net/modules/ejadmin` | **历史生产快照中在用**（未实时验证） | 商品、分类、内容、广告、管理员账号 | `modules/ejadmin` 10 控制器 43 action；`snsii_manage` AUTO_INCREMENT 195 |
| 新平台工程 | `platform/` | **前台未上线；后台未创建** | 目前只有组件、契约、迁移、归档原型 | `platform/README.md:3`；`web/src` 无 `page.tsx`/`layout.tsx` |
| 后台原型 | `07_prototypes/admin` | 静态 Demo | 34 个 hash 路由的交互演示，不写库 | `assets/admin.js:22-57` |

> 因此，本任务书中的「平台管理中心」在现状上应拆成两句话：
> 1. **按历史生产快照，管理职能由旧 Yii2 后台承担**（未实时验证；且能力有限，见 `02`）。
> 2. **新平台管理中心尚不存在**；只有技术方向文档与 UI 原型。

---

## 2. 新平台工程事实基线

### 2.1 工程构成

```text
platform/
├── docs/phase1/        规划、契约、路由验收、后台技术预决策
├── db/                 迁移执行器 + 4 组成对迁移 + fixture + 校验 SQL
├── _archive/           ThinkPHP 6.1 原型 API（已冻结，只读参考）
└── web/                Next.js 16 前台（组件层，无页面）
```

| 项 | 事实 | 证据 |
|---|---|---|
| 前端框架 | Next.js 16.4.6 / React 19.3.1 / TypeScript strict | `web/package.json` |
| 页面完成度 | `web/src` 下 **0 个 `page.tsx` / `layout.tsx`**；只有 8 个组件 | `find web/src -name page.tsx -o -name layout.tsx` 计数 0 |
| 组件清单 | `AlternativesPanel`、`AssetPanel`、`PriceLadder`、`SpecTable`、`FacetGroup`、`ResultRow`、`StockStatusView`、`Badge` | `web/src/components/**` |
| 语言清单 | **目标 5 种：`en/de/ja/es/fr`**（默认 `en`，`id`/`zh` 不属于目标）；**当前代码仍是 `en/de/ja/es/id`，`fr` 未实现** | 客户决策见 `07` Q-01；代码见 `web/src/i18n/locales.ts:18` |
| 消息文件 | `en/de/es/id/ja` 五份 JSON | `web/src/messages/` |
| API 契约 | OpenAPI 3.1，**9 个路径**：health、models/{mpn}、home、models、search、suggest、categories/{slug}、inquiries、inquiries/{leadNo} | `docs/phase1/03-api-contract.yaml:34,66,111,164,203,304,348,396,469` |
| 归档后端 | ThinkPHP 6.1，8 条路由与契约基本对应 | `_archive/platform_server/route/app.php:9-21` |
| 数据库迁移 | 4 组 up/down，共 **12 张表**，**0 条 ALTER** | `db/migrations/20261116_0001..0004` |
| 迁移状态 | 迁移体系「已冻结」 | `platform/README.md:16-20` |

### 2.2 12 张新表

| 域 | 表 | 迁移 |
|---|---|---|
| 商品维度 | `pd_brand`、`pd_category`、`pd_param_def` | `0001__pd_dimension_tables` |
| 型号核心 | `pd_model`、`pd_model_doc`、`pd_alt` | `0002__pd_model_core` |
| 询盘 | `biz_inquiry`、`biz_inquiry_item`、`biz_inquiry_attachment`、`biz_inquiry_event`、`biz_lead_seq` | `0003__biz_inquiry` |
| 同步 | `sync_outbox` | `0004__sync_outbox` |

**注意**：这 12 张表没有任何一张是账号、角色、权限、菜单、审计、系统配置、任务表。**新平台管理中心的数据模型尚未开始设计。**

---

## 3. 功能定义与现状

### 3.1 账号与认证

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| PA-01 | 管理员登录 | 账号密码登录后台 | 管理员 | 用户名/密码 | 会话 | 与前台共用 `SiteController::actionLogin`，成功后跳 `/ejadmin-index` | `snsii_manage`、Session |
| PA-02 | 登出 | 注销后台会话 | 管理员 | 无 | 回首页 | `actionLogout` | Session |
| PA-03 | 登录保护 | 失败次数、锁定、验证码 | 管理员 | 登录尝试 | 锁定/验证 | 未发现失败计数与锁定逻辑 | 无 |
| PA-04 | MFA / SSO | 二次验证或企业登录 | 管理员 | OTP/IdP | 登录 | 未发现；原型只有 MFA 状态展示 | 无 |
| PA-05 | 管理员账号列表 | 查看后台账号 | 超级管理员 | 筛选 | 列表 | `ManageController` 仅操作 `Role=2` 的账号 | `snsii_manage` |
| PA-06 | 账号新增/编辑/停用 | 维护管理员 | 超级管理员 | 账号字段 | 账号记录 | 仅有 `ManageController` 基础 CRUD；无自助注册 | `snsii_manage` |
| PA-07 | 邀请/找回密码 | 邀请新管理员、密码重置 | 超级管理员 | 邮箱 | 邀请/重置 | 未发现邀请与邮件重置流程 | 无 |
| PA-08 | 个人资料/改密 | 本人资料与密码 | 管理员 | 资料/密码 | 更新 | `AccountController::actionMy`、`generatePasswordHash` | `snsii_manage` |

| 编号 | 状态 | 证据级别 | 证据 | 仅原型 | 重复实现 | 问题/待确认 |
|---|---|---|---|---|---|---|
| PA-01 | EXISTS_PRODUCTION | E1 | `controllers/SiteController.php:175-200`；`snsii_manage` AUTO_INCREMENT 195 | 否 | 原型 account | 密码哈希算法与强度策略未核实 |
| PA-02 | EXISTS_PRODUCTION | E1 | 同上 `actionLogout` | 否 | 无 | — |
| PA-03 | NOT_FOUND | E2（负向） | 登录代码无失败计数/锁定 | 否 | 无 | 是否存在 WAF/网关层保护未知 |
| PA-04 | NOT_FOUND | E2（负向） | 无 MFA/SSO 代码；原型 `admin.js:56` 仅展示 MFA 字段 | 是（仅展示） | 无 | 新后台是否强制 MFA 待定 |
| PA-05 | EXISTS_PRODUCTION | E1 | `modules/ejadmin/controllers/ManageController.php`；`snsii_manage` | 否 | 原型 users | 仅能管 `Role=2`，超管账号无界面 |
| PA-06 | PARTIAL | E1 | `ManageController.php:27-87` | 否 | 原型 users 邀请 | 无停用/启用字段设计说明 |
| PA-07 | NOT_FOUND | E2（负向） | 无邀请/重置代码 | 是（Demo 邀请弹窗 `admin.js:746-752`） | 无 | 原型明示「不发送真实邮件」 |
| PA-08 | EXISTS_PRODUCTION | E1 | `AccountController.php:35-60` | 否 | 原型 account | — |

### 3.2 角色、权限与菜单

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| PA-09 | 角色定义 | 角色与职责划分 | 超级管理员 | 角色 | 角色记录 | 仅 `snsii_manage.Role` 字段（1/2），无角色表 | `snsii_manage` |
| PA-10 | 权限矩阵 | 按角色配置功能权限 | 超级管理员 | 角色×功能 | 授权 | **未发现**；原型中的矩阵为 Demo | 无 |
| PA-11 | 菜单级授权 | 控制后台菜单可见性 | 超级管理员 | `NavList` | 菜单 | `NavList` 为空且 `UserId=1` 时显示全部 | `snsii_nav` |
| PA-12 | action 级鉴权 | 每个动作服务端校验 | 系统 | 请求 | 允许/拒绝 | **未发现**；仅 `AccessControl` 要求登录 | 无 |
| PA-13 | 菜单管理 | 新增/排序后台菜单 | 超级管理员 | 菜单项 | 菜单结构 | **未发现 CRUD**；`snsii_nav` 只被读取 | `snsii_nav` |
| PA-14 | 数据范围权限 | 按品牌/品类/站点限权 | 超级管理员 | 范围 | 数据过滤 | **未发现** | 无 |
| PA-15 | 审批流 | 内容/发布/权限审批 | 审批人 | 申请 | 通过/退回 | **未发现**；原型 approvals 为 Demo | 无 |

| 编号 | 状态 | 证据级别 | 证据 | 仅原型 | 重复实现 | 问题/待确认 |
|---|---|---|---|---|---|---|
| PA-09 | PARTIAL | E1 | `snsii_manage.Role`；无角色表 | 否 | 原型 roles | `Role` 枚举含义未文档化 |
| PA-10 | NOT_FOUND | E2（负向） | 无权限表/无矩阵逻辑 | 是（`views-system.js` roles 矩阵） | 无 | 新后台 RBAC 粒度未定 |
| PA-11 | EXISTS_CODE | E1 | `views/layouts/header.php:16-43` | 否 | 原型菜单 | 菜单可见 ≠ 动作可执行 |
| PA-12 | NOT_FOUND | E2（负向） | `commands/AdminController.php:38-58` 仅登录控制 | 否 | 无 | **安全风险**：登录即可调用所有 action |
| PA-13 | NOT_FOUND | E2（负向） | 无 nav CRUD | 否 | 原型 settings | 菜单变更目前只能改库 |
| PA-14 | NOT_FOUND | E2（负向） | 无范围字段/过滤 | 否 | 无 | 多品牌运营是否需要 |
| PA-15 | NOT_FOUND | E2（负向） | 无审批表/状态机 | 是（approvals Demo） | 内容发布闸门（原型） | 与 Ds Bit 三层闸门的关系未定 |

> **结论**：现状是「登录 + 菜单隐藏」，不是 RBAC。`admin` 技术预决策明确要求「前端隐藏菜单/按钮不等于无权限，每个写操作都必须在服务端复核权限」（`docs/phase1/06-admin-frontend-technology-decision.md:96-112`），但该要求尚未落到任何代码。

### 3.3 审计日志

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| PA-16 | 操作审计记录 | 记录后台写操作 | 系统 | 操作者/对象/前后值 | 日志 | **未发现**；无审计表、无写入 | 无 |
| PA-17 | 审计查询 | 按人/时间/动作筛选 | 审计员 | 条件 | 日志列表 | **未发现** | 无 |
| PA-18 | 审计导出 | 导出审计结果 | 审计员 | 条件 | CSV/Excel | **未发现** | 无 |
| PA-19 | 外部日志接收 | 接收前端/外部日志 | 系统 | 日志 JSON | 写库 | `ApiController` 写 `snsii_all_logs`；**不要求登录、关闭 CSRF** | `snsii_all_logs`（表不在 31 表清单，待核实） |
| PA-20 | 日志保留策略 | 保留期、归档、防篡改 | 系统 | 策略 | 归档 | **未发现** | 无 |

| 编号 | 状态 | 证据级别 | 证据 | 仅原型 | 重复实现 | 问题/待确认 |
|---|---|---|---|---|---|---|
| PA-16 | NOT_FOUND | E2（负向） | 31 表清单无审计表；控制器无日志写入 | 是（audit Demo） | `snsii_cf_logs`（Cloudflare 日志，非业务审计） | 需明确审计范围 |
| PA-17 | NOT_FOUND | E2（负向） | 无查询页 | 是（audit Demo） | 无 | — |
| PA-18 | NOT_FOUND | E2（负向） | 无导出逻辑 | 是（audit 导出按钮） | 无 | — |
| PA-19 | EXISTS_CODE | E2 | `modules/ejadmin/controllers/ApiController.php:22-45` | 否 | 无 | **未鉴权写接口**；目标表是否真实存在待核实 |
| PA-20 | NOT_FOUND | E2（负向） | 无保留策略 | 否 | 无 | 合规要求待确认 |

### 3.4 任务、通知与协作

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| PA-21 | 待办任务 | 跨模块待办与优先级 | 运营 | 任务 | 任务状态 | **未发现**；原型 tasks 为 Demo | 无 |
| PA-22 | 系统通知 | 站内通知与未读状态 | 运营 | 事件 | 通知 | **未发现** | 无 |
| PA-23 | 任务调度配置 | 定时任务编排 | 运维 | cron 表达式 | 调度 | **未发现**；现有 console 命令依赖服务器 cron | 服务器 |
| PA-24 | 任务运行监控 | 成功/失败/重试/耗时 | 运维 | 运行记录 | 监控面板 | **未发现** | 无 |
| PA-25 | 队列/异步任务 | 解析、同步、邮件异步化 | 系统 | 任务 | 执行结果 | `sync_outbox` 表存在，**无消费者代码证据** | `sync_outbox` |

| 编号 | 状态 | 证据级别 | 证据 | 仅原型 | 重复实现 | 问题/待确认 |
|---|---|---|---|---|---|---|
| PA-21 | NOT_FOUND | E2（负向） | 无任务表/控制器 | 是（tasks Demo） | 原型 dashboard 待办 | — |
| PA-22 | NOT_FOUND | E2（负向） | 无通知表 | 是（notices Demo） | 无 | 通知渠道（站内/邮件）待定 |
| PA-23 | NOT_FOUND | E2（负向） | 无调度配置界面 | 否 | 服务器 crontab（未核实） | 生产 cron 是否运行未知 |
| PA-24 | NOT_FOUND | E2（负向） | 无运行记录表 | 是（部分仪表盘 Demo） | 无 | Ds Bit run 目录不是调度监控 |
| PA-25 | PARTIAL | E2 | `db/migrations/20261116_0004__sync_outbox.up.sql` | 否 | 无 | **有表无消费者**，需确认用途 |

### 3.5 系统配置与站点设置

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| PA-26 | 站点基础配置 | 站点名、联系方式、SEO 默认值 | 超级管理员 | 配置项 | 配置 | **未发现后台配置页**；参数写死在 `config/params.php` | 配置文件 |
| PA-27 | 语言/域名配置 | 语种清单与域名映射 | 超级管理员 | 语言/域名 | 路由规则 | `DuoLang` 80 条硬编码在 `config/params.php:12`；无界面 | `config/params.php` |
| PA-28 | 第三方集成配置 | GA4、GSC、SMTP、社媒密钥 | 超级管理员 | 密钥/ID | 集成 | **未发现**配置界面；SMTP 为明文配置 | `config/web.php` |
| PA-29 | 通知模板 | 邮件/站内信模板 | 运营 | 模板 | 模板版本 | **未发现** | 无 |
| PA-30 | 系统参数/字典 | 枚举、单位、状态字典 | 运营 | 字典项 | 字典 | **未发现**统一字典 | 无 |
| PA-31 | 文件与媒体库 | 上传、存储、引用 | 运营 | 文件 | URL/元数据 | **未发现统一媒体库**；商品图片手工字段 | `web/upload` |

| 编号 | 状态 | 证据级别 | 证据 | 仅原型 | 重复实现 | 问题/待确认 |
|---|---|---|---|---|---|---|
| PA-26 | NOT_FOUND | E2（负向） | 无配置控制器；`config/params.php` 静态 | 是（settings Demo） | 原型 settings | 配置变更是否允许在线 |
| PA-27 | EXISTS_CODE | E1 | `config/params.php:12`（80 条） | 是（settings 语言展示） | 新平台 `locales.ts`（当前 5 种） | 80 域名处置与新版 5 语种目标是两个问题；前者见 `07` Q-02 |
| PA-28 | PARTIAL | E2 | `config/web.php` SMTP/组件配置 | 是（settings 集成 Tab） | 无 | 密钥轮换与最小权限未设计 |
| PA-29 | NOT_FOUND | E2（负向） | 无模板表 | 是（settings 通知 Tab） | 无 | — |
| PA-30 | NOT_FOUND | E2（负向） | 无字典表 | 否 | 多个硬编码枚举 | 参数单位标准归属待定 |
| PA-31 | NOT_FOUND | E2（负向） | 无媒体表/库 | 是（部分） | 购物车第三方上传 | 文件存储与版权待确认 |

### 3.6 API 与接口管理

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| PA-32 | 接口契约 | 统一的 OpenAPI 定义 | 开发 | 业务需求 | YAML 契约 | 9 个 ToC 路径；契约是「唯一接口事实源」 | `docs/phase1/03-api-contract.yaml` |
| PA-33 | 接口实现 | 按契约提供后端 | 开发 | 请求 | JSON | 生产后端仍是 Yii2；**契约路径尚未在 Yii2 中实现**（未见对应控制器/路由） | Yii2 |
| PA-34 | 后台 API 命名空间 | `/api/admin/v1/*` 独立前缀 | 开发 | — | — | **仅为建议**，无实现 | 无 |
| PA-35 | API 鉴权/限流 | Token、配额、IP 限制 | 系统 | 请求 | 允许/拒绝 | **未发现**；契约中未见 securitySchemes | 无 |
| PA-36 | 健康检查 | 服务存活探测 | 运维 | 无 | 200/健康信息 | 契约 `/health`；归档后端有实现 | `03-api-contract.yaml:34` |
| PA-37 | API 文档/调试台 | 在线查看与试调用 | 开发 | — | — | **未发现** | 无 |
| PA-38 | 同步出站 | 向外部系统推送变更 | 系统 | 变更 | outbox 消息 | `sync_outbox` 表存在；无生产者/消费者证据 | `sync_outbox` |

| 编号 | 状态 | 证据级别 | 证据 | 仅原型 | 重复实现 | 问题/待确认 |
|---|---|---|---|---|---|---|
| PA-32 | EXISTS_CODE | E3 | `docs/phase1/03-api-contract.yaml` | 否 | 归档 TP6 路由 | 契约 ≠ 实现 |
| PA-33 | NOT_FOUND | E2（负向） | Yii2 中未见 `/api/v1/*` 路由 | 否 | 归档 TP6（8 路由） | Phase 1 前台依赖此实现 |
| PA-34 | NOT_FOUND | E3 | `06-admin-frontend-technology-decision.md:56-70` 仅为建议 | 否 | 无 | 后台契约尚未编写 |
| PA-35 | NOT_FOUND | E3（负向） | 契约未见 security 定义 | 否 | 无 | **公开询盘接口的防滥用方案未定** |
| PA-36 | EXISTS_CODE | E3 | 契约 `:34`；归档 `route/app.php:10` | 否 | 无 | 归档后端未部署 |
| PA-37 | NOT_FOUND | E2（负向） | 无 Swagger UI | 否 | 无 | — |
| PA-38 | PARTIAL | E2 | `20261116_0004__sync_outbox.up.sql` | 否 | 无 | 用途与消费方待确认 |

### 3.7 多语言配置

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| PA-39 | 新版语种清单 | 前台支持的语言 | 产品 | 决策 | `LOCALE_CODES` | **目标 5 种 `en/de/ja/es/fr`**，默认 `en`；`id`/`zh` 不属于目标语言。当前代码仍为 `en/de/ja/es/id`，`fr` 未实现 | 客户决策见 `07` Q-01；代码见 `web/src/i18n/locales.ts:18` |
| PA-40 | 消息词库 | 各语种 UI 文案 | 内容运营 | 译文 | `messages/*.json` | 缺 key 构建期失败；不允许英文占位 | `web/src/messages/` |
| PA-41 | 路由前缀与 hreflang | `as-needed` 前缀与 canonical | 开发 | locale | URL/标签 | 默认语言不带前缀；每页唯一 canonical | `web/src/i18n/routing.ts`、`docs/phase1/05-frontend-routing-and-acceptance.md:15` |
| PA-42 | 旧域名/旧语种映射 | 80 个旧域名如何跳转 | 运维/开发 | 旧域名清单 | 301 规则 | **盘点文档缺失**；仅见 `legacy-url-redirects.csv` | `docs/phase1/legacy-url-redirects.csv` |
| PA-43 | 后台界面语言 | 管理后台语言 | 管理员 | — | 界面语言 | 旧后台强制 `zh-CN` | `commands/AdminController.php:30` |
| PA-44 | 内容多语版本 | 商品/文章多语字段 | 内容运营 | 译文 | 多语内容 | 旧站属性有 `_lang` 表；商品参数单语 | 多张表 |

| 编号 | 状态 | 证据级别 | 证据 | 仅原型 | 重复实现 | 问题/待确认 |
|---|---|---|---|---|---|---|
| PA-39 | EXISTS_CODE | E2 | `web/src/i18n/locales.ts:18` | 否 | `config/params.php` 80 域名 | **目标（fr）与代码（id）不一致**；`fr` 未实现，`id` 为遗留；文档仍写「六语种含 zh」 |
| PA-40 | EXISTS_CODE | E2 | 5 份 JSON；`locales.test.ts` | 否 | 旧站多语表 | 译文来源与审校流程未定 |
| PA-41 | EXISTS_CODE | E3 | `routing.ts`、验收文档 `:15` | 否 | 旧站 `DuoLang` 域名路由 | 旧 URL 冻结与新路由如何并存未定 |
| PA-42 | NOT_FOUND | E2/E3 | `07-language-and-legacy-domain-mapping.md` 被引用但**文件不存在** | 否 | 旧站 80 域名 | 80 域名处置是上线前置条件；与目标语言集合分开确认（`07` Q-02） |
| PA-43 | EXISTS_PRODUCTION | E1 | `commands/AdminController.php:30` | 否 | 原型中文界面 | 新后台是否多语未定 |
| PA-44 | PARTIAL | E1/E2 | `snsii_attr_name_lang` 等表；后台无维护入口 | 否 | 新平台消息文件 | 商品参数翻译归属待定 |

---

## 4. 后台前端形态与原型

| 项 | 事实 | 证据 |
|---|---|---|
| 是否已创建后台 React 工程 | **否**；`platform/web` 只有前台组件，无 admin 应用 | `platform/` 目录树 |
| 技术方向 | React + TS + Ant Design + Vite + React Router + TanStack Query + Zod | `docs/phase1/06-admin-frontend-technology-decision.md:56-70` |
| 决策状态 | 「方向已定，实施前需一次确认」；**不构成开发批准** | 同文档 `:3-5` |
| 后台立项状态 | 阶段 0 待复核；阶段 1 未授权；阶段 2 未定义 | `docs/phase1/admin/00-project-scope.md:3-5` |
| 原型规模 | 34 个 hash 路由，含 users/roles/approvals/audit/settings/account | `07_prototypes/admin/assets/admin.js:22-57` |
| 原型数据 | 全部 Demo；不写库、不发邮件、无真实鉴权 | `prototype-readme.md`、`admin.js:746-752` |

> 原型中的权限矩阵、审批流、MFA、审计导出、任务监控均属 `EXISTS_PROTOTYPE`。原型没有任何后端调用，不能作为「平台管理中心已实现」的证据。

---

## 5. 与 `08_php84_compatibility` 的边界

| 项 | 结论 |
|---|---|
| 关系 | PHP 7.4 → 8.4 兼容性工作流与平台管理中心**相互独立** |
| 本文是否展开 | 否；仅登记为背景 |
| 对管理中心的影响 | 后台重构不得以「PHP 升级」为由在生产机新增 Node 运行时或改 FPM/vhost（见技术预决策 §6） |
| 证据 | `docs/phase1/06-admin-frontend-technology-decision.md:113-118`；`08_php84_compatibility` 目录 |

---

## 6. 本文件结论（只陈述现状）

1. **平台管理中心尚无新产品**：旧后台是历史生产快照中唯一在用的管理入口（本轮未实时验证）；新工程没有后台应用、没有后台契约、没有账号/权限/审计数据模型。
2. **旧后台的真实能力边界**是「登录 + 菜单可见性 + 10 个控制器的业务 CRUD」，不是 RBAC，也没有审计与任务监控。
3. **原型覆盖了完整的管理中心信息架构**，但全部是 Demo，不能计入实现。
4. **多语言存在四层事实**：客户目标 5 语种（`en/de/ja/es/fr`）/ 当前代码 5 语种（`en/de/ja/es/id`）/ 文档仍写 6 语种（含 zh）/ 旧站 80 域名。目标与实现差异需在开发前消除；80 域名处置单独确认（见 `07` Q-02）。
5. **新平台契约 9 条路径均未见 Yii2 生产实现**；这是 Phase 1 前台能否上线的前置事实，不是管理中心独有问题。

> 本文不提出目标架构、不排期、不给出改造优先级。相关问题统一收敛到 `06` 与 `07`。