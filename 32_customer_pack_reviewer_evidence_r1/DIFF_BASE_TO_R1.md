# 基线 a6a92e3 → 修订 R1 差异报告

本报告比较客户包基线 `a6a92e39b5cff3490c13047e517b85595959ee68` 与修订分支工作树。
只列出实际内容差异；DOCX/XLSX 的二进制差异不单独展示，以逐段/逐单元格比较为准。

## 1. SHA-256 变化

| 文件 | 基线 | 修订 R1 | 变化 |
|---|---|---|---|
| 00_CUSTOMER_PACK_INDEX_AND_VERSION.docx | `57942883db4783cacc423523c37fe32c063c9855688df89411fe98c7de430eb0` | `124c071ef94e833d099a748566a99e32c74606414e3af92baf6762c93fb7802c` | CHANGED |
| 02_FUNCTION_SCOPE_CONFIRMATION.docx | `7082b831b40c517cbcfca8464b26b7b2f3aa51ea47972748d3955a547e1b073c` | `b354f95d4bd338894af01a80f6678a68ee2fadb7476e825953aff14c6c38d1d0` | CHANGED |
| 04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES.docx | `88f45bdc65bc60524a15213c39dcbb7c1f146c93db7470019d483f1ced4ef5a3` | `30f7fea956ce4bcfef0f40908b0b5f32f2bbf11253948bf48052281d3e7e85fd` | CHANGED |
| 04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES.xlsx | `d1eec08965825005ebf6dfd4cf2ac4760b0ea0f6b9ba83c46eda2439bb3a6b4c` | `97ccabe7393605d2e2a27f3a5c54bf771468c029b0dad1dc2f106e2d512ed087` | CHANGED |
| _internal/90_DELIVERY_TRACEABILITY_MATRIX.xlsx | `89e5eb19e5b48fd9e4b495d77e1421b2800fe06ec6ece0f918cfa496757416f5` | `5fcb4572c5ac3185e5b1baa046e4c836824684cbc25f1fb4e070feb2bfc36ff2` | CHANGED |

## 2. 00_CUSTOMER_PACK_INDEX_AND_VERSION.docx 逐段/逐格差异

- **段落 P027**
  - 基线：• CR-015（账号与数据归属）：交付物为归属清单与移交演练，无第三方采购；报价状态按客户意见为“已包含但待核价”。
  - R1：• CR-015（账号与数据归属）：客户原始意见为“第三方实报实销”；当前建议归类为“已包含但待核价”，尚待项目负责人书面确认。
- 内容差异项合计：1

## 2. 02_FUNCTION_SCOPE_CONFIRMATION.docx 逐段/逐格差异

- **段落 P058**
  - 基线：说明：本表编号、名称、规划章节、实施阶段与原状态沿用《Morrishk 功能范围确认书 V1.1_R4.2》。费用归属为建议值，待项目负责人确认；“客户选择”与“客户意见”由客户填写。建议不纳入项在“客户选择”列给出建议选项，仍以客户书面意见为准。
  - R1：说明：本表编号、名称、规划章节、实施阶段与原状态沿用《Morrishk 功能范围确认书 V1.1》。费用归属为建议值，待项目负责人确认；“客户选择”与“客户意见”由客户填写。建议不纳入项在“客户选择”列给出建议选项，仍以客户书面意见为准。
- 内容差异项合计：1

## 2. 04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES.docx 逐段/逐格差异

- **T15 R4 C1**
  - 基线：客户意见原表曾列“第三方实报实销”，但交付物为归属清单与移交演练、无第三方采购；当前按“已包含但待核价”列示
  - R1：客户原始意见为“第三方实报实销”；当前建议归类为“已包含但待核价”（交付物为归属清单与移交演练、无第三方采购），尚待项目负责人书面确认
- 内容差异项合计：1

## 3. 04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES.xlsx 单元格差异

- **00_说明!B15**
  - 基线：'交付物为归属清单与移交演练，无第三方采购；报价状态按客户意见为“已包含但待核价”，原表“第三方实报实销”待负责人裁决。'
  - R1：'交付物为归属清单与移交演练，无第三方采购；客户原始意见为“第三方实报实销”；当前建议归类为“已包含但待核价”，尚待项目负责人书面确认。'
- **09_CR追溯!A26**
  - 基线：None
  - R1：'注：CR-015 客户原始意见为“第三方实报实销”；当前建议归类为“已包含但待核价”，尚待项目负责人书面确认。'
