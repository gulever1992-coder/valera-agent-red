# Риг Семёна v2 (стиль boss_hd_side): цельная картинка тела на сетке с весами костей (без швов), руки — отдельные сетки,
# пасть — оверлей головы (плавный переход), погон поверх руки, шланг — лента. Канон — art_src/l10/rig2/nohose.png (768x1376).
# Выход: assets/l10/rig20.png + js/rig20_data.js (L10.RIG2). Запуск: py tools/p10/rig/build_rig2.py [--debug]
import sys, os, json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd

S = 'art_src/l10/rig2/'
DBG = '--debug' in sys.argv
def load(n, s=0.999, dx=1, dy=1):
    im = Image.open(S + n + '.png').convert('RGB')
    if n != 'nohose': im = im.transform(im.size, Image.AFFINE, (1 / s, 0, -dx / s, 0, 1 / s, -dy / s), resample=Image.BICUBIC, fillcolor=(255, 255, 255))
    return np.asarray(im).astype(float)
NOH, ARML, MOUTH = load('nohose'), load('armless'), load('mouth', 0.998, 1, 2)
pad = lambda a: np.concatenate([a, np.full((a.shape[0], 1376 - a.shape[1], 3), 255.0)], 1)     # холст шире — длинная рука вперёд
NOH, ARML, MOUTH = pad(NOH), pad(ARML), pad(MOUTH)
ALONG = np.asarray(Image.open(S + 'armlong_al.png').convert('RGB')).astype(float)     # длинная рука (Flow), совмещена с armless_wide
H, W = NOH.shape[:2]
yy, xx = np.mgrid[0:H, 0:W]

def fg(a, t=236):
    m = (a.min(2) < t) | ((a.max(2) - a.min(2)) > 24)
    m = nd.binary_closing(nd.binary_opening(m, iterations=1), iterations=2)
    holes = nd.binary_fill_holes(m) & ~m; lb, n = nd.label(holes)     # закрыть только мелкие дырки, просветы между лапами — прозрачные
    if n: sz = nd.sum(holes, lb, range(1, n + 1)); m |= np.isin(lb, 1 + np.nonzero(sz < 150)[0])
    return m
def poly(pts):
    im = Image.new('L', (W, H), 0); ImageDraw.Draw(im).polygon([tuple(p) for p in pts], fill=255); return np.asarray(im) > 0
def alpha(a, m, soft=1.0):
    f = np.clip(nd.gaussian_filter(m.astype(float), soft) * 1.7, 0, 1)
    w = np.clip((246 - a.min(2)) / 24, 0, 1)
    return f * np.maximum(w, nd.binary_erosion(m, iterations=3))

# ---- суставы (канон)
J = dict(hip=(380, 860), neck=(560, 520), spider=(340, 480), belly=(190, 760), head=(625, 430),
         hipL=(285, 820), kneeL=(320, 990), hockL=(165, 1035), footL=(195, 1175), toeL=(280, 1210),
         hipR=(480, 880), kneeR=(525, 960), hockR=(370, 1040), footR=(470, 1180), toeR=(575, 1210),
         sh=(530, 640), el=(830, 740), wr=(1030, 810), tip=(1270, 960),
         sh2=(560, 655), el2=(615, 800), wr2=(652, 862), tip2=(720, 1000),
         hose=(522, 838), eye=(652, 455), mouth=(668, 520), mouthO=(668, 540), imp=(648, 300), ground=(340, 1238), top=140)
