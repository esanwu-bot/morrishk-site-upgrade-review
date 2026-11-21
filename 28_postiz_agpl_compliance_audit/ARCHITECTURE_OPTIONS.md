# 架构方案与 API 能力审计

## 1. Postiz API 能力

### 1.1 官方 Public API

官方文档：`https://docs.postiz.com/public-api`
OpenAPI/Swagger 在实例内由 `loadSwagger(app)` 加载；控制器：`apps/backend/src/public-api/routes/v1/public.integrations.controller.ts:66`（`@Controller('/public/v1')`）。

| 能力 | 端点/证据 | 结论 |
|---|---|---|
| 认证 | `Authorization` 头；API Key 或 `pos_` OAuth token（`public.auth.middleware.ts:27-51`） | 支持 |
| 组织隔离 | API Key 绑定 Organization；`x-postiz-org` 仅超级管理员可覆盖（`public.auth.middleware.ts:73-90`） | 支持，需谨慎使用 |
| 帖子列表 | `GET /public/v1/posts`（controller:135） | 支持 |
| 创建草稿/排程/立即发布 | `POST /public/v1/posts`（controller:148）；DTO `type: draft / schedule / now / update`（`create.post.dto.ts:100`） | 支持 |
| 状态变更 | `PUT /public/v1/posts/:id/status`（controller:689），`status: draft / schedule` | 支持 |
| 删除 | `DELETE /public/v1/posts/:id`（controller:237） | 支持 |
| 媒体上传 | `POST /public/v1/upload`、`/upload-from-url`；`GET /media`、`/media/:id/status`（controller:82/105/260/284） | 支持 |
| 账号/Integration 列表 | `GET /public/v1/integrations`（controller:322）、`/is-connected`（254） | 支持 |
| 连接账号 | `GET /public/v1/social/:integration`（346）；`POST /public/v1/integrations/connect`（413） | 支持 |
| 分析 | `GET /public/v1/analytics/:integration`（715）、`/analytics/post/:postId`（725） | 支持，平台差异大 |
| 查找空闲时段 | `GET /public/v1/find-slot/:id`（126） | 支持 |
| Webhook | 代码在 `/webhooks` 控制器（UI 会话认证），不是 Public API；`sendWebhooks` 在发布后 best-effort POST（`post.activity.ts:589-630`） | **有限**：无签名、无重试、无公开 API 创建 |
| 审批工作流 | 无 | **不支持**；必须由 Adapter 的 `SOCIAL_CONTENT_APPROVED` 前置校验实现 |

### 1.2 认证差异

| 项 | Postiz | Session B 内部 Client Credentials |
|---|---|---|
| 主体 | 组织级 API Key 或第三方 OAuth App token | 服务客户端 |
| 粒度 | 组织级；未发现细粒度 scope | Client + scope |
| 有效期 | API Key 长期；OAuth token 文档称不过期 | 建议 15 分钟 |
| 用途 | 外部集成 | 内部服务间 |
| 结论 | **不能混用**；Adapter 使用独立 Postiz 凭据 | — |

### 1.3 限流

- 代码默认：`API_LIMIT` 缺省 `90` 次/小时（`apps/backend/src/app.module.ts:39`）。
- 官方文档：创建帖子 90 次/小时，Cloud 100；自托管可调 `API_LIMIT`。
- `docker-compose.yaml:98` 将 `API_LIMIT` 设为 `30`。
- 分析接口文档：30 次/小时。
- Adapter 必须做预算/退避；不能用 Postiz 限流替代自己的任务队列。

### 1.4 多租户

- Postiz 以 `Organization` 为租户边界（`schema.prisma:11-49`）；`Integration`、`Post`、`Webhook` 均带 `organizationId`。
- 推荐一个 Morrishk 租户 ↔ 一个 Postiz Organization + 一个 API Key。
- 不建议使用超级管理员 API Key + `x-postiz-org` 跨租户；该路径是高权限，泄露影响大。
- Adapter 必须保存 `tenant_id ↔ postiz_org_id ↔ integration_id` 映射，不能仅用平台名。

### 1.5 Morrishk ↔ Postiz 映射

