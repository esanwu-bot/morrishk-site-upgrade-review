# Morrishk 社媒 / 视频 / GA4 API 预研 Demo

> 文档版本 V1.1（按 Reviewer 复核意见修订）：补齐 GA4 真实响应结构、Mux 真实字段名、Ayrshare 供应商幂等、日志 URL 脱敏、LinkedIn 个人/组织身份分离与真实发布安全开关。

本目录是 Morrishk 全球 B2B 独立站升级项目的**技术预研**产物，用于回答「社媒发布、视频托管、GA4 数据接入分别应该怎么接」以及验证关键链路的可行性。

> **性质声明**
>
> - 本目录是预研代码，**不进入正式业务主流程**，未经 Reviewer 审核不得合并。
> - 文中提到的供应商（Ayrshare、Zernio/Late、Mux、Cloudinary、api.video 等）均为候选，**不构成采购决定**。
> - 本 Demo 不承诺费用、工期或 SLA；所有价格为官方公开标价，最终以合同为准。
> - 本轮**没有使用任何真实凭证**，真实接口调用一律标记为 `BLOCKED_CREDENTIAL`，未做任何对外公开发布。

---

## 1. 目录结构

```
api-integration-poc/
├── README.md                     # 本文件
├── package.json                  # 零运行时依赖，Node 内置 test runner
├── .env.example                  # 环境变量模板（不含任何真实值）
├── .gitignore                    # 排除 .env / .tokens / 日志 / 构建产物
├── docs/
│   ├── API_RESEARCH.md           # 平台逐项调研与来源清单（S1–S65）
│   ├── DECISION_MATRIX.md        # 13 维选型矩阵、方案 A/B/C 评估、D-1…D-10
│   ├── AUTH_AND_PERMISSION.md    # OAuth / scope / 凭证存储 / 审计清单
│   ├── OPEN_QUESTIONS.md         # OQ-01…OQ-20 待客户确认事项
│   └── DEMO_EVIDENCE.md          # 测试与 Demo 运行证据（含状态标签）
├── src/
│   ├── config.js / log.js / errors.js / http.js / redact.js
│   ├── idempotency.js / token-store.js / publish-guard.js
│   ├── mock-oauth-server.js      # 本地 OAuth 授权码流程（Mock）
│   └── providers/
│       ├── social/               # SocialProvider 接口 + LinkedIn / Ayrshare
│       ├── video/                # VideoProvider 接口 + Mux
│       └── analytics/            # AnalyticsProvider 接口 + GA4 / Measurement Protocol
├── demo/
│   ├── 01-social-connect.mjs     # OAuth 生命周期
│   ├── 02-social-publish.mjs     # 发布、幂等、排期、失败处理
│   ├── 03-video-upload.mjs       # 创建直传、分片、状态、播放地址
│   ├── 04-ga4-report.mjs         # Data API 报表与错误分类
│   ├── 05-ga4-measurement-protocol.mjs
│   └── run-all.mjs
└── test/                         # node:test 自动化测试（94 个用例，含 fixture）
```

业务层只依赖 `SocialProvider` / `VideoProvider` / `AnalyticsProvider` 三个接口；官方实现与聚合实现可在不改业务代码的前提下替换（退出方案见 `DECISION_MATRIX.md`）。

---

## 2. 运行环境与快速开始

- Node.js **>= 20**（本轮实测 `v24.21.0`）
- 无需 `npm install`：仅使用 Node 内置模块（`fetch`、`node:test`、`node:crypto`、`node:http`）
- Windows / macOS / Linux 均可运行

```bash
cd research/api-integration-poc

npm test              # 94 个自动化测试
npm run demo:all      # 依次运行 5 个 Demo（默认 mock 模式）
```

单独运行：

```bash
npm run demo:social   # 01 OAuth
npm run demo:publish  # 02 发布
npm run demo:video    # 03 视频
npm run demo:ga4      # 04 GA4 报表
npm run demo:ga4-mp   # 05 Measurement Protocol
```

默认配置：`POC_MODE=mock`、`ALLOW_REAL_PUBLISH=false`。所有 Demo 只在本机产生 Mock 数据，不会向任何平台发送内容。

---

## 3. 真实模式（本轮未执行）

真实模式需要客户书面授权、测试账号与平台应用凭证。步骤：

1. 复制 `.env.example` 为 `.env`，填入凭证。`.env` 已被 `.gitignore` 排除，**不得提交**。
2. 设置 `POC_MODE=real`。
3. 视频 / GA4 只读链路可直接运行，例如：
   ```bash
   npm run demo:video
   npm run demo:ga4
   ```
4. 社媒发布额外受**四重条件**保护：
   - `.env` 中 `ALLOW_REAL_PUBLISH=true`
   - 命令显式附加 `--confirm-publish`
   - `PUBLISH_TARGET_ALLOWLIST` 配置了该目标（格式 `provider:platform:account`，逗号分隔）
   - 命令显式指定单一目标 `--provider` / `--platform` / `--account`
   ```bash
   node demo/02-social-publish.mjs --provider ayrshare --platform linkedin --account morrishk --confirm-publish
   ```

缺失任一条件时，`assertPublishAllowed()` 会抛 `POLICY_BLOCKED`，不会发起任何发布请求。**全局开关不等于批量授权**：Demo 只发布命令行指定的一个目标，不会遍历平台或账号。

