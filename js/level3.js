'use strict';
// ============ УРОВЕНЬ 3: «ГЛЮКИ» — квартира Валеры, полная насекомых ============
const L3 = {};
G.L3 = L3;
L3.GROUND = 300;
L3.ROOMS = [
  { key: 'wall_corridor', name: 'КОРИДОР', x0: 0, x1: 3600 },
  { key: 'wall_kitchen', name: 'КУХНЯ', x0: 3600, x1: 6400 },
  { key: 'wall_living', name: 'ГОСТИНАЯ', x0: 6400, x1: 9800 },
  { key: 'wall_bedroom', name: 'СПАЛЬНЯ', x0: 9800, x1: 12800 },
  { key: 'wall_balcony', name: 'БАЛКОН', x0: 12800, x1: 15400 },
];
L3.W = 15400;
// камера почти как в уровнях 1-2 (×1.3); потолок ~2 роста Валеры над полом,
// над потолком и под полом видны бетонные перекрытия — дом «в разрезе»
L3.Z = 1.3; L3.CEIL = L3.GROUND - 165; L3.CAMY = 95; L3.VW = W / L3.Z;
// бетонное перекрытие в разрезе
L3.drawSlab = function (c, x, y, w, h, camX, top) {
  if (h <= 0) return;
  if (!L3.slabCv) {
    const cv = document.createElement('canvas'); cv.width = 96; cv.height = 64; const g = cv.getContext('2d');
    g.fillStyle = '#5d5a54'; g.fillRect(0, 0, 96, 64);
    for (let i = 0; i < 900; i++) { const v = U.randi(72, 112); g.fillStyle = `rgb(${v},${v - 3},${v - 8})`; g.fillRect(U.randi(0, 95), U.randi(0, 63), 1, 1); }
    for (let i = 0; i < 50; i++) { const v = U.randi(38, 58); g.fillStyle = `rgb(${v},${v},${v - 4})`; g.fillRect(U.randi(0, 94), U.randi(0, 63), U.randi(1, 3), 1); }
    L3.slabCv = cv;
  }
  const R = Art.R;
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.translate(-camX, 0); c.fillStyle = c.createPattern(L3.slabCv, 'repeat'); c.fillRect(x + camX, y, w, h); c.translate(camX, 0);
  // пустоты плиты и арматура
  const off = ((camX % 64) + 64) % 64;
  for (let rx = -off; rx < w + 64; rx += 64) { R(c, x + rx + 8, y + h * 0.35, 40, Math.max(3, h * 0.28), '#3e3b37'); R(c, x + rx + 9, y + h * 0.35 + 1, 38, 2, '#2c2a27'); }
  for (let rx = -(((camX % 16) + 16) % 16); rx < w + 16; rx += 16) { R(c, x + rx, y + h - 7, 3, 3, '#4a3024'); R(c, x + rx + 1, y + h - 6, 1, 1, '#9a6a48'); }
  if (top) {
    R(c, x, y, w, 4, '#7a5436'); R(c, x, y + 4, w, 1, '#2a1e16'); // линолеум соседей сверху
    R(c, x, y + h - 3, w, 3, '#d8d2c4'); R(c, x, y + h - 1, w, 1, '#8a8478'); // побелка потолка
  } else { R(c, x, y, w, 2, '#262422'); }
  c.restore();
};
// облако газа из нарисованных клубов
L3.drawCloud = function (c, cl, cx, cy) {
  const k = Math.max(0, 1 - cl.t / cl.life), row = cl.row == null ? 0 : cl.row;
  if (!cl.puffs) { cl.puffs = []; for (let i = 0; i < 5; i++) cl.puffs.push({ dx: U.rand(-1, 1) * cl.r * 0.7, dy: U.rand(-18, 18), fr: U.randi(0, 3), ph: Math.random() * 6 }); }
  c.save(); c.globalAlpha = Math.min(1, k * 2) * 0.85;
  for (const p of cl.puffs) Spr.drawC(c, 'gas', row * 4 + p.fr, cl.x + p.dx - cx, cl.y + p.dy - cy + Math.sin(G.t * 2 + p.ph) * 3, Math.sin(G.t + p.ph) * 0.2, (cl.r / 48) * (0.9 + (1 - k) * 0.4));
  c.restore();
};
L3.img = {};
L3.load = async function () {
  const W3 = window.WALLS3 || {};
  await Promise.all(Object.keys(W3).map(async k => { L3.img[k] = await G.loadImage(W3[k].img); }));
  const extra = ['boss2_bg', 'boss_room', 'boss_read', 'comic1', 'comic2', 'comic3', 'comic4', 'comic5', 'comic6', 'comic7'];
  await Promise.all(extra.map(async k => { L3.img[k] = await G.loadImage('assets/' + k + '.jpg'); }));
  L3.img.p_roach = await G.loadImage('assets/spr/p_roach.png');
  if (G.portraits) G.portraits.roach = L3.img.p_roach;
};

// ---------- анимации Валеры-рэмбо ----------
Spr.ANIM.valera3 = {
  stand: { fr: [['v3_act', 0]], fps: 1 }, angry: { fr: [['v3_act', 7]], fps: 1 },
  run: { fr: [0, 1, 2, 3, 4, 5, 6, 7].map(i => ['v3_run', i]), fps: 14 }, walk: { fr: [0, 1, 2, 3, 4, 5, 6, 7].map(i => ['v3_run', i]), fps: 9 },
  shoot: { fr: [['v3_act', 1]], fps: 1 }, crouchShoot: { fr: [['v3_act', 2]], fps: 1 }, crouch: { fr: [['v3_up', 0]], fps: 1 },
  aimUp: { fr: [['v3_up', 1]], fps: 1 }, runUp: { fr: [['v3_up', 2], ['v3_up', 3]], fps: 8 }, jumpUp: { fr: [['v3_up', 4]], fps: 1 }, aimVert: { fr: [['v3_up', 5]], fps: 1 },
  jump: { fr: [['v3_act', 3]], fps: 1 }, fall: { fr: [['v3_act', 4]], fps: 1 }, land: { fr: [['v3_act', 2]], fps: 1 },
  hurt: { fr: [['v3_act', 5]], fps: 1 }, ko: { fr: [['v3_act', 6]], fps: 1 },
  swatWind: { fr: [['v3_melee', 0]], fps: 1 }, swat: { fr: [['v3_melee', 1]], fps: 1 },
  chalkA: { fr: [['v3_melee', 2]], fps: 1 }, chalkB: { fr: [['v3_melee', 3]], fps: 1 },
  fart: { fr: [['v3_melee', 4]], fps: 1 }, climb: { fr: [['v3_melee', 5]], fps: 1 },
};
Spr.ANIM.valera3.stomp = Spr.ANIM.valera3.angry; Spr.ANIM.valera3.hips = Spr.ANIM.valera3.angry;
Spr.ANIM.valera3.scratch = Spr.ANIM.valera3.angry; Spr.ANIM.valera3.yawn = Spr.ANIM.valera3.angry; Spr.ANIM.valera3.belly = Spr.ANIM.valera3.fart;

// предметы уровня
const ITEM3 = { chalk: 0, chalkbox: 1, jar: 2, battery: 3, swatter: 4, melon: 5, tp: 6, pelmeni3: 7, dichlorvos: 8, bomb3: 9, acid3: 10, bread: 11 };
const artItemOld = Art.item;
Art.item = function (c, kind, x, y, rot = 0, s = 1) {
  if (ITEM3[kind] != null) { Spr.drawC(c, 'items3', ITEM3[kind], x, y, rot, s); return; }
  artItemOld(c, kind, x, y, rot, s);
};
Object.assign(Game.PICK, {
  chalkbox: { name: 'Мелки +10', ammo3: ['chalk', 10] },
  jar: { name: 'Берёзовый сок +40', ammo3: ['juice', 40] },
  battery: { name: 'Батарейка «Крона»', ammo3: ['swatter', 60] },
  tp: { name: 'Туалетная бумага! +300', score: 300 },
  pelmeni3: { name: 'Пельмени!', heal: 40 },
  bread: { name: 'Хлебушек', heal: 12 },
  dichlorvos: { name: 'ДИХЛОФОС!!!', special: 'dichlorvos' },
});
// обработка новых предметов (без изменения старого кода подбора)
const pickUpdOld = Game.Pickup.prototype.update;
Game.Pickup.prototype.update = function (dt, world, pl) {
  const d = Game.PICK[this.kind];
  if (d && (d.ammo3 || d.special) && !this.dead && !pl.dead && U.overlap(this.box, pl.box)) {
    this.dead = true;
    if (d.ammo3 && pl.ammo3) { pl.ammo3[d.ammo3[0]] += d.ammo3[1]; if (d.ammo3[0] !== 'swatter' && pl.weapon === 'swatter') pl.weapon = d.ammo3[0]; Sound.play('pickup'); }
    if (d.special === 'dichlorvos' && world.dichlorvos) world.dichlorvos();
    FX.popText(this.x, this.y - 24, d.name, '#8cd0ff');
    return;
  }
  pickUpdOld.call(this, dt, world, pl);
};

// ---------- Валера с оружием ----------
L3.Player = class extends Game.Player {
  constructor(x, y) {
    super(x, y);
    this.animSet = 'valera3'; this.customAttack = true;
    this.ammo3 = { swatter: 100, juice: 0, chalk: 0 }; this.weapon = 'swatter';
    this.fireT = 0; this.fartCool = 0; this.fartT = 0; this.headH = 92; this.portraitKey = 'valera3';
  }
  switchWeapon() {
    const order = ['swatter', 'juice', 'chalk'];
    let i = order.indexOf(this.weapon);
    for (let k = 1; k <= 3; k++) { const n = order[(i + k) % 3]; if (n === 'swatter' || this.ammo3[n] > 0) { this.weapon = n; Sound.play('select'); FX.popText(this.x, this.y - 96, L3.WNAME[n], '#ffd84a'); return; } }
  }
  attackUpdate(dt, world, ctl, I) {
    if (this.fireT > 0) this.fireT -= dt;
    if (this.fartCool > 0) this.fartCool -= dt;
    if (this.fartT > 0) this.fartT -= dt;
    if (ctl && I.pressed('switch')) this.switchWeapon();
    // пук — особая атака
    if (ctl && I.pressed('throw') && this.fartCool <= 0 && !this.atk) {
      this.fartT = 0.6; this.fartCool = 9;
      Sound.play('fart'); G.say(this, U.choice(['Газовая атака!', 'Пирожок, вперёд!', 'Получите!']), 1.2);
      world.clouds.push({ x: this.x - this.facing * 10, y: this.y - 30, t: 0, life: 3.5, r: 70, player: true, row: 0 });
    }
    const w = this.weapon;
    if (w === 'juice' && this.ammo3.juice <= 0) this.weapon = 'swatter';
    if (w === 'chalk' && this.ammo3.chalk <= 0) this.weapon = 'swatter';
    if (ctl && this.fartT <= 0) {
      if (this.weapon === 'swatter' && I.pressed('punch') && !this.atk) {
        this.atk = { t: 0, dur: 0.34, kind: 'swat', hit: new Set() };
        Sound.play('punch');
      } else if (this.weapon === 'juice' && I.held('punch') && this.fireT <= 0) {
        this.fireT = 0.11; this.ammo3.juice--; this.shootT = 0.2;
        const s = new L3.Shot('juice', this.x + this.facing * 30, this.y - (this.crouch ? 28 : 46), this.facing);
        if (I.held('up') && !this.crouch) { s.vx = this.facing * 400; s.vy = -400; s.x = this.x + this.facing * 30; s.y = this.y - 74; }
        world.projs.push(s);
        if ((G.t * 20 | 0) % 2) Sound.play('squeak');
      } else if (this.weapon === 'chalk' && I.pressed('punch') && !this.atk) {
        this.atk = { t: 0, dur: 0.3, kind: 'chalk', hit: new Set(), done: false };
      }
    }
    if (this.shootT > 0) this.shootT -= dt;
    if (this.atk) {
      const a = this.atk; a.t += dt;
      if (a.kind === 'swat' && a.t > 0.12 && a.t < 0.22) {
        const hb = { x: this.x + (this.facing > 0 ? 4 : -50), y: this.y - (this.crouch ? 40 : 64), w: 46, h: 44 };
        world.playerAttack(hb, this.ammo3.swatter > 0 ? 2 : 1, a, this);
        if (Math.random() < 0.5) FX.burst(hb.x + (this.facing > 0 ? 40 : 6), hb.y + 20, 2, { colors: ['#9cf', '#fff'], speed: 90, life: 0.2, grav: 0 });
      }
      if (a.kind === 'chalk' && a.t > 0.14 && !a.done) {
        a.done = true; this.ammo3.chalk--;
        const s = new L3.Shot('chalk', this.x + this.facing * 24, this.y - 52, this.facing); if (G.Input.held('up')) { s.vx = this.facing * 340; s.vy = -360; s.y = this.y - 70; }
        world.projs.push(s); Sound.play('throw');
      }
      if (a.t >= a.dur) this.atk = null;
    }
  }
  choosePose(dt) {
    let a;
    const up = this.controls && this.weapon !== 'swatter' && G.Input.held('up') && !this.crouch;
    if (this.hurtT > 0) a = 'hurt';
    else if (this.fartT > 0) a = 'fart';
    else if (this.atk && this.atk.kind === 'swat') a = this.atk.t < 0.12 ? 'swatWind' : 'swat';
    else if (this.atk && this.atk.kind === 'chalk') a = this.atk.t < 0.14 ? 'chalkA' : 'chalkB';
    else if (!this.onGround) a = up ? 'jumpUp' : this.vy < 0 ? 'jump' : 'fall';
    else if (this.crouch) a = this.shootT > 0 ? 'crouchShoot' : 'crouch';
    else if (up) a = Math.abs(this.vx) > 20 ? 'runUp' : 'aimUp';
    else if (this.shootT > 0 && Math.abs(this.vx) < 20) a = 'shoot';
    else if (Math.abs(this.vx) > 20) a = 'run';
    else if (this.idle) a = 'angry';
    else a = 'stand';
    this.setAnim(a);
  }
};
L3.WNAME = { swatter: 'МУХОБОЙКА', juice: 'БЕРЁЗОВЫЙ СОК', chalk: 'МЕЛОК' };

