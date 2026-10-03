const fs = require('fs'); let s = fs.readFileSync('tools/build_l5.py', 'utf8');
s = s.replace("# ---- спрайты ----", `# ---- виды крыш знаковых зданий сверху: 20 штук по 640x240 (2 листа 2x5) ----
roofs = Image.new('RGB', (1280, 2400), (60, 60, 64)); got_r = False
for part, srcname in enumerate(['l5_roofs_a.png', 'l5_roofs_b.png']):
    if not have(srcname):
        continue
    im = Image.open(os.path.join(SRC, srcname)).convert('RGB')
    cw, ch = im.width / 2, im.height / 5
    for i in range(10):
        c, r = i % 2, i // 2
        cell = im.crop((int(c * cw + 5), int(r * ch + 5), int((c + 1) * cw - 5), int((r + 1) * ch - 5))).resize((640, 240), Image.LANCZOS)
        k = part * 10 + i
        roofs.paste(cell, ((k % 2) * 640, (k // 2) * 240))
        got_r = True
if got_r:
    roofs.save(os.path.join(OUT, 'l5_roofs.png'), optimize=True)
    print('l5_roofs OK')

# ---- спрайты ----`);
fs.writeFileSync('tools/build_l5.py', s);
