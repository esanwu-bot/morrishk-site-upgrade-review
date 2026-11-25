# P0-2 实施授权申请（Owner Signable Request）

| 项 | 值 |
|---|---|
| 文档编号 | REVIEW-P02-IMPL-AUTHZ-REQ-20261125 |
| 版本 | v1.2（Owner Final Decision Round 已归档；**待 Owner 最终签署**） |
| 日期 | 2026-11-25 |
| 关联决策 | D-C（`OWNER_DECISION_ACCEPTED`）、D-J（design-only 已批准） |
| 关联方案 | `P0_2_IDENTITY_IMPLEMENTATION_SCOPE_PROPOSAL.md` |
| 权威基线 | `feat/gate6a-audit@5dcecd21a9bf3f7f7046cc8c769fcfbcd2adf1e5` |
| Owner decision | D-1…D-7 方向已接受（Sign-off Pending）；**实施授权未授予** |
| 首期范围 | **内部产品身份 + 最小租户内 Catalog；不含 Business API / B8 summary / 原始 evidence API / `/evidence`** |
| **Authorization status** | **`NOT_GRANTED`（未获批）** |

> 本文件是**申请**，不是已获批的实施范围。Owner 未书面签署前，任何实现、迁移、DDL、API 均不得开始。
> D-J 的 design-only 授权**不会**自动升级为本实施授权。

---

## 1. 申请事项

请求 Owner 就「P0-2 产品身份与证据最小实施」作出明确决定，并在 §12 选择其一。

---

## 2. Authorized branch / baseline（申请值）

| 项 | 申请值 |
|---|---|
| 基于基线 | `5dcecd21a9bf3f7f7046cc8c769fcfbcd2adf1e5` |
| 建议实现分支 | `feat/p0-2-identity-impl`（从上述基线新建；具体名称待 Owner 确认） |
| 禁止 | 在 `feat/gate6a-audit` 直接开发；force-push；改写历史；合并到权威分支（除非另行授权） |

---

## 3. Allowed files and modules（申请值）

| 类别 | 允许范围（申请） |
|---|---|
| 领域模型 | `src/icpdf/domain/product.py`、`domain/evidence.py`、`domain/parameter.py` 及新增身份模块 |
| 解析链 | `src/icpdf/parser/pipeline.py`（身份回填、evidence/qc 产出） |
| 新增模块 | 归一化 / 身份匹配 / 持久层适配 / 产物写出（仅申请范围内） |
| 测试 | `tests/` 下新增/扩展身份、证据、迁移、隔离测试 |
| 配置 | `pyproject.toml`（仅新增必要依赖，需逐项列明） |
| 禁止 | 原始证据包、`reviewer/` 历史文档、stash、未列明的模块 |

> 依赖新增（如 DB 驱动、ORM、迁移工具）须在授权中**逐项列明并批准**；未列明不得安装。

---

## 4. Allowed database schema / migration（申请值）

| 项 | 申请值 |
|---|---|
| 引擎 | **MySQL 8.4 LTS**（Owner 已选定；见 D-C §3A） |
| Charset / Collation | `utf8mb4`；Collation **`OPEN`**（候选 `utf8mb4_0900_as_cs` / `utf8mb4_bin`，待 MySQL 8.4 验证） |
| DDL 范围 | 仅**新增**表/索引/约束（Product、Brand、Manufacturer、Document、ProductDocument、ProductLineage、identity_pending、ParsingJob/Result、Evidence、Parameter 等） |
| 迁移 | 新增 migration 文件；**禁止**破坏性 DDL、DROP、无备份数据变更 |
| 生产库 | **禁止**连接或写入生产数据库 |
| 未经授权 | **Engine 已选 ≠ DDL 已授权**；未获本授权前不得执行任何 DDL |

---

## 5. Allowed API and contract changes（申请值）

| 项 | 申请值 |
|---|---|
| API 实现 | **禁止** |
| OpenAPI 修改 | **禁止** |
| 契约分析 | 允许（只读影响分析文档） |
| Contract Freeze | **禁止**（G1–G6 未关闭） |

---

## 6. Prohibited scope（禁止范围）

- OAuth / Tenant / Site / TPA 实际实现。
- Business API 端点、OpenAPI、契约冻结。
- 75 项授权（保持 `0/75`，不得改为已授权）。
- 生产部署、灰度、真实客户数据、真实 SMTP/第三方询价。
- 恢复/提交/合并 `stash@{0}`。
- 修改原始复验输出、`runs/`、原始哈希清单、D-B 结论归档。
- 修改 P0-2 / C2 / Contract Freeze / Business API Approval / Backend Architecture / Production 状态门槛。
- 把设计材料、候选模型、测试桩描述为已实现/已冻结/已批准。

---

## 7. Acceptance criteria（申请值）

| # | 标准 |
|---|---|
| AC-1 | 不同 PDF、同 `MPN+Brand` → 同一 `product_uid` |
| AC-2 | 同一自然键跨 run → 同一 `product_uid`；唯一约束阻止重复注册 |
| AC-3 | 同 PDF 重复解析：`document_id`/`product_uid`/候选稳定，`run_id` 变化 |
| AC-4 | 每次 Run 生成 `evidence.json` 与 `qc_report.json`，schema 校验通过 |
| AC-5 | `evidence → parameter → product → document` 检索链可解析 |
| AC-6 | 缺失证据/身份冲突在运行链可触发并产出失败记录 |
| AC-7 | 缺失 Brand / 冲突 → `identity_pending`，不静默合并 |
| AC-8 | merge/split/alias 写谱系、可审计、不物理删除 |
| AC-9 | 全量回归 816 collected、**零新增失败**；CRLF 快照按 §9 处理 |

