# Ds Bit ↔ Morrishk Business API Integration Design v1

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-INT-001 |
| 版本 | v1.2.2（修正 §1.1 冻结状态表述，未冻结） |
| 日期 | 2026-11-17 |
| 修订记录 | v1.0 首版送审（`0fa9d34`）；v1.1 处理 R1–R8 与基线说明（`fc4bcc5`）；v1.2 收口 R3/R4/R5/R6/R8；v1.2.1 修正 R5 的 60 秒边界（OA-07 / OA-13 / OA-13a）；v1.2.2 修正 §1.1 冻结状态表述 |
| 范围 | 架构与接口契约设计；不含生产实现、生产部署、生产凭证 |
| 上游依据 | 本任务书；`09_current_state_inventory/`；`02_technical_design/morrishk_technical_plan_v1.2.md`；`platform/docs/phase1/03-api-contract.yaml`；`mysql_schema_audit/`；Ds Bit 项目仓库（`E:\workspace\icpdf-extractor`，含前台 `workbench/`）与本地 Stub 源码 |
| 下游用途 | Phase 0 契约冻结输入；Phase 1/2 开发依据；Reviewer 独立复核对象 |

> **本文档的边界**：所有标注 `PROPOSED` 的内容都尚未实现，不得当作现有能力引用。
> 所有标注 `CONFIRMED` 的内容均可在本文件 §2 给出的路径与行号处复核。
> 本次未执行任何解析、部署、生产 API 调用、数据库写入、URL 变更或 301 创建。

---

## 1. 执行摘要与架构结论

### 1.1 结论先行

1. **当前可以继续完善契约设计，但尚不具备契约冻结条件，更不能宣称已经接通。**
   Phase 0 阻断事项完成裁定、证据基线重新核实并形成冻结记录后，方可批准契约冻结。
   Ds Bit 目前**没有**生产级 Business API、没有 OAuth2 实现、没有分类服务、没有参数落库。
   Ds Bit 项目仓库是 `E:\workspace\icpdf-extractor`（Git 仓库），其中：
   - `workbench/` 是 **Ds Bit 前台**（`index.html` 为 "Ds Bit - Parser Lab (Parser-only)"；`workbench/b2b/qa_console.html` 为本地回放校对台）；
   - `src/icpdf/` 与 `workbench/serve_parser.py` 是确定性 PDF 解析引擎（Phase 1，**无 LLM 抽取**）；
   - `workbench/b2b/serve_b2b.py` 是**未纳入版本控制**的本地静态回放服务。
   该静态桩的 OAuth2 路由显式标注为桩，返回固定占位串，不校验任何真实凭据。
   （`E:\workspace\DsBit\prototype.html` 只是仓库之外的早期静态 UI 原型，不是 Ds Bit 项目代码。）
2. **Morrishk 目前没有任何对接 Ds Bit 的客户端、Token 存储、同步任务或映射表。**
   旧站（Yii2 / PHP 7.4 / MySQL 5.6 / MyISAM）只有 `snsii/Curl.php` 这个通用 curl 封装，
   且仅被 `commands/MapController.php:194` 用于提交 URL 给 Google，与 Ds Bit 无关。
3. **分类必须作为独立子系统设计。**
   Ds Bit 侧不存在任何产品分类树；`ParameterCategory` 是参数分组，不是产品分类；
   `DocumentType` / `SemanticDocType` / `DocType` / `Route` 是文档类型与流水线路由，
   不是产品分类。Morrishk 侧存在两套业务分类载体（旧站 `snsii_product_category`、
   新平台 `pd_category`），二者都是两级树，且都带 URL 语义。
   因此本设计把「技术分类体系（Technical Taxonomy）」定义为 Ds Bit 的新资产，
   与「器件身份」「文档类型」「Morrishk 业务分类」「SEO 落地页分类」严格分开。
4. **公开详情页不得实时依赖 Ds Bit。**
   Morrishk 的页面读路径只读本地库与本地缓存；Ds Bit 只在后台同步任务中被调用。
   Ds Bit 不可用时，Morrishk 继续使用最近一次成功同步且符合发布条件的本地数据。
5. **URL 与 SEO 不受 Ds Bit 驱动。**
   Ds Bit 的 `category_id` 不进入 Morrishk URL；分类映射变化不自动改写 URL、不自动生成 301。
   URL 变更仍走独立的 SEO 评审与 301 映射流程。

### 1.2 架构结论（目标形态，全部 `PROPOSED`）

```
┌──────────────────────────────┐        HTTPS + OAuth2 Client Credentials
│  Ds Bit 项目仓库             │◀──────────────────────────────────────────┐
│  （icpdf-extractor）         │                                           │
│                              │                                           │
│  - 前台 workbench（现状）    │        GET /api/v1/taxonomies/...          │
│  - 解析引擎（确定性，现状）  │                                           │
│  - 技术分类体系（新增）      │        GET /api/v1/products/...            │
│  - 参数/证据/版本/发布状态   │        GET /api/v1/products/{id}/evidence  │
│  - 只读 Business API（新增） │                                           │
└──────────────────────────────┘                                           │
                                                                           │
┌──────────────────────────────┐        ┌──────────────────────────────────┴───┐
│  Morrishk 公开站点（Yii2）   │        │  Morrishk 同步侧（CLI / cron）        │
│  - 页面只读本地表与缓存      │◀───────│  - services/DsBitClient.php           │
│  - URL / canonical / SEO     │        │  - Token 缓存 / 熔断 / 重试           │
│  - 询盘与转化                │        │  - dsbit_* 映射与缓存表               │
└──────────────────────────────┘        └──────────────────────────────────────┘
```

关键点：**同步侧与展示侧分离**。展示侧永远不发起对 Ds Bit 的网络请求。

### 1.3 第一阶段最小闭环（`PROPOSED`）

1. Ds Bit 提供只读分类 API（体系、节点、版本、增量、产品归属）。
2. Ds Bit 提供只读产品 API（详情、搜索、状态、版本、证据引用）。
3. Morrishk 用 CLI 同步分类与产品，落本地表，人工审核分类映射。
4. 公开页面只消费 `RELEASE_APPROVED` 产品与 `PUBLISHED` 分类。
5. Ds Bit 故障时页面无感，后台告警。

### 1.4 v1.1 修订记录（回应 Reviewer）

| 编号 | 复核意见 | 本版处理 |
|---|---|---|
| R1 | 410 降级策略自相矛盾 | 按 `error_key` 拆分：`PRODUCT_RELEASE_REVOKED` → `degraded_allowed=false`，立即停止展示；`CATEGORY_RETIRED` → `degraded_allowed=true`，保留旧分类页/历史映射，不新建归属。见 §4.7、§5.8、§8.3、§10.4、EX-10、EX-13 |
| R2 | Scope 只允许读 `PUBLISHED`，但 DEPRECATED 又要求保留期内 200 | `product.category.read` 明确可读保留期内的 `DEPRECATED`（不含 `DRAFT`/`REVIEWED`）；保留期后 `410 CATEGORY_RETIRED`；`DEPRECATED` 永不可用于新归属。见 §4.4 规则 5、§7.5.6、§7.7 |
| R3 | ULID 长度与示例 ID 不一致 | 统一为 `<type>_<26 字符 Crockford Base32 ULID>`，总长 ≤32；DB 列 `VARCHAR(32)`；全部示例 ID 重新校验。见 §5.3 |
| R4 | 产品分类端点权限边界不完整 | 明确 `GET /products/{id}/categories` 需 `product.category.read` **且**产品 `RELEASE_APPROVED`；内部读取未发布边需 `product.publish.read` + `internal_only=true`（v1.2 进一步明确双 scope 与边过滤）。见 §4.4 规则 4、§7.4、EX-07 / EX-07b / EX-07c |
| R5 | OAuth2 Token 机制未定义 | v1 采用 **opaque Token**（256 位随机、服务端哈希存储、可撤回、≤60 秒缓存）；v1 不支持 JWT/JWKS。见 §4.3 |
| R6 | `invalid_scope` 状态码不一致 | 按 RFC 6749 §5.2 统一为 `400`；首选 `client_secret_basic`；两种认证方式不得同时使用。见 §4.5、§12.1 |
| R7 | 只读 API 中出现未定义的条件失败状态 | 删除该未定义状态；`If-None-Match` 命中一律 `304`，不返回独立错误码。见 §4.7、§5.8、§8.3 |
| R8 | 合并/拆分后产品分类边需保留历史 | 边永不物理删除，新增 `valid_to` / `superseded_by_edge_id` / `superseded_at` / `change_reason` / `data_version`；API 只返回当前有效且 `APPROVED` 的边。见 §7.2.3、§7.2.4 |
| — | 证据基线时效性 | 新增基线说明：`CONFIRMED` 仅限 `600439a5…` 快照；Phase 0 冻结前须在权威分支干净提交上复核五项。见 §2.1 |
| — | 端点数量口径 | V1 必需分类端点修正为 **7 个**（含 `GET /taxonomies/{id}`）。见 §7.4 |

本次修订**不新增**任何实现、部署或生产操作。

### 1.5 v1.2 修订记录（基线 `fc4bcc5` 后复核）

| 编号 | 复核意见 | 本版处理 |
|---|---|---|
| R3 | 跨类型 ULID 重复 | 为 `prd_` 与 `chg_` 重新分配独立 ULID；同一资源跨示例保持一致；跨类型重复归零。见 §5.3 与全部示例 |
| R4 | `internal_only` 契约不完整 | 明确 Query 参数 `?internal_only=true`；必须同时具备 `product.category.read` 与 `product.publish.read`；缺任一 scope 返回 403；普通客户端不得借参数绕过门禁；成功响应含 `data.internal_only=true`；只返回当前有效 `APPROVED`/`PROPOSED` 边。见 §4.4 规则 4、§7.4、§8.3、§8.4、§12.3、EX-07c |
| R5 | 撤销时间语义矛盾 | 统一为"撤销后第 60 秒起（含 60 秒）全体 Resource Server 必须拒绝"；0–59 秒允许 200 或 401；提前失效仅属优化；OA-13/OA-13a 覆盖 0/59/60/61 秒与多 RS 一致性。见 §4.3、§11.1、§12.1 |
| R6 | Token 示例仍用 Body 传 secret | EX-01 与 EX-02a 改为 `client_secret_basic`；staging/生产示例不把 `client_secret` 放入表单体；`client_secret_post` 仅作 stub/受控内网例外。见 EX-01、EX-02a、§11.5 |
| R8 | 分类节点生命周期未收口 | 明确历史边永不物理删除、被引用节点不得物理删除、`410` 仅表示 API 退役、保留 tombstone、ID 永不复用。见 §7.2.4、§7.5.6、§7.6、§12.3 |

本次修订同样**不新增**任何实现、部署或生产操作。

---

## 2. 现状与证据基线

### 2.1 检查对象与版本

本次检查时间为 **2026-11-17（GMT+8）**，全部为只读检查（读文件、只读 `git` 查询、只读哈希）。

| 编号 | 对象 | 路径 | 版本控制状态 | 分支 / HEAD | 备注 |
|---|---|---|---|---|---|
| S1 | **Ds Bit 项目仓库**（解析引擎 + 前台工作台） | `E:\workspace\icpdf-extractor` | Git 仓库 | `backup/full-local-20261114` / `600439a5eee69fb3a1cec2715e37080e48ca9840` | 提交时间 2026-11-13T07:36:21+08:00；工作树**不干净** |
| S1a | Ds Bit 前台（Parser Lab 页面） | `E:\workspace\icpdf-extractor\workbench\index.html`；`workbench\b2b\qa_console.html` | 随 S1 仓库（`index.html` 已跟踪） | 同 S1 | 37,223 字节；标题 "Ds Bit - Parser Lab (Parser-only)"；校对台标题 "Ds Bit · 可视化校对台（本地回放）" |
| S2 | Ds Bit 本地 B2B 静态桩（前台联调用） | `E:\workspace\icpdf-extractor\workbench\b2b\serve_b2b.py` | **未跟踪（untracked）** | 无提交 | SHA-256 `9690706b67305bf4a4c10c88325f2198ef2db184c132a418a7ac66e8514cd91a` |
| S3 | 早期静态 UI 原型（**不在** Ds Bit 仓库内，仅作历史参考） | `E:\workspace\DsBit\prototype.html` | 非 Git 目录 | 无 | SHA-256 `4df07c8ac3965a733e2ae7036ff5961326e6502036136d72865c29bfa3121a63` |
| S4 | Morrishk 旧站（Yii2） | `E:\workspace\独立站\morries\newPlan\morrishk.net` | 非 Git 目录（源码快照） | 无 | PHP 7.4.33 / Yii 2 Basic |
| S5 | Morrishk 新平台工程 | `E:\workspace\独立站\morries\platform` | 非 Git 目录 | 无 | OpenAPI 3.1 契约 + 迁移 + Next.js 前端 |
| S6 | 数据库结构审计 | `E:\workspace\独立站\morries\mysql_schema_audit` | 非 Git 目录 | 无 | 来源：2024-11-30 dump（44.54 GiB） |
| S7 | 本送审仓库 | `E:\workspace\独立站\morrishk-site-upgrade-review` | Git 仓库 | `main` / `b55825c0162ccc678d01580337d0671fdfffa1c3` | 本次新增目录 `12_dsbit_business_api_integration_design/` |

> S1 的工作树包含 17 个已暂存新增/修改文件与未跟踪文件（`workbench/b2b/serve_b2b.py`、
> `deploy/dsb/evidence/`、`docs/g0_evidence/`）。本次**未做 commit、未做 stash、未修改工作树**。
> 因此 `serve_b2b.py` 只能作为"本地文件存在"的证据，不能作为"已交付代码"的证据。

> **基线时效性（回应 Reviewer 复核意见）**
>
> S1 的证据取自本地分支 `backup/full-local-20261114` 的 HEAD
> `600439a5eee69fb3a1cec2715e37080e48ca9840`，且工作树不干净。因此本文件所有 `CONFIRMED`
> **仅表示在该代码快照下确认的事实**，不代表 Ds Bit 当前权威分支或未来生产状态。
>
> **Phase 0 冻结前**，必须在 Ds Bit 权威分支的干净提交上重新核对以下五项；任一项不成立，
> 对应 `CONFIRMED` 降级为 `OPEN`，并更新 §2.2、§2.5 与附录 A：
>
> 1. 产品身份模型（`Product` 的标识与多版本语义）；
> 2. 产品全局 ID 唯一性（跨批次是否稳定）；
> 3. 解析器输出与证据模型（详见 `src/icpdf/domain/evidence.py` 的结构是否仍一致）；
> 4. 静态 B2B 桩状态（`serve_b2b.py` 是否仍为本地 stub、是否已进入版本库）；
> 5. 数据库 / 审核 / 版本 / 发布后端进度（是否仍为 `NOT_IMPLEMENTED`）。
>
> 本次交付**未执行**上述复核，也不构成对权威分支现状的断言。

### 2.2 Ds Bit 项目仓库已确认事实（`CONFIRMED`）

> 本节所述"Ds Bit"指项目仓库 `E:\workspace\icpdf-extractor`。它由两部分组成：
> **前台 `workbench/`**（工作台页面与本地服务入口）与 **解析引擎 `src/icpdf/`**（确定性 PDF 解析）。
> 早期 `E:\workspace\DsBit\prototype.html` 不在该仓库内，只作历史 UI 参考。

| 能力 | 结论 | 证据 |
|---|---|---|
| 项目定位 | Ds Bit 项目仓库 = 前台工作台 + Evidence-first 半导体 Datasheet 解析引擎；引擎 Phase 1 完成，**无 LLM 抽取** | `icpdf-extractor/README.md:3-6` |
| 前台形态 | `workbench/index.html`（"Ds Bit - Parser Lab"）+ `workbench/b2b/qa_console.html`（本地回放校对台）；均为本地静态页面，由 `serve_parser.py` 提供入口 | `workbench/index.html`、`workbench/b2b/qa_console.html` |
| 前台数据能力 | 上传、解析触发、结果查看、可视化校对；**不包含**审核/版本/发布/分类维护等业务后台功能 | `workbench/index.html` 全文检索；`09_current_state_inventory/04-dsbit-workspace-inventory.md` DSB-21..DSB-26 |
| 前台鉴权 | 页面本身无登录/权限体系；解析入口靠部署层 IP 白名单与应用开关 | `workbench/serve_parser.py`；`deploy/dsb/README.md` |
| 解析入口 | `/api/parse`、`/api/process`、`/api/control`、`/api/health`、`/api/page` | `workbench/serve_parser.py`（路由定义于第 1139、1180、1238、1289、1441 行附近） |
| 解析服务鉴权 | **无** OAuth2 / API Key / Bearer 校验代码；仅部署层 IP 白名单与应用开关 | `workbench/serve_parser.py` 全文无 `authorization` / `api_key` 校验；`deploy/dsb/README.md` 三层锁说明 |
| 部署现状 | `https://dsb.0668xgwl.com` 为 **G0 冻结预备环境**，`ICEX_WORKBENCH_ALLOW_PARSE=0`，解析入口仅白名单 IP | `deploy/dsb/README.md` |
| 持久化 | **不连数据库**，不写 PostgreSQL/SQLite；产物落 `runs/<run_id>/` | `workbench/serve_parser.py:18`（模块注释） |
| 产品身份模型 | `Product`：`product_id`、`document_id`、`requested_mpn`、`normalized_mpn`、`identity_scope`、`product_type`、`manufacturer`、`package`、`identity_evidence[]` | `src/icpdf/domain/product.py` |
| 证据模型 | `Evidence`：`evidence_id`、`document_sha256`、`page_number`、`table_id`/`row_id`/`cell_id`、`bbox`、`raw_text`、`screenshot_reference`、`evidence_type` | `src/icpdf/domain/evidence.py` |
| 参数模型 | `Parameter`：`parameter_id`、`name`、`category`、`value`/`unit`/`min`/`typ`/`max`/`conditions`、`applicable_mpn`、`table_id`、`evidence_ids[]`、`verification_status`、`unresolved_reason` | `src/icpdf/domain/parameter.py` |
| 参数正式容器 | `FormalParameterSet` 拒绝任何非 `verified/audited` 参数 | `src/icpdf/domain/parameter.py` |
| 参数状态 | `VERIFIED`、`AUDITED`、`UNVERIFIED`、`UNRESOLVED`、`QUARANTINED`、`REJECTED` | `src/icpdf/domain/parameter.py:22-27` |
| 文档类型 | `DocumentType`：`datasheet/user_guide/quick_start/errata/unknown` | `src/icpdf/domain/document.py` |
| 文档语义分类 | `SemanticDocType`：`IC_DATASHEET/EVM/USER_GUIDE/APP_NOTE/REFERENCE_DESIGN/OCR_REQUIRED/UNKNOWN/UNREADABLE`；`Route`：`IC_PARSE/REVIEW/QUARANTINE/OCR` | `src/icpdf/classification/models.py:41-80` |
| 运行产线 | Stage B 三层血缘（raw/parse/eval）+ DuckDB `catalog.duckdb`；V101 run `V101-20261112T231416Z-ff12` | `lake/README.md` |
| 本地静态桩 | `serve_b2b.py`：只回放 **V101** 单样本；`ICEX_WORKBENCH_ALLOW_PARSE` 必须为 0；返回 `x_local_static_stub: true`、`x_not_real_auth: true` | `workbench/b2b/serve_b2b.py`（未跟踪） |
| 静态桩 OAuth2 | `/.well-known/oauth-authorization-server` 声明 `client_credentials`；`/oauth/token` 返回固定串 `LOCAL_STATIC_STUB_NOT_A_CREDENTIAL`，**不校验 client_id/secret**；`/oauth/authorize` 明确 `implemented: false` | `workbench/b2b/serve_b2b.py` |
| 静态桩商务路由 | `/v1/health`、`/v1/parts`、`/v1/parts/{model}`；仅 `SUPPORTED_SAMPLES=("V101",)` | `workbench/b2b/serve_b2b.py` |
| V101 数据 | `runs/gate6a_replay_v2_postfix/per_sample_json/V101.json` 107,102 字节，SHA-256 `19be2b12fe5e28ad371749245f57e6d0532d587c9a13dc711b8503fc850a5314` | 本地只读哈希 |
| V101 候选 | `runs/_pilot/V101/candidates.json` 1,022,972 字节，SHA-256 `3dd79124cdbd386fd45e8ede0e3225ecf55dda2edcd4738b406e8c8fb75aa379` | 本地只读哈希 |
| 技术分类体系 | **不存在**。`src/`、`workbench/` 内无 taxonomy / product category 模型或接口 | 全文检索：仅命中 `ParameterCategory` 与失败原因分类 |
| 审核 / 版本 / 发布 | **无正式后端实现**；无审核表、无版本表、无发布授权记录、无批次表 | `09_current_state_inventory/04-dsbit-workspace-inventory.md` DSB-21..DSB-25 |
| 审计 | `src/icpdf/audit/__init__.py` 仅 6 行，未实现 | 同上 DSB-26 |
| 队列 | 无；仅进程内并发上限 | 同上 DSB-30 |

