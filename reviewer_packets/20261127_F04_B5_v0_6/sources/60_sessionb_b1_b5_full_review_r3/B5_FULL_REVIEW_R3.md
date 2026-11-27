# B5 全文一致性独立复核（R3）— 59_ 六份 DRAFT

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-B5-FULL-REVIEW-R3-001 |
| 版本 | v1.0-INDEPENDENT-REVIEW |
| 日期 | 2026-11-26 |
| 状态 | **REVIEW_COMPLETED — 只读复核** |
| 性质 | 独立全文复核；**不是** B5 冻结、**不是** P-06 批准、**不是** B-1 授权 |
| 复核对象 | 59_ 六份 DRAFT + `59_/SHA256SUMS`；50_–58_ 全部相关源文档与复核记录；41_/44_/45_/46_/48_ Owner 记录；47_ T8 向量 |
| 最终 Verdict | **`NOT_READY_FOR_FREEZE`** |

---

## 1. 独立性声明

- 本次复核由 Independent Reviewer 执行。复核者**未参与** 50_、51_、52_、53_、54_、55_、56_、57_、58_、59_ 任何文件的编写、修订、哈希生成或更正；未参与 59_ 六份草案的任何条款设计。
- 全部结论来自本次对完整文件的一次性直读、本机 SHA-256 实测、以及 `grep`/`sed`/`wc` 的只读检索，**未引用任何摘要、会话记忆或编制方自述结论**。凡引用 54_/56_/58_ 之处，仅用于定位争议点，不采信其判定。
- 复核为只读：未修改 50_–59_ 任何文件或 manifest，未修改 P 项 / Gate / Owner Record，未创建或检出 worktree，未运行项目测试，未读取或操作 stash，未 commit/push/merge/deploy。
- 唯一写入为 `60_sessionb_b1_b5_full_review_r3/` 下五份报告；未更新 `60_/SHA256SUMS`（由归档方计算）；报告不内嵌自身 SHA-256。

---

## 2. 环境与复核范围

- 工作目录：`E:\workspace\.scratch\morrishk-owner-decision\`
- 平台：win32，Git Bash（POSIX sh）
- 只读基线：`git log -1` = `bfe5ea7 docs(dsbit): record R2.2.10-F review packet push status`（未改动工作树）
- 完整读取（逐字、非抽样）：
  - 59_：`B5_MINIMAL_NORMALIZATION_RULES_v0_5_DRAFT.md`（130 行）、`PRODUCT_IDENTITY_FIELD_CONTRACT_v0_5_DRAFT.md`（131 行）、`BRAND_INPUT_INTERFACE_CONTRACT_v0_4_DRAFT.md`（109 行）、`SPECIFICATION_PRECEDENCE_AND_LEGACY_BOUNDARY_v0_2_DRAFT.md`（87 行）、`OWNER_DECISION_ALIGNMENT_MATRIX.md`（58 行）、`T8_EVIDENCE_AND_DECISION_TRACEABILITY.md`（59 行）、`SHA256SUMS`（6 行）
  - 50_：B5 v0.2-R2、P06 v1.4；51_：空白/扫描补充、CAND09 条件；52_：OD52 补充；53_：Product v0.2、Brand v0.1；54_：B5 一致性复核；55_：B5 v0.3、Product v0.3、Brand v0.2、版本谱系；56_：全文一致性复核；57_：B5 v0.4、Product v0.4、Brand v0.3、legacy boundary；58_：B5_FULL_REVIEW_R2（284 行）
  - 47_：`B5_T8_UNICODE_VECTORS_DRAFT.md`（T8-01…16）；48_：OD-47 记录；45_：P-05/P-06 记录；46_：技术方向接受；41_/44_ 状态行
- 未覆盖见 §9。

---

## 3. 哈希实测与清单完整性

由复核者本机 `sha256sum` 实测（非引用文档内数值），完整清单见 `FILE_SHA256_INVENTORY.md`。

- **`59_/SHA256SUMS` = 6/6 全部 OK**（`sha256sum -c` 逐条通过），manifest 未收录自身（符合惯例）。
- 59_ 六份文件实测哈希：B5 `14c78478…3b1c`、Brand `db694428…b0c`、Owner 矩阵 `95c3a3ca…7cd4`、Product `6a5bdd24…6531`、legacy `2b430b47…a5c2`、T8 追溯 `3adfd50a…ed5a`。
- **50_–58_ 全部 manifest 逐条 OK**（45_ 2/2、46_ 3/3、47_ 3/3、48_ 1/1、49_ 2/2、50_ 2/2、51_ 2/2、52_ 1/1、53_ 2/2、54_ 1/1、55_ 4/4、56_ 1/1、57_ 4/4、58_ 1/1），且各目录文件数与 manifest 条目数一致（无未登记文件）。
- **跨快照交叉验证未变**：56_ §1、54_ §1、58_ §3 各自记录的 50_/51_/52_/53_/54_/55_/56_/57_ 哈希，与本轮实测逐一相同；57_ 的 manifest 哈希 `ccc06227…9640` 与 58_ §3 记录值相同。可判定 50_–58_ 自 R2 复核以来未被改动。
- 编码：59_ 六份文件首字节均为 `23 20`/`23 20 xx`（`# ` 起首），无 UTF-8 BOM。

