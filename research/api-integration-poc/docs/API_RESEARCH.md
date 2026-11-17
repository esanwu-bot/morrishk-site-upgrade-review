# 社媒 / 视频 / GA4 API 技术调研

| 项目 | 内容 |
|---|---|
| 文档版本 | V1.1（按 Reviewer 复核意见修订） |
| 调研日期 | 2026-11-17 |
| 适用项目 | Morrishk 全球 B2B 独立站升级（预研） |
| 文档性质 | 技术预研，不构成功能承诺、采购决定或报价 |
| 依据范围 | 仅采用平台官方文档与供应商官方文档；每条结论标注来源编号（见第 7 节） |

**V1.1 修订说明**：按 Reviewer 复核意见，补充 Mux 上传请求的真实字段名（`new_asset_settings.playback_policies`）、GA4 `accountSummaries.list` 的真实响应结构与分页、Ayrshare 的幂等字段 `idempotencyKey`，并明确「Mock 分块计数 ≠ 真实断点续传」。所有新增结论仍来自官方文档，未进行任何真实凭证调用。

**标记约定**

- `[S#]`：第 7 节来源清单中的编号，链接均为本轮实际打开的页面。
- **UNVERIFIED**：本轮未能从官方页面直接确认，或页面为客户端渲染无法读取；不得作为决策依据。
- 所有价格为官方页面公开标价，最终以供应商报价与合同为准。

---

## 0. 结论摘要

1. **社媒官方 API 的能力是完整的，主要成本不是写代码，而是审核与资质**：Meta 需要 App Review + Business Verification，LinkedIn Community Management API 需要 Development → Standard 两级审核，TikTok 未审核应用只能发可见性受限的内容，YouTube 需要 compliance audit 才能提高配额。`[S6][S10][S17][S21]`
2. **聚合 API 能吸收一部分审核成本，但不会消除平台差异**：客户侧 OAuth 仍然存在，每平台的能力差异会以「选项对象 + 能力标志 + 错误码」的形式转移到聚合层；Ayrshare 自 2026-03-31 起 X 操作要求客户自备 X API 凭证，说明该模式在平台收紧时会把负担交还客户。`[S25]`
3. **视频托管与社媒发布必须分层**：YouTube、TikTok、Instagram、Facebook、LinkedIn 都要求各自上传一份字节流，托管服务不提供社媒分发；本轮未发现可靠的「托管 + 转码 + 跨平台发布」单一供应商。`[S24][S41][S3][S42][S45]`
4. **GA4 不需要聚合 API**：Data API、Admin API、Measurement Protocol 已覆盖报表、配置与事件写入；配额按 Property 独立计算，多客户可横向扩展。限制主要在数据阈值、抽样、行数上限，以及部分探索类报表没有公开 API。`[S46][S47][S51][S53][S60]`
5. **本轮无任何真实凭证**，所有真实接口验证状态为 `BLOCKED_CREDENTIAL`；Demo 以 Mock 模式跑通，详见 `DEMO_EVIDENCE.md`。

---

## 1. 社媒平台官方 API

### 1.1 Meta（Facebook Pages / Instagram Professional）

| 维度 | 结论 | 依据 |
|---|---|---|
| OAuth | Facebook Login 服务端授权码换取；也支持 Instagram Login | [S1][S3] |
| Token 生命周期 | 短期 token 约 1–2 小时；服务端换取长期 token 约 60 天；Page token；System User token 无固定过期时间 | [S1] |
| 应用审核 | 访问非自有数据需 App Review；**所有 Advanced Access 均要求 Business Verification** | [S6] |
| 账号类型 | Facebook Page；Instagram 需 Business/Creator 专业账号（可经 Page 关联或 IG Login） | [S3] |
| 发布 | FB：`POST /{page-id}/feed`；IG：先建容器再 `media_publish` | [S2][S3] |
| 编辑/删除 | 仅能编辑/删除本应用创建的帖子（FB） | [S2] |
| 媒体 | FB：图片、视频；IG：图片、视频、Reels、Stories、轮播；**IG 图片仅支持 JPEG，且媒体需公网可访问 URL** | [S3] |
| 数据读取 | IG Insights（曝光、触达、主页访问等）；Page Insights、评论读取的字段清单本轮未逐页核对 | [S4]，其余 **UNVERIFIED** |
| 速率限制 | 应用级约「200 × 用户数」/小时；Page 级按互动用户计算 CU/天；错误码 4/17 表示限流 | [S7] |
| 费用 | 无 API 调用费 | [S7] |
| 地区/合规 | 未在已读页面发现地区限制；Business Verification 是资质流程，无 API 替代 | [S6] |

