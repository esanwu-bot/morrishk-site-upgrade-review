# 08 · PHP 8.4 兼容性评估（应用层 + 依赖层）· 送审包

| 项 | 内容 |
|---|---|
| 送审包版本 | **v1.2.2**（增补版：§7.4 生产红线 + FPM 上下文取证方式 + 本 README 补件） |
| 日期 | 2026-11-16 |
| 范围 | PHP 7.4 → 8.4 的**应用层静态评估**与**依赖层求解评估**；不含商务方案、原型、Design System、数据库改造 |
| 明确不覆盖 | 8.4 运行期验收结论、测试代码与业务行为兼容性、任何代码或配置的实际变更 |
| 明确禁止（本阶段） | 生产 PHP-FPM 版本变更、宝塔 PHP 运行池变更、Nginx vhost / FPM socket 变更（详见下方红线） |
| 与主送审的关系 | 本包是**独立工作流**，与根 README 的主送审（当前 `v1.5.3-review`，方案/原型/审计工具）无内容交叉，仅占用同一仓库的不同目录 |
| 冻结方式 | 本目录内容为本轮冻结快照；后续修订以新 commit + tag `php84-v1.2.2-review` 递增，不覆盖历史 |

---

## 零、生产环境红线（本轮新增，最高优先级）

评审在第五轮明确提出，本包据此新增报告 §7.4。原文照录：

> PHP 8.4 隔离测试环境必须独立于现有生产服务器及宝塔 PHP-FPM 管理体系。优先使用独立测试主机或独立容器，不在生产服务器安装新的 PHP-FPM 版本，不修改现有 Nginx vhost、FPM socket、宝塔 PHP 版本配置。生产 PHP 7.4.33-FPM 保持不变。只有在独立评审批准后，才讨论生产环境的运行时部署方案。
>
> **我的明确意见：先在独立环境完成 PHP 8.4 + Yii 2.0.55 + 新测试链的验证。现有生产服务器和宝塔环境暂时不增加 PHP-FPM 版本。**

| 编号 | 禁止事项 | 状态 |
|---|---|---|
| R-1 | 在现有生产服务器上安装任何新版本 PHP-FPM（含 8.4） | 禁止 |
| R-2 | 在宝塔面板中新增 PHP 8.4 运行池 / 切换站点 PHP 版本 | 禁止 |
| R-3 | 修改现有 Nginx vhost（`root`、`fastcgi_pass`、`include enable-php-74.conf` 等） | 禁止 |
| R-4 | 改动 `/tmp/php-cgi-74.sock` 相关 FPM 配置、重启或 reload 现有 FPM master | 禁止 |
| R-5 | 把"新增池并存"当作**当前**实施建议写进任何方案或工单 | 禁止 |
| R-6 | 在未取得独立评审批准前，讨论或提交生产运行时部署方案 | 禁止 |

生产侧**唯一允许的动作是只读采集**：以探针页读取扩展 / OPcache / mysqlnd 信息，采集完立即删除探针并确认返回 404。不写配置、不装包、不重启、不 reload。

**关于"灰度时新增 8.4 池即可并存"**：该表述出自 v1.2 及更早版本 §6.1 P2 注，本轮**按评审意见降级**为"未来架构可能性"——前提是独立环境验证全部通过 + 独立评审批准 + 运行时部署方案获批。**不构成当前实施建议。** 详见报告 §7.4.3。

> 补充事实依据（报告 §7.4.2）：该服务器**承载多个其他项目**，且另有 3 个 PHP-FPM master 归属其他 Docker 容器。"再叠一个 8.4 运行时"的真实代价不是磁盘，而是**共用服务管理关系被改写**（FPM 版本、socket 命名、宝塔版本绑定、vhost include），这些是别的项目也在用的部件。独立容器/独立主机的边际成本远低于此。

---

## 一、本轮（v1.2.2）只做了两处增补

