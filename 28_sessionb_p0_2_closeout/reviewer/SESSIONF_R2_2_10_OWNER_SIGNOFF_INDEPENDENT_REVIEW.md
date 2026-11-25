# SESSIONF_R2_2_10_OWNER_SIGNOFF_INDEPENDENT_REVIEW

> 归档说明：本报告由后续 R2.2.10-F docs-only 修订提交归档；归档不改变审查结论（NOT_READY_FOR_OWNER_SIGNOFF），也不构成 Owner 决策或架构批准。

| 项 | 值 |
|---|---|
| 审查对象 | R2.1 + R2.2.10 设计包及 Owner 签署包 |
| 仓库 | `E:\workspace\.scratch\morrishk-commercial-signoff` |
| 分支 | `docs/sessionb-product-identity-global-id-design` |
| 实际 HEAD / 远端 | `d9354a00074b0655b4e6738b9f8b79f70d4bddab` / `d9354a0`（一致） |
| 基线 | `dfde642`；R2.1 `4a0448c`；R2.2.10 `11cd1ae`；签署包提交 `d9354a0` |
| 审查日期 | 2026-11-25 |
| 审查结论 | **NOT_READY_FOR_OWNER_SIGNOFF** |
| 性质 | 独立只读审查；不是架构批准、不是 Contract Freeze、不是实施授权 |

## 1. Reviewer 独立性声明

- 本轮仅执行只读审查，并只新增本报告文件。
- 未修改任何被审查的设计、决策、测试向量或哈希清单文件。
- 审查当时未提交、未推送、未合并、未 amend、未 rebase；报告由后续 R2.2.10-F docs-only 修订提交归档。
- 未执行 SQL、DDL、迁移、OAuth/API 实现或生产操作。
- 未触碰 `E:\workspace\icpdf-extractor`、OpenAPI、75 项矩阵、DB、stash。
- 工作区存在未跟踪目录 `31_customer_commercial_pack/`，与本审查对象无关；未清理、未移动、未 stash。

## 2. 实际 Git 状态与提交链

### 2.1 实际状态

| 项 | 实际值 | 与报告值 |
|---|---|---|
| 分支 | `docs/sessionb-product-identity-global-id-design` | 一致 |
| HEAD | `d9354a0` | 一致 |
| 远端同名分支 | `d9354a0` | 一致 |
| 工作区 | 无已跟踪修改；仅 `?? 31_customer_commercial_pack/` | 无并行已跟踪修改 |
| R2.1 提交 | `4a0448c`，是 HEAD 祖先 | 一致 |
| R2.2.10 | `11cd1ae`，是 HEAD 祖先 | 一致 |
| 签署包提交 | `d9354a0`，仅新增/更新 24、00、两份 SHA 清单 | 见 §5 |

### 2.2 提交链

```text
dfde642  R2 Morrishk-first
4a0448c  R2.1 alias brand context / attribution / token context
b150aca  R2.2 alias / attribution / approval-chain / evidence
381f46c  R2.2.1 alias time semantics / composite FK / approval transaction
c6e8f54  R2.2.2 alias rules / principal / approval state
ab93dce  R2.2.3 global product bypass / principal domain / audit scopes
54f7957  R2.2.4 principal binding keys / pending reason / alias scope
4945714  R2.2.5 V-11 concurrency semantics
12c60eb  R2.2.6 V-26 same/different key
90d18a8  R2.2.7 idempotency key scope
c3df466  R2.2.8 request fingerprint / import atomicity
0aeb81e  R2.2.9 conflict-safe unique-key race
11cd1ae  R2.2.10 SAVEPOINT vs snapshot refresh
d9354a0  Owner signoff package (24) + manifest updates
```

