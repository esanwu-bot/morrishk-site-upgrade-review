# Global ID Registry 设计

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-004 |
| 版本 | v2.5-R2.2.3 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 事实基线 | 无全局产品 ID/注册表；`product_id=prod-doc`；lake 仅 3 表 |
| 相关决策 | D-05、D-06、D-10、D-21、D-22、D-23、D-31…D-34、D-41…D-49（见 `08_DECISION_REGISTER.md`） |
| 收敛模型 | **仅 CONFIRMED 进入 `global_product`**；PENDING/CONFLICT 独立队列；Morrishk 首期单 Tenant；全局/租户数据归属分离 |

## 1. 目标

1. 生成稳定、唯一的全局产品 ID；
2. 支持幂等导入、重解析、更新、合并、拆分；
3. 冲突检测与人工裁决可审计；
4. 保留变更历史与旧键兼容；
5. 支持并发导入/重复请求；
6. 不把 `(mpn_norm, brand_norm)` 直接认定为永久唯一键；
7. **正式产品表只承载 CONFIRMED 身份**；`PENDING_*` 不占正式键、不生成 `product_uid`/`pbk1_`；
8. 首期只服务 Morrishk 单一 Tenant；全局产品身份与租户访问权分离（详见 `06` §8、`10`）。

## 2. 方案比较

| 方案 | ID 形态 | 优点 | 风险/限制 | 迁移成本 |
|---|---|---|---|---|
| A. 自然键 `(mpn_norm, brand_norm)` 直接作主键 | 复合键 / `pbk1_` | 可复算、与候选契约一致 | Brand/MPN 规则变化即键漂移；变体/封装/多版本无法表达；合并/拆分无稳定身份；Brand 缺失无键 | 低（但后期返工高） |
| B. canonical 内容哈希 | `sha256(canonical)` | 可复算、去重 | 任何字段变化生成新 ID；合并/拆分困难；不适合作为长期主键 | 中 |
| C. 注册表签发 surrogate ID + 自然键唯一约束（推荐） | `product_uid`（ULID/UUIDv7） | 稳定；自然键可变；支持别名/合并/拆分/审计；API 友好 | 需要注册表/DB/治理；需迁移旧 ID | 中高 |
| D. 沿用旧站/新平台自增 ID | int/bigint | 与旧系统兼容 | 跨系统/跨库不稳定；不透明；暴露内部 ID | 高 |
| E. 文档内容 ID（现状） | `prod-doc` | 无迁移 | 不是产品身份；同产品多文档分裂 | 无（但不满足目标） |

**推荐 C**：`product_uid` 作为稳定主键；`(brand_id, mpn_norm, variant_state, variant_key)` 作为自然键/唯一候选；`pbk1_` 作为自然键编码候选（PROPOSED），不代替 surrogate ID。

## 3. 候选注册表结构

