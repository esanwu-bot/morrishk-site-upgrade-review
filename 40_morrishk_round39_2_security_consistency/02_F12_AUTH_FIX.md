# 02 F-12 后台登录缺陷修复

## 1. 缺陷

| 项 | 内容 |
|---|---|
| 现象 | 正确账号密码提交后返回 500 |
| 错误 | `Undefined property: app\modules\ejadmin\models\SnSiiManage::$authKey`（`yii\web\User.php:696` 调用 `getAuthKey()`） |
| 根因 | 模型实现了 `IdentityInterface`，`getAuthKey()` 读取不存在的 `authKey` 属性；`snsii_manage` 表无该列 |
| 触发条件 | `enableAutoLogin=true`，登录成功写入身份后立即读取 authKey |

修复前证据：`evidence/f12_before_authkey_error.txt`。

## 2. 现有认证模型核对

| 项 | 现状 |
|---|---|
| 身份类 | `SnSiiManage`（ActiveRecord + `IdentityInterface`），`getId()` 返回 `id` |
| 密码 | `security->validatePassword($raw, $this->PassWord)`（bcrypt），未改动 |
| 账号状态 | `findByUsername()` 限定 `Status=1`，用户名或邮箱登录 |
| 会话 | Yii Session（文件），Cookie 校验键来自 `MORRISHK_COOKIE_VALIDATION_KEY` |
| 持久登录 | `enableAutoLogin=true`（依赖 authKey） |
| RBAC | `snsii_manage.Role`：1=管理员，0=普通员工；未改动 |

## 3. 最小修复方案

不新增数据库列，采用“由账号不可变信息派生”的 authKey：

```php
public function getAuthKey()
{
    return hash_hmac('sha256', $this->getId() . '|' . $this->UserName, (string)$this->PassWord);
}

public function validateAuthKey($authKey)
{
    return hash_equals($this->getAuthKey(), (string)$authKey);
}
```

设计说明：

- 不是固定字符串，也不是跳过校验；
- 密钥为密码哈希：密码修改后旧持久登录 Cookie 自动失效；
- 账号删除后身份无法加载，Cookie 自然失效；
- 同一账号在会话有效期内 authKey 稳定，`enableAutoLogin` 正常工作；
- 不降低密码校验、Session 或 RBAC 要求。

## 4. 影响评估

| 对象 | 影响 |
|---|---|
| 旧账号 | 无需迁移；首次登录即生成票据 |
| 旧持久登录 Cookie | 旧实现从未成功签发（登录即 500），不存在需要兼容的存量票据 |
| 仅会话登录 | 不影响 |
| 数据库 | 无 DDL、无字段变更 |
| 回滚 | 回滚提交即可；无数据副作用 |

可选后续（非本轮）：新增独立 `AuthKey` 列以获得与“密码哈希泄露”解耦的票据密钥；需字段设计、默认值、旧数据回填与回滚脚本，单独评审。

## 5. 修复后验证

| 场景 | 结果 |
|---|---|
| 正确账号 + 正确密码（staff A/B、admin） | POST 302 → `/ejadmin-index.html` |
| 错误密码 | POST 200，页面出现 `Incorrect username or password`，无登录态 |
| 不存在账号 | POST 200，同样失败文案 |
| 登录态保持 | 登录后以该 Cookie 请求受保护下载 → 200（附件流） |
| 未登录访问受保护页面 | 302 → `/site/login.html` |
| 退出登录 | POST `/site/logout.html`（带 CSRF）→ 302 `/` |
| 退出后访问受保护下载 | 403 |
| 角色不混淆 | staff A 下载他人附件 403；admin 下载他人附件 200 |

原始输出：`evidence/auth_matrix.txt`。

## 6. 提交

| 项 | 值 |
|---|---|
| 分支 | `fix/morrishk-r39-php85-native` |
| 修改文件 | `modules/ejadmin/models/SnSiiManage.php` |
| 提交 | 见 README 的提交清单 |
