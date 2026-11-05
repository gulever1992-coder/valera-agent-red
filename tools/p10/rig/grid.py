import sys
from PIL import Image, ImageDraw
im = Image.open(sys.argv[1]).convert('RGB'); d = ImageDraw.Draw(im); W, H = im.size
x0, y0, x1, y1 = [int(v) for v in sys.argv[3:7]] if len(sys.argv) > 6 else (0, 0, W, H)
st = int(sys.argv[7]) if len(sys.argv) > 7 else 50
for x in range(0, W, st): d.line([(x, 0), (x, H)], fill=(0, 0, 255) if x % 100 == 0 else (90, 170, 255))
for y in range(0, H, st): d.line([(0, y), (W, y)], fill=(0, 0, 255) if y % 100 == 0 else (90, 170, 255))
for x in range(0, W, 100):
    for y in range(0, H, 200): d.text((x + 2, y + 2), '%d,%d' % (x, y), fill=(220, 0, 0))
im.crop((x0, y0, x1, y1)).save(sys.argv[2])
