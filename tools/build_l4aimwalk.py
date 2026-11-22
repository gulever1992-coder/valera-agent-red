# Ур.4: ходьба с прицелом вверх / под 45° — склейка из готовых игровых кадров (не рисование):
#   верх тела из v10_gunaim/v11_gunaim (кадры 0 и 1) + ноги из v10_gunw/v11_gunw (кадры 0..3).
#   -> листы v10_gunaimw / v11_gunaimw: кадры 0..3 ходьба вверх, 4..7 ходьба под 45°.
#   Запускать после build_l4aim.py; потом optimize_assets.py.
import os, json, sys
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
path = os.path.join(ROOT, 'js', 'sprites_data.js'); s = open(path, encoding='utf-8').read()
i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); S = json.loads(s[i:j])
PREVIEW = '--preview' in sys.argv

def fr(k, n):
    v = S[k]; im = Image.open(os.path.join(ROOT, v['img'])).convert('RGBA'); f = v['f'][n]
    return np.array(im.crop((f[0], f[1], f[0] + f[2], f[1] + f[3]))), f

def jeans_top(a):
    r, g, b, al = [a[..., c].astype(int) for c in range(4)]
    m = (al > 128) & (b > r + 30) & (b > 90) & (r < 110) & (g > 60)
    rows = m.sum(1)
    for y in range(int(len(rows) * 0.5), len(rows) - 10):   # дуло белого ружья тоже синее — ищем только снизу
        if rows[y] >= 8 and rows[y:y + 10].min() >= 6: return y
    return int(len(rows) * 0.6)

def glue(up, upf, lg, lgf):
    cu, cl = jeans_top(up), jeans_top(lg)
    over = 6                                   # подол куртки перекрывает шов
    top = up[:cu + over]; legs = lg[cl:]
    H = top.shape[0] - over + legs.shape[0]
    dx = int(round(upf[4] - lgf[4]))           # совмещаем якоря (центр тела)
    x0 = min(0, dx); W = max(up.shape[1], dx + lg.shape[1]) - x0
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    c.alpha_composite(Image.fromarray(legs), (dx - x0, top.shape[0] - over))
    c.alpha_composite(Image.fromarray(top), (-x0, 0))
    return c, upf[4] - x0

out = {}
for aim, walk, sheet in [('v10_gunaim', 'v10_gunw', 'v10_gunaimw'), ('v11_gunaim', 'v11_gunw', 'v11_gunaimw')]:
    ims = []
    for p in (0, 1):
        up, upf = fr(aim, p)
        for n in range(4):
            lg, lgf = fr(walk, n); ims.append(glue(up, upf, lg, lgf))
    x = 0; H = max(im.height for im, _ in ims); W = sum(im.width + 2 for im, _ in ims)
    atl = Image.new('RGBA', (W, H), (0, 0, 0, 0)); F = []
    for im, ax in ims:
        atl.alpha_composite(im, (x, 0)); F.append([x, 0, im.width, im.height, float(ax), float(im.height), im.width / 2, 0]); x += im.width + 2
    rel = 'assets/spr/' + sheet + '.png'
    if PREVIEW:
        bg = Image.new('RGBA', atl.size, (255, 0, 255, 255)); bg.alpha_composite(atl)
        bg.save(os.path.join(os.environ.get('PV_OUT', ROOT), sheet + '_preview.png'))
    else:
        atl.save(os.path.join(ROOT, rel)); out[sheet] = {'img': rel, 'f': F}
if out:
    S.update(out); open(path, 'w', encoding='utf-8', newline='').write(s[:i] + json.dumps(S) + s[j:])
print('ok', list(out) or 'preview', 'листов', len(S))
