# 02 Secret 轮换与旧 Cookie 复活风险（F-21）

## 1. 结论

| 项 | 结果 |
|---|---|
| 仅切换 Secret、不做版本递增 | **FAIL**：恢复旧 Secret 后，旧 Cookie 重新有效 |
| 轮换流程包含账号级版本递增 | **PASS**：旧 Cookie 永久失效，恢复旧 Secret 也不复活 |
| 是否新增数据库结构 | **否**（复用 `AuthKeyVersion`，新增命令，无迁移） |
| 命令 | `php yii auth-key/rotate` |

## 2. 复现（当前 HEAD `fa35a95` 行为）

`evidence/secret_rotation.txt`：

```text
login_A_secret_A                               http=302
cookie_A_present                               yes
cookie_A_on_secret_A_before                    http=200
cookie_A_on_secret_B_no_rotate                 http=302
cookie_A_back_on_secret_A_no_rotate            http=200   <-- 旧 Cookie 复活
rotate_command                                 exit=0 output=AuthKeyVersion incremented for 3 account(s).
cookie_A_on_secret_B_after_rotate              http=302
cookie_A_back_on_secret_A_after_rotate         http=302
login_B_secret_B                               http=302
cookie_B_present                               yes
cookie_B_on_secret_B                           http=200
cookie_A_final_on_secret_A                     http=302
cookie_B_on_secret_A                           http=302
login_A2_secret_A                              http=302
cookie_A2_on_secret_A                          http=200
REVIVED_WITHOUT_ROTATE=yes
```

原因：AuthKey 是 `HMAC(secret, payload)`，payload 只含 `id/u/s/p/v`。
Secret-A 与 Secret-B 只是 HMAC 密钥不同；`v` 未变化时，恢复 Secret-A 会重新算出完全相同的 MAC，
因此旧的 `_identity` 与 Session 内的 `__authKey` 重新通过校验。

## 3. 方案评估

| 方案 | 能否阻止复活 | 结构变更 | 并发/回滚 | 结论 |
|---|---|---|---|---|
| A. Secret 轮换时账号级版本统一递增 | 能（旧 `v` 永久落后） | 无 | 单条 `UPDATE`；MyISAM 表级锁 | **采用** |
| B. 持久化全局 Secret Generation（新表） | 能 | 新增单行表 + 迁移 + 每请求读取 | 需事务/缓存，部署面更大 | 不采用（本轮过度） |
| C. 环境变量 Epoch | 能（若同时改） | 无 | 回滚环境变量时可能一起回退，易复活 | 不采用 |
| D. 把 Secret 摘要放进 payload | **不能** | 无 | 恢复 Secret 后摘要也恢复 | 无效 |

选择 A 的理由：

- `snsii_manage` 是后台账号表（测试 3 行；生产为管理员账号，量级很小），全量 `UPDATE` 成本低。
- 不新增表、不改迁移、不改 HMAC 载荷格式，回滚简单。
- 旧 Cookie 携带旧 `v`，即使 Secret 恢复也无法复活；新登录用新 `v`，不受影响。
- 需要显式执行命令；这是一条**运维步骤**，不是自动检测。若轮换 Secret 却忘记执行命令，恢复旧 Secret 仍可能复活（见第 7 节残余风险）。

## 4. 实现

改动 diff：`evidence/app_round43.diff`。

`SnSiiManage.php` 新增：

```php
public static function bumpAllAuthKeyVersions()
{
    self::assertAuthKeyVersionColumn();
    $affected = static::updateAll([
        'AuthKeyVersion' => new \yii\db\Expression('AuthKeyVersion + 1'),
    ]);
    Yii::info('AuthKeyVersion rotated for ' . $affected . ' accounts', __METHOD__);
    return $affected;
}
```

新增 `commands/AuthKeyController.php`：

```php
class AuthKeyController extends Controller
{
    public function actionRotate()
    {
        try {
            $affected = SnSiiManage::bumpAllAuthKeyVersions();
        } catch (\Throwable $e) {
            $this->stderr("auth-key rotation failed: " . $e->getMessage() . "\n");
            return ExitCode::UNSPECIFIED_ERROR;
        }
        $this->stdout("AuthKeyVersion incremented for {$affected} account(s).\n");
        return ExitCode::OK;
    }
}
```

- 无新表、无新列、无新依赖。
- 命令只做一次全量 `UPDATE`；失败返回非 0。
- 测试库执行后版本示例：`qa_r39_a=15`、`qa_r39_b=6`、`qa_r39_admin=3`（多次测试累计）。

## 5. 轮换 Runbook

1. 备份 `snsii_manage`（至少导出 `id, AuthKeyVersion`）。
2. 将新 Secret 注入环境变量 `MORRISHK_AUTH_KEY_SECRET` 并重启/滚动发布 FPM。
3. 执行：`php yii auth-key/rotate`，确认输出 `AuthKeyVersion incremented for N account(s)` 且退出码 0。
4. 验证：旧 `_identity` 访问受保护页 302；新登录 302 后受保护页 200。
5. 若需要回滚 Secret：**不要递减版本**；恢复旧 Secret 后再次执行 `php yii auth-key/rotate`。
6. 若第 3 步失败：不要回滚 Secret；先修复数据库/权限，再执行命令。此时旧 Cookie 在旧 Secret 下仍可能有效，应视为未完成轮换。

## 6. 并发、失败与回滚分析

- **并发登录**：轮换窗口内新登录可能拿到旧版本 `v`（在新 Secret 下），命令执行后该批 Cookie 失效，用户需重新登录；可接受。
- **多实例并存**：所有实例共享数据库版本；命令执行后，任意实例的 `validateAuthKey()` 都读到新版本，行为一致。
- **命令并发**：两个 rotate 同时执行会递增两次，只会让更多旧 Cookie 失效，不会产生可用旧 Cookie。
- **存储引擎**：`snsii_manage` 为 MyISAM（生产结构副本确认），单条 `UPDATE` 持有表级写锁；账号表很小，耗时毫秒级。
- **失败回滚**：代码可回退；版本递增本身**不可回退**（回退会复活旧 Cookie）。数据库备份恢复会连同版本一起回退，属于高风险操作，需同时视为“所有旧 Cookie 可能复活”。
- **无持久化全局 Generation**：如果运维把数据库恢复到轮换前的备份并同时恢复旧 Secret，旧 Cookie 会复活；这是所有“版本递增”方案的共同边界，必须在变更记录中禁止。

## 7. 残余风险（必须保留）

1. 轮换命令是人工步骤；遗漏执行时，恢复旧 Secret 会复活旧 Cookie。本轮**未**实现自动检测或全局 Generation 表。
2. 没有“Secret 指纹”持久化，因此无法区分“Secret 未变”与“Secret 改了又改回”。
3. 未在 MySQL 5.6.50 上执行该命令（见 04）；语法为标准 `UPDATE`，风险低但未实测精确版本。
4. 未测试大体量账号表（本轮 3 行）；生产管理员数量预计很小，但需在变更窗口执行。

## 8. 判定

- 采用“轮换 + 账号级版本递增”后，F-21 的 6 步场景全部通过：旧 Cookie 不复活，新 Secret 登录可用，恢复旧 Secret 后旧 Cookie 仍失效。
- 不把“仅切换 Secret”称为安全轮换；该路径已实测为 **FAIL**。
