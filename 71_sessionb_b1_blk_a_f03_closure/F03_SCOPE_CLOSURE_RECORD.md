# F-03 审查关闭记录（限定范围）

| 项 | 值 |
|---|---|
| 审查项 | F-03（修订前历史原件缺失） |
| 最终状态 | `CLOSED_WITH_SCOPE_LIMITATION` |
| 保留结论 | `NOT_FOUND_WITHIN_DEFINED_SCOPE` |
| 关闭依据 | Owner 2026-11-27 明示批准按限定范围关闭；此前 Reviewer 对 F-03 扫描结果及关闭依据的复核结论为 `PASS_WITH_FINDINGS`（指此前审核，不表示本次新建关闭记录已通过独立复核） |
| 总体审核 | `BLOCKED`（F-02、F-04 未关闭） |
| 登记状态 | 未登记（`NOT_REGISTERED`） |
| 效力状态 | 未生效（`NOT_EFFECTIVE`） |
| 文件性质 | 审查记录；非决策登记、非 OD、不改变任何裁定 |
| 记录时间 | 2026-11-27 |
| 冻结关系 | 未改动 63_–70_、正式 OD、ballot 及两份 DERIVED 快照 |

## 1. 扫描范围（F03-F1 至 F03-F4）

| 编号 | 路径 | 文件数 | Office 文件 | 命中文件 |
|---|---|---|---|---|
| F03-F1 | `E:\workspace\.scratch\morrishk-owner-decision` | 692 | 33 | 8 |
| F03-F2 | `E:\workspace\独立站\morrishk-site-upgrade-review` | 423 | 36 | 0 |
| F03-F3 | `E:\workspace\独立站\morrishk-site-upgrade-review-wt-r43` | 496 | 3 | 0 |
| F03-F4 | `E:\workspace\独立站\morrishk-site-upgrade-review-wt-session-a` | 467 | 3 | 0 |
| 合计 | 四目录 | 2,078 | 75 | 8 |

以上为内容级扫描（全文件读取，无大小上限）。四目录内无归档、无 PDF、无旧版 `.doc`、无符号链接；`.git` 目录不重复计算，沿用既有共享对象库检查结果。

## 2. 检索特征

共 14 项：旧 §0.1 特征行 `§0 第 1、4 条`；修订前 v2.3 SHA-256 `93e7ee2bf23c08e825aaabf4076db6e4fe96b19f966e4520fc739278bb5430ce`；修订前正式 OD SHA-256 `2915fa81b101680039e5c2b6bab5c907b06427483a321056d8b0ee7ffe14df56`；旧版草稿名 `OD-DRAFT-D01-v2.1/-v2.2/-v2.3` 与文件名 `OD_DRAFT_D01_v2.1/_v2.2/_v2.3`；正式 OD 标识 `OD-BLK-A-B1-D01-ENUM-01`、`OD_BLK_A_B1_D01_ENUM_01`、`OD_BLK_A_B1_D01_ENUM`；标题 `OD 草案｜D-01`；卡标识 `BLK-A-B1-D-01`。

每项按 UTF-8、UTF-16LE、UTF-16BE、GBK 四种编码各检索一遍，并匹配相对路径名。

## 3. 扫描结果与命中归因

扫描合计 2,078 个文件、66,832,223 字节；读取错误 0；退出码 0。F03-F2 至 F03-F4 共 1,386 个文件 0 命中。

F03-F1 命中 8 个文件，全部为已知 D-01 材料本体或 DERIVED 说明：

