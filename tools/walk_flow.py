# Ходьба из Flow: правка листа «4 копии стоящего кадра» -> 4 позы (art_src/walkc/gen_<set>.jpg).
# Масштаб — по высоте «макушка..низ куртки» как у стоящего кадра; опора — центр бёдер, как у стойки.
# Отчёт: отклонение ширины лица/живота/ног от стойки и чередование ног. Пишет атласы ходьбы (4 кадра).
# Запускать ПОСЛЕДНИМ (после p4v_build / p4v_rooms). python walk_flow.py [set ...] [--check]
import os, sys, json, glob, subprocess, numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from defringe import defringe
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SPR = os.path.join(ROOT, 'assets', 'spr'); W0 = os.path.join(ROOT, 'art_src', 'walkc')
SETS = {'l12': ('v_jump', 0, 'v_run'), 'l3': ('v4_act', 0, 'v4_run'), 'l4m': ('v19_mact', 0, 'v19_mrun'), 'l4s': ('v7_act', 0, 'v17_runs'),
        'l4f': ('v12_fist', 0, 'v12_run'), 'l4g': ('v10_gun', 0, 'v10_gunw'), 'l4gg': ('v11_gun', 0, 'v11_gunw')}
p = os.path.join(ROOT, 'js', 'sprites_data.js'); s = open(p, encoding='utf-8').read(); i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); D = json.loads(s[i:j])
def M(a):
    a = a.astype(int); al = a[..., 3] > 100
    orange = al & (a[..., 0] > 170) & (a[..., 0] - a[..., 1] > 60) & (a[..., 2] < 110)
    skin = al & (a[..., 0] > 185) & (a[..., 1] > 120) & (a[..., 2] > 80) & (a[..., 0] - a[..., 2] > 45) & (a[..., 0] - a[..., 1] > 15) & (a[..., 0] - a[..., 1] < 95)
    jeans = al & (a[..., 2] > a[..., 0] + 12) & (a[..., 2] > 45) & (a[..., 2] >= a[..., 1])
    return al, orange, skin, jeans
