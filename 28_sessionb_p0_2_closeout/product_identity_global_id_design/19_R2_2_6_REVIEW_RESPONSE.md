# R2.2.6 复核回应（V-26 幂等键边界）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-019 |
| 版本 | v1.0-R2.2.6 |
| 日期 | 2026-11-24 |
| 状态 | **DESIGN_PACKAGE_R2_2_6_SUBMITTED** |
| 性质 | 仅修正 V-26 幂等键边界；不是架构批准、不是实现、不是契约冻结 |
| 基线 | 分支 `docs/sessionb-product-identity-global-id-design`，父提交 `4945714b38b5f683fe5fa2912cbd3c95e59fdca7`；独立追加提交 |
| 范围 | 仅 `07_TEST_VECTORS.md` V-26、`04` §5 对应行与哈希清单 |

## 1. V-26 修订

| 项 | 内容 |
|---|---|
| Reviewer 原问题 | V-26 未说明两个并发请求是否使用相同 `idempotency_key`，与 V-11 的 pending 去重待决规则存在边界歧义 |
| 修改前 | “同身份两并发请求，均缺 variant；只产生一个冲突记录；幂等键/唯一约束防重复；返回同一冲突” |
| 修改后 | 区分两种情形：**(A) same `idempotency_key`** → 返回同一 pending/conflict，不得重复创建，不创建 `global_product`；**(B) different `idempotency_key`** → 不得自动合并为一个 pending/conflict，跨 document/import 去重标记为**待决**，不创建 `global_product` |
| 幂等键作用域 | 请求级：`(tenant_id, site_id, idempotency_key)`；由唯一约束 + 事务竞争保证 same key 只产生一条结果 |
| 修改文件 | `07_TEST_VECTORS.md` V-26 与说明；`04_GLOBAL_ID_REGISTRY.md` §5 对应行 |

## 2. 相关规则一致性

| 检查项 | 结果 |
|---|---|
| `04` §5 same `idempotency_key` 返回同一 `pending_id` | 保持，并补充 different key 行 |
| V-11 跨 document/import 去重仍待决 | 保持 |
| V-26 不再隐含不同幂等键自动合并 | 已显式区分 A/B |
| `identity_conflict` 与 `identity_pending` 关联关系 | 未改变 |
| `PENDING_CREATED` / `PENDING_UPDATED` / `MATCHED` 定义 | 未改变 |
| V-77…V-102 | 全部保持未执行 |

## 3. 文件变更

| 文件 | 变更 |
|---|---|
| `00_DESIGN_OVERVIEW.md` | v2.8-R2.2.6；阅读顺序加入 `19`；摘要 |
| `04_GLOBAL_ID_REGISTRY.md` | v2.7-R2.2.6；§5 幂等行拆分 same/different key |
| `07_TEST_VECTORS.md` | v2.8-R2.2.6；V-26 修订与说明 |
| `19_R2_2_6_REVIEW_RESPONSE.md` | 本文件（新增） |
| `SHA256SUMS` / `../DESIGN_AND_TEST_SHA256SUMS.txt` | 重新生成 |

## 4. 未改变

- 未修改 Ds Bit 源码、OpenAPI、75 矩阵、数据库、OAuth、生产环境。
- `test_evidence_83/` 完全不变。
- 未标记任何批准状态。

## 5. 状态

- 本轮：`DESIGN_PACKAGE_R2_2_6_SUBMITTED`。
- 未标记：`ARCHITECTURE_APPROVED` / `CONTRACT_FROZEN` / `P0_2_CLOSED` / `BUSINESS_API_IMPLEMENTATION_AUTHORIZED` / `PRODUCTION_READY`。
- 等待 Reviewer 独立复核。
