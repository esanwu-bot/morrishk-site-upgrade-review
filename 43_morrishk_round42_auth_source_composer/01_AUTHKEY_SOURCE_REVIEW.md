# 01 AuthKey 源码审查材料（F-17）

## 1. 审查范围与基线

| 项 | 值 |
|---|---|
| 应用仓库 | `E:\workspace\独立站\morrishk-site-r39-wt` |
| 分支 | `fix/morrishk-r39-php85-native` |
| 基线 HEAD | `b7e8933`（parent `2478920`） |
| 本轮代码改动 | 无（仅 `composer.lock` 升级，见 04/05） |
| 测试用 PHP | 8.5.13 NTS |
| 测试用 MySQL | 8.4.13（127.0.0.1:3307，本地实例） |

本文件只做**源码事实陈述**，不重复 Round 41 的语义结论。所有行号均对应
`b7e8933` 工作区实际内容；带行号的完整输出见：

- `evidence/source_snsii_manage.txt`（L123–L209）
- `evidence/source_site_controller.txt`（L185–L238）
- `evidence/source_sql.txt`（两份 SQL 全文）
- `evidence/round41_changes.diff`（`2478920..b7e8933` 相关文件 unified diff）
- `evidence/round41_changes.stat.txt`
- `evidence/file_sha256.txt`

## 2. 文件 SHA256（工作区实际内容）

```text
6875C53222FC4BB0B4BFEA9978E6473B5EBBD046C84525DB3E4AAACA5179C8D5  modules/ejadmin/models/SnSiiManage.php
385F8C9AD5CA41345813B69BDE45775E185BA0841DD5C9EBB28DFBE46DB46330  controllers/SiteController.php
BC4FACB44E1761E7B875C9BF63F70BF42FCD53DD7F4B02AE40ACAFB02D024830  config/params.php
758B4AECA327B9BE32DC043E9B88D77120F19A31A2C7682128B206AE69E54519  models/SnSiiCart.php
9414A10FCCCA9AE88493EB2CB58B23AB6B74F8DCAFA8B93C1978E2133CBA5F78  db/2026-11-25_auth_key_version.sql
3E4565F4AD0E7D9A71D625B57E1D1B5FD6DEB290EBE6CF8DAD25C1F1C64D34FE  db/rollback_auth_key_version.sql
BFF941D759070183AED23A49080500E1C241E3FC6B752FB44891E57B33AAFC27  composer.json
EB1C084EBB4AAE7B9493748FA72B0967DEF3A793632008E4F95BF7827ABB95E5  composer.lock
```

## 3. `config/params.php`

```php
// config/params.php L11
    'AuthKeySecret' => getenv('MORRISHK_AUTH_KEY_SECRET') ?: '',
```

- Secret 只来自环境变量 `MORRISHK_AUTH_KEY_SECRET`，仓库内无值。
- 与 `request.cookieValidationKey`（`MORRISHK_COOKIE_VALIDATION_KEY`，`config/web.php` L18）相互独立。

## 4. `SnSiiManage.php`（L123–L209，完整片段）

