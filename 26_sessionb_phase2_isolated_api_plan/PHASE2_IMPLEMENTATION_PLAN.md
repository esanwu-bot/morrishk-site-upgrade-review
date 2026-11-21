# PHASE 2 IMPLEMENTATION PLAN · 隔离 Business API 实施计划（主计划）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE2-PLAN-001 |
| 版本 | v0.1-draft（**计划稿**：不是实现、不是验收报告、不构成任何授权） |
| 日期 | 2026-11-21 |
| 分支 | `docs/sessionb-phase2-isolated-api-plan`（基于阶段一基线 `069ab827800447f4a0d96353cb3cac003b1e4a88`） |
| 性质声明 | 本目录全部文件为**计划与设计**；不得表述为已实现、已测试通过或已验收。实现代码须待 Independent Reviewer 对本计划裁定 PASS **且**用户明确实施授权后，方可在新分支创建 |
| 状态阶段 | Phase 1 CLOSED（`PHASE1_CLOSED_PASS`）→ **Phase 2 PLAN（本轮）** → Phase 2 IMPLEMENTATION（未获批） |
| 冻结与生产 | Contract Freeze 仍 **NOT_READY**（`x-contract-status=CANDIDATE_NOT_FROZEN`）；Production API 仍 **NOT_APPROVED** |

---

## 1. 目标与范围

### 1.1 Phase 2 IMPLEMENTATION 的目标（获批后）

在**零生产资源连接**的前提下，构建一套可独立运行、可复核的隔离 Business API 参考实现，用于：

1. 验证契约候选线形（16 操作 / 20 错误码 / 包形状方向）在真实 HTTP 语义下可执行；
2. 为 Morrishk Yii2 Client 提供联调对象（隔离环境）；
3. 为 OAuth2 Client Credentials 方案提供非生产验证路径（待 IQ-21 裁定后启用）；
4. 暴露契约候选在实现层的全部歧义，反哺契约修订（修订仍由维护人/Reviewer 裁定，执行 Agent 不改契约）。

### 1.2 明确不在范围

| 不做 | 依据 |
|---|---|
| 任何生产数据库 / Redis / S3 / 服务连接 | 启动指令 §二.5 |
| 真实凭证（client secret / access token / refresh token / 客户账号） | §二.6 |
| 修改 `12_`/`13_`/`14_`/`15_`/`16_`、Session A 仓库、解析流水线 | §二.3/§二.4 |
| 宣称 Mock 通过 = 生产可用 / Contract Freeze | §二.7 |
| 自行关闭任何 OPEN / PENDING / BLOCKED 项 | §二.8；四项 DIFF 与 IQ/B 项保持原状态 |
| 修改 Session A 数据结构（DuckDB/S3 适配仅做**接口预留**） | §F |

## 2. 实施工作分解（获批后的四个工作流）

> 以下为计划；本轮不执行。每个工作流有独立验收门槛与阻断依赖。

### W-1 隔离 Mock Runtime（HTTP）

| 项 | 内容 |
|---|---|
| 形态 | 本地 HTTP 服务（127.0.0.1 回环），严格隔离，无外联 |
| 数据 | 仅 `DEMO_FIXTURE`（`FIXTURE_DATA_SPEC.md`），合法 ULID 形态 |
| 覆盖 | 16 操作 / 20 错误码 / 包形状方向 / 分页 / ETag-304 / scope 门禁矩阵 |
| 已知缺口对策 | DIFF-CONTRACT-01（搜索条目形状）→ 实现默认按 EX-17 扁平行 + 配置开关，断言层双形态登记为 `BLOCKED_BY_DECISION`；DIFF-MOCK-05（默认过滤）→ **默认行为未裁定**：候选 A（不带参数仅返回 RELEASED）/ 候选 B（不自动过滤，由显式查询参数控制）双向量均 `BLOCKED_BY_DECISION(DIFF-MOCK-05)`；W-1 Runtime 与 W-2 Repository **不预置任何确定默认值**，裁定前任一向量均不计入行为验收 PASS |
| 阻断依赖 | IQ-09（错误明细承载位置）→ 错误体明细在 data 还是 meta 双分支登记；B6（状态枚举）→ visible_state 派生值用契约枚举 DRAFT/IN_REVIEW/RELEASED/WITHDRAWN，同时登记闸门映射；IQ-05（410 保留期）→ CATEGORY_RETIRED 路径以 fixture 驱动、窗口数值不实现 |
| 验收 | `TEST_AND_ACCEPTANCE_CRITERIA.md` §A 全部 RUN 级通过 + Reviewer 复跑 |

