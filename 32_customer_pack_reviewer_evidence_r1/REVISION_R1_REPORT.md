# 客户商务启动包 — Reviewer 阻断项修订报告 R1

- 基线：`a6a92e39b5cff3490c13047e517b85595959ee68`（客户包分支 `docs/morrishk-customer-commercial-pack`，保持冻结）
- 修订分支：`docs/morrishk-customer-commercial-pack-r1`
- 修订提交：`56223e793227d54c52691d7f37e48e25dbfa0eee`
- 证据分支（本报告所在）：`review-artifact/morrishk-customer-commercial-evidence-r1`
- 修订性质：仅处理 Reviewer 指定的三个阻断项；不改变功能范围、费用归属或商业承诺
- 当前状态：等待 Reviewer 复核；**未自我标记 `CUSTOMER_REVIEW_READY`**

## 1. 修订项与结果

| # | Reviewer 阻断项 | 处理 | 结果 |
|---|---|---|---|
| P1 | 02、04 DOCX 分页断行 | 为重建的 00/02/04 全部表格行写入 `w:cantSplit` | 02 的 15 个续页全部以完整 FR 行开头（修订前 12 个以残行开头）；04 的 CR-011 与裁决表末行保持完整 |
| P1 | CR-015 原始报价状态与索引说明不一致 | 00 索引、00 MD、04 DOCX 裁决表、04 XLSX 说明/追溯页、90 矩阵统一为“原始需求状态 + 当前建议归类 + 尚待确认” | 00 P027 不再把当前归类写成客户原始意见；04/90 文本与之一致 |
| P2 | 客户文件内部修订代号 `V1.1_R4.2` | 02 附录 A 说明改为《Morrishk 功能范围确认书 V1.1》 | 客户 DOCX/XLSX 中 `R4.2` 命中 0 |

## 2. 变更文件（8 个）

| 文件 | 基线 SHA-256 | R1 SHA-256 | 变化 |
|---|---|---|---|
| `00_CUSTOMER_PACK_INDEX_AND_VERSION.docx` | `57942883db4783cacc423523c37fe32c063c9855688df89411fe98c7de430eb0` | `124c071ef94e833d099a748566a99e32c74606414e3af92baf6762c93fb7802c` | 文本 |
| `00_CUSTOMER_PACK_INDEX_AND_VERSION.md` | `a464d99164d845fe30f9f7864bb55c898806de26374db1b74154ee1b27b68725` | `82750c74aff7ec21174624f9626e9c329f850cb94bb5b3fd0c031660e2036beb` | 文本 |
| `02_FUNCTION_SCOPE_CONFIRMATION.docx` | `7082b831b40c517cbcfca8464b26b7b2f3aa51ea47972748d3955a547e1b073c` | `b354f95d4bd338894af01a80f6678a68ee2fadb7476e825953aff14c6c38d1d0` | 文本 + 分页保护 |
| `04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES.docx` | `88f45bdc65bc60524a15213c39dcbb7c1f146c93db7470019d483f1ced4ef5a3` | `30f7fea956ce4bcfef0f40908b0b5f32f2bbf11253948bf48052281d3e7e85fd` | 文本 + 分页保护 |
| `04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES.xlsx` | `d1eec08965825005ebf6dfd4cf2ac4760b0ea0f6b9ba83c46eda2439bb3a6b4c` | `97ccabe7393605d2e2a27f3a5c54bf771468c029b0dad1dc2f106e2d512ed087` | 2 个单元格 |
| `_internal/90_DELIVERY_TRACEABILITY_MATRIX.xlsx` | `89e5eb19e5b48fd9e4b495d77e1421b2800fe06ec6ece0f918cfa496757416f5` | `5fcb4572c5ac3185e5b1baa046e4c836824684cbc25f1fb4e070feb2bfc36ff2` | 1 个单元格 |
| `_internal/91_CROSS_FILE_QA_REPORT.md` | `90d76936ab307dbace5eb0c8e4df66ba0ca03064cdc6e96c05965dc678ad02e3` | `26218ce9f001172746382d4ead8fdc249bdf452429401c4d3f73b2017d3a1260` | QA 行与字数 |
| `SHA256SUMS` | — | `f78927b09f9fc675167579a09f80c66d4527583e0e1bd68087121eb472fa5177` | 重新生成 |

