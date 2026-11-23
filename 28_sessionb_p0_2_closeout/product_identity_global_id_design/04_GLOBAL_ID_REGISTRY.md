# Global ID Registry 设计

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-004 |
| 版本 | v2.0-R2 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 事实基线 | 无全局产品 ID/注册表；`product_id=prod-doc`；lake 仅 3 表 |
| 相关决策 | D-05、D-06、D-10、D-21、D-22、D-23、D-31…D-34（见 `08_DECISION_REGISTER.md`） |
| 收敛模型 | **仅 CONFIRMED 进入 `global_product`**；PENDING/CONFLICT 独立队列；Morrishk 首期单 Tenant |

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
-- 正式产品表：只允许 CONFIRMED 身份写入
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

-- 待确认队列：不是 product_uid / pbk1_ 命名空间
identity_pending
  pending_id           独立主键（ULID/UUIDv7）
  tenant_id            首期为 Morrishk
  site_id              来源 Site
  brand_raw / brand_norm
  mpn_raw / mpn_norm
  variant_state        UNKNOWN / KNOWN / NOT_APPLICABLE
  variant_raw
  reason               PENDING_BRAND / PENDING_VARIANT / PENDING_CONFLICT
  status               OPEN / ADJUDICATED / REJECTED
  idempotency_key      unique
  evidence_ref
  created_at / updated_at

identity_conflict
  conflict_id
  pending_id           FK -> identity_pending
  candidate_set        候选 natural key / brand_id / mpn_norm 列表
  conflict_type        MULTI_BRAND / MULTI_MPN / ALIAS_CONFLICT / VARIANT_CONFLICT / PROFILE_CONFLICT
  status               OPEN / RESOLVED / REJECTED
  resolution_ref
  created_at / updated_at

brand_registry
  brand_id / brand_norm / status / created_at

-- 两个独立 alias 注册表，不共用命名空间
brand_alias
  alias_id
  alias_norm
  brand_id             FK -> brand_registry
  scope                GLOBAL / TENANT
  tenant_id            NULL for GLOBAL
  valid_from / valid_to
  merged_into          brand_id nullable（更名/合并目标）
  reason / audit_ref

mpn_alias
  alias_id
  alias_norm
  mpn_norm             canonical target
  brand_id             nullable（按 Brand 作用域）
  scope                GLOBAL / TENANT
  tenant_id            NULL for GLOBAL
  valid_from / valid_to
  normalizer_version
  reason / audit_ref

mpn_profile
  profile_id
  profile_scope        BRAND / MANUFACTURER / GLOBAL
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

tenant_document        -- 租户私有文档
  tenant_id / site_id
  document_id
  product_uid          nullable（只有解析到 CONFIRMED 才回填）
  ownership            CUSTOMER_PRIVATE / SHARED_PUBLIC
  source / evidence_ref

product_lineage
  event_id
  event_type           MERGE / SPLIT / REASSIGN
  from_uid / to_uid
  reason
  actor / approved_by / approved_at
  evidence_ref

product_import_event
  idempotency_key      unique
  tenant_id / site_id
  document_id / run_id
  requested_by
  result               CREATED / MATCHED / PENDING / CONFLICT / REJECTED
  product_uid          nullable
  pending_id           nullable
  created_at
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
| 查找顺序 | `TENANT exact` → `GLOBAL exact` → 无匹配 | `TENANT exact` → `GLOBAL exact` → 无匹配 |
| 冲突 | `PENDING_CONFLICT` + 人工裁决 | `PENDING_CONFLICT` + 人工裁决 |
| 历史名 | `valid_to` + `merged_into` 保留 | `valid_to` + 目标 `mpn_norm` 保留 |

- 租户别名不得覆盖/改写全局语义；全局别名变更需独立治理与签署。
- alias 变更必须写 `audit_log`；未签署规则不得用于自动确认/合并。
- Brand 与 MPN 的 alias 解析结果不得互相推断（Brand 命中不代表 MPN 合法，反之亦然）。

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
  -> MPN normalize (mpn_profile: BRAND > MANUFACTURER > GLOBAL, APPROVED only)
  -> variant state resolve
     ├─ UNKNOWN -> identity_pending(PENDING_VARIANT)
     └─ KNOWN / NOT_APPLICABLE -> natural key candidate
  -> lookup global_product (ACTIVE)
     ├─ exact unique match -> reuse product_uid (MATCHED)
     ├─ no match + brand missing/low-confidence -> identity_pending(PENDING_BRAND)
     ├─ no match -> create global_product + audit (CREATED)
     └─ multiple/candidate conflict -> identity_conflict + identity_pending(PENDING_CONFLICT)
  -> link tenant_document (never writes private data into global_product)
  -> write product_import_event (idempotency)
```

- 单次导入的所有写入（`global_product` / `identity_pending` / `tenant_document` / `product_import_event` / `audit_log`）在同一事务内提交或回滚。
- 私有 PDF/解析/证据只写 `tenant_document`/`tenant_evidence`，不回填 `global_product` 的公共字段，除非有明确授权。

## 5. 幂等、重解析、更新

| 场景 | 候选行为 |
|---|---|
| 同一 PDF 重复导入 | 同 document_id；同 product_uid（若身份一致）；import_event 幂等键去重 |
| 重解析同一 PDF | 新 run_id；document_id 不变；product_uid 不变（除非规则变化，需审计） |
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
- 裁决事务：写 `global_product`（若成立）→ `identity_pending.status=ADJUDICATED` → alias/lineage → `audit_log`；任一步失败整体回滚；
- 裁决为“非同一产品”时：各自独立 CONFIRMED 或保持 PENDING/REJECTED，并记录理由。

## 7. 审计与变更历史

- `product_import_event`、`product_lineage`、`global_product_alias`、`brand_alias`、`mpn_alias`、`audit_log` 构成审计链；
- 每次身份变更记录：旧值/新值/规则版本/操作者/批准者/时间/租户；
- 对外 API 只暴露稳定 `product_uid` 与自然键，不暴露内部自增/DB 主键（若采用）；
- 审计日志不得含 token/secret，仅记录 ID/原因/证据引用。

## 8. 并发与重复请求

- 幂等键：`(tenant_id, site_id, document_sha256, requested_mpn, brand_norm, normalizer_version, operation)` 或客户端请求 ID；
- 唯一约束：`(brand_id, mpn_norm, variant_state, variant_key) WHERE lifecycle_state='ACTIVE'`；
- 事务：resolve/match/create/link/audit 原子化；
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