- `4a0448c` 变更 12 个文件（+585/−88），全部为设计文档与清单。
- `11cd1ae` 变更 8 个文件（+133/−27），仅 04/06/07/22/00/23 与清单。
- `d9354a0` 变更 4 个文件：`24_OWNER_SIGNOFF_PACKAGE.md`（新增）、`00_DESIGN_OVERVIEW.md`、设计 `SHA256SUMS`、`DESIGN_AND_TEST_SHA256SUMS.txt`。
- `4a0448c..HEAD` 的变更路径均为设计包文档与哈希清单，无源码、DDL、OpenAPI、DB、OAuth 或生产文件。

## 3. R2.1 六项要求继承审查

| # | 要求 | 实际证据 | 结果 |
|---|---|---|---|
| 1 | MPN Alias Brand 上下文及解析顺序 | `04` §3 `mpn_alias.brand_id NOT NULL`（04:125）；`02` §4.6（02:134-146）；`04` §3.3 先锁定 Brand（04:359）；`01` §6.5（01:137-144） | **PASS** |
| 2 | Alias 唯一约束、scope/tenant 约束、有效期、重叠、失效重分配 | `01` §6.5.1（01:151-200）；`02` §4.6（02:141-159）；`04` §3.3.1（04:367-415）；`06` §4（06:86-87） | **PASS** |
| 3 | Global / Tenant 身份归属与审计边界 | `06` §8.12 三类归属（06:422-475）；`10` §2/§4 B-09/B-10（10:45-52、10:78-79）；`04` §3.3.2（04:417-467） | **PASS** |
| 4 | `tenant_evidence` Site 边界、tenant 一致性、来源追溯 | `04` §3（04:172-183）；`06` §4（06:82）；`10` B-11（10:80）；V-65/V-66（07:159-160） | **PASS** |
| 5 | Tenant Assertion 与 Global Adjudication 分层；客户确认不得直写 `global_product` | `03` §4.4（03:155-238）；`04` §3（04:185-220）；`06` §8.11（06:382-420）；`08` D-41/D-42/D-47/D-48/D-49（08:73-81）；`10` B-14…B-16（10:83-85） | **PASS（有 P2 残留，见 F-05/F-06）** |
| 6 | OAuth 可信上下文：服务端派生、请求体不作授权依据、禁用/撤销/绑定变化拒绝 | `06` §7.1-§7.3（06:152-189）；`10` B-05/B-12（10:74、10:81）；V-67…V-70（07:161-164） | **PASS（引用小错见 F-07）** |
| 7 | 测试向量编号一致性 | `07` §2.7/§2.8 标题与表体范围不一致；`24:121` 范围描述不完整 | **FAIL（F-04）** |

结论：R2.1 六项技术规则已被 R2.2.10 继承，未发现规则回退；编号一致性仍有小范围缺陷。

## 4. R2.2.10 后续细化一致性审查

| 审查点 | 证据 | 结果 |
|---|---|---|
| Alias 字段命名统一（`scope` 而非 `alias_scope`） | `01:43`、`02:50` 明确不使用 `alias_scope`；`04:110-137` 使用 `scope` | PASS |
| Alias 解析 key-space 锁定、并发与冲突 | `04` §3.3.1 唯一键级 advisory lock、行锁、排斥约束（04:401-415）；V-71/V-72/V-79 | PASS |
| Global / Tenant / Site DB 约束而非仅应用层 | `04` §3.3.2 三类别 CHECK/复合外键（04:417-467）；`06` §4/§8.12（06:74-95、06:451-463） | PASS |
| `tenant/site` 归属与审计 CHECK/FK/唯一约束一致 | `04:456-467`、`06:83-85`、`10:45-52`；V-73/V-81/V-82/V-93/V-94 | PASS |
| Tenant Assertion / Global Adjudication 不同审批身份 | `03:164-186`、`04:465-475`、`06:465-475`；V-74/V-86/V-87 | PASS（角色资格强制见 F-06） |
| 双人/不同角色审批要求不同可信 principal | `03:180`、`04:470`、`06:470-472`；DB CHECK 要求提交者≠Tenant 审批者、决策者≠Global 审批者 | PASS（仅“不同人”；资格校验见 F-06） |
| approval、`global_product` 写入、audit 原子事务与回滚 | `03:243` 明确“裁决 APPROVED、回写 pending/assertion、global_product、alias/lineage、GLOBAL audit 同事务”；但 `03:184`、`04:526`、`06:420/474` 漏写 assertion 回写 | **PARTIAL（F-05）** |
| SAVEPOINT 不刷新快照 | `04:632-665`、`06:140`、`07:240-244`、`22` 已修正；`23` 说明 R2.2.10 范围 | PASS |
| Owner signoff package 引用最新版本 | `24:9` 固定 `11cd1ae`，但 24 与含 24 的清单只存在于 `d9354a0`；`11cd1ae` 清单中 24 条目数为 0 | **FAIL（F-02）** |

