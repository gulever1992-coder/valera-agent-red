# Обложки уровней 182x150 (в файле 728x600) — из настоящей графики игры: фон уровня + спрайты (Валера, враги, предметы, эффекты).
# py tools/build_covers.py [--sheet out.jpg]  ->  assets/covers/covN.jpg ; затем py tools/optimize_assets.py
import json, sys, os
from PIL import Image, ImageEnhance, ImageDraw, ImageFilter, ImageChops
OW, OH = 728, 600

def load_sprites():
    t = open('js/sprites_data.js', encoding='utf-8').read(); t = t[t.index('window.SPRITES =') + 16:]
    S = json.JSONDecoder().raw_decode(t.strip())[0]
    for js, var, d in (('js/l8_data.js', 'window.L8D =', 'assets/l8/'), ('js/l9_data.js', 'window.L9D =', 'assets/l9/')):
        t = open(js, encoding='utf-8').read(); t = t[t.index(var) + len(var):]
        for k, v in json.JSONDecoder().raw_decode(t.strip())[0].items():
            if isinstance(v, dict) and 'f' in v and k not in S:
                v['img'] = next((d + k + e for e in ('.png', '.jpg') if os.path.exists(d + k + e)), d + k + '.png'); S[k] = v
    return S
S = load_sprites(); _img = {}

def frame(name, i):
    s = S[name]
    if s['img'] not in _img: _img[s['img']] = Image.open(s['img']).convert('RGBA')
    f = s['f'][i]; return _img[s['img']].crop((f[0], f[1], f[0] + f[2], f[1] + f[3])), f[4], f[5]

def bg(path, cx, cy, w):
    # вырезать из фона прямоугольник 728:600 шириной w с центром (cx, cy) в долях картинки
    im = Image.open(path).convert('RGB'); h = w * OH / OW
    x0 = min(max(0, cx * im.width - w / 2), im.width - w); y0 = min(max(0, cy * im.height - h / 2), im.height - h)
    return im.crop((int(x0), int(y0), int(x0 + w), int(y0 + h))).resize((OW, OH), Image.LANCZOS)

def put(canvas, name, i, x, y, h, flip=False, dark=1.0, rot=0, alpha=1.0, shadow=True):
    # спрайт ногами (точка привязки кадра) в (x, y), высота h пикселей; rot — поворот (тогда (x, y) — центр)
    c, ax, ay = frame(name, i); k = h / c.height
    c = c.resize((max(1, round(c.width * k)), max(1, round(c.height * k))), Image.LANCZOS)
    ax, ay = ax * k, ay * k
    if flip: c = c.transpose(Image.FLIP_LEFT_RIGHT); ax = c.width - ax
    if dark != 1.0:
        a = c.getchannel('A'); c = ImageEnhance.Brightness(c.convert('RGB')).enhance(dark).convert('RGBA'); c.putalpha(a)
    if rot:
        c = c.rotate(rot, expand=True, resample=Image.BICUBIC); ax, ay = c.width / 2, c.height / 2
    if alpha != 1.0: c.putalpha(c.getchannel('A').point(lambda v: int(v * alpha)))
    if shadow and not rot:   # мягкая тень под ногами
        sh = Image.new('L', canvas.size, 0); w = c.width * 0.42
        ImageDraw.Draw(sh).ellipse((x - w, y - 9, x + w, y + 7), fill=120)
        canvas.paste((0, 0, 0), (0, 0), sh.filter(ImageFilter.GaussianBlur(6)))
    canvas.paste(c, (round(x - ax), round(y - ay)), c)

def fx(canvas, name, i, x, y, h, flip=False, rot=0):
    # эффект/летящий предмет без тени
    put(canvas, name, i, x, y, h, flip=flip, rot=rot, shadow=False)

def addfx(canvas, name, i, x, y, h):
    # эффект на чёрном фоне (jpg-листы ур.9) — режим «осветление», (x, y) — центр
    c, _, _ = frame(name, i); c = c.convert('RGB'); k = h / c.height
    c = c.resize((max(1, round(c.width * k)), max(1, round(c.height * k))), Image.LANCZOS)
    box = (round(x - c.width / 2), round(y - c.height / 2)); reg = canvas.crop((*box, box[0] + c.width, box[1] + c.height))
    canvas.paste(ImageChops.screen(reg, c), box)

def glow(canvas, x, y, r, color, a=0.5):
    # мягкое пятно света
    m = Image.new('L', canvas.size, 0); ImageDraw.Draw(m).ellipse((x - r, y - r, x + r, y + r), fill=int(255 * a))
    canvas.paste(Image.new('RGB', canvas.size, color), (0, 0), m.filter(ImageFilter.GaussianBlur(r / 2)))

def cone(canvas, x0, y0, x1, x2, y1, color=(255, 230, 140), a=0.28):
    # луч фонаря
    m = Image.new('L', canvas.size, 0); ImageDraw.Draw(m).polygon([(x0, y0), (x1, y1), (x2, y1)], fill=int(255 * a))
    canvas.paste(Image.new('RGB', canvas.size, color), (0, 0), m.filter(ImageFilter.GaussianBlur(10)))

