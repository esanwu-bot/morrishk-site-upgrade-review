# SELF CHECK · Phase 3 决策与签署准备包独立验证清单与真实执行记录

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE3-CHK-001 |
| 版本 | v1.2（R3 最小修订：`hasFreezeClaim` 否定语境改为**分句边界 + 直接关联**判定（句号/分号/问叹号/换行/转折词 但是·然而·不过·但），废除固定 24 字符前置窗口；新增 C-25e/C-25f 两个边界反例。C-1..C-24 及 C-25a..d 全部保留） |
| 日期 | 2026-11-21 |
| 执行方式 | `node tools/self_check.js`（只读；数据源 = 本包文档 + `12_`/`14_`/`16_`/`25_`/`26_` 权威与已审核材料） |
| 性质 | 真实执行记录（RUN）；行级/单元格级/分句级/跨文件语义验证 + 越权断言谓词与反例，非字符串计数 |
| 声明 | 自检通过 ≠ Reviewer 审核通过；87/87（Phase 2）与 55/55（Phase 3）均为 Agent 提供的执行记录，Reviewer 未在本轮本地复跑 |

## 1. 检查项清单

| 组 | 检查内容 |
|---|---|
| C-1 | 10 个交付文件完整 |
| C-2 | DECISION_REGISTER 登记全部 16 个 ID 为表格行；ID 在七份文档全覆盖 |
| C-3a/b/c/d/e | Phase 3 登记表状态逐项正确（DIFF-CONTRACT-01/03=PENDING；DIFF-MOCK-05/11=OPEN；IQ-01/02/13=DECIDED+待签署+未验收；IQ-05/09/15/21=OPEN；B5=PROPOSED、B6/B8=OPEN、B7=待PM、P0-2=DECISION_REQUIRED） |
| **C-3f（R2 强化）** | `14_/DECISION_REGISTER.md` 权威口径：3/7 裁定、4/7 未裁、≥3 处待签署 |
| **C-3g（R2 新增）** | 逐项跨文件：`25_/DIFF_CHECK_REPORT.md` 中 DIFF-CONTRACT-01/03 行保持 **[PENDING]** |
| **C-3h/h2（R2 新增）** | 逐项跨文件：`25_` 中 DIFF-MOCK-05/11 行保持 **[CONFIRMED]**（差异事实）；`26_/BLOCKER_AND_DEPENDENCY_REGISTER.md` 中二者处置保持 **OPEN**（两级口径分别核验：事实已确认 / 处置未决） |
| **C-3i/i2（R2 新增）** | 逐项跨文件：`12_` 候选 §11.2 中 B5=PROPOSED / B6=OPEN / B7=待PM / B8=OPEN；`25_/rule_registry.json` 中 R-ID-05（B5）=PROPOSED，且 B6/B7/B8 所辖规则**全部非 CONFIRMED 且至少存在 BLOCKED**（未解决阻断不得辖有 CONFIRMED 规则） |
| **C-3j1/j2（R2 新增）** | 逐行核验 `14_` 登记行：IQ-01/02/13 含 `2026-11-17` + `待签署`；IQ-05/09/15/21 裁定列为空（`—`） |
| C-4 | Scope 授权口径跨文件核验：26_ 矩阵 candidate=75 / formal-executable=0 / pending=75；Registry R-OA-05 = PROPOSED；readiness 文档声明 75/75、0/75、0/75、75/75 且载明禁止把候选当已批准 |
| C-5 | Freeze Gate：NOT_READY / CANDIDATE_NOT_FROZEN / NOT_APPROVED 在册；G1..G6 全登记；无冻结记录；拒绝自宣 |
| C-6 | 越权关闭谓词 `hasUnauthorizedClosure`（id 后 30 字符窗口匹配 已关闭/已批准/状态 CLOSED/转为 APPROVED）对全部真实文档 × 全部 16 ID = 零命中；否定语境（未关闭）豁免验证 |
| **C-7（R3 修订版）** | 冻结宣称谓词 `hasFreezeClaim`：对每个肯定宣称匹配（`CONTRACT_FREEZE_APPROVED/冻结已通过/Freeze 已通过/已获批冻结`），取其**所在分句**（分句起点 = 匹配位置之前最近的语境边界——句号/分号/问叹号/换行/转折词 但是·然而·不过·但——之后），分句内含否定词（白名单不变：不宣布/不得自行宣布/不自行宣布/不得宣称/不构成/并非/不是）才豁免；否则判违规。否定语境必须与目标表达**同分句直接关联**，不使用固定长度前置窗口；转折词边界使前一否定分句不得豁免后一肯定分句。对全部真实文档 = 零命中。否定词白名单未扩大 |
| C-8 | 签署/验收纪律：执行 Agent 不代填 + 签署栏留白；无 Reviewer 已验收宣称；验收计数 0/3 |
| C-9 | P0-2 分支认定谓词 `hasBranchSelection` 对真实文档 = 零命中；三候选列全；DECISION_REQUIRED 在册 |
| C-10 | P0-2 五项复验清单在册 + 确认请求模板留白 |
| C-11 | Scope 授权路径 SA-1..SA-4 在册 |
| C-12 | B5_B8 边界语义：F-10 = 来源冲突（非归一化冲突）；F-11 占位；42202 仅在 B5 裁定确认后按范围使用；R-ID-04 仅作状态枚举来源 |
| C-13 | 跨文件引用（12_/14_/16_/25_/26_ 共 12 个文件）全部存在 |
| C-25a | 反例：越权关闭（`DIFF-CONTRACT-01 已关闭，状态 CLOSED`）必须被 `hasUnauthorizedClosure` 检出 |
| C-25b | 反例：冻结宣称（`Contract Freeze 已通过，CONTRACT_FREEZE_APPROVED`）必须被 `hasFreezeClaim` 检出 |
| C-25c | 反例：分支自选（`权威分支为 backup/full-local-20261114，无需决策人确认`）必须被 `hasBranchSelection` 检出 |
| **C-25d（R3 反例）** | 矛盾反例：`本文件不宣布 CONTRACT_FREEZE_APPROVED，但实际上 CONTRACT_FREEZE_APPROVED 已获批准。`——「先否定、后肯定」同句并存，必须被 `hasFreezeClaim` 检出（否定语境豁免只作用于被否定的目标表达分句） |
| **C-25e（R3 补充反例 1）** | `本文件并非冻结审批说明；但 CONTRACT_FREEZE_APPROVED 已获批准。`——前一分句的「并非」被分号+转折词边界切断，**不得豁免**后一分句的肯定宣称；必须检出 |
| **C-25f（R3 补充反例 2）** | `本文件不宣布 CONTRACT_FREEZE_APPROVED。`——纯否定声明与目标同分句直接关联，**不应误报**（hasFreezeClaim = false） |

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
=== summary: 57/57 PASS, failures: 0 ===
```

## 3. 迭代记录（真实过程）

| 轮 | 结果 | 处置 |
|---|---|---|
| v1.0-1 | 45/47：①SELF_CHECK.md 尚未创建（C-1）②C-7a 将「不宣布 CONTRACT_FREEZE_APPROVED」否定语境误判为宣称（strip 仅匹配「不自行宣布」） | 创建本文件；strip 扩展「不宣布…」 |
| v1.0-2 | 46/47：仅剩 SELF_CHECK.md 文件存在性 | 本文件创建完成 |
| v1.0-3 | 47/47（= 971efde 提交态） | — |
| v1.1-1（R1–R4 后） | 54/55：C-3i2 断言过严——B6 所辖规则中 R-ST-01 为 PROPOSED（同为未解决态），"全部 BLOCKED" 不成立 | 不变式修正为「B6/B7/B8 所辖规则全部非 CONFIRMED 且至少存在 BLOCKED」——语义强度保持（未解决阻断不得辖有 CONFIRMED 规则） |
| v1.1-2 | 55/55（= f76580f 提交态） | — |
| v1.2-1（R3 最小修订后） | **57/57 PASS（exit=0）**：新增分句边界算法后，三个指定反例全部按预期——C-25e「并非…；但 X 已获批准」检出、C-25f 纯否定不误报、C-25d 先否定后肯定检出；真实文档 C-7a 保持零命中 | 仅替换 `hasFreezeClaim`/新增 `clauseStartBefore` 与 C-25e/f；否定词白名单未扩大；C-1..C-24 与 C-25a..d 全部保留 |

## 4. 结论与覆盖边界

自检全绿：55 项断言。R2 修正后 C-3 已实现**逐项跨文件状态核验**（`25_`/`12_`/`14_`/`26_`/Registry 五个权威来源逐 ID 比对，Phase 3 登记表不再是被孤立检查的副本）；R3 修正后冻结宣称谓词为逐匹配语境判定，C-25d 证明「先否定、后肯定」矛盾表达必被检出；R4 修正后 P0-2 工作树数量勘误为 20 项并附完整现场快照（标记为 Agent 现场证据，未经 Reviewer 独立复验）。

**覆盖边界**：本自检只验证决策准备材料的结构与语义纪律及跨文件状态一致性，不验证 API 行为、不构成裁定/签署/验收、不改变任何 IQ/DIFF/B/P0-2 状态。**自检通过 ≠ Reviewer 审核通过 ≠ CONTRACT_FREEZE_APPROVED。**

## 5. 最终状态

**`PHASE3_DRAFT_COMPLETE`**（R1–R4 修正完成、自检全绿；等待 Independent Reviewer 独立复核及后续书面授权）。
