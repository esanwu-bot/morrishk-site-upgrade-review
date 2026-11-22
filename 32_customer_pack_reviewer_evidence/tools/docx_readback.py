# -*- coding: utf-8 -*-
"""Independent DOCX read-back for Reviewer evidence.

Reads the actual .docx files in 31_customer_commercial_pack with python-docx
and dumps body paragraphs, table contents, inferred heading hierarchy,
sections, headers/footers (incl. field instructions) and signature blocks
to Markdown. Read-only: never writes to the customer pack.
"""
import hashlib
import os
from collections import OrderedDict

from docx import Document
from docx.oxml.ns import qn
from docx.table import Table
from docx.text.paragraph import Paragraph

BASE = r"E:/workspace/.scratch/morrishk-commercial-signoff/31_customer_commercial_pack"
OUT = r"E:/workspace/.scratch/morrishk-commercial/reviewer_evidence/readback"

DOCS = [
    "00_CUSTOMER_PACK_INDEX_AND_VERSION",
    "01_MORRISHK_PROJECT_PLAN_AND_ROADMAP",
    "02_FUNCTION_SCOPE_CONFIRMATION",
    "03_SEO_IMPLEMENTATION_AND_MONTHLY_OPERATION",
    "04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES",
    "05_PROJECT_KICKOFF_AND_ACCEPTANCE_PLAN",
]

ALIGN = {None: "-", 0: "LEFT", 1: "CENTER", 2: "RIGHT", 3: "JUSTIFY", 4: "DISTRIBUTE"}


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def iter_block_items(doc):
    body = doc.element.body
    for child in body.iterchildren():
        if child.tag == qn("w:p"):
            yield Paragraph(child, doc)
        elif child.tag == qn("w:tbl"):
            yield Table(child, doc)


def para_fmt(p):
    sizes = sorted({r.font.size.pt for r in p.runs if r.font.size is not None})
    bolds = {r.bold for r in p.runs if r.text.strip()}
    bold = True if bolds == {True} else (False if False in bolds else "-")
    return sizes, bold, ALIGN.get(p.alignment, str(p.alignment))


def heading_level(size, bold):
    if not size:
        return 0
    s = max(size)
    if s >= 18:
        return 0  # document title
    if s >= 13.5:
        return 1
    if s >= 11.4:
        return 2
    return 3  # body


def field_instrs(container):
    out = []
    for fi in container._element.iter(qn("w:instrText")):
        if fi.text:
            out.append(fi.text.strip())
    for fld in container._element.iter(qn("w:fldSimple")):
        out.append(fld.get(qn("w:instr")))
    return out


def hf_block(part, label):
    lines = []
    if part is None:
        return [f"- {label}: (none)"]
    paras = [p.text for p in part.paragraphs if p.text.strip()]
    lines.append(f"- {label} 段落: {paras if paras else '(空)'}")
    instr = field_instrs(part)
    lines.append(f"- {label} 域指令: {instr if instr else '(无)'}")
    if part.tables:
        lines.append(f"- {label} 内表格: {len(part.tables)} 个")
    return lines


def cell_text(cell):
    return cell.text.replace("\r", " ").replace("\n", " ").replace("|", "\\|").strip()


def dump_table(t, idx, max_rows=None):
    nrow, ncol = len(t.rows), len(t.columns)
    grid = [list(row.cells) for row in t.rows]
    first_row = t.rows[0]._tr
    trPr = first_row.find(qn("w:trPr"))
    hdr_flag = bool(trPr is not None and trPr.find(qn("w:tblHeader")) is not None)
    cant = sum(
        1
        for r in t.rows
        if r._tr.find(qn("w:trPr")) is not None
        and r._tr.find(qn("w:trPr")).find(qn("w:cantSplit")) is not None
    )
    styles = t.style.name if t.style is not None else None
    widths = []
    for j in range(min(ncol, 14)):
        w = grid[0][j].width
        widths.append(round(w.mm, 1) if w else None)
    lines = [
        f"### 表 T{idx:02d} — {nrow} 行 × {ncol} 列（style={styles}，首行 tblHeader={hdr_flag}，cantSplit 行数={cant}，首行列宽mm={widths}）",
        "",
    ]
    head = "| " + " | ".join(cell_text(c) for c in grid[0]) + " |"
    sep = "|" + "---|" * ncol
    lines += [head, sep]
    limit = nrow if max_rows is None else min(nrow, max_rows)
    for i in range(1, limit):
        lines.append("| " + " | ".join(cell_text(c) for c in grid[i]) + " |")
    if limit < nrow:
        lines.append(f"| …（余 {nrow - limit} 行省略，见原文件） |" + " |" * (ncol - 1))
    lines.append("")
    # empty-cell count for the table body (evidence for blanks)
    empties = sum(1 for i in range(1, nrow) for c in grid[i] if not c.text.strip())
    lines.append(f"- T{idx:02d} 正文空单元格数: {empties} / {(nrow - 1) * ncol}")
    lines.append("")
    return lines


