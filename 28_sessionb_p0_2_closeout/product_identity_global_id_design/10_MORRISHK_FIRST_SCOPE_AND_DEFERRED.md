# Morrishk 首期范围与延后清单

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-010 |
| 版本 | v1.3-R2.2.1 |
| 日期 | 2026-11-23 |
| 状态 | **PROPOSED_NOT_APPROVED** |
| 性质 | 范围说明；不是架构批准、不是实现、不是工期承诺 |
| 策略 | **Morrishk-first / Tenant-ready / Multi-site-later** |
| 关联 | `00_DESIGN_OVERVIEW.md` §1.1/§1.2、`06_API_AND_DATABASE_IMPACT.md` §8、`08_DECISION_REGISTER.md` D-31…D-40 |

## 1. 策略

首期只服务 Morrishk 单一客户（Tenant），把 Tenant / Site / OAuth Client / Global Product / Tenant Product Access 的边界收敛清楚，使后续实现不需要推翻首期模型。**不**建设通用 SaaS 多租户平台。

| 维度 | 首期决定 |
|---|---|
| Tenant | Morrishk 是唯一 Tenant |
| Site | Morrishk 官网是唯一启用的 Site |
| OAuth Client | 绑定到 Site，首期只启用自有 client |
| Global Product | 只承载 CONFIRMED 身份与公共字段 |
| Tenant Product Access | 决定租户能看到哪些全局产品 |
| Organization Tree | 不建，明确延后 |
| 多 Site | 字段预留，不启用 |
| 计费/跨租户协作/第三方 OAuth | 明确延后 |

## 2. 首期业务实体（八类）

| 实体 | 关键字段 | 关系 |
|---|---|---|
| `tenant` | tenant_id, tenant_code, status | 1:N site |
| `site` | site_id, tenant_id, primary_domain, status | N:1 tenant；1:N oauth_client |
| `oauth_client` | client_id, site_id, tenant_id, allowed_scopes, status | N:1 site |
| `global_product` | product_uid, brand_id, mpn_norm, variant_state, variant_key, lifecycle_state | N:M tenant（经 access） |
| `tenant_product_access` | tenant_id, product_uid, access_level, valid_from/to, revoked_at | tenant × global_product |
| `tenant_document` | tenant_id, site_id, document_id, product_uid?, ownership | N:1 tenant/site |
| `tenant_evidence` | tenant_id, site_id, evidence_id, document_id, run_id?, visibility, license_ref | N:1 tenant/site（私有证据不跨租户） |
| `audit_log` | audit_id, scope, tenant_id?, site_id?, actor, action, target_ref, at | 混合：GLOBAL 事件无 tenant_id；TENANT 事件必带 tenant_id/site_id |

关系约束：

- `Tenant 1:N Site 1:N OAuth Client`；`Tenant N:M Global Product`。
- Site 不得跨 Tenant；OAuth Client 不得跨 Site；`oauth_client.tenant_id` 必须等于其 site 的 tenant。
- **三类资源归属（R2.2.2，R2.2.1 约束化）**：
  1. **Global-level**：`tenant_id` 必须为 NULL、`site_id` 必须为 NULL —— `global_product`、`brand_registry`、GLOBAL 作用域 `brand_alias`/`mpn_alias`、`mpn_profile`、`global_adjudication`、`product_lineage`。
  2. **Tenant-level**：`tenant_id` NOT NULL、`site_id` 必须为 NULL —— `tenant_product_access`、`tenant`、TENANT 作用域 `identity_conflict`。
  3. **Site-level**：`tenant_id` NOT NULL 且 `site_id` NOT NULL —— `tenant_document`、`tenant_evidence`、`tenant_assertion`、`identity_pending`、`oauth_client`、`site`。
- 数据库约束（非 DDL）：`site` 增加 `UNIQUE (tenant_id, site_id)`；Site-level 表使用复合外键 `(tenant_id, site_id) → site(tenant_id, site_id)`；三类各自 `CHECK` 归属列；`audit_log` 按 `scope` CHECK，`site_id` 非空时复合外键。详见 `04` §3.3.2 / `06` §8.12。
- `audit_log` 为混合作用域：GLOBAL 记录**允许且要求 `tenant_id = NULL`（且 `site_id = NULL`）**；TENANT 记录必带 `tenant_id`，涉及 Site 层级时必须带 `site_id`。全局身份治理事件不得强行归属 Morrishk。
- GLOBAL 与 TENANT 归属混用（全局行伪造 tenant_id、租户行缺 tenant_id、站点行缺 site_id）一律视为错误。

## 3. 支撑表（身份域内部，不是新平台实体）

以下表服务于上述八类实体，**不构成**额外业务实体，也不对外承诺为独立产品能力：

