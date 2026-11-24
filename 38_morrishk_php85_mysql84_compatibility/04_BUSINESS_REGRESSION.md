# 04 业务回归

运行方式：PHP 8.5.13 内置服务器 `127.0.0.1:8098`，入口为测试引导（见 01 文档第 6 节），数据库为隔离测试库。原始状态码见 `evidence/route_matrix.txt`。

## 1. 页面与路由

| 编号 | 场景 | 实际 | 判定 |
|---|---|---|---|
| R38-01 | 首页 `/` | 200，38022 B | PASS |
| R38-02 | 产品列表 `/products.html` | 200，30567 B | PASS |
| R38-03 | 大类 `/big-categories/c-3801-3802/r38-test-big.html` | 200，33027 B | PASS |
| R38-04 | 产品详情 `/products/38000001/r38-test-part.html` | 200，55524 B | PASS |
| R38-05 | 搜索 `/search.html?keyword=R38` | 302 → `/shopping-cart.html?part=R38` | PASS（热度直达行为） |
| R38-06 | 不存在页面 `/nonexistent-page.html` | 404 | PASS |
| R38-07 | `/sitemap.xml` | 200，478 B | PASS |
| R38-08 | `/robots.txt` | 200，596 B | PASS |
| R38-09 | `/about.html` | 404（测试库无 page 数据） | NOT_APPLICABLE（数据缺失，非代码失败） |

### 1.1 SEO 元素（PDP 实测）

| 项 | 结果 |
|---|---|
| canonical | `http://127.0.0.1:8098/products/38000001/r38-test-part.html` |
| JSON-LD | `application/ld+json`，`@type=Product`，含 `sku`/`mpn`/`description` |
| H1/标题 | 正常渲染 |

## 2. 询价与附件

| 编号 | 场景 | 实际 | 判定 |
|---|---|---|---|
| R38-10 | PDP 快速询价（无附件） | POST → 302 `/cart/success.html?Oid=2397`；`snsii_cart` 新增行；Mock 记录写入 | PASS |
| R38-11 | 购物车询价 + 合法 PDF（31 B） | 200 且出现成功文案；文件落盘 `runtime/uploads/VFthKF28Q7H6op8J2F0xRWsk.pdf`；DB `Files` 记录 | PASS |
| R38-12 | 非法扩展名 `bad.exe` | 校验失败，未落盘 | PASS |
| R38-13 | 超过 5 MB 的 PDF（6 MB） | 校验失败（maxSize），未落盘 | PASS |
| R38-14 | 提交时缺少 `_csrf` | 400 `BadRequestHttpException` | PASS |
| R38-15 | 未登录访问已有附件 | 403 | PASS |
| R38-16 | 不存在附件 | 404 | PASS |
| R38-17 | 路径穿越 `..%2F..%2Fconfig%2Fdb.php` | 404（正则拒绝） | PASS |
| R38-18 | 非法短文件名 `short.pdf` | 404 | PASS |

### 2.1 邮件 Mock

- `MockInquirySender` 将记录写入 `runtime/inquiry/inquiry-20261124.log`，实测内容含 `source=pdp`、`order_id=2397`、`parts=["R38-TEST-0001"]`。
- 为杜绝真实外发，测试入口把 SMTP 主机指向本机不可用地址；发送失败被应用捕获并写入 `Yii::error`。
- 未连接任何真实 SMTP、未调用第三方询价接口。

## 3. 会话与 CSRF

| 项 | 结果 |
|---|---|
| 会话 Cookie | 首次访问下发 `PHPSESSID`（带 Yii 校验） |
| CSRF Token | PDP/购物车页输出 `csrf-param`/`csrf-token` meta 与隐藏域 |
| 无 Token 提交 | 400 拒绝 |
| 会话购物车回显 | **PARTIAL**：会话已建立、Cookie 正常，但提交后重新 GET 未观察到 `CartList` 回显，需进一步确认前端取值逻辑 |

## 4. 未执行项（不得据本轮推断为通过）

| 编号 | 场景 | 原因 |
|---|---|---|
| R38-19 | 上传者下载自己的附件（200 + attachment + nosniff） | 需要后台账号登录链路，本轮未构造 |
| R38-20 | 其他普通员工下载（403） | 同上 |
| R38-21 | 管理员跨用户下载（200） | 同上 |
| R38-22 | Nginx 路径访问控制（`/uploads`、`/runtime`、`/config`、`/vendor` 403 等） | 本轮为 PHP 内置服务器，无 Nginx |
| R38-23 | 500 页面专项 | 未专门构造；错误页相关缺陷见 06 文档 F-03 |
| R38-24 | 后台 CKEditor / news add | 依赖 dev 依赖与后台登录，未执行 |

上述项沿用 `37_morrishk_v1_final_acceptance/` 在 PHP 7.4.3 + MySQL 8.0.12 + Nginx 环境下的证据，**不代表已在 PHP 8.5.13 / MySQL 8.4.13 下复核**。

## 5. 测试引导说明（不修改应用代码）

为使遗留应用在本地内置服务器可运行，测试入口做了三项与本轮判定相关的调整：

1. 注入 `params['Mid']=0`（生产由域名解析注入主站商家上下文）；
2. 覆盖错误处理器：`E_DEPRECATED/E_WARNING/E_NOTICE` 记录到独立日志而不中断请求；
3. 关闭站内错误页 Action，直接暴露真实 403/404 状态码。

第 2、3 项掩盖了“错误页在当前环境渲染失败”的表现，该缺陷已单列在 06 文档 F-03，**不视为应用已修复**。
