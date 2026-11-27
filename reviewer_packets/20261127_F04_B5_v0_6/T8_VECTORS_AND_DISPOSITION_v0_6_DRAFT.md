# T8 / 空白向量与处置（v0.6-DRAFT）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-B5-T8-002 |
| 版本 | v0.6-DRAFT |
| 日期 | 2026-11-27 |
| 状态 | **DRAFT — NOT_FROZEN — NOT_APPROVED** |
| 依据 | 47_ 输入向量；48_ OD-47-01…05；OD72 #3 / #3a；51_ §5；52_ §1.2 |
| 参考计算 | 执行方按 `B5_MINIMAL_NORMALIZATION_RULES_v0_6_DRAFT.md` §2 编写的参考实现；Python 3.12.16 / Unicode 15.0.0；**不是项目测试执行** |

## 1. 口径

- “处置”= 规则判定类别；“B5 状态”= §2 输出（`OK` 表示进入 Stage D/E 前无 Unicode 命中）。
- `FLAG` 与 `ACCEPT_WITH_FLAG` 一律 `NEEDS_REVIEW`，不生成 Key（50_ OD-49-02）。
- 幂等列：对输出再次执行 §2 得到相同结果。

## 2. T8 向量

| ID | 输入（repr） | 处置 | 处置依据 | 参考结果 | 幂等 | 与预期 |
|---|---|---|---|---|---|---|
| T8-01 | `'ＡＢＣ－１２３'` | ACCEPT | OD-47-01 | OK `'abc-123'` | 是 | 一致 |
| T8-02 | `'ＡＢＣ\u3000１２３'` | ACCEPT | OD-47-01 | OK `'abc 123'` | 是 | 一致 |
| T8-03 | `'①②③'` | FLAG → NEEDS_REVIEW | OD-47-02 | NEEDS_REVIEW（诊断 `'123'`） | 是 | 一致 |
| T8-04 | `'ABC²'` | FLAG → NEEDS_REVIEW | OD-47-02 | NEEDS_REVIEW（诊断 `'abc2'`） | 是 | 一致 |
| T8-05 | `'ﬁle'` | FLAG → NEEDS_REVIEW | OD-47-02 | NEEDS_REVIEW（诊断 `'file'`） | 是 | 一致 |
| T8-06 | `'\u212a'`（K） | **ACCEPT** | **OD72 #3a**（此前无 48_ 裁定） | OK `'k'` | 是 | 一致 |
| T8-07 | `'İ'` | **ACCEPT_WITH_FLAG → NEEDS_REVIEW** | OD-47-03a；OD72 #3（47_ 标签 `FLAG` 更正） | NEEDS_REVIEW（诊断 `'i\u0307'`） | 是 | 一致 |
| T8-08 | `'STRAßE'` | FLAG → NEEDS_REVIEW | OD-47-03 | NEEDS_REVIEW（诊断 `'strasse'`） | 是 | 一致 |
| T8-09 | `'ΟΣ'` | **ACCEPT** | **OD72 #3a**（此前无 48_ 裁定） | OK `'οσ'` | 是 | 一致 |
| T8-10 | `'A\xa0B'` | ACCEPT | OD-47-01 | OK `'a b'` | 是 | 一致 |
| T8-11 | `'A\u200bB'` | **INVALID_INPUT** | OD-47-04；OD72 #3（47_ “保留”作废） | INVALID_INPUT | — | 一致 |
| T8-12 | `'A\xadB'` | **NEEDS_REVIEW** | OD-47-04；OD72 #3（47_ “保留”作废） | NEEDS_REVIEW | 是 | 一致 |
| T8-13 | `'A\u2013B'` | ACCEPT；≠ `a-b` | 48_ 补充 | OK `'a\u2013b'` | 是 | 一致 |
| T8-14 | `'A\u2212B'` | ACCEPT；≠ `a-b` | 48_ 补充 | OK `'a\u2212b'` | 是 | 一致 |
| T8-15 | `'e\u0301'` | **ACCEPT** | **OD72 #3a**（此前无 48_ 裁定） | OK `'\xe9'` | 是 | 一致 |
| T8-16 | `'\u0410BC'` | ACCEPT；不转 Latin | OD-47-05 | OK `'\u0430bc'` | 是 | 一致 |

## 3. 空白向量

| ID | 输入（repr） | 预期（51_/52_） | 参考结果 | 与预期 |
|---|---|---|---|---|
| WS-01 | `'\tABC\n'` | `'abc'` | OK `'abc'` | 一致 |
| WS-02 | `'A\t \r\n B'` | `'a b'` | OK `'a b'` | 一致 |
| WS-03 | `'A\xa0B'` | `'a b'` | OK `'a b'` | 一致 |
| WS-04 | `'A\u3000B'` | `'a b'` | OK `'a b'` | 一致 |
| WS-05 | `'A\u2028B'` | `'a b'` | OK `'a b'` | 一致 |
| WS-06 | `'A\u205fB'` | `'a b'` | OK `'a b'` | 一致 |
| WS-07 | `'   '` | INVALID_INPUT | INVALID_INPUT | 一致 |
| WS-08 | `'A\u200bB'` | INVALID_INPUT | INVALID_INPUT | 一致 |
| WS-09 | `'A\x0bB'` | INVALID_INPUT | INVALID_INPUT | 一致 |
| WS-10 | `'A\x85B'` | INVALID_INPUT | INVALID_INPUT | 一致 |
| WS-11 | `'A\xadB'` | NEEDS_REVIEW | NEEDS_REVIEW | 一致 |
| WS-12 | `'Ａ\u3000Ｂ'` | `'a b'` | OK `'a b'` | 一致 |
| WS-13 | `'A     B'` | `'a b'` | OK `'a b'` | 一致 |
| WS-14 | `'  A B  '` | `'a b'` | OK `'a b'` | 一致 |
| WS-15 | `'A\u2000B'` | `'a b'` | OK `'a b'` | 一致 |
| WS-15A | `'\t\n\r\xa0\u3000'` | INVALID_INPUT | INVALID_INPUT | 一致 |
| WS-15B | `'\u2000\u2028\u3000'` | INVALID_INPUT | INVALID_INPUT | 一致 |
| WS-15C | `'\u200b'` | INVALID_INPUT | INVALID_INPUT | 一致 |

合计 34 项：与预期一致 34，不一致 0。

## 4. 限制

1. 参考实现是执行方为验证 §2 文本而写的计算，**不是项目代码，也不是项目测试**；
2. 计算环境 Unicode 15.0.0，与 47_ 的 15.1.0 不同；正式测试须在项目环境复算；
3. T8-03/04/05/07/08 的 NEEDS_REVIEW 由 B5 v0.6 §2.2 最后两行判定机制产生，该机制须 Reviewer 复核；
4. 本文件不构成 T8 冻结；T8 冻结须 Owner 单独签字。
