# Парковка у цеха (карта C), правки по отзыву:
#  v4_campole2_0.jpg (Flow, пурпур) -> assets/l7v4/campole.png (столб с оголовком) + camhead.png (камера отдельно, поворачивается)
#  v4_shopend2_0.jpg (Flow, пурпур) -> assets/l7v4/shopcap.png — угловой пилон: левый торец цеха (в масштабе shopbig.jpg, низ = y 632)
#  shopbig.jpg -> assets/l7v4/shopdoor_l.png, shopdoor_r.png — створки двери цеха (вырезаны из самой картинки) для анимации разъезда
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
L7 = os.path.join(ROOT, 'art_src', 'l7'); OUT = os.path.join(ROOT, 'assets', 'l7v4')
DOOR = (740, 472, 852, 628); SEAM = 816   # проём двери на shopbig.jpg и стык створок


def key(path):
    a = np.array(Image.open(path).convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = (r - g > 70) & (b - g > 70)
    edge = (~mag) & (r - g > 40) & (b - g > 40)
    a[edge, 0] = a[edge, 1]; a[edge, 2] = a[edge, 1]
    return np.dstack([a.astype(np.uint8), np.where(mag, 0, 255).astype(np.uint8)])


def build():
    # столб (с оголовком и шаровым креплением) и камера — отдельно: поворачивается только камера
    a = key(os.path.join(L7, 'v4_campole2_0.jpg'))
    for name, x0, x1 in (('campole', 0, 470), ('camhead', 470, 1376)):
        part = a[:, x0:x1]; ys, xs = np.where(part[..., 3] > 0)
        im = Image.fromarray(part, 'RGBA').crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)); im.save(os.path.join(OUT, name + '.png'))
        print(name + '.png', im.size, 'offset', x0 + xs.min(), ys.min())
    e = key(os.path.join(L7, 'v4_shopend2_0.jpg'))[0:694, 474:690]
    cap = Image.fromarray(e, 'RGBA'); cap = cap.resize((round(cap.width * 0.6), round(cap.height * 0.6)), Image.LANCZOS)
    ca = np.array(cap); ca[..., 3] = np.where(ca[..., 3] > 128, 255, 0); Image.fromarray(ca, 'RGBA').save(os.path.join(OUT, 'shopcap.png')); print('shopcap.png', cap.size)
    s = Image.open(os.path.join(OUT, 'shopbig.jpg')).convert('RGB')
    s.crop((DOOR[0], DOOR[1], SEAM, DOOR[3])).save(os.path.join(OUT, 'shopdoor_l.png'))
    s.crop((SEAM, DOOR[1], DOOR[2], DOOR[3])).save(os.path.join(OUT, 'shopdoor_r.png'))
    print('shopdoor_l/r.png', SEAM - DOOR[0], DOOR[2] - SEAM, DOOR[3] - DOOR[1])


if __name__ == '__main__':
    build()
