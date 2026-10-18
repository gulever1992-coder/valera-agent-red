# Сборка ассетов уровня 9: art_src/l9/*.jpg (Flow) -> assets/l9/*.png|jpg + js/l9_data.js
# Запуск: py tools/build_l9.py [--debug]   (потом py tools/optimize_assets.py)
import os, sys, json
from PIL import ImageFile as _IF; _IF.LOAD_TRUNCATED_IMAGES = True     # картинки из Flow через форму иногда приходят без последних байт
sys.path.insert(0, os.path.dirname(__file__))
from l9lib import *
import l9lib
from mrx_face import screens as mrx_screens     # Господин Икс на экранах — только глаза и улыбка на чёрном

DATA = l9lib.DATA
# выбранные варианты Flow (_0/_1)
HCAP, HEN, HCOP, ARCH, HBAR, TUNA, TUNB = 'l9pod2_1.jpg', 'l9penC_0.jpg', 'l9hcop2_0.jpg', 'l9arch_0.jpg', 'l9hbar_1.jpg', 'l9tunA_0.jpg', 'l9tunB_1.jpg'

# ---------- A. ТОННЕЛЬ ----------
# капсула Валеры (l9capv_0: ряды 3/4/4)
cv = cut('l9capv_0.jpg', 'mf', 3, [3, 4, 4], clean=True)
CAP_W = 300                                   # длина капсулы в px холста (150 логических)
k = CAP_W / cv[0].width
pack('cap9', [cv[0], cv[1], cv[3], cv[6], cv[7], cv[8], cv[9], cv[10]], k,
     names=['run', 'run2', 'idle', 'crack', 'fire', 'fireUp', 'hit', 'wreck'])
# вражеские капсулы (l9cape_1: 3 капсулы x [едет, бросок, перевёрнута])
ce = cut('l9cape_1.jpg', 'mf', 3, 3, clean=True)
for i, nm in enumerate(['capA9', 'capB9', 'capC9']):
    fr = ce[i * 3:i * 3 + 3]
    pack(nm, fr, CAP_W / fr[0].width, names=['run', 'throw', 'flip'])
# поезд: локомотив, вагон, хвост (одна высота)
tr = cut('l9train_1.jpg', 'mf', 3, 1, clean=True)
TR_H = 150
pack('train9', tr, TR_H / tr[1].height, names=['loco', 'wagon', 'tail'])
# дрезина охраны
dz = cut('l9drez_0.jpg', 'mf', 2, 3, clean=True)
pack('drez9', dz, CAP_W * 0.62 / dz[0].width, names=['run', 'fire', 'fireBack', 'shout', 'hit', 'wreck'])
# препятствия
pr = cut('l9props_1.jpg', 'm', 3, 4, clean='edge')
pack('prop9', pr, 0.62, names=['barrel', 'barrel2', 'barrelLeak', 'slab', 'boom', 'boomUp', 'cable', 'slime', 'bottle', 'scrap', 'lampOn', 'lampOff'])
# передний план тоннеля
fg = cut('l9fg1_0.jpg', 'm', 2, 4, mode='grid', clean='edge')
pack('fgT9', fg, 1.0, names=['pillar', 'rib', 'cables', 'pipe', 'fence', 'crates', 'lamp', 'broken'])
# виадук (пещера): ровный кусок и обломанный край
vi = cut('l9via_1.jpg', 'm', 2, 3, clean='edge')
pack('via9', vi, 0.9, anchor='mid', names=['flat', 'up', 'down', 'cUp', 'cTop', 'broken'])

