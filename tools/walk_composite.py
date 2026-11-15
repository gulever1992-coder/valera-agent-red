# Ходьба Валеры без «перерисовки»: верх тела (голова, куртка, живот, руки, ракетка/ствол) — пиксели стоящего кадра,
# ноги — из листа Flow (art_src/walkc/gen_<set>.jpg, 4 позы). Пишет атласы ходьбы в sprites_data.js.
# Запускать ПОСЛЕДНИМ (после build_assets.py / p4v_build.py / walk_l123.py — они пишут старые атласы).
import os, sys, json, glob, subprocess, numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from defringe import defringe
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SPR = os.path.join(ROOT, 'assets', 'spr'); W0 = os.path.join(ROOT, 'art_src', 'walkc')
SETS = {'l12': ('v_jump', 0, 'v_run'), 'l3': ('v4_act', 0, 'v4_run'), 'l4m': ('v19_mact', 6, 'v19_mrun'), 'l4s': ('v7_act', 0, 'v17_runs'),
        'l4f': ('v12_fist', 0, 'v12_run'), 'l4g': ('v10_gun', 0, 'v10_gunw'), 'l4gg': ('v11_gun', 0, 'v11_gunw')}
p = os.path.join(ROOT, 'js', 'sprites_data.js'); s = open(p, encoding='utf-8').read(); i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); D = json.loads(s[i:j])

def orange(a): a = a.astype(int); return (a[..., 3] > 100) & (a[..., 0] > 170) & (a[..., 0] - a[..., 1] > 60) & (a[..., 2] < 110)
def hem(a):   # низ куртки: последняя строка, где оранжевого >= 25% от максимума
    c = orange(a).sum(1); return int(np.where(c >= c.max() * 0.25)[0][-1])
def top(a): return int(np.where((a[..., 3] > 100).any(1))[0][0])
def jeans(a):   # джинсы: синий без голубого свечения ракетки (у свечения зелёный канал высокий)
    a = a.astype(int); return (a[..., 3] > 100) & (a[..., 2] > a[..., 0] + 12) & (a[..., 2] > 45) & (a[..., 2] - a[..., 1] > 12) & (a[..., 1] < 150) & (a[..., 0] < 130)

def feet(a): return int(np.where((a[..., 3] > 100).any(1))[0][-1])
def hipx(a, h):   # центр джинсов сразу под курткой
    m = jeans(a)[h + 2:h + 10]; xs = np.where(m.any(0))[0]; return (xs[0] + xs[-1]) / 2 if len(xs) else a.shape[1] / 2

def compose(S, Sf, G, k):
    hS, fS = hem(S), feet(S)
    G = Image.fromarray(G).resize((max(1, round(G.shape[1] * k)), max(1, round(G.shape[0] * k))), Image.LANCZOS); G = np.array(G)
    G[..., 3] = np.where(G[..., 3] > 100, 255, 0); hG = hem(G)
    dy = hS - hG; dx = int(round(hipx(S, hS) - hipx(G, hG)))
    X0, Y0 = min(0, dx), min(0, dy); X1, Y1 = max(S.shape[1], dx + G.shape[1]), max(S.shape[0], dy + G.shape[0])
    C = np.zeros((Y1 - Y0, X1 - X0, 4), np.uint8); sx, sy, gx, gy = -X0, -Y0, dx - X0, dy - Y0
    cut = hS - 3                                                          # ноги из Flow — ниже края куртки
    Gl = G.copy(); Gl[:max(0, cut - dy)] = 0
    mg = np.sqrt((Gl[..., 0].astype(int) - 255) ** 2 + Gl[..., 1].astype(int) ** 2 + (Gl[..., 2].astype(int) - 255) ** 2) < 110; Gl[mg] = 0   # остатки маджента-фона между ногами
    # цвет джинсов из Flow -> как у стоящего кадра (перенос среднего и разброса по каналам)
    jS = jeans(S); jS[:hS + 2] = False
    g_ = Gl.astype(int); jG = (Gl[..., 3] > 100) & (g_[..., 2] > g_[..., 0] + 12) & (g_[..., 2] >= g_[..., 1]) & (g_[..., 2] > 45)   # джинсы из Flow — любой синий, даже ярко-голубой
    if jS.sum() > 30 and jG.sum() > 30:
        src = Gl[..., :3][jG].astype(float); ref = S[..., :3][jS].astype(float)
        out = (src - src.mean(0)) / (src.std(0) + 1e-3) * ref.std(0) + ref.mean(0)
        Gl[..., :3][jG] = np.clip(out, 0, 255).astype(np.uint8)
    C[gy:gy + G.shape[0], gx:gx + G.shape[1]] = Gl
    keep = S[..., 3] > 100; rows = np.arange(S.shape[0])[:, None]
    fS = np.where(keep.any(1))[0][-1]
    legS = jeans(S) | ((rows > fS - (fS - hS) * 0.22) & (S[..., :3].astype(int).sum(2) < 200))   # джинсы + обувь стоящего кадра
    from scipy import ndimage
    legS = ndimage.binary_dilation(legS, iterations=2)                        # вместе с тёмным контуром ног
    Si = S.astype(int); glow = (S[..., 3] > 100) & (Si[..., 1] > 150) & (Si[..., 2] > 180) & (Si[..., 0] < 170)   # голубое свечение ракетки
    if glow.sum() > 20:                                                     # ракетка со свечением — целиком (сетка внутри свечения)
        rk = ndimage.binary_fill_holes(ndimage.binary_dilation(glow, iterations=3)); legS &= ~rk
    keep &= (rows <= hS + 1) | ~legS                                       # ниже куртки оставляем только руки/ракетку/ствол
    lab, n = ndimage.label(keep & (rows > hS + 1))                          # мелкие обрывки контура ног стоящего кадра — убрать
    if n:
        sz = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
        for q in range(n):
            if sz[q] < 40: keep[lab == q + 1] = False
    reg = C[sy:sy + S.shape[0], sx:sx + S.shape[1]]; reg[keep] = S[keep]
    lab, n = ndimage.label(C[..., 3] > 0)                                   # оторванные крошки (обрывки старых ботинок)
    if n > 1:
        sz = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
        for q in range(n):
            if sz[q] < 150: C[lab == q + 1] = 0
    return defringe(C), sx + Sf[4]

