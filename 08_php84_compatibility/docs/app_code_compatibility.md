# 老站应用层兼容性评估报告（PHP 7.4 → 8.4 · 只读）

| 项目 | 值 |
|---|---|
| 文档编号 | MRH-P1-PHP-APP-001 |
| 版本 | **v1.2.3（裁定版：生产探针未获授权，G1/G3/G4 保持 OPEN；探针方案降级为"待授权取证方案"）** |
| 评估对象 | `newPlan/morrishk.net`（Yii2 Basic 模板，生产站源码快照） |
| 评估方式 | **只读静态扫描 + Composer 依赖求解 + 上游元数据核对**；未修改、未移动、未删除任何老站文件；未变更任何运行时；**未在生产环境创建任何文件** |
| 评估时间 | 2026-11-16（v1.0）；2026-11-16 修订（v1.1 → v1.2）；2026-11-16 勘误（v1.2.1）；2026-11-16 增补（v1.2.2）；2026-11-16 裁定（v1.2.3） |
| 目标运行时 | **PHP 8.4**（首选）；PHP 8.5 仅作兼容性验证候选 |
| 现状 | PHP 7.4.33-FPM + Yii 2.0.44（7.4 已停止安全支持） |
| 上游文档 | `php_compatibility.md`（依赖层）、`yii_extension_audit.md`（扩展层）、`runtime_upgrade_plan.md`（执行计划） |
| 证据目录 | `scan/`（扫描与召回自检）、`solve/`（依赖求解试验）、`scan/recall_fixture/BASELINE.md`（召回基线） |

### 修订记录

| 版本 | 变更 | 依据 |
|---|---|---|
| v1.0 | 初版 | 一次性提交 |
| v1.1 | 修正 service-contracts 归因、PHPExcel 误判、ckeditor 日期、QueryList 判断、CSRF 归因、bak 文件定级、Yii 补丁归因；补召回自检 | 首轮评审意见 |
| **v1.2** | **仅执行评审 R1–R4**，并追加两处由求解试验暴露的新事实（module-yii2 版本线、测试链平台下界）；其余章节与结论未重写 | 二轮评审意见 + `solve/` 证据 |
| **v1.2.1** | 三处勘误，不改其他结论：① §3.2.4 把"新测试链最低要求 PHP 8.4"收窄为"**本次 dry-run 解析方案**要求 PHP 8.4"，并声明不等于所有组合的理论下界；② §6.1 / P1-5 为 `*_bak.php` 不可下载结论补适用范围，并补清理前的两项确认；③ §7.3 增加双轨验证与分别归档约束；④ G4 明确 mysqlnd 须从 FPM 环境取证 | 三轮评审意见 |
| **v1.2.2** | 三处增补，不重写结论：① **新增 §7.4 生产环境红线**（R-1~R-6：不在生产装新 FPM、不改宝塔 PHP 池、不改 vhost/socket、生产 7.4.33-FPM 保持不变），并把"灰度时新增 8.4 池即可并存"降级为**未来架构可能性**；② G1/G3/G4 采集方式统一改为**真实 vhost 探针页 + FPM worker 上下文**，CLI 仅作交叉参考，探针采集后即删（脚本见 `prod/prod_baseline.md` §六）；③ §7.1 / §7.2 相应增补一行"不批准"与"不在生产服务器执行"的措辞 | 四轮评审意见（G1 取证方式 + README 404）+ 五轮评审意见（生产红线） |
| **v1.2.3** | **一处定性更正，不改任何技术结论**：v1.2.2 把"用探针页做只读采集"写成生产侧被允许的动作，属定性错误。本版纠正为：**生产探针属生产文件系统写入，不在已批准的只读范围内，当前未授权、不执行**。具体落地：① §7.4.1 增 R-7（未授权不得在生产创建/上传/执行任何文件）；② §6.3 G1/G3/G4 状态明确标 **OPEN · 未获授权**，并补"证据不可替代关系"表；③ §7.2 步骤 1 拆分为"只做 G2（独立环境）/ G1·G3·G4 需单独授权"；④ `prod_baseline.md` §六 由"采集方式"降级为**待授权的取证方案**；⑤ 补 G5 可独立核验、且 G2 不能反推 G1 的说明 | 六轮评审裁定（不批准生产探针） |

**版本关系**：v1.2.2 是**增补**，v1.2.3 是**定性更正**，两者都不重写技术结论。v1.1 的结论、v1.2 的 R1–R4、v1.2.1 的三处勘误、v1.2.2 的生产红线全部保留有效。v1.2.3 只纠正一处性质判断——"为了取证而临时写入生产文件"不属于已批准的只读操作。若与前版冲突，以 v1.2.3 为准。

**R1–R4 对应关系**

| 编号 | 要求 | 落点 | 证据 |
|---|---|---|---|
| R1 | §3.2 补 service-contracts 完整反向链与单点更新求解证据，区分"锁文件滞后型/结构性约束型" | §3.2.1–§3.2.4 | `solve/01`–`solve/06` |
| R2 | §2.2 将扫描结论限定为"已知移除构造召回测试" | §2.2 引言与表注 | `scan/recall_fixture/BASELINE.md` |
| R3 | §6.2 更新生产信息状态，引用已取得的 FPM / Nginx / 扩展证据 | §6.1、§6.2 | 评审方现场核实结果 |
| R4 | §7 改为"允许隔离环境建设，暂不批准 8.4 验收与生产切换" | §7 | — |

---

## 0. 结论（先看这一段）

### 0.1 一句话结论

> **应用层在"本次扫描能覆盖的范围内"未发现 PHP 8.0 移除项；依赖层确有 4 个包在 PHP 8.4 上解析不出来。**
> 但"扫描未命中"不等于"代码已兼容 8.4"。本次可判定的是：161 个业务文件里**没有 PHP 8 会当场致命的结构**；
> **不可判定**的是：运行期 deprecation 的实际数量、`vendor/` 内框架与第三方包的 8.4 行为、动态属性告警量。

v1.0 把这段写成"代码层是干净的，依赖层是堵死的"，属**表述过强**，本版已撤回。理由见 §0.5 与 §1.3。

### 0.2 判定矩阵

| 层面 | v1.0 判定 | **v1.2 判定** | 依据与保留 |
|---|---|---|---|
| 应用代码·已移除构造 | ✅ GO | **PASS（仅限本批召回口径）** | 36 条规则 + 2 项后置检查，161 文件 0 命中；召回夹具 20/21，1 条缺口已定位并用人工 grep 兜底（§1.2、§2.2） |
| 应用代码·行为兼容 | ⚠️ GO with review | **UNKNOWN** | ~120 处 `null` 传内建参数静态无法判定；必须 staging 实测（§2.5.3） |
| 应用代码·输入层安全 | 未单列 | **NO-GO（既有缺陷，非 PHP 8 项）** | CSRF 在 9 个控制器被显式关闭，含全部后台写控制器（§2.5.4） |
| Yii 框架版本 | ❌ NO-GO | **NO-GO** | 2.0.44 早于 8.1/8.2/8.4 全部修复，CHANGELOG 可逐条对账（§3.1） |
| 生产依赖（71 个） | ⚠️ 条件 GO | **条件 GO（收窄）** | 无解析阻塞；但"4 个停维护包"的结论需按 §3.3 重述，其中 1 个系误判 |
| 开发依赖（60 个） | ❌ NO-GO | **NO-GO** | 4 个包排除 8.4；3 个结构性、1 个锁文件滞后；且本次解析方案要求 PHP 8.4（§3.2.4，非理论下界） |
| 整体升级可行性 | 代码 OK，依赖未就绪 | **不具备 8.4 验收条件；具备隔离环境建设条件** | 依赖方案已验证可求解，但运行期未验证、扩展差异未逐项核对 |

### 0.3 三条最重要的判断（已按评审意见收窄）

1. **`composer install` 的"成功"不构成任何兼容性证据。** `composer.json` 的 `"php": ">=5.6.0"` 没有上界，Composer 在 8.4 上不会拦——但这只是"没有保护"，**不是**运行期故障的根因。根因是代码与依赖的实际行为，只能在运行时观察。v1.0 把两者因果绑在一起，已更正（§4 P1-1）。
2. **移除项 0 命中是真实的，但"真实"只在本批构造的定义范围内。** v1.0 §2.2 的 20 项里，`(real)` 转换、`$str{0}` 读取形式、`preg /e`、必需参数在可选之后这 4 项当时**没有任何规则覆盖**，那 4 个"0 命中"是真空值。v1.2 已补规则并重扫，结果仍为 0。同时召回夹具暴露：`ezmlm_hash` **没有规则**，该行"0 命中"只能靠人工 grep 兜底。故本版口径改为"**对本批定义的已知移除构造，召回测试 20/21，缺口已定位**"，不再写"全覆盖"（§2.2）。
3. **要改的代码位置仍是 2 类，但第 2 类的定性要改。** 20 处缺 `isPost()` 守卫的 `load()`（健壮性）、9 处直读 `$_POST`（输入层）。**"直读 `$_POST` 就是绕过 CSRF"不成立**——真正的绕过点是 9 个控制器把 `enableCsrfValidation` 显式设为 `false`，这两件事必须分开写（§2.5.4）。

### 0.4 评审四问的答复索引

| # | 评审要求核查的点 | 答复位置 | 结论摘要 |
|---|---|---|---|
| 1 | 4 个阻塞项是否真阻塞、完整依赖链 | **§3.2** | 4 个成立（独立重算与 `composer prohibits` 一致）；`service-contracts` 的链是 **console ← codeception**，不是 browser-kit。其中 3 个结构性、1 个锁文件滞后；**"单点更新即可解除"经实测不成立**——其余 3 项未解除时整体求解失败，只能证明约束允许 3.x（§3.2.2） |
| 2 | Yii 2.0.44 → 2.0.55 的兼容性依据与升级约束 | **§3.1** | 版本、发布时间、`require.php` 有 packagist 与 CHANGELOG 双重依据；v1.0 关于 `ReturnTypeWillChange` 的版本号与"2.0.53 大规模补 `?type`"两处无据，已改为可对账的条目 |
| 3 | 4 个停维护包是否真有 8.4 运行风险 | **§3.3** | 1 个是**误判**（`moonlandsoft/yii2-phpexcel` 依赖的是 PhpSpreadsheet，不是 PHPExcel）；1 个 abandoned 但无崩溃证据（swiftmailer）；1 个仅版本旧（ckeditor）；1 个上游仍在维护（QueryList） |
| 4 | 是否把"未命中扫描规则"扩大成"代码已兼容" | **§0.2、§1.2、§2.2** | 是，v1.0 有此问题。本版补了 4 条缺失规则、留了召回基线，并把口径限定为"20/21 + 1 条缺口已定位"；**该结果仅证明本批召回通过，不构成 8.4 完整证明** |

### 0.5 本报告明确不主张的四件事