| # | 相对路径 | 命中特征 | 大小 | SHA-256 | 归因 |
|---|---|---|---|---|---|
| 1 | `70_sessionb_b1_blk_a_d01_enum_od/OD_BLK_A_B1_D01_ENUM_01.md` | 卡标识、版本名族、OD 标识 | 10,016 B | `b7ad0fec7539a33f5930e66a67a3882d8a07c633eeaa5699533ce2b94a0fee74` | 当前正式 OD |
| 2 | `70_sessionb_b1_blk_a_d01_enum_od/pre_correction_DERIVED/OD_BLK_A_B1_D01_ENUM_01_DERIVED_pre_correction.md` | 同上 + 修订前 v2.3 哈希（`:115` 回退行） | 10,016 B | `2915fa81b101680039e5c2b6bab5c907b06427483a321056d8b0ee7ffe14df56` | DERIVED 派生快照（非原件） |
| 3 | `70_sessionb_b1_blk_a_d01_enum_od/pre_correction_DERIVED/README.md` | 修订前正式 OD 哈希、文件标识 | 822 B | `2d85b50d11afa98df82895384bb75fc36ab349ee26894e6e47108bb01656970b` | DERIVED 说明 |
| 4 | `batch1_od_drafts/OD_DRAFT_D01_v2.1.md` | 草稿名 v2.1、标题 | 6,172 B | `d197de4f16f4b4380bf71b8e0d90c6b5cf6c447d53c6591e8aafe735ca83c269` | 同期原始文件（冻结） |
| 5 | `batch1_od_drafts/OD_DRAFT_D01_v2.2.md` | 草稿名 v2.1/v2.2、标题 | 6,379 B | `330373175f697481240cbd0efd527617555dcb81143bc20575c57262741124fc` | 同期原始文件（冻结，内容基线） |
| 6 | `batch1_od_drafts/OD_DRAFT_D01_v2.3.md` | 卡标识、草稿名 v2.2/v2.3、OD 标识、标题 | 8,160 B | `01f34bc0fc58d64d38474302465de49d160c62e04c6d4194cdc57e333a791e82` | 当前草案（更正版） |
| 7 | `batch1_od_drafts/pre_correction_DERIVED/OD_DRAFT_D01_v2.3_DERIVED_pre_correction.md` | 旧 §0.1 行（`:29`）、标题、卡标识、OD 标识 | 8,014 B | `93e7ee2bf23c08e825aaabf4076db6e4fe96b19f966e4520fc739278bb5430ce` | DERIVED 派生快照（非原件） |
| 8 | `batch1_od_drafts/pre_correction_DERIVED/README.md` | 修订前 v2.3 哈希、文件标识 | 880 B | `0bd8b2afc35e731963445fe9b9db79edbfaf577f9ba3ad00f4051736d2f37dbc` | DERIVED 说明 |

归因汇总：同期原始文件 2（v2.1、v2.2）；当前正式/草案 2（正式 OD、v2.3）；DERIVED 派生快照与说明 4；执行方日志 0；无法判定来源的副本 0。

关键事实：

1. v2.1、v2.2 是较早版本原始文件，不是修订前 v2.3 或修订前正式 OD 的原件副本，也不归类为 DERIVED。
2. 旧 §0.1 特征行仅出现在 DERIVED v2.3 第 29 行；v2.1、v2.2、当前 v2.3 均无该旧行。
3. 正式 OD 第 115 行只含更正后 v2.3 哈希 `01f34bc0…`，未残留修订前哈希。
4. 未发现任何独立的修订前 v2.3 或修订前正式 OD 原件副本。

## 4. Office ZIP 成员级核查

补充核查背景：上一轮脚本对 ZIP 内层成员读取异常使用 `except: pass`，导致 `ERRORS=0` 不能单独证明成员读取完整。Reviewer 指出后，补做仅限 Office 文件的成员级核查：

| 编号 | Office 文件 | ZIP 条目 | 读取成功 | 读取失败 | `testzip()` 异常 | 命中 |
|---|---|---|---|---|---|---|
| F03-F1 | 33 | 451 | 451 | 0 | 0 | 0 |
| F03-F2 | 36 | 513 | 513 | 0 | 0 | 0 |
| F03-F3 | 3 | 37 | 37 | 0 | 0 | 0 |
| F03-F4 | 3 | 37 | 37 | 0 | 0 | 0 |
| 合计 | 75 | 1,038 | 1,038 | 0 | 0 | 0 |

