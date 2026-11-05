# Сборка рига Семёна (вид сбоку, смотрит вправо) по скелету владельца.
# Источники (art_src/l10): rig/side_flow.png (оригинал с рукой и шлангом), rig_oneleg1.png (без руки/шланга, одна нога),
# rig_mouth1.png (рот открыт), rig_hose1.png (шланг отдельно). Всё совмещено в канон 1102x1470 (common.py).
# Выход: assets/l10/rig10.png (атлас частей) + js/rig10_data.js (части, пивоты, суставы, прыщи, точки).
import sys, json, os
sys.path.insert(0, os.path.dirname(__file__))
from common import *
from PIL import ImageDraw, ImageFilter
from scipy import ndimage as nd

DBG = '--debug' in sys.argv
side, body, mouth = load('side'), load('rig_oneleg1'), load('rig_mouth1')

def fgmask(a, t=232):
    m = (a.min(2) < t) | ((a.max(2) - a.min(2)) > 26)
    m = nd.binary_opening(m, iterations=1)
    return nd.binary_fill_holes(nd.binary_closing(m, iterations=2))

def poly(pts):
    im = Image.new('L', (CW, CH), 0); ImageDraw.Draw(im).polygon([tuple(p) for p in pts], fill=255)
    return np.asarray(im) > 0

def alpha_of(a, m, soft=1.2):
    """мягкий край: маска размыта, плюс белый фон -> прозрачность"""
    f = nd.gaussian_filter(m.astype(float), soft)
    w = np.clip((244 - a.min(2)) / 26, 0, 1)
    return np.clip(np.minimum(f * 1.6, 1) * np.maximum(w, nd.binary_erosion(m, iterations=3)), 0, 1)

def fill(a, hole, known):
    """закрасить hole ближайшими известными пикселями + сгладить (простой inpaint)"""
    idx = nd.distance_transform_edt(~known, return_distances=False, return_indices=True)
    out = a.copy(); out[hole] = a[idx[0], idx[1]][hole]
    bl = np.dstack([nd.gaussian_filter(out[..., c], 4) for c in range(3)])
    out[hole] = bl[hole]
    return out

FB = fgmask(body)
# ---- полигоны (канон)
HEAD = [(452, 330), (488, 300), (492, 186), (520, 190), (545, 300), (550, 196), (585, 196), (596, 300), (612, 240), (640, 232), (680, 250), (690, 330),
        (672, 405), (676, 470), (668, 520), (650, 548), (606, 552), (575, 548), (540, 500), (512, 446), (470, 410)]
NECK_KEEP = poly([(470, 470), (560, 470), (600, 560), (470, 560)])          # шея остаётся и в торсе (перекрытие)
EPAUL = [(400, 470), (440, 445), (500, 448), (528, 470), (530, 520), (515, 560), (470, 565), (420, 555), (398, 520)]
THIGH = [(352, 905), (405, 845), (480, 820), (560, 845), (605, 905), (612, 1000), (602, 1090), (556, 1105), (500, 1092), (430, 1050), (380, 985)]
SHIN = [(505, 1040), (562, 1022), (612, 1052), (606, 1112), (520, 1160), (442, 1212), (372, 1222), (318, 1140), (322, 1060), (372, 1100), (432, 1100)]
FOOT = [(345, 1150), (420, 1140), (452, 1225), (520, 1280), (600, 1300), (672, 1360), (640, 1392), (420, 1392), (378, 1330), (345, 1230)]
LEG = poly(THIGH) | poly(SHIN) | poly(FOOT)
headm = poly(HEAD) & FB
legm = LEG & FB & ~poly([(0, 0), (CW, 0), (CW, 820), (0, 820)])

# ---- рука: разница оригинала и тела без руки
d = (np.abs(side - load('rig_noarm1')).sum(2) > 60) & fgmask(side)
d = nd.binary_opening(d, iterations=2); d = nd.binary_closing(d, iterations=3)
armzone = poly([(455, 480), (560, 470), (700, 470), (1030, 470), (1030, 660), (760, 640), (600, 630), (470, 615)])
armm = nd.binary_fill_holes(d & armzone)
lab, n = nd.label(armm); sz = nd.sum(armm, lab, range(1, n + 1)); armm = lab == (1 + int(np.argmax(sz)))
armm = nd.binary_dilation(armm, iterations=2) & fgmask(side)
r_, g_, b_ = side[..., 0], side[..., 1], side[..., 2]
vest = (side.min(2) > 150) | ((b_ > r_ + 12) & (b_ > 90)) | ((r_ > b_ + 50) & (g_ > b_ + 30) & (r_ > 120))     # тельняшка и золото погона — не рука
armm = armm & ~(vest & poly([(400, 440), (600, 440), (600, 660), (400, 660)]))
lab, n = nd.label(armm); sz = nd.sum(armm, lab, range(1, n + 1)); armm = nd.binary_fill_holes(lab == (1 + int(np.argmax(sz))))
sh, el, wr = np.array(B['sh']), np.array(B['el']), np.array(B['wr'])
def side_of(p, q, m):
    """маска точек по ту сторону линии через p, перпендикулярной (q-p)"""
    yy, xx = np.mgrid[0:CH, 0:CW]; v = q - p
    return ((xx - p[0]) * v[0] + (yy - p[1]) * v[1]) * m >= 0
