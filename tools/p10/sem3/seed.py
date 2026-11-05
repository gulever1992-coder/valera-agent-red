# Стартовый набор для «Редактора Семёна»: режет текущий риг фазы 3 (assets/l10/rig30.png + js/rig30_data.js + state.json)
# на отдельные части assets/l10/sem3/*.png и пишет js/sem3_data.js (кости, части, точки, анимации из старых поз).
# Запуск из корня игры: py tools/p10/sem3/seed.py   (перезапишет sem3_data.js — только для первого запуска!)
import json, math, os, re, subprocess, sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'l10', 'sem3')
if os.path.exists(os.path.join(ROOT, 'js', 'sem3_data.js')) and '--force' not in sys.argv:
    sys.exit('js/sem3_data.js уже есть — запусти с --force, если точно надо перезаписать')
os.makedirs(OUT, exist_ok=True)

R = json.loads(subprocess.run(['node', '-e', "global.L10={};require('./js/rig30_data.js');const R=L10.RIG3;console.log(JSON.stringify({J:R.J,rect:R.rect,LK:R.LK}))"],
                              cwd=ROOT, capture_output=True, text=True).stdout)
ST = json.load(open(os.path.join(ROOT, 'art_src', 'l10', 'rig3', 'edit', 'state.json'), encoding='utf-8'))
J, rect, LK, OFF = R['J'], R['rect'], R['LK'], ST['layers']
atlas = Image.open(os.path.join(ROOT, 'assets', 'l10', 'rig30.png')).convert('RGBA')


def cut(name, out=None):
    x, y, w, h = rect[name]; im = atlas.crop((x, y, x + w, y + h)); im.save(os.path.join(OUT, (out or name) + '.png')); return w, h


bones, parts = [], []
def bone(id, p, xy, tip=None):
    b = {'id': id, 'p': p, 'x': round(xy[0], 1), 'y': round(xy[1], 1)}
    if tip: b['tx'], b['ty'] = round(tip[0], 1), round(tip[1], 1)
    bones.append(b)
def part(id, img, w, h, cx, cy, **o):
    d = {'id': id, 'img': img, 'w': w, 'h': h, 'x': round(cx, 1), 'y': round(cy, 1), 'r': 0, 'sx': 1, 'sy': 1}; d.update(o); parts.append(d)
def layer(name, **o):
    w, h = cut(name); ox, oy = OFF[name] if name in OFF else (0, 0); part(name, name, w, h, ox + w / 2, oy + h / 2, **o)

# ---- кости (координаты модели = холст рига 784x1325) ----
bone('root', None, J['root'], [J['root'][0], J['root'][1] + 60])
bone('torso', 'root', J['root'], J['neck'])
bone('belly', 'torso', J['belly'], [J['belly'][0], 980])
bone('head', 'torso', J['neck'], [J['neck'][0], 150])
bone('gun', 'head', J['mgp'], J['mgm'])
bone('spL', 'torso', J['spL'], [150, 200]); bone('spR', 'torso', J['spR'], [620, 200])
bone('ua', 'torso', J['sh'], J['el']); bone('fa', 'ua', J['el'], J['wr']); bone('ha', 'fa', J['wr'], J['tip'])
bone('ua2', 'torso', J['sh2'], J['el2']); bone('fa2', 'ua2', J['el2'], J['wr2']); bone('ha2', 'fa2', J['wr2'], J['tip2'])
HN, HL = 10, 70; hose = []
for i in range(HN):
    hose.append('h%d' % i); bone('h%d' % i, 'torso' if i == 0 else 'h%d' % (i - 1), [J['hose'][0], J['hose'][1] + i * HL], [J['hose'][0], J['hose'][1] + (i + 1) * HL])
legs = []
for i in range(4):
    lk, r = LK[i], J['lgR%d' % i]; dx, dy = r[0] - lk[0][0], r[1] - lk[0][1]; ids = ['l%d%s' % (i, c) for c in 'abcd']; legs.append(ids)
    for j, id in enumerate(ids):
        bone(id, ('spL' if i < 2 else 'spR') if j == 0 else ids[j - 1], [lk[j][0] + dx, lk[j][1] + dy], [lk[j + 1][0] + dx, lk[j + 1][1] + dy])

# ---- части (порядок = кто поверх кого: первые — дальше всех) ----
layer('legs', mode='skin', skin=['spL', 'spR', 'torso'], soft=40, grid=48)
for i in [0, 2, 1, 3]:
    w, h = cut('lk%d' % i); lk, r = LK[i], J['lgR%d' % i]
    part('leg%d' % i, 'lk%d' % i, w, h, r[0] - lk[0][0] + w / 2, r[1] - lk[0][1] + h / 2, mode='skin', skin=legs[i], soft=24, grid=36, tag='leg%d' % i)
