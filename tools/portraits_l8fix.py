# Аватарки с пустой полосой цвета фона снизу (бюст не доходит до края ячейки): подрезать полосу и лишний верх,
# увеличить до 128x128. Безопасно запускать повторно — без полосы снизу файл не трогается.
# Запускать после portraits_fix.py / portraits_l7fix.py (их вызывает конец portraits_l7fix.py).
import os, numpy as np
from PIL import Image
SPR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'spr')
BG = np.array([26, 28, 36])
SKIP = {'p_kop.png', 'p_kop2.png'}                     # это машины, не лица
for f in sorted(os.listdir(SPR)):
    if not (f.startswith('p_') and f.endswith('.png')) or f in SKIP: continue
    im = Image.open(os.path.join(SPR, f)).convert('RGBA'); a = np.asarray(im).astype(int); H = a.shape[0]
    near = ((np.abs(a[..., :3] - BG).sum(2) < 18) | (a[..., 3] < 30)).mean(1) > 0.85
    b = 0
    while b < H and near[H - 1 - b]: b += 1
    if b < 2: continue
    t = 0
    while t < H and near[t]: t += 1
    y0 = max(0, t - 4); side = H - b - y0; x0 = (im.width - side) // 2
    im.crop((x0, y0, x0 + side, y0 + side)).resize((H, H), Image.LANCZOS).save(os.path.join(SPR, f))
    print(f, 'низ', b, 'верх', t, '-> кадр', side)

# Максим: голова не по центру (в исходнике справа мусор) — перекадровать по одной самой крупной фигуре
import sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import portraits_fix as PF
from scipy import ndimage
_k = PF.key_green
def _one(im):
    a = _k(im); op = a[..., 3] > 40; lab, n = ndimage.label(op)
    if n > 1: sz = ndimage.sum(op, lab, range(1, n + 1)); a[..., 3] = np.where(lab == 1 + int(np.argmax(sz)), a[..., 3], 0)
    return a
PF.key_green = _one; PF.portrait('art_src/l7/pick_max.jpg', (0, 0, 830, 768), 'maxim'); PF.key_green = _k