```text
-- 正式产品表：只允许 CONFIRMED 身份写入；GLOBAL-scoped，不带 tenant_id
global_product
  product_uid          surrogate primary key (ULID/UUIDv7) [候选]
  brand_id             FK -> brand_registry
  mpn_norm             normalized MPN (已批准 profile 输出)
  variant_state        KNOWN / NOT_APPLICABLE（禁止 UNKNOWN）
  variant_key          NOT NULL；NOT_APPLICABLE 使用保留哨兵 __NO_VARIANT__
  natural_key_hash     hash of canonical natural key [候选]
  lifecycle_state      ACTIVE / MERGED / RETIRED（不是 PENDING_*）
  merged_into          product_uid nullable
  created_at / updated_at
  source / evidence_ref
  version              optimistic concurrency

-- 正式自然键唯一约束仅对 ACTIVE 生效（候选，非 DDL）：
--   UNIQUE (brand_id, mpn_norm, variant_state, variant_key)
--   WHERE lifecycle_state = 'ACTIVE'
-- 四分量均 NOT NULL；PENDING_* 不在此表，故不占用该唯一键。

-- 待确认队列：Site-level；不是 product_uid / pbk1_ 命名空间
identity_pending
  pending_id           独立主键（ULID/UUIDv7）
  tenant_id            NOT NULL（首期为 Morrishk）
  site_id              NOT NULL（来源 Site）
  brand_raw / brand_norm
  mpn_raw / mpn_norm
  variant_state        UNKNOWN / KNOWN / NOT_APPLICABLE
  variant_raw
  reason               PENDING_BRAND / PENDING_VARIANT / PENDING_CONFLICT
  status               OPEN / ADJUDICATED / REJECTED
  idempotency_key      unique
  evidence_ref
  created_at / updated_at
  -- CHECK：tenant_id IS NOT NULL AND site_id IS NOT NULL
  -- FK (tenant_id, site_id) -> site(tenant_id, site_id)
  -- UNIQUE (tenant_id, site_id, pending_id)（供 identity_conflict 复合外键）

-- 冲突记录：双作用域，但各自约束完整
identity_conflict
  conflict_id
  scope                GLOBAL / TENANT
  tenant_id            NULL when GLOBAL；NOT NULL when TENANT
  site_id              NULL when GLOBAL；NOT NULL when TENANT
  pending_id           NULL when GLOBAL；NOT NULL when TENANT（FK -> identity_pending）
  candidate_set        候选 natural key / brand_id / mpn_norm 列表
  conflict_type        MULTI_BRAND / MULTI_MPN / ALIAS_CONFLICT / VARIANT_CONFLICT / PROFILE_CONFLICT
  status               OPEN / RESOLVED / REJECTED
  resolution_ref       FK -> global_adjudication
  created_at / updated_at
  -- CHECK (scope='GLOBAL' AND tenant_id IS NULL AND site_id IS NULL AND pending_id IS NULL)
  --    OR (scope='TENANT' AND tenant_id IS NOT NULL AND site_id IS NOT NULL AND pending_id IS NOT NULL)
  -- TENANT: FK (tenant_id, site_id) -> site(tenant_id, site_id)
  --         FK (tenant_id, site_id, pending_id) -> identity_pending(tenant_id, site_id, pending_id)
  -- GLOBAL: 不引用 tenant/site/pending，仅由 GLOBAL 裁决处理

brand_registry
  brand_id / brand_norm / status / created_at    -- GLOBAL-scoped；无 tenant_id

-- 两个独立 alias 注册表，不共用命名空间
brand_alias
  alias_id
  alias_norm
  brand_id             FK -> brand_registry（目标 Brand）
  scope                GLOBAL / TENANT
  tenant_id            NULL for GLOBAL；NOT NULL for TENANT
  valid_from / valid_to
  is_current           boolean NOT NULL（当前映射标记；历史行 false）
  merged_into          brand_id nullable（更名/合并目标）
  reason / audit_ref
  -- 当前映射唯一：GLOBAL(alias_norm) WHERE is_current；TENANT(tenant_id, alias_norm) WHERE is_current
  -- 历史行可多条保留；区间不得重叠（排斥约束）
  -- CHECK：(scope='GLOBAL' AND tenant_id IS NULL) OR (scope='TENANT' AND tenant_id IS NOT NULL)
  -- CHECK：valid_to IS NULL OR valid_to > valid_from
  -- CHECK：(is_current AND valid_to IS NULL) OR (NOT is_current AND valid_to IS NOT NULL)

mpn_alias
  alias_id
  alias_norm
  brand_id             **NOT NULL**（Brand 上下文）
  mpn_norm             canonical target
  scope                GLOBAL / TENANT
  tenant_id            NULL for GLOBAL；NOT NULL for TENANT
  valid_from / valid_to
  is_current           boolean NOT NULL（当前映射标记；历史行 false）
  normalizer_version
  reason / audit_ref
  -- 当前映射唯一：GLOBAL(brand_id, alias_norm) WHERE is_current；TENANT(tenant_id, brand_id, alias_norm) WHERE is_current
  -- 历史行可多条保留；区间不得重叠（排斥约束）
  -- CHECK：(scope='GLOBAL' AND tenant_id IS NULL) OR (scope='TENANT' AND tenant_id IS NOT NULL)
  -- CHECK：valid_to IS NULL OR valid_to > valid_from
  -- CHECK：(is_current AND valid_to IS NULL) OR (NOT is_current AND valid_to IS NOT NULL)

mpn_profile
  profile_id
  profile_scope        BRAND / MANUFACTURER / GLOBAL   -- GLOBAL-scoped 规则；无 tenant_id
  brand_id / manufacturer_id (按 scope)
  version
  status               DRAFT / PROPOSED / APPROVED / RETIRED
  effective_from / effective_to
  test_vector_ref
  owner / approved_by
  priority             由 scope 决定：BRAND > MANUFACTURER > GLOBAL

global_product_alias
  alias_id
  alias_type           OLD_PRODUCT_ID / OLD_PBK / LEGACY_ID
  alias_value          unique per type
  product_uid          FK
  valid_from / valid_to
  reason / audit_ref

product_document       -- 全局身份 ↔ 文档（仅当文档可作为全局证据）
  product_uid          FK
  document_id          FK (doc-sha)
  relation             PRIMARY / SUPPLEMENTARY / VERSION
  evidence_ref

tenant_document        -- 租户私有文档；TENANT-scoped
  tenant_id            NOT NULL
  site_id              NOT NULL
  document_id
  product_uid          nullable（只有解析到 CONFIRMED 才回填）
  ownership            CUSTOMER_PRIVATE / SHARED_PUBLIC
  source / evidence_ref

tenant_evidence        -- Site-level 私有证据；TENANT-scoped
  evidence_id
  tenant_id            NOT NULL
  site_id              NOT NULL（必须属于同一 tenant）
  document_id          NOT NULL（来源文档）
  run_id               nullable（来源解析任务）
  source_ref           至少 document_id 或 run_id 之一必须可追溯
  product_uid          nullable（关联 CONFIRMED；不改变证据归属）
  visibility           首期仅 PRIVATE（SHARED/PUBLIC 为预留，跨租户共享不启用）
  license_ref
  created_at
  -- 约束：site.tenant_id = tenant_evidence.tenant_id；私有证据不跨租户

tenant_assertion       -- 客户确认；TENANT-scoped，不能写 global_product
  assertion_id
  tenant_id            NOT NULL
  site_id              NOT NULL
  submitted_by_principal_id         提交者 principal（来自 token 绑定）
  tenant_approved_by_principal_id   Tenant 审批者 principal（nullable；必须 ≠ 提交者）
  tenant_approved_at                nullable
  auth_context_ref     提交/审批的认证上下文引用（token/client/role 快照）
  -- CHECK：status IN ('SUBMITTED','UNDER_REVIEW') -> 审批字段均为 NULL
  -- CHECK：status IN ('TENANT_APPROVED','ACCEPTED_BY_GLOBAL','REJECTED_BY_GLOBAL') -> 审批字段均 NOT NULL
  -- CHECK：submitted_by_principal_id <> tenant_approved_by_principal_id
  assertion_type       BRAND_CONFIRM / MPN_CONFIRM / PRODUCT_OWNERSHIP /
                       PRODUCT_CORRECTION / DOCUMENT_ATTRIBUTION
  target_ref
  asserted_values
  evidence_ref
  status               SUBMITTED / UNDER_REVIEW / TENANT_APPROVED /
                       ACCEPTED_BY_GLOBAL / REJECTED_BY_GLOBAL / WITHDRAWN
  global_decision_ref  nullable -> global_adjudication
  created_at / updated_at

global_adjudication    -- 全局身份裁决；GLOBAL-scoped，无 tenant_id
  adjudication_id
  subject_type         PENDING / CONFLICT / TENANT_ASSERTION
  subject_ref
  decision             CONFIRM / REJECT / MERGE / SPLIT / REASSIGN
  rationale
  decided_by_principal_id    Global 决策者 principal（identity.admin）
  approved_by_principal_id   Global 审批者 principal（identity.approver；必须 ≠ 决策者）
  decision_status      PROPOSED / APPROVED / REJECTED
  decided_at
  approved_at          nullable（未审批前不得写 global_product）
  auth_context_ref     决策/批准的认证上下文引用（token/client/role 快照）
  -- CHECK：PROPOSED -> 审批字段均 NULL；APPROVED -> 均 NOT NULL；REJECTED -> 均 NULL
  -- CHECK：decided_by_principal_id <> approved_by_principal_id
  audit_ref

product_lineage
  event_id
  event_type           MERGE / SPLIT / REASSIGN
  from_uid / to_uid
  reason
  actor / approved_by / approved_at
  evidence_ref

product_import_event   -- TENANT-scoped 导入事件
  idempotency_key      unique
  tenant_id            NOT NULL
  site_id              NOT NULL
  document_id / run_id
  requested_by
  result               CREATED / MATCHED / PENDING / CONFLICT / REJECTED
  product_uid          nullable
  pending_id           nullable
  created_at

audit_log              -- 三作用域审计：GLOBAL / TENANT / SITE
  audit_id
  scope                GLOBAL / TENANT / SITE
  tenant_id            NULL when scope=GLOBAL；NOT NULL when scope=TENANT/SITE
  site_id              NULL when scope=GLOBAL/TENANT；NOT NULL when scope=SITE
  actor / action / target_ref / reason / at
  -- CHECK (scope='GLOBAL' AND tenant_id IS NULL AND site_id IS NULL)
  --    OR (scope='TENANT' AND tenant_id IS NOT NULL AND site_id IS NULL)
  --    OR (scope='SITE'   AND tenant_id IS NOT NULL AND site_id IS NOT NULL)
  -- SITE: FK (tenant_id, site_id) -> site(tenant_id, site_id)

principal              -- 服务端可信稳定主体标识；GLOBAL-scoped
  principal_id         PK（不来自客户端自报）
  principal_type       NATURAL_PERSON / SERVICE_ACCOUNT
  status               ACTIVE / DISABLED
  created_at / updated_at
  -- 无 tenant_id；租户归属由 principal_role + tenant 关系表达

client_subject_binding -- OAuth (client_id, subject) -> principal 映射
  client_id            FK -> oauth_client
  subject              来自 token 的 subject
  principal_id         FK -> principal
  valid_from / valid_to
  is_current           boolean NOT NULL
  -- UNIQUE (client_id, subject) WHERE is_current
  -- 同一自然人可通过不同 client 得到不同 subject，但必须映射到同一 principal_id

principal_domain_binding   -- 每个 principal 同一时刻只允许一个有效角色域（R2.2.3）
  binding_id           PK
  principal_id         FK -> principal
  role_domain          TENANT / GLOBAL
  tenant_id            TENANT 域必填；GLOBAL 域必须 NULL
  status               ACTIVE / REVOKED
  effective_from / effective_to
  granted_by / granted_at
  revoked_by / revoked_at / revoke_reason
  -- CHECK：(role_domain='TENANT' AND tenant_id IS NOT NULL) OR (role_domain='GLOBAL' AND tenant_id IS NULL)
  -- UNIQUE (principal_id) WHERE status='ACTIVE'   -- 同一 principal 仅一个有效域
  -- UNIQUE (principal_id, role_domain)             -- 供 principal_role 复合外键
  -- 撤销只置 REVOKED，不删除历史行

role_catalog               -- 角色目录；固定角色域
  role                 PK（tenant.editor / tenant.admin / identity.admin / identity.approver）
  role_domain          TENANT / GLOBAL
  -- 由目录决定，不由调用方指定

principal_role         -- 角色授予；域由 binding 决定，不能自行声明
  binding_id           FK -> principal_domain_binding
  principal_id         FK -> principal
  role                 FK -> role_catalog(role)
  role_domain          FK -> role_catalog(role, role_domain)
  revoked_at / revoked_by
  granted_at / granted_by
  -- FK (binding_id, role_domain) -> principal_domain_binding(binding_id, role_domain)
  -- FK (principal_id, binding_id) -> principal_domain_binding(principal_id, binding_id)
  -- UNIQUE (binding_id, role) WHERE revoked_at IS NULL
  -- 互斥由 principal_domain_binding 的“单有效域”保证：
  --   同一 principal 不能同时存在 TENANT 与 GLOBAL 的有效 binding
  -- 禁止组合：{tenant.editor, tenant.admin} × {identity.admin, identity.approver}
```