`01`、`03`、`05` 未重建，文件字节不变。

## 3. P1 分页断行：修订方法与验证

### 3.1 方法

在 DOCX 表格构建器中为每一行写入 `w:cantSplit`：

```python
def _no_split(row):
    trPr = row._tr.get_or_add_trPr()
    if trPr.find(qn('w:cantSplit')) is None:
        trPr.append(OxmlElement('w:cantSplit'))
```

重建的 00/02/04 中：

- 02：12 张表、308 行，308 行全部带 `cantSplit`（含 228 行附录 A）
- 04：18 张表、262 行，262 行全部带 `cantSplit`（含 111 行 F 区表）
- 00：5 张表、35 行，35 行全部带 `cantSplit`

### 3.2 02 附录 A（页数仍为 21）

逐页检查“重复表头之后第一段是否为完整 `FR-x-xxx`”：

- 修订前：p6、p7、p8、p9、p10、p11、p12、p13、p14、p18、p19、p20 共 12 个续页为残行开头
- 修订后：p6–p20 共 15 个续页**全部为完整行开头**（FR-1-014、FR-1-030、FR-1-046、FR-2-002…FR-5-042）
- 页数未增加：仍为 21 页；页脚仍为“第 N 页 / 共 21 页”

### 3.3 04 报价（页数仍为 10）

- 修订前：p8 页末只剩 `CR-`，p9 页首为 `011/待核价/认`；p9 页末裁决表最后一行只剩前半句，p10 页首重复表头下只有一个“口径”
- 修订后：p9 页首为完整 `CR-011` 行（“CR-”与“011”只是窄列内换行，整行在同一页）；p10 页首重复表头下为完整行“第三方采购与付款方”，其下“目标市场、重点产品、旧 URL、有效询盘口径”整行同页
- 页数未增加：仍为 10 页

### 3.4 目视检查

- `renders/pages/02_FUNCTION_SCOPE_CONFIRMATION/page-06.png`：页首为 FR-1-014 完整行
- `renders/pages/02_FUNCTION_SCOPE_CONFIRMATION/page-12.png`：页首为 FR-3-002 完整行
- `renders/pages/04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES/page-10.png`：页首为完整裁决行，签署栏完整
- `renders/pages/00_CUSTOMER_PACK_INDEX_AND_VERSION/page-02.png`：CR-015 新表述可见

页码：00 3/3、02 21/21、04 10/10，全部连续；文本/图形溢出 0 页。

### 3.5 证据检查脚本误判说明

R1 首版 `fragment_check.json` 中 `04_p10_starts_with_complete_row` 为 `false`，原因是检查条件误判，不是文档缺陷：

- 旧条件：`'第三方采购与付款方' in p10.split('\n')[3:10]`
- 失败原因：PDF 文本行的行尾空格使列表精确成员判断失败（`'第三方采购与付款方 '` ≠ `'第三方采购与付款方'`）；且 `[3:10]` 是任意行窗口。该行实际位于 raw index 5，窗口内存在。
- 原始 false 保存在 `renders` 同级的 `data/fragment_check_legacy.json`，新 `data/fragment_check.json` 同时包含 `legacy_check.original`（false）与 `corrected_check`（true）。
- 修正脚本：`tools/fragment_check_v2.py`；完整说明见 `FRAGMENT_CHECK_EXPLANATION.md`。

## 4. P1 CR-015 双字段口径：修订原文

### 4.1 00 索引 P027（DOCX 与 MD）

基线：

> CR-015（账号与数据归属）：交付物为归属清单与移交演练，无第三方采购；报价状态按客户意见为“已包含但待核价”。

R1：

> CR-015（账号与数据归属）：客户原始意见为“第三方实报实销”；当前建议归类为“已包含但待核价”，尚待项目负责人书面确认。

### 4.2 04 DOCX 裁决表 T15 R4 C1

基线：

> 客户意见原表曾列“第三方实报实销”，但交付物为归属清单与移交演练、无第三方采购；当前按“已包含但待核价”列示

R1：

> 客户原始意见为“第三方实报实销”；当前建议归类为“已包含但待核价”（交付物为归属清单与移交演练、无第三方采购），尚待项目负责人书面确认

### 4.3 04 XLSX

