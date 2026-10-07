'use strict';
// ============ УРОВЕНЬ 7: «ЗАВОДОУПРАВЛЕНИЕ» — стелс под дождём: парковка → стены здания → двор → коридоры ============
// Арт — Google Flow (art_src/l7 → py tools/build_l7.py). Кодом — логика, HUD, конусы обзора/лучи (свет), дождь (частицы), мини-игры.
const L7 = {};
G.L7 = L7;
L7.GY = 300;                    // земля
L7.img = {};
L7.has = s => !!(Spr.sheets[s] && Spr.sheets[s].img);

// ---------- загрузка ----------
L7.load = async function () {
  const names = { plaza: 'plaza.jpg', parking: 'parking.jpg', wall1: 'wall1.jpg', wall1b: 'wall1b.jpg', yard: 'yard.jpg', sewer: 'sewer.jpg', corr: 'corr.jpg', corr2: 'corr2.jpg',
    hall: 'hall.jpg', van_in: 'van_in.jpg', road: 'road.jpg', mrx_box: 'mrx_box.jpg' };
  await Promise.all(Object.entries(names).map(async ([k, f]) => { try { L7.img[k] = await G.loadImage('assets/l7/' + f); } catch (e) {} }));
  try { L7.img.card = await G.loadImage('assets/l7_card.jpg'); } catch (e) {}
  for (const k of ['stas', 'maxim', 'deniso', 'denisch', 'leather', 'biker7', 'cmd7', 'cmdr7', 'mrx']) { try { G.portraits[k] = await G.loadImage('assets/spr/p_' + k + '.png'); } catch (e) {} }
};

// ---------- анимации ----------
const A7 = (sheet, fr, fps = 8, o = {}) => Object.assign({ fr: fr.map(i => [sheet, i]), fps }, o);
const r7 = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
L7.setupAnims = function () {
  L7.addSongs();
  Spr.ANIM.valera7 = Object.assign({}, Spr.ANIM.valera6, {
    crouch: A7('v7a', [0]), sneak: A7('v7a', [0, 1, 2, 3, 4], 7), wall: A7('v7a', [5]), scared: A7('v7a', [7]), handsUp: A7('v7a', [8]), crawl: A7('v7a', [10]),
    peek: A7('v7b', [21]), chop: A7('v7b', [8]), throwN: A7('v7b', [9, 10], 8), climb: A7('v7b', [0, 1, 2, 3], 6), hang: A7('v7b', [4, 5], 3),
    thumb: A7('v7b', [6, 7], 2), tied: A7('v7b', [11]), sit: A7('v7b', [12]), sitCross: A7('v7b', [13]), shoutFist: A7('v7b', [14, 15], 4), sigh: A7('v7b', [16]),
    duckRun: A7('v7b', [17, 18, 19, 20], 11), dazed: A7('v7b', [16]), look: A7('v7a', [18]),
  });
  Spr.ANIM.guard7 = {
    walk: A7('g7', r7(0, 7), 8), drag: A7('g7', r7(0, 7), 6), stand: A7('g7', [8]), look: A7('g7', [9]), alert: A7('g7', [10]), point: A7('g7', [11]), run: A7('g7', r7(12, 15), 11),
    tie: A7('g7', [16, 17], 3), stagger: A7('g7', [18]), ko: A7('g7', [19]), sit: A7('g7', [20]), aim: A7('g7', [21]),
  };
  Spr.ANIM.dog7 = { walk: A7('dog7b', [0, 1, 2, 3], 8), run: A7('dog7b', [5, 6, 7, 11], 12), sniff: A7('dog7b', [4, 8], 3), bark: A7('dog7b', [9, 10], 5), lunge: A7('dog7b', [10]),
    sit: A7('dog7b', [13]), eat: A7('dog7b', [14]), sleep: A7('dog7b', [15]) };
  const den = s => ({ stand: A7(s, [0, 1], 2), talk: A7(s, [2, 3, 4, 5], 4), fist: A7(s, [6]), bow: A7(s, [7]), rub: A7(s, [7]), walk: A7(s, r7(8, 13), 8), run: A7(s, r7(8, 13), 13), point: A7(s, [14]), scared: A7(s, [15]) });
  Spr.ANIM.deniso = den('deno7'); Spr.ANIM.denisch = den('dench7');
  for (let t = 0; t < 3; t++) Spr.ANIM['guest' + t] = { stand: A7('crowd7', [4 * t]), chat: A7('crowd7', [4 * t, 4 * t + 1], 1.5), clap: A7('crowd7', [4 * t + 2, 4 * t], 6), shock: A7('crowd7', [4 * t + 3]), walk: A7('crowd7', [4 * t, 4 * t + 1], 4), run: A7('crowd7', [4 * t + 3], 1) };
  Spr.ANIM.photo7 = { stand: A7('press7', [0]), shoot: A7('press7', [1, 2, 3, 1], 4), walk: A7('press7', [12, 13], 5), run: A7('press7', [12, 13], 9), shock: A7('press7', [0]) };
  Spr.ANIM.cam7 = { stand: A7('press7', [4]), film: A7('press7', [5, 6], 2), walk: A7('press7', [7, 4], 4), run: A7('press7', [14, 15], 8), shock: A7('press7', [14]) };
  Spr.ANIM.rep7 = { stand: A7('press7', [8]), talk: A7('press7', [9, 10], 3), point: A7('press7', [11]), walk: A7('press7', [8, 9], 3), run: A7('press7', [11], 1), shock: A7('press7', [11]) };
  Spr.ANIM.stas7 = { walk: A7('stas7', r7(0, 9), 10), stand: A7('stas7', [10]), talk: A7('stas7', [11, 12], 3), laugh: A7('stas7', [13, 14], 4), point: A7('stas7', [15, 16, 17], 3),
    sit: A7('stas7', [18]), sitTalk: A7('stas7', [18, 19, 20, 21], 3), wave: A7('stas7', [22, 23], 4), shrug: A7('stas7', [24, 25], 2) };
  Spr.ANIM.max7 = { walk: A7('max7', r7(0, 7), 9), wave: A7('max7', [8, 9], 4), shrug: A7('max7', [10, 11], 2), stand: A7('maxt7', [0]), talk: A7('maxt7', [6, 7], 3), laugh: A7('maxt7', [11, 12], 4),
    point: A7('maxt7', [15]), cross: A7('maxt7', [18, 19], 1), sit: A7('maxt7', [20]), sitTalk: A7('maxt7', [20, 21, 22, 23], 3) };
  const lea = L7.has('lea7');
  Spr.ANIM.leather7 = { stand: A7('leap7', [20, 21, 22], 2), disgust: A7('leap7', [16, 17, 18, 19], 4), mount: A7('leap7', [0, 1, 2, 3], 6, { once: true }), seat: A7('leap7', [4, 5, 6, 7], 3),
    lean: A7('leap7', [8, 9, 10, 11], 6), waveSeat: A7('leap7', [12, 13, 14, 15], 6),
    thumb: lea ? A7('lea7', [0, 1], 2) : A7('leap7', [20]), look: lea ? A7('lea7', [2, 3], 2) : A7('leap7', [16]), wave: lea ? A7('lea7', [4, 5, 6, 7], 6) : A7('leap7', [12, 13], 4),
    run: lea ? A7('lea7', r7(8, 15), 13) : A7('leap7', [20, 21], 8), walk: lea ? A7('lea7', r7(16, 21), 8) : A7('leap7', [20, 21], 4), push: lea ? A7('lea7', [22, 23], 6) : A7('leap7', [16]) };
  Spr.ANIM.biker7 = { stand: A7('bik7', [8, 9], 2), cross: A7('bik7', [10, 11], 2), walk: A7('bik7', r7(14, 19), 8) };
};

