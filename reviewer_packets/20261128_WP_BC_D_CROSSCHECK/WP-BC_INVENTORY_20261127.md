# BLK-B/C/D 未决项与 P 项盘点（WP）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-B1-WP-BC-INV-001 |
| 版本 | v0.1-DRAFT |
| 日期 | 2026-11-27（按 Owner 指定交付物名；盘点基于下述固定基线执行） |
| 状态 | **DRAFT — READ_ONLY_INVENTORY — NO_STATE_CHANGE** |
| 性质 | 只读盘点；不构成裁定、批准、冻结、登记或授权 |
| 治理仓基线 | `E:\workspace\.scratch\morrishk-owner-decision`，HEAD `22a09c088a5a740981e0047048ed2048c643af94`（分支 `docs/sessionb-owner-decision-register`，与 origin 同步） |
| 复核仓基线 | `E:\workspace\独立站\morrishk-site-upgrade-review`：B5 v0.8.1 提交 `7ad594135e341fe8fcbcdf869b33778e4f7a4811`；B5 冻结记录提交 `f469e1d1f3ba78416de3ea07237c6315f4579a65`（该仓工作树 checkout 为 `c22dc4d4`，上述对象以 `git show` 只读读取） |
| 依据材料 | `61_/BLK_A_D_OWNER_DECISION_BRIEF.md`；`69_/OD_BLK_A_R2_ACCEPT_01.md` §3；`66_` §13；`68_`；`72_/OWNER_DECISIONS_F04_BLK_A_D_20261127.md`；`32_ v1.3/B1_EXECUTION_PRECONDITIONS.md`；`41_`、`43_`、`44_`、`45_`、`49_`、`50_`；复核仓 `f469e1d`、`7ad5941` |
| 方法 | 只读读取与哈希复算；未修改任何既有文件；未运行测试；未 commit / push |

## 0. 时间线与口径

`61_`、`69_` 是 2026-11-26 的材料；2026-11-27 出现了更新的 Owner 方向记录与 B5 冻结记录。盘点按时间顺序读取，避免用旧快照覆盖新事实，也避免把新记录当成已生效。

| 时点 | 事件 | 载体 | 状态 |
|---|---|---|---|
| 2026-11-26 | BLK-A…BLK-D 选项材料 | `61_`（v0.1-DRAFT） | 仅材料，无裁定 |
| 2026-11-26 | 接受 R2 修订；保留全部阻断 | `69_`（OD-BLK-A-R2-ACCEPT-01） | `OWNER_ACCEPTED — NOT_EFFECTIVE` |
| 2026-11-27 14:29–14:30 | BLK-A=A1、BLK-B=B1（含 T8-06/09/15=ACCEPT）、BLK-C=C1+TAB/LF/CR、BLK-D=D1；F-04 基准=v2.1 | `72_`（OD72） | `DRAFT — RECORDED_FROM_CONVERSATION — NOT_REGISTERED — NOT_EFFECTIVE` |
| 2026-11-27 15:01 | P2 暂缓批准，排除出 B5 冻结范围 | B5 v0.7 正文 | 记录于 `7ad5941` 树内 |
| 2026-11-27 15:14 | 算法版本升至 `b5-min-v0.2`；正式基准 Python 3.13.15 / Unicode 15.1.0 | B5 v0.8.1 | `OWNER_ACCEPTED`（转录） |
| 2026-11-27 15:17 | B5 v0.8.1 提交 | `7ad5941` | 规范正文 SHA-256 `e4f737aa…845006`（本次独立复算一致） |
| 2026-11-27 15:22 / 15:32 | v0.8.2 / v0.8.3 修订说明（验证脚本与 G2 计数补强） | `77_`、`78_` | `DRAFT — NOT_FROZEN` |
| 2026-11-27 15:46 | Reviewer `READY_FOR_FREEZE`（Owner 转达，无仓内原始回执） | — | 转述 |
| 2026-11-27 15:48 | Owner `FREEZE B5`（不含 P2） | `f469e1d` | `OWNER_DECIDED — RECORDED_FROM_CONVERSATION — NOT_REGISTERED` |
| 2026-11-27（其后） | D-01/D-09 裁定再确认（不追溯） | `79_`（提交 `22a09c0`） | 归档记录，不改变 BLK-B/C/D |

