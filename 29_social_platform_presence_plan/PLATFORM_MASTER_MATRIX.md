# 平台总矩阵

> 结论状态：`CONFIRMED` / `RECOMMENDED` / `PROPOSED` / `USER_ACTION_REQUIRED` / `UNKNOWN` / `BLOCKED`
> 证据编号见 `EVIDENCE_INDEX.md`。价格均为美元，未含税；无法确认的价格不估算。

## 1. 决策矩阵（建不建、先建谁）

| 平台 / 产品 | 类型 | 第二个月优先级 | Postiz 支持 | Postiz 分析 | 主要价值 | 结论状态 |
|---|---|---|---|---|---|---|
| LinkedIn Company Page | B2B 社媒主页 | **P0 · 第 1** | 是（LinkedIn Page provider） | 是 | 采购/工程/供应链人群最集中；组织主页可被搜索索引；发布与员工转发形成品牌搜索 | `RECOMMENDED` |
| YouTube Brand Channel | 视频平台 | **P0 · 第 2** | 是 | 是 | 长尾搜索与产品演示资产；视频可嵌入站点与邮件；SEO 生命周期最长 | `RECOMMENDED` |
| Facebook Page | 社媒主页 | **P0 · 第 3** | 是 | 是 | Meta 生态锚点；Instagram 专业账号可绑定；再营销受众基础 | `RECOMMENDED` |
| Instagram 专业账号（Business） | 社媒主页 | **P0 · 第 4** | 是（Instagram / Standalone） | 是 | 产品视觉、Reels、Stories；与 FB Page 联动；年轻采购与分销商触达 | `RECOMMENDED` |
| X | 社媒主页 | **P0 · 第 5** | 是 | 是 | 行业新闻/展会/实时互动；品牌词搜索占位；文章能力需 Premium，第二个月不用 | `RECOMMENDED` |
| Pinterest Business | 视觉发现 | P1 · 条件性 | 是 | 是 | 产品图/应用场景可长期被站外搜索发现，外链回站；B2B 直接转化弱 | `PROPOSED` |
| TikTok | 视频平台 | P1 · 手动试点 | 是（含 Business） | 是 | 短格式触达与新市场认知；未审核应用只能发私密账号，API 直发受限 | `PROPOSED` |
| Medium | 内容发布 | P1 · 条件性 | 是 | 否 | 长文/seo 外链与行业观点；与站点博客重复时价值下降 | `PROPOSED` |
| Reddit | 社区 | P1 · 人工技术答疑（非自动发帖） | 是（不用于自动发帖） | 否 | 工程师信任与长尾自然流量；自我推广风险高，只做有数据出处的答疑 | `PROPOSED` |
| Vimeo | 视频平台 | P2 · 暂缓 | **否** | 不适用 | 无广告播放器、可嵌入官网/提案；免费档足够试用，付费能力非第二个月必需 | `PROPOSED` |
| Threads | 社媒主页 | P2 · 观察 | 是 | 是 | 与 Instagram 同源，低边际成本；B2B 采购决策影响有限 | `PROPOSED` |
| Bluesky | 社媒主页 | P2 · 观察 | 是（无需开发者应用） | 否 | 早期技术社区曝光；受众规模与采购相关性 `UNKNOWN` | `PROPOSED` |

### 1.1 排名依据（不是拍脑袋）

1. **人群匹配**：电子元器件/供应链的采购与工程决策者集中在 LinkedIn；YouTube 承接“型号 + 应用 + 怎么买”的长尾搜索；Facebook/Instagram 用于品牌可信度与视觉资产；X 用于行业存在感。
2. **可运营性**：前 5 个平台全部被 Postiz 覆盖，可统一排程；Vimeo 不在 Postiz 内，第二个月引入会增加手工成本。
3. **搜索价值**：YouTube 视频标题/描述可被 Google 索引；LinkedIn 组织主页与帖子可被搜索引擎收录；社交主页本身可作为品牌词结果占位。
4. **合规与政策风险**：Reddit 反自我推广规则严格；TikTok 未审核 API 只能发私密账号；LinkedIn 认证是付费路径。这些都会影响“先建谁”。
5. **内容产能**：第二个月按“1 条视频 + 每周 2 条图文”设计，避免为 8 个平台分别生产内容。

### 1.2 明确不进入前 5 的理由

| 平台 | 不进入前 5 的理由 | 何时重新评估 |
|---|---|---|
| Pinterest | B2B 元器件采购决策链长，视觉平台直接转化弱；需要持续做产品图/信息图 | 站点产品图资产充足、且需要站外图片搜索流量时 |
| TikTok | 内容生产成本高；未审核应用无法公开发布；B2B 受众匹配度 `UNKNOWN` | 有短视频产能、且完成应用审核/公开发布能力后 |
| Reddit | 社区规则禁止自我推广式内容；品牌账号容易被视为 spam | 有人工社区运营时，以技术答疑方式参与；不进入前 5 主页 |
| Medium | 与站点博客内容重复， canonical/外链策略需先定 | 站点博客产能不足、需要借 Medium 域权重时 |
| Vimeo | 不在 Postiz 覆盖内；免费档已可满足嵌入需求；付费能力非必需 | 官网需要无广告、可定制播放器或客户提案隐私托管时 |

