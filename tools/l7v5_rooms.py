# «Цех сортировки» v5 (карта D): здание в разрезе, 4 этажа. Одна комната = один кадр Flow (стиль finestyle.jpg).
#   art_src/l7/v4_rNM_K.jpg — комната M этажа N (16:9, 1376x768); art_src/l7/v4_well*_K.jpg — лестничная клетка СРАЗУ НА ДВА ЭТАЖА (9:16, 768x1376,
#   лестница нарисована вместе с фоном по схеме tools/p7v4/refwell.png). Сборка -> assets/l7v4/fl1..4.png (полосы этажей) и pr/*.png (спрайты).
# Масштаб: 2 px = 1 лог. px, шаг этажей 190 (плита 10 + комната 180), линия «стена-пол» на 15 лог. px выше линии ног.
# Комнаты НЕ обрезаются по ширине: каждая целиком масштабируется (ZOOM) так, чтобы двери всех комнат и клеток были одной высоты (~93 лог. px),
# поэтому ширина комнат разная. Раскладка (лог. px от левого края мира) пишется в js/l7v4_props.js: V4_LAY.rows[этаж] = [[x, ширина, масштаб], ...].
#   1: 11 | 12 | 13 | клетка A (низ)      2: клетка B (низ) | 22 | 23 | клетка A (верх)
#   3: клетка B (верх) | 32 | 33 | клетка C (низ)      4: 41 | 42 | 43 | клетка C (верх)
# Этажи 2-3 короче (две комнаты между клетками): слева от клетки B — глухая стена.
import os, sys, json
import numpy as np
from PIL import Image
from l7v4_stairs import key, SRC, OUT

RW, RH, SLAB, JUNC = 644, 360, 20, 302          # px: базовая ширина комнаты, высота, плита, строка «стена-пол» внутри комнаты
FH = SLAB + RH
# Комнаты и клетки — варианты «без дверных створок» (v4_ndNM_K.jpg, v4_ndw?_K.jpg): перерисовка Flow «Recreate EXACTLY, ONLY change» поверх исходных кадров
# (исходники: v4_rNM_K.jpg, выбор 11:0 12:ru_1 13:0 22:1 23:0 32:1 33:0 41:0 42:1 43:0; клетки v4_well_1, v4_well2_1, v4_well_0). Проходы между комнатами открыты.
PICK = {11: 0, 12: 0, 13: 0, 22: 0, 23: 0, 32: 0, 33: 0, 41: 0, 42: 0, 43: 0}
FILES = {41: 'v4_dead41_0.jpg'}   # 41: слева тупик — глухая стена
ZK = 1.0
# Масштаб кадра = 87 лог. px (высота проёмов в лестничных клетках) / измеренная высота бокового проёма комнаты (px при ширине 644, пополам):
#   12: 92, 13: 107, 22: 113, 23: 91, 32: 85, 33: 94, 41: 101, 43: 80; 11 и 42 — оценка на глаз (~80)
ZOOM = {11: 1.09, 12: 0.948, 13: 0.815, 22: 0.768, 23: 0.956, 32: 1.024, 33: 0.926, 41: 0.861, 42: 1.10, 43: 1.094}
# простенок от края кадра до тёмного проёма (px при ширине 644): слева, справа. Персонаж, уходя в проём, скрывается за простенком и выходит из проёма соседней комнаты
JAMB = {11: (0, 25), 12: (26, 25), 13: (25, 25), 22: (19, 19), 23: (24, 24), 32: (24, 25), 33: (33, 33), 41: (0, 26), 42: (24, 24), 43: (24, 24)}
WJAMB = {'A0': 11, 'A1': 10, 'B0': 12, 'B1': 12, 'C0': 10, 'C1': 50}   # то же для клеток (px при ширине 424), со стороны комнат
WELLS = {'A': ('v4_ndwa_0.jpg', False), 'B': ('v4_ndwb_0.jpg', True), 'C': ('v4_ndwc_0.jpg', False)}       # файл, зеркально (клетка у левого торца)
WELLW = 424                                      # px: ширина клетки (кадр 768x1376 -> 424x760)
FLOORS = {1: [11, 12, 13, 'A0'], 2: ['B0', 22, 23, 'A1'], 3: ['B1', 32, 33, 'C0'], 4: [41, 42, 43, 'C1']}   # A0 — низ клетки A, A1 — верх
WELLDY = 28                                      # px: на сколько опущен кадр клетки (14 лог. px)
SLABH = 14                                       # толщина бетонного перекрытия между этажами, лог. px
WALLW = 8                                       # ширина стены-перегородки, лог. px
PR = os.path.join(OUT, 'pr'); os.makedirs(PR, exist_ok=True)
SIZES = {}


