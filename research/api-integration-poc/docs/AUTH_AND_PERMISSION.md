# 授权、权限与凭证要求

| 项目 | 内容 |
|---|---|
| 文档版本 | V1.2（按 Reviewer 166e542 P1 补充复核意见修订） |
| 日期 | 2026-11-17 |
| 适用范围 | 社媒发布、视频上传、GA4 读取（预研） |
| 依据 | `API_RESEARCH.md` 来源清单 [S1]–[S65] |

**V1.1 修订说明**：补充 OAuth `state` 的强制校验与重放防护、LinkedIn 个人身份与组织身份的分离（`organizationId` / `authorUrn`）、发布目标白名单、Measurement Protocol 独立开关，以及「本地幂等」与「供应商幂等」的区别。所有修订均未使用真实凭证。

---

## 1. 授权模型总览

| 平台 | 授权类型 | 典型有效期 | 是否可刷新 | 应用审核 |
|---|---|---|---|---|
| Facebook Page | OAuth 2.0 授权码（Facebook Login） | 短期 1–2h；长期约 60 天 | 可换取长期 token | App Review + Business Verification |
| Instagram Professional | 经 Facebook Login 或 Instagram Login | 同 Meta 体系 | 同 Meta | 同 Meta |
| LinkedIn 组织页 | OAuth 2.0 授权码（3-legged） | 60 天 | 返回 refresh token；程序化刷新仅限特定合作伙伴 | Community Management Standard tier |
| X | OAuth 2.0 授权码 + PKCE | 2 小时 | 需 `offline.access` scope | 无审核；按量付费 |
| TikTok | OAuth 2.0 授权码（Login Kit） | 可刷新，具体时长待复核 | 支持 refresh token | Content Posting API 审核 |
| YouTube | Google OAuth 2.0 | 访问令牌约 1 小时 | 支持 refresh token | compliance audit（提配额） |
| GA4 报表 | Google OAuth 2.0 或服务账号 | 1 小时 / 5 分钟–12 小时 | 用户 token 可刷新；服务账号自动续签 | 无 |

---

## 2. 各平台权限清单（最小权限原则）

### 2.1 Meta

| 能力 | 权限 |
|---|---|
| 发布到 Facebook Page | `pages_manage_posts` |
| 读取 Page 互动/评论 | `pages_read_engagement`（评论读取字段清单待复核） |
| 读取 Page Insights | `read_insights`（需确认） |
| Instagram 发布 | `instagram_content_publish` |
| Instagram 数据分析 | `instagram_manage_insights` |
| 账号信息 | `pages_show_list`、`instagram_basic` |

**审核要求**：Advanced Access 全部需要 Business Verification；App Review 需要说明用途、提供录屏与测试账号。**不得**在未获客户授权时申请超出发布所需的权限。

### 2.2 LinkedIn

| 能力 | 权限 |
|---|---|
| 以组织身份发帖 | `w_organization_social` |
| 读取组织页统计 | `r_organization_social`（需申请） |
| 以个人身份发帖 | `w_member_social`（`r_member_social` 当前关闭申请） |
| 枚举/管理组织页 ACL（发现组织） | `rw_organization_admin`（仅 ADMINISTRATOR）或只读的 `r_organization_admin` |

**发布权限与组织发现权限是两套（V1.2 修正）**

- `w_organization_social` 只授予「以组织身份发帖」，**不能**用来调用 organizationAcls 枚举组织。
- 需要程序化发现授权用户管理的组织时，必须额外申请 `rw_organization_admin`（或只读的 `r_organization_admin`），且授权用户在目标组织页必须是 ADMINISTRATOR。
- `LINKEDIN_ORG_ADMIN_DISCOVERY` 默认 `false`：默认授权只申请发布 scope；只有明确需要发现组织时才置为 `true`，避免申请超出发布所需的权限。

