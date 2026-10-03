const fs = require('fs');
function edit(f, fn) { let s = fs.readFileSync(f, 'utf8'); s = fn(s); fs.writeFileSync(f, s); }
function rep(s, a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 70)); return s.replace(a, b); }
edit('tools/build_l5.py', s => rep(s, "# ---- спрайты ----", `# ---- рельсы и покрытия: 6 клеток по 256x256 (3x2) ----
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

# ---- спрайты ----`));
edit('js/level5.js', s => rep(s, "['l5_roofs', '.png'], ", "['l5_roofs', '.png'], ['l5_rail', '.png'], "));
edit('js/level5extra.js', s => {
  const a = s.indexOf("      c.save(); c.translate(r.x, r.y); c.rotate(r.ang);"), b = s.indexOf("      if (L5.has('l5props2'))");
  if (a < 0 || b < 0) throw new Error('нет блока рельсов');
  const blk = `      const RI = L5.img.l5_rail;
      if (RI) {
        const TS = 243;
        c.save(); c.translate(r.x, r.y); c.rotate(r.ang);
        for (let u = -L5.RAIL_LEN; u < L5.RAIL_LEN; u += TS) {
          const mid = u + TS / 2, cross = Math.abs(mid) < TS * 0.6, cell = cross ? 1 : 0;
          c.drawImage(RI, cell * 256, 0, 256, 256, mid - TS / 2, -TS / 2, TS + 0.6, TS);
        }
        c.restore();
      }
`;
  return s.slice(0, a) + blk + s.slice(b);
});
console.log('ok');
