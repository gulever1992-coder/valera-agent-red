# Ядерный финал (владелец 2026-11-08): фоны nk_capt/nk_back/nk_city/subs + кадры гриба nk_mush0..3 с пурпурного листа.
# py tools/p10/build_nuke.py
import numpy as np
from PIL import Image
from scipy import ndimage
src = open('tools/p10/build_mid.py', encoding='utf-8').read(); exec(src[src.index('def key'):src.index('# рамки кадров')])
SRC, OUT = 'art_src/l10/mid/src/', 'assets/l10/mid/'
for n in ['subs', 'nk_capt', 'nk_back', 'nk_city', 'nk_rage0', 'nk_rage1']:
    im = Image.open(SRC + n + '.jpg').convert('RGB'); w, h = im.size; th = round(w * 9 / 16)
    if th < h: im = im.crop((0, (h - th) // 2, w, (h - th) // 2 + th))
    im.resize((1280, 720), Image.LANCZOS).save(OUT + n + '.jpg', quality=88)
a = key(Image.open(SRC + 'nk_mush.jpg')); op = a[..., 3] > 40
W_ = op.shape[1]; B_ = [0, 0.26, 0.5, 0.729, 1.0]; runs = [[round(B_[k] * W_), round(B_[k + 1] * W_)] for k in range(4)]     # границы кадров на листе (кадры 3–4 почти касаются)
print('frames', runs)
for i, (x0, x1) in enumerate(runs):
    p = a[:, x0:x1].copy(); al = p[..., 3] > 40; lab, nl = ndimage.label(al)
    if nl: sz = ndimage.sum(al, lab, range(1, nl + 1)); p[..., 3] = p[..., 3] * np.isin(lab, [q + 1 for q in range(nl) if sz[q] > 60])
    ys, xx = np.nonzero(p[..., 3] > 20); p = p[ys.min():ys.max() + 1, xx.min():xx.max() + 1]
    Image.fromarray(p).save(OUT + f'nk_mush{i}.png'); print(i, p.shape[1], p.shape[0])
# мягкие края дыма: лист резан прямыми границами и внизу ровная линия — плавно гасим альфу к бокам и к низу
for i in range(4):
    im = np.asarray(Image.open(OUT + f'nk_mush{i}.png')).copy(); h, w = im.shape[:2]
    fx = np.minimum(np.clip(np.arange(w) / max(8, w * 0.14), 0, 1), np.clip((w - 1 - np.arange(w)) / max(8, w * 0.14), 0, 1)) ** 1.5
    fy = np.clip((h - 1 - np.arange(h)) / max(6, h * 0.09), 0, 1) ** 1.2
    m = np.minimum(fy[:, None], np.maximum(fx[None, :], (np.arange(h) < h * 0.55)[:, None]))     # бока гасим только в нижней части (шапку не трогаем)
    im[..., 3] = (im[..., 3] * m).astype(np.uint8); Image.fromarray(im).save(OUT + f'nk_mush{i}.png')
