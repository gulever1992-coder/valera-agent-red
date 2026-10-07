# Сборка ассетов уровня 7 «СЕВМОЛОТ» (бит-эм-ап по схеме ур.2) из art_src/l7/*.jpg|png (Flow, Nano Banana Pro).
# Запуск: py tools/build_l7.py — берёт только то, что есть.
#  здания  b_<имя>.jpg  -> assets/l7/b/<имя>.png + window.BUILDINGS7 (ширина/высота, верхние кромки для ходьбы)
#  слои    sky7, far7, mid7, ground7, arena7 -> assets/l7/
#  спрайты props7 (4x4), chop7/worker7 (2x4), spz7 (2x4), boss7 (3x4), + персонажи прошлой версии (v7sneak, guard7, dog7, leather7, cars7)
#  комиксы comic_*.jpg, road7, card
import json, os, re
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'build_assets.py'), encoding='utf-8').read()
exec(compile(src[:src.index('\nS = {}')], 'build_assets_helpers', 'exec'))  # key_green, anchor, SCALE, SRC, OUT, SPR, ROOT
from scipy import ndimage

L7SRC = os.path.join(SRC, 'l7')
L7OUT = os.path.join(OUT, 'l7')
BOUT = os.path.join(L7OUT, 'b')
os.makedirs(BOUT, exist_ok=True)
DATA = os.path.join(ROOT, 'js', 'sprites_data.js')
txt = open(DATA, encoding='utf-8').read()
G = {}
for name, body in re.findall(r'window\.(\w+) = (\{.*?\});\n', txt + '\n', re.S):
    G[name] = json.loads(body)
S = G.setdefault('SPRITES', {})
for old in ('props7out', 'props7in'):   # атласы прошлой версии уровня
    S.pop(old, None)
n0 = len(S)
for _f in os.listdir(L7SRC):   # из Flow сохраняем .jpg — приводим к .png
    if _f.lower().endswith(('.jpg', '.jpeg', '.webp')) and not os.path.exists(os.path.join(L7SRC, os.path.splitext(_f)[0] + '.png')):
        Image.open(os.path.join(L7SRC, _f)).convert('RGB').save(os.path.join(L7SRC, os.path.splitext(_f)[0] + '.png'))
have = lambda f: os.path.exists(os.path.join(L7SRC, f))


def keyed(fn, box=None):
    im = Image.open(os.path.join(L7SRC, fn)).convert('RGB')
    if box: im = im.crop(box)
    return np.array(key_green(im)).astype(np.uint8)


def defringe(a, it=2):
    a = a.astype(np.int32)
    for _ in range(it):
        tr = a[..., 3] == 0; edge = ndimage.binary_dilation(tr) & ~tr
        bad = (a[..., 1] - a[..., 0] > 35) & (a[..., 1] - a[..., 2] > 35) & (a[..., 1] > 120)
        a[..., 3] = np.where(edge & bad, 0, a[..., 3])
    tr = a[..., 3] == 0; edge = ndimage.binary_dilation(tr, iterations=2) & ~tr
    a[..., 1] = np.where(edge, np.minimum(a[..., 1], np.maximum(a[..., 0], a[..., 2]) + 10), a[..., 1])
    return a.astype(np.uint8)


def crop_al(f, thr=0):
    al = f[..., 3] > 0; ys = np.where(al.sum(axis=1) > thr)[0]; xs = np.where(al.sum(axis=0) > thr)[0]
    return f[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1] if len(ys) else f


def pack(name, fr, target, ref=0, anchors=None, pad=2):
    """target: число — высота кадра ref в логических px; список — свой у каждого (отрицательное — по ширине)"""
    fr = [crop_al(defringe(f)) for f in fr]
    if isinstance(target, (int, float)): ks = [target * SCALE / fr[ref].shape[0]] * len(fr)
    else: ks = [t * SCALE / f.shape[0] if t > 0 else (-t) * SCALE / f.shape[1] for f, t in zip(fr, target)]
    imgs, meta = [], []
    for i, (f, k) in enumerate(zip(fr, ks)):
        pim = Image.fromarray(f, 'RGBA').resize((max(1, round(f.shape[1] * k)), max(1, round(f.shape[0] * k))), Image.LANCZOS)
        arr = np.array(pim); arr[..., 3] = np.where(arr[..., 3] > 90, 255, 0)
        ax, ay = anchor(arr, anchors[i] if anchors else 'feet')
        al = arr[..., 3] > 0; ys = np.where(al.any(axis=1))[0]; top = ys[0]
        xs = np.where(al[top:top + max(3, int(arr.shape[0] * 0.07))].any(axis=0))[0]
        imgs.append(Image.fromarray(arr, 'RGBA')); meta.append([ax, ay, (xs[0] + xs[-1]) / 2, top])
    Wd = sum(i.width + pad for i in imgs); Hh = max(i.height for i in imgs)
    atlas = Image.new('RGBA', (Wd, Hh), (0, 0, 0, 0)); x = 0; frames = []
    for im2, (ax, ay, hx, hy) in zip(imgs, meta):
        atlas.paste(im2, (x, 0)); frames.append([int(x), 0, int(im2.width), int(im2.height), round(float(ax), 1), round(float(ay), 1), round(float(hx), 1), int(hy)]); x += im2.width + pad
    atlas.save(os.path.join(SPR, name + '.png'), optimize=True)
    print(name, len(frames), 'frames', atlas.size)
    S[name] = {'img': 'assets/spr/' + name + '.png', 'f': frames}


