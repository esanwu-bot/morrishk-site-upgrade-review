# 检查 5：后端实现进度复验

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-P02-REVERIFY-005 |
| 基线 | `feat/gate6a-audit` / `600439a5eee69fb3a1cec2715e37080e48ca9840`（干净工作区） |
| 方法 | 代码/依赖/路由/数据层/测试检索 + 83 项 Parser 测试 + 75 矩阵对照 |
| 结论 | **FAIL** |

## 1. PASS/FAIL 判定

**FAIL。** 权威基线只有 PDF 解析引擎与 Parser Lab；**没有 Business API 后端**（产品/分类/证据/状态端点）、没有数据库业务表、没有 OAuth2/授权、没有 B2B 数据访问层，也没有 Business API 测试。

P0-2 该检查的通过标准（本报告采用）：后端业务模块、数据模型、API 路由、认证授权、OAuth2、日志/异常/安全、测试证据均可核验，且与 75 矩阵对应。当前均不满足。

## 2. 分级结论

| 层/能力 | 分级 | 证据 |
|---|---|---|
| Business API 契约/75 矩阵/Phase 2 计划 | **DESIGNED** | `12_` 契约候选；`26_` 计划；75 矩阵 |
| PDF 解析引擎（`src/icpdf`） | **IMPLEMENTED / TESTED** | 83 项定向测试通过；真实解析产物 |
| Parser Lab（`workbench/serve_parser.py`） | **IMPLEMENTED / SCAFFOLDED** | FastAPI 本地工具；`/api/parse`、`/api/process`、`/api/health`、`/api/page` |
| DuckDB lake（`lake/_build_lake.py`） | **SCAFFOLDED** | 仅 raw_docs/parse_runs/eval_results；无产品/分类表 |
| Business API Runtime/API | **NOT_IMPLEMENTED** | 无产品/分类/证据/状态端点 |
| Repository/数据访问层 | **NOT_IMPLEMENTED** | 无 DB 依赖/DDL；仅计划中的内存适配器 |
| Yii2 Client | **NOT_IMPLEMENTED** | 无代码 |
| OAuth2/认证/授权 | **NOT_IMPLEMENTED** | 无 OAuth 依赖/代码；Parser Lab 无 Bearer/Token |
| 错误包/审计/安全（B2B） | **NOT_IMPLEMENTED** | Parser Lab 有安全冻结开关，不是 B2B 错误包/审计 |
| 生产就绪 | **NOT_PRODUCTION_READY** | 无生产 API、无 DB、无 OAuth、无部署 |

## 3. 代码与依赖证据

### 3.1 依赖

`pyproject.toml:12-20` 仅含：

```text
pymupdf, pydantic, typer, rich, python-dotenv, pillow, pyyaml
```

**没有** FastAPI（Parser Lab 另行运行）、Flask、SQLAlchemy、psycopg、mysql、OAuth 依赖。`grep` 结果见 `evidence/06_b2b_backend_evidence.txt`。

### 3.2 src 层

`grep -rn "FastAPI\|Flask\|APIRouter\|sqlalchemy\|psycopg\|mysql.connector\|oauth" src --include="*.py"` → **无命中**。

- `src/icpdf` 是解析引擎：domain/parser/classification/storage/audit；不是 Business API。
- 无产品/分类/证据/状态 HTTP 端点。
- 无认证/授权中间件。

### 3.3 Parser Lab（不是 Business API）

`workbench/serve_parser.py:902-1174` 的路由：

- `GET /`、`GET /api/health`
- `POST /api/parse`（Parser-only）
- `POST /api/process`（Pre-Parse Gate）
- `GET /api/page`

`/api/health` 返回 `database_written: False`（`serve_parser.py:921`）。这是本地解析工具，不是 B2B。

### 3.4 数据层

`lake/_build_lake.py:364-400` 仅创建：

- `raw_docs(source_sha256, file, bytes, immutable, first_seen)`
- `parse_runs(run_id, source_sha256, parser_fingerprint, ...)`
- `eval_results(run_id, source_sha256, gold_version, ...)`

无产品主表、无分类表、无 Brand、无 75 矩阵所需业务表。

### 3.5 认证/OAuth

- `src` 无 OAuth/Token/Bearer 代码。
- `workbench/serve_parser.py` 无 Bearer/OAuth；仅有 `secrets.token_hex` 用于 run/request ID。
- 被排除的静态 B2B 桩（stash）有 `x_local_static_stub`、固定 token 标记，明确不签可用凭证；不属于权威基线。

## 4. 测试覆盖

- `tests` 中检索 `Business API|B2B|OAuth` → **无命中**（`evidence/08_backend_test_coverage.txt`）。
- `pytest --collect-only` 中匹配 `api|b2b|oauth` 的测试 → **无命中**。
- 已有 83 项测试是 Parser/Domain/Evidence 测试（`evidence/02_targeted_pytest.txt`，exit 0）。
- 没有 16 操作/20 错误码/75 Scope 矩阵/OAuth/DB 的测试。

## 5. 与 75 项 Scope × Endpoint 的对应

| 项 | 当前 |
|---|---|
| 5 Scope | 仅设计候选 |
| 15 业务端点 | 0 个实现 |
| 75 组合 | 0 个正式可执行 |
| 16 操作（含 issueToken） | 0 个 Business API 实现 |
| 20 错误码 | 仅设计/契约 |
| OAuth2 | 未实现 |
| 数据层 | 未实现 |

结论：75 矩阵与权威代码之间**没有实现映射**；只有设计/计划映射。

## 6. 是否存在“设计/空路由/Mock/静态页写成生产功能”

- 未发现把设计文档写成实现完成的声明。
- Parser Lab 是真实本地工具，但不是 Business API；不得把 `/api/parse` 返回 JSON 当作 B2B 完成。
- 静态 B2B 桩已排除，未在权威基线。
- 当前报告不把任何设计/占位写成生产功能。

## 7. 需要的修复（本轮不执行）

1. 在独立实施分支实现 Business API Runtime/API、Repository、Yii2 Client、OAuth2（Phase 2 W-1…W-4）。
2. 建立产品/分类/证据/状态数据模型与持久化/内存适配器，明确 75 矩阵。
3. 实现认证/授权、错误包、分页、ETag、审计、日志脱敏、速率限制。
4. 增加 16 操作/20 错误码/75 组合/OAuth/DB 测试；区分 DESIGNED/SCAFFOLDED/IMPLEMENTED/TESTED/PRODUCTION_READY。
5. 完成 Contract Freeze 与生产准入后才可生产实现。

## 8. P0-2 对应关系

- 对应 `12_/README.md` §2.1 第 5 项“数据库/审核/版本/发布四类后端进度”。
- 当前结论 **FAIL**；P0-2 不能提交关闭申请。
- 本检查未修改任何 Ds Bit 代码；未开始 Business API 实现。