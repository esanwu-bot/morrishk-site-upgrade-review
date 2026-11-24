# 06 CSRF 与 URL 收尾验证

## 1. 后台 7 个控制器

代码变更（`git grep enableCsrfValidation -- modules controllers`）：

```
controllers/SitemapController.php:13   （只读 GET，保留关闭）
```

`Ad/Api/Category/Help/Info/News/Product` 的 `enableCsrfValidation=false` 已全部移除。

运行时验证（`af4765f`，登录 `qa_tester`）：

| 用例 | 请求 | 结果 | 判定 |
|---|---|---|---|
| 后台页面可访问 | `GET /ejadmin/news/index.html` | 200，含 `_csrf` | PASS |
| 写操作无 Token | `POST /ejadmin/news/add.html`（无 `_csrf`） | **400** `Unable to verify your data submission.` | PASS |
| 写操作有效 Token | 同上 + 首页取得的合法 token | 通过 CSRF，进入业务（因既存 `@mihaildev/ckeditor` 别名缺失返回 500） | PASS（CSRF 维度） |

注：后台 `news/add` 的 500 与 CSRF 无关，属既有视图/资源别名问题，见 08。

## 2. 购物车 AJAX 与询价

- 删除 `CartController::beforeAction` 的 4 个动作豁免，全部 POST 走 CSRF。
- 全站布局注入 `X-CSRF-Token`（Yii 2.0.44 支持该请求头），覆盖 `cart.min.js` 的 add/del/clear/update 请求。
- 运行时：

| 用例 | 结果 |
|---|---|
| 询价 POST 无 Token | 400 |
| 询价 POST 非法 Token | 400 |
| 询价 POST 合法 Token | 200，入库 2406/2407 |
| PDP POST 无 Token | 400 |
| PDP POST 合法 Token | 302 成功页 |

## 3. 尾斜杠 301

- 生产：`web/.htaccess` 规则 `^(/.+)/$ → /$1 [R=301,L]`
- 测试：`web/router.php` 等价实现
- 实测：`GET /products.html/` → **301**，`Location: /products.html`
- 根路径 `/` 不重定向

## 4. 正式域名

新增 `params['SiteUrl'] = https://www.morrishk.net`（可用 `MORRISHK_SITE_URL` 覆盖），`canonicalUrl()` 与 Sitemap 统一使用。

| 检查 | 实际 |
|---|---|
| 首页 canonical | `https://www.morrishk.net/` |
| PDP canonical | `https://www.morrishk.net/products/00000001/M4T28-BR12SH1.html` |
| sitemap `<loc>` | `https://www.morrishk.net/...` |
| sitemap 中 localhost | 0 处 |
| 301 Location | 相对路径（保留当前正式域名） |

## 5. 遗留

- Nginx 生产环境需要等效配置（301 与 `.html` 重写、`/download` 路由），Apache 规则已提交，Nginx 片段见 08。
- `SitemapController` 保留 `enableCsrfValidation=false`：仅 GET，无状态变更。
