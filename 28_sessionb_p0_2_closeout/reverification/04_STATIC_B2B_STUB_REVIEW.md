# 检查 4：静态 B2B 桩复验

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-SESSIONB-P02-REVERIFY-004 |
| 基线 | `feat/gate6a-audit` / `600439a5eee69fb3a1cec2715e37080e48ca9840`（干净工作区） |
| 方法 | Git 跟踪文件检查 + 工作区检查 + 被排除 stub 的哈希/内容检查 + Parser Lab 路由检查 |
| 结论 | **FAIL（B2B 能力未实现）**；附带正面结论：权威基线中没有“静态桩冒充真实 B2B” |

## 1. PASS/FAIL 判定

**FAIL。** 权威提交中没有 B2B 服务；唯一已知 B2B 服务是**未跟踪的静态回放桩**，已按负责人决策排除并 stash。工作区中的 `workbench/b2b/` 仅剩 `__pycache__`。

同时确认：**权威基线没有把静态页面/JSON 冒充为真实 B2B 后端**；因为 B2B 文件根本不在提交中。这是“没有伪装”，不是“已经实现”。

## 2. 权威基线中的 B2B 文件

命令与输出（见 `evidence/06_b2b_backend_evidence.txt`）：

```bash
git ls-tree -r --name-only HEAD | grep -i "b2b\|business_api\|openapi"
# -> none

ls -la workbench/b2b
# -> 仅 __pycache__（无源文件）
```

- 没有 `workbench/b2b/serve_b2b.py`、`qa_console.html` 等提交。
- 没有 `business_api` 或 `openapi` 实现文件。
- 因此权威基线不具备 B2B 服务代码。

## 3. 被排除的静态桩（stash 内，不在权威基线）

隔离前记录（`evidence/00_excluded_b2b_stub_notes.txt`）：

- 文件：`workbench/b2b/serve_b2b.py`
- SHA-256：`9690706b67305bf4a4c10c88325f2198ef2db184c132a418a7ac66e8514cd91a`
- Git 状态：未跟踪（`git ls-files --error-unmatch` 失败）
- 其自身说明：
  - 必须 `ICEX_WORKBENCH_ALLOW_PARSE=0`，非 0 拒绝启动；
  - 只读取本地已生成的 `runs/.../V101.json` 与页面 PNG；
  - 不签发可用凭证，返回体带 `x_local_static_stub: true`；
  - 仅支持 `V101` 样本。
- 该文件已随 20 项内容进入 stash `3a7364b…9748`；**未纳入权威基线**。

结论：该桩即使存在，也只是静态回放；不是 Business API。按负责人决策排除后，权威基线中 B2B = **NOT_IMPLEMENTED**。

## 4. Parser Lab 不是 B2B

`workbench/serve_parser.py` 是 Ds Bit Parser Lab，不是 Business API：

| 路由 | 作用 |
|---|---|
| `GET /api/health` | Parser Lab 状态；返回 `database_written: False` |
| `POST /api/parse` | Parser-only 测试入口（`validate_pdf -> parse_pdf`） |
| `POST /api/process` | Pre-Parse Gate（分类 → 仅 DATASHEET 解析） |
| `GET /api/page` | 页面/证据查看 |

代码位置：`workbench/serve_parser.py:902-1174`。没有产品、分类、证据、状态等 Business API 端点，也没有 OAuth/Bearer/DB。

## 5. 数据来源与服务逻辑

- 权威基线 B2B：不存在，无数据层可核。
- Parser Lab：本地 HTTP + worker + 文件系统 `runs/`；`/api/health` 明确 `database_written: False`。
- 无产品主表、无分类表、无持久化业务数据。
- 因此不能把“页面可访问 / JSON 可返回”认定为 B2B 后端能力完成。

## 6. 已实现 vs 设计/占位

| 能力 | 状态 | 证据 |
|---|---|---|
| PDF 解析 Lab（`/api/parse`、`/api/process`） | IMPLEMENTED / TESTED（Parser 范围） | `workbench/serve_parser.py`；83 项测试 |
| B2B 静态回放桩 | 未跟踪、已排除；非权威基线 | stash 证据；`x_local_static_stub` |
| Business API（产品/分类/证据/状态） | **NOT_IMPLEMENTED** | 无跟踪文件、无路由、无 DTO |
| 75 项 Scope × Endpoint | **0/75 实现** | 无 API 端点；75 矩阵为计划 |
| OAuth2 / Token | **NOT_IMPLEMENTED** | 无 OAuth 依赖/代码 |

## 7. 是否存在“静态桩冒充真实业务能力”

- 在**权威基线**中：不存在，因为 B2B 文件不在提交中。
- 在**隔离前工作区**：存在一个未跟踪的静态桩，但其自身明确标注 `x_local_static_stub: true`、仅 V101、不签凭证；没有证据显示它被写成正式 B2B。
- 风险：如果该桩被误当成“B2B 已联通”的证据，会构成误判；本报告已将其排除并明确标注。

## 8. 需要的修复（本轮不执行）

1. 在独立分支实现真实 B2B 服务（16 操作/75 矩阵），不得复用静态回放桩冒充。
2. 设计并实现数据层（Repository/DB 或隔离内存适配器），明确数据来源。
3. 实现 OAuth2/认证/授权、错误包、分页、ETag、审计日志。
4. 增加 B2B 契约/集成测试；静态桩只能作为测试夹具，不能作为完成证据。

## 9. P0-2 对应关系

- 对应 `12_/README.md` §2.1 第 4 项“静态 B2B 桩状态”。
- 当前 B2B 能力 **FAIL**；P0-2 不能提交关闭申请。
- 本检查未修改任何 Ds Bit 代码；静态桩仍在 stash 中，未恢复。