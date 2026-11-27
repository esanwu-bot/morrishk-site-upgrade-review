# T8 证据与决定追溯记录

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-T8-TRACE-001 |
| 版本 | v0.1-DRAFT |
| 日期 | 2026-11-26 |
| 状态 | **DRAFT — TRACEABILITY_RECORD — NOT_A_FREEZE** |
| 用途 | 修复 58_ BLK-4：T8 引用悬空；不是 T8 批准/冻结 |
| 依据 | 47_ T8 向量；48_ OD-47；50_/51_/52_/57_ |

## 1. 结论

- **T8 测试向量存在**：`47_/B5_T8_UNICODE_VECTORS_DRAFT.md`（DRAFT，未执行）；
- **T8 决定方向存在**：`48_/OWNER_DIRECTION_OD47_T8_FIELD_CONTRACT_CAND04.md` §1（OD-47-01…05，RECORDED Owner Direction）；
- **没有独立的、Owner 签署的 T8 冻结记录**；
- 51_/52_ **不包含 T8 向量**；57_ B5:84 的 T8 引用错误，应由 59_ B5 §6 修正；
- T8 状态：`OWNER_DIRECTION_RECORDED_NOT_FROZEN`；若要冻结 T8，需 `OWNER_DECISION_REQUIRED`，不得虚构批准。

## 2. 证据/决定清单

| 对象 | 路径 | 章节 | SHA-256 | 状态 |
|---|---|---|---|---|
| T8 向量 | `47_/B5_T8_UNICODE_VECTORS_DRAFT.md` | §2 T8 表、§3 待决 | `dfd8ca8d7628924399c6f9cfe313bd52b0451788a1dc4f149bff57fd29fa7e39` | DRAFT，未执行 |
| T8 方向 | `48_/OWNER_DIRECTION_OD47_T8_FIELD_CONTRACT_CAND04.md` | §1 OD-47-01…05 | `88d1ca30aea618f1e58a96660457f0c06f99745e661e3906dca58ae23e277253` | RECORDED Owner Direction |
| 历史 T8 表 | `50_/B5_MINIMAL_NORMALIZATION_RULES_v0_2_R2_DRAFT.md` | §6 | `c6aa632b93d225642e4a9b516801eda7e194c6038bc84457b8b6024531167340` | 历史草案 |
| 空白/扫描 | `51_/B5_UNICODE_WHITESPACE_AND_SCAN_ORDER_SUPPLEMENT.md` | 全文 | `46653c041a296f63e36d5bc16943d86777213147eb1d12029413deb5f33ca64c` | 无 T8 向量 |
| 诊断/NFKC | `52_/OD52_B5_WS_DIAGNOSTIC_POSTSCAN_CAND09_SUPPLEMENT.md` | 全文 | `a5a2dc8abd2d9ac025e1b98dc4bc99fe4503479ae66a4343d97dab34b3b42d35` | 无 T8 向量 |
| 错误引用 | `57_/B5_MINIMAL_NORMALIZATION_RULES_v0_4_DRAFT.md` | :84 | `0251b01344b84ffd9ce033a917fa1b3a4affd3340834e8e949a97a207fef64a7` | 引用 51_/52_ 的 T8 不成立 |
| 修正引用 | `59_/B5_MINIMAL_NORMALIZATION_RULES_v0_5_DRAFT.md` | §6 | 见 59_/SHA256SUMS | 改为 48_ §1 + 47_ 向量 |

## 3. T8 裁定映射（48_ §1）

| 编号 | 事项 | 裁定 |
|---|---|---|
| OD-47-01 | 全角/空白 | ACCEPT |
| OD-47-02 | NFKC 兼容字符 | FLAG |
| OD-47-03 | `ß→ss` | FLAG |
| OD-47-03a | `İ→i+组合点` | ACCEPT WITH FLAG |
| OD-47-04 | 不可见字符 | 拒绝/NEEDS_REVIEW |
| OD-47-05 | 同形字符 | 不自动转换 |

## 4. 限制

1. 47_ 向量的预期结果来自参考计算，未在项目测试中执行；
2. 48_ 是 RECORDED Owner Direction，不是独立签署/冻结件；
3. 无独立 T8 冻结/签字记录；不得据此声称 T8 已批准；
4. 59_ 只修正引用与承接规则，不改变 47_/48_ 的 DRAFT/记录状态。

## 5. 待 Owner 决定

1. 是否批准 T8 处置为冻结规则；
2. 是否需要独立的 T8 决定/签字记录；
3. 47_ 向量是否需先转为正式测试向量（本轮不执行）。

## 6. 非声明

- 本记录不是 T8 冻结/批准；
- 未修改 47_/48_/50_–58_ 或冻结包；
- 未运行测试；未修改代码。