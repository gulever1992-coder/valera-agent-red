# Вырезает части нового Семёна (фаза 3) из картинок Flow на пурпурном фоне -> art_src/l10/sem3/new/<имя>.png (прозрачный фон, обрезано по содержимому).
# Запуск из корня игры: py tools/p10/sem3/cut_parts.py
import os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
SRC = os.path.join(ROOT, 'art_src', 'l10', 'sem3', '_shots'); OUT = os.path.join(ROOT, 'art_src', 'l10', 'sem3', 'new')
os.makedirs(OUT, exist_ok=True)


def key(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # «пурпурность»: красный и синий высокие, зелёный низкий
    m = np.minimum(r, b) - g
    alpha = np.clip(1 - (m - 60) / 90, 0, 1)          # m>150 — фон, m<60 — объект
    # убрать пурпурную кайму: снизить r и b до уровня g+... на полупрозрачных краях
    spill = np.clip((np.minimum(r, b) - g - 20) / 255, 0, 1) * (1 - alpha * 0.5)
    r2 = r - spill * (r - g) * 0.9; b2 = b - spill * (b - g) * 0.9
    out = np.dstack([r2, g, b2, alpha * 255]).clip(0, 255).astype(np.uint8)
    # только крупные куски: мелкий мусор по фону убираем
    lab, n = ndimage.label(alpha > 0.5)
    if n:
        sizes = ndimage.sum(np.ones_like(alpha), lab, range(1, n + 1)); keep = np.zeros(n + 1, bool); keep[1:] = sizes > sizes.max() * 0.02
        mask = ndimage.binary_dilation(keep[lab], iterations=2); out[..., 3] = (out[..., 3] * mask).astype(np.uint8)
    return Image.fromarray(out, 'RGBA'), lab, n


def save(img, name, pad=4):
    bb = img.getbbox(); o = (max(0, bb[0] - pad), max(0, bb[1] - pad)); img = img.crop((o[0], o[1], min(img.width, bb[2] + pad), min(img.height, bb[3] + pad)))
    img.save(os.path.join(OUT, name + '.png')); print(name, img.size, 'origin', o)
    if name == 'gun': open(os.path.join(OUT, 'gun_origin.txt'), 'w').write('%d %d' % o)


def components(img, lab, n):
    """отдельные крупные куски (для листа с двумя кистями) слева направо"""
    al = np.asarray(img)[..., 3]; res = []
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        if len(xs) < al.size * 0.01: continue
        res.append((xs.min(), xs.max(), ys.min(), ys.max()))
    return sorted(res)


for src, name in [('p_base_a.jpg', 'body'), ('p_arm_a.jpg', 'arm'), ('p_hose_b.jpg', 'hose'), ('p_leg_a.jpg', 'leg'), ('p_gun2_a.jpg', 'gun')]:
    img, lab, n = key(Image.open(os.path.join(SRC, src))); save(img, name)
img, lab, n = key(Image.open(os.path.join(SRC, 'p_hands_a.jpg')))
parts = components(img, lab, n)
for (x0, x1, y0, y1), nm in zip(parts[:2], ['palm', 'fist']):
    save(img.crop((x0 - 6, y0 - 6, x1 + 7, y1 + 7)), nm)
if os.path.exists(os.path.join(SRC, 'p_mouth.jpg')):
    img, lab, n = key(Image.open(os.path.join(SRC, 'p_mouth.jpg'))); img.save(os.path.join(OUT, 'mouth_full.png')); print('mouth_full', img.size)
