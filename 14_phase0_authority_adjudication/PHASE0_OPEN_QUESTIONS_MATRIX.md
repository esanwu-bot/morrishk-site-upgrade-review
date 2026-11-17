# Phase 0 待裁定问题矩阵（IQ-01..IQ-22）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-PHASE0-EVIDENCE-005 |
| 版本 | v1.1（2026-11-17 回填 IQ-01 / IQ-02 / IQ-13 裁定状态） |
| 日期 | 2026-11-17 |
| 来源 | `12_dsbit_business_api_integration_design/INTEGRATION_OPEN_QUESTIONS.md`（v1.2.2） |
| 状态规则 | v1.0 时全部保持原始 `OPEN`；v1.1 仅将 IQ-01 / IQ-02 / IQ-13 标为 `DECIDED`（书面裁定已登记），其余 19 项保持 `OPEN` |
| 证据标签 | `CONFIRMED` / `PARTIALLY_CONFIRMED` / `NOT_FOUND` / `CONFLICTING` / `PROPOSED` / `DECISION_REQUIRED` / `DECIDED` |
| 裁定依据 | 项目决策人 2026-11-17 书面任务书；详见 `DECISION_REGISTER.md` §2 |

---

## 1. 总矩阵

| 编号 | 问题 | 目标阶段 | 阻断级别 | 决策人 | 证据状态 | 是否可提交裁定 | 关键依赖 |
|---|---|---|---|---|---|---|---|
| IQ-01 | 产品身份权威与 ID 空间 | Phase 0 | `BLOCKER_PHASE0` | 项目决策人 | `DECIDED`（2026-11-17，MPN + Brand） | 已裁定 | IQ-13（已裁） |
| IQ-02 | 技术分类归属、种子、是否多体系 | Phase 0 | `BLOCKER_PHASE0` | 项目决策人 | `DECIDED`（2026-11-17，技术参数分类归 Ds Bit，PM 种子） | 已裁定（种子细节待 PM 提交） | IQ-01（已裁） |
| IQ-03 | `category_id` / `category_code` 治理与生成规则 | Phase 1 | `BLOCKER_PHASE1` | Ds Bit | `PROPOSED` | 是（IQ-02 已裁，可进入） | IQ-02 |
| IQ-04 | 同一产品是否允许跨体系多个主分类 | Phase 1 | `BLOCKER_PHASE1` | 客户业务 | `PARTIALLY_CONFIRMED` | 部分（旧站单分类已确认） | IQ-02 |
| IQ-05 | 分类合并/停用保留期与 410 时机 | Phase 0 | `BLOCKER_PHASE0` | 客户业务 + Reviewer | `CONFIRMED`（现状无生命周期） | 是（需业务定窗口） | IQ-02、IQ-15 |
| IQ-06 | 发布状态存储位置 | Phase 1 | `BLOCKER_PHASE1` | Ds Bit | `NOT_FOUND`（无实现） | 否，依赖 IQ-01/02（今已具备） | IQ-01、IQ-02 |
| IQ-07 | 内容审核与发布授权角色 | Phase 2 | `BLOCKER_PHASE2` | 客户业务 | `NOT_FOUND`（无角色/后端） | 否，需组织决策 | IQ-06 |
| IQ-08 | 证据公开范围与版权 | Phase 2 | `BLOCKER_PHASE2` | 客户法务/业务 | `PARTIALLY_CONFIRMED`（模型有字段，无公开 API） | 否，需法务评估 | — |
| IQ-09 | 错误响应包最终形状 | Phase 0 | `BLOCKER_PHASE0` | Reviewer + Ds Bit | `CONFIRMED`（现有平台包形状） | 是 | — |
| IQ-10 | API 域名与环境拓扑 | Phase 4 | `BLOCKER_PHASE4` | 运维 + 安全 | `PARTIALLY_CONFIRMED`（G0 域名存在，非生产） | 否，依赖部署方案 | IQ-22 |
| IQ-11 | OAuth 客户端注册与密钥轮换责任人 | Phase 4 | `BLOCKER_PHASE4` | 安全 + 运维 | `NOT_FOUND`（无 OAuth） | 否，需组织决策 | IQ-21 |
| IQ-12 | Token TTL 与限流配额 | Phase 1 | `BLOCKER_PHASE1` | Ds Bit + 运维 | `PROPOSED`（数值为设计建议） | 部分 | IQ-10 |
| IQ-13 | 对接目标是旧站、新平台还是两者 | Phase 0 | `BLOCKER_PHASE0` | 项目决策人 | `DECIDED`（2026-11-17，新平台） | 已裁定 | — |
| IQ-14 | 同步任务调度位置 | Phase 2 | `BLOCKER_PHASE2` | Morrishk 技术 | `PARTIALLY_CONFIRMED`（有 console，无 cron 定义） | 部分 | IQ-13（已裁） |
| IQ-15 | 新表引擎与字符集 | Phase 0 | `BLOCKER_PHASE0` | 运维 + Morrishk 技术 | `CONFIRMED`（30 MyISAM + 1 InnoDB，utf8） | 是 | IQ-13（已裁） |
| IQ-16 | 是否需要 `categories/{id}/products` | Phase 1 | `NON_BLOCKING` | Ds Bit | `PROPOSED` | 部分 | IQ-02 |
| IQ-17 | JSON-LD 字段范围与审核 | Phase 2 | `BLOCKER_PHASE2` | 客户业务 | `CONFIRMED`（旧站无 JSON-LD） | 是（字段白名单需评审） | IQ-08 |
| IQ-18 | URL/301 变更流程与保留期 | Phase 2 | `BLOCKER_PHASE2` | 客户业务 | `CONFIRMED`（URL 冻结，无 301 模块） | 是 | IQ-02、IQ-05 |
| IQ-19 | 同步日志保留期 | Phase 2 | `NON_BLOCKING` | 运维 | `PROPOSED`（表为设计） | 部分 | IQ-14 |
| IQ-20 | 是否开放 MPN 模糊查找 | Phase 1 | `BLOCKER_PHASE1` | 客户业务 | `PARTIALLY_CONFIRMED`（字段有，归一未对齐） | 部分 | IQ-01（已裁） |
| IQ-21 | 是否允许非生产凭证 | Phase 0 | `BLOCKER_PHASE0` | 客户业务 + 安全 | `CONFIRMED`（当前仅静态桩） | 是 | — |
| IQ-22 | 网络路径（公网/专线/IP 白名单） | Phase 4 | `BLOCKER_PHASE4` | 运维 + 安全 | `PARTIALLY_CONFIRMED`（G0 有白名单，生产拓扑未知） | 否，依赖部署位置 | IQ-10 |

