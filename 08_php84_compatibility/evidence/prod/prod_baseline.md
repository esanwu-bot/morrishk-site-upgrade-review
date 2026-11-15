# 生产环境核验记录（§6 证据）

| 项 | 内容 |
|---|---|
| 文档编号 | MRH-P1-PHP-PROD-001 |
| 版本 | v1.0 |
| 记录日期 | 2026-11-16 |
| 取证方式 | **评审方在宿主机与本项目 vhost 范围内现场核实**；本记录只汇总"已确认的事实 + 取得方式 + 未确认项"，**不复制任何未实际执行的命令输出** |
| 适用对象 | `morrishk.net`（生产），PHP 7.4-FPM |
| 不在范围 | 其他站点 vhost、其他 Docker 项目的 PHP-FPM、CDN/WAF 层、数据库服务端配置 |

> 本记录的存在意义：v1.0 报告曾写"无生产机访问权限"，与后续核实结果矛盾；本记录用于把"已确认 / 部分确认 / 仍缺"
> 三档钉死在证据上，供后续验收逐项对照。**凡本记录未列的事实，一律视为未验证。**

---

## 一、已确认（可作为设计与实施输入）

| # | 事实 | 取证方式 | 影响 |
|---|---|---|---|
| P1 | 站点运行时为 **PHP 7.4.33-FPM** | 站点 `phpinfo`/`php -v` 与 FPM 进程、`php-fpm` 版本一致 | 生产基线版本 |
| P2 | Nginx 通过 **Unix socket** 连接 PHP-FPM（非 TCP `127.0.0.1:9000`） | vhost `fastcgi_pass` 指向 socket 路径，socket 文件存在且有属主 | 灰度时可新增 8.4 池并改指向，无需改连接形态 |
| P3 | 该 vhost 的 **`root` 指向 `morrishk.net/web`** | vhost 配置 `root` 指令 | 决定静态资源与源码目录的可达性（见第四节适用范围） |
| P4 | **PHP 8.0-FPM 已安装但没有监听进程**，站点未使用 | 进程列表无对应 master/worker；无监听 socket | 不能把"已安装"当"正在服务"；8.4 属全新池 |
| P5 | 其他 PHP-FPM master 进程属于**别的 Docker 项目** | 进程的容器归属 / 监听路径与本站不一致 | 不得与本站运行时混为一谈，避免误判 |
| P6 | 已取得 FPM 池参数：`listen`、`user`/`group`、`pm` 相关配置 | 池配置 `php-fpm.d/*.conf` | 8.4 池可照抄，`pm.max_children` 需按新机内存复核 |
| P7 | 已取得该站点 Nginx vhost 完整配置 | `nginx -T` 或站点 conf 文件 | 灰度切换点（`fastcgi_pass`）明确 |

## 二、部分确认（方向明确，数值未钉死）

| # | 项 | 已取得 | 仍缺 | 影响 | 对应缺口 |
|---|---|---|---|---|---|
| P8 | PHP 7.4 扩展 | 以 **FPM 的 ini** 运行的 CLI 取得模块清单；FPM 侧确认存在 **GD、MySQLi、PDO** | FPM **实际加载**的完整清单（须在 FPM 上下文取，不能用 CLI 直接替代） | 决定 8.4 目标机要装哪些 `ext-*`（lock 声明 19 个） | G1 |
| P9 | PHP 7.4 关键配置 | 已确认 FPM ini 路径与加载情况 | `error_reporting`、`memory_limit`、`session.*` 的实际取值 | 决定 deprecation 是否被记录、回归如何观察 | G1/G3 |
| P10 | OPcache | 此前盘点结论为"未启用" | `opcache.enable`、`enable_cli`、`Opcode Caching` 的实际值 | 性能基线与缓存清理流程 | G3 |

## 三、仍缺（8.4 验收前的硬前提）

| # | 缺口 | 采集要求 | 为什么不能省 |
|---|---|---|---|
| G1 | FPM 实际加载的完整扩展清单 | **在 7.4-FPM 上下文**执行 `php -m`（例如经站点临时探针页或 `php-fpm` 环境内的 CLI，且需确认所用 ini 与 FPM 一致），与 `composer.lock` 的 19 个 `ext-*` 逐项比对 | 缺任一扩展（`zip`/`gd`/`intl` 等）即等于目标环境不可用 |
| G2 | PHP 8.4 目标扩展清单 | Ubuntu 24.04 下 `php8.4 -m`，与 G1 做**逐项差异表** | "目标环境是否等价于生产"的唯一依据 |
| G3 | OPcache 运行状态 | `php -i` 中 `Opcode Caching`、`opcache.enable`、`validate_timestamps` | 性能对比与部署行为 |
| G4 | MySQL 客户端库 | 7.4 的 `pdo_mysql` 所用 mysqlnd / libmysqlclient 版本；8.4 的 mysqlnd 版本。**必须从实际 FPM 所用 PHP 环境取证，不得只用 CLI 输出替代** | 服务端仍为 5.6.50，跨版本连接需实测 |
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
