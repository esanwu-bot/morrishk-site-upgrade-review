# P0-2 Owner 最终决策指南（D-1…D-7）

| 项 | 值 |
|---|---|
| 文档编号 | REVIEW-P02-FINAL-GUIDE-20261125 |
| 版本 | v1.0（决策准备；**不代裁、不实施、不冻结**） |
| 日期 | 2026-11-25（Asia/Shanghai） |
| 权威基线 | `feat/gate6a-audit@5dcecd21a9bf3f7f7046cc8c769fcfbcd2adf1e5` |
| 决策分支 | `docs/p0-2-dc-decision-20261125` |
| 上游决策 | `D-C_OWNER_IDENTITY_DECISION.md`（`OWNER_DECISION_ACCEPTED`） |
| 证据包 | `P0_2_OWNER_DECISION_EVIDENCE_PACKET.md` |
| 性质 | 供 Owner 逐项决策；技术验证与业务裁决分离；状态只用 `OWNER_DECIDED / OPEN / NOT_READY` |
| Owner acceptance | **2026-11-25 已接受 D-1…D-7 方向（`OWNER_DECIDED`）；正式 Sign-off Pending；技术验证/精确规范仍 `OPEN` / `NOT_READY`** |

**引用约定**：本文件只引用本轮已核实的证据路径/章节；外部评审仓统一引用 `morrishk-site-upgrade-review@27e62b1`（`27e62b159394b2a95002e0ffb98c054f164aef7b`）。

---

## D-1 Collation（MySQL 8.4 LTS）

### 事实
- Owner 已选定 Engine `MySQL` / Version `8.4 LTS` / Charset `utf8mb4`（`D-C_OWNER_IDENTITY_DECISION.md §3A`）。
- Collation 仍 `OPEN`（同上 §3A；`P0_2_IDENTITY_IMPLEMENTATION_SCOPE_PROPOSAL.md §4.3b`）。
- 身份唯一键为 `(mpn_norm, brand_norm)`（`DECISION_REGISTER §2.1:52`，@27e62b1）。

### 决策含义
Collation 决定数据库在**比较/唯一约束**时如何对待大小写、重音与等价字符。若选择 case-insensitive/accent-insensitive 排序规则，数据库可能把规范化后本应不同的值视为相等，从而与"归一化在应用层完成、数据库不静默合并"的原则冲突。

### 候选（**预期语义需 MySQL 8.4 实例验证**，不得凭名称定论）
| 候选 | 预期语义（待验证） | 对身份键的风险 |
|---|---|---|
| `utf8mb4_0900_as_cs` | 重音敏感、大小写敏感（Unicode 9.0.0 系） | 与"应用层归一后精确相等"较贴合；需验证尾随空格、Unicode 等价形式行为 |
| `utf8mb4_bin` | 按码点/二进制比较（旧式 binary collation） | 更严格；需验证与 `0900_bin` 的差异及索引行为 |
| `utf8mb4_0900_bin` | 0900 系列 binary | 需验证 8.4 支持与行为 |
| （默认）`utf8mb4_0900_ai_ci` | 重音不敏感、大小写不敏感 | **高风险**：可能把 `abc-1` 与 `ABC-1` 视为相等，与归一化职责冲突 |

### 需在 MySQL 8.4 实例验证的场景（验证任务，不在本轮执行）
1. 版本与默认值：`SELECT @@version, @@collation_server;`、`SHOW COLLATION WHERE Charset='utf8mb4';`
2. 唯一键行为：建临时表 `(mpn_norm, brand_norm)` 复合唯一键，分别以候选 collation 测试：
   - `ABC-1` vs `abc-1`（大小写）；
   - `A-B` vs `A B` vs `AB`（标点/空白，归一前）；
   - `é` vs `e`、NFC vs NFD（重音/Unicode）；
   - 尾随空格 `ABC-1` vs `ABC-1 `；
   记录：唯一约束是否冲突、等值查询是否命中。
3. 索引键长：`VARCHAR(N)` × 2 在 utf8mb4 下的字节长度与 InnoDB 索引上限（8.4 实例确认）。
4. 排序/比较对分页与搜索的影响。

### Owner 决定（已接受，待正式签署）
**首选验证候选 `utf8mb4_0900_as_cs`**（大小写/重音敏感，最贴合"归一化在应用层、数据库精确相等"）。
MySQL 8.4 LTS 实例验证后才能冻结；若验证失败，须提交替代方案及差异分析；**实施 Agent 不得自行更换 Collation**。

### 状态
Owner 候选选择 `OWNER_DECIDED`；技术验证 `NOT_READY`（无 MySQL 8.4 实例验证证据；本轮禁止连接 DB/执行 DDL）；Contract **不**标 `FROZEN`。

