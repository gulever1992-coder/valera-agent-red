from PIL import Image, ImageDraw
import random

random.seed(2004)
W=H=256
im=Image.new('RGB',(W,H),(11,19,28)); d=ImageDraw.Draw(im)

# cold evening sky, deliberately painted at low resolution for a 16-bit look
for y in range(H):
    if y<126:
        t=y/126
        col=(int(16-7*t),int(34-15*t),int(49-17*t))
    else:
        t=(y-126)/130
        col=(int(15-6*t),int(24-10*t),int(31-12*t))
    d.line((0,y,W,y),fill=col)

# distant block apartments
for x,bw,top in [(-16,68,39),(43,70,27),(111,63,43),(169,78,22),(238,46,47)]:
    d.rectangle((x,top,x+bw,143),fill=(31,42,52),outline=(10,17,23),width=2)
    d.rectangle((x+3,top+3,x+bw-3,top+8),fill=(45,55,64))
    for yy in range(top+14,135,12):
        for xx in range(x+7,x+bw-5,13):
            if random.random()<.62:
                lit=random.random()<.24
                d.rectangle((xx,yy,xx+7,yy+6),fill=(112,70,39) if lit else (17,27,35))
                if lit: d.point((xx+2,yy+2),fill=(224,143,65))

# pavement / street perspective
d.polygon([(0,137),(256,137),(256,256),(0,256)],fill=(18,27,33))
for yy in [150,165,185,211,242]: d.line((0,yy,256,yy),fill=(27,37,42))
for x in range(-80,340,35): d.line((128,137,x,256),fill=(25,35,40))

# archway and shadowed watchers
d.rectangle((173,80,238,151),fill=(23,29,33),outline=(8,13,17),width=3)
d.arc((179,88,232,145),180,360,fill=(47,52,54),width=4)
d.rectangle((179,112,232,150),fill=(4,8,12))
for x,y in [(187,121),(202,116),(216,123),(226,119)]:
    d.ellipse((x-4,y-8,x+4,y),fill=(8,11,14))
    d.polygon([(x-6,y),(x+6,y),(x+8,143),(x-7,143)],fill=(7,10,13))
    d.rectangle((x+3,y-1,x+5,y+1),fill=(255,76,33))
    d.point((x+5,y-1),fill=(255,201,78))

# kiosks, rusty metal, lamps
for x in [8,72]:
    d.rectangle((x,107,x+33,148),fill=(47,53,53),outline=(13,19,23),width=2)
    d.rectangle((x+3,112,x+30,129),fill=(28,45,48))
    d.line((x+4,133,x+29,133),fill=(122,63,35),width=2)
    for _ in range(8):
        px=random.randrange(x+2,x+31); py=random.randrange(108,147)
        d.point((px,py),fill=(136,68,37))
for x in [31,151]:
    d.line((x,77,x,146),fill=(34,38,39),width=3)
    d.rectangle((x-2,79,x+3,91),fill=(92,79,55))
    d.ellipse((x-8,89,x+8,106),fill=(151,86,36))
    d.ellipse((x-5,92,x+5,103),fill=(245,151,60))
    # pooled lamp glow
    d.ellipse((x-28,170,x+29,185),fill=(54,42,31))
    d.ellipse((x-17,173,x+18,181),fill=(114,65,34))

# foreground reflective puddles
for box in [(4,206,81,224),(144,217,251,241),(79,239,148,252)]:
    d.ellipse(box,fill=(16,40,49),outline=(52,82,85))
    x1,y1,x2,y2=box
    for _ in range(8):
        x=random.randrange(x1+4,x2-3); y=random.randrange(y1+2,y2-2)
        d.line((x,y,min(x+random.randrange(3,12),x2-2),y),fill=(91,74,47))

# rain pixels, behind and across the hero
for _ in range(125):
    x=random.randrange(W); y=random.randrange(25,H)
    shade=random.choice([(48,75,85),(65,96,104),(35,59,68)])
    d.line((x,y,x-1,y+random.choice([2,3,4])),fill=shade)

# exact supplied Valera sprite: a front-facing, hands-in-pockets pose from source sheet
sheet=Image.open('art_src/l7/pick_valera.jpg').convert('RGBA')
sprite=sheet.crop((500,330,650,520))
pix=sprite.load()
for y in range(sprite.height):
    for x in range(sprite.width):
        r,g,b,a=pix[x,y]
        if g>170 and g>r*1.35 and g>b*1.25: pix[x,y]=(r,g,b,0)
# trim transparent excess and scale crisply
box=sprite.getbbox(); sprite=sprite.crop(box)
sprite=sprite.resize((112,142),Image.Resampling.NEAREST)
# soft reflected outline shadow then sprite
alpha=sprite.getchannel('A')
shadow=Image.new('RGBA',sprite.size,(0,0,0,0)); shadow.putalpha(alpha.point(lambda a: a//2))
im.paste(shadow,(73,106),shadow)
im.paste(sprite,(72,98),sprite)
d=ImageDraw.Draw(im)
for _ in range(32):
    x=random.randrange(72,185); y=random.randrange(96,246)
    if random.random()<.7: d.line((x,y,x-1,y+3),fill=(100,125,130))

# scale to requested size without smoothing
im.resize((1024,1024),Image.Resampling.NEAREST).save('art_src/covers/cov2.png')
