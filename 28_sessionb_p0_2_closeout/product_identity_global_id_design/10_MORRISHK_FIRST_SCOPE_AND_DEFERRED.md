# Morrishk 首期范围与延后清单

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PID-010 |
| 版本 | v1.0-R2 |
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
| `tenant_evidence` | tenant_id, evidence_id, visibility, license_ref | N:1 tenant |
| `audit_log` | audit_id, tenant_id, actor, action, target_ref, at | 关联全部写操作 |

关系约束：

- `Tenant 1:N Site 1:N OAuth Client`；`Tenant N:M Global Product`。
- Site 不得跨 Tenant；OAuth Client 不得跨 Site；`oauth_client.tenant_id` 必须等于其 site 的 tenant。
- 所有业务行必须带 `tenant_id`；`tenant_document`/`tenant_evidence` 另带 `site_id`。

## 3. 支撑表（身份域内部，不是新平台实体）

以下表服务于上述八类实体，**不构成**额外业务实体，也不对外承诺为独立产品能力：

- `identity_pending`、`identity_conflict`：待确认/冲突队列（详见 `03` §4.2、`04` §3）。
- `brand_registry`、`brand_alias`、`mpn_alias`、`mpn_profile`：Brand/MPN 治理（详见 `01`/`02`）。
- `global_product_alias`、`product_lineage`、`product_import_event`、`legacy_map`：兼容、谱系、幂等与迁移（详见 `04`/`05`）。

> 这些表只可由身份域写入；租户私有数据不得进入 `global_product`。

## 4. 边界规则

| 规则 | 内容 |
|---|---|
| B-01 | 全局身份 ≠ 租户访问权；可见性只由 `tenant_product_access` 决定 |
| B-02 | 全局产品不含客户私有 PDF/解析/证据/备注 |
| B-03 | 客户确认只影响本租户，不修改全局 Brand/MPN 规则 |
| B-04 | 只有 CONFIRMED 身份生成 `product_uid`/`pbk1_`；`PENDING_*` 只在待确认队列 |
| B-05 | 所有 token 必须绑定 tenant + site + client，且三者自洽 |
| B-06 | 拒绝访问也必须审计，避免枚举探测 |
| B-07 | 旧 `product_id` 兼容路径不得绕过 tenant ACL |
| B-08 | 任何跨租户共享必须显式记录来源/授权/有效期，不得默认共享 |

## 5. 四因子授权

```text
ALLOW = OAuth Scope AND Tenant ACL AND Site-to-Tenant Binding AND Resource Access Policy
```

- **OAuth Scope**：操作类别授权（沿用 5 scope/75 矩阵，不新增）。
- **Tenant ACL**：`tenant_product_access` 是否允许该产品。
- **Site-to-Tenant Binding**：token 的 site 属于其 tenant，client 属于该 site。
- **Resource Access Policy**：文档/证据是 public/shared/private，是否允许该租户。

四者缺一即拒绝；Scope 不替代 ACL，全局产品身份不替代访问权。

## 6. 全局数据 vs 租户私有数据

| 数据 | 归属 | 默认跨租户 |
|---|---|---|
| `global_product` 公共属性 | 全局 Canonical | 受 access 控制 |
| 厂商公开 datasheet 证据 | 全局/公共 | 受许可与策略 |
| 客户上传 PDF | 租户私有 | 否 |
| 解析 run/候选/表格 | 租户私有 | 否 |
| 客户私有证据 bbox/原文 | 租户私有 | 否 |
| 客户备注/报价/内部状态 | 租户私有 | 否 |
| 待确认/冲突记录 | 租户可见 | 否 |

## 7. 首期范围（签署后实现）

1. `tenant`/`site`/`oauth_client` 三实体与绑定校验；
2. 仅 CONFIRMED 写入 `global_product`；PENDING/CONFLICT 队列；
3. `variant_state` 三态（UNKNOWN/NOT_APPLICABLE/KNOWN）与保留哨兵；
4. 独立 Brand Alias / MPN Alias 注册表与作用域；
5. MPN Profile 优先级与 APPROVED-only 自动确认；
6. `tenant_product_access` + 四因子授权；
7. `tenant_document`/`tenant_evidence` 私有边界；
8. `audit_log` 覆盖身份、裁决、授权拒绝；
9. 旧 `product_id` 兼容映射与非破坏迁移设计。

## 8. 架构预留（首期不启用）

| 预留 | 形式 | 说明 |
|---|---|---|
| 多 Site | 保留 `site_id` 字段与 `site` 表 | 首期只启用官网；新增站点不改表结构 |
| 多 OAuth Client | 保留 `oauth_client.site_id`/scope | 首期只启用自有 client |
| 访问级别扩展 | `access_level` 使用可扩展枚举 | 首期 QUERYABLE/EXECUTABLE |
| 租户隔离 | 全表 `tenant_id` | 未来增加租户不改主键结构 |

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