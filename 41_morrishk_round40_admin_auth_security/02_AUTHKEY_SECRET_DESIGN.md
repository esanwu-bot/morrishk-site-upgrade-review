# 02 AuthKey Secret 设计修订

## 1. 变更背景

Round 39.2 的实现为 `hash_hmac('sha256', id|UserName, PassWord)`：HMAC 密钥是数据库密码哈希，数据库读取者可直接计算 AuthKey。本轮改为**独立服务端 Secret**。

## 2. 设计

```
AuthKey = HMAC-SHA256(
    key   = MORRISHK_AUTH_KEY_SECRET            // 环境变量，>=32 字符，独立于 Cookie Key
    data  = id | UserName | Status | substr(sha256(PassWord), 0, 16)
)
```

| 项 | 说明 |
|---|---|
| Secret 来源 | `config/params.php` 读取 `getenv('MORRISHK_AUTH_KEY_SECRET')` |
| 最小长度 | 32 字符；缺失或过短 → **fail closed** |
| 密码哈希角色 | 仅作为消息摘要的一部分，**不再作为 HMAC 密钥**；数据库泄露不足以推导 AuthKey |
| 绑定字段 | 用户 ID、用户名、账号状态、密码哈希摘要 |
| 轮换 | 更换 Secret 后所有旧持久登录 Cookie 立即失效 |
| 密码/用户名/状态变更 | 旧 Cookie 失效 |
| 登录阻断 | `SiteController::actionLogin` 在 Secret 缺失时返回 **503** + `Retry-After`，不进入密码校验 |
| 回退 | `validateAuthKey()` 在 Secret 缺失时直接返回 false，绝无降级路径 |
| 硬编码 | 无；未提供默认 Secret；未复用 Cookie Validation Key |

## 3. 部署环境变量

| 变量 | 必填 | 要求 |
|---|---|---|
| `MORRISHK_AUTH_KEY_SECRET` | 是 | ≥32 字符随机串，仅存于部署环境/密钥管理，**不得提交仓库或写入报告** |
| `MORRISHK_COOKIE_VALIDATION_KEY` | 是 | 维持原有用途，与 AuthKey Secret **分开** |

生成示例（部署机执行，不落盘到仓库）：`openssl rand -base64 48` 或等价密码学随机源。

轮换流程：更新环境变量 → 重启 PHP-FPM → 所有用户需重新登录（旧持久 Cookie 失效），无需数据库变更。

## 4. 验证

| 场景 | 预期 | 实际 |
|---|---|---|
| 正确账号密码登录 | 成功 | POST 302 |
| 错误密码 | 失败 | POST 200 + 错误文案 |
| 不存在账号 | 失败 | POST 200 + 错误文案 |
| 持久登录 Cookie 有效 | 200 | 200 |
| Secret 轮换后旧 Cookie | 失效 | 302 |
| Secret 缺失时 GET 登录页 | fail closed | **503** |
| Secret 缺失时 POST 登录 | fail closed | **503** |
| 密码变更后旧 Cookie | 失效 | 302 |
| 用户名变更后旧 Cookie | 失效 | 302 |
| 普通员工访问管理员专享资源 | 拒绝 | 403（下载矩阵） |
| DB 密码哈希泄露 → 推导 AuthKey | 不可行 | 密钥仅来自环境 Secret |

原始输出：`evidence/regression_matrix.txt`。

## 5. 已知限制（需 Reviewer 决策）

Yii 的持久登录 Cookie 是**无状态**的：用户点“退出”只销毁当前 Session 并删除浏览器 Cookie，**已被复制走的旧持久 Cookie 在 Secret/密码变更前仍然有效**。实测 `copied_cookie_after_logout = 200`。

可选方案（本轮未实施，避免新增表结构）：

1. 新增 `AuthKeyVersion int` 列，登出时自增并纳入 HMAC → 可服务端吊销；
2. 引入服务端票据表（token 哈希、过期时间、吊销标记）；
3. 缩短持久 Cookie 生命周期并依赖 Secret 定期轮换。

在此之前，管理员的强制下线手段为：修改密码或轮换 Secret。

## 6. 影响评估

- 旧账号：无需迁移；
- 旧持久 Cookie：Round 39.2 的派生方式与本轮不同，全部失效，需重新登录（预期）；
- 密码校验、Session、RBAC：未改动；
- 数据库：无 DDL。