> 表名与字段为候选；不是 DDL，不改数据库。

### 3.1 正式表与待确认状态的隔离（R2-2）

| 状态 | 存放位置 | 是否占用正式自然键 | 是否生成 `product_uid` | 是否可生成 `pbk1_` |
|---|---|---|---|---|
| `CONFIRMED` + `ACTIVE` | `global_product` | 是（部分唯一索引） | 是 | 是 |
| `PENDING_BRAND` | `identity_pending` | 否 | 否 | 否 |
| `PENDING_VARIANT` | `identity_pending` | 否 | 否 | 否 |
| `PENDING_CONFLICT` | `identity_conflict`（关联 `identity_pending`） | 否 | 否 | 否 |
| `MERGED` | `global_product.lifecycle_state=MERGED` + alias | 否（旧键转 alias） | 保留旧 uid | 旧键仅兼容 |
| `RETIRED` | `global_product.lifecycle_state=RETIRED` | 否 | 保留 uid | 否 |
| `SPLIT` | `product_lineage` + 新 `global_product` 行 | 新键占用，旧键 alias | 新 uid | 新键按状态 |

- `identity_pending` / `identity_conflict` 的 `pending_id` / `conflict_id` **不是** `product_uid`，不得对外当产品 ID。
- `PENDING_*` 可关联 `tenant_document`，但不得因此获得全局产品身份。
- 裁决通过前，任何入口不得伪造 `pbk1_` 或 `product_uid`。

