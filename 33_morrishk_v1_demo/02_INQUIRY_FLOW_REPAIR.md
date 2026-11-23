# 询盘链路分析与修复

| 项目 | 内容 |
|---|---|
| 文档编号 | 33-02 |
| 版本 | V1.0 |
| 结论 | 成功路由已修复；完整询盘链路 **未通过功能验收**；第三方/Mock 部分 BLOCKED |

## 1. 现状链路（代码事实）

```text
PDP / 询价页
  → 前端 JS 拦截提交
  → POST https://wm.zokoko.cn/api/sendEmail
       from_address: 106212887@QQ.COM（硬编码）
       to: sales@morrishk.net
  → 前端显示成功/失败
```

后端另有两处：

- `ProController::actionItem()`：表单 POST 到本页，`SnSiiCart->validate() && save()` 成功后重定向 `/cart/success?Oid=...`（原本正确）。
- `CartController::actionSend()`：保存成功后原本重定向 `/order/success`（无控制器），本轮改为 `/cart/success`。
- `CartController::actionSuccess()`：渲染 `views/cart/success.php`。

## 2. 本轮修复（提交 `0891ce6`）

```diff
- return $this->redirect(['/order/success', 'id' => $model->id]);
+ return $this->redirect(['/cart/success']);
```

同时 `CartController::actionSuccess()` 输出 `noindex,nofollow`（`25afffb`）。

**效果**：后端起点的成功跳转与 `actionSuccess` 对齐。但前端 JS 仍走第三方 API，不经过 `actionSend`，所以这不是完整链路修复。

## 3. 字段与服务端校验

`models/SnSiiCart.php` 现有规则：

- 必填：`GoodsList`、`Contact`、`Phone`、`Email`、`Country`。
- 长度：`Company/Contact/Email/Country` ≤50，`Phone/Fax/IP` ≤20，`Address/Files` ≤200。
- 文件：xls/xlsx/csv/doc/docx/pdf/txt。
- 缺少：`Email` 的 `email` 格式校验、`Content` 长度上限、数量/目标价数值校验、IP/频率限制。
- 因前端 JS 直接调用第三方，模型校验在实际演示路径上未必执行。

## 4. CSRF 与安全

- `CartController`、`SearchController` 设置 `public $enableCsrfValidation = false`。
- 不能为单个表单随意改全站安全策略；建议：
  1. 仅对 `cart/send` 与 `cart/index` 开启 CSRF，并在表单中加入 `csrf-token`；
  2. 前端 AJAX 读取 `meta[name=csrf-token]` 携带 header；
  3. 若第三方 API 必须直连，至少加同源校验、速率限制、蜜罐字段。
- 当前未实施 CSRF 改造，避免在未验证环境破坏现有表单。

## 5. 第三方接口与 Mock

- `wm.zokoko.cn` 归属、SLA、数据处理条款未确认。
- 未授权前**未调用**该接口，也未发送测试邮件。
- 建议 Mock Adapter：

```php
interface InquirySenderInterface {
    public function send(array $payload): array; // ['ok'=>bool,'mock'=>bool,'error'=>?string]
}
```

- 开发环境默认 `MockInquirySender`，日志只记录 `mock=true` 与请求 ID，不记录完整表单/隐私。
- 生产 Adapter 需客户书面确认后接入；不得把 Mock 结果展示为真实发送成功。

## 6. 测试状态

| 用例 | 状态 |
|---|---|
| 正常提交（后端） | BLOCKED（无运行环境） |
| 缺失必填 | BLOCKED |
| 非法邮箱/长度 | BLOCKED |
| 重复提交 | NOT IMPLEMENTED |
| 第三方失败/超时 | BLOCKED（未授权调用） |
| 未授权访问成功页 | BLOCKED |
| 错误路由 `/order/success` | 代码已消除；运行验证 BLOCKED |
| CSRF | 未实施 |

> 不得把“路由代码已改”写成“询盘链路已通过”。
