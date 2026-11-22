# 04 第 10 页检查结果说明（legacy false 的原因与修正）

- 对象：`fragment_check.json` 中 `"04_p10_starts_with_complete_row": false`
- 结论：这是**检查条件的误判（false negative）**，不是客户文件缺陷
- 原始失败记录：`data/fragment_check_legacy.json`（SHA-256 `963b8cd9038c2acc5a696b6e6716d36543455948152f624d07d193906f8fb120`）
- 原始 false 未被手工改写；新 `fragment_check.json` 同时保留 `legacy_check.original` 与 `corrected_check`

## 1. 旧检查条件

R1 首版使用一行内联判断：

```python
p10 = page_text['text']
res['04_p10_starts_with_complete_row'] = '第三方采购与付款方' in p10.split('\n')[3:10]
```

它返回 `False`。

## 2. 失败原因（两个独立缺陷）

### 2.1 行尾空格导致列表精确成员判断失败

`p10.split('\n')` 得到的行保留 PDF 文本层的行尾空格：

```
raw[5] = '第三方采购与付款方 '
```

而字面量是 `'第三方采购与付款方'`（无尾随空格）。`in` 作用在**列表**上时是逐元素相等比较，不是子串搜索，因此：

```
'第三方采购与付款方' in ['当前处理 ', '确认方 ', '第三方采购与付款方 ', ...]  # False
```

### 2.2 `[3:10]` 是任意行窗口，不具备结构语义

该窗口只是按行号切片，没有“重复表头之后的第一条数据行”这一含义。它本次恰好包含目标行，但换一页/换一个字号就可能指向别的行。即使没有空格问题，这个断言也不稳健。

### 2.3 实际行位置

- 原始文本中 `'第三方采购与付款方 '` 位于 `raw index = 5`
- `raw[3:10]` 确实包含该行
- 所以失败不是因为“行不在此窗口”，而是因为**未去空格的整行与去空格的字面量不相等**

## 3. 修正后的检查

修正脚本：`tools/fragment_check_v2.py`

方法：

1. 对每一行执行 `strip()` 并丢弃空行
2. 按结构定位重复表头 `事项 / 当前处理 / 确认方`
3. 断言表头后的第一条数据行等于 `第三方采购与付款方`
4. 断言该行的后续单元格完整：`客户为采购与付款主体…`、`客户确认`
5. 断言下一条数据行完整：`目标市场、重点产品、旧 URL、有效询盘`、`口径`、`未提供前相关指标保持 PENDING`、`客户提供与确认`
6. 同时验证 04 p9 的 CR-011 行完整、末行“月度运营工作量与月度费用”完整
7. 02 续页仍按“表头后第一行必须是完整 `FR-x-xxx`”检查

修正后结果：

| 检查 | 结果 |
|---|---|
| 02 续页 6–20 | 15/15 完整（FR-1-014 … FR-5-042） |
| 04 p9 CR-011 | 完整 |
| 04 p9 末行“月度运营工作量与月度费用” | 完整 |
| 04 p10 重复表头 | 存在 |
| 04 p10 第一条数据行 | `第三方采购与付款方` |
| 04 p10 第一条数据行单元格 | 完整 |
| 04 p10 下一条数据行 | 完整 |
| `04_p10_starts_with_complete_row`（修正后） | **true** |

## 4. 人工复核覆盖记录

- **Reviewer 独立目视**：p10 PNG 中裁决表首行完整，后续行未被拆开，签署栏完整。
- **Agent 复看**（同一 PNG + PDF 文本层）：
  - 重复表头后首条数据为“第三方采购与付款方”
  - 其下“客户为采购与付款主体，按供应商账单结算 / 客户确认”完整
  - 再下“目标市场、重点产品、旧 URL、有效询盘口径 / 未提供前相关指标保持 PENDING / 客户提供与确认”完整
  - “十三、支付、采购与授权”从新行开始，未与残行混排
- 预览：`renders/pages/04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES/page-10.png`

## 5. 原始失败记录的保留方式

- `data/fragment_check_legacy.json`：首版 `fragment_check.json` 的逐字节副本，仍含 `false`
- `data/fragment_check.json`：
  - `legacy_check.original`：首版 JSON 原文（含 `false`）
  - `legacy_check.reproduced_result`：重新执行旧条件仍为 `false`，证明误判可复现
  - `legacy_check.raw_window_3_10_repr`：窗口内各行的 `repr`，显示行尾空格
  - `legacy_check.string_raw_index`：5
  - `corrected_check`：修正后的结构化判定
  - `manual_review_override`：人工复核记录

没有把 `false` 手工改成 `true`；新旧结论同时存在，差异原因可追溯。

## 6. 影响范围

本说明只修正**证据检查脚本与结果文件**，不触碰客户文件，也不修改修订提交 `56223e7`。