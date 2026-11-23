# 83 项测试：范围、Fixture 与执行主体

| 项 | 内容 |
|---|---|
| 基线 | `feat/gate6a-audit` / `600439a5eee69fb3a1cec2715e37080e48ca9840` |
| 执行主体 | **Session B 执行 Agent**（不是 Reviewer 独立复跑） |
| 执行时间 | 2026-11-23 15:19:05 → 15:19:16 +08:00；pytest 自报 8.22s |
| 退出码 | `0` |
| 结果 | `83 passed in 8.22s`；failed 0 / skipped 0 / errors 0 / deselected 0 |

## 1. 测试范围

```text
tests/unit/test_domain_contract.py
tests/unit/test_evidence_validation.py
tests/integration/test_phase1_pdf.py
```

覆盖：

- Domain 契约：Document/Product/Evidence/Table/Candidate 等模型不变式；
- Evidence 校验：证据字段、ID/边界约束；
- Phase 1 PDF 集成：加载、几何/坐标、渲染、表格/候选、失败/异常、多页、旋转、secret redaction。

**不覆盖**：Business API、B2B、OAuth2、数据库、75 矩阵、Repository、Yii2 Client。83 项通过不能表述为 Business API 验收。

## 2. Fixture / Mock / 真实 PDF

- PDF 输入：`tests/fixtures/synthetic.py` 在 `tmp_path` 生成的**合成 PDF**（PyMuPDF 构造）。
- 没有使用真实厂商 PDF；因此**无真实 PDF 文件标识/哈希**可登记。
- 无外部网络、数据库、对象存储、OAuth Provider 调用。
- `test_run_artifacts_and_secret_redaction` 通过 `monkeypatch` 设置 `DASHSCOPE_API_KEY`，验证配置/产物不泄露 secret；这是环境变量 mock，不是生产凭证。
- 其他测试使用 Pydantic 对象/JSON fixture；不依赖外部服务。

## 3. 历史日志与本轮重跑的区别

| 记录 | 文件 | 内容 | 主体 |
|---|---|---|---|
| 历史执行 | `../../reverification/evidence/02_targeted_pytest.txt` | `-q` 进度点 + 83 计数（无完整摘要） | 执行 Agent |
| 本轮重跑 | `01_pytest_full.log` | `-v` 完整用例列表 + `83 passed in 8.22s` | 执行 Agent |
| 本轮摘要 | `04_summary.txt` | passed/failed/skipped/errors/deselected/exit code | 执行 Agent |

两份日志均为执行 Agent 实跑；**没有** Reviewer 亲自重跑。Reviewer 的复核对象是提交、报告、日志与证据清单。

## 4. 环境

- Python `3.13.15`
- pytest `9.2.0`
- 仓库：`E:/workspace/icpdf-extractor`
- 运行前后 `git status --short` 均为空；stash 未动。

## 5. 证据文件

| 文件 | 用途 |
|---|---|
| `00_environment.txt` | 分支/SHA/状态/Python/pytest/命令/测试文件 |
| `01_pytest_full.log` | 完整 `-v` 终端输出与摘要 |
| `02_exit_code.txt` | 退出码 `0` |
| `03_after.txt` | 结束后状态、stash、HEAD、时间 |
| `04_summary.txt` | 机器可读摘要 |
| `05_scope_and_fixtures.md` | 本文件 |
| `06_test_file_hashes.txt` | 测试文件与 fixture 文件 SHA-256 |
| `README.md` | 11 项要求与证据映射 |