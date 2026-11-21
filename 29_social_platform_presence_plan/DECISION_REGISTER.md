# 决策台账

> `RECOMMENDED` 不等于已批准；`PROPOSED` 需用户决定；`USER_ACTION_REQUIRED` 必须用户执行；`CONFIRMED` 表示已核实的事实或硬边界，不是实施授权。
> 本台账不改变任何 Contract Freeze 决策，不构成预算批准、账号注册授权或发布授权。

## 1. 决策状态规则

| 状态 | 含义 | 谁能改 |
|---|---|---|
| `CONFIRMED` | 已核实的事实、平台约束或硬边界 | 仅当证据变化时更新 |
| `RECOMMENDED` | 本包的明确建议，等待用户采纳 | 用户 |
| `PROPOSED` | 备选方案，尚未选定 | 用户 |
| `USER_ACTION_REQUIRED` | 必须用户本人执行或提供信息 | 用户 |
| `UNKNOWN` | 证据不足，不能决定 | 待补证据 |
| `BLOCKED` | 当前无法推进（登录墙/网络/政策） | 待外部条件变化 |

## 2. 决策清单

| ID | 决策 | 选项 | 建议 | 状态 | 负责人 | 依据 | 改变条件 |
|---|---|---|---|---|---|---|---|
| D-01 | 第二个月核心社媒主页 | 5 个 / 3 个 / 8 个 | LinkedIn、YouTube、Facebook、Instagram、X | `RECOMMENDED` | 用户 | 增长规划 §5.1；人群匹配 | 用户调整目标市场或产能 |
| D-02 | 视频平台优先级 | YouTube/Vimeo/TikTok 的排序 | ① YouTube ② Vimeo（条件性）③ TikTok（条件性）；本月只建 YouTube | `RECOMMENDED` | 用户 | 增长规划 §5.3；Postiz 覆盖；E-39 | 需要短视频获客或有官网嵌入需求 |
| D-03 | 账号所有权模型 | 个人账号 / 品牌账号共享 / 混合 | Brand Account + Meta Business Portfolio + 双管理员 + 密码库 | `RECOMMENDED` | 用户 | E-01/E-12；离职风险 | IT 政策限制 |
| D-04 | 凭证由谁持有 | 用户 / Agent / 第三方 | 只由用户持有；Agent 不接收密码/Token/验证码 | `CONFIRMED` | 用户 | 任务书硬边界 | 不可变 |
| D-05 | 第二个月是否买 LinkedIn 认证 | 买 / 不买 / 询价 | 不买；先建页运营，等报价与数据 | `RECOMMENDED` | 用户 | E-14；价格 `UNKNOWN` | 认证报价可接受且有数据支撑 |
| D-06 | Postiz 部署形态 | Cloud / 自建 / 暂不接入 | 先 Cloud 7 天试用；需要数据自主再自建 | `PROPOSED` | 用户 | E-40/E-42；28_ 合规边界 | 预算、合规、运维能力变化 |
| D-07 | Postiz 接入平台范围 | 5 个 / 8 个 / 全部 | 先 5 个核心；Pinterest/Threads 次之；TikTok/Reddit 不强接 | `PROPOSED` | 用户 | `POSTIZ_PLATFORM_COVERAGE.md` | 账号就绪与审核进度 |
| D-08 | TikTok 是否接 API | 接 API / 手动 / 不做 | 第二个月手动试点，不依赖 API | `RECOMMENDED` | 用户 | E-25/E-27 | 应用审核通过且内容产能足够 |
| D-09 | Reddit 运营方式 | 自动发帖 / 人工答疑 / 不做 | 只做人工技术答疑，不用 Postiz 自动发帖 | `RECOMMENDED` | 用户 | E-34；增长规划 §5.4 | 有专职社区运营且理解规则 |
| D-10 | Vimeo 是否本月上线 | 上 / 暂缓 | 暂缓；如需无广告嵌入再评估 | `PROPOSED` | 用户 | E-38/E-39 | 官网嵌入或提案需求明确 |
| D-11 | YouTube 主页分区 | 按播放列表 / 按最新 / 不分区 | Trailer + Featured + Start Here + Product & Comparison + Order & Quality + FAQ + Latest | `RECOMMENDED` | 运营 | E-07；`YOUTUBE_CHANNEL_PLAN.md` §4 | 视频数量不足时缩减分区 |
| D-12 | 第二个月内容节奏 | 4 视频+20 图文 / 更多 / 更少 | 4 视频 + ≥20 图文（跨平台复用） | `RECOMMENDED` | 运营 | 产能与稳定优先 | 团队扩编或外包 |
| D-13 | UTM 与落地页 | 首页 / 产品详情/询盘 | 所有站外链接带 UTM，落产品详情或询盘，不落首页 | `RECOMMENDED` | 运营+开发 | 增长规划 §5.1 | 站点路由变化 |
| D-14 | 禁用宣称清单 | 允许夸张 / 严格 | 禁止 leading/largest/authorized/in stock 等未证实表述 | `CONFIRMED` | 运营 | 合规要求；`PROFILE_BRANDING_GUIDE.md` §7 | 用户提供证据后可新增 |
| D-15 | 品牌事实补齐 | 用户提供 / 编造 / 留空 | 用户提供；未提供前不进入 W2 | `USER_ACTION_REQUIRED` | 用户 | 品牌事实表 | 用户提交资料 |
| D-16 | 预算档位 | 最小 / 标准 / 月付 | 标准 A（$482/年）或最小（$0 平台订阅） | `USER_ACTION_REQUIRED` | 用户 | `BUDGET_AND_PAID_OPTIONS.md` | 用户书面批准 |
| D-17 | 第二个月是否投广告 | 投 / 不投 | 不投；另立项目与预算 | `RECOMMENDED` | 用户 | 本包范围；费用分列 | 自然内容跑通且有转化数据 |
| D-18 | 是否改变 Contract Freeze | 改 / 不改 | 不改；本包不触碰任何冻结项 | `CONFIRMED` | 用户/Reviewer | 任务书边界 | 不可变（本包范围内） |
| D-19 | 是否改站点代码（Organization sameAs 等） | 本期改 / 后置 | 后置；先完成主页与链接，再单独立项 | `CONFIRMED`（本包不做） | 用户 | 任务书边界 | 另立实施任务并授权 |
| D-20 | 建号前是否查重 | 查 / 不查 | 先查重与所有权确认，再建号 | `RECOMMENDED` | 用户 | 重复账号风险 | 用户确认无历史账号 |
| D-21 | 是否使用买粉/群发工具 | 用 / 不用 | 不用；违反平台规则与品牌安全 | `CONFIRMED` | 用户 | 平台政策；增长规划红线 | 不可变 |
| D-22 | 是否建立度量基线 | 建 / 不建 | 建；每个平台记录起始数据与 UTM 会话/询盘 | `RECOMMENDED` | 运营 | 增长规划 §2.5/§5.1 | 无分析权限时用平台后台替代 |
| D-23 | 是否申请 Meta 企业认证 | 申请 / 暂不 / 视方案 | 自建 Postiz 且公开应用时再申请；费用 `UNKNOWN` | `PROPOSED` | 用户 | E-24 | 选择自建且需要公开发布 |
| D-24 | 是否向 LinkedIn 询价认证 | 询价 / 不询 | 可询价，不承诺购买 | `PROPOSED` | 用户 | E-14 | 获得报价后重评 |
| D-25 | 内容主语言 | 英语 / 多语种 | 英语为主，重要内容加字幕；多语种按数据扩展 | `PROPOSED` | 用户 | 站点多语种现状 | 目标市场语言优先级确认 |

