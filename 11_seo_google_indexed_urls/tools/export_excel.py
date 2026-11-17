#!/usr/bin/env python3
"""Render the collected Google site-search results as an .xlsx workbook."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

HEADERS = [
    "序号",
    "标题",
    "URL",
    "首次出现页",
    "出现页",
    "出现次数",
    "HTTP 状态",
    "最终 URL",
    "canonical",
    "robots_meta",
    "内容类型",
    "检查状态",
    "摘要",
]
WIDTHS = [6, 46, 62, 10, 10, 10, 10, 62, 40, 22, 26, 14, 70]


def build(path: Path, out: Path) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    entries = data["urls"]
    status_counts = Counter(entry.get("check_status", "") for entry in entries)

    wb = Workbook()
    ws = wb.active
    ws.title = "Google可见URL"

    header_fill = PatternFill("solid", fgColor="1F3864")
    header_font = Font(bold=True, color="FFFFFF")
    for col, title in enumerate(HEADERS, 1):
        cell = ws.cell(row=1, column=col, value=title)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        ws.column_dimensions[get_column_letter(col)].width = WIDTHS[col - 1]
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:{get_column_letter(len(HEADERS))}{len(entries) + 1}"

    for row, entry in enumerate(entries, 2):
        pages = entry.get("pages") or [""]
        values = [
            row - 1,
            entry.get("title", ""),
            entry.get("url", ""),
            pages[0],
            ",".join(str(p) for p in pages),
            entry.get("occurrences", 1),
            entry.get("http_status") or "",
            entry.get("final_url", ""),
            entry.get("canonical_url", ""),
            entry.get("robots_meta") or entry.get("x_robots_tag", ""),
            entry.get("content_type", ""),
            entry.get("check_status", ""),
            entry.get("snippet", ""),
        ]
        for col, value in enumerate(values, 1):
            cell = ws.cell(row=row, column=col, value=value)
            if col in (2, 9, 13):
                cell.alignment = Alignment(vertical="top", wrap_text=True)
            elif col in (7, 4, 6):
                cell.alignment = Alignment(horizontal="center", vertical="top")
        url_cell = ws.cell(row=row, column=3)
        url_cell.hyperlink = entry.get("url", "")
        url_cell.font = Font(color="0563C1", underline="single")
        if entry.get("final_url") and entry["final_url"] != entry.get("url"):
            final_cell = ws.cell(row=row, column=8)
            final_cell.hyperlink = entry["final_url"]
            final_cell.font = Font(color="0563C1", underline="single")

    info = wb.create_sheet("采集说明")
    info.column_dimensions["A"].width = 24
    info.column_dimensions["B"].width = 110
    rows = [
        ("查询词", data.get("query_keyword", "")),
        ("查询 URL", data.get("query_url", "")),
        ("采集模式", data.get("mode", "")),
        ("开始时间", data.get("started_at", "")),
        ("结束时间", data.get("finished_at", "")),
        ("抓取结果页数", f'{data.get("pages_fetched")} 页'),
        ("每页条数", ", ".join(f'第{d["page_number"]}页 {d["visible_results"]} 条' for d in data.get("per_page", []))),
        ("原始出现条数", data.get("raw_result_count")),
        ("去重后 URL 数", data.get("deduped_url_count")),
        ("HTTP 检查汇总", ", ".join(f"{k}={v}" for k, v in sorted(status_counts.items()))),
        ("允许域名", ", ".join(data.get("allowed_hosts", []))),
        ("采集方式", "浏览器渲染后提取结果链接；Google /goto 跳转解析为真实 URL；每个 URL 仅执行一次只读 GET"),
        ("命名口径", "本表为「Google site 搜索可见 URL」，不等于 Google 全量索引，也不等于站点真实页面总数"),
        ("状态口径", "HTTP 状态与检查状态为采集当时的实时可达性，不代表 Google 索引状态"),
        ("已知限制", "Google 对自动化访问可能返回验证码或限流；本流程不做绕过，遇阻即停止并记录"),
    ]
    for row, (key, value) in enumerate(rows, 1):
        info.cell(row=row, column=1, value=key).font = Font(bold=True)
        cell = info.cell(row=row, column=2, value=value)
        cell.alignment = Alignment(vertical="top", wrap_text=True)

    out.parent.mkdir(parents=True, exist_ok=True)
    wb.save(out)


def main() -> int:
    parser = argparse.ArgumentParser(description="Export google_indexed_urls.json to xlsx")
    parser.add_argument("--input", default="reports/seo/google-indexed-urls/google_indexed_urls.json")
    parser.add_argument("--output", default="reports/seo/google-indexed-urls/google_indexed_urls.xlsx")
    args = parser.parse_args()
    build(Path(args.input), Path(args.output))
    print(f"wrote {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
