# P0-2 验收矩阵

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-P02-ACC-001 |
| 版本 | v1.0（只读核验；不自行判定 P0-2 通过） |
| 日期 | 2026-11-23 |
| 依据 | `16_/FREEZE_READINESS_REVIEW.md:166-176`；`12_/README.md` §2.1；`27_/P0_2_AUTHORITY_CONFIRMATION.md` |
| 结论 | **P0-2 BLOCKED（0/2 关闭条件）** |

## 1. P0-2 关闭条件（两项，缺一不可）

| # | 条件 | 要求 | 当前状态 | 责任方 | 关闭证据 |
|---|---|---|---|---|---|
| C1 | 权威分支与基线书面确定 | 书面指定分支 + Commit SHA + 20 项工作树内容纳入/排除口径 | **未满足** | Ds Bit 负责人/项目决策人 | 书面确认文件，载明分支/SHA/口径 |
| C2 | 干净提交五项复验 | 在 C1 指定的干净提交上逐项复验 5 项，结果写入冻结记录 | **未执行** | 非执行 Agent（独立） | 五项 PASS/FAIL + file:line/命令证据 |
| C3 | P0-2 关闭记录 | Reviewer 复核 C1/C2 并写入冻结记录 | **未开始** | Reviewer | 冻结记录章节 |

> 当前结论：**C1、C2、C3 均未完成，P0-2 = BLOCKED。** 准备性材料已完成，不等于关闭条件完成。

## 2. 五项复验矩阵

`12_/README.md` §2.1 要求在权威分支的**干净提交**上复验以下五项。由于 C1 未完成，本轮只能记录“快照事实”，不能判 PASS。

| # | 验收项 | 要求 | 快照事实（非复验结论） | 当前判定 | 所需证据 |
|---|---|---|---|---|---|
| 1 | 产品身份模型 | 明确产品唯一标识；是否允许同一产品多版本 | `Product` 为单次文档解析内模型；`product_id = prod-{document_id}`；`document_id = doc-{sha[:12]}`；`requested_mpn` 与 `normalized_mpn` 当前同值；无全局产品注册表 | **NOT_REVERIFIED** | 权威提交上的代码/运行证据 |
| 2 | 产品全局 ID 唯一性 | 跨解析批次是否稳定、是否全局唯一 | 无全局唯一约束；快照运行产物中 10 组 MPN 对应多个 `product_id`（`W1` 76 个）；仅说明结构，不代表生产比例 | **NOT_REVERIFIED** | 权威提交上的运行产物/约束检查 |
| 3 | 解析器输出与证据模型 | `EV-*`、bbox、页码、SHA 是否仍一致 | `14_`/契约登记了快照事实；未在权威提交上重跑 | **NOT_REVERIFIED** | 权威提交上的解析 RUN + 证据比对 |
| 4 | 静态 B2B 桩状态 | `serve_b2b.py` 是否仍为本地 stub、是否进入版本库 | 仍为未跟踪文件；本地静态回放；仅 V101；OAuth 为桩 | **NOT_REVERIFIED** | `git ls-files` + 文件哈希 + 启动行为 |
| 5 | 数据库/审核/版本/发布四类后端进度 | 是否仍为 `NOT_IMPLEMENTED` | Phase 0 结论为 `NOT_IMPLEMENTED`；无产品主表/分类表/映射表 | **NOT_REVERIFIED** | 权威提交上的代码/迁移/运行检查 |

### 2.1 五项与关闭条件的关系

- 五项全部只能在 C1 完成后执行；任一项不成立，对应 `CONFIRMED` 事实降级为 `OPEN`（`16_/FREEZE_READINESS_REVIEW.md:174-175`）。
- 五项通过也只是 P0-2 的必要条件，不等于 Contract Freeze 或生产授权。
- 本轮没有在 Ds Bit 仓库执行任何写操作；未清理/暂存/提交 20 项工作树内容。

## 3. Ds Bit 权威分支验收（C1）

