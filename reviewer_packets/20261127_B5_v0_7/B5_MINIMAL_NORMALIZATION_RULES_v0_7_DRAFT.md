# B5 最小归一化规则修订稿（v0.7 / 精确定义 M1、M2）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-B5-MIN-008 |
| **文档版本** | **`v0.7-DRAFT`** |
| **算法版本** | **`b5-min-v0.1`**（候选；是否升版仍待 Owner 裁定，见 §9） |
| 日期 | 2026-11-27 |
| 状态 | **DRAFT — NOT_FROZEN — NOT_APPROVED — NOT_EFFECTIVE** |
| 基线 | `73_/B5_MINIMAL_NORMALIZATION_RULES_v0_6_DRAFT.md`（SHA-256 `ac8bf74a3b9d70c6fe0a0d92da4b67037a61d7091006c90645298dc76898dee1`，未修改） |
| 起草授权 | Owner 2026-11-27 15:01：授权起草 B5 v0.7；两条机制须精确定义并同步测试向量；P2 保持 `PROPOSED`；不得标记 FROZEN / APPROVED / EFFECTIVE；不修改既有规范 / 代码 / DB / DDL / API；不 commit / push |
| Owner 裁定（本版落实） | §2.2 casefold 展开机制：**接受**（纳入候选规则）；§2.2 NFKC 兼容映射机制：**接受**（纳入候选规则）；P2 `BRAND_TRUST_INVALID`：**暂缓批准**，保持 `PROPOSED`，排除在本版冻结范围之外 |
| Reviewer 意见来源 | Owner 转达的 Reviewer 初审（2026-11-27 14:59；仓内无原始回执） |
| 起草方 | 执行代理；非 Reviewer 结论、非 Owner 冻结 |

## 0. 本版相对 v0.6 的变更

| # | 位置 | 变更 | 依据 |
|---|---|---|---|
| 1 | §2.2 | 把 v0.6 最后两行替换为两条**精确定义**的规则 M1（casefold 展开）、M2（NFKC 兼容映射），并给出判定范围、豁免集与执行时点 | Owner 15:01 接受两条机制 |
| 2 | §2.1 | 在第 2 步与第 4 步分别标明 M2 与 M1 的执行位置 | 同上 |
| 3 | §1 Stage B、§3 | P2 加注“**排除在本版冻结范围之外**”；文字不变，状态仍 `PROPOSED` | Owner 15:01 P2 暂缓 |
| 4 | §8.1（新） | 冻结范围声明：列出纳入与排除的条款 | 同上 |
| 5 | T8 文件 | 新增 M1 / M2 专项向量 14 项；每项标出触发规则 | Owner 要求同步测试向量 |

未变更：Stage A / C / D / E 逻辑、§2.2 硬拒绝清单、§2.2 列名复核清单、§2.3 允许空白、§4、§5。

## 1. 分阶段状态机

### Stage A — 顶层输入结构校验（P0）

与 v0.6 相同。违反 → `INVALID_INPUT / INPUT_INVALID`。

### Stage B — Brand 条件（互斥）

| 条件 | 优先级 | status | reason | Key | 依据 / 冻结范围 |
|---|---|---|---|---|---|
| `brand_trust_status=REJECTED` | P1 | `INVALID_INPUT` | `BRAND_REJECTED` | 否 | OD72 #5（D1） |
| `brand_trust_status=TRUSTED` 但 authority / evidence / 实体分离缺失或无效 | P2 | `PENDING_BRAND` | `BRAND_TRUST_INVALID`（**PROPOSED**） | 否 | OD72 #2（A1）；**Owner 15:01 暂缓批准，排除在本版冻结范围之外** |
| `brand_trust_status=MISSING` | P3 | `PENDING_BRAND` | `BRAND_MISSING` | 否 | 59_ |
| `brand_trust_status=UNVERIFIED` | P4 | `PENDING_BRAND` | `BRAND_UNVERIFIED` | 否 | 59_ |
| `TRUSTED` 且 authority / evidence / 实体分离均有效 | — | 进入 Stage C | — | — | — |

