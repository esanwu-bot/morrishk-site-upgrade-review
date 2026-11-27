# 58_ 发现 × 59_ 处理 对照矩阵（R3 独立判定）

| 项 | 值 |
|---|---|
| 判定来源 | 复核者直读 58_ `B5_FULL_REVIEW_R2.md`（284 行）全文 + 59_ 六份全文 + 50_–57_ 原文 |
| 判定口径 | `RESOLVED` / `PARTIAL` / `UNRESOLVED` / `NOT_VERIFIABLE`（另以 PASS/FAIL/NOT_VERIFIABLE 标注对 12 项检查的归属） |
| 说明 | 本矩阵不采信 58_ 的自述结论，逐条回到 59_ 与源文件原文核对 |

---

## Part A — 58_ 四项阻断（58_ §8 BLK-1…BLK-4）

| ID | 58_ 发现（原文要点 + 位置） | 59_ 处理 | 判定 | 依据位置 |
|---|---|---|---|---|
| BLK-1 | 57_ B5 §1 P0 与 P6 对「空」双重覆盖：57_ B5:17（P0「非字符串、空、硬禁止码点」）vs :23（P6「MPN 非法/空」）；交叉不一致 57_ Product:47 vs :53 | 改为**分阶段**：Stage A 仅结构且**显式排除** `mpn_raw=""`（「不在此阶段判定；留待 Stage D」）；Stage D 独占空/仅空白/归一化后为空 → `MPN_INVALID`；§2 示例表与 Product §3 逐行镜像 | **RESOLVED**（检查 1 PASS） | 59_ B5:15-25、:52-56、:68、:74、:77；59_ Product:48、:55、:58、:121 |
| BLK-2 | P2 与 P4 条件重叠（「UNVERIFIED 本身就缺背书」），使 `BRAND_UNVERIFIED` 不可达，与 57_ Product:104 / 57_ Brand:58 冲突 | B5 限定 **P2 仅 `TRUSTED` 但校验失败**、**P4 仅显式 `UNVERIFIED`**，并在 §2 追加两条「不存在 P0∩P6」「不存在 P2∩P4」声明；示例表给出 UNVERIFIED+FLAG → P4 | **PARTIAL**：B5/Product 层已闭合；但 Brand §7 B2（Brand:89）把「仅 TRUSTED、缺 authority/evidence」判为 `UNVERIFIED/PENDING_BRAND`，与 Brand §4:62 及 P2 冲突 → 复发（BLK-A） | 59_ B5:32-39、:72、:78；59_ Product:50-52、:59、:117-119；59_ Brand:62、:89 |
| BLK-3 | 57_ legacy:32 越权宣告 `45_/46_/48_`「无当前规范效力」，且同格「以 48_ 为准」自相矛盾 | 重写为「技术草案效力表」与「Owner 决定对齐表」两表分离；§1 确立「Owner 决定不被后续草案自动取代」「冲突时 Owner 决定优先」；§5 逐条重申 45_/46_/48_/41_/44_ 有效；§6.4 明令**不得**宣告 45_/46_/48_ 无效力 | **RESOLVED**（检查 6a PASS、检查 10 PASS） | 59_ legacy:14-18、:22-29、:35-44、:59-66、:73；59_ 矩阵:21-27 |
| BLK-4 | T8 处置悬空：57_ B5:84 指向 51_/52_，但二者无 T8 内容；50_ 被定为历史；55_ 的 T8 摘要未继承 | 改为指向 `47_` 向量 + `48_` §1 裁定，并正确声明「51_/52_ 不包含 T8 向量」「57_ B5:84 引用已废弃」，另立 `T8_EVIDENCE_AND_DECISION_TRACEABILITY.md` 记录证据链与 SHA | **PARTIAL**：引用重定向正确（实测 51_/52_ `T8` 命中 0），但 47_ 整表被承接而未处理 T8-11/T8-12 与 48_/50_ 的冲突，T8-06/09/15 无 48_ 裁定 → 新阻断 BLK-B | 59_ B5:113-119；T8 追溯:14-30、:34-41；47_:39-40；48_:21；50_:129-130 |

---

## Part B — 58_ 非阻断发现（58_ §8 末段 5 条）