### W-2 Repository 接口（无数据库）

| 项 | 内容 |
|---|---|
| 形态 | 纯接口 + 内存实现（in-memory adapter）；零 SQL、零驱动 |
| 身份 | 唯一键 `(mpn_norm, brand_norm)`（R-ID-01 CONFIRMED）；`document_id` 不作身份（R-ID-02）；`prod-{document_id}` 仅临时流转 token（R-ID-02） |
| 适配预留 | `DuckDbS3SourceAdapter` 接口占位（只读引用 `13_` 设计，不 import、不连接） |
| 阻断依赖 | IQ-15（引擎/字符集）→ 不生成任何 DDL；B5（归一化冻结）→ Normalizer 以版本化接口注入，实现按 MPN-NORM-v1 PROPOSED 规则并标记；B7（种子）→ 字典内容接口留空、仅结构 |
| 验收 | 接口契约测试（不依赖 W-1 HTTP 层） |

### W-3 Yii2 Client 原型

| 项 | 内容 |
|---|---|
| 形态 | Yii2 Component（`morrishk-site` 技术栈方向），仅原型级 |
| 覆盖 | Bearer 处理、超时/重试（429 Retry-After、retryable=true）、错误映射、游标分页、ETag/304 缓存、日志脱敏、Token 生命周期 |
| 联调对象 | 仅 W-1 隔离 Mock Runtime；**不接生产 API** |
| 阻断依赖 | P1-2（X-Request-Id 回显语义）→ 客户端双策略登记；IQ-21（非生产凭证）→ 联调凭证形态待裁定 |
| 验收 | Client 契约测试（对 W-1 跑通正常路径 + 错误映射） |

### W-4 OAuth2 集成方案（设计 + 本地验证计划）

| 项 | 内容 |
|---|---|
| 形态 | 方案文档（`OAUTH2_INTEGRATION_PLAN.md`）+ 计划的测试矩阵；**不接真实 OAuth Provider、不注册生产应用** |
| 三身份分离 | ①工作台→Business API：Client Credentials；②Morrishk 用户→工作台：OIDC Auth Code + PKCE；③工作台→外部社媒平台：各平台官方 OAuth。三者 issuer/audience/scope/存储互不混用 |
| 阻断依赖 | IQ-21 → 非生产凭证形态待裁；IQ-11 → 注册/轮换责任人待裁；IQ-12 → TTL/配额数值 PROPOSED |
| 验收 | 方案评审 + （获批后）本地 AS 桩的 token 流程 RUN 记录 |

### 实施顺序与依赖

```text
W-2 Repository 接口 ──► W-1 Mock Runtime（HTTP 装配在 Repository 之上）
            │                        │
            └── FIXTURE（先行）──────┤
                                     ▼
                    W-3 Yii2 Client（对 W-1 联调）──► W-4 OAuth2 本地验证
```

FIXTURE（`FIXTURE_DATA_SPEC.md`）是 W-1/W-2 的共同前置；W-4 依赖 W-1 暴露的 401/403/429 行为。

## 3. 阻断项对实施的影响总览