// ---------- снаряды ----------
L3.Shot = class {
  constructor(kind, x, y, dir) {
    this.kind = kind; this.x = x; this.y = y; this.dir = dir; this.t = 0; this.dead = false; this.hitSet = new Set(); this.rot = 0;
    if (kind === 'juice') { this.vx = dir * 520; this.vy = U.rand(-20, 10); this.dmg = 1; this.grav = 200; }
    else { this.vx = dir * 470; this.vy = -20; this.dmg = 3; this.grav = 120; }
  }
  get box() { return { x: this.x - 6, y: this.y - 5, w: 12, h: 10 }; }
  update(dt, world) {
    this.t += dt; this.vy += this.grav * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.rot += this.dir * 14 * dt;
    if (this.y > (world.floorY || L3.GROUND) || this.y < (world.ceilY != null ? world.ceilY : L3.CEIL) || this.t > 1.4) { this.dead = true; this.poof(); }
  }
  poof() { if (this.kind === 'juice') FX.burst(this.x, this.y, 3, { colors: ['#e8f0e0', '#c8dcc0'], speed: 60, life: 0.3 }); else FX.burst(this.x, this.y, 5, { colors: ['#fff', '#ddd'], speed: 80, life: 0.3, type: 'puff', size: 2 }); }
  draw(c, cx) {
    if (this.kind === 'juice') { Art.R(c, this.x - cx - 6, this.y - 2, 12, 4, 'rgba(232,240,220,0.9)'); Art.R(c, this.x - cx - 3, this.y - 1, 6, 2, '#fff'); }
    else Art.item(c, 'chalk', this.x - cx, this.y, this.rot, 0.9);
  }
};

// ---------- насекомые ----------
const BUG = {
  roach: { sheet: 'roach', hp: 5, w: 24, h: 76, score: 200, fr: { idle: 0, walk: [1, 2], attack: 3, run: 4, hurt: 5, ko: 6 } },
  bedbug: { sheet: 'bedbug', hp: 6, w: 34, h: 62, score: 220, fr: { idle: 0, walk: [1], jump: 2, splash: 3, attack: 4, hurt: 5, ko: 6 } },
  fly: { sheet: 'fly', hp: 3, w: 40, h: 34, score: 180, fr: { idle: 0, walk: [0, 1], drop: 2, dive: 3, hurt: 4, ko: 5 }, air: true },
  spider: { sheet: 'spider', hp: 4, w: 44, h: 40, score: 200, fr: { idle: 0, walk: [1], attack: 2, hurt: 1, ko: 3 }, air: true },
  mini: { sheet: 'spider', hp: 1, w: 24, h: 12, score: 60, fr: { idle: 4, walk: [4, 5], attack: 5, hurt: 4, ko: 4 } },
  moth: { sheet: 'moth', hp: 3, w: 44, h: 36, score: 120, fr: { idle: 0, walk: [0, 1, 2, 3, 2, 1], attack: 4, hurt: 1, ko: 5 }, air: true, flip: true },
};
const BUG_LINES = {
  roach: ['Э, это наша хата!', 'Рыба!', 'Кто тут без прописки?', 'Сдавай карты!'],
  bedbug: ['Суп пересолил из-за тебя!', 'Отведай борща!', 'Кусь!'],
  fly: ['Бомбы пошли!', 'Бззз-бззз!', 'Я на рекорд шёл!'],
  spider: ['Сюрприз!', 'Я тут с 1987 года живу!'],
  mini: [], moth: ['Шерсть ем, шубу ем!', 'Где тут норковая шуба?', 'Тьфу на тебя!'],
};
L3.Bug = class {
  constructor(type, x, o = {}) {
    const d = BUG[type];
    Object.assign(this, { type, d, x, y: L3.GROUND, facing: -1, hp: d.hp, st: 0, t: Math.random() * 5, state: 'idle', vx: 0, vy: 0, flash: 0, dieT: null, dead: false, cool: 1 + Math.random(), score: d.score, headH: d.h + 12, voice: 200 + Math.random() * 200, kind: type, slowT: 0, said: false, x1: x - 400, x2: x + 400, home: x }, o);
    if (type === 'fly' || type === 'moth') { this.y = o.y || U.rand(110, 150); this.baseY = this.y; }
    if (type === 'spider') { this.y = this.topY = L3.CEIL + 22; }
    if (type === 'fly' || type === 'moth') { this.baseY = this.y = o.y || U.rand(L3.CEIL + 28, L3.CEIL + 70); }
  }
  get box() {
    const d = this.d;
    if (d.air) return { x: this.x - d.w / 2, y: this.y - d.h / 2, w: d.w, h: d.h };
    return { x: this.x - d.w / 2, y: this.y - d.h, w: d.w, h: d.h };
  }
  set(s) { this.state = s; this.st = 0; }
  hit(dmg, dir, atk) {
    if (this.dieT != null) return false;
    this.hp -= dmg; this.flash = 0.12;
    if (atk && atk.kind === 'swat') { this.slowT = 3; FX.burst(this.x, this.y - 30, 6, { colors: ['#9cf', '#fff', '#6af'], speed: 120, life: 0.3, grav: 0 }); Sound.play('zap'); }
    if (this.hp <= 0) { this.dieT = 0; this.vx = dir * 140; this.vy = -200; Sound.play('squeak'); return true; }
    if (!this.d.air && this.state !== 'jump') { this.set('hurt'); this.vx = dir * 120; }
    return false;
  }
  onFloor(wd) {
    let best = null;
    for (const p of wd.plats) { if (this.x < p.x - 2 || this.x > p.x + p.w + 2) continue; if (Math.abs(p.y - this.y) <= 3 && (!best || p.y < best.y)) best = p; }
    return best;
  }
  fall(dt, wd) {
    const py = this.y; this.vy = Math.min(700, this.vy + 1500 * dt); this.y += this.vy * dt;
    const g = wd.groundAt(this.x, py, this.y, 4);
    if (g && this.vy > 0) { this.y = g.y; this.vy = 0; return true; }
    return false;
  }
  update(dt, wd, pl) {
    const slow = this.slowT > 0 ? 0.35 : 1;
    if (this.slowT > 0) this.slowT -= dt;
    this.t += dt * slow; this.st += dt * slow; if (this.flash > 0) this.flash -= dt; this.cool -= dt * slow;
    if (this.dieT != null) {
      this.dieT += dt; this.x += this.vx * dt; this.vx *= 0.96;
      if (this.d.air || this.y < L3.GROUND) { if (this.fall(dt, wd)) this.vx *= 0.5; }
      if (this.dieT > 1.8) this.dead = true;
      return;
    }
    const dx = pl.x - this.x, adx = Math.abs(dx), dy = pl.y - this.y;
    const face = () => { this.facing = dx > 0 ? 1 : -1; };
    const move = sp => { this.x = U.clamp(this.x + this.facing * sp * slow * dt, this.x1, this.x2); };
    const talk = () => { const L = BUG_LINES[this.type]; if (!this.said && L.length && Math.random() < 0.7) { this.said = true; G.say(this, U.choice(L), 1.6); } };
    const aware = adx < 380 && !pl.dead;
    // стоящие на полу/мебели: гравитация, если опора исчезла
    if (!this.d.air && this.state !== 'jump' && !this.onFloor(wd)) this.fall(dt, wd);
    if (this.state === 'hurt') { this.x += this.vx * dt; this.vx *= 0.85; if (this.st > 0.3) this.set('chase'); return; }
    switch (this.type) {
      case 'roach':
        if (!aware) { this.state = 'idle'; break; }
        if (this.state === 'idle') { this.set('chase'); talk(); }
        if (this.state === 'chase') {
          face();
          if (adx > 170) { move(190); this.running = true; } else { move(85); this.running = false; }
          if (adx < 40 && Math.abs(dy) < 50) this.set('wind');
        } else if (this.state === 'wind') { if (this.st > 0.35) { this.set('attack'); Sound.play('punch'); } }
        else if (this.state === 'attack') { if (this.st < 0.12) this.melee(pl, wd, 42, 10); if (this.st > 0.3) this.set('recover'); }
        else if (this.state === 'recover') { if (this.st > 0.4) this.set('chase'); }
        break;
      case 'bedbug':
        if (!aware) { this.state = 'idle'; break; }
        if (this.state === 'idle') { this.set('chase'); talk(); }
        if (this.state === 'chase') {
          face(); move(45);
          if (adx > 60 && adx < 150 && this.cool <= 0 && Math.abs(dy) < 60) { this.set('splash'); }
          else if (adx < 36 && Math.abs(dy) < 50) { this.set('bite'); }
          else if (this.cool <= 0 && adx > 150) { this.set('jump'); this.vy = -420; this.vx = this.facing * 170; this.cool = 1.4; }
        } else if (this.state === 'jump') {
          this.x += this.vx * dt; if (this.fall(dt, wd)) this.set('chase');
        } else if (this.state === 'splash') {
          if (this.st > 0.3 && !this.splashed) {
            this.splashed = true; Sound.play('steam');
            for (let i = 0; i < 4; i++) wd.globs.push(new L3.Glob('soup', this.x + this.facing * 20, this.y - 36, this.facing * U.rand(140, 260), U.rand(-260, -120)));
          }
          if (this.st > 0.7) { this.splashed = false; this.cool = 2.2; this.set('chase'); }
        } else if (this.state === 'bite') { if (this.st > 0.15 && this.st < 0.3) this.melee(pl, wd, 34, 9); if (this.st > 0.5) this.set('chase'); }
        break;
      case 'fly':
        if (!aware) { this.x += Math.sin(this.t) * 20 * dt; break; }
        talk(); face();
        if (this.state === 'dive') {
          this.x += this.vx * dt * slow; this.y += this.vy * dt * slow;
          if (U.overlap(this.box, pl.box)) pl.hurt(8, this.x, wd);
          if (this.y > pl.y - 30) this.vy = -Math.abs(this.vy);
          if (this.vy < 0 && this.y < this.baseY) { this.y = this.baseY; this.set('idle'); this.cool = 1.5; }
        } else {
          const tx = pl.x - this.facing * 10 + Math.sin(this.t * 1.3) * 40;
          this.x += U.clamp(tx - this.x, -120, 120) * dt * slow;
          this.y = this.baseY + Math.sin(this.t * 3) * 6;
          if (adx < 70 && this.cool <= 0) { this.set('drop'); wd.globs.push(new L3.Glob('bomb', this.x, this.y + 14, 0, 40)); this.cool = U.rand(1.6, 2.4); Sound.play('throw'); }
          else if (this.state === 'drop' && this.st > 0.3) this.set('idle');
          else if (adx < 140 && adx > 60 && this.cool <= 0 && Math.random() < 0.02) { this.set('dive'); const a = Math.atan2(pl.y - 40 - this.y, dx); this.vx = Math.cos(a) * 260; this.vy = Math.sin(a) * 260; Sound.play('gull'); }
        }
        break;
      case 'spider':
        if (this.state === 'idle') { this.y = this.topY + Math.sin(this.t * 2) * 4; if (adx < 70 && dy > 0 && this.cool <= 0) { this.set('down'); talk(); Sound.play('rope'); } }
        else if (this.state === 'down') { this.y += 300 * dt * slow; if (this.y >= pl.y - 26) { this.y = pl.y - 26; this.set('bite'); } }
        else if (this.state === 'bite') { if (U.overlap(this.box, pl.box)) pl.hurt(10, this.x, wd); if (this.st > 0.6) this.set('up'); }
        else if (this.state === 'up') { this.y -= 130 * dt * slow; if (this.y <= this.topY) { this.y = this.topY; this.set('idle'); this.cool = 1.8; } }
        break;
      case 'mini':
        if (aware) { face(); move(230); if (this.cool <= 0 && U.overlap(this.box, pl.box)) { pl.hurt(4, this.x, wd); this.cool = 0.7; } }
        break;
      case 'moth':
        if (!aware) { this.y = this.baseY + Math.sin(this.t * 2) * 8; break; }
        talk();
        if (this.state === 'spit') {
          if (this.st > 0.25 && !this.spat) { this.spat = true; wd.globs.push(new L3.Glob('acid', this.x + this.facing * 22, this.y + 6, U.clamp(dx / 0.75, -230, 230), -90)); Sound.play('squeak'); }
          if (this.st > 0.6) { this.spat = false; this.set('idle'); this.cool = U.rand(2.2, 3.4); }
          break;
        }
        face();
        this.x += U.clamp(pl.x - this.facing * 110 + Math.sin(this.t * 0.9) * 50 - this.x, -90, 90) * dt * slow;
        this.y = this.baseY + Math.sin(this.t * 2.3) * 22;
        if (this.cool <= 0 && adx < 260) this.set('spit');
        if (U.overlap(this.box, pl.box) && pl.hurt(5, this.x, wd)) this.cool = Math.max(this.cool, 0.8);
        break;
    }
  }
  melee(pl, wd, reach, dmg) {
    const hb = { x: this.x + (this.facing > 0 ? 4 : -reach), y: this.y - 64, w: reach, h: 40 };
    if (U.overlap(hb, pl.box)) pl.hurt(dmg, this.x, wd);
  }
  frame() {
    const f = this.d.fr, s = this.state;
    if (this.dieT != null) return f.ko;
    if (s === 'hurt') return f.hurt;
    switch (this.type) {
      case 'roach': return s === 'wind' ? f.idle : s === 'attack' ? f.attack : s === 'chase' ? (this.running ? f.run : f.walk[Math.floor(this.t * 7) % 2]) : f.idle;
      case 'bedbug': return s === 'jump' ? f.jump : s === 'splash' ? f.splash : s === 'bite' ? f.attack : s === 'chase' ? f.walk[0] : f.idle;
      case 'fly': return s === 'drop' ? f.drop : s === 'dive' ? f.dive : f.walk[Math.floor(this.t * 14) % 2];
      case 'spider': return s === 'bite' ? f.attack : s === 'down' || s === 'up' ? f.walk[0] : f.idle;
      case 'mini': return f.walk[Math.floor(this.t * 12) % 2];
      case 'moth': return s === 'spit' ? f.attack : f.walk[Math.floor(this.t * 14) % 6];
      default: return f.idle;
    }
  }
  draw(c, cx) {
    const x = this.x - cx;
    if (this.type === 'spider' && this.dieT == null) Art.R(c, x, L3.CEIL, 1, this.y - 10 - L3.CEIL, 'rgba(230,230,230,0.7)');
    let y = this.y, rot = 0;
    if (this.d.air) y += this.d.h / 2;
    if (this.dieT != null && this.type === 'mini') rot = Math.PI;
    const alpha = this.dieT != null && this.dieT > 1.3 ? (1.8 - this.dieT) / 0.5 : 1;
    const flash = this.flash > 0 ? '#ffffff' : this.slowT > 0 && (G.t * 8 | 0) % 2 ? '#80c0ff' : null;
    Spr.draw(c, this.d.sheet, this.frame(), x, y, this.d.flip ? -this.facing : this.facing, { rot, flash, alpha });
  }
};

