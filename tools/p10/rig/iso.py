# Вырезает фигуру сбоку из _t0_src.jpg (связная область), белый фон -> art_src/l10/rig/side_iso.png (+ альфа) и side_flow.png (3:4 на белом для Flow)
import numpy as np, os
from PIL import Image
from scipy import ndimage as nd
os.makedirs('art_src/l10/rig', exist_ok=True)
im = Image.open('refs/l10/_t0_src.jpg').convert('RGB'); a = np.asarray(im).astype(int)
fg = (a.min(2) < 228) | ((a.max(2) - a.min(2)) > 22)
fg = nd.binary_opening(fg, iterations=1)
lab, n = nd.label(nd.binary_dilation(fg, iterations=1))
keep = lab == lab[420, 700]
keep = nd.binary_fill_holes(keep) & (nd.binary_dilation(fg, iterations=2))
ys, xs = np.nonzero(keep); print('bbox', xs.min(), ys.min(), xs.max(), ys.max())
# мягкая альфа: расстояние до белого
wd = np.clip((255 - a.min(2)) / 40, 0, 1)
al = (keep * np.maximum(wd, nd.binary_erosion(keep, iterations=2))).astype(float)
rgba = np.dstack([a, (al * 255)]).astype('uint8')
Image.fromarray(rgba).save('art_src/l10/rig/side_iso.png')
x0, y0, x1, y1 = xs.min() - 20, max(0, ys.min() - 20), xs.max() + 20, min(768, ys.max() + 20)
cr = Image.fromarray(rgba).crop((x0, y0, x1, y1)); print('crop', x0, y0, x1, y1)
W, H = cr.size; S = max(W / 3, H / 4) * 1.06; cw, ch = int(S * 3), int(S * 4)
bg = Image.new('RGB', (cw, ch), 'white'); bg.paste(cr, ((cw - W) // 2, (ch - H) // 2), cr)
bg = bg.resize((cw * 2, ch * 2), Image.LANCZOS); bg.save('art_src/l10/rig/side_flow.png'); print('flow', bg.size, 'paste at', (cw - W) // 2, (ch - H) // 2)
