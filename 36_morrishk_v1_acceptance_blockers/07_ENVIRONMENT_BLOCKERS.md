# 07 目标环境与数据库兼容性

## 1. 目标版本可得性

| 目标 | 本机 | 判定 |
|---|---|---|
| PHP 7.4.33 | 仅有 7.3.4 / **7.4.3** / 8.0.2 | **BLOCKED** |
| MySQL 5.6.50 | 仅有 5.7.26 / 8.0.12 | **BLOCKED** |

所有运行时结论建立在 **PHP 7.4.3 + MySQL 8.0.12**。不得表述为「生产 7.4.33 / 5.6.50 已验证」。

## 2. 标准 Composer 安装

已在干净副本以 PHP 7.4.3 完整跑通：

- `71 installs, 0 updates, 0 removals`
- `Generating autoload files`
- `google/apiclient-services` 25,375 文件由 Composer 解压
- lock 哈希未变

因此「不得用手工 vendor 冒充标准安装」一项：**本轮已用标准安装副本复跑核心回归**（`clean_install_matrix.txt`）。

## 3. MySQL 5.6 兼容性

### 3.1 静态 DDL 检查（`04_database/01_schema.sql`）

| 特性 | 结果 |
|---|---|
| `JSON` 列类型 | 0（JSON 内容存 `longtext`） |
| `GENERATED ALWAYS` 生成列 | 0 |
| `CHECK (...)` 约束 | 0 |
| `utf8mb4` | 0（使用 `utf8`） |

结论：DDL 层面未发现 MySQL 5.6 不支持的特性。

### 3.2 运行时差异（MySQL 8 实测）

- 后台页面在默认 `sql_mode` 下报 **1055**：
  `Expression #1 of ORDER BY clause is not in GROUP BY clause ...`
- 测试副本通过 `on afterOpen` 会话级移除 `ONLY_FULL_GROUP_BY` 后，后台页面恢复 200。
- MySQL 5.6 默认不启用 `ONLY_FULL_GROUP_BY`，因此该问题在目标版本大概率不出现；但**未在 5.6.50 实测，不能记为 PASS**。

## 4. 数据库测试

| 项 | 结果 |
|---|---|
| 建表（31 表） | PASS（MySQL 8.0.12） |
| 询价写入（带/不带附件） | PASS |
| 附件登记（Files 路径） | PASS |
| 后台列表查询 | PASS（放宽 sql_mode 后） |
| MySQL 5.6.50 实跑 | **NOT_TESTED / BLOCKED** |

## 5. 结论

- PHP：7.4 系列功能验证 PASS；精确 7.4.33 **BLOCKED**。
- MySQL：8.0.12 功能验证 PASS；5.6.50 **BLOCKED**（仅静态 DDL 兼容 + 行为推断）。
- Composer：标准安装 PASS。