**审核要求**：Community Management API 需 Development tier 审核，再申请 Standard tier（录屏 + 技术签核）。调用者必须是组织页 ADMINISTRATOR / CONTENT_ADMIN / DIRECT_SPONSORED_CONTENT_POSTER。

**个人身份与组织身份必须分离（V1.1 新增，V1.2 补充组织发现权限拆分）**

- `/v2/userinfo` 返回的是**个人**身份（`sub`、`name`、`email`），只能用于确认「谁完成了授权」，**不能**作为组织页发帖的 author。
- 组织页发帖的 author 必须是 `urn:li:organization:{id}`，且授权用户对该组织页具备管理员类角色。
- 组织身份来源按以下顺序解析，任一步失败即停止，不猜测、不降级为个人身份发帖：
  1. 配置项 `LINKEDIN_AUTHOR_URN`（最明确，推荐）；
  2. 配置项 `LINKEDIN_ORGANIZATION_ID`，拼为 `urn:li:organization:{id}`；
  3. 调用版本化 REST 接口 `GET /rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&count=10` 枚举授权用户可管理的组织，请求头必须带 `X-Restli-Protocol-Version: 2.0.0` 与 `LinkedIn-Version: YYYYMM`；响应元素可能使用 `organization` 或 `organizationTarget` 字段；
  4. 全部为空 → 报 `BLOCKED_PERMISSION`（有权限但无管理员角色），不发布。
- token 的 scope 不含 `rw_organization_admin` 时，Demo 在**发出任何 ACL 请求之前**直接报 `BLOCKED_PERMISSION`，并说明 `w_organization_social` 不能替代组织发现权限。
- Mock 模式下的组织对象带有 `verified=false` 与「Mock 组织身份，仅用于演示」标记，**不得**被日志或演示输出表述为「已验证组织」。

### 2.3 X

| 能力 | 权限/范围 |
|---|---|
| 发帖 | `tweet.write` |
| 读取帖子 | `tweet.read` |
| 用户信息 | `users.read` |
| 离线刷新 | `offline.access` |

**注意**：access token 仅 2 小时；未申请 `offline.access` 时无法后台续期。额度按套餐/用量购买，读取上限与发帖上限分别计算。

### 2.4 TikTok

| 能力 | 权限 |
|---|---|
| 直接发布视频 | `video.publish` |
| 上传为草稿 | `video.upload` |
| 查询/管理视频 | `video.manage`、`video.list` |
| 用户统计 | `user.info.stats` |

**审核要求**：Content Posting API 需审核；未审核状态下的发布只对私密账号可见（`unaudited_client_can_only_post_to_private_accounts`）。**没有文档化的评论读取 scope。**

### 2.5 YouTube

| 能力 | 权限 |
|---|---|
| 上传/管理视频 | `https://www.googleapis.com/auth/youtube.upload`（或 `youtube`） |
| 评论、字幕等写操作 | `https://www.googleapis.com/auth/youtube.force-ssl` |

**审核要求**：默认配额 10,000 units/天；`videos.insert` 每次 1 unit 但每天 100 次调用上限。提高配额需提交 compliance audit。

### 2.6 GA4

| 用途 | Scope | 角色 |
|---|---|---|
| 只读报表 | `analytics.readonly` | Viewer / Analyst |
| 配置管理 | `analytics.edit` | Editor / Admin |
| 用户管理 | `analytics.manage.users`（一般不需要） | Admin |

**原则**：报表服务只给 `analytics.readonly`；服务账号需在目标 GA4 账号或 Property 上被授予角色，否则 API 返回 403。

---

## 3. 凭证分级与存放

| 凭证 | 存放位置 | 说明 |
|---|---|---|
| 应用 ID / Secret | 本地 `.env`（已 gitignore），生产用密钥管理服务 | 不得写入代码、日志、提交历史 |
| 用户 access/refresh token | 本地 `.tokens/`（已 gitignore），生产用加密存储 | Demo 仅本地测试 |
| 服务账号 JSON | 本地文件路径经环境变量传入，文件不入库 | 生产使用 Workload Identity 或密钥轮换 |
| Webhook 签名密钥 | `.env` | 校验来源 |