| ID | 58_ 发现 | 59_ 处理 | 判定 | 依据位置 |
|---|---|---|---|---|
| N-a | 52_:40/:44 与 53_ Product:63 缺源文件内历史标注；57_ legacy:39 **漏列 52_:44** | legacy §4 现列 4 行覆盖 `52_:40`、`52_:44`、`53_ Product:63`、`53_ Brand`；B5 §4 逐条点名三处「不得作为现行 Business Key 输入」 | **RESOLVED**（枚举完整）；源文件内标注受「不得修改 50_–58_」约束 → 残余风险降为 N-3 | 59_ legacy:48-53；59_ B5:91 |
| N-b | 57_ Brand:85（B2）原因码未定；57_ Brand:61 使用小写 `proposed` | casing：59_ 全文 `PROPOSED` 大写（B5:32/39、Product:50/61、Brand:54/62/69、矩阵:52），B5:84 另立「`PROPOSED` 一律大写」；**B2 原样保留** | casing **RESOLVED**；B2 **UNRESOLVED** 且升级为冲突（→ FAIL，见 Part A BLK-2） | 59_ Brand:89 与 57_ Brand:85 文字相同 |
| N-c | 字段命名不一致：`brand_provided_by_entity_id`/`brand_trust_authority_entity_id`（57_ Product:28-29）vs `provided_by_entity_id`/`trust_authority_entity_id`（57_ Brand:30/32、57_ B5:61） | Product §4 新增 5 行一一映射表并声明「命名可不同，但必须是同一值；禁止用显示名替代实体 ID」；Brand:38 反向映射；B5 §5 不再使用具体字段名（改为「实体 ID」） | **RESOLVED**（检查 9a PASS） | 59_ Product:63-73；59_ Brand:38；59_ B5:99 |
| N-d | 57_ Product:83 非声明漏「并发」；57_ Brand 头部缺「效力」行 | Product:93 已含「不声称持久/**并发**/跨进程唯一」；Brand:9 已补「效力」行 | **RESOLVED**（检查 8、9a） | 59_ Product:93；59_ Brand:9 |
| N-e | N-05-1：57_ 删去「而不验证当前输入与 `rule_version`」限定语；N-05-2：未明写禁止调用方自带 `brand_norm` | B5 §5 第 1/2 项恢复「校验当前输入（非历史/缓存）」「校验 `rule_version` 与当前算法一致」；第 5 项「**禁止调用方提供 `brand_norm`、`mpn_norm` 或 `RESOLVED` 状态**」；Product:26/35 字段级同款；C10 增加「旧 `rule_version`」 | **RESOLVED**（检查 3、4 PASS） | 59_ B5:97-98、:101、:105；59_ Product:26、:35、:87、:124 |

附加：58_ §5.5 的 N-05-1/N-05-2 同 N-e；58_ §5.7 的「非声明漏并发」同 N-d；58_ §5.2 的「Brand:61 小写 proposed」同 N-b。

---

## Part C — 58_ §7 十三项未决 Owner 决策在 59_ 的状态

| # | 58_ §7 未决项 | 59_ 状态 | 判定 |
|---|---|---|---|
| 1 | P2（`BRAND_TRUST_INVALID → PENDING_BRAND`）批准 | 仍标 `PROPOSED — OWNER_APPROVAL_REQUIRED`（B5:32/39、Product:50/61、Brand:54/62/69、矩阵:52） | 正确保持未批准（**未**宣称批准） |
| 2 | 算法版本冻结值 `b5-min-v0.1` | 仍标「候选」（B5:7、legacy:81） | 正确 |
| 3 | 授权名单治理（载体/版本/维护方/批准/周期/范围/有效期） | Brand §3 补齐**要求**，并明写「未提供 → `OWNER_DECISION_REQUIRED` / `NOT_VERIFIABLE`；不得虚构批准」；Brand §8 列为待决 | 文字落实、证据缺失 → `NOT_VERIFIABLE`（检查 9b） |
| 4 | 稳定实体 ID 格式与来源 | Brand:102 仍为待决 | 未决（正确保留） |
| 5 | 同一实际控制主体判定方法/证据 | 仅规则文字（Brand:53、Product:98）；**未列入** 59_ 待决清单 | 未决且未承接（N-7） |
| 6 | `REJECTED → INVALID_INPUT` 无 Owner 批准记录 | P1 作为既定规则陈述（B5:31、Product:49、Brand:61），**未标** `OWNER_DECISION_REQUIRED`；矩阵 §5 无该项 | **UNRESOLVED**（BLK-D） |
| 7 | CONFIG/MANUAL 未来解禁条件 | Brand:104 仍为待决 | 未决（正确保留） |
| 8 | 51_/52_ 并入 B5 的效力确认 | legacy:41-42 仍为编制方主张（「并入」） | 未决（BLK-C 相关） |
| 9 | `42_/45_/46_/48_` 效力边界 | 已按 58_ 要求改由 Owner 决定优先，不再宣告失效 | 已处理（BLK-3 闭合） |
| 10 | T8 分类现行规范归属 | 改为 47_ 向量 + 48_ §1，并声明无独立冻结记录 | 部分处理（BLK-B） |
| 11 | 空白允许集合终值（U+2028/2029、U+202F、U+205F、U+1680、U+0085） | 59_ 未承接为待决项，且 B5:47 改以「C0/C1 等」开放措辞表达 | **UNRESOLVED**（N-8、BLK-C） |
| 12 | `product_uid` 未来来源 | 59_ Product:23 仅述「内部代理键；不由 Brand/MPN 生成；不承诺跨运行稳定」，未列待决，未承接 48_ OD-47-07「当前允许缺省」 | 未处理且未承接（N-10） |
| 13 | P-06 allowlist 未批准、CAND-09 `BLOCKED` | 59_ 未改变，且各文件「非声明」均重申不构成批准 | 正确（无越权） |

