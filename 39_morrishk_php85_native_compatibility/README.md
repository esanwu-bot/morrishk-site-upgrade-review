# Round 39 — PHP 8.5 原生兼容修复与业务缺陷收敛

本轮在 **PHP 8.5.13 + MySQL 8.4.13** 下修复 Round 38 的阻断项，验证应用可原生运行（不覆盖错误处理器、不关闭弃用、不注入业务参数）。

## 结论摘要

| 维度 | 结论 | 说明 |
|---|---|---|
| 依赖升级 | **PASS** | Yii 2.0.44→2.0.53，email-validator 3.1.2→3.2.6，Codeception 4→5；完整 install（含 dev）成功 |
| PHP 8.5 原生运行 | **PASS（已测路径）** | 入口不再做任何错误/业务注入；首页、列表、大类、PDP、购物车、sitemap、robots 均 200 |
| 错误处理（F-03） | **PASS** | 404/403/500 返回真实状态码；错误页不依赖 DB/导航/商家；无堆栈与凭据泄露 |
| 业务缺陷（F-04/05/06/10/11） | **PASS** | Mid 上下文、商家缺失 404、迁移诊断、Mock 发送、会话回显均已修复并验证 |
| MySQL 8.4 结构评估 | **完成（只读）** | 31 表清单、引擎/字符集/索引/NOT NULL/GROUP BY/日期字段；未执行任何生产 DDL |
| 单元测试 | **PASS** | Codeception：2 tests / 6 assertions（Mock 发送器不触达 mailer） |
| 生产升级 | **NOT APPROVED** | 仅本地兼容性验证；MySQL 5.6→8.4 迁移仍无生产数据演练 |

## 目录

- `01_DEPENDENCY_UPGRADE.md`：升级清单、约束评估、安装与平台检查
- `02_PHP85_NATIVE_RUNTIME.md`：原生启动、代码修复、弃用处理
- `03_ERROR_HANDLING.md`：404/403/500 设计与实测
- `04_BUSINESS_FIXES.md`：F-04/05/06/10/11 及本轮额外修复
- `05_MYSQL84_SCHEMA_ASSESSMENT.md`：表结构/索引/迁移评估（只读）
- `06_FULL_REGRESSION.md`：无绕过回归矩阵
- `07_REMAINING_RISKS.md`：残余风险与未覆盖项
- `08_COMPOSER_SECURITY_AUDIT.md`：70 条安全通告（runtime 9 包/61 条，dev 5 包/9 条）及升级建议
- `09_ERROR_REPORTING_AUDIT.md`：22527 位掩码、运行器/Web 进程配置、弃用统计
- `10_MIGRATION_SCRIPT_VALIDATION.md`：迁移脚本幂等/部分迁移/权限拒绝验证
- `11_SECURITY_REGRESSION.md`：登录、上传下载授权、路径穿越、Nginx（NOT_TESTED）
- `evidence/`：Composer、平台检查、测试、路由矩阵、Schema 评估、依赖差异、审计与安全矩阵
- `SHA256SUMS`

## 代码与提交

| 项 | 值 |
|---|---|
| 应用分支 | `fix/morrishk-r39-php85-native`（基于 `23f9986`） |
| 修复提交 | `71856f2` |
| 测试产物清理 | `4e99cf5` |
| 远端 | `origin/fix/morrishk-r39-php85-native` = `4e99cf5` |
| 隔离 worktree | `E:\workspace\独立站\morrishk-site-r39-wt` |
| 测试库 | `morrishk_r39`（utf8mb4_0900_ai_ci，31 表 + 迁移） |

## 测试入口差异（仅环境层）

入口 `D:\dev\tmp\router_r39.php` 只做两件事：静态文件透传、注入数据库/站点环境变量后 `require web/index.php`。**未**覆盖错误处理器、**未**屏蔽 `E_DEPRECATED/E_WARNING/E_NOTICE`、**未**关闭 `errorAction`、**未**注入 `Mid`/`MRow`。

## 状态声明

不标记 `DEMO_READY`、`FUNCTION_ACCEPTED`、`PRODUCTION_READY`、`RELEASE_APPROVED`；不宣称 PHP 8.5 + MySQL 8.4 已生产就绪。
