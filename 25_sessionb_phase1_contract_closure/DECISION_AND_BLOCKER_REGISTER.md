# DECISION AND BLOCKER REGISTER · IQ 决策登记与阻塞项清单（Phase 1 工作副本）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-DECREG-001 |
| 版本 | v1.0 |
| 日期 | 2026-11-21 |
| 分支 | `sessionb/phase1-contract-closure` |
| 性质 | **工作副本/索引**：转录 Phase 0 权威登记现状供本轮工作引用；**权威登记仍是** `14_phase0_authority_adjudication/DECISION_REGISTER.md`（未改动）。执行 Agent 不得代填签署人/裁定/验收结论 |
| 状态口径 | `DECIDED`（已登记裁定）≠ 已签署 ≠ 已验收；`OPEN` 未关闭；空白行 = 未裁定 |

## 1. Phase 0 七项 IQ 状态（权威现状转录）

| IQ | 问题 | 权威登记位置 | 状态 | 签署 | 独立验收 | 本轮对应规则 |
|---|---|---|---|---|---|---|
| IQ-01 | 产品身份权威与 ID 空间 | `14_/DECISION_REGISTER.md:31`（裁定全文 §2.1 `:42-59`） | **DECIDED**（2026-11-17，MPN+Brand） | **待签署**（§2.4 `:92`，签署人未指定） | **未完成** | R-ID-01/02/03（CONFIRMED）；R-ID-04/05/06（PROPOSED/B5）；R-ID-07（PENDING） |
| IQ-02 | 技术分类归属、种子、多体系 | `14_/DECISION_REGISTER.md:32`（§2.2 `:61-72`） | **DECIDED**（技术分类归 Ds Bit；PM 种子；两套分类硬隔离） | **待签署**（`:93`） | **未完成** | R-TAX-01/03；R-DIC-01/02/03 |
| IQ-05 | 分类保留期与 410 时机 | `14_/DECISION_REGISTER.md:33`（**空行**） | **OPEN**（材料：`IQ05_IQ09_IQ15_IQ21_DECISION_BRIEFS.md` §IQ-05） | — | — | R-TAX-04（BLOCKED） |
| IQ-09 | 错误响应包最终形状 | `14_/DECISION_REGISTER.md:34`（**空行**） | **OPEN**（材料 §IQ-09） | — | — | R-ENV-01/02（BLOCKED） |
| IQ-13 | 对接目标 | `14_/DECISION_REGISTER.md:35`（§2.3 `:74-83`） | **DECIDED**（新平台业务库） | **待签署**（`:94`） | **未完成** | R-GLOB-03（CONFIRMED）；R-PRD-03 |
| IQ-15 | 新表引擎与字符集 | `14_/DECISION_REGISTER.md:36`（**空行**） | **OPEN**（材料 §IQ-15） | — | — | （不改线形；阻断持久化选型，本包无对应 wire 规则） |
| IQ-21 | 是否允许非生产凭证 | `14_/DECISION_REGISTER.md:37`（**空行**） | **OPEN**（材料 §IQ-21） | — | — | R-OA-06（BLOCKED）；R-OA-01（PROPOSED） |

汇总：已裁定 **3/7**（均待签署、未独立验收）；未裁定 **4/7**（IQ-05/09/15/21）。
**待行动**：① 决策人裁定四项 OPEN 并填入 `DECISION_REGISTER.md` §2 对应空行；② 指定签署人完成三项签署；③ 非执行 Agent 完成三项独立验收并留验收记录。

## 2. B5–B8 设计内部阻断（契约候选 §11.2 + Freeze 报告 P0-4…P0-7）

