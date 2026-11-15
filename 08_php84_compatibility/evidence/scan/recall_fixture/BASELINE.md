# 召回夹具基线（改动扫描器后必须重跑本文件）

本基线用于回答一个问题：**"20/20 现在是否仍然成立"**。任何规则增删、正则调整、`blank_noncode` 改动后，
都必须重跑下面的命令，并把实际命中行与本表逐行比对。**不要只看到"命中数 20"就放过**——行号错位同样意味着规则跑偏。

## 运行命令

```bash
# 在仓库根目录 E:/workspace/独立站/morries 下执行
python platform/tools/php_compat_scan.py \
  platform/docs/phase1/php-upgrade/scan/recall_fixture \
  platform/docs/phase1/php-upgrade/scan/recall_result
```

## 夹具与预期

| 夹具 | 行数 | 作用 | 预期 |
|---|---:|---|---|
| `recall_fixture/removed_positive.php` | 25（含 21 个构造） | 21 个 PHP 已移除/弃用构造，逐行各 1 处 | 21 行全部命中（19 BLOCKER + 1 HIGH + 1 MEDIUM），**零漏报** |
| `recall_fixture/negative_control.php` | 12 | 6 处"像但不是"：注释、块注释、字符串、`$obj->each()`、`$obj->split()`、内联 JS | **零命中** |

## 预期命中行 vs 实际命中行（removed_positive.php）

| 行 | 构造 | 预期级别 | 实际级别 | 结果 |
|---:|---|---|---|---|
| 5 | `each($arr)` | BLOCKER | BLOCKER | 一致 |
| 6 | `create_function()` | BLOCKER | BLOCKER | 一致 |
| 7 | `function __autoload()` | BLOCKER | BLOCKER | 一致 |
| 8 | `mysql_query()` | BLOCKER | BLOCKER | 一致 |
| 9 | `mcrypt_encrypt()` | BLOCKER | BLOCKER | 一致 |
| 10 | `ereg()` | BLOCKER | BLOCKER | 一致 |
| 11 | `split()` | BLOCKER | BLOCKER | 一致 |
| 12 | `money_format()` | BLOCKER | BLOCKER | 一致 |
| 13 | `utf8_encode()` | MEDIUM（8.2 弃用，不致命） | MEDIUM | 一致 |
| 14 | `strftime()` | HIGH（8.1 弃用） | HIGH | 一致 |
| 15 | `get_magic_quotes_gpc()` | BLOCKER | BLOCKER | 一致 |
| 16 | `hebrevc()` | BLOCKER | BLOCKER | 一致 |
| 17 | `restore_include_path()` | BLOCKER | BLOCKER | 一致 |
| 18 | `fgetss()` | BLOCKER | BLOCKER | 一致 |
| 19 | `image2wbmp()` | BLOCKER | BLOCKER | 一致 |
| 20 | `ezmlm_hash()` | BLOCKER | **未命中** | **已知缺口：规则表未覆盖 `ezmlm_hash`，需补规则后重跑** |
| 21 | `(real)$n` | BLOCKER | BLOCKER | 一致（v1.1 新增规则） |
| 22 | `$str{0}`（读取形式） | BLOCKER | BLOCKER | 一致（v1.1 新增规则） |
| 23 | `preg_replace('/a/e', …)` | BLOCKER | BLOCKER | 一致（v1.1 新增后置检查） |
| 24 | `parse_str($qs)` 单参 | BLOCKER | BLOCKER | 一致 |
| 25 | `function bad_sig($opt = 1, $req)` | BLOCKER | BLOCKER | 一致（v1.1 新增签名检查） |

**实测汇总**：夹具共 21 个构造，命中 **20 个**，漏 1 个（第 20 行 `ezmlm_hash`，规则表未覆盖）。
因此"20/20"的表述**不成立**，正确口径是 **20/21，且缺口已定位**。
`ezmlm_hash` 一项另用人工 grep 兜底核验：全站（排除 `messages/`）0 命中，见报告 §2.2 备注。

> 本表按 `scan/recall_result/app_scan_findings.csv` 的实际输出逐行核对得出。
> 报告层面已按"20/21 + 1 条已知缺口"改写，不再使用"20/20 全覆盖"的说法。
> 按评审意见，当前**不建议继续扩大规则数量**，故只登记缺口（`ezmlm_hash`），不擅自扩表；
> 同理 `image2wbmp`、`hebrevc` 等已有规则项仍以规则命中为准。

## 负例控制（negative_control.php）

实际输出中**没有任何来自该文件的命中行**，误报数 = 0，符合预期。
其中内联 `<script>` 块被 `mask_markup_scripts()` 正确抹除，注释与字符串被 `blank_noncode()` 正确抹除。

## 历史对照

| 阶段 | 规则数 | 正例命中 | 说明 |
|---|---:|---:|---|
| v1.0 | 34 | 13/21 | 缺 `(real)`、`$str{0}` 读取形式、`preg /e`、必需参数在可选之后；`__autoload` 当时因夹具写法（字符串形式）未命中 |
| v1.1 | 36 + 2 项后置检查 | **20/21** | 补上述 4 类；`ezmlm_hash` 漏报，登记为已知缺口并用人工 grep 兜底 |
