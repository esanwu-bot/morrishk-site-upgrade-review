# 产品身份与全局 ID 决策清单

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-008 |
| 版本 | v2.4-R2.2.2 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 说明 | 以下均为 Agent 推荐与待决事项；**不是**负责人已批准的架构决策 |
| 签署栏 | 决策人/日期/结论均留白；未签署前不得用于实现、冻结或生产 |
| 收敛策略 | **Morrishk-first / Tenant-ready / Multi-site-later**（见 `10_MORRISHK_FIRST_SCOPE_AND_DEFERRED.md`） |

## 1. 决策总表

| 编号 | 决策问题 | 可选方案 | 推荐 | 推荐理由 | 主要风险 | 影响范围 | 需签署 | 当前状态 |
|---|---|---|---|---|---|---|---|---|
| D-01 | Brand 权威来源与注册表 | A 自由文本；B 注册表+别名+证据；C 直接用 PDF metadata | **B** | 可追溯、可合并、可审计 | 需要治理与人工维护 | Brand/产品/API | 是 | PROPOSED_NOT_APPROVED |
| D-02 | Brand 规范化/别名/合并/更名 | A 简单大写去空格；B 注册表别名+更名映射；C 全人工 | **B** | 解决 TI/Texas Instruments 等；保留历史 | 别名冲突/治理成本 | Brand 键、产品合并 | 是 | PROPOSED_NOT_APPROVED |
| D-03 | MPN 归一化规则 | A 单一全局规则；B 通用+按 Brand/厂商 profile+版本；C 全人工 | **B** | 厂商差异大；可测试/可复算 | profile 维护；规则版本迁移 | MPN 键、身份、API | 是 | PROPOSED_NOT_APPROVED |
| D-04 | 变体/封装/版本是否进入身份键 | A 仅 MPN+Brand；B +variant_key；C 全部独立产品 | **B（variant_state 三态）** | 避免变体误合并/误拆分；禁止 NULL 语义 | 变体定义不清导致边界争议 | 自然键/产品数/API | 是 | PROPOSED_NOT_APPROVED |
| D-05 | 全局 ID 方案 | A 自然键直接作主键；B 内容哈希；C 注册表 surrogate+自然键；D 旧自增 ID | **C** | 稳定、可合并/拆分/审计 | 需要注册表/迁移 | 全局 ID/DB/API | 是 | PROPOSED_NOT_APPROVED |
| D-06 | 合并/拆分/冲突裁决 | A 自动合并；B 人工裁决+谱系+审计；C 不合并 | **B** | 避免静默错并；可回滚 | 裁决人力/时效 | 产品身份/审计 | 是 | PROPOSED_NOT_APPROVED |
| D-07 | 旧 `product_id=prod-doc` 兼容 | A 破坏性替换；B 保留旧 ID+新增 product_uid+映射；C 仅视图层 | **B** | 兼容旧产物/客户端、可回滚 | 双读/迁移复杂度 | Parser/Repository/API | 是 | PROPOSED_NOT_APPROVED |
| D-08 | API 暴露 `pbk1_`/`product_uid` | A 仅 pbk1；B 仅 uid；C 双字段（uid 主、pbk 兼容） | **C** | 稳定主键+自然键兼容 | DTO/路径变更；不兼容风险 | 16 操作/75 矩阵 | 是 | PROPOSED_NOT_APPROVED |
| D-09 | 16 操作/75 矩阵修订范围 | A 不改路径；B 改路径参数；C 新增身份管理操作 | **B/C 组合，待契约评审** | 身份语义需显式 | 契约线形变更/版本化 | OpenAPI/75 矩阵 | 是 | PROPOSED_NOT_APPROVED |
| D-10 | 迁移/幂等/并发/回滚 | A 一次性迁移；B 分阶段+双读+回滚开关；C 不迁移 | **B** | 降低生产风险 | 迁移窗口/一致性 | DB/API/运维 | 是 | PROPOSED_NOT_APPROVED |
| D-11 | 多文档/多版本关系 | A 一产品一文档；B 产品多文档+版本关系；C 每版本独立产品 | **B** | 同产品多 datasheet 是常态 | 版本语义/排序 | 产品/文档/API | 是 | PROPOSED_NOT_APPROVED |
| D-12 | 未知/缺失 Brand | A 拒绝；B PENDING_BRAND；C 归入 UNKNOWN 产品 | **B** | 不丢数据、不误合并 | 待确认队列积压 | 身份状态/API | 是 | PROPOSED_NOT_APPROVED |
| D-13 | Brand 别名冲突 | A 后写覆盖；B 冲突挂起+人工裁决；C 取最高频 | **B** | 避免静默错并 | 裁决时效 | Brand/产品 | 是 | PROPOSED_NOT_APPROVED |
| D-14 | 身份数据来源优先级 | A 解析优先；B 客户主数据优先+解析证据；C 人工优先 | **B** | 客户权威+可追溯 | 源冲突 | Brand/MPN/产品 | 是 | PROPOSED_NOT_APPROVED |
| D-15 | 审计与审批角色 | A 执行者自审；B 执行/批准分离+审计；C 无审批 | **B** | 合并/拆分需问责 | 流程成本 | 治理/审计 | 是 | PROPOSED_NOT_APPROVED |

