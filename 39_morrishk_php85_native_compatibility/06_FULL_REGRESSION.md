# 06 无绕过全量回归

运行方式：PHP 8.5.13 内置服务器 `127.0.0.1:8099`，入口仅做静态透传 + 环境变量注入；未覆盖错误处理器、未屏蔽弃用、未关闭 `errorAction`、未注入 `Mid`。数据库 `morrishk_r39`（应用账号 `morrishk_app`）。

## 1. 页面与路由

| 编号 | 场景 | 实际 | 判定 |
|---|---|---|---|
| R39-01 | 首页 `/` | 200 / 38032 B | PASS |
| R39-02 | 产品列表 `/products.html` | 200 / 30577 B | PASS |
| R39-03 | 大类 `/big-categories/c-3901-3902/r39-test-big.html` | 200 / 33039 B | PASS |
| R39-04 | PDP `/products/39000001/r39-test-part.html` | 200 / 55534 B | PASS |
| R39-05 | 搜索 `/search.html?keyword=R39` | 302 → `/shopping-cart.html?part=R39` | PASS（热度直达行为） |
| R39-06 | 购物车 `/shopping-cart.html` | 200 / 50920 B | PASS |
| R39-07 | `/sitemap.xml` | 200 / 478 B | PASS |
| R39-08 | `/robots.txt` | 200 / 596 B | PASS |
| R39-09 | 不存在页面 | 404 / 754 B，标题 `Not Found (#404)` | PASS |
| R39-10 | 数据库不可用时的未缓存页面 | 500 / 793 B，标题 `Database Exception (#2002)`，无堆栈 | PASS |

原始输出：`evidence/route_matrix.txt`。

## 2. 询价

| 编号 | 场景 | 实际 | 判定 |
|---|---|---|---|
| R39-11 | PDP 快速询价（无附件） | 302 → `/cart/success.html?Oid=2399`；`snsii_cart` 新增行 | PASS |
| R39-12 | 购物车询价 + 合法 PDF | 200；文件落盘 `runtime/uploads/7Zvlakqg2a0_ZZ_lNcoBUV8A.pdf`；行内 `Files` 已写入 | PASS |
| R39-13 | 非法扩展名 `.exe` | 校验失败、未落盘、无记录 | PASS |
| R39-14 | 超限 6 MB PDF | `maxSize` 校验失败、未落盘 | PASS |
| R39-15 | 缺 CSRF | 400 `BadRequestHttpException` | PASS |
| R39-16 | Mock 发送 | `runtime/inquiry/inquiry-*.log` + `runtime/inquiry/eml/*.eml`，SMTP 指向本机不可用地址 | PASS |

## 3. 会话与前端一致

| 步骤 | 结果 |
|---|---|
| GET 购物车 | 下发 `PHPSESSID` + CSRF |
| POST 加入 `R39-SESSION-02`（校验失败路径） | 200，Session 保留 |
| GET `/cart/list.html` | JSON 含 `R39-SESSION-02` 的 `PartNumber/Quantity/UnitPrice` |
| 成功提交后 | Session `CartList` 清空（预期） |

结论：后端 Session 与前端 `/cart/list` 读取一致（Round 38 的"未回显"由验证方法不当导致）。

## 4. 附件下载

| 场景 | 结果 |
|---|---|
| 未登录访问已存在附件 | **403**（754 B，无堆栈） |
| 不存在附件 | **404** |
| 路径穿越 `..%2F..%2Fconfig%2Fdb.php` | **404** |
| 非法短文件名 | **404** |

## 5. SEO

| 项 | 结果 |
|---|---|
| canonical | 存在（PDP 指向自身 URL） |
| JSON-LD | `application/ld+json`，`@type=Product`，含 `sku`/`mpn`/`description` |
| sitemap / robots | 200，内容正常 |

## 6. 数据库行为

| 项 | 结果 |
|---|---|
| CRUD（应用账号） | PASS（Round 38 已在同结构库验证，本轮沿用） |
| 事务 | 30/31 表 MyISAM，`rollBack()` 无效（结构性限制，见 05 文档） |
| 严格模式 | 缺少 NOT NULL 无默认值列会被拒绝（`1364`） |
| 唯一约束 | `PartNumber` 重复被拒（`1062`） |

## 7. 未执行项（不得据本轮推断为通过）

| 编号 | 场景 | 原因 |
|---|---|---|
| R39-17 | 上传者 / 其他员工 / 管理员三种身份下载矩阵 | 需后台登录链路；沿用 Round 37 证据，未在 8.5/8.4 下重跑 |
| R39-18 | Nginx 路径访问控制（`/uploads`、`/runtime`、`/config`、`/vendor` 403） | 本轮为 PHP 内置服务器，无 Nginx |
| R39-19 | 后台 CKEditor / 新闻发布 | 需后台登录 |
| R39-20 | 浏览器端 JS 交互（真实浏览器） | 以 `/cart/list` JSON 验证会话一致性，未做浏览器录制 |

## 8. 测试入口差异清单（全部）

1. 静态文件透传（内置服务器需要）。
2. 注入 `MORRISHK_DB_DSN/USERNAME/PASSWORD`、`MORRISHK_COOKIE_VALIDATION_KEY`、`MORRISHK_SITE_URL`、`MORRISHK_SMTP_HOST=127.0.0.1`。
3. 不修改 `YII_DEBUG`/`YII_ENV`（默认生产模式）。
4. 不注册自定义错误处理器、不关闭 `errorAction`、不注入 `Mid`。

除此之外与生产启动一致（直接 `require web/index.php`）。