| 不主张 | 原因 |
|---|---|
| 不主张"应用代码已兼容 PHP 8.4" | 只做了静态模式匹配，无运行期证据；`vendor/` 为空目录，框架与第三方源码未扫 |
| 不主张"修完 §4 就能上 8.4" | 依赖可解析 ≠ 依赖可运行；Yii 2.0.55 在 8.4 的表现需实测（§6） |
| 不主张"生产环境已摸清" | 已核实：FPM 指向、监听方式、池参数、Nginx root、部分扩展；仍缺：FPM 实际加载的完整扩展清单、OPcache 运行状态（§6） |
| 不主张批准 8.4 验收与生产切换 | 本报告支持"隔离环境建设 + Yii 7.4 回归"，不支持把 8.4 结果当作验收通过（§7） |

---

## 1. 评估范围与方法

### 1.1 扫描范围

| 项 | 数值 | 说明 |
|---|---:|---|
| 扫描根目录 | 1 | `newPlan/morrishk.net` |
| 扫描 `.php` 文件 | **560** | 含 `messages/` 翻译包 |
| 扫描代码行 | **247,396** | |
| **业务代码文件**（排除 `messages/`） | **161** | 真正含逻辑的代码 |
| **业务代码行数** | **16,449** | 人工复核的真实工作量 |
| `messages/` 翻译文件 | 400 | 230,492 行，纯 `return [...]` 数组，无逻辑、无函数调用 → PHP 8 风险为 0 |
| `vendor/` | **空目录** | ⚠️ 无法核对实际安装版本，也无法扫描框架/第三方源码 |
| 扫描规则 | **36 条正则 + 2 项后置检查** | BLOCKER / HIGH / MEDIUM / INFO 四级（v1.0 为 34 条） |

业务代码分布（161 文件）：

```
modules/     74   ← 后台 ejadmin 模块（占比最大）
views/       22
models/      18
snsii/       14   ← 自研组件层
commands/    11
controllers/ 10
config/       5
mail/         3
根目录        4
```

### 1.2 扫描方法与召回基线（R2 修订）

扫描器：`platform/tools/php_compat_scan.py`（只读工具）

处理链路：

```
遍历 .php
  → blank_noncode()        抹掉注释与字符串字面量（保留换行与偏移，行号不漂移）
  → mask_markup_scripts()  抹掉 <script> / <style> 块（消除内联 JS 误判）
  → 36 条正则规则逐条匹配
  → 2 项后置检查（preg /e 修饰符、函数签名中"必需参数在可选参数之后"）
  → 输出 CSV（file, line, severity, rule, category, match, why, fix, snippet）
```

**召回/精确率基线**（夹具源码、预期命中行、实际命中行、运行命令全部留档于 `scan/recall_fixture/BASELINE.md`）：

| 夹具 | 构造数 | 预期 | 实测 | 缺口 |
|---|---:|---|---|---|
| `removed_positive.php` | 21 | 21 行全部命中 | **20 命中（19 BLOCKER + 1 HIGH + 1 MEDIUM）** | `ezmlm_hash` 无规则 → 1 条漏报 |
| `negative_control.php` | 6 | 0 误报 | **0 误报** | — |

> **口径声明（本节为 R2 要求的限定）**：
> 对本次定义的这 21 个构造，扫描器召回 **20/21**，负例误报 0；补规则后全站重扫结果与 v1.0 一致（20 条 INFO，无增无减）。
> 该结果**只证明扫描器通过了本批召回测试**，**不构成对所有 PHP 8.4 兼容性问题的完整证明**，也不覆盖：
> 运行期 deprecation、`vendor/` 内代码、动态属性、反射/动态调用。
> v1.0 使用的 34 条规则在同一夹具上首轮仅命中 13/21（`__autoload` 当时因夹具写成字符串形式未命中，属夹具缺陷；
> 其余 4 类为规则缺口），这正是"0 命中不能直接当证据"的原因。
>
> 证据：`scan/recall_result/app_scan_findings.csv`、`scan/v11_rerun/app_scan_summary.json`、`scan/recall_fixture/BASELINE.md`。

### 1.3 已知局限（v1.1 重写）

| 局限 | 影响 | 补偿措施 / 现状 |
|---|---|---|
| 未使用 PHPCompatibility（PHPCS 官方标准） | 规则集为自建，覆盖度不及官方 | 已建召回基线（20/21 + 1 条已知缺口）；仍建议阶段 B 用 `phpcs --standard=PHPCompatibility` 复核 |
| `vendor/` 为空 | 框架与第三方包源码无法扫描 | 依赖层改用 Composer 求解器做可判定事实；**运行风险仍未证**（§3.3） |
| 纯静态分析，无运行期 | 无法判定 `null` 是否真的传入内建函数 | 列为 staging 必测项，不盲改（§2.5.3） |
| 无法判定动态属性 | `$obj->undefinedProp = x` 属赋值行为，静态规则不可靠 | 依赖层定位到 PhpSpreadsheet / CKEditor widget / QueryList 三个高发点，仍需实测 |
| 未覆盖反射与动态调用 | `call_user_func`、`$class::$method`、`include $var` | 未做专项；如需可加 grep 清单人工过 |
| 生产扩展清单未采全 | 8.4 装载可行性未知 | 已核实 FPM 指向、池参数、Nginx root 与部分扩展；完整加载清单与 OPcache 运行状态待补（§6） |

---

## 2. 代码扫描结果

### 2.1 总览

```json
{
  "files_scanned": 560,
  "lines_scanned": 247396,
  "findings_total": 20,
  "by_severity": { "INFO": 20 }
}
```

| 级别 | 数量 | 含义 |
|---|---:|---|
| BLOCKER（PHP 8.0 已移除，必然致命） | **0** | — |
| HIGH（弃用且确定出问题） | **0** | — |
| MEDIUM（行为变化，需回归） | **0** | — |
| INFO（观察项，非 PHP 8 变更） | **20** | 全部为同一类：`->load(Yii::$app->request->post())` |

### 2.2 已知移除构造：逐项核验（R2 口径）

**本节结论的适用范围（先读这一句）**：
下表 20 项是**本项目自己定义的检查清单**。扫描器对这 20 项的规则覆盖为 19/20（`ezmlm_hash` 无规则），
召回夹具实测 21 个构造命中 20 个。因此本节可以说的是"**这 20 类构造在站内未出现**"，
**不能**说成"PHP 8.4 兼容性已通过验证"。

| # | 移除项 | 移除版本 | 规则覆盖 | 命中 | 核验方式 |
|---|---|---|---|---|---|
| 1 | `each()` | 8.0 | 有 | **0** | 规则 + 人工 grep（排除内联 JS） |
| 2 | `create_function()` | 8.0 | 有 | **0** | 规则 |
| 3 | `__autoload()` | 8.0 | 有 | **0** | 规则 |
| 4 | `mysql_*` 全系列 | 7.0 | 有 | **0** | 规则 |
| 5 | `mcrypt_*` 全系列 | 7.2 | 有 | **0** | 规则 |
| 6 | `ereg()` / `eregi()` / `split()` / `spliti()` | 7.0 | 有 | **0** | 规则（`split(` 的 3 处命中全在内联 JS） |
| 7 | `money_format()` | 8.0 | 有 | **0** | 规则 |
| 8 | `strftime()` / `gmstrftime()` | 8.1 弃用 | 有 | **0** | 规则（级别 HIGH，非 BLOCKER） |
| 9 | `get_magic_quotes_gpc()` | 8.0 | 有 | **0** | 规则 |
| 10 | `hebrevc()` / `convert_cyr_string()` | 8.0 | 有 | **0** | 规则 + 人工 grep |
| 11 | `restore_include_path()` | 8.0 | 有 | **0** | 规则 + 人工 grep |
| 12 | `fgetss()` / `gzgetss()` | 8.0 | 有 | **0** | 规则 + 人工 grep |
| 13 | `image2wbmp()` | 8.0 | 有 | **0** | 规则 + 人工 grep |
| 14 | **`ezmlm_hash()`** | 8.0 | **无（v1.1 召回夹具暴露的缺口）** | **0** | **仅人工 grep**：`grep -rn --include="*.php" ezmlm_hash newPlan/morrishk.net`（排除 `messages/`）= 0 行 |
| 15 | `(unset)` 转换 | 8.0 | 有 | **0** | 规则 |
| 16 | **`(real)` 强制转换** | 8.0 | **v1.0 无 → v1.1 已补** | **0** | 规则（重扫确认） |
| 17 | **字符串花括号下标 `$str{0}`（读取形式）** | 8.0 | **v1.0 仅覆盖赋值形式 → v1.1 已补** | **0** | 规则（重扫确认） |
| 18 | **`preg_replace` 的 `/e` 修饰符** | 7.0 | **v1.0 无 → v1.1 已补（原始文本层检查）** | **0** | 规则（站内 9 处 `preg_replace` 均无 `e`，人工 grep 复核） |
| 19 | 单参 `parse_str($str)` | 8.0 | 有 | **0** | 规则 |
| 20 | **必需参数在可选参数之后** | 8.0 | **v1.0 无 → v1.1 已补（签名解析）** | **0** | 规则（重扫确认） |

> **修正说明**：v1.0 把 `utf8_encode()`/`utf8_decode()` 放进"移除项"表，实际是 8.2 弃用（不致命），已在 §2.3。
> **结论口径（R2）**：本批 20 类构造在站内未出现（其中第 14 项靠人工 grep 兜底）。
> 据此可以说"不存在 PHP 8.0 一跑即致命的语法/函数"；**不能**据此说"业务代码已兼容 8.4"——后者需运行期验证（§5、§6.3）。
> 按评审意见，**本版不再扩充规则、不再重复扫描同一批文件**；`ezmlm_hash` 只登记缺口。

### 2.3 PHP 8.x 弃用项：命中与判定

