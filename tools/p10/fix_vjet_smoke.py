# Пересобрать vjet2/vjet3: дым убирать только НАД телом (по столбцам), чтобы не стирать чёрную футболку и тёмные джинсы.
# py tools/p10/fix_vjet_smoke.py
import numpy as np, re
from PIL import Image
from scipy import ndimage
src = open('tools/p10/build_mid.py', encoding='utf-8').read()
exec(src[src.index('def key'):src.index('# рамки кадров')])
SRC, OUT = 'art_src/l10/mid/src/', 'assets/l10/mid/'
BOX = [[455, 0, 648, 470], [645, 0, 900, 470]]
rgba = key(Image.open(SRC + 'vjet.jpg')); k = rgba.shape[1] / 900
for n, b in zip(['vjet2', 'vjet3'], BOX):
    x0, y0, x1, y1 = [round(v * k) for v in b]; a = rgba[y0:y1, x0:x1].copy()
    al = a[..., 3] > 40; lab, nl = ndimage.label(al)
    if nl: sz = ndimage.sum(al, lab, range(1, nl + 1)); a[..., 3] = a[..., 3] * np.isin(lab, [q + 1 for q in range(nl) if sz[q] > 80])
    r, g, bb = [a[..., i].astype(int) for i in range(3)]; mx = np.maximum(np.maximum(r, g), bb); mn = np.minimum(np.minimum(r, g), bb)
    op = a[..., 3] > 20
    smk = op & (mx < 95) & (mx - mn < 30)
    body = op & ~smk
    body = ndimage.binary_opening(body, iterations=2)          # тело: цветные пиксели (без мелких искр)
    h, w = body.shape; first = np.where(body.any(0), body.argmax(0), h)   # верхний край тела в каждом столбце
    above = np.arange(h)[:, None] < first[None, :] - 3
    if n == 'vjet2': above = np.broadcast_to((np.arange(h) < round(203 * k) - y0)[:, None], (h, w))     # кадр вниз головой: ботинки тёмные, как дым, — режем только выше носков ботинок
    a[..., 3][smk & above] = 0                                 # дым над телом убрать (его рисует код), внутри тела оставить
    al = a[..., 3] > 20; lab, nl = ndimage.label(al)
    if nl: sz = ndimage.sum(al, lab, range(1, nl + 1)); a[..., 3] = a[..., 3] * np.isin(lab, [q + 1 for q in range(nl) if sz[q] > 150])
    ys, xs = np.nonzero(a[..., 3] > 20); a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    Image.fromarray(a).save(OUT + n + '.png'); print(n, a.shape[1], a.shape[0])
# vjet1: луч Flow (слева) стереть по линии, а не прямоугольником — иначе срезается вспышка на джетпаке
x0, y0, x1, y1 = [round(v * k) for v in [222, 0, 460, 470]]; a = rgba[y0:y1, x0:x1].copy()
yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]; sx, sy = xx / k + 222, yy / k     # координаты листа (ширина 900)
ax_, ay_, bx_, by_ = 175, 92, 272, 130; L = np.hypot(bx_ - ax_, by_ - ay_)
dist = np.abs((by_ - ay_) * sx - (bx_ - ax_) * sy + bx_ * ay_ - by_ * ax_) / L
a[..., 3][(dist < 7) & (sx < 266)] = 0
al = a[..., 3] > 40; lab, nl = ndimage.label(al)
if nl: sz = ndimage.sum(al, lab, range(1, nl + 1)); a[..., 3] = a[..., 3] * np.isin(lab, [q + 1 for q in range(nl) if sz[q] > 80])
ys, xs = np.nonzero(a[..., 3] > 20); a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
Image.fromarray(a).save(OUT + 'vjet1.png'); print('vjet1', a.shape[1], a.shape[0])