S_OUT = {}
for key, (sheet, fi, out) in SETS.items():
    src = os.path.join(W0, 'gen_%s.jpg' % key)
    if not os.path.exists(src): print('нет', src); continue
    d = D[sheet]; f = d['f'][fi]; S = np.array(Image.open(os.path.join(ROOT, d['img'])).convert('RGBA').crop((f[0], f[1], f[0] + f[2], f[1] + f[3])))
    fr_dir = os.path.join(W0, 'frames'); os.makedirs(fr_dir, exist_ok=True)
    for x in glob.glob(os.path.join(fr_dir, key + '_*.png')): os.remove(x)
    subprocess.run([sys.executable, os.path.join(ROOT, 'tools/p4v_grid.py'), src, key, '1', '4', fr_dir], check=True, env=dict(os.environ, FLOOD='1'), stdout=subprocess.DEVNULL)
    Gs = [np.array(Image.open(gp).convert('RGBA')) for gp in sorted(glob.glob(os.path.join(fr_dir, key + '_[0-9][0-9].png')))]
    for g in Gs: g[..., 3] = np.where(g[..., 3] > 100, 255, 0)
    k = (feet(S) - hem(S)) / max(feet(g) - hem(g) for g in Gs)          # самая длинная нога в листе = нога стоящего кадра
    frames = [compose(S, f, g, k) for g in Gs]
    imgs, meta = [], []
    for C, ax in frames:
        al = C[..., 3] > 0; ys = np.where(al.any(1))[0]; xs = np.where(al.any(0))[0]
        C2 = C[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1]; imgs.append(Image.fromarray(C2))
        hx = np.where(C2[:4, :, 3].any(0))[0]; meta.append((ax - xs[0], C2.shape[0], (hx[0] + hx[-1]) / 2))
    Wt = sum(m.width + 2 for m in imgs); Ht = max(m.height for m in imgs); at = Image.new('RGBA', (Wt, Ht)); x = 0; fr = []
    for m, (ax, ay, hx) in zip(imgs, meta):
        at.paste(m, (x, 0)); fr.append([x, 0, m.width, m.height, round(float(ax), 1), float(ay), round(float(hx), 1), 0]); x += m.width + 2
    at.save(os.path.join(SPR, out + '.png'), optimize=True); D[out] = {'img': 'assets/spr/%s.png' % out, 'f': fr}; print(key, '->', out, [f_[3] for f_ in fr], 'стойка', S.shape[0])
open(p, 'w', encoding='utf-8').write(s[:i] + json.dumps(D) + s[j:]); print('ok')