- 单元格差异项合计：2

## 3. _internal/90_DELIVERY_TRACEABILITY_MATRIX.xlsx 单元格差异

- **01_CR_TRACE!Q17**
  - 基线：'乙方以授权成员身份工作｜CSV 报价状态原值：第三方实报实销；但交付物为归属表、无第三方采购，按“已包含但待核价”列示并登记 D-01。'
  - R1：'客户原始需求状态：第三方实报实销（CSV 原值，未改）｜当前商务建议归类：已包含但待核价（交付物为归属表、无第三方采购；登记 D-01）｜差异说明：原始需求表述与当前商务处理不同，尚待项目负责人书面确认。'
- 单元格差异项合计：1

## 4. 00_CUSTOMER_PACK_INDEX_AND_VERSION.md 文本差异

```diff
--- base
+++ R1
@@ -74,7 +74,7 @@
 
 - **FR-3-040（外链与公关）**：范围纳入 119 项，费用归属待项目负责人确认；确认前按“暂不报价，待确认”列示，不重复计费。
 - **SD-02（重点产品池与关键词台账）**：范围待确认，仅报价方式为单独报价。
-- **CR-015（账号与数据归属）**：交付物为归属清单与移交演练，无第三方采购；报价状态按客户意见为“已包含但待核价”。
+- **CR-015（账号与数据归属）**：客户原始意见为“第三方实报实销”；当前建议归类为“已包含但待核价”，尚待项目负责人书面确认。
 - **CR-019（客户资料清单）**：清单由乙方编制，客户提供资料本身不计费；费用归属待项目负责人确认。
 
 ## 六、不构成承诺的事项
```

## 4. _internal/91_CROSS_FILE_QA_REPORT.md 文本差异

```diff
--- base
+++ R1
@@ -14,13 +14,13 @@
 
 | 文件 | 可读取字符数 |
 |---|---:|
-| 00_CUSTOMER_PACK_INDEX_AND_VERSION.docx | 2142 |
-| 00_CUSTOMER_PACK_INDEX_AND_VERSION.md | 2568 |
+| 00_CUSTOMER_PACK_INDEX_AND_VERSION.docx | 2147 |
+| 00_CUSTOMER_PACK_INDEX_AND_VERSION.md | 2573 |
 | 01_MORRISHK_PROJECT_PLAN_AND_ROADMAP.docx | 7465 |
-| 02_FUNCTION_SCOPE_CONFIRMATION.docx | 31050 |
+| 02_FUNCTION_SCOPE_CONFIRMATION.docx | 31045 |
 | 03_SEO_IMPLEMENTATION_AND_MONTHLY_OPERATION.docx | 9281 |
-| 04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES.docx | 15953 |
-| 04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES.xlsx | 38121 |
+| 04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES.docx | 15966 |
+| 04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES.xlsx | 38185 |
 | 05_PROJECT_KICKOFF_AND_ACCEPTANCE_PLAN.docx | 9482 |
 
 ## 二、14 项独立质量检查
@@ -33,7 +33,7 @@
 | 4 | 15 项新增全部待确认 | PASS | 15/15 范围状态为“待确认”；SD-02 仅报价方式为单独报价 |
 | 5 | FR-3-040 待裁决 | PASS | 范围纳入 119；A-09 参考行；费用类别“暂不报价，待确认”；不计入 A/C 金额 |
 | 6 | CR-019 待裁决 | PASS | 04 §12 与 00 说明；报价状态按 CSV 为“已包含但待核价”，费用类别“暂不报价，待确认” |
-| 7 | CR-003 / CR-015 未决 | PASS | CR-003 单独报价、范围待确认；CR-015 报价状态按 CSV 为“已包含但待核价”，原表差异已披露 |
+| 7 | CR-003 / CR-015 未决 | PASS | CR-003 单独报价、范围待确认；CR-015 客户原始意见为“第三方实报实销”，当前建议归类为“已包含但待核价”，尚待项目负责人书面确认 |
 | 8 | 六类费用一致 | PASS | 六类费用表（01/04 §1.2）；费用类别统计仅含六类 |
 | 9 | 无重复计费 | PASS | A/B/C/D/E/F/G 分区编号互斥；SD-02 仅在 E；118 明细不逐项计价 |
 | 10 | 金额/日期/SLA/数量/付款比例未经确认不得写成承诺 | PASS | 全部金额空白；日期“待双方确认”；工作量为编制建议值；SLA 为建议值 |
```

