# Усач (L4.Flirt в закрытом зале) — один и тот же мужик во всех кадрах, эталон — его ходьба (mwalk 0..3).
# Flow: art_src/usach/us_p1.jpg (стойка, тянется, поцелуй), us_s1.jpg (захват Валеры 2x3).
# Нарезка: FLOOD=1 py tools/p4v_grid.py art_src/usach/us_p1.jpg pose 1 3 art_src/usach/frames  (и spin 2 3)
# menact: кадр 2 = тянется, 7 = поцелуй, 8 (новый) = стойка; spin — целиком. Пишет assets/spr/*.png и js/sprites_data.js.
import os, sys, json, numpy as np
from PIL import Image
R = os.path.join(os.path.dirname(__file__), '..')
sys.path.insert(0, os.path.join(R, 'tools')); from defringe import defringe
FR = os.path.join(R, 'art_src/usach/frames')
p = os.path.join(R, 'js/sprites_data.js'); s = open(p, encoding='utf-8').read()
i = s.index('{'); S, end = json.JSONDecoder().raw_decode(s[i:]); end += i
def load(name):
    a = np.array(Image.open(os.path.join(FR, name)).convert('RGBA'))
    r, g, b = [a[..., c].astype(int) for c in range(3)]
    a[np.sqrt((r - 255) ** 2 + g ** 2 + (b - 255) ** 2) < 120, 3] = 0   # пурпур, запертый между рукой и телом
    return a
def scale(a, k):
    h, w = a.shape[:2]; size = (max(1, round(w * k)), max(1, round(h * k)))
    f = a.astype(np.float32) / 255; pm = np.dstack([f[..., :3] * f[..., 3:4], f[..., 3:4]])
    ch = [np.array(Image.fromarray(pm[..., c]).resize(size, Image.LANCZOS)) for c in range(4)]
    al = np.clip(ch[3], 0, 1); rgb = [np.clip(c / np.maximum(al, 1e-3), 0, 1) for c in ch[:3]]
    out = (np.dstack(rgb + [np.where(al > 0.45, 1.0, 0.0)]) * 255 + 0.5).astype(np.uint8)
    return defringe(out)
def frames_of(key):
    d = S[key]; im = Image.open(os.path.join(R, d['img'])).convert('RGBA')
    return [(np.array(im.crop((f[0], f[1], f[0] + f[2], f[1] + f[3]))), f) for f in d['f']]
def pack(key, items):   # items: (rgba, old_f или None)
    x = 0; F = []
    for a, of in items:
        h, w = a.shape[:2]
        if of: F.append([x, 0, w, h, round(of[4] / of[2] * w, 1), float(h), round(of[6] / of[2] * w, 1), of[7]])
        else:
            m = a[..., 3] > 100; xs = np.where(m[int(h * 0.85):].any(axis=0))[0]; ax = round(float(xs.mean()), 1)
            F.append([x, 0, w, h, ax, float(h), ax, 0])
        x += w + 2
    at = Image.new('RGBA', (x, max(a.shape[0] for a, _ in items)), (0, 0, 0, 0))
    for (a, _), f in zip(items, F): at.paste(Image.fromarray(a, 'RGBA'), (f[0], 0))
    at.save(os.path.join(R, S[key]['img']), optimize=True); S[key]['f'] = F
    print(key, len(F), at.size)
# позы: рост стоящего = рост кадра ходьбы
walk_h = S['mwalk']['f'][0][3]
idle = load('pose_00.png'); k = (walk_h + 2) / idle.shape[0]
old = frames_of('menact')
items = [(fa, f) for fa, f in old]
items[2] = (scale(load('pose_01.png'), k), old[2][1])
items[7] = (scale(load('pose_02.png'), k), old[7][1])
items.append((scale(idle, k), None))
pack('menact', items)
# захват: средний масштаб по высоте старых кадров
olds = frames_of('spin'); news = [load('spin_%02d.png' % j) for j in range(6)]
ks = float(np.median([of[3] / n.shape[0] for (_, of), n in zip(olds, news)]))
pack('spin', [(scale(n, ks), of) for n, (_, of) in zip(news, olds)])
open(p, 'w', encoding='utf-8').write(s[:i] + json.dumps(S) + s[end:])
