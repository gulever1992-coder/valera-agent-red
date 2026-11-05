# Волна от удара кулаками (фаза 3): Flow art_src/l10/waves.jpg (2x2 на пурпурном: нарастает, гребень, ломается, пена)
# -> лист wave10 (кадры w0..w3, якорь — низ-центр) в js/l10_data.js. Запуск: py tools/p10/build_waves.py, затем py tools/optimize_assets.py
import sys, os, json, re
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import build_l10 as B
import numpy as np
from scipy import ndimage
from PIL import Image
s = open(os.path.join(B.ROOT, 'js', 'l10_data.js'), encoding='utf-8').read()
B.DATA.clear(); B.DATA.update(json.loads(re.search(r'window\.L10D = (\{.*\});', s, re.S).group(1)))
im = B.key(B.load('waves.jpg'), 'magenta')
def big(f):
    a = np.array(f.convert('RGBA')); lab, n = ndimage.label(a[..., 3] > 90)
    if n >= 2: k = np.argmax(ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))) + 1; keep = ndimage.binary_dilation(lab == k, iterations=12); a[~keep, 3] = 0     # брызги рядом с гребнем остаются
    ys, xs = np.nonzero(a[..., 3] > 8); return Image.fromarray(a[ys.min():ys.max() + 1, xs.min():xs.max() + 1])
frs = [big(f) for f in B.grid(im, 2, 2)]
print('кадры', [f.size for f in frs])
B.pack('wave10', frs, ['w0', 'w1', 'w2', 'w3'], 0.5, 'bc')
B.write_data(); print('листов', len(B.DATA))
