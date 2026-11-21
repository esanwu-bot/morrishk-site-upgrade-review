# SELF CHECK · Phase 2 计划包独立验证清单与真实执行记录

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE2-CHK-001 |
| 版本 | v1.1（R1–R4 修正后：新增 C-11..C-16 六组检查；C-1..C-10 原样保留） |
| 日期 | 2026-11-21 |
| 执行方式 | `node tools/self_check.js`（只读；数据源 = `12_` 基线 OpenAPI + 本目录文档） |
| 性质 | 真实执行记录（RUN）；行级/集合级验证，非字符串计数 |

## 1. 检查项清单

| 组 | 检查内容 |
|---|---|
| C-1 文件完整性 | 12 个计划文件全部存在 |
| C-2 操作覆盖率 | 16/16 operationId（自基线 OpenAPI 提取）全部入操作矩阵 |
| C-3 错误码覆盖率 | 20/20 error_key + 20/20 code 全部入错误码矩阵 |
| C-4 安全覆盖 | SEC-01..SEC-13 全部在册；T1/T2/T3 三身份 + PKCE 在册 |
| C-5 阻断引用 | 24 项阻断引用全部出现在阻断登记 |
| C-5b 原状态保持 | DIFF-CONTRACT-01/03 仍 PENDING；DIFF-MOCK-05/11 仍 OPEN |
| C-6 待决标注 | 操作矩阵 `BLOCKED_BY_DECISION` ≥ 8 处 |
| C-7 Fixture 纪律 | DEMO_FIXTURE + ULID；F-01..F-09 齐备 |
| C-8 计划稿纪律 | 无 freeze 完成/验收通过宣称；NOT_READY + CANDIDATE_NOT_FROZEN + NOT_APPROVED 在册 |
| C-9 内部链接 | 文档间引用全部可解析 |
| C-10 工作流齐备 | W-1..W-4 定义在主计划 |
| **C-11（R1）** | DIFF-MOCK-05：候选 A（仅 RELEASED）/候选 B（不自动过滤）均存在且均 BLOCKED_BY_DECISION；全文无「按契约默认」类确定默认表述；Repository 接口声明「不隐含/不注入默认状态过滤值」 |
| **C-12（R2）** | DIFF-CONTRACT-03：候选-422 与候选-400 双向量在错误矩阵与 OP-02 均存在、均标注 BLOCKED_BY_DECISION、均声明「不得合并为单一响应」 |
| **C-13（R3）** | Scope×Endpoint 矩阵：**行级解析**恰 75 行；(scope,operationId) 组合零重复；与 5 scope × 15 业务端点的笛卡尔全集逐一比对（missing=0/unexpected=0）；scope/operationId 均在声明集合内 |
| **C-14（R3）** | 逐行执行分类（可执行/挂起）解析成功 75/75；与文内统计声明（可执行 **70** / 挂起 **5**）一致；70+5=75；75/75 全覆盖声明在册 |
| **C-15（R4）** | F-07 行 = CONFIRMED + 「两个不同业务身份」，且不含 PENDING_CONFLICT |
| **C-16（R4）** | F-10 真冲突 fixture 存在（PENDING_CONFLICT）、引用 B5 且 BLOCKED_BY_DECISION(B5)、含 PROPOSED/未冻结表述、机制非「同 MPN 异 Brand」（显式否定表述可接受） |

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
PASS  C-6 BLOCKED_BY_DECISION markers >= 8 — 14 markers
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
PASS  C-14a row classification parsed for all 75 — exec=70, pend=5
PASS  C-14b stated stats match row counts — stated=70/5
PASS  C-14c stats sum to 75
PASS  C-14d full-coverage claim present
PASS  C-15a F-07 is CONFIRMED dual identity
PASS  C-15b F-07 is NOT marked as conflict
PASS  C-16a F-10 conflict fixture exists
PASS  C-16b F-10 cites B5 as BLOCKED/PROPOSED
PASS  C-16c F-10 mechanism is not same-MPN-different-brand
=== summary: 52/52 PASS, failures: 0 ===
```

## 3. 迭代记录（真实过程，含 R1–R4 修正轮）

| 轮 | 结果 | 处置 |
|---|---|---|
| v1.0-1 | 脚本崩溃：`SELF_CHECK.md` 尚未创建即被读取 | 先创建本文件再重跑 |
| v1.0-2 | 29/30：C-8 把验收标准中的**否决项禁令**误判为实际宣称 | C-8 排除禁令/否决上下文（仍命中真实宣称） |
| v1.0-3 | 30/30 PASS（= 44bdd24 提交态） | — |
| v1.1-1（R1–R4 后首轮） | 49/52：C-14a/b 行分类解析取到行尾空单元格（exec=0/pend=0）；C-16c 把 F-10 的显式否定表述「非"同 MPN 异 Brand"」误判为命中 | C-14 改取最后一个非空单元格；C-16c 接受显式否定（语义强度不变：机制仍不得"是"同 MPN 异 Brand） |
| v1.1-2 | **52/52 PASS（exit=0）** | — |

## 4. 结论

R1–R4 修正后计划包自检全绿。本结论仅表明**计划文档结构、矩阵行级覆盖与引用完备**，不代表任何实现完成或行为验收；挂起的 5 个 Scope 组合与全部 BLOCKED_BY_DECISION 项在 Reviewer/维护人裁定前不得计入任何行为验收 PASS。
