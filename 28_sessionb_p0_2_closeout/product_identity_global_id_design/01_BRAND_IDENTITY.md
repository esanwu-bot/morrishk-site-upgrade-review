# Brand Identity 设计

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-001 |
| 版本 | v2.6-R2.2.4 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 事实基线 | Ds Bit `600439a5`；当前 `Product` 无 Brand |
| 相关决策 | D-01、D-02、D-16、D-17、D-18、D-44（见 `08_DECISION_REGISTER.md`） |

## 1. 现状与问题

- 当前代码没有 `brand`/`supplier` 字段；`manufacturer` 来自 PDF metadata `author`，可空且不可靠（复验样例为 `null`）。
- 契约候选要求 `brand_raw`/`brand_norm`，`(mpn_norm, brand_norm)` 为候选身份键；缺 Brand 为 `PENDING_BRAND`。
- 旧站 `snsii_product` 没有厂商字段；`/manufacturer/<Links>` 查的是供应商，不是品牌（IQ-01 §2.2）。
- 如果没有 Brand 权威，同一 MPN 的不同品牌会被误合并；Brand 缺失则无法生成 `pbk1_`。

## 2. 设计目标

1. 定义 Brand 的标准名称与规范化；
2. 保存原始值、规范化值、来源与证据；
3. 处理别名、历史名称、合并/更名；
4. 明确未知/缺失 Brand；
5. 明确冲突检测与人工裁决；
6. 为产品身份与全局 ID 提供稳定 Brand 键。

## 3. 候选数据模型（PROPOSED）

```text
brand_registry
  brand_id            surrogate (ULID/UUIDv7) [候选]
  brand_norm          canonical normalized key (unique) [候选]
  canonical_name      display name
  status              ACTIVE / MERGED / RETIRED / UNKNOWN
  merged_into         brand_id nullable
  created_at / updated_at
  source              CUSTOMER / DSBIT / LEGACY / MANUAL
  evidence_ref        file/URL/record pointer
  confidence          HIGH / MEDIUM / LOW

brand_alias
  alias_norm          normalized alias (unique per alias scope)
  scope               GLOBAL / TENANT [候选]（全文统一字段名，不使用 alias_scope）
  tenant_id           nullable (仅 TENANT scope)
  brand_id            FK
  alias_raw           original text
  valid_from / valid_to
  source / evidence

brand_merge
  from_brand_id       FK
  to_brand_id         FK
  reason / approved_by / approved_at
  evidence_ref

brand_evidence
  brand_id
  document_sha256 / page_number / bbox / raw_text (if extracted)
  source_type         PDF_METADATA / CUSTOMER_FILE / LEGACY_DB / MANUAL
```

> 上表是候选结构；字段名/主键类型需负责人确认，不构成 DDL 或迁移。

## 4. Brand 规范化（候选规则）

建议分层：

1. Unicode NFKC + 去首尾空白；
2. 大小写折叠（`casefold`）；
3. 合并连续空白；
4. 处理常见标点/连字符/句点（是否删除需按品牌确认）；
5. 统一全角/半角；
6. 去除常见法律后缀（Inc./Ltd./GmbH/Co. 等）——**必须可配置**，不能假定所有品牌都适用；
7. Brand 别名/历史名映射到 `brand_id`；
8. 仍无法匹配 → `UNKNOWN` 或 `PENDING_BRAND`，不得强行归并。

### 4.1 不能假定的点

- 同一 Brand 的不同写法（`TI` / `Texas Instruments` / `Texas Instruments Inc.`）需要别名表；
- 品牌更名/并购（例如同一厂商不同历史名称）需要 `merged_into` 与生效区间；
- 不同供应商/代理商不是 Brand，不能混用；
- PDF metadata `author` 可能是作者/机构，不是 Brand。

## 5. 未知/缺失 Brand

