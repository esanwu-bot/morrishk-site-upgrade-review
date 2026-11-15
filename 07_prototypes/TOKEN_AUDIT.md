# Token 使用检查报告

**生成时间** 2026-11-15 · **生成方式** `mysql_schema_audit/tools/check_tokens.py`（可重跑）
**扫描范围** `prototype/redesign/` 下 5 个 HTML + `assets/tokens.css` + `assets/proto.css` + `assets/proto.js`
**排除** `_legacy_v0/`（旧蓝色体系归档，不参与评审）、`_shots/`（截图与调试探针）、`seo/`、`admin/`（第二轮）

> 本报告由脚本生成，数字为扫描结果，非人工估算。重跑脚本可复现。

## A. 硬编码色值

规则：`tokens.css` 之外不得出现 `#hex` / `rgb()` / `hsl()`。

| 文件 | hex | rgb() | hsl() | 判定 |
|---|---|---|---|---|
| `index.html` | 0 | 0 | 0 | PASS |
| `home/index.html` | 0 | 0 | 0 | PASS |
| `product_detail/index.html` | 0 | 0 | 0 | PASS |
| `search/index.html` | 0 | 0 | 0 | PASS |
| `inquiry/index.html` | 0 | 0 | 0 | PASS |
| `assets/tokens.css` | 25 | 6 | 0 | PASS |
| `assets/proto.css` | 0 | 0 | 0 | PASS |
| `assets/proto.js` | 0 | 0 | 0 | PASS |

**结果：** `tokens.css` 之外共 **0** 处色值，明细见下。

### `assets/tokens.css` 内的色值（合法，仅 Primitive 层）

共 **31** 处。其中 **25** 处位于 `--red-* / --gray-* / --amber-*` 原始色阶定义行；其余为 `--color-overlay-scrim` 的 `rgba()` 与三档阴影的 `rgba()`——这两类是 Token 体系中**唯一允许保留字面值**的位置（半透明与多层阴影无法用不透明色阶表达）。

## B. 未定义变量引用

规则：`var(--x)` 中的 `--x` 必须在 `tokens.css` 中有定义。

| 变量 | 被引用文件 |
|---|---|
| _（无）_ | — |

**结果：PASS** —— 共 0 个未定义变量。

## C. 圆角越界

规则：圆角上限 6px；禁止 pill（`999px`）。媒体查询内的数值不在此列。

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

口径：只统计**必须由 Token 承载的色彩属性**——`color` / `background*` / `border*` / `box-shadow` / `outline*`。

每个声明的取值分三类：

- **Token**：`var(--*)`
- **关键字**：`transparent` / `inherit` / `currentColor` / `none` / `initial`——不构成色值，合法
- **字面值**：`#hex` / `rgb()` / `hsl()`——必须为 0

| 文件 | 色彩声明数 | 走 Token | 关键字 | 字面值 | Token 覆盖率 |
|---|---|---|---|---|---|
| `index.html` | 4 | 4 | 0 | 0 | 100% |
| `home/index.html` | 1 | 1 | 0 | 0 | 100% |
| `product_detail/index.html` | 34 | 31 | 3 | 0 | 100% |
| `search/index.html` | 26 | 14 | 12 | 0 | 100% |
| `inquiry/index.html` | 2 | 2 | 0 | 0 | 100% |
| `assets/tokens.css` | 0 | 0 | 0 | 0 | 100% |
| `assets/proto.css` | 222 | 200 | 22 | 0 | 100% |
| **合计** | **289** | **252** | **37** | **0** | **100%** |

> 分母已剔除「关键字」类声明（`transparent` / `none` / 仅写宽度与线型的 `border`），这些声明不承载色值，无需 Token 化。剩余声明中走 Token 的比例即为上表覆盖率。

## F. 样式表引用链

规则：`proto.css` 依赖 `tokens.css`，必须先加载 `tokens.css`。

| 文件 | tokens.css | proto.css | 顺序正确 |
|---|---|---|---|
| `index.html` | ✓ | ✓ | ✓ |
| `home/index.html` | ✓ | ✓ | ✓ |
| `product_detail/index.html` | ✓ | ✓ | ✓ |
| `search/index.html` | ✓ | ✓ | ✓ |
| `inquiry/index.html` | ✓ | ✓ | ✓ |

**结果：PASS**

## G. 汇总

| 检查项 | 结果 | 计数 |
|---|---|---|
| A 硬编码色值 | PASS | 0 处 |
| B 未定义变量 | PASS | 0 个 |
| C 圆角越界 | PASS | 0 处 |
| D z-index 字面值 | PASS | 0 处 |
| F 引用链顺序 | PASS | 5/5 |

**5 / 5 项通过。**

## H. 本报告未覆盖的事项

1. **不检查对比度**。文中声明的对比度数值为人工计算，未做工具化全量扫描。
2. **不检查渲染结果**。报告只验证源码中的引用关系，不验证浏览器实际呈现。
3. **不检查视觉一致性**。是否看起来统一需人工目视，见 `VISUAL_DIFF.md`。
4. **不检查响应式行为**。媒体查询断点数值是否与 `--bp-*` 一致，只做了人工核对，未脚本化。
5. **不覆盖 `seo/` 与 `admin/`**。这两个模块为第二轮提交，本轮未纳入。
6. **`data-mock` 标注数量未在此报告核对**，见 `README.md` 的标注统计。

