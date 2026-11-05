# Сборка ассетов уровня 8 (тир): art_src/l8/*.jpg (Flow) -> assets/l8/*.png|jpg + js/l8_data.js
# Запуск: py tools/build_l8.py [--debug]   (потом py tools/optimize_assets.py)
import os, sys, json
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC = os.path.join(ROOT, 'art_src', 'l8')
OUT = os.path.join(ROOT, 'assets', 'l8')
DBG = '--debug' in sys.argv
os.makedirs(OUT, exist_ok=True)


def load(name):
    return np.asarray(Image.open(os.path.join(SRC, name)).convert('RGB')).astype(np.int32)


def key(a, bg, fx=False):
    """Маска фона: пурпур ('m') или зелёный ('g'); чёрные линии сетки тоже фон."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if bg == 'g':
        m = (g > 90) & (g > r * 1.35) & (g > b * 1.35)
    else:
        m = (r > 90) & (b > 90) & (g < np.minimum(r, b) * 0.5)
        if fx:   # свечение, смешанное с пурпуром
            m |= (b > r * 0.62) & (g < b * 0.62) & (b > 70)
    dark = (r < 40) & (g < 40) & (b < 40)
    rows = dark.mean(1) > 0.85
    cols = dark.mean(0) > 0.85
    m = m.copy(); m[rows, :] = True; m[:, cols] = True
    for i in np.where(rows)[0]:
        m[max(0, i - 2):i + 3, :] |= dark[max(0, i - 2):i + 3, :]
    for i in np.where(cols)[0]:
        m[:, max(0, i - 2):i + 3] |= dark[:, max(0, i - 2):i + 3]
    m[:5, :] = True; m[-5:, :] = True; m[:, :5] = True; m[:, -5:] = True
    fr, fc = (~m).mean(1), (~m).mean(0)     # сплошные ТОНКИЕ линии-разделители любого цвета (соседние строки/столбцы — не сплошные)
    for i in range(8, m.shape[0] - 8):
        if fr[i] > 0.9 and min(fr[i - 7], fr[i + 7]) < 0.7: m[i, :] = True
    for i in range(8, m.shape[1] - 8):
        if fc[i] > 0.9 and min(fc[i - 7], fc[i + 7]) < 0.7: m[:, i] = True
    return m


def defringe(rgba, bg):
    """Срезать кайму цвета фона у края силуэта (2 прохода)."""
    a = rgba
    for _ in range(2):
        al = a[..., 3] > 0
        nb = np.zeros_like(al)
        nb[1:, :] |= ~al[:-1, :]; nb[:-1, :] |= ~al[1:, :]; nb[:, 1:] |= ~al[:, :-1]; nb[:, :-1] |= ~al[:, 1:]
        r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
        if bg == 'g': bad = (g > r * 1.15) & (g > b * 1.15) & (g > 70)
        else: bad = (r > g * 1.4) & (b > g * 1.4) & (r > 70) & (b > 70)
        a[al & nb & bad, 3] = 0
    return a


def runs(mask1d, min_gap, min_len):
    """Отрезки True с объединением через короткие разрывы."""
    out, s, gap = [], None, 0
    for i, v in enumerate(mask1d):
        if v:
            if s is None: s = i
            e = i; gap = 0
        elif s is not None:
            gap += 1
            if gap > min_gap: out.append((s, e + 1)); s = None
    if s is not None: out.append((s, e + 1))
    return [r for r in out if r[1] - r[0] >= min_len]


def valleys(proj, n):
    """Разбить проекцию на n отрезков: по n-1 самым широким пустым промежуткам; слипшиеся — по минимумам."""
    L = len(proj)
    nz = np.where(proj > 2)[0]; c0, c1 = int(nz.min()), int(nz.max())
    gaps, s0 = [], None
    for i in range(c0, c1 + 1):
        if proj[i] <= 2:
            if s0 is None: s0 = i
        elif s0 is not None: gaps.append((i - s0, (s0 + i) // 2)); s0 = None
    cuts = [c for _, c in sorted(gaps, reverse=True)[:n - 1]]
    if len(cuts) < n - 1:
        sm = np.convolve(proj.astype(float), np.ones(9) / 9, mode='same'); d = int((c1 - c0) / (n * 2.2))
        sm[:c0 + d] = 1e9; sm[c1 - d:] = 1e9
        for c in cuts: sm[max(0, c - d):c + d] = 1e9
        while len(cuts) < n - 1:
            i = int(np.argmin(sm)); cuts.append(i); sm[max(0, i - d):i + d] = 1e9
    cuts = [0] + sorted(cuts) + [L]
    return [(cuts[i], cuts[i + 1]) for i in range(n)]


def cut(name, bg, rows, cols, mode='gap', fx=False, clean=False):
    a = load(name); H, W = a.shape[:2]
    m = key(a, bg, fx)
    rgba = np.dstack([a, np.where(m, 0, 255)]).astype(np.uint8)
    rgba = defringe(rgba, bg)
    solid = rgba[..., 3] > 0
    frames = []
    if mode == 'grid':
        for j in range(rows):
            for i in range(cols):
                x0, x1, y0, y1 = W * i // cols, W * (i + 1) // cols, H * j // rows, H * (j + 1) // rows
                frames.append((x0 + 3, y0 + 3, x1 - 3, y1 - 3))
    else:
        for (y0, y1) in valleys(solid.sum(1), rows):
            for (x0, x1) in valleys(solid[y0:y1].sum(0), cols):
                frames.append((x0, y0, x1, y1))
    res = []
    for (x0, y0, x1, y1) in frames:
        sub = rgba[y0:y1, x0:x1]; s = sub[..., 3] > 0
        if not s.any(): res.append(None); continue
        if clean:
            from scipy import ndimage
            lab, n = ndimage.label(s)
            if n > 1 and clean == 'edge':   # куски соседнего кадра, залезшие через границу ячейки
                edge = set(lab[0]) | set(lab[-1]) | set(lab[:, 0]) | set(lab[:, -1]); sz = ndimage.sum(s, lab, range(1, n + 1)); keep = [i for i in range(1, n + 1) if (i not in edge and sz[i - 1] > sz.max() * 0.004) or sz[i - 1] >= sz.max()]
                s = np.isin(lab, keep); sub = sub.copy(); sub[~s, 3] = 0
            elif n > 1:
                sz = ndimage.sum(s, lab, range(1, n + 1)); keep = [i + 1 for i, v in enumerate(sz) if v >= sz.max() * (0.999 if clean == 'one' else 0.04)]
                s = np.isin(lab, keep); sub = sub.copy(); sub[~s, 3] = 0
        ys, xs = np.where(s)
        res.append(Image.fromarray(sub[ys.min():ys.max() + 1, xs.min():xs.max() + 1]))
    return res


def anchor_x(im):
    """Центр опоры: середина нижней четверти силуэта."""
    a = np.asarray(im)[..., 3] > 0
    h = a.shape[0]; xs = np.where(a[int(h * 0.78):].any(0))[0]
    return int((xs.min() + xs.max()) / 2) if len(xs) else im.width // 2


DATA = {}


def heal(im, wmax=3, share=0.3):
    """Зашить тонкие прозрачные швы (до wmax px) поперёк фигуры: их оставляет чистка линий сетки в key()."""
    a = np.asarray(im).copy(); H, W = a.shape[:2]
    for axis in (0, 1):                          # 0 — вертикальные швы (столбцы), 1 — горизонтальные (ряды)
        b = a if axis == 0 else a.transpose(1, 0, 2).copy()
        op = b[..., 3] > 100; n = b.shape[1]; rows = op.any(1).sum()
        if rows < 20: continue
        for x in range(1, n - 1):
            gap = ~op[:, x] & op[:, x - 1]
            if gap.sum() < share * rows: continue
            for w in range(1, wmax + 1):         # ширина шва: справа через w пикселей снова непрозрачно
                if x + w >= n: break
                m = gap & op[:, x + w] & ~op[:, x:x + w].any(1)
                if m.sum() >= share * rows:
                    for k in range(w): b[m, x + k] = b[m, x - 1]
                    op = b[..., 3] > 100; break
        a = b if axis == 0 else b.transpose(1, 0, 2).copy()
    return Image.fromarray(a)

def find_eyes(fr):
    """Глаза зомби в кадре: пара самых ярких пятен (зелёное свечение, иначе жёлтые) в верхней трети, на одной высоте."""
    a=np.asarray(fr).astype(int); h,w=a.shape[:2]; r,g,b,al=a[...,0],a[...,1],a[...,2],a[...,3]
    for m in ((al>100)&(g>175)&(g-r>=14)&(g>=b), (al>100)&(r>165)&(g>165)&(b<g-35)):
        m=m.copy(); m[int(h*0.33):]=False
        from scipy import ndimage
        lab,n=ndimage.label(m); cs=[]
        for i in range(1,n+1):
            k=lab==i; sz=k.sum()
            if sz<2: continue
            cs.append((g[k].mean()+(r[k].mean()+b[k].mean())*0.3+6*np.log(sz), sz, ndimage.center_of_mass(k)))
        best=None
        for x in range(len(cs)):
            for y in range(x+1,len(cs)):
                (q1,s1,c1),(q2,s2,c2)=cs[x],cs[y]
                if abs(c1[0]-c2[0])<0.05*h and 0.035*h<abs(c1[1]-c2[1])<0.16*h and max(s1,s2)<5*min(s1,s2):
                    if not best or q1+q2>best[0]: best=(q1+q2,[c1,c2])
        if best: return [[round(c[1],1),round(c[0],1)] for c in best[1]]
    return None

def pack(sheet, frames, scale, anchor='feet', names=None):
    """Собрать кадры в один ряд; scale — множитель к исходнику; anchor: feet | mid."""
    fr = []
    for im in frames:
        if im is None: fr.append(None); continue
        im = heal(im.convert('RGBA'))
        w, h = max(1, round(im.width * scale)), max(1, round(im.height * scale))
        fr.append(im.resize((w, h), Image.LANCZOS))
    Wd = sum(f.width + 2 for f in fr if f) + 2; Hd = max(f.height for f in fr if f) + 2
    sh = Image.new('RGBA', (Wd, Hd), (0, 0, 0, 0)); x = 1; meta = []; eyes_ = []
    for f in fr:
        if f is None: meta.append(None); continue
        arr = np.asarray(f).copy(); arr[arr[..., 3] < 110, 3] = 0; arr[arr[..., 3] >= 110, 3] = 255
        f = Image.fromarray(arr); sh.paste(f, (x, 1))
        ax = anchor_x(f) if anchor == 'feet' else f.width // 2
        ay = f.height if anchor == 'feet' else f.height // 2
        meta.append([x, 1, f.width, f.height, ax, ay]); x += f.width + 2
        if sheet.startswith('zomb') and sheet != 'zombE1': eyes_.append(find_eyes(f))   # у рабочего глаза тёмные — без свечения
    sh.save(os.path.join(OUT, sheet + '.png'))
    DATA[sheet] = {'f': meta}
    if eyes_: DATA[sheet]['e'] = eyes_
    if names: DATA[sheet]['n'] = names
    print('%-8s %4dx%-4d кадров %d, высоты %s' % (sheet, Wd, Hd, len(fr), [f.height if f else 0 for f in fr]))


def hgt(frames, i): return frames[i].height


# ---------- персонажи ----------
VAL_H = 250   # px холста (125 логических)
va = cut('l8valA_1.jpg', 'g', 2, 3, clean=True)
vb = cut('l8valB_1.jpg', 'g', 2, 3, clean=True)
k = VAL_H / hgt(va, 0)
pack('val8', va[:4] + vb, k, names=['aimC', 'aimL', 'aimR', 'fire', 'stepL', 'stepR', 'roll', 'butt', 'hurt', 'reload'])

ZH = 224
for sheet, src in (('zombA', 'l8zomb_0.jpg'), ('zombB', 'l8zomb2_1.jpg')):
    z = cut(src, 'm', 2, 5, clean=True)
    for row, nm in ((0, sheet + '0'), (1, sheet + '1')):
        fr = z[row * 5:row * 5 + 5]
        pack(nm, fr, ZH / hgt(fr, 0))

c = cut('l8cmd_0.jpg', 'm', 2, 5, clean=True)
CH = 236
pack('cmdR8', c[:5], CH / hgt(c, 1))      # стрелок: присел, целится, огонь, попадание, лежит
pack('cmdG8', c[5:], CH / hgt(c, 5))      # гранатомётчик: стоит, замах, бросок, попадание, лежит

# новые зомби с 4-кадровой ходьбой (ходьба 0-3, бросок 4, попадание 5, лежит 6)
z3 = cut('l8zomb3_1.jpg', 'm', 2, 7, clean=True)
pack('zombC0', z3[:7], ZH / hgt(z3, 0)); pack('zombC1', z3[7:14], ZH / hgt(z3, 7))
z4 = cut('l8zomb4_1.jpg', 'm', 3, 7, clean=True)
pack('zombD0', z4[:7], ZH / hgt(z4, 0))
# спецназ: бег сбоку (0-5), перебежка на камеру (0-3), с колена: прицел 4, огонь 5
cr = cut('l8cmdrun_0.jpg', 'm', 2, 6, clean=True)
pack('cmdRun8', cr[:6], CH / hgt(cr, 0) * 0.97); pack('cmdAdv8', cr[6:], CH / hgt(cr, 6))
# Валера: приставной шаг влево (вправо — зеркало)
vc = cut('l8valC_1.jpg', 'g', 2, 4, clean=True)
pack('valS8', vc[:4], VAL_H / hgt(vc, 3) * 0.99)
# передний план зала (параллакс)
fg = cut('l8fgHall_1.jpg', 'm', 2, 4, mode='grid', clean='edge', fx=True)
Image.open(os.path.join(SRC, 'l8fgHall_1.jpg')).crop((0, 40, 688, 384)).save(os.path.join(SRC, '_fgseats.jpg'), quality=95)
fg[0] = cut('_fgseats.jpg', 'm', 1, 1, clean='edge')[0]; fg[0] = fg[0].crop((0, 0, fg[0].width - 22, fg[0].height))      # ряд кресел целиком (сетка резала третье кресло пополам)
pack('fgHall8', fg, 1.0, names=['seats', 'rope', 'chair', 'candle', 'column', 'ctable', 'palm', 'tvcam'])

# ---------- эффекты ----------
fa = cut('l8fxA_0.jpg', 'm', 3, 6, mode='grid', fx=True)
pack('fx8', fa, 0.55, anchor='mid', names=['cross', 'cross2', 'flash', 'flash2', 'tracer', 'shell', 'puff', 'puff2', 'slime', 'ebul', 'ebul2', 'warn',
                                           'gren', 'gren2', 'mag', 'vog', 'kefir', 'vest'])
fb = cut('l8fxB_0.jpg', 'm', 2, 3, mode='grid', fx=True)
pack('boom8', fb[:5], 0.9, anchor='mid')
pr = cut('l8props_0.jpg', 'm', 2, 4, mode='grid', clean='edge')
_sh = np.asarray(pr[7]).copy(); _sh[..., :3] = (6, 8, 12); pr[7] = Image.fromarray(_sh)   # тень: тёмная, а не синяя
pack('props8', pr, 0.8, names=['chand', 'chandFall', 'chandDead', 'vase', 'table', 'tableDead', 'vaseDead', 'shadow'])

# ---------- панорамы локаций ----------
# Один кадр Flow = [левый край | повторяемая середина | правый край с выходом]. Панорама без швов:
# кадр до x2, затем зеркало середины (x2 -> x1), затем кадр от x1 до конца. Стена сжата под линию пола, пол растянут.
VH, FLOOR_Y = 720, 456          # высота кадра и линия «стена — пол» на холсте
DATA['_bg'] = {}
def bg_piece(name, floor_k):
    im = Image.open(os.path.join(SRC, name)).convert('RGB')
    fy = int(im.height * floor_k)
    s = FLOOR_Y / fy
    wall = im.crop((0, 0, im.width, fy)).resize((round(im.width * s), FLOOR_Y), Image.LANCZOS)
    floor = im.crop((0, fy, im.width, im.height)).resize((wall.width, VH - FLOOR_Y), Image.LANCZOS)
    o = Image.new('RGB', (wall.width, VH)); o.paste(wall, (0, 0)); o.paste(floor, (0, FLOOR_Y))
    return o
def pano(out, name, floor_k, k1, k2, nolatin=False, reps=1):
    a = np.asarray(bg_piece(name, floor_k)).copy(); W = a.shape[1]
    if nolatin:   # зелёное табло над дверью: латинские буквы -> ровное свечение
        gr = (a[..., 1] > 150) & (a[..., 0] < 130) & (a[..., 2] < 170); gr[:, :W // 2] = False
        ys, xs = np.where(gr)
        if len(ys):
            y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            a[y0:y1, x0:x1] = np.median(a[y0:y1, x0:x1][gr[y0:y1, x0:x1]], axis=0).astype(np.uint8)
    x1, x2 = int(W * k1), int(W * k2); mid = a[:, x1:x2]
    parts = [a[:, :x2]]
    for _ in range(reps): parts += [mid[:, ::-1], mid]
    parts[-1] = a[:, x1:]
    p = np.concatenate(parts, axis=1)
    Image.fromarray(p).save(os.path.join(OUT, out + '.jpg'), quality=92)
    DATA['_bg'][out] = {'w': p.shape[1], 'h': VH, 'floorY': FLOOR_Y, 'x1': x1, 'x2': x2, 'src': W}
    print(out + '.jpg', p.shape[1], 'x', VH, 'x1', x1, 'x2', x2)

pano('hall', 'l8hallB_1.jpg', 0.685, 0.310, 0.765, nolatin=True)

# ================= партия 2: закулисье, кран, техпомещение, темнота =================
def one(name, bg, scale, out, fx=False):
    """Один большой спрайт на весь кадр."""
    a = load(name); m = key(a, bg, fx)
    rgba = defringe(np.dstack([a, np.where(m, 0, 255)]).astype(np.uint8), bg)
    ys, xs = np.where(rgba[..., 3] > 0)
    im = Image.fromarray(rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1])
    pack(out, [im], scale)

def glow(name, rows, cols, out, scale, names):
    """Свет на чёрном фоне: яркость -> прозрачность."""
    a = load(name).astype(float); H, W = a.shape[:2]; fr = []
    for j in range(rows):
        for i in range(cols):
            c = a[H * j // rows + 8:H * (j + 1) // rows - 8, W * i // cols + 8:W * (i + 1) // cols - 8]
            al = c.max(2); al = np.clip((al - 14) * 1.12, 0, 255)
            hh, ww = al.shape; yy, xx = np.mgrid[0:hh, 0:ww]; edge = np.minimum(np.minimum(xx, ww - 1 - xx) / (ww * 0.14), np.minimum(yy, hh - 1 - yy) / (hh * 0.14)); al = al * np.clip(edge, 0, 1)   # к краям ячейки свет гаснет
            rgb = np.clip(c * 255.0 / np.maximum(c.max(2, keepdims=True), 1), 0, 255)
            im = Image.fromarray(np.dstack([rgb, al]).astype(np.uint8))
            fr.append(im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS))
    Wd = sum(f.width + 2 for f in fr) + 2; Hd = max(f.height for f in fr) + 2
    sh = Image.new('RGBA', (Wd, Hd), (0, 0, 0, 0)); x = 1; meta = []
    for f in fr: sh.paste(f, (x, 1)); meta.append([x, 1, f.width, f.height, f.width // 2, f.height // 2]); x += f.width + 2
    sh.save(os.path.join(OUT, out + '.png')); DATA[out] = {'f': meta, 'n': names}
    print('%-8s %dx%d (свет)' % (out, Wd, Hd))

pano('back', 'l8bgBack_1.jpg', 0.725, 0.300, 0.730)
pano('dock', 'l8bgDock_1.jpg', 0.665, 0.270, 0.720, reps=2)
pano('tech', 'l8bgTech_1.jpg', 0.690, 0.385, 0.700, reps=2)

pb = cut('l8prBack_1.jpg', 'm', 2, 4)
pack('prBack8', pb, 0.8, names=['sandbag', 'sandbagDead', 'lights', 'lightsDead', 'case', 'caseDead', 'flat', 'flatDead'])
pt = cut('l8prTech_1.jpg', 'm', 2, 4)
pack('prTech8', pt, 0.8, names=['crate', 'crateDead', 'powder', 'powderDead', 'vodka', 'vodkaDead', 'capsule', 'capsuleDead'])
fb2 = cut('l8fgBack_0.jpg', 'm', 2, 4, fx=True)
pack('fgBack8', fb2, 1.0, names=['cases', 'spot', 'drum', 'ladder', 'rack', 'throne', 'bags', 'manneq'])
ft = cut('l8fgTech_1.jpg', 'm', 2, 4, mode='grid', clean='edge', fx=True)
pack('fgTech8', ft, 1.0, names=['barrels', 'forklift', 'pipe', 'lamp', 'pallet', 'console', 'gas', 'cables'])
shd = cut('l8shield_0.jpg', 'm', 2, 4, clean=True)
pack('shield8', shd, CH * 1.12 / hgt(shd, 0))          # 0-3 идёт за щитом, 4 открылся, 5 огонь, 6 оглушён, 7 лежит
z5 = cut('l8zomb5_1.jpg', 'm', 3, 7, clean=True); pack('zombE0', z5[:7], ZH / hgt(z5, 0))
z6 = cut('l8zomb6_1.jpg', 'm', 3, 7, clean=True); pack('zombE1', z6[:7], ZH / hgt(z6, 0))
one('l8craneA_0.jpg', 'm', 0.92, 'craneA8'); one('l8craneA2_0.jpg', 'm', 0.92, 'craneN8')
one('l8cradle_0.jpg', 'm', 0.95, 'craneB8')    # люлька целиком, с низом и стрелой
glow('l8fxC_1.jpg', 2, 4, 'fxC8', 0.75, ['pool', 'cone', 'redlamp', 'flare', 'eyes', 'laser', 'spark', 'dot'])
fd = cut('l8fxD_0.jpg', 'm', 2, 4, mode='grid', fx=True)
pack('fxD8', fd, 0.8, anchor='mid', names=['fire0', 'fire1', 'fire2', 'puddle', 'foam', 'foam2', 'glass', 'steam'])

# ================= партия 3: боссы, арена, лаборатория, финал =================
def single(out, name, floor_k=None):
    """Фон одного экрана: 1280x720 (при floor_k — линия пола приводится к FLOOR_Y)."""
    if floor_k: im = bg_piece(name, floor_k); x0 = (im.width - 1280) // 2; im = im.crop((x0, 0, x0 + 1280, VH)) if im.width >= 1280 else im.resize((1280, VH), Image.LANCZOS)
    else: im = Image.open(os.path.join(SRC, name)).convert('RGB').resize((1280, 717), Image.LANCZOS); b = Image.new('RGB', (1280, 720)); b.paste(im, (0, 0)); b.paste(im.crop((0, 714, 1280, 717)), (0, 717)); im = b
    im.save(os.path.join(OUT, out + '.jpg'), quality=92); DATA['_bg'][out] = {'w': 1280, 'h': VH, 'floorY': FLOOR_Y}
    print(out + '.jpg', im.size)

def panels(name, rows, cols, out, inset=5):
    """Кадры катсцены из сетки: каждый -> отдельный jpg 1280x720."""
    im = Image.open(os.path.join(SRC, name)).convert('RGB'); W, H = im.size; k = 0
    for j in range(rows):
        for i in range(cols):
            c = im.crop((W * i // cols + inset, H * j // rows + inset, W * (i + 1) // cols - inset, H * (j + 1) // rows - inset))
            tw, th = c.size; r = 16 / 9
            if tw / th > r: nw = int(th * r); c = c.crop(((tw - nw) // 2, 0, (tw - nw) // 2 + nw, th))
            else: nh = int(tw / r); c = c.crop((0, (th - nh) // 2, tw, (th - nh) // 2 + nh))
            c.resize((1280, 720), Image.LANCZOS).save(os.path.join(OUT, '%s%d.jpg' % (out, k)), quality=90); DATA['_bg']['%s%d' % (out, k)] = {'w': 1280, 'h': 720}; k += 1
    print(out, k, 'кадров')

single('bossbg', 'l8bgBoss_1.jpg', 0.62)
single('labbg', 'l8bgLab_0.jpg')
panels('l8fxF_1.jpg', 2, 2, 'fall'); panels('l8cutMon_1.jpg', 2, 2, 'mon'); panels('l8cutTun_0.jpg', 2, 2, 'tun'); panels('l8cutCap_0.jpg', 1, 2, 'cap')

MEGA_B, MEGA_C = 0, 1     # выбранные варианты листов мегаробота
RK = 1.55      # боссы крупнее исходника (гиганты)
ro = cut('l8roo_0.jpg', 'm', 2, 4, clean=True)
pack('roo8', ro, RK, names=['flyA', 'flyB', 'missile', 'gust', 'peck', 'standA', 'standB', 'dmg'])
sp = cut('l8spi_0.jpg', 'm', 2, 4, mode='grid', clean='edge')
pack('spi8', sp, RK, anchor='mid', names=['wallA', 'wallB', 'laser', 'jump', 'floorA', 'floorB', 'hatch', 'dmg'])
vn = cut('l8van_0.jpg', 'm', 2, 3, mode='grid', clean='edge', fx=True)
pack('van8', vn[:3], 1.5, names=['vanA', 'vanB', 'wreck'])
def nobeam(im):
    """Убрать стальную балку из-под Максима. Ноги нарисованы перед балкой: в её полосе оставляем родные джинсы
    (столбцы голеней), сталь по бокам стираем; пустые ряды над/под балкой (их съела чистка линий сетки) закрываем соседним рядом."""
    a = np.asarray(im).copy(); op = a[..., 3] > 100; H = op.shape[0]
    rows = np.where(op.mean(1) > 0.8)[0]                 # балка — единственное, что идёт во всю ширину
    if not len(rows): return im
    r0, r1 = rows.min(), rows.max()
    gs = r0
    while gs > 1 and not op[gs - 1].any(): gs -= 1     # пустые ряды над балкой
    b = r1 + 1
    while b < H - 1 and not op[b].any(): b += 1        # первый ряд голеней под балкой
    legs = op[b:b + 4].all(0)
    legs = np.convolve(legs.astype(int), np.ones(3, int), 'same') == 3   # без крайних пикселей — там кромка стали
    a[r0:r1 + 1, ~legs, 3] = 0
    up = a[gs - 1].copy()
    for y in range(gs, r0): a[y] = up
    for y in range(r1 + 1, b): a[y] = 0; a[y, legs] = a[b, legs]
    return Image.fromarray(a)
mx = cut('l8max2_0.jpg', 'm', 2, 4, mode='grid', clean='one')   # только сам Максим, без мешка       # Максим в бронежилете, 8 кадров
def sack_of(name):
    """Мешок картошки рядом с Максимом: заходит за границу ячейки, поэтому вырезается отдельным кропом."""
    Image.open(os.path.join(SRC, name)).crop((266, 192, 364, 282)).save(os.path.join(SRC, '_sack.jpg'), quality=95)
    return cut('_sack.jpg', 'm', 1, 1, clean=True)[0]
pack('max8', mx + [sack_of('l8max2_0.jpg')], 212 / hgt(mx, 0), names=['sit', 'sit2', 'reach', 'wind', 'throw', 'laugh', 'taunt', 'hit', 'sack'])
fe = cut('l8fxE_1.jpg', 'm', 3, 6, mode='grid', fx=True)
pack('fxE8', fe, 0.6, anchor='mid', names=['feather', 'feather2', 'egg', 'egg2', 'potatoF', 'potato', 'mini', 'mini2', 'leap', 'miniDead', 'eggBoom', 'scrap', 'beam', 'burst', 'gust', 'ring', 'shield', 'bolt'])
bt = cut('l8batt_0.jpg', 'm', 2, 3, clean=True)
pack('batt8', bt, 0.62, anchor='mid', names=['on', 'dmg', 'dead', 'sideOn', 'sideDmg', 'sideDead'])

mg = cut('l8megaA_0.jpg', 'm', 1, 2, clean=True) + cut('l8megaB_%d.jpg' % MEGA_B, 'm', 1, 2, clean=True) + cut('l8megaC_%d.jpg' % MEGA_C, 'm', 1, 2, clean=True)
pack('mega8', mg, 1.0, names=['idle', 'roar', 'laser', 'punch', 'dmg', 'explode'])

# ================= партия 4: обрушение арены, лаборатория, пролом стены, люлька =================
for i, n in enumerate(['l8crk1_0.jpg', 'l8crk2_1.jpg', 'l8crk2_0.jpg', 'l8crk3_1.jpg', 'l8crk3_0.jpg']): single('crk%d' % i, n)
def nologo(name, out, pts, r=11):
    """Закрасить эмблему марки на решётке радиатора (без реальных брендов)."""
    from PIL import ImageDraw
    im = Image.open(os.path.join(SRC, name)).convert('RGB'); d = ImageDraw.Draw(im)
    for (x, y) in pts:
        d.ellipse((x - r, y - r, x + r, y + r), fill=(40, 42, 48))
        for yy in range(y - r + 3, y + r - 1, 5): d.line((x - r + 1, yy, x + r - 1, yy), fill=(78, 80, 88))
    im.save(os.path.join(SRC, out), quality=95)
nologo('l8wreck_0.jpg', '_wreck_nl.jpg', [(770, 645), (1061, 216), (80, 646)])
wr = cut('_wreck_nl.jpg', 'm', 2, 3, clean=True)
Image.open(os.path.join(SRC, '_wreck_nl.jpg')).crop((694, 388, 1376, 768)).save(os.path.join(SRC, '_wreck_van.jpg'), quality=95)
wv = cut('_wreck_van.jpg', 'm', 1, 1, clean=True)
pack('wreck8', [wr[0], wr[1], wv[0]], 1.0, names=['roo', 'spi', 'van'])
dz = cut('l8dazed_0.jpg', 'm', 2, 2, clean=True)
pack('dazed8', dz, 0.42, names=['stasLie', 'stasUp', 'maxLie', 'maxUp'])
def soft(im, k=0.2):
    """Края заплатки стены плавно гаснут: ложится на кирпич фона без квадрата."""
    a = np.asarray(im).copy(); h, w = a.shape[:2]; yy, xx = np.mgrid[0:h, 0:w]
    e = np.minimum(np.minimum(xx, w - 1 - xx) / (w * k), np.minimum(yy, h - 1 - yy) / (h * k))
    hole = (a[..., :3].max(2) < 40)                       # чёрная дыра и вылетающие кирпичи — не гасим
    a[..., 3] = (a[..., 3] * np.where(hole, 1, np.clip(e, 0, 1) ** 1.5)).astype(np.uint8); return Image.fromarray(a)
wl = cut('l8wall_0.jpg', 'm', 2, 4, clean=True)
fr = [soft(f) for f in wl[:4]]
Wd = sum(f.width + 2 for f in fr) + 2; Hd = max(f.height for f in fr) + 2; sh = Image.new('RGBA', (Wd, Hd)); x = 1; meta = []
for f in fr: f = f.resize((round(f.width * 0.9), round(f.height * 0.9)), Image.LANCZOS); sh.paste(f, (x, 1)); meta.append([x, 1, f.width, f.height, f.width // 2, f.height // 2]); x += f.width + 2
sh.save(os.path.join(OUT, 'wall8.png')); DATA['wall8'] = {'f': meta, 'n': ['crack', 'bulge', 'burst', 'hole']}
tr = cut('l8truck_0.jpg', 'm', 1, 4, mode='grid', clean='edge')
pack('truck8', tr, 0.9, names=['a', 'b', 'c', 'd'])
def brk(i):
    """Стадия пролома стены: правая часть кадра из Flow поверх родного конца панорамы закулисья (шов плавный)."""
    base = Image.open(os.path.join(OUT, 'back.jpg')).convert('RGB'); w = base.width; base = base.crop((w - 1280, 0, w, 720))
    new = Image.open(os.path.join(SRC, 'l8brk%d.jpg' % i)).convert('RGB').resize((1280, 720), Image.LANCZOS)
    m = np.clip((np.arange(1280) - 800) / 120.0, 0, 1)[None, :, None]
    out = (np.asarray(base) * (1 - m) + np.asarray(new) * m).astype(np.uint8)
    Image.fromarray(out).save(os.path.join(OUT, 'brk%d.jpg' % i), quality=90); DATA['_bg']['brk%d' % i] = {'w': 1280, 'h': 720}
for i in range(5): brk(i)
def brk_diff(i, src=None, base_name='brk4'):
    """Кадр с краном в проломе: из Flow берём только изменённое (кран, люлька, кирпичи) — маска по разнице с кадром пролома."""
    from scipy import ndimage
    if base_name == 'back': b0 = Image.open(os.path.join(OUT, 'back.jpg')).convert('RGB'); base = np.asarray(b0.crop((b0.width - 1280, 0, b0.width, 720))).astype(float)
    else: base = np.asarray(Image.open(os.path.join(OUT, base_name + '.jpg')).convert('RGB')).astype(float)
    new = np.asarray(Image.open(os.path.join(SRC, src or 'l8brk%d.jpg' % i)).convert('RGB').resize((1280, 720), Image.LANCZOS)).astype(float)
    d = ndimage.uniform_filter(np.abs(new - base).sum(2), 9) > 60
    d = ndimage.binary_closing(d, iterations=6); d = ndimage.binary_fill_holes(d)
    lab, n = ndimage.label(d); sz = ndimage.sum(d, lab, range(1, n + 1)); d = np.isin(lab, [k + 1 for k, v in enumerate(sz) if v > 1500])
    d = ndimage.binary_dilation(d, iterations=4); m = ndimage.gaussian_filter(d.astype(float), 3)
    m = np.maximum(m, np.clip((np.arange(1280) - 900) / 100.0, 0, 1)[None, :])[..., None]
    Image.fromarray((base * (1 - m) + new * m).astype(np.uint8)).save(os.path.join(OUT, 'brk%d.jpg' % i), quality=90); DATA['_bg']['brk%d' % i] = {'w': 1280, 'h': 720}
brk_diff(5)
for i, n in enumerate(['l8nat1.jpg', 'l8nat2.jpg']): brk_diff(6 + i, n, 'back')   # кран Наташки пробивает стену: 3 кадра фона
open(os.path.join(ROOT, 'js', 'l8_data.js'), 'w', encoding='utf-8').write('// собрано tools/build_l8.py — не править руками\nwindow.L8D = ' + json.dumps(DATA, separators=(',', ':')) + ';\n')

if DBG:
    for n in DATA:
        if n.startswith('_'): continue
        im = Image.open(os.path.join(OUT, n + '.png'))
        bgc = Image.new('RGB', im.size, (60, 70, 90)); bgc.paste(im, (0, 0), im)
        bgc.save(os.path.join(SRC, '_dbg_' + n + '.jpg'), quality=88)
