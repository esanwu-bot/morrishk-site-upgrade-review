# DELIVERY REPORT · Phase 0 裁定落地 + Phase 1 Mock UI

| 项 | 值 |
|---|---|
| 交付编号 | MRH-PHASE1-MOCK-001 / MRH-DSBIT-INT-001 v1.3 |
| 日期 | 2026-11-17 |
| 决策基线 | `esanwu-bot/morrishk-site-upgrade-review` `main@77137655ed24e3b370eb4fe5c75b68dd708fa9ec` |
| 本交付父提交 | `edd2f99`（Session A 的 `13_` 回填提交，仅改 `13_`）；首版提交 `fb0189b` 的父提交为 `8c45f63`；未改写任何历史 |
| 本轮批准 | IQ-01 / IQ-02 / IQ-13 裁定；Phase 1 UI 与 Mock 联调；**未**批准契约冻结与任何生产接入 |
| 修订 | v1.1 按 Reviewer B1（候选冲突漏判）、B2（搜索非法输入）、B3（基线/问题编号）修订；`13_` 未修改 |
| Reviewer 验收 | **PENDING**（本报告不构成自验收；Reviewer 未独立复跑 42/42 与 9 项冒烟） |

---

## 1. 修改文件清单

### 1.1 已跟踪文件（相对 `8c45f63` 的工作树改动）

```text
12_dsbit_business_api_integration_design/API_CONTRACT_EXAMPLES.md                       | 185 +++++---
12_dsbit_business_api_integration_design/Ds Bit ↔ ... Design v1.md                     | 406 +++++++++-----
12_dsbit_business_api_integration_design/INTEGRATION_OPEN_QUESTIONS.md                  |  78 ++--
12_dsbit_business_api_integration_design/README.md                                      |  42 +-
12_dsbit_business_api_integration_design/SHA256SUMS.txt                                |   8 +-
14_phase0_authority_adjudication/DECISION_REGISTER.md                                   |  75 +++-
14_phase0_authority_adjudication/IQ01_PRODUCT_IDENTITY_ADJUDICATION.md                  |  39 +-
14_phase0_authority_adjudication/IQ02_TAXONOMY_AUTHORITY_ADJUDICATION.md                |  46 ++-
14_phase0_authority_adjudication/PHASE0_OPEN_QUESTIONS_MATRIX.md                        |  48 ++-
14_phase0_authority_adjudication/README.md                                              |  36 +-
14_phase0_authority_adjudication/SHA256SUMS.txt                                         |  10 +-
```

`git diff --stat 8c45f63` 合计：11 个文件，727 insertions(+)，245 deletions(-)。

### 1.2 新增目录（未跟踪 → 本次提交）

`15_phase1_mock_ui/` 共 14 个文件（含 `SHA256SUMS.txt`）：

| 文件 | 行数 | 说明 |
|---|---:|---|
| `index.html` | 251 | 8 视图单页（脚本缓存版本 `?v=2/3`） |
| `assets/mpn-normalizer.js` | 252 | `MPN-NORM-v1` + 纯 JS SHA-256 |
| `assets/mock-api.js` | 470 | Mock API 与同步模拟 |
| `assets/app.js` | 554 | 视图控制器 |
| `assets/styles.css` | 263 | 样式 |
| `data/mock-products.json` | 439 | 8 条演示产品 |
| `data/mock-dictionary.json` | 50 | 3 条演示参数 |
| `data/mock-taxonomies.json` | 154 | 两套分类 + 映射 |
| `tests/mpn-normalizer.test.js` | 210 | 22 项测试（含 B1 边界） |
| `tests/mock-api.test.js` | 267 | 20 项测试（含 B2 非法输入） |
| `README.md` | — | 运行、演示、规则与边界 |
| `TEST_REPORT.md` | — | 实际测试结果 |
| `DELIVERY_REPORT.md` | — | 本报告 |
| `SHA256SUMS.txt` | — | 文件校验清单 |

逐文件 SHA-256 见 `15_phase1_mock_ui/SHA256SUMS.txt`；未跟踪文件相对基线的 Diff 即“整文件新增”，无需逐 hunk 展开。

---

## 2. 逐文件变更说明（12_）

