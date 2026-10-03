# Сборка ассетов уровня 5 (вид сверху с псевдообъёмом). Запуск: py tools/build_l5.py
# Берёт только готовые картинки art_src/l5_*.png; чего нет — пропускает. Остальные атласы в sprites_data.js не трогает.
import json, os, re
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'build_assets.py'), encoding='utf-8').read()
exec(compile(src[:src.index('\nS = {}')], 'build_assets_helpers', 'exec'))  # функции: build_sheet, key_*, bg ...

DATA = os.path.join(ROOT, 'js', 'sprites_data.js')
txt = open(DATA, encoding='utf-8').read()
G = {}
for name, body in re.findall(r'window\.(\w+) = (\{.*?\});\n', txt + '\n', re.S):
    G[name] = json.loads(body)
S = G.setdefault('SPRITES', {})
have = lambda f: os.path.exists(os.path.join(SRC, f))


def seamless_tile(t):
    a = np.array(t).astype(np.float32)
    ro = np.roll(a, (64, 64), axis=(0, 1))
    w1 = 1 - np.abs(np.arange(128) - 64) / 64.0
    w = np.clip(np.outer(w1, w1) * 1.6, 0, 1)[..., None]
    return Image.fromarray((a * w + ro * (1 - w)).clip(0, 255).astype(np.uint8))


def tileset(srcname, outname, seam_count):
    im = Image.open(os.path.join(SRC, srcname)).convert('RGB')
    cw, ch = im.width / 5, im.height / 4
    atlas = Image.new('RGB', (640, 512))
    for i in range(20):
        c, r = i % 5, i // 5
        t = im.crop((int(c * cw + 5), int(r * ch + 5), int((c + 1) * cw - 5), int((r + 1) * ch - 5))).resize((128, 128), Image.LANCZOS)
        if i < seam_count:
            t = seamless_tile(t)
        atlas.paste(t, (c * 128, r * 128))
    atlas.save(os.path.join(OUT, outname), optimize=True)
    print(outname, 'OK')


def crop_building(cell):
    """вырезать здание из ячейки на зелёном фоне; прозрачное внутри — тёмно-серым"""
    a = key_green(cell)
    al = a[..., 3] > 0
    if al.sum() < 100:
        return cell.convert('RGB')
    ys = np.where(al.any(axis=1))[0]; xs = np.where(al.any(axis=0))[0]
    sub = a[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1]
    im = Image.fromarray(sub, 'RGBA')
    bgc = Image.new('RGBA', im.size, (58, 58, 66, 255))
    bgc.alpha_composite(im)
    return bgc.convert('RGB')


if have('l5_tiles.png'):
    tileset('l5_tiles.png', 'l5_tiles.png', 16)
if have('l5_tiles2.png'):
    tileset('l5_tiles2.png', 'l5_tiles2.png', 20)

# ---- фасады домов: 4x4 ячейки 256x170 (стена от земли до крыши, повторяется по горизонтали) ----
if have('l5_houses.png'):
    atlas = Image.new('RGB', (1024, 1360))
    for part, srcname in enumerate(['l5_houses.png', 'l5_houses2.png']):
        if not have(srcname):
            continue
        im = Image.open(os.path.join(SRC, srcname)).convert('RGB')
        cw, ch = im.width / 4, im.height / 4
        for i in range(16):
            c, r = i % 4, i // 4
            t = im.crop((int(c * cw + 3), int(r * ch + 3), int((c + 1) * cw - 3), int((r + 1) * ch - 3))).resize((256, 170), Image.LANCZOS)
            atlas.paste(t, (c * 256, part * 680 + r * 170))
    atlas.save(os.path.join(OUT, 'l5_facades.png'), optimize=True)
    print('l5_facades OK')

