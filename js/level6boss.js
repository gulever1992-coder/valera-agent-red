'use strict';
// ============ УРОВЕНЬ 6: босс Ванделорд и арена на берегу ============
const BG6 = () => L6.ARENA_X;

// ---------- портал-пентаграмма со змеями ----------
L6.Portal = class {   // змея вылезает из пентаграммы в земле и кусает в сторону Валеры: стоять нельзя — уворачивайся
  constructor(x) { this.x = x; this.t = 0; this.life = 5.6; this.hitCool = 0; this.face = 1; this.bitten = -1; Sound.play('boom', 0.9); }
  phase() { const t = this.t - 0.9; if (t < 0 || this.t > this.life - 0.6) return { fr: 0, k: -1 };
    const c = t % 1.7, n = Math.floor(t / 1.7); return c < 0.35 ? { fr: 1, n } : c < 0.7 ? { fr: 2, n } : c < 1.05 ? { fr: 3, n, bite: true } : c < 1.35 ? { fr: 4, n } : { fr: c < 1.5 ? 5 : 0, n }; }
  update(dt, ar) {
    this.t += dt; this.hitCool -= dt;
    const pl = ar.player, p = this.phase();
    if (p.fr === 1 || p.fr === 2) this.face = pl.x >= this.x ? 1 : -1;   // целится, пока поднимается
    if (p.fr === 2 && this.hiss !== p.n) { this.hiss = p.n; Sound.play('squeak', 0.5); }
    if (p.bite && this.bitten !== p.n && !pl.dead) { const bx = this.x + this.face * 26;
      if (Math.abs(pl.x - bx) < 30 * Math.max(1, pl.sc * 0.8) && pl.y > L6.GROUND - 80) { this.bitten = p.n; if (pl.hurt(8, this.x, ar.world)) G.say(pl, U.choice(['Змеи!!!', 'Кусается!']), 1); } }
    return this.t < this.life;
  }
  draw(c, cx) {
    const open = this.t < 0.9 ? this.t / 0.9 : this.t > this.life - 0.6 ? Math.max(0, (this.life - this.t) / 0.6) : 1, p = this.phase();
    c.save(); c.translate(this.x - cx, L6.GROUND + 2); c.scale(this.face * (0.4 + open * 0.6), 0.4 + open * 0.6); c.globalAlpha = Math.min(1, open * 1.5);
    Spr.draw(c, 'snk6', p.fr, 0, 0, 1); c.restore();
    if (p.fr === 0 && this.t > 0.9 && this.t < this.life - 0.6 && (G.t * 8 | 0) % 2) { c.fillStyle = 'rgba(255,40,40,0.25)'; c.beginPath(); c.ellipse(this.x - cx, L6.GROUND - 2, 30, 6, 0, 0, Math.PI * 2); c.fill(); }
  }
};

// ---------- грибная броня босса ----------
L6.Shroom = class {
  constructor(x, ar) { this.x = x; this.y = L6.GROUND; this.t = 0; this.hp = 6; this.maxHp = 6; this.dead = false; this.flash = 0; Sound.play('pickup', 0.5); }
  get box() { return { x: this.x - 18, y: this.y - 70, w: 36, h: 70 }; }
  get grown() { return this.t > 1.4; }
  hit(dmg) {
    if (!this.grown) return false;
    this.hp -= dmg; this.flash = 0.12; Sound.play('hit');
    if (this.hp <= 0) { this.dead = true; Sound.play('boom', 1.3); G.shake(4, 0.25); FX.popText(this.x, this.y - 80, 'ГРИБ ПОГИБ!', '#ffd84a'); return true; }
    return false;
  }
  zap(k, ar) { this.hit(6); return true; }
  update(dt) { this.t += dt; if (this.flash > 0) this.flash -= dt; return !this.dead; }
  draw(c, cx, ar) {
    const fr = this.t < 0.35 ? 6 : this.t < 0.8 ? 7 : this.t < 1.4 ? 8 : 9;
    const bump = this.flash > 0 ? 1.06 : 1;
    if (this.dead) { Spr.drawC(c, 'vfx6', 11, this.x - cx, this.y - 40, 0, 1); return; }
    const f = Spr.frame('vfx6', fr), h = f ? f[3] / 2 : 60;
    Spr.drawC(c, 'vfx6', fr, this.x - cx, this.y - h * 0.5 + 6, 0, bump);
  }
};

// ---------- грибная волна: мухоморы выстреливают из земли цепочкой ----------
L6.Quake = class {
  constructor(x, dir, speed, range) { this.x0 = x; this.dir = dir; this.sp = speed || 240; this.range = range || 0; this.t = 0; this.pops = []; this.next = 0; this.dead = false; }
  update(dt, ar) {
    this.t += dt; const pl = ar.player, head = this.x0 + this.dir * this.sp * this.t;
    while (this.next * 30 < this.sp * this.t && (!this.range || this.next * 30 < this.range)) { const x = this.x0 + this.dir * (40 + this.next * 30); this.next++; if (x > BG6() + 8 && x < BG6() + 632) { this.pops.push({ x, t: 0 }); FX.dust(x, L6.GROUND, 2); if (this.next % 2) Sound.play('punch', 0.35); } }
    for (const p of this.pops) { p.t += dt;
      if (!p.hit && p.t > 0.08 && p.t < 0.45 && !pl.dead && Math.abs(pl.x - p.x) < 16 * Math.max(1, pl.sc * 0.8) && pl.y > L6.GROUND - 40) { p.hit = true; if (pl.hurt(9, p.x, ar.world)) pl.vy = -320; } }
    this.pops = this.pops.filter(p => p.t < 0.8);
    if (this.range && this.next * 30 >= this.range) return this.pops.length > 0;
    return !(head < BG6() - 40 || head > BG6() + 680) || this.pops.length > 0;
  }
  draw(c, cx) {
    for (const p of this.pops) { const k = p.t, fr = k < 0.08 ? 6 : k < 0.18 ? 7 : 8, a = k > 0.55 ? Math.max(0, 1 - (k - 0.55) / 0.25) : 1, rise = k < 0.18 ? k / 0.18 : 1;
      c.globalAlpha = a; const f = Spr.frame('vfx6', fr), h = f ? f[3] / 2 : 40; Spr.drawC(c, 'vfx6', fr, p.x - cx, L6.GROUND + 6 - h * 0.5 * rise, 0, 0.75); c.globalAlpha = 1; }
  }
};

// ---------- тёмная спора: медленно летит за Валерой, сбивается ударом/заклинанием ----------
L6.Spore = class {
  constructor(x, y) { this.x = x; this.y = y; this.vx = 0; this.vy = -60; this.t = 0; this.dead = false; this.life = 5; }
  get box() { return { x: this.x - 12, y: this.y - 12, w: 24, h: 24 }; }
  hit() { if (this.dead) return true; this.dead = true; FX.burst(this.x, this.y, 10, { colors: ['#401030', '#c02060', '#ffffff'], speed: 120, life: 0.4, grav: 0 }); Sound.play('pickup', 0.6); return true; }
  zap() { return this.hit(); }
  update(dt, ar) {
    this.t += dt; const pl = ar.player, tx = pl.x, ty = pl.y - 40 * pl.sc;
    const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy) || 1, acc = this.t < 0.6 ? 0 : 260;
    this.vx += dx / d * acc * dt; this.vy += dy / d * acc * dt; const v = Math.hypot(this.vx, this.vy), cap = 125; if (v > cap) { this.vx *= cap / v; this.vy *= cap / v; }
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (Math.random() < dt * 30) FX.spawn({ x: this.x, y: this.y, vx: U.rand(-15, 15), vy: U.rand(-15, 15), grav: 0, life: 0.4, size: 2, color: ['#c02060', '#401030', '#ff80b0'][U.randi(0, 2)] });
    if (!pl.dead && U.overlap(this.box, pl.box)) { pl.hurt(10, this.x, ar.world); this.hit(); }
    if (this.t > this.life) this.hit();
    return !this.dead;
  }
  draw(c, cx) {
    const px = this.x - cx, R = 15 + Math.sin(this.t * 10) * 3, g = c.createRadialGradient(px, this.y, 2, px, this.y, R);
    g.addColorStop(0, 'rgba(255,200,230,0.9)'); g.addColorStop(0.5, 'rgba(200,30,90,0.55)'); g.addColorStop(1, 'rgba(60,10,40,0)');
    c.fillStyle = g; c.beginPath(); c.arc(px, this.y, R, 0, Math.PI * 2); c.fill();
    Spr.drawC(c, 'proj6', 5, px, this.y, Math.atan2(this.vy, this.vx), 0.8);
  }
};

// ---------- питон: летит, обвивает, возвращается ----------
L6.PyShot = class {
  constructor(x, y, dir, boss) { this.x = x; this.y = y; this.dir = dir; this.boss = boss; this.mode = 'fly'; this.t = 0; this.dead = false; this.vx = dir * 380; Sound.play('throw'); }
  get box() { return { x: this.x - 22, y: this.y - 10, w: 44, h: 20 }; }
  update(dt, ar) {
    this.t += dt; const pl = ar.player;
    if (this.mode === 'fly') {
      this.x += this.vx * dt;
      if (!pl.dead && !pl.stuck && U.overlap(this.box, pl.box)) {
        this.mode = 'wrap'; Sound.play('hurt'); G.shake(3, 0.2);
        G.say(pl, 'Задушит!', 1.2);
        pl.stuck = { t: 0, tick: 0.5, free: 0, need: 9, onFree: dead => { this.mode = 'back'; this.boss.pyAway = true; if (!dead) { G.say(pl, 'Фух, вырвался!', 1.1); Sound.play('pickup'); } } };
      }
      if (this.x < BG6() - 10 || this.x > BG6() + 650) this.mode = 'back';
    } else if (this.mode === 'wrap') {
      this.x = pl.x; this.y = pl.y - 34 * pl.sc;
      if (!pl.stuck) this.mode = 'back';
    } else if (this.mode === 'back') {
      const b = this.boss, dx = b.x - this.x; this.y += ((L6.GROUND - 6) - this.y) * Math.min(1, dt * 6);
      this.x += Math.sign(dx) * 420 * dt;
      if (Math.abs(dx) < 20) { this.dead = true; b.pyAway = false; b.pyCool = 3; }
    }
    return !this.dead;
  }
  draw(c, cx, ar) {
    const pl = ar.player;
    if (this.mode === 'wrap') return;   // питон уже нарисован на кадрах Валеры (py0-py2)
    const fr = this.mode === 'back' ? 7 : [4, 5, 6, 5][(this.t * 10 | 0) % 4];
    c.save(); c.translate(this.x - cx, this.y); if (this.mode === 'fly' ? this.dir < 0 : this.boss.x < this.x) c.scale(-1, 1); Spr.drawC(c, 'b_py', fr, 0, 0, 0, 1); c.restore();
  }
};

