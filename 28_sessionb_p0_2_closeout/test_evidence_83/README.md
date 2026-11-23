# 83 项测试证据包（执行 Agent 实跑）

- 基线：`feat/gate6a-audit` / `600439a5eee69fb3a1cec2715e37080e48ca9840`
- 执行主体：**Session B 执行 Agent**，不是 Reviewer 独立复跑
- 结果：`83 passed in 8.22s`，exit `0`
- 性质：补充证据；不改变 P0-2 BLOCKED 结论

## 1. 11 项要求与证据映射

| # | 要求 | 证据 |
|---|---|---|
| 1 | 实际测试命令 | `00_environment.txt`；`05_scope_and_fixtures.md` §1 |
| 2 | 运行时 Ds Bit 分支/SHA | `00_environment.txt`（`feat/gate6a-audit` / `600439a5…840`） |
| 3 | Python 版本 | `00_environment.txt`（Python 3.13.15） |
| 4 | pytest 版本 | `00_environment.txt`（pytest 9.2.0） |
| 5 | 测试范围/文件清单 | `00_environment.txt`；`05_scope_and_fixtures.md` §1；`06_test_file_hashes.txt` |
| 6 | 完整摘要 passed/failed/skipped/errors/deselected | `04_summary.txt`；`01_pytest_full.log` 末尾 `83 passed in 8.22s` |
| 7 | 进程退出码 | `02_exit_code.txt`（`0`） |
| 8 | 原始终端输出/完整日志 | `01_pytest_full.log`（`-v` 完整用例列表） |
| 9 | 执行时间 | `00_environment.txt`（start）、`03_after.txt`（end）、`04_summary.txt`（duration） |
| 10 | Mock/Fixture/真实 PDF | `05_scope_and_fixtures.md` §2（synthetic PDF + tmp_path；无外部网络/DB；一处环境变量 mock） |
| 11 | 真实 PDF 标识与哈希 | **不适用**：83 项测试使用 `tests/fixtures/synthetic.py` 合成 PDF，未使用真实厂商 PDF；测试/fixture 文件哈希见 `06_test_file_hashes.txt` |

## 2. 命令

```bash
cd E:/workspace/icpdf-extractor
python -m pytest \
  tests/unit/test_domain_contract.py \
  tests/unit/test_evidence_validation.py \
  tests/integration/test_phase1_pdf.py \
  -o addopts="" -v --tb=short
```

## 3. 摘要

```text
83 passed in 8.22s
exit code: 0
failed: 0
skipped: 0
errors: 0
deselected: 0
```

## 4. 执行主体与历史日志

- 本轮重跑：执行 Agent 在干净基线 `600439a5` 实跑，日志 `01_pytest_full.log`。
- 历史日志：`../../reverification/evidence/02_targeted_pytest.txt`（此前 `-q` 进度点 + 83 计数；无完整摘要）。
- **两份都是执行 Agent 实跑**；不得表述为 Reviewer 亲自复跑。Reviewer 的复核对象是提交、报告、日志和哈希清单。

## 5. 环境与状态

- 运行前后 `git status --short`：空。
- HEAD：`600439a5…840`；分支 `feat/gate6a-audit`。
- stash：`stash@{0}: On backup/full-local-20261114: P0-2 exclude 20 worktree items 2026-11-23`（未 apply/pop/drop）。
- 未修改 Ds Bit 源码；测试仅使用临时目录/合成 PDF。

## 6. 文件

| 文件 | 内容 |
|---|---|
| `00_environment.txt` | 分支/SHA/状态/Python/pytest/命令/测试文件 |
| `01_pytest_full.log` | 完整 `-v` 输出 |
| `02_exit_code.txt` | 退出码 |
| `03_after.txt` | 结束后状态/stash/HEAD/时间 |
| `04_summary.txt` | 机器可读摘要 |
| `05_scope_and_fixtures.md` | 范围/fixture/主体/历史日志区别 |
| `06_test_file_hashes.txt` | 测试与 fixture 文件 SHA-256 |
| `README.md` | 本文件 |