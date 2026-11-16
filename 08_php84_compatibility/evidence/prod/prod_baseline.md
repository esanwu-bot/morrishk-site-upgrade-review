# 生产环境核验记录（§6 证据）

| 项 | 内容 |
|---|---|
| 文档编号 | MRH-P1-PHP-PROD-001 |
| 版本 | v1.1（增补 §六 FPM 上下文采集方式；P2/P4/P6/P7 按生产红线收窄措辞） |
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
> 生产侧唯一允许的动作是只读采集（§六 的探针页方式），采集后立即删除探针。

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

| # | 缺口 | 采集要求 | 为什么不能省 |
|---|---|---|---|
| G1 | FPM 实际加载的完整扩展清单 | **通过实际 morrishk.net vhost 请求一个临时 PHP 探针页**，在真实 PHP 7.4-FPM worker 中采集 `phpinfo()`、`get_loaded_extensions()`、`PHP_VERSION`、`php_ini_loaded_file()`、`php_ini_scanned_files()` 等信息，再与 `composer.lock` 的 19 个 `ext-*` 逐项比对。**CLI 使用 FPM ini 执行 `php -m` 的结果仅作交叉参考，不得作为 FPM 实际加载清单的唯一证据**（CLI 与 FPM 可能加载不同 ini、不同扩展目录、不同 `disable_functions`）。探针采集后立即删除，并保留采集时间、vhost、FPM socket 路径与输出摘要。完整探针脚本见 §六 | 缺任一扩展（`zip`/`gd`/`intl` 等）即等于目标环境不可用 |
| G2 | PHP 8.4 目标扩展清单 | Ubuntu 24.04 下 `php8.4 -m`，与 G1 做**逐项差异表** | "目标环境是否等价于生产"的唯一依据 |
| G3 | OPcache 运行状态 | `php -i` 中 `Opcode Caching`、`opcache.enable`、`validate_timestamps` | 性能对比与部署行为 |
| G4 | MySQL 客户端库 | 7.4 的 `pdo_mysql` 所用 mysqlnd / libmysqlclient 版本；8.4 的 mysqlnd 版本。**沿用 G1 的探针页取证方式**（`mysqli_get_client_info()`、`(new PDO(...))->getAttribute(PDO::ATTR_CLIENT_VERSION)`、`phpinfo()` 的 mysqlnd 段），CLI 输出仅作交叉参考 | 服务端仍为 5.6.50，跨版本连接需实测 |
| G5 | `vendor/` 实际版本 | 副本 `composer install` 后 `composer show` 留档 | 4 个待核实包的运行风险只能在此之后评估 |

> 排序：G1–G3 是 **PHP 8.4 验收前**的关键环境证据；G4–G5 是补齐运行时与依赖基线。

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

## 六、附录：FPM 上下文采集方式（G1 / G4）

### 6.1 采集方式（唯一具备证明力的路径）

`php -m` 是 **CLI SAPI** 命令；即使指定 FPM 的 ini，也不能证明 FPM worker 最终加载了相同的扩展与配置
（ini 路径、`extension_dir`、`disable_functions`、`opcache`、`env` 都可能不同）。故 G1 / G4 一律通过下列方式采集：

```php
<?php
// probe.php —— 临时探针，放在站点可访问目录，采集完成后立即删除
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

采集要求：

1. 通过**实际 morrishk.net vhost** 发起 HTTP 请求（`curl https://morrishk.net/probe.php`），确保命中的是生产 7.4-FPM worker；
2. 同时保存 `phpinfo()` 输出（可用 `phpinfo(INFO_MODULES)` 单独一份）作为交叉证据；
3. 采集内容至少包含：`PHP_VERSION`、`PHP_SAPI`（应为 `fpm-fcgi`）、`LOADED_INI`、`SCANNED_INI`、`extension_dir`、
   `get_loaded_extensions()` 全量、MySQL 客户端库版本（`mysqli_get_client_info()` 与
   `(new PDO(...))->getAttribute(PDO::ATTR_CLIENT_VERSION)` 两条路径）、`opcache_get_status()`；
4. **探针文件采集后立即删除**，并确认删除后请求返回 404；
5. 留档：采集时间（含时区）、vhost 名、FPM socket 路径（当前为 `/tmp/php-cgi-74.sock`）、请求命令、完整输出摘要。

### 6.2 CLI 结果的定位

CLI（即使使用 FPM 的 ini）执行 `php -m` 只能作为**交叉参考**：用于发现"CLI 有而 FPM 没有"或反之的差异线索，
**不得作为 FPM 实际加载清单的唯一证据**，也不得作为 G1 / G4 的关闭依据。

### 6.3 与 8.4 目标环境的对照

G2（8.4 目标扩展清单）在**独立隔离环境**内以同样方式采集（同版本探针页），
再与 G1 的输出做逐项差异表；两侧都必须带 `PHP_SAPI=fpm-fcgi` 与 ini 路径，避免拿 CLI 结果对比 FPM 结果。
