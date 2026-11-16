# Yii2 扩展与第三方依赖兼容性审计

> **适用性声明（v1.2.3 同步，评审 D3）**：本文为 **v1.0 期产物**，**不承担裁定权**。
> **当前唯一有效裁定依据是 `app_code_compatibility.md` v1.2.5。** 本文与主报告冲突之处（尤其是任何生产操作指令）**一律作废**。
>
> **勘误提示（v1.2.1；基准已于 v1.2.3 更新）**：其中 `moonlandsoft/yii2-phpexcel` 的判定已作废——
> 该包锁定的依赖是 `phpoffice/phpspreadsheet`（不是 PHPExcel），且站内零引用，应按**死依赖移除**。
> 其余结论以 `app_code_compatibility.md` **v1.2.5** §3.3 为准。
>
> **生产取证约束（自 v1.2.3 起生效）**：文中任何要求在**生产机**上导出模块清单或 ini 信息的表述，均**不得作为关闭 G1 的依据**——
> CLI 的模块清单是 CLI SAPI，不能代表 FPM worker 实际加载；且未经单独授权**不得在生产文件系统创建、上传或执行任何文件（含探针页）**。
> G1 / G3 / G4 当前均为 **OPEN · 未获授权**。

> **术语定义（v1.2.5 补，评审尾项）**：**本文所称 Staging / staging，均指独立于生产服务器的测试主机或独立容器，不包括在现有生产服务器上创建的 staging 站点。** 任何 staging 测试均须遵守主报告 v1.2.5 §7.4 的 **R-1～R-7** 生产红线。
> 因此第 6 节"真正的结论必须来自 staging 运行"中的 staging，指上述独立环境，**不构成**在生产服务器上建测试站点的许可。

对象：`composer.lock` 锁定的 131 个包中，与 Yii2 直接相关或属于"业务功能承载"的部分。
判定口径：**以锁定版本 + 上游维护状态为准**；标注"待实测"的项不在本次给结论。

图例：`OK` 可直接用 · `UPGRADE` 升级后可用 · `REPLACE` 建议替换 · `DROP` 建议移除 · `BLOCK` 8.4 装不上

---

## 1. Yii2 官方组件

| 包 | 锁定版本 | PHP 8.4 判定 | 说明与动作 |
|---|---|---|---|
| `yiisoft/yii2` | 2.0.44 | **UPGRADE** | 2021 年版本。先升 **2.0.55**（最低仍为 PHP 7.4），再在 8.4 实测。不要跨大版本跳 |
| `yiisoft/yii2-composer` | 2.0.10 | OK | 安装器插件，无运行时风险 |
| `yiisoft/yii2-bootstrap` | 2.0.11 | OK | Bootstrap 3 组件；与 PHP 版本无关，但 BS3 已停止维护 |
| `yiisoft/yii2-bootstrap4` | 2.0.10 | OK | 与上面并存说明前端资产未收口，属技术债 |
| `yiisoft/yii2-swiftmailer` | 2.1.3 | **REPLACE** | 底层 swiftmailer 已停维护。换 `yii2-symfonymailer` + `symfony/mailer` |
| `yiisoft/yii2-redis` | 2.0.17 | OK | 依赖 phpredis 扩展；需确认生产装了 redis 扩展 |
| `yiisoft/yii2-imagine` | 2.3.0 | OK | 依赖 `imagine/imagine` 1.2.4，建议随主版本升到 1.5 |
| `yiisoft/yii2-elasticsearch` | 2.0.7 | **DROP（评估）** | 新架构改用 OpenSearch，老站该依赖若无实际查询可移除 |
| `yiisoft/yii2-debug` | 2.1.18 | UPGRADE | 仅开发环境；随 Yii 升 2.1.x 最新 |
| `yiisoft/yii2-gii` | 2.2.4 | UPGRADE | 仅开发环境 |
| `yiisoft/yii2-faker` | 2.0.5 | OK | 仅测试 |

---

## 2. 第三方 Yii2 扩展

