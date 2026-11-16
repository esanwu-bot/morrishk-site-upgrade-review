# 生产环境核验记录（§6 证据）

| 项 | 内容 |
|---|---|
| 文档编号 | MRH-P1-PHP-PROD-001 |
| 版本 | v1.3（对齐主报告 v1.2.5：G1/G3/G4 保持 OPEN；§六 探针方案降级为"待授权，不得执行"；G2 不再与 G1 建差异表） |
| 裁定基准 | **以 `app_code_compatibility.md` v1.2.5 为准**；本记录只提供事实与取证边界，不承担裁定权 |
| 记录日期 | 2026-11-16 |
| 取证方式 | **评审方在宿主机与本项目 vhost 范围内现场核实**；本记录只汇总"已确认的事实 + 取得方式 + 未确认项"，**不复制任何未实际执行的命令输出** |
| 适用对象 | `morrishk.net`（生产），PHP 7.4-FPM |
| 不在范围 | 其他站点 vhost、其他 Docker 项目的 PHP-FPM、CDN/WAF 层、数据库服务端配置 |

> 本记录的存在意义：v1.0 报告曾写"无生产机访问权限"，与后续核实结果矛盾；本记录用于把"已确认 / 部分确认 / 仍缺"
> 三档钉死在证据上，供后续验收逐项对照。**凡本记录未列的事实，一律视为未验证。**

> **生产侧红线条（评审明确要求，详见报告 §7.4）**：本记录所列事实**仅用于只读评估与构建独立 8.4 环境的参照**。
> 在现有生产服务器上安装新版本 PHP-FPM、在宝塔新增 PHP 8.4 运行池、修改 Nginx vhost / FPM socket / 宝塔 PHP 版本配置
> **一律不批准**。生产 PHP 7.4.33-FPM 保持不变。本记录中任何"可照抄 / 可并存 / 切换点明确"的表述，
> 均指**未来**独立评审通过后的架构可能性，**不是当前实施建议**。
>
> **生产侧不执行任何写入（v1.2.3 裁定）**：创建、上传或执行任何文件（含临时探针页）都属生产文件系统变更，
> **不在已批准的只读范围内**。"采集后立即删除"不改变其性质。§六 所列探针方案即属此类，**当前未获授权，不得执行**。
> 只读仅指不落盘的查询（读配置、看进程、看日志）。因此 G1 / G3 / G4 保持 **OPEN · 未验证**。

---

## 一、已确认（可作为设计与实施输入）

| # | 事实 | 取证方式 | 影响 |
|---|---|---|---|
| P1 | 站点运行时为 **PHP 7.4.33-FPM** | 站点 `phpinfo`/`php -v` 与 FPM 进程、`php-fpm` 版本一致 | 生产基线版本 |
| P2 | Nginx 通过 **Unix socket** 连接 PHP-FPM（非 TCP `127.0.0.1:9000`） | vhost `fastcgi_pass` 指向 socket 路径，socket 文件存在且有属主 | 记录生产连接形态。**"灰度时新增 8.4 池并改指向"仅为未来架构可能性，不构成当前实施建议**；生产侧不改池、不改 vhost（红线见报告 §7.4） |
| P3 | 该 vhost 的 **`root` 指向 `morrishk.net/web`** | vhost 配置 `root` 指令 | 决定静态资源与源码目录的可达性（见第四节适用范围） |
| P4 | **PHP 8.0-FPM 已安装但没有监听进程**，站点未使用 | 进程列表无对应 master/worker；无监听 socket | 不能把"已安装"当"正在服务"；也**不构成"再装一个 8.4 池"的先例依据**（§7.4.1 R-1） |
| P5 | 其他 PHP-FPM master 进程属于**别的 Docker 项目** | 进程的容器归属 / 监听路径与本站不一致 | 该主机为**多项目共用**，FPM 体系不可为单站改动（报告 §7.4.2） |
| P6 | 已取得 FPM 池参数：`listen`、`user`/`group`、`pm` 相关配置 | 池配置 `php-fpm.d/*.conf` | 供**独立 8.4 环境**建池时对齐参数（`pm.max_children` 按目标机内存重算）。生产侧不建池、不改池（§7.4.1 R-1/R-2） |
| P7 | 已取得该站点 Nginx vhost 完整配置 | `nginx -T` 或站点 conf 文件 | 记录**未来**灰度的参考切换点（`fastcgi_pass`）；当前**不修改**该 vhost（§7.4.1 R-3） |