// ---------- мотоцикл/фургон: кузов без колёс + колёса крутятся кодом-кадрами ----------
// q = { set: 'solo'|'duo'|'empty', x, y (земля), pose, mv }
L7.drawBike = function (c, q, t, cx = 0) {
  const sheet = q.set === 'duo' ? 'duo7' : q.set === 'solo' ? 'bm7' : 'moto7';
  const poses = { solo: { idle: [0], rev: [1], beckon: [3], frown: [4], point: [5], laugh: [6], talk: [7, 4], ride: [8, 9, 10, 11] },
    duo: { idle: [0, 1], ride: [4, 5, 6], wave: [7, 10] }, empty: { idle: [8], ride: [8] } }[q.set];
  const seq = poses[q.pose] || poses.idle || [0];
  const fi = seq[Math.floor(t * (q.mv ? 8 : 3)) % seq.length];
  const f = Spr.frame(sheet, fi); if (!f) return;
  const fw = f[2] / 2, fh = f[3] / 2, ax = f[4] / 2;
  const x = q.x - cx, gy = q.y, jig = q.mv ? (Math.floor(t * 18) % 2) : 0;
  // колёса: доли ширины кадра (замерено по biker_moto_0: задн. 0.167, перед. 0.833, центр по высоте 0.9)
  const wr = q.set === 'empty' ? 16.5 : 18 * (q.set === 'duo' ? fw / 100 : fw / 92.5);
  const wy = gy - wr, by = wy + (q.set === 'empty' ? 0 : fh * 0.1 + wr * 0.0);
  const ph = q.mv ? Math.floor(t * 20) % 4 : 0, ws = wr / 16.5;
  const left = x - ax;
  const rx = left + fw * 0.167, fx = left + fw * 0.833;
  Spr.drawC(c, 'moto7', 9 + ph, rx, wy, 0, ws); Spr.drawC(c, 'moto7', 13 + ph, fx, wy, 0, ws);
  Spr.draw(c, sheet, fi, x, by - jig + fh * 0.0, 1);
  if (q.mv && L7.has('van7')) Spr.drawC(c, 'van7', 7 + Math.floor(t * 10) % 3, rx - 22 - (t * 30 % 10), wy + 4, 0, 0.8);
};
// фургон Стаса: кадры van7 0 закрыт, 1 дверь открыта, 2 со Стасом и Максом; 3-6 колесо; 7-9 выхлоп
L7.drawVan = function (c, q, t, cx = 0) {
  const fi = q.door ? 1 : q.crew ? 2 : 0;
  const f = Spr.frame('van7', fi); if (!f) return;
  const fw = f[2] / 2, fh = f[3] / 2, ax = f[4] / 2;
  const x = q.x - cx, gy = q.y, wr = 15.5, wy = gy - wr, jig = q.mv ? (Math.floor(t * 14) % 2) : 0;
  const ph = q.mv ? Math.floor(t * 18) % 4 : 0, left = x - ax;
  Spr.draw(c, 'van7', fi, x, wy + wr * 0.35 - jig, 1);
  Spr.drawC(c, 'van7', 3 + ph, left + fw * 0.2, wy, 0, 1); Spr.drawC(c, 'van7', 3 + ph, left + fw * 0.82, wy, 0, 1);
  if (q.mv || q.idle) Spr.drawC(c, 'van7', 7 + Math.floor(t * 8) % 3, left - 8 - (t * 40 % 12), gy - 8, 0, 0.9);
};