### 3.2 variant_state 与自然键

自然键固定为 `(brand_id, mpn_norm, variant_state, variant_key)`，四分量非空：

| `variant_state` | `variant_key` 取值 | 是否可写 `global_product` | 说明 |
|---|---|---|---|
| `UNKNOWN` | 无（只在 `identity_pending`） | 否 | 变体未裁定 → `PENDING_VARIANT` |
| `NOT_APPLICABLE` | `__NO_VARIANT__` | 是 | 显式裁定无变体；必须有裁定人/时间/依据 |
| `KNOWN` | 非空规范化值 | 是 | 必须由已签署变体定义生成 |

- 禁止用 `NULL`/空串表示“无变体”；`NOT_APPLICABLE` 必须用保留哨兵。
- 若已存在 `NOT_APPLICABLE` 行，后续裁定为 `KNOWN` 时不得原地改键；须走拆分/迁移并写 audit。
- 变体定义未签署时，只能进入 `identity_pending(reason=PENDING_VARIANT)`。

### 3.3 Alias 注册表收敛（R2-4）

| 项 | Brand Alias | MPN Alias |
|---|---|---|
| 注册表 | `brand_alias`（独立） | `mpn_alias`（独立） |
| 命名空间 | 不共用 | 不共用 |
| 作用域 | `GLOBAL` / `TENANT` | `GLOBAL` / `TENANT` |
| 租户隔离 | 租户别名不跨租户 | 租户别名不跨租户 |
| 查找顺序 | `TENANT exact` → `GLOBAL exact` → 无匹配 | **先锁定 `brand_id`**，再 `TENANT(brand) exact` → `GLOBAL(brand) exact` → 无匹配 |
| 冲突 | `PENDING_CONFLICT` + 人工裁决 | `PENDING_CONFLICT` + 人工裁决 |
| 历史名 | `valid_to` + `merged_into` 保留 | `valid_to` + 目标 `mpn_norm` 保留 |

- 租户别名不得覆盖/改写全局语义；全局别名变更需独立治理与签署。
- alias 变更必须写 `audit_log`；未签署规则不得用于自动确认/合并。
- Brand 与 MPN 的 alias 解析结果不得互相推断（Brand 命中不代表 MPN 合法，反之亦然）。

#### 3.3.1 Alias 唯一约束与有效期（R2.1，R2.2 补强）

| 注册表 | `GLOBAL` 当前映射唯一键 | `TENANT` 当前映射唯一键 |
|---|---|---|
| `brand_alias` | `alias_norm`（`WHERE scope='GLOBAL' AND is_current`） | `(tenant_id, alias_norm)`（`WHERE scope='TENANT' AND is_current`） |
| `mpn_alias` | `(brand_id, alias_norm)`（`WHERE scope='GLOBAL' AND is_current`） | `(tenant_id, brand_id, alias_norm)`（`WHERE scope='TENANT' AND is_current`） |

```text
CHECK (scope = 'GLOBAL' AND tenant_id IS NULL)
   OR (scope = 'TENANT' AND tenant_id IS NOT NULL)
```

