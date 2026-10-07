# Сборка ассетов уровня 7 «ЗАВОДОУПРАВЛЕНИЕ» из art_src/l7/*.png (Codex, промпты tools/p7).
# Запуск: py tools/build_l7.py — берёт только то, что есть; остальные атласы в sprites_data.js не трогает.
import json, os, re
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'build_assets.py'), encoding='utf-8').read()
exec(compile(src[:src.index('\nS = {}')], 'build_assets_helpers', 'exec'))  # key_green, anchor, SCALE ...
from scipy import ndimage

L7SRC = os.path.join(SRC, 'l7')
L7OUT = os.path.join(OUT, 'l7')
os.makedirs(L7OUT, exist_ok=True)
DATA = os.path.join(ROOT, 'js', 'sprites_data.js')
txt = open(DATA, encoding='utf-8').read()
G = {}
for name, body in re.findall(r'window\.(\w+) = (\{.*?\});\n', txt + '\n', re.S):
    G[name] = json.loads(body)
S = G.setdefault('SPRITES', {})
have = lambda f: os.path.exists(os.path.join(L7SRC, f))
n0 = len(S)
for _f in os.listdir(L7SRC):   # из Flow можно сохранять и .jpg — приводим к .png
    if _f.lower().endswith(('.jpg', '.jpeg', '.webp')) and not os.path.exists(os.path.join(L7SRC, os.path.splitext(_f)[0] + '.png')):
        Image.open(os.path.join(L7SRC, _f)).convert('RGB').save(os.path.join(L7SRC, os.path.splitext(_f)[0] + '.png'))


def load(fn):
    im = Image.open(os.path.join(L7SRC, fn))
    alpha = im.mode == 'RGBA' and np.array(im)[..., 3].min() < 10   # Codex иногда отдаёт уже прозрачный фон
    return im, alpha


def keyed(im, alpha, box=None):
    if box: im = im.crop(box)
    if alpha:
        a = np.array(im.convert('RGBA')).astype(np.uint8); a[..., 3] = np.where(a[..., 3] > 128, 255, 0); return a
    return np.array(key_green(im.convert('RGB'))).astype(np.uint8)


def defringe_arr(a, it=2):
    a = a.astype(np.int32)
    for _ in range(it):
        tr = a[..., 3] == 0; edge = ndimage.binary_dilation(tr) & ~tr
        bad = (a[..., 1] - a[..., 0] > 35) & (a[..., 1] - a[..., 2] > 35) & (a[..., 1] > 120)
        a[..., 3] = np.where(edge & bad, 0, a[..., 3])
    tr = a[..., 3] == 0; edge = ndimage.binary_dilation(tr, iterations=2) & ~tr
    g2 = np.minimum(a[..., 1], np.maximum(a[..., 0], a[..., 2]) + 10); a[..., 1] = np.where(edge, g2, a[..., 1])
    return a.astype(np.uint8)


def crop_al(f):
    al = f[..., 3] > 0; ys = np.where(al.any(axis=1))[0]; xs = np.where(al.any(axis=0))[0]
    return f[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1] if len(ys) else f


def pack(name, fr, target, ref=0, anchors=None, pad=2):
    """target: число — высота кадра ref в логических px (все кадры в одном масштабе); список — свой у каждого (отрицательное — по ширине)"""
    fr = [crop_al(defringe_arr(f)) for f in fr]
    if isinstance(target, (int, float)): ks = [target * SCALE / fr[ref].shape[0]] * len(fr)
    else: ks = [t * SCALE / f.shape[0] if t > 0 else (-t) * SCALE / f.shape[1] for f, t in zip(fr, target)]
    imgs, meta = [], []
    for i, (f, k) in enumerate(zip(fr, ks)):
        pim = Image.fromarray(f, 'RGBA'); pim = pim.resize((max(1, round(pim.width * k)), max(1, round(pim.height * k))), Image.LANCZOS)
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
    print(name, len(frames), 'кадров', atlas.size)
    S[name] = {'img': 'assets/spr/' + name + '.png', 'f': frames}