## 2. 费用与门槛矩阵

| 平台 | 建号/主页费用 | 企业认证/审核 | 关键付费能力 | 需要个人管理员 | 预算影响 | 结论状态 |
|---|---|---|---|---|---|---|
| LinkedIn Page | 免费 | 主页认证：需 Premium Company Page 或付费 Jobs/Ads；免费试用不符合条件；审核最长 10 天（E-14） | 认证徽章、部分主页能力 | 是（个人 Profile 为 super admin，E-12） | 认证价格 `UNKNOWN`；第二个月不买 | `CONFIRMED`（免费建页/认证付费） |
| YouTube | 免费 | 无需营业执照；手机验证解锁自定义缩略图/直播/长视频（E-03） | 无必须付费项；广告另计 | 是（Google 账号；建议 Brand Account） | $0；API 配额 `UNKNOWN` | `CONFIRMED` |
| Facebook Page | 免费（官方计费页本轮被登录墙拦截，未发现收费项） | 公开应用 + Live 模式需 Meta 企业认证（E-24，Postiz 文档） | 广告、再营销（本轮排除） | 是（个人 Profile 建 Page） | $0；认证费用 `UNKNOWN` | `UNKNOWN`（计费页）/ `CONFIRMED`（认证要求存在） |
| Instagram 专业账号 | 免费 | 公开 Meta 应用需企业认证；账号本身免费（E-19/E-24） | 广告（本轮排除） | 是（个人账号转专业账号） | $0 | `CONFIRMED` |
| X | 免费（官方计费页本轮被 Cloudflare 拦截，未发现建号收费项） | 无企业认证；开发者应用/API 有独立门槛（E-29） | X Premium 解锁文章；API 访问付费档（价格 `UNKNOWN`） | 是 | 第二个月 $0（不发文章） | `UNKNOWN`（计费页）/ `CONFIRMED`（文章需 Premium） |
| Pinterest Business | 免费（E-32） | 应用审核（自建 Postiz 时，E-42） | 广告（本轮排除） | 是 | $0 | `CONFIRMED` |
| TikTok | 免费（官方计费页本轮不可达，未发现建号收费项） | 开发者应用需公网 HTTPS 站点与域名验证；未审核应用仅可发私密账号（E-25/E-27） | 广告（本轮排除） | 是 | $0（手动发布） | `UNKNOWN`（计费页）/ `CONFIRMED`（限制存在） |
| Medium | 发布免费 | 无企业认证 | Member $5/月、Friend $15/月为阅读会员，不是发布费（E-36） | 是 | $0 | `CONFIRMED` |
| Vimeo | 有免费档 | 无企业认证 | Creator $9/月（年付）或 $16/月；Core $24.50/$40；Professional $71/$120（E-38） | 是 | 第二个月 $0（暂缓） | `CONFIRMED` |
| Reddit | 免费（官方计费页未取得，未发现建号收费项） | 无企业认证；遵守社区规则（E-34） | 无主页付费项 | 是 | $0 | `UNKNOWN`（计费页）/ `CONFIRMED`（规则） |

## 3. “社媒主页”与“视频能力”的口径

- **视频平台**：YouTube、TikTok、Vimeo——以视频为主要内容形态、有独立频道/主页体系。
- **社媒平台内视频**：LinkedIn 原生视频、Instagram Reels、Facebook 视频/Stories、X 视频。它们是发布格式，不单独计入“视频平台”，但内容计划会复用同一批素材。
- 因此“5 个社媒主页”和“3 个视频平台”存在 YouTube 重叠：YouTube 同时是第 2 优先社媒主页与第 1 优先视频平台。

## 4. 账号所有权模型（跨平台统一）

| 层 | 建议 | 理由 | 状态 |
|---|---|---|---|
| 登录身份 | 品牌专用邮箱 + 密码库 + 2FA | 不依赖个人邮箱；离职可交接 | `RECOMMENDED` |
| Google/YouTube | 使用 Brand Account，至少 2 名所有者 | 多人管理不必共享个人 Google 密码（E-01） | `RECOMMENDED` |
| Meta | 使用 Business Portfolio 管理 FB Page 与 IG | 管理员用个人身份加入，资产归企业组合 | `RECOMMENDED` |
| LinkedIn | 企业主页 + 至少 2 名 super admin | 避免个人账号停用导致主页失管 | `RECOMMENDED` |
| 其他平台 | 品牌邮箱注册，2 名管理员，开启 2FA | 统一治理 | `RECOMMENDED` |
| 凭证 | 只由用户持有；Agent 不接收密码/Token | 任务书硬性边界 | `CONFIRMED` |

## 5. 与既有决策的关系

- 本矩阵不改变 `28_postiz_agpl_compliance_audit` 的 `ADOPT_WITH_ADAPTER` 结论；若采用 Postiz，继续遵守“原版独立部署 + 独立 Adapter + 官方 API + 零源码修改”的边界。
- 本矩阵不改变任何 Contract Freeze 决策；平台优先级是 `RECOMMENDED`，不是已批准实施。
- 站点侧 `Organization.sameAs`、社交分享图、UTM 落地页属于后续实施项，本包只提建议，不改代码。