1. **`is_current` 唯一语义**：`is_current = true` ⟺ `valid_to IS NULL`；`is_current = false` ⟺ `valid_to IS NOT NULL`。
2. **当前映射唯一**：同一唯一键同一时刻最多一条 `is_current = true`；唯一键按注册表分别定义（见上表，不得混用 Brand Alias 与 MPN Alias）。
3. **历史映射可保留**：`is_current = false` 的旧行可多条，不参与唯一冲突，保留 `valid_from`/`valid_to` 与原因。
4. `valid_from` 必填、`valid_to` 可空；区间半开 `[valid_from, valid_to)`，`CHECK (valid_to IS NULL OR valid_to > valid_from)`。
5. **有效期不得重叠**：同一唯一键的任意两个区间均不得重叠，**包括指向相同目标**；仅允许首尾相接（`old.valid_to = new.valid_from`）。**废止“同目标重叠可合并”**。
6. 失效别名允许重新分配，但必须新增一行并保留旧行；变更时在同一事务内“关闭旧行 + 插入新行”。
7. `normalizer_version` 升级只新增行、不改旧行；旧解析可按旧版本回溯。
8. 实现形式：部分唯一索引（当前映射）+ 数据库排斥约束（历史区间）+ 唯一键级事务锁；应用层校验为补充。本轮不建索引、不迁移。
9. Brand Alias 的完整规则见 `01` §6.5.1；MPN Alias 的完整规则见 `02` §4.6。

**时间语义与并发闭环（R2.2.1 / R2.2.2）：**

```text
CHECK (valid_to IS NULL OR valid_to > valid_from)
CHECK ((is_current AND valid_to IS NULL) OR (NOT is_current AND valid_to IS NOT NULL))
```

- 时间统一 UTC `timestamptz`，半开区间 `[valid_from, valid_to)`；首期**禁止未来生效行**（`valid_from <= now()`）。
- 同一唯一键任意两行区间不得重叠（含同目标），仅允许首尾相接。
- 部分唯一索引（当前映射）+ 排斥约束（历史区间）同时生效：
  - `brand_alias` GLOBAL：`EXCLUDE USING gist (alias_norm WITH =, tstzrange(valid_from, valid_to, '[)') WITH &&) WHERE scope='GLOBAL'`；TENANT 增加 `tenant_id`。
  - `mpn_alias` GLOBAL：`EXCLUDE USING gist (brand_id WITH =, alias_norm WITH =, tstzrange(...) WITH &&) WHERE scope='GLOBAL'`；TENANT 增加 `tenant_id`。
- **并发首次插入（空键）**：必须使用唯一键级 `pg_advisory_xact_lock` 或等效机制锁定尚不存在的记录；`SELECT ... FOR UPDATE` 空结果不等于获得锁，不得依赖。
- **并发切换（已存在）**：唯一键级互斥后再锁定记录行；同一事务内完成区间校验、关闭旧行、插入新行与审计；必要时 `SERIALIZABLE` + 重试。
- 冲突统一返回 `409 ALIAS_CONFLICT`/`PENDING_CONFLICT`；幂等键防重复提交；时间由服务端时钟或审批生效时间生成。

**数据库约束实现（R2.2.3 / A-1，与 `01`/`02` 一致）：**

| 注册表 | GLOBAL 排斥约束（`WHERE scope='GLOBAL'`） | TENANT 排斥约束（`WHERE scope='TENANT'`） |
|---|---|---|
| `brand_alias` | `EXCLUDE USING gist (alias_norm WITH =, tstzrange(valid_from, valid_to, '[)') WITH &&)` | `EXCLUDE USING gist (tenant_id WITH =, alias_norm WITH =, tstzrange(...) WITH &&)` |
| `mpn_alias` | `EXCLUDE USING gist (brand_id WITH =, alias_norm WITH =, tstzrange(...) WITH &&)` | `EXCLUDE USING gist (tenant_id WITH =, brand_id WITH =, alias_norm WITH =, tstzrange(...) WITH &&)` |

- 需要 `CREATE EXTENSION IF NOT EXISTS btree_gist` 提供 text/UUID 的 GiST 相等 operator class；不得只写 `EXCLUDE USING gist`。
- `tstzrange(valid_from, valid_to, '[)')` 在 `valid_to IS NULL` 时上界为无穷；首尾相接不重叠，其余交叠拒绝。
- 首期禁止未来生效行：用 `BEFORE INSERT/UPDATE` 触发器或事务写入校验，不能写成普通 `CHECK (valid_from <= now())`。
- advisory lock 键基于完整唯一键（含 scope/tenant/brand/alias），碰撞只增加串行；数据库约束仍是最终防线。

#### 3.3.2 三类资源的复合外键与 CHECK（R2.2.1 / R2.2.2）

前置唯一键：`tenant(tenant_id)` 主键；`site` 增加 `UNIQUE (tenant_id, site_id)`，供 Site-level 复合外键使用；`identity_pending` 增加 `UNIQUE (tenant_id, site_id, pending_id)`，供 `identity_conflict` 复合外键使用。

| 类别 | 强制约束 |
|---|---|
| Global-level | `CHECK (tenant_id IS NULL AND site_id IS NULL)`；不得引用 tenant/site |
| Tenant-level | `CHECK (tenant_id IS NOT NULL AND site_id IS NULL)`；`FK (tenant_id) REFERENCES tenant(tenant_id)` |
| Site-level | `CHECK (tenant_id IS NOT NULL AND site_id IS NOT NULL)`；`FK (tenant_id, site_id) REFERENCES site(tenant_id, site_id)`（复合外键同时保证 Site 属于该 Tenant） |

