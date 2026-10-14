# Перекадровка портретов ур.7: голова целиком и по центру. py tools/portraits_l7fix.py
import json, re, os
from portraits_fix import portrait, ROOT
S = json.loads(re.search(r'window\.SPRITES = (\{.*?\});\s*$', open(os.path.join(ROOT, 'js', 'sprites_data.js'), encoding='utf-8').read(), re.S | re.M).group(1))
fr = lambda sheet, i: tuple(S[sheet]['f'][i][:2]) + (S[sheet]['f'][i][0] + S[sheet]['f'][i][2], S[sheet]['f'][i][1] + S[sheet]['f'][i][3])
portrait('assets/spr/boss4b.png', fr('boss4b', 0), 'cmdr7', head=0.36, pad=0.08)      # главарь спецназа — из его же спрайта
# Валера ур.6-7: центр по причёске (капюшон и плечи уводили голову вправо)
import numpy as np
from PIL import Image
from portraits_fix import key_green, SPR, BG
a = key_green(Image.open(os.path.join(ROOT, 'art_src/l6/v6_tap.png')).crop((0, 0, 344, 384))); op = a[..., 3] > 40
ys, xs = np.where(op); top = ys.min(); bot = int(top + (ys.max() - top) * 0.46)
hx = np.where(op[top:top + int((bot - top) * 0.3)].any(0))[0]; cx = (hx.min() + hx.max()) / 2
side = int(round((bot - top) * 1.2)); cv = Image.new('RGBA', (side, side), BG)
cv.alpha_composite(Image.fromarray(a, 'RGBA'), (-int(round(cx - side / 2)), -int(round(top - side * 0.1))))
cv.convert('RGB').resize((128, 128), Image.LANCZOS).save(os.path.join(SPR, 'p_valera6.png'))

# Денис Ч. — новое лицо по фото (Flow, 2026-10-12): квадрат вокруг головы
a = key_green(Image.open(os.path.join(ROOT, 'art_src/l7/v4_pdch_0.jpg')).crop((20, 0, 700, 680))); cv = Image.new('RGBA', (680, 680), BG); cv.alpha_composite(Image.fromarray(a, 'RGBA'))
cv.convert('RGB').resize((128, 128), Image.LANCZOS).save(os.path.join(SPR, 'p_denisch.png'))
