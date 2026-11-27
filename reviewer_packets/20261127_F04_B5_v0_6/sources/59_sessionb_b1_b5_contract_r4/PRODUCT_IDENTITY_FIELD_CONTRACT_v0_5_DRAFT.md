# ProductIdentity 字段契约修订稿（v0.5 / 修复 58_）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-PID-CONTRACT-005 |
| 版本 | v0.5-DRAFT |
| 日期 | 2026-11-26 |
| 状态 | **DRAFT — NOT_APPROVED** |
| 依据 | 58_ BLK-1…BLK-4 与非阻断项；59_ B5 v0.5；57_ Product v0.4 |
| 效力 | 59_ 为唯一 ProductIdentity 冻结候选；53_/55_ 历史 |

## 1. 模型与兼容性

- 新增独立 `ProductIdentity` 值对象；
- 不给现有 `Product` 增加必填字段；
- 不接入 pipeline/CLI；字节快照不变；
- `Product.normalized_mpn` 原语义保留；B5 使用 `mpn_norm`。

## 2. 字段契约

| 字段 | 类型 | 必填 | 契约 |
|---|---|---|---|
| `product_uid` | `str \| None` | 否 | 内部代理键；不由 Brand/MPN 生成；不承诺跨运行稳定 |
| `product_business_key` | `str \| None` | 条件 | 仅可信计算路径 `RESOLVED` 时生成 |
| `brand_raw` | `str \| None` | 条件 | 原始 Brand |
| `brand_norm` | `str \| None` | 条件 | 仅 `RESOLVED`；B5 结果；**禁止调用方提供** |
| `brand_source` | `str \| None` | 条件 | 来源标识 |
| `brand_provided_by_entity_id` | `str \| None` | 条件 | 提供方稳定实体 ID |
| `brand_trust_authority_entity_id` | `str \| None` | 条件 | 背书方稳定实体 ID（授权名单内） |
| `brand_authority_allowlist_version` | `str \| None` | 条件 | 授权名单版本 |
| `brand_evidence_ref` | `str \| None` | 条件 | 证据/审计引用 |
| `brand_trust_status` | enum | 是 | `TRUSTED/UNVERIFIED/MISSING/REJECTED` |
| `brand_rejection_reason` | `str \| None` | 条件 | `REJECTED` 时必填 |
| `mpn_raw` | `str` | 是 | 原始 MPN |
| `mpn_norm` | `str \| None` | 条件 | 仅 `RESOLVED`；B5 结果；**禁止调用方提供** |
| `diagnostic_norm` | `str \| None` | 否 | 仅 `NEEDS_REVIEW` 诊断；不得匹配/哈希 |
| `identity_status` | enum | 是 | 见 §3 |
| `identity_reason` | `str \| None` | 条件 | 封闭原因码 |
| `rule_version` | `str` | 是 | `b5-min-v0.1` |

**不存在 `identity_norm` 字段**；`RESOLVED` 要求 `brand_norm` 与 `mpn_norm` 均有效。
**禁止调用方直接提供 `brand_norm` / `mpn_norm` / `RESOLVED` 状态**；只能由可信解析路径生成。

## 3. 分阶段状态机（与 B5 v0.5 一致）

| 阶段 | 条件 | status | reason |
|---|---|---|---|
| A (P0) | 输入非对象/缺 field/类型或枚举错误 | `INVALID_INPUT` | `INPUT_INVALID` |
| B (P1) | Brand `REJECTED` | `INVALID_INPUT` | `BRAND_REJECTED` |
| B (P2) | Brand `TRUSTED` 但背书/授权/实体分离无效 | `PENDING_BRAND` | `BRAND_TRUST_INVALID`（**PROPOSED**） |
| B (P3) | Brand `MISSING` | `PENDING_BRAND` | `BRAND_MISSING` |
| B (P4) | Brand `UNVERIFIED` | `PENDING_BRAND` | `BRAND_UNVERIFIED` |
| C (P5a) | 硬禁止 Unicode | `INVALID_INPUT` | `INPUT_INVALID` |
| C (P5b) | FLAG/ACCEPT_WITH_FLAG/软连字符等 | `NEEDS_REVIEW` | `UNICODE_REVIEW_REQUIRED` |
| D (P6) | MPN 空/格式非法 | `INVALID_INPUT` | `MPN_INVALID` |
| E (P7) | 全部通过 | `RESOLVED` | — |

