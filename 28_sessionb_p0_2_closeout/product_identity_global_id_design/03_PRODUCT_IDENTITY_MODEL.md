# Product Identity Model 设计

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-003 |
| 版本 | v2.6-R2.2.7 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 事实基线 | 当前 `product_id=prod-{document_id}`；`document_id=doc-{sha[:12]}`；`run_id` 执行级 |
| 相关决策 | D-04、D-05、D-06、D-21、D-22、D-23、D-41、D-42（见 `08_DECISION_REGISTER.md`） |

## 1. 三个实体必须分开

| 实体 | 含义 | 当前实现 | 目标语义（候选） |
|---|---|---|---|
| **Product** | 跨文档的商业/技术产品 | `product_id=prod-{document_id}`（文档实例） | 全局 `product_uid`；自然键候选 `(brand_id, mpn_norm, variant_state, variant_key)` |
| **Document** | 一份 PDF 工件 | `document_id=doc-{sha[:12]}` | 不变；继续作为工件身份 |
| **Run** | 一次解析执行 | `run_id` 时间+随机 | 不变；继续作为执行身份 |

> 产品 ≠ 文档 ≠ 运行。当前 `product_id` 实际是“文档内产品实例”，不是产品主键。

## 2. 关系模型（候选）

```text
brand 1 ── * product
product 1 ── * product_document ── 1 document
document 1 ── * run
product 1 ── * product_version (可选)
product 1 ── * product_alias
product 1 ── 0..1 product_merge/split lineage
```

- `product_document`：产品与文档的多对多关联（同一产品多份 PDF；一份文档可能含多个产品）。
- `product_version`：若“数据手册版本”需要独立身份，记录版本/日期/状态；否则作为文档属性。
- `product_alias`：旧 ID/旧键/旧品牌名/旧 MPN 的兼容映射。
- `product_merge/split`：合并/拆分谱系与审计。

## 3. 关键场景（必须逐项裁定）

| # | 场景 | 候选身份关系 | 需要决定 |
|---|---|---|---|
| 1 | 同 MPN、不同 Brand | **不同产品**（Brand 参与键） | Brand 缺失/冲突如何处理 |
| 2 | 同 Brand、不同 MPN | **不同产品** | MPN 归一化规则 |
| 3 | 同产品不同封装/变体 | 候选：独立产品（若商业上可单独采购/销售）或同产品下的 variant 属性 | 变体是否进入自然键 |
| 4 | 同产品不同数据手册版本 | **同一产品**，多份文档/版本 | 版本是否单独暴露/排序 |
| 5 | 多份 PDF 对应同一产品 | **同一产品**，多文档关联 | 合并阈值/人工裁决 |
| 6 | 同一 PDF 多次导入 | **同一文档**，多次 run；产品不变 | 幂等键与重复导入处理 |
| 7 | 产品/Document/Run | 三层分离 | 旧 `product_id` 兼容 |
| 8 | 同 MPN 跨品牌但 Brand 未知 | `PENDING_BRAND` | 不自动合并 |

### 3.1 变体状态（R2-3：禁止 NULL 业务语义）

`variant_state` 是**非空枚举**，不是可空布尔/字符串：

| `variant_state` | 含义 | 是否进入自然键 | 是否可 CONFIRMED | 存储规则 |
|---|---|---|---|---|
| `UNKNOWN` | 尚未判定是否存在变体/封装差异 | 否 | 否（`PENDING_VARIANT`） | 只存在于待确认队列；不生成 `product_uid`/`pbk1_` |
| `NOT_APPLICABLE` | 已明确判定该身份没有变体维度 | 是（使用保留哨兵 `__NO_VARIANT__`） | 是 | `variant_key` 必须为 `__NO_VARIANT__`，**不得为 NULL** |
| `KNOWN` | 已明确变体值 | 是（`variant_key` 非空） | 是 | `variant_key` 必须非空且通过规范化；不得为空串 |

**强制规则：**

1. 正式自然键 = `(brand_id, mpn_norm, variant_state, variant_key)`；四个分量均不得为 NULL。
2. `UNKNOWN` 不是“空变体”，不得映射为 `NULL` 或空串后进入唯一约束。
3. `NOT_APPLICABLE` 是**显式业务裁定**，必须有裁定人/时间/依据；不能由缺省值推断。
4. `KNOWN` 的 `variant_key` 必须由已签署的变体定义规范化；未签署时只能 `UNKNOWN`。
5. 同一身份从 `UNKNOWN` 裁决为 `NOT_APPLICABLE`/`KNOWN` 时，必须写审计并迁移待确认记录，不得原地改键静默生效。
6. 若变体有独立 MPN/订购号、可单独采购 → 倾向独立 `product_uid`；否则作为 `KNOWN` 变体属性。最终由 D-04 签署。