// ---------- метка в земле: грибная ловушка под ногами (телеграф — земля шевелится, потом мухомор выстреливает) ----------
L6.Mark = class {
  constructor(x, delay, dmg) { this.x = x; this.t = 0; this.delay = delay == null ? 0.8 : delay; this.dmg = dmg || 9; this.popped = false; this.hitDone = false; if (this.delay > 0.2) Sound.play('squeak', 0.35); }
  update(dt, ar) {
    this.t += dt; const pl = ar.player, k = this.t - this.delay;
    if (k < 0) { if (Math.random() < dt * 28) FX.spawn({ x: this.x + U.rand(-15, 15), y: L6.GROUND - 2, vx: U.rand(-25, 25), vy: U.rand(-110, -40), grav: 260, life: 0.35, size: 2, color: ['#6a4020', '#c8a070', '#ff4060'][U.randi(0, 2)] }); }
    else if (!this.popped) { this.popped = true; G.shake(2, 0.12); Sound.play('punch', 0.5); FX.dust(this.x, L6.GROUND, 4);
      FX.burst(this.x, L6.GROUND - 4, 14, { colors: ['#6a4020', '#c8a070', '#ff4060', '#401030'], speed: 170, life: 0.5, grav: 500 }); }
    if (this.popped && !this.hitDone && k < 0.32 && !pl.dead && Math.abs(pl.x - this.x) < 20 * Math.max(1, pl.sc * 0.8) && pl.y > L6.GROUND - 52) { this.hitDone = true; if (pl.hurt(this.dmg, this.x, ar.world)) pl.vy = -300; }
    return k < 0.8;
  }
  draw(c, cx) {   // трещина в земле (vande2:5): дрожит и растёт, потом раскрывается с выбросом земли
    const k = this.t - this.delay, x = this.x - cx;
    if (k < 0) {
      const g = Math.min(1, this.t / Math.max(0.01, this.delay)), sc = 0.55 + 0.45 * g;
      c.globalAlpha = 0.6 + 0.4 * ((G.t * 10 | 0) % 2); Spr.draw(c, 'vande2', 5, x + Math.sin(this.t * 40) * 1.2, L6.GROUND + 3, 1, { scale: sc }); c.globalAlpha = 1; return;
    }
    c.globalAlpha = k > 0.5 ? Math.max(0, 1 - (k - 0.5) / 0.3) : 1; Spr.draw(c, 'vande2', 5, x, L6.GROUND + 3, 1, { scale: 1.25 }); c.globalAlpha = 1;
  }
};

// бесконечный портал (наказание за «прописку» на пятачке): телеграф — вихрь в земле; стоишь на нём — проваливаешься и падаешь сверху обратно на него
L6.Void = class {
  constructor(x, delay, max) { this.x = x; this.t = 0; this.delay = delay; this.max = max; this.n = 0; this.lastSw = -9; this.cool = 0; Sound.play('squeak', 0.6); }
  get open() { const k = this.t - this.delay; return k >= 0 && (k < 0.55 || (this.n > 0 && this.n < this.max && this.t - this.lastSw < 2.2)); }
  update(dt, ar) {
    this.t += dt; this.cool -= dt; const pl = ar.player, k = this.t - this.delay;
    const cols = ['#b040ff', '#6020a0', '#ff60ff', '#201030'];
    if (k < 0 || this.open) { if (Math.random() < dt * (k < 0 ? 30 : 55)) { const a = Math.random() * 6.28, r = U.rand(10, 34);
      FX.spawn({ x: this.x + Math.cos(a) * r, y: L6.GROUND - 2 + Math.sin(a) * 4, vx: -Math.cos(a) * r * 2, vy: U.rand(-60, -10), grav: 0, life: 0.4, size: 2, color: cols[U.randi(0, 3)] }); } }
    if (k >= 0 && !this.popped) { this.popped = true; G.shake(3, 0.2); Sound.play('boom', 0.6); FX.burst(this.x, L6.GROUND - 4, 16, { colors: cols, speed: 150, life: 0.5, grav: 0 }); }
    if (this.open && this.cool <= 0 && !pl.dead && pl.onGround && Math.abs(pl.x - this.x) < 30 * Math.max(1, pl.sc * 0.8)) {
      this.n++; this.lastSw = this.t; this.cool = 0.5;
      FX.burst(pl.x, L6.GROUND - 20, 18, { colors: cols, speed: 120, life: 0.5, grav: 0 }); Sound.play('squeak', 0.9);
      pl.hurt(this.n === 1 ? 6 : 4, this.x, ar.world); pl.x = this.x; pl.vx = 0; pl.vy = 60; pl.y = 24; pl.onGround = false; pl.climb = null;
      FX.burst(pl.x, 10, 14, { colors: cols, speed: 110, life: 0.5, grav: 0 });
      G.say(pl, this.n === 1 ? U.choice(['Ааа, куда?!', 'Пол пропал!']) : this.n < this.max ? U.choice(['Опять?!', 'Да сколько можно!', 'Отойти надо было!']) : 'Выплюнуло...', 1);
    }
    return k < 0 || this.open;
  }
  draw(c, cx) {
    const k = this.t - this.delay, x = this.x - cx;
    if (k < 0) { c.globalAlpha = 0.5 + 0.4 * ((G.t * 10 | 0) % 2); Spr.draw(c, 'vande2', 5, x + Math.sin(this.t * 40), L6.GROUND + 3, 1, { scale: 0.6 + 0.4 * Math.min(1, this.t / this.delay) }); c.globalAlpha = 1; return; }
    if (this.open) Spr.draw(c, 'vande2', 5, x, L6.GROUND + 3, 1, { scale: 1.3 + Math.sin(this.t * 12) * 0.05 });
  }
};

