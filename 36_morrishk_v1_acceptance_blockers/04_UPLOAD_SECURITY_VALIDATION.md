# 04 上传安全验证

## 1. 实现

- 落盘：`@runtime/uploads`（Web 根之外），文件名 `随机24位 + .扩展名`
- 登记：`snsii_cart.Files = uploads/<name>`
- 下载：`GET /download/<file>` → `DownloadController`
  - 未登录 → **403**
  - 文件名不合法 → 404
  - 数据库中无对应记录 → 404（资源归属）
  - `realpath` 必须位于 `runtime/uploads` 之内
- 校验：5 MiB、`xls,xlsx,csv,doc,docx,pdf,txt`、`checkExtensionByMimeType=true`
- 静态 URL：`/uploads/<name>` → **404**（文件已不在 Web 根）

## 2. 测试结果（最终提交 `af4765f`）

| # | 用例 | 请求 | HTTP | 结果 | 判定 |
|---|---|---|---|---|---|
| U1 | PHP 伪装 TXT | `shell.php.txt`（内容为 PHP，声明 `text/plain`） | 200 | 服务端 MIME 嗅探为 text/x-php，与 .txt 不符，拒绝；无入库/落盘 | PASS |
| U2 | 双扩展名 | `double.php.pdf`（声明 `application/pdf`） | 200 | 接受，但仅保留 `.pdf`，随机文件名，落盘 runtime；原 `.php` 不保留 | PASS（风险说明见 §3） |
| U3 | MIME 与扩展名不一致（客户端声明） | `mime.txt` 声明 `application/x-php` | 200 | 接受：服务端忽略客户端声明，按实际内容判定 text/plain 与 .txt 相符 | PASS（按服务端嗅探） |
| U4 | 超限 | 6.00 MiB `big.txt` | 200 | `The file "big.txt" is too big. Its size cannot exceed 5.00 MiB.`；无入库/落盘 | PASS |
| U5 | 路径穿越文件名 | `filename=../../evil.txt` | 200 | 原始名丢弃，随机名写入 runtime；仓库根 `evil.txt` 不存在 | PASS |
| U6 | 未授权下载 | `GET /download/<file>`（无会话） | 403 | 拒绝 | PASS |
| U7 | 越权/他人读取 | `qa_other` 登录后下载 `qa_tester` 流程产生的附件 | 200 | **允许**（仅校验登录 + 记录存在，无用户级归属） | **FAIL（策略缺口）** |
| U8 | 非登记文件 | 合法格式但不在 DB 的随机名 | 404 | 拒绝 | PASS |
| U9 | 下载路径穿越 | `/download/..%2F..%2Fconfig%2Fdb.php` | 404 | 路由/正则拒绝 | PASS |
| U10 | 静态直链 | `/uploads/<file>` | 404 | 文件不在 Web 根 | PASS |

数据库影响：U1/U4 计数不变；U2/U5 各新增 1 条记录（文件名随机、有效扩展名）；U7/U8/U9/U10 无写入。

## 3. 说明与缺口

- U2：`.php.pdf` 以 `.pdf` 落盘，且存储于 Web 根之外、下载需登录；当前无脚本执行面。若未来增加预览/内联渲染，需再评估 PDF 内嵌脚本风险。
- U3：安全判定依赖服务端 finfo（正确做法），客户端 MIME 不参与。
- **U7 未达到严格“资源归属”要求**：系统为单租户、单一后台角色，没有客户账号与用户-询价归属字段，因此任一后台账号可下载任一已被记录的附件。若要按用户隔离，需要新增归属字段与权限模型（超出本轮范围，列为阻断风险 R-01）。
- 跨 Tenant 场景：应用单租户，不存在 Tenant 维度；无法构造跨租户用例，标记 **NOT_APPLICABLE**（不得当作已通过）。
