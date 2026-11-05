# Собирает НОВОГО Семёна фазы 3 (арт Flow 2026-11-04) в формат «Редактора фазы 3»:
# части из art_src/l10/sem3/new (cut_parts.py) -> assets/l10/sem3/n_*.png, кости/точки/роли -> js/sem3_data.js (анимации сохраняются).
# Координаты модели = кадр базы Flow 1024x1024 (art_src/l10/sem3/_shots/p_base_a.jpg). Старые данные -> art_src/l10/sem3/sem3_data_v1.js (один раз).
# Запуск из корня игры: py tools/p10/sem3/build_new.py
import json, math, os, shutil
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
NEW = os.path.join(ROOT, 'art_src', 'l10', 'sem3', 'new'); SH = os.path.join(ROOT, 'art_src', 'l10', 'sem3', '_shots')
OUT = os.path.join(ROOT, 'assets', 'l10', 'sem3'); DATA = os.path.join(ROOT, 'js', 'sem3_data.js')
os.makedirs(OUT, exist_ok=True)
import importlib.util
spec = importlib.util.spec_from_file_location('cut', os.path.join(os.path.dirname(__file__), 'cut_parts.py'))

txt = open(DATA, encoding='utf-8').read(); head, body = txt.split('L10.SEM3 = ', 1); OLD = json.loads(body.rstrip().rstrip(';'))
bk = os.path.join(ROOT, 'art_src', 'l10', 'sem3', 'sem3_data_v1.js')
if not os.path.exists(bk): shutil.copyfile(DATA, bk)


