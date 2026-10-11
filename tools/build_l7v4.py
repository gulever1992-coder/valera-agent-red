# Сборка ассетов уровня 7, версия 4 (гроза, по наброскам 2026-10-08). Исходники art_src/l7/v4_*.jpg (Google Flow).
# Запуск: py tools/build_l7v4.py [--debug]  -> assets/l7v4/*.png|jpg, листы в assets/spr/ + js/sprites_data.js
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(HERE, 'build_l7.py'), encoding='utf-8').read()
exec(compile(_src[:_src.index('# ---------------- фоны')], 'build_l7_helpers', 'exec'))   # figures, pack, sheet, key_green ...

V4OUT = os.path.join(OUT, 'l7v4'); os.makedirs(V4OUT, exist_ok=True)


def demagenta(im):
    """пурпурный фон (#FF00FF) и фиолетовые обрывки молний -> зелёный, чтобы работал key_green"""
    a = np.array(im.convert('RGB')).astype(np.int32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = (r > 150) & (b > 150) & (g < 110) & (abs(r - b) < 90)
    m = ndimage.binary_dilation(m, iterations=2) & (r - g > 40) & (b - g > 40) | m   # кайма у края фона
    m |= (r - g > 70) & (b - g > 70) & (abs(r - b) < 80)   # просветы пурпура в кронах/решётках
    a[m] = (0, 255, 0)
    return Image.fromarray(a.astype(np.uint8))


_defr = defringe
defringe = lambda arr, it=2: depurple(_defr(arr, it))
_fig = figures
def figures(fn, **kw):
    """то же, но с пурпурным фоном (подменяем исходник на лету)"""
    p = os.path.join(L7SRC, fn)
    im = Image.open(p)
    if np.array(im.convert('RGB'))[:8, :8].reshape(-1, 3).mean(axis=0)[[0, 2]].min() > 150:
        tmp = os.path.join(L7SRC, '_tmp_' + fn.rsplit('.', 1)[0] + '.png'); demagenta(im).save(tmp)
        try: return _fig(os.path.basename(tmp), **kw)
        finally: os.remove(tmp)
    return _fig(fn, **kw)


def depurple(a, it=3):
    """фиолетовая кайма и пятна после кея: пурпурные пиксели -> прозрачно, у края — снять оттенок"""
    a = a.astype(np.int32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    blob = (r - g > 45) & (b - g > 45) & (abs(r - b) < 70)
    a[..., 3] = np.where(blob, 0, a[..., 3])
    for _ in range(it):   # край: подтянуть r/b к зелёному каналу
        tr = a[..., 3] == 0; edge = ndimage.binary_dilation(tr, iterations=2) & ~tr
        pur = edge & (a[..., 0] - a[..., 1] > 12) & (a[..., 2] - a[..., 1] > 12)
        a[..., 3] = np.where(pur & (a[..., 2] > a[..., 1] + 40), 0, a[..., 3])
        m = np.minimum(a[..., 0], a[..., 2]); 
        for ch in (0, 2): a[..., ch] = np.where(pur, np.minimum(a[..., ch], a[..., 1] + (a[..., ch] - m) + 10), a[..., ch])
    return a.astype(np.uint8)


def layer(fn, out, crop=None, cut_dark_bottom=False, bolt=0, fade=0, vfade=0):
    """слой параллакса с прозрачным верхом (пурпур -> альфа), PNG"""
    if not have(fn): print('НЕТ', fn); return
    im = Image.open(os.path.join(L7SRC, fn)).convert('RGB')
    if crop: im = im.crop(crop)
    a = np.array(key_green(demagenta(im))).astype(np.uint8)
    if bolt:   # впечатанная молния: яркий сине-фиолетовый -> прозрачно (над забором)
        c = a[..., :3].astype(np.int32); m = (c[..., 2] > 150) & (c[..., 2] - c[..., 1] > 35) & (c.sum(axis=2) > 330)
        m = ndimage.binary_dilation(m, iterations=3); m[bolt:] = False; a[..., 3] = np.where(m, 0, a[..., 3])
    if cut_dark_bottom:   # чёрная полоса снизу у дальнего слоя
        rows = np.where(a[..., :3].max(axis=2).mean(axis=1) > 25)[0]; a = a[:rows[-1] + 1]
    a = depurple(defringe(a))
    if vfade:   # верх (полоса неба за силуэтами) растворяется в дымку
        rows = np.where((a[..., 3] > 0).mean(axis=1) > 0.5)[0]; t0 = rows[0]; n = int((a.shape[0] - t0) * vfade)
        k = np.ones(a.shape[0]); k[:t0] = 0; k[t0:t0 + n] = np.linspace(0, 1, n) ** 1.6
        a[..., 3] = (a[..., 3] * k[:, None]).astype(np.uint8)
    if fade:   # края по горизонтали растворяются (кусок вставляется в панораму)
        n = int(a.shape[1] * fade); r = np.linspace(0, 1, n)
        a[..., 3] = (a[..., 3] * np.concatenate([r, np.ones(a.shape[1] - 2 * n), r[::-1]])[None, :]).astype(np.uint8)
    Image.fromarray(a, 'RGBA').save(os.path.join(V4OUT, out), optimize=True)
    print('слой', out, a.shape[1], 'x', a.shape[0])


def fx_sheet(name, fn):
    """эффекты на чёрном: альфа = яркость (рисуются 'lighter')"""
    if not have(fn): return
    im = Image.open(os.path.join(L7SRC, fn)).convert('RGB'); a = np.array(im).astype(np.float32)
    lum = a.max(axis=2); al = np.clip((lum - 18) * 1.4, 0, 255)
    rgba = np.dstack([a, al]).astype(np.uint8)
    # фикс. рамки (замерено по v4_fx_0): 0-3 молнии, 4-7 брызги, 8-10 вспышка фото, 11 свечение, 12-13 тайлы дождя, 14-16 круги на луже
    B = [(88, 29, 257, 334), (430, 29, 604, 334), (769, 29, 953, 334), (1144, 29, 1263, 334),
         (72, 357, 137, 512), (192, 357, 283, 512), (332, 357, 428, 512), (476, 357, 569, 512),
         (662, 357, 744, 512), (802, 357, 916, 512), (950, 357, 1110, 512), (1170, 357, 1276, 512),
         (52, 519, 277, 744), (321, 519, 547, 744), (590, 519, 814, 744), (851, 519, 1074, 744), (1114, 519, 1334, 744)]
    fr = []
    for x0, y0, x1, y1 in B:
        sub = rgba[y0:y1 + 1, x0:x1 + 1]
        if fr.__len__() < 12 or fr.__len__() > 13:   # кроме тайлов дождя — обрезать по содержимому
            ys, xs = np.where(sub[..., 3] > 20)
            if len(ys): sub = sub[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        fr.append(sub.copy())
    print(fn, len(fr), 'эффектов')
    pack(name, fr, [f.shape[0] / SCALE * 0.5 for f in fr], anchors=['center'] * len(fr), strip=False)


# ---------------- слои фона ----------------
im = Image.open(os.path.join(L7SRC, 'v4_sky_1.jpg')).convert('RGB'); im.resize((1280, 720), Image.LANCZOS).save(os.path.join(V4OUT, 'sky.jpg'), quality=88); print('слой sky.jpg')
layer('v4_yardg_0.jpg', 'far.png', cut_dark_bottom=True, vfade=0.55)
layer('v4_adm3_0.jpg', 'admin.png', fade=0.12)
layer('v4_kpp4_1.jpg', 'kpp.png')
layer('v4_fence3_0.jpg', 'fence.png')


# ---------------- фоны интерьеров и остальных локаций (этапы B..F) ----------------
def jpg(fn, out, box=None, size=(1280, 720)):
    if not have(fn): print('НЕТ', fn); return
    im = Image.open(os.path.join(L7SRC, fn)).convert('RGB')
    if box: im = im.crop(box)
    im.resize(size, Image.LANCZOS).save(os.path.join(V4OUT, out), quality=88); print('фон', out)


def grid(fn, prefix, cols=2, rows=2, inset=6):
    """сетка комнат: делим по линиям (тёмные полосы) или ровно пополам"""
    if not have(fn): print('НЕТ', fn); return
    im = Image.open(os.path.join(L7SRC, fn)).convert('RGB'); a = np.array(im).astype(int); Wd, Hd = im.size
    def cut(axis, n):
        prof = a.max(axis=2).mean(axis=axis)   # средняя яркость столбца/строки
        L = Wd if axis == 0 else Hd; pos = [0]
        for k in range(1, n):
            c = int(L * k / n); lo, hi = c - L // 12, c + L // 12
            pos.append(lo + int(np.argmin(prof[lo:hi])))
        pos.append(L); return pos
    xs, ys = cut(0, cols), cut(1, rows); i = 0
    for r in range(rows):
        for c in range(cols):
            jpg(fn, '%s%d.jpg' % (prefix, i), (xs[c] + inset, ys[r] + inset, xs[c + 1] - inset, ys[r + 1] - inset)); i += 1


def roof_layer(fn, out, fill_from=0.55):
    """крыша: пурпурные отражения в лужах ниже линии крыши — не дыры, а тёмная вода"""
    if not have(fn): return
    im = Image.open(os.path.join(L7SRC, fn)).convert('RGB'); a = np.array(key_green(demagenta(im))).astype(np.uint8)
    y0 = int(a.shape[0] * fill_from); low = a[y0:]; holes = low[..., 3] == 0
    low[holes] = (34, 36, 58, 255); a[y0:] = low
    a = depurple(defringe(a)); Image.fromarray(a, 'RGBA').save(os.path.join(V4OUT, out), optimize=True); print('слой', out)


jpg('v4_sewer_0.jpg', 'sewer.jpg')
if have('v4_sewer_1.jpg'): jpg('v4_sewer_1.jpg', 'sewer2.jpg')
layer('v4_park_0.jpg', 'park.png')   # после этого: py tools/l7v4_parkwire.py (возвращает колючую проволоку)
layer('v4_shop_0.jpg', 'shop.png')
roof_layer('v4_roof_0.jpg', 'roof.png')
layer('v4_scaff_0.jpg', 'scaff.png', bolt=10000)
jpg('v4_stair2_1.jpg', 'stair.jpg', size=(1376, 768))
import l7v4_stair_rail; l7v4_stair_rail.build()   # передние перила отдельным слоем
import l7v4_sew_ladder; l7v4_sew_ladder.build()   # лестница + люк в канализации
import l7v4_corner; l7v4_corner.build()
import l7v4_shop; l7v4_shop.build()   # огромный цех: ближний и дальний вид   # конец улицы A2: угол, стена к зрителю
jpg('v4_corr2_1.jpg', 'corr0.jpg', size=(1376, 768)); jpg('v4_corr_1.jpg', 'corr1.jpg')
grid('v4_roomsA2_0.jpg', 'roomA'); grid('v4_roomsB2_0.jpg', 'roomB')
jpg('v4_hall_0.jpg', 'hall.jpg')
grid('v4_mgui_0.jpg', 'mg', cols=3, rows=1, inset=3)
if have('v4_road_1.jpg'): layer('v4_road_1.jpg', 'road.png')
if have('v4_vanin_0.jpg'): jpg('v4_vanin_0.jpg', 'vanin.jpg')


def black_fx(name, fn, scale=0.5):
    """эффекты на чёрном фоне: компоненты, ряды сверху вниз"""
    if not have(fn): return
    im = Image.open(os.path.join(L7SRC, fn)).convert('RGB'); a = np.array(im).astype(np.float32)
    lum = a.max(axis=2); al = np.clip((lum - 22) * 2.2, 0, 255)
    rgba = np.dstack([a, al]).astype(np.uint8)
    lab, k = ndimage.label(ndimage.binary_dilation(al > 40, iterations=5)); items = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        if (lab[sl] == i + 1).sum() < 200: continue
        sub = rgba[sl].copy(); sub[..., 3] = np.where(lab[sl] == i + 1, sub[..., 3], 0); items.append((sl[0].start, sl[0].stop, sl[1].start, sub))
    items.sort(key=lambda t: (t[0] + t[1]) / 2); rows = []
    for it in items:
        cy = (it[0] + it[1]) / 2
        if rows and abs(cy - np.mean([(x[0] + x[1]) / 2 for x in rows[-1]])) < 70: rows[-1].append(it)
        else: rows.append([it])
    fr = []
    for r in rows: fr += [t[3] for t in sorted(r, key=lambda t: t[2])]
    print(fn, len(fr), 'эффектов'); pack(name, fr, [f.shape[0] / SCALE * scale for f in fr], anchors=['center'] * len(fr), strip=False)

black_fx('bfx4', 'v4_bossfx_0.jpg')

# ---------------- листы ----------------
SH = json.load(open(os.path.join(HERE, 'l7v4_sheets.json'), encoding='utf-8'))
for name, o in SH.items():
    if o.get('fx'): fx_sheet(name, o['src']); continue
    sheet(name, o['src'], o['target'], o.get('ref', 0), o.get('pick'), o.get('anchors'), **o.get('kw', {}))

with open(DATA, 'w', encoding='utf-8') as fp:
    fp.write('// автоматически создано tools/build_assets.py\n' + ''.join('window.%s = %s;\n' % (k, json.dumps(v)) for k, v in G.items()))
print('листов в SPRITES:', len(S))
import l7v4_cabin; l7v4_cabin.build()   # катсцена в кабине: вид с капота, дворник
