# 08 · PHP 8.4 兼容性评估（应用层 + 依赖层）· 送审包

| 项 | 内容 |
|---|---|
| 送审包版本 | **v1.2.5**（术语收尾：staging 定义覆盖全包；技术结论与 v1.2.4 一致） |
| 日期 | 2026-11-16 |
| 范围 | PHP 7.4 → 8.4 的**应用层静态评估**与**依赖层求解评估**；不含商务方案、原型、Design System、数据库改造 |
| 明确不覆盖 | 8.4 运行期验收结论、测试代码与业务行为兼容性、任何代码或配置的实际变更 |
| 明确禁止（本阶段） | 生产 PHP-FPM 版本变更、宝塔 PHP 运行池变更、Nginx vhost / FPM socket 变更、**生产文件系统任何写入（含临时探针）** |
| 与主送审的关系 | 本包是**独立工作流**，与根 README 的主送审（tag 系列 `v1.5.x-review`，当前以远程 tag 为准）无内容交叉，仅占用同一仓库的不同目录 |
| 冻结方式 | 本目录内容为本轮冻结快照；后续修订以新 commit + tag `php84-v1.2.5-review` 递增，不覆盖历史。**`php84-v1.2.4-review` 保持冻结于 `50c8d98`，不移动** |

> **本包状态声明**：以下全部内容为**提交方自述**。评审方已独立核验 v1.2.4 的**版本关系**（main / 父提交 / tag 解引用一致），
> 并确认 **D1–D3 主要修订通过**；另提出一处 staging 术语跨文档尾项，即本版所修。
> 但评审方**尚未在全新克隆中逐项复跑 23 项 SHA**（其原文：远端清单存在、23 项已读取，未逐一重算），
> 47 项自测与 R3 原子发布模型也未复跑。本包记录**不等同于独立验收通过**。
> 第八节给出供独立复核使用的校验命令。tag 与 commit **均未签名**（`verified: false`），指向关系已核实，但不构成签名真实性验证。

---

## 零、生产环境红线（最高优先级）

### 0.1 评审裁定原文

> PHP 8.4 隔离测试环境必须独立于现有生产服务器及宝塔 PHP-FPM 管理体系。优先使用独立测试主机或独立容器，不在生产服务器安装新的 PHP-FPM 版本，不修改现有 Nginx vhost、FPM socket、宝塔 PHP 版本配置。生产 PHP 7.4.33-FPM 保持不变。只有在独立评审批准后，才讨论生产环境的运行时部署方案。
>
> **我的明确意见：先在独立环境完成 PHP 8.4 + Yii 2.0.55 + 新测试链的验证。现有生产服务器和宝塔环境暂时不增加 PHP-FPM 版本。**
>
> **目前不批准在生产站点目录放置 `probe.php`。** "只读采集"与"为了采集而临时写入生产文件"不是同一件事。即使文件只存在几分钟、采集后立即删除，也仍然是一次生产文件系统变更，不能自动归入已获准的只读操作。
>
> **不要为了关闭 G1 而破坏本轮刚建立的生产红线。证据暂缺可以接受，未经授权的生产写入不可以。**

### 0.2 禁止事项

| 编号 | 禁止事项 | 状态 |
|---|---|---|
| R-1 | 在现有生产服务器上安装任何新版本 PHP-FPM（含 8.4） | 禁止 |
| R-2 | 在宝塔面板中新增 PHP 8.4 运行池 / 切换站点 PHP 版本 | 禁止 |
| R-3 | 修改现有 Nginx vhost（`root`、`fastcgi_pass`、`include enable-php-74.conf` 等） | 禁止 |
| R-4 | 改动 `/tmp/php-cgi-74.sock` 相关 FPM 配置、重启或 reload 现有 FPM master | 禁止 |
| R-5 | 把"新增池并存"当作**当前**实施建议写进任何方案或工单 | 禁止 |
| R-6 | 在未取得独立评审批准前，讨论或提交生产运行时部署方案 | 禁止 |
| R-7 | **未经系统所有者单独、明确授权，在生产文件系统创建、上传或执行任何文件（含 `probe.php`、`phpinfo()` 页）** | **禁止（v1.2.3 新增）** |

**"只读"的准确含义**：仅指不落盘的查询（读配置、看进程、看日志），**不包括**创建、上传或执行任何文件。

