from __future__ import annotations

import json
import sys
from pathlib import Path

from tests.fixtures import synthetic
from icpdf.parser.pipeline import parse_pdf

ROOT = Path(sys.argv[1]).resolve()
PDF_DIR = ROOT / "pdfs"
RUNS = ROOT / "runs"
PDF_DIR.mkdir(parents=True, exist_ok=True)
RUNS.mkdir(parents=True, exist_ok=True)


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def collect(label: str, result: dict) -> dict:
    run_dir = Path(result["run_dir"])
    product = read_json(run_dir / "product.json")
    manifest = read_json(run_dir / "run_manifest.json")
    tables = read_json(run_dir / "tables.json")
    candidates = read_json(run_dir / "candidates.json")
    tables_list = tables if isinstance(tables, list) else tables.get("tables", [])
    cand_list = candidates if isinstance(candidates, list) else candidates.get("candidates", [])
    return {
        "label": label,
        "run_id": result["run_id"],
        "document_id": result["document_id"],
        "document_sha256": result["document_sha256"],
        "product_id": product["product_id"],
        "requested_mpn": product["requested_mpn"],
        "normalized_mpn": product["normalized_mpn"],
        "identity_scope": product["identity_scope"],
        "manufacturer": product.get("manufacturer"),
        "has_brand_field": any(k in product for k in ("brand", "brand_raw", "brand_norm")),
        "tables": result["tables"],
        "candidates": result["candidates"],
        "manifest_run_id": manifest.get("run_id"),
        "manifest_document_id": manifest.get("document_id"),
        "manifest_document_sha256": manifest.get("document_sha256"),
        "table_sample": tables_list[0] if tables_list else None,
        "candidate_sample": cand_list[0] if cand_list else None,
    }


pdf_a = synthetic.simple_three_column(PDF_DIR / "sample_a.pdf")
pdf_b = synthetic.duplicate_value_two_tables(PDF_DIR / "sample_b.pdf")

res_a = parse_pdf(pdf_a, "SAME-MPN", RUNS)
res_b = parse_pdf(pdf_b, "SAME-MPN", RUNS)

summary = {
    "requested_mpn": "SAME-MPN",
    "note": "Two distinct synthetic PDFs parsed with the same requested MPN.",
    "samples": [collect("A", res_a), collect("B", res_b)],
}
(ROOT / "sample_parse_summary.json").write_text(
    json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

res_a2 = parse_pdf(pdf_a, "SAME-MPN", RUNS)
reparse = {
    "note": "Same PDF parsed twice.",
    "attempts": [collect("A1", res_a), collect("A2", res_a2)],
    "document_id_stable": res_a["document_id"] == res_a2["document_id"],
    "product_id_stable": (
        read_json(Path(res_a["run_dir"]) / "product.json")["product_id"]
        == read_json(Path(res_a2["run_dir"]) / "product.json")["product_id"]
    ),
    "run_id_changed": res_a["run_id"] != res_a2["run_id"],
}
(ROOT / "id_stability_reparse.json").write_text(
    json.dumps(reparse, ensure_ascii=False, indent=2), encoding="utf-8")

print(json.dumps({
    "sample_counts": [(s["label"], s["document_id"], s["product_id"], s["tables"], s["candidates"])
                      for s in summary["samples"]],
    "document_id_stable": reparse["document_id_stable"],
    "product_id_stable": reparse["product_id_stable"],
    "run_id_changed": reparse["run_id_changed"],
}, ensure_ascii=False, indent=2))