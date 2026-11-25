# P0-2 D-C 决策与实施授权准备 · 索引

| 项 | 值 |
|---|---|
| 文档编号 | REVIEW-P02-DC-INDEX-20261125 |
| 版本 | v1.5（Owner Final Decision Round 已归档；F-01 已核对；Closure Pack 第一批） |
| 日期 | 2026-11-25（Asia/Shanghai） |
| 权威基线 | `feat/gate6a-audit@5dcecd21a9bf3f7f7046cc8c769fcfbcd2adf1e5` |
| 设计准备提交 | `10343388d55b79265478be50ba94021ebba53433` |
| Owner 决策状态 | **`OWNER_DECISION_ACCEPTED`**（架构建议已接受；契约未全部冻结） |
| 本轮性质 | Owner Decision Documentation + Contract Freeze Preparation（**非代码实施**） |
| 实施授权 | **`NOT_GRANTED`**（待 Owner 最终签署） |

---

## 1. 本轮交付物

| 文件 | 用途 | 状态 |
|---|---|---|
| `D-C_OWNER_IDENTITY_DECISION.md` | D-C-01…D-C-07 + D-1…D-7 Owner 裁决记录 | `OWNER_DECISION_ACCEPTED`（含 Final Decision Record；Sign-off Pending） |
| `P0_2_IDENTITY_IMPLEMENTATION_SCOPE_PROPOSAL.md` | 最小实施范围与验收/测试/迁移提案（v1.2） | 提案（未获批；首期范围已收窄、不含 API） |
| `P0_2_IMPLEMENTATION_AUTHORIZATION_REQUEST.md` | 可供 Owner 签署的授权申请（v1.2） | `NOT_GRANTED`（待最终签署） |
| `P0_2_OWNER_DECISION_EVIDENCE_PACKET.md` | 7 项授权前决策的证据、选项与建议 | 证据包（决策已归档） |
| `P0_2_OWNER_FINAL_DECISION_GUIDE.md` | D-1…D-7 逐项业务含义、选项、风险、验证计划 | 已归档 Owner 方向；技术项 `OPEN`/`NOT_READY` |
| `P0_2_OWNER_FINAL_DECISION_MATRIX.md` | 可填写最终决策矩阵（15 字段/项） | 已归档 Owner 决定；姓名/签署/日期待补 |
| `P0_2_IMPLEMENTATION_PRECONDITION_CHECKLIST.md` | 实施授权前置条件（MUST_CLOSE / CAN_DEFER） | 核对清单（未授权；P-01…P-11 未关闭） |
| `DECISION_INDEX.md` | 本索引 | — |
| `SHA256SUMS` | 上述文档哈希 | — |

---

## 2. 上游引用

| 项 | 位置 |
|---|---|
| 身份设计候选 | `reviewer/p0_2_design_preparation_20261125/PRODUCT_IDENTITY_AND_GLOBAL_ID_DESIGN.md`（`@1034338`） |
| 后端数据模型设计 | `reviewer/p0_2_design_preparation_20261125/BACKEND_DATA_MODEL_AND_MIGRATION_DESIGN.md`（`@1034338`） |
| 证据产物规范 | `reviewer/p0_2_design_preparation_20261125/PARSER_EVIDENCE_ARTIFACT_SPEC.md`（`@1034338`） |
| D-A 基线决策 | `reviewer/p0_2_design_preparation_20261125/OWNER_DECISION_D-A_BASELINE.md`（`@1034338`） |
| D-J 设计期授权 | `reviewer/p0_2_design_preparation_20261125/OWNER_DECISION_D-J_DESIGN_ONLY_AUTHORIZATION.md`（`@1034338`） |
| D-B 结论归档 | `E:\workspace\_p0_2_revalidation_20261125\REVIEWER_D_B_CONCLUSION_ARCHIVE_20261125.md`，SHA-256 `CD4473F6CF4A8EE1B893BF3423B4241958CFE951653FDE18C5904AA430231562` |

---

## 3. 关键状态

| 项 | 状态 |
|---|---|
| D-C 设计方向 | **`OWNER_DECISION_ACCEPTED`**（架构建议已接受） |
| Owner Final Decision Round | **D-1…D-7 已归档（`OWNER_DECIDED` 原则/方向）；Sign-off Pending** |
| 首期范围 | **内部产品身份 + 最小租户内 Catalog；不含 Business API / B8 summary / 原始 evidence API / `/evidence`** |
| D-B 结论 | `ACCEPT_D_B_FAIL_RESULT`（已完成并审查，结果 FAIL） |
| IQ-01 解释 | **`OWNER_INTERPRETED`**：禁止外部全局注册服务、允许内部 Product Identity Table；**签署仍 PENDING** |
| DB engine / version / charset | **MySQL / 8.4 LTS / `utf8mb4`**（Owner 已选）；Collation 首选 `utf8mb4_0900_as_cs`，技术 `NOT_READY` |
| 身份契约 | `MPN+Brand` 业务身份；`product_uid` 技术主键；`identity_scope` 首期不入键；`pbk` 方向已定、精确规范 `OPEN`、**未冻结** |
| Tenant / Product Catalog | 首期严格隔离，默认禁止跨租户共享；最小内部 Catalog 方向已接受，概念模型 `OPEN` |
| B8 | 首期 **no-summary / no-raw / 无 `/evidence`**；summary 白名单 `OPEN`（Phase 2） |
| CRLF | 历史快照保持；未来另批 LF 新快照（`OPEN`） |
| 实施授权 | **`NOT_GRANTED`**（待 Owner 最终签署） |

