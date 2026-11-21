# 证据索引

> 核对日期：2026-11-21。访问地域：本机网络（非平台后台登录态）。
> 类型：`OFFICIAL_DOC` 官方帮助/政策；`VENDOR_DOC` 厂商文档；`SOURCE_CODE` 源码；`REPO_DOC` 本仓库权威文档；`SEARCH` 公开检索；`BLOCKED` 不可访问。
> 结论状态沿用：`CONFIRMED` / `RECOMMENDED` / `PROPOSED` / `USER_ACTION_REQUIRED` / `UNKNOWN` / `BLOCKED`。

## 1. 证据总表

| ID | 主张 | 来源 | 类型 | 访问结果 | 适用范围 | 限制 | 结论状态 |
|---|---|---|---|---|---|---|---|
| E-01 | YouTube 建频道免费；可用 Brand Account 让多人管理 | https://support.google.com/youtube/answer/1646861 | `OFFICIAL_DOC` | 直接访问 | 全球（界面因地区略异） | 未验证具体地区限制 | `CONFIRMED` |
| E-02 | 频道横幅最小 2560×1440；安全区 1546×423；≤6MB | https://support.google.com/youtube/answer/12950272 | `OFFICIAL_DOC` | 直接访问 | 全球 | 移动端裁切以预览为准 | `CONFIRMED` |
| E-03 | 手机验证解锁自定义缩略图、直播、>15 分钟视频、版权申诉；同一手机号每年最多验证 2 个频道 | https://support.google.com/youtube/answer/9722880 ; https://support.google.com/youtube/answer/171664 | `OFFICIAL_DOC` | 直接访问 | 全球 | 验证资格与次数可能调整 | `CONFIRMED` |
| E-04 | Handle 3–30 字符、每频道唯一、不可转让 | https://support.google.com/youtube/answer/11585688 | `OFFICIAL_DOC` | 直接访问 | 全球 | — | `CONFIRMED` |
| E-05 | YPP 门槛：1,000 订阅 + 4,000 小时/12 月或 1,000 万 Shorts 观看/90 天 | https://support.google.com/youtube/answer/72851 | `OFFICIAL_DOC` | 直接访问 | 全球 | 政策可能更新；非本阶段目标 | `CONFIRMED` |
| E-06 | 自定义缩略图推荐 3840×2160；16:9；最小宽度 640；Shorts 竖版 2160×3840 | https://support.google.com/youtube/answer/72431 | `OFFICIAL_DOC` | 直接访问（折叠项展开后读取） | 全球 | 文件大小/格式以 Studio 上传提示为准；本轮以 ≤2MB 作为操作值 | `CONFIRMED` |
| E-07 | 频道主页可设频道预告片、精选视频与分区（播放列表等） | https://support.google.com/youtube/answer/3219384 | `OFFICIAL_DOC` | 直接访问 | 全球 | 具体可用分区类型随账号/地区略异 | `CONFIRMED` |
| E-08 | 频道可设置名称、Handle、简介、链接、联系方式、头像 | https://support.google.com/youtube/answer/2657964 | `OFFICIAL_DOC` | 直接访问 | 全球 | 头像尺寸以帮助页为准（建议 800×800） | `CONFIRMED` |
| E-09 | YouTube Data API v3 精确配额数值 | https://developers.google.com/youtube/v3/ | `BLOCKED` | `ERR_CONNECTION_CLOSED` | — | 未取得官方配额页；不得估算 | `UNKNOWN` |
| E-10 | Postiz YouTube：resumable upload、恰好 1 个 mp4、标题 1–100、描述 ≤5,000、标签 ≤500、可见性 public/private/unlisted、儿童内容必选 | `libraries/nestjs-libraries/src/integrations/social/youtube.provider.ts`；`.../dtos/posts/providers-settings/youtube.settings.dto.ts`（commit `6be4874`） | `SOURCE_CODE` | 本地只读检索 | 该 commit | 代码会随版本变化；不构成平台官方文档 | `CONFIRMED` |
| E-11 | Postiz 上传缩略图依赖 `thumbnails.set`；频道未手机验证时报错并要求去 Studio 手动设置 | 同上 `youtube.provider.ts` | `SOURCE_CODE` | 本地只读检索 | 该 commit | 错误文案可能随版本变化 | `CONFIRMED` |
| E-12 | LinkedIn Page 免费；创建需个人账号；桌面端或 iOS；创建者为 super admin | https://www.linkedin.com/help/linkedin/answer/a543852 | `OFFICIAL_DOC` | 直接访问（英文） | 全球（功能因地区略异） | 未验证所有地区 | `CONFIRMED` |
| E-13 | LinkedIn Logo 400×400（最小 268）；Cover 1512×256；≤3MB PNG/JPEG；链接图 1200×627 | https://www.linkedin.com/help/linkedin/answer/a563309 | `OFFICIAL_DOC` | 直接访问 | 全球 | 动态 Cover 仅 Premium Company Page | `CONFIRMED` |
| E-14 | LinkedIn Page 认证需 Premium Company Page 或付费 Jobs/Ads；免费试用不符合；最长 10 天；考量资料准确、管理员活跃、已认领、政策合规 | https://www.linkedin.com/help/linkedin/answer/a6275638 | `OFFICIAL_DOC` | 直接访问（英文，展开折叠项） | 全球 | 具体资格与时长由平台判定 | `CONFIRMED` |
| E-15 | LinkedIn Premium Company Page 公开价格 | https://business.linkedin.com/hire/company-career-pages/lcp-upgrade（官方营销页） | `OFFICIAL_DOC` | 直接访问但无价目；原销售页 404 后改用此页 | 全球 | 仅引导销售联系；不得估算 | `UNKNOWN` |
| E-16 | 个人 Profile 验证与 Page 验证是不同流程 | https://www.linkedin.com/help/linkedin/answer/a1359065 | `OFFICIAL_DOC` | 直接访问 | 全球 | — | `CONFIRMED` |
| E-17 | Postiz LinkedIn Page：含组织管理/发布/读取 scope；author 为 `urn:li:organization:*`；发布到 `/rest/posts`；分析来自组织统计端点；最多 1 个视频、轮播 ≥2 图 | `linkedin.page.provider.ts`（commit `6be4874`） | `SOURCE_CODE` | 本地只读检索 | 该 commit | 权限与端点受 LinkedIn 版本影响 | `CONFIRMED` |
| E-18 | Postiz 平台规则：LinkedIn 3,000；YouTube 5,000；Facebook 63,206；Instagram 2,200；TikTok 2,000；Threads 500；Reddit 10,000；Pinterest 500；Medium 100,000 | Postiz 官方文档（Platform rules） | `VENDOR_DOC` | 直接访问 | Postiz 当前文档 | 平台自身限制可能变化 | `CONFIRMED` |
| E-19 | Instagram 专业账号切换免费；一个个人账号最多管理 10 个专业账号；绑定 FB Page 可选 | https://help.instagram.com/502981923235522 | `OFFICIAL_DOC` | 直接访问 | 全球 | 功能因地区/账号类型略异 | `CONFIRMED` |
| E-20 | Postiz Instagram 支持 REELS、STORIES、VIDEO、CAROUSEL 与试播 Reels | `instagram.provider.ts`（commit `6be4874`） | `SOURCE_CODE` | 本地只读检索 | 该 commit | 平台审核/权限可能限制 | `CONFIRMED` |
| E-21 | Postiz Facebook 支持文本/图片/视频、post/story；无 Reels 专用路径 | `facebook.provider.ts`（commit `6be4874`） | `SOURCE_CODE` | 本地只读检索 | 该 commit | 平台能力可能扩展 | `CONFIRMED` |
| E-22 | Facebook Business 官方页（建 Page/认证说明） | https://www.facebook.com/business/ | `BLOCKED` | 重定向到登录墙 | — | 无法引用官方页面原文 | `BLOCKED` |
| E-23 | Meta 开发者文档（应用/权限/企业认证） | https://developers.facebook.com/ | `BLOCKED` | 访问失败 | — | 仅能引用 Postiz 文档转述 | `BLOCKED` |
| E-24 | 使用公开 Meta 应用且 Live 模式发布时需业务验证；Meta/YouTube/TikTok 审核可能数周 | Postiz 官方文档（Self-host / provider setup） | `VENDOR_DOC` | 直接访问 | Postiz 当前文档 | 官方 Meta 页被登录墙拦截；费用 `UNKNOWN` | `CONFIRMED`（要求存在）/ `UNKNOWN`（费用） |
| E-25 | TikTok 未审核客户端只能发布到私密账号 | `tiktok.provider.ts` 错误串 `unaudited_client_can_only_post_to_private_accounts` | `SOURCE_CODE` | 本地只读检索 | 该 commit | 审核政策可能调整 | `CONFIRMED` |
| E-26 | TikTok Business：`DIRECT_POST` 直接发布；`UPLOAD` 仅存收件箱并丢弃设置；媒体域名需在应用内验证；视频正文 2,200 | `tiktok.business.provider.ts` | `SOURCE_CODE` | 本地只读检索 | 该 commit | 以 TikTok 官方为准 | `CONFIRMED` |
| E-27 | 自建 Postiz 的 TikTok 应用需公网 HTTPS 站点与域名验证 | Postiz 官方文档 | `VENDOR_DOC` | 直接访问 | Postiz 当前文档 | 官方 TikTok 开发者文档不可达（E-28） | `CONFIRMED` |
| E-28 | TikTok 官方开发者文档 | https://developers.tiktok.com/ | `BLOCKED` | 超时/跳转 | — | 未取得原文 | `BLOCKED` |
| E-29 | Postiz X：支持 post/article；文章 100,000 字符、仅图片；发布文章需 X Premium，源码含明确报错 | `x.provider.ts`（commit `6be4874`） | `SOURCE_CODE` | 本地只读检索 | 该 commit | 普通帖上限以 X 平台为准（280） | `CONFIRMED` |
| E-30 | X 官方帮助中心 | https://help.x.com/ | `BLOCKED` | Cloudflare 拦截 | — | 无法引用官方原文 | `BLOCKED` |
| E-31 | X API/ Premium 价格 | X 官方页面 | `BLOCKED` | 未取得 | — | 不得估算 | `UNKNOWN` |
| E-32 | Pinterest Business 账号免费注册 | https://business.pinterest.com/ | `OFFICIAL_DOC` | 直接访问 | 全球（地区略异） | 网站认领流程未逐项核验 | `CONFIRMED` |
| E-33 | Postiz Pinterest：v5 API；媒体/Board/Pin；Pin 必须选 Board；正文 500；视频 Pin 需封面 | `pinterest.provider.ts` + Postiz 文档 | `SOURCE_CODE`/`VENDOR_DOC` | 本地检索 + 直接访问 | 该 commit/当前文档 | — | `CONFIRMED` |
| E-34 | Reddit Rule 2：真实参与，禁止 spam 与内容操纵 | https://www.redditinc.com/policies/reddit-rules | `OFFICIAL_DOC` | 直接访问 | 全球 | 各 subreddit 另有规则 | `CONFIRMED` |
| E-35 | Postiz Reddit：`maxConcurrentJob=1`（1 req/s）；按 subreddit 配置 | `reddit.provider.ts`（commit `6be4874`） | `SOURCE_CODE` | 本地只读检索 | 该 commit | 速率限制以 Reddit 为准 | `CONFIRMED` |
| E-36 | Medium 发布免费；Member $5/月、Friend $15/月为阅读会员 | https://medium.com/membership | `OFFICIAL_DOC` | 直接访问 | 全球（价格可能因地区/税变化） | 不是发布费 | `CONFIRMED` |
| E-37 | Postiz Medium：Integration Token；Markdown；标题必填；正文 100,000 | `medium.provider.ts` + Postiz 文档 | `SOURCE_CODE`/`VENDOR_DOC` | 本地检索 + 直接访问 | 该 commit/当前文档 | Medium API 可能调整 | `CONFIRMED` |
| E-38 | Vimeo 定价：Free；Creator $9/月（年付）或 $16/月；Core $24.50/$40；Professional $71/$120 | https://vimeo.com/upgrade | `OFFICIAL_DOC` | 直接访问 | 美国站/美元 | 税费另计；免费档限额未逐项核验 | `CONFIRMED` |
| E-39 | Postiz provider 注册列表无 Vimeo | `integration.manager.ts` `socialIntegrationList`（commit `6be4874`） | `SOURCE_CODE` | 本地只读检索 | 该 commit | 未来可能新增 | `CONFIRMED` |
| E-40 | Postiz Cloud：$29/月（5 渠道）、$39（10）、$49（30）、$99（100）；年付 $278/$374/$470/$950；7 天试用 | Postiz 官方定价页 | `VENDOR_DOC` | 直接访问 | 美元/美国站 | 渠道计费口径以购买页为准；税费另计 | `CONFIRMED` |
| E-41 | Postiz 账号分析仅覆盖 10 类平台：FB Page、Instagram（两种）、LinkedIn Page、TikTok（两种）、YouTube、GMB、Pinterest、Threads、X；范围 7/30/90 天 | Postiz 官方文档（Analytics） | `VENDOR_DOC` | 直接访问 | Postiz 当前文档 | Reddit/Medium/Bluesky 无账号分析 | `CONFIRMED` |
| E-42 | 自建需自行申请平台开发者应用；Meta/YouTube/TikTok 可能数周；10 个 provider 无需开发者应用（Bluesky、Lemmy、Nostr、Medium、Dev.to、Hashnode、WordPress、Listmonk、Moltbook、Skool） | Postiz 官方文档（Self-host） | `VENDOR_DOC` | 直接访问 | Postiz 当前文档 | 具体审核以平台为准 | `CONFIRMED` |
| E-43 | Postiz AGPL-3.0；建议 `ADOPT_WITH_ADAPTER`（有条件）；闭源修改/白标需商业授权 | `28_postiz_agpl_compliance_audit/README.md`、`CLOSED_SOURCE_BOUNDARY.md` | `REPO_DOC` | 本地只读 | 本仓库 28_ | 不构成法律意见 | `CONFIRMED` |
| E-44 | “Morrishk 多语种电子元器件独立站” | `10_project_baseline/MORRISHK_P0_01_EVIDENCE_SUPPLEMENT.md` 第 996 行附近 | `REPO_DOC` | 本地检索 | 本仓库 | 仅此粒度；不含品牌口号/联系方式 | `CONFIRMED` |
| E-45 | 未在权威文档中找到品牌 Slogan、法定名称、公开邮箱/电话；公开检索未发现可确认的 Morrishk 官方主页 | 17_/09_/01_ 检索；WebSearch（2026-11-21） | `REPO_DOC`/`SEARCH` | 已完成 | 本仓库/公开索引 | 检索不到不能证明不存在 | `UNKNOWN` |
| E-46 | 增长规划已定渠道分工、发布节奏与 UTM 原则：LinkedIn/Reddit/X+Facebook/YouTube；站外链接统一 UTM 落产品详情或询盘，不落首页；LinkedIn 2–3 条/周、Reddit 1–2 条/周（技术答疑） | `01_business_plan/morrishk_growth_plan_v1.1.md` §5.1–§5.4 | `REPO_DOC` | 本地只读 | 本仓库 | 规划不是实施授权 | `CONFIRMED` |
| E-47 | 现状：社媒“无系统运营”、视频“无”；现有系统盘点未发现社媒发布系统 | `01_business_plan/morrishk_growth_plan_v1.1.md` §2.6；`09_current_state_inventory/*` | `REPO_DOC` | 本地只读 | 本仓库 | 不代表账号绝对不存在 | `CONFIRMED`（现状判断） |
| E-48 | 视频方向：首批 30–50 个核心热销型号，1–3 分钟，实拍/封装对比/选型避坑；标题“型号+关键参数+应用场景” | `01_business_plan/morrishk_growth_plan_v1.1.md` §5.3 | `REPO_DOC` | 本地只读 | 本仓库 | 型号清单需用户提供 | `CONFIRMED` |

