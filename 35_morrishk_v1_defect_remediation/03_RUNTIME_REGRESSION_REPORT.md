# 03 运行时回归报告（20 项矩阵）

- 运行副本 HEAD：`d740112`
- PHP 7.4.3 / MySQL 8.0.12 / `http://127.0.0.1:8094`
- 数据库基线：`snsii_cart` 起始 1 行（上一轮遗留 id=2397）
- 证据：`runtime\evidence74\`

## 1. 矩阵结果

| # | 用例 | 请求 | HTTP | 关键内容 | 数据库影响 | 判定 |
|---|---|---|---|---|---|---|
| 1 | 首页 | `GET /` | 200 | 47,872 B；canonical `http://127.0.0.1:8094/`；H1=1 | 无 | PASS |
| 2 | 产品分类总览 | `GET /products.html` | 200 | 33,076 B；canonical 自身；H1=1 | 无 | PASS |
| 3 | 一级分类 | `GET /big-categories/c-0-32/electronic-components.html` | 200 | 35,750 B；H1=1 | 无 | PASS |
| 4 | 子分类 | `GET /sub-categories/c-0-3301/integrated-circuits.html` | 200 | 40,907 B；`<h1>Integrated Circuits</h1>`；标题含「2 items Product」 | 无 | PASS（原 500 已修复） |
| 5 | PDP 1 | `GET /products/00000001/M4T28-BR12SH1.html` | 200 | 64,278 B；JSON-LD 合法 | 无 | PASS |
| 6 | PDP 2 | `GET /products/00000002/STM32F103C8T6.html` | 200 | 64,277 B；JSON-LD image 已绝对化 | 无 | PASS |
| 7 | 搜索 | `GET /search/index.html?keyword=STM32`；`GET /search.html?keyword=STM32` | 200 / 200 | 均 `noindex,follow`；标题 `Search results for "STM32"` | 无 | PASS（兜底劫持已修复） |
| 8 | 询价页 | `GET /shopping-cart.html` | 200 | 58,260 B；含 csrf meta | 无 | PASS |
| 9 | 带附件询价 | `POST /shopping-cart.html`（合法 token + txt） | 200 | 成功提示「Thank you for your inquiry…」 | 新增 id=2398，`Files=/uploads/t_20261124102944.txt` | PASS |
| 10 | 无附件询价 | `POST /shopping-cart.html`（合法 token，无文件） | 200 | 成功提示 | 新增 id=2399，`Files=''` | PASS（原 500 已修复） |
| 11 | PDP 快捷询价 | `POST /products/00000001/...html`（合法 token） | 302 | `Location: /cart/success.html?Oid=2400` | 新增 id=2400，`Files=''` | PASS（原 500 已修复） |
| 12 | 成功页 | `GET /cart/success.html`；`GET /cart/success.html?Oid=2400` | 200 / 200 | 成功文案；`noindex,nofollow` | 无 | PASS |
| 13 | 无效产品 | `GET /products/00000099/NOPE.html` | **404** | Yii 404 页 | 无 | PASS（原 200+`error`） |
| 14 | 不存在页面 | `GET /this-page-does-not-exist.html` | **404** | Yii 404 页 | 无 | PASS（原 500） |
| 15 | robots.txt | `GET /robots.txt` | 200 | 596 B，`text/plain`；UA 无重复 | 无 | PASS |
| 16 | CSRF 缺失 | `POST /shopping-cart.html`（无 `_csrf`） | **400** | `Bad Request (#400)` / `Unable to verify your data submission.` | 0 新增 | PASS（原 200 入库） |
| 17 | CSRF 无效 | `POST`（`_csrf=INVALID_TOKEN_123`） | **400** | 同上 | 0 新增 | PASS |
| 18 | CSRF 合法 | `POST`（页面 token） | 200 | 成功提示 | 新增 2398/2399 | PASS |
| 19 | 上传超限 | `POST` + 6.00 MiB `big.txt` | 200 | `The file "big.txt" is too big. Its size cannot exceed 5.00 MiB.` | 0 新增 | PASS（原无上限） |
| 20 | 上传非法类型 | `POST` + `bad.php` | 200 | `Only files with these extensions are allowed: xls, xlsx, csv, doc, docx, pdf, txt.` | 0 新增，无落盘 | PASS |

补充：`GET /sitemap.xml` → 200，`application/xml`，9 条 URL；逐条请求均返回 200（见 04）。

## 2. 日志

`runtime\logs\app.log` 在 2026-11-24 测试窗口内**无 500 / ErrorException**，仅有以下预期记录：

```
[error][yii\web\HttpException:404] NotFoundHttpException: Page not found.   (无效产品/不存在页面)
[error][yii\web\HttpException:400] BadRequestHttpException: Unable to verify your data submission.  (CSRF 负向用例)
```

## 3. 结论

- 20/20 用例达到预期（PASS）。
- P0-1、P0-2、P0-3、P0-4、P0-5 的运行时表现均已改变，且与修复说明一致。
- 本轮只代表 PHP 7.4.3 + 本地测试库结果；不构成本轮之外的验收结论。
