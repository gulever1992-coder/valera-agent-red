# Семён фазы 3 В ДИЗАЙНЕ ФАЗ 1–2 (решение владельца 2026-11-05): тело анфас по пояс — Flow по образцу rig20 (побитый),
# руки, пулемёт, шланг, погоны — части рига фаз 1–2 (assets/l10/rig20.png -> art_src/l10/sem3/ph12/*.png).
# Пишет assets/l10/sem3/p_*.png и js/sem3_data.js (анимации сохраняются). Координаты модели = кадр тела 1024x1024.
# Запуск из корня игры: py tools/p10/sem3/build_ph12.py [a|b]   (вариант тела q_body_a.jpg / q_body_b.jpg)
import json, math, os, sys
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
PH = os.path.join(ROOT, 'art_src', 'l10', 'sem3', 'ph12'); SH = os.path.join(ROOT, 'art_src', 'l10', 'sem3', '_shots'); NEW = os.path.join(ROOT, 'art_src', 'l10', 'sem3', 'new')
OUT = os.path.join(ROOT, 'assets', 'l10', 'sem3'); DATA = os.path.join(ROOT, 'js', 'sem3_data.js')
VAR = sys.argv[1] if len(sys.argv) > 1 else 'a'
txt = open(DATA, encoding='utf-8').read(); head, body = txt.split('L10.SEM3 = ', 1); OLD = json.loads(body.rstrip().rstrip(';'))


