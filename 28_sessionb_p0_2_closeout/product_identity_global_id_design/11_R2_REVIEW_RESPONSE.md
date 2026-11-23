# R2 复核回应（Morrishk-first 架构收敛）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-011 |
| 版本 | v1.0-R2 |
| 日期 | 2026-11-23 |
| 状态 | **DESIGN_PACKAGE_R2_SUBMITTED** |
| 性质 | 对 R2 指令的逐条回应；不是架构批准、不是实现、不是冻结 |
| 基线 | 分支 `docs/sessionb-product-identity-global-id-design`，HEAD `7377e159d6e55a4c35f74b3ad5830ad7df0d2b9b`；本轮 R2 为独立追加提交 |
| 范围 | 仅收敛首期 Tenant / Site / OAuth Client / Global Product / Tenant Product Access；不扩展通用 SaaS 多租户平台 |

## 1. 本轮结论

- 首期策略：**Morrishk-first / Tenant-ready / Multi-site-later**。
- 首期只有 Morrishk 一个 Tenant、官网一个 Site、自有一个 OAuth Client。
- 正式产品表只承载 CONFIRMED 身份；`PENDING_*` 留在待确认/冲突队列，不占正式键、不生成 `product_uid`/`pbk1_`。
- 变体使用非空三态 `UNKNOWN` / `NOT_APPLICABLE` / `KNOWN`，禁止 NULL 业务语义。
- Brand Alias 与 MPN Alias 为独立注册表，均有 `GLOBAL`/`TENANT` 作用域，不共用命名空间。
- MPN Profile 按 `BRAND > MANUFACTURER > GLOBAL` 选择，只有 `APPROVED` 可自动确认。
- 授权为四因子：`Scope AND Tenant ACL AND Site-to-Tenant Binding AND Resource Access Policy`。
- Organization Tree、权限继承、计费、跨租户协作、多 Site、第三方 OAuth 明确延后。

## 2. R2-1：Tenant / Site / Organization 边界

| 要求 | 修改后 | 位置 |
|---|---|---|
| 首期 Tenant/Site/OAuth Client 关系 | `Tenant 1:N Site 1:N OAuth Client`；首期各一个 | `06` §8.1；`10` §2 |
| Tenant N:M Global Product | 经 `tenant_product_access`；访问级别 QUERYABLE/EXECUTABLE | `06` §8.1/§8.3；`10` §2/§5 |
| 组织树 | 不建；Organization Tree 明确延后 | `06` §8.8；`08` D-25/D-35；`10` §9 |
| 绑定规则 | Site 不跨 Tenant；Client 不跨 Site；`oauth_client.tenant_id = site.tenant_id` | `06` §8.2 R2-1-T1…T8；`10` §4 |
| 授权 | 四因子公式 + 10 场景允许/拒绝矩阵 | `06` §8.3/§8.4 |
| 旧 ID 兼容 | 兼容路径必须带 tenant/site，且不得绕过 ACL | `05` §5/§7；`07` V-49 |

### 2.1 允许/拒绝矩阵摘要

| 场景 | 结果 |
|---|---|
| 四因子全满足 | ALLOW |
| 缺 scope / 缺 ACL / site 绑定无效 / client 跨 site | DENY |
| 全局产品可见但请求他租户私有证据 | DENY |
| 本租户私有证据 | ALLOW |
| 查询 PENDING 身份 | DENY/NOT_FOUND |
| 无 `identity.admin` 执行合并/裁决 | DENY |
| 未知/停用 site 申请 token | DENY |

完整 10 场景见 `06` §8.4。

## 3. R2-2：Global Product 仅 CONFIRMED，Pending/Conflict 模型

