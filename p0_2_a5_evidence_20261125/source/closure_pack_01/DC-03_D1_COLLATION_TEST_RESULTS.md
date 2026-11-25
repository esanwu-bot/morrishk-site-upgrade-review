# DC-03 · D-1 Collation 实例测试结果

| 项 | 值 |
|---|---|
| 文档编号 | REVIEW-P02-DC03-RESULTS-20261125 |
| 版本 | v1.0 |
| 日期 | 2026-11-25（Asia/Shanghai） |
| 实例 | MySQL Community Server **8.4.13**（隔离实例，`127.0.0.1:3317`） |
| 库 | `p02_collation_test`（测试专用） |
| SQL | `dc03_collation_test.sql` |
| 原始输出 | `dc03_collation_output.txt` |
| 结论（D-1 隔离测试套件） | **`PARTIAL`**（A.1–A.4/A.6 PASS；A.5 回滚双向验证 PARTIAL） |
| 生产 Collation 验证 | **`NOT_TESTED`** |

**状态细分（按 Reviewer 判定）**

```text
D1_COLLATION_BEHAVIOR_TEST = PASS
D1_COMPOSITE_INDEX_TEST = PASS
D1_INDEX_USAGE_TEST = PASS
D1_TRANSACTION_ROLLBACK_TEST = PARTIAL
D1_ISOLATED_TEST_SUITE = PARTIAL
D1_PRODUCTION_VALIDATION = NOT_TESTED
```

---

## 1. 环境实测（原始输出摘录）

```
mysql_version = 8.4.13
version_comment = MySQL Community Server - GPL
charset_server = utf8mb4
collation_server = utf8mb4_0900_ai_ci
```

Collation 元数据：

| Collation | Id | Default | Pad_attribute |
|---|---:|---|---|
| `utf8mb4_0900_ai_ci` | 255 | Yes | **NO PAD** |
| `utf8mb4_0900_as_cs` | 278 | | **NO PAD** |
| `utf8mb4_0900_bin` | 309 | | **NO PAD** |
| `utf8mb4_bin` | 46 | | **PAD SPACE** |

四张测试表实际 collation 与建表一致（`information_schema.TABLES`）。

---

## 2. 预期 vs 实际

| Case | `0900_as_cs` 预期/实际 | `utf8mb4_bin` 预期/实际 | `0900_bin` 预期/实际 | `0900_ai_ci` 预期/实际 |
|---|---|---|---|---|
| C1 基线 | 成功 / 成功 | 成功 / 成功 | 成功 / 成功 | 成功 / 成功 |
| C2 大小写 `abc-1` | 成功 / 成功 | 成功 / 成功 | 成功 / 成功 | 1062 / **1062** |
| C3 重音 `é` | 成功 / 成功 | 成功 / 成功 | 成功 / 成功 | 1062 / **1062** |
| C4 尾随空格 | 成功 / 成功 | 1062 / **1062** | 成功 / 成功 | 成功 / 成功 |
| C5 组合键 同MPN异Brand | 成功 / 成功 | 成功 / 成功 | 成功 / 成功 | 成功 / 成功 |
| C6 精确重复 | 1062 / **1062** | 1062 / **1062** | 1062 / **1062** | 1062 / **1062** |
| C7 回滚剩余行 | 0 / **0** | — | — | — |
| C8 索引 | BTREE 复合唯一 / **一致** | — | — | — |
| C9 行数 | 8 / **8** | 7 / **7** | 8 / **8** | 6 / **6** |

**预期与实际全部一致。**

关键原始行（SQL 行号为准；PowerShell 合并 stdout/stderr 可能导致错误行显示位置交错）：

- C2：`ERROR 1062 … 'abc-1-BrandX' for key 't_0900_ai_ci.uk_identity'`（SQL 行 63）
- C3：`ERROR 1062 … 'é-BrandX' for key 't_0900_ai_ci.uk_identity'`（SQL 行 78）
- C4：`ERROR 1062 … 'ABC-2 -BrandX' for key 't_bin.uk_identity'`（SQL 行 89）
- C6：`t_0900_as_cs`（行 114）、`t_bin`（115）、`t_0900_bin`（116）、`t_0900_ai_ci`（117）均 1062
- C7：`rollback_remaining = 0`
- C8：`uk_identity` = BTREE，`Seq_in_index` 1=`mpn_norm`、2=`brand_norm`，`key_len=1028`；`EXPLAIN` type=`const`，key=`uk_identity`，rows=1
- C9：`t_0900_as_cs=8`、`t_bin=7`、`t_0900_bin=8`、`t_0900_ai_ci=6`

> C4 中 `t_0900_as_cs` 的 `ABC-2` 与 `ABC-2␠` 两行在样例显示中看似相同（尾随空格不可见），但行数与 NO PAD 行为证明二者被视为不同值。

---

## 3. 判据核对（`utf8mb4_0900_as_cs`）

| 判据 | 结果 |
|---|---|
| 大小写区分（C2 不冲突） | PASS |
| 重音区分（C3 不冲突） | PASS |
| NO PAD：尾随空格可区分（C4 不冲突） | PASS |
| 精确重复触发 1062（C6） | PASS |
| 复合键同 MPN 异 Brand 允许（C5） | PASS |
| 索引 BTREE 复合唯一（C8） | PASS |
| 事务回滚有效（C7） | **PARTIAL**（仅证回滚后=0；缺事务内前态计数） |
| 元数据/字符集正确（ENV） | PASS |

**D-1 隔离测试套件 = `PARTIAL`。** A.1–A.4/A.6 通过；**A.5 不充分**，不得用其余项抵消。

### 3.1 A.5 缺口（未补测）

现有 C7 仅为：`START TRANSACTION` → `INSERT` → `ROLLBACK` → `SELECT COUNT`（=0）。它支持"回滚后记录不存在"，但**未记录**事务内插入后的计数，无法完成双向验证。

完整证据应为：事务前计数 0 → 事务内插入后计数 1 → 回滚后计数 0。

补齐需 Owner 单独授权隔离实例补测；**补测前 A.5 不得标为 PASS**（本轮未擅自执行）。

---

## 4. 观察与限制

1. `utf8mb4_bin` 为 **PAD SPACE**：尾随空格被视为相等（C4 冲突）。若选它，需依赖应用层 trim（D-2 已含 trim），但仍与 `0900_*` 的 NO PAD 行为不同。
2. `utf8mb4_0900_ai_ci` 为大小写/重音不敏感，**不适合**作为身份键 collation（会静默合并）。
3. `utf8mb4_0900_as_cs` 与 `utf8mb4_0900_bin` 均 NO PAD、大小写/重音敏感；二者在本测试中行为一致。首选 `utf8mb4_0900_as_cs` 的依据成立。
4. 本结果**仅代表隔离实例**（8.4.13）；**生产 Collation 验证 `NOT_TESTED`**，不得表述为生产已验证。
5. 本轮未冻结 Collation；D-1 仍为 Owner 候选（`OWNER_DECIDED` 候选），契约不标 `FROZEN`。
6. **测试套件整体为 `PARTIAL`**：A.5 事务回滚仅验证后态；补齐前不得视为完整通过。

---

## 5. 复现

见 `DC-03_D1_COLLATION_TEST_SPEC.md §7`；SQL 与原始输出见同目录。测试实例已关闭（`127.0.0.1:3317` 无监听），测试库位于独立 datadir，属临时产物，不属于仓库。
