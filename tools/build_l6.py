# Сборка ассетов уровня 6 «ГРИБНОЙ ДОЖДЬ» из art_src/l6/*.png (Nano Banana Pro, Google Flow).
# Запуск: py tools/build_l6.py   — берёт только то, что есть; остальные атласы в sprites_data.js не трогает.
import json, os, re
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'build_assets.py'), encoding='utf-8').read()
exec(compile(src[:src.index('\nS = {}')], 'build_assets_helpers', 'exec'))  # build_sheet, key_*, segment ...

L6SRC = os.path.join(SRC, 'l6')
L6OUT = os.path.join(OUT, 'l6')
os.makedirs(L6OUT, exist_ok=True)
TMP = os.path.join(L6SRC, '_clean')
os.makedirs(TMP, exist_ok=True)
DATA = os.path.join(ROOT, 'js', 'sprites_data.js')
txt = open(DATA, encoding='utf-8').read()
G = {}
for name, body in re.findall(r'window\.(\w+) = (\{.*?\});\n', txt + '\n', re.S):
    G[name] = json.loads(body)
S = G.setdefault('SPRITES', {})
have = lambda f: os.path.exists(os.path.join(L6SRC, f))


def prep(fn, bg=(0, 255, 0)):
    """убрать чёрные линии сетки (Flow рисует разделители) -> чистый файл"""
    a = np.array(Image.open(os.path.join(L6SRC, fn)).convert('RGB'))
    dark = a.max(axis=2) < 50
    cols = np.where(dark.mean(axis=0) > 0.5)[0]
    rows = np.where(dark.mean(axis=1) > 0.5)[0]
    for c in cols: a[:, max(0, c - 2):c + 3] = bg
    for r in rows: a[max(0, r - 2):r + 3, :] = bg
    out = os.path.join(TMP, fn)
    Image.fromarray(a).save(out)
    return out


def sheet(name, fn, n, target, **kw):
    if not have(fn): return
    if kw.pop('lines', False): path = prep(fn)
    else: path = os.path.join(L6SRC, fn)
    S[name] = build_sheet(name, path, n, target, **kw)



def seps(dark, axis, thr=0.88):
    """позиции чёрных линий-разделителей (центры) вдоль оси"""
    v = dark.mean(axis=axis)
    idx = np.where(v > thr)[0]
    groups = []
    for i in idx:
        if groups and i - groups[-1][-1] <= 1: groups[-1].append(i)
        else: groups.append([i])
    return [g for g in groups if len(g) <= 8]


def cells(fn, keyer, rows, cols):
    """нарезка сетки с чёрными линиями на ячейки; возвращает список RGBA-массивов (по рядам)"""
    im = Image.open(os.path.join(L6SRC, fn)).convert('RGB')
    a = np.array(im)
    dark = a.max(axis=2) < 55
    cs = [g for g in seps(dark, 0)]; rs = [g for g in seps(dark, 1)]
    xb = [0] + [int((g[0] + g[-1]) / 2) for g in cs] + [a.shape[1]]
    yb = [0] + [int((g[0] + g[-1]) / 2) for g in rs] + [a.shape[0]]
    if len(xb) - 1 != cols or len(yb) - 1 != rows:
        # равномерная сетка, если линии не нашлись
        xb = [round(i * a.shape[1] / cols) for i in range(cols + 1)]; yb = [round(i * a.shape[0] / rows) for i in range(rows + 1)]
    out = []
    for r in range(rows):
        for c in range(cols):
            cell = im.crop((xb[c] + 4, yb[r] + 4, xb[c + 1] - 4, yb[r + 1] - 4))
            f = keyer(cell)
            f = only_largest(f) if False else f
            al = f[..., 3] > 0
            ys = np.where(al.any(axis=1))[0]; xs = np.where(al.any(axis=0))[0]
            out.append(f[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1])
    return out


def strip_lines(f, crop=True):
    """убирает отдельные тонкие тёмные линии (остатки сетки листа) и обрезает пустые поля"""
    a = f.copy(); al = a[..., 3] > 0
    lum = a[..., 0] * 0.3 + a[..., 1] * 0.59 + a[..., 2] * 0.11
    dark = al & (lum < 60)
    lab, n = ndimage.label(dark, structure=np.ones((3, 3)))
    for i, sl in enumerate(ndimage.find_objects(lab)):
        h = sl[0].stop - sl[0].start; w = sl[1].stop - sl[1].start
        if (w <= 4 and h >= 18 and h >= 5 * w) or (h <= 4 and w >= 18 and w >= 5 * h):
            a[..., 3] = np.where(lab == i + 1, 0, a[..., 3])
    # убрать оставшиеся мелкие островки (<12 px) вне основного тела
    al = a[..., 3] > 0
    l2, n2 = ndimage.label(al, structure=np.ones((3, 3)))
    if n2 > 1:
        sizes = ndimage.sum(al, l2, range(1, n2 + 1)); keep = np.isin(l2, [i + 1 for i, z in enumerate(sizes) if z >= 12])
        a[..., 3] = np.where(keep, a[..., 3], 0); al = a[..., 3] > 0
    ys, xs = np.where(al)
    if not crop: return a
    return a[ys.min():ys.max() + 1, xs.min():xs.max() + 1] if len(ys) else f


def pack(name, fr, target, ref=0, anchors=None, pad=2):
    fr = [strip_lines(f) for f in fr]
    if isinstance(target, (int, float)):
        k = target * SCALE / fr[ref].shape[0]; ks = [k] * len(fr)
    else:
        ks = [t * SCALE / f.shape[0] if t > 0 else (-t) * SCALE / f.shape[1] for f, t in zip(fr, target)]
    imgs, meta = [], []
    for i, (f, k) in enumerate(zip(fr, ks)):
        pim = Image.fromarray(f, 'RGBA')
        pim = pim.resize((max(1, round(pim.width * k)), max(1, round(pim.height * k))), Image.LANCZOS)
        arr = np.array(pim).astype(np.int32); arr[..., 3] = np.where(arr[..., 3] > 90, 255, 0)
        if name in ('deco6', 'plat6', 'items6', 'v6_tap'):   # сиреневая/розовая кайма от кейинга по пурпуру
            for _ in range(4):
                tr = arr[..., 3] == 0
                near = ndimage.binary_dilation(tr, iterations=1) & ~tr
                pk = near & (arr[..., 0] - arr[..., 1] > 5) & (arr[..., 2] - arr[..., 1] > 5)
                arr[..., 3] = np.where(pk, 0, arr[..., 3])
            pk2 = (arr[..., 3] > 0) & (arr[..., 2] - arr[..., 1] > 14) & (arr[..., 0] - arr[..., 1] > 8) & (arr[..., 2] > arr[..., 0] * 0.8)
            arr[..., 3] = np.where(pk2, 0, arr[..., 3])
        arr = arr.astype(np.uint8)
        ax, ay = anchor(arr, anchors[i] if anchors else 'feet')
        al = arr[..., 3] > 0
        ys = np.where(al.any(axis=1))[0]; top = ys[0]
        xs = np.where(al[top:top + max(3, int(arr.shape[0] * 0.07))].any(axis=0))[0]
        imgs.append(Image.fromarray(arr, 'RGBA')); meta.append([ax, ay, (xs[0] + xs[-1]) / 2, top])
    W = sum(i.width + pad for i in imgs); Hh = max(i.height for i in imgs)
    atlas = Image.new('RGBA', (W, Hh), (0, 0, 0, 0)); x = 0; frames = []
    for im2, (ax, ay, hx, hy) in zip(imgs, meta):
        atlas.paste(im2, (x, 0)); frames.append([int(x), 0, int(im2.width), int(im2.height), round(float(ax), 1), round(float(ay), 1), round(float(hx), 1), int(hy)]); x += im2.width + pad
    atlas.save(os.path.join(SPR, name + '.png'), optimize=True)
    print(name, len(frames), 'frames', atlas.size)
    return {'img': 'assets/spr/' + name + '.png', 'f': frames}


