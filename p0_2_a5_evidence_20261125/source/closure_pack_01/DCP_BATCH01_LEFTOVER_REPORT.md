# DCP 第一批遗留事项处理报告

| 项 | 值 |
|---|---|
| 文档编号 | REVIEW-P02-DCP01-LEFTOVER-20261125 |
| 版本 | v1.0（准备报告；**未执行 A.5、未提交**） |
| 日期 | 2026-11-25（Asia/Shanghai） |
| 仓库 / 分支 | `E:\workspace\icpdf-extractor` / `docs/p0-2-dc-decision-20261125` |
| 起始 HEAD | `1f6943f2681a2910d19bf76e6266bb4cd0620a3f` |
| 权威基线 | `feat/gate6a-audit@5dcecd21a9bf3f7f7046cc8c769fcfbcd2adf1e5` |
| 性质 | 第一批遗留事项准备；不启动第二批 |

---

## 1. A.5 回滚补测

### 1.1 授权状态：`NOT_EXECUTED`

本轮指令将 A.5 设定为"**Owner 已明确授权后**才允许执行"，但指令本身**未包含明确的 A.5 执行授权语句**。按停止条件「A.5 没有明确 Owner 授权 → 停止」，本轮：

- **未连接任何数据库**（未启动 MySQL 实例；`127.0.0.1:3317` 无监听）；
- **未执行任何 SQL**；
- 仅准备方案与 SQL 文件。

> 若 Owner 确认授权，需在独立 MySQL 8.4 实例执行并另行归档原始输出与哈希；补测 PASS 也不等于生产验证 PASS。

### 1.2 补测方案

| 项 | 内容 |
|---|---|
| SQL | `closure_pack_01/a5_rollback_supplement.sql`（SHA-256 `917a6a553444f8d0a983c7c45b3b012fe8adb60a563dd8a7cae89d8536bfbe99`） |
| 数据库 | `p02_a5_rollback_test`（专用，可重建） |
| 表 | `t_rollback(mpn_norm,brand_norm)`，唯一键 `uk_identity`，`utf8mb4_0900_as_cs` |
| 步骤 | 事务前计数 → `START TRANSACTION` → `INSERT` → 事务内计数 → `ROLLBACK` → 回滚后计数 |
| 预期 | `pre_count=0`、`in_txn_count=1`、`post_count=0` |

### 1.3 执行前置（待 Owner 授权）

1. 明确 Owner 书面授权（隔离实例 A.5 补测）。
2. 独立隔离实例（`127.0.0.1`，专用 datadir），**禁止**生产。
3. 记录：服务器版本、实例地址、数据库、执行命令、SQL、原始输出、SHA-256。
4. 仅报告结果，**不自行修改 D-1 最终状态**，交独立 Reviewer 复核。

---

## 2. IQ-01 签署准备

### 2.1 原文（复核 @27e62b1）

| 文件 | 行号 | 要点 |
|---|---|---|
| `14_phase0_authority_adjudication/DECISION_REGISTER.md` | `§2.1:46-59` | 废弃 `doc-id`；`prod-{document_id}` 仅内部临时凭证；`MPN+Brand`；唯一键 `(mpn_norm,brand_norm)`；**推翻原建议 A（Ds Bit 全局注册表 + ULID）** |
| 同上 | `§2.4:92` | IQ-01「待签署 / 签署人未指定 / 独立验收未完成」 |
| `14_phase0_authority_adjudication/IQ01_PRODUCT_IDENTITY_ADJUDICATION.md` | `§9.1:262-264` | Q1-a `MPN+Brand`；Q1-b 不引入 Ds Bit 全局注册表；Q1-c `identity_scope` 未裁 |
| 同上 | `§9.3:279` | 选项 A（Ds Bit 注册表 + ULID）不再是方向 |
| 同上 | `§9.4:285` | 仍开放：归一规则、`pbk` 编码、`identity_scope` 入键、Brand 主数据 |

### 2.2 解释对照与越界检查

| 检查 | 结论 |
|---|---|
| 现有 `OWNER_INTERPRETED` | 禁止**外部跨系统**全局注册服务；**允许内部** Product Identity Table；`product_uid` 仅技术主键 |
| 是否与原文直接冲突 | **未发现直接冲突**：原文推翻的是"Ds Bit 全局注册表 + ULID 签发"，未逐字禁止内部表 |
| 是否超出原始问题范围 | Q1-b 讨论"ID 签发者"，内部表属该范围；但"允许内部表"是**解释性扩展**，原文未逐字允许 |
| 边界要求 | 内部表不得演变为外部全局注册服务或 ULID 跨系统签发；不得据此推导跨租户共享/访问授权 |

