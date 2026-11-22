import fitz, re, json, os
BASE='pdf/'
res={}
for f in sorted(os.listdir(BASE)):
    if not f.endswith('.pdf'): continue
    doc=fitz.open(BASE+f); key=f[:-4]
    pages=[]
    for i,p in enumerate(doc):
        txt=p.get_text('text')
        spans=[]
        for b in p.get_text('dict')['blocks']:
            for l in b.get('lines',[]):
                for s in l['spans']:
                    spans.append({'t':s['text'].strip(),'sz':round(s['size'],1),'b':bool(s['flags'] & 16),'y':round(s['bbox'][1],1)})
        big=[s for s in spans if s['sz']>=13.5 and s['t']]
        pages.append({'page':i+1,'text':txt,'spans':spans,'big':big,'h':p.rect.height})
    res[key]={'pages':pages}
    # FR ids in 02
    if key.startswith('02_'):
        alltext=''.join(pg['text'] for pg in pages)
        ids=set(re.findall(r'FR-\d-\d{3}',alltext))
        res[key]['fr_ids_in_pdf']=len(ids)
        res[key]['header_repeat_pages']=[pg['page'] for pg in pages if ('功能域' in pg['text'] and '业务说明' in pg['text'] and '客户选择' in pg['text'])]
    # signature roles per page
    roles=['客户项目负责人','客户验收负责人','乙方项目负责人','客户授权代表','乙方授权代表','签署']
    sig={}
    for pg in pages:
        for r in roles:
            if r in pg['text']: sig.setdefault(r,[]).append(pg['page'])
    res[key]['signature_pages']=sig
    # orphan check: largest heading is last content on page (within bottom 90px and no spans below larger than 0)
    orphans=[]
    for pg in pages:
        if not pg['big']: continue
        lastbig=pg['big'][-1]
        body_below=[s for s in pg['spans'] if s['y']>lastbig['y']+3 and s['t'].strip() and s['sz']<13.5 and s['y']<pg['h']-45]
        if not body_below and lastbig['y']>700:
            orphans.append({'page':pg['page'],'heading':lastbig['t'],'y':lastbig['y']})
    res[key]['orphan_headings']=orphans
json.dump(res,open('render_checks.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
print('ok')
for k,v in res.items():
    print(k,'sig=',{r:v['signature_pages'].get(r) for r in ['客户项目负责人','客户验收负责人','乙方项目负责人','客户授权代表','乙方授权代表','签署']},'orphans=',v['orphan_headings'])
    if 'fr_ids_in_pdf' in v: print('  fr_ids=',v['fr_ids_in_pdf'],'hdr_repeat_pages=',v['header_repeat_pages'])
