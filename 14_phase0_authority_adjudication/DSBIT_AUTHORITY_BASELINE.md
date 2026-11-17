# Ds Bit 权威分支与证据基线

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-PHASE0-EVIDENCE-002 |
| 调查时间 | 2026-11-17 |
| 仓库 | `E:\workspace\icpdf-extractor`（Git 仓库） |
| 远程 | `https://codeup.aliyun.com/5f0af04d5fd102f22f6b747c/icpdf-extractor.git` |
| 结论 | 权威分支 = `DECISION_REQUIRED`；本轮以当前检出分支建立证据基线 |

> 本文件只陈述可复核事实，不宣布哪个分支「就是权威分支」。分支选择属于 Ds Bit 负责人的书面决策。

---

## 1. 分支候选矩阵

| 候选 | 提交 | 提交时间 | 与当前 HEAD 关系 | 远程跟踪 | 证据级别 |
|---|---|---|---|---|---|
| `backup/full-local-20261114`（当前检出） | `600439a5eee69fb3a1cec2715e37080e48ca9840` | 2026-11-13 07:36 +08:00 | 自身 | 无同名远程；与 `origin/feat/gate6a-audit` 同 SHA | `CONFIRMED` |
| `feat/gate6a-audit` | `600439a5eee69fb3a1cec2715e37080e48ca9840` | 2026-11-13 07:36 +08:00 | 与当前 HEAD 相同 | `origin/feat/gate6a-audit` | `CONFIRMED` |
| `main`（本地） | `a11131a80474f3d5bea5ab6fb5204e77b8839eed` | 2026-11-11 22:17 +08:00 | 当前 HEAD 的祖先；`main...backup` = 0 ahead / 15 behind | `origin/main` 落后 47 个提交 | `CONFIRMED` |
| `origin/main` | `853a80dd664c79ef90baaac53eefb9bbc2155dde` | 2026-11-05 20:30 +08:00 | 本地 `main` 的祖先 | 远程默认分支当前指向的提交 | `CONFIRMED` |

其他本地分支：`docs/s2b-r15-review`（`9d84975`）、`docs/s2b-r21-review`（`2be4ec2`）、`feat/gate6a-annotation`（`a633bf4`，远程 behind 11）、`feat/s2b-schema-d4-d6`（`60a503c`）。这些分支未被本轮用作证据基线。

### 1.1 可复核命令

```bash
cd E:/workspace/icpdf-extractor
git rev-parse HEAD
git branch -vv
git log -1 --format="%H %cI %s" backup/full-local-20261114
git log -1 --format="%H %cI %s" main
git log -1 --format="%H %cI %s" origin/main
git rev-list --left-right --count main...backup/full-local-20261114
git rev-list --left-right --count origin/main...main
```

### 1.2 关键差异

- `main` 与当前 HEAD 相差 15 个提交，方向为 `main` 落后、当前 HEAD 领先，不存在双向分叉。
- `origin/main` 仅指向初始提交，本地 `main` 领先 47 个提交，说明默认远程分支未随本地推进更新。
- `backup/full-local-20261114` 与 `origin/feat/gate6a-audit` 指向同一提交，但前者是本地备份分支，后者有远程跟踪。
- 因此至少存在三种可选权威口径：**当前工作树（backup）**、**远程功能分支 feat/gate6a-audit**、**本地 main**。三者不是等价分支；若选 `main`，本包引用的部分文件需重新核验。

**权威分支：`DECISION_REQUIRED`。** 决策人需书面明确：

1. 以哪个分支/提交作为 Ds Bit 的契约与实现基线；
2. 该基线是否包含当前 20 项未提交工作树内容；
3. 后续 Phase 1 的证据核验是否必须绑定该提交 SHA。

---

## 2. 工作树现场（未清理）

调查开始时工作树已存在未提交内容，本轮**保留现场**，未执行 stash / reset / checkout / clean，也未提交这些文件。