def figs(fn, rows, n_per, dil=6):
    """лист фигур рядами: в каждом ряду берём n_per крупнейших фигур слева направо"""
    im, alpha = load(fn); fr = []
    for r in range(rows):
        y0, y1 = round(r * im.height / rows), round((r + 1) * im.height / rows)
        a = keyed(im, alpha, (0, y0, im.width, y1)); al = a[..., 3] > 0
        lab, k = ndimage.label(ndimage.binary_dilation(al, iterations=dil))
        sz = ndimage.sum(al, lab, range(1, k + 1)); ids = sorted(range(1, k + 1), key=lambda i: -sz[i - 1])[:n_per]
        sls = ndimage.find_objects(lab); ids.sort(key=lambda i: sls[i - 1][1].start)
        for i in ids:
            sl = sls[i - 1]; sub = a[sl].copy(); sub[..., 3] = np.where(lab[sl] == i, sub[..., 3], 0); fr.append(sub)
    return fr


def bands(name, fn, rows, n_per, target, ref=0, anchors=None, dil=6):
    if have(fn): pack(name, figs(fn, rows, n_per, dil), target, ref, anchors)


hgt = lambda f: crop_al(defringe_arr(f)).shape[0]


def merge(name, parts, ref_h, anchors=None):
    """склейка кадров из разных листов в один масштаб.
    parts: [(кадры, k)] — k: логических px на px источника; ref_h: (кадр-эталон, высота) для первого листа"""
    fr, tg = [], []
    for frs, k in parts:
        for f in frs: fr.append(f); tg.append(hgt(f) * k)
    pack(name, fr, tg, 0, anchors)


def grid(name, fn, rows, cols, targets, anchors=None, largest=True):
    """равная сетка: в ячейке берём крупнейший объект (или всё содержимое)"""
    if not have(fn): return
    im, alpha = load(fn); fr = []
    for r in range(rows):
        for c in range(cols):
            box = (round(c * im.width / cols) + 3, round(r * im.height / rows) + 3, round((c + 1) * im.width / cols) - 3, round((r + 1) * im.height / rows) - 3)
            a = keyed(im, alpha, box); al = a[..., 3] > 0
            if largest:
                lab, k = ndimage.label(ndimage.binary_dilation(al, iterations=4))
                if k > 1:
                    sz = ndimage.sum(al, lab, range(1, k + 1)); big = 1 + int(np.argmax(sz)); a[..., 3] = np.where(lab == big, a[..., 3], 0)
            fr.append(a)
    pack(name, fr, targets, 0, anchors)


# ---------- персонажи ----------
# старый лист + новый лист анимаций (Flow): масштаб нового подгоняем по похожему кадру
if have('v7sneak.png') and have('v7b.png'):   # 0-11 старые, 12-15 крадётся, 16-17 автостоп, 18-19 бросок, 20-21 рубящий, 22-23 крик
    o, n = figs('v7sneak.png', 3, 4), figs('v7b.png', 3, 4); ko = 84 / hgt(o[4]); kn = ko * hgt(o[11]) / hgt(n[10])
    merge('v7sneak', [(o, ko), (n, kn)], None)
if have('guard7.png') and have('guard7b.png'):   # 0-3 шаг(новый), 4-11 старые позы, 12-15 бег, 16-19 тащит верёвку
    o, n = figs('guard7.png', 3, 4), figs('guard7b.png', 3, 4); ko = 90 / hgt(o[4]); kn = ko * hgt(o[0]) / hgt(n[0])
    merge('guard7', [(n[:4], kn), (o[4:], ko), (n[4:], kn)], None)
if have('dog7.png') and have('dog7b.png'):   # 0-3 шаг, 4-7 галоп, 8 лай, 9 рычит, 10-11 нюхает, 12 бросок, 13 ест, 14 сидит, 15 спит
    o, n = figs('dog7.png', 3, 4), figs('dog7b.png', 3, 4); ko = 44 / hgt(o[0]); kn = ko * hgt(o[0]) / hgt(n[0])
    merge('dog7', [(n, kn), (o[8:], ko)], None)
