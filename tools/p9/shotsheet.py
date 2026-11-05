# Контактный лист снимков: py shotsheet.py prefix out.jpg
import sys, glob, os
from PIL import Image, ImageDraw
fs = sorted(glob.glob('art_src/covers/shots/' + sys.argv[1] + '*.png'))
W, H = 400, 225; cols = 3; rows = (len(fs) + cols - 1) // cols
sh = Image.new('RGB', (W * cols, H * rows)); d = ImageDraw.Draw(sh)
for i, f in enumerate(fs):
    im = Image.open(f).convert('RGB').resize((W, H)); x, y = i % cols * W, i // cols * H
    sh.paste(im, (x, y)); d.text((x + 4, y + 4), os.path.basename(f), fill='yellow')
sh.save(sys.argv[2], quality=80)