> `(mpn_norm, brand_norm)` 仅在 D-04/D-05 签署后作为候选自然键；不是永久唯一键。R2 起自然键候选为 `(brand_id, mpn_norm, variant_state, variant_key)`。

### 1.1 早期复核新增决策（D-16…D-30）

| 编号 | 决策问题 | 可选方案 | 推荐 | 主要风险 | 影响范围 | 需签署 | 当前状态 |
|---|---|---|---|---|---|---|---|
| D-16 | Brand Alias 作用域 | A 仅 GLOBAL；B 仅 TENANT；C GLOBAL+TENANT | **C** | 租户别名泄露/覆盖全局 | Brand/产品/API | 是 | PROPOSED_NOT_APPROVED |
| D-17 | Brand Alias 冲突/历史名 | A 后写覆盖；B 冲突挂起+人工+有效期；C 取最高频 | **B** | 旧名断链/错并 | Brand/产品 | 是 | PROPOSED_NOT_APPROVED |
| D-18 | Brand/MPN Alias 是否共用注册表 | A 共用；B 独立注册表 | **B** | 命名冲突/维护复杂 | Brand/MPN/身份 | 是 | PROPOSED_NOT_APPROVED |
| D-19 | MPN Profile 治理 | A 单全局规则；B 通用+按 Brand/厂商 Profile+版本；C 全人工 | **B** | Profile 维护/版本升级 | MPN/身份/API | 是 | PROPOSED_NOT_APPROVED |
| D-20 | 低置信度 MPN 能否正式确认 | A 允许 CONFIRMED；B 拒绝；C PENDING+人工 | **C** | 待确认积压 | 身份/API | 是 | PROPOSED_NOT_APPROVED |
| D-21 | 正式唯一约束适用状态 | A 所有状态共享；B 仅 CONFIRMED+ACTIVE | **B** | 部分唯一索引/分表复杂度 | DB/Registry | 是 | PROPOSED_NOT_APPROVED |
| D-22 | PENDING_* 键隔离 | A 主表占键；B 独立待确认队列 | **B** | 队列/迁移复杂度 | DB/身份 | 是 | PROPOSED_NOT_APPROVED |
| D-23 | 合并/拆分/normalizer 历史键 | A 删除旧键；B 复用旧键；C alias+谱系保留 | **C** | 存储/查询复杂 | DB/API/审计 | 是 | PROPOSED_NOT_APPROVED |
| D-24 | 全局产品跨租户共享 | A 完全全局；B 每租户独立；C 全局 Canonical+Tenant Access | **C** | 跨租户泄露/治理 | 产品/API/安全 | 是 | PROPOSED_NOT_APPROVED |
| D-25 | Tenant/Organization/ACL 模型 | A 仅 tenant；B tenant+organization 层级；C 仅 organization | **A（Organization 延后）** | 未来组织层级需回填/迁移 | API/DB/安全 | 是 | PROPOSED_NOT_APPROVED |
| D-26 | 私有 PDF/解析/证据边界 | A 全部共享；B 默认私有+显式共享；C 全部私有 | **B** | 客户授权/合规 | 数据/API/安全 | 是 | PROPOSED_NOT_APPROVED |
| D-27 | 客户确认与全局治理 | A 单客户可改全局；B 客户确认仅本租户+全局独立治理；C 全局投票 | **B** | 治理流程成本 | 产品/治理 | 是 | PROPOSED_NOT_APPROVED |
| D-28 | 404/403 存在性泄露策略 | A 一律 404；B 一律 403；C 按可见性分级 | **C（需安全评审）** | 存在性泄露/可诊断性 | API/安全 | 是 | PROPOSED_NOT_APPROVED |
| D-29 | 单租户假设 | A 明确单租户；B 直接多租户；C 首期单 Tenant+Site/Client 预留 | **C（Morrishk-first）** | 未来扩展返工 | 架构/API/DB | 是 | PROPOSED_NOT_APPROVED |
| D-30 | OAuth Scope 与 Tenant ACL 组合 | A 仅 scope；B 仅 ACL；C scope AND tenant ACL AND site binding AND resource policy | **C（四因子）** | 多重校验复杂度/性能 | 授权/API/安全 | 是 | PROPOSED_NOT_APPROVED |

