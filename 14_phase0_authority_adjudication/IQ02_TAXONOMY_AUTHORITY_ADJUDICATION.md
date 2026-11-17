# IQ-02 技术分类体系归属、初始种子与体系数量 — 裁定证据

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-PHASE0-EVIDENCE-004 |
| 关联问题 | `INTEGRATION_OPEN_QUESTIONS.md` IQ-02（`BLOCKER_PHASE0`） |
| 决策人 | 客户业务负责人 |
| 当前状态 | `OPEN`，`DECISION_REQUIRED` |
| 本文件性质 | 证据与选项；**不构成裁定** |
| 证据基线 | Ds Bit HEAD `600439a`；旧站 schema/源码；新平台未执行迁移 |

---

## 1. 口径：什么算「技术分类体系」

本文件采用以下判定口径，避免把现有对象误认成技术分类：

| 对象 | 是否技术分类 | 理由 |
|---|---|---|
| 产品技术分类（Technical Taxonomy） | 是 | 按产品技术属性组织的层级；拥有稳定分类 ID/code；可与产品建立归属关系 |
| 参数分组 `ParameterCategory` | 否 | 只是参数在文档/表格内的分组（electrical、thermal 等），不归属产品 |
| 文档类型 `SemanticDocType`/`DocType` | 否 | 描述 PDF 是 datasheet、EVM、user guide 等 |
| 流水线路由 `RoutingClass`/`Route` | 否 | 描述解析处理路径 |
| 业务导航分类 `snsii_product_category` | 否（作为技术分类） | 面向站点导航与 URL，按运营习惯组织，缺少技术属性定义 |
| 新平台 `pd_category` | 否（尚未成为技术分类） | 同样是两级业务导航，且未部署、无治理流程 |
| 厂商/供应商 | 否 | 组织维度，不是技术分类 |

> 名称相同不代表语义相同。旧站分类名称可以复用为**候选词**，但不能直接导入为技术分类节点。

---

## 2. 子问题拆分

| 子问题 | 内容 | 不裁定的后果 |
|---|---|---|
| Q2-a 权威归属 | 技术分类由 Ds Bit 维护、Morrishk 维护，还是双方共管 | 分类 API 归属不明；映射表无双端主键 |
| Q2-b 初始种子 | 第一批分类节点从哪里来、由谁批准 | 第一次同步无可用分类；或把导航分类误当技术分类 |
| Q2-c 体系数量 | v1 是否只允许一个已发布体系，是否按产品线拆分 | `taxonomy_id`、产品边、UI 与映射复杂度不确定 |
| Q2-d 与业务分类关系 | 技术分类与旧站/新平台导航分类如何映射 | 分类页无法落地，SEO URL 无法对应 |

---

## 3. 现状证据

### 3.1 Ds Bit

| 编号 | 事实 | 证据 | 级别 |
|---|---|---|---|
| EV-IQ02-01 | 仓库内不存在产品分类模型、分类表或分类 API | 全仓检索 `taxonomy`、`category` 模型；`lake/_build_lake.py:365-389` 仅三张表 | `NOT_FOUND`（检索范围：HEAD 600439a 工作树，排除 `runs/`） |
| EV-IQ02-02 | `ParameterCategory` 是参数分组，取值为 electrical / absolute_maximum / recommended_operating / thermal / mechanical / timing / other | `src/icpdf/domain/parameter.py:12-19` | `CONFIRMED` |
| EV-IQ02-03 | 参数强制绑定 `applicable_mpn` 与 `table_id`，从不全局 | `src/icpdf/domain/parameter.py:48,62-64` | `CONFIRMED` |
| EV-IQ02-04 | `SemanticDocType` 描述文档语义（datasheet/EVM/user guide 等） | `src/icpdf/classification/models.py:41` | `CONFIRMED` |
| EV-IQ02-05 | `DocType`、`RoutingClass`、`Route` 描述文档类型与流水线路由 | `src/icpdf/classification/models.py:54,66,76` | `CONFIRMED` |
| EV-IQ02-06 | `ReviewStatus` 是文档审核状态，不是分类发布状态 | `src/icpdf/classification/models.py:157` | `CONFIRMED` |
| EV-IQ02-07 | Phase 0 不引入数据库 | `docs/DECISIONS.md:54` | `CONFIRMED` |
| EV-IQ02-08 | B2B 静态桩无分类端点 | `workbench/b2b/serve_b2b.py:233-265` | `CONFIRMED`（未跟踪文件） |
| EV-IQ02-09 | 未发现任何分类种子文件或分类数据文件 | 全仓 `find`/`grep` | `NOT_FOUND`（同上范围） |

