# CSS 取值差异清单（v1.4 → v1.5.1）

**生成方式** `tools/css_value_diff.py`，可重跑（退出码 0 = 生成成功且分类合计自校验通过）。

做法：把两版 `proto.css` 的每条声明解析为**最终取值**（各自用自己的变量作用域，v1.4 用自身 `:root`，v1.5.1 用 `tokens.css`），再逐条比对。`@media` 块被整体剔除，避免 `prefers-contrast` 的覆盖值污染基础态。

| 项 | 数量 |
|---|---|
| 共同选择器 | 191 |
| 仅旧版存在的选择器 | 8 |
| 仅新版存在的选择器 | 17 |
| 声明总数（共同选择器） | 703 |
| 取值等价（仅书写差异） | 652 |
| **真实变更** | **51** |

仅旧版存在的选择器：

- `.chk input:focus-visible`
- `.dot`
- `.dot-off`
- `.dot-ok`
- `.dot-warn`
- `.input`
- `.num, table td.num, table th.num, .mono`
- `:root`

仅新版存在的选择器：

- `.badge-warn`
- `.input, .select`
- `.mono`
- `.num, .mono, table td.num, table th.num`
- `.stock`
- `.stock-eol`
- `.stock-ico`
- `.stock-low`
- `.stock-ok`
- `.stock-out`
- `.stock-qty`
- `.stock-txt`
- `.warn-note`
- `:focus-visible`
- `table.spec.avail .stock-txt`
- `table.spec.avail td.k`
- `table.spec.avail td.v`

## 真实变更明细

分类规则：**先判圆角**（`border-*-radius` 全族长写），再判一般 `border` 等颜色属性；否则 `border-radius` 会因含 `border` 子串被误归入颜色。**这些就是像素差分的来源**——不是抗锯齿，而是取值真的变了。

### 颜色（9 条）

| 选择器 | 属性 | v1.4 | v1.5.1 | 类型 |
|---|---|---|---|---|
| `.btn-ghost` | color | `#475569` | `#334155` | 真实变更 |
| `.bulkbar .btn-secondary` | color | `#e2e8f0` | `#CBD5E1` | 真实变更 |
| `.chk input` | border | `1.5px solid #94a3b8` | `1px solid #94A3B8` | 真实变更 |
| `.errmsg` | color | `#dc2626` | `#991B1B` | 真实变更 |
| `.hub .ai` | color | `#dc2626` | `#991B1B` | 真实变更 |
| `.input.is-error, .textarea.is-error, .select.is-error` | border-color | `#dc2626` | `#991B1B` | 真实变更 |
| `.pill-note` | color | `#7f1d1d` | `#991B1B` | 真实变更 |
| `body.annot [data-mock]` | outline | `1px dashed #f59e0b` | `1px dashed #B45309` | 真实变更 |
| `body.annot [data-mock]::after` | color | `#fef3c7` | `#FFFBEB` | 真实变更 |

### 间距（21 条）

| 选择器 | 属性 | v1.4 | v1.5.1 | 类型 |
|---|---|---|---|---|
| `.annot-legend dl` | gap | `5px 8px` | `6px 8px` | 真实变更 |
| `.bulkbar` | gap | `10px` | `12px` | 真实变更 |
| `.bulkbar` | padding | `8px 10px 8px 16px` | `8px 8px 8px 16px` | 真实变更 |
| `.card-bd` | padding | `14px` | `16px` | 真实变更 |
| `.card-hd` | padding | `10px 14px` | `8px 16px` | 真实变更 |
| `.chip` | gap | `5px` | `4px` | 真实变更 |
| `.chip` | padding | `3px 7px` | `2px 6px` | 真实变更 |
| `.chk` | gap | `7px` | `6px` | 真实变更 |
| `.facet-hd` | padding | `9px 12px` | `8px 12px` | 真实变更 |
| `.g-hero > :first-child` | padding | `32px 32px 28px` | `32px 32px 24px` | 真实变更 |
| `.g-stat4 > *` | padding | `14px 16px` | `16px` | 真实变更 |
| `.headact .badge` | padding | `0 3px` | `0 2px` | 真实变更 |
| `.hub .kbd` | padding | `1px 5px` | `1px 2px` | 真实变更 |
| `.info-note` | padding | `9px 12px` | `8px 12px` | 真实变更 |
| `.kv2 > div` | padding | `7px 0` | `6px 0` | 真实变更 |
| `.mainnav a` | padding | `0 11px` | `0 12px` | 真实变更 |
| `.pill-note` | padding | `9px 12px` | `8px 12px` | 真实变更 |
| `.pop` | padding | `10px` | `12px` | 真实变更 |
| `.proto-fab .n` | padding | `1px 5px` | `1px 2px` | 真实变更 |
| `body.annot [data-mock]::after` | padding | `1px 5px` | `1px 2px` | 真实变更 |
| `table.spec th` | padding | `7px 10px` | `6px 10px` | 真实变更 |

