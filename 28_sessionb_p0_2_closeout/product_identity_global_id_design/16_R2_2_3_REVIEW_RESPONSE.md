# R2.2.3 复核回应（最小一致性修订）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-016 |
| 版本 | v1.0-R2.2.3 |
| 日期 | 2026-11-24 |
| 状态 | **DESIGN_PACKAGE_R2_2_3_SUBMITTED** |
| 性质 | 对 Reviewer A-1/B-1/C-1/C-2 四项残留问题的逐条回应；不是架构批准、不是实现、不是契约冻结 |
| 基线 | 分支 `docs/sessionb-product-identity-global-id-design`，父提交 `c6e8f54e8c5b7ebd78217e2a7a9a87d91c912112`；本轮独立追加提交，不 amend、不 rebase |
| 范围 | 仅四项最小一致性修订；不重新设计八实体模型，不扩大首期范围 |

## 0. 本轮结论

- C-1：普通导入/重解析/批量/后台/管理员全部封闭，`global_product` 唯一写入入口为 Global `APPROVED` 最终事务。
- C-2：`principal_domain_binding` 单有效域 + `principal_role` 复合外键 + `role_catalog` 固定域，给出完整键、CHECK、并发、撤销/换域与职责分工。
- B-1：`06` §8.1 旧审计模型改为三作用域，并全文统一；明确 `identity_conflict` 双作用域与 `audit_log` 三作用域是两套定义。
- A-1：Alias 唯一键、GLOBAL/TENANT 排斥约束、`btree_gist`、NULL 上界、禁止未来行的执行方式、advisory lock 键与职责分工全部写清。
- 新增 V-95…V-101 共 7 个设计测试，全部**未执行**；V-77…V-94 保持未执行。

## 1. C-1：彻底关闭 Global Product 审批绕过路径

| 项 | 内容 |
|---|---|
| Reviewer 原问题 | 导入/后台/管理员等路径仍可能直接创建 `global_product`；审批门槛未覆盖所有入口 |
| 修订前冲突 | `04` §4 工作流仍写“no match -> create global_product”；§8 事务描述把 create 混入普通导入；`03`/`06` 未列出旁路清单 |
| 修订后的具体规则 | 1) 无匹配只能写 `identity_pending`；2) Tenant Assertion 先独立提交 `TENANT_APPROVED`；3) Global 决策者只产生 `PROPOSED`；4) 仅 Global Approver 批准且 `decision_status='APPROVED'` 后可写 `global_product`；5) 最终事务重新锁定并验证 Tenant Assertion 状态；6) `global_product`/alias/lineage/pending/裁决/GLOBAL audit 同事务；7) 普通导入、重解析、批量、后台、管理员均无旁路；8) 明确区分“匹配关联 / 候选创建 / 正式注册” |
| 修改文件与章节 | `04_GLOBAL_ID_REGISTRY.md` §4 / §5 / §6 / §8；`03_PRODUCT_IDENTITY_MODEL.md` §4.4 规则 1–8；`06_API_AND_DATABASE_IMPACT.md` §8.11（旁路封闭矩阵）/ §8.12；`10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` §4（B-20）；`07_TEST_VECTORS.md` V-95/V-96；`08_DECISION_REGISTER.md` D-49 |
| 新增测试向量 | V-95 普通导入无匹配不建 `global_product`；V-96 后台/批量/管理员旁路拒绝 |
| 尚未解决的限制 | 具体权限点/管理员开关名称未定义；最终由实现期角色与接口设计决定，本轮只定义规则与门槛 |

## 2. C-2：principal_role 角色域互斥的数据库强制机制