术语口径：统计单位为 `infolist()` 返回的 ZIP 条目（含目录条目），表述为“1,038 个 ZIP 条目读取成功”，不表述为“1,038 个 Office 正文文件读取成功”。

数量对账：实测 75 个 Office 文件（F1 33 + F2 36 + F3 3 + F4 3）。Reviewer 本轮曾提及 66，与实测及两轮回执不符，以 75 为准，差异保留。

## 5. 既有共享 Git 对象库检查结果（沿用，不重算）

此前已对 3 个主对象库与 7 个 dsbit 仓库约 17.6k 对象做过全对象检查，含全部 unreachable 对象（67 blob、10 commit、8 tag、12 tree）。该检查命中 6 处，全部可归因于已知治理文件或已知材料，0 处来源不明。本轮 F03-F1 至 F03-F4 的 `.git` 目录未重新计算，结论沿用上述结果。

统计口径说明：

1. 17.6k 的统计单位为 Git 对象（object），按 3 个主对象库与 7 个 dsbit 对象库逐一累计；不是工作树文件数，也不是打包文件条目数。
2. 该数字与此前审核材料记载的 `2,801` 个 in-pack 对象（其中 blob 1,835、unreachable blob 67）不是同一口径：后者为单一主对象库的 in-pack 统计，前者为多个对象库的累计总量。两者不合并、不互相替代，也不互相推算。
3. 括号内 `67 blob、10 commit、8 tag、12 tree` 是上述多库范围内 unreachable 对象的分类计数，不是 17.6k 全部对象的分类；本轮未复核其与单一主库 `67` 个 unreachable blob 是否为同一集合。
4. 以上对象统计数字均来自此前回执，标注为历史回执数据；本轮未重新运行对象统计，统计口径未独立复核。本次修订仅补充口径说明，不新增、不修改任何扫描结果。

## 6. 范围边界声明

1. 本结论仅覆盖 F03-F1 至 F03-F4 四个目录，以及第 5 节所述既有共享 Git 对象库检查范围。
2. 本结论不代表整个 `E:\workspace`、全部历史介质或其他项目目录中不存在原件。
3. 以下位置不在本次范围内：`E:\workspace\_review_worktrees\p0-2-a5-evidence` 等其他注册工作树、`E:\workspace\.scratch\baseline.tar`、`E:\workspace\独立站` 下其他归档，以及 VeloCrest、fashionClothes 等无关项目（后者标记为 `EXCLUDED — UNRELATED PROJECT; OUT OF F-03 SCOPE`）。
4. 图片仅按原始字节检索，未做 OCR；四目录内无 PDF、无旧版 `.doc`、无归档，故无文本层或解包缺口。

## 7. 保留属性

1. 两份修订前字节等价物仍为 `DERIVED` 派生快照：`93e7ee2b…30ce`（v2.3）与 `2915fa81…df56`（正式 OD）。其属性不升级、不改写、不删除。
2. 正式 OD 维持 `RECORDED / NOT_REGISTERED / NOT_EFFECTIVE`；内容未改动。
3. ballot 维持空白模板原状，不补填。
4. D-01 维持 `OWNER_CONFIRMED / DEFERRED`；F-02 维持 `OPEN / HIGH`；F-04 维持 `PENDING_EXACT_TEXT_RECONCILIATION`；`DECISION_ID = NOT_GENERATED`；实施 `NOT_AUTHORIZED`；总体审核 `BLOCKED`。

## 8. 变更记录

| 项 | 值 |
|---|---|
| 本次新增 | 仅本文件 |
| 修改既有文件 | 无 |
| Git 操作 | 无 commit、无 push |
| 远端分支 | 保持 `a94fa34a537529ab7d556a9c543518b6a271bf81` |
| 与 63_–70_ 关系 | 未触碰 |
