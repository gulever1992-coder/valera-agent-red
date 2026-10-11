# Угол забора на улице A2: забор от углового столба поворачивает К ЗРИТЕЛЮ (вниз-вправо), вдоль него — съезд.
# Источник Flow: art_src/l7/v4_wing_0.jpg (пурпурный фон) — отзеркаливается и обрезается от дальнего столба.
import os
import numpy as np
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
SRC = os.path.join(ROOT, 'art_src', 'l7', 'v4_wing_0.jpg')
OUT = os.path.join(ROOT, 'assets', 'l7v4', 'wing.png')
CROP = (470, 0, 1050, 768)


def build():
    im = ImageOps.mirror(Image.open(SRC).convert('RGB'))
    a = np.array(im).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = (r - g > 70) & (b - g > 70)
    edge = (~mag) & (r - g > 35) & (b - g > 35)
    a[edge, 0] = a[edge, 1]; a[edge, 2] = a[edge, 1]
    rgba = np.dstack([a.astype(np.uint8), np.where(mag, 0, 255).astype(np.uint8)])
    out = np.array(Image.fromarray(rgba, 'RGBA').crop(CROP)).astype(float)
    # ниже основания дальнего столба (y>380) левый край растворяется — съезд плавно сливается с дорогой улицы
    for x in range(60):
        out[380:, x, 3] *= x / 60
    Image.fromarray(out.astype(np.uint8), 'RGBA').save(OUT)
    print('wing.png', CROP)


if __name__ == '__main__':
    build()
