# 04 第 10 页检查结果说明（legacy false、生产定位函数自测、乱序负向测试）

- 对象：`fragment_check.json` 中的 `04_p10` 检查
- 结论：旧 `false` 是**检查条件误判（false negative）**，不是客户文件缺陷
- 原始失败记录：`data/fragment_check_legacy.json`，SHA-256 `963b8cd9038c2acc5a696b6e6716d36543455948152f624d07d193906f8fb120`（未改写、未删除）
- 客户文件未修改；客户包修订提交 `56223e7` 未改写

## 1. 旧断言与失败原因

旧条件：

```python
'第三方采购与付款方' in p10.split('\n')[3:10]
```

旧结果为 `false`。原因有两个：

1. **行尾空格**：PDF 文本层中的行是 `'第三方采购与付款方 '`，而 `in` 作用在列表上是逐元素精确相等，带尾随空格的行不等于去空格的字面量。
2. **[3:10] 是任意行窗口**：不具备“重复表头后的第一条数据行”这一结构语义。该行实际位于 raw index 5，窗口内存在，失败来自比较方式而不是行不存在。

旧结果、旧窗口 `repr`、字符串 raw index 均记录在 `legacy_check`；重新执行旧条件仍为 `false`。

## 2. 生产检查实现

脚本：`tools/fragment_check_v2.py`

### 2.1 表头定位按顺序匹配

`find_header_row` 使用 `header_in_order`：

- 先把每行单元格规范化（去空白）；
- 要求标签按 `事项 → 当前处理 → 确认方` 的顺序依次出现；
- 不是“三个标签在同一行任意位置出现”。

同一函数也用于 04 p9 的 CR 表（`CR → 客户要求`）和裁决表表头。

### 2.2 04 p10：表头后第一条非空数据行

1. 用 PyMuPDF `page.find_tables()` 取得 PDF 表格的行/单元格边界。
2. 动态查找表头行（顺序匹配）。
3. 首条数据行 = 表头行之后**第一条非空行**，不写死任何行号。
4. 只在该行自身的单元格范围内断言：
   - 第一格 = `第三方采购与付款方`
   - 第二格含 `客户为采购与付款主体`、`按供应商账单结`
   - 第三格含 `客户确认`
   - 三格非空
5. 下一条数据行同样按行内单元格断言：
   - 第一格含 `目标市场` 与 `口径`
   - 第二格含 `未提供前相关指标保持 PENDING`
   - 第三格含 `客户提供与确认`

本次实际定位：表头行 index `0`，首条数据行 index `1`（动态得出，不是固定 5）。

### 2.3 04 p9 与 02 续页范围不变

- 04 p9 CR-011：在 CR 表中动态找到含 `CR-011` 的行，按该行单元格断言需求文本、交付物、`SD-07`、报价状态、客户确认。
- 04 p9 裁决表末行：动态定位表头后取该表最后一条数据行，断言 `月度运营工作量与月度费用`、`编制建议值仅供审核`、`项目负责人与客户确认`。
- 02 p6–p20：仍检查重复表头 `客户意见` 之后第一行是否为完整 `FR-x-xxx`；15/15 通过。

## 3. 实际 PDF 检查结果（`pdf_checks`）

| 检查 | 结果 | 证据 |
|---|---|---|
| 04 p10 表头/首条数据行 | PASS | header 0；first data 1；三格行内断言全部 true |
| 04 p10 下一条数据行 | PASS | 行内断言全部 true |
| 04 p9 CR-011 行 | PASS | 6 项行内断言全部 true |
| 04 p9 裁决表末行 | PASS | 3 项行内断言 + 非空检查全部 true |
| 02 p6–p20 | PASS | 15/15 首行为完整 FR 编号 |

## 4. 自测（`self_tests`，全部调用生产定位函数）

### 4.1 表头前增加行数

方法：直接取 PDF 表 10 的 `data10` 行数组，在内存中于真实表头前插入 0/1/5/17 行占位行，再调用生产函数 `find_header_row` 与 `first_nonempty_row`。客户文件与 PDF 均未修改。

| 前置行数 | 表头行 index | 首条数据行 index | 首条数据行 | 结果 |
|---:|---:|---:|---|---|
| 0 | 0 | 1 | 第三方采购与付款方 | PASS |
| 1 | 1 | 2 | 第三方采购与付款方 | PASS |
| 5 | 5 | 6 | 第三方采购与付款方 | PASS |
| 17 | 17 | 18 | 第三方采购与付款方 | PASS |

记录字段包含 `header_row_index`、`expected_header_row_index`、`first_data_row_index`、`expected_first_data_row_index`、`row_cells`、`pass`。这证明自测覆盖的就是实际生产使用的表格定位链路，而不是另一套文本行函数。

### 4.2 表头乱序负向测试

对内存构造的表行调用同一个 `find_header_row`：

| 表头顺序 | 应匹配 | 实际 | 结果 |
|---|---|---|---|
| `事项 / 当前处理 / 确认方` | 是 | 匹配（index 0） | PASS |
| `当前处理 / 事项 / 确认方` | 否 | 不匹配 | PASS |
| `确认方 / 当前处理 / 事项` | 否 | 不匹配 | PASS |
| `事项 / 确认方 / 当前处理` | 否 | 不匹配 | PASS |

这验证了“按顺序匹配”，而不是“三个标签任意位置出现”。

## 5. JSON 分层

新 `fragment_check.json` 明确分为：

- `legacy_check`：旧 `false` 原文 + 复现结果
- `pdf_checks`：实际 PDF 表格检查（p10、p9 CR-011、p9 裁决表末行、02 续页）
- `self_tests`：偏移自测 + 表头乱序负向测试（均调用生产函数）
- `manual_review`：Reviewer 与 Agent 的人工目视记录
- `conclusion`：`all_pdf_checks_pass`、`all_self_tests_pass`

人工目视仅作为独立佐证，不替代 `pdf_checks` 或 `self_tests`。

## 6. 原始 false 的保留

- `data/fragment_check_legacy.json`：首版结果逐字节副本（仍含 `false`，SHA 如上）
- 新 `data/fragment_check.json`：
  - `legacy_check.preserved_original`：原始 JSON（含 `false`）
  - `legacy_check.reproduced_result`：`false`
  - `legacy_check.raw_window_3_10_repr`：窗口各行 `repr`
  - `legacy_check.string_raw_index`：5
- 没有手工把 `false` 改成 `true`。

## 7. 输入指纹

`inputs` 记录本次使用的内部 PDF、`render_checks.json` 与 legacy 文件的 SHA-256。PDF 仅作为内部渲染中间态，不作为客户交付物提交。

## 8. 影响范围

本修正只改证据脚本与证据 JSON，不触碰 `31_customer_commercial_pack/`，也不改写 `56223e7`。