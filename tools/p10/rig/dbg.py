import sys; sys.path.insert(0, 'tools/p10/rig')
from common import *
from PIL import ImageDraw
name = sys.argv[1]; a = load(name).astype('uint8'); im = Image.fromarray(a); d = ImageDraw.Draw(im)
for x in range(0, CW, 50): d.line([(x, 0), (x, CH)], fill=(0, 160, 255) if x % 100 else (0, 0, 255), width=1)
for y in range(0, CH, 50): d.line([(0, y), (CW, y)], fill=(0, 160, 255) if y % 100 else (0, 0, 255), width=1)
for x in range(0, CW, 100): d.text((x + 2, 2), str(x), fill=(255, 0, 0))
for y in range(0, CH, 100): d.text((2, y + 2), str(y), fill=(255, 0, 0))
for k, (x, y) in B.items(): d.ellipse([x - 5, y - 5, x + 5, y + 5], fill=(255, 0, 0)); d.text((x + 6, y - 6), k, fill=(255, 0, 0))
c = [int(v) for v in sys.argv[2:6]] if len(sys.argv) > 5 else [0, 0, CW, CH]
im.crop(c).save(sys.argv[6] if len(sys.argv) > 6 else 'C:/Users/gulev/AppData/Local/Temp/claude/C--Users-gulev-CRM/b008e84b-e6be-40a8-a3e7-0bf39bd9c884/scratchpad/dbg.png')
