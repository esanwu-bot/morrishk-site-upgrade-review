# 分类页与产品详情页（PDP）

| 项目 | 内容 |
|---|---|
| 文档编号 | 33-04 |
| 版本 | V1.0 |
| 本轮提交 | `d80491b` |
| 状态 | 代码完成；运行/模板视觉检查 BLOCKED |

## 1. 分类页

| 项 | 现状 |
|---|---|
| 控制器 | `ProController::actionList`（大类）、`actionSub`（小类） |
| 视图 | `views/pro/index.php`、`list.php`、`sub.php` |
| 数据 | 分类名、产品列表、分页、图片、数量 |
| 本轮新增 | canonical（当前 URL 去 query）、Open Graph website |
| 未做 | 分类简介字段、模板视觉重排、分页 canonical 规则 |

> 分页 canonical 目前为“当前页自指”，未做 page=1 归一；需 SEO 决策后统一。

## 2. PDP

| 项 | 现状 |
|---|---|
| 控制器 | `ProController::actionItem` |
| 视图 | `views/pro/item.php` |
| 可信字段 | MPN、品牌、描述、参数（`DataAttr`）、图片、分类 |
| 本轮新增 | canonical、Open Graph product、Product JSON-LD |
| JSON-LD 字段 | `name`、`sku`、`mpn`、`brand`、`description`、`url`；有图时加 `image` |
| 未输出 | `offers`/价格/库存/评分（无真实数据，不虚构） |

## 3. 数据纪律

- 不新增/修改产品主键、数据库结构或生产数据。
- 空字段不伪装为真实数据。
- Ds Bit 参数/证据区域未接入；如后续使用 Mock，必须显式标注。
- 未依赖 Session B 未冻结 API。

## 4. 验收待补

| 项 | 证据 | 状态 |
|---|---|---|
| 分类页 200 + 产品列表 | HTTP + 截图 | BLOCKED |
| PDP 200 + 参数 | HTTP + 截图 | BLOCKED |
| canonical 正确 | HTML 断言 | 代码已加；运行未验 |
| JSON-LD 有效 | Rich Results/JSON 解析 | 代码已加；运行未验 |
| 图片/字段缺失处理 | 人工检查 | BLOCKED |
