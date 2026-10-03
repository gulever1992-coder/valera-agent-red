const fs = require('fs');
let s = fs.readFileSync('js/level5extra.js', 'utf8');
function rep(a, b) { if (!s.includes(a)) throw new Error('нет: ' + a.slice(0, 70)); s = s.replace(a, b); }
// 1. запуск сценки у конца гонки
rep("    const h = this.heli; if (!h) return;\n    h.t += dt;", `    // ближе к финалу вертолёт на глазах у игрока врезается в здание у трассы и взрывается
    if (this.mode === 'race' && !this.heliCrashDone && pl.s > L5.S_END - 2700) {
      this.heliCrashDone = true;
      const ts = Math.min(L5.S_END - 650, pl.s + 1250), tg = L5.at(ts, { lane: 0 });
      let best = null, bd = 520;
      for (const b of L5.world.boxList) { if (b.H < 28 || b.arch) continue; const d = Math.hypot(b.cx - tg.x, b.cy - tg.y); if (d < bd) { bd = d; best = b; } }
      const tx = best ? best.cx : tg.x + tg.nx * 170, ty = best ? best.cy : tg.y + tg.ny * 170;
      if (!this.heli) this.heli = { x: pl.x - 520, y: pl.y - 380, vx: 0, vy: 0, hp: 90, maxhp: 90, ang: 0, t: 0, shoot: 99, burst: 0, flash: 0, rot: 0 };
      this.heli.hp = Math.min(this.heli.hp, 22); this.heli.crash = { tx, ty, ts }; this.heli.shoot = 99;
      this.titleText = 'ВЕРТОЛЁТ ПОДБИТ!'; this.titleT = 1.8; Sound.play('sting');
    }
    const h = this.heli; if (!h) return;
    h.t += dt;`);
// 2. поведение при падении
rep("    const tx = pl.x + pl.vx * 0.7 + Math.cos(h.t * 0.6) * 260", `    if (h.crash) {
      const c = h.crash, dx = c.tx - h.x, dy = c.ty - h.y, dist = Math.hypot(dx, dy);
      h.vx += (dx / Math.max(1, dist) * 300 - h.vx) * dt * 1.3; h.vy += (dy / Math.max(1, dist) * 300 - h.vy) * dt * 1.3;
      h.x += h.vx * dt; h.y += h.vy * dt; h.ang = Math.atan2(h.vy, h.vx) + Math.sin(h.t * 9) * 0.25;
      if (Math.random() < dt * 22) FX.spawn({ x: h.x, y: h.y, vx: U.rand(-30, 30), vy: U.rand(-30, 30), life: 0.9, size: 5, grav: -10, color: '#44464c', type: 'puff' });
      if (dist < 150 || Math.hypot(c.tx - pl.x, c.ty - pl.y) < 300 && dist < 420) {
        h.dying = 0.9; h.vx = dx / 0.9; h.vy = dy / 0.9; h.crash = null; this.score += 1500;
        FX.popText(h.x, h.y - 40, 'ВЕРТОЛЁТ РАЗБИЛСЯ!', '#ffd84a'); Sound.play('warn');
      }
      return;
    }
    const tx = pl.x + pl.vx * 0.7 + Math.cos(h.t * 0.6) * 260`);
// 3. после падения — большой взрыв и стационарный огонь
rep("if (h.dying <= 0) { this.boom(h.x, h.y, 90, 40, true); this.heli = null; } return; }", "if (h.dying <= 0) { this.boom(h.x, h.y, 150, 40, true); G.shake(7, 0.5); G.flash(0.25, '#ffd070'); Sound.play('boom'); this.wrecks.push({ x: h.x, y: h.y, ang: h.ang, sh: 'l5cars3', fr: 8, t: 0, fire: 11, L: 60, sx: 0.8, sy: 0.8 }); this.heli = null; } return; }");
fs.writeFileSync('js/level5extra.js', s);
console.log('ok');