// ---------- дождь (частицы-штрихи, как свет — эффект, а не текстура) ----------
L7.Rain = class {
  constructor(n = 140, k = 1) { this.k = k; this.d = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 380 + Math.random() * 200, l: 6 + Math.random() * 8 })); this.spl = []; }
  update(dt) {
    for (const p of this.d) { p.y += p.v * dt; p.x -= p.v * 0.18 * dt; if (p.y > L7.GY + 40 + Math.random() * 30) { if (Math.random() < 0.3) this.spl.push({ x: p.x, y: p.y, t: 0 }); p.y = -10 - Math.random() * 40; p.x = Math.random() * (W + 60); } }
    for (const s of this.spl) s.t += dt; this.spl = this.spl.filter(s => s.t < 0.18);
  }
  draw(c, a = 1) {
    c.save(); c.globalAlpha = 0.33 * a * this.k; c.strokeStyle = '#b8c8e0'; c.lineWidth = 1; c.beginPath();
    for (const p of this.d) { c.moveTo(p.x, p.y); c.lineTo(p.x + p.l * 0.18, p.y - p.l); }
    c.stroke(); c.globalAlpha = 0.45 * a * this.k; c.fillStyle = '#c8d8f0';
    for (const s of this.spl) { const r = 1 + s.t * 14; c.fillRect(s.x - r, s.y, r * 2, 1); }
    c.restore();
  }
};