**口径冲突（只报不修）**：`69_` §3（2026-11-26）写「B5 不冻结」，`f469e1d`（2026-11-27 15:48）写「B5（不含 P2）FROZEN」。后者时间在后，但为未登记、对话转录记录；`69_` 是已登记记录但其效力为 `NOT_EFFECTIVE`。两者优先级需 Owner/Reviewer 裁定，本盘点并列呈现，不自行择一。

## 1. BLK-B — T8 向量承接冲突

`61_` §BLK-B 列出的原冲突与 OD72/B5 的落地情况：

| 编号 | 事项 | 61_ 原冲突 | Owner 方向（`72_`） | 落地（`7ad5941` B5 v0.8.1 / T8 向量） | 残余未决 |
|---|---|---|---|---|---|
| B-1 | T8-11 ZWSP `A\u200bB` | `47_` 保留 vs 59_ 硬禁止 | B1：`INVALID_INPUT` | T8-11 → `INVALID_INPUT`（P5a） | OD72 未登记；T8 表正式测试证据以冻结记录 G2 53/53 为准，属 Owner-run/Reviewer 逻辑复算 |
| B-2 | T8-12 软连字符 `A\xadB` | 保留 vs 复核 | B1：`NEEDS_REVIEW` | T8-12 → `NEEDS_REVIEW`（LIST） | 同上 |
| B-3 | T8-06 `U+212A`、T8-09 `ΟΣ`、T8-15 `e+U+0301` | `47_/50_` ACCEPT，但无 48_ 裁定 | #3a：三项均 ACCEPT，作为 Owner 依据 | T8-06/09/15 → `ACCEPT` | 同上；`47_` 原表未标 SUPERSEDED |
| B-4 | T8-07 `İ` | 标签不一致 | B1：`ACCEPT_WITH_FLAG` | T8-07 → `ACCEPT_WITH_FLAG → NEEDS_REVIEW` | 同上 |

**BLK-B 未决项归纳**

1. 技术判定已被 OD72 方向覆盖并写入 B5 v0.8.1，冻结记录将 T8 向量列为冻结对象；无新的向量级技术未决。
2. 形式未决：OD72 与冻结记录均 `NOT_REGISTERED`、无 `DECISION_ID`、Reviewer 回执为转述；`47_` 旧表的历史化仅在新文档声明，原文件未改。
3. `69_` 的状态快照未更新（其 §3 仍按 2026-11-26 口径）；不影响判断，但两份材料并存时以时间在后且有冻结记录者为事实来源。

## 2. BLK-C — 算法本体缺失与空白集冲突

| 编号 | 事项 | 61_ 原冲突 | Owner 方向（`72_`） | 落地（B5 v0.8.1，冻结对象） | 残余未决 |
|---|---|---|---|---|---|
| C-1 | B5 缺算法本体 | 59_ 仅状态/Key；算法在 50_/51_/52_ | C1：下一版内联完整算法；51_/52_ 转历史 | §2.1 处理顺序 1–9、§2.2 码点清单、§2.6 三分输出与幂等 | 正式测试证据依赖项目环境（`f469e1d` G1：Python 3.13.15 / Unicode 15.1.0，Owner-run + Reviewer 逻辑复算） |
| C-2 | C0/C1 与 TAB/LF/CR 冲突 | 59_ B5「C0/C1 等」压过 51_ 允许的 TAB/LF/CR | C1 + 明确 U+0009/U+000A/U+000D 允许 | §2.2.1 仅拒绝 Cc 中除 U+0009/A/D 外的码点；§2.3 允许空白含 U+0009/A/D | 纯空白串（WS-15A `\t\n\r\xa0\u3000`）仍 `INVALID_INPUT`，原因是第 7 步「结果为空」，与允许空白不冲突 |

