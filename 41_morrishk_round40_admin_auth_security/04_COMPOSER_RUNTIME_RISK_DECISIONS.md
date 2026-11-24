# 04 Composer Runtime 风险处置决策

统计口径（Round 39.2 已对齐）：14 包 / 70 条；runtime 9 包 / 61 条；critical 3 / high 28 / medium 29 / low 8 / unknown 2。

本轮**不做依赖升级**，只给出处置决策。

| 包 | 当前版本 | 可利用路径 | 用户输入影响 | 立即禁用 | 修复版本 | 升级兼容性/测试范围 | 暂不升级时的隔离与监控 |
|---|---|---|---|---|---|---|---|
| `yiisoft/yii2` | 2.0.53 | CVE-2026-39850：视图参数名冲突导致 LFI；当前视图名由代码固定 | 否（未把用户输入作为 `view` 参数） | 不需要 | **2.0.55 未发布**（最新 2.0.53） | 发布后单包升级；需全站回归（路由/视图/错误页） | 禁止任何“用户可控视图名”改造；监控异常视图解析日志；跟踪 2.0.55 |
| `phpoffice/phpspreadsheet` | 1.19.0 | 31 条（含 critical SSRF/RCE/DoS）：解析恶意表格时触发 | **上传白名单含 xls/xlsx**，但当前只存储不解析 | 不需要（未启用解析） | ≥1.30.7 可用 | 1.19→1.30 API 变更较大；需覆盖 Excel 导入/导出全流程 | 禁止新增表格解析；上传限制 5MB + MIME 校验；如启用解析，先升级并隔离进程 |
| `guzzlehttp/guzzle` | 7.4.1 | 14 条（含 high：主机校验绕过） | 间接（外部 URL 由 google/apiclient 构造） | 不需要 | ≥7.15.2 可用 | 需与 `google/apiclient`、`psr7` 联动升级并回归 | 限制出站域名白名单；监控外呼失败 |
| `phpseclib/phpseclib` | 3.0.37 | 6 条（high/medium）：加密/SSH 相关 | 否 | 不需要 | 按公告逐条确认 | 随 google/apiclient 依赖链升级 | 不使用其 SSH/SFTP 功能；仅保留 TLS 相关 |
| `firebase/php-jwt` | 5.5.1 | 2 条（critical CVE-2021-46743：算法混淆） | 否 | 不需要 | ≥7.0.0 可用 | 需升级 google/apiclient 链路 | 未发现 JWT 解析调用；禁止引入自定义 JWT 校验 |
| `yiisoft/yii2-redis` | 2.0.17 | CVE-2025-48493：连接失败日志泄露 AUTH | 否 | 不需要（未启用 Redis） | **2.0.20 未发布**（最新 2.0.19） | 发布后升级；启用前必须完成 | 保持 Redis 组件未配置；如启用，先升级并确认日志脱敏 |

补充：

- `guzzlehttp/psr7 2.8.0`（4 条 medium）、`league/flysystem 1.1.9`、`symfony/polyfill-intl-idn 1.32.0` 各 1 条，随上述主链升级处理。
- dev-only（`symfony/yaml`、`phpunit`、`psysh`、`dom-crawler`、`yii2-gii`）共 9 条，不进入生产运行时；随测试工具链单独升级。

**未以“未发现调用”作为关闭依据**：每项均列明隔离条件与升级门槛；升级时必须附带业务回归（登录、菜单、询价、上传下载、SEO），不得只升依赖。