### 3.2 变体/封装的建议边界

- 若变体有独立 MPN/订购号、可单独采购 → 倾向独立产品；
- 若只是包装/温度/速度选项、无独立商业身份 → 作为 Product 属性/版本；
- 最终由负责人按业务定义裁定，不能由 Agent 决定。
- **在 D-04 未签署前，任何 variant_key 均为未裁定；不得以 nullable 省略并进入 CONFIRMED。**

## 4. 产品身份状态机（候选）

```text
INVALID_MPN
PENDING_BRAND
PENDING_VARIANT
PENDING_CONFLICT
CONFIRMED
MERGED (alias to another product)
SPLIT (lineage)
RETIRED
```

- 只有 `CONFIRMED` 可生成正式产品身份/`pbk1_`。
- `PENDING_*` 进入人工/客户确认队列。
- `MERGED`/`SPLIT` 不删除旧 ID，保留别名/谱系。

### 4.1 正式唯一约束与状态规则（R2 收敛）

| # | 规则 | 说明 |
|---|---|---|
| 1 | 正式自然键唯一约束只适用于 `CONFIRMED` 且 `lifecycle_state = ACTIVE` | 建议部分唯一索引；`PENDING_*`、`MERGED`、`SPLIT`、`RETIRED` 不占用活跃唯一键 |
| 2 | 唯一键四分量非空 | `(brand_id, mpn_norm, variant_state, variant_key)`；`NOT_APPLICABLE` 使用 `__NO_VARIANT__`，禁止 NULL |
| 3 | `PENDING_BRAND` 不进入 `global_product` | 进入待确认队列；不生成 `product_uid`/`pbk1_`，不占正式键 |
| 4 | `PENDING_VARIANT` 不进入 `global_product` | 变体未裁定；不得以 nullable/空串绕过 |
| 5 | `PENDING_CONFLICT` 不进入 `global_product` | 冲突记录单独保存；未裁决不得创建/占用 CONFIRMED 键 |
| 6 | `variant_state = UNKNOWN` 禁止 CONFIRMED | 必须显式裁决为 `KNOWN` 或 `NOT_APPLICABLE` |
| 7 | 合并时旧自然键 | 旧键转 `product_alias`/lineage，重定向到目标 `product_uid`；不删除、不复用 |
| 8 | 拆分时新自然键 | 为新拆分产品生成新键/新 `product_uid`；旧键标记 SPLIT/alias，保留谱系 |
| 9 | normalizer_version 升级 | 旧 `mpn_norm` 保留为 alias/历史键；新键重算并审计；不得静默重写 |
| 10 | 并发导入 | 部分唯一索引 + 单事务 + 幂等键；冲突返回 `PENDING_CONFLICT`/可重试，不创建重复 |
| 11 | 事务边界 | Brand 解析、MPN 归一、匹配/创建、文档关联、import_event、audit_log 必须同一事务提交或回滚 |
| 12 | 全局裁决事务 | 全局裁决在一个事务内：创建/更新 `global_product`、迁移待确认记录、写 alias、写 `global_adjudication` 与 `audit_log`；中途失败整体回滚 |

### 4.2 待确认与冲突模型（R2-2）

```text
identity_pending
  pending_id           独立命名空间，不是 product_uid
  tenant_id            首期为 Morrishk
  site_id              来源 Site
  brand_raw / brand_norm
  mpn_raw / mpn_norm
  variant_state / variant_raw
  reason               PENDING_BRAND / PENDING_VARIANT / PENDING_CONFLICT / PENDING_NEW_IDENTITY
  status               OPEN / ADJUDICATED / REJECTED
  created_by_import_event_id  FK -> product_import_event（nullable；请求幂等由 event 负责）
  evidence_ref
  created_at / updated_at

identity_conflict
  conflict_id
  pending_id
  candidate_set        候选 natural key / brand_id / mpn_norm
  conflict_type        MULTI_BRAND / MULTI_MPN / ALIAS_CONFLICT / VARIANT_CONFLICT
  status               OPEN / RESOLVED / REJECTED
  resolution_ref
```

- **请求幂等性权威是 `product_import_event`**：`UNIQUE (tenant_id, site_id, idempotency_key)`；`identity_pending`/`identity_conflict` 不重复承担幂等键，只通过 `created_by_import_event_id` 关联权威请求结果。

