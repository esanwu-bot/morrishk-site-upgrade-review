# IQ-01 产品身份权威与 ID 空间 — 裁定证据

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-PHASE0-EVIDENCE-003 |
| 关联问题 | `INTEGRATION_OPEN_QUESTIONS.md` IQ-01（`BLOCKER_PHASE0`） |
| 决策人 | 客户业务负责人 + Ds Bit 负责人 |
| 当前状态 | `OPEN`，`DECISION_REQUIRED` |
| 本文件性质 | 证据与选项；**不构成裁定** |
| 证据基线 | Ds Bit HEAD `600439a`；Morrishk 旧站 schema 审计与源码；新平台未执行迁移 |

---

## 1. 问题拆分

原始问题「用什么作为产品权威身份」实际包含三个必须分别回答的子问题：

| 子问题 | 内容 | 不裁定的后果 |
|---|---|---|
| Q1-a 业务键 | 判定「同一个产品」用什么字段组合：仅 MPN、MPN+品牌+封装、还是代理键 | 同步会合并不同产品，或把同一产品写成多行 |
| Q1-b ID 签发者 | 跨系统稳定 ID 由谁签发：Ds Bit 注册表、旧站自增 ID、新平台 `pd_model.id`、还是 MPN/slug | 映射表主键不稳定，撤回与审计链断裂 |
| Q1-c 身份范围 | `identity_scope` 如何区分裸芯片、评估板、板载器件 | `AFE7950` 与 `AFE7950EVM` 等会互相覆盖 |

三个子问题可以分别裁定，但 Q1-b 依赖 Q1-a，Q1-c 依赖业务键是否包含封装/形态。

---

## 2. 现状证据

### 2.1 Ds Bit

| 编号 | 事实 | 证据 | 级别 |
|---|---|---|---|
| EV-IQ01-01 | `Product` 是单文档产品模型，字段含 `product_id`、`document_id`、`requested_mpn`、`normalized_mpn`、`identity_scope`、`manufacturer` | `src/icpdf/domain/product.py:37-62` | `CONFIRMED` |
| EV-IQ01-02 | `product_id = prod-{document_id}`，无注册表、无全局唯一约束 | `src/icpdf/parser/pipeline.py:151-157` | `CONFIRMED` |
| EV-IQ01-03 | `document_id = doc-{sha256[:12]}`，由 PDF 内容派生 | `src/icpdf/parser/pdf_loader.py:47,59` | `CONFIRMED` |
| EV-IQ01-04 | 流水线把 `requested_mpn` 直接赋给 `normalized_mpn` | `src/icpdf/parser/pipeline.py:154-155` | `CONFIRMED` |
| EV-IQ01-05 | `normalized_mpn` 与 `requested_mpn` 不同时必须提供身份证据 | `src/icpdf/domain/product.py:58-62` | `CONFIRMED` |
| EV-IQ01-06 | `run_id` 是执行身份，不是产品身份；重跑产生新 `run_id` | `src/icpdf/storage/run_store.py:1,24-26` | `CONFIRMED` |
| EV-IQ01-07 | Phase 0 不引入数据库 | `docs/DECISIONS.md:54` | `CONFIRMED` |
| EV-IQ01-08 | 决策 D03：文档身份用 SHA-256；D04：请求 MPN 与归一 MPN 不合并 | `docs/DECISIONS.md:17,22` | `CONFIRMED` |
| EV-IQ01-09 | 运行产物统计：583 个 `product.json`、198 个 `product_id`、198 个 `document_id`、48 个 `requested_mpn`；`normalized != requested` 为 0；`manufacturer` 非空为 0 | 本机 `runs/**/product.json` 只读统计 | `CONFIRMED`（本地产物，不入库） |
| EV-IQ01-10 | 同一 `requested_mpn` 对应多个 `product_id` 的组有 10 个，其中 `W1` 对应 76 个 `product_id` | 同上 | `CONFIRMED`（fixture 样本） |
| EV-IQ01-11 | `runs/` 被 `.gitignore` 忽略，运行产物不进入版本控制 | `.gitignore:17-18` | `CONFIRMED` |