// ---------- музыка ----------
const bar7 = s => s.trim().split(/\s+/).join(' ');
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
    this.crawlSpeed = 62; this.bones = 0; this.nuts = 5; this.hidden = null; this.chopT = 0; this.throwT7 = 0; this.noiseT = 0;
  }
  hurt(dmg, fromX, world) { if (this.hidden) return false; return super.hurt(dmg, fromX, world); }
  update(dt, world) {
    const run = world.run, I = G.Input;
    if (this.chopT > 0) this.chopT -= dt;
    if (this.throwT7 > 0) this.throwT7 -= dt;
    if (this.hidden) {   // в укрытии: выход — любой стрелкой/прыжком
      this.animT += dt; this.vx = 0; this.vy = 0; this.crouch = false;
      if (this.controls && this.hidden.t > 0.25 && (I.pressed('up') || I.pressed('down') || I.pressed('jump') || I.pressed('left') || I.pressed('right'))) run.unhide();
      else this.hidden.t += dt;
      this.setAnim(this.hidden.kind === 'cover' ? 'crouch' : 'wall');
      return;
    }
    const wasGround = this.onGround, vy0 = this.vy;
    super.update(dt, world);
    if (this.dead) return;
    // шум: в полный рост бегом — слышно, крадучись — тихо, приземление — громко
    if (this.onGround && !wasGround && vy0 > 320) run.noise(this.x, this.y, 140, 'land');
    if (this.onGround && !this.crouch && Math.abs(this.vx) > 60) { this.noiseT -= dt; if (this.noiseT <= 0) { this.noiseT = 0.25; run.noise(this.x, this.y, 80, 'step'); if (run.outside) FX.burst(this.x, this.y - 1, 2, { colors: ['#8fa8c8', '#c8d8f0'], speed: 40, grav: 300, life: 0.25, size: 1 }); } }
  }
  attackUpdate(dt, world, ctl, I) {
    const run = world.run;
    if (ctl && I.pressed('punch') && this.chopT <= 0 && !this.climb) {
      if (run.tryTakedown(this)) { this.chopT = 0.5; this.atk = null; Sound.play('punch'); return; }
      this.atk = { t: 0, dur: 0.26, kind: 'punch', side: (this.combo = (this.combo + 1) % 2), hit: new Set(), low: this.crouch };
      Sound.play('punch');
    }
    if (this.atk) {
      const a = this.atk; a.t += dt;
      if (a.t > 0.06 && a.t < 0.16) world.playerAttack({ x: this.x + (this.facing > 0 ? 4 : -38), y: this.y - 54, w: 34, h: 50 }, 1, a, this);   // до земли — достаёт и крыс
      if (a.t >= a.dur) this.atk = null;
    }
    if (ctl && I.pressed('throw') && this.throwT7 <= 0 && !this.climb) {
      const bone = this.bones > 0 && run.dogNear(this.x, this.y, 340);
      if (bone) { this.bones--; this.throwT7 = 0.4; run.throwItem(this, 'bone'); Sound.play('throw'); }
      else if (this.nuts > 0) { this.nuts--; this.throwT7 = 0.4; run.throwItem(this, 'nut'); Sound.play('throw'); }
      else { FX.popText(this.x, this.y - 90, 'НЕТ ГАЕК', '#ff6a4a'); Sound.play('warn'); }
    }
  }
  choosePose(dt) {
    if (this.chopT > 0) return this.setAnim('chop');
    if (this.throwT7 > 0.1) return this.setAnim('throwN');
    if (!this.forcePose && this.crouch && !this.atk) return this.setAnim(Math.abs(this.vx) > 5 ? 'sneak' : 'crouch');
    super.choosePose(dt);
  }
  draw(c, camX, camY) {
    if (this.hidden && this.hidden.kind !== 'cover') return;   // внутри будки/шкафа — не видно (дверца дрожит)
    if (this.hidden) { c.save(); c.globalAlpha = 0.6; Spr.drawAnim(c, this.animSet, this.anim, this.animT, this.x - camX, this.y - camY, this.facing); c.restore(); return; }
    super.draw(c, camX, camY);
  }
};

// ---------- обзор: конус взгляда вдоль земли; возвращает скорость роста «заметности» ----------
L7.lookRate = function (run, ex, ey, facing, range, pl, o = {}) {
  if (pl.dead || run.caught) return 0;
  if (Math.abs(pl.y - ey) > 34) return 0;            // другой ярус (карниз)
  const dx = pl.x - ex, d = Math.abs(dx);
  if (pl.hidden && !pl.hidden.blown) return 0;
  if (d > range || (d > 26 && Math.sign(dx) !== facing)) return 0;   // сзади не видит (вплотную — чует)
  if (run.wallBetween(ex, pl.x, ey)) return 0;
  if (pl.crouch && run.coverBetween(ex, pl.x, pl.y)) return 0;      // присел за машиной/ящиком
  let r = range; if (pl.crouch) r *= 0.7;
  if (d > r) return 0;
  return (o.base || 0.9) + (1 - d / r) * (o.near || 1.8);
};

