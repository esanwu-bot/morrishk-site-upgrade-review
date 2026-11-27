# B5 空白/诊断值/NFKC 二次扫描与 CAND-09 补充裁定记录

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-OD52-001 |
| 版本 | v0.1-DRAFT |
| 日期 | 2026-11-26 |
| 状态 | **DRAFT — NOT_APPROVED — B5 NOT FROZEN — P-06 OPEN** |
| 性质 | 对 51_ 的补充草案；不是 B5 冻结、不是 P-06 allowlist 批准 |
| 依据 | 51_ B5 空白/扫描顺序；51_ CAND-09 条件；Owner 审阅意见 |

## 1. 全空白输入的最终状态

### 1.1 规则

- 原始输入扫描仅将 §3.1 允许空白视为空白；U+200B–U+200F 等仍为 `INVALID_INPUT`；
- NFKC 后，去首尾允许空白并将内部连续允许空白折叠为 U+0020；
- **若折叠后结果为空字符串 → `INVALID_INPUT`**；
- 不生成空 `brand_norm`/`mpn_norm`，不生成 business key；
- 保留原始输入、原始码点与位置作为证据。

### 1.2 测试向量补充

| ID | 输入（repr） | 预期 |
|---|---|---|
| WS-07 | `'   '` | `INVALID_INPUT` |
| WS-15A | `'\t\n\r\u00a0\u3000'` | `INVALID_INPUT`（全为允许空白，折叠后为空） |
| WS-15B | `'\u2000\u2028\u3000'` | `INVALID_INPUT`（全为允许空白） |
| WS-15C | `'\u200b'` | `INVALID_INPUT`（不是允许空白） |

> 原 WS-15（U+2000 EN QUAD）保留为“允许空白”；全空白用例以 WS-15A/15B 明确。

## 2. `NEEDS_REVIEW` 诊断值与身份值边界

### 2.1 两个值必须分离

| 值 | 用途 | 是否可用于匹配/哈希 |
|---|---|---|
| `diagnostic_norm` | 供人工复核/诊断 | **否** |
| `identity_norm` | 仅 `RESOLVED` 的身份值 | 是（business key 输入） |

### 2.2 约束

1. `NEEDS_REVIEW` 可计算 `diagnostic_norm`，但**不得**写入 `identity_norm`；
2. `diagnostic_norm` 不得参与 business key 哈希；
3. 下游匹配必须要求 `identity_status = RESOLVED`，不得回退使用诊断值；
4. 记录必须保留 `raw`、触发复核的码点及位置、`diagnostic_norm`；
5. `NEEDS_REVIEW` 不得因“诊断值看起来相同”而被当作同一身份。

## 3. NFKC 后二次扫描的完整判定范围

### 3.1 扫描范围

对 **NFKC 输出的全部码点** 扫描，而非仅重复检查原始输入字符：

1. 逐码点检查 B5 §3.1/§3.2 全部禁止/复核清单；
2. 检查 NFKC 新产生的码点（不在原始输入中的）；
3. 其他未列 `Cf` → `NEEDS_REVIEW`；其他 `Cc` → `INVALID_INPUT`；
4. 记录 `raw → NFKC` 的变化（至少记录被替换的码点及位置）。

### 3.2 状态优先级

| 情况 | 结果 |
|---|---|
| 原始扫描命中硬禁止 | `INVALID_INPUT`（已停止，不规范化） |
| NFKC 输出命中硬禁止 | `INVALID_INPUT` |
| 原始或输出命中复核类 | `NEEDS_REVIEW` |
| NFKC 输出全为允许字符/空白 | 继续至 casefold |

> 即使 NFKC 将某个原始危险字符“消除”，原始扫描记录仍有效，不得将状态降级为 `RESOLVED`。

## 4. CAND-09 解除 BLOCKED 的程序

1. E-01…E-05 证据提交 **不等于**自动解除；
2. 必须经独立审查，并由 Owner 明确裁定；
3. E-01 必须证明**直接和间接**均不调用 `pipeline.py`/`parse_pdf`；经 helper 间接调用亦不符合；
4. 如需修改 `pipeline.py` 或更新字节快照，CAND-09 继续 `BLOCKED`；
5. 证据提交阶段只做文档/DRAFT，不修改代码、不运行测试；
6. 解除后仍需 P-06 最终允许与执行授权，不得直接实施。

## 5. 状态

| 项 | 状态 |
|---|---|
| B5 | `DRAFT / NOT_FROZEN` |
| CAND-09 | `BLOCKED` |
| P-05 / P-06 | `OPEN` |
| P-07 / P-08 / P-09b / P-19 | `OPEN` |
| B-1 | `NOT_READY / NOT_GRANTED / NOT_EXECUTED` |
| 五项 Gate | 全部 `NO` |

## 6. 非声明

- 本记录不是 B5 冻结、不是 CAND-09 解除、不是 P-06 批准；
- 未修改代码/测试；未运行测试；未创建/检出 worktree；未读取/操作 stash；
- 未签署 Owner Record、未授予/执行 B-1；未 commit/push/merge/deploy。