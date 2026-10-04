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
  constructor(x, ar) { this.x = x; const pp = ar && ar.world.plats.find(p => p.oneway && x > p.x && x < p.x + p.w && p.y < L6.GROUND - 20 && p.x > BG6() - 40); this.y = pp ? pp.y : L6.GROUND; this.t = 0; this.hp = 6; this.maxHp = 6; this.dead = false; this.flash = 0; Sound.play('pickup', 0.5); }
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
  constructor(x, dir, speed) { this.x0 = x; this.dir = dir; this.sp = speed || 240; this.t = 0; this.pops = []; this.next = 0; this.dead = false; }
  update(dt, ar) {
    this.t += dt; const pl = ar.player, head = this.x0 + this.dir * this.sp * this.t;
    while (this.next * 30 < this.sp * this.t) { const x = this.x0 + this.dir * (40 + this.next * 30); this.next++; if (x > BG6() + 8 && x < BG6() + 632) { this.pops.push({ x, t: 0 }); FX.dust(x, L6.GROUND, 2); if (this.next % 2) Sound.play('punch', 0.35); } }
    for (const p of this.pops) { p.t += dt;
      if (!p.hit && p.t > 0.08 && p.t < 0.45 && !pl.dead && Math.abs(pl.x - p.x) < 16 * Math.max(1, pl.sc * 0.8) && pl.y > L6.GROUND - 40) { p.hit = true; if (pl.hurt(9, p.x, ar.world)) pl.vy = -320; } }
    this.pops = this.pops.filter(p => p.t < 0.8);
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
    const fr = this.mode === 'back' ? 7 : (this.t * 8 | 0) % 2 ? 5 : 4;
    c.save(); c.translate(this.x - cx, this.y); if (this.mode === 'fly' ? this.dir < 0 : this.boss.x < this.x) c.scale(-1, 1); Spr.drawC(c, 'b_py', fr, 0, 0, 0, 1); c.restore();
  }
};