**结论：** Ds Bit 当前**没有**跨文档产品权威，也没有签发稳定产品 ID 的机制。`product_id` 只能回答「这份 PDF 里的这个产品实例」，不能回答「这是不是全站同一个产品」。

### 2.2 Morrishk 旧站

| 编号 | 事实 | 证据 | 级别 |
|---|---|---|---|
| EV-IQ01-12 | `snsii_product.id` 为 `int(8)` 自增主键，`AUTO_INCREMENT=10093686` | `mysql_schema_audit/01_schema.sql:296-327` | `CONFIRMED` |
| EV-IQ01-13 | `PartNumber` 有**全局** `UNIQUE KEY` | `01_schema.sql:318`；`04_index_inventory.csv` | `CONFIRMED` |
| EV-IQ01-14 | `PartUrl` 只有普通索引，不是唯一键 | `01_schema.sql:324` | `CONFIRMED` |
| EV-IQ01-15 | `Md5` 有 `UNIQUE KEY` | `01_schema.sql:319` | `CONFIRMED` |
| EV-IQ01-16 | `snsii_product` **没有厂商/品牌字段**；`Mid` 注释为「商家ID」 | `01_schema.sql:301`；字段清单 `03_column_inventory.csv` | `CONFIRMED` |
| EV-IQ01-17 | `/manufacturer/<Links>` 路由查询的是 `snsii_supplier`（供应商/商家），不是产品厂牌 | `controllers/MfrController.php:35,57`；`snsii_supplier` DDL `01_schema.sql:459-472` | `CONFIRMED` |
| EV-IQ01-18 | 产品 URL 使用 8 位 `id` 与 `PartUrl`：`/products/<8位id>/<PartUrl>.html` | `config/params.php:97`；`models/SnSiiProduct.php:63`；`snsii/Url.php:104` | `CONFIRMED` |
| EV-IQ01-19 | 旧站数据库实例当前不可只读访问（`127.0.0.1:3306` 超时；此前 PDO 连接被拒绝） | 2026-11-17 只读连接尝试 | `NOT_FOUND`（数据级） |

**结论：** 旧站的业务键事实上是**全局 MPN**。由于 `PartNumber` 唯一，同一 MPN 不可能以不同厂商身份并存；由于没有厂商字段，也无法在旧站内表达「同一 MPN、不同厂商」。`PartUrl` 非唯一意味着不同产品可以共享同一 URL 片段，URL 唯一性并不由数据层保证。

### 2.3 Morrishk 新平台（未部署）

| 编号 | 事实 | 证据 | 级别 |
|---|---|---|---|
| EV-IQ01-20 | 迁移头部标注仅 local/dev/staging、禁止 production | `platform/db/migrations/20261116_0002__pd_model_core.up.sql:8` | `PROPOSED` |
| EV-IQ01-21 | `pd_model.id` 为 `BIGINT` 自增主键 | 同上 `:23` | `PROPOSED` |
| EV-IQ01-22 | `mpn_norm` 为生成列，`UNIQUE KEY uk_mpn_norm (mpn_norm)` **全局唯一** | 同上 `:25-27,56` | `PROPOSED` |
| EV-IQ01-23 | `mpn_slug` 全局唯一 | 同上 `:29,57` | `PROPOSED` |
| EV-IQ01-24 | `brand_id`、`category_id`、`root_category_id` 为普通字段，品牌不参与 MPN 唯一约束 | 同上 `:32-34` | `PROPOSED` |
| EV-IQ01-25 | `legacy_id` 唯一，注释为源 `snsii_product.id` | 同上 `:51,58` | `PROPOSED` |
| EV-IQ01-26 | 公开 API `/models/{mpn}` 以 MPN 为路径参数，响应必填 `mpn`、`slug`、`brand`、`stock_status`，不暴露 `pd_model.id` | `platform/docs/phase1/03-api-contract.yaml:66,338-341` | `PROPOSED` |
| EV-IQ01-27 | 开发种子只插入 3 个品牌、4 个分类、少量模型，且库名白名单限定 local/dev/staging | `platform/db/seeds/seed_dev.php:12,35-60` | `PROPOSED` |