| # | 变更 | PHP 版本 | 本项目中 | 判定 |
|---|---|---|---|---|
| 1 | **隐式可空参数** `function f(string $x = null)` | 8.4 弃用 | 业务代码 **0 命中** | ⚠️ 业务代码无类型声明，属"结构上不会触发"，**不等于**已验证；风险在 Yii 与 vendor |
| 2 | **`null` 传给非空内建函数参数** | 8.1 弃用 | **~120 处候选**（§2.5.3） | ⚠️ 静态无法判定，需运行期观察 |
| 3 | **动态属性** | 8.2 弃用 | 业务代码未命中；集中在 3 个 vendor 包 | ⚠️ 见 §3.3 |
| 4 | **`${var}` 字符串插值** | 8.2 弃用 | **0 命中** | ✅ `snsii/JsBlock.php:40` 的 `'${1}'` 是正则替换模式 → 假阳性 |
| 5 | **字符串↔数字松散比较语义** | 8.0 变更 | **20 处**（§2.5.1） | ✅ 逐条分析语义不变，无需修改 |
| 6 | **SPL 接口返回类型** | 8.1 | 业务代码实现 `ArrayAccess/Iterator/Countable/JsonSerializable` = **0** | ✅ 业务代码免疫；框架侧由 Yii 2.0.46+ 修（§3.1） |
| 7 | **`utf8_encode()` / `utf8_decode()`** | 8.2 弃用 | **0 命中** | ✅ |
| 8 | **mysqli 默认抛异常** | 8.1 | **不适用** | ✅ 实际用 PDO（`config/db.php:5` 为 `mysql:` DSN），PDO 一直 `ERRMODE_EXCEPTION` |
| 9 | **`E_STRICT` 常量弃用** | 8.4 | 未显式引用 `error_reporting`/`E_STRICT` | ✅ 继承 php.ini 默认值 |
| 10 | **浮点转整型隐式截断弃用** | 8.1 | 未定位到显式 `(int)$float` 价格/库存计算 | ✅ 低风险，回归时覆盖价格/库存页 |
| 11 | **`get_class()` 无参调用** | 8.3 弃用 | **0 命中** | ✅ |
| 12 | **`mb_strrpos()` 第三参传编码** | 8.0 弃用 | **0 命中** | ✅ |

### 2.4 假阳性清单（防误改）

| 位置 | 表面命中 | 真相 |
|---|---|---|
| `views/cart/index.php:211,275` | `each(` | jQuery `$('...').each(function(){...})`，内联 JS |
| `modules/ejadmin/views/ad/chart.php:77,82,84` | `split(` | 内联 JS `urlStr.split("?")` |
| `snsii/JsBlock.php:40` | `'${1}'` | `preg_replace` 的**替换模式**字符串，不是 PHP 变量插值 |
| `snsii/Cf.php:32` | `ereg` | 品牌名 `rochester-electronics` 的子串 |
| `mail/QuickOrder.php:19,22` 等 8 处 | `each(` | `foreach(` 的子串匹配 |
| `controllers/PageController_bak0609.php`、`ProController_bak.php` | 各类 | **备份文件**，见 §4 P1-5 |

### 2.5 需人工复核的四类清单

#### 2.5.1 松散比较（20 处）—— 语义全部不变，无需修改

PHP 8.0 收紧了字符串↔数字比较（`0 == "abc"` 由 `true` 变 `false`）。逐条核对：

| 文件:行 | 表达式 | 操作数实际类型 | PHP 8 行为 |
|---|---|---|---|
| `controllers/LangController.php:31` | `$file == 'attr'` 等 | string vs string | 不变 |
| `controllers/LangController.php:45` | `$item[2] != 'en'` | string vs string | 不变 |
| `controllers/MfrController.php:58` | `$MRow['ProNum'] == 0` | DB 返回 `"0"` 或 `null` | `"0"==0` true；`null==0` 仍 true → 不变 |
| `controllers/PageController.php:38` | `$Links == 'contact-us'` | string vs string | 不变 |
| `controllers/PageController_bak0609.php:36` | 同上（备份文件） | — | 见 P1-5 |
| `controllers/ProController.php:108` | `$Mid == 0` | int | 不变 |
| `controllers/ProController_bak.php:108` | 同上（备份文件） | — | 见 P1-5 |
| `controllers/SiteController.php:138,144,157` | `$Act == 'Item'/'List'/'Domain'` | string vs string | 不变 |
| `models/SnSiiCart.php:78` | `count(...) == 0` | int | 不变 |
| `models/SnSiiInfo.php:45` | `$this->IsHttp == 1` | DB 返回 `"1"` | `"1"==1` true → 不变 |
| `models/SnSiiProductCategory.php:49` | `$app->language != 'en'`；`params['IsAdmin'] == false` | string；`0`/`false`/`null` | 全部仍为 true → 不变 |
| `snsii/Cf.php:58,89,119,141,170,198`（6 处） | `$tempA['success'] == 'true' \|\| $tempA['success'] == 1` | string vs string / int | `"true"==1` 在 7 与 8 均为 `false`，有效分支是 `== 'true'` → 不变 |
| `snsii/SnSiiLinkPager.php:62` | `$i == $currentPage` | int vs int | 不变 |

**结论**：20 处无一处落入危险区（危险区是"数字字符串与非数字字符串比较"）。可延后到 P2 统一为 `===`，不属升级前置。

#### 2.5.2 表单加载缺 `isPost()` 守卫（20 处）—— 既有健壮性问题

```
controllers/CartController.php:28
controllers/PageController.php:40
controllers/PageController_bak0609.php:38        ← 备份文件
modules/ejadmin/controllers/AdController.php:46,59
modules/ejadmin/controllers/HelpController.php:70,83,149,162
modules/ejadmin/controllers/InfoController.php:70,83,149,162
modules/ejadmin/controllers/ManageController.php:47
modules/ejadmin/controllers/NewsController.php:75,88,154,167
modules/ejadmin/controllers/ProductController.php:95,177
```

**为什么不是 PHP 8 变更**：`Model::load()` 在 `$data` 为空数组时返回 `false`，该行为 7.4 与 8.4 一致（`if ($scope === '' && !empty($data))` 未变）。v1.0 已就此更正过扫描器的 `behavior_change` 标签错误。

**为什么仍要改**：全站 `isPost` 命中数为 **0**。GET 访问这些 action 会直接进 `load()` 返回 `false`，靠 `&&` 短路兜底。当前不出错是巧合。加守卫成本极低。

#### 2.5.3 可能传 `null` 的内建函数调用（~120 处候选）

| 函数 | 命中数 | 风险说明 |
|---|---:|---|
| `str_replace(` | 43 | 多数操作数是字面量，风险低 |
| `intval(` | 20 | 接受 `null`，**不在弃用范围** |
| `substr(` | 15 | 若首参为 DB `NULL` → 弃用告警 |
| `trim(` | 13 | 同上 |
| `strlen(` | 12 | 同上 |
| `strtolower(` | 10 | 同上 |
| `strtoupper(` | 5 | 同上 |
| `htmlspecialchars(` | 2 | 若为 `null` → 弃用（且与 XSS 相关，值得单看） |

**处置原则**：**不做盲改**。静态无法区分字面量与 DB 值；盲改 120 处引入回归风险，收益为负。正确做法是 staging 开 `E_ALL` 跑全站路径，用日志反查真实命中点。

#### 2.5.4 输入层：CSRF 校验被显式关闭（9 个控制器）—— 本条已按评审意见重写

**v1.0 的说法（撤回）**：「直读 `$_POST`/`$_REQUEST` 9 处，绕过了 Yii 的请求层（无 CSRF 校验）」。**这个因果链不成立**——读取超全局变量本身不能跳过 CSRF 校验。

**本次核实的事实**：

| 事实 | 证据 |
|---|---|
| `enableCsrfValidation` 被显式设为 `false` 的控制器：9 个 | `controllers/CartController.php:18`、`controllers/SearchController.php:29`、`modules/ejadmin/controllers/{Ad:25, Api:25, Category:29, Help:30, Info:30, News:30, Product:30}Controller.php` |
| 后台基类有登录鉴权，但鉴权之后没有 CSRF 保护 | `commands/AdminController.php` 的 `behaviors()` 仅配 `AccessControl`（`roles: ['@']`）与 `VerbFilter`（仅 `logout` 限 POST） |
| 直读 `$_POST` 的 9 处，恰好全部落在上述 CSRF 关闭的控制器内 | `Category:41,84`、`Help:42,111`、`Info:42,111`、`News:42,116`、`Product:42`（另 `Ad`/`Api` 有 CSRF 关闭但未见直读） |
| 直读的用途 | `$posted = current($_POST['SnSiiX'])` — 取 GridView 行内编辑的第一条记录，再拼 `$post` 交给 `load()` |

**更正后的定性**：

1. **CSRF 风险是真实的，但成因是配置**：9 个控制器关闭了 CSRF，其中 7 个是后台写操作控制器。攻击者可诱导已登录管理员访问恶意页面，向后台端点发 POST（Cookie 自动携带），校验不存在 → 请求被执行。这属**既有安全缺陷，与 PHP 版本无关**，但升级窗口是修复的最佳时机。
2. **直读 `$_POST` 是另一件事**：它绕过的是 Yii 的 `Request` 抽象与参数过滤/类型转换，导致输入未经验证直接进入 `load()`。风险是**输入校验**，不是 CSRF。
3. **两件事都要修，但报告不能混写**。修复顺序：先开 CSRF（改配置，影响面需评估，因为后台 GridView 行内编辑是 AJAX 提交，必须同步补 CSRF token），再收口 `$_POST` 直读。

> 附带发现（不属本次范围，建议另立安全项）：`config/web.php` 中 mailer 使用硬编码的第三方 SMTP 账号口令；`config/db.php:7` 数据库口令明文入库。

---

## 3. 依赖检查结果

### 3.1 Yii2 版本裁定（按评审要求改为可对账证据）

| 项 | 值 | 来源 |
|---|---|---|
| `composer.json` 声明 | `"yiisoft/yii2": "~2.0.14"`（`composer.json:18`） | 文件 |
| `composer.lock` 实际锁定 | **2.0.44**（`reference: fa89647a2d2c`） | lock |
| 2.0.44 发布 | **2021-12-30** | lock `time` |
| 2.0.44 的 `require.php` | **`>=5.4.0`**（无上界） | lock `require` |
| 最新稳定版 | **2.0.55**，2026-05-09 发布，`require.php = >=7.4.0` | packagist `p2/yiisoft/yii2` |
| 2.0.56 | 仍在开发中（CHANGELOG 首节 "under development"） | 上游 CHANGELOG |

**2.0.44 落后了哪些可对账的修复**（全部来自上游 `framework/CHANGELOG.md`，非推测）：

| 目标 | 进入版本 | CHANGELOG 条目 |
|---|---|---|
| PHP 8.1 整体兼容 | 2.0.45 / 2.0.46 | `#19041 Fix PHP 8.1 issues`（2.0.45）；`#19235 Fix return type compatibility of yii\web\SessionIterator … for PHP 8.1`、`#19380 passing non string to trim() in yii\db\Query`（2.0.46） |
| PHP 8.2 支持 | 2.0.48 | `#19749 Add PHP 8.2 support`；`#19635 PHP 8.2 compatibility fix for DateValidator` |
| PHP 8.4：`E_STRICT` 常量 | 2.0.52 | `#20282 Fix compatibility with PHP 8.4: deprecated constant E_STRICT` |
| PHP 8.4：session 处理器 | 2.0.52 | `#20140 Fix compatibility with PHP 8.4: calling session_set_save_handler()` |
| PHP 8.4：`trigger_error` | 2.0.53 | `#20348 Passing E_USER_ERROR to trigger_error() is deprecated since PHP 8.4` |
| PHP 8.4：session 配置项 | 2.0.53 | `#20347 remove usage of session.use_trans_sid / use_only_cookies` |
| 8.1+ `strpos(null)` 弃用 | 2.0.55 | `#20697 loadTableIndexes() … causing strpos() deprecation on PHP 8.1+` |

