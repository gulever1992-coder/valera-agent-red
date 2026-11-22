# Ур.7 v4: простенки «поверх персонажей» у стыков комнат расширяются до тёмного проёма двери с каждой стороны,
# чтобы Валера был виден только в дверях, а не поверх стены. Запускать после tools/l7v5_adm.py.
import json, os
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'js', 'l7v4_adm_props.js'); s = open(P, encoding='utf-8').read()
i = s.find('V4_LAYF = ') + 10; d, n = json.JSONDecoder().raw_decode(s[i:]); j = i + n
def dark(col, x0, st, W):   # первый столбец, от которого 12 подряд тёмные (проём двери), не дальше 60 px
    for x in range(x0, x0 + st * 60, st):
        if all(0 <= x + st * k < W and col[x + st * k] < 24 for k in range(12)): return x
    return None
occ = []
for f, row in enumerate(d['rows']):
    a = np.array(Image.open(os.path.join(ROOT, 'assets', 'l7v4', 'af%d.png' % (f + 1))).convert('L')).astype(float); col = a[150:290].mean(0); W = a.shape[1]
    base = d.get('occ_base', d['occ']); oc = [list(q) for q in base[f]]
    for r in row[1:]:
        sx = round(r[0] * 2)
        if r[2] == 0: continue                    # лестничная клетка — без простенка
        l = dark(col, sx - 4, -1, W); rr = dark(col, sx + 4, 1, W)
        if l is None or rr is None: continue
        oc.append([(l + 1) / 2, (rr - l - 1) / 2])
    occ.append(oc); print('этаж', f + 1, len(oc) - len(base[f]), 'простенков расширено')
d['occ_base'] = d.get('occ_base', d['occ']); d['occ'] = occ
s = s[:i] + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + s[j:]
open(P, 'w', encoding='utf-8', newline='').write(s)
