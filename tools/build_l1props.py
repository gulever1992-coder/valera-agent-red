# Платформы и предметы уровня 1 (лист props): арт из Google Flow на пурпурном фоне -> assets/spr/props.png.
# Вырезка: «размешивание» пурпура (мягкая альфа, цвет кромки очищается), уменьшение с предумноженной альфой.
# Пишет: assets/spr/props.png, tools/p1/props.json (его читает build_assets.py), js/l1_props_data.js (разметка секций),
# и обновляет запись "props" в js/sprites_data.js. После запуска: py tools/optimize_assets.py, поднять G.VER и ?v=.
#   py tools/build_l1props.py [--debug]   (--debug: art_src/l1/_dbg.png — кадры с линиями разреза и линией опоры)
import os, sys, json, re
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art_src', 'l1')
K = 0.5                      # атлас = исходник / 2 (на холсте рисуется ещё в ~2 раза мельче)


def key(path):
    """RGBA float (0..1): альфа = 1 - доля пурпура в пикселе, цвет — без пурпурной примеси."""
    a = np.array(Image.open(path).convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    t = np.clip((np.minimum(r, b) - g) / 235.0, 0, 1)            # доля фона (255,0,255)
    al = np.clip((1 - t - 0.14) / (0.80 - 0.14), 0, 1)
    d = np.maximum(1 - t, 0.2)[..., None]
    rgb = np.clip((a - t[..., None] * np.array([255, 0, 255], np.float32)) / d, 0, 255)
    # мелкий мусор (шум JPEG, отлетевшие щепки) — долой
    lab, n = ndimage.label(al > 0.5)
    if n:
        sz = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
        small = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s < 40])
        keep = ndimage.binary_dilation((al > 0.5) & ~small, iterations=2)
        al = np.where(keep, al, 0)
    return np.dstack([rgb / 255.0, al])


def bbox(al, thr=0.3):
    ys = np.where((al > thr).any(axis=1))[0]; xs = np.where((al > thr).any(axis=0))[0]
    return xs[0], ys[0], xs[-1] + 1, ys[-1] + 1


def shrink(f, k=None, size=None):
    """Уменьшение с предумноженной альфой -> uint8 RGBA."""
    h, w = f.shape[:2]
    if size is None: size = (max(1, round(w * k)), max(1, round(h * k)))
    pm = np.dstack([f[..., :3] * f[..., 3:4], f[..., 3:4]])
    ch = [np.array(Image.fromarray(pm[..., i]).resize(size, Image.LANCZOS)) for i in range(4)]
    al = np.clip(ch[3], 0, 1)
    rgb = [np.clip(c / np.maximum(al, 1e-3), 0, 1) for c in ch[:3]]
    al = np.where(al < 0.04, 0, al)
    return (np.dstack(rgb + [al]) * 255 + 0.5).astype(np.uint8)


def top_line(al, cov=0.8):
    """Строка опоры: первая строка, закрытая не меньше чем на cov ширины."""
    c = (al > 0.5).mean(axis=1)
    return int(np.argmax(c >= cov))


def refine(f, cuts, mode, win=14):
    al = f[..., 3] > 0.5; h = f.shape[0]
    if mode == 'dark':       # рёбра балки: самая тёмная вертикаль в стенке
        band = f[int(h * 0.42):int(h * 0.78)]
        sc = -(band[..., :3].mean(axis=2)).mean(axis=0)
    elif mode == 'post':     # стойки лесов: колонка, сплошь закрытая между настилом и нижней трубой
        sc = al[int(h * 0.45):int(h * 0.72)].mean(axis=0)
    elif mode == 'tall':     # фланцы трубы: самая высокая колонка
        sc = al.mean(axis=0)
    else:
        return list(cuts)
    sc = ndimage.uniform_filter1d(sc.astype(np.float32), 9)
    out = []
    for c in cuts:
        lo, hi = max(0, c - win), min(len(sc), c + win + 1)
        seg = sc[lo:hi]; best = np.where(seg >= seg.max() - 1e-4)[0]
        out.append(int(lo + round(float(best.mean()))))
    return out


