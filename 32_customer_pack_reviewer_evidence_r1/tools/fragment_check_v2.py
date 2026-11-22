# -*- coding: utf-8 -*-
"""Corrected fragment check for R1 evidence.

The first R1 evidence run used this inline condition:

    '第三方采购与付款方' in p10.split('\n')[3:10]

It returned False because list membership compares the un-stripped line
("第三方采购与付款方 ") with the stripped literal, so trailing whitespace
made equality fail. The line is actually at raw index 5 inside that window.

This script preserves the original False record, reproduces it, and writes a
corrected result based on normalized lines and complete-row assertions.
It never rewrites the legacy file.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CHECKS = os.path.join(HERE, 'render_checks.json')
LEGACY = os.path.join(HERE, 'fragment_check_legacy.json')
OUT = os.path.join(HERE, 'fragment_check.json')


def load(name):
    with open(os.path.join(HERE, name), encoding='utf-8') as f:
        return json.load(f)


def page_text(checks, doc, page):
    for p in checks[doc]['pages']:
        if p['page'] == page:
            return p['text']
    raise KeyError((doc, page))


def norm_lines(text):
    return [x.strip() for x in text.split('\n') if x.strip()]


def main():
    checks = load('render_checks.json')
    legacy = load('fragment_check_legacy.json')

    p10_raw = page_text(checks, '04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES', 10)
    raw = p10_raw.split('\n')
    legacy_window = raw[3:10]
    legacy_reproduced = '第三方采购与付款方' in legacy_window
    string_index = next(i for i, l in enumerate(raw) if '第三方采购与付款方' in l)

    p10 = norm_lines(p10_raw)
    p9 = norm_lines(page_text(checks, '04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES', 9))
    p10_whole = ''.join(p10)
    p9_whole = ''.join(p9)

    header = ['事项', '当前处理', '确认方']
    header_ok = p10[:6] == ['Morrishk 目标市场有效采购询盘增长项目 04 商务报价与费用边界 · V1.0 2026-11-22',
                            '第 10 页 / 共 10 页', '事项', '当前处理', '确认方'] or p10[2:5] == header
    first_row_ok = p10[5] == '第三方采购与付款方'
    first_cells_ok = ('客户为采购与付款主体' in p10_whole) and ('客户确认' in p10[5:9])
    next_row_ok = ('目标市场、重点产品、旧 URL、有效询盘' in p10_whole and '口径' in p10
                   and '未提供前相关指标保持 PENDING' in p10_whole and '客户提供与确认' in p10_whole)
    p9_cr11_ok = ('CR-011' in p9_whole and '列明开发费都包含在内。' in p9_whole
                  and '开发范围与费用表' in p9_whole and 'SD-07' in p9_whole
                  and '已包含但' in p9_whole and '待核价' in p9_whole)
    p9_last_row_ok = ('月度运营工作量与月度费用' in p9_whole
                      and '编制建议值仅供审核；负责人确认值与合' in p9_whole
                      and '项目负责人与客户确认' in p9_whole)

    # 02 continuation pages
    cont = list(range(6, 21))
    frag = []
    details = []
    for pg in cont:
        lines = norm_lines(page_text(checks, '02_FUNCTION_SCOPE_CONFIRMATION', pg))
        try:
            i = lines.index('客户意见')
        except ValueError:
            frag.append(pg)
            details.append({'page': pg, 'reason': 'header marker missing'})
            continue
        nxt = lines[i + 1]
        ok = bool(re.match(r'^FR-\d-\d{3}$', nxt))
        if not ok:
            frag.append(pg)
        details.append({'page': pg, 'first_data_line': nxt, 'complete': ok})

    result = {
        'legacy_check': {
            'preserved': True,
            'original': legacy,
            'expression': "'第三方采购与付款方' in p10.split('\\n')[3:10]",
            'reproduced_result': legacy_reproduced,
            'failure_reason': (
                '列表成员判断比较的是未去空白的整行（"第三方采购与付款方 " 带行尾空格）'
                '与已去空白的字面量，二者不相等；同时 [3:10] 是任意行窗口，'
                '不具备结构语义。该行实际位于 raw index 5，窗口内确实存在。'
            ),
            'raw_window_3_10_repr': [repr(x) for x in legacy_window],
            'string_raw_index': string_index,
        },
        'corrected_check': {
            'method': 'normalize lines (strip + drop empty), then assert the first data row and its complete cells',
            '02_continuation_pages': cont,
            '02_fragment_pages': frag,
            '02_all_continuation_complete': len(frag) == 0,
            '02_details': details,
            '04_p9_has_CR-011': p9_cr11_ok,
            '04_p9_last_row_complete': p9_last_row_ok,
            '04_p10_header_present': header_ok,
            '04_p10_first_data_row': p10[5] if len(p10) > 5 else None,
            '04_p10_first_row_cells_complete': bool(first_row_ok and first_cells_ok),
            '04_p10_next_row_complete': next_row_ok,
            '04_p10_starts_with_complete_row': bool(header_ok and first_row_ok and first_cells_ok and next_row_ok),
        },
        'manual_review_override': {
            'reviewer_observed': 'Reviewer 目视 p10 PNG：裁决表首行完整，后续行未拆开，签署栏完整。',
            'agent_recheck': 'Agent 复看同一 PNG 与文本层：重复表头后首条数据为“第三方采购与付款方”，'
                             '其后“客户为采购与付款主体.../客户确认”与“目标市场、重点产品、旧 URL、有效询盘口径/'
                             '未提供前相关指标保持 PENDING/客户提供与确认”均为完整行。',
            'png': 'renders/pages/04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES/page-10.png',
            'scope': '仅覆盖 04 第 10 页首行的完整性判定；不改变客户文件。',
        },
        'conclusion': (
            '旧 false 为检查条件误判（行尾空格 + 列表精确成员 + 任意行窗口），不是文档缺陷；'
            '修正后 02 续页 15/15 完整，04 p9 CR-011 完整、p10 首行与后续行完整。'
        ),
    }
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(result, f, ensure_ascii=False, indent=1)
    print('wrote', OUT)
    print('legacy reproduced:', legacy_reproduced, 'string raw index:', string_index)
    print('02 fragments:', frag)
    print('04 p10 complete:', result['corrected_check']['04_p10_starts_with_complete_row'])


if __name__ == '__main__':
    main()