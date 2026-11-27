# B5 最小归一化规则修订稿（v0.8 / 修正幂等性定义与 P2 执行边界）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-B5-MIN-009 |
| **文档版本** | **`v0.8-DRAFT`** |
| **算法版本** | **`b5-min-v0.1`（候选）— 升版 `b5-min-v0.2` 待 Owner 裁定**（Reviewer 建议升版；Owner 2026-11-27 15:11 未作选择） |
| 日期 | 2026-11-27 |
| 状态 | **DRAFT — NOT_FROZEN — NOT_APPROVED — NOT_EFFECTIVE** |
| 基线 | `74_/B5_MINIMAL_NORMALIZATION_RULES_v0_7_DRAFT.md`（SHA-256 `759c20e2869e727694b4be052aa80e273765bbc438c80e8315e8eec730fde521`，未修改） |
| 起草授权 | Owner 2026-11-27 15:11：授权起草 v0.8 并建复核包 |
| 触发 | Reviewer 对 commit `e784034` 的复核意见（Owner 转达，2026-11-27 15:10）：§2.1 第 9 步幂等性与 M1/M2 冲突；P2 执行边界需明确 |
| 起草方 | 执行代理；非 Reviewer 结论、非 Owner 冻结 |

## 0. 本版相对 v0.7 的变更

| # | 位置 | 变更 | 依据 |
|---|---|---|---|
| 1 | §2.1 第 9 步 | 删除“再次执行第 2–7 步得到相同 `r`”；改为引用 §2.6 | Reviewer 15:10 第 2 点 |
| 2 | §2.6（新） | 三分输出：`diagnostic_norm`（字符串幂等）、`identity_status`（仅由原始输入判定）、`review_triggers`（原始触发记录）；禁止回灌；不继承、不丢失；状态仅人工解除 | 同上 |
| 3 | §8.1 | P2 执行边界改为四条明确约束 | Reviewer 15:10 第 3 点 |
| 4 | §9 第 4 项 | 正式测试 Unicode 基准确定为项目环境 Python 3.13.15 / Unicode 15.1.0 | Owner 2026-11-27 15:11 本机输出 |
| 5 | 向量文件 | 新增 IDEM-01…IDEM-05 | Reviewer 15:10 第 2 点 |

未变更：Stage A–E 逻辑、§2.2（含 M1、M2 定义）、§2.3、§3、§4、§5。

## 1. 分阶段状态机

与 v0.7 §1 相同。P2 按 §8.1 处理。

## 2. 算法本体

### 2.1 处理顺序

第 1–8 步与 v0.7 §2.1 相同。

9. 输出与幂等性：见 §2.6。

### 2.2–2.3

与 v0.7 §2.2–§2.3 相同（M2 = §2.2.3；M1 = §2.2.4）。

### 2.6 输出组成与幂等性（新）

一次 B5 处理对原始输入 `x` 产生三个**相互独立**的输出：

| 输出 | 定义 | 幂等要求 |
|---|---|---|
| `diagnostic_norm` | 纯字符串函数 `N(x) = casefold(折叠空白(NFKC(x)))`，即 §2.1 第 3、5、6 步；**不含**第 2、4 步的扫描判定 | **要求**：对任意 `x`，`N(N(x)) = N(x)` |
| `identity_status` | **仅由原始输入 `x`** 按 Stage A–E 判定（含 §2.2 全部扫描、M1、M2） | **不要求**对 `N(x)` 重新判定得到相同状态 |
| `review_triggers` | 原始输入中命中的复核规则记录：规则（`LIST` / `M1` / `M2`）、码点、位置（M2 / LIST 为原始输入位置，M1 为 NFKC 输出位置） | 随原始输入保存，不得省略 |

约束：

1. **字符串幂等**：`N` 必须幂等；这是对归一化函数的要求，不是对状态的要求。
2. **状态不由诊断值决定**：`identity_status` 只能由原始输入计算。`N(x)` 可能不再含有触发码点（如 `ß → ss`、`① → 1`），因此对 `N(x)` 重算状态可能为 `OK`；这**不表示**原输入风险已消除。
3. **禁止回灌**：`diagnostic_norm` 不得作为 `mpn_raw` / `brand_raw` 输入 B5。需要重算时，必须使用保存的原始输入。
4. **不继承、不丢失**：若 `diagnostic_norm` 被当作新输入（有意或误操作），其结果只构成**一条新记录**，不继承原记录的 `identity_status` / `review_triggers`；原记录的 `NEEDS_REVIEW` 也**不因此被清除**。
5. **状态仅人工解除**：`NEEDS_REVIEW` 只能由人工复核决定解除；任何重新归一化、重新计算不得解除。
6. 仅 `identity_status = RESOLVED` 时，`diagnostic_norm` 才可作为 `brand_norm` / `mpn_norm` 进入 Business Key（§5）。

参考验证（执行方，非项目测试）：在 Python 3.12.16 / Unicode 15.0.0 下，对全部已分配码点 `c` 逐一以 `"A" + c + "B"` 检查 `N(N(s)) = N(s)`，反例 0。正式验证须在 §9 第 4 项所定环境复算。

## 3–5

与 v0.7 §3–§5 相同。

## 6. 测试向量

见同目录 `T8_VECTORS_AND_DISPOSITION_v0_8_DRAFT.md`。

## 8. 规范优先级与历史边界

与 v0.7 §8 相同。

### 8.1 冻结范围声明（候选）与 P2 执行边界

| 条款 | 是否纳入本版冻结候选 |
|---|---|
| Stage A、P1、P3、P4、Stage C、Stage D、Stage E | 纳入 |
| §2.1–§2.3、§2.6（含 M1、M2） | 纳入 |
| §3 原因码（除 `BRAND_TRUST_INVALID`） | 纳入 |
| **P2 及原因码 `BRAND_TRUST_INVALID`** | **排除**（Owner 15:01 暂缓批准；保持 `PROPOSED`） |
| §4、§5 | 纳入 |

**P2 执行边界**（Owner 单独裁定前一律适用）：

1. P2 **不属于本版有效规则**；
2. 遇 `brand_trust_status = TRUSTED` 但 authority / evidence / 实体分离缺失或无效的输入，**不得生成 Business Key**；
3. 执行方**不得**将该情形自行映射为 `BRAND_UNVERIFIED`、`BRAND_MISSING`、`BRAND_REJECTED` 或任何其他原因码，也不得映射为 `RESOLVED`；
4. 该情形的状态与原因码由 Owner 另行决定；在此之前，任何实现不得以本版规则为依据处理该情形。

## 9. 冻结前待决

1. 算法版本是否升为 `b5-min-v0.2`：`OWNER_DECISION_REQUIRED`（Reviewer 建议升版）；
2. P2 批准：`OWNER_DECISION_REQUIRED`（本版排除）；
3. P2 排除期间 `TRUSTED` 校验失败输入的处置：`OWNER_DECISION_REQUIRED`；
4. **正式测试 Unicode 基准：项目环境 Python 3.13.15 / Unicode 15.1.0**（Owner 本机输出，2026-11-27），与 47_ 一致；执行方参考计算为 3.12.16 / 15.0.0，须在项目环境复算全部向量与 §2.6 穷举；
5. Brand 接口契约 B2 行按 A1 出新版（本版未修改 59_）；
6. 独立 Reviewer 复核。

## 10. 非声明

- 本稿不是 B5 冻结、不是 P2 批准、不是 P-06 批准、不是 B-1 授权；
- 未修改 50_–74_ 任何文件；未修改代码、测试、DB、DDL、API、OAuth；未运行项目测试；未 commit / push。