bands('leather7', 'leather7.png', 3, 4, 84, ref=0)   # 0-1 стоит, 2-3 голосует, 4-7 бег, 8-11 шаг
# ---------- предметы ----------
# предметы — нарезка по найденным объектам (Flow рисует не строго по сетке), порядок -> кадры игры
exec(open(os.path.join(HERE, 'l7_objs.py'), encoding='utf-8').read().split("if __name__")[0])
def objsheet(name, fn, order, targets, anchors, minpx=1500):
    if not have(fn): return
    _, out = objs(os.path.join(L7SRC, fn), minpx)
    pack(name, [out[k][1] for k in order], targets, 0, anchors)
if have('cars7v2.png') and have('van7e.png') and have('bike7.png'):
    # 0 фургон пустой сзади, 1 открыт с мешками картошки, 2 байкер, 3 байкер+кожаный, 4 фургон едет (пустой), 5 байкер-2, 6 дуэт-2, 7 дуэт машет,
    # 8 фургон с Валерой сзади, 9 он же едет
    _v = [x[1] for x in objs(os.path.join(L7SRC, 'cars7v2.png'))[1]]; _e = [x[1] for x in objs(os.path.join(L7SRC, 'van7e.png'))[1]]
    _b = [x[1] for x in objs(os.path.join(L7SRC, 'bike7.png'), 1500, 1)[1]]
    kv = 92 / hgt(_v[0]); kb = 96 / hgt(_b[0])
    merge('cars7', [([_e[0], _v[1]], kv), ([_b[0], _b[2]], kb), ([_e[1]], kv), ([_b[1], _b[3], _b[5]], kb), ([_v[0], _v[2]], kv)], None)
objsheet('props7out', 'props7out.png', list(range(12)), [48, 56, 62, -150, -150, 130, 120, 150, -14, 52, 30, -130], ['feet'] * 8 + ['center'] + ['feet'] * 3, minpx=300)
objsheet('props7in', 'props7in.png', [0, 1, 2, 3, 5, 6, 7, 8, 11, 12, 13, 9, 14, 10, 15, 16], [92, 118, 118, 52, -26, -16, -14, 20, 46, 96, 62, 118, 118, 118, -14, 58], ['feet', 'feet', 'feet', 'feet', 'center', 'center', 'center', 'center', 'feet', 'feet', 'feet', 'feet', 'feet', 'feet', 'center', 'feet'])


# ---------- фоны ----------
def save_jpg(im, name, size=None, q=88):
    im = im.convert('RGB')
    if size: im = im.resize(size, Image.LANCZOS)
    im.save(os.path.join(L7OUT, name), quality=q); print('фон', name, im.size)


def fit169(im):
    """обрезка до 16:9 (по центру, чуть выше середины) -> 1280x720"""
    w, h = im.size; th = round(w * 9 / 16)
    if th <= h: y0 = round((h - th) * 0.35); im = im.crop((0, y0, w, y0 + th))
    else: tw = round(h * 16 / 9); x0 = (w - tw) // 2; im = im.crop((x0, 0, x0 + tw, h))
    return im.resize((1280, 720), Image.LANCZOS)


if have('sky7.png'): save_jpg(Image.open(os.path.join(L7SRC, 'sky7.png')), 'sky.jpg', (1280, round(1280 * Image.open(os.path.join(L7SRC, 'sky7.png')).height / Image.open(os.path.join(L7SRC, 'sky7.png')).width)))
for fn, nm in (('alley7.png', 'alley'), ('yard7.png', 'yard')):
    if not have(fn): continue
    im = Image.open(os.path.join(L7SRC, fn)).convert('RGB'); w, h = im.size; gy = round(h * 0.86)
    save_jpg(im.crop((0, gy, w, h)), 'gr_' + nm + '.jpg')          # полоса земли — тайлом под ногами
    mid = np.array(im.crop((0, 0, w, gy)).convert('RGBA')); fade = round(gy * 0.22)
    mid[:fade, :, 3] = (np.linspace(0, 255, fade)[:, None]).astype(np.uint8)   # верх растворяется в небе
    Image.fromarray(mid, 'RGBA').save(os.path.join(L7OUT, nm + '.png'), optimize=True); print('слой', nm)