## 5. Owner Signoff Package 完整性审查

| 检查项 | 证据 | 结果 |
|---|---|---|
| 是否覆盖 D-01…D-49 | `24` §2.1–§2.6 覆盖全部 49 项；`08` §1.2.1 有 D-41…D-49（08:69-81） | PASS |
| 问题与选项是否明确 | 每项列出“决策问题 / 推荐 / 替代”；但未给每项详细选项说明 | PARTIAL（F-08） |
| 推荐是否有依据 | 24 表格无“推荐理由”列，未链接 `08` 对应条目；08 的 D-41…D-49 表也仅列风险 | PARTIAL（F-08） |
| 风险、未决项、影响范围 | 有风险列与 §3 开放事项；无逐项影响范围列 | PARTIAL（F-08） |
| Owner 决策 / Agent 推荐 / Reviewer 建议区分 | 24 状态写明“待负责人决策”；但“推荐”未标注为 Agent 建议；Reviewer 部分只有未经核实的 PASS 声明 | **FAIL（F-01/F-08）** |
| 是否把建议/待决定写成已批准 | 24 §5 明确 Contract Freeze/P0-2/Business API/Production 均未批准；但“设计包技术复核 PASS”和“R2.2.x 技术问题已闭环”属未经核实的评审状态升级 | **FAIL（F-01/F-09）** |
| 是否以文档完成推导架构批准 | 未发现；24 明确“不是架构批准” | PASS |
| 签署基线是否包含签署包本身 | 24 固定基线 `11cd1ae`；24 只在 `d9354a0` 存在；`11cd1ae` 的合并清单无 24 条目 | **FAIL（F-02）** |
| P0-2 状态表述 | 24:122 将“解析输出/证据”列入“其余四项缺口”；实际 P0-2 为 1 PASS/4 FAIL，解析输出/证据为 PASS | **FAIL（F-03）** |

## 6. 测试向量与 SHA256 校验

### 6.1 哈希校验

| 清单 | 条目 | 通过 | 失败 |
|---|---|---|---|
| `product_identity_global_id_design/SHA256SUMS` | 25 | 25 | 0 |
| `DESIGN_AND_TEST_SHA256SUMS.txt` | 35 | 35 | 0 |

- 对 35 条清单逐条执行 `git show HEAD:<path> | sha256sum`，35/35 与清单一致。
- 83 项证据 Git Blob：`690d62971f222df213a89529ebc785180c41dfd9`，在 `dfde642`、`11cd1ae`、`d9354a0` 三处一致。
- `git diff 11cd1ae..HEAD -- test_evidence_83` 为空；83 项证据未被 R2.1/R2.2/签署包修改。
- 24 声明的 83 证据 Blob 与实测一致（24:11）。

### 6.2 测试向量

