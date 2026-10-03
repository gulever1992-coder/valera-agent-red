const fs = require('fs');
function edit(f, fn) { let s = fs.readFileSync(f, 'utf8'); s = fn(s); fs.writeFileSync(f, s); }
function rep(s, a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 70)); return s.replace(a, b); }
edit('js/level5.js', s => {
  // баррикады-ящики на дороге убираем (остаются только конусы перед ними)
  s = rep(s, "      const o = addProp('barricade', bx, by, { w: 54, rot: Math.atan2(p.dy, p.dx), hp: 1 }); o.c = addCirc(bx, by, 16, { obj: o, brk: true, soft: true }); Wd.breaks.push(o);\n", "");
  s = rep(s, "    else { const o = addProp('crate', bx, by, { w: 44, hp: 1 }); o.c = addCirc(bx, by, 13, { obj: o, brk: true }); Wd.breaks.push(o); }", "    /* ящики убраны */");
  return s;
});
edit('js/level5logic.js', s => {
  // щитовые знаки-стрелки блокпоста убраны
  s = rep(s, "if (gap === 0) { for (const sd of [-1, 1]) { const sa = L5.at(s - 150, { lane: sd * (L5.HW + 20) }); this.signs.push({ x: sa.x, y: sa.y, ang: sa.ang, by: sa.y }); } }\n    else { const sa = L5.at(s - 150, { lane: -Math.sign(gap) * (L5.HW + 20) }), ga = L5.at(s - 150, { lane: gap * 38 }); this.signs.push({ x: sa.x, y: sa.y, ang: Math.atan2(ga.y - sa.y, ga.x - sa.x), by: sa.y }); }", "");
  return s;
});
edit('js/level5world.js', s => rep(s, "case 'sign': if (L5.has('l5sign')) Spr.drawC(c, 'l5sign', 0, o.sg.x, o.sg.y, o.sg.ang, 1.0); break;", "case 'sign': break;"));
console.log('ok');
