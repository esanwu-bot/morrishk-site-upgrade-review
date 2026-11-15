# Morris Design System

**版本** 1.0.0 · **日期** 2026-11-15 · **状态** 待 Reviewer 评审
**实现层** `assets/tokens.css`（Token）+ `assets/proto.css`（组件）
**适用范围** `07_prototypes/` 全部原型页面，以及后续 morrishk.net 前端实现

> 本文是**唯一视觉权威**。任何页面、组件、内联样式与旧文档冲突时，以本文为准。
> 旧 `prototype/design.md` 保留为**交互与信息密度**权威（参数化检索、高密度列表、替代料逻辑、空状态），
> 其视觉条款（品牌蓝 `#0052CC`、彩色语义徽章）自本文生效之日起**废止**。

---

## 一、体系定位

### 1.1 名称

**Morris Precision Industrial**——精密工业风。

它不是"科技感"，也不是"电商感"。它的目标是让一个正在产线停线压力下找料的工程师，
在 3 秒内判断出：这颗料有没有、多少钱、能不能替代、下一步点哪里。

### 1.2 三条不可让步的原则

| # | 原则 | 含义 | 反面（明确禁止） |
|---|---|---|---|
| 1 | **信息优先于装饰** | 屏幕上每一像素要么承载信息，要么承载分组。装饰性元素必须有功能理由 | 无意义渐变、装饰性插画、为"丰富"而加的图标、hover 才出现的关键信息 |
| 2 | **红色是信号，不是主题色** | 红色只出现在"要你注意"和"要你点击"的位置。页面主体的 95% 是灰阶与白 | 红色标题栏、红色分区底色、红色装饰线条、满屏红色按钮 |
| 3 | **状态必须双通道** | 任何状态（有货/缺货/EOL/紧张/推荐）都由「文字或图标」+「颜色」共同表达 | 只用颜色区分状态；只用图标不给文字；用颜色当唯一语义载体 |

### 1.3 与 LCSC 的关系（重要）

本轮研究了 LCSC 五个页面（见 `reference/lcsc_research.md`）。**借鉴的是设计与业务模式，不是外观**：

| 借鉴 | 不借鉴 |
|---|---|
| 首页"稀缺料 → 询盘"的转化路径设计 | 深蓝色顶栏 + 蓝色 Catalog 按钮的品牌配色 |
| 搜索页左侧分面筛选 + 右侧高密度表格的双栏结构 | 六列彩虹徽章（RoHS 绿 / 库存黄 / 促销红…） |
| BOM 页"上传文件 / 粘贴文本"双入口 + 明确容量上限 | 圆形 pill 按钮与 12px 以上大圆角 |
| 详情页阶梯价表与参数表的并置关系 | LCSC 自有素材、图标、文案、源代码、完整页面结构 |
| 报价状态页的分状态列表结构 | 强制登录才能查看报价的门槛设计 |

**Morris 的差异点（不得因模仿而丢失）**：稀缺料/EOL 的询盘转化导向、精确型号优先的搜索语义、
千万级数据的游标分页约束、替代料的**不利参数差异提示**、详情页七段式、
PDF 参数的证据链与型号适用性边界、BOM 询盘的 LeadNo 与重复提交防护。

---

## 二、视觉原则（可执行条款）

### 2.1 色彩纪律

1. **主色只有一个**：`--color-brand` = `#DC2626`（crimson）。不得引入第二个品牌色相。
2. **不使用蓝、绿、紫作为装饰色**。界面上不出现任何蓝色/绿色/紫色元素，包括：
   链接、图标底色、图表系列、进度条、标签、hover 高亮、聚焦环。
3. **绿色不表示"有货"**。有货用 `--color-success`（中性深灰）+ `✓` 图标 + 文字"有货"。
   理由：B2B 元器件站点的"有货"是常态而非喜讯，绿色会造成视觉噪声，
   且在红绿色盲用户下与红色警示难以区分。
4. **允许的色相只有三类**：
   - 中性灰阶（界面 95%）
   - 品牌红（见下条的使用边界）
   - 功能琥珀（库存紧张、待确认、mock 标注）
