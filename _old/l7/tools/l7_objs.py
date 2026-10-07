# нарезка листа предметов по найденным объектам: печатает порядок и делает превью с номерами
import sys, os
import numpy as np
from PIL import Image, ImageDraw
exec(open('tools/build_assets.py', encoding='utf-8').read().split('\nS = {}')[0])
from scipy import ndimage
def objs(fn, minpx=1500, dil=5):
    im = Image.open(fn).convert('RGB'); a = np.array(key_green(im)); al = a[..., 3] > 0
    lab, k = ndimage.label(ndimage.binary_dilation(al, iterations=dil))
    sz = ndimage.sum(al, lab, range(1, k + 1)); sls = ndimage.find_objects(lab)
    items = [(i + 1, sls[i]) for i in range(k) if sz[i] >= minpx]
    rows = []
    for it in sorted(items, key=lambda t: (t[1][0].start + t[1][0].stop) / 2):
        cy = (it[1][0].start + it[1][0].stop) / 2
        if rows and abs(rows[-1][0] - cy) < im.height * 0.12: rows[-1][1].append(it)
        else: rows.append([cy, [it]])
    out = []
    for _, r in rows:
        for i, sl in sorted(r, key=lambda t: t[1][1].start):
            sub = a[sl].copy(); sub[..., 3] = np.where(lab[sl] == i, sub[..., 3], 0); out.append((sl, sub))
    return im, out
if __name__ == '__main__':
    im, out = objs(sys.argv[1]); d = ImageDraw.Draw(im)
    for n, (sl, _) in enumerate(out): d.rectangle([sl[1].start, sl[0].start, sl[1].stop, sl[0].stop], outline=(255, 0, 0), width=3); d.text((sl[1].start + 4, sl[0].start + 4), str(n), fill=(255, 0, 0))
    im.resize((im.width // 2, im.height // 2)).save('art_src/l7/_prev.png'); print(len(out))
