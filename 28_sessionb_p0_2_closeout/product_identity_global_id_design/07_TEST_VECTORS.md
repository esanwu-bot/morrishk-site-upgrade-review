# 产品身份与全局 ID 测试向量

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-007 |
| 版本 | v2.7-R2.2.5 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 性质 | 未来实现期测试设计；**本轮未执行**，不替代现有 83 项 Parser 测试 |
| 关联 | `03_PRODUCT_IDENTITY_MODEL.md`、`04_GLOBAL_ID_REGISTRY.md`、`05_BACKWARD_COMPATIBILITY.md`、`06_API_AND_DATABASE_IMPACT.md`、`10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md` |

## 1. 使用说明

- 每个向量：输入、预期身份关系、预期 ID 行为、失败条件。
- ID 行为中的 `product_uid` 为候选 surrogate；`pbk1_` 为候选自然键编码。
- 在 D-04/D-05/D-08 未签署前，这些向量是验收设计，不是已实现断言。
- 测试数据全部使用合成/脱敏 fixture，不接生产。
- **本轮 R2 新增 V-29…V-50 均未执行**；只作为实现期的验收设计。
- **R2.1 新增 V-51…V-70 亦未执行**；覆盖 Brand 上下文 MPN Alias、Alias 有效期、Global/Tenant 归属、Tenant Assertion、Global Adjudication、伪造 tenant_id、禁用 Client/Site。
- **R2.2 新增 V-71…V-76 亦未执行**；覆盖当前/历史 Alias 唯一与并发、三类归属、四角色审批链、GLOBAL 审计 `tenant_id=NULL`、首期 Evidence 仅 PRIVATE。
- **R2.2.1 新增 V-77…V-86 亦未执行**；覆盖 Alias 时间语义与区间互斥、站点复合外键、三类 CHECK、审计 scope、可信身份、角色分离、审批原子事务。
- **R2.2.2 新增 V-87…V-94 亦未执行**；覆盖跨 Client 主体归一、审批状态字段一致性、Tenant 前置审批、空键并发首插、同目标重叠拒绝、冲突双作用域、审计三作用域。
- **R2.2.3 新增 V-95…V-101 亦未执行**；覆盖无匹配导入不建全局产品、后台/批量/管理员旁路、角色域并发与撤销历史、Alias 作用域并存、旧两作用域审计拒绝。
- **R2.2.4 新增 V-102 亦未执行**；验证无匹配导入只建 pending，且 `product_import_event.result=PENDING_CREATED` 不被误解为正式产品创建。

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
| V-11 | 并发导入（两种前置） | (a) 已存在 CONFIRMED 产品：两并发导入同一身份；(b) 无匹配 CONFIRMED 产品：两并发导入同一身份 | (a) 仅复用已有 `product_uid`，结果均 `MATCHED`，不得重复创建；(b) 不得创建 `global_product`，只能创建/复用/更新 `identity_pending`；pending 去重为**待决规则**，不得假定必然合并为一条 | 并发测试 + DB 断言 | 重复创建产品或误建正式产品 |
| V-12 | 历史 ID 兼容 | 旧 `product_id=prod-doc` 查询 | 映射到 product_uid | legacy_map 解析；旧字段保留；校验 tenant | 旧 ID 失效/破坏性替换 |
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

### 2.1 早期复核（R1/R2 评审）向量覆盖映射

