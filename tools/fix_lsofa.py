# Диван lsofa (lprops кадр 4): перевырезка без «дыры» в фиолетовой подушке — фон = только пурпур, связанный с краем.
import json, os, numpy as np
from PIL import Image
from scipy import ndimage
R = os.path.join(os.path.dirname(__file__), '..')
a = np.array(Image.open(os.path.join(R, 'art_src/lprops.png')).convert('RGB')).astype(np.float32)[380:660, 990:1450]
r, g, b = a[..., 0], a[..., 1], a[..., 2]
mag = (np.sqrt((r - 255) ** 2 + g ** 2 + (b - 255) ** 2) < 150)
lab, _ = ndimage.label(mag); edge = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
bg = np.isin(lab, list(edge))
# кайма: пиксели у фона с пурпурным оттенком — снять
rim = ndimage.binary_dilation(bg, iterations=2) & ~bg & (np.minimum(r, b) - g > 60)
al = ~(bg | rim)
ys, xs = np.where(al); a2 = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; m2 = al[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
s = open(os.path.join(R, 'js/sprites_data.js'), encoding='utf-8').read(); i = s.index('{'); S, _ = json.JSONDecoder().raw_decode(s[i:])
x, y, w, h = S['lprops']['f'][4][:4]
pm = np.dstack([a2 * m2[..., None], m2 * 255.0]).astype(np.float32)
nw = round(h * a2.shape[1] / a2.shape[0]); ch = [np.array(Image.fromarray(pm[..., c]).resize((nw, h), Image.LANCZOS)) for c in range(4)]
A = np.clip(ch[3], 0, 255); rgb = [np.clip(c * 255 / np.maximum(A, 1), 0, 255) for c in ch[:3]]
A = np.where(A > 110, 255, 0)
fr = Image.fromarray(np.dstack(rgb + [A]).astype(np.uint8), 'RGBA')
at = Image.open(os.path.join(R, 'assets/spr/lprops.png')).convert('RGBA')
at.paste(Image.new('RGBA', (w, h), (0, 0, 0, 0)), (x, y)); at.paste(fr, (x + (w - nw) // 2, y))
at.save(os.path.join(R, 'assets/spr/lprops.png')); print('lsofa', w, h, 'src', a2.shape)
