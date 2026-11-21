# Session B 上下文恢复报告（Context Recovery）· 证据完整版

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-RECOVERY-001 |
| 版本 | v1.2（按 Reviewer「PASS WITH CORRECTIONS」裁定修正两处：①15_ 校验计数勘误 ②R1–R4 交接确认与仓库批准记录的区分口径；见 §14。结论与 v1.0/v1.1 一致） |
| 日期 | 2026-11-21 |
| 执行者 | Session B 执行 Agent（新接手，按交接指令执行） |
| 性质 | **只读上下文恢复**；不修改任何正式设计文档、不修改代码、不创建 API 实现 |
| 调查方式 | 只读：`find` / `ls` / `git log` / `git diff` / `git show` / `git branch --contains` / `git tag --contains` / `sha256sum -c` / 文件阅读 |
| 调查范围 | `E:\workspace\icpdf-extractor`、`E:\workspace\独立站\morrishk-site-upgrade-review`、`E:\workspace\独立站\morrishk-site`、`E:\workspace\独立站\morries` |
| 结论预览 | Session B 四目录（`12_`/`14_`/`15_`/`16_`）全部找到且校验一致；Contract Freeze = **NOT_READY**；Phase 0 裁定 3/7（均待签署、未独立验收）；Mock B1–B3 = PASS（仅提交边界）；Phase 1 整体验收 = PENDING |

> 证据引用格式：`文件路径:行号`（行号以 2026-11-21 工作树为准，内容与 `cf150a3`、`main@22259b6`、当前 HEAD `778d4d3` 三处一致，见 §4.4）。
> 本报告本身是评审仓库根目录的**未跟踪新文件**，不进入任何 `SHA256SUMS.txt`，未 commit、未建分支。

---

## 1. 项目关系（恢复确认）

- **Session A**：Ds Bit PDF 解析、DuckDB/S3 技术数据流水线。权威资料：`13_dsbit_duckdb_s3_pipeline/`（README 头部：设计 v1.16.1，性质「架构与实施设计；不是生产实现」，上游绑定 Ds Bit HEAD `600439a5`，全量口径 568,830 份去重 PDF）。Session B 只读引用，不得修改。
- **Session B**：Ds Bit Business API——为 Morrishk 提供商品、参数、技术证据与状态等业务查询能力，目标是建立**稳定、可追溯、有权限边界**的 API。权威资料：`12_`（契约与设计）、`14_`（Phase 0 裁定与证据）、`15_`（Phase 1 Mock UI）、`16_`（Contract Freeze Readiness 审核）。
- **Morrishk**：面向客户的独立站（未来通过 Business API 获取经授权的技术数据）。相关资产：旧站 Yii2 源码快照（`morries\newPlan\morrishk.net`）、新平台工程（`morries\platform`，迁移头禁止 production）、应用基线仓库（`morrishk-site`）。
- Session B **不是**重新开发 PDF 解析系统，**不是**直接改造 Morrishk 网站。

## 2. 工作区及仓库清单

| # | 路径 | 性质 | Git 状态（2026-11-21 实测） |
|---|---|---|---|
| 1 | `E:\workspace\icpdf-extractor` | **Ds Bit 项目仓库**（解析引擎 `src/icpdf/` + 前台 `workbench/`，Session A / 解析侧） | 是。分支 `backup/full-local-20261114`，HEAD `600439a5eee69fb3a1cec2715e37080e48ca9840`；remote `codeup.aliyun.com/5f0af04d5fd102f22f6b747c/icpdf-extractor.git`；工作树 21 项未提交（详见 §13.3，与 Phase 0 证据包及本轮会话起始快照一致，**本轮未触碰**） |
| 2 | `E:\workspace\独立站\morrishk-site-upgrade-review` | **Reviewer 评审仓库**（Session B 权威资料所在地） | 是。remote `https://github.com/esanwu-bot/morrishk-site-upgrade-review.git`；本地 `main` = `origin/main` = `22259b6`；当前检出 `docs/morrishk-v1.1-r4.2-review`（HEAD `778d4d3`，经 `git merge-base --is-ancestor main HEAD` 验证包含 `main`）；另有 7 个 `docs/morrishk-v1.1-*` 分支、`review-snapshot/090cae9`、`review-artifact/090cae9`；tag 22 个（含 `dsbit-phase1-mock-090cae9-review`） |
| 3 | `E:\workspace\独立站\morrishk-site` | Morrishk 应用基线仓库（Yii2 站点代码） | 是。分支 `main`，HEAD `cdb9c044dd2f2fc86967dc6738341b11bbeba7f5`，仅 2 提交（`chore: establish Morrishk application baseline`、`docs: add P0-01 baseline report`），工作树干净；remote `codeup.aliyun.com/.../morrishk-site.git` |
| 4 | `E:\workspace\独立站\morries` | 非 Git 目录：旧站源码快照、新平台工程 `platform/`、数据库结构审计 `mysql_schema_audit/`、原型等 | 否 |

另有 `E:\workspace\DsBit\prototype.html`：早期静态 UI 原型，仅历史参考（`12_/README.md` §2 口径），本轮未使用。

## 3. Session B 权威资料实际路径、文件清单与校验结果（补证 ①）

四个目录全部实际存在，**无「找不到资料」情形**，未创建任何替代文件。

### 3.1 `12_dsbit_business_api_integration_design`（7 个文件）

