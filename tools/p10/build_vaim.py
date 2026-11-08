# Валера в море целится/стреляет в 5 направлениях (Flow: art_src/l10/vaim.jpg, 2x5 на пурпурном; ряд 1 — целится, ряд 2 — выстрел)
# -> лист vAim10: aU aUD aF aDD aD / fU fUD fF fDD fD (лицом вправо; влево — зеркально). Опора — по ногам.
# Запуск: py tools/p10/build_vaim.py [файл], затем py tools/optimize_assets.py
import sys, os, json, re
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import build_l10 as B
import numpy as np
from scipy import ndimage
from PIL import Image
s = open(os.path.join(B.ROOT, 'js', 'l10_data.js'), encoding='utf-8').read()
B.DATA.clear(); B.DATA.update(json.loads(re.search(r'window\.L10D = (\{.*\});', s, re.S).group(1)))
def big(f):     # самый большой кусок + всё рядом (вспышка, дым)
    a = np.array(f.convert('RGBA')); lab, n = ndimage.label(a[..., 3] > 90)
    if n >= 2: k = np.argmax(ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))) + 1; keep = ndimage.binary_dilation(lab == k, iterations=18); a[~keep, 3] = 0
    ys, xs = np.nonzero(a[..., 3] > 8); return Image.fromarray(a[ys.min():ys.max() + 1, xs.min():xs.max() + 1])
def feet(f):     # опора — ботинки: самые нижние тёмные пиксели (вспышка/дым светлые и в расчёт не идут)
    A = np.asarray(f).astype(int); op = A[..., 3] > 150; L = A[..., :3].sum(2); h = op.shape[0]
    low = op.copy(); low[: int(h * 0.6)] = False                     # ботинки — в нижних 40% кадра
    m = low & (L <= max(200, np.percentile(L[low], 15))); ys, xs = np.nonzero(m)
    yb = ys.max(); lo = ys >= yb - 12; return float(np.median(xs[lo])), yb + 1
def top(f): A = np.asarray(f)[..., 3] > 150; return int(np.nonzero(A.any(1))[0][0])
# лист 1 (vaim.jpg, 2x5): столбцы ~50° вверх, ~35° вверх, вбок, ~35° вниз, ~55° вниз; лист 2 (vaim_ud.jpg, 1x4): вверх целится/стреляет, вниз целится/стреляет
def figs(src, rows, cols):     # нарезка по фигурам: столбцы — по центрам фигур, каждый кусок (без склейки) — в ближайшую ячейку ряд/столбец
    im = B.key(B.load(src), 'magenta'); A = np.array(im.convert('RGBA')); m = A[..., 3] > 60; H, W = m.shape
    lab, n = ndimage.label(m); idx = range(1, n + 1); area = ndimage.sum(m, lab, idx); cen = ndimage.center_of_mass(m, lab, idx)
    big_ = sorted(range(n), key=lambda i: -area[i])[:rows * cols]
    xs = sorted(cen[b][1] for b in big_ if cen[b][0] < H / rows)[:cols] if rows > 1 else sorted(cen[b][1] for b in big_)
    if len(xs) < cols: xs = [(c + 0.5) * W / cols for c in range(cols)]
    cell = np.zeros(n + 1, int)
    for i in range(n):
        if area[i] < 30: cell[i + 1] = -1; continue
        r = min(rows - 1, int(cen[i][0] / (H / rows))); c = min(range(cols), key=lambda c: abs(xs[c] - cen[i][1])); cell[i + 1] = r * cols + c
    C = cell[lab]; C[lab == 0] = -1
    sl = ndimage.find_objects(lab); wmed = np.median([sl[b][1].stop - sl[b][1].start for b in big_])
    gx = np.argmin(np.abs(np.arange(W)[:, None] - np.array(xs)[None, :]), 1)     # ближайший столбец для каждого x
    for i in range(n):     # сросшиеся фигуры (кусок шире 1.5 обычной) — делим по столбцам попиксельно
        ys_, xs_ = sl[i]
        if xs_.stop - xs_.start > 1.5 * wmed:
            r = min(rows - 1, int(cen[i][0] / (H / rows))); sub = lab[ys_, xs_] == i + 1; cc = C[ys_, xs_]; cc[sub] = (r * cols + gx[xs_.start:xs_.stop])[None, :].repeat(sub.shape[0], 0)[sub]; C[ys_, xs_] = cc
    out = []
    for k in range(rows * cols):
        a = A.copy(); a[C != k, 3] = 0; yy, xx = np.nonzero(a[..., 3] > 8); out.append(Image.fromarray(a[yy.min():yy.max() + 1, xx.min():xx.max() + 1]))
    print(src, 'figs', len(out), [o.size for o in out]); return out
M = figs('vaim.jpg', 2, 5)
U = figs('vaim_ud.jpg', 1, 4)
TARGET = B.DATA['vSea10']['f'][B.DATA['vSea10']['n'].index('aim')][3]     # высота старого кадра «целится» — тот же размер на экране
def body(f): x, yb = feet(f); return yb - top(f)
kM = TARGET / body(M[2]); kU = TARGET / body(U[2]) * 0.97     # во втором листе масштаб по кадру «вниз» (сверху — голова)
SET = [('aU', U[0], kU), ('aUD', M[0], kM), ('aF', M[2], kM), ('aDD', M[3], kM), ('aD', U[2], kU), ('fU', U[1], kU), ('fUD', M[5], kM), ('fF', M[7], kM), ('fDD', M[8], kM), ('fD', U[3], kU)]
frs = [f.resize((round(f.width * k), round(f.height * k)), Image.LANCZOS) for _, f, k in SET]; names = [n for n, _, _ in SET]
ft = [feet(f) for f in frs]
B.pack('vAim10', frs, names, 1.0, 'bc')
for i, F in enumerate(B.DATA['vAim10']['f']): F[4] = round(ft[i][0]); F[5] = round(ft[i][1])
print('kM', round(kM, 3), 'kU', round(kU, 3))
B.write_data(); print('кадры', [f.size for f in frs])
