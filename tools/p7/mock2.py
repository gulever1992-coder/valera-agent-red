import sys; sys.path.insert(0, 'tools/p7')
from cut import frames
from PIL import Image, ImageDraw, ImageFilter
V = frames('art_src/l7/v7sneak2.png'); MC = frames('art_src/l7/max_cmdr.png')
C = frames('art_src/l7/cars7n.png'); P = frames('art_src/l7/props7n.png'); CA = frames('art_src/l7/cast7.png')
VS = 168 / V[5].height          # Валера стоя = 168 px (84 из 360 логики)
FEET = 600
bg = Image.open('art_src/l7/bg_parking.png').convert('RGBA').resize((1280, 720), Image.LANCZOS)
def sc(im, s, flip=False):
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    return im.transpose(Image.FLIP_LEFT_RIGHT) if flip else im
def put(dst, im, x, feet):  # x — левый край, feet — линия ног
    dst.alpha_composite(im, (int(x), int(feet - im.height)))
def scene():
    f = bg.copy()
    CAR = 134 / 127
    put(f, sc(P[9], VS * 1.1), 760, 618)                      # люк
    put(f, sc(P[3], VS * 0.95), 1060, FEET - 6)               # будка (открыта)
    put(f, sc(P[0], VS * 0.95), 1180, FEET - 6)               # биотуалет
    put(f, sc(C[2], CAR), 560, FEET - 8)                      # белый седан (дальше)
    cmd = sc(MC[2], 170 / MC[2].height, flip=True)             # спецназ идёт влево? -> смотрит влево
    put(f, cmd, 700, FEET + 4)
    # конус фонаря (в игре — спрайт света)
    cone = Image.new('RGBA', f.size); d = ImageDraw.Draw(cone)
    d.polygon([(708, 525), (470, 600), (560, 640)], fill=(255, 235, 150, 110))
    f.alpha_composite(cone.filter(ImageFilter.GaussianBlur(6)))
    put(f, sc(P[4], VS * 0.9), 40, FEET + 6)                   # ящик
    put(f, sc(C[0], CAR * 1.03), 120, FEET + 14)               # «роллс» — укрытие
    put(f, sc(V[4], VS), 440, FEET + 16)                       # Валера пригнулся у капота
    put(f, sc(MC[7], 170 / MC[7].height), 960, FEET + 22)     # второй патруль
    # передний план (крупнее, быстрее параллакс)
    put(f, sc(P[8], 1.5), -60, 760); put(f, sc(P[6], 1.6), 380, 745)
    put(f, sc(P[7], 1.5), 560, 735); put(f, sc(P[8], 1.4), 1000, 770)
    return f
scene().convert('RGB').save('art_src/l7/mock_parking2.png')
# состав персонажей в одном масштабе
L = Image.new('RGBA', (1280, 360), (50, 46, 60, 255)); x = 20
for im, h in [(V[5], 168), (CA[0], 160), (MC[0], 162), (CA[2], 170), (CA[3], 165), (CA[4], 175), (MC[2], 170), (MC[6], 166)]:
    s = sc(im, h / im.height); put(L, s, x, 320); x += s.width + 14
L.convert('RGB').save('art_src/l7/cast_scale.png')