# эффекты на чёрном: рисуются наложением 'lighter' — режем сеткой без кея
def black_grid(name, rows, cols, out, names, scale=0.6):
    im = Image.open(os.path.join(SRC, name)).convert('RGB'); W, H = im.size
    frs = []
    for j in range(rows):
        for i in range(cols):
            c = im.crop((W * i // cols + 4, H * j // rows + 4, W * (i + 1) // cols - 4, H * (j + 1) // rows - 4))
            a = np.asarray(c).max(2); ys, xs = np.where(a > 24)
            if len(xs): c = c.crop((max(0, xs.min() - 6), max(0, ys.min() - 6), min(c.width, xs.max() + 7), min(c.height, ys.max() + 7)))
            frs.append(c.resize((max(1, round(c.width * scale)), max(1, round(c.height * scale))), Image.LANCZOS))
    Wd = sum(f.width + 2 for f in frs) + 2; Hd = max(f.height for f in frs) + 2
    sh = Image.new('RGB', (Wd, Hd), (0, 0, 0)); x = 1; meta = []
    for f in frs:
        sh.paste(f, (x, 1)); meta.append([x, 1, f.width, f.height, f.width // 2, f.height // 2]); x += f.width + 2
    sh.save(os.path.join(OUT, out + '.jpg'), quality=92)
    DATA[out] = {'f': meta, 'n': names, 'add': 1}
    print('%-8s %4dx%-4d кадров %d (lighter)' % (out, Wd, Hd, len(frs)))
black_grid('l9fxa_0.jpg', 3, 4, 'fxA9', ['boom0', 'boom1', 'boom2', 'boom3', 'fire0', 'fire1', 'fire2', 'fire3', 'plasma', 'flash', 'spark', 'steam'])

# фоны тоннеля: кадр -> высота 720; линия «стена/пол» и три рельса (доли высоты) — замер ниже
DATA['_bg'] = {}
def bg(out, name, wall_k=None):
    im = Image.open(os.path.join(SRC, name)).convert('RGB')
    im = im.resize((round(im.width * 720 / im.height), 720), Image.LANCZOS)
    im.save(os.path.join(OUT, out + '.jpg'), quality=90)
    DATA['_bg'][out] = {'w': im.width, 'h': 720, 'wall': wall_k}
    return im
# стены зон: часть кадра над полом (cut — линия низа стены на высоте 720) -> высота WALL_H; пол общий (l9floor)
WALL_H, FLOOR_H = 444, 290
def wall(out, name, cutk):
    im = Image.open(os.path.join(SRC, name)).convert('RGB')
    im = im.resize((round(im.width * 720 / im.height), 720), Image.LANCZOS)
    im = im.crop((0, 0, im.width, cutk)).resize((im.width, WALL_H), Image.LANCZOS)
    im.save(os.path.join(OUT, out + '.jpg'), quality=90)
    DATA['_bg'][out] = {'w': im.width, 'h': WALL_H}
for out, nm, ck in (('wTun1', 'l9tun1_0.jpg', 492), ('wSta1', 'l9tun2_0.jpg', 492), ('wSta2', 'l9tun2_1.jpg', 468), ('wPip1', 'l9tun3_0.jpg', 462),
                    ('wPip2', 'l9tun3_1.jpg', 512), ('wLock', 'l9tun5_0.jpg', 490)):
    wall(out, nm, ck)
fl = Image.open(os.path.join(SRC, 'l9floor_0.jpg')).convert('RGB')
fl = fl.resize((round(fl.width * FLOOR_H / fl.height), FLOOR_H), Image.LANCZOS); fl.save(os.path.join(OUT, 'floor9.jpg'), quality=90)
DATA['_bg']['floor9'] = {'w': fl.width, 'h': FLOOR_H}
for out, nm in (('cave1', 'l9tun4_0.jpg'), ('cave2', 'l9tun4_1.jpg')):
    bg(out, nm)

# ---------- Валера сбоку (лаборатория) ----------
l9lib.THIN_LINES = False      # дальше (лаборатория) без поиска тонких линий: они съедали колонны, настил, руки и ноги
VH = 168   # рост стоя, px холста (84 логических)
r0 = cut('l9nvrun_1.jpg', 'm', 2, 4, clean=True)
k = VH / hgt(r0, 0) * 1.0
pack('vRun9', r0, k, names=['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'])
pack('vRunUD9', cut('l9nvrunud_0.jpg', 'm', 2, 4, clean=True), k, names=['u0', 'u1', 'u2', 'u3', 'd0', 'd1', 'd2', 'd3'])
pack('vAim9', cut('l9nvaim_0.jpg', 'm', 2, 4, clean=True), k, names=['stand', 'fire', 'diag', 'up', 'down', 'crouch', 'crouchFire', 'crouchDiag'])
pack('vJump9', cut('l9nvjump_0.jpg', 'm', 2, 4, clean=True), k, names=['take', 'rise', 'flip1', 'flip2', 'flip3', 'fallDown', 'fallDiag', 'land'])
pack('vRoll9', cut('l9nvroll_0.jpg', 'm', 2, 4, clean=True), k, names=['roll0', 'roll1', 'roll2', 'roll3', 'butt0', 'butt1', 'butt2', 'butt3'])
pack('vClimb9', cut('l9nvclimb_0.jpg', 'm', 2, 4, clean=True), k, names=['c0', 'c1', 'c2', 'c3', 'hit', 'stagger', 'fall', 'down'])
pack('vRage9', cut('l9nvrage_0.jpg', 'm', 2, 4, clean=True), k, names=['stance', 'jab', 'hook', 'upper', 'head', 'hammer', 'kick', 'roar'])
# ---------- враги лаборатории ----------
eh = cut('l9eHat_1.jpg', 'm', 2, [8, 6], clean=True)
pack('eHat9', eh, VH * 1.02 / hgt(eh, 0), names=['w0', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'wind', 'throw', 'crouch', 'jump', 'hit', 'dead'])
ea = cut('l9eArm_1.jpg', 'm', 2, 6, mode='grid', clean='edge')
pack('eArm9', ea, VH * 1.18 / hgt(ea, 0), names=['w0', 'w1', 'w2', 'w3', 'w4', 'w5', 'raise', 'slam', 'block', 'roar', 'hit', 'dead'])

# ---------- лаборатория: платформы, механизмы, фоны ----------
pl = cut('l9plat_1.jpg', 'm', 3, 4, mode='grid', clean='edge')
pack('plat9', pl, 0.5, anchor='mid', names=['walk', 'walkL', 'walkR', 'rail', 'ladder', 'ladderTop', 'block', 'stairs', 'lift', 'column', 'walkBroken', 'pipe'])
va = cut('l9vat_1.jpg', 'm', 2, 4, clean=True)
pack('vat9', va, 0.62, names=['v0', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7'])
tvs = cut('l9tv2_0.jpg', 'm', 3, 4, clean=True)[:8]   # экраны, утопленные в стенную плиту — без кронштейнов
if os.path.exists(os.path.join(SRC, 'l9tvw_1.jpg')):     # Икс на экранах (Flow): чёрный экран, красные глаза и улыбка — 4 кадра в ряд, верхний ряд листа
    _tw = cut('l9tvw_1.jpg', 'm', 2, 4, clean=True)[:4]
    _nz = np.asarray(tvs[1].convert('RGB')).astype(int); _sm = (_nz.min(2) > 110) & (_nz.max(2) - _nz.min(2) < 40); _ys = np.where(_sm.mean(1) > 0.3)[0]; _xs = np.where(_sm.mean(0) > 0.3)[0]     # экран старой рамки — по кадру со статикой
    _box = (_xs.min() - 2, _ys.min() - 2, _xs.max() + 3, _ys.max() + 3); print('tv9 экран', _box, tvs[1].size); _o = []
    for t in _tw:     # содержимое экрана нового кадра (тёмный прямоугольник) -> в экран старой рамки, рамки одинаковые во всех кадрах
        q = np.asarray(t.convert('RGB')).astype(int); dk = q.max(2) < 45; ys_, xs_ = np.where(dk[:, :]); yc, xc = q.shape[0] // 2, q.shape[1] // 2
        rows = np.where(dk.mean(1) > 0.5)[0]; cols = np.where(dk.mean(0) > 0.5)[0]
        scr = t.convert('RGBA').crop((cols.min(), rows.min(), cols.max() + 1, rows.max() + 1)).resize((_box[2] - _box[0], _box[3] - _box[1]), Image.LANCZOS)
        f = tvs[0].copy(); f.paste(scr, _box[:2]); _o.append(f)
    _tw = _o
    tvs = tvs[:2] + _tw + tvs[6:]
pack('tv9', tvs, 0.42, anchor='mid', names=['off', 'noise', 'x0', 'x1', 'x2', 'x3', 'broken', 'smoke'])
if os.path.exists(os.path.join(SRC, 'l9tvp_0.jpg')):     # груда телевизоров на полу целиком (Flow): статика, Икс (2 кадра), разбита
    tp = cut('l9tvp_0.jpg', 'm', 2, 3, clean=True)
    for q in range(len(tp)):     # розовый отсвет фона в дыму -> серый
        arr = np.asarray(tp[q]).copy(); r, g, b = [arr[..., i].astype(np.int32) for i in range(3)]
        pur = (r > g * 1.15) & (b > g * 1.15); L = (r * 0.3 + g * 0.59 + b * 0.11)[pur]
        arr[pur, 0] = (L * 0.8).astype(np.uint8); arr[pur, 1] = (L * 0.78).astype(np.uint8); arr[pur, 2] = (L * 0.74).astype(np.uint8)
        tp[q] = Image.fromarray(arr)
    if os.path.exists(os.path.join(SRC, 'l9tvy_1.jpg')):     # груда с Иксом на всех экранах (Flow): 2x3 — обычные, прищур, круглые глаза, помехи x2, разбита
        ty = cut('l9tvy_1.jpg', 'm', 2, 3, clean=True)
        q = np.asarray(ty[0]).copy(); c_ = q[..., :3].astype(int); lit = ((c_[..., 0] > 120) & (c_[..., 0] > c_[..., 1] * 1.8)) | (c_.min(2) > 170)
        q[lit, :3] = (c_[lit] * 0.06).astype(np.uint8)     # выключенная груда — те же телевизоры, экраны погасли
        pack('tvp9', [Image.fromarray(q), ty[0], ty[1], ty[5], ty[2], ty[3]], 280 / ty[0].height, names=['off', 'xa', 'xb', 'broken', 'xc', 'xd'])
    else:
        pack('tvp9', [tp[0], mrx_screens(tp[1]), mrx_screens(tp[1], 0.7, 1), tp[5]], 0.85, names=['off', 'xa', 'xb', 'broken'])
for out, nm in (('lab1a', 'l9lab1_0.jpg'), ('lab1b', 'l9lab1_1.jpg'), ('lab1c', 'l9lab1b_0.jpg'), ('lab1d', 'l9lab1b_1.jpg')):
    bg(out, nm)

for out, nm in (('lab2a', 'l9lab2_0.jpg'), ('lab2b', 'l9lab2_1.jpg'), ('lab3a', 'l9lab3_0.jpg'), ('lab3b', 'l9lab3_1.jpg'), ('lab4a', 'l9lab4_0.jpg'), ('lab4b', 'l9lab4_1.jpg'), ('lab5a', 'l9lab5_0.jpg'), ('lab5b', 'l9lab5_1.jpg')):
    bg(out, nm)
cv2 = cut('l9conv_0.jpg', 'm', 3, 4, mode='grid', clean='edge')
pack('conv9', cv2, 0.5, anchor='mid', names=['belt0', 'belt1', 'belt2', 'belt3', 'bum', 'drunk', 'thug', 'lady', 'arm0', 'arm1', 'hook', 'chute'])
mc = cut('l9mech_0.jpg', 'm', 3, 4, mode='grid', clean='edge')
pack('mech9', mc, 0.5, anchor='mid', names=['gear0', 'gear1', 'gear2', 'gear3', 'valve0', 'valve1', 'valve2', 'lift', 'tur', 'turFire', 'turDead', 'laser'])
co = cut('l9cover_0.jpg', 'm', 3, 4, mode='grid', clean='edge')
pack('cover9', co, 0.5, names=['crates', 'cratesHit', 'barrier', 'console', 'consoleDead', 'tube', 'tubeDead', 'gas', 'waste', 'wasteBoom', 'door', 'doorOpen'])
black_grid('l9fxl_0.jpg', 4, 4, 'fxL9', ['laser', 'laserHit', 'smoke', 'smoke2', 'tracer', 'plasma', 'plasmaHit', 'fireball', 'rocket', 'rocketBoom', 'acid', 'acidHit', 'wave', 'seed', 'muzzle', 'spark'])
pk = cut('l9pick_0.jpg', 'm', 2, 5, mode='grid', clean='edge')
pack('pick9', pk, 0.4, anchor='mid', names=['pist', 'mini', 'plasma', 'rocket', 'seed', 'grenades', 'kefir', 'pies', 'ammo', 'card'])
co2 = cut('l9capout_0.jpg', 'mf', 2, 2, clean=True)
pack('capOut9', co2, CAP_W / co2[0].width, names=['sit', 'stand', 'step', 'empty'])
# враги лаборатории (2)
for sh, src, rows, cols, names, hk in (
    ('eStump9', 'l9eStump_0.jpg', 2, 6, ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'wall', 'ceil', 'beep', 'boom', 'hit', 'dead'], 0.62),
    ('eFly9', 'l9eFly_0.jpg', 2, 6, ['h0', 'h1', 'h2', 'h3', 'h4', 'h5', 'dive', 'drill', 'bomb', 'laugh', 'hit', 'dead'], 1.0),
    ):
    fr = cut(src, 'm', rows, cols, mode='grid', clean='edge')
    pack(sh, fr, VH * hk / hgt(fr, 0), names=names)
# плевун и ползун стоят на листе неровно — режем по промежуткам между фигурами (сетка резала плевок, руки и труп)
fr = cut_blobs('l9eSpit_1.jpg', 'm', 3)      # вариант-жаба (выбор владельца): 6 шагов, раздувается, плевок, кашель, крик; ряд 3 — 2 лишних кадра на коленях, удар, труп
print('eSpit9 blobs', len(fr)); fr = fr[:10] + fr[12:14]
pack('eSpit9', fr, VH * 1.02 / hgt(fr, 0), names=['w0', 'w1', 'w2', 'w3', 'w4', 'w5', 'inflate', 'spit', 'crouch', 'scream', 'hit', 'dead'])
fr = cut_blobs('l9eCrawl_1.jpg', 'm', 2)     # вариант с лысым (выбор владельца): 5 кадров по потолку, падение, присел, прыжок, удар, попадание, труп
print('eCrawl9 blobs', len(fr)); fr = fr[:5] + [fr[1]] + fr[5:11]
pack('eCrawl9', fr, VH * 1.0 / hgt(fr, 10), names=['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'drop', 'land', 'leap', 'slash', 'hit', 'dead'])

ew = cut('l9eWeld_0.jpg', 'm', 3, [8, 7, 8], clean=True)
pack('eWeld9', ew[:8] + [ew[9], ew[10], ew[11], ew[12], ew[14], ew[22]], VH * 1.0 / hgt(ew, 0), names=['w0', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'mask', 'flame', 'shield', 'laugh', 'hit', 'dead'])
es = cut('l9eSuper_1.jpg', 'm', 3, [6, 4, 3], clean=True)
pack('eSuper9', es, VH * 1.2 / hgt(es, 0), names=['w0', 'w1', 'w2', 'w3', 'w4', 'w5', 'spin', 'fire', 'taunt', 'stagger', 'stagger2', 'kneel', 'dead'])
# лента конвейера: верхний ряд — 4 кадра движения (режем по промежуткам)
bl = cut('l9conv_0.jpg', 'm', 3, [4, 4, 4], clean='edge')
pack('belt9', bl[:4], 0.5, anchor='mid', names=['b0', 'b1', 'b2', 'b3'])

# ---------- ПОГОНЯ v2: капсулы на магнитной подушке, банды, бронегрузовик, бесшовный тоннель ----------
def have(n): return os.path.exists(os.path.join(SRC, n))
if have(HCAP):
    hc = cut(HCAP, 'mf', 2, 4, clean=True)
    pack('hcap9', hc, CAP_W / hc[0].width, names=['run', 'fire', 'fireBack', 'fireUp', 'bankUp', 'bankDown', 'hit', 'wreck'])
if have(HEN):
    he = cut(HEN, 'mf', 3, 3, clean=True)
    for i, nm in enumerate(['henA9', 'henB9', 'henC9']):
        fr = he[i * 3:i * 3 + 3]; pack(nm, fr, CAP_W * (1.15, 1.15, 0.92)[i] / fr[0].width, names=['run', 'fire', 'fireBack'])   # рост людей в капсулах = рост Валеры (в A и B их двое)
if have(HCOP):
    hp = cut(HCOP, 'mf', 2, 2, clean=True)
    pack('hcop9', hp, CAP_W * 1.9 / hp[0].width, names=['run', 'fire', 'dmg', 'boom'])
if have('l9arch_0.jpg'):
    l9lib.THIN_LINES = True
    ar = cut(ARCH, 'm', 1, 4, mode='grid', clean='edge'); ar = [f.crop((8, 0, f.width - 8, f.height)) for f in ar]   # без просвечивающих полос по краям
    def _core(f):     # колонна без обрывков соседних ячеек по бокам: самый длинный сплошной ряд столбцов
        cov = (np.asarray(f)[..., 3] > 20).mean(0) > 0.9; best, run = (0, 0), None
        for x, v in enumerate(list(cov) + [False]):
            if v and run is None: run = x
            if not v and run is not None: best = max(best, (run, x), key=lambda r: r[1] - r[0]); run = None
        return f.crop((best[0], 0, best[1], f.height))
    ar[2], ar[3] = _core(ar[2]), _core(ar[3])
    pack('arch9', ar, 760 / max(f.height for f in ar), names=['rib', 'pipes', 'pillar', 'glass'])
    l9lib.THIN_LINES = False
if have('l9hbar_0.jpg'):
    hb = cut(HBAR, 'm', 2, 4, mode='grid', clean='edge')
    pack('hbar9', hb, 0.62, names=['barrel', 'barrel2', 'barrelLeak', 'rubble', 'wreck', 'beam', 'slime', 'crate'])
if have('l9tunA_0.jpg'):
    im = Image.open(os.path.join(SRC, TUNA)).convert('RGB'); W, H = im.size
    wall = seamless(im.crop((0, 0, W, int(H * 0.74)))); wall = wall.resize((round(wall.width * 500 / wall.height), 500), Image.LANCZOS); wall.save(os.path.join(OUT, 'tunWall.jpg'), quality=90)
    flo = seamless(im.crop((0, int(H * 0.66), W, H))); flo = flo.resize((round(flo.width * 260 / flo.height), 260), Image.LANCZOS).convert('RGBA'); al = np.full((260, flo.width), 255, np.uint8); al[:64] = (np.linspace(0, 1, 64) ** 1.4 * 255)[:, None]; flo.putalpha(Image.fromarray(al)); flo.save(os.path.join(OUT, 'tunFloor.png'))   # верх пола плавно растворяется в стене — без шва
    DATA['_bg']['tunWall'] = {'w': wall.width, 'h': 500}; DATA.setdefault('_bgp', {})['tunFloor'] = 1
if have('l9tunB_0.jpg'):
    a, m = key_flood(load(TUNB)); H = a.shape[0]
    rgba = np.dstack([a, np.where(m, 0, 255)]).astype(np.uint8)[:int(H * 0.55)]
    ce = seamless(Image.fromarray(rgba, 'RGBA')); ce = ce.resize((round(ce.width * 300 / ce.height), 300), Image.LANCZOS)
    ce.save(os.path.join(OUT, 'tunCeil.png')); DATA.setdefault('_bgp', {})['tunCeil'] = 1

# ---------- катсцена прибытия: причал лаборатории + капсула, из которой вылезает Валера ----------
if have('l9dock_0.jpg'):
    bg('dock9', 'l9dock_0.jpg')
    # правки того же кадра во Flow: створки ворот разъезжаются (3 фазы), на настенном мониторе — помехи / Икс.
    # Вырезаем только область ворот/экрана с мягким краем и кладём поверх dock9 (координаты — исходник 1376x768)
    def dock_ov(group, box, fe):
        from scipy import ndimage
        if not all(have(n) for _, n in group): return
        rd = lambda n: Image.open(os.path.join(SRC, n)).convert('RGB').resize((1376, 768), Image.LANCZOS).crop(box)
        base = np.asarray(rd('l9dock_0.jpg')).astype(np.int32); ims = [rd(n) for _, n in group]
        if group[0][0] == 'dkG1':     # за створками везде один и тот же коридор — из кадра «настежь» (во Flow каждый кадр рисовал свой)
            from scipy import ndimage as _nd
            last = np.asarray(ims[-1]).astype(np.int32)
            for k in range(len(ims) - 1):
                a_ = np.asarray(ims[k]).astype(np.int32); L_ = a_.mean(2)
                m_ = (L_ > 105) & (a_[..., 2] >= a_[..., 0]); m_ = _nd.binary_opening(m_, iterations=2); m_ = _nd.binary_fill_holes(_nd.binary_closing(m_, iterations=4))
                lab_, n_ = _nd.label(m_)
                if n_: sz = _nd.sum(m_, lab_, range(1, n_ + 1)); m_ = lab_ == (1 + int(np.argmax(sz)))     # проём — самый большой светлый кусок
                a_[m_] = last[m_]; ims[k] = Image.fromarray(a_.astype(np.uint8))
        df = np.zeros(base.shape[:2], bool)            # общая маска группы: всё, что изменилось хоть в одном кадре (иначе прошлый кадр просвечивает)
        for im in ims: df |= np.abs(np.asarray(im).astype(np.int32) - base).max(2) > 48
        df = ndimage.binary_opening(df, iterations=2); df = ndimage.binary_closing(df, iterations=6); df = ndimage.binary_fill_holes(df)
        df = ndimage.binary_dilation(df, iterations=3)
        w, h = ims[0].size; yy, xx = np.mgrid[0:h, 0:w]
        d = np.minimum(np.minimum(xx, w - 1 - xx), np.minimum(yy, h - 1 - yy)).astype(np.float32)
        al = (np.clip(d / fe, 0, 1) * np.clip(ndimage.gaussian_filter(df.astype(np.float32), 2.5) * 1.6, 0, 1) * 255).astype(np.uint8)
        for (out, _), im in zip(group, ims):
            if out.startswith('dkX'): im = mrx_screens(im, 1.0 if out == 'dkX0' else 0.8)
            im.putalpha(Image.fromarray(al)); im.save(os.path.join(OUT, out + '.png'))
            DATA.setdefault('_bgp', {})[out] = 1; DATA.setdefault('dockOv', {})[out] = [box[0], box[1], w, h]
    dock_ov((('dkG1', 'l9dg1_1.jpg'), ('dkG2', 'l9dg2_0.jpg'), ('dkG3', 'l9dg3_1.jpg')), (930, 130, 1310, 720), 22)
    dock_ov((('dkX0', 'l9dx_0.jpg'), ('dkX1', 'l9dx_1.jpg'), ('dkN0', 'l9dn_0.jpg'), ('dkN1', 'l9dn_1.jpg')), (692, 164, 868, 296), 6)
if have('l9capout4_0.jpg'):     # капсула из погони (разбитое стекло): Валера на коленях, встаёт, перешагивает край; пустая капсула гаснет
    cx = cut('l9capout4_0.jpg', 'mf', 2, 4, clean=True)
    pack('capOut9b', cx, CAP_W / cx[5].width, names=['brake', 'kneel', 'stand', 'step', 'empty', 'off', 'smoke', 'dim'])

# ---------- погоня v3: мирные капсулы со спящими, техника киберзаводчан, тяжёлый БТР, поезд с капсулами ----------
if have('l9sleep_0.jpg'):
    sl = cut('l9sleep_0.jpg', 'mf', 2, 3, clean=True)
    pack('sleep9', sl, CAP_W * 1.1 / sl[0].width, names=['okA', 'okB', 'okC', 'crA', 'crB', 'crC'])
if have('l9cyb_1.jpg'):
    cy = cut('l9cyb_1.jpg', 'mf', 3, 3, clean=True)
    for i, (nm, kk) in enumerate((('cybA9', 0.95), ('cybB9', 1.3), ('cybC9', 1.1))):
        fr = cy[i * 3:i * 3 + 3]
        if i == 0 and have('l9hbike_1.jpg'): fr = cut('l9hbike_1.jpg', 'mf', 2, 2, clean=True)[:3]   # ховербайк без колёс
        pack(nm, fr, CAP_W * kk / fr[0].width, names=['run', 'fire', 'fireBack'])
if have('l9btr_1.jpg'):
    bt = cut('l9btr_1.jpg', 'mf', 2, 2, clean=True)
    pack('btr9', bt, CAP_W * 2.3 / bt[0].width, names=['run', 'fire', 'dmg', 'boom'])
if have('l9train2_0.jpg'):
    t2 = cut('l9train2_0.jpg', 'mf', 3, 1, clean=True)
    pack('trn9', t2, TR_H / t2[1].height, names=['loco', 'wagon', 'tail'])
if have('l9gate_1.jpg'):
    gt = cut('l9gate_1.jpg', 'm', 2, 3, mode='grid', clean='edge')
    pack('gate9', gt, 1.0, names=['g0', 'g1', 'g2', 'g3', 'g4', 'g5'])
# ---------- лаборатория: тонкий металлический пол, мостки с торцами, пресс-капсула, объекты среднего плана ----------
if have('l9floor2_1.jpg'):
    fl2 = Image.open(os.path.join(SRC, 'l9floor2_1.jpg')).convert('RGB').crop((0, 304, 1376, 420))
    fl2 = seamless(fl2); fl2 = fl2.resize((round(fl2.width * 44 / fl2.height), 44), Image.LANCZOS).convert('RGBA')
    fl2.save(os.path.join(OUT, 'labFloor.png')); DATA.setdefault('_bgp', {})['labFloor'] = 1
if have('l9walk2_0.jpg'):
    wk = cut('l9walk2_0.jpg', 'm', 2, 2, mode='grid', clean='edge')
    pl_ = wk[1]; W_, H_ = pl_.size                                         # целая короткая площадка: торцы с закруглёнными перилами с обеих сторон
    eL = pl_.crop((0, 0, W_ // 2, H_)); eR = pl_.crop((W_ // 2, 0, W_, H_))
    mc = seamless(pl_.crop((int(W_ * 0.3), 0, int(W_ * 0.7), H_)), 40)     # середина из центра площадки, бесшовная
    al = np.asarray(mc)[..., 3] > 0; cov = al.mean(1)
    runs_ = runs(cov > 0.85, 1, 3); deck = max(runs_, key=lambda r: r[1] - r[0])[0]   # верх настила = начало самой толстой сплошной полосы
    kW = 150 / H_
    pack('walk9', [eL, mc, eR, wk[3]], kW, anchor='mid', names=['endL', 'mid', 'endR', 'col'])
    DATA['walk9']['deck'] = round(deck * kW)
    print('walk9 deck row', deck, '->', DATA['walk9']['deck'])
if have('l9vat2_1.jpg'):
    vt = cut('l9vat2_1.jpg', 'm', 2, 4, clean=True)
    pack('vatP9', vt, 230 / vt[0].height, names=['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'])
if have('l9mid_1.jpg'):
    md = cut('l9mid_1.jpg', 'm', 2, 3, mode='grid', clean='edge')
    pack('mid9', md, 1.0, names=['tank', 'rack', 'crane', 'pipes', 'gen', 'crates'])

# ---------- лаборатория v4: многослойный параллакс, цельные колонны, лифт с лебёдкой, цепи, цистерна, конвейер, оружие в руках ----------
def rgba_m(name, box=None):
    """Кадр Flow на пурпуре -> RGBA (без поиска линий сетки: тёмные колонны и цепи не трогаем)."""
    a = load(name)
    if box: a = a[box[1]:box[3], box[0]:box[2]]
    m = key(a, 'm', grid=False)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m |= (r > 50) & (b > 50) & (g < np.minimum(r, b) * 0.55)          # тёмный пурпур в тенях и на краях
    pur = ~m & (r > g * 1.2) & (b > g * 1.2)                           # отсветы фона на металле -> в холодный серо-бирюзовый
    if pur.any():
        a = a.copy(); L = (r * 0.3 + g * 0.59 + b * 0.11)[pur]
        a[pur, 0] = (L * 0.55).astype(np.int32); a[pur, 1] = (L * 0.95).astype(np.int32); a[pur, 2] = (L * 0.95).astype(np.int32)
    return Image.fromarray(defringe(np.dstack([a, np.where(m, 0, 255)]).astype(np.uint8), 'm'))
def trim(im):
    al = np.asarray(im)[..., 3] > 0; ys, xs = np.where(al)
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
def loop2(a, b, B):
    """Две картинки одной высоты -> одна полоса A+B, у которой оба стыка (A|B и B|A) плавно перетекают."""
    a = np.asarray(a).astype(np.float32); b = np.asarray(b).astype(np.float32)
    if a.shape[2] == 4:                                  # смешиваем с премультипликацией — иначе цвет прозрачного пурпура проступает на стыке
        for x in (a, b): x[..., :3] *= x[..., 3:] / 255
    k = (np.arange(B) / B)[None, :, None]
    ab = a[:, -B:] * (1 - k) + b[:, :B] * k; ba = b[:, -B:] * (1 - k) + a[:, :B] * k
    out = np.concatenate([ba, a[:, B:-B], ab, b[:, B:-B]], 1)
    if out.shape[2] == 4: out[..., :3] /= np.maximum(out[..., 3:], 1) / 255
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))
def save_px(out, im, h):
    im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
    if im.mode == 'RGBA':
        arr = np.asarray(im).copy(); arr[arr[..., 3] < 60, 3] = 0
        ft = int(h * 0.14); arr[:ft, :, 3] = (arr[:ft, :, 3] * np.linspace(0, 1, ft)[:, None] ** 1.5).astype(np.uint8)   # верх слоя растворяется — без среза высоких труб у края кадра
        if out == 'px3': fb = int(h * 0.12); arr[-fb:, :, 3] = (arr[-fb:, :, 3] * np.linspace(1, 0, fb)[:, None]).astype(np.uint8)   # низ ближнего ряда тоже растворяется: второй ряд у лифта ложится на средний план без ступеньки
        im = Image.fromarray(arr)
        im.save(os.path.join(OUT, out + '.png')); DATA.setdefault('_bgp', {})[out] = 1
    else:
        im.save(os.path.join(OUT, out + '.jpg'), quality=90); DATA['_bg'][out] = {'w': im.width, 'h': h}
    bot = np.asarray(im.convert('RGB'))[-6:].reshape(-1, 3).mean(0).astype(int).tolist()     # цвет низа слоя — им заливаем всё ниже, чтобы не было ступеньки
    DATA.setdefault('_px', {})[out] = [im.width, h, '#%02x%02x%02x' % tuple(bot)]
if have('l9rx1_1.jpg'):     # реакторная, те же три плана, что у цеха: дальний зал, средний ряд, ближние машины
    save_px('rx1', seamless(Image.open(os.path.join(SRC, 'l9rx1_1.jpg')).convert('RGB')), 470)
    save_px('rx2', loop2(rgba_m('l9rx2_0.jpg'), rgba_m('l9rx2_1.jpg'), 160), 330)
    save_px('rx3', loop2(rgba_m('l9rx3_0.jpg'), rgba_m('l9rx3_1.jpg'), 160), 300)     # оба варианта ближних машин чередуются
if have('l9px1_1.jpg'):     # дальний план: свод пещеры, туман, силуэты башен
    save_px('px1', seamless(Image.open(os.path.join(SRC, 'l9px1_1.jpg')).convert('RGB')), 470)
if have('l9px2_1.jpg'):     # средний план: резервуары, фермы, стеллажи капсул (два кадра в одну бесшовную петлю)
    save_px('px2', loop2(rgba_m('l9px2_1.jpg'), rgba_m('l9px2_0.jpg'), 160), 330)
if have('l9px3_1.jpg'):     # ближний задний план: прессы, колбы, манипуляторы
    save_px('px3', loop2(rgba_m('l9px3_1.jpg'), rgba_m('l9px3_0.jpg'), 160), 300)
if have('l9col_0.jpg'):     # цельные колонны во всю высоту: тонкая (мостки), толстая (под полом), направляющая ферма
    cl = cut('l9col_0.jpg', 'm', 1, 3, clean=True)
    pack('col9', cl, 1.0, anchor='mid', names=['thin', 'thick', 'rail'])
else:     # исходник l9col_0.jpg затёрт 2026-10-18 — лист assets/l9/col9.png берём готовым из репозитория
    DATA['col9'] = {'f': [[1, 1, 74, 1366, 37, 683], [77, 1, 180, 1366, 90, 683], [259, 1, 213, 1366, 106, 683]], 'n': ['thin', 'thick', 'rail']}
if have('l9lift_1.jpg'):    # грузовой лифт: лебёдка наверху, тросы, кабина с траверсой, стойки шахты
    lw = rgba_m('l9lift_1.jpg'); LK = 0.232
    parts = [trim(lw.crop((0, 0, 768, 340))), lw.crop((330, 420, 460, 820)), trim(lw.crop((30, 880, 740, 1300))), lw.crop((90, 420, 180, 860))]
    pack('lift9', parts, LK, anchor='mid', names=['winch', 'cable', 'car', 'post'])
    DATA['lift9']['carDeck'] = round((1200 - 880) * LK)      # верх настила кабины от верха кадра кабины
if have('l9chain_1.jpg'):   # цепи: крюк и блок с крюком; звенья для продолжения вверх — ровно по периоду звена
    ch = rgba_m('l9chain_1.jpg')
    hk, bl_ = trim(ch.crop((0, 0, 330, 1376))), trim(ch.crop((400, 0, 768, 1376)))
    def link(im, x0, x1):
        al = (np.asarray(im)[:700, x0:x1, 3] > 0).mean(1).astype(np.float32); al -= al.mean()
        best = max(range(40, 300), key=lambda p: float((al[:-p] * al[p:]).mean()))
        return im.crop((x0, 0, x1, best * 2)), best * 2
    lh, ph = link(hk, 0, hk.width)
    pack('chain9', [hk, bl_, lh], 0.26, anchor='mid', names=['hook', 'block', 'link'])
    print('chain link period', ph)
if have('l9tank_0.jpg'):    # цистерна с кислотой вместо луж: 3 кадра поверхности
    tk = cut('l9tank_0.jpg', 'm', 3, 1, clean=True)
    pack('tank9', tk, 1.0, anchor='mid', names=['t0', 't1', 't2'])
if have('l9belt_0.jpg'):    # лента конвейера (тёмная резина с потёками жижи): середина бесшовная (крутим смещением), торцы — из того же кадра
    bt = cut('l9belt_0.jpg', 'm', 4, 1, clean=True)[1]; W_, H_ = bt.size
    mid = seamless(bt.crop((int(W_ * 0.2), 0, int(W_ * 0.8), H_)), 60)        # вся длина ленты — из этого куска, крутится целиком
    dw = int(H_ * 0.95); m_ = np.asarray(mid).astype(np.float32); ma = m_[..., 3] > 0
    def drum(box):     # концевой барабан: только скругление, цвет подогнан под середину ленты
        d = np.asarray(bt.crop(box)).astype(np.float32); da = d[..., 3] > 0
        for y in range(d.shape[0]):     # цвет подгоняем построчно (резина, борт, ролики — каждый пояс под свой цвет середины)
            r_d, r_m = da[y], ma[y]
            if r_d.sum() > 2 and r_m.sum() > 2:
                for ch in range(3): d[y, r_d, ch] += m_[y, r_m, ch].mean() - d[y, r_d, ch].mean()
        return Image.fromarray(d.clip(0, 255).astype(np.uint8))
    pack('belt9b', [drum((0, 0, dw, H_)), mid, drum((W_ - dw, 0, W_, H_))], 0.3, anchor='mid', names=['endL', 'mid', 'endR'])
if have('l9bodies_0.jpg'):  # лежачие тела для ленты (без ленты)
    bd = cut('l9bodies_0.jpg', 'm', 2, 2, mode='grid', clean=True)
    pack('body9', bd, 0.3, names=['bum', 'drunk', 'thug', 'lady'])
# Валера с подобранным оружием: те же листы, что с автоматом, тот же масштаб
WSEL = {'aimmini': 1, 'runmini': 3, 'jumpmini': 2}
WSKIP = set()
WNORM = {'runmini': 168, 'jumpmini': 135}     # перерисованы мельче — подгоняем рост по первому кадру
for w in ('pist', 'mini', 'plasma', 'rocket', 'seed'):
    for sh, v, nm in (('vAim9', 'aim', ['stand', 'fire', 'diag', 'up', 'down', 'crouch', 'crouchFire', 'crouchDiag']), ('vRun9', 'run', ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7']),
                      ('vRunUD9', 'runud', ['u0', 'u1', 'u2', 'u3', 'd0', 'd1', 'd2', 'd3']), ('vJump9', 'jump', ['take', 'rise', 'flip1', 'flip2', 'flip3', 'fallDown', 'fallDiag', 'land'])):
        f = 'l9w%s%s_%d.jpg' % (v, w, WSEL.get(v + w, 0))
        if not have(f): continue
        fr = None
        for g in (10, 4):                            # оружие и вспышки длинные — режем по фигурам; если число не сошлось — по промежуткам
            fr = cut_blobs(f, 'm', 2, grow=g)
            if len(fr) == 8: break
        if len(fr) != 8:
            if v + w in WSKIP: continue              # фигуры слиплись (ствол/вспышка до соседа) — остаётся лист с автоматом, пока не перерисован
            fr = cut(f, 'm', 2, 4, clean=True)
        pack(sh + '_' + w, fr, WNORM[v + w] / fr[0].height if v + w in WNORM else VH / hgt(r0, 0), names=nm)

# ---------- 2026-10-17 (2): враги с целыми кадрами, пол с законченным низом, рука-разгрузчик ----------
if have('l9eHat2_1.jpg'):
    eh = cut('l9eHat2_1.jpg', 'm', 2, [8, 6], clean='edge')     # по промежуткам: бутылка в присяде остаётся в руке, а не прилипает к соседнему кадру
    pack('eHat9', eh, VH * 1.02 / hgt(eh, 0), names=['w0', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'wind', 'throw', 'crouch', 'jump', 'hit', 'dead'])
if have('l9eArm2_0.jpg'):
    ea = cut_blobs('l9eArm2_0.jpg', 'm', 2, grow=6)
    pack('eArm9', ea, VH * 1.18 / hgt(ea, 0), names=['w0', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'raise', 'slam', 'block', 'roar', 'hit', 'dead'])
if have('l9eStump2_0.jpg'):
    es_ = cut_blobs('l9eStump2_0.jpg', 'm', 2, grow=10)
    if len(es_) == 12: pack('eStump9', es_, VH * 0.62 / hgt(es_, 0), names=['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'wall', 'ceil', 'beep', 'boom', 'hit', 'dead'])
if have('l9floor3_0.jpg'):     # пол: верхняя плита + балка с законченным нижним поясом
    fa = rgba_m('l9floor3_0.jpg'); al = np.asarray(fa)[..., 3] > 0; rows = np.where(al.mean(1) > 0.9)[0]
    band = fa.crop((0, int(rows.min()), fa.width, int(rows.max()) + 1)).convert('RGB')
    band = seamless(band, 160); band = band.resize((round(band.width * 96 / band.height), 96), Image.LANCZOS)
    band.save(os.path.join(OUT, 'labFloor.png')); DATA.setdefault('_bgp', {})['labFloor'] = 1
    print('labFloor band rows', rows.min(), rows.max())
FLOOR_PICK = 'l9flB_1.jpg'     # вариант пола 4 (бетонная плита с трещинами); '' — вернуть l9floor3
if FLOOR_PICK and have(FLOOR_PICK):
    band = Image.open(os.path.join(SRC, FLOOR_PICK)).convert('RGB').crop((0, 220, 1376, 385))
    band = seamless(band, 160); band = band.resize((round(band.width * 96 / band.height), 96), Image.LANCZOS)
    band.save(os.path.join(OUT, 'labFloor.png')); DATA.setdefault('_bgp', {})['labFloor'] = 1
if have('l9flE_0.jpg'):     # законченные торцы плиты пола (Flow): скруглённый угол, уголок на болтах; внутренний край — ровный срез
    _e = [trim(rgba_m('l9flE_0.jpg', b)) for b in ((40, 150, 600, 620), (800, 150, 1340, 620))]
    _o = []
    for _i, _im in enumerate(_e):     # торец = наложение поверх самой полосы пола (фактура та же, стыка нет): тень/блик скругления, затухают к середине, + уголок на болтах
        _im = _im.resize((round(_im.width * 96 / _im.height), 96), Image.LANCZOS); a_ = np.asarray(_im).astype(np.float32); al = a_[..., 3] > 110; W_ = a_.shape[1]
        L_ = a_[..., :3].mean(2); rm = np.array([L_[y][al[y]].mean() if al[y].any() else 1 for y in range(96)])[:, None]
        sh_ = np.clip(L_ / np.maximum(rm, 1), 0.3, 1.6)
        xs = np.arange(W_)[None, :] / W_; fade = np.clip((0.45 - (xs if _i == 0 else 1 - xs)) / 0.3, 0, 1)     # к внутреннему краю наложение пропадает
        rust = al & (a_[..., 0] > a_[..., 1] + 12) & (a_[..., 0] > a_[..., 2] + 12)
        out = np.zeros((96, W_, 4), np.float32)
        dk = al & (sh_ < 1); out[dk, 3] = ((1 - sh_) * 255 * 1.1 * fade)[dk]
        lt = al & (sh_ > 1); out[lt, :3] = 255; out[lt, 3] = ((sh_ - 1) * 255 * 0.5 * fade)[lt]
        out[rust, :3] = a_[..., :3][rust]; out[rust, 3] = 255
        _o.append(Image.fromarray(out.clip(0, 255).astype(np.uint8)))
    _sh9 = Image.new('RGBA', (sum(o.width + 2 for o in _o) + 2, 98), (0, 0, 0, 0)); _x = 1; _meta = []     # своя упаковка: pack обнуляет полупрозрачность
    for o in _o: _sh9.paste(o, (_x, 1)); _meta.append([_x, 1, o.width, 96, o.width // 2, 48]); _x += o.width + 2
    _sh9.save(os.path.join(OUT, 'flE9.png')); DATA['flE9'] = {'f': _meta, 'n': ['endL', 'endR']}
if have('l9unload_0.jpg'):     # рука-разгрузчик: 4 кадра сеткой по столбцам, в кадре только рука (связанная с верхом), тело рисуем своё
    from scipy import ndimage
    ua = rgba_m('l9unload_0.jpg'); W_, H_ = ua.size; fr_ = []
    for i in range(4):
        sub = np.asarray(ua.crop((W_ * i // 4, 0, W_ * (i + 1) // 4, H_))).copy(); s_ = sub[..., 3] > 0
        lab, n = ndimage.label(s_); top = set(lab[0:12].ravel()) - {0}
        keep = np.isin(lab, list(top)); sub[~keep, 3] = 0
        if i == 1:     # кадр с телом: оставляем только руку выше захвата (тело — наш спрайт)
            pass
        fr_.append(trim(Image.fromarray(sub)))
    pack('unload9', [fr_[0], fr_[2], fr_[3]], 0.5, names=['closed', 'release', 'open'])

# ---------- мостки v3: перила только спереди, два слоя (настил за Валерой, перила перед ним) ----------
if have('l9walk3_0.jpg'):
    wa = rgba_m('l9walk3_0.jpg'); W_, H_ = wa.size; parts, info = [], {}
    for j, nm in enumerate(['mid', 'endL', 'endR', 'gap']):
        cx_, cy_ = j % 2, j // 2
        cell = wa.crop((W_ * cx_ // 2 + 2, H_ * cy_ // 2 + 2, W_ * (cx_ + 1) // 2 - 2, H_ * (cy_ + 1) // 2 - 2))
        al = np.asarray(cell)[..., 3] > 0; ys = np.where(al.any(1))[0]; xs = np.where(al.any(0))[0]
        cell = cell.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)); al = np.asarray(cell)[..., 3] > 0
        cov = al.mean(1); rr = runs(cov > 0.85, 1, 4); band = max(rr, key=lambda r: r[1] - r[0])     # настил — самая толстая сплошная полоса
        deck = band[0]; grate = band[0] + int((band[1] - band[0]) * 0.32)       # ноги — на решётке, ближе к её дальнему краю
        info[nm] = (deck, grate, cell.height)
        parts += [cell.crop((0, deck, cell.width, cell.height)), cell.crop((0, 0, cell.width, deck))]
    kW = 48 / info['mid'][0]                       # перила над настилом ≈ 24 логических px (ниже пояса Валеры)
    names = []
    for nm in ['mid', 'endL', 'endR', 'gap']: names += [nm + 'B', nm + 'F']
    pack('walk9n', parts, kW, anchor='mid', names=names)
    DATA['walk9n']['geo'] = {nm: [round(v[0] * kW / 2, 2), round(v[1] * kW / 2, 2), round(v[2] * kW / 2, 2)] for nm, v in info.items()}   # логич.: верх настила, ноги, высота кадра
    print('walk9n geo', DATA['walk9n']['geo'])

# ---------- мостки v4: задние перила (серые) за Валерой, передние (жёлтые) перед ним; середина бесшовная ----------
if have('l9walk4_0.jpg'):
    from scipy import ndimage
    a4 = load('l9walk4_0.jpg'); r_, g_, b_ = a4[..., 0], a4[..., 1], a4[..., 2]
    m4 = key(a4, 'm', grid=False) | (r_ > 200) & (g_ > 200) & (b_ > 200)                         # пурпур и белые разделители ячеек
    m4 |= (r_ > 50) & (b_ > 50) & (g_ < np.minimum(r_, b_) * 0.6)                                   # пурпур в дырках решётки
    rgba4 = np.dstack([a4, np.where(m4, 0, 255)]).astype(np.uint8)
    lab, n = ndimage.label(ndimage.binary_dilation(rgba4[..., 3] > 0, iterations=4)); objs = ndimage.find_objects(lab)
    sz = ndimage.sum(rgba4[..., 3] > 0, lab, range(1, n + 1)); big = sorted([i for i in range(n) if sz[i] > sz.max() * 0.2], key=lambda i: (objs[i][0].start > a4.shape[0] // 2, objs[i][1].start))
    order = {0: 'mid', 1: 'endR', 2: 'endL', 3: 'gap'}                                              # верх: середина, правый торец; низ: левый торец, проём
    cells = {}
    for k, i in enumerate(big[:4]):
        sub = rgba4[objs[i]].copy(); sub[lab[objs[i]] != i + 1, 3] = 0; cells[order[k]] = sub
    def split(sub, gap=False):
        al = sub[..., 3] > 0; cov = al.mean(1); cov[int(len(cov) * 0.8):] = 0; rr = runs(cov > 0.8, 1, 3); band = max(rr, key=lambda r: r[1] - r[0])     # низ кадра (лесенка под проёмом) не считаем
        if gap: sub = sub.copy(); sub[band[1] + 2:, :, 3] = 0                                        # обрывок лесенки под проёмом не нужен — лестницы свои
        r, g, b = sub[..., 0].astype(int), sub[..., 1].astype(int), sub[..., 2].astype(int)
        yel = al & (r > 90) & (g > 70) & (b < g * 0.7) & (r > b * 1.4)
        front = ndimage.binary_dilation(yel, iterations=2) & al; front[band[1] + 2:, :] = False
        paint = ndimage.binary_dilation(yel, iterations=2) & al                                          # всё жёлтое (и в слое настила — ножки стоек) -> серый как у задних перил
        back = al & ~paint & (np.abs(r - g) < 30) & (np.abs(g - b) < 40); ref = sub[back][:, :3].astype(float).mean(0) if back.any() else np.array([90, 100, 105.])
        L_ = (r * 0.3 + g * 0.59 + b * 0.11).astype(float); Lm = L_[paint].mean() if paint.any() else 1
        sub = sub.copy()
        for ch in range(3): sub[..., ch] = np.where(paint, np.clip(L_ / Lm * ref[ch], 0, 255), sub[..., ch])
        F = sub.copy(); F[~front, 3] = 0; B = sub.copy(); B[front, 3] = 0
        return Image.fromarray(B), Image.fromarray(F), band
    parts, geo = [], {}
    for nm in ['mid', 'endL', 'endR', 'gap']:
        sub = cells[nm]
        if nm == 'mid':     # середина — кусок ровно от стойки до стойки (повторяется сам, без смешивания), цвет выровнен по длине
            W_ = sub.shape[1]; al_ = sub[..., 3] > 0; r0, g0, b0 = sub[..., 0].astype(int), sub[..., 1].astype(int), sub[..., 2].astype(int)
            yel_ = al_ & (r0 > 90) & (g0 > 70) & (b0 < g0 * 0.7) & (r0 > b0 * 1.4); colc = yel_.sum(0).astype(float)
            pk = [x for x in range(2, W_ - 2) if colc[x] > colc.max() * 0.5 and colc[x] >= colc[x - 2:x + 3].max()]
            posts = []
            for x in pk:
                if not posts or x - posts[-1] > 8: posts.append(x)
            cand = [(b_ - a_, a_, b_) for a_ in posts for b_ in posts if a_ > W_ * 0.08 and b_ < W_ * 0.92 and b_ > a_]
            _, pa, pb = max(cand); sub = sub[:, pa:pb].copy()
            alm = sub[..., 3] > 0; w5 = max(4, sub.shape[1] // 10)
            for ch in range(3):
                L0 = sub[:, :w5, ch][alm[:, :w5]].mean(); L1 = sub[:, -w5:, ch][alm[:, -w5:]].mean(); ramp = np.linspace(0, L0 - L1, sub.shape[1])[None, :]
                sub[..., ch] = np.clip(sub[..., ch].astype(float) + ramp - (L0 - L1) / 2, 0, 255).astype(np.uint8)
            print('walk mid posts', posts, '->', pa, pb)
        B, F, band = split(sub, nm == 'gap')
        geo[nm] = (band[0], band[0] + (band[1] - band[0]) * 0.42, sub.shape[0])
        parts += [B, F]
    kW = 84 / geo['mid'][0]                        # крупнее: передние перила ≈ до пояса Валеры
    names = []
    for nm in ['mid', 'endL', 'endR', 'gap']: names += [nm + 'B', nm + 'F']
    pack('walk9n', parts, kW, anchor='mid', names=names)
    DATA['walk9n']['geo'] = {nm: [round(v[0] * kW / 2, 2), round(v[1] * kW / 2, 2), round(v[2] * kW / 2, 2)] for nm, v in geo.items()}
    print('walk9n v4 geo', DATA['walk9n']['geo'])
# ---------- мостки v5 (l9cw_1): сразу с опорами и лестницей; куски режутся посреди пролётов, стыки выровнены общей полосой ----------
if have('l9cw_1.jpg'):
    from scipy import ndimage
    a5 = load('l9cw_1.jpg').copy(); r_, g_, b_ = [a5[..., i].astype(int) for i in range(3)]
    m5 = key(a5, 'm', grid=False) | ((r_ > 50) & (b_ > 50) & (g_ < np.minimum(r_, b_) * 0.6))
    al5 = ~m5
    Y0, Y1, FEET, FLOOR = 56, 752, 232, 738          # кадр по высоте; линия ног на решётке; низ опорных плит (пол)
    CUTS = [16, 360, 717, 1080, 1360]                # endL | mid | lad | endR — посреди пролётов, между стойками перил
    B_ = 10; ref = a5[:, CUTS[1] - B_:CUTS[1] + B_].astype(float); refA = al5[:, CUTS[1] - B_:CUTS[1] + B_]
    for c in CUTS[2:4]:                              # общая полоса на каждом стыке -> любые куски стыкуются без шва
        for i in range(-B_ - 14, B_ + 14):
            t = 1.0 if abs(i) < B_ else max(0.0, 1 - (abs(i) - B_ + 1) / 14)
            j = min(max(i + B_, 0), 2 * B_ - 1)
            a5[:, c + i] = (a5[:, c + i] * (1 - t) + ref[:, j] * t).astype(np.uint8)
            if t > 0.5: al5[:, c + i] = refA[:, j]
    yel = al5 & (r_ > 90) & (g_ > 70) & (b_ < g_ * 0.7) & (r_ > b_ * 1.4); yel[FEET + 52:] = False
    front = ndimage.binary_dilation(yel, iterations=2) & al5
    back = al5 & ~front & (np.abs(r_ - g_) < 30) & (np.abs(g_ - b_) < 40); back[FEET - 60:] = False
    refc = a5[back][:, :3].astype(float).mean(0); L_ = (r_ * 0.3 + g_ * 0.59 + b_ * 0.11).astype(float); Lm = L_[front].mean()
    for ch in range(3): a5[..., ch] = np.where(front, np.clip(L_ / Lm * refc[ch] * 0.95, 0, 255), a5[..., ch])     # передние перила — тот же серый, что задние
    rgba5 = np.dstack([a5, np.where(al5, 255, 0)]).astype(np.uint8)
    rgba5 = defringe(rgba5, 'm')
    parts, names, cw = [], [], {}
    kC = 2 * 130 / (FLOOR - FEET)                    # ноги на решётке ровно в 130 логич. px над полом
    for nm, x0, x1 in zip(['endL', 'mid', 'lad', 'endR'], CUTS[:-1], CUTS[1:]):
        sub = rgba5[Y0:Y1, x0:x1]; fr = front[Y0:Y1, x0:x1]
        Bp = sub.copy(); Bp[fr, 3] = 0; Fp = sub.copy(); Fp[~fr, 3] = 0
        parts += [Image.fromarray(Bp), Image.fromarray(Fp)]; names += [nm + 'B', nm + 'F']
        cw[nm] = round((x1 - x0) * kC / 2, 2)
    hang = rgba5[430:650, 105:183]                   # кусок ствола опоры — подвес к потолку для мостков над лентой
    parts.append(Image.fromarray(hang)); names.append('hang')
    pack('cw9', parts, kC, anchor='mid', names=names)
    k2 = kC / 2
    DATA['cw9']['geo'] = {'w': cw, 'feet': round((FEET - Y0) * k2, 2), 'h': round((Y1 - Y0) * k2, 2), 'deckBot': round((345 - Y0) * k2, 2),
                          'legStr': [round((430 - Y0) * k2, 2), round((650 - Y0) * k2, 2)], 'lad': round((990 - CUTS[2]) * k2, 2),
                          'legs': {'endL': round((143 - CUTS[0]) * k2, 2), 'mid': round((501 - CUTS[1]) * k2, 2), 'lad': round((857 - CUTS[2]) * k2, 2), 'endR': round((1226 - CUTS[3]) * k2, 2)}}
    print('cw9 geo', DATA['cw9']['geo'])
if have('l9trapa_0.jpg'):     # ловушки: гидропресс (шток тайлом, головка, удар), лазерные ворота (излучатели, луч тайлом)
    B = [(90, 50, 187, 355), (289, 50, 590, 325), (617, 50, 1002, 354), (1022, 222, 1321, 355), (90, 413, 251, 561), (438, 585, 599, 733), (778, 585, 938, 733), (1165, 413, 1235, 733)]
    pack('trap9a', [trim(rgba_m('l9trapa_0.jpg', b)) for b in B], 0.68, anchor='mid', names=['rod', 'head', 'slam', 'anvil', 'emD', 'emU', 'emOff', 'beam'])
if have('l9trapb_0.jpg'):    # паровой клапан (4 стадии), пила в желобе, искрящий кабель
    B = [(111, 216, 304, 427), (458, 104, 651, 427), (760, 0, 1000, 427), (1108, 23, 1302, 427), (16, 461, 534, 557), (1092, 409, 1331, 756)]
    fr = [trim(rgba_m('l9trapb_0.jpg', b)) for b in B]
    def blade(b, top):          # диск пилы: только то, что выше верха желоба (ниже его закрывает желоб)
        im = rgba_m('l9trapb_0.jpg', b); return trim(im.crop((0, 0, im.width, top)))
    fr += [blade((16, 581, 534, 731), 62), blade((567, 581, 1084, 731), 62)]
    pack('trap9b', fr, 0.5, anchor='mid', names=['vent0', 'vent1', 'vent2', 'vent3', 'track', 'cable', 'saw0', 'saw1'])

if have('l9fire_0.jpg'):      # зелёный огонь: настенное сопло (холодное/раскалённое), струи, вспышка; решётка в полу и столбы огня
    B = [(23, 57, 238, 263), (289, 57, 524, 263), (636, 35, 1334, 267), (23, 283, 600, 490), (23, 528, 374, 737), (393, 639, 648, 748), (662, 264, 917, 748), (931, 288, 1187, 748)]
    pack('fire9', [trim(rgba_m('l9fire_0.jpg', b)) for b in B], 0.5, anchor='mid', names=['noz', 'nozHot', 'jet0', 'jet1', 'puff', 'grate', 'col0', 'col1'])
if have('l9tur2_0.jpg'):     # выдвижная лазерная турель: люк, открытие, поднята, прицелы, выстрел, попадание, обломки, пустой люк
    B = [(16, 261, 238, 399), (240, 225, 462, 399), (464, 114, 686, 399), (689, 114, 910, 399), (914, 114, 1151, 399), (1140, 114, 1361, 399),
         (20, 445, 244, 747), (244, 403, 463, 747), (468, 466, 690, 747), (700, 466, 919, 747), (916, 457, 1137, 747), (1141, 496, 1361, 747)]
    pack('tur9', [trim(rgba_m('l9tur2_0.jpg', b)) for b in B], 0.5, anchor='mid', names=['hatch', 'open', 'up', 'a1', 'a2', 'a3', 'a4', 'a5', 'fire', 'hit', 'wreck', 'empty'])
if have('l9lift3_0.jpg'):    # большой грузовой лифт, стена шахты, рычаг, ступень патерностера, цепь, колесо, люлька
    B = [(0, 4, 644, 385), (661, 4, 956, 385), (979, 4, 1159, 385), (1178, 4, 1353, 385), (31, 457, 350, 694), (446, 383, 517, 768), (611, 383, 1003, 768), (1054, 426, 1325, 721)]
    pack('lift9b', [trim(rgba_m('l9lift3_0.jpg', b)) for b in B], 0.5, anchor='mid', names=['deck', 'wall', 'levOff', 'levOn', 'step', 'chain', 'hub', 'cradle'])

for _n, _src, _h in [('bgA', 'l9bgA_1.jpg', 620), ('bgB', 'l9bgB_1.jpg', 520), ('bgC', 'l9bgC_0.jpg', 520)]:     # фоны зон: шахта с ярусами (подъёмник), наклонный тоннель, зал реактора
    if have(_src): save_px(_n, seamless(Image.open(os.path.join(SRC, _src)).convert('RGB')), _h)
if have('l9inc_0.jpg'):      # наклонный грузовой лифт: тележка (настил горизонтальный, колёса на уклоне), рельс, упор
    B = [(10, 24, 1200, 574), (10, 406, 933, 752), (989, 528, 1367, 762)]
    fr = [trim(rgba_m('l9inc_0.jpg', b)) for b in B]
    _c = rgba_m('l9inc_0.jpg', B[0]); _al = np.asarray(_c)[..., 3] > 0; _ys, _xs = np.where(_al); _ox, _oy = _xs.min(), _ys.min()
    _a = np.array(fr[0]); _a[:, :max(0, 235 - B[0][0] - _ox), 3] = 0; _H, _W = _a.shape[:2]; _yy, _xx = np.mgrid[0:_H, 0:_W]; _a[_yy > 153 + 0.315 * (_xx - 12) + 14, 3] = 0
    fr[0] = Image.fromarray(_a)      # у тележки трос, обрубок рельса слева и свой рельс под колёсами — убираем (рельс рисуется отдельно, одной линией)
    print('inc9 car origin', B[0][0] + _ox, B[0][1] + _oy, fr[0].size)
    pack('inc9', fr, 0.5, anchor='mid', names=['car', 'rail', 'stop'])

if have('l9pil_1.jpg'):     # бетонная опора под пол: трапеция-капитель + ствол (повтор по вертикали без шва)
    _cap = rgba_m('l9pil_1.jpg', (496, 0, 958, 190)); _sh = rgba_m('l9pil_1.jpg', (496, 200, 958, 760))
    _sh = seamless(_sh.rotate(90, expand=True), 80).rotate(-90, expand=True)
    pack('pil9', [_cap, _sh], 0.36, anchor='mid', names=['cap', 'shaft'])
if have('l9veg_1.jpg') and have('l9ves_1.jpg'):     # тамбур в перспективе (Flow): на стыках фонов; ворота выхода в том же стиле — 3 кадра (закрыто, наполовину, открыто)
    _vg = cut('l9veg_1.jpg', 'm', 1, 3, clean=True); pack('veg9', _vg, 600 / _vg[0].height, names=['g0', 'g1', 'g2'])
    _vs = cut('l9ves_1.jpg', 'm', 1, 2, clean=True)[0]; pack('ves9', [_vs], 600 / _vs.height, names=['v0'])
if have('l9cw_0.jpg'):     # металлическая опора под пол (нога мостка, двутавр с подкосом): капитель с подкосом, ствол (повтор), база-плита; общий x 420..620, ось ствола 505
    _X = (420, 620); _cp = rgba_m('l9cw_0.jpg', (_X[0], 284, _X[1], 398)); _st = rgba_m('l9cw_0.jpg', (_X[0], 398, _X[1], 668)); _bs = rgba_m('l9cw_0.jpg', (_X[0], 668, _X[1], 748))
    _st = seamless(_st.rotate(90, expand=True), 60).rotate(-90, expand=True)
    pack('pilM9', [_cp, _st, _bs], 1.0, anchor='mid', names=['cap', 'shaft', 'base'])
if have('l9part_0.jpg'):     # рельс (бесшовный по горизонтали), рычаг на тумбе (выкл/вкл), колонна под пол (капитель + ствол), арка тоннеля, стенка чана
    B = [(0, 33, 1376, 141), (26, 326, 217, 650), (217, 326, 408, 650), (389, 171, 591, 743), (587, 227, 1067, 726), (1085, 196, 1348, 737)]
    fr = [trim(rgba_m('l9part_0.jpg', b)) for b in B]; fr[0] = seamless(fr[0], 60)
    pack('part9', fr, 0.5, anchor='mid', names=['rail', 'levOff', 'levOn', 'pillar', 'arch', 'vatwall'])

if have('l9vatdeep_1.jpg'):     # глубокий чан целиком (без растяжки), один кадр — кипение пузырями в коде
    vd = trim(rgba_m('l9vatdeep_1.jpg'))
    pack('vatD9', [vd], 0.5, anchor='mid', names=['v'])

open(os.path.join(ROOT, 'js', 'l9_data.js'), 'w', encoding='utf-8').write('// собрано tools/build_l9.py — не править руками\nwindow.L9D = ' + json.dumps(DATA, separators=(',', ':')) + ';\n')

if DBG:
    for n in DATA:
        if n.startswith('_') or DATA[n].get('add'): continue
        im = Image.open(os.path.join(OUT, n + '.png'))
        bgc = Image.new('RGB', im.size, (60, 70, 90)); bgc.paste(im, (0, 0), im)
        bgc.save(os.path.join(SRC, '_dbg_' + n + '.jpg'), quality=88)
