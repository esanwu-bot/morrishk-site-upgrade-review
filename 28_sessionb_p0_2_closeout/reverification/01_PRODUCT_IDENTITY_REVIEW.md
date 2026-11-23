# 检查 1：产品身份复验

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-P02-REVERIFY-001 |
| 基线 | `feat/gate6a-audit` / `600439a5eee69fb3a1cec2715e37080e48ca9840`（干净工作区） |
| 方法 | 只读代码审查 + 83 项定向测试 + 两次真实解析（同一 MPN、不同 PDF） |
| 结论 | **FAIL** |

## 1. PASS/FAIL 判定

**FAIL。** 当前权威代码的产品身份是“单次文档解析内的产品”，不是 Business API 所需的跨文档产品身份；缺少 Brand，且 `product_id` 直接由 `document_id` 派生。

P0-2 该检查的通过标准（本报告采用）：

1. 存在单一、可追溯的产品身份权威定义；
2. 与契约候选的身份键 `(mpn_norm, brand_norm)` 不冲突；
3. 身份信息贯穿解析、存储与 B2B 使用路径；
4. 无静态数据/测试桩/硬编码造成的假通过。

当前 1–3 不满足；第 4 项不是主因，但测试也未覆盖 Brand/全局身份。

## 2. 实际代码证据

### 2.1 Product 模型

`src/icpdf/domain/product.py:37-54`：

```text
37  class Product(BaseModel):
38      """A product instance inside one document."""
...
46      product_id: NonEmptyStr
47      document_id: NonEmptyStr
48      requested_mpn: NonEmptyStr
49      normalized_mpn: NonEmptyStr
50      identity_scope: IdentityScope = IdentityScope.UNKNOWN
51      product_type: ProductType = ProductType.UNKNOWN
52      manufacturer: str | None = None
53      package: str | None = None
54      identity_evidence: list[IdentityEvidence] = Field(default_factory=list)
```

- **没有 `brand`、`supplier`、`product_business_key`/`pbk1_` 字段。**
- 代码中也没有 organization/supplier 模型或关系表；只有可空 `manufacturer` 字符串。
- `manufacturer` 仅是可空字符串，不是 Brand 身份键。
- `identity_scope` 默认 `UNKNOWN`；代码中流水线固定写 `"unknown"`。

### 2.2 流水线赋值

`src/icpdf/parser/pipeline.py:151-159`：

```text
151  product = Product(
152      product_id=f"prod-{document.document_id}",
153      document_id=document.document_id,
154      requested_mpn=requested_mpn,
155      normalized_mpn=requested_mpn,
156      identity_scope="unknown",
157      product_type="unknown",
158  )
```

- `product_id` = `prod-{document_id}`，随文档变化。
- `normalized_mpn` 恒等于 `requested_mpn`；因此 `Product._check_product` 的“二者不同才要求 identity_evidence”分支在正常流水线中不会触发。
- `identity_scope` 固定 `unknown`。

### 2.3 文档 ID 与 manufacturer

`src/icpdf/parser/pdf_loader.py:58-67`：

```text
58  document = Document(
59      document_id=document_id or f"doc-{sha[:12]}",
...
63      manufacturer=doc.metadata.get("author") or None,
64      document_title=doc.metadata.get("title") or None,
...
```

- `document_id` 由 PDF SHA-256 前 12 位派生。
- `manufacturer` 来自 PDF 元数据 `author`，不是可靠的 Brand 来源；样例解析中为 `null`。

### 2.4 全文检索

`grep -rn "brand\|supplier\|product_business_key\|pbk1" src --include="*.py"` → **无命中**（见 `evidence/03_product_identity_evidence.txt`）。

## 3. 实际运行证据

### 3.1 同一 MPN、不同 PDF 的两次真实解析

命令：使用 `tests.fixtures.synthetic` 生成两个不同 PDF，均以 `requested_mpn="SAME-MPN"` 调用 `parse_pdf`（临时目录，未修改仓库）。

结果（完整见 `evidence/sample_parse_summary.json`）：