def csheet(name, fn, rows, cols, target, keyer=key_green, ref=0, anchors=None):
    if not have(fn): return
    S[name] = pack(name, cells(fn, keyer, rows, cols), target, ref, anchors)



def prep2(fn, bg=(0, 255, 0), morph=False):
    """убрать тонкие длинные тёмные линии сетки (компоненты), не трогая спрайты"""
    a = np.array(Image.open(os.path.join(L6SRC, fn)).convert('RGB'))
    dark = a.max(axis=2) < 100
    lab, n = ndimage.label(dark)
    for i, sl in enumerate(ndimage.find_objects(lab)):
        h = sl[0].stop - sl[0].start; w = sl[1].stop - sl[1].start
        if min(h, w) <= 8 and max(h, w) >= 45:
            m = ndimage.binary_dilation(lab[sl] == i + 1, iterations=2)
            reg = a[sl]; reg[m] = bg
    dark = a.max(axis=2) < 100
    if morph:
        v = ndimage.binary_opening(dark, structure=np.ones((70, 1)))
        h = ndimage.binary_opening(dark, structure=np.ones((1, 70)))
        m = ndimage.binary_dilation(v | h, iterations=3)
        a[m & (a.max(axis=2) < 140)] = bg
    for c in np.where(dark.mean(axis=0) > 0.88)[0]: a[:, max(0, c - 2):c + 3] = bg
    for r in np.where(dark.mean(axis=1) > 0.88)[0]: a[max(0, r - 2):r + 3, :] = bg
    out = os.path.join(TMP, fn)
    Image.fromarray(a).save(out)
    return out


def sheet2(name, fn, grid, target, morph=False, **kw):
    """лист с сеткой: чистим линии, режем по содержимому; grid=(строки, колонок) или (None, [счётчики по рядам])"""
    if not have(fn): return
    path = prep2(fn, morph=morph)
    if isinstance(grid[1], list):
        n = sum(grid[1])
        S[name] = build_sheet(name, path, n, target, grid=(len(grid[1]), grid[1]), **kw)
    else:
        S[name] = build_sheet(name, path, grid[0] * grid[1], target, grid=grid, **kw)


# ---------- Валера, поцарапанный и грязный ----------
sheet('v6_run', 'v6_run.png', 8, 78, ref=0, grid=(2, 4))
sheet('v6_jump', 'v6_jump.png', 6, [80, 80, 80, 80, 58, 80], ref=0, grid=(2, 3))
sheet('v6_fight', 'v6_fight.png', 6, 79, ref=1, grid=(2, 3), anchors=['feet'] * 5 + ['center'], strip=(3, 4))
# ---------- враги ----------
sheet('yeti', 'yeti.png', 8, 104, ref=1, grid=(2, 4), anchors=['feet'] * 7 + ['center'])
sheet('amanita', 'amanita.png', 8, 84, ref=1, grid=(2, 4), anchors=['feet'] * 7 + ['center'])
sheet('beaver', 'beaver.png', 8, 50, ref=0, grid=(2, 4), anchors=['feet'] * 6 + ['feet', 'center'])
sheet('crow', 'crow.png', 8, 30, ref=0, grid=(2, 4), anchors=['center'] * 8)
sheet('mowgli', 'mowgli.png', 8, 60, ref=0, grid=(2, 4), anchors=['feet'] * 3 + ['center', 'feet', 'feet', 'feet', 'center'])
sheet('rose', 'rose.png', 8, 66, ref=0, grid=(2, 4), keyer='strict', anchors=['feet'] * 8)
sheet('nettle', 'nettle.png', 8, 84, ref=1, grid=(2, 4), keyer='strict', anchors=['feet'] * 7 + ['center'])
# ---------- босс и Вова ----------
sheet('boss6', 'boss6_a.png', 8, 90, ref=1, grid=(2, 4), anchors=['feet'] * 4 + ['feet', 'feet', 'feet', 'center'], strip=(4,))
csheet('vova6', 'vova6.png', 2, 4, 86, anchors=['feet'] * 8)
# ---------- предметы / эффекты ----------
csheet('items6', 'items6.png', 4, 4, [-66, -66, -36, -28, -28, -52, -34, -42] + [-42] * 8, anchors=['center'] * 16)
sheet('spells6', 'spells.png', 8, [-46] * 8, grid=(4, 2), keyer='strict', anchors=['center'] * 8)
csheet('fx6', 'fx6.png', 2, 4, [-92, -70, -48, -48, -26, -60, -56, -24], anchors=['center'] * 8)
csheet('deco6', 'props_deco.png', 2, 4, [-60, -56, -44, -54, -46, -42, -50, 110], keyer=key_magenta, anchors=['feet'] * 8)
def rect_pack(name, fn, rects, targets, keyer=key_magenta, anchors=None):
    if not have(fn): return
    im = Image.open(os.path.join(L6SRC, fn)).convert('RGB')
    fr = [only_largest(keyer(im.crop(r))) for r in rects]
    S[name] = pack(name, fr, targets, 0, anchors or ['feet'] * len(fr))


rect_pack('plat6', 'props_plat.png', [(0, 30, 720, 300), (690, 20, 990, 190), (1010, 40, 1376, 180), (715, 215, 1070, 365), (1085, 190, 1376, 370), (15, 385, 390, 575), (395, 400, 920, 555), (940, 400, 1376, 555), (20, 625, 480, 730), (520, 625, 900, 730), (950, 550, 1376, 730)],
          [-230, -110, -150, -140, -92, -124, -200, -140, -160, -120, -150])


