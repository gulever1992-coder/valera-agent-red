'use strict';
// ============ УРОВЕНЬ 7: «СЕВМОЛОТ» — в обход к заводоуправлению (бит-эм-ап по схеме ур.2) ============
// улица Выборгска -> гаражи -> проходная -> цеха и порт (кран роняет груз) -> сквер -> площадь (босс) -> финал-комиксы
const L7 = {};
G.L7 = L7;
L7.GROUND = 300;
L7.ARENA_X = 12600;
L7.W = L7.ARENA_X + 640;
L7.img = {};
const A7 = (sheet, fr, fps = 8, o = {}) => Object.assign({ fr: fr.map(i => [sheet, i]), fps }, o);
L7.has = s => !!(Spr.sheets[s] && Spr.sheets[s].img);

// ---------- анимации ----------
L7.loadPortraits = function () {   // G.portraits создаётся позже L7.load — грузим при старте уровня
  for (const k of ['stas', 'maxim', 'denisch', 'deniso', 'mrx', 'leather', 'boss7']) if (G.portraits && !G.portraits[k]) G.loadImage('assets/spr/p_' + k + '.png').then(im => { if (im) G.portraits[k] = im; });
};
L7.setupAnims = function () {
  L7.loadPortraits();
  const n = s => (Spr.sheets[s] && Spr.sheets[s].f ? Spr.sheets[s].f.length : 0);
  Spr.ANIM.valera7 = Object.assign({}, Spr.ANIM.valera6, n('v7sneak') >= 24 ? {
    thumb: A7('v7sneak', [16, 17], 3), throwBone: A7('v7sneak', [18, 19], 7), chop: A7('v7sneak', [20, 21], 7),
    shoutFist: A7('v7sneak', [22, 23], 4), peek: A7('v7sneak', [5]), tied: A7('v7sneak', [10]),
  } : {});
  Spr.ANIM.leather = n('leather7') >= 12 ? { stand: A7('leather7', [0, 1], 2), thumb: A7('leather7', [2, 3], 3), run: A7('leather7', [4, 5, 6, 7], 11), walk: A7('leather7', [8, 9, 10, 11], 7) } : { stand: A7('cars7', [4]) };
  Spr.ANIM.boss7 = n('boss7') >= 12 ? {
    idle: A7('boss7', [0, 1], 3), walk: A7('boss7', [2, 3, 2, 3], 7), run: A7('boss7', [2, 3], 10), wind: A7('boss7', [4]), punch: A7('boss7', [5]), kick: A7('boss7', [6]),
    radio: A7('boss7', [7]), gWind: A7('boss7', [8]), gThrow: A7('boss7', [5]), aim: A7('boss7', [9]), shoot: A7('boss7', [9]), hurt: A7('boss7', [10]), ko: A7('boss7', [11]),
  } : { idle: A7('guard7', [4]), walk: A7('guard7', [0, 1, 2, 3], 7), punch: A7('guard7', [7]), hurt: A7('guard7', [8]), ko: A7('guard7', [9]) };
  Spr.ANIM.boss7.stand = Spr.ANIM.boss7.idle;
};

