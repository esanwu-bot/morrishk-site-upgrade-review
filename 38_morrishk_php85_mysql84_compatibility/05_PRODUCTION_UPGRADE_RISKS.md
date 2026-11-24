# 05 生产升级风险

历史生产：PHP 7.4 / MySQL 5.6。本轮候选目标：PHP 8.5.13 / MySQL 8.4.13。以下均基于本轮实测与版本差异分析，**不代表生产已升级**。

## 1. PHP 7.4 → 8.5 风险

| 风险 | 依据 | 影响 |
|---|---|---|
| 弃用被升级为异常 | 本轮实测：Yii 2.0.44 的 `ArrayAccess`/`Countable` 返回类型、`htmlspecialchars(null)`、`strncmp(null)`、`utf8_encode()` 均触发弃用；Yii 错误处理器将其转为 `ErrorException` | 404/403/错误页会变 500；高流量下日志暴涨 |
| 动态属性弃用（8.2） | 遗留代码可能给未声明属性的对象赋值 | 目前仅弃用提示，未来版本报错 |
| `utf8_encode()/utf8_decode()` | `egulias/email-validator 3.1.2` 仍在调用 | 邮件解析路径产生大量弃用 |
| 严格类型与 null 传参 | `strncmp()`、`htmlspecialchars()` 等内建函数对 null 报弃用 | 需逐个修 null 兜底 |
| 数组/字符串比较语义 | 8.0 起字符串与数字比较规则改变 | 搜索、价格、分页等比较逻辑需复核 |
| 错误抑制 `@` 语义 | 8.0 起 `@` 不再完全吞错 | 依赖 `@` 的旧代码可能暴露告警 |
| dev 依赖不兼容 | 本轮实测：Codeception/Prophecy 锁死 PHP ≤8.1 | 测试工具链需独立升级，不能阻塞生产运行时 |
| 扩展差异 | PHP 8.5 不再提供 `mysql_*`、`create_function`、`each()`；`E_STRICT` 已移除 | 需全量扫描遗留调用 |
| PHP-FPM/Nginx 差异 | 本轮为 Windows + PHP 内置服务器；生产为 PHP-FPM + Nginx | OPcache/JIT、进程模型、超时、上传限制均需重新配置与压测 |
| 默认 `SameSite`/Cookie 行为 | PHP 7.3 起默认 `SameSite=Lax` | 跨域/多语言子站登录态需回归 |

## 2. MySQL 5.6 → 8.4 数据迁移风险

| 风险 | 本轮证据 | 影响 |
|---|---|---|
| MyISAM 无事务 | 实测 `rollBack()` 无效，30/31 表为 MyISAM | 迁移中一旦中断只能整表重做；业务无原子性保障 |
| 字符集 utf8→utf8mb4 | 实测 Emoji 插入 `1366` | 若迁移为 utf8mb4，需处理索引长度与排序规则变化；若保持 utf8mb3，则 4 字节字符永久不可用 |
| 严格 `sql_mode` | 实测缺 `AddDate` 报 `1364` | 旧代码省略 NOT NULL 列的写法会在生产立即失败 |
| `ONLY_FULL_GROUP_BY` | 8.4 默认开启 | 旧 SQL 的非聚合列查询会报错，需要逐条改写 |
| 零日期/非法日期 | `NO_ZERO_DATE`/`NO_ZERO_IN_DATE` 开启 | 历史 `0000-00-00` 数据导入即失败，需清洗 |
| 整型显示宽度 | 导入告警 1681 | 功能无影响，但后续 DDL 会持续告警 |
| 保留字扩张 | — | 未加反引号的旧 SQL 可能命中新保留字 |
| 认证插件 | 8.4 默认 `caching_sha2_password` | 旧客户端/旧驱动需支持 TLS 或 RSA 公钥交换 |
| 排序规则差异 | 库为 `utf8mb4_0900_ai_ci`，表为 `utf8mb3_general_ci` | 跨表 JOIN 可能出现排序规则冲突 |
| 索引前缀长度 | utf8mb4 每字符 4 字节 | `varchar(255)` 唯一索引在旧行格式下可能超限 |
| 时区表 | 需执行 `mysql_tzinfo_to_sql` | 使用命名时区的 SQL 会报错；本机用固定 `+00:00` 规避 |
| 备份/复制工具 | 5.6 的 `mysqldump` 参数在 8.4 有变化 | 迁移脚本需重写并用真实数据演练 |

## 3. 字符集与排序规则差异

- 现有 31 表全部 `utf8mb3_general_ci`；目标库建议 `utf8mb4` + 明确排序规则（如 `utf8mb4_0900_ai_ci`）。
- 转换需逐表 `ALTER TABLE ... CONVERT TO CHARACTER SET utf8mb4 COLLATE ...`，并同步检查唯一索引长度与 `GROUP BY`/`DISTINCT` 结果顺序变化。
- 应用连接串当前固定 `charset=utf8`（`config/db.php`），即使库改为 utf8mb4，连接层仍按 utf8mb3 交互，必须同步修改。

## 4. PHP-FPM / Nginx 与本地差异

| 项 | 本地（本轮） | 生产目标 |
|---|---|---|
| Web 服务器 | PHP 内置服务器 | Nginx + PHP-FPM |
| 路由 | 测试入口 router | `try_files` + `index.php` |
| 静态目录保护 | 未验证 | 需继续验证 `/uploads`、`/runtime`、`/config`、`/vendor` 拒绝访问 |
| 上传限制 | PHP `upload_max_filesize=32M`，业务 5MB | 需与 Nginx `client_max_body_size` 对齐 |
| OPcache | CLI 开启 | FPM 需独立配置并预热 |
| 超时 | 无 | `fastcgi_read_timeout` 与慢查询需匹配 |

## 5. 回滚方案与备份要求

1. **代码**：应用仓库按提交回退（`23f9986` 为当前候选基线），Nginx/PHP-FPM 配置保留旧版本副本。
2. **数据库**：MySQL **不支持降级**（8.4 → 5.6 不可行）。回滚只能依赖迁移前备份恢复：
   - 迁移前全量逻辑备份：`mysqldump --single-transaction --routines --events --triggers`（MyISAM 表需额外锁表或停机）；
   - 文件级快照（数据目录冷备）作为第二份保险；
   - 备份必须做**一次恢复演练**并记录耗时；
   - 切换前冻结写入，记录 binlog 位点。
3. **切换策略**：建议先只读/预发验证，再灰度；保留 5.6 实例只读一段时间用于比对。
4. **数据量**：生产数据量与索引规模需在演练环境验证，本轮未做。

## 6. 结论边界

- 本轮只证明“现有功能在 PHP 8.5.13 + MySQL 8.4.13 本地环境可运行，并列出缺陷”，**不构成生产升级完成**。
- P0-2 目标环境状态维持 Round 37 的 `BLOCKED`；`DEMO_READY`、`FUNCTION_ACCEPTED`、`PRODUCTION_READY`、`RELEASE_APPROVED` 均未标记。
