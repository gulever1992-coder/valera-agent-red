# Семён фазы 3 в Т-ПОЗЕ (отзыв владельца 2026-11-05): один кадр Flow анфас, руки в стороны (крупные), сильно побитый,
# миниган в металлической кисти изо лба как в фазах 1–2. Исходники: _shots/t_pose2_a.jpg (с пулемётом), t_nogun_a.jpg (тот же кадр без него).
# Координаты модели = пиксели кадра 1376x768. Анимации сохраняются: при первом переходе на Т-позу углы рук пересчитываются,
# чтобы позы в игре не изменились (покой = руки опущены, как было); в редакторе части показываются в Т-позе.
# Запуск из корня игры: py tools/p10/sem3/build_tpose.py
import json, math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
PH = os.path.join(ROOT, 'art_src', 'l10', 'sem3', 'ph12'); SH = os.path.join(ROOT, 'art_src', 'l10', 'sem3', '_shots'); NEW = os.path.join(ROOT, 'art_src', 'l10', 'sem3', 'new')
OUT = os.path.join(ROOT, 'assets', 'l10', 'sem3'); DATA = os.path.join(ROOT, 'js', 'sem3_data.js')
txt = open(DATA, encoding='utf-8').read(); head, body = txt.split('L10.SEM3 = ', 1); OLD = json.loads(body.rstrip().rstrip(';'))