frames, META, DBG = [], {}, []


def add(name, f, meta=None, size=None, k=K):
    img = shrink(f, k=None if size else k, size=size)
    frames.append(img)
    kx = img.shape[1] / f.shape[1]; ky = img.shape[0] / f.shape[0]
    m = {'i': len(frames) - 1}
    for key_, v in (meta or {}).items():
        if key_ == 'cuts': m[key_] = [int(round(c * kx)) for c in v]
        elif key_ in ('top',): m[key_] = round(v * ky, 1)
        elif key_ in ('x0', 'bw'): m[key_] = round(v * kx, 1)
        else: m[key_] = v
    META[name] = m
    return m


def strip(name, sheet, band, cuts, mode, h):
    f = sheet[band[0]:band[1]]
    x0, y0, x1, y1 = bbox(f[..., 3]); f = f[y0:y1, x0:x1]
    cuts = refine(f, [c - x0 for c in cuts], mode)
    add(name, f, {'cuts': cuts, 'top': top_line(f[..., 3]), 'h': h})
    print(name, f.shape[1], 'x', f.shape[0], 'разрезы', cuts)


def cells(sheet, cols, rows):
    """Объекты листа-сетки: связные куски, разложенные по ячейкам (по центру масс)."""
    al = sheet[..., 3] > 0.3
    lab, n = ndimage.label(ndimage.binary_dilation(al, iterations=4))
    H, W = al.shape; out = {}
    cms = ndimage.center_of_mass(al, lab, range(1, n + 1))
    for j, (cy, cx) in enumerate(cms):
        cell = (min(rows - 1, int(cy / (H / rows))), min(cols - 1, int(cx / (W / cols))))
        out.setdefault(cell, np.zeros(al.shape, bool)); out[cell] |= lab == j + 1
    res = {}
    for cell, m in out.items():
        f = sheet.copy(); f[..., 3] = np.where(m, f[..., 3], 0)
        x0, y0, x1, y1 = bbox(f[..., 3]); res[cell] = f[y0:y1, x0:x1]
    return res


# ---------- длинные платформы ----------
P = key(os.path.join(SRC, 'plat_a.jpg'))
PAL = key(os.path.join(SRC, 'pal_a.jpg'))
OBJ = cells(key(os.path.join(SRC, 'obj_a.jpg')), 3, 2)

strip('girder', P, (15, 160), [228, 375, 528, 683, 838, 995, 1145], 'dark', 14)        # 0
strip('scaffold', P, (165, 385), [303, 558, 818, 1068], 'post', 27)                    # 1
strip('pallet', PAL, (35, 200), [246, 545, 832, 1131], 'none', 12)                     # 2
TEE = key(os.path.join(SRC, 'tee_a.jpg'))   # труба и та же труба с отводами — одна генерация (стыкуются без шва)
strip('pipe', TEE, (100, 230), [368, 567, 810, 1000], 'tall', 14)                      # 3

# ---------- груз на крюке ----------
hk = OBJ[(0, 0)]
HK_ROPE = 34                                           # строки тросов над блоком крюка
add('hook', hk[HK_ROPE + 2:], {'top': top_line(hk[HK_ROPE + 2:, :, 3]), 'x0': 0, 'bw': hk.shape[1]})   # 4

