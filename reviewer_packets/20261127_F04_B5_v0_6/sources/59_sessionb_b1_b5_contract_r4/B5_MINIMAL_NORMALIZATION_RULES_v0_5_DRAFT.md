# B5 最小归一化规则修订稿（v0.5 / 修复 58_ BLK-1…BLK-4）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-B5-MIN-006 |
| **文档版本** | **`v0.5-DRAFT`** |
| **算法版本** | **`b5-min-v0.1`**（候选） |
| 日期 | 2026-11-26 |
| 状态 | **DRAFT — NOT_FROZEN — NOT_APPROVED** |
| 依据 | 58_ BLK-1…BLK-4；57_ v0.4；48_/47_/51_/52_ |
| 效力 | 59_ 为唯一 B5 冻结候选；50–58 效力见 `SPECIFICATION_PRECEDENCE_AND_LEGACY_BOUNDARY_v0_2_DRAFT.md` |

## 1. 分阶段状态机（修复 BLK-1/BLK-2）

### Stage A — 顶层输入结构校验（P0）

仅检查结构，不检查 MPN 内容：

- 输入对象存在；
- `mpn_raw` 为字符串；
- `brand_trust_status` 为合法枚举；
- 必需字段类型正确。

违反 → `INVALID_INPUT / INPUT_INVALID`。
**`mpn_raw=""` 不在此阶段判定**；留待 Stage D。

### Stage B — Brand 条件（互斥）

| 条件 | 优先级 | status | reason | Key |
|---|---|---|---|---|
| `brand_trust_status=REJECTED` | P1 | `INVALID_INPUT` | `BRAND_REJECTED` | 否 |
| `brand_trust_status=TRUSTED` 但信任证据/授权/实体分离无效 | P2 | `PENDING_BRAND` | `BRAND_TRUST_INVALID`（**PROPOSED — OWNER_APPROVAL_REQUIRED**） | 否 |
| `brand_trust_status=MISSING` | P3 | `PENDING_BRAND` | `BRAND_MISSING` | 否 |
| `brand_trust_status=UNVERIFIED` | P4 | `PENDING_BRAND` | `BRAND_UNVERIFIED` | 否 |
| `TRUSTED` 且证据/授权/实体分离有效 | — | 进入 Stage C | — | — |

- P2 **仅**适用于 `TRUSTED` 但校验失败；P4 **仅**适用于显式 `UNVERIFIED`；二者不重叠。
- 四种 Brand 状态均由显式枚举进入，互斥。
- `BRAND_TRUST_INVALID → PENDING_BRAND` 为 **PROPOSED**；Owner 未批准前不视为冻结。

### Stage C — Unicode 扫描（P5）

对通过 Stage B 的原始 Brand/MPN：

| 子阶段 | 条件 | status | reason |
|---|---|---|---|
| P5a | 硬禁止码点（ZWSP、C0/C1 等） | `INVALID_INPUT` | `INPUT_INVALID` |
| P5b | FLAG / ACCEPT_WITH_FLAG / 软连字符等需复核 | `NEEDS_REVIEW` | `UNICODE_REVIEW_REQUIRED` |

P5a 先于 P5b；两者均先于 Stage D。

### Stage D — MPN 内容（P6）

- `mpn_raw` 为空/仅空白/归一化后为空 → `INVALID_INPUT / MPN_INVALID`；
- MPN 格式非法 → 同上；
- 不包含 Stage A 的结构错误。

### Stage E — 全部通过（P7）

- `TRUSTED` + 证据有效 + Unicode 无风险 + MPN 有效 → `RESOLVED`；
- 仅此时生成 Business Key。

## 2. 优先级与互斥示例

