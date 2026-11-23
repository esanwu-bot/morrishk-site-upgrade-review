# 检查 2：全局 ID 复验

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-P02-REVERIFY-002 |
| 基线 | `feat/gate6a-audit` / `600439a5eee69fb3a1cec2715e37080e48ca9840`（干净工作区） |
| 方法 | 代码审查 + 同一 PDF 两次解析 + 同一 MPN 不同 PDF 两次解析 + DuckDB 表结构检查 |
| 结论 | **FAIL** |

## 1. PASS/FAIL 判定

**FAIL。** 当前只有“文档内容身份”（`document_id`/`product_id` 随 PDF SHA 变化）和“运行身份”（`run_id`），没有跨文档、跨批次的产品全局 ID，也没有唯一性/分配机制。

P0-2 通过标准（本报告采用）：

1. 存在全局 ID 的生成/分配机制；
2. 跨文档、跨解析批次唯一且稳定；
3. 在数据表、解析输出、业务接口中一致；
4. 重复导入、重新解析、数据更新行为明确；
5. 不是只在测试环境成立的 ID 假设。

当前 1–4 不满足；5 也无 Business API 级测试。

## 2. 实际代码证据

### 2.1 ID 生成

| ID | 生成方式 | 代码位置 |
|---|---|---|
| `document_id` | `doc-{pdf_sha256[:12]}` | `src/icpdf/parser/pdf_loader.py:59` |
| `product_id` | `prod-{document_id}` | `src/icpdf/parser/pipeline.py:152` |
| `run_id` | UTC 时间戳 + 6 位随机 hex | `src/icpdf/storage/run_store.py:24-25` |
| 表/行/单元格 ID | 文档内局部 ID（`p001-t01-r01-c00` 等） | `tables.json` / `candidates.json` 样例 |

- `product_id` 完全由 `document_id` 派生；同一产品若有多份 PDF，会产生多个 `product_id`。
- 没有全局产品注册表、没有 UUID/ULID 产品主键、没有跨文档映射表。
- `run_id` 每次解析都变化；`document_id`/`product_id` 对同一 PDF 内容稳定。

### 2.2 数据层

`lake/_build_lake.py:364-400` 只创建三张表：

```text
raw_docs    (source_sha256 PRIMARY KEY, file, bytes, immutable, first_seen)
parse_runs  (run_id PRIMARY KEY, source_sha256, parser_fingerprint, ..., manifest_path)
eval_results(run_id PRIMARY KEY, source_sha256, gold_version, ..., semantic_hit_rate)
```

- 无 product 表、无 brand 列、无分类表、无映射表。
- 无跨文档产品主键；无重复导入/更新逻辑。

### 2.3 解析输出

`run_manifest.json` 记录 `run_id`、`document_id`、`document_sha256`、`requested_mpn` 等；`product.json` 的 `product_id` 如 §2.1。没有全局 ID 字段。

## 3. 实际运行证据

### 3.1 同一 PDF 解析两次

`evidence/10_id_stability_reparse.txt`：

| 尝试 | run_id | document_id | product_id | document_sha256 |
|---|---|---|---|---|
| 1 | `20261123T070357Z-62b63b` | `doc-4398f9eb5d94` | `prod-doc-4398f9eb5d94` | `4398f9eb…93c1` |
| 2 | `20261123T070357Z-77791f` | `doc-4398f9eb5d94` | `prod-doc-4398f9eb5d94` | `4398f9eb…93c1` |

结论：同一内容重复解析 → 文档/产品 ID 稳定，`run_id` 变化。这是“内容身份稳定性”，不是“全局产品唯一性”。

### 3.2 同一 MPN、不同 PDF

`evidence/sample_parse_summary.json`：

| 样本 | requested_mpn | document_id | product_id |
|---|---|---|---|
| A | `SAME-MPN` | `doc-f39845a452d2` | `prod-doc-f39845a452d2` |
| B | `SAME-MPN` | `doc-7baea8f1117d` | `prod-doc-7baea8f1117d` |

结论：同一 MPN 在不同 PDF 上得到不同 `product_id`；没有跨文档唯一 ID。

### 3.3 重复导入/更新

- 没有数据库导入/更新流程；`RunStore.create` 只拒绝覆盖同名 run，不处理产品去重/合并。
- `lake` 只有 raw_docs/parse_runs/eval_results，无产品更新语义。
- **无法验证重复导入、重新解析、数据更新时的“全局 ID”行为**，因为该机制不存在。

## 4. 一致性

| 层 | 是否有全局 ID | 说明 |
|---|---|---|
| 解析输出 | 否 | `product_id` 文档派生 |
| 存储（lake） | 否 | 三表均以 source_sha/run_id 为主键 |
| B2B/API | 否 | 权威提交无 B2B 服务；Parser Lab 不提供全局产品 ID |
| 75 项矩阵 | 否 | 依赖 `product_business_key`，当前代码未实现 |

## 5. 是否存在只在测试环境成立的 ID 假设

- `tests/unit/test_domain_contract.py` 与 `tests/integration/test_phase1_pdf.py` 只验证文档内 ID/MPN 行为；没有全局唯一性/跨文档合并测试。
- `tests/integration/test_phase1_pdf.py:110-115` 仅断言 `requested_mpn == normalized_mpn`。
- 因此不是“测试环境假通过”，而是**测试未覆盖且代码无全局 ID**。

## 6. 需要的修复（本轮不执行）

1. 定义全局产品 ID 的生成/分配机制（例如基于 `(mpn_norm, brand_norm)` 的 `pbk1_` 键或注册表主键），并说明多版本身份。
2. 建立产品主表/映射表，明确唯一约束、重复导入、重新解析、更新/撤回行为。
3. 在 `product.json`、lake/Repository、Business API 与 75 矩阵中统一使用该 ID。
4. 增加跨文档、跨批次、重复导入与冲突测试。

## 7. P0-2 对应关系

- 对应 `12_/README.md` §2.1 第 2 项“产品全局 ID 唯一性”。
- 当前结论 **FAIL**；P0-2 不能提交关闭申请。
- 本检查未修改任何 Ds Bit 代码。