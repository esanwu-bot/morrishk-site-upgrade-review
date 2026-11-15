# 06 · 本次解析方案的平台下界（由 04 的 lock 反算）

> **口径（v1.2.1 勘误）**：本文计算的是**本次协调升级 dry-run 实际解析出的这套依赖组合**的平台下界，
> 不等于"所有可行的 Codeception 5 测试链都必须 PHP 8.4"。若要把下界压到 8.2/8.3，须另做受约束求解并实跑验证（见文末）。

对 `04` 生成的 lock 中所有包的 `require.php` 取下界，最高者决定整体最低要求：

| 包 | 试验版本 | `require.php` |
|---|---|---|
| `symfony/console` / `yaml` / `string` / `finder` / `event-dispatcher` / `dom-crawler` / `css-selector` / `var-dumper` | v8.0.x | **`>=8.4`** |
| `phpunit/phpunit` | 12.5.44 | `>=8.3` |
| `codeception/codeception` | 5.3.7 | `^8.2` |
| `codeception/module-filesystem` | 3.0.2 | `^8.2` |
| `codeception/module-asserts` | 3.3.0 | `^8.2` |
| `codeception/lib-asserts` | 3.2.0 | `^8.2 \|\| ^8.3 \|\| ^8.4 \|\| ^8.5` |
| `phpoffice/phpspreadsheet` | 5.11.0 | `^8.2` |
| `behat/gherkin` | v4.18.0 | `>=8.1 <8.6` |
| `yiisoft/yii2` | 2.0.55 | `>=7.4.0` |

**结论：本次默认求解得到的这套组合，平台下界为 PHP 8.4，无法在 7.4 上启动。**
这只说明该解析方案不可降级复用，**不构成"所有 Codeception 5 组合的理论最低版本都是 8.4"的证明**。
这不是配置问题，而是 Codeception 5 系当前的依赖选择（Symfony 8 家族 + PHPUnit 12）。

## 对"先在 7.4 上升级、再切 8.4"这个顺序的影响

| 动作 | 在 PHP 7.4 上可行？ | 说明 |
|---|---|---|
| 升 Yii 2.0.44 → 2.0.55 | 可行 | Yii 2.0.55 的 `require.php` 是 `>=7.4.0`，7.4 可跑 |
| 用**旧** Codeception 4 跑回归 | 可行 | 就是当前状态，可作为 7.4 阶段的安全网 |
| 升到 **Codeception 5 工具链** | **不可行** | 见上表，最低 8.4 |
| 用新工具链验证 8.4 staging | 可行 | 工具链与运行时同时在 8.4 |

**因此路线图需要修正**：测试链升级不能放在"PHP 仍 7.4"的阶段，它必然与 PHP 8.4 环境同时发生。
7.4 阶段只能靠**既有 Codeception 4 用例 + 人工冒烟**，这一点必须在计划里写清，不能假设"升级后的测试链会兜住框架升级"。

## 若要把工具链压到 8.1–8.3（未验证完整组合）

试验：在 `04` 的基础上追加 `require-dev.symfony/console: ^6.4`、`symfony/yaml: ^6.4`。

结果：

```
  - Locking codeception/codeception (5.3.7)
  - Locking codeception/module-yii2 (1.1.12)
  - Locking phpunit/phpunit (12.5.44)
  - Locking symfony/browser-kit (v8.0.14)     ← 仍由 lib-innerbrowser 传递引入
  - Locking symfony/console (v6.4.50)
  - Locking symfony/service-contracts (v3.8.1)
  - Locking symfony/yaml (v6.4.50)
```

只 pin console/yaml **不足以**降低最低要求：`browser-kit v8.0.14` 仍是 `>=8.4`，`phpunit 12.5.44` 仍是 `>=8.3`。
若要真正落到 8.2，还需同时 pin `symfony/browser-kit`、`dom-crawler`、`css-selector`、`finder`、`event-dispatcher` 与 `phpunit ^11`，
并确认 `codeception/module-*` 的可用版本组合。**本次未验证该组合，不写入结论。**