// бомбочки мух, суп клопов, кислота босса
L3.Glob = class {
  constructor(kind, x, y, vx, vy) { this.kind = kind; this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.dead = false; this.t = 0; this.rot = 0; }
  update(dt, wd, pl, floorY = L3.GROUND) {
    this.t += dt; this.vy += 900 * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.rot += dt * 6;
    const hit = pl && !pl.dead && U.overlap({ x: this.x - 7, y: this.y - 7, w: 14, h: 14 }, pl.box);
    const g = this.vy > 0 && (this.y >= floorY || (wd.groundAt && wd.groundAt(this.x, this.y - this.vy * dt, this.y, 2)));
    if (hit || g) {
      this.dead = true;
      if (this.kind === 'bomb') {
        Sound.play('boom'); G.shake(4, 0.2);
        FX.burst(this.x, this.y, 16, { colors: ['#ffb040', '#ff6020', '#fff6a0', '#444'], speed: 170, life: 0.5 });
        if (pl && U.dist(pl.x, pl.y - 30, this.x, this.y) < 48) pl.hurt(14, this.x, wd);
      } else if (this.kind === 'soup') {
        FX.burst(this.x, this.y, 5, { colors: ['#d8a040', '#fff'], speed: 60, life: 0.3 });
        if (hit) pl.hurt(7, this.x, wd);
      } else {
        FX.burst(this.x, this.y, 8, { colors: ['#8ce040', '#c8ff60'], speed: 90, life: 0.4 });
        if (hit) pl.hurt(12, this.x, wd);
        if (!hit && wd.acidSplat && this.kind === 'acid') wd.acidSplat(this.x);
      }
    }
  }
  draw(c, cx) {
    if (this.kind === 'bomb') Art.item(c, 'bomb3', this.x - cx, this.y, this.rot, 0.9);
    else if (this.kind === 'soup') { Art.R(c, this.x - cx - 3, this.y - 3, 6, 6, '#e0a848'); Art.R(c, this.x - cx - 1, this.y - 2, 2, 2, '#fff'); }
    else Art.item(c, 'acid3', this.x - cx, this.y, 0, 1.4);
  }
};

// ---------- мебель ----------
// [лист, кадр, верх опоры (доля высоты), доля ширины, deco]
const FURN = {
  coat: ['f_corr', 0, 0, 0, true], shoe: ['f_corr', 1, 0.9, 0.9], wardrobe: ['f_corr', 2, 0.98, 0.92], bike: ['f_corr', 3, 0, 0, true], door: ['f_corr', 5, 0, 0, true],
  fridge: ['f_kit', 0, 0.97, 0.9], stove: ['f_kit', 1, 0.7, 0.92], table: ['f_kit', 2, 0.74, 0.6], sink: ['f_kit', 3, 0.82, 0.92], washer: ['f_kit', 4, 0.9, 0.8], cabinet: ['f_kit', 5, 0.98, 0.95],
  sofa: ['f_liv', 0, 0.62, 0.95], tv: ['f_liv', 1, 0.52, 0.92], unit: ['f_liv', 2, 0.98, 0.95], armchair: ['f_liv', 3, 0.55, 0.85], ctable: ['f_liv', 4, 0.95, 0.9], lamp: ['f_liv', 5, 0, 0, true],
  bed: ['f_bed', 0, 0.56, 0.92], dresser: ['f_bed', 1, 0.97, 0.92], wardrobe2: ['f_bed', 2, 0.98, 0.92], doll1: ['f_bed', 3, 0, 0, true], doll2: ['f_bed', 4, 0, 0, true],
  shelf: ['f_bed', 5, 0.98, 0.5], fridge2: ['f_bed', 6, 0.97, 0.9], boxes: ['f_bed', 7, 0.78, 0.8],
};

L3.build = function () {
  const G0 = L3.GROUND;
  const D = { furn: [], acid: [], chand: [], bugs: [], picks: [], checkpoints: [], hints: [] };
  const f = (type, x, y = G0) => D.furn.push({ type, x, y });
  const acid = () => {}; // лужи теперь появляются только от плевков мух
  const bug = (type, x, o) => D.bugs.push({ type, x, o });
  const pick = (kind, x, onType) => D.picks.push({ kind, x, onType });
  const ch = x => D.chand.push({ x });
  // 1. КОРИДОР
  f('shoe', 320); f('coat', 440); f('wardrobe', 720); f('bike', 1000); f('shoe', 1400); f('wardrobe', 1690); f('coat', 1950); f('wardrobe', 2250); f('shoe', 2900); f('bike', 3300);
  acid(1150, 1270); acid(1580, 1800); acid(2600, 2720); acid(3080, 3250);
  ch(900); ch(1950); ch(3000);
  bug('roach', 620); bug('mini', 820); bug('mini', 850); bug('roach', 1380); bug('fly', 1500); bug('bedbug', 1950); bug('spider', 2100); bug('roach', 2400); bug('fly', 2550); bug('roach', 2820); bug('bedbug', 3000); bug('mini', 3300); bug('mini', 3330); bug('mini', 3360); bug('spider', 3450);
  pick('chalkbox', 720, 'wardrobe'); pick('battery', 1400, 'shoe'); pick('bread', 2000); pick('tp', 2250, 'wardrobe');
  D.hints.push({ x: 0, w: 500, text: 'Мухобойка {punch} — бьёт током и замедляет. {switch} — сменить оружие. {throw} — газовая атака!' });
  D.hints.push({ x: 1300, w: 260, text: 'Мухи бомбят сверху, а моль плюётся кислотой! Не наступай в зелёные лужи — прыгай по мебели.' });
  // 2. КУХНЯ
  D.checkpoints.push({ x: 3660 });
  f('fridge', 3820); f('stove', 4100); f('table', 4420); f('sink', 4720); f('washer', 5000); f('cabinet', 5230, 175); f('fridge', 5520); f('table', 5900); f('stove', 6220);
  acid(3930, 4040); acid(4540, 4650); acid(5080, 5380); acid(5640, 5790); acid(6050, 6150);
  bug('bedbug', 3950); bug('bedbug', 4300); bug('roach', 4560); bug('fly', 4650); bug('moth', 4850); bug('fly', 5050); bug('roach', 5350); bug('moth', 5600); bug('bedbug', 5750); bug('spider', 5950); bug('roach', 6120); bug('mini', 6300); bug('mini', 6330); bug('mini', 6360);
  pick('jar', 3820, 'fridge'); pick('pelmeni3', 4420, 'table'); pick('battery', 5230, 'cabinet'); pick('jar', 5520, 'fridge'); pick('chalkbox', 6220, 'stove');
  D.hints.push({ x: 3700, w: 260, text: 'На холодильнике — берёзовый сок! Держи {punch} — стреляет очередью.' });
  // 3. ГОСТИНАЯ
  D.checkpoints.push({ x: 6460 });
  f('sofa', 6700); f('tv', 7020); f('unit', 7420); f('armchair', 7820); f('ctable', 8300); f('lamp', 8450); f('sofa', 8620); f('unit', 9020); f('armchair', 9420);
  acid(6860, 6950); acid(7560, 7700); acid(8150, 8450); acid(8760, 8900); acid(9160, 9320);
  ch(8000);
  bug('roach', 6620); bug('roach', 6780); bug('fly', 7000); bug('fly', 7120); bug('bedbug', 7300); bug('spider', 7560); bug('roach', 7950); bug('mini', 8100); bug('mini', 8130); bug('mini', 8160); bug('fly', 8500); bug('roach', 8700); bug('bedbug', 8950); bug('moth', 9100); bug('roach', 9300); bug('fly', 9550); bug('roach', 9680);
  pick('jar', 7020, 'tv'); pick('dichlorvos', 7420, 'unit'); pick('battery', 8300, 'ctable'); pick('bread', 8620, 'sofa'); pick('chalkbox', 9020, 'unit'); pick('pelmeni3', 9420, 'armchair');
  D.hints.push({ x: 7300, w: 200, text: 'На стенке — ДИХЛОФОС: уничтожает всех насекомых на экране!' });
  // 4. СПАЛЬНЯ
  D.checkpoints.push({ x: 9860 });
  f('bed', 10020); f('dresser', 10320); f('wardrobe2', 10620); f('doll1', 10820); f('bed', 11120); f('dresser', 11520); f('doll2', 11720); f('wardrobe2', 12020); f('dresser', 12420);
  acid(10160, 10250); acid(10700, 10900); acid(11280, 11450); acid(11800, 11950); acid(12200, 12350);
  ch(10450); ch(11620);
  bug('moth', 9950); bug('moth', 10100); bug('bedbug', 10220); bug('roach', 10450); bug('spider', 10640); bug('fly', 10820); bug('bedbug', 11000); bug('roach', 11250); bug('mini', 11400); bug('mini', 11430); bug('spider', 11660); bug('fly', 11900); bug('roach', 12100); bug('bedbug', 12300); bug('roach', 12620);
  pick('jar', 10320, 'dresser'); pick('battery', 10620, 'wardrobe2'); pick('tp', 11120, 'bed'); pick('pelmeni3', 11520, 'dresser'); pick('jar', 12020, 'wardrobe2');
  // 5. БАЛКОН
  D.checkpoints.push({ x: 12860 });
  f('shelf', 13000); f('fridge2', 13320); f('boxes', 13620); f('shelf', 14000); f('boxes', 14320); f('fridge2', 14720); f('boxes', 15020);
  acid(13100, 13250); acid(13700, 13900); acid(14420, 14620); acid(14800, 14950);
  bug('fly', 13000); bug('fly', 13200); bug('fly', 13500); bug('roach', 13420); bug('bedbug', 13820); bug('spider', 14100); bug('roach', 14220); bug('fly', 14500); bug('bedbug', 14640); bug('roach', 14900); bug('fly', 15100); bug('roach', 15220);
  pick('jar', 13320, 'fridge2'); pick('pelmeni3', 14000, 'shelf'); pick('battery', 14720, 'fridge2'); pick('chalkbox', 15020, 'boxes');
  return D;
};

