# P0-2 Owner 最终决策矩阵（D-1…D-7）

| 项 | 值 |
|---|---|
| 文档编号 | REVIEW-P02-FINAL-MATRIX-20261125 |
| 版本 | v1.1（Owner Final Decision Round 已归档；**Sign-off Pending**） |
| 日期 | 2026-11-25（Asia/Shanghai） |
| 权威基线 | `feat/gate6a-audit@5dcecd21a9bf3f7f7046cc8c769fcfbcd2adf1e5` |
| 决策分支 | `docs/p0-2-dc-decision-20261125` |
| 状态词 | 仅 `OWNER_DECIDED / OPEN / NOT_READY`；契约冻结状态另行管理 |
| Owner acceptance | Owner 于 2026-11-25 指令接受下列方向；**姓名/签署标识/日期待正式签署，未代签** |

> **Owner 已选定 ≠ FROZEN**：本矩阵不改变任何契约冻结状态，未新增 `FROZEN`。

---

## 0. 总览

| ID | 决策项 | 当前状态 | 实施授权前必须关闭 | 契约冻结状态 |
|---|---|---|---|---|
| D-1 | Collation（MySQL 8.4 LTS） | `OWNER_DECIDED`（候选）；技术 `NOT_READY` | 是 | 未冻结 |
| D-2 | MPN-NORM-v1 规范化规则 | 方向 `OWNER_DECIDED`；完整规范 `OPEN` | 是 | 未冻结 |
| D-3 | pbk 编码 + 测试向量 | 方向 `OWNER_DECIDED`；精确规范 `OPEN`；向量 `NOT_READY` | 是 | 未冻结 |
| D-4 | Product Catalog 概念模型 | 方向 `OWNER_DECIDED`；概念模型 `OPEN` | 是 | 未冻结 |
| D-5 | B8 evidence summary | 首期 no-summary/no-raw `OWNER_DECIDED`；白名单 `OPEN`；Phase 2 `NOT_FROZEN` | 条件性（视首期是否含 `/evidence`） | 未冻结 |
| D-6 | Tenant 跨租户模型 | 首期隔离 `OWNER_DECIDED`；精确模型/测试 `OPEN`；未来共享 `OPEN` | 首期隔离：是；未来共享：否 | 未冻结 |
| D-7 | CRLF / 未来 LF 快照 | 历史保持 `OWNER_DECIDED`；新批次 `OPEN` | 新快照：否（独立批次） | 未冻结 |

---

## D-1 Collation

| # | 字段 | 内容 |
|---|---|---|
| 1 | Decision ID | D-1 |
| 2 | 当前状态 | Owner 候选 `OWNER_DECIDED`；技术验证 `NOT_READY` |
| 3 | 现有事实与来源 | Owner 已选 MySQL 8.4 LTS / utf8mb4（`D-C_OWNER_IDENTITY_DECISION.md §3A`）；唯一键 `(mpn_norm,brand_norm)`（`DECISION_REGISTER §2.1:52`，@27e62b1） |
| 4 | Owner 需决定的问题 | 身份键采用哪种 collation |
| 5 | 可选方案 | A `utf8mb4_0900_as_cs`（首选）；B `utf8mb4_bin`；C `utf8mb4_0900_bin`；D 其它 |
| 6 | 推荐方案及依据 | **A**：大小写/重音敏感，贴合应用层归一后精确相等 |
| 7 | 技术验证要求 | MySQL 8.4 实例：collation 列表；复合唯一键在大小写/重音/尾随空格/Unicode 等价下的冲突与等值命中；索引字节与上限 |
| 8 | 首期契约影响 | 决定 `product` 唯一索引与查询等值语义 |
| 9 | 实施授权前必须关闭 | **是** |
| 10 | Owner 最终决定 | **接受首选验证候选 `utf8mb4_0900_as_cs`**；实例验证后才能冻结；实施 Agent 不得自行更换 |
| 11 | Owner 姓名 / 签署标识 | ________（待正式签署） |
| 12 | 决策日期 | ________（待正式签署） |
| 13 | 验证证据引用 | ________（MySQL 8.4 实例输出 + SHA-256） |
| 14 | 后续责任人及任务 | Ds Bit 技术负责人 + 运维：实例验证；Owner：正式签署 |
| 15 | 状态更新条件 | 实例验证通过 + 正式签署 + 证据归档 → 技术 `OWNER_DECIDED`；契约评审后另记 `FROZEN` |

