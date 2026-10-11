# Крупный детальный фургон Стаса и Максима для сцены трассы (Flow: art_src/l7/v4_vanshort_0.jpg, пурпурный фон, пропорции исходного van7)
# + колёса из старого листа van_1.jpg (зелёный фон) в полном разрешении. Ничего не дорисовывается.
# Выход: assets/l7v4/van_big.png, van_wheels.png (4 фазы в ряд); центры арок печатаются (вписаны в V4.drawBigVan).
import os, json
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
SRC = os.path.join(ROOT, 'art_src', 'l7', 'v4_vanshort_0.jpg')
WSRC = os.path.join(ROOT, 'art_src', 'l7', 'van_1.jpg')
OUT = os.path.join(ROOT, 'assets', 'l7v4')


def runs(mask, gap=3, minlen=20):
    xs = np.where(mask)[0]; out = []
    if not len(xs): return out
    s = p = xs[0]
    for x in xs[1:]:
        if x - p > gap:
            if p - s >= minlen: out.append((s, p))
            s = x
        p = x
    if p - s >= minlen: out.append((s, p))
    return out


def build():
    a = np.array(Image.open(SRC).convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = (r - g > 70) & (b - g > 70)
    edge = (~mag) & (r - g > 40) & (b - g > 40)
    a[edge, 0] = a[edge, 1]; a[edge, 2] = a[edge, 1]
    al = np.where(mag, 0, 255).astype(np.uint8)
    ys, xs = np.where(al > 0); x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    im = Image.fromarray(np.dstack([a.astype(np.uint8), al]), 'RGBA').crop((x0, y0, x1, y1))
    im.save(os.path.join(OUT, 'van_big.png'))
    # тот же фургон с пустой кабиной (Flow: v4_vanempty_0.jpg) — стоит у КПП; тот же кадр обрезки
    e = np.array(Image.open(os.path.join(ROOT, 'art_src', 'l7', 'v4_vanempty_0.jpg')).convert('RGB')).astype(int)
    em = (e[..., 0] - e[..., 1] > 70) & (e[..., 2] - e[..., 1] > 70)
    ee = (~em) & (e[..., 0] - e[..., 1] > 40) & (e[..., 2] - e[..., 1] > 40); e[ee, 0] = e[ee, 1]; e[ee, 2] = e[ee, 1]
    Image.fromarray(np.dstack([e.astype(np.uint8), np.where(em, 0, 255).astype(np.uint8)]), 'RGBA').crop((x0, y0, x1, y1)).save(os.path.join(OUT, 'van_empty.png'))
    # арки: чёрные полосы в нижней строке кузова
    c = np.array(im); h = c.shape[0]
    row = c[h - 40:h - 24]; dark = ((row[..., :3].max(-1) < 45) & (row[..., 3] > 0)).all(0)
    arches = [(int(s), int(e)) for s, e in runs(dark, 3, 90)]
    # колёса
    w = np.array(Image.open(WSRC).convert('RGB')).astype(int)
    grn = (w[..., 1] - w[..., 0] > 60) & (w[..., 1] - w[..., 2] > 60)
    band = ~grn[400:620]
    cols = runs(band.any(0), 3, 120)[:4]
    fr = []
    for s, e in cols:
        sub = band[:, s:e + 1]; rr = np.where(sub.any(1))[0]
        fr.append((s, 400 + rr.min(), e + 1, 400 + rr.max() + 1))
    S = max(max(x[2] - x[0], x[3] - x[1]) for x in fr)
    sheet = Image.new('RGBA', (S * len(fr), S), (0, 0, 0, 0))
    for i, bx in enumerate(fr):
        t = w[bx[1]:bx[3], bx[0]:bx[2]].copy(); gm = grn[bx[1]:bx[3], bx[0]:bx[2]]
        sp = Image.fromarray(np.dstack([t.astype(np.uint8), np.where(gm, 0, 255).astype(np.uint8)]), 'RGBA')
        sheet.alpha_composite(sp, (i * S + (S - sp.width) // 2, (S - sp.height) // 2))
    sheet.save(os.path.join(OUT, 'van_wheels.png'))
    d = {'w': im.width, 'h': im.height, 'arches': arches, 'wheel': int(S), 'n': len(fr)}
    open(os.path.join(ROOT, 'js', 'l7v4_van_data.js'), 'w').write('window.VAN4 = ' + json.dumps(d) + ';\n')
    print(d)


if __name__ == '__main__':
    build()