// ---------- режим прохождения ----------
L3.Run = class {
  constructor(level) {
    this.level = level;
    const D = this.D = L3.build();
    const wd = this.world = new Game.World(L3.W, H);
    wd.stats = level.stats; wd.score = level.score;
    wd.addScore = n => { wd.score += n; level.score = wd.score; };
    wd.clouds = []; wd.globs = [];
    wd.addPlat({ x: 0, y: L3.GROUND, w: L3.W, h: 60, oneway: false, look: 'none' });
    this.furn = D.furn.map(p => {
      const def = FURN[p.type];
      const [w, h] = Spr.size(def[0], def[1]);
      const o = Object.assign({ w, h, def }, p);
      if (!def[4]) { const cw = w * def[3], top = p.y - h * def[2]; o.col = wd.addPlat({ x: p.x - cw / 2, y: top, w: cw, h: 8, oneway: true, look: 'none' }); }
      return o;
    });
    const topOf = (type, x) => { const f = this.furn.filter(p => p.type === type && p.col).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0]; return f ? f.col.y : L3.GROUND; };
    wd.enemies = D.bugs.map(b => new L3.Bug(b.type, b.x, b.o || {}));
    wd.pickups = D.picks.map(p => new Game.Pickup(p.kind, p.x, p.onType ? topOf(p.onType, p.x) : L3.GROUND));
    wd.checkpoints = D.checkpoints.map(c => Object.assign({ active: false }, c));
    this.acid = D.acid;
    this.chand = D.chand.map(c => ({ x: c.x, y: L3.CEIL + 16, state: 'hang', t: 0, vy: 0, rot: 0 }));
    this.hints = D.hints.map(h => Object.assign({ shown: 0 }, h));
    this.player = new L3.Player(level.startX || 80, L3.GROUND);
    if (level.carry3) { Object.assign(this.player.ammo3, level.carry3.ammo3); this.player.weapon = level.carry3.weapon; }
    this.respawn = { x: this.player.x };
    wd.cam.x = U.clamp(this.player.x - 140, 0, L3.W - L3.VW);
    wd.playerAttack = (hb, dmg, atk, pl) => this.playerAttack(hb, dmg, atk, pl);
    wd.acidSplat = x => { this.acid.push({ x1: x - 30, x2: x + 30, temp: 6, fr: 0 }); Sound.play('steam'); };
    wd.dichlorvos = () => this.dichlorvos();
    this.fade = 1; this.hint = null; this.hintA = 0; this.quipT = 15; this.roomIdx = -1; this.roomT = 0; this.done = false;
  }
  dichlorvos() {
    const wd = this.world, cx = wd.cam.x;
    Sound.play('steam'); G.flash(0.3, '#e8ffd0'); G.shake(4, 0.4);
    for (let i = 0; i < 40; i++) FX.spawn({ x: cx + U.rand(0, L3.VW), y: U.rand(L3.CEIL, 300), vx: U.rand(-30, 30), vy: U.rand(-20, 10), grav: 0, life: 1.6, color: '#e0f0d0', size: 6, type: 'puff' });
    for (const e of wd.enemies) if (e.dieT == null && e.x > cx - 20 && e.x < cx + L3.VW + 20) { if (e.hit(99, 1)) { wd.addScore(e.score); wd.stats.kills++; } }
    G.say(this.player, 'Дихлофос — оружие пролетариата!', 2);
  }
  playerAttack(hb, dmg, atk, pl) {
    const wd = this.world;
    for (const e of wd.enemies) {
      if (atk.hit.has(e) || e.dieT != null) continue;
      if (U.overlap(hb, e.box)) {
        atk.hit.add(e);
        if (atk.kind === 'swat' && pl.ammo3) pl.ammo3.swatter = Math.max(0, pl.ammo3.swatter - 4);
        const killed = e.hit(dmg, pl.facing, pl.ammo3 && pl.ammo3.swatter > 0 ? atk : null);
        Sound.play('hit'); G.hitStop = 0.04; G.shake(2, 0.1);
        if (killed) { wd.addScore(e.score); wd.stats.kills++; FX.popText(e.x, e.y - 50, '+' + e.score); }
      }
    }
    for (const g of wd.globs) if (!g.dead && g.kind !== 'bomb' && U.overlap(hb, { x: g.x - 8, y: g.y - 8, w: 16, h: 16 })) { g.dead = true; FX.popText(g.x, g.y, 'ОТБИЛ!', '#8cd0ff'); }
  }
  roomAt(x) { return L3.ROOMS.findIndex(r => x >= r.x0 && x < r.x1); }
  update(dt) {
    const wd = this.world, pl = this.player;
    wd.t += dt; if (!this.done) this.level.stats.time += dt;
    if (this.fade > 0 && !this.respawning) this.fade = Math.max(0, this.fade - dt * 2);
    wd.updatePlats(dt);
    pl.update(dt, wd);
    // выстрелы по насекомым
    for (const p of wd.projs) {
      p.update(dt, wd, pl);
      for (const e of wd.enemies) {
        if (p.dead || e.dieT != null || p.hitSet.has(e)) continue;
        if (U.overlap(p.box, e.box)) { p.hitSet.add(e); const k = e.hit(p.dmg, p.dir); Sound.play('hit'); if (k) { wd.addScore(e.score); wd.stats.kills++; } p.dead = true; p.poof(); }
      }
    }
    wd.projs = wd.projs.filter(p => !p.dead);
    for (const e of wd.enemies) e.update(dt, wd, pl);
    wd.enemies = wd.enemies.filter(e => !e.dead);
    for (const g of wd.globs) g.update(dt, wd, pl);
    wd.globs = wd.globs.filter(g => !g.dead);
    for (const p of wd.pickups) p.update(dt, wd, pl);
    wd.pickups = wd.pickups.filter(p => !p.dead);
    // газовое облако Валеры бьёт насекомых
    for (const cl of wd.clouds) {
      cl.t += dt;
      if (Math.random() < dt * 16) FX.spawn({ x: cl.x + U.rand(-cl.r, cl.r) * 0.7, y: cl.y + U.rand(-24, 24), vx: U.rand(-10, 10), vy: -8, grav: -4, life: 1.2, color: U.choice(['#8ab83a', '#a8c848', '#6a9a2a']), size: 6, type: 'puff' });
      cl.dmgT = (cl.dmgT || 0) - dt;
      if (cl.dmgT <= 0) { cl.dmgT = 0.4; for (const e of wd.enemies) if (e.dieT == null && Math.abs(e.x - cl.x) < cl.r && Math.abs(e.y - 30 - cl.y) < 70) { e.slowT = Math.max(e.slowT, 1); if (e.hit(1, e.x > cl.x ? 1 : -1)) { wd.addScore(e.score); wd.stats.kills++; } } }
    }
    wd.clouds = wd.clouds.filter(cl => cl.t < cl.life);
    // кислота на полу
    for (const a of this.acid) if (a.temp) a.temp -= dt;
    this.acid = this.acid.filter(a => a.temp == null || a.temp > 0);
    if (pl.onGround && Math.abs(pl.y - L3.GROUND) < 2 && !pl.dead) {
      const a = this.acid.find(a => pl.x > a.x1 + 4 && pl.x < a.x2 - 4);
      if (a) { this.acidT = (this.acidT || 0) - dt; if (this.acidT <= 0) { this.acidT = 0.4; if (pl.hurt(8, pl.x - pl.facing * 10, wd)) { pl.vy = -380; if (Math.random() < 0.4) G.say(pl, U.choice(['Горячо!!!', 'Кислота!!!', 'Мои кроссовки!']), 1); } } }
    }
    // люстры
    for (const c of this.chand) {
      if (c.state === 'hang' && Math.abs(pl.x - c.x) < 55) { c.state = 'shake'; c.t = 0; Sound.play('clank'); }
      else if (c.state === 'shake') { c.t += dt; if (c.t > 0.55) { c.state = 'fall'; Sound.play('glass'); } }
      else if (c.state === 'fall') {
        c.vy += 1500 * dt; c.y += c.vy * dt;
        if (!pl.dead && Math.abs(pl.x - c.x) < 26 && c.y + 20 > pl.y - 70 && c.y < pl.y) { pl.hurt(18, c.x, wd); }
        if (c.y >= L3.GROUND - 18) { c.y = L3.GROUND - 18; c.state = 'broken'; c.rot = 0.3; Sound.play('glass'); G.shake(5, 0.3); FX.burst(c.x, L3.GROUND - 10, 18, { colors: ['#e8f4ff', '#fff', '#c8a040'], speed: 180, type: 'shard', size: 2, life: 0.7 }); }
      }
    }
    // чекпоинты
    for (const cp of wd.checkpoints) if (!cp.active && Math.abs(pl.x - cp.x) < 24 && !pl.dead) { cp.active = true; this.respawn = { x: cp.x }; Sound.play('checkpoint'); pl.heal(15); FX.popText(cp.x, L3.GROUND - 70, 'КОНТРОЛЬНАЯ ТОЧКА', '#8cf08c'); }
    // комната
    const ri = this.roomAt(pl.x);
    if (ri !== this.roomIdx && ri >= 0) { this.roomIdx = ri; this.roomT = 2.2; }
    if (this.roomT > 0) this.roomT -= dt;
    // подсказки
    let hint = null;
    for (const h of this.hints) if (!h.done && pl.x > h.x && pl.x < h.x + h.w) { hint = h; h.shown += dt; if (h.shown > 7) h.done = true; }
    if (hint) { this.hint = hint; this.hintA = Math.min(1, this.hintA + dt * 4); } else this.hintA = Math.max(0, this.hintA - dt * 3);
    // реплики
    this.quipT -= dt;
    if (this.quipT <= 0 && !pl.dead) { this.quipT = U.rand(18, 28); G.say(pl, U.choice(['Это моя квартира, тараканьё!', 'Где моя тапка?!', 'Машка, пирожок был с сюрпризом...', 'Я вас всех выведу!', 'Мама, я в дезинсекции!']), 2); }
    // камера
    const tx = U.clamp(pl.x - L3.VW * 0.4 + pl.facing * 24, 0, L3.W - L3.VW);
    wd.cam.x += (tx - wd.cam.x) * Math.min(1, dt * 5);
    // смерть
    if (pl.dead && pl.deadT > 1.6 && !this.respawning) this.respawning = true;
    if (this.respawning) {
      this.fade = Math.min(1, this.fade + dt * 2.5);
      if (this.fade >= 1) {
        this.respawning = false; this.level.stats.deaths++;
        const np = new L3.Player(this.respawn.x, L3.GROUND);
        np.ammo3 = Object.assign({}, pl.ammo3); np.ammo3.juice = Math.max(np.ammo3.juice, 20); np.ammo3.swatter = Math.max(np.ammo3.swatter, 40); np.weapon = pl.weapon;
        this.player = np; wd.globs = []; wd.cam.x = U.clamp(np.x - 140, 0, L3.W - L3.VW);
        G.say(np, U.choice(['Меня так просто не вывести!', 'Ещё раз!']), 1.5);
      }
    }
    if (!this.done && pl.x > L3.W - 60 && !pl.dead) { this.done = true; pl.controls = false; this.level.reachToilet(this); }
  }
  drawWalls(c, camX) {
    const W3 = window.WALLS3, VW = L3.VW, top = L3.CEIL;
    for (const r of L3.ROOMS) {
      const sx0 = r.x0 - camX, sx1 = r.x1 - camX;
      if (sx1 < 0 || sx0 > VW) continue;
      const m = W3[r.key], img = L3.img[r.key];
      if (!img) continue;
      const hd = (L3.GROUND - 2 - top) / m.floor, wd = m.w / m.h * hd;
      c.save(); c.beginPath(); c.rect(Math.max(0, sx0), top, Math.min(VW, sx1) - Math.max(0, sx0), (L3.GROUND - 2 - top) / m.floor); c.clip();
      for (let x = sx0; x < Math.min(VW, sx1); x += wd) if (x + wd > 0) c.drawImage(img, Math.floor(x), top, Math.ceil(wd) + 1, hd);
      c.restore();
      const x0 = Math.max(0, Math.floor(sx0)), x1 = Math.min(VW, Math.ceil(sx1));
      L3.drawSlab(c, x0, top + hd - 2, x1 - x0, L3.CAMY + 400 - top - hd, camX, false);
    }
    {
      L3.drawSlab(c, 0, L3.CAMY - 2, VW, top - L3.CAMY + 2, camX, true);
      const g = c.createLinearGradient(0, top, 0, top + 16); g.addColorStop(0, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, top, VW, 16);
    }
    // дверные проёмы между комнатами
    for (const r of L3.ROOMS) if (r.x0 > 0) { const x = r.x0 - camX; if (x > -80 && x < VW + 80) Spr.draw(c, 'f_corr', 5, x, L3.GROUND + 2, 1); }
    // дверь туалета в конце
    const tx = L3.W - 40 - camX;
    if (tx < VW + 60) { Spr.draw(c, 'f_corr', 5, tx, L3.GROUND + 2, -1); G.text('WC', tx, L3.GROUND - 118, { align: 'center', color: '#8cd0ff', outline: true }); }
  }
  draw(c) {
    const wd = this.world, cx = Math.round(wd.cam.x), VW = L3.VW;
    c.save(); c.scale(L3.Z, L3.Z); c.translate(0, -L3.CAMY); c.imageSmoothingEnabled = false;
    this.drawWalls(c, cx);
    // лужи кислоты (плевки мух)
    for (const a of this.acid) {
      const xc = (a.x1 + a.x2) / 2 - cx;
      if (xc < -60 || xc > VW + 60) continue;
      const fr = a.temp != null && a.temp < 1.5 ? 5 : Math.floor(G.t * 6 + a.x1) % 4;
      Spr.draw(c, 'acid', fr, xc, L3.GROUND + 4, 1, { scale: (a.x2 - a.x1) / 72 });
    }
    for (const p of this.furn) if (p.x - cx > -160 && p.x - cx < VW + 160) Spr.draw(c, p.def[0], p.def[1], p.x - cx, p.y, 1);
    for (const ch of this.chand) {
      const x = ch.x - cx; if (x < -60 || x > VW + 60) continue;
      if (ch.state === 'hang' || ch.state === 'shake') Art.R(c, x - 1, L3.CEIL, 2, ch.y - 16 - L3.CEIL, '#2a2a2a');
      const sh = ch.state === 'shake' ? Math.sin(G.t * 60) * 0.12 : 0;
      c.save(); c.translate(x, ch.y); c.rotate(sh + ch.rot); Spr.draw(c, 'f_corr', 4, 0, 22, 1); c.restore();
    }
    for (const cp of wd.checkpoints) Art.checkpoint(c, cp.x - cx, L3.GROUND, cp.active, wd.t);
    for (const cl of wd.clouds) L3.drawCloud(c, cl, cx, 0);
    for (const p of wd.pickups) p.draw(c, cx, 0);
    for (const e of wd.enemies) e.draw(c, cx);
    this.player.draw(c, cx, 0);
    for (const g of wd.globs) g.draw(c, cx);
    for (const p of wd.projs) p.draw(c, cx);
    c.save(); c.translate(-cx, 0); FX.draw(c); c.restore();
    G.drawBubbles(c, cx, 0);
    c.restore();
    L3.drawHUD(c, this.player, wd);
    const left = Math.max(0, Math.round((L3.W - this.player.x) / 16));
    G.text('ДО ТУАЛЕТА: ' + left + ' м', W - 8, 22, { align: 'right', color: '#c8d0d8' });
    if (this.roomT > 0 && this.roomIdx >= 0) G.bigTitle(c, L3.ROOMS[this.roomIdx].name, Math.min(1, this.roomT), { size: 24, y: 110, color: '#ffd84a' });
    if (this.hint) Game.drawHint(c, this.hint.text, this.hintA);
    if (this.fade > 0) { c.fillStyle = `rgba(0,0,0,${this.fade})`; c.fillRect(0, 0, W, H); }
  }
};

