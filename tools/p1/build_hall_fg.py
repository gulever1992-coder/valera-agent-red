# Ящики справа в цеху (фон bg_hall.jpg) -> отдельный передний план, чтобы Юрик выходил из-за них.
# Маска — прямоугольники в координатах игры (640x360), фон в 2x.
from PIL import Image, ImageDraw, ImageFilter
X0, Y0, X1, Y1 = 520, 278, 640, 350
R = [(568, 281, 640, 350), (526, 301, 570, 350), (563, 289, 570, 302), (521, 326, 527, 350)]
bg = Image.open('assets/bg_hall.jpg').convert('RGBA').crop((X0 * 2, Y0 * 2, X1 * 2, Y1 * 2))
m = Image.new('L', bg.size, 0); d = ImageDraw.Draw(m)
for a, b, c, e in R: d.rectangle(((a - X0) * 2, (b - Y0) * 2, (c - X0) * 2 - 1, (e - Y0) * 2 - 1), fill=255)
bg.putalpha(m.filter(ImageFilter.GaussianBlur(0.6)))
bg.save('assets/bg_hall_fg.png')
print('ok', bg.size)