---

## D-2 MPN-NORM-v1（规范化规则框架）

### 事实
- `MpnNormalizer` 必须统一、版本化，禁止模块各自清洗（`DECISION_REGISTER §2.1:49-51`，@27e62b1）。
- 唯一键 `(mpn_norm, brand_norm)`（同上 `:52`）；`normalizer_version` 必须保留（同上 `:53`）。
- 具体规则与版本号**不在 IQ-01 裁定内**，属设计待定（同上 `:59`；`IQ01…§9.4:285`）。
- 现有实现 `normalized_mpn = requested_mpn`（`src/icpdf/parser/pipeline.py:155`），并无真正归一。

### 规则框架（每条区分：Owner 业务语义 / 技术验证 / 不可安全自动处理）

| 规则 | Owner 可决定的业务语义 | 需技术验证的实现行为 | 不可安全自动处理的边界 |
|---|---|---|---|
| 前后空白 | 是否 trim、是否折叠内部空白 | Unicode 空白类别（NBSP/全角空格） | 内部空白在型号中是否有意义（如 "AFE 7950" vs "AFE7950"）需业务确认 |
| 大小写 | 统一 upper/lower | Unicode casefold 与 locale 影响 | 某些型号大小写本身有区分语义（少见，需白名单） |
| 连字符/标点 | `-` `–` `_` `.` 是否等价/删除 | 归一映射表 | 删除连字符可能把不同型号合并（不得默认删除） |
| Unicode | NFC/NFD、全角/半角 | 归一化实现库行为 | 全角字母与半角是否等价需业务确认 |
| Brand alias | 别名是否并入同一 brand；别名权威来源 | 别名表版本化 | 冲突别名不得自动择一（→ pending/人工） |
| 空值/缺失/无法识别 | fail-closed：缺 MPN 报错、缺 Brand 不生成键 | 错误类型与消息 | "看似合法但不可识别" 需人工复核，不得猜测 |
| 版本升级/迁移 | 是否重算历史键、是否保留旧键映射 | 跨版本可复算测试 | 冻结后规则变化=不兼容；历史身份迁移需审计 |

### 推荐（供参考，不代裁）
- 采用"应用层归一 + 版本号 + 原始值保留"的最小集合：trim、大小写统一、NFC、有限标点规范；**不删除**连字符/内部空白（除非业务明确同义）。
- Brand alias 仅做显式表映射，冲突 → pending。
- 缺 MPN → fail-closed；缺 Brand → 不生成 pbk、进 `PENDING_BRAND`。
- 规则变更升 `normalizer_version`，历史键保留映射。

### 状态
规则方向 `OWNER_DECIDED`；完整规范 `OPEN`；Contract **不**标 `FROZEN`。

---

## D-3 pbk 编码与测试向量

### 事实
- 候选编码（`12_/API_CONTRACT_CANDIDATE_v1.md §4.3:120-132`，@27e62b1）：
  `canonical = "PBK1\n" + utf8ByteLen(mpn_norm) + ":" + mpn_norm + "\n" + utf8ByteLen(brand_norm) + ":" + brand_norm`
  `key = "pbk1_" + lowercase_hex(sha256(UTF-8(canonical)))`
  完整 SHA-256、不截断、69 字符；`normalizer_version` 不进哈希；缺 Brand 不生成键。
- 状态 `PROPOSED`，未评审冻结（`§11.2:444`；`27_/B5_B8_DEPENDENCY_MATRIX.md:13`）。
- 测试向量表要求存在（`26_/TEST_AND_ACCEPTANCE_CRITERIA.md §B-2`），但**当前无已验证向量**（`26_/FIXTURE_DATA_SPEC.md` F-11 明确）。

### 需 Owner / 技术评审决定
| 项 | 待决内容 |
|---|---|
| 输入字段与顺序 | 仅 `mpn_norm`+`brand_norm`？是否纳入 alias 解析后的 brand？ |
| 无歧义序列化 | 采用候选长度前缀方案，还是其它（JSON canonical / 分隔符转义） |
| 规范化版本关联 | 版本不进哈希（候选），仅并列元数据——是否接受？ |
| 缺失 fail-closed | 缺 MPN 报错、缺 Brand 不生成键——确认 |
| 前缀与版本 | `pbk1_` 保留；未来 `pbk2_` |
| 升级/迁移 | 冻结后变更=不兼容；是否保留旧键映射与双读 |
| 碰撞与审计 | 完整 SHA-256；碰撞分析；变更审计 |