- `identity_pending`/`identity_conflict` **不得**使用 `product_uid` 或 `pbk1_` 作为主键。
- `PENDING_*` 可关联 `tenant_document`，但不得因此获得全局产品身份。
- 只有 **Global Identity Adjudication** 通过后才可写入 `global_product`（仅 CONFIRMED）；待确认记录标记 `ADJUDICATED`，写 alias/lineage 与 `audit_log`；不物理删除原记录。
- Tenant Assertion（客户确认）**不得直接写入或修改** `global_product`；只能作为全局裁决的证据/输入（见 §4.4）。
- 冲突裁决必须记录：决策人、时间、证据、影响范围、是否跨租户（首期必为否）。

### 4.3 并发与 normalizer 版本（R2-3）

| 场景 | 规则 |
|---|---|
| 两个请求同时创建同一 CONFIRMED 自然键 | 部分唯一索引保证仅一条成功；失败方重新读取并返回 MATCHED/CONFLICT |
| 同一幂等键重复提交 | 返回首次结果；不得二次创建 pending/global_product |
| 归一化版本升级导致 norm 变化 | 旧 norm 保留为 alias；新 norm 重新匹配；若与新键冲突则 `PENDING_CONFLICT` |
| 版本回退 | 不删除新版本结果；通过 alias/lineage 记录，必要时人工重映射 |
| 合并/拆分并发 | 对涉及 `product_uid` 加行锁/乐观版本；谱系事件与别名同事务 |

> 以上为候选规则，需 D-04/D-05/D-06/D-10/D-21/D-22/D-23 签署；不是已实现 DDL。

### 4.4 Tenant Assertion 与 Global Identity Adjudication（R2.1，R2.2 补强）

这是两个独立层次，**不得共用同一个 CONFIRMED 状态**：

| 层 | 主体 | 作用范围 | 允许动作 | 禁止动作 |
|---|---|---|---|---|
| **Tenant Assertion** | Morrishk（或未来租户）授权用户 | 仅本租户 | 对自己上传资料、产品归属、Brand/MPN 提出确认或修正；附证据 | 直接写/改 `global_product`；代表其他租户；替代全局审核 |
| **Global Identity Adjudication** | Ds Bit 全局治理角色 | 全局 | 审核 pending/conflict/assertion；批准后写 `global_product` | 覆盖/删除客户原始 assertion 记录 |

**四角色审批链（R2.2-3）：**

| 角色 | 建议权限 | 职责 | 边界 |
|---|---|---|---|
| 提交者 Submitter | `tenant.editor` | 提交 Tenant Assertion（附证据） | 不得自我审批 |
| Tenant 审批者 | `tenant.admin` | 审批本租户断言；通过后状态 `TENANT_APPROVED` 才可进入全局 | 不得写入 `global_product` |
| Global 决策者 | `identity.admin` | 审核并给出裁决（`PROPOSED`） | 不得自我批准 |
| Global 审批者 | `identity.approver` | 复核并批准/驳回裁决 | 必须与决策者不同人 |

- 审批链顺序：提交者 → Tenant 审批者 → Global 决策者 → Global 审批者；任一步未完成，不得更新 `global_product`。
- 同一自然人不得同时承担相邻两个审批角色（提交/审批、决策/批准分离）；审计记录须记录四个角色。

**可信身份与分离约束（R2.2.1 / R2.2.2）：**

