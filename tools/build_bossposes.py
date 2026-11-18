# Новые позы боссов для умного ИИ (Flow, пурпурный фон, 3x2):
#   art_src/bosses/biker_new.jpg -> biker2 (присед, отскок, замах тарана, удар о пол, оглушение, толчок)
#   art_src/bosses/chief_new.jpg -> chief2 (удар, захват, отдышка, отскок, приземление, с колена)
#   art_src/bosses/vande_new.jpg -> vande2 (выдохся x2, удар о землю, ладонь, замах ладони, трещина-ловушка)
# Масштаб: эталонный кадр нового листа = росту эталонного кадра старого листа. Все новые фигуры смотрят ВПРАВО.
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
for name, f, ref, refi, newi in [('biker2', 'biker_new.jpg', 'biker', 0, 4), ('chief2', 'chief_new.jpg', 'boss4a', 8, 0), ('vande2', 'vande_new.jpg', 'b_cast', 0, 3)]:
    fs = figures(key(A('art_src', 'bosses', f)), 3, 2, small=True, minpx=150)
    assert len(fs) == 6, (name, len(fs))
    S[name] = atlas(name, fs, S[ref]['f'][refi][3] / float(fs[newi].shape[0]), 'feet')
s = s[:i] + json.dumps(S) + s[j:]
open(A('js', 'sprites_data.js'), 'w', encoding='utf-8', newline='').write(s)

# низкий присед байкера (art_src/bosses/biker_duck.jpg, 3x1) -> biker3; в исходнике фигуры крупнее, масштаб по росту приседа
s = open(A('js', 'sprites_data.js'), encoding='utf-8').read()
i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); S = json.loads(s[i:j])
fs = figures(key(A('art_src', 'bosses', 'biker_duck.jpg')), 3, 1, small=True, minpx=150)
S['biker3'] = atlas('biker3', fs, S['biker']['f'][0][3] * 0.55 / float(fs[1].shape[0]), 'feet')   # средний кадр (на колене) = 55% роста стоя
s = s[:i] + json.dumps(S) + s[j:]
open(A('js', 'sprites_data.js'), 'w', encoding='utf-8', newline='').write(s)

# кадр прыжка байкера (biker:2): убрать летящий камень с линиями движения (отдельные мелкие куски над плечом) — владелец 2026-11-17
from scipy import ndimage
im = Image.open(A('assets', 'spr', 'biker.png')).convert('RGBA'); a = np.array(im)
f = S['biker']['f'][2]; sub = a[f[1]:f[1] + f[3], f[0]:f[0] + f[2]]
lab, n = ndimage.label(sub[..., 3] > 20); sz = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
big = 1 + int(np.argmax(sz))
for k in range(1, n + 1):
    if k == big: continue
    ys, xs = np.where(lab == k)
    if ys.max() < f[3] * 0.2 and xs.min() > f[2] * 0.6: sub[lab == k] = 0
a[f[1]:f[1] + f[3], f[0]:f[0] + f[2]] = sub
Image.fromarray(a, 'RGBA').save(A('assets', 'spr', 'biker.png'))
