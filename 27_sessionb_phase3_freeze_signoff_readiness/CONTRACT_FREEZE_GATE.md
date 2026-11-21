# CONTRACT FREEZE GATE · 准入条件、阻断项、签署要求与验收标准

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE3-GATE-001 |
| 版本 | v1.0-draft（门槛登记；**当前结论 = NOT_READY**，不自行宣布任何通过） |
| 上游 | `16_/FREEZE_READINESS_REVIEW.md` §5.2 关闭顺序；`14_/PHASE0_OPEN_QUESTIONS_MATRIX.md` §4 冻结门槛；`12_/API_CONTRACT_CANDIDATE_v1.md` §11/§14 |
| 口径 | 全部 G1–G6 达成只是 Freeze 的必要条件集合；最终由 Independent Reviewer 出具冻结记录（Agent 不得自授） |

## 1. 准入门槛（G1–G6）与当前状态

| Gate | 内容 | 关闭所需 | 当前状态 | 本包对应材料 |
|---|---|---|---|---|
| **G1** | Phase 0 七项 IQ 全部书面裁定并登记 + IQ-01/02/13 签署 + 独立验收 | 决策人裁定 4 项 OPEN；签署人签署 3 项；非执行 Agent 验收 3 项 | **3/7 裁定；0/3 签署；0/3 验收** | `IQ_SIGNOFF_REGISTER.md`（登记+空白签署栏） |
| **G2** | Ds Bit 权威分支书面确定 + 干净提交五项复验 | 决策人指定分支/SHA/工作树口径；五项复验记录 | **未确定（DECISION_REQUIRED）** | `P0_2_AUTHORITY_CONFIRMATION.md`（确认请求文本） |
| **G3** | B5 冻结（归一化+编码）+ B6 统一（状态命名） | 评审冻结方 + 维护人书面决定 | **均未关闭** | `B5_B8_DEPENDENCY_MATRIX.md` §2/§3 |
| **G4** | B7 种子提交 + B8 口径统一并裁定/豁免 | PM 种子；法务/业务裁定 | **均未关闭** | `B5_B8_DEPENDENCY_MATRIX.md` §4/§5 |
| **G5** | 契约语义修正（P1-1…P1-10 处理或书面豁免）+ `x-open-blockers` 补齐（含 B7/B8） | 维护人修订候选 + Reviewer 复核 | **未处理**（P1 全集在册：`16_:216-229`） | `CONTRACT_DECISION_MATRIX.md`（CM-1..CM-7 预告修订范围） |
| **G6** | Independent Reviewer 出具独立冻结记录（范围/版本/SHA-256/生效条件） | 以上全部达成 | **无冻结记录** | — |

## 2. 当前阻断项清单（全部未关闭）

| 阻断 | 归属 Gate | 登记 |
|---|---|---|
| IQ-05/09/15/21 未裁定 | G1 | P0-1 |
| IQ-01/02/13 未签署未验收 | G1 | P0-3 |
| P0-2 权威分支未定 | G2 | P0-2 |
| B5 未冻结 | G3 | P0-4 |
| B6 未统一 | G3 | P0-5 |
| B7 未提交 | G4 | P0-6 |
| B8 未裁+口径不一致 | G4 | P0-7 |
| P1-1..P1-10 未处理 | G5 | Freeze 报告 §4.2 |
| DIFF-CONTRACT-01/03、DIFF-MOCK-05/11 | G5（随 CM-1..CM-4 裁定） | `25_/DIFF_CHECK_REPORT.md` |

## 3. 签署要求汇总

| 文件 | 签署内容 | 签署方 |
|---|---|---|
| `14_/DECISION_REGISTER.md` §2 | IQ-01/02/13 签署 + IQ-05/09/15/21 裁定录入 | 决策人/签署人（待指定） |
| 五项复验记录 | 干净提交复验结论 | 非执行 Agent |
| B5 冻结记录 | MPN-NORM-v1 + pbk 编码 + 向量化证据 | 评审冻结方 |
| B6 统一记录 | 三命名空间命名/映射 | 设计文档维护人 |
| B7 登记记录 | 种子来源与版本 | PM |
| B8 裁定记录 | 口径统一 + 公开白名单 | 法务/业务 + 维护人 |
| 冻结记录（最终） | 冻结范围/版本/SHA-256/生效条件 | Independent Reviewer |

## 4. 验收标准（冻结记录须载明）

1. 冻结对象：`12_/contract/openapi.candidate.v1.json` 的冻结版 SHA-256 + `API_CONTRACT_CANDIDATE_v1.md` 冻结版 SHA-256；
2. 全部 G1–G6 关闭证据的引用清单；
3. 保留 OPEN 的 Phase 2/4 事项清单（IQ-07/10/11/14/17/18/19/22 等）及其不影响冻结的理由；
4. `x-contract-status` 从 `CANDIDATE_NOT_FROZEN` → `FROZEN` 的生效条件与日期；
5. 冻结后变更控制：不兼容变更升 `/api/v2` 或重新裁定（候选 §14）。

## 5. 当前结论

**Contract Freeze = NOT_READY。**

- G1：3/7 裁定（0 签署、0 验收）；G2：未确定；G3：B5/B6 未关；G4：B7/B8 未关；G5：P1 全集未处理；G6：无冻结记录。
- 本结论与 `16_/FREEZE_READINESS_REVIEW.md`（NOT_READY）及 `x-contract-status = CANDIDATE_NOT_FROZEN` 一致。
- 本文件不宣布 CONTRACT_FREEZE_APPROVED；生产 Business API 维持 NOT_APPROVED；Phase 2 PLAN 通过不构成冻结或实施授权。
