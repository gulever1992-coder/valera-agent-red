# Спрайты пустыря: из листа Flow на пурпурном фоне вырезает отдельные предметы, собирает атлас assets/spr/l5waste.png и таблицу кадров.
import numpy as np, json, os
from PIL import Image
from scipy import ndimage
def _waste_main(ROOT):
    im = Image.open(os.path.join(ROOT, 'art_src', 'l5_waste_src.png')).convert('RGB'); a = np.array(im).astype(int); R, G, B = a[..., 0], a[..., 1], a[..., 2]
    cand = (R > 170) & (B > 170) & (G < 140) & (R - G > 70) & (B - G > 70)
    lab, n = ndimage.label(cand)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge)) | ((R > 230) & (B > 230) & (G < 60))
    purple = (np.abs(R - B) < 50) & (R - G > 40) & (B - G > 40)             # пурпурные тени и кайма (предметы коричневые: R заметно больше B)
    bg |= purple
    near = ndimage.binary_dilation(bg, iterations=1) & ~bg & (R - G > 30) & (B - G > 25)
    op = ~(bg | near)
    l, k = ndimage.label(ndimage.binary_dilation(op, iterations=6)); objs = ndimage.find_objects(l); ar = ndimage.sum(op, l, range(1, k + 1))
    items = []
    for i in range(k):
        if ar[i] < 3000: continue
        sl = objs[i]; m = (l[sl] == i + 1) & op[sl]
        p = Image.fromarray(np.dstack([a[sl].astype(np.uint8), np.where(m, 255, 0).astype(np.uint8)]), 'RGBA'); p = p.crop(p.getbbox())
        items.append((int(((sl[0].start + sl[0].stop) / 2) // 256) * 10000 + (sl[1].start + sl[1].stop) / 2, p))
    items.sort(key=lambda t: t[0]); frames = [p for _, p in items]
    tot = sum(f.width for f in frames) + 2 * len(frames); Hh = max(f.height for f in frames)
    at = Image.new('RGBA', (tot, Hh), (0, 0, 0, 0)); x = 0; rows = []
    for f in frames:
        at.paste(f, (x, 0)); rows.append([x, 0, f.width, f.height, f.width / 2, f.height, f.height / 2, 0]); x += f.width + 2
    os.makedirs(os.path.join(ROOT, 'assets', 'spr'), exist_ok=True)
    at.save(os.path.join(ROOT, 'assets', 'spr', 'l5waste.png'), optimize=True)
    json.dump(rows, open(os.path.join(ROOT, 'art_src', 'l5_waste_frames.json'), 'w'))
    print('waste', len(frames), at.size)



_root = globals().get('ROOT') or os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_waste_main(_root)
