# ЗАВОДОУПРАВЛЕНИЕ v5 (карта F): здание в разрезе, 4 этажа, комнаты РАЗНОЙ площади. Одна комната = один кадр Flow (стиль finestyle.jpg).
#   art_src/l7/v4_aNM_K.jpg — комната M этажа N: 16:9 (широкая), 4:3 (средняя), 1:1 (тесная, ниже потолок — над ней бетон);
#   v4_aw[abc]_K.jpg — лестничные клетки 9:16 сразу на два этажа (схема refwell.png). Промпты — tools/p7v4/flowA.js.
# Сборка -> assets/l7v4/af1..4.png (полосы этажей), assets/l7v4/pa/*.png (спрайты), mgp.jpg / mgk.jpg / aboss.jpg, js/l7v4_adm_props.js.
# Масштаб: 2 px = 1 лог. px, шаг этажей 190. Комната масштабируется так, чтобы боковой проём был ~96 лог. px (H — высота кадра в лог. px).
#   4: клетка A (верх) | 42 умывальная | 43 пост охраны | 44 архив | 45 крыша снаружи
#   3: клетка A (низ)  | 32 бойлерная | 33 столовая | 34 комната отдыха | клетка B (верх)
#   2: клетка C (верх) | 22 галерея | 23 бухгалтерия | 24 серверная | клетка B (низ)
#   1: клетка C (низ)  | 12 приёмная | 15 гардероб | 13 кабинет директора | 14 лифтовой холл
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from l7v4_stairs import key, SRC, OUT
from l7v5_rooms import concrete

SLAB, JROW, FH = 20, 322, 380                     # px: отступ под плиту, строка «стена-пол» в полосе этажа, высота полосы
SLABH, WALLW, WELLW, WELLDY = 14, 8, 352, 28
WCX0, WCW = 88, 637   # из кадра клетки берём столбцы WCX0..WCX0+WCW: без своей двери (проход — проём соседней комнаты) и без тёмных полей у наружного края
# комната: файл кадра и высота кадра в лог. px. Высота = 92 / (доля высоты кадра, занятая боковым проёмом; замер по art_src/l7/_a_doors.jpg),
# поэтому проёмы ВСЕХ комнат одной высоты (~92 лог. px), а сами комнаты разной площади; лишний потолок уходит под плиту.
FILES = {42: 'nla42_0', 43: 'a43_1', 47: 'a47_1', 46: 'a46_1', 41: 'lb41w_0', 48: 'a48_0', 44: 'nla44_0',
         32: 'a32_1', 35: 'a35_1', 34: 'nla34_0', 33: 'nla33_0', 31: 'lb31w_0', 36: 'a36_0',
         22: 'a22_1', 25: 'a25r_0', 23: 'nla23_0', 24: 'nla24_0', 21: 'lb21_0', 26: 'a26r_1',
         12: 'nla12_0', 17: 'a17_0', 15: 'nla15_0', 13: 'nla13_0', 11: 'lb11_1', 16: 'a16_1', 14: 'nla14_0'}
HT = {42: 148, 43: 174, 47: 148, 46: 177, 41: 170, 48: 148, 44: 148, 32: 159, 35: 180, 34: 196, 33: 164, 31: 167, 36: 184,
      22: 167, 25: 204, 23: 161, 24: 164, 21: 177, 26: 192, 12: 170, 17: 174, 15: 144, 13: 148, 11: 151, 16: 192, 14: 164}