### 2.3 Morrishk 已确认事实（`CONFIRMED`）

| 能力 | 结论 | 证据 |
|---|---|---|
| 技术栈 | Yii 2 Basic，`composer.json` 要求 `php >=5.6.0`；运行基线为 PHP 7.4.33 | `newPlan/morrishk.net/composer.json:17`；`00_project_baseline/existing_system_baseline.md` |
| 数据库 | MySQL 5.6.50，库 `morris`，表前缀 `snsii_`；31 张表，30 MyISAM + 1 InnoDB；字符集 `utf8`（mb3）；无 JSON 类型、无窗口函数 | `mysql_schema_audit/01_schema.sql`、`02_table_inventory.csv`、`07_extraction_report.md` |
| 产品主表 | `snsii_product`：20 列；`id` int(8)；`PartNumber` 唯一；`PartUrl`；`BigCat`；`SmallCat`；`Mid`；`Description`；`DataAttr` TEXT；`PdfId`/`Pdf`；`IsPut`；`Lifecycle`；`RoHS` | `mysql_schema_audit/01_schema.sql`（`CREATE TABLE snsii_product`） |
| 分类表 | `snsii_product_category`：11 列；`id`、`Name`、`EName`、`Links`（唯一）、`Number`、`Pid`、`Sort`、`Md5`、`PriceSwitch`、`PriceRatio`、`Image`；两级树（`Pid=0` 为顶级） | 同上 |
| 分类字段缺口 | 无 `level`、`path`、`description`、`status`、`is_active`、`aliases`、`external_codes`、`created_at`/`updated_at` | 同上 |
| 产品-分类关系 | 仅 `BigCat`（大类）+ `SmallCat`（小类）两个 smallint 字段；无多分类、无主分类标记、无有效期 | 同上 |
| 详情缓存 | `snsii_product_cache`：`ProId` + `Json`；`ProController::actionItem` 优先读该表 | `controllers/ProController.php:268-276`；基线文档记为 31.7GB |
| 详情页参数 | `DataAttr` 按 JSON 解码；键名经 `md5($Name)` 走 `Yii::t('attr', ...)` 翻译 | `controllers/ProController.php:286-291` |
| URL 规则 | `.html` 后缀；详情 `/products/<8位数字id>/<PartUrl>`；大类 `/big-categories/c-<Mid>-<Cid>/<Links>`；小类 `/sub-categories/...`；品牌 `/manufacturer/<Links>` | `config/web.php:120-123`；`config/params.php:96-118` |
| URL 生成 | `snsii\Url::ProItem($ProId, $PartUrl)` 使用 `sprintf('%08d', $ProId)`；`BCUrl/SCUrl` 使用 `Links + Cid + Mid` | `snsii/Url.php:81-110` |
| SEO 元信息 | `seo()` 只注册 `title`、`keywords`、`description` 三个标签 | `commands/SnSiiController.php:84-99` |
| canonical / JSON-LD | **不存在**。详情页与布局中未发现 `canonical`、`application/ld+json`、`og:*` 输出 | `views/pro/item.php`、`views/layouts/*.php` 检索为空 |
| 多语言 | `i18n` 使用 `PhpMessageSource`；页脚仅有语言切换链接的 `hreflang`，非页面级 hreflang | `config/web.php`；`views/layouts/footer.php:123` |
| API Client | **无** OAuth / Token / Ds Bit 客户端；`snsii/Curl.php` 为通用 curl 封装，仅 `commands/MapController.php:194` 使用 | 全文检索 |
| 同步/队列 | 无队列；存在 console 命令（`commands/*.php`），但仓库内**没有** cron / scheduler 定义 | `commands/`、`config/console.php` |
| 现有 console 能力 | 商品日更、Sitemap/robots、URL 生成、向 Google 提交 URL | `commands/ProController.php`、`commands/MapController.php`、`commands/CController.php` |
| 缓存 | Yii `FileCache`（`directoryLevel=3`）+ 详情缓存表 | `config/web.php:27-31` |
| 凭据管理 | `config/web.php` 与 `config/db.php` 内存在明文凭据（SMTP 密码、数据库密码、cookieValidationKey） | 本次**不复制任何值**；列为安全风险（§13.7） |

### 2.4 新平台工程已确认事实（`CONFIRMED`，但非生产）

| 能力 | 结论 | 证据 |
|---|---|---|
| API 契约 | OpenAPI 3.1，`version: 1.0.0-phase1`；统一响应包 `{code, message, data, request_id, meta}`，`code=0` 成功 | `platform/docs/phase1/03-api-contract.yaml:9-14` |
| 已有端点 | `/health`、`/models/{mpn}`、`/home`、`/models`、`/search`、`/suggest`、`/categories/{slug}`、`/inquiries`、`/inquiries/{leadNo}` | 同上 |
| 分类响应 | `id`、`name`、`slug`、`path`、`breadcrumb`、`model_count`、`children` | `03-api-contract.yaml:348-395` |
| 新库迁移 | `pd_brand`、`pd_category`（两级）、`pd_param_def`、`pd_model`、`pd_model_doc`、`pd_alt`、`biz_inquiry`、`sync_outbox` | `platform/db/migrations/20261116_0001..0004` |
| 迁移目标版本 | MySQL 8.0.12；允许 local/dev/staging，**禁止 production** | 迁移文件头注释 |
| 前端 | Next.js；`API_MODE=mock` 默认，`web/src/lib/api/client.ts` 统一 Adapter | `platform/web/src/lib/api/client.ts` |
| 同步出箱 | `sync_outbox` 只写不消费，为 OpenSearch 预留；**与 Ds Bit 无关** | `20261116_0004__sync_outbox.up.sql` |

### 2.5 明确不存在或不可用的能力

| 能力 | 状态 | 说明 |
|---|---|---|
| Ds Bit 生产 Business API | `NOT_IMPLEMENTED` | 仅有未跟踪的本地静态桩 |
| Ds Bit OAuth2 签发/校验 | `NOT_IMPLEMENTED` | 静态桩返回固定串，不校验凭据 |
| Ds Bit 技术分类体系 | `NOT_IMPLEMENTED` | 无表、无模型、无接口 |
| Ds Bit 参数落库 | `NOT_IMPLEMENTED` | 引擎不连数据库 |
| Ds Bit 审核/版本/发布 | `NOT_IMPLEMENTED` | 仓库内无实现；送审仓库 `07_prototypes/admin` 的审核页只是 HTML 前端演示 |
| Ds Bit 前台业务后台 | `NOT_IMPLEMENTED` | `workbench/` 只有解析/校对界面，无审核、版本、发布、分类维护页面 |
| Ds Bit 队列/重试/幂等 | `NOT_IMPLEMENTED` | 无 |
| Ds Bit 证据在线服务 | `NOT_IMPLEMENTED` | 证据只在 `runs/` 本地目录 |
| Morrishk Ds Bit Client | `NOT_IMPLEMENTED` | 无 |
| Morrishk 分类映射表 | `NOT_IMPLEMENTED` | 无 |
| Morrishk 同步任务/调度 | `NOT_IMPLEMENTED` | 无 cron、无队列 |
| Morrishk canonical / JSON-LD | `NOT_IMPLEMENTED` | 旧站无输出 |
| Ds Bit 生产解析服务 | `NOT_VERIFIED` / 冻结 | `dsb.0668xgwl.com` 为 G0 冻结环境，不作为生产能力 |

### 2.6 证据采集方法

- 只读 `git rev-parse` / `git log` / `git status` / `git diff --cached --stat`。
- 只读文件读取与 `grep` / `sha256sum`。
- **未**启动解析服务、**未**调用 `/api/parse`、**未**访问 `dsb.0668xgwl.com`、**未**连接任何数据库。
- **未**执行 `serve_b2b.py`；其行为依据源码静态阅读。
- 所有 SHA-256 为本次在本机对文件字节直接计算。

### 2.7 现状与拟议实现的差异（摘要）

| 维度 | 当前（`CONFIRMED`） | 本设计（`PROPOSED`） |
|---|---|---|
| 授权 | 无 | OAuth2 Client Credentials + 5 个 scope |
| API 版本 | 无 | `/api/v1`，v1 只做加法 |
| 产品 DTO | 引擎领域对象 + 原始 JSON 产物 | 稳定业务 DTO（身份/参数/分类引用/证据引用/版本/门禁） |
| 产品分类 | 无 | 独立 taxonomy + category + edge + changes |
| 分类映射 | 无 | `dsbit_category_mapping` 显式映射层 |
| 发布门禁 | 仅原型演示 | 服务端三态 + 独立发布批次 |
| 同步 | 无 | CLI 全量/增量 + 断点 + 审计 |
| 页面数据源 | 旧表 + 详情缓存表 | 页面仍读本地；新增 `dsbit_*` 缓存仅供同步/展示使用 |
| URL | 旧规则冻结 | 保持不变；Ds Bit 不参与 URL 生成 |
| SEO | title/keywords/description | 不新增 Ds Bit 驱动的 canonical/URL；JSON-LD 仅用已发布数据 |

---

## 3. 系统职责边界与设计原则

### 3.1 Ds Bit：产品技术数据与知识服务

> 承载系统：Ds Bit 项目仓库 `E:\workspace\icpdf-extractor`，前台为 `workbench/`，解析核心为 `src/icpdf/` + `workbench/serve_parser.py`。

负责：

- 产品技术数据及标准化参数；
- 参数来源、证据与可追溯信息（文档 SHA-256、页码、表格/行/单元格、bbox、原文）；
- 产品数据版本、审核状态、发布状态；
- 产品技术分类体系、分类节点、分类与产品归属；
- 对外提供**经过授权**的只读 Business API；
- 决定哪些数据允许被 Morrishk 等业务系统消费（scope + 发布门禁）。

不负责：

- 网站导航、SEO 文案、URL、询盘；
- 商品价格、库存、商家归属（这些属于 Morrishk）；
- 公开站点的页面渲染与可用性。

### 3.2 Morrishk：业务展示、SEO 与询盘转化

继续使用：

- Yii2 / PHP 7.4 / MySQL 5.6 / MyISAM 现有环境；
- 现有产品表、分类表、详情缓存表与 URL 规则。

负责：

- 产品目录、详情页、分类导航、SEO 页面；
- 产品与本地分类、品牌、URL 的业务关联；
- 从 Ds Bit 同步已审核、已发布的数据；
- 本地缓存与页面展示；
- 询盘、转化与站点运营。

不负责：

- 解析 PDF；
- 维护技术参数的事实来源；
- 暴露 Ds Bit 的内部解析流水线。

### 3.3 六条核心原则

1. Ds Bit 是技术数据源，Morrishk 是业务消费端。
2. 两边通过版本化 API 契约解耦。
3. 第一阶段只读，Morrishk 不得通过 API 修改 Ds Bit 数据。
4. 公开详情页不得实时依赖 Ds Bit 在线可用性。
5. Morrishk 只消费符合发布条件的数据。
6. 分类数据与产品数据必须具备**独立**的版本与同步机制。

### 3.4 禁止跨越的边界

- 不把 Ds Bit 的内部 `runs/<run_id>` 结构、候选 JSON、`param_blocks` 直接暴露为业务 API。
- 不把 Morrishk 的商品价格/库存/商家信息写入 Ds Bit。
- 不让 Ds Bit 的 `category_id` 成为 Morrishk URL 的一部分。
- 不让分类映射自动触发 URL 或 301 变更。
- 不用分类名称字符串匹配作为唯一映射依据。

---

## 4. OAuth2 授权设计

> 状态：全部 `PROPOSED`。当前 Ds Bit 无任何 OAuth2 实现；`serve_b2b.py` 的 OAuth2 路由是静态桩，
> 不得作为安全边界或验收依据。

### 4.1 授权模式

采用 **OAuth 2.0 Client Credentials Grant**（RFC 6749 §4.4）。

- Ds Bit：同时充当 Authorization Server 与 Resource Server。
- Morrishk：OAuth2 Client。
- 第一阶段**不引入** Authorization Code + PKCE。理由：调用方是单一服务器到服务器场景，
  没有终端用户委托，也没有第三方应用；引入交互式授权只会增加攻击面与运维成本。

未来扩展（`FUTURE`）：若出现多租户、用户级授权或第三方应用，再引入 Authorization Code + PKCE，
复用同一 Token 端点与同一 scope 注册表，通过 `audience` 区分资源。

### 4.2 客户端注册与密钥管理

| 项 | 设计 |
|---|---|
| 客户端粒度 | 每个环境一个独立 client：`morrishk-prod`、`morrishk-staging`、`morrishk-local` |
| `client_id` | 非敏感标识，可出现在配置与日志中 |
| `client_secret` | 敏感；仅在签发时显示一次；服务端只存哈希（Argon2id 或 bcrypt） |
| 存储位置（Ds Bit） | 密钥管理系统或服务端加密配置；**不入库明文、不入 Git、不入日志** |
| 存储位置（Morrishk） | 环境变量 `DSBIT_CLIENT_SECRET`；由 `config/params-local.php` 读取，该文件不入 Git |
| 轮换 | 支持双活窗口：新 secret 生效后保留旧 secret 24 小时，再禁用旧 secret |
| 禁用 | 客户端级 `enabled=0`：立即拒绝签发；已签发 Token 最迟 60 秒内被全体 Resource Server 拒绝（撤销传播上限见 §4.3） |
| 权限变更 | scope 在客户端注册时静态绑定；变更需重新签发 Token |

**本地 Stub 密钥隔离**（`PROPOSED`）：

- 配置项 `dsbit.mode = stub | real`，默认 `stub`。
- `stub` 模式只允许 `http://127.0.0.1` / `http://localhost`，且必须使用占位 secret。
- 启动断言：若 `mode=real` 且 `client_secret` 等于占位串，或 `mode=stub` 且 host 不是回环地址，
  直接拒绝启动并写错误日志。
- 生产环境禁止出现 `LOCAL_STATIC_STUB_NOT_A_CREDENTIAL` 字符串。

### 4.3 Token 签发与生命周期

| 项 | 建议值 | 说明 |
|---|---|---|
| `grant_type` | `client_credentials` | 必填 |
| `token_type` | `Bearer` | 仅支持 Bearer |
| `expires_in` | 900 秒（15 分钟） | 可通过客户端策略调整；不建议超过 1 小时 |
| refresh token | 不签发 | Client Credentials 直接重新获取 |
| 提前刷新 | 剩余 TTL ≤ 120 秒时刷新 | 避免边界过期 |
| 时钟偏差 | 允许 60 秒 | 服务端与客户端均校验 |
| 并发获取 | 单飞（single-flight） | 见 §4.6 |
| Token 形态 | **opaque Token**（不透明随机串） | 见下方决策 |
| 撤销 | RFC 7009 `/oauth/revoke` 或管理端禁用 | 撤销后最迟 60 秒全体 Resource Server 拒绝；提前失效通知仅为优化 |

**Token 形态决策（`PROPOSED`，回应 R5）**

v1 采用 **opaque Token**，不使用 JWT：

- `access_token` 为 256 位密码学随机数，Base64URL 编码；不含任何可解析声明。
- 服务端在 `oauth_access_token` 表中保存：`token_hash`（SHA-256，不存明文）、`client_id`、`scope`、`iat`、`exp`、`jti`、`aud`、`revoked_at`。
- Resource Server 每次请求按 `token_hash` 查表并校验 `exp` / `revoked_at`；允许最长 60 秒的进程内缓存。
- **撤销传播语义（统一口径）**：撤销后**第 60 秒起（含 60 秒）**，全体 Resource Server 必须拒绝该 Token；
  第 0–59 秒内允许仍接受（缓存尚未失效）或提前拒绝，二者都合规。这是契约上限，不承诺无条件立即生效。
  若通过主动失效通知（如缓存删除或消息广播）提前生效，属于实现优化，不得写进对外 SLA，
  也不得替代 60 秒上限的兜底校验。
