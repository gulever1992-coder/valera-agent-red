# «Цех сортировки» (карта D, вертикальный подъём) — вся графика из Flow, нарисована с нуля по схеме tools/l7v4_hallref.py.
#   art_src/l7/v4_hall_1.jpg      — весь зал (768x1376)                                   -> assets/l7v4/hall.jpg
#   art_src/l7/v4_hallopen_0.jpg  — тот же зал: двери справа открыты, табло погашено, дверь на крышу открыта
#        -> hall_dr1.png (открытые двери справа + свет на полу), hall_dr2.png (открытая дверь на крышу); погашенное табло вклеено в hall.jpg
#   art_src/l7/v4_hallfg_0.jpg    — тот же зал, оставлены только конструкции (пурпур) — маска
#        -> hall_fg.png: перила мостиков и ферма шахты лифта — рисуются ПОВЕРХ персонажей
#   art_src/l7/v4_hallspr_0.jpg   — лист предметов (пурпур): платформа лифта, крюк с ящиком, коробка, сканер, лента, табло, цепь, камера, шкаф
#        -> hl_lift, hl_hook, hl_box, hl_scan, hl_belt, hl_sign, hl_chain, hl_cam, hl_locker (.png)
import os
import numpy as np
from PIL import Image, ImageFilter
from l7v4_stairs import key, tight, save, SRC, OUT

SURF = {'t3': 852, 't4': 640, 't5': 462, 't6': 340}   # y поверхностей мостиков на картинке
SPR = {'hl_lift': (10, 80, 470, 325), 'hl_hook': (485, 0, 760, 465), 'hl_box': (1155, 62, 1325, 205), 'hl_scan': (95, 405, 400, 700), 'hl_sign': (508, 505, 862, 712),
       'hl_chain': (915, 428, 955, 758), 'hl_cam': (1005, 500, 1160, 610), 'hl_locker': (1190, 430, 1350, 760)}


def build():
    bg = np.array(Image.open(os.path.join(SRC, 'v4_hall_1.jpg')).convert('RGB')); op = np.array(Image.open(os.path.join(SRC, 'v4_hallopen_0.jpg')).convert('RGB'))
    bg[1090:1160, 664:768] = op[1090:1160, 664:768]                      # погашенное табло (надпись — отдельным спрайтом hl_sign)
    Image.fromarray(bg).save(os.path.join(OUT, 'hall.jpg'), quality=92)
    def patch(x0, y0, x1, y1, name, feather=10):
        a = np.zeros((y1 - y0, x1 - x0), np.uint8); a[:] = 255
        al = Image.fromarray(a); m = Image.new('L', al.size, 0); m.paste(255, (feather, feather, al.width - (0 if x1 >= 768 else feather), al.height - (0 if y1 >= 1376 else feather)))
        m = m.filter(ImageFilter.GaussianBlur(feather / 2))
        Image.fromarray(np.dstack([op[y0:y1, x0:x1], np.array(m)]), 'RGBA').save(os.path.join(OUT, name), optimize=True); print(name, x0, y0, x1 - x0, y1 - y0)
    patch(500, 1150, 768, 1376, 'hall_dr1.png'); patch(55, 190, 185, 350, 'hall_dr2.png', 6)
    m = np.array(Image.open(os.path.join(SRC, 'v4_hallfg_0.jpg')).convert('RGB')).astype(int)
    mask = np.minimum(m[..., 0], m[..., 2]) - m[..., 1] < 34
    H, W = mask.shape; yy, xx = np.mgrid[0:H, 0:W]; keep = np.zeros_like(mask)
    keep |= (yy > SURF['t3'] - 50) & (yy < SURF['t3'] + 8) & (xx > 205) & (xx < 575)
    keep |= (yy > SURF['t4'] - 50) & (yy < SURF['t4'] + 8) & (xx > 165) & (xx < 575)
    keep |= (yy > SURF['t5'] - 52) & (yy < SURF['t5'] + 8) & (xx > 445)
    keep |= (yy > SURF['t6'] - 50) & (yy < SURF['t6'] + 8) & (xx > 30) & (xx < 356)
    keep &= ~((xx > 524) & (xx < 558) & (yy > 440) & (yy < 650))         # вертикальная лестница — позади Валеры
    keep |= (xx > 552) & (xx < 662) & (yy > 770) & (yy < 1312)           # ферма шахты лифта
    mask &= keep
    Image.fromarray(np.dstack([bg, (mask * 255).astype(np.uint8)]), 'RGBA').save(os.path.join(OUT, 'hall_fg.png'), optimize=True); print('hall_fg px', int(mask.sum()))
    sh = Image.open(os.path.join(SRC, 'v4_hallspr_0.jpg')); a = key(sh)
    for n, (x0, y0, x1, y1) in SPR.items():
        p, off = tight(a[y0:y1, x0:x1]); save(np.ascontiguousarray(p), n + '.png'); print('  at', x0 + off[0], y0 + off[1])
    sh.convert('RGB').crop((800, 320, 1350, 392)).save(os.path.join(OUT, 'hl_belt.png')); print('hl_belt.png')


if __name__ == '__main__':
    build()