// HUD уровня 3: здоровье + три оружия + газ
L3.drawHUD = function (c, pl, wd) {
  const R = Art.R;
  Game.drawHUD(c, pl, wd);
  const ws = [['swatter', 'swatter', pl.ammo3.swatter + '%'], ['juice', 'jar', pl.ammo3.juice], ['chalk', 'chalk', pl.ammo3.chalk]];
  ws.forEach(([wn, icon, n], i) => {
    const x = 174 + i * 56, sel = pl.weapon === wn, has = wn === 'swatter' || pl.ammo3[wn] > 0;
    R(c, x - 1, 5, 54, 24, sel ? '#ffd84a' : '#111'); R(c, x, 6, 52, 22, sel ? '#3a3020' : '#1c1f24');
    c.save(); if (!has) c.globalAlpha = 0.35; Art.item(c, icon, x + 12, 17, icon === 'swatter' ? -0.5 : 0, 0.8); c.restore();
    G.text(String(n), x + 24, 13, { size: 8, color: has ? '#fff' : '#666' });
  });
  const fc = pl.fartCool > 0 ? pl.fartCool / 9 : 0;
  R(c, 346, 6, 40, 22, '#111'); R(c, 347, 7, 38, 20, fc > 0 ? '#1c2418' : '#2a4a1a');
  G.text('ГАЗ', 366, 13, { size: 8, align: 'center', color: fc > 0 ? '#5a6a50' : '#b8ff70' });
  if (fc > 0) R(c, 347, 25, Math.round(38 * (1 - fc)), 2, '#8cd040');
};

