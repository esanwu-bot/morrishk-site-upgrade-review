# Demo 运行与验证证据

| 项目 | 内容 |
|---|---|
| 文档版本 | V1.3（补充 Ayrshare Profile-Key 输出脱敏证据） |
| 记录日期 | 2026-11-17 |
| 代码位置 | `research/api-integration-poc/` |
| 运行环境 | Windows 10 (19045) x64；Node.js `v24.21.0`；npm `11.19.0` |
| 运行模式 | `POC_MODE=mock`，`ALLOW_REAL_PUBLISH=false`，`ALLOW_REAL_MP=false` |
| 真实凭证 | **无**（未配置任何平台 API Key / OAuth Secret / Access Token） |

> **真实性声明**
>
> 本文件中的 `PASS_MOCK` 仅表示「在本机 Mock 实现下通过」，**不等于真实 API 已跑通**。
> 基于本地 fixture 的解析测试（GA4 / Mux / LinkedIn ACL）同样只记为 `PASS_MOCK`；**fixture 通过不得标记为 `PASS_REAL_API`**。
> 本轮没有向任何真实社媒账号发布内容、没有投放广告、没有触发真实营销活动。
> 所有真实接口调用均因缺少凭证而未执行，状态为 `BLOCKED_CREDENTIAL`。
>
> **V1.3 修订**：Ayrshare `Profile-Key` 按敏感凭据处理。成功路径测试使用固定测试密钥 `TEST_PROFILE_SECRET_123`，以 `mode=real` 的 Provider 连接本地 Mock Server，验证 stdout/stderr、错误消息与返回结果均不出现完整密钥，同时请求头仍携带真实值；该结果仍记为 `PASS_MOCK`，不是 `PASS_REAL_API`。

---

## 1. 自动化测试

命令：

```bash
cd research/api-integration-poc
npm test
```

结果（Node 内置 test runner）：

```
ℹ tests 125
ℹ suites 0
ℹ pass 125
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 7090.5384
```

覆盖范围：

