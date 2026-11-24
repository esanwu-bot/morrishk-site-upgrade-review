# 07 剩余风险

| ID | 风险 | 级别 | 状态 | 证据 / 说明 | 下一步 |
|---|---|---|---|---|---|
| R-01 | 生产 MySQL 5.6.50 未实测迁移 | 高 | **BLOCKED** | 本机无 5.6.50；5.7.26/8.4.13 + 真实结构通过 | 在 5.6.50 备份副本复跑迁移与回滚 |
| R-02 | Secret 轮换依赖人工执行 `auth-key/rotate` | 高 | OPEN | 仅切换 Secret 会复活旧 Cookie（`secret_rotation.txt`） | 将命令写入变更 runbook；遗漏时视为轮换未完成 |
| R-03 | HTTPS Secure Cookie 只用 curl + 自签名证书验证 | 中 | NOT_TESTED | 真实浏览器在受信任证书下的 Secure 回传未测 | 生产前用真实域名/证书做浏览器验证 |
| R-04 | 仓库缺失静态图片 | 中 | OPEN | `/images/site/logo-180.png`、`cards.png`、`no-pic.jpg` 404，仓库工作区不存在；移动端 Hero 文案重叠 | 确认生产是否有未入库文件；补齐或修正引用；移动端视觉 QA |
| R-05 | punycode 2.3.1 为 CommonJS，浏览器加载报错 | 低（当前未加载） | LATENT | 直接探测 `PUNYCODE_OK` 但控制台 `module is not defined`（03） | 保持 `enableIDN=false`；未来启用 IDN 前提供浏览器构建/shim |
| R-06 | 剩余 12 包 / 68 条 advisory | 中 | OPEN | 05；flysystem 无修复版本 | 按 05 的优先顺序升级并回归；不宣称清零 |
| R-07 | `.user.ini` 的 `open_basedir` 仅限生产路径 | 中 | OPEN | `web/.user.ini` = `/www/wwwroot/morrishk.net/:/tmp/`；staging 副本已移除 | 部署时保留该文件；任何新路径（上传/临时）必须在白名单内 |
| R-08 | `session.use_strict_mode=0` | 中 | OPEN | 01 环境记录；未改 | 生产建议设为 1，并回归登录/登出 |
| R-09 | `X-Forwarded-Proto` 信任配置错误 | 中 | OPEN | 伪造头在未开启 trust 时被忽略（01）；开启后必须由代理覆盖 | 部署文档固定代理写法；不要透传客户端头 |
| R-10 | `swiftmailer/swiftmailer` 已废弃 | 低 | OPEN | composer 提示 abandoned | 后续迁移至 symfony/mailer；本轮不动 |
| R-11 | Staging 未重跑下载授权矩阵 | 低 | NOT_TESTED | Round 42 已在 8099 通过 | 生产预验收时补跑 |
| R-12 | Cookie Domain 为 host-only | 低 | OPEN | `www` 与裸域共享登录态未设计 | 明确域名策略；如需共享再评估 Domain |
| R-13 | 轮换期间新登录可能被立即失效 | 低 | 已接受 | 轮换窗口内新 Cookie 带旧版本，命令执行后失效 | 在低峰执行；接受一次重新登录 |
| R-14 | 全局 Generation 未持久化 | 中 | 已接受（本轮） | 采用账号级递增，无新表 | 若需自动检测 Secret 回滚，另立变更评估单行 Generation 表 |

## 说明

- 未把“无调用”写成“CVE 已修复”。
- 未把 5.7/8.4 的结果写成“生产 5.6.50 已验证”。
- 未把一次 302 写成“所有在线会话被服务端强制断开”；F-18 的结论仍以 Round 42 的机制说明为准。
