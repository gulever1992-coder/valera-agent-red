# Вклейка правок Flow в картинки зданий уровня 2 (assets/b/*.png): убираем серп и молот, меняем надписи.
# Берём только прямоугольник правки (доли кропа), выравниваем сдвиг, альфу оставляем от оригинала.
#   py tools/p1/paste_b.py   (правки, у которых нет файла, пропускаются)
import os, sys
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, os.path.dirname(__file__))
from paste_bg import shift
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
L1 = os.path.join(ROOT, 'art_src', 'l1')
JOBS = [  # здание, кроп в px атласа, файл правки, прямоугольники правки (доли кропа)
    ('pipes', (150, 200, 500, 397), 'pipes_ed.jpg', [(0.33, 0.45, 0.6, 1.0)]),
    ('garages', (1000, 20, 1326, 203), 'garages_ed.jpg', [(0.6, 0.42, 0.88, 0.9)]),
    ('workshop', (100, 400, 580, 670), 'workshop_ed.jpg', [(0.15, 0.1, 0.72, 0.85)]),
]
for name, box, ed_name, rects in JOBS:
    p = os.path.join(L1, ed_name)
    if not os.path.exists(p): print('нет', ed_name); continue
    dst = os.path.join(ROOT, 'assets', 'b', name + '.png')
    orig_src = os.path.join(L1, '_orig_' + name + '.png')          # оригинал сохраняем один раз
    if not os.path.exists(orig_src): Image.open(dst).save(orig_src)
    im = Image.open(orig_src).convert('RGBA')
    crop = im.crop(box)
    flat = Image.new('RGBA', crop.size, (255, 0, 255, 255)); flat.alpha_composite(crop); flat = flat.convert('RGB')
    ed = Image.open(p).convert('RGB').resize(crop.size, Image.LANCZOS)
    dx, dy = shift(flat, ed)
    ed = ed.transform(crop.size, Image.AFFINE, (1, 0, -dx, 0, 1, -dy), Image.BICUBIC)
    m = Image.new('L', crop.size, 0)
    for (x0, y0, x1, y1) in rects: m.paste(255, (int(x0 * crop.width), int(y0 * crop.height), int(x1 * crop.width), int(y1 * crop.height)))
    m = np.array(m.filter(ImageFilter.GaussianBlur(1.5))) * (np.array(crop)[..., 3] > 0)   # только по непрозрачному
    out = np.array(crop).astype(np.float32); e = np.array(ed).astype(np.float32); k = (m / 255.0)[..., None]
    out[..., :3] = out[..., :3] * (1 - k) + e * k
    im.paste(Image.fromarray(out.astype(np.uint8), 'RGBA'), box[:2])
    im.save(dst, optimize=True)
    print(name, 'сдвиг', dx, dy, '->', dst)
