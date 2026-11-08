// Уровень 10: миньоны из прыщей Семёна (листы m10A/B/C: <вид>0..1 движение, 2 атака, 3 смерть).
// Работают и как враги платформера ур.9 (мир, P.foes), и в шмапе джетпака (экран): окружение задаётся env.
(() => {
  const S = L10.spr, clamp = L10.clamp, rnd = L10.rnd;
  const SH = { bat: 'm10A', worm: 'm10A', eye: 'm10B', blob: 'm10B', spider: 'm10C', toad: 'm10C' };
  const HPK = { bat: 3, worm: 5, eye: 4, blob: 6, spider: 4, toad: 6 };
  const NAT = { spider: -1, toad: -1, eye: 1, worm: 1, bat: 1, blob: 1 };     // куда смотрит кадр листа (-1 влево, 1 вправо) — чтобы всегда лицом к Валере
  const SC = { bat: 0.55, worm: 0.6, eye: 0.5, blob: 0.6, spider: 0.6, toad: 0.65 };
  const GROUND = { spider: 1, toad: 1 };
  const ATKF = { bat: 2, worm: 1, eye: 2, toad: 3 };     // кадр атаки без нарисованного выстрела (в кадре 4 луч/огонь/плевок уже нарисован в картинке) — выстрел рисует код, к Валере
  const FNAT = { toad1: 1, toad2: 1 };     // кадры, которые смотрят не так, как NAT листа
  const MO = { bat: [66, -10], worm: [69, 9], eye: [36, -17, 45], toad: [51, -32] };     // точка вылета (рот/глаз) в пикселях кадра от якоря: вперёд, вверх; у глаза — центр яблока и радиус
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
      return { px: () => P.x, py: () => P.y - 40, shoot: e => P.ebul.push(e), hurt: (d, x) => L9.PARTS.lab.hurt(d, x), ground: x => M.roofAt ? M.roofAt(x) : null, lv: o.lv, g: 1300 };
    }
    mouth(u) {     // точка вылета выстрела (рот/глаз) с учётом разворота; u — единичный вектор к цели (у глаза — край яблока)
      const m = MO[this.kind] || [0, 0], k = SC[this.kind] * 0.5 * clamp(this.t / 0.5, 0.3, 1);
      let x = this.x + m[0] * k * this.dir, y = this.y + m[1] * k;
      if (m[2] && u) { x += u[0] * m[2] * k; y += u[1] * m[2] * k; }
      return [x, y];
    }
    aimAt(tx, ty) {     // точка вылета и единичный вектор от неё к цели
      const [x0, y0] = this.mouth(), dx = tx - x0, dy = ty - y0, L = Math.hypot(dx, dy) || 1, u = [dx / L, dy / L], [ox, oy] = this.mouth(u);
      return { ox, oy, ux: u[0], uy: u[1], L };
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
        const gy = E.ground ? E.ground(this.x, this.y) : null;
        this.vy += 900 * dt; this.y += this.vy * dt;
        if (E.water != null && this.y > E.water + 6) { this.gone = true; E.splash && E.splash(this.x); return; }     // фаза 3: промахнулся мимо плота — утонул
        if (gy != null && this.y > gy - 12 && this.vy > 0 && this.y < gy + 30) { this.y = gy - 12; this.vy = 0; this.onG = true; } else this.onG = false;
        if (this.onG && E.carry) this.x += E.carry(this.x, this.y + 12) * dt;     // стоит на плывущем плоту — едет вместе с ним
        if (this.onG) {
          this.vx = this.dir * (k === 'spider' ? 120 : 0);
          if (k === 'toad' && this.cd <= 0) { if (Math.abs(dx) < 220 && Math.random() < 0.5) { this.atk = 0.4; this.cd = rnd(1.4, 2.2); const [ox, oy] = this.mouth(), g = (E.g || 900) * 0.7, T = clamp(Math.abs(tx - ox) / 230, 0.45, 1.1); E.shoot({ x: ox, y: oy, vx: (tx - ox) / T, vy: (ty - oy) / T - g * T / 2, grav: 0.7, dmg: 8, t: 0, draw: L10.Minion.drawAcid }); Sound.play('fart', 0.4); }     /* навесом точно в Валеру: время полёта T, гравитация среды env.g */ else { this.vy = -380; this.vx = Math.sign(dx) * 140; this.cd = rnd(0.8, 1.4); } }
          if (k === 'spider' && this.cd <= 0 && Math.abs(dx) < 140) { this.vy = -360; this.vx = Math.sign(dx) * 220; this.cd = rnd(1.2, 2); this.atk = 0.5; }
        }
        this.x += this.vx * dt;
        if (this.cd <= 0 && Math.abs(dx) < 18 && Math.abs(this.y - (ty + 30)) < 34) { E.hurt(8, this.x); this.cd = 1; }
        if (this.y > 460) this.gone = true;
        return;
      }
      // летающие
      const want = k === 'eye' ? 170 : k === 'worm' ? 80 : k === 'bat' ? 140 : 0, sp = k === 'blob' ? 110 : 90;
      let ax = dx / d * (d > want ? 1 : -0.6), ay = dy / d * (d > want ? 1 : -0.6);
      ay += Math.sin(this.t * 3 + this.ph) * 0.8;
      this.vx += (ax * sp - this.vx) * dt * 2; this.vy += (ay * sp - this.vy) * dt * 2; this.x += this.vx * dt; this.y += this.vy * dt;
      if (k === 'bat' && this.cd <= 0 && d < 330) { this.cd = rnd(1.8, 2.8); this.atk = 0.35; const v = 220, a = this.aimAt(tx, ty); E.shoot({ x: a.ox, y: a.oy, vx: a.ux * v, vy: a.uy * v, dmg: 7, t: 0, draw: L10.Minion.drawAcid }); Sound.play('fart', 0.3); }
      if (k === 'worm') { if (this.cd <= 0 && d < 120) { this.cd = rnd(2.4, 3.2); this.atk = 1.0; Sound.play('steam', 0.6); } if (this.atk > 0) { const a = this.aimAt(tx, ty); this.fo = a; if (a.L < 84 && ((this.t * 10) | 0) % 3 === 0) E.hurt(5, this.x); } }     /* огонь всегда из пасти к Валере, урон — если она в длину струи */
      if (k === 'eye') {
        if (this.cd <= 0 && d < 360) { this.cd = rnd(2.5, 3.5); this.atk = 0.9; Sound.play('warn', 0.3); }
        if (this.atk > 0.4) this.aim = [tx, ty];     /* прицел ведёт Валеру, за 0.1 с до выстрела замирает (шанс увернуться) */
        if (this.atk > 0 && this.atk < 0.3 && !this.fired) { this.fired = 1; this.beam = 0.2; const a = this.aimAt(this.aim[0], this.aim[1]), px = tx - a.ox, py = ty - a.oy, off = Math.abs(px * a.uy - py * a.ux); if (off < 16 && px * a.ux + py * a.uy > 0) E.hurt(10, this.x); Sound.play('zap', 0.4); }
        if (this.atk <= 0) this.fired = 0;
      }
      if (k === 'blob' && this.cd <= 0 && d < 160) { this.cd = rnd(1.6, 2.4); this.atk = 0.4; this.vx = dx / d * 380; this.vy = dy / d * 380; Sound.play('punch', 0.4); }
      if (k === 'blob' && this.atk > 0 && d < 28) { E.hurt(10, this.x); this.atk = 0; }
      if (this.beam > 0) this.beam -= dt;
    }
    draw(c) {
      const k = this.kind, s = SC[k];
      const six = !!L10.fr(this.sh, k + '5');     // новые листы: 0 вылупился, 1-3 движение, 4 атака, 5 смерть
      let fr = six ? (this.dead ? 5 : this.t < 0.5 ? 0 : this.atk > 0 ? (ATKF[k] ?? 4) : [1, 2, 3, 2][((this.t * 9) | 0) % 4]) : (this.dead ? 3 : this.atk > 0 ? 2 : ((this.t * 8) | 0) % 2);
      const fl = this.dir * (FNAT[k + fr] ?? NAT[k]) < 0;
      const grow = clamp(this.t / 0.5, 0.3, 1);
      if (L10.has(this.sh)) {
        S(c, this.sh, k + fr, this.x, this.y, s * grow, { flip: fl, a: this.dead ? clamp(1.2 - this.dt, 0, 1) : 1 });
        if (this.flash > 0) S(c, this.sh, k + fr, this.x, this.y, s * grow, { flip: fl, add: 1, a: 0.6 });
      } else { c.fillStyle = '#6a7a30'; c.fillRect(this.x - 10, this.y - 10, 20, 20); }
      if (k === 'worm' && this.atk > 0 && this.fo && !this.dead && L10.has('fx10')) { const a = this.fo, sc = 0.45 + Math.sin(this.t * 30) * 0.03, half = 172 * sc * 0.5, ang = Math.atan2(a.uy, a.ux), lf = a.ux < 0; S(c, 'fx10', 'fire', a.ox + a.ux * half, a.oy + a.uy * half, sc, { rot: lf ? ang - Math.PI : ang, flip: lf, add: 1 }); }     /* одна струя из пасти к Валере (кадр червя без нарисованного огня) */
      if (k === 'eye' && this.atk > 0.3 && !this.dead) L10.Minion.ray(c, this, 3, 0.25 + Math.abs(Math.sin(this.t * 30)) * 0.2, 260);     // прицел
      if (this.beam > 0 && !this.dead) L10.Minion.ray(c, this, 9, 1, 420);
    }
    static mark(c, x, y, w, a) {     // метка будущего удара: красный луч-полоса из кадра fx10 'laser'
      const f = L10.fr('fx10', 'laser'); if (!f) return; const im = L10.tintFrame('fx10', f, 'mark', '#ff2a1a');
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.imageSmoothingEnabled = true; c.drawImage(im, 0, 0, f[2], f[3], x - w / 2, y - 4, w, 8); c.restore();
    }
    static ray(c, m, th, a, len) {     // луч кадром fx10 'laser', растянутым по направлению прицела
      const f = L10.fr('fx10', 'laser'); if (!f || !m.aim) return;
      const A = m.aimAt ? m.aimAt(m.aim[0], m.aim[1]) : { ox: m.x, oy: m.y, ux: m.aim[0] - m.x, uy: m.aim[1] - m.y }, ang = Math.atan2(A.uy, A.ux);     /* луч из глаза миньона */
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.translate(A.ox, A.oy); c.rotate(ang); c.imageSmoothingEnabled = true;
      c.drawImage(L10.img.fx10, f[0], f[1], f[2], f[3], 0, -th / 2, len, th); c.restore();
    }
    static drawAcid(c, e) { if (L10.has('fx10')) S(c, 'fx10', 'acid', e.x, e.y, 0.14, { rot: e.t * 8 }); else { c.fillStyle = '#9f6'; c.fillRect(e.x - 3, e.y - 3, 6, 6); } }
  };
})();
