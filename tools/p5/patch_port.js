const fs = require('fs'); let s = fs.readFileSync('tools/build_l5.py', 'utf8');
s = s.replace("# ---- портрет Граблионка", `# ---- портреты: милиционер (2), копейка для шкалы здоровья (2) ----
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

# ---- портрет Граблионка`);
fs.writeFileSync('tools/build_l5.py', s);
