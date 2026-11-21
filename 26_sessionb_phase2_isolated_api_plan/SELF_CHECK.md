# SELF CHECK · Phase 2 计划包独立验证清单与真实执行记录

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE2-CHK-001 |
| 版本 | v1.2（R5–R6 修正后：新增 C-17..C-22 六组检查；C-1..C-16 原样保留——C-14 适配新行结构，语义不变） |
| 日期 | 2026-11-21 |
| 执行方式 | `node tools/self_check.js`（只读；数据源 = `12_` 基线 OpenAPI + `25_/rules/rule_registry.json` + 本目录文档） |
| 性质 | 真实执行记录（RUN）；行级/集合级/跨文件语义验证，非字符串计数 |

## 1. 检查项清单

| 组 | 检查内容 |
|---|---|
| C-1..C-10 | 同 v1.0（文件完整性 / 16 操作 / 20 错误码 / 13 安全场景 + 三身份 / 24 阻断引用 / 四项 DIFF 原状态 / BLOCKED_BY_DECISION 密度 / Fixture 纪律 / 计划稿纪律 / 内部链接 / 四工作流）——原样保留 |
| C-11（R1） | DIFF-MOCK-05 候选 A/B 在册、均 BLOCKED_BY_DECISION、无确定默认表述、Repository 接口不隐含默认 |
| C-12（R2） | DIFF-CONTRACT-03 候选-422/候选-400 在册、均 BLOCKED_BY_DECISION、不得合并为单一响应 |
| C-13（R3） | 75 行矩阵：行级解析恰 75；(scope,operationId) 零重复、与笛卡尔全集一致 |
| C-14（R3/R5） | 逐行验收分类解析 75/75（当前 exec=0/pend=75）；文内统计（正式可执行 **0** / 授权待裁定 **75**）与行数一致；合计 75；75/75 全覆盖声明在册 |
| C-15（R4） | F-07 = CONFIRMED 两个不同业务身份，非冲突 |
| C-16（R4） | F-10 冲突 fixture 在册、引用 B5、机制非"同 MPN 异 Brand"（显式否定表述可接受） |
| **C-17（R5）** | 75 行逐行携带授权依据类型 ∈ {CANDIDATE_AUTHORIZATION, CONFIRMED_AUTHORIZATION, BLOCKED_BY_DECISION}；候选授权映射数量（75）与行级计数一致；每行候选预期（允许/拒绝）在册 |
| **C-18（R5）** | 跨文件语义校验：Rule Registry 中 R-OA-05 仍为 PROPOSED；引用 R-OA-05 的行**不得**标记 CONFIRMED_AUTHORIZATION；当前零行声称 CONFIRMED_AUTHORIZATION |
| **C-19（R5）** | 正式可执行数量声明 = **0** 且等于 CONFIRMED 依据行数；旧「可执行 70」口径仅允许存在于作废声明上下文 |
| **C-20（R6）** | F-10（SOURCE_IDENTITY_CONFLICT）与 F-11（NORMALIZATION_CONFLICT_CANDIDATE_PENDING_B5）为两个独立建模行 |
| **C-21（R6）** | F-11 引用 B5（BLOCKED_BY_DECISION(B5) + PROPOSED）、声明非臆测限制（无充分依据 + 不伪造已确定冲突案例）、未冻结任何算法 |
| **C-22（R6）** | 42202 行区分两类冲突（SOURCE_IDENTITY_CONFLICT ≠ NORMALIZATION_CONFLICT_CANDIDATE_PENDING_B5，标注"不得混同"）并保持 F-07 为两个合法身份 |

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
=== summary: 69/69 PASS, failures: 0 ===
```

## 3. 迭代记录（真实过程，含 R1–R6 修正轮）

| 轮 | 结果 | 处置 |
|---|---|---|
| v1.0-1 | 脚本崩溃（SELF_CHECK.md 未创建即被读取） | 先建文件再重跑 |
| v1.0-2 | 29/30：C-8 将验收标准否决项禁令误判为宣称 | C-8 排除禁令上下文 |
| v1.0-3 | 30/30（= 44bdd24 提交态） | — |
| v1.1-1（R1–R4 后） | 49/52：C-14 行尾空单元格解析缺陷；C-16c 显式否定误报 | 修脚本（非放宽语义） |
| v1.1-2 | 52/52（= 448f9bf 提交态） | — |
| v1.2-1（R5–R6 后） | 67/69：C-16c 未适配 F-10 新否定表述的加粗标记（`**非**"同 MPN 异 Brand"`）；C-19c 命中作废声明中的「可执行 70」字样 | C-16c 接受加粗否定标记；C-19c 仅在非作废上下文计失败（对齐 C-8 同款处理） |
| v1.2-2 | **69/69 PASS（exit=0）** | — |

## 4. 结论

R5–R6 修正后计划包自检全绿。关键口径（本轮固化）：**75 行授权结果全部为 CANDIDATE_AUTHORIZATION，正式可执行 = 0，授权规则待裁定 = 75**；F-10（来源冲突候选）与 F-11（归一化冲突候选占位，待 B5）分别建模、不得混同。本结论仅表明计划文档结构、矩阵行级覆盖与跨文件语义一致，不代表任何实现完成或行为验收。
