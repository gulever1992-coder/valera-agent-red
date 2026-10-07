# вырезает спрайты с зелёного фона: компоненты связности -> список RGBA-кадров (порядок: строки, затем x)
import numpy as np
from PIL import Image
from scipy import ndimage
def key(path, thr=90):
    im = Image.open(path).convert('RGBA'); a = np.array(im).astype(int)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    bg = ((g - np.maximum(r, b)) > thr) | (al < 20)
    a[..., 3] = np.where(bg, 0, 255)
    sp = (g > np.maximum(r, b)) & ~bg  # подавление зелёной каймы
    a[..., 1] = np.where(sp, np.maximum(r, b), g)
    return a.astype(np.uint8)
def frames(path, minpx=400, gap=6):
    a = key(path); m = a[..., 3] > 0
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=gap))
    out = []
    for i, s in enumerate(ndimage.find_objects(lab)):
        if (lab[s] == i + 1).sum() < minpx: continue
        sub = a[s].copy(); sub[..., 3] = np.where((lab[s] == i + 1) & m[s], sub[..., 3], 0)
        out.append((s[0].start, s[1].start, Image.fromarray(sub)))
    rows = []
    for o in sorted(out, key=lambda o: o[0]):
        if rows and abs(o[0] - rows[-1][-1][0]) < 120: rows[-1].append(o)
        else: rows.append([o])
    res = []
    for r in rows: res += [o[2].crop(o[2].getbbox()) for o in sorted(r, key=lambda o: o[1])]
    return res