// =====================================================================
// БОСС: шестирукий таракан на унитазе — фронтально, во весь экран (как финал Contra)
// =====================================================================
L3.AZ = 1.3; L3.AVW = W / L3.AZ; L3.AVH = H / L3.AZ; L3.AG = 254; L3.BCX = Math.round(L3.AVW / 2); L3.BSC = 0.92; L3.breath = 1;
// точка на кадре тела (доли кадра) -> координаты арены (с учётом «дыхания»)
L3.bpt = (fx, fy) => { const f = Spr.frame('boss4', 0) || [0, 0, 352, 500, 176, 500], k = L3.BSC / 2; return [L3.BCX + (fx * f[2] - f[4]) * k, L3.AG + (fy * f[3] - f[5]) * k * L3.breath]; };
L3.segDist = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, t = U.clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1); return Math.hypot(px - ax - dx * t, py - ay - dy * t); };
// геометрия кадров parts4: плечо (piv) и кончик (tip), доли кадра
const ARM4 = {
  claw: { fr: 3, piv: [0.217, 0.896], tip: [0.741, 0.064], cut: 14 },
  smoke: { fr: 1, piv: [0.176, 0.899], tip: [0.95, 0.31] },
  paper: { fr: 2, piv: [0.168, 0.9], tip: [0.873, 0.086] },
  ant: { fr: 4, piv: [0.074, 0.914], tip: [0.712, 0.057] },
};
const limbA0 = g => { const f = Spr.frame('parts4', g.fr) || [0, 0, 300, 300]; return Math.atan2((g.tip[1] - g.piv[1]) * f[3], (g.tip[0] - g.piv[0]) * f[2]); };
// конечность: плечо в (px,py), направление th «наружу» (0 — горизонтально, <0 — вверх), side: -1 левая, 1 правая
L3.drawLimb = function (c, g, px, py, th, side, sc, o = {}) {
  const f = Spr.frame('parts4', g.fr); if (!f) return;
  const rot = th - limbA0(g), k = sc / 2;
  c.save(); c.translate(px, py); c.rotate(side > 0 ? rot : -rot); if (side < 0) c.scale(-1, 1);
  if (o.filter) c.filter = o.filter;
  // срез основания (у клешни там «культя») — всё, что позади плеча, не рисуем
  if (g.cut != null) { const a0 = limbA0(g); c.rotate(a0); c.beginPath(); c.rect(g.cut * sc, -1000, 3000, 2000); c.clip(); c.rotate(-a0); }
  Spr.draw(c, 'parts4', g.fr, (f[4] - g.piv[0] * f[2]) * k, (f[5] - g.piv[1] * f[3]) * k, 1, { scale: sc, flash: o.flash, alpha: o.alpha });
  c.restore();
};
L3.Arm4 = class {
  constructor(boss, side, slot, kind) {
    // slot: 'up' — из плечевых гнёзд (перед телом), 'low' — из-за спины на уровне бёдер
    Object.assign(this, { boss, side, slot, kind, g: ARM4[kind], st: 0, state: 'grow', flash: 0, dead: false, gone: 0, grow: 0, boomed: false });
    this.hp = this.maxHp = Math.round((kind === 'claw' ? 14 : 24) * (G.BOSS_MULT || 1));
    this.sc = (slot === 'up' ? 1.3 : 1.15) * L3.BSC;
    this.th = slot === 'up' ? 0.1 : 0.6; this.cool = U.rand(0.8, 2.6);
    const f = Spr.frame('parts4', this.g.fr) || [0, 0, 300, 300];
    this.L = Math.hypot((this.g.tip[0] - this.g.piv[0]) * f[2], (this.g.tip[1] - this.g.piv[1]) * f[3]) / 2 * this.sc;
  }
  get pivot() { const p = this.slot === 'up' ? [0.16, 0.31] : [0.22, 0.5]; return L3.bpt(this.side > 0 ? 1 - p[0] : p[0], p[1]); }
  get ang() { return this.side > 0 ? this.th : Math.PI - this.th; }
  tip(k = 1) { const [px, py] = this.pivot, a = this.ang, L = this.L * k * this.grow; return [px + Math.cos(a) * L, py + Math.sin(a) * L]; }
  hitPoints() { return [0.45, 0.7, 0.95].map(k => this.tip(k)); }
  thTo(x, y) { const [px, py] = this.pivot; let t = this.side > 0 ? Math.atan2(y - py, x - px) : Math.PI - Math.atan2(y - py, x - px); while (t > Math.PI) t -= Math.PI * 2; while (t < -Math.PI) t += Math.PI * 2; return t; }
  set(s) { this.state = s; this.st = 0; }
  update(dt, ar) {
    const pl = ar.player; this.st += dt; if (this.flash > 0) this.flash -= dt;
    if (this.dead) { this.gone += dt; this.th += dt * 1.5; return; }
    const idleTh = (this.slot === 'up' ? 0.05 : 0.6) + Math.sin(ar.t * 2.1 + this.side + (this.slot === 'up' ? 0 : 1.7)) * 0.13;
    const T = (v, sp) => { this.th = U.lerp(this.th, v, Math.min(1, dt * sp)); };
    switch (this.state) {
      case 'grow': this.grow = Math.min(1, this.grow + dt * 1.5); T(idleTh, 4); if (this.grow >= 1) this.set(this.kind === 'paper' ? 'roll' : 'idle'); break;
      case 'roll': // сворачивает газету в трубочку
        T(-0.5 + Math.sin(this.st * 14) * 0.08, 5);
        if (this.st < 1.2 && Math.random() < dt * 8) Sound.play('rope');
        if (this.st > 1.3) { this.set('idle'); this.cool = 0.6; }
        break;
      case 'idle':
        T(idleTh, 3); this.cool -= dt;
        if (this.cool <= 0 && pl && !pl.dead && ar.canAttack(this)) { if (this.kind === 'smoke') this.set('puff'); else { this.set('raise'); Sound.play('rope'); } }
        break;
      case 'raise': // замах: лапа поднимается, цель — где Валера сейчас
        T(-1.05 + Math.sin(this.st * 30) * 0.03, 5);
        this.tx = U.clamp(pl.x + pl.vx * 0.15, 12, L3.AVW - 12);
        if (this.st > (this.kind === 'paper' ? 0.75 : 0.6)) { this.set('slam'); Sound.play('throw'); }
        break;
      case 'slam': {
        T(this.thTo(this.tx, L3.AG - 4), 16);
        const [tx, ty] = this.tip();
        if (!this.boomed && this.st > 0.1) {
          this.boomed = true; G.shake(this.kind === 'paper' ? 7 : 5, 0.25); Sound.play(this.kind === 'paper' ? 'punch' : 'stomp');
          if (ty > L3.AG - 30) FX.dust(tx, L3.AG, 10);
          if (this.kind === 'paper') FX.popText(tx, L3.AG - 60, 'ШЛЁП!', '#ffffff');
        }
        if (this.st > 0.05 && this.st < 0.32 && pl && !pl.dead) {
          const r = this.kind === 'paper' ? 30 : 20;
          for (const [hx, hy] of this.hitPoints().slice(1)) if (U.overlap({ x: hx - r, y: hy - r, w: r * 2, h: r * 2 }, pl.box)) { pl.hurt(this.kind === 'paper' ? 16 : 12, hx, ar.world); break; }
        }
        if (this.st > 1.0) { this.boomed = false; this.set('back'); } // лапа лежит на полу — удобно отстреливать
        break;
      }
      case 'back': T(idleTh, 4); if (this.st > 0.6) { this.set('idle'); this.cool = U.rand(1.6, 3.0); } break;
      case 'puff': // затяжка: сигарета у лица, огонёк разгорается
        T(-0.95, 4);
        if (this.st > 0.4 && Math.random() < dt * 14) { const [ex, ey] = this.tip(); FX.spawn({ x: ex, y: ey, vx: U.rand(-10, 10), vy: -30, grav: -10, life: 0.9, color: U.choice(['#d8d8d8', '#b8b8b8']), size: 3, type: 'puff' }); }
        if (this.st > 1.3) { ar.blowSmoke(); this.set('back'); }
        break;
    }
  }
  draw(c) {
    if (this.dead && this.gone > 0.4) return;
    const [px, py] = this.pivot, flash = this.flash > 0 || this.dead ? '#ffffff' : null;
    const alpha = this.dead ? 1 - this.gone / 0.4 : 1;
    L3.drawLimb(c, this.g, px, py, this.th, this.side, this.sc * Math.max(0.05, this.grow), { flash, alpha, filter: this.slot === 'low' ? 'brightness(0.72)' : null });
    if (this.kind === 'smoke' && this.state === 'puff' && !this.dead) {
      const [ex, ey] = this.tip(), r = 3 + Math.sin(G.t * 20) * 1 + Math.min(1, this.st) * 3;
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,120,30,0.5)'; c.beginPath(); c.arc(ex, ey, r, 0, 7); c.fill(); c.restore();
    }
  }
};
L3.Boss4 = class {
  constructor() {
    this.phase = 1; this.head = this.headMax = Math.round(110 * (G.BOSS_MULT || 1)); this.flash = 0; this.blowT = 0; this.beamCool = 1.2; this.spitT = 3;
    this.x = L3.BCX; this.y = L3.AG; this.headH = 196; this.voice = 110;
    this.arms = [new L3.Arm4(this, -1, 'low', 'claw'), new L3.Arm4(this, 1, 'low', 'claw'), new L3.Arm4(this, -1, 'up', 'claw'), new L3.Arm4(this, 1, 'up', 'claw')];
    for (const a of this.arms) { a.grow = 1; a.state = 'idle'; }
  }
  get totalHp() {
    const m = G.BOSS_MULT || 1, arms = this.arms.reduce((s, a) => s + (a.dead ? 0 : Math.max(0, a.hp)), 0);
    return this.head + arms + (this.phase === 1 ? Math.round(48 * m) : 0);
  }
  get headBox() { const [x0, y0] = L3.bpt(0.3, 0.05), [x1, y1] = L3.bpt(0.7, 0.27); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; }
  get mouth() { return L3.bpt(0.5, 0.215); }
};
L3.Arena = class {
  constructor(level) {
    this.level = level;
    const wd = this.world = new Game.World(W, H);
    wd.stats = level.stats; wd.score = level.score;
    wd.addScore = n => { wd.score += n; level.score = wd.score; };
    wd.clouds = []; wd.globs = []; wd.floorY = L3.AG; wd.ceilY = -60;
    wd.addPlat({ x: -40, y: L3.AG, w: L3.AVW + 80, h: 60, oneway: false, look: 'none' });
    this.boss = new L3.Boss4(); this.player = null; this.fighting = false; this.t = 0;
    this.smoke = []; this.acid = []; this.beam = null; this.dropT = 5; this.sinkK = 0; this.dying = null; this.pending = null;
    wd.playerAttack = (hb, dmg) => this.hitBoss(hb, dmg);
    wd.acidSplat = x => this.addAcid(x, 30, 6);
    this.hint = null; this.hintA = 0; this.hintT = 0; this.actors = [];
  }
  startFight(pl) {
    this.player = pl; pl.controls = true; this.fighting = true;
    this.hint = 'Отстреливай лапы! Держи {up} — сок летит вверх по диагонали.'; this.hintT = 7;
    G.say(this.boss, 'Шесть лап против одного арбуза? Смешно!', 2.2, { shout: true }); this.boss.blowT = 1.2;
  }
  canAttack(a) {
    const pl = this.player, b = this.boss;
    const busy = b.arms.filter(x => !x.dead && x !== a && (x.state === 'raise' || x.state === 'slam' || x.state === 'puff')).length;
    if (busy >= (b.phase === 1 ? (G.DIFF === 2 ? 2 : 1) : 2)) return false;
    if (a.kind === 'claw') return a.side > 0 ? pl.x > L3.BCX - 50 : pl.x < L3.BCX + 50;
    return true;
  }
  blowSmoke() {
    const b = this.boss, [mx, my] = b.mouth, pl = this.player, dir = pl && pl.x < mx ? -1 : 1;
    b.blowT = 0.9;
    this.smoke.push({ x: mx, y: my + 6, vx: dir * 70, vy: 130, dir, t: 0, life: 99, r: 16, row: 1 });
    Sound.play('steam');
    G.say(b, U.choice(['Пфффф! Дыши глубже!', 'Кури, пока я добрый!', 'Минздрав предупреждал!', '«Прима» без фильтра!']), 1.4);
  }
  addAcid(x, hw, life) {
    const ex = this.acid.find(a => Math.abs((a.x1 + a.x2) / 2 - x) < hw * 0.7);
    if (ex) { ex.temp = Math.max(ex.temp, life); return; }
    this.acid.push({ x1: x - hw, x2: x + hw, temp: life });
  }
  hitBoss(hb, dmg) {
    const b = this.boss;
    if (!this.fighting) return false;
    for (const a of b.arms) {
      if (a.dead || a.grow < 0.6) continue;
      for (const [hx, hy] of a.hitPoints()) if (U.overlap(hb, { x: hx - 18, y: hy - 18, w: 36, h: 36 })) { this.damageArm(a, dmg); return true; }
    }
    if (U.overlap(hb, b.headBox)) {
      if (b.phase < 3) { if (!this.dingT || this.dingT <= 0) { this.dingT = 0.6; Sound.play('clank'); FX.popText(L3.BCX, 40, 'СНАЧАЛА ЛАПЫ!', '#ff8a4a'); } return true; }
      b.head -= dmg; b.flash = 0.08; Sound.play('hit'); this.world.addScore(40 * dmg);
      if (b.head <= 0) { b.head = 0; this.bossDown(); }
      return true;
    }
    return false;
  }
  damageArm(a, dmg) {
    const b = this.boss;
    a.hp -= dmg; a.flash = 0.08; Sound.play('hit'); this.world.addScore(30 * dmg);
    if (a.hp > 0 || a.dead) return;
    a.dead = true; a.gone = 0; Sound.play('squeak'); G.shake(4, 0.25);
    const [tx, ty] = a.tip(0.6);
    FX.burst(tx, ty, 10, { colors: ['#8ce040', '#c8ff60', '#6a4020'], speed: 110, life: 0.45 });
    G.say(b, U.choice(['Моя лапа!!! Я её сорок лет растил!', 'Ах ты ж гад рыжий!', 'Ну всё, тапок тебе!', 'Тьфу на тебя, санэпидемстанция!', 'Это была моя любимая лапа!']), 2, { shout: true }); b.blowT = 1;
    if (!b.arms.every(x => x.dead)) return;
    if (b.phase === 1) {
      b.phase = 2;
      this.pending = { t: 1.3, fn: () => {
        b.arms = b.arms.filter(x => !x.dead).concat([new L3.Arm4(b, 1, 'up', 'paper'), new L3.Arm4(b, -1, 'up', 'smoke')]);
        G.say(b, 'Ну держись! Сейчас почитаем «Вечерочек»!', 2, { shout: true }); b.blowT = 1.5;
        this.hint = 'Газета бьёт сверху, дым стелется по полу — перепрыгивай!'; this.hintT = 6;
      } };
    } else if (b.phase === 2) {
      b.phase = 3; b.beamCool = 1.6;
      G.say(b, 'Ах так?! Получай кислотой!!!', 1.8, { shout: true }); b.blowT = 1.2;
      this.hint = 'Лап больше нет! Стреляй в голову и убегай от кислотной струи!'; this.hintT = 6;
    }
  }
  bossDown() {
    const pl = this.player;
    this.fighting = false; pl.controls = false; pl.vx = 0; this.world.globs = []; this.smoke = []; this.beam = null;
    this.world.addScore(9000); this.level.stats.kills++; Music.stop(); Sound.play('squeak'); G.shake(6, 0.5);
    this.dying = 0; G.say(this.boss, 'Не-е-ет! Мой трон!..', 1.6, { shout: true });
  }
  updateBeam(dt, pl) {
    const b = this.boss, bm = this.beam, [mx, my] = b.mouth, wd = this.world;
    bm.t += dt;
    if (bm.st === 'charge') {
      bm.x = U.lerp(bm.x, pl.x, Math.min(1, dt * 5));
      if (Math.random() < dt * 30) { const a = Math.random() * 6.28, r = 26; FX.spawn({ x: mx + Math.cos(a) * r, y: my + Math.sin(a) * r, vx: -Math.cos(a) * 60, vy: -Math.sin(a) * 60, grav: 0, life: 0.4, color: U.choice(['#b8ff40', '#e8ffa0']), size: 2 }); }
      if (bm.t > 0.95) { bm.st = 'fire'; bm.t = 0; bm.lastX = bm.x; this.addAcid(bm.x, 30, 5.5); Sound.play('steam'); G.shake(3, 0.3); }
      return;
    }
    const sp = 112 * (G.DIFF === 2 ? 1.2 : G.DIFF === 0 ? 0.8 : 1);
    bm.x = U.clamp(U.approach(bm.x, pl.x, sp * dt), 8, L3.AVW - 8);
    if (Math.abs(bm.x - bm.lastX) > 18) { this.addAcid(bm.x, 28, 5.5); bm.lastX = bm.x; }
    if (Math.random() < dt * 40) FX.spawn({ x: bm.x + U.rand(-6, 6), y: L3.AG - 2, vx: U.rand(-60, 60), vy: U.rand(-160, -60), grav: 500, life: 0.4, color: U.choice(['#8ce040', '#c8ff60', '#eaffc0']), size: 2 });
    if (Math.random() < dt * 8) FX.spawn({ x: bm.x, y: L3.AG - 6, vx: U.rand(-10, 10), vy: -30, grav: -10, life: 0.8, color: '#c8e0b0', size: 5, type: 'puff' });
    if (!pl.dead) {
      const d = Math.min(L3.segDist(pl.x, pl.y - 20, mx, my, bm.x, L3.AG), L3.segDist(pl.x, pl.y - 60, mx, my, bm.x, L3.AG));
      if (d < 12 && pl.hurt(14, bm.x, wd) && Math.random() < 0.5) G.say(pl, U.choice(['Жжётся!!!', 'Мой арбуз!']), 1);
    }
    if (bm.t > 1.9) { this.beam = null; b.beamCool = U.rand(1.4, 2.2); }
  }
  update(dt) {
    const wd = this.world, pl = this.player, b = this.boss;
    this.t += dt; wd.t += dt; if (this.fighting) this.level.stats.time += dt;
    L3.breath = 1 + Math.sin(this.t * 2.2) * 0.012;
    if (this.dingT > 0) this.dingT -= dt;
    if (b.flash > 0) b.flash -= dt; if (b.blowT > 0) b.blowT -= dt;
    if (pl) { pl.update(dt, wd); pl.x = U.clamp(pl.x, 10, L3.AVW - 10); }
    if (this.pending) { this.pending.t -= dt; if (this.pending.t <= 0) { const f = this.pending.fn; this.pending = null; f(); } }
    for (const a of b.arms) if (this.fighting || a.dead) a.update(dt, this);
    b.arms = b.arms.filter(a => !(a.dead && a.gone > 0.4));
    if (this.fighting) {
      // фаза 3: кислотная струя изо рта + редкие плевки
      if (this.beam) this.updateBeam(dt, pl);
      else if (b.phase === 3 && !pl.dead) {
        b.beamCool -= dt; b.spitT -= dt;
        if (b.beamCool <= 0) { this.beam = { st: 'charge', t: 0, x: pl.x }; Sound.play('warn'); }
        else if (b.spitT <= 0) {
          b.spitT = U.rand(3.5, 5); b.blowT = 0.5; const [mx, my] = b.mouth;
          for (let i = 0; i < 2; i++) { const tx = pl.x + U.rand(-60, 60), T = 0.9 + i * 0.15; wd.globs.push(new L3.Glob('acid', mx, my, (tx - mx) / T, (L3.AG - 10 - my - 0.5 * 900 * T * T) / T)); }
        }
      }
      // дым стелется по полу
      for (const s of this.smoke) {
        s.t += dt;
        if (s.y < L3.AG - 28) { s.y += s.vy * dt; s.x += s.vx * dt; } else { s.y = L3.AG - 28; s.x += s.dir * 135 * dt; }
        s.r = Math.min(36, 16 + s.t * 24);
        if (!pl.dead && Math.abs(pl.x - s.x) < s.r * 0.7 && pl.y > s.y - s.r * 0.6 && pl.y - 70 < s.y + s.r * 0.5) {
          if (pl.hurt(10, s.x, wd) && Math.random() < 0.5) G.say(pl, U.choice(['Кха-кха!', 'Фу, «Прима»!']), 1);
        }
      }
      this.smoke = this.smoke.filter(s => s.x > -60 && s.x < L3.AVW + 60);
      // кислотные лужи жгут ноги
      if (pl.onGround && !pl.dead) {
        const a = this.acid.find(a => pl.x > a.x1 + 4 && pl.x < a.x2 - 4);
        if (a) { this.acidT = (this.acidT || 0) - dt; if (this.acidT <= 0) { this.acidT = 0.4; if (pl.hurt(8, pl.x - pl.facing * 10, wd)) pl.vy = -380; } }
      }
      // патроны падают сверху
      this.dropT -= dt;
      if (this.dropT <= 0) { this.dropT = U.rand(6, 9); const p = new Game.Pickup(U.choice(['jar', 'jar', 'chalkbox', 'battery', 'bread']), U.rand(24, L3.AVW - 24), 0); p.falling = true; wd.pickups.push(p); }
      if (pl.dead && pl.deadT > 1.6 && !this.resetting) { this.resetting = true; this.level.stats.deaths++; this.pending = { t: 0.4, fn: () => { this.resetting = false; this.level.restartBoss(); } }; }
    }
    for (const a of this.acid) a.temp -= dt;
    this.acid = this.acid.filter(a => a.temp > 0);
    // поражение: таракан проваливается в унитаз
    if (this.dying != null) {
      this.dying += dt;
      if (this.dying > 1.1) {
        if (!this.sinkSnd) { this.sinkSnd = true; Sound.play('splash'); }
        this.sinkK = Math.min(1, (this.dying - 1.1) / 1.5);
        const [, ry] = L3.bpt(0.5, 0.6);
        if (this.sinkK < 1 && Math.random() < dt * 40) FX.spawn({ x: L3.BCX + U.rand(-40, 40), y: ry, vx: U.rand(-90, 90), vy: U.rand(-220, -80), grav: 600, life: 0.6, color: U.choice(['#bfe8ff', '#ffffff', '#8cc8f0']), size: 2 });
        if (this.sinkK >= 1 && !this.doneSink) { this.doneSink = true; this.pending = { t: 0.5, fn: () => this.level.bossDefeated() }; }
      }
    }
    for (const g of wd.globs) g.update(dt, wd, pl, L3.AG);
    wd.globs = wd.globs.filter(g => !g.dead);
    for (const p of wd.projs) { p.update(dt, wd); if (!p.dead && this.hitBoss(p.box, p.dmg)) { p.dead = true; p.poof(); } }
    wd.projs = wd.projs.filter(p => !p.dead);
    if (pl) for (const p of wd.pickups) p.update(dt, wd, pl);
    wd.pickups = wd.pickups.filter(p => !p.dead);
    for (const a of this.actors) a.update(dt);
    if (this.hintT > 0) { this.hintT -= dt; this.hintA = Math.min(1, this.hintA + dt * 4); } else this.hintA = Math.max(0, this.hintA - dt * 3);
  }
  bossFrame() {
    const b = this.boss;
    if (this.dying != null) return 3;
    if (this.beam) return 2;
    if (b.flash > 0 && b.phase === 3) return 3;
    if (b.blowT > 0) return 1;
    if (b.phase === 3) return this.t % 3 < 0.5 ? 1 : 3;
    return this.t % 5 < 0.4 ? 1 : 0;
  }
  drawAntennae(c) {
    for (const s of [-1, 1]) {
      const [x, y] = L3.bpt(s > 0 ? 0.56 : 0.44, 0.075);
      const th = -1.25 + Math.sin(this.t * 1.7 + s * 1.3) * 0.18 + Math.sin(this.t * 4.3 + s) * 0.05;
      L3.drawLimb(c, ARM4.ant, x, y, th, s, 0.75 * L3.BSC, { filter: 'brightness(0.85)' });
    }
  }
  drawBody(c) {
    const b = this.boss, fr = this.bossFrame(), f = Spr.frame('boss4', fr); if (!f) return;
    const k = L3.BSC / 2, x0 = L3.BCX - f[4] * k, y0 = L3.AG - f[5] * k, w = f[2] * k, h = f[3] * k;
    if (this.sinkK <= 0) {
      c.save(); c.translate(L3.BCX + (this.dying != null ? Math.sin(this.t * 40) * 2 : 0), L3.AG);
      c.scale(1 + Math.sin(this.t * 2.2 + 1) * 0.006, L3.breath);
      Spr.draw(c, 'boss4', fr, 0, 0, 1, { scale: L3.BSC, flash: b.flash > 0 ? '#ffffff' : null });
      c.restore(); return;
    }
    const img = Spr.sheets.boss4.img, K = this.sinkK, rim = 0.61;
    // бачок (под тараканом его не было видно — рисуем)
    {
      const tx = x0 + w * 0.31, tw = w * 0.38, ty = y0 + h * 0.01, th = h * 0.24, R = Art.R;
      R(c, tx + tw / 2 - 5, ty + th, 10, h * 0.36 - th, '#2a2218'); R(c, tx + tw / 2 - 4, ty + th, 8, h * 0.36 - th, '#bdb4a0'); R(c, tx + tw / 2 - 4, ty + th, 2, h * 0.36 - th, '#e4dccb');
      R(c, tx - 1, ty - 1, tw + 2, th + 2, '#2a2218');
      const g = c.createLinearGradient(tx, 0, tx + tw, 0);
      g.addColorStop(0, '#9a8e78'); g.addColorStop(0.3, '#efe8d6'); g.addColorStop(0.7, '#d4cab4'); g.addColorStop(1, '#8a7e68');
      c.fillStyle = g; c.fillRect(tx, ty, tw, th);
      R(c, tx - 4, ty - 2, tw + 8, 7, '#2a2218'); R(c, tx - 3, ty - 1, tw + 6, 5, '#e8e0cc'); R(c, tx - 3, ty + 3, tw + 6, 1, '#a89c84');
      R(c, tx + tw / 2 - 5, ty - 5, 10, 4, '#2a2a2a'); R(c, tx + tw / 2 - 4, ty - 4, 8, 2, '#9a9a9a');
      c.fillStyle = 'rgba(140,90,40,0.45)'; c.fillRect(tx + tw * 0.2, ty + th * 0.3, 3, th * 0.5); c.fillRect(tx + tw * 0.72, ty + th * 0.2, 2, th * 0.6); c.fillRect(tx + 2, ty + th - 4, tw - 4, 3);
    }
    // таракана засасывает: съезжает вниз и сжимается к центру, обрезан по ободу
    if (K < 1) {
      c.save(); c.beginPath(); c.rect(x0 - 40, y0 - 40, w + 80, h * rim + 40); c.clip();
      const ry = y0 + h * rim;
      c.translate(L3.BCX, ry); c.rotate(Math.sin(this.t * 18) * 0.06 * (1 - K)); c.scale(1 - 0.7 * K, 1); c.translate(-L3.BCX, -ry);
      c.drawImage(img, f[0], f[1] + f[3] * 0.08, f[2], f[3] * 0.92, x0, y0 + h * 0.08 + K * h * 0.62, w, h * 0.92);
      c.restore();
    }
    // сам унитаз поверх
    c.drawImage(img, f[0] + f[2] * 0.25, f[1] + f[3] * 0.585, f[2] * 0.5, f[3] * 0.415, x0 + w * 0.25, y0 + h * 0.585, w * 0.5, h * 0.415);
  }
  drawBeam(c) {
    const bm = this.beam; if (!bm) return;
    const [mx, my] = this.boss.mouth, ix = bm.x, iy = L3.AG - 2;
    c.save();
    if (bm.st === 'charge') {
      const g = c.createRadialGradient(mx, my, 1, mx, my, 8 + bm.t * 14);
      g.addColorStop(0, 'rgba(220,255,140,0.9)'); g.addColorStop(1, 'rgba(120,255,40,0)');
      c.fillStyle = g; c.beginPath(); c.arc(mx, my, 8 + bm.t * 14, 0, 7); c.fill();
      c.globalAlpha = 0.35 + 0.35 * Math.sin(G.t * 30); c.strokeStyle = '#b8ff40'; c.lineWidth = 1; c.setLineDash([4, 4]);
      c.beginPath(); c.moveTo(mx, my); c.lineTo(ix, iy); c.stroke(); c.setLineDash([]);
      c.strokeStyle = '#ff4020'; c.lineWidth = 2; c.beginPath(); c.ellipse(ix, iy, 14, 4, 0, 0, 7); c.stroke();
      c.restore(); return;
    }
    // струя: изогнутая, дрожащая, в три слоя + пузыри
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const k = i / 16, nx = -(iy - my), ny = ix - mx, nl = Math.hypot(nx, ny) || 1;
      const wob = Math.sin(k * 18 - G.t * 40) * 1.6 * (0.3 + k) + Math.sin(k * Math.PI) * 10;
      pts.push([U.lerp(mx, ix, k) + nx / nl * wob, U.lerp(my, iy, k) + ny / nl * wob * 0.3 + Math.sin(k * Math.PI) * 8]);
    }
    const path = () => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const p of pts) c.lineTo(p[0], p[1]); };
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = 'rgba(120,255,60,0.25)'; c.lineWidth = 14 + Math.sin(G.t * 50) * 2; path(); c.stroke();
    c.strokeStyle = 'rgba(124,230,40,0.9)'; c.lineWidth = 7; path(); c.stroke();
    c.strokeStyle = '#eaffc0'; c.lineWidth = 2.5; path(); c.stroke();
    c.fillStyle = '#d8ff90';
    for (let j = 0; j < 7; j++) { const k = (G.t * 2.2 + j / 7) % 1, p = pts[Math.floor(k * 16)]; c.beginPath(); c.arc(p[0] + Math.sin(j * 7 + G.t * 9) * 3, p[1], 1.5 + (j % 3), 0, 7); c.fill(); }
    // пятно попадания
    const g = c.createRadialGradient(ix, iy, 1, ix, iy, 22);
    g.addColorStop(0, 'rgba(230,255,160,0.95)'); g.addColorStop(1, 'rgba(120,255,40,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(ix, iy, 24, 8, 0, 0, 7); c.fill();
    c.restore();
  }
  draw(c) {
    const wd = this.world, b = this.boss;
    c.fillStyle = '#12100e'; c.fillRect(0, 0, W, H);
    c.save(); c.scale(L3.AZ, L3.AZ); c.imageSmoothingEnabled = false;
    if (L3.img.boss2_bg) c.drawImage(L3.img.boss2_bg, 0, 0, L3.AVW, L3.AVH);
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(L3.BCX, L3.AG, 100, 8, 0, 0, 7); c.fill();
    const alive = this.sinkK <= 0;
    // лапы растут из-за корпуса: основания спрятаны за плечами
    if (alive) { this.drawAntennae(c); for (const a of b.arms) if (a.slot === 'low') a.draw(c); for (const a of b.arms) if (a.slot === 'up') a.draw(c); }
    this.drawBody(c);
    for (const a of this.acid) {
      const fr = a.temp < 1.2 ? 5 : Math.floor(G.t * 6 + a.x1) % 4;
      Spr.draw(c, 'acid', fr, (a.x1 + a.x2) / 2, L3.AG + 3, 1, { scale: (a.x2 - a.x1) / 72, alpha: Math.min(1, a.temp) });
    }
    this.drawBeam(c);
    for (const s of this.smoke) L3.drawCloud(c, s, 0, 0);
    for (const p of wd.pickups) p.draw(c, 0, 0);
    for (const a of this.actors) a.draw(c, 0, 0);
    if (this.player) this.player.draw(c, 0, 0);
    for (const g of wd.globs) g.draw(c, 0);
    for (const p of wd.projs) p.draw(c, 0);
    FX.draw(c);
    G.drawBubbles(c, 0, 0);
    if (this.fighting && b.phase === 3) { const hb = b.headBox; if ((G.t * 4 | 0) % 2) G.text('ГОЛОВА!', hb.x + hb.w / 2, hb.y - 12, { align: 'center', color: '#ffd84a', outline: true }); }
    c.restore();
    if (this.player && this.fighting) {
      L3.drawHUD(c, this.player, wd);
      const tot = b.totalHp, mx = b.maxTotal || (b.maxTotal = tot);
      Art.R(c, 160, H - 26, 320, 16, '#111'); Art.R(c, 162, H - 24, 316, 12, '#3a1010');
      Art.R(c, 162, H - 24, Math.round(316 * Math.min(1, tot / mx)), 12, b.phase === 3 ? '#ff4020' : '#8a5a2a');
      G.text('ТАРАКАН НА ТРОНЕ · ФАЗА ' + b.phase, W / 2, H - 40, { align: 'center', color: '#e8c090', outline: true });
    }
    if (this.hint) Game.drawHint(c, this.hint, this.hintA, 44);
  }
};