## 二、部分确认（方向明确，数值未钉死）

| # | 项 | 已取得 | 仍缺 | 影响 | 对应缺口 |
|---|---|---|---|---|---|
| P8 | PHP 7.4 扩展 | 以 **FPM 的 ini** 运行的 CLI 取得模块清单；FPM 侧确认存在 **GD、MySQLi、PDO** | FPM **实际加载**的完整清单（须在 FPM 上下文取，不能用 CLI 直接替代） | 决定 8.4 目标机要装哪些 `ext-*`（lock 声明 19 个） | G1 |
| P9 | PHP 7.4 关键配置 | 已确认 FPM ini 路径与加载情况 | `error_reporting`、`memory_limit`、`session.*` 的实际取值 | 决定 deprecation 是否被记录、回归如何观察 | G1/G3 |
| P10 | OPcache | 此前盘点结论为"未启用" | `opcache.enable`、`enable_cli`、`Opcode Caching` 的实际值 | 性能基线与缓存清理流程 | G3 |

## 三、仍缺（8.4 验收前的硬前提）

> **本表状态口径（v1.2.3 裁定）**：G1 / G3 / G4 的取证需在生产站点目录放探针文件，属**生产文件系统写入**，
> **当前未获授权，一律不执行**，状态保持 **OPEN · 未验证**。§六 的方案仅为**待授权的取证方案**，不是已批准动作。

| # | 缺口 | 采集要求 | 当前状态 | 为什么不能省 |
|---|---|---|---|---|
| G1 | FPM 实际加载的完整扩展清单 | 真实 7.4-FPM worker 内的 `get_loaded_extensions()`、`PHP_VERSION`、`php_ini_loaded_file()`、`php_ini_scanned_files()`、`extension_dir`，与 `composer.lock` 的 19 个 `ext-*` 逐项比对。**唯一有效取得方式是在站点目录放探针页 → 需单独授权**。CLI 用 FPM ini 跑 `php -m` 仅作交叉参考，**不得作为唯一证据**。参考方案见 §六（未获批准，不得执行） | **OPEN · 未获授权** | 缺任一扩展（`zip`/`gd`/`intl` 等）即等于目标环境不可用 |
| G2 | PHP 8.4 目标扩展清单 | 在独立 PHP 8.4 环境采集实际加载扩展清单，与 `composer.lock` 声明的 `ext-*` 要求逐项核对；**不与未取得的生产 G1 数据建立差异表**。G1 获得授权并完成真实 FPM 取证后，才可另行建立生产 7.4 与独立 8.4 的差异表 | **可在独立环境采集**（不触碰生产） | 用于确认"独立 8.4 环境是否装齐 lock 要求的扩展"。**G2 不能反推 G1**：它描述的是独立环境，不是生产 |
| G3 | OPcache 运行状态 | 真实 FPM worker 内 `opcache_get_status()`；`php -i` 的 `Opcode Caching` 行仅交叉参考 | **OPEN · 未获授权** | 性能对比与部署行为 |
| G4 | MySQL 客户端库 | 真实 FPM worker 内 `mysqli_get_client_info()`、`(new PDO(...))->getAttribute(PDO::ATTR_CLIENT_VERSION)`、`phpinfo()` 的 mysqlnd 段；CLI 输出不得替代 | **OPEN · 未获授权** | 服务端仍为 5.6.50，跨版本连接需实测 |
| G5 | `vendor/` 实际版本 | 副本 `composer install` 后 `composer show` 留档 | **可按现有证据独立核验**（不依赖生产探针） | 4 个待核实包的运行风险只能在此之后评估 |