## 2. 不可用来源清单

| 来源 | 尝试 | 失败方式 | 影响 | 处理 |
|---|---|---|---|---|
| YouTube Data API 官方文档 | `developers.google.com/youtube/v3` | `ERR_CONNECTION_CLOSED` | 配额数值 `UNKNOWN` | 不估算；执行时控制台实测 |
| X 帮助中心 | `help.x.com` | Cloudflare 拦截 | X 官方规则/价格 `UNKNOWN` | 只引用源码与平台通用规则 |
| Facebook Business | `facebook.com/business` | 登录墙 | 建 Page/认证官方原文不可得 | 引用 Postiz 文档并标注 |
| Meta 开发者文档 | `developers.facebook.com` | 访问失败 | 权限/认证细节不可得 | 同上 |
| TikTok 开发者文档 | `developers.tiktok.com` | 超时/跳转 | 官方 API 细节不可得 | 引用源码与 Postiz 文档 |
| LinkedIn Premium Company Page 价格 | 官方营销页/销售页 | 无公开价目 | 价格 `UNKNOWN` | 不估算，需询价 |

## 3. 代码证据复算

```bash
# Postiz 只读副本
cd E:/workspace/.scratch/postiz-audit
git rev-parse HEAD
# 期望：6be4874631fea453f99115a78fd543c71820ab45

# 关键 provider
ls libraries/nestjs-libraries/src/integrations/social/ | grep -E "youtube|linkedin|facebook|instagram|tiktok|x\.|reddit|pinterest|medium"
```

