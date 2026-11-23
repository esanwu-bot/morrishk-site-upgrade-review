# 代码级复核材料：25afffb

| 项目 | 内容 |
|---|---|
| 文档编号 | 32-08 |
| 版本 | V1.0 |
| 目标提交 | `25afffbeba37a31e4f13932e5daf9434bdc6fcfd` |
| 仓库 | `https://codeup.aliyun.com/5f0af04d5fd102f22f6b747c/morrishk-site.git` |
| 分支 | `feat/morrishk-website-implementation` |
| 基线 | `cdb9c044dd2f2fc86967dc6738341b11bbeba7f5` |
| 用途 | 供 Reviewer 做代码级复核；不构成功能测试或生产验收 |

---

## 1. 完整提交元数据

```text
commit 25afffbeba37a31e4f13932e5daf9434bdc6fcfd
Author:     esan <esan.wu@gmail.com>
AuthorDate: Mon Nov 23 14:46:15 2026 +0800
Commit:     esan <esan.wu@gmail.com>
CommitDate: Mon Nov 23 14:46:15 2026 +0800

    feat(seo): add robots meta support and noindex inquiry/search pages

 commands/SnSiiController.php     |  2 ++
 controllers/CartController.php   | 10 ++++++++--
 controllers/SearchController.php |  1 +
 web/robots.txt                   |  2 +-
 4 files changed, 12 insertions(+), 3 deletions(-)
```

---

## 2. 完整 patch

```diff
diff --git a/commands/SnSiiController.php b/commands/SnSiiController.php
index cc68ac2..07a199f 100644
--- a/commands/SnSiiController.php
+++ b/commands/SnSiiController.php
@@ -95,6 +95,8 @@ class SnSiiController extends Controller
             Yii::$app->View->registerMetaTag(['name' => 'keywords', 'content' => $res['keywords']], 'meta-keywords');
         if (isset($res['description']))
             Yii::$app->View->registerMetaTag(['name' => 'description', 'content' => $res['description']], 'meta-description');
+        if (isset($res['robots']))
+            Yii::$app->View->registerMetaTag(['name' => 'robots', 'content' => $res['robots']], 'meta-robots');
 
     }
 }
\ No newline at end of file
diff --git a/controllers/CartController.php b/controllers/CartController.php
index 74cc1ef..b9085e9 100644
--- a/controllers/CartController.php
+++ b/controllers/CartController.php
@@ -72,7 +72,8 @@ class CartController extends SnSiiController
         if ($part) {
             $Title = str_replace('#1', $part, Yii::t('main','No results found for "#1"'));
             $this->seo([
-                'title' => $Title
+                'title'  => $Title,
+                'robots' => 'noindex,follow',
             ]);
             $session = Yii::$app->session;
 
@@ -89,7 +90,8 @@ class CartController extends SnSiiController
         } else {
             $this->seo([
                 'title'       => Yii::t('main', 'Request for Quotation') . ' | Morris',
-                'description' => Yii::t('main', 'Please complete the below form and click "Submit", we will contact you shortly by email. You can also send us email')
+                'description' => Yii::t('main', 'Please complete the below form and click "Submit", we will contact you shortly by email. You can also send us email'),
+                'robots'      => 'noindex,follow',
             ]);
         }
 
@@ -274,6 +276,10 @@ class CartController extends SnSiiController
     public function actionSuccess()
     {
         $res = [];
+        $this->seo([
+            'title'  => Yii::t('main', 'Thank you for your inquiry') . ' | Morris',
+            'robots' => 'noindex,nofollow',
+        ]);
 
         return $this->render('success', $res);
     }
diff --git a/controllers/SearchController.php b/controllers/SearchController.php
index 2452afd..c58f961 100644
--- a/controllers/SearchController.php
+++ b/controllers/SearchController.php
@@ -78,6 +78,7 @@ class SearchController extends SnSiiController
 
         $this->seo([
             'title' => $Title . "",
+            'robots' => 'noindex,follow',
         ]);
 
         return $this->render('index', $res);
diff --git a/web/robots.txt b/web/robots.txt
index aa97610..1463ce3 100644
--- a/web/robots.txt
+++ b/web/robots.txt
@@ -1,5 +1,5 @@
 User-agent: *
-Allow:/
+Allow: /
 User-agent: BUbiNG
 Disallow: /
```

---

## 3. 四个文件修改前后关键代码

### 3.1 `commands/SnSiiController.php`

修改前：

```php
$this->getView()->title = $res['title'];
if (isset($res['keywords']))
    Yii::$app->View->registerMetaTag(['name' => 'keywords', 'content' => $res['keywords']], 'meta-keywords');
if (isset($res['description']))
    Yii::$app->View->registerMetaTag(['name' => 'description', 'content' => $res['description']], 'meta-description');
```

修改后：