路径：`E:\workspace\独立站\morrishk-site-upgrade-review\12_dsbit_business_api_integration_design\`

```text
API_CONTRACT_CANDIDATE_v1.md
API_CONTRACT_EXAMPLES.md
Ds Bit ↔ Morrishk Business API Integration Design v1.md
INTEGRATION_OPEN_QUESTIONS.md
README.md
SHA256SUMS.txt
contract/openapi.candidate.v1.json
```

### 3.2 `14_phase0_authority_adjudication`（9 个文件）

路径：`E:\workspace\独立站\morrishk-site-upgrade-review\14_phase0_authority_adjudication\`

```text
DECISION_REGISTER.md
DSBIT_AUTHORITY_BASELINE.md
EVIDENCE_INDEX.md
IQ01_PRODUCT_IDENTITY_ADJUDICATION.md
IQ02_TAXONOMY_AUTHORITY_ADJUDICATION.md
IQ05_IQ09_IQ15_IQ21_DECISION_BRIEFS.md
PHASE0_OPEN_QUESTIONS_MATRIX.md
README.md
SHA256SUMS.txt
```

### 3.3 `15_phase1_mock_ui`（17 个文件）

路径：`E:\workspace\独立站\morrishk-site-upgrade-review\15_phase1_mock_ui\`

```text
ACCEPTANCE_PACKAGE.md
DELIVERY_REPORT.md
README.md
SHA256SUMS.txt
TEST_REPORT.md
assets/app.js
assets/mock-api.js
assets/mpn-normalizer.js
assets/styles.css
data/mock-dictionary.json
data/mock-products.json
data/mock-taxonomies.json
index.html
tests/contract-candidate.test.js
tests/contract-error-catalog.test.js
tests/mock-api.test.js
tests/mpn-normalizer.test.js
```

### 3.4 `16_contract_freeze_readiness`（1 个文件）

路径：`E:\workspace\独立站\morrishk-site-upgrade-review\16_contract_freeze_readiness\FREEZE_READINESS_REVIEW.md`

该目录**有意不设 `SHA256SUMS.txt`**（报告 §0 未改动项第 6 条：「本文件为新增独立目录，既不进入 `12_`/`14_`/`15_` 的 `SHA256SUMS.txt`」；§6 末尾：「本文件不内置自身 SHA-256，校验值随提交说明单独提供」）。本轮实测值：

```text
5bd5bf1b293e455877a411bf89e441c6c41818f0f2543d2379bb033709fd3542  16_contract_freeze_readiness/FREEZE_READINESS_REVIEW.md
```

（内容即 cf150a3 修订后的 v1.1；`git log cf150a3..main -- 16_` 为空，此后无人改动。）

### 3.5 SHA256SUMS 校验结果（2026-11-21 实跑）

```bash
cd "E:/workspace/独立站/morrishk-site-upgrade-review"
(cd 12_dsbit_business_api_integration_design && sha256sum -c SHA256SUMS.txt)   # → 6/6 OK
(cd 14_phase0_authority_adjudication          && sha256sum -c SHA256SUMS.txt)  # → 8/8 OK
(cd 15_phase1_mock_ui                         && sha256sum -c SHA256SUMS.txt)  # → 16/16 OK（登记 16 项，见 §14 勘误 1）
```

实测输出（逐条）：

- `12_`：`README.md: OK`、`Ds Bit ↔ Morrishk Business API Integration Design v1.md: OK`、`API_CONTRACT_CANDIDATE_v1.md: OK`、`API_CONTRACT_EXAMPLES.md: OK`、`INTEGRATION_OPEN_QUESTIONS.md: OK`、`contract/openapi.candidate.v1.json: OK`
- `14_`：`README.md`、`DSBIT_AUTHORITY_BASELINE.md`、`IQ01_PRODUCT_IDENTITY_ADJUDICATION.md`、`IQ02_TAXONOMY_AUTHORITY_ADJUDICATION.md`、`IQ05_IQ09_IQ15_IQ21_DECISION_BRIEFS.md`、`PHASE0_OPEN_QUESTIONS_MATRIX.md`、`EVIDENCE_INDEX.md`、`DECISION_REGISTER.md` 全部 `: OK`
- `15_`：`ACCEPTANCE_PACKAGE.md`、`DELIVERY_REPORT.md`、`README.md`、`TEST_REPORT.md`、`assets/`（4）、`data/`（3）、`index.html`、`tests/`（4）全部 `: OK`

关键单件哈希（与文档登记一致）：

| 文件 | SHA-256 | 登记位置 |
|---|---|---|
| `12_/contract/openapi.candidate.v1.json` | `fdeec48ecf44439776e61245ca7b98fc94f7ce0d481a7c9aea639900f1e71023` | `FREEZE_READINESS_REVIEW.md:49`、`API_CONTRACT_CANDIDATE_v1.md:10`、`ACCEPTANCE_PACKAGE.md:11` |
| `12_/API_CONTRACT_CANDIDATE_v1.md` | `948da30aaf31f40094920cbf488ab568fce6055dbd0074747ee1340c133d3b0a` | `FREEZE_READINESS_REVIEW.md:50` |

## 4. 关键 Git 基线与提交明细（补证 ②）

### 4.1 三个关键提交的仓库、分支、父提交与变更范围（实测）

| 项 | `090cae9` | `0474b19` | `cf150a3` |
|---|---|---|---|
| 完整 SHA | `090cae95f66a617eb04bdb0843d0429c5520dbab` | `0474b199e0fd05c670a85acecb933c207db55395` | `cf150a378e41253fa8b9a25f1b896f241c310cba` |
| 所在仓库 | `morrishk-site-upgrade-review`（GitHub `esanwu-bot/morrishk-site-upgrade-review`） | 同左 | 同左 |
| 包含分支（本地实测） | `main` + 全部 8 个 `docs/morrishk-v1.1-*` 分支 | 同左 | 同左 |
| tag | `dsbit-phase1-mock-090cae9-review` | 同 tag 覆盖 | 无 |
| 父提交（实测 `%P`） | `e5637fcbab80245440a528712cb23c33fdd959f9` | `edd2f9947f4101630966287886610b0b510ee98b` ✓（与交接指令「父提交 edd2f99」一致） | `159c3b385143b75f3343cfeee5041efe94e901ca`（即 Freeze 报告 v1.1 修订提交） |
| 提交时间 | 2026-11-17 16:27:26 +0800 | 2026-11-17 15:58:38 +0800 | 2026-11-17 18:27:49 +0800 |
| 主题 | `test(dsbit): 锁定逐操作响应引用并修正复现命令` | `fix(phase1): address reviewer B1-B3 in mock identity and delivery report` | `docs(dsbit): 补正 P1-10 证据端点的分页参数事实` |
| 变更范围（`git show --stat` 实测） | **仅 `15_phase1_mock_ui/`** 6 文件（+68/−27）：ACCEPTANCE_PACKAGE、DELIVERY_REPORT、README、SHA256SUMS、TEST_REPORT、`tests/contract-error-catalog.test.js`（+39） | **仅 `15_phase1_mock_ui/`** 10 文件（+213/−74）：DELIVERY_REPORT、README、SHA256SUMS、TEST_REPORT、`assets/app.js`、`assets/mock-api.js`、`assets/mpn-normalizer.js`、`index.html`、`tests/mock-api.test.js`（+53）、`tests/mpn-normalizer.test.js`（+29）——与交接指令「仅修改 `15_phase1_mock_ui/`」一致 ✓ | **仅 `16_contract_freeze_readiness/FREEZE_READINESS_REVIEW.md`** 1 文件 1 行（P1-10 事实补正：`/evidence` 已声明 `limit`/`cursor`（OpenAPI `:281-282`）但 `EvidenceEnvelope` 未绑定 `PageMeta`） |

`main` 上的关键提交顺序（旧 → 新，`git log --oneline main` 实测）：
`7713765`（Phase 0 证据准备）→ `edd2f99`（v1.9 SHA 回填，仅 `13_`）→ **`0474b19`** → `3ecb54b`（v1.10 回填）→ **`090cae9`** → `b7d5c80`（平台映射行数口径，仅 `15_`）→ **`cf150a3`** →（`6769ebc`…`22259b6` 共 7 个提交：discovery v1.0/v1.0.1、p0-01 基线 ×3、SEO 规格 ×2）→ `main@22259b6`。

### 4.2 基线时效声明（须向 Reviewer 报告的事实）

交接指令给出「已知评审基线 `main@cf150a3`」；实测本地与 `origin/main` 已前进至 `22259b6`（2026-11-19）。**已验证**：`git diff --stat cf150a3..main -- 12_ 14_ 15_ 16_` 与 `git log cf150a3..main -- 16_` 输出均为空——7 个新提交只涉及 discovery/p0-01/SEO（`09_` 相关、`morrishk-site` 基线、`17_`），四目录内容在 `cf150a3`、`main@22259b6`、当前 HEAD `778d4d3` 三处**字节一致**。故 cf150a3 作为 Session B 四目录内容基线仍有效；「main 基线 = cf150a3」的表述应更新为「Session B 内容基线 cf150a3 ≡ main@22259b6（四目录）」。

### 4.3 Ds Bit 仓库基线（P0-2 相关）

`icpdf-extractor`：分支 `backup/full-local-20261114`、HEAD `600439a5`（2026-11-13，自 Phase 0 取证以来未变）、工作树 21 项未提交（§13.3）——与 `14_/DSBIT_AUTHORITY_BASELINE.md` 记录一致。`workbench/b2b/serve_b2b.py` 确认为**未跟踪**文件（`serve_b2b.py:1-40` docstring：本地静态桩、不 import 解析模块、强制 `ICEX_WORKBENCH_ALLOW_PARSE=0`、OAuth2 路由全部 `x_local_static_stub: true`）。**权威分支仍为 `DECISION_REQUIRED`，P0-2 未关闭**（`FREEZE_READINESS_REVIEW.md:166-176`）。

## 5. 已通过的 Mock 验收范围 + Mock B1–B3 明细（补证 ④）

### 5.1 Mock B1–B3 的验收对象、内容与通过依据

| 项 | 内容 | 证据 |
|---|---|---|
| **验收对象** | `15_phase1_mock_ui/` Mock UI 代码基线 **`0474b19`**（该提交即「按 Reviewer B1–B3 修订」的落地提交，见 §4.1 变更范围：10 文件，含 `assets/mock-api.js`、`assets/mpn-normalizer.js` 与两个测试文件） | `ACCEPTANCE_PACKAGE.md:49`（「Mock UI 代码基线 `0474b19`（Reviewer 已就 B1–B3 给出提交边界 PASS）」）；`API_CONTRACT_CANDIDATE_v1.md:474`（「Phase 1 Mock `0474b19` 的 B1–B3 \| Reviewer PASS（仅提交边界）」） |
| **B1 内容** | 候选冲突漏判（Mock 身份聚合缺互斥候选判定的边界用例）；修订后新增 3 项候选冲突用例 | `DELIVERY_REPORT.md:10`（「v1.1 按 Reviewer B1（候选冲突漏判）…修订」）；`TEST_REPORT.md:9`（「v1.1 B1/B2 修订后重跑（新增 3 项候选冲突用例…）」）；用例见 `tests/mpn-normalizer.test.js`（B1 边界测试 3 项，`ACCEPTANCE_PACKAGE.md:73`） |
| **B2 内容** | 搜索非法输入处理；后续复测又按 B2 修正 scope 名称并新增错误目录跨文档一致性测试（10 项 → 后扩至 12 项） | `DELIVERY_REPORT.md:10`（「B2（搜索非法输入）」）；`TEST_REPORT.md:9`（「v1.3 按 Reviewer B1 修正 scope 名称、按 B2 新增错误目录跨文档一致性测试 10 项」；`TEST_REPORT.md:129`「§2.4 错误目录跨文档一致性（12 项，Reviewer B2）」）；用例见 `tests/mock-api.test.js`（+4 非法输入用例）与 `tests/contract-error-catalog.test.js`（12 项） |
| **B3 内容** | 基线/问题编号口径（交付报告的基线引用与问题编号登记） | `DELIVERY_REPORT.md:10`（「B3（基线/问题编号）」） |
| **通过依据** | Reviewer 结论（非执行 Agent 自授）：仅对提交 `0474b19` 的边界给出 PASS | `ACCEPTANCE_PACKAGE.md:49`、`API_CONTRACT_CANDIDATE_v1.md:474` |
| **测试范围（该基线上的申报记录）** | 单元/契约测试 **73/73**（22 归一化 + 20 Mock API + 19 契约候选 + 12 错误目录）；浏览器冒烟 **9/9**；复现命令 `node --test tests/mpn-normalizer.test.js tests/mock-api.test.js tests/contract-candidate.test.js tests/contract-error-catalog.test.js`（在 `15_phase1_mock_ui/` 下） | `ACCEPTANCE_PACKAGE.md:189-213`（命令与逐文件覆盖）、`:215-231`（9 项冒烟）；`TEST_REPORT.md` 头部与 §2。**分级口径：RUN（执行 Agent 实跑）/ STATIC / CLAIM；Reviewer 未独立复跑**（`ACCEPTANCE_PACKAGE.md:229-231`、`TEST_REPORT.md:9`） |

### 5.2 Mock B1–B3 **明确不覆盖**的范围

| 不覆盖项 | 证据 |
|---|---|
| Phase 1 Mock UI 整体验收（`PASS_MOCK`）：**PENDING**，验收包状态 `PENDING_REVIEW`，结论栏「由 Reviewer 填写，执行 Agent 不填」，独立复跑清单 11 项未勾选 | `ACCEPTANCE_PACKAGE.md:10`、`:407-435` |
| 任何 IQ 的裁定/签署/验收；`PASS_MOCK` 范围的扩大 | `ACCEPTANCE_PACKAGE.md:31-42`（§1.2 明确不声明） |
| 契约冻结或契约成立（Mock 仅证明交互与错误路径方向） | `ACCEPTANCE_PACKAGE.md:38`、`API_CONTRACT_CANDIDATE_v1.md:422-423` |
| 生产 API / 生产 OAuth2 / 数据库 / 真实同步 / 真实数据（全部为 `DEMO_FIXTURE`，无网络、无 DB） | `ACCEPTANCE_PACKAGE.md:36-41`、`:390-404`（§18 禁止事项执行确认） |
| 契约候选全部行为的对齐：Mock 未实现 `304`；`visible_state` 用 `RELEASED/PENDING/REVOKED`（演示简化，混用 `release_state`，非契约枚举 `DRAFT/IN_REVIEW/RELEASED/WITHDRAWN`）；Token 不校验 | `ACCEPTANCE_PACKAGE.md:141-143`、`:163`；`API_CONTRACT_CANDIDATE_v1.md:409-423`（§10 差异矩阵） |
| Mock 验收通过 ≠ 生产 API 契约冻结（交接指令口径，与登记一致） | 本节全部证据 |

### 5.3 三套「B 编号」命名空间澄清（防混淆）

① Reviewer 对 Mock 代码的意见 **B1–B3**（本节，已 PASS）；② 契约候选 §11.1 冻结阻断 **B1–B4 = IQ-05/09/15/21**（全 OPEN，`API_CONTRACT_CANDIDATE_v1.md:433-438`）；③ §11.2 设计内部阻断 **B5–B8**（§9，`API_CONTRACT_CANDIDATE_v1.md:440-447`）。三套互不相干。

## 6. Reviewer R1–R4 审核结论

`FREEZE_READINESS_REVIEW.md` **v1.0 → v1.1** 按 Reviewer 四项意见做最小修订（`FREEZE_READINESS_REVIEW.md:22-27` 修订表）：

| # | Reviewer 意见 | 修订 |
|---|---|---|
| R1 | 端点分级错误 | `children` 归必需 #13、`changes` 归可选 #14；13 必需 + 3 可选 = 16 操作（§2 A.1–A.3，`:81-119`） |
| R2 | `CategoryDetail` 的 `allOf` 并非不可满足 | 删除「不可校验」结论，改写为契约语义冲突，P0 → **P1-3**（`:222`） |
| R3 | `/oauth/revoke` 只是候选方案 | 不作必需端点缺失计，改列 **P1-7**「撤销机制尚未选择」（`:226`） |
| R4 | 合并 P0-3/P0-9 | 合并为 **P0-2**（权威分支 + 干净提交五项复验，`:166-176`） |

- 修订声明：结论、证据基线、IQ 状态、验收对象均未改变；未修改 `12_`/`14_`/`15_` 任何文件（`:29-36`）。
- **交接确认与仓库内批准记录的区分（v1.2 固化口径，Phase 1 全部产出沿用）**：
  - **交接确认（HANDOVER-CONFIRMED）**：交接指令声明 Reviewer 已确认 R1–R4 修订通过。此声明的载体是仓库外的交接文书，**不是**仓库内记录。
  - **仓库内正式批准记录（IN-REPO APPROVAL）**：**不存在**。实测证据：`FREEZE_READINESS_REVIEW.md:8` 状态字段仍为 `REVISED_AWAITING_REVIEW`；`16_` 目录仅此一份文件；`git log cf150a3..main -- 16_` 为空。
  - 结论：R1–R4 记为 **「交接确认通过；仓库内无正式批准记录，待 Reviewer 落库」**。在批准记录落库前，一切后续文档引用 R1–R4 时必须同时标注这两个层次，不得只写「已通过」。
- 边界：**R1–R4 修订通过 ≠ Business API Contract Freeze 批准**（交接指令明确，与 `:284-285`「不构成契约冻结」一致）。
- 防混淆：`20_`–`24_` 目录与 `docs/morrishk-v1.1-r2…r4.2-review` 分支承载的是 **Morrishk V1.1 客户文档修订包（R2/R3/R4/R4.1/R4.2）**，与本处 Freeze 报告的 R1–R4 是两回事。

## 7. Contract Freeze 当前状态

**`NOT_READY`**（`FREEZE_READINESS_REVIEW.md:12`、`:257-281` §5，v1.1 结论不变）。

| 维度 | 状态 | 证据 |
|---|---|---|
| 契约候选 | `CANDIDATE_NOT_FROZEN`（OpenAPI `x-contract-status`） | `API_CONTRACT_CANDIDATE_v1.md:8`、`:313` |
| 冻结门槛完成度 | Phase 0 裁定 **3/7**；权威分支确定 **否**；证据基线复验 已完成但待分支裁定；冻结记录 **无** | `PHASE0_OPEN_QUESTIONS_MATRIX.md:147-155` |
| P0 阻断 7 项 | P0-1（IQ-05/09/15/21 OPEN）`:158-164`；P0-2（权威分支+五项复验）`:166-176`；P0-3（IQ-01/02/13 未签署未验收）`:178-183`；P0-4（B5）`:185-191`；P0-5（B6）`:193-200`；P0-6（B7）`:202-206`；P0-7（B8）`:208-214` | `FREEZE_READINESS_REVIEW.md` §4.1 |
| P1 10 项 / P2 8 项 | P1-1 sort、P1-2 X-Request-Id、P1-3 CategoryDetail.children、P1-4 单 taxonomy、P1-5 x-open-blockers 少列 B7/B8、P1-6 Token 错误体、P1-7 撤销机制、P1-8 expires_in、P1-9 visible_state 分工、P1-10 证据分页；P2-1…P2-8 | `:216-242` |
| 生产 Business API / OAuth2 / DB / 真实同步 | 全部 **NOT APPROVED** | `API_CONTRACT_CANDIDATE_v1.md:478-481`；`ACCEPTANCE_PACKAGE.md:373-387` |
| Phase 1 总体验收 | **PENDING** | `ACCEPTANCE_PACKAGE.md:10`、`:423-435` |

## 8. IQ 未决事项逐项状态（补证 ③⑤）

Phase 0 七项 = IQ-01、IQ-02、IQ-05、IQ-09、IQ-13、IQ-15、IQ-21（`PHASE0_OPEN_QUESTIONS_MATRIX.md:53`）。
统一登记源：`14_/DECISION_REGISTER.md` §2（`:29-40` 七行表）、§2.4 签署与验收登记（`:85-101`，**空白即未完成**，执行 Agent 不得代填，`:88`）、§6 当前登记结果（`:162-176`）。

| IQ | 登记状态（三源一致） | 原始依据 | 签署状态（§2.4 实测） | 独立验收证据（§2.4 实测） | 要点与剩余开口 |
|---|---|---|---|---|---|
| **IQ-01** 产品身份权威与 ID 空间 | **DECIDED** | 项目决策人 2026-11-17 书面任务书（「Phase 0 裁定落地与 Phase 1 Mock UI 开发任务书」），决策证据基线 `main@7713765`；转录于 `DECISION_REGISTER.md:31`（§2.1 全文 `:42-59`）；同步登记 `INTEGRATION_OPEN_QUESTIONS.md:36`、`:973` | **待签署**（签署人「未指定」，`DECISION_REGISTER.md:92`） | **未完成**（`DECISION_REGISTER.md:92`、`:173`；无任何验收记录文件） | 已定：废弃 `doc-id` 跨系统主键；`prod-{document_id}` 仅内部流转凭证；身份 = MPN + Brand，唯一键 `(mpn_norm, brand_norm)`；版本化 `MpnNormalizer`；Brand 缺失/冲突 → 待确认（`:46-57`）。仍开放（`:59`「不在裁定内」）：`pbk` 哈希算法/编码、`MpnNormalizer` 规则细节、`identity_scope` 是否入键 |
| **IQ-02** 技术分类归属、种子、是否多体系 | **DECIDED** | 同上任务书；`DECISION_REGISTER.md:32`（§2.2 全文 `:61-72`）；`INTEGRATION_OPEN_QUESTIONS.md:37`、`:974` | **待签署**（`:93`） | **未完成**（`:93`） | 已定：业务导航分类与技术参数分类硬隔离；技术参数分类归 Ds Bit；PM 提供首个真实种子与命名标准；候选字段 `Package`/`Voltage`/`Operating_Temperature` 以 PM 种子为准；Fixture 必须标 `DEMO_FIXTURE`（`:65-70`）。仍开放（`:72`）：体系数量、IQ-03（code 生成）、IQ-04（多主分类）、IQ-05（生命周期） |
| **IQ-05** 分类合并/停用保留期与 410 时机 | **OPEN**（登记行**空**） | 现状证据：旧站分类表无 `status`/`deprecated_at`/`deleted_at`（`01_schema.sql:347-363`、`INTEGRATION_OPEN_QUESTIONS.md:223-259`）；决策材料已备妥：`IQ05_IQ09_IQ15_IQ21_DECISION_BRIEFS.md` §IQ-05 | —（`DECISION_REGISTER.md:33` 整行空） | — | 未定：保留期（180/365/永久）、`deprecated_at` 起点、保留期内行为、生命周期字段承载系统。决策人：客户业务负责人 + Reviewer（`PHASE0_OPEN_QUESTIONS_MATRIX.md:23,74-80`）。对应冻结阻断 B1 |
| **IQ-09** 错误响应包最终形状 | **OPEN**（登记行**空**） | 现状证据：新平台契约包 `{code,message,data,request_id,meta}`（`platform/docs/phase1/03-api-contract.yaml:9-12`）、前端 `ApiError`（`platform/web/src/lib/api/client.ts:28-36,77-90`）、Ds Bit 静态桩（`workbench/b2b/serve_b2b.py:240-265`）；材料：Briefs §IQ-09 | —（`:34` 空） | — | 未定：包形状 A（现状）/ B（任务书 `error` 对象）/ C（双写）。影响全部 16 操作。决策人：Reviewer + Ds Bit 负责人（`PHASE0_OPEN_QUESTIONS_MATRIX.md:27,82-87`）。对应 B2；契约候选 §7.3 自认 OPEN |
| **IQ-13** 对接目标（旧站/新平台/两者） | **DECIDED** | 同上任务书；`DECISION_REGISTER.md:35`（§2.3 全文 `:74-83`）；`INTEGRATION_OPEN_QUESTIONS.md:48`、`:975` | **待签署**（`:94`） | **未完成**（`:94`） | 已定：目标 = Morrishk **新平台业务库**；旧站不再作目标；两侧自增 ID 不作跨系统身份；新平台内部 ID 仅内部主键（`:78-81`）。仍开放（`:83`）：新平台生产能力与迁移授权、`morrishk_target` 兼容值、旧站数据迁移方案 |
| **IQ-15** 新表引擎与字符集 | **OPEN**（登记行**空**） | 现状证据：旧站 31 表 = 30 MyISAM + 1 InnoDB、全 `utf8`（`mysql_schema_audit/02_table_inventory.csv`、`01_schema.sql` ENGINE 行）；新平台迁移要求 MySQL 8 且禁 production（`platform/db/migrations/20261116_0002__pd_model_core.up.sql:8`）；材料：Briefs §IQ-15 | —（`:36` 空） | — | 未定：InnoDB+utf8mb4 / MyISAM+utf8 / 独立库；是否与旧表同库。不改线形但属 Phase 0 门槛。决策人：运维 + Morrishk 技术负责人（`PHASE0_OPEN_QUESTIONS_MATRIX.md:33,98-103`）。对应 B3 |
| **IQ-21** 是否允许非生产凭证 | **OPEN**（登记行**空**） | 现状证据：Ds Bit 无 OAuth2 实现；`serve_b2b.py` 静态桩 `/oauth/token` 不校验凭据（`serve_b2b.py:34-37,189-224`）；材料：Briefs §IQ-21 | —（`:37` 空） | — | 未定：A 本地/预发非生产凭证 / B 仅静态桩 / C 仅预发。影响 Phase 1/2 联调与安全审计。决策人：客户业务负责人 + 安全（`PHASE0_OPEN_QUESTIONS_MATRIX.md:39,105-110`）。对应 B4 |

**汇总**（`DECISION_REGISTER.md:162-176` §6）：已登记决策 3；已裁定 3/7；未裁定 4/7；三项签署均待签署（签署人未指定）；三项独立 Reviewer 验收均未完成；口头裁定被当作决策 = 否；执行 Agent 代填 = 否；**契约冻结 NO；实现授权仅限任务书明确的 Phase 1 UI/Mock**。其余 15 项 IQ（03/04/06/07/08/10/11/12/14/16/17/18/19/20/22）分属 Phase 1/2/4 与非阻断级，全部未裁定（`PHASE0_OPEN_QUESTIONS_MATRIX.md:17-40` 总矩阵）。

## 9. B5–B8 阻塞明细（补证 ⑥）

登记源：`API_CONTRACT_CANDIDATE_v1.md:440-447`（§11.2）+ `FREEZE_READINESS_REVIEW.md:185-214`（P0-4…P0-7，含关闭条件）。

| 编号 | 阻塞原因 | 对应资料（可复核） | 待决策责任人（按登记） |
|---|---|---|---|
| **B5** MPN-NORM 与业务主键 | `MPN-NORM-v1` 规则集与 `product_business_key` 编码**未评审冻结**：`pbk1_ + sha256(规范化 MPN + 规范化 Brand)` 是全部产品路由主键，规则/编码一变全部 `pbk` 失效、跨系统对齐失败（P0-4）。已定方向（IQ-01）：身份 = `(mpn_norm, brand_norm)`；**`document_id` 不得作为商品唯一身份**；须保留 `mpn_raw/mpn_norm/brand_raw/brand_norm/normalizer_version/product_business_key` | 规则：`API_CONTRACT_CANDIDATE_v1.md:88-104`（§4.1）、`:120-132`（§4.3 编码）、`:134-139`（§4.4 唯一性）；机器契约 `x-open-blockers`「MPN-NORM-v1」（`openapi.candidate.v1.json:56-60`，影响「all product identity fields and routes」）；参考实现 `15_/assets/mpn-normalizer.js` + 22 项测试（Mock 用，非冻结依据）；关闭条件 `FREEZE_READINESS_REVIEW.md:191`（书面冻结 + 向量化测试证据） | 评审冻结方：由 Reviewer/设计评审对 IQ-01 登记裁定中的「不在裁定内」项定稿（`DECISION_REGISTER.md:59`：「须在实现前以设计文档固定并评审，不得由执行 Agent 自行当作已批准」）；执行 Agent 不得自行定稿 |
| **B6** 状态枚举 | **三套状态命名空间不一致**：闸门状态（Pipeline `PENDING/PASS/FAILED`、Content `PENDING/APPROVED/REJECTED`、Release `PENDING/APPROVED/REVOKED`）、`visible_state`（`DRAFT/IN_REVIEW/RELEASED/WITHDRAWN`）、`release_state` 查询参数（`RELEASED/REVOKED/PENDING`）语义不得合并混用；冻结会把不一致命名固化到客户端（P0-5）。**尤其 `PIPELINE_PASS` ≠ `CONTENT_APPROVED` ≠ `RELEASE_APPROVED`**；Mock 的 `RELEASED/PENDING/REVOKED` 是演示简化、不是契约枚举 | 对照表：`API_CONTRACT_CANDIDATE_v1.md:379-388`（§9.3，明示「列为冻结阻断 B6」）、`:360-378`（§9.1/9.2 派生规则）；`openapi.candidate.v1.json:62-66`（`x-open-blockers`「VISIBLE-STATE-RECONCILIATION」）、`:690-695`（`release_state` 描述自认 OPEN）；Mock 差异：`ACCEPTANCE_PACKAGE.md:140-143`、`API_CONTRACT_CANDIDATE_v1.md:413` | **设计文档维护人**书面统一命名或明确映射并写入契约（`FREEZE_READINESS_REVIEW.md:200`：「执行 Agent 不得自行改名或合并」） |
| **B7** 技术参数种子 | 字典**内容**无权威来源：正式 code、定义、单位、数据类型、适用范围、别名须以 PM 确认的真实种子为准，尚未提交；Fixture 不得冒充正式种子（IQ-02 裁定）；分类树 `category_code`/`name` 集合与层级因此不可冻结（P0-6） | 字段候选：`API_CONTRACT_CANDIDATE_v1.md:164-178`（§5.2/§5.3）；裁定：`DECISION_REGISTER.md:61-72`（§2.2，「不得由执行 Agent 自行臆定」）；现状「权威种子 NOT_FOUND」：`14_/README.md:89`；关闭条件 `FREEZE_READINESS_REVIEW.md:206`（提交种子+命名标准并在冻结记录登记来源与版本） | **PM**（提交首个真实种子与命名标准；`DECISION_REGISTER.md:67-68`）；依赖 IQ-02（已裁）开放后 |
| **B8** 证据公开范围 | 证据可公开字段（尤其 `screenshot_reference`、短原文）未裁定（IQ-08）；且**文档口径不一致**：契约候选 §11.2 列为冻结阻断，主设计文档附录 A.3 把 IQ-08 标 Phase 2（`Ds Bit ↔ ... Design v1.md:2433`）——须先统一口径再裁定或书面豁免（P0-7）。**`RELEASE_APPROVED` ≠ 所有解析数据与证据可不受限制公开；Ds Bit 产品事实发布批准 ≠ Morrishk 社媒营销内容批准**（交接指令边界，与 `ACCEPTANCE_PACKAGE.md` §1.2 一致） | `API_CONTRACT_CANDIDATE_v1.md:447`、`:273-303`（§6 端点 #6）；`FREEZE_READINESS_REVIEW.md:208-214`（P0-7 全文：证据、口径冲突、关闭条件）；`PHASE0_OPEN_QUESTIONS_MATRIX.md:26`（IQ-08 证据状态 `PARTIALLY_CONFIRMED`，需法务评估） | **客户法务/业务**（IQ-08 决策人，`PHASE0_OPEN_QUESTIONS_MATRIX.md:26`）；口径统一由 Reviewer 与文档维护人先裁（`FREEZE_READINESS_REVIEW.md:214`） |

（另：§11.1 的 **B1–B4** = IQ-05/09/15/21，见 §8 逐项。）

## 10. 当前授权范围（Phase 1 Business API Contract Closure & Implementation Preparation）

**允许**：① 只读调查现有代码与设计资料；② 核对 Mock 与设计文档差异；③ 整理 OpenAPI 3.x 契约草案；④ 编写独立 Contract Tests；⑤ 建立隔离的 Mock API；⑥ 编写不连接生产数据库的 Repository 接口；⑦ 编写 PHP/Yii2 Client 原型；⑧ 整理 OAuth2 Client Credentials 集成方案；⑨ 整理 IQ 决策登记及 B5–B8 阻塞项；⑩ 提交下一阶段生产开发准入建议。

**禁止**：修改 `13_`；修改 Ds Bit 生产解析流水线；修改生产数据库；创建生产数据表；连接真实生产数据；启用生产 OAuth2 凭证；执行真实 Morrishk 数据同步；宣称 API Contract Freeze；宣称生产 API 已通过验收。

**本轮（上下文恢复，两轮）实际执行**：仅只读调查 + 在评审仓库根维护本报告（唯一新增未跟踪文件；v1.0 → v1.1 自身修订）。未修改任何原有文档与代码，未 commit、未建分支、未 amend/rebase。

## 11. 下一步建议（F：可直接开展 vs 必须等待业务决策）

### 11.1 可直接开展（不依赖未决裁定，隔离/只读环境内）

| # | 工作 | 依据与边界 |
|---|---|---|
| 1 | Mock ↔ 设计文档差异核对 | 以 `15_` 现状 + 契约候选 §10 差异矩阵（`API_CONTRACT_CANDIDATE_v1.md:407-423`）为基础复核；已知差异（304 未实现、`visible_state` 简化、Token 不校验）只登记不顺手「修复」契约 |
| 2 | OpenAPI 3.x 契约草案整理 | 以 `openapi.candidate.v1.json`（3.1.0，16 路径/16 操作）为唯一基础；保持 `CANDIDATE_NOT_FROZEN`；每条规则标注 CONFIRMED / PROPOSED / PENDING / BLOCKED；P1/P2 缺陷只登记，语义取舍（P1-1/2/3/6 等）留待 Reviewer 与维护人 |
| 3 | 独立 Contract Tests | 独立于 `15_/tests/` 新建；断言契约候选的端点/错误目录/身份编码/分页口径；不得把 Mock 行为当作契约真相 |
| 4 | 隔离 Mock API + 固定测试数据 | 沿用 `DEMO_FIXTURE` 纪律；无数据库、无网络、无真实凭证 |
| 5 | 不连生产库的 Repository 接口 | 纯接口/内存实现；IQ-15 未裁，不得生成生产 DDL |
| 6 | PHP/Yii2 Client 原型 | 目标站点 `morrishk-site`（Yii2）；Client 侧按契约候选消费，不实现服务端 |
| 7 | OAuth2 Client Credentials 集成方案 | 仅设计 + 本地静态桩联调；IQ-21 未裁前不得引入任何「准生产」凭证形态 |
| 8 | IQ 决策登记 + B5–B8 阻塞项清单 | 本报告 §8/§9 可直接作为登记输入；新增代码用独立分支，不触碰权威分支 |
| 9 | 下一阶段准入建议 | 见 §11.3 |

### 11.2 必须等待业务决策（执行 Agent 不得代决/代填）

1. **IQ-05 / IQ-09 / IQ-15 / IQ-21**：决策人书面裁定并进入 `DECISION_REGISTER.md` §2 对应行（当前四行全空，`:33/34/36/37`）。
2. **IQ-01 / IQ-02 / IQ-13**：指定签署人完成签署 + 非执行 Agent 独立验收（§2.4 空白不得代填，`:88-101`）。
3. **P0-2**：决策人书面确定 Ds Bit 权威分支与提交 SHA（含工作树口径），并在干净提交上复验 `12_/README.md` §2.1 五项（产品身份模型、产品全局 ID 唯一性、解析器输出与证据模型、静态 B2B 桩状态、四类后端进度）。
4. **B5**：`MPN-NORM-v1` 规则集与 `pbk` 编码评审冻结（含向量化测试证据）。
5. **B6**：设计文档维护人书面统一三套状态命名。
6. **B7**：PM 提交正式参数种子与命名标准。
7. **B8**：统一冻结阻断口径，裁定证据公开范围或书面豁免。
8. **Phase 1 `PASS_MOCK`**：仅独立 Reviewer 复跑（`ACCEPTANCE_PACKAGE.md` §19 的 11 项清单）后可授予。
9. **R1–R4 确认记录**：建议将仓库外的确认结论落库（由 Reviewer 操作）。

### 11.3 下一阶段生产开发准入条件（预告）

按 `FREEZE_READINESS_REVIEW.md:273-281`（§5.2 关闭顺序）：① 7/7 Phase 0 裁定 + 三项签署/验收 → ② 权威分支书面确定 + 五项复验 → ③ B5 冻结、B6 统一 → ④ B7 种子、B8 口径统一并裁定/豁免 → ⑤ P1-1/2/3/6 等契约语义修正 + 补齐 `x-open-blockers` → ⑥ 独立 Reviewer 出具冻结记录（此前 `x-contract-status` 保持 `CANDIDATE_NOT_FROZEN`）。生产实现、生产 OAuth2、生产数据库、真实同步另行授权。

## 12. 本轮实读文件清单与复核命令（补证 ⑦ 之证据基础）

### 12.1 实读文件

| 文件 | 读取程度 |
|---|---|
| `16_contract_freeze_readiness/FREEZE_READINESS_REVIEW.md` | 全文 315 行（v1.1） |
| `14_phase0_authority_adjudication/README.md` | 全文 |
| `14_phase0_authority_adjudication/DECISION_REGISTER.md` | 全文 |
| `14_phase0_authority_adjudication/PHASE0_OPEN_QUESTIONS_MATRIX.md` | 全文 |
| `12_dsbit_business_api_integration_design/API_CONTRACT_CANDIDATE_v1.md` | 全文 524 行 |
| `12_dsbit_business_api_integration_design/INTEGRATION_OPEN_QUESTIONS.md` | 头部 + §0 总览 + 裁定回填（`:34-56`、`:973-975`） |
| `12_dsbit_business_api_integration_design/README.md` | §2 系统清单 + §2.1 五项复验清单 |
| `15_phase1_mock_ui/ACCEPTANCE_PACKAGE.md` | 全文 |
| `15_phase1_mock_ui/DELIVERY_REPORT.md`、`TEST_REPORT.md`、`README.md` | 头部元数据 + 修订史 + 关键节（B1–B3 记录、测试记录） |
| `13_dsbit_duckdb_s3_pipeline/README.md` | 头部（性质确认，只读引用） |
| `MORRISHK_REPOSITORY_DISCOVERY_REPORT.md` | 确认存在（989 行）；细读留待差异核对阶段 |
| `workbench/b2b/serve_b2b.py`（icpdf-extractor） | 头部 docstring + oauth 路由段 |

### 12.2 复核命令（全部只读，可独立重跑）

```bash
cd "E:/workspace/独立站/morrishk-site-upgrade-review"

