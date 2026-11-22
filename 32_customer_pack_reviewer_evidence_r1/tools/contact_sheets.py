from PIL import Image
import os, math
for d in sorted(os.listdir('png')):
    p='png/'+d
    fs=sorted(f for f in os.listdir(p) if f.endswith('.png'))
    ims=[Image.open(os.path.join(p,f)) for f in fs]
    w=320
    thumbs=[]
    for im in ims:
        h=int(im.height*w/im.width)
        thumbs.append(im.resize((w,h)))
    cols=4; rows=math.ceil(len(thumbs)/cols)
    ch=max(t.height for t in thumbs)+6
    sheet=Image.new('RGB',(cols*(w+8)+8, rows*ch+8),'white')
    for i,t in enumerate(thumbs):
        r,c=divmod(i,cols)
        sheet.paste(t,(8+c*(w+8), 8+r*ch))
    out='contact_%s.png'%d
    sheet.save(out)
    print(out, sheet.size, len(ims))