**独立验证**：拉取 2.0.55 的 `framework/web/SessionIterator.php` 与 `framework/db/ArrayExpression.php`，确认 `#[\ReturnTypeWillChange]` 已在用（分别 5 处 / 6 处）。

**v1.0 两处表述已更正**：

| v1.0 说法 | 核实结果 |
|---|---|
| "Yii 2.0.45 才为 ArrayAccess/Iterator/Countable/JsonSerializable 补上 `#[\ReturnTypeWillChange]`" | CHANGELOG 对应条目在 **2.0.46**（`#19235`），不是 2.0.45。已改为按条目引用 |
| "2.0.53 起大规模补 `?type`，2.0.55 收敛"（指隐式可空参数） | CHANGELOG **没有任何** "implicitly nullable" 相关条目，无法证实。已降级为"**待 staging 实测**"：8.4 下框架内部隐式可空告警量未知 |

**关键陷阱（保留）**：所有 Yii 2.0.x 的 `require.php` 都是**开放下界、无上界**。Composer 永远不会因 PHP 8.4 拒绝安装 Yii，官方也从未在 `require` 里声明支持 8.4。**"装上了"不等于"支持了"。**

**处置**：`~2.0.14` → `^2.0.55`。且必须先升 Yii、PHP 仍留 7.4 验证一轮（拆变量）。
注意：这个阶段可用的测试链**仍是 Codeception 4**（按 §3.2.4 的解析方案，新工具链要求 PHP 8.4 或更高），
所以 7.4 回归只能靠既有用例 + 人工冒烟，**不能假设"升级后的测试链会兜住框架升级"**。

**同时需要覆盖的回归面（评审指定，写入 §5 用例集）**：Yii Model / ActiveRecord / 数据库访问；后台 Kartik Grid 与分页；
登录与权限；表单验证；邮件与文件上传；商品详情 / 分类 / 搜索等高频路径。

### 3.2 Composer 解析阻塞：4 个，分两类（R1 修订）

**方法**：不只引用 `composer prohibits php 8.4.0 --locked` 的输出，而是从 `composer.lock` 的 131 个包重建依赖图，对每个 `require.php` 做约束求值独立复算；再用临时副本做实际求解验证。

**复算结果：恰好 4 个，与 `composer prohibits` 一致**（`behat/gherkin` 的 `~7.2|~8.0`、codeception 系的 `>=5.6.0 <9.0` 均覆盖 8.4，不构成阻塞）。
复现证据：`solve/01-prohibits-php84-locked.txt`（Composer 2.5.8，lock md5 `654cb46e…`，输出与仓库源文件一致）。

| # | 包 | 锁定 | `require.php` | 完整反向依赖链 | 类型 |
|---|---|---|---|---|---|
| B1 | `codeception/module-yii2` | 1.1.5 | `>=5.6.0 <=8.1 \| ~8.1.0` | 根 `require-dev` `^1.0.0` → 1.1.5 | 结构性 |
| B2 | `symfony/browser-kit` | v4.2.4 | `^7.1.3` | 根 `require-dev` `>=2.7 <=4.2.4`（**上限 pin**）+ `codeception/lib-innerbrowser 1.5.1`（`>=2.7 <6.0`）→ 落在 4.2.4 | 结构性 |
| B3 | `phpspec/prophecy` | v1.15.0 | `^7.2 \|\| ~8.0, <8.2` | `module-yii2 1.1.5` → `codeception 4.1.29` → `codeception/phpunit-wrapper 8.1.4`（`phpunit ^8.0`）→ `phpunit 8.5.23`（`prophecy ^1.10.3`）→ 1.15.0 | 结构性 |
| B4 | `symfony/service-contracts` | v1.1.2 | `^7.1.3` | **`symfony/console v5.4.3`**（`service-contracts ^1.1\|^2\|^3`）← `codeception 4.1.29`（`console >=2.7 <6.0`）← `module-yii2 1.1.5` | **锁文件滞后** |

#### 3.2.1 结构性约束型（B1、B2、B3）

这三项的共同根因是**根约束写死**，不是某个包"不支持 8.4"：

- `codeception/codeception: ^4.0`（`composer.json:38`）把整个测试链锁在 4.x → 连带 `phpunit-wrapper 8.x` → `phpunit 8.5` → `prophecy 1.15`，并把 `console` 锁在 5.x 以下、`browser-kit` 锁在 4.x。
- `symfony/browser-kit: >=2.7 <=4.2.4`（`composer.json:41`）是**显式上限**，任何 ≤4.2.4 的版本都排除 8.4，属于"写死的门"。

**必须作为一批修改**：

| 根约束 | 现约束 | 目标（经求解验证） | 说明 |
|---|---|---|---|
| `codeception/codeception` | `^4.0` | `^5.0`（实测落到 5.3.7） | 公共根 |
| `codeception/module-yii2` | `^1.0.0` | `^1.1.12`（或 `^2.0`） | **v1.1 写的 `^1.3` 是错的**：上游没有 1.3.x，1.1.x 之后直接跳 v2.0（`v2.0.5` 要求 `php ^8.3`） |
| `codeception/module-filesystem` | `^1.0.0` | `^3.0` | 1.0.3 要求 `codeception ^4.0`，会与 5.x 冲突（求解实测报错） |
| `codeception/module-asserts` | `^1.0.0` | `^3.0` | 同上 |
| `symfony/browser-kit` | `>=2.7 <=4.2.4` | **移除该直依赖** | 移除后仍由 `lib-innerbrowser` 传递引入，实测自动到 v8.0.14 |

#### 3.2.2 锁文件滞后型（B4）：单点更新**经实测不能独立完成**

`browser-kit 4.2.4` 的 `require` 只有 `php` 与 `symfony/dom-crawler`，**不含** `service-contracts`；真实来源是 `symfony/console`。
v1.1 曾写"可单点解除"，本次实际执行后**必须修正**：

| 试验 | 命令 | 结果 |
|---|---|---|
| ① 在 8.4 平台下只更新该包 | `composer config platform.php 8.4.0` 后 `composer update symfony/service-contracts --with-dependencies --dry-run` | **失败，退出码 2**。Composer 拒绝产出对平台不合法的 lock：B1/B2/B3 仍锁定，逐个报 `php` 不满足 |
| ② 隔离验证约束是否允许更高主版本 | 最小工程 `{"require":{"php":">=7.4 <8.5","symfony/console":"5.4.3"},"config":{"platform":{"php":"8.4.0"}}}` → `composer update --dry-run` | **成功**，锁定 `symfony/service-contracts v3.8.1` |

**结论**：`service-contracts` 的性质是"锁文件滞后"，**不是**结构性阻塞——它的上游约束允许 3.x；但"单点更新即可解除"**不成立**，
因为只要其余三项还在 lock 里，任何 update 都会因平台不合法而整体失败。它只能在**协调升级时被动升级**。
完整输出与命令：`solve/02-single-point-service-contracts.txt`、`solve/03-probe-console-service-contracts.txt`。

#### 3.2.3 协调升级的求解验证（试验，未落地）

按 §3.2.1 的五处改动 + `config.platform.php=8.4.0` 做全量 dry-run：**求解成功，122 个包**（原 131）。
完整输出：`solve/04-p0-coordinated-dryrun.txt`；lock 全量差异：`solve/05-lock-delta.md`。

必须提前知道的三个副作用：

| 现象 | 数据 | 风险 |
|---|---|---|
| PHPUnit 跨 4 个大版本 | 8.5.23 → **12.5.44** | 断言、注解、测试生命周期 API 破坏性变更，现有 `codeception/verify 1.1.0`、`specify 0.4.6` 需逐个验证 |
| PhpSpreadsheet 被动跳 4 个大版本 | 1.19.0 → **5.11.0** | 因 `moonlandsoft/yii2-phpexcel` 约束为 `*`；导出功能必须专项回归（也说明该死依赖应先移除再升级） |
| `dev-master` 实际漂移 | `kartik-v/yii2-grid` 由 `09f8e76` → `c47a153` | 印证 §4 P1-4 的判断：当前 lock 可复现，但重新求解就会换 commit |

#### 3.2.4 本次解析方案的平台下界：要求 PHP 8.4 或更高（口径已按 v1.2.1 勘误收窄）

对 `solve/04` 的 lock 逐包取 `require.php` 下界，最高者为**该解析方案**的整体下限：

| 包 | 版本 | 下界 |
|---|---|---|
| `symfony/*`（console / yaml / string / finder / event-dispatcher / dom-crawler / css-selector / var-dumper） | v8.0.x | **`>=8.4`** |
| `phpunit/phpunit` | 12.5.44 | `>=8.3` |
| `codeception/codeception` | 5.3.7 | `^8.2` |
| `codeception/module-filesystem` / `module-asserts` | 3.0.2 / 3.3.0 | `^8.2` |
| `yiisoft/yii2` | 2.0.55 | `>=7.4.0` |

> **结论的准确边界（v1.2.1 勘误，评审要求）**：
> 本次协调升级 dry-run 的**实际解析结果包含 Symfony 8.0.x**，故**该解析方案**要求 PHP 8.4 或更高。
> 这**不等于**已证明"所有 Codeception 5 依赖组合的理论最低平台版本都是 8.4"——把 Symfony 组件约束在 6.4 分支、
> 或改用更低主版本的 PHPUnit，是否能把下界压到 8.2，**需要另做受约束求解与实跑验证**，本次未完成。
> 该勘误不影响本项目以 PHP 8.4 为目标，也不改变"**上述解析方案不能在 PHP 7.4 上运行**"这一事实。

**对本项目路线的实际影响**：升级后的 Codeception 5 工具链（按本次解析方案）**无法在 PHP 7.4 上启动**，
故原计划"第 3 步在 PHP 7.4 上升测试链"不可执行，7.4 阶段只能用**既有 Codeception 4 用例**做回归。

**已做过的部分降界尝试与结果**：只 pin `symfony/console:^6.4` + `symfony/yaml:^6.4`，结果 `browser-kit` 仍被拉到 v8.0.14、
`phpunit` 仍为 12.5.44，下界仍为 8.4。这只说明"pin 两个组件不够"，**不构成"无法降低"的证明**。
若要真正验证理论下界，需同时约束 symfony 家族（含 `browser-kit`/`dom-crawler`/`css-selector`/`finder`/`event-dispatcher`）与
`phpunit ^11`，并实跑测试。详见 `solve/06-toolchain-min-php.md`。

**阻塞范围**：4 个全在 `packages-dev`（60 个），`packages`（71 个生产依赖）**无一被硬拦**。

- 生产部署链路（`composer install --no-dev`）在 8.4 上不会被 Composer 拒绝。
- **CI / 本地开发 / 自动化测试链路会断**。它阻塞的是**验证能力**，不是**运行能力**——但没有验证能力就不该动生产，故仍属 P0。

