# Reviewer 第二轮修订回应（v2，含第三轮收尾）

- 基线提交：`dd8e71e`
- 第二轮提交：`045e3d9`
- 日期：2026-11-16
- 范围：仅 `07_prototypes/admin/` 内的 HTML / CSS / JS / 原型说明 / 截图，另按自检要求更新 `07_prototypes/SHA256SUMS.txt`。
- 状态：第二轮 P1/P2 已落实；第三轮闸门依赖与 Ds Bit 已复核通过；第四轮仅处理内容资产库的发布权限边界，等待最后一次定向复核。
- 边界：未创建 React 工程、未实现 API、未接真实服务、未修改生产环境，也不代表后台重构获批。

---

## 1. 修改文件白名单

### 1.1 文本文件（13 个，均在 `07_prototypes/admin/`）

| 文件 | 修改类型 |
|---|---|
| `index.html` | 侧栏运行状态、原型状态说明 |
| `assets/admin.js` | 深链接状态、证据抽屉、询盘 / 视频抽屉、筛选豁免、内容审核动作、内容发布资格判断 |
| `assets/data.js` | 15 字段参数模型、历史验证快照、内容来源 / 发布授权、适用性、归因分层、SEO 治理、Commands |
| `assets/ui.js` | 证据链渲染器、Confidence、SHA-256 前缀标注、三层闸门提示 |
| `assets/views-main.js` | 商品详情三层闸门依赖、内容发布资格列、SEO 技术治理、GEO 效果监测 |
| `assets/views-ops.js` | 数据分析 90 天、来源分层、LeadNo 桥接、询盘 / 视频归因 |
| `assets/views-knowledge.js` | Ds Bit 状态分层、8 阶段流水线、参数模型、证据样例、Commands 独立表 |
| `assets/views-system.js` | 设置页“当前状态 / 目标接口”分离 |
| `assets/admin.css` | 证据抽屉紧凑键值样式、8 阶段流水线网格（仅 token） |
| `README.md` | 路由数量、交付状态、范围 |
| `prototype-readme.md` | 32 菜单 + 2 扩展页 = 34 路由、闸门依赖、Mock 规则 |
| `prototype-scope.md` | 11 个 Commands 独立清单 |
| `REVIEW-RESPONSE-v2.md` | 本文件 |

### 1.2 截图（27 张，均在 `07_prototypes/admin/screenshots/`）

- 更新 23 张：`01`–`23`（第二轮）；第三轮再次更新 `03-product-detail.png`、`11-dsbit.png`、`13-param-review.png`；第四轮更新 `07-content.png`。
- 新增 4 张：`24-seo-governance.png`、`25-analytics-90d.png`、`26-coverage.png`、`27-content-publish-guard.png`。

### 1.3 清单文件（1 个，自检要求）

- `07_prototypes/SHA256SUMS.txt`：按当前实际文件重新生成。它是校验清单，不是阶段文档；除该文件外未改动 `07_prototypes/admin/` 之外的任何文件。

### 1.4 明确未修改

- 未修改 Yii2 代码、数据库及 Migration、生产服务器 / Nginx / PHP / MySQL 配置。
- 未修改 Ds Bit / `icpdf-extractor` 核心代码，未复制其实现。
- 未创建 React 工程、未实现 API、未接真实 GA4 / Search Console / 社媒 / 队列。
- 未修改其他阶段文档。父级 `07_prototypes/README.md` 仍写“29 菜单”，因超出本轮允许范围而**未改**，在此显式披露。

---

## 2. 第三轮针对性收尾

### 2.1 P1-3 闸门状态依赖（本轮重点）

**问题**：商品详情把 PIPELINE_PASS 固定为“未运行”，却按 `content === 'Published'` 直接显示 CONTENT_APPROVED / RELEASE_APPROVED，导致“流水线未运行 + 发布已授权”并存。

**修正**：

- `assets/data.js:35-50`：为已发布商品生成**历史验证快照** `verifySnapshot`（快照号、ParseRunId、内容版本、批次）；草稿商品无快照。
- `assets/views-main.js:252-274`：闸门改为依赖计算：
  - `pipeOk = snapshot.pipeline === 'PASS'`
  - `contentOk = pipeOk && snapshot.contentApproved`
  - `releaseOk = contentOk && snapshot.releaseApproved`
