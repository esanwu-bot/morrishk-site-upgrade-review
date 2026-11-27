# 独立 Reviewer 复核请求：B5 v0.8.2（2026-11-27）

| 项 | 值 |
|---|---|
| 状态 | **REVIEW_REQUESTED — 执行方自检完成，非 Reviewer 结论** |
| 对象 | 验证脚本 `b5_v0_8_2_verify.py`；修订说明（B5-REV-04/05/06 处置及 Owner 环境运行转录） |
| 规范正文 | 不变，仍为 commit `7ad5941` 中 `20261127_B5_v0_8_1/B5_MINIMAL_NORMALIZATION_RULES_v0_8_1_DRAFT.md` |
| 原件 | `E:\workspace\.scratch\morrishk-owner-decision\77_sessionb_b1_b5_contract_r9\`（未跟踪；本目录为逐字节副本） |
| 效力 | 不构成冻结、批准或授权 |

## 1. 请复核

1. B5-REV-04：G1 环境强制、G4 KEY-01 比对、非零退出码、G2 触发集合断言是否到位；覆盖声明（不断言位置；仅 Unicode 阶段）是否可接受；
2. 脚本 `VECTORS` / `IDEM` 中新增的触发期望是否与规范 §2.2 一致；状态与 `diagnostic_norm` 期望是否与 v0.8.1 完全相同；
3. B5-REV-05：修订说明 §3 的变更描述是否准确；
4. B5-REV-06：对 `20261127_B5_v0_8_1/` 与本目录分别运行 `sha256sum -c SHA256SUMS`；
5. 在 Python 3.13.15 / Unicode 15.1.0 运行 `python b5_v0_8_2_verify.py`，核对 `RESULT PASS (exit 0)` 与退出码 0；
6. 给出 B5 v0.8.1 + v0.8.2 结论（READY_FOR_FREEZE / NOT_READY_FOR_FREEZE）。

## 2. 已知未决项（不要求 Reviewer 裁定）

P2 批准；P2 排除期间处置；Brand 契约 B2 新版。
