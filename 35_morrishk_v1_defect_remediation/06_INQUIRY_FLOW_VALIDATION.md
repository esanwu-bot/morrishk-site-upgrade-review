# 06 询价流程验证

## 1. 三条路径

| 路径 | 请求 | HTTP | 服务端结果 | 数据库 | 判定 |
|---|---|---|---|---|---|
| 询价页 + 附件 | `POST /shopping-cart.html`（合法 CSRF + `t.txt`） | 200 | 页面输出成功文案 | id=2398，`Files=/uploads/t_20261124102944.txt` | PASS |
| 询价页 无附件 | `POST /shopping-cart.html`（合法 CSRF，无文件） | 200 | 成功文案 | id=2399，`Files=''` | PASS |
| PDP 快捷询价 | `POST /products/00000001/M4T28-BR12SH1.html`（合法 CSRF） | 302 | `Location: http://127.0.0.1:8094/cart/success.html?Oid=2400` | id=2400，`Files=''` | PASS |

成功页：`GET /cart/success.html` 与 `GET /cart/success.html?Oid=2400` 均 200。

## 2. 空附件处理

- 数据库未改：`snsii_cart.Files` 仍为 `varchar(200) NOT NULL`。
- 模型 `SnSiiCart::beforeSave()` 统一写入 `trim((string)$this->Files)`，空附件存 `''`。
- 覆盖 `CartController::actionIndex` 与 `ProController::actionItem` 两条入口，无需两处重复判断。

## 3. Mock 邮件

```powershell
curl.exe "http://127.0.0.1:8094/cart/send.html?OrderId=2400"
```

```
HTTP/1.1 200 OK
{"message":"ok"}
```

`runtime\mail\20261124-103023-3547-9605.eml`，7,194 B（`useFileTransport=true`）。
测试前后邮件文件数 1 → 2；未建立 SMTP 连接。

## 4. 第三方接口

| 检查 | 结果 |
|---|---|
| 服务端是否调用 `wm.zokoko.cn` | 否 |
| 本轮是否触发第三方 HTTP | 否（curl 不执行页面 JS） |
| 浏览器端 JS | `views/pro/item.php` 仍直连第三方，本轮未修改、未执行 |

**边界说明**：若用浏览器打开 PDP 点击提交，前端 JS 仍会调用真实第三方接口。本轮 Mock 只覆盖服务端邮件，不覆盖浏览器端第三方询盘。不得据此宣称第三方通道已 Mock 或已验证。

## 5. 结论

询价三条主路径 **PASS**，Mock 邮件 **PASS**；浏览器端第三方通道 **NOT_TESTED**。