**结论：** Ds Bit 既没有技术分类的实现，也没有技术分类的种子；现有枚举均为参数或文档维度，不能替代。

### 3.2 Morrishk 旧站

| 编号 | 事实 | 证据 | 级别 |
|---|---|---|---|
| EV-IQ02-10 | `snsii_product_category` 为两级树：`id` 自增、`Pid` 指向父级、`Pid=0` 为顶级 | `mysql_schema_audit/01_schema.sql:347-363` | `CONFIRMED` |
| EV-IQ02-11 | `Links` 有 `UNIQUE KEY`，直接参与 URL | `01_schema.sql:351,360` | `CONFIRMED` |
| EV-IQ02-12 | `Pid` **没有索引**；无外键 | `01_schema.sql:347-363` | `CONFIRMED` |
| EV-IQ02-13 | 分类表**没有** `status`、`deprecated_at`、`deleted_at` 等生命周期字段 | 同上 | `CONFIRMED` |
| EV-IQ02-14 | 顶级分类 URL：`/big-categories/c-<Mid>-<Cid>/<Links>.html`；子分类 URL：`/sub-categories/...` | `config/params.php:99-100`；`snsii/Url.php:81,87` | `CONFIRMED` |
| EV-IQ02-15 | 分类 URL 由 `Pid>0` 决定走子分类模板，否则走顶级模板 | `models/SnSiiProductCategory.php:58-62` | `CONFIRMED` |
| EV-IQ02-16 | 产品只保存 `BigCat`/`SmallCat` 两个 smallint 字段，隐含一产品一大类一小类 | `01_schema.sql:300-301`；`models/SnSiiProduct.php:48-49` | `CONFIRMED` |
| EV-IQ02-17 | 分类 `AUTO_INCREMENT=1055`，但该值不是行数 | `01_schema.sql:363` | `CONFIRMED` |
| EV-IQ02-18 | 分类实际行数/层级分布 | 数据库离线；dump 中仅为 1 条 INSERT 语句（不代表 1 行） | `NOT_FOUND`（数据级） |

**结论：** 旧站分类是**单棵两级导航树**，带 URL 语义，与产品通过 `BigCat`/`SmallCat` 关联；没有技术属性、没有生命周期、没有多体系。它是业务导航权威的候选，但不是技术分类权威。

### 3.3 Morrishk 新平台（未部署）

| 编号 | 事实 | 证据 | 级别 |
|---|---|---|---|
| EV-IQ02-19 | `pd_category` 为两级：`parent_id`、`level`（1=大类，2=小类） | `platform/db/migrations/20261116_0001__pd_dimension_tables.up.sql:30-46` | `PROPOSED` |
| EV-IQ02-20 | `slug` 唯一、`path` 唯一 | 同上 `:44-45` | `PROPOSED` |
| EV-IQ02-21 | `pd_model.category_id` 为单值叶子分类，`root_category_id` 为冗余大类 | `...0002__pd_model_core.up.sql:33-34` | `PROPOSED` |
| EV-IQ02-22 | 迁移头部禁止 production；本轮未执行 | `...0001...:8`；`...0002...:8` | `PROPOSED` |
| EV-IQ02-23 | 开发种子只有 2 个根（Integrated Circuits、Memory）与 2 个叶（Clock & Timing、Battery-Backed Memory） | `platform/db/seeds/seed_dev.php:58-70` | `PROPOSED`（开发 fixture） |
| EV-IQ02-24 | 种子库名白名单仅 `_local/_dev/_staging` | `platform/db/seeds/seed_dev.php:10,24-28` | `PROPOSED` |
| EV-IQ02-25 | 公开分类 API 为 `/categories/{slug}`，响应含 `id`、`name`、`slug`、`path`、`breadcrumb`、`model_count` | `platform/docs/phase1/03-api-contract.yaml:348-391` | `PROPOSED` |

