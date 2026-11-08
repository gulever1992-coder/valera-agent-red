# Басов (bs0-7): убрать красную царапину на щеке — красные пиксели в верхней трети кадра заливаются цветом соседней кожи
import numpy as np
from PIL import Image
from scipy import ndimage
OUT = 'assets/l10/mid/'
for j in range(8):
    p = OUT + f'bs{j}.png'; a = np.asarray(Image.open(p).convert('RGBA')).astype(np.int32); h = a.shape[0]
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    red = (r > 110) & (r > g * 1.6) & (r > b * 1.6) & (al > 0)
    red[int(h * 0.42):] = False     # только лицо (гитара и куртка ниже не трогаем)
    red = ndimage.binary_dilation(red, iterations=1) & (al > 0)
    n = int(red.sum())
    if n:
        good = ~red & (al > 0)
        for _ in range(12):     # заливка от краёв внутрь средним по соседям
            if not red.any(): break
            acc = np.zeros(a.shape[:2] + (3,)); cnt = np.zeros(a.shape[:2])
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    gs = np.roll(np.roll(good, dy, 0), dx, 1); cs = np.roll(np.roll(a[..., :3], dy, 0), dx, 1)
                    acc += cs * gs[..., None]; cnt += gs
            fill = red & (cnt > 0); a[fill, :3] = (acc[fill] / cnt[fill, None]).astype(np.int32); red &= ~fill; good |= fill
    Image.fromarray(a.astype(np.uint8)).save(p); print(p, n)
