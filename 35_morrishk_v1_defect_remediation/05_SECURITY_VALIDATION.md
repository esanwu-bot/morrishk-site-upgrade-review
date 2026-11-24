# 05 安全验证

## 1. CSRF

| 用例 | 请求 | 结果 | 数据库 | 判定 |
|---|---|---|---|---|
| 购物车询价 缺失 Token | `POST /shopping-cart.html`（带会话 cookie，无 `_csrf`） | 400 `Bad Request (#400)` / `Unable to verify your data submission.` | 0 新增 | PASS |
| 购物车询价 无效 Token | `POST`（`_csrf=INVALID_TOKEN_123`） | 400 | 0 新增 | PASS |
| 购物车询价 合法 Token | `POST`（页面 meta token） | 200 成功提示 | 新增 2398/2399 | PASS |
| PDP 快捷询价 | `POST /products/00000001/...html`（无 token → 400；合法 token → 302） | 400 / 302 | 无 / 新增 2400 | PASS |
| 搜索（GET） | `GET /search.html?keyword=STM32` | 200，`noindex,follow` | 无 | PASS（GET 不需要 CSRF；已移除全局关闭，不影响其他 POST） |

实现：

- `controllers/CartController.php` 删除 `public $enableCsrfValidation = false;`，改为 `beforeAction()`：
  仅 `add` / `del` / `clear` / `hot-part`（购物车 AJAX 维护）豁免，`index`（询价提交）强制校验。
- `controllers/SearchController.php` 删除全局关闭（仅 GET 使用）。

## 2. 上传安全

规则（`models/SnSiiCart.php:57-58`）：

```php
[['imageFile'], 'file', 'skipOnEmpty' => true,
 'extensions' => 'xls,xlsx,csv,doc,docx,pdf,txt',
 'maxSize' => 5 * 1024 * 1024, 'checkExtensionByMimeType' => true],
```

| 用例 | 结果 | 判定 |
|---|---|---|
| 合法 `test.txt`（带 token） | 200，落盘 `/uploads/t_20261124102944.txt`，入库 | PASS |
| 非法 `bad.php` | 200，`Only files with these extensions are allowed: xls, xlsx, csv, doc, docx, pdf, txt.`，未落盘、未入库 | PASS |
| 超限 6.00 MiB `big.txt` | 200，`The file "big.txt" is too big. Its size cannot exceed 5.00 MiB.`，未落盘、未入库 | PASS |
| MIME 校验 | `checkExtensionByMimeType=true`（Yii FileValidator 默认行为显式化） | PASS（配置） |
| Web 根目录存储 | 仍为 `web/uploads/`；新增 `.htaccess`：`php_flag engine off`、`Options -ExecCGI -Indexes`、`FilesMatch` 拒绝脚本后缀 | 部分（Apache 生效；Nginx 需等效配置，见 07） |

## 3. 其他

| 项 | 结果 |
|---|---|
| 无附件提交 | 200，`Files=''`（不再 1364 错误） |
| 缺失必填 | 200，模型校验拦截，未入库 |
| 无效产品 | 404（`NotFoundHttpException`） |
| 不存在页面 | 404（不再 500） |
| 调试信息 | 运行副本 `YII_DEBUG=false`，无堆栈外泄 |

## 4. 未覆盖

- 后台 7 个控制器（`Ad/Api/Category/Help/Info/News/Product`）仍 `enableCsrfValidation=false`：**NOT_TESTED / 未修复**（不在本轮 P0 范围，见 07）。
- 上传目录下载鉴权：未实现（仅靠扩展名白名单 + 禁止执行）。

## 5. 结论

P0-4 的询价 CSRF 与上传大小/类型控制 **PASS**；上传存储迁移与后台 CSRF 列为剩余风险。
