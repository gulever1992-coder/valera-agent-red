# режет лист-сетку (rows x cols) на кадры art_src/l4v/frames/<name>_NN.png (маджента-ключ)
# по целым фигурам: компоненты листа раздаются ячейкам по центру масс (шаг, залезший в соседнюю ячейку, не обрезается)
import sys, os, json, numpy as np
from PIL import Image
from scipy import ndimage
src, name, rows, cols = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
out_dir = sys.argv[5] if len(sys.argv) > 5 else 'art_src/l4v/frames'
im = np.asarray(Image.open(src).convert('RGB')).astype(float); H, W = im.shape[:2]
r, g, b = im[..., 0], im[..., 1], im[..., 2]
A = np.clip(1 - (np.minimum(r, b) - g - 60) / 120, 0, 1)
if os.environ.get('FLOOD'):   # фон = только близкий к маджента цвет, связанный с краем листа (фиолетовая сетка ракетки не вырезается)
    bg = np.sqrt((r - 255) ** 2 + g ** 2 + (b - 255) ** 2) < 90
    lb, _ = ndimage.label(bg); edge = set(np.unique(np.concatenate([lb[0], lb[-1], lb[:, 0], lb[:, -1]]))) - {0}
    out = np.isin(lb, list(edge)); A = np.where(out, A, 1.0)
    rim = ndimage.binary_dilation(out, iterations=2) & ~out & (np.sqrt((r - 255) ** 2 + g ** 2 + (b - 255) ** 2) < 150)   # розовая кайма по краю
    A = np.where(rim, 0.0, A)
lab, n = ndimage.label(ndimage.binary_dilation(A > 0.5, iterations=3)); idx = range(1, n + 1)
sz = np.array(ndimage.sum(np.ones(lab.shape), lab, idx)); cm = ndimage.center_of_mass(np.ones(lab.shape), lab, idx)
k = 0; sizes = []
for ry in range(rows):
    for rx in range(cols):
        ids = [i + 1 for i in range(n) if min(rows - 1, int(cm[i][0] * rows / H)) == ry and min(cols - 1, int(cm[i][1] * cols / W)) == rx]
        big = max((sz[i - 1] for i in ids), default=0); ids = [i for i in ids if sz[i - 1] > big * 0.08]
        a = A * np.isin(lab, ids); ys, xs = np.where(a > 0.5)
        c = im[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        Image.fromarray(np.dstack([c, a * 255]).astype(np.uint8), 'RGBA').save(os.path.join(out_dir, '%s_%02d.png' % (name, k))); sizes.append([int(c.shape[1]), int(c.shape[0])]); k += 1
p = os.path.join(out_dir, 'info.json')
if os.path.exists(p): d = json.load(open(p)); d[name] = sizes; json.dump(d, open(p, 'w'))
print(name, k)
