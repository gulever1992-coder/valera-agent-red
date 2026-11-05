// Уровень 10: миньоны из прыщей Семёна (листы m10A/B/C: <вид>0..1 движение, 2 атака, 3 смерть).
// Работают и как враги платформера ур.9 (мир, P.foes), и в шмапе джетпака (экран): окружение задаётся env.
(() => {
  const S = L10.spr, clamp = L10.clamp, rnd = L10.rnd;
  const SH = { bat: 'm10A', worm: 'm10A', eye: 'm10B', blob: 'm10B', spider: 'm10C', toad: 'm10C' };
  const HPK = { bat: 3, worm: 5, eye: 4, blob: 6, spider: 4, toad: 6 };
  const NAT = { spider: -1, toad: -1, eye: 1, worm: 1, bat: 1, blob: 1 };     // куда смотрит кадр листа (-1 влево, 1 вправо) — чтобы всегда лицом к Валере
  const SC = { bat: 0.55, worm: 0.6, eye: 0.5, blob: 0.6, spider: 0.6, toad: 0.65 };
  const GROUND = { spider: 1, toad: 1 };
  // env: { px, py — цель; shoot(e); hurt(d, x); ground(x) -> y | null; lv }
  L10.Minion = class {
    constructor(kind, x, y, o = {}) {
      this.kind = kind; this.sh = SH[kind]; this.x = x; this.y = y; this.vx = rnd(-60, 60); this.vy = rnd(-160, -60); this.t = 0; this.cd = rnd(1.2, 2.4);
      this.hp = HPK[kind] * (o.hpK || 1); this.dead = false; this.gone = false; this.minion = true; this.behind = false; this.h = 40; this.dir = -1; this.atk = 0; this.o = o;
      this.env = o.env || L10.Minion.labEnv(o);
      this.ph = rnd(0, 6.28); this.onG = false;
    }
    static labEnv(o) {     // окружение «платформер ур.9»
      const P = o.P, M = o.M;
      return { px: () => P.x, py: () => P.y - 40, shoot: e => P.ebul.push(e), hurt: (d, x) => L9.PARTS.lab.hurt(d, x), ground: x => M.roofAt ? M.roofAt(x) : null, lv: o.lv };
    }
    box() { const s = SC[this.kind] * 28; return [this.x - s, this.y - s, s * 2, s * 2]; }
    hit(d) { if (this.dead) return; this.hp -= d; this.flash = 0.08; Sound.play('hit', 0.4); if (this.hp <= 0) { this.dead = true; this.dt = 0; this.vy = -120; this.env.lv && (this.env.lv.score += 50, this.env.lv.stats.kills++); Sound.play('squeak', 0.6); } }
    update(dt) {
      this.t += dt; this.flash -= dt;
      if (this.dead) { this.dt += dt; this.vy += 500 * dt; this.y += this.vy * dt; if (this.dt > 1.2) this.gone = true; return; }
      const E = this.env, tx = E.px(), ty = E.py(), dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy) || 1;
      this.dir = dx < 0 ? -1 : 1; this.cd -= dt; if (this.atk > 0) this.atk -= dt;
      if (this.t < 0.5) { this.x += this.vx * dt; this.y += this.vy * dt; this.vy += 300 * dt; return; }     // вылупился — выброшен из прыща
      const k = this.kind;
      if (GROUND[k]) {     // наземные: падают на крышу, бегут/прыгают к Валере
        const gy = E.ground ? E.ground(this.x) : null;
        this.vy += 900 * dt; this.y += this.vy * dt;
        if (gy != null && this.y > gy - 12 && this.vy > 0 && this.y < gy + 30) { this.y = gy - 12; this.vy = 0; this.onG = true; } else this.onG = false;
        if (this.onG) {
          this.vx = this.dir * (k === 'spider' ? 120 : 0);
          if (k === 'toad' && this.cd <= 0) { if (Math.abs(dx) < 220 && Math.random() < 0.5) { this.atk = 0.4; this.cd = rnd(1.4, 2.2); const v = 260; E.shoot({ x: this.x, y: this.y - 10, vx: Math.sign(dx) * v * 0.8, vy: -260, grav: 0.7, dmg: 8, draw: L10.Minion.drawAcid }); Sound.play('fart', 0.4); } else { this.vy = -380; this.vx = Math.sign(dx) * 140; this.cd = rnd(0.8, 1.4); } }
          if (k === 'spider' && this.cd <= 0 && Math.abs(dx) < 140) { this.vy = -360; this.vx = Math.sign(dx) * 220; this.cd = rnd(1.2, 2); this.atk = 0.5; }
        }
        this.x += this.vx * dt;
        if (Math.abs(dx) < 18 && Math.abs(this.y - (ty + 30)) < 34) { E.hurt(8, this.x); this.cd = 1; }
        if (this.y > 460) this.gone = true;
        return;
      }
      // летающие
      const want = k === 'eye' ? 170 : k === 'worm' ? 80 : k === 'bat' ? 140 : 0, sp = k === 'blob' ? 110 : 90;
      let ax = dx / d * (d > want ? 1 : -0.6), ay = dy / d * (d > want ? 1 : -0.6);
      ay += Math.sin(this.t * 3 + this.ph) * 0.8;
      this.vx += (ax * sp - this.vx) * dt * 2; this.vy += (ay * sp - this.vy) * dt * 2; this.x += this.vx * dt; this.y += this.vy * dt;
      if (k === 'bat' && this.cd <= 0 && d < 330) { this.cd = rnd(1.8, 2.8); this.atk = 0.35; const v = 220; E.shoot({ x: this.x, y: this.y, vx: dx / d * v, vy: dy / d * v, dmg: 7, draw: L10.Minion.drawAcid }); Sound.play('fart', 0.3); }
      if (k === 'worm') { if (this.cd <= 0 && d < 120) { this.cd = rnd(2.4, 3.2); this.atk = 1.0; Sound.play('steam', 0.6); } if (this.atk > 0 && Math.abs(dy) < 26 && dx * this.dir > 0 && Math.abs(dx) < 110 && ((this.t * 10) | 0) % 3 === 0) E.hurt(5, this.x); }
      if (k === 'eye') { if (this.cd <= 0 && d < 360) { this.cd = rnd(2.5, 3.5); this.atk = 0.9; this.aim = [tx, ty]; Sound.play('warn', 0.3); } if (this.atk > 0 && this.atk < 0.3 && !this.fired) { this.fired = 1; this.beam = 0.2; const ux = (this.aim[0] - this.x), uy = (this.aim[1] - this.y), L = Math.hypot(ux, uy); const px = tx - this.x, py = ty - this.y, off = Math.abs(px * uy - py * ux) / L; if (off < 16 && px * ux + py * uy > 0) E.hurt(10, this.x); Sound.play('zap', 0.4); } if (this.atk <= 0) this.fired = 0; }
      if (k === 'blob' && this.cd <= 0 && d < 160) { this.cd = rnd(1.6, 2.4); this.atk = 0.4; this.vx = dx / d * 380; this.vy = dy / d * 380; Sound.play('punch', 0.4); }
      if (k === 'blob' && this.atk > 0 && d < 28) { E.hurt(10, this.x); this.atk = 0; }
      if (this.beam > 0) this.beam -= dt;
    }
    draw(c) {
      const k = this.kind, s = SC[k], fl = this.dir * NAT[k] < 0;
      const six = !!L10.fr(this.sh, k + '5');     // новые листы: 0 вылупился, 1-3 движение, 4 атака, 5 смерть
      let fr = six ? (this.dead ? 5 : this.t < 0.5 ? 0 : this.atk > 0 ? 4 : [1, 2, 3, 2][((this.t * 9) | 0) % 4]) : (this.dead ? 3 : this.atk > 0 ? 2 : ((this.t * 8) | 0) % 2);
      const grow = clamp(this.t / 0.5, 0.3, 1);
      if (L10.has(this.sh)) {
        S(c, this.sh, k + fr, this.x, this.y, s * grow, { flip: fl, a: this.dead ? clamp(1.2 - this.dt, 0, 1) : 1 });
        if (this.flash > 0) S(c, this.sh, k + fr, this.x, this.y, s * grow, { flip: fl, add: 1, a: 0.6 });
      } else { c.fillStyle = '#6a7a30'; c.fillRect(this.x - 10, this.y - 10, 20, 20); }
      if (k === 'worm' && this.atk > 0 && L10.has('fx10')) S(c, 'fx10', 'fire', this.x + this.dir * 55, this.y, 0.35 + Math.sin(this.t * 30) * 0.03, { flip: this.dir < 0, add: 1 });
      if (k === 'eye' && this.atk > 0.3) L10.Minion.ray(c, this, 3, 0.25 + Math.abs(Math.sin(this.t * 30)) * 0.2, 260);     // прицел
      if (this.beam > 0) L10.Minion.ray(c, this, 9, 1, 420);
    }
    static mark(c, x, y, w, a) {     // метка будущего удара: красный луч-полоса из кадра fx10 'laser'
      const f = L10.fr('fx10', 'laser'); if (!f) return; const im = L10.tintFrame('fx10', f, 'mark', '#ff2a1a');
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.imageSmoothingEnabled = true; c.drawImage(im, 0, 0, f[2], f[3], x - w / 2, y - 4, w, 8); c.restore();
    }
    static ray(c, m, th, a, len) {     // луч кадром fx10 'laser', растянутым по направлению прицела
      const f = L10.fr('fx10', 'laser'); if (!f || !m.aim) return;
      const ang = Math.atan2(m.aim[1] - m.y, m.aim[0] - m.x);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.translate(m.x, m.y); c.rotate(ang); c.imageSmoothingEnabled = true;
      c.drawImage(L10.img.fx10, f[0], f[1], f[2], f[3], 0, -th / 2, len, th); c.restore();
    }
    static drawAcid(c, e) { if (L10.has('fx10')) S(c, 'fx10', 'acid', e.x, e.y, 0.14, { rot: e.t * 8 }); else { c.fillStyle = '#9f6'; c.fillRect(e.x - 3, e.y - 3, 6, 6); } }
  };
})();
