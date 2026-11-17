# Phase 0 证据索引

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-PHASE0-EVIDENCE-006 |
| 调查日期 | 2026-11-17 |
| 证据基线 | Ds Bit HEAD `600439a`（含明确标注的工作树/未跟踪文件）；Morrishk 旧站 schema 审计与源码；新平台未执行迁移 |
| 有效性声明 | 本文证据仅对调查时点的文件内容有效；分支、提交或工作树变化后需重新核验 |
| 安全声明 | 未输出任何密码、Token、Secret 或凭据值；配置文件只记录变量名与存在性 |

---

## 1. Ds Bit 仓库与基线

| 编号 | 证据 | 位置 | 提交/状态 | SHA-256 | 级别 | 摘要 |
|---|---|---|---|---|---|---|
| EV-BASE-01 | 仓库与远程 | `E:\workspace\icpdf-extractor`；`git remote -v` | 工作树 | — | `CONFIRMED` | 远程为 Codeup `icpdf-extractor.git` |
| EV-BASE-02 | 当前分支与 HEAD | `git rev-parse` | `backup/full-local-20261114` @ `600439a5eee69fb3a1cec2715e37080e48ca9840` | — | `CONFIRMED` | 检出分支为本地备份分支 |
| EV-BASE-03 | 远程功能分支 | `origin/feat/gate6a-audit` | `600439a5...` | — | `CONFIRMED` | 与当前 HEAD 同 SHA |
| EV-BASE-04 | 本地 main | `main` | `a11131a80474f3d5bea5ab6fb5204e77b8839eed` | — | `CONFIRMED` | 当前 HEAD 的祖先，落后 15 个提交 |
| EV-BASE-05 | 远程 main | `origin/main` | `853a80dd664c79ef90baaac53eefb9bbc2155dde` | — | `CONFIRMED` | 初始提交；本地 main 领先 47 个提交 |
| EV-BASE-06 | 工作树未提交现场 | `git status --short` | 20 项 | — | `CONFIRMED` | 已保留，未清理、未提交 |
| EV-BASE-07 | 运行产物不入库 | `.gitignore` | 已暂存修改 | `461ba2488cad233929c293f17e186e863a8139a14db5bf5465a36f4881c033aa` | `CONFIRMED` | 第 17–18 行忽略 `runs/` |

### 复核命令

```bash
cd E:/workspace/icpdf-extractor
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
git branch -vv
git status --short
git remote -v
sha256sum .gitignore
```

---

## 2. Ds Bit 产品身份

| 编号 | 证据 | 位置 | 提交/状态 | SHA-256 | 级别 | 摘要 |
|---|---|---|---|---|---|---|
| EV-PID-01 | `Product` 模型 | `src/icpdf/domain/product.py:37-62` | 600439a | `b2241c85ede62a3221197d909971e73317fd5385d09b758ad8c0b72334871cf4` | `CONFIRMED` | 单文档产品；字段含 `product_id`、`document_id`、`requested_mpn`、`normalized_mpn`、`identity_scope`、`manufacturer` |
| EV-PID-02 | `product_id` 派生 | `src/icpdf/parser/pipeline.py:151-157` | 600439a | `86c0054969572c17f8bc19d5bd14f332053a5926c0a2300777c79ac6ab1b2fa5` | `CONFIRMED` | `product_id = prod-{document_id}` |
| EV-PID-03 | `document_id` 派生 | `src/icpdf/parser/pdf_loader.py:47,59` | 600439a | `43522a62727c36ebe8cfbbaa6858058bb821d7961b7308d880bb38d2b6cac218` | `CONFIRMED` | `doc-{sha256[:12]}` |
| EV-PID-04 | 归一 MPN 赋值 | `src/icpdf/parser/pipeline.py:154-155` | 600439a | 同上 | `CONFIRMED` | `normalized_mpn` 直接取 `requested_mpn` |
| EV-PID-05 | 身份证据校验 | `src/icpdf/domain/product.py:58-62` | 600439a | 同上 | `CONFIRMED` | 归一值不同则必须提供 `identity_evidence` |
| EV-PID-06 | 运行身份 | `src/icpdf/storage/run_store.py:1,24-26` | 600439a | `548fb9b8215d18d122f4ea69ea1fe751180463bb7514e847c61e5afdb5541e81` | `CONFIRMED` | 运行目录不可变；`run_id` = 时间戳 + 随机 hex |
| EV-PID-07 | 文档身份决策 | `docs/DECISIONS.md:17` | 600439a | `8b83e42a45a0e7335eb434844bd5308a7c57d60ceb98a2f8edcdbadd9b47626f` | `CONFIRMED` | D03：文档身份用 SHA-256 |
| EV-PID-08 | MPN 分离决策 | `docs/DECISIONS.md:22` | 600439a | 同上 | `CONFIRMED` | D04：请求 MPN 与归一 MPN 不合并 |
| EV-PID-09 | 无数据库决策 | `docs/DECISIONS.md:54` | 600439a | 同上 | `CONFIRMED` | D09：Phase 0 不引入数据库 |
| EV-PID-10 | 文档领域模型 | `src/icpdf/domain/document.py` | 600439a | `cf78a1d885dafb487652a832a537fdc36f22be28715d2a389db2ecda6661a93b` | `CONFIRMED` | 文档对象与 `document_id` 契约 |

