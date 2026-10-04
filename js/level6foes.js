'use strict';
// ============ УРОВЕНЬ 6: враги, снаряды врагов, эффекты превращений ============
const GR6 = () => L6.GROUND;

// ---------- анимации врагов ----------
Spr.ANIM.yeti = {
  idle: A6('yeti4', [4], 1), walk: A6('yeti4', [0, 1, 2, 3], 6), wind: A6('yeti4', [4, 5], 4, { once: true }), smash: A6('yeti4', [6], 9, { once: true }), recover: A6('yeti4', [6, 4], 3, { once: true }),
  scoop: A6('yeti3', [1], 1), hold: A6('yeti3', [2], 1), windT: A6('yeti3', [3], 1), throw: A6('yeti3', [4], 1), after: A6('yeti3', [5], 1), hurt: A6('yeti3', [6], 1), roar: A6('yeti4', [7], 1), ko: A6('yeti3', [7], 1),
};
Spr.ANIM.amanita = {
  idle: A6('amanita', [0], 1), walk: A6('amanita2', rng(6), 9), lean: A6('amanita2', [6], 1), lunge: A6('amanita2', [7], 1), recover: A6('amanita2', [8], 1),
  inhale: A6('amanita2', [9], 1), puff: A6('amanita2', [10, 11], 6, { once: true }), hurt: A6('amanita', [5], 1), ko: A6('amanita', [7], 1),
};
Spr.ANIM.beaver = {
  idle: A6('beaver', [0], 1), walk: A6('beaver2', rng(6), 8), turn: A6('beaver2', [6], 1), tailUp: A6('beaver2', [7, 8], 5, { once: true }), slam: A6('beaver2', [9], 1),
  squirt: A6('beaver2', [10, 11, 11, 11], 10), hurt: A6('beaver', [5], 1), ko: A6('beaver', [7], 1),
};
Spr.ANIM.crow = {
  idle: A6('crow2', rng(6), 14), fly: A6('crow2', rng(6), 14), fold: A6('crow2', [6], 1), dive: A6('crow2', [7], 1), peck: A6('crow2', [8], 1), pull: A6('crow2', [9], 1),
  caw: A6('crow2', [10, 9], 10), bank: A6('crow2', [11], 1), hurt: A6('crow', [5], 1), ko: A6('crow', [7], 1),
};
Spr.ANIM.mowgli = {
  idle: A6('mowgli2', [11], 1), hang: A6('mowgli2', [11, 9], 3), hangWind: A6('mowgli2', [9], 1), hangThrow: A6('mowgli2', [10], 1), gallop: A6('mowgli2', rng(6), 14), walk: A6('mowgli2', rng(6), 10),
  crouch: A6('mowgli2', [6], 1), leap: A6('mowgli2', [7], 1), land: A6('mowgli2', [8], 1), hurt: A6('mowgli', [5], 1), ko: A6('mowgli', [7], 1), beat: A6('mowgli', [6], 1),
};
Spr.ANIM.rose = {
  idle: A6('rose2', [0], 1), walk: A6('rose2', rng(6), 7), open: A6('rose2', [12, 13], 6, { once: true }), bite: A6('rose2', [14], 1), recover: A6('rose2', [15], 1),
  inflate: A6('rose2', [16], 1), spray: A6('rose2', [17], 1), hurt: A6('rose', [5], 1), ko: A6('rose', [7], 1),
};
Spr.ANIM.viper = {
  idle: A6('viper', [0], 1), walk: A6('viper', [1, 2, 3, 2], 8), rear: A6('viper', [4], 1), strike: A6('viper', [4], 1), hurt: A6('viper', [6], 1), ko: A6('viper', [7], 1),
};
Spr.ANIM.nettle = {
  idle: A6('nettle', [0], 1), walk: A6('nettle2', rng(6), 11), jabWind: A6('nettle2', [6], 1), jab: A6('nettle2', [7], 1), hookWind: A6('nettle2', [8], 1), hook: A6('nettle2', [9], 1),
  upWind: A6('nettle2', [10], 1), upper: A6('nettle2', [11], 1), hurt: A6('nettle', [5], 1), ko: A6('nettle', [7], 1),
};

const FOEDEF = {
  viper: { hp: 2, w: 44, h: 24, score: 150, voice: 200, lines: ['Ш-ш-ш!', 'Не наступи!'] },
  yeti: { hp: 14, sc: 1.3, w: 38, h: 100, score: 700, voice: 110, lines: ['РРРАААУ!', 'Лесной великан идёт!', 'Грр! Лапы прочь!'] },
  amanita: { hp: 6, sc: 1.5, w: 22, h: 84, score: 200, voice: 240, lines: ['Я не поганка!', 'В лукошко не хочу!', 'Съешь меня — не пожалеешь!'] },
  beaver: { hp: 3, w: 28, h: 50, score: 250, voice: 360, lines: ['Плотина — моя!', 'Хвост-то у меня железный!', 'Кыш из болота!'] },
  crow: { hp: 2, w: 24, h: 26, score: 200, voice: 520, lines: ['Кар!', 'Карррр!', 'Клюну в темечко!'] },
  mowgli: { hp: 4, w: 22, h: 56, score: 300, voice: 280, lines: ['У-а-а!', 'Шишкой в лоб!', 'Я Маугли, ты пенёк!'] },
  rose: { hp: 6, w: 30, h: 64, score: 350, voice: 200, lines: ['Я колючий!', 'Погладь меня!', 'Цап!'] },
  nettle: { hp: 7, w: 24, h: 84, score: 450, voice: 170, lines: ['Жжёт, да?', 'Крапива не прощает!', 'Бью с листа!'] },
};
L6.FOEDEF = FOEDEF;

