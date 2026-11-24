# R2.2.4 复核回应（最终一致性修订）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-017 |
| 版本 | v1.0-R2.2.4 |
| 日期 | 2026-11-24 |
| 状态 | **DESIGN_PACKAGE_R2_2_4_SUBMITTED** |
| 性质 | 对 Reviewer C-2/C-1/A-1 三项残留问题的逐条回应；不是架构批准、不是实现、不是契约冻结 |
| 基线 | 分支 `docs/sessionb-product-identity-global-id-design`，父提交 `ab93dcec638a3e9bce8ebbe27fd992ca7ab7260f`；本轮独立追加提交，不 amend、不 rebase |
| 范围 | 仅三项最小一致性修订；不重新设计八实体模型 |

## 0. 本轮结论

- C-2：删除无条件 `UNIQUE (principal_id, role_domain)`，改为 `UNIQUE (binding_id, role_domain)` + `UNIQUE (principal_id, binding_id)`；保留单 ACTIVE binding 约束；明确撤销后同域/换域重新授权流程。
- C-1：`identity_pending.reason` 增加 `PENDING_NEW_IDENTITY` 并定义触发条件/状态转换；`product_import_event.result` 用 `PENDING_CREATED` 取代 `CREATED`；统一导入结果语义。
- A-1：`alias_scope` 统一改为 `scope`，01/02/04 一致。
- 新增 V-102；V-97/V-98 按本轮要求收紧。
- 所有新增向量标记设计测试、未执行。

## 1. C-2：principal_domain_binding 唯一约束与复合外键

| 项 | 内容 |
|---|---|
| Reviewer 原问题 | 无条件 `UNIQUE (principal_id, role_domain)` 会阻止撤销后重新获得相同域；两个复合外键缺少精确被引用唯一键 |
| 修订前冲突 | 撤销 TENANT binding 后，历史行仍占用 `(principal_id, 'TENANT')`，同域重新授权必然冲突；复合外键 `(binding_id, role_domain)`、`(principal_id, binding_id)` 无对应 UNIQUE 键 |
| 修订后的具体规则 | 1) 保留 `UNIQUE (principal_id) WHERE status='ACTIVE'`，唯一职责是单有效域；2) 新增 `UNIQUE (binding_id, role_domain)`；3) 新增 `UNIQUE (principal_id, binding_id)`；4) 删除无条件 `UNIQUE (principal_id, role_domain)`；5) 三个外键分别指向精确唯一键：`(binding_id, role_domain) → binding`、`(principal_id, binding_id) → binding`、`(role, role_domain) → role_catalog`；6) 撤销保留 REVOKED 行与角色 `revoked_at`，重新授权生成新 `binding_id`，同一 principal 仍只能一个 ACTIVE binding；7) 撤销后允许同域重新授权；8) 审计保留完整历史 |
| 修改文件与章节 | `04_GLOBAL_ID_REGISTRY.md` §3（`principal_domain_binding`/`role_catalog`/`principal_role`）/ §3.3.3；`07_TEST_VECTORS.md` V-97/V-98；`06_API_AND_DATABASE_IMPACT.md` §8.12（约束表述）；`10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` §4（B-18/B-21） |
| 新增/调整测试向量 | V-97 并发双域授予仅一方成功；V-98 撤销 TENANT binding 后再次获得 TENANT binding 成功且历史完整 |
| 尚未解决的限制 | 具体 DDL/触发器与迁移不在本轮；谁有权授予仍待负责人签署 |

## 2. C-1：统一 identity_pending 与 product_import_event 状态

| 项 | 内容 |
|---|---|
| Reviewer 原问题 | `04 §3` 的 reason 未包含 `PENDING_NEW_IDENTITY`，但 §4 已使用；`product_import_event.result='CREATED'` 可能被误解为创建 `global_product` |
| 修订前冲突 | reason 枚举缺值导致工作流与表定义不一致；`CREATED` 语义模糊 |
| 修订后的具体规则 | 1) `reason` 统一为 `PENDING_BRAND`/`PENDING_VARIANT`/`PENDING_CONFLICT`/`PENDING_NEW_IDENTITY` 并加 CHECK；2) 明确各自触发条件与 `OPEN → ADJUDICATED/REJECTED` 转换；3) `result` 改为 `MATCHED`/`PENDING_CREATED`/`PENDING_UPDATED`/`CONFLICT`/`REJECTED`；4) `PENDING_CREATED` 明确表示创建 pending，不表示创建正式产品；5) 根除 `CREATED`；6) 普通/重解析/批量/后台/管理员仍不得绕过 Global `APPROVED` 门槛 |
| 修改文件与章节 | `04_GLOBAL_ID_REGISTRY.md` §3（`identity_pending`/`product_import_event`）/ §4（导入结果语义）；`10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` §4（B-20）；`07_TEST_VECTORS.md` V-102 |
| 新增测试向量 | V-102 无匹配导入只建 `identity_pending(reason=PENDING_NEW_IDENTITY)` 且 `result=PENDING_CREATED`，`global_product` 不变 |
| 尚未解决的限制 | 历史导入事件若已有 `CREATED` 值，需要迁移映射；本轮不执行 |

