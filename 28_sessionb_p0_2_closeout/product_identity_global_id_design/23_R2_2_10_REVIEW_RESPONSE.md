# R2.2.10 复核回应（事务恢复与快照刷新区分）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-023 |
| 版本 | v1.0-R2.2.10 |
| 日期 | 2026-11-24 |
| 状态 | **DESIGN_PACKAGE_R2_2_10_SUBMITTED** |
| 性质 | 仅修正 SAVEPOINT 与快照刷新语义；不是架构批准、不是实现、不是契约冻结 |
| 基线 | 分支 `docs/sessionb-product-identity-global-id-design`，父提交 `0aeb81eb53095e1b66609163297be046c3c422df`；独立追加提交 |
| 范围 | 04/06/07/22 与哈希清单 |

## 1. Reviewer 原问题

| 项 | 内容 |
|---|---|
| 原问题 | R2.2.9 把 `ROLLBACK TO SAVEPOINT` 描述为在 REPEATABLE READ/SERIALIZABLE 下重新读取的途径 |
| 事实 | PostgreSQL 的 SAVEPOINT 回滚只恢复语句/事务错误状态，**不刷新事务级快照**；高隔离级别下旧快照仍看不到竞争方已提交行 |

## 2. 修订后的规则

### READ COMMITTED

1. `INSERT ... ON CONFLICT DO NOTHING RETURNING` 遇并发竞争；
2. 竞争结束后使用新 SQL statement 读取权威 event；
3. 新语句获得新的 statement snapshot，可读取竞争事务已提交记录；
4. 按 `request_fingerprint` 返回原结果或 `IDEMPOTENCY_CONFLICT`。

### REPEATABLE READ / SERIALIZABLE

1. 若当前事务快照看不到竞争方刚提交的 event，或数据库返回 serialization failure；
2. 必须回滚整个事务；
3. 在新事务、新快照中重新读取权威 event；
4. 不得在旧事务中反复 SELECT 并误判记录不存在；
5. 不得因快照不可见而继续创建第二条 event。

### SAVEPOINT 职责

1. 只用于恢复唯一约束冲突导致的语句/事务错误状态；
2. `ROLLBACK TO SAVEPOINT` 不刷新 REPEATABLE READ / SERIALIZABLE 的事务快照；
3. READ COMMITTED 下，SAVEPOINT 回滚后可执行新语句读取；
4. 更高隔离级别下，仍需新事务获取新快照。

## 3. 未改变

- 幂等权威表 `product_import_event`；
- 唯一键 `(tenant_id, site_id, idempotency_key)`；
- `request_fingerprint` 字段及覆盖范围；
- 同 key 指纹相同返回原结果、不同返回 `IDEMPOTENCY_CONFLICT`；
- 不同 Tenant/Site 不冲突；不同 key 不自动合并；
- event、pending/conflict、关联与审计的原子事务；
- A 提交、A 回滚两条并发路径；
- V-11、V-26、V-48、V-103…V-107 的原有语义。

## 4. 测试向量

V-106/V-107 编号与结果定义不变，仅补充隔离级别断言（设计断言、未执行）：
1. READ COMMITTED：新语句读取已提交 event；
2. REPEATABLE READ：旧快照不可见时结束旧事务、新事务读取；
3. SERIALIZABLE：serialization failure 时整事务重试；
4. SAVEPOINT 不得被描述为刷新快照。

## 5. 修改文件与章节

| 文件 | 章节 |
|---|---|
| `04_GLOBAL_ID_REGISTRY.md` | §8 快照与可见性、SAVEPOINT 职责、隔离级别 |
| `06_API_AND_DATABASE_IMPACT.md` | §6 同 key 冲突处理 |
| `07_TEST_VECTORS.md` | §2.8 V-106/V-107 隔离级别断言 |
| `22_R2_2_9_REVIEW_RESPONSE.md` | 隔离级别表述修正 |
| `00_DESIGN_OVERVIEW.md` | 阅读顺序加入 `23`；摘要 |
| `23_R2_2_10_REVIEW_RESPONSE.md` | 本文件 |

## 6. 一致性核对

| 检查项 | 结果 |
|---|---|
| SAVEPOINT 不再被描述为刷新快照 | 04 §8、06 §6、07、22 一致 |
| RC 使用新语句读取 | 04 §8、06 §6、V-106/107 断言一致 |
| RR/SERIALIZABLE 回滚整事务并新事务重读 | 04 §8、06 §6、V-106/107 断言一致 |
| 幂等权威/唯一键/指纹/原子事务不变 | 未改变 |
| 83 项证据 | 未修改；Git Blob 与基线一致 |
| 决策状态 | 全部 `PROPOSED_NOT_APPROVED` |

## 7. 尚未解决的限制

- 具体隔离级别配置、重试次数/退避与连接池实现需实现期确定。
- 跨 document/import 身份级 pending 去重仍待决。

## 8. 状态

- 本轮：`DESIGN_PACKAGE_R2_2_10_SUBMITTED`。
- 未标记：`ARCHITECTURE_APPROVED` / `CONTRACT_FROZEN` / `P0_2_CLOSED` / `BUSINESS_API_IMPLEMENTATION_AUTHORIZED` / `PRODUCTION_READY`。
- 等待 Reviewer 独立复核。
