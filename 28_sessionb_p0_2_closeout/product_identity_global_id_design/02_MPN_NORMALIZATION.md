# MPN Normalization 设计

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-002 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 事实基线 | 当前 `normalized_mpn` 恒等于 `requested_mpn`（`pipeline.py:154-155`）；`normalizer_version` 未实现 |
| 相关决策 | D-03、D-04（见 `08_DECISION_REGISTER.md`） |

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
  status               CONFIRMED / PENDING_BRAND / PENDING_CONFLICT / INVALID_MPN
  evidence_ref         page/bbox/raw_text or customer record
  confidence           HIGH / MEDIUM / LOW
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
- D-04：大小写/空格/连字符/后缀的默认规则，以及需要人工裁决的例外。
- 当前 `PROPOSED_NOT_APPROVED`；不得把 `MPN-NORM-v1` 当成已冻结规则。

## 9. 测试要求（详见 07）

- 大小写/空格/连字符/全半角差异；
- 同一 Brand 下格式冲突；
- 不同 Brand 同 MPN 不合并；
- 归一化为空/非法字符；
- normalizer_version 升级后的可复算与旧键兼容；
- 原始值/证据始终可追溯。