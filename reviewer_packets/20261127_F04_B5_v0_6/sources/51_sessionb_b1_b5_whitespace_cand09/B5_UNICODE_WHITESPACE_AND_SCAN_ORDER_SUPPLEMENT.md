# B5 Unicode 空白与处理顺序补充（v0.2-R3 补充稿）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-B5-WS-001 |
| 版本 | v0.2-R3-SUPPLEMENT-DRAFT |
| 日期 | 2026-11-26 |
| 状态 | **DRAFT — NOT_FROZEN — NOT_APPROVED** |
| 性质 | 对 50_ B5 v0.2-R2 的补充修订；不是 B5 冻结 |
| 算法版本 | `b5-min-v0.1`（暂保留，OD-49-04） |

## 1. 目的

精确化 B5 的 Unicode 空白规则与处理顺序，避免“常用空白”这类开放措辞，并确保原始输入证据在规范化前被记录。

## 2. 处理顺序（强制）

1. 输入类型校验：必须为字符串；否则 `INVALID_INPUT`。
2. **原始输入扫描（任何规范化之前）**：
   - 扫描禁止/特殊 code point（§3、§4）；
   - 记录原始码点与位置，用于状态判定与证据；
   - 若命中 `INVALID_INPUT` 类 → 停止，不进行 NFKC、不生成 key。
3. 标记 `NEEDS_REVIEW` 类（如 FLAG/不可见/`ACCEPT_WITH_FLAG`）；可继续计算诊断值，但不得生成 key。
4. `NFKC` 规范化。
5. 使用**显式允许空白集合**（§3.1）在 NFKC 输出上：
   - 去除首尾允许空白；
   - 内部连续允许空白折叠为单个 ASCII 空格 U+0020；
   - 若结果为空 → `INVALID_INPUT`。
6. 对 NFKC 输出再次扫描禁止/特殊码点；若新出现，按 §3/§4 处理。
7. `casefold()` 生成 `*_norm`。
8. 只有 `RESOLVED` 生成 business key。

> 不得仅使用 Python `str.isspace()` / `str.split()` 作为空白判据；它们可能把未列出的字符当作空白，必须使用显式集合。

## 3. 空白字符精确清单

### 3.1 允许的空白（统一折叠为 U+0020）

| Code point | 名称 |
|---|---|
| U+0009 | CHARACTER TABULATION |
| U+000A | LINE FEED |
| U+000D | CARRIAGE RETURN |
| U+0020 | SPACE |
| U+00A0 | NO-BREAK SPACE |
| U+1680 | OGHAM SPACE MARK |
| U+2000 | EN QUAD |
| U+2001 | EM QUAD |
| U+2002 | EN SPACE |
| U+2003 | EM SPACE |
| U+2004 | THREE-PER-EM SPACE |
| U+2005 | FOUR-PER-EM SPACE |
| U+2006 | SIX-PER-EM SPACE |
| U+2007 | FIGURE SPACE |
| U+2008 | PUNCTUATION SPACE |
| U+2009 | THIN SPACE |
| U+200A | HAIR SPACE |
| U+2028 | LINE SEPARATOR |
| U+2029 | PARAGRAPH SEPARATOR |
| U+202F | NARROW NO-BREAK SPACE |
| U+205F | MEDIUM MATHEMATICAL SPACE |
| U+3000 | IDEOGRAPHIC SPACE |

### 3.2 明确**不是**允许空白

| Code point | 名称 | 处置 |
|---|---|---|
| U+000B | LINE TABULATION | `INVALID_INPUT` |
| U+000C | FORM FEED | `INVALID_INPUT` |
| U+0085 | NEXT LINE (NEL) | `INVALID_INPUT`（C1） |
| U+180E | MONGOLIAN VOWEL SEPARATOR | `INVALID_INPUT` |
| U+200B–U+200F | ZWSP/ZWNJ/ZWJ/LRM/RLM | `INVALID_INPUT` |
| U+2060–U+2064 | word joiner/invisible operators | `INVALID_INPUT` |
| U+2066–U+2069 | bidi isolates | `INVALID_INPUT` |
| U+FEFF | BOM/ZWNBSP | `INVALID_INPUT` |
| U+00AD | SOFT HYPHEN | `NEEDS_REVIEW`（不是空白） |

> U+200B–U+200F 虽可能被某些语言库视为“空白”，本规则**不得**将其当普通空白。

## 4. 与其他特殊码点的关系

- 50_ B5 v0.2-R2 §3.1/§3.2 的禁止/复核清单继续适用；
- 空白处理仅作用于 §3.1 集合；其他 `Cf` 按 §3.2 / B5 原规则处理；
- `ACCEPT_WITH_FLAG` 仍一律 `NEEDS_REVIEW`，不得生成 key。

## 5. 空白测试向量

| # | 输入（repr） | 预期 |
|---|---|---|
| WS-01 | `'\tABC\n'` | `'abc'` |
| WS-02 | `'A\t \r\n B'` | `'a b'` |
| WS-03 | `'A\xa0B'` | `'a b'` |
| WS-04 | `'A\u3000B'` | `'a b'` |
| WS-05 | `'A\u2028B'` | `'a b'` |
| WS-06 | `'A\u205fB'` | `'a b'` |
| WS-07 | `'   '` | `INVALID_INPUT`（全空白） |
| WS-08 | `'A\u200bB'` | `INVALID_INPUT`（不是空白） |
| WS-09 | `'A\x0bB'` | `INVALID_INPUT` |
| WS-10 | `'A\x85B'` | `INVALID_INPUT` |
| WS-11 | `'A\xadB'` | `NEEDS_REVIEW`（软连字符） |
| WS-12 | `'Ａ　Ｂ'` | NFKC → `A B` → `a b` |
| WS-13 | `'A     B'` | `'a b'` |
| WS-14 | `'  A B  '` | `'a b'` |
| WS-15 | `'A\u2000B'` | `'a b'`（EN QUAD 允许） |

## 6. 冻结前仍需确认

1. 允许空白集合是否完整/是否需要排除 U+2028/U+2029（行/段分隔）；
2. U+0085 是否保持拒绝（当前是）；
3. 原始扫描的码点/位置记录格式；
4. `NFKC` 后的二次扫描是否保留（建议保留）；
5. 算法版本是否仍为 `b5-min-v0.1`。

## 7. 非声明

- 本补充稿不是 B5 冻结、不是 CAND-03 批准；
- 未修改代码/测试；未运行项目测试；未创建模块。