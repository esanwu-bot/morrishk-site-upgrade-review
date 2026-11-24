# R2.2.7 复核回应（幂等键作用域与数据库唯一约束统一）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-020 |
| 版本 | v1.0-R2.2.7 |
| 日期 | 2026-11-24 |
| 状态 | **DESIGN_PACKAGE_R2_2_7_SUBMITTED** |
| 性质 | 仅统一请求幂等键语义与唯一约束；不是架构批准、不是实现、不是契约冻结 |
| 基线 | 分支 `docs/sessionb-product-identity-global-id-design`，父提交 `12c60eb670886b099deb7fe24f5e720205336299`；独立追加提交 |
| 范围 | 04/06/03/07 幂等键相关内容与哈希清单 |

## 1. Reviewer 原问题与修订前冲突

| 项 | 内容 |
|---|---|
| Reviewer 原问题 | R2.2.6 已定义幂等作用域 `(tenant_id, site_id, idempotency_key)`，但表结构仍是 `idempotency_key unique`；`04 §8` 仍把内容指纹当幂等键，存在两个幂等权威来源 |
| 修订前冲突 | `identity_pending` 与 `product_import_event` 各自带单列 UNIQUE，互相矛盾；内容指纹与请求幂等键混用 |

## 2. 修订后的规则

### A. 请求幂等键语义

- `idempotency_key` 是**请求级不透明标识**，不是内容指纹；
- 唯一作用域：`UNIQUE (tenant_id, site_id, idempotency_key)`；
- `tenant_id`/`site_id` 来自可信服务端认证上下文，不接受客户端伪造；
- 内容指纹（`document_sha256`/`requested_mpn`/`brand_norm`/`normalizer_version`/`operation`）与请求幂等键是不同概念，不得混用；
- 不同 key 不得自动合并；相同 key 重复请求必须返回同一请求结果。

### B. 唯一约束与权威来源

| 表 | 修订后 |
|---|---|
| `product_import_event` | 请求幂等权威：`UNIQUE (tenant_id, site_id, idempotency_key)`；记录 `result`/`pending_id`/`conflict_id` |
| `identity_pending` | 移除 `idempotency_key` 与单列 UNIQUE；增加 `created_by_import_event_id` FK；不重复承担幂等键 |
| `identity_conflict` | 继续通过 `pending_id` 关联；不维护幂等键 |
| `06` 表结构 | `identity_pending` 改为 `unique(tenant_id, site_id, pending_id)` + FK；`product_import_event` 改为复合唯一 |

- 不存在两个互相矛盾的幂等权威：`product_import_event` 为唯一权威，pending/conflict 只关联。

### C. 并发事务

- same key 并发：唯一约束竞争；失败方读取已提交的权威 event，返回同一 `result`/`pending_id`/`conflict_id`；
- 不产生重复 pending/conflict，不创建 `global_product`；
- 事务失败可重试，重试命中同一权威结果；
- different key：不得自动合并；跨 document/import 身份级去重仍为**待决**；不创建 `global_product`。

### D. 测试向量

V-26 校验方法改为 6 项清单（全部未执行）：
1. 同 Tenant、同 Site、相同 key 并发 → 仅一条权威 event 结果；
2. 同 Tenant、不同 Site、相同 key → 互不冲突；
3. 不同 Tenant、相同 key → 互不冲突；
4. 同 Tenant、同 Site、不同 key、相同身份 → 不得自动合并；
5. 同 key 重试 → 返回原 event/result/pending_id 或 conflict_id；
6. 数据库唯一约束实际拒绝重复 `(tenant_id, site_id, idempotency_key)`。

V-11 语义保持不变。

## 3. 修改文件与章节

| 文件 | 章节/内容 |
|---|---|
| `03_PRODUCT_IDENTITY_MODEL.md` | §4.2：pending 移除幂等键，增加 `created_by_import_event_id`；reason 补齐 `PENDING_NEW_IDENTITY` |
| `04_GLOBAL_ID_REGISTRY.md` | §3 `identity_pending`/`product_import_event`；§8 幂等键语义与并发 |
| `06_API_AND_DATABASE_IMPACT.md` | §4 表结构；§6 幂等/并发 |
| `07_TEST_VECTORS.md` | V-26 及 6 项校验清单；V-48 输入改为复合键 |
| `00_DESIGN_OVERVIEW.md` | 阅读顺序加入 `20`；摘要 |
| `20_R2_2_7_REVIEW_RESPONSE.md` | 本文件 |

## 4. 一致性核对

| 检查项 | 结果 |
|---|---|
| `idempotency_key` 仅请求级、作用域含 tenant/site | 04 §8、06 §4/§6 一致 |
| 无单列 `UNIQUE (idempotency_key)` 残留 | 04/06 已清理 |
| 权威来源唯一 | `product_import_event`；pending/conflict 仅关联 |
| same key 并发/重试返回同一结果 | 04 §8、06 §6、V-26 清单一致 |
| different key 不自动合并、待决 | V-11、V-26 一致 |
| V-77…V-102 | 全部保持未执行 |
| 83 项证据 | 未修改；Git Blob 与基线一致 |
| 决策状态 | 全部 `PROPOSED_NOT_APPROVED` |

## 5. 尚未解决的限制

- 具体 DDL/索引与事务实现不在本轮。
- 不同 document/import 的身份级 pending 去重仍待决。
- 历史数据若存在重复幂等键，需迁移清洗方案。

## 6. 状态

- 本轮：`DESIGN_PACKAGE_R2_2_7_SUBMITTED`。
- 未标记：`ARCHITECTURE_APPROVED` / `CONTRACT_FROZEN` / `P0_2_CLOSED` / `BUSINESS_API_IMPLEMENTATION_AUTHORIZED` / `PRODUCTION_READY`。
- 等待 Reviewer 独立复核。