| 早期要求 | 向量 |
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
| 租户/私有证据隔离（早期 R1） | V-27/V-28 |
| Brand 上下文 MPN Alias（R2.1） | V-51/V-52/V-53/V-54 |
| Alias 唯一约束与有效期（R2.1） | V-55/V-56/V-57/V-58 |
| Global/Tenant 数据归属（R2.1） | V-59/V-60/V-61 |
| Tenant Assertion / Global Adjudication（R2.1） | V-62/V-63/V-64 |
| tenant_evidence Site 边界（R2.1） | V-65/V-66 |
| 伪造 tenant_id / 禁用 Client、Site（R2.1） | V-67/V-68/V-69/V-70 |
| Alias 当前/历史映射与并发（R2.2） | V-71/V-72 |
| Global/Tenant/Site 三类归属（R2.2） | V-73 |
| 四角色审批链（R2.2） | V-74 |
| GLOBAL 审计 tenant_id=NULL（R2.2） | V-75 |
| 首期 Evidence 仅 PRIVATE（R2.2） | V-76 |
| Alias 时间语义/区间互斥/并发（R2.2.1） | V-77/V-78/V-79 |
| Site 复合外键与三类 CHECK（R2.2.1） | V-80/V-81 |
| 审计 scope 与复合外键（R2.2.1） | V-82 |
| 可信身份/角色分离/原子事务（R2.2.1） | V-83/V-84/V-85/V-86 |
| 跨 Client 主体与审批状态（R2.2.2） | V-87/V-88/V-89/V-90 |
| 空键并发/同目标重叠（R2.2.2） | V-91/V-92 |
| 冲突双作用域/审计三作用域（R2.2.2） | V-93/V-94 |
| 全局产品审批旁路（R2.2.3） | V-95/V-96 |
| 角色域并发与撤销（R2.2.3） | V-97/V-98 |
| Alias 作用域并存与重叠（R2.2.3） | V-99/V-100 |
| 旧两作用域审计拒绝（R2.2.3） | V-101 |
| 无匹配导入结果语义（R2.2.4） | V-102 |

> **V-11 说明（R2.2.5）**：不再使用 `CREATED` 作为导入结果。已存在 CONFIRMED 产品时并发只允许 `MATCHED` 复用；无匹配时只允许写 `identity_pending`，结果使用 `PENDING_CREATED`/`PENDING_UPDATED`。不同 document/import 请求之间的 pending 去重规则尚未定义，标记为**待决**，不得假定并发请求必然合并为单条 pending。

### 2.2 本轮 R2（Morrishk-first）新增向量 V-29…V-50