| Morrishk 对象 | Postiz 对象 | 说明 |
|---|---|---|
| `tenant_id` | `Organization.id` | 一个租户一个 Organization 最清晰 |
| `social_account_id` | `Integration.id` | 保存平台、账号名、providerIdentifier |
| `content_id` + 平台 | `Post.group` / `Post.id` | Adapter 维护自己的 `content_id`，Postiz 只存发布体 |
| `publish_job` | `Post` + `state` | Adapter 自己的状态机为准；Postiz `QUEUE/PUBLISHED/ERROR/DRAFT` 是执行状态 |
| 审批记录 | 无 | `SOCIAL_CONTENT_APPROVED` 只在 Morrishk/Adapter |
| 询盘归因 | 无 | 由 Morrishk 站点事件 + UTM 完成，不依赖 Postiz |
| 审计日志 | Postiz 自身日志不足 | Adapter 记录请求、响应、幂等键、操作者 |

## 2. 七个架构方案

> 风险等级是技术与许可证风险，不是法律结论。所有“低”不代表自动合规。

| 方案 | 描述 | 风险 | 是否需提供源码 | 源码范围 | 影响 Morrishk 闭源 | 推荐 |
|---|---|---|---|---|---|---|
| A | Postiz 原版独立部署，Morrishk 通过官方 API | 低-中 | 未修改且不交付副本时不因 §13；镜像分发触发 §6 | Postiz 原版/镜像源码 | 低（独立通信） | 推荐基线 |
| B | 同服务器、独立容器/DB | 低-中 | 与 A 相同；容器隔离不改变法律判断 | 同 A | 低-中 | 可用，但别把“同机”当合规理由 |
| C | Postiz + Adapter 分离部署，HTTP API | **低-中** | 同 A；Adapter 独立 | 仅 Postiz（如分发/修改） | 低 | **推荐** |
| D | 直接改 Postiz 前后端加 Morrishk 功能 | **高** | §13 触发；修改版源码 | 修改后的 Postiz + Corresponding Source | 高（可能包含业务代码） | 不推荐 |
| E | 把 Morrishk 审批/业务代码放进 Postiz 仓库 | **高** | §5/§13；组合作品 | 很可能包括 Morrishk 相关代码 | 高 | 拒绝 |
| F | 为 Postiz 写插件/扩展 | 中-高 | 取决于加载方式 | 同进程插件→Postiz 修改版；独立服务→C | 中-高 | 仅独立服务可考虑 |
| G | Fork Postiz 作为商业 SaaS/白标 | **高** | §13 + §6 + 商标 + Polotno | 修改版 Postiz 全部 Corresponding Source | 高 | 仅商业授权/AGPL 合规下 |

### 2.1 方案 A：原版独立

- 不修改 Postiz 源码；只通过 Public API 调用。
- 如果只在自己的服务器运行、不向客户交付副本，§13 不因修改触发；§6 不因网络交互触发。
- 但如果客户直接访问 Postiz UI，仍建议律师确认“mere interaction”与服务的定性。
- Polotno 仍可能因商业使用需要许可。

### 2.2 方案 B：同机容器隔离

- 独立容器/独立 DB 降低技术耦合，但不是许可证“安全港”。
- 如果 Postiz 修改版与 Adapter 共享卷/DB/内部网络，仍可能被认定组合。
- 只建议作为部署方式，不作为许可证策略。

### 2.3 方案 C：独立 Adapter（推荐）

```text
Morrishk UI/API (closed)
   │ HTTPS + 内部 OAuth2/OIDC
   ▼
Postiz Adapter (closed, separate process/DB)
   │ HTTPS + Postiz API key
   ▼
Postiz (unmodified AGPL, separate DB)
   │ official platform OAuth
   ▼
LinkedIn / Facebook / X / YouTube / TikTok
```

职责：

- Adapter：租户映射、`SOCIAL_CONTENT_APPROVED` 校验、内容转换、幂等、审计、webhook 回查、错误重试。
- Postiz：账号 OAuth、排程、发布、平台状态、基础分析。
- Morrishk：客户/商品/技术事实/营销策略/询盘归因；不进入 Postiz 数据库。

### 2.4 方案 D：直接改 Postiz