> 排序：G1–G3 是 **PHP 8.4 验收前**的关键环境证据；G4–G5 是补齐运行时与依赖基线。
>
> **生产环境临时探针属于生产文件系统写入，不属于本报告已批准的只读采集范围。未经系统所有者单独、明确授权，不得创建、上传或执行探针文件。G1、G3、G4 在获得授权并完成真实 FPM 上下文采集前，均保持未验证状态，不得以 CLI 结果或独立环境结果替代。**

## 四、适用范围声明（备份文件结论的边界）

在**已核实的 morrishk.net Nginx vhost 配置**下，`controllers/PageController_bak0609.php` 与
`controllers/ProController_bak.php` 位于 document root（`morrishk.net/web`）之外，
**不会通过该 vhost 的常规静态文件路径被直接下载**。

**此结论不覆盖**：其他 vhost、`alias` 指令、软链接、独立的文件服务/下载入口、CDN 回源规则。
因此在清理前仍需两项确认：

1. 用**实际部署目录**核对此二文件的物理路径与仓库快照一致（避免"仓库里没有、服务器上有"或反之）；
2. 确认生产 Composer autoload 是否启用优化 classmap（`optimize-autoloader`、`classmap-authoritative`、
   或安装时 `--classmap-authoritative`），**不要仅凭文件名推断 classmap 一定冲突**。

---

## 五、与本记录对应的报告章节

| 报告章节 | 对应内容 |
|---|---|
| `app_code_compatibility.md` §6.1 | P1–P7（已验证） |
| §6.2 | P8–P10（部分验证） |
| §6.3 | G1–G5（仍缺） |
| §4 P1-5 与本文第四节 | 备份文件风险降级及其适用范围 |

---

## 六、附录：待授权的取证方案（G1 / G3 / G4）——**当前未获批准，不得执行**

> **状态：未获授权，禁止执行（v1.2.3 裁定）**
>
> 本节内容的性质是**方案参考**，不是已批准动作。在生产站点目录创建探针文件属于**生产文件系统写入**，
> 不在本报告已批准的只读采集范围内。"文件只存在几分钟、采集后立即删除"**不改变其性质**。
>
> 另有独立风险：`phpinfo()` 类探针若访问控制、部署路径或删除确认任一环节出错，都可能**短暂暴露 PHP 配置、
> 扩展、路径与环境信息**。因此不能仅凭"采集后会删除"把风险视为零。
>
> **未来若确需采集**，须由系统所有者**另行批准**具体文件路径、访问限制、采集字段、执行窗口与删除验证方式；
> 尤其**不得公开暴露完整 `phpinfo()` 页面**。授权前 G1 / G3 / G4 一律保持 **OPEN · 未验证**。

### 6.1 采集方式（技术上唯一具备证明力的路径，但需授权）

`php -m` 是 **CLI SAPI** 命令；即使指定 FPM 的 ini，也不能证明 FPM worker 最终加载了相同的扩展与配置
（ini 路径、`extension_dir`、`disable_functions`、`opcache`、`env` 都可能不同）。故 G1 / G4 若要取证，只能走下列方式——
**前提是取得授权**：

