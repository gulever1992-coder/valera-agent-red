# Лицо Господина Икс = только глаза и улыбка на чёрном (из исходного портрета art_src/mrx_old). Общие функции для mrx_eyes.py и build_l9.py.
import os
import numpy as np
from PIL import Image, ImageFilter

R = os.path.join(os.path.dirname(__file__), '..')
ORIG = os.path.join(R, 'art_src', 'mrx_old', 'assets__spr__p_mrx.png')


def masks(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (r > 120) & (r > g * 1.8) & (r > b * 1.8), (r > 150) & (g > 150) & (b > 150)


def portrait():
    """Портрет 128x128: чёрный, красные глаза со свечением, белая улыбка."""
    a = np.asarray(Image.open(ORIG).convert('RGB')).astype(np.float32); red, wh = masks(a)
    m = Image.fromarray((red * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))
    o = np.asarray(m).astype(np.float32)[..., None] / 255 * 0.55 * np.array([200, 10, 10])
    o[red] = a[red]; o[wh] = a[wh]
    return Image.fromarray(o.clip(0, 255).astype(np.uint8))


def face():
    """Кроп глаз+улыбки из портрета (RGB на чёрном)."""
    p = portrait(); red, wh = masks(np.asarray(p).astype(np.float32)); ys, xs = np.where(red | wh)
    return p.crop((xs.min() - 6, ys.min() - 6, xs.max() + 7, ys.max() + 7))


def screens(im, dim=1.0, dy=0):
    """Кадр с телевизорами (RGB/RGBA): каждый светящийся зелёный экран -> чёрный, глаза и улыбка по центру. dim — яркость лица, dy — сдвиг лица."""
    from scipy import ndimage
    mode = im.mode; a = np.asarray(im.convert('RGBA')).copy(); c = a[..., :3].astype(int); r, g, b = c[..., 0], c[..., 1], c[..., 2]
    red, wh = masks(c); grn = (g > r * 1.25) & (g > 70) & (g >= b * 0.9) & (a[..., 3] > 0)
    scr = ndimage.binary_fill_holes(ndimage.binary_closing(grn | red | wh, iterations=3)); scr = ndimage.binary_opening(scr, iterations=3)
    lab, n = ndimage.label(scr); F = face(); out = Image.fromarray(a)
    for i, sl in enumerate(ndimage.find_objects(lab)):
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop; w, h = x1 - x0, y1 - y0
        if w * h < 400 or w < 14 or h < 10: continue
        ix, iy = round(w * 0.07), round(h * 0.08); x0 += ix; x1 -= ix; y0 += iy; y1 -= iy; w, h = x1 - x0, y1 - y0
        blk = Image.new('RGBA', (w, h), (2, 4, 3, 255))
        fw = max(8, round(min(w * 0.62, h * 0.95 * F.width / F.height))); f = F.resize((fw, max(4, round(F.height * fw / F.width))), Image.NEAREST if fw >= F.width else Image.LANCZOS)
        if dim != 1.0: f = Image.fromarray((np.asarray(f).astype(np.float32) * dim).clip(0, 255).astype(np.uint8))
        blk.paste(f, ((w - f.width) // 2, (h - f.height) // 2 + dy)); out.paste(blk, (x0, y0))
    return out if mode == 'RGBA' else out.convert(mode)
