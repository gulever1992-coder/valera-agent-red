# Риг Семёна АНФАС (фаза 3, по пузо в море): потрёпанный после фаз 1–2. Канон — art_src/l10/rig3/dmg/al/base.png (784x1325).
# Слои Flow выровнены tools/p10/rig/align3.py. Тело без рук — одна сетка с весами костей (торс/голова/брюхо),
# паучьи лапы за спиной (две группы), руки — висящая рука Flow (вторая — зеркально) + кисти-спрайты (ладонь/кулак),
# пасть и горящие глаза — оверлеи головы, миниган в металлической руке — своя кость, погоны поверх рук, шланг — лента.
# Выход: assets/l10/rig30.png + js/rig30_data.js (L10.RIG3). Запуск: py tools/p10/rig/build_rig3.py [--debug]
import sys, os, json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd

S = 'art_src/l10/rig3/dmg/al/'
DBG = '--debug' in sys.argv
ld = lambda n: np.asarray(Image.open(S + n + '.png').convert('RGB')).astype(float)
BASE, NOA, LEGS, MOUTH, EYES, GUN, ARM = [ld(n) for n in ['base', 'noarms', 'legs', 'mouth', 'eyes', 'gun', 'armL']]
H, W = BASE.shape[:2]
yy, xx = np.mgrid[0:H, 0:W]

def fg(a, t=236):
    m = (a.min(2) < t) | ((a.max(2) - a.min(2)) > 24)
    m = nd.binary_closing(nd.binary_opening(m, iterations=1), iterations=2)
    holes = nd.binary_fill_holes(m) & ~m; lb, n = nd.label(holes)
    if n: sz = nd.sum(holes, lb, range(1, n + 1)); m |= np.isin(lb, 1 + np.nonzero(sz < 150)[0])
    return m
def poly(pts, w=W, h=H):
    im = Image.new('L', (w, h), 0); ImageDraw.Draw(im).polygon([tuple(p) for p in pts], fill=255); return np.asarray(im) > 0
def big(m, k=1):
    lb, n = nd.label(m)
    if not n: return m
    sz = nd.sum(m, lb, range(1, n + 1)); return np.isin(lb, 1 + np.argsort(-sz)[:k])
def alpha(a, m, soft=1.0):
    f = np.clip(nd.gaussian_filter(m.astype(float), soft) * 1.7, 0, 1)
    w = np.clip((246 - a.min(2)) / 24, 0, 1)
    return f * np.maximum(w, nd.binary_erosion(m, iterations=3))

CX = 382     # ось симметрии тела (между плечами)
J = dict(root=(CX, 830), neck=(380, 560), head=(380, 430), spL=(355, 330), spR=(410, 330), belly=(385, 760),
         sh=(190, 482), el=(146, 640), wr=(112, 830), tip=(100, 990), hose=(392, 772), mgp=(398, 330),
         water=820, top=60)
J['sh2'], J['el2'], J['wr2'], J['tip2'] = [(2 * CX - p[0], p[1]) for p in (J['sh'], J['el'], J['wr'], J['tip'])]
BONES = ['id', 'root', 'torso', 'head', 'spL', 'spR', 'belly', 'uarm', 'farm', 'hand', 'uarm2', 'farm2', 'hand2', 'gun'] + ['lk%d%s' % (i, c) for i in range(4) for c in 'abcd']
BI = {b: i for i, b in enumerate(BONES)}
HEADP = [(250, 110), (545, 110), (548, 330), (512, 430), (470, 545), (300, 545), (262, 430), (240, 330)]
# правки владельца из конструктора (tools/p10/sea3/editor.html, вкладки «Арт» и «Риг»): маски слоёв, суставы, области
EDIT = 'art_src/l10/rig3/edit/'; os.makedirs(EDIT + 'layers', exist_ok=True)
OV = json.load(open(EDIT + 'overrides.json', encoding='utf-8')) if os.path.exists(EDIT + 'overrides.json') else {}
OVJ = {k: tuple(map(int, v)) for k, v in OV.get('J', {}).items()}
R_PTS = {'head': HEADP, 'belly': [(250, 690), (520, 690), (540, 980), (230, 980)],
         'mouth': [(262, 330), (512, 330), (520, 470), (495, 640), (430, 700), (330, 700), (270, 640), (255, 470)],
         # четыре лапы, которые тянутся к станциям: 0 — левая верхняя (с крюком), 1 — левая внешняя, 2 и 3 — то же справа
         'lg0': [(195, 92), (292, 92), (292, 140), (264, 168), (264, 300), (302, 360), (348, 440), (348, 485), (298, 485), (248, 382), (203, 300), (198, 150)],
         'lg1': [(14, 330), (68, 318), (118, 236), (172, 226), (252, 246), (262, 292), (172, 292), (112, 332), (80, 362), (92, 612), (40, 628), (16, 606), (10, 380)]}
