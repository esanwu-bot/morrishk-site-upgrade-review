# T8 / M1 / M2 / 空白向量与处置（v0.7-DRAFT）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-B5-T8-003 |
| 版本 | v0.7-DRAFT |
| 日期 | 2026-11-27 |
| 状态 | **DRAFT — NOT_FROZEN — NOT_APPROVED** |
| 基线 | `73_/T8_VECTORS_AND_DISPOSITION_v0_6_DRAFT.md`（SHA-256 `765500b8aa0eceaf16d60a0eb294ebcc060e81de6ca360f31d1f519f67a80c24`） |
| 参考计算 | 执行方按 B5 v0.7 §2 编写的参考实现；Python 3.12.16 / Unicode 15.0.0；**不是项目测试执行** |

## 1. 口径

- “触发”列：`M1` = §2.2.4；`M2` = §2.2.3；`LIST` = §2.2.2 列名复核；`P5a` = §2.2.1 硬拒绝；`—` = 无命中。
- “OK” 表示 Unicode 阶段无命中，可进入 Stage D / E。

## 2. T8 向量（与 v0.6 处置相同，新增触发列）

| ID | 输入（repr） | 处置 | 参考结果 | 触发 | 幂等 | 与预期 |
|---|---|---|---|---|---|---|
| T8-01 | `'ＡＢＣ－１２３'` | ACCEPT | OK `'abc-123'` | —（E2 豁免） | 是 | 一致 |
| T8-02 | `'ＡＢＣ\u3000１２３'` | ACCEPT | OK `'abc 123'` | —（E2 豁免） | 是 | 一致 |
| T8-03 | `'①②③'` | FLAG → NEEDS_REVIEW | NEEDS_REVIEW `'123'` | M2 | 是 | 一致 |
| T8-04 | `'ABC²'` | FLAG → NEEDS_REVIEW | NEEDS_REVIEW `'abc2'` | M2 | 是 | 一致 |
| T8-05 | `'ﬁle'` | FLAG → NEEDS_REVIEW | NEEDS_REVIEW `'file'` | M2 | 是 | 一致 |
| T8-06 | `'\u212a'` | ACCEPT | OK `'k'` | —（规范等价，不触发 M2） | 是 | 一致 |
| T8-07 | `'İ'` | ACCEPT_WITH_FLAG → NEEDS_REVIEW | NEEDS_REVIEW `'i\u0307'` | M1 | 是 | 一致 |
| T8-08 | `'STRAßE'` | FLAG → NEEDS_REVIEW | NEEDS_REVIEW `'strasse'` | M1 | 是 | 一致 |
| T8-09 | `'ΟΣ'` | ACCEPT | OK `'οσ'` | — | 是 | 一致 |
| T8-10 | `'A\xa0B'` | ACCEPT | OK `'a b'` | —（E2 豁免） | 是 | 一致 |
| T8-11 | `'A\u200bB'` | INVALID_INPUT | INVALID_INPUT | P5a | — | 一致 |
| T8-12 | `'A\xadB'` | NEEDS_REVIEW | NEEDS_REVIEW `'a\xadb'` | LIST | 是 | 一致 |
| T8-13 | `'A\u2013B'` | ACCEPT | OK `'a\u2013b'` | — | 是 | 一致 |
| T8-14 | `'A\u2212B'` | ACCEPT | OK `'a\u2212b'` | — | 是 | 一致 |
| T8-15 | `'e\u0301'` | ACCEPT | OK `'\xe9'` | — | 是 | 一致 |
| T8-16 | `'\u0410BC'` | ACCEPT | OK `'\u0430bc'` | — | 是 | 一致 |

## 3. 空白向量

WS-01…WS-15、WS-15A/B/C 共 18 项，输入、预期与参考结果同 v0.6 §3（18/18 一致）。v0.7 未改变空白规则；M2 对 §2.3 允许空白豁免，故不改变任何空白向量结果。

## 4. M1 / M2 专项向量（v0.7 新增）

| ID | 输入（repr） | 名称 | 预期 | 参考结果 | 触发 | 幂等 | 用途 |
|---|---|---|---|---|---|---|---|
| M1-01 | `'\u1e9e'` | ẞ LATIN CAPITAL SHARP S | NEEDS_REVIEW | NEEDS_REVIEW `'ss'` | M1 | 是 | 大写 ß 同样展开 |
| M1-02 | `'\u1fb3'` | ᾳ GREEK ALPHA WITH YPOGEGRAMMENI | NEEDS_REVIEW | NEEDS_REVIEW `'αι'` | M1 | 是 | 非拉丁展开 |
| M1-03 | `'\u03c2'` | ς GREEK FINAL SIGMA | OK | OK `'σ'` | — | 是 | 一对一折叠不触发 |
| M1-04 | `'STRASSE'` | ASCII 对照 | OK | OK `'strasse'` | — | 是 | 与 T8-08 诊断值相同，但不触发；证明“诊断值相同 ≠ 同一身份” |
| M1-05 | `'\u0149'` | ŉ N PRECEDED BY APOSTROPHE | NEEDS_REVIEW | NEEDS_REVIEW `'ʼn'` | M2 | 是 | 兼容分解先由 M2 捕获 |
| M2-01 | `'\ufb00'` | ﬀ LIGATURE FF | NEEDS_REVIEW | NEEDS_REVIEW `'ff'` | M2 | 是 | 另一连字 |
| M2-02 | `'\uff71'` | ｱ HALFWIDTH KATAKANA A | NEEDS_REVIEW | NEEDS_REVIEW `'ア'` | M2 | 是 | 半角片假名不在 E2 |
| M2-03 | `'\u210c'` | ℌ BLACK-LETTER CAPITAL H | NEEDS_REVIEW | NEEDS_REVIEW `'h'` | M2 | 是 | `<font>` 分解 |
| M2-04 | `'\u2126'` | Ω OHM SIGN | OK | OK `'ω'` | — | 是 | 规范等价不触发 M2 |
| M2-05 | `'\u00c5'` | Å LATIN CAPITAL A WITH RING | OK | OK `'å'` | — | 是 | 普通字母对照 |
| M2-06 | `'\u212b'` | Å ANGSTROM SIGN | OK | OK `'å'` | — | 是 | 规范等价不触发；与 M2-05 结果相同 |
| M2-07 | `'A\u2028B'` | LINE SEPARATOR | OK | OK `'a b'` | — | 是 | 允许空白在 E2 豁免 |
| M2-08 | `'\u00bd'` | ½ VULGAR FRACTION ONE HALF | NEEDS_REVIEW | NEEDS_REVIEW `'1⁄2'` | M2 | 是 | `<fraction>` 分解 |
| M2-09 | `'\uff5e'` | ～ FULLWIDTH TILDE | OK | OK `'~'` | — | 是 | E2 豁免上界 U+FF5E |

## 5. 合计

| 组 | 项数 | 与预期一致 |
|---|---|---|
| T8 | 16 | 16 |
| 空白 | 18 | 18 |
| M1 / M2 专项 | 14 | 14 |
| **合计** | **48** | **48** |

## 6. 限制

1. 参考实现不是项目代码，不是项目测试；
2. Unicode 15.0.0 与 47_ 的 15.1.0 不同；正式测试须在项目环境复算并记录版本；
3. M2-06 / T8-06 / M2-04 的“不触发”依赖规范分解与兼容分解的区分；若项目实现改用整串比较，结果可能不同（§2.2.5 禁止）；
4. 本文件不构成 T8 冻结。
