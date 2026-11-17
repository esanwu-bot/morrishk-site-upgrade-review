# 授权、权限与凭证要求

| 项目 | 内容 |
|---|---|
| 文档版本 | V1.0（初稿） |
| 日期 | 2026-11-17 |
| 适用范围 | 社媒发布、视频上传、GA4 读取（预研） |
| 依据 | `API_RESEARCH.md` 来源清单 [S1]–[S65] |

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

**审核要求**：Community Management API 需 Development tier 审核，再申请 Standard tier（录屏 + 技术签核）。调用者必须是组织页 ADMINISTRATOR / CONTENT_ADMIN / DIRECT_SPONSORED_CONTENT_POSTER。

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
4. 发布类操作默认关闭真实通道，必须同时满足：`ALLOW_REAL_PUBLISH=true` + CLI `--confirm-publish` + 非 mock 凭证。

---

## 4. Token 生命周期处理

| 场景 | 处理 |
|---|---|
| 即将过期 | 提前 10% 有效期刷新；刷新失败标记 `AUTH_EXPIRED`，停止发布并告警 |
| 无 refresh token | 记录到期时间，到期后要求重新授权（LinkedIn 普通应用典型场景） |
| 刷新返回新 refresh token | 原子替换并持久化，避免旧 token 失效 |
| 撤销授权 | 调用平台撤销端点（如 Google `oauth2.googleapis.com/revoke`），删除本地 token |
| 权限被收回 | API 返回 401/403 时标记 `PERMISSION_REVOKED`，不自动重试 |

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

# 聚合（Ayrshare）
AYRSHARE_API_KEY=
AYRSHARE_BASE_URL=https://api.ayrshare.com

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=http://127.0.0.1:8787/callback/linkedin

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