- `identity_pending`、`identity_conflict`：待确认/冲突队列（详见 `03` §4.2、`04` §3）。
- `tenant_assertion`：Morrishk 的租户内确认（TENANT-scoped，不写 `global_product`）；`global_adjudication`：Ds Bit 全局裁决（GLOBAL-scoped，无 `tenant_id`）（详见 `03` §4.4、`06` §8.11）。
- `brand_registry`、`brand_alias`、`mpn_alias`、`mpn_profile`：Brand/MPN 治理（详见 `01`/`02`）。
- `global_product_alias`、`product_lineage`、`product_import_event`、`legacy_map`：兼容、谱系、幂等与迁移（详见 `04`/`05`）。

> 这些表只可由身份域写入；租户私有数据不得进入 `global_product`。

## 4. 边界规则

| 规则 | 内容 |
|---|---|
| B-01 | 全局身份 ≠ 租户访问权；可见性只由 `tenant_product_access` 决定 |
| B-02 | 全局产品不含客户私有 PDF/解析/证据/备注 |
| B-03 | 客户确认 = Tenant Assertion，仅本租户生效，**不得直接写/改 `global_product`**；全局写入只能经 Global Adjudication，且保留客户原始记录 |
| B-04 | 只有 CONFIRMED 身份生成 `product_uid`/`pbk1_`；`PENDING_*` 只在待确认队列 |
| B-05 | 所有 token 必须绑定 tenant + site + client；绑定值由服务端 `oauth_client`→`site`→`tenant` 关系派生，请求体自报值不作为授权依据 |
| B-06 | 拒绝访问也必须审计，避免枚举探测 |
| B-07 | 旧 `product_id` 兼容路径不得绕过 tenant ACL |
| B-08 | 任何跨租户共享必须显式记录来源/授权/有效期，不得默认共享 |
| B-09 | 三类归属不得混用：Global-level 不得带 `tenant_id`/`site_id`；Tenant-level 必须 `tenant_id` 且不得带 `site_id`；Site-level 必须同时带 `tenant_id` 与 `site_id`；以 CHECK + 复合外键落地 |
| B-10 | 全局身份治理事件写 `audit_log(scope='GLOBAL')`，`tenant_id` 允许且要求为 NULL，不得归属 Morrishk |
| B-11 | `tenant_evidence` 是 Site-level 资源：必须同时带 `tenant_id` 与 `site_id`，且 `site.tenant_id = tenant_evidence.tenant_id`；产品全局化不改变证据归属 |
| B-12 | Client/Site 禁用、撤销或绑定变化后，既有 token 必须在运行期复核时被拒绝，不得仅依赖自然过期 |
| B-13 | 首期 `tenant_evidence.visibility` 仅 `PRIVATE`；`SHARED`/`PUBLIC` 为预留，跨租户证据共享暂缓 |
| B-14 | Tenant Assertion 审批链：提交者 → Tenant 审批者 → Global 决策者 → Global 审批者；任一步未完成不得更新 `global_product`；决策者与审批者必须不同人 |
| B-15 | 审批身份必须来自校验后的 token 上下文，不采信请求体自报；四角色身份落库并可审计 |
| B-16 | 审批通过、写 `global_product`、写 alias/lineage、写审计必须在同一事务内原子完成；失败整体回滚 |
| B-17 | Alias 变更使用 UTC 半开区间；同唯一键历史区间不得重叠；当前映射唯一；并发切换加锁并可重试 |

## 5. 四因子授权

```text
ALLOW = OAuth Scope AND Tenant ACL AND Site-to-Tenant Binding AND Resource Access Policy
```

- **OAuth Scope**：操作类别授权（沿用 5 scope/75 矩阵，不新增）。
- **Tenant ACL**：`tenant_product_access` 是否允许该产品。
- **Site-to-Tenant Binding**：token 的 site 属于其 tenant，client 属于该 site。
- **Resource Access Policy**：文档/证据是 public/shared/private，是否允许该租户。

四者缺一即拒绝；Scope 不替代 ACL，全局产品身份不替代访问权。

- `Site-to-Tenant Binding` 判定使用服务端 `oauth_client`→`site`→`tenant` 关系派生值；请求体或 token 自报的 `tenant_id`/`site_id` 若与派生值不一致即拒绝。
- 详见 `06` §7.1–§7.3（Token 可信上下文、状态变化处理、运行期校验顺序）。

## 6. 全局数据 vs 租户私有数据

