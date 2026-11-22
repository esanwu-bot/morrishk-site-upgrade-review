# -*- coding: utf-8 -*-
"""Cross-file mapping verification: matrix 90 vs customer DOCX/XLSX."""
import json
import re
import sys

import openpyxl
from docx import Document

PACK = r"E:/workspace/.scratch/morrishk-commercial-signoff/31_customer_commercial_pack"
MATRIX = PACK + "/_internal/90_DELIVERY_TRACEABILITY_MATRIX.xlsx"
DOC02 = PACK + "/02_FUNCTION_SCOPE_CONFIRMATION.docx"
XLSX04 = PACK + "/04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES.xlsx"
XLSX03 = PACK + "/03_SEO_IMPLEMENTATION_AND_MONTHLY_OPERATION.docx"


def norm(v):
    return "" if v is None else str(v).strip()


def main():
    wb = openpyxl.load_workbook(MATRIX, data_only=True)
    ws = wb["01_CR_TRACE"]
    hdr = [norm(c.value) for c in ws[2]]
    cr_rows = [[norm(c.value) for c in r] for r in ws.iter_rows(min_row=3, max_row=22)]
    cr_ids = [r[0] for r in cr_rows]
    li = hdr.index("客户文件位置")
    ti = hdr.index("FR/SD/OPS编号")
    cr_docs = {}
    for r in cr_rows:
        cr_docs[r[0]] = sorted(set(re.findall(r"0[1-5]", r[li])))

    ws = wb["02_FR_227"]
    hdr2 = [norm(c.value) for c in ws[2]]
    fr_rows = [[norm(c.value) for c in r] for r in ws.iter_rows(min_row=3, max_row=229)]
    fr_ids = [r[1] for r in fr_rows]
    ki = hdr2.index("客户文件位置")
    fr_locs = {r[1]: r[ki] for r in fr_rows}

    ws = wb["03_NEW_15"]
    hdr3 = [norm(c.value) for c in ws[2]]
    new_rows = [[norm(c.value) for c in r] for r in ws.iter_rows(min_row=3, max_row=17)]
    new_ids = [r[0] for r in new_rows]
    nki = hdr3.index("客户文件位置")
    new_locs = {r[0]: r[nki] for r in new_rows}

    # customer XLSX
    wb4 = openpyxl.load_workbook(XLSX04, data_only=True)
    ws9 = wb4["09_CR追溯"]
    h9 = [norm(c.value) for c in ws9[2]]
    xcr = [norm(r[0].value) for r in ws9.iter_rows(min_row=3) if norm(r[0].value).startswith("CR-")]
    ws8 = wb4["08_交付物验收"]
    h8 = [norm(c.value) for c in ws8[2]]
    xnew = [norm(r[0].value) for r in ws8.iter_rows(min_row=3) if norm(r[0].value)]
    xnew = [x for x in xnew if x.startswith(("FR-", "SD-", "OPS-"))]

    # customer DOCX 02 appendix + new15
    doc = Document(DOC02)
    app_ids, new15_ids = [], []
    for t in doc.tables:
        h = [c.text.strip() for c in t.rows[0].cells]
        grid = [list(r.cells) for r in t.rows]
        if len(grid) > 200 and h[0] == "编号":
            app_ids = [grid[i][0].text.strip() for i in range(1, len(grid))]
        if len(grid) == 16 and h[:3] == ["编号", "类别", "名称"]:
            new15_ids = [grid[i][0].text.strip() for i in range(1, 16)]

    # CR target tokens exist
    known = set(fr_ids) | set(new_ids) | {"SD-01", "SD-02", "SD-03", "SD-04", "SD-05", "SD-06", "SD-07", "SD-08", "SD-09",
                                          "OPS-01", "OPS-02", "OPS-03"}
    unresolved = {}
    for r in cr_rows:
        toks = [x.strip() for x in re.split(r"[/、,，\s]+", r[ti]) if x.strip()]
        bad = [x for x in toks if x not in known]
        if bad:
            unresolved[r[0]] = bad

    out = {
        "CR": {
            "matrix_count": len(cr_ids),
            "matrix_unique": len(set(cr_ids)),
            "xlsx_count": len(xcr),
            "xlsx_unique": len(set(xcr)),
            "same_set": set(cr_ids) == set(xcr),
            "missing_in_xlsx": sorted(set(cr_ids) - set(xcr)),
            "blank_customer_file": [r[0] for r in cr_rows if not r[li]],
            "doc_coverage": {d: sum(1 for v in cr_docs.values() if d in v) for d in ["01", "02", "03", "04", "05"]},
            "unresolved_target_tokens": unresolved,
            "details": {r[0]: {"targets": r[ti], "customer_file": r[li]} for r in cr_rows},
        },
        "FR": {
            "matrix_count": len(fr_ids),
            "matrix_unique": len(set(fr_ids)),
            "docx_appendix_count": len(app_ids),
            "docx_unique": len(set(app_ids)),
            "same_set": set(fr_ids) == set(app_ids),
            "only_matrix": sorted(set(fr_ids) - set(app_ids))[:10],
            "only_docx": sorted(set(app_ids) - set(fr_ids))[:10],
            "blank_customer_file": [k for k, v in fr_locs.items() if not v],
            "location_values": sorted(set(fr_locs.values())),
        },
        "NEW15": {
            "matrix_count": len(new_ids),
            "matrix_unique": len(set(new_ids)),
            "xlsx_count": len(xnew),
            "xlsx_unique": len(set(xnew)),
            "docx_count": len(new15_ids),
            "same_set_matrix_xlsx": set(new_ids) == set(xnew),
            "same_set_matrix_docx": set(new_ids) == set(new15_ids),
            "only_matrix": sorted(set(new_ids) - set(xnew) - set(new15_ids)),
            "blank_customer_file": [k for k, v in new_locs.items() if not v],
            "location_values": sorted(set(new_locs.values())),
            "ids": new_ids,
        },
    }
    with open(r"E:/workspace/.scratch/morrishk-commercial/reviewer_evidence/mapping_result.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    lines = ["# 映射核验结果（mapping_result.json 的可读节选）", "", "## CR（20）"]
    c = out["CR"]
    lines.append(f"- 矩阵 {c['matrix_count']} 行 / 唯一 {c['matrix_unique']}；04 XLSX 09_CR追溯 {c['xlsx_count']} / 唯一 {c['xlsx_unique']}；集合一致={c['same_set']}；缺失={c['missing_in_xlsx']}")
    lines.append(f"- 客户文件位置空白：{c['blank_customer_file']}；五份文件被引用次数：{c['doc_coverage']}")
    lines.append(f"- 目标编号无法解析：{c['unresolved_target_tokens']}")
    lines.append("")
    lines.append("## FR（227）")
    f_ = out["FR"]
    lines.append(f"- 矩阵 {f_['matrix_count']} / 唯一 {f_['matrix_unique']}；02 DOCX 附录 A {f_['docx_appendix_count']} / 唯一 {f_['docx_unique']}；集合一致={f_['same_set']}")
    lines.append(f"- 位置空白：{f_['blank_customer_file']}；位置取值：{f_['location_values']}")
    lines.append("")
    lines.append("## 新增 15 项")
    n = out["NEW15"]
    lines.append(f"- 矩阵 {n['matrix_count']} / 唯一 {n['matrix_unique']}；04 XLSX 08 {n['xlsx_count']} / 唯一 {n['xlsx_unique']}；02 DOCX 新增表 {n['docx_count']}")
    lines.append(f"- 矩阵=08={n['same_set_matrix_xlsx']}；矩阵=02新增表={n['same_set_matrix_docx']}；缺失 {n['only_matrix']}")
    lines.append(f"- 位置空白：{n['blank_customer_file']}；位置取值：{n['location_values']}")
    lines.append("")
    with open(r"E:/workspace/.scratch/morrishk-commercial/reviewer_evidence/mapping_summary.md", "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    print("ok")


if __name__ == "__main__":
    main()