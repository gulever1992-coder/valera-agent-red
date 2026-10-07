# макет кадра ур.7 в реальных размерах игры (1280x720, Валера 160 px, ~89 px/м)
import sys; sys.path.insert(0, 'tools/p7')
from cut import frames
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
V = frames('art_src/l7/v7sneak2.png'); SM = frames('art_src/l7/stas_max.png', gap=2)
C = frames('art_src/l7/cars7n.png'); P = frames('art_src/l7/props7n.png'); CA = frames('art_src/l7/cast7.png')
GU = frames('_old/l7/art_src/guard7.png')
import json; _s = open('js/sprites_data.js', encoding='utf8').read(); _d, _ = json.JSONDecoder().raw_decode(_s[_s.index('{'):])
_ci = Image.open('assets/spr/cmd.png').convert('RGBA'); CM = [_ci.crop((a, b, a + w, b + h)) for a, b, w, h, *_ in _d['cmd']['f']]
print(len(GU), [g.size for g in GU][:12]); 
VS = 160 / V[5].height; FEET = 600
def sc(im, s=None, h=None, w=None, flip=False, dark=0):
    if h: s = h / im.height
    if w: s = w / im.width
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    if dark: im = Image.merge('RGBA', (*ImageEnhance.Brightness(im.convert('RGB')).enhance(1 - dark).split(), im.split()[3]))
    return im.transpose(Image.FLIP_LEFT_RIGHT) if flip else im
def put(dst, im, x, feet): dst.alpha_composite(im, (int(x), int(feet - im.height)))
f = Image.open('art_src/l7/bg_parking.png').convert('RGBA').resize((1280, 720), Image.LANCZOS)
put(f, sc(P[9], w=80), 800, 622)                                  # люк ~0.8 м
put(f, sc(P[3], h=180), 1040, FEET - 8)                          # трансформаторная будка 2 м
put(f, sc(P[0], h=205), 1170, FEET - 8)                          # биотуалет 2.3 м
put(f, sc(C[2], h=128), 560, FEET - 10)                          # седан 1.45 м
g1 = sc(GU[1], h=176, flip=True); put(f, g1, 720, FEET + 2)       # патрульный смотрит влево
cone = Image.new('RGBA', f.size); d = ImageDraw.Draw(cone)
d.polygon([(735, 530), (520, 598), (600, 625)], fill=(255, 235, 150, 100))
f.alpha_composite(cone.filter(ImageFilter.GaussianBlur(6)))
put(f, sc(P[4], h=105), 40, FEET + 4)                            # ящик 1.2 м
put(f, sc(C[0], h=134), 110, FEET + 14)                          # «роллс» 1.5 м
put(f, sc(V[4], VS), 455, FEET + 16)                             # Валера пригнулся у капота
put(f, sc(GU[2], h=176), 960, FEET + 22)                         # второй патруль уходит
# передний план: ближе к камере (x1.3), темнее, срезан нижним краем
put(f, sc(P[8], h=120, dark=.45), -40, 745); put(f, sc(P[6], h=105, dark=.45), 380, 740)
put(f, sc(P[7], h=60, dark=.35), 600, 728); put(f, sc(P[8], h=115, dark=.45), 1040, 750)
f.convert('RGB').save('art_src/l7/mock_parking3.png')
L = Image.new('RGBA', (1280, 300), (50, 46, 60, 255)); x = 20
for im, h in [(V[5], 160), (SM[0], 165), (SM[4], 170), (CA[2], 172), (CA[3], 168), (CA[4], 172), (GU[0], 176), (CM[3], 172)]:
    s = sc(im, h=h); put(L, s, x, 270); x += s.width + 22
L.convert('RGB').save('art_src/l7/cast_scale2.png')