| 文件 | 变更 |
|---|---|
| 主设计文档 | 版本 v1.3；产品身份改为 `MPN + Brand`、唯一键 `(mpn_norm, brand_norm)`；新增 `MpnNormalizer` 规则表与 `product_business_key` 定界公式；`prod-{document_id}` 降级为文档处理凭证；全部路由改用 `{product_business_key}`；搜索强制 `brand`；新增 §6.2.2 文档/产品边界；§6.8 新平台映射与三项 schema 改造；§7.1.1 分类硬隔离、§7.1.2 字典字段与 Fixture 规则；§7.8.1 `morrishk_target` 仅 `PLATFORM_PD`；§9.4.2 映射表主键改业务键、`platform_model_id` 标注内部；§12.2 新增 PR-15~PR-20；附录 A.3 状态与术语同步 |
| `API_CONTRACT_EXAMPLES.md` | 全部示例改用 `product_business_key`；删除 `product_id` / `prd_` 作为身份；EX-07b/07c、EX-11~EX-17、EX-19 同步；EX-21 目标改 `PLATFORM_PD` 并注明内部 ID；EX-22 游标改为业务键；新增 EX-23a（缺 Brand）/ EX-23b（归一化冲突） |
| `INTEGRATION_OPEN_QUESTIONS.md` | v1.3；IQ-01/02/13 标记 `DECIDED` 并附裁定记录；其余 19 项保持 `OPEN`；底部汇总表同步 |
| `README.md` | v1.3；示例数量与开放项数量更新；新增 §7 Phase 1 Mock 范围、Fixture 边界与禁止事项 |
| `SHA256SUMS.txt` | 按最终内容重新生成并校验通过 |

---

## 3. 逐文件变更说明（14_）

| 文件 | 变更 |
|---|---|
| `DECISION_REGISTER.md` | 登记 IQ-01「其他（E）MPN+Brand」、IQ-02「A 的修订版」、IQ-13「B（修订）新平台」；3/7 decided；契约冻结 `NO`；签署状态待签 |
| `IQ01_PRODUCT_IDENTITY_ADJUDICATION.md` | 裁定正文、唯一键、归一化器责任、冲突处理、文档/产品边界 |
| `IQ02_TAXONOMY_AUTHORITY_ADJUDICATION.md` | 两套分类硬隔离、PM 种子责任、候选字段、Fixture 隔离 |
| `PHASE0_OPEN_QUESTIONS_MATRIX.md` | 三项状态更新，剩余 OPEN 保留 |
| `README.md` | 版本、状态、文件说明同步 |
| `SHA256SUMS.txt` | 重新生成并校验通过（7/7 OK） |

---

## 4. 13_ 处理声明（只读）

按 Session B 明确指令「不修改 Session A 的 13_ 文件」，本轮**未修改** `13_dsbit_duckdb_s3_pipeline/` 任何文件。

只读一致性检查（父提交 `edd2f99`；`OPEN_DECISIONS.md` 行号在该提交下核对）：

- `DS_BIT_DUCKDB_S3_PIPELINE_DESIGN_v1.md:286` 描述 `product_id = prod-<document_id>` **只在单文档内成立**；`:287` 明确「不存在跨文档产品主键」；
- `OPEN_DECISIONS.md:134` **OD-11「产品级 ID 与跨文档归并」** 仍将跨文档产品身份列为 `OPEN`（`:138` 为问题陈述）。

结论：`13_` 描述的是 Ds Bit **解析流水线内部**对象，未把 `prod-{document_id}` 定义为 Morrishk 跨系统产品身份，故与 IQ-01 不冲突。但 `13_` 尚未写入 IQ-01 的跨系统身份结论（`MPN + Brand`）。

**范围澄清**：IQ-01 只解决**跨系统业务身份**（Morrishk ↔ Ds Bit 之间用什么键对齐产品）；OD-11 讨论的是 **Ds Bit 内部**的产品族/多版本/多文档归并与主键设计。两者不是同一问题，OD-11 不因 IQ-01 自动关闭，仍需 Ds Bit 侧独立决策。

**待决策人确认**：是否需要在 `13_` 增加一行指向 IQ-01 的交叉引用（流水线内部跨文档键仍可独立 OPEN）。该动作会修改 Session A 文件，未获 Session A / 决策人授权前不执行。

---

## 5. 测试与验证

### 5.1 实际运行

```bash
cd 15_phase1_mock_ui
node --test tests/mpn-normalizer.test.js tests/mock-api.test.js
```

结果：`tests 42 / pass 42 / fail 0`，耗时 618.2903ms（Node v24.21.0）。

浏览器冒烟（`python -m http.server 8777` + browser-use，修订后重新执行）：9 项全部通过，覆盖产品详情、
归一化边界、冲突聚合（含 `brand_norms`）、待确认队列、字典内存编辑、两套分类、Mock API 非法输入与正常搜索、同步重试序列。

