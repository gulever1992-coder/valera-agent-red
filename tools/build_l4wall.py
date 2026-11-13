# Боковая стена лобби ур.4 (assets/club_sidewall*.png): стена с дверью из art_src/l4wall/floor_v1.jpg
# + заплатка чистыми обоями (клон из самого фона лобби) поверх обрезанной картины и пальмы у угла.
import os
from PIL import Image, ImageDraw, ImageFilter
R = os.path.join(os.path.dirname(__file__), '..')
import sys
# запуск: py tools/build_l4wall.py [floor_v1|door3_v2] — большая дверь / уменьшенная дверь (по умолчанию)
SRC = sys.argv[1] if len(sys.argv) > 1 else 'door3_v2'
POLY = {  # контур боковой стены в px исходника: угол, плинтус по диагонали, база левой колонны
    'floor_v1': [(0, 0), (386, 0), (386, 542), (364, 547), (300, 562), (296, 570), (120, 694), (113, 700), (113, 768), (0, 768)],
    'door3_v2': [(0, 0), (386, 0), (386, 541), (362, 547), (304, 549), (108, 692), (113, 700), (113, 768), (0, 768)],
}
OFF = 200            # левый край стены = -200 px фона лобби (мир x = -100)
PX0, PX1 = 160, 250  # заплатка в px фона
def wall():
    im = Image.open(os.path.join(R, 'art_src/l4wall', SRC + '.jpg')).convert('RGB'); S = 4
    m = Image.new('L', (392 * S, 768 * S), 0)
    poly = POLY[SRC]
    ImageDraw.Draw(m).polygon([(x * S, y * S) for x, y in poly], fill=255)
    c = im.crop((0, 0, 392, 768)).convert('RGBA'); c.putalpha(m.resize((392, 768), Image.LANCZOS))
    return c.resize((368, 720), Image.LANCZOS)
def patch(lb):
    w = PX1 - PX0; p = Image.new('RGB', (w, 720))
    src = lb.crop((270, 290, 270 + w, 392)); y = 455; k = 0   # чистые обои под вывеской, укладка зеркалом вверх от плинтуса
    while y > 86:
        t = src if k % 2 == 0 else src.transpose(Image.FLIP_TOP_BOTTOM); y -= t.height; p.paste(t, (0, y)); k += 1
    p.paste(lb.crop((290, 455, 290 + w, 493)), (0, 455))       # плинтус — те же строки, соседний чистый участок
    m = Image.new('L', (w, 720), 0); d = ImageDraw.Draw(m)
    d.rectangle([0, 88, 210 - PX0, 268], fill=255)   # картина (до вывески)
    d.rectangle([0, 262, 243 - PX0, 378], fill=255)  # листья
    d.rectangle([0, 372, 229 - PX0, 492], fill=255)  # кашпо (до столбика ограждения)
    m = m.filter(ImageFilter.GaussianBlur(2.5))
    p = p.convert('RGBA'); p.putalpha(m); return p
base = Image.open(os.path.join(R, 'assets', 'club_lobby.jpg')).convert('RGB')
for key in ('club_lobby', 'club_lobby_z'):
    lb = Image.open(os.path.join(R, 'assets', key + '.jpg')).convert('RGB')
    out = Image.new('RGBA', (OFF + PX1, 720), (0, 0, 0, 0))
    out.alpha_composite(patch(base), (OFF + PX0, 0))   # обои берём из обычного лобби: в зомби-версии там граффити
    out.alpha_composite(wall(), (0, 0))
    name = 'club_sidewall' + ('_z' if key.endswith('_z') else '') + '.png'
    out.save(os.path.join(R, 'assets', name)); print(name, out.size)
    prev = Image.new('RGB', (OFF + 600, 720)); prev.paste(lb, (OFF, 0)); prev.paste(out, (0, 0), out); prev.resize(((OFF + 600) // 2 * 2, 720)).save(os.path.join(R, 'art_src/l4wall/_prev_' + key + '.jpg'), quality=88)