- 任何前后端修改都会形成 modified version；§13 要求向远程用户提供 Corresponding Source。
- 若把 Morrishk 专属审批/商品逻辑写进 Postiz，可能把闭源业务代码带入 AGPL 范围。
- 不建议；除非接受 AGPL 开源或取得商业许可。

### 2.5 方案 E：代码并入 Postiz

- 最危险的方案；很可能被认定为组合/基于 Postiz 的作品。
- 不仅 Postiz 修改部分，Morrishk 并入部分也可能需要按 AGPL 提供。
- 拒绝。

### 2.6 方案 F：插件/扩展

- 仓库没有公开的第三方插件 SDK；`plugs` 是内置的 provider 相关功能，不是动态第三方插件加载器。
- 若要开发插件，通常要改 Postiz 仓库 → 变成方案 D。
- 独立服务通过 webhook/API 调用 → 属于方案 C，不是真正“Postiz 插件”。

### 2.7 方案 G：Fork + 商业 SaaS/白标

- 修改版 + SaaS：§13 对每个用户提供源码。
- 白标：Postiz 商标需书面许可；Terms §7/§10。
- Polotno：商业许可。
- Elasticsearch：单独许可。
- 只有取得 Gitroom 商业/OEM 授权并满足 AGPL 或替代许可时才可考虑。

## 3. 推荐架构的最低隔离要求

1. Postiz 使用官方镜像/固定 tag（`v2.26.0`）或 digest，不用 `latest`。
2. Postiz 独立 Postgres/Redis；不与 Morrishk 业务库共享。
3. Adapter 独立进程、独立数据库、独立部署单元。
4. Adapter 只调用 `/public/v1`；不 import `@postiz/node` 或 Postiz 内部模块。
5. 不修改 Postiz 源码；配置只通过环境变量。
6. Postiz 不直接暴露给 Morrishk 客户；客户只访问 Morrishk/Adapter UI。
7. 每个租户一个 Postiz Organization + 独立 API Key；API Key 加密存储、轮换、吊销。
8. Adapter 自己实现审批门禁、幂等、状态机、审计；Postiz 的 DRAFT/QUEUE 不是审批。
9. 发布状态以 Adapter 回查 Postiz API 为准；webhook 仅作提示，必须回查。
10. 固定源码/镜像版本，保留 Corresponding Source 归档与 NOTICE。

## 4. 不建议的“隔离”说法

- “不同容器就绝对不传染”：不成立；法律看作品/组合关系，不只看容器。
- “只调用 API 就绝对独立”：不自动成立；还要看是否复制代码、共享内部接口/数据库、专门耦合。
- “Docker 镜像没有源码所以不用提供”：错；AGPL §6 要求 Corresponding Source。
- “内部使用永远没有源码义务”：修改版 + 内部网络用户可能触发 §13。
- “AGPL 禁止商业收费”：错；AGPL 允许收费。
- “Postiz 是 AGPL，所以 Polotno 也免费商用”：错；第三方组件有独立许可。

## 5. API 是否足以满足 Morrishk

| Morrishk 需求 | Postiz API | 结论 |
|---|---|---|
| 账号连接 | `/social/:integration` + `/integrations/connect` | 够用 |
| 内容草稿 | `POST /posts` type=draft | 够用 |
| 审批门禁 | 无 | Adapter 实现 |
| 排程 | type=schedule | 够用 |
| 立即发布 | type=now | 够用 |
| 状态查询 | GET /posts、GET /posts/:id | 够用 |
| 删除 | DELETE /posts/:id | 够用 |
| 媒体上传 | /upload、/upload-from-url、/media/:id/status | 够用 |
| 分析 | /analytics/:integration、/analytics/post/:postId | 基础够用；平台差异 |
| Webhook | UI 认证、无签名/无重试 | 不足；Adapter 用轮询/回查 |
| 多租户 | Organization + API Key | 够用；需映射 |
| 品牌/白标 | Terms §10 | 需书面许可 |

**结论：** 不修改 Postiz 核心代码即可完成 Morrishk 的主要集成；建议保留 Postiz 原版，由 Adapter 承担审批与业务映射。