```php
<?php
// probe.php —— 临时探针，放在站点可访问目录，采集完成后立即删除
// 【当前未获授权，不得部署执行】
header('Content-Type: text/plain; charset=utf-8');

echo 'PHP_VERSION='   . PHP_VERSION . "\n";
echo 'SAPI='          . PHP_SAPI . "\n";                 // 期望 fpm-fcgi
echo 'LOADED_INI='    . php_ini_loaded_file() . "\n";
echo 'SCANNED_INI='   . (php_ini_scanned_files() ?: '') . "\n";
echo 'EXTENSION_DIR=' . ini_get('extension_dir') . "\n";

// mysqlnd / 客户端库版本（G4）：mysqli 与 pdo_mysql 两条路径都取
echo 'MYSQLI_CLIENT_INFO=' . (function_exists('mysqli_get_client_info') ? mysqli_get_client_info() : 'n/a') . "\n";
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=information_schema', getenv('DB_USER'), getenv('DB_PASS'));
    echo 'PDO_CLIENT_VERSION=' . $pdo->getAttribute(PDO::ATTR_CLIENT_VERSION) . "\n";
} catch (Throwable $e) {
    echo "PDO_CLIENT_VERSION=n/a（连接失败时可仅取 mysqli_get_client_info 作参考）\n";
}

// OPcache 运行状态（G3）
echo 'OPCACHE=' . (function_exists('opcache_get_status')
    ? json_encode(opcache_get_status(false), JSON_UNESCAPED_SLASHES) : 'module-not-loaded') . "\n";

// 扩展全量（G1）
echo "---EXT---\n" . implode("\n", get_loaded_extensions()) . "\n";
```

**采集要求（仅在获得授权后适用；未授权时整节不执行）：**

> 授权时须同时明确并批准下列每一项，缺任一项都不构成有效授权：

1. **具体文件路径**：探针文件的落地路径必须事先报批，不得自行选择目录；
2. **访问限制**：限来源 IP、加 Basic Auth 或临时 token，不得裸奔公开；**不输出完整 `phpinfo()` 页面**；
3. **采集字段**：以本节第 3 条为上限，不额外扩大采集面；
4. **执行窗口**：明确起止时间，采集完成即刻结束窗口；
5. **删除验证方式**：删除后必须**回读确认返回 404**，并留存回读记录。

执行时的技术要求（同样以授权为前提）：

1. 通过**实际 morrishk.net vhost** 发起请求（`curl https://morrishk.net/probe.php`），确保命中的是生产 7.4-FPM worker；
2. 采集内容至少包含：`PHP_VERSION`、`PHP_SAPI`（应为 `fpm-fcgi`）、`LOADED_INI`、`SCANNED_INI`、`extension_dir`、
   `get_loaded_extensions()` 全量、MySQL 客户端库版本（`mysqli_get_client_info()` 与
   `(new PDO(...))->getAttribute(PDO::ATTR_CLIENT_VERSION)` 两条路径）、`opcache_get_status()`；
3. 留档：采集时间（含时区）、vhost 名、FPM socket 路径（当前为 `/tmp/php-cgi-74.sock`）、请求命令、完整输出摘要。

### 6.2 CLI 结果的定位

CLI（即使使用 FPM 的 ini）执行 `php -m` 只能作为**交叉参考**：用于发现"CLI 有而 FPM 没有"或反之的差异线索，
**不得作为 FPM 实际加载清单的唯一证据**，也不得作为 G1 / G4 的关闭依据，**更不得替代因未授权而保持 OPEN 的 G1 / G3 / G4**。

### 6.3 G2 与生产的对照边界（当前不可对照）

G2（8.4 目标扩展清单）在**独立隔离环境**内采集——该环境属我方自建，探针页在这里不构成对生产的影响，
可直接用同版本探针页取 `PHP_SAPI=fpm-fcgi` 与 ini 路径，避免拿 CLI 结果对比。

但必须明确：**G2 只能描述"独立 8.4 环境装了什么"，不能反推"生产 7.4-FPM 实际加载了什么"。**
在 G1 仍为 OPEN 的情况下，G2 与生产之间**不存在可对齐的另一侧**，因此不做"逐项差异表"是当前正确状态；
若强行用 G2 去推断 G1，等于用未知替换未知。

待 G1 获得授权并完成采集后，才建立"生产 7.4 实测 ↔ 独立 8.4 实测"的逐项差异表。