**要点**：IG 发布流程是「容器 → 发布」两段式，图片必须 JPEG 且可公网访问，意味着需要一个媒体托管/转码环节；FB 与 IG 的权限、账号模型不同，不能合并成一个「发帖」动作。

### 1.2 LinkedIn（组织账号）

| 维度 | 结论 | 依据 |
|---|---|---|
| OAuth | 3-legged authorization code | [S8] |
| Token 生命周期 | Access token 60 天（`expires_in=5184000`），返回 refresh token；程序化刷新仅对特定合作伙伴开放，普通应用到期需重新授权 | [S8] |
| 应用审核 | Community Management API 属 vetted product：先 Development tier，再申请 Standard tier（需录屏与技术签核） | [S10] |
| 账号类型 | 组织主页；调用者需为 ADMINISTRATOR / CONTENT_ADMIN / DIRECT_SPONSORED_CONTENT_POSTER | [S9][S10] |
| 发布 | Posts API 创建/读取/部分更新/删除；删除返回 204，无批量删除 | [S9] |
| 媒体 | 图片、视频、文档、文章、MultiImage、投票；**自然流量不支持轮播（仅赞助内容）** | [S9] |
| 数据读取 | Follower Statistics、Page Statistics、Share Statistics、Social Metadata（互动/评论）、Video Analytics | [S10] |
| 速率限制 | Development tier：500 请求/应用、100/成员；Standard tier 限额未公开 | [S10] |
| 费用 | 无单独 API 费用 | — |
| 特殊限制 | `r_member_social` 权限**当前关闭申请** | [S10] |

**要点**：LinkedIn 的审核门槛在「组织页运营权限 + Standard tier 签核」，不是技术难点；token 60 天且普通应用无程序化刷新，需要设计到期提醒与重新授权流程。

### 1.3 X（原 Twitter）

| 维度 | 结论 | 依据 |
|---|---|---|
| OAuth | OAuth 2.0 Authorization Code **+ PKCE** | [S11] |
| Token 生命周期 | Access token 2 小时；仅当申请 `offline.access` 时返回 refresh token | [S11] |
| 应用审核 | 无正式审核流程；按用量付费购买额度 | [S13][S14] |
| 发布 | `POST /2/tweets`；媒体需单独上传 | [S12] |
| 媒体 | 支持图片/视频/GIF，分块上传；具体规格本轮 **UNVERIFIED** | [S12] |
| 数据读取 | 有读取接口；互动/分析接口清单本轮 **UNVERIFIED** | — |
| 速率限制 | 发帖约 100 次/15 分钟/用户；应用级 10,000/24 小时；标准套餐每月 300 万帖子读取 | [S14][S15] |
| 费用 | 按用量购买 credits，无订阅；具体单价本轮 **UNVERIFIED** | [S14] |
| 特殊限制 | 额度与读取上限由套餐决定，商业使用需按用量预算 | [S14] |

**要点**：X 是五家中唯一「付费换配额」的平台，成本随发布量与读取量线性增长；OAuth 2.0 PKCE + 2 小时 token 对后台任务不友好，必须实现 refresh 与失败重授权。

### 1.4 TikTok

