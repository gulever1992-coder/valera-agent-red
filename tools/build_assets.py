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

def build_sheet(name, src, n, target, ref=0, keyer='green', grid=None, anchors=None, pad=2, strip=()):
    im = Image.open(os.path.join(SRC, src))
    a = key_green(im) if keyer == 'green' else key_black(im) if keyer == 'black' else np.array(im.convert('RGBA'))
    fr = frames_grid(a, *grid) if grid else frames_row(a, n)
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
for i in range(1, 9):
    if os.path.exists(os.path.join(SRC, 'l2_bg%d.png' % i)): B['l2_%d' % i] = bg('l2_bg%d.png' % i, 'bg_l2_%d' % i, (1280, 720))
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
    Image.fromarray(arr, 'RGBA').save(os.path.join(BDIR, name + '.png'), optimize=True)
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
S['vb_run'] = build_sheet('vb_run', 'valera_run.png', 8, 150)
S['vb_story3'] = build_sheet('vb_story3', 'valera_story3.png', 6, 158, ref=1)
with open(os.path.join(ROOT, 'js', 'sprites_data.js'), 'w', encoding='utf-8') as fp:
    fp.write('// автоматически создано tools/build_assets.py\nwindow.SPRITES = ' + json.dumps(S) + ';\nwindow.BGS = ' + json.dumps(B) + ';\nwindow.BUILDINGS = ' + json.dumps(B2) + ';\n')
print('готово 2')