// ---------- враги ----------
// sheet/кадры по типам: walk — цикл, wind/attack — удар (или бросок), hurt, ko; run — бег (если есть)
L7.FOE = {
  chop: { hp: 4, w: 22, h: 70, score: 150, voice: 150, sp: 85, reach: 38, dmg: 10, lines: ['Посторонним вход воспрещён!', 'Стоять, гражданин!', 'Пропуск предъяви!', 'Я на смене, мне можно!'] },
  spz: { hp: 6, w: 20, h: 76, score: 250, voice: 170, sp: 115, reach: 44, dmg: 13, lines: ['Цель обнаружена!', 'Это он, с фоторобота!', 'Брать живым!', 'Стоять, рыжий!'] },
  gren: { hp: 4, w: 20, h: 76, score: 250, voice: 170, ranged: true, lines: ['Ложись!', 'Светошумовая!', 'Лови подарочек!'] },
  worker: { hp: 3, w: 22, h: 70, score: 150, voice: 140, ranged: true, lines: ['Иди работай!', 'Держи ключ!', 'Не мешай план выполнять!', 'Ты из какого цеха?'] },
  dog: { hp: 2, w: 40, h: 30, score: 150, voice: 120, dog: true, lines: ['Ррррр!', 'ГАВ!'] },
};
L7.frames = function (type) {
  const has = L7.has;
  switch (type) {
    case 'chop': return has('chop7') ? { sheet: 'chop7', walk: [0, 1, 2, 3], idle: 0, wind: 4, attack: 5, hurt: 6, ko: 7 } : null;
    case 'worker': return has('worker7') ? { sheet: 'worker7', walk: [0, 1, 2, 3], idle: 0, wind: 4, attack: 5, hurt: 6, ko: 7 } : null;
    case 'spz': case 'gren': {
      const c = has('spz7');
      return { sheet: 'guard7', walk: [0, 1, 2, 3], run: [12, 13, 14, 15], idle: 4, wind: c ? ['spz7', type === 'gren' ? 6 : 0] : 5, attack: c ? ['spz7', type === 'gren' ? 7 : 1] : 7, hurt: c ? ['spz7', 2] : 8, ko: 9 };
    }
    case 'dog': return { sheet: 'dog7', walk: [0, 1, 2, 3], run: [4, 5, 6, 7], idle: 9, wind: 8, attack: 12, hurt: 9, ko: 15 };
  }
  return null;
};
L7.Foe = class {
  constructor(type, x, o = {}) {
    const d = L7.FOE[type];
    Object.assign(this, { type, d, x, y: L7.GROUND, facing: -1, hp: d.hp, st: 0, t: Math.random() * 5, state: 'idle', vx: 0, vy: 0, flash: 0, dieT: null, dead: false, cool: 1 + Math.random(), score: d.score, voice: d.voice, headH: d.h + 12, x1: x - 280, x2: x + 280, said: false }, o);
    this.fr = L7.frames(type);
  }
  get box() { return { x: this.x - this.d.w / 2, y: this.y - this.d.h, w: this.d.w, h: this.d.h }; }
  set(s) { this.state = s; this.st = 0; }
  hit(dmg, dir) {
    if (this.dieT != null) return false;
    this.hp -= dmg; this.flash = 0.12; this.vx = dir * 130; this.aggro = true;
    if (this.hp <= 0) { this.dieT = 0; this.vx = dir * 150; this.vy = -230; if (this.d.dog) { Sound.play('squeak'); G.say(this, 'Скуууу!', 1.0, { sound: false }); } return true; }
    if (this.state !== 'lunge') this.set('hurt');
    return false;
  }
  support(wd) { let best = null; for (const p of wd.plats) { if (this.x < p.x - 2 || this.x > p.x + p.w + 2) continue; if (Math.abs(p.y - this.y) <= 3 && (!best || p.y < best.y)) best = p; } return best; }
  fitPatrol(wd) {
    const p = this.support(wd);
    if (!p) { this.falling = true; return; }
    if (p.w < L7.W) { this.x1 = Math.max(this.x1, p.x + 10); this.x2 = Math.min(this.x2, p.x + p.w - 10); }
    if (this.x1 > this.x2) this.x1 = this.x2 = p.x + p.w / 2;
    this.x = U.clamp(this.x, this.x1, this.x2);
  }
  gravity(dt, wd) {
    if (this.state === 'lunge') return;
    if (!this.falling && !this.support(wd)) this.falling = true;
    if (!this.falling) return;
    const py = this.y; this.vy = Math.min(700, (this.vy || 0) + 1500 * dt); this.y += this.vy * dt;
    const g = wd.groundAt(this.x, py, this.y, 4);
    if (g) { this.y = g.y; this.vy = 0; this.falling = false; this.x1 = this.x - 280; this.x2 = this.x + 280; this.fitPatrol(wd); }
  }
  update(dt, wd, pl, run) {
    this.t += dt; this.st += dt; if (this.flash > 0) this.flash -= dt; this.cool -= dt;
    if (!this.fitted) { this.fitted = true; this.fitPatrol(wd); }
    if (this.dieT != null) {
      this.dieT += dt; this.vy += 1200 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
      const gg = wd.groundAt(this.x, this.y - this.vy * dt, this.y, 4);
      if (this.vy > 0 && gg) { this.y = gg.y; this.vy = 0; this.vx *= 0.8; }
      if (this.dieT > 1.8) this.dead = true;
      return;
    }
    this.gravity(dt, wd);
    const dx = pl.x - this.x, adx = Math.abs(dx), near = Math.abs(pl.y - this.y) < 50 && !pl.dead;
    const face = () => { this.facing = dx > 0 ? 1 : -1; };
    const move = sp => { this.x = U.clamp(this.x + this.facing * sp * dt, this.x1, this.x2); };
    const talk = () => { if (!this.said && Math.random() < 0.8) { this.said = true; G.say(this, U.choice(this.d.lines), 1.6); } };
    if (this.state === 'hurt') { this.x = U.clamp(this.x + this.vx * dt, this.x1, this.x2); this.vx *= 0.85; if (this.st > 0.3) this.set('chase'); return; }
    const d = this.d;
    if (d.dog) {
      if (this.state === 'lunge') {
        this.vy += 1500 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
        if (U.overlap(this.box, pl.box) && !this.bit) { this.bit = true; pl.hurt(11, this.x, wd); }
        const gl = wd.groundAt(this.x, this.y - this.vy * dt, this.y, 6);
        if (this.vy > 0 && gl) { this.y = gl.y; this.set('chase'); this.cool = 1.5; this.bit = false; this.fitPatrol(wd); }
      } else if (near && (adx < 340 || this.aggro)) {
        face(); this.state = adx < 60 && this.cool > 0 ? 'bark' : 'chase'; if (this.state === 'chase') move(185);
        if (adx < 140 && this.cool <= 0) { this.set('lunge'); this.vx = this.facing * 260; this.vy = -320; Sound.play('bark'); G.say(this, 'ГАВ!', 0.6, { sound: false }); }
        if (Math.random() < dt * 0.8) Sound.play('bark');
      } else { this.state = 'walk'; if (this.x <= this.x1 + 2) this.facing = 1; if (this.x >= this.x2 - 2) this.facing = -1; move(45); }
      return;
    }
    if (d.ranged) {
      // гранатомётчик/рабочий: держит дистанцию и кидает по дуге
      face();
      if (this.state === 'idle' || this.state === 'chase') {
        const want = Math.abs(pl.y - this.y) < 160 && !pl.dead && (adx < 360 || this.aggro);
        if (want) { talk(); if (adx < 90 && this.type === 'gren') { this.facing = -this.facing; move(70); this.facing = -this.facing; this.state = 'chase'; } else this.state = 'idle'; }
        if (want && adx > 40 && this.cool <= 0) this.set('wind');
      } else if (this.state === 'wind') {
        if (this.st > 0.35) {
          this.set('attack');
          const sx = this.x + this.facing * 12, sy = this.y - 60, tx = pl.x + pl.vx * 0.3, ty = pl.y - 12;
          const T = 0.75 + Math.abs(tx - sx) / 900, g = 1500 * 0.6;
          if (this.type === 'gren') run.grenades.push(new L7.Grenade(sx, sy, (tx - sx) / T, (ty - sy - 0.5 * g * T * T) / T));
          else wd.hazards.push(new Game.Hazard('wrench', sx, sy, (tx - sx) / T, (ty - sy - 0.5 * g * T * T) / T));
          Sound.play('throw');
        }
      } else if (this.state === 'attack') { if (this.st > 0.4) { this.cool = this.type === 'gren' ? 2.4 : 1.6; this.set('idle'); } }
      return;
    }
    // ближний бой: ЧОП, спецназ
    if (this.state === 'idle') { if (near && (adx < 240 || this.aggro)) { this.set('chase'); talk(); } else { this.state = 'idle'; } }
    else if (this.state === 'chase') { face(); move(adx > 160 && this.fr && this.fr.run ? d.sp * 1.5 : d.sp); if (adx < d.reach - 4 && near) this.set('wind'); }
    else if (this.state === 'wind') { if (this.st > (this.type === 'spz' ? 0.28 : 0.36)) { this.set('attack'); Sound.play('punch'); } }
    else if (this.state === 'attack') { if (this.st < 0.12) this.meleeHit(pl, wd); if (this.st > 0.32) this.set('recover'); }
    else if (this.state === 'recover') { if (this.st > (this.type === 'spz' ? 0.3 : 0.45)) this.set('chase'); }
    if (U.overlap(this.box, pl.box) && (this.bodyCool = (this.bodyCool || 0) - dt) <= 0 && !pl.dead) { this.bodyCool = 0.8; pl.hurt(4, this.x, wd); }
  }
  meleeHit(pl, wd) {
    const r = this.d.reach, hb = { x: this.x + (this.facing > 0 ? 4 : -r), y: this.y - 62, w: r, h: 40 };
    if (U.overlap(hb, pl.box)) pl.hurt(this.d.dmg, this.x, wd);
  }
  frame() {
    const f = this.fr, s = this.state;
    const pick = v => Array.isArray(v) && typeof v[0] === 'string' ? v : [f.sheet, v];
    if (this.dieT != null) return pick(f.ko);
    if (s === 'hurt') return pick(f.hurt);
    if (s === 'wind') return pick(f.wind);
    if (s === 'attack' || s === 'lunge') return pick(f.attack);
    if (s === 'bark') return pick(f.wind);
    if (s === 'chase' || s === 'walk') { const fast = f.run && (this.d.dog ? s === 'chase' : Math.abs(this.vx) > 0 || this.state === 'chase'); const w = fast && f.run ? f.run : f.walk; return [f.sheet, w[Math.floor(this.t * (fast ? 11 : 7)) % w.length]]; }
    return pick(f.idle);
  }
  draw(c, cx, cy) {
    if (!this.fr) { Art.R(c, this.x - cx - 10, this.y - 70, 20, 70, '#444'); return; }
    let rot = 0;
    if (this.dieT != null && this.d.dog) rot = Math.PI;
    const alpha = this.dieT != null && this.dieT > 1.3 ? (1.8 - this.dieT) / 0.5 : 1;
    const [sh, i] = this.frame();
    Spr.draw(c, sh, i, this.x - cx, this.y - cy - (rot ? 10 : 0), this.facing, { rot, flash: this.flash > 0 ? '#ffffff' : null, alpha });
  }
};

