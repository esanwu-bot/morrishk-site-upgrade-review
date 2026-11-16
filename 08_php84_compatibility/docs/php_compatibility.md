# PHP 8.4 兼容性盘点（Morris 老站 · 只读）

| 项目 | 值 |
|---|---|
| 对象 | `newPlan/morrishk.net`（Yii2 Basic） |
| 盘点方式 | **只读**：读取 `composer.json` / `composer.lock` / 本地 CLI 扩展，未修改任何文件、未变更任何运行时 |
| 盘点时间 | 2026-11-16 |
| 目标版本 | **PHP 8.4**（首选）；PHP 8.5 仅作兼容性验证候选 |
| 当前生产 | PHP 7.4（已停止安全支持） |
| 裁定基准 | **以 `app_code_compatibility.md` v1.2.5 为准**（本文为依赖层盘点，不含裁定权） |

> **当前取证约束（v1.2.3，评审裁定）**：主报告 v1.2.5 是唯一有效裁定依据。本文中凡是与主报告冲突的
> **生产操作指令**一律作废。生产环境**不得创建、上传或执行任何文件（含临时探针页）**——这属于生产文件系统写入，
> 不在已批准的只读范围内；"采集后立即删除"不改变其性质。`php -m` / `php -i` 即使在生产机器上执行，也是 **CLI SAPI**，
> **不能关闭 G1**（FPM 实际加载清单）。G1 / G3 / G4 当前均为 **OPEN · 未获授权**。

---

## 0. 结论（先看这一段）

> **勘误（2026-11-16，见 `app_code_compatibility.md` §3.4）**：本文件初版记 BLOCKER 3 个，经 `composer prohibits php 8.4.0 --locked` 复核应为 **4 个**（漏 `symfony/service-contracts v1.1.2`）；§4 第 2 项「mysqli 默认抛异常」经核实**不适用**（实际为 PDO 驱动）。以下相关表述已同步修正。
>
> **二次勘误（v1.1 评审后，以 `app_code_compatibility.md` v1.1 为准）**：
> 1. `symfony/service-contracts` 不是由 `browser-kit` 引入，完整链是 `symfony/console v5.4.3` ← `codeception/codeception 4.1.29`；只升 browser-kit 不能解除该项（见 §1 行内修正）。
> 2. `moonlandsoft/yii2-phpexcel` 锁定版本的依赖是 `phpoffice/phpspreadsheet`，**不是 PHPExcel**；lock 中不存在 `phpoffice/phpexcel`，且站内对该包零引用（详见 `app_code_compatibility.md` §3.3）。
> 3. `jaeger/querylist` 上游未停止维护（最新 V4.4.7，2026-02，要求 PHP ≥8.1），应升版本而非移除。
> 4. 两个 `dev-master` 依赖在 lock 中已记录具体 commit，当前构建可复现；风险是根约束 `@dev` 在未来重新求解时漂移。

**现状不能直接升到 PHP 8.4。** 不是"改几个 deprecated 函数"的量级，而是**依赖图里有 4 个包在 PHP 8.4 上解析不出来**（全部在 `require-dev`，生产依赖无一被硬拦），另有 1 个关键链路依赖已被上游宣告弃用（swiftmailer）、1 个框架版本严重落后（Yii 2.0.44）。

| 判定 | 数量 | 含义 |
|---|---:|---|
| BLOCKER | 4 | Composer 约束直接拒绝在 8.4 上解析/安装 |
| HIGH | 5 | 能装上，但运行期确定出问题或已 EOL |
| MEDIUM | 6 | 行为变化 / 大量 deprecation，需回归 |
| OK | 其余 | 版本已支持 8.x |

**关键判断**：`composer.json` 写的是 `"php": ">=5.6.0"`，Composer **不会**在 PHP 8.4 上拦你。也就是说，`composer install` 很可能"成功"，然后在运行时炸——这比装不上更危险，因为它会让人误判"升级没问题"。

---

## 1. 四个硬阻塞（BLOCKER）

来源：`composer prohibits php 8.4.0 --locked` 求解输出，属于**可判定事实**，不是推测。

| 包 | 锁定版本 | 约束 | 为什么阻塞 8.4 | 处置 |
|---|---|---|---|---|
| `symfony/browser-kit` | v4.2.4 | `^7.1.3` | 约束只允许 PHP 7.1.x，8.4 完全不匹配 | 仅测试用，升级到 `^6.4` 或移除 |
| `phpspec/prophecy` | v1.15.0 | `^7.2 \|\| ~8.0, <8.2` | 显式排除 8.2+ | 测试依赖，改 PHPUnit 10/11 后移除 |
| `codeception/module-yii2` | 1.1.5 | `>=5.6.0 <=8.1 \| ~8.1.0` | 上限卡在 8.1 | 升 Codeception 5 + module-yii2 1.3 |
| `symfony/service-contracts` | v1.1.2 | `^7.1.3` | 上限卡在 7.x | **修正**：由 `symfony/console v5.4.3`（← `codeception/codeception 4.1.29`）引入；console 允许 `^1.1\|^2\|^3`，可单点 `composer update` 到 2.x/3.x 解除 |

