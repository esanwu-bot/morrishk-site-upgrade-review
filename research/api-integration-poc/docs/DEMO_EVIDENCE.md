# Demo 运行与验证证据

| 项目 | 内容 |
|---|---|
| 记录日期 | 2026-11-17 |
| 代码位置 | `research/api-integration-poc/` |
| 运行环境 | Windows 10 (19045) x64；Node.js `v24.21.0`；npm `11.19.0` |
| 运行模式 | `POC_MODE=mock`，`ALLOW_REAL_PUBLISH=false` |
| 真实凭证 | **无**（未配置任何平台 API Key / OAuth Secret / Access Token） |

> **真实性声明**
>
> 本文件中的 `PASS_MOCK` 仅表示「在本机 Mock 实现下通过」，**不等于真实 API 已跑通**。
> 本轮没有向任何真实社媒账号发布内容、没有投放广告、没有触发真实营销活动。
> 所有真实接口调用均因缺少凭证而未执行，状态为 `BLOCKED_CREDENTIAL`。

---

## 1. 自动化测试

命令：

```bash
cd research/api-integration-poc
npm test
```

结果（Node 内置 test runner）：

```
ℹ tests 61
ℹ suites 0
ℹ pass 61
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1769.4117
```

覆盖范围：

| 测试文件 | 用例数 | 覆盖点 |
|---|---:|---|
| `test/config.test.mjs` | 5 | 默认 mock、非法模式、真实发布开关、缺配置错误、`.env` 解析与不覆盖已有变量 |
| `test/errors.test.mjs` | 6 | 401/403/429/4xx/5xx 分类、可重试判定、requestId 保留、缺凭证错误 |
| `test/http.test.mjs` | 9 | JSON/文本解析、400 不重试、429 Retry-After、5xx 重试、401、超时、连接失败、请求头 |
| `test/idempotency.test.mjs` | 6 | 同键缓存、冲突拒绝、并发共享 Promise、失败不缓存、空键、TTL |
| `test/oauth-linkedin.test.mjs` | 7 | 授权 URL 与 scope、state 校验、授权码换 token、授权码一次性、refresh、无 token、断开 |
| `test/providers.test.mjs` | 18 | Ayrshare / Mux / GA4 / MP 的 Mock 正常流与错误流、真实模式缺凭证 |
| `test/publish-guard.test.mjs` | 4 | mock 放行、真实模式双开关（总开关 + 人工确认） |
| `test/redact.test.mjs` | 6 | 字段名脱敏、Bearer/JWT/长十六进制、URL 参数、非法 URL、深度截断、原始类型 |

---

## 2. Demo 运行

命令：

```bash
npm run demo:all
```

退出码 0，5 个 Demo 依次完成。以下为逐步结果。

### 2.1 `01-social-connect.mjs` — OAuth 生命周期

本地启动 Mock OAuth Server（`127.0.0.1` 随机端口），完整走完授权码流程。

| 步骤 | 状态 | 证据 |
|---|---|---|
| 1. 发起 OAuth 授权 | PASS_MOCK | 生成带 `state` 的授权 URL |
| 2. 模拟用户同意并回调 | PASS_MOCK | 302 回调携带 `code` 与相同 `state` |
| 3. 换取 token 并获取账号 | PASS_MOCK | `Morrishk Test Page (mock-org-1001)` |
| 4. 保存 token | PASS_MOCK | 写入 `.tokens/linkedin.json`；日志不打印明文 |
| 5. 读取账号数据 | PASS_MOCK | followers=1284, impressions=53210（示例数据） |
| 6. 过期后自动刷新 | PASS_MOCK | 过期后由 `refresh_token` 换取新 token 并落盘 |
| 7. 主动断开授权 | PASS_MOCK | 本地 token 文件删除 |
| 真实接口验证 | BLOCKED_CREDENTIAL | 未提供 `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` |

### 2.2 `02-social-publish.mjs` — 发布与幂等

