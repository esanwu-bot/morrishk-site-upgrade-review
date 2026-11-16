# Reviewer 第二轮修订回应（v2）

- 基线提交：`dd8e71e`
- 日期：2026-11-16
- 范围：仅 `07_prototypes/admin/` 内的 HTML / CSS / JS / 原型说明 / 截图；未创建 React 工程、未实现 API、未接真实服务、未修改生产环境。
- 状态：P1 五项、P2 四项均已落实，等待 Reviewer 第二轮复核。

---

## 1. 修改文件白名单

### 1.1 文本文件（12 个，均在 `07_prototypes/admin/`）

| 文件 | 修改类型 |
|---|---|
| `index.html` | 侧栏运行状态、原型状态说明 |
| `assets/admin.js` | 深链接状态、证据抽屉、询盘 / 视频抽屉、筛选豁免 |
| `assets/data.js` | 15 字段参数模型、适用性、归因分层、SEO 治理、Commands、视频 / 询盘落地页 |
| `assets/ui.js` | 证据链渲染器、三层闸门提示 |
| `assets/views-main.js` | 商品详情三层闸门、SEO 技术治理、GEO 效果监测 |
| `assets/views-ops.js` | 数据分析 90 天、来源分层、LeadNo 桥接、询盘 / 视频归因 |
| `assets/views-knowledge.js` | Ds Bit 状态分层、参数模型、证据样例、Commands 独立表 |
| `assets/views-system.js` | 设置页“当前状态 / 目标接口”分离 |
| `assets/admin.css` | 证据抽屉紧凑键值样式（仅 token） |
| `README.md` | 路由数量、交付状态、范围 |
| `prototype-readme.md` | 32 菜单 + 2 扩展页 = 34 路由、Mock 规则、设计决策 |
| `prototype-scope.md` | 新增 11 个 Commands 独立清单 |
| `REVIEW-RESPONSE-v2.md` | 本文件（新增） |

### 1.2 截图（26 张，均在 `07_prototypes/admin/screenshots/`）

- 更新 23 张：`01`–`23`（侧栏新状态、新增页面内容、布局修正）。
- 新增 3 张：`24-seo-governance.png`、`25-analytics-90d.png`、`26-coverage.png`。

### 1.3 清单文件（1 个，自检第 6 项要求）

- `07_prototypes/SHA256SUMS.txt`：按本轮实际文件重新生成。它是校验清单，不是阶段文档；除该文件外未改动 `07_prototypes/admin/` 之外的任何文件。

### 1.4 明确未修改

- 未修改 Yii2 代码、数据库及 Migration、生产服务器 / Nginx / PHP / MySQL 配置。
- 未修改 Ds Bit / `icpdf-extractor` 核心代码，未复制其实现。
- 未创建 React 工程、未实现 API、未接真实 GA4 / Search Console / 社媒 / 队列。
- 未修改其他阶段文档。父级 `07_prototypes/README.md` 仍写“29 菜单”，因超出本轮允许范围而**未改**，在此显式披露。

---

## 2. P1 逐项修订

### P1-1 运行状态不再伪装成“运行中”

| 位置 | 修改前 | 修改后 |
|---|---|---|
| `index.html:84` | Ds Bit 引擎 运行中 | **Ds Bit · 未连接 · Demo** |
| `index.html:85` | 内容发布队列 正常 | **发布队列 · 未接入 · Demo** |
| `index.html:86` | GA4 已连接 | **GA4 · 未连接** |
| `index.html:87` | Search Console 已连接 | **Search Console · 未连接** |
| `index.html:88` | 社媒 API 已连接 | **社媒 API · 未连接** |
| `index.html:89` | 无 | “当前原型状态 · 不写库 · 不调用真实接口。目标架构见‘Ds Bit 数据资产’页。” |

设置页同样拆分为“当前状态”与“目标架构”：

- `assets/views-system.js:176` Ds Bit：`未连接 · Demo`；`:178` 当前状态；`:179-180` 目标接口 / 目标认证；`:182` 明确“当前原型未建立任何连接”。
- `assets/views-system.js:190` 社媒：`未连接 · Demo`；`:191` 说明未连接任何平台 API、不保存 Token。
- `assets/views-system.js:193` 任务队列：`未接入 · Demo`。

### P1-2 Ds Bit 数据模型与证据链（不复制核心代码）