**结论：** 新平台设计上同样把 **MPN 全局唯一**作为业务键，`brand_id` 只是属性，不参与唯一性；对外身份是 MPN/slug，不是自增 ID。该设计尚未执行，不能当作既成权威。

### 2.4 跨系统

| 编号 | 事实 | 证据 | 级别 |
|---|---|---|---|
| EV-IQ01-28 | Ds Bit、旧站、新平台之间不存在任何产品映射表或同步记录 | 三仓检索；`lake/_build_lake.py:365-389` 仅三张表 | `NOT_FOUND` |
| EV-IQ01-29 | 原始 Open Questions 建议 A（Ds Bit 注册表 + ULID） | `INTEGRATION_OPEN_QUESTIONS.md:82-84` | `PROPOSED`（设计建议） |

---

## 3. ID 空间对照

| 系统 | 主键 | 业务唯一键 | 是否全局 | 厂商维度 | 当前是否可作权威 |
|---|---|---|---|---|---|
| Ds Bit | `product_id = prod-<document_id>` | 无 | 否，文档内 | 字段存在但当前为空 | 否 |
| Ds Bit | `run_id` | 无 | 否，执行级 | 无 | 否 |
| 旧站 | `snsii_product.id`（int8 自增） | `PartNumber` 全局唯一 | 是 | **无字段** | 事实在用，但无跨系统映射 |
| 新平台 | `pd_model.id`（bigint 自增） | `mpn_norm` / `mpn_slug` 全局唯一 | 是 | `brand_id` 仅属性 | 设计候选，未部署 |
| 旧站分类 | `snsii_product_category.id` | `Links` 唯一 | 是 | 无 | 分类题，见 IQ-02 |

---

## 4. 重复与冲突分析

### 4.1 Ds Bit 内部

| 观察 | 数值 | 解释 |
|---|---|---|
| `product.json` 文件数 | 583 | 同一文档在多次运行中重复出现 |
| 不同 `product_id` | 198 | `product_id` 由文档内容决定，跨运行稳定 |
| 不同 `document_id` | 198 | 与 `product_id` 一一对应 |
| 不同 `requested_mpn` | 48 | 198 个产品实例对应 48 个 MPN |
| 同一 MPN 多 `product_id` 的组 | 10 | `DUPE1`/`DUPE2`/`CFG1`/`RAGGED1`/`MULTI1`/`MPN-A`/`BLANK1`/`ROT1`/`SIMPLE1` 各 10 个，`W1` 76 个 |
| `normalized != requested` | 0 | 归一化尚未真实发生 |
| `manufacturer` 非空 | 0 | 厂商维度完全缺失 |

**判定：**

- 按 `product_id`：无重复（198 个 ID 对应 198 个文档）。
- 按业务键 MPN：存在大量「一 MPN 多 ID」。这不是代码缺陷，而是当前设计没有把 MPN 当产品主键。
- 样本性质：fixture 命名明显，不能据此推断生产重复率。
- 跨运行：同一文档产生同一 `product_id`，说明文档身份稳定；但文档一变（例如重新下载同型号另一版 datasheet），`product_id` 就变，产品身份随之漂移。

### 4.2 旧站内部

- `PartNumber UNIQUE` 在结构上**禁止**同一 MPN 出现两行；因此旧站内部不存在「同 MPN 多产品」。
- 但这也意味着旧站**无法**表达「同一 MPN 属于不同厂商」；若业务上存在这种情况，旧站必须改号或合并。
- `PartUrl` 非唯一：不同产品可共享 URL 片段，实际 URL 是否重复需数据级核验；数据库离线，级别 `NOT_FOUND`。
- `Md5 UNIQUE` 约束的是整行内容摘要，不是业务身份，不能替代 MPN。

