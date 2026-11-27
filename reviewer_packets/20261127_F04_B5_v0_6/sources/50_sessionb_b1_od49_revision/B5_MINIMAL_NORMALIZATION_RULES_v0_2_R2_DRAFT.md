# B5 最小归一化规则草案（v0.2-R2 / 引用 OD-49）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-B5-MIN-003 |
| **文档版本** | **`v0.2-R2-DRAFT`** |
| **算法版本** | **`b5-min-v0.1`**（OD-49-04 暂保留） |
| 日期 | 2026-11-26 |
| 状态 | **DRAFT — NOT_FROZEN — NOT_APPROVED** |
| 依据 | OD-49-01…04；48_ OD-47-01…08；49_ v0.2 |
| 适用范围 | 仅 P0-2 #1/#2 的 MPN/Brand 归一化与匹配 |

## 0. 文档版本 vs 算法版本

| 概念 | 值 | 含义 |
|---|---|---|
| 文档版本 | `v0.2-R2-DRAFT` | 本文件的编辑版本，可随澄清/排版变化 |
| 算法版本 | `b5-min-v0.1` | 归一化语义规则版本；进入 business key 哈希 |
| 关系 | 独立 | 文档修订不自动改变算法版本；算法语义变化必须升算法版本 |
| business key | 仅含算法版本 | 文档版本**不**参与哈希 |

## 1. OD-49 裁定映射

| 编号 | 裁定 | 落实 |
|---|---|---|
| OD-49-01 | 接收 B5 v0.2 | 本稿为 R2 修订，仍 DRAFT/不冻结 |
| OD-49-02 | `ACCEPT_WITH_FLAG` 必须 `NEEDS_REVIEW`，不得生成 key | 状态规则明确 |
| OD-49-03 | 不可见字符精确 code point 清单 | 见 §3 |
| OD-49-04 | 算法版本暂保留 `b5-min-v0.1` | 见 §0 |

## 2. 状态模型

| 状态 | 触发 | 生成 business key |
|---|---|---|
| `RESOLVED` | Brand `TRUSTED`、MPN 有效、无风险标记 | **是** |
| `PENDING_BRAND` | Brand 缺失 / `UNVERIFIED` / `MISSING` / `REJECTED` | 否 |
| `NEEDS_REVIEW` | `FLAG`、`ACCEPT_WITH_FLAG`、需复核的不可见字符 | 否 |
| `INVALID_INPUT` | 非字符串、归一化后为空、硬控制/禁止字符 | 否 |

**明确：** `ACCEPT_WITH_FLAG` **一律**进入 `NEEDS_REVIEW`，不得生成 business key；`FLAG` 不是自动匹配许可。

## 3. 不可见字符精确清单（OD-49-03）

### 3.1 `INVALID_INPUT`（硬拒绝）

| Code point / 范围 | 名称 | 说明 |
|---|---|---|
| U+0000–U+0008 | C0 controls | 除 TAB/LF/CR 外 |
| U+000B, U+000C | VT, FF | C0 |
| U+000E–U+001F | C0 controls | — |
| U+007F–U+009F | DEL / C1 controls | — |
| U+200B–U+200F | ZWSP/ZWNJ/ZWJ/LRM/RLM | 零宽与方向标记 |
| U+202A–U+202E | bidi embedding/override | LRE/RLE/PDF/LRO/RLO |
| U+2060–U+2064 | word joiner / invisible operators | WJ, invisible times/separator/plus |
| U+2066–U+2069 | bidi isolates | LRI/RLI/FSI/PDI |
| U+FEFF | BOM / ZWNBSP | — |
| U+180E | Mongolian vowel separator | — |
| U+034F | Combining Grapheme Joiner | — |
| U+E0000–U+E007F | Tag characters | — |

### 3.2 `NEEDS_REVIEW`（不生成 key）

| Code point / 范围 | 名称 | 说明 |
|---|---|---|
| U+00AD | Soft Hyphen | 不可见连字符 |
| U+FE00–U+FE0F | Variation Selectors | 可能改变字形/身份 |
| U+E0100–U+E01EF | Variation Selectors Supplement | — |
| U+FFF9–U+FFFB | Interlinear Annotation | 不可见注释控制 |
| U+1D173–U+1D17A | Musical Format Controls | — |
| U+3164 | Hangul Filler | 不可见填充 |
| U+FFA0 | Halfwidth Hangul Filler | — |
| U+115F, U+1160 | Hangul Choseong/Jungseong Filler | — |

