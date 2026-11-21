# Postiz 平台覆盖与能力边界

> 代码证据：`gitroomhq/postiz-app`，commit `6be4874631fea453f99115a78fd543c71820ab45`（2026-11-20），AGPL-3.0。
> 合规前提：沿用 `28_postiz_agpl_compliance_audit` 的 `ADOPT_WITH_ADAPTER` 结论——原版独立部署、独立 Adapter、官方 API、零源码修改；若改源码/白标则需商业授权。
> 本轮未部署 Postiz、未创建 OAuth 应用、未连接任何账号。

## 1. 两种使用方式

| 方式 | 费用 | 平台应用 | 审核负担 | 适用 | 状态 |
|---|---|---|---|---|---|
| Postiz Cloud | $29/月起（5 渠道）；$39/月（10）；$49/月（30）；$99/月（100）；年付 $278/$374/$470/$950；7 天试用 | Postiz 提供已审核应用 | 低 | 先跑运营、少运维 | `CONFIRMED`（E-40） |
| 自建（AGPL） | 软件 $0；服务器/运维另计 | 需自行申请各平台开发者应用 | 高（Meta/YouTube/TikTok 可能数周） | 数据自主、长期成本可控 | `CONFIRMED`（E-42） |

> Cloud 的“渠道数”按已连接账号计；具体计费口径以购买页为准。自建不等于零成本：服务器、备份、升级、OAuth 应用维护都要人。

## 2. 本计划范围内的覆盖矩阵

| 平台 | Postiz provider | 可发布内容 | 关键限制 | 账号分析 | 自建需开发者应用 | 结论 |
|---|---|---|---|---|---|---|
| YouTube | `youtube` | 视频（mp4） | 每条恰好 1 个 mp4；标题 1–100；描述 ≤5,000；标签 ≤500；缩略图需手机验证频道 | 是 | 是（Google Cloud） | 支持 |
| LinkedIn Page | `linkedin-page` | 文本、图片、视频、轮播（≥2 图） | 正文 3,000；author 为 `urn:li:organization:*`；最多 1 个视频附件 | 是 | 是（需与 Page 关联并申请产品） | 支持 |
| Facebook Page | `facebook` | 文本、图片、视频、Story | 正文 63,206；provider 无 Reels 专用路径 | 是 | 是（Meta 应用；公开应用需企业认证） | 支持 |
| Instagram | `instagram` / `instagram-standalone` | 图片、视频、Reels、Stories、轮播、试播 Reels | 正文 2,200；媒体需公网 URL | 是 | 是（Meta 应用） | 支持 |
| TikTok | `tiktok` | 视频 | 正文 2,000；未审核客户端只能发私密账号 | 是 | 是（公网 HTTPS + 域名验证） | 支持（受限） |
| TikTok Business | `tiktok-business` | 视频 | `DIRECT_POST` 直接发布；`UPLOAD` 仅存收件箱并丢弃设置；媒体域名需在应用内验证 | 是 | 是（TikTok Business 应用） | 支持（受限） |
| X | `x` | 文本、图片、视频、文章 | 普通帖 280；Articles 100,000 字符且仅图片，需 X Premium | 是 | 是（OAuth 1.0a Native App） | 支持（不发文章） |
| Pinterest | `pinterest` | 图片 Pin、视频 Pin | 正文 500；必须选 Board；视频 Pin 需封面图 | 是 | 是（应用审核） | 支持 |
| Reddit | `reddit` | 文本/链接/图片（按 subreddit） | 正文 10,000；`maxConcurrentJob=1`（1 req/s）；按 subreddit 配置 | 否 | 是（OAuth 应用） | 支持（不建议自动化） |
| Medium | `medium` | 文章 | Markdown；标题必填；正文 100,000；Integration Token | 否 | 否（仅 API Key） | 支持 |
| Threads | `threads` | 文本、图片、视频 | 正文 500 | 是 | 是（Meta 应用） | 支持 |
| Bluesky | `bluesky` | 文本、图片 | 无开发者应用，App Password | 否 | 否 | 支持 |
| **Vimeo** | **无 provider** | — | — | — | — | **不支持** |

## 3. 分析能力边界

Postiz 文档列出的账号级分析覆盖 10 类平台：

