# Product Identity + Global ID 架构设计总览

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-000 |
| 版本 | v2.4-R2.2.2 |
| 日期 | 2026-11-23 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 策略 | **Morrishk-first / Tenant-ready / Multi-site-later** |
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
6. 给出可执行测试向量与负责人决策清单；
7. 以 Morrishk 首期单租户收敛 Tenant / Site / OAuth Client / Global Product / Tenant Product Access 边界，不做通用 SaaS 多租户平台设计。

## 1.1 R2 收敛策略（Morrishk-first）

| 维度 | 首期决定 | 说明 |
|---|---|---|
| Tenant | **Morrishk 是唯一首期 Tenant** | 不引入组织树；不为其他客户建模 |
| Site | **Morrishk 官网是首期 Site** | `Tenant 1:N Site`；首期只启用一个 Site |
| OAuth Client | **Site 下绑定 OAuth Client** | `Site 1:N OAuth Client`；token 必须绑定 tenant/site/client |
| Global Product | **仅 CONFIRMED 身份进入 `global_product`** | `PENDING_*` 留在待确认/冲突队列，不占正式键 |
| Product Access | **Tenant N:M Global Product** | 通过 `tenant_product_access`；全局身份 ≠ 租户访问权 |
| Organization Tree | **明确延后** | 首期无组织层级、无复杂权限继承、无计费、无跨租户协作 |
| 多 Site | **架构预留、首期不启用** | 实体保留 `site_id`，但不做多站点运营 |

> 允许公式（候选）：`ALLOW = OAuth Scope AND Tenant ACL AND Site-to-Tenant Binding AND Resource Access Policy`。
> 四者缺一即拒绝；Scope 不替代租户 ACL，全局产品身份也不替代访问权。

## 1.2 首期实体（仅这八类）

`tenant`、`site`、`oauth_client`、`global_product`、`tenant_product_access`、`tenant_document`、`tenant_evidence`、`audit_log`。

- 关系：`Tenant 1:N Site 1:N OAuth Client`；`Tenant N:M Global Product`（经 `tenant_product_access`）。
- 不建 `organization`、`billing`、`cross_tenant_share` 等首期实体；需要时另立决策。
- 实体细节、全局/租户私有数据边界与延后清单见 `10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md`。

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
| D-31 | Tenant/Site/OAuth Client 首期边界 | `06`/`08`/`10` |
| D-32 | Site-to-Tenant Binding 与 OAuth Client 绑定 | `06`/`10` |
| D-33 | Tenant Product Access 模型与访问级别 | `06`/`10` |
| D-34 | Resource Access Policy 与 allow/deny 语义 | `06`/`10` |
| D-35…D-40 | 延后项（Organization Tree、权限继承、计费、跨租户协作、多 Site、第三方 OAuth） | `08`/`10` |

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

`01 Brand` → `02 MPN` → `03 产品身份` → `04 全局 ID` → `05 兼容` → `06 API/DB 影响` → `07 测试向量` → `08 决策清单` → `09 R1 复核回应` → `10 Morrishk 首期范围与延后清单` → `11 R2 复核回应` → `12 R2.1 复核回应` → `13 R2.2 复核回应` → `14 R2.2.1 复核回应` → `15 R2.2.2 复核回应`。

> R1 新增租户隔离、状态/唯一约束、Alias/Profile 治理；R2 收敛 Morrishk-first 八实体模型；R2.1 修复 Alias Brand 上下文、归属、证据边界与 Token 上下文；R2.2 补强当前/历史映射、三类归属、四角色与证据可见性；R2.2.1 落实时间语义、复合外键与审批分离事务；R2.2.2 统一 Alias 规则（废止同目标重叠合并、空键 advisory lock）、补齐 identity_pending/identity_conflict/audit 三作用域约束、引入稳定 principal 与角色域互斥、审批状态 CHECK 与两阶段事务。回应分别见 `11`/`12`/`13`/`14`/`15`。

## 8. 非声明

- 不宣布 `(mpn_norm, brand_norm)` 为永久唯一键。
- 不宣布 Brand/MPN 规则已冻结。
- 不宣布 `pbk1_` 已批准。
- 不宣布 P0-2 关闭、Contract Freeze 或 Production API 准入。
- 不宣布已建成通用 SaaS 多租户平台；首期仅为 Morrishk 单 Tenant 收敛。
- 不宣布 Organization Tree、复杂权限继承、计费或跨租户协作已设计完成；这些明确延后。
- 所有推荐均待负责人签署；未签署前状态为 `PROPOSED_NOT_APPROVED`。