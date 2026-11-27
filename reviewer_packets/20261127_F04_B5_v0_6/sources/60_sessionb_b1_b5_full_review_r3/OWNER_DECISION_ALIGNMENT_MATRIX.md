# Owner 决定对齐矩阵（R3 独立核验）

| 项 | 值 |
|---|---|
| 核验对象 | 59_ `SPECIFICATION_PRECEDENCE_AND_LEGACY_BOUNDARY_v0_2_DRAFT.md` §2/§5/§6、`OWNER_DECISION_ALIGNMENT_MATRIX.md` §2/§3/§5 |
| 原文基准 | 41_、44_、45_、46_、48_ 全文；OD-49 仅以引用形式存在 |
| 方法 | 逐条把 59_ 对 Owner 记录的范围描述与原文状态行/条款比对；判定「一致 / 不一致 / 不可验证」 |
| 结论 | **45_/46_/48_/41_/44_ 对齐一致、未被宣告失效（PASS）；OD-49 记录缺口客观存在（NOT_VERIFIABLE），并由此产生阻断 BLK-D** |

---

## 1. 逐记录对齐

| 记录 | 原文（状态行 / 关键条款） | 59_ 的表述 | 独立核验 | 判定 |
|---|---|---|---|---|
| **41_** P-02/P-15 关闭 | 41_:7 `RECORDED — P-02 / P-15 CLOSED BY OWNER — OTHER ITEMS UNCHANGED` | 矩阵:23「P-02/P-15 关闭事实 — **ACTIVE** — 不改变」；legacy:24 同 | 文件存在、文件名与 59_ 引用一致（`41_/OWNER_DECISION_P02_P15_CLOSURE.md`）、状态行相符 | **一致** |
| **44_** P-11 准备窗口 | 44_:7 `RECORDED — PREPARATION SCOPE/WINDOW DEFINED — P-11 SCOPE-LIMITED`；窗口由 45_:10 记为 2026-11-26 至 2026-12-03 23:59 Asia/Taipei | 矩阵:24「2026-11-26—2026-12-03；仅准备 — ACTIVE — 不改变；59_ 在窗口内」；legacy:25 | 文件名 `44_/OWNER_DECISION_OD-B1-P11-PREPARATION-01.md` 正确；窗口端点与 45_:10 一致；59_ 日期 2026-11-26 落在窗口内 | **一致** |
| **45_** P-05 路径 / P-06 评审授权 | 45_:8 `RECORDED — P-05 PATH ACCEPTED IN PRINCIPLE — P-06 REVIEW AUTHORIZED — BOTH REMAIN OPEN`；45_:18「路径接受仅此而已，不授权创建或检出 worktree」；45_:59-60 P-05/P-06 `OPEN`；45_:64 B-1 `NOT_READY / NOT_GRANTED / NOT_EXECUTED` | 矩阵:25「路径原则接受；P-06 技术评审；不创建 worktree — ACTIVE — 不改变；P-05/P-06 仍 OPEN」；legacy:26、:61 | 三处要点（路径原则、评审授权、不创建 worktree）与原文一一对应；未把 P-05/P-06 表述为关闭 | **一致（未越权）** |
| **46_** 五项技术方向 | 46_:8 `RECORDED — TECHNICAL DIRECTION ACCEPTED — P-06 REMAINS OPEN`；46_:16-20 五项（Brand 显式输入 / `pipeline.py` 快照暂不授权 / Global ID 确定性映射 / B5 最小规则先行 / 模块命名方向）；46_:24-32 九项边界（缺失不静默合并、快照不得改写、不声称跨进程持久唯一、CAND-03 待 B5 冻结） | 矩阵:26「Brand 显式、pipeline 快照、确定性 ID、B5 最小规则、模块命名 — ACTIVE — 在其内细化」；legacy:27、:62 | 五项描述与 46_:14-20 对应；59_ 的「不修改 `pipeline.py`、快照不变」（Product:107）与 46_:17 一致；59_ 未声称 CAND-03 批准 | **一致（未越权）** |
| **48_** OD-47-01…10 | 48_:8 `RECORDED — OWNER DIRECTION — B5 NOT FROZEN — P-06 OPEN`；48_:15-24 T8 六条（01/02/03/03a/04/05）；48_:30-53 字段契约（06/07）；48_:57-78 Key 公式（08）；48_:84-85 CAND-04 移除 / CAND-08 更名（09/10） | 矩阵:27「T8、ProductIdentity、Business Key、CAND-04/08 — ACTIVE — 在其内细化；P2 为新增 PROPOSED，需 Owner 批准」；legacy:28、:63 | 十项编号与范围相符；`product_business_key` 仅 TRUSTED 生成（48_:50）、`rule_version` 入哈希（48_:59-68）在 59_ 中被保留（B5:95-111）；48_ 未提及 `BRAND_TRUST_INVALID`，故 59_ 标「P2 为新增 PROPOSED」属实 | **一致**（但见 §2 歧义） |
| **OD-49** OD-49-01…08 | 无独立记录文件；仅以引用形式出现于 50_（B5 §1:22-29、P06 v1.4:9/16-20）、51_（CAND09:9）、54_（:101-102）、58_（:234） | 矩阵:33「仅以引用形式出现在 `50_`、`51_`、`54_`；未找到独立 Owner Decision 记录」；矩阵:34 `TRACEABILITY_GAP — OWNER_DECISION_REQUIRED`；矩阵:35「不声称 OD-49 已签署/已冻结」；legacy:29 | 缺口客观存在（本轮全仓检索确认无 OD-49 独立文件）；但**引用来源枚举漏 58_**（N-4） | **NOT_VERIFIABLE（缺口如实披露）** |