1. **稳定主体标识**：`client_id + subject` 不足以唯一标识自然人（同一自然人可通过不同 Client 获得不同 subject）。必须使用服务端可信的稳定 `principal_id`（与自然人/服务账号一一对应），四个审批身份字段统一引用 `principal_id`；**不得使用请求体自报的 actor ID**。
2. **身份来源**：四个审批身份必须来自校验后的 token 上下文（`client_id` + `subject` → `client_subject_binding` → `principal_id` + 服务端角色绑定）；每次写入记录 `auth_context_ref` 与角色快照。
3. **数据库 CHECK**：`submitted_by_principal_id <> tenant_approved_by_principal_id`；`decided_by_principal_id <> approved_by_principal_id`；应用层额外禁止同一 principal 跨相邻角色复用。
4. **角色授权来源与互斥**：角色来自 `principal_domain_binding`（单有效域）+ `principal_role` + `role_catalog`（固定角色域）。数据库强制：`UNIQUE (principal_id) WHERE status='ACTIVE'` 保证同一 principal 只有一个有效域；`principal_role.role_domain` 通过复合外键与 binding 域一致。禁止组合：同一 principal 不得同时持有 `{tenant.editor, tenant.admin}` 与 `{identity.admin, identity.approver}`；撤销/换域保留历史（详见 `04` §3.3.3）。
5. **审批状态 CHECK（Global）**：`PROPOSED` → `approved_by_principal_id IS NULL AND approved_at IS NULL`；`APPROVED` → 两者均 NOT NULL；`REJECTED` → 两者均为 NULL；且 `decided_by_principal_id <> approved_by_principal_id`。
6. **审批状态 CHECK（Tenant）**：`SUBMITTED`/`UNDER_REVIEW` → `tenant_approved_by_principal_id` 与 `tenant_approved_at` 均为 NULL；`TENANT_APPROVED`/`ACCEPTED_BY_GLOBAL`/`REJECTED_BY_GLOBAL` → 两者均 NOT NULL；`WITHDRAWN` 保留撤回前值。
7. **两阶段事务边界**：Tenant 审批是前置阶段，完成后**独立提交** `TENANT_APPROVED`；Global 最终阶段在**新事务**内锁定并重新验证 Tenant Assertion 已为 `TENANT_APPROVED`，再在同一事务内完成 Global 裁决批准、`global_product` 创建/更新、alias/lineage 与 GLOBAL audit；任一步失败整体回滚。**不要求** Tenant 审批状态更新与 Global 最终审批在同一个跨阶段事务内完成。
8. **幂等**：同一 `(subject_type, subject_ref, decision_version)` 只允许一次 APPROVED 生效；重复/并发审批返回既有结果，不重复写 `global_product`。
9. **越权路径隔离**：Tenant 侧接口不持有写 `global_product` 的权限；Global 侧接口不复用 Tenant 审批代码路径，避免“确认即全局生效”。

**Tenant Assertion 规则：**

```text
tenant_assertion
  assertion_id
  tenant_id            NOT NULL
  site_id              NOT NULL
  submitted_by_principal_id         提交者 principal
  tenant_approved_by_principal_id   Tenant 审批者 principal（nullable）
  tenant_approved_at                nullable
  assertion_type       BRAND_CONFIRM / MPN_CONFIRM / PRODUCT_OWNERSHIP /
                       PRODUCT_CORRECTION / DOCUMENT_ATTRIBUTION
  target_ref           文档/待确认记录/产品候选
  asserted_values      结构化确认内容
  evidence_ref         必须可追溯
  status               SUBMITTED / UNDER_REVIEW / TENANT_APPROVED /
                       ACCEPTED_BY_GLOBAL / REJECTED_BY_GLOBAL / WITHDRAWN
  created_at / updated_at
  global_decision_ref  nullable
  -- CHECK：status IN ('SUBMITTED','UNDER_REVIEW') -> tenant_approved_by_principal_id IS NULL AND tenant_approved_at IS NULL
  -- CHECK：status IN ('TENANT_APPROVED','ACCEPTED_BY_GLOBAL','REJECTED_BY_GLOBAL') -> 两者均 NOT NULL
  -- CHECK：submitted_by_principal_id <> tenant_approved_by_principal_id
```

1. 仅在 `tenant_id` 范围内生效；不得改变其他租户的可见性/映射。
2. 必须保存 `tenant_id`、`site_id`、提交者、Tenant 审批者、evidence、时间、状态。
3. 只有 `TENANT_APPROVED` 及之后的状态才允许进入全局裁决流程；`SUBMITTED`/`UNDER_REVIEW` 不触发全局写入。
4. `ACCEPTED_BY_GLOBAL` 只表示全局已采纳，不等于 `global_product` 的 CONFIRMED 本身；写入全局身份仍由 `global_adjudication` 经决策+批准后完成并留独立记录。
5. 提交/审批/撤回均写租户审计；不得物理删除历史。
6. 客户断言与全局裁决分别留存；全局拒绝或修改客户断言时，**不得覆盖**客户原始记录，只追加裁决引用。

**Global Adjudication 规则：**

```text
global_adjudication
  adjudication_id
  subject_type         PENDING / CONFLICT / TENANT_ASSERTION
  subject_ref
  decision             CONFIRM / REJECT / MERGE / SPLIT / REASSIGN
  rationale
  decided_by_principal_id    Global 决策者 principal
  approved_by_principal_id   Global 审批者 principal（必须与决策者不同）
  decision_status      PROPOSED / APPROVED / REJECTED
  decided_at
  approved_at          nullable
  audit_ref
  -- CHECK：decision_status='PROPOSED' -> approved_by_principal_id IS NULL AND approved_at IS NULL
  -- CHECK：decision_status='APPROVED' -> 两者均 NOT NULL
  -- CHECK：decision_status='REJECTED' -> 两者均为 NULL
  -- CHECK：decided_by_principal_id <> approved_by_principal_id
```