### 排版（8 条）

| 选择器 | 属性 | v1.4 | v1.5.1 | 类型 |
|---|---|---|---|---|
| `.annot-legend` | line-height | `17px` | `18px` | 真实变更 |
| `.btn` | letter-spacing | `.01em` | `0em` | 真实变更 |
| `.h-lg` | letter-spacing | `-.015em` | `-.01em` | 真实变更 |
| `.h-sm` | letter-spacing | `-.005em` | `0em` | 真实变更 |
| `.info-note` | line-height | `17px` | `18px` | 真实变更 |
| `.logo .sub` | letter-spacing | `.12em` | `.04em` | 真实变更 |
| `.mainnav a` | letter-spacing | `.01em` | `0em` | 真实变更 |
| `.pill-note` | line-height | `17px` | `18px` | 真实变更 |

### 圆角（1 条）

| 选择器 | 属性 | v1.4 | v1.5.1 | 类型 |
|---|---|---|---|---|
| `.headact .badge` | border-radius | `7px` | `2px` | 真实变更 |

### 阴影（4 条）

| 选择器 | 属性 | v1.4 | v1.5.1 | 类型 |
|---|---|---|---|---|
| `.annot-legend` | box-shadow | `0 10px 15px -3px rgba(15, 23, 42, .1)` | `0 10px 15px -3px rgba(15, 23, 42, .10), 0 4px 6px -4px rgba(15, 23, 42, .06)` | 真实变更 |
| `.bulkbar` | box-shadow | `0 10px 15px -3px rgba(15, 23, 42, .1)` | `0 -2px 8px -2px rgba(15, 23, 42, .12)` | 真实变更 |
| `.modal` | box-shadow | `0 10px 15px -3px rgba(15, 23, 42, .1)` | `0 10px 15px -3px rgba(15, 23, 42, .10), 0 4px 6px -4px rgba(15, 23, 42, .06)` | 真实变更 |
| `.proto-fab` | box-shadow | `0 10px 15px -3px rgba(15, 23, 42, .1)` | `0 10px 15px -3px rgba(15, 23, 42, .10), 0 4px 6px -4px rgba(15, 23, 42, .06)` | 真实变更 |

### 层级（4 条）

| 选择器 | 属性 | v1.4 | v1.5.1 | 类型 |
|---|---|---|---|---|
| `.bulkbar` | z-index | `80` | `60` | 真实变更 |
| `.pop` | z-index | `60` | `40` | 真实变更 |
| `body.annot [data-mock]::after` | z-index | `130` | `120` | 真实变更 |
| `table.grid th` | z-index | `2` | `10` | 真实变更 |

### 动效（2 条）

| 选择器 | 属性 | v1.4 | v1.5.1 | 类型 |
|---|---|---|---|---|
| `.btn` | transition | `background .12s, border-color .12s, color .12s` | `background 120ms cubic-bezier(.2, 0, .2, 1),
              border-color 120ms cubic-bezier(.2, 0, .2, 1),
              color 120ms cubic-bezier(.2, 0, .2, 1)` | 真实变更 |
| `.bulkbar` | transition | `transform .16s, opacity .16s` | `transform 180ms cubic-bezier(.2, 0, .2, 1), opacity 180ms cubic-bezier(.2, 0, .2, 1)` | 真实变更 |

### 其他（2 条）

| 选择器 | 属性 | v1.4 | v1.5.1 | 类型 |
|---|---|---|---|---|
| `.hub` | height | `36px` | `32px` | 真实变更 |
| `.select` | height | `32px` | `—` | 删除声明 |

### 分类合计校验

| 类别 | 条数 |
|---|---|
| 颜色 | 9 |
| 间距 | 21 |
| 排版 | 8 |
| 圆角 | 1 |
| 阴影 | 4 |
| 层级 | 4 |
| 动效 | 2 |
| 其他 | 2 |
| **合计** | **51** |

**校验结果**：分类合计 51 条，真实变更 51 条，一致 PASS。