- 已发布商品显示“历史快照 VS-… · 已通过”“内容版本 v2 已通过”“批次 B-… 已授权”，并注明“当前 Demo 会话不重新运行解析”。
- 草稿商品显示“未运行 · 无验证快照”“上游未通过 · 不可审核”“上游未通过 · 不可申请”，不再出现下游已批准。
- `assets/admin.js:1025-1044`：“提交发布”改为“提交内容审核”。无快照时只进入审核队列，不修改 `content` 为 Published；有快照时提示新版本需重新走流水线与内容审核。
- `assets/views-main.js:286`：按钮文案同步为“提交内容审核”。
- `assets/views-knowledge.js:131`：Ds Bit 页增加相同的依赖顺序说明。

**参数级 Verified 下游表述**：

- `assets/views-knowledge.js:105`：Verified 改为“参数级证据通过，成为内容审核的候选数据；不代表内容版本已获 CONTENT_APPROVED 或发布授权”。
- `assets/views-knowledge.js:53`：CONTENT_APPROVED 改为“引用该参数的内容版本通过内容审核；参数 Verified 只是候选前提”；该行“当前”列由“部分参数 Verified（Demo）”改为“无内容版本审核记录（Demo）”，不再用参数级状态充作内容审核状态。
- `assets/views-main.js` 商品详情参数徽标由“可引用”改为“内容候选”；知识库统计改为“内容审核候选”；GEO 草稿改为“可进入内容草稿”。

### 2.2 P1-2 对齐真实业务的 Ds Bit 流水线

- `assets/views-knowledge.js:89-99`：由通用 7 框改为 8 个业务阶段：
  1. 文档接收（PDF / 版本 / SHA-256）
  2. 类型 / 主体判定（Datasheet / Selection Guide；MPN 或系列）
  3. 表格还原（跨页表格；TableId / RowId）
  4. 原始键值（RawLabel / RawValue）
  5. 映射 / 归一（NormalizedValue / ValueKind / 单位）
  6. 条件 / 置信度（Conditions / Confidence）
  7. 证据封装（PageNo / CellBBox / 原文 / 哈希）
  8. 质量门 / 审核（PIPELINE_PASS → ReviewStatus）
- `assets/views-knowledge.js:134`：卡片副标题同步为上述阶段，不再只写“解析 / 表格 / LLM”。
- `assets/admin.css`：`.pipeline` 默认 8 列（≤1400px 为 4 列，≤1024px 为 3 列，≤768px 为 2 列），不改变平板布局。

### 2.3 Confidence 与哈希标注

- `assets/views-knowledge.js:76`：15 字段模型追加第 16 行“Confidence（补充）”，不改变原 15 个核心字段编号；卡片标题同步为“15 字段 + Confidence 补充”（`:136`）。
- `assets/ui.js:307`：证据抽屉增加 `Confidence（补充）`（百分比）。
- `assets/ui.js:314`：参数证据哈希标签改为“文档 SHA-256 前缀（20 hex，Demo）”。
- `assets/admin.js:425`：文档抽屉同步为“SHA-256 前缀（20 hex，Demo）”。

### 2.4 内容资产库发布授权边界（第四轮）

**问题**：内容资产库存在“审核通过即可发布”的独立路径，未区分内容来源，也未校验发布批次授权。

**修正**：

- `assets/data.js:175-187`：内容增加 `origin`（`manual` / `dsbit`）与 `release`（发布授权记录）。`release.mode` 为 `dsbit` 时记录内容版本、批次号与授权号；`manual` 时记录独立审批号。CNT-200 设为“已通过但无发布授权”的样例，用于展示拦截状态。
- `assets/admin.js:311-355`：新增 `contentRelease(c)` 统一判断发布资格：
  - `manual`：需独立审批记录，显示“人工内容独立审批通过 / 未到发布环节”。
  - `dsbit`：需内容版本审核记录 + 发布批次授权，显示“已获发布授权 · 批次 B-…”或“未获发布授权”。
  - 抽屉新增“内容来源”“发布资格”“发布依据”三行；无授权时发布按钮替换为禁用的“未获发布授权”，并用提示说明缺哪一项。
