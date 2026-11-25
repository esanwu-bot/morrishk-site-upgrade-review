# P0-2 实施授权前置条件清单

| 项 | 值 |
|---|---|
| 文档编号 | REVIEW-P02-IMPL-PRECOND-20261125 |
| 版本 | v1.1（Owner Final Decision Round 后状态同步；**未授权、未实施**） |
| 日期 | 2026-11-25（Asia/Shanghai） |
| 权威基线 | `feat/gate6a-audit@5dcecd21a9bf3f7f7046cc8c769fcfbcd2adf1e5` |
| 决策分支 | `docs/p0-2-dc-decision-20261125` |
| 关联 | `D-C_OWNER_IDENTITY_DECISION.md`、`P0_2_OWNER_FINAL_DECISION_MATRIX.md`、`P0_2_OWNER_FINAL_DECISION_GUIDE.md` |
| Owner acceptance | Owner 已接受 D-1…D-7 原则/方向；**不自动关闭任何技术前置项** |
| 性质 | 只读清单；不改变任何状态门槛，不构成实施授权 |

**分类定义**
- `MUST_CLOSE_BEFORE_IMPLEMENTATION`：不关闭则实现无法安全开始。
- `CAN_DEFER_WITH_OWNER_ACCEPTANCE`：可在首期范围外延期，须 Owner 书面接受范围。

**状态词**：`CLOSED / OPEN / NOT_READY / BLOCKED`（本清单内部状态）。

---

## 0. 状态总览

| ID | 前置条件 | 分类 | 当前状态 |
|---|---|---|---|
| P-01 | IQ-01 签署/解释生效 + 独立验收 | `MUST_CLOSE` | `NOT_READY`（解释已 Owner 裁决；签署/验收未完成） |
| P-02 | IQ-15 正式登记 | `MUST_CLOSE` | `NOT_READY`（Engine/Version/Charset 已选；登记未签） |
| P-03 | Collation + 唯一键实例验证 | `MUST_CLOSE` | `NOT_READY` |
| P-04 | MPN-NORM-v1 完整规则 | `MUST_CLOSE` | `OPEN`（方向已定；完整规范未定） |
| P-05 | pbk 精确规范 + 测试向量 | `MUST_CLOSE` | `NOT_READY`（方向已定；规范/向量未完成） |
| P-06 | Catalog 首期概念模型 | `MUST_CLOSE` | `OPEN`（方向已定；概念模型未定） |
| P-07 | 首期租户隔离边界 + 测试 | `MUST_CLOSE` | `OPEN`（原则已定；模型/测试未定） |
| P-08 | D-B FAIL 修复策略 | `MUST_CLOSE` | `OPEN`（要求已归档；策略未定） |
| P-09 | D-A…D-J 首期前置决策 | `MUST_CLOSE` | `OPEN`（部分已决；未全部满足） |
| P-10 | 范围/验收/迁移/回滚/失败处理 | `MUST_CLOSE` | `OPEN`（范围已收窄；其余未定稿） |
| P-11 | Owner 最终实施授权 | `MUST_CLOSE` | `BLOCKED`（`NOT_GRANTED`） |
| P-12 | B8 summary | 条件性：含 `/evidence` → `MUST_CLOSE`；否则 `CAN_DEFER` | `NOT_READY`（Phase 2） |
| P-13 | API 级错误语义/证据关联/审计 | 条件性：API → `CAN_DEFER`；解析链 error semantics → `MUST_CLOSE` | `NOT_READY` |
| P-14 | 新 LF 快照 | `CAN_DEFER` | `OPEN`（独立批次） |
| P-15 | 75-item 授权 | 条件性：账号 API → `MUST_CLOSE`；仅解析/身份 → `CAN_DEFER` | `NOT_READY`（0/75） |
| P-16 | Contract Freeze G1–G6 | 条件性：API/契约 → `MUST_CLOSE`；仅解析/身份 → `CAN_DEFER` | `NOT_READY` |

> **Owner 接受原则 ≠ 技术前置关闭**：P-03/P-04/P-05/P-06/P-07 等仍按上表保持 `OPEN`/`NOT_READY`。

---

## 1. 前置条件明细

