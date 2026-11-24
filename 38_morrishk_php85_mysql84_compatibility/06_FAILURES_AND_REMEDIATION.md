# 06 失败项与最小修复建议

本轮**未修改应用源码**，应用仓库无新提交。以下为实测问题与建议，供 Round 39 决策。

## F-01 完整 Composer 安装失败（dev 依赖平台约束）

- 位置：`composer.lock`（`codeception/module-yii2 1.1.5`、`phpspec/prophecy 1.15.0`、`symfony/browser-kit 4.2.4`、`symfony/service-contracts 1.1.2`、`symfony/console 5.4.3`）
- 现象：`composer install` 直接终止；`--ignore-platform-reqs` 可绕过但被明令禁止。
- 影响：测试工具链无法在 PHP 8.5 下工作（不影响生产运行时）。
- 最小建议：仅升级 dev 依赖到支持 8.5 的版本；生产依赖保持 lock 不变，等 F-02 一并处理。

## F-02 PHP 8.5 弃用被 Yii 升级为异常

- 位置：`vendor/yiisoft/yii2/web/HeaderCollection.php`、`caching/Cache.php`、`base/Model.php`、`web/CookieCollection.php`、`helpers/BaseHtml.php:118`、`web/UrlRule.php:339`；`vendor/egulias/email-validator/src/EmailLexer.php:275`
- 现象：未处理时任何请求都可能抛 `yii\base\ErrorException:8192`，页面 500。
- 影响：生产 PHP 8.5 下不可用。
- 最小建议：单包升级 `yiisoft/yii2` 到同系列最新 2.0.x；`egulias/email-validator` 升 4.x。升级后重跑本回归。

## F-03 站内错误页在 PHP 8.5 下渲染失败

- 位置：`config/web.php` 的 `errorHandler.errorAction = site/error` 与 `views/site/error.php` + 布局
- 现象：命中 404/403 时返回 **500** 与通用文案，而非对应状态码。
- 影响：错误页不可用、SEO 与排障受影响。
- 最小建议：先修错误页布局对缺省 `params`（`Mid`/`MRow`/`Links`）的访问，再恢复 `errorAction`。

## F-04 未定义数组键 `Mid`

- 位置：`controllers/ProController.php:94`
- 现象：`Undefined array key "Mid"`，PHP 8 为 Warning，被升级为异常 → 500。
- 影响：大类列表、商家分类页。
- 最小建议：入口/基类统一注入 `params['Mid']`（生产由域名解析注入，本地缺失）；或改为 `params['Mid'] ?? 0`。

## F-05 商家行为 false 时取下标

- 位置：`controllers/ProController.php:435`（`$MRow['Name']`，`MRow::Item()` 返回 false）
- 现象：`Trying to access array offset on false` → 500。
- 影响：无对应商家记录时 PDP 失败。
- 最小建议：`MRow::Item()` 失败时回退默认商家或抛 404，避免直接下标。

## F-06 询价模型缺 `OwnerUserId` 属性

- 位置：`controllers/CartController.php`、`controllers/ProController.php` 设置 `OwnerUserId`；表结构需 `db/2026-11-24_cart_owner.sql`
- 现象：未执行迁移时 `UnknownPropertyException: Setting unknown property: app\models\SnSiiCart::OwnerUserId` → 500。
- 影响：询价提交失败。
- 本轮处置：在测试库执行该迁移后恢复正常（迁移属 Round 37 交付物，非本轮新写）。
- 最小建议：部署流程把 `db/*.sql` 纳入发布清单并校验。

## F-07 MyISAM 无事务

- 位置：`snsii_cart` 等 30 张表
- 现象：`rollBack()` 后数据仍存在（`NOT_ROLLED_BACK`）。
- 影响：询价、商品等写入无原子性；迁移中断无法回滚。
- 最小建议：新表用 InnoDB；存量表择机转换（需评估锁表时间与全文索引）。

## F-08 utf8mb3 无法保存 4 字节字符

- 位置：`snsii_cart.Company` 等 utf8mb3 列
- 现象：`1366 Incorrect string value: '\xF0\x9F\x98\x80'`。
- 影响：客户提交 Emoji 会失败。
- 最小建议：迁移到 utf8mb4（含连接串 `charset` 与索引长度评估）。

## F-09 严格模式拒绝缺省 NOT NULL 列

- 位置：`snsii_cart.AddDate`（NOT NULL 无默认值）
- 现象：`1364 Field 'AddDate' doesn't have a default value`。
- 影响：任何未显式赋值的插入都会失败；旧代码在 5.6 宽松模式下被掩盖。
- 最小建议：模型 `beforeSave` 已补 `AddDate`，但需全表排查同类列；必要时给默认值。

## F-10 Mock 发送器依赖真实 SMTP 配置

- 位置：`service/inquiry/MockInquirySender.php`（调用 `Yii::$app->mailer`）+ `config/web.php` 的 `Swift_SmtpTransport`
- 现象：`useFileTransport=false`，默认 `smtp.gmail.com:465`；测试若不改主机，会尝试真实外发。
- 影响：本地/演示环境存在误发邮件风险。
- 本轮处置：测试入口把 SMTP 指向本机不可用地址，发送失败被捕获；未连接外部服务。
- 最小建议：Mock 适配器改用 `useFileTransport=true` 或独立 `NullTransport`，与生产配置解耦。

## F-11 会话购物车回显未确认

- 现象：`PHPSESSID` 正常下发，提交后重新 GET 购物车页未观察到 `CartList` 回显。
- 影响：待确认是前端取值方式还是会话写入问题。
- 建议：Round 39 用浏览器端复测（含 JS 请求）。

## 汇总

| 编号 | 级别 | 是否阻塞 PHP 8.5 / MySQL 8.4 运行 |
|---|---|---|
| F-01 | 中（dev） | 否（生产可 `--no-dev`） |
| F-02 | 高 | 是 |
| F-03 | 中 | 否（影响错误页） |
| F-04 / F-05 | 高 | 是（相关页面 500） |
| F-06 | 高 | 是（未迁移时询价 500） |
| F-07 / F-08 / F-09 | 高 | 影响数据正确性与迁移 |
| F-10 | 中 | 否（测试环境风险） |
| F-11 | 低 | 待确认 |
