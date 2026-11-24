# 03 运行时回归报告（20 项矩阵，最终提交 `af4765f`）

- 环境：PHP 7.4.3 / MySQL 8.0.12 / `http://127.0.0.1:8094`
- 数据库：`morrishk_demo`
- 证据：`runtime\evidence36\final_*`

| # | 用例 | 请求 | HTTP | 关键结果 | 数据库 | 判定 |
|---|---|---|---|---|---|---|
| 1 | 首页 | `GET /` | 200 | 48,133 B；canonical=`https://www.morrishk.net/`；H1=1 | — | PASS |
| 2 | 产品总览 | `GET /products.html` | 200 | 33,337 B | — | PASS |
| 3 | 一级分类 | `GET /big-categories/c-0-32/electronic-components.html` | 200 | 36,011 B；H1=1 | — | PASS |
| 4 | 子分类 | `GET /sub-categories/c-0-3301/integrated-circuits.html` | 200 | 41,167 B；H1=1 | — | PASS |
| 5 | PDP 1 | `GET /products/00000001/M4T28-BR12SH1.html` | 200 | 59,155 B；无第三方脚本 | — | PASS |
| 6 | PDP 2 | `GET /products/00000002/STM32F103C8T6.html` | 200 | 59,152 B | — | PASS |
| 7 | 搜索 | `GET /search.html?keyword=STM32` | 200 | `noindex,follow` | — | PASS |
| 8 | 询价页 | `GET /shopping-cart.html` | 200 | 52,987 B；含 csrf token | — | PASS |
| 9 | 带附件询价 | `POST` + 合法 token + txt | 200 | 成功文案 | 新增 id=2406，`uploads/lL_MeKpsEs5wWnYqffAGuSaV.txt` | PASS |
| 10 | 无附件询价 | `POST` + 合法 token | 200 | 成功文案 | 新增 id=2407，`Files=''` | PASS |
| 11 | PDP 快捷询价（浏览器点击） | 浏览器填写并 Submit | 302→200 | 跳转 `/cart/success.html?Oid=2410`，显示 Thank you | 新增 id=2410，`Files=''`；生成 `.eml` | PASS |
| 12 | 成功页 | `GET /cart/success.html` | 200 | 31,575 B；`noindex,nofollow` | — | PASS |
| 13 | 无效产品 | `GET /products/00000099/NOPE.html` | 404 | Yii 404 | — | PASS |
| 14 | 不存在页面 | `GET /no-such-page.html` | 404 | Yii 404 | — | PASS |
| 15 | robots.txt | `GET /robots.txt` | 200 | 596 B，UA 无重复 | — | PASS |
| 16 | CSRF 缺失 | `POST /shopping-cart.html` | 400 | Unable to verify | 0 新增 | PASS |
| 17 | CSRF 无效 | `POST`（`_csrf=BAD`） | 400 | 同上 | 0 新增 | PASS |
| 18 | CSRF 合法 | `POST`（同会话 token） | 200 | 成功 | 2406/2407 | PASS |
| 19 | 上传超限 | 6 MiB txt | 200 | `cannot exceed 5.00 MiB` | 0 新增 | PASS |
| 20 | 上传非法类型 | PHP 内容伪装 `.txt` | 200 | 服务端 MIME 拒绝 | 0 新增 | PASS |

## 补充验证

| 项 | 结果 |
|---|---|
| sitemap.xml | 200，`application/xml`，9 条 URL，全部正式域名，无 localhost |
| 尾斜杠 301 | `GET /products.html/` → 301 → `/products.html` |
| 受控下载 | 未登录 403；登录 200（16 B）；静态 `/uploads/*` 404；未登记 404；穿越 404 |
| 后台 CSRF | `/ejadmin/news/add.html` 无 token → 400 |

## 日志

`runtime/logs/app.log` 最终窗口内无 500 / ErrorException；仅有预期 404（无效产品/不存在页面）与 400（CSRF 负向用例）。

## 结论

20/20 用例 PASS（按表内判定）；补充项中“他人可下载附件”策略缺口记入 04/08。