R_PTS['lg2'] = [(2 * CX - x, y) for x, y in R_PTS['lg0']]; R_PTS['lg3'] = [(2 * CX - x, y) for x, y in R_PTS['lg1']]
J.update({'lgR0': (322, 455), 'lgT0': (262, 108), 'lgR1': (246, 268), 'lgT1': (56, 606)})
J.update({'lgR2': (2 * CX - 322, 455), 'lgT2': (2 * CX - 262, 108), 'lgR3': (2 * CX - 246, 268), 'lgT3': (2 * CX - 56, 606)})
for k, v in OV.get('R', {}).items(): R_PTS[k] = [tuple(map(int, q)) for q in v]
HEADP = R_PTS['head']
J.update(OVJ)

# ---- сетка с весами
STEP = 12
def mesh(mask, labels=None, fixed=None, sigma=16):
    H, W = mask.shape     # своя сетка для любого холста (лапы — в своих координатах)
    g = nd.binary_dilation(mask, iterations=STEP)
    gx = np.arange(0, W + STEP, STEP); gy = np.arange(0, H + STEP, STEP); nx, ny = len(gx), len(gy)
    maps = {int(b): nd.gaussian_filter((labels == b).astype(float) * mask, sigma) for b in np.unique(labels[mask])} if labels is not None else {}
    vid = -np.ones((ny, nx), int); V = []; T = []
    def vert(i, j):
        if vid[j, i] >= 0: return vid[j, i]
        x, y = float(gx[i]), float(gy[j])
        if fixed is not None: ws = fixed(x, y)
        else:
            xi, yi = min(int(x), W - 1), min(int(y), H - 1); ws = {b: m[yi, xi] for b, m in maps.items()}
            if sum(ws.values()) < 1e-4: ws = {int(labels[yi, xi]): 1.0}
        top = sorted(ws.items(), key=lambda kv: -kv[1])[:3]; s = sum(w for _, w in top) or 1
        top = [(b, w / s) for b, w in top] + [(0, 0.0)] * (3 - len(top))
        vid[j, i] = len(V); V.append([x, y] + [int(b) for b, _ in top] + [round(float(top[0][1]), 3), round(float(top[1][1]), 3)]); return vid[j, i]
    for j in range(ny - 1):
        for i in range(nx - 1):
            x0, y0 = gx[i], gy[j]
            if g[min(y0 + STEP // 2, H - 1), min(x0 + STEP // 2, W - 1)] or g[min(y0, H - 1), min(x0, W - 1)]:
                a, b, c, d = vert(i, j), vert(i + 1, j), vert(i + 1, j + 1), vert(i, j + 1); T += [a, b, c, a, c, d]
    return V, T

layers = {}; imgs = {}; SRC = {}
def layer(name, a, m, soft=1.0, amul=None, **kw):
    SRC[name] = a; ADD = None
    if os.path.exists(EDIT + name + '_add.png'): ADD = (np.asarray(Image.open(EDIT + name + '_add.png').convert('RGBA').resize((W, H)))[..., 3] > 127) & fg(a); m = m | ADD     # кисть «вернуть из исходника»
    if os.path.exists(EDIT + name + '_erase.png'):     # ластик (сильнее кисти)
        ER = np.asarray(Image.open(EDIT + name + '_erase.png').convert('RGBA').resize((W, H)))[..., 3] > 127; m = m & ~ER
        if ADD is not None: ADD &= ~ER
        if amul is not None: amul = np.where(ER, 0, amul)
    if ADD is not None and amul is not None: amul = np.maximum(amul, ADD.astype(float))
    al = np.clip((alpha(a, m, soft) - 0.12) / 0.88, 0, 1)
    known = (al > 0.92) & (a.min(2) < 225); idx = nd.distance_transform_edt(~known, return_distances=False, return_indices=True)
    edge = al <= 0.92; a = a.copy(); a[edge] = a[idx[0], idx[1]][edge]     # без светлой каймы
    if amul is not None: al = al * amul
    ys, xs = np.nonzero(al > 0.01); x0, y0, x1, y1 = xs.min() - 2, ys.min() - 2, xs.max() + 3, ys.max() + 3
    imgs[name] = Image.fromarray(np.dstack([a, al * 255])[y0:y1, x0:x1].clip(0, 255).astype('uint8'))
    V, T = mesh(al > 0.01, **kw); layers[name] = {'o': [int(x0), int(y0)], 'V': V, 'T': T}
    return al

# ---- паучьи лапы за спиной: две группы (левая/правая), каждая качается вокруг своего корня
LM = big(fg(LEGS), 3); LG = []
for i in range(4):
    if 'lg%d' % i in OV.get('R', {}): R_PTS['lg%d' % i] = [tuple(map(int, q)) for q in OV['R']['lg%d' % i]]
    LG.append(big(poly(R_PTS['lg%d' % i]) & LM))     # только связный кусок — без обрывков соседних костей
for i in range(4): J.update({k: OVJ[k] for k in ('lgR%d' % i, 'lgT%d' % i) if k in OVJ})
rest = LM.copy()
for m in LG: rest &= ~m
layer('legs', LEGS, rest, labels=np.where(xx < CX, BI['spL'], BI['spR']).astype(np.int32), sigma=30)
# старые 4 длинные лапы (куски общего слоя) убраны — вместо них цельные лапы Flow ниже

# ---- паучьи лапы к станциям: цельные лапы Flow (art_src/l10/legs4), 4 кости: бедро a, голень b, предплюсна c, коготь d.
# Сетка — в своих координатах лапы (картинка x LEGK; левые лапы зеркальные), в игре корень R ставится в точку lgR<i> спины.
# Суставы R-K-A-W-T (корень, колено, лодыжка, основание когтя, кончик) — по картинке; правятся в LEGV.
LEGV = {'A': ('leg_n0', [(200, 430), (575, 110), (955, 440), (1110, 540), (1200, 725)]),     # тонкая
        'B': ('leg_n1', [(190, 470), (640, 140), (1060, 410), (1125, 445), (1280, 735)])}     # мощная
LEGK = 0.6; LEG_OF = ['A', 'B', 'A', 'B']     # 0,2 — верхние (к ближним станциям), 1,3 — нижние (к дальним)
LK = []
for i in range(4):
    nm, pts = LEGV[LEG_OF[i]]; src = Image.open('art_src/l10/legs4/%s.jpg' % nm).convert('RGB')
    if i < 2: src = src.transpose(Image.FLIP_LEFT_RIGHT); pts = [(src.width - 1 - x, y) for x, y in pts]
    src = src.resize((round(src.width * LEGK), round(src.height * LEGK)), Image.LANCZOS); pts = [(round(x * LEGK, 1), round(y * LEGK, 1)) for x, y in pts]
    a = np.asarray(src).astype(float); m = nd.binary_fill_holes(big(fg(a)))
    al = np.clip((alpha(a, m) - 0.12) / 0.88, 0, 1)
    known = (al > 0.92) & (a.min(2) < 225); idx = nd.distance_transform_edt(~known, return_distances=False, return_indices=True)
    edge = al <= 0.92; a = a.copy(); a[edge] = a[idx[0], idx[1]][edge]
    hh, ww = m.shape; Y, X = np.mgrid[0:hh, 0:ww]; D = []
    for k in range(4):     # ближайший отрезок цепочки -> кость
        p, q = np.array(pts[k], float), np.array(pts[k + 1], float); d = q - p
        t = np.clip(((X - p[0]) * d[0] + (Y - p[1]) * d[1]) / (d @ d), 0, 1); D.append(np.hypot(X - p[0] - t * d[0], Y - p[1] - t * d[1]))
    lab = (np.argmin(np.stack(D), 0) + BI['lk%da' % i]).astype(np.int32)
    ys, xs = np.nonzero(al > 0.01); x0, y0, x1, y1 = xs.min() - 2, ys.min() - 2, xs.max() + 3, ys.max() + 3
    name = 'lk%d' % i; imgs[name] = Image.fromarray(np.dstack([a, al * 255])[y0:y1, x0:x1].clip(0, 255).astype('uint8'))
    V, T = mesh(al > 0.01, labels=lab, sigma=9); layers[name] = {'o': [int(x0), int(y0)], 'V': V, 'T': T}
    LK.append(pts)

# ---- тело без рук: торс + голова + брюхо (ниже линии воды не нужно — режем с запасом)
BODY = big(fg(NOA)) & (yy < J['water'] + 140)
lab = np.full((H, W), BI['torso'], np.int32); lab[poly(HEADP)] = BI['head']
lab[poly(R_PTS['belly'])] = BI['belly']
lab[poly(HEADP)] = BI['head']
layer('body', NOA, BODY, labels=lab, sigma=18)

# ---- пасть: разница с базой внутри головы (челюсть ниже), мягкий край
MR = poly(R_PTS['mouth'])
dm = (np.abs(MOUTH - BASE).sum(2) > 60) & MR & fg(MOUTH); dm = nd.binary_closing(nd.binary_opening(dm, iterations=2), iterations=6)
dm = nd.binary_fill_holes(big(dm)); dm = nd.binary_dilation(dm, iterations=10) & MR & fg(MOUTH)
fe = np.clip(nd.gaussian_filter(dm.astype(float), 6) * 2 - 0.5, 0, 1)
layer('headO', MOUTH, dm, amul=fe, fixed=lambda x, y: {BI['head']: 1.0})
ys, xs = np.nonzero((np.abs(MOUTH - BASE).sum(2) > 120) & MR & (MOUTH[..., 1] > MOUTH[..., 0] + 40))     # плазма в пасти — бирюзовая
J['mouthO'] = OVJ.get('mouthO') or ((int(np.median(xs)), int(np.median(ys))) if len(xs) > 30 else (380, 520))

# ---- горящие глаза: красное свечение из правки eyes (только разница), рисуется с силой glowE
de = (np.abs(EYES - BASE).sum(2) > 50) & poly(HEADP) & (EYES[..., 0] > EYES[..., 2] + 60)
de = nd.binary_closing(de, iterations=3); de = big(de, 2)
hot = de & (EYES[..., 0] > 235) & (EYES[..., 1] > 150); cs = []
for side in (xx < CX, xx >= CX):
    ys, xs = np.nonzero(hot & side); cs.append((int(np.median(xs)), int(np.median(ys))) if len(xs) > 5 else None)
J['e'], J['e2'] = OVJ.get('e') or cs[0] or (340, 418), OVJ.get('e2') or cs[1] or (420, 418)
de = nd.binary_dilation(de, iterations=8) & poly(HEADP)
layer('eyes', EYES, de, amul=np.clip(nd.gaussian_filter(de.astype(float), 6) * 2.2 - 0.4, 0, 1), fixed=lambda x, y: {BI['head']: 1.0})

# ---- миниган в металлической руке на голове (стволы на зрителя)
GZ = poly([(150, 90), (640, 90), (640, 470), (150, 470)])
dg = (np.abs(GUN - BASE).sum(2) > 55) & GZ & fg(GUN); dg = nd.binary_closing(nd.binary_opening(dg, iterations=2), iterations=4)
dg = nd.binary_fill_holes(big(dg, 2))
layer('gun', GUN, dg, fixed=lambda x, y: {BI['gun']: 1.0})
ys, xs = np.nonzero(dg & (GUN.mean(2) < 60) & (xx < 330))     # тёмные дула — левее руки
J['mgm'] = OVJ.get('mgm') or ((int(np.median(xs)), int(np.median(ys))) if len(xs) > 30 else (256, 345))

# ---- руки: висящая рука Flow (у зрителя слева), вторая — зеркально; кисть с когтями — отдельный слой (меняется на ладонь/кулак)
AM = big(fg(ARM)); AM = nd.binary_fill_holes(AM)
u = np.array(J['tip'], float) - np.array(J['wr'], float); u /= np.linalg.norm(u)
past = ((xx - J['wr'][0]) * u[0] + (yy - J['wr'][1]) * u[1]) > -6     # за запястьем — кисть
def seglab(segs, names):
    best = np.full((H, W), 1e9); l2 = np.zeros((H, W), np.int32)
    for (a, b), nm in zip(segs, names):
        a, b = np.array(a, float), np.array(b, float); v = b - a; t = np.clip(((xx - a[0]) * v[0] + (yy - a[1]) * v[1]) / (v @ v), 0, 1)
        dd = np.hypot(xx - a[0] - t * v[0], yy - a[1] - t * v[1]); w = dd < best; best[w] = dd[w]; l2[w] = BI[nm]
    return l2
alab = seglab([(J['sh'], J['el']), (J['el'], J['wr']), (J['wr'], J['tip'])], ['uarm', 'farm', 'farm'])
layer('arm', ARM, AM & ~past, labels=alab, sigma=24)
layer('hand', ARM, AM & past, fixed=lambda x, y: {BI['hand']: 1.0})
MIR = ARM[:, ::-1]; sh = 2 * CX - (W - 1)     # зеркало относительно CX: x' = 2CX - x
MIR = np.dstack([nd.shift(MIR[..., c], (0, sh), order=1, cval=255.0) for c in range(3)])
AM2 = nd.shift(AM[:, ::-1].astype(float), (0, sh), order=0) > 0.5; past2 = nd.shift(past[:, ::-1].astype(float), (0, sh), order=0) > 0.5
alab2 = seglab([(J['sh2'], J['el2']), (J['el2'], J['wr2']), (J['wr2'], J['tip2'])], ['uarm2', 'farm2', 'farm2'])
layer('arm2', MIR, AM2 & ~past2, labels=alab2, sigma=24)
layer('hand2', MIR, AM2 & past2, fixed=lambda x, y: {BI['hand2']: 1.0})

# ---- погоны поверх рук (только золото и бахрома)
gold = (NOA[..., 0] > 95) & (NOA[..., 0] > NOA[..., 2] + 45) & (NOA[..., 1] > NOA[..., 2] + 15) & (yy > 380) & (yy < 600) & ~poly(HEADP)
EPM = nd.binary_dilation(nd.binary_fill_holes(nd.binary_closing(gold, iterations=3)), iterations=1) & BODY
EPM = big(EPM, 2)
layer('epaul', NOA, EPM, fixed=lambda x, y: {BI['torso']: 1.0})

# ---- кисти-спрайты (лист Flow hands.jpg: ладонь к зрителю и кулак), запястье внизу по центру
HS = Image.open('art_src/l10/rig3/hands.jpg').convert('RGB'); ha = np.asarray(HS).astype(float); hm = fg(ha)
for k, (x0, x1) in {'palm': (0, 440), 'fist': (440, 784)}.items():
    m = np.zeros_like(hm); m[:, x0:x1] = hm[:, x0:x1]; m = nd.binary_fill_holes(big(m))
    al = np.clip((alpha(ha, m) - 0.12) / 0.88, 0, 1); ys, xs = np.nonzero(al > 0.01)
    a0, b0, a1, b1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    imgs[k] = Image.fromarray(np.dstack([ha, al * 255])[b0:b1, a0:a1].clip(0, 255).astype('uint8'))
    bot = np.nonzero(m[b1 - 12])[0]; J[k] = [int(round(float(bot.mean()) - a0)), int(b1 - b0 - 6)]     # точка запястья в спрайте

# ---- шланг: лента прошлого рига (тот же кольчатый шланг)
hose = Image.open('art_src/l10/rig/_dbg/hose.png').convert('RGBA'); hose = hose.crop((50, 0, hose.size[0], hose.size[1]))
ha2 = np.asarray(hose).astype(float); ha2[..., :3] *= (0.6 + 0.4 * np.clip(np.arange(ha2.shape[1]) / 50, 0, 1))[None, :, None]
imgs['hose'] = Image.fromarray(ha2.astype('uint8'))

# ---- атлас
AW = 2048; x = y = rowh = 0; place = {}
for k in sorted(imgs, key=lambda k: -imgs[k].size[1]):
    w, h = imgs[k].size
    if x + w > AW: x = 0; y += rowh + 2; rowh = 0
    place[k] = (int(x), int(y), int(w), int(h)); x += w + 2; rowh = max(rowh, h)
AH = y + rowh
atlas = Image.new('RGBA', (AW, AH), (0, 0, 0, 0))
for k, (x, y, w, h) in place.items(): atlas.paste(imgs[k], (x, y))
atlas.save('assets/l10/rig30.png', optimize=True)
out = {}
for k, L in layers.items():
    px, py = place[k][0] - L['o'][0], place[k][1] - L['o'][1]
    out[k] = {'v': [c for v in L['V'] for c in (v[0], v[1], round((v[0] + px) / AW, 5), round((v[1] + py) / AH, 5), v[2], v[3], v[4], v[5], v[6])], 't': [int(i) for i in L['T']]}
Jo = {k: (list(v) if isinstance(v, (tuple, list)) else v) for k, v in J.items()}
data = {'aw': AW, 'ah': AH, 'bones': BONES, 'J': Jo, 'layers': out, 'rect': {k: list(v) for k, v in place.items()}, 'LK': LK, 'hoseCY': hose.size[1] / 2}
for k, im in imgs.items():
    if k in layers: im.save(EDIT + 'layers/%s.png' % k)
    if k in SRC: Image.fromarray(SRC[k].clip(0, 255).astype('uint8')).save(EDIT + 'layers/%s_src.jpg' % k, quality=85)
json.dump({'size': [W, H], 'J': {k: list(v) for k, v in J.items() if isinstance(v, (tuple, list)) and k not in ('palm', 'fist')}, 'R': {k: [list(q) for q in v] for k, v in R_PTS.items()},
           'layers': {k: L['o'] for k, L in layers.items() if not k.startswith('lk')}, 'order': ['legs', 'body', 'headO', 'eyes', 'gun', 'arm', 'hand', 'arm2', 'hand2', 'epaul']}, open(EDIT + 'state.json', 'w', encoding='utf-8'))
open('js/rig30_data.js', 'w', encoding='utf-8').write('// собрано tools/p10/rig/build_rig3.py\nL10.RIG3 = ' + json.dumps(data, separators=(',', ':')) + ';\n')
print('atlas', atlas.size, {k: (len(v['V']), len(v['T']) // 3) for k, v in layers.items()}, 'J', {k: J[k] for k in ['e', 'e2', 'mouthO', 'mgm', 'palm', 'fist']})
if DBG:
    os.makedirs('art_src/l10/rig3/_dbg', exist_ok=True)
    for k, im in imgs.items(): im.save('art_src/l10/rig3/_dbg/%s.png' % k)
    col = np.array([[0, 0, 0], [200, 60, 60], [120, 120, 120], [230, 200, 60], [60, 160, 220], [220, 120, 200], [60, 200, 90]])
    vis = (NOA * 0.5 + col[np.clip(lab, 0, len(col) - 1)] * 0.5).astype('uint8'); vis[~BODY] = 255
    v = Image.fromarray(vis); d = ImageDraw.Draw(v)
    for k, p in J.items():
        if isinstance(p, tuple) and k not in ('palm', 'fist'): d.ellipse([p[0] - 5, p[1] - 5, p[0] + 5, p[1] + 5], outline=(255, 0, 0), width=2); d.text((p[0] + 6, p[1] - 6), k, fill=(255, 0, 0))
    d.line([(0, J['water']), (W, J['water'])], fill=(0, 90, 255), width=2); v.save('art_src/l10/rig3/_dbg/regions.png')
