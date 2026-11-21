# OAUTH2 INTEGRATION PLAN · OAuth2 集成方案（仅设计，不生成凭证）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE2-OA-001 |
| 版本 | v0.1-draft（设计稿；不注册生产 OAuth 应用、不申请真实凭证、不连接生产 IdP） |
| 前置裁定依赖 | IQ-21（非生产凭证许可）OPEN → 本方案的**本地验证形态**待裁；IQ-11（注册/轮换责任人）OPEN → 生产注册流程待定；IQ-12（TTL/配额）PROPOSED |
| 与 Business API 关系 | Business API 仅消费 **T1**（Client Credentials）；T2/T3 永不进入 Business API |

---

## 1. 三条信任链（严格分离）

```text
【T1 机器链】社媒工作台 / 同步程序 ──Client Credentials──► Ds Bit AS ──opaque token──► Business API(RS)
【T2 用户链】Morrishk 用户 ──OIDC Authorization Code + PKCE──► Morrishk IdP ──ID/会话──► 社媒工作台
【T3 平台链】社媒工作台 ──各平台官方 OAuth──► Meta / LinkedIn / X / ... 平台 API
```

| 维度 | T1 | T2 | T3 |
|---|---|---|---|
| Issuer | Ds Bit AS（域名挂 IQ-10，Phase 4） | Morrishk IdP（新平台认证体系） | 各外部平台 |
| Audience | `dsbit-business-api`（RS 标识，方案值） | 社媒工作台 client_id | 各平台 API |
| Grant | client_credentials；`client_secret_basic` | authorization_code + PKCE（S256） | 平台各自流程 |
| Token 形态 | opaque Bearer（256bit base64url，候选 R-OA-01 PROPOSED） | OIDC ID Token + 会话 cookie | 平台 access/refresh |
| Scope | 5 个业务 scope（子集申请） | 工作台角色/会话 | 平台权限（如 pages posting） |
| TTL | 900s 候选 / ≤120s 提前刷新（IQ-12 PROPOSED） | 会话期（工作台策略） | 平台各自 |
| Refresh | 不签发（候选 PROPOSED） | IdP 会话续期 | 平台 refresh_token |
| 撤销 | 管理端禁用 或 RFC 7009（**P1-7 未选**）；传播 ≤60s（R-OA-03 PROPOSED） | 用户登出/会话失效 | 平台解绑 |
| 密钥管理 | secret vault；轮换责任人=IQ-11 未裁 | IdP 密钥轮换 | 平台凭据库 |
| 审计 | 签发/刷新/拒绝/撤销全记录（脱敏，记录 client_id+request_id） | 登录/登出审计 | 绑定/解绑审计 |

**混用禁止断言**（延续 SECURITY 计划）：audience 校验 + issuer 校验 + scope 空间独立存储；T2/T3 出现在 Business API 请求头 = 协议违规告警。

## 2. Business API RS 侧校验流程（W-1 隔离实现计划）

```text
Authorization: Bearer <opaque>
→ 本地 AS 桩内查表（隔离环境：无生产 AS）
  1) 存在？ 否 → 40101 INVALID_TOKEN
  2) 过期？ 是（now > issued_at + ttl） → 40102 TOKEN_EXPIRED
  3) aud == dsbit-business-api？ 否 → 40101
  4) client 仍有效（未被管理端禁用）？ 否 → 40101
  5) route 所需 scope ⊆ token.scope？ 否 → 40301 INSUFFICIENT_SCOPE
  6) 放行；记录 client_id + request_id（脱敏）
```

- 撤销传播 ≤60s：本地桩以"撤销表 + 每 30s 失效广播（或实时查表）"实现，断言撤销后下一次请求必拒。
- 时钟偏差 60s（候选 PROPOSED）：隔离环境单时钟，仅做参数化登记。

## 3. Morrishk 侧最小集成（T1 使用方）

1. Yii2 Client（W-3）负责 token 获取/缓存/刷新单飞；
2. secret 注入链：`params/env` → 组件配置 → 内存；**不入库、不入日志、不入前端**；
3. 轮换预案（责任人未裁，IQ-11）：双 secret 过渡窗口方案登记，待责任人裁定后生效。

## 4. 社媒工作台侧（T2/T3，仅边界声明）

- 工作台以 T2 识别用户、以 T3 操作平台、以 T1 拉取产品数据；三者**独立存储、独立生命周期**；
- 工作台后端聚合三层，前端永不接触 T1 secret；
- Ds Bit 产品事实经 T1 进入工作台后，用于社媒内容属**营销内容审批域**（IQ-07/内容审批角色未建）——`RELEASE_APPROVED` ≠ Morrishk 营销内容批准（R-EV-03 CONFIRMED 边界），工作台内需独立内容审核闸门，本阶段仅登记不实现。

## 5. 本地验证计划（获批后、IQ-21 裁定后启用）

| 阶段 | 内容 | 产物 |
|---|---|---|
| V-1 | 本地 AS 桩：token 签发/校验/撤销表（无网络依赖，回环） | RUN 日志 |
| V-2 | W-1 RS 六步校验全路径（SEC-01..08/11） | RUN 矩阵 |
| V-3 | 撤销传播 ≤60s 断言（注入撤销 → 60s 内必拒） | RUN 时间戳证据 |
| V-4 | W-3 Client 对接 V-1/V-2 | RUN |

凭证形态（本地 client_id/secret 的命名与签发纪律）依 IQ-21 裁定执行；**裁定前不签发任何可用凭证**，V-1..V-4 仅以方案 + 桩设计存在。

## 6. 非声明

不构成生产 OAuth 就绪、不构成 AS/RS 部署授权、不改变 IQ-11/12/21 状态；一切数值（TTL/传播/偏差）保持候选 PROPOSED。
