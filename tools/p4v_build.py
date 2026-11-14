# Ур.4, новый Валера: собирает атласы из art_src/l4v/frames и подменяет их в js/sprites_data.js
# (без полного build_assets.py). Масштаб — по ширине фуражки/арбуза (p4v_preview.scale).
import os, json, glob
import numpy as np
from PIL import Image
from scipy import ndimage
import sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import p4v_preview as PV
from p4v_hat import hat_w
ROOT = PV.ROOT; P = PV.P; SPR = os.path.join(ROOT, 'assets', 'spr')

def load(name, idx):
    return [Image.open(os.path.join(P, '%s_%02d.png' % (name, i))).convert('RGBA') for i in idx]

def only_largest(im):
    a = np.array(im); lab, n = ndimage.label(ndimage.binary_dilation(a[..., 3] > 0, iterations=2))
    if n <= 1: return im
    sz = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1)); keep = lab == int(np.argmax(sz)) + 1
    a[..., 3] = np.where(keep, a[..., 3], 0); return Image.fromarray(a).crop(Image.fromarray(a).getbbox())

def anchor(f, mode):
    al = f[..., 3] > 0; h, w = al.shape
    ys = np.where(al.any(axis=1))[0]; top, bottom = ys[0], ys[-1]
    if mode == 'center': return w / 2, h
    if mode == 'body':
        band = f[int(top + (bottom - top) * 0.08):int(top + (bottom - top) * 0.5)]
        m = (band[..., 3] > 0) & ~(band[..., 2].astype(int) > band[..., 0].astype(int) + 20)
        xs = np.nonzero(m)[1]
        if len(xs): return float(np.median(xs)), bottom + 1
    band = al[max(0, int(bottom - h * 0.14)):bottom + 1]; xs = np.where(band.any(axis=0))[0]
    return (xs[0] + xs[-1]) / 2, bottom + 1

def atlas(name, frames, k, anchors=None, pad=2):
    imgs, meta = [], []
    for i, im in enumerate(frames):
        kk = (k[i] if isinstance(k, (list, tuple)) else k) * GF
        im = im.resize((max(1, round(im.width * kk)), max(1, round(im.height * kk))), Image.LANCZOS)
        a = np.array(im); a[..., 3] = np.where(a[..., 3] > 90, 255, 0)
        ax, ay = anchor(a, anchors[i] if anchors else 'body')
        al = a[..., 3] > 0; top = np.where(al.any(axis=1))[0][0]
        xs = np.where(al[top:top + max(3, int(a.shape[0] * 0.07))].any(axis=0))[0]
        imgs.append(Image.fromarray(a)); meta.append([ax, ay, (xs[0] + xs[-1]) / 2, top])
    W = sum(i.width + pad for i in imgs); H = max(i.height for i in imgs)
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0)); x = 0; fr = []
    for im, (ax, ay, hx, hy) in zip(imgs, meta):
        out.paste(im, (x, 0))
        fr.append([int(x), 0, im.width, im.height, round(float(ax), 1), round(float(ay), 1), round(float(hx), 1), int(hy)])
        x += im.width + pad
    out.save(os.path.join(SPR, name + '.png'), optimize=True)
    print(name, len(fr), 'кадров', out.size, 'рост', [f[3] for f in fr])
    return {'img': 'assets/spr/' + name + '.png', 'f': fr}

def hat_scale(name, n, melon=False):
    ws = [hat_w(im, melon) for im in load(name, range(n))]; v = [w for w in ws if w]
    return PV.HAT['melon' if melon else 'cap'] / float(np.median(v))

