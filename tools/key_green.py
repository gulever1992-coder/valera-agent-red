# Вырезает ярко-зелёный фон (chroma key) из картинки Flow, режет по рамке, сохраняет RGBA.
import numpy as np
from PIL import Image
def key_green(im):
    a = np.array(im.convert('RGB')).astype(np.int32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    gd = g - np.maximum(r, b)
    alpha = np.clip(255 - (gd - 20) * 255 / 90, 0, 255)           # gd>=110 -> прозрачно, <=20 -> непрозрачно
    alpha = np.where(gd < 20, 255, alpha)
    out = a.copy()
    spill = gd > 0                                                  # убрать зелёный налёт на краях
    out[..., 1] = np.where(spill, np.minimum(g, np.maximum(r, b) + 8), g)
    return Image.fromarray(np.dstack([np.clip(out, 0, 255), alpha]).astype(np.uint8), 'RGBA')
