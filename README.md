# morrishk.net 老站升级 — 送审仓库

本仓库是 **morrishk.net 老站升级项目**的正式评审入口，用于替代在对话中分批粘贴文档。
仓库内容为某一确定版本的**冻结快照**，每一轮修订以新的 commit + tag 提交，不覆盖历史。

---

## 一、送审信息

| 项 | 内容 |
|---|---|
| 项目 | morrishk.net 老站升级（电子元器件 B2B 独立站） |
| 仓库 | https://github.com/esanwu-bot/morrishk-site-upgrade-review |
| Branch | `main` |
| 送审版本 | tag **`v1.2-review`**（对应 commit SHA 见该 tag 与 Releases 页面） |
| 交付日期 | 2026-11-15 |
| 文档版本 | 商务方案 客户版 v1.1 ／ 技术方案 技术版 v1.2 |
| 数据基线 | 2024-11-30 导出，静态终态（不随线上变化） |

---

## 二、目录结构

```
.
├── README.md
├── 00_project_baseline/          项目与现状基线
│   ├── project_scope.md              项目范围（逐字抽取自商务方案第一章）
│   ├── existing_system_baseline.md   现有系统技术基线（逐字抽取自技术方案第 1 章）
│   └── database_extraction_report.md 数据库结构抽取报告（含源文件 SHA-256）
├── 01_business_plan/
│   └── morrishk_growth_plan_v1.1.md  客户版商务方案 v1.1
├── 02_technical_design/
│   └── morrishk_technical_plan_v1.2.md  技术版详细方案 v1.2
├── 03_traceability/
│   ├── cross_doc_traceability_matrix.xlsx  承诺追踪矩阵（C01–C16，机器可读）
│   ├── cross_doc_traceability_matrix.md    同一张表的 Markdown 版
│   └── review_resolution_log.md            两轮评审意见响应（R01–R12 / S01–S11 / V1–V6）
├── 04_database/                  数据库结构审计（纯 DDL，无业务数据）
│   ├── 01_schema.sql
│   ├── 02_table_inventory.csv
│   ├── 03_column_inventory.csv
│   ├── 04_index_inventory.csv
│   ├── 05_other_objects.sql
│   └── 06_compatibility_scan.txt
├── 05_architecture/
│   └── system_architecture.md    总体架构（逐字抽取自技术方案第 2 章）
└── 06_evidence/
    ├── hashes/SHA256SUMS.txt     本仓库全部文件的 SHA-256
    ├── test_reports/             ❗ 未提供
    ├── benchmark/                ❗ 未提供
    └── screenshots/              ❗ 未提供
```

**抽取类文件的说明**：`00_project_baseline/` 与 `05_architecture/` 下的文件是从两份主文档中
按标题边界**逐字抽取**的章节副本，目的是让 reviewer 不必在大文件里翻找。抽取内容未做任何改写，
权威版本以 `01_business_plan/` 与 `02_technical_design/` 中的完整文档为准。

---

## 三、证据完整性声明

请 reviewer 特别注意本节——**本仓库只提交了设计文档与数据库结构，没有任何实现证据**。

| 类别 | 状态 | 说明 |
|---|---|---|
| 设计文档 | ✅ 已提供 | 商务方案 v1.1、技术方案 v1.2 |
| 数据库结构 | ✅ 已提供 | 31 张表 / 210 字段 / 100 索引的完整 DDL 与清单 |
| 承诺追踪矩阵 | ✅ 已提供 | C01–C16，含实现方式、验收指标、验收证据、责任方 |
| 评审响应记录 | ✅ 已提供 | R01–R12、S01–S11、V1–V6 |
| 文件哈希 | ✅ 已提供 | `06_evidence/hashes/SHA256SUMS.txt` |
| 测试报告 | ❌ 未提供 | 项目尚未进入开发阶段，无测试可执行 |
| 性能基准 | ❌ 未提供 | Meilisearch 基准需实例，尚未采购 |
| 截图类证据 | ❌ 未提供 | 无 staging 环境 |

因此，`03_traceability/review_resolution_log.md` 中标注为「已修订 / 已补 / 已新增」的条目，
**均为乙方的文档层面声明，尚无实现证据支撑**，在评审口径下应判定为 `NOT VERIFIABLE`。
WB 不在本仓库中替代 reviewer 下 PASS/FAIL 结论。

---

## 四、数据安全声明

