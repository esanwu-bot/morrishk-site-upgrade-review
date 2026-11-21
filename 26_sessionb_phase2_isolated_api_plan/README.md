# 26 · Session B Phase 2 — 隔离 API 实施计划（PLAN 包）

| 项 | 值 |
|---|---|
| 目录编号 | 26_sessionb_phase2_isolated_api_plan |
| 包编号 | MRH-DSBIT-SESSIONB-PHASE2-PLAN-001（主计划） |
| 版本 | v0.1-draft |
| 日期 | 2026-11-21 |
| 分支 | `docs/sessionb-phase2-isolated-api-plan`（基于阶段一基线 `069ab827…4a88`，未 amend/rebase） |
| 性质 | **计划与设计**；不是实现、不是验收报告、不构成授权 |
| 阶段状态 | Phase 1 CLOSED (`PHASE1_CLOSED_PASS`) → **Phase 2 PLAN（本轮）** → Phase 2 IMPLEMENTATION（待 Reviewer 裁定 PASS + 用户明确授权） |
| 冻结/生产 | Contract Freeze **NOT_READY**；Production API **NOT_APPROVED** |

## 1. 文件清单与阅读顺序

| 顺序 | 文件 | 作用 |
|---|---|---|
| 1 | `PHASE2_IMPLEMENTATION_PLAN.md` | 主计划：目标/范围/四个工作流（W-1..W-4）/阻断总览/纪律 |
| 2 | `API_OPERATION_TEST_MATRIX.md` | 16 操作 × 正常/异常/边界 × 错误码 × 规则状态（含 BLOCKED_BY_DECISION） |
| 3 | `ERROR_CODE_TEST_MATRIX.md` | 20 错误码 × 触发/字段/重试/场景（40901 预留负向） |
| 4 | `SECURITY_AND_SCOPE_TEST_PLAN.md` | 13 组安全场景 + T1/T2/T3 三身份分离 + 越权矩阵计划 |
| 5 | `REPOSITORY_INTERFACE_PLAN.md` | 隔离接口计划（无数据库；身份三不变式；DuckDB/S3 适配占位） |
| 6 | `YII2_CLIENT_PLAN.md` | Yii2 Client 原型计划（Bearer/重试/错误映射/缓存/脱敏） |
| 7 | `OAUTH2_INTEGRATION_PLAN.md` | 三条信任链设计 + RS 六步校验 + 本地验证计划（不生成凭证） |
| 8 | `FIXTURE_DATA_SPEC.md` | DEMO_FIXTURE 数据规范（合法 ULID；F-01..F-09 状态覆盖矩阵） |
| 9 | `BLOCKER_AND_DEPENDENCY_REGISTER.md` | 全部阻断项 → 操作/测试/组件影响映射（状态原样保持） |
| 10 | `TEST_AND_ACCEPTANCE_CRITERIA.md` | 实施期验收标准（A–D 门槛 + E 否决项） |
| 11 | `SELF_CHECK.md` + `tools/self_check.js` | 独立自检清单与脚本（真实执行） |
| 12 | `README.md` | 本文件 |

## 2. 边界重申

1. 不修改 `12_`/`13_`/`14_`/`15_`/`16_`；不修改阶段一任何文件；不 amend/rebase。
2. 无生产数据库/Redis/S3/服务连接；无真实凭证；无生产 OAuth 应用。
3. DIFF-CONTRACT-01/03、DIFF-MOCK-05/11、IQ 七项、B5–B8、P0-2 状态**原样保持**，实施不得关闭。
4. 本包全部"预期结果"为获批实施后的验收目标，非现状断言。

## 3. 自检

```bash
cd 26_sessionb_phase2_isolated_api_plan
node tools/self_check.js   # 全部 PASS 时退出码 0
```

真实执行结果记录于 `SELF_CHECK.md`。