| # | 场景 | 输入 | 预期结果 | 校验方法 | 风险 |
|---|---|---|---|---|---|
| V-29 | 四因子全部满足 | Morrishk tenant + 官网 site + 有效 client；scope 有；ACL 有；资源公开 | ALLOW；返回产品与文档 | 授权单测 + API 集成 | 因子顺序/短路错误导致误放行 |
| V-30 | 缺 Tenant ACL | scope 有；site 绑定有效；产品不在 `tenant_product_access` | DENY（403 或 404） | 授权单测 | 仅凭全局身份放行 |
| V-31 | Site 不属于 Tenant | token site 属于其他 tenant | DENY `SITE_BINDING_INVALID` | 授权单测 + token fixture | 配置错配导致跨租户 |
| V-32 | Client 跨 Site 复用 | client 属于 site A，token 声称 site B（同 tenant） | DENY | 授权单测 | 多站点预留被滥用 |
| V-33 | 全局产品 + 他租户私有证据 | 产品 ACL 有；证据 visibility=私有且属其他租户 | DENY / 过滤；不返回 bbox/原文 | API 集成 | 私有证据泄露 |
| V-34 | 本租户私有证据 | 产品 ACL 有；证据属本租户 | ALLOW | API 集成 | 误过滤导致功能缺失 |
| V-35 | PENDING_BRAND 不落正式表 | 缺 Brand 的导入 | 仅 `identity_pending`；无 `global_product`；无 uid/pbk1 | Repository + DB 断言 | 默认建 CONFIRMED |
| V-36 | PENDING_VARIANT 三态 | variant_state=UNKNOWN | 仅 pending；不得写 `global_product` | Repository + DB 断言 | NULL 穿透唯一索引 |
| V-37 | NOT_APPLICABLE 哨兵 | variant_state=NOT_APPLICABLE | `variant_key=__NO_VARIANT__` 且写入成功；无 NULL | DB 约束 + 单测 | 用 NULL 表示无变体 |
| V-38 | KNOWN 变体独立键 | 同 Brand/MPN，variant=KNOWN A/B | 两个 `global_product`；两个 uid；自然键不同 | Repository + DB 断言 | 变体被合并 |
| V-39 | 待确认裁决事务 | pending → 裁决为 CONFIRMED | 一个事务内写 `global_product`、标记 ADJUDICATED、写 alias/lineage/audit | 事务故障注入 | 部分成功/重复确认 |
| V-40 | 裁决失败回滚 | 在写 audit 时人为失败 | 全部回滚；pending 仍 OPEN；无 global_product | 故障注入 | 半成品身份 |
| V-41 | Brand Alias 租户隔离 | 租户 T1 私有 alias；T2 查询同 raw name | T1 解析成功；T2 不命中该 alias | Repository + 多租户 fixture | 租户 alias 泄露 |
| V-42 | Brand Alias 冲突 | 同 raw name 两个 GLOBAL 冲突候选 | `PENDING_CONFLICT` + 人工裁决 | Repository | 静默取一 |
| V-43 | MPN Profile 优先级 | 同 Brand 同时有 BRAND/MANUFACTURER/GLOBAL APPROVED | 选 BRAND；记录 profile_id/version | 单测 | 选错 profile |
| V-44 | 无 APPROVED Profile | 只有 DRAFT/PROPOSED/RETIRED | 不自动确认；PENDING（LOW_CONFIDENCE） | 单测 | 用未批准规则确认 |
| V-45 | 同 Brand 多个同优先级 APPROVED Profile | 两个 BRAND APPROVED | 阻断并报治理错误/冲突 | 单测 | 任意选一 |
| V-46 | normalizer 升级 + 旧 alias | v1→v2 norm 变化；旧值已有 CONFIRMED | 旧 norm 进 `mpn_alias`；新键匹配或冲突；audit | Repository + DB | 静默重写/重复产品 |
| V-47 | MERGED 旧键唯一性 | A 合并入 B | A 的键进 alias；ACTIVE 唯一索引只剩 B | DB 约束测试 | 旧键仍占唯一索引 |
| V-48 | 待确认记录幂等 | 同 idempotency_key 两次提交 | 同一 `pending_id`/`conflict_id`；不重复 | Repository | 重复队列项 |
| V-49 | 旧 `product_id` + tenant ACL | 旧映射存在但产品不在 ACL | 拒绝；不因旧 ID 绕过 | API 集成 | 兼容路径越权 |
| V-50 | 拒绝审计 | 任意 DENY 场景 | 写 `audit_log`，不含 token/secret | 审计断言 | 无法追查/泄露敏感 |

> V-29…V-50 共 22 个向量，覆盖 R2-1…R2-4；全部**未执行**。若负责人只要求最小集，至少保留 V-29…V-40。

### 2.3 R2.1 定点修订新增向量 V-51…V-70

