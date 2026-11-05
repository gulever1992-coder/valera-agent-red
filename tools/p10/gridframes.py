# Кадры листа с сеткой нормированных координат (0..1, шаг 0.1): py tools/p10/gridframes.py sheet out.jpg
import sys, os, re, json
from PIL import Image, ImageDraw
sh, out = sys.argv[1], sys.argv[2]
R = os.path.join(os.path.dirname(__file__), '..', '..')
D = json.loads(re.search(r'window.L10D = (.*);', open(os.path.join(R, 'js', 'l10_data.js'), encoding='utf-8').read()).group(1))[sh]
im = Image.open(os.path.join(R, 'assets', 'l10', sh + '.png')).convert('RGBA')
th = 520; cells = []
for i, f in enumerate(D['f']):
    fr = im.crop((f[0], f[1], f[0] + f[2], f[1] + f[3])); k = th / fr.height; fr = fr.resize((int(fr.width * k), th))
    c = Image.new('RGBA', fr.size, (40, 60, 70, 255)); c.alpha_composite(fr); d = ImageDraw.Draw(c)
    for j in range(1, 10):
        x = int(c.width * j / 10); y = int(c.height * j / 10)
        d.line((x, 0, x, c.height), fill=(255, 255, 0, 120)); d.line((0, y, c.width, y), fill=(255, 80, 80, 120))
        d.text((x + 2, 2), str(j), fill=(255, 255, 0)); d.text((2, y + 2), str(j), fill=(255, 120, 120))
    d.text((4, c.height - 14), D['n'][i], fill=(255, 255, 255)); cells.append(c)
W = sum(c.width for c in cells[:5]) + 20; rows = [cells[i:i + 5] for i in range(0, len(cells), 5)]
o = Image.new('RGB', (max(sum(c.width + 4 for c in r) for r in rows), (th + 4) * len(rows)), (0, 0, 0))
y = 0
for r in rows:
    x = 0
    for c in r: o.paste(c.convert('RGB'), (x, y)); x += c.width + 4
    y += th + 4
o.save(out, quality=85)