| 包 | 锁定版本 | 判定 | 风险与动作 |
|---|---|---|---|
| `kartik-v/yii2-grid` | **dev-master** | **UPGRADE + 锁版本** | 功能核心（后台列表）。dev-master 不可复现，必须锁到 `v3.5.x` |
| `kartik-v/yii2-editable` | v1.7.9 | UPGRADE | 后台行内编辑；升 1.8.x |
| `kartik-v/yii2-bootstrap4-dropdown` | **dev-master** | UPGRADE + 锁版本 | 同上，锁 tag |
| `kartik-v/yii2-dialog` | v1.0.6 | OK | 依赖 bootstrap3 弹窗 |
| `kartik-v/yii2-krajee-base` | v3.0.2 | OK | 上述组件的基础库 |
| `kartik-v/yii2-widget-activeform` | v1.6.0 | OK | — |
| `kartik-v/yii2-popover-x` / `bootstrap-popover-x` | v1.3.5 / v1.5.1 | OK | — |
| `mihaildev/yii2-ckeditor` | 1.0.1 | **REPLACE** | 2016 年后无更新；PHP 8.2+ 动态属性告警。换 `2amigos/yii2-ckeditor-widget` |
| `moonlandsoft/yii2-phpexcel` | 2.0.0 | **REPLACE** | PHPExcel 已死。直接用 `phpoffice/phpspreadsheet`（项目已间接依赖 1.19.0） |

---

## 3. 非 Yii 的关键依赖

| 包 | 锁定版本 | 判定 | 说明 |
|---|---|---|---|
| `google/apiclient` | 2.12.1 | UPGRADE | 升 2.18+；`google/apiclient-services` v0.355 建议同步 |
| `jaeger/querylist` | V4.2.8 | 待实测 | 采集用途；`phpquery-single` 在 PHP 8 有兼容报告，需跑一遍采集任务 |
| `phpoffice/phpspreadsheet` | 1.19.0 | UPGRADE | 升 2.x；注意 1.x→2.x 有 API 变更（`getCalculatedValue` 等） |
| `guzzlehttp/guzzle` | 7.4.1 | UPGRADE | 升 7.9.x，8.4 下更稳 |
| `swiftmailer/swiftmailer` | 6.3.0 | **REPLACE** | 见上 |
| `symfony/console` 等 | 5.4.3 | UPGRADE | 随 Yii 升到 6.4 LTS；5.4 已于 2025-11 EOL |
| `monolog/monolog` | 2.9.3 | OK | 2.x 支持 8.x |
| `phpmailer` | 未使用 | — | 若替换邮件层，可作为备选 |
| `ezyang/htmlpurifier` | 4.14.0 | OK | 升 4.17 更稳 |
| `cebe/markdown` | 1.2.1 | OK | — |

---

## 4. 测试与开发工具链

| 包 | 锁定版本 | 判定 | 说明 |
|---|---|---|---|
| `phpunit/phpunit` | 8.5.23 | **UPGRADE** | PHPUnit 8 不支持 8.4；升 10/11（需 PHP 8.1+，与目标一致） |
| `codeception/codeception` | 4.1.29 | **UPGRADE** | 升 5.x |
| `codeception/module-yii2` | 1.1.5 | **BLOCK** | 上限 8.1，必须升 1.3 |
| `phpspec/prophecy` | 1.15.0 | **BLOCK / DROP** | 上限 <8.2；PHPUnit 10+ 不再依赖 |
| `symfony/browser-kit` | 4.2.4 | **BLOCK** | 约束仅 PHP 7.1.x；升 6.4 或移除 |
| `fakerphp/faker` | 1.19.0 | OK | — |

---

## 5. 汇总

| 动作 | 数量 | 包 |
|---|---:|---|
| BLOCK（8.4 装不上） | 3 | browser-kit、prophecy、codeception-module-yii2 |
| REPLACE（停维护） | 4 | swiftmailer、yii2-swiftmailer、yii2-phpexcel、yii2-ckeditor |
| UPGRADE（需升版本） | 9 | yii2、yii2-debug、yii2-gii、kartik-grid、kartik-editable、phpspreadsheet、guzzle、symfony/*、phpunit、codeception |
| 锁版本（dev-master） | 2 | kartik-grid、kartik-bootstrap4-dropdown |
| 评估移除 | 1 | yii2-elasticsearch |
| 待实测 | 2 | querylist、yii2-redis（依赖扩展） |

---

## 6. 审计边界

- 本审计**只依据** `composer.json` / `composer.lock` 与包的上游维护状态，**未运行任何包**。
- "OK" 仅表示"版本约束允许且上游仍在维护"，不等于"在 8.4 上零告警"。真正的结论必须来自 staging 运行。
- 未审计业务代码中对扩展的调用方式（如 `yii2-grid` 的列渲染、`phpexcel` 的导出逻辑），这部分在阶段 B 随代码扫描一起做。