| 测试文件 | 用例数 | 覆盖点 |
|---|---:|---|
| `test/config.test.mjs` | 8 | 默认 mock、非法模式、真实发布开关、缺配置错误、`.env` 解析与不覆盖已有变量、安全开关默认关闭、白名单解析、LinkedIn API 版本与组织发现默认值 |
| `test/errors.test.mjs` | 6 | 401/403/429/4xx/5xx 分类、可重试判定、requestId 保留、缺凭证错误 |
| `test/http.test.mjs` | 11 | JSON/文本解析、400 不重试、429 Retry-After、5xx 重试、401、超时、连接失败、请求头、**POST 默认不重试**、显式 `retryNonIdempotent` 才重试 |
| `test/idempotency.test.mjs` | 6 | 本地同键缓存、冲突拒绝、并发共享 Promise、失败不缓存、空键、TTL |
| `test/oauth-linkedin.test.mjs` | 10 | 授权 URL 与最小发布 scope、**组织发现 scope 需显式申请**、state 匹配、**state 缺失/错误/未知/重放拒绝**、授权码换 token、授权码一次性、refresh、无 token、断开 |
| `test/linkedin-identity.test.mjs` | 8 | 个人身份与组织身份分离、真实 `/v2/userinfo` 与组织接口映射、`/rest/organizationAcls` 枚举（版本头 + `organizationTarget` fixture）、仅发布 scope 时 0 请求拒绝、403 归类 `BLOCKED_PERMISSION`、显式 `authorUrn` 短路、枚举为空报 `BLOCKED_PERMISSION`、真实 `publish` 未传 authorUrn 时 0 请求拒绝 |
| `test/ayrshare-target.test.mjs` | 7 | 缺 Profile Key、占位 Profile、多平台、`/api/user` 无法确认、平台未关联、平台多账号无法唯一确认时均 0 发布请求；Profile 一致时 `Profile-Key` 头与幂等字段进入 POST（本地 fixture） |
| `test/ayrshare-idempotency.test.mjs` | 5 | `idempotencyKey` 进入请求体、供应商幂等元数据、本地去重与冲突、超时只发送一次、5xx 不重试、Mock 不声称已发送 |
| `test/ga4-fixture.test.mjs` | 6 | `accountSummaries` 真实结构扁平化、`nextPageToken` 多页、`runReport` 请求体与响应结构、**分页达到上限显式失败**、上限内正常结束、Mock/Real 字段一致性 |
| `test/mux-fixture.test.mjs` | 2 | `new_asset_settings.playback_policies` 字段名、snake_case 归一化（`asset_id` / `playback_ids` / `aspect_ratio`）、Mock/Real 核心字段一致 |
| `test/log-redaction.test.mjs` | 3 | MP 真实 `api_secret` 不出现在日志、错误详情中的 URL 查询参数被脱敏、**普通日志中的 Profile-Key/target/白名单字段被脱敏** |
| `test/providers.test.mjs` | 18 | Ayrshare / Mux / GA4 / MP 的 Mock 正常流与错误流、真实模式缺凭证 |
| `test/publish-guard.test.mjs` | 13 | mock 放行、真实模式总开关 + 人工确认、目标白名单、显式目标、**占位 account 拒绝**、**LinkedIn authorUrn 绑定/不匹配**、目标格式、MP 独立开关、状态标签不可互换 |
| `test/real-safety.test.mjs` | 7 | Demo 02 Mock 只输出 `PASS_MOCK`；Real 不传参数 / 只传部分参数 / 显式 `default` / 白名单不匹配 / Ayrshare 无法解析 Profile 五类拒绝均断言 Mock Server 的发布请求为 **0**；Demo 05 未确认拒绝 MP 写入 |
| `test/redact.test.mjs` | 9 | 字段名脱敏、Bearer/JWT/长十六进制、URL 参数、非法 URL、深度截断、原始类型、**Profile-Key/target/白名单字段脱敏** |
| `test/profile-key-redaction.test.mjs` | 6 | 固定测试密钥 `TEST_PROFILE_SECRET_123`：Ayrshare 真实模式成功路径、预检失败、白名单不匹配、目标绑定错误、平台未关联、平台多账号；每个场景断言 stdout/stderr 无完整密钥、请求头保留真实值、发布请求数与原有策略一致（成功 1 次，拒绝 0 次） |

---

## 2. Demo 运行

命令：

```bash
npm run demo:all
```

退出码 0，5 个 Demo 依次完成。以下为逐步结果（V1.1 实测输出）。

### 2.1 `01-social-connect.mjs` — OAuth 生命周期

本地启动 Mock OAuth Server（`127.0.0.1` 随机端口），完整走完授权码流程。

| 步骤 | 状态 | 证据 |
|---|---|---|
| 1. 发起 OAuth 授权 | PASS_MOCK | 生成带 `state` 的授权 URL |
| 2. 模拟用户同意并回调 | PASS_MOCK | 302 回调携带 `code` 与相同 `state` |
| 3. 换取 token 并获取账号 | PASS_MOCK | 个人=`Morrishk Test User (person)`；组织=`Morrishk Test Page (mock-org-1001, verified=false)` |
| 4. 保存 token | PASS_MOCK | 写入 `.tokens/linkedin.json`；日志不打印明文 |
| 5. 读取账号数据 | PASS_MOCK | followers=1284, impressions=53210（示例数据） |
| 6. 过期后自动刷新 | PASS_MOCK | 过期后由 `refresh_token` 换取新 token 并落盘 |
| 7. 主动断开授权 | PASS_MOCK | 本地 token 文件删除 |
| 真实接口验证 | BLOCKED_CREDENTIAL | 未提供 `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` |

> 演示输出明确区分「个人身份」与「组织身份」，并标注 `verified=false`；Mock 组织**不声称**已通过 LinkedIn 组织验证。

### 2.2 `02-social-publish.mjs` — 发布与幂等（Mock 模式）

