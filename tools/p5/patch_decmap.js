const fs = require('fs');
function edit(f, fn) { let s = fs.readFileSync(f, 'utf8'); s = fn(s); fs.writeFileSync(f, s); }
function rep(s, a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 70)); return s.split(a).join(b); }
edit('tools/build_l5.py', s => rep(s, "[-30, -70, -120, -110, -34, -34, -130, -130, -50, -50, -60, -44, -40, -80, -90, -70, -26, -30, -26, -34, -30, -28, -30, -34]", "[-30, -70, -130, -100, -110, -130, -34, -50, -34, -50, -60, -44, -40, -26, -80, -90, -26, -24, -30, -30, -28, -30, -34, -26]"));
edit('js/level5world.js', s => {
  s = rep(s, "D(2, ox, oy, Math.abs(g.dx) > 0.5 ? Math.PI / 2 : 0, 0.9);", "D(3, ox, oy, Math.abs(g.dx) > 0.5 ? Math.PI / 2 : 0, 0.9);");
  s = rep(s, "D(s2 === L5.S_END ? 6 : 7,", "D(s2 === L5.S_END ? 2 : 5,");
  s = rep(s, "D(8, s2.x, s2.y, s2.a, 0.35)", "D(7, s2.x, s2.y, s2.a, 0.35)");
  s = rep(s, "Spr.sheets.seedcan ? 0 : 18,", "Spr.sheets.seedcan ? 0 : 16,");
  s = rep(s, "p.kind === 'nitro' ? 16 : 17,", "p.kind === 'nitro' ? 13 : 20,");
  s = rep(s, "'l5dec', 21, b.x, b.y, Math.atan2(b.vy, b.vx), 0.9)", "'l5dec', 19, b.x, b.y, Math.atan2(b.vy, b.vx), 0.9)");
  s = rep(s, "'l5dec', 22, b.x, b.y, Math.atan2(b.vy, b.vx), 0.8)", "'l5dec', 21, b.x, b.y, Math.atan2(b.vy, b.vx), 0.8)");
  return s;
});
edit('js/level5scenes.js', s => rep(s, "Spr.drawC(c, 'l5dec', 21, b.x, b.y, 0, 0.9)", "Spr.drawC(c, 'l5dec', 19, b.x, b.y, 0, 0.9)"));
