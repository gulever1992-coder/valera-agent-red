# Обложка ур.10 (728x600 -> показывается 182x150): гроза bg1f + Семён (sem1 roar, отражён) + Валера на крыше (vRun9_plasma)
import json, re, os
from PIL import Image, ImageEnhance
R = os.path.join(os.path.dirname(__file__), '..', '..'); os.chdir(R)
D = json.loads(re.search(r'window.L10D = (.*);', open('js/l10_data.js', encoding='utf-8').read()).group(1))
D9 = json.loads(re.search(r'window.L9D = (.*);', open('js/l9_data.js', encoding='utf-8').read()).group(1))
def fr(d, sh, name, path):
    f = d[sh]['f'][d[sh]['n'].index(name)]; return Image.open(path).convert('RGBA').crop((f[0], f[1], f[0] + f[2], f[1] + f[3]))
bg = Image.open('assets/l10/bg1f.jpg').convert('RGB'); h = bg.height; w = int(h * 728 / 600)
c = bg.crop((200, 0, 200 + w, h)).resize((728, 600)).convert('RGBA')
b = fr(D, 'sem1', 'roar', 'assets/l10/sem1.png').transpose(Image.FLIP_LEFT_RIGHT); k = 760 / b.height; b = b.resize((int(b.width * k), 760))
c.alpha_composite(b, (728 - b.width + 120, 40))
r = fr(D, 'roof10', 'r0', 'assets/l10/roof10.png'); k = 420 / r.width; r = r.resize((420, int(r.height * k)))
for y in range(430, 600, r.height): c.alpha_composite(r, (-40, y))
v = fr(D9, 'vRun9_plasma', 'r2', 'assets/l9/vRun9_plasma.png'); k = 190 / v.height; v = v.resize((int(v.width * k), 190))
c.alpha_composite(v, (120, 440 - 190 + 6))
ImageEnhance.Contrast(c.convert('RGB')).enhance(1.08).save('assets/covers/cov10.jpg', quality=88); print('cov10 ok')