### 复核命令

```bash
cd E:/workspace/icpdf-extractor
sed -n '37,62p' src/icpdf/domain/product.py
sed -n '151,157p' src/icpdf/parser/pipeline.py
sed -n '43,61p' src/icpdf/parser/pdf_loader.py
sed -n '1,30p' src/icpdf/storage/run_store.py
sha256sum src/icpdf/domain/product.py src/icpdf/parser/pipeline.py
```

---

## 3. Ds Bit 存储、分类与接口

| 编号 | 证据 | 位置 | 提交/状态 | SHA-256 | 级别 | 摘要 |
|---|---|---|---|---|---|---|
| EV-DSB-01 | 参数分组 | `src/icpdf/domain/parameter.py:12-19` | 600439a | `cc2903b5c0b10faf09e49829e707e31850ca41af02a8673d4b5e386079dfb844` | `CONFIRMED` | `ParameterCategory` 是参数分组，不是产品分类 |
| EV-DSB-02 | 参数绑定 | `src/icpdf/domain/parameter.py:48,62-64` | 600439a | 同上 | `CONFIRMED` | `applicable_mpn`、`table_id` 必填 |
| EV-DSB-03 | 文档类型枚举 | `src/icpdf/classification/models.py:41,54,66,76,157` | 600439a | `342fba1620f383785609546d56fc4e628343e7c11a4b19d96c815e3263cf86c4` | `CONFIRMED` | `SemanticDocType`/`DocType`/`RoutingClass`/`Route`/`ReviewStatus` |
| EV-DSB-04 | DuckDB 表 | `lake/_build_lake.py:365,374,389` | 600439a | `ae35b5844c6ae989f85aa1a834bd91313569867f5e4273c36025894599f7050c` | `CONFIRMED` | 仅 `raw_docs`、`parse_runs`、`eval_results`；无产品/分类主表 |
| EV-DSB-05 | B2B 静态桩 | `workbench/b2b/serve_b2b.py:34-37,50,189-199,216-224,233-265` | **未跟踪** | `9690706b67305bf4a4c10c88325f2198ef2db184c132a418a7ac66e8514cd91a` | `CONFIRMED` | 要求 `ALLOW_PARSE=0`；仅 `V101`；OAuth 返回固定标记；仅 3 个只读端点 |
| EV-DSB-06 | 工作台服务 | `workbench/serve_parser.py:23,119,196-211,315,921` | 工作树有未暂存修改 | `84c90312d0512ff1593783bc3ac7182bf13400831323e30cb957cccf932a44ed` | `CONFIRMED` | 返回 `product.json`；冻结期默认不解析；`database_written: false` |
| EV-DSB-07 | 前端标题 | `workbench/index.html:7` | 工作树有未暂存修改 | `bd19a5cf3918e5a74fa53283a7bd145b16a8e30c522c4c63e26c7eb821623f28` | `CONFIRMED` | `<title>Ds Bit - Parser Lab (Parser-only)</title>` |
| EV-DSB-08 | 校对台 | `workbench/b2b/qa_console.html` | 已暂存未提交 | `6d3dd50c695b6f322a2e91a6e7602742da4c35c9df4f3fae713804ad89d282d8` | `CONFIRMED` | 本地回放校对台 |
| EV-DSB-09 | G0 部署说明 | `deploy/dsb/README.md:1-14,24,108` | 已暂存未提交 | `b053e99a74debdb69589d505586a7fc0a5fead43b5f0ee1e5a52595693e2364a` | `CONFIRMED` | 明确「不是生产解析服务」；`ALLOW_PARSE=0`；未做压力测试 |
| EV-DSB-10 | 无技术分类 | 全仓 `grep -rin "taxonomy"`（排除 `runs/`） | 600439a 工作树 | — | `NOT_FOUND` | 未发现分类体系/分类表/分类 API |
| EV-DSB-11 | 无分类种子 | 全仓 `find`/`grep` 分类数据文件 | 600439a 工作树 | — | `NOT_FOUND` | 未发现分类种子 |