# ======== расширенная анимация (покадровая, v2) ========
# Валера: колдовство палочкой и поедание гриба / питон
sheet2('v6_wand', 'v_wand.png', (2, 6), 80, ref=0, anchors=['feet'] * 12)
sheet2('v6_eat', 'v_eat.png', (2, 6), 80, ref=0, anchors=['feet'] * 12)
# Ванделорд: 6 листов по 12 кадров
sheet2('b_loco', 'b_loco.png', (2, 6), 90, ref=0, anchors=['feet'] * 12)
sheet2('b_evade', 'b_evade.png', (2, 6), 90, ref=0, anchors=['feet'] * 12)
sheet2('b_cast', 'b_cast.png', (2, 6), 90, ref=0, anchors=['feet'] * 12)
sheet2('b_py', 'b_python.png', (2, 6), 90, ref=0, anchors=['feet'] * 4 + ['center'] * 4 + ['feet'] * 4)
sheet2('b_taunt', 'b_taunt.png', (2, 6), 90, ref=0, anchors=['feet'] * 12)
sheet2('b_hurt', 'b_hurt.png', (2, 6), 90, ref=0, anchors=['feet'] * 12)
# враги: ходьба и атаки
def rects_sheet(name, fn, rows, target, ref=0, anchors=None):
    if not have(fn): return
    im = Image.open(prep2(fn, morph=True)).convert('RGB')
    fr = []
    for (y0, y1), xs in rows:
        for a0, a1 in zip(xs[:-1], xs[1:]):
            f = key_green(im.crop((a0 + 6, y0 + 6, a1 - 6, y1 - 6)))
            f = only_largest(f)
            fr.append(f)
    S[name] = pack(name, fr, target, ref, anchors)


rects_sheet('yeti2', 'yeti2.png', [((0, 255), [0, 230, 458, 688, 918, 1146, 1376]), ((255, 515), [0, 262, 540, 825, 1105, 1376]), ((515, 768), [0, 262, 540, 805, 1035, 1376])], 104, anchors=['feet'] * 16)
sheet2('amanita2', 'amanita2.png', (2, 6), 84, ref=0, anchors=['feet'] * 12)
sheet2('beaver2', 'beaver2.png', (None, [6, 4, 3]), 50, ref=0, anchors=['feet'] * 13)
sheet2('crow2', 'crow2.png', (2, 6), 30, ref=0, anchors=['center'] * 12)
sheet2('mowgli2', 'mowgli2.png', (2, 6), 60, ref=0, anchors=['feet'] * 12)
sheet2('rose2', 'rose2.png', (3, 6), 66, ref=0, keyer='strict', anchors=['feet'] * 18)
sheet2('nettle2', 'nettle2.png', (2, 6), 84, ref=0, keyer='strict', anchors=['feet'] * 12)
sheet2('proj6', 'proj6.png', (2, 4), [-24, -20, -22, -22, -40, -60, -30, -26], ref=0, keyer='strict', anchors=['center'] * 8)
# эффекты превращений и ритуала
sheet2('gibs6', 'gibs.png', (2, 4), [-34, -34, -34, -40, -40, -44, -54, -34], ref=0, anchors=['center'] * 8)
sheet2('morph6', 'transform.png', (2, 4), [-30, -34, -30, -80, -50, -40, -34, -26], ref=0, keyer='strict', anchors=['feet'] * 8)
sheet2('vfx6', 'vfx12.png', (2, 6), [-110] * 6 + [-22, -30, -40, -70, -50, -70], ref=0, anchors=['center'] * 6 + ['feet'] * 4 + ['center'] * 2)