| # | 场景 | 输入 | 预期结果 | 校验方法 | 风险 |
|---|---|---|---|---|---|
| V-51 | Brand 上下文 MPN Alias | 同 `alias_norm` 在 Brand A / Brand B 各自注册 | 各自解析到本 Brand 的 canonical MPN；**不跨 Brand 解析** | Repository 单测 | 仅凭 MPN 原文跨 Brand 误匹配 |
| V-52 | MPN Alias 缺 Brand | 写入 `mpn_alias` 但 `brand_id = NULL` | 拒绝写入（NOT NULL 约束） | DB 约束 + Repository 断言 | 无 Brand 别名进入解析 |
| V-53 | GLOBAL MPN Alias 唯一性 | 同 `brand_id` + 同 `alias_norm` 两条 GLOBAL 指向不同 MPN | 第二条拒绝或并入 `PENDING_CONFLICT`；不得自动选一 | DB 部分唯一索引 + Repository | 同 Brand 别名分裂 |
| V-54 | TENANT MPN Alias 唯一性与隔离 | 租户 T1 注册 (T1, Brand A, alias X)；T2 注册 (T2, Brand A, alias X) | 两行均可存在；互不影响；T3 查不到 | 多租户 fixture | 租户别名越界 |
| V-55 | Brand Alias 作用域唯一性 | GLOBAL 同 `alias_norm` 两 brand；TENANT 同 `tenant_id+alias_norm` 两 brand | GLOBAL 冲突拒绝/PENDING；TENANT 各自限于本租户 | DB 部分唯一索引 | 单一 `unique(alias_norm, scope, tenant_id)` 漏约束 |
| V-56 | Alias 有效期重叠 | 同一唯一键两行区间重叠且目标不同 | 拒绝写入或 `PENDING_CONFLICT` | 区间校验单测/DB 排斥约束 | 有效期重叠导致歧义解析 |
| V-57 | 失效 Alias 重新分配 | 旧 alias 已 `valid_to` 过期；新目标占用同名 alias | 新增一行，旧行保留；历史解析仍可回溯 | Repository + DB 断言 | 原地改行抹掉历史 |
| V-58 | normalizer_version 变更保留历史 | v1→v2 后 alias 目标变化 | 旧行保留 v1 与 `valid_to`；新行 v2；旧版本可复算 | Repository + DB 断言 | 覆盖旧版本导致不可追溯 |
| V-59 | GLOBAL 行不得带 tenant_id | 向 `global_product` / `brand_registry` / GLOBAL alias / `mpn_profile` / `global_adjudication` 写入 `tenant_id` | 拒绝写入 | DB CHECK 断言 | 全局数据被伪造归属 |
| V-60 | TENANT 行必须带 tenant_id | 向 `tenant_document`/`tenant_evidence`/`tenant_assertion`/`identity_pending` 写入缺 `tenant_id` | 拒绝写入 | DB 约束断言 | 私有数据无归属 |
| V-61 | 全局审计归属 | 全局裁决产生事件 | `audit_log(scope='GLOBAL')` 且 `tenant_id IS NULL`；不得写成 Morrishk | 审计断言 | 全局事件被强行归属客户 |
| V-62 | Tenant Assertion 不写 global_product | Morrishk 提交 `BRAND_CONFIRM`/`MPN_CONFIRM` | 仅写 `tenant_assertion` + TENANT 审计；`global_product` 不变 | Repository + DB 断言 | 客户确认直接改全局身份 |
| V-63 | 客户断言与全局裁决独立留存 | 全局拒绝或修改客户断言 | 客户原记录保留；追加 `global_adjudication` 引用；状态分别为 `REJECTED_BY_GLOBAL` 与裁决记录 | Repository + 审计断言 | 覆盖客户原始记录 |
| V-64 | 首期角色边界 | Morrishk 角色尝试执行 Global Adjudication | DENY（无 `identity.admin`，403） | 授权单测 | 客户侧越权裁决 |
| V-65 | tenant_evidence Site 归属 | 写入 evidence，其 `site_id` 属于另一 tenant | 拒绝写入（`site.tenant_id != tenant_evidence.tenant_id`） | DB 约束 + Repository | 证据跨租户挂靠 |
| V-66 | 私有证据不因产品全局化共享 | 产品已全局 CONFIRMED；T2 请求 T1 的私有 evidence | DENY/过滤；不返回 bbox/原文 | API 集成 | 产品全局化导致证据泄露 |
| V-67 | 请求体伪造 tenant_id/site_id | 请求体带与服务端 client→site→tenant 派生值不一致的 tenant/site | 拒绝（403）；不得以请求体为准写入 Token | 授权单测 + token fixture | 伪造上下文提权 |
| V-68 | 禁用 Client | client 已 DISABLED，使用既有 token 调用 API | 运行期复核拒绝；新 token 申请也拒绝 | 授权单测 | 禁用后仍可用 |
| V-69 | 禁用/撤销 Site | site 已 DISABLED 或迁移 tenant | 该 site 下 token 全部拒绝；绑定变化后旧 token 失效 | 授权单测 | 停用站点继续访问 |
| V-70 | issueToken 未知 client | 请求体自带未注册 `client_id` | 拒绝（401/403）；只信服务端注册记录 | 授权单测 | 自报 client 获得 token |