**逐表归属与约束：**

| 表 | 类别 | `tenant_id` | `site_id` | 约束 |
|---|---|---|---|---|
| `oauth_client` | Site-level | NOT NULL | NOT NULL | CHECK + 复合外键 `(tenant_id, site_id) → site` |
| `tenant_document` | Site-level | NOT NULL | NOT NULL | CHECK + 复合外键 |
| `tenant_evidence` | Site-level | NOT NULL | NOT NULL | CHECK + 复合外键 |
| `tenant_assertion` | Site-level | NOT NULL | NOT NULL | CHECK + 复合外键 |
| `identity_pending` | Site-level | NOT NULL | NOT NULL | CHECK + 复合外键 + `UNIQUE (tenant_id, site_id, pending_id)` |
| `tenant_product_access` | Tenant-level | NOT NULL | NULL | CHECK + `FK(tenant_id) → tenant` |
| `tenant` | Tenant-level | 自身主键 | 无该列 | — |
| `global_product` | Global-level | NULL | NULL | CHECK 两列均 NULL |
| `brand_registry` | Global-level | NULL | NULL | 同上 |
| GLOBAL 作用域 `brand_alias`/`mpn_alias` | Global-level | NULL | NULL | 同上 |
| `mpn_profile` | Global-level | NULL | NULL | 同上 |
| `global_adjudication` | Global-level | NULL | NULL | 同上 |
| `product_lineage` | Global-level | NULL | NULL | 同上 |
| `identity_conflict` | 双作用域 | GLOBAL=NULL；TENANT=NOT NULL | GLOBAL=NULL；TENANT=NOT NULL | 见下 |

**`identity_conflict` 双作用域约束（统一口径）：**

```text
CHECK (scope='GLOBAL' AND tenant_id IS NULL AND site_id IS NULL AND pending_id IS NULL)
   OR (scope='TENANT' AND tenant_id IS NOT NULL AND site_id IS NOT NULL AND pending_id IS NOT NULL)
-- TENANT：FK (tenant_id, site_id) -> site(tenant_id, site_id)
--         FK (tenant_id, site_id, pending_id) -> identity_pending(tenant_id, site_id, pending_id)
-- GLOBAL：不引用 tenant/site/pending，由 GLOBAL 裁决处理
```

**`audit_log` 三作用域约束（统一口径）：**

```text
CHECK (scope='GLOBAL' AND tenant_id IS NULL AND site_id IS NULL)
   OR (scope='TENANT' AND tenant_id IS NOT NULL AND site_id IS NULL)
   OR (scope='SITE'   AND tenant_id IS NOT NULL AND site_id IS NOT NULL)
-- SITE：FK (tenant_id, site_id) -> site(tenant_id, site_id)
```

- `scope='TENANT'` 用于 Tenant-level 事件（无 site）；`scope='SITE'` 用于 Site-level 事件（必须有 site）。
- 复合外键要求 `site(tenant_id, site_id)` 唯一；仅用 `site_id` 单列外键不足以表达“Site 属于该 Tenant”，不采用。
- 以上约束与 `06` §8.12、`10` §2/§4 必须保持一致，不得出现不同口径。

#### 3.3.3 principal 角色域互斥的数据库强制（R2.2.3）

| 约束对象 | 键/约束 |
|---|---|
| `principal_domain_binding` | PK `binding_id`；`UNIQUE (principal_id) WHERE status='ACTIVE'`（单有效域）；`UNIQUE (principal_id, role_domain)`（供复合外键） |
| `principal_role` | `UNIQUE (binding_id, role) WHERE revoked_at IS NULL`；`FK (binding_id, role_domain) → principal_domain_binding(binding_id, role_domain)`；`FK (principal_id, binding_id) → principal_domain_binding(principal_id, binding_id)` |
| `role_catalog` | PK `role`；`UNIQUE (role, role_domain)`；角色域固定：`tenant.editor`/`tenant.admin` = TENANT，`identity.admin`/`identity.approver` = GLOBAL |
| 域一致性 | `CHECK ((role_domain='TENANT' AND tenant_id IS NOT NULL) OR (role_domain='GLOBAL' AND tenant_id IS NULL))` |

1. **单一有效域**：`UNIQUE (principal_id) WHERE status='ACTIVE'` 是最终防线；同一 principal 不可能同时拥有 TENANT 与 GLOBAL 的有效 binding。
2. **角色不能自选域**：`principal_role.role_domain` 必须等于其 binding 的域（复合外键），角色自身域再由 `role_catalog` 固定，三层一致。
3. **并发授予**：先 `SELECT ... FROM principal FOR UPDATE` 锁定主体，再插入 ACTIVE binding；两个并发不同域授予由部分唯一索引裁决，仅一个成功，另一个收到唯一冲突并返回 `409 ROLE_DOMAIN_CONFLICT`。不得双写成功。
4. **撤销与换域**：撤销 = `binding.status='REVOKED'` + `effective_to` + 同事务撤销该 binding 下所有 `principal_role`（写 `revoked_at`）；历史行保留。换域需新建 binding 行，旧 binding/角色保留为历史，审计可追溯。
5. **同域多角色**：同一 ACTIVE binding 下允许 `tenant.editor` + `tenant.admin`（或 `identity.admin` + `identity.approver`）并存，但具体授予仍受业务策略限制。
6. **职责分工**：数据库负责“单有效域、域与角色匹配、无重复有效授予”；应用层负责“谁有权授予、审批流程、撤销原因与审计”。应用层校验不得替代上述数据库约束。
7. **审计**：binding 授予/撤销、角色授予/撤销均写 `audit_log`（TENANT 或 GLOBAL scope），记录 actor principal、目标 principal、域、角色、原因。