### 1.2 R2 首期/预留/延后决策（D-31…D-40）

| 编号 | 决策问题 | 可选方案 | 推荐 | 首期状态 | 主要风险 | 影响范围 | 需签署 | 当前状态 |
|---|---|---|---|---|---|---|---|---|
| D-31 | Tenant/Site/OAuth Client 首期边界 | A 仅 tenant；B tenant+site+client 三实体；C 仅 client | **B** | 首期必需 | 实体多导致过度设计；少建则未来返工 | 架构/API/DB | 是 | PROPOSED_NOT_APPROVED |
| D-32 | Site-to-Tenant Binding 与 OAuth Client 绑定 | A token 只绑 tenant；B token 绑 tenant+site+client 且 site 属于 tenant；C 由 client 隐式推导 | **B** | 首期必需 | 绑定校验遗漏导致跨租户 | 授权/API/安全 | 是 | PROPOSED_NOT_APPROVED |
| D-33 | Tenant Product Access 模型与访问级别 | A 布尔可见；B QUERYABLE/EXECUTABLE 分级；C 完全继承合同 | **B** | 首期必需 | 级别语义不清导致授权争议 | 产品/API/安全 | 是 | PROPOSED_NOT_APPROVED |
| D-34 | Resource Access Policy 与 allow/deny 语义 | A 仅 ACL；B ACL+资源可见性(public/shared/private)；C 全部公开 | **B** | 首期必需 | 私有证据泄露或过度过滤 | 证据/API/安全 | 是 | PROPOSED_NOT_APPROVED |
| D-35 | Organization Tree | A 不建（延后）；B 现在建；C tenant 内轻量 org | **A** | 明确延后 | 未来多组织需求需回填/迁移 | 架构/授权 | 是 | PROPOSED_NOT_APPROVED |
| D-36 | 复杂权限继承（角色/策略树） | A 不做（延后）；B 现在建；C 扁平角色 | **A** | 明确延后 | 未来策略引擎需重做 | 授权/API | 是 | PROPOSED_NOT_APPROVED |
| D-37 | 计费/订阅 | A 不做（延后）；B 现在设计；C 外部系统 | **A（外部系统另行评估）** | 明确延后 | 商业模型未定，过早耦合 | 商业/架构 | 是 | PROPOSED_NOT_APPROVED |
| D-38 | 跨租户协作/共享 | A 首期禁止（延后）；B 现在设计；C 仅公开数据共享 | **A** | 明确延后 | 高安全风险；授权/撤回复杂 | 数据/API/安全 | 是 | PROPOSED_NOT_APPROVED |
| D-39 | 多 Site 运营 | A 只启用一个 site；B 现在多 site；C 预留多 site+单站点启用 | **C** | 架构预留 | 预留字段误用导致越权 | 架构/API | 是 | PROPOSED_NOT_APPROVED |
| D-40 | 第三方 OAuth Client / 多客户端治理 | A 只自有 client；B 开放注册；C 预留 client 注册/治理 | **A（C 为预留方向）** | 架构预留 | 客户端治理缺失导致凭证滥用 | 授权/安全/运维 | 是 | PROPOSED_NOT_APPROVED |

