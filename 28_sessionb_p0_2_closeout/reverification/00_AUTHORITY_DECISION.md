# P0-2 权威基线决策与干净环境记录

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-P02-REVERIFY-000 |
| 版本 | v1.0 |
| 日期 | 2026-11-23 |
| 性质 | 记录项目负责人书面决策 + 执行环境；不是 P0-2 关闭或验收结论 |
| 报告基线 | Ds Bit 复验报告基于客户包/评审仓提交 `4d8adb5a89252fbd8964c62fe1efe1b334cc2654` 建立独立分支 |
| 结论 | 权威基线已确认、原 20 项已隔离、工作区干净；五项复验结果见 `06_P0_2_FINAL_ASSESSMENT.md` |

## 1. 项目负责人书面决策（转录）

本轮执行指令明确写明“项目负责人书面决策（本指令具有执行效力）”：

| 项目 | 确定值 |
|---|---|
| Ds Bit 权威仓库 | `E:\workspace\icpdf-extractor` |
| 权威分支 | `feat/gate6a-audit` |
| 权威 Commit SHA | `600439a5eee69fb3a1cec2715e37080e48ca9840` |
| 灾备分支 | `backup/full-local-20261114` |
| 本地未提交工作树 | 全部排除 |
| 工作树处理方式 | 临时 stash（包括未跟踪文件）或移出工作区 |
| 是否纳入本次权威基线 | 否 |

> 本文件只转录项目负责人在本轮执行指令中的指定；仓库内没有单独的签署文件。若后续需要合同级证据，应将负责人的原始指令/签署件单独归档并计算哈希。

## 2. 仓库与远端核对

实测（2026-11-23，见 `evidence/00_pre_stash_refs.txt`）：

| 对象 | 实测值 | 与指定 SHA 一致 |
|---|---|---|
| 仓库绝对路径 | `E:/workspace/icpdf-extractor` | — |
| `origin` | `https://codeup.aliyun.com/5f0af04d5fd102f22f6b747c/icpdf-extractor.git` | — |
| 本地 `feat/gate6a-audit` | `600439a5eee69fb3a1cec2715e37080e48ca9840` | 是 |
| `origin/feat/gate6a-audit` | `600439a5eee69fb3a1cec2715e37080e48ca9840`（`git ls-remote`） | 是 |
| `backup/full-local-20261114` | `600439a5eee69fb3a1cec2715e37080e48ca9840` | 是 |
| 指定 SHA | `600439a5eee69fb3a1cec2715e37080e48ca9840` | — |

远端分支存在且 SHA 一致；未修改远端、未重写历史。

## 3. 原 20 项未提交内容的隔离

### 3.1 隔离前状态

`git status --short` 共 **20** 项（完整见 `evidence/00_pre_stash_status.txt`、`00_pre_stash_hashes.txt`）：

| 类别 | 数量 | 说明 |
|---|---:|---|
| 已暂存新增（A） | 14 | `.dockerignore`、`deploy/dsb/` 9 文件、`workbench/_g0/` 3 文件、`workbench/b2b/qa_console.html` |
| 已暂存修改（M） | 3 | `.gitignore`、`workbench/index.html`、`workbench/serve_parser.py` |
| 未暂存修改 | 0 | — |
| 未跟踪（??） | 3 项（2 目录 + 1 文件） | `deploy/dsb/evidence/`、`docs/g0_evidence/`、`workbench/b2b/serve_b2b.py` |

隔离前对 33 个实际文件（含未跟踪目录内文件）逐文件计算 SHA-256，保存于 `evidence/00_pre_stash_hashes.txt`。

### 3.2 stash 结果

- 命令：`git stash push -u -m "P0-2 exclude 20 worktree items 2026-11-23"`
- 结果：成功；工作区随即干净。
- stash 列表：`stash@{0}: On backup/full-local-20261114: P0-2 exclude 20 worktree items 2026-11-23`
- stash commit：`3a7364b09299b8c7a3f83137bb6fbb17a2019748`
- stash 内容验证：`git stash show --include-untracked --name-only` 与 `stash@{0}^3` 均包含上述 20 项路径/33 个文件（见 `evidence/00_stash_verification.txt`）。
- **未执行** `git reset --hard`、`git clean`、`git stash drop`、`git stash apply/pop`；原内容保持可恢复。

### 3.3 恢复方式（本轮未执行）

原内容保留在 stash commit `3a7364b09299b8c7a3f83137bb6fbb17a2019748`。后续如需恢复，应在获得明确授权后使用可回滚方式（例如 `git stash apply 3a7364b…`），并重新核对 33 个文件哈希；本轮不恢复、不合并、不提交。

## 4. 干净权威基线

切换并核验（见 `evidence/01_clean_baseline.txt`）：

```text
分支：feat/gate6a-audit
HEAD：600439a5eee69fb3a1cec2715e37080e48ca9840
feat/gate6a-audit：600439a5eee69fb3a1cec2715e37080e48ca9840
origin/feat/gate6a-audit：600439a5eee69fb3a1cec2715e37080e48ca9840
工作区：CLEAN
```

- 未 cherry-pick、未 rebase、未 amend、未 reset 到其他提交。
- 未修改 Ds Bit 权威代码；本轮所有测试/解析均在临时目录运行，最终 `git status --short` 仍为空（见 `evidence/09_final_clean_status.txt`）。
- stash 仍在，未被应用或删除。

## 5. 本轮边界

- 只读复验五项；未修改权威代码、未提交 Ds Bit 代码、未修改分支/远端。
- 未开始 Business API 正式实现；未执行真实 OAuth、生产 DB 或第三方生产接入。
- 未执行 Contract Freeze、生产部署或灰度。
- 本文件不宣布 P0-2 关闭；最终判定见 `06_P0_2_FINAL_ASSESSMENT.md`，关闭由 Reviewer 独立决定。