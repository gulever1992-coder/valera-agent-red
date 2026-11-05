# Превью кадров листов: py sprsheet.py out.jpg name1 name2 ...
import sys, json, re, os
from PIL import Image, ImageDraw
t = open('js/sprites_data.js', encoding='utf-8').read(); t = t[t.index('window.SPRITES =') + 16:]
S = json.JSONDecoder().raw_decode(t.strip())[0]
for js, var, d in (('js/l8_data.js', 'window.L8D =', 'assets/l8/'), ('js/l9_data.js', 'window.L9D =', 'assets/l9/')):
    t = open(js, encoding='utf-8').read(); t = t[t.index(var) + len(var):]
    for k, v in json.JSONDecoder().raw_decode(t.strip())[0].items():
        if isinstance(v, dict) and 'f' in v and k not in S: v['img'] = next((d + k + e for e in ('.png', '.jpg') if os.path.exists(d + k + e)), d + k + '.png'); S[k] = v
rows = []
for n in sys.argv[2:]:
    if n not in S: print('нет', n); continue
    im = Image.open(S[n]['img']).convert('RGBA'); fr = S[n]['f'][:14]
    cells = []
    for f in fr:
        c = im.crop((f[0], f[1], f[0] + f[2], f[1] + f[3])); k = 110 / max(c.size); cells.append(c.resize((max(1, int(c.width * k)), max(1, int(c.height * k)))))
    rows.append((n, cells))
sh = Image.new('RGB', (14 * 120, 125 * len(rows)), (60, 60, 70)); d = ImageDraw.Draw(sh)
for r, (n, cells) in enumerate(rows):
    for i, c in enumerate(cells): sh.paste(c, (i * 120, r * 125 + 12), c)
    d.text((2, r * 125), n + ' ' + str(len(S[n]['f'])), fill='yellow')
sh.save(sys.argv[1], quality=80)
