# Интерфейс из Flow: пейджер и сердечко (art_src/ui/ui_pager_N.png, пурпурный фон) -> assets/spr/hud_pager.png, hud_heart.png
# Кей пурпура «размешиванием» (как build_l1props.py), уменьшение с предумноженной альфой. Печатает рамку экрана пейджера (доли).
import numpy as np
from PIL import Image
from scipy import ndimage

def unmix(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    al = np.clip(1 - (np.minimum(r, b) - g) / 235.0, 0, 1)
    al[al < 0.06] = 0
    mag = np.array([255, 0, 255], np.float32)
    col = np.where(al[..., None] > 0, (a - (1 - al[..., None]) * mag) / np.maximum(al[..., None], 1e-3), 0)
    return np.clip(col, 0, 255), al

def parts(al):
    lab, n = ndimage.label(al > 0.5)
    sl = ndimage.find_objects(lab)
    sizes = ndimage.sum(np.ones_like(al), lab, range(1, n + 1))
    order = np.argsort(-sizes)
    return [sl[i] for i in order]

def cut(col, al, s, pad=2):
    y0, y1 = max(0, s[0].start - pad), s[0].stop + pad
    x0, x1 = max(0, s[1].start - pad), s[1].stop + pad
    return col[y0:y1, x0:x1], al[y0:y1, x0:x1]

def save(col, al, w, out):
    h = round(al.shape[0] * w / al.shape[1])
    pm = np.dstack([col * al[..., None], al * 255]).astype(np.float32)
    im = Image.fromarray(pm[..., :3].clip(0, 255).astype(np.uint8)), Image.fromarray(pm[..., 3].clip(0, 255).astype(np.uint8))
    rgb = np.asarray(im[0].resize((w, h), Image.LANCZOS)).astype(np.float32)
    a = np.asarray(im[1].resize((w, h), Image.LANCZOS)).astype(np.float32)
    rgb = np.where(a[..., None] > 0, rgb * 255 / np.maximum(a[..., None], 1), 0)
    Image.fromarray(np.dstack([rgb, a]).clip(0, 255).astype(np.uint8), 'RGBA').save(out)
    return w, h

# пейджер — вариант 0
col, al = unmix('art_src/ui/ui_pager_0.png')
pc, pa = cut(col, al, parts(al)[0])
# экран: жёлто-зелёная заливка
r, g, b = pc[..., 0], pc[..., 1], pc[..., 2]
scr = (g > 120) & (g > b + 40) & (r > 80) & (pa > 0.9)
lab, n = ndimage.label(scr); big = np.argmax(ndimage.sum(scr, lab, range(1, n + 1))) + 1
ys, xs = np.where(lab == big)
H, Wd = pa.shape
print('pager src', Wd, H, 'screen frac', round(xs.min() / Wd, 4), round(ys.min() / H, 4), round((xs.max() + 1) / Wd, 4), round((ys.max() + 1) / H, 4))
print('pager out', save(pc, pa, 400, 'assets/spr/hud_pager.png'))
# сердечко — вариант 2
col, al = unmix('art_src/ui/ui_pager_2.png')
hc, ha = cut(col, al, parts(al)[1])
print('heart out', save(hc, ha, 40, 'assets/spr/hud_heart.png'))

# иконки оружия ур.9–10 — art_src/ui/ui_weap.png, сетка 3x3 (порядок как в промпте)
import os, sys
WEAP = ['rifle', 'pist', 'mini', 'plasma', 'rocket', 'seed', 'cap', 'racket', 'rpg']
src = sys.argv[1] if len(sys.argv) > 1 else 'art_src/ui/ui_weap.png'
if os.path.exists(src):
    col, al = unmix(src)
    lab, n = ndimage.label(ndimage.binary_closing(al > 0.5, iterations=3))
    sl = ndimage.find_objects(lab)
    sizes = ndimage.sum(np.ones_like(al), lab, range(1, n + 1))
    top = sorted(np.argsort(-sizes)[:9])
    boxes = [sl[i] for i in top]
    boxes.sort(key=lambda s: (s[0].start + s[0].stop) / 2)
    rows = [sorted(boxes[i:i + 3], key=lambda s: s[1].start) for i in (0, 3, 6)]
    for name, s in zip(WEAP, [b for r in rows for b in r]):
        c_, a_ = cut(col, al, s)
        print(name, save(c_, a_, 96, f'assets/spr/hud_w_{name}.png'))
