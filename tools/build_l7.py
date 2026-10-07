# Сборка ассетов уровня 7 «ЗАВОДОУПРАВЛЕНИЕ» из art_src/l7 (Google Flow, Nano Banana Pro).
# Запуск: py tools/build_l7.py [--debug]   (--debug: превью листов с номерами кадров в art_src/l7/_dbg)
import json, os, re, sys
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'build_assets.py'), encoding='utf-8').read()
exec(compile(src[:src.index('\nS = {}')], 'build_assets_helpers', 'exec'))  # key_green, anchor, ndimage, SCALE ...

L7SRC = os.path.join(SRC, 'l7')
L7OUT = os.path.join(OUT, 'l7')
os.makedirs(L7OUT, exist_ok=True)
DBG = os.path.join(L7SRC, '_dbg')
DEBUG = '--debug' in sys.argv
if DEBUG: os.makedirs(DBG, exist_ok=True)
DATA = os.path.join(ROOT, 'js', 'sprites_data.js')
txt = open(DATA, encoding='utf-8').read()
G = {}
for name, body in re.findall(r'window\.(\w+) = (\{.*?\});\n', txt + '\n', re.S):
    G[name] = json.loads(body)
S = G.setdefault('SPRITES', {})
have = lambda f: os.path.exists(os.path.join(L7SRC, f))