---

## D-2 MPN-NORM-v1

| # | 字段 | 内容 |
|---|---|---|
| 1 | Decision ID | D-2 |
| 2 | 当前状态 | 规则方向 `OWNER_DECIDED`；完整规范 `OPEN` |
| 3 | 现有事实与来源 | 强制统一版本化 `MpnNormalizer`（`DECISION_REGISTER §2.1:49-51`）；规则细节不在裁定内（`:59`；`IQ01…§9.4:285`）；现实现未归一（`src/icpdf/parser/pipeline.py:155`） |
| 4 | Owner 需决定的问题 | 完整规范化规则的精确定义（空白集合/大小写范围/Unicode 边界/alias 行为/测试） |
| 5 | 可选方案 | 在已接受框架内细化；或另行修订方向（需重新决策） |
| 6 | 推荐方案及依据 | 按已接受框架形成精确规范：保留 raw、NFC、trim、不删型号字符、alias 仅显式 map、缺失 fail-closed、版本化迁移 |
| 7 | 技术验证要求 | Unicode 空白/大小写库行为；归一前后样本对；跨版本可复算 |
| 8 | 首期契约影响 | 决定 `mpn_norm`/`brand_norm` 与 `pbk` |
| 9 | 实施授权前必须关闭 | **是** |
| 10 | Owner 最终决定 | **接受保守、可版本化、可追溯方向**（保留 raw、NFC、trim、不自动删除 `-`/`/`/`.`、alias 仅显式 map、缺失 fail-closed、升级需版本+迁移+兼容测试）；具体规则待规范 |
| 11 | Owner 姓名 / 签署标识 | ________（待正式签署） |
| 12 | 决策日期 | ________（待正式签署） |
| 13 | 验证证据引用 | ________ |
| 14 | 后续责任人及任务 | Ds Bit 技术负责人：精确规范+样本；Owner：确认 |
| 15 | 状态更新条件 | 精确规范书面确认 + 样本验证 → 完整规范 `OWNER_DECIDED`；冻结需评审 |

---

## D-3 pbk 编码 + 测试向量

| # | 字段 | 内容 |
|---|---|---|
| 1 | Decision ID | D-3 |
| 2 | 当前状态 | 设计方向 `OWNER_DECIDED`；精确规范 `OPEN`；向量 `NOT_READY` |
| 3 | 现有事实与来源 | 候选 `pbk1_`+SHA-256（`12_/API_CONTRACT_CANDIDATE_v1.md §4.3:120-132`，@27e62b1）；`PROPOSED`（`§11.2:444`；`27_/B5_B8_DEPENDENCY_MATRIX.md:13`）；向量要求 `26_/TEST_AND_ACCEPTANCE_CRITERIA.md §B-2`，当前无已验证向量（`26_/FIXTURE_DATA_SPEC.md` F-11） |
| 4 | Owner 需决定的问题 | 精确字节布局/长度前缀/UTF-8 细节；测试向量与期望输出 |
| 5 | 可选方案 | A 候选 §4.3 长度前缀 canonical；B 其它无歧义序列化 |
| 6 | 推荐方案及依据 | **A**：长度前缀无歧义；无生产/调用方，冻结成本最低 |
| 7 | 技术验证要求 | 固定输入→`pbk` 向量表（含跨版本复算）；完整 SHA-256 碰撞说明 |
| 8 | 首期契约影响 | 全部身份路由主键；DTO `product_business_key` |
| 9 | 实施授权前必须关闭 | **是** |
| 10 | Owner 最终决定 | **接受 `pbk1_`+SHA-256 全长；输入顺序 MPN→Brand；版本化无歧义序列化；`pbk` 为可重算业务指纹，非技术主键、非授权凭证；缺失拒绝生成；规则升级不得静默改变既有 `pbk1_` 含义** |
| 11 | Owner 姓名 / 签署标识 | ________（待正式签署） |
| 12 | 决策日期 | ________（待正式签署） |
| 13 | 验证证据引用 | ________（向量文件 + SHA-256） |
| 14 | 后续责任人及任务 | 评审冻结方：编码评审；技术：向量表；Owner：批准 |
| 15 | 状态更新条件 | 精确规范 + 向量齐全 + 评审 → 精确规范 `OWNER_DECIDED`；契约冻结另记 |

---

## D-4 Product Catalog

