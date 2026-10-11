# Кадры лазания Валеры (лист v7b, кадры 0-3) нарисованы Flow вместе с кусками перекладин в руках и под ногами.
# В игре лестница своя, поэтому серо-зелёный металл перекладин и его тонкая обводка вырезаются (ничего не дорисовывается).
# Запускать после py tools/build_l7.py; повторный запуск безопасен.
import os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'assets', 'spr', 'v7b.png')
FR = [(0, 0, 105, 143, 130), (107, 0, 105, 163, 129), (214, 0, 105, 146, 129), (321, 0, 101, 171, 140)]   # x, y, w, h, строка, ниже которой перекладина под ногой


def build():
    im = np.array(Image.open(OUT).convert('RGBA')); n = 0
    for x, y, w, h, fy in FR:
        a = im[y:y + h, x:x + w]; c = a[..., :3].astype(int); r, g, b = c[..., 0], c[..., 1], c[..., 2]
        solid = a[..., 3] > 40
        metal = solid & (abs(r - g) < 30) & (g - b > -22) & (g - b < 30) & (g >= r - 4) & (c.sum(axis=2) > 200) & (c.sum(axis=2) < 600)
        yy = np.arange(h)[:, None]; metal &= (yy < h * 0.4) | (yy >= fy)   # перекладины только у рук и под ногами (джинсы не трогать)
        keep = solid & ~metal
        core = ndimage.binary_erosion(keep, iterations=3)                    # тонкая обводка перекладин не переживает эрозию
        keep = ndimage.binary_propagation(core, mask=keep & ndimage.binary_dilation(core, iterations=4))
        lab, k = ndimage.label(keep)
        if k > 1: sz = ndimage.sum(keep, lab, range(1, k + 1)); keep = lab == (1 + int(np.argmax(sz)))
        n += int((solid & ~keep).sum()); a[..., 3] = np.where(keep, a[..., 3], 0)
    Image.fromarray(im, 'RGBA').save(OUT, optimize=True)
    print('v7b: removed', n)


if __name__ == '__main__':
    build()
