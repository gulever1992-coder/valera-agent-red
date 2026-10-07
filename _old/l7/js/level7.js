'use strict';
// ============ УРОВЕНЬ 7: «ЗАВОДОУПРАВЛЕНИЕ» — стелс: подворотни, двор, леса, здание в разрезе ============
// Арт — Codex (tools/p7, сборка tools/build_l7.py). Кодом — логика, HUD, конусы обзора/лучи (эффекты света) и мини-игры.
const L7 = {};
G.L7 = L7;
L7.GY = 300;                       // земля снаружи
L7.FY = [600, 450, 300, 150];      // ноги на этажах 1..4 (внутри)
L7.RW = 320; L7.RH = 150; L7.RTOP = 125;   // комната: ширина, высота этажа, от пола до потолка
L7.IW = L7.RW * 6;                 // ширина здания
L7.OW = 5200;                      // ширина улицы
L7.img = {};
const fy = f => L7.FY[f - 1];
L7.fy = fy;
L7.floorOf = y => { let b = 1, d = 1e9; for (let f = 1; f <= 4; f++) { const k = Math.abs(fy(f) - y); if (k < d) { d = k; b = f; } } return b; };

// ---------- загрузка ----------
L7.ROOMS = ['reception', 'director', 'deputy', 'deputy2', 'accounting', 'archive', 'server', 'security', 'canteen', 'corridor', 'stairs', 'hall'];
L7.load = async function () {
  const names = { sky: 'sky.jpg', alley: 'alley.png', yard: 'yard.png', gr_alley: 'gr_alley.jpg', gr_yard: 'gr_yard.jpg', facade: 'facade.png', road: 'road.jpg',
    comic_van: 'comic_van.jpg', comic_gate: 'comic_gate.jpg', comic_stage: 'comic_stage.jpg', comic_shout: 'comic_shout.jpg', comic_raid: 'comic_raid.jpg', card: 'card.jpg' };
  for (const r of L7.ROOMS) names['room_' + r] = 'room_' + r + '.jpg';
  await Promise.all(Object.entries(names).map(async ([k, f]) => { try { L7.img[k] = await G.loadImage('assets/l7/' + f); } catch (e) {} }));
  for (const k of ['stas', 'maxim', 'denisch', 'deniso', 'mrx', 'leather']) { try { G.portraits[k] = await G.loadImage('assets/spr/p_' + k + '.png'); } catch (e) {} }
};

