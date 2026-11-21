# 25 · Session B Phase 1 — Business API Contract Closure & Implementation Preparation

| 项 | 值 |
|---|---|
| 目录编号 | 25_sessionb_phase1_contract_closure |
| 包编号 | MRH-DSBIT-SESSIONB-CC-001 |
| 版本 | v1.0（阶段一交付：差异核对 + 契约候选整理；隔离实现待下一子阶段） |
| 日期 | 2026-11-21 |
| 分支 | `sessionb/phase1-contract-closure`（基于 `778d4d3` ≡ `main@22259b6`，四目录内容与 cf150a3 一致） |
| 授权 | Reviewer 2026-11-21 裁定 PASS WITH CORRECTIONS 后正式启动 Phase 1；本包属授权项 ②（差异核对）③（契约候选整理）④（独立 Contract Tests）⑨（IQ 与 B5–B8 登记） |
| 性质 | 候选整理与登记；**不是**冻结契约、**不是**生产实现、**不是**对任何 OPEN/待签署项的裁定 |
| 上下文恢复 | 见仓库根 `SESSION_B_CONTEXT_RECOVERY_REPORT.md` v1.2（Reviewer PASS WITH CORRECTIONS；两项勘误已落 §14） |

## 1. 本包内容

| 文件 | 作用 |
|---|---|
| `DIFF_CHECK_REPORT.md` | Mock ↔ 契约候选 ↔ 主文档三方差异核对：DIFF-CONTRACT ×12、DIFF-MOCK ×16、一致性确认 ×9 组（新发现：DIFF-CONTRACT-01/03、DIFF-MOCK-05/11） |
| `DECISION_AND_BLOCKER_REGISTER.md` | IQ-01/02/05/09/13/15/21 权威现状转录 + B5–B8 + P0/P1 现状 + 本轮新增待处置事项（权威登记 `14_` 未改动） |
| `RULE_STATUS_REGISTER.md` | 55 条规则的人工可读登记（CONFIRMED 9 / PROPOSED 26 / PENDING 8 / BLOCKED 12） |
| `rules/rule_registry.json` | 机器可读唯一源：55 条规则 + 状态词表 + 阻断引用 + file:line 证据 |
| `tools/annotate_contract.js` | 生成器：从基线候选 + registry 生成 draft，只追加 `x-*` 键；引用不可解析即拒绝生成 |
| `contract/openapi.candidate.v1.1-draft.json` | 契约候选整理稿：**零线形变更**（剥离全部 `x-*` 后与基线 deep-equal，T03 强制）；`x-contract-status` 保持 `CANDIDATE_NOT_FROZEN` |
| `tests/contract-rule-annotations.test.js` | 独立 Contract Tests ×15（Node 内建 runner，无外部依赖） |
| `TEST_REPORT.md` | 真实运行记录：15/15 通过 + 五轮迭代留痕 |

## 2. 契约候选整理方法（为什么是「注解」而不是「改写」）

1. 契约候选的线形（paths/operations/schemas/parameters/responses）是 Reviewer 已核对的对象（R1–R4 修订的对象）；在 P1/P2 与 IQ-09/B6 未决前，执行 Agent **无权改写其语义**。
2. 因此本轮以**机器可读规则登记**注入：顶层 `x-rule-registry`（55 条规则）+ 每操作 `x-rule-status` + 核心 schema/参数 `x-rule-status`，全部为 `x-*` 非线形扩展。
3. 零线形变更由测试 T03 强制（strip all x-* → deep-equal baseline），基线完整性由 T01 强制（SHA-256 `fdeec48e…1023`）。
4. 这使「每条规则标 CONFIRMED/PROPOSED/PENDING/BLOCKED」的授权要求以**可机读、可测试**的方式落到契约上，同时不产生任何"契约已修订"的假象。

## 3. 阶段一结论摘要

1. **差异核对**：Mock 与契约方向一致（身份/错误方向/包骨架），差异集中在状态枚举（B6）、错误明细承载（IQ-09）、覆盖面（Mock 实现 2/13 必需操作）、默认过滤（DIFF-MOCK-05）、证据字段（DIFF-MOCK-11）。两项候选内部矛盾（DIFF-CONTRACT-01/03）登记待维护人裁定。
2. **契约候选整理**：55 条规则全量登记并注解到 16 操作 + 20 schema + 8 参数；BLOCKED 12 条全部映射到 IQ/B/P0 阻断；IQ-01/02/13 裁定方向标 CONFIRMED 并带「待签署/未独立验收」注记。
3. **边界重申**：不宣称 Contract Freeze；不宣称生产 API 验收；不把 Mock 行为当正式契约（DIFF-MOCK 各条均为登记而非对齐声明）；未修改 `12_`/`13_`/`14_`/`15_`/`16_` 任何文件。

## 4. 下一子阶段（已准备、未开始）

授权范围内的隔离实现（独立 Contract Tests 已起步；隔离 Mock API、不连生产库的 Repository 接口、Yii2 Client 原型、OAuth2 方案）在阶段一复核后进行，实现将：
- 按契约候选线形实现 16 操作矩阵与 20 错误码（40901 按预留语义）；
- 数据全部 `DEMO_FIXTURE`、ULID 合法形态、无生产连接、无真实凭证；
- Mock 行为仍不自动成为契约——以 `x-rule-registry` 状态为准。

## 5. 复核入口（Reviewer）

```bash
cd "E:/workspace/独立站/morrishk-site-upgrade-review"
git log --oneline -3 sessionb/phase1-contract-closure
cd 25_sessionb_phase1_contract_closure
node --test tests/contract-rule-annotations.test.js   # 期望 15/15
sha256sum ../12_dsbit_business_api_integration_design/contract/openapi.candidate.v1.json   # 期望 fdeec48e…1023
```