J = 14     # перекрытие суставов
UPm = armm & ~side_of(el + (el - sh) / np.linalg.norm(el - sh) * J, el + (el - sh), 1)
FAm = armm & side_of(el - (el - sh) / np.linalg.norm(el - sh) * J, el, 1) & ~side_of(wr + (wr - el) / np.linalg.norm(wr - el) * J, wr + (wr - el), 1)
HAm = armm & side_of(wr - (wr - el) / np.linalg.norm(wr - el) * J, wr, 1)

# ---- торс: тело без головы и ноги, дыры закрашены
torso_m = FB & ~(headm & ~NECK_KEEP) & ~(legm & ~poly([(330, 820), (640, 820), (640, 930), (330, 930)]))
torso_a = body.copy()
hole = (legm | headm) & ~torso_m
inner = nd.binary_fill_holes(FB) & poly([(300, 600), (660, 600), (660, 960), (300, 960)])   # за бедром — дорисовать таз
torso_a = fill(torso_a, hole & inner, torso_m & ~hole)
torso_m = torso_m | (hole & inner)

# ---- прыщи: вырезать и замазать на торсе
PIMPS = [(336, 655, 40), (318, 768, 27), (347, 506, 14)]
EXTRA = [(318, 590, 0.45), (372, 880, 0.5), (470, 805, 0.42), (612, 830, 0.4), (352, 715, 0.38)]     # новые места (копии большого прыща)
pim_hole = np.zeros((CH, CW), bool)
yy, xx = np.mgrid[0:CH, 0:CW]
for (x, y, r) in PIMPS: pim_hole |= (xx - x) ** 2 + (yy - y) ** 2 < (r * 1.15) ** 2
pim_hole &= torso_m

# бледные «призрачные» костяные лапы нарисованы на белом — на тёмном фоне светятся; притемнить светлые серые пиксели вне тельняшки
lum = torso_a.mean(2); sat = torso_a.max(2) - torso_a.min(2)
ghost = torso_m & ((xx < 405) | ((yy < 455) & (xx < 560))) & (sat < 60)
kf = np.clip((lum - 110) / 90, 0, 1) * ghost
torso_a = torso_a * (1 - 0.48 * kf[..., None])
parts = {}
def part(name, a, m, piv, soft=1.2):
    ys, xs = np.nonzero(m); x0, y0, x1, y1 = xs.min() - 3, ys.min() - 3, xs.max() + 4, ys.max() + 4
    al = alpha_of(a, m, soft)
    rgba = np.dstack([a, al * 255])[y0:y1, x0:x1].clip(0, 255).astype('uint8')
    parts[name] = {'img': Image.fromarray(rgba), 'o': [int(x0), int(y0)], 'piv': [round(float(piv[0]), 1), round(float(piv[1]), 1)]}

NECK = (585, 515)
part('torso', torso_a, torso_m, B['hip'])
part('head', body, headm, NECK)
part('headO', mouth, poly(HEAD) & fgmask(mouth), NECK)
part('epaul', body, poly(EPAUL) & FB, B['sh'])
part('thigh', body, poly(THIGH) & legm, B['hip'])
part('shin', body, poly(SHIN) & legm, B['kn'])
part('foot', body, poly(FOOT) & legm, B['hk'])
part('uarm', side, UPm, B['sh'])
part('farm', side, FAm, B['el'])
part('hand', side, HAm, B['wr'])
# прыщ: круг с большого
px, py, pr = PIMPS[0]; pm = (xx - px) ** 2 + (yy - py) ** 2 < (pr * 1.12) ** 2
part('pimp', body, pm & FB, (px, py), soft=2.2)

# ---- шланг: выпрямить по средней линии
H1 = np.asarray(Image.open(SRC + 'rig_hose1.png').convert('RGB')).astype(float)
HM = fgmask(H1)
path = np.array([(118, 420), (165, 560), (300, 640), (480, 622), (620, 540), (730, 420), (820, 285), (930, 165), (1070, 112), (1200, 130), (1300, 180), (1352, 212)], float)
def resample(p, step):
    seg = np.r_[0, np.cumsum(np.linalg.norm(np.diff(p, axis=0), axis=1))]; L = seg[-1]; s = np.arange(0, L, step)
    return np.c_[np.interp(s, seg, p[:, 0]), np.interp(s, seg, p[:, 1])]