| 项 | 内容 |
|---|---|
| Reviewer 原问题 | 只有互斥原则，缺少可执行的数据库结构；未说明键、CHECK、复合外键、并发、撤销后的域切换与历史 |
| 修订前冲突 | `principal_role` 直接携带 `role_domain`，无 binding 层，无法用单一约束禁止双域；仅写“唯一/排斥约束” |
| 修订后的具体规则 | 1) `principal_domain_binding`：PK `binding_id`，`UNIQUE (principal_id) WHERE status='ACTIVE'` 保证单有效域，`UNIQUE (principal_id, role_domain)` 供复合外键；2) `role_catalog`：PK `role`，`UNIQUE (role, role_domain)` 固定角色域；3) `principal_role`：`UNIQUE (binding_id, role) WHERE revoked_at IS NULL`，复合外键 `(binding_id, role_domain) → binding` 与 `(principal_id, binding_id) → binding`；4) 并发：先锁 principal 行，再插 ACTIVE binding，部分唯一索引裁决，仅一方成功、另一方 409；5) 撤销：binding 置 `REVOKED` + `effective_to`，同事务撤销角色，历史保留；换域需新建 binding；6) 互斥：`{tenant.editor, tenant.admin}` 仅 TENANT，`{identity.admin, identity.approver}` 仅 GLOBAL；7) 数据库负责单域/域匹配/无重复，应用负责授予权限、流程与审计 |
| 修改文件与章节 | `04_GLOBAL_ID_REGISTRY.md` §3（`principal_domain_binding`/`role_catalog`/`principal_role`）/ §3.3.3；`03_PRODUCT_IDENTITY_MODEL.md` §4.4 规则 4；`06_API_AND_DATABASE_IMPACT.md` §8.12；`10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` §4（B-18/B-21）；`07_TEST_VECTORS.md` V-97/V-98；`08_DECISION_REGISTER.md` D-47 |
| 新增测试向量 | V-97 同一 principal 并发获得 TENANT/GLOBAL 域仅一方成功；V-98 撤销旧域后重新授权、历史可追溯 |
| 尚未解决的限制 | 具体 DDL/触发器与迁移不在本轮；角色授予的业务审批流（谁可授予）仍待负责人签署 |

## 3. B-1：清理 06 §8.1 旧版审计模型

| 项 | 内容 |
|---|---|
| Reviewer 原问题 | `06` §8.1 仍保留两作用域审计模型；全文可能残留旧描述；`identity_conflict` 与 `audit_log` 作用域定义易混淆 |
| 修订前冲突 | §8.1 为 GLOBAL/TENANT 两作用域；§8.12 为三作用域；§4 概述写“混合作用域” |
| 修订后的具体规则 | 1) `audit_log` 统一三作用域：GLOBAL（两列 NULL）、TENANT（tenant 必填、site NULL）、SITE（两列必填 + 复合外键）；2) §8.1 代码块、§4 概述、§8.2 T9、§8.12 全部一致；3) `identity_conflict` 为 GLOBAL/TENANT 双作用域（GLOBAL 三列 NULL；TENANT 三列非空 + 双复合外键），与 `audit_log` 三作用域是两套定义，不得混用 |
| 修改文件与章节 | `06_API_AND_DATABASE_IMPACT.md` §4 / §8.1 / §8.2（T9）/ §8.12；`04_GLOBAL_ID_REGISTRY.md` §3 / §3.3.2；`10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` §2 / §4（B-10）；`07_TEST_VECTORS.md` V-101 |
| 新增测试向量 | V-101 旧两作用域非法审计记录必须被数据库约束拒绝 |
| 尚未解决的限制 | 历史数据迁移/清洗不在本轮；如已有旧审计数据，需后续迁移方案 |

## 4. A-1：Alias 数据库约束实现细节闭环

| 项 | 内容 |
|---|---|
| Reviewer 原问题 | 未写 `btree_gist`/operator class；NULL 上界与首尾相接语义未统一；禁止未来行误用普通 CHECK；advisory lock 键与职责分工未写清 |
| 修订前冲突 | 01/02/04 只写 `EXCLUDE USING gist`；`valid_from <= now()` 仅口头要求；锁键未说明 |
| 修订后的具体规则 | 1) Brand/MPN 唯一键分别定义（见 01/02/04）；2) GLOBAL/TENANT 排斥约束完整键与 `WHERE scope` 分别列出；3) TENANT 必须含 `tenant_id`；4) 需 `CREATE EXTENSION IF NOT EXISTS btree_gist` 提供 text/UUID GiST 相等 operator class；5) `tstzrange(valid_from, valid_to, '[)')` 的 NULL 上界=无穷，首尾相接不重叠；6) 禁止未来行用触发器/事务校验，不能写普通 CHECK；7) advisory lock 键基于完整唯一键，碰撞只增加串行；8) 部分唯一索引/排斥约束/advisory lock/应用层职责分明；9) 数据库为最终防线；10) Brand 与 MPN 时间与并发语义完全一致 |
| 修改文件与章节 | `01_BRAND_IDENTITY.md` §6.5.1（数据库约束实现细节）；`02_MPN_NORMALIZATION.md` §4.6；`04_GLOBAL_ID_REGISTRY.md` §3.3.1 |
| 新增测试向量 | V-99 GLOBAL 与 TENANT 同名 Alias 按作用域合法并存；V-100 不同 Tenant 同名并存、同一 Tenant 重叠拒绝 |
| 尚未解决的限制 | 未生成 DDL；`btree_gist` 可用性、触发器实现与迁移需实现期验证 |

