# IQ SIGNOFF REGISTER · IQ 签署与独立验收登记（Phase 3 准备版）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE3-IQ-001 |
| 版本 | v1.0-draft（签署与验收**准备**；登记状态引自权威 `14_/DECISION_REGISTER.md`，签署与验收栏全部留白，执行 Agent 不代填） |
| 日期 | 2026-11-21 |
| 权威登记 | `14_phase0_authority_adjudication/DECISION_REGISTER.md`（裁定 §2.1–2.3；签署与验收 §2.4）——本包不改动权威登记 |

## 1. IQ-01 / IQ-02 / IQ-13：签署与独立验收准备

| 维度 | IQ-01 产品身份 | IQ-02 技术分类 | IQ-13 对接目标 |
|---|---|---|---|
| 原始问题 | 产品身份权威与 ID 空间（doc-id 废弃，MPN+Brand 唯一键） | 技术分类归属、初始种子、是否多体系（两套分类硬隔离） | 对接目标系统（旧站/新平台/两者） |
| 当前状态 | **DECIDED**（2026-11-17 书面任务书裁定，登记 §2.1）+ **待签署** + **未验收** | **DECIDED**（§2.2）+ **待签署** + **未验收** | **DECIDED**（§2.3）+ **待签署** + **未验收** |
| 对应证据文件 | `14_/DECISION_REGISTER.md:31`（裁定全文 `:42-59`）；`14_/IQ01_PRODUCT_IDENTITY_ADJUDICATION.md`；`14_/EVIDENCE_INDEX.md` | `14_/DECISION_REGISTER.md:32`（`:61-72`）；`14_/IQ02_TAXONOMY_AUTHORITY_ADJUDICATION.md`（体系数量 §10.5 仍开放） | `14_/DECISION_REGISTER.md:35`（`:74-83`）；`platform/db/migrations` 禁 production 头；旧站 DDL 审计 |
| 决策责任方 | 项目决策人（已裁定） | 项目决策人（已裁定） | 项目决策人（已裁定） |
| 签署责任方 | **待指定**（`DECISION_REGISTER.md:92` 签署人"未指定"） | **待指定**（`:93`） | **待指定**（`:94`） |
| 独立验收条件 | 非执行 Agent 复核：裁定转录与任务书一致；唯一键 `(mpn_norm, brand_norm)` 与 raw 保留字段在契约候选/Registry/计划包中的落地一致性；`identity_scope` 等未决项未被擅自关闭 | 同口径复核：两套分类硬隔离落地（API 不含导航分类端点）；Fixture `DEMO_FIXTURE` 纪律；体系数量未决未被擅自裁定 | 同口径复核：目标=新平台表述一致；`morrishk_target` 兼容值未决未被擅自裁定；旧站不在任何 API 语义中 |
| 未完成时阻断范围 | P0-3；Contract Freeze；生产实现；跨系统映射落地 | P0-3；Freeze；R-TAX-03（体系数量）；字典种子链（B7 依赖 IQ-02 开放） | P0-3；Freeze；`morrishk_target` 兼容值；旧站迁移方案 |
| 签署栏（由签署人填写） | 签署人：____ 签署日期：____ | 签署人：____ 签署日期：____ | 签署人：____ 签署日期：____ |
| 验收栏（由非执行 Agent 填写） | 验收结论：____ 验收人：____ 日期：____ 基线：____ | 同左 | 同左 |

## 2. IQ-05 / IQ-09 / IQ-15 / IQ-21：书面裁定准备

| 维度 | IQ-05 分类保留期与 410 | IQ-09 错误响应包形状 | IQ-15 新表引擎与字符集 | IQ-21 非生产凭证许可 |
|---|---|---|---|---|
| 原始问题 | 分类合并/停用后保留多久、`410 CATEGORY_RETIRED` 何时返回 | 统一响应包最终形状（A 现状包 / B error 对象 / C 双写） | 新表引擎与字符集（InnoDB+utf8mb4 / MyISAM+utf8 / 独立库） | 是否允许本地/预发使用非生产 OAuth2 凭证 |
| 当前状态 | **OPEN**（`DECISION_REGISTER.md:33` 空） | **OPEN**（`:34` 空） | **OPEN**（`:36` 空） | **OPEN**（`:37` 空） |
| 对应证据文件 | `14_/IQ05_IQ09_IQ15_IQ21_DECISION_BRIEFS.md` §IQ-05；旧站 DDL（无生命周期字段）；`openapi.candidate.v1.json:499` | Briefs §IQ-09；`platform/docs/phase1/03-api-contract.yaml:9-12`；`platform/web/src/lib/api/client.ts`；`serve_b2b.py:240-265`；`25_/DIFF_CHECK_REPORT.md`（Mock data 承载差异） | Briefs §IQ-15；`mysql_schema_audit/02_table_inventory.csv`（30 MyISAM+1 InnoDB、utf8）；新平台迁移 MySQL 8 | Briefs §IQ-21；`serve_b2b.py`（静态桩）；`26_/OAUTH2_INTEGRATION_PLAN.md` §5 |
| 决策责任方 | 客户业务负责人 + Reviewer | Reviewer + Ds Bit 负责人 | 运维 + Morrishk 技术负责人 | 客户业务负责人 + 安全 |
| 签署责任方 | 同决策方（书面裁定进入 `DECISION_REGISTER.md` §2 对应行） | 同左 | 同左 | 同左 |
| 独立验收条件 | 裁定转录一致性 + 对 `41002` 语义（候选 §6.4）落地复核 | 包形状三处一致（OpenAPI/MD/客户端代码）复核 + 错误明细承载（data vs meta，DIFF-MOCK-01）一并裁定 | 不改线形；DDL 选型仅约束未来实施，不生成 DDL | 裁定后 V-1..V-4 本地验证计划可启用；凭证形态有命名与签发纪律 |
| 未完成时阻断范围 | P0-1；OP-09/13/14/15/16 的 41002 断言；301/下线计划 | P0-1；全部 16 操作响应形状；错误明细承载（DIFF-MOCK-01）；W-1 序列化/W-3 反序列化 | P0-1；持久化实施（不改线形） | P0-1；OP-01 有效流测试；W-4 本地验证；W-3 联调凭证形态 |
| 裁定栏（由决策人填写） | 决定：____ 日期：____ | 决定：____ 日期：____ | 决定：____ 日期：____ | 决定：____ 日期：____ |

## 3. 签署/验收流程要求（引自权威登记口径，重申）

1. 只有**书面**裁定进入 `DECISION_REGISTER.md` §2 对应行后才生效；口头/聊天"可以"不算。
2. 执行 Agent 不得代填「决策人」「结论」「日期」「签署人」「验收结论」。
3. 独立 Reviewer 验收必须由非执行 Agent 完成，并另行留下验收记录。
4. 三项 DECIDED 在签署与验收完成前，仍不能作为契约冻结或生产实现的依据。
5. 全部 7 行填写并签署只是 Freeze 的**必要**条件，还需权威分支确定（P0-2）、证据基线复验与独立冻结记录。

## 4. 当前完成度

| 项 | 数值 |
|---|---|
| 已登记裁定 | 3/7（IQ-01/02/13） |
| 已签署 | **0/3** |
| 独立验收完成 | **0/3** |
| OPEN 未裁 | 4/7（IQ-05/09/15/21） |
| **对 Freeze 的净效果** | **NOT_READY（G1 门槛未达成）** |
