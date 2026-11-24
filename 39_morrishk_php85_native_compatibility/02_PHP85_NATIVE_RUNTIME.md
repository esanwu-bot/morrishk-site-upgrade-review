# 02 PHP 8.5 原生运行

## 1. 启动逻辑

`web/index.php` 由固定 dev 改为环境驱动，**默认生产模式**：

```php
defined('YII_DEBUG') or define('YII_DEBUG', getenv('YII_DEBUG') === '1');
defined('YII_ENV')   or define('YII_ENV', getenv('YII_ENV') ?: 'prod');
```

- 默认：`YII_DEBUG=false`、`YII_ENV=prod` → 不加载 debug/gii，不暴露堆栈。
- 本地调试：`YII_DEBUG=1 YII_ENV=dev`。

测试入口（`D:\dev\tmp\router_r39.php`）只做静态透传与环境变量注入，不含任何错误处理或业务参数覆盖。

## 2. 本轮修复的 PHP 8.5 兼容问题

| 位置 | 现象 | 修复 |
|---|---|---|
| `yiisoft/yii2` 2.0.44 | `ArrayAccess`/`Countable` 返回类型弃用 → 被升级为 `ErrorException`，404/403 变 500 | 升级 2.0.53 |
| `egulias/email-validator` 3.1.2 | `utf8_encode()` 弃用（8.2+） | 升级 3.2.6 |
| `yii\helpers\FileHelper::getMimeType()` | `finfo_close()` 在 8.5 弃用 → 上传 500 | 新增 `app\validators\FileUploadValidator`，用 `finfo_open/file` 替代，`unset()` 释放；扩展名/大小/安全策略不变 |
| `ProController.php:47` | `$tempA['id']` 未定义键 | 改为 `$itemA['id']`（真实缺陷，非仅版本问题） |
| `ProController.php:325` | `strstr(null)` 弃用 | `(string)($ProRow['DataAttr'] ?? '')` |
| `SnSiiProduct.php:99` | `strstr($this->Pdf)` 传 null | 加强制转换 |
| `views/pro/item.php:30` | `strstr($ProRow['PriceNew'])` 传 null | 加强制转换 |
| `views/pro/item.php:165` | `$ErrorList` 未定义 | 控制器 `$res['ErrorList'] ?? []` |
| `views/cart/index.php:41/50` | `$ErrorList`/`$OrderId` 未定义 | 控制器补默认值 |
| `controllers/CartController.php:32-36` | 缺 `UnitPrice` 等键 → 500 | 全部改为 `?? ''` 并转字符串 |
| `views/layouts/header.php:85` | `$BigRow['Links']` 未定义 | 导航构建补 `Links`，视图加 `?? ''` |

## 3. 原生运行验证

| 路由 | 状态 | 大小 |
|---|---|---|
| `/` | 200 | 38032 |
| `/products.html` | 200 | 30577 |
| `/products/39000001/r39-test-part.html` | 200 | 55534 |
| `/big-categories/c-3901-3902/r39-test-big.html` | 200 | 33039 |
| `/shopping-cart.html` | 200 | 50920 |
| `/sitemap.xml` | 200 | 478 |
| `/robots.txt` | 200 | 596 |

- `runtime/logs/app.log` 在原生（prod）模式下**未出现** `ErrorException:8192`（弃用升级为异常）。
- `evidence/route_matrix.txt`、`evidence/php85_deprecation_web.txt`。

## 4. 仍存在的第三方弃用（不影响已测 Web 路径）

CLI/控制台加载时可见（`evidence/codecept_unit.log` 头部）：

| 包 | 弃用内容 |
|---|---|
| `google/apiclient 2.12.1` | 隐式 nullable 参数（PHP 8.4+ 弃用） |
| `guzzlehttp/promises 1.5.1` | 同上 |
| `tightenco/collect 8.78.0` | 同上 |
| `opis/closure 3.6.3` | `unserialize()` 隐式 nullable |

这些类不在已测 Web 请求路径中；若后续启用 Google API/Excel 导出等控制台任务，需要单独升级或修复。未在报告中将它们标记为已解决。

## 5. Codeception 运行说明

Codeception 5.3.1 的终端宽度探测使用反引号运算符（PHP 8.5 弃用），因此运行器需：

```
php -d register_argc_argv=1 -d error_reporting=22527 vendor/bin/codecept run Unit
```

该参数仅作用于**测试运行器自身**（排除 `E_DEPRECATED`），不改变应用运行配置，也不用于掩盖应用弃用；应用弃用已在第 2、4 节逐项登记。