| 状态 | 条目 |
|---|---|
| 已暂存新增 | `.dockerignore`、`deploy/dsb/Dockerfile`、`deploy/dsb/README.md`、`deploy/dsb/docker-compose.yml`、`deploy/dsb/nginx/*`（5 个）、`deploy/dsb/rollback.sh`、`workbench/_g0/browser.py`、`workbench/_g0/common.py`、`workbench/_g0/t1_bbox.py`、`workbench/b2b/qa_console.html` |
| 已暂存修改 | `.gitignore` |
| 已修改未暂存 | `workbench/index.html`、`workbench/serve_parser.py` |
| 未跟踪 | `deploy/dsb/evidence/`、`docs/g0_evidence/`、`workbench/b2b/serve_b2b.py` |

**影响：**

- `workbench/b2b/serve_b2b.py` 不在提交 `600439a` 中，其 SHA-256 只能作为「本地工作树证据」，不能当作已提交事实。
- `deploy/dsb/README.md`、`qa_console.html` 已暂存但未提交，同样不能当作 `600439a` 的内容。
- 本包对上述文件均标注「工作树/未跟踪」，不混入提交基线。

---

## 3. Ds Bit 实现事实

### 3.1 产品身份

| 事实 | 证据 | 级别 |
|---|---|---|
| `Product` 是「一次文档解析内的产品」模型，字段含 `product_id`、`document_id`、`requested_mpn`、`normalized_mpn`、`identity_scope`、`manufacturer` | `src/icpdf/domain/product.py:37-62` | `CONFIRMED` |
| `product_id` 由 `document_id` 直接派生：`prod-{document_id}` | `src/icpdf/parser/pipeline.py:151-157` | `CONFIRMED` |
| `document_id` 默认由 PDF 内容 SHA-256 前 12 位派生：`doc-{sha[:12]}` | `src/icpdf/parser/pdf_loader.py:47,59` | `CONFIRMED` |
| `requested_mpn` 与 `normalized_mpn` 在流水线中被赋为同一值 | `src/icpdf/parser/pipeline.py:154-155` | `CONFIRMED` |
| 当 `normalized_mpn` 与 `requested_mpn` 不同时必须有 `identity_evidence`，否则校验失败 | `src/icpdf/domain/product.py:58-62` | `CONFIRMED` |
| `manufacturer` 可为空，当前运行产物中全部为空 | `src/icpdf/domain/product.py` 字段定义；运行产物统计见 §4 | `CONFIRMED` |
| 运行目录不可变，重跑生成新 `run_id`；`run_id` = UTC 时间戳 + 6 位随机十六进制 | `src/icpdf/storage/run_store.py:1,24-26` | `CONFIRMED` |
| Phase 0 明确不引入数据库 | `docs/DECISIONS.md:54` | `CONFIRMED` |
| D03：文档身份是 SHA-256，不是文件名 | `docs/DECISIONS.md:17` | `CONFIRMED` |
| D04：`requested_mpn` 与 `normalized_mpn` 永不合并 | `docs/DECISIONS.md:22` | `CONFIRMED` |

**结论：** Ds Bit 的 `product_id` 是**文档内容身份**，不是跨文档、跨来源、跨批次的产品主键；仓库内不存在产品注册表或全局唯一约束。这一点是 IQ-01 的核心事实，不涉及价值判断。

### 3.2 存储与目录

| 事实 | 证据 | 级别 |
|---|---|---|
| DuckDB lake 仅含 `raw_docs`、`parse_runs`、`eval_results` 三张表 | `lake/_build_lake.py:365,374,389` | `CONFIRMED` |
| 无产品主表、无分类表、无映射表 | 同上；全仓检索无 `taxonomy` 定义 | `CONFIRMED` |
| 运行产物不纳入版本控制（`.gitignore` 忽略 `runs/`） | `.gitignore:17-18` | `CONFIRMED` |
| 工作台服务返回 `product.json` 等解析产物，响应含 `review_status` | `workbench/serve_parser.py:119,921` | `CONFIRMED` |
| 工作台在冻结期默认 `ALLOW_PARSE=0`，不执行解析 | `workbench/serve_parser.py:23,196-211` | `CONFIRMED` |

### 3.3 B2B 静态桩

