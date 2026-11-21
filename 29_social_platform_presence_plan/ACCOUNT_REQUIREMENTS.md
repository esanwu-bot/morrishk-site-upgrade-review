# 账号要求与管理员模型

> 本轮没有登录任何平台后台，也没有注册账号。以下为基于官方文档、Postiz 文档与 Postiz provider 源码的**要求说明**，不是账号现状。
> 所有平台的实际状态见 `ACCOUNT_STATUS_INVENTORY.md`，一律为 `UNKNOWN` / `NOT_STARTED`。

## 1. 通用前置

| 项 | 要求 | 结论状态 |
|---|---|---|
| 品牌邮箱 | 可接收验证码与平台通知；建议 `social@` 或 `marketing@` 企业域名邮箱 | `USER_ACTION_REQUIRED` |
| 密码管理 | 品牌专用密码库；每个平台独立强密码 | `USER_ACTION_REQUIRED` |
| 双因素 | 所有平台开启 2FA；保留恢复码离线副本 | `USER_ACTION_REQUIRED` |
| 管理员 | 每个资产至少 2 名管理员 + 1 名 break-glass | `USER_ACTION_REQUIRED` |
| 法定信息 | 公司法定名称、注册地址、网站、隐私政策 URL、可公开联系方式 | `USER_ACTION_REQUIRED` |
| 品牌口径 | 一句话简介、长简介、禁用词清单 | `USER_ACTION_REQUIRED`（现有权威文档未给出品牌口号） |
| 凭证边界 | 密码/Token/Secret 只由用户持有；Agent 不接收、不代填、不代收验证码 | `CONFIRMED` |

## 2. 逐平台账号要求

### 2.1 LinkedIn Company Page（P0 · 第 1）

| 项 | 内容 | 状态 |
|---|---|---|
| 账号类型 | 企业主页（Company Page），不是个人 Profile | `CONFIRMED`（E-12） |
| 建页前提 | 必须已有个人 LinkedIn 账号；需在桌面端或 iOS 创建；创建者为 super admin | `CONFIRMED`（E-12） |
| 费用 | 建页免费 | `CONFIRMED`（E-12） |
| 管理员 | 个人账号被授予 Page admin；建议 ≥2 名 super admin | `RECOMMENDED` |
| 认证 | 需 Premium Company Page 或付费 Jobs/Ads 等产品；免费试用不符合条件；审核最长 10 天 | `CONFIRMED`（E-14） |
| 认证价格 | 官方未公开，需销售询价 | `UNKNOWN` |
| 个人会员 | 不要求；Premium 个人会员与主页认证是两件事 | `CONFIRMED`（E-16） |
| 自建 Postiz 应用 | LinkedIn developer app；需与已验证 Page 关联；申请 Share on LinkedIn、OpenID Connect、Advertising API 等产品 | `CONFIRMED`（E-42） |
| 手工步骤 | 建 Page → 上传 Logo/Cover → 填写 About/Website/Industry/Size/Location → 邀请管理员 → 发布首帖 | `USER_ACTION_REQUIRED` |

**第二个月建议**：先建页并完成资料，不购买认证。认证的边际价值主要是徽章与部分能力，价格未知，等报价后再决定。

### 2.2 YouTube Brand Channel（P0 · 第 2）

| 项 | 内容 | 状态 |
|---|---|---|
| 账号类型 | Google 账号 + YouTube 频道；建议使用 Brand Account 以便多人管理 | `CONFIRMED`（E-01） |
| 费用 | 建频道免费 | `CONFIRMED`（E-01） |
| 管理员 | Brand Account 可添加多个所有者/管理者，不必共享个人 Google 密码 | `RECOMMENDED`（E-01） |
| 手机验证 | 解锁自定义缩略图、直播、>15 分钟视频、版权申诉；同一手机号每年最多验证 2 个频道 | `CONFIRMED`（E-03） |
| Handle | 3–30 字符，每频道唯一，不可转让 | `CONFIRMED`（E-04） |
| 变现 | YPP 门槛 1,000 订阅 + 4,000 小时/12 月或 1,000 万 Shorts 观看/90 天；第二个月不追求 | `CONFIRMED`（E-05） |
| 自建 Postiz 应用 | Google Cloud 项目 + OAuth Client + 启用 YouTube Data API v3；配额数值未确认 | `UNKNOWN`（E-09） |
| 手工步骤 | 建 Brand Account → 设 Handle → 手机验证 → 上传头像/横幅 → 填简介/链接/联系方式 → 建播放列表 | `USER_ACTION_REQUIRED` |