| 编号 | 阻塞内容 | 状态 | 责任人（按登记） | 关闭条件 | 本轮对应规则 |
|---|---|---|---|---|---|
| **B5** | MPN-NORM-v1 规则集 + `pbk1_` 编码未评审冻结（P0-4） | PROPOSED | 评审冻结方（Reviewer/设计评审，对 IQ-01「不在裁定内」项定稿）；执行 Agent 不得自行定稿 | 书面冻结 + 向量化测试证据（同输入跨版本可复算） | R-ID-05/06（PROPOSED）；R-ID-04 |
| **B6** | 闸门/`visible_state`/`release_state` 三命名空间不统一（P0-5） | OPEN | 设计文档维护人书面统一；执行 Agent 不得改名/合并 | 统一命名或映射写入契约 | R-ST-02/03/04（BLOCKED）；R-ST-01 |
| **B7** | 技术参数字典正式种子与命名标准未提交（P0-6） | 待 PM | **PM**（IQ-02 裁定后责任） | PM 提交种子与命名标准，冻结记录登记来源与版本 | R-DIC-02（BLOCKED）；R-DIC-01/04 |
| **B8** | 证据公开范围未裁 + 文档口径不一致（P0-7） | OPEN | 先由 Reviewer+维护人统一口径；范围裁定 = 客户法务/业务（IQ-08 决策人） | 统一口径→裁定范围或书面豁免 | R-EV-02（BLOCKED）；R-EV-01；R-EV-03（边界 CONFIRMED） |

## 3. Freeze 报告 P0 清单现状（引用，不重复展开）

| 编号 | 内容 | 状态 | 证据 |
|---|---|---|---|
| P0-1 | 四项 Phase 0 IQ OPEN 且契约影响未闭合 | 未关闭 | `FREEZE_READINESS_REVIEW.md:158-164` |
| P0-2 | Ds Bit 权威分支 + 干净提交五项复验 | 未关闭（分支仍 `DECISION_REQUIRED`；`icpdf-extractor` 仍为 `backup/full-local-20261114@600439a` + 不干净工作树） | `:166-176`；`14_/DSBIT_AUTHORITY_BASELINE.md` §1 |
| P0-3 | IQ-01/02/13 未签署未验收 | 未关闭 | `:178-183`；`DECISION_REGISTER.md:90-101` |
| P0-4…P0-7 | B5/B6/B7/B8 | 未关闭 | `:185-214` |
| P1-1…P1-10 | 契约语义缺陷（sort/X-Request-Id/CategoryDetail/token 错误体/单 taxonomy/x-open-blockers/撤销/expires_in/visible_state 分工/证据分页） | 待解决或书面豁免 | `:216-229`（本轮 DIFF_CHECK_REPORT §2.1 逐条对应 DIFF-CONTRACT-04…11） |
| P2-1…P2-8 | 记录项 | 冻结记录一并说明 | `:233-242` |

## 4. 本轮新增、需决策人/维护人处置的事项（来自差异核对）

| # | 事项 | 来源 | 处置路径 |
|---|---|---|---|
| 1 | DIFF-CONTRACT-01：搜索条目形状（OpenAPI items=Product[] vs EX-17 扁平行） | `25_/DIFF_CHECK_REPORT.md` §2.1 | 设计文档维护人裁定后修订候选（执行 Agent 不改） |
| 2 | DIFF-CONTRACT-03：EX-17「缺 brand→400」说明与 MD §6.4/候选 §4.5「422」冲突 | 同上 | 维护人更正示例文档 |
| 3 | DIFF-MOCK-11：`ACCEPTANCE_PACKAGE.md:134`「页码/bbox/原文」声明与 Mock 实际数据（仅 evidence_ids）不符 | 同上 §2.2 | 提请 Reviewer 在 PASS_MOCK 复核时确认该声明偏差；不影响 15_ 基线哈希 |
| 4 | DIFF-MOCK-05：Mock search 默认未过滤 RELEASED | 同上 | 隔离 Mock API 按契约实现；Mock 基线不改 |
| 5 | R1–R4 交接确认的仓库内批准记录 | `SESSION_B_CONTEXT_RECOVERY_REPORT.md` §6/§14 | Reviewer 落库（更新 `16_` 状态或补确认记录） |

## 5. 明确不做（本轮登记边界）

- 不代填 `DECISION_REGISTER.md` 任何空白列；不改动 `14_` 权威登记；
- 不把 HANDOVER-CONFIRMED 写成 IN-REPO APPROVAL；
- 不把 `DECIDED` 写成已签署/已验收；
- 不在本包宣称 Contract Freeze、生产实现、生产 OAuth2、生产数据库、真实同步已获任何批准。