> `DECIDED` 仅表示已登记书面裁定，**不**表示独立 Reviewer 已验收，也**不**表示契约冻结或实现获批。
> 「是否可提交裁定」指证据是否足以让决策人形成选择，不代表问题已经裁定，也不代表执行 Agent 可以代裁。

---

## 2. Phase 0 阻断项明细

Phase 0 阻断项共 7 个：IQ-01、IQ-02、IQ-05、IQ-09、IQ-13、IQ-15、IQ-21。以下逐项说明证据与未决点。

### IQ-01 产品身份权威与 ID 空间

- **已确认：** Ds Bit `product_id` 是文档内容身份，无产品注册表；旧站 `PartNumber` 全局唯一且无厂商字段；新平台 `mpn_norm` 全局唯一但未部署；跨系统无映射。
- **原未决：** 业务键、ID 签发者、`identity_scope` 语义。
- **证据文档：** `IQ01_PRODUCT_IDENTITY_ADJUDICATION.md`。
- **裁定（2026-11-17）：** 废弃 `doc-id` 跨系统主键；`prod-{document_id}` 仅内部临时流转凭证；采用 `MPN + Brand`（唯一键 `(mpn_norm, brand_norm)`），强制版本化 `MpnNormalizer`；Brand 缺失/冲突进入待确认。详见 `DECISION_REGISTER.md` §2.1。
- **当前状态：** `DECIDED`（书面裁定已登记，独立 Reviewer 验收未完成）。
- **裁定后仍开放：** 哈希算法/编码细节、`MpnNormalizer` 规则版本、`identity_scope` 是否入键。

