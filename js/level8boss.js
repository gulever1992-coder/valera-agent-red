// Уровень 8: боссы. Арена «Петух и Паук» (Денис О. и Денис Ч., Стас на фургоне, Максим с картошкой) ->
// обрушение пола -> лаборатория, три батареи и Мегаробот -> финальная катсцена с Господином Икс и капсулой.
(() => {
  const { Foe, rnd, clamp, zy, zs, fsize, FXN, PRN } = L8.K;
  const D = () => window.L8D, N = (sh, n) => D()[sh].n.indexOf(n), E = n => N('fxE8', n);
  const P = lv => lv.pl.x + lv.cam;
  // падающий/летящий снаряд с меткой на полу
  const haz = (lv, o) => lv.haz.push(Object.assign({ t: 0, life: 1, dmg: 8, r: 26, arc: 0, s0: 0.5, s1: 1, ty: 348, spin: 0 }, o));
  const feather = (lv, x0, y0, tx, life) => haz(lv, { sh: 'fxE8', fr: E('feather'), x0, y0, tx, life, dmg: 8, r: 24, rot: Math.atan2(348 - y0, tx - x0) - Math.PI / 2, s0: 0.5, s1: 1.1 });
  const potato = (lv, x0, y0, tx, life) => haz(lv, { sh: 'fxE8', fr: E('potato'), x0, y0, tx, life, dmg: 7, r: 22, arc: 24, spin: 8, shoot: true, s0: 0.45, s1: 1 });
  const stomp = (lv, tx, life) => haz(lv, { sh: null, x0: tx, y0: 348, tx, life, dmg: 10, r: 44, boom: 0.7 });

  // ---------------------------------------------------------------- мелочь: яйца и мини-пауки
  class Egg extends Foe {
    constructor(lv, x, z = 0.04) { super(lv, x, z); this.sh = 'fxE8'; this.hp = 2; this.pts = 150; this.set('roll'); }
    frame() { return this.dead ? E('eggBoom') : (this.t * 6 | 0) % 2 ? E('egg') : E('egg2'); }
    box() { if (this.dead) return [0, 0, 0, 0]; const r = 14 * this.s + 4; return [this.x - r, this.y - r * 2, r * 2, r * 2]; }
    update(dt) {
      this.t += dt; this.stT += dt; this.flashT -= dt;
      if (this.dead) { if (this.stT > 0.35) this.gone = true; return; }
      this.z += 0.27 * dt; const d = P(this.lv) - this.x; this.x += Math.sign(d) * Math.min(Math.abs(d), 34 * dt);
      if (this.z >= 0.93) { this.gone = true; this.lv.boom(this.x, this.y - 12, 0.75); if (Math.abs(d) < 42) this.lv.hurt(12, this.x); }
    }
    draw(c, cam) { L8.spr(c, 'props8', PRN.shadow, this.x - cam, this.y + 2, this.s * 0.4, { a: 0.45 }); L8.spr(c, 'fxE8', this.frame(), this.x - cam, this.y - 13 * this.s, this.s * 1.15, { rot: this.dead ? 0 : this.t * 5 }); }
  }
  class Mini extends Foe {
    constructor(lv, x, z = 0.5) { super(lv, x, z); this.sh = 'fxE8'; this.hp = 1; this.pts = 100; this.ph = rnd(0, 6); this.set('run'); }
    frame() { return this.dead ? E('miniDead') : this.z > 0.85 ? E('leap') : (this.t * 9 | 0) % 2 ? E('mini') : E('mini2'); }
    box() { if (this.dead) return [0, 0, 0, 0]; const r = 16 * this.s + 4; return [this.x - r, this.y - r * 1.6, r * 2, r * 1.8]; }
    update(dt) {
      this.t += dt; this.stT += dt; this.flashT -= dt;
      if (this.dead) { if (this.stT > 0.35) this.gone = true; return; }
      const d = P(this.lv) - this.x; this.z = Math.min(0.96, this.z + 0.3 * dt); this.x += Math.sign(d) * Math.min(Math.abs(d), 70 * dt) + Math.sin(this.t * 9 + this.ph) * 0.8;
      if (this.z >= 0.95 && Math.abs(d) < 26) { this.gone = true; this.lv.cling = (this.lv.cling || 0) + 1; Sound.play('squeak'); }
    }
    draw(c, cam) { L8.spr(c, 'props8', PRN.shadow, this.x - cam, this.y + 2, this.s * 0.4, { a: 0.4 }); L8.spr(c, 'fxE8', this.frame(), this.x - cam, this.y - 10 * this.s, this.s * 1.2); }
  }
  // общий предок боссов: до половины здоровья бьётся, дальше — под щитом (если задан порог)
  class Boss extends Foe {
    hit(d, src) {
      if (this.dead) return;
      if (this.inv) { this.flashT = 0.03; if (Math.random() < 0.15) Sound.play('deflect'); return; }
      this.hp -= d * 4 * (this.weak ? this.weak : 1); this.flashT = 0.07; this.lv.score += 5; this.lv.stats.hits += 0;
      if (this.half != null && this.hp <= this.half) { this.hp = this.half; this.inv = true; Sound.play('checkpoint'); this.lv.say(this.name + ': В ЯРОСТИ!', 2); }
      if (this.hp <= 0) { this.hp = 0; this.dead = true; this.set('die'); }
    }
    shieldDraw(c, x, y, k) { if (this.inv) L8.spr(c, 'fxE8', E('shield'), x, y, k, { a: 0.2 + 0.08 * Math.sin(this.t * 6) }); }
  }
  // ---------------------------------------------------------------- Петух (Денис О.)
  class Rooster extends Boss {
    constructor(lv) { super(lv, 760, 0); this.sh = 'roo8'; this.hp = this.max = 900; this.half = 450; this.name = 'ПЕТУХ'; this.py = 150; this.k = 0.6; this.cd = 2.5; this.n = 0; this.ph = 0; this.set('fly'); }
    get y() { return this.py; } get s() { return this.k; }
    frame() { const s = this.st; if (s === 'missile') return 2; if (s === 'gust') return 3; if (s === 'dive') return 4; if (s === 'ground') return (this.t * 3 | 0) % 2 ? 5 : 6; if (this.inv && (this.t * 1.5 | 0) % 3 === 0) return 7; return (this.t * 6 | 0) % 2; }
    box() { const [w, h] = fsize('roo8', 0, this.k); return [this.x - w * 0.28, this.py - h * 0.9, w * 0.56, h * 0.8]; }
    go(tx, ty, k, dt, sp = 3) { this.x += (tx - this.x) * Math.min(1, dt * sp); this.py += (ty - this.py) * Math.min(1, dt * sp); this.k += (k - this.k) * Math.min(1, dt * sp); }
    update(dt) {
      this.t += dt; this.stT += dt; this.flashT -= dt; const lv = this.lv, s = this.st, rage = this.inv ? 0.72 : 1;
      this.weak = s === 'ground' ? 1.5 : 1;
      if (s === 'fly') {
        this.go(320 + 235 * Math.sin(this.t * 0.45 + this.ph), 188 + 20 * Math.sin(this.t * 1.7), 0.6, dt, 2); this.cd -= dt;
        if (this.cd <= 0) { const a = ['missile', 'crow', 'eggs', 'peck', 'gust', 'missile', 'crow', 'peck'][this.n++ % 8]; this.shot = 0; if (a === 'peck') { this.tx = P(lv); stomp(lv, this.tx, 1.05); lv.haz[lv.haz.length - 1].dmg = 0; } if (a === 'eggs') this.tx = rnd(190, 450); this.set(a); if (a === 'gust') { lv.say('ВЕТЕР! ИДИ ПРОТИВ НЕГО', 2.2); this.wd = Math.random() < 0.5 ? -1 : 1; } }
      } else if (s === 'missile') {
        if (this.stT > 0.35 && !this.shot) { this.shot = 1; Sound.play('throw'); const p0 = P(lv); for (let i = 0; i < 5; i++) feather(lv, this.x + (i % 2 ? 40 : -40) * this.k, this.py - 200 * this.k, clamp(p0 + (i - 2) * 64 + rnd(-10, 10), 30, 610), 1.0 + i * 0.13); }
        if (this.stT > 0.95) { this.set('fly'); this.cd = rnd(2.2, 3.4) * rage; }
      } else if (s === 'crow') {       // кукареку: звуковая волна, бьёт, если не в кувырке
        this.go(this.x, 176, 0.66, dt, 3);
        if (this.stT > 0.3 && !this.shot) { this.shot = 1; Sound.play('crow'); G.shake(4, 0.9); }
        if (this.shot && this.shot < 4 && this.stT > 0.3 + this.shot * 0.22) { this.shot++; lv.fx.push({ sh: 'fxE8', fr: [E('ring')], x: this.x + lv.cam, y: this.py - 245 * this.k, s: 0.4, grow: 6, t: 0, life: 0.7, fade: 1 }); }
        if (this.stT > 1.1 && !this.hitW) { this.hitW = 1; if (lv.pl.st !== 'roll') lv.hurt(6, this.x); }
        if (this.stT > 1.5) { this.hitW = 0; this.set('fly'); this.cd = rnd(2, 3) * rage; }
      } else if (s === 'eggs') {
        this.go(this.tx, 232, 0.5, dt, 4);
        if (this.stT > 0.6 + this.shot * 0.4 && this.shot < 3) { this.shot++; lv.foes.push(new Egg(lv, this.x + rnd(-36, 36))); Sound.play('land'); }
        if (this.stT > 2.2) { this.set('fly'); this.cd = rnd(2.2, 3.2) * rage; }
      } else if (s === 'peck') {
        this.go(this.tx, 150, 0.6, dt, 5); if (this.stT > 0.8) { this.set('dive'); Sound.play('shout'); }
      } else if (s === 'dive') {
        const k = clamp(this.stT / 0.28, 0, 1); this.py = 150 + (350 - 150) * k * k; this.k = 0.6 + 0.4 * k;
        if (k >= 1) { G.shake(6, 0.3); Sound.play('stomp'); lv.puff(this.x, 344, 2, 1); if (Math.abs(P(lv) - this.tx) < 46) lv.hurt(16, this.tx); this.set('ground'); }
      } else if (s === 'ground') {
        if (this.stT > 0.5 && !this.crowed) { this.crowed = 1; Sound.play('crow'); }
        if (this.stT > 2.3) { this.crowed = 0; this.set('rise'); }
      } else if (s === 'rise') {
        this.go(this.x, 188, 0.6, dt, 3.5); if (this.stT > 0.7) { this.set('fly'); this.cd = rnd(1.8, 2.8) * rage; }
      } else if (s === 'gust') {
        this.go(320, 176, 0.72, dt, 3);
        if (this.stT > 0.7 && this.stT < 2.6) { lv.wind = this.wd; if (Math.random() < 0.3) lv.fx.push({ sh: 'fxE8', fr: [E('gust')], x: this.wd > 0 ? rnd(-20, 200) : rnd(440, 660), y: rnd(200, 340), s: rnd(0.6, 1.3), t: 0, life: 0.7, vx: this.wd * rnd(300, 420), vy: 0, fade: 1 }); } else lv.wind = 0;
        if (this.stT > 2.8) { lv.wind = 0; this.set('fly'); this.cd = rnd(2.2, 3.2) * rage; }
      }
    }
    draw(c, cam) {
      const sx = this.x - cam + (this.flashT > 0 ? rnd(-2, 2) : 0), gy = this.st === 'ground' || this.st === 'dive' ? 352 : 300 + (this.py - 150) * 0.2;
      L8.spr(c, 'props8', PRN.shadow, sx, gy, this.k * 1.6, { a: this.st === 'ground' ? 0.5 : 0.22 });
      L8.spr(c, 'roo8', this.frame(), sx, this.py, this.k);
      const [, h] = fsize('roo8', 0, this.k); this.shieldDraw(c, sx, this.py - h * 0.5, this.k * 4.2);
    }
  }
  // ---------------------------------------------------------------- Паук (Денис Ч.)
  class Spider extends Boss {
    constructor(lv) { super(lv, 44, 0); this.sh = 'spi8'; this.hp = this.max = 900; this.half = 450; this.name = 'ПАУК'; this.u = 0.1; this.dir = 1; this.k = 0.5; this.cd = 3.5; this.n = 0; this.py = 150; this.rot = 0; this.set('crawl'); }
    get y() { return this.onFloor() ? 302 : 1; } get s() { return this.k; }
    onFloor() { return this.st === 'floor' || this.st === 'hatch' || this.st === 'floor2'; }
    path(u) { if (u < 0.25) return [44, 215 - (u / 0.25) * 150, Math.PI / 2]; if (u < 0.75) return [72 + ((u - 0.25) / 0.5) * 496, 46, Math.PI]; return [596, 65 + ((u - 0.75) / 0.25) * 150, -Math.PI / 2]; }
    frame() { const s = this.st; if (s === 'aim' || s === 'beam') return 2; if (s === 'jumpIn' || s === 'jumpOut') return 3; if (s === 'floor' || s === 'floor2') return (this.t * 4 | 0) % 2 ? 4 : 5; if (s === 'hatch') return 6; if (this.inv && (this.t * 1.5 | 0) % 3 === 0 && this.onFloor()) return 7; return (this.t * 5 | 0) % 2; }
    box() { const [w, h] = fsize('spi8', this.frame(), this.k); return [this.x - w * 0.3, this.py - h * 0.32, w * 0.6, h * 0.64]; }
    eye() { return [this.x, this.py]; }
    update(dt) {
      this.t += dt; this.stT += dt; this.flashT -= dt; const lv = this.lv, s = this.st, rage = this.inv ? 0.72 : 1;
      this.weak = this.onFloor() ? 2 : 1;
      if (s === 'crawl') {
        this.u += this.dir * 0.075 * dt / rage; if (this.u > 0.97) { this.u = 0.97; this.dir = -1; } if (this.u < 0.03) { this.u = 0.03; this.dir = 1; }
        const q = this.path(this.u); this.x = q[0]; this.py = q[1]; this.rot = q[2]; this.k = 0.5; this.cd -= dt;
        if (this.cd <= 0) { if (++this.n % 3 === 0) { this.jx = this.x; this.jy = this.py; this.set('jumpIn'); Sound.play('jump'); } else { this.tx = P(lv); this.set('aim'); Sound.play('warn'); } }
      } else if (s === 'aim') {
        if (this.stT > 0.8) { this.set('beam'); Sound.play('zap'); G.shake(3, 0.2); if (Math.abs(P(lv) - this.tx) < 24) lv.hurt(14, this.tx); lv.fx.push({ sh: 'fxE8', fr: [E('burst')], x: this.tx, y: 340, s: 1.4, t: 0, life: 0.35, fade: 1 }); }
      } else if (s === 'beam') {
        if (this.stT > 0.4) { if (this.inv && !this.dbl) { this.dbl = 1; this.tx = P(lv); this.set('aim'); Sound.play('warn'); } else { this.dbl = 0; this.set('crawl'); this.cd = rnd(1.8, 2.8) * rage; } }
      } else if (s === 'jumpIn') {
        const k = clamp(this.stT / 0.7, 0, 1); this.x = this.jx + (320 - this.jx) * k; this.py = this.jy + (236 - this.jy) * k - Math.sin(k * Math.PI) * 60; this.k = 0.5 + 0.3 * k; this.rot = 0;
        if (k >= 1) { G.shake(7, 0.35); Sound.play('stomp'); lv.fx.push({ sh: 'fxE8', fr: [E('ring')], x: 320, y: 318, s: 2.6, t: 0, life: 0.4, fade: 1 }); if (Math.abs(P(lv) - 320) < 66) lv.hurt(8, 320); this.shot = 0; this.set('floor'); }
      } else if (s === 'floor') { if (this.stT > 0.8) { this.set('hatch'); lv.say('МИНИ-ПАУКИ! СБИВАЙ', 2); }
      } else if (s === 'hatch') {
        if (this.shot < 5 && this.stT > 0.3 + this.shot * 0.42) { this.shot++; lv.foes.push(new Mini(lv, this.x + rnd(-40, 40), 0.52)); }
        if (this.stT > 2.7) this.set('floor2');
      } else if (s === 'floor2') { if (this.stT > 1.7) { this.u = Math.random() < 0.5 ? 0.12 : 0.88; const q = this.path(this.u); this.jx = q[0]; this.jy = q[1]; this.set('jumpOut'); Sound.play('jump'); }
      } else if (s === 'jumpOut') {
        const k = clamp(this.stT / 0.7, 0, 1); this.x = 320 + (this.jx - 320) * k; this.py = 236 + (this.jy - 236) * k - Math.sin(k * Math.PI) * 60; this.k = 0.8 - 0.3 * k;
        if (k >= 1) { this.set('crawl'); this.cd = rnd(2.0, 3.0) * rage; }
      }
    }
    draw(c, cam) {
      const sx = this.x - cam + (this.flashT > 0 ? rnd(-2, 2) : 0), s = this.st, fl = this.onFloor() || s === 'jumpIn' || s === 'jumpOut';
      if (fl) L8.spr(c, 'props8', PRN.shadow, sx, 322, this.k * 2.2, { a: 0.45 });
      L8.spr(c, 'spi8', this.frame(), sx, this.py, this.k, { rot: fl ? 0 : this.rot });
      this.shieldDraw(c, sx, this.py, this.k * 4.4);
      if (s === 'aim' || s === 'beam') {     // лазер: тонкая линия-предупреждение, потом луч
        const ln = Math.hypot(340 - this.py, this.tx - this.x), an = Math.atan2(340 - this.py, this.tx - this.x) - Math.PI / 2;
        c.save(); c.translate(sx, this.py); c.rotate(an);
        if (s === 'aim') { const f = D().fxC8.f[N('fxC8', 'laser')]; c.globalAlpha = (this.stT * 14 | 0) % 2 ? 0.9 : 0.4; c.drawImage(L8.img.fxC8, f[0] + f[2] * 0.38, f[1], f[2] * 0.24, f[3], -2, 0, 4, ln); }
        else { const f = D().fxE8.f[E('beam')]; c.drawImage(L8.img.fxE8, f[0], f[1], f[2], f[3], -9, 0, 18, ln); }
        c.restore();
        if (s === 'aim') L8.spr(c, 'fx8', FXN.warn, this.tx - cam, 334, 0.5);
      }
    }
  }
  // ---------------------------------------------------------------- арена: общие помехи
  const arenaUpdate = (lv, dt, o) => {
    const p = lv.pl, I = G.Input, A = lv.A;
    // ветер петуха
    if (lv.wind) { p.x = clamp(p.x + lv.wind * 118 * dt, 40, 600); A.windT = (A.windT || 0) + dt; if ((p.x <= 41 || p.x >= 599) && A.windT > 0.5) { A.windT = 0; lv.hurt(4, p.x); } }
    // мини-пауки на Валере: трясти влево-вправо
    if (lv.cling > 0) {
      A.clT = (A.clT || 0) + dt; if (A.clT > 0.7) { A.clT = 0; p.inv = 0; lv.hurt(2 * lv.cling, p.x); }
      if (I.pressed('left') || I.pressed('right')) { A.mash = (A.mash || 0) + 1; G.shake(2, 0.1); }
      if (A.mash >= 6) { for (let i = 0; i < lv.cling; i++) lv.fx.push({ sh: 'fxE8', fr: [E('miniDead')], x: p.x + lv.cam + rnd(-30, 30), y: rnd(290, 340), s: 1, t: 0, life: 0.5, vx: rnd(-160, 160), vy: -160, g: 600, fade: 1 }); lv.cling = 0; A.mash = 0; Sound.play('hit'); lv.score += 100; }
    }
    // припасы
    A.sup = (A.sup || 0) + dt; if (A.sup > 8) { A.sup = 0; lv.pickup(Math.random() < 0.5 ? 'kefir' : Math.random() < 0.75 ? 'mag' : 'vog', rnd(110, 530), 0.82); }
    if (!o.max) return;
    // Максим на балке кидает картошку
    A.mT = (A.mT || 0) + dt; const M = A.max;
    if (M.st === 'sit' && A.mT > M.cd) { M.st = 'wind'; A.mT = 0; } else if (M.st === 'wind' && A.mT > 0.5) { M.st = 'throw'; A.mT = 0; Sound.play('throw'); potato(lv, M.x - 30, M.y - 40, P(lv), 1.0); } else if (M.st === 'throw' && A.mT > 0.45) { M.st = 'sit'; A.mT = 0; M.cd = rnd(3.8, 6); }
    // Стас на фургоне: полоса-предупреждение, затем наезд из глубины
    A.vT = (A.vT || 0) + dt;
    const calm = A.roo && (A.roo.inv || A.spi.inv);
    if (!A.van && !calm && A.vT > A.vCd) { A.van = { lane: clamp(P(lv), 70, 570), t: -1.15 }; A.vT = 0; A.vCd = rnd(13, 18); Sound.play('honk'); lv.say('СТАС ЕДЕТ! В СТОРОНУ!', 1.6); }
    if (A.van) { const v = A.van; v.t += dt; if (v.t > 0 && !v.rev) { v.rev = 1; Sound.play('honk'); } const z = v.t / 1.2; if (z >= 0.9 && !v.hit) { v.hit = 1; if (Math.abs(P(lv) - v.lane) < 58) { lv.hurt(22, v.lane); G.shake(8, 0.4); } } if (z > 1.5) A.van = null; }
  };
  const vanDraw = (lv, c, front) => {
    const v = lv.A && lv.A.van; if (!v) return;
    if (v.t < 0) { if (!front && (v.t * 10 | 0) % 2) { L8.spr(c, 'fx8', FXN.warn, v.lane, 250, 1.1); L8.spr(c, 'props8', PRN.shadow, v.lane, 348, 1.6, { a: 0.5 }); } return; }
    const z = v.t / 1.2; if ((z > 0.95) !== front) return;
    L8.spr(c, 'van8', (v.t * 12 | 0) % 2, v.lane, zy(Math.min(z, 1)) + Math.max(0, z - 1) * 260, 0.07 + 0.78 * z * z);
  };
  const clingDraw = (lv, c) => {
    if (!(lv.cling > 0)) return; const p = lv.pl;
    for (let i = 0; i < Math.min(lv.cling, 5); i++) L8.spr(c, 'fxE8', E('leap'), p.x + [-16, 14, 0, -26, 24][i] + rnd(-1, 1), [300, 310, 268, 330, 326][i] + rnd(-1, 1), 0.6);
    if ((lv.t * 6 | 0) % 2) G.text('ЖМИ ВЛЕВО-ВПРАВО!', p.x, 232, { align: 'center', size: 8, color: '#ffd84a', outline: true });
  };
  const chaos = (lv, dt, lvl) => {      // обломки с потолка и разряды: чем злее босс, тем чаще
    const A = lv.A; A.fxT = (A.fxT || 0) - dt; if (A.fxT > 0) return; A.fxT = lvl === 1 ? 1.5 : lvl === 2 ? 0.75 : 0.38;
    lv.fx.push({ sh: 'fxE8', fr: [E('scrap')], x: rnd(30, 610) + lv.cam, y: -10, s: rnd(0.5, 1), t: 0, life: 0.95, vx: rnd(-30, 30), vy: 250, g: 520, rot: 1, fade: 1 });
    if (lvl > 1) lv.fx.push({ sh: 'fxE8', fr: [E('bolt')], x: rnd(40, 600) + lv.cam, y: rnd(40, 200), s: rnd(0.6, 1.3), t: 0, life: 0.16 });
    if (lvl === 3 && Math.random() < 0.3) G.shake(3, 0.2);
  };
  const full = (lv, c, mid) => { if (lv.cutImg && L8.img[lv.cutImg]) c.drawImage(L8.img[lv.cutImg], 0, 0, 1280, 720, 0, 0, 640, 360); if (mid) mid(); if (lv.cutFade > 0) { c.fillStyle = `rgba(0,0,0,${clamp(lv.cutFade, 0, 1)})`; c.fillRect(0, 0, 640, 360); } };

  // ---------------------------------------------------------------- F. Петух и Паук
  L8.STAGES.boss = {
    bg: 'bossbg', title: null, arena: true,
    build(lv) {
      lv.A = { max: { x: 255, y: 132, st: 'sit', cd: 5 }, vCd: 12, on: false }; lv.wind = 0; lv.cling = 0; lv.pl.res = Math.max(lv.pl.res, 240);
      return [[0.3, () => {
        Scene.run(function* () {
          yield 0.4;
          yield* Scene.say('deniso', 'Мистер Валера! Какая настойчивость. Даже жаль портить такой вечер.');
          yield* Scene.say('denisch', 'Коллега, запускаем прототипы?');
          yield* Scene.say('deniso', 'Запускаем. Петух - мой!');
          yield* Scene.say('denisch', 'А мне, как всегда, паук...');
          yield* Scene.say('stas', 'Мы с Максом тоже подъедем!');
          yield* Scene.say('maxim', 'Картошки на всех хватит!');
          yield* Scene.say('valera', 'Цирк уехал, клоуны остались. Ну, подходи по одному.');
        }, () => { const r = new Rooster(lv), s = new Spider(lv); lv.foes.push(s, r); lv.bars = [r, s]; lv.A.on = true; lv.A.roo = r; lv.A.spi = s; lv.say('ДВА БОССА. УВОРАЧИВАЙСЯ!', 2.5); try { Music.play('alarm'); } catch (e) {} });
      }], [1e9, () => {}]];
    },
    update(lv, dt) {
      const A = lv.A; if (!A.on) return;
      arenaUpdate(lv, dt, { max: true }); if (A.roo.inv || A.spi.inv) chaos(lv, dt, 1);
      if (A.roo.inv && A.spi.inv && !A.fall) {       // оба на половине: пол рушится
        A.fall = 1; lv.haz = []; lv.wind = 0; A.van = null; lv.cling = 0;
        Scene.run(function* () {
          Scene.dialogTop = false; G.shake(8, 1.2); Sound.play('crumble'); yield 0.8;
          lv.cutImg = 'fall0'; G.shake(10, 0.8); Sound.play('crumble'); yield 0.8;
          lv.cutImg = 'fall1'; lv.cutVal = { t: 0, life: 4, drop: 1 }; G.shake(14, 0.9); Sound.play('crash'); yield 1.2;
          yield* Scene.say('valera', 'Пол!.. Да вы что, строили по ГОСТу?!');
          lv.cutImg = 'fall2'; G.shake(16, 1.0); Sound.play('boom'); yield 1.1;
          for (let i = 0; i < 10; i++) { lv.cutFade = i / 9; yield 0.06; }
        }, () => { lv.cutImg = null; lv.cutVal = null; lv.cutFade = 0; lv.bars = null; lv.carry = { hp: Math.max(lv.pl.hp, 70), ammo: 30, res: Math.max(lv.pl.res, 240), vog: Math.max(lv.pl.vog, 3), vest: lv.pl.vest }; lv.stage = 'mega'; lv.reset(); });
      }
    },
    drawBack(lv, c) { const M = lv.A && lv.A.max; if (M && lv.A.on) L8.spr(c, 'max8', M.st === 'wind' ? 1 : M.st === 'throw' ? 2 : 0, M.x, M.y, 0.9); },
    drawMid(lv, c) { vanDraw(lv, c, false); },
    drawFront(lv, c) {
      vanDraw(lv, c, true); clingDraw(lv, c);
      const R = lv.A && lv.A.roo; if (R && R.st === 'crow' && R.stT > 0.3 && !lv.cutImg) G.text('КУ-КА-РЕ-КУ!', clamp(R.x - lv.cam, 70, 570), clamp(R.py + 14, 60, 300), { align: 'center', size: 16, color: '#ffd84a', outline: true });
      full(lv, c, () => { const q = lv.cutVal; if (!q || !q.drop) return; const y = (q.t * 170) % 560 - 60;
        L8.spr(c, 'van8', 2, 330, y - 150, 0.3, { rot: q.t * 1.1 }); L8.spr(c, 'roo8', 7, 190, y + 30, 0.42, { rot: q.t * 1.6 }); L8.spr(c, 'spi8', 7, 455, y - 40, 0.36, { rot: -q.t * 2 });
        L8.spr(c, 'val8', 8, 320 + Math.sin(q.t * 5) * 8, 110 + (q.t * 110) % 250, 0.6, { rot: Math.sin(q.t * 4) * 0.5 }); });
    },
  };

  // ---------------------------------------------------------------- G. Мегаробот и три батареи
  class Battery extends Foe {
    constructor(lv, x, y, side) { super(lv, x, 0); this.py = y; this.side = side; this.sh = 'batt8'; this.max = this.hp = 60; this.k = side ? 0.9 : 0.6; this.down = false; }
    get y() { return 1; } get s() { return this.k; }
    frame() { const o = this.side ? 3 : 0; return this.down ? o + 2 : this.hp < this.max * 0.5 ? o + 1 : o; }
    box() { if (this.down) return [0, 0, 0, 0]; const [w, h] = fsize('batt8', this.frame(), this.k); return [this.x - w * 0.4, this.py - h * 0.45, w * 0.8, h * 0.9]; }
    hit(d) { if (this.down) return; this.hp -= d * 4; this.flashT = 0.07; if (this.hp <= 0) { this.down = true; this.lv.boom(this.x, this.py, 0.9); this.lv.score += 500; } }
    update(dt) { this.t += dt; this.flashT -= dt; }
    draw(c, cam) { L8.spr(c, 'batt8', this.frame(), this.x - cam + (this.flashT > 0 ? rnd(-1.5, 1.5) : 0), this.py, this.k, { flip: this.side < 0 }); if (!this.down && (this.t * 3 | 0) % 2) L8.spr(c, 'fxE8', E('bolt'), this.x - cam, this.py - 34 * this.k, 0.35, { a: 0.7 }); }
  }
  class Mega extends Boss {
    constructor(lv) { super(lv, 320, 0); this.sh = 'mega8'; this.hp = this.max = 1100; this.name = 'МЕГАРОБОТ'; this.py = 326; this.k = 0.78; this.slots = []; this.cd = 2.5; this.pose = 0; this.poseT = 0; this.inv = true; this.rings = []; this.sweep = null; this.z = 0.05; this.side = 1; this.sideT = 0; this.set('idle'); }
    get y() { return 240; } get s() { return this.k; }
    frame() { if (this.st === 'die') return this.stT > 2.4 ? 5 : 4; if (this.poseT > 0) return this.pose; return this.hp < this.max * 0.33 && (this.t * 2 | 0) % 2 ? 4 : 0; }
    box() { if (this.st === 'die') return [0, 0, 0, 0]; const [w, h] = fsize('mega8', 0, this.k); return [this.x - w * 0.3, this.py - h * 0.95, w * 0.6, h * 0.85]; }
    phase() { const r = this.hp / this.max; return r > 0.66 ? 1 : r > 0.33 ? 2 : 3; }
    setPose(p, t) { this.pose = p; this.poseT = t; }
    start(kind) {
      const lv = this.lv, me = this, p0 = P(lv); let t = 0, n = 0;
      const A = {
        storm() { me.setPose(2, 1.9); return dt => { t += dt; while (n < 10 && t > n * 0.17) { feather(lv, me.x + (n % 2 ? 90 : -90) * me.k, me.py - 300 * me.k, clamp(60 + ((n * 173 + (p0 | 0)) % 520), 30, 610), 1.05); n++; } return t > 2; }; },
        scream() { me.setPose(2, 1.8); Sound.play('crow'); return dt => { t += dt; while (n < 3 && t > n * 0.5) { me.rings.push({ t: 0 }); n++; } return t > 2.2; }; },
        laser() { const dir = Math.random() < 0.5 ? 1 : -1; me.setPose(2, 3.3); Sound.play('warn'); return dt => { t += dt; const k = clamp((t - 0.8) / 2.3, 0, 1); me.sweep = { x: 320 - dir * 270 + dir * 540 * k, on: t > 0.8 }; if (t > 0.8 && !n) { n = 1; Sound.play('zap'); } if (t > 3.1) { me.sweep = null; return true; } return false; }; },
        punch() { me.setPose(3, 1.5); const tx = p0; stomp(lv, tx, 0.85); lv.haz[lv.haz.length - 1].dmg = 0; return dt => { t += dt; if (t > 0.5 && !n) { n = 1; Sound.play('honk'); haz(lv, { sh: 'van8', fr: 0, x0: me.x + 70, y0: me.py - 200 * me.k, tx, ty: 350, life: 0.42, dmg: 20, r: 52, boom: 0.9, s0: 0.14, s1: 0.75 }); } return t > 1.5; }; },
        stomp() { me.setPose(0, 0.1); stomp(lv, p0, 1.0); stomp(lv, clamp(p0 + rnd(90, 170) * (Math.random() < 0.5 ? -1 : 1), 50, 590), 1.15); stomp(lv, rnd(60, 580), 1.3); G.shake(4, 0.3); Sound.play('stomp'); return dt => (t += dt) > 1.5; },
        potato() { me.setPose(0, 1.5); return dt => { t += dt; while (n < 6 && t > n * 0.2) { potato(lv, me.x - 120 * me.k, me.py - 190 * me.k, clamp(P(lv) + rnd(-70, 70), 30, 610), 0.95); n++; Sound.play('throw'); } return t > 1.7; }; },
        eggs() { return dt => { t += dt; while (n < 3 && t > n * 0.35) { lv.foes.push(new Egg(lv, me.x + (n - 1) * 90, 0.12)); n++; } return t > 1.2; }; },
        minis() { return dt => { t += dt; while (n < 4 && t > n * 0.3) { lv.foes.push(new Mini(lv, me.x + rnd(-110, 110), 0.5)); n++; } return t > 1.4; }; },
      };
      return { kind, run: A[kind]() };
    }
    update(dt) {
      this.t += dt; this.stT += dt; this.flashT -= dt; this.poseT -= dt; const lv = this.lv;
      if (this.st === 'die') {
        if (Math.random() < 0.3) lv.boom(this.x + rnd(-110, 110), this.py - rnd(20, 250), rnd(0.5, 1.2));
        if (Math.random() < 0.35) lv.fx.push({ sh: 'fxE8', fr: [E('scrap')], x: this.x + rnd(-60, 60), y: this.py - rnd(80, 240), s: rnd(0.6, 1.3), t: 0, life: 1.1, vx: rnd(-260, 260), vy: rnd(-320, -120), g: 620, rot: 1, fade: 1 });
        if (this.stT > 3.4 && !this.gone) { this.gone = true; G.flash(0.5, '#fff'); lv.boom(this.x, this.py - 120, 2.4); }
        return;
      }
      this.sideT += dt; if (this.sideT > 7) { this.sideT = 0; this.side = -this.side; }
      { const tx = this.inv ? 320 + 165 * this.side : 320, ox = this.x; this.x += clamp(tx - this.x, -85 * dt, 85 * dt); this.moving = Math.abs(this.x - ox) > 0.05; this.walkT = (this.walkT || 0) + dt * (this.moving ? 1 : 0.25); }
      for (const r of this.rings) { r.t += dt; if (!r.hit && r.t > 0.62 && r.t < 0.8) { r.hit = 1; lv.hurt(6, this.x); } } this.rings = this.rings.filter(r => r.t < 1.1);
      if (this.sweep && this.sweep.on && Math.abs(P(lv) - this.sweep.x) < 19) lv.hurt(14, this.sweep.x);
      this.slots = this.slots.filter(a => !a.run(dt));
      this.cd -= dt; const ph = this.phase();
      if (this.cd <= 0 && this.slots.length < Math.min(3, ph + 1)) {
        const pool = (ph === 1 ? ['storm', 'stomp', 'punch', 'potato', 'laser'] : ph === 2 ? ['storm', 'scream', 'laser', 'punch', 'stomp', 'potato', 'eggs'] : ['storm', 'scream', 'laser', 'punch', 'stomp', 'potato', 'eggs', 'minis']).filter(k => !this.slots.some(a => a.kind === k) && k !== this.last);
        const k = pool[Math.random() * pool.length | 0]; this.last = k; this.slots.push(this.start(k)); this.cd = ph === 1 ? rnd(1.6, 2.2) : ph === 2 ? rnd(1.1, 1.6) : rnd(0.7, 1.1);
      }
    }
    hit(d, src) { const was = this.dead; super.hit(d, src); if (!was && this.dead) { this.slots = []; this.sweep = null; this.rings = []; this.lv.haz = []; Sound.play('boom'); G.shake(12, 3); } }
    body(c, sx, by) {        // ноги-лапы шагают: левая и правая группы поочерёдно поднимаются, корпус покачивается
      const fr = this.frame(); if (fr === 5) { L8.spr(c, 'mega8', fr, sx, by, this.k); return; }
      const f = D().mega8.f[fr], im = L8.img.mega8, k = this.k * 0.5, X0 = Math.round(sx - f[4] * k), Y0 = Math.round(by - f[5] * k), cut = Math.round(f[3] * 0.7), top = Math.round(f[3] * 0.75);
      const ph = this.walkT * 7, amp = this.moving ? 1 : 0.3; c.imageSmoothingEnabled = true;
      for (const side of [0, 1]) {
        const a = Math.sin(ph + side * Math.PI), w = f[2] / 2, s0 = side * w;
        c.save(); c.translate(X0 + w * k, Y0 + cut * k); c.rotate((side ? 1 : -1) * Math.max(0, a) * 0.05 * amp); c.translate(0, -Math.max(0, a) * 6 * amp);
        c.drawImage(im, f[0] + s0, f[1] + cut, w, f[3] - cut, (s0 - w) * k, 0, w * k, (f[3] - cut) * k); c.restore();
      }
      const bob = -Math.abs(Math.sin(ph)) * 2.5 * amp;
      c.drawImage(im, f[0], f[1], f[2], top, X0, Y0 + bob, f[2] * k, top * k);
    }
    draw(c, cam) {
      const sx = this.x - cam + (this.flashT > 0 || this.st === 'die' ? rnd(-2.5, 2.5) : 0), by = this.py + Math.sin(this.t * 2) * 2;
      L8.spr(c, 'props8', PRN.shadow, sx, 330, 3.4, { a: 0.5 });
      this.body(c, sx, by);
      const [, h] = fsize('mega8', 0, this.k); this.shieldDraw(c, sx, by - h * 0.5, 5.2);
      for (const r of this.rings) L8.spr(c, 'fxE8', E('ring'), sx, by - h * 0.85 + r.t * 190, 0.4 + r.t * 7.5, { a: clamp(1.1 - r.t, 0, 0.5) });
      if (this.sweep) {
        const ex = sx, ey = by - h * 0.36, ln = Math.hypot(346 - ey, this.sweep.x - ex), an = Math.atan2(346 - ey, this.sweep.x - ex) - Math.PI / 2;
        c.save(); c.translate(ex, ey); c.rotate(an);
        if (this.sweep.on) { const f = D().fxE8.f[E('beam')]; c.drawImage(L8.img.fxE8, f[0], f[1], f[2], f[3], -11, 0, 22, ln); } else { const f = D().fxC8.f[N('fxC8', 'laser')]; c.globalAlpha = (this.t * 14 | 0) % 2 ? 0.9 : 0.4; c.drawImage(L8.img.fxC8, f[0] + f[2] * 0.38, f[1], f[2] * 0.24, f[3], -2, 0, 4, ln); }
        c.restore();
        if (this.sweep.on) L8.spr(c, 'fxE8', E('burst'), this.sweep.x, 344, 1.1); else L8.spr(c, 'fx8', FXN.warn, this.sweep.x, 334, 0.6);
      }
    }
  }
  L8.STAGES.mega = {
    bg: 'labbg', title: null, arena: true,
    build(lv) {
      lv.A = { on: false, open: 0 }; lv.wind = 0; lv.cling = 0;
      return [[0, () => { lv.A.b = [new Battery(lv, 66, 196, -1), new Battery(lv, 320, 186, 0), new Battery(lv, 574, 196, 1)]; lv.foes.push(...lv.A.b); }], [0.4, () => {
        Scene.run(function* () {
          G.shake(8, 0.8); Sound.play('crash'); yield 0.9;
          yield* Scene.say('valera', 'Живой... А это ещё что за подвал?');
          yield* Scene.say('deniso', 'Секретная лаборатория, мистер Валера. Экскурсии не предусмотрены.');
          yield* Scene.say('stas', 'Фургон в хлам! Парни, план "Б"?');
          yield* Scene.say('denisch', 'План "Б". Общая сборка!');
          yield* Scene.say('maxim', 'Чур я в середине!');
          lv.cutVal = { t: 0, life: 1.7, asm: 1 }; G.shake(6, 1.7); Sound.play('crane'); yield 1.0; Sound.play('zap'); yield 0.7;
          lv.cutVal = null; G.shake(12, 0.8); Sound.play('boom'); G.flash(0.5, '#fff'); yield 0.4;
        }, () => {
          const m = new Mega(lv);
          lv.foes.push(m); lv.A.m = m; lv.bars = [m]; lv.A.on = true; lv.say('БЕЙ БАТАРЕИ! ОДНУ ОН ПРИКРЫВАЕТ', 4);
        });
      }], [1e9, () => {}]];
    },
    update(lv, dt) {
      const A = lv.A; if (!A.on) return; const m = A.m;
      arenaUpdate(lv, dt, {}); if (!m.dead) chaos(lv, dt, m.phase());
      if (m.dead) { if (m.gone && !A.end) { A.end = 1; L8.finale(lv); } return; }
      if (A.open > 0) {            // щит снят: 30 секунд, потом батареи перезагружаются
        A.open -= dt; m.inv = false;
        if (A.open <= 0) { for (const b of A.b) { b.down = false; b.hp = b.max; } m.inv = true; Sound.play('lever'); lv.say('БАТАРЕИ ПЕРЕЗАГРУЗИЛИСЬ!', 2.5); }
      } else if (A.b.every(b => b.down)) { A.open = 30; m.inv = false; Sound.play('checkpoint'); G.flash(0.25, '#7fe'); }
    },
    drawFront(lv, c) {
      clingDraw(lv, c);
      const A = lv.A; if (A && A.on && !A.m.dead && !lv.cutImg) { if (A.open > 0) G.text('ЩИТ СНЯТ: ' + Math.ceil(A.open), 320, 26, { align: 'center', size: 8, color: A.open < 8 && (lv.t * 6 | 0) % 2 ? '#f66' : '#7fe' , outline: true }); else G.text('ЩИТ: БАТАРЕИ ' + A.b.filter(b => !b.down).length + '/3', 320, 26, { align: 'center', size: 8, color: '#ffd84a', outline: true }); }
      full(lv, c);
      const a = lv.cutVal; if (a && a.asm) { const k = clamp(a.t / a.life, 0, 1), e = k * k, m = (x0, y0) => [x0 + (320 - x0) * e, y0 + (300 - y0) * e];
        let v = m(320, -40); L8.spr(c, 'van8', 2, v[0], v[1] - 60 * (1 - e), 0.42, { rot: (1 - e) * 3 });
        v = m(40, 250); L8.spr(c, 'roo8', k < 0.5 ? (a.t * 8 | 0) % 2 : 7, v[0], v[1], 0.5, { rot: e * 0.6 });
        v = m(600, 150); L8.spr(c, 'spi8', 3, v[0], v[1] - 60, 0.44, { rot: -e * 2 });
        for (let i = 0; i < 4; i++) if (Math.random() < k) L8.spr(c, 'fxE8', E('bolt'), 320 + rnd(-90, 90), 210 + rnd(-80, 60), rnd(0.6, 1.4));
        if (k > 0.7) L8.spr(c, 'fxE8', E('ring'), 320, 220, (k - 0.7) * 14, { a: 0.6 }); }
      const q = lv.cutVal && !lv.cutVal.asm ? lv.cutVal : null; if (q) { const k = clamp(q.t / q.life, 0, 1); L8.spr(c, 'valS8', (q.t * 8 | 0) % 4, 250 + 150 * k, 372 - 118 * k, 1 - 0.55 * k, { flip: true }); }
    },
  };

  // ---------------------------------------------------------------- финальная катсцена: монитор, Икс, капсула на гидрорельсах
  L8.finale = lv => {
    lv.bars = null; lv.foes = []; lv.haz = []; lv.cling = 0; lv.A.on = false;
    try { Music.play('title'); } catch (e) {}
    Scene.run(function* () {
      Scene.dialogTop = false; yield 1.6;
      for (let i = 0; i <= 8; i++) { lv.cutFade = i / 8; yield 0.05; }
      lv.cutImg = 'mon0'; Sound.play('zap'); for (let i = 8; i >= 0; i--) { lv.cutFade = i / 8; yield 0.05; }
      yield 1.2; lv.cutImg = 'mon1'; Sound.play('blip'); yield 0.8;
      yield* Scene.say('mrx', 'Поздравляю с победой, мистер Валера.');
      lv.cutImg = 'mon2';
      yield* Scene.say('mrx', 'Прошу последовать за мной.');
      lv.cutImg = 'mon3';
      yield* Scene.say('mrx', 'Вам о стольком нужно узнать.');
      yield* Scene.say('valera', 'Опять "последовать"... Ладно. Хуже уже не будет.');
      lv.cutImg = 'tun0'; Sound.play('steam'); yield 1.5;
      lv.cutImg = 'tun1'; Sound.play('crane'); G.shake(2, 0.5); yield 1.5;
      lv.cutImg = 'tun2'; Sound.play('door'); yield 0.9;
      lv.cutVal = { t: 0, life: 2.2 }; yield 2.3; lv.cutVal = null;
      lv.cutImg = 'cap0'; yield 1.4;
      yield* Scene.say('valera', 'Мягко... Ну, вези, раз позвали.');
      lv.cutImg = 'cap1'; Sound.play('door'); yield 1.8;
      lv.cutImg = 'tun3'; Sound.play('steam'); yield 2.0;
      for (let i = 0; i <= 10; i++) { lv.cutFade = i / 10; yield 0.08; }
      yield 0.6;
    }, () => { lv.cutImg = null; G.onLevelComplete(lv); });
  };
})();
