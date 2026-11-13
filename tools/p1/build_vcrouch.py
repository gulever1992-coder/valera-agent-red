# Валера: атаки сидя (лист Flow art_src/l1/g8.jpg, сетка 3x2 на зелёном) -> assets/spr/v_crouch.png + запись в js/sprites_data.js
# Кадры: 0 замах сидя, 1 удар сидя, 2 замах броска, 3 бросок, 4 замах бутылкой, 5 удар бутылкой. Масштаб — как у кадра приседа v_bottle[6].
import os, sys, json, re
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from key_green import key_green
src = Image.open(os.path.join(ROOT, 'art_src', 'l1', sys.argv[1] if len(sys.argv) > 1 else 'g8.jpg'))
a = np.array(key_green(src)); a[..., 3] = np.where(a[..., 3] > 110, 255, 0)
H, W = a.shape[:2]
fr = []
for r in range(2):
    for cc in range(3):
        cell = a[r * H // 2:(r + 1) * H // 2, cc * W // 3:(cc + 1) * W // 3].copy()
        lab, n = ndimage.label(ndimage.binary_dilation(cell[..., 3] > 0, iterations=3))
        sz = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
        keep = lab == int(np.argmax(sz)) + 1                      # без летящей гайки и мусора
        cell[..., 3] = np.where(keep, cell[..., 3], 0)
        ys = np.where(cell[..., 3].any(axis=1))[0]; xs = np.where(cell[..., 3].any(axis=0))[0]
        fr.append(cell[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1])
s = open(os.path.join(ROOT, 'js', 'sprites_data.js'), encoding='utf-8').read()
i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); S = json.loads(s[i:j])
target = S['v_bottle']['f'][6][3]                                 # высота приседа в атласе
k = target / fr[3].shape[0]
imgs, F, x = [], [], 0
for f in fr:
    im = Image.fromarray(f, 'RGBA').resize((round(f.shape[1] * k), round(f.shape[0] * k)), Image.LANCZOS)
    arr = np.array(im); arr[..., 3] = np.where(arr[..., 3] > 90, 255, 0)
    al = arr[..., 3] > 0; h = al.shape[0]
    ys = np.where(al.any(axis=1))[0]; bot = ys[-1]
    # опорная точка — середина корпуса над ступнями (по нижней трети без вытянутой руки)
    band = al[int(bot - h * 0.12):bot + 1]; xs = np.where(band.any(axis=0))[0]
    ax = (xs[0] + xs[-1]) / 2
    imgs.append(arr); F.append([x, 0, arr.shape[1], arr.shape[0], round(float(ax), 1), float(bot + 1), round(float(ax), 1), 0]); x += arr.shape[1] + 2
at = Image.new('RGBA', (x, max(f.shape[0] for f in imgs)))
for f, r in zip(imgs, F): at.paste(Image.fromarray(f, 'RGBA'), (r[0], 0))
at.save(os.path.join(ROOT, 'assets', 'spr', 'v_crouch.png'), optimize=True)
S['v_crouch'] = {'img': 'assets/spr/v_crouch.png', 'f': F}
s = s[:i] + json.dumps(S) + s[j:]
open(os.path.join(ROOT, 'js', 'sprites_data.js'), 'w', encoding='utf-8').write(s)
print('v_crouch', len(F), 'кадров', at.size, 'масштаб', round(k, 3))