// ---------- снаряды врагов (спрайты proj6: 0 снежок, 1 шишка, 2 шип, 3 капля кислоты, 4 всплеск, 5 тёмный болт, 6 споры, 7 лист) ----------
L6.Shot = class {
  constructor(fr, x, y, vx, vy, dmg, o = {}) {
    Object.assign(this, { fr, x, y, vx, vy, dmg, grav: 0, rot: 0, vr: 0, life: 3, t: 0, dead: false, r: 8, sc: 1, spin: true }, o);
  }
  get box() { return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 }; }
  update(dt, run, pl) {
    this.t += dt; this.vy += this.grav * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.rot += this.vr * dt;
    if (this.t > this.life || this.x < -50 || this.x > L6.W + 50) this.dead = true;
    if (this.fx) return;
    if (this.y >= GR6() - 2 && this.vy > 0 && !this.pass) { this.dead = true; if (this.onLand) this.onLand(run); else FX.dust(this.x, this.y, 3); return; }
    if (!this.fx && !pl.dead && U.overlap(this.box, pl.box)) { if (pl.hurt(this.dmg, this.x - Math.sign(this.vx || 1) * 8, run.world)) { this.dead = true; if (this.sheet === 'tree6') this.onLand && this.onLand(run, true); } }
  }
  draw(c, cx) {
    const ang = this.spin ? this.rot : Math.atan2(this.vy, this.vx);
    const fr = this.fx ? 4 + Math.min(3, (this.t / 0.14) | 0) : this.fr;
    Spr.drawC(c, this.sheet || 'proj6', fr, this.x - cx, this.y, this.fx ? 0 : ang, this.sc);
  }
};

