# Ds Bit 权威分支审计（P0-2）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-P02-AUTH-001 |
| 版本 | v1.0（只读审计；执行 Agent 不认定权威分支） |
| 日期 | 2026-11-23 |
| 仓库 | `E:\workspace\icpdf-extractor` |
| 远程 | `https://codeup.aliyun.com/5f0af04d5fd102f22f6b747c/icpdf-extractor.git` |
| 当前检出 | `backup/full-local-20261114`，HEAD `600439a5eee69fb3a1cec2715e37080e48ca9840` |
| 上游权威登记 | `14_/DSBIT_AUTHORITY_BASELINE.md`（`DECISION_REQUIRED`）；`16_/FREEZE_READINESS_REVIEW.md:166-176` |
| 结论 | **P0-2 BLOCKED：权威分支未书面确定，干净提交五项复验未执行** |

## 1. 候选分支与提交（2026-11-23 实测）

| 候选 | 实测 SHA | 关系/说明 | 是否具备远程跟踪 |
|---|---|---|---|
| `backup/full-local-20261114`（当前检出） | `600439a5eee69fb3a1cec2715e37080e48ca9840` | 本地备份分支；与 `origin/feat/gate6a-audit` 同 SHA | 无同名远程 |
| `feat/gate6a-audit` / `origin/feat/gate6a-audit` | `600439a5eee69fb3a1cec2715e37080e48ca9840` | 远程功能分支；与 backup 指向同一提交 | 是 |
| `main`（本地） | `a11131a80474f3d5bea5ab6fb5204e77b8839eed` | 当前 HEAD 的祖先；`main...backup` = **0 ahead / 15 behind** | 本地 main 领先 `origin/main` 47 个提交 |
| `origin/main` | `853a80dd664c79ef90baaac53eefb9bbc2155dde` | 远程默认分支；仅指向初始提交 | 是 |

其他本地/远程分支（未被 `14_` 列为权威候选）：

| 分支 | 实测 SHA | 说明 |
|---|---|---|
| `docs/s2b-r15-review` | `9d84975` | 设计审阅分支，本地 |
| `docs/s2b-r21-review` | `2be4ec2` | 设计审阅分支，本地 |
| `feat/gate6a-annotation` | 本地 `a633bf4`；远程 `df67dfd` | 本地落后远程 11 个提交；命名含“annotation”，不是权威候选 |
| `feat/s2b-schema-d4-d6` | 本地 `60a503c`；远程 `55da906` | 本地/远程分叉；不是权威候选 |

> 结论：至少存在三个可选口径（backup、origin/feat/gate6a-audit、main）。前两者同 SHA，但不是同一“分支身份”；`main` 落后 15 个提交；`origin/main` 更旧。**不存在双向分叉**，但存在多个可冲突的基线口径。

## 2. 工作树状态（20 项，2026-11-23 实测）

| 类别 | 数量 | 条目 |
|---|---:|---|
| 已暂存新增（A） | 14 | `.dockerignore`；`deploy/dsb/` 下 9 个文件（Dockerfile、README、docker-compose、rollback、nginx×5）；`workbench/_g0/` 3 个文件；`workbench/b2b/qa_console.html` |
| 已暂存修改（M） | 3 | `.gitignore`、`workbench/index.html`、`workbench/serve_parser.py` |
| 未暂存修改 | 0 | — |
| 未跟踪（??） | 3 项（2 目录 + 1 文件） | `deploy/dsb/evidence/`、`docs/g0_evidence/`、`workbench/b2b/serve_b2b.py` |
| **合计** | **20** | 17 个已跟踪路径 + 3 个未跟踪条目 |

### 2.1 与 2026-11-21 快照的差异

- 2026-11-21 的 `P0_2_AUTHORITY_CONFIRMATION.md` 记录：14 A + 1 已暂存 M + 2 未暂存 M + 3 未跟踪。
- 2026-11-23 实测：14 A + **3 已暂存 M** + 0 未暂存 + 3 未跟踪。
- 总数仍为 20，路径集合相同；`workbench/index.html` 与 `workbench/serve_parser.py` 已由未暂存变为已暂存。
- 说明：工作树不是不可变证据；P0-2 的“干净提交”条件仍未满足，且分类口径已发生变化。

### 2.2 关键未跟踪文件

`workbench/b2b/serve_b2b.py` 仍为未跟踪文件：

- 本地静态回放服务，强制 `ALLOW_PARSE=0`；
- 仅支持样例 `V101`；
- OAuth 元数据为本地桩，`/oauth/token` 返回固定标记，不校验真实凭据；
- 仅提供 `/v1/health`、`/v1/parts`、`/v1/parts/{model}`；
- 不能作为 Business API、产品身份或分类的权威实现。

