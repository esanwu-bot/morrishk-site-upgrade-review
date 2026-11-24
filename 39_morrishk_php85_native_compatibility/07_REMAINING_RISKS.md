# 07 残余风险与未覆盖项

## 1. 仍存在的技术风险

| 风险 | 证据/原因 | 影响 | 建议 |
|---|---|---|---|
| 第三方包 PHP 8.5 弃用 | `google/apiclient 2.12.1`、`guzzlehttp/promises 1.5.1`、`tightenco/collect 8.78.0`、`opis/closure 3.6.3` 的隐式 nullable 弃用（CLI 可见） | 已测 Web 路径未触发；控制台任务（Google API、Excel 导出）可能触发异常 | 按实际使用路径单独升级，不做全量升级 |
| `swiftmailer` 已废弃 | Composer 提示；`yii2-swiftmailer 2.1.3` 依赖它 | 长期维护风险；生产真实发信仍走 Swift SMTP | 规划迁移 `symfony/mailer`（独立任务） |
| MyISAM 无事务 | 30/31 表 | 询价等写入无原子性；迁移中断只能整表重做 | 见 05 文档；分批转 InnoDB 前先在副本演练 |
| `utf8mb3` 限制 | Emoji 写入报 1366（Round 38 实测） | 客户输入 4 字节字符会失败 | 连接串 + 表字符集同步迁移，需回归排序 |
| 严格 SQL 模式 | `STRICT_TRANS_TABLES`、`ONLY_FULL_GROUP_BY`、`NO_ZERO_DATE` | 旧代码省略 NOT NULL 列会 1364；零日期导入失败 | 发布前全表扫描与写入代码核对 |
| Composer 安全通告 | 26 条 advisories / 4 包 | 可能在后续被利用 | 单独做依赖安全升级评估 |
| Codeception 运行器弃用 | 5.3.1 终端宽度探测使用反引号 | 测试运行需 `-d error_reporting=22527` | 属于工具链，不影响应用；升级 Codeception 后移除 |

## 2. 未覆盖 / 未验证

| 项 | 状态 |
|---|---|
| PHP 7.4 / MySQL 5.6 生产兼容性 | **未评估完成**；本轮只做 8.5/8.4 本地验证 |
| MySQL 5.6 → 8.4 真实数据迁移 | 未执行（无生产数据）；仅为结构导入与只读评估 |
| 生产数据中的零日期/非法日期 | 未扫描 |
| MyISAM → InnoDB 锁表时长 | 未测（测试库无数据量） |
| utf8mb4 全量迁移 | 未执行 |
| 后台登录/管理员下载/权限矩阵 | 未在 8.5/8.4 下重跑（沿用 Round 37） |
| Nginx 路径访问控制 | 未执行（内置服务器） |
| 真实浏览器 JS 交互 | 以接口 JSON 验证会话，未做浏览器录制 |
| 并发/死锁/连接池 | 未执行 |
| 备份恢复演练 | 未执行 |
| 其他控制台任务（Google API、Excel 导出、Redis、Elasticsearch） | 仅依赖安装与平台检查 |

## 3. 环境与配置差异

- 生产为 PHP-FPM + Nginx；本轮为 Windows + PHP 内置服务器，OPcache/FPM 超时/上传限制未对齐验证。
- MySQL 目标若仍为 5.6，则本轮 MySQL 8.4 结论不可直接套用。
- 测试库使用合成数据（商家 0、产品 `R39-TEST-0001`），无真实客户数据。

## 4. 结论边界

- 本轮证明：**应用代码在 PHP 8.5.13 下可原生运行**（已测路径），关键业务缺陷已修复，错误页符合要求。
- 本轮**不证明**：MySQL 5.6→8.4 生产迁移可安全执行；不证明生产就绪。
- 未标记 `DEMO_READY`、`FUNCTION_ACCEPTED`、`PRODUCTION_READY`、`RELEASE_APPROVED`。
