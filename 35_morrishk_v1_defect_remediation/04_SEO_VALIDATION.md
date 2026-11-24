# 04 SEO 验证（运行时）

## 1. 汇总

| 页面 | canonical | OG | JSON-LD | robots | H1 | 判定 |
|---|---|---|---|---|---|---|
| 首页 | `http://127.0.0.1:8094/` | website 4 项 | — | 可索引 | 1 | PASS |
| 产品总览 | `.../products.html` | website 4 项 | — | 可索引 | 1 | PASS |
| 一级分类 | `.../big-categories/c-0-32/electronic-components.html` | website 4 项 | — | 可索引 | 1 | PASS（原 0） |
| 子分类 | `.../sub-categories/c-0-3301/integrated-circuits.html` | website 4 项 | — | 可索引 | 1 | PASS（原页面 500） |
| PDP 1 | `.../products/00000001/M4T28-BR12SH1.html` | product 4 项 | 合法 | 可索引 | 1 | PASS |
| PDP 2 | `.../products/00000002/STM32F103C8T6.html` | product 4 项 | 合法 | 可索引 | 1 | PASS |
| 搜索 | —（noindex） | — | — | `noindex,follow` | 0 | PASS |
| 询价 | —（noindex） | — | — | `noindex,follow` | 0 | PASS |
| 成功页 | —（noindex） | — | — | `noindex,nofollow` | 0 | PASS |

## 2. PDP JSON-LD 实际输出

产品 1（绝对 image）：

```json
{"@context":"https://schema.org","@type":"Product","name":"M4T28-BR12SH1","sku":"M4T28-BR12SH1","mpn":"M4T28-BR12SH1","description":"SNAPHAT BATT/CRYSTAL FOR SOIC","url":"http://127.0.0.1:8094/products/00000001/M4T28-BR12SH1.html","brand":{"@type":"Brand","name":"STMicroelectronics"},"image":"https://cdn.example.invalid/img/M4T28-BR12SH1.jpg"}
```

产品 2（库中为相对路径 `/uploads/STM32F103C8T6.jpg`，运行时补全）：

```json
"image":"http://127.0.0.1:8094/uploads/STM32F103C8T6.jpg"
```

- `brand` 为对象，不再是 `"Array"`；
- `image` 均为绝对 URL；
- 无 `offers`（维持既定设计，未虚构价格/库存）；
- 无 Brand 数据时的省略策略：`brand` 字段整体不输出（代码条件 `$MName !== null && $MName !== ''`）；无 Image 时不输出 `image`。

## 3. sitemap.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>http://127.0.0.1:8094/</loc></url>
  <url><loc>http://127.0.0.1:8094/products.html</loc></url>
  <url><loc>http://127.0.0.1:8094/big-categories/c-0-32/electronic-components.html</loc></url>
  <url><loc>http://127.0.0.1:8094/big-categories/c-0-33/semiconductor-solutions.html</loc></url>
  <url><loc>http://127.0.0.1:8094/sub-categories/c-0-3301/integrated-circuits.html</loc></url>
  <url><loc>http://127.0.0.1:8094/sub-categories/c-0-3302/passive-components.html</loc></url>
  <url><loc>http://127.0.0.1:8094/sub-categories/c-0-3303/connectors-switches.html</loc></url>
  <url><loc>http://127.0.0.1:8094/products/00000001/M4T28-BR12SH1.html</loc></url>
  <url><loc>http://127.0.0.1:8094/products/00000002/STM32F103C8T6.html</loc></url>
</urlset>
```

- 响应：200，`application/xml; charset=UTF-8`，859 B；
- 9 条 URL 逐条请求均 200；
- 未输出 `lastmod/priority`（本期不要求）。

## 4. robots.txt（运行时原文）

```
User-agent: *
Allow: /

User-agent: BUbiNG
Disallow: /
...
User-agent: GPTBot
Disallow: /

User-agent: Amazonbot
Disallow: /

User-agent: DataForSeoBot
Disallow: /

User-agent: facebookexternalhit
Crawl-delay: 10
```

- UA 分组无重复（脚本统计 `Group-Object Count>1` 为空）；
- 无 `Disallow` 与 `Crawl-delay` 冲突；
- `facebookexternalhit` 保留访问（社交预览需要）。

## 5. canonical 归一化

| 用例 | 结果 |
|---|---|
| 大写主机 `http://LOCALHOST:8094/` | canonical `http://localhost:8094/`（主机已小写） |
| 尾斜杠 `GET /products.html/` | 404（UrlRule 后缀严格匹配，见 07-风险） |
| `index.php` 片段 | `canonicalUrl()` 会移除 `/index.php` |

归一化实现：`commands/SnSiiController.php:83-94`，首页/产品总览/一级分类/子分类/PDP 共 5 处调用。

## 6. 结论

SEO 运行时验收 **PASS**（除尾斜杠 URL 策略见 07）。OG 与 noindex 行为未被破坏。
