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
    big = {i + 1 for i, sz in enumerate(sizes) if sz > 400}
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
    a = key_green(im) if keyer == 'green' else key_green_strict(im) if keyer == 'strict' else key_black(im) if keyer == 'black' else key_magenta(im) if keyer == 'magenta' else key_pre(im) if keyer == 'clean' else np.array(im.convert('RGBA'))
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
S['items3'] = build_sheet('items3', 'items3.png', 12, [-27, 30, 38, 27, -40, -38, 27, -38, 34, -23, 21, -27], grid=(3, 4), anchors=['center'] * 12)
S['f_corr'] = build_sheet('f_corr', 'furn_corridor.png', 6, [144, 70, 169, 85, -88, 125], grid=(2, 3))
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
for key, src in [('wall_corridor', 'w3_corridor'), ('wall_kitchen', 'w2_kitchen'), ('wall_living', 'w2_living'), ('wall_bedroom', 'w2_bedroom'), ('wall_balcony', 'w2_balcony')]:
    im = seamless(Image.open(os.path.join(SRC, src + '.png')))
    im = im.resize((round(im.width * 720 / im.height), 720), Image.LANCZOS)
    im.save(os.path.join(OUT, key + '.jpg'), quality=87, optimize=True)
    B3[key] = {'img': 'assets/' + key + '.jpg', 'w': im.width, 'h': im.height, 'floor': 300 / 360}
S['partition'] = build_sheet('partition', 'partition.png', 1, 282, keyer='clean')
S['boss5'] = build_sheet('boss5', 'boss5_body.png', 6, 230, ref=0, keyer='magenta', even=True)
S['parts5'] = build_sheet('parts5', 'boss5_parts.png', 9, [210, -70, 130, -120, -120, -120, -120, -60, -44], keyer='clean', grid=(3, 3), anchors=['feet', 'center', 'feet'] + ['center'] * 6)
with open(os.path.join(ROOT, 'js', 'sprites_data.js'), 'w', encoding='utf-8') as fp:
    fp.write('// автоматически создано tools/build_assets.py\nwindow.SPRITES = ' + json.dumps(S) + ';\nwindow.BGS = ' + json.dumps(B) + ';\nwindow.BUILDINGS = ' + json.dumps(B2) + ';\nwindow.WALLS3 = ' + json.dumps(B3) + ';\n')
print('готово 4')
