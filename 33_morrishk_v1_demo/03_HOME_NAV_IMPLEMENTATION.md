# 首页与全局导航

| 项目 | 内容 |
|---|---|
| 文档编号 | 33-03 |
| 版本 | V1.0 |
| 本轮提交 | `0891ce6`（H1）、`d80491b`（canonical/OG） |
| 状态 | 代码完成；运行/截图/移动端检查 BLOCKED |

## 1. 页面结构

| 区域 | 文件 | 现状 |
|---|---|---|
| Header/导航 | `views/layouts/header.php` | 顶部栏目、搜索、RFQ、语言入口 |
| 首页轮播 | `views/site/index.php` | 3 张 banner，原 3 个 H1 |
| 分类入口 | `views/site/index.php` + `SiteController` | 大类/小类/热门产品 |
| 新闻/品牌 | `views/site/index.php` | 新闻列表、品牌 logo |
| Footer | `views/layouts/footer.php` | 80 语言链接（带 hreflang 属性） |
| 悬浮联系 | `views/layouts/main.php` | WhatsApp 按钮 |

## 2. 本轮变更

- 轮播第 2、3 张的 `<h1>` 改为 `<h2>`，保留第 1 张为唯一 H1；class 不变，视觉样式不变。
- 首页增加 canonical（`hostInfo + /`）与 Open Graph（website/title/description/url）。

## 3. 未做

- 未重塑品牌、未删除语言入口、未改导航 URL。
- 未做移动端截图/断点检查（无运行环境）。
- 未做链接全量检查（需抓取运行站点）。

## 4. 验收待补

| 项 | 证据 | 状态 |
|---|---|---|
| 首页可访问 | HTTP 200 + 截图 | BLOCKED |
| 唯一 H1 | HTML 计数 = 1 | 代码层可保证；运行未验 |
| 导航链接 | 链接检查报告 | BLOCKED |
| 移动端 | 375/390/414 截图 | BLOCKED |
| canonical/OG | HTML head 断言 | 代码已加；运行未验 |
