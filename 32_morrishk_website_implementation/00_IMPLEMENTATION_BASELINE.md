# Morrishk 网站改造实施基线

| 项目 | 内容 |
|---|---|
| 文档编号 | 32-00 |
| 版本 | V1.0（实施基线，送 Reviewer 复核） |
| 编制日期 | 2026-11-23 |
| 性质 | 实施基线记录；不构成生产验收、上线授权或客户签署 |
| 实施分支（应用仓库） | `feat/morrishk-website-implementation` |
| 实施分支（评审仓库） | `feat/morrishk-website-implementation`（worktree） |

---

## 1. 两个仓库的边界

| 仓库 | 用途 | 地址 | 本轮角色 |
|---|---|---|---|
| 应用代码仓库 | Morrishk 真实网站代码 | `https://codeup.aliyun.com/5f0af04d5fd102f22f6b747c/morrishk-site.git` | 实施对象；已创建独立分支并推送 |
| 评审/文档仓库 | 商务包、设计、评审记录 | `https://github.com/esanwu-bot/morrishk-site-upgrade-review.git` | 交付物归档；新增 `32_` 目录 |

> 商务审核仓库不是网站源代码仓库；本轮未把设计文档混入应用代码，也未把应用代码推送到评审仓库。

---

## 2. 应用仓库基线

| 项目 | 值 | 证据 |
|---|---|---|
| 仓库 | `morrishk-site` | `git remote -v` |
| 远端 | Codeup（阿里云） | `origin` |
| 默认分支 | `main` | `git branch -a` |
| `main` HEAD | `cdb9c044dd2f2fc86967dc6738341b11bbeba7f5` | `git rev-parse HEAD` |
| 应用基线提交 | `1d66acb3a5c9d004939c60f15aa2d4d392513575` | P0-01 报告与 Git 历史 |
| 基线报告提交 | `cdb9c04`（`docs: add P0-01 baseline report`） | `git log` |
| 工作区（切换前） | 干净，`main` 与 `origin/main` 一致 | `git status` |
| 实施分支 | `feat/morrishk-website-implementation` | 从 `cdb9c04` 创建 |
| 实施提交（本轮） | `25afffbeba37a31e4f13932e5daf9434bdc6fcfd` | `git show --stat` |
| 实施分支远端 | 已推送 `origin/feat/morrishk-website-implementation` | `git ls-remote` |

### 2.1 本轮代码变更范围

`25afffb` 仅修改 4 个文件：

| 文件 | 变更 |
|---|---|
| `commands/SnSiiController.php` | `seo()` 增加可选 `robots` 参数，注册 `meta-robots` |
| `controllers/SearchController.php` | 搜索结果页输出 `noindex,follow` |
| `controllers/CartController.php` | 询价页/无结果页输出 `noindex,follow`，成功页输出 `noindex,nofollow` |
| `web/robots.txt` | 修正 `Allow:/` 为合法 `Allow: /` |

未改动数据库、路由、模型、视图结构、依赖版本或生产配置。

### 2.2 回滚方案

| 层级 | 方式 |
|---|---|
| 代码回滚 | `git revert 25afffb`，或从 `cdb9c04` 重新切分支 |
| 生产回滚 | 本轮未部署；若未来部署，按“上一版本代码目录 + 配置快照”回切（待 P0-02 建立） |
| 数据回滚 | 本轮无数据库写入，无数据回滚需求 |

---

## 3. 技术栈与部署基线

| 项目 | 现状 | 证据/说明 |
|---|---|---|
| 框架 | Yii2 Basic 单应用 | `composer.json` |
| PHP 声明约束 | `>=5.6.0` | `composer.json` |
| 本机校验 PHP | 8.0.2 CLI | `php -v` |
| 生产 PHP（文档口径） | 7.4.33，已停止安全支持 | `docs/deployment/README.md` |
| 数据库 | MySQL 5.6.50，库 `morris`，前缀 `snsii_`，31 表（30 MyISAM / 1 InnoDB） | 离线审计；本轮未连库 |
| 缓存 | `yii\caching\FileCache` | `config/web.php` |
| 邮件 | `yii\swiftmailer` + SMTP | `config/web.php` |
| Web 服务器 | nginx + PHP-FPM（宝塔，文档口径） | `docs/deployment/README.md` |
| 生产可达 | `https://www.morrishk.net/` 返回 200 | 本轮 `curl.exe -I` |
| `vendor/` | 未入库，部署时安装 | `.gitignore` |
| 测试 | `tests/` 不存在，Codeception 无可用用例 | P0-01 报告 |

### 3.1 页面与代码规模（静态统计）

| 项 | 数量 |
|---|---:|
| 前台控制器 | 8（不含 `_bak`） |
| 前台 action | 32 |
| 后台控制器（`modules/ejadmin`） | 10 |
| 前台视图文件 | 22 |
| 模型 | 18 |
| 语言目录 | 80 |
| 路由规则 | 15 条（含单段兜底 `/<Links>.html`） |

---

## 4. 客户商务包基线

