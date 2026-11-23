# P0-2 五项复验 · 干净基线复跑（2026-11-23）

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-P02-RERUN-20261123 |
| 基线 | Ds Bit `feat/gate6a-audit` / `600439a5eee69fb3a1cec2715e37080e48ca9840` |
| 环境 | 独立 detached worktree `E:\workspace\.scratch\dsbit-clean-600439a5`（工作区 0 变更） |
| 方法 | 只读代码审查 + 两次真实解析 + 同一 PDF 重解析 + 83 项定向测试 + 静态/B2B/后端检索 |
| 结论 | **1 PASS（仅解析/证据） / 4 FAIL；P0-2 仍 BLOCKED** |

## 1. PM 最终裁定（本复跑采用）

- Ds Bit 权威分支：`feat/gate6a-audit`；
- 权威基线 Commit：`600439a5eee69fb3a1cec2715e37080e48ca9840`；
- 本地 20 项未提交工作树：**全部排除**，已由 stash `stash@{0}`（commit `3a7364b09299b8c7a3f83137bb6fbb17a2019748`）保存；
- 本轮不执行 stash apply/pop/drop，不修改 Ds Bit 代码，不提交 Ds Bit 变更。

基线核验（`00_baseline.txt`）：

```text
branch: HEAD (detached)
HEAD:   600439a5eee69fb3a1cec2715e37080e48ca9840
status: 0 modified/untracked
origin/feat/gate6a-audit: 600439a5eee69fb3a1cec2715e37080e48ca9840
stash@{0}: 3a7364b09299b8c7a3f83137bb6fbb17a2019748
```

## 2. 复跑命令与产物

| 检查 | 命令/方法 | 证据文件 |
|---|---|---|
| 基线 | `git rev-parse HEAD`、`git status`、`git stash list` | `00_baseline.txt` |
| 运行时身份 | `parse_pdf` 解析两个不同合成 PDF（同一 `requested_mpn=SAME-MPN`）；同一 PDF 解析两次 | `01_runtime_parse.txt`、`evidence/sample_parse_summary.json`、`evidence/id_stability_reparse.json`、`evidence/runs/` |
| 解析/证据测试 | `python -m pytest tests/unit/test_domain_contract.py tests/unit/test_evidence_validation.py tests/integration/test_phase1_pdf.py -o addopts="" -v --tb=short` | `02_targeted_pytest.log`、`02_targeted_pytest_exit.txt` |
| 静态/B2B/后端 | `git ls-tree`、`grep`、`pyproject.toml`、Parser Lab 路由、lake DDL、tests 检索 | `03_static_and_b2b.txt` |

环境：Python 3.13.15；pytest 9.2.0；pydantic 2.14.1；PyMuPDF（`fitz` 2.0）。合成 PDF 由 `tests/fixtures/synthetic.py` 生成，不含真实厂商资料。

## 3. 结果摘要

| # | 检查 | 结论 | 关键证据 |
|---|---|---|---|
| 1 | 产品身份 | **FAIL** | 同一 MPN 两个 PDF → `doc-07343bfb293d`/`prod-doc-07343bfb293d` 与 `doc-9dbee7d58f7b`/`prod-doc-9dbee7d58f7b`；`src` 无 brand/supplier/pbk1；`Product` 无品牌字段 |
| 2 | 全局 ID | **FAIL** | 无产品主表/注册表；lake 仅 `raw_docs`/`parse_runs`/`eval_results`；同 PDF 重解析 doc/product 稳定、run 变化；同 MPN 跨 PDF 分裂 |
| 3 | 解析输出/证据 | **PASS（仅解析范围）** | 83/83 passed，exit 0；样本 A 1 表/16 候选，B 2 表/24 候选；表/候选含页码、bbox、table/row/cell 标识 |
| 4 | 静态 B2B 桩 | **FAIL（B2B 能力）** | 权威基线无 b2b/business_api/openapi 跟踪文件；无 `workbench/b2b`；Parser Lab 仅 health/parse/process/page，`database_written: False` |
| 5 | 后端实现 | **FAIL** | 依赖仅 pymupdf/pydantic/typer/rich/dotenv/pillow/pyyaml；`src` 无 FastAPI/Flask/APIRouter/sqlalchemy/psycopg/mysql/oauth；tests 无 Business API/B2B/OAuth；75 项 0/75 |

## 4. 与既有复验报告的关系

- 本次复跑独立于 `docs/sessionb-p0-2-independent-reverification` 分支上的 01–05 报告，结论一致；
- 既有报告的方法与 file:line 证据仍有效；本目录只补充同一权威基线上的干净环境复跑记录；
- 83 项测试为执行 Agent 证据，**不是** Reviewer 亲自复跑证据；
- 本复跑不修改 Ds Bit 代码、不关闭 P0-2、不提交实施准入。

## 5. 非声明

- 不声明 P0-2 CLOSED、Contract FROZEN、Business API IMPLEMENTATION AUTHORIZED 或 PRODUCTION READY；
- 不声明产品身份/全局 ID 已完成；
- 不声明 75 项已获正式授权（仍 0/75）。