- 15 字段模型：`assets/views-knowledge.js:133`（DocumentId、ParseRunId、DocumentVersion、DocumentType、DocumentSubject、RawLabel、RawValue、NormalizedValue、ValueKind、Conditions、PageNo、TableId、RowId、CellBBox、ReviewStatus）。
- 产品 ↔ Datasheet 适用关系：`assets/views-knowledge.js:135`；`assets/data.js:78` 的 DS-1033 为 `Family match`，注明“系列文档，仅作选型背景；不绑定参数证据”。
- 文档元数据：`assets/data.js:68-78` 含 `run / type / subject / applicability / hash / version`。
- 参数证据字段：`assets/data.js:82` 起 18 条参数记录含 `rawLabel / rawValue / kind / conditions / table / row / bbox / applicability`。
- 证据渲染：`assets/ui.js:290-316` 输出来源文件、SHA-256、文档版本、MPN、类型 / 主体、原始参数、标准化参数、页 / 表 / 行 / CellBBox、适用性判定、ReviewStatus。
- 参数抽屉：`assets/admin.js:438-458`；`assets/admin.js:451` 单独“适用性判定”，`:458` 明示“CellBBox 或置信度单独存在不能证明参数适用于该产品”。
- 文档抽屉：`assets/admin.js:405-426`，含 DocumentId、ParseRunId、DocumentVersion、DocumentType、DocumentSubject、MPN 与适用性。
- 系统边界：`assets/views-knowledge.js:153` 明确 Ds Bit 与后台是两个系统、不含解析器实现；`assets/views-system.js:182` 明确只读对接、不复制核心。

### P1-3 三层质量状态独立

| 闸门 | 商品详情 | Ds Bit / 参数审核 |
|---|---|---|
| PIPELINE_PASS | `assets/views-main.js:260` | `assets/views-knowledge.js:52`、`:126`、`:234` |
| CONTENT_APPROVED | `assets/views-main.js:261` | `assets/views-knowledge.js:53`、`:139` |
| RELEASE_APPROVED | `assets/views-main.js:263` | `assets/views-knowledge.js:54`、`:141` |

- `assets/views-main.js:267`：三层相互独立，不得合并为 Verified。
- `assets/views-knowledge.js:234`：本页只处理参数级 ReviewStatus。
- `assets/views-knowledge.js:254`：参数“通过”仅是 CONTENT_APPROVED 的前置条件，写入生产仍需 RELEASE_APPROVED。
- `assets/views-knowledge.js:153`：三段式边界再次声明。
- `assets/ui.js:316`：ReviewStatus 不等于三层闸门。

### P1-4 SEO 技术治理

`assets/views-main.js:486` 新增“技术治理”Tab，主体在 `:402-444`：

- URL / Canonical / Index：`:402`、`:419`（5 条抽样，含 Noindex 搜索页）。
- 多语言 hreflang：`:420` 区域，仅 en / de / ja / es / fr，默认 en。
- Sitemap 分片状态：`:423` 区域，6 个分片，失败分片单独重试。
- 内容质量与抓取异常：`:426` 区域，覆盖重复内容、结构化数据、低质量页、404 / 软 404、重定向链。
- 发布与回滚：`:433` 区域；数据 `assets/data.js:413-419`：单批 ≤5,000 URL、首批 1% 抽样、发布前快照按批次回滚、SEO + 商城运营双人确认。
- `assets/data.js:418`：明确“不提供‘一键全量发布千万页面’”。
- `assets/views-main.js:444`：SEO 技术治理与内容审核分离，Meta 通过不代表允许全量索引。
- `assets/views-main.js:477`：页头说明 URL 规则变更必须分批灰度并可回滚。

### P1-5 GA4 / 询盘归因与 GEO 口径

- 数据来源分层：`assets/views-ops.js:264`；`assets/data.js:363` 的 `sourceLayers` 区分平台原生、GA4 网站行为、后台业务数据。
- LeadNo 桥接漏斗：`assets/views-ops.js:271`（1,860 前端事件 → 1,724 去重提交 → 714 后台有效询盘）。
- 归因明细：`assets/views-ops.js:321-329`，列为 LeadNo / GA4 Session / UTM + 落地页 / 渠道 / 有效判定。
- `generate_lead` 边界：`assets/views-ops.js:312` 与 `assets/admin.js:362` 均说明前端事件不等于有效询盘。
- 询盘列表：`assets/views-ops.js:372` 增加“GA4 Session / 落地页”；`:374` 明确 Session 仅用于归因。
- 90 天趋势：`assets/views-ops.js:241` 确定性合成函数；`:257` 标注“90 天为合成 Demo 数据，不是真实历史回填”，不与 30 天数据复用。
- GEO 三项分开：`assets/views-main.js:538`，AI Referral 会话 / GEO 内容覆盖 / AI 引用抽样分别展示；`:510` 说明不并入自然流量。
- 数据：`assets/data.js:363` 的 `geo` 与 `leadBridge`。

---

## 3. P2 逐项修订

1. **菜单 / 路由数量统一**：`README.md:15,24`、`prototype-readme.md:47,173` 均统一为“32 个菜单 + 个人账号 + 覆盖矩阵 = 34 个路由”。父级 README 不在允许范围，已在上文披露。
2. **旧后台 11 个 Commands**：`assets/views-knowledge.js:436` 独立卡片，11 行；`prototype-scope.md:103` 独立清单。筛选计数只统计 43 个 action（`assets/admin.js:226-228` 豁免 Commands 表），Commands 不参与覆盖状态筛选，也不计入 43。
3. **视频中心转化链**：`assets/views-ops.js:190-191` 列表增加“视频 / 关联商品”“落地页 / UTM”“点击 → 询盘”；`assets/admin.js:554-575` 抽屉增加落地页、UTM 与 5 步转化链（播放 → 点击 → 落地页 → UTM 归因 → 后台 LeadNo）。
4. **18 个部分覆盖动作保留“待业务确认”**：`assets/data.js:436-480` 仍为 25 已覆盖 / 18 部分覆盖 / 0 未覆盖；未将任何部分覆盖改为已覆盖；`prototype-scope.md:101` 汇总一致。

