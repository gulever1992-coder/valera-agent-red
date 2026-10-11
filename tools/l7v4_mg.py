# Мини-игра «провода» (взлом двери цеха / щиток камер): вся графика из Flow.
#   art_src/l7/v4_mgpanel_0.jpg — нутро распределительной коробки (фон)       -> assets/l7v4/mgw_panel.jpg
#   art_src/l7/v4_mgparts_0.jpg — лист 4x3 на пурпуре: клеммы, гнёзда, провода (красный/синий/жёлтый), перчатка, искра, лампа
#       -> assets/l7v4/mgw_plug0..2, mgw_sock0..2, mgw_wire0..2, mgw_hand, mgw_spark, mgw_lamp (.png)
import os
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'art_src', 'l7')
OUT = os.path.join(HERE, '..', 'assets', 'l7v4')
NAMES = [['plug0', 'plug1', 'plug2'], ['sock0', 'sock1', 'sock2'], ['wire0', 'wire1', 'wire2'], ['hand', 'spark', 'lamp']]


def key(im):
    a = np.array(im.convert('RGB')).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.minimum(r, b) - g                                  # «пурпурность»
    al = np.clip((150 - m) / 90.0, 0, 1)                      # мягкий край (свечение искры и лампы)
    edge = (al > 0) & (m > 30); k = np.clip(m / 255.0, 0, 1)
    a[edge, 0] = (a[edge, 0] - 255 * k[edge] * 0.8).clip(0, 255); a[edge, 2] = (a[edge, 2] - 255 * k[edge] * 0.8).clip(0, 255)
    return np.dstack([a.astype(np.uint8), (al * 255).astype(np.uint8)])


def build():
    Image.open(os.path.join(SRC, 'v4_mgpanel_0.jpg')).convert('RGB').resize((860, 480), Image.LANCZOS).save(os.path.join(OUT, 'mgw_panel.jpg'), quality=90)
    a = key(Image.open(os.path.join(SRC, 'v4_mgparts_0.jpg'))); H, W = a.shape[:2]
    solid = a[..., 3] > 60
    rows = np.where(solid.any(1))[0]; gaps = np.where(np.diff(rows) > 12)[0]
    rb = [(rows[0], rows[gaps[0]])] + [(rows[gaps[i] + 1], rows[gaps[i + 1]] if i + 1 < len(gaps) else rows[-1]) for i in range(len(gaps))]
    assert len(rb) == 4, rb
    for ri, (y0, y1) in enumerate(rb):
        for ci in range(3):
            x0, x1 = W * ci // 3, W * (ci + 1) // 3
            cell = a[max(0, y0 - 14):y1 + 15, x0:x1]; m = cell[..., 3] > 20
            ys, xs = np.where(m); crop = cell[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
            Image.fromarray(crop, 'RGBA').save(os.path.join(OUT, 'mgw_%s.png' % NAMES[ri][ci]), optimize=True)
            print(NAMES[ri][ci], crop.shape[1], 'x', crop.shape[0])


if __name__ == '__main__':
    build()