### 0.3 关于 `phpinfo()` 探针的独立风险

除"写入生产文件系统"这一性质问题外，`phpinfo()` 类探针还有独立风险：若访问控制、部署路径或删除确认任一环节出错，可能**短暂暴露 PHP 配置、扩展、路径与环境信息**。不能仅凭"采集后会删除"把风险视为零。

未来若确需采集，须**另行批准**：具体文件路径、访问限制、采集字段、执行窗口、删除验证方式；尤其**不得公开暴露完整 `phpinfo()` 页面**。

### 0.4 "灰度时新增 8.4 池即可并存"

该表述出自 v1.2 及更早版本，现已降级为**未来架构可能性**——前提是独立环境验证全部通过 + 独立评审批准 + 运行时部署方案获批。**不构成当前实施建议。**

> 事实依据：该服务器承载多个其他项目，且另有 3 个 PHP-FPM master 归属其他 Docker 容器。"再叠一个 8.4 运行时"的代价是**共用服务管理关系被改写**（FPM 版本、socket 命名、宝塔版本绑定、vhost include），这些是别的项目也在用的部件。

---

## 一、本版（v1.2.5）只做 staging 术语收尾

评审对 v1.2.4 的结论是：D1–D3 主要修订已落实、三处核心矛盾可关闭，另有一处**术语跨文档一致性**尾项。
本版只修这一处，**不改技术结论、不改测试计划、不重扫代码、不重跑依赖求解、不移动 v1.2.4 tag**。

| # | 问题 | 改法 |
|---|---|---|
| 1 | 主报告 v1.2.4 的术语约定原文写"**本报告中**出现的 staging…"，严格说覆盖不到单独阅读的 `runtime_upgrade_plan.md` / `yii_extension_audit.md` | 作用域改为"**本送审包内所有文档**中出现的"，并注明两份旧文档另有重复定义 |
| 2 | `runtime_upgrade_plan.md` 头部仍写"批准范围：仅批准盘点、评估、Staging 试验、回滚设计"，可能被单读时理解为"允许在生产服务器建测试站点" | 文首增补 staging 定义：**指独立于生产服务器的测试主机或独立容器，不包括在生产服务器上创建的 staging 站点**；并绑定主报告 §7.4 的 R-1～R-7 |
| 3 | `yii_extension_audit.md` §6 仍写"真正的结论必须来自 staging 运行" | 同上增补定义，并注明该句中的 staging 指独立环境，**不构成**在生产服务器建测试站点的许可 |

版本引用同步：`php_compatibility.md`、`runtime_upgrade_plan.md`、`yii_extension_audit.md`、`prod_baseline.md` 的"唯一有效裁定依据"已从 v1.2.4 统一升到 **v1.2.5**；主报告第 850 行结论段标记同步为"**报告结论（v1.2.5；技术结论与 v1.2.4 一致）**"（此项由评审在 v1.2.5 复核时指出，属同一版内的标记补正）。

> 说明：本版把主报告版本号推到 v1.2.5，是为了让"文档版本 ↔ tag ↔ main 的 08 包内容"保持一一对应（评审自己核验时用的就是这条性质）。
> **`php84-v1.2.4-review` 不移动、不删除**，仍冻结在 `50c8d98`；v1.2.5 与它的差异仅为上述三处 + 版本栏。

---

## 一之二、上一版（v1.2.4）的 D1–D3（已通过，保留追溯）

| # | 问题 | 落点 | 改法 |
|---|---|---|---|
| **D1** | G2 行仍写"与 G1 做逐项差异表"，与"G1 仍 OPEN""G2 不能反推 G1"两条声明冲突 | 报告 §6.3、`evidence/prod/prod_baseline.md` G2 行 | 改为"与 `composer.lock` 的 `ext-*` 逐项核对；**不与未取得的 G1 建差异表**"。G1 获授权并完成 FPM 取证后，才可另行建立生产 7.4 ↔ 独立 8.4 差异表 |
| **D2** | `php_compatibility.md` §7 仍写"在生产执行 `php -m`""`php -i` 导出" | `docs/php_compatibility.md` | 生产扩展项改为"G1 OPEN、不执行生产探针；CLI 模块清单仅交叉参考，不得作为关闭依据"；php.ini 项标注"可按既有权限只读核验，但不得替代 FPM worker 证据"；MySQL 项区分"8.4 在独立环境实测"与"生产 mysqlnd 属 G4 OPEN" |
| **D3** | 三份旧文档版本基准落后 | `prod_baseline.md`、`runtime_upgrade_plan.md`、`yii_extension_audit.md` 顶部 | 统一加"适用性声明"：主报告为唯一有效裁定依据，冲突的生产操作指令一律作废；并存池 / 灰度 / 回滚池**仅为未来架构讨论**；三份均补 **R-7** |

