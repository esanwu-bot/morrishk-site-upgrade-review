# P0-2 A.5 Evidence Handoff（审核材料）

| 项 | 值 |
|---|---|
| 材料编号 | MRH-P02-A5-EVIDENCE-20261125 |
| 递交日期 | 2026-11-25（Asia/Shanghai） |
| 来源仓库 | `E:\workspace\icpdf-extractor`（remote `https://codeup.aliyun.com/5f0af04d5fd102f22f6b747c/icpdf-extractor.git`） |
| 源分支 | `docs/p0-2-dc-decision-20261125` |
| 源提交 | `dfcc6bd3dc3a515460b8e7fec1673356de34b4e7` |
| 源提交 Parent | `381c1c69139c0d29b877b1834cf30d1f7983cb82` |
| 源提交变更文件 | 4 个（父 `SHA256SUMS`、`closure_pack_01/SHA256SUMS`、2 个 A.5 证据文件） |
| 目标仓库 | `morrishk-site-upgrade-review`（`https://github.com/esanwu-bot/morrishk-site-upgrade-review.git`） |
| 目标分支 | `review/p0-2-a5-evidence-20261125` |
| 分支基线 | `origin/main` = `22259b6e7ae06ce3920bbdbd353dd7e6482bf716` |
| 性质 | **证据移交**；不代表 Reviewer 接受，不改变任何状态 |

---

## 1. 材料区分

| 类别 | 位置 | 说明 |
|---|---|---|
| 源仓库原始证据 | 源仓库 `reviewer/p0_2_dc_decision_20261125/` @ `dfcc6bd` | 未修改 |
| 审核仓库副本 | 本目录 `source/` | 与源文件**逐字节一致**（含换行/BOM/编码） |
| 审核仓库新增说明 | 本文件 `README_REVIEW_HANDOFF.md` | 仅用于说明来源与校验方式 |

`source/` 保留了源目录的相对结构，因此源 `SHA256SUMS` 可直接在副本内复算。

> 说明：为保证父级清单 9/9 可在本仓库独立复算，`source/` 复制了源目录的完整决策包（9 个顶层文档 + `closure_pack_01/` 11 个文件）；Reviewer 请求的 5 个文件均已包含。

---

## 2. Reviewer 请求的 5 个文件（SHA-256）

| 文件（`source/` 内相对路径） | SHA-256 |
|---|---|
| `closure_pack_01/a5_rollback_supplement.sql` | `917a6a553444f8d0a983c7c45b3b012fe8adb60a563dd8a7cae89d8536bfbe99` |
| `closure_pack_01/a5_rollback_supplement_output.txt` | `d0ddc722206197ddd7e0b6791798891d71264399eeb87ed43c45ee7275eec774` |
| `closure_pack_01/DC-03_A5_ROLLBACK_SUPPLEMENT_RESULTS.md` | `2d313b370760d7222f75372208f76ccf188c71dc6569e97acfa09926af5f0c00` |
| `closure_pack_01/SHA256SUMS` | `ea1c03895eacb48326a466408d298b1947ab6b945fc5fd17874619888df6ab93` |
| `SHA256SUMS`（父级） | `e69843627cca7f404177132df4a042a6881b80db42ea649a41cd8a7b997036f5` |

## 3. 校验结果（在 `source/` 内复算）

| 检查 | 结果 |
|---|---|
| 源→副本逐文件字节一致 | **21/21 identical，0 bad** |
| 父级清单 | **9/9 OK，0 BAD** |
| 子级清单（`closure_pack_01`） | **11/11 OK，0 BAD** |

复算命令（在 `source/` 目录）：

```powershell
Get-Content SHA256SUMS | ForEach-Object {
  if ($_ -match '^([0-9a-f]{64})\s+(.+)$') {
    $h=$matches[1]; $f=$matches[2].Trim()
    if ((Get-FileHash -LiteralPath $f -Algorithm SHA256).Hash.ToLower() -ne $h) { "MISMATCH $f" }
  }
}
# 子级：在 source\closure_pack_01 下执行同样命令
```

## 4. A.5 证据要点（供 Reviewer 独立核验）

- 隔离实例：MySQL Community Server **8.4.13**，`127.0.0.1:3317`，独立 datadir，专用库 `p02_a5_rollback_test`；测试后已关闭。
- 三阶段：事务前 `0` → 事务内插入后 `1` → `ROLLBACK` 后 `0`。
- 原始 SQL 文件头保留 `NOT EXECUTED`（准备物标记）；**实际执行事实以 `a5_rollback_supplement_output.txt` 与结果报告为准**。
- 输出由 PowerShell 以 CRLF 捕获后规范化为 LF（内容与 BOM 不变）；结果报告 §6 已注明，未称其为"未经处理的原始字节副本"。

## 5. 状态约束（本材料不改变）

- `A5_TRANSACTION_ROLLBACK_SUPPLEMENT = PASS_PENDING_REVIEW`
- `D1_ISOLATED_TEST_SUITE = PARTIAL_PENDING_REVIEW`
- `D1_PRODUCTION_VALIDATION = NOT_TESTED`
- `Contract Freeze = NOT_READY`
- `Implementation Authorization = NOT_GRANTED`
- `DCP Batch 2 = NOT_STARTED`

A.5 最终 PASS 须由独立 Reviewer 在取得并核验本材料后提出。