P = resample(path, 4)
for it in range(4):     # центр между краями по нормали
    T = np.gradient(P, axis=0); T /= np.linalg.norm(T, axis=1)[:, None]; N = np.c_[-T[:, 1], T[:, 0]]
    for i, (p, nn) in enumerate(zip(P, N)):
        e = []
        for sgn in (-1, 1):
            k = 0
            while k < 200:
                q = p + nn * sgn * k; xi, yi = int(q[0]), int(q[1])
                if xi < 0 or yi < 0 or xi >= HM.shape[1] or yi >= HM.shape[0] or not HM[yi, xi]: break
                k += 1
            e.append(k)
        P[i] = p + nn * (e[1] - e[0]) / 2
    P = np.c_[nd.gaussian_filter1d(P[:, 0], 3), nd.gaussian_filter1d(P[:, 1], 3)]
P = resample(P, 1.0)[300:]
T = np.gradient(P, axis=0); T /= np.linalg.norm(T, axis=1)[:, None]; N = np.c_[-T[:, 1], T[:, 0]]
HW = 130
offs = np.arange(-HW, HW + 1)
X = P[:, 0][None, :] + N[:, 0][None, :] * offs[:, None]; Y = P[:, 1][None, :] + N[:, 1][None, :] * offs[:, None]
strip = np.dstack([nd.map_coordinates(H1[..., c], [Y, X], order=1, cval=255) for c in range(3)])
smask = nd.map_coordinates(HM.astype(float), [Y, X], order=1, cval=0) > 0.5
smask = nd.binary_opening(smask, iterations=1)
sal = alpha_of(strip, smask, 1.0)
# кромку на корне (обрез) — плавно
L = strip.shape[1]; ramp = np.clip(np.arange(L) / 18, 0, 1); sal = sal * ramp[None, :]
hose_img = Image.fromarray(np.dstack([strip, sal * 255]).clip(0, 255).astype('uint8'))
ys, xs = np.nonzero(sal > 0.05); hose_img = hose_img.crop((0, ys.min(), L, ys.max() + 1)); hy = HW - ys.min()
# цепь шланга в каноне (разметка владельца)
HCH = [U(*p) for p in [(1053.5, 381.2), (1090.5, 456.2), (1072, 523.9), (1032.1, 559.4), (989, 561.5), (923.9, 547.1), (891.7, 526.2), (845.1, 548.9)]]

# ---- атлас
order = ['torso', 'head', 'headO', 'thigh', 'shin', 'foot', 'uarm', 'farm', 'hand', 'epaul', 'pimp']
AW = 2048; x = y = rowh = 0; place = {}
for k in order + ['hose']:
    im = parts[k]['img'] if k != 'hose' else hose_img
    w, h = im.size
    if x + w > AW: x = 0; y += rowh + 2; rowh = 0
    place[k] = (int(x), int(y), int(w), int(h)); x += w + 2; rowh = max(rowh, h)
atlas = Image.new('RGBA', (AW, y + rowh), (0, 0, 0, 0))
for k, (x, y, w, h) in place.items(): atlas.paste(parts[k]['img'] if k != 'hose' else hose_img, (x, y))
atlas.save('assets/l10/rig10.png', optimize=True)
data = {'parts': {k: {'f': place[k], 'o': parts[k]['o'], 'piv': parts[k]['piv']} for k in order},
        'hose': {'f': place['hose'], 'cy': int(hy), 'chain': [[round(a, 1), round(b, 1)] for a, b in HCH]},
        'J': {k: [round(v[0], 1), round(v[1], 1)] for k, v in B.items()}, 'neck': NECK,
        'pimps': [[x, y, r / 40] for x, y, r in PIMPS] + [[x, y, s] for x, y, s in EXTRA],
        'pt': {'eye': [621, 437], 'mouth': [655, 505], 'mouthO': [662, 520], 'imp': [642, 292], 'ground': [500, 1385], 'top': 180},
        'size': [CW, CH]}
open('js/rig10_data.js', 'w', encoding='utf-8').write('// собрано tools/p10/rig/build_rig.py — не править руками\nL10.RIG = ' + json.dumps(data, ensure_ascii=False) + ';\n')
print('atlas', atlas.size, {k: v[2:] for k, v in place.items()})
if DBG:
    os.makedirs('art_src/l10/rig/_dbg', exist_ok=True)
    for k in order: parts[k]['img'].save('art_src/l10/rig/_dbg/%s.png' % k)
    hose_img.save('art_src/l10/rig/_dbg/hose.png')
    # сборка в покое — проверка
    c = Image.new('RGBA', (CW, CH), (255, 255, 255, 255))
    for k in ['hose_skip', 'torso', 'thigh', 'shin', 'foot', 'head', 'uarm', 'farm', 'hand', 'epaul']:
        if k in parts: c.alpha_composite(parts[k]['img'], tuple(parts[k]['o']))
    c.convert('RGB').resize((CW // 2, CH // 2)).save('art_src/l10/rig/_dbg/rest.jpg')