| 数据 | 归属 | 默认跨租户 |
|---|---|---|
| `global_product` 公共属性 | 全局 Canonical | 受 access 控制 |
| 厂商公开 datasheet 证据 | 全局/公共 | 受许可与策略 |
| 客户上传 PDF | 租户私有 | 否 |
| 解析 run/候选/表格 | 租户私有 | 否 |
| 客户私有证据 bbox/原文 | 租户私有（Site-level） | 否（首期仅 `PRIVATE`） |
| 客户备注/报价/内部状态 | 租户私有 | 否 |
| 待确认/冲突记录 | 租户可见 | 否 |
| 全局身份裁决 / 全局审计事件 | 全局 Canonical（`scope=GLOBAL`） | 否（仅治理角色可读；`tenant_id=NULL`） |
| 客户确认（Tenant Assertion） | 租户私有（`scope=TENANT`） | 否 |

- 全局身份治理事件写入 `audit_log(scope='GLOBAL')`，`tenant_id` 允许且要求为 NULL，不得强行归属于 Morrishk。
- 首期 `tenant_evidence.visibility` 只支持 `PRIVATE`；`SHARED`/`PUBLIC` 与跨租户证据共享暂缓（D-38）。
- 客户对同一产品的确认以 `tenant_assertion` 独立留存；全局采纳/拒绝由 `global_adjudication` 独立记录，二者互不覆盖。

## 7. 首期范围（签署后实现）

1. `tenant`/`site`/`oauth_client` 三实体与绑定校验；
2. 仅 CONFIRMED 写入 `global_product`；PENDING/CONFLICT 队列；
3. `variant_state` 三态（UNKNOWN/NOT_APPLICABLE/KNOWN）与保留哨兵；
4. 独立 Brand Alias / MPN Alias 注册表与作用域；
5. MPN Profile 优先级与 APPROVED-only 自动确认；
6. `tenant_product_access` + 四因子授权；
7. `tenant_document`/`tenant_evidence` 私有边界；
8. `audit_log` 覆盖身份、裁决、授权拒绝；
9. 旧 `product_id` 兼容映射与非破坏迁移设计；
10. Tenant Assertion 提交与租户内确认（不写 `global_product`）；
11. `tenant_evidence` 的 Site 级归属与 `site.tenant_id` 一致性校验；
12. Brand Alias / MPN Alias 的作用域唯一约束与有效期规则；
13. OAuth Token 可信上下文：服务端派生 tenant/site/client，请求体不作为授权依据；
14. Client/Site 禁用/撤销/绑定变化后的 token 运行期复核与拒绝；
15. 四角色审批链（提交/租户审批/全局决策/全局审批）与审批前禁止写 `global_product`；
16. 首期 `tenant_evidence.visibility` 仅 `PRIVATE`。

## 8. 架构预留（首期不启用）

| 预留 | 形式 | 说明 |
|---|---|---|
| 多 Site | 保留 `site_id` 字段与 `site` 表 | 首期只启用官网；新增站点不改表结构 |
| 多 OAuth Client | 保留 `oauth_client.site_id`/scope | 首期只启用自有 client |
| 访问级别扩展 | `access_level` 使用可扩展枚举 | 首期 QUERYABLE/EXECUTABLE |
| 租户隔离 | Global/Tenant/Site 三类归属；Tenant-level 带 `tenant_id`，Site-level 带 `tenant_id`+`site_id`，Global-level 均不带 | 未来增加租户不改主键结构 |

## 9. 明确延后清单

| 延后项 | 原因 | 未来影响 | 决策 |
|---|---|---|---|
| Organization Tree | 首期单客户，无多组织授权需求 | 需 org 表、层级、ACL 继承、数据回填 | D-35 |
| 复杂权限继承 | 四因子已足够；继承规则未定义 | 需策略引擎、冲突消解、审计扩展 | D-36 |
| 计费/订阅 | 非本期商业范围 | 需 billing 实体、计量、对账；与 ACL 解耦 | D-37 |
| 跨租户协作/共享 | 无客户需求，安全风险高 | 需显式共享协议、授权、审计、撤回 | D-38 |
| 多 Site 运营 | 首期只有官网 | 需站点级配置/策略/运营流程 | D-39 |
| 第三方 OAuth Client | 首期单一自有 client | 需 client 注册、scope 审批、密钥轮换 | D-40 |
| 通用 SaaS 平台化 | 不在本项目范围 | 需独立产品化设计 | 不立项 |

> 以上均不在首期实现、不建表、不写接口、不承诺工期。

## 10. 非声明

- 不宣布已建成多租户平台；首期为 Morrishk 单 Tenant 收敛。
- 不宣布 Organization Tree、权限继承、计费或跨租户协作已设计完成。
- 不宣布 D-31…D-40 已批准；全部 `PROPOSED_NOT_APPROVED`。
- 不改变 P0-2 BLOCKED、契约未冻结、Business API 未授权的结论。