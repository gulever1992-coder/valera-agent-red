# Схема-референс лестничной клетки для Flow (не графика игры): по эскизу пользователя, геометрия = путь Валеры на карте D.
# Мир: 640 лог. px в ширину, пол G0=300, 6 маршей по 140; картинка покрывает y от G0-1076 до G0+60 (1136), масштаб 1.2.
import os
from PIL import Image, ImageDraw
K = 1.2; G0 = 300; DY = 140; N = 6; XW = 56; XF = 160; XR = 400; XE = 500; Y0 = G0 - 1076
W, H = 768, 1364
im = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(im)
P = lambda x, y: (x * K, (y - Y0) * K)
yOf = lambda n: G0 - DY * n
d.rectangle([P(0, Y0), P(XW, G0)], fill=(150, 150, 150), outline='black', width=4)            # стена слева
d.rectangle([P(0, G0), P(640, G0 + 60)], fill=(200, 200, 200), outline='black', width=4)       # пол
d.rectangle([P(520, G0 - 105), P(600, G0)], outline='black', width=5); d.line([P(560, G0 - 105), P(560, G0)], fill='black', width=3)   # двери внизу
d.rectangle([P(530, yOf(N) - 100), P(590, yOf(N))], outline='black', width=5)                  # дверь на крышу
for n in range(1, N + 1):
    odd = n % 2 == 1; lo, hi = yOf(n - 1), yOf(n)
    xa, xb = (XR, XF) if odd else (XF, XR)                                                     # низ -> верх
    steps = 10; pts = []
    for i in range(steps):
        x0 = xa + (xb - xa) * i / steps; x1 = xa + (xb - xa) * (i + 1) / steps; y = lo + (hi - lo) * (i + 1) / steps
        pts += [P(x0, lo + (hi - lo) * i / steps), P(x0, y), P(x1, y)]
    d.line(pts, fill='black', width=4)
    d.line([P(xa, lo + 14), P(xb, hi + 14)], fill='black', width=3)                            # косоур
    d.line([P(xa, lo - 36), P(xb, hi - 36)], fill='black', width=3)                            # перила
    for i in range(0, steps + 1, 2):
        x = xa + (xb - xa) * i / steps; y = lo + (hi - lo) * i / steps; d.line([P(x, y), P(x, y - 36)], fill='black', width=2)
    # площадка n
    if n == N: x0, x1 = XR, 640
    elif odd: x0, x1 = XW, XF
    else: x0, x1 = XR, XE
    d.rectangle([P(x0, hi), P(x1, hi + 10)], fill='black')
    d.line([P(x0, hi - 36), P(x1, hi - 36)], fill='black', width=3)
    for x in (x0 + 4, (x0 + x1) / 2, x1 - 4): d.line([P(x, hi), P(x, hi - 36)], fill='black', width=2)
im.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'art_src', 'l7', 'v4_stref.png')); print('ok')