5. GA4 Measurement Protocol 真实写入使用独立开关，不与社媒发布连带：
   ```bash
   ALLOW_REAL_MP=true node demo/05-ga4-measurement-protocol.mjs --confirm-mp
   ```

6. LinkedIn 组织身份需在 `.env` 中提供 `LINKEDIN_AUTHOR_URN`（推荐）或 `LINKEDIN_ORGANIZATION_ID`；二者都为空时会尝试 ACL 枚举，仍为空则报 `CONFIG_MISSING`，不会降级为个人身份发帖。

**建议的首次真实验证顺序**（未获授权前不得执行）：GA4 只读报表 → Mux 测试环境上传 → YouTube 私密上传 → FB/IG 草稿或仅自己可见 → LinkedIn 测试组织页 → 最后才考虑公开发布。

---

## 4. 证据状态标签

| 标签 | 含义 |
|---|---|
| `PASS_MOCK` | 在本机 Mock 实现下通过；**不代表真实 API 已跑通**。基于本地 fixture 的结构解析测试也归入此类 |
| `PASS_REAL_API` | 使用真实凭证调用真实接口并成功（本轮无；**fixture 测试通过不得使用此标签**） |
| `BLOCKED_CREDENTIAL` | 缺少真实凭证，未调用真实接口 |
| `BLOCKED_PERMISSION` | 凭证存在但权限/审核不足 |
| `BLOCKED_PLATFORM` | 平台策略或地区限制 |
| `NOT_TESTED` | 未验证（含未实现的能力） |
| `POLICY_BLOCKED` | 被本项目的安全开关主动拦截 |

本轮运行结果：自动化测试 **94/94** 通过（约 4.1 s）；5 个 Demo 全部跑通 Mock 链路；真实接口全部 `BLOCKED_CREDENTIAL`。逐项记录见 [`docs/DEMO_EVIDENCE.md`](docs/DEMO_EVIDENCE.md)。

---

## 5. 调研结论入口（五个必答问题）

| 问题 | 结论 | 详见 |
|---|---|---|
| 社媒用聚合还是官方？ | 官方 API 起步（FB / IG / LinkedIn / YouTube），架构预留聚合适配层；TikTok / X 视客户优先级决定是否走聚合 | `DECISION_MATRIX.md` §2、§5 |
| 视频托管与社媒发布是否分开？ | 必须分开：托管负责母版、转码、播放与归档；发布负责身份、审核与平台限制 | `DECISION_MATRIX.md` §3、`API_RESEARCH.md` §3.3 |
| GA4 是否用官方 API？ | 是，仅用官方 Data API / Admin API / Measurement Protocol | `DECISION_MATRIX.md` §4 |
| 哪些平台真实验证过？ | **没有**。本轮无凭证；仅 Mock 跑通。真实状态全部 `BLOCKED_CREDENTIAL`，未验证事项见 `API_RESEARCH.md` §6 | `DEMO_EVIDENCE.md` |
| 最终推荐路线与客户确认项？ | 社媒 A 起步 + C 接入点；视频「托管 + 官方发布」分层；GA4 官方；需确认 D-1…D-10 / OQ-01…OQ-20 | `DECISION_MATRIX.md` §1、§6；`OPEN_QUESTIONS.md` |

---

## 6. 安全与合规约定

- 凭证只从环境变量 / 本地 `.env` 读取；`.env`、`.env.*`、`.tokens/` 均被 `.gitignore` 排除。
- 本地 token 文件以 0600 权限写入（Windows 上忽略 chmod 失败）；Demo 01 结束时会主动删除。
- 日志与错误信息统一走 `redact.js`：字段名（token / secret / api key / authorization / cookie 等）、`Bearer` 头、JWT、长十六进制串、URL 查询参数均脱敏。
- 所有出站请求带 `x-request-id`；HTTP 层统一处理超时、429 / 5xx 重试与 `Retry-After`。
- 发布走 `publish-guard.js` 四重条件（总开关 + 人工确认 + 目标白名单 + 显式单一目标）；幂等键防止重复提交；发布类 POST 默认不自动重试；真实发布默认禁止。
- GA4 Measurement Protocol 真实写入使用独立开关 `ALLOW_REAL_MP`，不会被发布授权连带放行。
- 第三方服务仅作为预研候选，未引入正式生产依赖。

---

## 7. 已知限制

- Mock 不等于真实平台行为：Mock 只验证接口形状、状态流转与错误处理，不验证平台审核、配额、媒体规格与政策。
- Ayrshare 的账号关联（JWT / 控制台流程）与 LinkedIn 图片/视频上传未实现，代码中显式抛 `NOT_IMPLEMENTED`。
- Mux Mock 的分片上传只按 chunk 计数，不做真实可恢复 HTTP 上传；**Mock 分块数不代表真实断点续传能力**。
- GA4 `accountSummaries` 的多页翻页与 Mux snake_case 响应均用本地 fixture 验证了解析逻辑，真实账号下的返回仍需凭证验证。
- Ayrshare `idempotencyKey` 仅按官方文档写入请求体，供应商侧重复拒绝行为未实测。
- GA4 配额数字（200,000 tokens/天等）来自调研页面，本轮二次直连失败，Reviewer 需浏览器复核。
- 未验证事项完整清单见 `API_RESEARCH.md` §6，未核实前不得写入客户承诺。
