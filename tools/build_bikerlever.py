# Ур.4: Байкер дёргает рычаг статуи (Flow, пурпурный фон, 4x1, смотрит ВПРАВО).
#   art_src/bosses/biker_lever.jpg -> лист l4bikerlever: 0 тянется, 1 схватил, 2 рвёт вниз, 3 торжество
import os, json
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = lambda *p: os.path.join(ROOT, *p)
src = open(A('tools', 'build_l1tut.py'), encoding='utf-8').read()
ns = {'__file__': A('tools', 'build_l1tut.py')}; exec(src[:src.index("s = open(A('js', 'sprites_data.js')")], ns)
key, figures, atlas, _shr = ns["key"], ns["figures"], ns["atlas"], ns["shrink"]
shrink = lambda g, k: _shr(g, k).astype(np.float32) / 255
s = open(A('js', 'sprites_data.js'), encoding='utf-8').read()
i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); S = json.loads(s[i:j])
fs = figures(key(A('art_src', 'bosses', 'biker_lever.jpg')), 4, 1, small=True, minpx=150)
assert len(fs) == 4, len(fs)
H = float(np.median([f[3] for f in S['biker2']['f']]))
k = H / float(np.median([g.shape[0] for g in fs[:2]]))
S['l4bikerlever'] = atlas('l4bikerlever', [shrink(g, k) for g in fs], 1.0, 'feet')
s = s[:i] + json.dumps(S) + s[j:]
open(A('js', 'sprites_data.js'), 'w', encoding='utf-8', newline='').write(s)
print('листов', len(S), [f[2:4] for f in S['l4bikerlever']['f']])