// светошумовая граната: летит по дуге, полежит и бахнет (вспышка ослепляет — экран белеет)
L7.Grenade = class {
  constructor(x, y, vx, vy) { Object.assign(this, { x, y, vx, vy, t: 0, fuse: null, dead: false, rot: 0, deflected: false }); }
  get box() { return { x: this.x - 5, y: this.y - 5, w: 10, h: 10 }; }
  update(dt, wd, pl, run) {
    this.t += dt; this.rot += dt * 10;
    if (this.fuse == null) {
      const py = this.y; this.vy = Math.min(600, this.vy + 900 * dt); this.x += this.vx * dt; this.y += this.vy * dt;
      const g = this.vy > 0 && wd.groundAt(this.x, py, this.y, 2);
      if (g) { this.y = g.y - 4; this.fuse = 0.7; Sound.play('clank'); }
    } else {
      this.fuse -= dt;
      if (this.fuse <= 0) {
        this.dead = true; Sound.play('boom'); G.shake(5, 0.3);
        FX.burst(this.x, this.y - 6, 14, { colors: ['#ffffff', '#fff6c0', '#ffd84a'], speed: 180, life: 0.4, grav: 0 });
        const d = Math.hypot(pl.x - this.x, pl.y - 30 - this.y);
        if (d < 64 && !pl.dead) { pl.hurt(12, this.x, wd); run.blind = Math.max(run.blind, 1); G.say(pl, U.choice(['Ничего не вижу!', 'Ай, глаза!']), 1.2); }
        else if (d < 200) run.blind = Math.max(run.blind, 0.4);
      }
    }
  }
  draw(c, cx) {
    const x = this.x - cx, y = this.y;
    c.save(); c.translate(x, y); c.rotate(this.rot);
    Art.R(c, -4, -3, 8, 7, '#2c3a2a'); Art.R(c, -2, -5, 4, 2, '#8a8a8a');
    if (this.fuse != null && (G.t * 12 | 0) % 2) Art.R(c, -1, -1, 2, 2, '#ff3020');
    c.restore();
  }
};

// портальный кран: в зоне крана над игроком появляется тень — через секунду падает ящик
L7.Crane = class {
  constructor(x1, x2) { this.x1 = x1; this.x2 = x2; this.cool = 2; this.drops = []; }
  update(dt, wd, pl) {
    if (pl.x > this.x1 && pl.x < this.x2 && !pl.dead) {
      this.cool -= dt;
      if (this.cool <= 0) { this.cool = U.rand(1.8, 2.8); this.drops.push({ x: pl.x + pl.vx * 0.7, y: -60, warn: 1.0, vy: 0 }); Sound.play('warn'); }
    }
    for (const d of this.drops) {
      if (d.warn > 0) { d.warn -= dt; continue; }
      d.vy += 1600 * dt; d.y += d.vy * dt;
      const box = { x: d.x - 22, y: d.y - 34, w: 44, h: 34 };
      if (!d.hitP && U.overlap(box, pl.box) && !pl.dead) { d.hitP = true; if (pl.hurt(18, d.x, wd)) G.say(pl, 'Ай! Техника безопасности!', 1.2); }
      if (d.y >= L7.GROUND) { d.dead = true; Sound.play('brick'); G.shake(4, 0.2); FX.dust(d.x, L7.GROUND, 10); FX.burst(d.x, L7.GROUND - 10, 10, { colors: ['#8a6a40', '#5a4428', '#c8a060'], speed: 160, size: 3, life: 0.6 }); }
    }
    this.drops = this.drops.filter(d => !d.dead);
  }
  draw(c, cx) {
    for (const d of this.drops) {
      const x = d.x - cx;
      const k = d.warn > 0 ? 1 - d.warn : 1;
      c.fillStyle = `rgba(0,0,0,${0.25 + k * 0.35})`; c.beginPath(); c.ellipse(x, L7.GROUND + 2, 18 + k * 8, 4, 0, 0, Math.PI * 2); c.fill();
      if (d.warn > 0 && (G.t * 10 | 0) % 2) G.text('!', x, L7.GROUND - 40, { align: 'center', color: '#ff4030', size: 16, outline: true });
      if (d.warn <= 0) {
        Art.R(c, x - 1, 0, 2, d.y - 34, '#2a2620');
        if (L7.has('props7')) Spr.draw(c, 'props7', 4, x, d.y, 1, { scale: 0.9 });
        else { Art.R(c, x - 22, d.y - 34, 44, 34, '#7a5a30'); Art.R(c, x - 20, d.y - 32, 40, 30, '#a07a44'); }
      }
    }
  }
};

// ---------- предметы улицы (атлас props7) ----------
// i — кадр, top — верх коллайдера (доля высоты), wf — ширина коллайдера, deco — без коллизии, fg — силуэт переднего плана
L7.PROPS = {
  bench: { i: 0, top: 0.5, wf: 0.9, oneway: true },
  lamp: { i: 1, deco: true },
  bin: { i: 2, top: 0.95, wf: 0.8, oneway: false },
  barrels: { i: 3, top: 0.97, wf: 0.9, oneway: false },
  crates: { i: 4, top: 0.98, wf: 0.95, oneway: false },
  limo: { i: 5, top: 0.6, wf: 0.86, oneway: true },
  suv: { i: 6, top: 0.7, wf: 0.86, oneway: true },
  booth: { i: 7, top: 0.97, wf: 0.9, oneway: true },
  ladder: { i: 8, ladder: true },
  blocks: { i: 9, top: 0.96, wf: 0.95, oneway: false },
  pallet: { i: 10, top: 0.95, wf: 0.95, oneway: false },
  spool: { i: 11, top: 0.92, wf: 0.8, oneway: true },
  fir: { i: 12, deco: true },
  tree: { i: 13, deco: true },
  fence: { i: 14, deco: true },
  statue: { i: 15, deco: true },
};
L7.propSize = type => { const d = L7.PROPS[type]; return L7.has('props7') ? Spr.size('props7', d.i) : [40, 40]; };