def key(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.minimum(r, b) - g; al = np.clip(1 - (m - 45) / 70, 0, 1)
    al = np.clip((ndimage.grey_erosion(al, size=3) - 0.1) / 0.9, 0, 1)          # срезаем пурпурную кайму на 1 px
    sp = np.clip((np.minimum(r, b) - g - 10) / 200, 0, 1)
    rgb = np.dstack([r - sp * (r - g), g, b - sp * (b - g)])
    core = (al > 0.97).astype(np.float32); w = ndimage.gaussian_filter(core, 3) + 1e-4  # цвет края — от соседних сплошных пикселей
    fill = np.dstack([ndimage.gaussian_filter(rgb[..., i] * core, 3) / w for i in range(3)])
    e = (1 - core)[..., None]; rgb = rgb * (1 - e) + fill * e
    return np.dstack([rgb, al * 255]).clip(0, 255)


def save(a, name):
    im = Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA') if isinstance(a, np.ndarray) else a
    bb = im.getbbox(); im = im.crop(bb); im.save(os.path.join(OUT, name + '.png')); return im, bb


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
def flat(name, im, bb, **o):   # часть, вырезанная из кадра на своём месте
    parts.append({'id': o.pop('id', name), 'img': name, 'w': im.width, 'h': im.height, 'x': (bb[0] + bb[2]) / 2, 'y': (bb[1] + bb[3]) / 2, 'r': 0, 'sx': 1, 'sy': 1, **o})


# ---- геометрия кадра ----
CX, TOP, WATER = 690, 20, 615
F = (WATER - TOP) / (OLD.get('water', 950) - OLD.get('top', 20)) if not OLD.get('tpose') else 1     # старые единицы -> новые
O = lambda p: ((p[0] - 512) * F + CX, (p[1] - 950) * F + WATER)                                      # точка старой модели 1024
ARM = {-1: [(525, 300), (300, 318), (145, 330), (40, 352)], 1: [(855, 300), (1065, 318), (1225, 330), (1335, 356)]}
GUNP, GUNT, MUZ = (685, 168), (370, 122), (368, 124)

A = key(Image.open(os.path.join(SH, 't_nogun_a.jpg'))); G = key(Image.open(os.path.join(SH, 't_pose2_a.jpg')))
H, Wd = A.shape[:2]; yy, xx = np.mgrid[0:H, 0:Wd]
# вода: ниже 585 оставляем только туловище, ниже 615 — ничего (рябь рисует игра)
torso_cols = np.clip(1 - np.maximum(540 - xx, xx - 842) / 12, 0, 1)
A[..., 3] *= np.where(yy > 585, torso_cols, 1) * np.clip((WATER + 4 - yy) / 10, 0, 1)

# ---- миниган с металлической кистью: разница кадров в области пулемёта ----
d = np.abs(G[..., :3] - A[..., :3]).sum(2)
zone = ((xx > 355) & (xx < 622) & (yy > 52) & (yy < 202)) | ((xx > 632) & (xx < 722) & (yy > 58) & (yy < 188))
gm = ndimage.binary_fill_holes(ndimage.binary_closing((d > 45) & zone & (G[..., 3] > 128), iterations=4)) & zone
gm = ndimage.binary_opening(gm, iterations=2); lab, n = ndimage.label(gm)
if n: sz = ndimage.sum(np.ones_like(d), lab, range(1, n + 1)); gm = np.isin(lab, 1 + np.where(sz > sz.max() * 0.05)[0])
ga = G.copy(); ga[..., 3] = ga[..., 3] * ndimage.gaussian_filter(gm.astype(np.float32), 1.2)
# в покое стволы смотрят вправо (игра разворачивает к Валере через fx) — зеркалим вокруг точки крепления
ga = ga[:, ::-1].copy(); sh = 2 * GUNP[0] - (Wd - 1); ga = np.roll(ga, sh, axis=1)
gun, gbb = save(ga, 'p_gun'); flat('p_gun', gun, gbb, id='gun', bone='gun')
GUNT, MUZ = (2 * GUNP[0] - GUNT[0], GUNT[1]), (2 * GUNP[0] - MUZ[0], MUZ[1])

# ---- руки: левая (x < плеча) и правая (x > плеча), кисть отдельно ----
AM = None; armimg = {}
for side in (-1, 1):
    S = 'L' if side < 0 else 'R'; sfx = '' if side < 0 else '2'; P = ARM[side]
    t = (xx - P[0][0]) * side                       # >0 — наружу от плеча
    am = np.clip((t + 18) / 30, 0, 1) * (yy < 452)
    wr = (xx - P[2][0]) * side                      # >0 — за запястьем
    arm = A.copy(); arm[..., 3] *= am * np.clip((14 - wr) / 22, 0, 1)
    claw = A.copy(); claw[..., 3] *= am * np.clip((wr + 20) / 18, 0, 1)
    ai, abb = save(arm, 'p_arm' + S); flat('p_arm' + S, ai, abb, id='arm' + sfx, mode='skin', soft=26, grid=30, tag='arm', skin=['ua' + sfx, 'fa' + sfx, 'ha' + sfx])
    ci, cbb = save(claw, 'p_claw' + S); flat('p_claw' + S, ci, cbb, id='claw' + S, bone='ha' + sfx, grp='hand' + S, var='claw', tag='arm')
    armimg[side] = ai
    A[..., 3] *= 1 - np.clip((t - 10) / 26, 0, 1) * (yy < 452)     # из тела руку убираем (плечо остаётся под погоном)
    bone('ua' + sfx, 'torso', P[0], P[1]); bone('fa' + sfx, 'ua' + sfx, P[1], P[2]); bone('ha' + sfx, 'fa' + sfx, P[2], P[3])

# ---- тело ----
bi, bbb = save(A.copy(), 'p_body')
bone('root', None, (CX, WATER), (CX, WATER + 40)); bone('torso', 'root', (CX, WATER), (CX, 262)); bone('belly', 'torso', (CX, 520), (CX, WATER + 40))
bone('head', 'torso', (CX, 262), (CX, 40)); bone('gun', 'head', GUNP, GUNT)
bone('spL', 'torso', (600, 330), (540, 280)); bone('spR', 'torso', (780, 330), (840, 280))

# ---- паучьи лапы со спины ----
LEG = [(50, 250), (448, 25), (834, 330), (1114, 180), (1298, 410)]; lg = Image.open(os.path.join(NEW, 'leg.png')); lg.save(os.path.join(OUT, 'p_leg.png')); LK = 0.55 * 0.64; legs = []
for i, (rt, rot, side) in enumerate([((600, 330), -18, -1), ((585, 380), 14, -1), ((780, 330), -18, 1), ((795, 380), 14, 1)]):
    f = place('p_leg', lg.size, LEG[0], rt, LK * side, LK, -rot if side < 0 else rot, id='leg%d' % i, mode='skin', soft=20, grid=40, tag='leg%d' % i)
    P = [f(q) for q in LEG]; ids = ['l%d%s' % (i, c) for c in 'abcd']; legs.append(ids)
    for j in range(4): bone(ids[j], ('spL' if side < 0 else 'spR') if j == 0 else ids[j - 1], P[j], P[j + 1])
    parts[-1]['skin'] = ids
lp = parts[-4:]; del parts[-4:]

# ---- шланг из пуза вниз — за телом ----
hs = Image.open(os.path.join(PH, 'hose.png')); hs.save(os.path.join(OUT, 'p_hose.png')); HK = 0.6 * 0.64; HN = 10; HCY = 130
H0, H1 = (10, HCY), (hs.width - 10, HCY); hroot = (CX, 585)
f = place('p_hose', hs.size, H0, hroot, HK, HK, 90, id='hose', mode='skin', soft=20, grid=40, tag='hose'); hose = []
for i in range(HN):
    a = f((H0[0] + (H1[0] - H0[0]) * i / HN, HCY)); b = f((H0[0] + (H1[0] - H0[0]) * (i + 1) / HN, HCY)); hose.append('h%d' % i); bone('h%d' % i, 'torso' if i == 0 else 'h%d' % (i - 1), a, b)
parts[-1]['skin'] = hose; hp = parts.pop()

# ---- порядок слоёв: лапы, шланг, рука-кисти, тело, погоны, пулемёт ----
armparts = [p for p in parts if p.get('tag') == 'arm']; gunp = [p for p in parts if p['id'] == 'gun'][0]
parts = lp + [hp, {'id': 'body', 'img': 'p_body', 'w': bi.width, 'h': bi.height, 'x': (bbb[0] + bbb[2]) / 2, 'y': (bbb[1] + bbb[3]) / 2, 'r': 0, 'sx': 1, 'sy': 1,
                   'mode': 'skin', 'skin': ['torso', 'head', 'belly'], 'soft': 30, 'grid': 30}]
hr = Image.open(os.path.join(PH, 'hroot.png')); hr.save(os.path.join(OUT, 'p_hroot.png')); place('p_hroot', hr.size, (hr.width / 2, hr.height * 0.45), (CX, 588), 0.36, 0.36, 0, id='hroot', bone='torso')
parts += armparts

# ладонь и кулак (варианты кисти), перекрашены под руку
AM, AS = stats(Image.open(os.path.join(OUT, 'p_clawL.png'))); CM = max(Image.open(os.path.join(OUT, 'p_clawL.png')).size); pm = recolor(Image.open(os.path.join(OUT, 'palm.png')), AM, AS, 1); pm.save(os.path.join(OUT, 'p_palm.png')); fs = recolor(Image.open(os.path.join(OUT, 'fist.png')), AM, AS, 1); fs.save(os.path.join(OUT, 'p_fist.png'))
for side in (-1, 1):
    S = 'L' if side < 0 else 'R'; sfx = '' if side < 0 else '2'; P = ARM[side]
    ux, uy = P[2][0] - P[1][0], P[2][1] - P[1][1]; l2 = math.hypot(ux, uy); rr = math.degrees(math.atan2(ux / l2, -uy / l2)); hl = math.dist(P[2], P[3]) / 162
    for nm, im, kk in (('p_palm', pm, CM * 1.25 / pm.height), ('p_fist', fs, CM * 0.8 / fs.height)):
        place(nm, im.size, (im.width / 2, im.height - 40), P[2], kk * -side, kk, round(rr, 2), id=nm[2:] + S, bone='ha' + sfx, grp='hand' + S, var=nm[2:], tag='arm')

# погоны поверх плеч — из самого тела
B0 = Image.fromarray(key(Image.open(os.path.join(SH, 't_nogun_a.jpg'))).astype(np.uint8), 'RGBA')
for S, (ex, ey) in (('L', (520, 268)), ('R', (852, 268))):
    box = (ex - 78, ey - 52, ex + 78, ey + 82); ec = B0.crop(box); m = Image.new('L', ec.size, 0); ImageDraw.Draw(m).ellipse((8, 6, ec.width - 8, ec.height - 6), fill=255); m = m.filter(ImageFilter.GaussianBlur(7))
    ec.putalpha(Image.fromarray((np.asarray(ec.getchannel('A')).astype(np.float32) * np.asarray(m) / 255).astype(np.uint8))); ec.save(os.path.join(OUT, 'p_ep' + S + '.png'))
    parts.append({'id': 'ep' + S, 'img': 'p_ep' + S, 'w': ec.width, 'h': ec.height, 'x': (box[0] + box[2]) / 2, 'y': (box[1] + box[3]) / 2, 'r': 0, 'sx': 1, 'sy': 1, 'bone': 'torso'})
parts.append(gunp)

# ---- анимации: перевод углов рук под Т-позу (один раз) и масштаб смещений ----
D = dict(OLD); clips = json.loads(json.dumps(OLD['clips']))
if not OLD.get('tpose'):
    ob = {b['id']: b for b in OLD['bones']}; nb = {b['id']: b for b in bones}
    ang = lambda b: math.degrees(math.atan2(b['ty'] - b['y'], b['tx'] - b['x']))
    def loc(B, i): b = B[i]; return ang(b) - (ang(B[b['p']]) if b['p'] in B else 0)
    delta = {i: loc(ob, i) - loc(nb, i) for i in ('ua', 'fa', 'ha', 'ua2', 'fa2', 'ha2')}
    delta = {i: (v + 180) % 360 - 180 for i, v in delta.items()}
    delta['ua'] += 35; delta['ua2'] -= 35; delta['fa'] -= 10; delta['fa2'] += 10     # руки длиннее — разводим наружу, чтобы не висели поперёк живота
    print('delta', {k: round(v, 1) for k, v in delta.items()})
    for cn, c in clips.items():
        K = c.setdefault('k', {})
        for bid, keys in K.items():
            for kf in keys:
                if len(kf) > 2: kf[2] = round(kf[2] * F, 1)
                if len(kf) > 3: kf[3] = round(kf[3] * F, 1)
        if cn.startswith('+'): continue
        for bid, dv in delta.items():
            if bid in K: K[bid] = [[kf[0], round(kf[1] + dv, 1)] + kf[2:] for kf in K[bid]]
            else: K[bid] = [[0, round(dv, 1)]]
    if 'bob' in D: D['bob'] = {k: (round(v * F, 2) if k in ('x', 'y') else v) for k, v in D['bob'].items()}
for k in ('v', 'size', 'cx', 'water', 'top', 'box', 'roles', 'pts', 'bones', 'parts', 'faOff'): D.pop(k, None)
D.update({'v': 4, 'tpose': 1, 'size': [Wd, H], 'cx': CX, 'water': WATER, 'top': TOP, 'box': [440, TOP, 940, WATER], 'clips': clips,
          'roles': {'torso': 'torso', 'head': 'head', 'gun': 'gun', 'armL': ['ua', 'fa', 'ha'], 'armR': ['ua2', 'fa2', 'ha2'], 'hose': hose, 'legs': legs},
          'pts': {'e': {'b': 'head', 'x': 655, 'y': 212}, 'e2': {'b': 'head', 'x': 718, 'y': 207}, 'm': {'b': 'head', 'x': 688, 'y': 262},
                  'mg': {'b': 'gun', 'x': MUZ[0], 'y': MUZ[1]}, 'gp': {'b': 'gun', 'x': GUNP[0], 'y': GUNP[1]}, 'belly': {'b': 'torso', 'x': CX, 'y': 560},
                  'legL': {'b': 'spL', 'x': 585, 'y': 380}, 'legR': {'b': 'spR', 'x': 795, 'y': 380}},
          'bones': bones, 'parts': parts})
open(DATA, 'w', encoding='utf-8').write(head + 'L10.SEM3 = ' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('bones', len(bones), 'parts', len(parts), 'clips', len(clips), 'gun', gbb, 'body', bbb)