- 撤销通过 `revoked_at` 与上述传播机制生效，不需要维护 JWT 黑名单，也不引入 JWKS 与密钥轮换。
- v1 **不**支持 JWT / JWKS；若未来需要无状态校验，在 v2 单独设计签名算法、`kid` 轮换与撤销名单（`FUTURE`）。

**Token 不得**：

- 写入应用日志、访问日志、错误响应、APM trace、异常堆栈；
- 放入 URL query、Referer、前端代码、Cookie；
- 持久化到数据库明文字段。

### 4.4 Scopes

| Scope | 允许的 API | 数据权限 |
|---|---|---|
| `product.read` | `GET /products/{id}`、`GET /products/search` | 仅 `RELEASE_APPROVED` 产品的业务 DTO |
| `product.category.read` | 全部 `/taxonomies/*`、`/categories/*`，以及 `GET /products/{id}/categories` | `PUBLISHED` 分类正常读取；`DEPRECATED` 分类在保留期内可读（含 `merged_into` / `split_into`）；`DRAFT` / `REVIEWED` 不可见；不含产品参数 |
| `product.evidence.read` | `GET /products/{id}/evidence` | 证据引用与短原文；不含 PDF 二进制 |
| `product.version.read` | `GET /products/{id}/versions`、`GET /taxonomies/{id}/version`、`/changes` | 版本号、变更记录、时间戳 |
| `product.publish.read` | `GET /products/{id}/status`；`product.read` 的 `include_unreleased=true`；`GET /products/{id}/categories?internal_only=true` 读取未发布产品边（仍需 `product.category.read`） | 未发布产品的门禁状态与内部可见数据 |

规则：

1. **分类读取权限独立于产品详情读取权限。** 只授予 `product.category.read` 的客户端不能读取产品参数。
2. 默认最小授权：Morrishk 站点同步使用 `product.read product.category.read product.evidence.read product.version.read`；
   `product.publish.read` 仅授予内部审核/运维客户端。
3. 缺失 scope 返回 `403 INSUFFICIENT_SCOPE`，不回退、不静默降级。
4. **`GET /products/{id}/categories` 同时受产品发布门禁约束（回应 R4）**：
   - 普通客户端（仅有 `product.category.read`）只能读取 `RELEASE_APPROVED` 产品的 `APPROVED` 且当前有效的边；
   - 产品未发布时返回 `403 PRODUCT_NOT_RELEASED`，不得通过该端点绕过产品详情 API 的门禁；
   - 内部读取必须显式使用 Query 参数 `?internal_only=true`；
   - 使用 `internal_only=true` 时，必须同时具备 `product.category.read` **和** `product.publish.read`；
     缺少任一 scope 返回 `403 INSUFFICIENT_SCOPE`，不得静默忽略该参数；
   - 普通客户端传入 `internal_only=true` 但缺少 `product.publish.read` 时返回 `403`，不能借此绕过发布门禁；
   - 内部成功响应必须在 `data` 中返回 `"internal_only": true`；
   - 内部读取允许返回当前有效（`valid_to IS NULL`）的 `APPROVED` 与 `PROPOSED` 边；
     **不得**返回 `REJECTED` 边，**不得**返回 `valid_to` 非空的历史边或已失效的替代链；
   - 内部读取的产品状态仍受 `product.publish.read` 约束，不能读取 `REVOKED` 产品的业务数据。
5. `DEPRECATED` 分类的读取规则（回应 R2）：
   - 保留期内 `GET /categories/{id}` 返回 `200`，`status=DEPRECATED`、`is_active=false`，并带迁移信息；
   - 保留期结束后返回 `410 CATEGORY_RETIRED`；
   - 无论是否在保留期，`DEPRECATED` 分类都**不得**用于新建产品归属（写入侧规则，v1 无写端点）。

### 4.5 Token 端点

```
POST /oauth/token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&scope=product.read product.category.read
```

**客户端认证方式（回应 R6）**：

- 首选 `client_secret_basic`（HTTP Basic）；`client_id` / `client_secret` 不放进表单体。
- Basic 凭据构造遵循 RFC 6749 §2.3.1：`client_id` 与 `client_secret` 先分别做
  `application/x-www-form-urlencoded` 编码，再用 `:` 拼接并 Base64 编码；
  不得直接对原始字符串拼接后编码。
- `client_secret_post`（表单体传凭据）仅允许在 `stub` 模式或明确受控的内网环境使用。
- **同一次请求不得同时使用两种认证方式**；同时出现时返回 `400 invalid_request`。
- 认证失败不区分"client 不存在"与"secret 错误"，统一 `401 invalid_client`。

成功：`200`，返回 `access_token`、`token_type`、`expires_in`、`scope`。
失败：`400 invalid_request`、`400 invalid_scope`、`401 invalid_client`、`400 unsupported_grant_type`。
（`invalid_scope` 按 RFC 6749 §5.2 统一为 `400`，不再使用 `403`。）

详细示例见 `API_CONTRACT_EXAMPLES.md` EX-01 / EX-02。

### 4.6 Token 缓存与并发控制（Morrishk 侧）

`PROPOSED` 实现要点：

1. Token 缓存在 Yii 缓存组件，键：`dsbit.token.<scope_hash>`；值含 `access_token`、`expires_at`。
2. 获取前检查 `expires_at - now > 120s`；不足则刷新。
3. **单飞**：用 `yii\mutex\FileMutex`（或 `MysqlMutex`）加锁，锁内二次检查缓存，避免并发风暴。
4. 收到 `401 INVALID_TOKEN/TOKEN_EXPIRED` 时：作废缓存 → 重新获取一次 → 重放原请求一次；
   若仍 401，直接失败并告警，不循环重试。
5. Token 不落数据库、不落文件、不进日志。

### 4.7 超时、错误与重试策略

| 场景 | 客户端行为 | 可重试 | 允许降级读本地 |
|---|---|---|---|
| 连接超时（2s） | 中止本次请求 | 是（指数退避） | 是 |
| 读超时（5s） | 中止本次请求 | 是 | 是 |
| `401` | 刷新 Token 一次 | 仅一次 | 是 |
| `403 INSUFFICIENT_SCOPE` | 不重试，告警 | 否 | 是 |
| `403 PRODUCT_NOT_RELEASED` | 不重试；保留本地已发布版本 | 否 | 是 |
| `404` | 不重试；标记资源不存在 | 否 | 视资源而定 |
| `410 PRODUCT_RELEASE_REVOKED` | 不重试；立即停止公开展示该产品技术数据 | 否 | **否**（不得继续读缓存展示） |
| `410 CATEGORY_RETIRED` | 不重试；停止该分类的新同步 | 否 | 是（保留旧分类页与历史映射，不得新建归属） |
| `429` | 按 `Retry-After` 等待 | 是 | 是 |
| `5xx` | 指数退避 + 抖动，最多 3 次 | 是 | 是 |
| 网络不可达 | 熔断 | 恢复探测 | 是 |

退避建议：1s → 2s → 4s（±20% 抖动），第三次失败后进入熔断。

### 4.8 熔断

- 连续 5 次失败（超时/5xx/连接错误）→ 打开熔断 60 秒。
- 打开期间同步任务不再发起请求，直接使用本地数据并写告警。
- 60 秒后进入半开：放 1 个探测请求；成功则关闭，失败则再开 60 秒。
- 熔断状态存于缓存，跨进程可见（FileCache 在多进程下需注意一致性；生产建议用 Redis 或数据库锁，`OPEN`）。

### 4.9 HTTPS 要求

- 生产、预发、测试环境全部强制 HTTPS（TLS 1.2+）。
- 仅 `stub` 模式允许回环地址 HTTP。
- HSTS 在网关层启用；证书到期监控纳入告警。
- 禁止通过代理重写降级到 HTTP。

### 4.10 未来扩展

| 场景 | 扩展方式 |
|---|---|
| 多租户 | 同一 Token 端点，`aud` 绑定租户；scope 不变 |
| 用户委托 | Authorization Code + PKCE，新增 `openid profile` 类 scope |
| 第三方应用 | 独立 client 注册 + 最小 scope + 速率配额 |
| 写操作 | 新增 scope（如 `product.draft.write`）与 `Idempotency-Key`；不在 v1 开放 |

---

## 5. Business API 基础规范

> 状态：全部 `PROPOSED`。

### 5.1 Base URL 与版本

| 环境 | Base URL |
|---|---|
| 本地 Stub | `http://127.0.0.1:8787/api/v1`（仅回环，静态桩） |
| Dev | `https://dev-dsbit.<domain>/api/v1`（`OPEN`） |
| Staging | `https://staging-dsbit.<domain>/api/v1`（`OPEN`） |
| Production | `https://dsbit.<domain>/api/v1`（`OPEN`，需 Phase 4 审批） |

- 版本在路径中：`/api/v1`。
- v1 内只做**加法**：新增字段、新增端点、新增可选参数；不删除、不改语义、不改类型。
- 破坏性变更升 `/api/v2`，v1 至少保留 180 天并发送 `Sunset` 头。

### 5.2 传输与编码

- `Content-Type: application/json; charset=utf-8`。
- 请求与响应均为 UTF-8 JSON。
- 不接受表单（Token 端点除外）。
- 响应禁止包含 HTML、二进制、PDF。
- 压缩：支持 `Accept-Encoding: gzip`；响应体不因压缩改变语义。

### 5.3 字段命名与类型

| 项 | 规范 |
|---|---|
| 字段名 | `snake_case` |
| ID | 字符串；新资源使用 **`<type>_<ULID>`**：类型前缀 + 下划线 + 26 字符 Crockford Base32 ULID（大小写敏感，统一大写）；总长度 ≤ 32；不使用自增整数作为对外 ID |
| ID 前缀 | `tax_` / `cat_` / `prd_` / `edg_` / `ev_` / `par_` / `doc_` / `rel_` / `apr_` / `chg_` / `req_`；前缀只用于可读性，**不参与**唯一性判断 |
| 数据库长度 | 所有保存对外 ID 的列使用 `VARCHAR(32)`（不是 26），为前缀预留空间 |
| 布尔 | `true` / `false`，不使用 0/1 |
| 数值参数 | 以**字符串**返回 `value/min/typ/max`，避免浮点精度丢失；`unit` 单独字段 |
| 空值 | 明确 `null` 或省略；不返回空字符串表示"未知" |
| 枚举 | 大写 `SNAKE_CASE`；新增枚举值视为兼容变更，客户端必须容错 |
| 数组 | 无数据返回 `[]`，不返回 `null` |

### 5.4 时间

- 全部使用 ISO 8601 UTC，带 `Z`：`2026-11-17T03:20:11Z`。
- 不接受本地时区偏移作为存储值；客户端负责本地化展示。
- 精度：秒；版本比较使用 `data_version`，不依赖时间戳排序。

### 5.5 分页

- 游标分页（cursor-based），不使用 offset 深翻。
- 参数：`limit`（默认 50，最大 200）、`cursor`（不透明字符串）。
- 响应 `meta`：

```json
{
  "limit": 50,
  "next_cursor": "eyJ2Ijo0MiwiaWQiOiJjYXRfMDFK...",
  "has_more": true
}
```

- 游标内容对客户端不透明；不得解析或构造。
- 分类树接口支持 `mode=flat|tree`；`tree` 最大深度 4、节点上限 5000，超出返回 `413 TREE_TOO_LARGE` 并要求改用 `flat` + 增量。

### 5.6 排序与过滤

- `sort`：`field:asc|desc`，仅允许白名单字段（`updated_at`、`sort_order`、`level`、`category_code`）。
- 过滤：显式参数（`updated_since`、`status`、`taxonomy_id`、`mpn`、`release_state`）。
- 未知过滤参数返回 `400 UNKNOWN_FILTER`，不静默忽略。

### 5.7 统一响应包与错误结构

**决策（`PROPOSED`，`OPEN` 待确认）**：采用项目现有的统一响应包，而不是再引入第二套 `error` 对象。

原因：`platform/docs/phase1/03-api-contract.yaml:9-14` 已经定义了
`{code, message, data, request_id, meta}` 与"`code=0` 成功"的约定；
Morrishk 侧已经有对应的前端 `ApiError` 解析逻辑（`platform/web/src/lib/api/client.ts`）。
再定义一套 `{"error": {...}}` 会让同一组织内的两个 API 出现两种错误形状。

