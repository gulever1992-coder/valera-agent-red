# Задания сборки уровня 10 (вызывается из build_l10.py). B — модуль build_l10.
import os

def run(B):
    have = lambda n: os.path.exists(os.path.join(B.SRC, n + '.png'))
    def unline(f):     # убрать тонкие линии сетки листа (почти сплошные по высоте/ширине столбцы и строки)
        import numpy as np
        from PIL import Image
        a = np.array(f); al = a[..., 3] > 20; h, w = al.shape
        cx, cy = al.mean(0), al.mean(1)     # тонкая линия: столбец/строка почти сплошные, а в 3 px по бокам почти пусто
        for x in range(w):
            if cx[x] > 0.5 and (x < 3 or cx[x - 3] < 0.3) and (x > w - 4 or cx[x + 3] < 0.3): a[:, max(0, x - 1):x + 2, 3] = 0
        for y in range(h):
            if cy[y] > 0.5 and (y < 3 or cy[y - 3] < 0.3) and (y > h - 4 or cy[y + 3] < 0.3): a[max(0, y - 1):y + 2, :, 3] = 0
        im = Image.fromarray(a); bb = im.getbbox(); return im.crop(bb) if bb else im
    def sheet(src, bg, names, out, scale=1.0, anchor='bc', rc=None, mirror=False, **kw):
        if not have(src): print('нет', src); return []
        im = B.key(B.load(src + '.png'), bg)
        frs = B.grid(im, *rc) if rc else B.frames(im, **kw)
        if mirror: frs = [f.transpose(0) for f in frs]
        if kw.get('lines') or mirror: frs = [unline(f) for f in frs]     # 0 = FLIP_LEFT_RIGHT: лист нарисован лицом вправо
        if len(frs) != len(names): print('!!', src, 'кадров', len(frs), 'ожидалось', len(names))
        n = min(len(frs), len(names)); B.pack(out, frs[:n], names[:n], scale, anchor); return frs

    # --- Семён: позы (смотрят вправо; в игре зеркалим). Полный рост ~1450 px -> масштаб 0.8
    S = 0.8
    poses1 = []
    for src, nm in [('s1poseA', ['front', 'roar', 'raise']), ('s1poseB', ['slam', 'eyes', 'plasma']), ('s1poseC', ['lunge', 'grab', 'hurt']), ('s1poseF', ['walk0', 'walk1', 'walk2']), ('s1poseG', ['idle', 'idle2', 'taunt']), ('s1eat', ['eat0', 'eat1', 'eat2'])]:
        if have(src): poses1.append((src, nm))
    frs, nms = [], []
    for src, nm in poses1:
        f = B.grid(B.key(B.load(src + '.png'), 'white'), 1, 3)
        if len(f) != len(nm): print('!!', src, len(f))
        frs += f[:len(nm)]; nms += nm[:len(f)]
    if frs: B.pack('sem1', frs, nms, S)
    if have('s2A') and have('s2B'):
        f2 = B.grid(B.key(B.load('s2A.png'), 'white'), 1, 3) + B.grid(B.key(B.load('s2B.png'), 'white'), 1, 3)
        B.pack('sem2', f2, ['idle', 'roar', 'gun', 'lunge', 'eyes', 'hurt'], S)
    else: sheet('s2pose', 'white', ['idle', 'roar', 'gun'], 'sem2', S, rc=(1, 3))
    if have('s3A') and have('s3B'):
        f3 = B.grid(B.key(B.load('s3A.png'), 'white'), 1, 3) + B.grid(B.key(B.load('s3B.png'), 'white'), 1, 3, keep_own=False)
        f3 = [f.crop((0, 0, f.width, int(f.height * k))) for f, k in zip(f3, [0.56, 0.64, 0.56, 0.54, 0.54, 0.62])]     # по пояс: ниже — вода
        B.pack('sem3', f3, ['idle', 'raise', 'roar', 'tired', 'hit', 'grab'], S)
    elif have('s3pose'):     # облик 3 — по пояс из воды: режем кадры по нарисованной линии воды
        f3 = B.grid(B.key(B.load('s3pose.png'), 'white'), 1, 3)
        f3 = [f.crop((0, 0, f.width, int(f.height * k))) for f, k in zip(f3, [0.53, 0.60, 0.555])]
        B.pack('sem3', f3, ['idle', 'raise', 'roar'], S)
    if have('pimp2'): sheet('pimp2', 'white', ['p0', 'p1', 'p2', 'p3', 'p4', 'p5'], 'pimp10', 0.5, 'c', rc=(2, 3))
    else: sheet('pimp', 'white', ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'], 'pimp10', 0.5, 'c', gap=14, minlen=60)
    # --- миньоны: 2 вида на листе, 4 кадра
    for src, a, b in [('minA', 'bat', 'worm'), ('minB', 'eye', 'blob'), ('minC', 'spider', 'toad')]:
        if have(src + '2'): sheet(src + '2', 'white', [a + str(i) for i in range(6)] + [b + str(i) for i in range(6)], 'm10' + src[-1], 0.45, 'c', rc=(2, 6), mirror=(src == 'minC')); continue
        sheet(src, 'white', [a + str(i) for i in range(4)] + [b + str(i) for i in range(4)], 'm10' + src[-1], 0.45, 'c', rc=(2, 4))
    # --- Валера: джетпак, море (пурпур). Высота Валеры в игре ~170 px холста
    sheet('vjet3' if have('vjet3') else 'vjet', 'magenta', ['hover', 'hover2', 'up', 'down', 'fire', 'fire2', 'hurt', 'grab'], 'vJet10', 0.5, 'c', rc=(2, 4))
    sheet('vjetup', 'magenta', ['j%d' % i for i in range(8)], 'vJetUp10', 0.5, 'bc', rc=(2, 4))     # надевает джетпак и взлетает
    sheet('vsea', 'magenta', ['swim0', 'swim1', 'climb0', 'climb1', 'aim', 'fire', 'fall', 'ko'], 'vSea10', 0.5, 'bc', rc=(2, 4))
    sheet('cannon', 'magenta', ['idle0', 'idle', 'fire0', 'fire1'], 'can10', 0.5, 'c', gap=14, minlen=40)
    # --- фоны
    for n in ['bg1f', 'bg1m', 'bg2', 'bg3', 'port']:
        if have(n): B.bgimg(n, n + '.png', 720)

    # --- мир фазы 1
    sheet('roofs3', 'magenta', ['r0', 'r1', 'r2', 'r3', 'r4', 'r5'], 'roof10', 0.5, 'tc', rc=(2, 3))
    sheet('debris2', 'magenta', ['d%d' % i for i in range(12)], 'deb10', 0.4, 'c', rc=(3, 4))
    if have('mid'): B.bgcut('mid10', 'mid.png', 480)
    sheet('arm', 'white', ['a0', 'a1', 'a2'], 'arm10', 0.6, 'bc', rc=(1, 3))
    sheet('tent', 'white', ['seg', 'tip', 'coil', 'sucker'], 'tent10', 0.5, 'c', rc=(2, 2))
    sheet('fxa', 'black', ['plasma', 'ball', 'laser', 'lhit', 'fire', 'flash', 'tracer', 'bolt0', 'bolt1', 'dust', 'splash', 'acid'], 'fx10', 0.6, 'c', rc=(3, 4))
    sheet('fxb', 'black', ['b0', 'b1', 'b2', 'b3', 'n0', 'n1', 'n2', 'n3'], 'boom10', 0.6, 'c', rc=(2, 4))
    # --- море
    sheet('rafts', 'magenta', ['raft%d' % i for i in range(8)], 'raft10', 0.5, 'bc', rc=(2, 4))
    sheet('station', 'magenta', ['ok', 'plug', 'dmg', 'dead'], 'stat10', 0.5, 'bc', rc=(2, 2))
    if have('subs'):     # 2x2 подлодки сверху + 4 мелких предмета снизу
        im = B.key(B.load('subs.png'), 'magenta'); H = im.height; cut = int(H * 0.62)
        top = B.grid(im.crop((0, 0, im.width, cut)), 2, 2); bot = B.grid(im.crop((0, cut, im.width, H)), 1, 4)
        B.pack('sub10', top + bot, ['sub', 'subFire', 'subOpen', 'subFire2', 'missile', 'warhead', 'scope', 'scope2'], 0.5, 'bc')
    if have('water'): B.bgcut('water10', 'water.png', 360)
    # --- катсцены: фоны-планы (16:9) и листы персонажей
    for n in ['cpYard', 'cpAlley', 'cpClub', 'cpStreet', 'cpRoof', 'cpHole', 'cpSub', 'cpScope', 'cpNuke', 'cpShore', 'cuA', 'cuB', 'cuC', 'cuValera', 'in1', 'in2', 'in3', 'in4']:     # cu* — крупные планы 16:9; in1–4 — новое интро (бомж)
        if have(n): B.bgimg(n, n + '.png', 720)
    sheet('chBomzh', 'magenta', ['b0', 'b1', 'b2', 'b3'], 'chBomzh', 0.5, 'bc', gap=14, minlen=40)
    sheet('cuBomzh', 'magenta', ['u0', 'u1', 'u2', 'u3'], 'cuBomzh', 0.8, 'c', rc=(1, 4))
    sheet('chGop', 'magenta', ['g0', 'g1', 'g2', 'g3', 'n0', 'n1', 'n2', 'n3'], 'chGop', 0.5, 'bc', gap=14, minlen=40)
    sheet('chStrip', 'magenta', ['s0', 's1', 's2', 's3'], 'chStrip', 0.5, 'bc', gap=14, minlen=40)
    fb = sheet('chBasov', 'magenta', ['bs0', 'bs1', 'bs2', 'bs3'], 'chBasov', 0.5, 'bc', gap=14, minlen=40)
    fy = sheet('chYurik', 'magenta', ['y%d' % i for i in range(8)], 'chYurik', 0.5, 'bc', gap=14, minlen=40)
    fx_ = B.grid(B.key(B.load('chBox.png'), 'magenta'), 2, 4) if have('chBox') else []
    if fx_: B.pack('chBox', fx_[:4], ['x0', 'x1', 'x2', 'x3'], 0.5, 'bc')
    fs = []
    subsrc = 'chSub2' if have('chSub2') else 'chSub'     # chSub2 — подводники в пиксель-стиле игры
    if have(subsrc):     # бюсты на белом внутри пурпурной рамки: двойной кей
        im = B.key(B.load(subsrc + '.png'), 'magenta'); w = B.key(im.convert('RGB'), 'white'); import numpy as np
        a = np.minimum(np.asarray(im)[..., 3], np.asarray(w)[..., 3]); w = np.asarray(w).copy(); w[..., 3] = a
        from PIL import Image as _I; fs = B.grid(_I.fromarray(w, 'RGBA'), 2, 2); B.pack('chSub', fs, ['sb0', 'sb1', 'sb2', 'sb3'], 0.5, 'bc')
    # портреты для диалогов (128x128, голова из кадра)
    from PIL import Image
    def portrait(fr, out, top=0.0, frac=0.32, cx=0.5):
        if not fr: return
        w, h = fr.size; s = int(h * frac); x0 = int(w * cx - s / 2)
        p = fr.crop((x0, int(h * top), x0 + s, int(h * top) + s)).resize((128, 128), Image.LANCZOS)
        bg = Image.new('RGBA', (128, 128), (30, 34, 40, 255)); bg.alpha_composite(p)
        bg.save(os.path.join(B.ROOT, 'assets', 'spr', 'p_' + out + '.png')); print('portrait', out)
    if fy: print('yurik fr', fy[3].size, fy[3].getbbox()); portrait(fy[3], 'yurik', 0.0, 0.3)
    if fb: portrait(fb[0], 'basov', 0.0, 0.34)
    if fs: portrait(fs[1], 'sub1', 0.02, 0.55); portrait(fs[2], 'sub2', 0.02, 0.55)
