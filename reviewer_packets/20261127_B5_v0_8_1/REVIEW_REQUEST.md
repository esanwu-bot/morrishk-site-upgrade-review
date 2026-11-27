# 独立 Reviewer 复核请求：B5 v0.8.1（2026-11-27）

| 项 | 值 |
|---|---|
| 状态 | **REVIEW_REQUESTED — 执行方自检完成，非 Reviewer 结论** |
| 对象 | B5 v0.8.1-DRAFT（算法版本 `b5-min-v0.2`）、向量 v0.8.1-DRAFT、验证脚本 |
| 原件 | `E:\workspace\.scratch\morrishk-owner-decision\76_sessionb_b1_b5_contract_r8\`（未跟踪；本目录为逐字节副本） |
| 触发 | Owner 2026-11-27 15:14 `OWNER_ACCEPTED`：算法版本升至 `b5-min-v0.2`；正式基准 Python 3.13.15 / Unicode 15.1.0 |
| 前序复核包 | `486242f`（B5 v0.8）；`e784034`（v0.7）；`8130120`（F-04 / v0.6） |
| 效力 | 不构成冻结、批准或授权 |

## 0. 内容

| 文件 | 说明 |
|---|---|
| `B5_MINIMAL_NORMALIZATION_RULES_v0_8_1_DRAFT.md` | v0.8.1：仅同步算法版本及引用位置 |
| `T8_VECTORS_AND_DISPOSITION_v0_8_1_DRAFT.md` | 53 项向量不变；新增 KEY-01 与项目环境结果栏 |
| `b5_v0_8_1_verify.py` | 只读验证脚本：53 项向量、全码点字符串幂等穷举、KEY-01 |
| `baseline_v0_8/` | v0.8 两个文件逐字节副本，便于 diff |
| `REVIEW_REQUEST.md` / `SHA256SUMS` | 本文件 / 校验清单 |

## 1. 请复核

1. v0.8 → v0.8.1 diff 是否仅为算法版本及其引用位置（§0 变更表），判定规则无变化；
2. 是否仍有遗漏的 `b5-min-v0.1` 引用；
3. §5.1 KEY-01：独立计算 canonical JSON 的 SHA-256，核对 `pbk1_e71ca20e…affaf`；
4. 在 Python 3.13.15 / Unicode 15.1.0 运行 `python b5_v0_8_1_verify.py`，核对 `VECTORS 53 / 53` 与穷举反例 0；
5. 脚本中 `VECTORS` / `IDEM` 是否与向量文件逐项一致；
6. 给出 B5 v0.8.1 结论（READY_FOR_FREEZE / NOT_READY_FOR_FREEZE）。

## 2. 执行方参考计算

Python 3.12.16 / Unicode 15.0.0：`VECTORS 53 / 53`；穷举反例 0；KEY-01 如上。非项目测试。

## 3. 已知未决项（不要求 Reviewer 裁定）

P2 批准；P2 排除期间处置；Brand 契约 B2 新版。
