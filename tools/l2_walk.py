# Ур.2: циклы ходьбы врагов (Flow, маджента-фон) -> атласы punk2 / gopw / bomw в sprites_data.js.
# Масштаб — по росту кадра «стоя» из старых листов (gopnik / punk / bomzh), опора — низ по центру ступней.
import os, json, numpy as np
from PIL import Image
from scipy import ndimage
import sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from defringe import defringe
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SPR = os.path.join(ROOT, 'assets', 'spr')
p = os.path.join(ROOT, 'js', 'sprites_data.js'); s = open(p, encoding='utf-8').read()
i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); D = json.loads(s[i:j])

def cut(src, rows, cols):
    # режем по целым фигурам: компоненты всего листа раздаются ячейкам по центру масс (нога, залезшая в соседнюю ячейку, не обрезается)
    im = np.asarray(Image.open(os.path.join(ROOT, 'art_src/l2walk', src)).convert('RGB')).astype(float); H, W = im.shape[:2]
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    A = np.clip(1 - (np.minimum(r, b) - g - 60) / 120, 0, 1)
    lab, n = ndimage.label(ndimage.binary_dilation(A > 0.5, iterations=3)); idx = range(1, n + 1)
    sz = np.array(ndimage.sum(np.ones(lab.shape), lab, idx)); cm = ndimage.center_of_mass(np.ones(lab.shape), lab, idx)
    out = []
    for ry in range(rows):
        for rx in range(cols):
            ids = [k + 1 for k in range(n) if int(cm[k][0] * rows / H) == ry and int(cm[k][1] * cols / W) == rx]
            big = max((sz[k - 1] for k in ids), default=0); ids = [k for k in ids if sz[k - 1] > big * 0.08]
            a = A * np.isin(lab, ids); ys, xs = np.where(a > 0.5)
            c = im[ys.min():ys.max() + 1, xs.min():xs.max() + 1].copy(); a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
            # кайма маджента: убираем розовый оттенок с полупрозрачных краёв
            c[..., 0] = np.where(a < 0.95, np.minimum(c[..., 0], c[..., 1] + 30), c[..., 0]); c[..., 2] = np.where(a < 0.95, np.minimum(c[..., 2], c[..., 1] + 30), c[..., 2])
            out.append(Image.fromarray(np.dstack([c, a * 255]).astype(np.uint8), 'RGBA'))
    return out

def atlas(name, frames, scales):
    imgs, meta = [], []
    for f, k in zip(frames, scales):
        f = f.resize((max(1, round(f.width * k)), max(1, round(f.height * k))), Image.LANCZOS)
        a = np.array(f); a[..., 3] = np.where(a[..., 3] > 100, 255, 0); a = defringe(a); al = a[..., 3] > 0
        ys = np.where(al.any(1))[0]; bot = ys[-1]; band = al[max(0, int(bot - f.height * 0.12)):bot + 1]; xs = np.where(band.any(0))[0]
        top = ys[0]; hx = np.where(al[top:top + 4].any(0))[0]
        imgs.append(Image.fromarray(a)); meta.append(((xs[0] + xs[-1]) / 2, bot + 1, (hx[0] + hx[-1]) / 2, top))
    W = sum(m.width + 2 for m in imgs); H = max(m.height for m in imgs); at = Image.new('RGBA', (W, H)); x = 0; fr = []
    for m, (ax, ay, hx, hy) in zip(imgs, meta):
        at.paste(m, (x, 0)); fr.append([x, 0, m.width, m.height, round(float(ax), 1), float(ay), round(float(hx), 1), int(hy)]); x += m.width + 2
    at.save(os.path.join(SPR, name + '.png'), optimize=True); print(name, len(fr), at.size, [f[3] for f in fr])
    return {'img': 'assets/spr/%s.png' % name, 'f': fr}

H = lambda sheet, k: D[sheet]['f'][k][3]
S = {}
pk = cut('punk.jpg', 2, 4); k = H('punk', 0) / pk[4].height                  # 4 = стойка
S['punk2'] = atlas('punk2', pk, [k] * 8)
gp = cut('gop.jpg', 1, 4); k = H('gopnik', 2) / float(np.median([f.height for f in gp]))   # 2 = старый шаг
S['gopw'] = atlas('gopw', gp, [k] * 4)
bm = cut('bomzh.jpg', 2, 4)
kb = H('bomzh', 0) / float(np.median([f.height for f in bm[:4]])); ka = H('bomzh', 4) / float(np.median([f.height for f in bm[4:]]))
S['bomw'] = atlas('bomw', bm, [kb] * 4 + [ka] * 4)
D.update(S); open(p, 'w', encoding='utf-8').write(s[:i] + json.dumps(D) + s[j:]); print('ok', list(S))
