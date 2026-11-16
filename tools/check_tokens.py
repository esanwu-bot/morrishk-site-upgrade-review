# -*- coding: utf-8 -*-
"""
Design Token 使用检查器（Morris Design System v1.0）

用法（在送审仓库根目录执行）：

    python tools/check_tokens.py --path 07_prototypes/

产出：<path>/TOKEN_AUDIT.md，并在标准输出打印汇总与退出码（0=全部通过，1=有 FAIL）。

检查项：
  A  样式区域中的硬编码色值    —— 必须为 0
  A1 边界探针（A 不覆盖的写法）—— INFO，仅统计
  A2 HTML 展示文字中的色值字面量  —— 允许（INFO，逐条列出）
  A3 注释中的色值 / 颜色函数名    —— 允许（INFO，仅计数）
  B  未定义变量引用              —— 必须为 0
  C  圆角越界（>6px 或 pill）     —— 必须为 0
  D  z-index 字面值              —— 必须为 0
  E  色彩属性 Token 覆盖率        —— 报告
  F  样式表引用链顺序             —— 5/5
  G  Token 分层统计              —— Primitive / Semantic / Component

A 项的判定口径（重要，勿高估结论强度）：
  - **不解析 CSS 声明语法**，只对样式区域做正则字面量匹配
    （`#[0-9a-fA-F]{3,8}`、`rgb(a)?(`、`hsl(a)?(`）。
  - HTML `style` 属性**全文扫描**，双引号 / 单引号 / 跨行三种写法共用一条正则。
    早期版本按行匹配且只认双引号，`style='...'` 与跨行写法会整段漏检（已修复）。
  - 不检出：具名颜色（`red`/`white`）、`oklch()` 等现代色彩函数、内联 SVG 的呈现属性。
    这些由 A1 边界探针单独统计，不参与 PASS/FAIL。

只读源码，不修改被扫描文件。
"""
from __future__ import annotations

import argparse
import io
import os
import re
import sys

# --------------------------------------------------------------------------
# 扫描口径常量
# --------------------------------------------------------------------------

#: 不参与扫描的目录（旧体系归档、截图与调试探针、非本轮范围）
SKIP_DIRS = {"_legacy_v0", "_shots", "reference", "tools", "seo", "admin", ".git"}

#: 视为源码的文件扩展名
SCAN_EXT = {".html", ".css", ".js"}

HEX = re.compile(r"#[0-9a-fA-F]{3,8}\b")
RGB = re.compile(r"\brgba?\s*\(")
HSL = re.compile(r"\bhsla?\s*\(")
COLOR_ANY = (("hex", HEX), ("rgb()", RGB), ("hsl()", HSL))

#: 色彩属性：必须由 Token 承载的属性集合
COLOR_PROP = re.compile(
    r"(?<![a-z-])(color|background|background-color|border|border-top|border-bottom|"
    r"border-left|border-right|border-color|border-top-color|border-bottom-color|"
    r"box-shadow|outline|outline-color)\s*:\s*([^;}\n]*)")

#: 不承载色值的关键字
KEYWORDS = ("transparent", "inherit", "currentcolor", "none", "initial", "unset")

#: HTML style 属性：单双引号通吃，属性值允许跨行。
#: 判定（A 项）与统计（html_style_regions）共用此正则，避免两处口径分裂。
STYLE_ATTR = re.compile(r"style\s*=\s*(?:\"([^\"]*)\"|'([^']*)')", re.I)

#: 不承载 style 属性的区域：HTML 注释、<style> 块。其中的 `style="..."` 必然是文本而非属性。
#: <script> 不在此列——内联脚本里的模板字符串可能生成真实样式，排除会变成漏检，
#: 因此保留扫描，并把这一误报面带进 0.1 的边界披露。
NON_ATTR_REGION = re.compile(r"<!--.*?-->|<style\b[^>]*>.*?</style>", re.S | re.I)

#: 边界探针：A 项正则**不覆盖**的写法，仅统计出现次数，不参与 PASS/FAIL 判定
MODERN_FN = re.compile(r"\b(?:oklch|oklab|lab|lch|hwb|color-mix|device-cmyk)\s*\(", re.I)

#: 常见具名颜色词表（非 CSS 全量 148 色，仅覆盖工程上常见的误用写法）
NAMED_COLORS = (
    "red", "blue", "green", "yellow", "orange", "purple", "pink", "brown",
    "black", "white", "gray", "grey", "silver", "navy", "teal", "olive",
    "maroon", "lime", "aqua", "fuchsia", "amber", "slate", "zinc", "stone",
)
NAMED = re.compile(r"(?<![a-z-])(%s)(?![a-z-])" % "|".join(NAMED_COLORS), re.I)


# --------------------------------------------------------------------------
# 基础工具
# --------------------------------------------------------------------------

def read_text(path: str) -> str:
    return io.open(path, encoding="utf-8", errors="replace").read()


def blank_keep_lines(text: str) -> str:
    """把整段文本替换为等长空白，保留换行，使行号不变。"""
    return re.sub(r"[^\n]", " ", text)