### 3.3 "停维护包"逐项复核（按评审要求：区分"维护状态"与"8.4 运行风险"）

> 评审意见成立：v1.0 把"上游停更"直接写成了"8.4 会出问题"，证据不足。以下是重做后的三栏：**已证事实 / 未证事实 / 影响面**。

| 包 | 锁定 | 已证事实（可查证） | 未证事实 | 影响面（站内引用） | 定级 |
|---|---|---|---|---|---|
| `swiftmailer/swiftmailer` | v6.3.0 | packagist 元数据 `abandoned: symfony/mailer`；`require.php >=7.0.0`（**无上界**，8.4 可安装） | 8.4 下是否运行期报错、报什么错 | **活跃**：`config/web.php:46` 启用 `Swift_SmtpTransport`；`controllers/CartController.php:221` 发包、`models/ContactForm.php:53` 联系表单 | **P1（高影响面）**：替换必要性来自"上游已宣告弃用 + 关键链路在用"，不是"已证 8.4 崩溃" |
| `moonlandsoft/yii2-phpexcel` | 2.0.0 | lock 的 `require` 是 **`phpoffice/phpspreadsheet: "*"`**，**不是 PHPExcel**；lock 中不存在 `phpoffice/phpexcel`；`phpspreadsheet` 锁定 1.19.0，`require.php ^7.2 \|\| ^8.0`（覆盖 8.4） | 8.4 下的 deprecation 量 | **零引用**：全站无 `PHPExcel`、无 `moonlandsoft` 引用 | **v1.0 误判，撤回**。改为"**死依赖**，建议直接从 composer.json 移除"（P2） |
| `mihaildev/yii2-ckeditor` | 1.0.1 | packagist 最后发布 **2014-11-19**（v1.0 写"2016 年后无更新"，**日期有误**）；无 `require.php` 约束 | 动态属性告警量（8.2+）、CKEditor 4 自身安全状态 | 1 处：`snsii/ActiveField.php:28` | **P2（低）**：PHP 侧代码量极小，风险主要是 CKEditor 4 的浏览器端与安全问题，不是 8.4 解析 |
| `jaeger/querylist` | V4.2.8 | **未 abandoned**；上游仍在维护，最新 **V4.4.7（2026-02-02）**，`require.php >=8.1` | 4.2.8 在 8.4 的具体行为 | 2 个采集命令：`commands/CController.php`、`CControllerBF.php`（CLI，非 Web 链路） | **v1.0 判断不成立**。改为"**版本旧但可升级**：升到 4.4.x 即官方支持 8.x"（P1） |

**结论重述**：生产依赖侧的真实问题是**三类**，而不是"4 个停维护包"：

1. **框架太旧**：Yii 2.0.44（P0，§3.1）。
2. **关键链路依赖已弃用**：swiftmailer（邮件在活跃使用，替换有业务影响，需独立排期）。
3. **陈旧但可修**：QueryList 4.2.8（升 4.4.x）、`dev-master` 快照（§4 P1-4）、1 个死依赖（yii2-phpexcel）。
   `yii2-ckeditor` 与 `yii2-elasticsearch` 属"低影响面、可延后"。

**运行风险的正确取得方式（尚未执行）**：`composer install --no-dev` 装出 `vendor/` 后，用同一个扫描器对 `vendor/swiftmailer`、`vendor/phpoffice`、`vendor/mihaildev`、`vendor/jaeger` 四个目录单独扫一遍，再在 staging 开 `E_ALL` 观察。**在此之前，任何"这 4 个包在 8.4 上会崩/不会崩"的说法都不成立。**

### 3.4 与 v1.0 的差异（勘误汇总）

| # | v1.0 说法 | v1.1 核实 | 修正理由 |
|---|---|---|---|
| 1 | BLOCKER 3 个 → 后改 4 个 | **4 个成立**，且独立复算与 composer 一致 | 补 `symfony/service-contracts` |
| 2 | `service-contracts` 由 `browser-kit` 传递引入 | **错**，来自 `symfony/console` ← codeception | lock 依赖图复算（§3.2） |
| 3 | 「mysqli 默认抛异常」列为 MEDIUM | **不适用**，`config/db.php:5` 为 PDO | 已移除 |
| 4 | 「业务代码兼容点未扫描」列为未验证 | 已完成，移除项 0 命中 | 扫描 + 召回自检 |
| 5 | `yii2-phpexcel` 依赖 PHPExcel（2019 停维护） | **错**，依赖 `phpoffice/phpspreadsheet`，且站内零引用 | lock `require` 实测 |
| 6 | `yii2-ckeditor` 2016 年后无更新 | 最后发布 **2014-11-19** | packagist |
| 7 | `querylist` 长期低维护、phpquery 在 8.x 有兼容问题 | 未 abandoned，上游 2026-02 仍在发版（4.4.7，PHP ≥8.1） | packagist |
| 8 | "直读 `$_POST` = 绕过 CSRF" | **因果关系不成立**；真正原因是 9 个控制器 `enableCsrfValidation=false` | 配置与代码复核（§2.5.4） |
| 9 | 备份文件"会被自动加载" | 两个 bak 文件与在线文件**同名同类**，Yii 自动加载不会命中，路由也无法触达 | 见 §4 P1-5 |
| 10 | "移除项 20 项全部 0 命中" | 其中 4 项当时无规则覆盖，属真空值；补规则重扫后仍为 0 | 召回自检（§1.2） |
| 11 | Yii "2.0.45 补 ReturnTypeWillChange"、"2.0.53 大规模补 `?type`" | 前者实为 2.0.46；后者 CHANGELOG 无对应条目 | 上游 CHANGELOG 对账（§3.1） |

---

## 4. 升级必须修改的清单（已按评审意见重新分级）

分级口径：**P0 = 不做就无法进入 staging 试验**；**P1 = 行为/安全/可维护性，升级窗口内应一并处理**；**P2 = 代码卫生，可延后**。

### P0：8.4 求解与验收的前置条件

| # | 位置 | 现状 | 改为（经 `solve/04` 求解验证） | 为什么是 P0 |
|---|---|---|---|---|
| P0-1 | `composer.json:18` | `"yiisoft/yii2": "~2.0.14"` | `"^2.0.55"` | 2.0.44 早于 8.1/8.2/8.4 全部修复（§3.1 逐条） |
| P0-2 | `composer.json:38` | `"codeception/codeception": "^4.0"` | `"^5.0"` | **4 个阻塞项的公共根**：codeception 4 锁死 `phpunit-wrapper → phpunit 8 → prophecy`，并把 console 锁在 5.x、browser-kit 锁在 4.x |
| P0-3 | `composer.json:41` | `"symfony/browser-kit": ">=2.7 <=4.2.4"` | **删除该直依赖** | 显式上限，任何 ≤4.2.4 都排除 8.4；删除后仍由 `lib-innerbrowser` 传递引入（实测到 v8.0.14） |
| P0-4 | `composer.json:43` | `"codeception/module-yii2": "^1.0.0"` | `"^1.1.12"`（或 `^2.0`） | **v1.1 写的 `^1.3` 不存在**：上游 1.1.x 后直接跳 v2.0；`v2.0.5` 要求 `php ^8.3` |
| P0-5 | `composer.json:42,44` | `module-filesystem: ^1.0.0`、`module-asserts: ^1.0.0` | `^3.0` / `^3.0` | 1.0.3 要求 `codeception ^4.0`，与 5.x 冲突（求解实测报错） |

> 五项必须**同一批改、同一批验证**：单独改任何一项都会让 Composer 进入更差的中间态（`solve/02` 就是这种失败）。
> 通过标准：`composer update --dry-run` 在 `platform.php = 8.4.0` 下成功，且 `composer prohibits php 8.4.0 --locked` 输出为空。
> 另需注意 §3.2.3 的三个副作用（PHPUnit 12 / PhpSpreadsheet 5.11 / dev-master 漂移）。

### P1：行为、安全与可维护性

| # | 位置 | 问题 | 改法 | 依据 |
|---|---|---|---|---|
| P1-1 | `composer.json:17` | `"php": ">=5.6.0"` | `">=7.4 <8.5"`，并设 `config.platform.php` 固定 CI 目标 | **理由已按评审调整**：这是"缺少上界保护"，不是"install 成功后运行期炸的根因"。作用是让 Composer 在未来 PHP 8.5/9 上提前拒绝，而不是修复本次故障 |
| P1-2 | 9 个控制器 | `enableCsrfValidation = false`（含 7 个后台写控制器） | 恢复 CSRF；AJAX 行内编辑（GridView editable）同步补 token 与 `csrfParam` | §2.5.4。**这是真正的 CSRF 暴露点** |
| P1-3 | 9 处 `$_POST` 直读 | 绕过 `Request` 抽象与参数过滤 | 收敛到 `Yii::$app->request->post()`，并走 `load()` | 输入层问题，与 CSRF 分开 |
| P1-4 | `composer.json:23,25` | `kartik-v/yii2-grid: @dev`、`yii2-bootstrap4-dropdown: @dev` | 改为具体 tag | **理由已按评审调整**：lock 已记录 commit（`09f8e76` / `b65783f`），**当前构建可复现**；风险是根约束 `@dev` 在下次重新求解时漂移。属可维护性，不是阻塞 |
| P1-5 | `controllers/PageController_bak0609.php`、`controllers/ProController_bak.php` | 备份文件留在生产代码树 | 移出版本库（保留归档分支） | **理由已按评审调整**：两个文件与在线文件**同名同类**（均为 `app\controllers\PageController` / `ProController`），Yii alias 加载只找 `PageController.php`，**不会命中 bak**，路由也无法触达。**下载风险已按 §6.1 的适用范围降级**（限定在本 vhost 的常规静态映射内，不覆盖其他 vhost / alias / 软链接 / 额外文件服务入口）。真实风险只剩：① `composer dump-autoload -o` 的 classmap 歧义；② 审计与维护混淆。**清理前须做两件确认**：（a）用实际部署目录核对此二文件的物理路径与仓库快照一致；（b）确认生产 Composer autoload 是否启用优化 classmap（`optimize-autoloader` / `classmap-authoritative` / `--classmap-authoritative`），**不要仅凭文件名推断 classmap 一定冲突** |
| P1-6 | `config/db.php:7` | 数据库口令明文入库 | 移入环境变量 | 安全项（建议不入 Git 历史的同时轮换口令） |
| P1-7 | `config/db.php:8` | `'charset' => 'utf8'` | `utf8mb4` | MySQL 8.0 中 `utf8` 是 `utf8mb3` 别名且已弃用；与新库策略不一致 |
| P1-8 | `swiftmailer` / `yii2-swiftmailer` | 上游已宣告弃用，邮件链路活跃 | 换 `symfony/mailer` 或 `yii2-symfonymailer` | §3.3：影响面已证（询盘/联系表单），运行风险待实测 |
| P1-9 | `jaeger/querylist` V4.2.8 | 版本停在 2021 | 升 4.4.x（官方支持 8.1+） | §3.3 |

