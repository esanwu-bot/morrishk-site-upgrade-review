# MPN Normalization 设计

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-002 |
| 版本 | v2.2-R2.2 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 事实基线 | 当前 `normalized_mpn` 恒等于 `requested_mpn`（`pipeline.py:154-155`）；`normalizer_version` 未实现 |
| 相关决策 | D-03、D-04、D-19、D-20、D-44（见 `08_DECISION_REGISTER.md`） |

## 1. 设计目标

1. 原始 MPN 永不丢失；
2. 规范化可复算、可版本化、可追溯；
3. 处理大小写、空格、连字符、特殊字符、厂商差异；
4. 不假定所有厂商可用同一套简单规则；
5. 为产品身份与全局 ID 提供稳定的 `mpn_norm` 候选键。

## 2. 现状

- `Product` 有 `requested_mpn`/`normalized_mpn`，但流水线把二者赋为同一值。
- `normalized_mpn != requested_mpn` 时才强制 `identity_evidence`；正常流水线不会触发。
- 契约候选要求保留 `mpn_raw`/`mpn_norm`/`normalizer_version`，`pbk1_` 使用 `mpn_norm`。
- 旧站 `PartNumber` 全局唯一但无 Brand；新平台 `mpn_norm` 全局唯一、`brand_id` 只是属性（IQ-01 §2.2–2.3）。这些历史口径不能直接照搬。

## 3. 候选数据模型

```text
mpn_identity
  mpn_raw              original string (never overwritten)
  mpn_norm             normalized candidate key
  normalizer_version   e.g. "MPN-NORM-v1" (PROPOSED)
  normalizer_profile   brand/manufacturer-specific profile id
  brand_norm           required for final key (candidate)
  status               CONFIRMED / PENDING_BRAND / PENDING_VARIANT / PENDING_CONFLICT / INVALID_MPN
  evidence_ref         page/bbox/raw_text or customer record
  confidence           HIGH / MEDIUM / LOW

mpn_profile_registry
  profile_id
  scope                GLOBAL / BRAND / MANUFACTURER [候选]
  applies_to           brand_id/manufacturer or "*"
  version              e.g. MPN-NORM-v1
  status               PROPOSED / APPROVED / RETIRED
  rules_ref / test_vectors_ref
  approved_by / approved_at

mpn_alias
  alias_norm           normalized MPN alias (独立于 brand_alias)
  alias_scope          GLOBAL / TENANT
  tenant_id            nullable（GLOBAL 必须为 NULL；TENANT 必填）
  brand_id             **NOT NULL**（Brand 上下文必填）
  canonical_mpn_norm
  valid_from / valid_to
  normalizer_version
  source / evidence
```

## 4. 规范化分层（候选）

### 4.1 通用层

1. Unicode NFKC；去首尾空白；
2. 统一大小写（建议 upper 或 casefold，需确认）；
3. 合并连续空白；
4. 统一全角/半角；
5. 处理不可见字符（NBSP、零宽字符）；
6. 记录原始值，规范化值单独保存。

### 4.2 厂商/品牌层（不可省略）

- 连字符是否保留（如 `AD-123` vs `AD123`）；
- 空格是否保留（如 `OPA 2277` vs `OPA2277`）；
- 斜杠/点/下划线语义；
- 封装/温度/速度后缀是否属于 MPN；
- 厂商前后缀/系列名是否参与身份；
- 同一厂商不同产品线的特例。

**结论：不能假定一套简单规则适用于所有厂商。** 每个 profile 必须有版本、适用范围、测试向量与负责人。

### 4.3 Profile 适用范围与版本治理

| 项 | 候选规则 |
|---|---|
| 适用范围 | `GLOBAL`（无更具体 profile 时的通用规则）、`BRAND`、`MANUFACTURER`；更具体者优先 |
| 版本 | 每个 profile 独立版本（如 `MPN-NORM-v1`）；规则集与测试向量绑定 |
| 状态 | `PROPOSED` → 负责人/维护人批准 → `APPROVED`；旧版 `RETIRED` 但保留可复算 |
| fallback | 无匹配 profile → 仅当 `GLOBAL` 自身为 `APPROVED` 时使用 GLOBAL fallback，并标记 `LOW_CONFIDENCE`；不得自动 CONFIRMED |
| 升级 | 新版本不得静默覆盖旧 `mpn_norm`；旧值进入 alias/历史，保留可追溯 |
| 审计 | 记录 profile_id/version/规则摘要/输入输出/批准人 |