### 复核命令

```bash
cd E:/workspace/icpdf-extractor
grep -rin "taxonomy" --include="*.py" --include="*.md" . | grep -v runs/
sed -n '365,400p' lake/_build_lake.py
sed -n '30,55p' workbench/b2b/serve_b2b.py
sed -n '189,230p' workbench/b2b/serve_b2b.py
sha256sum workbench/b2b/serve_b2b.py workbench/serve_parser.py
git status --short workbench/b2b/serve_b2b.py
```

---

## 4. Ds Bit 运行产物统计

| 编号 | 证据 | 方法 | 级别 | 摘要 |
|---|---|---|---|---|
| EV-RUN-01 | `product.json` 统计 | 只读 Python 遍历 `runs/**/product.json` | `CONFIRMED`（本机产物） | 583 文件 / 198 `product_id` / 198 `document_id` / 48 `requested_mpn` |
| EV-RUN-02 | 归一与厂商 | 同上 | `CONFIRMED`（本机产物） | `normalized != requested` = 0；`manufacturer` 非空 = 0 |
| EV-RUN-03 | MPN 多 ID | 同上 | `CONFIRMED`（fixture 样本） | 10 个 MPN 组对应多个 `product_id`；`W1` 对应 76 个 |
| EV-RUN-04 | 产物不可复现性 | `.gitignore:17-18` | `CONFIRMED` | `runs/` 不入库；换机或清理后不可复现 |

### 复核命令（只读）

```bash
cd E:/workspace/icpdf-extractor
python - <<'PY'
import json,glob,collections
rows=[json.load(open(f,encoding='utf-8')) for f in glob.glob('runs/**/product.json',recursive=True)]
print(len(rows), len({d['product_id'] for d in rows}), len({d['document_id'] for d in rows}), len({d['requested_mpn'] for d in rows}))
print(sum(1 for d in rows if d.get('normalized_mpn')!=d.get('requested_mpn')))
print(sum(1 for d in rows if d.get('manufacturer')))
g=collections.defaultdict(set)
for d in rows: g[d['requested_mpn']].add(d['product_id'])
print({k:len(v) for k,v in g.items() if len(v)>1})
PY
```

> 该统计只证明「当前链路没有全局产品主键」，不用于推断生产重复率。

---

## 5. Morrishk 旧站 schema 与源码

