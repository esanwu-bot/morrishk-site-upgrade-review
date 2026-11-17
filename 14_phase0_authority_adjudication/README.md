# Phase 0 权威归属裁定证据包

| 项 | 值 |
|---|---|
| 文档编号 | MRH-DSBIT-PHASE0-EVIDENCE-001 |
| 版本 | v1.0（证据包，非裁定书） |
| 日期 | 2026-11-17 |
| 调查对象 | Ds Bit 仓库 `E:\workspace\icpdf-extractor`；Morrishk 旧站源码与 schema 审计；Morrishk 新平台 `E:\workspace\独立站\morries\platform` |
| 关联文档 | `12_dsbit_business_api_integration_design/Ds Bit ↔ Morrishk Business API Integration Design v1.md`（v1.2.2）；`12_dsbit_business_api_integration_design/INTEGRATION_OPEN_QUESTIONS.md`（v1.2.2） |
| 性质 | 只读调查、证据索引、选项与待裁定问题；**不含任何已批准决策** |
| Open Questions 状态 | IQ-01..IQ-22 全部保持 `OPEN`，本包不修改原始台账 |

---

## 1. 本轮范围

本轮只做 Phase 0 决策证据准备：

1. 重新核实 Ds Bit 仓库的权威分支候选、提交与证据基线。
2. 调查 IQ-01「产品身份权威与 ID 空间」。
3. 调查 IQ-02「技术分类体系归属、初始种子、是否多体系」。
4. 对 IQ-01..IQ-22 建立统一矩阵，标出证据状态、决策就绪度与阻断关系。
5. 生成可供决策人签署的决策登记空表与完整证据索引。

**本轮明确不做：**

- 不修改 Ds Bit 或 Morrishk 的业务代码。
- 不修改 `12_`、`13_` 设计文档。
- 不创建或修改任何数据库表、字段、索引、数据。
- 不执行迁移、回填、修复。
- 不生成或配置真实 OAuth2 凭证。
- 不实现 Business API、PHP Client 或 Yii2 Provider。
- 不调用真实生产 API，不部署、不重启服务、不做生产同步。
- 不清理、不 stash、不 reset、不 checkout、不覆盖任何工作树现场。
- 不替决策人做业务归属、系统权威或数据治理决定。

---

## 2. 基线

### 2.1 Review 仓库

| 项 | 值 |
|---|---|
| 本地 HEAD | `e9a56ca9b42db114b57a0fab62bcb258d7718ee4` |
| 父提交 | `473497d` |
| 远程 `origin/main` | 与本地 HEAD 一致（0/0） |
| 并发情况 | 调查期间另有提交 `473497d`、`e9a56ca` 进入 `13_dsbit_duckdb_s3_pipeline/`；未涉及 `12_`，本包未修改 `13_` |
| 工作树 | 仅有未跟踪 `10_scope_confirmation/Morrishk_功能范围确认书_V1.0.docx`；本包未触碰 |

### 2.2 Ds Bit 仓库

| 项 | 值 |
|---|---|
| 当前检出分支 | `backup/full-local-20261114` |
| 当前 HEAD | `600439a5eee69fb3a1cec2715e37080e48ca9840`（2026-11-13） |
| `origin/feat/gate6a-audit` | `600439a5...`（与当前 HEAD 相同） |
| 本地 `main` | `a11131a80474f3d5bea5ab6fb5204e77b8839eed`（2026-11-11），是当前 HEAD 的祖先，落后 15 个提交 |
| `origin/main` | `853a80dd664c79ef90baaac53eefb9bbc2155dde`（2026-11-05，初始提交） |
| 工作树 | 20 项未提交状态（14 项已暂存新增、1 项已暂存修改 `.gitignore`、2 项已修改未暂存、3 项未跟踪目录/文件），已保留现场，未做任何清理 |

**权威分支未裁定。** 本包所有 Ds Bit 代码引用均以「当前检出工作树 + HEAD 600439a」为证据基线，并在证据索引中记录文件 SHA-256。若决策人最终选择其他分支，相关事实需重新核验。

### 2.3 Morrishk 证据来源