layer('body', mode='skin', skin=['torso', 'head', 'belly'], soft=40, grid=44)
w, h = cut('hose'); part('hose', 'hose', w, h, J['hose'][0], J['hose'][1] + HN * HL / 2, r=90, sx=round(HN * HL / w, 4), sy=round(87 / h, 4), mode='skin', skin=hose, soft=20, grid=40, tag='hose')
layer('headO', bone='head', show='mouth')
layer('eyes', bone='head', show='eye')
layer('gun', bone='gun')
for s, (sh, el, wr) in (('', ('sh', 'el', 'wr')), ('2', ('sh2', 'el2', 'wr2'))):
    side = 'L' if s == '' else 'R'
    layer('arm' + s, mode='skin', skin=['ua' + s, 'fa' + s, 'ha' + s], soft=26, grid=36)
    layer('hand' + s, bone='ha' + s, grp='hand' + side, var='claw')
    # ладонь и кулак: «верх» картинки вдоль предплечья, запястье — в точке wr
    e, wv = J[el], J[wr]; ux, uy = wv[0] - e[0], wv[1] - e[1]; l = math.hypot(ux, uy); ux, uy = ux / l, uy / l
    rr = math.atan2(ux, -uy); sx = 1 if side == 'L' else -1
    for k, hh in (('palm', 250), ('fist', 190)):
        W, H = rect[k][2], rect[k][3]; sc = hh / H; o = J[k]; lx, ly = (W / 2 - o[0]) * sc * sx, (H / 2 - o[1]) * sc
        cx, cy = wv[0] + lx * math.cos(rr) - ly * math.sin(rr), wv[1] + lx * math.sin(rr) + ly * math.cos(rr)
        if s == '': cut(k)
        part(k + side, k, W, H, cx, cy, r=round(math.degrees(rr), 2), sx=round(sc * sx, 4), sy=round(sc, 4), bone='ha' + s, grp='hand' + side, var=k)
layer('epaul', bone='ua')

# ---- анимации из старых поз L10.RigFront ----
POSE = {
    'roar': ({'torso': -4, 'head': -8, 'mouth': 1, 'ua': 38, 'fa': 30, 'ua2': 38, 'fa2': 30, 'spL': -10, 'spR': 10, 'ry': -8, 'pL': -1, 'pR': -1}, 50, {}),
    'plasma': ({'torso': 3, 'mouth': 1, 'ua': 14, 'fa': 24, 'ua2': 14, 'fa2': 24, 'ry': -4}, 40, {'look': 1}),
    'laser': ({'torso': 2, 'head': 3, 'eye': 1, 'mouth': 0.15, 'ua': 8, 'ua2': 8}, 40, {'look': 1}),
    'clapUp': ({'torso': -3, 'head': -5, 'mouth': 0.6, 'ua': 150, 'fa': 10, 'ua2': 150, 'fa2': 10, 'pL': 1, 'pR': 1, 'ry': -10, 'spL': -14, 'spR': 14}, 22, {}),
    'clapOut': ({'torso': 4, 'mouth': 0.4, 'ua': 78, 'fa': -6, 'ua2': 78, 'fa2': -6, 'pL': 1, 'pR': 1, 'ry': 2}, 60, {}),
    'clap': ({'torso': 8, 'head': 6, 'mouth': 0.9, 'pL': 1, 'pR': 1, 'ry': 10}, 200, {'ik': 'LR'}),
    'hoseUp': ({'torso': -6, 'head': -6, 'mouth': 0.5, 'ua': 26, 'fa': 34, 'ua2': 26, 'fa2': 34, 'ry': -6, 'pL': -1, 'pR': -1}, 30, {'hose': 'up', 'look': 1}),
    'hoseHit': ({'torso': 10, 'head': 8, 'mouth': 0.9, 'ua': 10, 'ua2': 10, 'ry': 8}, 160, {'hose': 'hit'}),
    'gun': ({'torso': 2, 'mouth': 0.2, 'ua': 6, 'ua2': 6}, 60, {'look': 1, 'gun': 1}),
    'grab': ({'torso': 8, 'mouth': 0.7, 'pL': 1}, 70, {'ik': 'L'}),
    'connect': ({'torso': -2, 'mouth': 0.3, 'spL': -26, 'spR': 26, 'ry': -4, 'ua': 20, 'ua2': 20}, 26, {}),
    'hurt': ({'torso': -9, 'head': -16, 'mouth': 1, 'ua': 46, 'fa': 40, 'ua2': 52, 'fa2': 36, 'ry': -14, 'spL': -8, 'spR': 12, 'pL': -1}, 110, {}),
}
def keys_of(t):
    k, c, v = {}, {}, {}
    for n in ('torso', 'head', 'spL', 'spR', 'ua', 'fa', 'ha'):
        if n in t: k[n] = [[0, t[n]]]
    for n in ('ua2', 'fa2', 'ha2'):
        if n in t: k[n] = [[0, -t[n]]]
    if 'rx' in t or 'ry' in t: k['root'] = [[0, 0, t.get('rx', 0), t.get('ry', 0), 1]]
    for n in ('mouth', 'eye'):
        if n in t: c[n] = [[0, t[n]]]
    for n, g in (('pL', 'handL'), ('pR', 'handR')):
        if n in t: v[g] = [[0, 'palm' if t[n] > 0 else 'fist']]
    return k, c, v