**BLK-C 未决项归纳**

1. 算法本体与空白集冲突在文档层已消解，并以 B5 v0.8.1 为唯一冻结候选。
2. 形式未决：B5 v0.8.1 文件自述仍为 `DRAFT — NOT_FROZEN`，冻结以 `f469e1d` 记录为准（该记录明示不改字节）；51_/52_ 原文件未标历史；冻结记录未登记。
3. P2 相关算法分支（`BRAND_TRUST_INVALID`）被排除在冻结之外，见 §4。

## 3. BLK-D — P1 `REJECTED → INVALID_INPUT` 依据

| 编号 | 事项 | 61_ 原冲突 | Owner 方向（`72_`） | 落地（B5 v0.8.1 Stage B） | 残余未决 |
|---|---|---|---|---|---|
| D-1 | P1 依据 | 59_ 将 `REJECTED → INVALID_INPUT`；50_ 历史将其归 `PENDING_BRAND`；48_ 未界定；OD-49 无独立记录 | D1：确认 59_ 现状；OD72 即 Brief 要求的独立 OD-49 依据记录 | Stage B P1：`brand_trust_status=REJECTED → INVALID_INPUT / BRAND_REJECTED`，注明依据 OD72 #5（D1） | OD72 为对话转录、未登记、未生效；P1 的「独立记录」在形式上成立，在登记效力上未成立 |

**BLK-D 未决项归纳**

1. P1 的方向与理由已补齐（OD72 #5），并进入 B5 冻结文本。
2. 唯一未决为治理形式：登记、`DECISION_ID`、独立 Reviewer 复核；`P1` 不再缺依据，但仍缺「已登记生效」属性。

## 4. 重点核对：R-2、R-3、K5、P2、C5

| 对象 | 当前状态 | 依据 | 解除/批准条件 | 是否受 OD72 / B5 冻结影响 |
|---|---|---|---|---|
| R-2 纠错（`CORRECTION`） | `BLOCKED_PENDING_OWNER_APPROVAL`，不新增 K1 | `66_/BLK_A_STATE_TRANSITION_AUDIT_SPEC.md:289`（文件 SHA-256 `891006a1…b7fc`，本次复算一致）；`69_` §3 第 4 条 | `K1 key semantics explicitly approved by Owner`；无自动解除 | 否。OD72/B5 均未涉及 K1 key semantics，仍 `BLOCKED` |
| R-3 替代（`SUPERSEDE`） | 同上 | `66_:290`；`69_` §3 第 4 条 | 同上 | 否，仍 `BLOCKED` |
| K5 `BLOCKED_ATTEMPT` | `PROPOSED_NEW — NOT_EFFECTIVE — PENDING_OWNER_APPROVAL`，不进 66_、不进实现 | `68_/BLK_A_BLOCK_RECORD_TYPE_PROPOSAL.md`（`5fa358d4…6efa`）；`69_` §1 B（仅接受为提案） | Owner 逐项批准类型名/字段/幂等键/关系/是否并入 66_ | 否。`72_`–`79_` 均未提及 K5，仍为提案 |
| P2 `BRAND_TRUST_INVALID` | `PROPOSED` | `61_:18`（B5:32、Product:119）；`69_` §3 第 5 条；`f469e1d` §3.1 明确排除 P2 与 `BRAND_TRUST_INVALID`；B5 v0.8.1 §8.1 四条执行边界继续有效 | Owner 单独批准；批准前不得生成 Key、不得映射为其他原因码或 `RESOLVED` | 否。冻结显式排除，状态不变 |
| C5 `TRUSTED + 信任校验失败 → PENDING_BRAND / BRAND_TRUST_INVALID` | `NOT_APPROVED` | `59_/PRODUCT_IDENTITY_FIELD_CONTRACT_v0_5_DRAFT.md:119`；`69_` §3 第 5 条 | 依赖 P2 批准；P2 未批则 C5 不能批准 | 否。C5 引用的原因码被排除在冻结外 |
| 关联：`OD-BLK-A-01`（Brand Trust 四态） | `RECORDED — PROPOSED_FOR_OWNER_APPROVAL — NOT_EFFECTIVE` | `62_/OD_BLK_A_01_BRAND_TRUST_STATE_MODEL.md` 表头；`69_` §1 C、§3 第 5 条 | Owner 批准 | 否。`72_` 明确「不批准 P2 / C5 / OD-BLK-A-01」 |