### 4.3 新平台内部

- `uk_mpn_norm` 全局唯一，`brand_id` 不参与唯一键；与旧站同构。
- `uk_legacy` 保证一个旧站 ID 只能映射一次，但不保证反向一对一（多个旧站 ID 可映射到不同新模型）。
- `uk_mpn_slug` 与 `uk_mpn_norm` 双唯一，若 slug 生成规则不稳定，会产生迁移冲突。
- 以上均为 `PROPOSED`，未执行。

### 4.4 跨系统

- 无映射表，无法量化「同一产品在三个系统中各是什么 ID」。
- 因此「ID 是否重复」在跨系统层面只能回答：**无法判定，`NOT_FOUND`**。
- 已知的结构性冲突是：Ds Bit 一 MPN 多 ID，旧站/新平台一 MPN 一 ID。若不先裁定业务键，同步必然在两种语义之间来回转换。

---

## 5. 选项与影响

> 以下选项沿用原始 Open Questions，并补充本轮证据带来的影响。选项排序不代表推荐顺序；「建议」仅为设计方分析意见。

### 选项 A：Ds Bit 建全局产品注册表，签发稳定 ID（如 ULID）

| 维度 | 内容 |
|---|---|
| 业务键 | 由注册表定义，可包含 `mpn_norm + brand + package + identity_scope` |
| 优点 | 跨文档稳定；可承载版本、审核、发布状态；与旧站/新平台解耦 |
| 风险 | Phase 1 需新增数据库与治理流程；与 Ds Bit「Phase 0 无数据库」现状冲突；注册表本身成为新的权威单点 |
| 对旧站 | 需通过 `legacy_id` 或映射表回填 |
| 对新平台 | 可作为 `pd_model` 的上游或并行权威，需明确主从 |
| 对 Ds Bit | 需要新增产品主数据子系统，超出当前解析引擎范围 |

### 选项 B：以 `mpn_norm + manufacturer + package` 组合为业务键，`product_id` 仅文档内

| 维度 | 内容 |
|---|---|
| 业务键 | 组合键；无代理注册表 |
| 优点 | 不引入注册表；与现有字段接近 |
| 风险 | 旧站**没有厂商字段**，无法提供 `manufacturer`；Ds Bit 当前 `manufacturer` 全为空；同型号不同封装/批次仍可能冲突；EVM 与芯片可能混淆 |
| 对旧站 | 需要先补厂商数据，或退化为仅 MPN |
| 对新平台 | 与 `uk_mpn_norm` 不一致，需要改唯一键或接受两套语义 |
| 对 Ds Bit | 需要真实归一化与厂商识别，当前均未实现 |

### 选项 C：以旧站 `snsii_product.id` 为主键反向映射

| 维度 | 内容 |
|---|---|
| 业务键 | 旧站自增 ID |
| 优点 | 与现网 URL、订单、缓存一致；迁移成本低 |
| 风险 | 把 Ds Bit 绑死在旧站；新平台无法复用；旧站 ID 是 8 位显示但底层 int8，未来扩容与复用规则未定义；一旦旧站重建/导库，ID 可能变化 |
| 对旧站 | 直接可用 |
| 对新平台 | 需通过 `legacy_id` 二次映射 |
| 对 Ds Bit | 产品身份变成外部系统外键，解析结果无法独立存在 |

### 选项 D（本轮补充）：以新平台 `pd_model` 为权威，MPN 全局唯一