**规则**

1. 任何真实 token 不得进入 Git；`.env.example` 只放变量名与占位符。
2. 日志统一脱敏：`access_token`、`refresh_token`、`client_secret`、`api_secret`、`Authorization` 头一律替换为 `***`。
3. Demo 的 token 存储文件权限在类 Unix 系统上设为 `0600`；Windows 下依赖用户目录隔离。
4. 发布类操作默认关闭真实通道，必须同时满足：`ALLOW_REAL_PUBLISH=true` + CLI `--confirm-publish` + 发布目标命中 `PUBLISH_TARGET_ALLOWLIST` + 显式指定单一目标（`provider:platform:account`）。
5. GA4 Measurement Protocol 真实写入使用独立开关：`ALLOW_REAL_MP=true` + CLI `--confirm-mp`，与社媒发布开关互不连带。
6. **全局发布开关不等于批量授权**：即使 `ALLOW_REAL_PUBLISH=true`，Demo 也只发布命令行显式指定的一个目标，不会遍历所有平台/账号。
7. **真实目标必须显式且唯一（V1.2 新增）**：
   - `--provider`、`--platform`、`--account` 必须全部显式传入，Demo 不提供任何默认目标；
   - `account=default|all|*|any|profile` 是占位值，不是账号身份，真实模式下直接拒绝；
   - 平台（platform）只代表渠道，不能代替账号身份；
   - 全部白名单与绑定校验都在**发出任何发布请求之前**完成。
8. **LinkedIn 目标与最终 authorUrn 绑定**：白名单目标 `linkedin:linkedin:{组织数字ID}` 必须与最终 `urn:li:organization:{组织数字ID}` 一致；缺失或不匹配即拒绝，不做隐式解析。
9. **Ayrshare Profile 绑定**：真实发布时 `Profile-Key` 放在请求头（`Authorization: Bearer <API_KEY>` + `Profile-Key: <key>`）；POST `/api/post` 之前先用 `GET /api/user`（带同一 `Profile-Key`）确认该 Profile 已关联目标平台。若无法确认 Profile、目标平台未关联，或目标平台存在多个账号（无法唯一确定），直接拒绝，不发送发布请求。

---

## 4. Token 生命周期处理

| 场景 | 处理 |
|---|---|
| 即将过期 | 提前 10% 有效期刷新；刷新失败标记 `AUTH_EXPIRED`，停止发布并告警 |
| 无 refresh token | 记录到期时间，到期后要求重新授权（LinkedIn 普通应用典型场景） |
| 刷新返回新 refresh token | 原子替换并持久化，避免旧 token 失效 |
| 撤销授权 | 调用平台撤销端点（如 Google `oauth2.googleapis.com/revoke`），删除本地 token |
| 权限被收回 | API 返回 401/403 时标记 `PERMISSION_REVOKED`，不自动重试 |

**OAuth `state` 强制校验（V1.1 新增）**

1. `connect()` 生成随机 `state` 并登记为「已签发」。
2. 回调必须携带 `state`；**缺少 `expectedState`、缺少 `state`、二者不匹配、`state` 未签发或已被使用**，全部拒绝（`BAD_REQUEST`），不进入换 token。
3. `state` 为一次性：仅在**成功换取 token 之后**才从已签发集合中删除；换 token 失败时保留，允许用户重试同一回调。
4. 已使用的 `state` 再次回调视为重放，拒绝。日志中 `state` 与授权码一律脱敏。

**幂等的两层含义（V1.1 新增）**