### 1.2.1 R2.1/R2.2/R2.2.2 定点修订新增决策（D-41…D-48）

| 编号 | 决策问题 | 可选方案 | 推荐 | 主要风险 | 影响范围 | 需签署 | 当前状态 |
|---|---|---|---|---|---|---|---|
| D-41 | Tenant Assertion 模型与首期 Morrishk 可提交范围 | A 客户确认即写全局；B 客户断言仅本租户 + 四角色审批链；C 不允许客户提交 | **B** | 断言积压；与全局裁决状态混淆 | 身份/治理/API | 是 | PROPOSED_NOT_APPROVED |
| D-42 | Global Identity Adjudication 角色、执行/批准分离与首期承担方 | A 无独立裁决；B `identity.admin` 决策 + `identity.approver` 批准，principal 身份 + 两阶段事务；C 客户自审 | **B** | 角色缺位或身份伪造导致越权 | 治理/审计/API | 是 | PROPOSED_NOT_APPROVED |
| D-43 | Global/Tenant/Site 三类归属与全局审计归属 | A 所有行强制 tenant_id；B 三类归属 + CHECK + 复合外键 + 审计三作用域；C 仅应用层校验 | **B** | 归属混乱导致跨租户或伪造租户 | DB/审计/安全 | 是 | PROPOSED_NOT_APPROVED |
| D-44 | Brand Alias / MPN Alias 唯一约束与有效期 | A 单一 `unique(alias_norm, scope, tenant_id)`；B 当前映射部分唯一 + 历史保留 + 任意区间不重叠 + 空键 advisory lock | **B** | 时间语义/并发冲突导致歧义映射 | Brand/MPN/DB | 是 | PROPOSED_NOT_APPROVED |
| D-45 | OAuth Token 可信上下文与 Client/Site 状态变化处理 | A 信任请求体 tenant/site；B 服务端派生 + 运行期复核 + 禁用即拒绝 | **B** | 校验遗漏导致越权/伪造 | 授权/API/安全 | 是 | PROPOSED_NOT_APPROVED |
| D-46 | 首期 Evidence visibility 范围 | A PRIVATE/SHARED/PUBLIC 全启用；B 首期仅 PRIVATE，其余预留；C 全部公开 | **B** | 跨租户证据泄露 | 证据/API/安全 | 是 | PROPOSED_NOT_APPROVED |
| D-47 | 稳定主体标识与角色域互斥 | A 用 client_id+subject；B 服务端 `principal_id` + `client_subject_binding` + `principal_role.role_domain` 互斥；C 每请求人工核对 | **B** | 换 Client 绕过角色互斥/伪造审批人 | 授权/治理/DB | 是 | PROPOSED_NOT_APPROVED |
| D-48 | 审批状态字段一致性与两阶段事务 | A 仅应用层校验；B DB CHECK + Tenant 前置独立提交 + Global 最终事务重校验；C 单一大事务 | **B** | 未批准写全局/半成品身份 | 治理/DB/审计 | 是 | PROPOSED_NOT_APPROVED |

### 1.3 决策分类（每项至少一类）