5. **红色的使用边界（唯一表述，取代此前"缺货警示"的笼统说法）**：
   红色**只用于高优先级行动和风险信号**，包括：
   - 主 CTA（加入询盘 / 提交 BOM）
   - 缺货、EOL 等风险状态
   - 必要的聚焦与选中反馈（`--color-focus-ring`、选中行左标记）

   红色**不得用于装饰性着色**：分区底色、标题栏、图标底、图表序列、hover 高亮、
   纯装饰线条。红色按钮不是"都该取消"，而是"只在终结动作上出现"——每屏主 CTA 不超过 2 个。
6. **禁止彩虹徽章**。同一行内的徽章最多出现两种颜色（中性 + 一种强调），
   其余状态靠文字与图标区分。见 4.4 徽章、4.5 库存状态组件。
7. **风险信号分级**。同一屏内不得让"硬性不兼容"与"待确认"共用同一种颜色：

   | 级别 | 语义 | 颜色 | 示例 |
   |---|---|---|---|
   | 硬性风险 | 已确定不可用 / 已断供 | `--color-danger`（红） | `Not suitable < −20 °C`、`3-PWM mode unavailable`、EOL、Out of stock |
   | 待确认 | 需工程确认或降额后才可用 | `--color-warning`（琥珀） | `Confirm derating`、`Low stock` |
   | 信息 | 中性说明 | `--color-text-muted` | `RoHS`、`Active`、`Genuine` |

### 2.2 渐变与阴影

1. **禁止装饰性渐变**。允许的渐变只有一种：图像占位区的 `--color-surface-sunken → --color-surface` 线性过渡，
   用于表达"此处应有图片"。禁止彩色渐变、径向光晕、玻璃拟态。
2. **数据面零阴影**。表格、卡片、筛选栏一律 `--shadow-none`，靠 1px 描边与底色区分层次。
3. **阴影只给浮层**：下拉、模态、批量操作栏、toast。共 3 个级别（`--shadow-pop` / `--shadow-modal` / `--shadow-bar`）。

### 2.3 形状

1. **圆角上限 6px**。`2px` chip/badge，`4px` 按钮/输入/卡片，`6px` 大面板。
2. **禁止 pill 形状**（`border-radius: 999px`）。包括按钮、标签、头像、搜索框。
3. **表格内部单元格直角**（`--radius-none`），只有表格外容器有 4px 圆角。
4. **描边优先于阴影**。任何需要"浮起来"的元素，先用 1px 描边 + 白底解决。

### 2.4 信息密度

1. 基准行高 **36px**（`--table-row-h`），宽松版 44px。不使用 48px 以上的行高。
2. 正文字号 **13px**，辅助 11–12px，标题 15–24px。不使用 14px 以上的正文。
3. 页面最大宽度 **1600px**（`--layout-max`），内容区常用 1180px。
4. **数字强制等宽**：所有价格、库存、数量、型号列使用 `--font-feature`（`tnum` + `zero` + `cv05`），
   保证纵向对齐。这是本体系最容易被忽略但最重要的一条。

### 2.5 排版细节

1. 字重只用 400 / 500 / 600 / 700 四档。禁止 300（小字号下不可读）与 800/900（过重，与工业风冲突）。
2. 字间距：大标题 `--ls-tight`（-0.02em），正文 0，全大写小标签 `--ls-wider`（+0.03em）。
3. **全大写只用于小标签**（11px 以下的分区名、表头）。正文与按钮文字不使用全大写。
4. 型号（MPN）使用 `--font-mono`，且 `text-transform: none`——型号的大小写是型号的一部分，不得转换。

---

## 三、Design Token

三层架构，只允许业务代码使用**第二层（语义）**与**第三层（组件）**。

```
第一层 Primitive  --red-600 / --gray-200 / --amber-700 …   仅 tokens.css 内部组合
        ↓
第二层 Semantic   --color-brand / --color-border / --color-text …   业务代码只用这一层
        ↓
第三层 Component  --btn-h-md / --table-row-h / --badge-px …   组件样式引用
```

**强制规则**：