# ---- длинная рука короче: вдоль оси x KA, поперёк x KP (плечо не трогаем — плавный переход 60..240 px от сустава)
KA, KP, OFF2 = 0.64, 0.86, (-22, 8)
_g = lambda a, k: 1 - (1 - k) * np.clip((a - 60) / 180, 0, 1) ** 2 * (3 - 2 * np.clip((a - 60) / 180, 0, 1))
_A = np.linspace(0, 1400, 14001)
def warp_arm(img, c, toward, pts, ka=None, kp=None):
    ka = ka or KA; kp = kp or KP
    """укоротить руку: центр c (у плеча), ось на toward; вернуть картинку и пересчитанные точки"""
    c = np.array(c, float); u = np.array(toward, float) - c; u /= np.linalg.norm(u); n = np.array([-u[1], u[0]])
    dx, dy = xx - c[0], yy - c[1]; a = dx * u[0] + dy * u[1]; b = dx * n[0] + dy * n[1]
    ap = np.where(a > 0, a / _g(a, ka), a); bp = np.where(a > 0, b / _g(a, kp), b)
    X = c[0] + ap * u[0] + bp * n[0]; Y = c[1] + ap * u[1] + bp * n[1]
    out = np.dstack([nd.map_coordinates(img[..., ch], [Y, X], order=1, cval=255.0) for ch in range(3)]); Asrc = _A / _g(_A, ka); res = []
    for p in pts:
        d = np.array(p, float) - c; a1, b1 = d @ u, d @ n; an = float(np.interp(a1, Asrc, _A)) if a1 > 0 else a1; bn = b1 * _g(an, kp) if a1 > 0 else b1
        res.append((round(c[0] + an * u[0] + bn * n[0]), round(c[1] + an * u[1] + bn * n[1])))
    return out, res, u
# передняя рука (Flow armhang): плечо под погоном, плечевая часть висит вниз, предплечье вперёд-вниз
AHANG = np.asarray(Image.open(S + 'armhang_al.png').convert('RGB')).astype(float)
J['sh'] = (440, 597)
AHANG, (J['el'], J['wr'], J['tip']), _u = warp_arm(AHANG, (440, 597), (740, 957), [(533, 823), (740, 957), (873, 1197)], ka=0.84, kp=0.94)
# дальняя рука — своя картинка Flow (ладонь к зрителю), сдвинута к дальнему плечу
AFAR = np.asarray(Image.open(S + 'armfar_al.png').convert('RGB')).astype(float)
AFAR, (_e2, _w2, _t2), _u2 = warp_arm(AFAR, (520, 650), (960, 690), [(700, 725), (960, 690), (1230, 560)], ka=0.5, kp=0.66)     # дальняя — меньше (владелец: была крупнее передней)
J['sh2'], J['el2'], J['wr2'], J['tip2'] = [(p[0] + OFF2[0], p[1] + OFF2[1]) for p in [(490, 640), _e2, _w2, _t2]]
J['hose'] = (540, 850)     # корень шланга — в воспалённом вздутии (hroot поверх)
BONES = ['id', 'root', 'torso', 'head', 'spider', 'belly', 'thighL', 'shinL', 'footL', 'thighR', 'shinR', 'footR', 'uarm', 'farm', 'hand', 'uarm2', 'farm2', 'hand2', 'gun']
BI = {b: i for i, b in enumerate(BONES)}

# ---- области тела
BODY = fg(ARML)
R_PTS = {
    'head': [(452, 200), (520, 182), (585, 228), (605, 270), (625, 245), (650, 186), (705, 186), (740, 262), (736, 340), (708, 420), (706, 525), (668, 566), (600, 570), (556, 548), (520, 478), (470, 430), (428, 395), (426, 300), (460, 290)],
    'spider': [(0, 120), (500, 110), (488, 300), (440, 380), (380, 440), (330, 470), (270, 520), (210, 560), (110, 600), (98, 700), (96, 960), (136, 1000), (138, 1260), (0, 1260)],
    'belly': [(100, 590), (230, 555), (300, 600), (300, 760), (240, 930), (150, 960), (100, 900)],
    'thighL': [(212, 790), (295, 755), (372, 800), (385, 905), (362, 1012), (300, 1045), (240, 1000), (200, 920)],
    'shinL': [(138, 985), (210, 958), (330, 975), (345, 1050), (300, 1095), (200, 1110), (138, 1105)],
    'footL': [(138, 1105), (240, 1100), (300, 1150), (330, 1260), (138, 1260)],
    'thighR': [(415, 880), (500, 860), (565, 880), (585, 960), (545, 1010), (470, 990), (425, 945)],
    'shinR': [(330, 1000), (420, 965), (545, 945), (585, 1000), (520, 1080), (420, 1110), (340, 1100)],
    'footR': [(340, 1100), (440, 1100), (560, 1140), (620, 1260), (340, 1260)],
}
# правки владельца из редактора рига (tools/p10/rig/editor.html): суставы и области
EDIT = S + 'edit/'; os.makedirs(EDIT, exist_ok=True)
OV = json.load(open(EDIT + 'overrides.json', encoding='utf-8')) if os.path.exists(EDIT + 'overrides.json') else {}
for k, v in OV.get('R', {}).items(): R_PTS[k] = [tuple(map(int, q)) for q in v]
for k, v in OV.get('J', {}).items(): J[k] = tuple(map(int, v))
R = {k: poly(v) for k, v in R_PTS.items()}
lab = np.full((H, W), BI['torso'], np.int32)
for k in ['belly', 'spider', 'thighL', 'shinL', 'footL', 'thighR', 'shinR', 'footR', 'head']: lab[R[k]] = BI[k]
lab[(lab == BI['spider']) & R['belly']] = BI['belly']

