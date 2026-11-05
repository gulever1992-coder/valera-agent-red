# Совмещение картинки Flow (правка) с side_flow.png: ищет масштаб и сдвиг; печатает (ошибка, s, dx, dy): side = s*img + (dx,dy)
import sys, numpy as np
from PIL import Image
A = np.asarray(Image.open(sys.argv[2] if len(sys.argv) > 2 else 'art_src/l10/rig/side_flow.png').convert('L')).astype(float)
B = np.asarray(Image.open(sys.argv[1]).convert('L')).astype(float)
ys, xs = np.mgrid[0:B.shape[0]:5, 0:B.shape[1]:5]; ys = ys.ravel(); xs = xs.ravel()
m0 = B[ys, xs] < 230; ys = ys[m0]; xs = xs[m0]; v = B[ys, xs]
s0 = A.shape[1] / B.shape[1]; best = None
for s in np.arange(s0 - 0.04, s0 + 0.041, 0.005):
  for dx in range(-40, 41, 3):
    for dy in range(-40, 41, 3):
      tx = (s * xs + dx).astype(int); ty = (s * ys + dy).astype(int); m = (tx >= 0) & (tx < A.shape[1]) & (ty >= 0) & (ty < A.shape[0])
      e = np.median(np.abs(A[ty[m], tx[m]] - v[m]))
      if best is None or e < best[0]: best = (e, s, dx, dy)
e, s, dx0, dy0 = best
for ds in np.arange(-0.004, 0.0041, 0.001):
  for dx in range(dx0 - 3, dx0 + 4):
    for dy in range(dy0 - 3, dy0 + 4):
      S = s + ds; tx = (S * xs + dx).astype(int); ty = (S * ys + dy).astype(int); m = (tx >= 0) & (tx < A.shape[1]) & (ty >= 0) & (ty < A.shape[0])
      e2 = np.median(np.abs(A[ty[m], tx[m]] - v[m]))
      if e2 < best[0]: best = (e2, S, dx, dy)
print(best)