- 页面 HTML、`proto.css`、内联 `style` 中**不得出现任何字面色值**（`#hex` / `rgb()` / `hsl()`）。
- 唯一例外：`tokens.css` 的 Primitive 层与 `--color-overlay-scrim` 的半透明值。
- 断点数值因媒体查询无法读 `var()`，以 `--bp-*` 登记为唯一事实来源，样式表内写数值必须与之一致。

### 3.1 Colors — Primitive

| Token | 值 | 用途（仅内部） |
|---|---|---|
| `--red-50` | `#FEF2F2` | 品牌浅底 |
| `--red-100` | `#FEE2E2` | 选中行底色 |
| `--red-200` | `#FECACA` | 品牌浅底描边 |
| `--red-300` | `#FCA5A5` | 禁用态品牌色 |
| `--red-500` | `#EF4444` | 图标点缀（极少） |
| `--red-600` | `#DC2626` | **品牌主色** |
| `--red-700` | `#B91C1C` | hover |
| `--red-800` | `#991B1B` | active / 危险文字 |
| `--red-900` | `#7F1D1D` | 深色警示底 |
| `--gray-0` | `#FFFFFF` | 表面 |
| `--gray-25` | `#FCFCFD` | 次级表面 |
| `--gray-50` | `#F8FAFC` | **页面底色** |
| `--gray-100` | `#F1F5F9` | 沉底区 |
| `--gray-200` | `#E2E8F0` | 常规描边 |
| `--gray-300` | `#CBD5E1` | 输入描边 |
| `--gray-400` | `#94A3B8` | 强描边 / 禁用文字 |
| `--gray-500` | `#64748B` | 次要文字 |
| `--gray-600` | `#475569` | 无状态文字 |
| `--gray-700` | `#334155` | 深色次要文字 |
| `--gray-800` | `#1E293B` | 深色底 |
| `--gray-900` | `#0F172A` | **正文 / 标题 / 深色条** |
| `--amber-50` | `#FFFBEB` | 警告浅底 |
| `--amber-200` | `#FDE68A` | 警告描边 |
| `--amber-700` | `#B45309` | **警告文字** |
| `--amber-900` | `#78350F` | 警告深字 |

### 3.2 Colors — Semantic

| Token | 映射 | 语义 |
|---|---|---|
| `--color-brand` | `--red-600` | 高优先级行动与风险信号：主 CTA、缺货/EOL、必要的聚焦与选中反馈（边界见 2.1 第 5 条） |
| `--color-brand-hover` | `--red-700` | 主按钮 hover |
| `--color-brand-active` | `--red-800` | 主按钮 active |
| `--color-brand-subtle` | `--red-50` | 选中行底色、品牌浅底块 |
| `--color-brand-border` | `--red-200` | 浅底配套描边 |
| `--color-brand-text` | `--red-800` | 浅底上的红字（保证 ≥4.5:1） |
| `--color-canvas` | `--gray-50` | 页面底色 |
| `--color-surface` | `--gray-0` | 卡片 / 表格 / 输入框 |
| `--color-surface-sunken` | `--gray-100` | 表头、只读区、次级区块 |
| `--color-surface-inverse` | `--gray-900` | 深色条、批量操作栏、页脚 |
| `--color-border` | `--gray-200` | 常规分割线 |
| `--color-border-subtle` | `--gray-100` | 表格行内细线 |
| `--color-border-input` | `--gray-300` | 输入控件描边 |
| `--color-border-strong` | `--gray-400` | 浮层描边、hover 态 |
| `--color-text` | `--gray-900` | 型号、数值、标题、正文 |
| `--color-text-muted` | `--gray-500` | 说明、标签、次要信息 |
| `--color-text-disabled` | `--gray-400` | 占位符、禁用 |
| `--color-text-inverse` | `--gray-0` | 深色底文字 |
| `--color-text-inverse-dim` | `--gray-300` | 深色底次要文字 |
| `--color-success` | `--gray-900` | **有货（中性 + ✓）** |
| `--color-success-subtle` | `--gray-100` | 有货底色 |
| `--color-warning` | `--amber-700` | 库存紧张 / 待确认 |
| `--color-warning-subtle` | `--amber-50` | 警告浅底 |
| `--color-warning-border` | `--amber-200` | 警告描边 |
| `--color-danger` | `--red-800` | 缺货 / EOL / 错误 |
| `--color-danger-subtle` | `--red-50` | 危险浅底 |
| `--color-danger-border` | `--red-200` | 危险描边 |
| `--color-neutral-status` | `--gray-600` | 无状态 / 停产信息 |
| `--color-focus-ring` | `--red-600` | 聚焦环 |
| `--color-hover-row` | `--gray-50` | 表格行 hover |
| `--color-selected-row` | `--red-50` | 选中行 |
| `--color-selected-bar` | `--red-600` | 选中行左侧 2px 标记 |
| `--color-overlay-scrim` | `rgba(15,23,42,.45)` | 模态遮罩 |