| 维度 | 结论 | 依据 |
|---|---|---|
| OAuth | Login Kit 授权码模式；支持 refresh token；具体有效期本轮 **UNVERIFIED** | [S19] |
| 应用审核 | Content Posting API 需审核；**未审核客户端只能发布到私密/仅自己可见** | [S17] |
| 权限 | `video.publish`（直发）、`video.upload`（草稿）、`video.manage`（查询/编辑/删除）、`video.list` | [S16][S18] |
| 发布 | `POST /v2/post/publish/video/init/` → 分块 PUT（`Content-Range`） | [S17][S41] |
| 媒体 | 仅视频；最大 4GB、最长 10 分钟；推荐 MP4，支持 WebM/MOV | [S17] |
| 数据读取 | `user.info.stats` 提供粉丝/点赞/视频数；**权限表中未列出评论读取 scope** | [S18] |
| 速率限制 | 约 6 请求/分钟/用户 access token | [S17]（页面数值，建议上线前复测） |
| 费用 | 无公开 API 费用 | — |
| 特殊限制 | 无文档化的定时发布参数，排期需自建调度；未审核状态下发布结果会「降级为私密」而不是报错 | [S17] |

**要点**：TikTok 是审核风险最高的平台。未审核状态下的失败是「静默降级」，必须在发布后回查可见性，不能只看 HTTP 200。

### 1.5 YouTube

| 维度 | 结论 | 依据 |
|---|---|---|
| OAuth | Google OAuth 2.0；本轮未逐页核对具体 flow 细节 | [S23]，flow 细节 **UNVERIFIED** |
| 应用审核 | 提高配额需完成 compliance audit；未审核项目的上传可见性限制本轮 **UNVERIFIED** | [S21] |
| 发布 | `videos.insert`，支持 resumable upload | [S24] |
| 媒体 | 最大 256GB；`video/*` 或 `application/octet-stream`；时长上限本轮 **UNVERIFIED** | [S24] |
| 数据读取 | `commentThreads.insert` 等互动接口需 `youtube.force-ssl`；字幕 `captions.insert` | [S22][S20] |
| 配额 | 默认 10,000 units/天；**`videos.insert` 每次 1 unit，但每天 100 次调用上限**；`search.list` 同样 100 次/天；`captions.insert` 400 units | [S20]（本轮已回源确认） |
| 定时发布 | 原生支持 `status.publishAt` + `privacyStatus` | [S24] |
| 费用 | 无 API 费用；配额为重 | [S20] |

**要点**：YouTube 的正确理解是「上传次数上限 100 次/天」而不是「6 次/天」；配额主要限制的是搜索与字幕写入等重操作。定时发布是五家中最成熟的，适合由平台侧承担排期。

---

## 2. 社媒聚合 API

### 2.1 候选与现状

| 项目 | Ayrshare | Zernio（原 Late / getlate.dev） |
|---|---|---|
| 品牌现状 | 运营中 | `getlate.dev` 与 `docs.getlate.dev` 均 301 跳转至 `zernio.com` / `docs.zernio.com`；**签约前需确认商业主体与既有合同是否延续** |
| 平台数 | 14 个：Bluesky、Facebook、Google Business Profile、Instagram、LinkedIn、Pinterest、Reddit、Snapchat、Telegram、Threads、TikTok、WhatsApp、X、YouTube | 文档写 16 个平台（不同页面口径不一致，**以签约时清单为准**） |
| 统一发布 | `POST /api/post`，`platforms[]` + `scheduleDate` | 发布 + 排期接口 |
| 统一授权 | 客户在聚合平台完成各社媒 OAuth 关联 | `GET /v1/connect/{platform}` 打开浏览器授权 |
| 幂等 | `POST /api/post` 请求体支持 `idempotencyKey`；同一 key 重复提交会被供应商拒绝（错误码 110），**这是供应商侧幂等，与本地去重是两回事** | 幂等字段 **UNVERIFIED** |
| 视频 | 支持；**视频能力需付费套餐** | 支持（各平台上限 **UNVERIFIED**） |
| 分析/评论 | 提供分析与评论管理接口 | 提供分析与评论接口 |
| 客户仍需做的事 | 各平台账号 OAuth；LinkedIn 组织角色；IG 专业账号；**自 2026-03-31 起 X 操作需客户自备 X API 凭证** | 各平台 OAuth；平台审核是否完全由聚合方承担 **UNVERIFIED** |
| 定价 | 分档订阅（Launch → Enterprise）；具体价格页为客户端渲染，**本轮未能读取** | 按账号数计费；具体金额与计费周期以报价为准 |
| Webhook / 重试 | 有 Webhook；重试语义 **UNVERIFIED** | 有 Webhook；重试语义 **UNVERIFIED** |
| 数据位置 | 内容经供应商中转，需 DPA 与数据驻留确认 | 同左 |
| 锁定风险 | 高：payload 抽象 + 统一错误模型 | 高：同构 |

