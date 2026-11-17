# Morrishk P0-01 应用仓库与部署基线交付说明

- 任务：**P0-01：Morrishk Application Repository Bootstrap & Baseline**
- 交付日期：2026-11-17
- 状态：执行完成，待 Reviewer 独立审核（未进入 P0-02）
- 应用仓库：`https://codeup.aliyun.com/5f0af04d5fd102f22f6b747c/morrishk-site.git`
- 应用基线提交：`1d66acb3a5c9d004939c60f15aa2d4d392513575`
- 文档提交：`cdb9c044dd2f2fc86967dc6738341b11bbeba7f5`（`docs: add P0-01 baseline report`）
- 基线报告文件：`docs/baseline/P0_01_BASELINE_REPORT.md`
- 基线报告 SHA-256：`73439be0bfa53aaf3f5a9866b32d869ce1dba261aec433503d628597cdc07c6d`

---

## 1. 仓库来源

| 项目 | 结论 |
|---|---|
| 真实应用代码路径 | `E:\workspace\独立站\morries\newPlan\morrishk.net` |
| 来源是否受版本控制 | 否，目录内无 `.git` |
| 来源基线 SHA | 无（N/A） |
| 目标仓库推送前状态 | 空仓库，无任何 ref |
| 远端是否曾被强制覆盖 | 否，首次推送为新建分支 |
| 推送后远端状态 | `refs/heads/main = 1d66acb3a5c9d004939c60f15aa2d4d392513575`，随后快进到 `cdb9c044dd2f2fc86967dc6738341b11bbeba7f5` |

未从设计仓库复制或拼凑任何应用代码；设计仓库中的 Discovery、Session A、Session B 材料未被用作代码来源。

---

## 2. 归集范围

基线提交共 **620 个文件**，**21,352,168 字节**（约 20.4 MiB），Git 打包体积 5.24 MiB。

| 目录 | 文件数 |
|---|---:|
| `messages/` | 400（80 个语种目录） |
| `modules/` | 74 |
| `web/` | 40 |
| `views/` | 22 |
| `models/` | 18 |
| `snsii/` | 14 |
| `commands/` | 11 |
| `controllers/` | 10 |
| `config/` | 5 |
| `mail/` | 3 |
| `docs/` | 3（架构、部署、数据库说明） |
| 根目录工程文件 | 20 |
| **合计** | **620** |

最大文件为 `web/css/style.min.css`（330,339 字节），无单文件达到或超过 1 MiB。

### 2.1 工程文件（新增 10 个，重写 2 个）

新增：`.env.example`、`.editorconfig`、`docs/architecture/README.md`、`docs/deployment/README.md`、`docs/database/README.md`、`runtime/.gitkeep`、`web/assets/.gitkeep`、`web/upload/files/.gitkeep`、`web/upload/images/.gitkeep`、`web/uploads/.gitkeep`。

重写：`.gitignore`、`README.md`（来源存在旧版本，内容按本仓库实际结构替换）。

### 2.2 内容变更文件（7 个）

| 文件 | 变更性质 |
|---|---|
| `config/db.php` | 数据库连接参数改为环境变量注入 |
| `config/web.php` | 会话校验密钥与 SMTP 凭据改为环境变量注入 |
| `config/console.php` | SMTP 凭据改为环境变量注入 |
| `models/User.php` | 静态账号凭据改为占位符 |
| `snsii/Cf.php` | Cloudflare 凭据改为环境变量注入 |
| `.gitignore` | 按仓库结构重写 |
| `README.md` | 按实际状态重写 |

其余 603 个文件与来源逐字节一致。`composer.json`、`composer.lock`、`web/index.php`、`config/params.php` 的 SHA-256 与来源一致，依赖版本与路由配置未改动。

---

## 3. 排除清单（92 个文件）

| 类别 | 数量 | 理由 |
|---|---:|---|
| `web/txt/**/robots.txt` | 80 | 生成型 SEO 文件，可重新生成 |
| 翻译备份压缩包（`messages/*.zip`） | 2 | 与 `messages/` 内容重复的备份 |
| `web/data/missing.txt`、`output.txt`、`url.txt` | 3 | 抓取产物（MPN/URL 列表），非代码，含业务数据性质内容 |
| `web/uploads/` 下规格书 PDF、报价表 xlsx | 2 | 真实业务上传文件，不纳入代码基线 |
| `web/fonts/.DS_Store` | 1 | 操作系统元数据 |
| `.domain.txt.swp` | 1 | 编辑器临时文件 |
| `cf.txt` | 1 | 空文件 |
| `index.html` | 1 | 主机商默认首页，非应用入口 |
| `xxx.html` | 1 | 未被路由引用的游离页面片段 |

