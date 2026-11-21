# FIXTURE DATA SPEC · DEMO_FIXTURE 数据规范（隔离实现唯一数据源）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-PHASE2-FIX-001 |
| 版本 | v0.1-draft（规范；数据本体在获批实施时生成并随实现提交） |
| 纪律来源 | IQ-02 裁定（R-DIC-03 CONFIRMED）：全部开发数据显式标 `DEMO_FIXTURE`；不得混入正式数据；Fixture 测试 ≠ 真实数据验证 |
| ID 纪律 | 合法 ULID 格式（Crockford Base32，26 字符），满足契约模式 `tax_/cat_/edg_/par_/ev_/doc_/rel_/chg_ + ULID26`、`pbk1_ + 64hex`、`req_ + ULID26` |

---

## 1. 生成规则

1. **确定性 ULID**：以固定 seed 的确定性生成器产出 26 字符 ULID（可复算、可校验），首个字符段刻意避开真实语义；每条记录额外携带 `"fixture":"DEMO_FIXTURE"` 标记与 `fixture_registry`（ULID ↔ 演示语义对照表）。
2. **产品业务键**：由注入的 `MpnNormalizer`（MPN-NORM-v1 PROPOSED）对虚拟 mpn/brand 现算，不用硬编码 pbk——防止 B5 规则变化后 fixture 失效；同组 fixture 内保持 `MPN+Brand → 唯一 pbk` 不变式。
3. **虚拟内容**：MPN 形如 `DEMO-358R`、品牌形如 `Example Semiconductor`；定义/单位全部为"演示用"文案；**零真实供应商/客户信息、零生产记录复制**。

## 2. 商品覆盖矩阵（状态 × 用途）

