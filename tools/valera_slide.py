# Слайд «в прицеле» в финале ур.7 (hslides, ячейка 5): лицо в круге -> портрет Валеры (p_valera6), прицел поверх сохраняется.
# Запуск: py tools/valera_slide.py (вызывается из l7v5_hall.py). Оригинал слайдов: art_src/mrx_old/assets__l7v4__hslides.jpg
import os, shutil
import numpy as np
from PIL import Image, ImageDraw
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
keep = os.path.join(R, 'art_src', 'mrx_old', 'assets__l7v4__hslides.jpg'); os.makedirs(os.path.dirname(keep), exist_ok=True)
if not os.path.exists(keep): shutil.copy(os.path.join(R, 'assets/l7v4/hslides.jpg'), keep)
s = Image.open(keep).convert('RGB'); X0, Y0 = 896, 252; cell = s.crop((X0, Y0, X0 + 448, Y0 + 252))
a = np.asarray(cell).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
CX, CY, RAD = 220, 130, 101
yy, xx = np.mgrid[0:252, 0:448]; dd = np.hypot(xx - CX, yy - CY)
cross = (r > 140) & (r > g * 1.9) & (r > b * 1.9) & ((((np.abs(xx - CX) < 4) | (np.abs(yy - CY) < 4)) & (dd > RAD * 0.62)) | (np.abs(dd - RAD - 4) < 7))     # красный прицел (линии и кольцо) — вернуть поверх лица
v = Image.open(os.path.join(R, 'assets/spr/p_valera6.png')).convert('RGB').resize((RAD * 2 + 30, RAD * 2 + 30), Image.LANCZOS)
m = Image.new('L', v.size, 0); ImageDraw.Draw(m).ellipse((15, 15, 15 + RAD * 2, 15 + RAD * 2), fill=255)
cell.paste(v, (CX - RAD - 15, CY - RAD - 15), m)
o = np.asarray(cell).copy(); o[cross] = a[cross]; cell = Image.fromarray(o.astype(np.uint8))
s.paste(cell, (X0, Y0)); s.save(os.path.join(R, 'assets/l7v4/hslides.jpg'), quality=92)
cell.save(os.path.join(R, 'art_src', 'l9', '_vslide.jpg'))