### IQ-02 技术分类归属、种子、是否多体系

- **已确认：** Ds Bit 无技术分类；旧站/新平台分类均为两级导航树；`ParameterCategory` 与文档类型枚举不是产品分类。
- **原未决：** 权威归属、初始种子、体系数量、与导航分类的映射。
- **证据缺口：** 权威种子 `NOT_FOUND`；旧站分类数据因 DB 离线不可统计。
- **证据文档：** `IQ02_TAXONOMY_AUTHORITY_ADJUDICATION.md`。
- **裁定（2026-11-17）：** 严格分离业务导航分类与技术参数分类；技术参数分类由 Ds Bit 管理，PM 提供首个真实种子与命名标准；候选字段 `Package` / `Voltage` / `Operating_Temperature`，正式定义以 PM 种子为准；Fixture 必须标记 `DEMO_FIXTURE` 且不得进入正式数据。详见 `DECISION_REGISTER.md` §2.2。
- **当前状态：** `DECIDED`（书面裁定已登记；PM 种子尚未提交，独立 Reviewer 验收未完成）。
- **裁定后仍开放：** 体系数量、`category_code` 生成（IQ-03）、多主分类（IQ-04）、生命周期（IQ-05）。

### IQ-05 分类合并/停用保留期与 410 时机

- **已确认：** 旧站分类表无 `status`/`deprecated_at`/`deleted_at`，删除即不可用；现有系统无 410 语义。
- **未决：** 保留期（180/365/永久）、`deprecated_at` 起点、保留期内旧页面是否可用、由哪个系统承载生命周期字段。
- **证据：** `01_schema.sql:347-363`；`INTEGRATION_OPEN_QUESTIONS.md:223-259`。
- **依赖：** IQ-02（分类权威）、IQ-15（新表结构）。
- **状态：** `OPEN`。

### IQ-09 错误响应包最终形状

- **已确认：** 新平台契约统一响应包为 `{code, message, data, request_id, meta}`，`code=0` 成功；前端 `ApiError` 已按 `code/message/request_id` 解析；Ds Bit 静态桩返回自定义结构，不构成契约。
- **未决：** 选现有包形状 A、任务书 `error` 对象 B、或双写 C。
- **证据：** `platform/docs/phase1/03-api-contract.yaml:9-12`；`platform/web/src/lib/api/client.ts:28-36,77-90`；`workbench/b2b/serve_b2b.py:240-265`。
- **状态：** `OPEN` / `DECISION_REQUIRED`。

### IQ-13 对接目标是旧站、新平台还是两者

- **已确认：** 旧站 `snsii_product`/`snsii_product_category` 为生产在用结构，URL 冻结；新平台迁移明确禁止 production，本轮未执行；映射设计已含 `morrishk_target` 枚举。
- **原未决：** 只写 `LEGACY_SNSII`、只写 `PLATFORM_PD`、或两者分阶段。
- **证据：** `01_schema.sql:296-363`；`platform/db/migrations/20261116_0002__pd_model_core.up.sql:8`；`config/params.php:97-100`。
- **裁定（2026-11-17）：** 目标系统为 Morrishk **新平台业务数据库**；旧站不再作为目标系统，不实施旧站数据库直接映射；两侧自增内部 ID 均不得作跨系统产品身份，新平台内部 ID 仅作其内部主键。详见 `DECISION_REGISTER.md` §2.3。
- **当前状态：** `DECIDED`（书面裁定已登记，独立 Reviewer 验收未完成）。
- **裁定后仍开放：** 新平台生产授权与迁移执行、旧站数据迁移方案、`morrishk_target` 兼容值取舍。

### IQ-15 新表引擎与字符集

- **已确认：** 旧站 31 张表，30 张 MyISAM、1 张 InnoDB，字符集全部 `utf8`；新平台迁移要求 MySQL 8 且禁止 production。
- **未决：** 新表用 InnoDB + `utf8mb4`、MyISAM + `utf8`、或独立库；是否与旧表同库。
- **证据：** `mysql_schema_audit/02_table_inventory.csv`；`01_schema.sql` 各表 `ENGINE=` 行；`platform/db/migrations/...:8`。
- **状态：** `OPEN` / `DECISION_REQUIRED`。

