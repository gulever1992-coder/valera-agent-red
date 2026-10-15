// Уровень 9, враги лаборатории: киберзаводчане (Шляпа, Сварщик, Обрубок, Летун) и мутанты-спецназовцы (Клешня, Плевун, Потолочник, Суперсолдат), турель.
// У каждого своя атака, смерть и звук. Цветовой код: снаряды врагов оранжевые/красные, кислота — лаймовая.
(() => {
  const S = L9.spr, clamp = L9.clamp, rnd = L9.rnd, LAB = L9.LAB;
  const FACE_R = { eHat9: 1, eWeld9: 1, eStump9: 1, eFly9: 1, eSpit9: 1, eCrawl9: 1, eSuper9: 1, eArm9: -1 };   // куда смотрит кадр листа

  class Foe {
    constructor(M, x, y, o = {}) { this.M = M; this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.dir = -1; this.t = 0; this.stT = 0; this.st = 'idle'; this.dead = false; this.gone = false; this.fl = 0; this.onG = true; Object.assign(this, o); this.hp = this.hp || this.maxHp || 4; }
    get h() { return 80; }
    box() { const w = this.w || 26, h = this.h; return [this.x - w, this.y - h, w * 2, h]; }
    set(st) { if (this.st !== st) { this.st = st; this.stT = 0; } }
    hit(d, dir, kind) {
      if (this.dead) return; this.hp -= d; this.fl = 0.08;
      if (this.hp <= 0) { this.die(dir, kind); return; }
      if (kind === 'melee' || kind === 'blast') { this.vx = dir * 160; this.stun = 0.35; }
      if (Math.random() < 0.3) Sound.play('hit');
    }
    die(dir) { this.dead = true; this.set('dead'); this.vx = dir * 90; this.vy = -160; this.onG = false; Sound.play(this.deathSnd || 'hit'); const lv = L9.PARTS.lab.lv; lv.stats.kills++; lv.score += this.pts || 200; this.drop && this.drop(); }
    phys(dt, grav = true) {
      if (grav) { this.vy = Math.min(900, this.vy + 1300 * dt); const ny = this.y + this.vy * dt; const f = this.vy >= 0 ? LAB.floorBelow(this.M, this.x, this.y - 1, ny) : null; if (f !== null) { this.y = f; this.vy = 0; this.onG = true; } else { this.y = ny; this.onG = false; } }
      const nx = this.x + this.vx * dt;
      // не уходить с края платформы и не лезть в стену
      const wall = LAB.solidAt(this.M, nx + Math.sign(this.vx) * 14, this.y - 30);
      const edge = this.onG && !this.dead && LAB.floorBelow(this.M, nx + Math.sign(this.vx) * 16, this.y - 2, this.y + 6) === null;
      if (!wall && !(edge && !this.jumps)) this.x = nx; else if (!this.dead) { this.vx = 0; this.blockedT = 0.4; }
      if (this.y > this.M.killY) this.gone = true;
    }
    face(P) { this.dir = P.x < this.x ? -1 : 1; }
    near(P, dx, dy = 60) { return Math.abs(P.x - this.x) < dx && Math.abs(P.y - this.y) < dy; }
    seen(P) { return Math.abs(P.x - this.x) < 380 && Math.abs(P.y - this.y) < 170; }
    update(dt, P, lv) {
      this.t += dt; this.stT += dt; this.fl -= dt; this.stun = (this.stun || 0) - dt; this.blockedT = (this.blockedT || 0) - dt;
      if (this.dead) { this.vx *= 0.9; this.phys(dt); if (this.stT > 2.2) this.gone = true; return; }
      if (this.stun > 0) { this.phys(dt); return; }
      this.ai(dt, P, lv);
      // касание
      if (this.touch && !P.lv.dead) { const b = this.box(), pb = P.box(); if (b[0] < pb[0] + pb[2] && b[0] + b[2] > pb[0] && b[1] < pb[1] + pb[3] && b[1] + b[3] > pb[1]) P.hurt(this.touch, this.x); }
    }
    frame() { return 'w0'; }
    draw(c) {
      const sh = this.sh, f = this.frame(), fl = this.dir * (FACE_R[sh] || 1) < 0;
      if (this.dead && this.stT > 1.6 && (this.t * 12 | 0) % 2) return;
      if (!this.air) S(c, 'props8', 'shadow', this.x, this.y + 1, (this.w || 26) / 52, { a: 0.4 });
      S(c, sh, f, this.x, this.y + (this.oy || 0), this.k || 1, { flip: fl, a: this.fl > 0 ? 0.55 : 1 });
      this.drawFx && this.drawFx(c);
    }
    walkFr(n = 6, sp = 9) { return 'w' + ((this.t * sp | 0) % n); }
    ebul(x, y, vx, vy, o = {}) { L9.PARTS.lab.ebul.push(Object.assign({ x, y, vx, vy, t: 0, dmg: 10 }, o)); }
    fx(sh, fr, x, y, s, life, o = {}) { L9.PARTS.lab.fx.push(Object.assign({ sh, fr, x, y, s, t: 0, life }, o)); }
  }

  // Шляпа: пружинная нога, бросает горящие бутылки дугой, перепрыгивает между ярусами
  class Hat extends Foe {
    constructor(M, x, y, o) { super(M, x, y, Object.assign({ sh: 'eHat9', maxHp: 6, touch: 10, w: 20, pts: 250, jumps: 1 }, o)); this.cd = rnd(0.6, 1.6); }
    ai(dt, P) {
      const dx = P.x - this.x; this.cd -= dt;
      if (!this.seen(P)) { this.vx = 0; this.phys(dt); return; }
      this.face(P);
      if (this.st === 'wind') { this.vx = 0; if (this.stT > 0.35) { this.set('throw'); const vx = clamp(dx * 1.1, -300, 300); this.ebul(this.x + this.dir * 14, this.y - 70, vx, -380, { grav: 0.8, fr: 'fireball', s: 0.32, dmg: 12, onLand: e => this.fx('fxA9', ['fire0', 'fire1', 'fire2', 'fire3', 'fire0', 'fire1'], e.x, e.y - 8, 0.6, 1.2) }); Sound.play('throw'); } }
      else if (this.st === 'throw') { if (this.stT > 0.3) this.set('walk'); }
      else if (this.st === 'crouch') { this.vx = 0; if (this.stT > 0.3) { this.set('jump'); this.vy = -620; this.vx = clamp(dx * 1.2, -170, 170); this.onG = false; Sound.play('jump'); } }
      else if (this.st === 'jump') { if (this.onG && this.stT > 0.1) this.set('walk'); }
      else {
        if (Math.abs(P.y - this.y) > 70 && Math.abs(dx) < 160 && this.onG && this.cd <= 0) { this.set('crouch'); this.cd = 2.5; }
        else if (Math.abs(dx) < 280 && this.cd <= 0) { this.set('wind'); this.cd = rnd(2, 2.8); }
        else { this.set('walk'); this.vx = Math.abs(dx) > 170 ? Math.sign(dx) * 60 : 0; }
      }
      this.phys(dt);
    }
    frame() { return this.dead ? 'dead' : this.fl > 0 && this.st !== 'jump' ? 'hit' : ({ wind: 'wind', throw: 'throw', crouch: 'crouch', jump: 'jump' })[this.st] || (this.vx ? this.walkFr(8, 10) : 'w0'); }
  }

  // Клешня: огромная рука, удар об пол — волна по полу (перепрыгнуть), рукой закрывается от пуль спереди
  class Arm extends Foe {
    constructor(M, x, y, o) { super(M, x, y, Object.assign({ sh: 'eArm9', maxHp: 14, touch: 14, w: 26, pts: 400, k: 1 }, o)); this.cd = 1; this.shot = 0; }
    get h() { return 96; }
    blocks(b) { return this.st === 'block' && Math.sign(b.vx) === -this.dir && b.w !== 'rocket'; }
    hit(d, dir, kind) { if (this.st === 'walk' && kind !== 'melee') { this.shot += d; if (this.shot > 3 && Math.random() < 0.5) { this.set('block'); this.shot = 0; } } super.hit(d, dir, kind); }
    ai(dt, P) {
      const dx = P.x - this.x; this.cd -= dt;
      if (!this.seen(P)) { this.vx = 0; this.phys(dt); return; }
      if (this.st === 'raise') { this.vx = 0; if (this.stT > 0.55) { this.set('slam'); G.shake(5, 0.3); Sound.play('stomp');
        for (const s of [-1, 1]) this.ebul(this.x + s * 30, this.y - 6, s * 230, 0, { fr: 'wave', s: 0.45, dmg: 15, life: 1.4, ground: 1, draw: (c, e) => S(c, 'fxL9', 'wave', e.x, e.y, 0.45, { flip: e.vx < 0 }) }); } }
      else if (this.st === 'slam') { if (this.stT > 0.5) this.set('walk'); }
      else if (this.st === 'block') { this.vx = 0; if (this.stT > 1.3) this.set('walk'); }
      else if (this.st === 'roar') { this.vx = 0; if (this.stT > 0.8) this.set('walk'); }
      else { this.face(P); this.set('walk'); this.vx = Math.sign(dx) * 52; if (Math.abs(dx) < 110 && Math.abs(P.y - this.y) < 40 && this.cd <= 0) { this.set('raise'); this.cd = 2.2; } else if (this.cd < -4) { this.set('roar'); Sound.play('shout'); this.cd = 0.5; } }
      this.phys(dt);
    }
    frame() { return this.dead ? 'dead' : this.fl > 0 && this.st === 'walk' ? 'hit' : ({ raise: 'raise', slam: 'slam', block: 'block', roar: 'roar' })[this.st] || this.walkFr(6, 7); }
  }

  // Сварщик: щит спереди (стрелять сверху, сзади, гранатой, прикладом), в упор — пламя горелки
  class Weld extends Foe {
    constructor(M, x, y, o) { super(M, x, y, Object.assign({ sh: 'eWeld9', maxHp: 8, touch: 10, w: 20, pts: 350 }, o)); this.cd = 0.5; }
    blocks(b) { return this.st !== 'flame' && this.st !== 'mask' && Math.sign(b.vx) === -this.dir && Math.abs(b.vy) < Math.abs(b.vx) * 0.5 && b.w !== 'rocket' && b.w !== 'plasma'; }
    ai(dt, P) {
      const dx = P.x - this.x; this.cd -= dt;
      if (!this.seen(P)) { this.vx = 0; this.phys(dt); return; }
      if (this.st === 'mask') { this.vx = 0; if (this.stT > 0.35) { this.set('flame'); Sound.play('steam'); } }
      else if (this.st === 'flame') { this.vx = 0; if ((this.stT * 10 | 0) % 3 === 0 && Math.abs(dx) < 80 && Math.sign(dx) === this.dir && Math.abs(P.y - this.y) < 40) P.hurt(18, this.x); if (this.stT > 0.8) { this.set('laugh'); } }
      else if (this.st === 'laugh') { if (this.stT > 0.6) this.set('walk'); }
      else { this.face(P); this.set('walk'); this.vx = Math.sign(dx) * 70; if (Math.abs(dx) < 75 && Math.abs(P.y - this.y) < 40 && this.cd <= 0) { this.set('mask'); this.cd = 1.8; } }
      this.phys(dt);
    }
    frame() { return this.dead ? 'dead' : this.fl > 0 ? (this.st === 'walk' ? 'shield' : 'hit') : ({ mask: 'mask', flame: 'flame', laugh: 'laugh' })[this.st] || (this.vx ? this.walkFr(8, 10) : 'shield'); }
  }

  // Обрубок: торс на гусенице, быстро ползёт и взрывается рядом
  class Stump extends Foe {
    constructor(M, x, y, o) { super(M, x, y, Object.assign({ sh: 'eStump9', maxHp: 3, w: 18, pts: 150, deathSnd: 'boom' }, o)); }
    get h() { return 52; }
    die(dir, kind) { super.die(dir, kind); this.boom(); }
    boom() { if (this.boomed) return; this.boomed = 1; const P = L9.PARTS.lab; this.fx('fxA9', ['boom0', 'boom1', 'boom2', 'boom3'], this.x, this.y - 26, 0.9, 0.5); Sound.play('boom'); if (Math.hypot(P.x - this.x, P.y - this.y) < 60) P.hurt(20, this.x); this.gone = true; }
    ai(dt, P) {
      const dx = P.x - this.x;
      if (this.st === 'beep') { this.vx = 0; if (this.stT > 0.55) { this.dead = true; this.boom(); } }
      else if (this.seen(P)) { this.face(P); this.vx = Math.sign(dx) * 130; if (Math.abs(dx) < 40 && Math.abs(P.y - this.y) < 40) { this.set('beep'); Sound.play('warn'); } }
      this.phys(dt);
    }
    frame() { return this.st === 'beep' ? ((this.t * 10 | 0) % 2 ? 'beep' : 'c0') : this.fl > 0 ? 'hit' : 'c' + ((this.t * 14 | 0) % 6); }
  }

  // Летун: висит над Валерой на огнетушителях, пикирует с дрелью, кидает бомбочки
  class Fly extends Foe {
    constructor(M, x, y, o) { super(M, x, y, Object.assign({ sh: 'eFly9', maxHp: 5, touch: 12, w: 20, pts: 300, air: 1 }, o)); this.cd = 1.5; this.hy = y; }
    ai(dt, P) {
      if (!this.seen(P) && !this.active) return; this.active = 1;
      this.cd -= dt; const tx = P.x - this.dir * 120, ty = P.y - 120;
      if (this.st === 'dive') { this.x += this.vx * dt; this.y += this.vy * dt; if (this.stT > 0.7 || this.y > P.y - 10) { this.set('idle'); } }
      else {
        this.face(P);
        this.x += clamp(tx - this.x, -110, 110) * dt * 1.2; this.y += clamp(ty + Math.sin(this.t * 3) * 14 - this.y, -90, 90) * dt * 1.5;
        if (this.cd <= 0) { if (Math.random() < 0.55) { this.set('dive'); const a = Math.atan2(P.y - 40 - this.y, P.x - this.x); this.vx = Math.cos(a) * 320; this.vy = Math.sin(a) * 320; Sound.play('swig'); } else { this.set('bomb'); this.ebul(this.x, this.y - 40, this.dir * 60, -60, { grav: 0.8, fr: 'fireball', s: 0.3, dmg: 12 }); Sound.play('throw'); } this.cd = rnd(2, 3); }
        if (this.st === 'bomb' && this.stT > 0.4) this.set('idle');
      }
    }
    die(dir, kind) { super.die(dir, kind); this.air = 0; }
    update(dt, P, lv) { if (this.dead) { this.t += dt; this.stT += dt; this.vy += 900 * dt; this.y += this.vy * dt; this.x += this.vx * dt; const f = LAB.floorBelow(this.M, this.x, this.y - 10, this.y + 2); if (f !== null) { this.y = f; this.vx = this.vy = 0; } if (this.stT > 2.2) this.gone = true; return; } super.update(dt, P, lv); }
    frame() { return this.dead ? (this.stT < 0.6 ? 'hit' : 'dead') : this.fl > 0 ? 'hit' : this.st === 'dive' ? 'drill' : this.st === 'bomb' ? 'bomb' : 'h' + ((this.t * 12 | 0) % 6); }
  }

  // Плевун: раздувает зоб и плюёт кислотой навесом; лужа жжёт
  class Spit extends Foe {
    constructor(M, x, y, o) { super(M, x, y, Object.assign({ sh: 'eSpit9', maxHp: 7, touch: 10, w: 20, pts: 300 }, o)); this.cd = 1.2; }
    ai(dt, P) {
      const dx = P.x - this.x; this.cd -= dt;
      if (!this.seen(P)) { this.vx = 0; this.phys(dt); return; }
      this.face(P);
      if (this.st === 'inflate') { this.vx = 0; if (this.stT > 0.5) { this.set('spit'); Sound.play('splash'); const T = 0.9, vx = clamp(dx / T, -320, 320); this.ebul(this.x + this.dir * 20, this.y - 74, vx, -(1300 * 0.7 * T / 2) + (P.y - this.y) / T, { grav: 0.7, fr: 'acid', s: 0.4, dmg: 12, onLand: e => this.puddle(e.x, e.y) }); } }
      else if (this.st === 'spit') { if (this.stT > 0.4) this.set('walk'); }
      else { this.set('walk'); this.vx = Math.abs(dx) > 200 ? Math.sign(dx) * 45 : 0; if (this.cd <= 0 && Math.abs(dx) < 340) { this.set('inflate'); this.cd = rnd(2.4, 3); } }
      this.phys(dt);
    }
    puddle(x, y) { const P = L9.PARTS.lab; const f = LAB.floorBelow(this.M, x, y - 20, y + 30); if (f === null) return; P.M.acid = P.M.acid || []; P.M.acid.push({ x, y: f, t: 0, life: 2.2 }); this.fx('fxL9', ['acidHit'], x, f - 6, 0.5, 0.3); }
    frame() { return this.dead ? 'dead' : this.fl > 0 ? 'hit' : ({ inflate: 'inflate', spit: 'spit' })[this.st] || (this.vx ? this.walkFr(6, 8) : 'crouch'); }
  }

  // Потолочник: ползает по потолку, падает на Валеру, прыгает и рубит
  class Crawl extends Foe {
    constructor(M, x, y, o) { super(M, x, y, Object.assign({ sh: 'eCrawl9', maxHp: 6, touch: 12, w: 22, pts: 300, ceil: y }, o)); this.set('ceil'); this.air = 1; }
    ai(dt, P) {
      const dx = P.x - this.x;
      if (this.st === 'ceil') { this.oy = 0; if (Math.abs(dx) < 330 && P.y > this.ceil) { this.face(P); this.x += Math.sign(dx) * 90 * dt; if (Math.abs(dx) < 34) { this.set('drop'); this.vy = 0; Sound.play('squeak'); } } return; }
      this.air = 0;
      if (this.st === 'drop') { this.phys(dt); if (this.onG) this.set('land'); return; }
      if (this.st === 'land') { this.vx = 0; this.phys(dt); if (this.stT > 0.3) this.set('walk'); return; }
      if (this.st === 'leap') { this.phys(dt); if (this.onG && this.stT > 0.15) this.set('slash'); return; }
      if (this.st === 'slash') { this.vx = 0; this.phys(dt); if (this.stT > 0.35) this.set('walk'); return; }
      this.face(P); this.vx = Math.sign(dx) * 110;
      if (Math.abs(dx) < 120 && Math.abs(P.y - this.y) < 40 && this.onG && (this.cd = (this.cd || 0) - dt) <= 0) { this.set('leap'); this.vy = -380; this.vx = this.dir * 230; this.onG = false; this.cd = 1.6; }
      this.phys(dt);
    }
    draw(c) { if (this.st === 'ceil') { S(c, this.sh, 'c' + ((this.t * 10 | 0) % 6), this.x, this.ceil + 64, 1, { flip: this.dir < 0, a: this.fl > 0 ? 0.55 : 1 }); return; } super.draw(c); }
    box() { return this.st === 'ceil' ? [this.x - 22, this.ceil, 44, 60] : super.box(); }
    frame() { return this.dead ? 'dead' : this.fl > 0 ? 'hit' : ({ drop: 'drop', land: 'land', leap: 'leap', slash: 'slash' })[this.st] || 'leap'; }
  }

  // Суперсолдат: раскрутка миниганa (телеграф 0.8 с) и длинная очередь на уровне груди — присесть или укрыться
  class Super extends Foe {
    constructor(M, x, y, o) { super(M, x, y, Object.assign({ sh: 'eSuper9', maxHp: 34, touch: 16, w: 30, pts: 1000, k: 1 }, o)); this.cd = 1.2; }
    get h() { return 100; }
    drop() { L9.PARTS.lab.M.picks.push({ kind: 'mini', x: this.x, y: this.y, t: 0 }); }
    ai(dt, P) {
      const dx = P.x - this.x; this.cd -= dt;
      if (!this.seen(P)) { this.vx = 0; this.phys(dt); return; }
      if (this.st === 'spin') { this.vx = 0; if (this.stT > 0.8) { this.set('fire'); } }
      else if (this.st === 'fire') { this.vx = 0; this.fT = (this.fT || 0) - dt; if (this.fT <= 0) { this.fT = 0.09; Sound.play('shot', 0.6); this.ebul(this.x + this.dir * 70, this.y - 62 + rnd(-3, 3), this.dir * 520, rnd(-12, 12), { fr: 'fireball', s: 0.22, dmg: 8 }); } if (this.stT > 1.6) { this.set('taunt'); } }
      else if (this.st === 'taunt') { if (this.stT > 0.9) this.set('walk'); }
      else { this.face(P); this.set('walk'); this.vx = Math.abs(dx) > 160 ? Math.sign(dx) * 40 : 0; if (this.cd <= 0 && Math.abs(dx) < 420 && Math.abs(P.y - this.y) < 60) { this.set('spin'); this.cd = rnd(2.4, 3.2); Sound.play('crane'); } }
      this.phys(dt);
    }
    frame() { return this.dead ? (this.stT < 0.5 ? 'kneel' : 'dead') : this.fl > 0 && this.st === 'walk' ? 'stagger' : ({ spin: 'spin', fire: 'fire', taunt: 'taunt' })[this.st] || (this.vx ? this.walkFr(6, 6) : 'w0'); }
  }

  // Турель на стене
  class Turret extends Foe {
    constructor(M, x, y, o) { super(M, x, y, Object.assign({ sh: 'mech9', maxHp: 6, w: 22, pts: 200, air: 1, dir: -1 }, o)); this.cd = 1.5; }
    get h() { return 36; }
    box() { return [this.x - 24, this.y - 20, 48, 40]; }
    ai(dt, P) { this.cd -= dt; this.fireT = (this.fireT || 0) - dt; if (this.cd <= 0 && this.seen(P)) { this.cd = 2; this.fireT = 0.2; const a = Math.atan2(P.y - 45 - this.y, P.x - this.x); this.ebul(this.x, this.y, Math.cos(a) * 300, Math.sin(a) * 300, { fr: 'fireball', s: 0.3, dmg: 10 }); Sound.play('shot'); } }
    update(dt, P, lv) { this.t += dt; this.stT += dt; this.fl -= dt; if (this.dead) return; this.ai(dt, P); }
    die(dir, kind) { super.die(dir, kind); this.fx('fxA9', ['boom0', 'boom1', 'boom2', 'boom3'], this.x, this.y, 0.7, 0.5); Sound.play('boom'); }
    draw(c) { S(c, 'mech9', this.dead ? 'turDead' : this.fireT > 0 ? 'turFire' : 'tur', this.x, this.y, 1, { flip: this.dir > 0, a: this.fl > 0 ? 0.55 : 1 }); }
  }

  L9.FOES = { Foe, Hat, Arm, Weld, Stump, Fly, Spit, Crawl, Super, Turret };
})();