### 2.3 Facebook Page（P0 · 第 3）

| 项 | 内容 | 状态 |
|---|---|---|
| 账号类型 | Facebook Page（公共主页） | `CONFIRMED` |
| 建页前提 | 由个人 Facebook 账号创建；建议纳入 Meta Business Portfolio 统一管理 | `RECOMMENDED` |
| 费用 | 建页免费；官方计费页本轮被登录墙拦截，未发现收费项 | `UNKNOWN`（计费页）/ `RECOMMENDED`（按免费规划） |
| 管理员 | 个人账号以管理员身份加入；建议 ≥2 人 | `RECOMMENDED` |
| 企业认证 | 使用公开 Meta 应用且 Live 模式发布时，Postiz 文档要求业务验证 | `CONFIRMED`（E-24，Postiz 文档） |
| 认证费用 | 未取得官方计费页，不列入预算 | `UNKNOWN` |
| 官方页面访问 | `facebook.com/business` 本轮被登录墙拦截 | `BLOCKED`（E-22） |
| 自建 Postiz 应用 | Meta 开发者应用；需 `pages_manage_posts` 等权限；公开应用需企业认证 | `CONFIRMED`（E-42） |
| 手工步骤 | 建 Page → 设类别/简介/联系方式 → 上传头像/封面 → 加入 Business Portfolio → 邀请管理员 → 绑定 Instagram | `USER_ACTION_REQUIRED` |

### 2.4 Instagram 专业账号（P0 · 第 4）

| 项 | 内容 | 状态 |
|---|---|---|
| 账号类型 | Business 或 Creator 专业账号 | `CONFIRMED`（E-19） |
| 切换费用 | 免费；一个个人账号最多管理 10 个专业账号；绑定 Facebook Page 可选 | `CONFIRMED`（E-19） |
| 绑定 FB Page | 建议绑定，便于统一投放与跨平台发布 | `RECOMMENDED` |
| 企业认证 | 使用公开 Meta 应用发布时需业务验证（与 Facebook 同一 Meta 应用） | `CONFIRMED`（E-24，Postiz 文档） |
| 自建 Postiz 应用 | 同一 Meta 应用；需 `instagram_content_publish` 等权限 | `CONFIRMED`（E-42） |
| 内容能力 | Postiz 支持 REELS、STORIES、VIDEO、CAROUSEL、试播 Reels | `CONFIRMED`（E-20） |
| 手工步骤 | 个人账号 → 设置 → 切换为专业账号 → 选类别 → 绑定 Page → 补全简介/联系 → 上传头像 | `USER_ACTION_REQUIRED` |

### 2.5 X（P0 · 第 5）

| 项 | 内容 | 状态 |
|---|---|---|
| 账号类型 | 品牌账号（独立 X 账号） | `CONFIRMED` |
| 费用 | 建号免费；官方计费页本轮被 Cloudflare 拦截，未发现收费项 | `UNKNOWN`（计费页）/ `RECOMMENDED`（按免费规划） |
| 2FA | 必须开启；恢复码离线保存 | `USER_ACTION_REQUIRED` |
| 文章能力 | 发布 Articles 需要 X Premium；Postiz 源码明确报错要求 Premium | `CONFIRMED`（E-29） |
| Premium 价格 | 未取得官方价目页 | `UNKNOWN` |
| API 访问 | 自建 Postiz 使用 OAuth 1.0a Native App；API 档位与价格未确认 | `UNKNOWN`（E-31） |
| 官方帮助页 | `help.x.com` 本轮被 Cloudflare 拦截 | `BLOCKED`（E-30） |
| 手工步骤 | 建号 → 设 Handle/头像/横幅/简介/链接 → 开 2FA → 固定一条品牌介绍帖 | `USER_ACTION_REQUIRED` |

**第二个月建议**：只发普通帖与图片，不使用 Articles；不购买 Premium。

### 2.6 Pinterest Business（P1 · 条件性）

