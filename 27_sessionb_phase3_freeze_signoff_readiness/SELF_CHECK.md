# SELF CHECK · Phase 3 决策与签署准备包独立验证清单与真实执行记录

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE3-CHK-001 |
| 版本 | v1.3（R3-A/R3-B 收尾：否定谓词收紧为**直接修饰**判定（否定词与目标之间仅允许空白间隔，废除"同分句任意否定词豁免"）；新增 **C-25g** 反例；结论断言计数勘误 55→**58** 项并全文档计数核对。C-1..C-24 与 C-25a..f 全部保留） |
| 日期 | 2026-11-21 |
| 执行方式 | `node tools/self_check.js`（只读；数据源 = 本包文档 + `12_`/`14_`/`16_`/`25_`/`26_` 权威与已审核材料） |
| 性质 | 真实执行记录（RUN）；行级/单元格级/分句级/直接修饰级/跨文件语义验证 + 越权断言谓词与反例，非字符串计数 |
| 声明 | 自检通过 ≠ Reviewer 审核通过；87/87（Phase 2）与 58/58（Phase 3）均为 Agent 提供的执行记录，Reviewer 未在本轮本地复跑 |

## 1. 检查项清单

| 组 | 检查内容 |
|---|---|
| C-1 | 10 个交付文件完整（9 文档 + `tools/self_check.js`） |
| C-2 | DECISION_REGISTER 登记全部 16 个 ID（DIFF×4 / IQ×7 / B×4 / P0-2）为表格行；ID 在七份文档全覆盖 |
| C-3a/b/c/d/e | Phase 3 登记表状态逐项正确（DIFF-CONTRACT-01/03=PENDING；DIFF-MOCK-05/11=OPEN；IQ-01/02/13=DECIDED+待签署+未验收；IQ-05/09/15/21=OPEN；B5=PROPOSED、B6/B8=OPEN、B7=待PM、P0-2=DECISION_REQUIRED） |
| C-3f | `14_/DECISION_REGISTER.md` 权威口径：3/7 裁定、4/7 未裁、≥3 处待签署 |
| C-3g（R2） | 逐项跨文件：`25_/DIFF_CHECK_REPORT.md` 中 DIFF-CONTRACT-01/03 行保持 **[PENDING]** |
| C-3h/h2（R2） | 逐项跨文件：`25_` 中 DIFF-MOCK-05/11 行保持 **[CONFIRMED]**（差异事实）；`26_/BLOCKER_AND_DEPENDENCY_REGISTER.md` 中二者处置保持 **OPEN**（两级口径分别核验） |
| C-3i/i2（R2） | 逐项跨文件：`12_` 候选 §11.2 中 B5=PROPOSED / B6=OPEN / B7=待PM / B8=OPEN；Registry 中 R-ID-05（B5）=PROPOSED，且 B6/B7/B8 所辖规则**全部非 CONFIRMED 且至少存在 BLOCKED** |
| C-3j1/j2（R2） | 逐行核验 `14_` 登记行：IQ-01/02/13 含 `2026-11-17` + `待签署`；IQ-05/09/15/21 裁定列为空（`—`） |
| C-4 | Scope 授权口径跨文件核验：26_ 矩阵 candidate=75 / formal-executable=0 / pending=75；Registry R-OA-05 = PROPOSED；readiness 文档声明 75/75、0/75、0/75、75/75 且载明禁止把候选当已批准 |
| C-5 | Freeze Gate：NOT_READY / CANDIDATE_NOT_FROZEN / NOT_APPROVED 在册；G1..G6 全登记；无冻结记录；拒绝自宣 |
| C-6 | 越权关闭谓词 `hasUnauthorizedClosure`（id 后 30 字符窗口匹配 已关闭/已批准/状态 CLOSED/转为 APPROVED）对全部真实文档 × 全部 16 ID = 零命中；否定语境（未关闭）豁免验证 |
| **C-7（R3-A 修订版）** | 冻结宣称谓词 `hasFreezeClaim`：分句边界（句号/分号/问叹号/换行/转折词 但是·然而·不过·但）+ **直接修饰**判定——宣称所在分句内，否定词（白名单不变：不宣布/不得自行宣布/不自行宣布/不得宣称/不构成/并非/不是）末尾与宣称起点之间**仅允许空白间隔**；同分句内的无关否定词（与宣称之间隔有其他内容，如逗号+其他文本）**不构成豁免**；否定词白名单未扩大；无固定长度前置窗口。对全部真实文档 = 零命中 |
| C-8 | 签署/验收纪律：执行 Agent 不代填 + 签署栏留白；无 Reviewer 已验收宣称；验收计数 0/3 |
| C-9 | P0-2 分支认定谓词 `hasBranchSelection`（「权威分支为 <候选>」且前置无否定语境即违规）对真实文档 = 零命中；三候选列全；DECISION_REQUIRED 在册 |
| C-10 | P0-2 五项复验清单在册 + 确认请求模板留白 |
| C-11 | Scope 授权路径 SA-1..SA-4 在册 |
| C-12 | B5_B8 边界语义：F-10 = 来源冲突（非归一化冲突）；F-11 占位；42202 仅在 B5 裁定确认后按范围使用；R-ID-04 仅作状态枚举来源 |
| C-13 | 跨文件引用（12_/14_/16_/25_/26_ 共 12 个文件）全部存在 |
| C-25a | 反例：越权关闭（`DIFF-CONTRACT-01 已关闭，状态 CLOSED`）必须被 `hasUnauthorizedClosure` 检出 |
| C-25b | 反例：冻结宣称（`Contract Freeze 已通过，CONTRACT_FREEZE_APPROVED`）必须被 `hasFreezeClaim` 检出 |
| C-25c | 反例：分支自选（`权威分支为 backup/full-local-20261114，无需决策人确认`）必须被 `hasBranchSelection` 检出 |
| C-25d | 反例：先否定后肯定（`不宣布 X，但实际上 X 已获批准`）必须检出（第二处宣称分句无否定） |
| C-25e | 反例：前一分句否定（并非…）+ 分号/转折边界 + 后一分句肯定宣称 → 必须检出 |
| C-25f | 纯否定声明与目标同分句直接关联 → 不应误报 |
| **C-25g（R3-A 反例）** | **同分句无关否定词**：`本文件并非冻结审批说明，另外 CONTRACT_FREEZE_APPROVED 已获批准。`——「并非」与宣称之间隔有「冻结审批说明，另外 」等非空白内容，**不构成直接修饰**；必须检出（旧逻辑会误豁免） |

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
PASS  C-3g 25_ authoritative: DIFF-CONTRACT-01/03 rows stay [PENDING]
PASS  C-3h 25_ authoritative: DIFF-MOCK-05/11 rows stay [CONFIRMED]-as-fact
PASS  C-3h2 26_ authoritative: DIFF-MOCK-05/11 resolution stays OPEN
PASS  C-3i 12_ §11.2: B5 PROPOSED / B6 OPEN / B7 awaiting PM / B8 OPEN (per-item)
PASS  C-3i2 rule registry: B5-gated rule PROPOSED; B6/B7/B8-gated rules non-CONFIRMED with BLOCKED present
PASS  C-3j1 IQ-01/02/13 rows registered 2026-11-17 with pending signature
PASS  C-3j2 IQ-05/09/15/21 rows have empty adjudication columns (—)
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
PASS  C-25d counter-example: negation-followed-by-claim in one sentence must be detected — "本文件不宣布 CONTRACT_FREEZE_APPROVED，但实际上 CONTRACT_FREEZE_APPROVED 已获批准。"
PASS  C-25e counter-example: prior-clause negation must NOT exempt next-clause claim — "本文件并非冻结审批说明；但 CONTRACT_FREEZE_APPROVED 已获批准。"
PASS  C-25f pure-negation statement must NOT be flagged — "本文件不宣布 CONTRACT_FREEZE_APPROVED。"
PASS  C-25g counter-example: unrelated same-clause negation must NOT exempt the claim — "本文件并非冻结审批说明，另外 CONTRACT_FREEZE_APPROVED 已获批准。"
=== summary: 58/58 PASS, failures: 0 ===
```

## 3. 迭代记录（真实过程）

| 轮 | 结果 | 处置 |
|---|---|---|
| v1.0-1 | 45/47：①SELF_CHECK.md 尚未创建（C-1）②C-7a 将「不宣布 CONTRACT_FREEZE_APPROVED」否定语境误判为宣称（strip 仅匹配「不自行宣布」） | 创建本文件；strip 扩展「不宣布…」 |
| v1.0-2 | 46/47：仅剩 SELF_CHECK.md 文件存在性 | 本文件创建完成 |
| v1.0-3 | 47/47（= 971efde 提交态） | — |
| v1.1-1（R1–R4 后） | 54/55：C-3i2 断言过严——B6 所辖规则中 R-ST-01 为 PROPOSED（同为未解决态），"全部 BLOCKED" 不成立 | 不变式修正为「B6/B7/B8 所辖规则全部非 CONFIRMED 且至少存在 BLOCKED」——语义强度保持 |
| v1.1-2 | 55/55（= f76580f 提交态） | — |
| v1.2-1（R3 最小修订后） | 57/57：分句边界算法落地，三反例按预期（C-25e 检出 / C-25f 不误报 / C-25d 检出） | 仅替换 hasFreezeClaim/新增 clauseStartBefore 与 C-25e/f |
| v1.2-2 | 57/57（= aa31079 提交态） | — |
| v1.3-1（R3-A 后） | **58/58 PASS（exit=0）**：谓词收紧为直接修饰判定（否定词与宣称间仅允许空白），C-25g 反例证明同分句无关否定词不再豁免；C-25d/e/f 行为保持不变；C-7a 真实文档零命中保持 | — |

## 4. 结论与覆盖边界

自检全绿：**58 项断言**（R3-A 收尾勘误：本节 v1.1/v1.2 残留的「55 项断言」为过期计数——v1.2 实际 57 项，加入 C-25g 后为 **58 项**；全文档执行次数与最终输出已核对一致）。R3-A 修正后：否定词必须**直接修饰**宣称（否定词末尾与宣称起点之间仅空白）方可豁免；分句边界（句号/分号/问叹号/换行/转折词）与直接修饰两级判定共同保证——排除语句不误报（C-25f）、先否定后肯定检出（C-25d）、跨分句否定不豁免（C-25e）、同分句无关否定不豁免（C-25g）。

**覆盖边界**：本自检只验证决策准备材料的结构与语义纪律及跨文件状态一致性，不验证 API 行为、不构成裁定/签署/验收、不改变任何 IQ/DIFF/B/P0-2 状态。**自检通过 ≠ Reviewer 审核通过 ≠ CONTRACT_FREEZE_APPROVED。**

## 5. 最终状态

**`PHASE3_DRAFT_COMPLETE`**（R3-A/R3-B 收尾完成、自检全绿；等待 Independent Reviewer 最终裁定及后续书面授权）。