补充：BLK-A 的 A1 方向（`TRUSTED` 但校验缺失/无效 → `PENDING_BRAND / BRAND_TRUST_INVALID`）已写入 OD72 并被 B5 以「P2 排除」方式接纳；`B5 v0.8.1 §9` 第 5 项仍列「Brand 接口契约 B2 行按 A1 出新版」为待办，未见落地文件。

## 5. P-05、P-06、P-07、P-08、P-09b、P-19 盘点

关闭条件逐字取自 `32_ v1.3/B1_EXECUTION_PRECONDITIONS.md`（文件 SHA-256 `832bbb6a…1ed3`）。窗口指 `44_` 记录的准备窗口：2026-11-26 起，至 **2026-12-03 23:59 Asia/Taipei** 自动失效（`44_:17`）。

| 项 | 关闭条件（32_ v1.3 原文） | 当前状态 | 阻塞项 | 窗口内可起草 | 窗口内可关闭 |
|---|---|---|---|---|---|
| P-05 | 执行 worktree 绝对路径已指定，且 HEAD 等于目标基线 `5dcecd21a9bf3f7f7046cc8c769fcfbcd2adf1e5`；必须 checkout 完整 SHA，不得以分支名/tip 代替（`:29`） | `OPEN` | 1) `44_` §3 明确排除「创建/检出 execution worktree」；2) Owner 未指定路径；3) HEAD 校验必须实际检出后才成立 | 是（路径指定建议 + 校验程序草案，保持 `DRAFT`） | 否 |
| P-06 | 文件级 allowlist 已逐项列出并获 Owner/Reviewer 确认（`:30`） | `OPEN`；v1.3（`49_`）、v1.4（`50_`）均 `DRAFT — NOT_APPROVED`；OD-49-08「最终 allowlist 暂不批准」 | 1) F-01 Brand 输入源/可信定义未定（`45_` §3）；2) F-02 `pipeline.py` 字节快照锁定，CAND-02 `EXCLUDED`；3) CAND-09 `BLOCKED`（`50_`；OD-49-07）；4) P2/C5 未生效，CAND-03 只能按「B5 不含 P2」实现；5) allowlist 批准属 Owner 行为 | 是（可在 v1.4 基础上出 v1.5 草案） | 否 |
| P-07 | 允许运行的测试命令、测试文件、预期结果已明确（`:31`） | `OPEN` | 1) 依赖 P-06 allowlist 定稿；2) 具体命令需在 execution worktree 内执行（`44_` 排除）；3) 预期结果可先基于冻结 B5 v0.8.1 与 KEY-01 固定值（`pbk1_e71ca20e…0affaf`）编写 | 是（命令/预期表草案） | 否 |
| P-08 | 证据输出路径、命名、哈希方式已明确（`:32`） | `OPEN` | 1) 依赖 P-06/P-07；2) 证据路径位于 execution worktree（`44_` 排除创建）；3) 哈希方式可先行确定（SHA-256 清单，按 `SHA256SUMS` 式 `<sha>  <file>`） | 是（证据规范草案） | 否 |
| P-09b | 测试命令、预期结果与证据路径已批准；未闭合前整体不得 PASS（`:34`） | `OPEN` | 1) 需 P-07/P-08 草案先行；2) 批准属 Owner 行为；3) `44_` §1 规定交付物保持 `DRAFT / NOT_APPROVED` 直至另行批准 | 是（批准包草案） | 否（除 Owner 在窗口内实际批准） |
| P-19 | 执行前基线复核：worktree HEAD == `5dcecd21a9bf3f7f7046cc8c769fcfbcd2adf1e5`、远端分支关系、文件哈希；分支名/tip 不足以替代 SHA（`:44`） | `OPEN` | 1) 需 execution worktree 实际检出（`44_` 排除）；2) 目标 worktree 尚不存在，无法执行文件哈希比对；3) `44_` 允许对 `icpdf-extractor` 只读识别候选文件，但不等于执行前基线复核 | 是（只读校验清单/脚本草案） | 否 |

