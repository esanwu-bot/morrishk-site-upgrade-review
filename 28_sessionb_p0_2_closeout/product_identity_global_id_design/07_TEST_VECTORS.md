# 产品身份与全局 ID 测试向量

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-007 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 性质 | 未来实现期测试设计；**本轮未执行**，不替代现有 83 项 Parser 测试 |
| 关联 | `04_GLOBAL_ID_REGISTRY.md`、`05_BACKWARD_COMPATIBILITY.md`、`06_API_AND_DATABASE_IMPACT.md` |

## 1. 使用说明

- 每个向量：输入、预期身份关系、预期 ID 行为、失败条件。
- ID 行为中的 `product_uid` 为候选 surrogate；`pbk1_` 为候选自然键编码。
- 在 D-04/D-05/D-08 未签署前，这些向量是验收设计，不是已实现断言。
- 测试数据全部使用合成/脱敏 fixture，不接生产。

## 2. 测试向量

| # | 场景 | 输入 | 预期身份关系 | 预期 ID 行为 | 失败条件 |
|---|---|---|---|---|---|
| V-01 | 同 MPN、不同 Brand | MPN `ABC123` + Brand A / Brand B | 两个独立产品 | 两个 product_uid；自然键不同 | 被合并为一个产品 |
| V-02 | 不同 MPN、同 Brand | Brand A + `ABC123` / `ABC124` | 两个独立产品 | 两个 product_uid | 被合并 |
| V-03 | 同产品不同 PDF | 同 Brand/MPN；两份不同 PDF（不同 datasheet 版本） | 同一产品 | 同一 product_uid；两条 product_document | 生成两个 product_uid |
| V-04 | 同 PDF 重复导入 | 同一 PDF 连续导入两次 | 同一文档/产品 | 同 document_id；同 product_uid；import_event 幂等 | 重复创建产品/文档 |
| V-05 | 重解析 | 同一 PDF 重新 parse | 同一文档/产品 | 新 run_id；同 document_id/product_uid | 产品 ID 漂移 |
| V-06 | Brand 别名变化 | `TI` → `Texas Instruments` | 同一 Brand | 同 brand_id；同 product_uid | 生成新 Brand/产品 |
| V-07 | 未知 Brand | Brand 缺失/无法识别 | `PENDING_BRAND` | 不生成正式 `pbk1_`/不自动分配正式产品 | 静默归入某 Brand |
| V-08 | MPN 格式冲突 | `AD-123` vs `AD123` 同 Brand | 需按 profile 判定；冲突则人工裁决 | 同 norm 则同产品；不同 norm 则 PENDING_CONFLICT | 静默合并或静默拆分 |
| V-09 | 产品合并 | 两个已存在 product_uid 被裁决为同产品 | 合并后一个主产品 | 保留两 uid；`merged_into` + alias；旧 ID 可重定向 | 物理删除旧 ID/断链 |
| V-10 | 产品拆分 | 一个 product_uid 被裁决包含两个变体 | 拆成两个产品 | 新 product_uid；旧 uid 标记 SPLIT/别名；谱系记录 | 丢失旧映射 |
| V-11 | 并发导入 | 同一身份两个并发请求 | 只创建一个产品 | 唯一约束/幂等键；一方 CREATED，一方 MATCHED | 创建重复产品 |
| V-12 | 历史 ID 兼容 | 旧 `product_id=prod-doc` 查询 | 映射到 product_uid | legacy_map 解析；旧字段保留 | 旧 ID 失效/破坏性替换 |
| V-13 | API Scope 隔离 | 缺 `product.evidence.read` 调 evidence | 授权拒绝 | 403 INSUFFICIENT_SCOPE；不泄露身份/证据 | 越权返回 |
| V-14 | 变体/封装 | 同 Brand/MPN 不同封装 | 按 D-04 决定独立产品或 variant 属性 | variant_key 或独立 uid | 未裁定即合并/拆分 |
| V-15 | 数据手册版本 | 同产品 v1/v2 datasheet | 同一产品，多文档/版本 | 同 product_uid；版本关系 | 每版生成新产品 |
| V-16 | Brand 合并/更名 | Brand A 合并到 Brand B | 同 brand_id（merged_into） | 旧 Brand alias；产品 uid 不变 | 旧 Brand 断链 |
| V-17 | MPN 归一化为空 | 空/仅特殊字符 | INVALID_MPN | 不生成键 | 生成空键/合并 |
| V-18 | 幂等键冲突 | 同 idempotency_key 不同请求 | 拒绝/返回原结果 | IDEMPOTENCY_CONFLICT 或 MATCHED | 重复创建 |
| V-19 | PENDING_BRAND 不占正式键 | 缺 Brand 的两条不同 MPN 记录 | 均为待确认，不合并 | 均无正式 natural key/`pbk1_`；可并存于待确认队列 | 任一条进入 CONFIRMED 或占用唯一键 |
| V-20 | PENDING_CONFLICT 不占正式键 | 同 Brand/MPN 多候选 | 冲突待裁决 | 不创建 CONFIRMED 唯一键；冲突记录可多条 | 占键/静默选一 |
| V-21 | variant 未裁定 | 同 Brand/MPN，封装未知 | `PENDING_VARIANT` | 不生成 CONFIRMED/`pbk1_` | 以 nullable variant 直接 CONFIRMED |
| V-22 | 同 Brand/MPN 不同封装 | Brand A + MPN X + package P1/P2 | 按 D-04：独立产品或 variant 属性 | 若独立 → 两个 natural key/product_uid；若属性 → 同 uid + variant | 未裁定即合并/拆分 |
| V-23 | 合并旧自然键保留 | 两个已 CONFIRMED 产品合并 | 目标产品保留 | 旧 natural key → alias/redirect；不删除/不复用 | 旧键消失或指向新空产品 |
| V-24 | 拆分新自然键生成 | 一个产品拆成两个身份 | 两个新身份 | 新 natural key/product_uid；旧键标 SPLIT/alias | 复用旧键或丢失谱系 |
| V-25 | normalizer 版本升级 | `MPN-NORM-v1` → v2，norm 变化 | 同一产品关系尽量保持 | 旧 norm 进 alias/历史；新 norm 重算；审计 | 静默改写历史/生成重复产品 |
| V-26 | 并发 PENDING_CONFLICT | 同身份两并发请求，均缺 variant | 只产生一个冲突记录 | 幂等键/唯一约束防重复；返回同一冲突 | 重复冲突/重复产品 |
| V-27 | 全局产品 vs 租户 ACL | 客户 A 可见产品 X，客户 B 无 ACL | 全局身份共享，访问不共享 | A 可见；B 不可见（403/404 按策略） | B 因全局身份看到 X/私有证据 |
| V-28 | 私有证据隔离 | 客户 A 私有 PDF/证据，客户 B 有全局产品访问 | 产品可共享，私有证据不共享 | B 看不到 A 的 bbox/原文/文件 | 私有证据跨租户泄露 |

