# 04 业务缺陷修复

## 1. F-04 / F-05：商家上下文与缺失数据

| 项 | 修改 |
|---|---|
| 上下文来源 | `SnSiiController::resolveSiteContext()`：`params['Mid']` → 域名映射 `SiteMidMap` → `MORRISHK_SITE_MID` → 0 |
| 配置 | `config/params.php` 新增 `Mid` 与 `SiteMidMap`（`www.morrishk.net`/`morrishk.net` → 0） |
| 控制器 | `ProController::actionList` 用 `params['Mid'] ?? 0`；分类不存在时抛 `NotFoundHttpException` |
| 商家缺失 | `actionItem` 在 `MRow::Item()` 返回 false 时抛 404，不再 `$MRow['Name']` 取下标 |
| 测试入口 | **不再注入 `Mid`**；由应用自身解析 |

验证：
- 无对应分类 id → 404（`/big-categories/c-3901-9999/...`）。
- 商家记录存在（id=0）→ PDP 200；删除商家后 → 404（边界测试见 `06_FULL_REGRESSION.md`）。

## 2. F-06：OwnerUserId 迁移

| 项 | 内容 |
|---|---|
| 迁移脚本 | `db/2026-11-24_cart_owner.sql` 改为**可重复执行**（`information_schema` 判断列/索引是否存在，存储过程封装） |
| 迁移前检查 | `php db/check_schema.php`：表不存在、缺列、缺索引时输出中文诊断并 exit=1 |
| 迁移后验证 | 脚本末尾 `SELECT` 输出列定义与 `idx_owner` 索引 |
| 幂等验证 | 同一脚本连续执行 2 次均 exit=0，列与索引保持唯一 |
| 应用诊断 | `SnSiiCart::assertOwnerColumn()` 在询价入口检查；缺列时抛 `UserException`（可读文案），不再出现 `UnknownPropertyException` 500 |

## 3. F-10：Mock 发送器重构

| 项 | 变更 |
|---|---|
| 依赖 | 移除 `Yii::$app->mailer` 调用，不再接触 SMTP |
| 输出 | `runtime/inquiry/inquiry-YYYYMMDD.log`（JSON 行）+ `runtime/inquiry/eml/*.eml`（本地文件） |
| 配置解耦 | 与 `config/web.php` 的生产 mailer 配置无关 |
| 自动化测试 | `tests/Unit/MockInquirySenderTest.php`：把 `mailer` 组件替换为「一实例化即抛错」的 `FailingMailer`，发送仍成功并生成本地文件 → **证明无邮件链路调用** |

测试结果：`OK (2 tests, 6 assertions)`。

## 4. F-11：购物车会话回显

前端通过 `/cart/list` 读取服务端 Session 的 `CartList`。实测：

1. `GET /shopping-cart.html` → 下发 `PHPSESSID` 与 CSRF。
2. `POST` 加入 `R39-SESSION-02`（缺少必填项，校验失败）。
3. `GET /cart/list.html` → 返回 JSON，包含 `R39-SESSION-02` 的 `PartNumber/Quantity/UnitPrice`。
4. 成功提交后 `CartList` 被清空，属预期行为。

说明：Round 38 的"未回显"结论基于直接检查购物车 HTML，实际页面由 JS 从 `/cart/list` 渲染；本轮修正了验证方法，未修改前端逻辑。

## 5. 本轮额外修复（Round 38 未列出但阻断原生运行）

| 文件:行 | 问题 | 修复 |
|---|---|---|
| `ProController.php:47` | `$tempA['id']`（列表上取键） | `$itemA['id']` |
| `ProController.php:325` | `DataAttr` 为 null → `strstr` 弃用 | 强制转字符串 |
| `SnSiiProduct.php:99` | `Pdf` 为 null | 强制转字符串 |
| `views/pro/item.php:30` | `PriceNew` 为 null | 强制转字符串 |
| `ProController.php:484` / `CartController.php:115` | 视图变量未定义 | 控制器补 `ErrorList/OrderId/Success` 默认值 |
| `CartController.php:32-36` | 缺键导致 500 | `?? ''` |
| `validators/FileUploadValidator.php` | Yii `finfo_close()` 弃用 | 自实现 MIME 探测 |
| `views/layouts/header.php:19,85` | 导航参数缺失 | 默认值 + 补 `Links` |

## 6. 未做

- 未新增后台登录/管理员下载链路（沿用 Round 37 证据，见 06 文档）。
- 未修改前端 JS。
