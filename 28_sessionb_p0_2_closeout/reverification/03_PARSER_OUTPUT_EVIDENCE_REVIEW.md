# 检查 3：解析输出及证据复验

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-P02-REVERIFY-003 |
| 基线 | `feat/gate6a-audit` / `600439a5eee69fb3a1cec2715e37080e48ca9840`（干净工作区） |
| 方法 | 代码审查 + 83 项定向测试 + 真实解析产物检查（tables/candidates/manifest） |
| 结论 | **PASS（仅限解析链路与证据模型）**；**不是** Business API DTO 完成 |

## 1. PASS/FAIL 判定

**PASS（解析/证据范围）。** 解析链路是真实的：PDF → 文本块 → 表格/候选 → 边界决策 → 产物；候选/表格包含 `document_id`、`page_number`、`bbox`、`table_id`、`row_id`、`cell_id` 等可定位证据。

同时明确：该 PASS **不表示**：
- 已有 Business API 的 16 操作 DTO；
- 已有 Brand/分类/`product_business_key`；
- 已有 75 项授权或生产可用性。

这些缺口分别计入检查 1（产品身份）、检查 4（B2B）与检查 5（后端）的 FAIL。

## 2. 实际链路证据

### 2.1 代码路径

`src/icpdf/parser/pipeline.py:94-180`：

```text
load_pdf -> copy_source -> extract_text_blocks -> detect_tables_with_evidence
-> build_table / build_candidates -> analyse_document(boundary) -> Product
-> run_manifest -> run.write_json(...)
```

- 输入：真实 PDF（PyMuPDF `fitz`）。
- 输出：`document.json`、`pages/geometry.json`、`text_blocks.json`、`tables.json`、`candidates.json`、`boundary_decisions.json`、`product.json`、`run_config.json`、`run_manifest.json`。
- 来源不是静态 JSON：`tests/fixtures/synthetic.py` 生成 PDF，`parse_pdf` 实际解析。

### 2.2 证据模型

`src/icpdf/domain/evidence.py:20-50`：

```text
Evidence:
  evidence_id, document_sha256, page_number,
  table_id?, row_id?, cell_id?, bbox, raw_text,
  screenshot_reference?, evidence_type
校验：cell_text/table_row 必须提供 table_id/row_id/cell_id
```

`src/icpdf/domain/table.py` 的 Table/Cell 含 `page_number`、`bbox`、`page_end` 等；候选输出含 `document_id/table_id/row_id/cell_id/page_number/bbox/raw_text`。

### 2.3 真实解析产物样例

`evidence/sample_parse_summary.json`（两次不同 PDF）：

| 样本 | tables | candidates | 表格样例 | 候选样例 |
|---|---:|---:|---|---|
| A | 1 | 16 | `p001-t01`，page 1，bbox `[50.0, 89.25, 418.89, 162.99]` | `doc-f39845a452d2:p001-t01-r01-c00`，page 1，bbox `[50.0, 89.25, 83.34, 102.99]`，`raw_text="Symbol"` |
| B | 2 | 24 | `p001-t01`，page 1，bbox `[50.0, 89.25, 418.89, 142.99]` | `doc-7baea8f1117d:p001-t01-r01-c00`，page 1，bbox 同上，`raw_text="Symbol"` |

- 证据可定位到 PDF 页码、bbox、表格/行/单元格 ID。
- `run_manifest.json` 记录 `document_sha256`、`run_id`、`parser_version`、`table_params_sha256` 等。
- 产物与真实 PDF 内容对应，不是仅返回模拟 JSON。

## 3. 失败/缺失/异常表达

`tests/integration/test_phase1_pdf.py` 覆盖：

| 场景 | 测试 | 结果 |
|---|---|---|
| 无文本层 PDF | `test_no_text_layer_yields_no_candidates` | PASS（tables=0, candidates=0） |
| 损坏 PDF | `test_corrupt_pdf_is_rejected` | PASS（抛 `PDFLoadError`） |
| 不完整表格 | `test_incomplete_table_is_partial_not_reconstructed` | PASS（`reconstruction_status` 为 partial/unresolved） |
| 多页表格 | `test_multipage_tables_keep_page_binding` | PASS（page 1/2 绑定） |
| 旋转文本 bbox | `test_rotated_text_keeps_bbox_inside_page` | PASS（bbox 在页面内） |
| 多 MPN 文档 | `test_multi_mpn_document_parses_without_merging_identity` | PASS（requested/normalized 保持） |

完整测试：`tests/unit/test_domain_contract.py` + `tests/unit/test_evidence_validation.py` + `tests/integration/test_phase1_pdf.py`，**83/83 passed，exit 0**（`evidence/02_targeted_pytest.txt`、`02_targeted_test_count.txt`）。

## 4. 是否只靠模拟 JSON/静态样例通过

- 否。测试通过 `tests/fixtures/synthetic.py` 生成真实 PDF，再调用 `parse_pdf` 实际解析。
- 样例解析产物为真实运行目录产物（`run_manifest` 的 artifact 哈希、`document_sha256` 与输入一致）。
- 未发现“仅返回静态 JSON 即判定 PASS”的路径。

## 5. 是否满足后续 Business API 数据消费要求

**部分满足，整体不满足。**

- 满足：原始表格/候选/证据可定位，可作为 API 的底层数据来源。
- 不满足：
  - 无 `brand`/`supplier`/`product_business_key`，无法直接构造 Business API 产品身份；
  - 无技术分类/字典（B7 未提交）；
  - 输出是 Parser 内部产物（tables/candidates/boundary），不是 16 操作 DTO；
  - 无 API 序列化/错误包/分页/ETag 实现。
- 因此本项 PASS 仅限“解析链路与证据模型真实、可追溯”；API 消费缺口计入检查 1/4/5。

## 6. 需要的修复（本轮不执行）

1. 增加 Brand/供应商/分类字段与 API DTO 映射。
2. 把候选/表格证据映射到契约的 Product/Evidence DTO。
3. 增加 API 消费级契约测试（16 操作/20 错误码/分页/ETag），而不是仅 Parser 单测。

## 7. P0-2 对应关系

- 对应 `12_/README.md` §2.1 第 3 项“解析器输出与证据模型”。
- 本项 **PASS**（解析/证据范围）；但 P0-2 仍需其他四项全部 PASS，当前不满足。
- 未修改任何 Ds Bit 代码。