### 3.3 Typography

| Token | 值 | 用途 |
|---|---|---|
| `--font-sans` | `Inter, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif` | 全部正文 |
| `--font-mono` | `"SFMono-Regular", "JetBrains Mono", Consolas, "Liberation Mono", monospace` | 型号、编码、哈希 |
| `--font-feature` | `"tnum" 1, "cv05" 1, "zero" 1` | 等宽数字 + 单层 a + 斜杠零 |

| Token | 字号 / 行高 | 用途 |
|---|---|---|
| `--fs-caption` / `--lh-caption` | 10 / 14 | 极小的辅助说明、标注 |
| `--fs-label-sm` / `--lh-label-sm` | 11 / 14 | 表头、分区小标签（全大写） |
| `--fs-label` / `--lh-label` | 12 / 16 | 字段标签 |
| `--fs-body-sm` / `--lh-body-sm` | 12 / 16 | 次要正文、表格内说明 |
| `--fs-body` / `--lh-body` | 13 / 18 | **正文基准** |
| `--fs-body-lg` / `--lh-body-lg` | 14 / 20 | 强调正文、表单输入 |
| `--fs-title-sm` / `--lh-title-sm` | 15 / 20 | 卡片标题 |
| `--fs-title` / `--lh-title` | 18 / 24 | 区块标题 |
| `--fs-title-lg` / `--lh-title-lg` | 20 / 26 | 页面标题 |
| `--fs-headline` / `--lh-headline` | 24 / 30 | 首页 Hero 标题 |
| `--fs-display` / `--lh-display` | 32 / 38 | 详情页型号主标题 |

字重：`--fw-regular` 400 / `--fw-medium` 500 / `--fw-semibold` 600 / `--fw-bold` 700
字距：`--ls-tight` -0.02em / `--ls-snug` -0.01em / `--ls-normal` 0 / `--ls-wide` 0.02em / `--ls-wider` 0.03em / `--ls-widest` 0.04em

### 3.4 Spacing

4pt 基准，2pt 用于行内微调。

| Token | 值 | 典型用途 |
|---|---|---|
| `--sp-0` | 0 | — |
| `--sp-1` | 2px | 徽章内上下、图标与文字 |
| `--sp-2` | 4px | 行内元素间距 |
| `--sp-3` | 6px | 紧凑堆叠 |
| `--sp-4` | 8px | 按钮组、表单行 |
| `--sp-5` | 12px | 卡片内边距（紧凑） |
| `--sp-6` | 16px | 卡片内边距（标准） |
| `--sp-7` | 20px | 区块内间距 |
| `--sp-8` | 24px | 区块间间距 |
| `--sp-9` | 32px | 大区块间距 |
| `--sp-10` | 40px | 页面主区块 |
| `--sp-11` | 48px | Hero 上下留白 |
| `--sp-12` | 64px | 页脚上留白 |

布局 Token：

| Token | 值 | 用途 |
|---|---|---|
| `--layout-max` | 1600px | 宽屏上限 |
| `--layout-max-narrow` | 1180px | 内容区常用宽度 |
| `--layout-gutter` | 24px | 桌面左右留白 |
| `--layout-gutter-tablet` | 20px | 平板 |
| `--layout-gutter-mobile` | 16px | 手机 |
| `--layout-sidebar` | 248px | 搜索页筛选栏 |
| `--layout-aside` | 300px | 详情页右栏（价格/库存） |
| `--layout-media` | 200px | 详情页主图列 |

### 3.5 Radius

