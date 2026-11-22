# Ур.4: Валера целится «Осеменителем 3000» вверх и под 45° (стоя и в прыжке). Flow, 2x2, маджента.
#   art_src/l4v/pick/gunaim.jpg, gungaim.jpg -> py tools/p4v_grid.py ... 2 2 -> листы v10_gunaim / v11_gunaim
#   кадры: 0 стоя вверх, 1 стоя 45°, 2 прыжок вверх, 3 прыжок 45°. Масштаб — по ширине фуражки, как v10_gun.
import os, json
A = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(A, 'p4v_build.py')
src = open(P, encoding='utf-8').read()
ns = {'__file__': P, '__name__': 'aim'}; exec(src[:src.index("gun = load('gun'")], ns)
PV, atlas, load, ROOT = ns['PV'], ns['atlas'], ns['load'], ns['ROOT']
S = {}
for name, sheet in [('gunaim', 'v10_gunaim'), ('gungaim', 'v11_gunaim')]:
    k = PV.scale(name); print(name, 'k', round(k, 3), 'gun k', round(ns['K']['gun'], 3))
    S[sheet] = atlas(sheet, load(name, range(4)), k)
path = os.path.join(ROOT, 'js', 'sprites_data.js'); s = open(path, encoding='utf-8').read()
i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); D = json.loads(s[i:j]); D.update(S)
open(path, 'w', encoding='utf-8', newline='').write(s[:i] + json.dumps(D) + s[j:])
print('листов', len(D), [ (n, [f[2:6] for f in S[n]['f']]) for n in S])
