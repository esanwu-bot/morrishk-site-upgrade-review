# CAND-04 Registry 必要性分析与模块路径建议

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-CAND04-001 |
| 版本 | v0.1-DRAFT |
| 日期 | 2026-11-26 |
| 状态 | **DRAFT — ANALYSIS_ONLY — NOT_APPROVED** |
| 依据 | Owner 要求重新评估 Registry 必要性；45_ 技术评审；46_ 双字段模型 |
| 基线 | `feat/gate6a-audit@5dcecd21a9bf3f7f7046cc8c769fcfbcd2adf1e5` |

## 1. 问题

CAND-04 原为 `src/icpdf/domain/product_registry.py`（后建议 `product_identity_registry.py`）。在以下新方向下，是否仍有实际职责：

- `product_business_key` 由可信 Brand + 规范化 MPN **确定性生成**；
- `product_uid` 为内部代理键，**不由 MPN/Brand 计算**；
- 不承诺跨进程/跨机器注册表唯一；
- 不引入 DB/DDL。

## 2. 现状证据

| 证据 | 结果 |
|---|---|
| `pyproject.toml:12-20` | 依赖仅 pymupdf/pydantic/typer/rich/dotenv/pillow/pyyaml；无 DB/ORM |
| `src/icpdf` 现有注册表 | `parser/candidate_registry.py` 为解析候选注册表，与产品身份无关 |
| `parser/logical_identity.py` | S2b source-instance identity，与产品全局 ID 无关 |
| 当前产品身份 | `Product` 为文档内模型；`product_id=prod-{document_id}`；无产品注册表 |
| 持久化/锁 | 无 DB、无文件注册表、无跨进程锁机制 |

## 3. 职责拆解

| 职责 | 是否可由确定性函数完成 | 是否需要 Registry/持久化 |
|---|---|---|
| 归一化 MPN/Brand | 是 | 否 |
| 生成 `product_business_key` | 是（纯函数） | 否 |
| 同输入返回同 key | 是 | 否 |
| 生成/分配 `product_uid` | 否（代理键） | 若需跨 run 稳定，**需要持久化**；否则仅进程内/外部输入 |
| 保证 business key 唯一 | 确定性映射天然一对一（碰撞概率除外） | 不需要注册表 |
| 审批/合并/拆分/别名治理 | 否 | 需要持久化与审计 |
| 跨进程/跨机器唯一 | 否 | 需要 DB/外部服务（当前排除） |

## 4. 结论

**CAND-04 在当前 P0-2 最小范围内没有独立、不可替代的职责。**

- 若只做确定性 `product_business_key`：不需要 Registry；
- 若要稳定 `product_uid` 或 merge/split/alias 审计：必须引入持久化（DB/文件锁），超出当前 B-1 范围与 P-11 准备范围；
- 为避免“为保留候选路径而引入无职责模块”，建议：
  1. **从当前 allowlist 移除 CAND-04**；
  2. 不创建 `product_identity_registry.py`；
  3. `product_uid` 当前阶段允许缺省或由外部输入提供（待 Owner 决定）；
  4. CAND-08 由 `test_global_id_registry.py` 改为 `test_product_business_key.py`（或并入 CAND-07）。

## 5. 最终模块路径建议

| 模块 | 建议 | 理由 |
|---|---|---|
| `src/icpdf/domain/product_identity.py` | **保留**（纯函数/值对象） | 归一化、自然键、business key、校验 |
| `src/icpdf/domain/product_identity_registry.py` | **不引入（当前范围）** | 无持久化时无实际职责；仅保留路径会制造空模块 |
| `tests/unit/test_product_identity.py` | 保留 | 覆盖 C1–C7 契约 |
| `tests/unit/test_global_id_registry.py` | **撤销/更名** | 改为 `test_product_business_key.py` 或并入上述 |
| `tests/integration/test_product_identity_flow.py` | 保留（条件性） | 使用确定性 business key；不依赖 Registry |

## 6. 何时才需要 Registry

仅当 Owner 另行决定以下之一时：

1. 允许文件持久化（含并发锁）保存 business key → product_uid 映射；
2. 允许 DB/DDL 持久化；
3. 要求 merge/split/alias/审计工作流。

届时需单独授权、单独评审；不得在当前 P0-2 范围顺手引入。

## 7. 对 P-06 allowlist 的影响

| CAND | 修订 |
|---|---|
| CAND-04 | **REMOVE_FROM_CURRENT_ALLOWLIST**（无职责） |
| CAND-08 | **REVISE**：更名/改为 business key 测试 |
| CAND-09 | 保留条件性；不依赖 Registry |
| CAND-03 | 仍受 B5 冻结阻断 |
| CAND-02 | 仍受 pipeline 快照阻断 |

## 8. 待 Owner 决定

1. 是否同意移除 CAND-04；
2. `product_uid` 当前阶段缺省/外部输入/持久化；
3. CAND-08 更名或并入 CAND-07；
4. 是否将 Registry 明确列为“后续持久化批次”而非当前范围。

## 9. 非声明

- 本分析不是 P-06 批准、不是模块创建授权；
- 未修改代码/测试；未运行测试；
- 未引入 DB/DDL/Registry。