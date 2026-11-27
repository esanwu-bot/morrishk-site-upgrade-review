# Owner 决定对齐矩阵

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-OWNER-ALIGN-001 |
| 版本 | v0.1-DRAFT |
| 日期 | 2026-11-26 |
| 状态 | **DRAFT — NOT_APPROVED** |
| 用途 | 区分 Owner 决定权威与技术草案效力；不是授权、不是冻结 |
| 依据 | 58_ BLK-3；41_/44_/45_/46_/48_ |

## 1. 原则

1. **技术草案不能自动撤销 Owner 决定**；
2. Owner 决定在其范围内继续有效，除非新 Owner 决定明确修改；
3. 59_ 只细化技术规则，不改变 P 项/Gate/B-1 状态；
4. 任何对 Owner 决定的变更 → `OWNER_DECISION_REQUIRED`。

## 2. 已记录 Owner 决定 / 方向

| 记录 | 文件 | 范围 | 状态 | 59_ 处理 |
|---|---|---|---|---|
| P-02/P-15 关闭 | `41_/OWNER_DECISION_P02_P15_CLOSURE.md` | P-02/P-15 关闭事实 | **ACTIVE** | 不改变 |
| P-11 准备窗口 | `44_/OWNER_DECISION_OD-B1-P11-PREPARATION-01.md` | 2026-11-26—2026-12-03；仅准备 | **ACTIVE** | 不改变；59_ 在窗口内 |
| P-05 路径 / P-06 评审授权 | `45_/OWNER_DECISION_P05_PATH_P06_REVIEW.md` | 路径原则接受；P-06 技术评审；不创建 worktree | **ACTIVE** | 不改变；P-05/P-06 仍 OPEN |
| B5/P-06 技术方向 | `46_/OWNER_DECISION_TECH_DIRECTION_ACCEPTANCE.md` | Brand 显式、pipeline 快照、确定性 ID、B5 最小规则、模块命名 | **ACTIVE** | 在其内细化；不改变 |
| OD-47-01…10 | `48_/OWNER_DIRECTION_OD47_T8_FIELD_CONTRACT_CAND04.md` | T8、ProductIdentity、Business Key、CAND-04/08 | **ACTIVE** | 在其内细化；P2 为新增 PROPOSED，需 Owner 批准 |

## 3. OD-49 记录缺口

| 项 | 发现 |
|---|---|
| OD-49-01…08 | 仅以引用形式出现在 `50_`、`51_`、`54_`；**未找到独立 Owner Decision 记录文件** |
| 结论 | `TRACEABILITY_GAP — OWNER_DECISION_REQUIRED` |
| 59_ 处理 | 不声称 OD-49 已签署/已冻结；不复述为独立权威；如需独立记录，请 Owner 出具 |

## 4. 非 Owner 记录

| 文档 | 性质 | 效力 |
|---|---|---|
| 54_/56_/58_ | 独立/复核报告 | 证据/建议，不是 Owner 决定 |
| 49_/50_/51_/52_/53_/55_/57_/59_ | 技术草案/修订 | DRAFT；不替代 Owner 决定 |

## 5. 冲突处理

| 情形 | 处理 |
|---|---|
| 59_ 技术文本与 Owner 决定冲突 | **Owner 决定优先** |
| 需要改变 45_/46_/48_ 的范围 | `OWNER_DECISION_REQUIRED` |
| 需要改变 P-02/P-15/P-11 状态 | `OWNER_DECISION_REQUIRED` |
| 需要改变 CAND-04/08 处置 | 48_ 已定；变更需 Owner |
| 需要批准 P2（`BRAND_TRUST_INVALID → PENDING_BRAND`） | `OWNER_DECISION_REQUIRED`（当前 PROPOSED） |
| OD-49 独立记录 | `OWNER_DECISION_REQUIRED` |

## 6. 非声明

- 本矩阵不是授权、不是冻结；
- 未修改 41_/44_/45_/46_/48_ 或任何冻结包；
- 未修改代码/测试；未运行测试。