def rain(canvas, a=1.0, ground=None):
    # дождь как в ур.7 (Storm.drawRain): тайлы fx4 13 (мелкий) и 12 (крупный) в режиме сложения + брызги на земле
    import random; rnd = random.Random(7)
    for fr, alpha, sc in ((13, 0.35, 2.0), (12, 0.55, 2.8)):
        c, _, _ = frame('fx4', fr); c = c.resize((round(c.width * sc), round(c.height * sc)), Image.LANCZOS)
        rgb = Image.new('RGB', c.size); rgb.paste(c.convert('RGB'), (0, 0), c)
        rgb = rgb.point(lambda v: int(v * alpha * a))
        for yy in range(-rnd.randrange(c.height), OH, c.height):
            for xx in range(-rnd.randrange(c.width), OW, c.width):
                box = (xx, yy, xx + c.width, yy + c.height); reg = canvas.crop(box)
                canvas.paste(ImageChops.add(reg, rgb), box)
    if ground:
        for _ in range(14): fx(canvas, 'fx4', 4 + rnd.randrange(4), rnd.randrange(OW), rnd.randrange(*ground), 22)

def vignette(canvas, k=0.55):
    m = Image.new('L', canvas.size, 0); ImageDraw.Draw(m).ellipse((-OW * 0.25, -OH * 0.2, OW * 1.25, OH * 1.2), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(90)).point(lambda v: int((255 - v) * k))
    canvas.paste((0, 0, 0), (0, 0), m)

def copy_card(path, cx=0.5, cy=0.5, w=None):
    im = Image.open(path).convert('RGB'); w = w or min(im.width, im.height * OW / OH)
    return bg(path, cx, cy, w)

COVERS = {}
def cover(n):
    def deco(f): COVERS[n] = f; return f
    return deco

@cover(1)   # Севмолот: цех, подлодка, сварщик, злой работяга с ключом, чайки
def c1():
    c = bg('assets/bg_hall.jpg', 0.5, 0.85, 760)
    put(c, 'sub', 0, 500, 470, 120, dark=0.85)
    fx(c, 'props', 4, 560, 230, 190)                       # крюк крана
    put(c, 'wk_a', 0, 400, 545, 150, dark=0.85)            # сварщик
    glow(c, 430, 520, 40, (255, 200, 90), 0.55)
    put(c, 'props', 6, 120, 585, 110, dark=0.9)            # ящик
    fx(c, 'enemies', 2, 330, 120, 80, flip=True)           # чайки
    fx(c, 'enemies', 3, 640, 70, 60)
    put(c, 'enemies', 5, 640, 590, 250, flip=True)         # работяга с ключом
    put(c, 'v_story', 3, 210, 590, 330)
    vignette(c)
    return c

@cover(2)   # Дорога домой: двор, гопники, бомж, дворовая собака, ворона, дождь
def c2():
    c = bg('assets/street.jpg', 0.5, 0.62, 1100)
    put(c, 'street', 0, 120, 470, 150, dark=0.8)           # ларёк
    put(c, 'street', 10, 640, 470, 190, dark=0.8)          # фонарь
    glow(c, 655, 290, 60, (255, 190, 90), 0.45)
    fx(c, 'crow2', 8, 440, 150, 60, flip=True)
    put(c, 'bomzh', 5, 470, 520, 190, flip=True, dark=0.85)
    put(c, 'street', 11, 30, 600, 150)                     # бочка
    put(c, 'gopnik', 0, 560, 560, 210, dark=0.85)
    put(c, 'gopnik', 1, 650, 560, 250, flip=True, dark=0.85)
    put(c, 'punk', 5, 420, 595, 120, flip=True)            # собака лает
    put(c, 'v_run', 1, 230, 590, 320)
    rain(c, 0.45, ground=(560, 600)); vignette(c)
    return c

@cover(3)   # Глюки: квартира, Валера в шлеме-арбузе поливает клопа, муха с бомбой, газ
def c3():
    c = bg('assets/wall_living.jpg', 0.5, 0.55, 860)
    fx(c, 'gas', 2, 130, 330, 170)
    fx(c, 'gas', 0, 620, 420, 160, flip=True)
    put(c, 'spider', 0, 140, 210, 150, shadow=False)
    fx(c, 'fly', 2, 560, 200, 130, flip=True)              # муха с бомбой
    fx(c, 'items3', 9, 520, 300, 46)                       # летящая бомба
    put(c, 'bedbug', 3, 600, 585, 210, flip=True)
    put(c, 'v3_act', 1, 280, 590, 320)
    fx(c, 'proj6', 4, 470, 520, 70)                        # брызги
    vignette(c)
    return c

@cover(4)   # Дикие кошки — прежняя карточка
def c4(): return copy_card('assets/l4_sq.jpg', 0.5, 0.45)