### Stage C — Unicode 扫描（P5）

按 §2 执行。P5a（`INVALID_INPUT / INPUT_INVALID`）先于 P5b（`NEEDS_REVIEW / UNICODE_REVIEW_REQUIRED`）。M1、M2 均属 P5b。

### Stage D / Stage E

与 v0.6 相同。

## 2. 算法本体

### 2.1 处理顺序（强制）

1. 类型校验：非字符串 → `INVALID_INPUT`。
2. **原始扫描**：对输入 `x` 的每个码点 `c`：
   a. 命中 §2.2.1 硬拒绝 → `INVALID_INPUT`，停止；
   b. 命中 §2.2.2 列名复核 → 标记 `NEEDS_REVIEW`；
   c. 满足 **M2**（§2.2.3）→ 标记 `NEEDS_REVIEW`。
3. `n = NFKC(x)`。
4. **二次扫描**：对 `n` 的每个码点 `c`：
   a. 命中 §2.2.1 硬拒绝 → `INVALID_INPUT`，停止；
   b. 若 `c` 不在 `x` 中且命中 §2.2.2 列名复核 → 标记 `NEEDS_REVIEW`；
   c. 满足 **M1**（§2.2.4）→ 标记 `NEEDS_REVIEW`。
5. 空白处理（§2.3）：去首尾；内部连续允许空白折叠为单个 U+0020。
6. `casefold()`。
7. 结果为空 → `INVALID_INPUT`。
8. 标点规则同 v0.6（保留 `- . / + # _`；不映射 U+2013、U+2212）。
9. 幂等：对非 `INVALID_INPUT` 结果 `r`，再次执行第 2–7 步得到相同 `r`。

已标记 `NEEDS_REVIEW` 的输入仍计算到第 7 步，结果仅作为 `diagnostic_norm`，不得生成 Key。

### 2.2 码点判定

#### 2.2.1 硬拒绝（`INVALID_INPUT`）

与 v0.6 §2.2 相同：通用类别 `Cc` 中除 U+0009 / U+000A / U+000D 外的全部码点（含 U+0000–U+0008、U+000B、U+000C、U+000E–U+001F、U+007F–U+009F）；U+200B–U+200F；U+202A–U+202E；U+2060–U+2064；U+2066–U+2069；U+FEFF；U+180E；U+034F；U+E0000–U+E007F。

#### 2.2.2 列名复核（`NEEDS_REVIEW`）

与 v0.6 §2.2 相同：U+00AD；U+FE00–U+FE0F；U+E0100–U+E01EF；U+FFF9–U+FFFB；U+1D173–U+1D17A；U+3164、U+FFA0、U+115F、U+1160；以及其他未被 §2.2.1 覆盖的通用类别 `Cf` 码点。

#### 2.2.3 M2 — NFKC 兼容映射（`NEEDS_REVIEW`）

**定义**：对原始输入中的单个码点 `c`，若同时满足

1. `NFKC(c) ≠ NFC(c)`，且
2. `c` 不属于豁免集 `E2`，

则 `c` 触发 M2。

**豁免集 `E2`**：

| 范围 | 理由 |
|---|---|
| U+FF01–U+FF5E（全角 ASCII 字母、数字、标点） | OD-47-01 ACCEPT |
| §2.3 全部允许空白（含 U+00A0、U+2000–U+200A、U+202F、U+205F、U+3000 等） | 由 §2.3 空白规则处理，OD-47-01 ACCEPT |

**说明**：

- 条件 1 只捕获**兼容分解**（`<compat>`、`<font>`、`<circle>`、`<super>`、`<fraction>` 等标签）；**规范等价**（如 U+212B Å、U+2126 Ω）满足 `NFKC(c) = NFC(c)`，不触发 M2。
- 不在 E2 中的半角片假名（U+FF61–U+FF9F）等仍触发 M2。
- 依据：48_ OD-47-02（“NFKC 兼容字符折叠：FLAG；不得仅因归一化结果相同即自动视为同一料号”）。

#### 2.2.4 M1 — casefold 展开（`NEEDS_REVIEW`）