| 步骤 | 状态 | 证据 |
|---|---|---|
| 1. 文本发布 | PASS_MOCK | `id=ayrshare-mock-1, status=PUBLISHED` |
| 2. 幂等重放 | PASS_MOCK | 相同幂等键返回同一结果，未重复提交 |
| 3. 幂等键冲突 | PASS_MOCK | `IDEMPOTENCY_CONFLICT` |
| 4. 图片发布 | PASS_MOCK | `id=ayrshare-mock-2` |
| 5. 视频发布 | PASS_MOCK | `id=ayrshare-mock-3` |
| 6. 发布失败处理 | PASS_MOCK | 模拟平台拒绝：内容包含 `FAIL_DEMO` |
| 7. 定时发布 | PASS_MOCK | `status=SCHEDULED, at=2026-11-20T09:00:00Z` |
| 8. LinkedIn 官方发布 | PASS_MOCK | `id=urn:li:share:mock-1` |
| 真实发布 | POLICY_BLOCKED | Mock 模式不执行真实发布；真实发布需独立授权 |

**真实模式（V1.2 收紧账号绑定）**：Demo 02 在 `POC_MODE=real` 下要求 `--provider` / `--platform` / `--account` **全部显式传入**，不提供任何默认目标；`default` 等占位值直接拒绝。LinkedIn 的白名单目标必须与最终 `urn:li:organization:{id}` 一致；Ayrshare 必须显式给出 Profile Key，并在 POST 前用 `GET /api/user` 确认该 Profile 已关联目标平台。全部校验在任何发布请求之前完成；任一条件缺失均抛 `POLICY_BLOCKED` / `BLOCKED_PERMISSION`，输出中不会出现 `PASS_REAL_API` 或 `PASS_MOCK`。`test/real-safety.test.mjs` 通过本地计数 Server 断言五类拒绝场景的发布请求数均为 **0**。

### 2.3 `03-video-upload.mjs` — 视频直传链路

| 步骤 | 状态 | 证据 |
|---|---|---|
| 0. 准备测试文件 | PASS_MOCK | 184,320 字节模拟字节流（非可播放视频） |
| 1. 创建上传任务 | PASS_MOCK | `uploadId=mock-upload-1, status=waiting` |
| 2. 分片上传 | PASS_MOCK | 3 片，共 184,320 字节 |
| — 说明 | INFO | **Mock 分片计数只演示状态流转，不代表真实分片续传；真实直传未验证** |
| 3. 查询上传状态 | PASS_MOCK | `status=asset_created, assetId=mock-asset-1` |
| 4. 查询处理结果 | PASS_MOCK | `status=ready, duration=12.5s, 16:9` |
| 5. 播放地址 | PASS_MOCK | `https://stream.mux.com/...m3u8`（按官方 URL 规则生成） |
| 6. 缩略图 | PASS_MOCK | `https://image.mux.com/.../thumbnail.jpg?width=640&time=1` |
| 真实接口验证 | BLOCKED_CREDENTIAL | 未提供 `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` |
| 社媒视频发布 | NOT_TESTED | 需各平台 OAuth 与审核 |

### 2.4 `04-ga4-report.mjs` — GA4 Data API

| 步骤 | 状态 | 证据 |
|---|---|---|
| 1. 发现可用 Property | PASS_MOCK | `123456789:Morrishk - Global`、`987654321:Morrishk - DE`（由 `accountSummaries` 结构扁平化） |
| 2. 来源/媒介报表 | PASS_MOCK | 3 行（google/organic、linkedin/social、direct/(none)） |
| 3. 页面路径报表 | PASS_MOCK | 3 行（`/`、`/products/`、`/contact/`） |
| 4. 多 Property 参数化查询 | PASS_MOCK | 切换 Property 后正常返回 |
| 5. 无权限处理 | PASS_MOCK | `BLOCKED_PERMISSION`（403） |
| 6. 配额超限处理 | PASS_MOCK | `RATE_LIMITED`（429） |
| 7. 无效参数处理 | PASS_MOCK | 5 个日期范围被拒（上限 4） |
| 真实接口验证 | BLOCKED_CREDENTIAL | 未提供 GA4 Property 与服务账号授权 |

