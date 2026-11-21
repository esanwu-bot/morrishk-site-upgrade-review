# 闭源边界分析

> 结论均为风险评估，不是法律裁定。衍生作品/组合程序边界标记 `LEGAL_REVIEW_REQUIRED`。

## 1. 组件边界总表

| 组件 | 预期许可证 | 能否保持闭源 | 风险 | 条件 |
|---|---|---|---|---|
| Morrishk 主站 | 自有 | 是 | 低 | 不复制/链接 Postiz 代码；通过独立 API 通信 |
| Ds Bit Business API | 自有 | 是 | 低 | 不把 Ds Bit 代码放入 Postiz 仓库/进程 |
| 商品技术数据与证据 | 自有/数据 | 是 | 低 | 数据归属、合同、隐私；不随 AGPL 源码义务扩散 |
| 营销策略引擎 | 自有 | 是 | 低 | 独立进程/服务；不 import Postiz AGPL 库 |
| `SOCIAL_CONTENT_APPROVED` 审批系统 | 自有 | 是 | 低 | Adapter 在调用 Postiz 前强制检查 |
| Postiz Adapter | 自有（建议） | **可以，有条件** | 中 | 独立进程、独立 DB、HTTP 调用、不 import `@postiz/node`、不复制 Postiz 代码 |
| Postiz 原版 | AGPL-3.0 | 否（AGPL） | 低-中 | 不修改；如分发镜像需 §6 源码 |
| Postiz 修改版 | AGPL-3.0 | 否（AGPL） | 高 | §5/§6/§13；修改版源码必须按 AGPL 提供 |
| Postiz 同进程插件/内部扩展 | AGPL（高风险） | 否（很可能） | 高 | 同进程加载、使用内部 API/内部库，通常视为基于 Postiz 的作品 |
| 独立 Adapter 的 HTTP 客户端 | 自有 | 是 | 中 | 自己实现最小 HTTP 客户端，不复制 SDK 代码 |

## 2. 衍生/组合判断要素

下列因素越多，越可能被认定为同一作品/组合程序：

1. 复制或改编 Postiz 源码；
2. `import`/`require` Postiz 内部模块；
3. 与 Postiz 在同一 Node 进程加载；
4. 与 Postiz 共享 Prisma schema、数据库、Redis key、会话；
5. 为 Postiz 专门设计并依赖其内部接口（非公开 API）；
6. 修改 Postiz 构建配置把 Adapter 编入同一产物；
7. 通过补丁方式修改 Postiz 行为；
8. 以 Postiz 的插件目录/内部 plug 机制加载自有代码。

下列因素倾向于独立程序（但仍需律师确认）：

1. 独立部署、独立进程；
2. 独立数据库/账号；
3. 仅通过公开 HTTP API、webhook、CLI、socket 通信；
4. 不复制/链接 Postiz 代码；
5. 可替换为其他后端（例如其他社媒工具）；
6. 有独立版本、独立发布、独立故障域。

GNU GPL FAQ 对 sockets/pipes/命令行参数的解释支持“通常属于独立程序”，但不是自动结论：
`https://www.gnu.org/licenses/gpl-faq.html`（“What is the difference between an ‘aggregate’ and other kinds of ‘modified versions’?”）

## 3. Adapter 的闭源规则

若要把 Adapter 保持闭源，必须满足：

1. **独立进程/容器**：不与 Postiz 共用 Node 进程。
2. **独立数据库**：不直接读写 Postiz 的 Postgres schema；通过 API 读取所需数据。
3. **仅公开 API**：使用 `/public/v1` 端点；不调用 Postiz 内部 controller/service。
4. **不 import `@postiz/node`**：该 SDK 是 AGPL-3.0；引入可能使 Adapter 受 AGPL 影响。自行实现最小 HTTP 客户端。
5. **不复制 Postiz 代码**：包括类型、DTO、内部工具函数、前端组件。
6. **不修改 Postiz**：配置/环境变量不算修改；改代码就算。
7. **webhook 只作为通知**：Postiz webhook 无签名、无重试；Adapter 必须用 API 回查确认，不能仅信 payload。
8. **独立审计**：Adapter 自己记录审批、幂等、发布结果，不依赖 Postiz 的审计。
9. **独立密钥**：Adapter 使用自己的 Postiz API Key/凭据，加密存储；不复用 Morrishk 内部 Token。
10. **合同/架构评审**：上线前由律师审查 Adapter 与 Postiz 的接口、数据流、部署关系。

## 4. 不推荐的集成方式

| 方式 | 风险 | 原因 |
|---|---|---|
| 把 Morrishk 审批代码直接放进 Postiz 仓库 | 高 | 可能构成基于 Postiz 的作品，整个组合受 AGPL |
| 修改 Postiz 前端加 Morrishk 菜单/字段 | 高 | 修改版触发 §13；前端代码需按 AGPL |
| 在 Postiz 进程内加载自有插件 | 高 | 同进程、内部 API，可能被视为组合程序 |
| 直接读写 Postiz 数据库 | 中-高 | 数据/模式耦合，可能被认定为同一作品；也破坏升级 |
| 复制 Postiz SDK 代码进 Adapter | 高 | 复制 AGPL 代码；Adapter 可能受 AGPL |
| 只改环境变量/主题配置 | 低-中 | 通常不算修改源码；但主题/前端代码改动仍可能算修改 |
| 使用 `docker exec`/内部脚本修改数据 | 中 | 规避不了许可证；还引入运维风险 |

## 5. 数据与账号边界

- Postiz 保存平台 OAuth Token、Integration、Post、媒体、分析数据；这些是 Postiz 数据库内容，不是源代码。
- Morrishk 保存客户、商品、审批、询盘、归因；不应把客户数据复制进 Postiz 数据库之外的地方。
- Postiz 的 `Organization` 是租户边界；Morrishk 的租户/组织需要映射到 Postiz Organization。
- 推荐：一个 Morrishk 租户对应一个 Postiz Organization + 一个 API Key；不要用超级管理员 `x-postiz-org` 跨租户。
- Postiz 的 API Key 是组织级、长期有效；Adapter 必须加密存储、按租户隔离、支持轮换/吊销。
- Postiz OAuth App token 文档称“不发生过期”，更需加密和撤销机制；不要与 Morrishk 用户会话混用。

## 6. 商标/品牌边界

- AGPL 不授予商标许可；Postiz Terms §10 明确 logos/trademarks 属于 Gitroom。
- 白标/去品牌化、使用 Postiz 名称/Logo 做商业推广，需要单独书面许可。
- 可以修改代码移除品牌（AGPL 允许修改），但不等于可以使用 Postiz 商标；需法律审查。
- 不要用“Postiz”作为 Morrishk 产品名或暗示官方合作，除非有书面授权。

## 7. 结论

**可以保持 Morrishk、Ds Bit、审批系统和 Adapter 闭源，但前提是它们与 Postiz 保持真实的独立程序边界。**

最强的边界是：

```text
Morrishk/Ds Bit（闭源）
        │ 自有 API / 内部事件
        ▼
Adapter（闭源、独立进程、独立 DB）
        │ HTTPS + Postiz Public API（API Key）
        ▼
Postiz（原版 AGPL、独立部署、独立 DB、零源码修改）
        │ 官方平台 OAuth
        ▼
LinkedIn / Facebook / X / YouTube / TikTok
```

任何“把代码放进 Postiz 仓库/进程/数据库”的做法都会显著提高 AGPL 覆盖风险，并使闭源边界需要律师重新评估。
