# крупный кроп канона с сеткой: zoom.py img out x0 y0 x1 y1 k step
import sys
from PIL import Image, ImageDraw
im = Image.open(sys.argv[1]).convert('RGB'); x0, y0, x1, y1 = [int(v) for v in sys.argv[3:7]]; k = float(sys.argv[7]); st = int(sys.argv[8])
c = im.crop((x0, y0, x1, y1)).resize((int((x1 - x0) * k), int((y1 - y0) * k))); d = ImageDraw.Draw(c)
for x in range((x0 // st + 1) * st, x1, st): d.line([((x - x0) * k, 0), ((x - x0) * k, c.size[1])], fill=(0, 0, 255) if x % 100 == 0 else (120, 190, 255))
for y in range((y0 // st + 1) * st, y1, st): d.line([(0, (y - y0) * k), (c.size[0], (y - y0) * k)], fill=(0, 0, 255) if y % 100 == 0 else (120, 190, 255))
for x in range((x0 // 100 + 1) * 100, x1, 100):
    for y in range((y0 // 100 + 1) * 100, y1, 100): d.text(((x - x0) * k + 2, (y - y0) * k + 2), '%d,%d' % (x, y), fill=(255, 0, 0))
c.save(sys.argv[2])
