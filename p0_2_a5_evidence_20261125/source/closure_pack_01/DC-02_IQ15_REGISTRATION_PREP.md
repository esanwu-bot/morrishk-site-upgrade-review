# DC-02 · IQ-15 正式登记准备

| 项 | 值 |
|---|---|
| 文档编号 | REVIEW-P02-DC02-IQ15-20261125 |
| 版本 | v1.0（登记准备；**未正式登记、未生产验证**） |
| 日期 | 2026-11-25（Asia/Shanghai） |
| 上游 | `14_phase0_authority_adjudication/DECISION_REGISTER.md:36`（@27e62b1，IQ-15 行仍空） |
| 当前状态 | 值 `OWNER_SELECTED`；正式登记 `PENDING`；技术验证（隔离实例）`PASS`；生产验证 `NOT_TESTED` |

---

## 1. Owner 已选定的值（`OWNER_SELECTED`）

| 字段 | 值 |
|---|---|
| DB Engine | MySQL |
| Version | 8.4 LTS |
| Character Set | `utf8mb4` |
| Collation（首选验证候选） | `utf8mb4_0900_as_cs` |

> 以上为 Owner 决策选择的**目标值**；不等于正式登记完成，也不等于生产已部署。

---

## 2. 四级状态严格区分

| 层级 | 状态 | 说明 |
|---|---|---|
| Owner 已选定 | `OWNER_SELECTED` | 见 §1 |
| 正式登记 | **`PENDING`** | `DECISION_REGISTER.md:36` IQ-15 行仍为空；需授权签署人登记 |
| 技术验证（隔离实例） | `PASS`（仅 Collation 行为，见 `DC-03`） | MySQL 8.4.13 隔离实例；**非生产** |
| 生产环境验证 | **`NOT_TESTED`** | 未连接、未部署、未执行生产 DDL |

**不得**将"隔离实例验证通过"表述为"生产已验证"。

---

## 3. 正式登记表（待授权签署人填写，本轮不代填）

| 字段 | 目标值 | 登记状态 | 备注 |
|---|---|---|---|
| Engine | MySQL | 待登记 | Owner 已选 |
| Version | 8.4 LTS | 待登记 | 隔离实例实测为 8.4.13（patch 级证据，非生产声明） |
| Character Set | `utf8mb4` | 待登记 | |
| Default Collation | `utf8mb4_0900_as_cs`（候选） | 待登记 + 待 Owner 最终确认 | 隔离实例验证见 `DC-03` |
| 签署人 | — | 待指定 | 执行 Agent 不得代填 |
| 签署日期 | — | 待填 | 不得伪造 |
| 登记日期 | — | 待填 | 不得伪造 |

---

## 4. 缺失/待确认字段（先列明，不自行推断）

`DECISION_REGISTER.md:36` 的 IQ-15 仅定义"新表引擎与字符集"。以下字段在现有登记中**未定义**，需 Owner/运维补充确认，**不得由执行 Agent 推断**：

| # | 字段 | 状态 |
|---|---|---|
| 1 | 表存储引擎（如 InnoDB） | 未定义 |
| 2 | `sql_mode`（严格模式/零日期/分组等） | 未定义 |
| 3 | 默认时区（`time_zone`） | 未定义 |
| 4 | `lower_case_table_names` | 未定义 |
| 5 | 默认行格式与索引键长上限 | 未定义（隔离实例实测复合键 key_len=1028，仅作参考） |
| 6 | 连接层 charset/collation（client/connection/results） | 未定义 |
| 7 | 迁移/DDL 专用账号与最小权限 | 未定义 |
| 8 | 备份/恢复与 HA 要求 | 未定义 |
| 9 | 目标 schema/库名与部署位置 | 未定义 |

> 上述缺失项不阻塞"Collation 行为验证"，但**阻塞正式登记完成与生产部署**。

---

## 5. 结论

- IQ-15 值：`OWNER_SELECTED`。
- 正式登记：`PENDING`（登记行仍空，缺失字段已列明）。
- 技术验证：`PASS`（仅隔离实例 Collation 行为；见 `DC-03`）。
- 生产验证：`NOT_TESTED`。
- **不**关闭 P-02；**不**宣称生产数据库已验证；本轮未执行任何 DDL/迁移/部署。