| 项 | 实际 | 结果 |
|---|---|---|
| 设计向量范围 | V-01…V-107 | 全部为设计测试 |
| 执行状态 | 07 明确全部“未执行”；83 项仅为既有 Parser/Domain/Evidence 证据 | 未发现将未执行标为 PASS |
| 24 的范围描述 | `24:121` 写“V-77…V-107 未执行”，遗漏 V-71…V-76 | 不完整（F-04） |
| 07 小节标题 | §2.7 标题 V-95…V-101 但表体含 V-102；§2.8 标题 V-103…V-105 但表体含 V-106/V-107 | 标题与表体不一致（F-04） |

## 7. Findings

| ID | 严重度 | 证据 | 影响 | 建议 | 阻塞 Owner 决策 |
|---|---|---|---|---|---|
| F-01 | **P0** | `24:10`、`24:195` 声称“Reviewer 对 R2.2.10 独立复核结论：设计包技术复核 PASS”；仓库内无该独立报告；`23:94` 仍写“等待 Reviewer 独立复核” | Owner 可能误以为已完成独立技术复核；本次审查实际结论为 NOT_READY | 删除该 PASS 声明，改为“待独立复核”或“Agent 自检”；待本报告被接受后再引用 | **是** |
| F-02 | **P0** | `24:9` 固定基线 `11cd1ae`；24 与含 24 的清单仅在 `d9354a0`；`git show 11cd1ae:...SHA256SUMS` 中 24 条目为 0 | 签署 `11cd1ae` 不覆盖签署包本身及其哈希清单，追溯链断裂 | 将签署基线改为 `d9354a0`，或明确记录“设计基线 11cd1ae + 签署包提交 d9354a0”并分别哈希 | **是** |
| F-03 | **P1** | `24:122` 将“解析输出/证据”列入 P0-2“其余四项缺口”；`reverification/06_P0_2_FINAL_ASSESSMENT.md:10,49` 明确 1 PASS/4 FAIL，解析输出/证据为 PASS | 对 Owner 误报项目状态，可能引发错误工作量或错误裁定 | 改为“产品身份、全局 ID、静态 B2B 桩、后端实现四项 FAIL；解析输出/证据为 PASS（解析范围）”；明确本设计不关闭 P0-2 | **是** |
| F-09 | **P1** | `24:10` 称“R2.2.x 技术问题已闭环”，但 `24:117-122` 仍列隔离级别、pending 去重、DDL 未验证、V-77…V-107 未执行等开放项 | “闭环”表述与自身开放项矛盾，夸大完成度 | 改为“文档层修订完成；实现、DDL、隔离级别与测试未验证” | **是**（措辞修正后解除） |
| F-04 | P2 | `07:213` §2.7 标题 V-95…V-101，表体含 V-102；`07:228` §2.8 标题 V-103…V-105，表体含 V-106/V-107；`24:121` 写 V-77…V-107，遗漏 V-71…V-76 | 实施/验收范围可能被低估 | 统一标题与范围：§2.7 为 V-95…V-102，§2.8 为 V-103…V-107；24 改为 V-71…V-107（或“全部设计向量”） | 否（签署前修正） |
| F-05 | P2 | `03:243` 最终事务含“回写 pending/assertion”；`03:184`、`04:526`、`06:420/474` 仅列 global_product/alias/lineage/pending/adjudication/audit，漏 assertion 回写 | 实现可能漏更新 `tenant_assertion.status=ACCEPTED_BY_GLOBAL` / `global_decision_ref`，或造成非原子回写 | 统一 03/04/06 的最终事务对象清单，明确 assertion 状态回写与引用写入同事务 | 否（实现前必须） |
| F-06 | P2 | `04:470` DB CHECK 仅约束 `submitted ≠ tenant_approved`、`decided ≠ approved`；`04:485` 明确“谁有权授予/审批”由应用层负责；`tenant_assertion`/`global_adjudication` 字段未外键到具体 `principal_role` 授予 | 数据库层只能证明“不同 principal”，不能证明各 principal 实际持有 `tenant.editor`/`tenant.admin`/`identity.admin`/`identity.approver`；角色资格仍依赖应用层 | 增加对角色授予版本的 FK/复合键，或在 03/04/06 明确标注“角色资格为应用层强制”并补对应拒绝向量 | 否（架构可接受，但需明确） |
| F-07 | P3 | `06:162` 写“见 07 V-66…V-70”；V-66 是私有证据（07:160），Token 向量为 V-67…V-70（07:161-164）；`12:75` 也写 V-67…V-70 | 引用范围多出 V-66，易误读 | 改为 V-67…V-70 | 否 |
| F-08 | P2 | `24:38-113` 决策表无逐项“推荐依据/影响范围”；`08:71-81` 的 D-41…D-49 表也只有风险列；24 未链接到 08 对应条目；“推荐”未标明为 Agent 建议 | Owner 需跨文件补读才能形成完整判断；建议与事实来源不够清晰 | 为每项增加“依据/影响范围”或链接 08 对应条目；标明“Agent 推荐，待 Owner 决策” | 否（签署前建议修正） |