| 项目 | 值 |
|---|---|
| 仓库 | `esanwu-bot/morrishk-site-upgrade-review` |
| R1 客户商务包基线 | `56223e7` |
| 中文文件名整理分支 | `docs/morrishk-customer-pack-chinese-filenames` |
| 分支 HEAD | `cf2210e15ba8085b118cdb3a6e2730e03e51354a` |
| 包版本 | V1.0（客户送审稿） |
| 包状态 | **未签署**；文件自述“不构成合同、报价承诺或开发授权” |

包内文件：00 索引、01 总规划、02 功能范围（227 项）、03 SEO 与月度运营、04 商务报价（金额空白）、05 启动及验收计划（`NOT_STARTED`）。

---

## 5. 启动、合同与生产授权（分层口径）

### 5.1 客户正式启动

| 事项 | 状态 | 依据 |
|---|---|---|
| 客户正式启动 | **已确认** | 项目负责人明确确认客户已正式启动 Morris 网站改造项目 |
| 启动确认原始文件归档 | **待补充** | 商务包内尚未归档对应签署/确认原件 |
| 商务合同、报价及签署 | **待核验** | 04 报价金额空白；合同状态未在仓库内体现 |
| 具体功能范围 | 按已确认授权范围执行 | 本轮不把启动自动解释为 119 项全部签约 |
| 生产部署授权 | **未取得** | 未书面授权上线 |

### 5.2 范围与费用口径

| 来源 | 状态 | 说明 |
|---|---|---|
| 商务包 00/01/02/03/05 | 客户送审稿 | 文本仍标注送审稿；不因此否定已确认的项目启动事实 |
| 119 项 | **当前规划建议纳入范围** | 除非有独立客户范围确认文件，否则不表述为“已签约范围” |
| 104 项 | 待确认 | 不默认纳入 |
| 15 项新增交付 | 待确认 | 不默认纳入；SD-02 单独报价 |
| 04 报价 | 金额全部空白 | 不形成费用承诺 |

### 5.3 门禁拆分（P0-05）

| 门禁 | 内容 | 状态 | 是否阻塞非生产开发 |
|---|---|---|---|
| **P0-05A** | 项目启动事实确认 | **DONE**（项目负责人确认） | 否 |
| **P0-05B** | 商务合同、报价及详细范围冻结 | BLOCKED（待核验/待确认） | 不阻塞已授权的非生产开发 |
| **P0-05C** | 生产环境与上线授权 | BLOCKED（未授权） | 只阻塞部署与上线 |

### 5.4 处理原则

1. 客户正式启动已确认，不再表述为“等待客户确认启动”。
2. 启动确认原件归档、合同/报价核验、范围冻结分别跟踪，不混为一件事。
3. 在不依赖合同与生产授权的前提下，继续基线、审计、计划与非生产代码开发。
4. 任何涉及 104 项待确认 FR、15 项新增交付、报价或工期的内容，一律标注“待确认/待估”，不写成承诺。
5. 生产部署、DNS/CDN/服务器变更、数据库迁移仍需 P0-05C 书面授权。

---

## 6. 本轮实施边界

| 类别 | 内容 |
|---|---|
| 已获执行方授权 | 核对基线、静态审计、建立计划、独立分支、非生产代码修改与本地语法检查 |
| 已具备技术条件 | Yii2 代码可直接修改；Git 分支可用；PHP CLI 可做语法检查 |
| 需客户资料/账号 | 服务器、数据库、GSC/GA4/GTM、询盘系统、旧 URL、产品资料（见 32-06） |
| 需额外报价/变更确认 | 104 项待确认 FR、15 项新增交付、SD-02、FR-3-040 费用归属 |
| 需 Reviewer 复核 | 本目录全部交付物、代码提交、测试与验收计划 |
| 明确不做 | 生产部署、DNS/域名变更、数据库迁移、旧页面删除、付费操作、Session B API 合并 |

---

## 7. 基线证据清单

| 证据 | 位置/命令 |
|---|---|
| 应用仓库状态 | `git -C morrishk-site status --short --branch` |
| 应用提交 | `git -C morrishk-site show --stat 25afffb` |
| 分支远端 | `git -C morrishk-site ls-remote origin feat/morrishk-website-implementation` |
| PHP 语法 | `php -l` 三个修改文件（结果见 32-07） |
| 生产状态码 | `curl.exe -sS -o NUL -w "%{http_code}"` |
| 首页/PDP 头部 | 抓取 HTML 后静态检查（见 32-01） |
| 商务包 | `git show docs/morrishk-customer-pack-chinese-filenames:31_customer_commercial_pack/...` |

---

## 8. 未验证事项（不得当成已通过）

- 生产代码与本仓库 `main`/`cdb9c04` 的字节一致性未证明。
- 生产 PHP/MySQL/FPM/OPcache 配置未核验。
- 应用未启动，无端到端、功能、兼容性、性能测试结果。
- 生产 HTML 与本地分支代码不同：本轮修改尚未部署。
- 客户签署、报价、范围确认、资料与账号均未取得。
