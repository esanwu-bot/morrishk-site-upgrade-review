# 00 Round 43 基线

## 1. 仓库与分支

| 项 | 应用仓库 | Review 仓库 |
|---|---|---|
| 路径 | `E:\workspace\独立站\morrishk-site-r43-wt` | `E:\workspace\独立站\morrishk-site-upgrade-review-wt-r43` |
| 本轮分支 | `fix/morrishk-r43-prod-security` | `docs/morrishk-round43` |
| 起点 HEAD | `fa35a95` | `e3a72d6` |
| 起点 parent | `b7e8933` | `4fcf385` |
| 远端 | `codeup.aliyun.com/.../morrishk-site.git` | `github.com/esanwu-bot/morrishk-site-upgrade-review.git` |
| 远端核对 | `fa35a95`（一致） | 本轮开始时 GitHub 443 连接失败；提交时复核 |

- 应用与 Review 均使用**独立 worktree + 独立分支**，未在原 worktree 上操作。
- 未使用 `git reset --hard`、`git clean -fd`、force push、amend、rebase。
- Round 37 既有未提交文件
  `37_morrishk_v1_final_acceptance/scripts/run_download_auth_matrix.ps1`
  保持原样，未被覆盖、清理或提交。

## 2. 起点代码状态

- 应用 `fa35a95`：`yii2 2.0.55`、`yii2-redis 2.0.20`（Round 42 升级）。
- 本轮应用改动仅 3 个文件（见 08 与 `evidence/app_round43.diff`）：
  - `config/web.php`
  - `modules/ejadmin/models/SnSiiManage.php`
  - `commands/AuthKeyController.php`（新增）

## 3. Staging 环境

| 项 | 值 |
|---|---|
| Web | Nginx 1.15.11（Windows） |
| FastCGI | PHP 8.5.13 NTS `php-cgi.exe`（9100/9101/9102） |
| TLS | 自签名证书，`https://127.0.0.1:8443`（仅本地测试，不被信任） |
| HTTP 对照 | `http://127.0.0.1:8080`（直连）、`:8081`（可信代理）、`:8082`（Secret-B） |
| 应用副本 | `D:\dev\tmp\r43src`（源码副本 + vendor 副本；仅 staging） |
| `.user.ini` | 生产文件含 `open_basedir=/www/wwwroot/morrishk.net/:/tmp/`；staging 副本中移除，仓库文件未改 |
| DB | MySQL 8.4.13 `morrishk_r39`（应用回归）；MySQL 5.7.26 `morris_r43`（历史兼容） |
| 历史 MySQL | 5.6.50（生产目标）本机不可用 → 精确版本标记 BLOCKED |

- 未连接生产数据库、未部署生产、未修改生产配置。
- 未使用 PHP 内置 HTTP 服务冒充 F-20 的 HTTPS 验证；F-20 使用 Nginx + php-cgi + TLS。

## 4. 测试账号

- `qa_r39_a`（id 195）、`qa_r39_admin`（id 197），来自本地测试库。
- 口令只在本地凭据文件与测试进程中读取，未写入本包、未写入命令输出。