@cover(5)   # Погоня — прежняя карточка
def c5(): return copy_card('assets/l5_card.jpg', 0.45, 0.5)

@cover(6)   # Грибной дождь: лес, Валера с палочкой, мухоморы, бобр, маугли, листопад
def c6():
    c = bg('assets/l6/bgf.jpg', 0.3, 0.5, 860)
    put(c, 'mowgli', 4, 640, 300, 170, flip=True, shadow=False)   # на ветке
    put(c, 'vfx6', 7, 380, 575, 80)
    put(c, 'vfx6', 8, 70, 580, 110)
    put(c, 'beaver', 1, 470, 575, 130, flip=True)
    put(c, 'amanita', 3, 600, 575, 230, flip=True)
    fx(c, 'spells6', 3, 420, 380, 50)                      # зелёный снаряд палочки
    put(c, 'v6_wand', 3, 220, 580, 300)
    for (x, y, i, r) in ((90, 90, 0, 20), (300, 160, 2, -30), (520, 110, 4, 40), (660, 220, 1, 10), (180, 300, 6, 60), (400, 60, 5, -15)):
        fx(c, 'l5leaf', i, x, y, 34, rot=r)
    vignette(c, 0.45)
    return c

@cover(7)   # Заводоуправление: ночь, дождь, спецназ с фонарём, собака, крыса
def c7():
    c = bg('assets/l7v4/shopbig.jpg', 0.5, 0.55, 900)
    put(c, 'fg7', 2, 430, 590, 90, dark=0.75)              # конус
    put(c, 'rat7', 0, 330, 590, 45, dark=0.8)
    put(c, 'guard7', 6, 610, 585, 290, flip=True, dark=0.8)
    put(c, 'dog7', 9, 470, 585, 140, flip=True, dark=0.8)
    put(c, 'v7sneak', 0, 170, 590, 250)
    put(c, 'fg7', 5, 60, 600, 120, dark=0.6)               # бетонный блок спереди
    cone(c, 455, 405, 40, 290, 560, a=0.36)               # луч фонаря — поверх, освещает Валеру
    rain(c, 1.0, ground=(560, 600)); vignette(c, 0.6)
    return c

@cover(8)   # Закулисье: зомби, люстра, выстрел, гильзы
def c8():
    c = bg('assets/l8/back.jpg', 0.5, 0.55, 900)
    fx(c, 'props8', 0, 360, 170, 170)                      # люстра
    glow(c, 360, 120, 70, (255, 210, 120), 0.35)
    put(c, 'zombB0', 3, 130, 470, 190, dark=0.85)
    put(c, 'zombE0', 4, 630, 470, 190, flip=True, dark=0.85)
    put(c, 'zombA0', 2, 260, 470, 200, dark=0.9)
    put(c, 'zombC0', 1, 480, 470, 200, flip=True, dark=0.9)
    fx(c, 'fx8', 0, 270, 330, 70)                          # прицел
    fx(c, 'fx8', 8, 495, 360, 70)                          # попадание
    put(c, 'val8', 0, 360, 600, 300)
    fx(c, 'fx8', 3, 450, 380, 70)                          # вспышка выстрела
    fx(c, 'fx8', 5, 470, 470, 24, rot=40)                  # гильзы
    fx(c, 'fx8', 5, 500, 520, 22, rot=-70)
    vignette(c)
    return c

@cover(9)   # Подземка: лаборатория с капсулами, Валера с плазмоганом против мутантов и роботов (без Семёна)
def c9():
    c = bg('assets/l9/lab3a.jpg', 0.5, 0.38, 640)
    glow(c, 360, 300, 260, (60, 255, 170), 0.12)
    put(c, 'eCrawl9', 1, 300, 238, 150, shadow=False)              # ползун под потолком
    put(c, 'eSuper9', 7, 665, 565, 190, flip=True, dark=0.7)      # пулемётчик в глубине
    put(c, 'eSpit9', 7, 545, 592, 230, flip=True)                  # жаба-плевун
    put(c, 'rdog9', 8, 345, 592, 140, flip=True)                   # робопёс в прыжке
    put(c, 'vAim9_plasma', 1, 140, 595, 270)
    addfx(c, 'fxL9', 1, 455, 470, 70)                              # плазма у морды пса
    addfx(c, 'fxL9', 10, 345, 400, 50)                             # зелёный плевок
    addfx(c, 'fxL9', 2, 690, 470, 120)                             # пар
    vignette(c)
    return c

if __name__ == '__main__':
    os.makedirs('assets/covers', exist_ok=True)
    out = []
    for n, f in sorted(COVERS.items()):
        im = f(); im.save(f'assets/covers/cov{n}.jpg', quality=92); out.append(im)
    if '--sheet' in sys.argv:
        sh = Image.new('RGB', (OW * 3 // 2, OH * 3 // 2))
        for i, im in enumerate(out): sh.paste(im.resize((OW // 2, OH // 2)), (i % 3 * OW // 2, i // 3 * OH // 2))
        sh.save(sys.argv[-1], quality=85)
    print('ok', len(out))