HT.update({25: 181, 26: 168, 22: 196, 12: 174, 17: 181, 15: 153, 11: 148, 16: 168, 14: 173, 23: 159, 24: 165, 21: 185, 32: 156, 35: 167, 34: 208, 33: 170, 31: 167, 36: 185, 42: 144, 43: 159, 47: 148, 46: 193, 41: 164, 48: 161, 44: 157})   # по замеру критика: проём 92 px, низ на линии пола
JFIX = {25: 0.813, 26: 0.886, 22: 0.749, 12: 0.837, 17: 0.803, 15: 0.858, 11: 0.861, 16: 0.854, 14: 0.787, 23: 0.840, 24: 0.915, 21: 0.777, 32: 0.887, 35: 0.825, 34: 0.763, 33: 0.845, 31: 0.873, 36: 0.774, 42: 0.878, 43: 0.862, 47: 0.867, 46: 0.777, 41: 0.856, 48: 0.784, 44: 0.811}   # доля высоты кадра до низа проёма (линия пола) — задано всем, автопоиск ловил край ковра/плинтус
ROOMS = {n: (0, HT[n], JFIX.get(n)) for n in FILES}
# запертые комнаты: кадр с закрытыми дверями (та же комната, «Recreate EXACTLY») — полоса этажа собирается дважды: afN.png (заперто) и afN_open.png
SHUT = {13: 'v4_a13shut_0.jpg', 46: 'v4_a46shut_0.jpg'}
# лифтовые холлы с открытыми дверями лифта (кабина) — заплатка на время поездки: lift<этаж>.png
LOPEN = {11: 'v4_lo11_0.jpg', 21: 'v4_lo21_1.jpg', 31: 'v4_lo31_0.jpg', 41: 'v4_lo41_0.jpg'}
OPENED = set()
FN = lambda n: SHUT[n] if n in SHUT and n not in OPENED else 'v4_%s.jpg' % FILES[n]
NOJAMB = {44: 'R', 14: 'R'}                       # глухие стороны (нет проёма)
DOORF = {11: (0.36, 0.64, 0.30, 0.80), 21: (0.375, 0.635, 0.33, 0.74), 31: (0.41, 0.60, 0.36, 0.79), 41: (0.385, 0.615, 0.36, 0.78)}   # створки лифта в кадре холла: x0, x1, y0, y1 (доли)
LIFTS = (11, 21, 31, 41)                          # лифтовые холлы: одна шахта — ЦЕНТР холла на всех этажах на XC
WELLS = {'A': ('v4_nlawa_0.jpg', True), 'B': ('v4_awb_1.jpg', False), 'C': ('v4_awc_1.jpg', True)}   # файл, зеркально (клетка у левого торца)
FLOORS = {1: ['C0', 12, 17, 15, 13, 11, 16, 14], 2: ['C1', 22, 25, 23, 24, 21, 26, 'B0'], 3: ['A0', 32, 35, 34, 33, 31, 36, 'B1'], 4: ['A1', 42, 43, 47, 46, 41, 48, 44]}
PA = os.path.join(OUT, 'pa'); os.makedirs(PA, exist_ok=True)
SIZES = {}
if os.environ.get('ADM_PICK'): ROOMS.update(json.loads(os.environ['ADM_PICK']))


JF = {}   # строка «стена-пол», найденная на первом проходе (у «запертого» и «открытого» кадров одна и та же)