### P2：代码卫生（不阻塞升级）

| # | 范围 | 建议 |
|---|---|---|
| P2-1 | 20 处松散比较（§2.5.1） | 统一 `===`。已验证语义不变，可延后 |
| P2-2 | ~120 处可能传 `null` 的内建调用（§2.5.3） | **不要盲改**。staging `E_ALL` 跑全站，用日志反查后定点修 |
| P2-3 | `messages/` 400 文件 / 230,492 行 | 纯数组，8.4 风险 0；体量占代码库 93%，建议迁出主仓或改 JSON |
| P2-4 | `moonlandsoft/yii2-phpexcel` | 站内零引用，直接移除依赖 |
| P2-5 | `mihaildev/yii2-ckeditor`（1 处引用） | 评估换 `2amigos/yii2-ckeditor-widget`；注意 CKEditor 4 本身的安全状态 |
| P2-6 | 20 处缺 `isPost()` 守卫 | 加守卫（§2.5.2）。成本极低，可随 P1-2 一起做 |

### 4.1 不需要改的（明确列出，防止过度施工）

| 项 | 结论 |
|---|---|
| 20 个 PHP 8.0 移除函数/语法 | **0 命中**（本次已有规则覆盖，非真空值） |
| `snsii/JsBlock.php:40` 的 `'${1}'` | 正则替换模式，**不是** PHP 插值，不要改 |
| `snsii/Cf.php:32` 的 `ereg` | 品牌名子串，**不是**函数调用，不要改 |
| 内联 JS 里的 `.each(` / `.split(` | JS 方法，**不是** PHP 函数，不要改 |
| mysqli 异常行为 | **不适用**（PDO 驱动） |
| 业务代码的隐式可空参数 | 0 命中（业务代码无类型声明）→ 结构上不触发 |
| 业务代码的 SPL 接口返回类型 | 0 命中（不实现 SPL 接口） |
| `${var}` 插值 | 0 命中 |

---

## 5. 风险分级与验收门槛（按评审意见改写）

| 风险 | 等级 | 触发条件 | 回归重点 |
|---|---|---|---|
| Yii 2.0.44 → 2.0.55 行为差异 | **中** | 框架内部 API 微调 | 后台 CRUD（`modules/ejadmin` 74 文件）、`kartik` 表格、分页器 |
| CSRF 重新启用后的分支变化 | **中高** | AJAX 行内编辑未带 token → 400 | 后台所有 GridView 行内编辑、购物车 |
| `isPost()` 守卫新增后分支变化 | 中 | 现有"靠短路兜底"的流程 | 购物车、后台所有表单提交 |
| `null` 传内建函数的 deprecation | 中 | DB 字段为 `NULL` | 详情页、列表页、价格/库存展示 |
| 动态属性告警 | 中 | PhpSpreadsheet / CKEditor / QueryList | 后台导入导出、富文本编辑、采集 |
| 邮件发送（swiftmailer 已弃用） | **高（影响面）** | 询盘/联系表单 | 询盘通知、订单邮件全链路、到达率 |
| 松散比较语义变化 | **低** | 已验证 20 处全部不变 | 无需专项 |
| 移除函数 | **无** | 0 命中（有规则覆盖） | 无需专项 |

**验收门槛（不再以"deprecation 日志 = 0"为唯一标准）**：

1. **分级日志预算**（三条分别统计，不混算）：
   - 框架层（Yii 2.0.55）deprecation：目标 0；非 0 项逐条登记并给出上游 issue 或本地补丁。
   - 依赖层（vendor）deprecation：按包统计，允许存在但必须有清单与影响说明。
   - 业务层（`controllers/ models/ snsii/ modules/`）deprecation：逐条归零，或书面接受并记录原因。
2. **硬指标**：`Warning` = 0、`Fatal error` = 0、未捕获异常 = 0。
3. **功能指标**：`首页 → 分类 → 详情 → 搜索 → 询盘提交 → 后台审核 → 邮件到达` 全链路通过率 100%。
4. **数据指标**：询盘入库条数与提交数一致；订单金额/库存展示与 7.4 基线逐条比对；邮件实际到达（非 `useFileTransport`）。
5. **对比基线**：同一批用例在 PHP 7.4 + Yii 2.0.44 上先跑一遍留档，8.4 结果与之比对，而不是与"预期"比对。

**必测回归面（评审指定，按此编用例集）**：

| # | 范围 | 覆盖点 |
|---|---|---|
| 1 | Yii Model / ActiveRecord / 数据库访问 | `find()`/`findOne()`/关联查询、`save()` 与验证、事务、schema 缓存（`enableSchemaCache=true`） |
| 2 | 后台 Kartik Grid 与分页 | 排序、筛选、行内编辑（editable，AJAX）、导出、分页器样式 |
| 3 | 登录与权限 | `AdminController` 的 `AccessControl`、`isGuest` 跳转、会话与自动登录 |
| 4 | 表单验证 | 联系表单、询盘表单、后台各 CRUD 表单 |
| 5 | 邮件与文件上传 | swiftmailer → SMTP 实际投递、附件、失败行为；CKEditor 图片/文件上传 |
| 6 | 高频访问路径 | 首页、分类列表、商品详情、搜索、购物车与询盘提交 |

---

## 6. 生产环境信息：已取得证据与剩余缺口（R3 修订）

> v1.0 写"无生产机访问权限"、v1.1 写"4 项待采集"，都不准确。本节按评审方已取得的实证重写：
> 分"已验证 / 部分验证 / 仍缺"三档，**不再要求从头采集**。

### 6.1 已验证（可直接作为设计输入）

| 项 | 结论 | 用途 |
|---|---|---|
| 站点实际运行的 PHP | **PHP 7.4.33-FPM**，经 **Unix socket**（`/tmp/php-cgi-74.sock`）与 Nginx 通信 | 作为**独立 8.4 环境的构建基线**（照此对齐版本形态与通信方式）。生产侧当前**不做任何改动**；"新增池 + 改 `fastcgi_pass`"仅属**未来**灰度的架构可能性，**不构成当前实施建议**，见 §7.4 |
| Nginx `root` | 指向 **`morrishk.net/web`** | 用于判断该 vhost 的常规静态文件映射。**结论适用范围（v1.2.1 收窄）**：在已核实的 morrishk.net Nginx vhost 配置下，两个 `*_bak.php` 位于 document root 之外，不会通过该 vhost 的常规静态文件路径直接下载。**此结论不覆盖**其他 vhost、`alias`、软链接或额外文件服务入口 |
| PHP 8.0-FPM | 已安装但**没有监听进程**，站点未使用 | 不能假设"8.0 已在跑"，8.4 属全新池。**此现状也不构成"再装一个 8.4 池"的先例依据**（§7.4.1 R-1） |
| 其他 PHP-FPM master | 属**其他 Docker 项目**，与 morrishk 运行环境无关 | 避免误把别的容器当作本站运行时；也说明该主机为**多项目共用**，FPM 体系不可为单站改动（§7.4.2） |
| FPM 池参数 | 已取得 `listen`、`user`/`group`、`pm` 相关参数 | 供**独立环境**建池时对齐参数（`pm.max_children` 按目标机内存重算）。生产侧不建池、不改池，见 §7.4.1 R-1/R-2 |
| Nginx vhost | 已取得配置（`fastcgi_pass` 指向 7.4 socket） | 记录**未来**灰度的参考切换点；当前**不修改**该 vhost（§7.4.1 R-3） |

### 6.2 部分验证（方向明确，数值待钉死）

| 项 | 已取得 | 仍缺 | 影响 |
|---|---|---|---|
| PHP 7.4 扩展 | CLI 以 FPM 的 ini 运行取得的模块清单；FPM 侧确认 **GD、MySQLi、PDO** 存在 | FPM **实际加载**的完整清单。唯一有效取得方式是在真实 FPM worker 内采集，而该方式需在生产站点目录放探针文件 → **需单独授权，当前 OPEN**（§6.3）。CLI 结果只作交叉参考 | 决定 8.4 目标机要装哪些 `ext-*`（lock 声明 19 个） |
| PHP 7.4 关键配置 | 已确认 FPM ini 路径与加载情况 | `error_reporting`、`memory_limit`、`session.*` 的取值 | 决定 deprecation 是否会被记录、回归怎么观察 |
| OPcache | 此前盘点结论为"未启用"，本次**仍未确认运行状态** | FPM 运行态只能由真实 worker 取（需授权，**OPEN**）；`php -i` 的 `Opcode Caching` 行仅作交叉参考 | 影响性能基线与 8.4 对比口径；`validate_timestamps` 还会影响部署行为 |

### 6.3 仍缺（8.4 装载与验收的硬前提）

> **本节口径（v1.2.3 勘误，评审裁定）**：G1 / G3 / G4 的取证需要**在生产站点目录放置探针文件**，
> 这属于**生产文件系统写入**，不属于本报告已批准的只读采集范围。**当前未获授权，一律不执行。**
> 相关缺口在获得授权并完成真实 FPM 上下文采集前，均保持 **OPEN（未验证）**。

| # | 缺口 | 具体要什么 | 当前状态 | 为什么不能省 |
|---|---|---|---|---|
| G1 | FPM 实际加载的完整扩展清单 | 真实 7.4-FPM worker 内的 `get_loaded_extensions()`、`PHP_VERSION`、`php_ini_loaded_file()`、`php_ini_scanned_files()`、`extension_dir`，与 lock 的 19 个 `ext-*` 逐项比对。**技术上唯一能取得的方式是在站点目录临时放置探针页**，但这是生产文件系统写入，需系统所有者单独授权。参考方案（**未获批准，不得执行**）见 `prod/prod_baseline.md` §六 | **OPEN · 未获授权** | 缺一个扩展（如 `zip`/`gd`/`intl`）就等于 8.4 环境不可用 |
| G2 | PHP 8.4 目标扩展清单 | 独立 PHP 8.4 环境内 `php -m`，与 G1 做**逐项差异表** | **可在独立环境采集**（不触碰生产） | 这是"目标环境是否等价于生产"的唯一依据。**注意：G2 结果不能反推 G1** |
| G3 | OPcache 运行状态 | 真实 FPM worker 内的 `opcache_get_status()`，取 `Opcode Caching`、`enable_cli`、`validate_timestamps`。与 G1 同因需授权；`php -i \| grep -i opcache` 仅作交叉参考 | **OPEN · 未获授权** | 性能对比与缓存清理流程都依赖它 |
| G4 | MySQL 客户端库 | 真实 FPM worker 内 `mysqli_get_client_info()`、`PDO::ATTR_CLIENT_VERSION`、`phpinfo()` 的 mysqlnd 段。与 G1 同因需授权；CLI 输出不得替代 | **OPEN · 未获授权** | 服务端仍是 5.6.50，跨版本连接需实测（协议层通常兼容） |
| G5 | `vendor/` 实际版本 | 副本上 `composer install` 后 `composer show` 留档 | **可按现有证据独立核验**（不依赖生产探针） | 4 个待核实包的运行风险只能在此之后评估（§3.3） |

