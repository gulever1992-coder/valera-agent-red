# Плоты фазы 3 (Flow, art_src/l10/slabs2.jpg, 2x4 на пурпурном) -> лист slab10 + запись в js/l10_data.js
# (только этот лист: остальные данные l10_data.js сохраняются как есть). Запуск: py tools/p10/build_slabs.py
import sys, os, json, re
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import build_l10 as B
s = open(os.path.join(B.ROOT, 'js', 'l10_data.js'), encoding='utf-8').read()
B.DATA.clear(); B.DATA.update(json.loads(re.search(r'window\.L10D = (\{.*\});', s, re.S).group(1)))
SRC = sys.argv[1] if len(sys.argv) > 1 else 'slabs2.jpg'; SQ = float(sys.argv[2]) if len(sys.argv) > 2 else 0.6     # slabs2.jpg — ровные горизонтальные плоты (2026-11-05); SQ — сплющить по высоте
im = B.key(B.load(SRC), 'magenta')
frs = B.grid(im, 4, 2)
import numpy as np
from scipy import ndimage
from PIL import Image
def big(f):     # только самый большой кусок (без обрезков соседних плит), обрезка по нему
    a = np.array(f.convert('RGBA')); lab, n = ndimage.label(a[..., 3] > 90)
    if n < 2: return f
    k = np.argmax(ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))) + 1; a[lab != k, 3] = 0
    ys, xs = np.nonzero(a[..., 3]); return Image.fromarray(a[ys.min():ys.max() + 1, xs.min():xs.max() + 1])
frs = [big(f) for f in frs]
frs = [f.resize((f.width, max(8, round(f.height * SQ))), Image.LANCZOS) for f in frs]
names = ['raft%d' % i for i in range(8)]
print('кадров', len(frs))
B.pack('slab10', frs[:8], names[:len(frs)], 0.5, 'bc')
B.write_data(); print('листов', len(B.DATA))
