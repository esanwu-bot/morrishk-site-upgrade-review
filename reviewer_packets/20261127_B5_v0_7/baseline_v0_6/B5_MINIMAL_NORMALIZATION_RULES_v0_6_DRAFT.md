# B5 最小归一化规则修订稿（v0.6 / 落实 OD72 #2–#5）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-B5-MIN-007 |
| **文档版本** | **`v0.6-DRAFT`** |
| **算法版本** | **`b5-min-v0.1`**（候选；是否因本版内联算法而升版，见 §9 待决） |
| 日期 | 2026-11-27 |
| 状态 | **DRAFT — NOT_FROZEN — NOT_APPROVED — NOT_EFFECTIVE** |
| 基线 | `59_/B5_MINIMAL_NORMALIZATION_RULES_v0_5_DRAFT.md`（未修改） |
| 依据 | `72_/OWNER_DECISIONS_F04_BLK_A_D_20261127.md` #2–#5；60_ BLK-A…BLK-D；48_ OD-47-01…08；50_ §3（历史清单）；51_ §2–§3；52_ §1–§3 |
| 起草方 | 执行代理；**非 Reviewer 结论、非 Owner 冻结** |

## 0. 本版相对 v0.5 的变更

| # | 位置 | 变更 | 依据 |
|---|---|---|---|
| 1 | §1 Stage B | P1 加注 Owner 依据（D1） | OD72 #5 |
| 2 | §1 Stage B / §3 | P2 文本按 A1：authority / evidence / 实体分离**缺失或无效**均映射 `BRAND_TRUST_INVALID`；P2 仍 `PROPOSED` | OD72 #2 |
| 3 | §2（新） | 内联完整算法本体：处理顺序、码点清单、空白、NFKC、二次扫描、casefold、标点、幂等 | OD72 #4（C1） |
| 4 | §2.3 | 显式允许 U+0009 / U+000A / U+000D；消除 v0.5 “C0/C1 等”与 51_ 的冲突 | OD72 #4 |
| 5 | §6 | T8 表按 48_ 修订，并为 T8-06/09/15 记录 Owner ACCEPT 依据 | OD72 #3 / #3a |
| 6 | §8 | 51_ / 52_ 转为历史；本文件为唯一 B5 冻结候选 | OD72 #4 |

## 1. 分阶段状态机

### Stage A — 顶层输入结构校验（P0）

仅检查结构：输入对象存在；`mpn_raw` 为字符串；`brand_trust_status` 为合法枚举（`TRUSTED` / `UNVERIFIED` / `MISSING` / `REJECTED`）；必需字段类型正确。违反 → `INVALID_INPUT / INPUT_INVALID`。`mpn_raw=""` 不在此阶段判定。

### Stage B — Brand 条件（互斥）

| 条件 | 优先级 | status | reason | Key | 依据 |
|---|---|---|---|---|---|
| `brand_trust_status=REJECTED` | P1 | `INVALID_INPUT` | `BRAND_REJECTED` | 否 | **OD72 #5（D1）确认 59_ 现状** |
| `brand_trust_status=TRUSTED` 但 authority / evidence / 实体分离**缺失或无效** | P2 | `PENDING_BRAND` | `BRAND_TRUST_INVALID`（**PROPOSED**） | 否 | OD72 #2（A1）；P2 本身仍待 Owner 批准 |
| `brand_trust_status=MISSING` | P3 | `PENDING_BRAND` | `BRAND_MISSING` | 否 | 59_ |
| `brand_trust_status=UNVERIFIED` | P4 | `PENDING_BRAND` | `BRAND_UNVERIFIED` | 否 | 59_ |
| `TRUSTED` 且 authority / evidence / 实体分离均有效 | — | 进入 Stage C | — | — | — |