上传与运行时目录保留 `.gitkeep` / `.htaccess` 占位，无实际文件内容进入仓库。

---

## 4. 安全检查

| 检查项 | 结果 |
|---|---|
| 明文凭据 | 发现 5 个文件存在硬编码凭据，已全部外置为环境变量或占位符（本报告不复述凭据值） |
| 定点扫描（7 个已知字面值） | 0 命中 |
| 通用模式扫描（`AIza…`、`AKIA…`、`ghp_…`、`sk-…`、私钥头） | 0 命中 |
| 上传/抓取/数据目录 | 仅 `.gitkeep` / `.htaccess` 被跟踪 |
| 私钥与服务账号 JSON | 仓库内不存在 |
| 数据库 dump/备份 | 未复制、未提交 |
| 生产用户数据/询价记录 | 未读取、未提交 |
| Codeup 历史暴露 | 仓库为全新初始化，历史中不存在凭据；无需清理历史 |
| 远端 URL 凭据 | 远端地址不含账号或令牌 |
| 强推/改写历史 | 未发生 |

残留风险：来源目录 `E:\workspace\独立站\morries\newPlan\morrishk.net` 仍以明文保存原有凭据，且从未纳入版本控制；本轮未轮换凭据（未授权）。是否轮换由项目负责人决定，建议纳入 P0-03。

`commands/CController.php:119` 保留了一处生产服务账号 JSON 的**路径引用**作为部署线索，密钥文件本身不在仓库中。

---

## 5. 验证结果

| 检查项 | 结果 |
|---|---|
| PHP 语法检查（561 个 PHP 文件，PHP 8.0.2 CLI） | PASS，0 错误 |
| `composer validate --no-check-publish` | 有效，含 5 条 unbound version 警告 |
| 依赖安装 / 升级 | NOT RUN |
| Codeception 测试 | NOT RUN（来源缺少 `tests/` 目录，无可执行用例） |
| 应用启动冒烟 | NOT RUN（无 `vendor/`、无运行时环境变量） |
| 生产 PHP 7.4 兼容性 | NOT RUN（本机为 PHP 8.0.2） |
| 远端内容一致性 | PASS：`HEAD`、tree 哈希 `f3acd46f2ba057c9f6f25aa0e59b9fdeb3ed9119`、620 个文件双端一致 |
| 工作区状态 | 干净，`main` 与远端同步 |

大文件、敏感文件与暂存区检查均在提交前完成；提交后工作区无未跟踪变更。

---

## 6. 部署基线核查（只读）

| 项目 | 结论 |
|---|---|
| 生产站点可达 | 是，2026-11-17 22:12（+0800）`https://www.morrishk.net/` 返回 `HTTP/1.1 200 OK` |
| Web 服务器 | nginx（响应头） |
| HTTPS/HSTS | 启用（`Strict-Transport-Security: max-age=31536000`） |
| 部署形态 | 宝塔 + nginx + PHP-FPM（Discovery 文档口径） |
| 生产代码目录 | **UNVERIFIED**（代码中仅有 `/mnt/wwwroot/morris` 路径线索） |
| 生产 PHP/MySQL 运行时 | **UNVERIFIED** |
| 环境变量注入方式 | **UNVERIFIED**（项目无 dotenv 加载器） |
| vhost / 伪静态 / 计划任务 / 日志备份 | **UNVERIFIED** |
| 生产代码与基线提交的对应关系 | **UNVERIFIED**（来源无 Git 历史） |
| 部署与回滚脚本 | 仓库中不存在 |

本轮未登录生产服务器，未修改代码、配置或数据库，未执行部署、迁移或备份。

---

## 7. 边界声明

1. 两个仓库分别提交，历史互不混合。
2. 本文件只记录 P0-01 交付事实，不包含密码、令牌、私钥、生产数据或数据库备份。
3. Discovery v1.0.1、Session A v1.16.1、Session B `090cae9` 材料均未修改。
4. 未开始 P0-02（生产数据库与文件备份）、P0-03（安全配置修改）、P0-04（旧站风险修复）、P1、P2 或生产部署。
5. 本报告为提交事实记录，不代表 Reviewer 验收结论。

---

## 8. 自评结论

**`PASS_WITH_BLOCKERS`**

- 代码已安全归集、提交并推送，远端内容经独立拉取比对一致。
- 阻塞项：生产部署目录与运行时未验证；生产代码与基线提交的版本对应关系无法证明；项目缺少可执行测试，仅完成语法与配置校验；来源目录明文凭据待决定是否轮换。

等待 Reviewer 独立审核，不自动进入 P0-02。