**表格说明**

1. `44_` §1 明文授权「起草/修订 P-05、P-06、P-07、P-08、P-09b、P-19；记录未决技术/Owner 事项；所有交付物保持 `DRAFT / NOT_APPROVED` 直至另行批准」，故六项起草均在窗口范围内。
2. 六项闭合均需 `44_` §3 排除的动作（创建/检出 worktree、运行测试）或 Owner 的批准行为（P-01 GRANT、P-06 allowlist、P-09b 批准），执行方在准备窗口内不能自行闭合。
3. P-02 / P-15 已按 `41_` 关闭；P-11 已按 `44_` 关闭（仅准备范围）。P-01 仍 `OPEN`，属 Owner 签署动作，不计入本六项，但它是从 `NOT_READY` 转 `AUTHORIZED` 的必要条件（`32_` §5）。
4. 基线 SHA `5dcecd21…` 由 OD-B1-N4-01 指定（`32_:18-19`），P-05 / P-19 均引用同一 SHA，二者须同时闭合。

## 6. 窗口可行性结论

- 六项在 2026-12-03 23:59（Asia/Taipei）前均「可起草」，不可「可关闭」。可交付物为六份保持 `DRAFT / NOT_APPROVED` 的草案。
- 窗口到期未续时，按 `44_` §1 自动失效；延期须新 Owner Decision，且新窗口不得自动视为执行授权（`44_` §2）。
- 若要在窗口内取得实质闭合，最小前置次序为：Owner 指定 P-05 路径与基线 → P-06 allowlist 批准（含 F-01/F-02/CAND-09 决定）→ P-07/P-08 草案 → P-09b 批准 → P-19 在授权检出后执行。该次序本身即依赖窗口外动作。

## 7. 观察与风险（只报不修）

1. `69_`（已登记、`NOT_EFFECTIVE`）C 项「B5 不冻结」与 `f469e1d`（未登记、对话转录）「B5 FROZEN（不含 P2）」并存；优先级与效力需 Owner/Reviewer 裁定。
2. OD72 与 B5 冻结记录均为 `RECORDED_FROM_CONVERSATION`、`NOT_REGISTERED`、无 `DECISION_ID`；BLK-B/C/D 的「已裁定」在证据层是转录，不是登记生效。
3. R-2/R-3 的解除条件只认 `K1 key semantics` Owner 明确批准；OD72/B5 均未触及，故不因 B5 冻结而解除。
4. B5 v0.8.1 文件名与正文仍写 `DRAFT — NOT_FROZEN`；冻结以 `f469e1d` 记录为准，读取时不得据文件自述否认冻结，也不得据冻结记录改写文件字节。
5. `47_`、`51_`、`52_` 原文件未标 `SUPERSEDED`/历史；历史化仅在新文档内声明。
6. `71_/log.txt` 为仓库内未跟踪文件，非本盘点创建，未纳入版本管理。
7. `79_/OWNER_RECONFIRMATION_D01_D09_20261127.md`（提交 `22a09c0`）涉及 D-01/D-09，不改变本盘点范围（BLK-B/C/D 与六项 P）的状态。

## 8. 引用清单与哈希（本次只读复算）