> D1 修正时发现**主报告 §6.3 有同款冲突**（评审只点到 `prod_baseline.md`），一并修正。评审在 v1.2.4 轮次确认此处理"正确"。

---

## 一之三、更早（v1.2.3）的定性更正（已接受，保留追溯）

v1.2.2 把"用探针页做只读采集"写成生产侧**被允许**的动作，属**定性错误**。评审已确认此项修正：

| # | 落点 | 改了什么 |
|---|---|---|
| 1 | 报告 §7.4.1 | 新增 **R-7**：未获授权不得在生产创建/上传/执行任何文件；删除"生产侧唯一允许的动作是只读采集（含探针页）"这句错误表述 |
| 2 | 报告 §6.3 | G1/G3/G4 状态明确标为 **OPEN · 未获授权**；新增"证据不可替代关系"表；写入评审给的约束原文 |
| 3 | 报告 §6.2 | "待取得的 FPM 扩展清单 / OPcache 状态"改为"需授权，当前 OPEN"，CLI 仅交叉参考 |
| 4 | 报告 §7.2 | 步骤 1 拆分：只做 **G2**（独立环境自采）；G1/G3/G4 单列为 **1b 需单独授权、当前不执行**；G5 并入步骤 6 并注明不依赖生产探针 |
| 5 | 报告 §7.4.4 | 新增"G1/G3/G4 残留不确定性处理"：方案 A 事后核对 / 方案 B 授权最小化采集，二选一须在运行时部署方案中显式写明 |
| 6 | `evidence/prod/prod_baseline.md` | §六 由"采集方式"整节降级为**待授权的取证方案（当前未获批准，不得执行）**；表头加未授权声明；采集要求改为"授权时须批准的五项"+ 执行技术要求 |

---

## 二、G1～G5 当前状态与处理

| 项目 | 当前处理 | 状态 |
|---|---|---|
| **G1** FPM 实际扩展清单 | **不执行生产探针** | **OPEN · 未获授权** |
| **G2** PHP 8.4 扩展清单 | 在独立 PHP 8.4 环境采集，与 lock 的 `ext-*` 核对；不与 G1 建差异表 | 可在独立环境完成 |
| **G3** OPcache 状态 | 生产实际 FPM 状态未证实 | **OPEN · 未获授权** |
| **G4** mysqlnd / PDO MySQL 客户端 | 生产 FPM 上下文未证实 | **OPEN · 未获授权** |
| **G5** 实际 vendor 状态 | 按现有证据独立核验，不依赖生产探针 | 可在副本上完成 |

### 证据不可替代关系（本包核心约束）

| 来源 | 能否替代 G1/G3/G4 |
|---|---|
| 独立环境 PHP 8.4 的扩展结果（G2） | **不能**。8.4 的扩展清单**反推不出**生产 7.4-FPM 的扩展情况 |
| CLI 使用 FPM 的 `php.ini` 执行 `php -m` | **不能**。SAPI 不同，ini 扫描路径、`extension_dir`、`disable_functions` 都可能不同 |
| 真实 FPM worker（需授权探针） | 唯一有效来源，当前未获授权 |

> 因此当前**不存在**"生产 7.4 实测 ↔ 独立 8.4 实测"的逐项差异表：缺一侧就无法对齐。若强行用 G2 去推断 G1，等于用未知替换未知。

---

## 三、前轮已处理项（保留追溯）

