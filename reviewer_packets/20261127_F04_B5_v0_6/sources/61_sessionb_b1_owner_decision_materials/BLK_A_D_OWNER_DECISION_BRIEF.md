# BLK-A…BLK-D Owner Decision 材料

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-OD61-BRIEF-001 |
| 版本 | v0.1-DRAFT |
| 日期 | 2026-11-26 |
| 状态 | **DRAFT — DECISION_MATERIALS_ONLY — NO RULE APPROVED** |
| 依据 | 60_ 独立复核 BLK-A…BLK-D；`OWNER_DECISION_60_REVIEW_ACCEPTANCE.md` |
| 性质 | 供 Owner 逐项裁定的材料；不预设结论、不代签、不修改 50_–60_ |

## BLK-A — Brand B2 与状态机冲突

**证据**

- `59_/BRAND_INPUT_INTERFACE_CONTRACT_v0_4_DRAFT.md:89`（B2）：“仅 TRUSTED、缺 authority/evidence → `UNVERIFIED/PENDING_BRAND`”，**无原因码**；
- 同文件 §4:62：`TRUSTED` 但背书/授权/实体分离无效 → `BRAND_TRUST_INVALID` → `PENDING_BRAND`；
- `59_/B5_MINIMAL_NORMALIZATION_RULES_v0_5_DRAFT.md:32`（P2）与 `59_/PRODUCT_IDENTITY_FIELD_CONTRACT_v0_5_DRAFT.md:119`（C5）同 §4；
- 60_ §6 BLK-A。

**待选方案**

| 选项 | 内容 | 后果 |
|---|---|---|
| A1 | B2 改为 `PENDING_BRAND / BRAND_TRUST_INVALID`，补原因码；与 §4/B5/Product 一致 | 需承认 P2 仍为 PROPOSED；测试 B2/C5 同步 |
| A2 | B2 改为 `PENDING_BRAND / BRAND_UNVERIFIED`，删除 P2 区分 | 与 B5 P2/Product C5 冲突；需改多处；P2 不再使用 |
| A3 | 拆分“缺 authority/evidence”与“authority/实体无效”为两个条件，分别映射 | 状态机更细，但增加原因码/测试；需定义优先级 |

**Owner 决定**：`OWNER_DECISION_REQUIRED`（选择 A1/A2/A3 或其他）。
**建议措辞（未批准）**：“BLK-A 采用 A1：`TRUSTED` 但缺/无效 authority、evidence 或实体分离 → `BRAND_TRUST_INVALID → PENDING_BRAND`；P2 维持 PROPOSED，待另行批准。”

## BLK-B — T8 向量承接冲突

**证据**

| 向量 | 47_ | 48_ | 59_/50_ | 冲突 |
|---|---|---|---|---|
| T8-11 ZWSP | `47_:39` 期望保留 `a\u200bb` | OD-47-04：拒绝或 NEEDS_REVIEW | 59_ B5:47 硬禁止 `INPUT_INVALID` | 保留 vs 拒绝 |
| T8-12 软连字符 | `47_:40` 期望保留 | OD-47-04 | 59_/50_ `NEEDS_REVIEW` | 保留 vs 复核 |
| T8-06 K | 47_/50_ `ACCEPT` | **无 48_ 裁定** | 59_ 沿用 ACCEPT | 无 Owner 依据 |
| T8-09 希腊 sigma | 47_/50_ `ACCEPT` | **无 48_ 裁定** | 59_ 沿用 ACCEPT | 无 Owner 依据 |
| T8-15 组合重音 | 47_/50_ `ACCEPT` | **无 48_ 裁定** | 59_ 沿用 ACCEPT | 无 Owner 依据 |
| T8-07 İ | `47_:35` `FLAG` | OD-47-03a `ACCEPT WITH FLAG` | 59_ 按 48_ | 标签不一致 |

**待选方案**