**没有经批准的 MPN profile/归一化规则时，不得自动确认身份或自动合并产品。**

### 4.4 Brand Alias 与 MPN Alias

- `brand_alias` 与 `mpn_alias` 是**独立注册表**，不得共用命名空间；
- 两者都可有 `GLOBAL`/`TENANT` 作用域；
- MPN alias（如厂商旧型号、替代料）不得自动改变 Brand；Brand alias 也不得改写 MPN；
- 两者冲突均进入人工裁决，不静默覆盖。

### 4.5 R2 Profile 优先级、审批与自动确认

**Profile 选择优先级（候选，唯一顺序）：**

```text
BRAND profile (brand_id 精确匹配)
  > MANUFACTURER profile (manufacturer_id 精确匹配)
  > GLOBAL profile (唯一通用规则)
  > 无匹配 profile -> PENDING（LOW_CONFIDENCE）
```

| 规则 | 要求 |
|---|---|
| 选中条件 | 仅 `status = APPROVED` 且 `effective_from <= now` 的 profile 可被选用 |
| 不可用状态 | `PROPOSED`/`RETIRED`/过期 profile 不参与归一化，不得自动确认 |
| fallback | 仅当 `GLOBAL` profile 自身为 `APPROVED` 时才可作为 fallback；否则 `PENDING_CONFLICT`/`LOW_CONFIDENCE` |
| 自动确认 | **只有 APPROVED profile** 产出的 `mpn_norm` 才可进入 `CONFIRMED`；其余只能进待确认队列 |
| 版本记录 | 每次归一化必须记录 `profile_id`、`profile_version`、`normalizer_version` |
| 版本升级 | 新版本不覆盖旧值；旧 `mpn_norm` 进 alias/历史，重算需审计 |
| 审批材料 | profile 必须绑定测试向量、适用范围、负责人、生效日期；缺一不得 APPROVED |
| 租户维度 | Profile 是规则，不是租户数据；首期不存在租户私有 profile；租户私有 MPN alias 另行处理 |

**强制规则（R2-4）：**

1. 没有 APPROVED profile 时，不得自动拆分/合并产品，不得生成正式 `pbk1_`。
2. 同一 Brand 下多个 APPROVED profile 并存属于治理错误，必须拒绝并报 `PENDING_CONFLICT`；不得“取最新”。
3. Profile 变更影响已确认产品时，必须生成迁移/影响清单并审计，不得静默重算。
4. `mpn_norm` 为空/非法 → `INVALID_MPN`，无论 profile 状态如何都不得确认。

### 4.6 MPN Alias 的 Brand 上下文、唯一约束与有效期（R2.1，R2.2 补强）

**Brand 上下文（强制）：**

1. 每条 MPN Alias 必须归属一个 `brand_id`；`brand_id` **NOT NULL**。
2. 解析顺序：先确定 Brand，再在该 Brand 下查找 alias；**禁止仅凭 MPN 原文跨 Brand 解析**。
3. 同 Alias 在不同 Brand 下可分别存在，互不推断；不得把 Brand A 的 alias 结果用于 Brand B。
4. 无可靠 Brand 时，MPN alias 不得参与自动确认（回到 `PENDING_BRAND`）。

**唯一性范围（当前映射）：**

| 作用域 | 当前映射唯一键（`is_current = true`） | 说明 |
|---|---|---|
| `GLOBAL` | `(brand_id, alias_norm)` 唯一（`WHERE scope='GLOBAL' AND is_current`） | 同一 Brand 的全局别名当前唯一 |
| `TENANT` | `(tenant_id, brand_id, alias_norm)` 唯一（`WHERE scope='TENANT' AND is_current`） | 同一租户、同一 Brand 内当前唯一 |

**一致性约束：**

```text
CHECK (scope = 'GLOBAL' AND tenant_id IS NULL)
   OR (scope = 'TENANT' AND tenant_id IS NOT NULL)
```

**当前映射 vs 历史映射（R2.2-1）：**

1. 唯一约束只作用于 `is_current = true` 的行；同一唯一键同一时刻最多一条当前映射。
2. 历史行（`is_current = false`）可多条保留，不参与唯一冲突，保留 `valid_from`/`valid_to` 与原因。
3. 变更映射时在同一事务内“关闭旧行 + 插入新行”，不得先删后建，也不得原地改写。