| 事实 | 证据 | 级别 |
|---|---|---|
| `serve_b2b.py` 是本地静态回放服务，要求 `ALLOW_PARSE=0`，否则拒绝启动 | `workbench/b2b/serve_b2b.py:34-37` | `CONFIRMED`（未跟踪文件） |
| 仅支持样例 `V101` | `workbench/b2b/serve_b2b.py:50` | `CONFIRMED` |
| OAuth 元数据声明 `token_endpoint_auth_methods_supported=["none"]`、`scopes_supported=["read:parts"]` | `workbench/b2b/serve_b2b.py:189-199` | `CONFIRMED` |
| `/oauth/token` 返回固定标记，不校验真实凭据 | `workbench/b2b/serve_b2b.py:216-224` | `CONFIRMED` |
| 仅提供 `/v1/health`、`/v1/parts`、`/v1/parts/{model}`；无产品主数据、无分类端点 | `workbench/b2b/serve_b2b.py:233-265` | `CONFIRMED` |
| 该文件未纳入版本控制 | `git status` 显示 `?? workbench/b2b/serve_b2b.py` | `CONFIRMED` |

**结论：** 当前 B2B 接口是回放桩，不是 Business API；不构成产品身份或分类权威，也不能作为「已接通」证据。

### 3.4 部署环境

| 事实 | 证据 | 级别 |
|---|---|---|
| `dsb.0668xgwl.com` 是 G0 预备环境，冻结态，明确「不是生产解析服务」 | `deploy/dsb/README.md:1-14` | `CONFIRMED`（已暂存未提交） |
| 应用与文件双开关 `ALLOW_PARSE=0`，`/api/parse` 不读请求体、不落盘 | `deploy/dsb/README.md:14,24` | `CONFIRMED`（已暂存未提交） |
| 未做压力测试 | `deploy/dsb/README.md:108` | `CONFIRMED`（已暂存未提交） |

### 3.5 文档分类不是产品分类

| 枚举 | 语义 | 证据 | 级别 |
|---|---|---|---|
| `SemanticDocType` | `IC_DATASHEET` / `EVM` / `USER_GUIDE` / `APP_NOTE` / `REFERENCE_DESIGN` / `OCR_REQUIRED` / `UNKNOWN` / `UNREADABLE` | `src/icpdf/classification/models.py:41` | `CONFIRMED` |
| `DocType` | 文档类型 | `src/icpdf/classification/models.py:54` | `CONFIRMED` |
| `RoutingClass` | 流水线路由类别 | `src/icpdf/classification/models.py:66` | `CONFIRMED` |
| `Route` | 处理路由 | `src/icpdf/classification/models.py:76` | `CONFIRMED` |
| `ReviewStatus` | 文档审核状态 | `src/icpdf/classification/models.py:157` | `CONFIRMED` |
| `ParameterCategory` | 参数分组（electrical / absolute_maximum / recommended_operating / thermal / mechanical / timing / other） | `src/icpdf/domain/parameter.py:12-19` | `CONFIRMED` |

**结论：** 上述枚举都不能充当产品技术分类。分类体系在 Ds Bit 中 `NOT_FOUND`。

---

## 4. 运行产物统计（只读）

统计对象：`E:\workspace\icpdf-extractor\runs\**\product.json`，只读 JSON，不修改任何文件。

| 指标 | 数值 |
|---|---|
| `product.json` 文件数 | 583 |
| 不同 `product_id` | 198 |
| 不同 `document_id` | 198 |
| 不同 `requested_mpn` | 48 |
| `normalized_mpn != requested_mpn` | 0 |
| `manufacturer` 非空 | 0 |
| `product_id == prod-<document_id>` | 583 / 583 |
| 同一 `requested_mpn` 对应多个 `product_id` 的 MPN 组 | 10 |
| 运行目录数（`runs/*` 顶层目录） | 51 |

多 `product_id` 的 MPN 组：`DUPE2`、`DUPE1`、`CFG1`、`RAGGED1`、`MULTI1`、`MPN-A`、`BLANK1`、`ROT1`、`SIMPLE1`（各 10 个 `product_id`）、`W1`（76 个）。

**解释边界：**