本仓库为 **Public**，提交前已做敏感信息扫描，结论如下：

| 检查项 | 结果 |
|---|---|
| 完整数据库 dump | ❌ 未提交（源文件 44.5 GiB，仅提交结构） |
| 业务数据（产品、客户、询盘） | ❌ 未提交 |
| 数据库口令 / API Key / Token / 私钥 | ❌ 未发现 |
| 客户个人信息 / 供应商机密 | ❌ 未发现 |
| 内网 IP / 主机名 / 连接串 | ❌ 未发现 |
| 邮箱、手机号、身份证号 | ❌ 未发现 |
| 金额与报价数字 | ❌ 未发现（文档中「报价」均为「另行提供」的占位表述） |
| SQL 结构文件中的敏感注释 | ❌ 未发现（`01_schema.sql` 为纯 DDL，字段注释仅业务语义） |

⚠️ **需要 reviewer 知悉**：技术方案中含 **11 处人日工作量估算**（如 `25–40 人日`）。
这是乙方的工期基线，公开可见。如评审方认为不宜公开，可要求转为 Private 仓库或脱敏后重发。

---

## 五、WB 自评尚未关闭的问题

以下 6 项在技术方案 v1.2 中已被明确列为**待验证**（见 `review_resolution_log.md` 末节），
本仓库未提供其验证结果：

| # | 待验证项 | 影响 | 验证方式 | 责任方 |
|---|---|---|---|---|
| V1 | `PartNumber` 是否真有唯一索引、重复率多少 | 精确命中与去重逻辑 | `SHOW INDEX` + 重复值统计 | 乙方 |
| V2 | `PdfId` 共享度与文档类型分布 | 三层模型规模与审核工作量 | 抽样 5,000 行 + 人工标注 | 乙方 |
| V3 | Meilisearch 在 500 万 / 1,000 万文档下的内存与延迟 | 实例规格与成本 | 两档基准测试 | 乙方 |
| V4 | 新缓存表实际体积与索引体积 | 磁盘核算与切换窗口 | staging 灌 100 万行外推 | 乙方 |
| V5 | 现网询盘量与来源结构 | 转化基线、渠道 ROI | 埋点 + 历史邮件归档统计 | 甲方 |
| V6 | `IsPut` 4/6/0/1 的业务语义 | 索引策略与状态码规则 | 业务确认 + 抽样核对 | 甲方 |

此外，数据库层面还有两个**已识别但未决策**的事项：

1. **6 张空表是否迁入新库**：`snsii_cf_dns`、`snsii_news_category`、`snsii_product_cache_copy1`、
   `snsii_product_so`、`snsii_product_stock`、`snsii_track_order`——dump 时无数据，
   其中 `snsii_track_order` 是唯一无主键的表。
2. **数据层未体检**：零日期、超长字符串、非法枚举值、重复主键等只有实际导入 MySQL 8.4 才会暴露，
   本次只做了结构层审计（见 `04_database/06_compatibility_scan.txt` 第七节）。

---

## 六、希望 Reviewer 重点复核的问题

1. **承诺与实现的可验证性**：追踪矩阵 C01–C16 的「验收指标」是否真的可测量、可复现，
   有无「看起来可验收、实际无法判定」的条目。
2. **千万级商品的索引与抓取策略**（技术方案 8.4）：Tier A–F 分级的判定规则、
   Tier D 276 万页面的处理，是否存在与 canonical / noindex / sitemap 信号冲突。
3. **缓存表切换方案**（3.8）：应用层双读灰度 + `RENAME` 收敛，回滚路径是否足够。
4. **询盘归因口径**（第 5 章）：库内与 GA4 差异 ≤ 5% 的承诺，在 client_id 不可去重的前提下是否成立。
5. **数据库迁移风险**：`04_database/06_compatibility_scan.txt` 中 2 项 HIGH（utf8mb3、MyISAM）
   与 6 项 MED 的处置优先级是否合理。
6. **排期与人日的自洽性**：四阶段人日区间与依赖关系是否存在被低估的并行冲突。

---

## 七、版本与校验

```bash
# 在仓库根目录校验全部文件完整性（19 个文件）
sha256sum -c 06_evidence/hashes/SHA256SUMS.txt

# 查看本仓库全部提交
git log --oneline --decorate
```

每轮修订以独立 commit 提交，并用 tag 标记送审版本；历史版本不覆盖。