---

## 2. 效力处理的三个关键判定

### 2.1 是否错误宣告既有 Owner 记录失效 — **否（已修复）**

- 57_ legacy:32 曾把 `42_/45_–49_` 统一标为「历史准备/裁定材料 — 无当前规范效力」，同格又写「以 48_ 为准」，自相矛盾（58_ BLK-3）。
- 59_ legacy §3 的「技术草案效力表」（legacy:35-44）**只列技术文档**（59_ 三份、57_ 三份、55_ 三份、50_、51_、52_、53_、54_/56_/58_），**不再包含任何 Owner 记录**；Owner 记录改由 §2（legacy:22-29）与 §5（legacy:59-66）单独处理。
- legacy:73 反向明令：「`45_/46_/48_` 不得被 59_ 宣告为『无当前规范效力』」。矩阵:1（原则）与矩阵:48-49（冲突处理）同向。
- **判定：58_ BLK-3 已闭合。**

### 2.2 是否暗中撤销/修改/扩大 Owner 决定 — **未发现撤销或扩大**

| 检查角度 | 结果 |
|---|---|
| 是否声明 B5 已冻结 / P-06 已批准 | 否。59_ 五份非声明段（B5:129、Product:129、Brand:107、legacy:85、矩阵:56、T8:57）一致；全文 `已冻结`/`已批准` 检索仅命中「不得声称…」类禁止句 |
| 是否改写 45_ 的 P-05/P-06 状态 | 否。矩阵:25 与 legacy:26 均保留 `OPEN` |
| 是否放宽 46_ 的 `pipeline.py` 快照锁定 | 否。Product:107「不修改；快照不变」、Brand:81「不授权；快照不变」 |
| 是否把 48_ 的 CAND-04 移除改回 | 否。59_ 层面未提 CAND-04 恢复；未创建 registry |
| 是否对 48_ 施加更严格约束（属细化而非扩大） | 是——新增实体 ID、授权名单、证据字段、禁止调用方提供 norm。方向为收紧，且与 46_/48_ 的「显式可信输入」一致 |
| 是否扩大范围到 pipeline/CLI/DB/API/生产 | 否。Product:106-109、Brand:77-82、Brand:12 均明示不授权 |

### 2.3 未消解的歧义（阻断 BLK-D 的来源）

- 48_:51 原文：「Brand 缺失/**不可信** → `PENDING_BRAND`；Unicode 风险/冲突 → `NEEDS_REVIEW`；输入不合法 → `INVALID_INPUT`」。
- 59_ P1（B5:31、Product:49、Brand:61）把 `REJECTED` 映射为 `INVALID_INPUT / BRAND_REJECTED`。`REJECTED` 既可读作「不可信」（→ `PENDING_BRAND`），也可读作「被拒绝/输入不合法」（→ `INVALID_INPUT`）；48_ 未点名 `REJECTED`。
- 该映射的实际来源是 OD-49，而 OD-49 无独立记录 → 依据不可验证。
- 59_ 只把 P2 标为 `PROPOSED — OWNER_APPROVAL_REQUIRED`（B5:32、Product:50、Brand:69、矩阵:52），**未把 P1 列入待决**（矩阵 §5:46-53 无对应行）。
- **判定：`NOT_VERIFIABLE`（P1 的 Owner 依据）＋需要 Owner 明示（REJECTED 是否属 48_ §2 的「不可信」）。** 在 Owner 明示前，59_ 不应以既定规则形态保留 P1。

---

## 3. 59_ 是否在其他位置宣称已获批 / 已冻结

| 检索项 | 命中 | 性质 |
|---|---|---|
| `B5 已冻结` | 0（仅 legacy:70「不得声称」、T8:47「不得据此声称」） | 无越权 |
| `P-06 已批准` | 0（同上） | 无越权 |
| `FROZEN` / `APPROVED`（排除 `NOT_FROZEN`/`NOT_APPROVED`） | 0（59_ 状态行均为 `DRAFT — NOT_FROZEN`/`NOT_APPROVED`） | 无越权 |
| `REVIEW_PASS` / `SIGNED` | 0 | 无越权 |
| `PROPOSED` | 全文大写，位置：B5:32/39/84、Product:50/61、Brand:54/62/69、矩阵:52、legacy（「保留 PROPOSED 项」矩阵:27） | 一致 |

---

## 4. 需要 Owner 在冻结前明示的事项（本复核汇总）

1. `REJECTED` 是否属 48_:51「不可信」；P1（`REJECTED → INVALID_INPUT`）是否获得 Owner 追认（否则须标 `OWNER_DECISION_REQUIRED`）。
2. OD-49-01…08 是否需要独立记录文件（当前仅引用形式，构成追溯缺口）。
3. P2（`BRAND_TRUST_INVALID → PENDING_BRAND`）批准（59_ 已正确保持 PROPOSED）。
4. Brand B2 的正确结果（`BRAND_TRUST_INVALID` 还是降级 `UNVERIFIED`）。
5. T8-06/09/15 的归类裁定；T8-11 的向量期望是否按 48_/50_ 修订；T8 是否需独立签字件。
6. 51_ 空白允许集并入 59_ 后的规范载体（59_ B5 文本是否需内嵌码点表）。
7. 授权名单载体/版本/维护方/批准记录/实体 ID 来源/同一控制主体判定方法。
8. `product_uid` 未来来源；CONFIG/MANUAL 解禁条件；算法版本冻结值。

**说明**：以上均为「待 Owner 决定」，本复核不作任何批准或冻结暗示；59_ 六份文件亦未作此暗示。