// ---------- спецназовец ----------
let GID = 0;
L7.Guard = class {
  constructor(o) {
    this.id = o.id || ('g' + (++GID)); this.x = o.x; this.y = o.y || L7.GY; this.x1 = o.x1 != null ? o.x1 : o.x - 120; this.x2 = o.x2 != null ? o.x2 : o.x + 120;
    this.facing = o.facing || 1; this.kind = o.kind || 'patrol'; this.state = this.kind === 'sleep' ? 'sleep' : this.kind === 'post' ? 'post' : 'walk';
    this.stT = U.rand(2, 4); this.anim = 'walk'; this.animT = Math.random(); this.range = o.range || 170; this.sp = o.sp || 34;
    this.see = 0; this.mark = 0; this.turnT = 0; this.home = this.x; this.homeF = this.facing; this.headH = 90; this.voice = 160;
  }
  get alive() { return this.state !== 'ko'; }
  sees(run, pl) {
    if (!this.alive || this.state === 'sleep' || this.state === 'stagger') return 0;
    return L7.lookRate(run, this.x, this.y, this.facing, this.range, pl, { base: 0.8, near: 1.6 });
  }
  hear(x, r, kind) {
    if (!this.alive || this.state === 'stagger') return;
    if (this.state === 'sleep') { if (Math.abs(x - this.x) < r * 0.8) { this.state = 'look'; this.stT = 2.5; this.facing = Math.sign(x - this.x) || 1; this.mark = 1.2; G.say(this, U.choice(['А? Кто тут?', 'Хрр... Что?!']), 1.2); } return; }
    if (kind === 'alarm' || kind === 'nut') {   // идёт проверить
      this.state = 'check'; this.tx = x; this.stT = 0; this.mark = 1.2; this.facing = Math.sign(x - this.x) || this.facing;
      G.say(this, kind === 'alarm' ? U.choice(['Сигналка? Пойду гляну.', 'Чья тачка орёт?!', 'Опять кошки по машинам...']) : U.choice(['Что звякнуло?', 'Кто здесь?', 'Хм?']), 1.4);
      return;
    }
    if (Math.sign(x - this.x) !== this.facing && this.state !== 'check') { this.state = 'look'; this.stT = 2.2; this.turnT = 0.35; this.lookTo = Math.sign(x - this.x) || 1; this.mark = 1; if (Math.random() < 0.5) G.say(this, U.choice(['Что за шум?', 'Кто здесь?', 'Хм?']), 1.1); }
  }
  ko() { this.state = 'stagger'; this.stT = 0.5; this.see = 0; }
  update(dt, run) {
    this.animT += dt; if (this.mark > 0) this.mark -= dt;
    switch (this.state) {
      case 'walk': {
        this.anim = 'walk';
        const tx = this.facing > 0 ? this.x2 : this.x1;
        this.x = U.approach(this.x, tx, this.sp * dt);
        if (Math.abs(this.x - tx) < 1) { this.state = 'pause'; this.stT = U.rand(1.4, 2.2); }
        break;
      }
      case 'pause': this.stT -= dt; this.anim = this.stT < 0.8 ? 'look' : 'stand'; if (this.stT <= 0) { this.facing = -this.facing; this.state = 'walk'; } break;
      case 'post': this.stT -= dt; this.anim = this.stT < 0.9 ? 'look' : 'stand'; if (this.stT <= 0) { this.facing = -this.facing; this.stT = U.rand(3, 4.5); } break;
      case 'look':
        if (this.turnT > 0) { this.turnT -= dt; this.anim = 'look'; if (this.turnT <= 0) this.facing = this.lookTo || this.facing; }
        else { this.anim = 'alert'; this.stT -= dt; if (this.stT <= 0) { this.state = this.kind === 'patrol' ? 'walk' : 'post'; this.stT = 2; } }
        break;
      case 'check': {   // идёт к источнику шума, смотрит, возвращается
        if (this.stT <= 0) { this.anim = 'walk'; this.facing = Math.sign(this.tx - this.x) || this.facing; this.x = U.approach(this.x, this.tx, this.sp * 1.6 * dt); this.animT += dt * 0.6; if (Math.abs(this.x - this.tx) < 30) this.stT = 0.01; }
        else { this.stT += dt; this.anim = this.stT < 1.6 ? 'alert' : 'look'; if (this.stT > 3.2) { this.state = 'back'; } }
        break;
      }
      case 'back': this.anim = 'walk'; this.facing = Math.sign(this.home - this.x) || this.facing; this.x = U.approach(this.x, this.home, this.sp * dt); if (Math.abs(this.x - this.home) < 1) { this.state = this.kind === 'patrol' ? 'walk' : this.kind; this.facing = this.homeF; this.stT = 2; } break;
      case 'sleep': this.anim = 'sit'; if (Math.random() < dt * 0.4) FX.popText(this.x + 10, this.y - 90, 'Z', '#c8d8ff'); break;
      case 'stagger': this.anim = 'stagger'; this.stT -= dt; if (this.stT <= 0) { this.state = 'ko'; Sound.play('land'); FX.dust(this.x, this.y, 6); } break;
      case 'ko': this.anim = 'ko'; break;
      case 'catch': break;
    }
  }
  drawBeam(c, cx, cy, run) {   // свет фонаря (эффект)
    if (!this.alive || this.state === 'sleep' || this.state === 'stagger' || this.state === 'catch') return;
    const x = this.x - cx + this.facing * 22, y = this.y - cy - 52, r = this.range, f = this.facing;
    const g = c.createLinearGradient(x, 0, x + f * r, 0);
    const col = this.see > 0.6 ? '255,70,50' : '255,240,180';
    g.addColorStop(0, `rgba(${col},0.30)`); g.addColorStop(1, `rgba(${col},0)`);
    c.fillStyle = g; c.beginPath(); c.moveTo(x, y); c.lineTo(x + f * r, y - 22); c.lineTo(x + f * r, this.y - cy + 2); c.lineTo(x + f * r * 0.2, this.y - cy + 2); c.closePath(); c.fill();
  }
  draw(c, cx, cy) {
    Spr.drawAnim(c, 'guard7', this.anim, this.animT, this.x - cx, this.y - cy, this.facing);
    if (this.state === 'ko' && (G.t * 2 | 0) % 2) G.text('Z', this.x - cx + 22, this.y - cy - 24, { size: 8, color: '#c8d8ff' });
    if (this.see > 0.05 || this.mark > 0) { const s = this.see > 0.6 ? '!' : '?'; G.text(s, this.x - cx, this.y - cy - 104, { align: 'center', size: 16, color: this.see > 0.6 ? '#ff4030' : '#ffd84a', outline: true }); }
  }
};

