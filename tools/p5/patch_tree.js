const fs = require('fs');
function edit(f, fn) { let s = fs.readFileSync(f, 'utf8'); s = fn(s); fs.writeFileSync(f, s); }
function rep(s, a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 70)); return s.replace(a, b); }
edit('js/level5logic.js', s => rep(s, "if (vn < 0) { car.vx -= 1.2 * vn * nx; car.vy -= 1.2 * vn * ny; maxImp = Math.max(maxImp, -vn);",
  "if (vn < 0) { car.vx -= 1.2 * vn * nx; car.vy -= 1.2 * vn * ny; maxImp = Math.max(maxImp, -vn); if (o.obj && o.obj.kind === 'tree' && -vn > 40) { o.obj.hitT = G.t; FX.burst(o.x, o.y, 12, { colors: ['#e8602a', '#f0b030', '#c03020', '#8a5a1a'], speed: 130, life: 1.0, grav: 70, size: 3 }); if (-vn > 90) { G.shake(3, 0.2); Sound.play('crash'); } }"));
edit('js/level5.js', s => rep(s, "addCirc(x, y, 8, { obj: o }); return o;\n  };\n  const addLamp", "addCirc(x, y, 12, { obj: o }); return o;\n  };\n  const addLamp"));
edit('js/level5render.js', s => rep(s, "sway = Math.sin(t * 1.3 + o.ph) * 0.035 + Math.sin(t * 2.9 + o.ph * 2) * 0.012;", "sway = Math.sin(t * 1.3 + o.ph) * 0.035 + Math.sin(t * 2.9 + o.ph * 2) * 0.012 + (o.hitT != null ? Math.max(0, 0.7 - (G.t - o.hitT)) * Math.sin(G.t * 38) * 0.12 : 0);"));
console.log('ok');
