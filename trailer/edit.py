# Монтаж трейлера v3: чистые кадры игры 1080p + слежение за Валерой + титры шрифтом игры + музыка -> trailer_ru.mp4
# Время — в долях (beat = 0.4 с = 12 кадров). Карта музыки: интро 0-32, дроп 32-96, брейк 96-112,
# второй дроп 112-176, удары 176/177.5/179, финал 180-210 (большие удары на 180 и 196).
import os, json, subprocess, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
FR = os.path.join(HERE, 'frames')
W, H, FPS = 1920, 1080, 30
BF = 12
TOTAL_B = 210
PX = 3
random.seed(3)
ZOOM = {'n_l6wand': 1.0, 'n_l6d': 1.0}                 # в ур.6 Валера и так крупнее — кадр как в игре
TALL = {'n_l6wand': 1.6, 'n_l6d': 1.6}                 # рост Валеры относительно обычного
state = {'seg': None, 'c': None, 'crop': (0, 1), 'vsrc': None, 'vbox': None}

CREAM, YELLOW, ORANGE, RED, GRAY = (244, 240, 228), (255, 216, 74), (255, 138, 58), (232, 48, 40), (200, 192, 176)
BOXBG, BOXLINE = (24, 26, 32), (240, 106, 20)

# ---------- пиксельный шрифт игры ----------
_fc = {}
def _font(kind, size):
    k = (kind, size)
    if k not in _fc: _fc[k] = ImageFont.truetype(os.path.join(HERE, f'ps2p-{kind}.ttf'), size)
    return _fc[k]
def _kind(ch): return 'cyr' if 'Ѐ' <= ch <= 'ӿ' or ch == '№' else 'lat'