# ---- сетка и веса
STEP = 12
def mesh(mask, labels=None, fixed=None, sigma=16, ox=0, oy=0):
    """сетка над маской; веса: one-hot областей, размытые гауссом (плавные суставы); возвращает вершины, треугольники"""
    g = nd.binary_dilation(mask, iterations=STEP)
    gx = np.arange(0, W + STEP, STEP); gy = np.arange(0, H + STEP, STEP)
    nx, ny = len(gx), len(gy)
    if labels is not None:
        maps = {}
        for b in np.unique(labels[mask]): maps[int(b)] = nd.gaussian_filter((labels == b).astype(float) * mask, sigma)
    vid = -np.ones((ny, nx), int); V = []; T = []
    def vert(i, j):
        if vid[j, i] >= 0: return vid[j, i]
        x, y = float(gx[i]), float(gy[j])
        if fixed is not None: ws = fixed(x, y)
        else:
            xi, yi = min(int(x), W - 1), min(int(y), H - 1)
            ws = {b: m[yi, xi] for b, m in maps.items()}
            if sum(ws.values()) < 1e-4: ws = {int(labels[yi, xi]): 1.0}
        top = sorted(ws.items(), key=lambda kv: -kv[1])[:3]; s = sum(w for _, w in top) or 1
        top = [(b, w / s) for b, w in top] + [(0, 0.0)] * (3 - len(top))
        vid[j, i] = len(V); V.append([x, y] + [int(b) for b, _ in top] + [round(float(top[0][1]), 3), round(float(top[1][1]), 3)]); return vid[j, i]
    for j in range(ny - 1):
        for i in range(nx - 1):
            x0, y0 = gx[i], gy[j]
            if g[min(y0 + STEP // 2, H - 1), min(x0 + STEP // 2, W - 1)] or g[min(y0, H - 1), min(x0, W - 1)]:
                a, b, c, d = vert(i, j), vert(i + 1, j), vert(i + 1, j + 1), vert(i, j + 1)
                T += [a, b, c, a, c, d]
    return V, T

layers = {}; imgs = {}; SRC = {}
def layer(name, a, m, soft=1.0, **kw):
    SRC[name] = a
    ADD = None     # кисть «Дорисовать» владельца: берём пиксели исходника этой части
    if os.path.exists(EDIT + name + '_add.png'): ADD = (np.asarray(Image.open(EDIT + name + '_add.png').convert('RGBA').resize((W, H)))[..., 3] > 127) & fg(a); m = m | ADD
    if os.path.exists(EDIT + name + '_erase.png'):     # ластик владельца (сильнее кисти)
        ER = np.asarray(Image.open(EDIT + name + '_erase.png').convert('RGBA').resize((W, H)))[..., 3] > 127; m = m & ~ER
        if ADD is not None: ADD &= ~ER
    if name in ('arm', 'arm2', 'hroot'):     # обрывки белого фона между когтями (только пятна у края силуэта, блики внутри не трогаем)
        wt = nd.binary_dilation((a.min(2) > 190) & ((a.max(2) - a.min(2)) < 36), iterations=1) & m; wl, wn = nd.label(wt)
        if wn: edge = nd.binary_dilation(~m, iterations=3); hit = np.unique(wl[edge & wt]); m = m & ~np.isin(wl, hit[hit > 0])
    al = np.clip((alpha(a, m, soft) - 0.12) / 0.88, 0, 1)     # край силуэта без светлой каймы: цвет — с ближайшего непрозрачного пикселя
    known = (al > 0.92) & (a.min(2) < 225); idx = nd.distance_transform_edt(~known, return_distances=False, return_indices=True)
    edge = al <= 0.92; a = a.copy(); a[edge] = a[idx[0], idx[1]][edge]
    al = al * (kw.pop('amul', None) if 'amul' in kw else 1)
    if ADD is not None and ADD.any(): al = np.maximum(al, np.clip((alpha(a, ADD, soft) - 0.12) / 0.88, 0, 1))
    ys, xs = np.nonzero(al > 0.01); x0, y0, x1, y1 = xs.min() - 2, ys.min() - 2, xs.max() + 3, ys.max() + 3
    imgs[name] = Image.fromarray(np.dstack([a, al * 255])[y0:y1, x0:x1].clip(0, 255).astype('uint8')); V, T = mesh(al > 0.01, **kw)
    layers[name] = {'o': [int(x0), int(y0)], 'V': V, 'T': T}

# паучьи лапы, стоящие на земле рядом с задней ногой (трость и тонкая лапа) — отдельный слой за телом, иначе склеиваются со стопой
STK = poly([(52, 900), (88, 900), (146, 1232), (140, 1252), (116, 1252), (72, 1000)]) & BODY
THIN = poly([(249, 1032), (283, 1032), (281, 1188), (251, 1188)]) & BODY     # тонкая лапа между ногами — убрана (владелец)
layer('sticks', ARML, STK, fixed=lambda x, y: {BI['spider']: 1.0})
layer('body', ARML, BODY & ~STK & ~THIN, labels=lab)
# пасть: только голова, мягкий край
MOUTHR = poly([(452, 200), (520, 182), (585, 228), (605, 270), (625, 245), (650, 186), (705, 186), (740, 262), (736, 340), (708, 420), (712, 520), (690, 575), (668, 615), (640, 650), (596, 660), (556, 636), (530, 590), (505, 520), (470, 430), (428, 395), (426, 300), (460, 290)])
hm = MOUTHR & fg(MOUTH)
feather = np.clip(nd.gaussian_filter(MOUTHR.astype(float), 9) * 2.2 - 0.6, 0, 1)
layer('headO', MOUTH, hm, amul=feather, labels=np.where(MOUTHR, BI['head'], BI['torso']).astype(np.int32))
# погон поверх руки
EP = poly([(372, 470), (420, 455), (470, 470), (480, 520), (470, 590), (440, 615), (400, 610), (372, 560)])
gold = (ARML[..., 0] > 95) & (ARML[..., 0] > ARML[..., 2] + 45) & (ARML[..., 1] > ARML[..., 2] + 15)     # только золото погона и бахромы, без тени под ней
EPM = nd.binary_dilation(nd.binary_fill_holes(nd.binary_closing(gold & EP, iterations=2)), iterations=1) & EP
layer('epaul', ARML, EPM & BODY, fixed=lambda x, y: {BI['torso']: 1.0})
# ближняя рука (длинная, вперёд): разница с телом + плечо из той же картинки, которое мягко растворяется в теле
d = (np.abs(AHANG - ARML).sum(2) > 55) & fg(AHANG); d = nd.binary_opening(d, iterations=2); d = nd.binary_closing(d, iterations=4)
d &= poly([(380, 560), (520, 560), (600, 760), (1000, 900), (1000, 1260), (640, 1260), (470, 900), (380, 700)])
lb, n = nd.label(d); arm_m = nd.binary_fill_holes(lb == 1 + int(np.argmax(nd.sum(d, lb, range(1, n + 1)))))
UA = poly([(370, 585), (500, 580), (530, 640), (545, 720), (560, 790), (540, 832), (470, 842), (420, 822), (395, 780), (372, 700), (366, 640)])     # плечевая часть: цветом как тело, обведена вручную
stripe = ((AHANG[..., 2] > AHANG[..., 0] + 8) | (AHANG.min(2) > 165)) & (yy < 780)     # полоски тельняшки по краям плеча — не рука
arm_m = nd.binary_fill_holes(arm_m | (UA & fg(AHANG))) & ~nd.binary_dilation(stripe, iterations=2)
lb, n = nd.label(arm_m); arm_m = lb == 1 + int(np.argmax(nd.sum(arm_m, lb, range(1, n + 1))))
_h = nd.binary_fill_holes(arm_m) & ~arm_m; _l, _n = nd.label(_h)
if _n: arm_m |= np.isin(_l, 1 + np.nonzero(nd.sum(_h, _l, range(1, _n + 1)) < 400)[0])
amul = np.clip(nd.gaussian_filter(arm_m.astype(float), 2.5) * 2 - 0.5, 0, 1)
_ax = np.array((533 - 440, 823 - 597), float); _ax /= np.linalg.norm(_ax)
amul *= np.clip((((xx - 440) * _ax[0] + (yy - 597) * _ax[1]) + 30) / 40, 0, 1) * np.clip((yy - 592) / 32, 0, 1)     # верх дельты растворяется под погоном — без прямого среза
arm_m &= ~poly([(470, 540), (600, 540), (560, 640), (515, 628), (480, 600)])     # кусок шеи/груди над плечом — не рука (торчал у челюсти)
arm_m = np.where(yy < 820, nd.binary_opening(arm_m, iterations=4), arm_m)     # зазубрины по краю плеча
arm_m &= ~poly([(370, 785), (450, 832), (485, 880), (472, 915), (370, 915)])     # кожа позади локтя — в крике торчала лоскутом
def seglab(segs, names, m, before):
    """метки по ближайшему отрезку; до плеча — торс"""
    best = np.full((H, W), 1e9); lab2 = np.zeros((H, W), np.int32)
    for (a, b), nm in zip(segs, names):
        a, b = np.array(a, float), np.array(b, float); v = b - a; t = np.clip(((xx - a[0]) * v[0] + (yy - a[1]) * v[1]) / (v @ v), 0, 1)
        dd = np.hypot(xx - a[0] - t * v[0], yy - a[1] - t * v[1]); w = dd < best; best[w] = dd[w]; lab2[w] = BI[nm]
    lab2[before] = BI['torso']; return lab2
J_sh = np.array(J['sh'], float); axis = (np.array(J['el'], float) - J_sh); axis /= np.linalg.norm(axis)
before = ((xx - J_sh[0]) * axis[0] + (yy - J_sh[1]) * axis[1]) < -10
alab = seglab([(J['sh'], J['el']), (J['el'], J['wr']), (J['wr'], J['tip'])], ['uarm', 'farm', 'hand'], arm_m, before)
layer('arm', AHANG, arm_m, amul=amul, labels=alab, sigma=30)
# дальняя рука: та же длинная рука, сдвинута к дальнему плечу (рисуется за телом, затемнённая)
d2 = (np.abs(AFAR - ARML).sum(2) > 60) & fg(AFAR); d2 = nd.binary_opening(d2, iterations=2); d2 = nd.binary_closing(d2, iterations=4)
d2 &= poly([(470, 560), (700, 300), (1376, 250), (1376, 980), (760, 980), (470, 940)])
lb, n = nd.label(d2); a2m = nd.binary_fill_holes(lb == 1 + int(np.argmax(nd.sum(d2, lb, range(1, n + 1)))))
arm2 = nd.shift(a2m.astype(float), (OFF2[1], OFF2[0]), order=0) > 0.5
A2 = np.dstack([nd.shift(AFAR[..., c], (OFF2[1], OFF2[0]), order=1, cval=255.0) for c in range(3)])
_a2 = (xx - J['sh2'][0]) * _u2[0] + (yy - J['sh2'][1]) * _u2[1]
layer('arm2', A2, arm2, amul=np.clip((_a2 - 130) / 20, 0, 1), labels=seglab([(J['sh2'], J['el2']), (J['el2'], J['wr2']), (J['wr2'], J['tip2'])], ['uarm2', 'farm2', 'hand2'], arm2, np.zeros((H, W), bool)), sigma=22)

# миниган в металлической руке на голове (Flow minigun): ствол + рука одним куском, своя кость gun (поворот у запястья руки)
MG = np.asarray(Image.open(S + 'minigun_al.png').convert('RGB')).astype(float)
J['mgp'] = (640, 378); J['mgm'] = (992, 335)     # рукоять (ось поворота) и дуло
gd = (np.abs(MG - ARML).sum(2) > 50) & fg(MG) & poly([(560, 150), (1015, 150), (1015, 420), (560, 420)])
gd = nd.binary_closing(nd.binary_opening(gd, iterations=3), iterations=3) & ~poly([(540, 350), (612, 350), (612, 430), (540, 430)])     # без контура рога и волос
gun_m = nd.binary_fill_holes(gd | (poly([(598, 252), (692, 252), (702, 392), (612, 398)]) & fg(MG)))
lb, n = nd.label(gun_m); sz = nd.sum(gun_m, lb, range(1, n + 1)); gun_m = np.isin(lb, 1 + np.nonzero(sz > 400)[0])
layer('gun', MG, gun_m, fixed=lambda x, y: {BI['gun']: 1.0})

# ---- прыщи: только настоящие (зелёные купола, нарисованные на арте); у каждого своя текстура со своего места
gr = (ARML[..., 1] > ARML[..., 0] - 10) & (ARML[..., 1] > ARML[..., 2] + 40) & (ARML[..., 1] > 90) & BODY
gr = nd.binary_opening(gr, iterations=2); lb, n = nd.label(gr); PIMPS = []
for i in range(1, n + 1):
    ys, xs = np.nonzero(lb == i)
    if len(xs) < 40: continue
    cx, cy, rr = float(xs.mean()), float(ys.mean()), float(np.sqrt(len(xs) / np.pi))
    if 470 < cx < 620 and cy > 790: continue     # под вздутием шланга не видно
    pm = (xx - cx) ** 2 + (yy - cy) ** 2 < (rr * 2.2) ** 2
    pal = np.clip(nd.gaussian_filter(pm.astype(float), 2.5) * 1.8, 0, 1) * alpha(ARML, BODY)
    ys2, xs2 = np.nonzero(pal > 0.01); px0, py0, px1, py1 = xs2.min(), ys2.min(), xs2.max() + 1, ys2.max() + 1
    k = 'pimp%d' % len(PIMPS); imgs[k] = Image.fromarray(np.dstack([ARML, pal * 255])[py0:py1, px0:px1].clip(0, 255).astype('uint8'))
    PIMPS.append([round(cx), round(cy), round(rr, 1), BONES[int(lab[int(cy), int(cx)])], k, round(cx - px0, 1), round(cy - py0, 1)])
pimp_c = [0, 0, 1]; EXTRA = []

# ---- шланг: лента прошлой сборки
hose = Image.open('art_src/l10/rig/_dbg/hose.png').convert('RGBA'); hose = hose.crop((50, 0, hose.size[0], hose.size[1]))
ha = np.asarray(hose).astype(float); ha[..., :3] *= (0.62 + 0.38 * np.clip(np.arange(ha.shape[1]) / 50, 0, 1))[None, :, None]     # корень в тени под тканью     # корень растворяется в пупке
hose = Image.fromarray(ha.astype('uint8')); imgs['hose'] = hose

# корень шланга (Flow hoseroot): воспалённое вздутие на животе, шланг выходит из него — кусок поверх корня подвижного шланга
HRT = np.asarray(Image.open(S + 'hoseroot_al.png').convert('RGB')).astype(float)
hz = poly([(405, 725), (565, 728), (605, 790), (590, 815), (552, 812), (546, 850), (552, 888), (585, 905), (570, 935), (405, 935)])
hd = (np.abs(HRT - ARML).sum(2) > 50) & hz & fg(HRT); hd = nd.binary_fill_holes(nd.binary_closing(hd, iterations=3))
layer('hroot', HRT, hd, amul=np.clip(nd.gaussian_filter(hd.astype(float), 3) * 2 - 0.4, 0, 1) * np.clip((yy - 735) / 30, 0, 1), fixed=lambda x, y: {BI['torso']: 1.0})

# ---- атлас
AW = 2048; x = y = rowh = 0; place = {}
for k in sorted(imgs, key=lambda k: -imgs[k].size[1]):
    w, h = imgs[k].size
    if x + w > AW: x = 0; y += rowh + 2; rowh = 0
    place[k] = (int(x), int(y), int(w), int(h)); x += w + 2; rowh = max(rowh, h)
AH = y + rowh
atlas = Image.new('RGBA', (AW, AH), (0, 0, 0, 0))
for k, (x, y, w, h) in place.items(): atlas.paste(imgs[k], (x, y))
atlas.save('assets/l10/rig20.png', optimize=True)
# uv в вершинах
out = {}
for k, L in layers.items():
    px, py = place[k][0] - L['o'][0], place[k][1] - L['o'][1]
    out[k] = {'v': [c for v in L['V'] for c in (v[0], v[1], round((v[0] + px) / AW, 5), round((v[1] + py) / AH, 5), v[2], v[3], v[4], v[5], v[6])], 't': [int(i) for i in L['T']]}
data = {'aw': AW, 'ah': AH, 'bones': BONES, 'J': J, 'layers': out, 'rect': {k: list(v) for k, v in place.items()},
        'pimp': pimp_c, 'pimps': PIMPS, 'extra': EXTRA, 'hoseCY': hose.size[1] / 2}
os.makedirs(EDIT + 'layers', exist_ok=True)
for k, im in imgs.items():
    if k in layers: im.save(EDIT + 'layers/%s.png' % k)
    if k in SRC: Image.fromarray(SRC[k].clip(0, 255).astype('uint8')).save(EDIT + 'layers/%s_src.jpg' % k, quality=85)
json.dump({'size': [W, H], 'J': {k: list(v) for k, v in J.items() if isinstance(v, tuple) or isinstance(v, list)}, 'R': {k: [list(q) for q in v] for k, v in R_PTS.items()},
           'layers': {k: L['o'] for k, L in layers.items()}, 'order': ['arm2', 'sticks', 'body', 'hroot', 'headO', 'gun', 'arm', 'epaul']}, open(EDIT + 'state.json', 'w', encoding='utf-8'))
open('js/rig20_data.js', 'w', encoding='utf-8').write('// собрано tools/p10/rig/build_rig2.py\nL10.RIG2 = ' + json.dumps(data, separators=(',', ':')) + ';\n')
print('atlas', atlas.size, {k: (len(v['V']), len(v['T']) // 3) for k, v in layers.items()}, 'pimps', PIMPS[:8])
if DBG:
    os.makedirs(S + '_dbg', exist_ok=True)
    for k, im in imgs.items(): im.save(S + '_dbg/%s.png' % k)
    col = np.array([[0, 0, 0], [200, 60, 60], [120, 120, 120], [230, 200, 60], [60, 160, 220], [220, 120, 200], [60, 200, 90], [40, 140, 70], [20, 90, 40], [240, 150, 60], [190, 100, 30], [120, 60, 10]])
    vis = (ARML * 0.5 + col[np.clip(lab, 0, len(col) - 1)] * 0.5).astype('uint8'); vis[~BODY] = 255
    Image.fromarray(vis).save(S + '_dbg/regions.png')