## 8. 状态门槛核对

| 门槛 | 实际状态 | 依据 |
|---|---|---|
| `ARCHITECTURE_APPROVED` | **NO** | 无 Owner 正式批准记录；24 明确“不是架构批准” |
| `CONTRACT_FROZEN` | **NO** | 24:198；未修改 OpenAPI/契约 |
| `P0_2_CLOSED` | **NO** | 24:199；复验仍 1 PASS/4 FAIL |
| `BUSINESS_API_IMPLEMENTATION_AUTHORIZED` | **NO** | 24:200；未实现 Business API |
| `PRODUCTION_READY` | **NO** | 24:201；无部署/生产操作 |
| 独立技术复核 | **NOT_READY**（本报告） | F-01/F-02/F-03/F-09 未关闭 |
| 设计向量执行 | **NOT_EXECUTED** | 07 全量标记未执行；83 项仅为既有解析证据 |

## 9. 最终结论

### 9.1 结论

**NOT_READY_FOR_OWNER_SIGNOFF**

### 9.2 说明

- 技术设计层面：R2.1 六项要求已被 R2.2.10 继承；Alias Brand 上下文、唯一约束与有效期、三类归属、Evidence Site 边界、Tenant Assertion/Global Adjudication 分层、OAuth 可信上下文均有文档级落实。未发现推翻 Morrishk-first 架构的根本矛盾。
- 阻塞点在**签署包本身**，不在技术条款：
  1. F-01：未经核实的 Reviewer PASS 声明；
  2. F-02：签署基线 `11cd1ae` 不包含签署包 24 及其哈希清单；
  3. F-03：P0-2 状态表述与复验结论矛盾；
  4. F-09：“R2.2.x 技术问题已闭环”与自身开放项矛盾。
- F-04/F-05/F-06/F-07/F-08 为签署前应修正或由 Owner 明确接受的事项；其中 F-05/F-06 建议在实现前关闭。

### 9.3 建议的关闭顺序

1. 移除/限定 24 中未经核实的 Reviewer PASS 与“已闭环”表述。
2. 将签署基线固定为 `d9354a0`（或同时记录设计基线 `11cd1ae` 与签署包提交 `d9354a0`），并重新校验 35 条清单。
3. 按复验结论修正 P0-2 表述。
4. 修正 V-71…V-107 范围与 07 小节标题；修正 06 的 V-67…V-70 引用。
5. 统一最终事务对象清单，明确 `tenant_assertion` 状态回写。
6. 明确角色资格由 DB 还是应用层强制，并补对应测试向量。
7. 为 24 的决策项补充依据/影响范围或链接 08。

完成上述事项后，可重新提交 Owner 签署包；本报告不构成架构批准、Contract Freeze、P0-2 关闭或 Business API 实施授权。Owner 仍须独立作出决定。