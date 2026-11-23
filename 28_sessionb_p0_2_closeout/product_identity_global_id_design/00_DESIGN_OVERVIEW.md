# Product Identity + Global ID 架构设计总览

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-000 |
| 版本 | v1.0 |
| 日期 | 2026-11-23 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 性质 | 架构选项、推荐与待决事项；不是已批准架构、不是实现、不是契约冻结 |
| 事实基线 | Ds Bit `feat/gate6a-audit` / `600439a5eee69fb3a1cec2715e37080e48ca9840`（干净工作区） |
| 上游 | `12_/API_CONTRACT_CANDIDATE_v1.md`（IQ-01/§4/§11）；`14_/IQ01_PRODUCT_IDENTITY_ADJUDICATION.md`；`25_/RULE_STATUS_REGISTER.md` R-ID-01…09；`26_/` Phase 2 计划 |
| 相关复验 | `../reverification/01_PRODUCT_IDENTITY_REVIEW.md`（FAIL）、`02_GLOBAL_ID_REVIEW.md`（FAIL） |

## 1. 设计目标

1. 明确 Brand、MPN 与产品身份的定义、规范化与证据链；
2. 明确产品身份与文档身份、解析运行身份的区别；
3. 设计跨文档、跨批次的全局产品 ID 与注册表；
4. 给出与现有 `product_id=prod-{document_id}`、`document_id`、`pbk1_` 的兼容/迁移路径；
5. 分析对 16 操作、75 矩阵、Repository/DB、DTO/错误码、OAuth 边界的影响；
6. 给出可执行测试向量与负责人决策清单。

## 2. 当前系统问题（已复验）

| 问题 | 事实 | 证据 |
|---|---|---|
| 产品身份是文档内实例 | `product_id = prod-{document_id}` | `src/icpdf/parser/pipeline.py:151-155` |
| 无 Brand 身份模型 | `Product` 无 brand/supplier；`manufacturer` 来自 PDF 元数据 author | `src/icpdf/domain/product.py:37-54`；`pdf_loader.py:63` |
| 未真正归一化 | `normalized_mpn` 恒等于 `requested_mpn` | `pipeline.py:154-155` |
| 无全局 ID/注册表 | 无产品主表；lake 仅 raw_docs/parse_runs/eval_results | `lake/_build_lake.py:364-400` |
| 同一 MPN 跨文档分裂 | 同一 MPN 两个 PDF → 不同 `product_id` | `../reverification/evidence/sample_parse_summary.json` |
| 无真实 B2B/后端 | 无 Business API/DB/OAuth；B2B 未实现 | `../reverification/04/05` 检查 |
| 契约键仍是候选 | `(mpn_norm, brand_norm)`、`pbk1_` 为 PROPOSED | `12_/API_CONTRACT_CANDIDATE_v1.md` §4/§11；R-ID-05/06 |

## 3. 已知事实

- IQ-01 已登记方向（**待签署、未独立验收**）：跨系统身份为 MPN + Brand；唯一键 `(mpn_norm, brand_norm)`；`prod-{document_id}` 不得作产品身份（`12_/API_CONTRACT_CANDIDATE_v1.md:71`；R-ID-01/02）。
- `product_business_key` 候选编码为 `pbk1_` + 完整 SHA-256；长度前缀 canonical；`normalizer_version` 不入哈希；缺 Brand 不生成键（候选 §4.3；R-ID-06）。
- 契约身份 DTO 要求保留 `mpn_raw/mpn_norm/brand_raw/brand_norm/normalizer_version`（候选 §4）。
- 当前代码没有 Brand、没有全局产品注册表、没有真正的 MPN 归一化。
- `(mpn_norm, brand_norm)` 是**候选**身份键，不是已论证完成、永久不变的唯一键。

## 4. 待决事项（不在本文件自行裁定）

| 编号 | 待决问题 | 相关文件 |
|---|---|---|
| D-01 | Brand 权威来源与注册表 | `01_BRAND_IDENTITY.md` |
| D-02 | Brand 规范化、别名、合并/更名 | `01_BRAND_IDENTITY.md` |
| D-03 | MPN 归一化是否按 Brand/厂商分规则、版本治理 | `02_MPN_NORMALIZATION.md` |
| D-04 | 同 MPN 跨 Brand、变体/封装/多版本的业务边界 | `03_PRODUCT_IDENTITY_MODEL.md` |
| D-05 | 全局 ID 方案：自然键、内容哈希、surrogate、注册表 | `04_GLOBAL_ID_REGISTRY.md` |
| D-06 | 合并/拆分/冲突裁决与审计 | `04_GLOBAL_ID_REGISTRY.md` |
| D-07 | 旧 `product_id=prod-doc` 的保留/兼容/迁移 | `05_BACKWARD_COMPATIBILITY.md` |
| D-08 | API 暴露 `pbk1_` 还是 `product_uid`，或双字段 | `06_API_AND_DATABASE_IMPACT.md` |
| D-09 | 75 矩阵/16 操作的路径与 DTO 影响 | `06_API_AND_DATABASE_IMPACT.md` |
| D-10 | 幂等/并发/回滚与生产迁移 | `04`/`05` |

完整清单见 `08_DECISION_REGISTER.md`。

## 5. 设计边界

- **不修改** Ds Bit 代码、OpenAPI、75 矩阵正式状态、数据库、OAuth、生产环境。
- **不执行** Contract Freeze、Business API 实现、生产迁移。
- 本包只提供选项、推荐、风险、迁移与测试向量；负责人未签署前，任何推荐都保持 `PROPOSED_NOT_APPROVED`。
- 现有解析/证据 PASS 不等于产品身份/全局 ID 完成；本包不改变 P0-2 BLOCKED 结论。

## 6. 与 P0-2 五项检查的关系

| P0-2 检查 | 复验结论 | 本包对应 |
|---|---|---|
| 产品身份 | FAIL | `01`/`03` |
| 全局 ID | FAIL | `02`/`04` |
| 解析输出/证据 | PASS（解析范围） | 作为身份输入与证据来源 |
| 静态 B2B 桩 | FAIL（B2B 能力） | `06` 影响分析；不实现 |
| 后端实现 | FAIL | `05`/`06` 兼容与影响 |

## 7. 阅读顺序

`01 Brand` → `02 MPN` → `03 产品身份` → `04 全局 ID` → `05 兼容` → `06 API/DB 影响` → `07 测试向量` → `08 决策清单`。

## 8. 非声明

- 不宣布 `(mpn_norm, brand_norm)` 为永久唯一键。
- 不宣布 Brand/MPN 规则已冻结。
- 不宣布 `pbk1_` 已批准。
- 不宣布 P0-2 关闭、Contract Freeze 或 Production API 准入。
- 所有推荐均待负责人签署；未签署前状态为 `PROPOSED_NOT_APPROVED`。