| 要求 | 修改后 | 位置 |
|---|---|---|
| `global_product` 只存 CONFIRMED | `lifecycle_state` 仅 ACTIVE/MERGED/RETIRED；无 PENDING_* | `04` §3/§3.1；`03` §4.1 |
| PENDING 不占正式键 | `identity_pending` 独立主键；不生成 uid/pbk1 | `04` §3/§3.1；`03` §4.2 |
| 冲突模型 | `identity_conflict` 关联 pending，记录候选集/类型/状态 | `04` §3/§6；`03` §4.2 |
| 唯一约束 | 仅 `(brand_id, mpn_norm, variant_state, variant_key) WHERE lifecycle_state='ACTIVE'` | `04` §3/§3.1 |
| 事务边界 | resolve/match/create/link/import_event/audit 同事务 | `03` §4.1 规则 11；`04` §4/§8 |
| 裁决事务 | 写产品、标 ADJUDICATED、写 alias/lineage/audit；失败整体回滚 | `03` §4.2；`04` §6 |
| 审计 | actor/approved_by/time/tenant/site/evidence | `04` §7；`06` §6 |

## 4. R2-3：Variant 三态与唯一约束

| 要求 | 修改后 | 位置 |
|---|---|---|
| 三态枚举 | `UNKNOWN` / `NOT_APPLICABLE` / `KNOWN` | `03` §3.1；`04` §3.2 |
| 禁止 NULL | 自然键四分量非空；NOT_APPLICABLE 用 `__NO_VARIANT__` | `03` §3.1；`04` §3.2 |
| UNKNOWN 不可确认 | 只能进入 `identity_pending(PENDING_VARIANT)` | `03` §3.1/§4.1 规则 6 |
| 唯一约束/并发 | 部分唯一索引 + 事务 + 幂等键 + 乐观锁 | `03` §4.1 规则 10/§4.3；`04` §8 |
| normalizer 版本 | 升级/回退保留旧 norm 为 alias；冲突转 PENDING；审计 | `03` §4.3；`04` §5 |
| 变体定义未签署 | 只能 UNKNOWN；不得以空串/NULL 绕过 | `03` §3.1 规则 4；`04` §3.2 |

## 5. R2-4：Brand Alias / MPN Alias / MPN Profile

| 要求 | 修改后 | 位置 |
|---|---|---|
| Brand Alias 作用域 | `GLOBAL`/`TENANT`；租户别名不跨租户 | `01` §6.3/§6.5；`04` §3.3 |
| Brand Alias 冲突 | `PENDING_CONFLICT` + 人工裁决；不静默覆盖 | `01` §6.5；`04` §3.3/§6 |
| 历史品牌名 | `valid_to` + `merged_into_brand_id`；不删除 | `01` §6.5；`04` §3.3 |
| Brand/MPN Alias 独立 | 两个独立注册表，不共用命名空间 | `01` §6.5；`04` §3.3；D-18 |
| MPN Profile 作用域/版本 | BRAND/MANUFACTURER/GLOBAL；独立版本/状态/审批 | `02` §4.5；`04` §3.4 |
| Profile 优先级 | `BRAND > MANUFACTURER > GLOBAL` | `02` §4.5；`04` §3.4 |
| 仅 APPROVED 自动确认 | 未批准/过期/退休规则不得确认 | `02` §4.5；`04` §3.4 |
| 无 Profile fallback | 仅当 GLOBAL 本身 APPROVED；否则 PENDING/低置信度 | `02` §4.5；`04` §3.4 |
| 同 Brand 多 APPROVED 同优先级 | 治理错误，阻断并报冲突 | `02` §4.5；`04` §3.4 |

## 6. R2-5：新增测试向量

`07` 在 V-01…V-28 基础上新增 **V-29…V-50 共 22 个** R2 向量，每项包含输入、预期结果、校验方法与风险：

| 覆盖 | 向量 |
|---|---|
| 四因子授权 | V-29…V-34 |
| PENDING/正式表隔离 | V-35/V-36/V-48 |
| variant 三态与唯一键 | V-37/V-38 |
| 裁决事务与回滚 | V-39/V-40 |
| Alias 作用域与冲突 | V-41/V-42 |
| Profile 优先级/审批 | V-43/V-44/V-45 |
| normalizer/合并旧键 | V-46/V-47 |
| 兼容路径越权、拒绝审计 | V-49/V-50 |

> 全部**未执行**；现有 83 项测试只覆盖 Parser/Domain/Evidence，不覆盖本文件场景。

## 7. 矛盾修复对照