// ---------- постройка уровня ----------
// здания ставятся подряд: [имя, отступ слева]; координаты зон считаются от них
L7.BUILD_LIST = [
  ['stalin1', 60], ['stalin3', 30], ['stalin2', 30],          // 1. улица Выборгска
  ['garages', 220], ['garages', 150], ['stalin1', 80],         // 2. гаражи и подворотня
  ['gate', 200], ['containers', 120], ['pipes', 140],           // 3. проходная и заводской двор
  ['factory', 160], ['crane', 40], ['containers', 60], ['pier', 40],   // 4. цеха и порт
  ['colonnade', 200], ['square', 40], ['square', 60],          // 5. сквер
];
L7.build = function () {
  const G0 = L7.GROUND, B = window.BUILDINGS7 || {};
  const D = { props: [], plats: [], foes: [], pickups: [], checkpoints: [], hints: [], buildings: [], fg: [], zones: {} };
  D.plats.push({ x: 0, y: G0, w: L7.W, h: 60, oneway: false, look: 'none' });
  let x = 0;
  for (const [name, gap] of L7.BUILD_LIST) {
    const b = B[name] || { w: 500, h: 300 };
    x += gap;
    D.buildings.push({ name, x, w: b.w, h: b.h });
    if (b.tops) for (const [x0, x1, top] of b.tops) if (top > 40) D.plats.push({ x: x + x0 + 4, y: G0 - top, w: x1 - x0 - 8, h: 8, oneway: true, look: 'none' });
    x += b.w;
  }
  L7.ARENA_X = Math.max(L7.ARENA_X, x + 300); L7.W = L7.ARENA_X + 640; D.plats[0].w = L7.W;
  const bi = (name, k = 0) => D.buildings.filter(b => b.name === name)[k];
  const roofY = (name, k = 0) => { const bb = B[name]; if (!bb || !bb.tops) return G0 - 120; const t = bb.tops.reduce((m, t) => (t[1] - t[0] > m[1] - m[0] ? t : m)); return G0 - t[2]; };
  const roofX = (name, k = 0, f = 0.5) => { const b = bi(name, k), bb = B[name]; if (!bb || !bb.tops) return b.x + b.w * f; const t = bb.tops.reduce((m, t) => (t[1] - t[0] > m[1] - m[0] ? t : m)); return b.x + t[0] + (t[1] - t[0]) * f; };
  const prop = (type, px, y = G0) => D.props.push({ type, x: px, y });
  const foe = (type, fx, o) => D.foes.push({ type, x: fx, o });
  const pick = (kind, px, y = 0) => D.pickups.push({ kind, x: px, y });
  const hint = (hx, w, text) => D.hints.push({ x: hx, w, text });
  // 1. улица Выборгска
  const s1 = bi('stalin1'), s2 = bi('stalin2');
  prop('bench', s1.x + 300); prop('lamp', s1.x + 520); prop('bin', s1.x + 700); prop('limo', bi('stalin3').x + 200); prop('lamp', bi('stalin3').x + 520);
  foe('chop', s1.x + 560); foe('chop', s1.x + 820); foe('dog', bi('stalin3').x + 400); foe('chop', s2.x + 200); foe('worker', s2.x + 420);
  pick('pie', s1.x + 700); pick('nutsbox', bi('stalin3').x + 120); pick('coin', s2.x + 300);
  hint(0, 520, 'На проходную не пустили — ищи обход! Бей {punch}, прыгай {jump}, бросай гайки {throw}.');
  D.checkpoints.push({ x: s2.x + s2.w + 60 });
  // 2. гаражи и подворотня
  const g1 = bi('garages', 0), g2 = bi('garages', 1), s1b = bi('stalin1', 1);
  prop('bin', g1.x - 40); prop('ladder', g2.x + 10); prop('barrels', g1.x + g1.w + 70);
  foe('dog', g1.x + 120); foe('dog', g1.x + 200); foe('chop', roofX('garages', 0, 0.6), { y: roofY('garages') });
  foe('worker', roofX('garages', 1, 0.5), { y: roofY('garages') }); foe('chop', g2.x + 300); foe('dog', s1b.x + 200); foe('spz', s1b.x + 500);
  pick('badge', roofX('garages', 0, 0.3), roofY('garages') - 1); pick('kefir', g2.x + g2.w + 40); pick('wrenchpk', roofX('garages', 1, 0.8), roofY('garages') - 1);
  hint(g1.x - 120, 220, 'Залезай на гаражи с мусорного бака или по лестнице {up}. Собак бей присев: {down}+{punch}.');
  D.checkpoints.push({ x: s1b.x + s1b.w + 80 });
  // 3. проходная и заводской двор
  const gt = bi('gate'), c1 = bi('containers', 0), pp = bi('pipes');
  prop('booth', gt.x - 70); prop('blocks', gt.x + gt.w + 50); prop('pallet', c1.x - 60);
  foe('spz', gt.x + 150); foe('spz', gt.x + gt.w - 80); foe('dog', gt.x + gt.w + 120);
  foe('gren', roofX('containers', 0, 0.7), { y: roofY('containers') }); foe('worker', c1.x + 60); foe('chop', pp.x + 120); foe('worker', roofX('pipes', 0, 0.5), { y: roofY('pipes') });
  pick('beer', gt.x + gt.w + 50); pick('pelmeni', roofX('containers', 0, 0.2), roofY('containers') - 1); pick('nutsbox', pp.x + pp.w - 60);
  hint(gt.x - 200, 260, 'Спецназ бьёт прикладом — не лезь в лоб. Граната «!» — отбегай, вспышка ослепит!');
  D.checkpoints.push({ x: pp.x + pp.w + 70 });
  // 4. цеха и порт
  const fc = bi('factory'), cr = bi('crane'), c2 = bi('containers', 1), pr = bi('pier');
  prop('spool', fc.x + 160); prop('crates', fc.x + 420); prop('crates', fc.x + 455); prop('crates', fc.x + 437, G0 - 34); prop('barrels', cr.x + cr.w + 20);
  foe('worker', fc.x + 300); foe('chop', fc.x + 520); foe('gren', fc.x + 437, { y: G0 - 68, x1: fc.x + 425, x2: fc.x + 450 });
  foe('spz', cr.x + 200); foe('dog', cr.x + 380); foe('worker', roofX('containers', 1, 0.5), { y: roofY('containers') }); foe('spz', pr.x + 160); foe('spz', pr.x + 320);
  pick('kefir', fc.x + 160); pick('badge', roofX('containers', 1, 0.8), roofY('containers') - 1); pick('beer', pr.x + 60);
  D.zones.crane = [cr.x - 40, cr.x + cr.w + 40];
  hint(cr.x - 160, 200, 'Кран роняет ящики! Видишь тень и «!» — убегай.');
  D.checkpoints.push({ x: pr.x + pr.w + 80 });
  // 5. сквер у заводоуправления
  const co = bi('colonnade'), q1 = bi('square', 0), q2 = bi('square', 1);
  prop('lamp', co.x - 60); prop('suv', co.x + co.w + 10); prop('bench', q1.x + 200); prop('lamp', q1.x + 420); prop('limo', q2.x + 160); prop('lamp', q2.x + 420);
  foe('dog', co.x + 120); foe('spz', co.x + 300); foe('chop', q1.x + 140); foe('gren', q1.x + 300, { onProp: 'bench' }); foe('dog', q1.x + 480);
  foe('spz', q2.x + 200); foe('spz', q2.x + 360); foe('dog', q2.x + 520);
  pick('pie', q1.x + 200); pick('pelmeni', q2.x + 160); pick('nutsbox', co.x + 40);
  D.checkpoints.push({ x: q2.x + q2.w + 40 });
  hint(q2.x + q2.w - 100, 220, 'Впереди площадь у заводоуправления. Там ждёт командир спецназа!');
  // передний план: фонари, ели, ограда — тёмные силуэты
  for (let fx = 260; fx < L7.ARENA_X; fx += U.randi(420, 700)) D.fg.push({ x: fx, type: U.choice(['lamp', 'fir', 'tree', 'fence', 'lamp', 'fir']) });
  return D;
};

