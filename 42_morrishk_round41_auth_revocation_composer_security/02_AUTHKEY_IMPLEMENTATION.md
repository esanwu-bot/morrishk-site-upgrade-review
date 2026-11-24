# 02 AuthKey 实现细节

## 1. HMAC 载荷（规范化）

```json
{"id":195,"u":"qa_r39_a","s":1,"p":"<sha256(PassWord) 全量 64 hex>","v":3}
```

```php
hash_hmac('sha256', json_encode($payload, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE), $secret)
```

- JSON 键顺序固定、字段有明确名称，消除 `id|name|status` 简单拼接的边界歧义；
- 密码摘要使用**完整 SHA-256**（64 hex），不再截断 16 位；
- 密码摘要只作为消息的一部分，HMAC 密钥仍只来自环境变量。

## 2. Secret 规则

| 规则 | 实现 |
|---|---|
| 长度 | ≥32 字符 |
| 弱值拒绝 | 单一字符重复、包含 `changeme/secret/password/example/default` → 视为未配置 |
| 生成 | 部署侧使用密码学随机源（`openssl rand -base64 48` 或 `random_bytes`），不得手写口令 |
| 缺失/弱值 | 登录 503，`validateAuthKey()` 返回 false（fail closed） |
| 与 Cookie Key | 完全独立（`MORRISHK_AUTH_KEY_SECRET` vs `MORRISHK_COOKIE_VALIDATION_KEY`） |
| 多 worker | 所有 PHP-FPM worker/实例必须注入同一 Secret；实测两个 worker（8099/8101）共用身份 Cookie 均 200 |
| 轮换 | 新 Secret 生效后旧 Cookie 全部失效（实测 302） |
| 退役 | 旧 Secret 永久废弃，不得作为常规回滚手段重新启用；如需恢复访问，统一重新登录 |

## 3. 日志与保密

- 日志只记录“Secret 缺失/过弱”等状态，不输出 Secret 值；
- 测试输出、报告、Git 均不含真实 Secret（测试使用临时文件注入，不进入仓库）；
- Cookie 与密码摘要不出现在日志中。

## 4. 修改文件

| 文件 | 变更 |
|---|---|
| `modules/ejadmin/models/SnSiiManage.php` | Secret 强度校验、AuthKeyVersion 自检、`bumpAuthKeyVersion()`、JSON HMAC 载荷 |
| `controllers/SiteController.php` | 登录 fail-closed 503；登出递增版本，失败 503 |
| `config/params.php` | `AuthKeySecret` 读取环境变量 |
| `db/2026-11-25_auth_key_version.sql` | 幂等迁移 |
| `db/rollback_auth_key_version.sql` | 回滚脚本 |
| `models/SnSiiCart.php` | 上传白名单移除 `xls,xlsx`（见 04 文档） |

## 5. 验证摘要

- `authkey_length = 64`（完整 SHA-256 hex）
- 版本字段参与载荷（`authkey_version_field = 1`）
- 缺失列 / 递增失败 → `InvalidConfigException`（fail closed）
- 多 worker 一致：8099 与 8101 同一身份 Cookie 均 200

证据：`evidence/cli_checks.txt`、`evidence/multiworker.txt`、`evidence/revocation_matrix.txt`。
