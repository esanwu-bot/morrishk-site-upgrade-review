# TEST REPORT · Contract Closure Draft（规则注解契约候选）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-CC-TEST-001 |
| 版本 | v1.0 |
| 日期 | 2026-11-21 |
| 分支 | `sessionb/phase1-contract-closure` |
| 被测对象 | `25_sessionb_phase1_contract_closure/contract/openapi.candidate.v1.1-draft.json` + `rules/rule_registry.json` |
| 结论 | **15/15 通过**（真实运行）；基线候选文件 SHA-256 前后一致，`12_`/`14_`/`15_`/`16_` 零改动 |
| 证据分级 | RUN = 本报告命令真实执行输出；STATIC = 哈希/结构比对 |

## 1. 测试命令（RUN）

```bash
cd "E:/workspace/独立站/morrishk-site-upgrade-review/25_sessionb_phase1_contract_closure"
node tools/annotate_contract.js          # 生成 draft（可重复执行，幂等）
node --test tests/contract-rule-annotations.test.js
sha256sum ../12_dsbit_business_api_integration_design/contract/openapi.candidate.v1.json
```

环境：Windows 10.0.19045 x64；Node.js v24.21.0（`node --test` 内建 runner）。

## 2. 生成器输出（RUN，最后一次执行）

```text
written: E:\workspace\独立站\morrishk-site-upgrade-review\25_sessionb_phase1_contract_closure\contract\openapi.candidate.v1.1-draft.json
ops annotated: 16 (expect 16)
schemas annotated: 20
parameters annotated: 8
registry rules: 55
```

## 3. 测试结果（RUN，最终一轮）

```text
✔ T01 baseline candidate is byte-identical to reviewed hash (12_ untouched) (5.4219ms)
✔ T02 draft keeps x-contract-status = CANDIDATE_NOT_FROZEN and OpenAPI 3.1.0 (0.4796ms)
✔ T03 zero wire-shape change: stripping all x-* keys from draft deep-equals baseline (8.7283ms)
✔ T04 endpoint inventory unchanged: 16 paths / 16 ops / 13 required / 3 optional (0.8989ms)
✔ T05 registry statuses use the fixed vocabulary only (0.7117ms)
✔ T06 BLOCKED rules must cite at least one known blocker; PENDING must cite blockers too (0.507ms)
✔ T07 CONFIRMED rules must cite a registered ruling / verified fact, never only design prose
✔ T08 every operation carries x-rule-status with resolvable rule ids (0.7457ms)
✔ T09 error catalog unchanged: 20 error_keys in ErrorMeta enum
✔ T10 x-open-blockers preserved exactly from baseline (6 entries)
✔ T11 critical patterns unchanged: pbk1 / req_ / tax_ / cat_ / ev_ (0.3947ms)
✔ T12 B5-B8 are represented as blocked/proposed rules
✔ T13 IQ-01/02/13 ruling directions are present as CONFIRMED rules with unsigned caveat
✔ T14 no rule is simultaneously CONFIRMED and blocked (0.3093ms)
✔ T15 draft does not claim freeze: no FROZEN status anywhere in x-* governance fields
ℹ tests 15
ℹ suites 0
ℹ pass 15
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 961.298
```

（耗时为单次运行记录值，复跑会波动；判定只看 pass/fail。）

## 4. 迭代记录（真实过程，供复核）

| 轮 | 结果 | 处置 |
|---|---|---|
| 1 | 14/15（T07 失败：`R-GLOB-01` source 仅引候选文档） | 补 source：Reviewer 报告 `FREEZE_READINESS_REVIEW.md:12,61,283-288`（已核实事实）；同时收紧 T07 增加 notes 注记校验 |
| 2 | 14/15（T07 失败：`R-ID-02` notes 缺注记） | notes 改为显式「Registered ruling…; unsigned; independent acceptance not done」 |
| 3 | 14/15（T07 失败：`R-ID-03`） | 同上补注记 |
| 4 | 14/15（T07 失败：`R-PRD-03`） | notes 补「Verified fact: field absent from contract schema…」 |
| 5 | 14/15（T07 失败：`R-EV-03`） | notes 补「Verified fact: boundary stated in Reviewer handover mandate…（handover confirmation is not an in-repo approval record）」 |
| 6 | **15/15 通过** | — |

每轮修改后均重跑生成器再跑测试；全程未修改基线文件（T01 每轮重新校验哈希）。

## 5. 关键断言说明

| 测试 | 防护目标 |
|---|---|
| T01/T03 | **零线形变更**：draft 剥离全部 `x-*` 键后与基线 deep-equal；基线文件字节级未动（SHA-256 `fdeec48e…1023`） |
| T04 | 端点清单与 13+3 分级不变（R1 修正口径保持） |
| T05–T07/T14 | 状态词表纪律：BLOCKED/PENDING 必须引用已知阻断；CONFIRMED 必须引用裁定/已核实事实并带注记；CONFIRMED 不得同时携带阻断 |
| T08 | 16 个操作全部有 `x-rule-status` 且引用可解析 |
| T09–T11 | 错误目录 20 码、`x-open-blockers` 6 项、关键 ID 模式全部原样保留 |
| T12/T13 | B5–B8 与 IQ-01/02/13 在登记中可见，且 IQ 三项 CONFIRMED 规则带「待签署/未验收」注记 |
| T15 | draft 不含任何「已冻结」表述 |

## 6. 未决事项（测试不能替决策）

见 `DECISION_AND_BLOCKER_REGISTER.md` §1–§4：IQ-05/09/15/21 裁定、IQ-01/02/13 签署与独立验收、P0-2 权威分支、B5–B8、DIFF-CONTRACT-01/03 维护人处置。本测试只保证注解不破坏契约线形，不构成任何裁定。
