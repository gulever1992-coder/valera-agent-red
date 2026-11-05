# Конструктор моря, вкладка «Арт»: ластик по готовым листам (станции stat10, корабли фона bg1ships).
# Оригинал листа один раз копируется в art_src/l10/rig3/edit/orig/<лист>.png; маска <лист>_erase.png стирает пиксели -> assets/l10/<лист>.png
# Запуск из корня игры: py tools/p10/sea3/apply_masks.py
import os, shutil
import numpy as np
from PIL import Image
EDIT = 'art_src/l10/rig3/edit/'; ORIG = EDIT + 'orig/'; os.makedirs(ORIG, exist_ok=True)
SHEETS = ['stat10', 'bg1ships']
for n in SHEETS:
    a = 'assets/l10/%s.png' % n
    if not os.path.exists(ORIG + n + '.png'): shutil.copy(a, ORIG + n + '.png')
    im = np.array(Image.open(ORIG + n + '.png').convert('RGBA'))
    mp = EDIT + n + '_erase.png'
    if os.path.exists(mp):
        m = np.asarray(Image.open(mp).convert('RGBA').resize((im.shape[1], im.shape[0])))[..., 3] > 127; im[m, 3] = 0
    Image.fromarray(im).save(a, optimize=True); print(n, 'стёрто' if os.path.exists(mp) else 'как в оригинале')