### 测试向量模板（模板，非已验证结果）
| vector_id | mpn_raw | brand_raw | normalizer_version | mpn_norm | brand_norm | canonical_bytes(hex) | expected_pbk | status |
|---|---|---|---|---|---|---|---|---|
| V-001 | ________ | ________ | ________ | ________ | ________ | ________ | ________ | `NOT_READY` |

> 在规范化规则未确认、向量未实测前，**禁止**给出"pbk 规则已冻结"的结论。

### 状态
设计方向 `OWNER_DECIDED`；精确编码规范 `OPEN`；测试向量 `NOT_READY`；Contract **不**标 `FROZEN`。

---

## D-4 Product Catalog 概念模型

### 事实
- 首期租户隔离已决定（`D-C_OWNER_IDENTITY_DECISION.md §3C`）。
- Product Catalog 未作为独立实体定义（`P0_2_OWNER_DECISION_EVIDENCE_PACKET.md §5.2`）。
- 后端设计候选：Product/Brand/Manufacturer 全局；Document/Evidence 带 `owner_tenant_uid`（`BACKEND_DATA_MODEL_AND_MIGRATION_DESIGN.md §4`）；TPA 授权（`OAUTH_TENANT_SITE_TPA_ARCHITECTURE.md §4`）。

### 概念选项（无 DDL）
| 选项 | Tenant ↔ Catalog | Identity ↔ Catalog Product | 说明 |
|---|---|---|---|
| A. 全局身份 + 租户目录成员 | 1 Tenant 1 Catalog（首期） | 全局 Product Identity；Catalog Membership 表 | 身份全局，目录是租户可见集合 |
| B. 租户自有 Catalog Product | 1 Tenant N Catalog | 租户 Catalog Product 引用全局 Identity | 支持租户私有属性/覆盖；复杂度更高 |

### 需说明的关系
- 同一租户内重复 `MPN+Brand`：应复用同一身份记录，不新建重复身份；冲突 → pending。
- `product_uid`：技术主键，仅本地外键引用，不承载业务语义。
- `document_id` / `parse_run_id`：与产品、目录身份独立。
- 身份记录 vs 租户访问边界：身份记录是全局/内部实体，租户访问由 Catalog Membership / TPA 控制，**不得**因同一 `pbk` 自动共享数据。

### 推荐（供参考，不代裁）
首期采用 **A（全局身份 + 租户目录成员）最小模型**：Product Identity（内部）+ Tenant Catalog Membership + 访问边界；租户私有属性延后。理由：与已决定的"首期隔离 + 默认禁止跨租户共享"一致，且不引入租户自有身份复制。

### 状态
最小内部 Catalog 方向 `OWNER_DECIDED`；首期概念模型 `OPEN`；实际建表未授权。

---

## D-5 B8 evidence summary

### 事实
- 首期普通 API 不暴露原始 evidence（`D-C_OWNER_IDENTITY_DECISION.md §3D`）。
- B8 原状态 `OPEN (IQ-08)`（`12_/API_CONTRACT_CANDIDATE_v1.md §11.2:447`，@27e62b1）；口径冲突在 `16_/FREEZE_READINESS_REVIEW.md:208-214`；影响面 `27_/B5_B8_DEPENDENCY_MATRIX.md §5`。

### 三类边界
| 类别 | 定义 | 首期可见性 |
|---|---|---|
| 原始 evidence | 原始 PDF/整页、bbox、raw_text、截图 | **不对外**（租户内部/管理员受控） |
| 受控 summary | 经审核的短定位摘要、页码、字段名、来源类型 | 候选，需 Owner 批准字段与验收 |
| 内部审核数据 | prompt、模型输出、调试、内部路径、堆栈、token | **禁止**对外/对租户 |

### summary 字段候选（**未批准**）
| 字段 | 业务用途 | 来源 | 敏感性 | 风险 | 建议 |
|---|---|---|---|---|---|
| `page_number` | 定位 | 解析结果 | 低 | 低 | 可候选 |
| `field_name` | 参数名 | 参数模型 | 低 | 低 | 可候选 |
| `source_type` | 来源类型（native/ocr/manual） | 候选 | 低 | 低 | 可候选 |
| `locator_summary` | 经审核短摘要 | 人工审核 | 中 | 可能泄露原文 | 需限长+审核 |
| `bbox` | 精确坐标 | 证据 | 中 | 可反推版面 | Phase 2 |
| `raw_text` | 原文片段 | 证据 | 高 | 版权/泄密 | **排除**（或极短脱敏，需法务） |
| `screenshot_reference` | 截图通道 | 渲染 | 高 | 泄密 | **排除**（Phase 2） |

### 必须排除
原始 PDF/整页、未审核长文本、内部 prompt/模型输出/调试、内部文件路径、堆栈、token、其他租户证据。