**canonical JSON 逐字节比对**：50_:106、55_ B5:80、55_ Product:85、57_ B5:70、57_ Product:80、59_ B5:108、59_ Product:90 七行单行 SHA-256 完全相同（`7a893667448ad5c8…dc4f`）。即 59_ 未改动哈希载荷。

---

## 4. 12 项检查结果

| # | 检查项 | 结果 | 依据（精确位置） |
|---|---|---|---|
| 1 | 分阶段状态机：P0/P6 分离、P2/P4 互斥、确定性 | **PASS** | 59_ B5:15-25（Stage A 明确「`mpn_raw=""` 不在此阶段判定」）、:52-56（Stage D 承担空/空白/归一化后为空）、:37/:78（P2 仅 TRUSTED 校验失败、P4 仅显式 UNVERIFIED）、:69/:74（MISSING+空→P3、TRUSTED+空→P6）、:50（P5a 先于 P5b，均先于 D）。58_ S5/S6 冲突已消解。**限定**：B5 内部的确定性不覆盖 Brand 接口层（见检查 2）与码点闭集（见检查 8/阻断 BLK-C） |
| 2 | Brand 状态/原因码可达、互斥、确定映射；`BRAND_TRUST_INVALID` 与 `BRAND_REJECTED` 分立；P2 仍标 PROPOSED | **FAIL** | 四分态可达、七原因码可达（B5:29-35、:82）；P1/P2 分立（B5:31-32、Product:49-50）；P2 `PROPOSED — OWNER_APPROVAL_REQUIRED` 在 B5:32/:39、Product:50/:61、Brand:54/:62/:69 **仍完整保留**。但 **Brand §7 B2（Brand:89）把「仅 TRUSTED、缺 authority/evidence」判为 `UNVERIFIED/PENDING_BRAND`，与同一文件 §4（Brand:62）「TRUSTED 但背书/授权/实体分离无效 → `BRAND_TRUST_INVALID`」及 B5 P2、Product C5（Product:119）直接冲突**；同一输入存在两个文档化结果且 B2 缺原因码 → 非确定映射 |
| 3 | 调用方自带 `brand_norm`/`mpn_norm`/`RESOLVED`/diagnostic/复用 Key 是否可绕过可信计算 | **PASS** | B5:95-105（第 1/2 项校验当前输入与 `rule_version`；第 5 项「**禁止调用方提供 `brand_norm`、`mpn_norm` 或 `RESOLVED` 状态**」；禁止清单含 `diagnostic_norm`、未验证 norm、复用旧 Key、仅信任状态字符串）；Product:26/:35（字段级「禁止调用方提供」）、:87、C9/C10（Product:123-124）；Brand:88-97。58_ N-05-1/N-05-2 已闭合 |
| 4 | current-input 与 `rule_version` 校验 | **PASS** | B5:97-98（「校验当前输入（非历史/缓存）」「校验 `rule_version` 与当前算法一致」）；Product:79-80；C10「复用旧 Key/旧 `rule_version` → 拒绝」（Product:124） |
| 5 | 全 50_–59_ `identity_norm` 逐条判定 | **PASS**（附残余风险） | 59_ B5:86-91 明确「B5 不存在 `identity_norm`」并逐条点名 `52_:40`、`52_:44`、`53_ Product:63`「不得作为现行 Business Key 输入」；59_ legacy:48-53 三条独立行逐条给出现行替代。58_ 指出的 legacy 漏列 `52_:44` 已补齐。实测全仓命中：59_ 内 4 处全为否定/取代性表述；52_:40、52_:44、53_ Product:63 源文件仍未加内标注（受「不得修改 50_–58_」约束，只能外部声明）→ 残余风险降级为 N-3 |
| 6 | Owner 决定引用与 45_/46_/48_ 原文一致性；是否错误宣告失效；OD-49 独立记录 | **6a PASS / 6b NOT_VERIFIABLE** | 6a：59_ legacy:22-29、:59-66、:73 与 59_ 矩阵:21-27 对 45_/46_/48_ 的范围描述与原文一致（45_:8/:14-18/:33-35；46_:8/:14-20/:24-32；48_:8/:15-24/:57-78），并**明令「45_/46_/48_ 不得被 59_ 宣告为『无当前规范效力』」**，58_ BLK-3 已逆转。全文 `冻结`/`批准` 检索无任何已冻结/已批准声明。6b：OD-49-01…08 **无独立 Owner 记录文件**（仅见 50_、51_、54_、58_ 的引用形式），59_ 矩阵:29-35 与 legacy:29 已如实标注 `TRACEABILITY_GAP — OWNER_DECISION_REQUIRED`，但仍影响 BLK-D（见 §6） |
| 7 | T8 逐向量对齐（47_ 向量 ↔ 48_ 裁定 ↔ 59_ 算法）；T8 引用有效性 | **FAIL** | 引用有效性已修：59_ B5:113-119 改为指向 `47_/B5_T8_UNICODE_VECTORS_DRAFT.md` + `48_/…CAND04.md §1`，并正确指出「51_/52_ 不包含 T8 向量」（实测 51_/52_ 中 `T8` 命中数均为 **0**）、「57_ B5:84 引用已废弃」（57_ B5:84 原文确为「T8 处置以 51_ §3 与 52_ §1/§3 为准」）。但 59_ 把 47_ 整表作为 T8 向量承接而未处理 **T8-11**：47_:39 期望 ZWSP 被**保留**为 `'a\u200bb'`，59_ B5:47 判 ZWSP 为硬禁止 → `INPUT_INVALID`；48_ OD-47-04（48_:21）为「拒绝或 NEEDS_REVIEW」，50_ §6（50_:129）取「INVALID_INPUT」。逐项见 `T8_TRACEABILITY_MATRIX.md`（16 项中 1 项硬冲突、3 项无 48_ 裁定、1 项标签不一致） |
| 8 | canonical JSON、字段顺序、UTF-8、哈希输入、算法版本谱系 | **PASS**（附 N 级） | 七处 canonical JSON 单行哈希完全相同（§3）；B5:111 与 Product:93 均含 `pbk1_`+SHA-256、`rule_version` 入哈希、原始输入不入哈希、「不声称持久/**并发**/跨进程唯一」；UTF-8 无 BOM；文档版本不入哈希、算法版本入哈希（B5:123-124、legacy:79-81）。N 级：59_ 无合并版本谱系表（55_ 谱系表止于 55_） |
| 9 | Brand 实体 ID 命名、授权分离、并发限制、原因码一致性 | **9a PASS / 9b NOT_VERIFIABLE** | 9a：命名不一致已修——Product §4（Product:63-73）给出 `provided_by_entity_id → brand_provided_by_entity_id` 等 5 条一一映射，Brand:38 同步声明「同一值，不得用显示名替代」；职责分离（Brand:53、Product:98「相同或同一控制实体 → `BRAND_TRUST_INVALID`」）；并发口径 B5:111 与 Product:93 一致；原因码 B5:82 与 Brand:73 七码完全一致。9b：`B5_TRUST_AUTHORITY_ALLOWLIST.md` 不存在，无 Owner 批准记录、无版本、无维护方、无实体 ID 目录 → Brand:42 自认 `OWNER_DECISION_REQUIRED / NOT_VERIFIABLE`，依规则不得给 PASS。N 级：Product 未再列封闭原因码清单（B5 §3、Brand §5 均列） |
| 10 | 规范效力文件是否暗中撤销/修改/扩大 Owner 决定 | **PASS**（附 BLK-D） | legacy §1（legacy:14-18）确立「Owner 决定不被后续草案自动取代」「冲突时 Owner 决定优先」「只处理技术草案文本先后」「历史 Owner 决定仍有效」；§3 效力表**已把 Owner 记录移出技术效力表**（仅列技术文档，legacy:35-44），消除 57_ legacy:32 的自相矛盾行；§5 逐条重申 45_/46_/48_/41_/44_ 有效。无「撤销/扩大」表述。**但** P1（`REJECTED → INVALID_INPUT`）的唯一依据 OD-49 无独立记录，且与 48_:51「Brand 缺失/不可信 → `PENDING_BRAND`」存在未消解歧义，而 59_ 仅对 P2 标 PROPOSED → 见 BLK-D |
| 11 | 58_ 全部非阻断发现是否已解决或明确分类 | **FAIL** | 已解决：52_:44 漏列（legacy:52）、字段命名（Product:63-73）、casing（59_ 全文 `PROPOSED` 大写，B5:84 声明「一律大写」）、并发（Product:93）、Brand 头部效力行（Brand:9）、current input/`rule_version`（B5:97-98）、禁止 caller `brand_norm`（B5:101、Product:26/35）、确定性顺序（B5 Stage A→E）。**未解决**：58_「57_ Brand:85（B2）原因码未定」在 59_ Brand:89 被原样保留，且升级为与 §4 冲突（见检查 2）。逐项见 `FINDINGS_MATRIX.md` |
| 12 | 59_ SHA256SUMS 6/6；50_–58_ 未变 | **PASS** | 6/6 OK；50_–58_ 各自 manifest 全部 OK；并与 54_/56_/58_ 记录的历史哈希交叉一致（§3） |

