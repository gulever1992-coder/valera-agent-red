# Лестничная клетка цеха (карта D) — цельная картинка из Flow + слой лестницы поверх персонажей.
#   art_src/l7/v4_well_1.jpg   — вся локация (по схеме tools/l7v4_stref.py)            -> assets/l7v4/st_well.jpg
#   art_src/l7/v4_wellfg_0.jpg — та же картинка, оставлена только лестница (пурпур)   -> маска
#   -> assets/l7v4/st_well_fg.png: пиксели исходной картинки под маской лестницы (перила, косоуры, площадки) без колонны —
#      рисуется поверх Валеры и патруля, они идут ЗА перилами.
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'art_src', 'l7'); OUT = os.path.join(HERE, '..', 'assets', 'l7v4')
LY = [1312, 1123, 955, 787, 616, 448, 288]   # y пола и площадок (ноги), как в V4.SW.ly


def build():
    bg = Image.open(os.path.join(SRC, 'v4_well_1.jpg')).convert('RGB'); bg.save(os.path.join(OUT, 'st_well.jpg'), quality=92)
    a = np.array(bg); m = np.array(Image.open(os.path.join(SRC, 'v4_wellfg_0.jpg')).convert('RGB')).astype(int)
    mask = ~((m[..., 0] - m[..., 1] > 60) & (m[..., 2] - m[..., 1] > 60))
    H, W = mask.shape; yy, xx = np.mgrid[0:H, 0:W]
    col = (xx > 508) & (xx < 576); band = np.zeros_like(mask)
    for n in (2, 4): band |= (yy > LY[n] - 46) & (yy < LY[n] + 24)
    band |= yy < 302
    mask &= ~(col & ~band)                                           # колонна — позади персонажей
    top = (yy > 236) & (yy < 302) & (xx >= 482)                      # верхняя галерея: перила-прутья из слоя лестницы (на фоне там сплошные щиты)
    er = mask & np.roll(mask, 1, 0) & np.roll(mask, -1, 0) & np.roll(mask, 1, 1) & np.roll(mask, -1, 1)
    mask = np.where(top, er, mask); g = m[..., 1]; m[..., 0] = np.minimum(m[..., 0], g + 10); m[..., 2] = np.minimum(m[..., 2], g + 6)   # без пурпурной каймы
    a = np.where((top & mask)[..., None], m.clip(0, 255).astype(np.uint8), a)
    mask[:236] = False
    Image.fromarray(np.dstack([a, (mask * 255).astype(np.uint8)]), 'RGBA').save(os.path.join(OUT, 'st_well_fg.png'), optimize=True)
    print('st_well.jpg', bg.size, 'fg px', int(mask.sum()))


if __name__ == '__main__':
    build()
