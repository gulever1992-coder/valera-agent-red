const fs = require('fs');
function edit(f, fn) { let s = fs.readFileSync(f, 'utf8'); s = fn(s); fs.writeFileSync(f, s); }
function rep(s, a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 70)); return s.split(a).join(b); }

edit('js/level5logic.js', s => {
  // плавная резиновая лента Граблионка
  s = rep(s, "if (racing) { const gap = c.s - pl.s; k = gap > 420 ? 0.88 : gap > 200 ? 0.95 : gap < -450 ? 1.12 : gap < -150 ? 1.04 : 1.0; } else k = 1.3;\n    c.maxMul = k;",
    "if (racing) { const gap = c.s - pl.s; k = U.clamp(1 - gap * 0.0004, 0.88, 1.12); } else k = 1.3;\n    c.maxMul = c.maxMul == null ? k : c.maxMul + (k - c.maxMul) * Math.min(1, dt * 1.2);");
  // блокпост: вместо трамплина — большая стрелка в сторону проезда
  s = rep(s, "const ra = L5.at(s - 260, { lane: gap * 38 }); this.ramps.push({ kind: 'ramp', x: ra.x, y: ra.y, rot: ra.ang, w: 74, by: ra.y - 40, dyn: true });",
    "const sa = L5.at(s - 200, { lane: 0 }); this.signs = this.signs || []; this.signs.push({ x: sa.x, y: sa.y, ang: sa.ang + (gap === 0 ? 0 : gap > 0 ? 0.75 : -0.75), by: sa.y });");
  return s;
});

edit('js/level5world.js', s => {
  // билборд — на земле; свет фонаря — на уровне головки у столба (низко)
  s = rep(s, "case 'billboard': { const kp = 1 + 40 / L5.PERSP, q = L5.R.PXY(o.x, o.y, C, kp); Spr.drawC(c, 'l5props', PS.billboard, q[0], q[1] - 8, 0, kp); break; }", "case 'billboard': Spr.drawC(c, 'l5props', PS.billboard, o.x, o.y - 8, 0, 1); break;");
  s = rep(s, "q = L5.R.PXY(o.x, o.y, C, 1 + 58 / L5.PERSP); LG(1, q[0], q[1], 0, 1, 0.8 * fl); }", "q = [o.x + 6, o.y - 14]; LG(1, q[0], q[1], 0, 1, 0.8 * fl); }");
  // стрелки блокпоста
  s = rep(s, "  for (const tr of (lv.trains || []))", "  for (const sg of (lv.signs || [])) gl.push({ kind: 'sign', sg, by: sg.y });\n  for (const tr of (lv.trains || []))");
  s = rep(s, "      case 'train': L5.R.train(c, o.tr); break;", "      case 'train': L5.R.train(c, o.tr); break;\n      case 'sign': if (L5.has('l5sign')) Spr.drawC(c, 'l5sign', 2, o.sg.x, o.sg.y, o.sg.ang, 1.3); break;");
  return s;
});

edit('js/level5render.js', s => {
  s = rep(s, "  if (C.y < y0) L5.R.wall(", "  if (b.H < 8) { if (!b.arch) L5.R.roof(c, C, x0, y0, b.w, b.d, z1, b.roof || 8, { img: b.roofImg ? L5.tex(b.roofImg) : null, front: b.front }); return; }\n  if (C.y < y0) L5.R.wall(");
  return s;
});

edit('js/level5.js', s => {
  // порт и верфь — плоские объекты на земле (вид сверху), а не высокие коробки
  s = rep(s, "name: 'ПОРТ', fw: 170, dp: 90, H: 190,", "name: 'ПОРТ', fw: 170, dp: 90, H: 4,");
  s = rep(s, "name: 'ВЕРФЬ: СПУСК', fw: 330, dp: 100, H: 62,", "name: 'ВЕРФЬ: СПУСК', fw: 330, dp: 100, H: 4,");
  // трамплины убрать
  s = s.replace(/addProp\('ramp'[^\n]*\n/g, (m) => '// ' + m.trim() + '\n');
  return s;
});
console.log('ok');
