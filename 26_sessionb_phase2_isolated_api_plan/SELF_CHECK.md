# SELF CHECK · Phase 2 计划包独立验证清单与真实执行记录

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE2-CHK-001 |
| 版本 | v1.0 |
| 日期 | 2026-11-21 |
| 执行方式 | `node tools/self_check.js`（只读；数据源 = `12_` 基线 OpenAPI + 本目录文档） |
| 性质 | 真实执行记录（RUN）；检查项覆盖文件完整性、内部链接、矩阵覆盖率、阻断项引用、计划稿纪律 |

## 1. 检查项清单

| 组 | 检查内容 |
|---|---|
| C-1 文件完整性 | 12 个计划文件全部存在 |
| C-2 操作覆盖率 | 16/16 operationId（自基线 OpenAPI 提取）全部入操作矩阵 |
| C-3 错误码覆盖率 | 20/20 error_key + 20/20 code 全部入错误码矩阵 |
| C-4 安全覆盖 | SEC-01..SEC-13 全部在册；T1/T2/T3 三身份 + PKCE 在册 |
| C-5 阻断引用 | 24 项阻断引用（DIFF×4、IQ×7、B×4、P0-2、P1×8）全部出现在阻断登记 |
| C-5b 原状态保持 | DIFF-CONTRACT-01/03 仍 PENDING；DIFF-MOCK-05/11 仍 OPEN |
| C-6 待决标注 | 操作矩阵中 `BLOCKED_BY_DECISION` ≥ 8 处 |
| C-7 Fixture 纪律 | DEMO_FIXTURE + ULID 纪律；F-01..F-09 九产品齐备 |
| C-8 计划稿纪律 | 无 freeze 完成/验收通过宣称；NOT_READY + CANDIDATE_NOT_FROZEN + NOT_APPROVED 在册 |
| C-9 内部链接 | 文档间引用的兄弟文件全部可解析 |
| C-10 工作流齐备 | W-1..W-4 四工作流在主计划中定义 |

## 2. 真实执行结果（最终一轮 RUN）

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
PASS  C-6 BLOCKED_BY_DECISION markers >= 8 — 11 markers
PASS  C-7 fixture DEMO_FIXTURE discipline
PASS  C-7b fixture products F-01..F-09 — 9 products
PASS  C-8 no freeze claim
PASS  C-8b no acceptance self-claim
PASS  C-8c freeze still NOT_READY stated
PASS  C-8d production NOT_APPROVED stated
PASS  C-9 internal links resolvable — all refs ok
PASS  C-10 workstreams W-1..W-4
=== summary: 30/30 PASS, failures: 0 ===
```

## 3. 迭代记录（真实过程）

| 轮 | 结果 | 处置 |
|---|---|---|
| 1 | 脚本崩溃：`SELF_CHECK.md` 尚未创建即被脚本读取（C-1 存在性检查发生在读取前失败） | 先创建本文件，再重跑 |
| 2 | 29/30（C-8 FAIL）：`TEST_AND_ACCEPTANCE_CRITERIA.md` §E.4 的**否决项禁令**「任何"Contract Freeze 完成…"表述」被 C-8 正则误判为实际宣称 | 修正 C-8：排除禁令/否决上下文（`任何/不得/禁止/≠/非声明/不构成/挂起`），仍对真实宣称保持命中——收紧语义而非放水 |
| 3 | **30/30 PASS**（exit=0） | — |

## 4. 结论

计划包自检全绿。本结论仅表明**计划文档结构与引用完备**，不代表任何实现完成或行为验收。
