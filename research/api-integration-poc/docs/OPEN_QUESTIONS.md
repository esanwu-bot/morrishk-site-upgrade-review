# 待客户确认事项

| 项目 | 内容 |
|---|---|
| 文档版本 | V1.1（按 Reviewer 复核意见补充） |
| 日期 | 2026-11-17 |
| 用途 | 收敛预研结论中无法由项目方单方决定的事项 |
| 说明 | 未确认前，相关能力按「未验证/未纳入」处理，不构成承诺 |

| 编号 | 问题 | 为什么必须确认 | 建议默认值（未经确认不生效） | 关联文档 |
|---|---|---|---|---|
| OQ-01 | 首批要发布到哪些平台？优先级如何？ | 决定官方直连范围、审核投入与是否需要聚合 | 先 Facebook、Instagram、LinkedIn、YouTube；TikTok/X 二期 | DECISION_MATRIX D-1 |
| OQ-02 | 各平台账号归谁所有，谁持有管理员角色？ | OAuth 主体、审核申请方、离职交接都依赖账号所有权 | 客户持有账号与管理员，项目方仅获授权 | AUTH §2 |
| OQ-03 | 是否接受内容与 token 经第三方聚合商中转？ | 涉及 DPA、数据驻留与客户告知 | 不接受 → 官方直连；接受 → 可用聚合 | DECISION_MATRIX D-3 |
| OQ-04 | X 是否在首期？是否接受按量付费与自备 API 凭证？ | X 成本随用量增长；2026-03-31 后聚合方案需客户凭证 | 首期不含 X | API_RESEARCH §1.3/§2.1 |
| OQ-05 | TikTok 是否必须公开发布，而非私密/草稿？ | 公开发布需 Content Posting 审核，周期不可控 | 首期仅草稿/私密验证 | API_RESEARCH §1.4 |
| OQ-06 | 视频托管的预算与用量预期？ | 决定 Mux / api.video / Cloudinary 的选择 | 按每分钟存储与分发报价后再定 | API_RESEARCH §3.1 |
| OQ-07 | 视频母版保存在哪里，是否需要站内播放？ | 决定托管商角色与存储成本 | 托管商转码分发，母版另存对象存储 | DECISION_MATRIX §3 |
| OQ-08 | GA4 采用单服务账号还是按客户 OAuth？ | 决定隔离强度、密钥风险与运维方式 | 单服务账号 + 按 Property 授予 Viewer | API_RESEARCH §4.7 |
| OQ-09 | 客户是否愿意把 GA4 Property 授权给服务账号？ | 无授权则无法读取任何真实数据 | 需客户提供 Property ID 并授权 | AUTH §2.6 |
| OQ-10 | 多语言内容是否按语种分渠道发布？ | 影响内容模型、发布编排与配额 | 同一渠道按语种分别发布，需确认 | DECISION_MATRIX D-8 |
| OQ-11 | 排期由平台原生能力还是自建调度统一承担？ | YouTube/FB 原生支持，TikTok/IG/LinkedIn 需自建 | 统一自建调度，平台原生仅作补充 | API_RESEARCH §3.2 |
| OQ-12 | 是否需要保存平台互动数据用于线索归因？ | 决定分析接口范围、配额与数据留存 | 仅保存发布结果与基础指标 | DECISION_MATRIX D-10 |
| OQ-13 | 是否允许在正式环境中进行真实发布测试？ | 未授权不得公开发布 | 默认禁止；需单独书面授权与测试账号 | AUTH §3 |
| OQ-14 | 评论/私信管理是否在范围内？ | 各平台权限与 API 差异大，TikTok 无文档化评论 scope | 首期不含评论管理 | API_RESEARCH §1.4 |
| OQ-15 | 是否需要多客户（代运营）模式，还是仅本站自有渠道？ | 决定聚合与隔离模型 | 仅自有渠道 | DECISION_MATRIX §2 |
| OQ-16 | 对供应商锁定与退出成本的可接受度？ | 聚合方案迁移成本高 | 核心链路优先低锁定 | DECISION_MATRIX §2 |
| OQ-17 | 是否接受 YouTube compliance audit 的审核周期？ | 不提配额时上传上限 100 次/天 | 先按 100 次/天设计 | API_RESEARCH §1.5 |
| OQ-18 | 预算范围（API 订阅、按量费用、视频托管）？ | 影响方案选择，但本预研不报价 | 待客户给出区间后另行测算 | — |
| OQ-19 | 是否有指定的数据驻留/合规要求（GDPR 等）？ | 影响聚合商与托管商选择 | 按客户所在司法辖区另行确认 | AUTH §3 |
| OQ-20 | 谁负责平台审核材料的准备与提交？ | 审核需要企业资质与录屏 | 客户提供资质，项目方准备技术材料 | AUTH §5 |
| OQ-21 | 真实发布白名单由谁维护、变更走什么审批？ | 白名单是防误发的最后一道闸门，必须由客户确认 | 客户书面确认目标清单，变更需重新确认 | AUTH §3 |
| OQ-22 | LinkedIn 组织页 URN 由谁提供？授权用户是否为该页管理员？是否需要组织发现权限？ | 组织 Identity 无法从个人 token 推断；管理员角色决定能否发帖；`w_organization_social` 不能枚举 organizationAcls | 客户提供 `LINKEDIN_AUTHOR_URN` 或 `LINKEDIN_ORGANIZATION_ID`；如需自动发现，另行申请 `rw_organization_admin` | AUTH §2.2 |
| OQ-23 | Ayrshare Profile Key 由谁创建、持有与轮换？一个 Profile 是否只绑定目标组织页？ | Profile Key 是真实发布的账号身份，platform 不能替代；多 Profile 可能导致发错账号 | 客户在 Ayrshare 控制台创建专用 Profile 并提供 Key，禁止使用 `default` 占位 | AUTH §3 |