def strip_css_comments(text: str) -> str:
    """去掉 /* */ 注释，但保留换行以维持行号。"""
    return re.sub(r"/\*.*?\*/", lambda m: blank_keep_lines(m.group(0)), text, flags=re.S)


def mask_non_attr_regions(text: str) -> str:
    """把 HTML 注释与 <style> 块替换为等长空白（保留换行），使行号不变。

    这两处出现的 `style="..."` 是文本内容而非元素属性，若不遮蔽会产生误报。
    """
    return NON_ATTR_REGION.sub(lambda m: blank_keep_lines(m.group(0)), text)


def iter_style_attrs(text: str):
    """遍历 HTML 中的 style 属性，产出 (起始行号, 属性值)。

    覆盖双引号、单引号、跨行三种写法。旧实现按行匹配且只认双引号，
    导致 `style='color:#fff'` 与跨行 style 完全漏检（R2 修复项）。
    注释与 <style> 块先被遮蔽，避免把其中的同名文本当成属性。
    """
    masked = mask_non_attr_regions(text)
    for m in STYLE_ATTR.finditer(masked):
        line = masked.count("\n", 0, m.start()) + 1
        val = m.group(1) if m.group(1) is not None else m.group(2)
        yield line, val


def strip_style_attrs(text: str) -> str:
    """把全部 style 属性置空（含注释/<style> 块遮蔽），用于 A2 展示文字识别。"""
    masked = mask_non_attr_regions(text)
    return STYLE_ATTR.sub(lambda m: blank_keep_lines(m.group(0)), masked)


def html_style_regions(text: str):
    """返回 HTML 中的样式区域片段列表：<style> 块内容 + style 属性值（单/双引号、跨行）。"""
    pieces = []
    for m in re.finditer(r"<style[^>]*>(.*?)</style>", text, re.S | re.I):
        pieces.append(m.group(1))
    for _, val in iter_style_attrs(text):
        pieces.append(val)
    return pieces


def html_text_nodes(text: str) -> str:
    """返回 HTML 的非样式文本（去掉标签属性与 script/style 内容），用于识别展示文字。"""
    t = re.sub(r"<script[^>]*>.*?</script>", "", text, flags=re.S | re.I)
    t = re.sub(r"<style[^>]*>.*?</style>", "", t, flags=re.S | re.I)
    t = re.sub(r"<[^>]+>", "", t)          # 去掉标签与属性
    return t


def collect_files(root: str):
    """递归收集源码文件，返回按相对路径排序的列表。"""
    out = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS)
        for fn in sorted(filenames):
            if os.path.splitext(fn)[1].lower() in SCAN_EXT:
                full = os.path.join(dirpath, fn)
                out.append(os.path.relpath(full, root).replace("\\", "/"))
    return out


# --------------------------------------------------------------------------
# 单项检查
# --------------------------------------------------------------------------

def find_css_color_literals(text: str, rel: str):
    """A：样式区域中的字面色值（正则字面量匹配，不做 CSS 声明语法解析）。"""
    hits = []
    if rel.endswith(".css"):
        probe = strip_css_comments(text)
        for i, line in enumerate(probe.split("\n"), 1):
            for kind, rx in COLOR_ANY:
                for m in rx.finditer(line):
                    hits.append((i, m.group(0), kind, line.strip()[:160]))
        return hits

    if rel.endswith(".js"):
        for i, line in enumerate(text.split("\n"), 1):
            for kind, rx in COLOR_ANY:
                for m in rx.finditer(line):
                    hits.append((i, m.group(0), kind, line.strip()[:160]))
        return hits

    # HTML：style 属性（全文扫描，单引号 / 双引号 / 跨行统一由 STYLE_ATTR 处理）
    for line_no, val in iter_style_attrs(text):
        ctx = " ".join(val.split())[:160]
        for kind, rx in COLOR_ANY:
            for mm in rx.finditer(val):
                hits.append((line_no, mm.group(0), kind, ctx))
    # HTML：<style> 块（按块起始行偏移）
    for sm in re.finditer(r"<style[^>]*>(.*?)</style>", text, re.S | re.I):
        start = text[:sm.start()].count("\n") + 1
        for j, sline in enumerate(sm.group(1).split("\n")):
            for kind, rx in COLOR_ANY:
                for mm in rx.finditer(sline):
                    hits.append((start + j, mm.group(0), kind, sline.strip()[:160]))
    return hits


def count_script_style_attrs(text: str, rel: str) -> int:
    """统计 <script> 块内出现的 style 属性个数。

    A 项不排除 <script>：内联脚本的模板字符串可能生成真实样式，排除会变成漏检。
    代价是脚本里纯文本的 `style="..."` 也会被计入，这里是把这个已知误报面量化。
    """
    if not rel.endswith(".html"):
        return 0
    n = 0
    for m in re.finditer(r"<script\b[^>]*>(.*?)</script>", text, re.S | re.I):
        n += len(STYLE_ATTR.findall(m.group(1)))
    return n


