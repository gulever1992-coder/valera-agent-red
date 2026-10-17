# Общие функции нарезки листов Flow для уровня 9 (взяты из build_l8.py, + ряды с разным числом кадров, + кей заливкой от краёв)
import os, sys, json
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC = os.path.join(ROOT, 'art_src', 'l9')
OUT = os.path.join(ROOT, 'assets', 'l9')
DBG = '--debug' in sys.argv
os.makedirs(OUT, exist_ok=True)

def load(name):
    return np.asarray(Image.open(os.path.join(SRC, name)).convert('RGB')).astype(np.int32)


def key(a, bg, fx=False, grid=True):
    """Маска фона: пурпур ('m') или зелёный ('g'); чёрные линии сетки тоже фон."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if bg == 'g':
        m = (g > 90) & (g > r * 1.35) & (g > b * 1.35)
    else:
        m = (r > 90) & (b > 90) & (g < np.minimum(r, b) * 0.5)
        if fx:   # свечение, смешанное с пурпуром
            m |= (b > r * 0.62) & (g < b * 0.62) & (b > 70)
    if not grid: return m
    dark = (r < 40) & (g < 40) & (b < 40)
    rows = dark.mean(1) > 0.85
    cols = dark.mean(0) > 0.85
    m = m.copy(); m[rows, :] = True; m[:, cols] = True
    for i in np.where(rows)[0]:
        m[max(0, i - 2):i + 3, :] |= dark[max(0, i - 2):i + 3, :]
    for i in np.where(cols)[0]:
        m[:, max(0, i - 2):i + 3] |= dark[:, max(0, i - 2):i + 3]
    m[:5, :] = True; m[-5:, :] = True; m[:, :5] = True; m[:, -5:] = True
    fr, fc = (~m).mean(1), (~m).mean(0)     # сплошные ТОНКИЕ линии-разделители любого цвета (соседние строки/столбцы — не сплошные)
    for i in range(8, m.shape[0] - 8):
        if fr[i] > 0.9 and min(fr[i - 7], fr[i + 7]) < 0.7: m[i, :] = True
    for i in range(8, m.shape[1] - 8):
        if fc[i] > 0.9 and min(fc[i - 7], fc[i + 7]) < 0.7: m[:, i] = True
    return m


def defringe(rgba, bg):
    """Срезать кайму цвета фона у края силуэта (2 прохода)."""
    a = rgba
    for _ in range(2):
        al = a[..., 3] > 0
        nb = np.zeros_like(al)
        nb[1:, :] |= ~al[:-1, :]; nb[:-1, :] |= ~al[1:, :]; nb[:, 1:] |= ~al[:, :-1]; nb[:, :-1] |= ~al[:, 1:]
        r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
        if bg == 'g': bad = (g > r * 1.15) & (g > b * 1.15) & (g > 70)
        else: bad = (r > g * 1.4) & (b > g * 1.4) & (r > 70) & (b > 70)
        a[al & nb & bad, 3] = 0
    return a


def runs(mask1d, min_gap, min_len):
    """Отрезки True с объединением через короткие разрывы."""
    out, s, gap = [], None, 0
    for i, v in enumerate(mask1d):
        if v:
            if s is None: s = i
            e = i; gap = 0
        elif s is not None:
            gap += 1
            if gap > min_gap: out.append((s, e + 1)); s = None
    if s is not None: out.append((s, e + 1))
    return [r for r in out if r[1] - r[0] >= min_len]


def valleys(proj, n):
    """Разбить проекцию на n отрезков: по n-1 самым широким пустым промежуткам; слипшиеся — по минимумам."""
    L = len(proj)
    nz = np.where(proj > 2)[0]; c0, c1 = int(nz.min()), int(nz.max())
    gaps, s0 = [], None
    for i in range(c0, c1 + 1):
        if proj[i] <= 2:
            if s0 is None: s0 = i
        elif s0 is not None: gaps.append((i - s0, (s0 + i) // 2)); s0 = None
    cuts = [c for _, c in sorted(gaps, reverse=True)[:n - 1]]
    if len(cuts) < n - 1:
        sm = np.convolve(proj.astype(float), np.ones(9) / 9, mode='same'); d = int((c1 - c0) / (n * 2.2))
        sm[:c0 + d] = 1e9; sm[c1 - d:] = 1e9
        for c in cuts: sm[max(0, c - d):c + d] = 1e9
        while len(cuts) < n - 1:
            i = int(np.argmin(sm)); cuts.append(i); sm[max(0, i - d):i + d] = 1e9
    cuts = [0] + sorted(cuts) + [L]
    return [(cuts[i], cuts[i + 1]) for i in range(n)]


def key_flood(a):
    """Пурпур, связанный с краем кадра, — фон; пурпурные пятна внутри силуэта (стекло) перекрашиваются в тёмно-бирюзовое стекло."""
    from scipy import ndimage
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    loose = (r > 60) & (b > 60) & (g < np.minimum(r, b) * 0.75)
    lab, n = ndimage.label(loose)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    m = np.isin(lab, list(edge))
    m = ndimage.binary_dilation(m, iterations=1) & loose | m
    glass = loose & ~m
    L = (0.3 * r + 0.59 * g + 0.11 * b)
    a = a.copy()
    a[glass, 0] = (L[glass] * 0.42).astype(np.int32); a[glass, 1] = (L[glass] * 0.95).astype(np.int32); a[glass, 2] = np.minimum(255, L[glass] * 1.1).astype(np.int32)
    return a, m


def cut(name, bg, rows, cols, mode='gap', fx=False, clean=False):
    """cols — число или список (своё число кадров в каждом ряду). bg: 'm' пурпур, 'g' зелёный, 'mf' пурпур заливкой от краёв."""
    a = load(name); H, W = a.shape[:2]
    if bg == 'mf':
        a, m = key_flood(a); bg = 'm'
    else:
        m = key(a, bg, fx)
    rgba = np.dstack([a, np.where(m, 0, 255)]).astype(np.uint8)
    rgba = defringe(rgba, bg)
    solid = rgba[..., 3] > 0
    frames = []
    cl = cols if isinstance(cols, (list, tuple)) else [cols] * rows
    if mode == 'grid':
        for j in range(rows):
            for i in range(cl[j]):
                x0, x1, y0, y1 = W * i // cl[j], W * (i + 1) // cl[j], H * j // rows, H * (j + 1) // rows
                frames.append((x0 + 3, y0 + 3, x1 - 3, y1 - 3))
    else:
        for j, (y0, y1) in enumerate(valleys(solid.sum(1), rows)):
            for (x0, x1) in valleys(solid[y0:y1].sum(0), cl[j]):
                frames.append((x0, y0, x1, y1))
    res = []
    for (x0, y0, x1, y1) in frames:
        sub = rgba[y0:y1, x0:x1]; s = sub[..., 3] > 0
        if not s.any(): res.append(None); continue
        if clean:
            from scipy import ndimage
            lab, n = ndimage.label(s)
            if n > 1 and clean == 'edge':   # куски соседнего кадра, залезшие через границу ячейки
                edge = set(lab[0]) | set(lab[-1]) | set(lab[:, 0]) | set(lab[:, -1]); sz = ndimage.sum(s, lab, range(1, n + 1)); keep = [i for i in range(1, n + 1) if (i not in edge and sz[i - 1] > sz.max() * 0.004) or sz[i - 1] >= sz.max()]
                s = np.isin(lab, keep); sub = sub.copy(); sub[~s, 3] = 0
            elif n > 1:
                sz = ndimage.sum(s, lab, range(1, n + 1)); keep = [i + 1 for i, v in enumerate(sz) if v >= sz.max() * 0.04]
                s = np.isin(lab, keep); sub = sub.copy(); sub[~s, 3] = 0
        ys, xs = np.where(s)
        res.append(Image.fromarray(sub[ys.min():ys.max() + 1, xs.min():xs.max() + 1]))
    return res


def anchor_x(im):
    """Центр опоры: середина нижней четверти силуэта."""
    a = np.asarray(im)[..., 3] > 0
    h = a.shape[0]; xs = np.where(a[int(h * 0.78):].any(0))[0]
    return int((xs.min() + xs.max()) / 2) if len(xs) else im.width // 2


DATA = {}


def pack(sheet, frames, scale, anchor='feet', names=None):
    """Собрать кадры в один ряд; scale — множитель к исходнику; anchor: feet | mid."""
    fr = []
    for im in frames:
        if im is None: fr.append(None); continue
        w, h = max(1, round(im.width * scale)), max(1, round(im.height * scale))
        fr.append(im.resize((w, h), Image.LANCZOS))
    Wd = sum(f.width + 2 for f in fr if f) + 2; Hd = max(f.height for f in fr if f) + 2
    sh = Image.new('RGBA', (Wd, Hd), (0, 0, 0, 0)); x = 1; meta = []
    for f in fr:
        if f is None: meta.append(None); continue
        arr = np.asarray(f).copy(); arr[arr[..., 3] < 110, 3] = 0; arr[arr[..., 3] >= 110, 3] = 255
        if sheet[0] == 'v':      # у Валеры нет пурпура: кайма фона на стволе -> серый металл
            r_, g_, b_ = arr[..., 0].astype(int), arr[..., 1].astype(int), arr[..., 2].astype(int); pu = (r_ > g_ * 1.25) & (b_ > g_ * 1.25) & (b_ > 40)
            L_ = (r_ * 0.3 + g_ * 0.59 + b_ * 0.11) * 0.8; arr[pu, 0] = L_[pu]; arr[pu, 1] = L_[pu]; arr[pu, 2] = (L_[pu] * 1.05).clip(0, 255)
        f = Image.fromarray(arr); sh.paste(f, (x, 1))
        ax = anchor_x(f) if anchor == 'feet' else f.width // 2
        ay = f.height if anchor == 'feet' else f.height // 2
        meta.append([x, 1, f.width, f.height, ax, ay]); x += f.width + 2
    sh.save(os.path.join(OUT, sheet + '.png'))
    DATA[sheet] = {'f': meta}
    if names: DATA[sheet]['n'] = names
    print('%-8s %4dx%-4d кадров %d, высоты %s' % (sheet, Wd, Hd, len(fr), [f.height if f else 0 for f in fr]))


def hgt(frames, i): return frames[i].height


def seamless(im, B=None):
    """Сделать картинку периодической по горизонтали: последние B столбцов плавно перетекают в первые (тайл без шва)."""
    a = np.asarray(im).astype(np.float32); H, W = a.shape[:2]; B = B or W // 5
    out = a[:, :W - B].copy()
    k = (np.arange(B) / B)[None, :, None]
    out[:, :B] = a[:, W - B:W] * (1 - k) + a[:, :B] * k
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))


def cut_blobs(name, bg, rows, grow=6, min_k=0.03):
    """Кадры = связные фигуры (с ростом grow px, чтобы капли и плевки держались своей фигуры); порядок — по рядам слева направо.
    Нужно, когда фигуры на листе перекрывают друг друга по x (плевок над соседним кадром)."""
    from scipy import ndimage
    a = load(name); m = key(a, bg)
    rgba = defringe(np.dstack([a, np.where(m, 0, 255)]).astype(np.uint8), bg)
    s = rgba[..., 3] > 0
    lab, n = ndimage.label(ndimage.binary_dilation(s, iterations=grow))
    sz = ndimage.sum(s, lab, range(1, n + 1)); objs = ndimage.find_objects(lab)
    blobs = [(objs[i], i + 1) for i in range(n) if sz[i] >= sz.max() * min_k]
    H = a.shape[0]; out = []
    for j in range(rows):
        row = [b for b in blobs if j * H // rows <= (b[0][0].start + b[0][0].stop) // 2 < (j + 1) * H // rows]
        for (sl, li) in sorted(row, key=lambda b: b[0][1].start):
            sub = rgba[sl].copy(); sub[(lab[sl] != li) | ~s[sl], 3] = 0
            ys, xs = np.where(sub[..., 3] > 0)
            out.append(Image.fromarray(sub[ys.min():ys.max() + 1, xs.min():xs.max() + 1]))
    return out