## 3. 是否存在书面权威指定？

**未发现。** 检索范围与结果：

- Ds Bit 仓库 `grep -rIl "权威分支|AUTHORITY|P0-2|authoritative" --include="*.md"` 命中的是设计/审阅文档（如 `docs/Document_Classifier_V2_Design.md`、`docs/PHASE1_4_S2*.md`、`HANDOFF.md`），未见“指定某分支为权威”的决策文件。
- 评审仓 `27_/P0_2_AUTHORITY_CONFIRMATION.md` 是**确认请求**，明确写“本包不认定其中任何一个为权威”，并保留空白确认文本。
- `27_/DECISION_REGISTER.md` 中 P0-2 状态仍为 `DECISION_REQUIRED`。
- Phase 3 自检 `C-9a/b/c` 通过：真实文档中无分支自选、三候选在列、`DECISION_REQUIRED` 在册。

## 4. 五项复验的证据状态

`12_/README.md` §2.1 要求在**权威分支的干净提交**上复验五项。当前没有权威分支，故五项均不能判 PASS；下表仅列“快照已知事实”，不构成复验结论。

| # | 五项 | 当前快照/事实 | 复验状态 |
|---|---|---|---|
| 1 | 产品身份模型 | `Product` 为单次文档解析内的产品；`product_id = prod-{document_id}`；`document_id = doc-{sha[:12]}`；`requested_mpn` 与 `normalized_mpn` 当前同值；无全局产品注册表 | **NOT_REVERIFIED**（快照事实来自 `14_/DSBIT_AUTHORITY_BASELINE.md` §3.1） |
| 2 | 产品全局 ID 唯一性 | 无跨文档/跨批次全局唯一约束；运行产物中同一 `requested_mpn` 可对应多个 `product_id`（10 组；`W1` 76 个） | **NOT_REVERIFIED**；快照统计仅说明结构，不代表生产比例 |
| 3 | 解析器输出与证据模型 | `EV-*`、bbox、页码、SHA 等事实在 `14_`/契约中登记；未在权威干净提交上重跑 | **NOT_REVERIFIED** |
| 4 | 静态 B2B 桩状态 | `serve_b2b.py` 未跟踪；本地静态桩；仅 V101 | **NOT_REVERIFIED**；不能作为权威实现 |
| 5 | 数据库/审核/版本/发布四类后端进度 | Phase 0 结论为 `NOT_IMPLEMENTED`；无产品主表/分类表/映射表 | **NOT_REVERIFIED** |

## 5. 哪个版本具有完整、可追溯的设计与实现？

- 设计/契约证据目前绑定 `600439a5` 快照（`12_/README.md` §2 基线；`14_/DSBIT_AUTHORITY_BASELINE.md`）。
- `backup/full-local-20261114` 与 `origin/feat/gate6a-audit` 同 SHA，均包含该快照；但前者是本地备份，后者有远程跟踪，不能仅凭“同一 SHA”判定分支身份。
- `main` 落后 15 个提交，若选 `main`，`12_` 中部分 `CONFIRMED` 事实需整体重核（`14_/DSBIT_AUTHORITY_BASELINE.md` §1.2）。
- 20 项未提交内容（含 `deploy/dsb/`、未跟踪静态桩）不在任何提交中；若纳入基线，必须另行提交并重新复验；若排除，必须书面说明。

**结论：无法确定“完整、可追溯”的权威版本。** 现有材料只能证明 `600439a5` 快照下的若干事实，不能证明该提交就是 Ds Bit 权威基线。

## 6. 谁拥有最终确认权？

| 决定 | 最终确认权 | 当前状态 |
|---|---|---|
| 权威分支与 Commit SHA | **Ds Bit 负责人 / 项目决策人** | 未行使 |
| 20 项工作树内容的纳入/排除 | **Ds Bit 负责人 / 项目决策人** | 未行使 |
| 五项复验 | **非执行 Agent（独立）** | 未授权、未执行 |
| P0-2 关闭记录 | **Reviewer** | 未出具 |

执行 Agent 不得自行选定分支、不得把备份分支或同 SHA 远程分支写成权威、不得把未跟踪静态桩当作已提交实现。

## 7. P0-2 阻断结论

**P0-2 = BLOCKED。**

关闭所需的最小动作：

1. Ds Bit 负责人/项目决策人出具书面文件：指定分支 + Commit SHA + 工作树纳入/排除口径。
2. 在该口径下形成干净提交（或确认已有干净提交）。
3. 非执行 Agent 在干净提交上逐项复验五项，记录 PASS/FAIL 与 file:line/命令证据。
4. Reviewer 复核并写入冻结记录，P0-2 方可关闭。

在上述动作完成前，Contract Freeze 的 G2 不成立，Production Business API 不得进入实现或接入。