| 编号 | 证据 | 位置 | SHA-256 | 级别 | 摘要 |
|---|---|---|---|---|---|
| EV-MO-01 | 产品 DDL | `mysql_schema_audit/01_schema.sql:296-327` | `08f01c74cea8a7d6422799a149763e2c492035b1ce20365807e431a8975b9ff2` | `CONFIRMED` | `id` 自增；`PartNumber` 唯一；`PartUrl` 普通索引；无厂商字段；MyISAM |
| EV-MO-02 | 分类 DDL | `01_schema.sql:347-363` | 同上 | `CONFIRMED` | 两级 `Pid`；`Links` 唯一；无生命周期字段；MyISAM |
| EV-MO-03 | 供应商 DDL | `01_schema.sql:459-472` | 同上 | `CONFIRMED` | `/manufacturer/...` 实际查询的 `snsii_supplier`；`Links` 唯一 |
| EV-MO-04 | 索引清单 | `mysql_schema_audit/04_index_inventory.csv` | `5c67a4b873e4a3675b7e8e2e689e1608bf0cf92f44016833335f1b0a6448d53c` | `CONFIRMED` | 复核唯一/非唯一索引 |
| EV-MO-05 | 表清单 | `mysql_schema_audit/02_table_inventory.csv` | `386a66ef316ddbc34e3ad07b0b901961a14bdb289b31827cd3b657f2faa14095` | `CONFIRMED` | 31 表；30 MyISAM + 1 InnoDB；全部 `utf8` |
| EV-MO-06 | 字段清单 | `mysql_schema_audit/03_column_inventory.csv` | `c436d5373f730a778dfc92200d02ad638ae634cd36701234ee7b873e10ada90f` | `CONFIRMED` | 产品表无厂商/品牌列；`Mid` 为商家 ID |
| EV-MO-07 | 其他对象 | `mysql_schema_audit/05_other_objects.sql` | `2d68cc1765f6ea727d8217073287db9ea1e3f08b01e2e2c835a020079106229d` | `CONFIRMED` | 无相关分类/产品附加对象 |
| EV-MO-08 | dump 元数据 | `mysql_schema_audit/_work/meta.json` | `ed8c8605487a3f54fc76497579c0bf4f2b49707abc38044826a465848acbb107` | `CONFIRMED` | 源文件 47,820,894,346 字节；SHA-256 `7a59ac...6717`；`snsii_product` 有 7,889 条 INSERT 语句（非行数） |
| EV-MO-09 | URL 规则 | `newPlan/morrishk.net/config/params.php:97-100` | `81be76769b98bfe8f04935045d91d7b35c94ed2529056ffc90c0ec3f35132972` | `CONFIRMED` | 产品 8 位 ID；大类/子类/厂商 URL |
| EV-MO-10 | 分类 URL 生成 | `newPlan/morrishk.net/models/SnSiiProductCategory.php:58-62` | `4193a9c9671538d6c0d460cbcddf7f5557b4d95d576215932ec86529a92f0820` | `CONFIRMED` | `Pid>0` 走子分类，否则走大类 |
| EV-MO-11 | 产品 URL 生成 | `newPlan/morrishk.net/models/SnSiiProduct.php:48-49,63` | `67eead96929fb00e9e4ab9d2e980dfcf595df6dcf969169556d465093433706e` | `CONFIRMED` | `ProItem($id,$PartUrl)`；`BigCat`/`SmallCat` 整型 |
| EV-MO-12 | URL 工具 | `newPlan/morrishk.net/snsii/Url.php:81,87,104` | `5c1f15db738380c69ca21bcba2a41cf365149ba5ac8d9b9b9fc106eefe2958dc` | `CONFIRMED` | `BCUrl`/`SCUrl`/`ProItem` |
| EV-MO-13 | 厂商页实为供应商页 | `newPlan/morrishk.net/controllers/MfrController.php:27,35,57` | `3e73eac06303ff7b8d576f5fe474721bc3df12eb434a0a90dd44b618be030457` | `CONFIRMED` | `SnSiiSupplier::find()`，不是产品厂牌 |
| EV-MO-14 | 数据库配置存在性 | `newPlan/morrishk.net/config/db.php` | — | `CONFIRMED`（仅存在性） | DSN 指向 `localhost`、库名 `morris`；变量名 `dsn/username/password`；**未展示任何值** |
| EV-MO-15 | 数据库离线 | 只读连接 `127.0.0.1:3306` | — | `NOT_FOUND` | 2026-11-17 连接超时；此前 PDO 返回连接拒绝；未尝试修改数据库 |

### 复核命令

```bash
cd E:/workspace/独立站/morries
sed -n '296,327p' mysql_schema_audit/01_schema.sql
sed -n '347,363p' mysql_schema_audit/01_schema.sql
sed -n '459,472p' mysql_schema_audit/01_schema.sql
sed -n '97,100p' newPlan/morrishk.net/config/params.php
sha256sum mysql_schema_audit/01_schema.sql mysql_schema_audit/02_table_inventory.csv
```

---

## 6. Morrishk 新平台（PROPOSED）