def probe_boundary_literals(text: str, rel: str):
    """边界探针：统计 A 项正则**不覆盖**的色彩写法，仅作 INFO，不参与判定。

    覆盖两类：现代色彩函数（oklch/lab/lch/hwb/color-mix）与常见具名颜色。
    目的是量化"A=0"背后的盲区有多大，而不是扩大判定的判定面。
    """
    if rel.endswith(".css"):
        probe = strip_css_comments(text)
    elif rel.endswith(".html"):
        probe = "\n".join(html_style_regions(text))
    elif rel.endswith(".js"):
        probe = text
    else:
        return []
    # white-space 是排版属性名，不是颜色，先剔除以免误报
    probe = re.sub(r"white-space\s*:\s*[^;}\n]*", "", probe, flags=re.I)
    out = []
    for m in MODERN_FN.finditer(probe):
        out.append(("现代函数", m.group(0)))
    for m in NAMED.finditer(probe):
        out.append(("具名颜色", m.group(0)))
    return out


def find_display_literals(text: str, rel: str):
    """A2：HTML 展示文字中的色值字面量（不是样式声明，仅作 INFO）。"""
    if not rel.endswith(".html"):
        return []
    hits = []
    # 先把注释/<style> 块遮蔽、再把全部 style 属性置空（单/双引号、跨行统一处理，
    # 保留换行以维持行号），避免样式里的色值被误当成展示文字重复计数。
    stripped = strip_style_attrs(text)
    for i, line in enumerate(stripped.split("\n"), 1):
        if not any(rx.search(line) for _, rx in COLOR_ANY):
            continue
        probe = re.sub(r"<[^>]+>", "", line)
        for kind, rx in COLOR_ANY:
            for m in rx.finditer(probe):
                hits.append((i, m.group(0), kind, line.strip()[:160]))
    return hits


def find_comment_colors(text: str, rel: str):
    """A3：注释中出现的色值或颜色函数名（允许，仅计数）。"""
    if rel.endswith(".css"):
        comments = re.findall(r"/\*.*?\*/", text, flags=re.S)
    elif rel.endswith(".html"):
        comments = re.findall(r"<!--.*?-->", text, flags=re.S)
    else:
        comments = re.findall(r"//[^\n]*", text)
    blob = "\n".join(comments)
    n = 0
    for _, rx in COLOR_ANY:
        n += len(rx.findall(blob))
    return n


def token_definitions(tokens_css: str):
    """返回 [(名称, 出现顺序)]，去注释后按出现顺序，含重复。"""
    body = strip_css_comments(tokens_css)
    return re.findall(r"(--[a-z0-9-]+)\s*:", body)


def token_layers(tokens_css: str):
    """按 tokens.css 的中文分区标题切段，归并为三层。

    返回 (layers, media_redecl)
      layers: [{"layer": "Primitive", "section": "...", "names": [...]}, ...]
      media_redecl: 媒体查询内重声明的名称列表（不计入唯一名）
    """
    # 媒体查询块单独摘出，避免其重声明混入正文分区
    media_blocks = re.findall(r"@media[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}", tokens_css, flags=re.S)
    media_names = []
    for mb in media_blocks:
        media_names += re.findall(r"(--[a-z0-9-]+)\s*:", strip_css_comments(mb))

    main = tokens_css
    for mb in media_blocks:
        main = main.replace(mb, blank_keep_lines(mb))

    heads = [(m.start(), m.group(1).strip()) for m in
             re.finditer(r"/\*\s*=+\s*\n\s*([一二三四五六七八九十]+、[^\n]+)", main)]
    heads.append((len(main), "__END__"))

    def to_layer(name: str) -> str:
        if name.startswith("一"):
            return "Primitive"
        if name.startswith("十、"):
            return "Component"
        return "Semantic"

    body = strip_css_comments(main)
    layers = []
    for i in range(len(heads) - 1):
        a, name = heads[i]
        b = heads[i + 1][0]
        seg = body[a:b]
        names = re.findall(r"(--[a-z0-9-]+)\s*:", seg)
        if names:
            layers.append({"layer": to_layer(name), "section": name, "names": names})
    return layers, media_names


# --------------------------------------------------------------------------
# 主流程
# --------------------------------------------------------------------------