# 四目录清单与数量
for d in 12_dsbit_business_api_integration_design 14_phase0_authority_adjudication \
         15_phase1_mock_ui 16_contract_freeze_readiness; do find "$d" -type f | sort; done

# 校验
(cd 12_dsbit_business_api_integration_design && sha256sum -c SHA256SUMS.txt)
(cd 14_phase0_authority_adjudication          && sha256sum -c SHA256SUMS.txt)
(cd 15_phase1_mock_ui                         && sha256sum -c SHA256SUMS.txt)
sha256sum 16_contract_freeze_readiness/FREEZE_READINESS_REVIEW.md

# 关键提交
git log -1 --format='%H%n%P%n%ad%n%s' --date=iso 090cae9   # 父=e5637fc
git log -1 --format='%H%n%P%n%ad%n%s' --date=iso 0474b19   # 父=edd2f99 ✓
git log -1 --format='%H%n%P%n%ad%n%s' --date=iso cf150a3   # 父=159c3b3
git show --stat 090cae9; git show --stat 0474b19; git show --stat cf150a3
git branch --contains 090cae9 | tr '\n' ' '   # main + 8 个 docs 分支
git tag --contains 0474b19                     # dsbit-phase1-mock-090cae9-review

# 基线一致性（三条均应输出为空）
git diff --stat cf150a3..main -- 12_dsbit_business_api_integration_design \
    14_phase0_authority_adjudication 15_phase1_mock_ui 16_contract_freeze_readiness