| 项 | 内容 | 状态 |
|---|---|---|
| 账号类型 | 免费 Business 账号 | `CONFIRMED`（E-32） |
| 费用 | 建号免费 | `CONFIRMED`（E-32） |
| 网站认领 | 建议认领官网，提升来源可信度；具体验证方式执行时核对官方页 | `RECOMMENDED` / 流程 `UNKNOWN` |
| 自建 Postiz 应用 | Pinterest 应用需审核 | `CONFIRMED`（E-42） |
| Postiz 约束 | 每条 Pin 必须选择 Board；正文上限 500 字符；视频 Pin 需视频 + 封面图 | `CONFIRMED`（E-33） |
| 手工步骤 | 建 Business 账号 → 补全资料 → 建 Board → 认领网站 → 上传首批产品图 | `USER_ACTION_REQUIRED` |

### 2.7 TikTok（P1 · 手动试点）

| 项 | 内容 | 状态 |
|---|---|---|
| 账号类型 | TikTok 账号 / Business 账号 | `CONFIRMED` |
| 费用 | 建号免费；官方计费页本轮不可达，未发现收费项 | `UNKNOWN`（计费页）/ `RECOMMENDED`（按免费规划） |
| 自建 Postiz 应用 | 开发者应用需公网 HTTPS 站点；媒体 URL 域名需在应用内验证 | `CONFIRMED`（E-26/E-27） |
| 未审核限制 | 未审核客户端只能发布到私密账号；Postiz 源码含对应错误 | `CONFIRMED`（E-25） |
| 发布模式 | `DIRECT_POST` 直接发布；`UPLOAD` 仅存入收件箱并丢弃设置 | `CONFIRMED`（E-26） |
| 官方开发者文档 | 本轮域名超时/跳转，未取得 | `BLOCKED`（E-28） |
| 手工步骤 | 建号 → 完善资料 → 绑定站点域名 → 先手动发布验证内容 → 再评估 API | `USER_ACTION_REQUIRED` |

**第二个月建议**：不依赖 API；如要做，先手动发布 3–5 条测试内容，验证受众与产能。

### 2.8 Reddit（P2 · 只读观察）

| 项 | 内容 | 状态 |
|---|---|---|
| 账号类型 | 个人账号；品牌以官方账号参与需遵守社区规则 | `CONFIRMED` |
| 费用 | 免费；官方计费页未取得，未发现建号收费项 | `UNKNOWN`（计费页）/ `RECOMMENDED`（按免费规划） |
| 社区规则 | Rule 2：真实参与，禁止 spam 与内容操纵 | `CONFIRMED`（E-34） |
| Postiz 约束 | 每 1 秒最多 1 次请求；按 subreddit 配置 | `CONFIRMED`（E-35） |
| 建议 | 以人工技术答疑为主，不自动发帖；无合适问题时只读观察；先贡献价值 | `RECOMMENDED` |

### 2.9 Medium（P1 · 条件性）

| 项 | 内容 | 状态 |
|---|---|---|
| 账号类型 | 个人账号 | `CONFIRMED` |
| 发布费用 | 发布免费；Member $5/月、Friend $15/月为阅读会员 | `CONFIRMED`（E-36） |
| 接入方式 | Integration Token（API Key），不是 OAuth 应用 | `CONFIRMED`（E-37） |
| Postiz 约束 | Markdown；标题必填 | `CONFIRMED`（E-37） |
| 建议 | 仅当站点博客产能不足、需要外链与行业观点时启用；注意 canonical | `PROPOSED` |

### 2.10 Vimeo（P2 · 暂缓）

| 项 | 内容 | 状态 |
|---|---|---|
| 账号类型 | 个人/企业账号 | `CONFIRMED` |
| 免费档 | 存在免费档；容量/带宽上限未逐项确认 | `UNKNOWN` |
| 付费档 | Creator $9/月（年付）或 $16/月；Core $24.50/$40；Professional $71/$120 | `CONFIRMED`（E-38） |
| Postiz | **不支持**（provider 列表无 Vimeo） | `CONFIRMED`（E-39） |
| 建议 | 第二个月暂缓；若官网需要无广告/可定制播放器再评估 | `PROPOSED` |

## 3. 企业认证 / 资质矩阵

