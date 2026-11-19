# Morrishk V1.1 R4.1 自检报告

| 项 | 值 |
|---|---|
| 日期 | 2026-11-19 |
| 版本 | V1.1 R4.1 |
| 程序检查 | **PASS** |
| 人工逻辑检查 | **PASS**（P5/A-1/A-3关闭；R4导出校验修正） |
| 资料/商务/签署 | **PENDING** |

程序检查由 python-docx / openpyxl 实际读取，并对 P5/A-1/A-3 单元格与校验报告哈希做值比对。

## 1. 文件与哈希

| 文件 | 大小 | SHA-256 |
|---|---:|---|
| Morrishk 全项目开发总规划 V1.1_R4.1.docx | 46685 | `3c4eace809f4931b6052c869a401c19f6ef200129be8dd5ef3b3c3250425db61` |
| Morrishk 功能范围确认书 V1.1_R4.1.docx | 66227 | `b4303fc5293ecf79ab8626b138c204bd80a32acf2fd9e43c11b2cfef7e49ea6b` |
| Morrishk SEO 首期实施与月度运营方案 V1.0_R4.docx | 48203 | `e68ebbeb655c7ba4217f9f346eab98c8e9d80de7367bf40589a76589e5ed338a` |
| Morrishk V1.1_R4 客户意见响应与文件对齐矩阵.xlsx | 12480 | `9046af10258e68e6e286647e81c9afb76438c11efdbfa429ab750855b2089480` |
| Morrishk V1.1_R4 费用归属与月度工作量清单.xlsx | 38167 | `d3e83b2defb8db53fb60d4d3899902b1bd69fb658b0884fc301fd011ffe24681` |
| Morrishk V1.1_R4.1 变更前后对照.md | 3564 | `adb299db44002dc3949645a4799a1839bdf631b625496d50c261cf811578e346` |
| Morrishk_总规划_V1.1_R4.1_REVIEW.md | 70141 | `a751dbb9d13a41574644010b25928a88fdec0d67985dcac796635eb68c32dfb7` |
| Morrishk_功能范围确认书_V1.1_R4.1_REVIEW.md | 142769 | `2beddc55f0a4c407d2136f584d2fcf9f8e8a708e190e3bc40dcb6915c7087f8a` |
| Morrishk_SEO_V1.0_R4.1_REVIEW.md | 18740 | `b752ad91cfade6fccdddf33051ca81232e531a4056360130be72d218c8665377` |
| Morrishk_R4_REVIEW_EXPORT_CHECK.md | 1871 | `d4defcefe94dd6bb7ac19ce8e8c28d612494bc7e4d179983c66048677ab47339` |
| Morrishk_R4.1_REVIEW_EXPORT_CHECK.md | 1876 | `457da921103c8e040da18b7d62322a6560e660f2159cec503b46d71014d22968` |
| Morrishk_总规划_V1.1_R4_REVIEW.md | 70090 | `fb4341b9d1161e2a6779aa73632d4250124e5f3d2da6ec26d6c0c96344dbe2cc` |
| Morrishk_功能范围确认书_V1.1_R4_REVIEW.md | 142454 | `09fdd8ab302350c772f4a849e0872ed7ff44c6f1ce2c616f830efd01e814c735` |
| Morrishk_SEO_V1.0_R4_REVIEW.md | 18736 | `572afbb60e2e4ec187229f3ec2777904e606425bb0b67bfcf4e9cbdf1493d0ef` |

## 2. 程序检查明细

| 检查项 | 方法 | 结果 | 说明 |
|---|---|---|---|
| 三份 DOCX 可打开 | 程序 | PASS | plan 816段；scope 276段；seo 55段 |
| P5状态已关闭 | 程序 | PASS | ['SEO/多语言', '目标语言已确定 en/de/ja/es/fr，第一阶段仅交付 en', 'P5'] |
| 总规划无语言范围待确认 | 程序 | PASS |  |
| A-1目标语言已关闭 | 程序 | PASS | ['A-1', '目标语言', '已确认为英语、德语、日语、西班牙语、法语，默认英语', '全站语言与内容', '已确定：en/de/ja/es/fr（en 第一阶段；de/ja/es/fr 后续；id/zh 不纳入）', 'Reviewer 已关闭语言清单，不再要求客户重复确认', '2026-11-19（Reviewer）'] |
| A-3默认语言URL已关闭 | 程序 | PASS | ['A-3', '默认语言 URL 形式', '默认语言是否带路径前缀', '规范化链接与历史 URL', '已确定：第一阶段 en 不带语言路径前缀', '第一阶段只交付 en；其他语言为后续阶段', '2026-11-19（Reviewer）'] |
| 五语与第一阶段规则保持 | 程序 | PASS |  |
| SEO附件与R4二进制一致 | 程序 | PASS |  |
| 客户矩阵与R4二进制一致 | 程序 | PASS |  |
| 费用清单与R4二进制一致 | 程序 | PASS |  |
| CR 20条 | 程序 | PASS |  |
| 费用清单39/月度11/FR227 | 程序 | PASS |  |
| 费用状态176项 | 程序 | PASS | 176 |
| 第19章三值关系保持 | 程序 | PASS |  |
| SD/OPS/FR编号保持 | 程序 | PASS |  |
| 原227 FR保留 | 程序 | PASS |  |
| R4导出校验标题/来源修正 | 程序 | PASS |  |
| R4导出校验MD哈希一致 | 程序 | PASS |  |
| R4.1导出校验标题/来源 | 程序 | PASS |  |
| R4.1导出校验MD哈希一致 | 程序 | PASS |  |
| R4.1正文导出来源正确 | 程序 | PASS | Morrishk_总规划_V1.1_R4.1_REVIEW.md:True;Morrishk_功能范围确认书_V1.1_R4.1_REVIEW.md:True;Morrishk_SEO_V1.0_R4.1_REVIEW.md:True |
| R4.1正文导出0缺失 | 程序 | PASS | Morrishk_总规划_V1.1_R4.1_REVIEW.md:0;Morrishk_功能范围确认书_V1.1_R4.1_REVIEW.md:0;Morrishk_SEO_V1.0_R4.1_REVIEW.md:0 |
| 无具体金额 | 程序 | PASS |  |
| 交付日期未擅自承诺 | 程序 | PASS | 12 |

## 3. R4.1 修订

| 项 | R4.1 |
|---|---|
| P5 状态 | 目标语言已确定 en/de/ja/es/fr，第一阶段仅交付 en |
| A-1 | 已确定 en/de/ja/es/fr；Reviewer 关闭，不再要求客户重复确认 |
| A-3 | 第一阶段 en 不带语言路径前缀 |
| R4 导出校验 | 标题/来源 R2→R4；DOCX 文件名/SHA 与 MD SHA 已核对 |

## 4. 严格不变

- 五语 en/de/ja/es/fr；第一阶段 en；id/zh 不纳入；第一阶段无 hreflang。
- 费用分类、176项、39费用项、11月度项、227 FR、20 CR、SD/OPS、第19章三值关系、P9待核实均保持 R4。
- SEO 附件与两份 XLSX 与 R4 二进制一致。

## 5. 结论

R4.1 程序检查通过：P5、A-1、A-3 状态已关闭；R4 导出校验标题/来源已改为 R4 且 MD 哈希一致；R4.1 导出校验标题/来源与 MD 哈希一致；SEO/XLSX 与 R4 二进制一致；三份 R4.1 正文导出 0 缺失。

未填写报价金额、未承诺未经确认的工作量或日期、未修改应用代码、未合并 main、未发送客户；本轮不构成客户批准、范围冻结或签署完成。