- `assets/admin.js:1165-1195`：
  - `content-approve`：人工内容审核通过时写入独立审批记录 `MA-…`；dsbit 内容只记录内容审核，不生成发布授权，并提示“未获发布批次授权时仍不可发布”。
  - `content-publish`：审核通过后仍校验 `contentRelease`；dsbit 内容无批次授权、人工内容无独立审批记录时直接拒绝并提示。
- `assets/admin.js:1143-1147, 1158-1161`：新建 GEO 草稿标记为 `dsbit` 且无授权；新建内容标记为 `manual`。
- `assets/views-main.js:572-600`：列表“来源”列显示 `Ds Bit 参数` / `人工内容` 与生成方式；发布链接仅在“审核通过 + 具备对应授权”时出现，否则显示“未获发布授权”“待独立审批”或“待审核”。
- `assets/views-main.js:586-605`：页头与底部说明改为按来源区分发布资格，明确审核通过不等于发布授权。
- `screenshots/07-content.png` 重拍；新增 `screenshots/27-content-publish-guard.png` 展示 CNT-200 的“未获发布授权”抽屉。

**边界说明**：`release` 为 Demo 记录，仅用于演示授权规则，不代表真实审批数据；正式系统必须读取不可变的审核与发布记录，不能由当前状态反推授权。

---

## 3. 第二轮 P1 逐项（保留记录）

### P1-1 运行状态

- `index.html:84-89`：Ds Bit / 发布队列 / GA4 / Search Console / 社媒 API 统一为未连接 / 未接入 + Demo，并注明“当前原型状态”。
- `assets/views-system.js:176,190,193`：设置页同类状态；`:178-182` 拆分当前状态与目标接口 / 认证。

### P1-2 证据链

- 15 字段模型：`assets/views-knowledge.js:136`；证据渲染：`assets/ui.js:290-316`。
- 产品 ↔ Datasheet 适用性：`assets/views-knowledge.js:138`；`assets/data.js:94` 的 DS-1033 为 Family match。
- 参数抽屉：`assets/admin.js:438-458`；文档抽屉：`assets/admin.js:405-426`。
- 不以 BBox / Confidence 证明适用性：`assets/ui.js:315`、`assets/admin.js:458`。
- 不复制 Ds Bit 核心：`assets/views-knowledge.js:156`、`assets/views-system.js:182`。

### P1-3 三层质量状态

- 商品详情：`assets/views-main.js:263-274`（依赖顺序 + 历史快照）。
- Ds Bit：`assets/views-knowledge.js:126-131`；参数审核：`:237,257`。
- 不得合并为 Verified：`assets/views-main.js:274`、`assets/ui.js:316`。

### P1-4 SEO 技术治理

- `assets/views-main.js:492` 技术治理 Tab；主体 `:408-450`。
- URL / Canonical / Index、hreflang、sitemap 分片、质量与抓取异常、灰度回滚均在页面呈现。
- `assets/data.js:432`：单批 ≤5,000 URL、首批 1% 抽样、按批次回滚、双人审批；明确不提供一键全量发布。
- `assets/views-main.js:450`：SEO 治理与内容审核分离。

### P1-5 归因与 GEO

- 数据来源分层：`assets/views-ops.js:264`；LeadNo 桥接：`:271`；归因明细：`:321`。
- `generate_lead` ≠ 有效询盘：`assets/views-ops.js:312`、`assets/admin.js:362`。
- 90 天合成数据：`assets/views-ops.js:241,257`。
- GEO 三项分开：`assets/views-main.js:544`。

---

## 4. P2 逐项（保留记录）