| 阻断 | 影响的操作/测试/组件 | 计划内处置（不解决阻断本身） |
|---|---|---|
| DIFF-CONTRACT-01 | `GET /products/search` 响应断言 | 双形态登记，断言挂起（BLOCKED_BY_DECISION） |
| DIFF-CONTRACT-03 | search 缺 brand 断言（400 vs 422） | **仍为 PENDING**：候选-400（400/40001, field=brand）与候选-422（422/42201, missing=[brand]）双向量均 BLOCKED_BY_DECISION，不合并为单一响应；解除 = 维护人修正示例 + 一致性复验 |
| DIFF-MOCK-05 | search 默认过滤断言 | **仍为 OPEN**：候选 A（默认仅 RELEASED）/ 候选 B（不自动过滤）双向量均 BLOCKED_BY_DECISION，W-1/W-2 不预置默认值，裁定前均不计入 PASS |
| DIFF-MOCK-11 | `/evidence` 明细断言、Fixture 字段 | Fixture 构造完整 EvidenceItem；暴露范围待 B8 |
| IQ-01/02/13 签署验收 | 全部 CONFIRMED 规则的"生效性" | 注记"已登记未生效"，不阻塞隔离实现 |
| IQ-05 | `/categories` DEPRECATED→410 窗口 | 窗口数值不实现，路径以 fixture 驱动 |
| IQ-09 | 全部错误体形状 | 包形状按候选方向 + 明细承载双分支登记 |
| IQ-15 | Repository 持久化 | 零 DDL，仅内存 |
| IQ-21 | W-4 token 流程、W-3 联调凭证 | 方案先行，凭证形态待裁 |
| B5 | 归一化/业务键 | 版本化注入 + PROPOSED 标记 + 向量化测试计划 |
| B6 | visible_state / release_state / gates | 用契约枚举 + 三命名空间隔离断言 |
| B7 | 字典内容 | 结构接口 + 内容空位 |
| B8 | `/evidence` 字段暴露 | Fixture 全量、响应暴露待裁 |
| P0-2 | 实现依据的代码基线 | 隔离实现不依赖 Ds Bit 生产源码；不受影响（记录在案） |

详见 `BLOCKER_AND_DEPENDENCY_REGISTER.md`。

## 4. Git 与流程纪律

1. 计划分支 `docs/sessionb-phase2-isolated-api-plan`（本轮）；实施获批后另建实施分支（如 `feat/sessionb-phase2-isolated-runtime`）。
2. 不 amend / 不 rebase `069ab82` 及任何已审核提交；权威目录零修改。
3. 每个工作流完成 = 独立 commit + RUN 测试证据 + Reviewer 复核。
4. 全部新增数据 `DEMO_FIXTURE`；全部新代码位于新包目录（建议 `27_sessionb_phase2_isolated_api_impl/`，获批后定名）。

## 5. 本轮交付物清单

| 文件 | 作用 |
|---|---|
| `PHASE2_IMPLEMENTATION_PLAN.md` | 本文件（主计划） |
| `API_OPERATION_TEST_MATRIX.md` | 16 操作 × 正常/异常/边界 × 错误码 × 规则状态 |
| `ERROR_CODE_TEST_MATRIX.md` | 20 错误码 × 触发/字段/重试/场景 |
| `SECURITY_AND_SCOPE_TEST_PLAN.md` | 13 组安全场景 + 三类 Token 分离 |
| `REPOSITORY_INTERFACE_PLAN.md` | 隔离接口计划（无数据库） |
| `YII2_CLIENT_PLAN.md` | Client 原型计划 |
| `OAUTH2_INTEGRATION_PLAN.md` | 三身份 OAuth2 设计方案 |
| `FIXTURE_DATA_SPEC.md` | DEMO_FIXTURE 数据规范 |
| `BLOCKER_AND_DEPENDENCY_REGISTER.md` | 阻断项 → 操作/测试/组件映射 |
| `TEST_AND_ACCEPTANCE_CRITERIA.md` | 实施期验收标准 |
| `README.md` | 包说明 |
| `SELF_CHECK.md` + `tools/self_check.js` | 独立验证清单与自检脚本（真实执行） |

## 6. 非声明

本计划与随附矩阵**不构成**：实现完成、测试通过、Mock 验收、契约冻结、生产授权、任何 OPEN/PENDING/BLOCKED 项的关闭。所有"预期结果"均为获批实施后的**验收目标**，不是现状断言。
