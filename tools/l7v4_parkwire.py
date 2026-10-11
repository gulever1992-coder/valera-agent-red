# Колючая проволока над забором парковки: общий кей пурпура съедает тонкие тёмные витки (они смешаны с фоном).
# Здесь витки возвращаются из исходника Flow (v4_park_0.jpg) мягкой альфой: альфа = доля «не-пурпура», цвет очищается от фона.
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
SRC = os.path.join(ROOT, 'art_src', 'l7', 'v4_park_0.jpg')
OUT = os.path.join(ROOT, 'assets', 'l7v4', 'park.png')
Y0, Y1 = 236, 300          # полоса проволоки над верхом забора
KEY = np.array([252.0, 0.0, 253.0])


def build():
    s = np.array(Image.open(SRC).convert('RGB')).astype(float)
    p = np.array(Image.open(OUT).convert('RGBA'))
    band = s[Y0:Y1]
    m = np.minimum(band[..., 0], band[..., 2]) - band[..., 1]
    al = np.clip(1 - m / 235.0, 0, 1)
    al = np.where(al < 0.5, 0, al)
    rgb = (band - (1 - al[..., None]) * KEY) / np.maximum(al[..., None], 0.05)
    rgb = np.clip(rgb, 0, 255)
    g = rgb[..., 1]; rgb[..., 0] = np.minimum(rgb[..., 0], g + 4); rgb[..., 2] = np.minimum(rgb[..., 2], g + 26)   # снять пурпурный оттенок
    mx = rgb.max(axis=2, keepdims=True); rgb = rgb * np.minimum(1, 78 / np.maximum(mx, 1))   # ореол JPEG: витки тёмные, как над деревьями
    hole = m > 25          # всё, что в исходнике на пурпурном фоне (повторный запуск безопасен)
    put = hole & (al > 0)
    sub = p[Y0:Y1]
    sub[hole, 3] = 0
    sub[put, :3] = rgb[put].astype(np.uint8)
    sub[put, 3] = (np.clip(al[put] * 1.25, 0, 1) * 255).astype(np.uint8)
    Image.fromarray(p, 'RGBA').save(OUT, optimize=True)
    print('park.png: возвращено пикселей проволоки', int(put.sum()))


if __name__ == '__main__':
    build()