// ---------- собака ----------
L7.Dog = class {
  constructor(o) {
    this.id = o.id || ('d' + (++GID)); this.x = o.x; this.y = o.y || L7.GY; this.x1 = o.x1 != null ? o.x1 : o.x - 140; this.x2 = o.x2 != null ? o.x2 : o.x + 140;
    this.facing = o.facing || 1; this.state = 'walk'; this.stT = U.rand(2, 4); this.anim = 'walk'; this.animT = Math.random();
    this.range = o.range || 130; this.see = 0; this.mark = 0; this.bone = null;
  }
  get alive() { return true; }
  sees(run, pl) {
    if (this.state === 'eat' || this.state === 'toBone' || this.state === 'sleep') return 0;
    let r = L7.lookRate(run, this.x, this.y, this.facing, this.range, pl, { base: 1.1, near: 2.2 });
    if (!r && !(pl.hidden && pl.hidden.kind !== 'cover') && Math.abs(pl.y - this.y) < 30 && Math.abs(pl.x - this.x) < 60) r = 1.6;   // нюх: вплотную даже за укрытием
    return r;
  }
  hear(x) { if (this.state === 'eat' || this.state === 'toBone') return; if (Math.sign(x - this.x) !== this.facing) { this.facing = Math.sign(x - this.x) || 1; this.state = 'sniff'; this.stT = 1.4; this.mark = 0.8; Sound.play('bark'); } }
  smellBone(run) {
    if (this.bone || this.state === 'eat') return;
    let best = null;
    for (const b of run.items) if (b.kind === 'bone' && b.landed && !b.taken && Math.abs(b.y - this.y) < 30 && b.x > this.x1 - 160 && b.x < this.x2 + 160 && (!best || Math.abs(b.x - this.x) < Math.abs(best.x - this.x))) best = b;
    if (best) { best.taken = this; this.bone = best; this.state = 'toBone'; this.see = 0; FX.popText(this.x, this.y - 50, '!', '#8cf08c', 16); Sound.play('bark'); }
  }
  update(dt, run) {
    this.animT += dt; if (this.mark > 0) this.mark -= dt;
    this.smellBone(run);
    switch (this.state) {
      case 'walk': {
        this.anim = 'walk'; const tx = this.facing > 0 ? this.x2 : this.x1;
        this.x = U.approach(this.x, tx, 44 * dt);
        if (Math.abs(this.x - tx) < 1) { this.state = 'sniff'; this.stT = U.rand(1.2, 2.2); }
        break;
      }
      case 'sniff': this.anim = this.stT > 0.5 ? 'sniff' : 'sit'; this.stT -= dt; if (this.stT <= 0) { this.state = 'walk'; if ((this.facing > 0 && this.x >= this.x2 - 2) || (this.facing < 0 && this.x <= this.x1 + 2)) this.facing = -this.facing; } break;
      case 'toBone': {
        const b = this.bone; if (!b || b.gone) { this.bone = null; this.state = 'walk'; break; }
        this.anim = 'run'; this.facing = Math.sign(b.x - this.x) || this.facing; this.x = U.approach(this.x, b.x, 160 * dt);
        if (Math.abs(this.x - b.x) < 4) { this.state = 'eat'; this.stT = 9; b.gone = true; }
        break;
      }
      case 'eat': this.anim = 'eat'; this.stT -= dt; if (Math.random() < dt * 0.8) FX.popText(this.x + this.facing * 16, this.y - 30, 'ХРУМ', '#f4f0e4'); if (this.stT <= 0) { this.bone = null; this.state = 'walk'; } break;
      case 'catch': this.anim = 'bark'; break;
    }
  }
  draw(c, cx, cy) {
    Spr.drawAnim(c, 'dog7', this.anim, this.animT, this.x - cx, this.y - cy, this.facing);
    if (this.see > 0.05 || this.mark > 0) G.text(this.see > 0.6 ? '!' : '?', this.x - cx, this.y - cy - 52, { align: 'center', size: 16, color: this.see > 0.6 ? '#ff4030' : '#ffd84a', outline: true });
  }
};