// ---------- слои фона ----------
L7.tile = function (c, img, off, y, w, h) {
  if (!img) return;
  let x = -((off % w) + w) % w;
  for (; x < W; x += w) c.drawImage(img, Math.floor(x), y, Math.ceil(w) + 1, h);
};
L7.layers = () => Object.assign({ sky: [1280, 360], far: [1280, 220], mid: [1280, 300], ground: [1280, 80] }, window.BUILDINGS7 && window.BUILDINGS7._layers);
L7.drawLayers = function (c, camX) {
  const L = L7.layers(), I = L7.img;
  if (I.sky) L7.tile(c, I.sky, camX * 0.04, 0, L.sky[0], L.sky[1]); else { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a1a4a'); g.addColorStop(0.6, '#e04020'); g.addColorStop(1, '#601010'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  L7.tile(c, I.far, camX * 0.15, L7.GROUND - L.far[1] + 20, L.far[0], L.far[1]);
  c.fillStyle = 'rgba(40,10,30,0.18)'; c.fillRect(0, 0, W, L7.GROUND);
  L7.tile(c, I.mid, camX * 0.38, L7.GROUND - L.mid[1] + 14, L.mid[0], L.mid[1]);
  c.fillStyle = 'rgba(30,12,30,0.22)'; c.fillRect(0, 0, W, L7.GROUND);
};
L7.drawBuildings = function (c, camX, list) {
  for (const b of list) {
    const x = b.x - camX;
    if (x > W || x + b.w < 0) continue;
    const img = L7.img['b_' + b.name];
    if (img) c.drawImage(img, Math.round(x), L7.GROUND - b.h + 2, b.w, b.h);
    else { Art.R(c, Math.round(x), L7.GROUND - b.h, b.w, b.h, '#4a4448'); }
  }
};
// мокрая плитка: тайл земли + отражение зданий и неба (перевёрнутое, приглушённое)
L7.drawGround = function (c, camX, list) {
  const L = L7.layers(), I = L7.img, gy = L7.GROUND - 8;
  if (I.ground) L7.tile(c, I.ground, camX, gy, L.ground[0], L.ground[1]); else { c.fillStyle = '#2a2026'; c.fillRect(0, gy, W, H - gy); }
  c.fillStyle = '#0c0a0e'; c.fillRect(0, gy + L.ground[1], W, H);
  if (list) {
    c.save(); c.beginPath(); c.rect(0, L7.GROUND + 4, W, H - L7.GROUND); c.clip();
    c.globalAlpha = 0.22; c.translate(0, (L7.GROUND + 4) * 2); c.scale(1, -1);
    for (const b of list) { const x = b.x - camX; if (x > W || x + b.w < 0) continue; const img = L7.img['b_' + b.name]; if (img) c.drawImage(img, Math.round(x), L7.GROUND - b.h + 2, b.w, b.h); }
    c.restore();
  }
};
L7.drawForeground = function (c, camX, list) {
  if (!list || !L7.has('props7')) return;
  c.save(); c.filter = 'brightness(0.22) saturate(0.5)';
  for (const f of list) {
    const sx = f.x - camX * 1.35 + f.x * 0.35;
    if (sx < -150 || sx > W + 150) continue;
    Spr.draw(c, 'props7', L7.PROPS[f.type].i, sx, H + 40, 1, { scale: f.type === 'fence' ? 1.4 : 1.7 });
  }
  c.restore();
};
// дождь и листья — атмосфера
L7.Weather = class {
  constructor() { this.drops = []; this.leaves = []; for (let i = 0; i < 90; i++) this.drops.push({ x: Math.random() * W, y: Math.random() * H, v: U.rand(380, 520) }); for (let i = 0; i < 10; i++) this.leaves.push({ x: Math.random() * W, y: Math.random() * H, t: Math.random() * 6 }); }
  update(dt) {
    for (const d of this.drops) { d.y += d.v * dt; d.x -= d.v * 0.18 * dt; if (d.y > H) { d.y = -10; d.x = Math.random() * (W + 60); } }
    for (const l of this.leaves) { l.t += dt; l.y += 26 * dt; l.x += Math.sin(l.t * 2) * 30 * dt - 10 * dt; if (l.y > H) { l.y = -10; l.x = Math.random() * W; } }
  }
  draw(c) {
    c.strokeStyle = 'rgba(200,190,220,0.25)'; c.lineWidth = 1; c.beginPath();
    for (const d of this.drops) { c.moveTo(d.x, d.y); c.lineTo(d.x + 3, d.y - 10); }
    c.stroke();
    for (const l of this.leaves) { c.fillStyle = (l.t | 0) % 2 ? '#c86a20' : '#e09a30'; c.fillRect(Math.round(l.x), Math.round(l.y), 3, 2); }
  }
};

L7.load = async function () {
  const B = window.BUILDINGS7 || {};
  const jobs = Object.keys(B).filter(k => k[0] !== '_').map(async k => { try { L7.img['b_' + k] = await G.loadImage(B[k].img); } catch (e) {} });
  for (const k of ['sky', 'far', 'mid', 'ground']) jobs.push((async () => { try { L7.img[k] = await G.loadImage('assets/l7/' + k + (k === 'far' || k === 'mid' ? '.png' : '.jpg')); } catch (e) {} })());
  for (const k of ['road', 'card', 'comic_van', 'comic_gate', 'comic_stage', 'comic_shout', 'comic_raid', 'arena']) jobs.push((async () => { try { L7.img[k] = await G.loadImage('assets/l7/' + k + '.jpg'); } catch (e) {} })());
  await Promise.all(jobs);
};

// ---------- Валера ур.7: грязный после леса (кадры ур.6), гайки и ключ ----------
L7.Player = class extends Game.Player {
  constructor(x, y) { super(x, y); this.animSet = 'valera7'; this.portraitKey = 'valera6'; }
};

// ---------- режим прохождения ----------
L7.Run = class {
  constructor(level) {
    this.level = level;
    const D = this.D = L7.build();
    const wd = this.world = new Game.World(L7.W, H);
    wd.stats = level.stats; wd.score = level.score;
    wd.addScore = n => { wd.score += n; level.score = wd.score; };
    D.plats.forEach(p => wd.addPlat(p));
    this.props = D.props.map(p => {
      const def = L7.PROPS[p.type];
      const [w, h] = L7.propSize(p.type);
      const o = Object.assign({ w, h, def }, p);
      if (def.ladder) wd.ladders.push({ x: p.x - 8, y: p.y - h + 2, w: 16, h: h - 2 });
      else if (!def.deco) { const cw = w * def.wf, top = p.y - h * def.top; o.col = wd.addPlat({ x: p.x - cw / 2, y: top, w: cw, h: p.y - top, oneway: def.oneway, look: 'none' }); }
      return o;
    });
    const roofOf = (type, x) => { const pr = this.props.filter(p => p.type === type).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0]; return pr && pr.col ? pr.col.y : L7.GROUND; };
    this.buildings = D.buildings;
    wd.enemies = D.foes.map(f => {
      const o = Object.assign({}, f.o || {});
      if (o.onProp) { o.y = roofOf(o.onProp, f.x); o.x1 = f.x - 24; o.x2 = f.x + 24; }
      if (o.x1 == null && o.y != null) { o.x1 = f.x - 70; o.x2 = f.x + 70; }
      return new L7.Foe(f.type, f.x, o);
    });
    wd.pickups = D.pickups.map(p => { const k = new Game.Pickup(p.kind, p.x, p.y || 0); if (!p.y) k.falling = true; return k; });
    wd.checkpoints = D.checkpoints.map(c => Object.assign({ active: false, y: L7.GROUND }, c));
    this.hints = D.hints.map(h => Object.assign({ shown: 0 }, h));
    this.crane = D.zones.crane ? new L7.Crane(D.zones.crane[0], D.zones.crane[1]) : null;
    this.grenades = []; this.blind = 0; this.weather = new L7.Weather();
    this.player = new L7.Player(level.startX || 80, L7.GROUND);
    Object.assign(this.player.ammo, level.carry.ammo); this.player.weapon = level.carry.weapon;
    this.respawn = { x: this.player.x };
    wd.cam.x = U.clamp(this.player.x - 200, 0, L7.W - W);
    wd.playerAttack = (hb, dmg, atk, pl) => this.playerAttack(hb, dmg, atk, pl);
    wd.spawnPlayerProj = (k, x, y, d) => wd.projs.push(new Game.Proj(k, x, y, d));
    this.fade = 1; this.hint = null; this.hintA = 0; this.quipT = 16; this.done = false;
  }
  playerAttack(hb, dmg, atk, pl) {
    const wd = this.world;
    for (const e of wd.enemies) {
      if (atk.hit.has(e) || e.dieT != null) continue;
      if (U.overlap(hb, e.box)) {
        atk.hit.add(e);
        const killed = e.hit(dmg, pl.facing);
        Sound.play('hit'); G.hitStop = 0.05; G.shake(2, 0.1);
        FX.burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 6, { colors: ['#fff', '#ffd84a'], speed: 120, life: 0.25, grav: 0 });
        if (killed) { wd.addScore(e.score); wd.stats.kills++; FX.popText(e.x, e.y - 50, '+' + e.score); }
      }
    }
    for (const h of wd.hazards.concat(this.grenades)) {
      if (h.deflected || atk.hit.has(h)) continue;
      if (U.overlap(hb, h.box)) { atk.hit.add(h); h.deflected = true; h.vx = pl.facing * 320; h.vy = -200; if (h.fuse != null) { h.fuse = null; } wd.addScore(50); Sound.play('deflect'); FX.popText(h.x, h.y - 10, 'ОТБИЛ!', '#8cd0ff'); }
    }
  }
  update(dt) {
    const wd = this.world, pl = this.player;
    wd.t += dt; if (!this.done) this.level.stats.time += dt;
    if (this.fade > 0 && !this.respawning) this.fade = Math.max(0, this.fade - dt * 2);
    if (this.blind > 0) this.blind = Math.max(0, this.blind - dt * 0.6);
    this.weather.update(dt);
    wd.updatePlats(dt);
    pl.update(dt, wd);
    if (pl.x > L7.ARENA_X - 10 && !this.done) pl.x = Math.min(pl.x, L7.ARENA_X + 40);
    for (const e of wd.enemies) if (Math.abs(e.x - pl.x) < 900) e.update(dt, wd, pl, this);
    wd.enemies = wd.enemies.filter(e => !e.dead);
    for (const p of wd.projs) {
      p.update(dt, wd, pl);
      for (const e of wd.enemies) {
        if (p.dead || e.dieT != null || p.hitSet.has(e)) continue;
        if (U.overlap(p.box, e.box)) { p.hitSet.add(e); const k = e.hit(p.dmg, p.dir); Sound.play('hit'); if (k) { wd.addScore(e.score); wd.stats.kills++; } if (!p.pierce) { p.dead = true; p.poof(); } }
      }
    }
    wd.projs = wd.projs.filter(p => !p.dead);
    for (const h of wd.hazards) {
      h.update(dt, wd, pl);
      if (h.deflected) for (const e of wd.enemies) if (e.dieT == null && U.overlap(h.box, e.box)) { h.shatter(wd); if (e.hit(2, h.vx > 0 ? 1 : -1)) { wd.addScore(e.score); wd.stats.kills++; } }
    }
    wd.hazards = wd.hazards.filter(h => !h.dead);
    for (const g of this.grenades) {
      if (g.deflected) { g.vy += 900 * dt; g.x += g.vx * dt; g.y += g.vy * dt; for (const e of wd.enemies) if (e.dieT == null && U.overlap(g.box, e.box)) { g.dead = true; Sound.play('boom'); FX.burst(g.x, g.y, 12, { colors: ['#fff', '#ffd84a'], speed: 160, life: 0.35, grav: 0 }); if (e.hit(3, g.vx > 0 ? 1 : -1)) { wd.addScore(e.score); wd.stats.kills++; } } if (g.y > L7.GROUND) g.dead = true; }
      else g.update(dt, wd, pl, this);
    }
    this.grenades = this.grenades.filter(g => !g.dead);
    if (this.crane) this.crane.update(dt, wd, pl);
    for (const p of wd.pickups) p.update(dt, wd, pl);
    wd.pickups = wd.pickups.filter(p => !p.dead);
    for (const cp of wd.checkpoints) if (!cp.active && Math.abs(pl.x - cp.x) < 24 && !pl.dead) { cp.active = true; this.respawn = { x: cp.x }; Sound.play('checkpoint'); pl.heal(20); FX.popText(cp.x, L7.GROUND - 70, 'КОНТРОЛЬНАЯ ТОЧКА', '#8cf08c'); }
    let hint = null;
    for (const h of this.hints) if (!h.done && pl.x > h.x && pl.x < h.x + h.w) { hint = h; h.shown += dt; if (h.shown > 6) h.done = true; }
    if (hint) { this.hint = hint; this.hintA = Math.min(1, this.hintA + dt * 4); } else this.hintA = Math.max(0, this.hintA - dt * 3);
    this.quipT -= dt;
    if (this.quipT <= 0 && !pl.dead) { this.quipT = U.rand(20, 32); G.say(pl, U.choice(['Понаехали тут из столицы...', 'Какой ещё фоторобот?!', 'Я в своём городе по забору лезу...', 'Ничего, найду вход.', 'Дождь, грязь, спецназ... Красота.']), 2); }
    const tx = U.clamp(pl.x - W * 0.4 + pl.facing * 30, 0, L7.W - W);
    wd.cam.x += (tx - wd.cam.x) * Math.min(1, dt * 5);
    if (pl.dead && pl.deadT > 1.6 && !this.respawning) this.respawning = true;
    if (this.respawning) {
      this.fade = Math.min(1, this.fade + dt * 2.5);
      if (this.fade >= 1) {
        this.respawning = false; this.level.stats.deaths++;
        const np = new L7.Player(this.respawn.x, L7.GROUND);
        np.ammo = Object.assign({}, pl.ammo); np.weapon = pl.weapon;
        this.player = np; wd.hazards = []; this.grenades = []; this.blind = 0; if (this.crane) this.crane.drops = [];
        wd.cam.x = U.clamp(np.x - 200, 0, L7.W - W);
        G.say(np, U.choice(['Так, ещё разок!', 'Меня так просто не возьмёшь!']), 1.5);
      }
    }
    if (!this.done && pl.x > L7.ARENA_X + 30 && !pl.dead) { this.done = true; pl.controls = false; this.level.reachSquare(this); }
  }
  draw(c) {
    const wd = this.world, cx = Math.round(wd.cam.x);
    L7.drawLayers(c, cx);
    L7.drawBuildings(c, cx, this.buildings);
    L7.drawGround(c, cx, this.buildings);
    for (const l of wd.ladders) Art.ladder(c, { x: l.x - cx, y: l.y, w: l.w, h: l.h });
    for (const p of this.props) if (!p.def.ladder && p.x - cx > -260 && p.x - cx < W + 260 && L7.has('props7')) Spr.draw(c, 'props7', p.def.i, p.x - cx, p.y, 1);
    for (const cp of wd.checkpoints) Art.checkpoint(c, cp.x - cx, L7.GROUND, cp.active, wd.t);
    for (const p of wd.pickups) p.draw(c, cx, 0);
    for (const e of wd.enemies) if (Math.abs(e.x - cx - W / 2) < W) e.draw(c, cx, 0);
    this.player.draw(c, cx, 0);
    for (const h of wd.hazards) h.draw(c, cx, 0);
    for (const g of this.grenades) g.draw(c, cx);
    if (this.crane) this.crane.draw(c, cx);
    for (const p of wd.projs) p.draw(c, cx, 0);
    c.save(); c.translate(-cx, 0); FX.draw(c); c.restore();
    L7.drawForeground(c, cx, this.D.fg);
    this.weather.draw(c);
    G.drawBubbles(c, cx, 0);
    if (this.blind > 0) { c.fillStyle = `rgba(255,255,250,${Math.min(0.92, this.blind)})`; c.fillRect(0, 0, W, H); }
    Game.drawHUD(c, this.player, wd);
    const left = Math.max(0, Math.round((L7.ARENA_X - this.player.x) / 16));
    G.text('ДО ЗАВОДОУПРАВЛЕНИЯ: ' + left + ' м', W - 8, 22, { align: 'right', color: '#e8c8b8' });
    if (this.hint) Game.drawHint(c, this.hint.text, this.hintA);
    if (this.fade > 0) { c.fillStyle = `rgba(0,0,0,${this.fade})`; c.fillRect(0, 0, W, H); }
  }
};

