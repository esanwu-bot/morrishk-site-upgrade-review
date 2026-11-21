# P0-2 AUTHORITY CONFIRMATION · Ds Bit 权威分支确认请求与证据缺口

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE3-P02-001 |
| 版本 | v1.0-draft（确认**请求**；执行 Agent 不认定任何分支为权威基线） |
| 上游 | `14_/DSBIT_AUTHORITY_BASELINE.md`（权威分支 `DECISION_REQUIRED`）；`16_/FREEZE_READINESS_REVIEW.md:166-176`（P0-2）；`12_/README.md` §2.1（五项复验清单） |
| 决策人 | Ds Bit 负责人 / 项目决策人 |
| 阻断关系 | P0-2：Freeze 必要条件；Session B 隔离计划/实现不依赖 Ds Bit 源码，但 Freeze 与任何真实数据对接依赖本确认 |

## 1. 当前已知信息（2026-11-21 实测，引自权威登记并复核）

| 事实 | 值 | 来源 |
|---|---|---|
| 当前检出分支 | `backup/full-local-20261114` | 本轮 `git branch --show-current` |
| 当前 HEAD | `600439a5eee69fb3a1cec2715e37080e48ca9840`（2026-11-13） | 本轮 `git rev-parse HEAD` |
| `origin/feat/gate6a-audit` | 与当前 HEAD 同 SHA（`600439a5…`） | `14_/DSBIT_AUTHORITY_BASELINE.md` §2.2 + 本轮会话起始记录 |
| 本地 `main` | `a11131a80474f3d5bea5ab6fb5204e77b8839eed`（2026-11-11），是当前 HEAD 的祖先，落后 15 个提交 | 同上 |
| `origin/main` | `853a80dd664c79ef90baaac53eefb9bbc2155dde`（2026-11-05 初始提交） | 同上 |
| 工作树 | 不干净：约 21 项未提交（`deploy/dsb/*`、`workbench/_g0/*`、`workbench/b2b/*` 暂存/修改，`deploy/dsb/evidence/`、`docs/g0_evidence/`、`workbench/b2b/serve_b2b.py` 未跟踪） | `14_/DSBIT_AUTHORITY_BASELINE.md` §2.2 + 本轮会话起始快照（逐项一致，未清理） |

三个权威分支候选（`14_/DSBIT_AUTHORITY_BASELINE.md` §1）：①`backup/full-local-20261114`（当前检出）②`origin/feat/gate6a-audit`③`main`。**本包不认定其中任何一个为权威。**

## 2. 缺失的权威证据

1. **分支指定缺失**：无决策人书面文件指定三候选之一为权威分支。
2. **工作树口径缺失**：未提交的 21 项内容（含 Ds Bit 前台改动与未跟踪静态桩）是否纳入基线，无书面口径。
3. **干净提交五项复验缺失**：`12_/README.md` §2.1 要求在权威分支**干净提交**上复验五项，结果写入冻结记录；当前未执行：
   - 产品身份模型（产品如何唯一标识、是否允许同一产品多版本）；
   - 产品全局 ID 唯一性（跨解析批次是否稳定）；
   - 解析器输出与证据模型（`EV-*`、bbox、页码、SHA 是否仍一致）；
   - 静态 B2B 桩状态（`serve_b2b.py` 是否仍为本地 stub、是否已进入版本库）；
   - 数据库、审核、版本、发布四类后端进度（是否仍为 `NOT_IMPLEMENTED`）。
4. **任一项不成立的后果**：对应 `CONFIRMED` 事实降级为 `OPEN`（`16_/FREEZE_READINESS_REVIEW.md:174-175`）。

## 3. 需要谁确认、如何确认

| 步骤 | 内容 | 责任方 | 产物 |
|---|---|---|---|
| AC-1 | 书面指定权威分支与提交 SHA（含工作树口径：纳入/排除） | Ds Bit 负责人/项目决策人 | 书面确认文件（进入冻结记录引用） |
| AC-2 | 在该干净提交上复验五项 | 非执行 Agent（独立） | 五项复验记录（逐项 PASS/FAIL + 证据行号） |
| AC-3 | 受影响 `CONFIRMED` 事实重核；不成立者降级 OPEN | 执行 Agent（获授权后）+ Reviewer 复核 | 更新的证据索引 |
| AC-4 | 确认记录进入冻结记录（P0-2 关闭） | Reviewer | 冻结记录章节 |

## 4. 对 Session B 设计基线的影响

| 影响面 | 说明 |
|---|---|
| Phase 2 PLAN / Phase 3 材料 | **不受影响**：隔离计划与决策准备不引用 Ds Bit 生产源码事实作为依据（已声明隔离） |
| 契约候选中的"现状"依据 | `12_` 中绑定 `600439a` 快照的 `CONFIRMED` 事实（引擎字段、`requested_mpn` 等）在分支裁定后需按 AC-2/AC-3 重核 |
| 未来真实数据对接 | Repository 的 DuckDB/S3 适配、真实同步——均以 AC-1/AC-2 完成为先决条件 |
| Session A（`13_`） | 只读引用；`13_` 上游绑定 HEAD `600439a5`，分支裁定后由 Session A 自行决定是否更新其上游基线（Session B 不代改） |

## 5. 确认请求文本（供决策人直接使用）

```text
P0-2 确认请求：
1. 请指定 Ds Bit 权威分支：backup/full-local-20261114 / origin/feat/gate6a-audit / main（或其他，需说明）；
2. 请明确未提交工作树内容的处置口径（纳入基线 / 排除并另行处置）；
3. 请授权在指定干净提交上执行 §2 的五项复验（由非执行 Agent 执行）。
确认人：________ 日期：________
```
