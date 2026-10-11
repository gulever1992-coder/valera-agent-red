# Вертикальная лестничная клетка цеха (карта D): вся графика из Flow.
#   v4_stwall_0.jpg   — задняя стена (плитка, зеркалится по обеим осям)      -> assets/l7v4/st_wall.jpg
#   v4_stflight_0.jpg — марш лестницы сбоку (пурпур)                         -> st_flight.png
#   v4_stparts_0.jpg  — площадка-решётка, бетонный пол, дверь закрыта/открыта, щиток, лампа (пурпур)
#       -> st_plat.png, st_floor.png, st_door0.png, st_door1.png, st_box.png, st_lamp.png
import os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'art_src', 'l7')
OUT = os.path.join(HERE, '..', 'assets', 'l7v4')


def key(im, soft=False):
    a = np.array(im.convert('RGB')).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.minimum(r, b) - g
    al = np.clip((150 - m) / 90.0, 0, 1) if soft else (m < 70).astype(float)
    edge = (al > 0) & (m > 25); k = np.clip(m / 255.0, 0, 1)
    a[edge, 0] = (a[edge, 0] - 255 * k[edge] * 0.8).clip(0, 255); a[edge, 2] = (a[edge, 2] - 255 * k[edge] * 0.8).clip(0, 255)
    return np.dstack([a.astype(np.uint8), (al * 255).astype(np.uint8)])


def tight(a, pad=0):
    ys, xs = np.where(a[..., 3] > 30)
    return a[max(0, ys.min() - pad):ys.max() + 1 + pad, max(0, xs.min() - pad):xs.max() + 1 + pad], (xs.min(), ys.min())


def save(a, name):
    Image.fromarray(a, 'RGBA').save(os.path.join(OUT, name), optimize=True); print(name, a.shape[1], 'x', a.shape[0])


def build():
    Image.open(os.path.join(SRC, 'v4_stwall_0.jpg')).convert('RGB').resize((688, 384), Image.LANCZOS).save(os.path.join(OUT, 'st_wall.jpg'), quality=90)
    fl, off = tight(key(Image.open(os.path.join(SRC, 'v4_stflight_0.jpg')))); save(fl, 'st_flight.png'); print('  flight offset', off)
    a = key(Image.open(os.path.join(SRC, 'v4_stparts_0.jpg')), soft=True); H, W = a.shape[:2]
    solid = a[..., 3] > 60; rows = np.where(solid.any(1))[0]; gaps = np.where(np.diff(rows) > 10)[0]
    rb = [(rows[0], rows[gaps[0]])] + [(rows[gaps[i] + 1], rows[gaps[i + 1]] if i + 1 < len(gaps) else rows[-1]) for i in range(len(gaps))]
    assert len(rb) == 3, rb
    save(tight(a[rb[0][0]:rb[0][1] + 1])[0], 'st_plat.png'); save(tight(a[rb[1][0]:rb[1][1] + 1])[0], 'st_floor.png')
    row = a[max(0, rb[2][0] - 16):rb[2][1] + 17]; cols = np.where((row[..., 3] > 60).any(0))[0]; g = np.where(np.diff(cols) > 30)[0]
    xb = [(cols[0], cols[g[0]])] + [(cols[g[i] + 1], cols[g[i + 1]] if i + 1 < len(g) else cols[-1]) for i in range(len(g))]
    assert len(xb) == 4, xb
    for (x0, x1), n in zip(xb, ['st_door0.png', 'st_door1.png', 'st_box.png', 'st_lamp.png']):
        p = tight(row[:, max(0, x0 - 16):x1 + 17])[0].copy()
        if n == 'st_lamp.png':   # ореол лампы: полупрозрачный край — тёплый свет, без пурпурного оттенка
            q = p[..., :3].astype(int); h = (p[..., 3] < 235) | ((np.minimum(q[..., 0], q[..., 2]) - q[..., 1] > 12) & (q.sum(axis=2) > 330))
            p[h, 0] = 255; p[h, 1] = 196; p[h, 2] = 90; p[h, 3] = np.minimum(p[h, 3], 255) * 0.4
        save(p, n)


if __name__ == '__main__':
    build()
