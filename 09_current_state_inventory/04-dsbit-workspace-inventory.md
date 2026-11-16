# 04 · Ds Bit 产品知识工作台功能盘点

> 对象：`E:\workspace\icpdf-extractor`（解析引擎）+ `E:\workspace\DsBit\prototype.html`（UI 原型）+ `07_prototypes/admin` 中的产品知识页面（Demo）
> 关键边界：**解析引擎是独立系统**；商城后台/营销工作台不包含解析核心。
> 现状基线：`icpdf-extractor/README.md:3-6` 明确「Phase 1 complete，No LLM extraction yet」。

---

## 1. 系统定位与部署现状

| 项 | 事实 | 证据 |
|---|---|---|
| 项目定位 | Evidence-first 的半导体 Datasheet 解析引擎；每个正式参数必须能回到 PDF 单元格 | `README.md:7-20` |
| 当前阶段 | Phase 1：领域契约 + 确定性 PDF 解析 + 候选注册表；**无 LLM** | `README.md:3-6` |
| 运行形态 | 本地 FastAPI「Parser Lab」+ CLI；可 Docker 部署 | `workbench/serve_parser.py`、`deploy/dsb/` |
| 已部署环境 | `https://dsb.0668xgwl.com`，**冻结态**（`ALLOW_PARSE=0`），解析入口仅白名单 IP | `deploy/dsb/README.md` |
| 数据持久化 | **不连数据库、不写 PostgreSQL** | `workbench/serve_parser.py:18`、`workbench/parse_worker.py:17` |
| 运行产物 | `runs/<run_id>/`，每文件带 SHA-256，配置脱敏 | `README.md`「run artifacts」；`runs/` 51 个目录 |
| 生产接入 | Slice 6 仍为 DRAFT；item 98「pending production integration」 | `docs/SLICE6_INTEGRATION_PLAN.md` |
| 三层闸门 | HTML 原型存在**前端演示级** `contentRelease()` 资格判断；正式业务后端**无持久化实现** | `07_prototypes/admin/assets/views-knowledge.js:52-54`、`admin.js:313-355`；后端 `grep` 为空 |

> 部署≠可用：G0 环境的作用是证明「部署链路通 + 解析被锁死」，不是生产解析服务。

---

## 2. 流水线现状（代码级）

```text
PDF
 └─ pdf_loader（sha256、页数、加密/损坏拒绝）
     └─ page_renderer（PNG）
         └─ text_blocks（block/line/span/word + bbox）
             └─ table_detector / table_rebuilder（保守，未识别→unresolved/partial）
                 └─ candidate_registry（table/row/cell/page/bbox 绑定）
                     └─ [Phase 2 预留] LLM 选择 / 证据对齐 / 审计
```

- 解析入口：`workbench/serve_parser.py:1238`（`/api/parse`，Parser-only）、`:1289`（`/api/process`）。
- 控制面：`:1139`（`/api/control`）、`:1180`（`/api/health`）、`:1441`（`/api/page`）。
- 领域模型：`src/icpdf/domain/`（`document/product/table/evidence/parameter/candidate/visual`）。
- 参数正式容器：`Parameter` + `FormalParameterSet`（`src/icpdf/domain/parameter.py`）。
- 审计模块：`src/icpdf/audit/__init__.py` 仅 6 行，**未实现**。

---

## 3. 功能定义

