# Вклейка правок фонов из Flow (надпись «СЛАВА КОРАБЛЕДЕЛАМ!», герб Лемурии) обратно в исходники фонов уровня 1.
# Flow перерисовывает кроп целиком; берём только прямоугольники правок, выравниваем сдвиг по корреляции, края растушёвываем.
import os
import numpy as np
from PIL import Image, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
A = lambda *p: os.path.join(ROOT, *p)

def shift(ref, img):
    """Целочисленный сдвиг img относительно ref (фазовая корреляция по яркости)."""
    a = np.asarray(ref.convert('L'), np.float32); b = np.asarray(img.convert('L'), np.float32)
    a -= a.mean(); b -= b.mean()
    r = np.fft.ifft2(np.fft.fft2(a) * np.conj(np.fft.fft2(b)))
    r = np.abs(r); dy, dx = np.unravel_index(np.argmax(r), r.shape)
    if dy > a.shape[0] // 2: dy -= a.shape[0]
    if dx > a.shape[1] // 2: dx -= a.shape[1]
    return int(dx), int(dy)

def paste(src_name, out_name, box1280, edit, rects, asset, size):
    src = Image.open(A('art_src', src_name)).convert('RGB')
    k = src.width / 1280
    box = tuple(int(v * k) for v in box1280)
    crop = src.crop(box)
    ed = Image.open(A('art_src', 'l1', edit)).convert('RGB').resize(crop.size, Image.LANCZOS)
    dx, dy = shift(crop, ed)
    ed = ed.transform(crop.size, Image.AFFINE, (1, 0, -dx, 0, 1, -dy), Image.BICUBIC)
    print(edit, 'сдвиг', dx, dy)
    m = Image.new('L', crop.size, 0)
    for (x0, y0, x1, y1) in rects:             # в долях кропа
        m.paste(255, (int(x0 * crop.width), int(y0 * crop.height), int(x1 * crop.width), int(y1 * crop.height)))
    m = m.filter(ImageFilter.GaussianBlur(3))
    crop.paste(ed, (0, 0), m)
    src.paste(crop, box[:2])
    src.save(A('art_src', out_name))
    im = src.resize(size if size[1] else (size[0], round(src.height * size[0] / src.width)), Image.LANCZOS)
    im.save(A('assets', asset), quality=88, optimize=True)
    print(out_name, '->', asset, im.size)

# цех из интро: только баннер
if __name__ == "__main__": paste('hall_empty.png', 'hall_empty_v2.png', (480, 150, 1280, 600), 'hall_c.jpg',
      [(0.305, 0.255, 0.755, 0.395)], 'bg_hall.jpg', (1280, 720))
# низ подъёма: баннер и плакат с гербом
if __name__ == "__main__": paste('bg_climb_bottom_v2.png', 'bg_climb_bottom_v3.png', (0, 900, 960, 1440), 'bot_b.jpg',
      [(0.475, 0.245, 0.84, 0.53), (0.065, 0.27, 0.21, 0.71)], 'bg_climb_bottom.jpg', (1280, None))