# ---------- лестница: 4 шага перекладин, от середины просвета до середины просвета ----------
ld = OBJ[(1, 0)]
al = ld[..., 3] > 0.5
rails = np.where(al.mean(axis=0) > 0.6)[0]             # колонки стоек (кронштейны отбрасываем)
lx0, lx1 = max(0, rails[0] - 3), min(ld.shape[1], rails[-1] + 4)
inner = al[:, rails[0] + 14:rails[-1] - 13].mean(axis=1) > 0.5
lab, n = ndimage.label(inner)
rungs = [float(c[0]) for c in ndimage.center_of_mass(inner, lab, range(1, n + 1))]
per = float(np.median(np.diff(rungs)))
y0 = int(round(rungs[1] - per / 2)); y1 = int(round(y0 + per * 4))
add('ladder', ld[y0:y1, lx0:lx1], {'w': 20})                                           # 5
print('лестница: перекладины', [round(r) for r in rungs], 'шаг', round(per, 1), 'кусок', y0, y1)

add('crate', OBJ[(0, 2)])                                                              # 6

# ---------- люлька ----------
lf = OBJ[(0, 1)]
LF_ROPE = 108                                          # строки тросов над люлькой
LF_FLOOR = 336                                         # строка пола (верх полосатого борта), от верха кадра
body = np.where((lf[LF_ROPE + 60:, :, 3] > 0.5).mean(axis=0) > 0.5)[0]
add('lift', lf[LF_ROPE + 2:], {'top': LF_FLOOR - LF_ROPE - 2, 'x0': 0, 'bw': lf.shape[1]})            # 7

# ---------- флажок и клапан: в игре рисуются 1:1 (2 px атласа = 1 логический) ----------
fl = OBJ[(1, 1)]; add('flag', fl, size=(round(fl.shape[1] * 96 / fl.shape[0]), 96))                    # 8
vl = cells(key(os.path.join(SRC, 'valve_a.jpg')), 3, 1)[(0, 0)]      # паровой клапан: раструб смотрит ВВЕРХ (пар идёт вверх)
VH = 54                                                # высота в атласе (27 логических)
mouth = np.where((vl[:int(vl.shape[0] * 0.08), :, 3] > 0.5).any(axis=0))[0]
add('valve', vl, {'x0': (mouth[0] + mouth[-1]) / 2}, size=(round(vl.shape[1] * VH / vl.shape[0]), VH))   # 9; x0 — центр раструба

# ---------- тросы (тянутся вверх растяжением) ----------
META['hook']['rope'] = add('hookrope', hk[2:HK_ROPE])['i']                                             # 10
META['lift']['rope'] = add('liftrope', lf[2:LF_ROPE])['i']                                             # 11
cb = hk[2:HK_ROPE]; cx = np.where((cb[..., 3] > 0.4).any(axis=0))[0]
add('cable', cb[:, max(0, cx[0] - 2):cx[-1] + 3])                                                       # 12: тросы крана (катсцена с подлодкой)

# ---------- тройник: участок трубы с отводом вверх (флянец-флянец), кладётся поверх трубы на месте клапана ----------
tr = TEE[325:645]
x0_, y0_, x1_, y1_ = bbox(tr[..., 3]); tr = tr[y0_:y1_, x0_:x1_]
fl = refine(tr, [567 - x0_, 810 - x0_], 'tall', 24)                  # фланцы по бокам среднего отвода
te = tr[:, fl[0]:fl[1] + 1]
yb = top_line(te[..., 3], 0.8)                                       # верх тела трубы
mo = np.where((te[:6, :, 3] > 0.5).any(axis=0))[0]                   # раструб
add('tee', te, {'top': yb, 'x0': (mo[0] + mo[-1]) / 2})                                              # 13
print('тройник', te.shape[1], 'x', te.shape[0], 'верх трубы', yb)