**结论：** 新平台的 `pd_category` 是**候选分类载体**，但它是业务导航两级树，且种子是开发 fixture，不是客户批准的技术分类种子。不能直接作为 IQ-02 的答案。

### 3.4 跨系统

| 编号 | 事实 | 证据 | 级别 |
|---|---|---|---|
| EV-IQ02-26 | 不存在旧站分类到新平台分类的映射表 | 新平台检索；`pd_category` 无 `legacy_id` 字段 | `NOT_FOUND` |
| EV-IQ02-27 | 原始 Open Questions 建议 v1 选 A、只允许一个 PUBLISHED 体系、种子由客户业务团队提供 | `INTEGRATION_OPEN_QUESTIONS.md:126-128` | `PROPOSED`（设计建议） |

---

## 4. 分类载体对照

| 系统 | 载体 | 层级 | 唯一键 | URL 语义 | 生命周期字段 | 技术属性 | 状态 |
|---|---|---|---|---|---|---|---|
| Ds Bit | 无 | — | — | — | — | — | `NOT_FOUND` |
| 旧站 | `snsii_product_category` | 两级（`Pid`） | `Links` | 是 | 无 | 无 | `CONFIRMED`，在用 |
| 新平台 | `pd_category` | 两级（`level`） | `slug`、`path` | 是 | 未在 DDL 中体现 | 无 | `PROPOSED`，未部署 |

---

## 5. 初始种子分析

| 候选种子来源 | 是否权威 | 证据 |
|---|---|---|
| 旧站 `snsii_product_category` 实际数据 | 否 | 运营导航分类；名称可复用为候选词，但语义不等价；数据级内容因 DB 离线未获取 |
| 新平台 `seed_dev.php` | 否 | 开发 fixture，仅 2+2 节点，明确 local/dev |
| Ds Bit 任何文件 | 否 | 不存在分类种子 |
| 客户业务团队提供的分类表 | 未知 | 本轮未收到任何客户文件；`NOT_FOUND` |
| 行业标准分类（如外部 taxonomy） | 未知 | 本轮未发现任何引用或授权；`NOT_FOUND` |

**判定：** 技术分类的权威初始种子在当前可访问证据中 **`NOT_FOUND`**。唯一可运行的种子是新平台开发 fixture，不能作为生产种子。

---

## 6. 选项与影响

### 选项 A：Ds Bit 维护单一技术分类体系，Morrishk 只读并映射

| 维度 | 内容 |
|---|---|
| 权威 | Ds Bit |
| 体系数量 | v1 一个 `PUBLISHED` |
| 种子 | 客户业务团队提供，经治理流程导入 |
| 优点 | 权威清晰；分类 API 一等公民；其他消费方可复用 |
| 风险 | Ds Bit 需新增分类治理与数据库能力；当前 Phase 0 无数据库；种子获取依赖客户投入 |
| 对旧站 | 需把技术分类映射到 `BigCat`/`SmallCat` 导航树 |
| 对新平台 | 可映射到 `pd_category`，但两级结构可能不足 |

### 选项 B：按产品线拆多个体系（analog / power / logic 等）

| 维度 | 内容 |
|---|---|
| 权威 | Ds Bit（多体系） |
| 体系数量 | 多个 |
| 优点 | 便于分线治理；单体系规模较小 |
| 风险 | 跨体系产品归属复杂；`taxonomy_id` 进入所有边；映射表翻倍；v1 复杂度高 |
| 对旧站 | 需要额外的体系判定规则 |
| 对新平台 | `pd_category` 无 `taxonomy_id` 字段，需要迁移扩展 |

### 选项 C：Morrishk 自建技术分类，Ds Bit 只提供参数