1. 菜单 / 路由：`README.md:15,24`、`prototype-readme.md:47,173` 统一为 32 菜单 + 2 扩展页 = 34 路由。
2. Commands：`assets/views-knowledge.js:439` 独立 11 行；`assets/admin.js:226-228` 将 Commands 表排除在 43 个 action 的筛选与计数之外。
3. 视频转化链：`assets/views-ops.js:191` 列表列；`assets/admin.js:554-575` 抽屉转化链。
4. 部分覆盖：`assets/data.js:452-486` 仍为 25 / 18 / 0，未擅自转成已覆盖。

---

## 5. 差异与统计口径（修正）

第二轮提交 `dd8e71e..045e3d9` 的 GitHub 比较结果为 **40 个文件**：

- 36 modified：`07_prototypes/admin/` 内 12 个文本 + 23 张截图，另 `07_prototypes/SHA256SUMS.txt`。
- 4 added：`REVIEW-RESPONSE-v2.md` + 3 张新截图。
- 截图合计 26 张 = 23 修改 + 3 新增。

第三轮收尾（`045e3d9` 之后）修改 8 个文本文件（含本回应）、重拍 3 张截图、更新 1 次清单；未新增文件。

第四轮（`1305b4f` 之后）仅处理内容发布权限边界：修改 4 个文本文件（`data.js`、`admin.js`、`views-main.js`、本回应）、重拍 `07-content.png`、新增 `27-content-publish-guard.png`、更新 1 次清单；未改动其他文件。

---

## 6. 自检结果

### 6.1 JS 语法

`node --check` 全部通过（7/7）：`admin.js`、`data.js`、`ui.js`、`views-main.js`、`views-ops.js`、`views-knowledge.js`、`views-system.js`。

### 6.2 路由渲染（34/34）

逐页设置 hash 后读取 `<h1>` 与正文，全部命中预期标题，未出现 `undefined`、`[object Object]`、`NaN`。

工作台 4、商城运营 8、营销运营 9、产品知识 7（含覆盖矩阵）、系统管理 5、个人账号 1；合计 34。

### 6.3 关键交互

| 检查 | 结果 |
|---|---|
| 已发布商品（MCF8315A） | 显示历史快照、内容版本、批次；三层闸门均为已通过 |
| 草稿商品（STM32F103C8T6） | 流水线未运行；内容与发布均显示“上游未通过”，不可批准 |
| “提交内容审核” | 无快照时只提交审核，不改为 Published |
| Ds Bit 流水线 | 8 个业务阶段全部渲染 |
| Ds Bit 三层闸门 | CONTENT_APPROVED 当前列为“无内容版本审核记录（Demo）”，无“部分参数 Verified”残留 |
| 参数证据抽屉 | Confidence（补充）与“SHA-256 前缀（20 hex，Demo）”存在 |
| 覆盖矩阵 | 计数 43；筛选“部分覆盖”显示 18；Commands 11 行保持可见 |
| SEO 技术治理 / 分析 90 天 / 询盘 / 视频 / GEO | 与第二轮一致，均可切换与打开 |
| 定向测试 1：dsbit 内容无发布授权 | CNT-200（已通过、无授权）抽屉显示“未获发布授权”；强制触发发布被拒绝，提示“未获发布批次授权，不能发布”；状态保持草稿 |
| 定向测试 2：人工内容独立审批 | CNT-195 点击“人工审核通过”生成 `MA-CNT-195`；再次打开显示“人工内容独立审批通过”，随后发布成功 |

### 6.4 SHA256 清单

- `07_prototypes/SHA256SUMS.txt`：77 条（不含清单自身）。
- `cd 07_prototypes && sha256sum -c SHA256SUMS.txt`：77/77 `OK`，0 `FAILED`。

### 6.5 截图

`07-content.png` 已按第四轮修改重拍；新增 `27-content-publish-guard.png`（CNT-200 抽屉）。`03`、`11`、`13` 为第三轮重拍结果，`24`、`25`、`26` 保持第二轮内容。

### 6.6 并发修改

本轮仅修改 `07_prototypes/admin/` 与 `07_prototypes/SHA256SUMS.txt`；未触碰 Yii2、数据库、生产配置、Ds Bit、React 或 API。

---

## 7. 停止点

收尾已完成，停止于此。等待 Reviewer 针对性复核；不启动 React 后台工程、Yii2 API、数据库 Migration 或生产接入。