> B1/B2/B3 为 Reviewer 提出、由执行 Agent 修复并自测；Reviewer 未独立复跑上述数字。

详细断言与逐步观察见 `15_phase1_mock_ui/TEST_REPORT.md`。

### 5.2 静态检查

- 6 个示例业务键与实现输出逐一比对一致；
- Fixture 标记齐全（`dataset` / `source` / `meta.fixture`）；
- 页面无控制台错误；无外部网络依赖（仅本地 `fetch` JSON）。

### 5.3 未执行

生产 API 调用、OAuth2 凭证、数据库连接/迁移/写入、真实同步、真实发布/撤回、
生产分类树初始化、DuckDB + S3 流水线。

---

## 6. Mock 演示步骤

见 `15_phase1_mock_ui/README.md` §4（10 步）。最短路径：

1. `python -m http.server 8777 --bind 127.0.0.1`；
2. 打开 `http://127.0.0.1:8777/index.html`；
3. 点击 `LM358DR / Example Semiconductor` 与 `LM358DR / Texas Instruments` 对比业务键；
4. 进入「MPN 归一化」点「载入边界样例」观察 `LM–358DR → LM-358DR`；
5. 进入「Mock API」依次选择 200 已发布、422 缺少 Brand、422 冲突、401；
6. 进入「同步与重试」，保持默认 `failAtPage=2`，观察 `OK → ERROR → ERROR → OK → DONE`。

---

## 7. 未解决问题

| # | 问题 | 状态 | 说明 |
|---|---|---|---|
| 1 | Business API 契约冻结 | 未批准 | 本轮仅落地业务裁定 |
| 2 | `MpnNormalizer` 规则是否最终批准 | PROPOSED | 规则已版本化并测试，仍待 Reviewer/决策人确认 |
| 3 | `13_` 是否补 IQ-01 交叉引用 | 待决定 | 需 Session A / 决策人授权；OD-11（Ds Bit 内部归并）不属 IQ-01 范围，仍独立 OPEN |
| 4 | 技术参数字典正式种子 | 待 PM | 现仅有 `DEMO_FIXTURE` |
| 5 | `pd_model` 生成列改造与唯一键 | OPEN | 设计已提出，未实施 |
| 6 | 其他 19 项 IQ | OPEN | 见 `12_/INTEGRATION_OPEN_QUESTIONS.md` |
| 7 | 分页游标最终形态 | OPEN | Mock 使用 `demo_<offset>`，非契约承诺 |
| 8 | 浏览器兼容/无障碍专项 | 未做 | 仅 Chromium 窄视口冒烟 |

---

## 8. 禁止事项执行确认

| 禁止项 | 是否发生 | 证据 |
|---|---|---|
| 生产 Business API 实现或调用 | 否 | 无网络请求；Mock 全在内存 |
| 生产 OAuth2 凭证申请/存储/使用 | 否 | 请求示例中 Token 为 `<REDACTED_DEMO_TOKEN>` |
| 生产数据库迁移或写入 | 否 | 未连接任何数据库 |
| 生产数据批量同步 | 否 | 仅本地模拟事件 |
| 真实产品发布或撤回 | 否 | 仅 Fixture 状态字段 |
| 真实生产分类树初始化 | 否 | 仅 JSON Fixture |
| 擅自选择未确认的字典定义 | 否 | 3 条均标 `DEMO_FIXTURE` / `DRAFT`，未声称为正式定义 |
| 擅自修改 Ds Bit Parser 核心逻辑 | 否 | 未触碰 `icpdf-extractor` |
| 改变 12_/13_ 其他未裁定决策 | 否 | 12_ 仅落地三项裁定；13_ 未修改 |
| 扩大授权范围（契约冻结、Stage A、批量试跑） | 否 | 均未执行 |

---

## 9. Reviewer 独立验收说明

本交付为 `PENDING`，请独立复核，不以本报告结论替代验证：

1. 校验 `14_` 三项裁定记录与签署状态；
2. 通读 `12_` 主文档 §5.3、§6.2、§6.8、§7.1、§7.8.1、§9.4.2、§12.2；
3. 确认 `API_CONTRACT_EXAMPLES.md` 中不存在把 `document_id` / `prod-` 当产品身份的示例；
4. 运行 `node --test`，核对 42/42；
5. 启动静态服务器，按 §6 步骤抽查 6 个交互；
6. 校验三份 `SHA256SUMS.txt`；
7. 判断 `13_` 交叉引用是否需要在获得授权后补充。

验收结论请单独记录，不要回写本报告。