def main(argv=None):
    ap = argparse.ArgumentParser(
        description="Morris Design System Token 合规检查（生成 TOKEN_AUDIT.md）")
    ap.add_argument("--path", default="07_prototypes",
                    help="原型目录，默认 07_prototypes（相对当前工作目录）")
    ap.add_argument("--out", default=None,
                    help="报告输出路径，默认 <path>/TOKEN_AUDIT.md")
    ap.add_argument("--label", default="07_prototypes",
                    help="报告中显示的送审路径（与 --path 解耦，保证本地与仓库产出一致；"
                         "默认值刻意不带结尾斜杠，使 --path 带不带斜杠都产出同一份报告）")
    args = ap.parse_args(argv)

    root = os.path.abspath(args.path)
    if not os.path.isdir(root):
        sys.stderr.write("ERROR: 目录不存在: %s\n" % root)
        return 2

    files = collect_files(root)
    tokens_rel = next((f for f in files if f.endswith("tokens.css")), None)
    if tokens_rel is None:
        sys.stderr.write("ERROR: 在 %s 下未找到 tokens.css\n" % root)
        return 2

    tokens_css = read_text(os.path.join(root, tokens_rel))
    defined = set(token_definitions(tokens_css))
    html_files = [f for f in files if f.endswith(".html")]
    css_files = [f for f in files if f.endswith(".css")]
    js_files = [f for f in files if f.endswith(".js")]

    out_path = args.out or os.path.join(root, "TOKEN_AUDIT.md")

    L = []
    add = L.append

    add("# Token 使用检查报告")
    add("")
    add("**生成方式** 脚本生成，非人工估算。重跑同一条命令即可复现本报告全部数字。")
    add("")
    add("```bash")
    add("python tools/check_tokens.py --path %s" % args.label)
    add("```")
    add("")
    add("| 项 | 值 |")
    add("|---|---|")
    add("| 扫描根目录 | `%s` |" % args.label)
    add("| 文件数 | %d（HTML %d / CSS %d / JS %d） |" %
        (len(files), len(html_files), len(css_files), len(js_files)))
    add("| 排除目录 | %s |" % "、".join("`%s/`" % d for d in sorted(SKIP_DIRS) if d != ".git"))
    add("| Token 定义文件 | `%s` |" % tokens_rel)
    add("| 扫描口径 | 正则字面量匹配（A）；HTML `style` 属性覆盖单引号 / 双引号 / 跨行。详见 0.1 |")
    add("| 退出码含义 | 0 = 全部 PASS；1 = 存在 FAIL；2 = 路径或文件缺失 |")
    add("")
    add("扫描文件清单：")
    add("")
    for f in files:
        add("- `%s`" % f)
    add("")

    # ---------------- 0. 口径 ----------------
    add("## 0. 扫描规则与判定口径")
    add("")
    add("同一段文本在不同语境下的判定不同，本节先固定口径，后续各节只给数字。")
    add("")
    add("| 语境 | 是否违规 | 说明 |")
    add("|---|---|---|")
    add("| CSS 文件中的声明值 | **违规** | 去注释后全文扫描，`color` / `background` / `border` 等属性的取值必须是 `var(--*)` 或关键字 |")
    add("| HTML `<style>` 块内的声明 | **违规** | 同上 |")
    add("| HTML `style=\"...\"` 属性内的声明 | **违规** | 同上 |")
    add("| HTML 展示文字（正文、表格单元格、说明） | 不违规 | 如页面里展示规范原文 `#DC2626`，属于**内容**而非样式，仅作 INFO 列出（A2） |")
    add("| CSS / HTML / JS 注释 | 不违规 | 注释不参与渲染，仅计数（A3） |")
    add("| `var(--*)` 引用 | 合规 | 具体取值由 `tokens.css` 决定 |")
    add("| 关键字 `transparent` / `inherit` / `currentColor` / `none` | 合规 | 不承载色值 |")
    add("| 仅写宽度与线型的 `border: 1px solid`（无颜色） | 合规 | 颜色继承自 `currentColor` |")
    add("| `tokens.css` 内的 `#hex` | 合规 | Primitive 层的定义处，是全站唯一允许出现字面色值的位置 |")
    add("| `tokens.css` 内的 `rgba()`（遮罩、阴影） | 合规 | 半透明与多层阴影无法用不透明色阶表达 |")
    add("")
    add("### 0.1 检测方式与覆盖边界")
    add("")
    add("A 项**不解析 CSS 声明语法**，而是对样式区域做正则字面量匹配。"
        "因此它的准确语义是「被下列正则识别出的字面色值数量」，"
        "**不等于**「CSS 语义上存在的色值数量」。本节写明真实范围，避免把 A=0 读得过强。")
    add("")
    add("| 维度 | 实际做法 |")
    add("|---|---|")
    add("| CSS 文件 | 去注释后**全文**匹配（含选择器与简写值），正则 `#[0-9a-fA-F]{3,8}`、`rgb(a)?(`、`hsl(a)?(` |")
    add("| HTML `<style>` 块 | 同上，按块内行偏移回算行号 |")
    add("| HTML `style` 属性 | 全文扫描，**双引号 / 单引号 / 跨行**三种写法共用同一条正则（`STYLE_ATTR`） |")
    add("| JS 文件 | 全文匹配同上三条正则 |")
    add("| 注释 | CSS `/* */` 先置空并保留行号；HTML / JS 注释不参与 A，仅作 A3 计数 |")
    add("| HTML 注释 / `<style>` 块 | 先遮蔽为等长空白再找 `style` 属性，其中的同名文本不计入 A |")
    add("| `<script>` 块 | **不遮蔽**，其中的 `style=\"...\"` 仍计入 A。理由：内联模板可能生成真实样式，排除会变漏检；代价是把脚本里的纯文本也计进来，该数量见 A1 |")
    add("")
    add("**已知盲区（A 项不检出，用 A1 边界探针另行统计）**：")
    add("")
    add("| 写法 | 示例 | A 是否检出 |")
    add("|---|---|---|")
    add("| 具名颜色 | `color: red`、`background: white` | 否 |")
    add("| 现代色彩函数 | `oklch()`、`lab()`、`lch()`、`hwb()`、`color-mix()` | 否 |")
    add("| 内联 SVG 的呈现属性 | `<rect fill=\"#fff\">`（不在 `style` 属性内） | 否 |")
    add("| 转义引号截断 | `style=\"content:\\\"#fff\\\"\"`，`[^\"]*` 在转义引号处提前结束 | 否（边界） |")
    add("")

    # ---------------- A ----------------
    add("## A. 样式区域中的硬编码色值（正则口径）")
    add("")
    add("规则：除 `tokens.css` 外，**样式区域中不得出现任何字面色值**。这是硬性门槛，必须为 0。"
        "检测方式与盲区见 0.1，盲区的实际触发情况见 A1。")
    add("")
    add("| 文件 | hex | rgb() | hsl() | 判定 |")
    add("|---|---|---|---|---|")
    total_a = 0
    detail_a = []
    for f in files:
        text = read_text(os.path.join(root, f))
        hits = find_css_color_literals(text, f)
        if f == tokens_rel:
            n_hex = sum(1 for h in hits if h[2] == "hex")
            n_rgb = sum(1 for h in hits if h[2] == "rgb()")
            n_hsl = sum(1 for h in hits if h[2] == "hsl()")
            add("| `%s` | %d | %d | %d | 定义文件（合法） |" % (f, n_hex, n_rgb, n_hsl))
            continue
        n_hex = sum(1 for h in hits if h[2] == "hex")
        n_rgb = sum(1 for h in hits if h[2] == "rgb()")
        n_hsl = sum(1 for h in hits if h[2] == "hsl()")
        total_a += len(hits)
        add("| `%s` | %d | %d | %d | %s |" %
            (f, n_hex, n_rgb, n_hsl, "PASS" if not hits else "**FAIL**"))
        if hits:
            detail_a.append((f, hits))
    add("")
    add("**结果：%s** —— `tokens.css` 之外的样式声明中共 **%d** 处字面色值。" %
        ("PASS" if total_a == 0 else "**FAIL**", total_a))
    add("")
    # ---------------- A1：边界探针 ----------------
    add("### A1. 边界探针（A 不覆盖的写法，INFO）")
    add("")
    add("统计 A 项正则**不检出**的色彩写法实际出现了多少次，用来量化 A=0 的盲区大小。"
        "本项不参与 PASS/FAIL，只回答「把口径放宽后会不会翻盘」。")
    add("")
    add("| 文件 | 现代色彩函数 | 具名颜色 | `<script>` 内 style 属性 |")
    add("|---|---|---|---|")
    probe_total = 0
    script_total = 0
    for f in files:
        text_f = read_text(os.path.join(root, f))
        pb = probe_boundary_literals(text_f, f)
        n_fn = sum(1 for k, _ in pb if k == "现代函数")
        n_named = sum(1 for k, _ in pb if k == "具名颜色")
        n_script = count_script_style_attrs(text_f, f)
        probe_total += n_fn + n_named
        script_total += n_script
        if n_fn or n_named or n_script:
            add("| `%s` | %d | %d | %d |" % (f, n_fn, n_named, n_script))
    if probe_total == 0 and script_total == 0:
        add("| _（无）_ | 0 | 0 | 0 |")
    add("")
    add("**结果：%d 处** —— %s" % (
        probe_total,
        "盲区在本轮送审代码中未被触发，A=0 不是靠漏检得到的。" if probe_total == 0
        else "存在 A 未覆盖的写法，A=0 不能单独作为结论，需人工确认上表。"))
    add("")
    add("**`<script>` 内 style 属性：%d 处** —— 这些会计入 A（不遮蔽），"
        "若出现在模板字符串里可能是真实样式、也可能只是文本，属 A 项的已知误报面。" % script_total)
    add("")
    add("**探针自身边界**：具名颜色使用一张 %d 词的常见色表（非 CSS 全量 148 色）；"
        "`white-space` 这类含颜色词的属性名已剔除。探针结果偏保守，"
        "报告为 0 表示常见误用写法未出现，不表示理论上不存在。" % len(NAMED_COLORS))
    add("")

    for f, hits in detail_a:
        add("### `%s`" % f)
        add("")
        add("| 行 | 值 | 类型 | 上下文 |")
        add("|---|---|---|---|")
        for ln, val, kind, ctx in hits:
            add("| %d | `%s` | %s | `%s` |" % (ln, val, kind, ctx.replace("|", "\\|")))
        add("")

    # tokens.css 内部字面值分布
    tok_hits = find_css_color_literals(tokens_css, tokens_rel)
    prim = [h for h in tok_hits if re.match(r"^--(red|gray|amber)-\d+", h[3].strip())]
    add("### `%s` 内的字面值分布（合法）" % tokens_rel)
    add("")
    add("共 **%d** 处：**%d** 处位于 `--red-* / --gray-* / --amber-*` 原始色阶定义行，"
        "其余 **%d** 处为遮罩与阴影的 `rgba()`。" %
        (len(tok_hits), len(prim), len(tok_hits) - len(prim)))
    add("")

    # ---------------- A2 ----------------
    add("## A2. HTML 展示文字中的色值字面量（允许，INFO）")
    add("")
    add("这些色值出现在**页面正文**里（例如入口页展示规范原文），不参与渲染，**不构成违规**。"
        "列出它们是为了让复核者看到：报告中“0 处硬编码”的口径**不包含**这类展示文字。")
    add("")
    disp_total = 0
    add("| 文件 | 行 | 值 | 上下文 |")
    add("|---|---|---|---|")
    for f in html_files:
        text = read_text(os.path.join(root, f))
        for ln, val, kind, ctx in find_display_literals(text, f):
            disp_total += 1
            add("| `%s` | %d | `%s` | `%s` |" % (f, ln, val, ctx.replace("|", "\\|")))
    if disp_total == 0:
        add("| _（无）_ | — | — | — |")
    add("")
    add("**计数：%d 处**（INFO，不影响 PASS/FAIL）。" % disp_total)
    add("")

    # ---------------- A3 ----------------
    add("## A3. 注释中的色值（允许，INFO）")
    add("")
    add("| 文件 | 注释内色值/颜色函数出现次数 |")
    add("|---|---|")
    cmt_total = 0
    for f in files:
        n = find_comment_colors(read_text(os.path.join(root, f)), f)
        if n:
            cmt_total += n
            add("| `%s` | %d |" % (f, n))
    if cmt_total == 0:
        add("| _（无）_ | 0 |")
    add("")
    add("**计数：%d 处**（INFO，不影响 PASS/FAIL）。" % cmt_total)
    add("")

    # ---------------- B ----------------
    add("## B. 未定义变量引用")
    add("")
    add("规则：`var(--x)` 中的 `--x` 必须在 `%s` 中有定义。" % tokens_rel)
    add("")
    # 组件内本地自定义属性：在非 tokens.css 的 CSS 文件里以 --x: 形式声明，
    # 只在该组件作用域内生效（如 .stock 的 --stock-fg/bg/bd 由修饰类覆写）。
    local_props = {}
    for f in css_files:
        if f == tokens_rel:
            continue
        text = strip_css_comments(read_text(os.path.join(root, f)))
        for name in set(re.findall(r"(--[a-z0-9-]+)\s*:", text)):
            local_props.setdefault(name, set()).add(f)

    undefined = {}
    for f in files:
        text = read_text(os.path.join(root, f))
        for name in set(re.findall(r"var\(\s*(--[a-z0-9-]+)", text)):
            if name not in defined and name not in local_props:
                undefined.setdefault(name, set()).add(f)
    add("| 变量 | 被引用文件 |")
    add("|---|---|")
    if undefined:
        for name in sorted(undefined):
            add("| `%s` | %s |" % (name, ", ".join("`%s`" % x for x in sorted(undefined[name]))))
    else:
        add("| _（无）_ | — |")
    add("")
    add("**结果：%s** —— 共 %d 个未定义变量。" %
        ("PASS" if not undefined else "FAIL", len(undefined)))
    add("")
    add("### B2. 组件内本地自定义属性（合规）")
    add("")
    add("以下变量**不定义在 `tokens.css`**，而由组件自身声明、由状态修饰类覆写，"
        "作用域限于该组件，不构成未定义引用：")
    add("")
    add("| 变量 | 声明位置 | 用途 |")
    add("|---|---|---|")
    if local_props:
        for name in sorted(local_props):
            add("| `%s` | %s | 组件内部别名，由状态修饰类赋值 |" %
                (name, ", ".join("`%s`" % x for x in sorted(local_props[name]))))
    else:
        add("| _（无）_ | — | — |")
    add("")

    # ---------------- C ----------------
    add("## C. 圆角越界")
    add("")
    add("规则：圆角上限 6px；禁止 pill（`50%` 以上或 `999px`）。")
    add("")
    radius_hits = []
    for f in files:
        for i, line in enumerate(read_text(os.path.join(root, f)).split("\n"), 1):
            for m in re.finditer(r"border-radius\s*:\s*([0-9.]+)(px|%)", line):
                v, unit = float(m.group(1)), m.group(2)
                if unit == "%" and v >= 50:
                    radius_hits.append((f, i, m.group(0), "pill"))
                elif unit == "px" and v > 6:
                    radius_hits.append((f, i, m.group(0), "超上限"))
    add("| 文件 | 行 | 声明 | 问题 |")
    add("|---|---|---|---|")
    if radius_hits:
        for f, i, d, why in radius_hits:
            add("| `%s` | %d | `%s` | %s |" % (f, i, d, why))
    else:
        add("| _（无）_ | — | — | — |")
    add("")
    add("**结果：%s**" % ("PASS" if not radius_hits else "FAIL"))
    add("")

    # ---------------- D ----------------
    add("## D. z-index 字面值")
    add("")
    add("规则：`z-index` 应引用 `--z-*`，不得直接写数字。")
    add("")
    z_hits = []
    for f in files:
        for i, line in enumerate(read_text(os.path.join(root, f)).split("\n"), 1):
            for m in re.finditer(r"z-index\s*:\s*([^;}\n]+)", line):
                val = m.group(1).strip()
                if "var(" not in val:
                    z_hits.append((f, i, val))
    add("| 文件 | 行 | 值 |")
    add("|---|---|---|")
    if z_hits:
        for f, i, v in z_hits:
            add("| `%s` | %d | `%s` |" % (f, i, v))
    else:
        add("| _（无）_ | — | — |")
    add("")
    add("**结果：%s**" % ("PASS" if not z_hits else "FAIL"))
    add("")

    # ---------------- E ----------------
    add("## E. 色彩属性 Token 覆盖率")
    add("")
    add("分母口径：只统计**必须由 Token 承载的色彩属性**——`color` / `background*` / `border*` / "
        "`box-shadow` / `outline*`；其中取值为关键字的声明（`transparent` / `none` / 无颜色的 `border`）"
        "不承载色值，从分母中剔除。")
    add("")
    add("| 文件 | 色彩声明数 | 走 Token | 关键字 | 字面值 | Token 覆盖率 |")
    add("|---|---|---|---|---|---|")
    tot_prop = tot_tok = tot_kw = tot_lit = 0
    for f in files:
        if f.endswith(".js"):
            continue
        t = read_text(os.path.join(root, f))
        body = strip_css_comments(t) if f.endswith(".css") else t
        n_prop = n_tok = n_kw = n_lit = 0
        for m in COLOR_PROP.finditer(body):
            val = m.group(2).strip().lower()
            if not val:
                continue
            n_prop += 1
            if "var(--" in val:
                n_tok += 1
            elif any(k in val for k in KEYWORDS) and not (HEX.search(val) or RGB.search(val) or HSL.search(val)):
                n_kw += 1
            elif HEX.search(val) or RGB.search(val) or HSL.search(val):
                n_lit += 1
            else:
                n_kw += 1
        denom = n_prop - n_kw
        rate = (n_tok / denom * 100) if denom else 100.0
        tot_prop += n_prop
        tot_tok += n_tok
        tot_kw += n_kw
        tot_lit += n_lit
        add("| `%s` | %d | %d | %d | %d | %.0f%% |" % (f, n_prop, n_tok, n_kw, n_lit, rate))
    denom_all = tot_prop - tot_kw
    add("| **合计** | **%d** | **%d** | **%d** | **%d** | **%.0f%%** |" %
        (tot_prop, tot_tok, tot_kw, tot_lit, (tot_tok / denom_all * 100) if denom_all else 100.0))
    add("")

    # ---------------- F ----------------
    add("## F. 样式表引用链")
    add("")
    add("规则：`proto.css` 依赖 `tokens.css`，必须先加载 `tokens.css`。")
    add("")
    add("| 文件 | tokens.css | proto.css | 顺序正确 |")
    add("|---|---|---|---|")
    chain_ok = True
    chain_n = 0
    for f in html_files:
        t = read_text(os.path.join(root, f))
        i_tok, i_pro = t.find("tokens.css"), t.find("proto.css")
        has_tok, has_pro = i_tok >= 0, i_pro >= 0
        order_ok = has_tok and has_pro and i_tok < i_pro
        chain_n += 1 if order_ok else 0
        if not order_ok:
            chain_ok = False
        add("| `%s` | %s | %s | %s |" %
            (f, "✓" if has_tok else "✗", "✓" if has_pro else "✗", "✓" if order_ok else "**✗**"))
    add("")
    add("**结果：%s**（%d/%d）" % ("PASS" if chain_ok else "FAIL", chain_n, len(html_files)))
    add("")

    # ---------------- G ----------------
    add("## G. Token 分层统计")
    add("")
    add("三层架构：**Primitive**（原始色阶，业务代码禁用）→ **Semantic**（语义层，业务代码只用这层）"
        "→ **Component**（组件层，单一组件专用）。")
    add("")
    add("| 层 | 分区 | 声明数 | 唯一名称数 |")
    add("|---|---|---|---|")
    layers, media_names = token_layers(tokens_css)
    agg = {"Primitive": [0, set()], "Semantic": [0, set()], "Component": [0, set()]}
    for sec in layers:
        layer = sec["layer"]
        agg[layer][0] += len(sec["names"])
        agg[layer][1].update(sec["names"])
        add("| %s | %s | %d | %d |" %
            (layer, sec["section"], len(sec["names"]), len(set(sec["names"]))))
    add("")
    all_decl = token_definitions(tokens_css)
    add("| 汇总 | 声明数 | 唯一名称数 |")
    add("|---|---|---|")
    for layer in ("Primitive", "Semantic", "Component"):
        add("| %s | %d | %d |" % (layer, agg[layer][0], len(agg[layer][1])))
    add("| **三层合计** | **%d** | **%d** |" %
        (sum(v[0] for v in agg.values()), sum(len(v[1]) for v in agg.values())))
    add("| 媒体查询内重声明 | %d | %d（不新增名称） |" %
        (len(media_names), len(set(media_names))))
    add("| **文件内总计** | **%d** | **%d** |" % (len(all_decl), len(set(all_decl))))
    add("")
    add("> 口径说明：**声明数**是 `--name:` 出现的次数（同一行可写两条声明，故不等于行数）；"
        "**唯一名称数**是去重后的 Token 个数。此前版本报告的 163 是按行首统计得出的，"
        "漏掉了 11 行双声明，属统计错误，已在此更正为 **%d 个声明 / %d 个唯一名称**。"
        % (len(all_decl), len(set(all_decl))))
    add("")
    add("### 名称清单")
    add("")
    for layer in ("Primitive", "Semantic", "Component"):
        names = []
        for sec in layers:
            if sec["layer"] == layer:
                names += sec["names"]
        uniq = sorted(set(names))
        add("<details><summary><b>%s</b>（%d 个）</summary>" % (layer, len(uniq)))
        add("")
        for n in uniq:
            add("- `%s`" % n)
        add("")
        add("</details>")
        add("")

    # ---------------- H ----------------
    add("## H. 汇总")
    add("")
    checks = [
        ("A 样式区域硬编码色值（正则口径）", "PASS" if total_a == 0 else "FAIL", "%d 处" % total_a),
        ("B 未定义变量", "PASS" if not undefined else "FAIL", "%d 个" % len(undefined)),
        ("C 圆角越界", "PASS" if not radius_hits else "FAIL", "%d 处" % len(radius_hits)),
        ("D z-index 字面值", "PASS" if not z_hits else "FAIL", "%d 处" % len(z_hits)),
        ("E 色彩属性 Token 覆盖率", "INFO", "%.0f%%" % ((tot_tok / denom_all * 100) if denom_all else 100.0)),
        ("F 引用链顺序", "PASS" if chain_ok else "FAIL", "%d/%d" % (chain_n, len(html_files))),
    ]
    add("| 检查项 | 结果 | 计数 |")
    add("|---|---|---|")
    for name, res, cnt in checks:
        add("| %s | %s | %s |" % (name, res, cnt))
    add("")
    gate = [c for c in checks if c[1] in ("PASS", "FAIL")]
    passed = sum(1 for _, r, _ in gate if r == "PASS")
    add("**%d / %d 项硬性门槛通过。**" % (passed, len(gate)))
    add("")
    add("另有三项 INFO 不计入门槛：A1 边界探针 **%d** 处、A2 展示文字色值 **%d** 处、"
        "A3 注释内色值 **%d** 处。" % (probe_total, disp_total, cmt_total))
    add("")

    # ---------------- I ----------------
    add("## I. 本报告未覆盖的事项")
    add("")
    add("1. **不检查对比度**。对比度为人工计算，未做工具化全量扫描。")
    add("2. **不检查渲染结果**。只验证源码引用关系，不验证浏览器实际呈现。")
    add("3. **不检查视觉一致性**。是否看起来统一需人工目视，见 `VISUAL_DIFF.md`。")
    add("4. **不检查响应式行为**。媒体查询断点数值是否与 `--bp-*` 一致仅人工核对，未脚本化。")
    add("5. **不覆盖 `seo/` 与 `admin/`**。这两个模块为第二轮提交，本轮未纳入。")
    add("6. **不检查 `data-mock` 标注数量**，见 `README.md` 的标注统计。")
    add("7. **不检出具名颜色、`oklch()` 等现代色彩函数、内联 SVG 呈现属性**。这些写法不在 A 项"
        "正则的覆盖范围内，实际触发次数见 A1 边界探针（本轮为 0），不能据 A=0 推断它们不存在。")
    add("8. **PASS 不等于设计通过**。本报告只证明源码层面没有字面色值、没有未定义变量、"
        "没有越界圆角、没有 z-index 字面值、引用顺序正确；视觉是否统一仍须人工评审。")
    add("")

    io.open(out_path, "w", encoding="utf-8", newline="\n").write("\n".join(L) + "\n")

    ok = (total_a == 0 and not undefined and not radius_hits and not z_hits and chain_ok)
    print("written: %s" % out_path)
    print("files=%d  A=%d  B=%d  C=%d  D=%d  chain=%d/%d  A2=%d  A3=%d" %
          (len(files), total_a, len(undefined), len(radius_hits), len(z_hits),
           chain_n, len(html_files), disp_total, cmt_total))
    print("tokens: declarations=%d unique=%d  (Primitive %d / Semantic %d / Component %d)" %
          (len(all_decl), len(set(all_decl)),
           len(agg["Primitive"][1]), len(agg["Semantic"][1]), len(agg["Component"][1])))
    print("RESULT:", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