// ---------- враг ----------
L6.Foe = class {
  constructor(type, x, o = {}) {
    const d0 = FOEDEF[type], k0 = d0.sc || 1, d = k0 === 1 ? d0 : Object.assign({}, d0, { w: d0.w * k0, h: d0.h * k0 });
    Object.assign(this, { type, d, set: type, x, y: GR6(), facing: -1, hp: d.hp, maxHp: d.hp, state: 'idle', st: 0, t: Math.random() * 5, vx: 0, vy: 0, flash: 0, dead: false, anim: 'idle', animT: 0, cool: 1 + Math.random(), cool2: 2 + Math.random() * 2, awake: false, voice: d.voice, said: false, dieT: null, alpha: 1, x1: x - 9999, x2: x + 9999, combo: 0, hitDone: false, perch: false }, o);
    this.headH = d.h + 10; this.score = d.score;
    if (type === 'crow') { this.y = 110; this.homeY = 110; this.state = 'sleep'; }
    this.baseY = this.y;
    this.play(type === 'mowgli' && this.perch ? 'hang' : type === 'crow' ? 'fly' : 'idle');
  }
  get box() { if (this.state === 'hide') return { x: -9999, y: -9999, w: 1, h: 1 }; const d = this.d; const h = this.type === 'crow' ? d.h : d.h; return { x: this.x - d.w / 2, y: this.y - h, w: d.w, h }; }
  play(a) { if (this.anim !== a) { this.anim = a; this.animT = 0; } }
  go(s, a) { this.state = s; this.st = 0; if (a) this.play(a); }
  snap() { return { set: this.set, anim: this.anim, animT: this.animT, x: this.x, y: this.y, facing: this.facing, h: this.d.h, type: this.type, sc: this.d.sc || 1 }; }
  talk() { const now = performance.now(); if (!this.said && Math.random() < 0.6 && now - (L6.talkAt || 0) > 3500) { this.said = true; L6.talkAt = now; G.say(this, U.choice(this.d.lines), 1.6); } }   // не больше одной реплики врагов за 3.5 с
  // обычный удар кулаком/снарядом
  hit(dmg, dir) {
    if (this.dieT != null || this.dead) return false;
    this.hp -= dmg; this.flash = 0.12;
    if (this.type !== 'crow') this.x = U.clamp(this.x + dir * 6, this.x1, this.x2);
    if (this.hp <= 0) { this.dieT = 0; this.vx = dir * 120; this.vy = -200; this.play('ko'); Sound.play('hit'); return true; }
    if (!['wind', 'smash', 'lunge', 'dive', 'slam'].includes(this.state) || Math.random() < 0.3) { this.hurtState = true; this.go('hurt', 'hurt'); this.vx = dir * 90; }
    return false;
  }
  // заклинание: слабых — в превращение, крепких — сначала ранит
  zap(k, run) {
    if (this.dieT != null || this.dead) return false;
    const sp = L6.SPELLS[k], dm = sp.dmg * 2 * (L6.zapMul || 1);   // палочка против обычных врагов сильная: чаще всего превращает с первого попадания
    if (this.hp > dm) { this.hp -= dm; this.flash = 0.2; this.go('hurt', 'hurt'); this.vx = (this.facing > 0 ? -1 : 1) * 60; FX.popText(this.x, this.y - this.d.h - 6, 'ЕЩЁ РАЗОК!', '#c8a0ff'); return false; }
    this.dead = true; run.transform(this, sp.id);
    return true;
  }
  update(dt, run, pl) {
    this.t += dt; this.st += dt; this.animT += dt; this.cool -= dt; this.cool2 -= dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.dieT != null) {
      this.dieT += dt; this.vy += 1100 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
      const floor = this.type === 'crow' ? GR6() : this.baseOnPlat || GR6();
      if (this.y > floor) { this.y = floor; this.vy = 0; this.vx *= 0.8; }
      if (this.dieT > 1.8) this.dead = true;
      this.alpha = this.dieT > 1.3 ? (1.8 - this.dieT) / 0.5 : 1;
      return;
    }
    const dx = pl.x - this.x, adx = Math.abs(dx), near = Math.abs(pl.y - this.y) < 80 && !pl.dead;
    if (!this.awake) { if (adx < (this.type === 'crow' ? 460 : 520)) { this.awake = true; this.talk(); if (this.type === 'crow') this.go('hover', 'fly'); } else { return; } }
    this.face = () => { this.facing = dx > 0 ? 1 : -1; };
    this.ai(dt, run, pl, dx, adx, near);
  }
  moveX(sp, dt) { this.x = U.clamp(this.x + this.facing * sp * dt, this.x1, this.x2); }
  melee(run, pl, reach, dmg, yoff = 60, hh = 40) {
    const k = this.d.sc || 1; reach *= k; yoff *= k; hh *= k;
    const hb = { x: this.x + (this.facing > 0 ? 2 : -reach), y: this.y - yoff, w: reach, h: hh };
    if (!pl.dead && U.overlap(hb, pl.box)) { pl.hurt(dmg, this.x, run.world); return true; }
    return false;
  }
  ai(dt, run, pl, dx, adx, near) {
    const S = this.state;
    if (S === 'hurt') { this.x = U.clamp(this.x + this.vx * dt, this.x1, this.x2); this.vx *= 0.88; if (this.st > 0.32) this.go('walk', 'walk'); return; }
    switch (this.type) {
      case 'yeti': {
        if (S === 'idle') this.go('walk', 'walk');
        else if (S === 'walk') {
          this.face(); this.moveX(46, dt);
          if (adx < 84 && near && this.cool <= 0) this.go('wind', 'wind');
          else if (adx > 150 && adx < 360 && this.cool2 <= 0) this.go('scoop', 'scoop');
        } else if (S === 'wind') { this.face(); if (this.st > 0.65) { this.go('smash', 'smash'); this.hitDone = false; } }
        else if (S === 'smash') {
          if (this.st > 0.1 && !this.hitDone) { this.hitDone = true; G.shake(5, 0.3); Sound.play('stomp'); FX.dust(this.x + this.facing * 40, GR6(), 8); this.melee(run, pl, 96, 14, 70, 70); }
          if (this.st > 0.4) { this.go('recover', 'recover'); this.cool = 2.2; }
        } else if (S === 'recover') { if (this.st > 0.8) this.go('walk', 'walk'); }
        else if (S === 'scoop') { this.face(); if (this.st > 0.6) this.go('hold', 'hold'); }
        else if (S === 'hold') { this.face(); if (this.st > 0.5) this.go('windT', 'windT'); }
        else if (S === 'windT') { this.face(); if (this.st > 0.35) {
          this.go('throw', 'throw'); const sx = this.x + this.facing * 30, sy = this.y - 120, tx = pl.x, ty = pl.y - 40, T = 0.85, g = 700;
          const sh = new L6.Shot(0, sx, sy, (tx - sx) / T, (ty - sy - 0.5 * g * T * T) / T, 14, { grav: g, vr: 7 * this.facing, r: 22, sc: 1, sheet: 'tree6', life: 2.5 });
          sh.onLand = (rn, hit) => { G.shake(5, 0.3); Sound.play('stomp'); FX.dust(sh.x, GR6(), 8); const d = new L6.Shot(0, sh.x, GR6() - 2, 0, 0, 0, { sheet: 'tree6', fx: true, life: 0.6, sc: 1 }); rn.shots.push(d); };
          run.shots.push(sh); Sound.play('throw'); this.cool2 = 4.5; } }
        else if (S === 'throw') { if (this.st > 0.4) this.go('after', 'after'); }
        else if (S === 'after') { if (this.st > 0.4) this.go('walk', 'walk'); }
        break;
      }
      case 'amanita': {
        if (S === 'idle') this.go('walk', 'walk');
        else if (S === 'walk') {
          this.face(); if (adx > 120) this.moveX(52, dt);
          if (this.cool <= 0 && adx < 105 && near) this.go('lean', 'lean');
          else if (this.cool <= 0 && adx >= 105 && adx < 300) this.go('inhale', 'inhale');
        } else if (S === 'lean') { this.face(); if (this.st > 0.42) { this.go('lunge', 'lunge'); this.hitDone = false; } }
        else if (S === 'lunge') {
          this.x = U.clamp(this.x + this.facing * 240 * dt, this.x1, this.x2);
          if (!this.hitDone && this.melee(run, pl, 46, 9, 66, 50)) this.hitDone = true;
          if (this.st > 0.28) { this.go('recover', 'recover'); this.cool = 2.0; }
        } else if (S === 'recover') { if (this.st > 0.55) this.go('walk', 'walk'); }
        else if (S === 'inhale') { this.face(); if (this.st > 0.55) { this.go('puff', 'puff'); run.clouds.push({ x: this.x + this.facing * 26, y: this.y - 52, t: 0, life: 3.4, r: 42, row: 1 }); Sound.play('fart', 1.6); } }
        else if (S === 'puff') { if (this.st > 0.6) { this.go('walk', 'walk'); this.cool = 2.6; } }
        break;
      }
      case 'beaver': {
        if (S === 'idle') this.go('walk', 'walk');
        else if (S === 'walk') {
          this.face(); if (adx > 55) this.moveX(46, dt);
          if (adx < 74 && near && this.cool <= 0) this.go('tailUp', 'tailUp');
          else if (adx > 100 && adx < 230 && near && this.cool2 <= 0) this.go('turn', 'turn');
        } else if (S === 'tailUp') { this.face(); if (this.st > 0.55) { this.go('slam', 'slam'); this.hitDone = false; } }
        else if (S === 'slam') {
          if (!this.hitDone && this.st > 0.05) { this.hitDone = true; G.shake(3, 0.2); Sound.play('stomp'); FX.dust(this.x + this.facing * 30, GR6(), 5); this.melee(run, pl, 66, 8, 40, 40); }
          if (this.st > 0.45) { this.go('walk', 'walk'); this.cool = 1.8; }
        } else if (S === 'turn') { this.facing = dx > 0 ? -1 : 1; if (this.st > 0.35) { this.go('squirt', 'squirt'); this.jetT = 0; Sound.play('splash', 1.4); } }
        else if (S === 'squirt') {
          this.jetT += dt;
          const hb = { x: this.x - this.facing * 130 - (this.facing < 0 ? -110 : 0), y: this.y - 30, w: 130, h: 26 };
          if (this.facing > 0) hb.x = this.x - 135; else hb.x = this.x + 5;
          if (this.jetT > 0.18 && !pl.dead && U.overlap(hb, pl.box) && pl.hurt(6, this.x, run.world)) this.jetT = 0;
          if (this.st > 1.2) { this.go('walk', 'walk'); this.cool2 = 4; }
        }
        break;
      }
      case 'crow': {
        this.t2 = (this.t2 || 0) + dt;
        if (S === 'sleep') break;
        if (S === 'hover') {
          const tx = pl.x + Math.sin(this.t2 * 0.9 + this.t) * 150, ty = this.homeY + Math.sin(this.t2 * 2.2) * 12;
          this.x += (tx - this.x) * Math.min(1, dt * 1.6); this.y += (ty - this.y) * Math.min(1, dt * 3);
          this.facing = tx > this.x ? 1 : -1; this.play('fly');
          if (this.cool <= 0 && !pl.dead) { this.go('caw', 'caw'); if (Math.random() < 0.3) G.say(this, 'КАР!', 0.7, { sound: false }); Sound.play('gull', 1.5); }
        } else if (S === 'caw') {
          this.facing = dx > 0 ? 1 : -1;
          if (this.st > 0.6) { this.go('dive', 'dive'); this.tx = pl.x; this.ty = pl.y - 62 * (pl.sc || 1); const d = Math.hypot(this.tx - this.x, this.ty - this.y) || 1; this.dvx = (this.tx - this.x) / d * 380; this.dvy = (this.ty - this.y) / d * 380; this.hitDone = false; }
        } else if (S === 'dive') {
          this.x += this.dvx * dt; this.y += this.dvy * dt; this.facing = this.dvx > 0 ? 1 : -1;
          if (this.st > 0.12) this.play('peck');
          if (!this.hitDone && !pl.dead && U.overlap(this.box, pl.box)) { this.hitDone = true; pl.hurt(7, this.x, run.world); }
          if (this.y >= this.ty || this.st > 0.75) this.go('pull', 'pull');
        } else if (S === 'pull') {
          this.y -= 190 * dt; this.x += this.facing * 90 * dt;
          if (this.y <= this.homeY + 8) { this.go('hover', 'fly'); this.cool = U.rand(1.8, 3); }
        }
        break;
      }
      case 'mowgli': {
        if (S === 'idle' && this.perch) this.go('perch', 'hang');
        else if (S === 'idle') this.go('gallop', 'gallop');
        if (S === 'perch') {
          this.alpha = Math.min(1, this.alpha + dt * 6); this.face();
          this.x = U.clamp(this.x + Math.sin(this.t * 0.8) * 8 * dt, this.x1, this.x2);
          this.hopT = (this.hopT == null ? U.rand(1.5, 3) : this.hopT) - dt;
          const opts = this.branches && this.hopT <= 0 ? this.branches.filter(b => Math.abs(b.y - this.y) > 20 && Math.abs(b.y - this.y) < 120 && Math.abs(b.x - this.x) < 240) : [];
          if (opts.length) { const b = U.choice(opts); this.hopT = U.rand(2.5, 4.5); this.hop = { x0: this.x, y0: this.y, x1: b.x + U.rand(-b.w * 0.3, b.w * 0.3), y1: b.y, w: b.w, t: 0 }; this.facing = b.x > this.x ? 1 : -1; this.go('hop', 'leap'); }
          else if (adx < 70 && near) { this.go('crouch', 'crouch'); }
          else if (this.cool <= 0 && adx < 430) this.go('throwWind', 'hangWind');
        } else if (S === 'throwWind') { this.face(); if (this.st > 0.4) { this.go('throw', 'hangThrow'); const sx = this.x + this.facing * 12, sy = this.y - 40, tx = pl.x, ty = pl.y - 36, T = 0.8, g = 900; run.shots.push(new L6.Shot(1, sx, sy, (tx - sx) / T, (ty - sy - 0.5 * g * T * T) / T, 7, { grav: g, vr: 12, r: 7 })); Sound.play('throw'); } }
        else if (S === 'throw') { if (this.st > 0.35) { this.go('hide', 'hang'); this.cool = 1.6; FX.burst(this.x, this.y - 40, 6, { colors: ['#7a9a3a', '#d8a020'], speed: 60, life: 0.5, grav: 60 }); Sound.play('throw', 0.4); } }
        else if (S === 'hop') { const h = this.hop; h.t += dt; const k = Math.min(1, h.t / 0.6); this.x = h.x0 + (h.x1 - h.x0) * k; this.y = h.y0 + (h.y1 - h.y0) * k - Math.sin(k * Math.PI) * 60;
          if (!this.hitDone && this.melee(run, pl, 36, 8, 44, 40)) this.hitDone = true;
          if (k >= 1) { this.y = h.y1; this.x1 = h.x1 - h.w * 0.4; this.x2 = h.x1 + h.w * 0.4; this.baseOnPlat = h.y1; this.hitDone = false; this.go('perch', 'hang'); this.cool = Math.max(this.cool, 0.6); } }
        else if (S === 'hide') { this.alpha = Math.max(0.15, this.alpha - dt * 6); if (this.st > 1.0) { this.cool = Math.max(this.cool, 1.3); this.go('perch', 'hang'); FX.burst(this.x, this.y - 40, 5, { colors: ['#7a9a3a', '#d8a020'], speed: 60, life: 0.4, grav: 60 }); } }
        else if (S === 'crouch') { this.face(); if (this.st > 0.3) { this.go('leap', 'leap'); this.vx = this.facing * 200; this.vy = -300; this.perch = false; } }
        else if (S === 'leap') {
          this.vy += 1500 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
          if (!this.hitDone && this.melee(run, pl, 36, 8, 44, 40)) this.hitDone = true;
          if (this.y >= GR6()) { this.y = GR6(); this.vy = 0; this.go('gallop', 'land'); this.hitDone = false; this.x1 = this.x - 9999; this.x2 = this.x + 9999; }
        } else if (S === 'gallop') {
          this.face(); if (this.anim === 'land' && this.st > 0.2) this.play('gallop');
          if (this.anim === 'gallop') this.moveX(135, dt);
          if (this.cool <= 0 && adx < 46 && near) { this.melee(run, pl, 40, 8, 40, 36); this.cool = 0.9; }
        }
        break;
      }
      case 'viper': {
        if (S === 'idle') this.go('walk', 'walk');
        else if (S === 'walk') {
          this.face(); this.moveX(adx > 40 ? 52 : 0, dt);
          if (adx < 95 && near && this.cool <= 0) this.go('rear', 'rear');
        } else if (S === 'rear') { this.face(); if (this.st > 0.4) { this.go('strike', 'strike'); this.hitDone = false; Sound.play('throw', 0.5); } }
        else if (S === 'strike') {
          this.x = U.clamp(this.x + this.facing * 230 * dt, this.x1, this.x2);
          if (!this.hitDone && this.melee(run, pl, 40, 7, 26, 22)) this.hitDone = true;
          if (this.st > 0.28) { this.go('walk', 'walk'); this.cool = 1.6; }
        }
        break;
      }
      case 'rose': {
        if (S === 'idle') this.go('walk', 'walk');
        else if (S === 'walk') {
          this.face(); if (adx > 60) this.moveX(30, dt);
          if (adx < 72 && near && this.cool <= 0) this.go('open', 'open');
          else if (adx > 110 && adx < 280 && this.cool2 <= 0) this.go('inflate', 'inflate');
        } else if (S === 'open') { this.face(); if (this.st > 0.5) { this.go('bite', 'bite'); this.hitDone = false; } }
        else if (S === 'bite') {
          this.x = U.clamp(this.x + this.facing * 120 * dt, this.x1, this.x2);
          if (!this.hitDone && this.melee(run, pl, 44, 10, 50, 44)) this.hitDone = true;
          if (this.st > 0.22) { this.go('recover', 'recover'); this.cool = 2.0; }
        } else if (S === 'recover') { if (this.st > 0.6) this.go('walk', 'walk'); }
        else if (S === 'inflate') { this.face(); if (this.st > 0.6) { this.go('spray', 'spray'); for (const a of [-0.3, 0, 0.3]) run.shots.push(new L6.Shot(2, this.x + this.facing * 22, this.y - 34, Math.cos(a) * 280 * this.facing, Math.sin(a) * 260 - 30, 6, { grav: 220, spin: false, r: 6, sc: 1.2 })); Sound.play('throw', 1.3); } }
        else if (S === 'spray') { if (this.st > 0.55) { this.go('walk', 'walk'); this.cool2 = 3.6; } }
        break;
      }
      case 'nettle': {
        if (S === 'idle') this.go('walk', 'walk');
        else if (S === 'walk') {
          this.face(); if (adx > 50) this.moveX(88, dt);
          if (adx < 62 && near && this.cool <= 0) { this.combo = 0; this.go('jabWind', 'jabWind'); }
        } else if (S === 'jabWind') { this.face(); if (this.st > 0.2) { this.go('jab', 'jab'); this.hitDone = false; } }
        else if (S === 'jab') {
          if (!this.hitDone && this.st > 0.04) { this.hitDone = true; Sound.play('punch'); this.melee(run, pl, 56, 6, 62, 24); }
          if (this.st > 0.2) { this.combo++; if (adx < 70) this.go('hookWind', 'hookWind'); else { this.go('walk', 'walk'); this.cool = 1.4; } }
        } else if (S === 'hookWind') { this.face(); if (this.st > 0.24) { this.go('hook', 'hook'); this.hitDone = false; } }
        else if (S === 'hook') {
          if (!this.hitDone && this.st > 0.05) { this.hitDone = true; Sound.play('punch'); this.melee(run, pl, 58, 8, 66, 30); }
          if (this.st > 0.22) { if (adx < 75 && Math.random() < 0.65) this.go('upWind', 'upWind'); else { this.go('walk', 'walk'); this.cool = 1.6; } }
        } else if (S === 'upWind') { this.face(); if (this.st > 0.26) { this.go('upper', 'upper'); this.hitDone = false; } }
        else if (S === 'upper') {
          if (!this.hitDone && this.st > 0.06) { this.hitDone = true; Sound.play('punch', 0.8); this.melee(run, pl, 40, 10, 92, 62); }
          if (this.st > 0.3) { this.go('walk', 'walk'); this.cool = 2.0; }
        }
        break;
      }
    }
  }
  // струя из-под хвоста — отдельный сплайн (Безье), бьёт только назад
  drawJet(c, cx, y) {
    const f = this.facing, k = Math.min(1, (this.st - 0.1) / 0.18), T = this.t * 9;
    const X = this.x - cx, p0 = [X - f * 22, y - 20], p1 = [X - f * (60 * k), y - 20 - 34 * k], p2 = [X - f * (112 * k), y - 20 - 30 * k], p3 = [X - f * (22 + 132 * k), y - 20 + 14 * k * 0.4];
    const pt = t => { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; };
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    for (const [w, col, dash] of [[8, 'rgba(70,160,230,0.85)', 0], [5, 'rgba(150,215,255,0.95)', 0], [2, 'rgba(255,255,255,0.95)', 1]]) {
      c.strokeStyle = col; c.lineWidth = w * (0.6 + 0.4 * k); if (dash) { c.setLineDash([9, 7]); c.lineDashOffset = -T * 14; } else c.setLineDash([]);
      c.beginPath(); c.moveTo(p0[0], p0[1]); c.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]); c.stroke();
    }
    c.setLineDash([]); c.fillStyle = 'rgba(200,240,255,0.9)';
    for (let i = 0; i < 7; i++) { const t = ((T * 0.7 + i / 7) % 1) * 0.95 + 0.05, q = pt(t); c.fillRect(Math.round(q[0] + Math.sin(T * 3 + i * 2) * 3 - 1), Math.round(q[1] + Math.cos(T * 2.3 + i) * 3 - 1), 2, 2); }
    c.restore();
  }
  draw(c, cx, cy = 0, o = {}) {
    if (this.gone) return;
    let y = this.y - cy;
    if (this.type === 'amanita' && (this.state === 'walk')) y -= Math.abs(Math.sin(this.t * 9)) * 1.5;
    const flash = o.flash || (this.flash > 0 ? '#ffffff' : null);
    Spr.drawAnim(c, this.set, this.anim, this.animT, (o.x != null ? o.x : this.x) - cx, y + (o.dy || 0), o.facing || this.facing, { flash, alpha: (o.alpha != null ? o.alpha : this.alpha), scale: o.scale != null ? o.scale : (this.d.sc || undefined), rot: o.rot });
    if (this.type === 'beaver' && this.state === 'squirt' && this.st > 0.1 && this.dieT == null) this.drawJet(c, cx, y);
  }
};