// ---------- босс: командир спецназа на площади ----------
// фазы: 1 — рукопашка, гранаты, вызов подкрепления по рации (тогда уязвим); 2 (<50%) — очереди из автомата (пригнись!)
const BOSS7_LINES = ['Фоторобот не врёт!', 'Сдавайся, рыжий!', 'Приказ из Столицы!', 'Взять его!', 'Ты не пройдёшь!'];
L7.Boss = class {
  constructor(x) {
    this.x = x; this.y = L7.GROUND; this.facing = -1; this.maxHp = Math.round(105 * (G.BOSS_MULT || 1)); this.hp = this.maxHp;
    this.state = 'wait'; this.st = 0; this.t = 0; this.flash = 0; this.phase = 1; this.anim = 'idle'; this.animT = 0; this.vx = 0; this.vy = 0;
    this.inv = 0; this.cool = 1; this.radioT = 5; this.shots = 0; this.headH = 100; this.voice = 140; this.quip = 4; this.combo = 0;
  }
  get box() { return { x: this.x - 12, y: this.y - 80, w: 24, h: 80 }; }
  get weak() { return this.state === 'radio' || this.state === 'reload'; }
  set(s) { this.state = s; this.st = 0; }
  update(dt, ar) {
    const pl = ar.player;
    this.t += dt; this.st += dt; this.animT += dt; this.cool -= dt; this.radioT -= dt; this.quip -= dt;
    if (this.flash > 0) this.flash -= dt; if (this.inv > 0) this.inv -= dt;
    const dx = pl.x - this.x, adx = Math.abs(dx), face = () => { this.facing = dx > 0 ? 1 : -1; };
    const sp = this.phase === 2 ? 1.2 : 1;
    let a = 'idle';
    if (this.quip <= 0 && this.state !== 'down') { this.quip = U.rand(5, 8); G.say(this, U.choice(BOSS7_LINES), 1.5); }
    switch (this.state) {
      case 'wait': a = 'idle'; break;
      case 'idle':
        face();
        if (this.st > 0.5 / sp) {
          if (this.radioT <= 0) { this.set('radio'); this.radioT = U.rand(10, 13); G.say(this, 'Первый, первый! Нужно подкрепление!', 1.6); }
          else if (this.phase === 2 && this.cool <= 0 && adx > 110) { this.set('aim'); this.shots = 0; }
          else if (adx > 170 && this.cool <= 0 && Math.random() < 0.5) this.set('gWind');
          else this.set('dash');
        }
        break;
      case 'dash': face(); a = 'run'; this.x += this.facing * 190 * sp * dt; if (adx < 44) this.set(Math.random() < 0.35 ? 'kickW' : 'wind'); if (this.st > 1.5) this.set('idle'); break;
      case 'wind': a = 'wind'; if (this.st > 0.32 / sp) { this.set('punch'); Sound.play('punch'); } break;
      case 'punch':
        a = 'punch';
        if (this.st < 0.12) { const hb = { x: this.x + (this.facing > 0 ? 4 : -42), y: this.y - 66, w: 42, h: 36 }; if (U.overlap(hb, pl.box)) pl.hurt(this.phase === 2 ? 13 : 10, this.x, ar.world); }
        if (this.st > 0.34) { this.combo++; if (this.combo < 2 && adx < 64) this.set('wind'); else { this.combo = 0; this.set('idle'); } }
        break;
      case 'kickW': a = 'wind'; if (this.st > 0.4) { this.set('kick'); Sound.play('punch'); } break;
      case 'kick':
        a = 'kick'; this.x += this.facing * 120 * dt;
        if (this.st < 0.16) { const hb = { x: this.x + (this.facing > 0 ? 4 : -54), y: this.y - 60, w: 54, h: 30 }; if (U.overlap(hb, pl.box) && pl.hurt(15, this.x, ar.world)) { pl.vx = this.facing * 300; pl.vy = -260; } }
        if (this.st > 0.45) this.set('idle');
        break;
      case 'gWind':
        face(); a = 'gWind';
        if (this.st > 0.45) {
          const sx = this.x + this.facing * 14, sy = this.y - 64, tx = pl.x, ty = pl.y - 10, T = 0.8 + Math.abs(tx - sx) / 900, g = 900;
          ar.grenades.push(new L7.Grenade(sx, sy, (tx - sx) / T, (ty - sy - 0.5 * g * T * T) / T)); Sound.play('throw');
          this.cool = 2.5; this.set('gThrow');
        }
        break;
      case 'gThrow': a = 'gThrow'; if (this.st > 0.35) this.set('idle'); break;
      case 'radio':
        a = 'radio';
        if (this.st > 0.8 && !this.called) { this.called = true; ar.callGuards(); }
        if (this.st > 2.6) { this.called = false; this.set('idle'); }
        break;
      case 'aim': face(); a = 'aim'; if (this.st > 0.6) this.set('shoot'); break;
      case 'shoot':
        a = 'shoot';
        if (this.st < dt * 1.5) { ar.bullets.push({ x: this.x + this.facing * 30, y: this.y - 52, vx: this.facing * 400, t: 0 }); Sound.play('shot'); G.shake(2, 0.1); FX.burst(this.x + this.facing * 34, this.y - 54, 5, { colors: ['#fff6a0', '#ffb040'], speed: 80, life: 0.15, grav: 0 }); }
        if (this.st > 0.28) { this.shots++; if (this.shots < 4) this.set('aim'); else { this.set('reload'); G.say(this, 'Перезаряжаю!', 1.2); } }
        break;
      case 'reload': a = 'radio'; if (this.st > 2.0) { this.cool = 3.5; this.set('idle'); } break;
      case 'hurt': a = 'hurt'; this.x += this.vx * dt; this.vx *= 0.85; if (this.st > 0.25) this.set('idle'); break;
      case 'rage': a = 'radio'; if (this.st > 1.4) { this.phase = 2; this.cool = 0; this.set('aim'); this.shots = 0; } break;
      case 'down': a = 'ko'; break;
    }
    this.x = U.clamp(this.x, L7.ARENA_X + 24, L7.ARENA_X + W - 24);
    if (a !== this.anim) { this.anim = a; this.animT = 0; }
  }
  hit(dmg, dir, ar) {
    if (this.state === 'down' || this.state === 'rage' || this.state === 'wait') return;
    if (this.inv > 0 && !this.weak) return;
    const mult = this.weak ? 2 : this.phase === 2 ? 0.7 : 1;
    if (!this.weak) this.inv = 0.15;
    this.hp -= dmg * mult; this.flash = 0.12; Sound.play('hit'); G.hitStop = 0.05;
    if (mult > 1) FX.popText(this.x, this.y - 96, 'x2!', '#ffd84a', 16);
    if (this.hp <= 0) { this.hp = 0; this.set('down'); ar.bossDown(); return; }
    if (this.phase === 1 && this.hp <= this.maxHp / 2) { this.set('rage'); Sound.play('boom'); G.shake(6, 0.6); G.say(this, 'Всё! Огонь на поражение!', 2, { shout: true }); ar.hint = 'Командир стреляет! Пригнись {down} — пули пролетят над головой!'; ar.hintT = 6; return; }
    // серия ударов подряд — отскакивает и кидает гранату (не даём «запинать» в углу)
    this.combo2 = this.t - (this.lastHit || -9) < 1.0 ? (this.combo2 || 0) + 1 : 1; this.lastHit = this.t;
    if (this.combo2 >= 4 && !this.weak) { this.combo2 = 0; this.inv = 0.6; this.x = U.clamp(this.x + dir * 150, L7.ARENA_X + 24, L7.ARENA_X + W - 24); this.facing = -dir; G.say(this, 'Не так быстро!', 1); this.cool = 0; this.set('gWind'); return; }
    if (this.state === 'idle' || this.state === 'dash') { this.set('hurt'); this.vx = dir * 120; }
  }
  draw(c, cx) {
    Spr.drawAnim(c, 'boss7', this.anim, this.animT, this.x - cx, this.y, this.facing, { flash: this.flash > 0 ? '#ffffff' : null });
    if (this.weak && (G.t * 6 | 0) % 2) G.text('БЕЙ, ПОКА ОТВЛЁКСЯ!', this.x - cx, this.y - 104, { align: 'center', color: '#ffd84a', outline: true });
  }
};