| 文件 | SHA-256 | 字节 |
|---|---|---|
| `61_/BLK_A_D_OWNER_DECISION_BRIEF.md` | `f869f1ceb45d79bbc4fbe5c0b50a6ef26aa9b2870220e314d022a37f99f52a4b` | 5,408 |
| `69_/OD_BLK_A_R2_ACCEPT_01.md` | `a13991418f3512ec61adb5c15053b3e70d4f2c2953b2ca58c3013dd8d4252ac4` | 4,479 |
| `68_/BLK_A_BLOCK_RECORD_TYPE_PROPOSAL.md` | `5fa358d4aa2b22122b689e158c8b24ccf2db8fea151513f605e3460441a36efa` | 5,184 |
| `32_ v1.3/B1_EXECUTION_PRECONDITIONS.md` | `832bbb6ae1174e4e81dd5bc6e0b8549e1c344f217d6f28399af6a23dda301ed3` | 5,878 |
| `41_/P02_P15_CLOSURE_RECORD.md` | `afaeb5fb7a7b6fecff7acc17222c9f8a08e7f62cb81ed7879986a9bc2c32f545` | 6,988 |
| `43_/OWNER_DECISION_PREPARATION_SCOPE_ACCEPTANCE.md` | `93f676a8d6e108f0580f4b00347cfc5693a12243845e253e6d9bf30a946319f5` | 3,455 |
| `44_/P11_CONTROLLED_AUTHORIZATION_RECORD.md` | `0857aac85fae40205eed6c320de73b5d457851aac3e8dff16c4be2af52a90483` | 3,595 |
| `45_/P06_CANDIDATE_TECHNICAL_REVIEW.md` | `4a3db254334f7c461fc8248860ca0dd4d805cc30c212ed8824f765528321c802` | 10,569 |
| `49_/P06_ALLOWLIST_REVISION_v1_3_DRAFT.md` | `bc990f2f154b14a7a3d9cd2ca4d12990945a1fc33a6ccddcf95d09c8a03cbb01` | 5,208 |
| `50_/P06_ALLOWLIST_REVISION_v1_4_DRAFT.md` | `5dd365edbca7dac23aa03c07b0ac63a8a8893c6b9c53cbc7a4057f11320547f3` | 4,104 |
| `66_/BLK_A_STATE_TRANSITION_AUDIT_SPEC.md` | `891006a1835e59630b8cfbfacf1039dc45d97e47150aef8d08cd8ecdf853b7fc` | 27,773 |
| `72_/OWNER_DECISIONS_F04_BLK_A_D_20261127.md` | `73397e717f4c96e35ec82d357756e6dccafa580de8069c5d91be93f2288cbd14` | 4,996 |
| 复核仓 `7ad5941:B5_MINIMAL_NORMALIZATION_RULES_v0_8_1_DRAFT.md` | `e4f737aa92d59e69fb5abf7c6dbd330788a2745c00365409fb1bebd443845006` | 4,707 |
| 复核仓 `7ad5941:T8_VECTORS_AND_DISPOSITION_v0_8_1_DRAFT.md` | `a58b71f2d884a71c6756d6c60f7435b4173b4117eefa85cfffc30f8c80fb751f` | 2,589 |
| 复核仓 `f469e1d:B5_FREEZE_RECORD_20261127.md` | `708bf95142af7cce3716d39d4b24ac0a0d54a25e657b7f242c1b698e97c5b06e` | 3,449 |

前两项复核仓文件的 SHA-256 与冻结记录自述值（`e4f737aa…`、`a58b71f2…`）一致。

## 9. 声明

1. 本文件为只读盘点，不修改任何既有文件，不改变任何状态，不登记、不生成 `DECISION_ID`、不构成批准或授权。
2. 本文状态按来源原文引用；`61_` / `69_` 为 2026-11-26 快照，`72_` / `f469e1d` 为 2026-11-27 转录记录，冲突并列呈现。
3. 未创建/检出 worktree，未运行测试，未 commit / push / merge / deploy。
4. 后续任何闭合动作（登记、批准、冻结、B-1 授权）均须 Owner 单独授权，并经独立 Reviewer 复核。
