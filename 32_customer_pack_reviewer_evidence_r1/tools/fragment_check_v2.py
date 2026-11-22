# -*- coding: utf-8 -*-
"""Corrected R1 fragment check (row-structured, production-locator self-test).

Reviewer requirements implemented here:
1. No fixed data-row index: locate the repeated header dynamically, then take
   the first non-empty data row after it.
2. Verify the first data row's cells inside that row's own PDF table cells.
3. fragment_check_legacy.json is read-only and keeps the original false.
4. Record both the reproduced legacy result and the new results.
5. Keep the 04 p9 CR-011 / ruling-last-row and 02 p6-p20 scope unchanged.
6. Offset self-test uses the SAME table locator functions as production
   (find_header_row / first_nonempty_row), not a separate text-line locator.
   It prepends 0/1/5/17 rows to in-memory table data only.
7. Header matching is ORDERED: labels must appear in sequence, not anywhere.
   A negative test shuffles the header order and expects no match.
"""
import argparse
import hashlib
import json
import os
import re

import pymupdf

HERE = os.path.dirname(os.path.abspath(__file__))
HEADER_04 = ['事项', '当前处理', '确认方']


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def norm(text):
    return re.sub(r'\s+', '', text or '')


def load_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


# ---------- production table locators (used by PDF checks AND self-tests) ----------
def header_in_order(cells, labels):
    """True only if labels appear as an ordered subsequence of cells."""
    pos = 0
    for label in labels:
        while pos < len(cells) and cells[pos] != label:
            pos += 1
        if pos == len(cells):
            return False
        pos += 1
    return True


def find_header_row(data, labels):
    for ri, row in enumerate(data):
        cells = [norm(c) for c in row]
        if header_in_order(cells, labels):
            return ri
    return None


def find_table_with_header(page, labels):
    for tab in page.find_tables().tables:
        data = tab.extract()
        hi = find_header_row(data, labels)
        if hi is not None:
            return tab, data, hi
    return None


def first_nonempty_row(data, start):
    for ri in range(start, len(data)):
        if any(norm(c) for c in data[ri]):
            return ri, data[ri]
    return None, None


