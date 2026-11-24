# 负责人签署材料（Product Identity / Global ID 设计包）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-024 |
| 版本 | v1.0-SIGNOFF |
| 日期 | 2026-11-24 |
| 状态 | **SIGNOFF_PACKAGE_PREPARED**（待负责人决策；不是架构批准） |
| 候选基线 | 分支 `docs/sessionb-product-identity-global-id-design`，提交 `11cd1aecc60dac0654b813b16208bae16b8bc9be`（父 `0aeb81eb53095e1b66609163297be046c3c422df`） |
| 技术复核 | Reviewer 对 R2.2.10 独立复核结论：设计包技术复核 PASS；R2.2.x 技术问题已闭环 |
| 83 项证据 | `test_evidence_83/SHA256SUMS` Git Blob：`690d62971f222df213a89529ebc785180c41dfd9`（与基线一致） |
| 当前边界 | 未签署、未 Contract Freeze、P0-2 仍 BLOCKED、Business API 未授权、Production Ready 未批准 |

> 本文件只整理决策材料，不替代负责人签署。所有 D-01…D-49 当前仍为 `PROPOSED_NOT_APPROVED`。

## 1. 提交链与事实基线

| 提交 | 内容 |
|---|---|
| `dfde642` | R2 收敛 Morrishk-first 八实体模型 |
| `4a0448c` | R2.1 Alias Brand 上下文、归属、证据边界、Token 上下文 |
| `b150aca` | R2.2 当前/历史映射、三类归属、四角色、证据可见性 |
| `381f46c` | R2.2.1 时间语义、复合外键、审批分离事务 |
| `c6e8f54` | R2.2.2 Alias 规则、principal、审批状态 |
| `ab93dce` | R2.2.3 Global Product 旁路、principal 域互斥、审计三作用域、Alias 约束细节 |
| `54f7957` | R2.2.4 principal binding 唯一键、pending reason、import result、Alias `scope` |
| `4945714` | R2.2.5 V-11 并发导入语义 |
| `12c60eb` | R2.2.6 V-26 same/different key |
| `90d18a8` | R2.2.7 幂等键作用域与权威 |
| `c3df466` | R2.2.8 请求指纹冲突、导入原子事务 |
| `0aeb81e` | R2.2.9 唯一键竞争冲突安全机制 |
| `11cd1ae` | R2.2.10 事务恢复 vs 快照刷新（候选签署基线） |

## 2. 决策摘要（按类别）

### 2.1 业务与身份定义

| 编号 | 决策问题 | 推荐 | 替代 | 需负责人确认/风险 |
|---|---|---|---|---|
| D-01 | Brand 权威来源与注册表 | B 注册表+别名+证据 | A 自由文本；C PDF metadata | 治理与人工维护成本；确认 Brand 权威来源 |
| D-02 | Brand 规范化/别名/合并/更名 | B 注册表别名+更名映射 | A 简单大写去空格；C 全人工 | 别名冲突处理与签署责任 |
| D-03 | MPN 归一化规则 | B 通用+按 Brand/厂商 profile+版本 | A 单一全局规则；C 全人工 | profile 维护与迁移 |
| D-04 | 变体/封装/版本是否进入身份键 | B `variant_state` 三态 | A 仅 MPN+Brand；C 全部独立 | 变体定义边界 |
| D-05 | 全局 ID 方案 | C surrogate + 自然键 | A 自然键主键；B 内容哈希；D 旧自增 | 注册表与迁移成本 |
| D-06 | 合并/拆分/冲突裁决 | B 人工裁决+谱系+审计 | A 自动合并；C 不合并 | 裁决人力与时效 |
| D-11 | 多文档/多版本关系 | B 产品多文档+版本关系 | A 一产品一文档；C 每版本独立 | 版本语义与排序 |
| D-12 | 未知/缺失 Brand | B `PENDING_BRAND` | A 拒绝；C 归入 UNKNOWN | 待确认队列积压 |
| D-13 | Brand 别名冲突 | B 冲突挂起+人工裁决 | A 后写覆盖；C 取最高频 | 裁决时效 |
| D-14 | 身份数据来源优先级 | B 客户主数据优先+解析证据 | A 解析优先；C 人工优先 | 源冲突裁定 |

### 2.2 数据兼容、API 与迁移

