# R2.2.10-F 修订执行报告

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-025 |
| 版本 | v1.0-R2.2.10-F |
| 日期 | 2026-11-25 |
| 状态 | **REVISION_APPLIED_NOT_APPROVED** |
| 父提交 | `d9354a00074b0655b4e6738b9f8b79f70d4bddab` |
| 设计内容基线（修订前） | `11cd1aecc60dac0654b813b16208bae16b8bc9be` |
| 性质 | 仅文档修订；不是架构批准、不是 Contract Freeze、不是实施授权 |
| 依据 | `reviewer/SESSIONF_R2_2_10_OWNER_SIGNOFF_INDEPENDENT_REVIEW.md`（结论 `NOT_READY_FOR_OWNER_SIGNOFF`） |

## 1. 授权与范围

- Owner 授权范围：F-01～F-09 指定文档修订。
- 本轮修改文件：`00`、`03`、`04`、`06`、`07`、`24`、`25`（本文件）、设计 `SHA256SUMS`、`DESIGN_AND_TEST_SHA256SUMS.txt`。
- 归档文件：`reviewer/SESSIONF_R2_2_10_OWNER_SIGNOFF_INDEPENDENT_REVIEW.md`（审查结论未改动）。
- 未修改：源代码、数据库 schema、API、OAuth、运行时、OpenAPI、75 矩阵、83 项证据内容。
- 未执行：SQL/DDL、数据库连接、测试执行、部署、推送、合并。
- 修订性质：仅文档澄清（证据引用、基线、状态声明、事务/角色措辞与编号），不改变设计行为、数据库约束或任何状态门槛。

## 2. F-01～F-09 逐项修订

| ID | 修改文件/章节 | 修订结果 |
|---|---|---|
| F-01 | `24` 表头“技术复核”、§5“独立复核” | 删除未经证实的 Reviewer PASS；改为引用真实独立报告的 `NOT_READY_FOR_OWNER_SIGNOFF`，并明确“等待下一轮独立复核”；报告已归档 |
| F-02 | `24` 表头“设计内容基线/签署包提交”、新增 §1.1、§5“签署包提交” | 明确 `11cd1ae` 仅为修订前设计内容基线，不包含 `24` 与更新清单；签署以包含 `24` 的 R2.2.10-F 子提交为准；不把后续内容伪装成旧基线 |
| F-03 | `24` §3 第 6 项、§5 P0-2 行 | 改为“1 PASS / 4 FAIL：解析输出/证据 PASS（解析范围）；产品身份、全局 ID、静态 B2B 桩、后端实现 FAIL”；明确本设计不关闭 P0-2 |
| F-04 | `07` §2.7/§2.8 标题；`24` §3 第 5 项 | 标题改为 V-95…V-102、V-103…V-107；24 改为 V-71…V-107；未新增/删除任何测试项 |
| F-05 | `03` §4.4 第 7 项；`04` §8 第 6 项；`06` §8.11 两处 | 统一最终事务对象清单，明确包含 `tenant_assertion.status=ACCEPTED_BY_GLOBAL` 与 `global_decision_ref` 回写；不改变设计行为 |
| F-06 | `03` §4.4 第 3 项；`04` §3.3.3 第 9 项；`06` §8.12 | 明确 DB 只强制“不同 principal/状态一致/单有效域/域与角色匹配”，不强制四个 principal 实际持有对应角色；角色资格由应用层校验，不宣称 DB 已强制 |
| F-07 | `06` §7.1 R2.1-O7 | `V-66…V-70` 改为 `V-67…V-70`，与 `07` 及 `12` 一致 |
| F-08 | `24` §2 引言、新增 §2.7、§5 | 为 D-01…D-49 补充 Agent 推荐依据与影响范围；明确 Agent 推荐、Reviewer 程序性建议、Owner 决策三者边界；未代替 Owner 决策 |
| F-09 | `24` 表头、§3 第 7 项、§5；`00` §7 说明 | 删除“R2.2.x 技术问题已闭环”类表述；明确文档修订完成 ≠ 技术验证完成；保留 pending 去重、隔离级别、DDL 未验证、V-71…V-107 未执行等 OPEN 项 |

## 3. 校验与证据

| 项 | 结果 |
|---|---|
| 设计 `SHA256SUMS` | 26 条，全部 OK（含本文件） |
| `DESIGN_AND_TEST_SHA256SUMS.txt` | 36 条，全部 OK（26 设计 + 设计清单 + 9 项证据） |
| 83 项证据 | Git Blob `690d62971f222df213a89529ebc785180c41dfd9`；与 `11cd1ae`、`d9354a0` 一致；内容未修改 |
| 独立 Reviewer 报告 | 已归档；SHA-256 `355df5e3896e7c6d3ff49a94ddc424b65bfb485b65cbd94fea1e672b872986f1`；结论未改动 |
| `git diff --check` / `git show --check` | `git diff --check` 提交前执行；`git show --check` 提交后执行；无空白错误 |
| docs-only 检查 | 变更路径仅设计文档、Reviewer 报告与 SHA 清单；无源码/DB/API/OAuth/OpenAPI |
| 提交 | 独立 docs-only 提交；父 `d9354a0`；不 amend/rebase；不 push/merge/deploy |

## 4. 未解决事项（OPEN）

1. 跨 document/import 的身份级 pending 去重规则仍待决。
2. 具体隔离级别、事务重试/退避、连接池实现需实现期确定。
3. DDL、CHECK、唯一索引、复合外键、触发器尚未生成或执行；需实现期验证。
4. F-06 的角色资格仍由应用层强制；DB 未对 principal 字段建立到 `principal_role` 的外键。是否增加该约束属设计/实现决策，本轮未改 schema。
5. V-71…V-107 全部为设计测试，未执行；83 项历史证据不覆盖这些场景。
6. D-01…D-49 全部仍为 `PROPOSED_NOT_APPROVED`，等待 Owner 决策。
7. 本轮修订后仍需下一轮独立 Reviewer 复核；本文件不构成复核通过。

## 5. 状态门槛（保持）

| 门槛 | 状态 |
|---|---|
| `ARCHITECTURE_APPROVED` | **NO** |
| `CONTRACT_FROZEN` | **NO** |
| `P0_2_CLOSED` | **NO** |
| `BUSINESS_API_IMPLEMENTATION_AUTHORIZED` | **NO** |
| `PRODUCTION_READY` | **NO** |
| 独立复核 | **NOT_READY_FOR_OWNER_SIGNOFF**（本轮修订后待复核） |

## 6. 提交说明

- 提交类型：docs-only；父提交 `d9354a0`。
- 提交内容：F-01～F-09 文档修订、Reviewer 报告归档、26 条设计清单与 36 条合并清单。
- 未推送、未合并、未部署；等待 Owner 决定是否进入下一轮独立复核。