# SEO 第二个月 · 全球社媒与视频平台主页建设规划及决策固化

| 项 | 内容 |
|---|---|
| 任务 | Session B：全球社媒与视频平台主页建设规划（SEO 第二个月） |
| 分支 | `docs/sessionb-social-platform-presence-plan` |
| 基线 parent | `e84004d3e418579266d611f45193292c2d7018f6`（含 28_ Postiz AGPL 审计，本轮未改动） |
| 规划日期 | 2026-11-21 |
| 性质 | **规划 / 建议 / 待决策**。不构成账号注册、付费购买、OAuth 创建、内容发布或实施批准 |
| 本轮状态 | 只新增 `29_social_platform_presence_plan/`；未登录任何平台后台，未注册账号，未连接 Token |

## 0. 一页结论（10 个问题的直接回答）

| # | 问题 | 直接回答 | 结论状态 |
|---|---|---|---|
| 1 | 最值得优先建设的 5 个社媒主页 | ① LinkedIn Company Page ② YouTube Brand Channel ③ Facebook Page ④ Instagram 专业账号（Business）⑤ X | `RECOMMENDED` |
| 2 | 最值得优先建设的 3 个视频平台 | ① YouTube（唯一 P0）② Vimeo（条件性，官网嵌入/品牌片）③ TikTok（条件性，手动试点）。第二个月只建 YouTube；另两个是候选，不是承诺 | `RECOMMENDED` |
| 3 | 哪些平台完全免费 | 建号/主页本身均无平台订阅费。**有官方页直接确认**：LinkedIn Page、YouTube、Instagram 专业账号、Pinterest Business、Medium 发布、Vimeo 免费档；**Facebook / X / TikTok / Reddit** 官方计费页本轮不可达，未发现建号收费项，按免费规划、执行时复核。免费不等于关键能力免费 | `CONFIRMED`（有官方页者）/ `UNKNOWN`（四项计费页）/ `RECOMMENDED`（是否值得建） |
| 4 | 哪些平台关键能力需要付费 | LinkedIn 主页认证：存在非付费资格路径（主页活跃、互动、商业关系），Premium Company Page 或付费 Jobs/Ads 可满足资格但不是唯一路径，最终由平台裁量，价格 `UNKNOWN`；X 文章需 X Premium（价格 `UNKNOWN`）；Vimeo 高级播放器/隐私/品牌化需付费档（Creator $9/月起，年付）；Postiz Cloud 为付费替代自建；广告全部另计且本轮排除 | `CONFIRMED`（付费边界）/ `UNKNOWN`（具体价格） |
| 5 | 哪些需要个人管理员账号 | 平台账号模型不同，不能一概而论：**A. 个人 Profile 管理企业主页**——LinkedIn Page（个人 Profile 创建并任 super admin，E-12）、Instagram 专业账号（个人账号转换，E-19）、Facebook Page（通常由个人 Profile 创建，官方建页页不可达，机制 `UNKNOWN`，E-22）；**B. 直接注册独立品牌账号**——X、TikTok、Reddit、Medium（通用账号体系，无独立企业主页；注册身份与多管理员机制官方依据未取得，`UNKNOWN`）、Pinterest Business（商业邮箱直接注册，无需个人账号，E-49）；**C. 平台内品牌资产/共享管理**——YouTube Brand Account（多人管理，E-01）、Facebook Business Portfolio 与 Medium Publication（官方原文不可达，`UNKNOWN`） | `CONFIRMED`（有官方依据项）/ `UNKNOWN`（其余） |
| 6 | 哪些需要企业认证/执照 | LinkedIn 主页认证：需企业真实信息，但资格可来自主页活跃/互动/商业关系，付费产品只是满足条件的一种方式，最终由平台裁量；Meta 需区分 App Review 与 Business Verification（见下条）；TikTok 开发者应用需公网 HTTPS 站点与域名归属验证；Pinterest 需应用审核。YouTube/X/Reddit/Medium/Vimeo 未见营业执照要求（未逐项核验），但分别有手机验证、Premium、社区规则、付费档等门槛 | `CONFIRMED`（门槛存在）/ `UNKNOWN`（Meta 认证是否收费、未核验项） |
| 6b | Meta 的 App Review、Business Verification 与 Postiz 部署是什么关系 | 三件事相互独立：**App Review** 仅在应用被 app roles 以外的人使用时才需要，仅内部角色使用可不做；**Business Verification** 在申请高级权限或访问其他企业数据时才需要，并非所有公开应用都必须完成；**Postiz 自建部署**要求 Morrishk 自己创建 Meta 应用并承担上述审核，用 Postiz Cloud 则由 Postiz 承担 | `CONFIRMED`（E-23/E-50/E-51） |
| 7 | 哪些可通过 Postiz 统一管理 | 本计划范围内：YouTube、LinkedIn Page、Facebook、Instagram、TikTok（含 Business）、X、Pinterest、Reddit、Medium、Threads。**Vimeo 不在 Postiz provider 列表**。分析数据仅 10 类平台回传，Reddit/Medium 无账号级分析 | `CONFIRMED` |
| 8 | YouTube 主页分区怎么设计 | 横幅（≥2560×1440）＋频道预告片（新访客）＋精选视频（回访者）＋4–6 个播放列表分区：Start Here / Product Categories / How to Order & Quality / Technical FAQ / Latest Uploads；空分区不上线 | `RECOMMENDED` |
| 9 | 第二个月优先做什么 | W1 账号治理与品牌资产；W2 建号并补全 5 个核心主页；W3 首批内容 + Postiz 连接；W4 基线测量与复盘。先做 P0（治理/建号/补全/验证），付费认证、Vimeo 与 TikTok 后置 | `RECOMMENDED` |
| 10 | 最小预算与标准预算 | **最小：平台订阅 $0/年**（自建 Postiz + 全部免费档 + 不买认证，不含托管/人力）。**第二个月实际标准（Vimeo 暂缓）：Postiz Cloud 月付 $29（Standard·5 渠道）或 $39（Team·10 渠道）；年付总额按约 20% 折扣推算约 $278 / $374（官方页面只展示年付折算月价约 $23/$31，实际以结账页为准）**。Standard 不含团队成员，Team 不限成员；平台主页管理员与 Postiz 工作台用户是两回事，2 名主页管理员不强制购买 Team。若日后启用 Vimeo Creator 再 +$108/年（合计约 $386/$482）。不含 LinkedIn 认证报价、X Premium、广告与内容制作 | `RECOMMENDED`（档位）/ `CONFIRMED`（月价，E-40）/ `PROPOSED`（年付总额推算） |

