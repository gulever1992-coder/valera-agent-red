# ЦЕЛЫЕ РУКИ Семёна фазы 3 (отзыв 2026-11-05: «из частей руки выглядят плохо»).
# Каждая поза — рука целиком от плеча до когтей, нарисованная во Flow правкой от Т-позы (_shots/arm_<поза>_full.jpg),
# вырезана по разнице с t_nogun_a.jpg (arm_masks.py). В риге: жёсткая часть на кости плеча ua/ua2, группа armL/armR, вариант = поза,
# hand = точка кисти (по ней IK поворачивает всю руку от плеча к цели). Клипы переключают позы (v.armL / v.armR).
# Запуск из корня игры: py tools/p10/sem3/build_arms.py   (затем py tools/optimize_assets.py)
import json, math, os, shutil, sys
import numpy as np
from PIL import Image
from scipy import ndimage as nd
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import arm_masks as AM

ROOT = AM.ROOT; OUT = os.path.join(ROOT, 'assets', 'l10', 'sem3'); DATA = os.path.join(ROOT, 'js', 'sem3_data.js')
BAK = os.path.join(ROOT, 'art_src', 'l10', 'sem3', 'sem3_data_v4_tpose.js')
if not os.path.exists(BAK): shutil.copy(DATA, BAK)
txt = open(DATA, encoding='utf-8').read(); head, body = txt.split('L10.SEM3 = ', 1); D = json.loads(body.rstrip().rstrip(';'))
CX = D['cx']; SHO = {'L': (521.7, 302.2), 'R': (855.0, 300.0)}


def key(im, m):
    a = np.asarray(im).astype(np.float32); al = nd.gaussian_filter(m.astype(np.float32), 0.8)
    al = np.clip((al - 0.15) / 0.7, 0, 1)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]; sp = np.clip((np.minimum(r, b) - g - 10) / 200, 0, 1)   # пурпур на кромке -> нейтраль
    rgb = np.dstack([r - sp * (r - g), g, b - sp * (b - g)])
    core = nd.binary_erosion(m, iterations=2).astype(np.float32); w = nd.gaussian_filter(core, 3) + 1e-4
    fill = np.dstack([nd.gaussian_filter(rgb[..., i] * core, 3) / w for i in range(3)]); e = (1 - core)[..., None]
    rgb = rgb * (1 - e) + fill * e
    return np.dstack([rgb, al * 255]).clip(0, 255).astype(np.uint8)


parts = []
for k in AM.POSES:
    im, m = AM.mask(k)
    lab, n = nd.label(m); cen = nd.center_of_mass(m, lab, range(1, n + 1)); sz = nd.sum(m, lab, range(1, n + 1))
    xx = np.arange(m.shape[1])[None, :]
    for S in ('L', 'R'):
        ms = np.zeros_like(m)
        for i in range(n):
            if sz[i] < 1500: continue
            c = lab == i + 1; cols = np.where(c.any(0))[0]
            if cols.min() < CX < cols.max() and sz[i] > 4000:     # одна связная масса через центр (ладони вместе) — делим по центру
                ms |= c & ((xx < CX) if S == 'L' else (xx >= CX))
            elif (cen[i][1] < CX) == (S == 'L'): ms |= c
        if ms.sum() < 1500: print('!! пусто', k, S); continue
        a = key(im, ms); ys, xs = np.where(ms); bb = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
        name = 'p_arm_%s%s' % (k, S); Image.fromarray(a, 'RGBA').crop(bb).save(os.path.join(OUT, name + '.png'))
        sx, sy = SHO[S]; d = np.hypot(xs - sx, ys - sy); far = d >= np.percentile(d, 80)
        if k == 'clapShut': dc = np.abs(xs - CX); far = dc <= np.percentile(dc, 12)     # ладони сходятся в центре
        hand = [round(float(xs[far].mean()), 1), round(float(ys[far].mean()), 1)]
        parts.append({'id': 'arm_%s%s' % (k, S), 'img': name, 'w': int(bb[2] - bb[0]), 'h': int(bb[3] - bb[1]), 'x': (bb[0] + bb[2]) / 2, 'y': (bb[1] + bb[3]) / 2,
                      'r': 0, 'sx': 1, 'sy': 1, 'bone': 'ua' if S == 'L' else 'ua2', 'grp': 'arm' + S, 'var': k, 'tag': 'arm', 'hand': hand})
        print(k, S, bb, 'hand', hand)

