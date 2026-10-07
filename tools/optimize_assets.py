# Сжимает картинки assets/ в WebP (q92, альфа без потерь) рядом с оригиналом и пишет список js/webp_list.js.
# Игра (G.loadImage) берёт .webp, если файл в списке, иначе — оригинал. Запускать после любой сборки ассетов.
import os, json
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ok, saved = [], 0
for dp, _, fs in os.walk(os.path.join(ROOT, 'assets')):
    for f in fs:
        if not f.lower().endswith(('.png', '.jpg', '.jpeg')): continue
        src = os.path.join(dp, f); rel = os.path.relpath(src, ROOT).replace(os.sep, '/')
        if os.path.getsize(src) < 30000: continue
        dst = os.path.splitext(src)[0] + '.webp'
        if not (os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src)):
            im = Image.open(src); im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')
            im.save(dst, 'WEBP', quality=92, method=4, alpha_quality=100)
        if os.path.getsize(dst) < os.path.getsize(src) * 0.9:
            ok.append(rel); saved += os.path.getsize(src) - os.path.getsize(dst)
        else: os.remove(dst)
with open(os.path.join(ROOT, 'js', 'webp_list.js'), 'w', encoding='utf-8') as fp:
    fp.write('// автоматически создано tools/optimize_assets.py\nwindow.WEBP_OK = new Set(' + json.dumps(sorted(ok)) + ');\n')
print('webp:', len(ok), 'файлов, экономия', round(saved / 1e6, 1), 'МБ')
