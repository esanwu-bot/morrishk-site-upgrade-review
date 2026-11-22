# Morrishk 客户商务启动包 — Reviewer 阻断项修订证据 R1

- 基线：`a6a92e39b5cff3490c13047e517b85595959ee68`
- 客户包修订分支：`docs/morrishk-customer-commercial-pack-r1`
- 修订提交：`56223e793227d54c52691d7f37e48e25dbfa0eee`
- 证据分支：`review-artifact/morrishk-customer-commercial-evidence-r1`
- 材料性质：**仅供 Reviewer 复核，不是客户交付物**
- 状态：等待 Reviewer 复核；未自我标记 `CUSTOMER_REVIEW_READY`

## 1. 本目录内容

| 文件/目录 | 用途 |
|---|---|
| `REVISION_R1_REPORT.md` | 三个阻断项的处理说明、修订前后原文、验证结果、未处理项 |
| `DIFF_BASE_TO_R1.md` | 基线 `a6a92e3` → R1 的逐段、逐单元格、文本差异 |
| `SOURCE_CHANGES.md` | 构建源改动原文（只重建 00/02/04） |
| `SHA256SUMS` | R1 客户包的 10 个文件哈希（从 `31_` 复制） |
| `data/render_analysis.json` | 修订后 00/02/04 的逐页文本、字体、页码、溢出 |
| `data/render_checks.json` | 表头重复、签署页、标题孤行、逐页原文 |
| `data/fragment_check.json` | 旧 false 原文 + 修正后的 02/04 残行检查 |
| `data/fragment_check_legacy.json` | 首版检查结果逐字节副本（保留 `false`） |
| `FRAGMENT_CHECK_EXPLANATION.md` | 04 p10 旧检查 false 的根因、修正与人工复核覆盖记录 |
| `renders/pages/` | 00（3）+ 02（21）+ 04（10）= 34 页 PNG |
| `renders/contact_*.png` | 三份文档的整页联络表 |
| `tools/` | 渲染、栅格化、检查脚本 |

客户文件原件在修订分支：`../31_customer_commercial_pack/`（切换或查看 `docs/morrishk-customer-commercial-pack-r1`）。

## 2. 优先阅读

1. `REVISION_R1_REPORT.md`
2. `DIFF_BASE_TO_R1.md`
3. `renders/pages/02_FUNCTION_SCOPE_CONFIRMATION/page-06.png`、`page-12.png`（修订后续页首行为完整 FR 行）
4. `renders/pages/04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES/page-10.png`（修订后裁决行完整，签署栏完整）
5. `renders/pages/00_CUSTOMER_PACK_INDEX_AND_VERSION/page-02.png`（CR-015 双字段表述）

## 3. 修订后核验摘要

| 项目 | 结果 |
|---|---|
| 02 附录 A 续页 | 15/15 以完整 FR 行开头（修订前 12 个残行） |
| 04 拆行 | CR-011 整行同页；裁决表末行整行同页（旧检查 false 为行尾空格导致的误判；新检查按 PDF 表格动态定位表头与首行，并含 0/1/5/17 行前置自测，见 `FRAGMENT_CHECK_EXPLANATION.md`） |
| 页数 | 00 3、02 21、04 10（与修订前一致） |
| 页码/溢出 | 全部正确；文本/图形溢出 0 |
| CR-015 | 原始需求状态、当前建议归类、尚待确认三要素齐全；00/04/90 一致 |
| 内部版本代号 | 客户 DOCX/XLSX 中 `R4.2` 命中 0 |
| 不变量 | 227 / 119 / 176 / 15 / 20 不变；金额非空 0 |
| SHA256SUMS | 10/10 MATCH |

## 4. 未处理项（Reviewer 列为非阻断）

- 04 XLSX 打印方向、缩放、打印区域、重复标题行未设置
- 00 的 Word 统计页数差异未处理
- 未增加独立封面或目录
- 未清理 `python-docx` / `openpyxl` 文件属性
- 57 项 A–J 决策事项未在客户包内逐项列示

## 5. 不做什么

- 不修改基线客户包分支 `docs/morrishk-customer-commercial-pack`
- 不改变功能范围、费用归属或商业承诺
- 不交付 PDF；PNG 仅为 Reviewer 预览
- 不合并到 `main`，不创建 PR