| 版本 | 内容 | 评审结论 |
|---|---|---|
| v1.2.1 | E1–E4 四处收窄（平台下界口径、`*_bak.php` 适用范围、双轨验证、mysqlnd 取证环境） | 第四轮确认**全部接受并关闭** |
| v1.2.2 | §7.4 生产红线 R-1~R-6、"灰度新增池"降级、README 补件、校验和重算与 tag 对齐 | 方向认可；文档修订待复核 |
| v1.2.3 | R-7 生产文件系统写入禁令；删除"只读采集含探针页"的错误定性；G1/G3/G4 标 OPEN | **版本关系通过、R-7 接受、G1/G3/G4 保持 OPEN**；另指出 D1–D3 |
| v1.2.4 | D1 G2 口径、D2 生产取证约束、D3 旧文档适用性声明 | **D1 通过、D2 通过、D3 主要要求通过**；另指出 staging 术语尾项 |
| v1.2.5 | staging 定义覆盖全包；两份旧文档各自增补定义 | 本版，待复核 |

---

## 三之二、评审已核实与未核实的事项（明确边界）

评审在 v1.2.4 轮次的实际核验范围如下，本包**不做扩大表述**：

| 事项 | 评审状态 |
|---|---|
| `main` 在核验时为 `50c8d98…`，父提交 `6e5f671…` | **已核实** |
| tag `php84-v1.2.4-review` 为 annotated tag（object `7675adc…`），解引用精确指向 `50c8d98…` | **已核实** |
| README 可读取、内容为 v1.2.4 | **已核实** |
| 核验后 main 前进两个提交（至 `c7e500b…`），**未修改 `08_php84_compatibility/`** | **评审已确认**（故 v1.2.4 tag 无需移动） |
| 23 项 SHA-256 在全新克隆中逐一重算并匹配 | **未核实**（仅读取了清单与项数） |
| 47 项自测、R3 目录原子发布模型 | **未复跑**（属主送审原型工作流，不以本包版本核验作为其关闭证据） |
| tag / commit 签名真实性 | **未验证**（`verified: false`，且本包不主张已签名） |

---

## 四、结论摘要

1. **应用层**：36 条正则规则 + 2 项后置检查，161 个业务文件 / 16,449 行，**未出现**本批定义的 20 类 PHP 8.0 移除构造。召回夹具 **21 个构造命中 20 个**（`ezmlm_hash` 无规则，人工 grep 兜底），负例误报 0。—— 只证明"通过本批召回测试"，**不构成 8.4 兼容性完整证明**。
2. **依赖层**：PHP 8.4 上有 **4 个 dev 依赖无法解析**：
   - 结构性 3 个：`codeception/module-yii2 1.1.5`、`symfony/browser-kit 4.2.4`（根约束上限 pin）、`phpspec/prophecy 1.15.0`；
   - 锁文件滞后 1 个：`symfony/service-contracts 1.1.2`（来自 `symfony/console`，**不是** browser-kit）。
   **单点更新经实测失败**（`evidence/solve/02`，退出码 2），只能在协调升级中被动升级。
3. **协调升级方案可行**：5 处根约束调整后 dry-run 求解成功（122 包），但带来 PHPUnit 8→12、PhpSpreadsheet 1.19→5.11、`kartik-v/yii2-grid` dev-master 漂移（`09f8e76`→`c47a153`）三个副作用。该**解析方案**要求 PHP 8.4 或更高（非理论下界），**不能在 7.4 上运行**。
4. **准入裁定**：
   - 允许：建**独立** 8.4 环境（独立主机或容器，不在生产服务器）、在副本上做 Yii 2.0.55 的 7.4 回归、准备 Codeception 5 工具链与扩展清单；
   - 暂不批准：PHP 8.4 完整验收（P0 未落地、G1/G3/G4 仍 OPEN、运行期未验证）；
   - **不批准**：生产 PHP 切换，以及在现有生产服务器安装新 FPM / 新增宝塔 8.4 池 / 改 vhost 与 socket / 放置探针或任何写入。

---

## 五、证据索引（每条结论可追到命令与退出码）

