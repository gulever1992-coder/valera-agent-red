# Финал v2 (2026-11-08): листы Flow на пурпуре -> кадры assets/l10/mid/<имя>N.png
# Кадры одного ряда режутся на общую высоту ряда (общая линия ног) — анимация не «прыгает».
import sys, json, numpy as np
from PIL import Image
from scipy import ndimage
def key(im):     # кей пурпура с подавлением каймы (как в build_fin.py)
    a = np.asarray(im.convert('RGB')).astype(np.float32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.minimum(r, b) - g; al = np.clip(1 - (m - 70) / 90, 0, 1); al[(r > 170) & (b > 170) & (g < 110)] = 0
    sp = np.clip((m - 20) / 120, 0, 1) * (al > 0); mx = np.maximum(g, np.minimum(r, b) - m * sp)
    a[..., 0] = np.where(sp > 0, np.minimum(r, mx + 10), r); a[..., 2] = np.where(sp > 0, np.minimum(b, mx + 10), b)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]; pu = (r > g + 4) & (b > g + 4)
    a[..., 0] = np.where(pu, np.minimum(r, g * 0.85), r); a[..., 2] = np.where(pu, np.minimum(b, g * 1.25 + 12), b)
    return np.dstack([a, al * 255]).astype(np.uint8)
def bands(v, gap, minlen):     # отрезки, где v>0, разделённые пустотой >= gap
    on = np.where(v > 0)[0]; res = []
    if not len(on): return res
    s = on[0]; prev = on[0]
    for x in on[1:]:
        if x - prev > gap: res.append((s, prev + 1)); s = x
        prev = x
    res.append((s, prev + 1)); return [b for b in res if b[1] - b[0] >= minlen]
SRC, OUT = 'art_src/l10/fin2/src/', 'assets/l10/mid/'
# лист: (имя кадров, сколько фигур, ряды по порядку -> индексы фигур, отразить)
SHEETS = {'rkS1': ('rs1_', 8, False), 'rkS2': ('rs2_', 8, False), 'claw': ('cl', 4, False), 'scr': ('scr', 3, False), 'vlie': ('vl', 4, False), 'vwalk': ('vw', 12, False), 'vpose': ('vp', 8, False), 'yura2': ('yw', 11, False), 'basov2': ('bs', 8, True)}
info = {}
for src, (name, cnt, flip) in SHEETS.items():
    rgba = key(Image.open(SRC + src + '.jpg')); al = rgba[..., 3] > 100; H = rgba.shape[0]
    out = []
    rws = bands((al.sum(1) > 3).astype(int), 1, 60)     # ряды по пустым строкам
    nrow = 1 if name in ('cl', 'scr') else 2
    if nrow == 2 and len(rws) == 1 and rws[0][1] - rws[0][0] > H * 0.75:     # ряды касаются (поднятая рука) — режем по самой пустой строке у середины
        v = al.sum(1); m = int(H * 0.4) + int(np.argmin(v[int(H * 0.4):int(H * 0.6)])); rws = [(rws[0][0], m), (m, rws[0][1])]
    for y0, y1 in rws:
        cols = (al[y0:y1].sum(0) > 1).astype(int)
        bs = bands(cols, 4, 40); per = cnt // nrow if name not in ('vw', 'yw', 'vl', 'vp', 'bs') else 0
        while per and len(bs) < per:     # фигуры слиплись (гранатомёт заходит на соседа) — режем самую широкую по самому пустому столбцу у середины
            j = max(range(len(bs)), key=lambda i: bs[i][1] - bs[i][0]); x0, x1 = bs[j]; w = x1 - x0; k = round(w / (sum(b[1] - b[0] for b in bs) / per)) or 2
            sub = al[y0:y1, x0:x1].sum(0); m = x0 + int(w / k * 0.7) + int(np.argmin(sub[int(w / k * 0.7):int(w / k * 1.3)])); bs[j:j + 1] = [(x0, m), (m, x1)]
        for x0, x1 in bs:     # фигуры по пустым столбцам
            m = al[y0:y1, x0:x1]; ys = np.where(m.any(1))[0]
            piece = rgba[y0:y1, x0:x1].copy(); out.append(piece)
    info[name] = []
    for j, p in enumerate(out):
        im = Image.fromarray(p)
        if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
        im.save(OUT + f'{name}{j}.png'); info[name].append(list(im.size))
print(json.dumps(info))
# ракетка фазы 3 (гранатомёт за спиной): rkS1 -> ri0-1 стоит, rr0-5 бег; rkS2 -> rj0-1 прыжок, rw0-5 удары; стопы по центру кадра
import os
MAP = {'rs1_0': 'ri0', 'rs1_1': 'ri1', **{f'rs1_{i}': f'rr{i - 2}' for i in range(2, 8)}, 'rs2_0': 'rj0', 'rs2_1': 'rj1', **{f'rs2_{i}': f'rw{i - 2}' for i in range(2, 8)}}
for src, dst in MAP.items():
    im = Image.open(OUT + src + '.png').convert('RGBA'); a = np.asarray(im)[..., 3]; h = a.shape[0]
    xs = np.where(a[int(h * 0.85):].max(0) > 100)[0]
    if not len(xs): xs = np.where(a.max(0) > 100)[0]
    cx = (xs[0] + xs[-1]) / 2; W = int(2 * max(cx, im.width - cx)) + 2; o = Image.new('RGBA', (W, h), (0, 0, 0, 0)); o.paste(im, (int(W / 2 - cx), 0)); o.save(OUT + dst + '.png'); os.remove(OUT + src + '.png')
for f in os.listdir(OUT):
    if f.startswith(('rka', 'rkb')) or (f.startswith('rk') and f[2:3].isdigit()): os.remove(OUT + f)