- `00_说明!B15`：改为“交付物为归属清单与移交演练，无第三方采购；**客户原始意见为“第三方实报实销”；当前建议归类为“已包含但待核价”，尚待项目负责人书面确认**。”
- `09_CR追溯!A26` 新增备注：“注：CR-015 客户原始意见为“第三方实报实销”；当前建议归类为“已包含但待核价”，尚待项目负责人书面确认。”

### 4.4 90 内部追溯矩阵

`01_CR_TRACE!Q17` 改为：

> 客户原始需求状态：第三方实报实销（CSV 原值，未改）｜当前商务建议归类：已包含但待核价（交付物为归属表、无第三方采购；登记 D-01）｜差异说明：原始需求表述与当前商务处理不同，尚待项目负责人书面确认。

### 4.5 未改变的状态

- 04 XLSX `09_CR追溯` 的“报价状态”仍为 `已包含但待核价`
- “费用类别”仍为 `暂不报价，待确认`
- “金额”仍为空
- “客户确认状态”仍为 `待确认`
- 未写成客户已确认或负责人已裁决

## 5. P2 内部版本代号清理

基线 02 附录 A 说明：

> …沿用《Morrishk 功能范围确认书 V1.1_R4.2》。

R1：

> …沿用《Morrishk 功能范围确认书 V1.1》。

扫描客户 DOCX/XLSX：`R4.2` 命中 0；`按客户意见为` 命中 0。

## 6. 内容最小性核验

逐段/逐单元格比较基线与本修订（见 `DIFF_BASE_TO_R1.md`）：

| 文件 | 内容差异项 | 具体 |
|---|---:|---|
| 00 DOCX | 1 | P027 一段 |
| 02 DOCX | 1 | P058 一段（仅版本代号） |
| 04 DOCX | 1 | T15 R4 C1 一格 |
| 04 XLSX | 2 | 00_说明!B15、09_CR追溯!A26 |
| 90 矩阵 | 1 | 01_CR_TRACE!Q17 |
| 01/03/05 | 0 | 文件未变 |

未发现功能名称、编号、数量、费用类别、范围状态、客户确认状态的其它变化。

## 7. 不变量复核

| 项目 | 结果 |
|---|---|
| 02 附录 A | 228 行（227 条），唯一 227；保留 32 / 升级 66 / 新建 21 / 待确认 104 / 建议不纳入 4 |
| 新增 15 项 | 15 行，范围全部“待确认” |
| 04 XLSX 数据行 | F 区 110、08 表 15、09 表 20 |
| 金额 | 04 DOCX 金额列非空 0；04 XLSX 金额列非空 0 |
| SHA256SUMS | 10/10 MATCH（`sha256sum -c` 通过） |
| 页数 | 00 3、02 21、04 10（与修订前一致） |

## 8. 未处理的非阻断项（本轮按要求不动）

- 04 XLSX 12 个工作表仍未设置打印方向、纸张、缩放、打印区域、重复标题行
- 00 的 Word 统计页数与实际页数差异未处理
- 未增加独立封面或自动目录
- 未清理 `python-docx` / `openpyxl` 文件属性
- 57 项 A–J 决策事项仍未在客户包内逐项列示

## 9. 复现

1. 在 `customer_pack` 源目录执行 `BUILD_ONLY=00,02,04 python build_all.py`
2. 在 `reviewer_evidence_r1` 执行 `powershell -File render_r1.ps1`
3. `python analyze_render.py`、`python render_checks.py`、`python contact_sheets.py`
4. 用 `fragment_check.json` 核对 02 无残行、04 无拆行

## 10. 证据包

- `DIFF_BASE_TO_R1.md`：基线→R1 精确差异（段落/单元格/文本 diff）
- `render_analysis.json` / `render_checks.json`：逐页页码、溢出、表头重复、签署页
- `FRAGMENT_CHECK_EXPLANATION.md`：04 p10 旧检查 false 的原因、修正方法与人工复核记录
- `data/fragment_check.json`：旧 false 原文 + 修正后的结构化检查结果
- `data/fragment_check_legacy.json`：首版 `fragment_check.json` 的逐字节副本（仍含 false）
- `renders/pages/`：00（3）+ 02（21）+ 04（10）共 34 页 PNG
- `renders/contact_*.png`：三份文档联络表
- `tools/`：渲染与检查脚本（含 `fragment_check_v2.py`）
- `SOURCE_CHANGES.md`：构建源改动原文