---

## Part D — 58_ §6 静态冲突样例重跑（S1–S11 旧编号）

| 旧 ID | 场景 | 59_ 重跑结果 | 判定 |
|---|---|---|---|
| S1 | REJECTED + 原始值含 U+200B | P1 → `BRAND_REJECTED`（Stage B 先于 C） | 已消解 |
| S2 | TRUSTED + authority 不在名单 | P2 → `BRAND_TRUST_INVALID`（PROPOSED） | 一致（依赖未批准项） |
| S3 | UNVERIFIED + MPN 有效 | P4 → `BRAND_UNVERIFIED` | 已消解 |
| S4 | UNVERIFIED + MPN FLAG | P4（Stage B 先于 C） | 已消解（旧「未定义」不再成立，B5:72 明确） |
| S5 | TRUSTED + `mpn_raw=""` | P6 → `MPN_INVALID` | 已消解 |
| S6 | MISSING + `mpn_raw=""` | P3 → `BRAND_MISSING` | 已消解 |
| S7 | TRUSTED + U+00AD | P5b → `NEEDS_REVIEW` | 一致 |
| S8 | TRUSTED + U+200B | P5a → `INPUT_INVALID` | 与 50_/48_ 一致，但与 47_ T8-11 冲突 |
| S9 | TRUSTED + `①②③` + en dash | P5b → `NEEDS_REVIEW` | 依据不再悬空（47_+48_）；但 T8-06/09/15 无裁定 |
| S10 | REJECTED 且缺 `provided_by` | P1 → `BRAND_REJECTED` | 可确定 |
| S11 | TRUSTED + `provided_by == authority` + FLAG | P2 → `BRAND_TRUST_INVALID` | 一致 |
| 新 S9 | TRUSTED + `"A\tB"` | 按 B5:47「C0/C1 等」字面 → `INPUT_INVALID`；51_ WS-01/WS-02 期望接受 | **新冲突**（BLK-C） |
| 新 S11 | TRUSTED + `brand_raw=None` | 无显式阶段映射 | **新未定义**（N-1） |
| 新 S13 | 仅 TRUSTED、缺 authority/evidence | B5 P2 → `BRAND_TRUST_INVALID`；Brand B2 → `UNVERIFIED/PENDING_BRAND` | **新冲突**（BLK-A） |

---

## Part E — 12 项检查汇总

| # | 检查 | 结果 | 主要依据 |
|---|---|---|---|
| 1 | 分阶段状态机（P0/P6、P2/P4、确定性） | **PASS** | B5:15-61、:69-78 |
| 2 | Brand 状态/原因码可达互斥确定；两码分立；P2 PROPOSED | **FAIL** | Brand:89 vs :62；B5:32；Product C5:119 |
| 3 | 可信计算不可被调用方绕过 | **PASS** | B5:95-105；Product:26/35/87/123-124 |
| 4 | current-input / `rule_version` 校验 | **PASS** | B5:97-98；Product:79-80、:124 |
| 5 | `identity_norm` 残留判定与覆盖 52_:40/:44、53_:63 | **PASS**（残余 N-3） | B5:86-91；legacy:48-53 |
| 6 | Owner 决定引用一致 / 未错误宣告失效 / OD-49 独立记录 | **PASS（6a）/ NOT_VERIFIABLE（6b）** | legacy:14-29、:59-73；矩阵:29-35 |
| 7 | T8 逐向量对齐 / 引用有效 | **FAIL** | B5:113-119；47_:39-44；48_:15-24 |
| 8 | canonical JSON/顺序/UTF-8/哈希输入/版本谱系 | **PASS**（N-5） | 七行字节一致；B5:111、:123-124 |
| 9 | 实体 ID 命名/授权分离/并发/原因码 | **PASS（9a）/ NOT_VERIFIABLE（9b）** | Product:63-73；Brand:42、:73；B5:111 |
| 10 | 效力文件是否暗中撤销/修改/扩大 Owner 决定 | **PASS**（附 BLK-D 提示） | legacy §1、§3、§5、§6 |
| 11 | 58_ 非阻断项是否全部解决/分类 | **FAIL**（N-b 未解决） | Brand:89 |
| 12 | 59_ manifest 6/6；50_–58_ 未变 | **PASS** | `FILE_SHA256_INVENTORY.md` §1/§2/§4 |

**总判定：`NOT_READY_FOR_FREEZE`**（阻断：BLK-A、BLK-B、BLK-C、BLK-D）。