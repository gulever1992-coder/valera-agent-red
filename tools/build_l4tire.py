# Ур.4: колесо мотоцикла для «дождя колёс» (Байкер дёргает рычаг). Flow, пурпурный фон, 2x2.
#   art_src/l4tire/tire_1.jpg -> лист l4tire (4 кадра вращения, якорь по центру, ~36 px логики = 72 px листа)
import os, json
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = lambda *p: os.path.join(ROOT, *p)
src = open(A('tools', 'build_l1tut.py'), encoding='utf-8').read()
ns = {'__file__': A('tools', 'build_l1tut.py')}; exec(src[:src.index("s = open(A('js', 'sprites_data.js')")], ns)
key, figures, atlas = ns["key"], ns["figures"], ns["atlas"]
s = open(A('js', 'sprites_data.js'), encoding='utf-8').read()
i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); S = json.loads(s[i:j])
fs = figures(key(A('art_src', 'l4tire', 'tire_1.jpg')), 2, 2, small=True, minpx=150)
assert len(fs) == 4
D = float(np.median([max(g.shape[:2]) for g in fs]))
fr = atlas('l4tire', fs, 72 / D, 'center')
for f in fr['f']: f[5] = f[3] / 2
S['l4tire'] = fr
s = s[:i] + json.dumps(S) + s[j:]
open(A('js', 'sprites_data.js'), 'w', encoding='utf-8', newline='').write(s)
print('листов', len(S))