### 3.1 仍未冻结 / `OPEN`（阻断契约 `FROZEN`）

- Collation 实例验证（首选候选已定，`NOT_READY`）；
- B5 完整规范化规则与**测试向量**（未齐全）；
- `pbk` 精确规范/冻结；
- Product Catalog 首期概念模型；
- B8 summary 白名单（Phase 2）；
- 跨租户共享模型；
- CRLF 新快照批次。

---

## 4. 状态门槛（只读快照，未变更）

| 状态 | 值 |
|---|---|
| P0-2 | `BLOCKED` |
| C2 | `FAIL` |
| Business API Approval | `NOT_APPROVED` |
| Contract Freeze | `NOT_READY` |
| Backend Architecture Acceptance | `NO` |
| 75-item authorization | `0/75` |
| Production / READY | `NO` |

---

## 5. 归档复核状态（F-01 已核对）

| 项 | 值 |
|---|---|
| 归档提交 | `ffc09e1`（`docs(p0-2): archive owner final decision round`） |
| 变更文件 | 8 = 7 个正文文档 + `SHA256SUMS` |
| SHA256SUMS 条目 | 8 条正文文档（含本轮未变更的 `P0_2_OWNER_DECISION_EVIDENCE_PACKET.md`）；**排除自身** |
| 工作区校验 | 8/8 OK |
| 提交 blob（LF）校验 | 8/8 OK（与工作区同一 8 条集合） |
| F-01 | **非阻塞澄清项，已关闭**（两组“8”分别指“变更文件数（7 正文+清单）”与“清单校验条目数（8 正文文档）”） |
| 归档复核建议 | `ACCEPT_ARCHIVE_WITH_NON_BLOCKING_ITEMS`（**仅关闭归档复核**；不关闭 P0-2/C2/Contract Freeze/实施授权） |

**`ffc09e1` 变更的 7 个正文文档**：`D-C_OWNER_IDENTITY_DECISION.md`、`DECISION_INDEX.md`、`P0_2_IDENTITY_IMPLEMENTATION_SCOPE_PROPOSAL.md`、`P0_2_IMPLEMENTATION_AUTHORIZATION_REQUEST.md`、`P0_2_IMPLEMENTATION_PRECONDITION_CHECKLIST.md`、`P0_2_OWNER_FINAL_DECISION_GUIDE.md`、`P0_2_OWNER_FINAL_DECISION_MATRIX.md`。

**`SHA256SUMS` 覆盖的 8 条**：上述 7 个 + `P0_2_OWNER_DECISION_EVIDENCE_PACKET.md`（`ffc09e1` 中未变更）；**不含 `SHA256SUMS` 自身**。`8/8 OK` 的分母 = 这 8 条正文文档，不是变更文件数。

**更正说明（erratum）**：此前会话报告中出现的“6 个正文文档 + `SHA256SUMS` = 8 个变更路径”为笔误；正确为 **7 个正文文档 + `SHA256SUMS` = 8 个变更路径**。本记录以 **7** 为准。

---

## 6. 边界

- 本轮仅文档；未实施代码、未执行 DDL、未改 API/OAuth/Contract。
- 未修改原始证据包；未触碰 `stash@{0}`；未合并、未部署。
- 未伪造 Owner 签名、时间戳或外部签署件。

---

## 7. Decision Closure Pack · 第一批

目录：`closure_pack_01/`（自带 `SHA256SUMS`）。

| 项 | 状态 |
|---|---|
| DC-01 IQ-01 解释 | `OWNER_INTERPRETED` |
| DC-01 IQ-01 正式签署 | **`PENDING`**（签署人/日期/方式待 Owner 指定） |
| DC-01 IQ-01 独立验收 | **`NOT_TESTED`** |
| DC-02 IQ-15 值 | `OWNER_SELECTED`（MySQL / 8.4 LTS / `utf8mb4` / Collation 候选 `utf8mb4_0900_as_cs`） |
| DC-02 IQ-15 正式登记 | **`PENDING`**（登记行仍空，缺失字段已列明） |
| DC-02 IQ-15 技术验证（隔离实例） | `PASS` |
| DC-02 IQ-15 生产验证 | **`NOT_TESTED`** |
| DC-03 D-1 隔离测试套件 | **`PARTIAL`**（A.1–A.4/A.6 PASS；A.5 回滚双向 PARTIAL） |
| DC-03 D-1 生产 Collation 验证 | **`NOT_TESTED`** |

- D-1 细分：`D1_COLLATION_BEHAVIOR_TEST=PASS`、`D1_COMPOSITE_INDEX_TEST=PASS`、`D1_INDEX_USAGE_TEST=PASS`、`D1_TRANSACTION_ROLLBACK_TEST=PARTIAL`、`D1_ISOLATED_TEST_SUITE=PARTIAL`、`D1_PRODUCTION_VALIDATION=NOT_TESTED`。

- 测试实例：MySQL Community Server 8.4.13，`127.0.0.1:3317`，独立 datadir、专用库 `p02_collation_test`；测试后已关闭。
- 证据：`closure_pack_01/dc03_collation_test.sql`、`dc03_collation_output.txt`、`DC-03_D1_COLLATION_TEST_SPEC.md`、`DC-03_D1_COLLATION_TEST_RESULTS.md`。
- 本批**未**关闭 P-01…P-11；**未**新增 `FROZEN`；`IMPLEMENTATION_AUTHORIZATION = NOT_GRANTED`。
