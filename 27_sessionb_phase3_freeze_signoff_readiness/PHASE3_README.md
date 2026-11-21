# PHASE 3 · Contract Freeze 决策与签署准备包（Decision & Sign-off Readiness）

| 项 | 值 |
|---|---|
| 目录编号 | 27_sessionb_phase3_freeze_signoff_readiness |
| 包编号 | MRH-DSBIT-SESSIONB-PHASE3-001 |
| 版本 | v1.0-draft（决策准备材料；**不是**裁定、签署、验收或冻结记录） |
| 日期 | 2026-11-21 |
| 分支 | `docs/sessionb-phase3-freeze-signoff-readiness`（基于 Phase 2 PLAN 最终提交 `096fc36f…2d49`，未改写历史） |
| 阶段状态 | Phase 1 `PHASE1_CLOSED_PASS` → Phase 2 PLAN `REVIEW_PASS` → **Phase 3（决策与签署准备）** |
| 冻结/生产 | Contract Freeze **NOT_READY**（`CANDIDATE_NOT_FROZEN` 保持）；生产 Business API **NOT_APPROVED**；Phase 2 PLAN 通过 ≠ 冻结通过 ≠ 实施授权 |
| 性质 | 只整理正式决策材料、未决事项、签署要求与授权依赖；**不实施** Business API、不修改生产代码、不连接生产数据库、不启用真实 OAuth/Token/外部平台同步 |

## 1. 文件清单与阅读顺序

| # | 文件 | 作用 |
|---|---|---|
| 1 | `PHASE3_README.md` | 本文件 |
| 2 | `DECISION_REGISTER.md` | 全部待裁定事项统一登记表（DIFF×4 / IQ×7 / B×4 / P0-2），状态引自权威登记、零变更 |
| 3 | `CONTRACT_DECISION_MATRIX.md` | 契约决策矩阵：搜索 DTO 形态 / 缺 brand 错误码 / 默认公开过滤 / 证据字段 / 状态枚举 / 归一化编码 / 字典内容——候选方案×影响×决策人，**不替决策人选定** |
| 4 | `IQ_SIGNOFF_REGISTER.md` | IQ-01/02/13 签署与独立验收登记；IQ-05/09/15/21 书面裁定登记（签署栏空白待填，执行 Agent 不代填） |
| 5 | `B5_B8_DEPENDENCY_MATRIX.md` | B5–B8 依赖关系、关闭条件、影响面（API 操作/错误码/Scope/测试矩阵）及对 Freeze 的阻断关系 |
| 6 | `SCOPE_AUTHORIZATION_READINESS.md` | 75 组合授权准备状态：候选授权 75 / 已确认授权 0 / 正式可执行授权 0 |
| 7 | `P0_2_AUTHORITY_CONFIRMATION.md` | Ds Bit 权威分支确认请求与证据缺口（不自行认定分支） |
| 8 | `CONTRACT_FREEZE_GATE.md` | Freeze 准入条件、阻断项、签署要求、验收标准与当前结论 |
| 9 | `SELF_CHECK.md` + `tools/self_check.js` | 独立自检（含反例测试）与真实执行记录 |

## 2. 本阶段处理的未决事项（状态零变更）

| 类别 | 事项 | 状态（引自权威登记，原样保持） |
|---|---|---|
| A. API 契约差异 | DIFF-CONTRACT-01 / DIFF-CONTRACT-03 | PENDING |
| B. Mock 与公开行为差异 | DIFF-MOCK-05 / DIFF-MOCK-11 | OPEN |
| C. IQ 决策与签署 | IQ-01 / IQ-02 / IQ-13 | DECIDED（登记）+ **待签署** + **未验收** |
|  | IQ-05 / IQ-09 / IQ-15 / IQ-21 | OPEN（等待书面裁定） |
| D. 设计内部阻断 | B5 / B6 / B7 / B8 | PROPOSED / OPEN / 待 PM / OPEN |
| E. 权威分支 | P0-2 | DECISION_REQUIRED |

## 3. 边界（本阶段不做什么）

1. 不修改 Phase 1（`25_`）、Phase 2（`26_`）已审核材料；不修改 `12_`–`16_`、`13_`；不修改生产代码/数据库/部署配置。
2. 不实现任何 API Endpoint、Repository、OAuth Client 或 Token 流程；不连接生产数据；不执行真实社媒平台授权或同步。
3. 不改变任何正式决策、签署或验收状态；签署栏一律留白，由有权决策人/签署人填写。
4. 不把 Agent 自检结果写成 Reviewer 独立验收结果；不把 Reviewer 的 Phase 2 PLAN 通过解释成生产实现授权。
5. 不替决策人选定任何候选答案；本包全部"候选方案"仅为决策输入。

## 4. 自检

```bash
cd 27_sessionb_phase3_freeze_signoff_readiness
node tools/self_check.js   # 全部 PASS 时退出码 0
```

真实执行结果记录于 `SELF_CHECK.md`；最终状态候选：`PHASE3_DRAFT_COMPLETE` / `PHASE3_BLOCKED` / `PHASE3_INCOMPLETE`（由自检结果与材料完备度决定，**不自行宣布 CONTRACT_FREEZE_APPROVED**）。