> **生产环境临时探针属于生产文件系统写入，不属于本报告已批准的只读采集范围。未经系统所有者单独、明确授权，不得创建、上传或执行探针文件。G1、G3、G4 在获得授权并完成真实 FPM 上下文采集前，均保持未验证状态，不得以 CLI 结果或独立环境结果替代。**

**关于未来的授权流程**（评审补充要求）：若确需采集，应**另行批准**具体文件路径、访问限制、采集字段、执行窗口与删除验证方式；尤其**不得公开暴露完整 `phpinfo()` 页面**。`phpinfo()` 的额外风险在于：访问控制、部署路径或删除确认任一环节出错，都可能短暂暴露 PHP 配置、扩展、路径与环境信息——"采集后会删除"不能把该风险视为零。

**证据不可替代关系**（本节的核心约束，v1.2.3）：

| 来源 | 能否替代 G1/G3/G4 |
|---|---|
| 独立环境 PHP 8.4 的扩展结果（G2） | **不能**。8.4 的扩展清单反推不出生产 7.4-FPM 的扩展情况 |
| CLI 使用 FPM 的 `php.ini` 执行 `php -m` | **不能**。SAPI 不同，ini 扫描路径、`extension_dir`、`disable_functions` 都可能不同 |
| 真实 FPM worker（需授权探针） | 唯一有效来源，当前未获授权 |

### 6.4 待 staging 实测（静态分析到此为止）

| 项 | 方法 |
|---|---|
| Yii 2.0.55 在 8.4 的真实表现 | 起 8.4 + 2.0.55 跑全链路，按 §5 分级日志预算统计 |
| 隐式可空参数告警量（框架侧） | 同上；这是 v1.0 说得最满、证据最弱的一条 |
| ~120 处 `null` 传参的真实命中 | `E_ALL` + `E_DEPRECATED` 记录，按文件聚合反查 |
| 动态属性告警量 | 后台导入导出 + 富文本编辑 + 采集命令专项 |
| 3 个待核实包（swiftmailer / yii2-ckeditor / querylist）的运行行为 | `vendor/` 装好后单目录扫描 + 运行期观察（§3.3） |

---

## 7. 下一步与准入裁定（R4 修订；v1.2.2 增补 §7.4 生产红线）

### 7.1 裁定口径：把两件事分开

| 事项 | 裁定 | 说明 |
|---|---|---|
| **建立隔离的 8.4 测试环境**（独立 Ubuntu 24.04 LTS 主机或独立容器；生产源码快照 + 脱敏数据） | **允许** | 属准备与实验，**不触碰生产服务器与宝塔**（红线见 §7.4） |
| 在测试副本上做 Yii 2.0.55 的 **PHP 7.4 回归** | **允许** | 变量隔离的关键一步 |
| 并行准备 Codeception 5 工具链、编制 8.4 扩展清单 | **允许** | 按 §3.2.4 本次解析方案，该工具链需 PHP 8.4 或更高；只能在 8.4 隔离环境内运行 |
| **在现有生产服务器安装 PHP 8.4-FPM / 新增宝塔 PHP 8.4 运行池** | **不批准（当前不建议）** | 生产机承载多项目，不宜为单站升级叠加运行时、改服务管理关系；见 §7.4 |
| **PHP 8.4 完整验收**（把 8.4 结果当作验收通过） | **暂不批准** | P0 未落地、G1–G5 缺口未补、运行期未验证 |
| **生产 PHP 切换** | **不批准** | 需独立评审 |

### 7.2 建议动作

| # | 动作 | 前置 | 风险 | 备注 |
|---|---|---|---|---|
| 1 | 采集 §6.3 的 **G2**（8.4 目标扩展清单） | 批准 | 无 | 在**独立 8.4 环境**内采集，不触碰生产。**G2 不构成 G1 的替代证据** |
| 1b | ~~采集 G1 / G3 / G4（生产 FPM 上下文）~~ | ~~批准~~ → **需系统所有者单独授权** | — | **当前不执行**。取证须在站点目录放置探针文件，属生产文件系统写入；授权前缺口保持 OPEN（§6.3） |
| 2 | 建**独立** Ubuntu 24.04 LTS 环境（独立主机或独立容器，源码快照 + 脱敏数据） | 批准 | 低 | **不在生产服务器执行**；生产 7.4 与宝塔配置不变（§7.4） |
| 3 | 执行 §4 P0-1 ~ P0-5（5 处根约束），`platform.php=8.4.0` 下 `--dry-run` 通过 | 步骤 2 | 低（不动业务代码） | 通过标准见 §4 P0 表注 |
| 4 | 在副本上升 Yii 2.0.44 → 2.0.55，**PHP 仍 7.4**，用**既有 Codeception 4 用例** + 人工冒烟回归 | 步骤 3 | 中 | §3.1 指定的回归面必须覆盖 |
| 5 | 处理 P1-2 / P1-3（CSRF + `$_POST` 收口） | 步骤 4 | 中高（后台 AJAX） | 独立 PR、独立回归 |
| 6 | 依赖治理：swiftmailer 替换评估、QueryList 升 4.4.x、移除死依赖（含先行移除 `yii2-phpexcel` 以避免 PhpSpreadsheet 被动跳 5.x）；**G5** 在同一副本上 `composer show` 留档 | 步骤 4 | 中 | 邮件需真实收发比对；G5 不依赖生产探针 |
| 7 | 在**隔离 8.4 环境**装 Codeception 5 工具链，重跑 `solve/04` 的 lock，按 §5 门槛回归 | 步骤 1–6 | 中 | 通过后才谈"8.4 验收" |
| 8 | 生产灰度（新增 FPM 池 / 改 `fastcgi_pass`，保留 7.4 回滚池） | **独立评审 + 运行时部署方案** | 高 | 当前**既无批准、也无方案**，见 §7.4 |

**为什么仍建议先升 Yii 再升 PHP**：把"框架兼容性"和"运行时兼容性"两个变量分开。同时改，出问题无法定位，也无法二分回滚。

### 7.3 双轨验证的操作约束（v1.2.1 新增，评审要求）

§3.2.4 的事实决定了验证必须分成**两条互不替代的轨道**，且结果分别归档：

| 轨道 | 环境 | 测试链 | 产出归档 | 能证明什么 | 不能证明什么 |
|---|---|---|---|---|---|
| **A · 框架轨** | PHP **7.4** + Yii 2.0.55 | **既有 Codeception 4**（当前可运行）+ 人工冒烟 | `test-reports/php74-yii2055/`（用例清单、通过率、缺陷单、人工冒烟记录） | Yii 升级本身没引入业务回归 | 与 PHP 8.4 兼容性无关 |
| **B · 运行时轨** | PHP **8.4** + Yii 2.0.55 + Codeception 5 | 新工具链（按本次解析方案，需 8.4） | `test-reports/php84-yii2055/`（同上 + 分级日志预算） | 8.4 上框架/依赖/业务的实际行为 | 不能覆盖 7.4 独有行为（若仍保留 7.4 回滚池） |

**明确禁止的解释方式**：不得把轨道 A（7.4 旧链）的通过，表述为"PHP 8.4 新测试链已通过"；
也不得用轨道 B 的结果回头证明"7.4 升级没问题"。两份报告必须各自带环境指纹（PHP 版本、Composer 版本、lock 哈希、扩展清单哈希）。

> 另需强调：`composer update --dry-run` 成功只证明**依赖可求解**，不证明升级后的测试代码、Codeception 模块、
> Yii 应用或业务行为兼容。§5 的六个回归面是**后续验收证据**，不是 Composer 求解的推论。

### 7.4 生产环境红线（v1.2.2 新增，评审明确要求）

本节是 §7.1 表格中"不批准"两行的展开依据，也是本次评审**新增的一条硬约束**。评审原话照录：

> PHP 8.4 隔离测试环境必须独立于现有生产服务器及宝塔 PHP-FPM 管理体系。优先使用独立测试主机或独立容器，不在生产服务器安装新的 PHP-FPM 版本，不修改现有 Nginx vhost、FPM socket、宝塔 PHP 版本配置。生产 PHP 7.4.33-FPM 保持不变。只有在独立评审批准后，才讨论生产环境的运行时部署方案。
>
> **我的明确意见：先在独立环境完成 PHP 8.4 + Yii 2.0.55 + 新测试链的验证。现有生产服务器和宝塔环境暂时不增加 PHP-FPM 版本。**

#### 7.4.1 红线条款

| 编号 | 禁止事项 | 状态 |
|---|---|---|
| **R-1** | 在现有生产服务器上安装任何新版本 PHP-FPM（含 8.4） | **禁止** |
| **R-2** | 在宝塔面板中新增 PHP 8.4 运行池 / 切换站点 PHP 版本 | **禁止** |
| **R-3** | 修改现有 Nginx vhost（`root`、`fastcgi_pass`、`include enable-php-74.conf` 等） | **禁止** |
| **R-4** | 改动 `/tmp/php-cgi-74.sock` 相关 FPM 配置、重启或 reload 现有 FPM master | **禁止** |
| **R-5** | 把"新增池并存"当作**当前**实施建议写进任何方案或工单 | **禁止**（见 §7.4.3） |
| **R-6** | 在未取得独立评审批准前，讨论或提交生产运行时部署方案 | **禁止** |
| **R-7** | **未经系统所有者单独、明确授权，在生产文件系统创建、上传或执行任何文件（含临时探针页 `probe.php`、`phpinfo()` 页）** | **禁止**（v1.2.3 新增，评审裁定） |

生产侧当前**不做任何写入**。所谓"只读"仅指不落盘的查询（读配置、看进程、看日志），**不包括**创建、上传或执行任何文件——**临时探针页属于生产文件系统写入，不在已批准的只读范围内**（详见 §6.3）。因此 G1 / G3 / G4 在本阶段保持 **OPEN（未验证）**，不为了补齐证据而突破 R-1 ~ R-6。

> **这是本版最重要的一处口径修正（v1.2.3）**：v1.2.2 曾把"用探针页做只读采集"写成生产侧被允许的动作，属**定性错误**。
> 评审裁定：文件写入生产文件系统就是变更，"只存在几分钟、采集后立即删除"不改变其性质；且 `phpinfo()` 探针在访问控制、
> 部署路径或删除确认任一环节出错时，都可能短暂暴露 PHP 配置、扩展、路径与环境信息。
> **证据暂缺可以接受，未经授权的生产写入不可以。**

#### 7.4.2 生产侧已核实事实（作为红线的事实依据）