S = {}
GF = 1.0
K = {n: PV.scale(n) for n in ['act', 'idle', 'cap6', 'cap8', 'swat', 'punch', 'stomp', 'stomps', 'fist', 'run', 'runs', 'gun', 'gung', 'gs', 'moves', 'held', 'mrun', 'mact', 'run2', 'mrun2', 'gunr', 'gungr', 'runs2']}
B = ['body'] * 8
# общая поправка: стоящий Валера = 176 px (88 логических), как старый
GF = 176 / float(np.median([load('act', [0])[0].height * K['act'], load('idle', [0])[0].height * K['idle'], load('fist', [0])[0].height * K['fist']]))
print('GF', round(GF, 3))
S['v7_act'] = atlas('v7_act', load('act', range(8)), K['act'], B[:5] + ['center', 'body', 'body'])
# ползком/лестница/удары + в чужих руках: 6 = подняли, 7/8 = танец, 9 = голова кружится
S['v7_mv'] = atlas('v7_mv', load('moves', range(6)) + load('held', range(4)), [K['moves']] * 6 + [K['held']] * 4, ['feet'] * 4 + ['body'] * 6)
S['v7_idle'] = atlas('v7_idle', load('idle', range(8)), K['idle'])
S['v7_cap'] = atlas('v7_cap', load('cap8', range(8)), K['cap8'])
cap6 = load('cap6', range(6)); cap6[2] = only_largest(cap6[2])   # арбуз летит отдельно (рисует код)
S['v13_cap'] = atlas('v13_cap', cap6, K['cap6'])
S['v14_swat'] = atlas('v14_swat', load('swat', range(6)), K['swat'], B[:5] + ['center'])
S['v14_punch'] = atlas('v14_punch', load('punch', range(6)), K['punch'], B[:4] + ['center', 'body'])
S['v14_stomp'] = atlas('v14_stomp', load('stomp', range(8)), K['stomp'])
S['v16_stomp'] = atlas('v16_stomp', load('stomps', range(4)), K['stomps'])
S['v12_fist'] = atlas('v12_fist', load('fist', range(8)), K['fist'], B[:5] + ['center', 'body', 'body'])
S['v12_run'] = atlas('v12_run', load('run2', range(8)), K['run2'])
S['v17_runs'] = atlas('v17_runs', load('runs2', range(8)), K['runs2'])
def cut_puff(im):  # белое облако у дула: обрезаем всё правее синего наконечника
    a = np.array(im); h = a.shape[0]; band = a[int(h * 0.3):int(h * 0.75)].astype(int)
    blue = (band[..., 2] > band[..., 0] + 40) & (band[..., 2] > band[..., 1] + 15) & (band[..., 3] > 0)
    x1 = int(np.where(blue.any(axis=0))[0].max()) + 3; a[:, x1:, 3] = 0
    im = Image.fromarray(a); return only_largest(im.crop(im.getbbox()))
gun = load('gun', range(8)); gun[5] = cut_puff(gun[5])      # без нарисованного облака: летят настоящие снаряды
gung = load('gung', range(8)); gung[5] = only_largest(gung[5])
S['v10_gun'] = atlas('v10_gun', gun + load('gunr', range(8)), [K['gun']] * 8 + [K['gunr']] * 8)  # 8..15 — новый бег
# кадр выстрела: стираем облако правее дула (дуло ~ на 31 лог. px от опоры, как в стойке)
_f = S['v10_gun']['f'][5]; _im = Image.open(os.path.join(SPR, 'v10_gun.png')).convert('RGBA'); _a = np.array(_im)
_cut = int(_f[0] + _f[4] + 31 * 2 + 3); _a[:, _cut:_f[0] + _f[2], 3] = 0; _f[2] = _cut - _f[0]
Image.fromarray(_a).save(os.path.join(SPR, 'v10_gun.png'), optimize=True)
S['v11_gun'] = atlas('v11_gun', gung + load('gungr', range(8)), [K['gung']] * 8 + [K['gungr']] * 8)
S['v15_gs'] = atlas('v15_gs', load('gs', range(8)), K['gs'])
S['v19_mrun'] = atlas('v19_mrun', load('mrun2', range(8)), K['mrun2'])
S['v19_mact'] = atlas('v19_mact', load('mact', range(8)), K['mact'], B[:5] + ['center', 'body', 'body'])
S['spin'] = atlas('spin', load('spin', range(6)), hat_scale('spin', 6), ['feet'] * 6)
# переноска: Валера в рост мужчин; масштаб — по росту кадра относительно стоящего Валеры
car = load('carry', range(4)); S['carry'] = atlas('carry', car, 96 * 2 / GF / float(np.median([im.height for im in car])), ['feet'] * 4)  # рост как у мужчин клуба (было 96)

# портрет
f = S['v7_act']['f'][0]; im = Image.open(os.path.join(SPR, 'v7_act.png')).convert('RGBA').crop((f[0], f[1], f[0] + f[2], f[1] + f[3]))
w, h = im.size; im.crop((int(0.16 * w), 0, int(0.84 * w), int(0.4 * h))).resize((128, 128), Image.LANCZOS).save(os.path.join(SPR, 'p_valera4.png'))

path = os.path.join(ROOT, 'js', 'sprites_data.js'); s = open(path, encoding='utf-8').read()
i = s.find('window.SPRITES = ') + 17; j = s.find(';\nwindow.BGS', i); D = json.loads(s[i:j])
D.update(S)
open(path, 'w', encoding='utf-8').write(s[:i] + json.dumps(D) + s[j:])
print('sprites_data.js обновлён:', ', '.join(S))
# портрет в арбузе (интро)
f = S['v19_mact']['f'][6]; im = Image.open(os.path.join(SPR, 'v19_mact.png')).convert('RGBA').crop((f[0], f[1], f[0] + f[2], f[1] + f[3]))
w, h = im.size; im.crop((int(0.14 * w), 0, int(0.86 * w), int(0.4 * h))).resize((128, 128), Image.LANCZOS).save(os.path.join(SPR, 'p_valera4m.png'))