// ---------- анимации (ставятся при старте уровня: листы грузятся параллельно) ----------
const A7 = (sheet, fr, fps = 8, o = {}) => Object.assign({ fr: fr.map(i => [sheet, i]), fps }, o);
L7.has = s => !!(Spr.sheets[s] && Spr.sheets[s].img);
L7.setupAnims = function () {
  L7.addSongs();
  const sn = L7.has('v7sneak'); L7.has24 = sn && Spr.sheets.v7sneak.f && Spr.sheets.v7sneak.f.length >= 24;
  Spr.ANIM.valera7 = Object.assign({}, Spr.ANIM.valera6, {
    crouch: sn ? A7('v7sneak', [L7.has24 ? 12 : 0]) : Spr.ANIM.valera6.crouch,
    sneak: sn ? A7('v7sneak', L7.has24 ? [12, 13, 14, 13] : [0, 1, 2, 3], 6) : Spr.ANIM.valera6.crouch,
    wall: sn ? A7('v7sneak', [4]) : Spr.ANIM.valera6.stand, peek: sn ? A7('v7sneak', [5]) : Spr.ANIM.valera6.look,
    throwBone: sn ? A7('v7sneak', L7.has24 ? [18, 19] : [6], 7) : Spr.ANIM.valera6.throwB, chop: sn ? A7('v7sneak', L7.has24 ? [20, 21] : [7], 7) : Spr.ANIM.valera6.upper,
    climb: sn ? A7('v7sneak', [8, 9], 5) : Spr.ANIM.valera6.climb, tied: sn ? A7('v7sneak', [10]) : Spr.ANIM.valera6.kneel,
    shoutFist: sn ? A7('v7sneak', L7.has24 ? [22, 23] : [11], 4) : Spr.ANIM.valera6.roar, thumb: sn ? A7('v7sneak', L7.has24 ? [16, 17] : [5], 3) : Spr.ANIM.valera6.look,
  });
  const g = L7.has('guard7'), gn = g && Spr.sheets.guard7.f && Spr.sheets.guard7.f.length >= 20;
  const dn = L7.has('dog7') && Spr.sheets.dog7.f && Spr.sheets.dog7.f.length >= 16;
  Spr.ANIM.guard7 = g ? {
    walk: A7('guard7', [0, 1, 2, 3], 6), run: A7('guard7', gn ? [12, 13, 14, 15] : [0, 1, 2, 3], 11), stand: A7('guard7', [4]), look: A7('guard7', [5]), alert: A7('guard7', [6]), aim: A7('guard7', [7]),
    stagger: A7('guard7', [8]), ko: A7('guard7', [9]), tie: A7('guard7', [10]), drag: A7('guard7', gn ? [16, 17, 18, 19] : [11, 11], 6), sit: A7('guard7', [5]),
  } : { walk: A7('cmd', [1]), run: A7('cmd', [1]), stand: A7('cmd', [1]), look: A7('cmd', [4]), alert: A7('cmd', [3], 1, { flip: true }), aim: A7('cmd', [3], 1, { flip: true }), stagger: A7('cmd', [4]), ko: A7('cmd', [4]), tie: A7('cmd', [1]), drag: A7('cmd', [1]), sit: A7('cmd', [1]) };
  Spr.ANIM.dog7 = dn ? { walk: A7('dog7', [0, 1, 2, 3], 8), run: A7('dog7', [4, 5, 6, 7], 12), sniff: A7('dog7', [10, 11], 3), bark: A7('dog7', [8, 9], 5), lunge: A7('dog7', [12]), eat: A7('dog7', [13]), sit: A7('dog7', [14]), sleep: A7('dog7', [15]) }
    : { walk: A7('dog7', [0, 1, 2, 3], 7), run: A7('dog7', [4, 5], 9), sniff: A7('dog7', [6]), bark: A7('dog7', [7, 6], 5), lunge: A7('dog7', [8]), eat: A7('dog7', [9]), sit: A7('dog7', [10]), sleep: A7('dog7', [11]) };
  Spr.ANIM.leather = L7.has('leather7') ? { stand: A7('leather7', [0, 1], 2), thumb: A7('leather7', [2, 3], 3), run: A7('leather7', [4, 5, 6, 7], 11), walk: A7('leather7', [8, 9, 10, 11], 7) }
    : { stand: A7('cars7', [4]), run: A7('cars7', [5]) };
};

// ---------- музыка: тихий напряжённый стелс (main.js задаёт Music.songs позже — добавляем при старте уровня) ----------
const bar7 = s => s.trim().split(/s+/).join(' ');
L7.addSongs = function () {
Music.songs.stealth = {
  bpm: 96, loop: true, tracks: [
    { wave: 'triangle', vol: 0.16, notes: bar7(`
      D2 . . . D2 . . . D2 . . . C2 . D#2 .   D2 . . . D2 . . . D2 . . . A1 . C2 .
      D2 . . . D2 . . . D2 . . . C2 . D#2 .   F2 . . . E2 . . . D#2 . . . D2 . . .`) },
    { wave: 'square', vol: 0.03, notes: bar7(`
      - - - - A4 - - - - - - - G#4 - - -   - - - - A4 - - - - - - - F4 - - -
      - - - - A4 - - - - - - - G#4 - - -   - - - - C5 - - - A#4 - - - A4 - - -`) },
    { drum: true, vol: 0.08, notes: 'k . . . h . . . k . k . h . . .' },
  ],
};
Music.songs.alarm = {
  bpm: 170, loop: true, tracks: [
    { wave: 'square', vol: 0.06, notes: 'A5 - D5 - A5 - D5 - A5 - D5 - A5 - D5 -' },
    { wave: 'sawtooth', vol: 0.05, notes: 'D2 D2 D3 D2 D2 D3 D2 D3 D2 D2 D3 D2 D2 D3 D2 D3' },
    { drum: true, vol: 0.14, notes: 'k . h k s . h . k k h k s . s s' },
  ],
};
};

