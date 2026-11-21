# SELF CHECK · Phase 2 计划包独立验证清单与真实执行记录

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE2-CHK-001 |
| 版本 | v1.3（R7 修正后：新增 C-23a..d、C-24a..f 八项结构与语义检查；C-1..C-22 原样保留——C-21c 适配否定语境，语义不放宽） |
| 日期 | 2026-11-21 |
| 执行方式 | `node tools/self_check.js`（只读；数据源 = `12_` 基线 OpenAPI + `25_/rules/rule_registry.json` + 本目录文档） |
| 性质 | 真实执行记录（RUN）；行级/单元格级/跨文件语义验证，非字符串计数 |

## 1. 检查项清单

| 组 | 检查内容 |
|---|---|
| C-1..C-10 | 同 v1.0（文件完整性 / 16 操作 / 20 错误码 / 13 安全场景 + 三身份 / 24 阻断引用 / 四项 DIFF 原状态 / BLOCKED_BY_DECISION 密度 / Fixture 纪律 / 计划稿纪律 / 内部链接 / 四工作流）——原样保留 |
| C-11（R1） | DIFF-MOCK-05 候选 A/B 在册、均 BLOCKED_BY_DECISION、无确定默认表述、Repository 接口不隐含默认 |
| C-12（R2） | DIFF-CONTRACT-03 候选-422/候选-400 在册、均 BLOCKED_BY_DECISION、不得合并为单一响应 |
| C-13（R3） | 75 行矩阵行级解析：恰 75、零重复、与笛卡尔全集一致 |
| C-14（R3/R5） | 逐行验收分类 75/75（exec=0/pend=75）；文内统计（正式可执行 **0** / 授权待裁定 **75**）与行数一致；合计 75；75/75 在册 |
| C-15（R4） | F-07 = CONFIRMED 两个不同业务身份，非冲突 |
| C-16（R4） | F-10 冲突 fixture 在册、引用 B5、机制非"同 MPN 异 Brand" |
| C-17（R5） | 75 行逐行授权依据类型 ∈ 三值词表；候选授权映射数量 75 与行级计数一致；候选预期列在册 |
| C-18（R5） | 跨文件语义：Registry 中 R-OA-05 仍 PROPOSED；引用 R-OA-05 的行不得标 CONFIRMED_AUTHORIZATION；当前零行 CONFIRMED |
| C-19（R5） | 正式可执行声明 = 0 且 = CONFIRMED 行数；旧「可执行 70」仅允许存在于作废声明上下文 |
| C-20（R6） | F-10（SOURCE_IDENTITY_CONFLICT）与 F-11（NORMALIZATION_CONFLICT_CANDIDATE_PENDING_B5）独立建模 |
| C-21（R6） | F-11 引用 B5（BLOCKED_BY_DECISION(B5) + PROPOSED）、非臆测限制声明、未冻结任何算法（「已冻结」仅允许出现在否定语境——v1.3 适配） |
| C-22（R6） | 42202 区分两类冲突（"不得混同"在册）并保持 F-07 为两个合法身份 |
| **C-23（R7-1）** | 矩阵列结构：表头恰 10 列；75 数据行逐行 10 列；第 8 列 = 规则状态（PROPOSED）、第 9 列 = 授权依据类型（CANDIDATE_AUTHORIZATION）逐行位置正确；正式可执行仍 0 / 授权待裁定仍 75 |
| **C-24（R7-3/2）** | 单元格级语义：42202 触发条件单元格不含 F-10；OP-02 中 F-10 提及必须伴随「不属于 42202 触发条件」；F-11 不断言具体归一化输出（无"必然产生"/旧确定表述，含"未知"清单）；F-11 提及 R-ID-01 必须伴随「不代表」；F-11 保持 `PROPOSED / BLOCKED_BY_DECISION(B5)`；F-07「互不视为冲突」且无 PENDING_CONFLICT |

## 2. 真实执行结果（最终一轮 RUN，exit=0）