### 3.1 文档与任务

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| DSB-01 | 文档上传 | 上传 Datasheet PDF | 运营/工程师 | PDF | 运行目录 | 单件上限 50 MB；拒绝加密/损坏/伪造 | `serve_parser.py` 上传校验 |
| DSB-02 | 文档身份 | 计算并绑定 SHA-256 | 系统 | PDF | `document_sha256` | 证据必须引用同一 SHA | `domain/document.py` |
| DSB-03 | 文档分类 | 判断文档类型 | 系统 | 文本/版面 | 分类结果 | `classification/` 模块；Parser-only 入口不调用分类器 | `src/icpdf/classification/` |
| DSB-04 | 解析任务 | 发起解析/处理 | 运营 | 文档 | 任务状态 | `/api/parse` 与 `/api/process` 分离；冻结时直接返回 FROZEN，不读请求体 | `serve_parser.py:1238,1289` |
| DSB-05 | 解析运行 | 一次 run 的产物 | 系统 | 解析参数 | `runs/<run_id>` | 产物含 `parser_version`、`contract_version`、文件 SHA | `README.md`、`docs/DATA_CONTRACT.md` |
| DSB-06 | 运行回放 | 从证据重渲染同一区域 | Reviewer | evidence_id | 页面图/区域 | `evidence_id` 只能解析一次，不得重复/孤儿 | `DATA_CONTRACT.md` §证据 |
| DSB-07 | 批量处理 | 多 PDF 批跑 | 工程 | PDF 集 | 批量结果 | 存在离线批跑脚本与 `runs/stage_a_350`；**无生产调度** | `runs/stage_a_350` |

### 3.2 表格、候选与参数

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| DSB-08 | 表格检测 | 定位表格区域 | 系统 | 页面版面 | `DetectedTable` | 保守检测；不确定→`unresolved` | `parser/table_detector.py` |
| DSB-09 | 表格重建 | 行/列/单元格重建 | 系统 | 表格区域 | 行/单元格 | 不可恢复→`unresolved` 且带原因 | `parser/table_rebuilder.py` |
| DSB-10 | 表头语义 | 识别 min/typ/max/条件/单位 | 系统 | 表头 | 列角色 | 列角色枚举：`min/typ/max/value/condition/unit/symbol/unknown` | `parser/header_semantics.py` |
| DSB-11 | 候选生成 | 生成参数候选 | 系统 | 单元格 | `Candidate` | 绑定 table/row/cell/page/bbox；单文档 | `parser/candidate_registry.py` |
| DSB-12 | 参数抽取 | 形成 `Parameter` | 系统 | 候选 | 参数对象 | 至少一个 value/min/typ/max；`applicable_mpn` + `table_id` 必填 | `domain/parameter.py` |
| DSB-13 | 单位处理 | 记录单位 | 系统 | 原始文本 | `unit` 字段 | 只记录，**未见统一换算/量纲校验模块** | `domain/parameter.py` |
| DSB-14 | 条件/测试条件 | 记录参数适用条件 | 系统 | 表头/注释 | `conditions` | 字段存在；自动抽取能力未完成 | `domain/parameter.py` |
| DSB-15 | 跨页/跨表合并 | 同一参数多页合并 | 系统 | 多页候选 | 合并参数 | **调查范围内未发现**合并/冲突消解模块 | 无 |
| DSB-16 | MPN 归一 | 请求 MPN 与文档 MPN 对齐 | 系统 | 请求 MPN/文档 | `normalized_mpn` | 不一致时必须提供 `identity_evidence` | `domain/product.py:40-62` |