### 2.2 关键问题：聚合 API 是否真的减少开发量？

**部分减少，且少于宣传口径。** 分三类：

1. **真正被消除的**：Meta App Review + Business Verification、LinkedIn Community Management Development→Standard 签核、TikTok Content Posting 审核。这些是组织与法务门槛，不是代码；聚合方若已持有通过审核的应用，可以吸收。
2. **被转移而非消除的**：平台差异以「每平台选项对象、能力标志、错误分类」的形式出现在聚合层。IG 的 JPEG/公网 URL、LinkedIn 无自然轮播、TikTok 无评论 scope、YouTube 配额归属等仍然存在；仍需为每个平台写分支与测试。
3. **完全没有消除的**：终端用户 OAuth 仍在客户侧；LinkedIn 组织角色仍由客户组织决定；YouTube 配额按 Google Cloud 项目计算，聚合方的共享池是不可控上限；平台政策变化时，聚合方可以把负担交还客户（Ayrshare 的 X 变化即为实例）。

**判断**：聚合 API 大约节省「审核/认证流程 + 多套 token 刷新」这部分工作量（约四分之一到三分之一），代价是按账号数计费、单点故障、共享且不透明的配额、payload 级锁定。对于只发 2–3 个渠道、账号数量有限的 B2B 站点，官方 API 直连的总风险更低；只有当 TikTok 与 X 是上线首日刚需时，聚合才明显占优，因为这两个平台的非代码门槛最重。

---

## 3. 视频 API

### 3.1 托管与处理

| 能力 | Mux | Cloudinary（视频） | api.video |
|---|---|---|---|
| 直传 | 支持：服务端签发上传 URL，客户端直传 | 支持：签名或 unsigned preset | 支持 |
| 分片/断点续传 | 支持分片 | 支持；**>100MB 必须分片** | **UNVERIFIED**（文档站为 SPA，无法读取） |
| 转码/多分辨率 | 内置，HLS | 自动生成 HLS/MPEG-DASH，自适应码率 | 最高 4K，HLS |
| 缩略图 | `image.mux.com/{playback_id}/thumbnail.*` | 支持派生资源 | 支持 |
| CDN/播放器 | Mux Player / 播放 ID | 内置播放器、自适应流、字幕、章节 | 跨端播放器 |
| 字幕 | SRT/WebVTT，可创建字幕轨 | 播放器支持字幕 | 支持 |
| 处理 Webhook | 有（如 `video.upload.asset_created`） | **UNVERIFIED** | **UNVERIFIED** |
| 上传状态查询 | 有 upload 对象；具体端点本轮 **UNVERIFIED** | 按 `public_id` 查询（**UNVERIFIED**） | **UNVERIFIED** |
| 公开价格 | 存储 $0.003/分钟/月；分发 $0.001/分钟（每月 10 万分钟免费）；$20 月度抵扣 | 按 credits 计费；具体换算 **UNVERIFIED** | 存储 $0.00285/分钟/月；分发 $0.0017/分钟；沙箱视频 30 秒、带水印、24 小时删除 |

依据：[S30]–[S40]。

**Mux 直传的真实字段（按官方文档核对）**：

