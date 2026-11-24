# R2.2.8 复核回应（幂等指纹与导入原子事务）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-021 |
| 版本 | v1.0-R2.2.8 |
| 日期 | 2026-11-24 |
| 状态 | **DESIGN_PACKAGE_R2_2_8_SUBMITTED** |
| 性质 | 仅收敛同 key 指纹冲突与导入原子事务；不是架构批准、不是实现、不是契约冻结 |
| 基线 | 分支 `docs/sessionb-product-identity-global-id-design`，父提交 `90d18a861f7203c684ab4d7ed022206c01cf6a37`；独立追加提交 |
| 范围 | 04/06/07 与哈希清单 |

## 1. A：same idempotency_key 的请求内容冲突

| 项 | 内容 |
|---|---|
| Reviewer 原问题 | 同 key 重试未定义请求内容不一致时的行为，可能覆盖原事件或二次写入 |
| 修订前冲突 | 幂等键与内容指纹混用；同 key 不同内容无明确返回 |
| 修订后规则 | `idempotency_key` 仍为请求级不透明标识，唯一作用域 `(tenant_id, site_id, idempotency_key)`；首次请求保存 `request_fingerprint` 与 `request_fields` 快照（覆盖 `document_sha256`/`requested_mpn`/`brand_norm`/`normalizer_version`/`operation`）；同 tenant/site/key 指纹相同 → 返回原 event 的 `result`/`pending_id`/`conflict_id`；指纹不同 → `IDEMPOTENCY_CONFLICT`，不覆盖原事件、不二次写入、不新建 pending/conflict/`global_product`；不同 tenant/site 即使 key 与内容相同也不冲突；指纹只用于重试一致性校验，不替代幂等键、不用于合并不同 key |
| 修改章节 | `04` §3 `product_import_event` / §8；`06` §4 / §6；`07` V-26 说明、V-103/V-104 |

## 2. B：product_import_event 与 pending/conflict 的原子创建顺序

| 项 | 内容 |
|---|---|
| Reviewer 原问题 | 未明确 event 与 pending/conflict 的创建顺序及失败回滚，可能留下半成品 |
| 修订后规则 | 普通导入原子流程：认证上下文取 tenant/site → 尝试插入 event（含幂等键与指纹）→ 唯一冲突则读取权威 event 并按指纹分支 → 首次请求继续解析（MATCHED 回写 product_uid；PENDING 建 pending 并回写；CONFLICT 建 pending/conflict 并回写；REJECTED 记录）→ event/pending/conflict/关联/审计同事务提交 → 任一失败整体回滚 → 普通导入不得写 `global_product`；若采用延迟约束等不同机制，必须提供等价原子性保证 |
| 修改章节 | `04` §8（普通导入原子流程伪代码）；`06` §6（原子性说明） |
| 新增向量 | V-105 首次请求 pending/conflict 阶段故障 → 整体回滚、无半成品、重试可完成 |

## 3. C：新增测试向量

| # | 覆盖 |
|---|---|
| V-103 | 同 Tenant/Site/key、指纹相同 → 返回原 event 结果，不重复写入 |
| V-104 | 同 Tenant/Site/key、指纹不同 → `IDEMPOTENCY_CONFLICT`，原事件不变 |
| V-105 | 首次请求 pending/conflict 阶段故障 → 事务整体回滚，重试可完成 |

- V-11、V-26、V-48 语义保持不变（V-26 仅补充指纹说明）。
- V-103…V-105 与既有 V-77…V-102 全部标记设计测试、未执行。

## 4. 修改文件与章节

| 文件 | 章节 |
|---|---|
| `04_GLOBAL_ID_REGISTRY.md` | §3 `product_import_event`（指纹字段）；§8 幂等键与原子流程 |
| `06_API_AND_DATABASE_IMPACT.md` | §4 表结构；§6 幂等/并发/原子性 |
| `07_TEST_VECTORS.md` | V-26 说明；新增 §2.8 V-103…V-105 |
| `00_DESIGN_OVERVIEW.md` | 阅读顺序加入 `21`；摘要 |
| `21_R2_2_8_REVIEW_RESPONSE.md` | 本文件 |

## 5. 一致性核对

| 检查项 | 结果 |
|---|---|
| 同 key 指纹相同返回原结果 | 04 §8、06 §6、V-103 一致 |
| 同 key 指纹不同返回 `IDEMPOTENCY_CONFLICT` | 04 §8、06 §4/§6、V-104 一致 |
| 不同 tenant/site 不冲突 | 04 §8、V-26 清单一致 |
| event→pending/conflict 原子创建与回滚 | 04 §8、06 §6、V-105 一致 |
| 普通导入不写 `global_product` | 04 §4/§8、06 §8.11、10 B-20 一致 |
| V-11/V-26/V-48 语义 | 未改变范围 |
| 83 项证据 | 未修改；Git Blob 与基线一致 |
| 决策状态 | 全部 `PROPOSED_NOT_APPROVED` |

## 6. 尚未解决的限制

- 具体 DDL/延迟约束/事务隔离实现不在本轮。
- 不同 document/import 的身份级 pending 去重仍待决。
- 内容指纹的 canonical 序列化格式与哈希算法需实现期确定。

## 7. 状态

- 本轮：`DESIGN_PACKAGE_R2_2_8_SUBMITTED`。
- 未标记：`ARCHITECTURE_APPROVED` / `CONTRACT_FROZEN` / `P0_2_CLOSED` / `BUSINESS_API_IMPLEMENTATION_AUTHORIZED` / `PRODUCTION_READY`。
- 等待 Reviewer 独立复核。