| 证据 | 对应章节 | 能证明什么 | 命令 / 结果 |
|---|---|---|---|
| `evidence/solve/01-prohibits-php84-locked.txt` | §3.2 | 4 个 dev 包排除 8.4；lock md5 `654cb46e…` | `composer prohibits php 8.4.0 --locked`，Composer 2.5.8，退出码 0 |
| `evidence/solve/02-single-point-service-contracts.txt` | §3.2.2 | **单点更新不可独立完成** | `platform.php=8.4.0` + `composer update symfony/service-contracts --with-dependencies --dry-run`，**退出码 2** |
| `evidence/solve/03-probe-console-service-contracts.txt` | §3.2.2 | `console 5.4.3` 的约束允许 `service-contracts` 3.x（选中 v3.8.1） | 最小工程 `composer update --dry-run`，退出码 0 |
| `evidence/solve/04-p0-coordinated-dryrun.txt` | §3.2.3 | 5 处根约束调整后可求解（122 包） | `composer update --dry-run`，退出码 0 |
| `evidence/solve/05-lock-delta.md` | §3.2.3 | lock 全量差异：131→122 包、126 项变化 | 由 `composer update --no-install` 生成后逐包比对 |
| `evidence/solve/06-toolchain-min-php.md` | §3.2.4 | 本次解析方案下界 8.4；pin console/yaml 6.4 **不够**（browser-kit 仍 8.0.14） | 由 04 的 lock 逐包取 `require.php` 下界 |
| `evidence/scan/app_scan_findings.csv` / `v11_rerun/` | §2 | v1.0 与补规则后的两次扫描一致（20 条 INFO） | `python platform/tools/php_compat_scan.py <src> <out>` |
| `evidence/scan/recall_fixture/`（含 `BASELINE.md`） | §1.2、§2.2 | 召回 20/21、误报 0；缺口 `ezmlm_hash` 已定位 | 同上，指向夹具目录 |
| `evidence/prod/prod_baseline.md` | §6、§7.4 | 生产已确认 7 项、部分确认 3 项；G1–G5 状态；**§六 为待授权的取证方案（未获批准，不得执行）** | 评审方现场核实结果汇总 |
| `reference/composer.json` / `composer.lock` | §3 | 求解输入基线（**未改动**） | lock md5 `654cb46e10d31af4b4b4896e1c6fd9a6` |

**注意**：`evidence/prod/prod_baseline.md` §六 的探针脚本是**方案参考**，不是已执行记录。本包**没有任何来自生产 FPM worker 的采集结果**。

---

## 六、最小复核路径（依赖求解，10 分钟）

```bash
# 0) 校验包完整性
cd 08_php84_compatibility && sha256sum -c SHA256SUMS.txt

# 1) 校验求解输入与证据一致
md5sum reference/composer.lock     # 期望 654cb46e10d31af4b4b4896e1c6fd9a6

# 2) 复现阻塞清单
mkdir -p /tmp/mc && cp reference/composer.{json,lock} /tmp/mc/ && cd /tmp/mc
composer prohibits php 8.4.0 --locked        # 期望 4 行，退出码 0

# 3) 复现"单点更新失败"
composer config platform.php 8.4.0
composer update symfony/service-contracts --with-dependencies --dry-run
# 期望：Your requirements could not be resolved…，退出码 2

# 4) 复现协调升级可求解（先按 04 的文件头改 5 处根约束）
composer update --dry-run --no-scripts --no-interaction
# 期望：Lock file operations: 122 installs，退出码 0
```

> 以上全部在**临时副本**执行，仓库内 `reference/composer.json` 与 `composer.lock` 未被修改。
> 第 2–4 步只做依赖解析，**不产生任何部署物**，与生产环境无关。

---

## 七、本包明确不主张

| 不主张 | 原因 |
|---|---|
| 不主张"应用代码已兼容 PHP 8.4" | 仅静态模式匹配；`vendor/` 为空未扫；无运行期证据 |
| 不主张"修完 P0 就能上 8.4" | 依赖可解析 ≠ 依赖可运行；dry-run 不证明测试代码、Codeception 模块、Yii 应用或业务行为兼容 |
| 不主张"所有 Codeception 5 组合的理论下界都是 8.4" | 只证明了本次解析方案的下界；降界需受约束求解 + 实跑 |
| 不主张"生产环境已摸清" | G1/G3/G4 **OPEN · 未获授权**，无任何 FPM worker 侧采集结果 |
| 不主张"独立 8.4 环境的结果代表生产" | G2 描述的是独立环境，**不能反推** G1 |
| 不主张"CLI 结果可代表 FPM" | SAPI 不同，ini / `extension_dir` / `disable_functions` 均可能不同 |
| 不主张备份文件在所有入口都不可达 | 结论仅限已核实的 morrishk.net vhost 常规静态映射 |
| 不主张"生产可直接新增 8.4 池" | 未来架构可能性，非当前建议；R-1~R-7 全部禁止 |
| 不主张本包记录等于独立验收 | 评审方仅核验到 v1.2.4 的版本关系与 D1–D3，未复跑 23 项 SHA；复核方式见第八节 |

