# Ур.3: гладильная доска (кадр 4 листа fg) — целиком из Flow art_src/l1/k4.jpg; дописывается в конец атласа assets/spr/fg.png
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from key_green import key_green
a = np.array(key_green(Image.open(os.path.join(ROOT, 'art_src', 'l1', sys.argv[1] if len(sys.argv) > 1 else 'k4.jpg'))))
a[..., 3] = np.where(a[..., 3] > 100, a[..., 3], 0)
lab, n = ndimage.label(ndimage.binary_dilation(a[..., 3] > 0, iterations=3))
sz = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
a[..., 3] = np.where(lab == int(np.argmax(sz)) + 1, a[..., 3], 0)
ys = np.where(a[..., 3].any(axis=1))[0]; xs = np.where(a[..., 3].any(axis=0))[0]
a = a[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1]
s = open(os.path.join(ROOT, 'js', 'sprites_data.js'), encoding='utf-8').read()
i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); S = json.loads(s[i:j])
old = S['fg']['f'][4]
k = old[3] / a.shape[0]
im = Image.fromarray(a, 'RGBA').resize((round(a.shape[1] * k), old[3]), Image.LANCZOS)
p = os.path.join(ROOT, S['fg']['img'].split('?')[0])
at = Image.open(p).convert('RGBA')
x0 = max(f[0] + f[2] for f in S['fg']['f']) + 2
if at.width >= x0 + im.width and old[0] >= x0 - 2: x0 = old[0]                  # повторный запуск — на то же место
new = Image.new('RGBA', (max(at.width, x0 + im.width), max(at.height, im.height)))
new.paste(at, (0, 0)); new.paste((0, 0, 0, 0), (x0, 0, x0 + im.width, im.height)); new.alpha_composite(im, (x0, 0))
new.save(p, optimize=True)
S['fg']['f'][4] = [x0, 0, im.width, im.height, round(im.width * 0.4, 1), float(im.height), round(im.width * 0.4, 1), 0]
s = s[:i] + json.dumps(S) + s[j:]
open(os.path.join(ROOT, 'js', 'sprites_data.js'), 'w', encoding='utf-8').write(s)
print('fg[4]', S['fg']['f'][4], new.size)
