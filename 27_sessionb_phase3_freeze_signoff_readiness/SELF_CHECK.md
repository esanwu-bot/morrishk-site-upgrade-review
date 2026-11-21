# SELF CHECK · Phase 3 决策与签署准备包独立验证清单与真实执行记录

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE3-CHK-001 |
| 版本 | v1.0 |
| 日期 | 2026-11-21 |
| 执行方式 | `node tools/self_check.js`（只读；数据源 = 本包文档 + `12_`/`14_`/`16_`/`25_`/`26_` 权威与已审核材料） |
| 性质 | 真实执行记录（RUN）；行级/单元格级/跨文件语义验证 + 越权断言谓词与反例，非字符串计数 |
| 声明 | 自检通过 ≠ Reviewer 审核通过 |

## 1. 检查项清单

| 组 | 检查内容 |
|---|---|
| C-1 | 10 个交付文件完整（9 文档 + `tools/self_check.js`） |
| C-2 | DECISION_REGISTER 登记全部 16 个 ID（DIFF×4 / IQ×7 / B×4 / P0-2）为表格行；ID 在七份文档全覆盖 |
| C-3 | 状态一致性（与权威登记逐项一致）：DIFF-CONTRACT-01/03 = PENDING；DIFF-MOCK-05/11 = OPEN；IQ-01/02/13 = DECIDED + 待签署 + 未验收；IQ-05/09/15/21 = OPEN；B5 = PROPOSED、B6/B8 = OPEN、B7 = 待 PM、P0-2 = DECISION_REQUIRED；跨文件核验 `14_/DECISION_REGISTER.md` 仍为 3/7 裁定、4/7 未裁、三项待签署 |
| C-4 | Scope 授权口径跨文件核验：26_ 矩阵 candidate=75 / formal-executable=0 / pending=75；Registry R-OA-05 = PROPOSED；本包 readiness 文档声明 75/75、0/75、0/75、75/75 且载明禁止把候选当已批准 |
| C-5 | Freeze Gate：NOT_READY / CANDIDATE_NOT_FROZEN / NOT_APPROVED 在册；G1..G6 全登记；无冻结记录；拒绝自宣 |
| C-6 | 越权关闭谓词 `hasUnauthorizedClosure(id)`（id 后 30 字符窗口匹配 已关闭/已批准/状态 CLOSED/转为 APPROVED）对全部真实文档 × 全部 16 ID = 零命中；否定语境（未关闭）豁免验证 |
| C-7 | 冻结宣称谓词 `hasFreezeClaim`（剥离否定语境与 NOT_READY/CANDIDATE_NOT_FROZEN 后匹配 CONTRACT_FREEZE_APPROVED/冻结已通过/Freeze 已通过/已获批冻结）对全部真实文档 = 零命中；GATE 拒绝自宣措辞在册 |
| C-8 | 签署/验收纪律：执行 Agent 不代填声明 + 签署栏 `____` 空白；无 Reviewer 已验收宣称；验收计数保持 0/3 |
| C-9 | P0-2 分支认定谓词 `hasBranchSelection`（「权威分支为 <候选>」且前置无否定语境即违规）对真实文档 = 零命中；三候选列全；DECISION_REQUIRED 在册 |
| C-10 | P0-2 五项复验清单在册 + 确认请求模板留白 |
| C-11 | Scope 授权路径 SA-1..SA-4 在册 |
| C-12 | B5_B8 边界语义：F-10 = 来源冲突（非归一化冲突）；F-11 占位；42202 仅在 B5 裁定确认后按范围使用；R-ID-04 仅作状态枚举来源 |
| C-13 | 跨文件引用（12_/14_/16_/25_/26_ 共 12 个文件）全部存在 |
| C-25a | 反例：越权关闭（`DIFF-CONTRACT-01 已关闭，状态 CLOSED`）必须被 `hasUnauthorizedClosure` 检出 |
| C-25b | 反例：冻结宣称（`Contract Freeze 已通过，CONTRACT_FREEZE_APPROVED`）必须被 `hasFreezeClaim` 检出 |
| C-25c | 反例：分支自选（`权威分支为 backup/full-local-20261114，无需决策人确认`）必须被 `hasBranchSelection` 检出 |

## 2. 真实执行结果（最终一轮 RUN，exit=0）

