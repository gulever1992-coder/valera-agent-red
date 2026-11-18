# Ванделорд ур.6, правки владельца 2026-11-18 (Flow, пурпурный фон):
#   art_src/l6/vande_walk_new.jpg (4x2: бег 0-3, ходьба 4-7) -> лист vandewalk (заменяет старый «не в стиле»)
#   art_src/l6/vande_cast_fix.jpg (2x1: вспышка, луч) -> кадры b_cast 5 и 9 (в исходнике были обрезаны сеткой)
#   art_src/l6/vande_py_new.jpg (4x2) -> кадры b_py 0-3 и 8-11 (змея 4-7 остаётся)
# Запускать ПОСЛЕ build_l6.py (он пересобирает эти листы из старых исходников).
import os, json
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = lambda *p: os.path.join(ROOT, *p)
src = open(A('tools', 'build_l1tut.py'), encoding='utf-8').read()
ns = {'__file__': A('tools', 'build_l1tut.py')}; exec(src[:src.index("s = open(A('js', 'sprites_data.js')")], ns)
key, figures, atlas, _shr = ns["key"], ns["figures"], ns["atlas"], ns["shrink"]
shrink = lambda g, k: _shr(g, k).astype(np.float32) / 255
s = open(A('js', 'sprites_data.js'), encoding='utf-8').read()
i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); S = json.loads(s[i:j])
med = lambda fr: float(np.median([f[3] for f in fr]))
def old(sheet):   # кадры существующего листа как RGBA float
    im = np.array(Image.open(A(*S[sheet]['img'].split('/'))).convert('RGBA')).astype(np.float32) / 255
    return [im[f[1]:f[1] + f[3], f[0]:f[0] + f[2]] for f in S[sheet]['f']]
def put(sheet, frames):
    fr = atlas(sheet, frames, 1.0, 'feet'); S[sheet] = fr
# 1) ходьба/бег
fs = figures(key(A('art_src', 'l6', 'vande_walk_new.jpg')), 4, 2, small=True, minpx=150)
assert len(fs) == 8
H = med(S['b_loco']['f']); fs = [shrink(g, H / float(np.median([x.shape[0] for x in fs]))) for g in fs]
put('vandewalk', fs)
# 2) вспышка и луч
fs = figures(key(A('art_src', 'l6', 'vande_cast_fix.jpg')), 2, 1, small=True, minpx=150)
assert len(fs) == 2
k = S['b_cast']['f'][8][3] / float(fs[1].shape[0])     # луч стоя ~ рост «указывает в землю» (b_cast 8)
fr = old('b_cast'); fr[5] = shrink(fs[0], k); fr[9] = shrink(fs[1], k)
put('b_cast', fr)
# 3) змея
p = A('art_src', 'l6', 'vande_py_new.jpg')
if os.path.exists(p):
    fs = figures(key(p), 4, 2, small=True, minpx=150)
    assert len(fs) == 8
    fr = old('b_py'); kk = med(S['b_py']['f'][:4]) / float(np.median([x.shape[0] for x in fs]))
    for n, g in zip([0, 1, 2, 3, 8, 9, 10, 11], fs): fr[n] = shrink(g, kk)
    put('b_py', fr)
    for n in (4, 5, 6, 7): S['b_py']['f'][n][5] = S['b_py']['f'][n][3] / 2   # змея — якорь по центру, как было
s = s[:i] + json.dumps(S) + s[j:]
open(A('js', 'sprites_data.js'), 'w', encoding='utf-8', newline='').write(s)