```php
// L123-L136  Secret 强度检查
    /**
     * 持久登录票据的独立服务端密钥是否就绪。
     */
    public static function hasAuthKeySecret()
    {
        $secret = (string)(Yii::$app->params['AuthKeySecret'] ?? '');
        if (strlen($secret) < 32) { return false; }
        if (preg_match('/^(.)\1+$/', $secret)) { return false; }
        $lower = strtolower($secret);
        foreach (['changeme', 'change-me', 'secret', 'password', 'example', 'default'] as $w) {
            if (strpos($lower, $w) !== false) { return false; }
        }
        return true;
    }

// L138-L146  取 Secret（fail closed）
    private static function authKeySecret()
    {
        $secret = (string)(Yii::$app->params['AuthKeySecret'] ?? '');
        if (!self::hasAuthKeySecret()) {
            Yii::error('MORRISHK_AUTH_KEY_SECRET missing, too short or weak', __METHOD__);
            throw new \yii\base\InvalidConfigException('Persistent login secret is not configured.');
        }
        return $secret;
    }

// L148-L152  旧 docblock（cosmetic，本轮未改；不参与运行逻辑）
    /**
     * 持久登录票据密钥：独立 Secret + 用户 ID / 用户名 / 账号状态 / 密码哈希摘要。
     * HMAC 密钥只来自环境变量 Secret；密码哈希仅作为消息摘要的一部分，
     * 数据库泄露不足以推导 AuthKey；Secret 或密码变更后旧 Cookie 失效。
     */

// L153-L163  列自检（fail closed）
    /**
     * AuthKeyVersion 列自检：缺失时 fail closed，禁止降级为无吊销验证。
     */
    public static function assertAuthKeyVersionColumn()
    {
        $schema = static::getDb()->getTableSchema(static::tableName(), true);
        if ($schema === null || $schema->getColumn('AuthKeyVersion') === null) {
            Yii::error('snsii_manage.AuthKeyVersion is missing', __METHOD__);
            throw new \yii\base\InvalidConfigException('AuthKeyVersion column is required.');
        }
    }

// L165-L180  版本递增
    /**
     * 账号级吊销：版本 +1，使该账号全部已签发的持久 Cookie 失效。
     */
    public static function bumpAuthKeyVersion($id)
    {
        self::assertAuthKeyVersionColumn();
        $affected = static::updateAll(
            ['AuthKeyVersion' => new \yii\db\Expression('AuthKeyVersion + 1')],
            ['id' => (int)$id]
        );
        if ($affected !== 1) {
            Yii::error('AuthKeyVersion bump affected ' . $affected . ' rows for user ' . (int)$id, __METHOD__);
            throw new \yii\base\InvalidConfigException('AuthKeyVersion update failed.');
        }
        return $affected;
    }

// L182-L193  AuthKey 计算
    public function getAuthKey()
    {
        self::assertAuthKeyVersionColumn();
        $payload = json_encode([
            'id' => (int)$this->getId(),
            'u'  => (string)$this->UserName,
            's'  => (int)$this->Status,
            'p'  => hash('sha256', (string)$this->PassWord),
            'v'  => (int)$this->AuthKeyVersion,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        return hash_hmac('sha256', $payload, self::authKeySecret());
    }

// L195-L209  校验
    /**
     * {@inheritdoc}
     */
    public function validateAuthKey($authKey)
    {
        if (!self::hasAuthKeySecret()) {
            return false;
        }
        try {
            self::assertAuthKeyVersionColumn();
        } catch (\Throwable $e) {
            return false;
        }
        return hash_equals($this->getAuthKey(), (string)$authKey);
    }
```

### 4.1 事实要点

- **Secret 强度规则**：长度 ≥ 32；禁止全同字符（`/^(.)\1+$/`）；大小写不敏感地拒绝
  `changeme` / `change-me` / `secret` / `password` / `example` / `default` 子串。
- **fail closed**：`authKeySecret()` 在配置缺失/弱值时抛 `InvalidConfigException`；
  `validateAuthKey()` 在 Secret 缺失、或 `AuthKeyVersion` 列缺失时直接返回 `false`，不会降级。
- **JSON HMAC 载荷**：字段顺序固定为 `id,u,s,p,v`；`p` 是 `PassWord` 的**完整** `sha256`（64 hex）；
  `v` 是当前 `AuthKeyVersion`；序列化 flags 固定为 `JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE`；
  MAC 为 `hash_hmac('sha256', $payload, $secret)`，输出 64 hex。
- **比较**：`hash_equals`，常量时间。
- **数据库隔离的边界**：MAC 密钥不在数据库中；`PassWord`（bcrypt 哈希）只作为消息的一部分。
  若攻击者已能读取数据库，`p` 不构成额外密钥；但数据库内容本身不足以伪造新的 AuthKey，
  仍需 `MORRISHK_AUTH_KEY_SECRET`。
- 已知 cosmetic 问题：L148–L152 的旧 docblock 位于 `assertAuthKeyVersionColumn()` 上方，
  与实际方法不对应；不影响运行，本轮未修改（避免无关代码变更）。

## 5. `SiteController.php`（L185–L238，完整片段）

```php
// L185-L220  登录
    //Login
    public function actionLogin()
    {
        $res = [];
        if (!Yii::$app->user->isGuest) {
            return $this->goHome();
        }

        // 持久登录 Secret 未配置时 fail closed，不允许登录
        if (!\app\modules\ejadmin\models\SnSiiManage::hasAuthKeySecret()) {
            Yii::error('Login blocked: MORRISHK_AUTH_KEY_SECRET missing or shorter than 32 chars', __METHOD__);
            Yii::$app->response->statusCode = 503;
            Yii::$app->response->headers->set('Retry-After', '300');
            return 'Authentication is temporarily unavailable.';
        }

        $PostData                = \Yii::$app->request->post();
        $PostDataOK['LoginForm'] = $PostData;

        $model = new LoginForm();
        if ($PostData && $model->load($PostDataOK) && $model->login()) {
            //return $this->goBack();
            return $this->redirect(['/ejadmin-index']);
        }else{
            $res['Errors'] = $model->getErrors();
            //print_r($res);
        }
        $res['model'] = $model;

        $this->seo([
            'title' => 'Login',
        ]);

        $model->password = '';
        return $this->render('/user/login', $res);
    }

// L222-L238  登出
    //Logout
    public function actionLogout()
    {
        $identity = Yii::$app->user->identity;
        if ($identity !== null) {
            try {
                \app\modules\ejadmin\models\SnSiiManage::bumpAuthKeyVersion((int)$identity->getId());
            } catch (\Throwable $e) {
                Yii::error('Logout revocation failed: ' . $e->getMessage(), __METHOD__);
                Yii::$app->response->statusCode = 503;
                return 'Logout is temporarily unavailable. Please retry.';
            }
        }
        Yii::$app->user->logout();

        return $this->goHome();
    }
```

