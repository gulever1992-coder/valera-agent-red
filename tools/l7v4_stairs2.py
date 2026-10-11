# Лестничная клетка цеха, вторая партия деталей из Flow (art_src/l7/v4_st2parts_0.jpg, пурпур):
#   кирпичная стена-срез, стальная колонна, раздвижные двери в раме, короткая площадка с кронштейнами, ящик, бочка, камера, лампа
#   -> assets/l7v4/st2_brick.png, st2_beam.png, st2_gate.png, st2_land.png, st2_crate.png, st2_barrel.png, st2_cam.png, st2_lamp.png
# Запускать после tools/l7v4_stairs.py (берёт оттуда key/tight/save).
import os
import numpy as np
from PIL import Image
from l7v4_stairs import key, tight, save, SRC

BOX = {'st2_brick': (14, 0, 192, 768), 'st2_beam': (224, 0, 336, 768), 'st2_gate': (355, 50, 915, 665), 'st2_land': (930, 50, 1335, 375),
       'st2_crate': (945, 385, 1095, 540), 'st2_cam': (1105, 420, 1245, 530), 'st2_lamp': (1258, 408, 1352, 540), 'st2_barrel': (945, 545, 1095, 755)}


def build():
    a = key(Image.open(os.path.join(SRC, 'v4_st2parts_0.jpg')))
    for n, (x0, y0, x1, y1) in BOX.items():
        p, off = tight(a[y0:y1, x0:x1])
        if n in ('st2_brick', 'st2_beam'): p = p[6:-6]   # ровные торцы — стыкуются по вертикали
        save(np.ascontiguousarray(p), n + '.png'); print('  at', x0 + off[0], y0 + off[1])


if __name__ == '__main__':
    build()