# ---- фасады знаковых зданий (элевации): 8 штук по 512x340, ячейки 2x2 в двух картинках ----
elev = Image.new('RGB', (2048, 1700), (58, 58, 66)); got = False
for part, srcname in enumerate(['l5_land_a.png', 'l5_land_b.png', 'l5_land_c.png', 'l5_land_d.png', 'l5_land_e.png']):
    if not have(srcname):
        continue
    im = Image.open(os.path.join(SRC, srcname)).convert('RGB')
    for i in range(4):
        c, r = i % 2, i // 2
        cell = im.crop((int(c * im.width / 2), int(r * im.height / 2), int((c + 1) * im.width / 2), int((r + 1) * im.height / 2)))
        b = crop_building(cell).resize((512, 340), Image.LANCZOS)
        k = part * 4 + i
        elev.paste(b, ((k % 4) * 512, (k // 4) * 340))
        got = True
if got:
    elev.save(os.path.join(OUT, 'l5_elev.png'), optimize=True)
    print('l5_elev OK')

# ---- виды крыш знаковых зданий сверху: 20 штук по 640x240 (2 листа 2x5) ----
roofs = Image.new('RGB', (1280, 2400), (60, 60, 64)); got_r = False
for part, srcname in enumerate(['l5_roofs_a.png', 'l5_roofs_b.png']):
    if not have(srcname):
        continue
    im = Image.open(os.path.join(SRC, srcname)).convert('RGB')
    cw, ch = im.width / 2, im.height / 5
    for i in range(10):
        c, r = i % 2, i // 2
        cell = im.crop((int(c * cw + 14), int(r * ch + 14), int((c + 1) * cw - 14), int((r + 1) * ch - 14))).resize((640, 240), Image.LANCZOS)
        k = part * 10 + i
        roofs.paste(cell, ((k % 2) * 640, (k // 2) * 240))
        got_r = True
if got_r:
    roofs.save(os.path.join(OUT, 'l5_roofs.png'), optimize=True)
    print('l5_roofs OK')

# ---- рельсы и покрытия: 6 клеток по 256x256 (3x2) ----
if have('l5_rail.png'):
    im = Image.open(os.path.join(SRC, 'l5_rail.png')).convert('RGB')
    cw, ch = im.width / 3, im.height / 2
    atlas = Image.new('RGB', (768, 512))
    for i in range(6):
        c, r = i % 3, i // 3
        t = im.crop((int(c * cw + 2), int(r * ch + 2), int((c + 1) * cw - 2), int((r + 1) * ch - 2))).resize((256, 256), Image.LANCZOS)
        atlas.paste(t, (c * 256, r * 256))
    atlas.save(os.path.join(OUT, 'l5_rail.png'), optimize=True)
    print('l5_rail OK')

# ---- спрайты ----
if have('l5_cars.png'):
    S['l5cars'] = build_sheet('l5cars', 'l5_cars.png', 12, [-66, -66, -68, -68, -54, -68, -62, -78, -66, -66, -68, -50], grid=(3, 4), anchors=['center'] * 12)
if have('l5_cars2.png'):
    S['l5cars2'] = build_sheet('l5cars2', 'l5_cars2.png', 12, [-150, -170, -100, -76, -110, -96, -66, -92, -42, -100, -74, -66], grid=(4, 3), anchors=['center'] * 12)
if have('l5_cars3.png'):
    S['l5cars3'] = build_sheet('l5cars3', 'l5_cars3.png', 12, [-190, -150, -150, -96, -150, -100, -150, -92, -150, -104, -84, -76], grid=(4, 3), anchors=['center'] * 12)
if have('l5_props2.png'):
    S['l5props2'] = build_sheet('l5props2', 'l5_props2.png', 24, [-70, -70, -70, -60, -80, -60, -60, -50, -90, -60, -60, -60, -70, -80, -90, -160, -80, -50, -50, -40, -60, -80, -50, -70], grid=(4, 6), anchors=['center'] * 24)
if have('l5_kop_parts.png'):
    os.chdir(ROOT); exec(open(os.path.join(HERE, 'p5', 'kop_prep.py'), encoding='utf-8').read())
if have('l5_kop_grid.png'):
    S['l5kop'] = build_sheet('l5kop', 'l5_kop_grid.png', 9, [-200] * 7 + [-44, -44], grid=(3, 3), anchors=['center'] * 9)
if have('l5_decals.png'):
    S['l5dec'] = build_sheet('l5dec', 'l5_decals.png', 24, [-30, -70, -130, -100, -110, -130, -34, -50, -34, -50, -60, -44, -40, -26, -80, -90, -26, -24, -30, -30, -28, -30, -34, -26], grid=(4, 6), anchors=['center'] * 24)
    # мягкие тени: альфа из тёмного на зелёном
    imd = Image.open(os.path.join(SRC, 'l5_decals.png')).convert('RGB')
    cw, chh = imd.width / 4, imd.height / 6
    shw = [80, 140, 150, 110]; imgs = []
    for j in range(4):
        cell = np.array(imd.crop((int(j * cw), int(3 * chh), int((j + 1) * cw), int(4 * chh)))).astype(np.float32)
        d = np.clip(1 - cell[..., 1] / 240.0, 0, 1)
        d = np.where(d < 0.06, 0, d)
        al = np.clip(d * 0.85, 0, 1)
        ys = np.where(al.max(axis=1) > 0.04)[0]; xs = np.where(al.max(axis=0) > 0.04)[0]
        a2 = al[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1]
        rgba = np.zeros(a2.shape + (4,), np.uint8); rgba[..., 3] = (a2 * 255).astype(np.uint8)
        pim = Image.fromarray(rgba, 'RGBA'); k = shw[j] * 2.0 / pim.width
        imgs.append(pim.resize((max(2, round(pim.width * k)), max(2, round(pim.height * k))), Image.LANCZOS))
    Wt = sum(i.width + 2 for i in imgs); Ht = max(i.height for i in imgs)
    at = Image.new('RGBA', (Wt, Ht), (0, 0, 0, 0)); x = 0; fr = []
    for i in imgs:
        at.paste(i, (x, 0)); fr.append([x, 0, i.width, i.height, i.width / 2, i.height / 2, i.width / 2, 0]); x += i.width + 2
    at.save(os.path.join(SPR, 'l5shad.png'))
    S['l5shad'] = {'img': 'assets/spr/l5shad.png', 'f': fr}
if have('l5_lights.png'):
    iml = Image.open(os.path.join(SRC, 'l5_lights.png')).convert('RGB')
    cw, chh = iml.width / 4, iml.height / 2
    sizes = [260, 150, 150, 150, 70, 170, 280, 80]; imgs = []
    for j in range(8):
        cell = iml.crop((int((j % 4) * cw), int((j // 4) * chh), int((j % 4 + 1) * cw), int((j // 4 + 1) * chh)))
        a = np.array(cell).astype(np.float32)
        m = a.max(axis=2); ys = np.where(m.max(axis=1) > 14)[0]; xs = np.where(m.max(axis=0) > 14)[0]
        c2 = Image.fromarray(a[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1].astype(np.uint8), 'RGB')
        k = sizes[j] * 2.0 / c2.width
        imgs.append(c2.resize((max(2, round(c2.width * k)), max(2, round(c2.height * k))), Image.LANCZOS))
    Wt = sum(i.width + 2 for i in imgs); Ht = max(i.height for i in imgs)
    at = Image.new('RGB', (Wt, Ht), (0, 0, 0)); x = 0; fr = []
    for i in imgs:
        at.paste(i, (x, 0)); fr.append([x, 0, i.width, i.height, 0 if False else i.width / 2, i.height / 2, i.width / 2, 0]); x += i.width + 2
    at.save(os.path.join(SPR, 'l5lights.png'))
    S['l5lights'] = {'img': 'assets/spr/l5lights.png', 'f': fr, 'add': True}
if have('l5_gas.png'):
    S['l5gas'] = build_sheet('l5gas', 'l5_gas.png', 8, [-110] * 4 + [-90, -90, -70, -50], grid=(4, 2), anchors=['center'] * 8)
if have('l5_vova_rear2.png'):
    S['l5vrear'] = build_sheet('l5vrear', 'l5_vova_rear2.png', 4, 56, ref=1, keyer='magentas', grid=(2, 2), anchors=['feet'] * 4)
if have('l5_waste_src.png'):
    os.chdir(ROOT); exec(open(os.path.join(HERE, 'p5', 'waste_prep.py'), encoding='utf-8').read())
    S['l5waste'] = {'img': 'assets/spr/l5waste.png', 'f': json.load(open(os.path.join(SRC, 'l5_waste_frames.json')))}
if have('l5_spikes.png'):
    S['l5spike'] = build_sheet('l5spike', 'l5_spikes.png', 8, [-44, -44, -44, -44, -60, -150, -150, -56], grid=(4, 2), anchors=['center'] * 8)
if have('l5_leaves.png'):
    S['l5leaf'] = build_sheet('l5leaf', 'l5_leaves.png', 8, [-16] * 8, grid=(4, 2), anchors=['center'] * 8)
if have('l5_trees2.png'):
    S['l5trees2'] = build_sheet('l5trees2', 'l5_trees2.png', 4, [-84, -84, -70, -70], grid=(2, 2), anchors=['center'] * 4)
if have('l5_potholes.png'):
    S['l5hole'] = build_sheet('l5hole', 'l5_potholes.png', 8, [-24, -32, -44, -40, -42, -28, -17, -22], grid=(4, 2), anchors=['center'] * 8)
if have('l5_matiz_side.png'):
    # золотистый матиз Граблионка: кадры режем вручную (у кузова торчат спойлер, флаг, дым — build_sheet их путает)
    import sys as _s; _s.path.insert(0, HERE)
    from key_green import key_green as _kg
    _im = Image.open(os.path.join(SRC, 'l5_matiz_side.png')); _cw = _im.width // 3
    _fr = []
    for _i in range(3):
        _c = _kg(_im.crop((_i * _cw, 0, (_i + 1) * _cw, _im.height))); _fr.append(_c.crop(_c.getbbox()))
    _k = 300 / _fr[0].width                                  # один масштаб для целого и разбитого кузова
    _fr = [_fr[0].resize((300, round(_fr[0].height * _k)), Image.LANCZOS), _fr[1].resize((round(_fr[1].width * _k), round(_fr[1].height * _k)), Image.LANCZOS), _fr[2].resize((58, 58), Image.LANCZOS)]
    _W = sum(f.width for f in _fr) + 4; _H = max(f.height for f in _fr)
    _at = Image.new('RGBA', (_W, _H), (0, 0, 0, 0)); _x = 0; _rows = []
    for _f in _fr:
        _at.paste(_f, (_x, 0)); _rows.append([_x, 0, _f.width, _f.height, _f.width / 2, _f.height, _f.height / 2, 0]); _x += _f.width + 2
    _at.save(os.path.join(OUT, 'spr', 'l5msd.png'), optimize=True)
    S['l5msd'] = {'img': 'assets/spr/l5msd.png', 'f': _rows}
if have('l5_walkA.png'):
    S['l5walkA'] = build_sheet('l5walkA', 'l5_walkA.png', 16, [72] * 4 + [76] * 4 + [73] * 4 + [80] * 4, grid=(4, 4), anchors=['feet'] * 16)
if have('l5_walkB1.png'):
    S['l5walkB1'] = build_sheet('l5walkB1', 'l5_walkB1.png', 8, [88] * 8, grid=(4, 2), anchors=['feet'] * 8)
if have('l5_walkB2.png'):
    S['l5walkB2'] = build_sheet('l5walkB2', 'l5_walkB2.png', 8, [92] * 4 + [88] * 4, grid=(4, 2), anchors=['feet'] * 8)
if have('l5_endzone.png'):
    # финальная зона (пустырь, обрыв, море, мост): непрозрачная картинка вида сверху 1600x1600, кладётся целиком
    import numpy as _np
    _ez = Image.open(os.path.join(SRC, 'l5_endzone.png')).convert('RGB').resize((1600, 1600), Image.LANCZOS)
    _im = _np.array(_ez)
    # сверху достраиваем воду (зеркальные полосы над мостом), по бокам — зеркальные поля: пустырь уходит дальше, шва с травой нет
    _band = _im[0:140]; _top = _np.concatenate([_band[::-1] if i % 2 == 0 else _band for i in range(4)][::-1], axis=0)[-600:]
    _im = _np.concatenate([_top, _im], axis=0)
    _PAD = 800
    _im = _np.concatenate([_im[:, 1:_PAD + 1][:, ::-1], _im, _im[:, -_PAD - 1:-1][:, ::-1]], axis=1)
    _H, _W = _im.shape[:2]
    _a = _np.ones((_H, _W), _np.float32)
    _y = _np.arange(_H, dtype=_np.float32)[:, None]; _x = _np.arange(_W, dtype=_np.float32)[None, :]
    _a = _np.minimum(_a, _np.clip((_H - 1 - _y) / 340.0, 0, 1)); _a = _np.minimum(_a, _np.clip(_x / 220.0, 0, 1)); _a = _np.minimum(_a, _np.clip((_W - 1 - _x) / 220.0, 0, 1))
    _ez = Image.fromarray(_im).convert('RGBA'); _ez.putalpha(Image.fromarray((_a * 255).astype('uint8'), 'L'))
    _ez.save(os.path.join(OUT, 'spr', 'l5endzone.png'), optimize=True)
    S['l5endzone'] = {'img': 'assets/spr/l5endzone.png', 'f': [[0, 0, _W, _H, _PAD + 800, 600 + 800, 600 + 800, 0]]}
if have('l5_autozak.png'):
    S['l5zak'] = build_sheet('l5zak', 'l5_autozak.png', 1, [-118], grid=(1, 1), anchors=['center'])
if have('l5_signs.png'):
    S['l5sign'] = build_sheet('l5sign', 'l5_signs.png', 6, [-60, -60, -90, -90, -80, -80], grid=(3, 2), anchors=['center'] * 6)
if have('l5_fx.png'):
    S['l5fx'] = build_sheet('l5fx', 'l5_fx.png', 32, [-96] * 8 + [-44] * 4 + [-40] * 4 + [-40, -40, -16, -16, -34, -34, -40, -30] + [-50] * 4 + [-46, -46, -40, -40], grid=(4, 8), anchors=['center'] * 32)
if have('l5_props.png'):
    S['l5props'] = build_sheet('l5props', 'l5_props.png', 24, [-92, -92, -92, -62, -44, -80, -26, -42, -52, -36, -26, -50, -54, -50, -66, -22, -44, -46, -60, -80, -44, -70, -34, -44], grid=(4, 6), anchors=['center'] * 24)
if have('l5_roofelems.png'):
    S['l5roof'] = build_sheet('l5roof', 'l5_roofelems.png', 24, [60, 80, 50, 50, 50, 50, 70, 100, 40, 36, 36, 30, 60, 30, 70, 60, 70, 100, 50, 70, 60, 50, 80, 70], grid=(4, 6), anchors=['feet'] * 24)
if have('l5_life.png'):
    S['l5life'] = build_sheet('l5life', 'l5_life.png', 32, [-24] * 4 + [-24] * 4 + [-18] * 2 + [-24] * 2 + [-24] * 8 + [-26] * 2 + [-22] * 2 + [-24] * 2 + [-30] * 2 + [-14, -16, -16, -16, -22, -22, -30, -16], grid=(4, 8), anchors=['center'] * 32)
if False and have('l5_cut_cars.png'):
    S['l5cut'] = build_sheet('l5cut', 'l5_cut_cars.png', 9, [-300] * 9, grid=(3, 3), anchors=['feet'] * 9)
if have('l5_vips.png'):
    S['l5vips'] = build_sheet('l5vips', 'l5_vips.png', 8, 84, ref=0, keyer='green', even=True, anchors=['feet'] * 8)
if have('l5_hq_bg.png'):
    Image.open(os.path.join(SRC, 'l5_hq_bg.png')).convert('RGB').resize((1280, 720), Image.LANCZOS).save(os.path.join(OUT, 'l5_hq.jpg'), quality=88, optimize=True)
    print('l5_hq OK')

# ---- портреты: милиционер (2), копейка для шкалы здоровья (2) ----
if have('l5_portraits.png'):
    im = Image.open(os.path.join(SRC, 'l5_portraits.png')).convert('RGB')
    cw, chh = im.width // 2, im.height // 2
    for i, nm in enumerate(['p_cop', 'p_cop2', 'p_kop', 'p_kop2']):
        cell = im.crop(((i % 2) * cw, (i // 2) * chh, (i % 2 + 1) * cw, (i // 2 + 1) * chh))
        a = key_green(cell)
        al = a[..., 3] > 0
        ys = np.where(al.any(axis=1))[0]; xs = np.where(al.any(axis=0))[0]
        p = Image.fromarray(a[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1], 'RGBA')
        sz = max(p.size)
        sq = Image.new('RGBA', (sz, sz), (0, 0, 0, 0)); sq.paste(p, ((sz - p.width) // 2, sz - p.height if i < 2 else (sz - p.height) // 2))
        sq.resize((128, 128), Image.LANCZOS).save(os.path.join(SPR, nm + '.png'))
    print('portraits OK')

# ---- портрет Граблионка из спрайта матиза (уровень 2) ----
if 'matiz' in S and not os.path.exists(os.path.join(SRC, 'p_grab_src.png')):
    f = S['matiz']['f'][0]
    p = Image.open(os.path.join(SPR, 'matiz.png')).convert('RGBA').crop((f[0], f[1], f[0] + f[2], f[1] + f[3]))
    w, h = p.size
    p = p.crop((int(0.30 * w), int(0.0 * h), int(0.62 * w), int(0.5 * h)))
    s = max(p.size)
    sq = Image.new('RGBA', (s, s), (0, 0, 0, 0)); sq.paste(p, ((s - p.width) // 2, (s - p.height) // 2))
    sq.resize((128, 128), Image.LANCZOS).save(os.path.join(SPR, 'p_grab.png'))
    print('p_grab OK')

with open(DATA, 'w', encoding='utf-8') as fp:
    fp.write('// автоматически создано tools/build_assets.py\n' + ''.join('window.%s = %s;\n' % (k, json.dumps(v)) for k, v in G.items()))
print('готово l5:', [k for k in S if k.startswith('l5')])