// =====================================================================
// КОМИКС-СЦЕНЫ
// =====================================================================
L3.comic = function (level, panels, after) {
  // panels: [{img, cap, lines: [[who, text, bx, by]], sfx}]
  const st = { i: 0, t: 0, fade: 1, bubbles: [], cap: '', title: 0 };
  level.drawScene = c => {
    const p = panels[st.i]; if (!p) return;
    const img = L3.img[p.img];
    const k = 1 + Math.min(1, st.t / 6) * 0.05;
    c.fillStyle = '#0a0a0c'; c.fillRect(0, 0, W, H);
    if (img) { c.save(); c.translate(W / 2, H / 2); c.scale(k, k); c.drawImage(img, -W / 2, -H / 2, W, H); c.restore(); }
    if (st.cap) {
      const lines = G.wrap(st.cap, 380, 8);
      const cy = H - 34 - lines.length * 12;
      Art.R(c, 10, cy, 400, lines.length * 12 + 12, '#111'); Art.R(c, 12, cy + 2, 396, lines.length * 12 + 8, '#f2d84a');
      lines.forEach((l, j) => G.text(l, 20, cy + 6 + j * 12, { color: '#1a1a1a', shadow: false }));
    }
    for (const b of st.bubbles) G.drawBubble(c, b.x, b.y, b.text, { shout: b.shout });
    if (st.title > 0) G.bigTitle(c, st.titleText, st.title, { size: 20, y: H - 50, color: '#ffd84a' });
    G.text('ENTER — дальше', W - 8, H - 12, { align: 'right', size: 8, color: 'rgba(255,255,255,0.55)' });
    if (st.fade > 0) { c.fillStyle = `rgba(0,0,0,${st.fade})`; c.fillRect(0, 0, W, H); }
  };
  level.updateScene = dt => { st.t += dt; FX.update(dt); };
  const waitKey = function* () { const t0 = G.t; yield () => G.t - t0 > 0.25 && (G.Input.pressed('start') || G.Input.pressed('jump') || G.Input.pressed('punch')); };
  return function* () {
    for (let i = 0; i < panels.length; i++) {
      const p = panels[i];
      st.i = i; st.t = 0; st.bubbles = []; st.cap = ''; st.title = 0;
      Sound.play(p.sfx || 'boom');
      yield* Scene.tween(0.35, k => { st.fade = 1 - k; });
      if (p.cap) { st.cap = p.cap; yield 0.4; }
      for (const [text, x, y, shout] of p.lines || []) {
        st.bubbles.push({ text, x, y, shout }); Sound.play('blip', 300);
        yield* waitKey();
      }
      if (p.title) { st.titleText = p.title; yield* Scene.tween(0.4, k => { st.title = k; }); }
      if (!(p.lines || []).length || p.title) yield* waitKey();
      yield* Scene.tween(0.3, k => { st.fade = k; });
    }
    if (after) yield* after();
  };
};