### 3.3 其他规则

- 其他 Unicode `Cf` 未列出的 → `NEEDS_REVIEW`；
- 其他 `Cc` 未列出的 → `INVALID_INPUT`；
- 允许作为空白处理：TAB U+0009、LF U+000A、CR U+000D、NBSP U+00A0、U+2000–U+200A、U+2028、U+2029、U+3000；按去首尾/折叠规则处理；
- 该清单为 v0.2 最低集合；新增/删除需算法版本变更。

## 4. 归一化算法

1. 输入必须为字符串；否则 `INVALID_INPUT`。
2. 预扫描 §3 清单，记录状态。
3. `NFKC` 规范化。
4. 去首尾 Unicode 空白；内部连续空白折叠为单个 ASCII 空格。
5. `casefold()` 得到 `*_norm`。
6. 保留 `- . / + # _`；不删前导零；不做别名/模糊匹配。
7. 幂等：`norm(norm(x)) == norm(x)`。

对于 `NEEDS_REVIEW` 可计算 `*_norm` 供诊断，但**不得**生成 key。

## 5. 自然键与 Business Key

| 条件 | 结果 |
|---|---|
| 同 Brand/MPN，`RESOLVED` | 同一业务身份候选 |
| 同 MPN、不同 Brand | 不同身份 |
| Brand 缺失/不可信 | `PENDING_BRAND` |
| FLAG / ACCEPT_WITH_FLAG / 不可见 | `NEEDS_REVIEW` |
| 非法/空 | `INVALID_INPUT` |

仅 `RESOLVED` 生成：

```json
{"schema":"product-business-key","rule_version":"b5-min-v0.1","brand_norm":"...","mpn_norm":"..."}
```

```text
key = "pbk1_" + SHA256(UTF-8 canonical JSON)
```

约束：固定字段顺序；UTF-8；两值非空；`rule_version` 入哈希；原始输入不入哈希；不声称持久/并发/跨进程唯一；`product_uid` 不由该公式生成。

## 6. T8 处置

| ID | 输入 | 归一化 | 处置 |
|---|---|---|---|
| T8-01 | 全角 `ＡＢＣ－１２３` | `abc-123` | `ACCEPT` |
| T8-02 | 全角空格 | `abc 123` | `ACCEPT` |
| T8-03 | `①②③` | `123` | `FLAG → NEEDS_REVIEW` |
| T8-04 | `ABC²` | `abc2` | `FLAG → NEEDS_REVIEW` |
| T8-05 | `ﬁle` | `file` | `FLAG → NEEDS_REVIEW` |
| T8-06 | `K` | `k` | `ACCEPT` |
| T8-07 | `İ` | `i` + 组合点 | `ACCEPT_WITH_FLAG → NEEDS_REVIEW` |
| T8-08 | `STRAßE` | `strasse` | `FLAG → NEEDS_REVIEW` |
| T8-09 | `ΟΣ` | `οσ` | `ACCEPT` |
| T8-10 | NBSP | `a b` | `ACCEPT` |
| T8-11 | ZWSP | 保留/检测 | `INVALID_INPUT`（§3.1） |
| T8-12 | 软连字符 | 保留/检测 | `NEEDS_REVIEW`（§3.2） |
| T8-13 | en dash | `a–b` | `ACCEPT`；≠ `a-b` |
| T8-14 | minus | `a−b` | `ACCEPT`；≠ `a-b` |
| T8-15 | combining acute | `é` | `ACCEPT` |
| T8-16 | Cyrillic `АBC` | `аbc` | `ACCEPT`；不转 Latin |

## 7. 未决与冻结条件

1. Owner 确认 §3 清单（尤其软连字符/变体选择符归类）；
2. 确认 `ACCEPT_WITH_FLAG` 是否永远不得自动 key；
3. 确认同形字符人工复核策略；
4. 确认 algorithm version 冻结值（当前 `b5-min-v0.1`）；
5. B5 冻结后 CAND-03 才可推进。

## 8. 非声明

- 本稿不是 B5 冻结、不是 CAND-03 批准；
- 未修改代码/测试；未运行项目测试；未创建模块。