def figs(fn, rows, n_per, dil=6):
    """лист фигур рядами: в каждом ряду n_per крупнейших фигур слева направо"""
    im = Image.open(os.path.join(L7SRC, fn)); fr = []
    for r in range(rows):
        y0, y1 = round(r * im.height / rows), round((r + 1) * im.height / rows)
        a = keyed(fn, (0, y0, im.width, y1)); al = a[..., 3] > 0
        lab, k = ndimage.label(ndimage.binary_dilation(al, iterations=dil))
        sz = ndimage.sum(al, lab, range(1, k + 1)); ids = sorted(range(1, k + 1), key=lambda i: -sz[i - 1])[:n_per]
        sls = ndimage.find_objects(lab); ids.sort(key=lambda i: sls[i - 1][1].start)
        for i in ids:
            sl = sls[i - 1]; sub = a[sl].copy(); sub[..., 3] = np.where(lab[sl] == i, sub[..., 3], 0); fr.append(sub)
    return fr


def objs(fn, minpx=1500, dil=5):
    """все объекты листа, по рядам сверху вниз, в ряду слева направо"""
    a = keyed(fn); al = a[..., 3] > 0; h = a.shape[0]
    lab, k = ndimage.label(ndimage.binary_dilation(al, iterations=dil))
    sz = ndimage.sum(al, lab, range(1, k + 1)); sls = ndimage.find_objects(lab)
    items = [(i + 1, sls[i]) for i in range(k) if sz[i] >= minpx]
    rows = []
    for it in sorted(items, key=lambda t: (t[1][0].start + t[1][0].stop) / 2):
        cy = (it[1][0].start + it[1][0].stop) / 2
        if rows and abs(rows[-1][0] - cy) < h * 0.12: rows[-1][1].append(it)
        else: rows.append([cy, [it]])
    out = []
    for _, r in rows:
        for i, sl in sorted(r, key=lambda t: t[1][1].start):
            sub = a[sl].copy(); sub[..., 3] = np.where(lab[sl] == i, sub[..., 3], 0); out.append(sub)
    return out


def despill(a):
    # зелёный отсвет хромакея на краях и в проёмах (арки): срезаем избыток зелёного
    a = a.astype(np.int32); m = np.maximum(a[..., 0], a[..., 2])
    g = a[..., 1]; bad = (g > m + 18) & (a[..., 3] > 0)
    strong = bad & (g > 150) & (g > m + 70)
    a[..., 3] = np.where(strong, 0, a[..., 3]); a[..., 1] = np.where(bad, m + 8, g)
    return np.clip(a, 0, 255).astype(np.uint8)


hgt = lambda f: crop_al(defringe(f)).shape[0]


def merge(name, parts):
    fr, tg = [], []
    for frs, k in parts:
        for f in frs: fr.append(f); tg.append(hgt(f) * k)
    pack(name, fr, tg)


# ---------- персонажи (листы прошлой версии + новые враги) ----------
if have('v7sneak.png') and have('v7b.png'):
    o, n = figs('v7sneak.png', 3, 4), figs('v7b.png', 3, 4); ko = 84 / hgt(o[4]); kn = ko * hgt(o[11]) / hgt(n[10])
    merge('v7sneak', [(o, ko), (n, kn)])
if have('guard7.png') and have('guard7b.png'):   # 0-3 шаг, 4-11 позы, 12-15 бег, 16-19 тащит
    o, n = figs('guard7.png', 3, 4), figs('guard7b.png', 3, 4); ko = 90 / hgt(o[4]); kn = ko * hgt(o[0]) / hgt(n[0])
    merge('guard7', [(n[:4], kn), (o[4:], ko), (n[4:], kn)])