L3.sceneIntro = level => L3.comic(level, [
  { img: 'comic1', cap: 'Вечер. Валера добрался до своей квартиры...', lines: [['Ох... голова кружится... живот крутит...', 300, 70]] },
  { img: 'comic2', sfx: 'fart', cap: 'Пирожок из столовки дал о себе знать.', lines: [['ПФФФФФ!!!', 180, 120, true], ['Это что ещё такое?!', 470, 90]] },
  { img: 'comic3', cap: 'В квартире — гости. Много гостей.', lines: [['Рыба!', 250, 150], ['Суп почти готов!', 520, 60], ['Не мешай, у меня рекорд!', 470, 190]] },
  { img: 'comic4', cap: 'ОПЕРАЦИЯ «ДЕЗИНСЕКЦИЯ»', lines: [['Зря я в столовке у Машки взял тот пирожок...', 330, 60]], title: 'УРОВЕНЬ 3: ГЛЮКИ' },
]);
L3.sceneBoss = level => L3.comic(level, [
  { img: 'boss_read', cap: 'Туалет. Последний рубеж.', lines: [['Теперь это мой туалет! Проваливай!', 400, 40, true], ['Мой сральник никто не займёт! Туалетная бумага стала слишком дорогой!', 200, 220]], title: 'БОЙ!' },
]);
L3.sceneEnd = level => L3.comic(level, [
  { img: 'comic5', sfx: 'splash', cap: 'Валера очнулся...', lines: [['Так это всё глюки?! И бумага кончилась!!!', 320, 50, true]] },
  { img: 'comic6', sfx: 'bell', cap: 'На кухне зазвонил телефон.', lines: [['Валера, это я, Вова! Я в клубе «Дикие кошки»! Срочно приезжай, спаси меня!', 380, 50], ['Держись, Вова! Еду!', 200, 150]] },
  { img: 'comic7', sfx: 'rope', cap: 'А за окном...', lines: [['Его даже наш экспериментальный яд не взял!', 180, 60], ['Вот это мужчина!', 470, 90]], title: 'КОНЕЦ УРОВНЯ 3' },
]);

// финал боя: таракан уже в унитазе, Валера запрыгивает и смывает
L3.sceneFlush = function (level) {
  const ar = level.arena;
  const v = new G.Actor('valera3', ar.player.x, L3.AG, ar.player.facing);
  ar.player = null; ar.actors = [v];
  const toilet = { x: L3.BCX, y: L3.AG, headH: 120, voice: 90 };
  level.drawScene = c => { ar.draw(c); Scene.drawDialog(c); };
  level.updateScene = dt => { ar.update(dt); FX.update(dt); G.updateBubbles(dt); };
  return function* () {
    G.say(toilet, 'Бульк... Я ещё вернусь... через канализацию...', 2.2);
    yield 2.0;
    const [, ry] = L3.bpt(0.5, 0.6), side = v.x < L3.BCX ? -1 : 1, x0 = v.x, sx = L3.BCX + side * 70;
    v.facing = -side; v.setAnim('run');
    yield* Scene.tween(Math.abs(sx - x0) / 160 + 0.05, k => { v.x = U.lerp(x0, sx, k); });
    v.setAnim('jump'); Sound.play('jump');
    yield* Scene.tween(0.6, k => { v.x = U.lerp(sx, L3.BCX + side * 12, k); v.y = U.lerp(L3.AG, ry + 4, k) - Math.sin(k * Math.PI) * 50; });
    v.setAnim('stand'); v.facing = 1;
    yield 0.3;
    Sound.play('lever'); G.shake(3, 0.3);
    yield 0.25;
    Sound.play('splash'); Sound.play('steam');
    for (let i = 0; i < 40; i++) FX.spawn({ x: L3.BCX + U.rand(-30, 30), y: ry, vx: U.rand(-90, 90), vy: U.rand(-200, -60), grav: 500, life: 0.9, color: U.choice(['#bfe8ff', '#ffffff', '#8cc8f0']), size: 3 });
    G.say(v, 'СМЫВАЮ!!!', 1.4, { shout: true });
    yield 1.5;
    const x2 = v.x;
    v.setAnim('jump');
    yield* Scene.tween(0.55, k => { v.x = U.lerp(x2, L3.BCX - 90, k); v.y = U.lerp(ry + 4, L3.AG, k) - Math.sin(k * Math.PI) * 30; });
    v.setAnim('angry'); v.facing = 1;
    yield 0.4;
    G.say(v, 'Мой туалет — мои правила.', 1.8);
    yield 2.0;
  };
};

// ---------- контроллер уровня ----------
L3.Level = class {
  constructor() {
    this.id = 3;
    this.stats = { time: 0, dmg: 0, kills: 0, deflect: 0, secrets: 0, food: 0, deaths: 0 };
    this.score = 0; this.mode = null;
  }
  start(opts = {}) {
    if (opts.boss) { this.carry3 = { ammo3: { swatter: 100, juice: 120, chalk: 20 }, weapon: 'juice' }; this.goBoss(); return; }
    this.playScene(L3.sceneIntro(this), () => this.startRun());
  }
  playScene(gen, next) { this.mode = 'scene'; Scene.run(gen, next); }
  startRun() { this.mode = 'run'; FX.list = []; G.bubbles = []; this.run = new L3.Run(this); Music.play('epic'); G.say(this.run.player, 'Ну, тараканьё, держись!', 2); }
  reachToilet(run) { this.carry3 = { ammo3: Object.assign({}, run.player.ammo3), weapon: run.player.weapon }; this.goBoss(); }
  goBoss() { Music.stop(); this.playScene(L3.sceneBoss(this), () => this.startBoss()); }
  startBoss(restart) {
    this.arena = new L3.Arena(this);
    const pl = new L3.Player(40, L3.AG);
    Object.assign(pl.ammo3, this.carry3 ? this.carry3.ammo3 : {}); pl.ammo3.juice = Math.max(pl.ammo3.juice, 60); pl.ammo3.chalk = Math.max(pl.ammo3.chalk, 10);
    pl.weapon = pl.ammo3.juice > 0 ? 'juice' : 'swatter';
    this.arena.startFight(pl);
    this.mode = 'boss'; FX.list = []; G.bubbles = [];
    Music.play('epicBoss');
    if (restart) G.say(pl, 'Второй заход, усатый!', 1.5);
  }
  restartBoss() { this.startBoss(true); }
  bossDefeated() { this.playScene(L3.sceneFlush(this), () => this.playScene(L3.sceneEnd(this), () => { this.mode = 'done'; G.onLevelComplete(this); })); }
  update(dt) {
    if (this.mode === 'scene') { Scene.tick(dt); if (this.updateScene) this.updateScene(dt); }
    else if (this.mode === 'run') { this.run.update(dt); FX.update(dt); G.updateBubbles(dt); }
    else if (this.mode === 'boss') { this.arena.update(dt); FX.update(dt); G.updateBubbles(dt); }
  }
  draw(c) {
    if (this.mode === 'scene' && this.drawScene) { this.drawScene(c); if (Scene.t < 3) G.text('Esc — пропустить', 8, H - 12, { size: 8, color: 'rgba(255,255,255,0.5)' }); }
    else if (this.mode === 'run') this.run.draw(c);
    else if (this.mode === 'boss') this.arena.draw(c);
  }
  get canPause() { return this.mode === 'run' || this.mode === 'boss'; }
};