- 创建直传：`POST /video/v1/uploads`，请求体使用 `new_asset_settings.playback_policies`（**复数、数组**），例如 `{"playback_policies":["public"]}`；`cors_origin`、`passthrough` 为同级字段。[S30]
- 创建响应为 snake_case：`id`、`url`、`status`、`asset_id`（上传完成后才有值）。[S30]
- 资产对象为 snake_case：`id`、`status`、`duration`、`aspect_ratio`、`playback_ids[]`（每项含 `id`/`policy`）。[S31]
- Demo 在 provider 层做 snake_case → camelCase 归一化（`assetId`、`playbackId`、`playbackPolicy`、`aspectRatio`），业务层不直接消费供应商原始字段。
- **Mock 模式的分块计数只演示上传状态机，不等于真实的分片/断点续传能力**；真实续传需要真实凭证与网络条件验证，本轮状态为 `BLOCKED_CREDENTIAL`。

**选择倾向（待客户确认预算后定稿）**：Mux 的直传、分片、Webhook、字幕与状态模型最完整，适合作为主候选；api.video 单位价格更低，适合成本敏感场景；Cloudinary 的优势在图片与视频统一治理，若站点已有图片 CDN 需求可一并评估。三家的真实计费需以报价与用量模型核算。

### 3.2 社媒视频发布

| 平台 | 上传方式 | 限制（已核验） | 审核/权限门槛 | 原生定时 |
|---|---|---|---|---|
| YouTube | `videos.insert`，resumable | 256GB；`video/*` | compliance audit 才能提配额 | **支持**（`publishAt` + `privacyStatus`） |
| TikTok | init → 分块 PUT | 4GB / 10 分钟；MP4 推荐 | 未审核只能发私密 | 无文档化参数 |
| Instagram Reels | 容器（`upload_type=resumable`）→ `media_publish` | 15 分钟 / 300MB；建议 9:16；每 24 小时 100 条 API 发布 | `instagram_content_publish` + 应用审核 | 无（需自建排期） |
| Facebook 视频 | `/uploads` 会话 + `file_offset` 分块 | 大小/时长本轮 **UNVERIFIED** | `pages_manage_posts` | **支持**（`scheduled_publish_time`） |
| LinkedIn 视频 | initializeUpload → 4MB 分片 PUT → finalizeUpload | 3 秒–30 分钟、75KB–500MB（Feed）；API `fileSizeBytes` 上限 5GB；上传 URL 约 30 天有效 | `w_organization_social` + 组织角色 | **UNVERIFIED** |

依据：[S24][S17][S41][S3][S44][S42][S43][S45]。

### 3.3 四个必答问题

1. **是否应先上传到统一托管，再分发社媒？**
   是，但目的不是「一次上传到处播放」。各平台都要求各自上传一份字节流并重新转码；托管的目的是：一个母版、一套转码/缩略图/字幕、站内播放、统一断点续传与归档。分发仍需逐平台上传。
2. **托管 API 与社媒发布 API 是否应分开？**
   是。托管是资产生命周期（上传令牌、Webhook、播放 ID、按分钟计费）；发布是身份与政策（OAuth、审核、速率、平台限制）。耦合会把发布路线绑死在托管商的发布节奏上，而托管商均不提供社媒发布。
3. **是否存在同时解决托管、转码、跨平台社媒发布的可靠聚合？**
   本轮未发现。Mux、Cloudinary、api.video 均只做托管/分发，不做社媒发布；社媒聚合商不做托管。实际是「1 个托管 + N 个平台应用」。
4. **大文件是否支持分片、续传、状态查询？**
   Mux、Cloudinary 明确支持分片；api.video 未能核实；各社媒平台的上传流程本身即分片/可恢复（YouTube resumable、TikTok chunk PUT、FB offset、LinkedIn parts、IG rupload）。

---

## 4. GA4 API

### 4.1 Data API（只读报表）

