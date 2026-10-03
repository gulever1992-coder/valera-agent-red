const fs = require('fs'); let s = fs.readFileSync('tools/build_l5.py', 'utf8');
s = s.replace("if have('l5_fx.png'):", `if have('l5_decals.png'):
    S['l5dec'] = build_sheet('l5dec', 'l5_decals.png', 24, [-30, -70, -120, -110, -34, -34, -130, -130, -50, -50, -60, -44, -40, -80, -90, -70, -26, -30, -26, -34, -30, -28, -30, -34], grid=(4, 6), anchors=['center'] * 24)
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
if have('l5_fx.png'):`);
fs.writeFileSync('tools/build_l5.py', s);
