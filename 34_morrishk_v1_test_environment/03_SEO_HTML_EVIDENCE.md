# 03 SEO 实际 HTML 证据（R2）

测试域名：`http://127.0.0.1:8093`（canonical/og:url 中出现 localhost 属测试环境预期）

## 1. 汇总

| 页面 | canonical | OG | JSON-LD | robots | H1 数 | 判定 |
|---|---|---|---|---|---|---|
| 首页 | `http://127.0.0.1:8093/` | website 全 4 项 | 无 | 未输出（可索引） | 1 | PASS |
| 产品分类总览 | `/products.html` | website 全 4 项 | 无 | 未输出 | 1 | PASS |
| 一级分类 | `/big-categories/c-0-32/electronic-components.html` | website 全 4 项 | 无 | 未输出 | **0** | FAIL（缺 H1） |
| 子分类 | —（页面 500） | — | — | — | — | BLOCKED（见 02/R1-04） |
| PDP 产品 1 | `/products/00000001/M4T28-BR12SH1.html` | product 全 4 项 | 可解析，但 `brand` 被破坏 | 未输出 | 1 | **FAIL**（JSON-LD 语义错误） |
| PDP 产品 2 | `/products/00000002/STM32F103C8T6.html` | product 全 4 项 | 可解析，`image` 非绝对 URL | 未输出 | 1 | **FAIL**（image 相对路径） |
| 搜索 | 无（合理） | 无 | 无 | `noindex,follow` | 0 | PASS（robots） |
| 询价 | 无（合理） | 无 | 无 | `noindex,follow` | 0 | PASS（robots） |
| 成功页 | 无（合理） | 无 | 无 | `noindex,nofollow` | 0 | PASS（robots） |

## 2. 原文片段

### 2.1 首页（`evidence\home.body`）

```html
<meta property="og:type" content="website">
<meta property="og:title" content="Electronic parts store, electronic components distributor, electronic components store, electronic supply store">
<meta property="og:description" content="Committed to provide a reliable and trusted IC solutions to help our customers overcoming the IC shortages in 2022.">
<meta property="og:url" content="http://127.0.0.1:8093/">
<link href="http://127.0.0.1:8093/" rel="canonical">
...
<h1 class="text-light display-4 from-bottom delay-1">a reliable and trusted</h1>
```

首页 H1 数 = 1，PASS。

### 2.2 一级分类（`evidence\category_list.body`）

```html
<link href="http://127.0.0.1:8093/big-categories/c-0-32/electronic-components.html" rel="canonical">
<meta property="og:type" content="website">
<meta property="og:title" content="Electronic Components | Electronic parts store 127.0.0.1">
<meta property="og:url" content="http://127.0.0.1:8093/big-categories/c-0-32/electronic-components.html">
```

`<h1>` 计数 = **0** → 分类页缺少 H1（视图 `views/pro/list.php` 无 H1）。

### 2.3 PDP 产品 1（`evidence\pdp_1.body`）

```json
{"@context":"https://schema.org","@type":"Product","name":"M4T28-BR12SH1","sku":"M4T28-BR12SH1","mpn":"M4T28-BR12SH1","brand":"Array","description":"SNAPHAT BATT/CRYSTAL FOR SOIC","url":"http://127.0.0.1:8093/products/00000001/M4T28-BR12SH1.html","image":"https://cdn.example.invalid/img/M4T28-BR12SH1.jpg"}
```

canonical：`http://127.0.0.1:8093/products/00000001/M4T28-BR12SH1.html`
OG：`og:type=product`、`og:title=M4T28-BR12SH1 STMicroelectronics`、`og:url` 同上
JSON：可被 `ConvertFrom-Json` 解析；`image` 为绝对 URL。

**关键缺陷**：`brand` 期望为对象 `{"@type":"Brand","name":"STMicroelectronics"}`，实际输出字符串 `"Array"`。

根因：`commands\SnSiiController.php:85-91`

```php
foreach ($res as $key => $item) {
    foreach ($arr as $search => $value) {
        $res[$key] = str_replace($search, $value, $res[$key]);   // $res['jsonLd'] 是嵌套数组
    }
}
```

`str_replace` 对嵌套数组元素做字符串转换，`brand` 子数组被压成 `"Array"`，同时触发 `Array to string conversion` 错误（`runtime\logs\app.log` 有记录）。**代码级自检无法发现，只有运行时才能暴露。**

### 2.4 PDP 产品 2（`evidence\pdp_2.body`）

```json
"brand":"Array"
"image":"/uploads/STM32F103C8T6.jpg"
```

`image` 为相对路径，不满足 Schema.org 对绝对 URL 的要求（测试数据刻意保留了该形态）。

### 2.5 noindex 页面

```html
<!-- 搜索 -->
<meta name="robots" content="noindex,follow">
<!-- 询价 -->
<meta name="robots" content="noindex,follow">
<!-- 成功页 -->
<meta name="robots" content="noindex,nofollow">
```

### 2.6 robots.txt 实际响应（583 字节）

```
User-agent: *
Allow: /
User-agent: BUbiNG
Disallow: /
...
User-agent: GPTBot
Disallow: /
User-agent: Amazonbot
Crawl-delay:10
User-agent: facebookexternalhit
Crawl-delay:10
User-agent: Amazonbot
Disallow: /

User-agent: DataForSeoBot
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: facebookexternalhit
Disallow: /
```

问题（FAIL）：
- `GPTBot`、`Amazonbot`、`facebookexternalhit` 各出现两个 UA 分组；
- `Amazonbot` 同时有 `Crawl-delay:10` 与 `Disallow: /`；`facebookexternalhit` 同样冲突；
- 按 RFC 9309，重复分组语义不明确，爬虫行为不可预期。

### 2.7 sitemap.xml

`GET /sitemap.xml → 404`（未实现）。与既有审计结论一致。

## 3. 结论

- canonical / OG / noindex 的「有无」已按提交声明生效（4 类可索引页 + 3 类 noindex 页）。
- 但 **PDP JSON-LD 语义失败**（brand="Array"）、**PDP image 相对路径**、**分类页无 H1**、**robots.txt 冲突规则**、**sitemap 404** 均未通过。
- 本轮 SEO 运行时验收：**不通过**。
