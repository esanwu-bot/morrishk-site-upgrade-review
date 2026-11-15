# -*- coding: utf-8 -*-
"""
CSS 取值差异比对（v1.4 字面值 → v1.5.1 Token 解析值）

用途：为 VISUAL_DIFF.md 提供"哪些属性真的变了"的可复核证据。
做法：把两版 proto.css 的每条声明解析成最终取值（各自用自己的变量作用域），
      逐条比对，输出「等价」「真实变更」两类。

用法：

    python mysql_schema_audit/tools/css_value_diff.py \
        --old <v1.4>/assets/proto.css \
        --new <v1.5.1>/assets/proto.css \
        --tokens <v1.5.1>/assets/tokens.css \
        --out  _shots/diff/CSS_VALUE_DIFF.md
"""
from __future__ import annotations

import argparse
import io
import re
import sys


def parse_rules(path):
    """解析 CSS 为 {选择器: {属性: 值}}。@media 块整体剔除（其覆盖值不属于基础态）。"""
    s = io.open(path, encoding="utf-8").read()
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    # 去掉 @media 块（含嵌套大括号）
    prev = None
    while prev != s:
        prev = s
        s = re.sub(r"@media[^{]*\{(?:[^{}]|\{[^{}]*\})*\}", "", s)
    out = {}
    for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", s):
        sel = " ".join(m.group(1).split())
        decls = {}
        for d in m.group(2).split(";"):
            if ":" in d:
                k, v = d.split(":", 1)
                decls[k.strip()] = v.strip()
        out.setdefault(sel, {}).update(decls)
    return out


def scope(*dicts):
    flat = {}
    for d in dicts:
        flat.update(d)
    return flat


def resolve(v, flat, depth=0):
    if depth > 8:
        return v
    return re.sub(r"var\(\s*(--[a-z0-9-]+)\s*\)",
                  lambda m: resolve(flat.get(m.group(1), "UNDEF(%s)" % m.group(1)), flat, depth + 1),
                  v)


HEX_SHORT = re.compile(r"#([0-9a-f])([0-9a-f])([0-9a-f])\b", re.I)


def canon(v):
    """归一化：空白、大小写、#fff→#ffffff、0→0px 这类书写差异。"""
    v = re.sub(r"\s+", " ", v).strip().lower()
    v = HEX_SHORT.sub(lambda m: "#" + m.group(1) * 2 + m.group(2) * 2 + m.group(3) * 2, v)
    v = re.sub(r"(?<![\w.])0(?![\w.%])", "0px", v)
    return v


#: 分类：颜色 / 间距 / 字号 / 圆角 / 阴影 / 层级 / 动效 / 其他
def category(prop):
    p = prop.lower()
    if any(k in p for k in ("color", "background", "border", "outline", "box-shadow", "fill", "stroke")):
        if p == "box-shadow":
            return "阴影"
        return "颜色"
    if p in ("padding", "margin", "gap", "top", "left", "right", "bottom",
             "padding-top", "padding-bottom", "padding-left", "padding-right"):
        return "间距"
    if p in ("font-size", "line-height", "letter-spacing", "font-weight", "font-feature-settings"):
        return "排版"
    if p == "border-radius":
        return "圆角"
    if p == "z-index":
        return "层级"
    if p in ("transition", "animation"):
        return "动效"
    return "其他"


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--old", required=True)
    ap.add_argument("--new", required=True)
    ap.add_argument("--tokens", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args(argv)

    A = parse_rules(args.old)
    B = parse_rules(args.new)
    T = parse_rules(args.tokens)
    flatA = scope(A.get(":root", {}))
    flatB = scope(T.get(":root", {}), B.get(":root", {}))

    rows = []
    for sel in sorted(set(A) & set(B)):
        for prop in sorted(set(A[sel]) | set(B[sel])):
            va, vb = A[sel].get(prop), B[sel].get(prop)
            if va is None:
                rows.append((sel, prop, "—", vb, "新增声明"))
                continue
            if vb is None:
                rows.append((sel, prop, va, "—", "删除声明"))
                continue
            ra, rb = resolve(va, flatA), resolve(vb, flatB)
            if canon(ra) == canon(rb):
                rows.append((sel, prop, ra, rb, "等价"))
            else:
                rows.append((sel, prop, ra, rb, "真实变更"))

    changed = [r for r in rows if r[4] != "等价"]
    only_a = sorted(set(A) - set(B))
    only_b = sorted(set(B) - set(A))

    L = []
    add = L.append
    add("# CSS 取值差异清单（v1.4 → v1.5.1）")
    add("")
    add("**生成方式** `mysql_schema_audit/tools/css_value_diff.py`，可重跑。")
    add("")
    add("做法：把两版 `proto.css` 的每条声明解析为**最终取值**（各自用自己的变量作用域，"
        "v1.4 用自身 `:root`，v1.5.1 用 `tokens.css`），再逐条比对。"
        "`@media` 块被整体剔除，避免 `prefers-contrast` 的覆盖值污染基础态。")
    add("")
    add("| 项 | 数量 |")
    add("|---|---|")
    add("| 共同选择器 | %d |" % len(set(A) & set(B)))
    add("| 仅旧版存在的选择器 | %d |" % len(only_a))
    add("| 仅新版存在的选择器 | %d |" % len(only_b))
    add("| 声明总数（共同选择器） | %d |" % len(rows))
    add("| 取值等价（仅书写差异） | %d |" % (len(rows) - len(changed)))
    add("| **真实变更** | **%d** |" % len(changed))
    add("")

    if only_a:
        add("仅旧版存在的选择器：")
        add("")
        for s in only_a:
            add("- `%s`" % s)
        add("")
    if only_b:
        add("仅新版存在的选择器：")
        add("")
        for s in only_b:
            add("- `%s`" % s)
        add("")

    add("## 真实变更明细")
    add("")
    add("按类别分组。**这些就是像素差分的来源**——不是抗锯齿，而是取值真的变了。")
    add("")
    groups = {}
    for r in changed:
        groups.setdefault(category(r[1]), []).append(r)
    order = ["颜色", "间距", "排版", "圆角", "阴影", "层级", "动效", "其他"]
    for g in order:
        if g not in groups:
            continue
        add("### %s（%d 条）" % (g, len(groups[g])))
        add("")
        add("| 选择器 | 属性 | v1.4 | v1.5.1 | 类型 |")
        add("|---|---|---|---|---|")
        for sel, prop, va, vb, why in groups[g]:
            add("| `%s` | %s | `%s` | `%s` | %s |" %
                (sel, prop, va.replace("|", "\\|"), vb.replace("|", "\\|"), why))
        add("")

    io.open(args.out, "w", encoding="utf-8", newline="\n").write("\n".join(L) + "\n")
    print("written:", args.out)
    print("decls=%d changed=%d only_old=%d only_new=%d" %
          (len(rows), len(changed), len(only_a), len(only_b)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