---

## 5. 多条件冲突静态推演（不运行测试）

方法：按 59_ B5 的 Stage A→B→C→D→E 顺序（B5:15-61、:69-74）逐行推演唯一结果，再与 59_ Product §8（Product:113-126）、59_ Brand §7（Brand:88-97）、50_/51_ 机制比对。

| # | 输入组合 | 59_ B5 推演 | 59_ 文档期望 | 判定 |
|---|---|---|---|---|
| S1 | Brand `REJECTED`；Brand 原始值含 U+200B；MPN 有效 | Stage B P1 → `INVALID_INPUT/BRAND_REJECTED` | B5:70；Product C4:118 | 一致（58_ S1 已消解） |
| S2 | Brand `TRUSTED`；authority 不在名单 | P2 → `PENDING_BRAND/BRAND_TRUST_INVALID`（PROPOSED） | Product C5:119、Brand B7:95 | 一致（依赖未批准项） |
| S3 | Brand `UNVERIFIED`；MPN 有效 | P4 → `BRAND_UNVERIFIED` | Product C3:117、Brand B4:91 | 一致（58_ S3 已消解） |
| S4 | Brand `UNVERIFIED`；MPN 含 FLAG | P4（Stage B 先于 C）→ `BRAND_UNVERIFIED` | B5:72 | 一致 |
| S5 | Brand `TRUSTED`；`mpn_raw=""` | Stage A 通过 → Stage D → `MPN_INVALID` | B5:74；Product C7:121 | 一致（58_ S5 已消解） |
| S6 | Brand `MISSING`；`mpn_raw=""` | P3 → `BRAND_MISSING` | B5:69；Product C2:116 | 一致（58_ S6 已消解） |
| S7 | Brand `TRUSTED`；MPN 含 U+00AD | P5b → `NEEDS_REVIEW` | 51_ WS-11:100；50_ §3.2:65 | 一致 |
| S8 | Brand `TRUSTED`；MPN 含 U+200B | P5a → `INPUT_INVALID` | 50_ §3.1:52、§6:129；48_ OD-47-04:21 | 与 47_ T8-11:39 冲突（见 BLK-B） |
| S9 | Brand `TRUSTED`；MPN = `"A\tB"` | 按 B5:47「C0/C1 等」字面 → P5a `INPUT_INVALID` | 51_ WS-01:90、WS-02:91 期望 `'abc'`/`'a b'` | **冲突**：legacy:41 规定「冲突处 59_ 优先」→ 按 59_ 字面将否决 51_ 允许的 TAB/LF/CR（见 BLK-C） |
| S10 | Brand `TRUSTED`；MPN 含 `①②③` + en dash | P5b → `NEEDS_REVIEW` | 48_ OD-47-02:18；50_ §6:121/:131 | 一致 |
| S11 | Brand `TRUSTED`；`brand_raw=None` | Stage B 未枚举「缺 brand_raw」；P2 仅列「证据/授权/实体分离」；Stage E 要求 `brand_norm` 有效 → **无显式映射** | 59_ Product §2 仅写「brand_raw 条件必填」 | **未定义**（N-1；53_ Product:58-60 原有「TRUSTED 必须 brand_raw 非空」不变量未被 59_ 承接） |
| S12 | Brand `TRUSTED`；`provided_by == authority`；MPN 含 ZWSP | P2 先于 P5a → `BRAND_TRUST_INVALID` | Product C11:125、Brand B6:93 | 一致 |
| S13 | 仅 TRUSTED、缺 authority/evidence | B5 P2 → `BRAND_TRUST_INVALID` | Brand §4:62 同；**Brand B2:89 却写 `UNVERIFIED/PENDING_BRAND`** | **冲突**（BLK-A） |