### 3.3 证据、质量与人工

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| DSB-17 | 证据记录 | 页码/bbox/原文 | 系统 | 单元格/段落 | `Evidence` | `cell_text`/`table_row` 必须带 table/row/cell ID | `domain/evidence.py` |
| DSB-18 | 证据一致性 | 校验证据与参数匹配 | Reviewer | 参数+证据 | 通过/拒绝 | SHA 相等、表格归属、行/列归属、原文匹配、单位匹配、唯一解析 | `DATA_CONTRACT.md` 校验 1-8 |
| DSB-19 | 不变量校验 | 正式参数必须有证据 | 系统 | `FormalParameterSet` | 通过/异常 | 非正式状态不得进入正式容器 | `domain/parameter.py` |
| DSB-20 | 质量状态 | 参数/表格状态 | 系统 | 校验结果 | `verified/audited/unverified/unresolved/quarantined/rejected` | `unresolved/quarantined/rejected` 必须写原因 | `domain/parameter.py:22-27` |
| DSB-21 | 人工审核 | 审核人确认/退回 | 审核人 | 候选 | 审核状态 | **未实现**：模型无审核人/时间/意见字段，无审核 API/UI | 无 |
| DSB-22 | 知识版本 | 版本、差异、回滚 | 知识管理员 | 参数集 | 版本记录 | **未实现**：无版本表/快照/回滚 | 无 |
| DSB-23 | 发布授权 | 批次授权 | 发布负责人 | 内容版本 | 授权记录 | **未实现**：仅 HTML 原型前端演示 `RELEASE_APPROVED`；无服务端授权记录 | 无 |
| DSB-24 | 发布记录 | 发布批次与结果 | 运营 | 授权 | 发布记录 | **未实现**：无持久化批次记录 | 无 |
| DSB-25 | 三层闸门 | PIPELINE/CONTENT/RELEASE | 多角色 | 上游结果 | 三态 | 依赖顺序固定；**HTML 原型有前端演示，正式后端 0 实现** | 原型 `views-knowledge.js:52-54`、`admin.js:313-355` |
| DSB-26 | 审计留痕 | 谁在何时改了什么 | 合规 | 操作 | 审计日志 | `audit` 包为空 | `src/icpdf/audit/__init__.py` |

### 3.4 与外部系统

| 编号 | 三级功能 | 功能说明 | 使用角色 | 业务输入 | 业务输出 | 关键业务规则 | 依赖 |
|---|---|---|---|---|---|---|---|
| DSB-27 | 产品-文档关联 | 一个 MPN 对应多份文档 | 系统 | MPN/文档 | 关联 | **引擎侧未发现持久关联**；平台侧有 `pd_model_doc` 迁移但未接数据 | `platform/db/migrations/...pd_model_core` |
| DSB-28 | 商城后台对接 | 参数进入商品详情 | 系统 | 参数集 | 商品参数 | 未实现；原型宣称「只读对接 dsbit.internal:8080」为 Demo | 原型 `views-knowledge.js:41` |
| DSB-29 | 生产数据库 | 参数落库 | 系统 | 参数集 | 表记录 | **明确不连数据库** | `serve_parser.py:18` |
| DSB-30 | 任务队列/并发 | 异步队列与重试 | 系统 | 任务 | 队列状态 | 未实现；仅有进程内并发上限 `ICEX_WORKBENCH_MAX_CONCURRENCY` | `deploy/dsb/docker-compose.yml` |
| DSB-31 | 运行监控 | 健康/控制面 | 运维 | 无 | JSON 状态 | `/api/health`、`/api/control` 可用 | `serve_parser.py:1139,1180` |
| DSB-32 | 访问控制 | 限制谁能解析 | 运维 | IP/开关 | 403/FROZEN | Nginx 白名单 + 应用开关双层 | `deploy/dsb/README.md` |
| DSB-33 | LLM 抽取 | 模型选候选 | 系统 | 候选/提示词 | 参数 | **未实现**；README 明确 No LLM | `README.md:3-6` |
| DSB-34 | 前端工作台 | 文档/任务/审核界面 | 运营 | 操作 | 页面 | **仅原型**；真实 Parser Lab 只有最小页面 | `DsBit/prototype.html`；`workbench/index.html` |

---

## 4. 现状判断

