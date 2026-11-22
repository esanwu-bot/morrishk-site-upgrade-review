# -*- coding: utf-8 -*-
"""Programmatic evidence checks for the Reviewer supplementary round.

Read-only. Reads the actual customer pack (DOCX/XLSX), the internal matrix
workbook, and the R3 authority workbooks; writes checks_result.json and
checks_summary.md under reviewer_evidence/.
"""
import hashlib
import json
import os
import re
import zipfile

import openpyxl
from docx import Document
from docx.oxml.ns import qn
from docx.table import Table
from docx.text.paragraph import Paragraph

PACK = r"E:/workspace/.scratch/morrishk-commercial-signoff/31_customer_commercial_pack"
MATRIX = os.path.join(PACK, "_internal", "90_DELIVERY_TRACEABILITY_MATRIX.xlsx")
AUTH04 = r"E:/workspace/.scratch/morrishk-commercial-signoff/30_commercial_proposal_and_signoff/04_CR_REQUIREMENT_TRACEABILITY.xlsx"
OUTDIR = r"E:/workspace/.scratch/morrishk-commercial/reviewer_evidence"

DOCS = {
    "00": "00_CUSTOMER_PACK_INDEX_AND_VERSION",
    "01": "01_MORRISHK_PROJECT_PLAN_AND_ROADMAP",
    "02": "02_FUNCTION_SCOPE_CONFIRMATION",
    "03": "03_SEO_IMPLEMENTATION_AND_MONTHLY_OPERATION",
    "04": "04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES",
    "05": "05_PROJECT_KICKOFF_AND_ACCEPTANCE_PLAN",
}
ID_RE = re.compile(r"^(FR-\d-\d+|SD-\d{2}|OPS-\d{2}|T-\d{2}|E-\d{2}|G-\d{2}|A-\d{2}|CR-\d{3}|V-\d{2})$")


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def verify_sums():
    rec = {}
    with open(os.path.join(PACK, "SHA256SUMS"), encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            h, name = line.split(None, 1)
            rec[name.lstrip("*")] = h
    out = {}
    for name, h in rec.items():
        p = os.path.join(PACK, name)
        actual = sha256(p) if os.path.exists(p) else None
        out[name] = {"recorded": h, "actual": actual, "match": h == actual}
    return out


def iter_blocks(doc):
    for child in doc.element.body.iterchildren():
        if child.tag == qn("w:p"):
            yield "P", Paragraph(child, doc)
        elif child.tag == qn("w:tbl"):
            yield "T", Table(child, doc)


def table_grid(t):
    return [list(r.cells) for r in t.rows]


def header_index(t, names):
    grid = table_grid(t)
    hdr = [c.text.strip() for c in grid[0]]
    for name in names:
        if name in hdr:
            return hdr.index(name), hdr, grid
    return None, hdr, grid


def docx_fingerprint(path):
    """Core props, comments, tracked changes, zip parts."""
    doc = Document(path)
    cp = doc.core_properties
    parts = []
    with zipfile.ZipFile(path) as z:
        for n in z.namelist():
            parts.append(n)
    xml_hits = {}
    with zipfile.ZipFile(path) as z:
        for n in z.namelist():
            if not n.endswith(".xml"):
                continue
            data = z.read(n).decode("utf-8", "ignore")
            flags = {}
            for tag in ("w:ins", "w:del", "w:commentReference", "w:comment "):
                if f"<{tag}" in data:
                    flags[tag] = data.count(f"<{tag}")
            if flags:
                xml_hits[n] = flags
    return {
        "author": cp.author,
        "last_modified_by": cp.last_modified_by,
        "title": cp.title,
        "subject": cp.subject,
        "comments": cp.comments,
        "created": str(cp.created),
        "modified": str(cp.modified),
        "revision": cp.revision,
        "has_comments_part": any("comments" in p for p in parts),
        "tracked_or_comments_xml": xml_hits,
        "parts": len(parts),
    }


def check_docx():
    res = {}
    for key, name in DOCS.items():
        path = os.path.join(PACK, name + ".docx")
        doc = Document(path)
        blocks = list(iter_blocks(doc))
        tables = [o for k, o in blocks if k == "T"]
        paras = [o for k, o in blocks if k == "P"]
        info = {
            "file": name + ".docx",
            "sha256": sha256(path),
            "size": os.path.getsize(path),
            "paragraphs": len(paras),
            "tables": len(tables),
            "sections": len(doc.sections),
            "table_dims": [[len(t.rows), len(t.columns)] for t in tables],
            "fingerprint": docx_fingerprint(path),
        }
        # amount-bearing tables
        amt = []
        for ti, t in enumerate(tables):
            idx, hdr, grid = header_index(t, ["金额", "金额（如有）", "金额/备注", "月度费用"])
            if idx is None:
                continue
            vals = [grid[i][idx].text.strip() for i in range(1, len(grid))]
            nonblank = [v for v in vals if v]
            amt.append({"table": ti, "col": idx, "header": hdr[idx], "rows": len(vals), "nonblank": nonblank})
        info["amount_tables"] = amt
        info["amount_nonblank_total"] = sum(len(a["nonblank"]) for a in amt)
        if key == "02":
            # appendix table
            ap = None
            for ti, t in enumerate(tables):
                h0 = [c.text.strip() for c in table_grid(t)[0]]
                if len(t.rows) > 200 and h0[0] == "编号" and "分类" in h0:
                    ap = (ti, t)
                    break
            ti, t = ap
            grid = table_grid(t)
            hdr = [c.text.strip() for c in grid[0]]
            ids = [grid[i][0].text.strip() for i in range(1, len(grid))]
            cats = {}
            for i in range(1, len(grid)):
                cats[grid[i][hdr.index("分类")].text.strip()] = cats.get(grid[i][hdr.index("分类")].text.strip(), 0) + 1
            info["appendix"] = {
                "table": ti,
                "rows": len(grid) - 1,
                "unique_ids": len(set(ids)),
                "blank_ids": sum(1 for x in ids if not x),
                "categories": cats,
                "header": hdr,
                "sample_first": [c.text.strip() for c in grid[1]],
                "sample_last": [c.text.strip() for c in grid[-1]],
            }
            # new-15 table (编号/类别/名称/对应客户意见/…/费用类别（六类）)
            for tj, t2 in enumerate(tables):
                h2 = [c.text.strip() for c in table_grid(t2)[0]]
                if h2[:3] == ["编号", "类别", "名称"] and len(t2.rows) == 16 and "费用类别（六类）" in h2:
                    g2 = table_grid(t2)
                    fee = [g2[i][h2.index("费用类别（六类）")].text.strip() for i in range(1, 16)]
                    info["new15"] = {
                        "table": tj,
                        "rows": 15,
                        "header": h2,
                        "fee_classes": fee,
                        "fee_counts": {v: fee.count(v) for v in set(fee)},
                        "ids": [g2[i][0].text.strip() for i in range(1, 16)],
                        "sd02": {h2[j]: g2[i][j].text.strip() for i in range(1, 16) if g2[i][0].text.strip() == "SD-02" for j in range(len(h2))},
                    }
                    break
            info["scope_prose"] = [p.text.strip() for p in paras if "15 项新增" in p.text and ("待确认" in p.text or "范围状态" in p.text)]
        if key == "04":
            # partition summary table A..G
            for ti, t in enumerate(tables):
                hdr = [c.text.strip() for c in table_grid(t)[0]]
                if hdr[0] == "分区":
                    grid = table_grid(t)
                    info["partitions"] = {
                        "table": ti,
                        "rows": [[c.text.strip() for c in r] for r in grid[1:]],
                    }
                    break
        if key == "00":
            # find 176 mention
            texts = [p.text.strip() for p in paras] + [
                c.text.strip() for t in tables for r in t.rows for c in r.cells
            ]
            info["mentions_176"] = [x for x in texts if "176" in x]
            info["mentions_15_new"] = [x for x in texts if "15 项新增" in x or "15 项" in x][:10]
        res[key] = info
    return res


def norm(v):
    if v is None:
        return ""
    return str(v).strip()


def check_xlsx04():
    wb = openpyxl.load_workbook(os.path.join(PACK, DOCS["04"] + ".xlsx"), data_only=False)
    out = {"sheetnames": wb.sheetnames, "sheets": {}}
    total_nonblank_amount = 0
    total_formulas = 0
    for ws in wb.worksheets:
        rows = [[c.value for c in r] for r in ws.iter_rows()]
        formulas = []
        for r in ws.iter_rows():
            for c in r:
                if c.data_type == "f":
                    formulas.append(c.coordinate)
        total_formulas += len(formulas)
        hdr = rows[1] if len(rows) > 1 else []
        amt_cols = [j for j, v in enumerate(hdr) if norm(v) in ("金额", "金额（如有）")]
        amount_vals = []
        for j in amt_cols:
            for i in range(2, len(rows)):
                v = rows[i][j]
                if norm(v):
                    amount_vals.append((ws.cell(row=i + 1, column=j + 1).coordinate, norm(v)))
        total_nonblank_amount += len(amount_vals)
        ids = [norm(r[0]) for r in rows[2:] if r and ID_RE.match(norm(r[0]))]
        ps = ws.page_setup
        out["sheets"][ws.title] = {
            "state": ws.sheet_state,
            "dims": [ws.max_row, ws.max_column],
            "header": [norm(x) for x in hdr],
            "freeze": str(ws.freeze_panes),
            "auto_filter": ws.auto_filter.ref,
            "merged": [str(m) for m in ws.merged_cells.ranges],
            "print": {
                "orientation": str(ps.orientation),
                "paper": str(ps.paperSize),
                "fitToWidth": ps.fitToWidth,
                "fitToHeight": ps.fitToHeight,
                "print_area": str(ws.print_area),
                "title_rows": str(ws.print_title_rows),
            },
            "formulas": formulas,
            "ids": ids,
            "id_count": len(ids),
            "amount_cols": [openpyxl.utils.get_column_letter(j + 1) for j in amt_cols],
            "amount_nonblank": amount_vals,
        }
    out["total_formulas"] = total_formulas
    out["total_nonblank_amount"] = total_nonblank_amount

    # specific facts
    def rows_of(name):
        ws = wb[name]
        return [[c.value for c in r] for r in ws.iter_rows(min_row=3)]

    a = [r for r in rows_of("01_一次性开发") if ID_RE.match(norm(r[0]))]
    out["A_rows"] = {norm(r[0]): norm(r[9]) for r in a}  # 数量 column K? detect below
    out["A_headers"] = [norm(c.value) for c in wb["01_一次性开发"][2]]
    # robust: find 数量 col
    hdrA = out["A_headers"]
    qi = hdrA.index("数量") if "数量" in hdrA else None
    out["A_counts"] = {norm(r[0]): norm(r[qi]) for r in a} if qi is not None else {}
    nums = []
    for r in a:
        if norm(r[0]).startswith("A-0") and norm(r[0]) != "A-09":
            m = re.search(r"(\d+)", norm(r[qi]))
            nums.append(int(m.group(1)) if m else 0)
    out["A_sum_118"] = sum(nums)
    out["A_ids"] = [norm(r[0]) for r in a]

    b = [r for r in rows_of("01b_一次性开发明细") if norm(r[0]).startswith("FR-")]
    out["B_rows"] = len(b)
    out["B_unique"] = len({norm(r[0]) for r in b})
    out["B_categories"] = {}
    hdrB = [norm(c.value) for c in wb["01b_一次性开发明细"][2]]
    out["B_headers"] = hdrB
    ci = hdrB.index("五分类")
    for r in b:
        k = norm(r[ci])
        out["B_categories"][k] = out["B_categories"].get(k, 0) + 1
    out["B_has_fr340"] = any(norm(r[0]) == "FR-3-040" for r in b)

    # 08 deliverable acceptance
    d = [r for r in rows_of("08_交付物验收") if ID_RE.match(norm(r[0]))]
    hdrD = [norm(c.value) for c in wb["08_交付物验收"][2]]
    out["D_headers"] = hdrD
    out["D_rows"] = len(d)
    out["D_ids"] = [norm(r[0]) for r in d]
    out["D_confirm"] = {norm(r[0]): norm(r[hdrD.index("客户确认状态")]) for r in d}
    di = hdrD.index("客户确认状态")
    out["D_confirm_values"] = {norm(r[0]): norm(r[di]) for r in d}
    sdi = hdrD.index("报价状态")
    fci = hdrD.index("费用类别")
    out["D_sd02"] = {hdrD[j]: norm(r[j]) for r in d if norm(r[0]) == "SD-02" for j in range(len(hdrD))}

    # 09 CR trace
    c = [r for r in rows_of("09_CR追溯") if norm(r[0]).startswith("CR-")]
    hdrC = [norm(c_.value) for c_ in wb["09_CR追溯"][2]]
    out["C_headers"] = hdrC
    out["C_rows"] = len(c)
    out["C_ids"] = [norm(r[0]) for r in c]
    def cr_row(cid):
        for r in c:
            if norm(r[0]) == cid:
                return {hdrC[j]: norm(r[j]) for j in range(len(hdrC))}
        return None
    out["CR_019"] = cr_row("CR-019")
    out["CR_015"] = cr_row("CR-015")
    out["CR_003"] = cr_row("CR-003")

    # 05 E-01 SD-02
    e = [r for r in rows_of("05_可选增值单独报价") if norm(r[0]).startswith("E-")]
    hdrE = [norm(c_.value) for c_ in wb["05_可选增值单独报价"][2]]
    out["E_headers"] = hdrE
    out["E_rows"] = len(e)
    out["E01"] = {hdrE[j]: norm(e[0][j]) for j in range(len(hdrE))} if e else None

    # 10 summary
    s = [r for r in rows_of("10_汇总") if norm(r[0]) in list("ABCDEFG")]
    hdrS = [norm(c_.value) for c_ in wb["10_汇总"][2]]
    out["S_headers"] = hdrS
    out["S_rows"] = [[norm(x) for x in r] for r in s]

    # 06 pending count breakdown
    p = [r for r in rows_of("06_待确认不报价") if ID_RE.match(norm(r[0]))]
    out["F_rows"] = len(p)
    out["F_fr"] = sum(1 for r in p if norm(r[0]).startswith("FR-"))
    out["F_ops"] = sum(1 for r in p if norm(r[0]).startswith("OPS-"))
    out["F_src"] = {}
    hdrF = [norm(c_.value) for c_ in wb["06_待确认不报价"][2]]
    si = hdrF.index("需求来源")
    for r in p:
        k = norm(r[si])
        out["F_src"][k] = out["F_src"].get(k, 0) + 1
    return out


def check_matrix():
    wb = openpyxl.load_workbook(MATRIX, data_only=False)
    out = {"sheetnames": wb.sheetnames, "sheets": {}}
    for ws in wb.worksheets:
        out["sheets"][ws.title] = {
            "dims": [ws.max_row, ws.max_column],
            "freeze": str(ws.freeze_panes),
            "auto_filter": ws.auto_filter.ref,
            "merges": [str(m) for m in ws.merged_cells.ranges],
            "state": ws.sheet_state,
        }
    # CR trace
    ws = wb["01_CR_TRACE"]
    hdr = [norm(c.value) for c in ws[2]]
    rows = [[c.value for c in r] for r in ws.iter_rows(min_row=3, max_row=22)]
    out["CR_headers"] = hdr
    out["CR_rows"] = len(rows)
    out["CR_ids"] = [norm(r[0]) for r in rows]
    out["CR_unique"] = len(set(out["CR_ids"]))
    li = hdr.index("客户文件位置")
    out["CR_blank_customer_file"] = [norm(r[0]) for r in rows if not norm(r[li])]
    def mcr(cid):
        for r in rows:
            if norm(r[0]) == cid:
                return {hdr[j]: norm(r[j]) for j in range(len(hdr))}
        return None
    out["M_CR_019"] = mcr("CR-019")
    out["M_CR_015"] = mcr("CR-015")
    out["M_CR_003"] = mcr("CR-003")

    # FR
    ws = wb["02_FR_227"]
    hdr = [norm(c.value) for c in ws[2]]
    rows = [[c.value for c in r] for r in ws.iter_rows(min_row=3, max_row=229)]
    out["FR_headers"] = hdr
    out["FR_rows"] = len(rows)
    out["FR_unique"] = len({norm(r[1]) for r in rows})
    ri = hdr.index("范围状态")
    oi = hdr.index("原状态")
    out["FR_scope"] = {}
    out["FR_origin"] = {}
    for r in rows:
        out["FR_scope"][norm(r[ri])] = out["FR_scope"].get(norm(r[ri]), 0) + 1
        out["FR_origin"][norm(r[oi])] = out["FR_origin"].get(norm(r[oi]), 0) + 1
    ki = hdr.index("客户文件位置")
    out["FR_blank_customer_file"] = [norm(r[1]) for r in rows if not norm(r[ki])]
    out["FR_ids"] = [norm(r[1]) for r in rows]

    # new15
    ws = wb["03_NEW_15"]
    hdr = [norm(c.value) for c in ws[2]]
    rows = [[c.value for c in r] for r in ws.iter_rows(min_row=3, max_row=17)]
    hi = hdr.index("范围状态")
    out["NEW_headers"] = hdr
    out["NEW_rows"] = len(rows)
    out["NEW_scope"] = [norm(r[hi]) for r in rows]
    out["NEW_ids"] = [norm(r[0]) for r in rows]
    qi = hdr.index("报价状态")
    fi = hdr.index("费用类别")
    out["NEW_sd02"] = {hdr[j]: norm(r[j]) for r in rows if norm(r[0]) == "SD-02" for j in range(len(hdr))}
    ki = hdr.index("客户文件位置")
    out["NEW_blank_customer_file"] = [norm(r[0]) for r in rows if not norm(r[ki])]

    # phase accept
    ws = wb["04_PHASE_ACCEPT"]
    hdr = [norm(c.value) for c in ws[2]]
    rows = [[c.value for c in r] for r in ws.iter_rows(min_row=3, max_row=27)]
    si = hdr.index("状态")
    out["PHASE_rows"] = len(rows)
    out["PHASE_status"] = {}
    for r in rows:
        out["PHASE_status"][norm(r[si])] = out["PHASE_status"].get(norm(r[si]), 0) + 1

    # fee class audit
    ws = wb["05_FEE_CLASS_AUDIT"]
    out["FEE_rows"] = [[norm(c.value) for c in r] for r in ws.iter_rows(min_row=3, max_row=9)]

    # count audit
    ws = wb["07_COUNT_AUDIT"]
    out["COUNT_rows"] = [[c.value for c in r] for r in ws.iter_rows(min_row=3, max_row=22)]
    return out


def check_auth176():
    wb = openpyxl.load_workbook(AUTH04, data_only=True)
    ws = wb["176_COST_STATUS"]
    rows = [[c.value for c in r] for r in ws.iter_rows(min_row=3, max_row=178)]
    src = {}
    for r in rows:
        k = norm(r[2])
        src[k] = src.get(k, 0) + 1
    amounts = [norm(r[12]) for r in rows]
    return {
        "sheet": "176_COST_STATUS",
        "rows": len(rows),
        "by_source": src,
        "amount_nonblank": sum(1 for a in amounts if a),
        "first": {norm(h): norm(v) for h, v in zip([c.value for c in ws[2]], rows[0])},
        "last": {norm(h): norm(v) for h, v in zip([c.value for c in ws[2]], rows[-1])},
    }


TOKENS = ["Reviewer", "reviewer", "Agent", "agent", "SHA", "sha256", "commit", "自检", "DRAFT",
          "草稿", "内部", "_internal", "断言", "构建脚本", "TODO", "FIXME", "待填", "占位", "Lorem",
          "R1", "R2", "R3", "R4", "R5"]
TOK_RE = re.compile("|".join(re.escape(t) for t in TOKENS))


def check_scan():
    hits = []

    def scan_text(file, loc, text):
        if not text:
            return
        for m in TOK_RE.finditer(text):
            hits.append({"file": file, "loc": loc, "token": m.group(0), "context": text[max(0, m.start() - 30):m.end() + 30]})

    for key, name in DOCS.items():
        path = os.path.join(PACK, name + ".docx")
        doc = Document(path)
        for i, p in enumerate(doc.paragraphs):
            scan_text(name + ".docx", f"body P{i:03d}", p.text)
        for ti, t in enumerate(doc.tables):
            for ri, row in enumerate(t.rows):
                for ci, cell in enumerate(row.cells):
                    scan_text(name + ".docx", f"T{ti:02d} R{ri} C{ci}", cell.text)
        for si, sec in enumerate(doc.sections):
            for p in sec.header.paragraphs:
                scan_text(name + ".docx", f"header S{si}", p.text)
            for p in sec.footer.paragraphs:
                scan_text(name + ".docx", f"footer S{si}", p.text)
        cp = doc.core_properties
        for attr in ("author", "last_modified_by", "title", "subject", "comments", "keywords", "category"):
            scan_text(name + ".docx", f"core.{attr}", str(getattr(cp, attr) or ""))
        # raw xml of headers/footers + app/core
        with zipfile.ZipFile(path) as z:
            for n in z.namelist():
                if n.startswith("docProps/") or n.startswith("word/header") or n.startswith("word/footer"):
                    if n.endswith(".xml"):
                        scan_text(name + ".docx", n, z.read(n).decode("utf-8", "ignore"))

    xlsx = os.path.join(PACK, DOCS["04"] + ".xlsx")
    wb = openpyxl.load_workbook(xlsx, data_only=False)
    for ws in wb.worksheets:
        for row in ws.iter_rows():
            for c in row:
                if isinstance(c.value, str):
                    scan_text(DOCS["04"] + ".xlsx", f"{ws.title}!{c.coordinate}", c.value)
    cp = wb.properties
    for attr in ("creator", "lastModifiedBy", "title", "description", "subject", "keywords"):
        scan_text(DOCS["04"] + ".xlsx", f"core.{attr}", str(getattr(cp, attr) or ""))

    md = os.path.join(PACK, "00_CUSTOMER_PACK_INDEX_AND_VERSION.md")
    if os.path.exists(md):
        for i, line in enumerate(open(md, encoding="utf-8")):
            scan_text("00_CUSTOMER_PACK_INDEX_AND_VERSION.md", f"L{i+1}", line.strip())

    # aggregate by token
    agg = {}
    for h in hits:
        agg.setdefault(h["token"], []).append(h)
    return {"hits": hits, "by_token": {k: len(v) for k, v in agg.items()}, "detail": {k: v[:20] for k, v in agg.items()}}


def check_render():
    a = json.load(open(os.path.join(OUTDIR, "render_analysis.json"), encoding="utf-8"))
    c = json.load(open(os.path.join(OUTDIR, "render_checks.json"), encoding="utf-8"))
    out = {}
    for name, info in a.items():
        pages = info["page_data"]
        nums = [p.get("page_number") for p in pages]
        bad = [p["page"] for p in pages if not p.get("page_number") or p["page_number"][0] < 1]
        out[name] = {
            "pages": info["pages"],
            "fonts": info["fonts"],
            "page_numbers_present": sum(1 for n in nums if n),
            "page_number_bad": bad,
            "text_overflow_pages": [p["page"] for p in pages if p.get("text_overflow")],
            "drawing_overflow_pages": [p["page"] for p in pages if p.get("drawing_overflow")],
            "headers": {p["page"]: p.get("header_text") for p in pages},
            "footers": {p["page"]: p.get("footer_text") for p in pages},
            "first_lines": {p["page"]: p.get("first_lines") for p in pages},
            "last_lines": {p["page"]: p.get("last_lines") for p in pages},
            "checks": {k: v for k, v in c.get(name, {}).items() if k != "pages"},
        }
    return out


def main():
    result = {
        "sha256sums": verify_sums(),
        "docx": check_docx(),
        "xlsx04": check_xlsx04(),
        "matrix": check_matrix(),
        "auth176": check_auth176(),
        "scan": check_scan(),
        "render": check_render(),
    }
    with open(os.path.join(OUTDIR, "checks_result.json"), "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=1)

    # short human summary
    lines = ["# 程序化核验摘要（checks_result.json 的可读节选）", ""]
    lines.append("## SHA256SUMS 核验")
    for n, v in result["sha256sums"].items():
        lines.append(f"- {n}: {'MATCH' if v['match'] else 'MISMATCH'} ({v['actual']})")
    lines.append("")
    x = result["xlsx04"]
    lines.append("## 04 XLSX 汇总")
    lines.append(f"- 工作表: {x['sheetnames']}")
    lines.append(f"- 公式总数: {x['total_formulas']}；金额列非空总数: {x['total_nonblank_amount']}")
    lines.append(f"- A 区细分合计: {x['A_sum_118']}（A-01..A-05），A 编号: {x['A_ids']}")
    lines.append(f"- 01b: 行 {x['B_rows']}，唯一 {x['B_unique']}，分类 {x['B_categories']}，含 FR-3-040={x['B_has_fr340']}")
    lines.append(f"- 08 行 {x['D_rows']}，确认值 {set(x['D_confirm_values'].values())}")
    lines.append(f"- SD-02: {x['D_sd02']}")
    lines.append(f"- 09 CR 行 {x['C_rows']}，唯一 {len(set(x['C_ids']))}")
    lines.append(f"- CR-019: {x['CR_019']}")
    lines.append(f"- CR-015: {x['CR_015']}")
    lines.append(f"- E-01: {x['E01']}")
    lines.append(f"- F 区 {x['F_rows']}（FR {x['F_fr']} / OPS {x['F_ops']}），来源 {x['F_src']}")
    lines.append("")
    m = result["matrix"]
    lines.append("## 内部矩阵")
    lines.append(f"- CR {m['CR_rows']} 行，唯一 {m['CR_unique']}，客户文件位置空白 {m['CR_blank_customer_file']}")
    lines.append(f"- FR {m['FR_rows']} 行，唯一 {m['FR_unique']}，范围 {m['FR_scope']}，原状态 {m['FR_origin']}，位置空白 {m['FR_blank_customer_file']}")
    lines.append(f"- NEW15 {m['NEW_rows']} 行，范围 {set(m['NEW_scope'])}，SD-02 {m['NEW_sd02']}")
    lines.append(f"- PHASE {m['PHASE_rows']} 行，状态 {m['PHASE_status']}")
    lines.append(f"- 费用类别审计: {m['FEE_rows']}")
    lines.append(f"- 计数审计: {m['COUNT_rows']}")
    lines.append("")
    a176 = result["auth176"]
    lines.append("## 权威 176_COST_STATUS（30_/04）")
    lines.append(f"- 行数 {a176['rows']}，来源 {a176['by_source']}，金额非空 {a176['amount_nonblank']}")
    lines.append("")
    s = result["scan"]
    lines.append("## 内部内容扫描")
    lines.append(f"- 命中总数 {len(s['hits'])}，按词 {s['by_token']}")
    for tok, items in s["detail"].items():
        for h in items[:5]:
            lines.append(f"- [{tok}] {h['file']} {h['loc']}: …{h['context']}…")
    lines.append("")
    r = result["render"]
    lines.append("## 渲染统计")
    for name, v in r.items():
        lines.append(f"- {name}: {v['pages']} 页，页码异常 {v['page_number_bad']}，文字溢出页 {v['text_overflow_pages']}，图形溢出页 {v['drawing_overflow_pages']}，字体 {v['fonts']}")
        lines.append(f"  - checks: {v['checks']}")
    lines.append("")
    with open(os.path.join(OUTDIR, "checks_summary.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("done", len(s["hits"]), "scan hits")


if __name__ == "__main__":
    main()