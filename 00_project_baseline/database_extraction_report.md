# morrishk.net 老站数据库结构抽取报告

## 1. 源文件

| 项目 | 值 |
|---|---|
| 文件路径 | `E:\data\morris_2024-11-30_14-01-50_mysql_data_VsRoT.sql\morris_2024-11-30_14-01-50_mysql_data_VsRoT.sql` |
| 文件大小 | 47820894346 字节（44.54 GiB） |
| SHA-256 | `7a59ac156676692fd39e4cc2ce0bda1a2039755d7e91bf9d06a31e0576266717` |
| 源数据库 | morris |
| 源版本 | MySQL 5.6.50-log，mysqldump 10.13 |
| dump 生成时间 | 2024-11-30 14:12:41（文件尾注释） |

## 2. 抽取过程

| 项目 | 值 |
|---|---|
| 抽取时间 | 2026-11-15 20:46:46 |
| 抽取工具 | 自研流式扫描器 `tools/pass1_scan.py` |
| Python | 3.13.14 |
| 平台 | Windows-10-10.0.19045-SP0 |
| 扫描耗时 | 495.0 秒 |
| 平均吞吐 | 96.6 MB/s |
| 处理方式 | 单遍流式读取 8 MiB 分块，按 mysqldump 语句边界状态机解析，同时增量计算 SHA-256 |
| 读入总行数 | 46788 |

> 说明：文件 47.8 GB，未整体载入内存，未使用"正则删除 INSERT"这类会破坏语句边界的做法。
> 解析器按 `;`（或 DELIMITER 切换后的终止符）识别语句结束，INSERT 行仅解析前缀以登记表名，
> 正文直接丢弃，因此结构文件不可能混入业务数据。

## 3. 对象统计

| 项目 | 数量 |
|---|---|
| 表总数 | 31 |
| 　引擎 MyISAM | 30 |
| 　引擎 InnoDB | 1 |
| 　字符集 utf8 | 31 |
| 　排序规则 utf8_general_ci(隐式) | 31 |
| 字段总数 | 210 |
| 索引总数 | 100 |
| 主键数 | 30 |
| 视图 | 0 |
| 触发器 | 0 |
| 存储过程 | 0 |
| 函数 | 0 |
| 事件 | 0 |
| 外键约束 | 0 |
| 分区表 | 0 |
| 视图占位结构（已剔除） | 0 |

## 4. 完整性校验

| 校验项 | 结果 |
|---|---|
| 01_schema.sql 中的 INSERT/REPLACE 语句 | 0 条 ✅ 无 |
| 01_schema.sql 最长行 | 83 字符 ✅ 正常（DDL 量级） |
| 超长字符串字面量（>300 字符） | 0 处 ✅ 无 |
| 无法解析的 SQL 片段 | 0 处 ✅ 无 |
| 语句截断/超限中止 | 0 次 |
| 交叉校验：字段数（解析 vs 原始 DDL） | 210 vs 210 ✅ 一致 |
| 交叉校验：索引数（解析 vs 原始 DDL） | 100 vs 100 ✅ 一致 |
| 交叉校验：NOT NULL 属性 | 0 个字段不一致 ✅ 全部一致 |
| 交叉校验：DEFAULT 值 | 0 个字段不一致 ✅ 全部一致 |
| 超大行（>256KB，均为 INSERT） | 45807 行 |

## 5. 结论

1. **结构抽取完整**：31 张表的 CREATE TABLE、字段、索引、表选项全部落入 `01_schema.sql`，
   共 210 个字段、100 个索引、30 个主键。字段的 NOT NULL 属性已逐表与原始 DDL 交叉校验，
   31 张表全部一致；210 个字段的 NOT NULL 与 DEFAULT 亦与原始 DDL 逐字段比对通过。
2. **无业务数据混入**：结构文件中 INSERT/REPLACE 语句为 0 条，最长行 83 字符，
   无超长字符串字面量，可确认是纯 DDL。
3. **非表对象**：本 dump 未包含视图/触发器/存储过程/函数/事件（导出时未加 --routines --events），
   因此没有 DEFINER / SQL SECURITY 相关迁移风险。
4. **兼容性**：共识别 16 项风险，其中 HIGH 2 项、MED 6 项，HIGH 项为 **字符集**、**存储引擎**，
   详见 `06_compatibility_scan.txt`。

## 6. 表数据量线索（来自 INSERT 语句数，非精确行数）

| 表名 | INSERT 语句数 | 有无数据 |
|---|---|---|
| `snsii_product_cache` | 36881 | YES |
| `snsii_product` | 7889 | YES |
| `snsii_map` | 613 | YES |
| `snsii_product_search` | 387 | YES |
| `snsii_product_time_temp` | 27 | YES |
| `snsii_product_time_list` | 4 | YES |
| `snsii_attr_name_lang` | 3 | YES |
| `snsii_supplier` | 2 | YES |
| `snsii_ad` | 1 | YES |
| `snsii_attr_name` | 1 | YES |

> 注意：mysqldump 默认使用批量 INSERT（一条语句含多行），因此语句数 ≠ 行数。
> 本项仅用于判断该表是否被导出过数据，精确行数需另做数据体检。

## 7. 交付物

| 文件 | 内容 |
|---|---|
| `01_schema.sql` | 纯 DDL，含会话 SET、DROP/CREATE TABLE、索引、表选项 |
| `02_table_inventory.csv` | 表级清单：引擎/字符集/字段数/索引数/主键/AUTO_INCREMENT/是否有数据 |
| `03_column_inventory.csv` | 字段级清单：类型/长度/可空/默认值/字符集/注释 |
| `04_index_inventory.csv` | 索引级清单：类型/唯一性/字段及顺序/前缀长度 |
| `05_other_objects.sql` | 视图/触发器/过程/函数/事件/外键（本库为空，附判定依据） |
| `06_compatibility_scan.txt` | 5.6→8.4 兼容性风险清单与逐表标记 |
| `07_extraction_report.md` | 本报告 |

