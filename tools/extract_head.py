from PIL import Image
from collections import deque
im=Image.open('tools/valera_sheet.jpg').convert('RGB')
def isbg(c):
    r,g,b=c
    return (b-r)>=14 and b>95 and b<200 and abs(g-(r+b)/2)<14
def extract(box, out, scale_to=None):
    cr=im.crop(box); w,h=cr.size; px=cr.load()
    rgba=Image.new('RGBA',(w,h)); o=rgba.load()
    bg=[[False]*h for _ in range(w)]
    q=deque()
    for x in range(w):
        for y in (0,h-1): q.append((x,y))
    for y in range(h):
        for x in (0,w-1): q.append((x,y))
    while q:
        x,y=q.popleft()
        if x<0 or y<0 or x>=w or y>=h or bg[x][y]: continue
        if not isbg(px[x,y]): continue
        bg[x][y]=True
        q.extend([(x+1,y),(x-1,y),(x,y+1),(x,y-1)])
    for x in range(w):
        for y in range(h):
            r,g,b=px[x,y]
            o[x,y]=(r,g,b,0 if bg[x][y] else 255)
    # erode 1px halo
    a=rgba.copy(); ao=a.load()
    for x in range(1,w-1):
        for y in range(1,h-1):
            if o[x,y][3] and sum(1 for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)) if o[x+dx,y+dy][3]==0)>=2:
                ao[x,y]=(0,0,0,0)
    a.save(out)
    return a
# head only (hair to beard), sheet frame 1
extract((100,92,232,222),'assets/valera_head.png')
# full body frame for reference/portrait
extract((60,85,290,510),'tools/valera_full.png')