**定义**：对 NFKC 输出 `n` 中的单个码点 `c`，若 `len(casefold(c)) ≠ 1`（以码点计），则 `c` 触发 M1。

**说明**：

- 捕获 casefold 后长度变化的码点，例如 U+00DF ß → `ss`、U+1E9E ẞ → `ss`、U+0130 İ → `i` + U+0307、U+1FB3 ᾳ → `αι`。
- 不捕获一对一折叠，例如 U+03C2 ς → σ、U+212A K → k（NFKC 后为 `K`）。
- 在 NFKC 之后执行，避免对已被 M2 捕获的兼容字符重复判定；同一输入可同时触发 M1 与 M2，结果相同（`NEEDS_REVIEW`）。
- 依据：48_ OD-47-03（ß → ss FLAG）、OD-47-03a（İ ACCEPT WITH FLAG）。

#### 2.2.5 判定实现要求

- M1、M2 以**单码点**为单位判定，不以字形簇或整串判定；
- 判定所用的 Unicode 数据版本须与执行环境一致，并作为测试证据记录（见 §9 第 4 项）；
- 不得以“归一化后整串相同”代替单码点判定。

### 2.3 允许空白

与 v0.6 §2.3 相同：U+0009、U+000A、U+000D、U+0020、U+00A0、U+1680、U+2000–U+200A、U+2028、U+2029、U+202F、U+205F、U+3000。

## 3. 原因码（封闭）

`INPUT_INVALID`、`BRAND_REJECTED`、`BRAND_TRUST_INVALID`（**PROPOSED，排除在本版冻结范围之外**）、`BRAND_MISSING`、`BRAND_UNVERIFIED`、`UNICODE_REVIEW_REQUIRED`、`MPN_INVALID`。

## 4–5. `identity_norm`、诊断值、可信计算与 Business Key

与 v0.6 §4–§5 相同。

## 6. 测试向量

见同目录 `T8_VECTORS_AND_DISPOSITION_v0_7_DRAFT.md`。

## 7. 空白向量

与 v0.6 相同，见 T8 文件 §3。

## 8. 规范优先级与历史边界

与 v0.6 §8 相同。v0.6 §2.2 最后两行由本版 §2.2.3 / §2.2.4 取代。

### 8.1 冻结范围声明（候选）

| 条款 | 是否纳入本版冻结候选 |
|---|---|
| Stage A、P1、P3、P4、Stage C、Stage D、Stage E | 纳入 |
| §2.1–§2.3（含 M1、M2） | 纳入 |
| §3 原因码（除 `BRAND_TRUST_INVALID`） | 纳入 |
| **P2 及原因码 `BRAND_TRUST_INVALID`** | **排除**（Owner 15:01 暂缓批准；保持 `PROPOSED`） |
| §4、§5 | 纳入 |

> 排除 P2 的后果：在 P2 获批前，`TRUSTED` 但校验失败的输入在冻结规则中**没有确定的原因码**。实现若需处理该情形，须等待 P2 裁定，或由 Owner 另行指定临时处置；执行方不得自行选择。

## 9. 冻结前待决

1. 算法版本是否升为 `b5-min-v0.2`：`OWNER_DECISION_REQUIRED`；
2. P2 批准：`OWNER_DECISION_REQUIRED`（本版排除）；
3. P2 排除期间 `TRUSTED` 校验失败输入的处置：`OWNER_DECISION_REQUIRED`；
4. 正式测试的 Unicode 基准：参考计算为 Python 3.12.16 / Unicode 15.0.0，47_ 为 3.13.15 / 15.1.0；项目环境版本未确认；
5. Brand 接口契约 B2 行按 A1 出新版（本版未修改 59_）；
6. 独立 Reviewer 全文复核。

## 10. 非声明

- 本稿不是 B5 冻结、不是 P2 批准、不是 P-06 批准、不是 B-1 授权；
- 未修改 50_–73_ 任何文件；未修改代码、测试、DB、DDL、API、OAuth；未运行项目测试；未 commit / push。