def load_room(n, kx=1.0):
    v, hlog, jf = ROOMS[n]; jf = JF.get(n, jf)
    a = np.array(Image.open(os.path.join(SRC, FN(n))).convert('RGB'))
    ys = np.where(a.max(axis=(1, 2)) > 26)[0]; a = a[ys.min():ys.max() + 1]
    h = hlog * 2; w = round(a.shape[1] * h / a.shape[0] * kx); a = np.array(Image.fromarray(a).resize((w, h), Image.LANCZOS))
    if jf is None:
        g = a[:, w // 4: w * 3 // 4].astype(float).mean(axis=(1, 2)); d = np.abs(np.convolve(g, [1, 1, 1, 0, -1, -1, -1], 'same'))
        lo, hi = int(h * 0.74), int(h * 0.92); jpx = lo + int(np.argmax(d[lo:hi]))
    else: jpx = round(h * jf)
    JF[n] = jpx / h
    out = np.zeros((FH, w, 3), np.uint8); y0 = JROW - jpx; top = max(0, y0)
    for y in range(FH):
        s = y - y0
        if s < 0: continue
        out[y] = a[s] if s < h else (a[max(0, 2 * h - 2 - s)] * 0.7).astype(np.uint8)     # ниже кадра — зеркальное продолжение пола
    return out, top


def load_well(name):
    fn, flip = WELLS[name]; im = Image.open(os.path.join(SRC, fn)).convert('RGB')
    a = np.array(im.crop((WCX0, 0, WCX0 + WCW, im.height)).resize((WELLW, FH * 2), Image.LANCZOS))
    a = np.vstack([np.repeat(a[:1], WELLDY, 0), a[:-WELLDY]])
    return a[:, ::-1] if flip else a


def well_profile(name):
    """высота проступи под ногой по красной дорожке (лог. px над полом нижнего этажа), шаг 2 лог. px по lx (0 — сторона проёмов, кадр не зеркальный)"""
    a = np.array(Image.open(os.path.join(SRC, WELLS[name][0])).convert('RGB')).astype(int); WS = 380 / 1376
    red = (a[..., 0] > 120) & (a[..., 1] < 75) & (a[..., 2] < 75) & (a[..., 0] > a[..., 1] * 2)
    red = nd.binary_opening(red, np.ones((3, 5)))
    HY = lambda y: (1321 - y) * WS - WELLDY / 2
    def top(x0, x1, y0, y1):
        ys = np.where(red[y0:y1, x0:x1].any(axis=1))[0]; return (y0 + ys.min()) if len(ys) else None
    xs = list(range(WCX0, WCX0 + WCW, 7)); low = []; upp = []
    land = top(540, 640, 900, 1000); landH = HY(land)
    for x in xs:
        t = top(x, x + 7, land - 4, 1290) if 225 <= x <= 640 else None; low.append(HY(t) if t is not None else None)
        t = top(x, x + 7, 540, land - 30) if 200 <= x <= 620 else None; upp.append(HY(t) if t is not None else None)
    lo = []; h = 0.0
    for v in low: h = max(h, min(v, landH) if v is not None else h); lo.append(round(h, 1))        # нижний марш: растёт вправо
    topH = max(v for v in upp if v is not None); up = [None] * len(xs); h = landH
    for i in range(len(xs) - 1, -1, -1): h = max(h, upp[i] if upp[i] is not None else h); up[i] = round(min(h, 190.0) if h < topH - 3 else 190.0, 1)   # верхний марш: растёт влево, наверху — пол этажа
    foot = (next(xs[i] for i, v in enumerate(lo) if v > 2) - WCX0) * WS; ltop = (next(xs[i] for i, v in enumerate(lo) if v >= landH - 1) - WCX0) * WS
    utop = (max(xs[i] for i, v in enumerate(up) if v >= 190.0) - WCX0) * WS; u0 = (max(xs[i] for i, v in enumerate(up) if v > landH + 3) - WCX0) * WS
    return {'dx': round(7 * WS, 3), 'low': lo, 'upp': up, 'land': round(landH, 1), 'foot': round(foot, 1), 'ltop': round(ltop, 1), 'u0': round(u0, 1), 'utop': round(utop, 1)}


def floors(tag=''):
    CONC = concrete(SLABH * 2); CW = CONC.shape[1]; wells = {k: load_well(k) for k in WELLS}
    def conc(o, x0, x1, y0, y1):
        if x1 > x0 and y1 > y0: o[y0:y1, x0:x1] = np.tile(CONC, ((y1 - y0) // CONC.shape[0] + 2, (x1 - x0) // CW + 2, 1))[:y1 - y0, x0 % CW:x0 % CW + (x1 - x0)]
    def width(n, fn=None): hlog = ROOMS[n][1]; im = Image.open(os.path.join(SRC, fn or FN(n))); a = np.array(im.convert('L')); ys = np.where(a.max(axis=1) > 26)[0]; return im.width * hlog * 2 / (ys.max() - ys.min() + 1)
    XC = 2470; wpx = 3580; rows = []; occ = []; lifts = {}          # px: центр шахты лифта, ширина здания
    for f, segs in FLOORS.items():
        li = next(i for i, s in enumerate(segs) if s in LIFTS); LW = int(round(width(segs[li]) / 2) * 2); XL = XC - LW // 2
        pre = [s for s in segs[:li] if isinstance(s, int)]; post = [s for s in segs[li + 1:] if isinstance(s, int)]; wr = WELLW if isinstance(segs[-1], str) else 0
        k1 = (XL - WELLW) / sum(width(s) for s in pre); k2 = min(1.06 if not wr else 1.25, (wpx - XL - LW - wr) / sum(width(s) for s in post))
        o = np.full((FH, wpx, 3), 9, np.uint8); x = 0; row = []; oc = []
        for i, s in enumerate(segs):
            if isinstance(s, int):
                im, top = load_room(s, k1 if i < li else 1.0 if i == li else k2); w = im.shape[1]
                w2 = (XL - x) if s == pre[-1] else LW if i == li else (wpx - wr - x) if (s == post[-1] and abs(wpx - wr - x - w) < 6) else w        # добор 1-2 px округления
                im = im[:, :w2] if w >= w2 else np.pad(im, ((0, 0), (0, w2 - w), (0, 0)), 'edge'); w = w2
                o[:, x:x + w] = im; conc(o, x, x + w, 0, max(SLABH * 2, top))          # над низкой комнатой — бетон до плиты
                j = max(8, round(w * 0.045)); nj = NOJAMB.get(s, '')
                if 'L' not in nj: oc.append([x / 2, j / 2])
                if 'R' not in nj: oc.append([(x + w - j) / 2, j / 2])
                row.append([x / 2, w / 2, ROOMS[s][1], round(max(SLABH * 2, top) / 2, 1)])
                if i == li and not tag: lifts[f] = (s, x, w, top)
            else:
                w = WELLW; topf = s[1] == '1'
                if x > 0 and x != wpx - w:   # клетка у правого торца всегда стоит вплотную к краю здания: добор — краем соседней комнаты
                    nx = wpx - w
                    if nx > x: o[:, x:nx] = o[:, x - 1:x]
                    row[-1][1] += (nx - x) / 2; x = nx
                wl = wells[s[0]][(0 if topf else FH):(FH if topf else FH * 2)].astype(float)
                g = np.ones(w); n = 80; ramp = np.linspace(0.5, 1.0, n); g[:n] = ramp   # пол и стены клетки темнеют к шву с комнатой (тень простенка, нет скачка цвета)
                if x == 0: g = g[::-1]
                o[:, x:x + w] = (wl * g[None, :, None]).astype(np.uint8)
                if topf: conc(o, x, x + w, 0, 50)        # тёмное поле кадра над потолком клетки — бетон плиты
                row.append([x / 2, w / 2, 0, 0])          # своей полосы «поверх персонажей» у клетки нет (она обрезала героя на площадке)
            x += w
        if x < wpx - 4:   # этаж короче здания: за торцевой стеной — улица (крыша соседнего крыла под дождём, кадр a45 без молний)
            e = np.array(Image.open(os.path.join(SRC, 'v4_nla45_0.jpg')).convert('RGB')); h = FH; e = np.array(Image.fromarray(e).resize((round(e.shape[1] * h / e.shape[0]), h), Image.LANCZOS)); o[:, x:] = e[:, :wpx - x]
        if not tag or any(s in SHUT for s in segs): Image.fromarray(o).save(os.path.join(OUT, 'af%d%s.png' % (f, tag)), optimize=True)
        rows.append(row); occ.append(oc); print('af%d%s.png' % (f, tag), 'k=%.3f/%.3f' % (k1, k2), 'end', x / 2, [r[:2] for r in row])
    if tag: return
    SIZES['_lay'] = {'w': wpx / 2, 'xc': XC / 2, 'rows': rows, 'occ': occ, 'segs': [FLOORS[f] for f in sorted(FLOORS)], 'wells': {k: well_profile(k) for k in WELLS}, 'flip': {k: v[1] for k, v in WELLS.items()}, 'wellw': WELLW / 2}
    # двери лифта: створки (левая и правая половины проёма из кадра холла) и кабина за ними (из кадра «двери открыты»)
    doors = {}
    for f, (s, x, w, top) in lifts.items():
        a, _ = load_room(s); h = ROOMS[s][1] * 2; yy = JROW - round(JF[s] * h); fx0, fx1, fy0, fy1 = DOORF[s]   # створки — по долям кадра холла
        x0, x1, y0, y1 = round(w * fx0), round(w * fx1), max(SLABH * 2, yy + round(h * fy0)), yy + round(h * fy1)
        Image.fromarray(a[y0:y1, x0:x1]).save(os.path.join(OUT, 'liftd%d.png' % f), optimize=True)
        if os.path.isfile(os.path.join(SRC, LOPEN[s])):
            fn0 = FILES[s]; FILES[s] = LOPEN[s][3:-4]; b, _ = load_room(s); FILES[s] = fn0; Image.fromarray(b[y0:y1, x0:x1]).save(os.path.join(OUT, 'liftc%d.png' % f), optimize=True)
        doors[f] = [(x + x0) / 2, y0 / 2, (x1 - x0) / 2, (y1 - y0) / 2]; print('лифт', f, doors[f])
    SIZES['_lay']['lift'] = [doors[f] for f in sorted(doors)]


def autocut(sheet, names, hs, minarea=6000, dil=6, boxes=None):
    """спрайты листа на пурпуре: связные области по порядку чтения (ряды сверху вниз, слева направо) или заданные рамки (y0, x0, y1, x1)"""
    a = key(Image.open(os.path.join(SRC, sheet))); lab, n = nd.label(nd.binary_dilation(a[..., 3] > 40, iterations=dil))
    bs = boxes or [(y.start, x.start, y.stop, x.stop) for y, x in nd.find_objects(lab) if (y.stop - y.start) * (x.stop - x.start) > minarea]
    if not boxes: bs.sort(key=lambda b: (round((b[0] + b[2]) / 2 / (a.shape[0] / 2.2)), b[1]))
    assert len(bs) == len(names), (sheet, len(bs), bs)
    for nm, (y0, x0, y1, x1), h in zip(names, bs, hs if isinstance(hs, list) else [hs] * len(names)):
        if not nm: continue
        p = a[y0:y1, x0:x1]; ys, xs = np.where(p[..., 3] > 40); p = p[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        k = h * 2 / p.shape[0]; im = Image.fromarray(np.ascontiguousarray(p), 'RGBA').resize((max(1, round(p.shape[1] * k)), h * 2), Image.LANCZOS)
        im.save(os.path.join(PA, nm + '.png'), optimize=True); SIZES[nm] = [round(im.width / 2, 1), h]


def fit(src, dst, w=1280):
    im = Image.open(os.path.join(SRC, src)).convert('RGB'); im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(os.path.join(OUT, dst), quality=92)


if __name__ == '__main__':
    floors(); OPENED.update(SHUT); floors('_open')
    Z = np.array(Image.open(os.path.join(SRC, 'v4_asleep_0.jpg')).convert('RGB')); Z[130:236, 680:800] = (255, 0, 255); Image.fromarray(Z).save(os.path.join(SRC, '_asleep_nozzz.png'))   # «Zzz» рисует игра
    autocut('_asleep_nozzz.png', ['sleep0', 'sleep1', 'chair'], [64, 64, 45], boxes=[(150, 95, 600, 520), (150, 535, 600, 960), (280, 990, 600, 1240)])
    autocut('v4_acards_0.jpg', ['card_b', 'card_r', 'card_g', 'card_y'], 11, boxes=[(30, 95, 380, 495), (30, 505, 380, 905), (380, 505, 750, 905), (380, 915, 750, 1315)])
    autocut('v4_ahide_0.jpg', ['acab0', 'acab1', 'acab2'], 90, boxes=[(0, 190, 384, 480), (0, 530, 384, 822), (0, 836, 384, 1200)])
    autocut('v4_afront_0.jpg', ['ficus', 'anchor', 'armchair', 'trolley', 'cooler', 'boxes', 'globe', 'luggage'], [62, 58, 52, 56, 54, 44, 54, 56])
    autocut('v4_awater_0.jpg', ['jet0', 'jet1', 'puddle', 'splash'], [150, 150, 14, 22])
    autocut('v4_amgt_1.jpg', ['pipe_s', 'pipe_e', 'pipe_x', 'pipe_v', 'pipe_g', 'pick'], [22, 44, 44, 44, 44, 60], minarea=3000)
    fit('v4_amgp_1.jpg', 'mgp.jpg', 860); fit('v4_amgk2_1.jpg', 'mgk.jpg', 860); fit('v4_amgs_1.jpg', 'mgs.jpg', 860); fit('v4_afhall_0.jpg', 'afhall.jpg', 1280); fit('v4_liftp2_0.jpg', 'liftp.jpg', 800); fit('v4_aboss4_1.jpg', 'aboss.jpg', 1376)   # фон финального зала
    with open(os.path.join(OUT, '..', '..', 'js', 'l7v4_adm_props.js'), 'w', encoding='utf-8') as f:
        f.write('// размеры спрайтов и раскладка заводоуправления (лог. px), создаётся tools/l7v5_adm.py\nwindow.V4_APROPS = ' + json.dumps({k: v for k, v in SIZES.items() if k[0] != '_'}, separators=(',', ':'))
                + ';\nwindow.V4_LAYF = ' + json.dumps(SIZES['_lay'], separators=(',', ':')) + ';\n')
    print(len(SIZES), 'записей')
    if '--debug' in sys.argv:
        ims = [Image.open(os.path.join(OUT, 'af%d.png' % f)) for f in range(1, 5)]; S = Image.new('RGB', (ims[0].width, FH * 4))
        for f, im in enumerate(ims): S.paste(im, (0, (3 - f) * FH))
        S.resize((S.width // 2, S.height // 2), Image.LANCZOS).save(os.path.join(SRC, '_adm_building.jpg'), quality=88)