| ID | 前置条件 | 分类 | 为什么阻塞 / 可延期 | 证据 / 来源 |
|---|---|---|---|---|
| P-01 | IQ-01 签署/解释生效 + 独立验收 | `MUST_CLOSE` | 实现依赖"内部 Identity Table 合法"解释；签署/验收未完成则缺正式依据 | `DECISION_REGISTER §2.4:92`（@27e62b1）；`D-C…§3` |
| P-02 | IQ-15 正式登记 | `MUST_CLOSE` | Owner 已选 MySQL 8.4/utf8mb4，但登记行仍空；DDL 需正式依据 | `DECISION_REGISTER:36`；`D-C…§3A` |
| P-03 | Collation + 唯一键验证 | `MUST_CLOSE` | 唯一索引/等值语义取决于 collation；未验证可能静默合并 | `P0_2_OWNER_FINAL_DECISION_MATRIX.md D-1` |
| P-04 | MPN-NORM-v1 完整规则 | `MUST_CLOSE` | 无完整规则则 `mpn_norm`/`brand_norm`/`pbk` 不确定 | `DECISION_REGISTER §2.1:49-51,59`；`IQ01…§9.4:285` |
| P-05 | pbk 精确规范 + 向量 | `MUST_CLOSE` | `pbk` 是身份主键；无规范/向量无法证明确定性 | `12_/API_CONTRACT_CANDIDATE_v1.md §4.3:120-132`；`26_/TEST_AND_ACCEPTANCE_CRITERIA.md §B-2`；`26_/FIXTURE_DATA_SPEC.md` F-11 |
| P-06 | Catalog 首期概念模型 | `MUST_CLOSE` | 可见集与权限边界未定则无法设计查询/授权 | `D-C…§3C` |
| P-07 | 首期租户隔离边界 + 测试 | `MUST_CLOSE` | 边界与拒绝测试未定则无法验证"默认禁止跨租户" | `OAUTH_TENANT_SITE_TPA_ARCHITECTURE.md:4-8,50-52,61` |
| P-08 | D-B FAIL 修复策略 | `MUST_CLOSE` | 跨 PDF 身份/Global ID/evidence.json/qc_report/linkage/error semantics 均 FAIL | `P0_2_OWNER_DECISION_EVIDENCE_PACKET.md §3`；D-B 归档 `CD4473F6…` |
| P-09 | D-A…D-J 首期前置决策 | `MUST_CLOSE` | 基线/身份/证据/后端决策不齐则范围不稳 | `D-C_OWNER_IDENTITY_DECISION.md`、D-A/D-J 决策文件、设计包 `@1034338` |
| P-10 | 范围/验收/迁移/回滚/失败处理 | `MUST_CLOSE` | 无验收/回滚无法控制变更与恢复 | `P0_2_IDENTITY_IMPLEMENTATION_SCOPE_PROPOSAL.md` |
| P-11 | Owner 最终实施授权 | `MUST_CLOSE` | 当前 `NOT_GRANTED`；未签署不得动工 | `P0_2_IMPLEMENTATION_AUTHORIZATION_REQUEST.md` |
| P-12 | B8 summary | 条件性 | 首期不含 `/evidence`；若扩大范围则必须关闭 | `D-C…§3D`；`12_/API_CONTRACT_CANDIDATE_v1.md §11.2:447` |
| P-13 | API 级错误语义/证据关联/审计 | 条件性 | 首期不含 API 可延后；解析链 error semantics 必须关闭 | D-B Item 7 PARTIAL；`06_error_semantics.json` |
| P-14 | 新 LF 快照 | `CAN_DEFER` | 历史保持；新快照独立批次；`pipeline.py` 变更需另批重授权 | `D-C…§3E`；`P0_2_OWNER_DECISION_EVIDENCE_PACKET.md §7` |
| P-15 | 75-item 授权 | 条件性 | 解析/身份不依赖 API 授权；API 实现必须 75 项正式授权 | `75_ITEM_AUTHORIZATION_READINESS.md`（0/75） |
| P-16 | Contract Freeze G1–G6 | 条件性 | 身份实现不必先冻结契约；对外冻结前必须 G1–G6 | `BUSINESS_API_CONTRACT_FREEZE_READINESS.md`（NOT_READY） |

---

## 2. 首期范围与延期集合

### 2.1 首期范围（Owner 已接受）
**内部产品身份 + 最小租户内 Catalog 基础能力；不包含 Business API、B8 summary、原始 evidence API 或 `/evidence`。**

### 2.2 必须关闭（首期范围内）
P-01…P-11 全部（P-12/P-13 API 级、P-15、P-16 不属首期）。

### 2.3 可延期（须 Owner 接受）
- P-12 B8 summary；
- P-13 API 级错误语义；
- P-14 新 LF 快照；
- P-15 75-item 授权；
- P-16 Contract Freeze。

延期条件：**首期不包含 Business API / `/evidence`**。若未来扩大范围，必须重新评估并可能转为 `MUST_CLOSE`。
P-16 不得因本轮归档提前执行；P-15 不得自动变为授权。

---

## 3. 不可自动升级项

| 项 | 保持状态 |
|---|---|
| IQ-01 签署 / 独立验收 | `PENDING` |
| IQ-15 登记 | 空 |
| D-1 技术验证 / D-2 完整规范 / D-3 向量 / D-4 概念 / D-6 模型测试 | `OPEN` / `NOT_READY` |
| B8 summary | `NOT_READY` |
| Contract Freeze | `NOT_READY` |
| 75-item authorization | `0/75` |
| 实施授权 | `NOT_GRANTED` |

---

## 4. D-B FAIL 后续必须处理（仅归档，不执行）

| # | D-B FAIL 项 | 处理要求 |
|---|---|---|
| 1 | 跨 PDF 同 MPN 身份分裂 | 同 `MPN+Brand` → 同一身份；修复后重新验证 |
| 2 | 全局 ID 不稳定 | 稳定确定性业务键 + 唯一约束 |
| 3 | `evidence.json` / `qc_report` / linkage 缺失 | 产出证据与 QC；建立检索链 |
| 4 | 错误语义不完整 | 运行链端到端 fail-closed |
| 5 | CRLF 字节比较失败的历史证据 | 保留原证据；新 LF 快照另批 |

> 修复必须保留原始 D-B 证据并对相关失败条件重新验证；不得改写 D-B FAIL。

---

## 5. 边界声明

- 本清单不改代码/DDL/API/测试/证据；不连接数据库、不执行验证。
- 技术验证项均为**计划**，未产生结果。
- 所有状态保持原值；未推送、未合并；`IMPLEMENTATION_AUTHORIZATION = NOT_GRANTED`。