## 5. 跨文件一致性检查

| 检查项 | 结果 |
|---|---|
| `global_product` 仅在 Global `APPROVED` 后创建/更新 | 04 §4/§6、03 §4.4、06 §8.11、10 B-20 一致 |
| Tenant Assertion 不直接写全局产品 | 03 §4.4、04 §3、06 §8.11 一致 |
| 四角色主体引用稳定 `principal_id` | 03 §4.4、04 §3、06 §8.12 一致 |
| 角色域互斥有数据库强制结构 | 04 §3.3.3、06 §8.12、10 B-18 一致 |
| `identity_conflict` 仅 GLOBAL/TENANT 双作用域 | 04 §3/§3.3.2、06 §4/§8.12、10 §2 一致 |
| `audit_log` 仅 GLOBAL/TENANT/SITE 三作用域 | 06 §4/§8.1/§8.2/§8.12、04 §3/§3.3.2、10 §2/§4 一致 |
| Alias 唯一键/有效期/并发/约束一致 | 01 §6.5.1、02 §4.6、04 §3.3.1、06 §4 一致 |
| 83 项历史证据不变 | `test_evidence_83/` 未修改；Git Blob 与基线一致 |
| V-77…V-94 未执行 | 保持不变；V-95…V-101 同样标记未执行 |
| 决策状态 | 全部 `PROPOSED_NOT_APPROVED` |

## 6. 文件变更

| 文件 | 变更 |
|---|---|
| `00_DESIGN_OVERVIEW.md` | v2.5-R2.2.3；阅读顺序加入 `16`；摘要 |
| `01_BRAND_IDENTITY.md` | v2.5-R2.2.3；§6.5.1 数据库约束实现细节 |
| `02_MPN_NORMALIZATION.md` | v2.5-R2.2.3；§4.6 同上 |
| `03_PRODUCT_IDENTITY_MODEL.md` | v2.5-R2.2.3；§4.4 旁路封闭与角色 binding |
| `04_GLOBAL_ID_REGISTRY.md` | v2.5-R2.2.3；§3.3.3、§4/§5/§6 唯一入口 |
| `06_API_AND_DATABASE_IMPACT.md` | v2.5-R2.2.3；§4/§8.1/§8.2/§8.11/§8.12 |
| `07_TEST_VECTORS.md` | v2.5-R2.2.3；新增 V-95…V-101 |
| `08_DECISION_REGISTER.md` | v2.5-R2.2.3；新增 D-49，更新 D-47/D-48 |
| `10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` | v1.5-R2.2.3；B-18…B-21 |
| `16_R2_2_3_REVIEW_RESPONSE.md` | 本文件（新增） |
| `SHA256SUMS` / `../DESIGN_AND_TEST_SHA256SUMS.txt` | 重新生成 |

## 7. 尚未解决的限制

- 未生成/执行 DDL；`btree_gist`、触发器、部分唯一索引与排斥约束需实现期验证。
- 审批/角色授予的业务权限矩阵与具体角色清单仍待负责人签署。
- 历史审计数据若存在旧两作用域记录，迁移/清洗方案未定义。
- 管理员操作的具体权限点与审计要求待实现期确定。

## 8. 状态

- 本轮：`DESIGN_PACKAGE_R2_2_3_SUBMITTED`。
- 未标记：`ARCHITECTURE_APPROVED` / `CONTRACT_FROZEN` / `P0_2_CLOSED` / `BUSINESS_API_IMPLEMENTATION_AUTHORIZED` / `PRODUCTION_READY`。
- 等待 Reviewer 独立复核；复核通过前不推进实现、契约冻结或生产接入。
