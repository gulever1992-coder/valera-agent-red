# Сортировочный цех — огромный и зловещий (Flow):
#  v4_shopbig_0.jpg -> assets/l7v4/shopbig.jpg  — ближний вид: низ громадной стены, уходит за верх кадра
#  v4_shopfar_0.jpg -> assets/l7v4/shopfar.png  — дальний вид: весь корпус (пурпур -> прозрачность), нависает над парковкой
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
L7 = os.path.join(ROOT, 'art_src', 'l7'); OUT = os.path.join(ROOT, 'assets', 'l7v4')


def build():
    Image.open(os.path.join(L7, 'v4_shopbig_0.jpg')).convert('RGB').resize((1376, 768)).save(os.path.join(OUT, 'shopbig.jpg'), quality=92)
    a = np.array(Image.open(os.path.join(L7, 'v4_shopfar_0.jpg')).convert('RGB').resize((1376, 768))).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = (r - g > 55) & (b - g > 55)
    edge = (~mag) & (r - g > 22) & (b - g > 22)
    a[edge, 0] = np.minimum(a[edge, 0], a[edge, 1] + 25); a[edge, 2] = np.minimum(a[edge, 2], a[edge, 1] + 25)
    al = np.where(mag, 0, 255).astype(np.uint8)
    al[735:] = 0                                            # мокрый асфальт под зданием не нужен
    Image.fromarray(np.dstack([a.astype(np.uint8), al]), 'RGBA').save(os.path.join(OUT, 'shopfar.png'))
    print('shopbig.jpg, shopfar.png')


if __name__ == '__main__':
    build()