结论：58_ 的 S1/S3/S4/S5/S6/S9（旧编号）共 6 例冲突中，5 例已消解；新增 S9（TAB/C0 字面冲突）、S11（未定义）、S13（B2 冲突）三例。

---

## 6. 阻断发现（冻结前必须解决）

**BLK-A｜Brand B2 与状态机冲突，且 58_ 该项未修**
- Brand:89（B2）「仅 TRUSTED，缺 authority/evidence → `UNVERIFIED/PENDING_BRAND`」无原因码，与 Brand §4:62、B5:32（P2）、Product C5:119 冲突；同一输入两种文档化结果。
- 57_ Brand:85 原文相同 → 58_ §8 非阻断项未被处理，反因新增 P2 明确化而升级为阻断。

**BLK-B｜T8 向量承接与算法冲突（58_ BLK-4 仅部分修复）**
- 59_ B5:115-116 把 47_ 整表定为「T8 测试向量」，但 47_:39（T8-11）期望 ZWSP 保留、47_:40（T8-12）期望软连字符保留，与 59_ B5:47（ZWSP 硬禁止→`INPUT_INVALID`）及 48_ OD-47-04 不一致；47_ 未按 48_/50_ 事后裁定更新，59_ 也未标注哪些向量行已被取代。
- 47_ 中 T8-06（K）、T8-09（希腊终结 sigma）、T8-15（组合重音）在 48_ §1 **无对应裁定**，却均被 47_/50_ 标为 `ACCEPT`；T8-07 在 47_:35 标 `FLAG`、在 48_ OD-47-03a:20 标 `ACCEPT WITH FLAG`，标签体系不一致。