### 2.3 Owner 签署记录模板（留空，未代签）

| 字段 | 值 |
|---|---|
| 决策编号 | IQ-01 |
| 签署人 | ________ |
| 签署日期 | ________ |
| 签署方式 | ________（书面 / 电子签 / 任务书转录，需 Owner 指定） |
| 签署状态 | **`PENDING`**（未签署） |
| 独立验收 | **`NOT_TESTED`**（需非执行方） |

> 不推断日期、不代填签署人、不把历史原则确认升级为正式签署。

---

## 3. IQ-15 字段分类

### 3.1 Owner 可确认的设计契约

| 字段 | 当前值 | 状态 |
|---|---|---|
| DB Engine | MySQL | `OWNER_SELECTED` |
| Version | 8.4 LTS | `OWNER_SELECTED` |
| Character Set | `utf8mb4` | `OWNER_SELECTED` |
| Collation（候选） | `utf8mb4_0900_as_cs` | `OWNER_SELECTED`（候选）+ 隔离技术验证 `PASS`；生产 `NOT_TESTED` |
| Storage Engine | 候选 InnoDB（**未批准**） | `PENDING_OWNER_DECISION`（不得推断） |

### 3.2 必须由部署环境责任人提供

| 字段 | 状态 | 来源要求 |
|---|---|---|
| `sql_mode` | `PENDING_ENVIRONMENT_OWNER` | 运维/部署负责人 |
| Time Zone | `PENDING_ENVIRONMENT_OWNER` | 运维 |
| `lower_case_table_names` | `PENDING_ENVIRONMENT_OWNER` | 运维（初始化参数） |
| Connection Charset（client/connection/results） | `PENDING_ENVIRONMENT_OWNER` | 应用/运维 |
| Migration Account / 权限 | `PENDING_ENVIRONMENT_OWNER` | DBA/安全 |
| Backup / HA | `PENDING_ENVIRONMENT_OWNER` | 运维 |
| Target Database Name | `PENDING_ENVIRONMENT_OWNER` | 运维/架构 |
| 行格式 / 索引键长上限 | `PENDING_ENVIRONMENT_OWNER` | 运维 |

> **不得**用本机默认值填补，**不得**把隔离实例配置冒充生产配置。

---

## 4. 本轮文件变更（未提交）

| 文件 | 类型 | SHA-256 |
|---|---|---|
| `closure_pack_01/a5_rollback_supplement.sql` | 新增（未执行） | `917a6a553444f8d0a983c7c45b3b012fe8adb60a563dd8a7cae89d8536bfbe99` |
| `closure_pack_01/DCP_BATCH01_LEFTOVER_REPORT.md` | 新增（本报告） | 见 `closure_pack_01/SHA256SUMS` |
| `closure_pack_01/SHA256SUMS` | 更新 | — |
| 父级 `SHA256SUMS` | 更新 | — |

未修改：`dc03_collation_test.sql`、`dc03_collation_output.txt`、DC-01/DC-02/DC-03 既有内容、D-B 原始证据、`runs/`、历史快照。

---

## 5. Git 状态

- 分支 `docs/p0-2-dc-decision-20261125`；起始 HEAD `1f6943f`。
- 本轮文件为**未提交**的 docs-only 变更；**未推送、未合并、未 rebase、未 amend**。
- `feat/gate6a-audit` = `5dcecd2`（未变）；`origin/feat/gate6a-audit` = `5dcecd2`（未变）。
- `stash@{0}` 未触碰。

> 按指令「提交前报告变更文件清单和目的」，本轮**先报告，不提交**，等待 Owner 确认后再独立追加提交。

---

## 6. 未解决事项

| # | 事项 | 依赖 |
|---|---|---|
| 1 | A.5 补测执行 | **Owner 明确授权** + 隔离实例 |
| 2 | IQ-01 正式签署 | Owner 指定签署人/日期/方式 |
| 3 | IQ-01 独立验收 | 非执行方 |
| 4 | IQ-15 环境字段 | 部署环境责任人 |
| 5 | D-1 套件仍 `PARTIAL` | A.5 补齐 + Reviewer 复核 |
| 6 | D-2/D-3/D-4/D-6、D-B 修复、G1–G6、75-item | 后续授权 |

---

## 7. 是否需要独立 Reviewer 复核

- **需要**：A.5 若执行，结果须由独立 Reviewer 复核后方可更新 D-1。
- 本轮仅为准备，**不改变**任何状态：D-1 套件 `PARTIAL`；IQ-01 `PENDING/NOT_TESTED`；IQ-15 登记 `PENDING`；Contract Freeze `NOT_READY`；Implementation Authorization `NOT_GRANTED`；第二批未启动。