### IQ-21 是否允许非生产凭证

- **已确认：** Ds Bit 当前无 OAuth2 实现；`serve_b2b.py` 是静态桩，`/oauth/token` 返回固定标记且不校验凭据；生产凭证明确禁止在本设计范围内创建。
- **未决：** 允许本地/预发非生产凭证（A）、只允许静态桩（B）、只允许预发（C）。
- **证据：** `workbench/b2b/serve_b2b.py:34-37,189-224`。
- **状态：** `OPEN` / `DECISION_REQUIRED`。

---

## 3. 建议处理顺序（分析意见，非裁定）

排序原则：先消除会改变其他问题选项的前置变量，再处理实现层参数。

| 批次 | 问题 | 理由 |
|---|---|---|
| 第 1 批 | IQ-13 + IQ-01 | IQ-13 决定目标系统，直接改变 IQ-01 的 C/D 选项可行性；两者应在同一轮裁定或明确互相假定 |
| 第 2 批 | IQ-02 | 分类权威与种子依赖目标系统；IQ-03/04/05/18 均以其为前提 |
| 第 3 批 | IQ-15 + IQ-05 | 新表引擎/字符集决定生命周期字段能否落地；IQ-05 的 410 窗口需要持久化载体 |
| 第 4 批 | IQ-09 | 错误包形状独立，但必须在契约冻结前定稿 |
| 第 5 批 | IQ-21 | 决定 Phase 1/2 联调能否验证真实 Token 流程 |
| 第 6 批（Phase 1） | IQ-03、IQ-04、IQ-06、IQ-12、IQ-16、IQ-20 | 实现前参数；依赖第 1–3 批结果 |
| 第 7 批（Phase 2） | IQ-07、IQ-08、IQ-14、IQ-17、IQ-18、IQ-19 | 接入与运营决策 |
| 第 8 批（Phase 4） | IQ-10、IQ-11、IQ-22 | 生产拓扑与安全，最后确定 |

**说明：**

- 若决策人坚持先裁 IQ-01，则必须在裁定记录中同时写明假定的目标系统（旧站/新平台/两者），否则 IQ-01 的选项 C/D 无法执行。
- IQ-05 与 IQ-02 的依赖是单向的：分类权威未定，生命周期字段归属也无法定。
- IQ-09 与 IQ-21 不依赖业务归属，可以提前裁定。
- 上述顺序不改变任何问题的 `OPEN` 状态，也不构成开工授权。

---

## 4. 阶段冻结门槛

契约冻结至少需要同时满足：

1. 7 个 `BLOCKER_PHASE0` 问题全部形成书面裁定并登记。
2. Ds Bit 权威分支与提交基线书面确定。
3. 本证据包中受分支影响的 `CONFIRMED` 事实完成重新核验。
4. 形成独立冻结记录，明确冻结范围、版本、SHA-256 与生效条件。

当前完成度：

| 门槛 | 状态 |
|---|---|
| Phase 0 问题裁定 | 3 / 7（IQ-01、IQ-02、IQ-13 已登记；IQ-05、IQ-09、IQ-15、IQ-21 未裁） |
| 权威分支确定 | 否 |
| 证据基线重新核验 | 已完成（绑定 HEAD 600439a，待分支裁定） |
| 冻结记录 | 无 |

**契约冻结：NO。实现：仅限本轮任务书明确授权的 Phase 1 UI/Mock；生产实现：NO。**

> v1.1 说明：第 1 批（IQ-13 + IQ-01）与第 2 批（IQ-02）已由项目决策人 2026-11-17 书面裁定登记；本表 §3 的排序保留为历史分析，不再表示这些项仍待裁。

---

## 5. 与原始台账的一致性

- 本文件未修改 `INTEGRATION_OPEN_QUESTIONS.md`。
- 所有 IQ 编号、标题、目标阶段、阻断级别、决策人均取自原文档 §0 总览。
- 本文件新增的「证据状态」「是否可提交裁定」「关键依赖」为调查结论，不改变原问题的 `OPEN` 状态。
- 原文档中的「建议」仍为设计建议，本文件不将其升级为决策。