## 1. 目的

为 Morrishk 在 SEO 第二个月建立“可被搜索引擎与采购方同时发现”的品牌主页矩阵，回答四个问题：

1. **建哪些**：平台优先级与取舍理由；
2. **怎么建**：账号类型、管理员模型、认证与付费边界；
3. **怎么运营**：内容支柱、发布节奏、YouTube 主页结构；
4. **花多少钱**：最小预算与标准预算，哪些必须等报价，哪些本轮明确不买。

所有平台事实均给出证据编号（见 `EVIDENCE_INDEX.md`），并区分：

- 官方文档可直接访问并确认；
- 官方文档不可访问、仅能由 Postiz 文档或 provider 源码确认；
- 完全无法确认，标记 `UNKNOWN` 或 `BLOCKED`。

## 2. 本轮明确不做（边界）

- 不注册任何新账号，不创建真实 OAuth App，不连接真实社媒账号，不配置 Token。
- 不购买任何套餐、认证或广告；不发布任何真实内容。
- 不修改 Postiz 生产配置，不部署 Postiz，不修改 Morrishk / Ds Bit 业务代码。
- 不修改 `12_`、`13_`、`14_`、`25_`、`26_`、`27_`、`28_` 等既有权威资料；不修改 Session A 文件。
- 不改变 Contract Freeze 的任何决策状态；本文件不构成对任何冻结项的批准或解除。
- 不要求且不接受用户提供密码、Token、Secret；报告中不出现任何凭证。
- 不把“计划建立”写成“已建立”；所有账号状态一律为 `UNKNOWN` 或 `NOT_STARTED`，需用户确认。

## 3. 交付文件