def stats(a):
    al, orange, skin, jeans = M(a); ys = np.where(al.any(1))[0]; top, bot = ys[0], ys[-1]
    c = orange.sum(1); hem = int(np.where(c >= c.max() * 0.25)[0][-1])
    belly = float(np.percentile(c[c > 0], 90))
    sr = np.where(skin.sum(1) >= 3)[0]; sr = sr[sr < top + (bot - top) * 0.4]
    face = float(np.median([skin[y].sum() for y in sr[:max(3, len(sr) // 2)]])) if len(sr) else 0
    jr = jeans[hem + 2:]; legw = float(np.median(jr.sum(1)[jr.sum(1) > 0])) if jr.any() else 0
    xs = np.where(jeans[hem + 2:hem + 8].any(0))[0]; hip = (xs[0] + xs[-1]) / 2 if len(xs) else a.shape[1] / 2
    return dict(top=top, bot=bot, hem=hem, upper=hem - top, belly=belly, face=face, legw=legw, hip=hip)
def alt(a):
    al, orange, skin, jeans = M(a); h = a.shape[0]; lo = jeans[int(h * 0.62):int(h * 0.92)]; L = a[int(h * 0.62):int(h * 0.92), :, :3].astype(int).sum(2) / 3
    ys, xs = np.where(lo)
    if len(xs) < 50: return 0
    cx = np.median(xs); X = np.arange(a.shape[1])[None, :]
    return float(L[lo & (X > cx)].mean() - L[lo & (X <= cx)].mean())
check = '--check' in sys.argv; only = [x for x in sys.argv[1:] if not x.startswith('--')]
for key, (sheet, fi, out) in SETS.items():
    if only and key not in only: continue
    src = os.path.join(W0, 'gen_%s.jpg' % key)
    if not os.path.exists(src): continue
    d = D[sheet]; f = d['f'][fi]; S = np.array(Image.open(os.path.join(ROOT, d['img'])).convert('RGBA').crop((f[0], f[1], f[0] + f[2], f[1] + f[3]))); st = stats(S)
    fr_dir = os.path.join(W0, 'frames'); os.makedirs(fr_dir, exist_ok=True)
    for x in glob.glob(os.path.join(fr_dir, key + '_*.png')): os.remove(x)
    subprocess.run([sys.executable, os.path.join(ROOT, 'tools/p4v_grid.py'), src, key, '1', '4', fr_dir], check=True, env=dict(os.environ, FLOOD='1'), stdout=subprocess.DEVNULL)
    G = [np.array(Image.open(x).convert('RGBA')) for x in sorted(glob.glob(os.path.join(fr_dir, key + '_[0-9][0-9].png')))]
    k = st['upper'] / float(np.median([stats(g)['upper'] for g in G]))
    frames, rep = [], []
    for g in G:
        gi = g.astype(int); mg = np.sqrt((gi[..., 0] - 255) ** 2 + gi[..., 1] ** 2 + (gi[..., 2] - 255) ** 2) < 120; g[mg, 3] = 0   # фон, запертый в сетке ракетки и между ногами
        g = np.array(Image.fromarray(g).resize((round(g.shape[1] * k), round(g.shape[0] * k)), Image.LANCZOS)); g[..., 3] = np.where(g[..., 3] > 110, 255, 0); g = defringe(g)
        lab, n = ndimage.label(g[..., 3] > 0)
        if n > 1:
            sz = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1)); g[np.isin(lab, [q + 1 for q in range(n) if sz[q] < 80])] = 0
        sg = stats(g)
        fi_ = len(frames)
        if fi_ in (0, 2):   # кадры шага: дальняя нога темнее (в 1-м она сзади, в 3-м впереди) — видно, что ноги меняются
            al_, _, _, jn = M(g); y0 = int(sg['hem'] + (sg['bot'] - sg['hem']) * 0.2); X = np.arange(g.shape[1])[None, :]; R = np.arange(g.shape[0])[:, None]
            dark = al_ & (R > y0) & ((X < sg['hip']) if fi_ == 0 else (X > sg['hip'])) & (jn | (g[..., :3].astype(int).sum(2) < 200))
            g[dark, :3] = (g[dark, :3].astype(float) * 0.78).astype(np.uint8)
        frames.append((g, sg))
        rep.append('лицо %+.0f%% живот %+.0f%% ноги %+.0f%% ноги:%+.0f' % (100 * (sg['face'] / st['face'] - 1) if st['face'] else 0, 100 * (sg['belly'] / st['belly'] - 1), 100 * (sg['legw'] / st['legw'] - 1) if st['legw'] else 0, alt(g)))
    print(key, 'k=%.3f' % k); [print('   ', r) for r in rep]
    if check: continue
    imgs, meta = [], []
    for g, sg in frames:
        al = g[..., 3] > 0; ys = np.where(al.any(1))[0]; xs = np.where(al.any(0))[0]; C = g[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1]
        ax = sg['hip'] - xs[0] + (f[4] - st['hip'])                      # опора — как у стойки относительно бёдер
        hx = np.where(C[:4, :, 3].any(0))[0]; imgs.append(Image.fromarray(C)); meta.append((ax, C.shape[0], (hx[0] + hx[-1]) / 2 if len(hx) else C.shape[1] / 2))
    Wt = sum(m.width + 2 for m in imgs); Ht = max(m.height for m in imgs); at = Image.new('RGBA', (Wt, Ht)); x = 0; fr = []
    for m, (ax, ay, hx) in zip(imgs, meta):
        at.paste(m, (x, 0)); fr.append([x, 0, m.width, m.height, round(float(ax), 1), float(ay), round(float(hx), 1), 0]); x += m.width + 2
    at.save(os.path.join(SPR, out + '.png'), optimize=True); D[out] = {'img': 'assets/spr/%s.png' % out, 'f': fr}
if not check: open(p, 'w', encoding='utf-8').write(s[:i] + json.dumps(D) + s[j:]); print('ok')
