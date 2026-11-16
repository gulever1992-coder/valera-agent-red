# Ур.1, обучение с Юриком: листы Flow (пурпурный фон) -> атласы yurik1, pigeon1, v1_crawl + портрет p_yurik1
# и запись в js/sprites_data.js. Запуск: py tools/build_l1tut.py   (после полного build_assets.py — перезапустить)
# Исходники: art_src/l1/tut_yb0.jpg (Юрик 2x4: стоит, 3 шага, говорит, указывает, руки на груди, «класс»),
#            art_src/l1/tut_p0.jpg (голубь 2x3: сидит, воркует, клюёт, подскок, летит, нокаут),
#            art_src/l1/tut_c0.jpg (Валера на четвереньках без фуражки, 2x4 — цикл 8 кадров).
import os, json
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = lambda *p: os.path.join(ROOT, *p)

def key(path):
    """RGBA float 0..1 с предумноженной чисткой пурпура (как tools/build_l1props.py)."""
    a = np.array(Image.open(path).convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    t = np.clip((np.minimum(r, b) - g) / 235.0, 0, 1)
    al = np.clip((1 - t - 0.14) / (0.80 - 0.14), 0, 1)
    d = np.maximum(1 - t, 0.2)[..., None]
    rgb = np.clip((a - t[..., None] * np.array([255, 0, 255], np.float32)) / d, 0, 255)
    return np.dstack([rgb / 255.0, al])

def figures(f, cols, rows, small=False, minpx=40, win=45):
    """Фигуры листа cols x rows: ряды — по пустым полосам, столбцы — по самому пустому столбцу возле границы ячейки.
    В ячейке остаётся крупнейшая область (small=True — и мелочь вроде перьев)."""
    H, W = f.shape[:2]; al = f[..., 3] > 0.5; out = []
    rs = al.sum(axis=1); ycuts = [0]
    for r in range(1, rows):
        y0 = int(r * H / rows); lo, hi = max(1, y0 - 90), min(H - 1, y0 + 90)
        ycuts.append(lo + int(np.argmin(rs[lo:hi])))
    ycuts.append(H)
    for r in range(rows):
        band = al[ycuts[r]:ycuts[r + 1]]; cs = band.sum(axis=0)
        # столбцы фигур: пустые промежутки по проекции ряда; cols самых широких групп (лист может быть не на всю ширину)
        occ = ndimage.binary_closing(cs > 0, structure=np.ones(9))
        lab1, k1 = ndimage.label(occ)
        spans = sorted([tuple(np.where(lab1 == i)[0][[0, -1]]) for i in range(1, k1 + 1)], key=lambda s: s[1] - s[0], reverse=True)[:cols]
        spans.sort()
        if len(spans) == cols:
            xcuts = [0] + [(spans[i][1] + spans[i + 1][0]) // 2 for i in range(cols - 1)] + [W]
        else:
            xcuts = [0]
            for c in range(1, cols):
                x0 = int(c * W / cols); lo, hi = max(1, x0 - win), min(W - 1, x0 + win)
                xcuts.append(lo + int(np.argmin(cs[lo:hi])))
            xcuts.append(W)
        for c in range(cols):
            cell = f[ycuts[r]:ycuts[r + 1], xcuts[c]:xcuts[c + 1]].copy()
            lab, k = ndimage.label(cell[..., 3] > 0.5)
            sz = ndimage.sum(np.ones(lab.shape), lab, range(1, k + 1))
            big = int(np.argmax(sz)) + 1
            keep = np.isin(lab, [i + 1 for i, v in enumerate(sz) if v >= minpx]) if small else lab == big
            cell[..., 3] = np.where(ndimage.binary_dilation(keep, iterations=2), cell[..., 3], 0)
            ys = np.where(keep.any(axis=1))[0]; xs = np.where(keep.any(axis=0))[0]
            out.append(cell[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1])
    return out

def shrink(g, k):
    """Уменьшение с предумноженной альфой, край — чёткий (пиксель-арт)."""
    h, w = g.shape[:2]; nw, nh = max(1, round(w * k)), max(1, round(h * k))
    pm = np.dstack([g[..., :3] * g[..., 3:4], g[..., 3]])
    ch = [np.array(Image.fromarray((pm[..., i] * 255).astype(np.uint8)).resize((nw, nh), Image.LANCZOS)).astype(np.float32) / 255 for i in range(4)]
    al = ch[3]; rgb = np.dstack(ch[:3]) / np.maximum(al, 1e-3)[..., None]
    out = np.dstack([np.clip(rgb, 0, 1) * 255, np.where(al > 0.45, 255, 0)]).astype(np.uint8)
    ys = np.where(out[..., 3].any(axis=1))[0]; xs = np.where(out[..., 3].any(axis=0))[0]
    return out[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1]

def atlas(name, figs, k, anchor):
    imgs = [shrink(g, k) for g in figs]; F = []; x = 0
    for a in imgs:
        al = a[..., 3] > 0; h, w = al.shape
        if anchor == 'feet':
            band = al[int(h * 0.88):]; xs = np.where(band.any(axis=0))[0]; ax = (xs[0] + xs[-1]) / 2
        else: ax = w / 2
        F.append([x, 0, w, h, round(float(ax), 1), float(h), round(float(ax), 1), 0]); x += w + 2
    at = Image.new('RGBA', (x, max(a.shape[0] for a in imgs)))
    for a, r in zip(imgs, F): at.paste(Image.fromarray(a, 'RGBA'), (r[0], 0))
    at.save(A('assets', 'spr', name + '.png'), optimize=True)
    print(name, len(F), 'кадров', at.size, 'высоты', [r[3] for r in F])
    return {'img': 'assets/spr/' + name + '.png', 'f': F}

s = open(A('js', 'sprites_data.js'), encoding='utf-8').read()
i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); S = json.loads(s[i:j])

# Юрик: рост стоящего кадра (с каской) — чуть выше Валеры (160)
yk = key(A('art_src', 'l1', 'tut_yb0.jpg')); yf = figures(yk, 4, 2)
S['yurik1'] = atlas('yurik1', yf, 170 / yf[0].shape[0], 'feet')
# голубь: сидящий — 38 px атласа (19 логических)
pf = figures(key(A('art_src', 'l1', 'tut_p0.jpg')), 3, 2, small=True)
S['pigeon1'] = atlas('pigeon1', pf, 38 / pf[0].shape[0], 'center')
# ползком: ширина кадра как у v7_crawl
cf = figures(key(A('art_src', 'l1', 'tut_c0.jpg')), 4, 2)
S['v1_crawl'] = atlas('v1_crawl', cf, S['v7_crawl']['f'][0][2] / float(np.median([g.shape[1] for g in cf])), 'center')

# портрет Юрика в каске: голова говорящего кадра на тёмном фоне, 128x128 (как p_yurik)
g = yf[0]; h, w = g.shape[:2]
al = g[..., 3] > 0.5; top = al[:int(h * 0.42)]; xs = np.where(top[:int(h * 0.3)].any(axis=0))[0]
cx = (xs[0] + xs[-1]) / 2; side = int(h * 0.50); x0 = int(max(0, min(w - side, cx - side / 2)))
crop = g[0:side, x0:x0 + side]
im = Image.fromarray((np.dstack([crop[..., :3], np.where(crop[..., 3] > 0.5, 1.0, 0.0)]) * 255).astype(np.uint8), 'RGBA').resize((112, 112), Image.LANCZOS)
bgc = Image.open(A('assets', 'spr', 'p_yurik.png')).convert('RGBA').getpixel((3, 3))
p = Image.new('RGBA', (128, 128), bgc); p.alpha_composite(im, (8, 16)); p.save(A('assets', 'spr', 'p_yurik1.png'), optimize=True)

s = s[:i] + json.dumps(S) + s[j:]
open(A('js', 'sprites_data.js'), 'w', encoding='utf-8', newline='').write(s)
print('листов в sprites_data.js:', len(S))