| 情况 | 候选处理 | 身份影响 |
|---|---|---|
| Brand 缺失 | `PENDING_BRAND`；不生成 `pbk1_` | 进入待确认队列，不自动合并 |
| Brand 无法识别 | `UNKNOWN` + 证据；不生成正式键 | 需人工/客户补充 |
| Brand 冲突（多个候选） | `PENDING_CONFLICT` | 人工裁决前不分配正式产品 |
| Brand 已合并/更名 | 映射到 `merged_into` | 旧键保留别名，不重写历史 |

## 6. 冲突、合并、更名

### 6.1 冲突来源

- 同一文档内不同 Brand 文本；
- 客户主数据与解析结果不一致；
- 旧站/新平台/客户文件三方不一致；
- Brand 别名表冲突（同一 alias 指向多个 brand_id）。

### 6.2 处理原则（候选）

1. 不静默选一个；记录冲突证据；
2. 冲突进入人工裁决队列；
3. 裁决结果写 `brand_merge`/`brand_alias` + 审计；
4. 历史产品 ID 不删除，保留映射与重定向；
5. 合并后旧 `brand_norm` 作为别名保留，避免旧键立即失效。

### 6.3 Brand Alias 作用域

| 作用域 | 含义 | 可见性 | 冲突处理 |
|---|---|---|---|
| `GLOBAL` | 跨客户共享的官方/行业通用别名 | 所有租户 | 全局唯一；冲突进入全局裁决 |
| `TENANT` | 单个客户/组织自有的别名或历史叫法 | 仅该 tenant | 租户内唯一；不得影响其他租户 |

规则（候选）：

1. Alias 必须有作用域；禁止把某个客户的私有别名写成 `GLOBAL`。
2. 查找顺序建议：`TENANT` 精确 → `GLOBAL` 精确 → 未匹配；不得跨租户回退。
3. 同一 alias 在 `GLOBAL` 与多个 `TENANT` 可并存；租户别名不得覆盖全局语义。
4. Alias 冲突（同作用域多 brand_id）→ `PENDING_CONFLICT`，人工裁决。
5. Brand 更名/合并后，旧名保留为 `GLOBAL`/历史 alias，并设置 `valid_to`；不得删除。
6. `brand_alias` 与 `mpn_alias` 必须是**独立注册表**，不得共用一个 alias 命名空间。

### 6.4 无可靠 Brand 的强制规则

- 没有可靠 Brand 证据时，不得自动确认身份或自动合并产品；
- Brand 缺失/低置信度 → `PENDING_BRAND`；
- Brand 别名冲突/多候选 → `PENDING_CONFLICT`；
- 只有经负责人签署的 Brand 注册表/别名规则才能用于正式身份。

### 6.5 R2 Alias 注册表收敛（Brand Alias vs MPN Alias）

| 规则 | Brand Alias | MPN Alias | 说明 |
|---|---|---|---|
| 注册表 | `brand_alias` | `mpn_alias` | **物理/逻辑均独立**，不共用命名空间 |
| 主键/必填 | `brand_id` | **`brand_id` + `alias_norm`；`brand_id` NOT NULL** | MPN Alias 必须带 Brand 上下文；不得仅凭 MPN 原文跨 Brand 解析；缺 Brand 的 MPN Alias 不得入库 |
| 作用域 | `GLOBAL` / `TENANT` | `GLOBAL` / `TENANT` | `TENANT` 必须带 `tenant_id`；`GLOBAL` 不得带 `tenant_id` |
| 查找优先级 | `TENANT` 精确 → `GLOBAL` 精确 → 未匹配 | **先锁定 Brand**，再 `TENANT(brand)` 精确 → `GLOBAL(brand)` 精确 → 未匹配 | **禁止跨 Brand、跨租户回退** |
| 冲突 | 同作用域多 `brand_id` → `PENDING_CONFLICT` | 同作用域、同 Brand、同 Alias 指向多个 canonical MPN → `PENDING_CONFLICT` | 冲突不静默选一 |
| 租户覆盖 | 租户别名仅本租户解析，不改变全局 `brand_id` 语义 | 同左 | 不得用一个客户的私有叫法改写其他客户 |
| 自动确认 | 仅经批准的 Brand 注册表/别名规则可参与 CONFIRMED | 仅经批准的 MPN Profile 可参与 CONFIRMED | 否则 `PENDING_BRAND`/`PENDING_CONFLICT` |
| 历史 | 更名/合并保留旧名为 alias + `valid_to` | 旧型号/替代料保留为 alias + `valid_to` | 不删除、不复用 |

