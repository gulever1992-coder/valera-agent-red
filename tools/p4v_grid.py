# режет лист-сетку (rows x cols) на кадры art_src/l4v/frames/<name>_NN.png (маджента-ключ)
import sys, numpy as np
from PIL import Image
from scipy import ndimage
src, name, rows, cols = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
im = np.asarray(Image.open(src).convert('RGB')).astype(float); H, W = im.shape[:2]; k = 0
for ry in range(rows):
    for rx in range(cols):
        c = im[ry * H // rows:(ry + 1) * H // rows, rx * W // cols:(rx + 1) * W // cols]
        r, g, b = c[..., 0], c[..., 1], c[..., 2]
        a = np.clip(1 - (np.minimum(r, b) - g - 60) / 120, 0, 1)
        lab, n = ndimage.label(ndimage.binary_dilation(a > 0.5, iterations=3))
        sz = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1)); keep = np.isin(lab, [i + 1 for i in range(n) if sz[i] > sz.max() * 0.08])
        a = a * keep; ys, xs = np.where(a > 0.5)
        c = c[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        Image.fromarray(np.dstack([c, a * 255]).astype(np.uint8), 'RGBA').save('art_src/l4v/frames/%s_%02d.png' % (name, k)); k += 1
print(name, k)