| Token | 值 | 用途 |
|---|---|---|
| `--radius-none` | 0 | 表格内部单元格 |
| `--radius-xs` | 2px | chip、badge、状态点容器 |
| `--radius-sm` | 4px | **按钮、输入、卡片、表格容器** |
| `--radius-md` | 6px | 大面板、模态 |

**禁止**：`border-radius: 999px` 及任何 > 6px 的值。

### 3.6 Border

| Token | 值 |
|---|---|
| `--bw-1` | 1px |
| `--bw-2` | 2px（聚焦环、选中行左标记） |
| `--border-default` | `1px solid var(--color-border)` |
| `--border-subtle` | `1px solid var(--color-border-subtle)` |
| `--border-input` | `1px solid var(--color-border-input)` |
| `--border-strong` | `1px solid var(--color-border-strong)` |
| `--border-brand` | `1px solid var(--color-brand)` |
| `--ring-focus` | `0 0 0 1px var(--color-focus-ring)` |

### 3.7 Shadow

| Token | 值 | 用途 |
|---|---|---|
| `--shadow-none` | `none` | **所有数据面** |
| `--shadow-pop` | `0 4px 6px -1px rgba(15,23,42,.07), 0 2px 4px -2px rgba(15,23,42,.05)` | 下拉、阶梯价浮层 |
| `--shadow-modal` | `0 10px 15px -3px rgba(15,23,42,.10), 0 4px 6px -4px rgba(15,23,42,.06)` | 模态 |
| `--shadow-bar` | `0 -2px 8px -2px rgba(15,23,42,.12)` | 底部批量操作栏 |

### 3.8 Breakpoints

| Token | 值 | 含义 | 栅格行为 |
|---|---|---|---|
| `--bp-sm` | 480px | 小屏手机 | 全部单列 |
| `--bp-md` | 768px | 大屏手机 / 平板竖屏 | 2 列降为 1 列；筛选栏转为抽屉 |
| `--bp-lg` | 1024px | 平板横屏 / 小笔记本 | 3 列降为 2 列；右栏下沉 |
| `--bp-xl` | 1200px | 标准桌面 | 完整布局 |
| `--bp-2xl` | 1600px | 宽屏工作站 | 内容居中，左右留白增加 |

媒体查询必须使用 `max-width`（桌面优先），数值与上表一致。

### 3.9 Z-index

| Token | 值 | 用途 |
|---|---|---|
| `--z-base` | 0 | 文档流 |
| `--z-sticky` | 10 | 表头吸附 |
| `--z-dropdown` | 40 | 下拉、阶梯价浮层 |
| `--z-sticky-bar` | 60 | 批量操作栏 |
| `--z-drawer` | 80 | 移动端筛选抽屉 |
| `--z-scrim` | 90 | 遮罩 |
| `--z-modal` | 100 | 对话框 |
| `--z-annotation` | 120 | 原型标注层 |
| `--z-toast` | 200 | 轻提示 |

**禁止**在页面中直接写 `z-index: 9999`。

### 3.10 Components

| 分组 | Token | 值 |
|---|---|---|
| 按钮 | `--btn-h-xs` / `--btn-px-xs` | 26px / 8px |
| | `--btn-h-sm` / `--btn-px-sm` | 32px / 12px |
| | `--btn-h-md` / `--btn-px-md` | 38px / 16px |
| 输入 | `--input-h` / `--input-px` / `--input-py` | 32px / 10px / 6px |
| 表格 | `--table-head-h` | 32px |
| | `--table-row-h` | 36px（高密度） |
| | `--table-row-h-roomy` | 44px（宽松） |
| | `--table-cell-px` | 10px |
| 徽章 | `--badge-py` / `--badge-px` | 2px / 6px |
| 页头 | `--header-util-h` | 30px（工具条） |
| | `--header-main-h` | 56px（主站头） |
| | `--header-nav-h` | 38px（主导航） |
| 动效 | `--motion-fast` / `--motion-base` | 120ms / 180ms |
| | `--ease-standard` | `cubic-bezier(.2,0,.2,1)` |

### 3.11 Data visualization

原型阶段暂无图表，Token 先定义，供后台与数据页复用。

