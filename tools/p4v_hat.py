# ширина головного убора на кадре: самый верхний крупный тёмно-синий (фуражка) или зелёный (арбуз) кусок
import numpy as np
from PIL import Image
from scipy import ndimage
def hat_w(im, melon=False):
    a = np.array(im.convert('RGBA')).astype(int); r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    H, W = al.shape
    if W > H * 1.3: return None                                     # лежит — не мерим
    if melon: m = (g > r + 30) & (g > b + 15) & (al > 0)
    else: m = (b > r + 18) & (r < 75) & (g < 85) & (b < 140) & (al > 0)
    m = ndimage.binary_opening(m, iterations=1)
    lab, n = ndimage.label(ndimage.binary_closing(m, iterations=3))
    if not n: return None
    sz = ndimage.sum(m, lab, range(1, n + 1)); sl = ndimage.find_objects(lab)
    cand = [i for i in range(n) if sz[i] > max(200, sz.max() * 0.15)]
    if not cand: return None
    i = min(cand, key=lambda i: sl[i][0].start)                     # самый верхний
    if sl[i][0].start > H * 0.45: return None
    return sl[i][1].stop - sl[i][1].start