| 样本 | document_id | product_id | requested/normalized | identity_scope | manufacturer |
|---|---|---|---|---|---|
| A | `doc-f39845a452d2` | `prod-doc-f39845a452d2` | `SAME-MPN` / `SAME-MPN` | `unknown` | `null` |
| B | `doc-7baea8f1117d` | `prod-doc-7baea8f1117d` | `SAME-MPN` / `SAME-MPN` | `unknown` | `null` |

- 同一 MPN 在不同文档得到不同 `product_id`；不存在跨文档产品合并/身份键。
- `manufacturer` 为空，无法作为 Brand。
- 身份证据 `identity_evidence` 在正常流水线为空（因为 requested==normalized）。

### 3.2 测试

- `tests/unit/test_domain_contract.py:78-95` 只验证 requested/normalized 不互相覆盖、normalized 不同时强制 identity_evidence；**不验证 Brand 或全局产品身份**。
- `tests/integration/test_phase1_pdf.py:110-115` 的 `test_multi_mpn_document_parses_without_merging_identity` 只断言 `requested_mpn == normalized_mpn == "MPN-A"`。
- 83 项定向测试全部通过（`evidence/02_targeted_pytest.txt`，exit 0），但这些测试不覆盖 Business API 身份要求。

## 4. 身份关系与冲突

| 身份来源 | 当前含义 | 冲突/缺口 |
|---|---|---|
| `document_id` | PDF SHA-256 前 12 位；`doc-…` | 文档身份，不是产品身份 |
| `product_id` | `prod-{document_id}` | 随文档变化；同一产品多文档会分裂 |
| `requested_mpn` | 调用方输入 | 不是文档识别结果 |
| `normalized_mpn` | 当前恒等于 requested | 未实现真正的归一化/品牌校验 |
| `manufacturer` | PDF 元数据 author，可空 | 不是 Brand；样例为空 |
| `identity_scope` | 固定 `unknown` | 未表达 device/board/onboard |
| `identity_evidence` | 仅当 requested≠normalized 才强制 | 正常流水线为空 |

**不存在单一权威产品身份**；存在文档身份、product_id、MPN 输入、manufacturer 多条来源，且没有 Brand。

## 5. 是否贯穿解析、存储、B2B

- **解析**：`Product` 仅写入 `product.json`；解析产物以文档为中心。
- **存储**：DuckDB lake 只有 `raw_docs`/`parse_runs`/`eval_results` 三表（`lake/_build_lake.py:365-400`），无产品主表、无 Brand、无全局产品键。
- **B2B**：权威提交中没有 B2B 服务（见检查 4）；`workbench` 是 Parser Lab，使用 `requested_mpn`，不是产品身份 API。
- 结论：产品身份**没有**贯穿到存储与 B2B 路径。

## 6. 是否存在静态/测试桩假通过

- 产品身份不是由静态 JSON 冒充；`Product` 由真实解析流水线生成。
- 但测试只覆盖文档内身份，不覆盖 Brand/全局身份；不存在能证明 Business API 身份的测试。
- 因此不是“测试桩假通过”，而是**权威身份模型与 Business API 要求不一致**。

## 7. 需要的修复（本轮不执行）

1. 在 Product/存储层引入 Brand（以及必要的 supplier/organization 关系），定义 `(mpn_norm, brand_norm)` 权威身份键；保留 raw MPN/Brand 与 normalizer_version。
2. 明确同一产品多文档/多版本的合并规则；`product_id` 不得继续等同于 `prod-{document_id}`。
3. 把身份贯穿 `product.json`、lake/Repository、Business API DTO 与 75 项矩阵。
4. 增加 Brand/跨文档身份测试；禁止仅用 requested==normalized 作为通过证据。

## 8. P0-2 对应关系

- 对应 `12_/README.md` §2.1 第 1 项“产品身份模型”。
- 当前结论 **FAIL**；按本轮规则，P0-2 不能提交关闭申请。
- 本检查未修改任何 Ds Bit 代码；修复需另行授权。