| Token | 映射 | 用途 |
|---|---|---|
| `--viz-series-1` | `--gray-900` | 主序列 |
| `--viz-series-2` | `--gray-600` | 次序列 |
| `--viz-series-3` | `--gray-400` | 第三序列 |
| `--viz-series-4` | `--gray-300` | 第四序列 |
| `--viz-series-accent` | `--red-600` | **唯一强调序列**（当期 / 异常） |
| `--viz-grid` | `--gray-200` | 网格线 |
| `--viz-axis` | `--gray-500` | 轴线 |
| `--viz-label` | `--gray-600` | 轴标签 |
| `--viz-bg` | `--color-surface` | 绘图区底色 |

**规则**：图表默认**单色序列**（灰阶深浅区分），红色只用于强调**一个**重点序列。
禁止多色相饼图、禁止彩虹色堆叠柱。若必须区分超过 4 个序列，改用小倍数图（small multiples）而非加色相。

---

## 四、组件规范

### 4.1 按钮

| 类型 | 类名 | 底色 | 文字 | 描边 | 用途 |
|---|---|---|---|---|---|
| 主 | `.btn-primary` | `--color-brand` | `--color-text-inverse` | 无 | 每屏最多 1 个 |
| 次 | `.btn-secondary` | `--color-surface` | `--color-text` | `--border-input` | 常规操作 |
| 幽灵 | `.btn-ghost` | 透明 | `--color-text-muted` | 无 | 行内次要操作 |
| 危险 | `.btn-danger` | `--color-danger` | `--color-text-inverse` | 无 | 删除、取消 |

尺寸：`xs` 26px / `sm` 32px / `md` 38px。圆角 `--radius-sm`。**禁止 pill**。

规则：一屏只能有一个 `.btn-primary`。表格行内的操作按钮一律 `ghost` 或 `secondary`，
只有"加入询盘"这类终结动作可以用红色。

### 4.2 表单

- 高度 `--input-h`（32px），描边 `--border-input`，圆角 `--radius-sm`，底色 `--color-surface`。
- 聚焦：`--ring-focus` + 描边转 `--color-brand`。**不使用蓝色聚焦环**。
- 错误：描边 `--color-danger-border` + 下方 12px 红字说明（**文字必须存在**，不能只变红）。
- 必填标记：文字"必填"或 `*` + `aria-required`，不单靠颜色。
- 占位符颜色 `--color-text-disabled`，且**不得用占位符替代标签**。

### 4.3 表格（核心组件）

```
┌────────────────────────────────────────────────────────────┐
│ 表头 32px，底色 --color-surface-sunken，11px 全大写，        │
│ 字距 --ls-wider，颜色 --color-text-muted                    │
├────────────────────────────────────────────────────────────┤
│ 数据行 36px，1px 底边 --color-border-subtle                 │
│ hover: --color-hover-row                                    │
│ 选中: --color-selected-row + 左侧 2px --color-selected-bar  │
└────────────────────────────────────────────────────────────┘
```

规则：
1. 数字列右对齐 + `--font-feature`；型号列左对齐 + `--font-mono`。
2. 表头吸附（`position: sticky` + `--z-sticky`）。
3. 行内操作按钮不出现在 hover 才显示的位置——触屏与键盘用户会丢失。
4. 空状态必须给**下一步动作**，不只给"暂无数据"。

### 4.4 徽章

下表与 `assets/proto.css` 的实际类名**逐条对应**（此前文档写的是 `.badge-danger` / `.badge-success`，
代码里从未存在过这两个类，属文档与实现不一致，已更正）：

| 类名 | 底色 | 文字 / 描边 | 用途 |
|---|---|---|---|
| `.badge` | `--color-surface-sunken` | `--color-text-muted` | 中性标签（RoHS / Active / Genuine） |
| `.badge-outline` | 透明 | `--color-text-muted` + `--border-default` | 次要标签 |
| `.badge-solid` | `--color-text` | `--color-text-inverse` | 强中性强调（如 `Exact` 匹配） |
| `.badge-warn` | `--color-warning-subtle` | `--color-warning` + `--color-warning-border` | 紧张 / 待确认（`Low stock`、`Confirm derating`） |
| `.badge-crit` | `--color-danger-subtle` | `--color-danger` + `--color-danger-border` | 硬性风险（`EOL`、`Not suitable`、`Out of stock`） |