def key(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.minimum(r, b) - g; al = np.clip(1 - (m - 60) / 90, 0, 1)
    sp = np.clip((np.minimum(r, b) - g - 20) / 255, 0, 1) * (1 - al * 0.5)
    return Image.fromarray(np.dstack([r - sp * (r - g) * 0.9, g, b - sp * (b - g) * 0.9, al * 255]).clip(0, 255).astype(np.uint8), 'RGBA')


def save(im, name): im.save(os.path.join(OUT, name + '.png')); return im.size


def stats(im):
    a = np.asarray(im).astype(np.float32); px = a[..., :3][a[..., 3] > 200]; return px.mean(0), px.std(0) + 1e-3


def recolor(im, M, S, k=0.8):
    a = np.asarray(im).astype(np.float32); mu, sd = stats(im); out = (a[..., :3] - mu) / sd * S + M
    a[..., :3] = a[..., :3] * (1 - k) + out * k; return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')


parts, bones = [], []
def bone(id, p, xy, tip): bones.append({'id': id, 'p': p, 'x': round(xy[0], 1), 'y': round(xy[1], 1), 'tx': round(tip[0], 1), 'ty': round(tip[1], 1)})
def place(name, img, anchor_img, anchor_model, sx, sy, r=0, **o):
    w, h = img; c, s = math.cos(math.radians(r)), math.sin(math.radians(r))
    L = lambda p: (((p[0] - w / 2) * sx) * c - ((p[1] - h / 2) * sy) * s, ((p[0] - w / 2) * sx) * s + ((p[1] - h / 2) * sy) * c)
    d = L(anchor_img); cx, cy = anchor_model[0] - d[0], anchor_model[1] - d[1]
    p = {'id': o.pop('id', name), 'img': name, 'w': w, 'h': h, 'x': round(cx, 1), 'y': round(cy, 1), 'r': r, 'sx': round(sx, 4), 'sy': round(sy, 4)}; p.update(o); parts.append(p)
    return lambda q: (cx + L(q)[0], cy + L(q)[1])


# ---- тело ----
base = key(Image.open(os.path.join(SH, 'q_body_%s.jpg' % VAR))); bb = base.getbbox(); bodyi = base.crop(bb); save(bodyi, 'p_body')
W = {'cx': 512, 'water': 950, 'top': 20}
bone('root', None, (512, 950), (512, 1000)); bone('torso', 'root', (512, 950), (512, 560)); bone('belly', 'torso', (512, 800), (512, 1000))
bone('head', 'torso', (512, 560), (512, 120)); bone('gun', 'head', (512, 130), (800, 130))
bone('spL', 'torso', (400, 520), (300, 440)); bone('spR', 'torso', (624, 520), (724, 440))

# ---- паучьи лапы со спины ----
LEG = [(50, 250), (448, 25), (834, 330), (1114, 180), (1298, 410)]; lg = Image.open(os.path.join(NEW, 'leg.png')); save(lg, 'p_leg'); LK = 0.55; legs = []
for i, (rt, rot, side) in enumerate([((360, 500), -18, -1), ((330, 590), 14, -1), ((664, 500), -18, 1), ((694, 590), 14, 1)]):
    f = place('p_leg', lg.size, LEG[0], rt, LK * side, LK, -rot if side < 0 else rot, id='leg%d' % i, mode='skin', soft=20, grid=40, tag='leg%d' % i)
    P = [f(q) for q in LEG]; ids = ['l%d%s' % (i, c) for c in 'abcd']; legs.append(ids)
    for j in range(4): bone(ids[j], ('spL' if side < 0 else 'spR') if j == 0 else ids[j - 1], P[j], P[j + 1])
    parts[-1]['skin'] = ids

# ---- шланг фаз 1–2 из пуза вниз (корень слева) — за телом ----
hs = Image.open(os.path.join(PH, 'hose.png')); save(hs, 'p_hose'); HK = 0.6; HN = 10; HCY = 130
H0, H1 = (10, HCY), (hs.width - 10, HCY); hroot = (512, 900)
f = place('p_hose', hs.size, H0, hroot, HK, HK, 90, id='hose', mode='skin', soft=20, grid=40, tag='hose'); hose = []
for i in range(HN):
    a = f((H0[0] + (H1[0] - H0[0]) * i / HN, HCY)); b = f((H0[0] + (H1[0] - H0[0]) * (i + 1) / HN, HCY)); hose.append('h%d' % i); bone('h%d' % i, 'torso' if i == 0 else 'h%d' % (i - 1), a, b)
parts[-1]['skin'] = hose
parts.append({'id': 'body', 'img': 'p_body', 'w': bodyi.width, 'h': bodyi.height, 'x': bb[0] + bodyi.width / 2, 'y': bb[1] + bodyi.height / 2, 'r': 0, 'sx': 1, 'sy': 1, 'mode': 'skin', 'skin': ['torso', 'head', 'belly'], 'soft': 40, 'grid': 44})
hr = Image.open(os.path.join(PH, 'hroot.png')); save(hr, 'p_hroot'); place('p_hroot', hr.size, (hr.width / 2, hr.height * 0.45), (512, 905), 0.55, 0.55, 0, id='hroot', bone='torso')

# ---- пулемёт фаз 1–2 в роботизированной руке на темени (стволы вбок; игра разворачивает его к Валере) ----
gn = Image.open(os.path.join(PH, 'gun.png')); save(gn, 'p_gun'); GK = 0.75
fg = place('p_gun', gn.size, (70, 110), (512, 130), GK, GK, 0, id='gun', bone='gun'); MG = fg((425, 108))

# ---- руки фаз 1–2: картинка — правая рука зверя (у зрителя слева), кисть смотрит внутрь; правая у зрителя — зеркально ----
arm0 = Image.open(os.path.join(PH, 'arm.png')); AM, AS = stats(arm0)
AJ = [(90, 55), (120, 310), (305, 430), (375, 615)]; AK = 0.82
ux, uy = AJ[2][0] - AJ[1][0], AJ[2][1] - AJ[1][1]; ul = math.hypot(ux, uy); ux, uy = ux / ul, uy / ul
yy, xx = np.mgrid[0:arm0.height, 0:arm0.width]; proj = (xx - AJ[2][0]) * ux + (yy - AJ[2][1]) * uy     # >0 — кисть за запястьем
aa = np.asarray(arm0).copy(); aa[..., 3] = (aa[..., 3] * np.clip((20 - proj) / 25, 0, 1)).astype(np.uint8); armi = Image.fromarray(aa, 'RGBA'); save(armi, 'p_arm')
cc = np.asarray(arm0).copy(); cc[..., 3] = (cc[..., 3] * np.clip((proj + 25) / 20, 0, 1)).astype(np.uint8); clawi = Image.fromarray(cc, 'RGBA'); save(clawi, 'p_claw')
pm = recolor(Image.open(os.path.join(OUT, 'palm.png')), AM, AS); save(pm, 'p_palm'); fs = recolor(Image.open(os.path.join(OUT, 'fist.png')), AM, AS); save(fs, 'p_fist')
from PIL import ImageDraw
EP = {-1: (200, 540), 1: (824, 540)}     # центры погонов на теле (кадр 1024)
SH_ = {-1: (205, 560), 1: (819, 560)}
for side, sfx in ((-1, ''), (1, '2')):
    S = 'L' if side < 0 else 'R'; k = AK * -side     # левая у зрителя — как в картинке (кисть вправо, к центру)
    f = place('p_arm', armi.size, AJ[0], SH_[side], k, AK, 0, id='arm' + sfx, mode='skin', soft=26, grid=36, tag='arm')
    P = [f(q) for q in AJ]
    bone('ua' + sfx, 'torso', P[0], P[1]); bone('fa' + sfx, 'ua' + sfx, P[1], P[2]); bone('ha' + sfx, 'fa' + sfx, P[2], P[3])
    parts[-1]['skin'] = ['ua' + sfx, 'fa' + sfx, 'ha' + sfx]
    place('p_claw', clawi.size, AJ[2], P[2], k, AK, 0, id='claw' + S, bone='ha' + sfx, grp='hand' + S, var='claw', tag='arm')
    ux2, uy2 = P[2][0] - P[1][0], P[2][1] - P[1][1]; l2 = math.hypot(ux2, uy2); rr = math.degrees(math.atan2(ux2 / l2, -uy2 / l2))
    for nm, im, kk in (('p_palm', pm, 0.42), ('p_fist', fs, 0.5)):
        place(nm, im.size, (im.width / 2, im.height - 40), P[2], kk * -side, kk, round(rr, 2), id=nm[2:] + S, bone='ha' + sfx, grp='hand' + S, var=nm[2:], tag='arm')
    # погон поверх плеча — вырезан из самого тела (точно совпадает), края растушёваны
    ex, ey = EP[side]; box = (ex - 120, ey - 95, ex + 120, ey + 120); ec = base.crop(box); m = Image.new('L', ec.size, 0); ImageDraw.Draw(m).ellipse((12, 10, ec.width - 12, ec.height - 10), fill=255); m = m.filter(ImageFilter.GaussianBlur(10))
    ec.putalpha(Image.fromarray((np.asarray(ec.getchannel('A')).astype(np.float32) * np.asarray(m) / 255).astype(np.uint8))); save(ec, 'p_ep' + S)
    parts.append({'id': 'ep' + S, 'img': 'p_ep' + S, 'w': ec.width, 'h': ec.height, 'x': (box[0] + box[2]) / 2, 'y': (box[1] + box[3]) / 2, 'r': 0, 'sx': 1, 'sy': 1, 'bone': 'torso'})

D = dict(OLD)
for k in ('v', 'size', 'cx', 'water', 'top', 'box', 'roles', 'pts', 'bones', 'parts'): D.pop(k, None)
D.update({'v': 3, 'size': [1024, 1024], 'cx': W['cx'], 'water': W['water'], 'top': W['top'], 'box': [120, 20, 900, W['water']],
          'roles': {'torso': 'torso', 'head': 'head', 'gun': 'gun', 'armL': ['ua', 'fa', 'ha'], 'armR': ['ua2', 'fa2', 'ha2'], 'hose': hose, 'legs': legs},
          'pts': {'e': {'b': 'head', 'x': 470, 'y': 410}, 'e2': {'b': 'head', 'x': 556, 'y': 410}, 'm': {'b': 'head', 'x': 512, 'y': 500},
                  'mg': {'b': 'gun', 'x': round(MG[0], 1), 'y': round(MG[1], 1)}, 'gp': {'b': 'gun', 'x': 512, 'y': 130}, 'belly': {'b': 'torso', 'x': 512, 'y': 880},
                  'legL': {'b': 'spL', 'x': 330, 'y': 560}, 'legR': {'b': 'spR', 'x': 694, 'y': 560}},
          'bones': bones, 'parts': parts})
open(DATA, 'w', encoding='utf-8').write(head + 'L10.SEM3 = ' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('bones', len(bones), 'parts', len(parts), 'clips', len(D['clips']), 'body', VAR, bodyi.size)