### 2.5 `05-ga4-measurement-protocol.mjs` — Measurement Protocol

| 步骤 | 状态 | 证据 |
|---|---|---|
| 1. MP 校验 | PASS_MOCK | `validationMessages=0`（示例） |
| 2. MP 发送 | PASS_MOCK | `eventCount=1`（未进入任何真实报表） |
| 3. 说明 | INFO | MP 只写不读；报表必须用 Data API 查询 |
| 真实接口验证 | BLOCKED_CREDENTIAL | 未提供 `GA4_MEASUREMENT_ID` / `GA4_API_SECRET` |

> 真实 MP 写入受独立开关控制：`ALLOW_REAL_MP=true` 且 CLI 带 `--confirm-mp`；社媒发布开关不会连带放行 MP。

---

## 3. P1 复核修复的证据（含 V1.2 / V1.3 补充）

| 复核项 | 修复内容 | 代码位置 | 测试证据 |
|---|---|---|---|
| GA4 结构扁平化与分页 | 从 `accountSummaries[].propertySummaries[].property` 提取 Property ID；循环 `pageToken`/`nextPageToken`；Mock 与 Real 返回同一结构 | `src/providers/analytics/ga4.js` | `test/ga4-fixture.test.mjs`（4 项） |
| Mux 字段名与归一化 | `new_asset_settings.playback_policies`；`asset_id` / `playback_ids[].id` / `aspect_ratio` 归一化为 camelCase；Mock 明确不声称续传 | `src/providers/video/mux.js` | `test/mux-fixture.test.mjs`（2 项） |
| Ayrshare 幂等 | `idempotencyKey` 进入真实请求体；区分本地存储与供应商幂等；发布 POST 不自动重试；超时/5xx/重复发布测试 | `src/providers/social/ayrshare.js`、`src/http.js` | `test/ayrshare-idempotency.test.mjs`（5 项）、`test/http.test.mjs` |
| 日志脱敏 | URL 查询参数脱敏；错误详情使用脱敏后的 URL；验证 `api_secret` 不出现在最终日志 | `src/redact.js`、`src/http.js` | `test/log-redaction.test.mjs`（2 项）、`test/redact.test.mjs` |
| LinkedIn 身份分离 | 个人 `/v2/userinfo` 仅用于识别授权人；组织 author 通过 `LINKEDIN_AUTHOR_URN` / `LINKEDIN_ORGANIZATION_ID` / ACL 枚举解析；state 强制校验且一次性 | `src/providers/social/linkedin.js` | `test/linkedin-identity.test.mjs`（8 项）、`test/oauth-linkedin.test.mjs`（10 项） |
| 真实模式安全 | 发布目标白名单 + 逐目标确认；MP 独立开关；Demo 02 改为单一目标；Real/Mock 标签不可混淆 | `src/publish-guard.js`、`src/config.js`、`demo/02-social-publish.mjs`、`demo/05-ga4-measurement-protocol.mjs` | `test/publish-guard.test.mjs`、`test/real-safety.test.mjs` |
| **P1-1 目标绑定（V1.2）** | 三参数显式、占位值拒绝、LinkedIn 白名单与最终 authorUrn 绑定、Ayrshare Profile-Key 预检、全部校验先于请求 | `src/publish-guard.js`、`demo/02-social-publish.mjs`、`src/providers/social/ayrshare.js`、`src/providers/social/linkedin.js` | `test/publish-guard.test.mjs`（13 项）、`test/real-safety.test.mjs`（7 项，计数 Server 断言 0 发布）、`test/ayrshare-target.test.mjs`（7 项） |
| **P1-2 LinkedIn ACL（V1.2）** | `/rest/organizationAcls` + `X-Restli-Protocol-Version` / `LinkedIn-Version`；发布 scope 与 `rw_organization_admin` 分离；无权限在请求前拒绝；403 归类 `BLOCKED_PERMISSION` | `src/providers/social/linkedin.js`、`src/config.js`、`src/factory.js` | `test/linkedin-identity.test.mjs`（8 项）、`test/oauth-linkedin.test.mjs`（10 项）、`test/fixtures/linkedin-acls.json` |
| **P2 GA4 分页上限（V1.2）** | 达到 `maxPages` 仍有 `nextPageToken` 时抛 `PLATFORM_ERROR`（`retryable=false`），不静默截断 | `src/providers/analytics/ga4.js` | `test/ga4-fixture.test.mjs`（6 项） |
| **P1 Profile-Key 输出脱敏（V1.3）** | `target` / `profileKey` / `publishAllowlist` 及其拼接字符串统一脱敏；Ayrshare 成功结果只回显 `***`；错误消息与 details 不含完整 Profile-Key；请求头与白名单匹配仍使用真实值 | `src/redact.js`、`src/log.js`、`src/publish-guard.js`、`src/providers/social/ayrshare.js`、`demo/02-social-publish.mjs` | `test/profile-key-redaction.test.mjs`（6 项，含 0/1 次发布请求计数）、`test/redact.test.mjs`（9 项）、`test/log-redaction.test.mjs`（3 项）、`test/ayrshare-target.test.mjs`（7 项） |