成功：

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRT",
  "meta": {}
}
```

失败：

```json
{
  "code": 40302,
  "message": "Product data is not released",
  "data": null,
  "request_id": "req_01J8Z9K2V3ABCDEFGHJKMNPQRT",
  "meta": {
    "error_key": "PRODUCT_NOT_RELEASED",
    "retryable": false,
    "degraded_allowed": true
  }
}
```

四个维度必须同时可判定：

1. **HTTP 状态码**（传输层语义）。
2. **业务错误码** `code`（稳定整数）+ `meta.error_key`（稳定字符串，便于日志检索）。
3. **`meta.retryable`**（是否可重试）。
4. **`meta.degraded_allowed`**（是否允许读取本地缓存降级）。

任务书给出的 `{"error": {"code": "PRODUCT_NOT_RELEASED", ...}}` 结构是**建议格式**；
本设计将其字段映射到上表，映射关系见附录 B。若客户/Reviewer 要求保留字符串错误对象，
只需替换外层形状，不影响错误码与重试语义。

### 5.8 HTTP 状态码与业务错误码

| HTTP | `code` | `error_key` | 含义 | 可重试 | 可降级 |
|---|---|---|---|---|---|
| 200 | 0 | `OK` | 成功 | — | — |
| 304 | 0 | `NOT_MODIFIED` | ETag 命中 | — | — |
| 400 | 40001 | `INVALID_ARGUMENT` | 参数缺失/非法 | 否 | 否 |
| 400 | 40002 | `UNKNOWN_FILTER` | 未知过滤参数 | 否 | 否 |
| 401 | 40101 | `INVALID_TOKEN` | Token 无效 | 刷新后一次 | 是 |
| 401 | 40102 | `TOKEN_EXPIRED` | Token 过期 | 刷新后一次 | 是 |
| 403 | 40301 | `INSUFFICIENT_SCOPE` | scope 不足 | 否 | 是 |
| 403 | 40302 | `PRODUCT_NOT_RELEASED` | 产品存在但未发布 | 否 | 是 |
| 403 | 40303 | `CATEGORY_NOT_PUBLISHED` | 分类未发布 | 否 | 是 |
| 404 | 40401 | `PRODUCT_NOT_FOUND` | 产品不存在 | 否 | 视情况 |
| 404 | 40402 | `CATEGORY_NOT_FOUND` | 分类不存在 | 否 | 视情况 |
| 404 | 40403 | `TAXONOMY_NOT_FOUND` | 分类体系不存在 | 否 | 视情况 |
| 409 | 40901 | `VERSION_CONFLICT` | 版本冲突 | 是（重新拉取） | 是 |
| 410 | 41001 | `PRODUCT_RELEASE_REVOKED` | 发布已撤回，必须停止展示 | 否 | **否**（不得继续用产品缓存） |
| 410 | 41002 | `CATEGORY_RETIRED` | 分类已过保留期 | 否 | 是（保留旧分类页与历史映射） |
| 413 | 41301 | `TREE_TOO_LARGE` | 树超出上限 | 否（改 flat） | 是 |
| 429 | 42901 | `RATE_LIMITED` | 限流 | 是 | 是 |
| 500 | 50001 | `INTERNAL_ERROR` | 内部错误 | 是 | 是 |
| 503 | 50301 | `SERVICE_UNAVAILABLE` | 服务不可用 | 是 | 是 |
| 503 | 50302 | `DATA_NOT_READY` | 数据未就绪 | 是 | 是 |

### 5.9 请求追踪

- 客户端发送 `X-Request-Id`（8–64 字符，允许 `A-Za-z0-9_-`）。
- 服务端若收到则回显；未收到则生成 `req_<ULID>`。
- 响应头 `X-Request-Id` 与响应体 `request_id` 必须一致。
- 日志以 `request_id` 为关联键，不记录 Token 与 secret。

### 5.10 幂等性

- v1 全部为只读 `GET`，天然幂等。
- 保留 `Idempotency-Key` 规范给未来写接口：同一 key 在 24h 内重放返回首次结果。
- 同步任务自身必须幂等：以稳定 ID + 版本号 upsert，重复执行不产生重复行。

### 5.11 限流

| 维度 | 建议 |
|---|---|
| 每客户端 | 60 请求/分钟；突发 20 |
| 每端点 | 分类树 10 请求/分钟；搜索 30 请求/分钟 |
| 响应头 | `X-RateLimit-Limit`、`X-RateLimit-Remaining`、`X-RateLimit-Reset` |
| 超限 | `429 RATE_LIMITED` + `Retry-After`（秒） |

同步任务必须主动节流（串行 + 页间 sleep），不得把限流当作正常流控。

### 5.12 版本兼容与弃用

- v1 内新增字段：客户端必须忽略未知字段。
- 删除字段/改类型：升 v2。
- 弃用流程：文档标注 → 响应头 `Deprecation: true` + `Sunset: <HTTP-date>` → 至少 90 天 → 下线。
- 分类枚举新增值：客户端按"未知值保留原样、不崩溃"处理。

### 5.13 数据更新与版本标识

每个资源必须带：

| 字段 | 含义 |
|---|---|
| `updated_at` | 最近一次内容更新时间（UTC） |
| `data_version` | 单调递增整数；同一资源每次内容变更 +1 |
| `etag` | 强 ETag，响应体规范化 JSON 的 SHA-256 |
| `taxonomy_version` | 仅分类资源；分类体系版本 |

`updated_at` 只用于展示与增量过滤，**不用于并发控制**；并发控制用 `data_version` / ETag。

### 5.14 响应头

| 头 | 说明 |
|---|---|
| `ETag` | 强 ETag |
| `Last-Modified` | `updated_at`（秒级） |
| `X-Request-Id` | 追踪 ID |
| `X-Data-Version` | 资源 `data_version` |
| `X-Taxonomy-Version` | 分类资源专用 |
| `Cache-Control` | `private, max-age=0, must-revalidate` |
| `X-RateLimit-*` | 限流 |
| `Deprecation` / `Sunset` | 弃用 |

---

## 6. 产品数据 API

> 状态：全部 `PROPOSED`。产品 DTO 不得直接返回解析器原始 JSON。

### 6.1 端点了列表

| 端点 | 版本 | 说明 |
|---|---|---|
| `GET /products/{product_id}` | `V1_REQUIRED` | 产品业务 DTO |
| `GET /products/search` | `V1_REQUIRED` | 增量同步与 MPN 查找 |
| `GET /products/{product_id}/status` | `V1_REQUIRED` | 三层门禁状态 |
| `GET /products/{product_id}/versions` | `V1_REQUIRED` | 内容版本列表 |
| `GET /products/{product_id}/evidence` | `V1_REQUIRED` | 证据引用 |
| `GET /products/{product_id}/categories` | `V1_REQUIRED` | 产品分类归属（权威边） |

`GET /products/search` 同时承担 MPN 精确查找：`?mpn=LM358DR&mpn_match=exact`。
不额外设计 `/products/by-mpn`，避免端点膨胀。

### 6.2 产品身份

| 字段 | 说明 | 现状 |
|---|---|---|
| `product_id` | Ds Bit 全局稳定 ID（ULID） | `PROPOSED`；引擎现有 `Product.product_id` 是文档内 ID，需注册表映射（`OPEN` IQ-01） |
| `mpn` | 原始型号，保留大小写 | `CONFIRMED` 引擎有 `requested_mpn`/`normalized_mpn` |
| `mpn_norm` | 归一化型号（大写、去空白） | `PROPOSED` 对外字段；规则需与 Morrishk `MpnNormalizer` 对齐 |
| `manufacturer` | 制造商 | `CONFIRMED` 引擎字段 |
| `package` | 封装 | `CONFIRMED` 引擎字段 |
| `identity_scope` | `DEVICE/BOARD/ONBOARD_DEVICE/UNKNOWN` | `CONFIRMED` 引擎枚举 |
| `product_type` | `IC/BOARD/MODULE/UNKNOWN` | `CONFIRMED` 引擎枚举 |
| `identity_evidence` | 身份证据引用 | `CONFIRMED` 引擎字段；对外只返回引用 |

**不得**把 `requested_mpn` 与 `normalized_mpn` 合并为一个字段。

### 6.3 产品 DTO 分层

产品响应必须分层，避免"一个巨大对象"：

```json
{
  "product_id": "prd_01J8Z9K2V4ABCDEFGHJKMNPQRS",
  "identity": {
    "mpn": "LM358DR",
    "mpn_norm": "LM358DR",
    "manufacturer": "Texas Instruments",
    "package": "SOIC-8",
    "identity_scope": "DEVICE",
    "product_type": "IC"
  },
  "technical": {
    "parameter_set_version": 7,
    "parameters": [
      {
        "parameter_id": "par_01J8H000000000000000000000",
        "name": "Supply Voltage",
        "category": "ELECTRICAL",
        "value": null,
        "min": "3",
        "typ": null,
        "max": "32",
        "unit": "V",
        "conditions": "TA = 25 C",
        "verification_status": "VERIFIED",
        "evidence_ids": ["ev_01J8J000000000000000000000"]
      }
    ],
    "normalization": {
      "unit_system": "SI",
      "normalized_at": "2026-11-10T08:00:00Z"
    }
  },
  "categories": {
    "taxonomy_id": "tax_01J8Z9K2V3ABCDEFGHJKMNPQRS",
    "refs": [
      {
        "category_id": "cat_01J8C000000000000000000000",
        "role": "PRIMARY",
        "assigned_at": "2026-11-10T08:00:00Z"
      }
    ],
    "note": "完整分类节点请调用 /categories/{category_id}；产品响应只给引用。"
  },
  "documents": [
    {
      "document_id": "doc_01J8N000000000000000000000",
      "document_sha256": "059d448c5a34a4b1...",
      "document_type": "datasheet",
      "page_count": 24
    }
  ],
  "release": {
    "content_version": 7,
    "release_id": "rel_01J8P000000000000000000000",
    "release_version": 3,
    "released_at": "2026-11-12T10:00:00Z"
  },
  "updated_at": "2026-11-12T10:00:00Z",
  "data_version": 7
}
```

**关键约束**：

1. `categories` 只放**引用**，不放分类树/名称/路径。名称与路径必须从分类 API 或本地分类缓存解析。
   这样分类改名不会导致产品缓存整体失效。
2. `technical.parameters` 只包含通过正式容器校验的参数（`VERIFIED/AUDITED`）；
   `UNRESOLVED/QUARANTINED/REJECTED` 不出现在正式响应中，可在 `status` 端点统计中体现。
3. 不返回原始 `param_blocks`、`candidates.json`、`gold_eval` 等解析中间产物。
4. `documents` 不返回 PDF 二进制或可下载 URL；仅元数据与 SHA-256。

### 6.4 `GET /products/search`

参数：

| 参数 | 说明 |
|---|---|
| `mpn` + `mpn_match=exact|loose` | 型号查找 |
| `updated_since` | ISO 8601；增量同步 |
| `release_state` | `RELEASED`（默认）、`REVOKED`、`PENDING`（需 `product.publish.read`） |
| `taxonomy_id` + `category_id` | 按分类过滤 |
| `limit` + `cursor` | 分页 |
| `include_unreleased=true` | 仅 `product.publish.read` 可用 |

默认只返回 `RELEASED`。`REVOKED` 流用于让 Morrishk 感知撤回，**必须**支持（`V1_REQUIRED`），
否则已发布产品被撤回后，消费方无法发现。

### 6.5 `GET /products/{id}/status`

返回三层门禁状态，而不是一个布尔值：

```json
{
  "product_id": "prd_01J8Z9K2V4ABCDEFGHJKMNPQRS",
  "gates": {
    "pipeline": {
      "state": "PASS",
      "pipeline_run_id": "V101-20261112T231416Z-ff12",
      "evaluated_at": "2026-11-12T09:00:00Z"
    },
    "content": {
      "state": "APPROVED",
      "approved_at": "2026-11-12T09:30:00Z",
      "approval_ref": "apr_01J8T000000000000000000000"
    },
    "release": {
      "state": "APPROVED",
      "release_id": "rel_01J8P000000000000000000000",
      "release_version": 3,
      "released_at": "2026-11-12T10:00:00Z"
    }
  },
  "visible_state": "RELEASED",
  "updated_at": "2026-11-12T10:00:00Z"
}
```

`state` 取值见 §9。

### 6.6 `GET /products/{id}/versions`

返回内容版本列表（分页），每项含：

- `content_version`（整数）
- `release_version`（整数或 `null`）
- `pipeline_run_id`
- `content_approved_at`
- `released_at`
- `change_summary`（字符串，可为空）
- `is_current`

不在 v1 提供"回滚"写操作。回滚属于 Ds Bit 内部流程。

### 6.7 `GET /products/{id}/evidence`

返回证据引用数组：

```json
{
  "product_id": "prd_01J8Z9K2V4ABCDEFGHJKMNPQRS",
  "document_sha256": "059d448c5a34a4b1...",
  "items": [
    {
      "evidence_id": "ev_01J8J000000000000000000000",
      "evidence_type": "CELL_TEXT",
      "page_number": 7,
      "table_id": "tbl_3",
      "row_id": "r_12",
      "cell_id": "c_4",
      "bbox": [72.0, 410.5, 180.2, 421.0],
      "raw_text": "3 V to 32 V",
      "screenshot_reference": "runs/V101/pages/page-0007.png",
      "document_sha256": "059d448c5a34a4b1..."
    }
  ]
}
```

约束：

- `screenshot_reference` 是**本地相对路径**，不是可直接访问的 URL；对外是否提供下载需单独授权（`OPEN` IQ-08）。
- `raw_text` 限制长度（建议 ≤ 500 字符），避免大段原文外泄。
- 不返回 PDF 二进制。

### 6.8 产品 API 与 Morrishk 现有模型的映射

| Ds Bit DTO | Morrishk 旧站字段 | 说明 |
|---|---|---|
| `identity.mpn` | `snsii_product.PartNumber` | 用于匹配 |
| `identity.mpn_norm` | 无（新平台 `pd_model.mpn_norm`） | 旧站需新增归一化比较（应用层） |
| `identity.manufacturer` | `snsii_supplier.Name`（通过 `Mid`） | 旧站没有独立品牌字段 |
| `identity.package` | `DataAttr` 中的键（手工 JSON） | 结构不一致，需映射 |
| `technical.parameters` | `snsii_product.DataAttr` | 旧站为扁平 JSON，需转换；不得覆盖原值 |
| `categories.refs[].category_id` | `BigCat`/`SmallCat` | 只能通过显式映射，不得直接用 Ds Bit ID 写入 |
| `documents[].document_sha256` | `snsii_product.PdfId`/`Pdf` | 旧站无 SHA；需新增关联列或映射表 |
| `release.content_version` | 无 | 旧站无版本概念 |

---

## 7. 产品分类 API（本设计重点）

> 这是本设计的**一等子系统**，不是产品详情里的一个 `category` 字段。
> 状态：Ds Bit 侧全部 `PROPOSED`；Morrishk 侧业务分类 `CONFIRMED` 存在，但映射层 `PROPOSED`。

### 7.1 必须先区分的五类"分类"

这五类概念在现有系统中被混用，必须分开建模、分别授权、分别版本化。

| 概念 | 定义 | 当前载体 | 是否树 | 是否用于 URL | 归属 |
|---|---|---|---|---|---|
| **技术产品分类**（Technical Taxonomy） | 电子元器件技术品类，如"运算放大器 / 通用运放" | **不存在** | 是 | 否（不进入 URL） | Ds Bit（`PROPOSED`） |
| **器件身份 / 产品族**（Device Identity / Product Family） | 一个具体器件的身份：MPN、厂商、封装、`identity_scope`、`product_type`、系列 | `Product` 领域模型 | 否（属性集合，可选 series 层级） | 否 | Ds Bit（`CONFIRMED` 字段） |
| **文档类型**（Document Type） | 这份 PDF 是什么：datasheet / user guide / errata / EVM / app note / OCR | `DocumentType`、`SemanticDocType`、`DocType`、`Route` | 否（枚举 + 路由） | 否 | Ds Bit（`CONFIRMED`） |
| **Morrishk 业务/导航分类** | 网站左侧/顶部导航与大类小类 | 旧站 `snsii_product_category`；新平台 `pd_category` | 是（两级） | **是**（`Links` / `slug` 进入 URL） | Morrishk |
| **SEO 落地页分类** | 为搜索流量组织的落地页集合，可能与导航分类不一致 | 无独立数据模型 | 可能是 | 是 | Morrishk（`PROPOSED`） |

另外，`ParameterCategory`（`ELECTRICAL/ABSOLUTE_MAXIMUM/...`）是**参数分组**，
不是产品分类，也不进入分类 API。

**禁止**：

- 把 `DocumentType` 当作产品分类返回；
- 把 `identity_scope` / `product_type` 当作分类节点；
- 把 Morrishk 的 `snsii_product_category.id` 当作 Ds Bit 的 `category_id`；
- 假定技术分类与 Morrishk 导航分类一一对应。

### 7.2 分类数据模型（`PROPOSED`）

#### 7.2.1 Taxonomy（分类体系）

| 字段 | 类型 | 说明 |
|---|---|---|
| `taxonomy_id` | string(32) | ULID，永久稳定，不复用 |
| `taxonomy_code` | string(64) | 稳定业务编码，如 `electronic-components`；发布后不可改 |
| `name` | string(200) | 展示名 |
| `description` | text | 体系说明 |
| `taxonomy_version` | integer | 单调递增；每次发布变更 +1 |
| `status` | enum | `DRAFT` / `REVIEWED` / `PUBLISHED` / `DEPRECATED` |
| `root_category_ids` | string[] | 根节点 |
| `created_at` / `updated_at` | datetime | UTC |
| `published_at` / `deprecated_at` | datetime? | |

v1 只允许**一个** `PUBLISHED` 的技术分类体系（`OPEN` IQ-02：是否需要多体系，如按产品线拆分）。
API 支持多体系，是为了未来扩展，不代表 v1 必须启用多个。

#### 7.2.2 Category（分类节点）

| 字段 | 类型 | 说明 |
|---|---|---|
| `category_id` | string(32) | ULID；永久稳定；改名不变；不复用 |
| `taxonomy_id` | string(32) | 所属体系 |
| `parent_id` | string(32)? | 父节点；`null` 为根 |
| `category_code` | string(64) | 稳定编码；发布后不可改；用于外部映射 |
| `name` | string(200) | 名称 |
| `slug` | string(120) | **建议值**，不是权威 URL；Morrishk 可不用 |
| `description` | text | 技术描述；**不得**直接作为 SEO 文案 |
| `level` | integer | 1 起 |
| `path_ids` | string[] | 从根到自身的 ID 路径（不含自身或含自身需固定语义；本设计为**含自身**） |
| `path_codes` | string[] | 对应的 code 路径 |
| `is_active` | boolean | 是否可用于新归属 |
| `sort_order` | integer | 展示顺序建议 |
| `aliases` | object[] | `{lang, value}`；同义词/旧名 |
| `external_codes` | object[] | `{scheme, code}`；如 `morrishk_legacy` |
| `status` | enum | `DRAFT` / `REVIEWED` / `PUBLISHED` / `DEPRECATED` |
| `merged_into` | string(32)? | 合并目标；仅 `DEPRECATED` 时可有 |
| `split_into` | string[] | 拆分目标；仅 `DEPRECATED` 时可有 |
| `created_at` / `updated_at` | datetime | |
| `published_at` / `deprecated_at` | datetime? | |
| `data_version` | integer | 节点级版本 |

#### 7.2.3 Product-Category Edge（产品分类归属）

| 字段 | 类型 | 说明 |
|---|---|---|
| `edge_id` | string(32) | `<type>_<ULID>`；边身份永不复用 |
| `product_id` | string(32) | 产品 |
| `taxonomy_id` | string(32) | 体系 |
| `category_id` | string(32) | 分类 |
| `role` | enum | `PRIMARY` / `SECONDARY` |
| `assignment_source` | enum | `PARSER` / `RULE` / `MANUAL` |
| `confidence` | decimal(5,2)? | 0–100；`MANUAL` 可为空 |
| `status` | enum | `PROPOSED` / `APPROVED` / `REJECTED` |
| `valid_from` | datetime | 边生效时间 |
| `valid_to` | datetime? | 边失效时间；`NULL` 表示当前有效 |
| `superseded_by_edge_id` | string(32)? | 替代边；分类合并/拆分导致的迁移 |
| `superseded_at` | datetime? | 被替代时间 |
| `change_reason` | string(64)? | `CATEGORY_MERGED` / `CATEGORY_SPLIT` / `MANUAL_REASSIGN` 等 |
| `data_version` | integer | 边级版本 |
| `created_at` / `updated_at` | datetime | |

规则：

- 一个产品在同一 taxonomy 下**最多一个当前有效的 `PRIMARY`**（`valid_to IS NULL` 且 `status=APPROVED`）（`PROPOSED`，`OPEN` IQ-04）。
- 允许一个产品属于多个分类（多对多）。
- 只有**当前有效**（`valid_to IS NULL`）且 `APPROVED` 的边才对业务客户端可见。
- 产品详情 API 只返回当前有效、`APPROVED` 的边；历史边可通过内部审计读取，不对外暴露。
- **边不物理删除（回应 R8）**：重新分配、分类合并、分类拆分都采用"旧边置 `valid_to` + `superseded_by_edge_id`，新边另建"的方式；任何历史时刻都可还原。
- 同一产品在同一 taxonomy 下的历史 `PRIMARY` 边可以存在多条，但同一时间只能有一条 `valid_to IS NULL`（应用层保证；MySQL 5.6 无部分唯一索引）。

#### 7.2.4 分类 ID 的稳定性规则

| 问题 | 规则 |
|---|---|
| 分类 ID 是否长期稳定 | 是。`category_id` 一经发布永不复用、永不改变 |
| 改名是否影响 ID | 否。改名只增加 `data_version` 与 `updated_at` |
| 移动父节点是否影响 ID | 否。`path_ids`/`path_codes` 变化，ID 不变 |
| 合并 | 源节点保留，`status=DEPRECATED`、`merged_into=目标`、`is_active=false`；**旧产品边不删除**：置 `valid_to`、`superseded_by_edge_id`、`change_reason='CATEGORY_MERGED'`，再为目标分类新建边（需 `APPROVED`）；源节点在保留期内仍可解析 |
| 拆分 | 源节点 `DEPRECATED`、`split_into=[...]`；旧边置 `valid_to` + `change_reason='CATEGORY_SPLIT'`；产品边需人工重新分配，不自动推断 |
| 停用 | `is_active=false`、`status=DEPRECATED`、无 `merged_into`；不自动重定向 |
| 硬删除 | **禁止**。被任何历史边引用过的分类节点不得物理删除；保留期结束后进入 tombstone，仅对外返回 `410 CATEGORY_RETIRED` |
| ID 复用 | **禁止**。任何已分配的 `category_id` 永不复用，即使节点已退役 |

**分类节点生命周期（回应 R8）**：

1. 历史 Product-Category Edge **永不物理删除**；失效只写 `valid_to`、`superseded_by_edge_id`、`superseded_at`、`change_reason`。
2. 只要仍有历史边引用该节点，分类节点就**不得物理删除**；保留期结束后保留 tombstone（或等效生命周期记录）。
3. Tombstone 至少保留：`category_id`、`taxonomy_id`、`retired_at`、`retirement_reason`、`merged_into` / `split_into`（如有）、`last_data_version`。
4. `410 CATEGORY_RETIRED` 仅表示 **API 对外退役**，不表示数据库行被删除，也不表示历史映射失效。
5. 分类 ID 一经分配即永不复用；恢复（`CATEGORY_REACTIVATED`）只能复用原 ID，不能新建同义 ID。

### 7.3 分类版本与变更

- `taxonomy_version`：整数，每次**发布**的分类变更集 +1。
- 每次变更产生 `change_id`（ULID）与事件类型：

| 事件 | 说明 | 是否影响映射 |
|---|---|---|
| `CATEGORY_CREATED` | 新增节点 | 否（待人工映射） |
| `CATEGORY_RENAMED` | 改名/改描述 | 否（ID 不变） |
| `CATEGORY_MOVED` | 改父节点 | 否（ID 不变；路径变） |
| `CATEGORY_MERGED` | 合并 | **是**（映射需迁移） |
| `CATEGORY_SPLIT` | 拆分 | **是**（映射需人工） |
| `CATEGORY_DEPRECATED` | 停用 | **是**（映射需标记 STALE） |
| `CATEGORY_REACTIVATED` | 恢复 | 是 |
| `EDGE_ADDED` / `EDGE_REMOVED` | 产品归属变化 | 否（产品侧处理） |

- 变更记录不可变；不提供"删除变更"。
- `GET /taxonomies/{id}/changes?since_version=N` 返回 `N` 之后的变更。
- `updated_since` 与 `since_version` 二选一；推荐版本号，时间戳只作辅助。

### 7.4 分类 API 端点

| 端点 | 版本 | 说明 |
|---|---|---|
| `GET /taxonomies` | `V1_REQUIRED` | 列出分类体系 |
| `GET /taxonomies/{taxonomy_id}` | `V1_REQUIRED` | 体系详情 |
| `GET /taxonomies/{taxonomy_id}/categories` | `V1_REQUIRED` | 分类节点列表；`mode=flat|tree`；增量用 `updated_since=&cursor=`（同一端点） |
| `GET /categories/{category_id}` | `V1_REQUIRED` | 单节点 + 父/子引用 |
| `GET /categories/{category_id}/children` | `V1_REQUIRED` | 直接子节点 |
| `GET /categories/{category_id}/ancestors` | `V1_OPTIONAL` | 祖先链；可由 `path_ids` 推导，但面包屑需要名称时更省请求 |
| `GET /taxonomies/{taxonomy_id}/version` | `V1_REQUIRED` | 版本与 ETag；同步前置检查 |
| `GET /taxonomies/{taxonomy_id}/changes` | `V1_OPTIONAL` | 变更记录；合并/拆分/停用需要 |
| `GET /products/{product_id}/categories` | `V1_REQUIRED` | 产品→分类边；内部读取用 `?internal_only=true`，需双 scope，见 §4.4 规则 4 |
| `GET /categories/{category_id}/products` | `V1_OPTIONAL` | 分类→产品；v1 可由 Morrishk 本地反查，避免大列表 |
| `GET /taxonomies/{taxonomy_id}/tree` | `FUTURE` | 独立全量树快照；v1 用 `categories?mode=tree` |
| `POST /taxonomies/...`（写） | `FUTURE` | v1 只读 |

**V1 最小端点集（7 个，全部 `V1_REQUIRED`）**：

1. `GET /taxonomies`
2. `GET /taxonomies/{id}`
3. `GET /taxonomies/{id}/version`
4. `GET /taxonomies/{id}/categories?updated_since=&cursor=`
5. `GET /categories/{id}`
6. `GET /categories/{id}/children`
7. `GET /products/{id}/categories`（同时受 `product.category.read` 与产品发布门禁约束，见 §4.4 规则 4）

`changes` 与 `ancestors` 为 `V1_OPTIONAL`；若 Phase 0 决定要支持自动识别合并/拆分，
则 `changes` 升级为 `V1_REQUIRED`。

> 口径说明：§7.4 端点表中 `GET /taxonomies/{taxonomy_id}` 为 `V1_REQUIRED`，
> 因此 V1 必需分类端点总数是 **7**，不是 6。

### 7.5 分类响应结构（示例见 `API_CONTRACT_EXAMPLES.md`）

#### 7.5.1 分类体系

```json
{
  "taxonomy_id": "tax_01J8Z9K2V3ABCDEFGHJKMNPQRS",
  "taxonomy_code": "electronic-components",
  "name": "Electronic Components",
  "description": "Technical taxonomy for semiconductor and passive components",
  "taxonomy_version": 42,
  "status": "PUBLISHED",
  "root_category_ids": ["cat_01J8A000000000000000000000", "cat_01J8B000000000000000000000"],
  "created_at": "2026-10-01T00:00:00Z",
  "updated_at": "2026-11-15T06:00:00Z",
  "published_at": "2026-10-02T00:00:00Z"
}
```

#### 7.5.2 分类树 / 分页节点

`mode=flat`（默认）返回分页列表；`mode=tree` 返回嵌套 `children`，受深度与节点上限约束。

节点示例：

```json
{
  "category_id": "cat_01J8A000000000000000000000",
  "taxonomy_id": "tax_01J8Z9K2V3ABCDEFGHJKMNPQRS",
  "parent_id": null,
  "category_code": "integrated-circuits",
  "name": "Integrated Circuits",
  "slug": "integrated-circuits",
  "description": "Monolithic integrated circuits",
  "level": 1,
  "path_ids": ["cat_01J8A000000000000000000000"],
  "path_codes": ["integrated-circuits"],
  "is_active": true,
  "sort_order": 10,
  "aliases": [{"lang": "en", "value": "ICs"}],
  "external_codes": [{"scheme": "morrishk_legacy", "code": "101"}],
  "status": "PUBLISHED",
  "merged_into": null,
  "split_into": [],
  "updated_at": "2026-11-10T08:00:00Z",
  "data_version": 5
}
```

#### 7.5.3 单个分类及父子关系

`GET /categories/{id}` 返回节点本身 + `parent`（精简引用）+ `children`（精简引用，最多 200 个）。
完整子节点请调用 `/children` 分页。

#### 7.5.4 产品分类归属

```json
{
  "product_id": "prd_01J8Z9K2V4ABCDEFGHJKMNPQRS",
  "taxonomy_id": "tax_01J8Z9K2V3ABCDEFGHJKMNPQRS",
  "categories": [
    {
      "category_id": "cat_01J8C000000000000000000000",
      "role": "PRIMARY",
      "assignment_source": "MANUAL",
      "confidence": null,
      "assigned_at": "2026-11-10T08:00:00Z"
    }
  ]
}
```

#### 7.5.5 版本与变更

```json
{
  "taxonomy_id": "tax_01J8Z9K2V3ABCDEFGHJKMNPQRS",
  "taxonomy_version": 42,
  "status": "PUBLISHED",
  "published_at": "2026-11-15T06:00:00Z",
  "etag": "\"sha256:9f2c...\"",
  "last_change_id": "chg_01J8F000000000000000000000"
}
```

变更记录：

```json
{
  "taxonomy_id": "tax_01J8Z9K2V3ABCDEFGHJKMNPQRS",
  "since_version": 40,
  "taxonomy_version": 42,
  "changes": [
    {
      "change_id": "chg_01J8V000000000000000000000",
      "taxonomy_version": 41,
      "event": "CATEGORY_MERGED",
      "occurred_at": "2026-11-14T02:00:00Z",
      "category_id": "cat_01J8X000000000000000000000",
      "payload": {
        "merged_into": "cat_01J8Y000000000000000000000",
        "reason": "duplicate definition"
      }
    }
  ],
  "meta": {"has_more": false, "next_cursor": null}
}
```

#### 7.5.6 分类停用 / 合并后的兼容响应

- `GET /categories/{id}` 对 `DEPRECATED` 节点返回 `200`，并带：

```json
{
  "category_id": "cat_01J8X000000000000000000000",
  "status": "DEPRECATED",
  "is_active": false,
  "merged_into": "cat_01J8Y000000000000000000000",
  "deprecated_at": "2026-11-14T02:00:00Z",
  "data_version": 9
}
```

- 保留期（建议 180 天，`OPEN` IQ-05）后返回 `410 CATEGORY_RETIRED`。
- `410` **仅表示 API 对外退役**，不表示数据库删除；节点仍以 tombstone 或等效生命周期记录保留。
- 被任何历史产品分类边引用的节点**不得物理删除**；历史边与其 `valid_to` / `superseded_by_edge_id` 一并保留。
- `category_id` 永不复用；恢复时只能复用原 ID（见 §7.2.4）。
- **不返回 301/302**。API 不负责 HTTP 重定向。

### 7.6 ETag、增量与通知

| 机制 | 设计 |
|---|---|
| ETag | 强 ETag；`If-None-Match` 命中返回 `304`，无响应体 |
| `Last-Modified` | 以 `updated_at` 填充；仅作辅助 |
| 增量 | `updated_since`（时间）+ `cursor`；推荐 `since_version`（版本） |
| 全量 | `mode=tree` 或 `flat` 全量分页；不得依赖单次响应 |
| 变更通知 | **不推送**；Morrishk 主动轮询 `version` / `changes`。理由：v1 不引入 webhook 的密钥、重放与可达性问题 |
| 删除 | 禁止物理删除；`status=DEPRECATED` + `is_active=false`；保留期后进入 tombstone 并对外 `410`；历史边引用保留 |
| 分类 ID 失效 | Morrishk 保留本地映射与旧页面；`mapping_status=STALE`；不自动删除、不改 URL |
| 历史 URL | Morrishk 自己的 URL 由 Morrishk 控制；API 不提供也不修改 URL |

### 7.7 分类审核与发布状态

分类状态：

| 状态 | 含义 | 业务客户端可见 |
|---|---|---|
| `DRAFT` | 新建/编辑中 | 否 |
| `REVIEWED` | 内容审核通过，待发布 | 否 |
| `PUBLISHED` | 已发布 | 是 |
| `DEPRECATED` | 停用/合并/拆分 | 可见（带状态），用于兼容 |

**分类发布与产品发布独立**：

| 分类状态 | 产品状态 | 网页可展示 | 说明 |
|---|---|---|---|
| `PUBLISHED` | `RELEASE_APPROVED` | 是 | 正常 |
| `PUBLISHED` | 未发布 | 否（产品不展示） | 分类页可有，但产品不能出现 |
| `DEPRECATED` | `RELEASE_APPROVED` | 视 Morrishk 业务决策 | 分类页可保留，产品可挂到新分类 |
| 未发布 | `RELEASE_APPROVED` | 否 | 分类未发布，业务分类页不应新建 |
| `DEPRECATED` | 未发布 | 否 | — |

结论：**"分类已发布"不代表该分类下所有产品可展示；"产品技术审核通过"也不代表分类映射已通过 Morrishk 业务审核。**

### 7.8 Morrishk 分类映射策略

#### 7.8.1 映射层表 `dsbit_category_mapping`（候选，`PROPOSED`）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | BIGINT UNSIGNED | 自增主键 |
| `dsbit_taxonomy_id` | VARCHAR(32) | Ds Bit 体系 ID |
| `dsbit_category_id` | VARCHAR(32) | Ds Bit 分类 ID |
| `morrishk_target` | ENUM('LEGACY_SNSII','PLATFORM_PD') | 目标库/表域 |
| `morrishk_category_id` | INT UNSIGNED | 目标分类 ID |
| `mapping_type` | ENUM('EXACT','PARENT','AGGREGATE','SEO_LANDING','MANUAL') | 映射类型 |
| `is_primary` | TINYINT(1) | 目标侧主映射 |
| `mapping_status` | ENUM('PROPOSED','APPROVED','REJECTED','STALE','UNMAPPED') | 审核状态 |
| `mapping_source` | ENUM('MANUAL','SEED','IMPORT') | 来源；**禁止 `NAME_MATCH` 作为自动来源** |
| `review_note` | VARCHAR(255) | 审核备注 |
| `reviewed_by` | VARCHAR(64) | 审核人 |
| `reviewed_at` | DATETIME | 审核时间 |
| `valid_from` | DATETIME | 生效时间 |
| `valid_to` | DATETIME NULL | 失效时间；`NULL` 为当前 |
| `created_at` / `updated_at` | DATETIME | |

索引建议：`(dsbit_taxonomy_id, dsbit_category_id, valid_to)`、`(morrishk_target, morrishk_category_id)`、
`(mapping_status)`。

#### 7.8.2 映射基数

| 场景 | 允许 | 说明 |
|---|---|---|
| 一对一 | 是 | 最常见 |
| 多个 Ds Bit 分类 → 一个 Morrishk 分类 | 是 | `AGGREGATE`；例如多个细分类合并到网站一个导航项 |
| 一个 Ds Bit 分类 → 多个 Morrishk 分类 | **有条件** | 仅 `APPROVED` 且显式创建多行；不得自动推断 |
| 无法映射 | 是 | 生成 `mapping_status='UNMAPPED'` 行，进入人工审核队列 |
| 分类变更后保留旧映射 | 是 | `valid_to` 标记失效，不物理删除 |
| 映射与 SEO URL 解耦 | 是 | 映射只决定"内容归属"，不决定 URL |

#### 7.8.3 映射规则

1. **严禁用分类名称字符串直接匹配作为唯一映射机制。**
   名称只用于人工审核时的提示，不参与自动写入。
2. 主要依据：`category_id`、`category_code`、`external_codes`、显式人工映射。
3. 自动流程只能创建 `PROPOSED` / `UNMAPPED`，不能创建 `APPROVED`。
4. `APPROVED` 必须由人工审核并记录 `reviewed_by` / `reviewed_at`。
5. 映射变化**不得**自动触发 Morrishk URL 变更或 301。
6. 映射变化**不得**自动改变既有分类页的 canonical。
7. 当 Ds Bit 分类 `DEPRECATED` / `MERGED` 时：
   - 相关映射置 `STALE`；
   - 保留 `valid_from`/`valid_to` 历史；
   - 生成人工任务；
   - 在人工确认前，页面继续使用旧映射与旧 URL。
8. 当 Ds Bit 分类改名：
   - 映射不变（ID 未变）；
   - Morrishk 页面标题/导航文案**不自动改**，由运营决定是否更新。

#### 7.8.4 映射到两套 Morrishk 分类

Morrishk 当前存在两套分类载体：

| 载体 | 表 | 层级 | URL | 备注 |
|---|---|---|---|---|
| 旧站 | `snsii_product_category` | 两级（`Pid=0`） | `/big-categories/...`、`/sub-categories/...` | 生产在用 |
| 新平台 | `pd_category` | 两级（`level`） | 新前端 `/categories/{slug}` | 未上线 |

因此映射表必须有 `morrishk_target` 字段，避免两套自增 ID 冲突。
v1 同步默认写入 `LEGACY_SNSII`；是否同时写 `PLATFORM_PD` 取决于新旧站切换决策（`OPEN` IQ-13）。

#### 7.8.5 映射审核队列

- `UNMAPPED` 与 `STALE` 行即审核队列，不另建表。
- 后台提供列表、筛选、批量审核（Phase 3，`PROPOSED`）。
- 审核动作只改映射状态，不直接改页面数据。
- 审核后由发布流程决定是否上页面。

### 7.9 分类数据校验

同步时必须校验：

| 校验 | 失败处理 |
|---|---|
| `taxonomy_version` 单调不减 | 拒绝该批，告警 |
| `parent_id` 必须存在或为 `null` | 该节点进入隔离，不阻塞其他节点 |
| `path_ids` 与 `parent_id` 一致 | 以 `parent_id` 重建路径并告警 |
| 无环 | 检测到环则拒绝整批 |
| `category_id` 唯一 | 重复则拒绝 |
| `status` 枚举合法 | 未知值保留原样并告警，不崩溃 |
| 产品边引用的分类存在 | 允许暂时缺失（分类先到后到），标记 `PENDING_CATEGORY` |
| 一个产品同 taxonomy 至多一个 `PRIMARY` | 多主则拒绝该产品的边，告警 |

---

## 8. 数据质量与发布状态

### 8.1 三层闸门

| 闸门 | 定义 | 当前实现 | 允许进入业务 API |
|---|---|---|---|
| `PIPELINE_PASS` | 文档可解析、证据字段完整（页码/表格/行/bbox/原文）、参数通过正式容器校验 | 引擎有部分校验能力；未以该名字落库（`CONFIRMED`） | 否，单独不够 |
| `CONTENT_APPROVED` | 引用该参数的内容版本通过人工内容审核 | **`NOT_IMPLEMENTED`**（仅原型演示） | 否，单独不够 |
| `RELEASE_APPROVED` | 指定发布批次获批 | **`NOT_IMPLEMENTED`**（仅原型演示） | 是 |

依赖顺序固定：`PIPELINE_PASS → CONTENT_APPROVED → RELEASE_APPROVED`。
上游未通过，下游不得标记为已批准。

### 8.2 状态枚举（`PROPOSED`）

| 层 | 状态 |
|---|---|
| Pipeline | `PENDING` / `PASS` / `FAILED` |
| Content | `PENDING` / `APPROVED` / `REJECTED` |
| Release | `PENDING` / `APPROVED` / `REVOKED` |
| 派生 `visible_state` | `DRAFT` / `IN_REVIEW` / `RELEASED` / `WITHDRAWN` |

派生规则：

```
if release == APPROVED: visible_state = RELEASED
elif release == REVOKED: visible_state = WITHDRAWN
elif content == APPROVED: visible_state = IN_REVIEW
else: visible_state = DRAFT
```

### 8.3 各场景的响应定义

| 场景 | HTTP | `code` / `error_key` | 说明 |
|---|---|---|---|
| 产品不存在 | 404 | `40401 PRODUCT_NOT_FOUND` | ID 无效或从未存在 |
| 产品存在但未发布，且客户端无 `product.publish.read` | 403 | `40302 PRODUCT_NOT_RELEASED` | **不返回 404**，避免消费方误判为删除；返回 `retryable=false`、`degraded_allowed=true` |
| 产品存在但未发布，客户端有 `product.publish.read` | 200 | `0` | 返回未发布 DTO，附 `visible_state` |
| 产品曾发布但已撤回 | 410 | `41001 PRODUCT_RELEASE_REVOKED` | 消费方必须停止公开展示；`retryable=false`、`degraded_allowed=false`；**不得**继续读产品缓存或技术数据 |
| 分类为 `DRAFT` / `REVIEWED` | 403 | `40303 CATEGORY_NOT_PUBLISHED` | 有 `product.category.read` 但不满足可见性 |
| 分类不存在 | 404 | `40402 CATEGORY_NOT_FOUND` | |
| 分类已停用但仍在保留期 | 200 | `0` | `status=DEPRECATED`，带 `merged_into` / `split_into`；允许读取用于历史映射迁移 |
| 分类保留期结束 | 410 | `41002 CATEGORY_RETIRED` | `retryable=false`、`degraded_allowed=true`；允许保留旧分类页与历史映射，**不得**新建产品归属 |
| 读取未发布产品的分类边（无 `product.publish.read`） | 403 | `40302 PRODUCT_NOT_RELEASED` | `/products/{id}/categories` 同样受产品发布门禁约束 |
| 普通客户端传 `internal_only=true` 但缺 `product.publish.read` | 403 | `40301 INSUFFICIENT_SCOPE` | 不得静默忽略参数，也不得降级为公开读取 |
| 内部客户端传 `internal_only=true` 但缺 `product.category.read` | 403 | `40301 INSUFFICIENT_SCOPE` | 必须同时具备两个 scope |
| 内部读取未发布产品的分类边（双 scope + `internal_only=true`） | 200 | `0` | `data.internal_only=true`；仅返回当前有效的 `APPROVED` / `PROPOSED` 边；不含 `REJECTED`、不含 `valid_to` 非空的历史边 |
| scope 不足 | 403 | `40301 INSUFFICIENT_SCOPE` | |
| 条件请求命中 | 304 | `NOT_MODIFIED` | `If-None-Match` 命中；无响应体；不是错误 |

**为什么不把"未发布"设计成 404**：Morrishk 需要区分"还没发布（继续用本地旧版本/等待）"
与"不存在（应删除本地记录）"与"已撤回（必须立即下架）"。404 无法表达这三种语义。

### 8.4 默认返回什么状态的数据

- `product.read` 默认：**仅 `RELEASE_APPROVED`**。
- `product.category.read` 默认：**`PUBLISHED` 分类，以及在保留期内的 `DEPRECATED` 分类**；`DRAFT` / `REVIEWED` 不可见。
- `product.evidence.read`：仅 `RELEASE_APPROVED` 产品的证据。
- `GET /products/{id}/categories`：默认返回 `APPROVED` 且 `valid_to IS NULL` 的边，产品必须 `RELEASE_APPROVED`。
- `GET /products/{id}/categories?internal_only=true`：需同时具备 `product.category.read` 与 `product.publish.read`；
  返回当前有效的 `APPROVED` / `PROPOSED` 边，并在 `data` 中标记 `internal_only=true`；
  不返回 `REJECTED` 边、不返回 `valid_to` 非空的历史边；`REVOKED` 产品仍不可读。
- `product.version.read`：版本元数据可读，但不含未发布参数值。
- `product.publish.read`：可读未发布状态与数据，用于内部审核。

### 8.5 Morrishk 公开页面的消费规则

| 页面 | 允许使用的数据 |
|---|---|
| 产品详情页 | 仅 `RELEASE_APPROVED` 的技术参数与分类引用 |
| 分类页 | 仅 `PUBLISHED` 分类；产品列表来自 Morrishk 本地已发布产品 |
| JSON-LD | 仅 `RELEASE_APPROVED` 字段；未发布字段省略，不输出 `null` |
| 搜索/筛选 | 仅本地已发布数据 |
| 后台预览 | 可读未发布数据，但必须带"未发布"标记，且不得被搜索引擎抓取 |

### 8.6 分类状态与产品状态的组合

见 §7.7 矩阵。补充规则：

1. 分类 `PUBLISHED` 且产品 `RELEASE_APPROVED` 且**映射 `APPROVED`** → 可展示。
2. 任一条件不满足 → 不进入公开页面。
3. 映射 `STALE` → 页面继续用旧映射，但后台告警。
4. 映射 `UNMAPPED` → 产品可展示在旧分类下，不自动归入新分类。

---

## 9. Morrishk Yii2 / PHP 7.4 接入方案

> 状态：全部 `PROPOSED`。Morrishk 当前无 Ds Bit 客户端。
> 技术约束：PHP 7.4（无 union types、无 constructor promotion、无 `match`、无 nullsafe `?->`、无 attributes），
> 不新增 Composer 依赖，HTTP 使用现有 `snsii\Curl` 封装或原生 curl。

### 9.1 模块位置

```
newPlan/morrishk.net/
├── services/
│   └── DsBitClient.php          # 新增；命名空间 app\services
├── commands/
│   └── DsBitController.php      # 新增；CLI 命令
├── config/
│   ├── params.php               # 非敏感配置
│   └── params-local.php         # 敏感配置（不入 Git）
└── migrations/                  # 新增 dsbit_* 表（若项目采用迁移）
```

旧站没有 `migrations/` 目录；生产库变更流程以项目现有运维方式为准（`OPEN` IQ-15）。
本设计只给表结构，不提供执行脚本。

### 9.2 `services/DsBitClient.php` 职责

| 职责 | 说明 |
|---|---|
| Token 获取与缓存 | Client Credentials；单飞；提前刷新；401 重取一次 |
| 调用产品 API | 详情、搜索、状态、版本、证据 |
| 调用分类 API | 体系、版本、节点、子节点、增量、产品分类 |
| 统一错误处理 | 解析统一响应包；映射 `error_key`；区分可重试/可降级 |
| 超时与有限重试 | 连接 2s / 读 5s；退避；最多 3 次 |
| 熔断 | 缓存状态；打开时快速失败 |
| 请求追踪 | 生成/透传 `X-Request-Id`；日志关联 |
| 响应校验 | 必填字段、类型、版本单调性 |
| 版本与更新时间记录 | 返回给同步层写入 `dsbit_sync_state` |

方法签名（PHP 7.4）：

```php
final class DsBitClient
{
    public function __construct(array $config, \yii\caching\Cache $cache, \yii\log\Logger $logger);

