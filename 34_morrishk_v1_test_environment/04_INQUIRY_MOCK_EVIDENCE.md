# 04 询价流程与 Mock 证据（R3）

## 1. Mock 设计

- 服务端邮件组件 `Yii::$app->mailer` 改为 `useFileTransport = true`，`fileTransportPath = @runtime/mail`。
- 任何 `->send()` 只把邮件写成 `.eml` 文件，**不建立 SMTP 连接**（`MORRISHK_SMTP_HOST=127.0.0.1` 仅为占位，未被使用）。
- 测试副本 `config/web.php` 为该改动唯一位置（未提交、未回写原工作区）。
- 未实现新的 `InquirySenderInterface` 适配器——基线代码本身在服务端没有第三方询盘调用，Mock 覆盖的是唯一的服务端发送点（SwiftMailer）。

## 2. 表单 → 服务端处理 → 入库（成功路径）

命令（multipart，未携带 CSRF token）：

```powershell
curl.exe -sS -D r3_valid_post.headers.txt -o r3_valid_post.body -w "%{http_code}|%{size_download}" `
  -F "SnSiiCart[Company]=ACME Test Co" -F "SnSiiCart[Contact]=Test User" `
  -F "SnSiiCart[Phone]=1234567890" -F "SnSiiCart[Email]=test@example.invalid" `
  -F "SnSiiCart[Country]=US" -F "SnSiiCart[Address]=Test Address" `
  -F "SnSiiCart[Content]=API runtime test" `
  -F "PartNumber[0]=M4T28-BR12SH1" -F "Manufacturer[0]=STMicroelectronics" `
  -F "Description[0]=SNAPHAT" -F "Quantity[0]=10" -F "UnitPrice[0]=1.00" `
  -F "SnSiiCart[imageFile]=@$env:TEMP\test.txt" `
  http://127.0.0.1:8093/shopping-cart.html
```

结果：

| 项 | 值 |
|---|---|
| HTTP | 200（58,714 B） |
| 页面成功提示 | `Thank you for your inquiry, Our sales will receive your request, We will contact you within 24 hours.` |
| 数据库 | `snsii_cart` 新增 1 行 |
| 行内容 | `id=2397, Company=ACME Test Co, Email=test@example.invalid, Files=/uploads/test_20261123173729.txt` |
| 上传落盘 | `web/uploads/test_20261123173729.txt` |

判定：**PASS**（入库 + 附件落地 + 成功提示）。

## 3. 服务端邮件（Mock Adapter 调用）

```powershell
curl.exe -sS "http://127.0.0.1:8093/cart/send.html?OrderId=2397"
```

结果：

```
HTTP/1.1 200 OK
{"message":"ok"}
```

`runtime\mail\20261123-173752-0296-6165.eml`，7,342 B，发件人 `no-reply@example.invalid`，收件人来自 `params['adminEmail']`（`sales@morrishk.net`）。

判定：**PASS**（Mock 邮件被实际调用并落盘，无 SMTP 出网）。

## 4. PDP 快捷询价（`ProController::actionItem` POST）

PDP 页面头部包含 CSRF meta：

```html
<meta name="csrf-param" content="_csrf">
<meta name="csrf-token" content="e0Yh7hhsC4y_KQ-...">
```

| 用例 | 请求 | 结果 | 判定 |
|---|---|---|---|
| 无 token | POST `/products/00000001/M4T28-BR12SH1.html`（无 `_csrf`） | **400**，`Unable to verify your data submission.` | PASS（CSRF 拦截） |
| 有 token | 同上 + 合法 `_csrf` + 会话 cookie | **500**，`SQLSTATE[HY000] General error: 1364 Field 'Files' doesn't have a default value` | **FAIL**（跳转未发生） |
| 购物车页无附件 | POST `/shopping-cart.html`（合法字段、无文件） | **500**，同上 DB 错误 | **FAIL** |

数据库约束（`SHOW CREATE TABLE morrishk_demo.snsii_cart`）：

```sql
`Files` varchar(200) NOT NULL COMMENT '附件',
```

`Files` 既无默认值，代码也未在无附件时写入空串，因此**所有不带附件的询价都会 500**。PDP 快捷表单没有文件输入，必然命中该缺陷；`/cart/success` 跳转在本轮未取得成功样本。

## 5. 第三方调用核查

| 检查 | 结果 |
|---|---|
| 服务端代码是否调用 `wm.zokoko.cn` | 否。`git grep zokoko` 仅命中前端视图 JS |
| 测试是否触发第三方 HTTP | 否（curl 不执行 JS；服务端无出站） |
| 浏览器端 JS 现状 | `views/pro/item.php` 仍直连 `https://wm.zokoko.cn/api/sendEmail`，本轮未修改、未执行 |
| 真实邮件 | 未发送（file transport） |

**必须明示**：若用浏览器打开 PDP 并点击提交，页面 JS 会真实调用第三方询盘接口。本轮未执行页面 JS，因此该通道既未验证也未被 Mock；不得把本报告理解为“第三方询盘已被 Mock”。

## 6. 结论

- 购物车页询价（带附件）：PASS，端到端入库并生成 Mock 邮件。
- 无附件询价 / PDP 快捷询价：FAIL（DB 约束）。
- CSRF：PDP 端点 PASS，购物车端点 FAIL（见 05）。
- 询盘 Mock：PASS（仅服务端邮件）；浏览器端第三方接口：NOT_TESTED。