1. 只有全局治理角色可执行；决策与批准必须由不同 principal 完成。
2. **只有 `decision_status = APPROVED` 时才允许创建/更新 `global_product`**；`PROPOSED`/`REJECTED` 不得写 `global_product`。
3. Global 最终阶段必须在新事务内锁定并**重新验证**关联 Tenant Assertion 为 `TENANT_APPROVED`；未满足则拒绝，不得以历史状态或缓存放行。
4. 通过后在同一事务内完成：裁决 `APPROVED`、回写 pending/assertion、`global_product` 创建/更新、alias/lineage、GLOBAL audit；任一步失败整体回滚。
5. 拒绝时只更新裁决记录与状态，不删除客户 assertion / pending / 证据。
6. 全局事件写 `audit_log(scope='GLOBAL')`；`tenant_id`/`site_id` 均必须为 NULL（不得伪造；详见 `06` §8.2/§8.12）。
7. **普通导入/重解析/批量/后台/管理员路径**遇到无匹配产品时只能创建 `identity_pending`；不得直接创建 `global_product`。
8. 已存在 CONFIRMED 产品的匹配只做关联复用；新产品身份必须经 Tenant 审批 + Global 决策 + Global 批准后正式注册。

**首期 Morrishk 边界：**

- Morrishk **可以**提交 Tenant Assertion（`tenant.editor` 提交、`tenant.admin` 审批），但**不能**执行 Global Adjudication。
- 首期 Global Adjudication 由 Ds Bit 侧 `identity.admin`（决策）与 `identity.approver`（批准）承担；Morrishk 不得持有这两个角色。
- Tenant Assertion 不自动提升为 CONFIRMED；无 Tenant 审批或无全局审批时分别停留在 `UNDER_REVIEW` / `PROPOSED`。

## 5. 选项与推荐

| 方案 | 优点 | 风险 | 适用 |
|---|---|---|---|
| A. 继续 `product_id=prod-doc` | 无迁移 | 不是产品身份；同产品多文档分裂 | 仅解析内部 |
| B. 仅 `(brand_id, mpn_norm, variant_state, variant_key)` 自然键 | 简单、可复算 | 更名/合并/拆分仍无法表达；必须保证四分量非空 | 过渡候选 |
| C. `product_uid` surrogate + 自然键/别名（推荐） | 稳定、可合并/拆分、可审计 | 需要注册表/DB/治理 | 正式 Business API |
| D. 内容哈希（canonical identity）作主键 | 可复算 | 任何字段变化即新 ID；合并困难 | 不推荐作主键 |

**推荐 C**，B 作为自然键候选，不作为永久唯一主键；A 仅保留为文档实例 ID。

## 6. 与文档/运行的关系

- 文档身份继续用 SHA-256；不得把文件名当身份（D03）。
- 运行身份继续用 `run_id`；不得把 run_id 当产品身份。
- 同一 PDF 重复导入：应复用 document_id；是否复用 product_uid 取决于身份解析，不取决于 run。
- 同一产品多 PDF：product_uid 相同，product_document 多条。
- 同一 PDF 含多个产品：product_document 多条，需产品切分证据。

## 7. 决策点

- D-04：变体/封装/多版本是否进入自然键；
- D-05：全局 ID 方案与产品/文档/运行模型；
- D-06：合并/拆分/冲突裁决与审计；
- D-21：正式唯一约束的状态范围（仅 CONFIRMED）；
- D-22：PENDING_BRAND/PENDING_VARIANT/PENDING_CONFLICT 的待确认队列与键隔离；
- D-23：合并/拆分/normalizer 升级的历史键保留策略；
- D-41：Tenant Assertion 模型与首期 Morrishk 可提交范围；
- D-42：Global Identity Adjudication 角色、执行/批准分离与首期承担方。
- 当前 `PROPOSED_NOT_APPROVED`；不得把模型写成已批准实现。

## 8. 测试要求（详见 07）

覆盖 §3 的 8 个场景 + 合并/拆分/并发/历史 ID 兼容；每个向量写明输入、预期关系、预期 ID 行为、失败条件。