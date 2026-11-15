# Token 使用检查报告

**生成方式** 脚本生成，非人工估算。重跑同一条命令即可复现本报告全部数字。

```bash
python tools/check_tokens.py --path 07_prototypes/
```

| 项 | 值 |
|---|---|
| 扫描根目录 | `07_prototypes/` |
| 文件数 | 8（HTML 5 / CSS 2 / JS 1） |
| 排除目录 | `_legacy_v0/`、`_shots/`、`admin/`、`reference/`、`seo/`、`tools/` |
| Token 定义文件 | `assets/tokens.css` |
| 退出码含义 | 0 = 全部 PASS；1 = 存在 FAIL；2 = 路径或文件缺失 |

扫描文件清单：

- `index.html`
- `assets/proto.css`
- `assets/proto.js`
- `assets/tokens.css`
- `home/index.html`
- `inquiry/index.html`
- `product_detail/index.html`
- `search/index.html`

## 0. 扫描规则与判定口径

同一段文本在不同语境下的判定不同，本节先固定口径，后续各节只给数字。

| 语境 | 是否违规 | 说明 |
|---|---|---|
| CSS 文件中的声明值 | **违规** | 去注释后全文扫描，`color` / `background` / `border` 等属性的取值必须是 `var(--*)` 或关键字 |
| HTML `<style>` 块内的声明 | **违规** | 同上 |
| HTML `style="..."` 属性内的声明 | **违规** | 同上 |
| HTML 展示文字（正文、表格单元格、说明） | 不违规 | 如页面里展示规范原文 `#DC2626`，属于**内容**而非样式，仅作 INFO 列出（A2） |
| CSS / HTML / JS 注释 | 不违规 | 注释不参与渲染，仅计数（A3） |
| `var(--*)` 引用 | 合规 | 具体取值由 `tokens.css` 决定 |
| 关键字 `transparent` / `inherit` / `currentColor` / `none` | 合规 | 不承载色值 |
| 仅写宽度与线型的 `border: 1px solid`（无颜色） | 合规 | 颜色继承自 `currentColor` |
| `tokens.css` 内的 `#hex` | 合规 | Primitive 层的定义处，是全站唯一允许出现字面色值的位置 |
| `tokens.css` 内的 `rgba()`（遮罩、阴影） | 合规 | 半透明与多层阴影无法用不透明色阶表达 |

## A. CSS 声明中的硬编码色值

规则：除 `tokens.css` 外，**样式声明中不得出现任何字面色值**。这是硬性门槛，必须为 0。

| 文件 | hex | rgb() | hsl() | 判定 |
|---|---|---|---|---|
| `index.html` | 0 | 0 | 0 | PASS |
| `assets/proto.css` | 0 | 0 | 0 | PASS |
| `assets/proto.js` | 0 | 0 | 0 | PASS |
| `assets/tokens.css` | 25 | 6 | 0 | 定义文件（合法） |
| `home/index.html` | 0 | 0 | 0 | PASS |
| `inquiry/index.html` | 0 | 0 | 0 | PASS |
| `product_detail/index.html` | 0 | 0 | 0 | PASS |
| `search/index.html` | 0 | 0 | 0 | PASS |

**结果：PASS** —— `tokens.css` 之外的样式声明中共 **0** 处字面色值。

### `assets/tokens.css` 内的字面值分布（合法）

共 **31** 处：**25** 处位于 `--red-* / --gray-* / --amber-*` 原始色阶定义行，其余 **6** 处为遮罩与阴影的 `rgba()`。

## A2. HTML 展示文字中的色值字面量（允许，INFO）

这些色值出现在**页面正文**里（例如入口页展示规范原文），不参与渲染，**不构成违规**。列出它们是为了让复核者看到：报告中“0 处硬编码”的口径**不包含**这类展示文字。

