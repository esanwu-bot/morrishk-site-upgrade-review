# R2.2.5 复核回应（V-11 语义修正）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-018 |
| 版本 | v1.0-R2.2.5 |
| 日期 | 2026-11-24 |
| 状态 | **DESIGN_PACKAGE_R2_2_5_SUBMITTED** |
| 性质 | 仅修正 V-11 并发导入向量；不是架构批准、不是实现、不是契约冻结 |
| 基线 | 分支 `docs/sessionb-product-identity-global-id-design`，父提交 `54f79574688c350448c2ce414cece62a5b204778`；独立追加提交 |
| 范围 | 仅 `07_TEST_VECTORS.md` V-11 与相关清单；不重复 R2.2.4 内容 |

## 1. V-11 修订

| 项 | 内容 |
|---|---|
| Reviewer 原问题 | V-11 仍使用旧的 `CREATED` 结果，与 R2.2.4 新规则冲突（无匹配不得创建 `global_product`，`result` 已无 `CREATED`） |
| 修改前 | “同一身份两个并发请求；只创建一个产品；一方 CREATED，一方 MATCHED” |
| 修改后 | 区分两种前置条件：**(a) 已存在 CONFIRMED 产品** → 两并发导入仅复用 `product_uid`，结果均为 `MATCHED`，不得重复创建；**(b) 无匹配 CONFIRMED 产品** → 不得创建 `global_product`，只能创建/复用/更新 `identity_pending`，结果使用 `PENDING_CREATED`/`PENDING_UPDATED`；**pending 去重规则待决**，不得假定并发请求必然合并为单条 pending |
| 修改文件 | `07_TEST_VECTORS.md` V-11 与覆盖映射说明 |
| 未使用值 | `CREATED` 不再作为 `product_import_event.result` 或正式产品创建结果 |

## 2. 全文一致性搜索

| 检查项 | 结果 |
|---|---|
| `CREATED` 作为导入结果 | 仅存在于否定性说明（“不存在 CREATED 结果”）与历史说明；无测试预期使用 |
| `PENDING_CREATED` / `PENDING_UPDATED` / `MATCHED` | 与 `04` §3/§4 定义一致 |
| `alias_scope` | 未恢复；仍统一为 `scope` |
| 无条件 `UNIQUE (principal_id, role_domain)` | 未恢复；仍为 `UNIQUE (binding_id, role_domain)` + `UNIQUE (principal_id, binding_id)` |
| V-95…V-102 | 全部保持未执行 |
| V-77…V-94 | 保持未执行 |

## 3. 待决事项

- 不同 document/import 请求之间的 pending 去重规则未定义，标记为待决；实现期需明确幂等键与合并/复用策略，本轮不自行假定。

## 4. 文件变更

| 文件 | 变更 |
|---|---|
| `00_DESIGN_OVERVIEW.md` | v2.7-R2.2.5；阅读顺序加入 `18`；摘要 |
| `07_TEST_VECTORS.md` | v2.7-R2.2.5；V-11 修订与说明 |
| `18_R2_2_5_REVIEW_RESPONSE.md` | 本文件（新增） |
| `SHA256SUMS` / `../DESIGN_AND_TEST_SHA256SUMS.txt` | 重新生成 |

## 5. 状态

- 本轮：`DESIGN_PACKAGE_R2_2_5_SUBMITTED`。
- 未标记：`ARCHITECTURE_APPROVED` / `CONTRACT_FROZEN` / `P0_2_CLOSED` / `BUSINESS_API_IMPLEMENTATION_AUTHORIZED` / `PRODUCTION_READY`。
- 等待 Reviewer 独立复核。
