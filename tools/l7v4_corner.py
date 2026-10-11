# Конец улицы A2 (выбран пользователем): забор вдоль дороги, угловой столб, справа стена идёт К ЗРИТЕЛЮ.
# Flow: art_src/l7/v4_corner2_1.jpg (пурпурный фон над деревьями) -> assets/l7v4/corner.png (кей пурпура, без каймы)
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
SRCS = [('v4_corner2_1.jpg', 'corner.png'), ('v4_breach_0.jpg', 'corner_b.png')]   # целый угол / с проломом (тот же кадр)


def build():
  for src, out in SRCS:
    a = np.array(Image.open(os.path.join(ROOT, 'art_src', 'l7', src)).convert('RGB').resize((1376, 768))).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = (r - g > 60) & (b - g > 60)
    edge = (~mag) & (r - g > 25) & (b - g > 25)          # фиолетовая кайма листвы
    a[edge, 0] = np.minimum(a[edge, 0], a[edge, 1] + 20); a[edge, 2] = np.minimum(a[edge, 2], a[edge, 1] + 25)
    al = np.where(mag, 0, 255).astype(np.uint8)
    Image.fromarray(np.dstack([a.astype(np.uint8), al]), 'RGBA').save(os.path.join(ROOT, 'assets', 'l7v4', out))
    print(out)


if __name__ == '__main__':
    build()