> 这四项全部在 `packages-dev`（60 个开发依赖），`packages`（71 个生产依赖）**无一被硬拦**。
> 生产部署链路（`composer install --no-dev`）在 8.4 上不会被拒绝，但**开发/CI/自动化测试链路会直接断** —— 没有测试链路的升级等于盲飞，因此仍是 P0。

---

## 2. 五个高风险（HIGH）

| 包 | 锁定版本 | 问题 | 证据类型 | 处置 |
|---|---|---|---|---|
| `yiisoft/yii2` | **2.0.44** | 2021 年版本，早于 PHP 8.1/8.2/8.4 的兼容修复；大量隐式可空参数（8.4 弃用） | 版本时间 + 约束 | **先升到 2.0.55**，再谈 8.4 |
| `swiftmailer/swiftmailer` | v6.3.0 | 上游 2021-11 停止维护；`yii2-swiftmailer` 同样停更 | 上游 EOL | 换 `symfony/mailer` 或 `yii2-symfonymailer` |
| `moonlandsoft/yii2-phpexcel` | 2.0.0 | **修正**：lock 的 `require` 为 `phpoffice/phpspreadsheet: "*"`（锁定 1.19.0，`php ^7.2 \|\| ^8.0`），不含 PHPExcel；站内零引用 → 应按死依赖移除 | lock `require` 实测 | 直接从 composer.json 移除 |
| `mihaildev/yii2-ckeditor` | 1.0.1 | 2016 年后无更新，PHP 8 下动态属性告警 | 版本时间 | 换 `2amigos/yii2-ckeditor-widget` 或原生 CKEditor 5 |
| `phpunit/phpunit` | 8.5.23 | PHPUnit 8 官方支持到 8.1；8.4 上运行期报错 | 上游支持矩阵 | 升 PHPUnit 10/11（需 PHP 8.1+） |

---

## 3. 六个中风险（MEDIUM）

| 包 | 锁定版本 | 风险点 | 处置 |
|---|---|---|---|
| `symfony/*`（console/finder/string/yaml 等） | 5.4.3 | Symfony 5.4 于 2025-11 结束支持，未针对 8.4 验证 | 随 Yii 升级到 6.4 LTS |
| `phpoffice/phpspreadsheet` | 1.19.0 | 老版本对 8.2+ 动态属性/8.4 弃用敏感 | 升 2.x 或 3.x |
| `guzzlehttp/guzzle` | 7.4.1 | 可用，但 7.4 已老，8.4 建议 7.9+ | 升 7.9 |
| `jaeger/querylist` | V4.2.8 | **修正**：上游未停维护，最新 V4.4.7（2026-02，要求 PHP ≥8.1），升级即得官方 8.x 支持 | 升 4.4.x；采集命令在 CLI 链路，影响面小 |
| `kartik-v/yii2-grid` | **dev-master**（`09f8e76`） | 根约束 `@dev`，lock 已记录 commit → 当前可复现；风险是重新求解时漂移 | 改锁具体 tag |
| `yiisoft/yii2-elasticsearch` | 2.0.7 | 客户端版本与 ES 服务端绑定，8.4 兼容取决于底层 client | 本项目新架构已改用 OpenSearch，老站该依赖可评估移除 |

---

## 4. PHP 8.4 语言层需要改代码的点

按"会不会真的炸"排序，前三条是重点：

| # | 变更 | 影响 | 本项目的具体位置 |
|---|---|---|---|
| 1 | **隐式可空参数弃用**（`function f(string $x = null)`） | 全站 E_DEPRECATED，日志被淹没，掩盖真实错误 | Yii 2.0.44 核心与业务代码；升 2.0.55 可消掉大部分。**业务代码本身 0 命中**（无类型声明），风险全在框架内部 |
| 2 | ~~mysqli 默认抛异常~~ | **不适用，已移除** | `config/db.php:5` 为 `mysql:` DSN → **PDO** 驱动，PDO 始终 `ERRMODE_EXCEPTION`，无行为变化 |
| 3 | **动态属性弃用**（PHP 8.2 起） | PHPExcel、老 Widget、业务 Model 大量使用 | `yii2-phpexcel`、`yii2-ckeditor`、`QueryList` |
| 4 | `${var}` 字符串插值弃用 | 少数模板/配置 | 需全量 grep `"${` |
| 5 | `utf8_encode` / `utf8_decode` 弃用 | 编码转换处 | 老站 utf8 数据清洗逻辑 |
| 6 | 浮点转整型隐式截断弃用 | 价格、库存计算 | `UnitPrice`、`Quantity` 相关计算 |
| 7 | `E_STRICT` 常量弃用 | 自定义错误处理 | 若 `error_reporting` 显式包含 `E_STRICT` 会告警 |