| 维度 | 内容 |
|---|---|
| 权威 | Morrishk |
| 体系数量 | 由 Morrishk 决定 |
| 种子 | Morrishk 业务团队 |
| 优点 | Ds Bit 负担小；分类与站点运营贴近 |
| 风险 | 分类与参数脱节；其他消费方不一致；Ds Bit 分类 API 失去意义；旧站/新平台两套分类仍需统一 |
| 对旧站 | 可直接扩展现有导航树，但会与技术语义混杂 |
| 对新平台 | 与 `pd_category` 合并，需明确是否新增技术字段 |

### 选项 D（本轮补充）：以新平台 `pd_category` 为技术分类权威，Ds Bit 只读

| 维度 | 内容 |
|---|---|
| 权威 | 新平台 |
| 体系数量 | 单体系（当前结构） |
| 种子 | 新平台治理流程；当前只有 dev fixture |
| 优点 | 已有两级分类与 API 契约；与未来站点一致 |
| 风险 | 新平台未部署且禁止 production；`pd_category` 无技术属性、无生命周期、无多体系；把 Ds Bit 绑到未上线系统 |
| 对旧站 | 需要一次性映射 |
| 对新平台 | 自洽，但需先获得生产部署授权 |

### 选项对比

| 维度 | A Ds Bit 单体系 | B Ds Bit 多体系 | C Morrishk 自建 | D 新平台 |
|---|---|---|---|---|
| 权威清晰 | 高 | 中 | 中 | 中（未上线） |
| v1 可落地 | 需新库 | 需新库且更复杂 | 可基于旧站扩展 | 需新平台上线 |
| 与参数同源 | 是 | 是 | 否 | 部分 |
| 对旧站 URL 影响 | 需映射 | 需映射 | 直接 | 需映射 |
| 当前证据支持 | 设计建议 | 无 | 无 | 载体存在但未部署 |

---

## 7. 裁定就绪度

| 检查项 | 状态 |
|---|---|
| 是否已确认 Ds Bit 无技术分类 | 是 |
| 是否已确认旧站/新平台分类为导航分类 | 是 |
| 是否已确认权威种子 | 否，`NOT_FOUND` |
| 是否已确认体系数量 | 否，需业务裁定 |
| 是否可形成互斥选项 | 是，A/B/C/D |
| 是否可由执行 Agent 选择 | 否，必须由客户业务负责人书面裁定 |

**结论：** IQ-02 证据已达到「可提交裁定」的完备度，但**尚未裁定**。状态 `DECISION_REQUIRED`。

裁定至少需要明确：

1. Q2-a 权威归属：Ds Bit / Morrishk / 新平台 / 共管。
2. Q2-b 初始种子：由谁提供、以什么格式、何时批准；是否允许用旧站名称作为候选词。
3. Q2-c 体系数量：v1 是否严格一个 `PUBLISHED`；多体系是否延后。
4. Q2-d 与旧站/新平台导航分类的映射责任与验收标准。
5. 分类生命周期字段（与 IQ-05 联动）由哪个系统承载。

---

## 8. 未决证据缺口

| 缺口 | 原因 | 影响 | 关闭方式（需另行授权） |
|---|---|---|---|
| 旧站分类实际节点数、层级分布、空 `Links` | 数据库离线 | 无法评估种子迁移规模 | 只读副本聚合查询 |
| 旧站分类名称与技术分类的语义差异 | 无客户分类表 | 无法判断名称复用比例 | 客户业务团队提供对照表 |
| 新平台分类是否会被批准生产 | 迁移禁止 production | 选项 D 可行性未知 | 平台负责人书面裁定 |
| 是否存在外部行业分类授权 | 未收到相关文件 | 种子来源不确定 | 客户确认 |

在上述缺口关闭前，任何「分类种子已具备」或「迁移规模可估算」的结论都不成立。

---

## 9. 对下游的阻断

IQ-02 未裁定会阻断：

- 分类 API 的归属与端点设计。
- `taxonomy_id`、`category_id`、`category_code` 的治理规则（IQ-03）。
- `dsbit_category_mapping` 的双端主键。
- 分类页 URL 与旧站导航的映射（IQ-18）。
- 分类生命周期与 410 时机（IQ-05）。

**在 IQ-02 书面裁定前，契约不得冻结，Phase 1 不得开始。**