| 文件 | 行 | 值 | 上下文 |
|---|---|---|---|
| `index.html` | 129 | `#DC2626` | `<dd><span class="mono">var(--color-brand)</span> = <span class="mono">#DC2626</span>，只用于高优先级行动与风险信号（主 CTA、缺货/EOL、必要的聚焦与选中反馈），不得用于装饰性着色</dd>` |
| `index.html` | 142 | `#0052CC` | `旧 <span class="mono">prototype/design.md</span>（品牌蓝 <span class="mono">#0052CC</span>、彩色语义徽章）与旧` |

**计数：2 处**（INFO，不影响 PASS/FAIL）。

## A3. 注释中的色值（允许，INFO）

| 文件 | 注释内色值/颜色函数出现次数 |
|---|---|
| `assets/proto.css` | 2 |
| `assets/tokens.css` | 2 |

**计数：4 处**（INFO，不影响 PASS/FAIL）。

## B. 未定义变量引用

规则：`var(--x)` 中的 `--x` 必须在 `assets/tokens.css` 中有定义。

| 变量 | 被引用文件 |
|---|---|
| _（无）_ | — |

**结果：PASS** —— 共 0 个未定义变量。

### B2. 组件内本地自定义属性（合规）

以下变量**不定义在 `tokens.css`**，而由组件自身声明、由状态修饰类覆写，作用域限于该组件，不构成未定义引用：

| 变量 | 声明位置 | 用途 |
|---|---|---|
| `--stock-bd` | `assets/proto.css` | 组件内部别名，由状态修饰类赋值 |
| `--stock-bg` | `assets/proto.css` | 组件内部别名，由状态修饰类赋值 |
| `--stock-fg` | `assets/proto.css` | 组件内部别名，由状态修饰类赋值 |

## C. 圆角越界

规则：圆角上限 6px；禁止 pill（`50%` 以上或 `999px`）。

| 文件 | 行 | 声明 | 问题 |
|---|---|---|---|
| _（无）_ | — | — | — |

**结果：PASS**

## D. z-index 字面值

规则：`z-index` 应引用 `--z-*`，不得直接写数字。

| 文件 | 行 | 值 |
|---|---|---|
| _（无）_ | — | — |

**结果：PASS**

## E. 色彩属性 Token 覆盖率

分母口径：只统计**必须由 Token 承载的色彩属性**——`color` / `background*` / `border*` / `box-shadow` / `outline*`；其中取值为关键字的声明（`transparent` / `none` / 无颜色的 `border`）不承载色值，从分母中剔除。

| 文件 | 色彩声明数 | 走 Token | 关键字 | 字面值 | Token 覆盖率 |
|---|---|---|---|---|---|
| `index.html` | 4 | 4 | 0 | 0 | 100% |
| `assets/proto.css` | 223 | 201 | 22 | 0 | 100% |
| `assets/tokens.css` | 0 | 0 | 0 | 0 | 100% |
| `home/index.html` | 1 | 1 | 0 | 0 | 100% |
| `inquiry/index.html` | 2 | 2 | 0 | 0 | 100% |
| `product_detail/index.html` | 34 | 31 | 3 | 0 | 100% |
| `search/index.html` | 26 | 14 | 12 | 0 | 100% |
| **合计** | **290** | **253** | **37** | **0** | **100%** |

## F. 样式表引用链

规则：`proto.css` 依赖 `tokens.css`，必须先加载 `tokens.css`。

| 文件 | tokens.css | proto.css | 顺序正确 |
|---|---|---|---|
| `index.html` | ✓ | ✓ | ✓ |
| `home/index.html` | ✓ | ✓ | ✓ |
| `inquiry/index.html` | ✓ | ✓ | ✓ |
| `product_detail/index.html` | ✓ | ✓ | ✓ |
| `search/index.html` | ✓ | ✓ | ✓ |

**结果：PASS**（5/5）

## G. Token 分层统计

三层架构：**Primitive**（原始色阶，业务代码禁用）→ **Semantic**（语义层，业务代码只用这层）→ **Component**（组件层，单一组件专用）。