| 编号 | 状态 | 证据级别 | 证据 | 仅原型 | 重复实现 | 已知问题 / 待确认 |
|---|---|---|---|---|---|---|
| DSB-01 | EXISTS_CODE | E2 | `serve_parser.py` 上传校验；50 MB 限制 | 否 | 后台原型「Datasheet 上传」 | 仅白名单环境可调用 |
| DSB-02 | EXISTS_CODE | E2 | `domain/document.py`；`README` | 否 | 平台 `pd_model_doc` | 文档版本历史未建 |
| DSB-03 | EXISTS_CODE | E2 | `src/icpdf/classification/` | 否 | 无 | 分类与解析入口的编排未在生产启用 |
| DSB-04 | EXISTS_CODE | E2 | `serve_parser.py:1238,1289`；部署为冻结态 | 否 | 后台原型解析队列 | 生产未开放 |
| DSB-05 | EXISTS_CODE | E2 | `runs/` 51 个目录；RUN manifest | 否 | 无 | 无集中存储/检索 |
| DSB-06 | EXISTS_CODE | E2 | `Evidence` + `screenshot_reference`；页面渲染 | 否 | 无 | 回放 UI 未完成 |
| DSB-07 | EXISTS_CODE | E2 | `runs/stage_a_350`、批跑脚本 | 否 | 无 | 历史批跑来自旧链路，口径需澄清（见 `06`） |
| DSB-08 | EXISTS_CODE | E2 | `parser/table_detector.py` | 否 | 无 | 复杂表格泛化未验收 |
| DSB-09 | EXISTS_CODE | E2 | `parser/table_rebuilder.py`；`ReconstructionStatus` | 否 | 无 | 合并单元格/跨页表格待验证 |
| DSB-10 | EXISTS_CODE | E2 | `parser/header_semantics.py` | 否 | 无 | 多语言表头支持未知 |
| DSB-11 | EXISTS_CODE | E2 | `candidate_registry.py` | 否 | 无 | 候选选择仍靠规则 |
| DSB-12 | EXISTS_CODE | E2 | `domain/parameter.py` | 否 | 平台 `pd_param_def`；旧站 `DataAttr` | 三套参数模型并存 |
| DSB-13 | PARTIAL | E2 | `unit` 字段；无换算模块 | 否 | 平台参数定义 | 单位规范化需业务规范 |
| DSB-14 | PARTIAL | E2 | `conditions` 字段 | 否 | 无 | 条件抽取未实现 |
| DSB-15 | NOT_FOUND | — | 无合并模块 | 否 | 无 | 多页参数如何处理需设计 |
| DSB-16 | EXISTS_CODE | E2 | `domain/product.py:40-62` | 否 | 平台 `MpnNormalizer` 规则 | 归一规则需统一 |
| DSB-17 | EXISTS_CODE | E2 | `domain/evidence.py` | 否 | 无 | 段落级证据已支持 |
| DSB-18 | PARTIAL | E2 | `DATA_CONTRACT.md` 校验 1-8；部分在模型校验中 | 否 | 无 | 8 条校验并非全部有代码实现 |
| DSB-19 | EXISTS_CODE | E2 | `FormalParameterSet` | 否 | 无 | — |
| DSB-20 | EXISTS_CODE | E2 | `VerificationStatus`、`ReconstructionStatus` | 否 | 后台原型 ReviewStatus | 参数级状态 ≠ 三层闸门 |
| DSB-21 | NOT_FOUND | — | 无审核字段/API | 是（原型有） | 后台原型「参数审核」 | 审核人/权限/留痕均未实现 |
| DSB-22 | NOT_FOUND | — | 无版本表 | 是（原型有） | 后台原型「知识版本」 | 版本与参数快照关系未定义 |
| DSB-23 | NOT_FOUND | — | 无授权模型 | 是（原型有） | 后台原型「发布授权」 | 授权粒度/审批人未定 |
| DSB-24 | NOT_FOUND | — | 无发布记录 | 是（原型有） | 后台原型「发布记录」 | — |
| DSB-25 | NOT_FOUND | — | 正式后端 0 命中；仅 HTML 原型前端演示 | 是（原型有） | 后台原型三层闸门 | 正式服务端落点（Ds Bit 还是商城后台）未定 |
| DSB-26 | NOT_FOUND | — | `audit` 包 6 行 | 是（原型有） | 后台原型审计 | — |
| DSB-27 | NOT_FOUND | — | 无持久关联 | 否 | 平台 `pd_model_doc` | 关联主数据归属未定 |
| DSB-28 | NOT_FOUND | — | 无对接代码 | 是（原型有） | 平台 `pd_model` | 只读/写入边界未定 |
| DSB-29 | NOT_FOUND | — | 明确不连库 | 否 | 平台 12 表 | **生产落库是最大缺口** |
| DSB-30 | NOT_FOUND | — | 无队列 | 否 | 后台原型任务队列 | 并发/重试/幂等未设计 |
| DSB-31 | EXISTS_CODE | E2 | `serve_parser.py:1139,1180` | 否 | 无 | 仅进程级健康 |
| DSB-32 | EXISTS_CODE | E2 | 部署 README 的实测矩阵 | 否 | 无 | 仅为 G0 预备环境部署验证，**不是生产解析服务** |
| DSB-33 | NOT_FOUND | — | `README.md:3-6` | 是（原型有「AI 生成」） | 后台原型技术内容生成 | 若引入 LLM，需先定义证据约束 |
| DSB-34 | EXISTS_PROTOTYPE | E4 | `DsBit/prototype.html`；`07_prototypes/admin` | 是 | 后台原型产品知识 7 页 | 原型数据全部 Demo |

