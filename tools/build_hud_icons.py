# Значки оружия для HUD — из тех же спрайтов, что оружие в руках/подборы (не рисуем заново).
import sys
# Выход: assets/spr/hud_i_<id>.png, вписано в 60x44 (рамка HUD 30x22 в 2x), прозрачный фон.
import re, json, math
from PIL import Image
import numpy as np
OUT = 'assets/spr/hud_i_%s.png'
def sheet(datafile, key):
    s = open(datafile, encoding='utf-8').read()
    m = re.search(r'"%s":(\{"f":.*?"n":\[[^\]]*\]\})' % re.escape(key), s)
    return json.loads(m.group(1))
def frame(img, datafile, key, name):
    d = sheet(datafile, key); f = d['f'][d['n'].index(name)]
    return Image.open(img).convert('RGBA').crop((f[0], f[1], f[0] + f[2], f[1] + f[3]))
def sframe(key, i):   # js/sprites_data.js
    s = open('js/sprites_data.js', encoding='utf-8').read()
    m = re.search(r'"%s": \{"img": "([^"]+)", "f": (\[\[.*?\]\])\}' % key, s); f = json.loads(m.group(2))[i]
    return Image.open(m.group(1)).convert('RGBA').crop((f[0], f[1], f[0] + f[2], f[1] + f[3]))
def level(im, flip=False):   # повернуть длинной осью по горизонтали
    a = np.array(im)[:, :, 3] > 40; ys, xs = np.nonzero(a)
    xs = xs - xs.mean(); ys = ys - ys.mean(); cov = np.cov(np.vstack([xs, ys]))
    w, v = np.linalg.eigh(cov); vx, vy = v[:, 1]; ang = math.degrees(math.atan2(vy, vx))
    r = im.rotate(ang, resample=Image.BICUBIC, expand=True)
    return r.transpose(Image.FLIP_LEFT_RIGHT) if flip else r
def fit(im, W=60, H=44, pad=1):
    im = im.crop(im.getbbox()); k = min((W - 2 * pad) / im.width, (H - 2 * pad) / im.height)
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    out = Image.new('RGBA', (W, H)); out.alpha_composite(im, ((W - im.width) // 2, (H - im.height) // 2)); return out
def unmix(path):   # как tools/build_ui.py: альфа и чистый цвет из пурпурного фона
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    al = np.clip(1 - (np.minimum(r, b) - g) / 235.0, 0, 1); al[al < 0.06] = 0
    col = np.where(al[..., None] > 0, (a - (1 - al[..., None]) * np.array([255, 0, 255], np.float32)) / np.maximum(al[..., None], 1e-3), 0)
    rgba = np.dstack([np.clip(col, 0, 255), al * 255]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')
def save(id, im): fit(im).save(OUT % id); print(id, im.size)
L9 = 'js/l9_data.js'
P = lambda n: frame('assets/l9/pick9.png', L9, 'pick9', n)
if __name__ == '__main__':
    import sys
    # дулом вправо, рукоятью вниз — как Валера держит оружие
    for n in ['mini', 'plasma', 'rocket']: save(n, level(P(n)).rotate(180))
    pi = P('pist'); a = np.array(pi)     # один пистолет из пары: левый (дуло вверх-вправо), отрезаем правый по диагонали
    for y in range(a.shape[0]): a[y, int(57 - y * 0.16):, 3] = 0
    save('pist', Image.fromarray(a).rotate(-42, resample=Image.BICUBIC, expand=True))
    save('wand', level(sframe('items6', 2), flip=True))

# оружие, которое в арте есть только в руках: Flow отделил его от рук по образцам art_src/ui/wref/ref_*.jpg
# (Nano Banana Pro, пурпурный фон) -> art_src/ui/wref/flow_*.jpg; вырезка «размешиванием» пурпура
if __name__ == '__main__':
    for n, out in [('ak', 'rifle'), ('racket', 'racket'), ('o3000', 'o3000'), ('o3000g', 'o3000g')]:
        save(out, unmix('art_src/ui/wref/flow_%s.jpg' % n))
    # сердце «под мухомором» (ур.6): Flow по образцу hud_heart -> art_src/ui/heart_veins.jpg
    hv = unmix('art_src/ui/heart_veins.jpg'); a = np.array(hv); from scipy import ndimage
    lab, n = ndimage.label(a[..., 3] > 128); big = int(np.argmax(ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1)))) + 1     # только само сердце, без мусора по краям
    a[..., 3] = np.where(ndimage.binary_dilation(lab == big, iterations=3), a[..., 3], 0); ys, xs = np.where(a[..., 3] > 0)
    hv = Image.fromarray(a).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    hv.resize((round(hv.width * 66 / hv.height), 66), Image.LANCZOS).save('assets/spr/hud_heart_veins.png')
    # бак «О-3000» с водой (ур.4, подбор): Flow по образцу seedcan + бутыли на спине -> art_src/ui/seedcan_w.jpg, высота 64 как seedcan
    tw = unmix('art_src/ui/seedcan_w.jpg'); a = np.array(tw)
    lab, n = ndimage.label(a[..., 3] > 128); big = int(np.argmax(ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1)))) + 1
    m = ndimage.binary_fill_holes(lab == big); a[..., 3] = np.where(m, 255, np.where(ndimage.binary_dilation(m, iterations=2), a[..., 3], 0)); ys, xs = np.where(a[..., 3] > 0)
    tw = Image.fromarray(a).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)); tw.resize((round(tw.width * 64 / tw.height), 64), Image.LANCZOS).save('assets/spr/seedcan_w.png')
