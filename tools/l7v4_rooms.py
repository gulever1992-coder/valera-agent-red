# «Цех сортировки» v4 (карта D): здание в разрезе, 4 этажа по 4 комнаты (референс — Terminator 2D: No Fate). Вся графика из Flow.
# Комнаты — пустые «коробки» (стены, пол, окна), всё остальное — отдельные спрайты: мебель (задний/передний план), двери по кадрам, лестница + ближние перила.
#   art_src/l7/v4_shN_*.jpg   — этаж N: кадр 1376x768 = две полосы по две комнаты (по схеме tools/l7v4_floorref.py) -> assets/l7v4/flN.png (2724x384)
#   art_src/l7/v4_pa/pb/pc_1.jpg — листы мебели (пурпур) -> assets/l7v4/pr/<имя>.png;  v4_pdoor_*.jpg — дверь и шкаф по 3 кадра
#   art_src/l7/v4_stair_1.jpg — лестница; v4_rail_*.jpg — она же, только перила (маска) -> stair.png, stair_rail.png
# Масштаб: комнаты 2.5624 px = 1 лог. px; спрайты сохраняются 2 px = 1 лог. px; размеры спрайтов (лог. px) -> js/l7v4_props.js
import os, sys, json
import numpy as np
from PIL import Image
from l7v4_stairs import key, SRC, OUT

SHELLS = {1: 'v4_sh1_0.jpg', 2: 'v4_sh2_1.jpg', 3: 'v4_sh3_0.jpg', 4: 'v4_sh4_0.jpg'}
PR = os.path.join(OUT, 'pr'); os.makedirs(PR, exist_ok=True)
SIZES = {}


def shell(n, fn):
    im = Image.open(os.path.join(SRC, fn)).convert('RGB')
    out = Image.new('RGB', (1342 + 40 + 1342, 384))
    out.paste(im.crop((0, 0, 1342, 384)), (0, 0)); out.paste(im.crop((34, 384, 1376, 768)), (1382, 0))
    out.paste(im.crop((669, 0, 709, 384)), (1342, 0))   # стена с проёмом на стыке половин — копия средней стены
    a = np.array(out).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]; m = np.minimum(r, b) - g
    spill = (m > 14) & (m < 70)   # розовый отсвет от пурпурных окон -> холодный лунный
    a[..., 0] = np.where(spill, g * 0.85, r); a[..., 2] = np.where(spill, np.minimum(255, g * 1.15 + 14), b)
    k = key(Image.fromarray(a.astype(np.uint8))); k[..., 3] = np.where(k[..., 3] > 128, 255, 0)
    Image.fromarray(k, 'RGBA').save(os.path.join(OUT, 'fl%d.png' % n), optimize=True); print('fl%d.png' % n)