### 增补 1：G1 / G3 / G4 的取证方式改为 FPM 上下文（对应第四轮残余项）

评审指出：`php -m` 是 **CLI SAPI**，不能代表 FPM worker 实际加载的扩展。本轮全部改写取证方式：

| 项 | 旧口径（作废） | 新口径 |
|---|---|---|
| G1 扩展清单 | CLI 以 FPM ini 跑 `php -m` | 通过**实际 morrishk.net vhost** 请求临时探针页，在真实 7.4-FPM worker 内采集 `PHP_VERSION`、`PHP_SAPI`、`get_loaded_extensions()`、`php_ini_loaded_file()`、`php_ini_scanned_files()`、`extension_dir` |
| G3 OPcache | `php -i` 的 `Opcode Caching` 行 | 探针页内 `opcache_get_status(false)`，`php -i` 仅作交叉参考 |
| G4 mysqlnd | CLI `mysqli_get_client_info()` | 探针页内 `mysqli_get_client_info()` + `(new PDO(...))->getAttribute(PDO::ATTR_CLIENT_VERSION)` |

配套的四条硬要求（报告 `evidence/prod/prod_baseline.md` §六）：

1. 必须由**实际 vhost** 发起请求，确保命中生产 7.4-FPM worker，而非 CLI 或默认站；
2. `phpinfo()` 单独存一份作为交叉证据；
3. **探针采集后立即删除**，并确认删除后返回 404；
4. 留档采集时间（含时区）、vhost 名、FPM socket 路径（当前 `/tmp/php-cgi-74.sock`）、请求命令、完整输出摘要。

CLI 结果（即使使用 FPM 的 ini）**只作交叉参考**，不得作为 G1/G4 的关闭依据——CLI 与 FPM 可能加载不同 ini、不同 `extension_dir`、不同 `disable_functions`。完整探针脚本见 `evidence/prod/prod_baseline.md` §六。

### 增补 2：新增 §7.4 生产环境红线（对应第五轮评审）

见本文第零节。同时把 §6.1 与 `prod_baseline.md` 中 P2 / P4 / P6 / P7 四处"可照抄""可并存""切换点明确"的措辞全部收窄，避免被读成当前实施建议。

### 附带补件：本 README

上一轮本文件因路径解析错误**落在了仓库外的目录**（`E:\tmp\revrepo\…` 而非克隆内的 `/tmp/revrepo/…`），导致评审访问返回 404。本轮已修正并入库，同时把路径类操作改为在克隆根下逐条执行、逐条核对。

---

## 二、前轮（v1.2.1）已闭合项 E1–E4

评审在第四轮确认 E1–E4 "全部接受并关闭"，此处保留记录以便追溯：

| # | 评审意见 | 处理方式 | 落点 |
|---|---|---|---|
| E1 | "新测试链最低要求 PHP 8.4"应限定为"本次 dry-run 解析方案要求 PHP 8.4" | 改写结论句，明确"不等于所有 Codeception 5 组合的理论下界"；把"只 pin console/yaml 不够"降级为"不构成无法降低的证明" | §3.2.4、结论第 2 条；`evidence/solve/06` |
| E2 | `*_bak.php` 结论不能扩展成对所有入口的绝对保证 | 补适用范围声明（不覆盖其他 vhost / alias / 软链接 / 额外文件服务入口）；P1-5 补两项清理前确认（物理路径核对、是否启用优化 classmap） | §6.1、§4 P1-5；`evidence/prod/prod_baseline.md` 第四节 |
| E3 | 7.4 回归与新测试链必须分两条轨道、分别归档 | 新增 §7.3 双轨验证表，写明"不得把 7.4 旧链通过解释为 8.4 新链通过"，并要求报告带环境指纹 | §7.3 |
| E4 | `mysqlnd` 不应以 CLI 输出替代 FPM 环境取证 | G4 采集要求写明须在 FPM 上下文取证（本轮进一步统一为探针页方式） | §6.3 |

