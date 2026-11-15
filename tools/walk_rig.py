# Ходьба Валеры скелетной анимацией из ОДНОГО стоящего кадра: Валера не меняется (те же пиксели).
# Ноги (джинсы+обувь стоящего кадра) режутся на бедро и голень, качаются в тазобедренном суставе и гнутся в колене;
# тело (голова, куртка, руки, ракетка/ствол) опускается/поднимается в такт шагу (ступни всегда на земле).
# Пишет атласы ходьбы (8 кадров) в sprites_data.js. Запускать ПОСЛЕДНИМ (после build_assets / p4v_build / walk_l123).
import os, sys, json, math, numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from defringe import defringe
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SPR = os.path.join(ROOT, 'assets', 'spr')
SETS = {'l12': ('v_jump', 0, 'v_run'), 'l3': ('v4_act', 0, 'v4_run'), 'l4m': ('v19_mact', 0, 'v19_mrun'), 'l4s': ('v7_act', 0, 'v17_runs'),
        'l4f': ('v12_fist', 0, 'v12_run'), 'l4g': ('v10_gun', 0, 'v10_gunw'), 'l4gg': ('v11_gun', 0, 'v11_gunw')}
N = 8; HIP = 15.0; KNEE = 26.0; PAD = 40
p = os.path.join(ROOT, 'js', 'sprites_data.js'); s = open(p, encoding='utf-8').read(); i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); D = json.loads(s[i:j])

def masks(S):
    a = S.astype(int); al = S[..., 3] > 100
    orange = al & (a[..., 0] > 170) & (a[..., 0] - a[..., 1] > 60) & (a[..., 2] < 110)
    c = orange.sum(1); hem = int(np.where(c >= c.max() * 0.25)[0][-1])
    feet = int(np.where(al.any(1))[0][-1])
    jeans = al & (a[..., 2] > a[..., 0] + 12) & (a[..., 2] > 45) & (a[..., 2] - a[..., 1] > 12) & (a[..., 1] < 150) & (a[..., 0] < 130)
    rows = np.arange(S.shape[0])[:, None]
    shoes = al & (rows > feet - (feet - hem) * 0.25) & (a[..., :3].sum(2) < 220)
    leg = (jeans | shoes) & (rows > hem - 2)
    leg = ndimage.binary_dilation(leg, iterations=2) & al & (rows > hem - 2) & ~orange
    glow = al & (a[..., 1] > 150) & (a[..., 2] > 180) & (a[..., 0] < 170)
    if glow.sum() > 20: leg &= ~ndimage.binary_fill_holes(ndimage.binary_dilation(glow, iterations=3))
    lab, n = ndimage.label(leg)                                   # ноги — крупные куски, мелочь остаётся телу
    if n:
        sz = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1)); leg = np.isin(lab, [q + 1 for q in range(n) if sz[q] > 60])
    return leg, hem, feet

def split_legs(leg, hem, feet):
    L = feet - hem; band = leg[int(hem + L * 0.35):int(feet - L * 0.15)]; cnt = band.sum(0); xs = np.where(leg.any(0))[0]
    x0, x1 = xs[0], xs[-1]; lo, hi = int(x0 + (x1 - x0) * 0.3), int(x0 + (x1 - x0) * 0.7)
    cx = lo + int(np.argmin(cnt[lo:hi + 1])) if hi > lo else (x0 + x1) // 2
    X = np.arange(leg.shape[1])[None, :]
    return leg & (X < cx), leg & (X >= cx), cx

def rot(img, ang, cx, cy):   # поворот слоя вокруг точки (cx, cy); ang>0 — носок вперёд (вправо)
    if abs(ang) < 0.01: return img
    r = Image.fromarray(img).rotate(ang, resample=Image.BICUBIC, center=(cx, cy))
    a = np.array(r); a[..., 3] = np.where(a[..., 3] > 128, 255, 0); return a

def leg_pose(layer, hipx, hem, knee_y, hip_a, knee_a):
    thigh = layer.copy(); thigh[knee_y + 4:] = 0
    shin = layer.copy(); shin[:knee_y - 3] = 0
    kx = np.where(layer[knee_y, :, 3] > 0)[0]; kxc = (kx[0] + kx[-1]) / 2 if len(kx) else hipx
    shin = rot(shin, -knee_a, kxc, knee_y)                          # голень назад при сгибе колена
    out = shin.copy(); m = thigh[..., 3] > 0; out[m] = thigh[m]
    return rot(out, hip_a, hipx, hem)