| 决策 | 类型 | 首期分类 |
|---|---|---|
| D-01 | 业务 | 首期必需（身份） |
| D-02 | 业务 + 技术 | 首期必需（身份） |
| D-03 | 技术 | 首期必需（身份） |
| D-04 | 业务 + 技术 | 首期必需（身份） |
| D-05 | 技术 | 首期必需（身份） |
| D-06 | 业务 + 技术 | 首期必需（身份） |
| D-07 | 数据迁移 | 首期必需（兼容） |
| D-08 | 技术（API） | 首期必需（API） |
| D-09 | 技术（API） | 首期必需（API） |
| D-10 | 数据迁移 | 首期必需（迁移） |
| D-11 | 业务 | 首期必需（产品） |
| D-12 | 业务 | 首期必需（身份） |
| D-13 | 业务 | 首期必需（身份） |
| D-14 | 业务 | 首期必需（身份） |
| D-15 | 安全/治理 | 首期必需（治理） |
| D-16 | 安全/租户隔离 | 首期必需（身份） |
| D-17 | 业务 | 首期必需（身份） |
| D-18 | 技术 | 首期必需（身份） |
| D-19 | 技术 | 首期必需（身份） |
| D-20 | 技术 + 业务 | 首期必需（身份） |
| D-21 | 技术（DB） | 首期必需（DB） |
| D-22 | 技术（DB） | 首期必需（DB） |
| D-23 | 数据迁移 | 首期必需（兼容） |
| D-24 | 安全/租户隔离 | 首期必需（访问） |
| D-25 | 安全/租户隔离 | 首期必需（tenant-only） |
| D-26 | 安全/租户隔离 | 首期必需（私有数据） |
| D-27 | 安全/租户隔离 | 首期必需（治理） |
| D-28 | 安全 | 首期必需（API） |
| D-29 | 业务 + 技术 | 首期必需（策略） |
| D-30 | 安全/租户隔离 | 首期必需（授权） |
| D-31 | 安全/租户隔离 | 首期必需 |
| D-32 | 安全/租户隔离 | 首期必需 |
| D-33 | 安全/租户隔离 | 首期必需 |
| D-34 | 安全/租户隔离 | 首期必需 |
| D-35 | 业务 + 架构 | 明确延后 |
| D-36 | 安全/架构 | 明确延后 |
| D-37 | 商业/架构 | 明确延后 |
| D-38 | 安全/租户隔离 | 明确延后 |
| D-39 | 架构 | 架构预留（多 Site 不启用） |
| D-40 | 安全/运维 | 架构预留（仅自有 client） |
| D-41 | 业务 + 治理 | 首期必需（治理） |
| D-42 | 安全/治理 | 首期必需（治理） |
| D-43 | 安全/租户隔离 | 首期必需（归属） |
| D-44 | 技术（DB） | 首期必需（身份） |
| D-45 | 安全/租户隔离 | 首期必需（授权） |
| D-46 | 安全/租户隔离 | 首期必需（证据） |
| D-47 | 安全/治理 | 首期必需（身份） |
| D-48 | 安全/治理 | 首期必需（审批） |

### 1.4 责任方与签署建议（不代表已指定）

| 决策 | 建议决策方 | 建议会签 | 说明 |
|---|---|---|---|
| D-31/D-32/D-39/D-40 | 项目负责人 | 安全、运维 | 租户/站点/客户端/凭证边界 |
| D-33/D-34/D-28 | 项目负责人 | 安全、业务 | 访问级别、资源策略、存在性 |
| D-35/D-36 | 项目负责人 | 架构 | 延后项，本轮仅登记 |
| D-37 | 商务负责人 | 项目负责人 | 延后项，本轮仅登记 |
| D-38 | 项目负责人 | 安全、法务 | 延后项，本轮仅登记 |
| D-01…D-23 | 项目负责人 | 业务/技术按类型 | 身份/ID/迁移 |
| D-24/D-25/D-26/D-27/D-29/D-30 | 项目负责人 | 安全、客户代表 | 租户隔离与授权 |
| D-41/D-42/D-43 | 项目负责人 | 安全、客户代表 | 客户断言、全局裁决与数据归属 |
| D-44 | 项目负责人 | 技术、DBA | Alias 唯一约束与有效期 |
| D-45 | 项目负责人 | 安全、运维 | Token 可信上下文与凭证状态处理 |
| D-46 | 项目负责人 | 安全、业务 | 首期证据可见性范围 |
| D-47 | 项目负责人 | 安全、身份/运维 | 稳定 principal 与角色域互斥 |
| D-48 | 项目负责人 | 安全、身份/审计 | 审批状态约束与两阶段事务 |

> 以上仅为建议；实际决策人/会签以签署栏填写为准，Agent 不代指定、不代签。

