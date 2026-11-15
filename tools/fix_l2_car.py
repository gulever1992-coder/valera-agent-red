# Ур.2: убирает серые пятна фона над капотом и багажником машины (атлас street, кадр 6).
# Запускать после build_assets.py.
import os, json, numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = open(os.path.join(ROOT, 'js', 'sprites_data.js'), encoding='utf-8').read(); i = s.find('window.SPRITES = ') + 17
f = json.loads(s[i:s.find(';\nwindow.BGS', i)])['street']['f'][6]
p = os.path.join(ROOT, 'assets', 'spr', 'street.png'); im = Image.open(p).convert('RGBA'); a = np.array(im)
x0, y0, w, h = f[:4]; car = a[y0:y0 + h, x0:x0 + w]; n = 0
for x in list(range(0, int(w * 0.26))) + list(range(int(w * 0.735), w)):
    col = car[:, x]; lum = col[..., :3].astype(int).sum(axis=1) / 3
    for y in range(int(h * 0.45)):
        if col[y, 3] < 60: continue
        if lum[y] < 112 or lum[y] > 175: break          # дошли до тёмного контура кузова
        col[y, 3] = 0; n += 1
Image.fromarray(a).save(p, optimize=True); print('убрано пикселей', n)
