# Чистка розовой каймы (остатки маджента-фона) по краям готовых PNG ур.6.
# Запускать после build_l6.py и build_vande_fix.py, перед optimize_assets.py.
import glob, numpy as np
from PIL import Image
from scipy import ndimage as nd
SHEETS = 'v6_run v6_jump v6_fight yeti amanita beaver crow mowgli nettle items6 deco6 plat6 v6_wand v6_eat b_loco b_evade b_py b_taunt b_hurt amanita2 beaver2 crow2 mowgli2 nettle2 gibs6 viper yeti3 yeti4 tree6 v6_tap vandewalk vande2'.split()
files = [f'assets/spr/{n}.png' for n in SHEETS] + glob.glob('assets/l6/*.png')
for p in files:
    try: im = Image.open(p)
    except FileNotFoundError: continue
    if im.mode != 'RGBA': continue
    a = np.array(im).astype(int); r, g, b, al = (a[..., i] for i in range(4))
    tot = 0
    for _ in range(3):  # снимаем розовое с края слоями по 1 px
        tr = al < 16
        band = nd.binary_dilation(tr, iterations=1) & ~tr
        pink = band & (r > g + 40) & (b > g + 40) & (abs(r - b) < 110)
        al[pink] = 0; tot += pink.sum()
    tr = al < 16
    band = nd.binary_dilation(tr, iterations=3) & ~tr
    tint = band & (r > g + 15) & (b > g + 15)
    m = np.minimum(np.minimum(r, b), g + 12)
    r[tint] = np.minimum(r, m)[tint]; b[tint] = np.minimum(b, m)[tint]
    soft = band & (al < 200) & (r > g + 10) & (b > g + 10); al[soft] = al[soft] // 2  # полупрозрачная кромка
    if tot or tint.sum():
        Image.fromarray(np.dstack([r, g, b, al]).astype(np.uint8), 'RGBA').save(p)
        print(f'{p:32s} removed={tot} despill={tint.sum()}')
