# CAND-09 解除 BLOCKED 的证据条件

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-CAND09-001 |
| 版本 | v0.1-DRAFT |
| 日期 | 2026-11-26 |
| 状态 | **DRAFT — CAND-09 REMAINS BLOCKED** |
| 依据 | OD-49-07；50_ P-06 v1.4；Owner 审阅意见 |
| 目标基线 | `feat/gate6a-audit@5dcecd21a9bf3f7f7046cc8c769fcfbcd2adf1e5` |

## 1. 当前状态

**CAND-09 = `BLOCKED`**，不能仅通过改名、移动测试位置或“解决 CAND-02 依赖后再评估”这类泛化表述解除。

当前阻断原因：

- `pipeline.py` 受 `tests/unit/test_assembly.py:579-595` 的 SHA-256 字节恒等断言锁定；
- `parse_pdf` 仅接收 `requested_mpn`，无 Brand 输入；
- CAND-09 的集成流程若经过 `parse_pdf`/`pipeline.py`，必然依赖 CAND-02（当前排除）。

## 2. 解除 BLOCKED 必须提交的证据

| # | 证据 | 通过标准 |
|---|---|---|
| E-01 | **实际调用路径** | 明确列出 CAND-09 测试调用的函数/模块路径；证明**不经过** `pipeline.py`/`parse_pdf`，或证明不依赖其字节快照；不得以改名/移动文件规避 |
| E-02 | **Brand 显式可信输入** | 说明 Brand 如何由测试显式传入；包含来源与 `brand_trust_status`；不得使用 `Document.manufacturer`/PDF metadata |
| E-03 | **缺失/不可信 Brand 行为** | 证明缺失、`UNVERIFIED`、`MISSING`、`REJECTED` 时不生成 business key；状态为 `PENDING_BRAND` |
| E-04 | **测试独立性** | 证明 CAND-09 测试不导入/执行 `parse_pdf`，不依赖 CAND-02、CAND-06 或 pipeline 快照；fixture 为合成/脱敏 |
| E-05 | **范围/接口影响** | 证明未引入新的隐含范围：无 DB/DDL、无 OpenAPI/OAuth/Business API、无生产、无新的公共接口契约；如引入新生产路径，需单列 Owner 审批 |

## 3. 可选实现路径（仅示例，不是授权）

| 路径 | 说明 | 是否可解除 |
|---|---|---|
| 直接调用 `ProductIdentity`/business key 纯函数 | 测试不经过 pipeline；显式传入 brand/mpn | 可能，需 E-01…E-05 |
| 新增独立编排函数（不修改 pipeline） | 新函数仅供测试/内部调用 | 需证明不构成新生产接口；仍可能触发范围审批 |
| 修改 `pipeline.py` | 被快照锁定 | **不可**；继续 BLOCKED |
| 仅改名/移动测试 | 不解决问题 | **不可** |

## 4. 解除流程

1. 提交 E-01…E-05 证据（文档级，不执行代码）；
2. Owner/Reviewer 审阅；
3. 若通过，在 P-06 修订稿中将 CAND-09 从 `BLOCKED` 改为 `INCLUDE — CONDITIONAL`；
4. 代码/测试修改仍需 P-06 最终 allowlist 批准与另行执行授权。

## 5. 当前 P-06 处理

- CAND-09 保持 `BLOCKED`；
- 不因 CAND-08 更名或 CAND-07 合并而改变 CAND-09 状态；
- 快照保护不变；
- 不创建/检出 worktree，不运行测试。

## 6. 非声明

- 本文件不是解除 BLOCKED、不是 P-06 批准；
- 未修改代码/测试；未运行项目测试；
- 未签署 Owner Record、未授予/执行 B-1。