const fs = require('fs');
function edit(f, fn) { let s = fs.readFileSync(f, 'utf8'); s = fn(s); fs.writeFileSync(f, s); }
function rep(s, a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 70)); return s.replace(a, b); }
edit('js/level5.js', s => {
  // заводоуправление убираем
  s = s.replace(/  \/\/ финал: заводоуправление[^\n]*\n  \{ axis: 'h', c: 142[^\n]*\n/, '');
  if (s.includes("name: 'ЗАВОДОУПРАВЛЕНИЕ")) throw new Error('hq остался');
  // зона финала: расчистка под песчаный обрыв
  s = rep(s, "  // последняя страховка:", `  // финальная зона у обрыва над морем: здания, деревья, фонари и боковые улицы убираем
  { const E = L5.at(L5.S_END, { lane: 0 }), px = -E.dy, py = E.dx, ax = [E.x - E.dx * 300 - px * 800, E.x + E.dx * 1250 + px * 800], ay = [E.y - E.dy * 300 - py * 800, E.y + E.dy * 1250 + py * 800];
    const rect = { x0: Math.min(ax[0], ax[1]), x1: Math.max(ax[0], ax[1]), y0: Math.min(ay[0], ay[1]), y1: Math.max(ay[0], ay[1]) }; Wd.endRect = rect;
    const inR = (x, y, m = 0) => x > rect.x0 - m && x < rect.x1 + m && y > rect.y0 - m && y < rect.y1 + m;
    const gone = new Set(Wd.boxList.filter(b => inR(b.cx, b.cy, 40)));
    for (const b of gone) Wd.boxes.remove(b); Wd.boxList = Wd.boxList.filter(b => !gone.has(b)); Wd.lands = Wd.lands.filter(l => !inR(l.x, l.y));
    const sol = []; Wd.solids.query(rect.x0 - 200, rect.y0 - 200, rect.x1 + 200, rect.y1 + 200, o => { if (o.box && gone.has(o.box)) sol.push(o); }); for (const o of sol) Wd.solids.remove(o);
    const dc = [], dob = []; Wd.circs.query(rect.x0, rect.y0, rect.x1, rect.y1, c => { if (!c.wall && inR(c.x, c.y)) dc.push(c); }); Wd.objs.query(rect.x0, rect.y0, rect.x1, rect.y1, o => { if (o.kind !== 'parked' && inR(o.x, o.y)) dob.push(o); });
    for (const c of dc) Wd.circs.remove(c); for (const o of dob) { Wd.objs.remove(o); const i = Wd.lamps.indexOf(o); if (i >= 0) Wd.lamps.splice(i, 1); const j = Wd.breaks.indexOf(o); if (j >= 0) Wd.breaks.splice(j, 1); }
    Wd.roads = Wd.roads.filter(r => r.main || !inR((r.ax + r.bx) / 2, (r.ay + r.by) / 2, 100)); Wd.holes = (Wd.holes || []).filter(h => !inR(h.x, h.y));
    for (const p of Wd.folk) if (inR(p.x, p.y)) p.gone = true; Wd.smokers = Wd.smokers.filter(m => !inR(m.x, m.y));
  }
  // последняя страховка:`);
  return s;
});
edit('js/level5world.js', s => rep(s, "  if (L5.R.rails) L5.R.rails(c, lv, x0, y0, x1, y1, t);", `  // финальная зона: песчаная площадка у обрыва над морем (рисунок Codex)
  if (L5.has('l5endzone') && !wd.endDraw) { const E = L5.at(L5.S_END, { lane: 0 }); wd.endDraw = { x: E.x + E.dx * 400, y: E.y + E.dy * 400, ang: Math.atan2(E.dy, E.dx) + Math.PI / 2 }; }
  if (wd.endDraw) { const e = wd.endDraw; if (e.x > x0 - 900 && e.x < x1 + 900 && e.y > y0 - 900 && e.y < y1 + 900) Spr.drawC(c, 'l5endzone', 0, e.x, e.y, e.ang, 1); }
  if (L5.R.rails) L5.R.rails(c, lv, x0, y0, x1, y1, t);`));
edit('tools/build_l5.py', s => rep(s, "if have('l5_signs.png'):", "if have('l5_endzone.png'):\n    S['l5endzone'] = build_sheet('l5endzone', 'l5_endzone.png', 1, [-1600], grid=(1, 1), anchors=['center'])\nif have('l5_signs.png'):"));
console.log('ok');
