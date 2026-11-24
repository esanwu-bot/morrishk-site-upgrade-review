# 08 Composer 安全审计

来源：`composer audit --format=json` / `composer audit` / `--no-dev`，lock 位于 Round 39 分支（`fix/morrishk-r39-php85-native`）。未忽略任何 advisory、未隐藏或删除包。

## 1. 总量

| 视图 | 受影响包 | 通告数 | critical | high | medium | low | unknown |
|---|---|---|---|---|---|---|---|
| 全部依赖（含 dev） | 14 | **70** | 3 | 28 | 29 | 8 | 2 |
| 运行依赖（runtime） | 9 | **61** | 3 | 26 | 27 | 4 | 1 |
| dev-only | 5 | **9** | 0 | 2 | 2 | 4 | 1 |
| `--no-dev` 视图 | 9 | 61 | — | — | — | — | — |

原始材料：`evidence/composer_audit_all.json`、`composer_audit_all.txt`、`composer_audit_nodev.json`、`composer_audit_nodev.txt`、`composer_audit_totals.txt`、`composer_audit_summary.md`（逐条明细）。

## 2. 按包分布

| 包 | 版本 | 类型 | 依赖关系 | 通告 | 最严重 | 应用代码直接调用 |
|---|---|---|---|---|---|---|
| phpoffice/phpspreadsheet | 1.19.0 | runtime | transitive | 31 | critical | 未发现（无 PHPExcel/IOFactory 调用） |
| guzzlehttp/guzzle | 7.4.1 | runtime | transitive | 14 | high | 是（`GuzzleHttp\`，经 google/apiclient） |
| phpseclib/phpseclib | 3.0.37 | runtime | transitive | 6 | high | 未发现 |
| symfony/yaml | v7.4.1 | dev | transitive | 5 | high | 未发现（dev 链路） |
| guzzlehttp/psr7 | 2.8.0 | runtime | transitive | 4 | medium | 否（guzzle 内部） |
| firebase/php-jwt | v5.5.1 | runtime | transitive | 2 | critical | 未发现（`Firebase\JWT` 无引用） |
| **yiisoft/yii2** | **2.0.53** | runtime | direct | 1 | high | 是（框架本体） |
| phpunit/phpunit | 11.2.6 | dev | transitive | 1 | high | 否 |
| yiisoft/yii2-gii | 2.2.4 | dev | direct | 1 | medium | 是（仅 dev） |
| yiisoft/yii2-redis | 2.0.17 | runtime | direct | 1 | medium | 未发现（当前未启用 Redis） |
| psy/psysh | v0.12.15 | dev | transitive | 1 | medium | 否 |
| league/flysystem | 1.1.9 | runtime | transitive | 1 | low | 否 |
| symfony/dom-crawler | v7.4.1 | dev | transitive | 1 | low | 否 |
| symfony/polyfill-intl-idn | v1.32.0 | runtime | transitive | 1 | low | 间接（邮件/IDN） |

## 3. 关键通告（critical / high，节选）

| 包 | Advisory | CVE | 严重度 | 受影响 | 说明 |
|---|---|---|---|---|---|
| phpoffice/phpspreadsheet | PKSA-8cfg-tzhf-fr83 | CVE-2026-34084 | critical | ≤1.30.2 | `IOFactory::load` 在文件名可控时 SSRF/RCE |
| phpoffice/phpspreadsheet | PKSA-x678-4z45-v3d5 | CVE-2026-45034 | critical | ≤1.30.4 | 上述修复的绕过 |
| phpoffice/phpspreadsheet | 多条 | CVE-2026-108358/108359/59931 等 | high | ≤1.30.6 | XXE/DoS/SSRF 白名单绕过 |
| firebase/php-jwt | PKSA-2kqm-ps5x-s4f5 | CVE-2021-46743 | critical | <6.0.0 | 密钥/算法类型混淆 |
| guzzlehttp/guzzle | PKSA-gcrk-3vtt-1r14 | CVE-2026-69246 | high | <7.15.2 | 非规范主机绕过主机校验 |
| yiisoft/yii2 | PKSA-mxtc-f5ct-dqqd | CVE-2026-39850 | high | <2.0.55 | 视图参数名冲突导致本地文件包含 |
| yiisoft/yii2-redis | PKSA-tv9g-g554-cxh4 | CVE-2025-48493 | medium | <2.0.20 | 连接失败时日志可能暴露 AUTH |

完整 70 条：`evidence/composer_audit_summary.md` 的“逐条明细”。

## 4. 可利用性判断（不改变结论）

- **phpspreadsheet**：仓库内未发现 `PHPExcel`/`PhpSpreadsheet`/`IOFactory` 调用；但上传白名单包含 `xls,xlsx`，若后续增加导入解析，将直接进入高危面。
- **guzzle**：通过 `google/apiclient` 间接引入；应用侧未直接拼装外部 URL。
- **firebase/php-jwt**：无引用路径（Google 客户端走 OAuth2 库的其他实现）。
- **yii2 CVE-2026-39850**：视图名由代码固定，未接受用户输入作为 `view` 参数；当前无利用路径，但版本本身受影响。
- **yii2-redis**：`config/web.php` 未启用 Redis 组件。

## 5. 升级建议（本轮不执行）

| 包 | 建议 | 可用性 |
|---|---|---|
| phpoffice/phpspreadsheet | ≥1.30.7（或对应已修复线） | 需评估 1.19→1.30 的 API 变更 |
| guzzlehttp/guzzle | ≥7.15.2 | 需同步 guzzle/psr7 与 google/apiclient |
| firebase/php-jwt | ≥7.0.0 | 需评估 google/apiclient 兼容 |
| yiisoft/yii2 | 2.0.55（修复版本尚未发布，最新为 2.0.53） | **暂无可用补丁** |
| yiisoft/yii2-redis | 2.0.20（尚未发布，最新 2.0.19） | **暂无可用补丁** |

本轮**未修改任何依赖**，以上仅作为 Round 40 决策输入。

## 6. 合规声明

- 未使用 `composer audit --ignore-*`；
- 未删除/替换 advisory 或受影响的包；
- 未通过 `--no-dev` 隐藏生产依赖问题（两种视图均已列出）。
