# Round 38 — PHP 8.5.13 / MySQL 8.4.13 兼容性与回归

本包在隔离环境验证 Morrishk 现有应用在 **PHP 8.5.13 NTS + MySQL 8.4.13** 下的可运行性与主要缺陷，不涉及生产部署。

## 结论摘要

| 维度 | 结论 | 说明 |
|---|---|---|
| 生产依赖安装（PHP 8.5.13） | **PASS（仅 --no-dev）** | `composer install` 因 dev 依赖平台约束失败；生产依赖安装成功，`check-platform-reqs` 全部 success |
| dev 依赖（Codeception/Prophecy 等） | **FAIL** | 锁定版本要求 PHP ≤8.1，未升级、未绕过平台检查 |
| Yii2 启动与路由 | **PASS（带测试引导）** | 首页/列表/分类/PDP/sitemap/robots/404 正常；错误页在缺省上下文下会 500 |
| PHP 8.5 弃用/告警 | **WARN** | 2023 条运行期记录：`utf8_encode()`、null 传参、ArrayAccess 返回类型等 |
| MySQL 8.4 结构导入 | **PASS（有警告）** | 31 表；`utf8`→`utf8mb3` 与整型显示宽度弃用警告 |
| MySQL 8.4 CRUD/约束/隔离级别 | **PASS** | CRUD、唯一约束、保留字列、三档隔离级别均正常 |
| 事务回滚 | **FAIL（MyISAM）** | 30/31 表为 MyISAM，`rollBack()` 无效 |
| utf8mb3 存 4 字节字符 | **FAIL** | Emoji 插入报 1366 |
| 询价（PDP / 购物车 + 附件） | **PASS** | 写入 DB、Mock 发送（SMTP 指向本机不可用端口） |
| 下载授权（未登录/缺失/穿越） | **PASS** | 403 / 404 / 404 |
| 下载授权（上传者/其他用户/管理员） | **NOT_EXECUTED** | 沿用 Round 37 证据，本轮未重跑后台登录链路 |
| Nginx 路径访问控制 | **NOT_EXECUTED** | 本轮为 PHP 内置服务器；沿用 Round 37 证据 |

本包不标记 `DEMO_READY`、`FUNCTION_ACCEPTED`、`PRODUCTION_READY`、`RELEASE_APPROVED`。

## 目录

- `01_ENVIRONMENT_BASELINE.md`：基线提交、环境、隔离方式、账号与测试库
- `02_COMPOSER_PHP85_COMPATIBILITY.md`：依赖安装与 PHP 8.5 兼容性
- `03_MYSQL84_COMPATIBILITY.md`：结构导入、CRUD、事务、字符集、严格模式
- `04_BUSINESS_REGRESSION.md`：业务回归矩阵与证据
- `05_PRODUCTION_UPGRADE_RISKS.md`：PHP 7.4→8.5、MySQL 5.6→8.4 风险与回滚
- `06_FAILURES_AND_REMEDIATION.md`：失败项、位置、影响与最小修复建议
- `evidence/`：原始命令输出（Composer、平台检查、结构导入、MySQL 测试、路由矩阵、弃用清单）
- `SHA256SUMS`：本目录文件校验（不含自身）

## 复跑要点

1. PHP：`D:\dev\php\php-8.5.13\php.exe`（绝对路径），Composer：`D:\dev\tools\composer.phar` 2.11.2。
2. MySQL：`127.0.0.1:3307`，测试库 `morrishk_r38_php85`，应用账号仅 DML。
3. 应用 worktree：`E:\workspace\独立站\morrishk-site-r38-wt`（分支 `test/morrishk-r38-php85-mysql84`，基线 `23f9986`）。
4. 测试入口与凭据读取脚本位于 worktree 之外，不进入仓库，不含明文口令。
5. 测试引导仅在入口层做三项调整（`Mid=0`、错误处理只记录不中断、关闭站内错误页 Action），未修改应用代码。

## 状态声明

本轮为**本地兼容性验证**，不构成生产升级完成，也不改变 Round 37 的 P0-2 `BLOCKED` 状态。