---

## 5. 三层闸门：定义与落点

| 闸门 | 定义 | 上游依赖 | 下游影响 | 当前实现位置 |
|---|---|---|---|---|
| `PIPELINE_PASS` | 文档可解析、证据字段完整（页码/表格/行/bbox/原文） | 无 | 不通过则不进入参数候选 | HTML 原型前端演示 `views-knowledge.js:52`；引擎侧有部分校验能力，但未以此命名/落库 |
| `CONTENT_APPROVED` | 引用该参数的内容版本通过内容审核 | 必须 `PIPELINE_PASS` | 不通过则内容版本不得标记批准 | **仅 HTML 原型前端演示**；无服务端审核实现 |
| `RELEASE_APPROVED` | 指定发布批次获批 | 必须 `CONTENT_APPROVED` | 不通过则保持草稿 | **仅 HTML 原型前端演示**；无服务端授权/批次记录 |

**边界事实**：

- HTML 原型存在前端演示级 `contentRelease()` 资格判断，但它只操作浏览器内 Demo 状态，不能作为发布授权或审计依据。
- 正式业务后端**没有持久化的三层闸门实现**；不存在可依赖的服务端审核、发布授权、批次记录和审计闭环。
- 因此，当前不能把任何「原型显示已通过」当作真实审批结果。

必须保持的语义（不得合并）：

1. 参数级 `ReviewStatus`（`Verified` / `Needs Review` / `Rejected`）**只代表该参数**，不等于 `CONTENT_APPROVED`，更不等于 `RELEASE_APPROVED`。
2. `CONTENT_APPROVED` **只对特定内容版本**有效，不自动覆盖新版本。
3. `RELEASE_APPROVED` **只对特定发布批次**有效，不自动覆盖后续批次。
4. 三层依赖顺序固定：`PIPELINE_PASS → CONTENT_APPROVED → RELEASE_APPROVED`，上游未通过时下游不得标记为已批准。
5. 已发布商品展示的是**历史验证快照**，不能把当前未运行写成已通过。
6. Demo 快照与授权记录**不能作为真实审计依据**。

---

## 6. Ds Bit 结论摘要

1. **真实存在的**：确定性 PDF 解析、表格/候选/证据模型、参数正式容器、运行产物、冻结部署环境。这些是可复核的工程资产。
2. **不存在的**：生产数据库、参数落库、人工审核流、知识版本、发布授权、发布记录、三层闸门的**正式后端实现**、队列、审计、LLM。HTML 原型只有前端演示级 `contentRelease()`，不构成服务端闭环。
3. **最大断点**：解析结果无法进入商城/知识库成为可运营的数据；原型中的「工作台」没有后端支撑。
4. **必须区分的三件事**：
   - 「解析器能跑」≠「参数可发布」；
   - 「原型有审核页」≠「有审核流程」；
   - 「部署了域名」≠「生产解析服务」。