---

## 八、供独立复核使用的校验命令

评审方已核验 v1.2.4 的版本关系与 D1–D3，但未在全新克隆中复跑 SHA-256、未复跑 47 项自测。以下命令可对远端 `main` 与 tag 一次性核验：

```bash
# 1) 克隆并确认提交
git clone https://github.com/esanwu-bot/morrishk-site-upgrade-review.git
cd morrishk-site-upgrade-review
git log --oneline -3                     # 期望 HEAD 为 v1.2.5 提交
git rev-parse HEAD
git rev-list -n1 php84-v1.2.5-review     # 期望与 HEAD 相同
git cat-file -t php84-v1.2.5-review      # 期望 tag（注解标签；未签名）
git rev-list -n1 php84-v1.2.4-review     # 期望仍为 50c8d98…（v1.2.4 未被移动）

# 2) 确认父提交与工作流隔离（08 包应与主送审目录无重叠）
git show --stat --oneline HEAD

# 3) 校验本包完整性（评审此前未做的一步，建议本轮执行）
cd 08_php84_compatibility
sha256sum -c SHA256SUMS.txt              # 期望 23 项全部 OK
md5sum reference/composer.lock           # 期望 654cb46e10d31af4b4b4896e1c6fd9a6

# 4) 确认 v1.2.3 裁定已落地
grep -n "R-7" docs/app_code_compatibility.md
grep -c "OPEN · 未获授权" docs/app_code_compatibility.md evidence/prod/prod_baseline.md
grep -rn "唯一允许的动作是只读采集" docs evidence    # 期望无输出（本 README 引用旧句，故不在检查范围）

# 5) 确认 D1–D3 已修
grep -rn "与 G1 做\*\*逐项差异表\*\*" docs evidence ; echo "D1 期望无输出"
grep -rn "在生产执行 .php -m." docs ; echo "D2 期望无输出"
grep -ln "v1.2.5" docs/runtime_upgrade_plan.md docs/yii_extension_audit.md evidence/prod/prod_baseline.md
#   D3 期望三行全部命中（三份旧文档均已指向 v1.2.5）

# 6) 确认本版 staging 术语已覆盖（v1.2.5 三项）
grep -n "本送审包内所有文档" docs/app_code_compatibility.md        # 期望命中（主报告作用域已扩）
grep -c "不包括在现有生产服务器上创建的 staging 站点" docs/runtime_upgrade_plan.md docs/yii_extension_audit.md
#   期望两个文件各命中 1 次
```

---

## 九、目录清单

```
08_php84_compatibility/
├── README.md                        本文件（裁定状态 + 红线 + 证据索引 + 复核路径）
├── SHA256SUMS.txt                   本包全部文件的 SHA-256（23 项）
├── docs/
│   ├── app_code_compatibility.md    主报告 v1.2.5（应用层 + 依赖层；§6.3 G1–G5 状态；§7.4 红线含 R-7）
│   ├── php_compatibility.md         依赖层盘点（含与前版的勘误对照）
│   ├── yii_extension_audit.md       扩展审计（v1.0 期产物，顶部已标注作废项）
│   └── runtime_upgrade_plan.md      运行时升级方案（v1.0 期产物，顶部已标注作废项 + 生产红线）
├── evidence/
│   ├── solve/01–06                  依赖求解的全部命令与输出
│   ├── scan/                        两轮扫描结果、召回夹具与基线、负例控制
│   └── prod/prod_baseline.md        生产核验记录；§六 为待授权的取证方案（不得执行）
└── reference/
    ├── composer.json                求解输入（未改动）
    └── composer.lock                求解输入（未改动，md5 见上）
```

`docs/yii_extension_audit.md` 与 `docs/runtime_upgrade_plan.md` 属 v1.0 期产物，保留仅为让 §3.3 与 §7 的引用闭环；
两者顶部均已加勘误提示与生产红线说明，**结论以主报告 v1.2.5 为准**。