**强制规则（R2-4）：**

1. Brand Alias 不得改写 MPN，MPN Alias 不得改写 Brand；两者只能各自解析到 `brand_id` / `canonical_mpn_norm`。
2. 租户别名冲突必须在租户内经人工裁决；不得因租户别名冲突阻塞其他租户。
3. 任何 alias 变更必须写 `audit_log`（actor、tenant、before/after、evidence、approved_by）。
4. 未签署的 alias 规则只能用于候选匹配，不得生成正式 `pbk1_`/`product_uid`。

### 6.5.1 Brand Alias 唯一约束与有效期（R2.1，R2.2 补强）

**唯一性范围（不是 `unique(alias_norm, scope, tenant_id)`）：**

| 作用域 | 当前映射唯一键（`is_current = true`） | 说明 |
|---|---|---|
| `GLOBAL` | `alias_norm` 唯一（`WHERE scope='GLOBAL' AND is_current`） | 同一时刻全局别名只能指向一个 `brand_id` |
| `TENANT` | `(tenant_id, alias_norm)` 唯一（`WHERE scope='TENANT' AND is_current`） | 同一时刻单租户内只能指向一个 `brand_id`；不同租户可各自持有同名别名 |

**一致性约束：**

```text
CHECK (scope = 'GLOBAL' AND tenant_id IS NULL)
   OR (scope = 'TENANT' AND tenant_id IS NOT NULL)
```

**当前映射 vs 历史映射（R2.2-1，R2.2.2 统一）：**

1. 每条 alias 行有 `is_current` 标记。
2. **`is_current` 唯一语义（当且仅当）**：`is_current = true` ⟺ `valid_to IS NULL`；`is_current = false` ⟺ `valid_to IS NOT NULL`。不得出现其他组合。
3. **唯一约束只作用于当前映射**：同一唯一键同一时刻最多一条 `is_current = true`。
4. **历史映射可保留多行**：`is_current = false` 的旧行不参与唯一冲突，保留 `valid_from`/`valid_to` 与原因，供回溯。
5. 新增/重新分配时：先关闭旧行（写 `valid_to`、`is_current = false`），再插入新行（`is_current = true`），两步必须在同一事务内完成。
6. **废止“同目标重叠可合并”**：不再提供任何以重叠为前提的合并路径；同目标区间若重叠即拒绝。首尾相接的同目标行保持为多行（是否合并为单行只能在不产生重叠的前提下另行决策，本轮不采用）。

**有效期语义（统一）：**

1. `valid_from` 必填；`valid_to` 可空表示持续有效（当前映射）。
2. 区间为半开 `[valid_from, valid_to)`；`CHECK (valid_to IS NULL OR valid_to > valid_from)`。
3. **同一唯一键的任意两个有效期区间均不得重叠，包括指向相同目标的情况**；唯一例外是首尾相接（`old.valid_to = new.valid_from`）。
4. 失效（`valid_to` 已过）的别名**允许重新分配**，但必须新增一行并保留旧行；不得原地改写历史。
5. 版本/规则变更不得删除旧行；旧行保留 `valid_to` 与原因，审计可追溯。

**Brand Alias 唯一键（与 MPN Alias 分开）：**

| 作用域 | 当前映射唯一键（`is_current = true`） |
|---|---|
| `GLOBAL` | `UNIQUE (alias_norm) WHERE scope='GLOBAL' AND is_current` |
| `TENANT` | `UNIQUE (tenant_id, alias_norm) WHERE scope='TENANT' AND is_current` |

**时间语义与区间互斥（R2.2.1 / R2.2.2）：**

