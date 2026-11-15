# Текстура троса для всей игры: распрямляем плетёную стропу из спрайта подлодки (assets/spr/sub.png)
# в вертикальную полосу и делаем её бесшовной -> assets/spr/rope_tile.png (рисует Art.rope).
import os, numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = Image.open(os.path.join(ROOT, 'assets/spr/sub.png')).convert('RGBA')
p0, p1 = np.array([777.5, 140.0]), np.array([811.0, 228.0])     # ось правой стропы правой пары
d = (p1 - p0) / np.linalg.norm(p1 - p0); n = np.array([d[1], -d[0]]); L = int(np.linalg.norm(p1 - p0)); W = 14
# PIL affine: для пикселя (u,v) берёт src(a*u+b*v+c, d*u+e*v+f)
o = p0 - n * (W / 2)
st = src.transform((W, L), Image.AFFINE, (n[0], d[0], o[0], n[1], d[1], o[1]), resample=Image.BICUBIC)
a = np.array(st).astype(float)
# центрируем по альфе и обрезаем по ширине троса
cols = np.where((a[..., 3] > 120).mean(0) > 0.5)[0]; a = a[:, cols[0]:cols[-1] + 1]
# бесшовность: последние K строк плавно переходят в первые
K = 14; top = a[:K].copy(); h = a.shape[0]
for k in range(K): t = (k + 1) / (K + 1); a[h - K + k] = a[h - K + k] * (1 - t) + top[k] * t
a = a[:h - 1]; a[..., 3] = np.where(a[..., 3] > 110, 255, 0)
Image.fromarray(a.astype(np.uint8)).save(os.path.join(ROOT, 'assets/spr/rope_tile.png')); print('rope_tile', a.shape[1], 'x', a.shape[0])
