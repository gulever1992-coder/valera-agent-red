# Финальная катсцена: фоны + листы на пурпуре -> assets/l10/mid (автонарезка по промежуткам между фигурами)
import sys, json, numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, 'tools/p10'); import importlib.util
spec = importlib.util.spec_from_file_location('bm', 'tools/p10/build_mid.py')
SRC, OUT = 'art_src/l10/mid/src/', 'assets/l10/mid/'
def key(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.minimum(r, b) - g; al = np.clip(1 - (m - 70) / 90, 0, 1); al[(r > 170) & (b > 170) & (g < 110)] = 0
    sp = np.clip((m - 20) / 120, 0, 1) * (al > 0); mx = np.maximum(g, np.minimum(r, b) - m * sp)
    a[..., 0] = np.where(sp > 0, np.minimum(r, mx + 10), r); a[..., 2] = np.where(sp > 0, np.minimum(b, mx + 10), b)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]; pu = (r > g + 4) & (b > g + 4)
    a[..., 0] = np.where(pu, np.minimum(r, g * 0.85), r); a[..., 2] = np.where(pu, np.minimum(b, g * 1.25 + 12), b)
    return np.dstack([a, al * 255]).astype(np.uint8)
for n in ['nukefar', 'beach', 'glade', 'cuvova']:
    im = Image.open(SRC + n + '.jpg').convert('RGB'); w, h = im.size; th = round(w * 9 / 16)
    if th < h: im = im.crop((0, (h - th) // 2, w, (h - th) // 2 + th))
    im.resize((1280, 720), Image.LANCZOS).save(OUT + n + '.jpg', quality=88)
SHEETS = {'tmach': (4, 5), 'yura': (6, 0), 'basov': (4, 5), 'vova': (7, 5), 'vfin': (8, 5)}     # (кадров, расширение маски для склейки искр/дыма)
info = {}
for n, (cnt, dil) in SHEETS.items():
    rgba = key(Image.open(SRC + n + '.jpg')); al = rgba[..., 3] > 100; H = rgba.shape[0]
    lab, k = ndimage.label(ndimage.binary_dilation(al, iterations=dil)) if dil else ndimage.label(al)
    sz = ndimage.sum(al, lab, range(1, k + 1)); objs = ndimage.find_objects(lab)
    keep = sorted([i for i in range(k) if sz[i] > al.sum() * 0.012], key=lambda i: -sz[i])[:cnt]
    rows = sorted(keep, key=lambda i: (round(((objs[i][0].start + objs[i][0].stop) / 2) / (H / 2.2)), objs[i][1].start))
    info[n] = []
    for j, i in enumerate(rows):
        s = objs[i]; piece = rgba[s].copy(); piece[..., 3] = piece[..., 3] * (lab[s] == i + 1)
        Image.fromarray(piece).save(OUT + f'{n}{j}.png'); info[n].append([piece.shape[1], piece.shape[0]])
print(json.dumps(info))
# vfin1/2/3: вшитая земля/грязь под фигурой — тёмное малонасыщенное ниже 85% высоты; у vfin3 — плита ниже ступней
for n, cut in [('vfin1', 0.80), ('vfin2', 0.85), ('vfin3', 0.88)]:
    a = np.asarray(Image.open(OUT + n + '.png')).copy(); h = a.shape[0]
    r, g, b = [a[..., i].astype(int) for i in range(3)]; mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b)
    ground = (mx - mn < 40) & (np.arange(h)[:, None] > h * cut) & ~((b > r + 15))     # серо-коричневое, не джинсы
    if n == 'vfin3': ground |= (np.arange(h)[:, None] > h * 0.955)
    a[..., 3] = np.where(ground, 0, a[..., 3]); Image.fromarray(a).save(OUT + n + '.png')