### 2.1 R2 新增向量覆盖映射

| R2 要求 | 向量 |
|---|---|
| 正式唯一约束适用状态 | V-19/V-20/V-21 |
| PENDING_BRAND 是否进入正式注册表 | V-19 |
| PENDING_CONFLICT 是否占用正式键 | V-20/V-26 |
| variant 未定是否允许 CONFIRMED | V-21/V-22 |
| 同 Brand/MPN 不同封装 | V-22 |
| 合并旧自然键保留 | V-23 |
| 拆分新自然键生成 | V-24 |
| normalizer_version 升级 | V-25 |
| 并发导入防重复 | V-11/V-26 |
| 租户/私有证据隔离（R1） | V-27/V-28 |

## 3. 测试分层（未来）

| 层 | 内容 | 依赖 |
|---|---|---|
| Unit | Brand/MPN 规范化、状态机、键编码 | no DB |
| Repository | resolve/match/merge/split、幂等、并发 | 内存/隔离 DB |
| API | 16 操作、错误码、scope 隔离 | 隔离 Runtime |
| Migration | 旧 ID 映射、双读、回滚 | 迁移 fixture |

## 4. 失败判定原则

- 任一“预期身份关系”被违反即 FAIL；
- 任一“预期 ID 行为”被违反即 FAIL；
- 静默合并/拆分、旧 ID 断链、越权返回均视为 FAIL；
- 测试通过不得替代 Contract Freeze 或生产准入。

## 5. 边界

- 本轮未执行这些向量；现有 83 项测试只覆盖 Parser/Domain/Evidence，不覆盖本文件场景。
- 不修改 OpenAPI/75 矩阵/数据库。
- 所有预期以负责人签署后的 D-04/D-05/D-08 为准。