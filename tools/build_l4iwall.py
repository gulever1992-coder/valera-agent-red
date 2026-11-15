# Боковая стена с дверью-выходом в закрытом зале ур.4 (assets/club_iside.png)
# Источник: art_src/iwall2/ibg_v3.jpg — Flow-правка club_leather (лево перерисовано как в лобби).
# Картинка совпадает с assets/club_leather.jpg при высоте 714 и сдвиге (-84, +3) — накладывается с x=0 мира.
import os
from PIL import Image, ImageDraw, ImageFilter
R = os.path.join(os.path.dirname(__file__), '..')
SRC = os.path.join(R, 'art_src/iwall2/ibd_v0.jpg')  # дверь ниже в 1.5 раза: tools/l4_short_door.py + чистовая правка во Flow
H, DX, DY = 714, -84, 3
POLY = [(0, 0), (492, 0), (492, 505), (440, 512), (330, 575), (200, 655), (175, 700), (175, 768), (0, 768)]  # px исходника
im = Image.open(SRC).convert('RGB'); k = H / im.height
S = 4; m = Image.new('L', (im.width * S, im.height * S), 0)
ImageDraw.Draw(m).polygon([(x * S, y * S) for x, y in POLY], fill=255)
m = m.resize(im.size, Image.LANCZOS).filter(ImageFilter.GaussianBlur(2))
src = im.convert('RGBA'); src.putalpha(m)
src = src.resize((round(im.width * k), H), Image.LANCZOS)
x1 = round(492 * k) + DX + 4
out = Image.new('RGBA', (x1, 720), (0, 0, 0, 0)); out.alpha_composite(src.crop((-DX, 0, -DX + x1, H)), (0, DY))
out.save(os.path.join(R, 'assets/club_iside.png')); print('club_iside.png', out.size)
bg = Image.open(os.path.join(R, 'assets/club_leather.jpg')).convert('RGBA').crop((0, 0, 700, 720))
bg.alpha_composite(out); bg.convert('RGB').save(os.path.join(R, 'art_src/iwall2/_prev.jpg'), quality=88)