// ---------- Ванделорд ----------
// ИИ: «часы агрессии» тикают и во время уклонов/попаданий — босс атакует, даже если его закидывают заклинаниями.
// Уклоны — по запасу сил (stam), видит снаряды (время до попадания и высоту) и кулаки. Стояние на месте (campT) наказывается
// метками в земле, мортирами и прыжками на позицию с упреждением. Комбо 2–3 атаки -> «выдохся» (окно уязвимости).
L6.Vande = class {
  constructor(x) {
    this.x = x; this.y = L6.GROUND; this.facing = -1; this.maxHp = Math.round(350 * (G.BOSS_MULT || 1)); this.hp = this.maxHp;   // финальный босс: втрое крепче прошлых
    this.state = 'wait'; this.st = 0; this.t = 0; this.anim = 'idle'; this.animT = 0; this.phase = 1; this.flash = 0; this.flashCol = null;
    this.seq = null; this.sq = 0; this.sqT = 0; this.think = 1.2; this.vx = 0; this.vy = 0; this.slow = 0; this.stun = 0; this.invul = false;
    this.headH = 100; this.voice = 150; this.quip = 5; this.pyCool = 2; this.pyAway = false; this.lastAct = ''; this.combo = 0; this.lastHit = -9; this.dodgeCool = 0; this.actCool = {};
    this.vanishT = 0; this.alpha = 1; this.dying = 0; this.vuln = 0; this.wasInvul = false; this.baseY = L6.GROUND; this.perchT = 0; this.platX = null;
    this.stam = 2; this.stamT = 0; this.aggro = 1.6; this.campX = x; this.campT = 0; this.zx = null; this.zy = 0; this.zoneT = 0; this.punCD = 4; this.flinchCool = 0; this.fleeCool = 0; this.stunCool = 0; this.danceCool = 0;
    this.chain = []; this.comboN = 0; this.tiredT = 0; this.counter = null; this.shroomPh = {}; this.reactCool = 0; this.strafeT = 0; this.strafeX = x; this.pauseT = 0; this.gloatN = 0; this.lastPlHp = 100; this.stats = { dodges: 0, acts: 0, tired: 0 };
  }
  get box() { return { x: this.x - 13, y: this.y - 90, w: 26, h: 90 }; }
  play(a) { if (this.anim !== a) { this.anim = a; this.animT = 0; } }
  lead() { return [0, 0.5, 0.75, 0.9][this.phase]; }
  aimAng(x0, y0, tx, ty) {   // прицел, но не круче ±0.3 рад (с дюны ±0.6): от выстрела всегда можно уйти прыжком/приседом/под дугу
    const h = tx >= x0 ? 0 : Math.PI, r = Math.atan2(Math.sin(Math.atan2(ty - y0, tx - x0) - h), Math.cos(Math.atan2(ty - y0, tx - x0) - h)), lim = this.perchT > 0 ? 0.6 : 0.3;
    return h + U.clamp(r, -lim, lim);
  }
  aimX(pl, T) { return U.clamp(pl.x + (pl.vx || 0) * T * this.lead(), BG6() + 20, BG6() + 620); }   // куда Валера добежит через T сек
  // ---- последовательности действий: [{a: анимация, d: сек, on: функция в начале шага, lock: не прерывается, tele: телеграф — не ускоряется сильно}]
  doSeq(name, steps) { this.seq = steps; this.sq = -1; this.sqT = 0; this.state = 'act'; this.lastAct = name; this.nextStep(); }
  nextStep() {
    this.sq++;
    if (this.sq >= this.seq.length) { this.afterAct(); return; }
    const s = this.seq[this.sq]; this.sqT = 0; if (s.a) this.play(s.a); if (s.on) s.on();
  }
  afterAct() {   // конец действия: продолжить комбо, выдохнуться или взять паузу
    const P = this.phase; this.seq = null; this.state = 'idle'; this.st = 0; this.alpha = 1;
    if (this.chain.length) { this.aggro = 0.12; this.think = 0.12; return; }
    this.aggro = [0, U.rand(1.0, 1.5), U.rand(0.75, 1.15), U.rand(0.55, 0.85)][P] * (this.perchT > 0 ? 0.7 : 1);
    if (this.comboN >= 2 && this.perchT <= 0) {
      this.state = 'tired'; this.tiredT = P === 3 ? 1.4 : 1.7; this.aggro += this.tiredT; this.stats.tired++;
      FX.popText(this.x, this.y - 112, 'ВЫДОХСЯ! БЕЙ!', '#ff9040'); if (Math.random() < 0.5) this.say(U.choice(['Уф... дай отдышаться...', 'Ох, годы...']));
    }
    this.comboN = 0;
    if (this.state === 'idle' && this.gloat) { this.gloat = false;   // попал по Валере — короткая насмешка (все позы по очереди)
      const T = ['shout', 'point', 'crossed', 'clap', 'bow', 'stare', 'laugh', 'cackle', 'hood', 'aura', 'skyArms', 'rage', 'beckon', 'stroke', 'hiss', 'glow'];
      const a = T[this.gloatN++ % T.length]; if (a === 'stroke' && this.pyAway) return;
      this.doSeq('gloat', [{ a, d: 0.5 }]); if (Math.random() < 0.35) this.say(U.choice(['Ха-ха!', 'Получил?', 'Грибной привет!', 'Ещё хочешь?'])); }
  }
  say(t, shout) { G.say(this, t, 1.8, { shout: !!shout }); }
  update(dt, ar) {
    const pl = ar.player, P = this.phase;
    this.urgentNow = false; this.t += dt; this.st += dt; this.animT += dt; this.quip -= dt; this.dodgeCool -= dt; this.pyCool -= dt; this.flinchCool -= dt; this.fleeCool -= dt; this.stunCool -= dt; this.danceCool -= dt; this.reactCool -= dt;
    if (ar.player.hp < this.lastPlHp && !ar.player.dead) this.gloat = true; this.lastPlHp = ar.player.hp;
    for (const k in this.actCool) this.actCool[k] -= dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.slow > 0) this.slow -= dt;
    this.invul = ar.shrooms.some(s => s.grown && !s.dead);
    if (this.vuln > 0) this.vuln -= dt;
    if (this.wasInvul && !this.invul && this.state !== 'dying') {   // броня сломана: окно для атаки
      this.vuln = 4.5; this.stun = Math.max(this.stun, 1.6); this.seq = null; this.chain = []; this.comboN = 0; this.state = 'idle'; this.alpha = 1; ar.portals = []; Sound.play('boom', 1.2); G.shake(5, 0.4);
      if (this.perchT > 0 || this.y < L6.GROUND - 2) { this.perchT = 0; this.platX = null; this.y = this.baseY = L6.GROUND; }   // падает с дюны
      FX.popText(this.x, this.y - 112, 'БРОНЯ СЛОМАНА! БЕЙ!', '#ff8040'); this.say('Мои грибочки!..'); }
    this.wasInvul = this.invul;
    // силы на уклоны восстанавливаются
    const sMax = [0, 4, 5, 6][P];
    if (this.stam < sMax) { this.stamT += dt; if (this.stamT >= [0, 0.9, 0.7, 0.5][P]) { this.stamT = 0; this.stam++; } } else this.stamT = 0;
    // стоит ли Валера на месте
    if (Math.abs(pl.x - this.campX) > 48) { this.campX = pl.x; this.campT = 0; } else this.campT += dt;
    const camping = this.campT > [0, 1.8, 1.4, 1.1][P]; this.camping = camping;
    // «прописка» в радиусе ~5 м: копится время, потом бесконечный портал под ноги
    if (this.zx == null || Math.abs(pl.x - this.zx) > 75 || Math.abs(pl.y - this.zy) > 90) { this.zx = pl.x; this.zy = pl.y; this.zoneT = 0; } else this.zoneT += dt;
    this.punCD -= dt;
    const dx = pl.x - this.x, adx = Math.abs(dx), faceP = () => { this.facing = dx > 0 ? 1 : -1; };
    const sp = (P === 3 ? 1.35 : P >= 2 ? 1.2 : 1) * (this.slow > 0 ? 0.6 : 1);
    if (this.quip <= 0 && this.state !== 'dying' && this.state !== 'down' && this.state !== 'wait') { this.quip = U.rand(7, 11); this.say(camping ? U.choice(['Стоишь? Прорастёшь!', 'Пустил корни, Валера?', 'Стой-стой, я прицелюсь.']) : U.choice(['Грибочки мои, грибочки!', 'Не мешай нашему раю!', 'Ты ещё не гриб? Исправим.', 'Вова мой, и точка.'])); }
    if (this.state === 'wait') { this.play('idle'); return; }
    if (this.state === 'down') { return; }
    if (this.state === 'dying') { this.dieUpdate(dt, ar); return; }
    if (this.state === 'hop') { this.hopUpdate(dt, ar); return; }
    if (this.state !== 'act') this.aggro -= dt * (camping ? 2.2 : 1);
    if (this.stun > 0) { this.stun -= dt; this.play(this.vuln > 0 ? 'tired' : 'dizzy'); if (this.stun <= 0) { this.state = 'idle'; this.st = 0; } return; }
    if (this.state === 'tired') { this.tiredT -= dt; this.play('tired'); if (Math.random() < dt * 6) FX.spawn({ x: this.x + U.rand(-8, 8), y: this.y - 92, vx: U.rand(-20, 20), vy: -30, grav: 60, life: 0.5, size: 2, color: '#bfe8ff' }); if (this.tiredT <= 0) { this.state = 'idle'; this.st = 0; } return; }
    // Валера стоит на дюне дольше 1.5 с — Ванделорд из спокойной позы прыгает к нему и бьёт
    if (pl.onGround && !pl.dead && pl.y < L6.GROUND - 20) this.tableT = (this.tableT || 0) + dt; else this.tableT = 0;
    if (this.tableT > 1.5 && (this.state === 'idle' || this.state === 'hurt') && this.vuln <= 0 && this.punHop(ar)) return;
    if (this.platX) { this.perchT = Math.max(0.01, this.perchT - dt); if (this.perchT <= 0.01 && this.state === 'idle') { this.perchT = 0; this.perform(Math.random() < 0.55 ? 'dive' : 'tp', ar); return; } }   // на дюне недолго: время идёт и во время колдовства
    // ---- уклонения: видит снаряды (успеет ли долететь и на какой высоте) и замах кулака ----
    const canDodge = (this.state === 'idle' || this.state === 'hurt') && this.stam >= 1 && this.dodgeCool <= 0 && this.vuln <= 0;
    if (canDodge) {
      for (const s of ar.spells) {
        if (s.dead || s.reacted) continue;
        const rx = this.x - s.x; if (rx * s.vx <= 0 && !s.seek) continue;
        const d = Math.abs(rx), tt = s.seek ? d / 220 : d / (Math.abs(s.vx) || 1);
        if (tt > 0.3 || d < 16) continue;
        const py = s.y + (s.seek || s.wave ? 0 : s.vy * tt);
        if (py < this.y - 104 || py > this.y + 12) { if (tt < 0.12) s.reacted = true; continue; }   // мимо — не тратит силы
        s.reacted = true;
        if (Math.random() < (this.chain.length || this.comboN > 0 ? 0.15 : [0, 0.8, 0.88, 0.94][P])) { this.dodge({ vx: s.vx || -rx, y: py, seek: s.seek }, ar); break; }
      }
    }
    if (this.state !== 'dodge' && canDodge && pl.atk && pl.atk.t < 0.05 && !pl.atk.seen && adx < 66 && pl.facing * dx < 0) {
      pl.atk.seen = true;
      if (Math.random() < (this.chain.length || this.comboN > 0 ? 0.15 : [0, 0.8, 0.88, 0.94][P])) { this.dodge({ vx: pl.facing, y: this.y - 50, fist: true }, ar); if (Math.random() < 0.85 + 0.05 * P) this.counter = 'palm'; }
    }
    switch (this.state) {
      case 'idle': {
        faceP();
        if (this.perchT > 0) this.play('idle');
        else {   // не стоит: кружит вокруг Валеры на нужной дистанции, меняет сторону, короткие паузы с позами
          const want = camping ? 110 : [0, 165, 150, 135][P];
          this.strafeT -= dt;
          if (this.strafeT <= 0) {
            this.strafeT = U.rand(0.7, 1.3); const cur = Math.sign(this.x - pl.x || 1), side = Math.random() < (P >= 2 ? 0.45 : 0.3) ? -cur : cur;
            this.strafeX = U.clamp(pl.x + side * (want + U.rand(-30, 40)), BG6() + 40, BG6() + 600);
            if (Math.random() < 0.3) { this.pauseT = U.rand(0.25, 0.5); this.poseN = (this.poseN || 0) + 1; this.pose = this.pyAway ? 'idle' : ['beckon', 'smirk', 'hiss', 'stroke'][this.poseN % 4]; }   // позы со змеёй на плече по кругу (b_py 8-11)
          }
          const ddx = this.strafeX - this.x;
          if (this.pauseT > 0) { this.pauseT -= dt; this.play(this.pose || 'idle'); }
          else if (Math.abs(ddx) > 8) { const far = Math.abs(ddx) > 110; this.x += Math.sign(ddx) * (far ? 165 : 85) * sp * dt; this.play(far ? 'run' : 'walk'); if (far) this.facing = Math.sign(ddx); }
          else this.play('idle');
        }
        if (this.aggro <= 0 && this.st > 0.1) this.choose(ar, adx, dx, camping);
        break;
      }
      case 'act': {
        this.sqT += dt; const s = this.seq[this.sq];
        if (s.move) this.x += s.move * this.facing * dt;
        if (s.upd) s.upd(dt);
        if (this.state === 'act' && this.seq && this.sqT >= s.d / (s.fixed ? 1 : s.tele ? Math.min(sp, 1.15) : sp)) this.nextStep();
        break;
      }
      case 'dodge': {
        this.dt2 += dt; const k = this.dt2 / this.dDur;
        if (this.dKind === 'jump') { this.x += this.dvx * dt; this.vy += 1500 * dt; this.y += this.vy * dt; if (this.y >= this.baseY) { this.y = this.baseY; this.play('land'); } else this.play(this.vy < -120 ? 'jumpUp' : this.vy < 140 ? 'apex' : 'fall'); }
        else if (this.dKind === 'flip') { this.x += this.dvx * dt; }
        else if (this.dKind === 'side') { this.x += this.dvx * dt * (1 - k); }
        else if (this.dKind === 'vanish') { this.alpha = k < 0.45 ? 1 - k / 0.45 : k > 0.55 ? (k - 0.55) / 0.45 : 0; if (!this.teleported && k > 0.5) { this.teleported = true; this.y = this.baseY = L6.GROUND; this.perchT = 0; this.platX = null;
          const l = pl.x - 170, r = pl.x + 170, side = l < BG6() + 40 ? 1 : r > BG6() + 600 ? -1 : (Math.random() < 0.5 ? -1 : 1);
          this.x = U.clamp(pl.x + side * 170, BG6() + 30, BG6() + 610); this.facing = this.x < pl.x ? 1 : -1; FX.burst(this.x, this.y - 40, 10, { colors: ['#201028', '#4a2060', '#802040'], speed: 80, type: 'puff', size: 5, life: 0.8, grav: -10 }); } }
        this.x = U.clamp(this.x, BG6() + 30, BG6() + 610);
        if (this.platX && this.perchT > 0) this.x = U.clamp(this.x, this.platX[0], this.platX[1]);
        if (this.dt2 >= this.dDur) { this.y = this.baseY; this.alpha = 1; this.state = 'idle'; this.st = 0; faceP();
          if (!this.counter && Math.random() < 0.3) this.gloat = true;   // увернулся — дразнит
          if (this.counter && (this.tableT > 0.3 || this.perchT > 0)) { this.counter = null; if (!this.punHop(ar) && this.perchT > 0) this.perform('dive', ar); }
          else if (this.counter) { const c = this.counter; this.counter = null; this.perform(c === 'palm' && adx > 130 ? 'dash' : c === 'bolt' && adx < 150 ? 'palm' : c, ar); } else this.counter = null; }
        break;
      }
      case 'hurt':
        this.x = U.clamp(this.x + this.vx * dt, BG6() + 30, BG6() + 610); this.vx *= 0.86;
        if (this.st > 0.25) { this.state = 'idle'; this.st = 0; }
        break;
    }
    this.x = U.clamp(this.x, BG6() + 30, BG6() + 610);
    if (this.platX && this.perchT > 0) this.x = U.clamp(this.x, this.platX[0], this.platX[1]);
    if (this.phase === 1 && this.hp <= this.maxHp * 0.66 && this.state !== 'dying') this.enrage(ar);
    else if (this.phase === 2 && this.hp <= this.maxHp * 0.33 && this.state !== 'dying') this.enrage3(ar);
  }
  arenaPlats(ar) { return ar.world.plats.filter(p => p.oneway && p.y < L6.GROUND - 20 && p.x > BG6() - 20 && p.x + p.w < BG6() + 660 && p.w > 40); }
  flee(ar) {   // серия попаданий — укрывается: прыгает на дальнюю дюну или убегает к краю арены
    const pl = ar.player, ps = this.arenaPlats(ar).filter(p => Math.abs(p.x + p.w / 2 - pl.x) > 200);
    this.say(U.choice(['Ай! Хватит!', 'Не достанешь!', 'Отступаю!'])); this.fleeCool = 10; this.chain = []; this.comboN = 0;
    FX.burst(this.x, this.y - 50, 12, { colors: ['#201028', '#4a2060', '#ffd84a'], speed: 110, life: 0.5, grav: 0 });
    if (this.perchT <= 0 && (!ps.length || Math.random() < 0.5)) { this.actCool.relocate = 0; this.perform('relocate', ar); this.dodgeCool = 0.4; return; }   // перебегает на другой край
    if (ps.length) { const p = ps.reduce((b, q) => Math.abs(q.x - pl.x) > Math.abs(b.x - pl.x) ? q : b); this.hopTo(p.x + p.w / 2, p.y, p); }
    else this.hopTo(pl.x > BG6() + 320 ? BG6() + 50 : BG6() + 590, L6.GROUND, null);
    this.dodgeCool = 0.4;
  }
  hopTo(tx, ty, plat, o = {}) {
    this.state = 'hop'; this.seq = null; this.hp0 = { x0: this.x, y0: this.y, x1: tx, y1: ty, t: 0, d: o.d || 0.7, h: o.h || 90, plat, onLand: o.onLand };
    this.facing = tx > this.x ? 1 : -1; this.play('jumpUp'); Sound.play('jump', 0.8);
  }
  hopUpdate(dt, ar) {
    const h = this.hp0; h.t += dt; const k = Math.min(1, h.t / h.d);
    this.x = h.x0 + (h.x1 - h.x0) * k; this.y = h.y0 + (h.y1 - h.y0) * k - Math.sin(k * Math.PI) * h.h;
    this.play(k < 0.4 ? 'jumpUp' : k < 0.6 ? 'apex' : 'fall');
    if (k >= 1) { this.y = this.baseY = h.y1; this.platX = h.plat ? [h.plat.x + 10, h.plat.x + h.plat.w - 10] : null;
      this.perchT = h.plat ? (this.phase === 3 ? 3 : 3.8) : 0; this.play('land'); FX.dust(this.x, this.y, 5); G.shake(2, 0.15);
      if (h.plat) this.say(U.choice(['Достань меня тут!', 'Сверху виднее!', 'Ха! Не дотянешься!']));
      if (h.onLand) { h.onLand(); if (this.state === 'act') return; }   // удар о землю — своя короткая поза (окно для атаки)
      this.afterAct(); this.st = 0; if (!h.onLand && !this.chain.length) this.aggro = Math.min(this.aggro, 0.5); }
  }
  punHop(ar) {   // прыжок на дюну, где стоит Валера: присел (телеграф) — прыжок — удар
    const pl = ar.player; if (pl.dead || !pl.onGround || pl.y >= L6.GROUND - 20) return false;
    const p = this.arenaPlats(ar).find(q => pl.x > q.x - 6 && pl.x < q.x + q.w + 6 && Math.abs(pl.y - q.y) < 14); if (!p) return false;
    this.tableT = 0; this.chain = []; this.comboN = 0; this.stats.punHop = (this.stats.punHop || 0) + 1; this.facing = pl.x > this.x ? 1 : -1;
    if (Math.random() < 0.6) this.say(U.choice(['С дюны не спрячешься!', 'Наверху тебе не рай!', 'Слезай, грибок!']));
    this.doSeq('punHop', [{ a: 'crouch', d: 0.32, lock: true, tele: true, on: () => FX.dust(this.x, this.y, 4) },
      { a: 'crouch', d: 0.01, on: () => { const tx = U.clamp(pl.x, p.x + 10, p.x + p.w - 10); this.hopTo(tx, p.y, p, { d: 0.6, h: 110, onLand: () => this.punLand(ar, p) }); } }]);
    return true;
  }
  punLand(ar, p) {
    const pl = ar.player; G.shake(4, 0.25); Sound.play('boom', 0.8); FX.dust(this.x, this.y, 8);
    if (!pl.dead && Math.abs(pl.x - this.x) < 44 * Math.max(1, (pl.sc || 1) * 0.8) && Math.abs(pl.y - this.y) < 46) { pl.hurt(9, this.x, ar.world); if (pl.fling) pl.fling(this.x, (pl.x >= this.x ? 1 : -1) * 220, -260); }
    this.perchT = 1.2; this.doSeq('punHop', [{ a: 'slamLand', d: 0.45, fixed: true }, { a: 'idle', d: 0.1 }]);
  }
  slam(ar) {   // приземление с прыжка: ударная волна под ногами
    const pl = ar.player; G.shake(5, 0.3); Sound.play('boom', 0.9); FX.dust(this.x, this.y, 8);
    FX.burst(this.x, L6.GROUND - 4, 12, { colors: ['#6a4020', '#c8a070', '#ffd84a'], speed: 120, life: 0.5, grav: 300 });
    if (!pl.dead && Math.abs(pl.x - this.x) < 40 * Math.max(1, pl.sc * 0.8) && pl.y > L6.GROUND - 46) pl.hurt(9, this.x, ar.world);
    if (this.phase >= 2) ar.quakes.push(new L6.Quake(this.x, -1, 280, 130), new L6.Quake(this.x, 1, 280, 130));
    this.perchT = 0; this.platX = null; this.doSeq(this.lastAct || 'leap', [{ a: 'slamLand', d: 0.45, fixed: true }, { a: 'idle', d: 0.1 }]);
  }
  canReact() { return !['hop', 'dying', 'down', 'wait', 'dodge', 'tired'].includes(this.state) && this.stun <= 0 && !(this.state === 'act' && /^rage/.test(this.lastAct || '')) && !(this.state === 'act' && this.lastAct === 'tp'); }
  urgent(ar) {   // срочно: телепорт подальше / на дюну, перебежка или таран на Валеру
    const pl = ar.player, P = this.phase, adx = Math.abs(pl.x - this.x);
    this.reactCool = [0, 2.4, 2.0, 1.6][P]; this.chain = []; this.comboN = 0; this.seq = null; this.state = 'idle'; this.alpha = 1; this.urgentNow = true; this.stats.react = (this.stats.react || 0) + 1;
    const r = Math.random(), perched = this.perchT > 0;
    FX.popText(this.x, this.y - 110, '!', '#ff6040');
    if (perched || r < 0.5) this.perform('tp', ar);
    else if (r < 0.8 && adx < 260) { this.actCool.relocate = 0; this.perform('relocate', ar); }
    else { this.actCool.dash = 0; this.perform('ram', ar); }
  }
  tpSpot(ar) {   // куда телепортироваться: на дюну подальше от Валеры или на землю на другой край
    const pl = ar.player, ps = this.arenaPlats(ar).filter(p => Math.abs(p.x + p.w / 2 - pl.x) > 120);
    if (this.perchT <= 0 && ps.length && Math.random() < 0.55) { const p = U.choice(ps); return { x: p.x + p.w / 2, y: p.y, p }; }
    const l = BG6() + U.rand(50, 160), rr = BG6() + U.rand(480, 590);
    return { x: Math.abs(l - pl.x) > Math.abs(rr - pl.x) ? l : rr, y: L6.GROUND, p: null };
  }
  seqLocked() { return this.state === 'act' && this.seq && this.seq[this.sq] && this.seq[this.sq].lock; }
  dodge(s, ar) {
    this.state = 'dodge'; this.dt2 = 0; this.seq = null; this.teleported = false; this.stam--; this.dodgeCool = 1.5; this.stats.dodges++;
    const P = this.phase, back = s.vx > 0 ? 1 : -1, high = s.y < this.y - 62;
    const wallBack = (back < 0 && this.x < BG6() + 90) || (back > 0 && this.x > BG6() + 550);
    let kind;
    if (this.perchT > 0) kind = high ? 'duck' : P >= 2 && Math.random() < 0.4 ? 'vanish' : 'jump';
    else if (s.fist) kind = wallBack ? 'over' : U.choice(['side', 'flip', 'over']);
    else if (s.seek) kind = P >= 2 && Math.random() < 0.6 ? 'vanish' : wallBack ? 'over' : 'side';
    else if (high) kind = U.choice(['duck', 'duck', 'side', 'flip']);
    else kind = wallBack ? 'over' : U.choice(['over', 'over', 'jump', 'side', 'flip', P >= 2 ? 'vanish' : 'side']);   // over — прыжок через снаряд навстречу Валере
    if (kind === 'side' && wallBack) kind = 'jump';
    this.dKind = kind; Sound.play('squeak', 0.6);
    if (kind === 'duck') { this.dDur = 0.45; this.play('duck'); this.dvx = 0; }
    else if (kind === 'jump') { this.dDur = 0.62; this.vy = -430; this.dvx = back * (wallBack ? -60 : 50); this.play('jumpUp'); }
    else if (kind === 'over') { this.dKind = 'jump'; this.dDur = 0.66; this.vy = -470; this.dvx = -back * 170; this.play('jumpUp'); }
    else if (kind === 'flip') { this.dDur = 0.55; this.dvx = back * 200; this.play('flip'); }
    else if (kind === 'side') { this.dDur = 0.4; this.dvx = back * 270; this.play('side'); }
    else { this.dDur = 0.8; this.dvx = 0; this.play('vanish'); if (Math.random() < 0.5) this.say('Мимо!'); }
    if (!s.fist && Math.random() < 0.85 + 0.05 * P) this.counter = U.choice(['bolt', 'palm', 'palm', 'dash']);   // уклонился — сразу отвечает
    FX.popText(this.x, this.y - 104, 'УВЕРНУЛСЯ!', '#8cd0ff');
  }
  enrage(ar) {
    this.phase = 2; this.state = 'act'; this.stun = 0; this.invul = false; this.chain = []; this.comboN = 0; this.tiredT = 0; this.alpha = 1;
    this.doSeq('rage', [{ a: 'aura', d: 0.6, lock: true, on: () => { this.say('НУ ВСЁ! ГРИБНОЕ БЕЗУМИЕ!', true); Sound.play('boom'); G.shake(6, 0.6); FX.burst(this.x, this.y - 50, 18, { colors: ['#ff2030', '#802040', '#ffffff'], speed: 160, life: 0.7, grav: 0 }); } }, { a: 'rage', d: 0.9, lock: true }]);
  }
  enrage3(ar) {
    this.phase = 3; this.state = 'act'; this.stun = 0; this.vuln = 0; ar.portals = []; this.chain = []; this.comboN = 0; this.tiredT = 0; this.alpha = 1; this.shroomPh[3] = true;
    this.doSeq('rage3', [{ a: 'skyArms', d: 0.7, lock: true, on: () => { this.say('Я — ГРИБНОЙ ВЛАСТЕЛИН!', true); Sound.play('boom', 1.3); G.shake(8, 0.8); G.flash(0.15); FX.burst(this.x, this.y - 60, 26, { colors: ['#ffd84a', '#ff2030', '#ffffff', '#802040'], speed: 220, life: 0.9, grav: 0 }); } },
      { a: 'punchGround', d: 0.4, lock: true, on: () => { for (const x of [50, 590, U.rand(200, 440)]) ar.shrooms.push(new L6.Shroom(BG6() + x, ar)); ar.quakes.push(new L6.Quake(this.x, -1, 260), new L6.Quake(this.x, 1, 260)); } },
      { a: 'rage', d: 0.8, lock: true }]);
  }
  choose(ar, adx, dx, camping) {
    if (this.chain.length) { this.comboN++; this.perform(this.chain.shift(), ar); return; }
    const A = this.actCool, P = this.phase, ph2 = P >= 2, pl = ar.player;
    const opts = [];
    const ok = k => !(A[k] > 0);
    const perched = this.perchT > 0;
    if (!perched && this.zoneT > [0, 3.6, 3.1, 2.6][P] && this.punCD <= 0 && !ar.marks.some(m => m instanceof L6.Void)) { this.chain = []; this.comboN = 1; this.perform('void', ar); return; }
    if (perched) {   // с дюны: навесной обстрел и ловушки (прицельные лучи сверху вниз — нечестно, их нет), потом прыжок вниз на Валеру
      if (ok('lob')) opts.push(['lob', 3]);
      if (ok('mark')) opts.push(['mark', camping ? 5 : 2]);
      if (ok('spore') && P === 3 && ar.spores.length < 2) opts.push(['spore', 2]);
    } else {
      if (adx < 140 && ok('palm')) opts.push(['palm', 5]);
      if (adx < 280 && ok('dash')) opts.push(['dash', 3]);
      if (adx > 110 && ok('leap')) opts.push(['leap', adx > 300 ? 5.5 : 4]);
      if (ok('perch') && this.arenaPlats(ar).length) opts.push(['perch', 1.6]);
      if (ok('tp')) opts.push(['tp', 1.8]);
      if (ok('portal') && ar.portals.length < (ph2 ? 3 : 2)) opts.push(['portal', 1.8]);
      if (ok('shroom') && !this.invul) opts.push(['shroom', ar.shrooms.length ? 0 : 2.2]);
      if (ok('summon') && ar.foes.length < (ph2 ? 3 : 2)) opts.push(['summon', 1.3]);
      if (ok('python') && !this.pyAway && this.pyCool <= 0 && adx > 90 && !pl.stuck) opts.push(['python', 2]);
      if (ok('rain') && !ar.rainT) opts.push(['rain', ph2 ? 1.6 : 1]);
      if (ok('bolt') && adx > 150) opts.push(['bolt', 2.5]);   // вплотную не стреляет — не успеть среагировать
      if (ok('mark')) opts.push(['mark', camping ? 6 : 2.5]);
      if (ok('lob') && ph2) opts.push(['lob', camping ? 4 : 2]);
      if (ok('quake') && ph2) opts.push(['quake', 2.2]);
      if (ok('relocate') && adx < 120) opts.push(['relocate', 1.2]);
      if (ok('volley') && ph2) opts.push(['volley', 2.2]);
      if (ok('blink') && (P === 3 || camping)) opts.push(['blink', camping ? 5 : 2.2]);   // стоишь — появится за спиной
      if (ok('spore') && P === 3 && ar.spores.length < 2) opts.push(['spore', 2]);
      if (ok('taunt') && adx > 200 && P === 1 && !camping) opts.push(['taunt', 0.5]);
    }
    this.usedT = this.usedT || {};   // давно не показывал приём (питон, круг порталов...) — вес растёт, чтобы весь арсенал был в ходу
    for (const o of opts) if (this.t - (this.usedT[o[0]] ?? 0) > 22 && ['python', 'portal', 'summon', 'rain', 'volley', 'quake'].includes(o[0])) o[1] *= o[0] === 'python' ? 4 : 2;
    const tot = opts.reduce((s, o) => s + o[1], 0);
    if (!tot) { this.aggro = 0.3; this.st = 0; return; }
    let r = Math.random() * tot, pick = opts[0][0];
    for (const o of opts) { r -= o[1]; if (r <= 0) { pick = o[0]; break; } }
    if (pick === this.lastAct && opts.length > 1 && Math.random() < 0.6) pick = opts.find(o => o[0] !== this.lastAct)[0];
    this.comboN = 1;
    if (ok('shroom') && !this.invul && !ar.shrooms.length && !perched && !this.shroomPh[P] && this.hp < this.maxHp * [0, 0.9, 0.58, 0.25][P]) { this.shroomPh[P] = true; pick = 'shroom'; }   // броня — раз за фазу обязательно
    // комбо: связка из 2–3 приёмов, после — выдыхается
    const CH = { dash: [['palm'], ['palm', 'leap'], ['palm', 'leap', 'mark']], leap: [['palm'], ['palm', 'bolt'], ['palm', 'leap', 'volley']], mark: [['leap'], ['lob', 'leap'], ['lob', 'dash', 'palm']],
      bolt: [['dash'], ['mark', 'leap'], ['mark', 'dash', 'palm']], volley: [['leap'], ['dash', 'palm'], ['dash', 'palm', 'leap']], blink: [['bolt'], ['bolt', 'mark'], ['spore', 'leap', 'palm']], lob: [['leap'], ['dash', 'palm'], ['mark', 'leap', 'palm']], palm: [['leap'], ['mark', 'leap'], ['dash', 'palm', 'mark']] };   // фаза 1: 2 приёма, фаза 2: 3, фаза 3: 4
    if (!perched && CH[pick] && Math.random() < [0, 0.6, 0.75, 0.85][P]) this.chain = CH[pick][P - 1].slice();
    this.usedT[pick] = this.t; this.perform(pick, ar);
  }
  palmSteps(ar) {   // удар ладонью вплотную: замах (телеграф) — шаг вперёд — вспышка
    const pl = ar.player;
    return [{ a: 'palmWind', d: 0.42, lock: true, tele: true, move: 50, on: () => { this.facing = pl.x > this.x ? 1 : -1; Sound.play('squeak', 0.7); FX.burst(this.x + this.facing * 20, this.y - 70, 8, { colors: ['#ffd84a', '#ff2060', '#fff'], speed: 50, life: 0.45, grav: 0 }); } },
      { a: 'palmHit', d: 0.24, lock: true, on: () => { const hx = this.x + this.facing * 34; G.shake(3, 0.2); Sound.play('boom', 0.8);
        FX.burst(hx, this.y - 50, 14, { colors: ['#ff2060', '#ffd84a', '#ffffff', '#802040'], speed: 170, life: 0.4, grav: 0 });
        if (!pl.dead && Math.abs(pl.x - hx) < 44 * Math.max(1, (pl.sc || 1) * 0.8) && pl.y > this.y - 100 && pl.y < this.y + 30) pl.hurt(8, this.x, ar.world); } },
      { a: 'recoil', d: 0.45 }];
  }
  perform(k, ar) {
    const pl = ar.player, P = this.phase, ph2 = P >= 2, A = this.actCool;
    this.facing = pl.x > this.x ? 1 : -1; this.stats.acts++;
    const adx0 = Math.abs(pl.x - this.x);
    if (k === 'bolt' && adx0 < 150) k = 'palm';
    if (k === 'palm' && adx0 > 150) k = adx0 > 280 || A.dash > 0 ? 'leap' : 'dash';   // ладонь только вплотную — иначе сближается
    switch (k) {
      case 'relocate': {   // перебегает в другую часть арены
        A.relocate = 5; const tx = pl.x > BG6() + 320 ? BG6() + U.rand(60, 200) : BG6() + U.rand(440, 580);
        this.facing = tx > this.x ? 1 : -1; const d = Math.abs(tx - this.x);
        this.doSeq('relocate', [{ a: 'run', d: Math.max(0.4, d / 230), fixed: true, move: 230, upd: () => { if ((tx - this.x) * this.facing < 0) this.sqT = 99; } }, { a: 'smirk', d: 0.25 }]);
        if (Math.random() < 0.4) this.say(U.choice(['Лови меня!', 'Здесь удобнее.', 'Не догонишь!']));
        this.aggro = 0;
        break;
      }
      case 'perch': {
        A.perch = P === 3 ? 7 : 9;
        const ps = this.arenaPlats(ar).filter(p => Math.abs(p.x + p.w / 2 - pl.x) > 90);
        const p = ps.length ? ps.reduce((b, q) => q.y < b.y ? q : b) : null;
        if (p) this.hopTo(p.x + p.w / 2, p.y, p); else this.aggro = 0.2;
        break;
      }
      case 'leap': case 'dive': {   // прыжок на Валеру: присел (телеграф), летит туда, куда тот добежит, — удар о землю
        A.leap = [0, 3.4, 2.8, 2.2][P];
        const T = k === 'dive' ? 0.75 : 0.8;
        this.doSeq(k, [{ a: 'crouch', d: k === 'dive' ? 0.4 : 0.36, lock: true, tele: true, on: () => { FX.dust(this.x, this.y, 4); if (Math.random() < 0.4) this.say(U.choice(['Сверху!', 'Поймаю!', 'Прыг!'])); } },
          { a: 'crouch', d: 0.01, on: () => { const tx = this.aimX(pl, T); this.perchT = 0; this.platX = null; this.hopTo(tx, L6.GROUND, null, { d: T, h: k === 'dive' ? 60 : 130, onLand: () => this.slam(ar) }); } }]);
        break;
      }
      case 'dash':
        A.dash = ph2 ? 2.2 : 3; this.hitDone = false;
        this.doSeq('dash', [{ a: 'crouch', d: 0.3, tele: true, lock: true }, { a: 'dash', d: 0.34, fixed: true, move: 520, upd: () => { if (!this.hitDone && U.overlap({ x: this.x - 16, y: this.y - 58, w: 32, h: 58 }, pl.box)) { this.hitDone = true; pl.hurt(8, this.x, ar.world); } } }, { a: 'slide', d: 0.35, fixed: true, move: 120 }, { a: 'smirk', d: 0.35 }]);
        this.say(U.choice(['Хоп!', 'Лови!']));
        break;
      case 'tp': {   // исчез (b_evade:11) — появился на дюне или на другом краю (b_cast:5)
        A.tp = 1.2; const to = this.tpSpot(ar);
        this.doSeq('tp', [{ a: 'vanish', d: 0.3, lock: true, fixed: true, on: () => { Sound.play('squeak', 0.8); FX.burst(this.x, this.y - 40, 10, { colors: ['#201028', '#4a2060', '#802040'], speed: 80, type: 'puff', size: 5, life: 0.7, grav: -10 }); }, upd: () => { this.alpha = Math.max(0, 1 - this.sqT / 0.28); } },
          { a: 'vanish', d: 0.12, lock: true, fixed: true, on: () => { this.x = to.x; this.y = this.baseY = to.y; this.platX = to.p ? [to.p.x + 10, to.p.x + to.p.w - 10] : null; this.perchT = to.p ? (P === 3 ? 2.6 : 3.2) : 0; this.facing = pl.x > this.x ? 1 : -1;
            FX.burst(this.x, this.y - 40, 12, { colors: ['#201028', '#4a2060', '#ff2060'], speed: 90, type: 'puff', size: 5, life: 0.7, grav: -10 }); }, upd: () => { this.alpha = Math.min(1, this.sqT / 0.12); } },
          { a: 'burst', d: 0.25, fixed: true, on: () => { this.alpha = 1; if (to.p && Math.random() < 0.5) this.say(U.choice(['Я тут!', 'Сверху виднее!', 'Не достанешь!'])); } }]);
        this.aggro = Math.min(this.aggro, 0.35);
        break;
      }
      case 'ram':   // таран: короткий присед и рывок прямо в Валеру
        A.dash = ph2 ? 1.8 : 2.4; this.hitDone = false;
        this.doSeq('dash', [{ a: 'crouch', d: 0.38, fixed: true, lock: true, tele: true, on: () => this.say(U.choice(['Ну держись!', 'Тараню!'])) }, { a: 'dash', d: 0.4, fixed: true, move: 540, upd: () => { if (!this.hitDone && U.overlap({ x: this.x - 16, y: this.y - 58, w: 32, h: 58 }, pl.box)) { this.hitDone = true; pl.hurt(7, this.x, ar.world); } } }, { a: 'slide', d: 0.3, fixed: true, move: 120 }, { a: 'smirk', d: 0.2 }]);
        break;
      case 'palm':
        A.palm = 1.6; this.doSeq('palm', this.palmSteps(ar));
        break;
      case 'blink': {   // исчезает и появляется за спиной — удар ладонью
        A.blink = P === 3 ? 5 : 7;
        this.doSeq('blink', [{ a: 'vanish', d: 0.4, lock: true, tele: true, on: () => { Sound.play('squeak', 0.8); this.say('Я за тобой!'); }, upd: () => { this.alpha = Math.max(0, 1 - this.sqT / 0.35); } },
          { a: 'vanish', d: 0.2, lock: true, on: () => { const back = -pl.facing, side = (pl.x + back * 58 < BG6() + 35 || pl.x + back * 58 > BG6() + 605) ? -back : back;
            this.x = U.clamp(pl.x + side * 58, BG6() + 30, BG6() + 610); this.y = this.baseY = L6.GROUND; this.perchT = 0; this.platX = null; this.facing = pl.x > this.x ? 1 : -1;
            FX.burst(this.x, this.y - 40, 10, { colors: ['#201028', '#4a2060', '#802040'], speed: 80, type: 'puff', size: 5, life: 0.8, grav: -10 }); }, upd: () => { this.alpha = Math.min(1, this.sqT / 0.2); } },
          ...this.palmSteps(ar).map(s => Object.assign({}, s, { move: 0 }))]);
        break;
      }
      case 'void': {   // бесконечный портал под Валерой: телеграф ~1 с — успел отойти, не провалился
        this.punCD = [0, 8, 7, 6][P]; this.zoneT = 0; const vx = U.clamp(pl.x, BG6() + 20, BG6() + 620);
        this.doSeq('void', [{ a: 'raise', d: 0.5, lock: true, tele: true, on: () => { this.say(U.choice(['Прописался? Провались!', 'Стоишь? Падай!', 'Бездна, прими гостя!']), true);
            ar.marks.push(new L6.Void(vx, 1.0, [0, 2, 3, 3][P])); } },
          { a: 'pointGround', d: 0.5, lock: true }, { a: 'smirk', d: 0.6 }]);
        break; }
      case 'mark':   // ловушки в земле под Валерой (с упреждением)
        A.mark = [0, 4, 3.2, 2.6][P];
        this.doSeq('mark', [{ a: 'pointGround', d: 0.4, lock: true, tele: true, on: () => { if (Math.random() < 0.5) this.say(U.choice(['Расти, грибница!', 'Под ногами смотри!', 'Корни, хватай!'])); } },
          { a: 'punchGround', d: 0.3, lock: true, on: () => { G.shake(3, 0.2); Sound.play('punch', 0.7);
            const px = this.aimX(pl, 0.7), xs = P === 1 && !this.camping ? [px] : [px - 44, px, px + 44];
            for (const x of xs) ar.marks.push(new L6.Mark(U.clamp(x, BG6() + 20, BG6() + 620), 0.75, 7));
            if (P === 3) for (const x of [px - 92, px + 92]) ar.marks.push(new L6.Mark(U.clamp(x, BG6() + 20, BG6() + 620), 1.1, 7)); } },
          { a: 'smirk', d: 0.4 }]);
        break;
      case 'lob':   // мортира: грибные капли летят дугой туда, где Валера будет
        A.lob = [0, 5, 3.6, 3][P];
        this.doSeq('lob', [{ a: 'orbUp', d: 0.45, lock: true, tele: true, on: () => Sound.play('squeak', 0.8) },
          { a: 'beam', d: 0.35, lock: true, on: () => { Sound.play('throw', 1.1); const n = P === 3 ? 3 : P === 2 ? 2 : 1, x0 = this.x + this.facing * 20, y0 = this.y - 80, g = 520;
            for (let i = 0; i < n; i++) { const T = 0.95 + i * 0.2, tx = U.clamp(this.aimX(pl, T) + (i - (n - 1) / 2) * 46, BG6() + 20, BG6() + 620), vx = (tx - x0) / T, vy = (L6.GROUND - 2 - y0 - 0.5 * g * T * T) / T;
              ar.shots.push(new L6.Shot(3, x0, y0, vx, vy, 7, { grav: g, spin: false, sc: 0.9, r: 9, life: 3, onLand: function (run) { run.marks.push(new L6.Mark(this.x, 0, 6)); } })); } } },
          { a: 'recoil', d: 0.4 }]);
        break;
      case 'quake':
        A.quake = P === 3 ? 4.5 : 6;
        this.doSeq('quake', [{ a: 'kneelCast', d: 0.55, lock: true, tele: true, on: () => { this.say(U.choice(['Грибы, из-под земли!', 'Прыгай, Валера!'])); FX.burst(this.x, L6.GROUND - 4, 12, { colors: ['#6a4020', '#c8a070', '#ffd84a'], speed: 90, life: 0.5, grav: 200 }); } },
          { a: 'punchGround', d: 0.4, lock: true, on: () => { G.shake(5, 0.3); Sound.play('boom', 0.9); ar.quakes.push(new L6.Quake(this.x, this.facing, P === 3 ? 270 : 230)); if (P === 3) ar.quakes.push(new L6.Quake(this.x, -this.facing, 200)); } },
          { a: 'smirk', d: 0.45 }]);
        break;
      case 'volley':   // веер, нацеленный в Валеру
        A.volley = P === 3 ? 3.2 : 4.5;
        this.doSeq('volley', [{ a: 'orbUp', d: 0.6, lock: true, tele: true, on: () => { Sound.play('squeak', 0.8); FX.burst(this.x + this.facing * 20, this.y - 70, 10, { colors: ['#ff2060', '#ffd84a', '#fff'], speed: 60, life: 0.6, grav: 0 }); } },
          { a: 'beam', d: 0.5, lock: true, on: () => { Sound.play('shot', 1.3); const n = P === 3 ? 5 : 3, v0 = 300, x0 = this.x + this.facing * 26, y0 = this.y - 56;
            const T = Math.abs(pl.x - x0) / v0, a0 = this.aimAng(x0, y0, this.aimX(pl, T), L6.GROUND - 36 * pl.sc);
            for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * 0.18; ar.shots.push(new L6.Shot(5, x0, y0, Math.cos(a) * v0, Math.sin(a) * v0, 7, { spin: false, rot: a, r: 9, sc: 1.0, pass: true, life: 2.6 })); } } },
          { a: 'recoil', d: 0.4 }]);
        break;
      case 'spore':
        A.spore = 5.5;
        this.doSeq('spore', [{ a: 'orbA', d: 0.55, lock: true, tele: true, on: () => this.say('Спора тьмы!') }, { a: 'beam', d: 0.35, lock: true, on: () => { Sound.play('zap', 1.2); ar.spores.push(new L6.Spore(this.x + this.facing * 24, this.y - 70)); } }, { a: 'recoil', d: 0.3 }]);
        break;
      case 'portal':
        A.portal = ph2 ? 7 : 10;
        this.doSeq('portal', [{ a: 'raise', d: 0.35, lock: true, tele: true, on: () => this.say('Змеиный круг!') }, { a: 'draw', d: 0.4, lock: true }, { a: 'slam', d: 0.35, lock: true, on: () => { G.shake(4, 0.3); const n = ph2 ? 3 : 2, px = this.aimX(pl, 0.9), xs = [px - 70, px + 70, px]; for (let i = 0; i < n; i++) ar.portals.push(new L6.Portal(U.clamp(xs[i] + U.rand(-20, 20), BG6() + 40, BG6() + 600))); } }, { a: 'glow', d: 0.5, lock: true }, { a: 'recoil', d: 0.3 }]);
        break;
      case 'shroom':
        A.shroom = ph2 ? 16 : 20;
        this.doSeq('shroom', [{ a: 'kneelCast', d: 0.55, lock: true, tele: true, on: () => this.say('Грибная броня!') }, { a: 'punchGround', d: 0.35, lock: true, on: () => { G.shake(5, 0.3); const n = ph2 ? 3 : 2; const xs = [U.rand(50, 100), U.rand(540, 590), U.rand(260, 380)].sort((a, c) => Math.abs(BG6() + c - pl.x) - Math.abs(BG6() + a - pl.x));   // подальше от Валеры: придётся побегать
          for (let i = 0; i < n; i++) ar.shrooms.push(new L6.Shroom(BG6() + xs[i], ar)); FX.popText(this.x, this.y - 104, 'БЕССМЕРТИЕ!', '#ffd84a'); } }, { a: 'pointGround', d: 0.45, lock: true }, { a: 'smirk', d: 0.4 }]);
        break;
      case 'summon':
        A.summon = ph2 ? 10 : 14;
        this.doSeq('summon', [{ a: 'orbA', d: 0.4, lock: true, tele: true, on: () => this.say('Грибы, ко мне!') }, { a: 'orbUp', d: 0.6, lock: true }, { a: 'beam', d: 0.5, lock: true, on: () => { Sound.play('boom', 1.1); for (let i = 0; i < 2; i++) { const x = U.clamp(pl.x + (i ? 120 : -120) + U.rand(-30, 30), BG6() + 40, BG6() + 600); const e = new L6.Foe('amanita', x); e.awake = true; e.x1 = BG6() + 20; e.x2 = BG6() + 620; e.facing = x < pl.x ? 1 : -1; e.summonT = 0.7; ar.foes.push(e); FX.burst(x, L6.GROUND - 10, 10, { colors: ['#802040', '#c04060', '#201028'], speed: 90, life: 0.6 }); } } }, { a: 'recoil', d: 0.3 }]);
        break;
      case 'python':
        A.python = 10;
        this.doSeq('python', [{ a: 'pyPull', d: 0.35, lock: true, tele: true, on: () => this.say('Питончик, фас!') }, { a: 'pyWind', d: 0.3, lock: true }, { a: 'pyWhip', d: 0.18, lock: true, on: () => { this.pyAway = true; ar.pyshots.push(new L6.PyShot(this.x + this.facing * 24, L6.GROUND - 34 * Math.max(1, ar.player.sc * 0.8), this.facing, this)); } }, { a: 'pyFollow', d: 0.4 }]);
        break;
      case 'rain':
        A.rain = ph2 ? 15 : 20;
        this.doSeq('rain', [{ a: 'skyArms', d: 0.9, lock: true, tele: true, on: () => { this.say('ГРИБНОЙ ДОЖДЬ!', true); Sound.play('boom', 0.8); } }, { a: 'laugh', d: 0.7, lock: true, on: () => { ar.rainT = ph2 ? 7 : 5.5; } }, { a: 'cackle', d: 0.8 }, { a: 'hood', d: 0.4 }]);
        break;
      case 'bolt':   // прицельный выстрел в грудь с упреждением; во 2–3 фазе — ещё и низом (прыгай)
        A.bolt = ph2 ? 2.6 : 3.5;
        this.doSeq('bolt', [{ a: 'orbA', d: 0.35, lock: true, tele: true, on: () => FX.burst(this.x + this.facing * 22, this.y - 60, 6, { colors: ['#ff2060', '#fff'], speed: 40, life: 0.35, grav: 0 }) },
          { a: 'beam', d: 0.4, lock: true, on: () => { Sound.play('shot', 1.2); const v0 = this.perchT > 0 ? 250 : 330, x0 = this.x + this.facing * 26, y0 = this.y - 56;
            const T = Math.abs(pl.x - x0) / v0, a = this.aimAng(x0, y0, this.aimX(pl, T), L6.GROUND - 38 * pl.sc);   // в грудь стоящего: прыжок или присед спасают
            ar.shots.push(new L6.Shot(5, x0, y0, Math.cos(a) * v0, Math.sin(a) * v0, 7, { spin: false, r: 10, sc: 1.1, pass: true, life: 2.5 }));
            if (ph2 && this.perchT <= 0) ar.shots.push(new L6.Shot(5, x0, L6.GROUND - 16, this.facing * 300, 0, 6, { spin: false, r: 9, sc: 1.0, pass: true, life: 2.5 }));
            if (P === 3) { const a2 = this.aimAng(x0, y0, U.clamp(pl.x + (pl.vx || 0) * T * 1.6, BG6(), BG6() + 640), L6.GROUND - 38 * pl.sc); ar.shots.push(new L6.Shot(5, x0, y0, Math.cos(a2) * v0, Math.sin(a2) * v0, 7, { spin: false, r: 10, sc: 1.1, pass: true, life: 2.5 })); } } },
          { a: 'recoil', d: 0.35 }]);
        break;
      default:
        A.taunt = 8;
        this.doSeq('taunt', [{ a: U.choice(['crossed', 'clap', 'bow', 'stare', 'point']), d: 0.9 }]);
    }
  }
  hit(dmg, dir, ar) {
    if (this.state === 'down' || this.state === 'dying' || this.state === 'wait' || this.state === 'dodge') return false;
    if (this.invul) { this.flash = 0.1; this.flashCol = '#ffd84a'; if (Math.random() < 0.5) FX.popText(this.x, this.y - 100, 'БРОНЯ: ЛОМАЙ ГРИБЫ!', '#ffd84a'); Sound.play('clank'); return false; }
    return this.damage(dmg * 4 * this.dmgMul(), dir, ar, true);   // кулак — риск вплотную, бьёт ощутимо
  }
  dmgMul() { return (this.vuln > 0 || this.state === 'tired' || this.anim === 'slamLand' ? 1.2 : 0.25) * (this.phase >= 2 ? 0.9 : 1); }   // вне окон спам бесполезен   // окна уязвимости (броня сломана / выдохся) — главный урон
  damage(n, dir, ar, melee) {
    const win = this.vuln > 0 || this.state === 'tired' || this.anim === 'slamLand';
    // ПРАВИЛО: 2 попадания Валеры примерно за секунду — срочная реакция (телепорт / перебежка / таран)
    this.hitQ = (this.hitQ || []).filter(t => this.t - t < 1.0); this.hitQ.push(this.t);
    const react = this.hitQ.length >= 2 && !win && this.reactCool <= 0 && ar && this.canReact();
    if (!win) { const fl = this.maxHp * [0, 0.66, 0.33, 0.15][this.phase] + 1; n = Math.max(0, Math.min(n, this.hp - fl)); }   // вне окон: не переводит фазу и не добивает — стоя спамом не убить
    if (react) { this.hitQ = []; this.hp -= n; this.flash = 0.12; Sound.play('hit'); if (this.hp <= 0) { this.hp = 0; this.die(ar); return true; } this.urgent(ar); return false; }
    if (!win) {   // вне окон серия заклинаний гасится: проходит не больше одного попадания в секунду — спамом не взять
      if (this.t - (this.chipT || -9) < 1.0) { this.flash = 0.06; this.flashCol = '#8cd0ff'; if (Math.random() < 0.15) FX.popText(this.x, this.y - 100, 'ВСКОЛЬЗЬ!', '#8cd0ff'); return false; }
      this.chipT = this.t;
    }
    this.hp -= n; this.flash = 0.12; this.flashCol = null; Sound.play('hit'); G.hitStop = 0.04;
    if (this.hp <= 0) { this.hp = 0; this.die(ar); return true; }
    this.combo = this.t - this.lastHit < 1.0 ? this.combo + 1 : 1; this.lastHit = this.t;
    // вздрагивает не от каждой искры: иначе спам заклинаний держал его в вечном «ай» и он не атаковал
    if (this.state === 'idle' && this.flinchCool <= 0) {
      this.flinchCool = melee ? 0.5 : 1.1; this.state = 'hurt'; this.st = 0; this.vx = dir * 120;
      this.flinchN = (this.flinchN || 0) + 1; this.play(['hurt1', 'hurt2', 'stagger'][this.flinchN % 3]);
    }
    if (this.combo >= 7 && this.state !== 'tired' && this.state !== 'act') { this.combo = 0; this.stun = 1.0; this.say('Голова кружится...'); }
    return false;
  }
  // реакция на заклинания: у каждого свой «привкус»
  zap(k, ar) {
    const sp = L6.SPELLS[k];
    if (this.state === 'dying' || this.state === 'down' || this.state === 'wait' || this.state === 'dodge') return false;
    if (this.invul) { this.flash = 0.1; this.flashCol = '#ffd84a'; FX.popText(this.x, this.y - 100, 'БРОНЯ: ЛОМАЙ ГРИБЫ!', '#ffd84a'); Sound.play('clank'); return false; }
    const dir = ar.player.facing;
    this.damage(sp.dmg * (L6.zapMul || 1) * this.dmgMul(), dir, ar);
    if (this.state === 'dying') return true;
    if (this.urgentNow) { this.urgentNow = false; return true; }   // уже убегает/телепортируется — эффекты заклинания не сбивают реакцию
    switch (sp.id) {
      case 'fire': this.flash = 0.5; this.flashCol = '#ff7a20'; break;
      case 'ice': this.slow = 1.8; this.flash = 0.5; this.flashCol = '#9fd4ff'; FX.popText(this.x, this.y - 104, 'ЗАМЕДЛИЛО!', '#bfe8ff'); break;
      case 'bolt': if (this.stunCool <= 0 && !this.seqLocked() && this.state !== 'hop') { this.stunCool = 5; this.stun = Math.max(this.stun, 0.6); this.seq = null; this.chain = []; this.state = 'idle'; this.alpha = 1; FX.popText(this.x, this.y - 104, 'ОГЛУШИЛО!', '#ffe860'); } break;
      case 'slime': FX.popText(this.x, this.y - 104, 'ПРЫГ-ПРЫГ!', '#a0ff80'); this.vx = dir * 60; break;
      case 'skull': this.x = U.clamp(this.x + dir * 80, BG6() + 30, BG6() + 610); FX.popText(this.x, this.y - 104, 'ПОТЯНУЛО!', '#d8a0ff'); break;
      case 'star': if (this.state === 'hurt' || this.state === 'idle') { this.x = U.clamp(this.x + dir * 30, BG6() + 30, BG6() + 610); } break;
      case 'rainbow': if (this.state === 'idle' && this.danceCool <= 0 && this.perchT <= 0 && Math.random() < 0.25) { this.danceCool = 10; this.state = 'act'; this.doSeq('dance', [{ a: 'clap', d: 0.5 }, { a: 'laugh', d: 0.5 }, { a: 'bow', d: 0.4 }]); FX.popText(this.x, this.y - 104, 'ПЛЯШЕТ!', '#ff9ad0'); } break;
      default: this.flash = 0.4; this.flashCol = '#301040'; FX.popText(this.x, this.y - 104, 'УКУСИЛИ!', '#c8a0ff');
    }
    return true;
  }
  die(ar) {
    this.state = 'dying'; this.dying = 0; this.seq = null; this.vx = 0; this.alpha = 1; this.invul = false;
    ar.onBossDying();
  }
  dieUpdate(dt, ar) {
    this.dying += dt; const d = this.dying;
    if (d < 0.9) { this.play('clutch'); if (d < 0.05) this.say('Не... может... быть!'); }
    else if (d < 1.4) this.play('knee');
    else if (d < 1.9) this.play('sit');
    else if (d < 2.2) { this.play('fallBack'); this.x = U.clamp(this.x - this.facing * 60 * dt, BG6() + 30, BG6() + 610); }
    else if (d < 3.6) { this.play('lieSide'); if (Math.random() < dt * 8) FX.burst(this.x + U.rand(-30, 30), L6.GROUND - 10, 1, { colors: ['#c02030', '#ffffff'], speed: 30, life: 0.5, grav: -30, size: 3 }); }
    else if (d < 5.0) this.play('reach');
    else { this.play('ko'); if (this.state !== 'down') { this.state = 'down'; ar.bossDown(); } }
  }
  draw(c, cx) {
    const flash = this.flash > 0 ? (this.flashCol || '#ffffff') : null;
    const sh = this.anim === 'dizzy' ? Math.sin(this.t * 20) : 0;
    c.globalAlpha = this.alpha;
    Spr.drawAnim(c, 'vande', this.anim, this.animT, this.x - cx + sh, this.y, this.facing, { flash });
    c.globalAlpha = 1;
    if (this.invul && this.state !== 'dying') {   // грибная броня: пульсирующий купол
      const px = this.x - cx, py = this.y - 40, R = 54 + Math.sin(G.t * 5) * 3;
      const g = c.createRadialGradient(px, py, R * 0.55, px, py, R); g.addColorStop(0, 'rgba(255,60,50,0)'); g.addColorStop(0.8, 'rgba(255,90,70,0.28)'); g.addColorStop(1, 'rgba(255,230,180,0.75)');
      c.fillStyle = g; c.beginPath(); c.arc(px, py, R, 0, Math.PI * 2); c.fill();
    }
    if (this.invul && (G.t * 6 | 0) % 2 && this.state !== 'dying') G.text('ГРИБНАЯ БРОНЯ!', this.x - cx, this.y - 112, { align: 'center', color: '#ffd84a', outline: true });
  }
};

