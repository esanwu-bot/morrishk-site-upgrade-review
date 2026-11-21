# REPOSITORY INTERFACE PLAN · Repository 接口计划（隔离，无数据库）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE2-REPO-001 |
| 版本 | v0.1-draft（接口**计划**；不生成 DDL、不连接任何数据库） |
| 形态 | 语言无关契约（实施时按 W-1 Runtime 语言落地，如 TypeScript/Node 或 PHP 接口）+ In-Memory Adapter |
| 硬边界 | 唯一身份 = `(mpn_norm, brand_norm)`（R-ID-01）；`document_id` **不得**成为商品唯一身份（R-ID-02）；`prod-{document_id}` 仅为临时文档流转 token（R-ID-02 CONFIRMED） |

---

## 1. 接口清单（计划签名）

### 1.1 ProductRepository

```text
findByIdentity(mpn_norm, brand_norm)
  → { product: ProductDTO | null, identity_state, reason? }
findByBusinessKey(pbk) → ProductDTO | null        # pbk 仍由 (mpn_norm, brand_norm) 派生，非独立主键
search(criteria: {
  mpn_raw?, brand_raw?,                           # raw 输入；归一由注入的 Normalizer 完成（R-ID-05/06 PROPOSED）
  identity_state?, release_state?,                # 状态过滤（release_state 默认 RELEASED：R-ST-05 PROPOSED，DIFF-MOCK-05 登记）
  updated_since?, taxonomy_id?, category_id?,
  limit=50, cursor?                               # R-PTG-01 PROPOSED（Mock 简化默认 10 不得沿用）
}) → { items, page_meta }
```

- 输出 DTO 字段集 = 契约候选 `Product`；**不包含** `visible_state`（P1-9：仅 /status 派生）与 `platform`（R-PRD-03 Mock-only）。
- 搜索条目形态：**DIFF-CONTRACT-01 未裁** → 接口同时提供 `search()`（扁平行）与 `searchFull()`（完整 DTO）两个方法占位，二者映射待裁定后收敛；映射前互为别名实现。

### 1.2 StatusRepository

```text
getGates(pbk) → { pipeline, content, release, visible_state }
# visible_state 为派生值（R-ST-03 BLOCKED B6）：派生函数按候选 §9.2 实现，但枚举命名统一待裁——
# 输出同时携带 gates 原始态，供 B6 裁定后重算，不落库缓存派生值。
```

### 1.3 VersionRepository / EvidenceRepository / TaxonomyRepository / CategoryRepository / EdgeRepository

```text
listVersions(pbk, limit, cursor) → { items: VersionItem[], page_meta }
listEvidence(pbk, limit, cursor) → { evidence: Evidence, page_meta }
# EvidenceItem 构造全字段（bbox×4/page_number/raw_text≤500）；对外暴露集合 = 全量减去
# BLOCKED_BY_DECISION(B8) 的待裁字段过滤层（过滤层默认全含，标记 pending）。

listTaxonomies(status?) → Taxonomy[]
getTaxonomy(id) → Taxonomy | NotFound | Retired
getTaxonomyVersion(id) → { taxonomy_version, status, etag, last_change_id }
listCategories(taxonomy_id, { mode, updated_since?, status?, limit, cursor }) → { items, page_meta }
getCategory(id) → CategoryDetail | NotFound | NotPublished | Retired
listChildren(id, limit, cursor) / listAncestors(id) / listCategoryProducts(id, limit, cursor)
listChanges(taxonomy_id, since_version?, limit, cursor) → ChangeRecord[]
```

### 1.4 Normalizer 接口（版本化注入，B5 未冻结）

```text
interface MpnNormalizer {
  version(): "MPN-NORM-v1"            # 版本串随实现走；规则集 PROPOSED（R-ID-05），冻结后不得偏离
  normalizeValue(raw) → { ok, reason, value }
  normalizeIdentity({mpn_raw, brand_raw}) → IdentityResult
  normalizeCandidates(list) → AggregatedResult
  businessKey(mpn_norm, brand_norm) → "pbk1_" + sha256(...)   # R-ID-06 PROPOSED；编码变更=不兼容变更
}
```

- 唯一实现点：全系统禁止第二处 MPN 清洗逻辑（IQ-01 裁定 CONFIRMED）。
- 向量化测试证据（B5 关闭条件）：固定输入向量表 + 期望输出，跨版本复算比对——列入 `TEST_AND_ACCEPTANCE_CRITERIA.md` §C。

### 1.5 DuckDB/S3 数据源适配占位（只读引用 `13_`，零实现）

```text
interface ProductSourceAdapter { /* 未来由 DuckDB/S3 流水线供数 */ }
```

- 本阶段**不 import、不连接、不读取** `13_` 任何运行资产；适配边界仅声明：
  - 输入：对象存储 Manifest/Parquet（`13_/PIPELINE_ARTIFACTS.md` 口径，只读引用）；
  - 输出：上述 Repository 的 DTO（映射层独立于流水线，Session A 结构变更时仅改映射层）；
  - 不回写流水线、不触发解析（`ICEX_WORKBENCH_ALLOW_PARSE=0` 同款纪律）。

## 2. 数据来源与状态过滤规则

| 规则 | 计划 | 状态 |
|---|---|---|
| 商品可见性 | Repository 层不内嵌可见性；可见性由 Runtime scope 门禁 + 查询参数共同决定；`release_state` 默认 RELEASED | R-ST-05 PROPOSED；默认值本身为 DIFF-MOCK-05 待决登记 |
| 排序 | 稳定排序键：`updated_at` + `pbk` 次级键（契约未定 sort 白名单，P1-1 PENDING→不实现用户 sort 参数） | P1-1 |
| 分页 | 游标 = base64(内部偏移+种子校验)不透明串；limit 默认 50/最大 200 | R-PTG-01 PROPOSED |
| 证据访问 | evidence_ids ↔ EvidenceRepository 关联；`screenshot_reference` 仅相对路径 | R-EV-01 PROPOSED；B8 暴露待裁 |

## 3. 与 Mock Fixture 的边界

- Repository 接口**不感知** DEMO_FIXTURE：In-Memory Adapter 以 `FIXTURE_DATA_SPEC.md` 的 JSON 作为数据源装载；
- 适配器与数据装载层分离：替换数据源（未来 DuckDB/S3）时仅换 Adapter，不动接口与 Runtime；
- Fixture 一律携带 `fixture:"DEMO_FIXTURE"` 标记与 registry 映射（ULID ↔ 演示语义），正式实现不得复用演示 ID。

## 4. 明确不做

1. 零 SQL / 零 ORM / 零 DDL（IQ-15 未裁）；
2. 零生产连接（无任何主机名/凭据/驱动配置）；
3. 不修改 `13_`；不从 Ds Bit 生产源码读取数据（P0-2 未决，隔离实现不依赖）；
4. 不把 B5/B6/B7/B8 待决语义"顺手定稿"——接口留双分支/占位并登记。