// ---------- Ванделорд ----------
L6.Vande = class {
  constructor(x) {
    this.x = x; this.y = L6.GROUND; this.facing = -1; this.maxHp = Math.round(450 * (G.BOSS_MULT || 1));   // финальный босс: втрое крепче прошлых this.hp = this.maxHp;
    this.state = 'wait'; this.st = 0; this.t = 0; this.anim = 'idle'; this.animT = 0; this.phase = 1; this.flash = 0; this.flashCol = null;
    this.seq = null; this.sq = 0; this.sqT = 0; this.think = 1.2; this.vx = 0; this.vy = 0; this.slow = 0; this.stun = 0; this.invul = false;
    this.headH = 100; this.voice = 150; this.quip = 5; this.pyCool = 2; this.pyAway = false; this.lastAct = ''; this.combo = 0; this.lastHit = -9; this.dodgeCool = 0; this.actCool = {};
    this.vanishT = 0; this.alpha = 1; this.dying = 0; this.vuln = 0; this.wasInvul = false; this.baseY = L6.GROUND; this.perchT = 0; this.platX = null;
  }
  get box() { return { x: this.x - 13, y: this.y - 90, w: 26, h: 90 }; }
  play(a) { if (this.anim !== a) { this.anim = a; this.animT = 0; } }
  // ---- последовательности действий: [{a: анимация, d: сек, on: функция в начале шага}]
  doSeq(name, steps) { this.seq = steps; this.sq = -1; this.sqT = 0; this.state = 'act'; this.lastAct = name; this.nextStep(); }
  nextStep() {
    this.sq++;
    if (this.sq >= this.seq.length) { this.seq = null; this.state = 'idle'; this.st = 0; this.think = U.rand(0.5, 1.0) / (this.phase === 3 ? 1.8 : this.phase >= 2 ? 1.4 : 1); if (this.combo2) { this.queued = this.combo2; this.combo2 = null; this.think = 0.15; } return; }
    const s = this.seq[this.sq]; this.sqT = 0; if (s.a) this.play(s.a); if (s.on) s.on();
  }
  say(t, shout) { G.say(this, t, 1.8, { shout: !!shout }); }
  update(dt, ar) {
    const pl = ar.player;
    this.t += dt; this.st += dt; this.animT += dt; this.quip -= dt; this.dodgeCool -= dt; this.pyCool -= dt;
    for (const k in this.actCool) this.actCool[k] -= dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.slow > 0) this.slow -= dt;
    this.invul = ar.shrooms.some(s => s.grown && !s.dead);
    if (this.vuln > 0) this.vuln -= dt;
    if (this.wasInvul && !this.invul && this.state !== 'dying') {   // броня сломана: окно для атаки
      this.vuln = 5; this.stun = Math.max(this.stun, 1.6); this.seq = null; this.state = 'idle'; ar.portals = []; Sound.play('boom', 1.2); G.shake(5, 0.4);
      FX.popText(this.x, this.y - 112, 'БРОНЯ СЛОМАНА! БЕЙ!', '#ff8040'); this.say('Мои грибочки!..'); }
    this.wasInvul = this.invul;
    const dx = pl.x - this.x, adx = Math.abs(dx), faceP = () => { this.facing = dx > 0 ? 1 : -1; };
    const sp = (this.phase === 3 ? 1.5 : this.phase >= 2 ? 1.3 : 1) * (this.slow > 0 ? 0.5 : 1);
    if (this.quip <= 0 && this.state !== 'dying' && this.state !== 'down' && this.state !== 'wait') { this.quip = U.rand(7, 11); this.say(U.choice(['Грибочки мои, грибочки!', 'Не мешай нашему раю!', 'Ты ещё не гриб? Исправим.', 'Вова мой, и точка.'])); }
    if (this.state === 'wait') { this.play('idle'); return; }
    if (this.state === 'down') { return; }
    if (this.state === 'hop') { this.hopUpdate(dt, ar); return; }
    if (this.perchT > 0 && this.state === 'idle') { this.perchT -= dt; if (this.perchT <= 0) { this.hopTo(U.clamp(this.x + (pl.x > this.x ? 1 : -1) * 70, BG6() + 30, BG6() + 610), L6.GROUND, null); return; } }
    if (this.state === 'dying') { this.dieUpdate(dt, ar); return; }
    if (this.stun > 0) { this.stun -= dt; this.play('dizzy'); if (this.stun <= 0) { this.state = 'idle'; this.think = 0.4; } return; }
    // ---- уклонение от выстрелов Валеры ----
    if (this.state !== 'dodge' && this.state !== 'hurt' && this.dodgeCool <= 0 && !this.seqLocked() && this.vuln <= 0) {
      for (const s of ar.spells) {
        if (s.dead || s.reacted) continue;
        const toward = (this.x - s.x) * s.vx > 0, d = Math.abs(this.x - s.x);
        if (toward && d < 220 && d > 40 && Math.abs(s.y - (this.y - 50)) < 90) { s.reacted = true; if (Math.random() < [0, 0.4, 0.55, 0.62][this.phase]) { this.dodge(s, ar); break; } }
      }
    }
    if (this.state !== 'dodge' && this.state !== 'hurt' && this.dodgeCool <= 0 && !this.seqLocked() && this.vuln <= 0 && pl.atk && pl.atk.t < 0.06 && adx < 60 && Math.random() < [0, 0.35, 0.5, 0.6][this.phase]) {
      this.dodge({ vx: pl.facing, y: this.y - 50 }, ar);   // увернулся от кулака
    }
    switch (this.state) {
      case 'idle':
        faceP();
        if (this.perchT > 0) this.play('idle');
        else if (Math.abs(adx - 190) > 30) { this.x += Math.sign(adx - 190) * (dx > 0 ? 1 : -1) * 70 * sp * dt; this.play('walk'); } else this.play('idle');
        if (this.st > this.think) this.choose(ar, adx, dx);
        break;
      case 'act': {
        this.sqT += dt; const s = this.seq[this.sq];
        if (s.move) this.x += s.move * this.facing * dt;
        if (s.upd) s.upd(dt);
        if (this.sqT >= s.d / (s.fixed ? 1 : sp)) this.nextStep();
        break;
      }
      case 'dodge': {
        this.dt2 += dt; const k = this.dt2 / this.dDur;
        if (this.dKind === 'jump') { this.x += this.dvx * dt; this.vy += 1500 * dt; this.y += this.vy * dt; if (this.y >= this.baseY) { this.y = this.baseY; this.play('land'); } else this.play(this.vy < -120 ? 'jumpUp' : this.vy < 140 ? 'apex' : 'fall'); }
        else if (this.dKind === 'flip') { this.x += this.dvx * dt; }
        else if (this.dKind === 'side') { this.x += this.dvx * dt * (1 - k); }
        else if (this.dKind === 'vanish') { this.alpha = k < 0.45 ? 1 - k / 0.45 : k > 0.55 ? (k - 0.55) / 0.45 : 0; if (!this.teleported && k > 0.5) { this.teleported = true; this.y = this.baseY = L6.GROUND; this.perchT = 0; this.platX = null; this.x = U.clamp(pl.x + (Math.random() < 0.5 ? -1 : 1) * 170, BG6() + 30, BG6() + 610); this.facing = this.x < pl.x ? 1 : -1; FX.burst(this.x, this.y - 40, 10, { colors: ['#201028', '#4a2060', '#802040'], speed: 80, type: 'puff', size: 5, life: 0.8, grav: -10 }); } }
        this.x = U.clamp(this.x, BG6() + 30, BG6() + 610);
        if (this.dt2 >= this.dDur) { this.y = this.baseY; this.alpha = 1; this.state = 'idle'; this.st = 0; this.think = 0.25; faceP(); }
        break;
      }
      case 'hurt':
        this.x = U.clamp(this.x + this.vx * dt, BG6() + 30, BG6() + 610); this.vx *= 0.86;
        if (this.st > 0.3) { this.state = 'idle'; this.st = 0; this.think = 0.3; }
        break;
    }
    this.x = U.clamp(this.x, BG6() + 30, BG6() + 610);
    if (this.platX && this.perchT > 0) this.x = U.clamp(this.x, this.platX[0], this.platX[1]);
    if (this.phase === 1 && this.hp <= this.maxHp * 0.66 && this.state !== 'dying') this.enrage(ar);
    else if (this.phase === 2 && this.hp <= this.maxHp * 0.33 && this.state !== 'dying') this.enrage3(ar);
  }
  arenaPlats(ar) { return ar.world.plats.filter(p => p.oneway && p.y < L6.GROUND - 20 && p.x > BG6() - 20 && p.x + p.w < BG6() + 660 && p.w > 40); }
  hopTo(tx, ty, plat) {
    this.state = 'hop'; this.seq = null; this.hp0 = { x0: this.x, y0: this.y, x1: tx, y1: ty, t: 0, d: 0.7, plat };
    this.facing = tx > this.x ? 1 : -1; this.play('jumpUp'); Sound.play('jump', 0.8);
  }
  hopUpdate(dt, ar) {
    const h = this.hp0; h.t += dt; const k = Math.min(1, h.t / h.d);
    this.x = h.x0 + (h.x1 - h.x0) * k; this.y = h.y0 + (h.y1 - h.y0) * k - Math.sin(k * Math.PI) * 90;
    this.play(k < 0.4 ? 'jumpUp' : k < 0.6 ? 'apex' : 'fall');
    if (k >= 1) { this.y = this.baseY = h.y1; this.platX = h.plat ? [h.plat.x + 10, h.plat.x + h.plat.w - 10] : null;
      this.perchT = h.plat ? (this.phase === 3 ? 6 : 4.5) : 0; this.state = 'idle'; this.st = 0; this.think = 0.35; this.play('land'); FX.dust(this.x, this.y, 5); G.shake(2, 0.15);
      if (h.plat) this.say(U.choice(['Достань меня тут!', 'Сверху виднее!', 'Ха! Не дотянешься!'])); }
  }
  seqLocked() { return this.state === 'act' && this.seq && this.seq[this.sq] && this.seq[this.sq].lock; }
  dodge(s, ar) {
    this.state = 'dodge'; this.dt2 = 0; this.seq = null; this.dodgeCool = this.phase >= 2 ? 1.1 : 1.8; this.teleported = false;
    const back = s.vx > 0 ? 1 : -1, high = s.y < this.y - 62, low = s.y > this.y - 34;
    let kind;
    if (this.perchT > 0) kind = high || this.phase < 2 ? 'duck' : 'vanish'; else if (high) kind = 'duck'; else if (low) kind = 'jump'; else kind = U.choice(['jump', 'flip', 'side', 'side', this.phase >= 2 ? 'vanish' : 'flip']);
    this.dKind = kind; Sound.play('squeak', 0.6);
    if (kind === 'duck') { this.dDur = 0.5; this.play('duck'); this.dvx = 0; this.dKind = 'duck'; }
    else if (kind === 'jump') { this.dDur = 0.78; this.vy = -430; this.dvx = back * 40; this.play('jumpUp'); }
    else if (kind === 'flip') { this.dDur = 0.62; this.dvx = back * 190; this.play('flip'); }
    else if (kind === 'side') { this.dDur = 0.42; this.dvx = back * 260; this.play('side'); }
    else { this.dDur = 0.95; this.dvx = 0; this.play('vanish'); this.say('Мимо!'); }
    FX.popText(this.x, this.y - 104, 'УВЕРНУЛСЯ!', '#8cd0ff');
  }
  enrage(ar) {
    this.phase = 2; this.state = 'act'; this.stun = 0; this.invul = false;
    this.doSeq('rage', [{ a: 'aura', d: 0.6, lock: true, on: () => { this.say('НУ ВСЁ! ГРИБНОЕ БЕЗУМИЕ!', true); Sound.play('boom'); G.shake(6, 0.6); FX.burst(this.x, this.y - 50, 18, { colors: ['#ff2030', '#802040', '#ffffff'], speed: 160, life: 0.7, grav: 0 }); } }, { a: 'rage', d: 0.9, lock: true }]);
  }
  enrage3(ar) {
    this.phase = 3; this.state = 'act'; this.stun = 0; this.vuln = 0; ar.portals = [];
    this.doSeq('rage3', [{ a: 'skyArms', d: 0.7, lock: true, on: () => { this.say('Я — ГРИБНОЙ ВЛАСТЕЛИН!', true); Sound.play('boom', 1.3); G.shake(8, 0.8); G.flash(0.15); FX.burst(this.x, this.y - 60, 26, { colors: ['#ffd84a', '#ff2030', '#ffffff', '#802040'], speed: 220, life: 0.9, grav: 0 }); } },
      { a: 'punchGround', d: 0.4, lock: true, on: () => { for (const x of [50, 590, U.rand(200, 440)]) ar.shrooms.push(new L6.Shroom(BG6() + x, ar)); ar.quakes.push(new L6.Quake(this.x, -1, 260), new L6.Quake(this.x, 1, 260)); } },
      { a: 'rage', d: 0.8, lock: true }]);
  }
  choose(ar, adx, dx) {
    if (this.queued) { const q = this.queued; this.queued = null; this.perform(q, ar); return; }
    const A = this.actCool, ph2 = this.phase >= 2, pl = ar.player;
    const opts = [];
    const ok = k => !(A[k] > 0);
    const perched = this.perchT > 0;
    if (!perched && adx < 230 && ok('dash')) opts.push(['dash', 3]);
    if (!perched && ok('perch') && this.arenaPlats(ar).length) opts.push(['perch', this.phase === 1 ? 3.5 : 4.5]);
    if (ok('portal') && ar.portals.length < (ph2 ? 3 : 2)) opts.push(['portal', 3]);
    if (ok('shroom') && !this.invul) opts.push(['shroom', ar.shrooms.length ? 0 : 2.2]);
    if (ok('summon') && ar.foes.length < (ph2 ? 3 : 2)) opts.push(['summon', 2]);
    if (ok('python') && !this.pyAway && this.pyCool <= 0 && adx > 90 && !pl.stuck) opts.push(['python', 3]);
    if (ok('rain') && !ar.rainT) opts.push(['rain', ph2 ? 2 : 1.2]);
    if (ok('bolt')) opts.push(['bolt', 2]);
    if (ok('quake') && ph2 && !perched) opts.push(['quake', 2.6]);
    if (ok('volley') && ph2) opts.push(['volley', 2.4]);
    if (ok('spore') && this.phase === 3 && ar.spores.length < 2) opts.push(['spore', 2.2]);
    if (ok('taunt') && adx > 160 && this.phase < 3) opts.push(['taunt', 0.8]);
    const tot = opts.reduce((s, o) => s + o[1], 0);
    if (!tot) { this.think = 0.4; this.st = 0; return; }
    let r = Math.random() * tot, pick = opts[0][0];
    for (const o of opts) { r -= o[1]; if (r <= 0) { pick = o[0]; break; } }
    if (pick === this.lastAct && opts.length > 1 && Math.random() < 0.6) pick = opts.find(o => o[0] !== this.lastAct)[0];
    this.perform(pick, ar);
  }
  perform(k, ar) {
    const pl = ar.player, f = this.facing, ph2 = this.phase >= 2, A = this.actCool;
    this.facing = pl.x > this.x ? 1 : -1;
    switch (k) {
      case 'perch': {
        A.perch = this.phase === 3 ? 4.5 : 6;
        const ps = this.arenaPlats(ar).filter(p => Math.abs(p.x + p.w / 2 - pl.x) > 90);
        const p = ps.length ? ps.reduce((b, q) => q.y < b.y ? q : b) : null;
        if (p) this.hopTo(p.x + p.w / 2, p.y, p);
        break;
      }
      case 'dash':
        A.dash = ph2 ? 2.2 : 3.2; this.hitDone = false;
        this.doSeq('dash', [{ a: 'crouch', d: 0.28 }, { a: 'dash', d: 0.34, fixed: true, move: 520, upd: () => { if (!this.hitDone && U.overlap(this.box, pl.box)) { this.hitDone = true; pl.hurt(10, this.x, ar.world); } } }, { a: 'slide', d: 0.35, fixed: true, move: 120 }, { a: 'smirk', d: 0.4 }]);
        this.say(U.choice(['Хоп!', 'Лови!']));
        if (this.phase === 3 && Math.random() < 0.6) this.combo2 = 'volley';
        break;
      case 'quake':
        A.quake = this.phase === 3 ? 4.5 : 6;
        this.doSeq('quake', [{ a: 'kneelCast', d: 0.55, lock: true, on: () => { this.say(U.choice(['Грибы, из-под земли!', 'Прыгай, Валера!'])); FX.burst(this.x, L6.GROUND - 4, 12, { colors: ['#6a4020', '#c8a070', '#ffd84a'], speed: 90, life: 0.5, grav: 200 }); } },
          { a: 'punchGround', d: 0.4, lock: true, on: () => { G.shake(5, 0.3); Sound.play('boom', 0.9); ar.quakes.push(new L6.Quake(this.x, this.facing, this.phase === 3 ? 270 : 230)); if (this.phase === 3) ar.quakes.push(new L6.Quake(this.x, -this.facing, 200)); } },
          { a: 'smirk', d: 0.45 }]);
        break;
      case 'volley':
        A.volley = this.phase === 3 ? 3.2 : 4.5;
        this.doSeq('volley', [{ a: 'orbUp', d: 0.6, lock: true, on: () => { Sound.play('squeak', 0.8); FX.burst(this.x + this.facing * 20, this.y - 70, 10, { colors: ['#ff2060', '#ffd84a', '#fff'], speed: 60, life: 0.6, grav: 0 }); } },
          { a: 'beam', d: 0.5, lock: true, on: () => { Sound.play('shot', 1.3); const n = this.phase === 3 ? 5 : 3, v0 = 300;
            for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * 0.2; ar.shots.push(new L6.Shot(5, this.x + this.facing * 26, this.y - 56, Math.cos(a) * v0 * this.facing, Math.sin(a) * v0, 9, { spin: false, rot: this.facing > 0 ? a : Math.PI - a, r: 9, sc: 1.0, pass: true, life: 2.6 })); } } },
          { a: 'recoil', d: 0.35 }]);
        break;
      case 'spore':
        A.spore = 5.5;
        this.doSeq('spore', [{ a: 'orbA', d: 0.55, lock: true, on: () => this.say('Спора тьмы!') }, { a: 'beam', d: 0.35, lock: true, on: () => { Sound.play('zap', 1.2); ar.spores.push(new L6.Spore(this.x + this.facing * 24, this.y - 70)); } }, { a: 'recoil', d: 0.3 }]);
        break;
      case 'portal':
        A.portal = ph2 ? 6 : 9;
        this.doSeq('portal', [{ a: 'raise', d: 0.35, lock: true, on: () => this.say('Змеиный круг!') }, { a: 'draw', d: 0.4, lock: true }, { a: 'slam', d: 0.35, lock: true, on: () => { G.shake(4, 0.3); const n = ph2 ? 3 : 2, xs = [pl.x - 70, pl.x + 70, pl.x]; for (let i = 0; i < n; i++) ar.portals.push(new L6.Portal(U.clamp(xs[i] + U.rand(-30, 30), BG6() + 40, BG6() + 600))); } }, { a: 'glow', d: 0.5, lock: true }, { a: 'recoil', d: 0.3 }]);
        break;
      case 'shroom':
        A.shroom = ph2 ? 14 : 18;
        this.doSeq('shroom', [{ a: 'kneelCast', d: 0.55, lock: true, on: () => this.say('Грибная броня!') }, { a: 'punchGround', d: 0.35, lock: true, on: () => { G.shake(5, 0.3); const n = ph2 ? 3 : 2; for (let i = 0; i < n; i++) ar.shrooms.push(new L6.Shroom(BG6() + (i % 2 ? U.rand(50, 100) : U.rand(540, 590)), ar)); FX.popText(this.x, this.y - 104, 'БЕССМЕРТИЕ!', '#ffd84a'); } }, { a: 'pointGround', d: 0.45, lock: true }, { a: 'smirk', d: 0.4 }]);
        break;
      case 'summon':
        A.summon = ph2 ? 9 : 13;
        this.doSeq('summon', [{ a: 'orbA', d: 0.4, lock: true, on: () => this.say('Грибы, ко мне!') }, { a: 'orbUp', d: 0.6, lock: true }, { a: 'beam', d: 0.5, lock: true, on: () => { Sound.play('boom', 1.1); for (let i = 0; i < (ph2 ? 2 : 2); i++) { const x = U.clamp(pl.x + (i ? 120 : -120) + U.rand(-30, 30), BG6() + 40, BG6() + 600); const e = new L6.Foe('amanita', x); e.awake = true; e.x1 = BG6() + 20; e.x2 = BG6() + 620; e.facing = x < pl.x ? 1 : -1; e.summonT = 0.7; ar.foes.push(e); FX.burst(x, L6.GROUND - 10, 10, { colors: ['#802040', '#c04060', '#201028'], speed: 90, life: 0.6 }); } } }, { a: 'recoil', d: 0.3 }]);
        break;
      case 'python':
        A.python = 10;
        this.doSeq('python', [{ a: 'pyPull', d: 0.35, lock: true, on: () => this.say('Питончик, фас!') }, { a: 'pyWind', d: 0.3, lock: true }, { a: 'pyWhip', d: 0.18, lock: true, on: () => { this.pyAway = true; ar.pyshots.push(new L6.PyShot(this.x + this.facing * 24, L6.GROUND - 34 * Math.max(1, ar.player.sc * 0.8), this.facing, this)); } }, { a: 'pyFollow', d: 0.4 }]);
        break;
      case 'rain':
        A.rain = ph2 ? 15 : 20;
        this.doSeq('rain', [{ a: 'skyArms', d: 0.9, lock: true, on: () => { this.say('ГРИБНОЙ ДОЖДЬ!', true); Sound.play('boom', 0.8); } }, { a: 'laugh', d: 0.7, lock: true, on: () => { ar.rainT = ph2 ? 7 : 5.5; } }, { a: 'cackle', d: 1.0, lock: true }, { a: 'laugh', d: 0.8, lock: true }, { a: 'hood', d: 0.5 }]);
        break;
      case 'bolt':
        A.bolt = ph2 ? 3.5 : 5;
        this.doSeq('bolt', [{ a: 'orbA', d: 0.35, lock: true }, { a: 'beam', d: 0.45, lock: true, on: () => { Sound.play('shot', 1.2); const n = ph2 ? 2 : 1; for (let i = 0; i < n; i++) ar.shots.push(new L6.Shot(5, this.x + this.facing * 26, L6.GROUND - 46 + i * -26, this.facing * 330, 0, 9, { spin: false, r: 10, sc: 1.1, pass: true, life: 2.5 })); } }, { a: 'recoil', d: 0.3 }]);
        break;
      default:
        A.taunt = 6;
        this.doSeq('taunt', [{ a: U.choice(['crossed', 'clap', 'bow', 'stare', 'point']), d: 1.1 }]);
    }
  }
  hit(dmg, dir, ar) {
    if (this.state === 'down' || this.state === 'dying' || this.state === 'wait' || this.state === 'dodge') return false;
    if (this.invul) { this.flash = 0.1; this.flashCol = '#ffd84a'; if (Math.random() < 0.5) FX.popText(this.x, this.y - 100, 'БРОНЯ: ЛОМАЙ ГРИБЫ!', '#ffd84a'); Sound.play('clank'); return false; }
    return this.damage(dmg * (this.phase >= 2 ? 0.8 : 1) * (this.vuln > 0 ? 1.5 : 1), dir, ar);
  }
  damage(n, dir, ar, light) {
    this.hp -= n; this.flash = 0.12; this.flashCol = null; Sound.play('hit'); G.hitStop = 0.04;
    if (this.hp <= 0) { this.hp = 0; this.die(ar); return true; }
    this.combo = this.t - this.lastHit < 1.0 ? this.combo + 1 : 1; this.lastHit = this.t;
    if (this.state === 'idle' || (this.state === 'act' && !this.seqLocked())) {
      this.state = 'hurt'; this.st = 0; this.seq = null; this.vx = dir * 120;
      this.play(this.combo >= 3 ? 'stagger' : this.combo === 2 ? 'hurt2' : 'hurt1');
      if (this.combo >= 4) { this.combo = 0; this.stun = 1.1; this.say('Голова кружится...'); }
    }
    return false;
  }
  // реакция на заклинания: у каждого свой «привкус»
  zap(k, ar) {
    const sp = L6.SPELLS[k];
    if (this.state === 'dying' || this.state === 'down' || this.state === 'wait' || this.state === 'dodge') return false;
    if (this.invul) { this.flash = 0.1; this.flashCol = '#ffd84a'; FX.popText(this.x, this.y - 100, 'БРОНЯ: ЛОМАЙ ГРИБЫ!', '#ffd84a'); Sound.play('clank'); return false; }
    const dir = ar.player.facing;
    this.damage(sp.dmg * (L6.zapMul || 1) * 0.5 * (this.phase >= 2 ? 0.85 : 1) * (this.vuln > 0 ? 1.5 : 1), dir, ar);
    if (this.state === 'dying') return true;
    switch (sp.id) {
      case 'fire': this.flash = 0.5; this.flashCol = '#ff7a20'; break;
      case 'ice': this.slow = 1.8; this.flash = 0.5; this.flashCol = '#9fd4ff'; FX.popText(this.x, this.y - 104, 'ЗАМЕДЛИЛО!', '#bfe8ff'); break;
      case 'bolt': this.stun = Math.max(this.stun, 0.7); this.state = 'hurt'; this.seq = null; this.st = 0; FX.popText(this.x, this.y - 104, 'ОГЛУШИЛО!', '#ffe860'); break;
      case 'slime': FX.popText(this.x, this.y - 104, 'ПРЫГ-ПРЫГ!', '#a0ff80'); this.vx = dir * 60; break;
      case 'skull': this.x = U.clamp(this.x + dir * 80, BG6() + 30, BG6() + 610); FX.popText(this.x, this.y - 104, 'ПОТЯНУЛО!', '#d8a0ff'); break;
      case 'star': this.vx = dir * 260; this.state = 'hurt'; this.st = 0; this.seq = null; this.play('stagger'); break;
      case 'rainbow': if (this.state !== 'act') { this.state = 'act'; this.doSeq('dance', [{ a: 'clap', d: 0.5 }, { a: 'laugh', d: 0.5 }, { a: 'bow', d: 0.4 }]); FX.popText(this.x, this.y - 104, 'ПЛЯШЕТ!', '#ff9ad0'); } break;
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
    else if (d < 1.6) this.play('knee');
    else if (d < 2.2) { this.play('fallBack'); this.x = U.clamp(this.x - this.facing * 60 * dt, BG6() + 30, BG6() + 610); }
    else if (d < 3.6) { this.play('lieShrooms'); if (Math.random() < dt * 8) FX.burst(this.x + U.rand(-30, 30), L6.GROUND - 10, 1, { colors: ['#c02030', '#ffffff'], speed: 30, life: 0.5, grav: -30, size: 3 }); }
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
    this.player = run.player; this.player.controls = false;
    this.boss = new L6.Vande(BG6() + 440); this.boss.state = 'wait';
    this.portals = []; this.shrooms = []; this.foes = []; this.pyshots = []; this.quakes = []; this.spores = []; this.shots = []; this.spells = []; this.fx = []; this.clouds = [];
    this.drops = []; this.splashes = []; this.rainT = 0; this.rainAcc = 0; this.fighting = false; this.dropped = {}; this.quipT = 5; this.hint = null; this.hintA = 0; this.hintT = 0; this.resetting = false;
    this.world.enemies = []; this.world.pickups = [];
    this.world.castSpell = (k, x, y, dir, up, o) => { const sp = new L6.Spell(k, x, y, dir, up, o); this.spells.push(sp); return sp; };
    this.world.targets = () => this.targetList();
    this.world.playerAttack = (hb, dmg, atk, pl) => this.playerAttack(hb, dmg, atk, pl);
  }
  targetList() { const b = this.boss; return [...this.spores.filter(s => !s.dead), ...this.foes.filter(e => !e.dead && e.dieT == null), ...this.shrooms.filter(s => s.grown && !s.dead), ...(b.state !== 'wait' && b.state !== 'down' ? [b] : [])]; }
  transform(foe, id) { L6.Run.prototype.transform.call(this, foe, id); this.world.addScore(0); }
  startFight() { this.fighting = true; this.player.controls = true; this.boss.state = 'idle'; this.boss.st = 0; this.hint = 'Ванделорд уворачивается от выстрелов. Бей, когда он занят колдовством. Грибы-щиты ломай первыми!'; this.hintT = 7; }
  playerAttack(hb, dmg, atk, pl) {
    const b = this.boss;
    for (const s of this.shrooms) if (s.grown && !s.dead && !atk.hit.has(s) && U.overlap(hb, s.box)) { atk.hit.add(s); const k = s.hit(dmg); if (k) this.world.addScore(300); FX.burst(s.x, s.y - 40, 5, { colors: ['#fff', '#c02030'], speed: 100, life: 0.3, grav: 0 }); }
    for (const s of this.spores) if (!s.dead && U.overlap(hb, s.box)) s.hit();
    for (const e of this.foes) if (!e.dead && e.dieT == null && !atk.hit.has(e) && U.overlap(hb, e.box)) { atk.hit.add(e); const k = e.hit(dmg, pl.facing); Sound.play('hit'); if (k) this.world.addScore(e.score); }
    if (this.fighting && !atk.hit.has(b) && U.overlap(hb, b.box)) { atk.hit.add(b); if (b.hit(dmg, pl.facing, this) !== false || !b.invul) { G.shake(2, 0.1); FX.burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 7, { colors: ['#fff', '#ffd84a'], speed: 130, life: 0.25, grav: 0 }); this.world.addScore(80 * dmg); } }
  }
  onBossDying() { this.fighting = false; this.player.controls = false; this.shots = []; this.drops = []; this.rainT = 0; this.portals = []; this.pyshots = []; this.quakes = []; this.spores = []; for (const e of this.foes) { e.dead = true; } this.shrooms = []; Music.stop(); G.shake(8, 0.6); G.flash(0.2); Sound.play('boom'); }
  bossDown() { this.world.addScore(8000); this.level.stats.kills++; setTimeout(() => this.level.bossDefeated(), 600); }
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
      [45, 20].forEach(th => { const pc = b.hp / b.maxHp * 100; if (pc <= th && !this.dropped[th]) { this.dropped[th] = 1; const p = new L6.GrowPick(BG6() + U.rand(120, 520), -10); p.falling = true; wd.pickups.push(p); } });
      for (const p of wd.pickups) p.update(dt, wd, pl); wd.pickups = wd.pickups.filter(p => !p.dead);
      this.quipT -= dt;
      if (this.quipT <= 0) { this.quipT = U.rand(8, 12); G.say(pl, U.choice(['Отдай Вову!', 'Грибы — не еда для всех!', 'Сейчас колдану!', 'Змеи — это перебор!']), 1.6); }
      if (pl.dead && pl.deadT > 1.6 && !this.resetting) { this.resetting = true; this.level.stats.deaths++; setTimeout(() => { this.resetting = false; this.level.restartBoss(); }, 400); }
    }
    if (this.hintT > 0) { this.hintT -= dt; this.hintA = Math.min(1, this.hintA + dt * 4); } else this.hintA = Math.max(0, this.hintA - dt * 3);
  }
  draw(c) {
    const wd = this.world, cx = BG6(), b = this.boss;
    if (L6.img.arena) c.drawImage(L6.img.arena, 0, 0, W, H); else { c.fillStyle = '#c8a070'; c.fillRect(0, 0, W, H); }
    for (const p of this.run.platSpr) if (p.x >= cx - 60 && !L6.FRONT[p.name]) L6.drawPlat(c, p, cx);
    for (const p of this.portals) p.draw(c, cx);
    for (const q of this.quakes) q.draw(c, cx);
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