| 平台 | 是否需要营业执照 | 需要什么 | 是否收费 | 状态 |
|---|---|---|---|---|
| LinkedIn Page 认证 | 需要企业真实信息，但不是“上传营业执照”式认证 | 法定名称、网站、工作邮箱、管理员活跃度、政策合规；需 Premium Company Page 或付费产品 | 是（价格 `UNKNOWN`） | `CONFIRMED`（E-14） |
| Meta 企业认证 | 公开应用/规模化发布时需要 | 法定实体资料、域名/网站、电话等；具体清单以申请页为准 | `UNKNOWN` | `CONFIRMED`（要求）/ `UNKNOWN`（费用） |
| TikTok 开发者 | 不要求营业执照 | 公网 HTTPS 站点、域名归属验证、应用审核 | 免费 | `CONFIRMED`（E-27） |
| Pinterest 开发者 | 不要求营业执照 | 应用审核 | 免费 | `CONFIRMED`（E-42） |
| YouTube | 不要求 | 手机验证（频道功能）；API 项目（自建时） | 免费 | `CONFIRMED`（E-03） |
| X | 不要求 | Premium（仅文章）；开发者应用（自建时） | 文章付费 | `CONFIRMED`（E-29） |
| Reddit | 不要求 | 遵守社区规则；OAuth 应用（自建时） | 免费 | `CONFIRMED`（E-34） |
| Medium | 不要求 | Integration Token | 免费 | `CONFIRMED`（E-37） |
| Vimeo | 不要求 | 付费档（仅在需要高级能力时） | 是 | `CONFIRMED`（E-38） |

## 4. 自建 Postiz 时的开发者应用门槛

> 若选择 Postiz Cloud，则由 Postiz 提供已审核应用，以下门槛不落在 Morrishk 身上；若自建，则全部需要自行申请。

| 平台 | 自建应用要求 | 审核/等待 | 状态 |
|---|---|---|---|
| YouTube | Google Cloud 项目、OAuth Client、YouTube Data API v3 | 配额与审核 `UNKNOWN` | `CONFIRMED`（机制） |
| LinkedIn Page | Developer app 与已验证 Page 关联；申请 Share on LinkedIn、OpenID Connect、Advertising API | 需审核 | `CONFIRMED`（E-42） |
| Facebook / Instagram | Meta 应用、Live 模式、权限；公开应用需企业认证 | 企业认证可能数天至数周 | `CONFIRMED`（E-24/E-42） |
| TikTok | 公网 HTTPS 站点、域名验证、Content Posting API | 未审核客户端受限 | `CONFIRMED`（E-25/E-27） |
| X | OAuth 1.0a Native App | API 档位 `UNKNOWN` | `CONFIRMED`（E-29） |
| Pinterest | 应用审核 | 需审核 | `CONFIRMED`（E-42） |
| Reddit | OAuth 应用 | 无付费门槛 | `CONFIRMED`（E-35） |
| Medium | Integration Token | 无应用审核 | `CONFIRMED`（E-37） |
| Threads | Meta 应用与权限 | 同 Meta | `CONFIRMED`（E-42） |
| Bluesky | App Password | 无开发者应用 | `CONFIRMED`（E-42） |

## 5. 管理员账号风险与缓解

| 风险 | 后果 | 缓解 | 状态 |
|---|---|---|---|
| 只用一个人的个人账号做唯一管理员 | 离职/封号导致主页失控 | ≥2 名管理员 + break-glass；Brand Account/Business Portfolio | `RECOMMENDED` |
| 共享个人密码 | 无法审计、易泄露 | 用平台原生多管理员机制，不共享密码 | `RECOMMENDED` |
| 2FA 设备丢失 | 无法登录 | 恢复码离线保存；备用管理员 | `USER_ACTION_REQUIRED` |
| 品牌邮箱由个人持有 | 验证码与通知不可控 | 品牌邮箱由公司控制并纳入密码库 | `USER_ACTION_REQUIRED` |
| 用同一邮箱注册全部平台 | 单点失陷 | 品牌邮箱 + 独立强密码 + 2FA | `RECOMMENDED` |
| 代运营方持有 Token | 权限外溢 | 使用平台角色/最小权限；定期轮换 | `RECOMMENDED` |

## 6. 本轮不做的账号动作

- 不注册、不登录、不点击“创建主页”。
- 不申请认证、不提交企业资料、不购买套餐。
- 不创建开发者应用、不生成 OAuth 凭据。
- 不连接 Postiz、不写入任何 Token。
- 不邀请管理员、不发送任何邀请邮件。