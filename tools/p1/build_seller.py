# Продавщица в стиле Валеры (Flow, art_src/l1/h6.jpg: 4 фигуры сверху, 3 снизу на пурпуре, у каждой линия «прилавка» под поясом).
# Кадры листа sellera: 0 спокойно, 1 говорит, 2 «паспорт», 3 скептически, 4 подаёт пиво, 5 подмигивает.
# Масштаб: ширина головы = ширине головы большого Валеры (vb_story3[3]) — пропорции как у него. Рисуется в сцене со scale 1.
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'p1'))
src = os.path.join(ROOT, 'art_src', 'l1', sys.argv[1] if len(sys.argv) > 1 else 'h6.jpg')
a = np.array(Image.open(src).convert('RGB')).astype(np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
t = np.clip((np.minimum(r, b) - g) / 235.0, 0, 1)
al = np.clip((1 - t - 0.14) / 0.66, 0, 1)
rgb = np.clip((a - t[..., None] * np.array([255, 0, 255], np.float32)) / np.maximum(1 - t, 0.2)[..., None], 0, 255)
H, W = al.shape
def head_w(m):  # ширина по верхним 28 % фигуры (голова с волосами)
    ys = np.where(m.any(axis=1))[0]; top = ys[0]; hh = ys[-1] - top
    band = m[top:top + int(hh * 0.28)]; xs = np.where(band.sum(axis=0) > 2)[0]
    return xs[-1] - xs[0]
figs = []
for row in range(2):
    y0, y1 = row * H // 2, (row + 1) * H // 2
    m = al[y0:y1] > 0.5
    # линия прилавка: строка, где непрозрачно > 45 % ширины подряд — режем фигуры выше неё
    cov = m.mean(axis=1); jump = np.where(np.diff(cov) > 0.15)[0]
    cut = (int(jump[-1]) - 1) if len(jump) else m.shape[0]   # линия прилавка: резкий скачок покрытия строки
    m[cut:] = False
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=3))
    sz = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
    objs = ndimage.find_objects(lab)
    big = sorted([j for j in range(n) if sz[j] > sz.max() * 0.25], key=lambda j: objs[j][1].start)
    for j in big:
        sl = objs[j]; mm = (lab[sl] == j + 1) & m[sl]
        f = np.dstack([rgb[y0:y1][sl] / 255.0, (al[y0:y1][sl] * mm)[..., None]])
        ys = np.where(mm.any(axis=1))[0]; xs = np.where(mm.any(axis=0))[0]
        figs.append(f[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1])
print('фигур', len(figs))
order = [0, 1, 2, 4, 5, 6]          # 3-я сверху справа (подмигивает без руки) не нужна
figs = [figs[i] for i in order]
s = open(os.path.join(ROOT, 'js', 'sprites_data.js'), encoding='utf-8').read()
i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); S = json.loads(s[i:j])
vb = S['vb_story3']; f = vb['f'][3]
vim = np.array(Image.open(os.path.join(ROOT, vb['img'])).convert('RGBA'))[f[1]:f[1] + f[3], f[0]:f[0] + f[2], 3] > 100
k = head_w(vim) / head_w(figs[0][..., 3] > 0.5)
def shrink(f, k):   # уменьшение с предумноженной альфой -> uint8 RGBA
    h, w = f.shape[:2]; size = (max(1, round(w * k)), max(1, round(h * k)))
    pm = np.dstack([f[..., :3] * f[..., 3:4], f[..., 3:4]]).astype(np.float32)
    ch = [np.array(Image.fromarray(pm[..., c]).resize(size, Image.LANCZOS)) for c in range(4)]
    a_ = np.clip(ch[3], 0, 1); rgb_ = [np.clip(c / np.maximum(a_, 1e-3), 0, 1) for c in ch[:3]]
    a_ = np.where(a_ < 0.05, 0, a_)
    return (np.dstack(rgb_ + [a_]) * 255 + 0.5).astype(np.uint8)
imgs = [shrink(f, k) for f in figs]
x = 0; F = []
for im in imgs:
    m_ = im[..., 3] > 100; ys_ = np.where(m_.any(axis=1))[0]; band = m_[ys_[0]:ys_[0] + int(len(ys_) * 0.28)]
    xs_ = np.where(band.sum(axis=0) > 2)[0]; ax = (xs_[0] + xs_[-1]) / 2          # опора по центру головы: тело не «ездит» между кадрами
    F.append([x, 0, im.shape[1], im.shape[0], round(float(ax), 1), float(im.shape[0]), round(float(ax), 1), 0]); x += im.shape[1] + 2
at = Image.new('RGBA', (x, max(im.shape[0] for im in imgs)))
for im, fr in zip(imgs, F): at.paste(Image.fromarray(im, 'RGBA'), (fr[0], 0))
at.save(os.path.join(ROOT, 'assets', 'spr', 'sellera.png'), optimize=True)
S['sellera'] = {'img': 'assets/spr/sellera.png', 'f': F}
s = s[:i] + json.dumps(S) + s[j:]
open(os.path.join(ROOT, 'js', 'sprites_data.js'), 'w', encoding='utf-8').write(s)
print('sellera', at.size, 'масштаб', round(k, 3), 'высота лог.', round(imgs[0].shape[0] / 2))
