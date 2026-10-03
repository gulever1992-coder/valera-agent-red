# Подготовка листа кузовов «копейки»: вырезать почти чёрный фон заливкой от краёв, разрезать пару колёс, собрать на зелёном 3x3.
import numpy as np
from PIL import Image
from collections import deque
src = Image.open('art_src/l5_kop_parts.png').convert('RGB')
a = np.array(src).astype(np.int32)
H, W = a.shape[:2]
dark = a.max(axis=2) < 70
bg = np.zeros((H, W), bool)
dq = deque()
for x in range(W):
    for y in (0, H - 1):
        if dark[y, x] and not bg[y, x]: bg[y, x] = True; dq.append((y, x))
for y in range(H):
    for x in (0, W - 1):
        if dark[y, x] and not bg[y, x]: bg[y, x] = True; dq.append((y, x))
while dq:
    y, x = dq.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < H and 0 <= nx < W and dark[ny, nx] and not bg[ny, nx]:
            bg[ny, nx] = True; dq.append((ny, nx))
rgba = np.dstack([a, np.where(bg, 0, 255)]).astype(np.uint8)
im = Image.fromarray(rgba, 'RGBA')
cw, chh = W // 4, H // 2
cells = []
for r in range(2):
    for c in range(4):
        cells.append(im.crop((c * cw, r * chh, (c + 1) * cw, (r + 1) * chh)))
wheels = cells.pop()
half = wheels.width // 2
cells += [wheels.crop((0, 0, half, wheels.height)), wheels.crop((half, 0, wheels.width, wheels.height))]
out = Image.new('RGB', (3 * 520, 3 * 360), (0, 255, 0))
for i, cimg in enumerate(cells):
    bb = cimg.getbbox()
    if bb: cimg = cimg.crop(bb)
    out.paste(cimg.convert('RGB'), (i % 3 * 520 + (520 - cimg.width) // 2, i // 3 * 360 + (360 - cimg.height) // 2), cimg.split()[3])
out.save('art_src/l5_kop_grid.png')
print('ok', len(cells))