## 3. A-1：统一 Alias 字段名

| 项 | 内容 |
|---|---|
| Reviewer 原问题 | `01`/`02` 使用 `alias_scope`，后续约束与 `04` 使用 `scope`，存在双命名 |
| 修订前冲突 | 同一概念两个字段名，易导致实现与约束不一致 |
| 修订后的具体规则 | 统一为 `scope`；`brand_alias` 与 `mpn_alias` 均使用 `scope`；所有 CHECK、部分唯一索引、排斥约束、查询与 advisory lock 键说明均以 `scope` 为准；不再使用 `alias_scope` |
| 修改文件与章节 | `01_BRAND_IDENTITY.md` §3；`02_MPN_NORMALIZATION.md` §3；`04_GLOBAL_ID_REGISTRY.md` §3/§3.3.1（原已使用 `scope`） |
| 新增测试向量 | 复用 V-99/V-100（作用域并存/重叠）验证 `scope` 语义 |
| 尚未解决的限制 | 无（纯命名统一） |

## 4. 跨文件检查

| 检查项 | 结果 |
|---|---|
| principal 同时只能一个 ACTIVE binding | 04 §3/§3.3.3、06 §8.12、10 B-18 一致 |
| 撤销后允许同域重新授权 | 04 §3.3.3 第 2/6 条；V-98 覆盖 |
| 所有复合外键有精确 UNIQUE 被引用键 | 04 §3.3.3；role_catalog 增加 `UNIQUE (role, role_domain)` |
| `principal_role` 不能自选 role_domain | 复合外键 `(binding_id, role_domain)` + role_catalog 固定 |
| pending reason 覆盖工作流 | 04 §3/§4 一致，含 `PENDING_NEW_IDENTITY` |
| import_event 结果不暗示建正式产品 | `PENDING_CREATED` 语义明确，无 `CREATED` |
| Global Product 仍只能 APPROVED 最终事务写入 | 04 §4/§6、03 §4.4、06 §8.11、10 B-20 一致 |
| Alias 统一 `scope` | 01/02/04 一致；无未解释双命名 |
| 83 项证据不变 | `test_evidence_83/` 未修改；Git Blob 与基线一致 |
| V-95…V-101 未执行 | 保持；V-102 同样未执行 |
| 决策状态 | 全部 `PROPOSED_NOT_APPROVED` |

## 5. 文件变更

| 文件 | 变更 |
|---|---|
| `00_DESIGN_OVERVIEW.md` | v2.6-R2.2.4；阅读顺序加入 `17`；摘要 |
| `01_BRAND_IDENTITY.md` | v2.6-R2.2.4；`alias_scope` → `scope` |
| `02_MPN_NORMALIZATION.md` | v2.6-R2.2.4；`alias_scope` → `scope` |
| `04_GLOBAL_ID_REGISTRY.md` | v2.6-R2.2.4；binding 唯一键/外键、pending reason、import_event 结果 |
| `06_API_AND_DATABASE_IMPACT.md` | v2.6-R2.2.4；约束表述与版本 |
| `07_TEST_VECTORS.md` | v2.6-R2.2.4；V-97/V-98 收紧，新增 V-102 |
| `08_DECISION_REGISTER.md` | v2.6-R2.2.4；版本同步（决策未变） |
| `10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` | v1.6-R2.2.4；B-20 明确 pending reason 与结果值 |
| `17_R2_2_4_REVIEW_RESPONSE.md` | 本文件（新增） |
| `SHA256SUMS` / `../DESIGN_AND_TEST_SHA256SUMS.txt` | 重新生成 |

## 6. 尚未解决的限制

- 未生成/执行 DDL；具体唯一索引/复合外键/触发器需实现期验证。
- 历史导入事件若含 `CREATED`，需迁移映射；本轮不执行。
- 角色授予权限与审批流程仍待负责人签署。

## 7. 状态

- 本轮：`DESIGN_PACKAGE_R2_2_4_SUBMITTED`。
- 未标记：`ARCHITECTURE_APPROVED` / `CONTRACT_FROZEN` / `P0_2_CLOSED` / `BUSINESS_API_IMPLEMENTATION_AUTHORIZED` / `PRODUCTION_READY`。
- 等待 Reviewer 独立复核；复核通过前不推进实现、契约冻结或生产接入。
