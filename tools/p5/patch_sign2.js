const fs = require('fs');
function edit(f, fn) { let s = fs.readFileSync(f, 'utf8'); s = fn(s); fs.writeFileSync(f, s); }
function rep(s, a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 70)); return s.replace(a, b); }
edit('js/level5logic.js', s => rep(s, "const sa = L5.at(s - 200, { lane: 0 }); this.signs = this.signs || []; this.signs.push({ x: sa.x, y: sa.y, ang: sa.ang + (gap === 0 ? 0 : gap > 0 ? 0.75 : -0.75), by: sa.y });",
  "this.signs = this.signs || [];\n    // щитовые стрелки стоят на обочине (не на асфальте): указывают на свободный проезд\n    const nb = L5.at(s, { lane: 0 });\n    if (gap === 0) { for (const sd of [-1, 1]) { const sa = L5.at(s - 150, { lane: sd * (L5.HW + 20) }); this.signs.push({ x: sa.x, y: sa.y, ang: sa.ang, by: sa.y }); } }\n    else { const sa = L5.at(s - 150, { lane: -Math.sign(gap) * (L5.HW + 20) }), ga = L5.at(s - 150, { lane: gap * 38 }); this.signs.push({ x: sa.x, y: sa.y, ang: Math.atan2(ga.y - sa.y, ga.x - sa.x), by: sa.y }); }"));
edit('js/level5world.js', s => rep(s, "Spr.drawC(c, 'l5sign', 1, o.sg.x, o.sg.y, o.sg.ang, 1.5)", "Spr.drawC(c, 'l5sign', 0, o.sg.x, o.sg.y, o.sg.ang, 1.0)"));