| 编号 | 决策问题 | 推荐 | 替代 | 需负责人确认/风险 |
|---|---|---|---|---|
| D-07 | 旧 `product_id=prod-doc` 兼容 | B 保留旧 ID + `product_uid` + 映射 | A 破坏性替换；C 仅视图层 | 双读/迁移复杂度 |
| D-08 | API 暴露 `pbk1_`/`product_uid` | C 双字段（uid 主、pbk 兼容） | A 仅 pbk1；B 仅 uid | DTO/路径变更与不兼容风险 |
| D-09 | 16 操作/75 矩阵修订范围 | B/C 组合，待契约评审 | A 不改路径；C 新增身份管理操作 | 契约线形变更与版本化 |
| D-10 | 迁移/幂等/并发/回滚 | B 分阶段+双读+回滚开关 | A 一次性迁移；C 不迁移 | 迁移窗口与一致性 |
| D-23 | 合并/拆分/normalizer 历史键 | C alias+谱系保留 | A 删除旧键；B 复用旧键 | 存储与查询复杂度 |

### 2.3 审计与治理角色

| 编号 | 决策问题 | 推荐 | 替代 | 需负责人确认/风险 |
|---|---|---|---|---|
| D-15 | 审计与审批角色 | B 执行/批准分离+审计 | A 执行者自审；C 无审批 | 流程成本 |
| D-27 | 客户确认与全局治理 | B 客户确认仅本租户+全局独立治理 | A 客户可改全局；C 全局投票 | 治理流程成本 |
| D-41 | Tenant Assertion 模型与首期可提交范围 | B 仅本租户+四角色审批链 | A 确认即写全局；C 不允许提交 | 断言积压与状态混淆 |
| D-42 | Global Identity Adjudication 角色与承担方 | B `identity.admin` 决策 + `identity.approver` 批准 | A 无独立裁决；C 客户自审 | 角色缺位或身份伪造 |
| D-47 | 稳定主体标识与角色域互斥 | B `principal_id` + `client_subject_binding` + `principal_role` | A `client_id+subject`；C 人工核对 | 换 Client 绕过互斥 |
| D-48 | 审批状态字段一致性与两阶段事务 | B DB CHECK + Tenant 前置 + Global 最终事务重校验 | A 仅应用层；C 单一大事务 | 未批准写全局/半成品 |
| D-49 | Global Product 唯一写入入口 | B 仅 Global APPROVED 最终事务 | A 导入可直接建；C 全人工 | 导入/后台/管理员旁路 |

### 2.4 Alias、Profile 与唯一约束

| 编号 | 决策问题 | 推荐 | 替代 | 需负责人确认/风险 |
|---|---|---|---|---|
| D-16 | Brand Alias 作用域 | C GLOBAL+TENANT | A 仅 GLOBAL；B 仅 TENANT | 租户别名泄露/覆盖 |
| D-17 | Brand Alias 冲突/历史名 | B 冲突挂起+人工+有效期 | A 后写覆盖；C 取最高频 | 旧名断链/错并 |
| D-18 | Brand/MPN Alias 注册表 | B 独立注册表 | A 共用 | 命名冲突 |
| D-19 | MPN Profile 治理 | B 通用+按 Brand/厂商+版本 | A 单全局；C 全人工 | Profile 维护/升级 |
| D-20 | 低置信度 MPN 正式确认 | C PENDING+人工 | A 允许 CONFIRMED；B 拒绝 | 待确认积压 |
| D-21 | 正式唯一约束适用状态 | B 仅 CONFIRMED+ACTIVE | A 所有状态共享 | 部分唯一索引复杂度 |
| D-22 | `PENDING_*` 键隔离 | B 独立待确认队列 | A 主表占键 | 队列/迁移复杂度 |
| D-44 | Brand/MPN Alias 唯一约束与有效期 | B 当前映射部分唯一 + 历史保留 + 任意区间不重叠 + 空键 advisory lock | A 单一 `unique(alias_norm,scope,tenant_id)` | 时间语义/并发实现 |

### 2.5 租户/站点/OAuth 与授权