- P2 仅适用于显式 `TRUSTED` 而校验失败（含缺失）；P4 仅适用于显式 `UNVERIFIED`；不重叠。
- A1 后果：Brand 接口契约 B2 行（59_ Brand:89 “仅 TRUSTED、缺 authority/evidence → `UNVERIFIED/PENDING_BRAND`，无原因码”）在下一版 Brand 契约中须改为 `PENDING_BRAND / BRAND_TRUST_INVALID`。本文件不修改 59_。

### Stage C — Unicode 扫描（P5）

按 §2 执行。P5a（`INVALID_INPUT / INPUT_INVALID`）先于 P5b（`NEEDS_REVIEW / UNICODE_REVIEW_REQUIRED`）；两者均先于 Stage D。

### Stage D — 内容（P6）

§2 第 7 步结果为空，或 MPN 格式非法 → `INVALID_INPUT / MPN_INVALID`。

### Stage E — 全部通过（P7）

`TRUSTED` 且证据有效、无 P5 命中、MPN 有效 → `RESOLVED`；仅此时生成 Business Key（§5）。

## 2. 算法本体（内联；对 Brand 与 MPN 分别执行）

### 2.1 处理顺序（强制）

1. 类型校验：非字符串 → `INVALID_INPUT`。
2. **原始扫描**（任何规范化之前）：逐码点按 §2.2 判定；记录命中码点及位置。命中硬拒绝 → `INVALID_INPUT`，停止，不规范化、不生成 Key。命中复核类 → 标记 `NEEDS_REVIEW`，继续计算诊断值。
3. `NFKC` 规范化。
4. **二次扫描**：对 NFKC 输出的全部码点按 §2.2 判定，含 NFKC 新产生的码点；命中硬拒绝 → `INVALID_INPUT`；命中复核类 → `NEEDS_REVIEW`。原始扫描的命中不因 NFKC 消除而降级。
5. 空白处理（仅 §2.3 集合）：去首尾；内部连续允许空白折叠为单个 U+0020。
6. `casefold()`。
7. 结果为空字符串 → `INVALID_INPUT`。
8. 标点：保留 `- . / + # _`，不删前导零，不做别名或模糊匹配；en dash U+2013、minus U+2212 不映射为 `-`。
9. 幂等：对任一非 `INVALID_INPUT` 结果 `r`，再次执行第 2–7 步得到相同 `r`。

> 不得以 `str.isspace()` / `str.split()` 替代 §2.3 显式集合。

### 2.2 码点判定清单

**硬拒绝（`INVALID_INPUT`）**

| 范围 | 说明 |
|---|---|
| U+0000–U+0008、U+000B、U+000C、U+000E–U+001F | C0，**排除 U+0009 / U+000A / U+000D** |
| U+007F–U+009F | DEL 与 C1（含 U+0085 NEL） |
| U+200B–U+200F | ZWSP / ZWNJ / ZWJ / LRM / RLM |
| U+202A–U+202E | bidi embedding / override |
| U+2060–U+2064 | word joiner / invisible operators |
| U+2066–U+2069 | bidi isolates |
| U+FEFF | BOM / ZWNBSP |
| U+180E | Mongolian vowel separator |
| U+034F | Combining Grapheme Joiner |
| U+E0000–U+E007F | Tag characters |
| 其他未列出的 `Cc` | — |

**复核（`NEEDS_REVIEW`，不生成 Key）**

| 范围 / 条件 | 说明 |
|---|---|
| U+00AD | Soft Hyphen |
| U+FE00–U+FE0F、U+E0100–U+E01EF | Variation Selectors |
| U+FFF9–U+FFFB | Interlinear Annotation |
| U+1D173–U+1D17A | Musical Format Controls |
| U+3164、U+FFA0、U+115F、U+1160 | Hangul Fillers |
| 其他未列出的 `Cf` | — |
| U+00DF、U+1E9E（ß / ẞ） | casefold 展开，OD-47-03 FLAG |
| U+0130（İ） | casefold 为 `i + U+0307`，OD-47-03a ACCEPT WITH FLAG |
| NFKC 兼容映射（`NFKC(c) ≠ NFC(c)`），**但不含**全角 U+FF01–U+FF5E 与 §2.3 空白 | 圈号、上标、连字等，OD-47-02 FLAG |