| 层 | 分区 | 声明数 | 唯一名称数 |
|---|---|---|---|
| Primitive | 一、原始色阶（Primitive）——仅供语义层引用，业务代码禁止直接使用 | 25 | 25 |
| Semantic | 二、语义层 Token —— 业务代码只用这一层 | 34 | 34 |
| Semantic | 三、排版 | 35 | 35 |
| Semantic | 四、间距（4pt 基准，2pt 用于行内微调） | 21 | 21 |
| Semantic | 五、圆角（上限 6px；禁止 pill 形状） | 4 | 4 |
| Semantic | 六、描边 | 8 | 8 |
| Semantic | 七、阴影（仅浮层；数据面零阴影） | 4 | 4 |
| Semantic | 八、断点（媒体查询无法读 var()，此处为唯一事实来源，样式表数值必须一致） | 5 | 5 |
| Semantic | 九、层级（z-index） | 9 | 9 |
| Component | 十、组件级 Token | 34 | 34 |
| Semantic | 十一、数据可视化（原型暂无图表，Token 先定义，供后续复用） | 9 | 9 |

| 汇总 | 声明数 | 唯一名称数 |
|---|---|---|
| Primitive | 25 | 25 |
| Semantic | 129 | 129 |
| Component | 34 | 34 |
| **三层合计** | **188** | **188** |
| 媒体查询内重声明 | 4 | 4（不新增名称） |
| **文件内总计** | **192** | **188** |

> 口径说明：**声明数**是 `--name:` 出现的次数（同一行可写两条声明，故不等于行数）；**唯一名称数**是去重后的 Token 个数。此前版本报告的 163 是按行首统计得出的，漏掉了 11 行双声明，属统计错误，已在此更正为 **192 个声明 / 188 个唯一名称**。

### 名称清单

<details><summary><b>Primitive</b>（25 个）</summary>

- `--amber-200`
- `--amber-50`
- `--amber-700`
- `--amber-900`
- `--gray-0`
- `--gray-100`
- `--gray-200`
- `--gray-25`
- `--gray-300`
- `--gray-400`
- `--gray-50`
- `--gray-500`
- `--gray-600`
- `--gray-700`
- `--gray-800`
- `--gray-900`
- `--red-100`
- `--red-200`
- `--red-300`
- `--red-50`
- `--red-500`
- `--red-600`
- `--red-700`
- `--red-800`
- `--red-900`

</details>

<details><summary><b>Semantic</b>（129 个）</summary>

- `--border-brand`
- `--border-default`
- `--border-input`
- `--border-strong`
- `--border-subtle`
- `--bp-2xl`
- `--bp-lg`
- `--bp-md`
- `--bp-sm`
- `--bp-xl`
- `--bw-1`
- `--bw-2`
- `--color-border`
- `--color-border-input`
- `--color-border-strong`
- `--color-border-subtle`
- `--color-brand`
- `--color-brand-active`
- `--color-brand-border`
- `--color-brand-hover`
- `--color-brand-subtle`
- `--color-brand-text`
- `--color-canvas`
- `--color-danger`
- `--color-danger-border`
- `--color-danger-subtle`
- `--color-focus-ring`
- `--color-hover-row`
- `--color-neutral-status`
- `--color-overlay-scrim`
- `--color-selected-bar`
- `--color-selected-row`
- `--color-success`
- `--color-success-subtle`
- `--color-surface`
- `--color-surface-inverse`
- `--color-surface-sunken`
- `--color-text`
- `--color-text-body`
- `--color-text-disabled`
- `--color-text-inverse`
- `--color-text-inverse-dim`
- `--color-text-muted`
- `--color-warning`
- `--color-warning-border`
- `--color-warning-subtle`
- `--font-feature`
- `--font-mono`
- `--font-sans`
- `--fs-body`
- `--fs-body-lg`
- `--fs-body-sm`
- `--fs-caption`
- `--fs-display`
- `--fs-headline`
- `--fs-label`
- `--fs-label-sm`
- `--fs-title`
- `--fs-title-lg`
- `--fs-title-sm`
- `--fw-bold`
- `--fw-medium`
- `--fw-regular`
- `--fw-semibold`
- `--layout-aside`
- `--layout-gutter`
- `--layout-gutter-mobile`
- `--layout-gutter-tablet`
- `--layout-max`
- `--layout-max-narrow`
- `--layout-media`
- `--layout-sidebar`
- `--lh-body`
- `--lh-body-lg`
- `--lh-body-sm`
- `--lh-caption`
- `--lh-display`
- `--lh-headline`
- `--lh-label`
- `--lh-label-sm`
- `--lh-title`
- `--lh-title-lg`
- `--lh-title-sm`
- `--ls-normal`
- `--ls-snug`
- `--ls-tight`
- `--ls-wide`
- `--ls-wider`
- `--ls-widest`
- `--radius-md`
- `--radius-none`
- `--radius-sm`
- `--radius-xs`
- `--ring-focus`
- `--shadow-bar`
- `--shadow-modal`
- `--shadow-none`
- `--shadow-pop`
- `--sp-0`
- `--sp-1`
- `--sp-10`
- `--sp-11`
- `--sp-12`
- `--sp-2`
- `--sp-3`
- `--sp-4`
- `--sp-5`
- `--sp-6`
- `--sp-7`
- `--sp-8`
- `--sp-9`
- `--viz-axis`
- `--viz-bg`
- `--viz-grid`
- `--viz-label`
- `--viz-series-1`
- `--viz-series-2`
- `--viz-series-3`
- `--viz-series-4`
- `--viz-series-accent`
- `--z-annotation`
- `--z-base`
- `--z-drawer`
- `--z-dropdown`
- `--z-modal`
- `--z-scrim`
- `--z-sticky`
- `--z-sticky-bar`
- `--z-toast`

