# Product Identity Model 设计

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-003 |
| 版本 | v2.0-R2 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 事实基线 | 当前 `product_id=prod-{document_id}`；`document_id=doc-{sha[:12]}`；`run_id` 执行级 |
| 相关决策 | D-04、D-05、D-06、D-21、D-22、D-23（见 `08_DECISION_REGISTER.md`） |

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
| 12 | 裁决事务 | 人工裁决在一个事务内：创建/更新 `global_product`、迁移待确认记录、写 alias、写 audit_log；中途失败整体回滚 |

### 4.2 待确认与冲突模型（R2-2）

```text
identity_pending
  pending_id           独立命名空间，不是 product_uid
  tenant_id            首期为 Morrishk
  site_id              来源 Site
  brand_raw / brand_norm
  mpn_raw / mpn_norm
  variant_state / variant_raw
  reason               PENDING_BRAND / PENDING_VARIANT / PENDING_CONFLICT
  status               OPEN / ADJUDICATED / REJECTED
  idempotency_key
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

- `identity_pending`/`identity_conflict` **不得**使用 `product_uid` 或 `pbk1_` 作为主键。
- `PENDING_*` 可关联 `tenant_document`，但不得因此获得全局产品身份。
- 裁决通过后：写入 `global_product`（仅 CONFIRMED），待确认记录标记 `ADJUDICATED`，写 alias/lineage 与 `audit_log`；不物理删除原记录。
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
- D-23：合并/拆分/normalizer 升级的历史键保留策略。
- 当前 `PROPOSED_NOT_APPROVED`；不得把模型写成已批准实现。

## 8. 测试要求（详见 07）

覆盖 §3 的 8 个场景 + 合并/拆分/并发/历史 ID 兼容；每个向量写明输入、预期关系、预期 ID 行为、失败条件。