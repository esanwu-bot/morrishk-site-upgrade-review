# 安全材料处理

## 1. Review 文档中的明文口令

- 已修改：`36_morrishk_v1_acceptance_blockers/02_TEST_ENVIRONMENT.md`。
- 原内容：测试账号 `qa_tester` / `qa_other` 的明文密码。
- 现内容：不再记录密码，只说明“一次性随机口令、受控渠道传递、不写入仓库”，并指向本文件。
- 全仓复查：`36_` 与 `37_` 目录中不再出现旧口令字符串。

## 2. 凭据轮换

| 账号 | 旧口令状态 | 新口令 |
|---|---|---|
| `qa_tester` | 已失效（登录返回 200 表示表单重渲染，未登录） | 一次性随机口令，仅存于运行机临时文件，未入库 |
| `qa_other` | 已失效 | 同上 |
| `qa_admin` | 已失效 | 同上 |

验证证据：`evidence/security_rotation.txt`

```
old_password[qa_tester] => 200|
old_password[qa_other]  => 200|
old_password[qa_admin]  => 200|
```

说明：成功登录返回 `302 -> /ejadmin-index.html`；`200` 表示停留在登录页（凭据无效）。

补充：

- 新口令由随机串生成，仅通过本机临时文件传递给测试脚本，测试结束后删除；未提交到任何仓库。
- 旧口令曾在 36_ 文档中以明文出现，视为已泄露，故轮换而不是仅删除文档。

## 3. 数据边界

- 未提交真实用户数据、真实询价内容或真实附件。
- 所有测试询价均为合成数据（`ROUND37-SYNTHETIC`、`synthetic@example.invalid`）。
- 证据文件只保留：状态码、响应头、文件大小、记录 id / OwnerUserId / 文件名、审计 JSON 行；不包含附件正文或客户信息。
- Mock 边界未变：邮件仍在 `runtime/mail/*.eml`，询价日志在 `runtime/inquiry/*.log`，无真实 SMTP 或第三方调用。