| 输入组合 | 结果 | 说明 |
|---|---|---|
| 非对象/缺 `mpn_raw`/类型错误 | P0 `INPUT_INVALID` | 结构 |
| `mpn_raw=""` + Brand TRUSTED 有效 | P6 `MPN_INVALID` | 内容 |
| Brand MISSING + `mpn_raw=""` | P3 `BRAND_MISSING` | Stage B 先于 D |
| Brand REJECTED + MPN FLAG | P1 `BRAND_REJECTED` | Stage B 先于 C |
| Brand TRUSTED 证据无效 + MPN FLAG | P2 `BRAND_TRUST_INVALID` | P2 仅 TRUSTED 失败 |
| Brand UNVERIFIED + MPN FLAG | P4 `BRAND_UNVERIFIED` | P4 仅 UNVERIFIED |
| Brand TRUSTED 有效 + MPN FLAG | P5b `UNICODE_REVIEW_REQUIRED` | 进入 C |
| Brand TRUSTED 有效 + 无 FLAG + MPN 空 | P6 `MPN_INVALID` | 进入 D |
| 全部通过 | P7 `RESOLVED` | — |

**不存在 P0 与 P6 同时命中**：P0 仅结构；空 MPN 仅 P6。
**不存在 P2 与 P4 同时命中**：P2 仅 `TRUSTED` 校验失败；P4 仅 `UNVERIFIED`。

## 3. 原因码（封闭，统一大写）

`INPUT_INVALID`、`BRAND_REJECTED`、`BRAND_TRUST_INVALID`、`BRAND_MISSING`、`BRAND_UNVERIFIED`、`UNICODE_REVIEW_REQUIRED`、`MPN_INVALID`。

未列出的原因码不得使用；`PROPOSED` 一律大写。

## 4. `identity_norm` 与身份字段

- B5 **不存在 `identity_norm`**；
- `RESOLVED` 要求 `brand_norm` 与 `mpn_norm` 均有效；
- `diagnostic_norm` 仅供复核，不得匹配/哈希；
- 52_:40、52_:44、53_ Product:63 的历史 `identity_norm` 条款见 legacy boundary，**不得作为现行 Business Key 输入**。

## 5. 可信计算与 Key

仅 `RESOLVED` 生成 Key；生成方必须：

1. 校验当前输入（非历史/缓存）；
2. 校验 `rule_version` 与当前算法一致；
3. 校验 Brand 来源、实体 ID、授权名单、证据；
4. 对 `mpn_raw` 重新执行/验证 B5；
5. **禁止调用方提供 `brand_norm`、`mpn_norm` 或 `RESOLVED` 状态**；
6. 从可信计算结果取得 `brand_norm`/`mpn_norm`；
7. 按 canonical JSON 生成 Key。

禁止：`diagnostic_norm` 入 Key、未验证 norm 入 Key、复用旧 Key、仅信任状态字符串。

```json
{"schema":"product-business-key","rule_version":"b5-min-v0.1","brand_norm":"...","mpn_norm":"..."}
```

UTF-8、固定字段顺序、无多余空白；`pbk1_` + SHA-256；`rule_version` 入哈希；原始输入不入哈希；**不声称持久/并发/跨进程唯一**；`product_uid` 不由公式生成。

## 6. T8 引用修正（BLK-4）

- T8 测试向量：`47_/B5_T8_UNICODE_VECTORS_DRAFT.md`（DRAFT）；
- T8 裁定方向：`48_/OWNER_DIRECTION_OD47_T8_FIELD_CONTRACT_CAND04.md` §1（OD-47-01…05，RECORDED）；
- 51_/52_ 仅提供空白/诊断/NFKC 机制，**不包含 T8 向量**；57_ B5:84 的 T8 引用已废弃；
- 50_ 的 T8 表为历史草案；
- T8 尚未有独立签字冻结记录；若需冻结，`OWNER_DECISION_REQUIRED`。

## 7. 版本与效力

- 文档版本 `v0.5-DRAFT`；算法版本 `b5-min-v0.1`（候选）；
- 文档版本不入哈希；算法版本入哈希；
- 59_ 为唯一冻结候选；50–58 历史/补充边界见 legacy boundary；
- 57_ 直接前版，冲突处 59_ 优先。

## 8. 非声明

- 本稿不是 B5 冻结、不是 P-06 批准；
- 未修改代码/测试；未运行项目测试；未修改 50_–58_ 或冻结包。