规则：高度 18–20px，圆角 `--radius-xs`（2px），字号 11px，内边距 `--badge-py --badge-px`。
**同一行最多两种颜色**。徽章只表达**属性与生命周期**，不表达库存数量——库存数量归 4.5。

### 4.5 库存状态组件（Stock）

**这是全站库存状态的唯一映射表。** 详情页、搜索页、首页、替代料表必须使用同一套实现，
不得各自定义颜色或图标。

| 状态 | 类名 | 图标 | 文字 | 前景 Token | 底色 / 描边 |
|---|---|---|---|---|---|
| 有货 | `.stock-ok` | `✓` | `In stock` | `--stock-ok-fg`（中性深灰） | 透明 |
| 库存紧张 | `.stock-low` | `!` | `Low stock` | `--stock-low-fg`（琥珀） | `--stock-low-bg` / `--stock-low-bd` |
| 缺货 | `.stock-out` | `×` | `Out of stock` | `--stock-out-fg`（红） | `--stock-out-bg` / `--stock-out-bd` |
| 停产 | `.stock-eol` | `×` | `EOL` | `--stock-eol-fg`（红） | `--stock-eol-bg` / `--stock-eol-bd` |

实现：

```html
<span class="stock stock-ok">
  <i class="stock-ico" aria-hidden="true">✓</i>
  <span class="stock-txt">In stock</span>
  <span class="stock-qty num">12,480</span>
</span>
```

**三条强制规则**：

1. **三通道**：颜色 + 图标 + 文字必须同时出现。只有色点、只有色块、只有数字都视为实现缺陷。
   `✓` 图标本身 `aria-hidden`，语义由 `In stock` 文字承担。
2. **不得错配**：`Low stock` 只能用琥珀（`.stock-low` / `.badge-warn`）；
   只有 `Out of stock` 与 `EOL` 允许用红（`.stock-out` / `.stock-eol` / `.badge-crit`）。
   把 `Low stock` 绑到危险色是**语义错误**，不是审美偏好。
3. **一处表达**：库存状态只在 Stock 列 / 可用量区表达一次；型号行的徽章只放生命周期
   （`Active` / `EOL` / `Last time buy`）。同一行不得出现"红色徽章 + 琥珀色点"这类双重表达。

> 与常见电商惯例的差异：**有货不绿**。理由见 2.1 第 3 条——B2B 场景"有货"是常态，
> 绿色会成为噪声，且在红绿色盲下与红色警示难以区分。这是一个**有意为之**的反直觉决定，
> 已在 `README.md` 第 7.2 节列出，供 reviewer 复核。

### 4.6 卡片

`--color-surface` 底 + `--border-default` + `--radius-sm` + `--shadow-none`。
头部 `.card-hd` 与主体 `.card-bd` 之间 1px 分割线。卡片内边距 `--sp-6`（标准）/ `--sp-5`（紧凑）。

### 4.7 页头

三段式，总高 124px：

| 段 | 高度 | 底色 | 内容 |
|---|---|---|---|
| 工具条 | `--header-util-h` 30px | `--color-surface-inverse` | 站点说明、币种、登录、语言 |
| 主站头 | `--header-main-h` 56px | `--color-surface` | Logo、全站搜索、BOM 询盘入口 |
| 主导航 | `--header-nav-h` 38px | `--color-surface` + 底边 | 分类、制造商、库存、替代料、BOM |

搜索框在主站头内占主要宽度，右侧固定放"BOM 询盘"红色按钮——这是全站最高优先级的转化入口。

### 4.8 提示条

| 类名 | 底色 | 左描边 | 用途 |
|---|---|---|---|
| `.info-note` | `--color-surface-sunken` | `--color-border-strong` | 中性说明 |
| `.warn-note` | `--color-warning-subtle` | `--color-warning` | 需要用户注意的边界 |
| `.pill-note` | `--color-brand-subtle` | `--color-brand` | 关键裁定 / 重要声明 |

均带 `!` 或 `i` 图标 + 文字标题，**颜色不是唯一载体**。

