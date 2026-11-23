# Scope × Endpoint 授权状态（75 项）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-P02-SCOPE-001 |
| 版本 | v1.0（只读核验；不产生任何授权） |
| 日期 | 2026-11-23 |
| 上游 | `26_/SECURITY_AND_SCOPE_TEST_PLAN.md` §3；`27_/SCOPE_AUTHORIZATION_READINESS.md`；`25_/rules/rule_registry.json`（R-OA-05） |
| 结论 | 候选 75/75；已确认 0/75；**正式可执行 0/75**；待裁定 75/75 |

## 1. 矩阵构成

- 5 个 Scope：`product.read`（S1）、`product.category.read`（S2）、`product.evidence.read`（S3）、`product.version.read`（S4）、`product.publish.read`（S5）。
- 15 个业务端点：`searchProducts`、`getProduct`、`getProductStatus`、`listProductVersions`、`listProductEvidence`、`getProductCategories`、`listTaxonomies`、`getTaxonomy`、`getTaxonomyVersion`、`listCategories`、`listTaxonomyChanges`、`getCategory`、`listCategoryChildren`、`listCategoryAncestors`、`listCategoryProducts`。
- 15 业务端点 = 16 操作 − `issueToken`（token 端点不在越权矩阵）。
- 组合总数：5 × 15 = **75**。

## 2. 授权状态总表

| 状态级 | 数量 | 含义 | 是否可执行 |
|---|---:|---|---|
| 候选授权映射 `CANDIDATE_AUTHORIZATION` | **75/75** | 仅来自候选 OpenAPI security 声明 + `R-OA-05` **PROPOSED** | 否 |
| 已确认授权 `CONFIRMED_AUTHORIZATION` | **0/75** | 无 CONFIRMED 状态的 scope→endpoint 授权规则 | 否 |
| **正式可执行授权** | **0/75** | 必须同时满足 CONFIRMED 依据 + 可执行 RUN | **否** |
| 授权规则待裁定 | **75/75** | `R-OA-05` 仍为 PROPOSED，所有组合待裁定 | 否 |
| 其他业务语义待裁定（叠加） | 5/75 | 行 1（DIFF-CONTRACT-01）、27（P1-3）、30（DIFF-MOCK-05）、35（B8）、63（B6） | 否 |

## 3. 候选允许/拒绝分布（仅候选语义，不是授权）

| Scope | 组合数 | 候选允许 | 候选拒绝 | 说明 |
|---|---:|---:|---:|---|
| S1 `product.read` | 15 | 2 | 13 | 行 1 允许但叠加 DIFF-CONTRACT-01 |
| S2 `product.category.read` | 15 | 8 | 7 | 行 27 允许但叠加 P1-3；行 30 允许但叠加 DIFF-MOCK-05 |
| S3 `product.evidence.read` | 15 | 1 | 14 | 行 35 允许但叠加 B8 证据范围 |
| S4 `product.version.read` | 15 | 3 | 12 | — |
| S5 `product.publish.read` | 15 | 1 | 14 | 行 63 允许但叠加 B6 状态枚举 |
| **合计** | **75** | **15** | **60** | 75 行规则状态均为 `PROPOSED`、授权依据均为 `CANDIDATE_AUTHORIZATION` |

> 允许/拒绝是**候选预期**，不是已批准权限。5 个允许行同时受业务语义阻断，不能计入正式行为验收。

## 4. 当前能执行多少项？

**0/75。**

- `R-OA-05` 仍为 `PROPOSED`，不存在 CONFIRMED 的 scope→endpoint 授权规则。
- 75 行矩阵均为 `CANDIDATE_AUTHORIZATION`。
- 没有正式 RUN 矩阵（SA-3 未启动）。
- 客户正式启动属于业务前提，不自动把候选授权转换为 CONFIRMED 或正式可执行授权。

## 5. 从候选到正式授权的路径

| 步骤 | 内容 | 责任方 | 当前状态 |
|---|---|---|---|
| SA-1 | `R-OA-05` 由决策方书面裁定/采纳（五 scope + 缺 scope 403 不降级 + `internal_only` 双 scope + 同步最小授权集） | Reviewer + Ds Bit 负责人 | **未发生** |
| SA-2 | 26_ 矩阵逐行刷新“授权依据类型”（CANDIDATE → CONFIRMED 或维持候选并注明） | 执行 Agent（获授权后） | 未启动 |
| SA-3 | 75 组合隔离 Runtime RUN 记录 | 执行 Agent | 未启动 |
| SA-4 | 正式可执行授权 = CONFIRMED 依据 ∩ RUN 完成；独立 Reviewer 验收 | Independent Reviewer | 未启动 |

**当前进度：SA-1 未发生 → SA-2..SA-4 均未启动 → 正式可执行 = 0/75。**

## 6. 边界与禁止事项

1. 不得把 75 项候选授权称为“已有正式授权”或“可执行授权”。
2. 不得把候选 OpenAPI security 声明自动提升为已裁定授权规则。
3. 未经签署/裁定，任何组合不得标记为正式确认。
4. 双 scope/`internal_only` 复合语义不在 75 单 scope 矩阵内，属独立安全测试，同样为候选状态。
5. 客户启动、合同签署或项目排期均不等于 75 项接口授权；需分别取得授权规则裁定、RUN 证据与验收记录。

## 7. 证据

- `evidence/scope_matrix_counts.txt`：75 行、5×15、15 允许候选/60 拒绝候选、5 个业务阻断行。
- `evidence/contract_status.txt`：16 paths / 16 operations、`CANDIDATE_NOT_FROZEN`、契约 SHA-256。
- `evidence/rule_registry_counts.txt`：55 条规则、R-OA-05 = PROPOSED、摘要计数不一致。
- `27_/SCOPE_AUTHORIZATION_READINESS.md:20-23,37`。
- `26_/SECURITY_AND_SCOPE_TEST_PLAN.md` §3（75 行完整矩阵）。