// ---------- эффекты превращений (всё спрайтами) ----------
L6.Fx = {};
const gib = (c, fr, x, y, rot = 0, sc = 1, alpha = 1) => { c.globalAlpha = alpha; Spr.drawC(c, 'gibs6', fr, x, y, rot, sc); c.globalAlpha = 1; };
const morph = (c, fr, x, y, sc = 1, rot = 0, alpha = 1, feet = true) => {
  c.globalAlpha = alpha;
  if (feet) { const f = Spr.frame('morph6', fr); const h = f ? f[3] / 2 * sc : 0; Spr.drawC(c, 'morph6', fr, x, y - h / 2, rot, sc); } else Spr.drawC(c, 'morph6', fr, x, y, rot, sc);
  c.globalAlpha = 1;
};
const drawSnap = (c, cx, s, o = {}) => Spr.drawAnim(c, s.set, s.anim, s.animT, (o.x != null ? o.x : s.x) - cx, (o.y != null ? o.y : s.y) + (o.dy || 0), s.facing, { flash: o.flash, alpha: o.alpha, scale: o.scale, rot: o.rot });

L6.Fx.Bunny = class {
  constructor(s, run) { this.s = s; this.t = 0; this.x = s.x; this.y = s.y; this.dir = s.x > run.player.x ? 1 : -1; this.hop = 0; this.life = 4.5; Sound.play('squeak'); FX.popText(s.x, s.y - s.h - 8, 'ЗАЙКА!', '#fff'); }
  update(dt) { this.t += dt; if (this.t > 0.5) { this.x += this.dir * 110 * dt; this.hop += dt; } return this.t < this.life; }
  draw(c, cx) {
    const al = this.t > this.life - 0.6 ? (this.life - this.t) / 0.6 : 1;
    if (this.t < 0.35) { const k = this.t / 0.35; gib(c, 6, this.x - cx, this.y - 24, 0, 0.5 + k, 1 - k); }
    const sit = this.t < 0.5, air = Math.abs(Math.sin(this.hop * 8)) * 26, onG = air < 3;
    const fr = sit ? 0 : onG ? 2 : 1;
    c.save(); c.translate(this.x - cx, this.y - (sit ? 0 : air)); if (this.dir < 0 && !sit) c.scale(-1, 1);
    morph(c, fr, 0, 0, 1, 0, al); c.restore();
  }
};
L6.Fx.Ice = class {
  constructor(s) { this.s = s; this.t = 0; Sound.play('glass', 0.8); FX.popText(s.x, s.y - s.h - 8, 'ЗАМОРОЗИЛО!', '#bfe8ff'); }
  update(dt) {
    this.t += dt;
    if (this.t > 1.8) { FX.burst(this.s.x, this.s.y - 40, 22, { colors: ['#bfe8ff', '#ffffff', '#7fc0e8'], speed: 200, type: 'shard', size: 3, life: 0.8 }); Sound.play('glass'); G.shake(3, 0.2); return false; }
    return true;
  }
  draw(c, cx) {
    const s = this.s; drawSnap(c, cx, s, { flash: '#9fd4ff', alpha: 0.9 });
    const f = Spr.frame('morph6', 3), k = Math.max(0.8, s.h * 1.15 / (f[3] / 2));
    const shake = this.t > 1.2 ? Math.sin(this.t * 60) * 1.5 : 0;
    c.save(); c.translate(shake, 0); morph(c, 3, s.x - cx, s.y + 6, k, 0, 0.78); c.restore();
  }
};
L6.Fx.Ash = class {
  constructor(s, run) { this.s = s; this.t = 0; this.dir = s.facing; this.x = s.x; Sound.play('boom', 1.2); FX.popText(s.x, s.y - s.h - 8, 'ПОДЖАРИЛО!', '#ffa040'); this.run = run; }
  update(dt) {
    this.t += dt;
    if (this.t < 1.0) { this.x += this.dir * 70 * dt; if (Math.random() < dt * 40) FX.spawn({ x: this.x + U.rand(-10, 10), y: this.s.y - U.rand(10, this.s.h), vy: U.rand(-90, -40), vx: U.rand(-20, 20), grav: -60, life: 0.5, size: 3, color: ['#ff7a20', '#ffd040', '#ff3010'][U.randi(0, 2)] }); }
    return this.t < 4.2;
  }
  draw(c, cx) {
    const s = this.s;
    if (this.t < 1.0) { s.anim = 'walk'; s.animT += G.dt; drawSnap(c, cx, s, { x: this.x, flash: (this.t * 10 | 0) % 2 ? '#ff8a20' : '#ffcf40', alpha: 1 - Math.max(0, this.t - 0.7) * 3 }); }
    else { const al = this.t > 3.4 ? (4.2 - this.t) / 0.8 : 1; morph(c, 4, this.x - cx, s.y, 1.2, 0, al); }
  }
};
L6.Fx.Bolt = class {
  constructor(s, run) {
    this.s = s; this.t = 0; Sound.play('zap'); FX.popText(s.x, s.y - s.h - 8, 'ШОК!', '#ffe860');
    for (const e of run.world.enemies) if (e !== run.skip && !e.dead && e.dieT == null && Math.abs(e.x - s.x) < 150 && Math.abs(e.y - s.y) < 90 && !s.chained) { const sn = e; setTimeout(() => { if (!sn.dead && sn.dieT == null) { run.chain = true; sn.zap(2, run); run.chain = false; } }, 160); }
  }
  update(dt) { this.t += dt; if (this.t < 0.9 && Math.random() < dt * 50) FX.spawn({ x: this.s.x + U.rand(-16, 16), y: this.s.y - U.rand(4, this.s.h), vx: U.rand(-80, 80), vy: U.rand(-80, 80), grav: 0, life: 0.2, size: 2, color: ['#ffe860', '#ffffff', '#8cd0ff'][U.randi(0, 2)] }); return this.t < 2.1; }
  draw(c, cx) {
    const s = this.s;
    if (this.t < 0.9) drawSnap(c, cx, s, { flash: (this.t * 16 | 0) % 2 ? '#ffffff' : null, x: s.x + (((this.t * 40) | 0) % 2 ? 2 : -2) });
    else { const k = (this.t - 0.9) / 1.2; s.anim = 'ko'; drawSnap(c, cx, s, { flash: '#262626', alpha: 1 - k, dy: -Math.sin(k * 3) * 0 }); }
  }
};
L6.Fx.Portal = class {
  constructor(s) { this.s = s; this.t = 0; Sound.play('boom', 0.7); FX.popText(s.x, s.y - s.h - 8, 'В ПОРТАЛ НАВСЕГДА!', '#d8a0ff'); }
  update(dt) { this.t += dt; return this.t < 1.6; }
  draw(c, cx) {
    const s = this.s, t = this.t;
    const open = t < 0.5 ? t / 0.5 : t > 1.2 ? 1 - (t - 1.2) / 0.4 : 1;
    const fr = Math.min(5, Math.floor(open * 5.99));
    if (open > 0.02) { c.globalAlpha = Math.min(1, open * 2); Spr.drawC(c, 'vfx6', fr, s.x - cx, s.y - 6, 0, 0.8); c.globalAlpha = 1; }
    if (t > 0.35 && t < 1.25) { const k = (t - 0.35) / 0.9, e = k * k; drawSnap(c, cx, s, { scale: 1 - e * 0.95, rot: e * Math.PI * 5, y: s.y - 6 - (1 - e) * 0, x: s.x }); }
    else if (t <= 0.35) drawSnap(c, cx, s, {});
  }
};
L6.Fx.Burst = class {
  // враг разлетается на куски СВОЕГО спрайта (нарезка текущего кадра на 3x2 части)
  constructor(s, run) {
    this.s = s; this.t = 0; this.parts = [];
    Sound.play('boom'); G.shake(6, 0.35); FX.popText(s.x, s.y - s.h - 8, 'РАЗОРВАЛО!', '#ffd84a');
    const anim = Spr.ANIM[s.set] && (Spr.ANIM[s.set][s.anim] || Spr.ANIM[s.set].idle);
    const fr = anim ? Spr.frameOf(anim, s.animT) : null, sh = fr ? Spr.sheets[fr[0]] : null, f = fr ? Spr.frame(fr[0], fr[1]) : null;
    this.src = f && sh && sh.img ? { img: sh.img, f } : null;
    const sc = s.sc || 1, fl = s.facing < 0 ? -1 : 1;
    if (this.src) {
      const [fx, fy, fw, fh, ax, ay] = f, cols = 3, rows = 2;
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
        const sx = Math.floor(q * fw / cols), sw = Math.floor((q + 1) * fw / cols) - sx, sy = Math.floor(r * fh / rows), shh = Math.floor((r + 1) * fh / rows) - sy;
        const ox = (sx + sw / 2 - ax) / 2 * sc * fl, oy = (sy + shh / 2 - ay) / 2 * sc;
        this.parts.push({ sx, sy, sw, sh: shh, x: s.x + ox, y: s.y + oy, vx: ox * 5 + U.rand(-60, 60), vy: -U.rand(160, 330) + oy * 2, rot: 0, vr: U.rand(-8, 8), bounced: 0, fl, sc });
      }
    }
  }
  update(dt) {
    this.t += dt;
    for (const p of this.parts) { p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; if (p.y > GR6() - 4 && p.vy > 0) { if (p.bounced < 2) { p.vy *= -0.4; p.vx *= 0.6; p.vr *= 0.5; p.bounced++; } else { p.vy = 0; p.vx = 0; p.vr = 0; p.y = GR6() - 4; } } }
    return this.t < 2.2;
  }
  draw(c, cx) {
    const t = this.t, s = this.s;
    if (t < 0.4) { const k = t / 0.4; c.globalAlpha = 1 - k; Spr.drawC(c, 'vfx6', 11, s.x - cx, s.y - s.h * 0.5, 0, 0.5 + k * 0.7); c.globalAlpha = 1; }
    const al = t > 1.7 ? (2.2 - t) / 0.5 : 1;
    if (this.src) for (const p of this.parts) {
      c.save(); c.globalAlpha = al; c.translate(Math.round(p.x - cx), Math.round(p.y)); c.rotate(p.rot); if (p.fl < 0) c.scale(-1, 1);
      c.drawImage(this.src.img, this.src.f[0] + p.sx, this.src.f[1] + p.sy, p.sw, p.sh, -p.sw / 4 * p.sc, -p.sh / 4 * p.sc, p.sw / 2 * p.sc, p.sh / 2 * p.sc); c.restore();
    }
    if (t < 1.0) { c.globalAlpha = Math.max(0, 1 - t / 1.0); Spr.drawC(c, 'vfx6', 7, s.x - cx, s.y - s.h * 0.5 - t * 16, 0, 1.0); c.globalAlpha = 1; }
  }
};
L6.Fx.Flower = class {
  constructor(s) { this.s = s; this.t = 0; Sound.play('pickup'); FX.popText(s.x, s.y - s.h - 8, 'ЦВЕТОЧЕК!', '#ff9ad0'); for (let i = 0; i < 14; i++) FX.spawn({ x: s.x, y: s.y - 20, vx: U.rand(-90, 90), vy: U.rand(-160, -40), life: 0.8, size: 3, grav: 300, color: ['#ff4040', '#ffa020', '#ffe040', '#40d060', '#40a0ff', '#c060ff'][U.randi(0, 5)] }); }
  update(dt) { this.t += dt; return this.t < 6.5; }
  draw(c, cx) {
    const s = this.s, k = Math.min(1, this.t / 0.35), al = this.t > 5.5 ? 6.5 - this.t : 1;
    morph(c, 6, s.x - cx, s.y, (0.3 + 0.9 * U.easeOut(k)) * 1.2, Math.sin(this.t * 3) * 0.08, al);
  }
};
L6.Fx.Balloon = class {
  constructor(s) { this.s = s; this.t = 0; this.x = s.x; this.y = s.y - s.h * 0.7; Sound.play('squeak'); FX.popText(s.x, s.y - s.h - 8, 'ШАРИК!', '#ff6070'); }
  update(dt) { this.t += dt; this.y -= 55 * dt; this.x += Math.sin(this.t * 2.2) * 24 * dt; if (this.y < -30 || this.t > 6) { Sound.play('glassHit', 1.6); FX.burst(this.x, this.y, 10, { colors: ['#ff3040', '#ffffff'], speed: 120, life: 0.4, grav: 100 }); return false; } return true; }
  draw(c, cx) {
    const s = this.s;
    drawSnap(c, cx, s, { x: this.x, y: this.y + 62, scale: 0.55, flash: null, alpha: 1 });
    morph(c, 7, this.x - cx, this.y + 2, 1.5, Math.sin(this.t * 2.2) * 0.12, 1, false);
  }
};
L6.Fx.Bats = class {
  constructor(s) { this.s = s; this.t = 0; Sound.play('squeak', 0.7); FX.popText(s.x, s.y - s.h - 8, 'ОБГЛОДАЛИ!', '#c8a0ff'); }
  update(dt) { this.t += dt; return this.t < 4.5; }
  draw(c, cx) {
    const s = this.s, t = this.t;
    if (t < 1.1) { drawSnap(c, cx, s, { flash: (t * 12 | 0) % 2 ? '#301040' : null, alpha: 1 - Math.max(0, t - 0.6) * 2 }); }
    else { const al = t > 3.7 ? (4.5 - t) / 0.8 : 1; morph(c, 5, s.x - cx, s.y, 1.2, 0, al); }
    if (t < 1.8) for (let i = 0; i < 3; i++) { const a = t * 7 + i * 2.1, r = 22 + Math.sin(t * 3 + i) * 8, lift = t > 1.1 ? (t - 1.1) * 90 : 0; Spr.drawC(c, 'spells6', 7, s.x - cx + Math.cos(a) * r, s.y - s.h * 0.5 + Math.sin(a * 1.3) * r * 0.6 - lift, 0, 0.9); }
  }
};
