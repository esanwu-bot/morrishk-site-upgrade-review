# Brand 显式可信输入接口契约修订稿（v0.4 / 修复 58_ 非阻断项）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-BRAND-INPUT-004 |
| 版本 | v0.4-DRAFT |
| 日期 | 2026-11-26 |
| 状态 | **DRAFT — NOT_APPROVED** |
| 效力 | 59_ 为唯一 Brand 接口冻结候选；53_/55_ 历史 |
| 依据 | 58_ 非阻断项；59_ B5/Product v0.5 |
| 当前接入 | 仅 ProductIdentity API 设计与候选测试；不接 pipeline/CLI |

## 1. 来源规则

| 来源 | 裁定 |
|---|---|
| 显式调用方参数 | 当前唯一允许的可信输入 |
| 配置 | 非默认可信 |
| 人工录入 | 未来受控；当前不自动授权 |
| PDF metadata `author` | 禁止 |
| `Document.manufacturer` | 禁止推断 |
| 其他字段推断 | 禁止 |

## 2. `BrandInput` 字段

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `raw` | `str \| None` | 条件 | 原始 Brand |
| `source_kind` | enum | 是 | 当前仅 `CALLER_EXPLICIT` |
| `source_id` | `str \| None` | 条件 | 来源标识 |
| `provided_by_entity_id` | `str \| None` | 条件 | 提供方稳定实体 ID |
| `trust_status` | enum | 是 | `TRUSTED/UNVERIFIED/MISSING/REJECTED` |
| `trust_authority_entity_id` | `str \| None` | 条件 | 背书方稳定实体 ID（授权名单内） |
| `authority_allowlist_version` | `str \| None` | 条件 | 授权名单版本 |
| `evidence_ref` | `str \| None` | 条件 | 证据/审计引用 |
| `rejection_reason` | `str \| None` | 条件 | `REJECTED` 时必填 |

字段映射：`provided_by_entity_id` ↔ Product `brand_provided_by_entity_id`；`trust_authority_entity_id` ↔ Product `brand_trust_authority_entity_id`；同一值，不得用显示名替代。

## 3. 授权名单治理（可审计要求）

**当前状态：授权名单文件/批准记录未提供 → `OWNER_DECISION_REQUIRED` / `NOT_VERIFIABLE`；不得虚构批准。**

| 项 | 要求 |
|---|---|
| 名单载体 | 版本化受控文件（建议 `B5_TRUST_AUTHORITY_ALLOWLIST.md`） |
| 版本 | 每次变更升版本；BrandInput 记录 `authority_allowlist_version` |
| 维护方 | Owner 指定，记录责任主体 |
| Owner 批准 | 名单/版本须有 Owner 批准记录 |
| 范围 | 明确适用业务/租户/期间 |
| 有效期 | 明确生效/失效时间 |
| 实体 ID 来源 | 稳定实体 ID（非显示名/账号别名） |
| 同一控制主体 | 别名/代理/不同账号必须映射到同一控制实体 ID；相同 → 拒绝 |
| 非授权主体 | `BRAND_TRUST_INVALID` → `PENDING_BRAND`（PROPOSED） |
| 当前实现 | 无 DB/API/OAuth；名单为文档级 |

## 4. 状态与下游（与 B5/Product 一致）

| 条件 | status | reason |
|---|---|---|
| `REJECTED` | `INVALID_INPUT` | `BRAND_REJECTED` |
| `TRUSTED` 但背书/授权/实体分离无效 | `PENDING_BRAND` | `BRAND_TRUST_INVALID`（PROPOSED） |
| `MISSING` | `PENDING_BRAND` | `BRAND_MISSING` |
| `UNVERIFIED` | `PENDING_BRAND` | `BRAND_UNVERIFIED` |
| `TRUSTED` 且有效 | 进入 B5（MPN 仍需处理） | — |

- P2 仅 `TRUSTED` 校验失败；P4 仅 `UNVERIFIED`；互不重叠。
- 四种 Brand 状态均不生成 Key；`REJECTED` 不得当普通缺失。
- `BRAND_TRUST_INVALID → PENDING_BRAND` 为 **PROPOSED — OWNER_APPROVAL_REQUIRED**。

## 5. 原因码（封闭，大写）

`INPUT_INVALID`、`BRAND_REJECTED`、`BRAND_TRUST_INVALID`、`BRAND_MISSING`、`BRAND_UNVERIFIED`、`UNICODE_REVIEW_REQUIRED`、`MPN_INVALID`。

## 6. 接口边界

| 位置 | 当前 |
|---|---|
| ProductIdentity API | 允许 `BrandInput` |
| 候选测试 | 允许设计；不运行 |
| pipeline/CLI | 不授权；快照不变 |
| DB/API/OAuth/生产 | 不授权 |

## 7. 测试契约

| # | 场景 | 预期 |
|---|---|---|
| B1 | TRUSTED + 授权名单 + 证据 | 可进入 RESOLVED（MPN 有效） |
| B2 | 仅 TRUSTED，缺 authority/evidence | UNVERIFIED/PENDING_BRAND |
| B3 | MISSING | PENDING_BRAND / BRAND_MISSING |
| B4 | UNVERIFIED | PENDING_BRAND / BRAND_UNVERIFIED |
| B5 | REJECTED | INVALID_INPUT / BRAND_REJECTED |
| B6 | provided == authority entity | PENDING_BRAND / BRAND_TRUST_INVALID |
| B7 | 非授权名单 | PENDING_BRAND / BRAND_TRUST_INVALID |
| B8 | 别名同一控制实体 | PENDING_BRAND / BRAND_TRUST_INVALID |
| B9 | metadata/manufacturer 推断 | 禁止 |
| B10 | CONFIG/MANUAL 来源 | 当前不得 TRUSTED |

## 8. 待 Owner 决定

1. 授权名单文件路径/版本/维护方/批准记录/范围/有效期；
2. 实体 ID 格式与来源；
3. `BRAND_TRUST_INVALID → PENDING_BRAND` 是否批准；
4. CONFIG/MANUAL 未来解禁条件。

## 9. 非声明

- 本稿不是 Brand 输入批准、不是 P-06 批准；
- 未修改 pipeline/CLI/Product/测试；未创建模块；未运行测试；
- 未修改 50_–58_ 或冻结包。