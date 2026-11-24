# 03 错误处理

## 1. 设计

| 组件 | 变更 |
|---|---|
| `SiteController::actions()['error']` | 保留 `yii\web\ErrorAction`，指定专用布局 `@app/views/layouts/error` |
| `views/layouts/error.php`（新增） | 最小 HTML 布局：不查询数据库、不读取导航/商家参数 |
| `views/site/error.php` | 仅输出 `$name` 与 `$message`（`Html::encode`），无堆栈 |
| `web/index.php` | 默认 `YII_DEBUG=false`、`YII_ENV=prod`，不向用户暴露调试信息 |
| `SnSiiController::init` | 导航查询异常被捕获并记录，不阻断错误页渲染 |
| `views/layouts/header.php` | 缺省参数安全（`?? []`、`?? ''`） |

未关闭 Yii 原生错误处理，未关闭 `errorAction`，未在测试入口覆盖 `set_error_handler`。

## 2. 实测

| 场景 | 方法 | 状态码 | 页面 | 堆栈/凭据 |
|---|---|---|---|---|
| 不存在页面 | `GET /nonexistent-page.html` | **404** | 754 B，标题 `Not Found (#404)` | 无 |
| 未登录下载附件 | `GET /download/<existing>.pdf` | **403** | 754 B | 无 |
| 不存在附件 | `GET /download/AAAA…pdf` | **404** | 754 B | 无 |
| 路径穿越 | `GET /download/..%2F..%2Fconfig%2Fdb.php` | **404** | 754 B | 无 |
| 数据库不可用 | 停止 MySQL 后 `GET /products.html`（缓存已清） | **500** | 793 B，标题 `Database Exception (#2002)` | 无 |

500 页正文（节选）：

```html
265	<title>Database Exception (#2002)</title>
...
	<div class="alert alert-danger">An internal server error occurred.</div>
```

恢复数据库后同一路由回到 200。

## 3. 日志

- 应用错误写入 `runtime/logs/app.log`（`yii\log\FileTarget`，error/warning/info）。
- 404/403 以 `yii\web\HttpException` 记录；500 记录异常类型与消息。
- 用户侧只看到状态码与通用文案，不含 `Stack trace`、`vendor\...`、DSN 或口令。

## 4. 边界说明

- 错误页不再依赖 `Mid`/`MRow`/`CatList`；即使数据库完全不可用也能渲染（已用停库方式验证）。
- 错误页为独立最小布局，未加载前端资源，避免二次失败。