L7.Arena = class {
  constructor(level, run) {
    this.level = level; this.run = run; this.world = run.world;
    this.player = run.player; this.player.controls = false;
    this.boss = new L7.Boss(L7.ARENA_X + 440);
    this.bullets = []; this.grenades = []; this.fighting = false; this.hint = null; this.hintA = 0; this.hintT = 0; this.actors = []; this.blind = 0;
    this.weather = run.weather;
    this.world.enemies = []; this.world.hazards = [];
    this.world.playerAttack = (hb, dmg, atk, pl) => {
      const b = this.boss;
      if (b && this.fighting && !atk.hit.has(b) && U.overlap(hb, b.box)) { atk.hit.add(b); b.hit(dmg, pl.facing, this); this.world.addScore(100 * dmg); G.shake(2, 0.1); FX.burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 7, { colors: ['#fff', '#ffd84a'], speed: 130, life: 0.25, grav: 0 }); }
      for (const e of this.world.enemies) if (!atk.hit.has(e) && e.dieT == null && U.overlap(hb, e.box)) { atk.hit.add(e); if (e.hit(dmg, pl.facing)) { this.world.addScore(e.score); this.level.stats.kills++; } Sound.play('hit'); }
      for (const g of this.grenades) if (!g.deflected && U.overlap(hb, g.box)) { g.deflected = true; g.vx = pl.facing * 320; g.vy = -200; g.fuse = null; Sound.play('deflect'); }
    };
    this.quipT = 4; this.dropped = {};
  }
  callGuards() {
    for (const side of [-1, 1]) {
      const e = new L7.Foe(side < 0 ? 'chop' : 'spz', L7.ARENA_X + (side < 0 ? -20 : W + 20), { x1: L7.ARENA_X + 20, x2: L7.ARENA_X + W - 20, aggro: true });
      e.state = 'chase'; e.fitted = true; this.world.enemies.push(e);
    }
  }
  startFight() { this.fighting = true; this.player.controls = true; this.boss.set('idle'); this.hint = 'Командир зовёт подкрепление по рации — в это время бей его вдвойне!'; this.hintT = 6; }
  bossDown() {
    this.fighting = false; this.player.controls = false; this.bullets = []; this.grenades = []; this.world.enemies = [];
    this.world.addScore(6000); this.level.stats.kills++;
    G.shake(8, 0.5); G.flash(0.2); Music.stop(); Sound.play('boom');
    setTimeout(() => this.level.bossDefeated(), 1400);
  }
  update(dt) {
    const wd = this.world, pl = this.player, b = this.boss;
    wd.t += dt; if (this.fighting) this.level.stats.time += dt;
    this.weather.update(dt);
    if (this.blind > 0) this.blind = Math.max(0, this.blind - dt * 0.6);
    if (pl) { pl.update(dt, wd); pl.x = U.clamp(pl.x, L7.ARENA_X + 12, L7.ARENA_X + W - 12); }
    if (pl && b && b.update && (this.fighting || b.state === 'down')) b.update(dt, this);
    if (pl) for (const e of wd.enemies) e.update(dt, wd, pl, this);
    wd.enemies = wd.enemies.filter(e => !e.dead);
    for (const g of this.grenades) {
      if (g.deflected) { g.vy += 900 * dt; g.x += g.vx * dt; g.y += g.vy * dt; if (b && U.overlap(g.box, b.box)) { g.dead = true; Sound.play('boom'); FX.burst(g.x, g.y, 12, { colors: ['#fff', '#ffd84a'], speed: 160, life: 0.35, grav: 0 }); b.hit(4, g.vx > 0 ? 1 : -1, this); } if (g.y > L7.GROUND) g.dead = true; }
      else if (pl) g.update(dt, wd, pl, this);
    }
    this.grenades = this.grenades.filter(g => !g.dead);
    for (const bl of this.bullets) { bl.t += dt; bl.x += bl.vx * dt; if (pl && U.overlap({ x: bl.x - 5, y: bl.y - 2, w: 10, h: 4 }, pl.box)) { pl.hurt(12, bl.x - bl.vx, wd); bl.t = 9; } }
    this.bullets = this.bullets.filter(bl => bl.t < 2 && bl.x > L7.ARENA_X - 20 && bl.x < L7.ARENA_X + W + 20);
    for (const p of wd.projs) {
      p.update(dt, wd, pl);
      if (b && this.fighting && !p.dead && !p.hitSet.has(b) && U.overlap(p.box, b.box)) { p.hitSet.add(b); b.hit(p.dmg, p.dir, this); if (!p.pierce) { p.dead = true; p.poof(); } }
      for (const e of wd.enemies) if (!p.dead && e.dieT == null && !p.hitSet.has(e) && U.overlap(p.box, e.box)) { p.hitSet.add(e); e.hit(p.dmg, p.dir); if (!p.pierce) { p.dead = true; p.poof(); } }
    }
    wd.projs = wd.projs.filter(p => !p.dead);
    if (pl) for (const p of wd.pickups) p.update(dt, wd, pl);
    wd.pickups = wd.pickups.filter(p => !p.dead);
    for (const a of this.actors) a.update(dt);
    if (this.fighting) {
      [70, 35].forEach(th => { if (b.hp <= th && !this.dropped[th]) { this.dropped[th] = 1; const p = new Game.Pickup(th === 70 ? 'nutsbox' : 'kefir', L7.ARENA_X + U.rand(120, 520), -10); p.falling = true; wd.pickups.push(p); } });
      this.quipT -= dt;
      if (this.quipT <= 0) { this.quipT = U.rand(7, 10); G.say(pl, U.choice(['Это мой город!', 'Пропусти, служивый!', 'Я просто поговорить!', 'Столичные, вон из Выборгска!']), 1.6); }
      if (pl.dead && pl.deadT > 1.6 && !this.resetting) { this.resetting = true; this.level.stats.deaths++; setTimeout(() => { this.resetting = false; this.level.restartBoss(); }, 400); }
    }
    if (this.hintT > 0) { this.hintT -= dt; this.hintA = Math.min(1, this.hintA + dt * 4); } else this.hintA = Math.max(0, this.hintA - dt * 3);
  }
  drawBack(c) {
    // площадь: заводоуправление во весь фон, мокрая плитка с отражением
    const I = L7.img;
    if (I.arena) c.drawImage(I.arena, 0, 0, W, H);
    else { L7.drawLayers(c, L7.ARENA_X); L7.drawGround(c, L7.ARENA_X); }
  }
  draw(c) {
    const wd = this.world, cx = L7.ARENA_X;
    this.drawBack(c);
    for (const p of wd.pickups) p.draw(c, cx, 0);
    for (const a of this.actors) a.draw(c, cx, 0);
    for (const e of wd.enemies) e.draw(c, cx, 0);
    if (this.boss && this.boss.draw) this.boss.draw(c, cx);
    if (this.player) this.player.draw(c, cx, 0);
    for (const bl of this.bullets) { Art.R(c, bl.x - cx - 5, bl.y - 1, 10, 3, '#ffe060'); Art.R(c, bl.x - cx - 12 * Math.sign(bl.vx), bl.y, 8, 1, 'rgba(255,220,120,0.5)'); }
    for (const g of this.grenades) g.draw(c, cx);
    for (const p of wd.projs) p.draw(c, cx, 0);
    c.save(); c.translate(-cx, 0); FX.draw(c); c.restore();
    this.weather.draw(c);
    G.drawBubbles(c, cx, 0);
    if (this.blind > 0) { c.fillStyle = `rgba(255,255,250,${Math.min(0.92, this.blind)})`; c.fillRect(0, 0, W, H); }
    if (this.player && this.fighting) Game.drawHUD(c, this.player, wd);
    if (this.boss && this.fighting) {
      const b = this.boss;
      Art.R(c, 160, H - 26, 320, 16, '#111'); Art.R(c, 162, H - 24, 316, 12, '#3a1010');
      Art.R(c, 162, H - 24, Math.round(316 * b.hp / b.maxHp), 12, b.weak ? '#ffd84a' : b.phase === 2 ? '#ff3020' : '#d83040');
      G.text('КОМАНДИР СПЕЦНАЗА', W / 2, H - 40, { align: 'center', color: '#e8b0a0', outline: true });
    }
    if (this.hint) Game.drawHint(c, this.hint, this.hintA, 44);
  }
};