| # | 字段 | 内容 |
|---|---|---|
| 1 | Decision ID | D-4 |
| 2 | 当前状态 | 方向 `OWNER_DECIDED`；首期概念模型 `OPEN`；实际建表未授权 |
| 3 | 现有事实与来源 | 首期租户隔离（`D-C_OWNER_IDENTITY_DECISION.md §3C`）；Catalog 未独立定义（`P0_2_OWNER_DECISION_EVIDENCE_PACKET.md §5.2`）；全局/租户边界与 TPA（`BACKEND_DATA_MODEL_AND_MIGRATION_DESIGN.md §4`；`OAUTH_TENANT_SITE_TPA_ARCHITECTURE.md §4`） |
| 4 | Owner 需决定的问题 | 同租户重复身份幂等；alias/冲突处理；Catalog Product↔Identity 关系；自动关联 vs 人工审核边界 |
| 5 | 可选方案 | 在"最小内部 Catalog"方向内细化；或改为租户自有 Catalog Product（需重决） |
| 6 | 推荐方案及依据 | 最小内部 Catalog：`product_uid` 技术主键；Catalog Product 租户内；Document/ParseRun 独立；同一身份关联多文档 |
| 7 | 技术验证要求 | 概念一致性（唯一性/访问边界）；无 DDL |
| 8 | 首期契约影响 | 产品可见集与租户访问模型 |
| 9 | 实施授权前必须关闭 | **是** |
| 10 | Owner 最终决定 | **接受最小内部 Catalog 概念，不建完整产品主数据平台**：`product_uid` 技术主键；Product Identity 存规范化 MPN/Brand/身份版本；Catalog Product 租户内可管理；Document/ParseRun 独立；身份不由 `document_id`/`parse_run_id` 决定；同一身份可关联多文档；`pbk` 非授权凭证；首期租户内 Catalog，不引入全局/跨租户 |
| 11 | Owner 姓名 / 签署标识 | ________（待正式签署） |
| 12 | 决策日期 | ________（待正式签署） |
| 13 | 验证证据引用 | ________ |
| 14 | 后续责任人及任务 | 架构：概念模型；Owner：确认 |
| 15 | 状态更新条件 | 概念模型 + 权限边界书面化 → 概念模型 `OWNER_DECIDED` |

---

## D-5 B8 evidence summary

| # | 字段 | 内容 |
|---|---|---|
| 1 | Decision ID | D-5 |
| 2 | 当前状态 | 首期 no-summary/no-raw `OWNER_DECIDED`；白名单 `OPEN`；Phase 2 `NOT_FROZEN` |
| 3 | 现有事实与来源 | `D-C_OWNER_IDENTITY_DECISION.md §3D`；B8 `OPEN(IQ-08)`（`12_/API_CONTRACT_CANDIDATE_v1.md §11.2:447`）；口径冲突（`16_/FREEZE_READINESS_REVIEW.md:208-214`）；影响（`27_/B5_B8_DEPENDENCY_MATRIX.md §5`） |
| 4 | Owner 需决定的问题 | （Phase 2）summary 白名单、角色/租户限制、验收条件 |
| 5 | 可选方案 | Phase 2 时 A 仅 page_number+field_name+source_type；B A+经审核 locator_summary；C 全部延后 |
| 6 | 推荐方案及依据 | Phase 2 起步 A；locator_summary 需限长+审核；bbox/raw_text/截图延后 |
| 7 | 技术验证要求 | Phase 2 再验证；首期无 API |
| 8 | 首期契约影响 | 首期无 `/evidence`，不影响首期契约 |
| 9 | 实施授权前必须关闭 | **否**（首期不含 API）；若范围扩大含 `/evidence` 则**是** |
| 10 | Owner 最终决定 | **首期不含 B8 summary API、原始 evidence API、`/evidence` 访问能力；相关能力 Phase 2 单独评审** |
| 11 | Owner 姓名 / 签署标识 | ________（待正式签署） |
| 12 | 决策日期 | ________（待正式签署） |
| 13 | 验证证据引用 | ________ |
| 14 | 后续责任人及任务 | 法务/业务 + 维护人：Phase 2 白名单；Owner：批准 |
| 15 | 状态更新条件 | 首期范围维持 no-summary；Phase 2 需另行决策 |

---

## D-6 Tenant 跨租户模型