| 检查项 | 结果 | 证据 |
|---|---|---|
| 是否存在书面权威指定 | **否** | 全仓检索未见决策文件；`27_/P0_2_AUTHORITY_CONFIRMATION.md` 仅为请求 |
| 候选分支是否列全 | 是（backup / origin/feat/gate6a-audit / main） | `14_/DSBIT_AUTHORITY_BASELINE.md` §1；`01_` 报告 §1 |
| 分支/SHA 是否可追溯 | 是（SHA 已实测） | `evidence/dsbit_refs.txt` |
| 工作树口径是否明确 | **否**（20 项未提交；纳入/排除未定） | `evidence/dsbit_status.txt`；`01_` 报告 §2 |
| 是否存在双向分叉 | 否；`main` 落后 15 个提交，`origin/main` 更旧 | `git rev-list --left-right --count` |
| 是否可由执行 Agent 自行选定 | **否**，必须由 Ds Bit 负责人/项目决策人书面决定 | `27_/P0_2_AUTHORITY_CONFIRMATION.md` §3/§5 |

## 4. Phase 1–3 当前状态复核

| 阶段 | 分支/HEAD | 实测自检 | 文档记录状态 | 独立 Reviewer 证据 | 结论 |
|---|---|---|---|---|---|
| Phase 1 | `sessionb/phase1-contract-closure` / `069ab82…4a88` | 契约注解测试 **15/15 passed** | README 记录 `PHASE1_CLOSED_PASS` | 未找到与 25_ 对应的独立 Reviewer 裁定文件/标签（现有 `dsbit-phase1-mock-090cae9-review` 标签对应 15_ Mock，不是 25_） | 测试可复现；状态为文档记录 |
| Phase 2 | `docs/sessionb-phase2-isolated-api-plan` / `096fc36…2d49` | 自检 **87/87 PASS** | README 记录 PLAN `REVIEW_PASS` | 未找到与 26_ 对应的独立 Reviewer 裁定文件/标签 | 计划自检通过；不是实现/验收 |
| Phase 3 | `docs/sessionb-phase3-freeze-signoff-readiness` / `573012a…81b1` | 自检 **58/58 PASS** | README 记录 Phase 3 `REVIEW_PASS` | 未找到与 27_ 对应的独立 Reviewer 裁定文件/标签 | 决策材料通过自检；Freeze NOT_READY |

> 说明：本次实跑的是自检/契约测试，不是 Independent Reviewer 的复跑结论。任务给出的历史状态（Phase 1 CLOSED PASS、Phase 2 PLAN REVIEW_PASS、Phase 3 REVIEW_PASS）在文档中有记录；本轮未在仓库内找到与 25_/26_/27_ 一一对应的独立裁定文件或标签，因此不把文档记录升级为新的 Reviewer 结论。已有的 `dsbit-phase1-mock-090cae9-review` 标签属于更早的 15_ Mock 阶段，不能替代 25_ 阶段裁定。

### 4.1 Phase 1 证据不一致（需修正）

- `25_/README.md:20` 与 `25_/RULE_STATUS_REGISTER.md:14` 的摘要写：55 条 = CONFIRMED 9 / PROPOSED 26 / **PENDING 8 / BLOCKED 12**。
- 机器可读 `25_/rules/rule_registry.json` 及明细行实际为：CONFIRMED 9 / PROPOSED 26 / **PENDING 7 / BLOCKED 13**。
- 两者总数均为 55，差异为 1 条状态归类；明细行与 JSON 一致，摘要行过期。
- 影响：不改变 Phase 1 契约注解测试 15/15 的结果，但需在下次获授权的文档修订中更正摘要，并由 Reviewer 复核。详见 `evidence/rule_registry_counts.txt`。

## 5. P0-2 结论

**P0-2 = BLOCKED。**

- 准备性工作已完成（候选分支/SHA/工作树/五项要求的证据整理；Phase 1–3 自检复跑；契约与 75 矩阵核验），但关闭条件 **0/2**。
- 由于存在明确的外部决策阻塞（权威分支未指定）且干净提交复验无法执行，按任务定义判 **BLOCKED**，不是 PARTIAL PASS。
- 已完成：候选分支/SHA/工作树/五项要求的证据整理；Phase 1–3 自检复跑；契约与 75 矩阵核验。
- 未完成：权威分支书面指定、工作树口径、干净提交、五项复验、Reviewer 关闭记录。
- 不得将本矩阵的“快照事实”写成五项 PASS；不得将 Phase 1–3 的文档记录写成新的 Reviewer 验收；不得在 P0-2 关闭前进入 Contract Freeze 或 Production API 实现。