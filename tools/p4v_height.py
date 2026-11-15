# Ур.4: замер роста Валеры без головного убора — от низа ступней до верха лица (кожа под козырьком/арбузом)
import json, numpy as np, os
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def load():
    s = open(os.path.join(ROOT, 'js/sprites_data.js'), encoding='utf-8').read(); i = s.find('window.SPRITES = ') + 17
    return json.loads(s[i:s.find(';\nwindow.BGS', i)])
def face_h(c):
    c = c.astype(int); al = c[..., 3] > 100
    sk = al & (c[..., 0] > 185) & (c[..., 1] > 120) & (c[..., 2] > 80) & (c[..., 0] - c[..., 2] > 45) & (c[..., 0] - c[..., 1] > 15) & (c[..., 0] - c[..., 1] < 95)
    rows = np.where(sk.sum(1) >= 3)[0]; ys = np.where(al.any(1))[0]
    if not len(rows): return None
    top = rows[0]
    if top > ys[0] + (ys[-1] - ys[0]) * 0.35: return None      # лицо не сверху (лёжа, со спины) — не мерим
    return ys[-1] + 1 - top
def sheet_h(D, n, idx=None):
    d = D[n]; a = np.array(Image.open(os.path.join(ROOT, d['img'])).convert('RGBA')); hs = []
    for k, f in enumerate(d['f']):
        if idx is not None and k not in idx: continue
        h = face_h(a[f[1]:f[1] + f[3], f[0]:f[0] + f[2]])
        if h: hs.append(h)
    return float(np.median(hs)) if hs else None
if __name__ == '__main__':
    D = load(); ref = sheet_h(D, 'v7_act', [0, 6])
    for n, idx in [('v7_act', [0, 6]), ('v7_idle', None), ('v16_stomp', None), ('v14_stomp', None), ('v12_fist', [0, 7]), ('v12_run', None), ('v17_runs', None),
                   ('v10_gun', [0]), ('v10_gun', list(range(8, 16))), ('v11_gun', [0]), ('v11_gun', list(range(8, 16))), ('v15_gs', None), ('v19_mrun', None), ('v19_mact', [6]),
                   ('v7_cap', None), ('v13_cap', None), ('v14_swat', None), ('v14_punch', None)]:
        h = sheet_h(D, n, idx); print(n, idx if idx and len(idx) < 3 else '', h, round(ref / h, 3) if h else '-')