| 步骤 | 状态 | 证据 |
|---|---|---|
| 1. 文本发布 | PASS_MOCK | `id=ayrshare-mock-1, status=PUBLISHED` |
| 2. 幂等重放 | PASS_MOCK | 相同幂等键返回同一 id，未重复提交 |
| 3. 幂等键冲突 | PASS_MOCK | `IDEMPOTENCY_CONFLICT` |
| 4. 图片发布 | PASS_MOCK | `id=ayrshare-mock-2` |
| 5. 视频发布 | PASS_MOCK | `id=ayrshare-mock-3` |
| 6. 发布失败处理 | PASS_MOCK | 模拟平台拒绝，错误码 `BAD_REQUEST` |
| 7. 定时发布 | PASS_MOCK | `status=SCHEDULED, at=2026-11-20T09:00:00Z` |
| 8. LinkedIn 官方发布 | PASS_MOCK | `id=urn:li:share:mock-1` |
| 真实发布 | POLICY_BLOCKED | `ALLOW_REAL_PUBLISH` 默认 false，需单独授权 |

### 2.3 `03-video-upload.mjs` — 视频直传链路

| 步骤 | 状态 | 证据 |
|---|---|---|
| 0. 准备测试文件 | PASS_MOCK | 184,320 字节模拟字节流（非可播放视频） |
| 1. 创建上传任务 | PASS_MOCK | `uploadId=mock-upload-1, status=waiting` |
| 2. 分片上传 | PASS_MOCK | 3 片，共 184,320 字节 |
| 3. 查询上传状态 | PASS_MOCK | `status=asset_created, assetId=mock-asset-1` |
| 4. 查询处理结果 | PASS_MOCK | `status=ready, duration=12.5s, 16:9` |
| 5. 播放地址 | PASS_MOCK | `https://stream.mux.com/...m3u8`（按官方 URL 规则生成） |
| 6. 缩略图 | PASS_MOCK | `https://image.mux.com/.../thumbnail.jpg?width=640&time=1` |
| 真实接口验证 | BLOCKED_CREDENTIAL | 未提供 `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` |
| 社媒视频发布 | NOT_TESTED | 需各平台 OAuth 与审核 |

### 2.4 `04-ga4-report.mjs` — GA4 Data API

| 步骤 | 状态 | 证据 |
|---|---|---|
| 1. 发现可用 Property | PASS_MOCK | 2 个示例 Property |
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

---

## 3. 未完成真实验证的事项

| 事项 | 状态 | 原因 |
|---|---|---|
| LinkedIn 真实 OAuth / 发帖 | BLOCKED_CREDENTIAL | 无 Client ID / Secret / 组织页授权 |
| Ayrshare 真实发布与账号关联 | BLOCKED_CREDENTIAL | 无 API Key；账号关联需其控制台/JWT 流程 |
| Meta（FB/IG）官方发布 | NOT_TESTED | 无应用、未做 App Review / Business Verification |
| X / TikTok / YouTube 发布 | NOT_TESTED | 无应用与审核；TikTok 未审核仅能发私密 |
| Mux 真实直传与转码 | BLOCKED_CREDENTIAL | 无 Token ID / Secret |
| GA4 真实报表 / Admin API | BLOCKED_CREDENTIAL | 无 Property 授权与服务账号 |
| GA4 Measurement Protocol 真实写入 | BLOCKED_CREDENTIAL | 无 Measurement ID / API Secret |
| 平台配额数字复核（GA4） | UNVERIFIED | 本轮二次直连官方配额页失败 |

未验证事项的完整清单与依据编号见 `docs/API_RESEARCH.md` §6 与 §7。

---

## 4. 复现方式

```bash
cd research/api-integration-poc
npm test
npm run demo:all
```

预期：61 个测试全部通过；5 个 Demo 退出码为 0；无任何网络请求发往真实平台（Mock OAuth Server 仅监听 `127.0.0.1`）。

如需在无凭证情况下确认「真实模式会安全失败」，可在临时环境设置 `POC_MODE=real` 后运行任一 Demo，预期得到 `BLOCKED_CREDENTIAL` 而不是发起真实调用。**不要**在配置了真实凭证的环境执行发布类 Demo，除非已获得客户书面授权。