### 3.4 MPN Profile 选择（R2-4）

```text
候选 profile 集 = APPROVED 且在有效期内的 profile
选择顺序      = BRAND > MANUFACTURER > GLOBAL
无 APPROVED   -> 不自动确认；进入 PENDING（LOW_CONFIDENCE）/PENDING_CONFLICT
```

- 只有 `APPROVED` profile 的输出可成为 `mpn_norm` 并参与 CONFIRMED。
- 同一 Brand 存在多个同优先级 `APPROVED` profile = 治理错误，必须阻断并报冲突。
- `normalizer_version`、`profile_id`、`profile_version` 随结果记录；升级/回退见 §5。

## 4. 解析/导入工作流（候选）

```text
raw MPN/Brand (tenant_id, site_id)
  -> Brand resolve (brand_registry + brand_alias: TENANT -> GLOBAL)
  -> MPN alias resolve (mpn_alias, 先锁定 brand_id: TENANT(brand) -> GLOBAL(brand))
  -> MPN normalize (mpn_profile: BRAND > MANUFACTURER > GLOBAL, APPROVED only)
  -> variant state resolve
     ├─ UNKNOWN -> identity_pending(PENDING_VARIANT)
     └─ KNOWN / NOT_APPLICABLE -> natural key candidate
  -> lookup global_product (ACTIVE)
     ├─ exact unique match -> 关联已有 product_uid（MATCHED；不创建/不改身份）
     ├─ no match + brand missing/low-confidence -> identity_pending(PENDING_BRAND)
     ├─ no match（普通导入）-> identity_pending(PENDING_NEW_IDENTITY)；**禁止创建 global_product**
     └─ multiple/candidate conflict -> identity_conflict + identity_pending(PENDING_CONFLICT)
  -> link tenant_document (never writes private data into global_product)
  -> write product_import_event (idempotency)
```

**Global Product 写入唯一入口（R2.2.3 / C-1）：**

1. 普通导入、重解析、批量导入、后台任务、管理员操作遇到“无匹配产品”时，**只能创建 `identity_pending`**，不得直接创建 `global_product`。
2. Tenant Assertion 必须先由 Tenant 审批者完成审批，**独立提交** `TENANT_APPROVED`。
3. Global 决策者只能创建 `decision_status='PROPOSED'` 的裁决。
4. 只有 Global Approver 批准且 `decision_status='APPROVED'` 后，才允许创建/更新 `global_product`。
5. Global 最终事务必须重新锁定并验证关联 Tenant Assertion 的状态为 `TENANT_APPROVED`。
6. `global_product`、alias、lineage、pending 状态、`global_adjudication`、GLOBAL `audit_log` 必须在同一最终事务中提交或回滚。
7. 不存在绕过路径：直接导入、重解析、批量导入、后台任务、管理员操作一律走同一门槛；管理员不得以“修复数据”为由直接写 `global_product`。
8. 三类动作必须分开：
   - **匹配与关联**：已存在 CONFIRMED 产品 → 复用 `product_uid`，只建立 `tenant_document` 关联；
   - **候选创建**：无匹配 → 写 `identity_pending`（不占正式键）；
   - **正式注册**：Global Adjudication `APPROVED` 后 → 创建/更新 `global_product`。

- 单次导入的所有写入（`identity_pending` / `tenant_document` / `product_import_event` / `audit_log`）在同一事务内提交或回滚；该事务**不含** `global_product` 写入。
- 私有 PDF/解析/证据只写 `tenant_document`/`tenant_evidence`，不回填 `global_product` 的公共字段，除非有明确授权。

## 5. 幂等、重解析、更新

| 场景 | 候选行为 |
|---|---|
| 同一 PDF 重复导入 | 同 document_id；同 product_uid（若身份一致）；import_event 幂等键去重 |
| 重解析同一 PDF | 新 run_id；document_id 不变；product_uid 不变（除非规则变化，需审计） |
| 导入无匹配产品 | 只写 `identity_pending`；**不得创建 `global_product`**；等待 Tenant 审批与 Global 裁决 |
| 批量/后台导入 | 与普通导入同一门槛；无匹配只写 pending；不得批量直建 `global_product` |
| 管理员“修复数据” | 只能修正 pending/别名/证据；不得绕过 Global Adjudication 直写 `global_product` |
| 更新 Brand/MPN 规则 | 旧 product_uid 保留；自然键变化 → 别名/迁移；不静默重写 |
| normalizer_version 升级 | 旧 `mpn_norm` 进 `mpn_alias`/历史；新 norm 重算；冲突转 `PENDING_CONFLICT`；写审计 |
| normalizer_version 回退 | 不删除新结果；通过 alias/lineage 记录；必要时人工重映射 |
| 产品更新（属性变化） | 同 product_uid；版本/变更历史记录 |
| 产品合并 | 保留两个 product_uid；`merged_into` + alias + lineage；不物理删除 |
| 产品拆分 | 新 product_uid/新键；旧 uid 保留并标 SPLIT/别名，谱系记录；新旧键均不删除 |
| 并发导入 | 部分唯一索引 + 事务 + 幂等键；失败方返回 MATCHED/CONFLICT |
| 待确认记录重复提交 | 同 idempotency_key 返回同一 `pending_id`；不产生重复冲突 |

