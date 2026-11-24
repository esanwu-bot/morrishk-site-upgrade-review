# 提交与交付检查

## 1. 应用代码提交

| 项 | 值 |
|---|---|
| 仓库 | `morrishk-site` |
| 分支 | `fix/morrishk-v1-runtime-defects` |
| 本轮提交 | `23f9986902edfe971fcf963137162466c775cdf5` |
| 父提交 | `af4765f81509ef1d1e58b0104f59ba9963e2c37b` |
| 远端 | `origin/fix/morrishk-v1-runtime-defects` = `23f9986`（已推送） |

提交文件白名单（6 个，全部为源码/配置/SQL）：

```
config/web.php
controllers/CartController.php
controllers/DownloadController.php
controllers/ProController.php
db/2026-11-24_cart_owner.sql
deploy/nginx/morrishk.conf
```

未提交：测试脚本、运行日志、临时 `php.ini`、`router.php`、上传文件、审计日志、凭据文件。

## 2. 检查结果

| 检查 | 命令 | 结果 |
|---|---|---|
| 语法 | `php -l` × 5 个改动 PHP 文件 | 全部 `No syntax errors detected` |
| 空白/冲突标记 | `git diff --check` | exit=0 |
| 工作区 | `git status --short` | 提交后干净 |
| 远端同步 | `git rev-parse HEAD` vs `origin/...` | 一致 |
| 父提交关系 | `git log --oneline -2` | `23f9986` ← `af4765f` ← `d740112` |

## 3. Review 材料

- 目录：`37_morrishk_v1_final_acceptance/`
- 基线：`b94f76d4f3e0daff949b6d48ad8d8c9e92590971`（36_ 证据包）
- 分支：`feat/morrishk-website-implementation`
- 本轮内容：
  - `README.md` 与 6 份说明文档；
  - `evidence/` 10 个文件（平台探测、Composer 两项、DB 校验、下载矩阵、Nginx 矩阵、CKEditor、口令轮换、两份配置副本）；
  - `scripts/` 3 个脚本（下载授权矩阵、Nginx 矩阵、提交对象哈希校验）；
  - `SHA256SUMS`；
  - `36_.../02_TEST_ENVIRONMENT.md` 明文口令移除（修改）。

## 4. SHA256SUMS

SHA256SUMS 覆盖本目录全部文件（不含 `SHA256SUMS` 自身），按相对路径排序。

由于仓库 `core.autocrlf=true`，直接对检出后的工作区文件取哈希会受 CRLF 影响，因此提供按**提交对象**校验的脚本：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\verify_sha256.ps1
# 输出: checked=N mismatches=0 / SHA256SUMS OK
```

等价的 Linux 校验方式（在 LF 检出下）：

```
sha256sum -c SHA256SUMS
```

## 5. 复跑方式

```powershell
# 需要有：运行中的应用实例（Nginx 8096 或 PHP 内置服务器）、测试库、临时凭据文件
powershell -ExecutionPolicy Bypass -File scripts\run_download_auth_matrix.ps1 -BaseUrl http://127.0.0.1:8096
powershell -ExecutionPolicy Bypass -File scripts\run_nginx_matrix.ps1      -BaseUrl http://127.0.0.1:8096
```

脚本会在临时库中创建/删除合成询价记录，并在结束后清理文件与 Cookie。

## 6. 状态声明

未标记且不得据此推断：`DEMO_READY`、`FUNCTION_ACCEPTED`、`PRODUCTION_READY`、`RELEASE_APPROVED`。

P0-2 目标环境保持 **BLOCKED**；其余本轮事项为 PASS，等待 Reviewer 复核。