| fixture 产品 | identity_state | gates（p/c/r） | visible_state 派生 | 用途（对应矩阵） |
|---|---|---|---|---|
| F-01 `DEMO-358R` / Example Semiconductor | CONFIRMED | PASS/APPROVED/APPROVED | RELEASED | OP-02/03/05/06/07/08..16 正常路径主对象 |
| F-02 `DEMO-555P` / Example Semiconductor | CONFIRMED | PASS/APPROVED/PENDING | IN_REVIEW | SEC-09（40302 未发布）；OP-04 派生 |
| F-03 `DEMO-999X` / Example Semiconductor | CONFIRMED | PASS/APPROVED/**REVOKED** | WITHDRAWN | OP-03 41001 终态；REVOKED 增量流 |
| F-04 `DEMO-111A` / Example Semiconductor | CONFIRMED | PASS/PENDING/PENDING | DRAFT | OP-04 DRAFT 派生；SEC-09 |
| F-05 `DEMO-222B` / Example Semiconductor | CONFIRMED | FAILED/—/— | DRAFT | OP-04 闸门顺序断言（上游失败） |
| F-06 `DEMO-333C` / *（无品牌）* | PENDING_BRAND | — | —（无 release） | OP-02 42201；OP-04 |
| F-07 `DEMO-358R` / `Other Vendor` | **CONFIRMED**（第二合法身份） | PASS/APPROVED/APPROVED | RELEASED | 与 F-01 同 MPN、不同 Brand = **两个不同业务身份**（R-ID-01 CONFIRMED）：断言两者各自独立 `pbk1_`（不同哈希）、精确查找各自命中、互不合并、互不视为冲突（修正 R4：不得仅因 MPN 相同标记冲突） |
| F-08 `DEMO-444D` / Example Semiconductor | INVALID（含控制字符 mpn_raw） | — | — | 归一非法输入 |
| F-09 `DEMO-BOARD-1` / Example Semiconductor | CONFIRMED | PASS/APPROVED/APPROVED | RELEASED | identity_scope=BOARD / product_type=BOARD 边界 |
| F-10 归一化冲突向量（**同源文档**双互斥候选：`DEMO-777` 与 `DEMO-777X`，同品牌 `Example Semiconductor`） | **PENDING_CONFLICT**（聚合结果） | — | —（不签发 pbk） | **冲突机制** = 同一来源文档给出互斥 MPN 候选（候选 §4.1 机制，非"同 MPN 异 Brand"）；**预期结果** = 聚合态 `PENDING_CONFLICT / CONFLICTING_IDENTITY`、不自动合并、不生成业务键；**冲突判定的具体规则未冻结**（R-ID-04 PROPOSED，受 B5）→ `BLOCKED_BY_DECISION(B5)`，裁定前不得作为已定行为验收 |

> `visible_state` 列为候选 §9.2 派生**方向**；枚举命名统一挂 B6（`BLOCKED_BY_DECISION`），fixture 同时保存 gates 原始态供裁定后重算。

## 3. 分类 / 字典 / 证据 fixture

| 组 | 内容 | 状态标记 |
|---|---|---|
| 分类树 T-FIX | 一个技术 taxonomy（PUBLISHED）+ 3 层树（根/中/叶，深度恰 4 边界外再备 1 个第 5 层节点用于 413 触发）；另一 DRAFT taxonomy（不可见断言）；一个 DEPRECATED 分类（保留期内，merged_into 指向叶）；一个 RETIRED 分类（410，窗口挂 IQ-05） | 全部 `DEMO_FIXTURE`；413 用缩比注入（5000 上限以参数化阈值触发，不生成 5000 实体——阈值注入法在实现期声明） |
| 字典 D-FIX | 3 个参数（Package/Voltage/Operating_Temperature 结构示例），`dictionary_version:0`、`status:DRAFT`、`formal:false`；**内容**空位待 PM 种子（B7） | `DEMO_FIXTURE`；不得冒充种子 |
| 证据 E-FIX | F-01 附 4 条 EvidenceItem：合法 bbox×4、page_number、raw_text≤500、`screenshot_reference` 相对路径；另含 1 条标记 `pending_disclosure` 的证据（B8 待决暴露测试） | DIFF-MOCK-11 修正能力：页码/bbox/原文**实际承载**（暴露范围仍 BLOCKED） |
| 文档 DOC-FIX | 每产品 1–2 份虚拟文档（sha256 为演示值）；`prod-{document_id}` 仅出现在文档处理流字段，不进任何身份字段 | R-ID-02 |
| 变更流 CHG-FIX | 6 条 ChangeRecord 覆盖 9 事件枚举中的 6 种（可选端点） | R-TAX-08 |
| 令牌 TOKEN-FIX | 本地 AS 桩的演示 client（`demo-client`）+ 预置 token 表（含过期/错aud/窄scope 变体）——**均为本地桩值，非真实凭证** | IQ-21 裁定前不签发"可用"凭证形态（OAUTH2 计划 §5） |

## 4. 待决测试保留（不得视为已定行为）

1. **默认过滤双向量**（DIFF-MOCK-05，**OPEN**，不得写成已确定默认行为）：
   - **候选 A**：不带 `release_state` 时仅返回 RELEASED（MD §6.4 / 候选 OpenAPI 默认声明方向）；
   - **候选 B**：不自动过滤，结果完全由显式查询参数控制（无参数即不过滤）；
   - 两个向量均 `BLOCKED_BY_DECISION(DIFF-MOCK-05)`；维护人正式裁定前，**均不计入行为验收 PASS**，且 W-1 Runtime / W-2 Repository **不得预置任一向量为确定默认值**。
2. **搜索条目形态**（DIFF-CONTRACT-01）：fixture 同时可渲染扁平行与完整 DTO 两形态；断言挂起。
3. **缺 brand 双候选向量**（DIFF-CONTRACT-03，**PENDING**，不得写成已确定行为预期）：
   - **候选-422**：422 / 42201 `PRODUCT_IDENTITY_INCOMPLETE`（meta.missing=["brand"]，degraded_allowed=true；MD §6.4 + 候选 §4.5 方向）；
   - **候选-400**：400 / 40001 `INVALID_ARGUMENT`（meta.field="brand"；EX-17 说明文字方向）；
   - 两个向量**分别构造、分别断言，不得合并为单一响应**；均 `BLOCKED_BY_DECISION(DIFF-CONTRACT-03)`；解除阻断 = 设计维护人修正示例文档并完成一致性复验。
4. **41002 窗口 / 42901 配额 / 40102 TTL**：fixture 触发路径存在，数值注入，不实现真实数值。

## 5. 禁止清单

- 禁止复制生产数据库记录、真实 MPN/厂商组合、真实文档 sha256；
- 禁止真实供应商凭证、真实用户账号、真实平台 token；
- 禁止把 fixture 结果表述为真实数据验证；
- 禁止 fixture ID 进入任何正式字典/业务数据。
