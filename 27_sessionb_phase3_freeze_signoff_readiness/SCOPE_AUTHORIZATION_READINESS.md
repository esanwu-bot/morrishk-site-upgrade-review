# SCOPE AUTHORIZATION READINESS · 75 组合 Scope × Endpoint 授权准备状态

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE3-SCOPE-001 |
| 版本 | v1.0-draft（准备状态登记；**不产生任何授权**） |
| 上游 | `26_sessionb_phase2_isolated_api_plan/SECURITY_AND_SCOPE_TEST_PLAN.md` §3（75 行完整矩阵，Reviewer 已核）+ `25_/RULE_STATUS_REGISTER.md`（R-OA-05 PROPOSED） |
| 口径 | 三级授权状态严格区分：`CANDIDATE_AUTHORIZATION`（候选，来自候选 OpenAPI/R-OA-05 PROPOSED）≠ `CONFIRMED_AUTHORIZATION`（有正式裁定依据）≠ 正式可执行授权（= CONFIRMED 依据 + 可执行）。**未经签署的授权一律不得标记为正式确认** |

## 1. 组合构成

- 5 Scope：`product.read`（S1）、`product.category.read`（S2）、`product.evidence.read`（S3）、`product.version.read`（S4）、`product.publish.read`（S5）。
- 15 业务端点：`searchProducts`、`getProduct`、`getProductStatus`、`listProductVersions`、`listProductEvidence`、`getProductCategories`、`listTaxonomies`、`getTaxonomy`、`getTaxonomyVersion`、`listCategories`、`listTaxonomyChanges`、`getCategory`、`listCategoryChildren`、`listCategoryAncestors`、`listCategoryProducts`（= 16 操作减 `issueToken`）。
- 完整 75 组合逐行矩阵位于 `26_.../SECURITY_AND_SCOPE_TEST_PLAN.md` §3（10 列结构：含规则状态列与授权依据类型列），本文件不复制 75 行，只登记**授权准备状态**并交叉引用。

## 2. 授权状态总表（与 26_ 矩阵交叉核对一致）

| 状态级 | 数量 | 说明 |
|---|---|---|
| 候选授权映射（`CANDIDATE_AUTHORIZATION`） | **75/75** | 全部行的允许/拒绝预期仅来自候选 OpenAPI security 声明 + R-OA-05 **PROPOSED**；逐行已在 26_ 矩阵第 9 列标注 |
| 已确认授权（`CONFIRMED_AUTHORIZATION`） | **0/75** | Rule Registry 中不存在 CONFIRMED 状态的 scope→endpoint 授权规则（自检跨文件核验 R-OA-05 = PROPOSED） |
| 正式可执行授权 | **0/75** | 仅 CONFIRMED 依据 + 可执行才计入；当前为 0，如实报告，不得推断为 70 |
| 授权规则待裁定 | **75/75** | R-OA-05 PROPOSED：全部组合的授权结果须待授权规则裁定/冻结后方可计入正式行为验收 |
| 其他业务语义待裁定（叠加） | 5/75 | 行 1（DIFF-CONTRACT-01）、27（P1-3）、30（DIFF-MOCK-05）、35（B8）、63（B6） |

按 scope 分布（全部为 CANDIDATE_AUTHORIZATION）：S1 = 15 组合（2 允许候选 / 13 拒绝候选）；S2 = 15（8 允许 / 7 拒绝）；S3 = 15（1 允许 / 14 拒绝）；S4 = 15（3 允许 / 12 拒绝）；S5 = 15（1 允许 / 14 拒绝）。允许行 15 中 5 行叠加业务语义阻断。

## 3. 从候选到正式授权的路径（准备清单，非执行）

| 步骤 | 内容 | 责任方 | 产物 |
|---|---|---|---|
| SA-1 | R-OA-05（五 scope + 缺 scope 403 不降级 + internal_only 双 scope + 同步最小授权集）由决策方书面裁定/采纳 | Reviewer + Ds Bit 负责人（登记口径） | Registry R-OA-05 状态升级记录（CONFIRMED 需独立裁定依据） |
| SA-2 | 26_ 矩阵逐行「授权依据类型」按 SA-1 结果刷新（75 行 CANDIDATE_AUTHORIZATION → CONFIRMED_AUTHORIZATION 或维持候选并注明） | 执行 Agent（获授权后） | 矩阵更新 + 新 commit |
| SA-3 | 实施期 75 组合 RUN 记录（隔离 Runtime） | 执行 Agent | RUN 矩阵 |
| SA-4 | 正式可执行授权 = CONFIRMED 依据 ∩ RUN 完成；计入正式验收 | Independent Reviewer | 验收记录 |

**当前进度**：SA-1 未发生（R-OA-05 PROPOSED）→ SA-2..SA-4 均未启动。**正式可执行授权 = 0/75**。

## 4. 禁止事项重申

1. 不得把 75 组合候选授权称为"已有正式授权"或"可执行授权"。
2. 不得把候选 OpenAPI security 声明自动提升为已裁定授权规则（Reviewer R5 口径）。
3. 未经签署，任何组合不得标记为正式确认。
4. 双 scope 复合语义（internal_only 等）不在 75 单 scope 矩阵内，属 SEC-08 独立测试，同样处于候选状态。