本轮只读检索，未修改、未构建、未运行 Postiz。

## 4. 证据分级说明

| 级别 | 本包含义 | 示例 |
|---|---|---|
| A | 官方帮助/政策页直接可读 | YouTube 横幅规格、LinkedIn Page 认证条件 |
| B | 厂商文档直接可读 | Postiz 平台规则、Cloud 价格、分析范围 |
| C | 源码可复核 | Postiz provider 限制、错误串、并发数 |
| D | 本仓库权威文档 | 增长规划、现状盘点、28_ 审计 |
| E | 公开检索/间接推断 | 未发现官方主页；不能证明不存在 |
| F | 不可访问 | X/Facebook/TikTok/Google API 文档 |

**结论使用规则**：A/B/C/D 可作为 `CONFIRMED` 依据；E 只能支撑 `UNKNOWN`/`RECOMMENDED`；F 必须写 `BLOCKED` 或 `UNKNOWN`。

## 5. 未覆盖事项

- 未核验各平台在 Morrishk 目标市场的具体可用性/语言支持差异。
- 未核验 Vimeo 免费档的容量与带宽上限。
- 未核验 LinkedIn Page 认证在具体国家/地区的资格差异。
- 未核验 Meta 企业认证的实际材料清单与费用。
- 未核验 X API 各档位价格与限额。
- 未核验 YouTube API 配额具体数值。
- 未核验各平台 2026 年最新 UI 是否与帮助页一致。
- 未登录任何后台，因此没有任何账号级证据。