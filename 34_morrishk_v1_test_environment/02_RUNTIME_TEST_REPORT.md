# 02 运行时测试报告（R1：HTTP 与页面可访问性）

- 测试对象：`E:\workspace\独立站\morrishk-site-runtime-wt-session-a`
- HEAD：`d80491b`
- 服务器：`php -S 127.0.0.1:8093 -t web web/router.php`（PHP 8.0.2）
- 证据文件：`runtime\evidence\{name}.headers.txt` / `{name}.body`
- 路由前缀说明：站点 `urlManager.suffix='.html'`，除首页外所有路由必须带 `.html`

## 1. 结果总表

| 编号 | 页面 | URL | HTTP | 字节 | 判定 |
|---|---|---|---|---|---|
| R1-01 | 首页 | `/` | 200 | 47,881 | PASS |
| R1-02 | 产品分类总览 | `/products.html` | 200 | 33,083 | PASS |
| R1-03 | 一级分类 | `/big-categories/c-0-32/electronic-components.html` | 200 | 35,707 | PASS |
| R1-04 | 子分类 | `/sub-categories/c-0-3301/integrated-circuits.html` | 500 | 33,424 | **FAIL**（PHP 8 类型错误，见 06） |
| R1-05 | PDP（产品 1） | `/products/00000001/M4T28-BR12SH1.html` | 200 | 64,251 | PASS |
| R1-06 | PDP（产品 2） | `/products/00000002/STM32F103C8T6.html` | 200 | 64,231 | PASS |
| R1-07 | 搜索 | `/search/index.html?keyword=STM32` | 200 | 34,212 | PASS |
| R1-08 | 询价页 | `/shopping-cart.html` | 200 | 58,175 | PASS |
| R1-09 | 成功页 | `/cart/success.html` | 200 | 31,327 | PASS |
| R1-10 | robots.txt | `/robots.txt` | 200 | 583 | PASS（内容缺陷见 03） |
| R1-11 | sitemap.xml | `/sitemap.xml` | 404 | 30,467 | **FAIL**（未实现） |
| R1-12 | 无效产品 | `/products/00000099/NOPE.html` | 200 | 8 | **FAIL**（应 404，实际 200 且 body=`error`） |
| R1-13 | 不存在的页面 | `/this-page-does-not-exist.html` | 500 | 31,902 | **FAIL**（应为 404） |

补充：`/search.html?keyword=...` 会命中 `/＜Links＞ → /page/info` 兜底规则，进入 `PageController` 后 500（`Attempt to assign property "Content" on null`），必须使用 `/search/index.html`。

## 2. 关键响应头（原文）

首页：

```
HTTP/1.1 200 OK
Host: 127.0.0.1:8093
X-Powered-By: PHP/8.0.2
Content-Type: text/html; charset=UTF-8
Set-Cookie: _csrf=...; path=/; HttpOnly; SameSite=Lax
```

成功页：

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Set-Cookie: _csrf=...; path=/; HttpOnly; SameSite=Lax
```

robots.txt：

```
HTTP/1.1 200 OK
Content-Type: text/plain; charset=UTF-8
```

## 3. 子分类 500 根因（R1-04）

```
TypeError: Unsupported operand types: string + int
in vendor\yiisoft\yii2\caching\FileCache.php:158
```

触发链：`ProController::actionSub()` 第 172 行

```php
SnSiiProductCategory::find()->...->cache($Lang)->one();   // $Lang 为字符串 'en'
```

`Query::cache()` 期望 `int|true`；PHP 7.4 会把 `'en'` 隐式转 0 继续执行，PHP 8 直接抛 TypeError，进而 `FileCache::setValue()` 的 `$duration + time()` 失败。属代码缺陷 + 运行时版本差异，**不能记 PASS**。

## 4. 复现命令

```powershell
$ev='E:\workspace\独立站\morrishk-site-runtime-wt-session-a\runtime\evidence'
curl.exe -sS -D "$ev\home.headers.txt" -o "$ev\home.body" -w "%{http_code}|%{size_download}" http://127.0.0.1:8093/
curl.exe -sS -D "$ev\category_sub.headers.txt" -o "$ev\category_sub.body" -w "%{http_code}|%{size_download}" `
  http://127.0.0.1:8093/sub-categories/c-0-3301/integrated-circuits.html
```

## 5. 结论

- 可访问性：11 项中 8 项 PASS，2 项 FAIL（子分类、sitemap），2 项语义 FAIL（无效产品、不存在页面）。
- 页面均返回真实应用 HTML（非占位/静态文件）。
- 子分类与 sitemap 未通过，故本轮 **不能** 宣称 DEMO_READY。