- 基址 `https://analyticsdata.googleapis.com/v1beta`，按 Property 调用：`runReport`、`runPivotReport`、`runRealtimeReport`、`batchRunReports`、`checkCompatibility`、`getMetadata`。**一次请求只能针对一个 Property**，批量接口也限于同一 Property。[S46]
- 已确认可查询的指标/维度：`sessions`、`totalUsers`、`activeUsers`、`screenPageViews`、`eventCount`、`sessionSource`、`sessionMedium`、`pagePath`、`date`、`sessionDefaultChannelGroup` 等；自定义字段用 `customEvent:` / `customUser:` 前缀；字段兼容性用 `checkCompatibility` 校验。[S48]
- 日期范围：每请求最多 **4 个**；支持 `today`、`yesterday`、`NdaysAgo`。[S50]
- 分页：单请求最多 **250,000 行**，默认 10,000；用 `offset` 翻页。[S49]
- 配额（按 Property 独立计算）：标准 200,000 core tokens/天、40,000/小时、10 并发；360 为 10 倍。多数请求 ≤10 tokens。[S47]（**本轮二次直连该页失败，数字来自调研读取，Reviewer 请以浏览器复核**）
- 数据限制：数据阈值（小用户量行被整体隐藏）、高基数维度聚合为 `(other)`、大数据集可能抽样（360 可申请不抽样）、数据新鲜度存在延迟（具体小时数官方页面未给出）。[S51]
- Realtime：覆盖「当前至 30 分钟前」（360 最长 60 分钟），维度/指标为子集。[S52]

### 4.2 Admin API（配置与资源发现）

- 基址 `https://analyticsadmin.googleapis.com/v1beta`；覆盖 accounts、properties、dataStreams、customDimensions、customMetrics、keyEvents、measurementProtocolSecrets、firebaseLinks、googleAdsLinks 等；audiences 仅在 v1alpha。[S53]
- `accountSummaries.list` 返回调用者可访问的全部账号与 Property，是多客户发现的实用入口。[S55]
- **真实响应结构（按官方参考核对）**：顶层为 `accountSummaries[]`，每项含 `account`（如 `accounts/100`）、`displayName`、`propertySummaries[]`；每个 `propertySummaries` 项含 `property`（形如 `properties/123456789`）、`displayName`、`propertyType`、`parent`。**Property ID 必须从 `propertySummaries[].property` 中截取，不能假定顶层直接给出 Property 列表。** [S55]
- **分页**：请求参数 `pageSize`（上限 200）、`pageToken`；响应顶层返回 `nextPageToken`，未返回即表示结束。实现需循环取页，不能只读第一页。[S55]
- 读权限用 `analytics.readonly`；任何写操作需 `analytics.edit` 且账号角色允许。[S54][S56]
- `measurementProtocolSecrets.create` 可通过 API 为数据流创建 MP 的 `api_secret`，无需手工操作。[S53]

### 4.3 Measurement Protocol（只写事件）

- 端点：`POST https://www.google-analytics.com/mp/collect`；Web 流用 `measurement_id` + `api_secret`，事件体需 `client_id`（可附 `session_id`）；App 流用 `firebase_app_id` + `app_instance_id`。[S58][S59]
- 校验端点：`POST .../debug/mp/collect`，返回 `validationMessages`，**调试事件不会进入报表**。[S60]
- **只写不读**：没有任何读取报表的方法；服务端询盘事件必须用 MP 写入，再用 Data API 读回，两套 API、两套授权。[S57]
- 官方提示 MP 用于「补充自动采集」，其事件可能仅部分出现在报表中，不宜用 MP 回执做对账。[S57]

### 4.4 授权

| | OAuth 2.0 用户授权 | 服务账号 |
|---|---|---|
| 适用 | 客户自有 Property、按客户隔离授权 | 服务端批量拉取、自有或代运营的多个 Property |
| Token | 访问令牌约 1 小时 + refresh token | 服务账号令牌 5 分钟–12 小时；自签 JWT 最长 1 小时 |
| 授权方式 | 用户同意屏幕 | 把服务账号邮箱加入 GA4 账号/Property 的访问权限 |
| 撤销 | `POST https://oauth2.googleapis.com/revoke` | 删除/轮换密钥（服务账号密钥不支持该撤销端点） |

依据：[S61][S62][S63][S64]。

### 4.5 限制与 API 不可得项

