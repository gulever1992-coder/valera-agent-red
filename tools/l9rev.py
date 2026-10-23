# Разоблачение Семёна (ур.9): тело Семёна (semZ9) с головами-масками Кеши и Граблионка (maskZ9) — подстановка голов из готовых спрайтов Flow
import numpy as np
from PIL import Image
def shoulders(im):     # строка плеч: ширина непрозрачного резко больше ширины головы
    a = np.asarray(im)[..., 3] > 40; ws = []
    for y in range(a.shape[0]):
        xs = np.where(a[y])[0]; ws.append((xs.min(), xs.max()) if len(xs) else None)
    hw = max(x1 - x0 for x0, x1 in [w for w in ws[5:25] if w]) if any(ws[5:25]) else 20
    for y in range(25, a.shape[0]):
        w = ws[y]
        if w and (w[1] - w[0]) > hw * 1.45: return y, ws
    return 45, ws
def head(im, frac=None):     # голова-маска: всё выше подбородка (frac — доля роста; иначе по линии плеч)
    sy, ws = shoulders(im); cut = int(im.height * frac) if frac else sy - 8; a = np.asarray(im).copy(); a[cut:, :, 3] = 0
    h = Image.fromarray(a); bb = h.getbbox(); return h.crop(bb), sy
def swap(body, hd, hsy):
    by, ws = shoulders(body); a = np.asarray(body).copy()
    cols = [w for w in ws[0:by - 6] if w]; cx = (min(w[0] for w in cols) + max(w[1] for w in cols)) / 2 if cols else body.width / 2
    x0 = int(cx - 24); x1 = int(cx + 24); a[0:by - 9, max(0, x0):x1, 3] = 0     # убрать голову Семёна
    b = Image.fromarray(a); W = max(b.width, hd.width + 10); H = b.height + 20
    out = Image.new('RGBA', (W, H)); ox = (W - b.width) // 2; out.paste(b, (ox, 20), b)
    out.paste(hd, (int(ox + cx - hd.width / 2), 20 + by - 2 - hd.height), hd)
    return out.crop(out.getbbox())
def split_cols(im, gap=10, minw=20):     # фигуры в ряд: делим по пустым столбцам
    a = np.asarray(im)[..., 3] > 40; col = a.sum(0) > 2; out = []; x = 0; W = len(col)
    while x < W:
        if not col[x]: x += 1; continue
        x0 = x; e = x
        while x < W and (col[x] or (x - e) < gap):
            if col[x]: e = x
            x += 1
        if e - x0 >= minw: c = im.crop((x0, 0, e + 1, im.height)); out.append(c.crop(c.getbbox()))
    return out
