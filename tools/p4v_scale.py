# Ур.4, новый Валера: масштаб каждого листа по ширине головного убора (фуражка/арбуз) -> art_src/l4v/frames/scale.json
import os, glob, json
import numpy as np
from PIL import Image
from scipy import ndimage
P = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'art_src', 'l4v', 'frames')
info = json.load(open(os.path.join(P, 'info.json')))
def hat_w(path, melon):
    a = np.array(Image.open(path)).astype(int); r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    if melon: m = (g > r + 25) & (g > b + 10) & (al > 0)          # зелёный арбуз
    else: m = (b > r + 15) & (b > g + 5) & (r < 90) & (al > 0) & (np.arange(a.shape[0])[:, None] < a.shape[0] * 0.45)   # тёмно-синяя фуражка в верхней части
    lab, n = ndimage.label(ndimage.binary_closing(m, iterations=2))
    if not n: return None
    sz = ndimage.sum(m, lab, range(1, n + 1)); i = int(np.argmax(sz))
    if sz[i] < 300: return None
    s = ndimage.find_objects(lab)[i]; return s[1].stop - s[1].start
out = {}
for name, fr in info.items():
    ws = [hat_w(os.path.join(P, '%s_%02d.png' % (name, k)), name.startswith('m') and name != 'moves') for k in range(len(fr))]
    v = [w for w in ws if w]
    out[name] = {'hat': float(np.median(v)) if v else None, 'all': ws}
    print(name, out[name]['hat'], ws)
json.dump(out, open(os.path.join(P, 'scale.json'), 'w'))
