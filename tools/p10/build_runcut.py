# Катсцена «Валера бежит по крыше -> из завода вылезает Семён» (арт Flow, art_src/l10/rs_*).
# Лист бега rs_runsheet.png (8 кадров на пурпуре) -> assets/l10/rsrun.png; кадры завода rs_fN.jpg -> assets/l10/rsfN.jpg.
# Выход: js/runcut_data.js (L10.RSC). Запуск из корня игры: py tools/p10/build_runcut.py, затем py tools/optimize_assets.py
import glob, json, os
import numpy as np
from PIL import Image
from scipy import ndimage as nd

SRC, OUT = 'art_src/l10/', 'assets/l10/'


def key(path):
    """пурпур -> прозрачность, без розовой каймы"""
    a = np.asarray(Image.open(path).convert('RGB')).astype(float); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mg = np.minimum(r, b) - g
    al = np.clip(1 - (mg - 25) / 60, 0, 1)
    al = nd.binary_opening(al > 0.5, iterations=1) * al
    sp = mg > 10; a[..., 0] = np.where(sp, np.minimum(r, g + 18), r); a[..., 2] = np.where(sp, np.minimum(b, g + 24), b)
    return np.dstack([a, al * 255]).clip(0, 255).astype('uint8')


def run_sheet(path):
    """лист 4x2 -> кадры по сетке (кадры могут касаться друг друга), выровнены по низу"""
    sh = key(path); H0, W0 = sh.shape[:2]; tiles = []
    for r in range(2):
        for cc in range(4):
            t = sh[r * H0 // 2:(r + 1) * H0 // 2, cc * W0 // 4:(cc + 1) * W0 // 4].copy()
            lb, n = nd.label(t[..., 3] > 40); sz = nd.sum(np.ones_like(lb), lb, range(1, n + 1)); big = 1 + int(np.argmax(sz))
            keep = nd.binary_dilation(lb == big, iterations=6); t[..., 3] = np.where(keep, t[..., 3], 0)
            ys, xs = np.nonzero(t[..., 3] > 8); tiles.append(t[ys.min():ys.max() + 1, xs.min():xs.max() + 1])
    W = sum(t.shape[1] for t in tiles) + 2 * len(tiles); H = max(t.shape[0] for t in tiles)
    at = np.zeros((H, W, 4), 'uint8'); x = 0; rects = []
    for t in tiles: at[H - t.shape[0]:, x:x + t.shape[1]] = t; rects.append([x, H - t.shape[0], t.shape[1], t.shape[0]]); x += t.shape[1] + 2
    Image.fromarray(at).save(OUT + 'rsrun.png', optimize=True); return rects


data = {'run': run_sheet(SRC + 'rs_runsheet.png'), 'plates': []}
for p in sorted(glob.glob(SRC + 'rs_f[0-9].jpg')):
    n = 'rsf' + os.path.basename(p)[4]; Image.open(p).convert('RGB').resize((1280, 720), Image.LANCZOS).save(OUT + n + '.jpg', quality=90); data['plates'].append(n)
open('js/runcut_data.js', 'w', encoding='utf-8').write('// собрано tools/p10/build_runcut.py\nL10.RSC = ' + json.dumps(data) + ';\n')
print(data)