**有效期与冲突：**

1. `valid_from` 必填；`valid_to` 可空；区间半开 `[valid_from, valid_to)`，`valid_to > valid_from`。
2. 同一唯一键的有效期不得重叠指向不同 `canonical_mpn_norm`；重叠 → 拒绝或 `PENDING_CONFLICT`。
3. 同作用域、同 Brand、同 Alias 指向多个 canonical MPN → `PENDING_CONFLICT`，不得自动选一。
4. 失效别名可重新分配，但必须新增一行、保留旧行并写审计；不得原地改写。
5. `normalizer_version` 升级不得覆盖旧 alias 行：旧行保留原版本与 `valid_to`，新行记录新版本；历史解析可按旧版本回溯。

**并发写入防护（R2.2-1）：**

- 对同唯一键加行锁（`SELECT ... FOR UPDATE`）或使用 advisory lock / `SERIALIZABLE`，再校验区间不重叠并写入。
- 唯一部分索引保证当前映射唯一；区间排斥约束或事务内校验保证历史区间不重叠。
- 并发冲突时后到事务回滚，返回可重试/`PENDING_CONFLICT`；不得静默覆盖。
- 同一 alias 变更请求带幂等键，重复提交返回同一结果。

**实现说明：** 部分唯一索引 + 区间排斥约束/事务校验；本轮不建索引、不迁移。

## 5. 归一化与证据追溯

- `mpn_raw` 原样保留；`mpn_norm` 由 `(mpn_raw, profile, normalizer_version)` 计算。
- 归一化差异必须可解释：记录规则 ID/版本、输入/输出、证据。
- 若 `mpn_norm` 与 `mpn_raw` 不同，必须保留 `identity_evidence`（页码/bbox/raw_text 或客户记录）。
- 重算版本升级时，旧 `mpn_norm` 进入别名/历史，不静默覆盖。

## 6. 选项与推荐

| 方案 | 优点 | 风险 | 适用 |
|---|---|---|---|
| A. 单一全局简单规则（大写+去空格） | 实现快 | 过度合并/拆分；厂商差异失败 | 原型/临时 |
| B. 通用规则 + 按 Brand/厂商 profile + 版本化（推荐） | 可控、可追溯、可测试 | 需要 profile 治理与数据 | 正式 |
| C. 完全人工归一化 | 准确 | 不可扩展、不可审计 | 小规模兜底 |

**推荐 B**；A 只能作为无 profile 时的 fallback，且必须标记低置信度。

## 7. 冲突与失败处理

| 情况 | 候选处理 |
|---|---|
| 归一后为空 | `INVALID_MPN`；不生成键 |
| 同一 raw 在两个 profile 得到不同 norm | 记录冲突；人工裁决；不静默选一个 |
| 两个 raw 归一为同一 norm 但品牌不同 | 由 Brand 参与身份；同 Brand 下才可能是同一产品 |
| 归一化后同 Brand 多候选 | `PENDING_CONFLICT`；人工合并/拆分 |
| 版本升级导致 norm 变化 | 旧 norm 保留为别名；迁移计划 + 审计 |

## 8. 决策点

- D-03：MPN 规范化是否按 Brand/厂商分 profile、版本治理与责任人；
- D-04：大小写/空格/连字符/后缀的默认规则，以及需要人工裁决的例外；
- D-19：MPN Profile 适用范围/fallback/版本治理；
- D-20：低置信度 MPN 是否允许正式确认（建议：不允许，需人工/补充证据）。
- 当前 `PROPOSED_NOT_APPROVED`；不得把 `MPN-NORM-v1` 当成已冻结规则。

## 8.1 无 Profile/低置信度的强制规则

1. 无匹配 profile → 仅当 `GLOBAL` 为 `APPROVED` 时使用 fallback + `LOW_CONFIDENCE`，不得 CONFIRMED；
2. 低置信度 MPN 不得自动合并/拆分产品；
3. 只有经批准的 profile + 足够证据才能进入 CONFIRMED；
4. 负责人可裁定是否允许特定低置信度场景例外，并留下签署记录。

## 9. 测试要求（详见 07）

- 大小写/空格/连字符/全半角差异；
- 同一 Brand 下格式冲突；
- 不同 Brand 同 MPN 不合并；
- 归一化为空/非法字符；
- normalizer_version 升级后的可复算与旧键兼容；
- 原始值/证据始终可追溯。