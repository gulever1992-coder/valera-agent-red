# Снимает точки скелета (красные кружки) с разметки владельца
import sys, json, numpy as np
from PIL import Image
from scipy import ndimage as nd
im = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(int)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
red = (r > 110) & (g < 60) & (b < 70) & (r - g > 70)
dt = nd.distance_transform_edt(red)
core = dt >= 3.2
lab, n = nd.label(core)
out = []
for i in range(1, n + 1):
    ys, xs = np.nonzero(lab == i)
    w = dt[ys, xs]
    out.append([round(float((xs * w).sum() / w.sum()), 1), round(float((ys * w).sum() / w.sum()), 1), round(float(w.max()), 1)])
out.sort(key=lambda p: (p[0] > 790, p[1]))
print(json.dumps(out))
Image.fromarray((red * 255).astype('uint8')).save(sys.argv[2])
