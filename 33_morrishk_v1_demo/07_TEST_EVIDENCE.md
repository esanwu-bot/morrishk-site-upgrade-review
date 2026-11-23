# 测试证据（实际执行）

| 项目 | 内容 |
|---|---|
| 文档编号 | 33-07 |
| 执行时间 | 2026-11-23（Asia/Shanghai） |
| 环境 | Windows；PHP 8.0.2 CLI；Composer 2.5.8；无 vendor；MySQL 5.7.26 客户端存在但服务未启动 |
| 代码分支 | `feat/morrishk-website-implementation` |

## 1. 代码提交

| 提交 | 说明 |
|---|---|
| `25afffb` | robots meta、搜索/询价 noindex、robots.txt 格式 |
| `0891ce6` | 询盘成功路由、首页 H1 唯一化 |
| `d80491b` | canonical、Open Graph、Product JSON-LD |

## 2. 实际执行的检查

| 检查 | 命令 | 结果 | 退出码 |
|---|---|---|---|
| 语法 | `php -l commands/SnSiiController.php` | No syntax errors | 0 |
| 语法 | `php -l controllers/SearchController.php` | No syntax errors | 0 |
| 语法 | `php -l controllers/CartController.php` | No syntax errors | 0 |
| 语法 | `php -l controllers/SiteController.php` | No syntax errors | 0 |
| 语法 | `php -l controllers/ProController.php` | No syntax errors | 0 |
| 语法 | `php -l views/layouts/main.php` | No syntax errors | 0 |
| 补丁格式 | `git diff --check cdb9c04..d80491b` | 无输出（PASS） | 0 |
| 分支同步 | `git status --short --branch` | 干净，与 origin 同步 | 0 |
| 远端 | `git ls-remote origin feat/morrishk-website-implementation` | `d80491b` | 0 |

## 3. 环境探测

| 命令 | 结果 | 结论 |
|---|---|---|
| `php -v` | PHP 8.0.2 | 可用于语法检查 |
| `composer --version` | 2.5.8 | 可用 |
| `mysql -uroot -e "SELECT VERSION();"` | ERROR 2003（10061） | 本机 MySQL 服务未启动 |
| `Test-Path vendor` | False | 依赖未安装，应用不可启动 |

## 4. 未执行（BLOCKED）

| 项 | 原因 |
|---|---|
| 应用启动/HTTP 200 | 无 vendor、无数据库 |
| 首页/分类/PDP 截图 | 同上 |
| 询盘提交/Mock | 第三方未授权、无运行环境 |
| CSRF/校验实测 | 无运行环境 |
| sitemap 生成 | 需数据库/发布流程 |
| Lighthouse/移动端 | 无运行页面 |

## 5. 生产只读审计（非本轮测试）

| 项 | 结果 |
|---|---|
| 首页/产品/搜索/询价 | 200 |
| `/sitemap.xml` | 404 |
| 首页 canonical/JSON-LD/OG | 0 |
| 首页 H1 | 3（生产尚未应用本轮修复） |

> 生产审计不代表本分支已部署；本轮未部署。

## 6. 结论

- 代码级静态检查：**PASS（仅语法/补丁）**。
- 功能/页面/SEO 运行时验证：**BLOCKED**。
- 不得将本文件表述为功能验收通过。