// ---------- арена ----------
L6.Arena = class {
  constructor(level, run) {
    this.level = level; this.run = run; this.world = run.world;
    this.player = run.player; this.player.controls = false; this.player.rapid = true; this.player.castCool = 0;
    this.boss = new L6.Vande(BG6() + 440); this.boss.state = 'wait';
    this.portals = []; this.shrooms = []; this.foes = []; this.pyshots = []; this.quakes = []; this.marks = []; this.spores = []; this.shots = []; this.spells = []; this.fx = []; this.clouds = [];
    this.drops = []; this.splashes = []; this.rainT = 0; this.rainAcc = 0; this.fighting = false; this.dropped = {}; this.quipT = 5; this.hint = null; this.hintA = 0; this.hintT = 0; this.resetting = false;
    this.world.enemies = []; this.world.pickups = [];
    this.world.castSpell = (k, x, y, dir, up, o) => { const sp = new L6.Spell(k, x, y, dir, up, o); this.spells.push(sp); return sp; };
    this.world.targets = () => this.targetList();
    this.world.playerAttack = (hb, dmg, atk, pl) => this.playerAttack(hb, dmg, atk, pl);
  }
  targetList() { const b = this.boss; return [...this.spores.filter(s => !s.dead), ...this.foes.filter(e => !e.dead && e.dieT == null), ...this.shrooms.filter(s => s.grown && !s.dead), ...(b.state !== 'wait' && b.state !== 'down' && b.state !== 'dodge' && b.alpha > 0.3 ? [b] : [])]; }   // в уклоне/исчезновении заклинания пролетают мимо
  transform(foe, id) { L6.Run.prototype.transform.call(this, foe, id); this.world.addScore(0); }
  startFight() { this.fighting = true; this.player.controls = true; this.boss.state = 'idle'; this.boss.st = 0; this.hint = 'Палочка заряжена силой арены: заклинание на каждое нажатие! Ванделорд уворачивается и бьёт туда, где ты стоишь, — двигайся! Бей, когда он колдует или выдохся. Грибы-щиты ломай первыми!'; this.hintT = 7; }
  playerAttack(hb, dmg, atk, pl) {
    const b = this.boss;
    for (const s of this.shrooms) if (s.grown && !s.dead && !atk.hit.has(s) && U.overlap(hb, s.box)) { atk.hit.add(s); const k = s.hit(dmg); if (k) this.world.addScore(300); FX.burst(s.x, s.y - 40, 5, { colors: ['#fff', '#c02030'], speed: 100, life: 0.3, grav: 0 }); }
    for (const s of this.spores) if (!s.dead && U.overlap(hb, s.box)) s.hit();
    for (const e of this.foes) if (!e.dead && e.dieT == null && !atk.hit.has(e) && U.overlap(hb, e.box)) { atk.hit.add(e); const k = e.hit(dmg, pl.facing); Sound.play('hit'); if (k) this.world.addScore(e.score); }
    if (this.fighting && !atk.hit.has(b) && U.overlap(hb, b.box)) { atk.hit.add(b); const hp0 = b.hp; if (b.hit(dmg, pl.facing, this) !== false || !b.invul) { G.shake(2, 0.1); FX.burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 7, { colors: ['#fff', '#ffd84a'], speed: 130, life: 0.25, grav: 0 }); if (b.hp < hp0) this.world.addScore(80 * dmg); } }
  }
  onBossDying() { this.fighting = false; this.player.controls = false; this.shots = []; this.drops = []; this.rainT = 0; this.portals = []; this.pyshots = []; this.quakes = []; this.marks = []; this.spores = []; for (const e of this.foes) { e.dead = true; } this.shrooms = []; Music.stop(); G.shake(8, 0.6); G.flash(0.2); Sound.play('boom'); }
  bossDown() { this.world.addScore(8000); this.level.stats.kills++; G.later(() => this.level.bossDefeated(), 600); }
  update(dt) {
    const wd = this.world, pl = this.player, b = this.boss;
    wd.t += dt; if (this.fighting) this.level.stats.time += dt;
    if (pl) { pl.update(dt, wd); pl.x = U.clamp(pl.x, BG6() + 14, BG6() + 626); }
    if (b.state !== 'wait') b.update(dt, this);
    for (const p of this.portals) p.alive = p.update(dt, this); this.portals = this.portals.filter(p => p.alive);
    for (const s of this.shrooms) s.alive = s.update(dt); this.shrooms = this.shrooms.filter(s => s.alive);
    for (const e of this.foes) { if (e.summonT > 0) { e.summonT -= dt; e.animT += dt; continue; } e.update(dt, this, pl); }
    this.foes = this.foes.filter(e => !e.dead);
    for (const p of this.pyshots) p.alive = p.update(dt, this); this.pyshots = this.pyshots.filter(p => p.alive);
    for (const q of this.quakes) q.alive = q.update(dt, this); this.quakes = this.quakes.filter(q => q.alive);
    for (const m of this.marks) m.alive = m.update(dt, this); this.marks = this.marks.filter(m => m.alive);
    for (const q of this.spores) q.alive = q.update(dt, this); this.spores = this.spores.filter(q => q.alive);
    for (const sp of this.spells) {
      sp.update(dt, wd); if (sp.dead) continue;
      for (const t of this.targetList()) {
        if (sp.hitSet.has(t)) continue;
        if (U.overlap(sp.box, t.box)) { sp.hitSet.add(t); L6.zapMul = sp.mul; t.zap(sp.k, this); L6.zapMul = 1; if (sp.hitSet.size > sp.pierce) { sp.dead = true; FX.burst(sp.x, sp.y, 8, { colors: ['#fff', '#c8a0ff', '#ffd84a'], speed: 140, life: 0.3, grav: 0 }); break; } }
      }
    }
    this.spells = this.spells.filter(s => !s.dead);
    for (const s of this.shots) s.update(dt, this, pl); this.shots = this.shots.filter(s => !s.dead);
    for (const f of this.fx) f.alive = f.update(dt, this); this.fx = this.fx.filter(f => f.alive);
    for (const cl of this.clouds) { cl.t += dt; if (cl.t < cl.life && Math.abs(pl.x - cl.x) < cl.r && Math.abs(pl.y - 36 * pl.sc - cl.y) < 46 * pl.sc) { cl.dmgT = (cl.dmgT || 0) - dt; if (cl.dmgT <= 0) { cl.dmgT = 0.5; pl.hurt(4, cl.x, wd); } } }
    this.clouds = this.clouds.filter(cl => cl.t < cl.life);
    // грибной дождь
    if (this.rainT > 0) {
      this.rainT -= dt; this.rainAcc += dt;
      const rate = b.phase === 3 ? 0.035 : b.phase >= 2 ? 0.045 : 0.06;   // капли мельче, но их больше
      while (this.rainAcc > rate) { this.rainAcc -= rate; this.drops.push({ x: BG6() + U.rand(10, 630), y: -20, vy: U.rand(240, 320) }); }
    }
    for (const d of this.drops) {
      d.y += d.vy * dt;
      if (!pl.dead && Math.abs(d.x - pl.x) < 8 * Math.max(1, pl.sc * 0.8) && d.y > pl.y - 70 * pl.sc && d.y < pl.y + 4) { if (pl.hurt(3, d.x, wd)) d.hit = true; }
      if (d.y >= L6.GROUND || d.hit) { d.dead = true; if (!d.hit) this.splashes.push({ x: d.x, t: 0 }); }
    }
    this.drops = this.drops.filter(d => !d.dead);
    for (const s of this.splashes) s.t += dt; this.splashes = this.splashes.filter(s => s.t < 0.4);
    if (this.fighting) {
      [80, 60, 40, 20].forEach(th => { const pc = b.hp / b.maxHp * 100; if (pc <= th && !this.dropped[th]) { this.dropped[th] = 1; const p = new L6.GrowPick(BG6() + U.rand(120, 520), -10); p.falling = true; wd.pickups.push(p); } });
      for (const p of wd.pickups) p.update(dt, wd, pl); wd.pickups = wd.pickups.filter(p => !p.dead);
      this.quipT -= dt;
      if (this.quipT <= 0) { this.quipT = U.rand(8, 12); G.say(pl, U.choice(['Отдай Вову!', 'Грибы — не еда для всех!', 'Сейчас колдану!', 'Змеи — это перебор!']), 1.6); }
      if (pl.dead && pl.deadT > 1.6 && !this.resetting) { this.resetting = true; this.level.stats.deaths++; G.later(() => { this.resetting = false; this.level.restartBoss(); }, 400); }
    }
    if (this.hintT > 0) { this.hintT -= dt; this.hintA = Math.min(1, this.hintA + dt * 4); } else this.hintA = Math.max(0, this.hintA - dt * 3);
  }
  draw(c) {
    const wd = this.world, cx = BG6(), b = this.boss;
    if (L6.img.arena) c.drawImage(L6.img.arena, 0, 0, W, H); else { c.fillStyle = '#c8a070'; c.fillRect(0, 0, W, H); }
    for (const p of this.run.platSpr) if (p.x >= cx - 60 && !L6.FRONT[p.name]) L6.drawPlat(c, p, cx);
    for (const p of this.portals) p.draw(c, cx);
    for (const q of this.quakes) q.draw(c, cx);
    for (const m of this.marks) m.draw(c, cx);
    for (const s of this.shrooms) s.draw(c, cx, this);
    for (const p of wd.pickups) p.draw(c, cx, 0);
    for (const e of this.foes) { if (e.summonT > 0) { const k = 1 - e.summonT / 0.7; c.globalAlpha = k; e.draw(c, cx, 0, { dy: (1 - k) * 28 }); c.globalAlpha = 1; } else e.draw(c, cx, 0); }
    for (const f of this.fx) f.draw(c, cx);
    b.draw(c, cx);
    if (this.player) this.player.draw(c, cx, 0);
    L6.drawFront(c, this.run.platSpr.filter(p => p.x >= cx - 60), cx, [{ x: b.x, y: b.y, force: b.state === 'dying' || b.state === 'down', redraw: () => b.draw(c, cx) }, this.player && { x: this.player.x, y: this.player.y, redraw: () => this.player.draw(c, cx, 0) }, ...this.foes.map(e => ({ x: e.x, y: e.y, redraw: () => e.draw(c, cx, 0) }))].filter(Boolean));
    for (const p of this.pyshots) p.draw(c, cx, this);
    for (const s of this.shots) s.draw(c, cx);
    for (const q of this.spores) q.draw(c, cx);
    for (const s of this.spells) s.draw(c, cx);
    for (const cl of this.clouds) L3.drawCloud(c, cl, cx, 0);
    for (const d of this.drops) { const k = Math.max(0, Math.min(1, (d.y + 20) / (L6.GROUND + 20))); c.fillStyle = 'rgba(20,10,30,' + (0.15 + k * 0.35) + ')'; c.beginPath(); c.ellipse(d.x - cx, L6.GROUND - 1, 2 + k * 5, 1 + k * 1.5, 0, 0, Math.PI * 2); c.fill(); Spr.drawC(c, 'proj6', 3, d.x - cx, d.y, 0, 0.5); }
    for (const s of this.splashes) { c.globalAlpha = 1 - s.t / 0.4; Spr.drawC(c, 'proj6', 4, s.x - cx, L6.GROUND - 5, 0, 0.4 + s.t); c.globalAlpha = 1; }
    c.save(); c.translate(-cx, 0); FX.draw(c); c.restore();
    G.drawBubbles(c, cx, 0);
    if (this.player && this.fighting) Game.drawHUD(c, this.player, wd);
    if (this.player && this.fighting) L6.drawWeaponHUD(c, this.player);
    if (this.player && this.player.stuck) { const st = this.player.stuck; G.text('ПИТОН ДУШИТ! ЖМИ ПРЫЖОК/УДАР!', W / 2, 60, { align: 'center', color: '#ff6a4a', outline: true }); Art.R(c, W / 2 - 60, 74, 120, 8, '#111'); Art.R(c, W / 2 - 59, 75, Math.round(118 * st.free / st.need), 6, '#ffd84a'); }
    if (this.fighting || b.state === 'dying') {
      Art.R(c, 160, H - 26, 320, 16, '#111'); Art.R(c, 162, H - 24, 316, 12, '#3a1010');
      Art.R(c, 162, H - 24, Math.round(316 * b.hp / b.maxHp), 12, b.invul ? '#ffd84a' : b.vuln > 0 ? '#ff9040' : b.phase === 3 ? '#ff1050' : b.phase >= 2 ? '#ff3020' : '#a030c0');
      for (const th of [0.66, 0.33]) Art.R(c, 162 + Math.round(316 * th), H - 24, 1, 12, '#111');
      G.text(b.invul ? 'ГРИБЫ ЗАЩИЩАЮТ ВАНДЕЛОРДА: ЛОМАЙ ИХ!' : b.vuln > 0 ? 'БРОНЯ СЛОМАНА — БЕЙ СЕЙЧАС!' : b.phase === 3 ? 'ВАНДЕЛОРД — ГРИБНОЙ ВЛАСТЕЛИН' : 'ВАНДЕЛОРД — ГРИБНОЙ НЕКРОМАНТ', W / 2, H - 40, { align: 'center', color: b.invul ? '#ffd84a' : '#d8a0ff', outline: true });
    }
    if (this.hint) Game.drawHint(c, this.hint, this.hintA, 44);
  }
};