def cell_checks(row, rules):
    """rules: list of (name, predicate over the row's normalized cells)."""
    cells = [norm(c) for c in row]
    out = {}
    for name, pred in rules:
        out[name] = bool(pred(cells))
    out['complete'] = all(out.values())
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pdf-dir', default=os.path.join(HERE, 'pdf'))
    ap.add_argument('--checks', default=os.path.join(HERE, 'render_checks.json'))
    ap.add_argument('--legacy', default=os.path.join(HERE, 'fragment_check_legacy.json'))
    ap.add_argument('--out', default=os.path.join(HERE, 'fragment_check.json'))
    args = ap.parse_args()

    pdf04 = os.path.join(args.pdf_dir, '04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES.pdf')
    pdf02 = os.path.join(args.pdf_dir, '02_FUNCTION_SCOPE_CONFIRMATION.pdf')
    for p in (pdf04, pdf02, args.checks, args.legacy):
        if not os.path.exists(p):
            raise SystemExit('missing input: %s' % p)

    checks = load_json(args.checks)
    legacy = load_json(args.legacy)

    # --- legacy reproduction (old inline assertion, unchanged) ---
    p10_text = next(p['text'] for p in checks['04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES']['pages']
                    if p['page'] == 10)
    raw = p10_text.split('\n')
    legacy_window = raw[3:10]
    legacy_reproduced = '第三方采购与付款方' in legacy_window
    string_index = next(i for i, line in enumerate(raw) if '第三方采购与付款方' in line)

    # --- actual PDF table checks ---
    doc04 = pymupdf.open(pdf04)
    p9 = doc04[8]
    p10 = doc04[9]

    tab10, data10, hi10 = find_table_with_header(p10, HEADER_04)
    if tab10 is None:
        raise SystemExit('04 p10 ruling table header not found')
    di10, row10 = first_nonempty_row(data10, hi10 + 1)
    ni10, row10b = first_nonempty_row(data10, di10 + 1)
    p10_row = cell_checks(row10, [
        ('first_cell_is_label', lambda cs: len(cs) >= 3 and cs[0] == '第三方采购与付款方'),
        ('second_cell_has_payer_text', lambda cs: len(cs) >= 3 and '客户为采购与付款主体' in cs[1] and '按供应商账单结' in cs[1]),
        ('third_cell_has_confirm', lambda cs: len(cs) >= 3 and '客户确认' in cs[2]),
        ('no_cells_empty', lambda cs: all(c for c in cs[:3])),
    ])
    p10_next = cell_checks(row10b, [
        ('first_cell_has_market_and_caliber', lambda cs: len(cs) >= 3 and '目标市场' in cs[0] and '口径' in cs[0]),
        ('second_cell_has_pending', lambda cs: len(cs) >= 3 and '未提供前相关指标保持PENDING' in cs[1]),
        ('third_cell_has_customer_confirm', lambda cs: len(cs) >= 3 and '客户提供与确认' in cs[2]),
        ('no_cells_empty', lambda cs: all(c for c in cs[:3])),
    ])

    tab9cr, data9cr, hi9cr = find_table_with_header(p9, ['CR', '客户要求'])
    if tab9cr is None:
        raise SystemExit('04 p9 CR table header not found')
    row_cr11 = None
    for row in data9cr[hi9cr + 1:]:
        if any(norm(c) == 'CR-011' for c in row):
            row_cr11 = row
            break
    if row_cr11 is None:
        raise SystemExit('04 p9 CR-011 row not found')
    cr11 = cell_checks(row_cr11, [
        ('id_cell_is_CR-011', lambda cs: 'CR-011' in cs),
        ('has_requirement_text', lambda cs: any('列明开发费都包含在内' in c for c in cs)),
        ('has_deliverable', lambda cs: any('开发范围与费用表' in c for c in cs)),
        ('has_mapping', lambda cs: 'SD-07' in cs),
        ('has_quote_status', lambda cs: any('已包含但待核价' in c for c in cs)),
        ('has_confirm_status', lambda cs: '待确认' in cs),
    ])

    tab9rul, data9rul, hi9rul = find_table_with_header(p9, HEADER_04)
    if tab9rul is None:
        raise SystemExit('04 p9 ruling table header not found')
    last_row = data9rul[-1]
    ruling_last = cell_checks(last_row, [
        ('first_cell_is_monthly_ops', lambda cs: len(cs) >= 3 and cs[0] == '月度运营工作量与月度费用'),
        ('second_cell_has_review_note', lambda cs: len(cs) >= 3 and '编制建议值仅供审核' in cs[1]),
        ('third_cell_has_owner_confirm', lambda cs: len(cs) >= 3 and '项目负责人与客户确认' in cs[2]),
        ('no_cells_empty', lambda cs: all(c for c in cs[:3])),
    ])

    # 02 continuation pages 6-20: same scope/fields as before
    cont = list(range(6, 21))
    frag = []
    details = []
    for pg in cont:
        text = next(p['text'] for p in checks['02_FUNCTION_SCOPE_CONFIRMATION']['pages'] if p['page'] == pg)
        lines = [x.strip() for x in text.split('\n') if x.strip()]
        try:
            i = lines.index('客户意见')
        except ValueError:
            frag.append(pg)
            details.append({'page': pg, 'reason': 'header marker missing', 'complete': False})
            continue
        nxt = lines[i + 1]
        ok = bool(re.fullmatch(r'FR-\d-\d{3}', nxt))
        if not ok:
            frag.append(pg)
        details.append({'page': pg, 'first_data_line': nxt, 'complete': ok})

    # --- self-test A: prepend rows, using the SAME production locators ---
    base_hi = find_header_row(data10, HEADER_04)
    base_di, base_row = first_nonempty_row(data10, base_hi + 1)
    base_cells = [norm(c) for c in base_row[:3]]
    offset_results = []
    for n in (0, 1, 5, 17):
        prefix = [['前置说明行%d' % i, '', ''] for i in range(n)]
        prefixed = prefix + data10
        hi = find_header_row(prefixed, HEADER_04)
        di, row = first_nonempty_row(prefixed, hi + 1) if hi is not None else (None, None)
        cells = [norm(c) for c in row[:3]] if row else None
        offset_results.append({
            'prepended_rows': n,
            'header_row_index': hi,
            'expected_header_row_index': base_hi + n,
            'first_data_row_index': di,
            'expected_first_data_row_index': base_di + n,
            'row_cells': cells,
            'pass': (hi == base_hi + n and di == base_di + n and cells == base_cells),
        })

    # --- self-test B: ordered header matching; shuffled order must fail ---
    data_row = ['第三方采购与付款方', '客户为采购与付款主体按供应商账单结，算', '客户确认']
    order_cases = [
        ('correct_order', ['事项', '当前处理', '确认方'], True),
        ('swap_first_two', ['当前处理', '事项', '确认方'], False),
        ('reverse', ['确认方', '当前处理', '事项'], False),
        ('swap_last_two', ['事项', '确认方', '当前处理'], False),
    ]
    order_results = []
    for name, header, should_match in order_cases:
        data = [header, data_row]
        hi = find_header_row(data, HEADER_04)
        matched = hi is not None
        order_results.append({
            'case': name,
            'header_cells': header,
            'should_match': should_match,
            'matched': matched,
            'header_row_index': hi,
            'pass': matched == should_match,
        })

    pdf_checks = {
        '04_p10_first_data_row': {
            'header_row_index': hi10,
            'first_data_row_index': di10,
            'first_data_row_cells': [norm(c) for c in row10[:3]],
            'first_data_row_checks': p10_row,
            'next_data_row_cells': [norm(c) for c in row10b[:3]],
            'next_data_row_checks': p10_next,
            'pass': p10_row['complete'] and p10_next['complete'],
        },
        '04_p9_CR_011': {'row_checks': cr11, 'pass': cr11['complete']},
        '04_p9_ruling_last_row': {
            'row_cells': [norm(c) for c in last_row[:3]],
            'row_checks': ruling_last,
            'pass': ruling_last['complete'],
        },
        '02_continuation': {
            'pages': cont,
            'fragment_pages': frag,
            'details': details,
            'pass': len(frag) == 0,
        },
    }

    self_tests = {
        'offset_prepend_rows': {
            'method': ('Use the production table locators (find_header_row / '
                       'first_nonempty_row) on in-memory table data with 0/1/5/17 '
                       'rows prepended before the real header. No customer file touched.'),
            'base_header_row_index': base_hi,
            'base_first_data_row_index': base_di,
            'base_row_cells': base_cells,
            'results': offset_results,
            'pass': all(r['pass'] for r in offset_results),
        },
        'header_order_negative': {
            'method': ('Call find_header_row on in-memory tables whose header cells '
                       'are shuffled. Only the exact order 事项/当前处理/确认方 may match.'),
            'results': order_results,
            'pass': all(r['pass'] for r in order_results),
        },
    }

    result = {
        'evidence_scope': 'Evidence-only rerun; no customer file is modified.',
        'inputs': {
            'pdf_04': {'path': os.path.relpath(pdf04, HERE), 'sha256': sha256(pdf04)},
            'pdf_02': {'path': os.path.relpath(pdf02, HERE), 'sha256': sha256(pdf02)},
            'render_checks_json': {'path': os.path.relpath(args.checks, HERE), 'sha256': sha256(args.checks)},
            'legacy_file': {'path': os.path.relpath(args.legacy, HERE), 'sha256': sha256(args.legacy)},
        },
        'legacy_check': {
            'preserved_original': legacy,
            'expression': "'第三方采购与付款方' in p10.split('\\n')[3:10]",
            'reproduced_result': legacy_reproduced,
            'failure_reason': ('列表成员判断比较未去空白的整行（"第三方采购与付款方 " 带行尾空格）'
                               '与已去空白的字面量；同时 [3:10] 是任意行窗口，不具备结构语义。'),
            'raw_window_3_10_repr': [repr(x) for x in legacy_window],
            'string_raw_index': string_index,
        },
        'pdf_checks': pdf_checks,
        'self_tests': self_tests,
        'manual_review': {
            'reviewer_observed': 'Reviewer 目视 p10 PNG：裁决表首行完整，后续行未拆开，签署栏完整。',
            'agent_recheck': ('Agent 复看 p10 PNG 与 PDF 表格单元：重复表头后首条数据为“第三方采购与付款方”，'
                              '其行内第二/第三格为“客户为采购与付款主体…/客户确认”；下一条“目标市场…口径”行整行同页。'),
            'png': 'renders/pages/04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES/page-10.png',
            'classification': '人工目视，仅作为自动检查的独立佐证，不替代 pdf_checks 或 self_tests 结果。',
        },
        'conclusion': {
            'legacy_false_is_false_negative': True,
            'all_pdf_checks_pass': all(v['pass'] for v in pdf_checks.values()),
            'all_self_tests_pass': all(v['pass'] for v in self_tests.values()),
            'statement': ('旧 false 是检查条件误判；新检查动态定位表头/数据行并按行内单元格验证。'
                          '偏移自测直接调用生产表格定位函数；乱序表头负向测试应且确实不匹配。'),
        },
    }
    with open(args.out, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(result, f, ensure_ascii=False, indent=1)
    print('wrote', args.out)
    print('legacy reproduced:', legacy_reproduced, 'string raw index:', string_index)
    print('p10 header/first data row:', hi10, di10)
    print('pdf checks pass:', result['conclusion']['all_pdf_checks_pass'])
    print('offset test:', [(r['prepended_rows'], r['header_row_index'], r['first_data_row_index'], r['pass']) for r in offset_results])
    print('header order negative:', [(r['case'], r['matched'], r['pass']) for r in order_results])
    print('self tests pass:', result['conclusion']['all_self_tests_pass'])


if __name__ == '__main__':
    main()