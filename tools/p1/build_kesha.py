# Кеша целится вверх / прямо / вниз (Flow, art_src/l1/h7.jpg, сетка 3x2 на зелёном) -> лист kesha_c + точки дула js/l2_kesha_data.js
# Кадры: 0 вверх, 1 прямо, 2 вниз, 3-5 то же с выстрелом. Масштаб — как у прежнего кадра прицела kesha_b[0].
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from key_green import key_green
a = np.array(key_green(Image.open(os.path.join(ROOT, 'art_src', 'l1', sys.argv[1] if len(sys.argv) > 1 else 'h7.jpg'))))
a[..., 3] = np.where(a[..., 3] > 110, 255, 0)
H, W = a.shape[:2]
fr = []
for r in range(2):
    for cc in range(3):
        cell = a[r * H // 2:(r + 1) * H // 2, cc * W // 3:(cc + 1) * W // 3].copy()
        lab, n = ndimage.label(ndimage.binary_dilation(cell[..., 3] > 0, iterations=4))
        sz = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
        keep = np.isin(lab, [q + 1 for q in range(n) if sz[q] > sz.max() * 0.02])   # тело + вспышка выстрела
        cell[..., 3] = np.where(keep, cell[..., 3], 0)
        ys = np.where(cell[..., 3].any(axis=1))[0]; xs = np.where(cell[..., 3].any(axis=0))[0]
        fr.append(cell[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1])
s = open(os.path.join(ROOT, 'js', 'sprites_data.js'), encoding='utf-8').read()
i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); S = json.loads(s[i:j])
k = S['kesha_b']['f'][0][3] / fr[1].shape[0]
imgs, F, MUZ, x = [], [], [], 0
for q, f in enumerate(fr):
    im = Image.fromarray(f, 'RGBA').resize((round(f.shape[1] * k), round(f.shape[0] * k)), Image.LANCZOS)
    arr = np.array(im); arr[..., 3] = np.where(arr[..., 3] > 90, 255, 0)
    al = arr[..., 3] > 0; h = al.shape[0]; bot = np.where(al.any(axis=1))[0][-1]
    band = al[int(bot - h * 0.1):bot + 1]; xs = np.where(band.any(axis=0))[0]; ax = (xs[0] + xs[-1]) / 2   # между ботинками
    # дуло: самая правая тёмная (пистолет) точка в верхних 70 % кадра
    rgb = arr[..., :3].astype(int); dark = al & (rgb.max(axis=2) < 75); dark[int(h * 0.7):] = False
    cols = np.where(dark.any(axis=0))[0]; mx = cols[-1]; my = float(np.mean(np.where(dark[:, max(0, mx - 3):mx + 1].any(axis=1))[0]))
    MUZ.append([round((mx + 1 - ax) / 2, 1), round((my - (bot + 1)) / 2, 1)])                     # в логических px от опоры
    imgs.append(arr); F.append([x, 0, arr.shape[1], arr.shape[0], round(float(ax), 1), float(bot + 1), round(float(ax), 1), 0]); x += arr.shape[1] + 2
at = Image.new('RGBA', (x, max(f.shape[0] for f in imgs)))
for f, r in zip(imgs, F): at.paste(Image.fromarray(f, 'RGBA'), (r[0], 0))
at.save(os.path.join(ROOT, 'assets', 'spr', 'kesha_c.png'), optimize=True)
S['kesha_c'] = {'img': 'assets/spr/kesha_c.png', 'f': F}
s = s[:i] + json.dumps(S) + s[j:]
open(os.path.join(ROOT, 'js', 'sprites_data.js'), 'w', encoding='utf-8').write(s)
with open(os.path.join(ROOT, 'js', 'l2_kesha_data.js'), 'w', encoding='utf-8') as fp:
    fp.write('// автоматически создано tools/p1/build_kesha.py — точка дула Кеши (лог. px от опоры, лицом вправо) для кадров kesha_c 0..5\nwindow.KESHA_MUZ = ' + json.dumps(MUZ) + ';\n')
print('kesha_c', at.size, 'дуло', MUZ)
