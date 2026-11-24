# 06 上传格式决策记录（Round 42）

## 1. 当前策略（未变更）

| 项 | 值 |
|---|---|
| 允许扩展名 | `csv, doc, docx, pdf, txt` |
| 单文件上限 | 5 MB |
| MIME 与扩展名一致性 | `checkExtensionByMimeType = true` |
| 校验器 | `app\validators\FileUploadValidator`（自定义，规避 PHP 8.5 `finfo_close()` 弃用） |
| 服务端规则位置 | `models/SnSiiCart.php` L73 |
| XLS / XLSX | **关闭**（Round 41 移除，本轮未恢复） |

```php
// models/SnSiiCart.php L73（节选）
[['imageFile'], \app\validators\FileUploadValidator::class, 'skipOnEmpty' => true,
 'extensions' => 'csv,doc,docx,pdf,txt', 'maxSize' => 5*1024*1024,
 'checkExtensionByMimeType' => true],
```

## 2. 本轮复核结果（Yii 2.0.55 升级后）

```text
xlsx  http=200 accepted=no  field_error=yes (Only files with these extensions are allowed: csv, doc, docx, pdf, txt.)
csv   http=200 accepted=yes field_error=no
pdf   http=200 accepted=yes field_error=no
```

证据：`evidence/upload_format_after_upgrade.txt`。

- XLSX 仍被服务端拒绝，未因依赖升级被意外放开。
- CSV / PDF 正常受理，说明“表格类/文档类”需求仍有非 Excel 通道。
- 页面提示语与白名单一致，未出现前后端口径不一致。

## 3. 替代方案

| 需求 | 现有可行格式 | 说明 |
|---|---|---|
| BOM / 料表（多行） | **CSV** | 纯文本、无宏、无公式；可由 Excel 导出 |
| 图纸 / 规格书 / 扫描件 | **PDF** | 不可执行内容，风险最低 |
| 合同 / 说明 | **DOC / DOCX** | 已允许，但不解析 |
| 纯文本清单 | **TXT** | 已允许 |

对于“客户习惯直接发 .xlsx”的场景，运营侧可要求另存为 CSV 或 PDF 后上传；
当前产品未提供在线转换。

## 4. 是否存在客户明确要求 Excel 上传的证据

- 当前仓库与 Review 材料中**没有**客户明确要求“必须支持 .xlsx 上传”的记录
  （无工单、无验收条款、无客户邮件）。
- 内部增长计划 `01_business_plan/morrishk_growth_plan_v1.1.md` 在 BOM 场景提到
  “有 Excel/CSV/PDF”与“上传 Excel/CSV”，属于**产品规划描述**，不是客户需求证据，
  也不是当前版本已承诺功能。
- 因此本轮维持关闭 XLS/XLSX，并把“未来是否支持”保留为独立决策。

## 5. 与 PhpSpreadsheet 的关系

- 代码中**没有** `PhpSpreadsheet` / `IOFactory` / `PHPExcel` 的解析调用；上传文件只做存储。
- 当前 `phpoffice/phpspreadsheet` 仍为旧版本，audit 中仍有 31 条 advisory。
- 关闭 XLS/XLSX 上传使“恶意表格文件进入解析链路”的入口不存在；但这**不等于**
  该依赖的漏洞已修复。

## 6. 如果未来需要 Excel 解析

必须作为独立变更执行，不得随普通需求顺手打开：

1. 单独升级 `phpoffice/phpspreadsheet` 到无已知高危 advisory 的版本，并做完整回归。
2. 在**隔离进程/受限环境**中解析（独立 worker、禁用宏与外部链接、限制内存/CPU/超时）。
3. 解析前做文件类型与结构校验（不只看扩展名），拒绝公式、宏、外部引用。
4. 解析结果落库前做字段白名单与长度限制；不信任单元格内容。
5. 保留原始文件与解析日志，便于追溯。
6. 重新评估上传大小上限与存储配额。

## 7. 结论

| 问题 | 结论 |
|---|---|
| 是否恢复 XLS/XLSX | **否** |
| 是否有 CSV/PDF 替代 | **有**（均已允许） |
| 是否有客户明确 Excel 需求证据 | **无** |
| 未来若需解析 | 单独升级依赖 + 隔离解析进程，另立变更 |
