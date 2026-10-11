# «Цех сортировки» v2 (карта D): 4 этажа в разрезе. Вся графика из Flow, по схеме tools/l7v4_towerref.py.
#   art_src/l7/v4_tower2k.jpg  — здание в разрезе (2752x1536, небо над крышей — пурпур)
#        -> assets/l7v4/tower.jpg (всё ниже кромки крыши) + tw_roof.png (верхняя полоса с антеннами, небо прозрачное)
#   art_src/l7/v4_twspr_0.jpg  — лист (пурпур): 6 кадров окошка гермодвери (бомж стучит -> газ), табло, открытая дверь, камера
#        -> tw_win0..5.png, tw_sign.png, tw_door.png (ночь с дождём в проёме), tw_cam.png
import os
import numpy as np
from PIL import Image
from l7v4_stairs import key, tight, save, SRC, OUT

WIN = [(27, 22), (476, 22), (925, 22), (27, 290), (476, 290), (925, 290)]   # левый верх ячеек окошка, размер 424x250


def build():
    im = Image.open(os.path.join(SRC, 'v4_tower2k.jpg')).convert('RGB'); a = np.array(im).astype(int)
    mag = (np.minimum(a[..., 0], a[..., 2]) - a[..., 1]) > 70
    cut = int(np.where(mag.mean(1) > 0.02)[0].max()) + 3; print('roof cut y =', cut)
    im.crop((0, cut, im.width, im.height)).save(os.path.join(OUT, 'tower.jpg'), quality=92)
    save(np.ascontiguousarray(key(im.crop((0, 0, im.width, cut)), soft=True)), 'tw_roof.png')
    sh = Image.open(os.path.join(SRC, 'v4_twspr_0.jpg')); k = key(sh)
    for i, (x, y) in enumerate(WIN):
        p, off = tight(k[y - 6:y + 256, x - 6:x + 430]); save(np.ascontiguousarray(p), 'tw_win%d.png' % i)
    p, _ = tight(k[590:715, 80:615]); save(np.ascontiguousarray(p), 'tw_sign.png')
    p, _ = tight(k[585:725, 1075:1240]); save(np.ascontiguousarray(p), 'tw_cam.png')
    sh.convert('RGB').crop((754, 580, 844, 744)).save(os.path.join(OUT, 'tw_door.png')); print('tw_door.png')


if __name__ == '__main__':
    build()