以下均为 §6 已取得证据，本节直接引用，不重复采集：

| 事实 | 证据来源 |
|---|---|
| 生产 PHP 版本 **7.4.33-FPM**，站点走 Unix socket `/tmp/php-cgi-74.sock` | `prod_baseline.md` P1/P2（G1 未采集、未获授权，不作为本行证据） |
| Nginx `root` 指向 `morrishk.net/web` | `prod_baseline.md` P3 |
| 服务器上**已装 PHP 8.0.26，但无监听中的 FPM 进程**（装了不用，未接入站点） | `prod_baseline.md` P4 |
| 另有 3 个 FPM master 进程归属**其他 Docker 项目**，非本站、不可复用、不可混改 | `prod_baseline.md` P5 |
| 该主机承载**多个其他项目**，不是本站独占 | 评审方现场说明；与 `prod_baseline.md` P5（其他 Docker 项目同机）相互印证 |

结论：这台机器上"再叠一个 8.4 运行时"的代价不是磁盘占用，而是**共享服务管理关系被改写**——FPM 版本、socket 命名、宝塔版本绑定、vhost include 都要动，而这些是其他项目也在用的东西。为一个站的升级去动共用部件，风险收益不成比例。对比之下，独立容器/独立主机的边际成本远低于此。

#### 7.4.3 "灰度时新增 8.4 池即可并存"的口径降级

v1.2 及更早版本在 §6.1 P2 注中出现过"灰度时新增 8.4 池即可并存"的表述。**该表述按评审意见降级**：

| 维度 | 原表述的问题 | 现行口径 |
|---|---|---|
| 性质 | 读起来像**当前实施建议** | 仅为**未来**（独立评审通过后的灰度阶段）的一种**架构可能性** |
| 前提 | 未声明前提 | 前提是：独立环境验证全部通过 + 独立评审批准 + 运行时部署方案获批 |
| 范围 | 未声明副作用 | 新增池会改动 FPM 配置、socket 命名、vhost include，属 §7.4.1 R-1~R-4 管辖范围 |

**不构成当前实施建议。** 当前阶段的全部动作限定在独立环境内，生产侧只有只读采集。

#### 7.4.4 解除条件

§7.4.1 的 R-1 ~ R-6 不是永久封锁，但解除需要按序满足，缺一不可：

1. 独立环境（独立主机或独立容器，**不在生产服务器**）内完成 **PHP 8.4 + Yii 2.0.55 + 新 Codeception 5 测试链**的完整验证；
2. §5 六个回归面全部通过，且轨道 A（7.4 框架轨）与轨道 B（8.4 运行时轨）报告分别归档、带环境指纹（§7.3）；
3. §4 的 P0 全部关闭、P1 完成或给出明确不做的理由；
4. 提交**独立的运行时部署方案**（含 FPM 池命名、socket 路径、vhost include 切换顺序、回滚到 7.4 池的完整步骤、对其他 Docker 项目的影响评估）；
5. 该方案取得**独立评审批准**。

在此之前，生产 PHP 7.4.33-FPM 保持不变。

**关于 G1 / G3 / G4 残留不确定性的处理（v1.2.3 新增）**：本裁定下 G1 / G3 / G4 将持续保持 OPEN，这意味着
"独立 8.4 环境的扩展集合是否与生产 7.4-FPM 真实加载集合一致"这一点**无法用直接证据闭环**。两种处理方式，须在运行时部署方案中显式选择其一并写明残余风险：

| 方式 | 做法 | 代价 |
|---|---|---|
| **A · 事后核对** | 保持不授权；灰度前先只读比对 `php -i`（CLI，交叉参考）与 FPM 池 `php_admin_value` 配置文本，若两者一致则接受推断；不一致则暂停 | 仍是推断，不是 FPM worker 实测；一旦不一致只能停下重来 |
| **B · 授权最小化采集** | 由系统所有者另行批准一次**最小字段、限 IP、限时间窗、采集即删并回读验证 404** 的采集；**不暴露完整 `phpinfo()`** | 需要一次受控授权与执行窗口 |

**无论选 A 还是 B，都不得把 G2（8.4 扩展清单）或 CLI 结果当作 G1 的替代证据。** 在方案获批前，此项不确定性保持显式未决。

---

## 附录 A · 规则集变更（v1.0 → v1.1，v1.2 未再扩充）

| 变更 | 内容 |
|---|---|
| 新增正则规则 | `(real)` 强制转换；`$str{...}` 花括号下标（读取形式） |
| 新增后置检查 | `preg_replace` / `preg_filter` 的 `/e` 修饰符（须在原始文本上判断，因字符串字面量已被抹空）；函数签名中"必需参数在可选参数之后"（须解析参数列表） |
| 规则总数 | 34 → **36 条正则 + 2 项后置检查** |
| 自检 | `scan/recall_fixture/` + `scan/recall_result/` + `BASELINE.md`：**21 个构造命中 20 个（`ezmlm_hash` 无规则）**，负例误报 0 |
| 重扫 | `scan/v11_rerun/`：560 文件 / 247,396 行 / 20 条 INFO，与 v1.0 逐条一致 |
| v1.2 | **按评审意见停止扩充规则、停止重复扫描同一批文件**；未覆盖项只登记（第 14 行 `ezmlm_hash`），以人工 grep 兜底 |

## 附录 B · 复现命令

```bash
# 1) 应用层静态扫描（只读）
python platform/tools/php_compat_scan.py newPlan/morrishk.net platform/docs/phase1/php-upgrade/scan/v11_rerun

# 2) 召回率/精确率自检
python platform/tools/php_compat_scan.py \
  platform/docs/phase1/php-upgrade/scan/recall_fixture \
  platform/docs/phase1/php-upgrade/scan/recall_result

# 3) 依赖层阻塞求解（Composer 权威判定）
cp newPlan/morrishk.net/composer.{json,lock} /tmp/morris_compat/
cd /tmp/morris_compat && composer prohibits php 8.4.0 --locked

# 3b) 单点更新试验（会失败，用于证明"不能单点解除"）
composer config platform.php 8.4.0
composer update symfony/service-contracts --with-dependencies --dry-run

# 3c) 协调升级求解试验（P0 五处改动后）
#     改 require.php / codeception ^5.0 / module-yii2 ^1.1.12 /
#     module-filesystem ^3.0 / module-asserts ^3.0，并删除 symfony/browser-kit 直依赖
composer update --dry-run --no-scripts --no-interaction

# 3d) 生成候选 lock 并做差异（不安装）
composer update --no-install --no-scripts --no-interaction
python -c "…对比 composer.lock 与 old.lock…"   # 见 solve/05-lock-delta.md 的生成方式

# 4) 依赖链复算（不依赖 composer，直接从 lock 重建）
python - <<'PY'
import json
d = json.load(open('composer.lock', encoding='utf-8'))
pk = {p['name']: p for p in d['packages'] + d['packages-dev']}
for n in ('symfony/service-contracts', 'symfony/console', 'phpspec/prophecy'):
    print(n, pk[n]['version'], (pk[n].get('require') or {}).get('php'))
    print('  被谁依赖:', [k for k, v in pk.items() if n in (v.get('require') or {})])
PY
```

## 附录 C · 本版证据清单

| 文件 | 用途 |
|---|---|
| `scan/app_scan_findings.csv` / `scan/app_scan_summary.json` | v1.0 扫描结果（20 条 INFO），保留作对照 |
| `scan/v11_rerun/app_scan_findings.csv` | v1.1 补规则后重扫（20 条，逐条一致） |
| `scan/recall_fixture/removed_positive.php` | 21 个已移除/弃用构造的召回夹具 |
| `scan/recall_fixture/negative_control.php` | 6 处"像但不是"的精确率夹具 |
| **`scan/recall_fixture/BASELINE.md`** | **召回基线：预期命中行、实际命中行、运行命令、历史对照（20/21 + 1 缺口）** |
| `scan/recall_result/` | 自检输出（20 命中 / 0 误报） |
| **`solve/01-prohibits-php84-locked.txt`** | Composer 2.5.8 + lock md5 + `prohibits` 原始输出（4 项） |
| **`solve/02-single-point-service-contracts.txt`** | 单点更新失败的完整输出（退出码 2） |
| **`solve/03-probe-console-service-contracts.txt`** | 最小工程探测：console 5.4.3 在 8.4 下选中 service-contracts v3.8.1 |
| **`solve/04-p0-coordinated-dryrun.txt`** | P0 五处改动后的全量 dry-run（成功，122 个包） |
| **`solve/05-lock-delta.md`** | 协同升级的 lock 全量差异（126 项变化）与重点标注 |
| **`solve/06-toolchain-min-php.md`** | 本次解析方案平台下界（PHP 8.4）的推导，及"只 pin console 6.4 不够"的实测及其**证明边界** |
| `composer.json` / `composer.lock` | 依赖事实源（**未变更**） |
| `php_modules.txt` | 开发机 CLI 扩展快照 + lock 声明扩展清单 |

---

**报告结论（v1.2.3）**：

1. **应用层**：在 36 条规则 + 2 项后置检查的覆盖范围内，161 个业务文件未出现本批定义的 20 类 PHP 8.0 移除构造；其中 19 类由规则判定、1 类（`ezmlm_hash`）由人工 grep 兜底。召回基线为 **20/21**（缺口已定位，未擅自扩规则）。这只支持"没有当场致死的语法/函数"，**不支持**"业务代码已兼容 PHP 8.4"。
2. **依赖层**：PHP 8.4 上有 **4 个 dev 依赖无法解析**——3 个结构性（公共根 `codeception ^4.0` 与 `browser-kit` 上限 pin）、1 个锁文件滞后（`service-contracts`，**单点更新经实测不能独立完成**）。协调升级已用 dry-run 验证可求解（122 包），但会带来 PHPUnit 12、PhpSpreadsheet 5.11、`dev-master` 漂移三个副作用；且**该解析方案要求 PHP 8.4 或更高**（不等于所有组合的理论下界），因此不能在 7.4 上运行。
3. **生产环境**：FPM 指向（7.4.33 + Unix socket）、Nginx `root`（`web/`）、池参数、8.0-FPM 未使用、其他 FPM 属别的 Docker 项目已核实。**G1（FPM 实际扩展清单）、G3（OPcache 运行状态）、G4（mysqlnd）保持 OPEN · 未获授权**——取证须在生产站点目录放探针文件，属生产文件系统写入，未获批准不执行；**G2（8.4 扩展清单）可在独立环境自采，但不能反推 G1**；**G5（实际 vendor）可按现有证据独立核验**（§6.3）。
4. **当前裁定**：**允许**建立隔离环境、在副本上做 Yii 2.0.55 的 7.4 回归、并行准备工具链与环境清单；**暂不批准** PHP 8.4 验收；**不批准**生产切换；**不批准**在生产站点目录放置探针或任何写入。**证据暂缺可以接受，未经授权的生产写入不可以。**
