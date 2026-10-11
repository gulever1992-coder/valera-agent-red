# Портреты для диалогов (128x128): голова целиком, по центру, с плечами. Перекадровка из исходников Flow (зелёный фон).
# py tools/portraits_fix.py  -> assets/spr/p_*.png
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
SPR = os.path.join(ROOT, 'assets', 'spr')
BG = (26, 28, 36, 255)


def key_green(im):
    a = np.array(im.convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    gr = (g - r > 50) & (g - b > 50)
    spill = (~gr) & (g - np.maximum(r, b) > 18)
    a[spill, 1] = np.maximum(a[spill, 0], a[spill, 2]) + 8
    return np.dstack([a, np.where(gr, 0, 255)]).astype(np.uint8)


def portrait(src, region, name, head=None, pad=0.06, yshift=0.0):
    """region — прямоугольник с крупным портретом (или фигурой); head — доля высоты фигуры, занятая головой (для фигур в рост)."""
    im = Image.open(os.path.join(ROOT, src))
    a = key_green(im.crop(region)) if im.mode != 'RGBA' or np.array(im)[..., 3].min() > 0 else np.array(im.crop(region))
    op = a[..., 3] > 40
    ys, xs = np.where(op); top, bot = ys.min(), ys.max()
    if head: bot = int(top + (bot - top) * head)
    hop = op[top:top + int((bot - top) * 0.6)]                # верх (голова) — для центра по X
    hx = np.where(hop.any(0))[0]; cx = (hx.min() + hx.max()) / 2
    side = (bot - top) * (1 + pad * 2)
    x0 = int(round(cx - side / 2)); y0 = int(round(top - side * pad + side * yshift)); side = int(round(side))
    canvas = Image.new('RGBA', (side, side), BG)
    canvas.alpha_composite(Image.fromarray(a, 'RGBA'), (-x0, -y0))
    canvas.convert('RGB').resize((128, 128), Image.LANCZOS).save(os.path.join(SPR, 'p_' + name + '.png'))
    print('портрет', name, 'сторона', side)


if __name__ == '__main__':
    L7 = 'art_src/l7/'
    portrait(L7 + 'pick_stas.jpg', (0, 0, 895, 768), 'stas')
    portrait(L7 + 'pick_max.jpg', (0, 0, 830, 768), 'maxim')
    portrait(L7 + 'pick_denis_o.jpg', (0, 0, 860, 768), 'deniso')
    portrait(L7 + 'pick_denis_ch.jpg', (0, 0, 700, 768), 'denisch')
    portrait(L7 + 'pick_cmd.jpg', (688, 0, 1125, 384), 'cmdr7')
    portrait(L7 + 'pick_biker.jpg', (0, 0, 560, 768), 'biker7', head=0.62)
    if os.path.exists(os.path.join(ROOT, L7 + 'pick_leather.jpg')): portrait(L7 + 'pick_leather.jpg', (0, 0, 344, 384), 'leather')
    portrait('art_src/l6/v6_tap.png', (0, 0, 344, 384), 'valera6', head=0.46, pad=0.1)   # Валера ур.6-7 (потрёпанный)