1. 时间统一使用 UTC `timestamptz`；区间半开 `[valid_from, valid_to)`，`valid_to IS NULL` 表示开放至今。
2. 当前映射一致性：`CHECK ((is_current AND valid_to IS NULL) OR (NOT is_current AND valid_to IS NOT NULL))`；首期**禁止未来生效行**（`valid_from <= now()`）。
3. **任意两行同一唯一键的区间不得重叠**（无论目标是否相同）；唯一例外是首尾相接（`old.valid_to = new.valid_from`）。重叠写入一律拒绝，不进入 `PENDING_CONFLICT` 自动裁决，也不允许“重叠后合并”。
4. **数据库实现（非 DDL）**：
   - 当前映射：部分唯一索引 `UNIQUE (alias_norm) WHERE scope='GLOBAL' AND is_current`；`UNIQUE (tenant_id, alias_norm) WHERE scope='TENANT' AND is_current`。
   - 历史互斥：排斥约束 `EXCLUDE USING gist (alias_norm WITH =, tstzrange(valid_from, valid_to, '[)') WITH &&) WHERE scope='GLOBAL'`；TENANT 版本键为 `(tenant_id, alias_norm)`。
   - 职责分工：**部分唯一索引**保证当前映射唯一；**数据库区间排斥约束**保证历史区间不重叠；应用层校验仅作补充，**不得替代**数据库约束。

**并发写入防护（R2.2.2）：**

```text
BEGIN
  -- 第 1 步：唯一键级互斥（必须能锁定“尚不存在”的记录）
  SELECT pg_advisory_xact_lock(<唯一键哈希>);
  -- 注意：SELECT ... FOR UPDATE 返回空结果不等于获得锁，不能用于首次插入
  -- 第 2 步：若已有记录，再锁定相关行
  SELECT ... FROM brand_alias WHERE <唯一键> ORDER BY valid_from FOR UPDATE;
  -- 第 3 步：事务内校验新行 [valid_from, valid_to) 与既有行不重叠
  -- 第 4 步：关闭当前行：valid_to = new.valid_from, is_current = false
  -- 第 5 步：插入新行：is_current = true, valid_to = NULL
  -- 第 6 步：写 audit_log
COMMIT
```

1. **首次插入（空键）**：必须使用唯一键级 advisory transaction lock（`pg_advisory_xact_lock`）或等效的、能锁定尚不存在记录的机制；不得依赖空结果的行锁。
2. **已存在记录**：在唯一键级互斥之后可再锁定记录行；区间校验、关闭旧行、插入新行、写审计必须在同一事务内完成。
3. 隔离级别至少 `READ COMMITTED`；无法满足时使用 `SERIALIZABLE` 并允许重试。
4. 约束冲突（唯一索引/排斥约束）统一映射为 `409 ALIAS_CONFLICT` 或 `PENDING_CONFLICT`，调用方可重试；不得静默覆盖、不得原地改写。
5. 幂等：alias 变更请求必须携带幂等键（如 `(tenant_id, alias_norm, requested_valid_from, idempotency_key)`），重复提交返回首次结果。
6. 时间来源：`valid_from`/`valid_to` 由服务端时钟生成或经审批的生效时间，不接受客户端任意指定历史区间。

**实现说明（非 DDL）：** 部分唯一索引 + 数据库区间排斥约束 + 唯一键级事务锁；应用层校验为补充。本轮不建索引、不迁移。

**数据库约束实现细节（R2.2.3 / A-1）：**

1. **Brand Alias 唯一键（独立于 MPN Alias）**：GLOBAL `UNIQUE (alias_norm) WHERE scope='GLOBAL' AND is_current`；TENANT `UNIQUE (tenant_id, alias_norm) WHERE scope='TENANT' AND is_current`。
2. **GLOBAL 排斥约束（完整键）**：
   `EXCLUDE USING gist (alias_norm WITH =, tstzrange(valid_from, valid_to, '[)') WITH &&) WHERE (scope='GLOBAL')`