### 5.1 事实要点

- 登录前先检查 `isGuest`；已登录直接 `goHome()`，不会重复走密码校验。
- Secret 缺失/弱值：`503` + `Retry-After: 300` + 纯文本 `Authentication is temporarily unavailable.`；
  不渲染登录页、不回显任何配置细节。
- 登出顺序：**先** `bumpAuthKeyVersion()`，**后** `Yii::$app->user->logout()`。
  - 递增失败 → `503`，并**不执行** logout，避免“客户端已退出但服务端版本未递增”的假吊销。
  - 递增成功 → `logout()` 销毁当前 PHP Session → `goHome()`（302）。
- `bumpAuthKeyVersion()` 以 `id` 为条件更新且要求受影响行数恰好为 1；0 行或多行都视为失败。

## 6. 两份 SQL

```sql
-- db/2026-11-25_auth_key_version.sql
-- Round 41: 持久登录吊销版本（账号级全部设备）
-- 可重复执行：列已存在时跳过。
DROP PROCEDURE IF EXISTS r41_ensure_auth_key_version;

DELIMITER //
CREATE PROCEDURE r41_ensure_auth_key_version()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'snsii_manage' AND column_name = 'AuthKeyVersion'
    ) THEN
        ALTER TABLE `snsii_manage`
            ADD COLUMN `AuthKeyVersion` int NOT NULL DEFAULT 0 COMMENT 'persistent login revocation version';
    END IF;
END //
DELIMITER ;

CALL r41_ensure_auth_key_version();
DROP PROCEDURE IF EXISTS r41_ensure_auth_key_version;

SELECT column_name, column_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'snsii_manage' AND column_name = 'AuthKeyVersion';
```

```sql
-- db/rollback_auth_key_version.sql
-- Round 41 回滚：移除 AuthKeyVersion（仅在确认无需吊销能力时执行）
-- 执行后旧版应用可用，但持久 Cookie 吊销能力同时失效。
ALTER TABLE `snsii_manage` DROP COLUMN `AuthKeyVersion`;
```

- 迁移脚本依赖 `DELIMITER`（mysql 客户端指令），必须用 `mysql` CLI 的 `source` 执行，
  不能直接丢给 PDO/预处理语句。
- 幂等性由 `information_schema.columns` 判断保证；不依赖 `IF NOT EXISTS` 的 MySQL 版本差异。
- 回滚仅删除列，不回填/不备份；执行前需自行确认旧版应用不再调用 `getAuthKey()`。

## 7. 本轮 unified diff

`b7e8933` 相对 parent `2478920` 的相关改动（完整 diff 见 `evidence/round41_changes.diff`）：

```text
 controllers/SiteController.php         | 10 ++++++
 db/2026-11-25_auth_key_version.sql     | 23 ++++++++++++++
 db/rollback_auth_key_version.sql       |  3 ++
 models/SnSiiCart.php                   |  2 +-
 modules/ejadmin/models/SnSiiManage.php | 56 +++++++++++++++++++++++++++++++---
 5 files changed, 88 insertions(+), 6 deletions(-)
```

本轮（Round 42）**没有**修改上述任何源码文件；如需核对“本轮 diff”，应用仓库唯一变更为
`composer.lock`（见 04/05 与 `07_ROUND42_SUMMARY.md` 的 `git diff` 摘要）。

## 8. 敏感信息声明

- 本文件与 `evidence/` 不包含任何真实 Secret、Cookie 值、密码或用户敏感数据。
- Secret 相关只出现环境变量名 `MORRISHK_AUTH_KEY_SECRET`；测试 Secret 未写入本包。
- Cookie 证据只记录名称、长度与属性，不记录值。
