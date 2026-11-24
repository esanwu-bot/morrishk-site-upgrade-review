# 05 询价端到端验证

## 1. 架构

- 浏览器不再调用任何第三方接口：`git grep zokoko` 在 `views/`、`web/js/` 下为 0。
- PDP 表单：`<form id="snsiicart" action="/products/00000001/...html" method="post">`，原生 POST。
- 购物车表单：原生 multipart POST 到 `/shopping-cart.html`。
- 服务端：保存成功后调用 `Yii::$app->inquirySender->send()`。
- 适配器：`app\service\inquiry\MockInquirySender`（`runtime/inquiry/*.log` + file transport `.eml`）。

## 2. 浏览器实际点击提交（最终提交 `af4765f`）

- 页面：`http://127.0.0.1:8094/products/00000002/STM32F103C8T6.html`
- 操作：填写 Company/Contact/Phone/Email/Country/Quantity，点击 Submit（真实浏览器，非 curl）
- 结果：跳转 `http://127.0.0.1:8094/cart/success.html?Oid=2410`，页面显示 `Thank you for your inquiry`

数据库（`snsii_cart`）：

```
id=2410, Company=Test Company Ltd, Contact=John Doe,
Email=test@example.com, Country=China, Files=''
```

Mock 证据：

```
runtime/inquiry/inquiry-20261124.log
{"time":"2026-11-24T10:49:30+08:00","source":"pdp","order_id":2410,...,"parts":["STM32F103C8T6"],"files":""}

runtime/mail/20261124-104930-0847-5554.eml  547 B
```

## 3. curl 复核（同一最终提交）

| 用例 | 结果 |
|---|---|
| 带附件提交（合法 CSRF） | 200，成功文案，id=2406，`Files=uploads/lL_MeKpsEs5wWnYqffAGuSaV.txt` |
| 无附件提交（合法 CSRF） | 200，成功文案，id=2407，`Files=''` |
| PDP 提交无 Token | 400 |
| PDP 提交合法 Token | 302 → `/cart/success.html?Oid=...` |
| `GET /cart/send.html?OrderId=2400` | 200 `{"message":"ok"}`，生成 `.eml` |

## 4. 第三方出网核查

| 检查 | 结果 |
|---|---|
| 源码 `zokoko` 引用 | 0（`views/`、`web/js/` 全量 grep） |
| PDP 渲染 HTML 是否含第三方地址 | 否 |
| 服务端是否发起外部 HTTP | 否（适配器仅本地写文件） |
| 真实 SMTP | 否（`useFileTransport=true`） |

## 5. 判定

- 浏览器端提交 → 本站：PASS
- CSRF 生效：PASS
- 入库：PASS
- Mock 邮件：PASS
- 成功页：PASS
- 无第三方出网：PASS（代码与渲染页面证据）