## 6. 冲突检测与人工裁决

- 自然键唯一约束（仅 ACTIVE）防重复创建；
- `PENDING_CONFLICT` 场景：同 Brand 多个候选 norm、同 MPN 多 Brand 但客户认为同产品、Brand/MPN alias 冲突、profile 冲突、变体冲突；
- 裁决必须记录：决策人、时间、证据、影响范围、是否跨租户（首期必为否）；
- 未经签署的自动合并禁止；不得“先建 CONFIRMED 再改”；
- **裁决状态门槛（R2.2.3）**：`global_adjudication.decision_status` 必须为 `APPROVED` 才允许写 `global_product`；`PROPOSED`/`REJECTED` 一律不得写入；
- **最终事务**（仅在 `APPROVED` 后执行）：

```text
BEGIN
  SELECT ... FROM tenant_assertion WHERE ... FOR UPDATE;
  -- 重新验证 status = 'TENANT_APPROVED'
  UPDATE global_adjudication SET decision_status='APPROVED', approved_at=...;
  INSERT/UPDATE global_product;
  INSERT product_lineage / alias;
  UPDATE identity_pending SET status='ADJUDICATED';
  INSERT audit_log(scope='GLOBAL');
COMMIT   -- 任一步失败整体回滚
```

- 裁决为“非同一产品”时：各自保持 PENDING/REJECTED 或分别走独立审批，不得直接建 CONFIRMED，并记录理由。
- 任何路径（导入/重解析/批量/后台/管理员）都不得跳过上述门槛直接写 `global_product`。

## 7. 审计与变更历史

- `product_import_event`、`product_lineage`、`global_product_alias`、`brand_alias`、`mpn_alias`、`audit_log` 构成审计链；
- 每次身份变更记录：旧值/新值/规则版本/操作者/批准者/时间/租户；
- 对外 API 只暴露稳定 `product_uid` 与自然键，不暴露内部自增/DB 主键（若采用）；
- 审计日志不得含 token/secret，仅记录 ID/原因/证据引用。

## 8. 并发与重复请求

- 幂等键：`(tenant_id, site_id, document_sha256, requested_mpn, brand_norm, normalizer_version, operation)` 或客户端请求 ID；
- 唯一约束：`(brand_id, mpn_norm, variant_state, variant_key) WHERE lifecycle_state='ACTIVE'`；
- 事务：普通导入的 resolve/match/pending/link/audit 原子化，但**不含** `global_product` 写入；该写入只在 Global 最终审批事务中发生；
- 冲突：返回明确错误码（`PENDING_CONFLICT`/`CONFLICTING_IDENTITY`），不静默创建重复产品；
- 合并/拆分：对涉及 `product_uid` 加行锁/乐观版本，谱系与别名同事务；
- 重试：幂等键命中返回同一结果。

## 9. 与 `pbk1_` 的关系

- `pbk1_` 是候选自然键编码，可作为 API 外部标识或自然键哈希；
- `product_uid` 是稳定主键；两者不可互换；
- 若自然键规则变化，`pbk1_` 可能变化，但 `product_uid` 不变；旧 `pbk1_` 进入 `global_product_alias(OLD_PBK)`；
- `pbk1_` 只对 CONFIRMED 生成；`PENDING_*` 不得生成；
- 是否在 API 暴露 `pbk1_`、`product_uid` 或两者，见 `06` 与 D-08；
- `pbk1_` 仍是 PROPOSED，不是已批准主键。

## 10. 决策点

- D-05：全局 ID 方案（推荐 C）；
- D-06：合并/拆分/冲突裁决与审计；
- D-10：幂等/并发/回滚/迁移；
- D-04：变体是否进入自然键与 variant_state 语义；
- D-21：正式唯一约束仅对 CONFIRMED+ACTIVE 生效；
- D-22：PENDING_* 队列与正式键隔离；
- D-23：合并/拆分/normalizer 升级的历史键保留；
- D-18：Brand/MPN alias 独立注册表与作用域；
- D-20：无可靠 Brand/未批准 MPN profile 时禁止自动确认/合并；
- D-31：Tenant/Site/OAuth Client 首期边界；
- D-33：Tenant Product Access 模型（全局产品 ≠ 租户访问权）；
- D-34：Resource Access Policy 与 allow/deny 语义。
- 当前 `PROPOSED_NOT_APPROVED`。

## 11. 测试要求（详见 07）

同 MPN 跨 Brand、同 Brand 不同 MPN、多 PDF 同产品、重复导入、重解析、别名、未知 Brand、格式冲突、合并、拆分、并发、历史 ID 兼容、API scope 隔离；R2 新增：正式表仅 CONFIRMED、PENDING 不占键、variant_state 三态、alias/profile 冲突、租户访问隔离（V-29…V-40）。