def px_text(text, size, color, outline=True):
    """Текст как G.text в игре: моноширинный пиксельный шрифт, чёрная обводка шагом size/8."""
    s = max(1, size // 8); pad = s * 2
    im = Image.new('RGBA', (len(text) * size + pad * 2, size + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(im); d.fontmode = '1'
    offs = [(s, s)] + ([(-s, 0), (0, -s), (-s, s), (s, -s), (s, 0), (0, s), (-s, -s)] if outline else [])
    for (ox, oy), col in [(o, (0, 0, 0)) for o in offs] + [((0, 0), color)]:
        for i, ch in enumerate(text):
            if ch != ' ': d.text((pad + i * size + ox, pad + oy), ch, font=_font(_kind(ch), size), fill=col + (255,))
    return im

def fit(lines, size):   # размер кратен 8, чтобы самая длинная строка влезла в кадр
    return min(size, (1820 // max(len(l) for l in lines)) // 8 * 8)

def stack(imgs, gap):
    w = max(i.width for i in imgs); h = sum(i.height for i in imgs) + gap * (len(imgs) - 1)
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0)); y = 0
    for i in imgs: out.alpha_composite(i, ((w - i.width) // 2, y)); y += i.height + gap
    return out

# ---------- монтажный лист ----------
# track: 'auto' — по записанным координатам Валеры; 'color' — по оранжевой куртке; None — кадр задан вручную
S = []
def seg(b, n, clip, src, z=None, cx=0.5, cy=0.55, drift=0.05, track='auto'):
    S.append(dict(b=b, n=n, clip=clip, src=src, z=z, cx=cx, cy=cy, drift=drift, track=track))
def cuts(b, lst):
    """Подряд идущие планы: (длина в долях, клип, секунда[, параметры])."""
    for n, c, s, *rest in lst:
        kw = rest[0] if rest else {}
        seg(b, n, c, s, **kw); b += n
    return b

WIDE = dict(track=None, z=1.0, cy=0.5)
CAR = dict(track=None, z=1.08, cy=0.5)
GUN = dict(track=None, z=1.08, cy=0.6)
COL = dict(track='color', z=1.12)
TUN = dict(track=None, z=1.1, cy=0.62)          # тоннель: срезаем шкалу босса сверху
STL = dict(track=None, z=1.0, cy=0.5)           # стелс: всё здание целиком

# --- Интро: завод ---
seg(0, 12, 'n_l1', 6.2, track=None, z=1.0, cy=0.5, drift=0.10)
seg(12, 8, 'n_l1', 17.2, track=None, z=1.15, cx=0.5, cy=0.65, drift=0.06)
cuts(20, [(2, 'n_l2c', 1.0), (2, 'n_l4in', 3.0), (2, 'n_l3b', 2.0), (2, 'n_l8t', 2.0, GUN)])
# 28-32 — чёрный экран: «СИМУЛЯТОР СТРОПАЛЬЩИКА»
# --- Дроп 1 ---
cuts(32, [  # 10 миссий — восемь разных режимов по доле
    (1, 'n_l2c', 2.0), (1, 'n_l5', 2.8, CAR), (1, 'n_l8d', 3.0, GUN), (1, 'n_l9', 4.0, COL),
    (1, 'n_l3', 5.0), (1, 'n_l5r', 4.0, CAR), (1, 'n_l8t', 6.0, GUN), (1, 'n_l4in', 6.0),
    # без надписей — сюда планы, где Валера высоко
    (2, 'n_boss1', 0.8), (2, 'n_l6d', 4.0), (2, 'n_l7F', 3.0, STL), (2, 'n_l6wand', 5.5),
])
cuts(48, [(4, 'n_l3', 0.5), (2, 'n_l3b', 5.0), (2, 'n_l9lab', 1.0, COL)])                       # пельмешки и кефирчик
cuts(56, [(2, 'n_l2boss', 8.0), (2, 'n_l4in', 9.5), (2, 'n_l2c', 6.0), (2, 'n_l4', 13.0)])       # не давай себя в обиду
cuts(64, [(2, 'n_l2', 8.0), (2, 'n_l5', 5.0, CAR), (2, 'n_l2boss', 0.5), (2, 'n_l5', 13.5, CAR),  # защищай район
          (2, 'n_l6wand', 0.5), (2, 'n_boss1', 6.0), (2, 'n_l5r', 7.0, CAR), (2, 'n_l6d', 7.5)])
cuts(80, [(2, 'n_l4', 1.5), (2, 'n_l8', 5.0, GUN), (2, 'n_l4in', 0.5), (2, 'n_l8d', 7.0, GUN),    # бывшие друзья
          (2, 'n_l4boss', 4.0), (2, 'n_l7F', 6.0, STL), (2, 'n_l3boss', 0.1, dict(track=None, z=1.0, cy=0.5)), (2, 'n_l9', 7.0, COL)])
# --- Брейк ---
seg(96, 8, 'n_roof', 1.0, track=None, z=1.0, cy=0.5, drift=0.1)
seg(104, 8, 'n_l7hall', 1.0, track=None, z=1.0, cy=0.5, drift=0.1)
# --- Дроп 2 ---
cuts(112, [(4, 'n_l2c', 3.0), (2, 'n_l4in', 11.0), (2, 'n_l8t', 4.0, GUN)])                      # только он
cuts(120, [(2, 'n_l2', 11.0), (2, 'n_l9', 10.0, COL), (2, 'n_l3b', 8.0), (2, 'n_l4in', 7.5)])     # спасти свой народ
cuts(128, [(2, 'n_l9lab', 1.5, COL), (2, 'n_l8t', 3.0, GUN), (2, 'n_l9lab', 6.5, COL), (2, 'n_l8', 10.5, GUN)])          # выжмут все соки
cuts(136, [(2, 'n_l4boss', 7.0), (2, 'n_l2boss', 4.5), (2, 'n_l9', 6.0, COL), (1, 'n_l4in', 5.0),  # как и из вас
           (1, 'n_l3boss', 0.5, dict(track=None, z=1.0, cy=0.5))])
cuts(144, [  # четыре слогана, склейка каждую долю
    (1, 'n_l4in', 1.5), (1, 'n_l2boss', 12.5), (1, 'n_l8d', 5.0, GUN), (1, 'n_l4', 4.0),
    (1, 'n_l3', 2.3), (1, 'n_l8', 2.0, GUN), (1, 'n_l2c', 9.0), (1, 'n_l3b', 3.0),
    (1, 'n_l5r', 3.0, CAR), (1, 'n_l9', 2.0, COL), (1, 'n_l8t', 8.0, GUN), (1, 'n_l2', 14.0),
    (1, 'n_l4', 8.5), (1, 'n_l2', 6.5), (1, 'n_l9lab', 10.0, COL), (1, 'n_l2boss', 9.5),
])
cuts(160, [(2, 'n_l2c', 0.5), (2, 'n_l4in', 12.0), (2, 'n_l8d', 8.5, GUN), (2, 'n_l3', 12.0),     # не просто парень
           (2, 'n_l9', 12.0, COL), (2, 'n_l2boss', 2.5), (2, 'n_l4', 11.5), (2, 'n_l8t', 8.8, GUN)])

DARK = {(96, 112): 0.5}
CUT_FLASH = {20, 32, 48, 64, 80, 112, 128, 144, 148, 152, 156, 160, 176, 177.5, 179, 180, 196}
PUNCH = [(32, 96), (112, 176)]

# ---------- титры ----------
T = []
def caption(b0, b1, text):
    """Окно диалога игры: тёмная панель, оранжевая полоса сверху, текст печатается."""
    T.append(dict(b0=b0, b1=b1, kind='box', text=text))
def band(b0, b1, lines, sub=None, color=CREAM, size=88, y=0.42):
    """Плашка как у названия уровня: тёмная полоса, крупный текст, подпись."""
    sz = fit(lines, size)
    imgs = [px_text(l, sz, color) for l in lines]
    if sub: imgs.append(px_text(sub, 40, GRAY, outline=False))
    T.append(dict(b0=b0, b1=b1, kind='band', img=stack(imgs, 20), y=y))
def big(b0, b1, lines, size=104, color=YELLOW, y=0.5):
    """G.bigTitle: крупный текст с обводкой, влетает с увеличением."""
    sz = fit(lines, size)
    T.append(dict(b0=b0, b1=b1, kind='big', img=stack([px_text(l, sz, color) for l in lines], sz // 3), y=y))

big(3, 12, ['СТРАНА ЛЕМУРИЯ', 'ГОРОД ВЫБОРГСК'], 104, CREAM)
caption(12.5, 20, 'ЧТО ВЫ ЗНАЛИ О СТРОПАЛЬЩИКАХ?')
band(20, 28, ['ВЫ НИЧЕГО НЕ ЗНАЛИ', 'О СТРОПАЛЬЩИКАХ'], None, CREAM, 64)
big(28, 32, ['СИМУЛЯТОР', 'СТРОПАЛЬЩИКА'], 136, YELLOW)
band(32, 40, ['10 МИССИЙ'], 'С УНИКАЛЬНЫМ ГЕЙМПЛЕЕМ', YELLOW, 96)
band(48, 55.5, ['КУШАЙ ПЕЛЬМЕШКИ,', 'ЗАПИВАЙ КЕФИРЧИКОМ'], None, CREAM, 64)
band(56, 63.5, ['НЕ ДАВАЙ СЕБЯ В ОБИДУ'], None, ORANGE, 80)
band(64, 71, ['ЗАЩИЩАЙ СВОЙ РАЙОН И ГОРОД'], None, CREAM, 72)
band(80, 87.5, ['БЫВШИЕ ДРУЗЬЯ ТЕПЕРЬ', 'НЕ ТЕ, КЕМ КАЖУТСЯ'], None, CREAM, 64)
big(96, 104, ['НА ВЫБОРГСК ПАЛА', 'МОХНАТАЯ ЛАПА'], 96, CREAM)
big(104, 112, ['ЗЛО', 'БЕЗГРАНИЧНОГО', 'МАСШТАБА'], 104, RED)
band(112, 119.5, ['ТОЛЬКО ОН'], 'ТОТ, НА КОГО НИКАК НЕ ПОДУМАЕШЬ', YELLOW, 96)
band(120, 127.5, ['ТОЛЬКО ОН МОЖЕТ', 'СПАСТИ СВОЙ НАРОД'], None, CREAM, 64)
band(128, 135.5, ['ИЗ ГОРОДА ВЫЖМУТ ВСЕ СОКИ'], None, CREAM, 72)
band(136, 143.5, ['КАК И ИЗ ВАС'], '(НА СЛОЖНОСТИ HARD)', RED, 96)
big(144, 148, ['ЖАРКИЕ БАТАЛИИ'], 96, YELLOW)
big(148, 152, ['ЧЁРНЫЙ ЮМОР'], 96, CREAM)
big(152, 156, ['РАЗНООБРАЗНЫЕ УРОВНИ'], 88, YELLOW)
big(156, 160, ['ВСЁ ДО БОЛИ ЗНАКОМОЕ', 'КАЖДОМУ'], 64, CREAM)
caption(160, 176, 'ВАЛЕРА - ЭТО НЕ ПРОСТО ПАРЕНЬ В РЫЖЕЙ ТОЛСТОВКЕ.')

# ---------- финал ----------
head = Image.open(os.path.join(HERE, '..', 'assets', 'spr', 'p_valera.png')).convert('RGBA')   # портрет из диалогов: куртка целая
L1 = px_text('ВАЛЕРА', 176, ORANGE)
L2 = px_text('АГЕНТ', 96, CREAM)
L3 = px_text('RED', 96, RED)
CTA = px_text('ДОБАВЛЯЙ В ЖЕЛАЕМОЕ', 72, YELLOW)
DATE = px_text('ЯНВАРЬ 2027', 96, CREAM)
PLAT1 = px_text('ВЫХОД НА ПК:', 40, GRAY)
PLAT2 = px_text('STEAM  VK PLAY  PLAY MARKET  APPLE STORE', 40, ORANGE)

# ---------- кадры и дорожки ----------
cache, tracks = {}, {}
def files_of(clip):
    if clip not in cache: cache[clip] = sorted(f for f in os.listdir(os.path.join(FR, clip)) if f.endswith('.jpg'))
    return cache[clip]
def src_frame(clip, idx):
    files = files_of(clip); idx = max(0, min(len(files) - 1, idx))
    return Image.open(os.path.join(FR, clip, files[idx])).convert('RGB')

def track_of(clip):
    """Сглаженная дорожка центра Валеры в долях кадра (или None, если координат нет)."""
    if clip in tracks: return tracks[clip]
    p = os.path.join(FR, clip, 'track.json'); res = None
    if os.path.exists(p):
        raw = json.load(open(p)); n = len(raw)
        ok = np.array([bool(q) and -20 <= q[0] <= 660 and 20 <= q[1] <= 380 for q in raw])
        if ok.sum() > n * 0.3:
            idx = np.arange(n); xs = np.array([q[0] if o else 0 for q, o in zip(raw, ok)], float); ys = np.array([q[1] if o else 0 for q, o in zip(raw, ok)], float)
            xs = np.interp(idx, idx[ok], xs[ok]); ys = np.interp(idx, idx[ok], ys[ok])
            k = np.ones(25) / 25
            sm = lambda a: np.convolve(np.pad(a, 12, mode='edge'), k, mode='valid')
            res = np.stack([sm(xs) / 640, (sm(ys) - 78) / 360], 1)
    tracks[clip] = res
    return res

def color_center(im, prev):
    """Центр оранжевой куртки (для уровней без записанных координат)."""
    a = np.asarray(im.resize((240, 135), Image.BILINEAR), dtype=np.int16)
    m = (a[..., 0] > 190) & (a[..., 1] > 70) & (a[..., 1] < 150) & (a[..., 2] < 70)
    ys, xs = np.nonzero(m)
    if len(xs) < 6: return prev
    c = (float(np.median(xs)) / 240, float(np.median(ys)) / 135)
    return c if prev is None else (prev[0] + (c[0] - prev[0]) * 0.15, prev[1] + (c[1] - prev[1]) * 0.15)

def framed(im, z, cx, cy):
    w, h = im.size; cw, ch = w / z, h / z
    x0 = min(max(cx * w - cw / 2, 0), w - cw); y0 = min(max(cy * h - ch / 2, 0), h - ch)
    state['crop'] = (y0 / h, ch / h)                  # для пересчёта положения Валеры в кадр трейлера
    return im.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch))

yy, xx = np.mgrid[0:H, 0:W]
vign = (1 - 0.38 * np.clip(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2 - 0.25, 0, 1))[..., None].astype(np.float32)

def paste_scaled(base, img, scale, cx, cy, alpha=1.0, dx=0, dy=0):
    if scale != 1: img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.NEAREST)
    if alpha < 1:
        a = img.getchannel('A').point(lambda v: int(v * alpha)); img = img.copy(); img.putalpha(a)
    base.alpha_composite(img, (int(cx - img.width / 2 + dx), int(cy - img.height / 2 + dy)))

def rect(base, x, y, w, h, col, a=255):
    base.alpha_composite(Image.new('RGBA', (int(w), max(1, int(h))), col + (int(a),)), (int(x), int(y)))

def draw_box(base, t, k, left):
    a = min(1, k / 4, left / 4)
    size = 40; maxc = (W - 24 * PX - 28 * PX) // size
    lines, cur = [], ''
    for wd in t['text'].split(' '):                    # перенос считается по полному тексту, чтобы слова не прыгали
        if len(cur) + len(wd) + (1 if cur else 0) > maxc: lines.append(cur); cur = wd
        else: cur = (cur + ' ' + wd) if cur else wd
    lines.append(cur)
    bw = max(len(l) for l in lines) * size + 28 * PX; bh = (len(lines) * 17 + 18) * PX
    bx, by = (W - bw) / 2, (H - bh) / 2               # по центру экрана
    state['trect'] = ((by - 2 * PX) / H, (by + bh + 2 * PX) / H)
    rect(base, bx - 2 * PX, by - 2 * PX, bw + 4 * PX, bh + 4 * PX, (10, 10, 12), 255 * a)
    rect(base, bx, by, bw, bh, BOXBG, 242 * a)
    rect(base, bx, by, bw, 2 * PX, BOXLINE, 255 * a)
    shown = int(max(0, k - 3) / FPS * 30)
    for i, ln in enumerate(lines[:2]):
        part = ln[:max(0, shown)]; shown -= len(ln) + 1
        if part: paste_scaled(base, px_text(part, size, CREAM, outline=False), 1, bx + 14 * PX + len(part) * size / 2, by + 15 * PX + i * 17 * PX + size / 2, a)
    if shown >= 0 and (k // 10) % 2 == 0:
        paste_scaled(base, px_text('>', 24, YELLOW, outline=False), 1, bx + bw - 10 * PX, by + bh - 8 * PX, a)

def draw_titles(base, fb, over_footage):
    for t in T:
        if not (t['b0'] <= fb < t['b1']): continue
        k = (fb - t['b0']) * BF; left = (t['b1'] - fb) * BF
        if t['kind'] == 'box':
            draw_box(base, t, k, left); continue
        o = min(1, k / 4, left / 4)
        t['scur'] = 1.0
        cy = H * 0.5                                  # все надписи — строго по центру экрана
        hh = (t['img'].height + 30) / H; state['trect'] = (0.5 - hh / 2, 0.5 + hh / 2)
        if over_footage:                              # лёгкая подложка по размеру текста: читается, но игру видно
            hb = (t['img'].height * t['scur'] + 30) * o; wb = min(W, t['img'].width * t['scur'] + 70)
            rect(base, (W - wb) / 2, cy - hb / 2, wb, hb, (0, 0, 0), 105)
        if t['kind'] == 'band':
            sc = round((1 + 0.6 * max(0, 1 - k / 5) ** 2) * 8) / 8; dx = 0
        else:
            sc = 1 + 1.2 * max(0, 0.4 - k / 12) if k < 5 else 1
            dx = random.randint(-12, 12) * max(0, 1 - k / 8)
        sc = min(sc, (W - 40) / t['img'].width)       # при влёте надпись не вылезает за края экрана
        paste_scaled(base, t['img'], sc * t['scur'], W / 2, cy, min(1, k / 2, left / 4), dx)

def logo(base, fb):
    def slam(b, img, cx, cy, blink=False):
        k = (fb - b) * BF
        if k < 0 or (blink and k > 36 and k % 30 >= 24): return
        sc = 1 + 0.6 * max(0, 1 - k / 4) ** 2; dx = random.randint(-10, 10) * max(0, 1 - k / 8)
        paste_scaled(base, img, sc, cx, cy, min(1, k / 2 + 0.3), dx, 0)
    up = fb >= 180
    if up:
        k = (fb - 180) * BF
        paste_scaled(base, head, round((1 + 0.5 * max(0, 1 - k / 6) ** 2) * 2 * 8) / 8, W / 2, 148, min(1, k / 4))
    yL = 380 if up else 470
    slam(176, L1, W / 2, yL)
    slam(177.5, L2, W / 2 - L3.width / 2 - 20, yL + 160)
    slam(179, L3, W / 2 + L2.width / 2 + 20, yL + 160)
    slam(186, CTA, W / 2, 690, blink=True)
    if fb >= 196:
        k = (fb - 196) * BF; a = min(1, k / 6)
        slam(196, DATE, W / 2, 830)
        paste_scaled(base, PLAT1, 1, W / 2, 935, a)
        paste_scaled(base, PLAT2, 1, W / 2, 1005, a)

# ---------- рендер ----------
bg_end = framed(src_frame('n_l1', 300), 1.0, 0.5, 0.5).filter(ImageFilter.GaussianBlur(10))
bg_end = Image.eval(bg_end, lambda v: int(v * 0.35))

def render(i):
    fb = i / BF
    s = next((s for s in S if s['b'] <= fb < s['b'] + s['n']), None)
    state['vsrc'] = state['vbox'] = state['trect'] = None
    if s:
        k = i - s['b'] * BF; p = k / (s['n'] * BF)
        fi = int(round(s['src'] * FPS)) + k
        im = src_frame(s['clip'], fi)
        z, cx, cy = s['z'], s['cx'], s['cy']
        tr = track_of(s['clip']) if s['track'] == 'auto' else None
        if tr is not None:
            cx, cy = tr[min(len(tr) - 1, fi)]; z = z or ZOOM.get(s['clip'], 1.12)
            feet = cy + 78 / 360; state['vsrc'] = (feet - 116 * TALL.get(s['clip'], 1) / 360, feet + 4 / 360)   # голова..ноги в долях исходного кадра
        elif s['track'] == 'color':
            if state['seg'] is not s: state['seg'], state['c'] = s, None
            if state['c'] is None:                          # первый кадр плана — без сглаживания
                c0 = color_center(im, None); state['c'] = c0 or (0.5, 0.6)
            else: state['c'] = color_center(im, state['c'])
            cx, cy = state['c']
            state['vsrc'] = (cy - 0.16, cy + 0.12)
        z = (z or 1.2) * (1 + s['drift'] * p)
        for a, b in PUNCH:
            if a <= fb < b: z *= 1 + 0.03 * max(0, 1 - ((i % BF) / BF) * 4)
        if state['vsrc'] and any(t['b0'] <= fb < t['b1'] for t in T):
            chn = 1 / z; y0 = min(max(state['vsrc'][1] - 0.95 * chn, 0), 1 - chn)
            cy_t = y0 + chn / 2
        else: cy_t = cy
        if k == 0 or state.get('cyc') is None: state['cyc'] = cy_t
        state['cyc'] += (cy_t - state['cyc']) * 0.2    # плавно, без рывков камеры
        cy = state['cyc']
        arr = np.asarray(framed(im, z, cx, cy), dtype=np.float32) * vign
        if state['vsrc']:
            y0n, chn = state['crop']; a0, a1 = state['vsrc']
            state['vbox'] = ((a0 - y0n) / chn, (a1 - y0n) / chn)
        for (a, b), d in DARK.items():
            if a <= fb < b: arr *= d
    elif fb >= 180:
        z = 1 + 0.05 * (fb - 180) / 30
        arr = np.asarray(bg_end.resize((int(W * z), int(H * z))).crop((int(W * (z - 1) / 2), int(H * (z - 1) / 2), int(W * (z - 1) / 2) + W, int(H * (z - 1) / 2) + H)), dtype=np.float32)
    else:
        arr = np.zeros((H, W, 3), np.float32)
    for b in CUT_FLASH:
        k = i - b * BF
        if 0 <= k < 5: arr = arr + (255 - arr) * (0.8 * (1 - k / 5))
    if i < 18: arr *= i / 18
    base = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert('RGBA')
    draw_titles(base, fb, s is not None)
    if fb >= 176: logo(base, fb)
    out = base.convert('RGB')
    if fb > TOTAL_B - 4: out = Image.eval(out, lambda v, m=max(0, (TOTAL_B - fb) / 4): int(v * m))
    return out

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'stills':
        os.makedirs(os.path.join(HERE, 'stills'), exist_ok=True)
        for b in [float(x) for x in sys.argv[2:]]:
            render(int(b * BF)).resize((960, 540)).save(os.path.join(HERE, 'stills', f'b{b:06.1f}.jpg'), quality=85)
        sys.exit()
    nfr = TOTAL_B * BF
    out = os.path.join(HERE, 'trailer_ru.mp4')
    cmd = ['ffmpeg', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
           '-i', os.path.join(HERE, 'music.wav'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
           '-profile:v', 'high', '-c:a', 'aac', '-b:a', '320k', '-shortest', '-movflags', '+faststart', out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(nfr):
        p.stdin.write(render(i).tobytes())
        if i % 300 == 0: print(i, '/', nfr, flush=True)
    p.stdin.close(); p.wait(); print('done', out)
