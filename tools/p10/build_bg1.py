# Фон фазы 1 (бег по крышам) — 4 слоя параллакса из Flow (art_src/l10/bg1_*.png):
# небо (bg1sky), море (bg1sea), краны (bg1cranes, кей пурпура), набережная (bg1quay, кей пурпура), корабли (bg1ships, лист 4 шт.).
# Выход: assets/l10/bg1*.{jpg,png} + js/bg1_data.js (L10.BG1). Запуск из корня игры: py tools/p10/build_bg1.py, затем py tools/optimize_assets.py
import json
import numpy as np
from PIL import Image
from scipy import ndimage as nd

SRC, OUT = 'art_src/l10/', 'assets/l10/'


def key(path):
    """пурпур -> прозрачность, без розовой каймы"""
    a = np.asarray(Image.open(path).convert('RGB')).astype(float); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mg = np.minimum(r, b) - g     # «пурпурность»: фон и розовая кайма
    al = np.clip(1 - (mg - 20) / 70, 0, 1)
    al = nd.binary_opening(al > 0.5, iterations=1) * al
    sp = mg > 10; a[..., 0] = np.where(sp, np.minimum(r, g + 18), r); a[..., 2] = np.where(sp, np.minimum(b, g + 24), b)
    return np.dstack([a, al * 255]).clip(0, 255).astype('uint8')


def crop(rgba):
    ys, xs = np.nonzero(rgba[..., 3] > 8); return rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


Image.open(SRC + 'bg1_sky.png').convert('RGB').save(OUT + 'bg1sky.jpg', quality=90)
Image.open(SRC + 'bg1_sea.png').convert('RGB').save(OUT + 'bg1sea.jpg', quality=90)
# набережная: домики к зрителю, кромка причала дальше (bg1_quay5: пустая площадка причала с тумбами, выше — море; владелец)
Image.fromarray(crop(key(SRC + 'bg1_quay5.png'))).save(OUT + 'bg1quay.png', optimize=True)


def sheet(path, min_area, name):
    """лист отдельных объектов на пурпуре -> атлас в ряд (выровнены по низу) + прямоугольники"""
    sh = key(path); lb, n = nd.label(nd.binary_dilation(sh[..., 3] > 40, iterations=6)); objs = nd.find_objects(lb)
    parts = sorted([o for o in objs if (o[0].stop - o[0].start) * (o[1].stop - o[1].start) > min_area], key=lambda o: (o[0].start // 150, o[1].start))
    tiles = [crop(sh[o]) for o in parts]
    W = sum(t.shape[1] for t in tiles) + 2 * len(tiles); H = max(t.shape[0] for t in tiles)
    atlas = np.zeros((H, W, 4), 'uint8'); x = 0; rects = []
    for t in tiles: atlas[H - t.shape[0]:, x:x + t.shape[1]] = t; rects.append([x, H - t.shape[0], t.shape[1], t.shape[0]]); x += t.shape[1] + 2
    Image.fromarray(atlas).save(OUT + name, optimize=True); return rects


ships = sheet(SRC + 'bg1_ships.png', 4000, 'bg1ships.png')        # корабли: 4 куска
cranes = sheet(SRC + 'bg1_cranes2.png', 40000, 'bg1cranes.png')    # портальные краны поштучно
open('js/bg1_data.js', 'w', encoding='utf-8').write('// собрано tools/p10/build_bg1.py\nL10.BG1 = ' + json.dumps({'ships': ships, 'cranes': cranes}) + ';\n')
print('ships', ships, 'cranes', cranes, 'quay', Image.open(OUT + 'bg1quay.png').size)
