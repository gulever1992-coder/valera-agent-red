# Катсцена mid (джетпак сбит -> плот -> подлодка): фоны и кадры из листов Flow на пурпурном фоне.
# py tools/p10/build_mid.py  ->  assets/l10/mid/*.jpg|png, печатает размеры кадров для js
import numpy as np, json
from PIL import Image
from scipy import ndimage
SRC, OUT = 'art_src/l10/mid/src/', 'assets/l10/mid/'
PLATES = ['sky', 'eyes', 'sea', 'sea2', 'sub', 'subp', 'subs', 'scope', 'scope2']
SHEETS = {'vjet': 4, 'vraft': 6, 'crew': 4}
info = {}
for n in PLATES:
    im = Image.open(SRC + n + '.jpg').convert('RGB'); w, h = im.size; th = round(w * 9 / 16)
    if th < h: im = im.crop((0, (h - th) // 2, w, (h - th) // 2 + th))
    im.resize((1280, 720), Image.LANCZOS).save(OUT + n + '.jpg', quality=88)
def key(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.minimum(r, b) - g                      # «пурпурность»
    al = np.clip(1 - (m - 70) / 90, 0, 1)
    al[(r > 170) & (b > 170) & (g < 110)] = 0
    sp = np.clip((m - 20) / 120, 0, 1) * (al > 0)   # убрать пурпурный ореол по краю
    mx = np.maximum(g, np.minimum(r, b) - m * sp)
    a[..., 0] = np.where(sp > 0, np.minimum(r, mx + 10), r); a[..., 2] = np.where(sp > 0, np.minimum(b, mx + 10), b)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]; bl = (b > g + 25) & (b > r + 25); a[..., 0] = np.where(bl, g * 0.45, r); a[..., 1] = np.where(bl, (g + b) / 2, g); a[..., 2] = np.where(bl, g * 1.02 + 8, b)     # сине-сиреневая вода -> бирюза моря
    r, g, b = a[..., 0], a[..., 1], a[..., 2]; pu = (r > g + 4) & (b > g + 4)     # фиолетовый отлив воды/бликов от пурпурного фона -> голубой
    a[..., 0] = np.where(pu, np.minimum(r, g * 0.85), r); a[..., 2] = np.where(pu, np.minimum(b, g * 1.25 + 12), b)     # и синеву приглушить до цвета моря
    return np.dstack([a, al * 255]).astype(np.uint8)
# рамки кадров в координатах листа, ужатого до ширины 900 (лист -> кадры по порядку анимации)
BOX = {'vjet': [[0, 0, 222, 470], [222, 0, 460, 470], [455, 0, 648, 470], [645, 0, 900, 470]],
       'vraft': [[0, 0, 190, 245], [190, 0, 440, 245], [180, 245, 440, 495], [440, 0, 655, 245], [655, 0, 900, 245], [440, 245, 720, 495]],
       'crew': [[0, 0, 250, 510], [250, 0, 460, 510], [460, 0, 650, 510], [650, 0, 900, 510]],
       'vraft2': [[0, 0, 450, 253], [450, 0, 900, 253], [0, 253, 450, 506], [450, 253, 900, 506]],     # рваный плот (владелец), Валера моложе
       'crew2': [[0, 0, 255, 510], [255, 0, 455, 510], [455, 0, 650, 510], [650, 0, 900, 510]]}
for n, boxes in BOX.items():
    rgba = key(Image.open(SRC + n + '.jpg')); k = rgba.shape[1] / 900; info[n] = []
    for i, b in enumerate(boxes):
        x0, y0, x1, y1 = [round(v * k) for v in b]; piece = rgba[y0:y1, x0:x1].copy()
        al = piece[..., 3] > 40; lab, nl = ndimage.label(al)
        if nl: sz = ndimage.sum(al, lab, range(1, nl + 1)); piece[..., 3] = piece[..., 3] * np.isin(lab, [q + 1 for q in range(nl) if sz[q] > 80])
        ys, xs = np.nonzero(piece[..., 3] > 20); piece = piece[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        Image.fromarray(piece).save(OUT + f'{n}{i}.png'); info[n].append([piece.shape[1], piece.shape[0]])
print(json.dumps(info))
# vjet1: стереть нарисованный Flow луч слева сверху (в катсцене луч рисуется кодом справа — от Семёна)
im = Image.open(OUT + 'vjet1.png'); a = np.asarray(im).copy(); h, w = a.shape[:2]
r, g, b = [a[..., i].astype(int) for i in range(3)]
zone = np.zeros((h, w), bool); zone[:int(h * 0.2), :int(w * 0.5)] = True
beamish = (r > 200) & (g > 120) & ((r - b) > 20) | (r > 230) & (g > 200) & (b > 180)
a[..., 3] = np.where(zone & beamish, 0, a[..., 3])
ys, xs = np.nonzero(a[..., 3] > 20); a[..., 3][:, :max(0, xs.min())] = 0
Image.fromarray(a).save(OUT + 'vjet1.png')
# vjet0: стереть хвост чужого луча справа у головы (владелец: «лишний лазер у головы»)
im = Image.open(OUT + 'vjet0.png'); a = np.asarray(im).copy(); h, w = a.shape[:2]
r, g, b = [a[..., i].astype(int) for i in range(3)]
zone = np.zeros((h, w), bool); zone[:int(h * 0.25), int(w * 0.6):] = True
beamish = ((r > 190) & ((r - b) > 25)) | ((r > 225) & (g > 190) & (b > 170))
lab, nl = ndimage.label(a[..., 3] > 20)
if nl > 1: sz = ndimage.sum(a[..., 3] > 20, lab, range(1, nl + 1)); a[..., 3] = a[..., 3] * np.isin(lab, [int(np.argmax(sz)) + 1])
Image.fromarray(a).save(OUT + 'vjet0.png')
# vjet2/vjet3: дым, обрезанный рамкой соседнего кадра (ровный край), — убрать тёмные серые куски у краёв (дым рисует код)
for n in ['vjet2', 'vjet3']:
    a = np.asarray(Image.open(OUT + n + '.png')).copy(); h, w = a.shape[:2]
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    smk = (a[..., 3] > 20) & (np.maximum(np.maximum(r, g), b) < 95) & ((np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)) < 30)
    lab, nl = ndimage.label(smk)
    for v in range(1, nl + 1):
        ys, xs = np.nonzero(lab == v)
        if xs.min() <= 1 or xs.max() >= w - 2: a[..., 3][lab == v] = 0
    Image.fromarray(a).save(OUT + n + '.png')