def load_room(n, z, fn=None, jpx=None, kx=1.0):
    """кадр комнаты -> (RH x ширина) px; масштаб z, линия «стена-пол» на строке JUNC; возвращает (картинка, строка линии до подгонки)"""
    a = np.array(Image.open(os.path.join(SRC, fn or FILES.get(n) or 'v4_nd%d_%d.jpg' % (n, PICK[n]))).convert('RGB'))
    ys = np.where(a.max(axis=(1, 2)) > 26)[0]; a = a[ys.min():ys.max() + 1]      # чёрные поля сверху/снизу
    w0 = round(RW * z); h = round(a.shape[0] * w0 / a.shape[1]); w = round(w0 * kx); a = np.array(Image.fromarray(a).resize((w, h), Image.LANCZOS))   # kx — небольшая подгонка только по ширине
    if jpx is None:   # линия «стена-пол»: самый сильный горизонтальный перепад в нижней трети (по центру кадра)
        g = a[:, w // 4: w * 3 // 4].astype(float).mean(axis=(1, 2)); d = np.abs(np.convolve(g, [1, 1, 1, 0, -1, -1, -1], 'same'))
        lo, hi = int(h * 0.74), int(h * 0.90); jpx = lo + int(np.argmax(d[lo:hi]))
    out = np.zeros((RH, w, 3), np.uint8); y0 = JUNC - jpx; CB = max(8, int(h * 0.12))   # CB — потолочная полоса кадра
    for y in range(RH):
        s = y - y0
        if y0 > 0 and y < y0 + CB: out[y] = a[int(y / (y0 + CB) * CB)]             # кадр ниже комнаты — его потолочная полоса растянута вверх до плиты
        elif s < 0: out[y] = a[0]
        elif s < h: out[y] = a[s]
        else: out[y] = (a[max(0, 2 * h - 2 - s)] * 0.7).astype(np.uint8)          # ниже кадра — зеркальное продолжение мокрого пола
    return out, jpx


def load_well(name):
    fn, flip = WELLS[name]; im = Image.open(os.path.join(SRC, fn)).convert('RGB')
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    a = np.array(im.resize((WELLW, FH * 2), Image.LANCZOS))
    return np.vstack([np.repeat(a[:1], WELLDY, 0), a[:-WELLDY]])   # кадр клетки опущен: её полы и низ дверей встают на уровень полов комнат


def concrete(th):
    """бесшовная бетонная полоса толщиной th px из кадра Flow v4_slab_0.jpg (плита в разрезе на пурпуре), зеркальный повтор по длине.
    Фоновая: тёмная, малоконтрастная, без цвета и бликов — не должна привлекать внимание"""
    a = key(Image.open(os.path.join(SRC, 'v4_slab_0.jpg'))); ys = np.where((a[..., 3] > 128).mean(axis=1) > 0.9)[0]; a = a[ys.min() + 40:ys.max() - 40, :, :3]
    k = 0.14; im = np.array(Image.fromarray(a).resize((round(a.shape[1] * k), round(a.shape[0] * k)), Image.LANCZOS)).astype(float)
    g = im.mean(axis=2); g = 19 + (g - g.mean()) * 0.12; strip = np.dstack([g * 0.95, g, g * 1.06])[:th].clip(0, 255).astype(np.uint8)
    strip[0] = (strip[0] * 0.6).astype(np.uint8); strip[-1] = (strip[-1] * 0.6).astype(np.uint8)
    return np.hstack([strip, strip[:, ::-1]])


def floors():
    zsum = {f: sum(ZOOM[s] * ZK for s in segs if isinstance(s, int)) for f, segs in FLOORS.items()}
    inner = round((zsum[2] + zsum[3]) / 2 * RW); outer = round((zsum[1] + zsum[4]) / 2 * RW)    # px: сумма комнат этажей 2-3 и этажей 1, 4 (среднее; подгонка — только по ширине)
    CONC = concrete(SLABH * 2); wells = {k: load_well(k) for k in WELLS}; wpx = outer + WELLW; off = wpx - (2 * WELLW + inner); rows = []; occ = []
    for f, segs in FLOORS.items():
        target = inner if f in (2, 3) else outer; kx = target / (zsum[f] * RW)
        o = np.full((FH, wpx, 3), 9, np.uint8); x = off if f in (2, 3) else 0; row = []; oc = []; nrooms = [s for s in segs if isinstance(s, int)]
        for s in segs:
            if isinstance(s, int):
                z = ZOOM[s] * ZK; im, jpx = load_room(s, z, kx=kx); w = im.shape[1]
                if s == nrooms[-1]:   # последняя комната добирает ширину до клетки (ошибка округления, 1-2 px)
                    w2 = (wpx - WELLW) - x; im = im[:, :w2] if w >= w2 else np.pad(im, ((0, 0), (0, w2 - w), (0, 0)), 'edge'); w = w2
                o[SLAB:, x:x + w] = im; jl, jr = [round(q * z * kx) for q in JAMB[s]]
                if s == 41: roof_open(z, jpx, x, kx)
            else:
                z = 1.0; w = WELLW; top = s[1] == '1'; o[:, x:x + w] = wells[s[0]][(0 if top else FH):(FH if top else FH * 2)]
                jl, jr = (0, WJAMB[s]) if x < wpx // 2 else (WJAMB[s], 0)   # клетка у левого торца (зеркальная) — проём справа, у правого — слева
            if jl: oc.append([x / 2, jl / 2])
            if jr: oc.append([(x + w - jr) / 2, jr / 2])
            row.append([x / 2, w / 2, round(z, 4)]); x += w
        for (rx, rw, _), s in zip(row, segs):   # бетонное перекрытие: над комнатами и над верхней половиной клетки (внутри клетки, между её этажами, плиты нет)
            if isinstance(s, int) or s[1] == '1': x0, x1 = int(rx * 2), int((rx + rw) * 2); o[:SLABH * 2, x0:x1] = np.tile(CONC, (1, (x1 - x0) // CONC.shape[1] + 2, 1))[:, x0 % CONC.shape[1]:x0 % CONC.shape[1] + (x1 - x0)]
        Image.fromarray(o).save(os.path.join(OUT, 'fl%d.png' % f), optimize=True); rows.append(row); occ.append(oc); print('fl%d.png' % f, [r[:2] for r in row])
    SIZES['_lay'] = {'w': wpx / 2, 'rows': rows, 'occ': occ}
    cw, ch = WALLW * 2, FH; w = np.rot90(concrete(cw), 3); base = np.tile(w, (ch // w.shape[0] + 2, 1, 1))[:ch]   # стена-перегородка: тот же бетон, вертикально — поверх персонажей
    Image.fromarray(np.dstack([np.ascontiguousarray(base), np.full((ch, cw), 255, np.uint8)]), 'RGBA').save(os.path.join(PR, 'wall.png'), optimize=True); SIZES['wall'] = [cw / 2, ch / 2]


def roof_open(z, jpx, x, kx=1.0):
    """та же дверь на крышу, но распахнутая (кадр Flow «Recreate EXACTLY, ONLY change») — заплатка поверх комнаты 41"""
    a = load_room(41, z, 'v4_r41open_0.jpg', jpx, kx)[0]; w = a.shape[1]; x0, x1, y0, y1 = round(w * 0.40), round(w * 0.75), 70, RH
    n, m = y1 - y0, x1 - x0; k = np.ones((n, m)); k *= np.clip(np.minimum(np.arange(m) + 1, m - np.arange(m)) / 10.0, 0, 1)[None, :]; k *= np.clip((np.arange(n) + 1) / 10.0, 0, 1)[:, None]
    Image.fromarray(np.dstack([a[y0:y1, x0:x1], (k * 255).astype(np.uint8)]), 'RGBA').save(os.path.join(OUT, 'roofopen.png'), optimize=True)
    SIZES['_roofopen'] = [(x + x0) / 2, (SLAB + y0) / 2, m / 2, n / 2]


def cut(sheet, items, soft=False):
    a = key(Image.open(os.path.join(SRC, sheet)), soft=soft)
    for name, (x0, y0, x1, y1), h in items:
        p = a[y0:y1, x0:x1]; ys, xs = np.where(p[..., 3] > 40); p = p[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        k = h * 2 / p.shape[0]; im = Image.fromarray(np.ascontiguousarray(p), 'RGBA').resize((max(1, round(p.shape[1] * k)), h * 2), Image.LANCZOS)
        im.save(os.path.join(PR, name + '.png'), optimize=True); SIZES[name] = [round(im.width / 2, 1), h]


def lasers():
    from scipy import ndimage as nd
    a = key(Image.open(os.path.join(SRC, 'v4_splaser_0.jpg'))); lab, n = nd.label(nd.binary_dilation(a[..., 3] > 40, iterations=5))
    bs = sorted([(x.start, y.start, x.stop, y.stop) for y, x in nd.find_objects(lab) if (y.stop - y.start) * (x.stop - x.start) > 5000])
    assert len(bs) == 4, bs
    cut('v4_splaser_0.jpg', [(nm, b, 26) for nm, b in zip(['las_top', 'las_bot', 'las_top_off', 'las_bot_off'], bs)])


if __name__ == '__main__':
    for f in os.listdir(PR): os.remove(os.path.join(PR, f))
    floors()
    cut('v4_sphide_0.jpg', [('cab0', (21, 13, 372, 376), 82), ('cab1', (484, 13, 794, 376), 82), ('cab2', (872, 13, 1293, 376), 82),
        ('door0', (18, 392, 226, 731), 88), ('door1', (488, 392, 741, 748), 92), ('door2', (956, 392, 1274, 754), 94)])
    cut('v4_spfront_0.jpg', [('crates', (25, 93, 308, 346), 50), ('barrels', (340, 104, 556, 336), 46), ('barrier', (589, 134, 877, 338), 36), ('handcart', (907, 88, 1100, 349), 52),
        ('spool', (1130, 127, 1352, 333), 42), ('gas', (34, 419, 247, 692), 56), ('sacks', (281, 480, 549, 674), 36), ('rail', (573, 488, 851, 670), 38),
        ('laundry', (878, 447, 1100, 684), 46), ('toolbox', (1140, 470, 1353, 686), 44)])
    cut('v4_spnear_0.jpg', [('cables', (805, 6, 1164, 562), 96)])
    cut('v4_spcoll_0.jpg', [('badge', (20, 90, 335, 630), 20), ('can', (340, 110, 690, 650), 18), ('kefir', (700, 10, 985, 750), 22), ('roll', (990, 160, 1360, 630), 16)])   # награды и пасхалки
    lasers()
    with open(os.path.join(OUT, '..', '..', 'js', 'l7v4_props.js'), 'w', encoding='utf-8') as f:
        f.write('// размеры спрайтов и раскладка цеха (лог. px), создаётся tools/l7v5_rooms.py\nwindow.V4_PROPS = ' + json.dumps({k: v for k, v in SIZES.items() if k[0] != '_'}, separators=(',', ':'))
                + ';\nwindow.V4_ROOFOPEN = ' + json.dumps(SIZES['_roofopen']) + ';\nwindow.V4_LAY = ' + json.dumps(SIZES['_lay'], separators=(',', ':')) + ';\n')
    print(len(SIZES), 'записей')
    if '--debug' in sys.argv:   # всё здание одной картинкой — для проверки стыков
        ims = [Image.open(os.path.join(OUT, 'fl%d.png' % f)) for f in range(1, 5)]; S = Image.new('RGB', (ims[0].width, FH * 4))
        for f, im in enumerate(ims): S.paste(im, (0, (3 - f) * FH))
        S.resize((S.width // 2, S.height // 2), Image.LANCZOS).save(os.path.join(SRC, '_v5_building.jpg'), quality=88)
