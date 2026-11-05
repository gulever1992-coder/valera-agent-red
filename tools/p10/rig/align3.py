# Риг анфас (фаза 3): выровнять слои Flow (art_src/l10/rig3/dmg) по базе base.jpg -> dmg/al/*.png
# Параметры (s, dx, dy) найдены tools/p10/rig/align.py: base = s*img + (dx, dy)
import os
from PIL import Image
S = 'art_src/l10/rig3/dmg/'
T = {'base': (1, 0, 0), 'noarms': (0.976, 10, -1), 'legs': (0.988, 5, 0), 'mouth': (0.986, 6, 1), 'eyes': (0.986, 6, 2),
     'gun': (0.987, 6, 1), 'tpose': (0.986, 6, 2), 'armL': (0.991, 5, -2)}
a, b = (0.985, 7, 2), T['tpose']; T['armUp'] = (a[0] * b[0], b[0] * a[1] + b[1], b[0] * a[2] + b[2])     # armUp -> tpose -> base
os.makedirs(S + 'al', exist_ok=True)
for n, (s, dx, dy) in T.items():
    im = Image.open(S + n + '.jpg').convert('RGB')
    im.transform((784, 1325), Image.AFFINE, (1 / s, 0, -dx / s, 0, 1 / s, -dy / s), resample=Image.BICUBIC, fillcolor=(255, 255, 255)).save(S + 'al/' + n + '.png')
print('ok', list(T))
