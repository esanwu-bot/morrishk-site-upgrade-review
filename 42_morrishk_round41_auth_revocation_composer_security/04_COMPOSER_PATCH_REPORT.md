# 04 Composer 补丁报告

## 1. 目标与结果

| 包 | 目标 | 结果 |
|---|---|---|
| `yiisoft/yii2` | 2.0.53 → 2.0.55（CVE-2026-39850） | **BLOCKED**：当前 Composer 源（阿里云镜像）最高仅 2.0.53 |
| `yiisoft/yii2-redis` | 2.0.17 → 2.0.20（CVE-2025-48493） | **BLOCKED**：镜像最高仅 2.0.19 |

未使用 `--ignore-platform-reqs`，未手工覆盖 vendor，未伪造升级成功。

## 2. 证据

- Composer 全局仓库：`repositories.packagist.org.url = https://mirrors.aliyun.com/composer/`，缓存 TTL 180 天。
- 镜像元数据 `p2/yiisoft/yii2.json` 最高版本 `2.0.53`（`evidence/aliyun_yii2_p2.json`）。
- `composer require yiisoft/yii2:2.0.55 --dry-run -W` 输出：`found yiisoft/yii2[..., 2.0.53] but it conflicts with your root composer.json require (2.0.55)`（`evidence/composer_require_patches_dryrun.txt`）。
- `composer require yiisoft/yii2-redis:2.0.20 --dry-run` 同样无匹配（`evidence/composer_require_redis2020_dryrun.txt`）。
- `https://repo.packagist.org` 在本环境不可达（连接被重置），无法切换到上游源获取。

## 3. 待执行（镜像同步 / 网络恢复后）

```
php D:\dev\tools\composer.phar update yiisoft/yii2 yiisoft/yii2-redis --with-all-dependencies
php D:\dev\tools\composer.phar install
php D:\dev\tools\composer.phar check-platform-reqs
php D:\dev\tools\composer.phar audit
```

升级后必须回归：登录、后台菜单、询价、上传下载、SEO、AuthKey 轮换。

## 4. PhpSpreadsheet 与上传白名单

- 代码中无 `PHPExcel` / `PhpSpreadsheet` / `IOFactory` 调用：XLS/XLSX **仅存储、不解析、不预览**。
- 未发现业务必须上传表格的证据；本轮已将上传白名单从 `xls,xlsx,csv,doc,docx,pdf,txt` 收紧为 `csv,doc,docx,pdf,txt`（`SnSiiCart`）。
- 验证：`.xlsx` 上传被拒（`validation_error=yes`，无记录）；`.pdf` 正常（`success=yes`）。证据：`evidence/upload_whitelist.txt`。
- PhpSpreadsheet 本轮不升级，但风险面已通过“禁止表格上传 + 无解析调用”降低。

## 5. Guzzle / phpseclib / firebase-php-jwt

| 包 | 实际调用 | 决策 |
|---|---|---|
| guzzle 7.4.1 | 经 `google/apiclient` 间接使用 | 与 apiclient 联动升级，需单独回归外部调用 |
| phpseclib 3.0.37 | 未发现应用直接调用 | 随 google 链路升级；不启用 SSH/SFTP |
| firebase/php-jwt 5.5.1 | 未发现 JWT 解析调用 | 不单独升级；禁止自定义 JWT 校验 |

“未发现调用”**不等于**漏洞关闭，均在 `05` 文档按“隔离/待验证”记录。
