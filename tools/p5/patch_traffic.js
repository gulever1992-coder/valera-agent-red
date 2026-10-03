const fs = require('fs');
let s = fs.readFileSync('js/level5logic.js', 'utf8');
function rep(a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 70)); s = s.split(a).join(b); }
// 1. удары слабее для игрока
rep("(maxImp - 75) * (car.kind === 'player' ? 0.075 : car.cop ? 0.2 : 0.12)", "(maxImp - 75) * (car.kind === 'player' ? 0.035 : car.cop ? 0.2 : 0.12)");
rep("const k = c.kind === 'player' ? 0.085 : c.cop ? 0.15 : 0.12;", "const k = c.kind === 'player' ? 0.04 : c.cop ? 0.15 : 0.12;");
// 2. стреляют все, кроме перехватчика-тарана
rep("c.shooter = type === 'patrol' && Math.random() < 0.45;", "c.shooter = type !== 'interceptor' && !L5.CARDEF[type].boss; c.shoot = U.rand(0.8, 2);");
rep("c.shoot = c.d.turret ? 2.2 : U.rand(1.3, 2.4);", "c.shoot = c.d.turret ? 2.2 : U.rand(1.0, 1.9);");
rep("c.shoot <= 0 && dist < 380 && !pl.dead", "c.shoot <= 0 && dist < 420 && !pl.dead");
// 3. ПДД для гражданского трафика
rep(`    for (const o of this.cars) {
      if (o === c) continue;
      const rx = o.x - c.x, ry = o.y - c.y, fwd = rx * ca + ry * sa, lat = -rx * sa + ry * ca;
      if (fwd > 0 && fwd < 100 + c.L * 0.3 && Math.abs(lat) < 30) { c.thr = 0; c.brk = fwd < 60 ? 1 : 0.4; }
    }`, `    // дистанция до впереди идущего (по своей полосе), скорость-зависимая
    const look = 80 + Math.max(0, c.fwd) * 0.6 + c.L * 0.3;
    for (const o of this.cars) {
      if (o === c || o.dead || o.air > 0) continue;
      const rx = o.x - c.x, ry = o.y - c.y;
      if (Math.abs(rx) > look + 60 || Math.abs(ry) > look + 60) continue;
      const fwd = rx * ca + ry * sa, lat = -rx * sa + ry * ca;
      if (fwd > 0 && fwd < look + o.L * 0.5 && Math.abs(lat) < 28 + o.Wd * 0.3) { c.thr = 0; c.brk = fwd < 70 + o.L * 0.4 ? 1 : 0.5; }
    }
    // пешеходы на проезжей части — пропускаем
    for (const p of L5.world.folk) {
      if (p.gone || Math.abs(p.x - c.x) > 130 || Math.abs(p.y - c.y) > 130) continue;
      const rx = p.x - c.x, ry = p.y - c.y, fwd = rx * ca + ry * sa, lat = -rx * sa + ry * ca;
      if (fwd > 10 && fwd < 70 + Math.max(0, c.fwd) * 0.5 && Math.abs(lat) < 34) { c.thr = 0; c.brk = 1; }
    }
    // закрытый шлагбаум на переезде — стоим до отхода поезда
    for (const r of (L5.world.rails || [])) {
      if (r.bar < 0.15) continue;
      const rx = r.x - c.x, ry = r.y - c.y;
      if (Math.abs(rx) > 400 || Math.abs(ry) > 400) continue;
      const fwd = rx * ca + ry * sa, lat = -rx * sa + ry * ca;
      if (fwd > 70 && fwd < 70 + 90 + Math.max(0, c.fwd) * 0.6 && Math.abs(lat) < 60) { c.thr = 0; c.brk = 1; }
    }`);
fs.writeFileSync('js/level5logic.js', s);
console.log('ok');