# ---------- слои фона (бесшовно по горизонтали) ----------
def key_magenta_hue(im):
    """розово-пурпурный фон И розовые лучи света -> прозрачно (по оттенку, по всему кадру)"""
    a = np.array(im.convert('RGBA')).astype(np.int32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    bg = (r - g > 42) & (b - g > 42) & (np.abs(r - b) < 120)
    a[..., 3] = np.where(bg, 0, 255)
    for _ in range(2):
        tr = a[..., 3] == 0
        near = ndimage.binary_dilation(tr, iterations=1) & ~tr
        pink = near & (a[..., 0] - a[..., 1] > 22) & (a[..., 2] - a[..., 1] > 22)
        a[..., 3] = np.where(pink, 0, a[..., 3])
    return a.astype(np.uint8)


def seamless_x(im, frac=0.18):
    a = np.array(im).astype(np.float32)
    h, w = a.shape[:2]
    ro = np.roll(a, w // 2, axis=1)
    x = np.arange(w)
    d = np.minimum(np.abs(x - w / 2), w / 2)
    wgt = np.clip(1 - np.abs(x - w / 2) / (w * frac), 0, 1)[None, :, None]  # 1 в центре шва после сдвига
    wgt = 1 - wgt
    return Image.fromarray((a * wgt + ro * (1 - wgt)).clip(0, 255).astype(np.uint8))


def layer(fn, outname, height, bottom_crop=True, keyer=key_magenta_hue, mirror=False):
    """слой на пурпуре -> RGBA PNG: обрезать по содержимому сверху, высота height (логич. px)*2"""
    if not have(fn): return None
    im = Image.open(os.path.join(L6SRC, fn)).convert('RGB')
    a = keyer(im)
    al = a[..., 3] > 0
    ys = np.where(al.any(axis=1))[0]
    top, bot = ys[0], ys[-1] + 1
    # низ: пурпурная полоса снизу уже прозрачна — режем по кадру, не по содержимому
    bot = a.shape[0] if bottom_crop else bot
    sub = a[top:bot]
    pim = Image.fromarray(sub, 'RGBA')
    k = height * SCALE / pim.height
    pim = pim.resize((max(1, round(pim.width * k)), height * SCALE), Image.LANCZOS)
    arr = np.array(pim).astype(np.int32); arr[..., 3] = np.where(arr[..., 3] > 90, 255, 0)
    for _ in range(6):  # срезаем розовую кайму после ресайза
        tr = arr[..., 3] == 0
        near = ndimage.binary_dilation(tr, iterations=1) & ~tr
        pk = near & (arr[..., 0] - arr[..., 1] > 6) & (arr[..., 2] - arr[..., 1] > 6)
        arr[..., 3] = np.where(pk, 0, arr[..., 3])
    arr = arr.astype(np.uint8)
    pim = Image.fromarray(arr, 'RGBA')
    if mirror:  # бесшовность зеркалом
        w = pim.width
        m = Image.new('RGBA', (w * 2, pim.height)); m.paste(pim, (0, 0)); m.paste(pim.transpose(Image.FLIP_LEFT_RIGHT), (w, 0)); pim = m
    pim.save(os.path.join(L6OUT, outname), optimize=True)
    print(outname, pim.size)
    return pim.size


LAY = {}
LAY['city'] = layer('city_far.png', 'city.png', 190, mirror=True)
LAY['far'] = layer('forest_far.png', 'far.png', 190, mirror=True)
LAY['forest'] = layer('forest_mid.png', 'forest.png', 360, mirror=True)
LAY['bog'] = layer('bog_mid.png', 'bog.png', 360, mirror=True)
LAY['dunefar'] = layer('dunes_far.png', 'dunefar.png', 190, mirror=True)
LAY['dunes'] = layer('dunes_mid.png', 'dunes.png', 300, mirror=True)
LAY['fg'] = layer('fg_near.png', 'fg.png', 360, mirror=True)

# небо: один широкий кадр
if have('sky.png'):
    Image.open(os.path.join(L6SRC, 'sky.png')).convert('RGB').resize((1280, 960), Image.LANCZOS).save(os.path.join(L6OUT, 'sky.jpg'), quality=88, optimize=True)
    print('sky OK')

# земля: три полосы (лес / болото / песок)
if have('ground.png'):
    g = Image.open(os.path.join(L6SRC, 'ground.png')).convert('RGB')
    a = np.array(g).astype(int)
    white = (a.min(axis=2) > 235)   # белый и чёрный фон между полосами
    black = (a.max(axis=2) < 25)
    rowfill = 1 - (white | black).mean(axis=1)
    bands, on, y0 = [], False, 0
    for y, v in enumerate(rowfill):
        if v > 0.6 and not on: on, y0 = True, y
        if v <= 0.6 and on:
            on = False
            if y - y0 > 40: bands.append((y0, y))
    if on: bands.append((y0, len(rowfill)))
    print('ground bands', bands)
    names = ['gr_forest', 'gr_bog', 'gr_sand']
    for (y0, y1), nm in zip(bands[:3], names):
        # убираем белую/чёрную каёмку сверху внутри полосы
        band = g.crop((0, y0 + 14, g.width, y1))
        ba = np.array(band).astype(int)
        while band.height > 40 and (ba[0].min(axis=1) > 170).mean() > 0.05: band = band.crop((0, 1, band.width, band.height)); ba = ba[1:]
        band = band.resize((1280, round(band.height * 1280 / band.width)), Image.LANCZOS)
        band = seamless_x(band)
        band.save(os.path.join(L6OUT, nm + '.jpg'), quality=90, optimize=True)
        print(nm, band.size)

# арена босса и комикс с вертолётом
if have('arena.png'):
    Image.open(os.path.join(L6SRC, 'arena.png')).convert('RGB').resize((1280, 720), Image.LANCZOS).save(os.path.join(L6OUT, 'arena.jpg'), quality=88, optimize=True)
    print('arena OK')
if have('heli_comic.png'):
    Image.open(os.path.join(L6SRC, 'heli_comic.png')).convert('RGB').resize((1280, 720), Image.LANCZOS).save(os.path.join(L6OUT, 'heli.jpg'), quality=88, optimize=True)
    print('heli OK')
if have('card.png'):
    Image.open(os.path.join(L6SRC, 'card.png')).convert('RGB').resize((1280, 720), Image.LANCZOS).save(os.path.join(OUT, 'l6_card.jpg'), quality=88, optimize=True)


# ---------- портреты ----------
def pcrop6(sheetname, fi, box, name, flip=False):
    if sheetname not in S: return
    f = S[sheetname]['f'][fi]
    p = Image.open(os.path.join(ROOT, S[sheetname]['img'])).convert('RGBA').crop((f[0], f[1], f[0] + f[2], f[1] + f[3]))
    w, h = p.size
    p = p.crop((int(box[0] * w), int(box[1] * h), int(box[2] * w), int(box[3] * h)))
    if flip: p = p.transpose(Image.FLIP_LEFT_RIGHT)
    s = max(p.size)
    sq = Image.new('RGBA', (s, s), (0, 0, 0, 0)); sq.paste(p, ((s - p.width) // 2, 0))
    sq.resize((128, 128), Image.LANCZOS).save(os.path.join(SPR, name + '.png'))
    print(name, 'OK')


pcrop6('v6_tap', 0, (0.08, 0.0, 0.92, 0.46), 'p_valera6')
pcrop6('boss6', 0, (0.28, 0.0, 0.72, 0.36), 'p_vande')
pcrop6('vova6', 3, (0.12, 0.0, 0.88, 0.4), 'p_vova6')

with open(DATA, 'w', encoding='utf-8') as fp:
    fp.write('// автоматически создано tools/build_assets.py\n' + ''.join('window.%s = %s;\n' % (k, json.dumps(v)) for k, v in G.items()))
json.dump(LAY, open(os.path.join(L6OUT, 'layers.json'), 'w'))
print('готово l6:', [k for k in S if k in ('v6_run', 'v6_jump', 'v6_fight', 'yeti', 'amanita', 'beaver', 'crow', 'mowgli', 'rose', 'nettle', 'boss6', 'vova6', 'items6', 'spells6', 'fx6', 'deco6', 'plat6')])

sheet2('viper', 'viper.png', (2, 4), 20, ref=0, anchors=['feet'] * 8)
# ---- лесной йети-швырятель деревьями (Flow) и дерево-снаряд ----
sheet2('yeti3', 'yeti3.png', (2, 4), 104, ref=0, anchors=['feet'] * 7 + ['feet'])
sheet2('yeti4', 'yeti4.png', (2, 4), 104, ref=0, anchors=['feet'] * 8)   # полный цикл того же бурого йети
sheet2('tree6', 'tree_proj.png', (2, 4), [-92, -92, -92, -92, -70, -70, -70, -70], ref=0, anchors=['center'] * 8)
# ---- новые полнокадровые фоны из Flow (замена слоёв) и объекты переднего плана ----
for _src, _dst in (('bg_forest.png', 'bgf.jpg'), ('bg_bog.png', 'bgb.jpg'), ('bg_dunes.png', 'bgd.jpg')):
    if have(_src):
        _b = Image.open(os.path.join(L6SRC, _src)).convert('RGB')
        if 'dunes' in _src: _b = _b.crop((int(_b.width * 0.128), 0, int(_b.width * 0.852), _b.height))   # по бокам у Flow дубли-панели со швом
        _b = _b.resize((round(_b.width * 720 / _b.height), 720), Image.LANCZOS)
        _m = Image.new('RGB', (_b.width * 2, 720)); _m.paste(_b, (0, 0)); _m.paste(_b.transpose(Image.FLIP_LEFT_RIGHT), (_b.width, 0))
        _m.save(os.path.join(L6OUT, _dst), quality=90, optimize=True); print('фон', _dst)
if have('fg_objs.png'):
    _a = key_magenta_hue(Image.open(os.path.join(L6SRC, 'fg_objs.png')).convert('RGB')).astype(np.int32)
    _m = ndimage.binary_closing(_a[..., 3] > 0, iterations=2); _lab, _n = ndimage.label(_m); _it = []
    for _i, _sl in enumerate(ndimage.find_objects(_lab)):
        if int((_lab[_sl] == _i + 1).sum()) < 3000: continue
        _sub = _a[_sl].copy(); _sub[..., 3] = np.where(_lab[_sl] == _i + 1, _sub[..., 3], 0)
        _cy = (_sl[0].start + _sl[0].stop) / 2 / _a.shape[0]
        _it.append((0 if _cy < 0.5 else 1, _sl[1].start, _sub.astype(np.uint8)))
    _it.sort(key=lambda t: (t[0], t[1])); _fr = [t[2] for t in _it]
    print('fg объектов', len(_fr))
    if have('fg_dunes.png'):
        _a2 = key_magenta_hue(Image.open(os.path.join(L6SRC, 'fg_dunes.png')).convert('RGB')).astype(np.int32)
        _m2 = ndimage.binary_closing(_a2[..., 3] > 0, iterations=9); _l2, _n2 = ndimage.label(_m2); _it2 = []
        for _i, _sl in enumerate(ndimage.find_objects(_l2)):
            if int((_l2[_sl] == _i + 1).sum()) < 3000: continue
            _sub = _a2[_sl].copy(); _sub[..., 3] = np.where(_l2[_sl] == _i + 1, _sub[..., 3], 0)
            _it2.append(((0 if (_sl[0].start + _sl[0].stop) / 2 / _a2.shape[0] < 0.5 else 1), _sl[1].start, _sub.astype(np.uint8)))
        _it2.sort(key=lambda t: (t[0], t[1])); _fr = _fr + [t[2] for t in _it2]
        print('fg дюны', len(_it2))
    if len(_fr) >= 8: S['fg6'] = pack('fg6', _fr, [round(f.shape[0] * 0.5) for f in _fr], 0, ['feet'] * len(_fr))
# ---- idle: Валера топает ногой ----
sheet2('v6_tap', 'v6_tap.png', (2, 4), 80, ref=0, anchors=['feet'] * 8)

# ---- передний план: оставляем только самые тёмные ближние объекты (стволы, ветки, папоротник, трава) ----
_fp = os.path.join(L6OUT, 'fg.png')
if os.path.exists(_fp):
    _a = np.array(Image.open(_fp).convert('RGBA')).astype(np.int32)
    _lum = (_a[..., 0] * 0.3 + _a[..., 1] * 0.59 + _a[..., 2] * 0.11)
    _keep = (_lum < 30) & (_a[..., 3] > 0)
    _tc = ndimage.binary_dilation(_keep.mean(axis=0) > 0.45, iterations=8)   # широкие стволы закрывают героя -> убираем
    _keep &= ~_tc[None, :]
    _keep[int(_keep.shape[0] * 0.38):int(_keep.shape[0] * 0.80)] = False     # середину кадра оставляем свободной
    _keep = ndimage.binary_opening(_keep, iterations=1)
    _lab, _n = ndimage.label(_keep)
    _sz = ndimage.sum(_keep, _lab, range(1, _n + 1))
    _keep = np.isin(_lab, [i + 1 for i, s_ in enumerate(_sz) if s_ > 120])
    _a[..., 3] = np.where(_keep, 255, 0)
    Image.fromarray(_a.astype(np.uint8), 'RGBA').save(_fp, optimize=True)
    print('fg разрежен, доля', round(float(_keep.mean()), 2))

# ---- дюны: деревья на исходнике обрезаны сверху -> мягкое растворение в дымке вместо ровного среза ----
for _n, _h in (('dunes.png', 150), ('dunefar.png', 70)):
    _p = os.path.join(L6OUT, _n)
    if os.path.exists(_p):
        _a = np.array(Image.open(_p).convert('RGBA')).astype(np.float32)
        _ramp = np.clip(np.arange(_a.shape[0]) / _h, 0, 1) ** 1.6
        _a[..., 3] *= _ramp[:, None]
        Image.fromarray(_a.astype(np.uint8), 'RGBA').save(_p, optimize=True)

# ---- обрезать пустой низ у слоёв: тогда низ картинки = низ содержимого, и он стоит на земле ----
for _n in ('city', 'far', 'forest', 'bog', 'dunefar', 'dunes'):
    _p = os.path.join(L6OUT, _n + '.png')
    if os.path.exists(_p):
        _im = Image.open(_p).convert('RGBA'); _al = np.array(_im)[..., 3]
        _rows = np.where((_al > 0).sum(axis=1) > _al.shape[1] * 0.02)[0]
        if len(_rows):
            _im.crop((0, 0, _im.width, int(_rows[-1]) + 1)).save(_p, optimize=True); print('низ', _n, _im.height, '->', int(_rows[-1]) + 1)


# ======== ориентиры (большие цельные объекты как здания в ур.2): lm6 ========
def lm_clean(a, minrun):
    """a — RGBA int32 после кейинга; режет тонкую линию земли на краю силуэта"""
    lum = a[..., 0] * 0.3 + a[..., 1] * 0.59 + a[..., 2] * 0.11
    dk2 = (lum < 75) & (a[..., 3] > 0)
    op_ = a[..., 3] > 0; H_ = op_.shape[0]
    line = np.zeros_like(dk2)
    for y_ in range(H_):
        row = dk2[y_]
        if row.sum() < minrun: continue
        d_ = np.diff(np.concatenate([[0], row.astype(np.int8), [0]]))
        for u_, v_ in zip(np.where(d_ == 1)[0], np.where(d_ == -1)[0]):
            if v_ - u_ < minrun: continue
            below = 1 - op_[min(H_ - 1, y_ + 4), u_:v_].mean(); above = 1 - op_[max(0, y_ - 4), u_:v_].mean()
            if below > 0.5 or above > 0.5: line[y_, u_:v_] = True
    line = ndimage.binary_dilation(line, structure=np.ones((3, 1)))
    a[..., 3] = np.where(line, 0, a[..., 3])
    return a


def lm_frames(fn, rects=None):
    im = Image.open(os.path.join(L6SRC, fn)).convert('RGB')
    out = []
    if rects:
        for r in rects:
            a = lm_clean(key_magenta_hue(im.crop(r)).astype(np.int32), 60)
            m = ndimage.binary_closing(a[..., 3] > 0, iterations=3)
            lab, n = ndimage.label(m)
            if n == 0: continue
            big = 1 + int(np.argmax(ndimage.sum(m, lab, range(1, n + 1))))
            a[..., 3] = np.where(lab == big, a[..., 3], 0)
            ys, xs = np.where(a[..., 3] > 0)
            out.append(a[ys.min():ys.max() + 1, xs.min():xs.max() + 1].astype(np.uint8))
        return out
    a = lm_clean(key_magenta_hue(im).astype(np.int32), 140)
    m = ndimage.binary_closing(a[..., 3] > 0, iterations=3)
    lab, n = ndimage.label(m)
    items = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        ys, xs = sl
        if int((lab[sl] == i + 1).sum()) < 2500 or (ys.stop - ys.start < 100 and xs.stop - xs.start < 100): continue
        sub = a[sl].copy(); sub[..., 3] = np.where(lab[sl] == i + 1, sub[..., 3], 0)
        items.append((xs.start, sub.astype(np.uint8)))
    items.sort(key=lambda t: t[0])
    return [t[1] for t in items]


# лес: объекты слиплись общей линией земли -> режем по прямоугольникам (координаты в px исходника 1200x896)
_FR = [(0, 0, 390, 725), (390, 0, 690, 515), (680, 0, 990, 515), (985, 0, 1376, 515), (320, 520, 780, 725), (860, 540, 1376, 725)]
_LM = []
for _fn in ('lm_forest.png', 'lm_bog.png', 'lm_dunes.png'):
    if have(_fn):
        _fr = lm_frames(_fn, _FR if _fn == 'lm_forest.png' else None); print(_fn, 'объектов', len(_fr), [f.shape[:2] for f in _fr]); _LM.append(_fr)
if len(_LM) == 3:
    _allf = _LM[0] + _LM[1] + _LM[2]
    _tg = [round(f.shape[0] * k) for fr_, k in zip(_LM, (0.37, 0.4, 0.4)) for f in fr_]
    if len(_allf) == len(_tg): S['lm6'] = pack('lm6', _allf, _tg, 0, ['feet'] * len(_allf))
    else: print('!! lm6: ожидали', len(_tg), 'получили', len(_allf))

# ======== высокое дерево-«ворота»: сборка из сегментов Flow (tall_tree.png) ========
def build_tall_tree():
    if not have('tall_tree.png'): return
    im = Image.open(os.path.join(L6SRC, 'tall_tree.png')).convert('RGB')
    keyed = key_magenta_hue(im).astype(np.uint8)
    al = keyed[..., 3] > 0
    lab, n = ndimage.label(ndimage.binary_closing(al, iterations=3))
    comps = {}
    for i, sl in enumerate(ndimage.find_objects(lab)):
        if (lab[sl] == i + 1).sum() < 3000: continue
        comps[(round((sl[0].start + sl[0].stop) / 2 / im.height), sl[1].start)] = (sl, i + 1)
    keys = sorted(comps)   # (ряд, x): ствол, ветка вправо, ветка влево, крона
    if len(keys) != 4: print('!! tall_tree: компонентов', len(keys)); return
    def cut(k):
        sl, idn = comps[k]
        sub = keyed[sl].copy(); sub[..., 3] = np.where(lab[sl] == idn, sub[..., 3], 0)
        return sub
    trunk, brR, brL, crown = [cut(k) for k in keys]
    CAP = 54   # срез ствола (эллипс) сверху/снизу — отрезаем для стыковки
    TW = trunk.shape[1]                      # ширина ствола в px источника
    k2 = 120.0 / TW                           # 2x логики: ствол = 60 логич. px
    def band(a, keepcap=False):
        return a[(0 if keepcap else CAP): a.shape[0] - (0 if keepcap else CAP)]
    bT = band(trunk); bR = band(brR); bL = band(brL)
    # центр ствола по x в каждом сегменте
    cT = trunk.shape[1] / 2
    cR = TW / 2                               # ствол слева, ветка справа
    cL = brL.shape[1] - TW / 2                # ствол справа, ветка слева
    cC = crown.shape[1] / 2
    seq = ['T'] + ['R'] * 7
    segs = {'T': (bT, cT), 'R': (bR, cR)}
    Wsrc = int(max(bR.shape[1] - cR, crown.shape[1] / 2) * 2 + 20)   # симметричный холст
    Hseg = bT.shape[0]
    total = sum(segs[k][0].shape[0] for k in seq) + crown.shape[0]
    canvas = np.zeros((total, Wsrc, 4), np.uint8)
    cx0 = Wsrc / 2
    y = total
    platforms = []   # (dx логич от центра ствола, высота над землёй логич, ширина логич)
    def paste(a, c, ytop):
        x0 = int(round(cx0 - c)); h, w = a.shape[:2]
        reg = canvas[ytop:ytop + h, x0:x0 + w]; m = a[..., 3] > 0; reg[m] = a[m]
    # снизу вверх: нижний сегмент ствола (с нижним срезом оставляем целым, без cap)
    for kind in seq:
        a, c = segs[kind]
        y -= a.shape[0]; paste(a, c, y)
        if kind == 'R':
            mk = a[..., 3] > 0; cols = np.arange(a.shape[1])
            br = mk[:, int(cR + TW / 2 + 6):]                       # колонки правее ствола
            rows = np.where(br.any(axis=1))[0]
            if len(rows):
                ytop_branch = y + int(rows.min()) + 8                   # верхняя кромка ветки (px канваса)
                x_in = int(cR + TW / 2) - int(cR)                       # от центра ствола вправо
                platforms.append([x_in * k2 / 2 + 6, (total - ytop_branch) * k2 / 2, (br.shape[1] * k2 / 2) * 0.8])
    y -= crown.shape[0]; paste(crown, cC, y)
    # верх кроны — опорная площадка (на ~18% высоты кроны ниже макушки)
    crown_top = y + int(crown.shape[0] * 0.22)
    crown_w = crown.shape[1] * k2 / 2 * 0.7
    platforms.append([-crown_w / 2 + 0, (total - crown_top) * k2 / 2, crown_w])
    img = Image.fromarray(canvas, 'RGBA')
    img = img.resize((max(1, round(img.width * k2)), max(1, round(img.height * k2))), Image.LANCZOS)
    arr = np.array(img); arr[..., 3] = np.where(arr[..., 3] > 90, 255, 0)
    img = Image.fromarray(arr, 'RGBA')
    # стена: стек стволов с «срезом» наверху
    wall_n = 6
    wall = np.zeros((trunk.shape[0] + (wall_n - 1) * Hseg + 0, TW, 4), np.uint8)
    yy = wall.shape[0]
    for i in range(wall_n):
        a = trunk if i == wall_n - 1 else bT
        yy -= a.shape[0]; wall[yy:yy + a.shape[0]] = np.where((a[..., 3] > 0)[..., None], a, wall[yy:yy + a.shape[0]])
    wimg = Image.fromarray(wall, 'RGBA').resize((round(TW * k2), round(wall.shape[0] * k2)), Image.LANCZOS)
    wa = np.array(wimg); wa[..., 3] = np.where(wa[..., 3] > 90, 255, 0); wimg = Image.fromarray(wa, 'RGBA')
    for nm, ii in (('tree_tall.png', img), ('wall_tall.png', wimg)): ii.save(os.path.join(ROOT, 'assets', 'spr', nm), optimize=True)
    G['TREE6'] = {'w': img.width / 2, 'h': img.height / 2, 'plats': [[round(p[0], 1), round(p[1], 1), round(p[2], 1)] for p in platforms],
                  'ww': wimg.width / 2, 'wh': wimg.height / 2}
    print('высокое дерево', img.size, 'площадок', len(platforms), 'стена', wimg.size)


def build_gate_trees():
    """два полностью нарисованных дерева из Flow: лазательное (ветки с обеих сторон) и преграждающее"""
    if not (have('tree_climb.png') and have('tree_wall.png')): return False
    def load(fn, logic_h):
        im = Image.open(os.path.join(L6SRC, fn)).convert('RGB')
        a = key_magenta_hue(im).astype(np.uint8)
        m = ndimage.binary_closing(a[..., 3] > 0, iterations=2)
        lab, n = ndimage.label(m); big = 1 + int(np.argmax(ndimage.sum(m, lab, range(1, n + 1))))
        a[..., 3] = np.where(lab == big, a[..., 3], 0)
        ys, xs = np.where(a[..., 3] > 0)
        a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        k = logic_h * 2.0 / a.shape[0]
        return a, k
    # --- лазательное дерево ---
    a, k = load('tree_climb.png', 560)
    al = a[..., 3] > 0; H, Wp = al.shape
    dens = al.mean(axis=0)
    tcols = np.where(dens > 0.75)[0]                       # колонки ствола
    x0, x1 = int(tcols.min()), int(tcols.max()); tc = (x0 + x1) / 2
    plats = []
    for side in (1, -1):
        reg = al[:, x1 + 2:] if side == 1 else al[:, :x0 - 2][:, ::-1]
        rows = reg.any(axis=1)
        lab, n = ndimage.label(rows)
        for i in range(1, n + 1):
            r = np.where(lab == i)[0]
            if len(r) < 10: continue
            ext = int(np.where(reg[r].any(axis=0))[0].max()) + 1
            if ext < 14: continue
            ytop = int(r.min()) + 5
            if ytop < H * 0.08: continue                    # верхушка/крона отдельно
            xa = (x1 + 2 - tc) if side == 1 else -(x0 - 2 - tc) - ext
            if side == 1: xa = (x1 - tc) + 2
            else: xa = -(tc - x0) - ext - 2 + (tc - x0) * 0 + 2
            plats.append([xa * k / 2, (H - ytop) * k / 2, ext * k / 2 * 0.92])
    # крона-верхушка: узкая — площадка на 7% ниже кончика
    ytop = int(H * 0.075); row = np.where(al[ytop + 6])[0]
    plats.append([(row.min() - tc) * k / 2, (H - ytop) * k / 2, (row.max() - row.min()) * k / 2])
    # новая детальная сосна (Flow): ветки размечены вручную по картинке [x слева от центра, высота, ширина]
    L_ = [(-137, 105, 100), (-154, 140, 132), (-102, 185, 80), (-142, 215, 120), (-112, 270, 95), (-117, 330, 100), (-67, 377, 60), (-94, 422, 77), (-82, 467, 75), (-64, 507, 64)]
    R_ = [(23, 130, 115), (23, 167, 132), (23, 212, 122), (13, 270, 125), (13, 345, 102), (13, 408, 90), (13, 447, 75), (13, 485, 60)]
    plats = [[x, h_, w_] for x, h_, w_ in L_ + R_] + [[-42, 530, 95]]
    plats.sort(key=lambda p_: p_[1])
    # симметричный холст относительно центра ствола
    half = int(max(tc, Wp - tc)) + 2
    cv = np.zeros((H, half * 2, 4), np.uint8); sx = half - int(round(tc)); cv[:, sx:sx + Wp] = a
    img = Image.fromarray(cv, 'RGBA').resize((round(cv.shape[1] * k), round(cv.shape[0] * k)), Image.LANCZOS)
    ar = np.array(img); ar[..., 3] = np.where(ar[..., 3] > 90, 255, 0); img = Image.fromarray(ar, 'RGBA')
    gaps = [round(plats[i + 1][1] - plats[i][1]) for i in range(len(plats) - 1)]
    print('лазательное дерево', img.size, 'площадок', len(plats), 'шаги по высоте', [round(p_[1]) for p_ in plats], 'макс. шаг', max(gaps) if gaps else 0)
    # --- преграждающее дерево ---
    b, kb = load('tree_wall.png', 470)
    bl = b[..., 3] > 0; Hb, Wb = bl.shape
    dn = bl.mean(axis=0); tcb = np.where(dn > 0.55)[0]
    bx0, bx1 = int(tcb.min()), int(tcb.max()); bc = (bx0 + bx1) / 2
    # низ кроны: самая нижняя строка, где ширина > 1.6 ширины ствола в верхней половине
    wd = bl.sum(axis=1); crown_bot = int(np.where(wd[: int(Hb * 0.5)] > (bx1 - bx0) * 1.6)[0].max()) if (wd[: int(Hb * 0.5)] > (bx1 - bx0) * 1.6).any() else int(Hb * 0.35)
    ctop = int(Hb * 0.10); crow = np.where(bl[ctop + 8])[0]
    halfb = int(max(bc, Wb - bc)) + 2
    cvb = np.zeros((Hb, halfb * 2, 4), np.uint8); sxb = halfb - int(round(bc)); cvb[:, sxb:sxb + Wb] = b
    imgb = Image.fromarray(cvb, 'RGBA').resize((round(cvb.shape[1] * kb), round(cvb.shape[0] * kb)), Image.LANCZOS)
    arb = np.array(imgb); arb[..., 3] = np.where(arb[..., 3] > 90, 255, 0); imgb = Image.fromarray(arb, 'RGBA')
    for nm, ii in (('tree_tall.png', img), ('wall_tall.png', imgb)): ii.save(os.path.join(ROOT, 'assets', 'spr', nm), optimize=True)
    G['TREE6'] = {'w': img.width / 2, 'h': img.height / 2, 'plats': [[round(p_[0], 1), round(p_[1], 1), round(p_[2], 1)] for p_ in plats],
                  'ww': imgb.width / 2, 'wh': imgb.height / 2,
                  'blockW': round((bx1 - bx0) * kb / 2 * 0.8, 1), 'blockH': round((Hb - crown_bot) * kb / 2, 1),
                  'wallPlat': [round((crow.min() - bc) * kb / 2, 1), round((Hb - ctop) * kb / 2, 1), round((crow.max() - crow.min()) * kb / 2 * 0.9, 1)]}
    print('стена-дерево', imgb.size, 'ствол', G['TREE6']['blockW'], 'x', G['TREE6']['blockH'], 'площадка кроны', G['TREE6']['wallPlat'])
    return True


if not build_gate_trees(): build_tall_tree()


# ---- бобёр: струя вырезается из кадров (рисуется отдельным сплайном в коде) ----
_bp = os.path.join(ROOT, 'assets', 'spr', 'beaver2.png')
if os.path.exists(_bp):
    _bm = np.array(Image.open(_bp).convert('RGBA')).astype(np.int32)
    _bf = S['beaver2']['f']
    for _fi in (10, 11, 12):
        _x, _y, _w, _h = _bf[_fi][:4]
        _sub = _bm[_y:_y + _h, _x:_x + _w]
        _blue = (_sub[..., 2] - _sub[..., 0] > 30) & (_sub[..., 3] > 0)
        _lab, _n = ndimage.label(ndimage.binary_dilation(_blue, iterations=2))
        _blue2 = ndimage.binary_dilation(_blue, iterations=2) & ((_sub[..., 2] - _sub[..., 0] > 12) | (_sub[..., 0] + _sub[..., 1] + _sub[..., 2] > 560))
        _sub[..., 3] = np.where(_blue2, 0, _sub[..., 3])
        _bm[_y:_y + _h, _x:_x + _w] = _sub
    Image.fromarray(_bm.astype(np.uint8), 'RGBA').save(_bp, optimize=True)
    print('струя бобра вырезана')


# ---- финальная чистка всех атласов уровня 6: тонкие тёмные линии сетки и мелкий мусор внутри кадров ----
for _name in list(S.keys()):
    _ap = os.path.join(ROOT, S[_name]['img']) if isinstance(S[_name], dict) and 'img' in S[_name] else None
    if not _ap or not os.path.exists(_ap): continue
    _im = np.array(Image.open(_ap).convert('RGBA'))
    for _f in S[_name]['f']:
        _x, _y, _w, _h = _f[:4]
        _im[_y:_y + _h, _x:_x + _w] = strip_lines(_im[_y:_y + _h, _x:_x + _w], crop=False)
    Image.fromarray(_im, 'RGBA').save(_ap, optimize=True)
print('чистка атласов выполнена')

# ---- финальная запись данных (после всех поздних блоков) ----
with open(DATA, 'w', encoding='utf-8') as fp:
    fp.write('// автоматически создано tools/build_assets.py\n' + ''.join('window.%s = %s;\n' % (k, json.dumps(v)) for k, v in G.items()))

# ---- лесной йети: белый мех -> коричневый (осенний лес, без снега) ----
for _n in ('yeti', 'yeti2'):
    _p = os.path.join(ROOT, 'assets', 'spr', _n + '.png')
    if os.path.exists(_p):
        _a = np.array(Image.open(_p).convert('RGBA')).astype(np.float32)
        _mx = _a[..., :3].max(axis=2); _mn = _a[..., :3].min(axis=2)
        _gray = ((_mx - _mn) < 0.2 * np.maximum(_mx, 1)) | (_mx - _mn < 22) | ((_a[..., 2] >= _a[..., 0]) & (_a[..., 2] - _a[..., 0] < 110) & (_a[..., 1] < _a[..., 2] + 10))
        _t = (_a[..., 0] * 0.3 + _a[..., 1] * 0.59 + _a[..., 2] * 0.11) / 255.0
        _lo = np.array([22, 13, 7.0]); _hi = np.array([200, 122, 72.0])
        _new = _lo[None, None, :] + (_hi - _lo)[None, None, :] * _t[..., None] ** 1.1
        _a[..., :3] = np.where(_gray[..., None] & (_a[..., 3:4] > 0), _new, _a[..., :3])
        Image.fromarray(_a.clip(0, 255).astype(np.uint8), 'RGBA').save(_p, optimize=True)
print('йети перекрашен')

# ---- многослойный фон (Flow): небо отдельно, средний план отдельно (на пурпуре) ----
for _n in ('forest', 'bog', 'dunes'):
    if have('sky_' + _n + '.png'):
        _s = Image.open(os.path.join(L6SRC, 'sky_' + _n + '.png')).convert('RGB').resize((1280, 720), Image.LANCZOS)
        _s.save(os.path.join(L6OUT, 'sky_' + _n + '.jpg'), quality=88, optimize=True); print('небо', _n)
    if have('mg_' + _n + '.png'):
        _im = Image.open(os.path.join(L6SRC, 'mg_' + _n + '.png')).convert('RGB')
        _rgb = np.array(_im).astype(np.int32)
        # нижняя ровная полоса земли: строки с малым разбросом цвета
        _std = _rgb[:, int(_rgb.shape[1] * .2):int(_rgb.shape[1] * .8)].std(axis=1).mean(axis=1)
        _y = _rgb.shape[0] - 1
        while _y > 0 and _std[_y] < 16: _y -= 1
        _cut = min(_rgb.shape[0], _y + 10)
        _a = key_magenta_hue(_im)[:_cut]
        _cx = {'dunes': (.07, .93), 'bog': (.15, .85)}.get(_n)
        if _cx:   # по бокам у Flow дубли-панели: берём только центр
            _a = _a[:, int(_a.shape[1] * _cx[0]):int(_a.shape[1] * _cx[1])]
        _al = _a[..., 3] > 0; _ys = np.where(_al.any(axis=1))[0]; _a = _a[_ys[0]:]
        _H = {'forest': 300, 'bog': 250, 'dunes': 200}[_n]
        _p = Image.fromarray(_a, 'RGBA'); _p = _p.resize((round(_p.width * _H * 2 / _p.height), _H * 2), Image.LANCZOS)
        _arr = np.array(_p).astype(np.int32); _arr[..., 3] = np.where(_arr[..., 3] > 100, 255, 0)
        _p = Image.fromarray(_arr.astype(np.uint8), 'RGBA')
        _m = Image.new('RGBA', (_p.width * 2, _p.height)); _m.paste(_p, (0, 0)); _m.paste(_p.transpose(Image.FLIP_LEFT_RIGHT), (_p.width, 0))
        _m.save(os.path.join(L6OUT, 'mg_' + _n + '.png'), optimize=True); print('средний план', _n, _m.size, 'срез земли y', _y, '/', _rgb.shape[0])

# песчаная полоса земли — в палитру дюн (перенос среднего/разброса цвета с песка дюн)
if have('mg_dunes.png') and os.path.exists(os.path.join(L6OUT, 'gr_sand.jpg')) and have('ground.png'):
    _d = np.array(Image.open(os.path.join(L6OUT, 'dunes.png')).convert('RGBA')).astype(np.float32)   # палитра исходного слоя дюн
    _d = _d[_d[..., 3] > 0][:, :3]; _sand = _d[(_d[:, 0] > 180) & (_d[:, 1] > 160) & (_d[:, 0] - _d[:, 2] > 15)]
    _g = np.array(Image.open(os.path.join(L6OUT, 'gr_sand.jpg')).convert('RGB')).astype(np.float32)
    _mu, _sd = _g.reshape(-1, 3).mean(0), _g.reshape(-1, 3).std(0) + 1
    _g = (_g - _mu) / _sd * (_sand.std(0) * 0.8) + _sand.mean(0) * 0.92
    Image.fromarray(_g.clip(0, 255).astype(np.uint8)).save(os.path.join(L6OUT, 'gr_sand.jpg'), quality=90, optimize=True); print('песок перекрашен', _sand.mean(0))

# ---- питон обвил Валеру (бурый, 5 кадров) и змея из портала (6 кадров) — Flow ----
def rp_green(name, fn, rects, target, ref=0, anchors=None):
    if not have(fn): return
    im = Image.open(os.path.join(L6SRC, fn)).convert('RGB'); fr = []
    for r in rects:
        a = np.array(key_green(im.crop((r[0] + 6, r[1] + 6, r[2] - 6, r[3] - 6)))).astype(np.uint8)
        lab, n = ndimage.label(a[..., 3] > 0)
        if n:
            sz = ndimage.sum(a[..., 3] > 0, lab, range(1, n + 1)); keep = np.isin(lab, [i + 1 for i, v in enumerate(sz) if v >= 60])
            a[..., 3] = np.where(keep, a[..., 3], 0)
        fr.append(a)
    S[name] = pack(name, fr, target, ref, anchors or ['feet'] * len(fr)); print(name, len(fr), 'кадров')
if have('py6.png'):
    rp_green('v6_py', 'py6.png', [(0, 0, 229, 383), (230, 0, 458, 383), (459, 0, 687, 383), (688, 0, 916, 383), (917, 0, 1376, 383)], 80, ref=1)
    rp_green('snk6', 'py6.png', [(x0, 384, x1, 768) for x0, x1 in [(0, 229), (230, 458), (459, 687), (688, 916), (917, 1145), (1146, 1376)]], 64, ref=3)
    with open(DATA, 'w', encoding='utf-8') as fp:
        fp.write('// автоматически создано tools/build_assets.py\n' + ''.join('window.%s = %s;\n' % (k, json.dumps(v)) for k, v in G.items()))
# ---- иконки HUD: кулак, палочка, монета, значок (Flow) ----
if have('hud_icons.png'):
    csheet('hud6', 'hud_icons.png', 1, 4, [22, 24, 18, 18], anchors=['center'] * 4)
    with open(DATA, 'w', encoding='utf-8') as fp:
        fp.write('// автоматически создано tools/build_assets.py\n' + ''.join('window.%s = %s;\n' % (k, json.dumps(v)) for k, v in G.items()))