---

## 8. Required automated tests（申请值）

- 单元：归一化规则/版本、自然键匹配、冲突挂起、幂等键、`product_uid` 不可变。
- 集成：固定样本 A/B 跨 PDF 身份一致性；同 PDF 重解析稳定。
- 产物：`evidence.json`/`qc_report.json` schema、哈希一致、manifest 登记。
- 迁移：空库建表、回滚 dry-run、双读一致性、不覆盖旧数据。
- 安全：跨 Tenant 拒绝、证据按 tenant 过滤、审计三作用域。

---

## 9. Regression requirements（申请值）

- 全量 pytest 保持 **816 collected**、**零新增失败**。
- `test_a1_10_pipeline_py_is_byte_identical_to_the_authorised_snapshot`：因 `pipeline.py` 将变更，
  须由 Owner 二选一：
  - (A) 授权重新签署新的快照哈希；或
  - (B) 书面豁免该断言并替换为等价行为测试。
- 未处理该决策前，不得把既有 CRLF 失败改写为 PASS，也不得隐藏 skip/xfail。

---

## 10. Data migration and rollback plan（申请值）

- 仅新增；迁移前备份（如适用）；迁移后校验和。
- 回滚：停写 → 回退读路径 → 新表保留只读；保留旧 `prod-doc-*` 映射与双读开关。
- 回填失败批次隔离，**不得**用新坏数据覆盖既有好数据。
- 任何破坏性 DDL 需单独审批（本申请不含）。

---

## 11. Security and tenant-isolation checks（申请值）

- 全局实体（Product/Brand/Manufacturer）写入仅经审批入口（D-49 候选）。
- 文档/证据默认私有，跨 Tenant 读取经 TPA + 资源可见性双重校验。
- 缓存键含 tenant/site/visibility；审计记录 `scope∈{GLOBAL,TENANT,SITE}`。
- Site 归属由 Token 派生，禁止请求体覆盖。

---

## 12. Independent Reviewer requirements（申请值）

- 实现完成后由**未参与实现**的 Agent 执行针对性验证，覆盖 AC-1…AC-9。
- Reviewer 检查证据（日志、JSON、哈希、产物）后出具结论；未通过不得合入权威分支。
- 独立复验不得由实现者自证。

---

## 13. Stop conditions（停止条件）

出现下列任一情形，实现必须立即停止并回报 Owner：
1. 需要越权修改禁止范围内的文件/模块。
2. 需要破坏性 DDL 或生产库访问。
3. DB 引擎/IQ-01/B5 等 OPEN 决策仍未裁定却被迫实现。
4. 回归出现新增失败且无法在不掩盖的前提下解决。
5. 被要求把设计/候选/桩宣称为已实现或已批准。

---

## 14. Explicit authorization status

### 14.1 授权前仍须关闭的 `OPEN` 项

| 项 | 状态 |
|---|---|
| Collation 验证（首选 `utf8mb4_0900_as_cs`；MySQL 8.4 唯一键/索引） | 候选 `OWNER_DECIDED`；技术 `NOT_READY` |
| B5 规范化规则（MPN-NORM-v1） | 方向 `OWNER_DECIDED`；完整规范 `OPEN` |
| B5 测试向量与期望输出 | `NOT_READY`（未齐全） |
| `pbk` 精确规范/冻结 | 方向 `OWNER_DECIDED`；精确规范 `OPEN`；`NOT_FROZEN` |
| Product Catalog 概念模型 | 方向 `OWNER_DECIDED`；概念模型 `OPEN` |
| B8 受控 summary 契约 | 首期 no-summary `OWNER_DECIDED`；白名单 `OPEN`（Phase 2） |
| 跨租户共享模型 | 首期禁止；未来需另行 Owner 决策 |
| CRLF 新快照批次 | 历史保持 `OWNER_DECIDED`；新批次 `OPEN` |

```text
AUTHORIZATION_STATUS = NOT_GRANTED
```

Owner 决定栏（待填写，本文件不预填、不代签）：

| 选项 | 含义 | Owner 选择 |
|---|---|---|
| A | 批准本申请全部范围（含 §4 Collation 与 §9 快照批次） | ☐ |
| B | 部分批准（由 Owner 写明逐项裁剪） | ☐ |
| C | 暂不批准，继续设计/决策 | ☐ |
| D | 拒绝 | ☐ |

> Owner 已接受架构建议，但**未**授予实施授权。未在 Owner 书面决定中明确勾选并注明
> Collation、B5、B8 与快照批次前，本申请保持 `NOT_GRANTED`。

---

## 15. 状态门槛（申请时的只读快照，未变更）

| 状态 | 值 |
|---|---|
| P0-2 | `BLOCKED` |
| C2 | `FAIL` |
| Business API Approval | `NOT_APPROVED` |
| Contract Freeze | `NOT_READY` |
| Backend Architecture Acceptance | `NO` |
| 75-item authorization | `0/75` |
| Production / READY | `NO` |