**BLK-C｜冻结候选缺失规范算法本体，且「C0/C1 等」与 51_ 允许集冲突**
- 59_ B5 全文无归一化步骤（NFKC、原始扫描、空白折叠、`casefold`、标点保留、幂等）、无不可见/空白码点表；其内容仅存在于 50_（被 legacy:40 定为「历史草案」）与 51_/52_（被 legacy:41-42 定为「并入」）。
- legacy:41「51_ 空白/扫描 → 并入 59_ B5，冲突处 59_ 优先」在 59_ 文本中**未落实**（59_ B5 无任何空白规则），却因「59_ 优先」使 B5:47 的开放措辞「C0/C1 等」压过 51_:41-43 的显式允许集（TAB/LF/CR/SPACE/…），与 51_ WS-01/WS-02 直接冲突（S9）。
- legacy §1.5（legacy:18）「历史文件不得被引用为现行技术规则」与「51_ 并入」并列，未给出并入后的规范载体，导致 `b5-min-v0.1` 的算法语义在候选文档内不可完整取得。

**BLK-D｜P1 `REJECTED → INVALID_INPUT` 的 Owner 依据不可验证，且未标待决**
- 该映射的唯一来源为 OD-49；old 映射见 legacy:50（`50_ B5:36`），而 50_:36 原文仍把 `REJECTED` 归入 `PENDING_BRAND`；OD-49 本身**无独立 Owner 记录**（59_ 矩阵:33 已承认）。
- 48_:51 为「Brand 缺失/不可信 → `PENDING_BRAND`」，`REJECTED` 是否属「不可信」未有 Owner 界定；59_ 仅对 P2 标 `PROPOSED — OWNER_APPROVAL_REQUIRED`（B5:32、Product:50、Brand:69），**P1 未标 `OWNER_DECISION_REQUIRED`**，59_ 矩阵 §5（矩阵:46-53）亦无对应行。
- 后果：若此时冻结，将把一条无 Owner 记录的映射锁定为冻结规则。