# части: старые составные руки и кисти -> целые руки (на месте старой руки, под погонами)
old = [p for p in D['parts'] if p.get('tag') == 'arm']; i0 = D['parts'].index(old[0]) if old else len(D['parts'])
rest = [p for p in D['parts'] if p.get('tag') != 'arm']; at = sum(1 for p in D['parts'][:i0] if p.get('tag') != 'arm')
D['parts'] = rest[:at] + parts + rest[at:]
# кости: от руки остаётся только плечо
D['bones'] = [b for b in D['bones'] if b['id'] not in ('fa', 'ha', 'fa2', 'ha2')]
for b in D['bones']:
    if b['id'] == 'ua': b.update(x=SHO['L'][0], y=SHO['L'][1], tx=360, ty=320)
    if b['id'] == 'ua2': b.update(x=SHO['R'][0], y=SHO['R'][1], tx=1015, ty=320)
D['roles']['armL'] = ['ua']; D['roles']['armR'] = ['ua2']

# клипы: какая поза у левой/правой руки, IK, «к зрителю» (масштаб в конце)
MAP = {'idle': ('hang', 'hang'), 'roar': ('roar', 'roar'), 'plasma': ('palmUp', 'palmUp'), 'laser': ('hang', 'hang'),
       'clapUp': ('palmUp', 'palmUp'), 'clapOut': ('low', 'low'), 'clap': ('clap', 'clap'), 'hoseUp': ('guard', 'guard'),
       'hoseHit': ('guard', 'guard'), 'gun': ('hang', 'hang'), 'grab': ('grab', 'hang'), 'connect': ('low', 'low'),
       'hurt': ('guard', 'guard'), 'smashUp': ('fistUp', 'fistUp'), 'smash': ('smash', 'smash'), 'hoseSweep': ('low', 'guard')}
for cn, c in D['clips'].items():
    K = c.setdefault('k', {})
    for b in ('fa', 'ha', 'fa2', 'ha2'): K.pop(b, None)
    v = c.setdefault('v', {}); v.pop('handL', None); v.pop('handR', None)
    if cn not in MAP: K.pop('ua', None); K.pop('ua2', None); continue
    L, R = MAP[cn]; v['armL'] = [[0, L]]; v['armR'] = [[0, R]]
    if cn == 'idle': K['ua'] = [[0, 0], [1, 2], [2, 0], [3, -2]]; K['ua2'] = [[0, 0], [1, -2], [2, 0], [3, 2]]
    elif cn == 'roar': K['ua'] = [[0, -3], [0.25, 3]]; K['ua2'] = [[0, 3], [0.25, -3]]
    elif cn == 'clap': K['ua'] = [[0, 0, 0, 0, 1], [0.3, 0, 0, 0, 1.12]]; K['ua2'] = [[0, 0, 0, 0, 1], [0.3, 0, 0, 0, 1.12]]
    elif cn == 'smash': K['ua'] = [[0, 0, 0, 0, 1], [0.25, 0, 0, 0, 1.1]]; K['ua2'] = [[0, 0, 0, 0, 1], [0.25, 0, 0, 0, 1.1]]
    else: K['ua'] = [[0, 0]]; K['ua2'] = [[0, 0]]
    if cn == 'clap': c.setdefault('f', {}).pop('ik', None)
D['arms'] = 2
open(DATA, 'w', encoding='utf-8').write(head + 'L10.SEM3 = ' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('parts', len(D['parts']), 'arm parts', len(parts))