| 编号 | 证据 | 位置 | SHA-256 | 级别 | 摘要 |
|---|---|---|---|---|---|
| EV-PF-01 | 维度表迁移 | `platform/db/migrations/20261116_0001__pd_dimension_tables.up.sql:8,30-46` | `c92ac88545a47ded1e8236427e6d194b9fdded367b66c1155fb4d345d4387e90` | `PROPOSED` | `pd_category` 两级；`slug`/`path` 唯一；禁止 production |
| EV-PF-02 | 产品核心迁移 | `platform/db/migrations/20261116_0002__pd_model_core.up.sql:8,22-62` | `415ac794120d7c8b146bdbb953b6a32d0018cc4df26c891ee59d87daafbc7ef3` | `PROPOSED` | `pd_model`；`uk_mpn_norm`/`uk_mpn_slug`/`uk_legacy`；`brand_id` 不参与唯一 |
| EV-PF-03 | 开发种子 | `platform/db/seeds/seed_dev.php:10,24-28,58-70` | `1bf01f8ee2bed87c2d408375d30c9aa46e40183a0fe329d5dca476096166d8d7` | `PROPOSED` | 2 根 + 2 叶；库名白名单仅 local/dev/staging |
| EV-PF-04 | API 契约 | `platform/docs/phase1/03-api-contract.yaml:9-12,66,338-341,348-391` | `a1ed1b67f3f6eb44e800e5522e04ac05b8052349e4d17ca1bf5b6b3b213e6c31` | `PROPOSED` | 统一响应包；`/models/{mpn}`；`/categories/{slug}` |
| EV-PF-05 | 前端错误解析 | `platform/web/src/lib/api/client.ts:28-36,77-90` | `c7579c000148216cc6b8586f554a7471c2e643ae88cf823b0362bc71b2608da8` | `PROPOSED` | `ApiError` 依赖 `code/message/request_id` |

### 复核命令

```bash
cd E:/workspace/独立站/morries/platform
sed -n '1,50p' db/migrations/20261116_0001__pd_dimension_tables.up.sql
sed -n '20,62p' db/migrations/20261116_0002__pd_model_core.up.sql
sed -n '1,80p' db/seeds/seed_dev.php
sha256sum db/migrations/*.sql docs/phase1/03-api-contract.yaml
```

> 迁移头部明确「执行环境：local / dev / staging（禁止 production）」。本轮未连接任何数据库，未执行迁移或种子。

---

## 7. 设计文档引用（仅作背景，不作为代码事实）

| 编号 | 证据 | 位置 | 级别 | 用途 |
|---|---|---|---|---|
| EV-DOC-01 | IQ-01 原始问题与建议 | `12_.../INTEGRATION_OPEN_QUESTIONS.md:55-94` | `PROPOSED` | 决策人原始问题与设计建议 |
| EV-DOC-02 | IQ-02 原始问题与建议 | `12_.../INTEGRATION_OPEN_QUESTIONS.md:98-138` | `PROPOSED` | 同上 |
| EV-DOC-03 | 主文档 §1.1 冻结状态 | `12_.../Ds Bit ↔ Morrishk Business API Integration Design v1.md` | `PROPOSED` | 明确尚不具备冻结条件 |
| EV-DOC-04 | 主文档 §7 分类/产品端点 | 同上 | `PROPOSED` | 设计端点，不是实现 |

> 设计文档只用于理解意图；本索引中的代码事实均来自源码、schema 或 Git 元数据。

---

## 8. 不可用或受限证据

| 项 | 状态 | 原因 | 影响 |
|---|---|---|---|
| 旧站数据库行级数据 | `NOT_FOUND` | 实例未监听 3306；未尝试启动或修改 | 无法量化重复率、分类节点数、NULL 分布 |
| 47.8GB dump 内容 | 未解析 | 本轮只阅读既有审计产物，不重新解析大文件 | 数据级结论只能用 `meta.json` 的语句计数 |
| `runs/` 统计的长期有效性 | 本机快照 | 未纳入版本控制 | 换机或清理后不可复现 |
| `serve_b2b.py` | 未跟踪 | 工作树文件 | 不能当作已提交事实 |
| `deploy/dsb/README.md`、`qa_console.html` | 已暂存未提交 | 工作树状态 | 不能当作 `600439a` 内容 |
| 新平台迁移/种子 | 未执行 | 迁移禁止 production | 只能标 `PROPOSED` |
| 生产 OAuth2 凭证 | 未生成 | 任务明确禁止 | IQ-21 无实证 |

---

## 9. 证据失效条件

以下任一变化会使对应证据失效，需要重新核验：

1. Ds Bit 权威分支或提交基线变更。
2. 本索引列出的源文件 SHA-256 变化。
3. 旧站 schema 审计产物被重新生成且与当前哈希不同。
4. 新平台迁移被修改或执行。
5. 旧站数据库恢复可访问，产生新的数据级证据。
6. Review 仓库 `12_` 文档版本变化，导致问题编号或选项变化。

复核方式：对本文件所有 SHA-256 执行 `sha256sum` 对比；对 Git 证据执行 `git rev-parse` 与 `git status`。