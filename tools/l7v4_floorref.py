# Схемы-референсы этажей «Цеха сортировки» v4 (пустые комнаты-«коробки» в разрезе, мебель/двери/лестницы — отдельными спрайтами) для Flow.
# Этаж = 1074 лог. px = две полосы по 537 (1376x384 каждая, одна под другой в картинке 1376x768).
# В полосе: 0..318 px — комната (124 лог. px до потолка), 318 — линия ног, 290..332 — плоскость пола, 332..384 — перекрытие в разрезе.
import os
from PIL import Image, ImageDraw
K = 1376 / 537; FLOOR = 318; SLAB = 332
HERE = os.path.dirname(os.path.abspath(__file__))
WALLS = [(262, 276), (523, 537), (799, 813)]   # стены с дверными проёмами


class Ref:
    def __init__(self):
        self.im = Image.new('RGB', (1376, 768), (236, 236, 228)); self.d = ImageDraw.Draw(self.im)
        for s in (0, 1):
            self.d.rectangle([0, s * 384, 1376, s * 384 + 14], fill=(110, 110, 110))                                            # потолок
            self.d.polygon([(0, s * 384 + 290), (1376, s * 384 + 290), (1376, s * 384 + SLAB), (0, s * 384 + SLAB)], fill=(190, 190, 180), outline='black')   # пол (плоскость)
            self.d.rectangle([0, s * 384 + SLAB, 1376, s * 384 + 384], fill=(90, 90, 90), outline='black', width=3)              # перекрытие
        self.wall(0, 14, False, True); self.wall(1060, 1074, False, True)
        for a, b in WALLS: self.wall(a, b)
    def P(self, x, y):
        s = 0 if x < 537 else 1; return ((x - s * 537) * K, s * 384 + FLOOR - y * K)
    def box(self, x0, y0, x1, y1, fill=None, w=3):
        a, b = self.P(x0, y1), self.P(x1 - 0.01, y0); self.d.rectangle([a, b], fill=fill, outline='black', width=w)
    def wall(self, x0, x1, door=True, brick=False):
        s = 0 if x0 < 537 else 1; a = (x0 - s * 537) * K; b = (x1 - 0.01 - s * 537) * K
        self.d.rectangle([a, s * 384, b, s * 384 + SLAB], fill=(150, 80, 60) if brick else (60, 60, 60), outline='black', width=3)
        if door: self.d.rectangle([a - 2, s * 384 + FLOOR - 100 * K, b + 2, s * 384 + SLAB], fill=(236, 236, 228)); self.d.rectangle([a, s * 384 + FLOOR - 100 * K, b, s * 384 + FLOOR - 96 * K], fill='black')
    def window(self, x0, x1, y0=46, y1=98):
        self.box(x0, y0, x1, y1, (255, 0, 255), 4)
        a, b = self.P(x0, y1), self.P(x1, y0)
        for i in range(1, 5): x = a[0] + (b[0] - a[0]) * i / 5; self.d.line([(x, a[1]), (x, b[1])], fill='black', width=2)
    def save(self, name): self.im.save(os.path.join(HERE, 'p7v4', name)); print(name)


def f1():
    r = Ref(); r.window(150, 215); r.window(400, 470)
    r.box(880, 0, 990, 104, (140, 150, 150), 5); r.box(905, 48, 965, 80, (190, 220, 220), 3); r.box(878, 108, 992, 122, (30, 30, 30)); r.save('shell1ref.png')
def f2():
    r = Ref(); r.window(330, 395); r.window(905, 975); r.save('shell2ref.png')
def f3():
    r = Ref(); r.window(330, 395); r.box(630, 36, 710, 96, (90, 100, 110), 3); r.d.ellipse([r.P(655, 82), r.P(685, 52)], fill=(220, 40, 40)); r.save('shell3ref.png')
def f4():
    r = Ref(); r.window(170, 230); r.d.ellipse([r.P(640, 104), r.P(712, 32)], outline='black', width=4); r.save('shell4ref.png')
def stairs():   # лестница: марш от пола вправо-вверх до площадки, второй марш обратно влево-вверх до следующего этажа (150 лог. px)
    S = 3.9; im = Image.new('RGB', (1376, 768), (255, 0, 255)); d = ImageDraw.Draw(im); ox, oy = 420, 750
    P = lambda x, y: (ox + x * S, oy - y * S); n = 9; run, rise = 12.0, 75 / 9
    for i in range(n): d.rectangle([P(i * run, (i + 1) * rise), P(108 + 44, i * rise)], fill=(150, 150, 150), outline='black')
    d.rectangle([P(108, 75), P(152, 69)], fill=(110, 110, 110), outline='black', width=2)
    for i in range(n): d.rectangle([P(108 - (i + 1) * run, 75 + (i + 1) * rise), P(108 - i * run, 75 + i * rise)], fill=(170, 170, 170), outline='black')
    d.line([P(0, 150), P(-60, 150)], fill='black', width=5); d.line([P(-60, 0), P(170, 0)], fill='black', width=5)
    d.line([P(0, 32), P(108, 107), P(152, 107)], fill='black', width=4); d.line([P(108, 107), P(0, 182)], fill='black', width=4)
    im.save(os.path.join(HERE, 'p7v4', 'stairref.png')); print('stairref.png')


f1(); f2(); f3(); f4(); stairs()
