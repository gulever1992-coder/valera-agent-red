# Исходники для кисти «Вернуть из оригинала» в редакторе (2026-11-06).
# Каждая целая рука вырезана из полного кадра Flow _shots/arm_<поза>_full.jpg (координаты кадра = координаты модели).
# 1) к картинке руки добавляются прозрачные поля PAD (есть куда дорисовать срезанное), w/h в sem3_data.js растут на 2*PAD, центр x,y не меняется;
# 2) art_src/l10/sem3/src/<img>.png — тот же участок полного кадра (фон-пурпур прозрачный).
# Повторный запуск безопасен: уже расширенные части (есть в src/) пропускаются. Бэкап: art_src/l10/sem3/before_pad/
import json, os, shutil
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
A = os.path.join(ROOT, 'assets', 'l10', 'sem3'); S = os.path.join(ROOT, 'art_src', 'l10', 'sem3'); SH = os.path.join(S, '_shots')
SRC = os.path.join(S, 'src'); BAK = os.path.join(S, 'before_pad'); os.makedirs(SRC, exist_ok=True); os.makedirs(BAK, exist_ok=True)
DATA = os.path.join(ROOT, 'js', 'sem3_data.js'); PAD = 60
txt = open(DATA, encoding='utf-8').read(); head, body = txt.split('L10.SEM3 = ', 1); D = json.loads(body.rstrip().rstrip(';'))
if not os.path.exists(os.path.join(BAK, 'sem3_data.js')): shutil.copy(DATA, os.path.join(BAK, 'sem3_data.js'))
n = 0
for p in D['parts']:
    if p.get('tag') != 'arm' or not p.get('var'): continue
    img = p['img']; out = os.path.join(SRC, img + '.png')
    if os.path.exists(out): continue
    shot = os.path.join(SH, 'arm_%s_full.jpg' % p['var'])
    if not os.path.exists(shot): print('нет кадра', shot); continue
    f = os.path.join(A, img + '.png'); im = Image.open(f).convert('RGBA')
    if im.size != (p['w'], p['h']): print('!! размер не совпал', img, im.size, p['w'], p['h']); continue
    shutil.copy(f, os.path.join(BAK, img + '.png'))
    x0, y0 = round(p['x'] - p['w'] / 2), round(p['y'] - p['h'] / 2)
    W, H = p['w'] + 2 * PAD, p['h'] + 2 * PAD
    big = Image.new('RGBA', (W, H), (0, 0, 0, 0)); big.paste(im, (PAD, PAD)); big.save(f)
    sh = np.asarray(Image.open(shot).convert('RGB')).astype(int); r, g, b = sh[..., 0], sh[..., 1], sh[..., 2]
    al = 255 - np.clip((np.minimum(r, b) - g - 40) * 4, 0, 255)            # пурпурный фон -> прозрачный
    full = np.dstack([sh, al]).clip(0, 255).astype(np.uint8)
    src = np.zeros((H, W, 4), np.uint8); X0, Y0 = x0 - PAD, y0 - PAD
    sx0, sy0, sx1, sy1 = max(0, X0), max(0, Y0), min(sh.shape[1], X0 + W), min(sh.shape[0], Y0 + H)
    src[sy0 - Y0:sy1 - Y0, sx0 - X0:sx1 - X0] = full[sy0:sy1, sx0:sx1]
    Image.fromarray(src, 'RGBA').save(out)
    p['w'], p['h'] = W, H; n += 1
open(DATA, 'w', encoding='utf-8').write(head + 'L10.SEM3 = ' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('готово частей:', n)