- 这些样本的名称与重复模式表明它们主要是测试 fixture，不是生产产品总体。
- `W1` 的 76 个 `product_id` 说明同一 `requested_mpn` 在大量不同文档上被解析为不同产品；这**证明当前链路没有按 MPN 合并**，但不能用来估计生产重复率。
- `runs/` 被 `.gitignore` 忽略，统计结果依赖本机工作树，换机器或清理后不可复现。
- 因此该统计仅支持「结构上没有全局产品主键」的结论，不支持任何生产数据比例结论。

---

## 5. 关键文件 SHA-256

| 文件 | SHA-256 | 状态 |
|---|---|---|
| `src/icpdf/domain/product.py` | `b2241c85ede62a3221197d909971e73317fd5385d09b758ad8c0b72334871cf4` | 已提交（600439a） |
| `src/icpdf/domain/document.py` | `cf78a1d885dafb487652a832a537fdc36f22be28715d2a389db2ecda6661a93b` | 已提交 |
| `src/icpdf/domain/parameter.py` | `cc2903b5c0b10faf09e49829e707e31850ca41af02a8673d4b5e386079dfb844` | 已提交 |
| `src/icpdf/parser/pipeline.py` | `86c0054969572c17f8bc19d5bd14f332053a5926c0a2300777c79ac6ab1b2fa5` | 已提交 |
| `src/icpdf/parser/pdf_loader.py` | `43522a62727c36ebe8cfbbaa6858058bb821d7961b7308d880bb38d2b6cac218` | 已提交 |
| `src/icpdf/classification/models.py` | `342fba1620f383785609546d56fc4e628343e7c11a4b19d96c815e3263cf86c4` | 已提交 |
| `src/icpdf/storage/run_store.py` | `548fb9b8215d18d122f4ea69ea1fe751180463bb7514e847c61e5afdb5541e81` | 已提交 |
| `lake/_build_lake.py` | `ae35b5844c6ae989f85aa1a834bd91313569867f5e4273c36025894599f7050c` | 已提交 |
| `docs/DECISIONS.md` | `8b83e42a45a0e7335eb434844bd5308a7c57d60ceb98a2f8edcdbadd9b47626f` | 已提交 |
| `workbench/serve_parser.py` | `84c90312d0512ff1593783bc3ac7182bf13400831323e30cb957cccf932a44ed` | 工作树有未暂存修改 |
| `workbench/index.html` | `bd19a5cf3918e5a74fa53283a7bd145b16a8e30c522c4c63e26c7eb821623f28` | 工作树有未暂存修改 |
| `workbench/b2b/qa_console.html` | `6d3dd50c695b6f322a2e91a6e7602742da4c35c9df4f3fae713804ad89d282d8` | 已暂存未提交 |
| `workbench/b2b/serve_b2b.py` | `9690706b67305bf4a4c10c88325f2198ef2db184c132a418a7ac66e8514cd91a` | 未跟踪 |
| `deploy/dsb/README.md` | `b053e99a74debdb69589d505586a7fc0a5fead43b5f0ee1e5a52595693e2364a` | 已暂存未提交 |
| `.gitignore` | `461ba2488cad233929c293f17e186e863a8139a14db5bf5465a36f4881c033aa` | 已暂存修改 |

复核命令：

```bash
cd E:/workspace/icpdf-extractor
sha256sum <文件路径>
git status --short
```

---

## 6. 权威评估

| 维度 | 结论 | 依据 |
|---|---|---|
| 提交基线是否唯一 | 否，至少 3 个候选 | §1 |
| 当前工作树是否等于任一已提交基线 | 否 | §2 |
| 当前检出分支是否可被自动认定为权威 | 否 | 任务规则明确禁止自行决定 |
| 证据基线是否足以支撑 IQ-01/IQ-02 事实判断 | 是，但需绑定 HEAD 600439a | §3–§5 |
| 是否需要重新核验 | 是，若决策人选 `main` 或要求包含未提交内容 | §1.2 |

**裁定要求：**

1. 决策人书面指定权威分支与提交 SHA。
2. 明确未提交工作树内容是否纳入基线。
3. 明确本证据包中 `CONFIRMED` 事实的失效条件（分支/提交变更即失效）。
4. 在裁定前，任何「以 Ds Bit 现状为准」的契约冻结或实现声明都不成立。

**当前状态：`DECISION_REQUIRED`。**