| 矛盾点 | 修改前 | 修改后 |
|---|---|---|
| Product Registry 混放 PENDING | `product_registry.status` 含 PENDING_* | `global_product` 仅 CONFIRMED；`identity_pending`/`identity_conflict` 独立 |
| Pending 占用正式键 | 可能进入唯一约束 | 部分唯一索引仅 ACTIVE；pending 无 uid/pbk1 |
| Variant 可空 | `variant_key nullable` | `variant_state` 三态；NOT_APPLICABLE 用哨兵；禁止 NULL |
| Brand/MPN Alias 混用 | 单一 `product_alias` 类型枚举 | 独立 `brand_alias`/`mpn_alias` 注册表与作用域 |
| Profile 无优先级 | 仅“按 Brand/厂商” | BRAND > MANUFACTURER > GLOBAL；APPROVED-only |
| 租户边界过宽 | `tenant.organization_id`、Tenant 1..* Organization | tenant-only；Organization Tree 延后 |
| 授权仅 scope+ACL | `allowed = scope AND tenant_acl` | 四因子（+ site binding + resource policy） |
| 单租户含糊 | “若选择单租户” | 明确 Morrishk-first 单 Tenant；多 Site 预留 |

## 8. 文件变更

| 文件 | 变更 |
|---|---|
| `00_DESIGN_OVERVIEW.md` | v2.0-R2；策略、八实体、D-31…D-40、阅读顺序、非声明 |
| `01_BRAND_IDENTITY.md` | v2.0-R2；Brand/MPN Alias 独立注册表、作用域、冲突、历史名 |
| `02_MPN_NORMALIZATION.md` | v2.0-R2；Profile 优先级/审批/自动确认 |
| `03_PRODUCT_IDENTITY_MODEL.md` | v2.0-R2；variant_state 三态、12 条唯一约束规则、pending/conflict、并发/版本 |
| `04_GLOBAL_ID_REGISTRY.md` | v2.0-R2；`global_product` 仅 CONFIRMED、pending/conflict、alias/profile、事务/裁决 |
| `05_BACKWARD_COMPATIBILITY.md` | v2.0-R2；tenant/site 回填、兼容路径 ACL、迁移步骤 |
| `06_API_AND_DATABASE_IMPACT.md` | v2.0-R2；§8 重写为 Morrishk-first 八实体、四因子、10 场景、延后清单 |
| `07_TEST_VECTORS.md` | v2.0-R2；新增 V-29…V-50 与覆盖映射 |
| `08_DECISION_REGISTER.md` | v2.0-R2；D-25/D-29/D-30 收敛，D-31…D-40，分类/签署/依赖 |
| `10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` | 新增；策略、八实体、边界、首期/预留/延后 |
| `11_R2_REVIEW_RESPONSE.md` | 本文件 |
| `SHA256SUMS` / `../DESIGN_AND_TEST_SHA256SUMS.txt` | 重新生成 |

## 9. 仍待决

- D-04/D-05/D-06/D-07/D-08/D-09/D-10（身份/ID/API/迁移）；
- D-16…D-23（Alias/Profile/唯一约束/队列/历史键）；
- D-24…D-30（租户/私有数据/存在性/策略/四因子）；
- D-31…D-34（首期 Tenant/Site/Client/Access/Resource Policy）；
- D-35…D-40（延后项，不阻塞首期签署）。

全部 `PROPOSED_NOT_APPROVED`；签署栏空。

## 10. 未改变

- **83 项测试证据未修改/未重跑**；`../test_evidence_83/` 保持原样。
- 未修改 Ds Bit 源码、stash、OpenAPI、75 矩阵正式状态、数据库、OAuth、生产环境。
- 未执行 Contract Freeze / Business API 实现 / 生产迁移。
- 未把任何推荐写成负责人已批准。
- P0-2 仍 BLOCKED；本轮 R2 不改变该结论。

## 11. 状态

- 本轮：`DESIGN_PACKAGE_R2_SUBMITTED`。
- 仍未：`ARCHITECTURE_APPROVED` / `P0_2_CLOSED` / `BUSINESS_API_IMPLEMENTATION_AUTHORIZED`。
- 等待 Reviewer 复核；复核前不推进实现、契约冻结或生产接入。