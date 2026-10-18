# -*- coding: utf-8 -*-
"""Ассеты финальной катсцены в главном зале (V4.sceneHall): py tools/l7v5_hall.py  -> assets/l7v4/h*.png|jpg + js/l7v4_hall_data.js
Исходники — Flow (tools/p7v4/flowH.js): толпа со спины, толпа-зомби, руки-аплодисменты, слайды экрана, ложа Господина Икс, задняя часть зала, гости и зомби сбоку."""
import os, json
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd
from l7v4_stairs import key, SRC, OUT

PICK = dict(hcrowd=[0, 1], hzcrowd=[0, 1], hhands=0, hslides=0, hmrx=0, hrear=1, hguests=0, hzomb=0, hmrx2=0, hguests2=0, hzomb2=0)
DATA = {}
src = lambda n, i: Image.open(os.path.join(SRC, 'v4_%s_%d.jpg' % (n, i)))
save = lambda im, n, **kw: im.save(os.path.join(OUT, n), **kw)


def strip(name, i, out):
    """полоса толпы: пурпур прозрачный, обрезка сверху по головам"""
    a = key(src(name, i)); a[..., 3] = nd.binary_opening(a[..., 3] > 40, iterations=1) * a[..., 3]
    ys = np.where((a[..., 3] > 40).sum(1) > 4)[0]; a = a[ys.min():]
    save(Image.fromarray(a, 'RGBA'), out, optimize=True); DATA[out[:-4]] = [a.shape[1], a.shape[0]]


