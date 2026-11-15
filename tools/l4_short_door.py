# Дверь выхода в закрытом зале ур.4 меньше в 1.5 раза (пропорционально): art_src/iwall2/ibg_v3.jpg -> ibg_v3s.jpg
# Черновик для чистовой правки во Flow: место старых двери/таблички/лампы закрывается стеной с правого края
# (масштаб по шагу стёжки в перспективе), сверху — дверь, табличка и лампа из оригинала, уменьшенные в 1.5 раза.
import os, numpy as np
from PIL import Image, ImageDraw, ImageFilter
R = os.path.join(os.path.dirname(__file__), '..')
src = Image.open(os.path.join(R, 'art_src/iwall2/ibg_v3.jpg')).convert('RGB')
a = np.array(src).astype(np.float32); n = a.copy()
K = 1 / 1.5
def lin(x, x0, y0, x1, y1): return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
per = lambda x: lin(x, 183, 80, 375, 60)
neon = lambda x: lin(x, 150, 50, 430, 135) + 10
bot = lambda x: lin(x, 193, 648, 348, 560)
# 1) стена на месте двери, таблички и лампы: столбцы 186..356 от неона до пола
SX0, SX1, SY0, SY1 = 356, 428, 140, 500                     # чистая стена между дверью и колонной
for x in range(186, 357):
    k = per(x) / per(392)                                   # во сколько раз крупнее узор в этом столбце
    sx = SX0 + int(((x - 186) / k) % (SX1 - SX0))
    for y in range(int(neon(x)), int(bot(x)) + 6):
        sy = SY0 + int(((y - SY0) / k) % (SY1 - SY0))
        n[y, x] = a[sy, sx]
# 2) дверь, табличка, лампа — пропорционально меньше
def piece(box, poly=None):
    p = src.crop(box).convert('RGBA')
    if poly:
        m = Image.new('L', p.size, 0); ImageDraw.Draw(m).polygon([(x - box[0], y - box[1]) for x, y in poly], fill=255); p.putalpha(m)
    return p.resize((round(p.width * K), round(p.height * K)), Image.LANCZOS)
door = piece((188, 204, 354, 652), [(190, 206), (352, 220), (352, 566), (190, 652)])
sign = piece((243, 162, 327, 218)); lamp = piece((250, 70, 318, 168))
out = Image.fromarray(n.clip(0, 255).astype(np.uint8)).convert('RGBA')
dx = 213; dy = round(bot(dx) - 452 * K + 4)                  # низ левого края двери на линии пола
out.alpha_composite(door, (dx, dy))
cx = dx + door.width // 2
out.alpha_composite(sign, (cx - sign.width // 2, dy - sign.height - 4))
out.alpha_composite(lamp, (cx - lamp.width // 2 + 4, dy - sign.height - lamp.height - 2))
out.convert('RGB').save(os.path.join(R, 'art_src/iwall2/ibg_v3s.jpg'), quality=95)
print('door', door.size, 'at', dx, dy)