| 限制 | 状态 |
|---|---|
| 数据阈值隐藏小样本行 | 已核验 [S51] |
| 高基数维度 `(other)` 聚合 | 已核验 [S51] |
| 大数据集抽样，360 可不抽样 | 已核验（定性）[S51] |
| 单请求 250,000 行上限 | 已核验 [S49] |
| 探索类报表（自由探索、路径、用户浏览）无 v1beta 方法 | 已核验（方法列表）；漏斗仅 `runFunnelReport`（v1alpha）[S65] |
| 归因模型对比 / 数据驱动归因报表 API | **UNVERIFIED** |
| `(not set)` 行的文档化处理 | **UNVERIFIED**（官方页面只明确 `(other)`） |

### 4.6 是否需要第三方聚合

不需要。官方 API 已覆盖多 Property 发现、报表、实时、元数据、配置与事件写入；聚合商无法解锁探索类 UI 能力（这些本身没有公开 API），只会增加成本与数据合规层。若未来需要事件级原始数据，官方出口是 BigQuery Export（本轮未核对）。[S46][S47][S53][S57]

### 4.7 多客户隔离

- **单服务账号 + 按 Property 授权**：运维最简单，`accountSummaries` 枚举；隔离是逻辑隔离，密钥泄露影响全部已授权 Property。
- **按客户 OAuth 或按客户服务账号**：隔离与撤销最清晰，但需要管理客户同意与 token 生命周期。

推荐报告服务只申请 `analytics.readonly`，按 Property 授予 Viewer；写配置的服务单独部署、单独授权 `analytics.edit`。

---

## 5. 能力边界总表

| 平台 | API 可实现 | 仅平台后台 | 需额外申请/审核 |
|---|---|---|---|
| Facebook | 发帖、视频、读取 Insights | 商务资质、账号所有权转移 | App Review + Business Verification |
| Instagram | 图片/视频/Reels/轮播发布、Insights | 专业账号开通、部分商务设置 | App Review + Business Verification |
| LinkedIn | 组织页发帖、视频、统计 | 组织页创建与管理员分配 | Community Management Standard tier |
| X | 发帖、读取（按套餐） | 无 | 无审核，但需付费额度；2026-03-31 起聚合方案需客户自备凭证 |
| TikTok | 发视频、查状态、管理 | 账号类型与地区资质 | Content Posting API 审核（未审核仅私密） |
| YouTube | 上传、更新、字幕、评论、定时 | 频道资质 | compliance audit 才能提配额 |
| GA4 | 报表、实时、配置、事件写入 | 探索类报表 | 无 |

---

## 6. 本轮未验证事项

1. YouTube OAuth 具体 flow 细节与 refresh token 有效期。
2. YouTube 未审核项目的上传可见性限制。
3. TikTok token 有效期与完整速率限制表。
4. X 媒体上传规格、分析接口清单、credits 单价。
5. Meta 评论读取所需权限与 Page Insights 字段清单。
6. Instagram Reels 的应用审核细节与排期能力。
7. Ayrshare / Zernio 的具体价格（页面客户端渲染）与 Webhook 重试语义。
8. api.video 上传/Webhook/状态查询细节（文档站不可读）。
9. Cloudinary credits 计费换算。
10. GA4 数据新鲜度具体小时数；`(not set)` 的官方处理规则。
11. BigQuery Export 能力与费用。

以上各项在没有官方页面直接依据前，不得写入客户承诺。

---

## 7. 来源清单

> 全部页面访问日期：2026-11-17。标注「二次复核」的条目为本轮另行直连核对；标注「V1.1 复核」的条目为按 Reviewer 意见再次核对字段名与响应结构。

