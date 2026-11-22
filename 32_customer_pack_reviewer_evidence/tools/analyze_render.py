import fitz, re, json, os
BASE='pdf/'
docs=[f for f in os.listdir(BASE) if f.endswith('.pdf')]
out={}
os.makedirs('png',exist_ok=True)
for f in sorted(docs):
    doc=fitz.open(BASE+f)
    key=f[:-4]
    os.makedirs('png/'+key,exist_ok=True)
    pages=[]
    all_fonts=set()
    for i,p in enumerate(doc):
        txt=p.get_text('text')
        # footer / header lines
        lines=[l.strip() for l in txt.split('\n') if l.strip()]
        foot_area=[b for b in p.get_text('blocks') if b[3]>p.rect.height-45]
        head_area=[b for b in p.get_text('blocks') if b[1]<45]
        # overflow: text outside page
        ov=[b for b in p.get_text('blocks') if b[0]<-1 or b[1]<-1 or b[2]>p.rect.width+1 or b[3]>p.rect.height+1]
        # drawings outside page
        d_ov=0
        for d in p.get_drawings():
            r=d['rect']
            if r.x0<-0.5 or r.y0<-0.5 or r.x1>p.rect.width+0.5 or r.y1>p.rect.height+0.5:
                d_ov+=1
        # headings by font
        heads=[]
        for b in p.get_text('dict')['blocks']:
            for l in b.get('lines',[]):
                for s in l['spans']:
                    if ('SimHei' in s['font'] or '黑体' in s['font']) and s['size']>=13.5:
                        heads.append({'text':s['text'].strip(),'size':round(s['size'],1),'y':round(s['bbox'][1],1)})
        all_fonts.update(x[3] for x in p.get_fonts())
        # page number
        pn=re.search(r'第\s*(\d+)\s*页\s*/\s*共\s*(\d+)\s*页', txt)
        pages.append({
            'page':i+1,'size':[round(p.rect.width,1),round(p.rect.height,1)],
            'first_lines':lines[:2],'last_lines':lines[-2:],
            'page_number':[int(pn.group(1)),int(pn.group(2))] if pn else None,
            'headings':heads,'text_overflow':len(ov),'drawing_overflow':d_ov,
            'footer_text': ' | '.join(b[4].strip().replace('\n',' ') for b in foot_area),
            'header_text': ' | '.join(b[4].strip().replace('\n',' ') for b in head_area),
            'chars':len(txt)
        })
        pix=p.get_pixmap(dpi=100)
        pix.save('png/%s/page-%02d.png'%(key,i+1))
    out[key]={'pages':len(doc),'fonts':sorted(all_fonts),'page_data':pages,
              'pdf_text_all':''.join(p.get_text('text') for p in doc)}
json.dump(out,open('render_analysis.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
print('ok', {k:v['pages'] for k,v in out.items()})
