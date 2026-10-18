# Господин Икс везде — только глаза и улыбка на чёрном. Исходники до переделки: art_src/mrx_old/
# Запуск: py tools/mrx_eyes.py  (потом py tools/optimize_assets.py)
import os, shutil
import numpy as np
from PIL import Image, ImageFilter

R = os.path.join(os.path.dirname(__file__), '..')
OLD = os.path.join(R, 'art_src', 'mrx_old')
os.makedirs(OLD, exist_ok=True)


def src(rel):
    """Оригинал (до переделки) — копия в art_src/mrx_old, чтобы скрипт можно было гонять повторно."""
    keep = os.path.join(OLD, rel.replace('/', '__'))
    if not os.path.exists(keep): shutil.copy(os.path.join(R, rel), keep)
    return Image.open(keep)


def masks(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    red = (r > 120) & (r > g * 1.8) & (r > b * 1.8)
    wh = (r > 150) & (g > 150) & (b > 150)
    return red, wh


def glow(o, red, rad):
    """Мягкое красное свечение вокруг глаз."""
    m = Image.fromarray((red * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(rad))
    k = np.asarray(m).astype(np.float32)[..., None] / 255 * 0.55
    return np.maximum(o, (np.array([200, 10, 10]) * k))


# 1. портрет: всё, кроме глаз и зубов, — чёрное
a = np.asarray(src('assets/spr/p_mrx.png').convert('RGB')).astype(np.float32)
red, wh = masks(a)
o = np.zeros_like(a); o = glow(o, red, 3); o[red] = a[red]; o[wh] = a[wh]
Image.fromarray(o.clip(0, 255).astype(np.uint8)).save(os.path.join(R, 'assets/spr/p_mrx.png'))
ys, xs = np.where(red | wh); FACE = Image.fromarray(o.clip(0, 255).astype(np.uint8)).crop((xs.min() - 6, ys.min() - 6, xs.max() + 7, ys.max() + 7))
print('портрет: глаз', red.sum(), 'зубов', wh.sum(), 'лицо', FACE.size)


def face_on_black(w, h, fw, cx, cy):
    """Чёрный кадр w x h, глаза и улыбка шириной fw с центром (cx, cy) — крупные пиксели."""
    im = Image.new('RGB', (w, h), (0, 0, 0)); f = FACE.resize((fw, round(FACE.height * fw / FACE.width)), Image.NEAREST)
    im.paste(f, (round(cx - f.width / 2), round(cy - f.height / 2))); return im


# 2. ложа в финале ур.7 (лист hmrx — 4 кадра по горизонтали): чёрная ложа, глаза и улыбка; поклон — лицо опускается
h7 = src('assets/l7v4/hmrx.jpg'); n = 4; W, H = h7.width // n, h7.height
out = Image.new('RGB', h7.size, (0, 0, 0))
for i, dy in enumerate((0, 4, 8, 22)):
    out.paste(face_on_black(W, H, round(W * 0.26), W / 2, H * 0.36 + dy), (i * W, 0))
out.save(os.path.join(R, 'assets/l7v4/hmrx.jpg'), quality=92)

# 3. ложа в старых сценах ур.7 (mrx_box)
b7 = src('assets/l7/mrx_box.jpg')
face_on_black(b7.width, b7.height, round(b7.width * 0.5), b7.width / 2, b7.height * 0.4).save(os.path.join(R, 'assets/l7/mrx_box.jpg'), quality=92)
print('ур.7: hmrx, mrx_box')
