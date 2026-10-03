# Золотистый матиз сбоку: из листа Flow (зелёный фон) вырезает кузов, разбитый кузов и колесо, собирает сетку 3x1 для build_l5.
import sys, glob, os
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from key_green import key_green
src = sys.argv[1] if len(sys.argv) > 1 else 'art_src/l5_matiz_side_src.png'
im = key_green(Image.open(src))
a = np.array(im)
op = a[..., 3] > 40
lab, nl = ndimage.label(ndimage.binary_dilation(op, iterations=6))
objs = ndimage.find_objects(lab)
areas = ndimage.sum(op, lab, range(1, nl + 1))
big = sorted([j for j in range(nl) if areas[j] > areas.max() * 0.15], key=lambda j: objs[j][1].start)
assert len(big) == 3, ('ожидалось 3 объекта', len(big), areas)
cells = []
for j in big:
    m = (lab == j + 1)[..., None] & (a[..., 3:4] > 0)
    c = Image.fromarray(np.where(m, a, 0).astype(np.uint8), 'RGBA')
    cells.append(c.crop(c.getbbox()))
# колёса: арки кузова — широкие провалы у нижнего края
body = np.array(cells[0])[..., 3] > 40
h, w = body.shape
low = body[int(h * 0.80):].mean(axis=0) < 0.35          # пустые столбцы у низа
runs, st = [], None
for x, v in enumerate(list(low) + [False]):
    if v and st is None: st = x
    if not v and st is not None:
        if x - st > w * 0.08: runs.append((st, x))
        st = None
print('арки (доли ширины):', [((r[0] + r[1]) / 2 / w) for r in runs], 'размер кузова', cells[0].size, 'колесо', cells[2].size)
out = Image.new('RGB', (3 * 760, 420), (0, 255, 0))
for i, c in enumerate(cells):
    out.paste(c.convert('RGB'), (i * 760 + (760 - c.width) // 2, (420 - c.height) // 2), c.split()[3])
out.save('art_src/l5_matiz_side.png')
print('ok')
