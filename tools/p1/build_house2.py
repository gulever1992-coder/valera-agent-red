# Новый дом между набережной и детской площадкой (Flow, art_src/b_house2.jpg на пурпуре) -> assets/b/house2.png + запись в window.BUILDINGS
import os, json
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TH = 520                                                     # логическая высота
a = np.array(Image.open(os.path.join(ROOT, 'art_src', 'b_house2.jpg')).convert('RGB')).astype(np.float32)
t = np.clip((np.minimum(a[..., 0], a[..., 2]) - a[..., 1]) / 235.0, 0, 1)
al = np.clip((1 - t - 0.14) / 0.66, 0, 1)
lab, n = ndimage.label(al > 0.5); sz = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
keep = ndimage.binary_dilation(lab == int(np.argmax(sz)) + 1, iterations=2); al = np.where(keep, al, 0)
rgb = np.clip((a - t[..., None] * np.array([255, 0, 255], np.float32)) / np.maximum(1 - t, 0.2)[..., None], 0, 255)
ys = np.where((al > 0.5).sum(axis=1) > 3)[0]; xs = np.where((al > 0.5).sum(axis=0) > 3)[0]
f = np.dstack([rgb, al[..., None] * 255])[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1]
k = TH * 2 / f.shape[0]; size = (round(f.shape[1] * k), round(f.shape[0] * k))
pm = np.dstack([f[..., :3] * f[..., 3:4] / 255, f[..., 3:4]]).astype(np.float32)
ch = [np.array(Image.fromarray(pm[..., c]).resize(size, Image.LANCZOS)) for c in range(4)]
A = np.clip(ch[3], 0, 255); out = np.dstack([np.clip(c / np.maximum(A / 255, 1e-3), 0, 255) for c in ch[:3]] + [np.where(A > 100, 255, 0)])
Image.fromarray(out.astype(np.uint8), 'RGBA').save(os.path.join(ROOT, 'assets', 'b', 'house2.png'), optimize=True)
p = os.path.join(ROOT, 'js', 'sprites_data.js'); s = open(p, encoding='utf-8').read()
i = s.find('window.BUILDINGS = ') + 19; j = s.find(';\n', i); B = json.loads(s[i:j])
B['house2'] = {'img': 'assets/b/house2.png', 'w': round(size[0] / 2, 1), 'h': round(size[1] / 2, 1)}
s = s[:i] + json.dumps(B) + s[j:]; open(p, 'w', encoding='utf-8').write(s)
print('house2', B['house2'])