def cut(sheet, items, soft=False):
    a = key(Image.open(os.path.join(SRC, sheet)), soft=soft)
    for name, (x0, y0, x1, y1), h in items:
        p = a[y0:y1, x0:x1]; ys, xs = np.where(p[..., 3] > 40); p = p[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        k = h * 2 / p.shape[0]; im = Image.fromarray(np.ascontiguousarray(p), 'RGBA').resize((max(1, round(p.shape[1] * k)), h * 2), Image.LANCZOS)
        im.save(os.path.join(PR, name + '.png'), optimize=True); SIZES[name] = [round(im.width / 2, 1), h]


def stairs(rail=None):
    # ближние перила — маска по геометрии: всё, что выше поверхности ступеней (до 122 px), это перила (Flow отдельную маску не осилил)
    box = (177, 20, 1030, 760); k = 150 / 622 * 2   # подъём 622 px картинки = шаг этажей 150 лог. px
    a = key(Image.open(os.path.join(SRC, 'v4_stair_1.jpg')))
    H, W = a.shape[:2]; yy, xx = np.mgrid[0:H, 0:W]
    low = np.where(xx >= 742, 448.0, 750 - 37.75 * np.clip((xx - 420) // 46 + 1, 0, 7)); low = np.where(xx < 420, 9999.0, low)
    up = np.where(xx <= 446, 128.0, 448 - 35.6 * np.clip((814 - xx) // 46 + 1, 0, 8)); up = np.where(xx > 814, 9999.0, up)
    lum = a[..., :3].astype(int).sum(2) / 3
    m = np.zeros((H, W), bool)
    for surf in (low, up): m |= (yy < surf - 3) & (yy > surf - 122)
    m &= ~((yy > up - 3) & (yy < up + 90) & (lum > 92))        # бетон верхнего марша, попавший в зону перил нижнего
    m &= lum < 104                                               # светлое (бетон, жёлтая кромка ступеней) — не перила
    r = a.copy(); r[..., 3] = np.where(m, a[..., 3], 0)
    for arr, name in ((a, 'stair'), (r, 'stair_rail')):
        im = Image.fromarray(np.ascontiguousarray(arr[box[1]:box[3], box[0]:box[2]]), 'RGBA'); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        im.save(os.path.join(PR, name + '.png'), optimize=True); SIZES[name] = [im.width / 2, im.height / 2]


if __name__ == '__main__':
    for n, fn in SHELLS.items(): shell(n, fn)
    cut('v4_pa_1.jpg', [('bench', (14, 23, 454, 230), 34), ('vending', (481, 11, 692, 316), 80), ('counter', (713, 20, 1047, 313), 66), ('folders', (1069, 15, 1352, 313), 80),
        ('gurney', (14, 246, 450, 482), 46), ('tank', (479, 323, 751, 754), 96), ('barrel', (766, 343, 894, 546), 44), ('barrel2', (902, 346, 1029, 549), 44), ('crates', (1066, 321, 1352, 568), 54),
        ('trolley', (32, 521, 301, 763), 48), ('coatrack', (327, 484, 458, 763), 76), ('bin', (774, 590, 909, 763), 32), ('exting', (935, 570, 1028, 763), 36)])
    cut('v4_pb_1.jpg', [('lockers4', (33, 14, 439, 281), 80), ('lockers2', (596, 17, 820, 194), 56), ('bench2', (972, 22, 1342, 205), 36), ('lockers3', (34, 287, 380, 519), 78),
        ('shower', (510, 229, 780, 530), 92), ('sacks', (819, 232, 1067, 537), 88), ('coats', (1094, 243, 1342, 540), 88), ('crates2', (1180, 630, 1350, 764), 46),
        ('table', (37, 521, 340, 765), 52), ('suitcases', (385, 567, 689, 760), 40), ('cart', (731, 564, 984, 763), 44), ('mop', (1025, 540, 1152, 764), 46)])
    cut('v4_pc_1.jpg', [('desk', (22, 55, 359, 323), 62), ('chair', (361, 94, 509, 330), 48), ('rack', (530, 33, 691, 322), 84), ('rack2', (712, 33, 942, 330), 86), ('reel', (953, 149, 1149, 330), 44),
        ('toolcart', (1141, 120, 1348, 328), 46), ('spectank', (28, 380, 207, 731), 86), ('ventunit', (217, 436, 509, 731), 66), ('duct', (510, 363, 709, 737), 84), ('drums', (723, 542, 967, 726), 44),
        ('elcab', (980, 398, 1139, 727), 78), ('ladder', (1149, 433, 1351, 734), 72)])
    # дверь: 3 кадра, выравнивание по левому верхнему углу коробки; шкаф: 3 кадра, по центру
    cut('v4_pdoor_1.jpg', [('door0', (225, 5, 461, 353), 92), ('door1', (553, 5, 775, 382), 100), ('door2', (870, 5, 1210, 376), 98)])
    cut('v4_pdoor_0.jpg', [('cab0', (60, 390, 320, 768), 86), ('cab1', (455, 390, 712, 768), 86), ('cab2', (828, 390, 1229, 768), 86)])
    stairs()
    with open(os.path.join(OUT, '..', '..', 'js', 'l7v4_props.js'), 'w', encoding='utf-8') as f:
        f.write('// размеры спрайтов цеха (лог. px), создаётся tools/l7v4_rooms.py\nwindow.V4_PROPS = ' + json.dumps(SIZES, separators=(',', ':')) + ';\n')
    print(len(SIZES), 'спрайтов')