| 维度 | 内容 |
|---|---|
| 业务键 | `mpn_norm` 全局唯一，`brand_id` 仅属性 |
| 优点 | 已有迁移设计；对外 API 以 MPN/slug 为身份；与旧站同构，迁移路径较短 |
| 风险 | 新平台尚未部署且禁止 production；`uk_mpn_norm` 全局唯一使「同 MPN 不同厂商」无法表达；`pd_model` 的 `category_id` 单值模型会限制多分类；迁移执行本身是另一项未授权工作 |
| 对旧站 | `legacy_id` 可承接 |
| 对新平台 | 自洽 |
| 对 Ds Bit | 需把文档产品映射到新平台模型，仍需映射表 |

### 选项对比

| 维度 | A 注册表 | B 组合键 | C 旧站 ID | D 新平台 MPN |
|---|---|---|---|---|
| 跨文档稳定 | 是 | 是（若键稳定） | 是 | 是 |
| 需要新数据库 | 是 | 否 | 否 | 已有设计但未部署 |
| 能表达同 MPN 不同厂商 | 可 | 可（但旧站无数据） | 否 | 否（唯一键限制） |
| 与旧站兼容 | 需映射 | 需补厂商 | 原生 | 需 `legacy_id` |
| 与新平台兼容 | 需明确主从 | 需改唯一键 | 需二次映射 | 原生 |
| 当前可立即落地 | 否 | 否（缺厂商/归一） | 仅旧站 | 否（未部署） |

---

## 6. 裁定就绪度

| 检查项 | 状态 |
|---|---|
| 是否已确认各系统现状 | 是（Ds Bit/旧站/新平台均有代码或 schema 证据） |
| 是否已量化生产重复 | 否，旧站数据库离线；Ds Bit 仅有 fixture 样本 |
| 是否已确认旧站厂商维度 | 是，产品表无厂商字段 |
| 是否已确认跨系统映射存在 | 否，`NOT_FOUND` |
| 是否可形成互斥选项 | 是，A/B/C/D |
| 是否可由执行 Agent 选择 | 否，必须由客户业务负责人 + Ds Bit 负责人书面裁定 |

**结论：** IQ-01 证据已达到「可提交裁定」的完备度，但**尚未裁定**。状态 `DECISION_REQUIRED`。

裁定至少需要明确：

1. Q1-a 业务键：仅 MPN / MPN+厂商+封装 / 代理键。
2. Q1-b ID 签发者：Ds Bit 注册表 / 旧站 ID / 新平台 `pd_model.id` / MPN+slug。
3. Q1-c `identity_scope` 取值与判定责任。
4. 是否允许在 Phase 1 前引入新数据库；若不允许，A 与 D 均不可执行。
5. 旧站缺失厂商数据时的降级规则。

---

## 7. 未决证据缺口

| 缺口 | 原因 | 影响 | 关闭方式（需另行授权） |
|---|---|---|---|
| 旧站 `PartNumber` 实际重复/空值分布 | 数据库实例不可访问 | 无法量化生产重复率 | 在只读副本上执行聚合查询 |
| 旧站 `PartUrl` 冲突数量 | 同上 | 无法评估 URL 唯一性风险 | 同上 |
| 旧站厂商/品牌实际来源 | 产品表无字段；供应商表不是厂牌 | 无法判断 B 选项可行性 | 业务访谈 + 只读数据核查 |
| Ds Bit 生产解析样本 | `runs/` 均为本地 fixture | 无法估计真实一 MPN 多文档比例 | 在授权环境运行并脱敏统计 |
| 新平台迁移是否会被批准 | 迁移明确禁止 production | 选项 D 的可行性未知 | 由平台负责人书面裁定 |

在上述缺口关闭前，任何基于「重复率」「厂商覆盖率」的定量结论都不成立。

---

## 8. 对下游的阻断

IQ-01 未裁定会阻断：

- 契约中的 `product_id` 语义与稳定性承诺。
- `dsbit_product_mapping` 主键设计。
- 同步游标与撤回语义（同一产品多文档时撤哪一个）。
- IQ-03（分类 ID 治理）与 IQ-06（发布状态存储）的落库主键。
- Phase 1 数据层设计。

**在 IQ-01 书面裁定前，契约不得冻结，Phase 1 不得开始。**