# DECISION REGISTER · Phase 3 待裁定事项统一登记表

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE3-DEC-001 |
| 版本 | v1.0-draft（登记表；全部状态引自权威登记并**原样保持**，零关闭、零升级） |
| 日期 | 2026-11-21 |
| 权威来源 | DIFF：`25_/DIFF_CHECK_REPORT.md`；IQ：`14_/DECISION_REGISTER.md` + `14_/PHASE0_OPEN_QUESTIONS_MATRIX.md` + `12_/INTEGRATION_OPEN_QUESTIONS.md`；B5–B8：`12_/API_CONTRACT_CANDIDATE_v1.md` §11.2 + `25_/RULE_STATUS_REGISTER.md`；P0-2：`14_/DSBIT_AUTHORITY_BASELINE.md` + `16_/FREEZE_READINESS_REVIEW.md` |
| 口径 | `DECIDED`（已登记裁定）≠ 已签署 ≠ 已验收；`OPEN` 未关闭；`PROPOSED` 未冻结；空白 = 未裁定。执行 Agent 不得代填决策人/签署人/验收结论 |

## 1. 统一登记表

| ID | 类别 | 问题 | 当前状态 | 候选方案（决策输入，非选定） | 证据（权威登记位置） | 决策人 | 签署人 | 独立验收 | 阻断 |
|---|---|---|---|---|---|---|---|---|---|
| DIFF-CONTRACT-01 | 契约差异 | 搜索返回 DTO 形态（OpenAPI items=Product[] vs EX-17/Mock 扁平身份行） | **PENDING** | A 完整 Product[]；B 扁平身份行；C 独立 SearchItem schema | `25_/DIFF_CHECK_REPORT.md` §2.1；OpenAPI `:1307-1325`/`:1041-1055`；EX-17 `:1101-1140`；MD §6.4 | 设计文档维护人 | —（文档修正随裁定） | Reviewer 一致性复验 | OP-02 响应断言；W-1/W-3 序列化 |
| DIFF-CONTRACT-03 | 契约差异 | 缺 brand 错误码（MD §6.4+候选 §4.5 = 422 vs EX-17 说明 = 400） | **PENDING** | A 422/42201 missing=[brand]；B 400/40001 field=brand | 同上 §2.1；MD `:889-891`；候选 §4.5；EX-17 `:1141-1143`；Mock 422（`mock-api.js:217-219`） | 设计文档维护人（示例修正） | — | Reviewer 一致性复验 | E-42201 双向量断言 |
| DIFF-MOCK-05 | Mock/公开行为 | search 默认公开状态过滤 | **OPEN** | A 默认仅 RELEASED（MD §6.4/OpenAPI 默认声明方向）；B 不自动过滤（显式参数控制） | `25_/DIFF_CHECK_REPORT.md` §2.2；MD `:897-899`；OpenAPI `:142,694`；`mock-api.js:233-239` | 客户业务负责人 + Reviewer | — | Reviewer 复核 | OP-02/16 默认过滤断言；W-1/W-2 默认值 |
| DIFF-MOCK-11 | Mock/公开行为 | 证据明细（页码/bbox/原文）承载方式与公开范围 | **OPEN** | 承载：Fixture 全量构造（Phase 2 已规划）；暴露范围随 IQ-08/B8 裁定 | `25_/DIFF_CHECK_REPORT.md` §2.2；`ACCEPTANCE_PACKAGE.md:134`；`FIXTURE_DATA_SPEC.md` E-FIX | 口径统一：Reviewer+维护人；范围裁定：客户法务/业务（IQ-08） | — | Reviewer 复核 | `/evidence` 暴露字段断言 |
| IQ-01 | Phase 0 IQ | 产品身份权威与 ID 空间（MPN+Brand） | **DECIDED**（登记）+ 待签署 + 未验收 | 已裁定方向（登记 §2.1），剩余细节见 B5 | `14_/DECISION_REGISTER.md:31`（§2.1 `:42-59`） | 项目决策人（已裁定） | **待签署（签署人未指定）** | **未完成**：非执行 Agent 独立验收 | P0-3；Freeze；生产 |
| IQ-02 | Phase 0 IQ | 技术分类归属、种子、多体系 | **DECIDED**（登记）+ 待签署 + 未验收 | 已裁定方向（§2.2）；体系数量仍开放 | `14_/DECISION_REGISTER.md:32`（§2.2 `:61-72`） | 项目决策人（已裁定） | **待签署** | **未完成** | P0-3；R-TAX-03 |
| IQ-13 | Phase 0 IQ | 对接目标（新平台业务库） | **DECIDED**（登记）+ 待签署 + 未验收 | 已裁定方向（§2.3）；生产授权未批 | `14_/DECISION_REGISTER.md:35`（§2.3 `:74-83`） | 项目决策人（已裁定） | **待签署** | **未完成** | P0-3；Freeze |
| IQ-05 | Phase 0 IQ | 分类保留期与 410 时机 | **OPEN**（登记行空） | A 180 天；B 365 天；C 永久保留（材料 §IQ-05，决策人自选） | `14_/DECISION_REGISTER.md:33`；`14_/IQ05_IQ09_IQ15_IQ21_DECISION_BRIEFS.md` | 客户业务负责人 + Reviewer | — | 裁定后随 Freeze 复核 | P0-1；OP-09/13/14/15/16（41002）；R-TAX-04 |
| IQ-09 | Phase 0 IQ | 错误响应包最终形状 | **OPEN**（登记行空） | A 现有包形状；B error 对象；C 双写（材料 §IQ-09） | `14_/DECISION_REGISTER.md:34`；Briefs；`25_/DIFF_CHECK_REPORT.md`（Mock data 承载差异） | Reviewer + Ds Bit 负责人 | — | 裁定后随 Freeze 复核 | P0-1；全部 16 操作响应形状；错误明细承载 |
| IQ-15 | Phase 0 IQ | 新表引擎与字符集 | **OPEN**（登记行空） | A InnoDB+utf8mb4；B MyISAM+utf8；C 独立库（材料 §IQ-15） | `14_/DECISION_REGISTER.md:36`；`mysql_schema_audit/02_table_inventory.csv` | 运维 + Morrishk 技术负责人 | — | 裁定后随 Freeze 复核 | P0-1；持久化选型（不改线形） |
| IQ-21 | Phase 0 IQ | 是否允许非生产凭证 | **OPEN**（登记行空） | A 本地/预发非生产凭证；B 仅静态桩；C 仅预发（材料 §IQ-21） | `14_/DECISION_REGISTER.md:37`；Briefs | 客户业务负责人 + 安全 | — | 裁定后随 Freeze 复核 | P0-1；OP-01 有效流；W-4 本地验证；W-3 联调凭证 |
| B5 | 设计内部阻断 | MPN-NORM-v1 规则集 + pbk1_ 编码评审冻结 | **PROPOSED**，未评审冻结 | 冻结候选规则集并附向量化测试证据（或退回修改） | `12_/API_CONTRACT_CANDIDATE_v1.md:444`；`25_/RULE_STATUS_REGISTER.md` R-ID-04..06；`26_/FIXTURE_DATA_SPEC.md` F-10/F-11 | 评审冻结方（Reviewer/设计评审） | 冻结记录签署 | 向量化测试证据复验 | P0-4；全部身份路由；42202；W-2 |
| B6 | 设计内部阻断 | 三套状态命名空间统一 | **OPEN** | A 按候选枚举原样冻结；B 重命名统一；C 建立映射表 | `12_/API_CONTRACT_CANDIDATE_v1.md:445`（§9.3）；OpenAPI `:62-66` | 设计文档维护人 | — | Reviewer 复核 | P0-5；R-ST-01..04；OP-02/04 |
| B7 | 设计内部阻断 | 技术参数字典正式种子与命名标准 | **待 PM 提交** | PM 提交种子（Package/Voltage/Operating_Temperature 等）→ 冻结记录登记 | `12_/API_CONTRACT_CANDIDATE_v1.md:446`；`14_/DECISION_REGISTER.md:67-69` | PM | — | 冻结记录登记来源与版本 | P0-6；R-DIC-01/02/04；字典内容 |
| B8 | 设计内部阻断 | 证据公开范围与口径统一 | **OPEN**（IQ-08） | 口径统一（§11.2 冻结阻断 vs 附录 A.3 Phase 2）→ 裁定范围或书面豁免 | `12_/API_CONTRACT_CANDIDATE_v1.md:447` vs 主文档附录 A.3 `:2433`；`16_/FREEZE_READINESS_REVIEW.md:208-214` | 口径：Reviewer+维护人；范围：客户法务/业务 | — | 冻结记录载明 | P0-7；R-EV-01/02；OP-06 |
| P0-2 | 权威基线 | Ds Bit 权威分支确认 + 干净提交五项复验 | **DECISION_REQUIRED** | 三候选（见 `P0_2_AUTHORITY_CONFIRMATION.md`），由决策人书面指定 | `14_/DSBIT_AUTHORITY_BASELINE.md` §1；`16_/FREEZE_READINESS_REVIEW.md:166-176` | Ds Bit 负责人/项目决策人 | 确认记录签署 | 五项复验由非执行 Agent 完成 | P0-2；Freeze；Session B 证据基线 |

## 2. 登记纪律

1. 本表为**决策准备**：候选方案是决策输入，不构成选定；"决定后需更新"内容见 `CONTRACT_DECISION_MATRIX.md` 各行。
2. 签署与验收栏全部留白；执行 Agent 不得代填（对齐 `14_/DECISION_REGISTER.md` §1 记录规则第 6 条）。
3. 任何 ID 的状态变更必须发生在权威登记（`14_`/`12_`/`16_`），本表随后同步引用，不在本包内改状态。
