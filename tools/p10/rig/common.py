# Общее для сборки рига Семёна: канон — пространство side_flow.png (1102x1470), фигура смотрит вправо
import numpy as np
from PIL import Image
SRC = 'art_src/l10/'
ALIGN = {'rig_noarm1': (1.2229, 4, 2), 'rig_oneleg1': (1.2209, 4, 2), 'rig_mouth1': (1.2239, 3, 1)}
CW, CH = 1102, 1470
def t0(x, y): return (2 * x - 864, 2 * y - 36)
def U(x, y): return t0(1.164 * x - 463, 1.164 * y - 3)        # разметка владельца -> канон
def load(name):
    """картинка в каноне (RGB float)"""
    if name == 'side': return np.asarray(Image.open(SRC + 'rig/side_flow.png').convert('RGB')).astype(float)
    s, dx, dy = ALIGN[name]; im = Image.open(SRC + name + '.png').convert('RGB')
    # side = s*img + d  ->  img = (side - d)/s
    out = im.transform((CW, CH), Image.AFFINE, (1 / s, 0, -dx / s, 0, 1 / s, -dy / s), resample=Image.BICUBIC, fillcolor=(255, 255, 255))
    return np.asarray(out).astype(float)
# кости (разметка владельца, вид сбоку) в каноне
B = {k: U(*v) for k, v in {
    'imp2': (1057, 163), 'imp1': (1048, 184), 'head': (1007.4, 191.5), 'sh': (968, 237.3), 'el': (1036.2, 259.7), 'wr': (1113.4, 252.5),
    'f1': (1175.5, 236), 'f2': (1171.8, 252.3), 'f3': (1160.9, 273.1), 'hip': (966.7, 387.9), 'hr': (1053.5, 381.2),
    'kn': (1007.9, 476.2), 'hk': (934, 518.5), 'ft': (968.5, 586.7)}.items()}