// ---------- Валера-разведчик ----------
L7.Player = class extends Game.Player {
  constructor(x, y) {
    super(x, y);
    this.animSet = 'valera7'; this.customAttack = true; this.ammo3 = {}; this.portraitKey = 'valera6';
    this.crawlSpeed = 62; this.bones = 0; this.hidden = null; this.chopT = 0; this.boneT = 0; this.noiseT = 0;
  }
  get box() { return this.crouch ? { x: this.x - 11, y: this.y - 44, w: 22, h: 43 } : { x: this.x - 10, y: this.y - 70, w: 20, h: 69 }; }
  hurt(dmg, fromX, world) { if (this.hidden) return false; return super.hurt(dmg, fromX, world); }
  update(dt, world) {
    const run = world.run, I = G.Input;
    if (this.chopT > 0) this.chopT -= dt;
    if (this.boneT > 0) this.boneT -= dt;
    if (this.hidden) {   // в укрытии: стоим, выход — вверх/вниз/прыжок
      this.animT += dt; this.vx = 0; this.vy = 0; this.crouch = false;
      if (this.controls && this.hidden.t > 0.25 && (I.pressed('up') || I.pressed('down') || I.pressed('jump') || I.pressed('left') || I.pressed('right'))) { run.unhide(); }
      else this.hidden.t += dt;
      this.setAnim(this.hidden.kind === 'bush' || this.hidden.kind === 'ficus' ? 'crouch' : 'wall');
      return;
    }
    const wasGround = this.onGround, vy0 = this.vy;
    super.update(dt, world);
    if (this.dead) return;
    // шум: идти в полный рост — слышно, ползком — тихо; приземление — громко
    if (this.onGround && !wasGround && vy0 > 300) run.noise(this.x, this.y, 150, 'land');
    if (this.onGround && !this.crouch && Math.abs(this.vx) > 60) { this.noiseT -= dt; if (this.noiseT <= 0) { this.noiseT = 0.25; run.noise(this.x, this.y, 95, 'step'); } }
  }
  attackUpdate(dt, world, ctl, I) {
    const run = world.run;
    if (ctl && I.pressed('punch') && this.chopT <= 0 && !this.climb) {
      if (run.tryTakedown(this)) { this.chopT = 0.45; this.atk = null; Sound.play('punch'); return; }
      this.atk = { t: 0, dur: 0.26, kind: 'punch', side: (this.combo = (this.combo + 1) % 2), hit: new Set(), low: this.crouch };
      Sound.play('punch');
    }
    if (this.atk) {
      const a = this.atk; a.t += dt;
      if (a.t > 0.06 && a.t < 0.16) world.playerAttack({ x: this.x + (this.facing > 0 ? 4 : -38), y: this.y - (a.low ? 34 : 52), w: 34, h: 26 }, 1, a, this);
      if (a.t >= a.dur) this.atk = null;
    }
    if (ctl && I.pressed('throw') && this.boneT <= 0 && !this.climb) {
      if (this.bones > 0) { this.bones--; this.boneT = 0.4; run.throwBone(this); Sound.play('throw'); }
      else { FX.popText(this.x, this.y - 90, 'НЕТ КОСТЕЙ', '#ff6a4a'); Sound.play('warn'); }
    }
  }
  choosePose(dt) {
    if (this.chopT > 0) return this.setAnim('chop');
    if (this.boneT > 0.15) return this.setAnim('throwBone');
    if (!this.forcePose && this.crouch && !this.atk) return this.setAnim(Math.abs(this.vx) > 5 ? 'sneak' : 'crouch');
    super.choosePose(dt);
  }
  draw(c, camX, camY) {
    if (this.hidden && (this.hidden.kind === 'wardrobe' || this.hidden.kind === 'curtain' || this.hidden.kind === 'stall')) return;   // внутри — не видно
    if (this.hidden) { c.save(); c.globalAlpha = 0.55; Spr.drawAnim(c, this.animSet, this.anim, this.animT, this.x - camX, this.y - camY, this.facing); c.restore(); return; }
    super.draw(c, camX, camY);
  }
};

