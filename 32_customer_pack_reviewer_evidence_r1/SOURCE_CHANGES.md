# R1 构建源改动（供复现）

以下改动位于构建源目录 `morrishk-commercial/customer_pack/`，不在客户包仓库内。客户包仓库只接收重建后的 00/02/04 文件及其 SHA。

## 1. `mdpack.py`：表格行禁止跨页拆分

```python
def _no_split(row):
    """Keep each table row on one page; customer fill-in rows must not split."""
    trPr = row._tr.get_or_add_trPr()
    if trPr.find(qn('w:cantSplit')) is None:
        trPr.append(OxmlElement('w:cantSplit'))
```

在 `_docx_table()` 创建表格后调用：

```python
t = doc.add_table(rows=len(rows), cols=ncol)
t.style = 'Table Grid'
t.alignment = WD_TABLE_ALIGNMENT.CENTER
t.autofit = False
for row in t.rows:
    _no_split(row)
```

## 2. `src/00_index.mdt`：CR-015 双字段表述

```diff
-- **CR-015（账号与数据归属）**：交付物为归属清单与移交演练，无第三方采购；报价状态按客户意见为“已包含但待核价”。
+- **CR-015（账号与数据归属）**：客户原始意见为“第三方实报实销”；当前建议归类为“已包含但待核价”，尚待项目负责人书面确认。
```

## 3. `src/02_function_scope.mdt`：移除内部修订代号

```diff
-> 说明：本表编号、名称、规划章节、实施阶段与原状态沿用《Morrishk 功能范围确认书 V1.1_R4.2》。…
+> 说明：本表编号、名称、规划章节、实施阶段与原状态沿用《Morrishk 功能范围确认书 V1.1》。…
```

## 4. `src/04_quotation.mdt`：裁决表 CR-015 行

```diff
-| CR-015 账号与数据归属的报价状态 | 客户意见原表曾列“第三方实报实销”，但交付物为归属清单与移交演练、无第三方采购；当前按“已包含但待核价”列示 | 项目负责人书面确认 |
+| CR-015 账号与数据归属的报价状态 | 客户原始意见为“第三方实报实销”；当前建议归类为“已包含但待核价”（交付物为归属清单与移交演练、无第三方采购），尚待项目负责人书面确认 | 项目负责人书面确认 |
```

## 5. `build_all.py`：04 XLSX 说明与追溯备注

```diff
-('CR-015', '交付物为归属清单与移交演练，无第三方采购；报价状态按客户意见为“已包含但待核价”，原表“第三方实报实销”待负责人裁决。'),
+('CR-015', '交付物为归属清单与移交演练，无第三方采购；客户原始意见为“第三方实报实销”；当前建议归类为“已包含但待核价”，尚待项目负责人书面确认。'),
```

09_CR追溯新增备注：

```python
'注：CR-015 客户原始意见为“第三方实报实销”；当前建议归类为“已包含但待核价”，尚待项目负责人书面确认。'
```

内部 QA 第 7 项同步：

```diff
-…CR-015 报价状态按 CSV 为“已包含但待核价”，原表差异已披露
+…CR-015 客户原始意见为“第三方实报实销”，当前建议归类为“已包含但待核价”，尚待项目负责人书面确认
```

构建过滤（只重建受影响文档）：

```python
only = {x.strip() for x in os.environ.get('BUILD_ONLY', '').split(',') if x.strip()}
...
if only and code not in only:
    continue
```

## 6. `source_data.json`：90 矩阵 CR-015 备注

```diff
-"备注": "乙方以授权成员身份工作｜CSV 报价状态原值：第三方实报实销；但交付物为归属表、无第三方采购，按“已包含但待核价”列示并登记 D-01。"
+"备注": "客户原始需求状态：第三方实报实销（CSV 原值，未改）｜当前商务建议归类：已包含但待核价（交付物为归属表、无第三方采购；登记 D-01）｜差异说明：原始需求表述与当前商务处理不同，尚待项目负责人书面确认。"
```

## 7. 构建命令

```bash
cd morrishk-commercial/customer_pack
BUILD_ONLY=00,02,04 python build_all.py
```

只重建 00、02、04 DOCX 与 04 XLSX；同时重建 90 矩阵、91 QA 报告与 SHA256SUMS。01/03/05 不写入，字节保持不变。