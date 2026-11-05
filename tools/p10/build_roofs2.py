# Дома фазы 1 (новые, в едином масштабе) и предметы на крышах (на них лезут по лестнице).
# Вход: art_src/l10/bld_new.png (6 домов), art_src/l10/rooftop_objs.png (6 предметов) — Flow, пурпурный фон.
# Выход: assets/l10/bld10.png, assets/l10/rtop10.png, js/roofs2_data.js (L10.BLD2 = {bld: [...], obj: [...]}).
# Кадр дома: [x, y, w, h, roofY (основная крыша), ppf (пикс. на этаж), м на этаж, профиль [[x0доля, x1доля, y], ...]]; предмета: [x, y, w, h, topY (где стоять), ladder ('L'|'R')].
# Запуск из корня игры: py tools/p10/build_roofs2.py, затем py tools/optimize_assets.py
import json
import numpy as np
from PIL import Image
from scipy import ndimage as nd

SRC, OUT = 'art_src/l10/', 'assets/l10/'


def key(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(float); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mg = np.minimum(r, b) - g
    al = np.clip(1 - (mg - 20) / 70, 0, 1)
    al = nd.binary_opening(al > 0.5, iterations=1) * al
    sp = mg > 10; a[..., 0] = np.where(sp, np.minimum(r, g + 18), r); a[..., 2] = np.where(sp, np.minimum(b, g + 24), b)
    return np.dstack([a, al * 255]).clip(0, 255).astype('uint8')


def parts(rgba, min_area):
    m = rgba[..., 3] > 100
    mo = nd.binary_opening(m, iterations=2); lb, n = nd.label(nd.binary_closing(mo, iterations=3))
    objs = [(k + 1, o) for k, o in enumerate(nd.find_objects(lb)) if o is not None and (o[0].stop - o[0].start) * (o[1].stop - o[1].start) > min_area]
    objs.sort(key=lambda q: (q[1][0].start // 200, q[1][1].start))
    H, W = m.shape; pad = 40; out = []
    for k, o in objs:     # своя область = метка, раздутая на pad (возвращает тонкие перила/лестницы, но не цепляет соседей)
        o2 = (slice(max(0, o[0].start - pad), min(H, o[0].stop + pad)), slice(max(0, o[1].start - pad), min(W, o[1].stop + pad)))
        own = nd.binary_dilation(lb[o2] == k, iterations=pad // 2)
        t = rgba[o2].copy(); t[..., 3] = np.where(own, t[..., 3], 0)
        ys, xs = np.nonzero(t[..., 3] > 8); out.append(t[ys.min():ys.max() + 1, xs.min():xs.max() + 1])
    return out


def walk_line(t, frac=0.8, thick=6):
    """первая сверху строка, где сплошная заливка шире frac и держится thick строк (перила тоньше — пропускаются)"""
    rows = (t[..., 3] > 100).mean(1) >= frac
    for y in range(len(rows) - thick):
        if rows[y:y + thick].all(): return y
    return 0


def ladder_side(t):
    """лестница — с той стороны, где у верхней части больше тонких вертикалей (по бокам за пределами корпуса)"""
    m = t[..., 3] > 100; w = m.shape[1]; band = max(8, w // 8)
    return 'L' if m[:, :band].mean() < m[:, -band:].mean() and False else ('L' if m[:, :band].sum() > m[:, -band:].sum() * 1.15 else 'R')


def atlas(tiles, name):
    W = sum(t.shape[1] for t in tiles) + 2 * len(tiles); H = max(t.shape[0] for t in tiles)
    a = np.zeros((H, W, 4), 'uint8'); x = 0; rects = []
    for t in tiles: a[:t.shape[0], x:x + t.shape[1]] = t; rects.append([x, 0, t.shape[1], t.shape[0]]); x += t.shape[1] + 2
    Image.fromarray(a).save(OUT + name, optimize=True); return rects


def key_hi(p1, p2):
    """пиксели из 2K-апскейла Flow, маска — из 1K-оригинала (апскейл дорисовывает лишнее между объектами)"""
    import os
    if not os.path.exists(p2): return key(p1)
    lo, hi = key(p1), key(p2); m = np.asarray(Image.fromarray(lo[..., 3]).resize((hi.shape[1], hi.shape[0]), Image.BILINEAR))
    hi[..., 3] = np.minimum(hi[..., 3], m)
    up = np.asarray(Image.fromarray(lo[..., :3]).resize((hi.shape[1], hi.shape[0]), Image.BICUBIC)).astype(int)
    df = np.abs(nd.gaussian_filter(hi[..., :3].astype(float), (8, 8, 0)) - nd.gaussian_filter(up.astype(float), (8, 8, 0))).mean(2)
    bad = nd.binary_dilation(df > 22, iterations=14)     # сравнение размытых: мелкие сдвиги деталей не считаются, крупные дорисовки — да     # апскейл дорисовал чужое (кран, дымка) — там берём оригинал
    hi[..., :3] = np.where(bad[..., None], up, hi[..., :3]).astype('uint8'); print('  заменено пикс. апскейла:', int(bad.sum()))
    return hi


def profile(t, main):
    """профиль крыши по ширине: трубы, вентгрибки и перила срезаются; [[x0, x1, y], ...] в пикселях кадра"""
    m = t[..., 3] > 100; h, w = m.shape
    m = nd.binary_opening(m, structure=np.ones((1, max(3, int(w * 0.18)))))     # узкие вертикальные штуки (трубы)
    m = nd.binary_opening(m, structure=np.ones((max(3, int(h * 0.025)), 1)))     # тонкие горизонтальные (перила)
    top = np.array([np.argmax(m[:, x]) if m[:, x].any() else h for x in range(w)])
    segs = []; x0 = 0
    for x in range(1, w + 1):
        if x == w or abs(int(top[x]) - int(top[x0])) > h * 0.02: segs.append([x0, x, int(np.median(top[x0:x]))]); x0 = x
    out = []
    for sg in segs:     # мелкие обрывки — к соседу
        if out and sg[1] - sg[0] < w * 0.05: out[-1][1] = sg[1]
        else: out.append(sg)
    if len(out) > 1 and out[0][1] - out[0][0] < w * 0.05: out[1][0] = 0; out.pop(0)
    return out


SHEETS = [     # (1K, 2K, этажей в кадре, метров на этаж) — порядок кадров: по рядам слева направо
    ('bld_new.png', 'bld_new_2k.png', [2, 5, 2, 3, 3, 2], [3.8, 2.7, 5.0, 3.5, 4.4, 8.0]),     # кирпич с арками −15 % (владелец: слишком огромный)     # арки, панелька, котельная, жёлтое, белый офис, синий склад
    ('bld_new3.png', 'bld_new3_2k.png', [2, 3, 4, 2, 3, 4], [5.5, 4.2, 4.4, 5.0, 2.8, 3.6]),     # эллинг, ТЭЦ, мельница (+30 % критик), завод с трубой, бетонный цех с грибками (−30 % владелец), заброшка (+25 % критик); порядок — как режет parts()
]
B, meta = [], []
for p1, p2, fl, mpf in SHEETS:
    ts = parts(key_hi(SRC + p1, SRC + p2), 80000)
    assert len(ts) == len(fl), (p1, len(ts))
    for t, f, m in zip(ts, fl, mpf):
        pr = profile(t, 0); main = sorted(pr, key=lambda q: q[1] - q[0])[-1][2]     # основная крыша — самый широкий участок
        B.append(t); meta.append([main, round((t.shape[0] - main) / f, 1), m, [[round(q[0] / t.shape[1], 3), round(q[1] / t.shape[1], 3), q[2]] for q in pr]])
bld = [r + mt for r, mt in zip(atlas(B, 'bld10.png'), meta)]
O = parts(key(SRC + 'rooftop_objs.png'), 20000)
obj = []
for t, r in zip(O, atlas(O, 'rtop10.png')):
    obj.append(r + [walk_line(t, 0.7, 6)])
# где нарисована лестница (доля ширины слева) и с какой стороны; L-предметы в игре зеркалятся, чтобы лестница была справа (Валера бежит влево)
LAD = [0.89, 0.045, 0.91, 0.09, 0.87, 0.93]
for o, lf in zip(obj, LAD): o += [lf]

open('js/roofs2_data.js', 'w', encoding='utf-8').write('// собрано tools/p10/build_roofs2.py\nL10.BLD2 = ' + json.dumps({'bld': bld, 'obj': obj}) + ';\n')
print('bld', bld); print('obj', obj)