| 平台 | 是否回传账号分析 | 时间范围 | 状态 |
|---|---|---|---|
| Facebook Page | 是 | 7/30/90 天 | `CONFIRMED`（E-41） |
| Instagram（两种） | 是 | 7/30/90 天 | `CONFIRMED` |
| LinkedIn Page | 是 | 7/30/90 天 | `CONFIRMED` |
| TikTok（含 Business） | 是 | 7/30/90 天 | `CONFIRMED` |
| YouTube | 是 | 7/30/90 天 | `CONFIRMED` |
| Pinterest | 是 | 7/30/90 天 | `CONFIRMED` |
| Threads | 是 | 7/30/90 天 | `CONFIRMED` |
| X | 是 | 7/30/90 天 | `CONFIRMED` |
| Google Business Profile | 是 | 7/30/90 天 | `CONFIRMED`（本计划不使用） |
| Reddit | 否 | — | `CONFIRMED` |
| Medium | 否 | — | `CONFIRMED` |
| Bluesky | 否 | — | `CONFIRMED` |
| Vimeo | 不适用 | — | `CONFIRMED` |

**含义**：Reddit/Medium/Bluesky 的成效必须回到站点 UTM/GA4 与平台原生后台看，不能只看 Postiz 报表。

## 4. 逐平台能力细节

### 4.1 YouTube

| 项 | 事实 | 来源 |
|---|---|---|
| 上传 | resumable upload，`part=id,snippet,status`，`notifySubscribers=true` | `youtube.provider.ts` |
| 文件 | 每次恰好 1 个 mp4 | 同上 |
| 标题/描述 | 1–100 / ≤5,000 | `youtube.settings.dto.ts` |
| 标签 | 总长 ≤500；含空格标签额外 +2 字符 | 同上 |
| 可见性 | public / private / unlisted | 同上 |
| 儿童内容 | `selfDeclaredMadeForKids` = yes/no 必填 | 同上 |
| 缩略图 | `thumbnails.set`；频道未手机验证会报错，提示去 Studio 手动设置 | `youtube.provider.ts` |
| Shorts | 无专用字段/路径 | 代码检索 |
| 并发 | `maxConcurrentJob = 200`（“strict upload quotas”） | `youtube.provider.ts` |

### 4.2 LinkedIn Page

| 项 | 事实 |
|---|---|
| Scope | 含 `rw_organization_admin`、`w_organization_social`、`r_organization_social` 等 |
| Author | `urn:li:organization:${integration.internalId}` |
| 端点 | `https://api.linkedin.com/rest/posts` |
| 分析 | organizationPageStatistics / organizationalEntityFollowerStatistics / organizationalEntityShareStatistics |
| 附件 | 最多 1 个视频；轮播至少 2 张图 |
| 正文 | 3,000 字符（Postiz 文档） |

### 4.3 Facebook / Instagram

| 项 | Facebook | Instagram |
|---|---|---|
| 内容 | 文本、图片、视频；`post_type: post/story` | 图片、视频、Reels、Stories、轮播、试播 Reels |
| Reels | provider 无 Reels 专用路径 | `media_type=REELS` |
| 正文上限 | 63,206 | 2,200 |
| 账号类型 | Page | Business/Creator |

### 4.4 TikTok

| 项 | 事实 |
|---|---|
| 未审核限制 | 错误 `unaudited_client_can_only_post_to_private_accounts` |
| Business 发布模式 | `DIRECT_POST` 直接发布；`UPLOAD` 仅存入收件箱并丢弃设置 |
| 媒体域名 | 必须是 TikTok Business 应用中验证过的站点域名 |
| 正文 | 视频 2,000；Business 2,200 |
| 公开站点 | 开发者应用需要公网 HTTPS 站点 |

> 结论：第二个月不要把 TikTok 当作“接上就能公开分发”的渠道；先手动发布验证内容与受众。

### 4.5 X

| 项 | 事实 |
|---|---|
| 类型 | `post` 或 `article` |
| 文章 | 100,000 字符、仅图片；源码明确报错“Publishing articles on X requires an X Premium subscription” |
| 建议 | 第二个月只发普通帖，不买 Premium |

### 4.6 Reddit

| 项 | 事实 |
|---|---|
| 并发 | `maxConcurrentJob = 1`（1 req/s） |
| 配置 | 按 subreddit 维度 |
| 政策 | Rule 2：真实参与，禁止 spam/内容操纵 |
| 建议 | 不用 Postiz 自动发帖；人工答疑，必要时用 Postiz 做草稿/提醒 |

### 4.7 Pinterest

| 项 | 事实 |
|---|---|
| API | v5；media / boards / pins |
| 必填 | 每条 Pin 必须选 Board |
| 正文 | 500 字符 |
| 视频 Pin | 需视频 + 封面图 |

### 4.8 Medium

| 项 | 事实 |
|---|---|
| 认证 | Integration Token（API Key），非 OAuth 应用 |
| 内容 | Markdown；标题必填；正文 100,000 |
| 分析 | Postiz 不提供账号分析 |

## 5. 自建时的开发者应用清单