def signature_hits(blocks):
    kw = ("签署", "签字", "盖章", "日期", "确认人", "授权代表", "甲方", "乙方")
    hits = []
    for kind, obj in blocks:
        text = obj.text if kind == "P" else " ".join(c.text for r in obj.rows for c in r.cells)
        if any(k in text for k in kw):
            hits.append((kind, obj))
    return hits


def process(name):
    path = os.path.join(BASE, name + ".docx")
    doc = Document(path)
    blocks = [("P" if isinstance(b, Paragraph) else "T", b) for b in iter_block_items(doc)]

    md = []
    md.append(f"# 独立读回：{name}.docx")
    md.append("")
    md.append(f"- 源文件: `{path}`")
    md.append(f"- 字节数: {os.path.getsize(path)}")
    md.append(f"- SHA-256: `{sha256(path)}`")
    md.append(f"- python-docx 读回：段落 {len(doc.paragraphs)} 个，表格 {len(doc.tables)} 个，节 {len(doc.sections)} 个，正文块 {len(blocks)} 个")
    md.append("- 读取方式：按 `w:body` 子元素顺序遍历 `w:p` / `w:tbl`；内容为文件实际值，未使用构建脚本断言。")
    md.append("")

    # headings
    md.append("## 标题层级（按实际字号/加粗推断；文档未使用 Heading 样式）")
    md.append("")
    md.append("| 块 | 字号 | 加粗 | 对齐 | 文本 |")
    md.append("|---|---|---|---|---|")
    for i, (kind, obj) in enumerate(blocks):
        if kind != "P":
            continue
        sizes, bold, align = para_fmt(obj)
        if obj.text.strip() and sizes and max(sizes) >= 11.4:
            md.append(f"| P{i:03d} | {sizes} | {bold} | {align} | {obj.text.strip()[:80]} |")
    md.append("")

    # sections
    md.append("## 节、页眉、页脚")
    md.append("")
    for si, sec in enumerate(doc.sections):
        md.append(f"### Section {si}（start_type={sec.start_type}）")
        md.append(f"- 页面: {round(sec.page_width.mm,1)}mm × {round(sec.page_height.mm,1)}mm；上/下/左/右页边距: {round(sec.top_margin.mm,1)} / {round(sec.bottom_margin.mm,1)} / {round(sec.left_margin.mm,1)} / {round(sec.right_margin.mm,1)} mm")
        md += hf_block(sec.header, "页眉")
        md += hf_block(sec.footer, "页脚")
        md.append("")

    # body dump
    md.append("## 正文逐块读回（P=段落，T=表格，按文档顺序）")
    md.append("")
    ti = 0
    pi = 0
    for kind, obj in blocks:
        if kind == "P":
            sizes, bold, align = para_fmt(obj)
            lvl = heading_level(sizes, bold)
            tag = {0: "TITLE", 1: "H1", 2: "H2", 3: "body"}[lvl]
            if not obj.text.strip():
                md.append(f"- **P{pi:03d}** [空行]")
            else:
                md.append(f"- **P{pi:03d}** [{tag}; size={sizes}; bold={bold}; align={align}] {obj.text.strip()}")
            pi += 1
        else:
            md.append("")
            md += dump_table(obj, ti)
            ti += 1

    # signature blocks
    md.append("## 签署栏相关块（含“签署/签字/盖章/日期/甲方/乙方”等关键词）")
    md.append("")
    sig = signature_hits([(k, o) for k, o in blocks])
    if not sig:
        md.append("- 未检出。")
    for kind, obj in sig:
        if kind == "P":
            md.append(f"- {obj.text.strip()}")
        else:
            md.append(f"- 表格 {len(obj.rows)}×{len(obj.columns)}：")
            for r in obj.rows:
                md.append("  - " + " | ".join(c.text.replace("\n", " ").strip() for c in r.cells))
    md.append("")

    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, name + ".md")
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(md))
    print(out, len(md), "lines")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for n in DOCS:
        process(n)