git diff --stat main..HEAD   -- 12_dsbit_business_api_integration_design \
    14_phase0_authority_adjudication 15_phase1_mock_ui 16_contract_freeze_readiness
git log --oneline cf150a3..main -- 16_contract_freeze_readiness

# 工作区只读确认
git status --short && git diff --stat && git diff --cached --stat   # 详见 §13
```

## 13. 本轮只读调查的 Git 工作区状态（补证 ⑦）

### 13.1 评审仓库 `morrishk-site-upgrade-review`（本报告所在）

- `git diff --stat` → **空**；`git diff --cached --stat` → **空**：**零被跟踪文件修改、零暂存变更**。
- `git status --short` 仅 6 项**未跟踪**内容：
  1. `10_scope_confirmation/Morrishk 全项目开发总规划.docx`（本轮前已存在）
  2. `10_scope_confirmation/Morrishk 全项目开发总规划.md`（本轮前已存在）
  3. `10_scope_confirmation/Morrishk 功能范围确认书 V1.0.docx`（本轮前已存在）
  4. `24_morrishk_v1_1_r4_2_revision/Morrishk_SEO_Elements_and_Page_Spec_V1.0.xlsx`（本轮前已存在）
  5. `commercial-kickoff-workbench/`（本轮前已存在）
  6. **`SESSION_B_CONTEXT_RECOVERY_REPORT.md`（本报告，本轮唯一新增文件）**
- 未执行任何 `git add` / `commit` / `branch` / `checkout` / `stash` / `reset` / `rebase` / `push`。

### 13.2 `morrishk-site` 仓库

`git status --short` → 空（干净）；HEAD `cdb9c04`。本轮仅运行识别命令，未触碰。

### 13.3 `icpdf-extractor`（Ds Bit）仓库

`git status --short` 当前 21 项，与**本轮会话起始快照逐项一致**（本轮未产生任何新变更）：
`A .dockerignore`、`M .gitignore`、`A deploy/dsb/`（Dockerfile、README、docker-compose.yml、nginx/ 5 文件、rollback.sh）、`A workbench/_g0/`（browser.py、common.py、t1_bbox.py）、`A workbench/b2b/qa_console.html`、`M workbench/index.html`、`M workbench/serve_parser.py`、`?? deploy/dsb/evidence/`、`?? docs/g0_evidence/`、`?? workbench/b2b/serve_b2b.py`。
HEAD `600439a5`（分支 `backup/full-local-20261114`）与 `14_/DSBIT_AUTHORITY_BASELINE.md` 记录一致——该现场为 Phase 0 取证时已存在的状态，本轮仅只读查看。

### 13.4 `morries` 目录

非 Git 目录；本轮仅列目录，未读取/未写入内容。

### 13.5 只读声明

本轮（v1.0 + v1.1 两轮恢复）全部操作为：目录列举、git 只读查询、`sha256sum -c`、文件阅读。**产生的文件系统变更仅有 1 项：评审仓库根新增本报告文件。** 未修改任何原有文件（评审仓库 tracked diff 为空即为证），未运行任何测试、服务、解析、数据库或网络操作。

---

## 14. 勘误记录（v1.2，对应 Reviewer「PASS WITH CORRECTIONS」裁定）

| # | 裁定指出的问题 | 核实结果 | 修正 | 原始验收基线是否改动 |
|---|---|---|---|---|
| 1 | 「`15_` 17 个文件却报 17 项全 OK」计数矛盾 | 实测：`15_/SHA256SUMS.txt` 登记 **16 项**（`wc -l` = 16；目录 17 个文件 = 16 项被校验对象 + `SHA256SUMS.txt` 自身不入册）；`sha256sum -c` 实际输出 **16 行全 OK**。v1.1 报告 §3.5 写「17 项全 OK」是**本报告笔误**，把目录文件数（含 SUMS 自身）误当作校验项数 | §3.5 命令注释改为「16/16 OK（登记 16 项）」；本节留痕 | **否**——`15_/SHA256SUMS.txt` 及其覆盖的 16 项哈希与 `0474b19`/`090cae9` 验收基线逐字节一致（见 §3.5），验收基线零改动 |
| 2 | R1–R4「交接声明通过」与 `FREEZE_READINESS_REVIEW.md` 仍为 `REVISED_AWAITING_REVIEW` 需明确区分 | 裁定成立。两类证据层次不同：交接确认是仓库外文书；仓库内无批准记录（`:8` 状态字段、`git log cf150a3..main -- 16_` 为空均实测） | §6 固化双层次口径：**HANDOVER-CONFIRMED（交接确认通过）** ≠ **IN-REPO APPROVAL（仓库内正式批准记录，不存在，待落库）**。Phase 1 全部后续产出引用 R1–R4 时必须同时标注两个层次 | 否 |

本节为登记性勘误，不改变 §1–§13 任何事实结论（§3.5 计数勘误除外，已在原位修正并留痕）。

---

**本报告边界**：只做上下文恢复与补证，未修改任何原有正式设计文档、未修改代码、未创建 API 实现、未执行任何被禁止操作。Reviewer 已裁定 PASS WITH CORRECTIONS 并启动 Phase 1；本报告 v1.2 为该裁定的勘误落点，后续实质工作在独立分支进行。