// ---------- обзор: конус взгляда вдоль пола ----------
// возвращает скорость роста «заметности» (0 — не видит)
L7.lookRate = function (run, ex, ey, facing, range, pl, o = {}) {
  if (pl.dead || run.caught) return 0;
  if (Math.abs(pl.y - ey) > 34) return 0;            // другой этаж / ярус лесов
  const dx = pl.x - ex, d = Math.abs(dx);
  if (pl.hidden && !pl.hidden.blown) return 0;
  if (d > range || (d > 26 && Math.sign(dx) !== facing)) return 0;   // сзади не видит (вплотную — чует)
  if (run.wallBetween(ex, pl.x, ey)) return 0;
  let r = range;
  if (pl.crouch) { if (run.coverAt(pl.x, pl.y)) return 0; r *= 0.72; }
  if (d > r) return 0;
  return (o.base || 0.9) + (1 - d / r) * (o.near || 1.8);
};

// ---------- спецназовец ----------
let GID = 0;
L7.Guard = class {
  constructor(o) {
    this.id = o.id || ('g' + (++GID)); this.x = o.x; this.y = o.y; this.x1 = o.x1 != null ? o.x1 : o.x - 120; this.x2 = o.x2 != null ? o.x2 : o.x + 120;
    this.facing = o.facing || 1; this.kind = o.kind || 'patrol'; this.state = this.kind === 'sleep' ? 'sleep' : this.kind === 'post' ? 'post' : 'walk';
    this.t = 0; this.stT = U.rand(2, 4); this.anim = 'walk'; this.animT = Math.random(); this.range = o.range || 165; this.sp = o.sp || 36;
    this.see = 0; this.mark = 0; this.turnT = 0; this.home = this.x; this.homeF = this.facing;
  }
  get alive() { return this.state !== 'ko'; }
  sees(run, pl) {
    if (!this.alive || this.state === 'sleep' || this.state === 'stagger') return 0;
    return L7.lookRate(run, this.x, this.y, this.facing, this.range, pl, { base: 0.8, near: 1.6 });
  }
  hear(x, r) {   // шум: обернуться
    if (!this.alive || this.state === 'stagger') return;
    if (this.state === 'sleep') { if (Math.abs(x - this.x) < r * 0.8) { this.state = 'look'; this.stT = 2.5; this.facing = Math.sign(x - this.x) || 1; this.mark = 1.2; G.say(this, U.choice(['А? Кто тут?', 'Хрр... Что?!']), 1.2); } return; }
    if (Math.sign(x - this.x) !== this.facing) { this.state = 'look'; this.stT = 2.2; this.turnT = 0.35; this.lookTo = Math.sign(x - this.x) || 1; this.mark = 1; if (Math.random() < 0.5) G.say(this, U.choice(['Что за шум?', 'Кто здесь?', 'Хм?']), 1.1); }
  }
  ko() { this.state = 'stagger'; this.stT = 0.5; this.see = 0; }
  update(dt, run) {
    this.t += dt; this.animT += dt; if (this.mark > 0) this.mark -= dt;
    switch (this.state) {
      case 'walk': {
        this.anim = 'walk';
        const tx = this.facing > 0 ? this.x2 : this.x1;
        this.x = U.approach(this.x, tx, this.sp * dt);
        if (Math.abs(this.x - tx) < 1) { this.state = 'pause'; this.stT = U.rand(1.4, 2.2); }
        break;
      }
      case 'pause':   // остановка у края маршрута: оглядывается (предупреждение), потом разворот
        this.stT -= dt; this.anim = this.stT < 0.8 ? 'look' : 'stand';
        if (this.stT <= 0) { this.facing = -this.facing; this.state = 'walk'; }
        break;
      case 'post':   // стоит на посту, периодически оборачивается (за 0.9 с — «смотрит через плечо»)
        this.stT -= dt; this.anim = this.stT < 0.9 ? 'look' : 'stand';
        if (this.stT <= 0) { this.facing = -this.facing; this.stT = U.rand(3, 4.5); }
        break;
      case 'look':   // услышал: разворачивается и смотрит
        if (this.turnT > 0) { this.turnT -= dt; this.anim = 'look'; if (this.turnT <= 0) this.facing = this.lookTo || this.facing; }
        else { this.anim = 'alert'; this.stT -= dt; if (this.stT <= 0) { this.state = this.kind === 'post' ? 'post' : this.kind === 'sleep' ? 'post' : 'walk'; this.stT = 2; } }
        break;
      case 'sleep': this.anim = 'sit'; if (Math.random() < dt * 0.4) FX.popText(this.x + 10, this.y - 90, 'Z', '#c8d8ff'); break;
      case 'stagger': this.anim = 'stagger'; this.stT -= dt; if (this.stT <= 0) { this.state = 'ko'; Sound.play('land'); FX.dust(this.x, this.y, 6); } break;
      case 'ko': this.anim = 'ko'; break;
      case 'catch': this.anim = 'run'; break;
    }
  }
  draw(c, cx, cy) {
    Spr.drawAnim(c, 'guard7', this.anim, this.animT, this.x - cx, this.y - cy, this.facing);
    if (this.state === 'ko' && (G.t * 2 | 0) % 2) G.text('Z', this.x - cx + 18, this.y - cy - 30, { size: 8, color: '#c8d8ff' });
    if (this.see > 0.05 || this.mark > 0) { const s = this.see > 0.6 ? '!' : '?'; G.text(s, this.x - cx, this.y - cy - 100, { align: 'center', size: 16, color: this.see > 0.6 ? '#ff4030' : '#ffd84a', outline: true }); }
  }
};

