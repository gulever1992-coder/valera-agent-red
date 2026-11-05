# Совмещение вида сбоку разметки владельца с исходником _t0_src.jpg: t0 = s*u + (ox, oy)
import numpy as np
from PIL import Image
U = Image.open('C:/Users/gulev/AppData/Local/Temp/claude/C--Users-gulev-CRM/b008e84b-e6be-40a8-a3e7-0bf39bd9c884/images/14.webp').convert('RGB')
T = np.asarray(Image.open('refs/l10/_t0_src.jpg').convert('L')).astype(float)
u = np.asarray(U).astype(int); red = (u[..., 0] > 110) & (u[..., 1] < 80) & (u[..., 0] - u[..., 1] > 50)
ug = np.asarray(U.convert('L')).astype(float)
# точки-образцы на виде сбоку пользователя (не красные, не белые)
ys, xs = np.mgrid[120:600:6, 800:1210:6]; ys = ys.ravel(); xs = xs.ravel()
from scipy import ndimage as nd
rd = nd.binary_dilation(red, iterations=4)
ok = (~rd[ys, xs]) & (ug[ys, xs] < 235); ys = ys[ok]; xs = xs[ok]; v = ug[ys, xs]
best = None
for s in np.arange(0.8, 1.6, 0.02):
  for ox in range(-1000, 0, 6):
    for oy in range(-250, 100, 6):
      tx = (s * xs + ox).astype(int); ty = (s * ys + oy).astype(int)
      m = (tx >= 0) & (tx < T.shape[1]) & (ty >= 0) & (ty < T.shape[0])
      if m.mean() < 0.95: continue
      e = np.abs(T[ty[m], tx[m]] - v[m]).mean()
      if best is None or e < best[0]: best = (e, s, ox, oy)
e, s, ox, oy = best
for ds in np.arange(-0.012, 0.013, 0.002):
  for dx in range(-4, 5):
    for dy in range(-4, 5):
      S = s + ds; tx = (S * xs + ox + dx).astype(int); ty = (S * ys + oy + dy).astype(int)
      m = (tx >= 0) & (tx < T.shape[1]) & (ty >= 0) & (ty < T.shape[0])
      e2 = np.abs(T[ty[m], tx[m]] - v[m]).mean()
      if e2 < best[0]: best = (e2, S, ox + dx, oy + dy)
print(best)
