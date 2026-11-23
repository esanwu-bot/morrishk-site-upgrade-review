# Global ID Registry 设计

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-004 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 事实基线 | 无全局产品 ID/注册表；`product_id=prod-doc`；lake 仅 3 表 |
| 相关决策 | D-05、D-06、D-10（见 `08_DECISION_REGISTER.md`） |

## 1. 目标

1. 生成稳定、唯一的全局产品 ID；
2. 支持幂等导入、重解析、更新、合并、拆分；
3. 冲突检测与人工裁决可审计；
4. 保留变更历史与旧键兼容；
5. 支持并发导入/重复请求；
6. 不把 `(mpn_norm, brand_norm)` 直接认定为永久唯一键。

## 2. 方案比较

| 方案 | ID 形态 | 优点 | 风险/限制 | 迁移成本 |
|---|---|---|---|---|
| A. 自然键 `(mpn_norm, brand_norm)` 直接作主键 | 复合键 / `pbk1_` | 可复算、与候选契约一致 | Brand/MPN 规则变化即键漂移；变体/封装/多版本无法表达；合并/拆分无稳定身份；Brand 缺失无键 | 低（但后期返工高） |
| B. canonical 内容哈希 | `sha256(canonical)` | 可复算、去重 | 任何字段变化生成新 ID；合并/拆分困难；不适合作为长期主键 | 中 |
| C. 注册表签发 surrogate ID + 自然键唯一约束（推荐） | `product_uid`（ULID/UUIDv7） | 稳定；自然键可变；支持别名/合并/拆分/审计；API 友好 | 需要注册表/DB/治理；需迁移旧 ID | 中高 |
| D. 沿用旧站/新平台自增 ID | int/bigint | 与旧系统兼容 | 跨系统/跨库不稳定；不透明；暴露内部 ID | 高 |
| E. 文档内容 ID（现状） | `prod-doc` | 无迁移 | 不是产品身份；同产品多文档分裂 | 无（但不满足目标） |

**推荐 C**：`product_uid` 作为稳定主键；`(brand_id, mpn_norm, variant_key?)` 作为自然键/唯一候选；`pbk1_` 作为自然键编码候选（PROPOSED），不代替 surrogate ID。

## 3. 候选注册表结构

```text
product_registry
  product_uid          surrogate primary key (ULID/UUIDv7) [候选]
  brand_id             FK -> brand_registry
  mpn_norm             normalized MPN
  variant_key          nullable (package/grade/scope) [待裁定]
  natural_key_hash     hash of canonical natural key [候选]
  status               CONFIRMED / PENDING_BRAND / PENDING_CONFLICT / MERGED / SPLIT / RETIRED
  created_at / updated_at
  merged_into          product_uid nullable
  source / evidence_ref
  version              optimistic concurrency

product_alias
  alias_type           OLD_PRODUCT_ID / OLD_PBK / BRAND_ALIAS / MPN_ALIAS / LEGACY_ID
  alias_value           unique per type
  product_uid           FK
  valid_from / valid_to
  reason / audit_ref

product_document
  product_uid           FK
  document_id           FK (doc-sha)
  relation              PRIMARY / SUPPLEMENTARY / VERSION
  evidence_ref

product_lineage
  event_id
  event_type            MERGE / SPLIT / REASSIGN
  from_uid / to_uid
  reason
  actor / approved_by / approved_at
  evidence_ref

product_import_event
  idempotency_key       unique
  document_id / run_id
  requested_by
  result                CREATED / MATCHED / CONFLICT / REJECTED
  product_uid           nullable
  created_at
```

> 表名为候选；不是 DDL，不改数据库。

## 4. 解析/导入工作流（候选）

```text
raw MPN/Brand
  -> Brand resolve (registry/alias)
  -> MPN normalize (profile/version)
  -> natural key candidate
  -> lookup product_registry
     ├─ exact unique match -> reuse product_uid
     ├─ no match -> create product_uid + audit
     ├─ multiple match -> PENDING_CONFLICT + manual adjudication
     └─ brand missing -> PENDING_BRAND (no formal key)
  -> link document/run (product_document)
  -> write import_event (idempotency)
```

## 5. 幂等、重解析、更新

| 场景 | 候选行为 |
|---|---|
| 同一 PDF 重复导入 | 同 document_id；同 product_uid（若身份解析一致）；import_event 幂等键去重 |
| 重解析同一 PDF | 新 run_id；document_id 不变；product_uid 不变（除非身份规则变化，需审计） |
| 更新 Brand/MPN 规则 | 旧 product_uid 保留；自然键变化 → 别名/迁移；不静默重写 |
| 产品更新（属性变化） | 同 product_uid；版本/变更历史记录 |
| 产品合并 | 保留两个 product_uid；`merged_into` + alias；不物理删除 |
| 产品拆分 | 新 product_uid；旧 product_uid 标记 SPLIT/别名；谱系记录 |
| 并发导入 | 唯一约束 + 事务 + 幂等键；冲突返回可重试/人工裁决 |

## 6. 冲突检测与人工裁决

- 自然键唯一约束防重复创建；
- `PENDING_CONFLICT` 场景：同 Brand 下多个 MPN norm、同 MPN 多 Brand 但客户认为同产品、Brand 别名冲突；
- 裁决必须记录：决策人、时间、证据、影响范围；
- 未经签署的自动合并禁止；
- 所有合并/拆分保留双向谱系与可回滚映射。

## 7. 审计与变更历史

- `product_import_event`、`product_lineage`、`product_alias` 构成审计链；
- 每次身份变更记录：旧值/新值/规则版本/操作者/批准者/时间；
- 对外 API 只暴露稳定 `product_uid` 与自然键，不暴露内部自增/DB 主键（若采用）。

## 8. 并发与重复请求

- 幂等键：`(document_sha256, requested_mpn, brand_norm, normalizer_version, operation)` 或客户端请求 ID；
- 唯一约束：自然键候选 + 状态；
- 事务：resolve/match/create/link 原子化；
- 冲突：返回明确错误码（候选 `PENDING_CONFLICT`/`CONFLICTING_IDENTITY`），不静默创建重复产品；
- 重试：幂等键命中返回同一结果。

## 9. 与 `pbk1_` 的关系

- `pbk1_` 是候选自然键编码，可作为 API 外部标识或自然键哈希；
- `product_uid` 是稳定主键；
- 若自然键规则变化，`pbk1_` 可能变化，但 `product_uid` 不变；
- 是否在 API 暴露 `pbk1_`、`product_uid` 或两者，见 `06` 与 D-08；
- `pbk1_` 仍是 PROPOSED，不是已批准主键。

## 10. 决策点

- D-05：全局 ID 方案（推荐 C）；
- D-06：合并/拆分/冲突裁决与审计；
- D-10：幂等/并发/回滚/迁移；
- D-04：变体是否进入自然键。
- 当前 `PROPOSED_NOT_APPROVED`。

## 11. 测试要求（详见 07）

同 MPN 跨 Brand、同 Brand 不同 MPN、多 PDF 同产品、重复导入、重解析、别名、未知 Brand、格式冲突、合并、拆分、并发、历史 ID 兼容、API scope 隔离。