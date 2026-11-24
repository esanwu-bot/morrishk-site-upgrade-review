# 05 MySQL 8.4 Schema 迁移评估（只读）

测试库 `morrishk_r39`（utf8mb4 / utf8mb4_0900_ai_ci），结构来自 `04_database/01_schema.sql`（源 MySQL 5.6.50）+ `db/2026-11-24_cart_owner.sql`。**本轮未执行任何生产 DDL、未批量改引擎、未执行 utf8mb4 迁移。**

## 1. 表清单（31 张）

| 引擎 | 数量 | 说明 |
|---|---|---|
| MyISAM | 30 | 全部业务表（cart/product/category/news/…） |
| InnoDB | 1 | `snsii_product_so` |
| 排序规则 | 31 表 | `utf8mb3_general_ci` |

完整清单（表名/引擎/行数/数据与索引大小）：`evidence/mysql_schema_assessment.txt`。

## 2. 索引与字符集长度

| 表 | 索引 | 最大列字节（utf8mb3） | utf8mb4 估算 |
|---|---|---|---|
| `snsii_map` | `Url` | 600 | 800 |
| `snsii_info` | `Links` | 360 | 480 |
| `snsii_contact` | `Url` | 300 | 400 |
| `snsii_news` / `snsii_product_category` / `snsii_info_category` / `snsii_news_category` | `Links` | 300 | 400 |
| `snsii_track_order` | `Email` | 300 | 400 |

- 最大估算 800 B，远低于 InnoDB `DYNAMIC` 行格式 3072 B 前缀上限；**但**需确认生产表行格式与 `innodb_large_prefix`（8.0+ 默认满足）。
- `char(100)`/`varchar(200)` 字段转 utf8mb4 后仍可用，无需截断。
- 排序规则将从 `utf8mb3_general_ci` 变为 `utf8mb4_0900_ai_ci`，影响 `ORDER BY`/`DISTINCT`/唯一性比较，需要业务核对。

## 3. NOT NULL 且无默认值

| 表 | 数量 | 典型列 |
|---|---|---|
| `snsii_product` | 12 | `PartNumber`、`PartUrl`、`BigCat`、`UnitPrice`… |
| `snsii_news` | 8 | `Title`、`Links`… |
| `snsii_language` | 8 | — |
| `snsii_track_order` | 7 | — |
| `snsii_cart` | 7 | `AddDate`、`Contact`、`Phone`、`Email`、`Files`、`IP`、`Url` |
| 其他 | ≤6 | — |

MySQL 8.4 默认 `STRICT_TRANS_TABLES`：任何省略这些列的 INSERT 会直接报 `1364`。需逐表核对写入代码；本轮已确认 `snsii_cart` 由模型 `beforeSave` 补齐 `AddDate/AddTime/Files/Url/IP`。

## 4. ONLY_FULL_GROUP_BY

应用代码中 `GROUP BY`/`groupBy` 仅 **1 处**：

```
MfrController.php:67  ->groupBy('SmallCat') 且 SELECT 仅 SmallCat
```

该语句符合 `ONLY_FULL_GROUP_BY`，无改写需求。

## 5. 零日期/非法日期

数据/结构扫描涉及日期列：

| 表 | 列 | 类型 |
|---|---|---|
| `snsii_cart` | `AddDate` | date |
| `snsii_cf_logs` | `AddTime` | date |
| `snsii_product_hot` | `AddDate` | datetime |
| `snsii_product_stock` | `AddDate` | datetime |
| `snsii_product_time` | `Date` | date |

`NO_ZERO_DATE`/`NO_ZERO_IN_DATE` 在 8.4 默认开启；测试库为合成数据，未发现零日期。**生产数据需单独扫描**（建议迁移前 `WHERE AddDate = '0000-00-00'` 统计并清洗）。

## 6. MyISAM → InnoDB 评估

| 项 | 结论 |
|---|---|
| 事务能力需求 | `snsii_cart`（询价）、`snsii_product*`（写入）、`snsii_news` 等需要原子性；当前 MyISAM 无事务 |
| 锁表时间 | `ALTER TABLE ... ENGINE=InnoDB` 为整表重建（COPY），期间写阻塞；时长与数据量、磁盘 IO 线性相关 |
| 测试库 | 每表 0–2 行，转换 <1 s（无参考价值） |
| 生产估算 | 需按生产行数与 `data_length` 实测；**本轮无生产数据，无法给出可信时长** |
| 兼容风险 | 全文索引（若有）需改 InnoDB FULLTEXT；`AUTO_INCREMENT` 起始值需保留；`ROW_FORMAT` 需为 DYNAMIC/COMPRESSED |
| 建议 | 先在只读副本演练；按表分批、低峰执行；每批记录耗时与锁等待 |

## 7. utf8mb3 → utf8mb4 评估

| 项 | 结论 |
|---|---|
| 连接层 | `config/db.php` 固定 `charset=utf8`，必须同步改为 `utf8mb4`，否则仍按 3 字节交互 |
| 索引 | 见第 2 节，估算均在上限内；`char(32)` 等短列无影响 |
| 唯一约束 | `PartNumber`、`Links`、`Md5` 等唯一键需复核排序规则变化后的等价性 |
| ORDER BY | `_0900_ai_ci` 与 `_general_ci` 对重音/大小写排序不同，可能影响列表顺序 |
| 4 字节字符 | 当前 `utf8mb3` 无法保存 Emoji（Round 38 已实测 1366） |
| 建议 | 先改连接串 → 再逐表 `CONVERT TO CHARACTER SET utf8mb4` → 最后统一排序规则；每步回归 |

## 8. 明确未执行

- 生产库 DDL、批量引擎转换、批量字符集迁移、数据导入导出、备份恢复演练。