| 层 | 实现 | 作用范围 | 说明 |
|---|---|---|---|
| 本地幂等 | `MemoryIdempotencyStore`：按请求指纹去重、共享 in-flight Promise、TTL 过期、失败剔除 | 仅本进程 | 防止同一进程内重复触发；不跨实例、不跨重启 |
| 供应商幂等 | Ayrshare `POST /api/post` 请求体 `idempotencyKey` | 供应商侧 | 同一 key 重复提交由供应商拒绝（错误码 110）；**不能因为带了 key 就允许自动重试** |

发布类 `POST` 默认**不自动重试**（`retryNonIdempotent=false`）；只读 `POST`（如 GA4 `runReport`、Ayrshare 分析查询）必须显式声明可重试。**本地幂等通过不代表供应商幂等已验证**，后者需要真实凭证，本轮状态为 `BLOCKED_CREDENTIAL`。

---

## 5. 各平台审核与上线条件清单

| 平台 | 申请材料 | 典型阻塞点 |
|---|---|---|
| Meta | 应用用途说明、隐私政策、测试账号、录屏；Business Verification 需营业执照等 | 企业认证周期、权限用途不清晰被拒 |
| LinkedIn | 应用审核、Standard tier 录屏与技术签核 | 组织页管理员权限、`r_member_social` 关闭 |
| X | 无需审核，购买额度 | 成本、读取上限、2026-03-31 后聚合方案需自备凭证 |
| TikTok | 应用审核、发布场景说明 | 未审核只能发私密；审核周期不可控 |
| YouTube | compliance audit 表单 | 配额提升周期；上传可见性限制待复核 |
| GA4 | 无需平台审核；Property 授权 | 服务账号未被授予角色、客户不愿共享属性 |

---

## 6. Demo 环境变量

```dotenv
# 运行模式：mock | real
POC_MODE=mock

# 发布安全开关（默认 false；即使 real 也必须显式确认）
ALLOW_REAL_PUBLISH=false

# 真实发布目标白名单，逗号分隔，格式 provider:platform:account
# account 必须是唯一账号身份：Ayrshare 为 Profile Key，LinkedIn 为组织数字 ID
# 例：ayrshare:linkedin:profile-abc,linkedin:linkedin:1234567
PUBLISH_TARGET_ALLOWLIST=

# GA4 Measurement Protocol 真实写入开关（与社媒发布开关独立）
ALLOW_REAL_MP=false

# 聚合（Ayrshare）
AYRSHARE_API_KEY=
AYRSHARE_BASE_URL=https://api.ayrshare.com

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=http://127.0.0.1:8787/callback/linkedin
# 组织身份（二选一，authorUrn 优先级更高）
LINKEDIN_ORGANIZATION_ID=
LINKEDIN_AUTHOR_URN=
# 版本化 REST API（默认官方域名与 2026-10 版本）
LINKEDIN_API_BASE=https://api.linkedin.com
LINKEDIN_API_VERSION=202610
# 是否额外申请 rw_organization_admin 用于组织发现，默认 false
LINKEDIN_ORG_ADMIN_DISCOVERY=false

# Mux
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=

# GA4
GOOGLE_APPLICATION_CREDENTIALS=
GA4_PROPERTY_ID=
GOOGLE_ACCESS_TOKEN=

# 本地 token 存储目录（自动 gitignore）
POC_TOKEN_DIR=./.tokens
```

---

## 7. 未验证事项

1. Meta 评论读取所需的具体权限与 Page Insights 字段。
2. LinkedIn Standard tier 的具体限额。
3. TikTok token 有效期与完整速率限制。
4. YouTube 未审核项目的上传可见性规则。
5. GA4 服务账号授权在 2026 年是否新增限制（以官方页面为准）。
6. Ayrshare `idempotencyKey` 在真实账号下的重复拒绝行为（仅按官方文档实现，未实测）。
7. Mux 真实断点续传与分片重试行为（Mock 分块计数不代表续传能力）。
8. GA4 `accountSummaries.list` 在真实账号下的多页返回（仅用 fixture 验证了解析与翻页逻辑）。
