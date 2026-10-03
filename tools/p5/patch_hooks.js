const fs = require('fs');
const rd = f => fs.readFileSync(f, 'utf8'), wr = (f, s) => fs.writeFileSync(f, s);
function rep(s, a, b) { if (!s.includes(a)) throw new Error('нет фрагмента: ' + a.slice(0, 60)); return s.replace(a, b); }
let h = rd('index.html');
h = rep(h, '<script src="js/level5logic.js?v=108"></script>', '<script src="js/level5logic.js?v=108"></script>\n<script src="js/level5extra.js?v=108"></script>');
wr('index.html', h);

let w = rd('js/level5.js');
w = rep(w, "  // --- обычные дома: коробки с фасадами (псевдообъём)", "  L5.buildRails(Wd);\n  // --- обычные дома: коробки с фасадами (псевдообъём)");
w = rep(w, "  const roadHit = (r, m) => Wd.roads.some(", "  const roadHit = (r, m) => L5.railHit(Wd, r, m) || Wd.roads.some(");
wr('js/level5.js', w);

let l = rd('js/level5logic.js');
l = rep(l, "  worldTick(dt, frozen) {\n    const pl = this.pl;", "  worldTick(dt, frozen) {\n    const pl = this.pl;\n    if (!frozen && this.extraTick) this.extraTick(dt);");
l = rep(l, "    for (const c of this.cars) if (c.cop && !c.dead && !c.parkedCop) { const d = Math.hypot(c.x - pl.x, c.y - pl.y); if (d < bd) { bd = d; tgt = c; } }",
  "    for (const c of this.cars) if (c.cop && !c.dead && !c.parkedCop) { const d = Math.hypot(c.x - pl.x, c.y - pl.y); if (d < bd) { bd = d; tgt = c; } }\n    const hl = this.heli; if (hl && !hl.dying) { const d = Math.hypot(hl.x - pl.x, hl.y - pl.y); if (d < bd) { bd = d; tgt = { x: hl.x, y: hl.y, vx: hl.vx, vy: hl.vy }; } }");
wr('js/level5logic.js', l);

let r = rd('js/level5world.js');
r = rep(r, "  PM('roads');\n", "  if (L5.R.rails) L5.R.rails(c, lv, x0, y0, x1, y1, t);\n  PM('roads');\n");
r = rep(r, "  for (const p of lv.pick) gl.push({ kind: 'pick', p, by: p.y });", "  for (const p of lv.pick) gl.push({ kind: 'pick', p, by: p.y });\n  for (const tr of (lv.trains || [])) gl.push({ kind: 'train', tr, by: tr.parts && tr.parts[0] ? tr.parts[0].y : 0 });");
r = rep(r, "      case 'folk': L5.drawFolk(c, o.p, t); break;", "      case 'folk': L5.drawFolk(c, o.p, t); break;\n      case 'train': L5.R.train(c, o.tr); break;");
r = rep(r, "  PM('elevated');", "  if (lv.heli) L5.R.heli(c, C, lv.heli, t);\n  PM('elevated');");
wr('js/level5world.js', r);
console.log('ok');