S_ALL = {}
for key, (sheet, fi, outname) in SETS.items():
    d = D[sheet]; f = d['f'][fi]
    S0 = np.array(Image.open(os.path.join(ROOT, d['img'])).convert('RGBA').crop((f[0], f[1], f[0] + f[2], f[1] + f[3])))
    S = np.zeros((S0.shape[0] + PAD * 2, S0.shape[1] + PAD * 2, 4), np.uint8); S[PAD:PAD + S0.shape[0], PAD:PAD + S0.shape[1]] = S0
    leg, hem, feet = masks(S); A, B, cx = split_legs(leg, hem, feet)
    body = S.copy(); body[leg] = 0
    def layer(m): L_ = np.zeros_like(S); L_[m] = S[m]; return L_
    LA, LB = layer(A), layer(B)
    for L_ in (LA, LB):                                                # нога продолжается вверх под куртку (при повороте не открывается щель)
        al_ = L_[..., 3] > 0
        for x in np.where(al_.any(0))[0]:
            y0 = np.where(al_[:, x])[0][0]
            if y0 <= hem + 6: L_[max(0, hem - 14):y0, x] = L_[min(y0 + 2, L_.shape[0] - 1), x]
    LA[..., :3] = (LA[..., :3].astype(float) * 0.86).astype(np.uint8)   # дальняя нога чуть темнее — видно, какая впереди
    hxA = np.where(A[hem + 2:hem + 8].any(0))[0]; hxB = np.where(B[hem + 2:hem + 8].any(0))[0]
    hipA = (hxA[0] + hxA[-1]) / 2 if len(hxA) else cx - 8; hipB = (hxB[0] + hxB[-1]) / 2 if len(hxB) else cx + 8
    knee_y = int(hem + (feet - hem) * 0.5)
    frames = []
    for t in range(N):
        ph = 2 * math.pi * t / N
        aB = HIP * math.sin(ph); aA = -aB                          # ближняя (B) и дальняя (A) ноги в противофазе
        kB = KNEE * max(0.0, math.cos(ph)) ** 1.2; kA = KNEE * max(0.0, -math.cos(ph)) ** 1.2   # колено гнётся у ноги, что идёт вперёд
        PA = leg_pose(LA, hipA, hem, knee_y, aA, kA); PB = leg_pose(LB, hipB, hem, knee_y, aB, kB)
        low = max(np.where(PA[..., 3].any(1))[0][-1], np.where(PB[..., 3].any(1))[0][-1])
        dy = feet - low                                             # ступня на земле -> таз и тело поднимаются/опускаются
        C = np.zeros_like(S)
        def put(L_, sh):
            if sh > 0: L_ = np.vstack([np.zeros((sh, L_.shape[1], 4), np.uint8), L_[:-sh]])
            elif sh < 0: L_ = np.vstack([L_[-sh:], np.zeros((-sh, L_.shape[1], 4), np.uint8)])
            m = L_[..., 3] > 0; C[m] = L_[m]
        put(PA, dy); put(PB, dy); put(body, dy)
        lab, n = ndimage.label(C[..., 3] > 0)                       # крошки от поворота — убрать
        if n > 1:
            sz = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
            for q in range(n):
                if sz[q] < 80: C[lab == q + 1] = 0
        frames.append(defringe(C))
    imgs, meta = [], []
    ax = PAD + f[4]
    for C in frames:
        al = C[..., 3] > 0; ys = np.where(al.any(1))[0]; xs = np.where(al.any(0))[0]
        C2 = C[ys[0]:feet + 1, xs[0]:xs[-1] + 1]; imgs.append(Image.fromarray(C2))
        hx = np.where(C2[:4, :, 3].any(0))[0]; meta.append((ax - xs[0], C2.shape[0], (hx[0] + hx[-1]) / 2 if len(hx) else C2.shape[1] / 2, 0))
    Wt = sum(m.width + 2 for m in imgs); Ht = max(m.height for m in imgs); at = Image.new('RGBA', (Wt, Ht)); x = 0; fr = []
    for m, (axx, ay, hx, hy) in zip(imgs, meta):
        at.paste(m, (x, 0)); fr.append([x, 0, m.width, m.height, round(float(axx), 1), float(ay), round(float(hx), 1), hy]); x += m.width + 2
    at.save(os.path.join(SPR, outname + '.png'), optimize=True); D[outname] = {'img': 'assets/spr/%s.png' % outname, 'f': fr}
    print(key, '->', outname, 'кадров', len(fr), 'рост', [q[3] for q in fr], 'стойка', S0.shape[0])
open(p, 'w', encoding='utf-8').write(s[:i] + json.dumps(D) + s[j:]); print('ok')