</details>

<details><summary><b>Component</b>（34 个）</summary>

- `--badge-px`
- `--badge-py`
- `--btn-h-md`
- `--btn-h-sm`
- `--btn-h-xs`
- `--btn-px-md`
- `--btn-px-sm`
- `--btn-px-xs`
- `--ease-standard`
- `--header-main-h`
- `--header-nav-h`
- `--header-util-h`
- `--input-h`
- `--input-px`
- `--input-py`
- `--motion-base`
- `--motion-fast`
- `--stock-eol-bd`
- `--stock-eol-bg`
- `--stock-eol-fg`
- `--stock-ico-size`
- `--stock-low-bd`
- `--stock-low-bg`
- `--stock-low-fg`
- `--stock-ok-bd`
- `--stock-ok-bg`
- `--stock-ok-fg`
- `--stock-out-bd`
- `--stock-out-bg`
- `--stock-out-fg`
- `--table-cell-px`
- `--table-head-h`
- `--table-row-h`
- `--table-row-h-roomy`

</details>

## H. 汇总

| 检查项 | 结果 | 计数 |
|---|---|---|
| A 样式声明硬编码色值 | PASS | 0 处 |
| B 未定义变量 | PASS | 0 个 |
| C 圆角越界 | PASS | 0 处 |
| D z-index 字面值 | PASS | 0 处 |
| E 色彩属性 Token 覆盖率 | INFO | 100% |
| F 引用链顺序 | PASS | 5/5 |

**5 / 5 项硬性门槛通过。**

另有两项 INFO 不计入门槛：A2 展示文字色值 **2** 处、A3 注释内色值 **4** 处。

## I. 本报告未覆盖的事项

1. **不检查对比度**。对比度为人工计算，未做工具化全量扫描。
2. **不检查渲染结果**。只验证源码引用关系，不验证浏览器实际呈现。
3. **不检查视觉一致性**。是否看起来统一需人工目视，见 `VISUAL_DIFF.md`。
4. **不检查响应式行为**。媒体查询断点数值是否与 `--bp-*` 一致仅人工核对，未脚本化。
5. **不覆盖 `seo/` 与 `admin/`**。这两个模块为第二轮提交，本轮未纳入。
6. **不检查 `data-mock` 标注数量**，见 `README.md` 的标注统计。
7. **PASS 不等于设计通过**。本报告只证明源码层面没有字面色值、没有未定义变量、没有越界圆角、没有 z-index 字面值、引用顺序正确；视觉是否统一仍须人工评审。

