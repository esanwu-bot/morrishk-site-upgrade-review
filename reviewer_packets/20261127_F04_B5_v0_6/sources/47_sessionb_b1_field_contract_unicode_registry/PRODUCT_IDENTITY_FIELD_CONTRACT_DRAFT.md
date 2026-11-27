# `product_uid` / `product_business_key` 字段契约与兼容性草案

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-PRODUCT-ID-CONTRACT-001 |
| 版本 | v0.1-DRAFT |
| 日期 | 2026-11-26 |
| 状态 | **DRAFT — NOT_APPROVED** |
| 依据 | Owner 双字段模型裁定（2026-11-26）；46_ B5 草案；45_ 技术评审 |
| 基线 | `feat/gate6a-audit@5dcecd21a9bf3f7f7046cc8c769fcfbcd2adf1e5` |

## 1. Owner 已定方向

| 字段 | 定位 | 生成方式 |
|---|---|---|
| `product_uid` | 内部代理键 | **不直接**由 MPN/Brand 计算；由内部生成/分配 |
| `product_business_key` | 业务身份键 | 可信 Brand + 规范化 MPN 确定性生成；候选前缀 `pbk1_` |

## 2. 建议模型（新增，不改现有 Product）

建议新增 `ProductIdentity` 值对象（`src/icpdf/domain/product_identity.py` 候选），**不直接把必填字段塞进现有 `Product`**：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `product_uid` | `str` | 否（当前阶段） | 内部代理键；若需跨 run 稳定，必须由持久化/外部输入提供；当前不生成 |
| `product_business_key` | `str` | 条件必填 | 仅当 Brand 可信且 MPN 有效时生成；`pbk1_<sha256>` 候选 |
| `brand_raw` | `str` | 条件必填 | 显式可信输入的原始 Brand |
| `brand_norm` | `str` | 条件必填 | B5 归一化值 |
| `brand_source` | `str` / enum | 条件必填 | 来源记录（如显式调用方/人工/配置） |
| `brand_trusted` | `bool` | 是 | 可信状态；缺失/不可信 → 不生成 business key |
| `mpn_raw` | `str` | 是 | 请求/输入 MPN 原始值 |
| `mpn_norm` | `str` | 是 | B5 归一化值（**不等于**现有 `normalized_mpn`） |
| `identity_status` | enum | 是 | `CONFIRMED` / `PENDING_BRAND` / `UNRESOLVED` |
| `rule_version` | `str` | 是 | 归一化规则版本（`b5-min-v0.1` 候选） |

### 2.1 与现有 `Product` 的语义区分

| 现有字段 | 现有语义 | 不得混用 |
|---|---|---|
| `Product.product_id` | `prod-{document_id}`，文档内临时 ID | 不是 `product_uid`，也不是 business key |
| `Product.normalized_mpn` | **文档实际支持的 MPN**（`product.py:40-43` 文档字符串） | 不是 B5 归一化值；新增 `mpn_norm` 专用 |
| `Product.manufacturer` | PDF 元数据 author 候选（`pdf_loader.py:63`） | 不是可信 Brand；不得据此生成 business key |

## 3. 生成与校验规则

1. Brand 必须显式传入且 `brand_trusted = true`；缺失/不可信 → `PENDING_BRAND`，不生成 `product_business_key`。
2. MPN 缺失/归一化后为空 → `UNRESOLVED`。
3. `product_business_key` 仅由 `brand_norm + mpn_norm + rule_version` 确定性生成；相同输入相同输出。
4. `product_uid` 不由 MPN/Brand 计算；当前阶段可缺省；若必须稳定，需 Owner 授权持久化/外部输入。
5. 相同 MPN + 不同 Brand → 不同 business key；不得合并。
6. 不得宣称跨进程/跨机器/注册表/持久唯一；只保证确定性映射。

候选公式：

```text
payload  = {"brand_norm": ..., "mpn_norm": ..., "rule_version": "b5-min-v0.1"}
canonical= utf8(json.dumps(payload, sort_keys=True, separators=(",", ":")))
key      = "pbk1_" + sha256(canonical).hexdigest()
```

> 公式待 Owner 冻结；是否纳入 `rule_version`、前缀与 canonical 细节仍需确认。

## 4. 兼容性方案

| 方案 | 内容 | 影响 | 建议 |
|---|---|---|---|
| A | 在现有 `Product` 增加可选字段（`product_uid`/`brand_*` 等） | 现有构造点不破坏；但 Product 语义变宽 | 可选 |
| B | 新增 `ProductIdentity` 值对象；`Product` 不变 | 零破坏；pipeline 暂不接线 | **推荐** |
| C | 在现有 `Product` 增加必填字段 | `pipeline.py:151`、`test_domain_contract.py:79/86/91` 全部破坏；且 pipeline 被快照锁定 | 不建议 |

现有构造点证据：

- `src/icpdf/parser/pipeline.py:151-158`；
- `tests/unit/test_domain_contract.py:79/86/91`；
- `tests/integration/test_phase1_pdf.py:109-116`。

推荐方案 B：新增 `ProductIdentity`，现有 `Product` 与其调用方保持兼容；pipeline 接线待快照授权后另批处理。

## 5. 契约测试草案

| # | 场景 | 预期 |
|---|---|---|
| C1 | 同 Brand/MPN 两次生成 business key | 相同 |
| C2 | 同 MPN、不同 Brand | 不同 |
| C3 | Brand 缺失/不可信 | 无 business key；`PENDING_BRAND` |
| C4 | MPN 缺失/空 | `UNRESOLVED` |
| C5 | `product_uid` 不由 Brand/MPN 计算 | 改变 MPN/Brand 不影响给定 uid |
| C6 | 规则版本不同 | key 不同（若纳入版本）或需迁移说明 |
| C7 | 现有 Product 构造 | 不破坏既有测试 |

## 6. 待 Owner 决定

1. `product_uid` 当前阶段是否允许缺省；若必须稳定，持久化/外部输入方案；
2. Brand 来源/可信状态的表示（enum/字符串/记录结构）；
3. business key 公式、前缀、是否纳入 rule_version；
4. 现有 `normalized_mpn` 是否保留原名，新增 `mpn_norm`；
5. 采用方案 A/B/C；
6. 新增模型路径 `src/icpdf/domain/product_identity.py` 是否确认。

## 7. 非声明

- 本草案不是字段契约批准、不是 P-06 批准；
- 未修改现有 `Product`/pipeline/测试；
- 未创建任何模块文件；未运行测试。