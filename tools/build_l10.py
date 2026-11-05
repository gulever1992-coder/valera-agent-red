# Сборка арта уровня 10: art_src/l10/*.png (Flow) -> assets/l10/<лист>.png + js/l10_data.js (формат как L9D).
# py tools/build_l10.py [--debug]   (debug: контакт-листы кадров в art_src/l10/_dbg/)
import os, sys, json
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art_src', 'l10'); OUT = os.path.join(ROOT, 'assets', 'l10')
DBG = '--debug' in sys.argv
os.makedirs(OUT, exist_ok=True)
DATA = {'_bg': {}}

def load(n): return Image.open(os.path.join(SRC, n)).convert('RGB')

def key(im, bg='white', lo=None, hi=None):
    """Мягкий кей фона. white: по «белизне» (мин. канал + низкая насыщенность); magenta: по близости к #FF00FF."""
    a = np.asarray(im).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if bg == 'black':     # эффекты на чёрном: альфа по яркости (рисуются сложением)
        mx = np.maximum(np.maximum(r, g), b); al = np.clip((mx - 34) / 80, 0, 1)
        return Image.fromarray(np.dstack([a, al * 255]).astype(np.uint8), 'RGBA')
    if bg == 'white':
        mn = np.minimum(np.minimum(r, g), b); mx = np.maximum(np.maximum(r, g), b)
        d = (255 - mn) + (mx - mn) * 1.5           # 0 у чисто белого
        lo = 18 if lo is None else lo; hi = 60 if hi is None else hi
    else:
        d = np.sqrt((r - 255) ** 2 + g ** 2 + (b - 255) ** 2)
        lo = 70 if lo is None else lo; hi = 150 if hi is None else hi
        # пурпурная кайма -> убрать розовый оттенок с полупрозрачных краёв
    al = np.clip((d - lo) / (hi - lo), 0, 1)
    if bg == 'magenta':     # полупрозрачная «фиолетовая вода»/дым — тоже фон
        pp = np.minimum(r, b) - g; al = al * np.clip(1 - (pp - 45) / 50, 0, 1)
    rgb = a.copy()
    if bg == 'magenta':
        k = (1 - al)[..., None]
        m = np.clip(np.minimum(r, b) - g, 0, None)     # снять пурпурный оттенок (дым, края) со всех пикселей
        rgb[..., 0] = r - m * 0.85; rgb[..., 2] = b - m * 0.85
    else:     # белая кайма -> темнее (снять ореол)
        m = (al > 0) & (al < 1)
        for c in range(3): rgb[..., c] = np.where(m, np.clip((a[..., c] - 255 * (1 - al)) / np.maximum(al, 0.05), 0, 255), a[..., c])
    out = np.dstack([rgb, al * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')

def runs(mask1d, gap, minlen):
    xs = np.where(mask1d)[0]; segs = []
    if not len(xs): return segs
    s = p = xs[0]
    for x in xs[1:]:
        if x - p > gap: segs.append((s, p + 1)); s = x
        p = x
    segs.append((s, p + 1))
    return [q for q in segs if q[1] - q[0] >= minlen]

def frames(im, rows=None, gap=20, minlen=40, thr=0.004):
    """Кадры листа: строки по горизонтальным просветам, в строке — по вертикальным; каждый обрезан по содержимому."""
    A = np.asarray(im)[..., 3] > 40
    out = []
    for (y0, y1) in runs(A.mean(1) > thr, gap, minlen):
        band = A[y0:y1]
        for (x0, x1) in runs(band.mean(0) > thr, gap, minlen):
            sub = A[y0:y1, x0:x1]; ys = np.where(sub.any(1))[0]
            out.append(im.crop((x0, y0 + ys[0], x1, y0 + ys[-1] + 1)))
    return out

def grid(im, rows, cols, keep_own=True):
    """Сетка rows x cols: границы — по «впадинам» прозрачности возле равных долей; чужие куски (компоненты с центром
    в соседней ячейке) убираются. Возвращает кадры по строкам, обрезанные по содержимому."""
    from scipy import ndimage
    A = np.asarray(im)[..., 3]; H, W = A.shape; M = A > 40
    def cuts(prof, n, L):
        cs = [0]
        for k in range(1, n):
            c0 = int(L * k / n); w = int(L / n * 0.22); seg = prof[c0 - w:c0 + w]
            cs.append(c0 - w + int(np.argmin(seg)))
        return cs + [L]
    ys = cuts(M.mean(1), rows, H) if rows > 1 else [0, H]
    out = []
    for r in range(rows):
        band = M[ys[r]:ys[r + 1]]
        xs = cuts(band.mean(0), cols, W) if cols > 1 else [0, W]
        lab, n = ndimage.label(band)
        cen = ndimage.center_of_mass(band, lab, range(1, n + 1)) if n else []
        size = ndimage.sum(band, lab, range(1, n + 1)) if n else []
        for c in range(cols):
            x0, x1 = xs[c], xs[c + 1]
            # компоненты, чей центр в этой ячейке (большие куски, касающиеся соседей, режутся по границе)
            ok = np.zeros(n + 1, bool)
            for i, (cy, cx) in enumerate(cen):
                if x0 <= cx < x1 and size[i] > 30: ok[i + 1] = True
            keep = ndimage.binary_dilation(ok[lab], iterations=3) if keep_own else np.ones_like(band)
            a = np.asarray(im)[ys[r]:ys[r + 1]].copy()
            a[..., 3] = np.where(keep, a[..., 3], 0)
            # мелкие полупрозрачные края, не попавшие в маску (порог 40), сохраняем рядом с оставленными
            sub = Image.fromarray(a[:, x0:x1], 'RGBA')
            bb = sub.getbbox()
            out.append(sub.crop(bb) if bb else sub)
    return out

def pack(name, frs, names, scale=1.0, anchor='bc', maxw=4096):
    """Упаковать кадры в лист, записать DATA[name]. anchor: bc — низ-центр, c — центр, tc — верх-центр."""
    frs = [f.resize((max(1, round(f.width * scale)), max(1, round(f.height * scale))), Image.LANCZOS) if scale != 1 else f for f in frs]
    x = y = rowh = 0; pos = []; W = 0
    for f in frs:
        if x + f.width + 2 > maxw: x = 0; y += rowh + 2; rowh = 0
        pos.append((x + 1, y + 1)); x += f.width + 2; rowh = max(rowh, f.height); W = max(W, x)
    sh = Image.new('RGBA', (W + 1, y + rowh + 2), (0, 0, 0, 0))
    F = []
    for f, (px, py) in zip(frs, pos):
        sh.paste(f, (px, py))
        ax = f.width / 2; ay = f.height if anchor == 'bc' else f.height / 2 if anchor == 'c' else 0
        F.append([px, py, f.width, f.height, round(ax), round(ay)])
    sh.save(os.path.join(OUT, name + '.png'), optimize=True)
    DATA[name] = {'f': F, 'n': names}
    if DBG:
        os.makedirs(os.path.join(SRC, '_dbg'), exist_ok=True)
        bgc = Image.new('RGBA', sh.size, (40, 60, 70, 255)); bgc.alpha_composite(sh); bgc.convert('RGB').save(os.path.join(SRC, '_dbg', name + '.jpg'), quality=80)
    print(name, len(F), sh.size)

def bgimg(name, src, h=720, crop=None):
    im = load(src)
    if crop: im = im.crop(crop)
    w = round(im.width * h / im.height); im = im.resize((w, h), Image.LANCZOS)
    im.save(os.path.join(OUT, name + '.jpg'), quality=88); DATA['_bg'][name] = [w, h]; print(name, im.size)

def bgcut(name, src, h, bg='magenta'):     # слой фона с вырезанным небом (png с альфой)
    im = key(load(src), bg); w = round(im.width * h / im.height); im = im.resize((w, h), Image.LANCZOS)
    im.save(os.path.join(OUT, name + '.png'), optimize=True); DATA['_bgp'] = DATA.get('_bgp', {}); DATA['_bgp'][name] = [w, h]; print(name, im.size)

def write_data():
    with open(os.path.join(ROOT, 'js', 'l10_data.js'), 'w', encoding='utf-8') as f:
        f.write('// собрано tools/build_l10.py — не править руками\nwindow.L10D = ' + json.dumps(DATA, separators=(',', ':')) + ';\n')

if __name__ == '__main__':
    from build_l10_jobs import run
    run(sys.modules[__name__])
    write_data()