```text
=== PHASE2 PLAN SELF-CHECK ===
PASS  C-1 exists PHASE2_IMPLEMENTATION_PLAN.md
PASS  C-1 exists API_OPERATION_TEST_MATRIX.md
PASS  C-1 exists ERROR_CODE_TEST_MATRIX.md
PASS  C-1 exists SECURITY_AND_SCOPE_TEST_PLAN.md
PASS  C-1 exists REPOSITORY_INTERFACE_PLAN.md
PASS  C-1 exists YII2_CLIENT_PLAN.md
PASS  C-1 exists OAUTH2_INTEGRATION_PLAN.md
PASS  C-1 exists FIXTURE_DATA_SPEC.md
PASS  C-1 exists BLOCKER_AND_DEPENDENCY_REGISTER.md
PASS  C-1 exists TEST_AND_ACCEPTANCE_CRITERIA.md
PASS  C-1 exists README.md
PASS  C-1 exists SELF_CHECK.md
PASS  C-2 operations 16/16 in matrix — 16 ops
PASS  C-3 error codes 20/20 in matrix — 20 keys + 20 codes
PASS  C-4 security scenarios 13/13 — SEC-01..13
PASS  C-4b three token classes
PASS  C-5 blocker refs complete — 24 refs
PASS  C-5b DIFF-CONTRACT-01 stays PENDING
PASS  C-5b DIFF-CONTRACT-03 stays PENDING
PASS  C-5b DIFF-MOCK-05 stays OPEN
PASS  C-5b DIFF-MOCK-11 stays OPEN
PASS  C-6 BLOCKED_BY_DECISION markers >= 8 — 15 markers
PASS  C-7 fixture DEMO_FIXTURE discipline
PASS  C-7b fixture products F-01..F-09 — 9 products
PASS  C-8 no freeze claim
PASS  C-8b no acceptance self-claim
PASS  C-8c freeze still NOT_READY stated
PASS  C-8d production NOT_APPROVED stated
PASS  C-9 internal links resolvable — all refs ok
PASS  C-10 workstreams W-1..W-4
PASS  C-11a DIFF-MOCK-05 candidate A present
PASS  C-11b DIFF-MOCK-05 candidate B present
PASS  C-11c both candidates BLOCKED_BY_DECISION
PASS  C-11d no determined-default phrasing
PASS  C-11e repo interface has no implied default
PASS  C-12a error-matrix dual candidates
PASS  C-12b dual candidates BLOCKED_BY_DECISION
PASS  C-12c not merged into one response
PASS  C-13a scope matrix has exactly 75 rows — rows=75
PASS  C-13b combos unique — duplicates=0
PASS  C-13c combos complete (5 scopes x 15 ops) — missing=0, unexpected=0
PASS  C-13d scopes are the 5 declared
PASS  C-13e ops are the 15 business ops
PASS  C-14a row classification parsed for all 75 — exec=0, pend=75
PASS  C-14b stated stats match row counts — stated=0/75, rows=0/75
PASS  C-14c stats sum to 75
PASS  C-14d full-coverage claim present
PASS  C-15a F-07 is CONFIRMED dual identity
PASS  C-15b F-07 is NOT marked as conflict
PASS  C-16a F-10 conflict fixture exists
PASS  C-16b F-10 cites B5 as BLOCKED/PROPOSED
PASS  C-16c F-10 mechanism is not same-MPN-different-brand
PASS  C-17a every row carries an authorization-basis type
PASS  C-17b candidate-authorization count matches rows — stated=75, rows=75
PASS  C-17c candidate expectation column present per row
PASS  C-18a R-OA-05 remains PROPOSED in rule registry
PASS  C-18b R-OA-05-sourced rows never marked CONFIRMED
PASS  C-18c no row claims CONFIRMED_AUTHORIZATION today
PASS  C-19a formal executable stated as 0
PASS  C-19b formal executable == CONFIRMED-based rows
PASS  C-19c old 70-executable claim abolished
PASS  C-20a source-conflict candidate modeled (F-10)
PASS  C-20b normalization-conflict candidate modeled separately (F-11)
PASS  C-20c the two conflict classes are distinct rows
PASS  C-21a F-11 cites B5 as BLOCKED and PROPOSED
PASS  C-21b F-11 states the non-speculative limitation
PASS  C-21c F-11 freezes no algorithm
PASS  C-22a 42202 distinguishes the two conflict classes
PASS  C-22b 42202 keeps F-07 as two legal identities
PASS  C-23a matrix header has 10 columns — cols=10
PASS  C-23b all 75 data rows have 10 columns
PASS  C-23c rule-status and auth-basis columns in correct positions
PASS  C-23d formal executable still 0 and authorization pending 75
PASS  C-24a F-10 absent from 42202 trigger cell
PASS  C-24b OP-02 does not list F-10 as a 42202 trigger
PASS  C-24c F-11 asserts no concrete normalization outcome
PASS  C-24d F-11 does not use R-ID-01 as a normalization-algorithm basis
PASS  C-24e F-11 keeps the B5 block
PASS  C-24f F-07 dual-brand identities do not trigger conflict
=== summary: 79/79 PASS, failures: 0 ===
```

## 3. 迭代记录（真实过程，含 R1–R7 修正轮）

| 轮 | 结果 | 处置 |
|---|---|---|
| v1.0-1 | 脚本崩溃（SELF_CHECK.md 未创建即被读取） | 先建文件再重跑 |
| v1.0-2 | 29/30：C-8 将验收标准否决项禁令误判为宣称 | C-8 排除禁令上下文 |
| v1.0-3 | 30/30（= 44bdd24 提交态） | — |
| v1.1-1（R1–R4 后） | 49/52：C-14 行尾空单元格解析缺陷；C-16c 显式否定误报 | 修脚本 |
| v1.1-2 | 52/52（= 448f9bf 提交态） | — |
| v1.2-1（R5–R6 后） | 67/69：C-16c 加粗否定标记；C-19c 命中作废声明字样 | 两处脚本适配（语义不放宽） |
| v1.2-2 | 69/69（= e1f3786 提交态） | — |
| v1.3-1（R7 后） | 78/79：C-21c 未适配 F-11 新否定表述「不代表归一化算法已冻结」（否定语境含"已冻结"子串） | C-21c 剥离否定语境（不代表…/未冻结）后再判——语义不放宽 |
| v1.3-2 | **79/79 PASS（exit=0）** | — |

## 4. 结论

R7 修正后计划包自检全绿。本结论仅表明计划文档结构、矩阵行级/单元格级覆盖与跨文件语义一致；**自检通过 ≠ Reviewer 审核通过**。固化口径：75 行全部 CANDIDATE_AUTHORIZATION、正式可执行 = 0、授权规则待裁定 = 75；F-10（来源冲突候选，非 42202 触发条件）与 F-11（归一化冲突候选占位，待 B5）分别建模；F-07 = 两个合法身份。