版本记录：v1.0 → v1.2（R1–R4）→ v1.2.1（E1–E4 收窄）→ **v1.2.2（本节两处增补）**。

---

## 三、结论摘要

1. **应用层**：36 条正则规则 + 2 项后置检查，161 个业务文件 / 16,449 行，**未出现**本批定义的 20 类 PHP 8.0 移除构造。
   召回夹具为 **21 个构造命中 20 个**（`ezmlm_hash` 无规则，以人工 grep 兜底），负例误报 0。
   —— 该结果只证明"通过本批召回测试"，**不构成 8.4 兼容性完整证明**。
2. **依赖层**：PHP 8.4 上有 **4 个 dev 依赖无法解析**：
   - 结构性 3 个：`codeception/module-yii2 1.1.5`、`symfony/browser-kit 4.2.4`（根约束上限 pin）、`phpspec/prophecy 1.15.0`；
   - 锁文件滞后 1 个：`symfony/service-contracts 1.1.2`（来自 `symfony/console`，**不是** browser-kit）。
   **单点更新经实测失败**（`evidence/solve/02`，退出码 2），只能在协调升级中被动升级。
3. **协调升级方案可行**：5 处根约束调整后 dry-run 求解成功（122 包），但带来 PHPUnit 8→12、PhpSpreadsheet 1.19→5.11、
   `kartik-v/yii2-grid` dev-master 漂移（`09f8e76`→`c47a153`）三个副作用。
   该**解析方案**要求 PHP 8.4 或更高（非理论下界），因此**不能在 7.4 上运行**。
4. **准入裁定**：
   - 允许：建立**独立** 8.4 环境（独立主机或独立容器，不在生产服务器）、在副本上做 Yii 2.0.55 的 7.4 回归、准备 Codeception 5 工具链与扩展清单；
   - 暂不批准：PHP 8.4 完整验收（P0 未落地、G1–G5 缺口未补、运行期未验证）；
   - **不批准**：生产 PHP 切换，以及在现有生产服务器安装新 FPM / 新增宝塔 8.4 池 / 改 vhost 与 socket（第零节 R-1~R-6）。

---

## 四、证据索引（每条结论可追到命令与退出码）

| 证据 | 对应章节 | 能证明什么 | 命令 / 结果 |
|---|---|---|---|
| `evidence/solve/01-prohibits-php84-locked.txt` | §3.2 | 4 个 dev 包排除 8.4；lock md5 `654cb46e…` | `composer prohibits php 8.4.0 --locked`，Composer 2.5.8，退出码 0 |
| `evidence/solve/02-single-point-service-contracts.txt` | §3.2.2 | **单点更新不可独立完成** | `platform.php=8.4.0` + `composer update symfony/service-contracts --with-dependencies --dry-run`，**退出码 2** |
| `evidence/solve/03-probe-console-service-contracts.txt` | §3.2.2 | `console 5.4.3` 的约束允许 `service-contracts` 3.x（选中 v3.8.1） | 最小工程 `composer update --dry-run`，退出码 0 |
| `evidence/solve/04-p0-coordinated-dryrun.txt` | §3.2.3 | 5 处根约束调整后可求解（122 包） | `composer update --dry-run`，退出码 0 |
| `evidence/solve/05-lock-delta.md` | §3.2.3 | lock 全量差异：131→122 包、126 项变化 | 由 `composer update --no-install` 生成后逐包比对 |
| `evidence/solve/06-toolchain-min-php.md` | §3.2.4 | 本次解析方案下界 8.4；pin console/yaml 6.4 **不够**（browser-kit 仍 8.0.14） | 由 04 的 lock 逐包取 `require.php` 下界 |
| `evidence/scan/app_scan_findings.csv` / `v11_rerun/` | §2 | v1.0 与补规则后的两次扫描一致（20 条 INFO） | `python platform/tools/php_compat_scan.py <src> <out>` |
| `evidence/scan/recall_fixture/`（含 `BASELINE.md`） | §1.2、§2.2 | 召回 20/21、误报 0；缺口 `ezmlm_hash` 已定位；含预期行/实际行/运行命令 | 同上，指向夹具目录 |
| `evidence/prod/prod_baseline.md` | §6、§7.4 | 生产已确认 7 项事实、部分确认 3 项、缺口 G1–G5；含备份文件结论适用范围；**§六 为 FPM 探针页采集方式与完整脚本** | 评审方现场核实结果汇总 |
| `reference/composer.json` / `composer.lock` | §3 | 求解输入基线（**未改动**） | lock md5 `654cb46e10d31af4b4b4896e1c6fd9a6` |