if have('dog7.png') and have('dog7b.png'):   # 0-3 шаг, 4-7 галоп, 8 лай, 9 рычит, 10-11 нюх, 12 бросок, 13 ест, 14 сидит, 15 спит
    o, n = figs('dog7.png', 3, 4), figs('dog7b.png', 3, 4); ko = 44 / hgt(o[0]); kn = ko * hgt(o[0]) / hgt(n[0])
    merge('dog7', [(n, kn), (o[8:], ko)])
if have('leather7.png'): pack('leather7', figs('leather7.png', 3, 4), 84)
if have('cars7v2.png') and have('van7e.png') and have('bike7.png'):
    _v = objs('cars7v2.png'); _e = objs('van7e.png'); _b = objs('bike7.png', 1500, 1)
    kv = 92 / hgt(_v[0]); kb = 96 / hgt(_b[0])
    merge('cars7', [([_e[0], _v[1]], kv), ([_b[0], _b[2]], kb), ([_e[1]], kv), ([_b[1], _b[3], _b[5]], kb), ([_v[0], _v[2]], kv)])
# враги: 2 ряда x 4 (ряд 1 — шаг, ряд 2 — замах, удар/бросок, боль, нокаут); масштаб по первому кадру
for nm, h in (('chop7', 78), ('worker7', 76)):
    if have(nm + '.png'): pack(nm, figs(nm + '.png', 2, 4), h)
if have('spz7.png') and 'guard7' in S:   # боевые кадры спецназа в масштабе guard7: замах, удар прикладом, боль, нокдаун, присед-прицел, выстрел, замах гранатой, бросок
    pack('spz7', figs('spz7.png', 2, 4), 90)
