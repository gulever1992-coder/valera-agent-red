# Катсцена в фургоне (вид с капота через лобовое стекло). Flow: art_src/l7/v4_cabin_0.jpg (окна залиты пурпуром),
# v4_wiper_0.jpg (дворник на пурпуре). Выход: assets/l7v4/cabin.png (окна и углы прозрачные), wiper.png (шарнир слева).
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
SRC = os.path.join(ROOT, 'art_src', 'l7')
OUT = os.path.join(ROOT, 'assets', 'l7v4')


def key(im):
    a = np.array(im.convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = (r - g > 70) & (b - g > 70)
    al = np.where(mag, 0, 255).astype(np.uint8)
    edge = (~mag) & (r - g > 40) & (b - g > 40)            # пурпурная кайма — убрать оттенок
    a[edge, 0] = a[edge, 1]; a[edge, 2] = a[edge, 1]
    return np.dstack([a.astype(np.uint8), al])


def build():
    im = Image.open(os.path.join(SRC, 'v4_cabin_0.jpg'))
    a = key(im)
    # чёрные углы вне кузова — заливка от верхних углов
    # чёрные углы вне кузова: всё, что левее/правее/выше первого светлого пикселя кузова
    # (светлый кузов = полоса из 10+ светлых пикселей подряд; одиночные точки антенн не считаются)
    br = a[..., :3].min(axis=2) > 110; Hh, Ww = br.shape
    k = np.ones(10, int)
    for y in range(340):
        lim = 200
        run = np.convolve(br[y].astype(int), k, 'valid') == 10; i = np.where(run)[0]
        if not len(i):
            if y < 340: a[y, :, 3] = 0
            continue
        if i[0] < lim: a[y, :i[0], 3] = 0
        if i[-1] + 10 > Ww - lim: a[y, i[-1] + 10:, 3] = 0
    for x in range(Ww):
        run = np.convolve(br[:120, x].astype(int), k, 'valid') == 10; i = np.where(run)[0]
        if len(i): a[:i[0], x, 3] = 0
    Image.fromarray(a, 'RGBA').save(os.path.join(OUT, 'cabin.png'))
    w = key(Image.open(os.path.join(SRC, 'v4_wiper_0.jpg')))[70:262]
    ys, xs = np.where(w[..., 3] > 40)
    w = w[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    hub = w[:, :44, 3] > 40; hy, hx = np.where(hub)
    Image.fromarray(w, 'RGBA').save(os.path.join(OUT, 'wiper.png'))
    print('cabin.png', im.size, '| wiper.png', w.shape[1], w.shape[0], 'pivot', int(hx.mean()), int(hy.mean()))


if __name__ == '__main__':
    build()