---

## 5. 依赖健康度总览

| 指标 | 数值 |
|---|---:|
| 锁定包总数（含 dev） | 131 |
| 生产依赖 | 见 `composer.lock` `packages` |
| 声明 `ext-*` 扩展 | 19 个（见 `php_modules.txt`） |
| 已停止维护的包 | **1**（swiftmailer，packagist 标记 abandoned → symfony/mailer）；另有 1 个 2014 年后无更新（yii2-ckeditor）、1 个死依赖（yii2-phpexcel）、1 个版本旧但在维护（querylist） |
| 未锁定版本（`dev-master`） | 2（yii2-grid、yii2-bootstrap4-dropdown） |
| PHP 约束声明 | `>=5.6.0`（**过宽，失去保护作用**） |

---

## 6. 建议的升级路径（结论）

```
PHP 7.4 + Yii 2.0.44（现状）
   ↓ 第 1 步：只升 Yii 补丁版本（2.0.44 → 2.0.55），PHP 仍 7.4，验证业务无回归
   ↓ 第 2 步：替换停维护依赖（swiftmailer / ckeditor）、升级 querylist、移除死依赖，PHP 仍 7.4，再验证
   ↓ 第 3 步：PHP 8.4 环境就绪后，同一批完成测试工具链升级（Codeception 5 / PHPUnit 12）
   ↓ 第 4 步：8.4 + 依赖小幅升级，在独立环境（非生产）全量回归
   ↓ 第 5 步：〔未来〕运行时部署方案 → 独立评审批准 → 才讨论生产灰度与回滚池
```

> **第 5 步的边界（v1.2.2 增补，评审明确要求）**：第 5 步是**未来阶段**，且**不是当前实施建议**。
> 在独立环境完成 PHP 8.4 + Yii 2.0.55 + 新测试链验证、并取得独立评审批准之前，
> **不在现有生产服务器安装新的 PHP-FPM 版本，不在宝塔新增 PHP 8.4 运行池，不修改现有 Nginx vhost / FPM socket / 宝塔 PHP 版本配置**。
> 生产 PHP 7.4.33-FPM 保持不变。红线条款见 `app_code_compatibility.md` §7.4。

> **第 3 步的硬约束（v1.2.1 口径）**：按本次协调升级 dry-run 解析出的组合（Symfony 8 + PHPUnit 12 + Codeception 5.3），
> **该方案要求 PHP 8.4 或更高**，因此不能在 7.4 上启动。此结论不等于"所有 Codeception 5 组合的理论下界都是 8.4"；
> 若需降低工具链下界，须另做受约束求解与实跑验证。故"测试链升级"不能放在 7.4 阶段；7.4 阶段的回归只能依赖
> **既有 Codeception 4 用例 + 人工冒烟**。推导见 `app_code_compatibility.md` §3.2.4 与 `solve/06-toolchain-min-php.md`。

**为什么先升 Yii 再升 PHP**：把"框架兼容性"和"运行时兼容性"两个变量分开。同时改，出问题时无法定位是框架还是 PHP。

---

## 7. 未验证项（诚实边界）

以下内容**本次无法确认**，不做推测：

| 项 | 原因 | 需要的动作 |
|---|---|---|
| **生产 FPM 实际加载的完整扩展清单（G1）** | **当前 G1 OPEN，未获授权，不执行生产探针。** 唯一有效来源是真实 FPM worker，而取证须在生产站点目录放探针文件，属生产文件系统写入 | **不执行。** CLI `php -m` 仅作交叉参考，**不作为 G1 关闭依据**；不得以独立 8.4 环境结果替代（G2 不能反推 G1） |
| 生产 php.ini 关键项 | 属不落盘的只读信息 | 可按既有权限核验，重点看 `error_reporting`、`memory_limit`、`opcache`；**但不得以此替代 FPM worker 证据**，`opcache` 运行态（G3）仍为 OPEN |
| 业务代码自身的 8.4 兼容点 | 初版只读依赖层 | **已完成**，见 `app_code_compatibility.md`：移除函数 0 命中 |
| Yii 2.0.55 在 8.4 的真实表现 | 需实际运行 | 在**独立 8.4 环境**起 8.4 + 2.0.55 跑冒烟（不在生产） |
| MySQL 5.6.50 客户端库兼容 | 与 PHP 版本相关 | 8.4 侧 mysqlnd 在**独立环境**实测（协议层通常兼容）；**生产侧 mysqlnd 版本属 G4，OPEN · 未获授权** |