> V-51…V-70 共 20 个 R2.1 向量，全部**未执行**，与 `03` §4.4、`04` §3.3.1、`06` §7/§8.11/§8.12、`08` D-41…D-45、`10` §4 规则一致。

### 2.4 R2.2 定点修订新增向量 V-71…V-76

| # | 场景 | 输入 | 预期结果 | 校验方法 | 风险 |
|---|---|---|---|---|---|
| V-71 | Alias 当前映射唯一、历史可保留 | 同一唯一键已有历史行（`is_current=false`），新增当前映射 | 仅一条 `is_current=true`；历史行保留且不参与唯一冲突 | DB 部分唯一索引 + Repository | 历史行被唯一约束误拒或当前映射重复 |
| V-72 | Alias 并发写入与区间不重叠 | 两个并发请求对同一唯一键写入不同目标 | 一方成功、另一方回滚并返回可重试/`PENDING_CONFLICT`；区间无重叠 | 并发测试 + 事务校验 | 双写成功或区间重叠 |
| V-73 | 三类归属混用拒绝 | 向 Global-level 写 tenant_id/site_id；向 Tenant-level 写 site_id；向 Site-level 缺 site_id | 全部拒绝写入 | DB CHECK 断言 | 归属混用未被拦截 |
| V-74 | 四角色审批链 | 仅有提交者或仅有 Tenant 审批或仅有 Global 决策 | 未到 Global 审批前 `global_product` 不变；决策者不能自我批准 | 授权单测 + DB 断言 | 审批前写全局或同人决策+批准 |
| V-75 | GLOBAL 审计 tenant_id 允许 NULL | 写入全局裁决审计 | `scope='GLOBAL'`、`tenant_id IS NULL` 成功；写成 Morrishk 则拒绝 | DB CHECK + 审计断言 | GLOBAL 审计被强制填 tenant_id |
| V-76 | 首期 Evidence 仅 PRIVATE | 写入 `visibility=SHARED/PUBLIC` 或跨租户读取私有证据 | 写入拒绝或标记预留；跨租户读取 DENY | DB 约束 + API 集成 | 首期跨租户证据共享 |

> V-71…V-76 共 6 个 R2.2 向量，全部**未执行**，与 `01` §6.5.1、`02` §4.6、`03` §4.4、`04` §3/§3.3.1、`06` §8.5/§8.11/§8.12、`08` D-41…D-46、`10` §4 规则一致。

### 2.5 R2.2.1 定点修订新增向量 V-77…V-86

| # | 场景 | 输入 | 预期结果 | 校验方法 | 风险 |
|---|---|---|---|---|---|
| V-77 | Alias 时间字段一致性 | 写入 `is_current=true` 但 `valid_to` 非空；或 `is_current=false` 但 `valid_to` 为空 | 拒绝写入（CHECK 失败） | DB CHECK 断言 | 当前/历史标记与有效期脱节 |
| V-78 | Alias 区间互斥 | 同一唯一键两行区间重叠（含同目标）；另一组仅首尾相接 | 重叠拒绝；首尾相接允许 | 排斥约束 + Repository | 历史区间重叠导致歧义 |
| V-79 | Alias 并发切换 | 两个并发请求同时切换同一唯一键映射 | 串行化后一方成功、一方重试/冲突；无双重当前行、无重叠 | 并发测试 + 锁断言 | 双当前映射或丢失历史 |
| V-80 | Site 复合外键 | Site-level 行引用不存在或属于他租户的 `(tenant_id, site_id)` | 拒绝写入（复合外键失败） | DB 外键断言 | Site 跨租户挂靠 |
| V-81 | 三类 CHECK | Global 行带 tenant/site；Tenant-level 行带 site；Site-level 行缺 site | 全部拒绝 | DB CHECK 断言 | 归属混用 |
| V-82 | 审计 scope 与复合外键 | GLOBAL 审计带 tenant/site；TENANT 审计缺 tenant_id；带 site_id 但 site 不属于该 tenant | 全部拒绝 | DB CHECK + 外键断言 | 审计归属伪造 |
| V-83 | 可信身份来源 | 请求体自报 `actor`/`tenant_id`，与 token 上下文不一致 | 以 token 为准并拒绝不一致请求；落库身份来自 token | 授权单测 + DB 断言 | 伪造审批人 |
| V-84 | 角色分离 | 同一人同时作为提交者与 Tenant 审批者，或 Global 决策者与批准者 | 拒绝（CHECK/应用校验） | DB CHECK + 单测 | 自我审批 |
| V-85 | 审批原子事务 | 在写 `global_product` 或 audit 时人为失败 | 全部回滚；`decision_status` 不生效；无部分产品 | 故障注入 | 已批准未写产品/半成品 |
| V-86 | 角色绑定互斥 | 给 Morrishk 主体授予 `identity.admin`/`identity.approver` | 拒绝绑定 | 授权/绑定断言 | 客户侧越权裁决 |