| 编号 | 来源 |
|---|---|
| S1 | https://developers.facebook.com/docs/facebook-login/guides/access-tokens |
| S2 | https://developers.facebook.com/docs/pages-api/posts |
| S3 | https://developers.facebook.com/docs/instagram-platform/content-publishing |
| S4 | https://developers.facebook.com/docs/instagram-platform/insights |
| S5 | https://developers.facebook.com/docs/permissions/reference |
| S6 | https://developers.facebook.com/docs/app-review |
| S7 | https://developers.facebook.com/docs/graph-api/overview/rate-limiting |
| S8 | https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow |
| S9 | https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api |
| S10 | https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview |
| S11 | https://docs.x.com/resources/fundamentals/authentication/oauth-2-0/authorization-code |
| S12 | https://docs.x.com/x-api/posts/creation-of-a-post |
| S13 | https://docs.x.com/x-api/getting-started/about-x-api |
| S14 | https://docs.x.com/x-api/getting-started/pricing |
| S15 | https://docs.x.com/x-api/fundamentals/rate-limits |
| S16 | https://developers.tiktok.com/doc/content-posting-api-get-started |
| S17 | https://developers.tiktok.com/doc/content-posting-api-reference-direct-post |
| S18 | https://developers.tiktok.com/doc/tiktok-api-scopes |
| S19 | https://developers.tiktok.com/doc/login-kit-manage-user-access-tokens |
| S20 | https://developers.google.com/youtube/v3/determine_quota_cost（二次复核） |
| S21 | https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits |
| S22 | https://developers.google.com/youtube/v3/docs/commentThreads/insert |
| S23 | https://developers.google.com/youtube/v3/guides/uploading_a_video |
| S24 | https://developers.google.com/youtube/v3/docs/videos/insert |
| S25 | https://www.ayrshare.com/docs/apis/overview（二次复核） |
| S26 | https://www.ayrshare.com/docs/apis/post/post（V1.1 复核 `idempotencyKey`） |
| S27 | https://www.ayrshare.com/pricing |
| S28 | https://docs.zernio.com/quickstart（二次复核） |
| S29 | https://docs.zernio.com/api-reference |
| S30 | https://www.mux.com/docs/guides/video/upload-files-directly（V1.1 复核 `new_asset_settings.playback_policies`） |
| S31 | https://www.mux.com/docs/guides/video/stream-video-files |
| S32 | https://www.mux.com/pricing |
| S33 | https://www.mux.com/docs/guides/add-subtitles-to-your-videos |
| S34 | https://www.mux.com/docs/guides/get-images-from-a-video |
| S35 | https://cloudinary.com/documentation/upload_images |
| S36 | https://cloudinary.com/documentation/video_manipulation_and_delivery |
| S37 | https://cloudinary.com/documentation/adaptive_bitrate_streaming |
| S38 | https://cloudinary.com/documentation/cloudinary_video_player |
| S39 | https://api.video/pricing |
| S40 | https://api.video/features |
| S41 | https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide |
| S42 | https://developers.facebook.com/docs/video-api/guides/publishing |
| S43 | https://developers.facebook.com/docs/graph-api/video-uploads |
| S44 | https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media |
| S45 | https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/videos-api |
| S46 | https://developers.google.com/analytics/devguides/reporting/data/v1/rest |
| S47 | https://developers.google.com/analytics/devguides/reporting/data/v1/quotas（本轮二次直连失败，数字待复核） |
| S48 | https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema |
| S49 | https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport |
| S50 | https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/DateRange |
| S51 | https://developers.google.com/analytics/devguides/reporting/data/v1/reporting-data-expectations |
| S52 | https://developers.google.com/analytics/devguides/reporting/data/v1/realtime-basics |
| S53 | https://developers.google.com/analytics/devguides/config/admin/v1/rest |
| S54 | https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1beta/properties.dataStreams/list |
| S55 | https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1beta/accountSummaries/list（V1.1 复核 `propertySummaries[].property` 与 `nextPageToken`） |
| S56 | https://developers.google.com/analytics/devguides/config/admin/v1/quickstart |
| S57 | https://developers.google.com/analytics/devguides/collection/protocol/ga4 |
| S58 | https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events?client_type=gtag |
| S59 | https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference |
| S60 | https://developers.google.com/analytics/devguides/collection/protocol/ga4/validating-events |
| S61 | https://developers.google.com/identity/protocols/oauth2/scopes |
| S62 | https://developers.google.com/identity/protocols/oauth2/web-server |
| S63 | https://developers.google.com/identity/protocols/oauth2/service-account |
| S64 | https://docs.cloud.google.com/docs/authentication/token-types |
| S65 | https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1alpha/properties/runFunnelReport |