3. **TENANT 排斥约束（完整键，必须含 tenant_id）**：
   `EXCLUDE USING gist (tenant_id WITH =, alias_norm WITH =, tstzrange(valid_from, valid_to, '[)') WITH &&) WHERE (scope='TENANT')`
4. **扩展与 operator class**：`tenant_id`/UUID 与 text 的 `=` 在 GiST 中需要 `btree_gist` 扩展；即 `CREATE EXTENSION IF NOT EXISTS btree_gist`，`alias_norm`/`tenant_id` 使用 btree_gist 的相等 operator class。不得只写 `EXCLUDE USING gist` 而不说明扩展。
5. **NULL 上界语义**：`tstzrange(valid_from, valid_to, '[)')` 在 `valid_to IS NULL` 时表示上界无穷（开放至今），与 `is_current=true` 一致；首尾相接按 `old.valid_to = new.valid_from` 判定不重叠；任意其他交叠均视为重叠。
6. **禁止未来生效行**：`valid_from <= now()` 不能写成普通 PostgreSQL `CHECK`（`now()` 非 immutable）。必须由 `BEFORE INSERT/UPDATE` 触发器或事务写入校验执行；违反则拒绝写入。
7. **advisory lock 键**：必须基于完整规范化唯一键（如 scope + tenant_id? + alias_norm 的稳定哈希），不得只用裸 alias 字符串。哈希碰撞只允许造成额外串行（性能影响），不得造成不同键互相覆盖；最终仍由唯一索引/排斥约束兜底。
8. **职责分工**：部分唯一索引 → 当前映射唯一；数据库排斥约束 → 历史区间不重叠；advisory lock → 首次插入/并发切换串行化；应用层 → 业务规则、错误映射、审计与重试。数据库约束是最终防线，应用层不能替代。
9. **一致性**：Brand Alias 与 MPN Alias 使用完全相同的时间语义（UTC、半开区间、无重叠、当且仅当、禁止未来行）与并发语义。

## 7. 数据来源与证据要求

| 来源 | 可信度 | 要求 |
|---|---|---|
| 客户主数据/合同 | 最高 | 客户确认记录 + 版本 |
| Ds Bit 解析的文档 Brand 字段 | 中 | 页码/bbox/raw_text 证据 |
| PDF metadata author | 低 | 仅候选，不单独作为 Brand |
| 旧站 supplier 字段 | 低/不可用 | 不得当作品牌 |
| 人工维护 | 高（有签署） | 维护人/日期/理由 |

每条 Brand 记录必须能追溯到来源；无来源的 Brand 不得标记 `CONFIRMED`。

## 8. 选项与推荐

| 方案 | 优点 | 风险 | 适用 |
|---|---|---|---|
| A. Brand 作为自由文本，不建注册表 | 实现快 | 无法别名/合并/审计；同 MPN 跨品牌误合并 | 仅原型 |
| B. Brand 注册表 + 别名 + 证据（推荐） | 可追溯、可合并、支持冲突裁决 | 需要治理与人工维护 | 正式 Business API |
| C. 直接用 PDF author/manufacturer | 无需额外数据 | 不可靠、可空、非 Brand | 不推荐 |

**推荐 B**，但需负责人确认 Brand 权威来源、别名治理与签署责任。

## 9. 测试要求（详见 07）

- 同 MPN 不同 Brand → 不同产品；
- Brand 别名变化 → 同一 brand_id；
- 未知/缺失 Brand → PENDING_BRAND，不生成正式键；
- Brand 冲突 → 人工裁决，不静默合并；
- 合并/更名 → 旧键保留、可重定向。

## 10. 决策点

- D-01：Brand 权威来源与注册表是否采用；
- D-02：Brand 规范化/别名/合并/更名规则与签署责任；
- D-16：Brand Alias 作用域（GLOBAL/TENANT）与优先级；
- D-17：Brand Alias 冲突/历史名/更名保留策略；
- D-18：Brand Alias 与 MPN Alias 独立注册表。
- 以上均待负责人签署；当前 `PROPOSED_NOT_APPROVED`。