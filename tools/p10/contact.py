# Контакт-лист картинок art_src/l10: py tools/p10/contact.py out.jpg a b c ... (имена без .png)
import sys, os
from PIL import Image, ImageDraw
out, names = sys.argv[1], sys.argv[2:]
S = os.path.join(os.path.dirname(__file__), '..', '..', 'art_src', 'l10')
tw, th = 560, 313; cols = 3; rows = (len(names) + cols - 1) // cols
c = Image.new('RGB', (tw * cols, (th + 18) * rows), (30, 30, 30)); d = ImageDraw.Draw(c)
for i, n in enumerate(names):
    im = Image.open(os.path.join(S, n + '.png')).convert('RGB'); im.thumbnail((tw, th))
    x, y = (i % cols) * tw, (i // cols) * (th + 18); c.paste(im, (x, y + 18)); d.text((x + 4, y + 3), n, fill=(255, 255, 0))
c.save(out, quality=85)