| 编号 | 决策问题 | 推荐 | 替代 | 需负责人确认/风险 |
|---|---|---|---|---|
| D-24 | 全局产品跨租户共享 | C 全局 Canonical + Tenant Access | A 完全全局；B 每租户独立 | 跨租户泄露/治理 |
| D-25 | Tenant/Organization/ACL 模型 | A 仅 tenant（Organization 延后） | B 组织层级；C 仅 organization | 未来回填/迁移 |
| D-26 | 私有 PDF/解析/证据边界 | B 默认私有+显式共享 | A 全部共享；C 全部私有 | 客户授权/合规 |
| D-28 | 404/403 存在性泄露策略 | C 按可见性分级（需安全评审） | A 一律 404；B 一律 403 | 存在性泄露/可诊断性 |
| D-29 | 单租户假设 | C Morrishk-first 单 Tenant+Site/Client 预留 | A 明确单租户；B 直接多租户 | 未来扩展返工 |
| D-30 | OAuth Scope 与 Tenant ACL | C 四因子 | A 仅 scope；B 仅 ACL | 多重校验复杂度 |
| D-31 | Tenant/Site/OAuth Client 首期边界 | B 三实体 | A 仅 tenant；C 仅 client | 过度设计/未来返工 |
| D-32 | Site-to-Tenant Binding 与 Client 绑定 | B token 绑 tenant+site+client | A 只绑 tenant；C 隐式推导 | 绑定校验遗漏 |
| D-33 | Tenant Product Access 与级别 | B QUERYABLE/EXECUTABLE | A 布尔可见；C 继承合同 | 级别语义争议 |
| D-34 | Resource Access Policy | B ACL+资源可见性 | A 仅 ACL；C 全部公开 | 私有证据泄露/过度过滤 |
| D-43 | Global/Tenant/Site 三类归属与审计归属 | B 三类 + CHECK + 复合外键 + 审计三作用域 | A 全部强制 tenant_id；C 仅应用层 | 归属混用/伪造 |
| D-45 | OAuth Token 可信上下文与状态变化 | B 服务端派生 + 运行期复核 + 禁用即拒绝 | A 信任请求体 | 校验遗漏 |
| D-46 | 首期 Evidence visibility | B 仅 PRIVATE，其余预留 | A 全启用；C 全部公开 | 跨租户证据泄露 |

### 2.6 明确延后项

| 编号 | 决策问题 | 推荐 | 替代 | 需负责人确认/风险 |
|---|---|---|---|---|
| D-35 | Organization Tree | A 不建（延后） | B 现在建；C 轻量 org | 未来回填/迁移 |
| D-36 | 复杂权限继承 | A 不做（延后） | B 现在建；C 扁平角色 | 未来策略引擎重做 |
| D-37 | 计费/订阅 | A 不做（延后，外部系统另评） | B 现在设计；C 外部系统 | 商业模型未定 |
| D-38 | 跨租户协作/共享 | A 首期禁止（延后） | B 现在设计；C 仅公开数据 | 高安全风险 |
| D-39 | 多 Site 运营 | C 预留多 site+单站点启用 | A 只启用一个；B 现在多 site | 预留字段误用 |
| D-40 | 第三方 OAuth Client | A 只自有 client（C 为预留方向） | B 开放注册 | 凭证治理缺失 |

## 3. 仍需负责人确认的开放事项

1. 具体隔离级别配置、事务重试次数/退避、连接池实现（实现期决定）。
2. 跨 document/import 的身份级 pending 去重规则（仍待决）。
3. 历史导入事件若存在旧 `CREATED` 值，需要迁移映射。
4. 本轮未生成/执行 DDL；所有 CHECK/唯一索引/复合外键/触发器需实现期验证。
5. V-77…V-107 均为设计测试，**未执行**；83 项历史 Parser 证据通过不等于新幂等并发设计已运行验证。
6. P0-2 其余四项缺口（解析输出/证据、静态 B2B 桩、后端实现等）仍须独立验收，本次设计复核通过不能替代。

## 4. 负责人签署栏（由负责人填写，Agent 不代填）

### 4.1 分类结论

| 类别 | 决策人 | 结论（采纳/修改/驳回） | 日期 | 备注 |
|---|---|---|---|---|
| 业务与身份定义（D-01…D-06、D-11…D-14） |  |  |  |  |
| 数据兼容/API/迁移（D-07…D-10、D-23） |  |  |  |  |
| 审计与治理角色（D-15、D-27、D-41、D-42、D-47…D-49） |  |  |  |  |
| Alias/Profile/唯一约束（D-16…D-22、D-44） |  |  |  |  |
| 租户/站点/OAuth/授权（D-24…D-26、D-28…D-34、D-43、D-45、D-46） |  |  |  |  |
| 延后项（D-35…D-40） |  |  |  |  |

### 4.2 逐项签署

| 决策 | 决策人 | 结论 | 日期 | 备注 |
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
| D-49 |  |  |  |  |

## 5. 当前状态（非批准）

| 项目 | 状态 |
|---|---|
| 设计包技术复核 | PASS（Reviewer，R2.2.10） |
| 候选签署基线 | `11cd1ae`（待签署） |
| D-01…D-49 | `PROPOSED_NOT_APPROVED` |
| Contract Freeze | 未批准 |
| P0-2 | BLOCKED |
| Business API 实现 | 未授权 |
| Production Ready | 未批准 |

- 本文件仅为签署材料；负责人签署前不得据此开始实现、契约冻结或生产接入。
- 签署后如需进入 Contract Freeze，应另行提交契约冻结材料并独立评审。