## 3. 待回答问题

| ID | 问题 | 影响 | 状态 |
|---|---|---|---|
| Q-01 | 是否已有任何平台账号/主页？由谁持有？ | 新建 vs 接管 | `UNKNOWN` |
| Q-02 | 品牌专用邮箱是否已存在？ | 注册与找回 | `UNKNOWN` |
| Q-03 | 法定公司名、地址、公开联系方式？ | 资料页与认证 | `USER_ACTION_REQUIRED` |
| Q-04 | 目标市场与主推语言？ | 内容与资料语言 | `UNKNOWN` |
| Q-05 | 谁写、谁审、谁发？ | 运营流程 | `USER_ACTION_REQUIRED` |
| Q-06 | 预算上限与付费偏好？ | Cloud/自建/认证 | `USER_ACTION_REQUIRED` |
| Q-07 | 是否有现成 logo/横幅/视频？ | 上线速度 | `UNKNOWN` |
| Q-08 | 站点产品详情与询盘路由是什么？ | UTM 落地页 | `UNKNOWN`（需开发确认） |

## 4. 本台账不包含

- 不包含任何“已批准”的账号注册、付费、发布或部署。
- 不包含对 28_ Postiz 合规结论的修改。
- 不包含对 Contract Freeze 的任何裁定。
- 不包含广告预算、内容制作预算、法律意见。
- 不包含对平台价格的主观估算。

## 5. 决策记录格式（后续使用）

新增决策时按以下格式追加：

```text
ID:
决策:
选项:
建议:
状态: CONFIRMED / RECOMMENDED / PROPOSED / USER_ACTION_REQUIRED / UNKNOWN / BLOCKED
负责人:
依据: E-xx / 文档路径
影响:
改变条件:
日期:
```