> V-77…V-86 共 10 个 R2.2.1 向量，全部**未执行**，与 `01` §6.5.1、`02` §4.6、`03` §4.4、`04` §3.3.1/§3.3.2、`06` §8.12、`08` D-42/D-43/D-44、`10` §4（B-09/B-15/B-16/B-17）一致。

### 2.6 R2.2.2 定点修订新增向量 V-87…V-94

| # | 场景 | 输入 | 预期结果 | 校验方法 | 风险 |
|---|---|---|---|---|---|
| V-87 | 跨 Client 同一自然人主体归一 | 同一自然人经 Client A 得到 subject A、经 Client B 得到 subject B | 两者映射同一 `principal_id`；仍不能同时持有 TENANT 与 GLOBAL 域角色 | 绑定单测 + 授权断言 | 换 Client 绕过角色互斥 |
| V-88 | PROPOSED 提前写批准字段 | `decision_status='PROPOSED'` 但 `approved_by_principal_id`/`approved_at` 非空 | 拒绝写入（CHECK 失败） | DB CHECK 断言 | 未批准即视为批准 |
| V-89 | APPROVED 缺批准字段 | `decision_status='APPROVED'` 但批准字段为空 | 拒绝写入（CHECK 失败） | DB CHECK 断言 | 空批准被放行 |
| V-90 | Tenant 未审批时全局写入 | Tenant Assertion 仍为 `SUBMITTED`/`UNDER_REVIEW`，Global 裁决尝试 APPROVED 并写 `global_product` | 拒绝；无 `global_product` 变更 | 事务单测 + DB 断言 | 绕过 Tenant 前置审批 |
| V-91 | 空 Alias 键并发首次插入 | 唯一键无任何记录，两并发请求同时首次插入 | 唯一键级 advisory lock 串行化：一方成功、一方重试/冲突；仅一条当前映射 | 并发测试 + 锁断言 | 依赖空行锁导致双写 |
| V-92 | 同目标区间重叠拒绝 | 同一唯一键、同一目标，两行区间重叠 | 拒绝写入；首尾相接才允许 | 排斥约束断言 | 同目标重叠被误放行 |
| V-93 | identity_conflict 双作用域 | GLOBAL 冲突带 tenant/site/pending；TENANT 冲突缺 site 或 pending 指向他租户 | 全部拒绝 | DB CHECK + 复合外键断言 | 冲突归属混用 |
| V-94 | 审计三作用域 | TENANT 审计带 site_id；SITE 审计缺 site_id；SITE 审计 site 不属于该 tenant | 全部拒绝 | DB CHECK + 复合外键断言 | 审计层级归属错误 |

> V-87…V-94 共 8 个 R2.2.2 向量，全部**未执行**，与 `01` §6.5.1、`02` §4.6、`03` §4.4、`04` §3/§3.3.1/§3.3.2、`06` §8.12、`08` D-42/D-43/D-44、`10` §4（B-09/B-15…B-19）一致。

### 2.7 R2.2.3 定点修订新增向量 V-95…V-101

