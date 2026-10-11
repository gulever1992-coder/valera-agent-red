# Передние перила лестничной клетки (stair.jpg) отдельным слоем: Валера поднимается ЗА ними.
# Перила регулярные: верхний поручень y 480..491, нижние поручни, стойки через ~27.7 px от x=672 (каждая 4-я — толстый столб).
# Вырезаются пиксели самой картинки Flow (ничего не рисуется), уточнение x стоек — по пику (R-B).
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'assets', 'l7v4', 'stair.jpg')
OUT = os.path.join(HERE, '..', 'assets', 'l7v4', 'stair_rail.png')


def build():
    a = np.array(Image.open(SRC).convert('RGB'))
    rb = a[:, :, 0].astype(float) - a[:, :, 2]
    m = np.zeros(a.shape[:2], bool)
    # горизонтальные поручни (по профилю строк в правой, тёмной части)
    prof = rb[470:660, 820:1260].mean(axis=1)
    for i, v in enumerate(prof):
        if v > 9: m[470 + i, 648:1292] = True
    for y0, y1 in ((478, 493), (511, 520), (619, 629), (640, 651)):
        m[y0:y1, 648:1292] = True
    # стойки
    for k in range(23):
        x = 672 + 27.7 * k
        lo, hi = int(x) - 5, int(x) + 6
        col = rb[520:615, lo:hi].mean(axis=0)
        cx = lo + int(np.argmax(col))
        w = 4 if k % 4 else 6
        m[478:651, cx - w // 2 - 1:cx + w // 2 + 2] = True
    m[470:652, 648:666] |= rb[470:652, 648:666] > 12   # крайний левый столб с изгибом поручня
    rgba = np.dstack([a, (m * 255).astype(np.uint8)])
    Image.fromarray(rgba, 'RGBA').crop((640, 460, 1300, 660)).save(OUT)
    print('stair_rail.png', 'offset (640,460)')


if __name__ == '__main__':
    build()