| 平台 | 需要 | 审核/等待 | 备注 |
|---|---|---|---|
| YouTube | Google Cloud 项目、OAuth Client、YouTube Data API v3 | 配额 `UNKNOWN` | 手机验证是频道功能，不是 API 应用审核 |
| LinkedIn Page | Developer app + 已验证 Page；Share on LinkedIn、OpenID Connect、Advertising API | 需审核 | Page 认证本身是付费路径，与应用审核是两件事 |
| Facebook / Instagram | Meta 应用、Live 模式、权限；公开应用需企业认证 | 可能数周 | 与 Page 认证不同 |
| TikTok | 公网 HTTPS、域名验证、Content Posting API | 未审核客户端受限 | Business 另有应用 |
| X | OAuth 1.0a Native App | API 档位 `UNKNOWN` | 文章另需 Premium |
| Pinterest | 应用审核 | 需审核 | — |
| Reddit | OAuth 应用 | 无付费门槛 | 遵守速率与社区规则 |
| Threads | Meta 应用与权限 | 同 Meta | — |
| Medium | Integration Token | 无应用审核 | — |
| Bluesky | App Password | 无 | — |

**无需开发者应用的 provider（Postiz 文档，共 10 个）**：Bluesky、Lemmy、Nostr、Medium、Dev.to、Hashnode、WordPress、Listmonk、Moltbook、Skool。本计划只用到 Medium；其余不在范围。

## 6. Postiz 做不到的事（必须人工）

| 事项 | 原因 | 处理 |
|---|---|---|
| 注册账号、设置用户名/头像/横幅 | 平台后台操作，不是发布 API | 人工完成 |
| 手机验证、企业认证、Page 认证 | 平台审核流程 | 人工完成 |
| 首次 OAuth 授权 | 需账号持有人登录同意 | 用户操作，Agent 不接触密码 |
| YouTube Shorts 专用发布 | provider 无专用字段 | 手动或用普通视频 |
| Vimeo 发布 | 无 provider | 手动 |
| 广告投放 | 本计划不含 | 另立项目 |
| 评论/私信管理 | 不在本包范围 | 平台原生后台 |
| 超出 7/30/90 天的历史分析 | Postiz 分析范围 | 平台原生后台/自建报表 |
| 平台政策申诉 | 需人工沟通 | 用户/运营 |

## 7. 推荐接入顺序（若获批）

1. **先 Cloud 试跑**（7 天试用）验证 5 个核心平台能否顺利授权与发布；不买年付。
2. 若数据/合规要求自建，再按 28_ 的 `ADOPT_WITH_ADAPTER` 部署原版 Postiz + 独立 Adapter。
3. 先接 YouTube、LinkedIn Page、Facebook、Instagram、X；Pinterest/Threads 次之。
4. TikTok 只做手动；Reddit 只做人工；Medium 视内容策略。
5. 任何连接前，先完成账号 2FA、管理员、品牌资料。

> 接入顺序是 `PROPOSED`，不是已批准。Cloud vs 自建涉及预算与合规，需用户决定。

## 8. 风险

| 风险 | 影响 | 缓解 | 状态 |
|---|---|---|---|
| 平台 API 变更 | 发布失败 | 固定 Postiz 版本；关注 release；保留手动发布预案 | `RECOMMENDED` |
| Token 过期/撤销 | 排程中断 | 监控连接状态；定期重授权 | `RECOMMENDED` |
| 速率限制 | 发布延迟 | 错峰；Reddit 1 req/s；YouTube 配额实测 | `CONFIRMED`（限制存在） |
| 未审核应用 | TikTok 只能发私密 | 手动发布或走审核 | `CONFIRMED` |
| 自建应用审核周期 | 上线延迟 | 先 Cloud 试跑；并行申请 | `RECOMMENDED` |
| 把 Postiz 当“全自动” | 资料/认证仍需人工 | 明确人工清单（第 6 节） | `RECOMMENDED` |
| 违反 28_ 边界 | AGPL 风险 | 不改源码、不 import、不共库；走公开 API | `CONFIRMED` |

## 9. 连接前检查清单

- [ ] 账号已注册、邮箱已验证、2FA 已开。
- [ ] 主页资料已补全（至少名称/头像/简介/网站）。
- [ ] 已确认账号角色（Page admin / channel owner / organization admin）。
- [ ] 已决定 Cloud 或自建；预算已批准。
- [ ] 自建时：开发者应用已创建并通过必要审核。
- [ ] Token 存储方案已确定（加密、最小权限、可轮换）。
- [ ] 已定义发布审批流程（谁写、谁审、谁发）。
- [ ] 已定义 UTM 规则与落地页。
- [ ] 已准备失败预案（手动发布、重新授权、回滚排程）。