### 权限
- 外部 API：需认证 + 租户 scope；仅 summary 白名单；
- 租户内部：按 TPA + 可见性；仍受字段白名单；
- 管理员：可看原始 evidence，但 token/secret 永不记录。

### 首期与 Phase 2
- 首期**不包含** B8 summary API、原始 evidence API、`/evidence` 访问能力（`OWNER_DECIDED`）。
- Phase 2：完整 evidence 暴露、截图通道、长文本、bbox 精确值——需单独契约与验收。

### 状态
首期 no-summary / no-raw / no-`/evidence` `OWNER_DECIDED`；summary 白名单 `OPEN`；Phase 2 summary `NOT_FROZEN`；B8 `NOT_READY`。

---

## D-6 Tenant 与跨租户模型

### 事实
- 首期租户隔离、默认禁止跨租户读取/搜索/关联/共享（`D-C_OWNER_IDENTITY_DECISION.md §3C`）。
- Tenant/Site/TPA 为设计候选、未实现（`OAUTH_TENANT_SITE_TPA_ARCHITECTURE.md:4-8`）。
- 跨租户共享首期禁止、待 Owner（同上 `:61`）。

### 决策含义与规则
- 每个请求的 tenant scope 只从 Token 派生，不采信请求体（`OAUTH…:50-52`）。
- 同一 `pbk` 在不同租户：各自独立数据集，**不构成共享授权**。
- 跨租户读取/搜索/关联/共享：默认拒绝；需测试覆盖（T-OA-08 等设计用例）。
- 未来显式共享：**不在首期**，需另行 Owner 决策 + 授权模型（TPA 扩展/共享目录）。

### 状态
首期隔离原则 `OWNER_DECIDED`；精确数据模型与隔离测试 `OPEN`；未来共享 `OPEN`（另行决策）。

---

## D-7 CRLF 与未来 LF 快照

### 事实
- 历史快照保持原样、不重写、不改哈希（`D-C_OWNER_IDENTITY_DECISION.md §3E`）。
- CRLF 失败根因已确认为换行符（`P0_2_OWNER_DECISION_EVIDENCE_PACKET.md §7`）：工作区 198 CRLF→`86c005…`，LF 归一→`3394bb…`=HEAD blob=期望。
- 测试：`tests/unit/test_assembly.py:579-595`；期望常量 `:72-74`。

### 新快照方案（独立，不在本轮执行）
| 项 | 要求 |
|---|---|
| 是否另批 | 是，独立批次 |
| 版本号 | 独立（如 `A3-W2-LF`） |
| 生成时间 | UTC ISO-8601 |
| 来源 commit | 授权实现后的 commit SHA |
| 文件清单 | `MANIFEST` + 每文件 SHA-256（LF 规范化） |
| 与历史关系 | 并存，不替换；旧快照与旧哈希保留 |
| pipeline.py | 变更后**单独重授权**新快照；不与身份/DB/API 混在同一变更 |

### 状态
历史保持原样 `OWNER_DECIDED`；新 LF 快照批次 `OPEN / PENDING_SEPARATE_BATCH`；本轮**不生成或改写**历史快照。

---

## 实施授权前置（摘要，详见 CHECKLIST）

| 项 | 分类 |
|---|---|
| MySQL 8.4 Collation + 唯一键验证 | `MUST_CLOSE_BEFORE_IMPLEMENTATION` |
| MPN-NORM-v1 | `MUST_CLOSE_BEFORE_IMPLEMENTATION` |
| pbk 编码 + 测试向量 | `MUST_CLOSE_BEFORE_IMPLEMENTATION` |
| Product Catalog 首期模型 | `MUST_CLOSE_BEFORE_IMPLEMENTATION` |
| Tenant 隔离边界 + 测试条件 | `MUST_CLOSE_BEFORE_IMPLEMENTATION` |
| B8 summary 暴露范围 | `CAN_DEFER_WITH_OWNER_ACCEPTANCE`（若首期不含 `/evidence` API） |
| API 级错误语义/证据关联 | `CAN_DEFER_WITH_OWNER_ACCEPTANCE`（若首期不含 API）；解析链错误语义为 MUST_CLOSE |
| CRLF 新快照（未来） | `CAN_DEFER_WITH_OWNER_ACCEPTANCE` |

---

## 边界声明

- 本文件为决策准备，**未**修改代码/DDL/API/测试/证据；**未**把任何 `OPEN`/`PROPOSED` 升级为 `OWNER_DECIDED`/`FROZEN`。
- 所有技术验证均为**计划**，非已验证结果；未连接数据库、未执行 DDL。
- Owner 决策栏与签署栏留空，未代签。
