# R2.2.9 复核回应（唯一键竞争的事务语义）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-022 |
| 版本 | v1.1-R2.2.10（隔离级别表述修正） |
| 日期 | 2026-11-24 |
| 状态 | **DESIGN_PACKAGE_R2_2_9_SUBMITTED** |
| 性质 | 仅明确唯一键竞争的冲突安全机制与并发可见性；不是架构批准、不是实现、不是契约冻结 |
| 基线 | 分支 `docs/sessionb-product-identity-global-id-design`，父提交 `c3df466bf69f9dd5fbe2784dcee5417696b6fa69`；独立追加提交 |
| 范围 | 04/06/07 与哈希清单 |

## 1. Reviewer 原问题

| 项 | 内容 |
|---|---|
| 原问题 | R2.2.8 伪代码写成“INSERT 抛唯一冲突后在同一失败事务中 SELECT”，未给出冲突安全机制，也未说明快照/重试 |
| 影响 | 在 PostgreSQL 中唯一冲突会使事务进入 aborted 状态，后续 SELECT 失败；REPEATABLE READ 下旧快照可能看不到竞争方刚提交的行 |

## 2. 修订后规则

### 冲突安全机制（二选一，必须明确实现）

1. `INSERT ... ON CONFLICT (tenant_id, site_id, idempotency_key) DO NOTHING RETURNING event_id`；返回 0 行时用**新语句**读取权威 event；
2. `SAVEPOINT sp; INSERT ...;` 捕获唯一冲突后 `ROLLBACK TO SAVEPOINT sp;`，再用新语句读取。

不得使用“普通 INSERT 抛异常后在同一失败事务中直接 SELECT”。

### 并发可见性与重试

1. A 先插入 event 未提交；
2. B 同 Tenant/Site/key 到达，遇到唯一键竞争；
3. B 等待 A 提交或回滚；
4. A 提交 → B 以新语句/新事务读取已提交 event，比较 `request_fingerprint`：相同返回原 `result`/`pending_id`/`conflict_id`；不同返回 `IDEMPOTENCY_CONFLICT`；
5. A 回滚 → B 接管首次创建，最终只有一条权威 event，pending/conflict 与 event 一致，无半成品。

### 隔离级别

- 推荐 `READ COMMITTED`；新语句可看到竞争方已提交行；
- `REPEATABLE READ`/`SERIALIZABLE` 下事务快照不因新语句或 `ROLLBACK TO SAVEPOINT` 刷新；若看不到竞争方已提交 event 或遇到 serialization failure，必须回滚整个事务，在新事务/新快照中重读；
- 不得因“当前快照看不到”误判无记录并继续创建；重试耗尽返回可重试错误（`RETRYABLE_CONFLICT`），不得继续创建。

## 3. 修改文件与章节

| 文件 | 章节 |
|---|---|
| `04_GLOBAL_ID_REGISTRY.md` | §8 普通导入原子流程伪代码、冲突安全机制、并发 A/B、隔离级别与重试 |
| `06_API_AND_DATABASE_IMPACT.md` | §6 同 key 唯一冲突处理 |
| `07_TEST_VECTORS.md` | 新增 V-106/V-107 |
| `00_DESIGN_OVERVIEW.md` | 阅读顺序加入 `22`；摘要 |
| `22_R2_2_9_REVIEW_RESPONSE.md` | 本文件 |

## 4. 新增测试向量

| # | 覆盖 |
|---|---|
| V-106 | 同 key 并发、A 提交：B 等待后读取；指纹相同/不同分别返回原结果/`IDEMPOTENCY_CONFLICT` |
| V-107 | 同 key 并发、A 回滚：B 接管首次创建；仅一条权威 event；pending/conflict 一致 |

- V-103…V-107 全部标记设计测试、未执行。
- V-11、V-26、V-48、V-103…V-105 原语义保持不变。

## 5. 一致性核对

| 检查项 | 结果 |
|---|---|
| 不再使用失败事务内 SELECT | 04 §8、06 §6 一致 |
| 冲突安全机制明确 | `ON CONFLICT DO NOTHING RETURNING` / SAVEPOINT |
| A 提交场景 | 04 §8、V-106 一致 |
| A 回滚场景 | 04 §8、V-107 一致 |
| 高隔离级别快照处理 | 回滚整个事务并在新事务/新快照重读；SAVEPOINT 不刷新快照 |
| 83 项证据 | 未修改；Git Blob 与基线一致 |
| 决策状态 | 全部 `PROPOSED_NOT_APPROVED` |

## 6. 尚未解决的限制

- 具体超时/退避参数、SAVEPOINT 与连接池实现需实现期确定。
- 跨 document/import 身份级 pending 去重仍待决。

## 7. 状态

- 本轮：`DESIGN_PACKAGE_R2_2_9_SUBMITTED`。
- 未标记：`ARCHITECTURE_APPROVED` / `CONTRACT_FROZEN` / `P0_2_CLOSED` / `BUSINESS_API_IMPLEMENTATION_AUTHORIZED` / `PRODUCTION_READY`。
- 等待 Reviewer 独立复核。