// ---------- собака ----------
L7.Dog = class {
  constructor(o) {
    this.id = o.id || ('d' + (++GID)); this.x = o.x; this.y = o.y; this.x1 = o.x1 != null ? o.x1 : o.x - 140; this.x2 = o.x2 != null ? o.x2 : o.x + 140;
    this.stray = !!o.stray; this.facing = o.facing || 1; this.state = 'walk'; this.stT = U.rand(2, 4); this.anim = 'walk'; this.animT = Math.random();
    this.hp = 3; this.range = o.range || 130; this.see = 0; this.mark = 0; this.bone = null; this.inv = 0; this.dead = false; this.biteT = 0; this.vx = 0;
  }
  get alive() { return !this.dead && this.state !== 'flee'; }
  get box() { return { x: this.x - 22, y: this.y - 36, w: 44, h: 34 }; }
  sees(run, pl) {
    if (this.stray || !this.alive || this.state === 'eat' || this.state === 'toBone' || this.state === 'sleep') return 0;
    let r = L7.lookRate(run, this.x, this.y, this.facing, this.range, pl, { base: 1.1, near: 2.2 });
    if (!r && !pl.hidden && !pl.crouch && Math.abs(pl.y - this.y) < 30 && Math.abs(pl.x - this.x) < 46) r = 1.4;   // нюх: вплотную в полный рост
    return r;
  }
  hear(x, r) { if (this.stray || !this.alive || this.state === 'eat' || this.state === 'toBone') return; if (Math.sign(x - this.x) !== this.facing) { this.facing = Math.sign(x - this.x) || 1; this.state = 'sniff'; this.stT = 1.4; this.mark = 0.8; Sound.play('bark'); } }
  hit(dmg, dir) {
    if (this.inv > 0 || !this.alive) return false;
    this.hp -= dmg; this.inv = 0.3; this.x += dir * 18; this.state = 'hurt'; this.stT = 0.35; Sound.play('squeak');
    if (this.hp <= 0) { this.state = 'flee'; this.facing = dir; Sound.play('squeak'); return true; }
    return false;
  }
  smellBone(run) {
    if (this.bone || this.state === 'eat') return;
    let best = null;
    for (const b of run.bones) if (b.landed && !b.taken && Math.abs(b.y - this.y) < 30 && b.x > this.x1 - 90 && b.x < this.x2 + 90 && (!best || Math.abs(b.x - this.x) < Math.abs(best.x - this.x))) best = b;
    if (best) { best.taken = this; this.bone = best; this.state = 'toBone'; this.see = 0; FX.popText(this.x, this.y - 50, '!', '#8cf08c', 16); Sound.play('bark'); }
  }
  update(dt, run, pl) {
    this.animT += dt; if (this.inv > 0) this.inv -= dt; if (this.mark > 0) this.mark -= dt; if (this.biteT > 0) this.biteT -= dt;
    if (this.state !== 'flee' && this.state !== 'hurt') this.smellBone(run);
    switch (this.state) {
      case 'walk': {
        if (this.stray && !pl.dead && !pl.hidden && Math.abs(pl.x - this.x) < 230 && Math.abs(pl.y - this.y) < 40) { this.state = 'chase'; Sound.play('bark'); break; }
        this.anim = 'walk'; const tx = this.facing > 0 ? this.x2 : this.x1;
        this.x = U.approach(this.x, tx, 42 * dt);
        if (Math.abs(this.x - tx) < 1) { this.state = 'sniff'; this.stT = U.rand(1.2, 2.2); }
        break;
      }
      case 'sniff': this.anim = this.stT > 0.5 ? 'sniff' : 'sit'; this.stT -= dt; if (this.stT <= 0) { this.state = 'walk'; if ((this.facing > 0 && this.x >= this.x2 - 2) || (this.facing < 0 && this.x <= this.x1 + 2)) this.facing = -this.facing; } break;
      case 'toBone': {
        const b = this.bone; if (!b || b.gone) { this.bone = null; this.state = 'walk'; break; }
        this.anim = 'run'; this.facing = Math.sign(b.x - this.x) || this.facing; this.x = U.approach(this.x, b.x, 150 * dt);
        if (Math.abs(this.x - b.x) < 4) { this.state = 'eat'; this.stT = 7; b.gone = true; }
        break;
      }
      case 'eat': this.anim = 'eat'; this.stT -= dt; if (Math.random() < dt * 0.8) FX.popText(this.x + this.facing * 16, this.y - 30, 'ХРУМ', '#f4f0e4'); if (this.stT <= 0) { this.bone = null; this.state = 'walk'; } break;
      case 'chase': {   // бродячая: кидается на Валеру
        if (pl.dead || pl.hidden) { this.state = 'walk'; break; }
        this.facing = Math.sign(pl.x - this.x) || 1; const d = Math.abs(pl.x - this.x);
        if (d > 44) { this.anim = 'run'; this.x += this.facing * 150 * dt; }
        else if (this.biteT <= 0) { this.state = 'lunge'; this.stT = 0.4; this.anim = 'lunge'; this.vx = this.facing * 160; }
        else { this.anim = 'bark'; this.x -= this.facing * 40 * dt; }
        if (d > 360) this.state = 'walk';
        break;
      }
      case 'lunge': this.stT -= dt; this.x += this.vx * dt; this.vx *= 0.92; this.anim = 'lunge';
        if (U.overlap(this.box, pl.box) && this.biteT <= 0) { this.biteT = 1.1; pl.hurt(8, this.x, run.world); }
        if (this.stT <= 0) { this.state = 'chase'; this.biteT = Math.max(this.biteT, 0.6); }
        break;
      case 'hurt': this.anim = 'sit'; this.stT -= dt; if (this.stT <= 0) this.state = this.stray ? 'chase' : 'walk'; break;
      case 'flee': this.anim = 'run'; this.x += this.facing * 200 * dt; if (Math.abs(this.x - pl.x) > 700) this.dead = true; break;
    }
  }
  draw(c, cx, cy) {
    const tint = this.stray ? 'sepia(0.5) brightness(0.9)' : null;
    if (L7.has('dog7')) { if (tint) c.filter = tint; Spr.drawAnim(c, 'dog7', this.anim, this.animT, this.x - cx, this.y - cy, this.facing, { flash: this.inv > 0.15 ? '#fff' : null }); c.filter = 'none'; }
    else { Art.R(c, this.x - cx - 20, this.y - cy - 30, 40, 22, '#2a1c14'); Art.R(c, this.x - cx + this.facing * 16 - 6, this.y - cy - 38, 12, 12, '#2a1c14'); }   // временно, пока нет листа dog7
    if (!this.stray && (this.see > 0.05 || this.mark > 0)) G.text(this.see > 0.6 ? '!' : '?', this.x - cx, this.y - cy - 56, { align: 'center', size: 16, color: this.see > 0.6 ? '#ff4030' : '#ffd84a', outline: true });
  }
};

