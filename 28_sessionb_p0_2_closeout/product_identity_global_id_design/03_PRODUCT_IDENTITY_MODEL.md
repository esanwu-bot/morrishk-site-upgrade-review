# Product Identity Model 设计

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-003 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 事实基线 | 当前 `product_id=prod-{document_id}`；`document_id=doc-{sha[:12]}`；`run_id` 执行级 |
| 相关决策 | D-04、D-05、D-06（见 `08_DECISION_REGISTER.md`） |

## 1. 三个实体必须分开

| 实体 | 含义 | 当前实现 | 目标语义（候选） |
|---|---|---|---|
| **Product** | 跨文档的商业/技术产品 | `product_id=prod-{document_id}`（文档实例） | 全局 `product_uid`；自然键候选 `(brand_id, mpn_norm, variant_key?)` |
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

### 3.1 变体/封装的建议边界

- 若变体有独立 MPN/订购号、可单独采购 → 倾向独立产品；
- 若只是包装/温度/速度选项、无独立商业身份 → 作为 Product 属性/版本；
- 最终由负责人按业务定义裁定，不能由 Agent 决定。

## 4. 产品身份状态机（候选）

```text
INVALID_MPN
PENDING_BRAND
PENDING_CONFLICT
CONFIRMED
MERGED (alias to another product)
SPLIT (lineage)
RETIRED
```

- 只有 `CONFIRMED` 可生成正式产品身份/`pbk1_`。
- `PENDING_*` 进入人工/客户确认队列。
- `MERGED`/`SPLIT` 不删除旧 ID，保留别名/谱系。

## 5. 选项与推荐

| 方案 | 优点 | 风险 | 适用 |
|---|---|---|---|
| A. 继续 `product_id=prod-doc` | 无迁移 | 不是产品身份；同产品多文档分裂 | 仅解析内部 |
| B. 仅 `(mpn_norm, brand_norm)` 自然键 | 简单、可复算 | 变体/封装/更名/合并/拆分无法表达；Brand 变化导致键漂移 | 过渡候选 |
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
- D-06：合并/拆分/冲突裁决与审计。
- 当前 `PROPOSED_NOT_APPROVED`；不得把模型写成已批准实现。

## 8. 测试要求（详见 07）

覆盖 §3 的 8 个场景 + 合并/拆分/并发/历史 ID 兼容；每个向量写明输入、预期关系、预期 ID 行为、失败条件。