```php
$this->getView()->title = $res['title'];
if (isset($res['keywords']))
    Yii::$app->View->registerMetaTag(['name' => 'keywords', 'content' => $res['keywords']], 'meta-keywords');
if (isset($res['description']))
    Yii::$app->View->registerMetaTag(['name' => 'description', 'content' => $res['description']], 'meta-description');
if (isset($res['robots']))
    Yii::$app->View->registerMetaTag(['name' => 'robots', 'content' => $res['robots']], 'meta-robots');
```

### 3.2 `controllers/SearchController.php`

修改前：

```php
$this->seo([
    'title' => $Title . "",
]);
```

修改后：

```php
$this->seo([
    'title' => $Title . "",
    'robots' => 'noindex,follow',
]);
```

### 3.3 `controllers/CartController.php`

修改点 1（无结果 `?part=`）：

```php
// 前
$this->seo(['title' => $Title]);
// 后
$this->seo(['title' => $Title, 'robots' => 'noindex,follow']);
```

修改点 2（询价表单页）：

```php
// 后
$this->seo([
    'title'       => Yii::t('main', 'Request for Quotation') . ' | Morris',
    'description' => Yii::t('main', 'Please complete the below form ...'),
    'robots'      => 'noindex,follow',
]);
```

修改点 3（成功页）：

```php
public function actionSuccess()
{
    $res = [];
    $this->seo([
        'title'  => Yii::t('main', 'Thank you for your inquiry') . ' | Morris',
        'robots' => 'noindex,nofollow',
    ]);
    return $this->render('success', $res);
}
```

### 3.4 `web/robots.txt`

```diff
-Allow:/
+Allow: /
```

> 该修改仅做格式规范化；未调整任何 User-agent 分组、Disallow 策略或 Crawl-delay。

---

## 4. Yii2 robots meta 输出路径

```text
控制器
  → SnSiiController::seo(['robots' => 'noindex,follow'])
  → Yii::$app->View->registerMetaTag(
        ['name' => 'robots', 'content' => 'noindex,follow'],
        'meta-robots'
    )
  → yii\web\View::$metaTags['meta-robots']
  → 布局 views/layouts/main.php 第 49 行 <?php $this->head() ?>
  → 输出到 <head>：
     <meta name="robots" content="noindex,follow">
```

- 第二个参数 `'meta-robots'` 是键：同一页面重复注册会覆盖，不会重复输出。
- `$this->head()` 已存在于当前布局，无需新增占位符。
- 页面未调用 `seo(['robots'=>...])` 时，不输出 robots meta（保持现状）。

---

## 5. 路由对应关系

| 页面 | URL | 路由/控制器 | 本轮是否加 robots |
|---|---|---|---|
| 搜索结果 | `/search/index.html?keyword=...` | 默认路由 `/search/index`（suffix `.html`） | 是：`noindex,follow` |
| 询价车/RFQ | `/shopping-cart.html` | `params.UrlRules` → `/cart/index` | 是：`noindex,follow` |
| 无结果询价 | `/shopping-cart.html?part=...` 或搜索无结果重定向 | `/cart/index`（`$part` 分支） | 是：`noindex,follow` |
| 询价成功（代码目标） | 代码重定向 `/order/success` | **无 OrderController** | 成功页方法存在，但当前重定向路径不匹配 |
| 成功页（默认路由） | `/cart/success.html` | `/cart/success` → `actionSuccess` | 是：`noindex,nofollow` |

**已知不一致（需修复，不在本提交范围）**：`CartController::actionSend()` 重定向 `['/order/success']`，但仓库无 `OrderController`；默认可用路由是 `/cart/success.html`。本提交只给 `actionSuccess` 加 noindex，不修复该路由。

---

## 6. 代码级自检结果

| 检查 | 命令 | 结果 | 说明 |
|---|---|---|---|
| PHP 语法 | `php -l commands/SnSiiController.php` | PASS | No syntax errors |
| PHP 语法 | `php -l controllers/SearchController.php` | PASS | No syntax errors |
| PHP 语法 | `php -l controllers/CartController.php` | PASS | No syntax errors |
| 空白/补丁格式 | `git diff --check cdb9c04..25afffb` | PASS | 无输出 |
| 变更范围 | `git show --stat 25afffb` | 4 文件 +12/−3 | 无其他文件 |
| 工作区 | `git status --short --branch` | 干净，与 origin 同步 | 推送后 |

**未执行**：

- 应用启动、HTTP 请求、页面 HTML 断言。
- 单元/集成/E2E 测试。
- SEO 抓取、索引、富结果校验。
- 性能与兼容性测试。

> `php -l` 与 `git diff --check` 只证明语法与补丁格式，不证明功能、SEO 输出或生产可用。

---

## 7. 复核入口

- 完整提交：`git show 25afffb`
- 对比基线：`git diff cdb9c04..25afffb`
- 远端分支：`git ls-remote origin feat/morrishk-website-implementation`
