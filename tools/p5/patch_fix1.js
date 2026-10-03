const fs = require('fs');
function edit(f, fn) { let s = fs.readFileSync(f, 'utf8'); s = fn(s); fs.writeFileSync(f, s); }
function rep(s, a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 70)); return s.replace(a, b); }

edit('js/level5ent.js', s => {
  // длины машин (логические px); ширина и масштаб спрайта считаются по кадру
  const L = { player: 66, matiz: 54, patrol: 66, interceptor: 70, moto: 40, riot: 92, copbus: 118, civ5: 66, civ6: 62, civ7: 76, civ8: 66, bus: 118, minibus: 76, moskvich: 66, dump: 96, ambulance: 76, firetruck: 104, garbage: 92, tractor: 100, tram: 150, tow: 90, limo: 96, mixer: 92, crane: 104, paz: 84, icecream: 76 };
  for (const k in L) s = s.replace(new RegExp('(\\n  ' + k + ': \\{[^\\n]*?)\\bL: \\d+'), '$1L: ' + L[k]);
  // кадры l5cars3 по факту: 3 эвакуатор, 5 лимузин, 6 трамвай (в cars2 кадр 1 — большой трамвай), 7 миксер, 9 кран, 10 ПАЗ, 11 мороженое
  s = s.replace(/  tram: \{ sh: 'l5cars3', fr: \[4\]/, "  tram: { sh: 'l5cars2', fr: [1]");
  s = s.replace(/  tow: \{ sh: 'l5cars3', fr: \[6\]/, "  tow: { sh: 'l5cars3', fr: [3]");
  s = s.replace(/  limo: \{ sh: 'l5cars3', fr: \[7\]/, "  limo: { sh: 'l5cars3', fr: [5]");
  s = s.replace(/  mixer: \{ sh: 'l5cars3', fr: \[8\]/, "  mixer: { sh: 'l5cars3', fr: [7]");
  // масштаб спрайта под длину машины и ширина по пропорциям кадра
  s = rep(s, "this.L = this.d.L; this.Wd = this.d.Wd;", "this.L = this.d.L; this.Wd = this.d.Wd; this.fixSize();");
  s = rep(s, "  sprite() {", `  fixSize() {
    const d = this.d, sh = L5.has(d.sh) ? d.sh : (d.alt ? d.alt[0] : 'l5cars'), fr = L5.has(d.sh) ? d.fr[0] : (d.alt ? d.alt[1] : 0), f = Spr.frame(sh, fr);
    if (!f) return;
    const fw = f[2] / 2, fh = f[3] / 2;
    this.sk = this.L / fw; this.Wd = Math.max(14, Math.min(this.Wd, fh * this.sk * 0.92)); if (fh * this.sk * 0.8 > this.Wd) this.Wd = fh * this.sk * 0.8;
  }
  sprite() {`);
  s = rep(s, "return [d.sh, d.fr.length > 1 ? d.fr[Math.floor(this.t * 6) % d.fr.length] : d.fr[0], 1, 1, null];", "return [d.sh, d.fr.length > 1 ? d.fr[Math.floor(this.t * 6) % d.fr.length] : d.fr[0], this.sk || 1, this.sk || 1, null];");
  return s;
});

edit('js/level5extra.js', s => {
  s = rep(s, "L5.TRAIN = [0, 1, 2, 1, 3, 1];", "L5.TRAIN = [0, 1, 4, 1, 2, 1];");
  s = s.split("Spr.drawC(c, 'l5cars3', 5, 0, 0, 0, k);").join("Spr.drawC(c, 'l5cars3', 8, 0, 0, 0, k);");
  return s;
});

edit('tools/build_l5.py', s => rep(s, "[-190, -150, -150, -150, -230, -170, -100, -100, -110, -120, -90, -80]", "[-190, -150, -150, -96, -150, -100, -150, -92, -150, -104, -84, -76]"));

edit('js/level5.js', s => {
  s = rep(s, ", ['l5_road', '.jpg']", "");
  s = rep(s, "const roadHit = (r, m) => L5.railHit(Wd, r, m) ||", "const roadHit = (r, m) => L5.railHit(Wd, r, m + 16) ||");
  s = s.replace("if (R() > (pk ? 0.85 : 0.22) || !free(x, y, pk ? 22 : 30)) continue;", "if (R() > (pk ? 0.85 : 0.22) || !free(x, y, pk ? 26 : 48)) continue;");
  // мусорные баки и ящики — убрать
  s = s.replace("if (R() < 0.4) { const x = b.cx + rr(-b.w * 0.4, b.w * 0.4), y = b.by + rr(10, 24); if (free(x, y, 14))", "if (false) { const x = b.cx + rr(-b.w * 0.4, b.w * 0.4), y = b.by + rr(10, 24); if (free(x, y, 14))");
  s = s.replace("} else if (kind < 0.92) { const o = addProp('dumpster', bx, by, { w: 52, rot: Math.atan2(p.dy, p.dx) }); addCirc(bx, by, 18, { obj: o }); }", "} else if (kind < 0.92) { const o = addProp('barrel', bx, by, { w: 30, hp: 1 }); }");
  // гаражи и ангары (похожи на контейнеры) — реже
  s = s.replace(/  center: \[2, 1, 3, 3, 1, 3, 0\.5,/, "  center: [2, 1, 3, 3, 1, 3, 0.1,").replace(/  resid: \[4, 3, 2, 0\.7, 3, 1, 1,/, "  resid: [4, 3, 2, 0.7, 3, 1, 0.2,").replace(/  industrial: \[0\.5, 0, 0, 0, 0, 0, 3,/, "  industrial: [0.5, 0, 0, 0, 0, 0, 0.8,");
  return s;
});

edit('js/level5scenes.js', s => {
  s = rep(s, "Spr.drawC(c, 'l5kop', 7, wx, -bh + 3 + w[2] - (body >= 4 ? 0 : 0), (o.wheel || 0), 1);", "Spr.drawC(c, 'l5kop', 7, wx, -bh + 3 + w[2] + 2, (o.wheel || 0), 0.68);");
  return s;
});
console.log('ok');