// ---------- камера наблюдения ----------
L7.Cam = class {
  constructor(o) { this.x = o.x; this.y = o.y; this.floorY = o.floorY; this.a0 = o.a0; this.a1 = o.a1; this.per = o.per || 6; this.range = o.range || 230; this.half = o.half || 0.24; this.group = o.group; this.t = o.ph || 0; this.see = 0; this.a = o.a0; }
  off(run) { return this.group && run.flags[this.group]; }
  update(dt) { this.t += dt; const k = (Math.sin(this.t / this.per * Math.PI * 2) + 1) / 2; this.a = U.lerp(this.a0, this.a1, k); }
  sees(run, pl) {
    if (this.off(run) || pl.dead || run.caught) return 0;
    if (pl.hidden && !pl.hidden.blown) return 0;
    if (Math.abs(pl.y - this.floorY) > 34) return 0;
    if (pl.crouch && run.coverAt(pl.x, pl.y)) return 0;
    for (const py of [pl.y - 8, pl.y - (pl.crouch ? 30 : 50)]) {
      const dx = pl.x - this.x, dy = py - this.y, d = Math.hypot(dx, dy);
      if (d > this.range) continue;
      let da = Math.atan2(dy, dx) - this.a; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
      if (Math.abs(da) < this.half) return 2.4;
    }
    return 0;
  }
  draw(c, cx, cy) {
    const x = this.x - cx, y = this.y - cy, off = this.off(L7.run);
    if (!off) {   // конус обзора (свет)
      const g = c.createRadialGradient(x, y, 4, x, y, this.range);
      const col = this.see > 0.05 ? '255,60,40' : '255,230,120';
      g.addColorStop(0, `rgba(${col},0.32)`); g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g; c.beginPath(); c.moveTo(x, y); c.arc(x, y, this.range, this.a - this.half, this.a + this.half); c.closePath(); c.fill();
    }
    if (L7.has('props7in')) Spr.drawC(c, 'props7in', 4, x, y + 4, 0, 1);
    else Art.R(c, x - 8, y - 4, 16, 9, '#333');
    if (!off && (G.t * 2 | 0) % 2) Art.R(c, x + (Math.cos(this.a) > 0 ? 5 : -7), y, 2, 2, '#ff3020');
  }
};

