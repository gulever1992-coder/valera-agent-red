# Ур.4, новый Валера: GIF-превью всех анимаций в едином масштабе -> art_src/valera4_variants/valera_v1_anim.gif
import os, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'art_src', 'l4v', 'frames')
info = json.load(open(os.path.join(P, 'info.json')))
# опорный кадр (или 'med' — медиана) и целевой рост в логических px (как в build_assets.py)
REF = {'act': (6, 88), 'cap6': (7, 88), 'cap8': (4, 88), 'fist': (7, 88), 'gs': (0, 86), 'gun': (0, 86), 'gung': (0, 86), 'idle': (0, 88),
       'mact': (6, 86), 'moves': (5, 88), 'mrun': ('med', 84), 'punch': (0, 88), 'run': ('med', 84), 'runs': ('med', 84), 'stomp': (0, 88), 'stomps': (0, 88), 'swat': (1, 88), 'held': (0, 88)}
import sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from p4v_hat import hat_w
HAT = {'cap': 50.0, 'melon': 45.0}            # ширина убора в атласе при росте стоя 176 px (замер по образцу варианта 1)
MELON = {'mrun', 'mact', 'mrun2'}
QC = {}
def scale(name):
    melon = name in MELON
    ws = []
    for i in range(len(info[name])):
        im = Image.open(os.path.join(P, '%s_%02d.png' % (name, i)))
        ws.append(hat_w(im, melon))
    v = [w for w in ws if w]
    if len(v) >= 2:
        med = float(np.median(v)); QC[name] = [round(w / med, 2) if w else None for w in ws]
        return HAT['melon' if melon else 'cap'] / med
    hs = [h for w, h in info[name]]; r, t = REF[name]
    href = float(np.median(hs)) if r == 'med' else hs[r]
    return t * 2 / href
def frames(name):
    k = scale(name); out = []
    for i in range(len(info[name])):
        im = Image.open(os.path.join(P, '%s_%02d.png' % (name, i)))
        im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        a = np.array(im); a[..., 3] = np.where(a[..., 3] > 90, 255, 0); im = Image.fromarray(a)
        al = a[..., 3] > 0; bot = np.where(al.any(axis=1))[0][-1]; band = al[max(0, int(bot - im.height * 0.12)):bot + 1]
        xs = np.where(band.any(axis=0))[0]; out.append((im, (xs[0] + xs[-1]) / 2, bot))
    return out
if __name__ == '__main__':
    F = ImageFont.truetype('arial.ttf', 24); Z = 2; CW, CH = 760, 470; GY = 430
    SHOW = [('Бег', 'run', None, 14, 3), ('Бег с мухобойкой', 'runs', None, 14, 3), ('Топает от нетерпения', 'stomp', None, 6, 2), ('Топает с мухобойкой', 'stomps', None, 6, 3),
            ('Бездействие', 'idle', None, 2, 1), ('Удары мухобойкой', 'swat', [0, 1, 0, 2, 0, 3, 0, 4, 5], 3, 1), ('Кулаки', 'punch', None, 2.5, 1), ('Кулаки: стойка, присед, прыжок, урон', 'fist', None, 2, 1),
            ('Действия: присед, прыжок, падение, урон, нокаут', 'act', None, 2, 1), ('Ползком, лестница, удары', 'moves', [0, 1, 2, 3, 4, 5], 2.5, 1), ('Его подняли / танец в клубе', 'held', [0, 0, 1, 2, 1, 2, 1, 2, 3, 3], 2.5, 1),
            ('Снимает арбуз, надевает фуражку', 'cap6', None, 2.5, 1), ('Снимает арбуз (вариант 2)', 'cap8', None, 2.5, 1),
            ('Осеменитель 3000', 'gun', None, 3, 1), ('Осеменитель: зелёный режим', 'gung', None, 3, 1), ('Топает с Осеменителем', 'gs', None, 4, 1),
            ('В арбузе: бег', 'mrun', None, 14, 3), ('В арбузе: действия', 'mact', None, 2, 1)]
    out, durs = [], []
    for title, name, seq, fps, loops in SHOW:
        fr = frames(name); seq = seq or list(range(len(fr)))
        for _ in range(loops):
            for i in seq:
                im, ax, ay = fr[i]; im2 = im.resize((im.width * Z // 2, im.height * Z // 2), Image.NEAREST)
                c = Image.new('RGBA', (CW, CH), (38, 32, 48, 255)); d = ImageDraw.Draw(c)
                d.rectangle([0, GY, CW, CH], fill=(70, 50, 45, 255)); d.text((14, 10), title, font=F, fill=(255, 230, 120)); d.text((CW - 70, 10), '%d/%d' % (i + 1, len(fr)), font=F, fill=(200, 200, 200))
                c.alpha_composite(im2, (int(CW / 2 - ax * Z / 2), int(GY - ay * Z / 2)))
                out.append(c.convert('RGB').convert('P', palette=Image.ADAPTIVE, colors=200)); durs.append(int(1000 / fps))
        durs[-1] += 500
    dst = os.path.join(ROOT, 'art_src', 'valera4_variants', 'valera_v1_anim.gif')
    out[0].save(dst, save_all=True, append_images=out[1:], duration=durs, loop=0)
    print('QC', {k: [x for x in v if x and abs(x - 1) > 0.12] for k, v in QC.items()})
    print(len(out), 'кадров', round(sum(durs) / 1000), 'с', os.path.getsize(dst) // 1024, 'КБ')
    # статичный лист: все кадры в масштабе
    rows = []
    for title, name, seq, *_ in SHOW:
        fr = frames(name); fr = [fr[i] for i in sorted(set(seq))] if seq else fr; W = sum(f[0].width + 16 for f in fr) + 16; H = max(f[0].height for f in fr) + 50
        r = Image.new('RGBA', (W, H), (38, 32, 48, 255)); ImageDraw.Draw(r).text((10, 6), title, font=F, fill=(255, 230, 120)); x = 16
        for im, ax, ay in fr: r.alpha_composite(im, (x, H - 8 - im.height)); x += im.width + 16
        rows.append(r)
    W = max(r.width for r in rows); S = Image.new('RGB', (W, sum(r.height for r in rows)), (38, 32, 48)); y = 0
    for r in rows: S.paste(r.convert('RGB'), (0, y)); y += r.height
    S.save(os.path.join(ROOT, 'art_src', 'valera4_variants', 'valera_v1_all_frames.jpg'), quality=90); print(S.size)