// ---------- камера наблюдения (на стене) ----------
L7.Cam = class {
  constructor(o) { this.x = o.x; this.y = o.y; this.floorY = o.floorY || L7.GY; this.a0 = o.a0; this.a1 = o.a1; this.per = o.per || 6; this.range = o.range || 230; this.half = o.half || 0.22; this.group = o.group; this.t = o.ph || 0; this.see = 0; this.a = o.a0; this.sheet = o.sheet || 'pr7'; this.fr = o.fr == null ? 10 : o.fr; }
  off(run) { return this.group && run.flags[this.group] > 0; }
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
  draw(c, cx, cy, run) {
    const x = this.x - cx, y = this.y - cy, off = this.off(run);
    if (x < -300 || x > W + 300) return;
    if (!off) {
      const g = c.createRadialGradient(x, y, 4, x, y, this.range);
      const col = this.see > 0.05 ? '255,60,40' : '255,230,120';
      g.addColorStop(0, `rgba(${col},0.30)`); g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g; c.beginPath(); c.moveTo(x, y); c.arc(x, y, this.range, this.a - this.half, this.a + this.half); c.closePath(); c.fill();
    }
    const left = Math.cos(this.a) < 0;
    Spr.draw(c, this.sheet, this.fr, x, y + 8, left ? -1 : 1);
    if (!off && (G.t * 2 | 0) % 2) Art.R(c, x + (left ? -9 : 7), y - 2, 2, 2, '#ff3020');
  }
};

// ---------- квадрокоптер: летает по маршруту, луч сверху вниз ----------
L7.Drone = class {
  constructor(o) { this.x = o.x; this.x1 = o.x1; this.x2 = o.x2; this.y = o.y || 120; this.sp = o.sp || 50; this.dir = 1; this.t = Math.random() * 5; this.see = 0; this.half = o.half || 26; this.group = o.group; }
  off(run) { return this.group && run.flags[this.group] > 0; }
  update(dt) { this.t += dt; this.x += this.dir * this.sp * dt; if (this.x > this.x2) { this.x = this.x2; this.dir = -1; } if (this.x < this.x1) { this.x = this.x1; this.dir = 1; } }
  get bx() { return this.x + this.dir * 6; }
  sees(run, pl) {
    if (this.off(run) || pl.dead || run.caught || (pl.hidden && !pl.hidden.blown)) return 0;
    if (pl.crouch && run.coverAt(pl.x, pl.y)) return 0;
    if (pl.y < this.y + 20) return 0;
    const half = this.half * (pl.y - this.y) / (L7.GY - this.y);
    return Math.abs(pl.x - this.bx) < half + 6 ? 2.2 : 0;
  }
  draw(c, cx, cy, run) {
    const x = this.x - cx, y = this.y - cy + Math.sin(this.t * 3) * 3; if (x < -100 || x > W + 100) return;
    if (!this.off(run)) {
      const bx = this.bx - cx, g = c.createLinearGradient(0, y, 0, L7.GY - cy);
      const col = this.see > 0.05 ? '255,60,40' : '170,220,255';
      g.addColorStop(0, `rgba(${col},0.32)`); g.addColorStop(1, `rgba(${col},0.08)`);
      c.fillStyle = g; c.beginPath(); c.moveTo(bx - 4, y + 4); c.lineTo(bx + 4, y + 4); c.lineTo(bx + this.half, L7.GY - cy + 2); c.lineTo(bx - this.half, L7.GY - cy + 2); c.closePath(); c.fill();
      c.fillStyle = `rgba(${col},0.18)`; c.fillRect(bx - this.half, L7.GY - cy - 1, this.half * 2, 4);
    }
    Spr.draw(c, 'pr7', 11, x, y + 8, this.dir);
    if ((G.t * 3 | 0) % 2) Art.R(c, x - 1, y + 4, 2, 2, this.off(run) ? '#555' : '#ff3020');
  }
};

// ---------- лазер (вертикальный луч от излучателя на столбе; может ездить и мигать) ----------
L7.Laser = class {
  constructor(o) { Object.assign(this, { blink: null, ph: 0, group: null, x1: null, x2: null, sp: 40, y0: L7.GY - 96, y1: L7.GY }, o); this.t = this.ph; this.dir = 1; }
  on(run) { if (this.group && run.flags[this.group] > 0) return false; if (!this.blink) return true; return (this.t % (this.blink[0] + this.blink[1])) < this.blink[0]; }
  update(dt) { this.t += dt; if (this.x1 != null) { this.x += this.dir * this.sp * dt; if (this.x > this.x2) { this.x = this.x2; this.dir = -1; } if (this.x < this.x1) { this.x = this.x1; this.dir = 1; } } }
  hits(run, pl) {
    if (!this.on(run) || pl.dead || run.caught || pl.hidden) return false;
    const b = pl.box;
    return b.x < this.x + 2 && b.x + b.w > this.x - 2 && b.y < this.y1 && b.y + b.h > this.y0;
  }
  draw(c, cx, cy, run) {
    const on = this.on(run), x = this.x - cx; if (x < -40 || x > W + 40) return;
    if (this.x1 != null) { c.fillStyle = 'rgba(60,60,70,0.7)'; c.fillRect(this.x1 - cx, this.y0 - cy - 6, this.x2 - this.x1, 2); }   // направляющая
    if (on) { const fl = 0.7 + Math.sin(G.t * 40) * 0.3; c.fillStyle = `rgba(255,30,30,${0.35 * fl})`; c.fillRect(x - 2, this.y0 - cy, 5, this.y1 - this.y0); c.fillStyle = '#ff5050'; c.fillRect(x, this.y0 - cy, 1, this.y1 - this.y0); }
    else if (this.blink && !(this.group && run.flags[this.group] > 0)) { c.fillStyle = 'rgba(255,60,60,0.12)'; c.fillRect(x, this.y0 - cy, 1, this.y1 - this.y0); }
    Spr.draw(c, 'po7', 8, x, this.y0 - cy + 6, 1);
  }
};