if have('facade7.png'):
    im, alpha = load('facade7.png'); a = keyed(im, alpha); a = crop_al(defringe_arr(a))
    Image.fromarray(a, 'RGBA').resize((1280, round(1280 * a.shape[0] / a.shape[1])), Image.LANCZOS).save(os.path.join(L7OUT, 'facade.png'), optimize=True); print('фасад', a.shape)
if have('road7.png'): save_jpg(fit169(Image.open(os.path.join(L7SRC, 'road7.png'))), 'road.jpg')
for c in ('comic_van', 'comic_gate', 'comic_stage', 'comic_shout', 'comic_raid'):
    if have(c + '.png'): save_jpg(fit169(Image.open(os.path.join(L7SRC, c + '.png'))), c + '.jpg')


# ---------- комнаты: сетка 2 колонки x 3 ряда с тонкими чёрными линиями ----------
def rooms(fn, names):
    if not have(fn): return
    im = Image.open(os.path.join(L7SRC, fn)).convert('RGB'); a = np.array(im); dark = a.max(axis=2) < 40
    def lines(axis, n, size):
        v = dark.mean(axis=axis); out = []
        for k in range(1, n):
            c = round(k * size / n); lo, hi = max(0, c - size // 12), min(size, c + size // 12)
            seg = v[lo:hi]; j = int(np.argmax(seg)); out.append(lo + j if seg[j] > 0.6 else c)
        return [0] + out + [size]
    xs = lines(0, 2, im.width); ys = lines(1, 3, im.height)
    for i, nm in enumerate(names):
        r, c = divmod(i, 2)
        cell = im.crop((xs[c] + 5, ys[r] + 5, xs[c + 1] - 5, ys[r + 1] - 5))
        save_jpg(cell, 'room_' + nm + '.jpg', (640, 300))
rooms('rooms7a.png', ['reception', 'director', 'deputy', 'deputy2', 'accounting', 'archive'])
rooms('rooms7b.png', ['server', 'security', 'canteen', 'corridor', 'stairs', 'hall'])


# ---------- портреты 2x3 ----------
if have('portraits7.png'):
    im = Image.open(os.path.join(L7SRC, 'portraits7.png')).convert('RGB')
    for i, nm in enumerate(['stas', 'maxim', 'denisch', 'deniso', 'mrx', 'leather']):
        r, c = divmod(i, 3)   # сетка Flow с полями: границы ячеек по линиям (1376x768)
        xs = [118, 478, 908, 1340]; ys = [32, 400, 768]
        x0, y0, x1, y1 = xs[c] + 6, ys[r] + 6, xs[c + 1] - 6, ys[r + 1] - 6
        s = min(x1 - x0, y1 - y0); cx = (x0 + x1) / 2
        im.crop((round(cx - s / 2), round(y0), round(cx + s / 2), round(y0 + s))).resize((128, 128), Image.LANCZOS).save(os.path.join(SPR, 'p_' + nm + '.png'))
    print('портреты 6')
# карточка уровня для меню
if have('comic_gate.png'): save_jpg(fit169(Image.open(os.path.join(L7SRC, 'comic_gate.png'))), 'card.jpg')

assert len(S) >= n0, 'листы пропали!'
with open(DATA, 'w', encoding='utf-8') as fp:
    fp.write('// автоматически создано tools/build_assets.py\n' + ''.join('window.%s = %s;\n' % (k, json.dumps(v)) for k, v in G.items()))
print('листов всего', len(S))