> 最后两行“casefold 展开”与“NFKC 兼容映射”两条是本版为落实 48_ OD-47-02/03/03a 而提出的**判定机制**；48_ 只给出了类别方向。机制本身属于执行方起草，须 Reviewer 复核与 Owner 冻结。

### 2.3 允许空白（统一折叠为 U+0020）

U+0009、U+000A、U+000D（**OD72 #4 明确允许**）、U+0020、U+00A0、U+1680、U+2000–U+200A、U+2028、U+2029、U+202F、U+205F、U+3000。

明确不是空白：U+000B、U+000C、U+0085、U+180E、U+200B–U+200F、U+2060–U+2064、U+2066–U+2069、U+FEFF（均硬拒绝）；U+00AD（复核）。

## 3. 原因码（封闭，统一大写）

`INPUT_INVALID`、`BRAND_REJECTED`、`BRAND_TRUST_INVALID`（PROPOSED）、`BRAND_MISSING`、`BRAND_UNVERIFIED`、`UNICODE_REVIEW_REQUIRED`、`MPN_INVALID`。未列出的原因码不得使用。

## 4. `identity_norm` 与诊断值

沿用 59_ §4：B5 不存在 `identity_norm`；`RESOLVED` 要求 `brand_norm` 与 `mpn_norm` 均有效；`NEEDS_REVIEW` 可计算 `diagnostic_norm`，但不得用于匹配或哈希。

## 5. 可信计算与 Business Key

沿用 59_ §5，内容不变：仅 `RESOLVED` 生成；禁止调用方提供 `brand_norm` / `mpn_norm` / `RESOLVED`；canonical JSON `{"schema":"product-business-key","rule_version":"b5-min-v0.1","brand_norm":"...","mpn_norm":"..."}`；`pbk1_` + SHA-256；`rule_version` 入哈希；原始输入不入哈希；不声称持久、并发或跨进程唯一。

## 6. T8 向量与处置

见同目录 `T8_VECTORS_AND_DISPOSITION_v0_6_DRAFT.md`。

## 7. 空白向量

WS-01…WS-15、WS-15A/B/C 沿用 51_ §5 与 52_ §1.2 的输入与预期，转录于 T8 文件 §3，并附执行方参考计算结果。

## 8. 规范优先级与历史边界

- 本文件为唯一 B5 冻结候选；与 59_ 冲突处，以本文件为准（冻结后生效）；
- 51_、52_ 的算法机制已内联于 §2，**转为历史**；
- 50_ §3 码点清单已内联于 §2.2，转为历史；50_ §6 T8 表为历史；
- 47_ T8 表的“判定”列为历史，处置以本版 T8 文件为准；
- 52_:40、52_:44、53_ Product:63 的 `identity_norm` 条款继续不得作为现行 Business Key 输入。

## 9. 冻结前待决

1. 算法版本：本版内联并精确化算法机制，是否升为 `b5-min-v0.2`（语义变化须升版，见 50_ §0）——`OWNER_DECISION_REQUIRED`；
2. §2.2 最后两行判定机制由执行方起草，须 Reviewer 复核；
3. P2 `BRAND_TRUST_INVALID` 仍 `PROPOSED`，须单独 Owner 批准；
4. Brand 接口契约 B2 行须按 A1 出新版（本文件未修改 59_）；
5. 参考计算环境为 Python 3.12.16 / Unicode 15.0.0，与 47_ 的 3.13.15 / 15.1.0 不同；正式测试须在项目运行环境复算；
6. 独立 Reviewer 全文复核（相当于 60_ R4）。

## 10. 非声明

- 本稿不是 B5 冻结、不是 P-06 批准、不是 B-1 授权；
- 未修改 50_–71_ 任何文件；未修改代码、测试、DB、DDL、API、OAuth；未运行项目测试；未 commit / push。
