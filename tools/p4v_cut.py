# Ур.4, новый Валера: нарезка листов Flow (art_src/l4v/pick/*.jpg, пурпурный фон) на кадры с альфой -> art_src/l4v/frames/<лист>_NN.png
import os, sys, glob, json
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'art_src', 'l4v')
os.makedirs(os.path.join(P, 'frames'), exist_ok=True)
def key(im):
    a = np.array(im.convert('RGB')).astype(np.float32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = (np.minimum(r, b) - g)                       # «пурпурность»
    al = np.clip(1 - (m - 60) / 120, 0, 1)            # 0 на чистом фоне
    al[(r < 70) & (g < 70) & (b < 70)] = 1
    out = np.dstack([a, al * 255]).astype(np.uint8)
    # снять пурпурную кайму
    k = (al > 0) & (al < 1); out[..., 0][k] = np.minimum(out[..., 0][k], out[..., 1][k] + 40); out[..., 2][k] = np.minimum(out[..., 2][k], out[..., 1][k] + 60)
    return out
info = {}
for f in sorted(glob.glob(os.path.join(P, 'pick', '*.jpg'))):
    name = os.path.splitext(os.path.basename(f))[0]
    a = key(Image.open(f)); op = a[..., 3] > 128
    # линии сетки: длинные тонкие горизонтали/вертикали
    H, W = op.shape
    # тонкие длинные линии сетки (шириной <= 8 px) — убрать
    thinv = op & ~ndimage.binary_opening(op, np.ones((1, 9))); lv = ndimage.binary_opening(thinv, np.ones((45, 1)))
    thinh = op & ~ndimage.binary_opening(op, np.ones((9, 1))); lh = ndimage.binary_opening(thinh, np.ones((1, 45)))
    ln = ndimage.binary_dilation(lv | lh, iterations=1); op &= ~ln; a[..., 3][ln] = 0
    dm = ndimage.binary_dilation(op, iterations=3)
    if name not in ('stomps', 'held', 'carry'):
        prof = op.sum(axis=1); c = int(H * 0.4) + int(np.argmin(prof[int(H * 0.4):int(H * 0.6)])); dm[c - 1:c + 2] = False   # граница рядов
    lab, n = ndimage.label(dm)
    sl = ndimage.find_objects(lab); area = ndimage.sum(op, lab, range(1, n + 1))
    big = [i for i in range(n) if area[i] > area.max() * 0.33]
    cm = ndimage.center_of_mass(op, lab, range(1, n + 1))
    groups = {i: [i] for i in big}
    for i in range(n):
        if i in big or area[i] < 40: continue
        j = min(big, key=lambda b: (cm[i][0] - cm[b][0]) ** 2 + (cm[i][1] - cm[b][1]) ** 2); groups[j].append(i)
    rowh = H / (2 if name != 'gs_' else 2)
    order = sorted(big, key=lambda b: (int(cm[b][0] // (H / 2)), cm[b][1]))
    hs = []
    for k, b in enumerate(order):
        m = np.isin(lab, [g + 1 for g in groups[b]]) & (a[..., 3] > 0)
        ys = np.where(m.any(axis=1))[0]; xs = np.where(m.any(axis=0))[0]
        sub = a[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1].copy(); sub[..., 3] = np.where(m[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1], sub[..., 3], 0)
        Image.fromarray(sub, 'RGBA').save(os.path.join(P, 'frames', '%s_%02d.png' % (name, k)))
        hs.append([int(sub.shape[1]), int(sub.shape[0])])
    info[name] = hs
    print(name, len(order), [h[1] for h in hs])
json.dump(info, open(os.path.join(P, 'frames', 'info.json'), 'w'))