if have('boss7.png'):   # командир: стоит x2, шаг x2 / замах, удар, пинок, рация / граната, прицел, боль, нокаут
    pack('boss7', figs('boss7.png', 3, 4), 96)
    _f = crop_al(defringe(figs('boss7.png', 3, 4)[0])); _s = min(_f.shape[1], int(_f.shape[0] * 0.42))
    _hd = Image.fromarray(_f[:_s, :_s] if _f.shape[1] <= _s else _f[:_s, (_f.shape[1] - _s) // 2:(_f.shape[1] + _s) // 2], 'RGBA')
    _bg = Image.new('RGBA', _hd.size, (40, 22, 30, 255)); _bg.alpha_composite(_hd); _bg.convert('RGB').resize((128, 128), Image.NEAREST).save(os.path.join(SPR, 'p_boss7.png'))
if have('props7.png'):   # 4x4: скамья, фонарь, урна, бочки, ящики, лимузин, внедорожник, будка, лестница, блоки, поддон, катушка, ель, дерево, ограда, памятник
    p = objs('props7.png', 800)
    if len(p) >= 16:
        pack('props7', p[:16], [40, 150, 34, 56, 64, -150, -140, 110, 120, 50, 40, 44, 170, 190, 60, 150],
             ['feet'] * 16)
    else: print('props7: найдено объектов', len(p))

# ---------- здания (зелёный фон) ----------
B7 = G.get('BUILDINGS7', {})
BUILD = {  # имя: логическая высота, ходить ли по верху
    'stalin1': (520, False), 'stalin2': (620, False), 'stalin3': (470, False), 'garages': (130, True), 'gate': (300, False),
    'containers': (200, True), 'pipes': (210, True), 'factory': (470, False), 'crane': (640, False), 'pier': (240, False),
    'colonnade': (340, False), 'square': (330, False),
}


def profile(arr, k):
    al = arr[..., 3] > 0; h, w = al.shape
    tops = np.array([np.argmax(al[:, x]) if al[:, x].any() else h for x in range(w)])
    segs, x0 = [], 0
    for x in range(1, w + 1):
        if x == w or abs(int(tops[x]) - int(tops[x0])) > 6:
            if x - x0 >= 24 and tops[x0] < h: y = int(np.median(tops[x0:x])); segs.append([round(x0 * k, 1), round(x * k, 1), round((h - y) * k, 1)])
            x0 = x
    return segs


# низ исходника, ниже которого — отражение в лужах (обрезаем; px исходника)
CUT = {'stalin2': 1245, 'stalin3': 650, 'garages': 472, 'gate': 615, 'pipes': 630, 'factory': 562, 'crane': 1240, 'pier': 560, 'colonnade': 615}
for name, (th, walk) in BUILD.items():
    fn = 'b_' + name + '.png'
    if not have(fn): continue
    _im = Image.open(os.path.join(L7SRC, fn))
    a = crop_al(despill(defringe(keyed(fn, (0, 0, _im.width, CUT.get(name, _im.height))), 4)), 20)
    k = th / a.shape[0]
    im = Image.fromarray(a, 'RGBA').resize((round(a.shape[1] * k * SCALE), round(a.shape[0] * k * SCALE)), Image.LANCZOS)
    arr = np.array(im); arr[..., 3] = np.where(arr[..., 3] > 100, 255, 0)
    Image.fromarray(arr, 'RGBA').save(os.path.join(BOUT, name + '.png'), optimize=True)
    meta = {'img': 'assets/l7/b/' + name + '.png', 'w': round(arr.shape[1] / SCALE, 1), 'h': round(arr.shape[0] / SCALE, 1)}
    if walk: meta['tops'] = profile(arr, 1 / SCALE)
    B7[name] = meta; print('building', name, meta['w'], meta['h'])

# ---------- слои ----------
L = B7.get('_layers', {})
if have('sky7.png'):
    sky = Image.open(os.path.join(L7SRC, 'sky7.png')).convert('RGB'); sky = sky.resize((round(sky.width * 720 / sky.height), 720), Image.LANCZOS)
    sky.save(os.path.join(L7OUT, 'sky.jpg'), quality=88); L['sky'] = [sky.width / 2, 360]
def skycut(a):
    rgb = a[..., :3].astype(int); luma = rgb[..., 0] * 0.3 + rgb[..., 1] * 0.5 + rgb[..., 2] * 0.2
    for x in range(a.shape[1]):
        col = luma[:, x]; dark = np.where(col < 62)[0]
        y = dark[0] if len(dark) else a.shape[0]
        a[:y, x, 3] = 0
    return a
for nm, hh in (('far', 200), ('mid', 150)):
    if have(nm + '7.png'):
        a = keyed(nm + '7.png')
        if (a[..., 3] > 0).mean() > 0.9: a = skycut(a)   # нарисовано своё небо
        a = crop_al(despill(defringe(a, 3)), 20); im = Image.fromarray(a, 'RGBA')
        im = im.resize((round(im.width * hh * 2 / im.height), hh * 2), Image.LANCZOS); im.save(os.path.join(L7OUT, nm + '.png'), optimize=True)
        L[nm] = [im.width / 2, hh]
if have('ground7.png'):
    gr = Image.open(os.path.join(L7SRC, 'ground7.png')).convert('RGB'); w, h = gr.size
    gr = gr.crop((0, round(h * 0.55), w, h)); gr = gr.resize((round(gr.width * 160 / gr.height), 160), Image.LANCZOS)
    gr.save(os.path.join(L7OUT, 'ground.jpg'), quality=88); L['ground'] = [gr.width / 2, 80]
B7['_layers'] = L
G['BUILDINGS7'] = B7


def fit169(im):
    w, h = im.size; th = round(w * 9 / 16)
    if th <= h: y0 = round((h - th) * 0.35); im = im.crop((0, y0, w, y0 + th))
    else: tw = round(h * 16 / 9); x0 = (w - tw) // 2; im = im.crop((x0, 0, x0 + tw, h))
    return im.resize((1280, 720), Image.LANCZOS)


for c in ('comic_van', 'comic_gate', 'comic_stage', 'comic_shout', 'comic_raid', 'arena7', 'road7'):
    if have(c + '.png'):
        nm = {'arena7': 'arena', 'road7': 'road'}.get(c, c)
        fit169(Image.open(os.path.join(L7SRC, c + '.png')).convert('RGB')).save(os.path.join(L7OUT, nm + '.jpg'), quality=88); print('bg', nm)
if have('comic_gate.png'): fit169(Image.open(os.path.join(L7SRC, 'comic_gate.png')).convert('RGB')).save(os.path.join(L7OUT, 'card.jpg'), quality=88)
if have('portraits7.png'):
    im = Image.open(os.path.join(L7SRC, 'portraits7.png')).convert('RGB')
    for i, nm in enumerate(['stas', 'maxim', 'denisch', 'deniso', 'mrx', 'leather']):
        r, c = divmod(i, 3); xs = [118, 478, 908, 1340]; ys = [32, 400, 768]
        x0, y0, x1, y1 = xs[c] + 6, ys[r] + 6, xs[c + 1] - 6, ys[r + 1] - 6; s = min(x1 - x0, y1 - y0); cx = (x0 + x1) / 2
        im.crop((round(cx - s / 2), round(y0), round(cx + s / 2), round(y0 + s))).resize((128, 128), Image.LANCZOS).save(os.path.join(SPR, 'p_' + nm + '.png'))

assert len(S) >= n0, 'sheets lost!'
with open(DATA, 'w', encoding='utf-8') as fp:
    fp.write('// автоматически создано tools/build_assets.py\n' + ''.join('window.%s = %s;\n' % (k, json.dumps(v)) for k, v in G.items()))
print('sheets', len(S))