def figures(name, i, out, n=6, h=300):
    """лист фигур 2 ряда по n: связные области -> ячейки одной высоты, ноги на нижней кромке; данные: [x, y, w, h, ось x]"""
    a = key(src(name, i)); m = a[..., 3] > 40
    lab, k = nd.label(nd.binary_dilation(m, iterations=5))
    bs = [(y.start, x.start, y.stop, x.stop, i + 1) for i, (y, x) in enumerate(nd.find_objects(lab)) if (y.stop - y.start) * (x.stop - x.start) > 9000]
    bs.sort(key=lambda b: (b[0] > a.shape[0] * 0.4, b[1])); assert len(bs) == 2 * n, (name, len(bs))
    ims, fr = [], []
    for j, (y0, x0, y1, x1, li) in enumerate(bs):
        p = a[y0:y1, x0:x1].copy(); p[lab[y0:y1, x0:x1] != li] = 0; ys, xs = np.where(p[..., 3] > 40); p = p[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        ims.append(Image.fromarray(np.ascontiguousarray(p), 'RGBA'))
    # общий масштаб по самой высокой фигуре верхнего ряда пары (кадры одного персонажа не «дышат»)
    for j in range(n):
        k = h / max(ims[j].height, ims[j + n].height)
        for q in (j, j + n): ims[q] = ims[q].resize((round(ims[q].width * k), round(ims[q].height * k)), Image.LANCZOS)
    cw = max(im.width for im in ims) + 4; sheet = Image.new('RGBA', (cw * n, (h + 4) * 2))
    for j, im in enumerate(ims):
        x, y = (j % n) * cw + (cw - im.width) // 2, (j // n) * (h + 4) + h - im.height + 2
        sheet.paste(im, (x, y))
        al = np.asarray(im)[..., 3]; feet = np.where(al[-12:].max(0) > 40)[0]   # ось — середина ступней
        fr.append([(j % n) * cw, (j // n) * (h + 4), cw, h + 4, round((cw - im.width) / 2 + (feet.min() + feet.max()) / 2, 1)])
    save(sheet, out, optimize=True); DATA[out[:-4]] = fr


def cells(a, thr=38, minlen=120):
    """яркие полосы листа-сетки по строкам/столбцам (между ними — чёрные разделители)"""
    g = a.astype(int).sum(2) / 3
    def runs(v):
        on = v > thr; out = []; s = None
        for i, q in enumerate(list(on) + [False]):
            if q and s is None: s = i
            if not q and s is not None:
                if i - s > minlen: out.append((s, i))
                s = None
        return out
    return runs(g.mean(1)), runs(g.mean(0))


def rappel(i=0):
    """спецназ на верёвке: 5 полос по столбцам (боец 2 кадра, главарь 2 кадра, верёвка); данные: [x, w, ось верёвки, голова y, ноги y]"""
    a = key(src('hrope', i)); m = a[..., 3] > 40; col = m.any(0); runs = []; s0 = None
    for x, q in enumerate(list(col) + [False]):
        if q and s0 is None: s0 = x
        if not q and s0 is not None:
            if x - s0 > 6: runs.append((s0, x))
            s0 = None
    assert len(runs) == 5, runs
    sh = Image.new('RGBA', (sum(x1 - x0 + 4 for x0, x1 in runs), a.shape[0])); fr = []; X = 0
    for x0, x1 in runs:
        p = a[:, x0:x1]; pm = p[..., 3] > 40; sh.paste(Image.fromarray(np.ascontiguousarray(p), 'RGBA'), (X, 0))
        rx = np.where(pm[:12].any(0))[0]; body = np.where(pm.sum(1) > 40)[0]
        fr.append([X, x1 - x0, round(float(rx.mean()), 1) if len(rx) else (x1 - x0) / 2, int(body.min()) if len(body) else 0, int(body.max()) if len(body) else a.shape[0]]); X += x1 - x0 + 4
    save(sh, 'hrap.png', optimize=True); DATA['hrap'] = fr; DATA['hrapH'] = a.shape[0]


def shooter(i=0, n=4, h=300):
    """кадры стрельбы (верхний ряд листа): [x, y, w, h, ось x]; общий масштаб, ноги на нижней кромке"""
    a = key(src('hshoot', i)); lab, k = nd.label(nd.binary_dilation(a[..., 3] > 40, iterations=6))
    bs = [(y.start, x.start, y.stop, x.stop, j + 1) for j, (y, x) in enumerate(nd.find_objects(lab)) if (y.stop - y.start) * (x.stop - x.start) > 9000 and (y.start + y.stop) / 2 < a.shape[0] / 2]
    bs.sort(key=lambda b: b[1]); assert len(bs) == n, len(bs)
    ims = []
    for y0, x0, y1, x1, li in bs:
        p = a[y0:y1, x0:x1].copy(); p[lab[y0:y1, x0:x1] != li] = 0; ims.append(Image.fromarray(np.ascontiguousarray(p), 'RGBA'))
    k = h / max(im.height for im in ims); ims = [im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS) for im in ims]
    cw = max(im.width for im in ims) + 4; sh = Image.new('RGBA', (cw * n, h + 4)); fr = []
    for j, im in enumerate(ims):
        al = np.asarray(im)[..., 3]; feet = np.where(al[-10:].max(0) > 40)[0]; ax = (feet.min() + feet.max()) / 2
        sh.paste(im, (j * cw, h + 2 - im.height)); fr.append([j * cw, 0, cw, h + 4, round(float(ax), 1)])
    save(sh, 'hshoot.png', optimize=True); DATA['hshoot'] = fr


def main():
    strip('hcrowd', 0, 'hc0.png'); strip('hcrowd', 1, 'hc1.png'); strip('hzcrowd', 0, 'hz0.png'); strip('hzcrowd', 1, 'hz1.png')
    # руки: сетка 6 x 2
    a = key(src('hhands', PICK['hhands'])); save(Image.fromarray(a, 'RGBA'), 'hhands.png', optimize=True); DATA['hhands'] = [a.shape[1] / 6, a.shape[0] / 2]
    # слайды 3 x 3 -> один лист 3 x 3 по 448 x 252
    im = src('hslides', PICK['hslides']).convert('RGB'); rows, cols = cells(np.asarray(im)); assert len(rows) == 3 and len(cols) == 3, (rows, cols)
    sh = Image.new('RGB', (448 * 3, 252 * 3))
    for r, (y0, y1) in enumerate(rows):
        for q, (x0, x1) in enumerate(cols):
            box = [x0 + 5, y0 + 5, x1 - 5, y1 - 5]
            if r == 2 and q == 2:   # «тревога»: под знаком латинская надпись — берём только знак
                w, h = box[2] - box[0], box[3] - box[1]; box = [box[0] + w * 0.17, box[1], box[2] - w * 0.17, box[1] + h * 0.66]
            sh.paste(im.crop([round(v) for v in box]).resize((448, 252), Image.LANCZOS), (q * 448, r * 252))
    save(sh, 'hslides.jpg', quality=92)
    # ложа: 4 кадра одного плана (рука на перилах -> к груди -> на груди -> поклон)
    im = src('hmrx2', PICK['hmrx2']).convert('RGB'); rows, cols = cells(np.asarray(im), thr=14, minlen=200); assert len(rows) == 2 and len(cols) == 2, (rows, cols)
    w = min(x1 - x0 for x0, x1 in cols) - 8; h = min(y1 - y0 for y0, y1 in rows) - 8; sh = Image.new('RGB', (w * 4, h))
    for r, (y0, y1) in enumerate(rows):
        for q, (x0, x1) in enumerate(cols): sh.paste(im.crop((x0 + 4, y0 + 4, x0 + 4 + w, y0 + 4 + h)), ((r * 2 + q) * w, 0))
    save(sh, 'hmrx.jpg', quality=92); DATA['hmrx'] = [w, h]
    # экран на сцене: всё, что перед экраном (трибуны, микрофоны, рама), рисуется поверх слайда
    hall = np.asarray(Image.open(os.path.join(OUT, 'afhall.jpg')).convert('RGB')).astype(int); X0, Y0, X1, Y1 = 470, 291, 812, 500
    r_, g_, b_ = hall[Y0:Y1, X0:X1, 0], hall[Y0:Y1, X0:X1, 1], hall[Y0:Y1, X0:X1, 2]
    teal = (g_ > r_ + 16) & (b_ > r_ + 16) & (g_ > 36); lab, n = nd.label(teal); scr = lab == lab[(Y1 - Y0) // 2 - 30, (X1 - X0) // 2]
    print('экран', int(scr.sum()), lab[(Y1 - Y0) // 2 - 30, (X1 - X0) // 2])
    ys, xs = np.where(scr); fg = np.dstack([hall[Y0:Y1, X0:X1].astype(np.uint8), np.where(scr, 0, 255).astype(np.uint8)])[ys.min():ys.max() + 3, xs.min() - 2:xs.max() + 3]
    save(Image.fromarray(np.ascontiguousarray(fg), 'RGBA'), 'hallscr.png', optimize=True); DATA['hallscr'] = [int(X0 + xs.min() - 2), int(Y0 + ys.min()), fg.shape[1], fg.shape[0]]
    save(src('hrear', PICK['hrear']).convert('RGB'), 'hrear.jpg', quality=92)
    figures('hguests2', PICK['hguests2'], 'hguests.png'); figures('hzomb2', PICK['hzomb2'], 'hzomb.png')
    rappel(0); shooter(0)
    with open(os.path.join(OUT, '..', '..', 'js', 'l7v4_hall_data.js'), 'w', encoding='utf-8') as f:
        f.write('// создаётся tools/l7v5_hall.py\nwindow.V4_HALL = ' + json.dumps(DATA) + ';\n')
    print({k: (v if k[0] != 'h' or len(str(v)) < 60 else '...') for k, v in DATA.items()})


if __name__ == '__main__':
    main()

# Господин Икс — только глаза и улыбка на чёрном (перезаписывает p_mrx, mrx_box, hmrx)
import subprocess as _sp, sys as _sys; _sp.run([_sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), "mrx_eyes.py")])
