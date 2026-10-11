# Лестница в канализации (Flow: art_src/l7/v4_sewlad_0.jpg, пурпурный фон): высокая ржавая лестница + открытый люк со светом.
# Собирается assets/l7v4/sew_ladder.png: только лестница (люк не показываем), стыкуется сама с собой по вертикали.
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
SRC = os.path.join(ROOT, 'art_src', 'l7', 'v4_sewlad_0.jpg')
OUT = os.path.join(ROOT, 'assets', 'l7v4', 'sew_ladder.png')


def key(im):
    a = np.array(im.convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = (r - g > 70) & (b - g > 70)                     # пурпур фона
    al = np.where(mag, 0, 255).astype(np.uint8)
    # кайма: пиксели с пурпурным оттенком — убрать оттенок
    edge = (~mag) & (r - g > 40) & (b - g > 40)
    a[edge, 0] = a[edge, 1]; a[edge, 2] = a[edge, 1]
    return Image.fromarray(np.dstack([a.astype(np.uint8), al]), 'RGBA')


def tight(im):
    al = np.array(im)[..., 3] > 40; ys, xs = np.where(al)
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def build():
    # только лестница, без люка: обрезана ровно по шагу ступеней (верх/низ — середины пролётов), чтобы копии стыковались
    # друг над другом и лестница уходила за верх экрана
    src = key(Image.open(SRC))
    ladder = tight(src.crop((60, 0, 230, 768)))
    a = np.array(ladder)[..., 3] > 40; wide = a.sum(1) > a.shape[1] * 0.7
    ys = np.where(wide)[0]; rungs = []; s0 = p = ys[0]
    for y in list(ys[1:]) + [10 ** 6]:
        if y - p > 2: rungs.append((s0 + p) / 2); s0 = y
        p = y
    step = (rungs[-1] - rungs[0]) / (len(rungs) - 1)
    top = int(round(rungs[0] - step / 2)); bot = int(round(rungs[-1] + step / 2))
    top = max(top, 0); bot = min(bot, ladder.height)
    out = ladder.crop((0, top, ladder.width, bot)); out.save(OUT)
    print('sew_ladder.png', out.size, 'rungs', len(rungs), 'step', round(step, 1), 'crop', top, bot, 'of', ladder.height)


if __name__ == '__main__':
    build()
