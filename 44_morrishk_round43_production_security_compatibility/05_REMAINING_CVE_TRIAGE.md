# 05 剩余 Composer Advisory 分级（F-24）

## 1. 口径

- 数据来源：`composer audit --format=json`（Round 42 升级后，`evidence/composer_audit.json`）。
- 总计：**12 个包 / 68 条 advisory**（升级前 14 / 70）。
- 本轮不要求全部升级；不把“无调用”表述为“CVE 已修复”。

## 2. 六个重点包

### 2.1 汇总表

| 包 | 当前版本 | 受影响范围（摘要） | 修复版本 | 项目调用路径 | 实际可达性 | 当前隔离 | 立即修复 |
|---|---|---|---|---|---|---|---|
| `firebase/php-jwt` | 5.5.1 | `<7.0.0`、`<6.0.0` | **>=7.0.0** | 无直接调用；经 `google/apiclient` | 仅 CLI Google 命令 | 不解析外部 JWT | 否（随 apiclient 联动） |
| `guzzlehttp/guzzle` | 7.4.1 | 多条，最高 `<7.15.2` | **>=7.15.2**（7.x） | `commands/MapController.php` | 仅 CLI（控制台） | 无用户可控 URL；出站到站点自身 | 否（计划升级） |
| `guzzlehttp/psr7` | 2.8.0 | 最高 `<2.12.3` | **>=2.12.3** | 随 Guzzle | 同上 | 同上 | 否（随 Guzzle） |
| `phpoffice/phpspreadsheet` | 1.19.0 | 1.x 最高 `<=1.30.6`；2.x–5.x 另有范围 | **1.30.7（1.x）** 或最新 5.9.1 | 无直接调用 | 不可达（未解析文件） | XLS/XLSX 上传已关闭 | 否（保持隔离） |
| `phpseclib/phpseclib` | 3.0.37 | `<3.0.58`、`<=3.0.53`、`<=3.0.51`、`<=3.0.49` | **>=3.0.58** | 无直接调用；经 `google/apiclient` | 仅 CLI Google 命令 | 不使用 SSH/X25519 | 否（计划升级） |
| `league/flysystem` | 1.1.9 | `<=3.35.2` | **上游未给出修复版本** | 无调用 | 不可达 | 未启用 | 否（无修复可升） |

计数：php-jwt 2、guzzle 14、psr7 4、phpspreadsheet 31、phpseclib 6、flysystem 1。

### 2.2 调用路径证据

`evidence/cve_call_paths.txt`：

```text
GuzzleHttp hits=1  commands/MapController.php:20 use GuzzleHttp\Client;
Google\Client hits=1  commands/CController.php:21
PhpSpreadsheet / IOFactory / PHPExcel / phpseclib / League\Flysystem / Firebase\JWT = 0
```

- 两个使用方都在 `commands/`，属于 **console**，不是 Web 请求路径。
- `MapController` 的出站 URL 由站点自身数据拼接（`https://` + 主机名），不接收访客输入。
- `CController` 使用固定服务账号 JSON 路径与 Google Indexing API。
- Web 控制器、模型、视图均未直接调用上述库。

### 2.3 逐项判断

**firebase/php-jwt**
- 风险：算法/密钥类型混淆（CVE-2021-46743）、弱加密（CVE-2025-45769）。
- 可达性：仅当 Google 客户端处理 JWT 时；当前没有自定义 JWT 校验。
- 决策：不单独升级（会与 `google/apiclient` 版本约束冲突），随 apiclient 一起升级到 `>=7.0.0` 并回归 CLI 命令。
- 测试：`composer update google/apiclient -W` 后运行 Map/C 命令的 dry-run（不发真实请求），检查 JWT 解析路径。

**guzzlehttp/guzzle**
- 风险：跨域 Cookie/Authorization 泄漏、重定向 Referer 泄漏、代理降级、非规范主机绕过等。
- 可达性：仅 CLI；无访客可控 URL；不读取响应 Cookie。
- 决策：计划升级到 `>=7.15.2`（或 8.x 与 apiclient 兼容的版本），先在不含生产的 worktree 验证。
- 测试：`composer update guzzlehttp/guzzle guzzlehttp/psr7 -W`；运行 CLI 命令 dry-run；`composer audit` 对比。

**guzzlehttp/psr7**
- 随 Guzzle 升级；不单独升级。

**phpoffice/phpspreadsheet**
- 31 条，包含 SSRF/XSS/XXE/DoS；多数需要“解析攻击者文件”。
- 当前无解析调用，XLS/XLSX 上传关闭，CSV/PDF/TXT/DOC/DOCX 不进入解析器。
- 决策：**保持隔离**，不恢复 XLS/XLSX；未来若需解析，按 06（Round 42 上传决策）单独升级到无高危 advisory 的版本并隔离进程。
- 不把“无调用”写成“已修复”。

**phpseclib/phpseclib**
- 6 条：PBKDF 迭代 DoS、X25519 非恒定时间、X.509 AIA SSRF、OID 放大 DoS、HMAC 比较、AES-CBC padding oracle。
- 当前无 SSH/SFTP/X25519/证书校验调用。
- 决策：随 apiclient 升级到 `>=3.0.58`；升级前不启用相关 API。

**league/flysystem**
- 1 条（路径规范化绕过），影响 `<=3.35.2`，**上游未给出修复版本**。
- 当前无调用。
- 决策：保持未启用；跟踪上游修复；不手工改 vendor。

## 3. 其余包（不在本轮重点）

`symfony/yaml`(5)、`guzzlehttp/psr7`(4)、`psy/psysh`(1)、`phpunit/phpunit`(1)、`symfony/dom-crawler`(1)、`symfony/polyfill-intl-idn`(1)、`yiisoft/yii2-gii`(1)、`firebase/php-jwt`(2)、`league/flysystem`(1) 等。

- dev-only（yii2-gii/phpunit/psysh/dom-crawler/yaml）不随生产运行，但工具链仍应单独升级。
- 本轮未升级任何包；`yii2`/`yii2-redis` 已在 Round 42 修复。

## 4. 升级优先顺序与测试计划

1. `guzzlehttp/guzzle >=7.15.2` + `guzzlehttp/psr7 >=2.12.3`（低风险，7.x 内）。
2. `google/apiclient`（联动 `firebase/php-jwt >=7`、`phpseclib >=3.0.58`）。
3. `phpspreadsheet` 仅在批准 Excel 解析时升级，并隔离解析进程。
4. `flysystem` 等上游修复；无修复前保持未启用。

每次升级必须：

- 独立 worktree；
- `composer update <pkg> -W`，不手工改 vendor；
- `composer install`、`check-platform-reqs`、`composer audit`；
- 重跑 Round 42 认证/吊销矩阵 + 本轮 staging 回归 + 浏览器 smoke；
- 记录升级前后版本与 advisory 数量。

## 5. 结论

- 六个重点包均有明确版本、影响范围、修复目标和调用路径。
- 当前 Web 请求路径不可达；风险主要在 CLI 与“未来启用解析/外部 API”场景。
- **不宣称 CVE 清零**；仍为 12 包 / 68 条。