// ---------- брошенные предметы: гайка (шум/сигналка) и кость (собаке) ----------
L7.Item = class {
  constructor(x, y, dir, kind) { this.kind = kind; this.x = x; this.y = y; this.vx = dir * 250; this.vy = -260; this.rot = 0; this.landed = false; this.taken = null; this.gone = false; this.life = 14; }
  update(dt, run) {
    this.life -= dt;
    if (!this.landed) {
      const py = this.y; this.vy += 900 * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.rot += dt * 12;
      const car = run.carAt(this.x, this.y);
      if (car && this.kind === 'nut') { this.landed = true; this.vx = 0; run.carAlarm(car); return; }
      const g = run.world.groundAt(this.x, py, this.y, 2);
      if (g) { this.y = g.y; this.landed = true; this.rot = 0; Sound.play('clank'); FX.dust(this.x, this.y, 3); run.noise(this.x, this.y, this.kind === 'nut' ? 170 : 60, this.kind); }
    }
    if (this.life <= 0 && !this.taken) this.gone = true;
    if (this.kind === 'nut' && this.landed && this.life < 12) this.gone = true;
  }
  draw(c, cx, cy) { Spr.drawC(c, 'po7', this.kind === 'bone' ? 6 : 7, this.x - cx, this.y - cy - 4, this.rot, 1); }
};

// ---------- бобр и крыса в канализации (драка кулаками) ----------
Spr.ANIM.rat7 = { walk: A7('rat7', [0, 1, 2, 3], 12), tailUp: A7('rat7', [4, 8], 4), slam: A7('rat7', [5]), hurt: A7('rat7', [6]), ko: A7('rat7', [7]), idle: A7('rat7', [8, 9], 3) };
L7.Beaver = class {
  constructor(o) { this.x = o.x; this.y = L7.GY; this.x1 = o.x1; this.x2 = o.x2; this.facing = -1; this.rat = !!o.rat; this.hp = this.rat ? 2 : 3; this.state = 'walk'; this.anim = 'walk'; this.animT = Math.random(); this.inv = 0; this.atkT = U.rand(1, 2); this.dead = false; this.t = 0; }
  get box() { return this.rat ? { x: this.x - 14, y: this.y - 22, w: 28, h: 22 } : { x: this.x - 16, y: this.y - 40, w: 32, h: 38 }; }
  hit(dmg, dir) {
    if (this.inv > 0 || this.state === 'ko') return false;
    this.hp -= dmg; this.inv = 0.3; this.x += dir * 16; Sound.play('squeak');
    if (this.hp <= 0) { this.state = 'ko'; this.anim = 'ko'; this.t = 0; return true; }
    this.state = 'hurt'; this.t = 0.3; return false;
  }
  update(dt, run, pl) {
    this.animT += dt; if (this.inv > 0) this.inv -= dt;
    if (this.state === 'ko') { this.t += dt; if (this.t > 1.5) this.dead = true; return; }
    if (this.state === 'hurt') { this.anim = 'hurt'; this.t -= dt; if (this.t <= 0) this.state = 'walk'; return; }
    const d = pl.x - this.x;
    if (Math.abs(d) < 220 && !pl.dead) {
      this.facing = Math.sign(d) || 1;
      if (Math.abs(d) > (this.rat ? 22 : 30)) { this.anim = 'walk'; this.x += this.facing * (this.rat ? 120 : 70) * dt; }
      else { this.atkT -= dt; this.anim = this.atkT < 0.3 ? 'slam' : 'tailUp'; if (this.atkT <= 0) { this.atkT = U.rand(1.1, 1.8); if (U.overlap(this.box, pl.box)) pl.hurt(this.rat ? 5 : 7, this.x, run.world); Sound.play(this.rat ? 'squeak' : 'stomp'); } }
    } else { this.anim = 'walk'; this.x += this.facing * 35 * dt; if (this.x < this.x1) this.facing = 1; if (this.x > this.x2) this.facing = -1; }
  }
  draw(c, cx, cy) {
    if (this.state === 'ko' && (G.t * 10 | 0) % 2) return;
    Spr.drawAnim(c, this.rat ? 'rat7' : 'beaver', this.anim, this.animT, this.x - cx, this.y - cy, this.facing, { flash: this.inv > 0.15 ? '#fff' : null, scale: this.rat ? 1 : 0.9 });
  }
};