def key(im):     # тот же кейинг, что в cut_parts.py
    a = np.asarray(im.convert('RGB')).astype(np.float32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.minimum(r, b) - g; al = np.clip(1 - (m - 60) / 90, 0, 1)
    sp = np.clip((np.minimum(r, b) - g - 20) / 255, 0, 1) * (1 - al * 0.5)
    return Image.fromarray(np.dstack([r - sp * (r - g) * 0.9, g, b - sp * (b - g) * 0.9, al * 255]).clip(0, 255).astype(np.uint8), 'RGBA')


def save(im, name):
    im.save(os.path.join(OUT, name + '.png')); return im.size


parts, bones = [], []
def bone(id, p, xy, tip): bones.append({'id': id, 'p': p, 'x': round(xy[0], 1), 'y': round(xy[1], 1), 'tx': round(tip[0], 1), 'ty': round(tip[1], 1)})
def placer(w, h, sx, sy, r=0):
    """part-матрица: точка картинки -> модель; возвращает (центр, функция)"""
    c, s = math.cos(math.radians(r)), math.sin(math.radians(r))
    def lin(p): x, y = (p[0] - w / 2) * sx, (p[1] - h / 2) * sy; return (x * c - y * s, x * s + y * c)
    return lin
def place(name, img, anchor_img, anchor_model, sx, sy, r=0, **o):
    w, h = img; L = placer(w, h, sx, sy, r); d = L(anchor_img); cx, cy = anchor_model[0] - d[0], anchor_model[1] - d[1]
    p = {'id': o.pop('id', name), 'img': name, 'w': w, 'h': h, 'x': round(cx, 1), 'y': round(cy, 1), 'r': r, 'sx': round(sx, 4), 'sy': round(sy, 4)}; p.update(o); parts.append(p)
    return lambda q: (cx + L(q)[0], cy + L(q)[1])

# ---- база: тело целиком в своих координатах (1024) + накладка открытой пасти ----
base = key(Image.open(os.path.join(SH, 'p_base_a.jpg'))); mouth = key(Image.open(os.path.join(SH, 'p_mouth.jpg')))
# цвет кожи тела: обрубки плеч и бока ниже пуза (до стирания обрубков)
SKIN = [(225, 520, 330, 640), (710, 520, 815, 640), (300, 860, 390, 960), (650, 860, 740, 960)]
ba = np.asarray(base).astype(np.float32); sk = np.concatenate([ba[y0:y1, x0:x1][ba[y0:y1, x0:x1, 3] > 200][:, :3] for x0, y0, x1, y1 in SKIN])
SK_M, SK_S = sk.mean(0), sk.std(0)
def recolor(im, k=0.85):     # перенос среднего/разброса цвета кожи (k — сила)
    a = np.asarray(im).astype(np.float32); m = a[..., 3] > 128; px = a[..., :3][m]; mu, sd = px.mean(0), px.std(0) + 1e-3
    out = (a[..., :3] - mu) / sd * SK_S + SK_M; a[..., :3] = a[..., :3] * (1 - k) + out * k; return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')
# обрубки плеч стираем: руки теперь растут из-под погона
from PIL import ImageDraw
er = Image.new('L', base.size, 0); dr = ImageDraw.Draw(er)
for cx, cy in ((282, 585), (758, 585)): dr.ellipse((cx - 62, cy - 62, cx + 62, cy + 62), fill=255)
er = er.filter(ImageFilter.GaussianBlur(6)); ba = np.asarray(base).copy(); ba[..., 3] = (ba[..., 3] * (1 - np.asarray(er) / 255)).astype(np.uint8); base = Image.fromarray(ba, 'RGBA')
bb = base.getbbox(); body = base.crop(bb); save(body, 'n_body')
mb = (420, 200, 660, 665); mc = mouth.crop(mb)
mask = Image.new('L', mc.size, 0); mask.paste(255, (14, 14, mc.width - 14, mc.height - 14)); mask = mask.filter(ImageFilter.GaussianBlur(9))
mc.putalpha(Image.fromarray((np.asarray(mc.getchannel('A')).astype(np.float32) * np.asarray(mask) / 255).astype(np.uint8))); save(mc, 'n_mouth')

W = {'cx': 520, 'water': 840, 'top': 112}
# ---- кости корпуса ----
bone('root', None, (520, 840), (520, 890)); bone('torso', 'root', (520, 840), (520, 500)); bone('belly', 'torso', (525, 760), (525, 900))
bone('head', 'torso', (520, 500), (520, 150)); bone('gun', 'head', (520, 255), (520, 140))
bone('spL', 'torso', (440, 440), (330, 360)); bone('spR', 'torso', (600, 440), (710, 360))

# ---- лапы со спины (за телом): лист leg.png — корень слева, коготь справа; левые зеркально ----
LEG = [(50, 250), (448, 25), (834, 330), (1114, 180), (1298, 410)]; lg_img = Image.open(os.path.join(NEW, 'leg.png')); save(lg_img, 'n_leg')
LK = 0.55; legs = []
for i, (root, rot, side) in enumerate([((430, 430), -14, -1), ((405, 520), 16, -1), ((610, 430), -14, 1), ((635, 520), 16, 1)]):
    sx = LK * side; r = -rot if side < 0 else rot
    f = place('n_leg', lg_img.size, LEG[0], root, sx, LK, r, id='leg%d' % i, mode='skin', soft=20, grid=40, tag='leg%d' % i)
    P = [f(q) for q in LEG]; ids = ['l%d%s' % (i, c) for c in 'abcd']; legs.append(ids)
    for j in range(4): bone(ids[j], ('spL' if side < 0 else 'spR') if j == 0 else ids[j - 1], P[j], P[j + 1])
    parts[-1]['skin'] = ids
# порядок рисования: лапы сзади -> тело
parts.append({'id': 'body', 'img': 'n_body', 'w': body.width, 'h': body.height, 'x': bb[0] + body.width / 2, 'y': bb[1] + body.height / 2, 'r': 0, 'sx': 1, 'sy': 1, 'mode': 'skin', 'skin': ['torso', 'head', 'belly'], 'soft': 40, 'grid': 44})

# ---- шланг из пуза вниз (лист горизонтальный, корень слева) ----
hs = recolor(Image.open(os.path.join(NEW, 'hose.png')), 0.0); ha = np.asarray(hs).copy(); ha[..., 3] = (ha[..., 3] * np.clip((np.arange(hs.width)[None, :] - 40) / 110, 0, 1)).astype(np.uint8); hs = Image.fromarray(ha, 'RGBA'); save(hs, 'n_hose'); HK = 0.55; HN = 10     # мясной срез у корня растворяется
H0, H1 = (54, 116), (1150, 116); root = (528, 800)
f = place('n_hose', hs.size, H0, root, HK, HK, 90, id='hose', mode='skin', soft=20, grid=40, tag='hose')
hose = []
for i in range(HN):
    a = f((H0[0] + (H1[0] - H0[0]) * i / HN, 116)); b = f((H0[0] + (H1[0] - H0[0]) * (i + 1) / HN, 116)); hose.append('h%d' % i); bone('h%d' % i, 'torso' if i == 0 else 'h%d' % (i - 1), a, b)
parts[-1]['skin'] = hose

# ---- накладки головы ----
parts.append({'id': 'mouth', 'img': 'n_mouth', 'w': mc.width, 'h': mc.height, 'x': (mb[0] + mb[2]) / 2, 'y': (mb[1] + mb[3]) / 2, 'r': 0, 'sx': 1, 'sy': 1, 'bone': 'head', 'show': 'mouth'})
# миниган в металлической руке (p_gun2_a.jpg): плита крепления внизу садится на темя, стволы смотрят на зрителя
gn = Image.open(os.path.join(NEW, 'gun.png')); save(gn, 'n_gun'); GK = 0.235
go = [int(v) for v in open(os.path.join(NEW, 'gun_origin.txt')).read().split()]
fg = place('n_gun', gn.size, (495 - go[0], gn.height - 30), (520, 262), GK, GK, 0, id='gun', bone='gun')
MG = fg((705 - go[0], 245 - go[1]))     # центр блока стволов (в координатах исходника 1024)

# ---- руки: картинка — ПРАВАЯ рука (локоть уходит вправо); левая — зеркально. Кисть-коготь отдельной частью ----
arm = recolor(Image.open(os.path.join(NEW, 'arm.png'))); AJ = [(130, 210), (270, 560), (260, 860), (220, 1220)]; AK = 0.52; CUT = 880
up = arm.copy(); a = np.asarray(up).copy(); y = np.arange(arm.height)[:, None]
fade = np.clip((CUT + 30 - y) / 30, 0, 1) * np.clip((y - 60) / 150, 0, 1)     # низ — под кисть, верх (мясной срез) растворяется в плече
a[..., 3] = (a[..., 3] * fade).astype(np.uint8); up = Image.fromarray(a); save(up, 'n_arm')
claw = arm.crop((0, CUT - 40, arm.width, arm.height)); save(claw, 'n_claw')
pm = recolor(Image.open(os.path.join(NEW, 'palm.png'))); save(pm, 'n_palm'); fs = recolor(Image.open(os.path.join(NEW, 'fist.png'))); save(fs, 'n_fist')
for side, sfx, sh in ((-1, '', (318, 512)), (1, '2', (722, 512))):
    S = 'L' if side < 0 else 'R'
    f = place('n_arm', up.size, AJ[0], sh, AK * -side * -1 if False else AK * side, AK, 0, id='arm' + sfx, mode='skin', soft=26, grid=36, tag='arm')
    P = [f(q) for q in AJ]
    bone('ua' + sfx, 'torso', P[0], P[1]); bone('fa' + sfx, 'ua' + sfx, P[1], P[2]); bone('ha' + sfx, 'fa' + sfx, P[2], P[3])
    parts[-1]['skin'] = ['ua' + sfx, 'fa' + sfx, 'ha' + sfx]
    place('n_claw', claw.size, (AJ[2][0], AJ[2][1] - (CUT - 40)), P[2], AK * side, AK, 0, id='claw' + S, bone='ha' + sfx, grp='hand' + S, var='claw', tag='arm')
    # ладонь и кулак к зрителю: запястье (низ по центру) у кисти, «вверх» картинки — вдоль предплечья
    ux, uy = P[2][0] - P[1][0], P[2][1] - P[1][1]; l = math.hypot(ux, uy); ux, uy = ux / l, uy / l; rr = math.degrees(math.atan2(ux, -uy))
    for nm, im, k in (('n_palm', pm, 0.34), ('n_fist', fs, 0.32)):
        place(nm, im.size, (im.width / 2, im.height - 30), P[2], k * side, k, round(rr, 2), id=nm[2:] + S, bone='ha' + sfx, grp='hand' + S, var=nm[2:], tag='arm')

# шланг — за телом (поднятый не закрывает лицо; при ударе по воде игра рисует его поверх отдельно)
hp = next(q for q in parts if q['id'] == 'hose'); parts.remove(hp); parts.insert(next(i for i, q in enumerate(parts) if q['id'] == 'body'), hp)
D = dict(OLD)
D.update({'v': 2, 'size': [1024, 1024], 'cx': W['cx'], 'water': W['water'], 'top': W['top'], 'box': [300, 200, 740, W['water']],
          'roles': {'torso': 'torso', 'head': 'head', 'gun': 'gun', 'armL': ['ua', 'fa', 'ha'], 'armR': ['ua2', 'fa2', 'ha2'], 'hose': hose, 'legs': legs},
          'pts': {'e': {'b': 'head', 'x': 485, 'y': 392}, 'e2': {'b': 'head', 'x': 558, 'y': 392}, 'm': {'b': 'head', 'x': 523, 'y': 460},
                  'mg': {'b': 'gun', 'x': round(MG[0], 1), 'y': round(MG[1], 1)}, 'gp': {'b': 'gun', 'x': 520, 'y': 255}, 'belly': {'b': 'torso', 'x': 525, 'y': 760},
                  'legL': {'b': 'spL', 'x': 330, 'y': 800}, 'legR': {'b': 'spR', 'x': 710, 'y': 800}},
          'bones': bones, 'parts': parts})
open(DATA, 'w', encoding='utf-8').write(head + 'L10.SEM3 = ' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('bones', len(bones), 'parts', len(parts), 'clips', len(D['clips']))
