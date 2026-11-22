# 04 第 10 页检查结果说明（legacy false、修正实现与自测）

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

1. **行尾空格**：PDF 文本层中的行是 `'第三方采购与付款方 '`（带尾随空格），而 `in` 作用在列表上是逐元素精确相等，`'第三方采购与付款方 ' != '第三方采购与付款方'`。
2. **[3:10] 是任意行窗口**：没有“重复表头后的第一条数据行”这一结构语义。该行实际位于 raw index 5，窗口内存在，失败来自比较方式而不是行不存在。

旧结果、旧窗口的 `repr`、字符串 raw index 均记录在新 JSON 的 `legacy_check` 中；重新执行旧条件仍为 `false`，证明误判可复现。

## 2. 新实现（不再使用固定行号）

脚本：`tools/fragment_check_v2.py`

### 2.1 04 p10：PDF 表格结构 + 动态表头定位

1. 用 PyMuPDF `page.find_tables()` 取得 PDF 表格的实际行/单元格边界。
2. 动态查找表头行：三个单元格规范化后必须分别为 `事项`、`当前处理`、`确认方`。
3. 首条数据行 = 表头行之后**第一条非空行**，不写死 `p10[5]`。
4. 单元格完整性只在该行自身的单元格范围内断言：
   - 第一格 = `第三方采购与付款方`
   - 第二格包含 `客户为采购与付款主体` 与 `按供应商账单结`
   - 第三格包含 `客户确认`
   - 三格均非空
5. 同样按“下一条数据行”的行内单元格断言：
   - 第一格包含 `目标市场` 与 `口径`
   - 第二格包含 `未提供前相关指标保持 PENDING`
   - 第三格包含 `客户提供与确认`
   - 三格均非空

本次实际定位结果：表头行 index `0`，首条数据行 index `1`（不是固定 5）。行内单元格原文见 JSON `automated_checks.04_p10`。

### 2.2 04 p9：保持原范围

- **CR-011 行**：在 CR 表中动态找到含 `CR-011` 的行，并按该行单元格断言：需求文本、交付物、`SD-07`、报价状态、客户确认。
- **裁决表末行**：动态定位表头后取该表最后一条数据行，断言 `月度运营工作量与月度费用`、`编制建议值仅供审核`、`项目负责人与客户确认`，三格非空。

### 2.3 02 十五个续页：范围不变

仍检查 p6–p20：重复表头 `客户意见` 之后第一行必须是完整 `FR-x-xxx`；15/15 通过，无残页。

## 3. 自动检查结果

来源：`fragment_check.json` → `automated_checks`

| 检查 | 结果 | 证据 |
|---|---|---|
| 04 p10 表头动态定位 | PASS | header row index 0 |
| 04 p10 首条数据行（动态） | PASS | row index 1；三格行内断言全部 true |
| 04 p10 下一条数据行 | PASS | 行内断言全部 true |
| 04 p9 CR-011 行 | PASS | 6 项行内断言全部 true |
| 04 p9 裁决表末行 | PASS | 3 项行内断言 + 非空检查全部 true |
| 02 p6–p20 | PASS | 15/15 首行为完整 FR 编号 |
| legacy 旧断言复现 | false（保留） | 行尾空格导致精确成员判断失败 |

`automated_checks` 全部通过时，`conclusion.all_automated_checks_pass = true`。

## 4. 表头前插入行数的自测（不改客户文件）

目的：验证“表头前文本行数变化”不会让新断言错误定位数据行。

方法：在内存中把 0/1/5/17 行前置说明插入到 p10 文本之前，再运行同一动态表头定位函数；客户文件与 PDF 均未修改。

| 前置行数 | 表头 index | 首条数据行 index | 首条数据行 | 结果 |
|---:|---:|---:|---|---|
| 0 | 2 | 5 | 第三方采购与付款方 | PASS |
| 1 | 3 | 6 | 第三方采购与付款方 | PASS |
| 5 | 7 | 10 | 第三方采购与付款方 | PASS |
| 17 | 19 | 22 | 第三方采购与付款方 | PASS |

结果保存在 `automated_checks.synthetic_header_offset_test`。这证明定位不依赖固定行号。

## 5. 自动检查与人工目视的区分

### 5.1 自动检查（`automated_checks`）

- 04 p10 表头/首行/次行：PDF 表格单元格级断言
- 04 p9 CR-011、裁决表末行：PDF 表格单元格级断言
- 02 续页 15 页：文本层表头后首行断言
- 表头偏移自测：内存构造，不改文件

### 5.2 人工目视（`manual_review`）

- Reviewer 目视 p10 PNG：裁决表首行完整、后续行未拆开、签署栏完整
- Agent 复看同一 PNG 与 PDF 表格单元：首条数据为“第三方采购与付款方”，其行内单元格与下一条“目标市场…口径”行完整
- 人工记录仅作为自动检查的独立佐证，不替代自动结果，也不把人工观察写成自动 PASS

## 6. 原始 false 的保留

- `data/fragment_check_legacy.json`：首版结果逐字节副本（仍含 `false`，SHA 如上）
- 新 `data/fragment_check.json`：
  - `legacy_check.preserved_original`：原始 JSON 对象（含 `false`）
  - `legacy_check.reproduced_result`：`false`（重跑旧条件）
  - `legacy_check.raw_window_3_10_repr`：窗口各行 `repr`
  - `legacy_check.string_raw_index`：5
  - `automated_checks`：新结果
- 没有手工把 `false` 改成 `true`；新旧结论同时存在。

## 7. 输入指纹

`fragment_check.json.inputs` 记录本次使用的内部 PDF、`render_checks.json` 与 legacy 文件的 SHA-256，便于确认结果对应的渲染版本。PDF 仅作为内部渲染中间态，不作为客户交付物提交。

## 8. 影响范围

本修正只改证据脚本与证据 JSON，不触碰 `31_customer_commercial_pack/`，也不改写 `56223e7`。