    public function health(): array;
    public function listTaxonomies(): array;
    public function getTaxonomy(string $taxonomyId): array;
    public function getTaxonomyVersion(string $taxonomyId): array;
    public function getTaxonomyChanges(string $taxonomyId, int $sinceVersion, ?string $cursor = null): array;
    public function getCategories(string $taxonomyId, array $query = []): array;
    public function getCategory(string $categoryId): array;
    public function getCategoryChildren(string $categoryId, ?string $cursor = null): array;
    public function getCategoryAncestors(string $categoryId): array;
    public function getProductCategories(string $productId): array;
    public function getProduct(string $productId, array $include = []): array;
    public function searchProducts(array $query): array;
    public function getProductStatus(string $productId): array;
    public function getProductVersions(string $productId, ?string $cursor = null): array;
    public function getProductEvidence(string $productId, ?string $cursor = null): array;
}
```

内部方法：

```php
private function accessToken(): string;          // 缓存 + 单飞
private function request(string $method, string $path, array $query = [], array $options = []): array;
private function decodeEnvelope(array $response, int $httpStatus): array;
private function isRetryable(array $envelope, int $httpStatus): bool;
private function breakerOpen(): bool;
private function recordFailure(string $reason): void;
private function recordSuccess(): void;
```

### 9.3 配置

`config/params.php`（非敏感）：

```php
'dsbit' => [
    'mode'          => 'stub',                       // stub | real
    'base_url'      => 'http://127.0.0.1:8787/api/v1',
    'client_id'     => 'morrishk-local',
    'scopes'        => ['product.read', 'product.category.read', 'product.evidence.read', 'product.version.read'],
    'connect_timeout' => 2,
    'read_timeout'    => 5,
    'max_retries'     => 3,
    'token_ttl_margin' => 120,
    'breaker_threshold' => 5,
    'breaker_cooldown'  => 60,
],
```

`config/params-local.php`（敏感，不入 Git）：

```php
'dsbit' => [
    'client_secret' => getenv('DSBIT_CLIENT_SECRET') ?: '',
],
```

启动校验：

- `mode=real` 且 `base_url` 非 HTTPS → 拒绝启动同步。
- `mode=real` 且 `client_secret` 为空或等于占位串 → 拒绝启动。
- `mode=stub` 且 host 非回环 → 拒绝启动。

### 9.4 本地数据表（候选）

> 以下表是 `PROPOSED`。需要结合 Morrishk 现有结构判断是否真的需要，避免重复建设。
> MySQL 5.6 兼容：不使用 JSON 类型、不使用生成列、不使用 CHECK、不使用窗口函数；
> 建议 `utf8mb4` + InnoDB（与旧站 MyISAM 混用需运维确认，`OPEN` IQ-15）。

#### 9.4.1 `dsbit_sync_state`

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT | PK |
| `sync_key` | VARCHAR(64) | 唯一；如 `taxonomy:tax_<ULID>`、`products`、`edges` |
| `resource_type` | VARCHAR(32) | `TAXONOMY` / `PRODUCT` / `EDGE` |
| `resource_id` | VARCHAR(64) NULL | 体系/产品 ID |
| `cursor` | VARCHAR(255) NULL | 分页游标 |
| `etag` | VARCHAR(128) NULL | ETag |
| `remote_version` | VARCHAR(64) NULL | `taxonomy_version` / `content_version` |
| `last_success_at` | DATETIME NULL | |
| `last_attempt_at` | DATETIME NULL | |
| `last_error_key` | VARCHAR(64) NULL | |
| `last_error_at` | DATETIME NULL | |
| `consecutive_failures` | INT UNSIGNED DEFAULT 0 | |
| `status` | ENUM('IDLE','RUNNING','FAILED','DEGRADED') | |
| `updated_at` | DATETIME | |

#### 9.4.2 `dsbit_product_mapping`

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT | PK |
| `dsbit_product_id` | VARCHAR(32) | Ds Bit 产品 ID |
| `mpn` | VARCHAR(64) | 原始型号 |
| `mpn_norm` | VARCHAR(64) | 归一化型号 |
| `legacy_product_id` | INT UNSIGNED NULL | `snsii_product.id` |
| `platform_model_id` | BIGINT UNSIGNED NULL | `pd_model.id` |
| `mapping_source` | ENUM('MPN_EXACT','MPN_LOOSE','MANUAL') | |
| `mapping_status` | ENUM('PROPOSED','APPROVED','REJECTED','STALE') | |
| `valid_from` | DATETIME | |
| `valid_to` | DATETIME NULL | |
| `created_at` / `updated_at` | DATETIME | |

唯一性：同一 `dsbit_product_id` 只能有一行 `valid_to IS NULL`（应用层保证；MySQL 5.6 无部分唯一索引）。

#### 9.4.3 `dsbit_category_mapping`

见 §7.8.1。

#### 9.4.4 `dsbit_product_cache`

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT | PK |
| `dsbit_product_id` | VARCHAR(32) | 唯一 |
| `content_version` | INT UNSIGNED | |
| `release_id` | VARCHAR(32) NULL | |
| `visible_state` | VARCHAR(16) | `RELEASED` / `WITHDRAWN` 等 |
| `payload` | MEDIUMTEXT | 规范化 JSON |
| `payload_sha256` | CHAR(64) | 校验 |
| `etag` | VARCHAR(128) NULL | |
| `fetched_at` | DATETIME | |
| `released_at` | DATETIME NULL | |
| `visible` | TINYINT(1) | Morrishk 是否允许公开展示 |
| `updated_at` | DATETIME | |

与 `snsii_product_cache` 的区别：后者是**页面渲染缓存**（`ProId` + 整页 JSON，31.7GB），
不得混用。本表是**同步内容缓存**，供发布流程与页面组装使用。

#### 9.4.5 `dsbit_category_cache`

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT | PK |
| `taxonomy_id` | VARCHAR(32) | |
| `taxonomy_version` | INT UNSIGNED | |
| `category_id` | VARCHAR(32) | |
| `parent_id` | VARCHAR(32) NULL | |
| `category_code` | VARCHAR(64) | |
| `name` | VARCHAR(200) | |
| `slug` | VARCHAR(120) NULL | |
| `level` | TINYINT UNSIGNED | |
| `path_ids` | TEXT | JSON 数组（5.6 无 JSON 类型） |
| `status` | VARCHAR(16) | |
| `is_active` | TINYINT(1) | |
| `payload` | MEDIUMTEXT | 原始节点 JSON |
| `etag` | VARCHAR(128) NULL | |
| `fetched_at` | DATETIME | |
| `updated_at` | DATETIME | |

唯一键：`(taxonomy_id, category_id)`。

#### 9.4.6 `dsbit_sync_log`

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT | PK |
| `run_id` | CHAR(36) | 一次同步运行 |
| `command` | VARCHAR(64) | `sync-taxonomies` / `sync-products` / `verify` |
| `resource` | VARCHAR(64) | |
| `started_at` / `finished_at` | DATETIME | |
| `status` | ENUM('OK','PARTIAL','FAILED') | |
| `items_read` / `items_written` / `items_skipped` | INT UNSIGNED | |
| `error_key` | VARCHAR(64) NULL | |
| `error_message` | VARCHAR(500) NULL | 已脱敏 |
| `request_ids` | TEXT | 逗号分隔 |

**不记录**：Token、secret、完整响应体。

### 9.5 同步方式

#### 9.5.1 首次全量

1. `GET /taxonomies` → 取 `PUBLISHED` 体系。
2. `GET /taxonomies/{id}/version` → 记录版本/ETag。
3. `GET /taxonomies/{id}/categories?mode=flat&limit=200` 分页拉全量 → 写 `dsbit_category_cache`。
4. `GET /products/search?release_state=RELEASED&limit=200` 分页拉全量 → 写 `dsbit_product_cache`。
5. `GET /products/{id}/categories` 逐产品拉边 → 写映射候选（`PROPOSED` / `UNMAPPED`）。
6. 校验 → 生成 `dsbit_sync_log`。

首次全量必须限速、可中断、可断点续跑。

#### 9.5.2 后续增量

| 资源 | 增量方式 |
|---|---|
| 分类体系版本 | `GET /taxonomies/{id}/version`，ETag 未变则跳过 |
| 分类节点 | `GET /taxonomies/{id}/categories?updated_since=<last_success>` 或 `since_version` |
| 分类变更 | `GET /taxonomies/{id}/changes?since_version=N`（若启用） |
| 产品 | `GET /products/search?updated_since=<last_success>&release_state=RELEASED` |
| 撤回 | `GET /products/search?updated_since=<last_success>&release_state=REVOKED` |
| 产品分类边 | 产品详情增量或 `GET /products/{id}/categories` 按需 |

#### 9.5.3 分类与产品独立同步

- 两个命令独立：`dsbit/sync-taxonomies` 与 `dsbit/sync-products`。
- 分类同步失败不阻塞产品同步；产品同步失败不回滚分类。
- 分类改名只更新 `dsbit_category_cache`，**不触发**产品重新下载。
- 产品内容变更只更新 `dsbit_product_cache`，**不触发**分类全量。
- 这是"一个分类更新不会导致全部产品重新下载"的实现保证。

#### 9.5.4 失败重试与断点

- 每页成功即提交 `cursor`/`since` 到 `dsbit_sync_state`。
- 失败时保留最后成功游标，下一次从该游标继续。
- 单条产品解析失败：记录失败 ID，继续处理后续；整批结束后重试失败项一次。
- 网络/5xx：按 §4.7 退避；熔断打开则中止本次运行并标记 `DEGRADED`。
- 不允许"部分覆盖"：单条 upsert 使用事务（若 InnoDB）；MyISAM 下先写临时表再替换（`OPEN` IQ-15）。

#### 9.5.5 同步审计日志

- 每次运行写 `dsbit_sync_log`。
- 记录读/写/跳过数量、错误码、`request_id` 列表。
- 不记录 Token 与完整 payload。
- 日志保留期 `OPEN` IQ-19（建议 180 天）。

#### 9.5.6 手工触发

```
yii dsbit/health
yii dsbit/sync-taxonomies [--full] [--dry-run]
yii dsbit/sync-products [--since=2026-11-01T00:00:00Z] [--limit=500] [--dry-run]
yii dsbit/verify
```

- `--dry-run` 只读远程、打印将写入的数量，不写库。
- 退出码：`0` 成功；`1` 参数错误；`2` 远程不可用；`3` 数据校验失败；`4` 部分失败。
- 手工触发与 cron 共用同一实现。

#### 9.5.7 同步结果校验

| 校验 | 失败处理 |
|---|---|
| 分类版本单调不减 | 回滚该批，告警 |
| 产品 `content_version` 单调不减 | 拒绝旧版本覆盖新版本 |
| `visible_state=RELEASED` 才允许 `visible=1` | 拒绝 |
| 分类引用存在或标记 `PENDING_CATEGORY` | 告警，不阻塞 |
| 主分类唯一 | 多主则拒绝该产品 |
| `payload_sha256` 与远程 `etag` 一致 | 不一致则重拉一次 |
| 行数差异阈值（如单批减少 > 20%） | 暂停并要求人工确认（防误删） |

### 9.6 缓存与版本

| 缓存 | 键 | TTL | 失效 |
|---|---|---|---|
| Token | `dsbit.token.<scope_hash>` | `expires_in - 120s` | 401/撤销/手动清除 |
| 分类体系版本 | `dsbit.taxver.<taxonomy_id>` | 1 小时 | 版本变化 |
| 分类节点 | `dsbit_category_cache`（DB） | 不过期 | 增量同步覆盖 |
| 产品内容 | `dsbit_product_cache`（DB） | 不过期 | 增量同步覆盖 |
| 熔断状态 | `dsbit.breaker` | 60 秒 | 半开探测 |
| 页面渲染 | 现有 Yii FileCache / `snsii_product_cache` | 现有策略 | 现有策略；**不由 Ds Bit 直接失效** |

规则：

1. **页面缓存不因 Ds Bit 同步而全量失效。** 仅当某个产品内容版本变化时，按产品 ID 精准失效。
2. 分类改名不失效产品页缓存；页面渲染时从 `dsbit_category_cache` 读取名称。
3. Ds Bit 故障不影响页面缓存命中。
4. `ETag` / `Last-Modified` 用于远程条件请求，不用于本地页面缓存。

### 9.7 降级策略

| 场景 | 行为 |
|---|---|
| Ds Bit 超时/5xx/熔断 | 页面继续用本地最后成功数据；同步任务标记 `DEGRADED` 并告警 |
| 从未成功同步过 | 产品不展示 Ds Bit 参数；页面仍用旧 `DataAttr`；不报错 |
| 产品 `REVOKED` | 立即将 `visible=0`；页面不再展示该产品技术参数；保留本地行以便审计 |
| 分类 `DEPRECATED` | 保留旧页面与旧映射；后台告警；不自动改 URL |
| 数据校验失败 | 不使用该批数据；继续用上一版 |
| Token 获取失败 | 不阻塞页面；同步任务失败并告警 |

---

## 10. URL、SEO 与业务兼容

### 10.1 现有 URL 基线（`CONFIRMED`，不可在本设计中变更）

```
/products/<8位数字id>/<PartUrl>.html        -> /pro/item
/big-categories/c-<Mid>-<Cid>/<Links>.html  -> /pro/list
/sub-categories/c-<Mid>-<Cid>/<Links>.html  -> /pro/sub
/manufacturer/<Links>.html                  -> /mfr/item
/products.html                              -> /pro/index
/search/index.html?keyword=                 -> /search/index
```

来源：`config/params.php:96-118`、`config/web.php:120-123`、`platform/docs/phase1/05-frontend-routing-and-acceptance.md`。

### 10.2 硬规则

1. **不因 Ds Bit 分类调整而直接改变 Morrishk 既有 URL。**
2. **Ds Bit 分类 ID 不作为 Morrishk URL 的唯一依据，也不进入 URL。**
3. Morrishk 继续控制 SEO slug、canonical、面包屑和导航路径。
4. 分类映射变化**不自动触发** URL 重写或 301。
5. 需要变更 URL 时，必须经过**单独的 SEO 审核与 301 映射流程**。
6. JSON-LD 中的产品技术属性只能使用符合发布条件（`RELEASE_APPROVED`）的数据。
7. 分类页面 SEO 文案与技术分类描述必须区分，不能未经审核直接复制。
8. Ds Bit 的 `slug` 只是建议值，Morrishk 不自动采用。
9. 分类改名不自动改 Morrishk 页面 `Name`/`Links`；只更新技术分类缓存。
10. 分类合并/拆分不自动生成 301；由运营/SEO 人工决定。

### 10.3 分类变更对 URL 的影响矩阵

| Ds Bit 事件 | Morrishk 自动动作 | 人工动作 |
|---|---|---|
| 分类新增 | 无 | 决定是否新建导航/落地页 |
| 分类改名 | 无（仅缓存名称更新） | 决定是否更新页面文案/title |
| 分类移动父节点 | 无 | 决定面包屑是否调整 |
| 分类合并 | 映射置 `STALE` | 决定保留旧页、改内容或 301 |
| 分类拆分 | 映射置 `STALE` | 重新分配产品与页面 |
| 分类停用 | 映射置 `STALE`，页面保留 | 决定下线或改导航 |
| 产品撤回 | 页面隐藏技术参数 | 决定页面是否保留、是否 410 |
| 产品未发布 | 不展示 | 无 |

### 10.4 已同步产品遇到分类 ID 失效

- 保留 `dsbit_category_mapping` 历史行（`valid_to` 非空）。
- 当前映射置 `STALE`。
- 页面继续使用 Morrishk 自己的 `snsii_product_category` / `pd_category` 展示。
- **不删除**产品，**不修改**产品 URL。
- 后台生成审核任务；审核通过后才迁移到新分类。
- 若 Ds Bit 返回 `410 CATEGORY_RETIRED`，仅停止该分类的技术数据同步，不影响页面。

### 10.5 历史 URL 与 SEO 兼容

- Morrishk 必须保留旧 URL 至少一个完整 SEO 周期（建议 ≥ 12 个月，`OPEN` IQ-18）。
- 分类映射与 URL 解耦：映射变化不改变 URL。
- 若业务决定改 URL，走 `legacy-url-redirects.csv` 流程（现有规划），必须：
  1. 有明确旧→新映射；
  2. 目标页 200 可达；
  3. 单跳 301；
  4. 不链式跳转；
  5. 有回滚清单。
- 本设计**不创建**任何 301，也不修改现有 URL 规则。

### 10.6 JSON-LD

- 仅使用 `RELEASE_APPROVED` 的产品字段。
- 未发布字段省略，不输出 `null` 或空字符串。
- 价格/库存来自 Morrishk，不来自 Ds Bit；两者不得混入同一 `Offer` 造成不一致。
- 参数以 `PropertyValue` 表达时，`value` 必须是已发布值；`unitText` 与 `unit` 一致。
- 结构化数据不包含证据 bbox、内部 ID、审核状态。
- JSON-LD 的引入属于新站/改版范围；旧站当前无 JSON-LD（`CONFIRMED`），本设计不要求在旧站新增。

### 10.7 canonical / hreflang

- 旧站当前无 canonical / hreflang（`CONFIRMED`）。
- 新站规划要求唯一 canonical + hreflang + `x-default`（`platform/docs/phase1/05-frontend-routing-and-acceptance.md`）。
- Ds Bit **不提供** canonical、hreflang 或 URL 建议。
- 若未来新增，必须由 Morrishk SEO 规则统一生成，不得由分类 API 字段直接拼接。

### 10.8 SEO 文案与技术描述

- `category.description` 是技术描述，不是 SEO 文案。
- 分类页 `title`/`description` 由运营撰写或审核。
- 不得把技术描述自动复制到 meta description。
- 不得把 Ds Bit 参数直接拼接成关键词堆砌。

---

## 11. 安全与可运维性

### 11.1 传输与认证

- 全链路 HTTPS（TLS 1.2+）；仅本地 stub 允许回环 HTTP。
- OAuth2 Client Credentials；Bearer Token 仅放 `Authorization` 头。
- 最小 scope；分类权限独立。
- Token 撤销与客户端禁用：撤销后最迟 60 秒内全体 Resource Server 拒绝；客户端禁用立即拒绝签发。

### 11.2 Secret 管理

- `client_secret` 只在服务端；Morrishk 用环境变量注入。
- 不入 Git、不入镜像、不入日志、不入错误响应、不入 APM。
- 轮换支持双活窗口。
- 本地 stub 使用占位串，生产禁止出现。

### 11.3 防重放与 IP 白名单

- v1 全部只读 GET，TLS + Bearer 已足够；**不强制**请求签名。
- 未来写接口需要 `Idempotency-Key` + 时间戳/nonce；`PROPOSED`。
- IP 白名单作为**可选附加层**：在网关限制来源 IP；不作为唯一认证手段。
- 不建议把 mTLS 作为 v1 必需项（增加证书运维成本）。

### 11.4 限流

见 §5.11。服务端按 client + endpoint 限流；客户端主动节流。

### 11.5 日志脱敏

禁止记录：

- `client_secret`、`Authorization` 头、`access_token`；
- 完整请求/响应体中的敏感字段；
- 证据截图内容（可能含版权内容）。

必须记录：

- `request_id`、`client_id`（非敏感）、`scope`、`endpoint`、HTTP 状态、业务 `code`、耗时；
- 同步运行的 `run_id`、资源类型、读写数量、错误 `error_key`。

脱敏规则：

```
Authorization: Basic ***
Authorization: Bearer ***
access_token=***
```

示例：`[dsbit] POST /oauth/token auth=client_secret_basic client_id=morrishk-prod -> 200`
（实际不应记录 token 端点请求体或认证头；上面仅为脱敏格式示意。）

### 11.6 健康检查

| 端点 | 认证 | 内容 |
|---|---|---|
| `GET /api/v1/health` | 可选匿名 | 仅 `status` / `version`；不含依赖细节 |
| `GET /api/v1/health/deps` | 需认证 | 数据库、对象存储、解析服务状态；不含敏感信息 |

Morrishk 侧 `yii dsbit/health` 只检查 Token 获取与一个轻量端点。

### 11.7 监控与告警

| 指标 | 告警阈值（建议） |
|---|---|
| Token 获取失败率 | 5 分钟内 > 10% |
| API 5xx 率 | 5 分钟内 > 1% |
| API P95 延迟 | > 2s（持续 10 分钟） |
| 熔断打开 | 立即告警 |
| 分类同步失败 | 连续 2 次 |
| 产品同步失败 | 连续 2 次 |
| 同步延迟 | 最近成功 > 24h |
| 数据校验失败 | 立即告警 |
| 分类映射 `STALE` 数 | > 阈值（按业务定） |
| `UNMAPPED` 数 | 增长过快 |

### 11.8 超时、重试、熔断

见 §4.7 / §4.8。所有同步命令必须遵守。

### 11.9 本地 Stub 与生产隔离

- `mode=stub` 只允许回环地址与占位 secret。
- 生产配置不得包含 stub 标记。
- Stub 响应带 `x_local_static_stub: true`，客户端遇到该字段在 `mode=real` 下必须**拒绝**该响应并告警。
- CI 中增加检查：`grep -r "LOCAL_STATIC_STUB_NOT_A_CREDENTIAL" config/` 必须为空（生产配置）。

### 11.10 凭据泄露风险（现状）

`CONFIRMED`：旧站 `config/web.php` 与 `config/db.php` 含明文 SMTP 密码、数据库密码与
`cookieValidationKey`。本设计**不复制**这些值，但必须记录为风险：

| 风险 | 建议 |
|---|---|
| 明文凭据在源码 | 迁移到环境变量/密钥管理；轮换已暴露凭据 |
| 源码可能进入版本库/备份 | 加入 secret 扫描；限制仓库权限 |
| 多站点同机 | 使用独立数据库账号与最小权限 |

该整改独立于本设计，需单独立项与授权。

---

## 12. 测试与验收矩阵

> 当前状态：Ds Bit 无 Business API 测试；`serve_b2b.py` 未跟踪且无测试；
> Morrishk 无 Ds Bit 集成测试；`platform` 前端测试为 Mock，不覆盖 Yii2。
> 因此下表的"现有覆盖"绝大多数为 `NONE`。不得把本表当作已通过的测试报告。

### 12.1 OAuth2

| ID | 目的 | 前置 | 步骤 | 预期 | 现有覆盖 | 需新增 |
|---|---|---|---|---|---|---|
| OA-01 | 正常获取 Token | 有效 client | POST `/oauth/token` | 200；`access_token`、`expires_in`、`scope` | NONE | 是 |
| OA-02 | 无效 secret | 错误 secret | 同上 | 401 `invalid_client`；不泄露细节 | NONE | 是 |
| OA-03 | 无效 client_id | 不存在 client | 同上 | 401 `invalid_client` | NONE | 是 |
| OA-04 | scope 超授权 | 请求未注册 scope | 同上 | 400 `invalid_scope`（RFC 6749 §5.2） | NONE | 是 |
| OA-05 | Token 过期 | 短 TTL | 过期后调用 API | 401 `TOKEN_EXPIRED`；客户端刷新一次成功 | NONE | 是 |
| OA-06 | 已撤销 Token | 撤销 | 调用 API | 401 `INVALID_TOKEN` | NONE | 是 |
| OA-07 | 客户端禁用 | 禁用 | 获取 Token + 使用旧 Token | 新 Token 签发立即 401；已签发 Token 最迟 60 秒内全部 401 | NONE | 是 |
| OA-08 | 并发获取 Token | 10 并发 | 同时请求 | 只签发少量 Token；无风暴；无错误 | NONE | 是 |
| OA-09 | 日志脱敏 | 正常调用 | 检查日志 | 无 secret/token | NONE | 是 |
| OA-10 | Stub 隔离 | `mode=real` 指向 stub | 启动 | 拒绝启动/拒绝响应 | NONE | 是 |
| OA-11 | 认证方式混用 | 同时带 Basic 与 body secret | 同上 | 400 `invalid_request`；不签发 | NONE | 是 |
| OA-12 | opaque Token 校验 | 任意修改 1 字节 | 调用 API | 401 `INVALID_TOKEN` | NONE | 是 |
| OA-13 | 撤销传播延迟上限 | 服务端 `revoked_at` | 分别在 0 / 59 / 60 / 61 秒调用 | 0–59 秒：允许 200 或 401（优化可提前生效）；**60 秒及以后：必须 401 `INVALID_TOKEN`**；全体 RS 均满足 | NONE | 是 |
| OA-13a | 多 RS 撤销一致性 | 2 个以上 RS 均缓存旧 Token | 撤销后第 60 秒分别请求 | 所有 RS 全部返回 401；不得出现任一 RS 仍接受 | NONE | 是 |
| OA-14 | Basic 认证成功 | 仅 `Authorization: Basic`，Body 无 secret | POST `/oauth/token` | 200；服务端不从 Body 读取凭据 | NONE | 是 |
| OA-15 | Stub 认证例外 | `client_secret_post` | stub 模式允许并标记；real 模式拒绝 | real 模式返回 400/401；日志标记 stub | NONE | 是 |

### 12.2 产品 API

| ID | 目的 | 前置 | 步骤 | 预期 | 现有覆盖 | 需新增 |
|---|---|---|---|---|---|---|
| PR-01 | 已发布产品 | `RELEASE_APPROVED` | GET 详情 | 200；字段完整；无原始 JSON | NONE | 是 |
| PR-02 | 未发布产品 | 仅 `PIPELINE_PASS` | GET 详情 | 403 `PRODUCT_NOT_RELEASED` | NONE | 是 |
| PR-03 | 未发布 + 内部 scope | `product.publish.read` | GET 详情 | 200；`visible_state` 正确 | NONE | 是 |
| PR-04 | 不存在产品 | 无 | GET | 404 `PRODUCT_NOT_FOUND` | NONE | 是 |
| PR-05 | 撤回产品 | `REVOKED` | GET | 410 `PRODUCT_RELEASE_REVOKED` | NONE | 是 |
| PR-06 | 版本变更 | 两个版本 | GET versions | 版本单调；`is_current` 唯一 | NONE | 是 |
| PR-07 | 证据权限 | 无 `product.evidence.read` | GET evidence | 403 | NONE | 是 |
| PR-08 | 证据存在性 | 有权限 | GET evidence | 页码/bbox/原文/SHA 完整 | NONE | 是 |
| PR-09 | 参数缺失 | 参数为空 | GET 详情 | 200；`parameters=[]`；不报错 | NONE | 是 |
| PR-10 | 非法参数值 | `min>max` | GET 详情 | 服务端拒绝发布；API 不返回该参数 | NONE | 是 |
| PR-11 | MPN 精确查找 | 已知 MPN | `/products/search?mpn=` | 返回唯一结果 | NONE | 是 |
| PR-12 | MPN 模糊查找 | 变体 | `mpn_match=loose` | 返回候选；不误判 | NONE | 是 |
| PR-13 | 增量同步 | `updated_since` | 搜索 | 只返回变更 | NONE | 是 |
| PR-14 | 分类引用 | 已映射 | GET 详情 | 只有 `category_id`，无名称/路径 | NONE | 是 |

### 12.3 分类 API

| ID | 目的 | 前置 | 步骤 | 预期 | 现有覆盖 | 需新增 |
|---|---|---|---|---|---|---|
| CT-01 | 获取分类体系 | 已发布 | GET `/taxonomies` | 200；版本正确 | NONE | 是 |
| CT-02 | 获取分类树 | 多层 | `mode=tree` | 结构正确；深度/节点上限生效 | NONE | 是 |
| CT-03 | 分页节点 | 大量节点 | `mode=flat&limit` | 游标分页；无重复/遗漏 | NONE | 是 |
| CT-04 | 单节点 | 存在 | GET `/categories/{id}` | 父子引用正确 | NONE | 是 |
| CT-05 | 子节点 | 有子 | GET `/children` | 只返回直接子节点 | NONE | 是 |
| CT-06 | 祖先链 | 深层 | GET `/ancestors` | 顺序正确（根→父） | NONE | 是 |
| CT-07 | 版本检查 | 无变化 | GET `/version` + ETag | 304 | NONE | 是 |
| CT-08 | 增量同步 | 有变更 | `updated_since` | 只返回变更 | NONE | 是 |
| CT-09 | 新增分类 | 新节点 | 同步 | 本地新增；映射 `UNMAPPED` | NONE | 是 |
| CT-10 | 改名 | 同名 ID | 同步 | ID 不变；`data_version+1` | NONE | 是 |
| CT-11 | 停用 | `DEPRECATED` | GET | 200 + 状态；不 404 | NONE | 是 |
| CT-12 | 合并 | `merged_into` | GET + 同步 | 返回合并目标；映射 `STALE` | NONE | 是 |
| CT-13 | 拆分 | `split_into` | 同步 | 映射 `STALE`；需人工 | NONE | 是 |
| CT-14 | 产品多分类 | 产品 `RELEASE_APPROVED`，多边 | GET `/products/{id}/categories` | 多分类；至多一个 `PRIMARY` | NONE | 是 |
| CT-14a | 产品分类门禁 | 产品仅 `PIPELINE_PASS` | GET `/products/{id}/categories` | 403 `PRODUCT_NOT_RELEASED`；不返回任何边 | NONE | 是 |
| CT-14b | 仅分类 scope | 有 `product.category.read`，无 `product.publish.read` | 同上 + `internal_only=true` | 403 `INSUFFICIENT_SCOPE`；不得绕过发布门禁 | NONE | 是 |
| CT-14c | 缺少分类 scope | 有 `product.publish.read`，无 `product.category.read` | 同上 + `internal_only=true` | 403 `INSUFFICIENT_SCOPE` | NONE | 是 |
| CT-14d | 内部读取未发布边 | 双 scope | 同上 + `internal_only=true` | 200；`data.internal_only=true`；含当前有效 `APPROVED`/`PROPOSED` 边 | NONE | 是 |
| CT-14e | 内部读取边过滤 | 双 scope，存在 `REJECTED` 与历史边 | 同上 | 不返回 `REJECTED`；不返回 `valid_to` 非空边 | NONE | 是 |
| CT-14f | 普通客户端传内部参数 | 仅 `product.category.read`，产品未发布 | 同上 + `internal_only=true` | 403；参数不得静默忽略 | NONE | 是 |
| CT-15 | 无映射分类 | 新分类 | 同步 | `UNMAPPED` 队列；不自动映射 | NONE | 是 |
| CT-16 | 循环父子 | 构造环 | 同步 | 拒绝整批；告警 | NONE | 是 |
| CT-17 | 保留期后 | 过期 | GET | 410 `CATEGORY_RETIRED` | NONE | 是 |
| CT-18 | 历史映射 | 合并后 | 同步 | 旧映射保留 `valid_to` | NONE | 是 |
| CT-19 | 历史 URL 不受影响 | 映射变化 | 页面访问 | URL/canonical 不变 | NONE | 是 |
| CT-20 | ETag 命中 | 无变化 | `If-None-Match` | 304；无 body | NONE | 是 |
| CT-21 | 退役保留 tombstone | 保留期结束 | 查询分类行 + API | DB 行/tombstone 仍存在；API 返回 410；不物理删除 | NONE | 是 |
| CT-22 | 历史边引用保护 | 存在 `valid_to` 非空边的分类 | 尝试删除分类 | 拒绝删除；历史边与引用完整 | NONE | 是 |
| CT-23 | ID 不复用 | 已退役 ID | 新建分类并尝试复用旧 ID | 拒绝；必须分配新 ULID | NONE | 是 |
| CT-24 | ID 格式与跨类型唯一 | 全量分类/产品/边 | 校验长度、字符集、前缀 | 26 字符合法 ULID；同一 ULID 不得跨类型复用 | NONE | 是 |

### 12.4 Morrishk 集成

| ID | 目的 | 前置 | 步骤 | 预期 | 现有覆盖 | 需新增 |
|---|---|---|---|---|---|---|
| MI-01 | Yii2 Token 获取 | 配置正确 | 调用 client | Token 缓存；不重复请求 | NONE | 是 |
| MI-02 | 产品同步 | 已发布 | `yii dsbit/sync-products` | 写缓存；版本正确 | NONE | 是 |
| MI-03 | 分类同步 | 已发布 | `yii dsbit/sync-taxonomies` | 写缓存；版本正确 | NONE | 是 |
| MI-04 | 重复同步幂等 | 已同步 | 再跑 | 无重复行；版本不变 | NONE | 是 |
| MI-05 | 增量同步 | 有变更 | 再跑 | 只处理变更 | NONE | 是 |
| MI-06 | 超时降级 | 远程超时 | 跑同步 + 访问页面 | 页面正常；同步 `DEGRADED` | NONE | 是 |
| MI-07 | 5xx 降级 | 远程 5xx | 同上 | 页面正常；告警 | NONE | 是 |
| MI-08 | 熔断 | 连续失败 | 同上 | 熔断打开；快速失败 | NONE | 是 |
| MI-09 | 未发布数据拒绝 | 未发布 | 尝试写 `visible=1` | 拒绝 | NONE | 是 |
| MI-10 | 撤回下架 | `REVOKED` | 同步 | `visible=0`；参数不展示 | NONE | 是 |
| MI-11 | 分类映射异常 | `UNMAPPED` | 访问产品页 | 页面正常；不自动归类 | NONE | 是 |
| MI-12 | URL 不变 | 映射变化 | 访问旧 URL | 200；canonical 不变 | NONE | 是 |
| MI-13 | 301 不自动生成 | 分类合并 | 检查 | 无新增 301 | NONE | 是 |
| MI-14 | 页面无远程调用 | 远程不可用 | 访问页面 | 无网络请求；正常渲染 | NONE | 是 |
| MI-15 | 日志脱敏 | 同步 | 检查日志 | 无 token/secret | NONE | 是 |
| MI-16 | 断点恢复 | 中途中断 | 重跑 | 从游标继续 | NONE | 是 |
| MI-17 | 校验失败回滚 | 构造坏数据 | 同步 | 不使用坏批；保留旧版 | NONE | 是 |
| MI-18 | 大版本跳变 | 远程版本 +N | 同步 | 正常处理；告警 | NONE | 是 |

### 12.5 验收前置

- 所有测试必须在本地/隔离环境执行。
- 不得调用真实生产 Parser API。
- 不得使用生产 OAuth2 凭证。
- 不得写 Morrishk 生产库。
- Mock 通过必须标记 `PASS_MOCK`，不得标 `PASS_REAL_API`。

---

## 13. 分阶段实施路线

| 阶段 | 目标 | 交付 | 退出条件 | 授权 |
|---|---|---|---|---|
| Phase 0 | 契约冻结 | 本文件 + `API_CONTRACT_EXAMPLES.md` + `INTEGRATION_OPEN_QUESTIONS.md` | Reviewer 通过；OPEN 问题有裁定；**并在 Ds Bit 权威分支干净提交上复核 §2.1 基线五项**（见 §2.1 基线时效性） | 本轮 |
| Phase 1 | Ds Bit 本地 Stub | 契约一致的本地 OAuth2 桩、产品只读 API、分类只读 API、V101 静态数据、Mock 测试 | 本地测试通过；`x_local_static_stub` 标记齐全；无真实解析 | 需单独授权 |
| Phase 2 | Morrishk Yii2 Client | `services/DsBitClient.php`、Token 缓存、产品/分类同步、本地表、降级 | 本地联调通过；无生产库写入 | 需单独授权 |
| Phase 3 | 本地集成验证 | 端到端 Mock、分类映射验证、详情页验证、SEO URL 回归、发布状态验证 | 测试矩阵通过；URL/canonical 无变化 | 需单独授权 |
| Phase 4 | 生产准备 | 生产凭证、部署、网络、小批量灰度、回滚 | 单独审批 | **需单独审批，本设计不授予** |

Phase 4 只是规划，不代表获得生产授权。

---

## 14. 风险、未决问题与审批边界

### 14.1 风险

| ID | 风险 | 影响 | 缓解 |
|---|---|---|---|
| R-01 | 把本地静态桩误认为生产 API | 对外承诺失真 | `x_local_static_stub` 标记 + 启动断言 + 文档标注 |
| R-02 | 分类体系与业务分类被混为一谈 | 错误映射、导航混乱 | 五类分类分离建模；映射层显式审核 |
| R-03 | 用名称匹配做映射 | 改名/同名导致错映射 | 禁止；只允许 ID/code/人工 |
| R-04 | 分类变更自动改 URL | SEO 流量损失 | 硬规则禁止；独立 301 流程 |
| R-05 | 未发布数据进入公开页 | 内容/合规风险 | 同步层强制 `RELEASE_APPROVED` |
| R-06 | Ds Bit 故障导致页面不可用 | 可用性事故 | 页面只读本地；降级策略 |
| R-07 | Token/secret 泄露 | 安全事件 | 脱敏、环境变量、轮换、最小 scope |
| R-08 | MySQL 5.6 与 8.0 双栈 | 迁移/引擎差异 | 新表用 5.6 兼容语法；不依赖 JSON/生成列 |
| R-09 | 旧站与新平台双 ID 空间 | 映射错乱 | `morrishk_target` 区分；分别映射 |
| R-10 | 同步全量覆盖导致误删 | 数据丢失 | 差异阈值 + 人工确认 + 保留旧版 |
| R-11 | 证据版权/公开范围 | 法律风险 | v1 只给引用；公开下载需单独授权 |
| R-12 | 审核/发布后端缺失被当成已实现 | 发布失控 | 明确 `NOT_IMPLEMENTED`；Phase 1 前置 |

### 14.2 审批边界

本设计**不**授权：

1. 修改生产环境配置；
2. 部署 Ds Bit 或 Morrishk 生产服务；
3. 创建或启用生产 OAuth2 凭证；
4. 调用真实生产 Parser API；
5. 启用 LLM 自动解析或 Repair；
6. 批量解析或批量发布产品；
7. 修改 Morrishk 生产数据库；
8. 修改 Morrishk 现有 URL、canonical 或 301 规则；
9. 把 Mock/Stub 说成真实 API 已接通；
10. 未经批准实现公开 Business API；
11. 为完成设计而擅自重构现有代码；
12. 将分类映射自动化为不可逆的业务分类或 URL 变更。

### 14.3 未决问题

见 `INTEGRATION_OPEN_QUESTIONS.md`（IQ-01 ~ IQ-22）。其中阻断 Phase 0 冻结的：

- IQ-01 产品身份权威与 ID 空间
- IQ-02 技术分类体系归属与初始种子
- IQ-05 分类保留期
- IQ-09 错误响应包最终形状
- IQ-13 对接目标是旧站、新平台还是两者
- IQ-15 新表引擎/字符集
- IQ-21 是否允许非生产凭证

---

## 15. API Contract 示例索引

完整 JSON 示例见 `API_CONTRACT_EXAMPLES.md`。

| 示例 | 内容 |
|---|---|
| EX-01 | Token 成功 |
| EX-02 | Token 失败 |
| EX-03 | 分类体系列表 |
| EX-04 | 分类体系详情 |
| EX-05 | 分类树 |
| EX-06 | 单分类 + 父子 |
| EX-07 | 产品分类归属 |
| EX-08 | 分类版本 |
| EX-09 | 分类变更 |
| EX-10 | 分类停用/合并 |
| EX-11 | 已发布产品详情 |
| EX-12 | 未发布产品 403 |
| EX-13 | 撤回产品 410 |
| EX-14 | 产品状态 |
| EX-15 | 产品版本 |
| EX-16 | 产品证据 |
| EX-17 | 产品搜索 |
| EX-18 | 通用错误 |
| EX-19 | 304 |
| EX-20 | 429 |
| EX-21 | Morrishk 映射表行 |
| EX-22 | 同步状态行 |

---

## 16. 术语表

| 术语 | 定义 |
|---|---|
| **Technical Taxonomy** | 技术产品分类体系；Ds Bit 新增资产；与导航/SEO 分类不同 |
| **Device Identity** | 器件身份（MPN、厂商、封装、scope、type）；不是分类树 |
| **Product Family** | 产品族/系列；可选层级，不等于技术分类 |
| **Document Type** | 文档类型（datasheet/user guide/errata/EVM/app note/OCR） |
| **Business Category** | Morrishk 业务/导航分类（旧站 `snsii_product_category`、新平台 `pd_category`） |
| **SEO Landing Category** | 为搜索流量组织的落地页集合；可与导航分类不同 |
| **Taxonomy Version** | 分类体系版本号；发布变更集时 +1 |
| **Category ID** | 分类节点稳定 ID；永不复用、改名不变 |
| **Category Code** | 稳定业务编码；发布后不可改 |
| **Edge** | 产品与分类的归属关系（多对多） |
| **Primary Category** | 同一体系下产品的主分类；至多一个 |
| **Mapping** | Ds Bit 分类到 Morrishk 分类的显式关系 |
| **UNMAPPED** | 尚未建立映射，进入人工审核队列 |
| **STALE** | 因 Ds Bit 分类变更而失效的映射 |
| **PIPELINE_PASS** | 解析与证据完整性通过 |
| **CONTENT_APPROVED** | 内容审核通过 |
| **RELEASE_APPROVED** | 发布批次获批 |
| **RELEASE_REVOKED** | 发布被撤回 |
| **DTO** | Data Transfer Object；业务稳定响应结构 |
| **ETag** | HTTP 实体标签；用于条件请求 |
| **Cursor** | 不透明分页游标 |
| **Single-flight** | 并发请求合并为一次获取 |
| **Circuit Breaker** | 熔断器 |
| **Stub** | 本地静态桩；不校验凭据、不可用于生产 |
| **G0** | Ds Bit 冻结预备环境；不是生产解析服务 |

---

## 附录 A. `CONFIRMED` / `PROPOSED` / `OPEN` 三类清单

### A.1 `CONFIRMED`（现有代码或文档可复核）

| 编号 | 事实 | 证据 |
|---|---|---|
| C-01 | Ds Bit 项目仓库 = 前台 `workbench/` + 引擎 `src/icpdf/`；引擎为 Phase 1，无 LLM | `icpdf-extractor/README.md:3-6`、`workbench/index.html` |
| C-02 | 解析器无鉴权代码 | `workbench/serve_parser.py` |
| C-03 | 解析器不连数据库 | `workbench/serve_parser.py:18` |
| C-04 | 本地 B2B 服务是未跟踪文件 | `git status`（`?? workbench/b2b/serve_b2b.py`） |
| C-05 | 本地 OAuth2 是静态桩，不校验凭据 | `serve_b2b.py` `/oauth/token` |
| C-06 | 本地仅支持 V101 | `SUPPORTED_SAMPLES = ("V101",)` |
| C-07 | Ds Bit 无技术分类模型 | 全文检索无 taxonomy/category |
| C-08 | Ds Bit 无审核/版本/发布后端 | `04-dsbit-workspace-inventory.md` |
| C-09 | Morrishk 为 Yii2 Basic / PHP 7.4 | `00_project_baseline/existing_system_baseline.md` |
| C-10 | MySQL 5.6.50 / 31 表 / 30 MyISAM | `mysql_schema_audit/07_extraction_report.md` |
| C-11 | 产品表 20 列，分类表 11 列 | `mysql_schema_audit/01_schema.sql` |
| C-12 | 分类仅两级，`Pid=0` 为顶级 | 同上 |
| C-13 | 产品-分类仅 `BigCat`/`SmallCat` | 同上 |
| C-14 | URL 规则与 `.html` 后缀 | `config/params.php:96-118`、`config/web.php:120-123` |
| C-15 | SEO 仅 title/keywords/description | `commands/SnSiiController.php:84-99` |
| C-16 | 旧站无 canonical / JSON-LD | 视图检索为空 |
| C-17 | 旧站无 Ds Bit Client / OAuth | 全文检索 |
| C-18 | 无 cron / 队列定义 | `config/console.php`、`commands/` |
| C-19 | 新平台契约使用 `{code,message,data,request_id,meta}` | `03-api-contract.yaml:9-14` |
| C-20 | 新平台迁移禁止 production | 迁移文件头注释 |
| C-21 | Ds Bit 前台只有解析/校对界面，无业务后台 | `workbench/index.html`、`workbench/b2b/qa_console.html` |

### A.2 `PROPOSED`（本设计提出，尚未实现）

| 编号 | 设计 |
|---|---|
| P-01 | OAuth2 Client Credentials + 5 scopes |
| P-02 | `/api/v1` 版本与统一响应包 |
| P-03 | 产品业务 DTO 分层 |
| P-04 | 技术分类体系（taxonomy + category + edge） |
| P-05 | 分类版本、变更记录、软删除、合并/拆分语义 |
| P-06 | 11 个分类端点及版本级别 |
| P-07 | `dsbit_category_mapping` 映射层 |
| P-08 | 三层门禁的服务端状态与响应语义 |
| P-09 | Morrishk `DsBitClient` 与 CLI 同步 |
| P-10 | `dsbit_*` 本地表 |
| P-11 | 同步、缓存、熔断、降级策略 |
| P-12 | 测试矩阵 |
| P-13 | Phase 0–4 路线 |

### A.3 `OPEN`（需人工决策）

| 编号 | 问题 | 阻断 |
|---|---|---|
| IQ-01 | 产品身份权威与 ID 空间（MPN / `product_id` / 旧站 ID / `pd_model.id`） | Phase 0 |
| IQ-02 | 技术分类体系归属、初始种子与是否多体系 | Phase 0 |
| IQ-03 | `category_id` / `category_code` 的治理与生成规则 | Phase 1 |
| IQ-04 | 一个产品是否允许跨体系多个主分类 | Phase 1 |
| IQ-05 | 分类合并/停用保留期与 410 时机 | Phase 1 |
| IQ-06 | 发布状态存储位置（Ds Bit 库/独立知识库） | Phase 1 |
| IQ-07 | 内容审核与发布授权角色 | Phase 2 |
| IQ-08 | 证据公开范围与版权 | Phase 2 |
| IQ-09 | 错误响应包最终形状 | Phase 0 |
| IQ-10 | API 域名与环境拓扑 | Phase 4 |
| IQ-11 | OAuth 客户端注册与密钥轮换责任人 | Phase 4 |
| IQ-12 | Token TTL 与限流配额 | Phase 1 |
| IQ-13 | 对接目标是旧站、新平台还是两者 | Phase 0 |
| IQ-14 | 同步任务调度位置 | Phase 2 |
| IQ-15 | 新表引擎与字符集（MyISAM/InnoDB、utf8/utf8mb4） | Phase 1 |
| IQ-16 | 是否需要 `categories/{id}/products` | Phase 1 |
| IQ-17 | JSON-LD 字段范围与审核 | Phase 2 |
| IQ-18 | URL/301 变更流程与保留期 | Phase 2 |
| IQ-19 | 同步日志保留期 | Phase 2 |
| IQ-20 | 是否开放 MPN 模糊查找 | Phase 1 |
| IQ-21 | 是否允许非生产凭证 | Phase 1 |
| IQ-22 | 网络路径（公网/专线/IP 白名单） | Phase 4 |

---

## 附录 B. 与任务书建议错误结构的映射

任务书建议：

```json
{
  "error": {
    "code": "PRODUCT_NOT_RELEASED",
    "message": "Product data is not released",
    "request_id": "req_<ULID>",
    "retryable": false
  }
}
```

本设计采用（对齐现有项目规范）：

```json
{
  "code": 40302,
  "message": "Product data is not released",
  "data": null,
  "request_id": "req_<ULID>",
  "meta": {
    "error_key": "PRODUCT_NOT_RELEASED",
    "retryable": false,
    "degraded_allowed": true
  }
}
```

| 建议字段 | 本设计字段 |
|---|---|
| `error.code`（字符串） | `meta.error_key`（字符串）+ `code`（整数） |
| `error.message` | `message` |
| `error.request_id` | `request_id` + `X-Request-Id` |
| `error.retryable` | `meta.retryable` |
| —（新增） | `meta.degraded_allowed` |

若 Reviewer 要求保留 `error` 外层，只需替换外层键名，语义不变。

### B.1 为什么新增 `degraded_allowed`

Morrishk 的页面必须能在 Ds Bit 故障时继续展示**最近一次已成功同步且已发布**的数据。
如果只有 `retryable`，客户端无法区分"可以重试"和"可以先用旧数据"。`degraded_allowed`
明确告诉客户端：本次失败是否允许继续使用本地缓存。对 `410 PRODUCT_RELEASE_REVOKED`，
`degraded_allowed=false`，因为撤回必须立即生效。

---

## 附录 C. 当前实现 vs 拟议实现差异表

| 能力 | 当前实现 | 证据 | 拟议实现 | 差异性质 |
|---|---|---|---|---|
| OAuth2 | 无；静态桩 | `serve_b2b.py` | 真实 Client Credentials | 新建 |
| Token 生命周期 | 固定 3600 秒占位 | 同上 | 15 分钟 + 单飞 + 撤销 | 新建 |
| 产品 API | `/v1/parts/{model}` 回放 V101 | 同上 | 业务 DTO + 版本 + 门禁 | 重构 |
| 分类 API | 无 | — | 11 个端点 | 新建 |
| 产品分类 | 无 | — | taxonomy/edge/mapping | 新建 |
| 发布门禁 | 原型演示 | `views-knowledge.js`（Demo） | 服务端三态 + 批次 | 新建 |
| 持久化 | `runs/` 目录 | `serve_parser.py` | Ds Bit 库/知识库 | 新建 |
| Morrishk Client | 无 | — | `DsBitClient` | 新建 |
| 同步 | 无 | — | CLI + 增量 + 审计 | 新建 |
| 本地缓存 | 页面缓存表 | `snsii_product_cache` | 新增 `dsbit_*` 缓存 | 扩展 |
| 分类映射 | 无 | — | 显式映射层 | 新建 |
| URL | 旧规则 | `config/params.php` | 不变 | 冻结 |
| SEO | title/keywords/description | `SnSiiController::seo` | 不变；JSON-LD 仅新站 | 冻结/扩展 |
| 测试 | 解析器单测；无 API 测试 | — | 测试矩阵 | 新建 |

---

## 附录 D. 本次未执行的操作（声明）

- 未修改生产环境配置；
- 未部署 Ds Bit 或 Morrishk 服务；
- 未创建或启用任何 OAuth2 凭证（生产或测试）；
- 未调用真实 Parser API（`/api/parse`、`/api/process`）；
- 未启用 LLM 解析或 Repair；
- 未批量解析或发布产品；
- 未连接或修改 Morrishk 数据库；
- 未修改任何 URL、canonical 或 301 规则；
- 未执行 `serve_b2b.py`；
- 未访问 `dsb.0668xgwl.com`；
- 未提交、推送或合并除本送审目录以外的任何文件。

---

*文档结束。*