clips = {}
idle_k = {'ua': [[0, 4], [1, 7], [2, 4], [3, 1]], 'fa': [[0, 0], [1, 4], [2, 0], [3, -4]],
          'ua2': [[0, -4], [1, -1], [2, -4], [3, -7]], 'fa2': [[0, 0], [1, -4], [2, 0], [3, 4]]}
for i, ch in enumerate(legs):
    g = -1 if i < 2 else 1
    for j, a in enumerate([-34, 38, 26, 30]): idle_k[ch[j]] = [[0, g * a], [1.5, g * (a + (4 if j < 2 else 8))], [3, g * a]]
clips['idle'] = {'len': 4, 'loop': 1, 'fade': 0.4, 'k': idle_k, 'c': {'mouth': [[0, 0.06], [2, 0.2]]}, 'v': {}, 'f': {}}
for name, (t, kk, f) in POSE.items():
    k, c, v = keys_of(t); clips[name] = {'len': 1, 'loop': 0, 'fade': round(min(0.6, max(0.12, 2.2 / math.sqrt(kk))), 2), 'k': k, 'c': c, 'v': v, 'f': f}
clips['+mouth'] = {'len': 1, 'loop': 1, 'k': {}, 'c': {}, 'v': {}, 'f': {}}
clips['+eye'] = {'len': 1, 'loop': 1, 'k': {}, 'c': {}, 'v': {}, 'f': {}}
clips['+legs'] = {'len': 1, 'loop': 1, 'k': {'spL': [[0, -22]], 'spR': [[0, 22]]}, 'c': {}, 'v': {}, 'f': {}}

D = {
    'v': 1, 'size': [784, 1325], 'cx': J['root'][0], 'water': J['water'], 'top': J['top'], 'box': [170, 120, 600, J['water']], 'use': False,
    'bob': {'x': 4, 'y': 5, 'r': 1.4},
    'roles': {'torso': 'torso', 'head': 'head', 'gun': 'gun', 'armL': ['ua', 'fa', 'ha'], 'armR': ['ua2', 'fa2', 'ha2'], 'hose': hose, 'legs': legs},
    'pts': {'e': {'b': 'head', 'x': J['e'][0], 'y': J['e'][1]}, 'e2': {'b': 'head', 'x': J['e2'][0], 'y': J['e2'][1]},
            'm': {'b': 'head', 'x': J['mouthO'][0], 'y': J['mouthO'][1]}, 'mg': {'b': 'gun', 'x': J['mgm'][0], 'y': J['mgm'][1]},
            'gp': {'b': 'gun', 'x': J['mgp'][0], 'y': J['mgp'][1]}, 'belly': {'b': 'torso', 'x': J['belly'][0], 'y': J['belly'][1]},
            'legL': {'b': 'spL', 'x': 95, 'y': 880}, 'legR': {'b': 'spR', 'x': 2 * J['root'][0] - 95, 'y': 880}},
    'bones': bones, 'parts': parts, 'clips': clips,
}
HEAD = ('// Семён анфас для фазы 3 (уровень 10). Пишет «Редактор Семёна» (Редактор Семёна.bat -> tools/p10/sem3/editor.html).\n'
        '// Части — assets/l10/sem3/<img>.png; кости в координатах модели; анимации: k{кость:[[t,угол,dx,dy,масштаб]]}, c{mouth|eye:[[t,v]]}, v{группа:[[t,вариант]]}.\n'
        '// use: true — игра рисует этого Семёна (L10.Sem3), иначе старый риг L10.RigFront.\n')
open(os.path.join(ROOT, 'js', 'sem3_data.js'), 'w', encoding='utf-8').write(HEAD + 'L10.SEM3 = ' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('ok: bones', len(bones), 'parts', len(parts), 'clips', len(clips))