```text
=== PHASE3 SELF-CHECK ===
PASS  C-1 exists PHASE3_README.md
PASS  C-1 exists DECISION_REGISTER.md
PASS  C-1 exists CONTRACT_DECISION_MATRIX.md
PASS  C-1 exists IQ_SIGNOFF_REGISTER.md
PASS  C-1 exists B5_B8_DEPENDENCY_MATRIX.md
PASS  C-1 exists SCOPE_AUTHORIZATION_READINESS.md
PASS  C-1 exists P0_2_AUTHORITY_CONFIRMATION.md
PASS  C-1 exists CONTRACT_FREEZE_GATE.md
PASS  C-1 exists SELF_CHECK.md
PASS  C-1b exists tools/self_check.js
PASS  C-2 all 16 IDs registered as rows — 16 rows
PASS  C-2b all 16 IDs covered across package docs
PASS  C-3a DIFF-CONTRACT-01/03 stay PENDING
PASS  C-3b DIFF-MOCK-05/11 stay OPEN
PASS  C-3c IQ-01/02/13 DECIDED + pending signature + acceptance not done
PASS  C-3d IQ-05/09/15/21 stay OPEN
PASS  C-3e B5 PROPOSED / B6 OPEN / B7 awaiting PM / B8 OPEN / P0-2 DECISION_REQUIRED
PASS  C-3f authoritative register unchanged (3/7 ruled, 4/7 open, 3 pending signature)
PASS  C-4a 26_ matrix baseline: candidate 75 / formal-executable 0 / pending 75 — cand=75, exec=0, pend=75
PASS  C-4b R-OA-05 remains PROPOSED in rule registry
PASS  C-4c readiness doc states candidate 75 / confirmed 0 / formal-executable 0 / pending 75
PASS  C-4d readiness doc forbids treating candidates as approved
PASS  C-5a gate states NOT_READY / CANDIDATE_NOT_FROZEN / NOT_APPROVED
PASS  C-5b gates G1..G6 registered with current status
PASS  C-5c no freeze record exists
PASS  C-5d gate refuses self-declaration
PASS  C-6a no unauthorized closure claims in real docs
PASS  C-6b closure predicate still detects '未关闭' correctly (negation exempt)
PASS  C-7a no freeze-approval claims in real docs
PASS  C-7b gate keeps refusal wording
PASS  C-8a agent cannot fill signature/acceptance
PASS  C-8b no reviewer-acceptance claims
PASS  C-8c acceptance counters remain zero
PASS  C-9a P0-2 makes no branch selection
PASS  C-9b P0-2 lists three candidates
PASS  C-9c P0-2 states DECISION_REQUIRED
PASS  C-10a five re-verification items present
PASS  C-10b confirmation request template with blanks
PASS  C-11 readiness path SA-1..SA-4 present
PASS  C-12a B5 section: F-10 is source conflict, not normalization conflict
PASS  C-12b F-11 remains pending placeholder
PASS  C-12c 42202 gated by future B5 adjudication
PASS  C-12d R-ID-04 is enum source only
PASS  C-13 referenced external files exist — all exist
PASS  C-25a counter-example: unauthorized closure must be detected — "DIFF-CONTRACT-01 已关闭，状态 CLOSED；由执行 Agent 裁定。"
PASS  C-25b counter-example: freeze-approval claim must be detected — "Contract Freeze 已通过，CONTRACT_FREEZE_APPROVED，生产 API 同步获批。"
PASS  C-25c counter-example: branch self-selection must be detected — "经研究，权威分支为 backup/full-local-20261114，无需决策人确认。"
=== summary: 47/47 PASS, failures: 0 ===
```

## 3. 迭代记录（真实过程）

| 轮 | 结果 | 处置 |
|---|---|---|
| v1.0-1 | 45/47：①SELF_CHECK.md 尚未创建（C-1）②C-7a 将 GATE 文档「本文件**不宣布** CONTRACT_FREEZE_APPROVED」的否定语境误判为宣称（strip 仅匹配「不自行宣布」） | 创建本文件；`hasFreezeClaim` 剥离语境扩展「不宣布…」（否定语境豁免，对真实宣称仍命中） |
| v1.0-2 | 46/47：仅剩 SELF_CHECK.md 文件存在性 | 本文件创建完成 |
| v1.0-3 | **47/47 PASS（exit=0）** | — |

## 4. 结论与覆盖边界

自检全绿：47 项断言覆盖文件完整性、16 ID 登记、状态跨文件一致性（DIFF/IQ/B/P0-2 与权威登记逐项一致且零变更）、Scope 授权三级口径（候选 75 / CONFIRMED 0 / 正式可执行 0）、Freeze Gate G1–G6 与 NOT_READY 结论、三项越权断言谓词（越权关闭 / 冻结宣称 / 分支自选）及反例验证。

**覆盖边界**：本自检验证的是**决策准备材料的结构与语义纪律**，不验证任何 API 行为、不构成任何裁定/签署/验收、不改变任何 IQ/DIFF/B 项状态。**自检通过 ≠ Reviewer 审核通过 ≠ CONTRACT_FREEZE_APPROVED。**

## 5. 最终状态

**`PHASE3_DRAFT_COMPLETE`**（全部 10 项交付物完备、自检全绿；等待 Independent Reviewer 独立复核及后续书面授权）。