# ---------- фоновая галерея: балка + перила одной конструкцией ----------
GAL = key(os.path.join(SRC, 'gal_b.jpg'))
g = GAL[50:345]; x0_, y0_, x1_, y1_ = bbox(g[..., 3]); g = g[y0_:y1_, x0_:x1_]
cov = (g[..., 3] > 0.5).mean(axis=1); full = np.where(cov > 0.9)[0]
runs = np.split(full, np.where(np.diff(full) > 1)[0] + 1)
deck = int([r for r in runs if len(r) >= 20][-1][0])                 # верх балки = пол галереи
cuts = refine(g, [225 - x0_, 378 - x0_, 530 - x0_, 685 - x0_, 840 - x0_, 993 - x0_, 1146 - x0_], 'post')
add('gallery', g, {'cuts': cuts, 'top': deck, 'h': 34})                                              # 14
print('галерея', g.shape[1], 'x', g.shape[0], 'пол', deck, 'разрезы', cuts)

# ---------- атлас ----------
PAD = 2
W = sum(f.shape[1] + PAD for f in frames); H = max(f.shape[0] for f in frames)
atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0)); x = 0; F = []
for f in frames:
    atlas.paste(Image.fromarray(f, 'RGBA'), (x, 0))
    w, h = f.shape[1], f.shape[0]
    F.append([x, 0, w, h, round(w / 2, 1), float(h), round(w / 2, 1), 0])
    x += w + PAD
atlas.save(os.path.join(ROOT, 'assets', 'spr', 'props.png'), optimize=True)
entry = {'img': 'assets/spr/props.png', 'f': F}
os.makedirs(os.path.join(ROOT, 'tools', 'p1'), exist_ok=True)
json.dump(entry, open(os.path.join(ROOT, 'tools', 'p1', 'props.json'), 'w'))
with open(os.path.join(ROOT, 'js', 'l1_props_data.js'), 'w', encoding='utf-8') as fp:
    fp.write('// автоматически создано tools/build_l1props.py — разметка листа props (секции платформ, линия опоры; в px атласа)\n')
    fp.write('window.L1PROPS = ' + json.dumps(META) + ';\n')
data = os.path.join(ROOT, 'js', 'sprites_data.js')
s = open(data, encoding='utf-8').read()
s2, n = re.subn(r'"props": \{"img": "[^"]*", "f": \[\[.*?\]\]\}', lambda _: '"props": ' + json.dumps(entry), s, count=1)
assert n == 1, 'запись props не найдена в sprites_data.js'
open(data, 'w', encoding='utf-8').write(s2)
print('props', len(F), 'кадров', atlas.size)

if '--debug' in sys.argv:
    Z = 2; rows = []
    for name, m in META.items():
        f = frames[m['i']]; h, w = f.shape[:2]
        bgc = np.zeros((h, w, 3), np.float32); yy, xx = np.mgrid[0:h, 0:w]
        bgc[...] = np.where(((yy // 8 + xx // 8) % 2)[..., None] == 0, 70, 110)
        a = f[..., 3:4] / 255.0
        im = Image.fromarray((f[..., :3] * a + bgc * (1 - a)).astype(np.uint8)).resize((w * Z, h * Z), Image.NEAREST)
        d = ImageDraw.Draw(im)
        for c in m.get('cuts', []): d.line([(c * Z, 0), (c * Z, h * Z)], fill=(0, 255, 255))
        if 'top' in m: d.line([(0, m['top'] * Z), (w * Z, m['top'] * Z)], fill=(255, 255, 0))
        rows.append(im)
    # длинные — по одному в строку, остальные — в ряд
    long_ = [r for r in rows if r.width > 900]; rest = [r for r in rows if r.width <= 900]
    Wd = max(max(r.width for r in long_), sum(r.width + 8 for r in rest))
    Hd = sum(r.height + 8 for r in long_) + max(r.height for r in rest)
    dbg = Image.new('RGB', (Wd, Hd), (40, 40, 40)); y = 0
    for r in long_: dbg.paste(r, (0, y)); y += r.height + 8
    x = 0
    for r in rest: dbg.paste(r, (x, y)); x += r.width + 8
    dbg.save(os.path.join(SRC, '_dbg.png'))
    print('debug ->', os.path.join(SRC, '_dbg.png'), dbg.size)