## 2. 签署栏（由负责人填写，Agent 不代填）

| 决策 | 决策人 | 结论（采纳/修改/驳回） | 日期 | 备注 |
|---|---|---|---|---|
| D-01 |  |  |  |  |
| D-02 |  |  |  |  |
| D-03 |  |  |  |  |
| D-04 |  |  |  |  |
| D-05 |  |  |  |  |
| D-06 |  |  |  |  |
| D-07 |  |  |  |  |
| D-08 |  |  |  |  |
| D-09 |  |  |  |  |
| D-10 |  |  |  |  |
| D-11 |  |  |  |  |
| D-12 |  |  |  |  |
| D-13 |  |  |  |  |
| D-14 |  |  |  |  |
| D-15 |  |  |  |  |
| D-16 |  |  |  |  |
| D-17 |  |  |  |  |
| D-18 |  |  |  |  |
| D-19 |  |  |  |  |
| D-20 |  |  |  |  |
| D-21 |  |  |  |  |
| D-22 |  |  |  |  |
| D-23 |  |  |  |  |
| D-24 |  |  |  |  |
| D-25 |  |  |  |  |
| D-26 |  |  |  |  |
| D-27 |  |  |  |  |
| D-28 |  |  |  |  |
| D-29 |  |  |  |  |
| D-30 |  |  |  |  |
| D-31 |  |  |  |  |
| D-32 |  |  |  |  |
| D-33 |  |  |  |  |
| D-34 |  |  |  |  |
| D-35 |  |  |  |  |
| D-36 |  |  |  |  |
| D-37 |  |  |  |  |
| D-38 |  |  |  |  |
| D-39 |  |  |  |  |
| D-40 |  |  |  |  |
| D-41 |  |  |  |  |
| D-42 |  |  |  |  |
| D-43 |  |  |  |  |
| D-44 |  |  |  |  |
| D-45 |  |  |  |  |
| D-46 |  |  |  |  |
| D-47 |  |  |  |  |
| D-48 |  |  |  |  |

## 3. 决策依赖顺序（建议）

```text
D-14 来源优先级
  -> D-01 Brand 注册表
  -> D-02 Brand 规范化/别名
  -> D-16/D-17/D-18 Alias 作用域/冲突/独立注册表
  -> D-03 MPN 规范化
  -> D-19/D-20 Profile 治理/低置信度
  -> D-04 variant_state 三态
  -> D-05 全局 ID
  -> D-21/D-22/D-23 唯一约束/PENDING 队列/历史键
  -> D-06 合并/拆分/冲突
  -> D-07 兼容
  -> D-08/D-09 API/矩阵
  -> D-29 策略（Morrishk-first）
  -> D-25/D-31 Tenant/Site/OAuth Client
  -> D-24/D-33 全局产品与 Tenant Access
  -> D-32/D-34 四因子授权
  -> D-26/D-27/D-28 私有数据/治理/存在性
  -> D-10 迁移/幂等/回滚
  -> D-11/D-12/D-13/D-15 支撑决策
  -> D-35…D-40 延后项（不阻塞首期签署）
  -> D-41/D-42 客户断言与全局裁决（R2.1）
  -> D-43 全局/租户数据归属与审计归属（R2.1）
  -> D-44 Alias 唯一约束与有效期（R2.1）
  -> D-45 OAuth Token 可信上下文（R2.1）
  -> D-46 首期 Evidence visibility 范围（R2.2）
  -> D-47 稳定主体标识与角色域互斥（R2.2.2）
  -> D-48 审批状态约束与两阶段事务（R2.2.2）
```

## 4. 当前状态声明

- 全部决策：`PROPOSED_NOT_APPROVED`。
- 未签署前：
  - 不得开始 Business API 实现；
  - 不得修改 OpenAPI/75 正式状态；
  - 不得执行 Contract Freeze/生产迁移；
  - 不得把推荐写成负责人已批准。
- D-35…D-40 为明确延后/预留项，本轮不设计、不实现、不承诺工期。
- 本文件不改变 P0-2 BLOCKED 结论。