| 文件 | 作用 |
|---|---|
| `README.md` | 总览、10 问结论、边界、自检 |
| `PLATFORM_MASTER_MATRIX.md` | 平台总矩阵：优先级、费用、认证、Postiz、分析、价值 |
| `ACCOUNT_REQUIREMENTS.md` | 逐平台账号要求、管理员模型、开发者应用、人工步骤 |
| `PROFILE_BRANDING_GUIDE.md` | 命名、Handle、头像/横幅、简介、链接与 UTM、禁用宣称 |
| `YOUTUBE_CHANNEL_PLAN.md` | YouTube 频道搭建、验证、主页分区、内容支柱、Postiz 约束 |
| `POSTIZ_PLATFORM_COVERAGE.md` | Postiz provider 覆盖、能力边界、分析范围、自建应用门槛 |
| `ACCOUNT_STATUS_INVENTORY.md` | 账号现状盘点（全部 `UNKNOWN`/`NOT_STARTED`）与待办 |
| `SEO_MONTH2_EXECUTION_PLAN.md` | 四周执行计划、依赖、验收标准、风险 |
| `BUDGET_AND_PAID_OPTIONS.md` | 最小/标准预算、付费触发条件、明确不买项 |
| `DECISION_REGISTER.md` | 决策台账（`RECOMMENDED`/`PROPOSED`/`USER_ACTION_REQUIRED`/`UNKNOWN`） |
| `EVIDENCE_INDEX.md` | 证据索引：来源、访问结果、限制、结论状态 |
| `SHA256SUMS` | 本目录文件校验和 |

## 4. 状态词表

结论状态仅使用：

`CONFIRMED` / `RECOMMENDED` / `PROPOSED` / `USER_ACTION_REQUIRED` / `UNKNOWN` / `BLOCKED`

账号状态仅使用：

`NOT_STARTED` / `REGISTERED` / `EMAIL_VERIFIED` / `PHONE_VERIFIED` / `PROFILE_CREATED` / `PROFILE_COMPLETED` / `BUSINESS_VERIFIED` / `POSTIZ_CONNECTED` / `READY` / `BLOCKED` / `UNKNOWN`

本轮没有任何账号被登录或操作，因此 `REGISTERED` 及以上状态一律不得假定。

## 5. 前置用户动作（最小的 8 项）

| # | 动作 | 为什么必须用户做 | 状态 |
|---|---|---|---|
| 1 | 确认品牌专用邮箱（如 `social@morrishk.net` 或现用企业邮箱） | Agent 不得代注册/代收验证码 | `USER_ACTION_REQUIRED` |
| 2 | 确认公司法定名称、注册地址、目标市场、品牌一句话简介 | 公开主页与认证必须真实一致；现有权威文档未给出品牌口号 | `USER_ACTION_REQUIRED` |
| 3 | 确认可公开的联系方式（邮箱/电话/WhatsApp）与隐私政策 URL | 平台资料页需真实联系方式；不得编造 | `USER_ACTION_REQUIRED` |
| 4 | 指定 2 名以上主页管理员（含一名 break-glass） | 防止个人账号离职导致主页失控 | `USER_ACTION_REQUIRED` |
| 5 | 建立品牌密码库与 2FA 策略 | 凭证只由用户持有 | `USER_ACTION_REQUIRED` |
| 6 | 确认是否已有任何平台账号（含个人账号曾建 Page） | 避免重复建号/所有权冲突 | `UNKNOWN` |
| 7 | 批准预算档位（$0 / 标准年付 / 按月） | 付费决定只能由用户作出 | `USER_ACTION_REQUIRED` |
| 8 | 决定 Postiz 部署形态（自建 vs Cloud） | 涉及 28_ 合规边界与运维成本 | `PROPOSED` |

## 6. 自检

- [x] 仅新增 `29_social_platform_presence_plan/`，未修改任何既有目录或 Session A 文件。
- [x] 未注册账号、未登录后台、未创建 OAuth App、未连接 Token、未发布内容、未购买任何服务。
- [x] 所有账号状态为 `UNKNOWN` 或 `NOT_STARTED`，未把计划写成已建立。
- [x] 所有价格均标注来源；无法确认的写 `UNKNOWN`，未估算成官方价格；广告预算与主页费用分列。
- [x] 所有结论使用规定状态词；建议未被写成已批准决定。
- [x] 区分官方文档、Postiz 文档、Postiz 源码、不可访问来源四类证据。
- [x] `SHA256SUMS` 覆盖本目录 11 份文件（不含自身），可用 `sha256sum -c` 复算。
- [x] 文本为 LF；Markdown 表格列数自检通过。

## 6.1 复核修订记录（R1–R5）