- P0 不含空 MPN；空 MPN 仅 P6；
- P2 仅 `TRUSTED` 校验失败；P4 仅 `UNVERIFIED`；互不重叠；
- Brand 四种状态均由显式枚举进入；`BRAND_TRUST_INVALID` 与 `BRAND_REJECTED` 不同；
- P2 映射 `PENDING_BRAND` 为 `PROPOSED — OWNER_APPROVAL_REQUIRED`。

## 4. 字段名映射（BrandInput ↔ ProductIdentity）

| BrandInput | ProductIdentity | 含义 |
|---|---|---|
| `provided_by_entity_id` | `brand_provided_by_entity_id` | 同一提供方实体 ID |
| `trust_authority_entity_id` | `brand_trust_authority_entity_id` | 同一背书方实体 ID |
| `authority_allowlist_version` | `brand_authority_allowlist_version` | 同一名单版本 |
| `evidence_ref` | `brand_evidence_ref` | 同一证据 |
| `rejection_reason` | `brand_rejection_reason` | 同一拒绝原因 |

命名可不同，但必须是同一值；禁止用显示名替代实体 ID。

## 5. 可信计算与 Key

生成方必须：

1. 校验当前输入（非历史/缓存）；
2. 校验 `rule_version` 与当前算法一致；
3. 校验 Brand 来源、实体 ID、授权名单、证据；
4. 对 `mpn_raw` 重新执行/验证 B5；
5. 确认 P7；
6. 使用可信计算的 `brand_norm`/`mpn_norm`；
7. 按 canonical JSON 生成 Key。

禁止：外部 `RESOLVED`、调用方提供 norm、`diagnostic_norm`、未验证 norm、复用旧 Key、仅信任状态字符串。

```json
{"schema":"product-business-key","rule_version":"b5-min-v0.1","brand_norm":"...","mpn_norm":"..."}
```

UTF-8、固定顺序、无多余空白；`pbk1_` + SHA-256；`rule_version` 入哈希；原始输入不入哈希；**不声称持久/并发/跨进程唯一**；`product_uid` 不由公式生成。

## 6. 授权主体

- `brand_provided_by_entity_id` 与 `brand_trust_authority_entity_id` 为稳定实体 ID；
- 两者相同或同一控制实体 → `BRAND_TRUST_INVALID`；
- authority 必须在 Owner 批准的授权名单版本内；
- 名单维护方/批准记录/实体 ID 来源见 Brand 契约；当前不引入 DB/API/OAuth。

## 7. 兼容性

| 对象 | 处理 |
|---|---|
| `Product` | 不增加必填字段 |
| `pipeline.py` | 不修改；快照不变 |
| 现有测试 | 不改既有断言 |
| `Product → ProductIdentity` | 仅设计可选引用 |

## 8. 测试契约

| # | 场景 | 预期 |
|---|---|---|
| C1 | TRUSTED + 有效 MPN | RESOLVED + Key |
| C2 | MISSING | PENDING_BRAND / BRAND_MISSING |
| C3 | UNVERIFIED | PENDING_BRAND / BRAND_UNVERIFIED |
| C4 | REJECTED | INVALID_INPUT / BRAND_REJECTED |
| C5 | TRUSTED + 信任校验失败 | PENDING_BRAND / BRAND_TRUST_INVALID |
| C6 | TRUSTED + FLAG | NEEDS_REVIEW / UNICODE_REVIEW_REQUIRED |
| C7 | TRUSTED + MPN 空 | INVALID_INPUT / MPN_INVALID |
| C8 | 空输入对象 | INVALID_INPUT / INPUT_INVALID |
| C9 | 外部 RESOLVED / 自带 norm | 拒绝；重算 |
| C10 | 复用旧 Key/旧 rule_version | 拒绝 |
| C11 | same entity / alias | BRAND_TRUST_INVALID |
| C12 | 无 identity_norm 字段 | 通过；用 brand_norm+mpn_norm |

## 9. 非声明

- 本稿不是字段契约批准、不是 P-06 批准；
- 未修改 Product/pipeline/测试；未创建模块；未运行测试；
- 未修改 50_–58_ 或冻结包。