---

## 7. 非阻断发现（建议同批修正）

| ID | 发现 | 位置 | 影响 |
|---|---|---|---|
| N-1 | `TRUSTED` + `brand_raw` 缺失/为空无显式阶段映射 | B5:29-38、Product:25 | S11 推演无定义；53_ Product:58-60 原有不变量未承接 |
| N-2 | Product 未再列封闭原因码清单（B5 §3、Brand §5 均列） | Product §2:38、§3 | 三处一致性弱化，靠引用维持 |
| N-3 | 52_ 仍被定为「诊断/NFKC 并入」而非历史，其 `identity_norm` 两行无内标注 | legacy:42、:51-52 | 单独阅读 52_ 仍有误读可能（受不可修改约束，仅能靠 legacy §4 覆盖） |
| N-4 | OD-49 引用来源枚举漏 58_ | 矩阵:33（仅列 50_/51_/54_） | 实测 58_ 亦含 OD-49，枚举不完整 |
| N-5 | 59_ 无合并版本谱系表；55_ 谱系表止于 55_ | B5:123-124、legacy:78-82 | 57_/59_ 谱系需跨文件拼接 |
| N-6 | T8 追溯表未含 48_ §1 两条「（补充）」行（en dash/minus ACCEPT、FLAG 语义） | T8 追溯:34-41 | 追溯不完整（不影响结论方向） |
| N-7 | 「同一实际控制主体」判定方法/证据仍缺，且未列入 Brand §8 待决项 | Brand:53、:99-104 | 58_ §7 第 5 项未承接为显式待决 |
| N-8 | 51_ §6 三项待确认（U+2028/2029 取舍、U+0085、扫描记录格式）未承接为待决项 | 51_:106-112 | 空白允许集终值仍悬空 |
| N-9 | 无单句声明阶段总序 A→B→C→D→E（仅有局部「先于」表述） | B5:50、:69-70 | 阅读成本，非歧义 |
| N-10 | 58_ §7 第 12 项（`product_uid` 未来来源）未处理、未列待决 | Product:23 | 48_ OD-47-07「当前允许缺省」未被复述 |
| N-11 | 59_ B5 §2 示例表未列「TRUSTED + MPN 硬禁止码点」组合（规则可推得，未示例） | B5:65-75 | 与 58_ 「不得留下未定义组合」诉求相差一档 |

---

## 8. 最终 Verdict

**`NOT_READY_FOR_FREEZE`**

12 项判定：**PASS 7 项**（1、3、4、5、8、10、12）；**拆分 2 项**（6 = 6a PASS / 6b NOT_VERIFIABLE；9 = 9a PASS / 9b NOT_VERIFIABLE）；**FAIL 3 项**（2、7、11）。合计 7+2+3 = 12。58_ 的四项阻断中：BLK-1（P0/P6）已闭合、BLK-2（P2/P4）在 B5/Product 层闭合但在 Brand B2 层复发、BLK-3（Owner 记录被宣告失效）已逆转修复、BLK-4（T8 悬空）仅部分修复。

**提交 Owner 冻结决定的条件（本复核意见）**：BLK-A…BLK-D 闭合后方可提交 Owner 冻结决定。本报告不构成冻结、不构成 P-06 批准、不构成 CAND-09 解除、不构成 B-1 授权。

---

## 9. 限制与未覆盖

1. 未运行任何代码或测试；全部判定为文档静态阅读与文本推演。
2. 未验证实现存在性：`src/icpdf/domain/product_identity.py` 等模块按文档均为「未创建」，本轮未创建、未检查。
3. 授权名单、Owner 批准记录、实体 ID 目录在本仓不存在 → 检查 6b/9b 只能 `NOT_VERIFIABLE`。
4. OD-49-01…08 无独立记录文件；本轮仅确认「不存在」，不对其内容作任何推断。
5. 47_ 向量中的 Python repr 期望值来自其自述「参考计算」，本轮未复算（不运行代码），仅做文本级对齐。
6. 41_/44_ 仅核验状态行与文件名（41_:7 `RECORDED — P-02 / P-15 CLOSED`；44_:7 `RECORDED — PREPARATION SCOPE/WINDOW DEFINED`），未逐节复核其 P 项条款。
7. 未复核 60_ 归档与 SHA256SUMS 生成；本报告不内嵌自身 SHA-256。