| 编号 | 修订内容 | 涉及文件 |
|---|---|---|
| R1 | 账号登录模型改为三类：A. 个人 Profile 管理企业主页、B. 直接注册独立品牌账号、C. 平台内品牌资产/共享管理；删除“全部平台都要个人账号”与“所有平台都能纯企业账号”两种绝对表述（第三轮进一步细化，见 6.2） | `README.md`、`ACCOUNT_REQUIREMENTS.md`、`PLATFORM_MASTER_MATRIX.md` |
| R2 | LinkedIn 认证改为资格可来自主页活跃/互动/商业关系，付费产品非唯一路径，最终由平台裁量，价格 `UNKNOWN` | `README.md`、`ACCOUNT_REQUIREMENTS.md`、`PLATFORM_MASTER_MATRIX.md`、`BUDGET_AND_PAID_OPTIONS.md`、`DECISION_REGISTER.md` |
| R3 | YouTube 配额改用官方默认值（10,000 单位/日；`videos.insert`、`search.list` 各 100 次/日）；`maxConcurrentJob=200` 明确为 Postiz 内部并发，不是平台配额 | `EVIDENCE_INDEX.md`、`POSTIZ_PLATFORM_COVERAGE.md`、`YOUTUBE_CHANNEL_PLAN.md`、`ACCOUNT_REQUIREMENTS.md`、`PLATFORM_MASTER_MATRIX.md` |
| R4 | 拆分 Meta App Review、Business Verification 与 Postiz 部署要求；删除“所有公开应用都必须企业验证”的表述 | `ACCOUNT_REQUIREMENTS.md`、`POSTIZ_PLATFORM_COVERAGE.md`、`EVIDENCE_INDEX.md`、`PLATFORM_MASTER_MATRIX.md`、`DECISION_REGISTER.md` |
| R5 | 补充 Postiz 席位规则（Standard 无团队成员，Team/Pro 不限）；区分平台主页管理员与 Postiz 工作台用户；给出 Vimeo 暂缓下的第二个月估算预算（年付总额为推算，口径见 6.2） | `BUDGET_AND_PAID_OPTIONS.md`、`README.md`、`POSTIZ_PLATFORM_COVERAGE.md`、`EVIDENCE_INDEX.md`、`DECISION_REGISTER.md`、`SEO_MONTH2_EXECUTION_PLAN.md` |
| 品牌措辞 | `global buyers` 改为中性的 `buyers`，避免把目标市场写成已确认 | `PROFILE_BRANDING_GUIDE.md` |

> 本次修订仅改文本与证据状态，不改变“规划不等于授权”的边界：未注册账号、未购买套餐、未创建 OAuth 应用、未连接账号、未发布内容。

## 6.2 第三轮复核修订记录（R1/R2/R5 补充）

| 编号 | 修订内容 | 涉及文件 |
|---|---|---|
| R1 | 消除“X/TikTok/Reddit/Medium 必须由个人账号创建”的过度概括：按 A/B/C 三类模型逐平台说明；LinkedIn、Facebook、Instagram、YouTube、Pinterest 分别给出真实账号/管理员模型；无官方依据项标 `UNKNOWN`/`BLOCKED`（新增 E-52 Reddit、E-53 Medium） | `README.md`、`PLATFORM_MASTER_MATRIX.md`、`ACCOUNT_REQUIREMENTS.md`、`PROFILE_BRANDING_GUIDE.md`、`EVIDENCE_INDEX.md` |
| R2 | 清除 `POSTIZ_PLATFORM_COVERAGE.md` 旧口径“Page 认证本身是付费路径”；改为资格可来自主页有意义互动或既有商业关系，Premium Company Page/Jobs/Ads 为可满足资格路径但非唯一，最终由 LinkedIn 审核决定；全目录检索同义旧表述 | `POSTIZ_PLATFORM_COVERAGE.md` |
| R5 | 明确年付金额口径：官方页仅展示年付折算月价（约 $23/$31/$39/$79），$278/$374/$470/$950 为按约 20% 折扣推算的年付总额，实际以结账页为准；保留 Standard 无团队成员、Team/Pro 不限成员区别 | `BUDGET_AND_PAID_OPTIONS.md`、`POSTIZ_PLATFORM_COVERAGE.md`、`EVIDENCE_INDEX.md`、`README.md`、`DECISION_REGISTER.md` |

> 第三轮同样只改文本与证据状态，未扩大范围、未重做已通过的 R3/R4；仍未注册账号、未购买、未创建 OAuth、未连接真实账号、未发布内容。

## 7. 后续 Gate

本包提交并推送后**停止**，等待 Reviewer 审核与用户进一步授权。未获授权前不进入：

- 账号实际注册与资料填写；
- 任何付费购买或认证申请；
- Postiz 部署/连接；
- 内容生产与发布；
- 站点 Organization `sameAs` 等代码改动。