**说明**：评审方表示无需重传这两个依赖文件；此处附上仅为让 `solve/01`、`solve/05` 的 md5 与 lock 差异可原地复现，如已持有可忽略。

---

## 五、最小复核路径（10 分钟）

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

> 注意：以上全部在**临时副本**执行，仓库内 `reference/composer.json` 与 `composer.lock` 未被修改。
> 第 2–4 步只做依赖解析，**不产生任何部署物**，与生产环境无关。

---

## 六、本包明确不主张

| 不主张 | 原因 |
|---|---|
| 不主张"应用代码已兼容 PHP 8.4" | 仅静态模式匹配；`vendor/` 为空未扫；无运行期证据 |
| 不主张"修完 P0 就能上 8.4" | 依赖可解析 ≠ 依赖可运行；`composer update --dry-run` 不证明测试代码、Codeception 模块、Yii 应用或业务行为兼容 |
| 不主张"所有 Codeception 5 组合的理论下界都是 8.4" | 只证明了本次解析方案的下界；降界需受约束求解 + 实跑 |
| 不主张"生产环境已摸清" | 扩展完整清单、8.4 目标扩展差异、OPcache 运行状态仍缺（G1–G3），且必须按 FPM 探针页方式补 |
| 不主张备份文件在所有入口都不可达 | 结论仅限已核实的 morrishk.net vhost 常规静态映射 |
| 不主张"生产可直接新增 8.4 池" | 这是未来架构可能性，非当前建议；当前 R-1~R-6 全部禁止（第零节） |
| 不主张"本包结论可作为生产部署依据" | 生产运行时部署须独立评审 + 独立运行时部署方案，当前既无批准也无方案 |

---

## 七、目录清单

```
08_php84_compatibility/
├── README.md                        本文件（送审说明 + 生产红线 + 证据索引 + 复核路径）
├── SHA256SUMS.txt                   本包全部文件的 SHA-256
├── docs/
│   ├── app_code_compatibility.md    主报告 v1.2.2（应用层 + 依赖层；§7.4 生产红线）
│   ├── php_compatibility.md         依赖层盘点（含与前版的勘误对照）
│   ├── yii_extension_audit.md       扩展审计（v1.0 期产物，顶部已标注作废项）
│   └── runtime_upgrade_plan.md      运行时升级方案（v1.0 期产物，顶部已标注作废项 + 生产红线）
├── evidence/
│   ├── solve/01–06                  依赖求解的全部命令与输出
│   ├── scan/                        两轮扫描结果、召回夹具与基线、负例控制
│   └── prod/prod_baseline.md        生产环境核验记录（§6 证据 + §六 FPM 探针采集方式）
└── reference/
    ├── composer.json                求解输入（未改动）
    └── composer.lock                求解输入（未改动，md5 见上）
```

`docs/yii_extension_audit.md` 与 `docs/runtime_upgrade_plan.md` 属 v1.0 期产物，保留仅为让 §3.3 与 §7 的引用闭环；
两者顶部均已加勘误提示与生产红线说明，**结论以主报告 v1.2.2 为准**。
