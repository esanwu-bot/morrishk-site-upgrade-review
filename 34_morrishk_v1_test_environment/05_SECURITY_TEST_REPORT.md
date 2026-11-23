# 05 安全测试报告（R4：CSRF 与输入安全）

## 1. CSRF 行为矩阵（实测）

| 入口 | 控制器配置 | 实测请求 | 实测结果 | 期望 | 判定 |
|---|---|---|---|---|---|
| PDP 快捷询价 POST | 默认开启（`ProController` 未关闭） | 无 `_csrf` + 会话 cookie | **400** `Unable to verify your data submission.` | 拒绝 | PASS |
| PDP 快捷询价 POST | 同上 | 合法 `_csrf` + cookie | 通过校验，进入业务逻辑（随后因 DB 约束 500） | 放行 | PASS（CSRF 维度） |
| 购物车/询价页 POST | `CartController::$enableCsrfValidation = false`（第 18 行） | 无 `_csrf`、无 cookie | **200**，入库 1 行（id=2397） | 拒绝 | **FAIL** |
| 搜索 | `SearchController::$enableCsrfValidation = false`（第 29 行） | 仅 GET | — | CSRF 不适用于 GET | PASS（但配置应移除） |
| 后台 7 个控制器 | `Ad/Api/Category/Help/Info/News/Product` 均 `enableCsrfValidation=false` | 本轮未执行 | — | 应开启 | NOT_TESTED |

证据（`git grep -n enableCsrfValidation -- controllers modules`）：

```
controllers/CartController.php:18
controllers/SearchController.php:29
modules/ejadmin/controllers/AdController.php:25
modules/ejadmin/controllers/ApiController.php:25
modules/ejadmin/controllers/CategoryController.php:29
modules/ejadmin/controllers/HelpController.php:30
modules/ejadmin/controllers/InfoController.php:30
modules/ejadmin/controllers/NewsController.php:30
modules/ejadmin/controllers/ProductController.php:30
```

**结论**：购物车询价接口没有 CSRF 防护，外部站点可静默代提交询价（配合第 04 节确认的入库行为）。这是可证实的安全缺陷，**不能记 PASS**。

## 2. 上传文件校验（实测）

规则 `models\SnSiiCart.php:57`：

```php
[['imageFile'], 'file', 'skipOnEmpty' => true,
 'extensions' => 'xls,xlsx,csv,doc,docx,pdf,txt'],
```

| 用例 | 文件 | 结果 | 判定 |
|---|---|---|---|
| 合法扩展名 | `test.txt`（15 B） | 200，保存为 `/uploads/test_20261123173729.txt`，`Files` 入库 | PASS |
| 可执行脚本 | `evil.php`（20 B） | 200，页面返回 `Only files with these extensions are allowed: xls, xlsx, csv, doc, docx, pdf, txt.`，未入库、未落盘 | PASS（扩展名白名单） |
| 大小限制 | — | 规则中**无 `maxSize`** | **FAIL/风险**：任意大文件可上传 |
| 存储位置 | `web/uploads/` | 位于 Web 根目录，可直接访问 | **风险**：靠扩展名白名单兜底，缺少下载鉴权 |
| 文件名处理 | `Str::getLinks(baseName) + 时间戳` | 已过滤并追加时间戳 | PASS |

## 3. 其他输入面观察

| 项 | 结果 |
|---|---|
| 无附件提交 | 500（`Files` NOT NULL 无默认值），异常页暴露“Database Exception (#HY000)” | 
| 缺失必填（Contact/Phone/Email/Country） | 200，模型校验拦截，未入库 | PASS（校验） |
| 非法产品 ID | 200 + `error`（`die('error')`），未返回 404 | 语义 FAIL |
| 不存在页面 | 500（`PageController.php:59` 对 null 赋属性） | FAIL（信息泄露风险低，但状态码错误） |
| 调试信息 | 本副本 `YII_DEBUG=false`，无堆栈外泄；原始工作区默认 `YII_DEBUG=true`，生产前必须确认关闭 | 需确认 |

## 4. 结论

- CSRF：**部分通过**。PDP 端点通过；购物车询价端点失败；后台 7 个控制器未测但配置为关闭。
- 上传：扩展名白名单通过；**无大小上限**、文件落在 Web 根目录，属未关闭风险。
- 本轮不得将安全检查写成 PASS 整体通过。
