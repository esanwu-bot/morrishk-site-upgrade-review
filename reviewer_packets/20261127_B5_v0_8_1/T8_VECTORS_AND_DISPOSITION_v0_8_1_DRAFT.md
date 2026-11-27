# T8 / M1 / M2 / 空白 / 幂等向量（v0.8.1-DRAFT）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-B5-T8-005 |
| 版本 | v0.8.1-DRAFT |
| 日期 | 2026-11-27 |
| 状态 | **DRAFT — NOT_FROZEN — NOT_APPROVED** |
| 算法版本 | **`b5-min-v0.2`** |
| 基线 | `75_/T8_VECTORS_AND_DISPOSITION_v0_8_DRAFT.md`（SHA-256 `43e333ab4a9982a31264f456dfa12e7da5890ad487cd7318b9ee77a4c799baf3`） |
| 正式测试基准 | **Python 3.13.15 / Unicode 15.1.0**（Owner 2026-11-27 15:14） |
| 验证脚本 | 同目录 `b5_v0_8_1_verify.py`（只读，仅打印结果） |

## 0. 相对 v0.8 的变更

1. 算法版本标注为 `b5-min-v0.2`；
2. 新增 §7：项目环境复算结果栏（待 Owner 本机运行后填入，执行方不预填）；
3. 新增 §8：Business Key 计算向量 KEY-01。

向量输入、处置与期望**均未变更**。`rule_version` 不参与 B5 归一化与状态判定，只进入 Business Key；故 T8 / 空白 / M1 / M2 / IDEM 共 53 项的期望值不因升版而改变。

## 1–5. 向量

与 v0.8 文件 §1–§5 相同：T8 16 项、空白 18 项、M1/M2 专项 14 项、幂等 IDEM 5 项，共 53 项。全部输入与期望已编入 `b5_v0_8_1_verify.py` 的 `VECTORS` / `IDEM`，可逐项对照。

## 6. 执行方参考计算（非项目测试）

| 环境 | 结果 |
|---|---|
| Python 3.12.16 / Unicode 15.0.0（执行方云端） | `VECTORS 53 / 53`；`EXHAUSTIVE_STRING_IDEMPOTENCY counterexamples 0` |

## 7. 项目环境复算（待填）

| 项 | 结果 |
|---|---|
| 运行命令 | `python b5_v0_8_1_verify.py` |
| 环境（脚本首行 `ENV` 输出） | 待填 |
| `VECTORS` | 待填（期望 `53 / 53`） |
| `EXHAUSTIVE_STRING_IDEMPOTENCY counterexamples` | 待填（期望 `0`） |
| `KEY_EXAMPLE` | 待填（期望与 §8 一致） |
| 运行人 / 时间 | 待填 |

> 本表由运行方据实填写；执行方不得预填项目环境结果。

## 8. Business Key 向量

| ID | `brand_norm` | `mpn_norm` | `rule_version` | 期望 Key |
|---|---|---|---|---|
| KEY-01 | `texas instruments` | `lm358dr` | `b5-min-v0.2` | `pbk1_e71ca20eeb028ce1450e733f3d162a97fb72adb45061dc5ba642fde0f70affaf` |

KEY-01 只依赖 canonical JSON 字节，在任何 Python / Unicode 版本下应相同。

## 9. 合计

| 组 | 项数 |
|---|---|
| T8 | 16 |
| 空白 | 18 |
| M1 / M2 专项 | 14 |
| 幂等 | 5 |
| **归一化向量合计** | **53** |
| Business Key | 1 |

## 10. 限制

1. §6 是执行方参考计算，不是项目测试；
2. §7 待项目环境运行后才构成正式测试证据；
3. 不构成 T8 冻结。