---

## 4. 修改前后差异摘要

| 维度 | 修改前 | 修改后 |
|---|---|---|
| 侧栏状态 | 3 处写成“运行中 / 正常” | 5 项统一为未连接 / 未接入 + Demo |
| 参数证据 | 字段不完整，BBox 易被误读为适用性 | 15 字段 + 来源文件 + SHA-256 + 适用性判定 + 边界提示 |
| 质量状态 | 容易收敛为单一 Verified | 三层闸门在商品详情、Ds Bit、参数审核三处独立展示 |
| SEO | 仅关键词 / Meta | 新增技术治理 Tab：URL / Canonical / hreflang / sitemap / 质量 / 灰度回滚 |
| 分析 | 单一渠道趋势 | 三层数据来源 + LeadNo 桥接 + 归因明细 + GEO 三项 + 90 天合成标注 |
| 视频 | 仅播放数据 | 关联商品 + 落地页 / UTM + 询盘转化链 |
| 迁移核对 | 43 action 与命令混排风险 | Commands 独立 11 行，筛选与计数互不干扰 |
| 文件量 | — | 已跟踪修改 35 个，新增截图 3 个，共 38 个文件变更（均在白名单内） |

---

## 5. 自检结果

### 5.1 JS 语法

`node --check` 全部通过（7/7）：

`admin.js`、`data.js`、`ui.js`、`views-main.js`、`views-ops.js`、`views-knowledge.js`、`views-system.js`。

### 5.2 路由渲染（34/34）

逐页设置 hash 后读取 `<h1>` 与正文，全部命中预期标题，未出现 `undefined`、`[object Object]`、`NaN`：

工作台 4、商城运营 8、营销运营 9、产品知识 7（含覆盖矩阵）、系统管理 5、个人账号 1；合计 34。

### 5.3 交互检查

| 检查 | 结果 |
|---|---|
| 参数证据抽屉 | 15 字段、来源文件、SHA-256、适用性、三层闸门提示均存在 |
| 商品详情发布闸门 | PIPELINE_PASS / CONTENT_APPROVED / RELEASE_APPROVED 三行齐全 |
| SEO 技术治理 | Tab 可切换；URL 表、hreflang、sitemap、质量、回滚均渲染 |
| 数据分析 90 天 | 切换后显示“90 天为合成 Demo 数据” |
| 询盘抽屉 | LeadNo、GA4 Session、UTM、落地页、有效判定齐全 |
| 视频抽屉 | 关联商品、落地页 / UTM、5 步转化链齐全 |
| GEO 页 | AI Referral、内容覆盖、引用抽样分列 |
| 覆盖矩阵 | 计数 43；筛选“部分覆盖”显示 18；Commands 11 行保持可见 |
| 设置页 | 集成状态显示未连接 / 未接入，目标接口单独标注 |
| 侧栏 | 5 项运行状态均为未连接 / 未接入 |

### 5.4 SHA256 清单与文件数

- 清单位置：`07_prototypes/SHA256SUMS.txt`（路径相对 `07_prototypes`）。
- 清单条目：76 条（含本回应文件；不含清单自身）。
- 校验命令：`cd 07_prototypes && sha256sum -c SHA256SUMS.txt`。
- 结果：76/76 `OK`，无 `FAILED`。

### 5.5 截图覆盖

| 页面 | 截图 |
|---|---|
| Ds Bit 数据资产 | `11-dsbit.png` |
| SEO 技术治理 | `24-seo-governance.png` |
| 数据分析（含 90 天） | `20-analytics.png`、`25-analytics-90d.png` |
| 商品详情（三层闸门） | `03-product-detail.png` |
| 视频中心 | `10-video.png` |
| 覆盖矩阵（43 + 11 Commands） | `26-coverage.png` |
| 参数审核证据 | `13-param-review.png` |
| 设置集成状态 | `19-settings.png` |
| 询盘归因 | `21-inquiries.png` |
| GEO 效果监测 | `06-geo.png` |

### 5.6 并发修改

本轮修改期间未发生其他文件的并发改动。`git status` 仅显示上述 `07_prototypes/admin/` 文件与 `07_prototypes/SHA256SUMS.txt`；没有触碰 Yii2、数据库、生产配置、Ds Bit、React 或 API 目录。

---

## 6. 停止点

修订已完成，停止于此。等待 Reviewer 第二轮复核；未进入 React 工程、API、数据库或生产接入阶段。