| 选项 | 内容 | 后果 |
|---|---|---|
| B1 | 下一版修订 T8 表：T8-11→`INVALID_INPUT`、T8-12→`NEEDS_REVIEW`、T8-07→`ACCEPT_WITH_FLAG`；T8-06/09/15 补 Owner 裁定或标 `NO_OWNER_DIRECTION` | 需 Owner 对 3 项补充裁定 |
| B2 | 47_ 整体列为历史，另建新 T8 表；旧行标 `SUPERSEDED` | 需明确新表 Owner 来源 |
| B3 | 算法仅采用 48_ 已裁定项，其余延后 | 可能缩小 T8 覆盖 |

**Owner 决定**：`OWNER_DECISION_REQUIRED`（选择方案；逐项 T8-06/09/15/11/12）。
**约束**：不得自动把 47_ 的 ACCEPT 当作 Owner 批准。

## BLK-C — 规范算法本体缺失与空白集冲突

**证据**

- 59_ B5 仅含状态/Key，不含 NFKC、原始扫描、空白折叠、casefold、标点保留、幂等；
- 算法机制只在 50_（历史）、51_/52_（补充）；
- 59_ legacy:41 称 51_ “并入”但 59_ B5 无空白规则，且“59_ 优先”使 B5:47 “C0/C1 等”压过 51_ 允许的 TAB/LF/CR/SPACE 等；
- 60_ §6 BLK-C。

**待选方案**

| 选项 | 内容 | 后果 |
|---|---|---|
| C1 | 在下一版 B5 内联完整算法本体（NFKC/扫描/空白/casefold/标点/幂等） | 自包含；文档较长；需 Owner 冻结 |
| C2 | 明确 51_/52_ 为算法机制规范，59_ 为状态/Key 规范；逐条解决 C0/C1 与 TAB/LF/CR | 需明确规范优先级；仍可能分裂 |
| C3 | 新建独立算法规范文档；B5 引用 | 需新文档/复核；不属本轮 |

**Owner 决定**：`OWNER_DECISION_REQUIRED`（选择 C1/C2/C3；确认 U+0009/U+000A/U+000D 允许）。
**建议措辞（未批准）**：“采用 C1：下一版 B5 内联完整算法；51_/52_ 转历史；明确 TAB/LF/CR 为允许空白。”

## BLK-D — P1 `REJECTED → INVALID_INPUT` 依据

**证据**

- 59_ B5:19/Product:49/Brand:55 将 `REJECTED → INVALID_INPUT`；
- 50_ B5:36（历史）将 `REJECTED` 归入 `PENDING_BRAND`；
- 48_:51 “Brand 缺失/不可信 → PENDING_BRAND”；`REJECTED` 是否属“不可信”未界定；
- OD-49 无独立 Owner 记录（59_ 矩阵:33、60_ 6b）；
- 59_ 仅 P2 标 `PROPOSED`，P1 未标 `OWNER_DECISION_REQUIRED`。

**待选方案**

| 选项 | 内容 | 后果 |
|---|---|---|
| D1 | 出具独立 OD-49 Owner 记录，明确 P1 与 P2 | 可保留 P1；需正式记录 |
| D2 | P1 标 `OWNER_DECISION_REQUIRED`，在决定前不冻结 | 不改变现状；B5 无法冻结 |
| D3 | P1 回到 48_/50_ 的 `REJECTED → PENDING_BRAND` | 与 59_ 现状冲突；需改状态机 |

**Owner 决定**：`OWNER_DECISION_REQUIRED`（D1/D2/D3）。
**约束**：不得在无 Owner 记录的情况下把 P1 冻结。

## 共同保全要求

- 50_–60_ 不修改；既有 manifest 不修改；
- 45_/46_/48_ 继续有效；OD-47/OD-49 在已批准范围内有效；
- 本材料不构成规则批准、B5 冻结、P-06 批准或 B-1 授权；
- 未修改代码/测试；未运行测试；未 commit/push。