// ---------- лазер ----------
L7.Laser = class {
  constructor(o) { Object.assign(this, { blink: null, ph: 0, group: null }, o); this.t = this.ph; }
  on(run) { if (this.group && run.flags[this.group]) return false; if (!this.blink) return true; return (this.t % (this.blink[0] + this.blink[1])) < this.blink[0]; }
  update(dt) { this.t += dt; }
  hits(run, pl) {
    if (!this.on(run) || pl.dead || run.caught || pl.hidden) return false;
    const b = pl.box;
    if (this.horiz) return b.x < this.x1 && b.x + b.w > this.x0 && b.y < this.y && b.y + b.h > this.y;
    return b.x < this.x + 2 && b.x + b.w > this.x - 2 && b.y < this.y1 && b.y + b.h > this.y0;
  }
  warn(run) { if (!this.blink || !this.on(run)) return false; return false; }
  draw(c, cx, cy, run) {
    const on = this.on(run);
    const em = (x, y, rot) => { if (L7.has('props7in')) Spr.drawC(c, 'props7in', 5, x, y, rot, 0.7); else Art.R(c, x - 5, y - 4, 10, 8, '#555'); };
    if (this.horiz) {
      if (on) { const fl = 0.7 + Math.sin(G.t * 40) * 0.3; c.fillStyle = `rgba(255,30,30,${0.35 * fl})`; c.fillRect(this.x0 - cx, this.y - cy - 2, this.x1 - this.x0, 5); c.fillStyle = '#ff5050'; c.fillRect(this.x0 - cx, this.y - cy, this.x1 - this.x0, 1); }
      em(this.x0 - cx, this.y - cy, Math.PI / 2); em(this.x1 - cx, this.y - cy, -Math.PI / 2);
    } else {
      if (on) { const fl = 0.7 + Math.sin(G.t * 40) * 0.3; c.fillStyle = `rgba(255,30,30,${0.35 * fl})`; c.fillRect(this.x - cx - 2, this.y0 - cy, 5, this.y1 - this.y0); c.fillStyle = '#ff5050'; c.fillRect(this.x - cx, this.y0 - cy, 1, this.y1 - this.y0); }
      else if (this.blink && !(this.group && run.flags[this.group])) { c.fillStyle = 'rgba(255,60,60,0.12)'; c.fillRect(this.x - cx, this.y0 - cy, 1, this.y1 - this.y0); }   // гаснет ненадолго — едва видно
      em(this.x - cx, this.y0 - cy + 4, Math.PI); em(this.x - cx, this.y1 - cy - 4, 0);
    }
  }
};

// ---------- брошенная кость ----------
L7.Bone = class {
  constructor(x, y, dir) { this.x = x; this.y = y; this.vx = dir * 240; this.vy = -250; this.rot = 0; this.landed = false; this.taken = null; this.gone = false; this.life = 14; }
  update(dt, run) {
    this.life -= dt;
    if (!this.landed) {
      const py = this.y; this.vy += 900 * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.rot += dt * 12;
      const g = run.world.groundAt(this.x, py, this.y, 2);
      if (g) { this.y = g.y; this.landed = true; this.rot = 0; Sound.play('clank'); FX.dust(this.x, this.y, 3); run.noise(this.x, this.y, 60, 'bone'); }
      if (run.wallBetween(this.x - this.vx * dt, this.x, this.y)) this.vx = -this.vx * 0.4;
    }
    if (this.life <= 0 && !this.taken) this.gone = true;
  }
  draw(c, cx, cy) { if (L7.has('props7out')) Spr.drawC(c, 'props7out', 8, this.x - cx, this.y - cy - 4, this.rot, 0.9); else Art.R(c, this.x - cx - 5, this.y - cy - 4, 10, 3, '#f4f0e4'); }
};