- 旧站 schema 审计：`E:\workspace\独立站\morries\mysql_schema_audit\`（由 47.8GB SQL dump 静态解析生成）。
- 旧站 Yii2 源码：`E:\workspace\独立站\morries\newPlan\morrishk.net\`。
- 新平台：`E:\workspace\独立站\morries\platform\`，迁移头部明确标注仅 local/dev/staging、禁止 production；本轮未执行任何迁移。
- 旧站数据库实例：本轮尝试只读连接失败（`127.0.0.1:3306` 超时，此前 PDO 返回连接拒绝）。**数据级统计一律标记 `NOT_FOUND`，不代表数据不存在。**

---

## 3. 调查结论摘要

1. **Ds Bit 没有跨文档的全局产品主数据，也没有技术分类体系。**
   `product_id` 由 `document_id` 派生（`prod-<document_id>`），`document_id` 由 PDF 内容 SHA-256 前 12 位派生。一次解析产生一个文档内产品身份，运行目录不可变，但没有产品注册表。

2. **Morrishk 旧站的产品业务键是全局 MPN。**
   `snsii_product.PartNumber` 有全局 `UNIQUE`，`PartUrl` 仅有非唯一索引；表内**没有厂商/品牌字段**。`Mid` 是商家 ID，`/manufacturer/...` 路由实际查询的是 `snsii_supplier`，不是产品厂牌。

3. **Morrishk 新平台是候选权威，但尚未部署。**
   `pd_model` 以 `mpn_norm` 与 `mpn_slug` 全局唯一，另有 `brand_id`、`category_id`、唯一 `legacy_id`；`pd_category` 是两级分类，`slug`/`path` 唯一。迁移明令禁止 production，本轮未执行。

4. **旧站分类与新平台分类都是业务导航分类，不是技术分类。**
   旧站 `snsii_product_category` 通过 `Pid` 组成两级树，`Links` 唯一并直接进入 URL；新平台 `pd_category` 同样两级。二者都没有参数维度、没有技术属性定义，不能直接充当「Technical Taxonomy」。

5. **技术分类的初始种子不存在权威来源。**
   Ds Bit 无任何分类模型或种子；新平台只有 `db/seeds/seed_dev.php` 的开发 fixture（2 个根、2 个叶），代码注释限定 local/dev。未发现可被视为客户批准种子的文件。

6. **IQ-01 / IQ-02 已达到「可提交裁定」的证据完备度，但均未裁定。**
   两题都能形成清晰选项、影响与风险，但权威归属属于客户业务负责人（及 Ds Bit 负责人）的书面权限，执行 Agent 不作决定。

7. **契约冻结与实现均不成立。**
   Phase 0 阻断项 IQ-01、IQ-02、IQ-05、IQ-09、IQ-13、IQ-15、IQ-21 仍全部 `OPEN`；契约冻结 = **NO**，实现 = **NO**。

---

## 4. 文件清单

| 文件 | 内容 |
|---|---|
| `README.md` | 范围、基线、限制、结论摘要 |
| `DSBIT_AUTHORITY_BASELINE.md` | Ds Bit 分支/提交/工作树/实现事实与权威评估 |
| `IQ01_PRODUCT_IDENTITY_ADJUDICATION.md` | 产品身份与 ID 空间证据、重复分析、选项 |
| `IQ02_TAXONOMY_AUTHORITY_ADJUDICATION.md` | 技术分类归属、种子、体系数量证据与选项 |
| `PHASE0_OPEN_QUESTIONS_MATRIX.md` | IQ-01..IQ-22 矩阵、阻断关系、建议处理顺序 |
| `EVIDENCE_INDEX.md` | 逐条证据：路径、行号、SHA-256、级别、有效性 |
| `DECISION_REGISTER.md` | 决策登记空表与签署规则 |
| `SHA256SUMS.txt` | 本目录除自身外全部文件的 SHA-256 |

---

## 5. 证据分级口径

| 标签 | 含义 |
|---|---|
| `CONFIRMED` | 已在仓库/源码/schema/本地文件中以路径+行号或结构约束直接核对 |
| `PARTIALLY_CONFIRMED` | 部分事实可核实，但受访问范围、样本或环境限制 |
| `CONFLICTING` | 两个可核实来源给出不一致结论 |
| `NOT_FOUND` | 在声明的检索范围内未发现；附检索范围，不推断全局不存在 |
| `PROPOSED` | 仅存在于设计/迁移/种子等未生效载体，不能当作已实现 |
| `DECISION_REQUIRED` | 证据已足以形成选项，但归属/取舍必须由决策人书面裁定 |

---

## 6. 本包不构成

- 不构成对任何分支、产品权威、分类权威、ID 规则或目标系统的批准。
- 不构成契约冻结记录。
- 不构成 Phase 1 或 Phase 2 的开工授权。
- 不构成对 `12_` Open Questions 状态的修改；原始文档中 IQ-01..IQ-22 仍为 `OPEN`。
- 文中「建议」一律是设计方分析意见，不是需求，也不是已批准决策。