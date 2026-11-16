# Ползание Валеры на ур.1 и ур.4 — тот же цикл, что на ур.7 (лист val4, 6 кадров), в одежде уровня.
# Flow (Nano Banana Pro) по образцам art_src/l1/crawl/ref_crawl7.jpg + ref_look1/ref_look4.jpg
# -> art_src/l1/crawl/crawl_l1.jpg, crawl_l4.jpg (3x2, пурпурный фон) -> атласы v1_crawl6, v4_crawl6 в js/sprites_data.js.
# Высота: ур.1 — val4 * 0.84 (как ур.7 рисует ползание), ур.4 — как прежний v7_crawl; опора — низ кадра.
import os, sys, json
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import importlib.util
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = lambda *p: os.path.join(ROOT, *p)
src = open(A('tools', 'build_l1tut.py'), encoding='utf-8').read()
ns = {'__file__': A('tools', 'build_l1tut.py')}; exec(src[:src.index("s = open(A('js', 'sprites_data.js')")], ns)     # key / figures / shrink / atlas без запуска сборки ур.1
key, figures, atlas = ns['key'], ns['figures'], ns['atlas']

s = open(A('js', 'sprites_data.js'), encoding='utf-8').read()
i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); S = json.loads(s[i:j])
H7 = float(np.median([f[3] for f in S['val4']['f'][:6]])) * 0.84
for lvl in sys.argv[1:] or ['1', '4']:
    p = A('art_src', 'l1', 'crawl', 'crawl_l%s.jpg' % lvl)
    if not os.path.isfile(p): print('нет', p); continue
    fs = figures(key(p), 3, 2)
    h = H7 if lvl == '1' else float(np.median([f[3] for f in S['v7_crawl']['f']]))     # ур.4: рост как у прежнего ползания (Валера там крупнее)
    S['v%s_crawl6' % lvl] = atlas('v%s_crawl6' % lvl, fs, h / float(np.median([g.shape[0] for g in fs])), 'center')
s = s[:i] + json.dumps(S) + s[j:]
open(A('js', 'sprites_data.js'), 'w', encoding='utf-8', newline='').write(s)
