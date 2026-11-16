# ОТКЛЮЧЕНО 2026-11-15: владелец вернул «СЛАВА КОРАБЛЕДЕЛАМ!» на всех баннерах (assets = art_src/l1_banner_old).
# Ур.1: «СЛАВА КОРАБЛЕДЕЛАМ!» -> «СЛАВА КОРАБЕЛАМ!»: вырезаем буквы «ЛЕД», текст центрируем
# растяжкой полей баннера. Исходники — art_src/l1_banner_old.
import os
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def fix(name, y0, y1, xl, ml, cut0, cut1, mr, xr):
    im = Image.open(os.path.join(ROOT, 'art_src/l1_banner_old', name)).convert('RGB')
    cut = cut1 - cut0; hl = cut // 2; hr = cut - hl
    def C(a, b): return im.crop((a, y0, b, y1))
    parts = [C(ml[0], ml[1]).resize((ml[1] - ml[0] + hl, y1 - y0), Image.LANCZOS), C(ml[1], cut0), C(cut1, mr[0]),
             C(mr[0], mr[1]).resize((mr[1] - mr[0] + hr, y1 - y0), Image.LANCZOS)]
    x = ml[0]
    for p in parts: im.paste(p, (x, y0)); x += p.width
    assert x == mr[1], (x, mr[1])
    im.save(os.path.join(ROOT, 'assets', name), quality=92); print(name, 'ok')
# fix('bg_hall.jpg', 271, 319, 735, (737, 749), 928, 982, (1064, 1074), 1076)
# fix('bg_climb_bottom.jpg', 1106, 1160, 465, (470, 494), 599, 671, (776, 791), 795)
# Ур.2, здание цеха: «КОРАБЛЕ-/ДЕЛАМ!» -> «КОРАБЕ-/ЛАМ!»
# im = Image.open(os.path.join(ROOT, 'art_src/l1_banner_old/workshop.png')).convert('RGBA')
# y0, y1 = 500, 537                                      # строка 2: вырезаем «Л», хвост дополняем чистой стеной
# row = im.crop((305, y0, 380, y1)); tail = im.crop((326, y0, 380, y1)); im.paste(tail, (305, y0)); im.paste(im.crop((352, y0, 373, y1)), (305 + 54, y0))
# patch = im.crop((355, 501, 394, 536))                  # строка 3: «ДЕ» закрашиваем чистой стеной
# im.paste(patch, (289, 538)); im.paste(im.crop((355, 501, 394, 508)), (289, 572)); im.save(os.path.join(ROOT, 'assets/b/workshop.png'), optimize=True); print('workshop ok')
