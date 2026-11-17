# Ур.4, финал у клуба: Вова вешает цепь на ручки двери и курит бульбулятор (Flow, пурпурный фон)
#   art_src/l4/endvova/vova_chain.jpg (3x2), vova_bong.jpg (4x2)
# -> атласы vovachain, vovabong (рост как у листа vova); запись в js/sprites_data.js
import os, json
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = lambda *p: os.path.join(ROOT, *p)
src = open(A('tools', 'build_l1tut.py'), encoding='utf-8').read()
ns = {'__file__': A('tools', 'build_l1tut.py')}; exec(src[:src.index("s = open(A('js', 'sprites_data.js')")], ns)
key, figures, atlas = ns['key'], ns['figures'], ns['atlas']
s = open(A('js', 'sprites_data.js'), encoding='utf-8').read()
i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); S = json.loads(s[i:j])
H0 = S['vova']['f'][0][3]     # рост стоящего Вовы в атласе
for name, f, cols, rows in [('vovachain', 'vova_chain.jpg', 3, 2), ('vovabong', 'vova_bong.jpg', 4, 2)]:
    fs = figures(key(A('art_src', 'l4', 'endvova', f)), cols, rows, small=True, minpx=150)     # small: дым, искры — отдельные куски
    k = H0 / float(np.median([g.shape[0] for g in fs]))
    S[name] = atlas(name, fs, k, 'feet')
s = s[:i] + json.dumps(S) + s[j:]
open(A('js', 'sprites_data.js'), 'w', encoding='utf-8', newline='').write(s)

# цепь с замком на ручках двери (art_src/l4/endvova/chain_lock.jpg) -> assets/spr/endchain.png; в игре 12x17 ровно по ручкам
g = key(A('art_src', 'l4', 'endvova', 'chain_lock.jpg')); al = g[..., 3] > 0.5
ys, xs = np.where(al); g = g[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
Image.fromarray((np.dstack([g[..., :3], np.where(g[..., 3] > 0.5, 1.0, 0.0)]) * 255).astype(np.uint8), 'RGBA').save(A('assets', 'spr', 'endchain.png'))

# Вова переключает О-3000 на зелёный (art_src/l4/endvova/vovagun_new.jpg, 3x2): ружьё как у Валеры -> атлас vovagun4 (рост как у vovagun3)
s = open(A('js', 'sprites_data.js'), encoding='utf-8').read()
i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); S = json.loads(s[i:j])
fs = figures(key(A('art_src', 'l4', 'endvova', 'vovagun_new.jpg')), 3, 2, minpx=150)
H1 = float(np.median([f[3] for f in S['vovagun3']['f']]))
S['vovagun4'] = atlas('vovagun4', fs, H1 / float(np.median([g.shape[0] for g in fs])), 'feet')
s = s[:i] + json.dumps(S) + s[j:]
open(A('js', 'sprites_data.js'), 'w', encoding='utf-8', newline='').write(s)