---

## 4. 未完成真实验证的事项

| 事项 | 状态 | 原因 |
|---|---|---|
| LinkedIn 真实 OAuth / 发帖 | BLOCKED_CREDENTIAL | 无 Client ID / Secret / 组织页授权 |
| LinkedIn 真实 `organizationAcls` 枚举 | BLOCKED_CREDENTIAL | 无 Client ID / Secret / `rw_organization_admin` 授权；仅用 fixture 验证 `/rest/organizationAcls` 解析 |
| LinkedIn 组织 ACL 权限不足返回 403 | BLOCKED_PERMISSION | 已按 403 分类实现并用本地 fixture 验证，未在真实组织上复现 |
| LinkedIn 个人/组织身份的真实映射 | BLOCKED_CREDENTIAL | 用 fixture 验证解析逻辑，不是真实响应 |
| Ayrshare 真实发布与账号关联 | BLOCKED_CREDENTIAL | 无 API Key；账号关联需其控制台/JWT 流程 |
| Ayrshare `Profile-Key` 与 `GET /api/user` 的真实绑定 | BLOCKED_CREDENTIAL | 仅按官方文档与本地 fixture 验证请求头与预检逻辑 |
| Ayrshare `idempotencyKey` 真实重复拒绝 | BLOCKED_CREDENTIAL | 仅按官方文档实现，未实测错误码 110 |
| Meta（FB/IG）官方发布 | NOT_TESTED | 无应用、未做 App Review / Business Verification |
| X / TikTok / YouTube 发布 | NOT_TESTED | 无应用与审核；TikTok 未审核仅能发私密 |
| Mux 真实直传、断点续传与转码 | BLOCKED_CREDENTIAL | 无 Token ID / Secret；Mock 分块计数不代表续传 |
| GA4 真实报表 / Admin API / 多页枚举 | BLOCKED_CREDENTIAL | 无 Property 授权与服务账号；分页仅用 fixture 验证 |
| GA4 Measurement Protocol 真实写入 | BLOCKED_CREDENTIAL | 无 Measurement ID / API Secret |
| 平台配额数字复核（GA4） | UNVERIFIED | 本轮二次直连官方配额页失败 |

未验证事项的完整清单与依据编号见 `docs/API_RESEARCH.md` §6 与 §7。

---

## 5. 复现方式

```bash
cd research/api-integration-poc
npm test
npm run demo:all
```

预期：**115 个测试全部通过**；5 个 Demo 退出码为 0；无任何网络请求发往真实平台（Mock OAuth Server 与计数 Server 仅监听 `127.0.0.1`）。

如需在无凭证情况下确认「真实模式会安全失败」，可在临时环境设置 `POC_MODE=real` 后运行任一 Demo，预期得到 `BLOCKED_CREDENTIAL` 或 `POLICY_BLOCKED`，而不是发起真实调用。**不要**在配置了真实凭证的环境执行发布类 Demo，除非已获得客户书面授权。
