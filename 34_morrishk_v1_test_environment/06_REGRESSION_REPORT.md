# 06 回归与异常报告（R5）

## 1. 页面回归结果

| 页面 | HTTP | 结论 |
|---|---|---|
| 首页 | 200 | PASS |
| 产品分类总览 `/products.html` | 200 | PASS |
| 一级分类 | 200 | PASS（但 H1=0） |
| 子分类 | 500 | FAIL（`string + int` TypeError，见 §2.1） |
| PDP ×2 | 200 | PASS（JSON-LD 语义缺陷见 03） |
| 搜索 `/search/index.html?keyword=STM32` | 200 | PASS |
| 询价页 | 200 | PASS（提交路径见 04） |
| 成功页 | 200 | PASS |
| robots.txt | 200 | PASS（内容冲突见 03） |
| sitemap.xml | 404 | FAIL（未实现） |

## 2. 异常与根因

### 2.1 子分类 500：`FileCache` 类型错误

```
TypeError: Unsupported operand types: string + int
vendor\yiisoft\yii2\caching\FileCache.php:158
```

`ProController.php:172` 将语言字符串传给 `Query::cache()`（期望 int）。PHP 7.4 隐式转 0；PHP 8 抛错。

判定：**FAIL（代码缺陷）+ 受 PHP 版本放大**。若生产确为 PHP 7.4，页面可返回 200，但传参本身仍属缺陷，需修复。

### 2.2 无附件询价 500：数据库约束

```
SQLSTATE[HY000] General error: 1364 Field 'Files' doesn't have a default value
```

`snsii_cart.Files` 为 `NOT NULL` 且无默认值；`SnSiiCart` 未在无附件时写入空串。PDP 快捷表单没有附件输入，因此该路径必然失败。判定：**FAIL**。

### 2.3 不存在的页面返回 500

```
Error: Attempt to assign property "Content" on null
controllers\PageController.php:59
```

兜底规则 `/<Links> → /page/info` 命中后未判空。判定：**FAIL**（应 404）。

### 2.4 无效产品返回 200 纯文本

`/products/00000099/NOPE.html → 200`，body 为 `error`（`ProController.php:318` 的 `die('error')`）。判定：**FAIL**（应 404 且不应输出裸露字符串）。

### 2.5 `/search.html` 被兜底规则劫持

`/search.html?keyword=...` 实际进入 `PageController`（suffix 剥离后 `search` 命中 `/<Links>`），500。正确入口为 `/search/index.html`。判定：**FAIL（路由歧义）**。

## 3. 错误日志（`runtime\logs\app.log` 摘录）

```
[error][yii\base\ErrorException:2] Array to string conversion in commands\SnSiiController.php:89
[error][TypeError] Unsupported operand types: string + int in vendor\yiisoft\yii2\caching\FileCache.php:158
[error][Error] Attempt to assign property "Content" on null in controllers\PageController.php:59
[error][yii\db\Exception] PDOException: General error: 1364 Field 'Files' doesn't have a default value
[error][yii\web\HttpException:400] BadRequestHttpException: Unable to verify your data submission.
```

## 4. 环境导致的偏差（不计入产品缺陷，但影响判定）

| 项 | 说明 |
|---|---|
| PHP 版本 | 生产 7.4.33；本机 8.0.2。7.3.4 可用但被 `composer/platform_check.php`（要求 ≥ 7.4）拒绝启动 |
| 报错级别 | 副本设置 `error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING & ~E_DEPRECATED)` 以模拟 7.4 严重度；否则 PHP 8 会把大量 Notice 升级为 500 |
| 依赖落地 | `google/apiclient-services` 为元数据占位（2.6 万文件解压超时），被测页面不加载该类 |
| 邮件 | file transport Mock，未连接真实 SMTP |
| 第三方询盘 | 浏览器端 `wm.zokoko.cn` 调用未执行（NOT_TESTED） |

## 5. 状态汇总

| 类别 | PASS | FAIL | BLOCKED | NOT_TESTED |
|---|---|---|---|---|
| R1 可访问性 | 8 | 4 | 0 | 0 |
| R2 SEO HTML | 6（canonical/OG/robots 覆盖） | 5（brand、image、分类 H1、robots 冲突、sitemap） | 1（子分类） | 0 |
| R3 询价 | 3（带附件入库、Mock 邮件、PDP CSRF 拦截） | 2（无附件、PDP 快捷提交） | 0 | 1（浏览器端第三方 API） |
| R4 安全 | 3（PDP CSRF、扩展名白名单、文件名过滤） | 3（购物车 CSRF、无大小限制、Web 根目录存储） | 0 | 1（后台 7 控制器） |
| R5 回归 | 8 | 5 | 0 | 0 |

## 6. 总体判定

- **DEMO_READY：NO**（子分类 500、询价主路径 500、JSON-LD 语义错误）
- **FUNCTION_ACCEPTED：NO**
- **PRODUCTION_READY：NO**
- **RELEASE_APPROVED：NO**

可复现的最小阻断清单：
1. `ProController:172` 传字符串给 `Query::cache()` → 子分类 500；
2. `snsii_cart.Files` NOT NULL 无默认值 + PDP 无附件 → 询价 500；
3. `SnSiiController:85-91` 对嵌套数组做 `str_replace` → JSON-LD `brand="Array"`;
4. `CartController` 关闭 CSRF → 询价可被静默代提交；
5. `PageController:59` 未判空 / `die('error')` → 错误状态码语义。