### 4.9 标注层（原型专用）

`data-mock` 属性标记 mock 数据、占位链接、模拟交互。开启后 `body.annot` 给对应元素加
琥珀色虚线框 + 角标。`--z-annotation` 层级。**此层不进入生产实现**。

---

## 五、栅格

统一用 CSS 类，**禁止在行内写 `grid-template-columns`**——行内样式会压过媒体查询，
导致移动端不降列（v1.4 曾出现此问题）。

| 类名 | 桌面 | 平板（≤1024） | 手机（≤768） |
|---|---|---|---|
| `.g-hero` | `1.55fr 1fr` | 1 列 | 1 列 |
| `.g-stat4` | 4 列 | 2 列 | 2 列 |
| `.g-cat4` | 4 列 | 2 列 | 1 列 |
| `.g-2` | 2 列 | 1 列 | 1 列 |
| `.g-detail-top` | `200px minmax(0,1fr) 300px` | `170px minmax(0,1fr)`，右栏下沉 | 1 列 |
| `.g-detail-body` | `minmax(0,1fr) 300px` | 1 列 | 1 列 |
| `.g-form` | `minmax(0,1fr) 300px` | 1 列 | 1 列 |
| `.g-2col` | 2 列 | 1 列 | 1 列 |
| `.kv2` | `110px minmax(0,1fr) 110px minmax(0,1fr)` | 1 组 | 1 组 |

---

## 六、可访问性

1. **对比度**：正文 ≥ 4.5:1，大字 ≥ 3:1。`--color-brand-text`（`#991B1B`）用于浅红底上的文字，
   不使用 `--color-brand`（`#DC2626`）直接压浅红底（仅 3.9:1，不达标）。
2. **聚焦可见**：`:focus-visible` 一律 `outline: var(--bw-2) solid var(--color-focus-ring)`，
   `outline-offset: 2px`。**禁止 `outline: none` 且不替代**。
3. **状态双通道**：颜色 + 文字/图标。已在上文各组件规范中逐条落实。
4. **高对比模式**：`@media (prefers-contrast: more)` 加强描边与文字对比，不改变色相（见 `tokens.css` 末尾）。
5. **动效**：`--motion-fast` 120ms / `--motion-base` 180ms。所有过渡须可被 `prefers-reduced-motion` 关闭。
6. **触控目标** ≥ 32×32px（`--btn-h-sm` 为下限）。

---

## 七、迁移说明（v1.4 → v1.5）

本轮**只改取值来源，不改结构与交互**：

| 项目 | v1.4 | v1.5 |
|---|---|---|
| 色值来源 | 各页面/`proto.css` 内字面写死 | 全部走 `assets/tokens.css` |
| 变量命名 | `--primary` / `--surface` / `--text` | `--color-brand` / `--color-surface` / `--color-text` |
| 圆角 | 行内 `border-radius:4px` | `var(--radius-sm)` |
| 品牌色数量 | 1（crimson）+ 若干散落色值 | 1（`--color-brand`），无散落 |
| 结构 / 信息架构 / 交互路径 | — | **完全不变** |
| mock 标注 | 109 处 `data-mock` | **完全不变** |

迁移的机械核对结果见 `TOKEN_AUDIT.md`，逐项视觉差异见 `VISUAL_DIFF.md`。

---

## 八、未覆盖事项（诚实声明）

1. **暗色模式未设计**。本体系只有浅色主题。若后续需要，须重新定义整套语义 Token 的映射，
   不能简单反转灰阶。
2. **图标系统未定义**。原型使用文字符号（`✓` `!` `×` `→`），生产实现需引入统一图标集并规定
   线宽、尺寸（16/20/24）与语义映射。
3. **数据可视化仅定义 Token，无实际图表**。配色策略（单色序列 + 单强调）已定，但图表类型、
   交互、空状态未设计。
4. **未做真实字体加载方案**。原型依赖系统 Inter / 回退字体，生产需确定自托管或 CDN 策略与
   `font-display` 取值。
5. **未验证浏览器兼容性**。原型仅在 Chromium 内核下目视检查，未测 Safari / Firefox。
6. **本文档的对比度数值为计算值，未做工具化全量扫描**。
