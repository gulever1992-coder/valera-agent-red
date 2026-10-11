# Схема-референс «Цеха сортировки» (карта D, вертикальный подъём) для Flow — не графика игры.
# Мир: 640 лог. px, пол G0=300; картинка 768x1364 покрывает y от -776 до 360, масштаб 1.2.
import os
from PIL import Image, ImageDraw
K = 1.2; Y0 = -776; W, H = 768, 1364
im = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(im)
P = lambda x, y: (x * K, (y - Y0) * K)
def box(x0, y0, x1, y1, fill=None, w=4): d.rectangle([P(x0, y0), P(x1, y1)], fill=fill, outline='black', width=w)
def plat(x0, x1, y, th=10, rail=True):
    d.rectangle([P(x0, y), P(x1, y + th)], fill='black')
    if rail:
        d.line([P(x0, y - 34), P(x1, y - 34)], fill='black', width=3)
        n = max(2, int((x1 - x0) / 50))
        for i in range(n + 1): x = x0 + (x1 - x0) * i / n; d.line([P(x, y), P(x, y - 34)], fill='black', width=2)
box(0, 300, 640, 360, (200, 200, 200))                                        # пол
d.polygon([P(540, Y0), P(640, Y0), P(640, 334), P(540, 300)], fill=(225, 225, 225), outline='black')   # правая стена в перспективе
d.polygon([P(554, 190), P(632, 160), P(632, 328), P(554, 303)], fill=(170, 170, 170), outline='black'); d.line([P(593, 175), P(593, 315)], fill='black', width=3)   # двери справа
d.polygon([P(558, 160), P(628, 132), P(628, 152), P(558, 180)], fill=(120, 120, 120), outline='black')   # табло над дверями
box(8, 200, 62, 300, (190, 190, 190))                                         # дверь слева (вход)
box(120, 262, 170, 300, (160, 160, 160)); d.line([P(120, 262), P(170, 300)], fill='black', width=2)       # ящик
box(170, 210, 300, 300, (140, 140, 140))                                      # контейнер
for x in range(182, 300, 14): d.line([P(x, 214), P(x, 296)], fill='black', width=1)
box(300, 140, 470, 154, (90, 90, 90))                                         # конвейер
for x in range(306, 470, 12): d.ellipse([P(x, 143), P(x + 8, 151)], outline='black')
for x in (320, 395, 460): d.line([P(x, 154), P(x, 300)], fill='black', width=4)
for x in (478, 540): d.line([P(x, 300), P(x, -130)], fill='black', width=5)   # шахта лифта (направляющие)
for y in range(-120, 300, 40): d.line([P(478, y), P(540, y)], fill='black', width=1)
plat(180, 474, -60)                                                           # мостик
for x in (210, 330, 450): d.line([P(x, -50), P(x - 26, -20)], fill='black', width=3)
d.rectangle([P(0, -338), P(150, -328)], fill='black'); d.line([P(0, -300), P(60, -330)], fill='black', width=4)   # кран-балка на стене
plat(150, 470, -250)                                                          # антресоль
for x in (180, 310, 440): d.line([P(x, -240), P(x - 26, -210)], fill='black', width=3)
for y in range(-400, -250, 14): d.line([P(442, y), P(458, y)], fill='black', width=2)   # лестница
d.line([P(442, -250), P(442, -404)], fill='black', width=3); d.line([P(458, -250), P(458, -404)], fill='black', width=3)
plat(380, 540, -400)                                                          # площадка
d.rectangle([P(300, -450), P(372, -432)], fill=(110, 110, 110), outline='black'); d.line([P(300, -441), P(0, -441)], fill='black', width=6)   # труба-уступ
plat(40, 290, -500)                                                           # верхняя галерея
box(84, -600, 140, -500, (180, 180, 180)); box(150, -560, 166, -536, (100, 100, 100), 2)   # дверь на крышу и щиток
im.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'art_src', 'l7', 'v4_hallref.png')); im.save(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'p7v4', 'hallref.png')); print('ok')