| # | 场景 | 输入 | 预期结果 | 校验方法 | 风险 |
|---|---|---|---|---|---|
| V-95 | 普通导入无匹配不建全局产品 | 导入一个无匹配 MPN/Brand | 只创建 `identity_pending`；`global_product` 行数不变 | Repository + DB 断言 | 导入即建 CONFIRMED |
| V-96 | 后台/批量/管理员旁路 | 批量任务或管理员“修复数据”尝试无审批建产品 | 拒绝；仅可写 pending/别名/证据 | 权限单测 + DB 断言 | 后台路径绕过审批 |
| V-97 | 角色域并发授予 | 同一 principal 并发获得 TENANT 与 GLOBAL 域 binding | 部分唯一索引 `UNIQUE(principal_id) WHERE status='ACTIVE'` 仅允许一方成功；另一方 409；不得出现两个 ACTIVE binding | 并发测试 + DB 约束断言 | 双域并存 |
| V-98 | 撤销后同域重新授权与历史 | 撤销同一 principal 的 TENANT binding 及角色后，再次授予 TENANT binding | 新 binding（新 `binding_id`）成功；旧 binding 保持 `REVOKED`、旧角色保留 `revoked_at`；历史与审计完整 | Repository + 审计断言 | 历史行阻止重新授权或历史丢失 |
| V-99 | GLOBAL 与 TENANT 同名 Alias 并存 | 同一 `alias_norm` 分别注册 GLOBAL 与 TENANT | 两行合法并存；解析按作用域隔离 | DB 约束 + 解析单测 | 作用域混淆 |
| V-100 | 跨租户同名与同租户重叠 | T1/T2 各自同名 TENANT alias；T1 内两行区间重叠 | 跨租户并存合法；T1 重叠拒绝 | DB 排斥约束断言 | 跨租户误拒或同租户重叠放行 |
| V-101 | 旧两作用域审计记录 | 写入 `scope='TENANT'` 但 `tenant_id` 为空或 `scope='GLOBAL'` 带 tenant/site | 拒绝写入 | DB CHECK 断言 | 旧模型残留 |
| V-102 | 无匹配导入结果语义 | 普通导入无匹配产品 | 创建 `identity_pending(reason=PENDING_NEW_IDENTITY)`；`product_import_event.result='PENDING_CREATED'`；`global_product` 行数不变 | Repository + DB 断言 | 结果被误解为创建正式产品 |

> V-95…V-102 共 8 个 R2.2.3/R2.2.4 向量，全部**未执行**，与 `01` §6.5.1、`02` §4.6、`03` §4.4、`04` §3/§3.3.1/§3.3.2/§3.3.3、`06` §8.1/§8.11/§8.12、`08` D-42/D-43/D-44/D-47/D-49、`10` §4（B-18…B-21）一致。

## 3. 测试分层（未来）

| 层 | 内容 | 依赖 |
|---|---|---|
| Unit | Brand/MPN 规范化、variant_state、状态机、键编码、四因子判定 | no DB |
| Repository | resolve/match/merge/split、pending/conflict、幂等、并发 | 内存/隔离 DB |
| API | 16 操作、错误码、scope+ACL+site+resource 四因子 | 隔离 Runtime |
| Migration | 旧 ID 映射、tenant 回填、双读、回滚 | 迁移 fixture |

## 4. 失败判定原则

- 任一“预期身份关系/结果”被违反即 FAIL；
- 任一“预期 ID 行为”被违反即 FAIL；
- 静默合并/拆分、旧 ID 断链、越权返回、私有证据跨租户均视为 FAIL；
- 部分成功（事务未回滚）视为 FAIL；
- 测试通过不得替代 Contract Freeze 或生产准入。

## 5. 边界

- 本轮未执行这些向量；现有 83 项测试只覆盖 Parser/Domain/Evidence，不覆盖本文件场景。
- 不修改 OpenAPI/75 矩阵/数据库。
- 所有预期以负责人签署后的 D-04/D-05/D-08/D-31…D-34/D-41…D-46 为准。