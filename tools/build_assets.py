# Сборка игровых ассетов из сгенерированных картинок (art_src/ -> assets/)
# Спрайт-листы на зелёном фоне: хромакей, нарезка кадров, выравнивание по ногам, масштаб, атлас.
# Запуск: py tools/build_assets.py
import json, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art_src')
OUT = os.path.join(ROOT, 'assets')
SPR = os.path.join(OUT, 'spr')
os.makedirs(SPR, exist_ok=True)
SCALE = 2  # игровой холст 1280x720 при логике 640x360

def key_green(im):
    a = np.array(im.convert('RGBA')).astype(np.int32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    bg = (g > 120) & (g - np.maximum(r, b) > 45)
    a[..., 3] = np.where(bg, 0, 255)
    # убираем зелёную кайму у краёв
    op = a[..., 3] > 0
    edge = op & ~(np.roll(op, 1, 0) & np.roll(op, -1, 0) & np.roll(op, 1, 1) & np.roll(op, -1, 1))
    for _ in range(2):
        m = edge & (a[..., 1] > np.maximum(a[..., 0], a[..., 2]))
        a[..., 1] = np.where(m, np.maximum(a[..., 0], a[..., 2]), a[..., 1])
        op2 = a[..., 3] > 0
        edge = op2 & ~edge & ~(np.roll(op2, 1, 0) & np.roll(op2, -1, 0) & np.roll(op2, 1, 1) & np.roll(op2, -1, 1)) | edge
    return a.astype(np.uint8)

def key_green_strict(im):
    # только чистый хромакей, связанный с краями (+ явные дырки) — арбузная каска не выедается
    a = np.array(im.convert('RGBA')).astype(np.int32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    cand = (g > 185) & (r < 110) & (b < 110) & (g - np.maximum(r, b) > 110)
    lab, n = ndimage.label(cand)
    edge_ids = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sizes = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
    # закрытые области (дырки между рукой и головой) — только если точно цвета фона
    edge = np.isin(lab, list(edge_ids))
    ref = np.median(a[edge][:, :3], axis=0) if edge.any() else np.array([0, 255, 0])
    big = set()
    for i, sz in enumerate(sizes):
        if sz > 6 and (i + 1) not in edge_ids:
            m = lab == i + 1
            if np.abs(a[m][:, :3].mean(axis=0) - ref).max() < 18 and a[m][:, :3].std(axis=0).max() < 12: big.add(i + 1)
    bg = np.isin(lab, list(edge_ids | big))
    a[..., 3] = np.where(bg, 0, 255)
    # кайма: пиксели рядом с фоном с сильным зелёным перекосом тоже убираем/гасим
    near = ndimage.binary_dilation(bg, iterations=2) & ~bg
    spill = near & (g - np.maximum(r, b) > 70) & (g > 150)
    a[..., 3] = np.where(spill, 0, a[..., 3])
    near = ndimage.binary_dilation(a[..., 3] == 0, iterations=1) & (a[..., 3] > 0)
    m = near & (a[..., 1] > np.maximum(a[..., 0], a[..., 2]) + 20)
    a[..., 1] = np.where(m, np.maximum(a[..., 0], a[..., 2]) + 20, a[..., 1])
    return a.astype(np.uint8)

def key_magenta(im):
    a = np.array(im.convert('RGBA')).astype(np.int32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    bg = ((r > 150) & (b > 150) & (g < 120)) | ((r - g > 90) & (b - g > 90))
    a[..., 3] = np.where(bg, 0, 255)
    # розовая кайма: съедаем пурпурные пиксели у края и гасим остаточный оттенок
    for _ in range(3):
        tr = a[..., 3] == 0
        near = ndimage.binary_dilation(tr, iterations=1) & ~tr
        pink = near & (a[..., 0] - a[..., 1] > 35) & (a[..., 2] - a[..., 1] > 35)
        a[..., 3] = np.where(pink, 0, a[..., 3])
    tr = a[..., 3] == 0
    near = ndimage.binary_dilation(tr, iterations=2) & ~tr
    m = np.minimum(a[..., 0], a[..., 2]) - a[..., 1]
    fix = near & (m > 0)
    a[..., 0] = np.where(fix, a[..., 0] - m, a[..., 0]); a[..., 2] = np.where(fix, a[..., 2] - m, a[..., 2])
    return a.astype(np.uint8)

def key_pre(im):
    # уже прозрачный фон: жёсткая альфа + убрать мелкий мусор
    a = np.array(im.convert('RGBA')).astype(np.int32)
    op = a[..., 3] > 110
    lab, n = ndimage.label(op)
    if n:
        sizes = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
        keep = np.isin(lab, [i + 1 for i, sz in enumerate(sizes) if sz >= 60])
        op &= keep
    a[..., 3] = np.where(op, 255, 0)
    return a.astype(np.uint8)

def key_pre_red(im):
    # прозрачный фон с красной каймой от кодекса
    a = key_pre(im).astype(np.int32)
    for _ in range(3):
        tr = a[..., 3] == 0
        near = ndimage.binary_dilation(tr, iterations=1) & ~tr
        red = near & (a[..., 0] > 120) & (a[..., 0] - a[..., 1] > 90) & (a[..., 0] - a[..., 2] > 80)
        a[..., 3] = np.where(red, 0, a[..., 3])
    return a.astype(np.uint8)

def key_cyan(im):
    a = np.array(im.convert('RGBA')).astype(np.int32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    bg = (r < 90) & (g > 190) & (b > 190)
    a[..., 3] = np.where(bg, 0, 255)
    for _ in range(2):
        tr = a[..., 3] == 0; near = ndimage.binary_dilation(tr, iterations=1) & ~tr
        cy = near & (a[..., 1] - a[..., 0] > 60) & (a[..., 2] - a[..., 0] > 60)
        a[..., 3] = np.where(cy, 0, a[..., 3])
    return a.astype(np.uint8)

def key_black(im):
    a = np.array(im.convert('RGBA')).astype(np.int32)
    dark = a[..., :3].max(axis=2) < 22
    h, w = dark.shape
    bg = np.zeros_like(dark)
    # заливка от краёв (итеративно, векторно)
    bg[0, :] = dark[0, :]; bg[-1, :] = dark[-1, :]; bg[:, 0] = dark[:, 0]; bg[:, -1] = dark[:, -1]
    while True:
        n = bg | (dark & (np.roll(bg, 1, 0) | np.roll(bg, -1, 0) | np.roll(bg, 1, 1) | np.roll(bg, -1, 1)))
        if (n == bg).all(): break
        bg = n
    a[..., 3] = np.where(bg, 0, 255)
    return a.astype(np.uint8)

from scipy import ndimage

def segment(a, n, ncols=None, dil=4):
    m = a[..., 3] > 0
    lab, k = ndimage.label(ndimage.binary_dilation(m, iterations=dil))
    objs = ndimage.find_objects(lab)
    comps = []
    for i, sl in enumerate(objs):
        area = int(((lab[sl] == i + 1) & m[sl]).sum())
        comps.append({'ids': {i + 1}, 'x0': sl[1].start, 'y0': sl[0].start, 'x1': sl[1].stop, 'y1': sl[0].stop, 'area': area})
    big = max(c['area'] for c in comps)
    def gap(p, q):
        gx = max(0, max(p['x0'], q['x0']) - min(p['x1'], q['x1']))
        gy = max(0, max(p['y0'], q['y0']) - min(p['y1'], q['y1']))
        return gx + gy * (1.5 if ncols is None else 1.0)
    def merge(p, q):
        p['ids'] |= q['ids']; p['area'] += q['area']
        for kk, f in (('x0', min), ('y0', min), ('x1', max), ('y1', max)): p[kk] = f(p[kk], q[kk])
    small = [c for c in comps if c['area'] < big * 0.03]
    comps = [c for c in comps if c['area'] >= big * 0.03]
    for c in small:
        best = min(comps, key=lambda q: gap(c, q))
        if gap(c, best) < 70: merge(best, c)
    while len(comps) > n:
        best = None
        for i in range(len(comps)):
            for j in range(i + 1, len(comps)):
                g = gap(comps[i], comps[j]) + 0.002 * min(comps[i]['area'], comps[j]['area'])
                if best is None or g < best[0]: best = (g, i, j)
        _, i, j = best
        merge(comps[i], comps[j]); del comps[j]
    if len(comps) < n: print('  !! кадров', len(comps), 'из', n)
    if ncols:
        comps.sort(key=lambda c: (c['y0'] + c['y1']) / 2)
        counts = ncols if isinstance(ncols, list) else [ncols] * (len(comps) // ncols)
        rows, k0 = [], 0
        for cnt in counts: rows.append(comps[k0:k0 + cnt]); k0 += cnt
        comps = [c for r in rows for c in sorted(r, key=lambda c: c['x0'] + c['x1'])]
    else:
        comps.sort(key=lambda c: c['x0'] + c['x1'])
    out = []
    for c in comps:
        sl = (slice(c['y0'], c['y1']), slice(c['x0'], c['x1']))
        sub = a[sl].copy()
        keep = np.isin(lab[sl], list(c['ids']))
        sub[..., 3] = np.where(keep & (sub[..., 3] > 0), 255, 0)
        ys = np.where(sub[..., 3].any(axis=1))[0]; xs = np.where(sub[..., 3].any(axis=0))[0]
        out.append(sub[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1])
    return out

def frames_row(a, n):
    return segment(a, n)

def frames_grid(a, nrows, ncols):
    if isinstance(ncols, list): return segment(a, sum(ncols), ncols=ncols)
    return segment(a, nrows * ncols, ncols=ncols)

def anchor(f, mode):
    al = f[..., 3] > 0
    h, w = al.shape
    if mode == 'center':
        return w / 2, h
    if mode == 'body':
        # по корпусу/голове (без синей мухобойки): тело не «ездит» между кадрами бега
        ys = np.where(al.any(axis=1))[0]; top, bottom = ys[0], ys[-1]
        band = f[int(top + (bottom - top) * 0.08):int(top + (bottom - top) * 0.5)]
        m = (band[..., 3] > 0) & ~(band[..., 2].astype(int) > band[..., 0].astype(int) + 20)
        xs = np.nonzero(m)[1]
        return float(np.median(xs)), bottom + 1
    ys = np.where(al.any(axis=1))[0]
    bottom = ys[-1]
    band = al[max(0, int(bottom - h * 0.14)):bottom + 1]
    xs = np.where(band.any(axis=0))[0]
    return (xs[0] + xs[-1]) / 2, bottom + 1

def only_largest(f):
    lab, n = ndimage.label(ndimage.binary_dilation(f[..., 3] > 0, iterations=2))
    if n <= 1: return f
    sizes = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
    keep = lab == (int(np.argmax(sizes)) + 1)
    f = f.copy(); f[..., 3] = np.where(keep & (f[..., 3] > 0), 255, 0)
    ys = np.where(f[..., 3].any(axis=1))[0]; xs = np.where(f[..., 3].any(axis=0))[0]
    return f[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1]

def build_sheet(name, src, n, target, ref=0, keyer='green', grid=None, anchors=None, pad=2, strip=(), dil=4, even=False):
    im = Image.open(os.path.join(SRC, src))
    a = key_green(im) if keyer == 'green' else key_green_strict(im) if keyer == 'strict' else key_black(im) if keyer == 'black' else key_magenta(im) if keyer == 'magenta' else key_pre(im) if keyer == 'clean' else key_pre_red(im) if keyer == 'cleanr' else key_cyan(im) if keyer == 'cyan' else np.array(im.convert('RGBA'))
    if even:
        # кадры стоят в ряд: крупные куски — тела (слипшиеся делим по «перешейку»), мелочь — к ближайшему телу
        op = a[..., 3] > 0
        lab, nl = ndimage.label(ndimage.binary_dilation(op, iterations=1))
        objs = ndimage.find_objects(lab)
        areas = ndimage.sum(np.ones(lab.shape), lab, range(1, nl + 1))
        big = sorted([j for j in range(nl) if areas[j] > areas.max() * 0.2], key=lambda j: objs[j][1].start)
        mw = float(np.median([objs[j][1].stop - objs[j][1].start for j in big]))
        ranges = []  # (id, x0, x1)
        for j in big:
            x0, x1 = objs[j][1].start, objs[j][1].stop
            k = max(1, int(round((x1 - x0) / mw)))
            if len(big) + k - 1 > n: k = 1
            cuts = [x0]
            prof = ((lab == j + 1) & op).sum(axis=0)
            for q in range(1, k):
                c0 = x0 + (x1 - x0) * q / k; r = (x1 - x0) / k * 0.35
                lo, hi = int(c0 - r), int(c0 + r)
                cuts.append(lo + int(np.argmin(prof[lo:hi])))
            cuts.append(x1)
            for q in range(k): ranges.append((j + 1, cuts[q], cuts[q + 1]))
        ranges.sort(key=lambda t: t[1])
        cms = ndimage.center_of_mass(np.ones(lab.shape), lab, range(1, nl + 1))
        centers = [(r[1] + r[2]) / 2 for r in ranges]
        fr = []
        cols = np.arange(a.shape[1])[None, :]
        for fi, (jid, x0, x1) in enumerate(ranges):
            m = (lab == jid) & (cols >= x0) & (cols < x1)
            for j in range(nl):
                if j + 1 in [r[0] for r in ranges]: continue
                if int(np.argmin([abs(cms[j][1] - c) for c in centers])) == fi: m |= lab == j + 1
            m &= op
            ys = np.where(m.any(axis=1))[0]; xs = np.where(m.any(axis=0))[0]
            sub = a[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1].copy()
            sub[..., 3] = np.where(m[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1], sub[..., 3], 0)
            fr.append(sub)
        if len(fr) != n: print('  !! кадров', len(fr), 'из', n)
    else:
        fr = frames_grid(a, *grid) if grid else segment(a, n, dil=dil)
    fr = [only_largest(f) if i in strip else f for i, f in enumerate(fr)]
    if isinstance(target, (int, float)):
        k = target * SCALE / fr[ref].shape[0]
        ks = [k] * len(fr)
    else:
        ks = [t * SCALE / f.shape[0] if t > 0 else (-t) * SCALE / f.shape[1] for f, t in zip(fr, target)]
    imgs, meta = [], []
    for i, (f, k) in enumerate(zip(fr, ks)):
        pim = Image.fromarray(f, 'RGBA')
        w, h = max(1, round(pim.width * k)), max(1, round(pim.height * k))
        pim = pim.resize((w, h), Image.LANCZOS)
        arr = np.array(pim)
        arr[..., 3] = np.where(arr[..., 3] > 90, 255, 0)
        mode = anchors[i] if anchors else 'feet'
        ax, ay = anchor(arr, mode)
        al = arr[..., 3] > 0
        ys = np.where(al.any(axis=1))[0]; top = ys[0]
        xs = np.where(al[top:top + max(3, int(arr.shape[0] * 0.07))].any(axis=0))[0]
        imgs.append(Image.fromarray(arr, 'RGBA'))
        meta.append([ax, ay, (xs[0] + xs[-1]) / 2, top])
    W = sum(i.width + pad for i in imgs); Hh = max(i.height for i in imgs)
    atlas = Image.new('RGBA', (W, Hh), (0, 0, 0, 0))
    x = 0; frames = []
    for im2, (ax, ay, hx, hy) in zip(imgs, meta):
        atlas.paste(im2, (x, 0))
        frames.append([int(x), 0, int(im2.width), int(im2.height), round(float(ax), 1), round(float(ay), 1), round(float(hx), 1), int(hy)])
        x += im2.width + pad
    atlas.save(os.path.join(SPR, name + '.png'), optimize=True)
    print(name, len(frames), 'кадров', atlas.size)
    return {'img': 'assets/spr/' + name + '.png', 'f': frames}

def bg(src, name, size, quality=88):
    im = Image.open(os.path.join(SRC, src)).convert('RGB')
    if size[1] is None: size = (size[0], round(im.height * size[0] / im.width))
    if size[0] is None: size = (round(im.width * size[1] / im.height), size[1])
    im = im.resize(size, Image.LANCZOS)
    im.save(os.path.join(OUT, name + '.jpg'), quality=quality, optimize=True)
    print(name, im.size)
    return list(im.size)

S = {}
# ---- Валера (логический рост ~80) ----
S['v_run'] = build_sheet('v_run', 'valera_run.png', 8, 78)
S['v_jump'] = build_sheet('v_jump', 'valera_jump_idle.png', 6, 80, ref=0)
S['v_fight'] = build_sheet('v_fight', 'valera_fight.png', 6, 79, ref=1, anchors=['feet'] * 5 + ['center'], strip=(3, 4))
S['v_idle'] = build_sheet('v_idle', 'valera_idle_funny.png', 6, 82, ref=0)
S['v_story'] = build_sheet('v_story', 'valera_climb_story.png', 6, 80, ref=2)
S['v_story2'] = build_sheet('v_story2', 'valera_story2.png', 6, 84, ref=1)
# ---- Наташка ----
S['n_a'] = build_sheet('n_a', 'natasha_a.png', 6, 76, ref=0)
S['n_b'] = build_sheet('n_b', 'natasha_b.png', 6, 76, ref=0)
# ---- враги ----
S['enemies'] = build_sheet('enemies', 'enemies.png', 7, [-28, -28, -30, -30, 72, 72, -74], anchors=['feet', 'feet', 'center', 'center', 'feet', 'feet', 'feet'])
S['cmd'] = build_sheet('cmd', 'commandos.png', 5, 84, ref=1, anchors=['center', 'feet', 'feet', 'feet', 'feet'])
# ---- рабочие на фоне ----
S['wk_a'] = build_sheet('wk_a', 'workers_a.png', 8, 64, ref=6)
S['wk_b'] = build_sheet('wk_b', 'workers_b.png', 8, 58, ref=6)
# ---- предметы и платформы (чёрный фон) ----
S['items'] = build_sheet('items', 'items.png', 16, [-15, -14, -20, 16, -10, -17, 17, 18, -9, -18, 17, -13, -19, -17, 16, 17], keyer='black', grid=(4, 4), anchors=['center'] * 16)
S['props'] = build_sheet('props', 'props_platforms.png', 10, [-160, -160, -80, -160, -64, 60, -36, -64, 48, -24], keyer='black', grid=(5, 2), anchors=['center'] * 10)
# ---- новое: уровень 2 и правки ----
S['v_bottle'] = build_sheet('v_bottle', 'valera_bottle.png', 7, 80, ref=0)
S['v_climb2'] = build_sheet('v_climb2', 'valera_climb2.png', 6, 80, ref=3, anchors=['feet'] * 5 + ['center'])
S['v_story3'] = build_sheet('v_story3', 'valera_story3.png', 6, 80, ref=1)
S['gopnik'] = build_sheet('gopnik', 'gopnik.png', 7, 78, ref=1)
S['bomzh'] = build_sheet('bomzh', 'bomzh_alkash.png', 8, 76, ref=0)
S['punk'] = build_sheet('punk', 'punk_dogs.png', 8, [80, 80, 76, -80, -28, -28, -52, -52])
S['kesha_a'] = build_sheet('kesha_a', 'kesha_a.png', 8, 82, ref=0)
S['kesha_b'] = build_sheet('kesha_b', 'kesha_b.png', 7, 82, ref=0)
S['cmd_hide'] = build_sheet('cmd_hide', 'commandos_hide.png', 6, [80, -52, -70, 60, 110, 70], anchors=['feet', 'feet', 'feet', 'feet', 'center', 'feet'])
S['nat_win'] = build_sheet('nat_win', 'natasha_window.png', 3, [-58, -58, -58], anchors=['center'] * 3)
S['matiz'] = build_sheet('matiz', 'matiz.png', 3, [-120, -120, -150], anchors=['feet', 'feet', 'feet'])
S['sub'] = build_sheet('sub', 'sub_sprite.png', 1, [-560], anchors=['center'])
S['street'] = build_sheet('street', 'prop_street_keyed.png', 12, [96, 92, 106, 58, 40, 86, 62, 34, 116, 150, 112, 40], keyer='pre', grid=(3, [3, 4, 5]), anchors=['feet'] * 12)
# ---- фоны ----
B = {}
B['aerial'] = bg('bg_aerial_v2.png', 'bg_aerial', (None, 720))
B['hall'] = bg('hall_empty.png', 'bg_hall', (1280, 720))
B['arena'] = bg('bg_arena_v2.png', 'bg_arena', (1280, 720))
B['climb_bottom'] = bg('bg_climb_bottom_v2.png', 'bg_climb_bottom', (1280, None))
B['climb_top'] = bg('bg_climb_top_v2.png', 'bg_climb_top', (1280, None))
B['shop'] = bg('shop_interior.png', 'bg_shop', (1280, 720))
B['sky'] = bg('city_sky_far.png', 'bg_sky', (None, 720))
# передний план титульного экрана: машины
fg = Image.fromarray(key_green(Image.open(os.path.join(SRC, 'street_cars.png'))), 'RGBA').resize((1280, 720), Image.LANCZOS)
a_ = np.array(fg); a_[..., 3] = np.where(a_[..., 3] > 90, 255, 0); Image.fromarray(a_, 'RGBA').save(os.path.join(OUT, 'fg_cars.png'), optimize=True)
# портреты для диалогов
def portrait(src, n, idx, box, name, ref=0):
    a = key_green(Image.open(os.path.join(SRC, src)))
    f = frames_row(a, n)[idx]
    h, w = f.shape[:2]
    x0, y0, x1, y1 = [int(v) for v in (box[0] * w, box[1] * h, box[2] * w, box[3] * h)]
    p = Image.fromarray(f[y0:y1, x0:x1], 'RGBA').resize((128, 128), Image.LANCZOS)
    p.save(os.path.join(SPR, name + '.png'))
portrait('natasha_a.png', 6, 0, (0.08, 0.0, 0.92, 0.42), 'p_natasha')
portrait('valera_climb2.png', 6, 5, (0.0, 0.0, 1.0, 1.0), 'p_valera')
portrait('kesha_a.png', 8, 0, (0.12, 0.0, 0.88, 0.36), 'p_kesha')
portrait('commandos.png', 5, 1, (0.08, 0.0, 0.62, 0.36), 'p_cmd')
portrait('commandos.png', 5, 3, (0.30, 0.0, 0.85, 0.36), 'p_cmd2')

with open(os.path.join(ROOT, 'js', 'sprites_data.js'), 'w', encoding='utf-8') as fp:
    fp.write('// автоматически создано tools/build_assets.py\nwindow.SPRITES = ' + json.dumps(S) + ';\nwindow.BGS = ' + json.dumps(B) + ';\n')
print('готово')

# ================= уровень 2: слоистый бесшовный фон =================
BDIR = os.path.join(OUT, 'b'); os.makedirs(BDIR, exist_ok=True)
def keyed_rgba(src):
    im = Image.open(os.path.join(SRC, src))
    if im.mode == 'RGBA' and np.array(im)[..., 3].min() == 0:
        a = np.array(im).astype(np.uint8)
        g = (a[..., 1].astype(int) > 150) & (a[..., 1].astype(int) - np.maximum(a[..., 0], a[..., 2]).astype(int) > 60)
        a[..., 3] = np.where(g, 0, a[..., 3])
        return a
    return key_green(im)
def profile(arr, k):
    # верхний край объекта по столбцам -> горизонтальные отрезки (логические координаты от левого нижнего угла)
    al = arr[..., 3] > 0
    h, w = al.shape
    tops = np.array([np.argmax(al[:, x]) if al[:, x].any() else h for x in range(w)])
    segs, x0 = [], 0
    for x in range(1, w + 1):
        if x == w or abs(int(tops[x]) - int(tops[x0])) > 6:
            if x - x0 >= 24 and tops[x0] < h:
                y = int(np.median(tops[x0:x]))
                segs.append([round(x0 * k, 1), round(x * k, 1), round((h - y) * k, 1)])
            x0 = x
    return segs
B2 = {}
BUILD = {  # имя: (файл, логическая высота, считать ли верх платформой)
    'gate': ('b_gate.png', 220, False), 'workshop': ('b_workshop.png', 430, False), 'shop': ('b_shop.png', 600, False),
    'hrush': ('b_hrush.png', 600, False), 'dk': ('b_dk.png', 520, False), 'stele': ('b_stele.png', 460, False),
    'nine': ('b_9storey.png', 900, False), 'hero': ('b_hero.png', 600, False), 'garages': ('b_garages.png', 130, True),
    'pipes': ('b_pipes.png', 200, True), 'embank': ('b_embank.png', 230, False), 'park': ('b_park.png', 300, False),
}
for name, (src, th, walk) in BUILD.items():
    a = keyed_rgba(src)
    ys = np.where((a[..., 3] > 0).sum(axis=1) > 20)[0]; xs = np.where((a[..., 3] > 0).sum(axis=0) > 20)[0]
    x0, x1, y0, y1 = xs[0], xs[-1] + 1, ys[0], ys[-1] + 1
    a = a[y0:y1, x0:x1]
    k = th / a.shape[0]                    # логических px на пиксель исходника
    im = Image.fromarray(a, 'RGBA').resize((round(a.shape[1] * k * SCALE), round(a.shape[0] * k * SCALE)), Image.LANCZOS)
    arr = np.array(im); arr[..., 3] = np.where(arr[..., 3] > 100, 255, 0)
    Image.fromarray(arr, 'RGBA').quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(os.path.join(BDIR, name + '.png'), optimize=True)
    meta = {'img': 'assets/b/' + name + '.png', 'w': round(arr.shape[1] / SCALE, 1), 'h': round(arr.shape[0] / SCALE, 1)}
    if walk: meta['tops'] = profile(arr, 1 / SCALE)
    if name in ('hero', 'shop'): meta['door'] = round((655 - x0) * k, 1)
    if name == 'hero':  # открытое окно 2 этажа: исходные координаты 392..476 x 815..910
        meta['win'] = [round((392 - x0) * k, 1), round((815 - y0) * k, 1), round(84 * k, 1), round(95 * k, 1)]
    B2[name] = meta
    print('здание', name, meta['w'], meta['h'])
# небо (бесшовное), дальний город, земля
sky = Image.open(os.path.join(SRC, 'l2_sky.png')).convert('RGB'); sky = sky.resize((round(sky.width * 720 / sky.height), 720), Image.LANCZOS); sky.save(os.path.join(BDIR, 'sky.jpg'), quality=88)
far = Image.fromarray(key_green(Image.open(os.path.join(SRC, 'l2_farcity.png'))), 'RGBA')
fa = np.array(far); ys = np.where((fa[..., 3] > 0).sum(axis=1) > 20)[0]; far = Image.fromarray(fa[ys[0]:], 'RGBA')
far = far.resize((round(far.width * 380 / far.height), 380), Image.LANCZOS); far.save(os.path.join(BDIR, 'far.png'), optimize=True)
gr = Image.open(os.path.join(SRC, 'l2_ground.png')).convert('RGB').crop((0, 0, 2172, 300))
gr = gr.resize((round(2172 * 140 / 300), 140), Image.LANCZOS); gr.save(os.path.join(BDIR, 'ground.jpg'), quality=88)
B2['_layers'] = {'sky': [sky.width / 2, 360], 'far': [far.width / 2, 190], 'ground': [gr.width / 2, 70]}
# магазин с дальней камерой и крупный Валера для этой сцены
B['shop'] = bg('shop2.png', 'bg_shop', (1280, 720))
cab = Image.open(os.path.join(SRC, 'cab_entrance.png')).convert('RGBA').resize((1280, 721), Image.LANCZOS)
ca = np.array(cab); ca[..., 3] = np.where(ca[..., 3] > 100, 255, 0)
Image.fromarray(ca, 'RGBA').quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(os.path.join(OUT, 'l1_cab.png'), optimize=True)
fl = Image.open(os.path.join(SRC, 'l1_floor.png')).convert('RGB').crop((0, 0, 2172, 400))
fl = fl.resize((round(2172 * 140 / 400), 140), Image.LANCZOS); fl.save(os.path.join(OUT, 'l1_floor.jpg'), quality=88)
S['vb_run'] = build_sheet('vb_run', 'valera_run.png', 8, 150)
S['vb_story3'] = build_sheet('vb_story3', 'valera_story3.png', 6, 158, ref=1)
with open(os.path.join(ROOT, 'js', 'sprites_data.js'), 'w', encoding='utf-8') as fp:
    fp.write('// автоматически создано tools/build_assets.py\nwindow.SPRITES = ' + json.dumps(S) + ';\nwindow.BGS = ' + json.dumps(B) + ';\nwindow.BUILDINGS = ' + json.dumps(B2) + ';\n')
print('готово 2')

# ================= уровень 3: квартира-глюк =================
S['v3_run'] = build_sheet('v3_run', 'v3_run.png', 8, 84, keyer='strict')
S['v3_act'] = build_sheet('v3_act', 'v3_act.png', 8, 86, ref=0, anchors=['feet'] * 6 + ['center', 'feet'], keyer='strict')
S['v3_melee'] = build_sheet('v3_melee', 'v3_melee.png', 6, 86, ref=1, dil=1, keyer='strict')
S['v4_run'] = build_sheet('v4_run', 'v4_run.png', 8, 84, keyer='clean', anchors=['body'] * 8, even=True)
S['v4_act'] = build_sheet('v4_act', 'v4_act.png', 8, 86, ref=0, keyer='clean', anchors=['body'] * 5 + ['center', 'body', 'body'])
S['v3_up'] = build_sheet('v3_up', 'v3_up.png', 6, 81, ref=1, keyer='pre', strip=range(6))
S['moth'] = build_sheet('moth', 'moth.png', 6, [-66] * 5 + [-60], keyer='magenta', anchors=['center'] * 6)
S['boss4'] = build_sheet('boss4', 'boss2_body.png', 4, 250, ref=0, keyer='magenta')
S['parts4'] = build_sheet('parts4', 'boss2_parts.png', 8, [-150, -150, -150, -120, -150, -70, -50, -60], keyer='magenta', grid=(2, 4), anchors=['center'] * 8)
S['roach'] = build_sheet('roach', 'roach.png', 7, 84, ref=0, anchors=['feet'] * 6 + ['center'])
S['bedbug'] = build_sheet('bedbug', 'bedbug.png', 7, 70, ref=0, anchors=['feet'] * 6 + ['center'])
S['fly'] = build_sheet('fly', 'fly.png', 6, [-64, -64, -64, -64, -60, -64], anchors=['center'] * 6)
S['spider'] = build_sheet('spider', 'spider_misc.png', 7, [-72, -72, -72, -72, -30, -30, -44], anchors=['center'] * 7)
S['items3'] = build_sheet('items3', 'items3.png', 12, [-27, 30, 38, 27, -40, -38, 27, -38, 34, -23, 21, -27], grid=(3, 4), anchors=['center'] * 12, keyer='strict')
S['f_corr'] = build_sheet('f_corr', 'furn_corridor.png', 6, [118, 70, 169, 85, -58, 125], grid=(2, 3))
S['f_kit'] = build_sheet('f_kit', 'furn_kitchen.png', 6, [134, 77, 70, 77, 70, -126], grid=(2, 3))
S['f_liv'] = build_sheet('f_liv', 'furn_living.png', 6, [77, 105, 179, 81, 42, 136], grid=(2, 3))
S['f_bed'] = build_sheet('f_bed', 'furn_bed_balcony.png', 8, [81, 84, 169, 109, 116, 155, 126, 77], grid=(2, 4))
S['boss3'] = build_sheet('boss3', 'boss_body.png', 5, 330, ref=0, keyer='pre')
S['arms3'] = build_sheet('arms3', 'boss_arms.png', 5, [-230, -240, -210, -230, -190], keyer='pre', anchors=['center'] * 5)
S['acid'] = build_sheet('acid', 'acid_puddle.png', 6, [-72] * 6, keyer='pre')
portrait('v3_act.png', 8, 7, (0.08, 0.0, 0.92, 0.46), 'p_valera3')
S['gas'] = build_sheet('gas', 'gas_clouds.png', 12, [-48] * 12, keyer='magenta', grid=(3, 4), anchors=['center'] * 12)
B3 = {}
for n, ff in [('wall_corridor', 0.783), ('wall_kitchen', 0.80), ('wall_living', 0.86), ('wall_bedroom', 0.805), ('wall_balcony', 0.83)]:
    im = Image.open(os.path.join(SRC, n + '.png')).convert('RGB')
    im.save(os.path.join(OUT, n + '.jpg'), quality=86, optimize=True)
    B3[n] = {'img': 'assets/' + n + '.jpg', 'w': im.width, 'h': im.height, 'floor': ff}
for n in ['boss2_bg', 'boss_room', 'boss_read', 'comic1', 'comic2', 'comic3', 'comic4', 'comic5', 'comic6', 'comic7']:
    B[n] = bg(n + '.png', n, (1280, 720))
im = Image.open(os.path.join(SRC, 'boss_read.png')).convert('RGB'); w, h = im.size
im.crop((int(w * 0.56), int(h * 0.12), int(w * 0.78), int(h * 0.12) + int(w * 0.22))).resize((128, 128), Image.LANCZOS).save(os.path.join(SPR, 'p_roach.png'))
with open(os.path.join(ROOT, 'js', 'sprites_data.js'), 'w', encoding='utf-8') as fp:
    fp.write('// автоматически создано tools/build_assets.py\nwindow.SPRITES = ' + json.dumps(S) + ';\nwindow.BGS = ' + json.dumps(B) + ';\nwindow.BUILDINGS = ' + json.dumps(B2) + ';\nwindow.WALLS3 = ' + json.dumps(B3) + ';\n')
print('готово 3')

# ================= уровень 3 v2: масштаб как в уровнях 1-2 =================
def seamless(im, k=110):
    a = np.array(im.convert('RGB')).astype(np.float32); h, w, _ = a.shape
    t = a[:, k:w].copy()
    for i in range(k):
        wgt = i / k
        t[:, w - 2 * k + i] = a[:, w - k + i] * (1 - wgt) + a[:, i] * wgt
    return Image.fromarray(t[:, :w - k].clip(0, 255).astype(np.uint8))
B3 = {}
for key, src in [('wall_corridor', 'w3_corridor'), ('wall_kitchen', 'w4_kitchen'), ('wall_living', 'w2_living'), ('wall_bedroom', 'w2_bedroom'), ('wall_balcony', 'w2_balcony')]:
    im = seamless(Image.open(os.path.join(SRC, src + '.png')))
    im = im.resize((round(im.width * 720 / im.height), 720), Image.LANCZOS)
    im.save(os.path.join(OUT, key + '.jpg'), quality=87, optimize=True)
    B3[key] = {'img': 'assets/' + key + '.jpg', 'w': im.width, 'h': im.height, 'floor': 300 / 360}
S['partition'] = build_sheet('partition', 'partition.png', 1, 282, keyer='clean')
S['boss5'] = build_sheet('boss5', 'boss5_body.png', 6, 230, ref=0, keyer='magenta', even=True)
S['parts5'] = build_sheet('parts5', 'boss5_parts.png', 9, [210, -70, 130, -120, -120, -120, -120, -60, -44], keyer='clean', grid=(3, 3), anchors=['feet', 'center', 'feet'] + ['center'] * 6)
S['boss6'] = build_sheet('boss6', 'boss6_body.png', 6, 172, ref=0, keyer='magenta', even=True)
S['legs6'] = build_sheet('legs6', 'boss6_legs.png', 4, [-70, -84, -70, -84], keyer='clean', anchors=['center'] * 4)
B['boss_read2'] = bg('boss_read2.png', 'boss_read2', (1280, 720))
S['moth2'] = build_sheet('moth2', 'moth_spit.png', 5, [-66, -66, -66, -80, -48], keyer='magenta', grid=(2, [3, 2]), anchors=['center'] * 5)
S['fg'] = build_sheet('fg', 'fg_props.png', 8, [70, 130, 110, 150, 110, 150, 120, 125], keyer='clean', grid=(2, 4))
# стена-переход: кирпичный торец + распахнутая дверь; всё уменьшаем (дверь ~1.45 роста Валеры), верх стены достраиваем тем же торцом
dw = Image.open(os.path.join(SRC, 'door_wall.png'))
da = key_magenta(dw); op = da[..., 3] > 0
cov = op.mean(axis=0); wallx = int(np.where(cov > 0.9)[0].min())
ys = np.where(op.any(axis=1))[0]; da = da[ys[0]:ys[-1] + 1]
H0, W0 = da.shape[:2]; k = 0.74
full = Image.fromarray(da, 'RGBA'); fk = full.resize((round(W0 * k), round(H0 * k)), Image.LANCZOS)
comp = Image.new('RGBA', (fk.width, H0), (0, 0, 0, 0))
top = H0 - fk.height; sx = round(wallx * k)
strip = fk.crop((sx, 0, fk.width, fk.height))
y = top
while y > 0:
    y -= strip.height
    comp.alpha_composite(strip, (sx, max(0, y)) if y >= 0 else (sx, 0), (0, 0 if y >= 0 else -y) if False else (0, 0))
    if y < 0:
        part = strip.crop((0, -y, strip.width, strip.height)); comp.alpha_composite(part, (sx, 0))
comp.alpha_composite(fk, (0, top))
comp = comp.resize((round(comp.width * 720 / comp.height), 720), Image.LANCZOS)
ca = np.array(comp); ca[..., 3] = np.where(ca[..., 3] > 100, 255, 0); comp = Image.fromarray(ca, 'RGBA')
comp.save(os.path.join(SPR, 'doorwall.png')); wallx = sx
S['doorwall'] = {'img': 'assets/spr/doorwall.png', 'f': [[0, 0, comp.width, comp.height, round((wallx + 0.0) * 720 / H0), comp.height, 0, 0]]}
S['shin7'] = build_sheet('shin7', 'boss6_shin.png', 2, 104, ref=0, keyer='clean')
S['v4_up'] = build_sheet('v4_up', 'v4_up.png', 3, 86, ref=0, keyer='clean', anchors=['body', 'body', 'body'])
S['poster'] = build_sheet('poster', 'poster.png', 1, 70, keyer='clean', anchors=['center'])
S['soup'] = build_sheet('soup', 'soup.png', 4, [-12, -16, -26, -18], keyer='clean', anchors=['center'] * 4)
# ================= уровень 4: «Дикие кошки» =================
S['vova'] = build_sheet('vova', 'vova.png', 8, 86, ref=0, keyer='clean', even=True)
S['l4a'] = build_sheet('l4a', 'foes4a.png', 8, 88, ref=0, keyer='magenta', even=True)
S['l4b'] = build_sheet('l4b', 'foes4b.png', 8, 84, ref=4, keyer='clean', even=True)
S['biker'] = build_sheet('biker', 'biker.png', 8, 130, ref=0, keyer='magenta', even=True)
S['patrons'] = build_sheet('patrons', 'patrons.png', 8, 88, ref=0, keyer='clean', even=True)
for key, src in [('club_lobby', 'club_lobby'), ('club_hall', 'club_hall')]:
    im = seamless(Image.open(os.path.join(SRC, src + '.png')))
    im = im.resize((round(im.width * 720 / im.height), 720), Image.LANCZOS)
    im.save(os.path.join(OUT, key + '.jpg'), quality=87, optimize=True)
    B3[key] = {'img': 'assets/' + key + '.jpg', 'w': im.width, 'h': im.height, 'floor': 300 / 360}
B['shop'] = bg('shop3.png', 'bg_shop', (1280, 720))
im = Image.open(os.path.join(SRC, 'shop3.png')).convert('RGB'); w, h = im.size
im.crop((925, 368, 1035, 478)).resize((128, 128), Image.LANCZOS).save(os.path.join(SPR, 'p_seller.png'))
S['hostess'] = build_sheet('hostess', 'hostess.png', 8, 88, ref=0, keyer='clean', even=True)
for n in ['club_back', 'club_floor', 'biker_bg']:
    B[n] = bg(n + '.png', n, (1280, 720))
S['v5_gun'] = build_sheet('v5_gun', 'v5_gun.png', 8, 86, ref=0, keyer='clean', even=True, anchors=['body'] * 8)
S['l4fx'] = build_sheet('l4fx', 'l4fx.png', 8, [-30, -30, -24, -22, -22, -40, -80, 40], keyer='clean', grid=(2, 4), anchors=['center'] * 7 + ['feet'])
for key in ['club_vip']:
    im = seamless(Image.open(os.path.join(SRC, key + '.png')))
    im = im.resize((round(im.width * 720 / im.height), 720), Image.LANCZOS)
    im.save(os.path.join(OUT, key + '.jpg'), quality=87, optimize=True)
    B3[key] = {'img': 'assets/' + key + '.jpg', 'w': im.width, 'h': im.height, 'floor': 300 / 360}
B['club_room'] = bg('club_room.png', 'club_room', (1280, 720))
for n in ['comic4_darts', 'comic4_end']:
    B[n] = bg(n + '.png', n, (1280, 720))
# ---- уровень 4, переделка: мебель, охрана, движения Валеры, кабаре, люк, пилон ----
S['cprops'] = build_sheet('cprops', 'club_props.png', 8, [150, 70, 80, 70, -250, 58, 52, 78], keyer='clean', grid=(2, 4))
S['bouncers'] = build_sheet('bouncers', 'bouncers.png', 8, 104, ref=0, keyer='clean', even=True)
S['v6'] = build_sheet('v6', 'v6_moves.png', 8, 86, ref=4, keyer='clean', even=True, anchors=['feet'] * 4 + ['body'] * 4)
S['cabaret'] = build_sheet('cabaret', 'cabaret.png', 4, 160, ref=0, keyer='clean', even=True)
S['hatch'] = build_sheet('hatch', 'hatch.png', 6, [-26, -26, -26, -26, -64, -64], keyer='magenta', grid=(2, 3), anchors=['center'] * 6)
_fc = Image.open(os.path.join(SRC, 'foes4c.png')); _fc.crop((0, 0, 2085, _fc.height)).save(os.path.join(SRC, 'foes4c_crop.png'))
S['l4c'] = build_sheet('l4c', 'foes4c_crop.png', 8, 84, ref=0, keyer='clean', even=True)
_fc.crop((2090, 475, 2156, 540)).save(os.path.join(SRC, 'gumball_src.png'))
S['gumball'] = build_sheet('gumball', 'gumball_src.png', 1, [-12], keyer='clean', anchors=['center'])
S['pole'] = build_sheet('pole', 'poledance.png', 9, [150, 150, 150, 150, 150, 150, 190, 190, 34], keyer='clean', grid=(2, [6, 3]), anchors=['feet'] * 6 + ['center'] * 3)
# стена-переход клуба: кожаная дверь + торец; уменьшаем целиком, верх достраиваем торцом
dw = Image.open(os.path.join(SRC, 'club_doorwall.png'))
da = key_pre(dw); op = da[..., 3] > 0
cov = op.mean(axis=0); wallx = int(np.where(cov > 0.85)[0].min())
ys = np.where(op.any(axis=1))[0]; da = da[ys[0]:ys[-1] + 1]
H0, W0 = da.shape[:2]; k = 0.8
full = Image.fromarray(da.astype(np.uint8), 'RGBA'); fk = full.resize((round(W0 * k), round(H0 * k)), Image.LANCZOS)
comp = Image.new('RGBA', (fk.width, H0), (0, 0, 0, 0)); top = H0 - fk.height; sx = round(wallx * k)
strip = fk.crop((sx, 0, fk.width, fk.height // 3)); y = top
while y > 0:
    y -= strip.height
    if y >= 0: comp.alpha_composite(strip, (sx, y))
    else: comp.alpha_composite(strip.crop((0, -y, strip.width, strip.height)), (sx, 0))
comp.alpha_composite(fk, (0, top))
comp = comp.resize((round(comp.width * 720 / comp.height), 720), Image.LANCZOS)
ca = np.array(comp); ca[..., 3] = np.where(ca[..., 3] > 100, 255, 0); Image.fromarray(ca, 'RGBA').save(os.path.join(SPR, 'cdoorwall.png'))
S['cdoorwall'] = {'img': 'assets/spr/cdoorwall.png', 'f': [[0, 0, comp.width, comp.height, round(sx * 720 / H0), comp.height, 0, 0]]}
# портрет «глаза из люка»
_h = S['hatch']['f'][4]; _hi = Image.open(os.path.join(SPR, 'hatch.png')).convert('RGBA').crop((_h[0], _h[1], _h[0] + _h[2], _h[1] + _h[3]))
_hi.resize((128, 128), Image.LANCZOS).save(os.path.join(SPR, 'p_hatch.png'))
# ---- Валера в полицейской фуражке (уровень 4) ----
S['v7_run'] = build_sheet('v7_run', 'v7_run.png', 8, 86, ref=0, keyer='strict', even=True, anchors=['body'] * 8)
S['v7_act'] = build_sheet('v7_act', 'v7_act.png', 8, 88, ref=0, keyer='strict', even=True, anchors=['body'] * 5 + ['center', 'body', 'body'])
S['v7_mv'] = build_sheet('v7_mv', 'v7_moves.png', 8, 88, ref=4, keyer='clean', even=True, anchors=['feet'] * 4 + ['body'] * 4)
S['v7_cap'] = build_sheet('v7_cap', 'v7_cap.png', 8, 88, ref=5, keyer='strict', even=True, anchors=['body'] * 8)
# ---- уровень 4: туалет, закрытый зал, мужчины, ботаники, стена чёрной комнаты, эффекты босса ----
def doorwall(src, name, k=0.8, keyer=key_pre):
    da = keyer(Image.open(os.path.join(SRC, src))); op = da[..., 3] > 0
    ys = np.where(op.any(axis=1))[0]; da = da[ys[0]:ys[-1] + 1]; op = op[ys[0]:ys[-1] + 1]
    cov = op.mean(axis=0); wallx = int(np.where(cov > 0.85)[0].min())
    H0, W0 = da.shape[:2]
    full = Image.fromarray(da.astype(np.uint8), 'RGBA'); fk = full.resize((round(W0 * k), round(H0 * k)), Image.LANCZOS)
    comp = Image.new('RGBA', (fk.width, H0), (0, 0, 0, 0)); top = H0 - fk.height; sx = round(wallx * k)
    strip = fk.crop((sx, 0, fk.width, fk.height // 3)); y = top
    while y > 0:
        y -= strip.height
        if y >= 0: comp.alpha_composite(strip, (sx, y))
        else: comp.alpha_composite(strip.crop((0, -y, strip.width, strip.height)), (sx, 0))
    comp.alpha_composite(fk, (0, top))
    comp = comp.resize((round(comp.width * 720 / comp.height), 720), Image.LANCZOS)
    ca = np.array(comp); ca[..., 3] = np.where(ca[..., 3] > 100, 255, 0); Image.fromarray(ca, 'RGBA').save(os.path.join(SPR, name + '.png'))
    S[name] = {'img': 'assets/spr/' + name + '.png', 'f': [[0, 0, comp.width, comp.height, round(sx * 720 / H0), comp.height, 0, 0]]}
doorwall('dark_doorwall.png', 'ddoorwall', 0.8, key_magenta)
B['club_wc'] = bg('club_wc.png', 'club_wc', (1280, 720))
S['stalls'] = build_sheet('stalls', 'stalls.png', 8, [110, 110, 110, 110, 110, 110, 110, 104], keyer='magenta', grid=(2, 4))
S['men'] = build_sheet('men', 'men.png', 8, 90, ref=0, keyer='clean', even=True)
S['menact'] = build_sheet('menact', 'men_act.png', 8, 90, ref=0, keyer='clean', grid=(2, 4))
S['nerds'] = build_sheet('nerds', 'nerds.png', 8, [-120] * 8, keyer='clean', grid=(2, 4))
S['l4fx2'] = build_sheet('l4fx2', 'l4fx2.png', 6, [-56, -56, -56, -40, 132, 124], keyer='magenta', grid=(2, 3), anchors=['center'] * 4 + ['feet'] * 2)
im = seamless(Image.open(os.path.join(SRC, 'club_leather.png'))); im = im.resize((round(im.width * 720 / im.height), 720), Image.LANCZOS)
im.save(os.path.join(OUT, 'club_leather.jpg'), quality=87, optimize=True)
B3['club_leather'] = {'img': 'assets/club_leather.jpg', 'w': im.width, 'h': im.height, 'floor': 300 / 360}
S['zomba'] = build_sheet('zomba', 'zomb_a.png', 8, 92, ref=0, keyer='magenta', even=True)
S['zombb'] = build_sheet('zombb', 'zomb_b.png', 8, [92, -120, 92, -140, 92, 70, 92, -140], keyer='magenta', grid=(2, 4))
S['v8_gun'] = build_sheet('v8_gun', 'v8_gun.png', 8, 86, ref=0, keyer='clean', even=True, anchors=['body'] * 8)
# ---- уровень 4, партия 4 ----
S['v8_run'] = build_sheet('v8_run', 'v8_run.png', 8, 84, keyer='clean', anchors=['body'] * 8, even=True)
S['v7_idle'] = build_sheet('v7_idle', 'v7_idle.png', 8, 88, ref=7, keyer='clean', even=True, anchors=['body'] * 8)
S['icons4'] = build_sheet('icons4', 'icons4.png', 4, [-22] * 4, keyer='magenta', anchors=['center'] * 4)
S['dancers'] = build_sheet('dancers', 'dancers.png', 8, 90, ref=0, keyer='clean', grid=(2, 4))
S['panim'] = build_sheet('panim', 'propsanim.png', 8, [-230, -170, -170, -150] * 2, keyer='clean', grid=(2, 4))
S['girls2'] = build_sheet('girls2', 'girls2.png', 8, 88, ref=0, keyer='clean', even=True)
S['cab2'] = build_sheet('cab2', 'cabaret2.png', 6, 96, ref=0, keyer='clean', even=True)
S['stalls2'] = build_sheet('stalls2', 'stalls2.png', 6, [196, 196, 196, 196, 196, 180], keyer='magenta', even=True)
S['couple'] = build_sheet('couple', 'couple.png', 8, 90, ref=0, keyer='magenta', even=True)
S['fg2'] = build_sheet('fg2', 'fg2.png', 8, [70, 150, 150, 120, 150, 170, 150, 110], keyer='magenta', grid=(2, 4))
for n in ['club_back2', 'club_wc2', 'hotel_floor2']:
    B[n] = bg(n + '.png', n, (1280, 720))
_r = Image.open(os.path.join(SRC, 'rooms4.png')).convert('RGBA'); _a = np.array(_r)[..., 3] > 0
from scipy import ndimage as _nd
_lab, _n = _nd.label(_a); _objs = sorted(_nd.find_objects(_lab), key=lambda o: (o[0].start // 200, o[1].start))
_big = [o for o in _objs if (o[0].stop - o[0].start) > 200][:4]
for _k, o in enumerate(_big):
    _x0, _y0, _x1, _y1 = o[1].start, o[0].start, o[1].stop, o[0].stop
    _pw, _ph = _x1 - _x0, _y1 - _y0; _x0 += int(_pw * 0.02); _x1 -= int(_pw * 0.02); _y0 += int(_ph * 0.03); _y1 -= int(_ph * 0.03)
    _w, _h = _x1 - _x0, _y1 - _y0
    if _w / _h > 16 / 9: _nw = int(_h * 16 / 9); _x0 += (_w - _nw) // 2; _x1 = _x0 + _nw
    else: _nh = int(_w * 9 / 16); _y0 += (_h - _nh) // 2; _y1 = _y0 + _nh
    _r.crop((_x0, _y0, _x1, _y1)).convert('RGB').resize((1280, 720), Image.LANCZOS).save(os.path.join(OUT, 'room%d.jpg' % _k), quality=87)
S['spin'] = build_sheet('spin', 'spin.png', 6, 92, ref=0, keyer='magenta', dil=8)
S['vovagun'] = build_sheet('vovagun', 'vova_gun.png', 6, 86, ref=0, keyer='magenta', even=True)
S['v9_gun'] = build_sheet('v9_gun', 'v9_gun.png', 8, 86, ref=0, keyer='clean', even=True, anchors=['body'] * 8)
B['comic4_raid'] = bg('comic4_raid.png', 'comic4_raid', (1280, 720))
im = seamless(Image.open(os.path.join(SRC, 'club_dark.png'))); im = im.resize((round(im.width * 720 / im.height), 720), Image.LANCZOS)
im.save(os.path.join(OUT, 'club_dark.jpg'), quality=87, optimize=True)
B3['club_dark'] = {'img': 'assets/club_dark.jpg', 'w': im.width, 'h': im.height, 'floor': 300 / 360}
S['brain'] = build_sheet('brain', 'brain.png', 4, [-20] * 4, keyer='clean', anchors=['center'] * 4)
# лучи прожекторов: ровный конус, цвет взят из нарисованного луча, прозрачность растёт книзу, без круга
def cone(name, rgb, w=190, h=330):
    a = np.zeros((h, w, 4), np.uint8)
    for y in range(h):
        k = y / (h - 1); half = 3 + (w / 2 - 3) * k
        alpha = 150 * (1 - k) ** 1.4
        x0, x1 = int(w / 2 - half), int(w / 2 + half)
        xs = np.arange(max(0, x0), min(w, x1))
        edge = np.clip(np.minimum(xs - x0, x1 - xs) / 6.0, 0, 1)
        a[y, xs, :3] = rgb; a[y, xs, 3] = (alpha * edge).astype(np.uint8)
    Image.fromarray(a, 'RGBA').save(os.path.join(SPR, name + '.png'))
_pl = np.array(Image.open(os.path.join(SPR, 'pole.png')).convert('RGBA')).astype(int)
for _i, _n in [(6, 'cone_m'), (7, 'cone_c')]:
    _f = S['pole']['f'][_i]; _p = _pl[_f[1]:_f[1] + _f[3], _f[0]:_f[0] + _f[2]]; _m = _p[..., 3] > 120
    cone(_n, tuple(int(v) for v in np.median(_p[_m][:, :3], axis=0)))
S['zharness'] = build_sheet('zharness', 'zharness.png', 8, [88, 88, 92, -110, 70, 80, 96, -130], keyer='clean', even=True, anchors=['center'] * 4 + ['feet'] * 4)
S['v10_gun'] = build_sheet('v10_gun', 'v10_gun.png', 8, 86, ref=0, keyer='clean', even=True, anchors=['body'] * 8)
S['v11_gun'] = build_sheet('v11_gun', 'v11_gun.png', 8, 86, ref=0, keyer='clean', even=True, anchors=['body'] * 8)
S['cabstage'] = build_sheet('cabstage', 'cabstage.png', 4, [-260] * 4, keyer='magenta', even=True)
S['vovagun2'] = build_sheet('vovagun2', 'vova_gun2.png', 6, 86, ref=0, keyer='magenta', even=True)
S['uiicons'] = build_sheet('uiicons', 'uiicons.png', 6, [-18] * 6, keyer='clean', anchors=['center'] * 6)
B['club_back3'] = bg('club_dress2.png', 'club_back3', (1280, 720))
for key in ['club_hall_z', 'club_leather_z', 'club_lobby_z']:
    im = seamless(Image.open(os.path.join(SRC, key + '.png'))); im = im.resize((round(im.width * 720 / im.height), 720), Image.LANCZOS)
    im.save(os.path.join(OUT, key + '.jpg'), quality=87, optimize=True)
    B3[key] = {'img': 'assets/' + key + '.jpg', 'w': im.width, 'h': im.height, 'floor': 300 / 360}
cone('cone_g', (90, 255, 70))
S['v12_run'] = build_sheet('v12_run', 'v12_run.png', 8, 84, keyer='cleanr', anchors=['body'] * 8, even=True)
S['v12_runs'] = build_sheet('v12_runs', 'v12_runs.png', 8, 84, keyer='cleanr', anchors=['body'] * 8, even=True)
S['v12_fist'] = build_sheet('v12_fist', 'v12_fist.png', 8, 88, ref=0, keyer='strict', even=True, anchors=['body'] * 5 + ['center', 'body', 'body'])
S['walk4'] = build_sheet('walk4', 'walk4.png', 8, 88, ref=0, keyer='cleanr', even=True)
doorwall('exitwall_street_n.png', 'swall', 1.0, key_pre_red)
doorwall('exitwall_iron_m.png', 'iwall', 1.0, key_pre_red)
S['carry'] = build_sheet('carry', 'carry.png', 4, 96, keyer='magenta', even=True)
S['lprops'] = build_sheet('lprops', 'lprops.png', 8, [40, 48, 120, 100, 42, 94, 44, 80], keyer='magenta', even=True)
S['zombc'] = build_sheet('zombc', 'zomb_c.png', 8, 94, ref=7, keyer='cleanr', even=True)
S['zombd'] = build_sheet('zombd', 'zomb_d.png', 8, 92, ref=7, keyer='cleanr', even=True)
# номера отеля: сетки 2x2 с тёмными промежутками -> отдельные фоны 16:9
def room_grid(src, first):
    im = Image.open(os.path.join(SRC, src)).convert('RGB'); a = np.array(im).astype(np.float32).mean(axis=2); h, w = a.shape
    cx = int(w * 0.4) + int(np.argmin(a[:, int(w * 0.4):int(w * 0.6)].mean(axis=0))); cy = int(h * 0.4) + int(np.argmin(a[int(h * 0.4):int(h * 0.6)].mean(axis=1)))
    for k, (x0, y0, x1, y1) in enumerate([(0, 0, cx, cy), (cx, 0, w, cy), (0, cy, cx, h), (cx, cy, w, h)]):
        sub = a[y0:y1, x0:x1]; cols = np.where(sub.mean(axis=0) > 28)[0]; rows = np.where(sub.mean(axis=1) > 28)[0]
        X0, X1, Y0, Y1 = x0 + cols[0], x0 + cols[-1], y0 + rows[0], y0 + rows[-1]
        pw, ph = X1 - X0, Y1 - Y0; X0 += int(pw * 0.012); X1 -= int(pw * 0.012); Y0 += int(ph * 0.015); Y1 -= int(ph * 0.015)
        ww, hh = X1 - X0, Y1 - Y0
        if ww / hh > 16 / 9: nw = int(hh * 16 / 9); X0 += (ww - nw) // 2; X1 = X0 + nw
        else: nh = int(ww * 9 / 16); Y0 += (hh - nh); Y1 = Y0 + nh
        im.crop((X0, Y0, X1, Y1)).resize((1280, 720), Image.LANCZOS).save(os.path.join(OUT, 'room%d.jpg' % (first + k)), quality=88)
room_grid('rooms4b.png', 4); room_grid('rooms4c.png', 8)
Image.open(os.path.join(SRC, 'room5_fix.png')).convert('RGB').resize((1280, 720), Image.LANCZOS).save(os.path.join(OUT, 'room5.jpg'), quality=88)  # велосипед не у двери
S['nerds2'] = build_sheet('nerds2', 'nerds2.png', 10, [-120] * 10, keyer='magenta', grid=(2, 5))
for _k, _src in ((1, 'hotel_f1b.png'), (2, 'hotel_f2b.png'), (3, 'hotel_f3.png')): B['hotel_f%d' % _k] = bg(_src, 'hotel_f%d' % _k, (1280, 720))
S['mwalk'] = build_sheet('mwalk', 'menwalk.png', 12, 90, ref=0, keyer='cleanr', grid=(3, 4))
S['cmdrope'] = build_sheet('cmdrope', 'cmd_rope.png', 4, 118, keyer='magenta', even=True)
S['statue'] = build_sheet('statue', 'statue.png', 2, 140, ref=0, keyer='magenta', even=True)
S['v13_cap'] = build_sheet('v13_cap', 'v13_cap.png', 6, 88, ref=5, keyer='magenta', even=True, anchors=['body'] * 6)
S['maidgum'] = build_sheet('maidgum', 'maidgum.png', 6, 88, ref=0, keyer='cleanr', even=True)
S['maidw'] = build_sheet('maidw', 'maidwalk.png', 8, 88, ref=0, keyer='cleanr', even=True)
S['stall3'] = build_sheet('stall3', 'stall3.png', 5, [173, 173, 173, 173, 160], keyer='cyan', even=True)
S['v14_stomp'] = build_sheet('v14_stomp', 'v14_stomp.png', 8, 88, ref=0, keyer='cleanr', even=True, anchors=['body'] * 8)
S['v14_punch'] = build_sheet('v14_punch', 'v14_punch.png', 6, 88, ref=0, keyer='cleanr', even=True, anchors=['body'] * 4 + ['center', 'body'])
S['v14_swat'] = build_sheet('v14_swat', 'v14_swat.png', 6, 88, ref=1, keyer='cleanr', even=True, anchors=['body'] * 5 + ['center'])
S['v15_gs'] = build_sheet('v15_gs', 'v15_gunstomp.png', 8, 86, ref=0, keyer='magenta', even=True, anchors=['body'] * 8)
S['v16_runs'] = build_sheet('v16_runs', 'v16_runs.png', 8, 84, keyer='magenta', anchors=['body'] * 8, even=True)
S['v16_stomp'] = build_sheet('v16_stomp', 'v16_stomp.png', 4, 88, ref=0, keyer='cleanr', even=True, anchors=['body'] * 4)
S['toilets'] = build_sheet('toilets', 'toilets.png', 4, 50, ref=0, keyer='cyan', even=True)
S['vovagun3'] = build_sheet('vovagun3', 'vova_gun3.png', 6, 86, ref=0, keyer='cleanr', even=True)
B['club_wc3'] = bg('club_wc_open.png', 'club_wc3', (1280, 720))
# портреты персонажей уровня 4 (лица из листов)
def pcrop(sheet, fi, box, name, flip=False):
    f = S[sheet]['f'][fi]
    im = Image.open(os.path.join(SPR, sheet + '.png')).convert('RGBA').crop((f[0], f[1], f[0] + f[2], f[1] + f[3]))
    w, h = im.size
    p = im.crop((int(box[0] * w), int(box[1] * h), int(box[2] * w), int(box[3] * h)))
    if flip: p = p.transpose(Image.FLIP_LEFT_RIGHT)
    p.resize((128, 128), Image.LANCZOS).save(os.path.join(SPR, name + '.png'))
pcrop('v7_act', 0, (0.16, 0.0, 0.84, 0.4), 'p_valera4')
pcrop('hostess', 0, (0.12, 0.0, 0.88, 0.38), 'p_maid', True)
pcrop('hostess', 4, (0.12, 0.0, 0.88, 0.36), 'p_nurse', True)
pcrop('vova', 0, (0.14, 0.0, 0.86, 0.36), 'p_vova')
pcrop('biker', 0, (0.18, 0.0, 0.86, 0.3), 'p_biker', True)
with open(os.path.join(ROOT, 'js', 'sprites_data.js'), 'w', encoding='utf-8') as fp:
    fp.write('// автоматически создано tools/build_assets.py\nwindow.SPRITES = ' + json.dumps(S) + ';\nwindow.BGS = ' + json.dumps(B) + ';\nwindow.BUILDINGS = ' + json.dumps(B2) + ';\nwindow.WALLS3 = ' + json.dumps(B3) + ';\n')
print('готово 4')