def figures(fn, minpx=600, dil=2, rowgap=0.45, crop=None, lines=False):
    """кей зелёного + нарезка по фигурам; порядок — ряды сверху вниз, в ряду слева направо"""
    im = Image.open(os.path.join(L7SRC, fn)).convert('RGB')
    if crop: im = im.crop(crop)
    if lines:   # чёрные линии сетки -> фон
        b = np.array(im); dk = b.max(axis=2) < 60
        b[:, dk.mean(axis=0) > 0.55] = (0, 255, 0); b[dk.mean(axis=1) > 0.55, :] = (0, 255, 0); im = Image.fromarray(b)
    a = np.array(key_green(im)).astype(np.uint8)
    al = a[..., 3] > 0
    lab, k = ndimage.label(ndimage.binary_dilation(al, iterations=dil))
    sls = ndimage.find_objects(lab)
    items = []
    for i, sl in enumerate(sls):
        m = (lab[sl] == i + 1) & al[sl]
        if m.sum() < minpx: continue
        sub = a[sl].copy(); sub[..., 3] = np.where(m, sub[..., 3], 0)
        items.append((sl[0].start, sl[0].stop, sl[1].start, sub))
    # ряды: группируем по перекрытию по вертикали
    items.sort(key=lambda t: (t[0] + t[1]) / 2)
    rows = []
    for it in items:
        cy = (it[0] + it[1]) / 2
        if rows:
            r = rows[-1]; top = min(x[0] for x in r); bot = max(x[1] for x in r)
            if top <= cy <= bot or abs(cy - (top + bot) / 2) < (bot - top) * rowgap: r.append(it); continue
        rows.append([it])
    out = []
    for r in rows: out += [t[3] for t in sorted(r, key=lambda t: t[2])]
    if DEBUG:
        W = sum(f.shape[1] + 8 for f in out[:12]); n = len(out)
        sheet = Image.new('RGB', (min(2400, max(400, W)), 220 * ((n + 11) // 12)), (40, 40, 40)); d = ImageDraw.Draw(sheet)
        x = y = 0
        for i, f in enumerate(out):
            p = Image.fromarray(f, 'RGBA'); p.thumbnail((190, 190))
            if x + p.width > sheet.width: x = 0; y += 220
            sheet.paste(p, (x, y + 20), p); d.text((x + 2, y + 2), str(i), fill=(255, 255, 0)); x += max(p.width, 30) + 8
        sheet.save(os.path.join(DBG, fn.rsplit('.', 1)[0] + '.png'))
    print(fn, len(out), 'фигур')
    return out


def strip_lines(f):
    """тонкие тёмные линии (рамки сетки, трубы у кадров лазания) + мелкие островки"""
    a = f.copy(); al = a[..., 3] > 0
    lum = a[..., 0] * 0.3 + a[..., 1] * 0.59 + a[..., 2] * 0.11
    lab, n = ndimage.label(al & (lum < 70), structure=np.ones((3, 3)))
    for i, sl in enumerate(ndimage.find_objects(lab)):
        h = sl[0].stop - sl[0].start; w = sl[1].stop - sl[1].start
        if (w <= 4 and h >= 18 and h >= 5 * w) or (h <= 4 and w >= 18 and w >= 5 * h):
            a[..., 3] = np.where(lab == i + 1, 0, a[..., 3])
    al = a[..., 3] > 0
    ys, xs = np.where(al)
    return a[ys.min():ys.max() + 1, xs.min():xs.max() + 1] if len(ys) else f


def defringe(arr, it=2):
    a = arr.astype(np.int32)
    for _ in range(it):
        tr = a[..., 3] == 0; edge = ndimage.binary_dilation(tr) & ~tr
        bad = (a[..., 1] - a[..., 0] > 35) & (a[..., 1] - a[..., 2] > 35) & (a[..., 1] > 120)
        a[..., 3] = np.where(edge & bad, 0, a[..., 3])
    tr = a[..., 3] == 0; edge = ndimage.binary_dilation(tr, iterations=2) & ~tr
    a[..., 1] = np.where(edge, np.minimum(a[..., 1], np.maximum(a[..., 0], a[..., 2]) + 10), a[..., 1])
    return a.astype(np.uint8)


def pack(name, fr, target, ref=0, anchors=None, pad=2, strip=True):
    """target: число (высота ref-кадра в лог. px, общий масштаб листа) или список (у каждого кадра: >0 высота, <0 ширина)"""
    if strip: fr = [strip_lines(f) for f in fr]
    if isinstance(target, (int, float)):
        k = target * SCALE / fr[ref].shape[0]; ks = [k] * len(fr)
    else:
        ks = [t * SCALE / f.shape[0] if t > 0 else (-t) * SCALE / f.shape[1] for f, t in zip(fr, target)]
    imgs, meta = [], []
    for i, (f, k) in enumerate(zip(fr, ks)):
        p = Image.fromarray(f, 'RGBA')
        p = p.resize((max(1, round(p.width * k)), max(1, round(p.height * k))), Image.LANCZOS)
        arr = np.array(p).astype(np.int32); arr[..., 3] = np.where(arr[..., 3] > 90, 255, 0)
        arr = defringe(arr.astype(np.uint8))
        ax, ay = anchor(arr, anchors[i] if anchors else 'feet')
        al = arr[..., 3] > 0
        ys = np.where(al.any(axis=1))[0]; top = ys[0] if len(ys) else 0
        xs = np.where(al[top:top + max(3, int(arr.shape[0] * 0.07))].any(axis=0))[0]
        imgs.append(Image.fromarray(arr, 'RGBA')); meta.append([ax, ay, (xs[0] + xs[-1]) / 2 if len(xs) else arr.shape[1] / 2, top])
    W = sum(i.width + pad for i in imgs); Hh = max(i.height for i in imgs)
    atlas = Image.new('RGBA', (W, Hh), (0, 0, 0, 0)); x = 0; frames = []
    for im2, (ax, ay, hx, hy) in zip(imgs, meta):
        atlas.paste(im2, (x, 0)); frames.append([int(x), 0, int(im2.width), int(im2.height), round(float(ax), 1), round(float(ay), 1), round(float(hx), 1), int(hy)]); x += im2.width + pad
    atlas.save(os.path.join(SPR, name + '.png'), optimize=True)
    print('  ->', name, len(frames), 'кадров', atlas.size)
    S[name] = {'img': 'assets/spr/' + name + '.png', 'f': frames}


def sheet(name, fn, target, ref=0, pick=None, anchors=None, **kw):
    if not have(fn): print('НЕТ', fn); return
    fr = figures(fn, **kw)
    if pick is not None: fr = [fr[i] for i in pick]
    if isinstance(target, list) and len(target) != len(fr): print('!!', name, 'кадров', len(fr), 'а размеров', len(target)); return
    pack(name, fr, target, ref, anchors)


def scrub(im, boxes):
    """убрать реальные символы (эмблемы): пиксели в рамке (все или только золотые) заменить интерполяцией по строке"""
    a = np.array(im).astype(np.float32)
    for (x0, y0, x1, y1, gold_only) in boxes:
        x0, x1 = x0 - 6, x1 + 6   # поля по краям — опорные пиксели для интерполяции
        sub = a[y0:y1, x0:x1]; r, g, b = sub[..., 0], sub[..., 1], sub[..., 2]
        m = ((r > 120) & (g > 80) & (r - b > 50) & (g - b > 25)) if gold_only else np.ones(r.shape, bool)
        m = ndimage.binary_dilation(m, iterations=2); m[:, :6] = False; m[:, -6:] = False
        for y in range(sub.shape[0]):
            row = m[y]
            if not row.any(): continue
            xs = np.where(~row)[0]
            if len(xs) < 2: continue
            for ch in range(3): sub[y, row, ch] = np.interp(np.where(row)[0], xs, sub[y, xs, ch])
        a[y0:y1, x0:x1] = sub
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


def bg(fn, out, crop_bottom=0, boxes=None):
    if not have(fn): print('НЕТ', fn); return
    im = Image.open(os.path.join(L7SRC, fn)).convert('RGB')
    if boxes: im = scrub(im, boxes)
    if crop_bottom: im = im.crop((0, 0, im.width, im.height - crop_bottom))
    im.resize((1280, 720), Image.LANCZOS).save(os.path.join(L7OUT, out), quality=88)
    print('фон', out)


# ---------------- фоны ----------------
for fn, out in [('bg_plaza_0.jpg', 'plaza.jpg'), ('bg_parking2_1.jpg', 'parking.jpg'), ('bg_wall_0.jpg', 'wall1.jpg'), ('bg_wall_1.jpg', 'wall1b.jpg'),
                ('bg_yard_0.jpg', 'yard.jpg'), ('bg_sewer_1.jpg', 'sewer.jpg'), ('bg_corr_0.jpg', 'corr.jpg'), ('bg_corr_1.jpg', 'corr2.jpg'),
                ('bg_van_0.jpg', 'van_in.jpg'), ('bg_road_0.jpg', 'road.jpg'), ('bg_road_1.jpg', 'road2.jpg')]:
    bg(fn, out)
bg('bg_hall_1.jpg', 'hall.jpg', boxes=[(976, 0, 1080, 70, False), (1012, 94, 1078, 152, False), (978, 86, 1110, 165, True)])   # без серпа и молота на занавесе и медальоне

# ---------------- персонажи и предметы (индексы кадров — см. --debug) ----------------
SHEETS = json.load(open(os.path.join(HERE, 'l7_sheets.json'), encoding='utf-8')) if os.path.exists(os.path.join(HERE, 'l7_sheets.json')) else {}
for name, o in SHEETS.items():
    sheet(name, o['src'], o['target'], o.get('ref', 0), o.get('pick'), o.get('anchors'), **o.get('kw', {}))

# ---------------- портреты 128x128 (из образцов pick_*: крупный портрет слева) ----------------
def portrait(fn, box, name):
    if not have(fn): return
    im = Image.open(os.path.join(L7SRC, fn)).convert('RGB').crop(box)
    a = np.array(key_green(im)).astype(np.uint8); bgc = Image.new('RGBA', im.size, (26, 28, 36, 255))
    bgc.alpha_composite(Image.fromarray(a, 'RGBA')); bgc.convert('RGB').resize((128, 128), Image.LANCZOS).save(os.path.join(SPR, 'p_' + name + '.png'))
    print('портрет', name)
for fn, box, name in [('pick_stas.jpg', (60, 0, 620, 560), 'stas'), ('pick_max.jpg', (60, 0, 620, 560), 'maxim'), ('pick_denis_o.jpg', (60, 0, 620, 560), 'deniso'),
                      ('pick_denis_ch.jpg', (60, 0, 620, 560), 'denisch'), ('pick_leather.jpg', (0, 20, 344, 364), 'leather'), ('pick_biker.jpg', (110, 0, 570, 460), 'biker7'),
                      ('pick_cmd.jpg', (0, 20, 344, 364), 'cmd7'), ('pick_cmd.jpg', (688, 20, 1032, 364), 'cmdr7'), ('pick_mrx.jpg', (0, 20, 344, 364), 'mrx')]:
    portrait(fn, box, name)
# карточка уровня в меню выбора — площадь у заводоуправления
if os.path.exists(os.path.join(L7OUT, 'plaza.jpg')): Image.open(os.path.join(L7OUT, 'plaza.jpg')).save(os.path.join(OUT, 'l7_card.jpg'), quality=88)
if have('pick_mrx.jpg'): Image.open(os.path.join(L7SRC, 'pick_mrx.jpg')).convert('RGB').crop((344, 0, 688, 384)).save(os.path.join(L7OUT, 'mrx_box.jpg'), quality=90)

with open(DATA, 'w', encoding='utf-8') as fp:
    fp.write('// автоматически создано tools/build_assets.py\n' + ''.join('window.%s = %s;\n' % (k, json.dumps(v)) for k, v in G.items()))
print('листов в SPRITES:', len(S))