| # | 字段 | 内容 |
|---|---|---|
| 1 | Decision ID | D-6 |
| 2 | 当前状态 | 首期严格隔离 `OWNER_DECIDED`；精确模型/测试 `OPEN`；未来共享 `OPEN` |
| 3 | 现有事实与来源 | `D-C_OWNER_IDENTITY_DECISION.md §3C`；Tenant/Site/TPA 设计候选未实现（`OAUTH_TENANT_SITE_TPA_ARCHITECTURE.md:4-8`）；跨租户共享首期禁止（`:61`） |
| 4 | Owner 需决定的问题 | 精确 tenant ownership/scope/错误路径/测试；未来是否允许共享（另行决策） |
| 5 | 可选方案 | 首期仅隔离、共享延后（推荐）；首期即设计共享（不推荐） |
| 6 | 推荐方案及依据 | 首期仅隔离；补齐 ownership/scope/测试 |
| 7 | 技术验证要求 | 跨租户读取/搜索/关联/更新拒绝测试；同租户重复身份测试；跨租户身份碰撞拒绝 |
| 8 | 首期契约影响 | 所有查询强制 tenant scope；相同 pbk 不共享 |
| 9 | 实施授权前必须关闭 | 首期隔离：**是**；未来共享：**否** |
| 10 | Owner 最终决定 | **再次确认首期严格租户隔离**：默认禁止跨租户查询/搜索/关联/读取/共享；相同 `pbk` 不代表共享、不构成授权；跨租户共享不在首期；未来共享另行决策。首期须补齐 Catalog Product tenant ownership、查询/搜索/关联/更新/错误路径 tenant scope、同租户重复身份测试、跨租户身份碰撞与拒绝测试 |
| 11 | Owner 姓名 / 签署标识 | ________（待正式签署） |
| 12 | 决策日期 | ________（待正式签署） |
| 13 | 验证证据引用 | ________ |
| 14 | 后续责任人及任务 | 安全/架构：隔离测试；Owner：共享政策 |
| 15 | 状态更新条件 | 隔离测试通过 → 精确模型 `OWNER_DECIDED`；共享另立决策 |

---

## D-7 CRLF / 未来 LF 快照

| # | 字段 | 内容 |
|---|---|---|
| 1 | Decision ID | D-7 |
| 2 | 当前状态 | 历史保持 `OWNER_DECIDED`；新 LF 快照 `OPEN` |
| 3 | 现有事实与来源 | `D-C_OWNER_IDENTITY_DECISION.md §3E`；根因证据（`P0_2_OWNER_DECISION_EVIDENCE_PACKET.md §7`）；测试 `tests/unit/test_assembly.py:579-595`，常量 `:72-74` |
| 4 | Owner 需决定的问题 | 新快照批次、版本/时间/来源 commit/清单；`pipeline.py` 是否单独重授权 |
| 5 | 可选方案 | A 另批 LF 新快照 + 独立清单（推荐）；B 测试内 EOL 归一；C 书面豁免 |
| 6 | 推荐方案及依据 | **A**（未来批次）；历史不改写；`pipeline.py` 变更另批重授权 |
| 7 | 技术验证要求 | LF 归一双侧一致；新快照 SHA-256 清单；跨平台复算 |
| 8 | 首期契约影响 | 不改变身份契约；独立批次 |
| 9 | 实施授权前必须关闭 | **否**（独立批次）；但 `pipeline.py` 变更需另批重授权 |
| 10 | Owner 最终决定 | **历史快照/报告/证据/既有哈希保持原样**；未来另批 LF 新快照（独立版本/生成时间/来源 commit/规范化规则/SHA-256 清单）；Git blob/LF 为校验依据；`pipeline.py` 变更另批重授权；本轮不生成或改写历史快照 |
| 11 | Owner 姓名 / 签署标识 | ________（待正式签署） |
| 12 | 决策日期 | ________（待正式签署） |
| 13 | 验证证据引用 | ________ |
| 14 | 后续责任人及任务 | 测试/架构：新快照方案与清单；Owner：批准批次 |
| 15 | 状态更新条件 | 新快照批次生成 + 清单归档 → 新批次 `OWNER_DECIDED`；历史不可改 |

---

## 状态与边界

- 「Owner 最终决定」列记录 Owner 2026-11-25 指令接受的方向；「姓名/签署标识/日期/验证证据」列**留空待正式签署**，未代签。
- 未新增任何 `FROZEN`；契约冻结状态独立管理。
- 未修改代码/DDL/API/测试/证据；未推送、未合并。
