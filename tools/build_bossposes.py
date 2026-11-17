# Новые позы боссов для умного ИИ (Flow, пурпурный фон, 3x2):
#   art_src/bosses/biker_new.jpg -> biker2 (присед, отскок, замах тарана, удар о пол, оглушение, толчок)
#   art_src/bosses/chief_new.jpg -> chief2 (удар, захват, отдышка, отскок, приземление, с колена)
#   art_src/bosses/vande_new.jpg -> vande2 (выдохся x2, удар о землю, ладонь, замах ладони, трещина-ловушка)
# Масштаб: эталонный кадр нового листа = росту эталонного кадра старого листа. Все новые фигуры смотрят ВПРАВО.
import os, json
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
