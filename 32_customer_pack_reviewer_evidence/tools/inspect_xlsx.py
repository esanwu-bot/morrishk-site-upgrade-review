import openpyxl, json, re
from openpyxl.utils import get_column_letter
P='E:/workspace/.scratch/morrishk-commercial-signoff/31_customer_commercial_pack/04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES.xlsx'
wb=openpyxl.load_workbook(P)
M='E:/workspace/.scratch/morrishk-commercial-signoff/31_customer_commercial_pack/_internal/90_DELIVERY_TRACEABILITY_MATRIX.xlsx'
wb2=openpyxl.load_workbook(M)
out=['# 04 报价工作簿与内部矩阵 — 实际单元格读取','']
def dump(wb,title):
    out.append('## '+title); out.append('')
    for ws in wb.worksheets:
        out.append('### 工作表：`%s`'%ws.title)
        out.append('- 维度：%s；最大行 %d；最大列 %d'%(ws.dimensions,ws.max_row,ws.max_column))
        out.append('- 冻结窗格：`%s`；自动筛选：`%s`；合并单元格：%s'%(ws.freeze_panes, ws.auto_filter.ref, [str(r) for r in ws.merged_cells.ranges]))
        out.append('- 打印：方向=%s，纸张=%s，fitToWidth=%s，fitToHeight=%s，打印区域=%s，标题行=%s'%(
            ws.page_setup.orientation, ws.page_setup.paperSize, ws.page_setup.fitToWidth,
            ws.page_setup.fitToHeight, ws.print_area, ws.print_title_rows))
        # formulas
        formulas=[]
        for row in ws.iter_rows():
            for c in row:
                if isinstance(c.value,str) and c.value.startswith('='):
                    formulas.append((c.coordinate,c.value))
        out.append('- 公式单元格：%d %s'%(len(formulas), formulas[:5]))
        # headers row2
        hdr=[ws.cell(2,j).value for j in range(1,ws.max_column+1)]
        out.append('- 第 2 行表头：`%s`'%hdr)
        # widths
        widths={get_column_letter(j):round(ws.column_dimensions[get_column_letter(j)].width or 0,1) for j in range(1,ws.max_column+1)}
        out.append('- 列宽：%s'%widths)
        out.append('')
    out.append('')
dump(wb,'04 客户报价工作簿')
# key data rows per sheet
def rows(ws, limit=None, idcol=1):
    hdr=[ws.cell(2,j).value for j in range(1,ws.max_column+1)]
    data=[]
    for r in range(3,ws.max_row+1):
        vals=[ws.cell(r,j).value for j in range(1,ws.max_column+1)]
        if any(v not in (None,'') for v in vals):
            data.append(vals)
    return hdr,data
out.append('## 关键数据行（客户报价工作簿）')
for name in wb.sheetnames:
    ws=wb[name]; hdr,data=rows(ws)
    out.append('')
    out.append('### `%s` — %d 行数据'%(name,len(data)))
    out.append('`'+str(hdr)+'`')
    limit=len(data) if len(data)<=12 else 8
    for v in data[:limit]:
        out.append('`'+str(v)+'`')
    if len(data)>limit:
        out.append('…（其余 %d 行未逐行展开，见原表）'%(len(data)-limit))
out.append('')
out.append('## 客户填写区域（报价工作簿）')
for name in wb.sheetnames:
    ws=wb[name]; hdr=[ws.cell(2,j).value for j in range(1,ws.max_column+1)]
    idx=[j+1 for j,h in enumerate(hdr) if h in ('客户确认状态','客户意见','客户选择','负责人确认值','合同承诺值','客户确认意见','确认意见')]
    if idx:
        out.append('- `%s`：第 %s 列（%s）；数据行 3–%d'%(name,[get_column_letter(j) for j in idx],[hdr[j-1] for j in idx],ws.max_row))
# matrix
dump(wb2,'内部 90 追溯矩阵')
out.append('## 矩阵数据明细')
for name in wb2.sheetnames:
    ws=wb2[name]; hdr,data=rows(ws)
    out.append('')
    out.append('### `%s` — %d 行'%(name,len(data)))
    out.append('`'+str(hdr)+'`')
    for v in data[:5]:
        out.append('`'+str(v)+'`')
    if len(data)>5: out.append('…（其余 %d 行）'%(len(data)-5))
open('xlsx_inspection.md','w',encoding='utf-8').write('\n'.join(out))
print('written', len(out),'lines')
