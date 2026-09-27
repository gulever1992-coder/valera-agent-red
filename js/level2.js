'use strict';
// ============ УРОВЕНЬ 2: «ДОРОГА ДОМОЙ» — вечерний Выборгск ============
const L2 = {};
G.L2 = L2;
L2.GROUND = 300;
L2.PANEL = 640;
L2.ARENA_X = 12000;
L2.W = L2.ARENA_X + 640;

// ---------- враги ----------
// кадры листов (см. tools/build_assets.py)
const FOE = {
  gopnik: { sheet: 'gopnik', hp: 4, w: 20, h: 66, score: 150, voice: 190, fr: { idle: 0, stand: 1, walk: [2, 3], wind: 1, attack: 4, hurt: 5, ko: 6 } },
  punk: { sheet: 'punk', hp: 5, w: 20, h: 70, score: 200, voice: 230, fr: { idle: 0, stand: 0, walk: [0], wind: 0, attack: 1, hurt: 2, ko: 3 } },
  bomzh: { sheet: 'bomzh', hp: 4, w: 22, h: 66, score: 150, voice: 140, fr: { idle: 0, stand: 0, walk: [0, 1], wind: 0, attack: 2, hurt: 0, ko: 3 } },
  alkash: { sheet: 'bomzh', hp: 3, w: 22, h: 66, score: 150, voice: 160, fr: { idle: 4, stand: 4, walk: [4], wind: 4, attack: 5, hurt: 6, ko: 7 } },
  dogS: { sheet: 'punk', hp: 1, w: 24, h: 18, score: 100, voice: 600, fr: { idle: 5, stand: 5, walk: [4, 5], wind: 5, attack: 5, hurt: 4, ko: 4 } },
  dogB: { sheet: 'punk', hp: 2, w: 40, h: 30, score: 150, voice: 120, fr: { idle: 7, stand: 7, walk: [7, 6], wind: 7, attack: 6, hurt: 7, ko: 7 } },
};
const FOE_LINES = {
  gopnik: ['Э, слышь!', 'Семки есть?', 'Ты с какого района?', 'Чё, самый умный?'],
  punk: ['Панки хой!', 'Анархия!', 'Щас как пну!'],
  bomzh: ['Подай на хлебушек!', 'Ой... простите...', 'Пардон муа...'],
  alkash: ['Будешь?!', 'На, лови!', 'Третьим будешь?'],
  dogS: ['Тяв! Тяв!'], dogB: ['Ррррр!', 'ГАВ!'],
};
L2.Foe = class {
  constructor(type, x, o = {}) {
    const d = FOE[type];
    Object.assign(this, { type, d, x, y: L2.GROUND, facing: -1, hp: d.hp, st: 0, t: Math.random() * 5, state: 'idle', vx: 0, vy: 0, flash: 0, dieT: null, dead: false, cool: 1 + Math.random(), score: d.score, voice: d.voice, headH: d.h + 12, x1: x - 260, x2: x + 260, kind: type, said: false }, o);
    this.ground = this.y;
  }
  get box() { return { x: this.x - this.d.w / 2, y: this.y - this.d.h, w: this.d.w, h: this.d.h }; }
  set(s) { this.state = s; this.st = 0; }
  hit(dmg, dir) {
    if (this.dieT != null) return false;
    this.hp -= dmg; this.flash = 0.12; this.vx = dir * 130;
    if (this.hp <= 0) {
      this.dieT = 0; this.vx = dir * 140; this.vy = -220;
      if (this.type === 'dogS' || this.type === 'dogB') { Sound.play('squeak'); G.say(this, 'Скуууу!', 1.0, { sound: false }); }
      return true;
    }
    if (this.state !== 'lunge' && this.state !== 'fart' && this.state !== 'throw') this.set('hurt');
    return false;
  }
  // опора под ногами: при появлении сужаем зону патруля до её краёв
  support(wd) {
    let best = null;
    for (const p of wd.plats) {
      if (this.x < p.x - 2 || this.x > p.x + p.w + 2) continue;
      if (Math.abs(p.y - this.y) <= 3 && (!best || p.y < best.y)) best = p;
    }
    return best;
  }
  fitPatrol(wd) {
    const p = this.support(wd);
    if (!p) { this.falling = true; return; }
    if (p.w < L2.W) { this.x1 = Math.max(this.x1, p.x + 10); this.x2 = Math.min(this.x2, p.x + p.w - 10); }
    if (this.x1 > this.x2) this.x1 = this.x2 = p.x + p.w / 2;
    this.x = U.clamp(this.x, this.x1, this.x2);
  }
  gravity(dt, wd) {
    if (this.state === 'lunge') return;
    if (!this.falling && !this.support(wd)) this.falling = true;
    if (!this.falling) return;
    const py = this.y;
    this.vy = Math.min(700, (this.vy || 0) + 1500 * dt); this.y += this.vy * dt;
    const g = wd.groundAt(this.x, py, this.y, 4);
    if (g) { this.y = g.y; this.vy = 0; this.falling = false; this.ground = g.y; this.x1 = this.x - 260; this.x2 = this.x + 260; this.fitPatrol(wd); }
  }
  update(dt, wd, pl) {
    this.t += dt; this.st += dt; if (this.flash > 0) this.flash -= dt; this.cool -= dt;
    if (!this.fitted) { this.fitted = true; this.fitPatrol(wd); }
    if (this.dieT == null) this.gravity(dt, wd);
    if (this.dieT != null) {
      this.dieT += dt; this.vy += 1200 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
      const gg = wd.groundAt(this.x, this.y - this.vy * dt, this.y, 4);
      if (this.vy > 0 && gg) { this.y = gg.y; this.vy = 0; this.vx *= 0.85; }
      if (this.dieT > 1.8) this.dead = true;
      return;
    }
    const dx = pl.x - this.x, adx = Math.abs(dx), near = Math.abs(pl.y - this.y) < 50 && !pl.dead;
    const face = () => { this.facing = dx > 0 ? 1 : -1; };
    const move = sp => { this.x = U.clamp(this.x + this.facing * sp * dt, this.x1, this.x2); };
    const talk = () => { if (!this.said && Math.random() < 0.8) { this.said = true; G.say(this, U.choice(FOE_LINES[this.type]), 1.6); } };
    if (!pl.dead) this.bodyHit(pl, wd, dt);
    if (this.state === 'hurt') { this.x = U.clamp(this.x + this.vx * dt, this.x1, this.x2); this.vx *= 0.85; if (this.st > 0.3) this.set('chase'); return; }
    switch (this.type) {
      case 'gopnik':
        if (this.state === 'idle') { if (near && (adx < 210 || this.aggro)) { this.set('rise'); talk(); } if (Math.random() < dt * 0.6) FX.spawn({ x: this.x + this.facing * 8, y: this.y - 30, vx: this.facing * 40, vy: -30, life: 0.5, color: '#2a2a2a', size: 2 }); }
        else if (this.state === 'rise') { face(); if (this.st > 0.45) this.set('chase'); }
        else if (this.state === 'chase') { face(); move(95); if (adx < 34 && near) this.set('wind'); }
        else if (this.state === 'wind') { if (this.st > 0.32) this.set('attack'); }
        else if (this.state === 'attack') { if (this.st < 0.12) this.meleeHit(pl, wd, 36, 10); if (this.st > 0.3) this.set('recover'); }
        else if (this.state === 'recover') { if (this.st > 0.35) this.set('chase'); }
        break;
      case 'punk':
        if (this.state === 'idle') { if (near && (adx < 240 || this.aggro)) { this.set('chase'); talk(); } }
        else if (this.state === 'chase') { face(); move(125); if (adx < 44 && near) this.set('wind'); }
        else if (this.state === 'wind') { if (this.st > 0.3) { this.set('attack'); Sound.play('throw'); } }
        else if (this.state === 'attack') { if (this.st < 0.14) this.meleeHit(pl, wd, 48, 13); if (this.st > 0.35) this.set('recover'); }
        else if (this.state === 'recover') { if (this.st > 0.6) this.set('chase'); }
        break;
      case 'bomzh':
        if (this.state === 'idle' || this.state === 'chase') {
          if (near && (adx < 280 || this.aggro)) { face(); move(this.aggro ? 45 : 28); talk(); this.state = 'chase'; }
          if (near && adx < 130 && this.cool <= 0) { this.set('fart'); this.cool = 4.5; }
        } else if (this.state === 'fart') {
          if (this.st > 0.3 && !this.farted) { this.farted = true; wd.clouds.push({ x: this.x - this.facing * 14, y: this.y - 26, t: 0, life: 4.5, r: 44 }); Sound.play('fart'); G.say(this, U.choice(['Ой... простите...', 'Пардон муа...', 'Это не я!']), 1.4); }
          if (this.st > 0.9) { this.farted = false; this.set('chase'); }
        }
        break;
      case 'alkash':
        face();
        if (this.state === 'idle' && Math.abs(pl.y - this.y) < 150 && !pl.dead && adx > 50 && (adx < 330 || this.aggro) && this.cool <= 0) { this.set('throw'); talk(); }
        else if (this.state === 'throw') {
          if (this.st > 0.25 && !this.thrown) {
            this.thrown = true;
            const sx = this.x + this.facing * 10, sy = this.y - 58, tx = pl.x + pl.vx * 0.3, ty = pl.y - 10;
            const T = 0.8 + Math.abs(tx - sx) / 900, g = 1500 * 0.6;
            wd.hazards.push(new Game.Hazard('bottle', sx, sy, (tx - sx) / T, (ty - sy - 0.5 * g * T * T) / T));
            Sound.play('throw');
          }
          if (this.st > 0.6) { this.thrown = false; this.cool = 1.5; this.set('idle'); }
        }
        break;
      case 'dogS':
        if (near && (adx < 320 || this.aggro)) {
          face();
          if (adx > 14) { this.x = U.clamp(this.x + this.facing * 200 * dt, this.x1, this.x2); this.state = 'chase'; } else this.state = 'bark';
          if (this.cool <= 0 && U.overlap(this.box, pl.box)) { pl.hurt(7, this.x, wd); this.cool = 0.7; }
          if (Math.random() < dt * 1.5) { Sound.play('bark'); if (Math.random() < 0.3) G.say(this, 'Тяв!', 0.6, { sound: false }); }
        } else this.state = 'idle';
        break;
      case 'dogB':
        if (this.state === 'lunge') {
          this.vy += 1500 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
          if (U.overlap(this.box, pl.box) && !this.bit) { this.bit = true; pl.hurt(12, this.x, wd); }
          const gl = wd.groundAt(this.x, this.y - this.vy * dt, this.y, 6);
          if (this.vy > 0 && gl) { this.y = gl.y; this.set('chase'); this.cool = 1.6; this.bit = false; this.fitPatrol(wd); }
        } else if (near && (adx < 340 || this.aggro)) {
          face(); this.state = 'chase'; this.x = U.clamp(this.x + this.facing * 170 * dt, this.x1, this.x2);
          if (adx < 130 && this.cool <= 0) { this.set('lunge'); this.vx = this.facing * 250; this.vy = -330; Sound.play('bark'); G.say(this, 'ГАВ!', 0.6, { sound: false }); }
        } else this.state = 'idle';
        break;
    }
  }
  bodyHit(pl, wd, dt) {
    // толкучка: влетел в хулигана — получи
    this.bodyCool = (this.bodyCool || 0) - dt;
    if (this.bodyCool <= 0 && (this.type === 'gopnik' || this.type === 'punk' || this.type === 'bomzh') && U.overlap(this.box, pl.box)) { this.bodyCool = 0.8; pl.hurt(4, this.x, wd); }
  }
  meleeHit(pl, wd, reach, dmg) {
    const hb = { x: this.x + (this.facing > 0 ? 4 : -reach), y: this.y - 60, w: reach, h: 36 };
    if (U.overlap(hb, pl.box)) pl.hurt(dmg, this.x, wd);
  }
  frame() {
    const f = this.d.fr, s = this.state;
    if (this.dieT != null) return f.ko;
    if (s === 'hurt') return f.hurt;
    if (s === 'wind' || s === 'rise') return f.wind;
    if (s === 'attack' || s === 'fart' || s === 'throw' || s === 'lunge') return f.attack;
    if (s === 'chase' || s === 'bark') { const w = f.walk; return s === 'bark' ? f.attack : w[Math.floor(this.t * 7) % w.length]; }
    return f.idle;
  }
  draw(c, cx, cy) {
    let rot = 0, y = this.y - cy;
    const dog = this.type === 'dogS' || this.type === 'dogB';
    if (this.dieT != null && dog) rot = Math.PI;
    if (this.type === 'alkash' && this.state === 'idle') rot = Math.sin(this.t * 2) * 0.06;
    if (this.type === 'punk' && (this.state === 'chase' || this.state === 'idle')) y -= Math.abs(Math.sin(this.t * 8)) * 2;
    const alpha = this.dieT != null && this.dieT > 1.3 ? (1.8 - this.dieT) / 0.5 : 1;
    Spr.draw(c, this.d.sheet, this.frame(), this.x - cx, y - (rot ? 10 : 0), this.facing, { rot, flash: this.flash > 0 ? '#ffffff' : null, alpha });
  }
};

// ---------- «Матиз» с нетрезвым водителем ----------
const MATIZ_LINES = ['Э, пешеход! С дороги!', 'Я трезвый как стёклышко!', 'Где тут тормоз?!', 'Поберегись, рыжий!', 'У меня права купленные!', 'Би-би, ёлы-палы!'];
L2.Matiz = class {
  constructor(x1, x2) { this.x1 = x1; this.x2 = x2; this.x = -999; this.active = false; this.t = 0; this.cool = 1.5; this.warn = 0; this.headH = 64; this.voice = 170; this.first = true; }
  get box() { return { x: this.x - 55, y: L2.GROUND - 44, w: 110, h: 44 }; }
  update(dt, wd, pl, cam) {
    this.t += dt;
    const inZone = pl.x > this.x1 - 200 && pl.x < this.x2 + 100;
    if (!this.active) {
      if (!inZone) return;
      this.cool -= dt;
      if (this.cool <= 0 && this.warn <= 0) { this.warn = 1.1; Sound.play('honk'); }
      if (this.warn > 0) { this.warn -= dt; if (this.warn <= 0) { this.active = true; this.x = cam + W + 80; this.said = false; } }
      return;
    }
    this.x -= 400 * dt;
    if (!this.said && this.x < cam + W - 60) {
      this.said = true; G.say(this, U.choice(MATIZ_LINES), 1.6, { sound: false }); Sound.play('honk');
      if (this.first || Math.random() < 0.5) { this.first = false; setTimeout(() => G.say(pl, 'ГРАБЛИОНОК!', 1.4, { shout: true }), 600); }
    }
    if (Math.random() < dt * 20) FX.spawn({ x: this.x + 50, y: L2.GROUND - 6, vx: 60, vy: -20, grav: -10, life: 0.6, color: '#6a6a6a', size: 3, type: 'puff' });
    if (U.overlap(this.box, pl.box) && !pl.dead) { if (pl.hurt(18, this.x + 100, wd)) { pl.vx = -300; pl.vy = -360; G.shake(6, 0.3); Sound.play('brick'); } }
    if (this.x < cam - 200) { this.active = false; this.cool = U.rand(3.5, 5.5); }
  }
  draw(c, cx) {
    if (this.warn > 0 && (G.t * 8 | 0) % 2) {
      Art.R(c, W - 30, L2.GROUND - 70, 22, 22, '#111'); Art.R(c, W - 28, L2.GROUND - 68, 18, 18, '#e03030');
      G.text('!', W - 19, L2.GROUND - 64, { align: 'center', color: '#fff', shadow: false });
    }
    if (!this.active) return;
    const fr = (this.t * 10 | 0) % 2;
    Spr.draw(c, 'matiz', fr, this.x - cx, L2.GROUND + (fr ? 1 : 0), 1);
  }
};

// ---------- шпионы-спецназовцы на фоне ----------
// corner — выглядывает из-за угла здания (здание рисуется поверх и прячет половину),
// prone — лежит на крыше, bush — сидит в кустах парка
L2.Spy = class {
  constructor(d) { Object.assign(this, d); this.show = 0; this.t = Math.random() * 5; this.out = -(d.dir || 1); }
  get behind() { return true; }
  update(dt, pl) {
    this.t += dt;
    const d = Math.abs(pl.x - this.x);
    const want = d < 460 && d > 110;
    this.show = U.clamp(this.show + (want ? dt * 1.2 : -dt * 3), 0, 1);
  }
  draw(c, cx) {
    if (this.show <= 0) return;
    const k = U.easeInOut(this.show);
    if (this.kind === 'corner') {
      // стоит за углом: видна только голова и плечо, остальное закрыто зданием
      const x = this.x + this.out * U.lerp(-30, -8, k);
      Spr.draw(c, 'cmd', 4, x - cx, this.y, this.out > 0 ? 1 : -1);
    } else {
      // поднимается из-за крыши: пока спрятан — целиком за зданием
      Spr.draw(c, 'cmd', 4, this.x - cx, this.y + U.lerp(92, 34, k) + Math.sin(this.t * 2), -1);
    }
  }
};

// ---------- постройка уровня ----------
// уличные объекты: индекс в атласе street, верх коллайдера (доля высоты), тип
const PROPS = {
  kiosk: { i: 0, top: 0.78, wf: 0.92, oneway: false },
  garages: { i: 1, top: 0.95, wf: 0.98, oneway: false },
  busstop: { i: 2, top: 0.96, wf: 0.78, oneway: true, dx: -0.08 },
  dumpster: { i: 3, top: 0.8, wf: 0.9, oneway: false },
  bench: { i: 4, top: 0.55, wf: 0.9, oneway: true },
  fence: { i: 5, top: 0.96, wf: 0.96, oneway: false },
  car: { i: 6, top: 0.62, wf: 0.9, oneway: false },
  crate: { i: 7, top: 1, wf: 1, oneway: false },
  ladder: { i: 8, ladder: true },
  lamp: { i: 9, deco: true },
  tlight: { i: 10, deco: true },
  barrel: { i: 11, top: 1, wf: 0.9, oneway: false },
};
// здания стоят вплотную к тротуару, слева направо (x — левый край)
L2.BUILD_LIST = [
  ['gate', 40], ['workshop', 760], ['hrush', 1720], ['shop', 2360], ['garages', 3060], ['dk', 3820], ['stele', 4700], ['nine', 5110],
  ['pipes', 6060], ['garages', 6700], ['hrush', 7460], ['nine', 8100], ['embank', 9050], ['embank', 9990], ['park', 11030],
];
L2.build = function () {
  const G0 = L2.GROUND, B = window.BUILDINGS;
  const D = { props: [], plats: [], foes: [], pickups: [], checkpoints: [], spies: [], hints: [], buildings: [], zebra: [8250, 8520] };
  D.plats.push({ x: 0, y: G0, w: L2.W, h: 60, oneway: false, look: 'none' });
  for (const [name, x] of L2.BUILD_LIST) {
    const b = B[name];
    D.buildings.push({ name, x, w: b.w, h: b.h });
    // крыши гаражей и трубы теплотрассы — по ним можно ходить
    if (b.tops) for (const [x0, x1, top] of b.tops) if (top > 40) D.plats.push({ x: x + x0 + 4, y: G0 - top, w: x1 - x0 - 8, h: 8, oneway: true, look: 'none' });
  }
  const shop = D.buildings.find(b => b.name === 'shop');
  D.shopDoor = { x: shop.x + B.shop.door, w: 40 };
  const prop = (type, x, y = G0) => D.props.push({ type, x, y });
  const foe = (type, x, o) => D.foes.push({ type, x, o });
  const pick = (kind, x, y = 0) => D.pickups.push({ kind, x, y });
  const roofY = name => { const t = B[name].tops.reduce((m, t) => (t[1] - t[0] > m[1] - m[0] ? t : m)); return G0 - t[2]; };
  // 1. проходная и цех
  prop('bench', 520); prop('dumpster', 900); prop('crate', 950); prop('barrel', 1300);
  foe('gopnik', 620); foe('dogS', 1050); foe('gopnik', 1250); foe('punk', 1520);
  pick('pie', 950); pick('coin', 1300);
  D.hints.push({ x: 0, w: 450, text: 'Иди домой! Бей хулиганов {punch}, прыгай {jump}, приседай {down}.' });
  // 2. улица с магазином
  prop('kiosk', 1880); prop('busstop', 2150); prop('car', 2330);
  foe('gopnik', 1960); foe('gopnik', 2060); foe('alkash', 1880, { onProp: 'kiosk' }); foe('dogS', 2230);
  foe('punk', 2860); foe('gopnik', 2960);
  pick('coin', 2150); pick('kefir', 2330);
  D.checkpoints.push({ x: 3010 });
  // 3. ряд гаражей — крыши
  prop('dumpster', 3035); prop('ladder', 3070);
  foe('bomzh', 3250); foe('alkash', 3420, { y: roofY('garages'), x1: 3300, x2: 3560 }); foe('punk', 3600, { y: roofY('garages'), x1: 3480, x2: 3700 });
  pick('badge', 3500, roofY('garages') - 1); pick('beer', 3690);
  D.hints.push({ x: 2990, w: 200, text: 'Залезай на крыши гаражей: с мусорного бака или по лестнице {up}.' });
  // 4. ДК и стела
  prop('bench', 3960); prop('busstop', 4260); prop('tlight', 4660); prop('car', 4860);
  foe('gopnik', 4000); foe('gopnik', 4110); foe('dogS', 4320); foe('alkash', 4250, { onProp: 'busstop' }); foe('dogB', 4560); foe('punk', 4930);
  pick('pie', 3960); pick('coin', 4860);
  D.hints.push({ x: 4200, w: 260, text: 'Маленькую собачку бей присев: {down}+{punch}!' });
  D.checkpoints.push({ x: 5060 });
  // 5. девятиэтажка
  prop('kiosk', 5420); prop('dumpster', 5720); prop('lamp', 5600);
  foe('bomzh', 5300); foe('gopnik', 5520); foe('alkash', 5420, { onProp: 'kiosk' }); foe('gopnik', 5640); foe('dogS', 5820);
  pick('beer', 5720);
  D.hints.push({ x: 5200, w: 260, text: 'Бомж испускает газы — не стой в зелёном облаке!' });
  // 6. теплотрасса — можно пройти поверху
  const pb = D.buildings.find(b => b.name === 'pipes');
  prop('crate', pb.x + 150, G0 - 86); prop('crate', pb.x + 400, G0 - 86);
  foe('bomzh', pb.x + 120); foe('punk', pb.x + 420); foe('alkash', pb.x + 270, { y: G0 - 198, x1: pb.x + 200, x2: pb.x + 340 });
  pick('badge', pb.x + 300, G0 - 199); pick('kefir', pb.x + 470);
  // 7. снова гаражи и хрущёвка
  prop('ladder', 6705); prop('barrel', 7400);
  foe('gopnik', 7000, { y: roofY('garages'), x1: 6760, x2: 7340 }); foe('dogB', 7200); foe('bomzh', 7550); foe('punk', 7800); foe('gopnik', 7900);
  pick('pelmeni', 7200, roofY('garages') - 1);
  D.checkpoints.push({ x: 8010 });
  // 8. проспект и зебра с «Матизом»
  prop('tlight', 8230); prop('tlight', 8540); prop('bench', 8700); prop('fence', 8900);
  foe('gopnik', 8760); foe('dogS', 8820);
  pick('beer', 8700);
  D.hints.push({ x: 8050, w: 200, text: 'Бешеный «Матиз»! Жди сигнала «!» и перепрыгивай машину.' });
  // 9. набережная
  prop('lamp', 9150); prop('crate', 9400); prop('crate', 9434); prop('crate', 9417, G0 - 34); prop('bench', 9800); prop('lamp', 10250); prop('dumpster', 10500);
  foe('alkash', 9300); foe('punk', 9560); foe('alkash', 9417, { y: G0 - 68, x1: 9405, x2: 9430 }); foe('dogB', 9900); foe('gopnik', 10100); foe('bomzh', 10400); foe('punk', 10700);
  pick('pie', 9800); pick('badge', 10500); pick('coin', 10250);
  D.checkpoints.push({ x: 10950 });
  // 10. парк
  prop('bench', 11250); prop('car', 11700);
  foe('dogS', 11100); foe('dogS', 11140); foe('dogS', 11190); foe('bomzh', 11420); foe('gopnik', 11600); foe('dogB', 11780);
  pick('pelmeni', 11300); pick('beer', 11700);
  // шпионы: за углами зданий, на крышах, в кустах парка
  const bx = name => D.buildings.filter(b => b.name === name);
  const ws = bx('workshop')[0], st = bx('stele')[0], nn = bx('nine'), gg = bx('garages'), pk = bx('park')[0];
  D.spies.push({ kind: 'corner', x: ws.x + ws.w - 4, y: G0, dir: -1 });
  D.spies.push({ kind: 'roof', x: gg[0].x + 430, y: roofY('garages') });
  D.spies.push({ kind: 'corner', x: st.x + 6, y: G0, dir: 1 });
  D.spies.push({ kind: 'corner', x: nn[0].x + nn[0].w - 4, y: G0, dir: -1 });
  D.spies.push({ kind: 'roof', x: gg[1].x + 200, y: roofY('garages') });
  D.spies.push({ kind: 'corner', x: nn[1].x + 6, y: G0, dir: 1 });
  D.spies.push({ kind: 'corner', x: pk.x + 706, y: G0, dir: 1 });
  // фонари на переднем плане (псевдо-объём)
  D.fg = [];
  for (let x = 300; x < L2.ARENA_X; x += U.randi(620, 860)) D.fg.push(x);
  return D;
};

// ---------- слои фона (бесшовно) ----------
L2.tile = function (c, img, off, y, w, h) {
  if (!img) return;
  let x = -((off % w) + w) % w;
  for (; x < W; x += w) c.drawImage(img, Math.floor(x), y, Math.ceil(w) + 1, h);
};
L2.drawLayers = function (c, camX) {
  const L = window.BUILDINGS._layers;
  L2.tile(c, L2.img.sky, camX * 0.06, 0, L.sky[0], L.sky[1]);
  L2.tile(c, L2.img.far, camX * 0.28, L2.GROUND - L.far[1] + 12, L.far[0], L.far[1]);
  c.fillStyle = 'rgba(20,26,44,0.18)'; c.fillRect(0, 0, W, L2.GROUND);
};
L2.drawBuildings = function (c, camX, list) {
  for (const b of list) {
    const x = b.x - camX;
    if (x > W || x + b.w < 0) continue;
    const img = L2.img['b_' + b.name];
    if (img) c.drawImage(img, Math.round(x), L2.GROUND - b.h + 2, b.w, b.h);
  }
};
L2.drawGround = function (c, camX, zebra) {
  const L = window.BUILDINGS._layers;
  L2.tile(c, L2.img.ground, camX, L2.GROUND - 8, L.ground[0], L.ground[1]);
  c.fillStyle = '#0c0d10'; c.fillRect(0, L2.GROUND - 8 + L.ground[1], W, H);
  if (zebra) {
    for (let x = zebra[0]; x < zebra[1]; x += 26) {
      const sx = x - camX; if (sx < -30 || sx > W) continue;
      c.fillStyle = 'rgba(220,220,210,0.75)';
      c.beginPath(); c.moveTo(sx, L2.GROUND + 14); c.lineTo(sx + 16, L2.GROUND + 14); c.lineTo(sx + 24, L2.GROUND + 58); c.lineTo(sx + 8, L2.GROUND + 58); c.fill();
    }
  }
};
L2.drawForeground = function (c, camX, list) {
  if (!list) return;
  c.save(); c.filter = 'brightness(0.32) saturate(0.6)';
  for (const x of list) {
    const sx = x - camX * 1.3 + (x * 0.3);
    if (sx < -80 || sx > W + 80) continue;
    Spr.draw(c, 'street', 9, sx, H + 30, 1, { scale: 1.6 });
  }
  c.restore();
};
L2.img = {};
L2.load = async function () {
  const B = window.BUILDINGS; if (!B) return;
  const jobs = Object.keys(B).filter(k => k[0] !== '_').map(async k => { L2.img['b_' + k] = await G.loadImage(B[k].img); });
  jobs.push((async () => { L2.img.sky = await G.loadImage('assets/b/sky.jpg'); })());
  jobs.push((async () => { L2.img.far = await G.loadImage('assets/b/far.png'); })());
  jobs.push((async () => { L2.img.ground = await G.loadImage('assets/b/ground.jpg'); })());
  await Promise.all(jobs);
};
L2.heroLeft = () => L2.ARENA_X + 320 - window.BUILDINGS.hero.w / 2;

// ---------- режим прохождения ----------
L2.Run = class {
  constructor(level) {
    this.level = level;
    const D = this.D = L2.build();
    const wd = this.world = new Game.World(L2.W, H);
    wd.stats = level.stats; wd.score = level.score;
    wd.addScore = n => { wd.score += n; level.score = wd.score; };
    wd.clouds = [];
    D.plats.forEach(p => wd.addPlat(p));
    this.props = D.props.map(p => {
      const def = PROPS[p.type];
      const [w, h] = Spr.size('street', def.i);
      const o = Object.assign({ w, h, def }, p);
      if (def.ladder) wd.ladders.push({ x: p.x - 8, y: p.y - h + 2, w: 16, h: h - 2 });
      else if (!def.deco) {
        const cw = w * def.wf, top = p.y - h * def.top;
        o.col = wd.addPlat({ x: p.x - cw / 2 + (def.dx || 0) * w, y: top, w: cw, h: p.y - top, oneway: def.oneway, look: 'none' });
      }
      return o;
    });
    const roofOf = (type, x) => { const pr = this.props.filter(p => p.type === type).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0]; return pr && pr.col ? pr.col.y : L2.GROUND; };
    this.buildings = D.buildings;
    wd.enemies = D.foes.map(f => {
      const o = Object.assign({}, f.o || {});
      if (o.onProp) { o.y = roofOf(o.onProp, f.x); o.x1 = f.x - 24; o.x2 = f.x + 24; }
      if (o.x1 == null && o.y != null) { o.x1 = f.x - 60; o.x2 = f.x + 60; }
      const e = new L2.Foe(f.type, f.x, o); e.ground = e.y; return e;
    });
    wd.pickups = D.pickups.map(p => { const k = new Game.Pickup(p.kind, p.x, p.y || 0); if (!p.y) k.falling = true; return k; });
    this.fg = D.fg;
    wd.checkpoints = D.checkpoints.map(c => Object.assign({ active: false, y: L2.GROUND }, c));
    this.hints = D.hints.map(h => Object.assign({ shown: 0 }, h));
    this.spies = D.spies.map(s => new L2.Spy(s));
    this.matiz = new L2.Matiz(D.zebra[0], D.zebra[1]);
    this.player = new Game.Player(level.startX || 80, L2.GROUND);
    if (level.carry) { Object.assign(this.player.ammo, level.carry.ammo); this.player.bottleHits = level.carry.bottleHits || 0; this.player.weapon = level.carry.weapon || 'nuts'; }
    this.respawn = { x: this.player.x };
    wd.cam.x = U.clamp(this.player.x - 200, 0, L2.W - W);
    wd.playerAttack = (hb, dmg, atk, pl) => this.playerAttack(hb, dmg, atk, pl);
    wd.spawnPlayerProj = (k, x, y, d) => wd.projs.push(new Game.Proj(k, x, y, d));
    this.fade = 1; this.hint = null; this.hintA = 0; this.quipT = 18; this.shopDone = !!level.shopDone; this.done = false;
  }
  playerAttack(hb, dmg, atk, pl) {
    const wd = this.world;
    for (const e of wd.enemies) {
      if (atk.hit.has(e) || e.dieT != null) continue;
      if (U.overlap(hb, e.box)) {
        atk.hit.add(e);
        const killed = e.hit(dmg, pl.facing);
        Sound.play(atk.kind === 'bottle' ? 'glassHit' : 'hit'); G.hitStop = 0.05; G.shake(2, 0.1);
        FX.burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 6, { colors: ['#fff', '#ffd84a'], speed: 120, life: 0.25, grav: 0 });
        if (killed) { wd.addScore(e.score); wd.stats.kills++; FX.popText(e.x, e.y - 50, '+' + e.score); }
      }
    }
    for (const h of wd.hazards) {
      if (h.deflected || atk.hit.has(h)) continue;
      if (U.overlap(hb, h.box)) { atk.hit.add(h); h.deflected = true; h.vx = pl.facing * 320; h.vy = -200; wd.stats.deflect++; wd.addScore(50); Sound.play('deflect'); FX.popText(h.x, h.y - 10, 'ОТБИЛ!', '#8cd0ff'); }
    }
  }
  update(dt) {
    const wd = this.world, pl = this.player, D = this.D;
    wd.t += dt; if (!this.done) this.level.stats.time += dt;
    if (this.fade > 0 && !this.respawning) this.fade = Math.max(0, this.fade - dt * 2);
    wd.updatePlats(dt);
    pl.update(dt, wd);
    if (pl.x > L2.ARENA_X - 10 && !this.done) pl.x = Math.min(pl.x, L2.ARENA_X + 40);
    for (const e of wd.enemies) e.update(dt, wd, pl);
    wd.enemies = wd.enemies.filter(e => !e.dead);
    // снаряды игрока по врагам
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
    for (const p of wd.pickups) p.update(dt, wd, pl);
    wd.pickups = wd.pickups.filter(p => !p.dead);
    // газовые облака бомжей
    for (const cl of wd.clouds) {
      cl.t += dt;
      if (Math.random() < dt * 14) FX.spawn({ x: cl.x + U.rand(-cl.r, cl.r) * 0.7, y: cl.y + U.rand(-20, 20), vx: U.rand(-10, 10), vy: -8, grav: -4, life: 1.2, color: U.choice(['#8ab83a', '#a8c848', '#6a9a2a']), size: 5, type: 'puff' });
      if (cl.t < cl.life && Math.abs(pl.x - cl.x) < cl.r && Math.abs(pl.y - 30 - cl.y) < 40) { cl.dmgT = (cl.dmgT || 0) - dt; if (cl.dmgT <= 0) { cl.dmgT = 0.5; if (pl.hurt(6, cl.x, wd) && Math.random() < 0.5) G.say(pl, U.choice(['Фу-у-у!', 'Чем тут воняет?!', 'Глаза режет!']), 1.2); } }
    }
    wd.clouds = wd.clouds.filter(cl => cl.t < cl.life);
    this.matiz.update(dt, wd, pl, wd.cam.x);
    for (const s of this.spies) s.update(dt, pl);
    // чекпоинты
    for (const cp of wd.checkpoints) if (!cp.active && Math.abs(pl.x - cp.x) < 24 && !pl.dead) { cp.active = true; this.respawn = { x: cp.x }; Sound.play('checkpoint'); pl.heal(15); FX.popText(cp.x, L2.GROUND - 70, 'КОНТРОЛЬНАЯ ТОЧКА', '#8cf08c'); }
    // подсказки
    let hint = null;
    for (const h of this.hints) if (!h.done && pl.x > h.x && pl.x < h.x + h.w) { hint = h; h.shown += dt; if (h.shown > 6) h.done = true; }
    if (hint) { this.hint = hint; this.hintA = Math.min(1, this.hintA + dt * 4); } else this.hintA = Math.max(0, this.hintA - dt * 3);
    // магазин
    if (!this.shopDone && pl.x > D.shopDoor.x - 20 && pl.x < D.shopDoor.x + 20 && pl.onGround && !pl.dead) {
      this.shopDone = true; this.level.shopDone = true; this.level.enterShop(this);
    }
    // реплики
    this.quipT -= dt;
    if (this.quipT <= 0 && !pl.dead) { this.quipT = U.rand(20, 32); G.say(pl, U.choice(['Скорей бы домой...', 'Что за район такой?!', 'Ноги гудят...', 'Хоть бы пельмени дома были.', 'Чувство, что за мной следят...']), 2); }
    // камера
    const tx = U.clamp(pl.x - W * 0.4 + pl.facing * 30, 0, L2.W - W);
    wd.cam.x += (tx - wd.cam.x) * Math.min(1, dt * 5);
    // смерть
    if (pl.dead && pl.deadT > 1.6 && !this.respawning) this.respawning = true;
    if (this.respawning) {
      this.fade = Math.min(1, this.fade + dt * 2.5);
      if (this.fade >= 1) {
        this.respawning = false; this.level.stats.deaths++;
        const np = new Game.Player(this.respawn.x, L2.GROUND);
        np.ammo = Object.assign({}, pl.ammo); np.bottleHits = Math.max(pl.bottleHits, this.shopDone ? 4 : 0); np.weapon = pl.weapon;
        this.player = np; wd.hazards = []; wd.clouds = [];
        wd.cam.x = U.clamp(np.x - 200, 0, L2.W - W);
        G.say(np, U.choice(['Так, ещё разок!', 'Я не сдамся!']), 1.5);
      }
    }
    // дошёл до двора
    if (!this.done && pl.x > L2.ARENA_X + 30 && !pl.dead) { this.done = true; pl.controls = false; this.level.reachYard(this); }
  }
  drawBG(c, camX, behind) {
    L2.drawLayers(c, camX);
    for (const s of this.spies) if (s.behind) s.draw(c, camX);
    L2.drawBuildings(c, camX, this.buildings);
    for (const s of this.spies) if (!s.behind) s.draw(c, camX);
    L2.drawGround(c, camX, this.D.zebra);
  }
  draw(c) {
    const wd = this.world, cx = Math.round(wd.cam.x);
    this.drawBG(c, cx);
    for (const l of wd.ladders) Art.ladder(c, { x: l.x - cx, y: l.y, w: l.w, h: l.h });
    for (const p of this.props) if (!p.def.ladder && p.x - cx > -200 && p.x - cx < W + 200) Spr.draw(c, 'street', p.def.i, p.x - cx, p.y, 1);
    for (const cp of wd.checkpoints) Art.checkpoint(c, cp.x - cx, L2.GROUND, cp.active, wd.t);
    for (const cl of wd.clouds) L3.drawCloud(c, cl, cx, 0);
    for (const p of wd.pickups) p.draw(c, cx, 0);
    for (const e of wd.enemies) e.draw(c, cx, 0);
    this.player.draw(c, cx, 0);
    this.matiz.draw(c, cx);
    for (const h of wd.hazards) h.draw(c, cx, 0);
    for (const p of wd.projs) p.draw(c, cx, 0);
    c.save(); c.translate(-cx, 0); FX.draw(c); c.restore();
    L2.drawForeground(c, cx, this.fg);
    G.drawBubbles(c, cx, 0);
    Game.drawHUD(c, this.player, wd);
    const left = Math.max(0, Math.round((L2.ARENA_X - this.player.x) / 16));
    G.text('ДО ДОМА: ' + left + ' м', W - 8, 22, { align: 'right', color: '#c8d0d8' });
    if (this.hint) Game.drawHint(c, this.hint.text, this.hintA);
    if (this.fade > 0) { c.fillStyle = `rgba(0,0,0,${this.fade})`; c.fillRect(0, 0, W, H); }
  }
};

// ---------- босс Кеша ----------
const KESHA_LINES = ['Ты чё, в натуре?!', 'Я чемпион района!', 'Пьяный мастер, ё!', 'Ща как дам!', 'Чистофф — сила!', 'Ты кого рыжим назвал?!'];
L2.Kesha = class {
  constructor(x) {
    this.x = x; this.y = L2.GROUND; this.facing = -1; this.maxHp = Math.round(66 * (G.BOSS_MULT || 1)); this.hp = this.maxHp; this.state = 'idle'; this.st = 0; this.t = 0;
    this.flash = 0; this.scale = 1; this.phase = 1; this.anim = 'master'; this.animT = 0; this.vx = 0; this.vy = 0; this.inv = 0;
    this.cool = 1; this.sniffT = 7; this.shots = 0; this.headH = 96; this.voice = 210; this.quip = 4; this.combo = 0; this.lastHit = -9;
  }
  get box() { const s = this.scale; return { x: this.x - 11 * s, y: this.y - 72 * s, w: 22 * s, h: 72 * s }; }
  get weak() { return this.state === 'sniff' || this.state === 'reload'; }
  set(s) { this.state = s; this.st = 0; }
  update(dt, ar) {
    const pl = ar.player;
    this.t += dt; this.st += dt; this.animT += dt; this.cool -= dt; this.sniffT -= dt; this.quip -= dt;
    if (this.flash > 0) this.flash -= dt; if (this.inv > 0) this.inv -= dt;
    const dx = pl.x - this.x, adx = Math.abs(dx);
    const face = () => { this.facing = dx > 0 ? 1 : -1; };
    const sp = this.phase === 2 ? 1.25 : 1;
    let a = 'master';
    if (this.quip <= 0 && this.state !== 'down' && this.state !== 'grow') { this.quip = U.rand(5, 8); G.say(this, U.choice(KESHA_LINES), 1.5); }
    switch (this.state) {
      case 'wait': a = 'idle'; break;
      case 'idle':
        face(); a = 'master';
        this.x += Math.sin(this.t * 3) * 30 * dt;
        if (this.st > 0.5 / sp) {
          if (this.sniffT <= 0) { this.set('sniff'); this.sniffT = U.rand(8, 11); G.say(this, U.choice(['Ща, занюхну для силы...', 'Чистофф — топливо чемпионов!']), 1.6); }
          else if (this.phase === 2 && this.cool <= 0 && adx > 90) { this.set('aim'); this.shots = 0; }
          else if (this.phase === 2 && adx < 90 && Math.random() < 0.6) { this.set('fly'); this.vx = -this.facing * 230; this.vy = -380; this.back = true; Sound.play('jump'); }
          else if (adx > 150 && Math.random() < 0.5) { this.set('fly'); this.vx = this.facing * 260 * sp; this.vy = -360; Sound.play('jump'); }
          else this.set('dash');
        }
        break;
      case 'dash':
        face(); a = 'run';
        this.x += this.facing * 200 * sp * dt;
        if (adx < 40) this.set('wind');
        if (this.st > 1.4) this.set('idle');
        break;
      case 'wind': a = 'master'; if (this.st > 0.35 / sp) { this.set('punch'); Sound.play('punch'); } break;
      case 'punch':
        a = 'punch';
        if (this.st < 0.12) { const s = this.scale, hb = { x: this.x + (this.facing > 0 ? 4 : -40 * s), y: this.y - 64 * s, w: 40 * s, h: 36 * s }; if (U.overlap(hb, pl.box)) pl.hurt(this.phase === 2 ? 12 : 9, this.x, ar.world); }
        if (this.st > 0.35) { this.combo++; if (this.combo < 2 && adx < 60) this.set('wind'); else { this.combo = 0; this.set('idle'); } }
        break;
      case 'fly':
        a = 'kick';
        this.vy += 1500 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
        if (!this.back && U.overlap(this.box, pl.box) && !this.kicked) { this.kicked = true; pl.hurt(this.phase === 2 ? 15 : 12, this.x, ar.world); }
        if (this.y >= L2.GROUND) { this.y = L2.GROUND; this.kicked = false; if (this.back) { this.back = false; FX.dust(this.x, this.y, 6); Sound.play('stomp'); this.set('aim'); this.shots = 0; this.facing = pl.x > this.x ? 1 : -1; break; } FX.dust(this.x, this.y, 6); Sound.play('stomp'); this.set('idle'); }
        break;
      case 'sniff':
        a = 'sniff';
        if (this.st > 0.4 && Math.random() < dt * 20) FX.spawn({ x: this.x + this.facing * 10, y: this.y - 40 * this.scale, vx: U.rand(-20, 20), vy: -30, grav: -10, life: 0.8, color: '#f0f4ff', size: 3, type: 'puff' });
        if (this.st > 2.2) { this.hp = Math.min(this.maxHp, this.hp + 1); this.set('idle'); G.say(this, 'У-У-УХ! БОДРИТ!', 1.2, { shout: true }); }
        break;
      case 'aim':
        face(); a = 'aim';
        if (this.st > 0.7) { this.set('shoot'); }
        break;
      case 'shoot':
        a = 'shoot';
        if (this.st < dt * 1.5) {
          const s = this.scale;
          ar.bullets.push({ x: this.x + this.facing * 30 * s, y: this.y - 50, vx: this.facing * 380, t: 0 });
          Sound.play('shot'); G.shake(2, 0.1);
          FX.burst(this.x + this.facing * 34 * s, this.y - 52 * s, 5, { colors: ['#fff6a0', '#ffb040'], speed: 80, life: 0.15, grav: 0 });
        }
        if (this.st > 0.35) { this.shots++; if (this.shots < 3) this.set('aim'); else { this.set('reload'); G.say(this, 'Патроны! Где патроны?!', 1.5); } }
        break;
      case 'reload': a = 'shout'; if (this.st > 2.0) { this.cool = 3.5; this.set('idle'); } break;
      case 'hurt': a = 'hurt'; this.x += this.vx * dt; this.vx *= 0.85; if (this.st > 0.25) this.set('idle'); break;
      case 'grow':
        a = 'shout';
        this.scale = U.lerp(1, 1.8, U.clamp(this.st / 1.2, 0, 1));
        if (this.st > 1.6) { this.phase = 2; this.set('fly'); this.vx = -this.facing * 230; this.vy = -380; this.back = true; this.cool = 0; }
        break;
      case 'down': a = 'ko'; break;
    }
    this.x = U.clamp(this.x, L2.ARENA_X + 20, L2.ARENA_X + W - 20);
    if (a !== this.anim) { this.anim = a; this.animT = 0; }
  }
  hit(dmg, dir, ar) {
    if (this.state === 'down' || this.state === 'grow' || this.state === 'wait') return;
    if (this.inv > 0 && !this.weak) return;
    const mult = this.weak ? 2 : this.phase === 2 ? 0.6 : 1;
    if (!this.weak) this.inv = 0.15;
    this.hp -= dmg * mult; this.flash = 0.12; Sound.play('hit'); G.hitStop = 0.05;
    ar.nat && ar.nat.onHit();
    if (mult > 1) FX.popText(this.x, this.y - 90 * this.scale, 'x2!', '#ffd84a', 16);
    if (this.hp <= 0) { this.hp = 0; this.set('down'); this.scale = 1; ar.bossDown(); return; }
    if (this.phase === 1 && this.hp <= this.maxHp / 2) { this.set('grow'); Sound.play('boom'); G.shake(6, 0.6); G.say(this, 'НУ ВСЁ! ТЫ МЕНЯ РАЗОЗЛИЛ!', 2, { shout: true }); ar.hint = 'Кеша стреляет! Пригнись {down} — пули пролетят над головой!'; ar.hintT = 6; return; }
    this.combo2 = this.t - this.lastHit < 1.0 ? (this.combo2 || 0) + 1 : 1; this.lastHit = this.t;
    if (this.combo2 >= 4 && !this.weak) { this.combo2 = 0; this.set('fly'); this.vx = -dir * 200; this.vy = -300; G.say(this, 'Не догонишь!', 1); return; }
    if (this.state === 'idle' || this.state === 'dash') { this.set('hurt'); this.vx = dir * 130; }
  }
  draw(c, cx) {
    let rot = 0, x = this.x - cx;
    if (this.anim === 'master') rot = Math.sin(this.t * 4) * 0.08;
    const red = this.phase === 2 || this.state === 'grow';
    Spr.drawAnim(c, 'kesha', this.anim, this.animT, x, this.y, this.facing, { rot, scale: this.scale, flash: this.flash > 0 ? '#ffffff' : null });
    if (red && this.flash <= 0) {
      c.save(); c.globalAlpha = 0.35 + Math.sin(G.t * 10) * 0.08;
      Spr.drawAnim(c, 'kesha', this.anim, this.animT, x, this.y, this.facing, { rot, scale: this.scale, flash: '#ff2020' });
      c.restore();
    }
    if (this.weak && (G.t * 6 | 0) % 2) G.text('СЛАБОЕ МЕСТО!', x, this.y - 100 * this.scale, { align: 'center', color: '#ffd84a', outline: true });
  }
};

// Наташка в открытом окне дома героя — болеет за Кешу
L2.NatWindow = class {
  constructor() {
    const w = window.BUILDINGS.hero.win;
    this.rx = L2.heroLeft() + w[0]; this.ry = L2.GROUND - window.BUILDINGS.hero.h + 2 + w[1]; this.rw = w[2]; this.rh = w[3];
    this.t = 0; this.faceT = 0; this.lineT = 2; this.voice = 330;
    this.bx = this.rx + this.rw / 2; this.by = this.ry - 4;
  }
  onHit() { this.faceT = 1.2; if (Math.random() < 0.3) G.say(this, U.choice(['Кешенька, держись!', 'Ой, батюшки!', 'Эх, мужики пошли...']), 1.4); }
  update(dt) {
    this.t += dt; if (this.faceT > 0) this.faceT -= dt; this.lineT -= dt;
    if (this.lineT <= 0) { this.lineT = U.rand(5, 8); G.say(this, U.choice(['Давай, Кешенька!', 'Врежь ему, рыжему!', 'Я тебя в окно вижу, Валера!', 'Кеша, не позорься!']), 1.6); }
  }
  draw(c, cx) {
    const x = this.rx - cx, y = this.ry;
    c.save();
    c.beginPath(); c.rect(x, y, this.rw, this.rh); c.clip();
    c.fillStyle = '#16140f'; c.fillRect(x, y, this.rw, this.rh);
    c.fillStyle = 'rgba(255,200,120,0.18)'; c.fillRect(x, y, this.rw, this.rh);
    // по пояс в окне; машет рукой или хватается за голову
    const fr = this.faceT > 0 ? ['n_b', 2] : ((this.t * 2.5) | 0) % 2 ? ['n_a', 3] : ['n_a', 0];
    Spr.draw(c, fr[0], fr[1], x + this.rw / 2 - 2, y + this.rh + 26, 1, { scale: 0.8 });
    c.restore();
  }
};

L2.Arena = class {
  constructor(level, run) {
    this.level = level; this.run = run;
    this.world = run.world;
    this.player = run.player; this.player.controls = false;
    this.boss = new L2.Kesha(L2.ARENA_X + 420); this.boss.set('wait');
    this.nat = new L2.NatWindow();
    this.bullets = []; this.fighting = false; this.hint = null; this.hintA = 0; this.hintT = 0; this.actors = []; this.birds = false;
    this.world.enemies = []; this.world.hazards = []; this.world.clouds = [];
    this.world.playerAttack = (hb, dmg, atk, pl) => {
      const b = this.boss;
      if (b && this.fighting && !atk.hit.has(b) && U.overlap(hb, b.box)) { atk.hit.add(b); b.hit(dmg, pl.facing, this); this.world.addScore(100 * dmg); G.shake(2, 0.1); FX.burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 7, { colors: ['#fff', '#ffd84a'], speed: 130, life: 0.25, grav: 0 }); }
    };
    this.quipT = 4; this.dropped = {};
  }
  startFight() { this.fighting = true; this.player.controls = true; this.boss.set('idle'); this.hint = 'Кеша — пьяный мастер! Бей, когда он нюхает порошок — это его слабое место.'; this.hintT = 6; }
  bossDown() {
    this.fighting = false; this.player.controls = false; this.bullets = [];
    this.world.addScore(6000); this.level.stats.kills++;
    G.shake(8, 0.5); G.flash(0.2); Music.stop(); Sound.play('boom'); this.birds = true;
    setTimeout(() => this.level.bossDefeated(), 1400);
  }
  update(dt) {
    const wd = this.world, pl = this.player, b = this.boss;
    wd.t += dt; if (this.fighting) this.level.stats.time += dt;
    if (pl) { pl.update(dt, wd); pl.x = U.clamp(pl.x, L2.ARENA_X + 12, L2.ARENA_X + W - 12); }
    if (pl && b && b.update && (this.fighting || b.state === 'down')) b.update(dt, this);
    this.nat.update(dt);
    for (const bl of this.bullets) {
      bl.t += dt; bl.x += bl.vx * dt;
      if (pl && U.overlap({ x: bl.x - 5, y: bl.y - 2, w: 10, h: 4 }, pl.box)) { pl.hurt(12, bl.x - bl.vx, wd); bl.t = 9; }
    }
    this.bullets = this.bullets.filter(bl => bl.t < 2 && bl.x > L2.ARENA_X - 20 && bl.x < L2.ARENA_X + W + 20);
    for (const p of wd.projs) {
      p.update(dt, wd, pl);
      if (b && this.fighting && !p.dead && !p.hitSet.has(b) && U.overlap(p.box, b.box)) { p.hitSet.add(b); b.hit(p.dmg, p.dir, this); if (!p.pierce) { p.dead = true; p.poof(); } }
    }
    wd.projs = wd.projs.filter(p => !p.dead);
    if (pl) for (const p of wd.pickups) p.update(dt, wd, pl);
    wd.pickups = wd.pickups.filter(p => !p.dead);
    for (const a of this.actors) a.update(dt);
    if (this.fighting) {
      [46, 22].forEach(th => { if (b.hp <= th && !this.dropped[th]) { this.dropped[th] = 1; const p = new Game.Pickup(th === 46 ? 'beer' : 'kefir', L2.ARENA_X + U.rand(120, 520), -10); p.falling = true; wd.pickups.push(p); } });
      this.quipT -= dt;
      if (this.quipT <= 0) { this.quipT = U.rand(7, 10); G.say(pl, U.choice(['Кеша, иди проспись!', 'Порошок не поможет!', 'Граблионок!', 'Я просто хочу домой!']), 1.6); }
      if (pl.dead && pl.deadT > 1.6 && !this.resetting) { this.resetting = true; this.level.stats.deaths++; setTimeout(() => { this.resetting = false; this.level.restartBoss(); }, 400); }
    }
    if (this.hintT > 0) { this.hintT -= dt; this.hintA = Math.min(1, this.hintA + dt * 4); } else this.hintA = Math.max(0, this.hintA - dt * 3);
  }
  draw(c) {
    const wd = this.world, cx = L2.ARENA_X;
    L2.drawLayers(c, cx);
    L2.drawBuildings(c, cx, [{ name: 'hero', x: L2.heroLeft(), w: window.BUILDINGS.hero.w, h: window.BUILDINGS.hero.h }]);
    this.nat.draw(c, cx);
    L2.drawGround(c, cx);
    for (const p of wd.pickups) p.draw(c, cx, 0);
    for (const a of this.actors) a.draw(c, cx, 0);
    if (this.boss && this.boss.draw) this.boss.draw(c, cx);
    if (this.birds && this.boss) {
      const b = this.boss;
      for (let i = 0; i < 3; i++) { const a = G.t * 3 + i * 2.1, bx = b.x - cx + Math.cos(a) * 16 + 20, by = b.y - 30 + Math.sin(a) * 5; Art.R(c, bx - 2, by - 1, 5, 3, '#f0d040'); Art.R(c, bx + 2, by - 2, 2, 2, '#f0d040'); }
    }
    if (this.player) this.player.draw(c, cx, 0);
    for (const bl of this.bullets) { Art.R(c, bl.x - cx - 5, bl.y - 1, 10, 3, '#ffe060'); Art.R(c, bl.x - cx - 12 * Math.sign(bl.vx), bl.y, 8, 1, 'rgba(255,220,120,0.5)'); }
    for (const p of wd.projs) p.draw(c, cx, 0);
    c.save(); c.translate(-cx, 0); FX.draw(c); c.restore();
    G.drawBubbles(c, cx, 0);
    if (this.player && this.fighting) Game.drawHUD(c, this.player, wd);
    if (this.boss && this.fighting) {
      const b = this.boss;
      Art.R(c, 160, H - 26, 320, 16, '#111'); Art.R(c, 162, H - 24, 316, 12, '#3a1010');
      Art.R(c, 162, H - 24, Math.round(316 * b.hp / b.maxHp), 12, b.weak ? '#ffd84a' : b.phase === 2 ? '#ff3020' : '#d83040');
      G.text('КЕША — ГРОЗА ПОДЪЕЗДА', W / 2, H - 40, { align: 'center', color: '#8cc8ff', outline: true });
    }
    if (this.hint) Game.drawHint(c, this.hint, this.hintA, 44);
  }
};

// ---------- сцены ----------
L2.sceneStart = function (level) {
  const st = { fade: 1, title: 0 };
  const v = new G.Actor('valera', 250, L2.GROUND, 1);
  const spy = new L2.Spy({ kind: 'corner', x: 40 + window.BUILDINGS.gate.w - 4, y: L2.GROUND, dir: -1 });
  level.drawScene = c => {
    L2.drawLayers(c, 0);
    spy.draw(c, 0);
    L2.drawBuildings(c, 0, [{ name: 'gate', x: 40, w: window.BUILDINGS.gate.w, h: window.BUILDINGS.gate.h }, { name: 'workshop', x: 760, w: window.BUILDINGS.workshop.w, h: window.BUILDINGS.workshop.h }]);
    L2.drawGround(c, 0);
    v.draw(c);
    G.drawBubbles(c, 0, 0);
    Scene.drawDialog(c);
    if (st.title > 0) {
      c.globalAlpha = Math.min(1, st.title);
      Art.R(c, 0, 130, W, 70, 'rgba(0,0,0,0.7)');
      G.text('УРОВЕНЬ 2', W / 2, 140, { align: 'center', color: '#ffd84a' });
      G.text('ДОРОГА ДОМОЙ', W / 2, 158, { align: 'center', size: 16, outline: true });
      G.text('Выборгск. Вечер.', W / 2, 182, { align: 'center', color: '#c8d0d8' });
      c.globalAlpha = 1;
    }
    if (st.fade > 0) { c.fillStyle = `rgba(0,0,0,${st.fade})`; c.fillRect(0, 0, W, H); }
  };
  level.updateScene = dt => { v.update(dt); spy.t += dt; FX.update(dt); G.updateBubbles(dt); };
  return function* () {
    Music.play('city');
    v.x = 250; v.setAnim('walk');
    yield* Scene.tween(0.8, k => { st.fade = 1 - k; });
    yield* Scene.moveTo(v, 320, 40, 'walk');
    v.setAnim('tiredStand');
    yield* Scene.say('valera', 'Ух... Как я устал. Надо добраться домой.', v);
    v.setAnim('yawn'); yield 0.8; v.setAnim('stand');
    // шпион мелькает за углом — Валера не видит
    yield* Scene.tween(0.6, k => { spy.show = k; });
    yield 0.9;
    yield* Scene.tween(0.4, k => { spy.show = 1 - k; });
    yield* Scene.tween(0.4, k => { st.title = k; });
    yield 1.8;
    yield* Scene.tween(0.4, k => { st.title = 1 - k; });
  };
};

L2.sceneShop = function (level) {
  const st = { fade: 1 };
  const v = new G.Actor('valeraBig', -60, 342, 1); v.headH = 170;
  level.drawScene = c => {
    c.drawImage(G.bg.shop, 0, 0, W, H);
    v.draw(c);
    G.drawBubbles(c, 0, 0);
    Scene.drawDialog(c);
    if (st.fade > 0) { c.fillStyle = `rgba(0,0,0,${st.fade})`; c.fillRect(0, 0, W, H); }
  };
  level.updateScene = dt => { v.update(dt); FX.update(dt); G.updateBubbles(dt); };
  return function* () {
    Sound.play('bell');
    yield* Scene.tween(0.5, k => { st.fade = 1 - k; });
    yield* Scene.moveTo(v, 175, 90, 'walk');
    v.setAnim('tiredStand');
    yield* Scene.say('valera', 'Здрасьте. Дайте пивка... одну. Нет, две.', v);
    yield* Scene.say('seller', 'Паспорт покажи, рыжий!', null);
    v.setAnim('shoutFist');
    yield* Scene.say('valera', 'Мне тридцать лет!', v);
    yield* Scene.say('seller', 'Всем тридцать. Ладно, держи. И тару потом сдай!', null);
    Sound.play('pickup');
    v.setAnim('beerHappy');
    yield* Scene.say('valera', 'Во! Теперь бутылка — моё оружие!', v);
    yield* Scene.tween(0.5, k => { st.fade = k; });
  };
};

L2.sceneBossIntro = function (level) {
  const ar = level.arena;
  const k = new G.Actor('kesha', L2.ARENA_X + 420, L2.GROUND, -1); k.setAnim('idle'); k.voice = 210;
  const v = new G.Actor('valera', ar.player.x, L2.GROUND, 1);
  ar.boss.draw = () => {}; ar.player.visible = false;
  const pl = ar.player; ar.player = null;
  ar.actors = [k, v];
  const st = { title: 0 };
  level.drawScene = c => { ar.draw(c); G.bigTitle(c, 'БОЙ!', st.title, { size: 32, color: '#ff5a3a' }); Scene.drawDialog(c); };
  level.updateScene = dt => { ar.update(dt); FX.update(dt); G.updateBubbles(dt); };
  return function* () {
    Music.play('cutscene');
    yield* Scene.moveTo(v, L2.ARENA_X + 220, 60, 'walk');
    v.setAnim('tiredStand');
    k.setAnim('talk');
    yield* Scene.say('kesha', 'Валера, епты! Ты чё, рыжая задница, район попутал?! Гони валюту!', k);
    v.setAnim('shoutFist');
    yield* Scene.say('valera', 'Отстань!', v);
    k.setAnim('shout');
    yield* Scene.say('kesha', 'А то что будет?', k);
    k.setAnim('sniff'); Sound.play('swig');
    yield 1.0;
    k.setAnim('master');
    G.say(k, 'РЕЖИМ БЕРСЕРКА!', 1.4, { shout: true });
    Music.play('boss');
    yield* Scene.tween(0.3, kk => { st.title = kk; });
    yield 0.8;
    st.title = 0;
    pl.x = v.x; pl.facing = 1; ar.player = pl;
    delete ar.boss.draw;
    ar.boss.x = k.x;
    ar.actors = [];
  };
};

L2.sceneFinale = function (level) {
  const ar = level.arena, b = ar.boss;
  const k = new G.Actor('kesha', b.x, L2.GROUND, b.facing); k.setAnim('ko'); k.voice = 210;
  const v = new G.Actor('valera', ar.player.x, L2.GROUND, ar.player.facing);
  ar.boss = { x: b.x, y: L2.GROUND }; ar.player = null;
  const spy = new G.Actor('commando', L2.ARENA_X + 600, -60, -1); spy.visible = false;
  ar.actors = [k, v, spy];
  const st = { title: 0, fade: 0, dart: null };
  level.drawScene = c => {
    ar.draw(c);
    if (spy.visible) {
      const sx = spy.x - L2.ARENA_X;
      if (spy.ropeX != null) {
        const top = spy.anim === 'rope' ? spy.y - 110 + 4 : L2.GROUND - 4;
        const rx = spy.ropeX - L2.ARENA_X;
        Art.R(c, rx, 0, 2, top, '#2a2418'); Art.R(c, rx, 0, 1, top, '#6a5a3e');
      }
      Spr.drawAnim(c, 'spy', spy.anim, spy.animT, sx, spy.y, spy.facing);
    }
    if (st.dart) { Art.R(c, st.dart.x - L2.ARENA_X - 6, st.dart.y, 10, 2, '#c0c8d0'); Art.R(c, st.dart.x - L2.ARENA_X + 4, st.dart.y - 1, 3, 4, '#e04040'); }
    Scene.drawDialog(c);
    G.bigTitle(c, 'КОНЕЦ УРОВНЯ 2', st.title, { size: 24, color: '#ffd84a' });
    if (st.fade > 0) { c.fillStyle = `rgba(0,0,0,${st.fade})`; c.fillRect(0, 0, W, H); }
  };
  level.updateScene = dt => { ar.update(dt); spy.update(dt); FX.update(dt); G.updateBubbles(dt); };
  spy.draw = () => {};
  const door = L2.heroLeft() + window.BUILDINGS.hero.door;
  return function* () {
    Music.play('cutscene');
    yield 1.0;
    k.setAnim('sit'); ar.birds = false;
    yield 0.4;
    yield* Scene.say('kesha', 'Уважаю! Ты настоящий пацан.', k);
    k.setAnim('thumbs');
    v.facing = k.x > v.x ? 1 : -1;
    yield* Scene.say('valera', 'Спасибо.', v);
    yield* Scene.moveTo(v, door, 55, 'walk');
    v.setAnim('stand'); v.facing = 1;
    // спецназовец спускается с соседней крыши
    spy.visible = true; spy.setAnim('rope'); spy.ropeX = spy.x + 4.5; Sound.play('rope');
    yield* Scene.tween(1.2, kk => { spy.y = U.lerp(-60, L2.GROUND, U.easeOut(kk)); });
    spy.setAnim('dart');
    yield 0.5;
    Sound.play('throw');
    st.dart = { x: spy.x - 20, y: L2.GROUND - 54 };
    yield* Scene.tween(0.35, kk => { st.dart.x = U.lerp(spy.x - 20, v.x + 6, kk); });
    st.dart = null; Sound.play('hit');
    v.setAnim('sting');
    spy.setAnim('run'); spy.facing = 1;
    yield* Scene.tween(0.6, kk => { spy.x = U.lerp(L2.ARENA_X + 600, L2.ARENA_X + 720, kk); });
    spy.visible = false;
    yield* Scene.say('valera', 'Ой... Кажется, муха укусила.', v);
    v.setAnim('backDoor'); Sound.play('door');
    yield* Scene.tween(0.8, kk => { v.alpha = 1 - kk; });
    v.visible = false;
    yield 0.8;
    yield* Scene.tween(0.5, kk => { st.title = kk; });
    yield 2.0;
    yield* Scene.tween(0.8, kk => { st.fade = kk; });
  };
};

// ---------- контроллер уровня ----------
L2.Level = class {
  constructor(carry) {
    this.id = 2;
    this.stats = { time: 0, dmg: 0, kills: 0, deflect: 0, secrets: 0, food: 0, deaths: 0 };
    this.score = 0; this.mode = null; this.carry = carry || { ammo: { nuts: 5, wrench: 0, bricks: 0, bottles: 0 }, weapon: 'nuts', bottleHits: 0 };
  }
  start(opts = {}) {
    if (opts.boss) { this.shopDone = true; this.startX = L2.ARENA_X - 60; this.carry.bottleHits = 8; this.carry.ammo.bottles = 3; this.startRun(); return; }
    this.playScene(L2.sceneStart(this), () => this.startRun());
  }
  playScene(gen, next) { this.mode = 'scene'; Scene.run(gen, next); }
  startRun() {
    this.mode = 'run'; FX.list = []; G.bubbles = [];
    this.run = new L2.Run(this);
    Music.play('city');
  }
  enterShop(run) {
    const pl = run.player; pl.controls = false;
    this.playScene(L2.sceneShop(this), () => {
      this.mode = 'run'; pl.controls = true;
      pl.bottleHits = Math.max(pl.bottleHits, 8); pl.ammo.bottles += 3; pl.weapon = 'bottles';
      run.hint = { text: 'Бутылка! {punch} — удар бутылкой (сильнее кулака), {throw} — бросить. Бутылка бьётся — ищи пиво в пути!', done: false, shown: 0 };
      run.hints.push(Object.assign(run.hint, { x: pl.x - 10, w: 400 }));
      Music.play('city');
    });
  }
  reachYard(run) {
    this.carry = { ammo: run.player.ammo, bottleHits: run.player.bottleHits, weapon: run.player.weapon };
    this.arena = new L2.Arena(this, run);
    this.mode = 'boss';
    this.playScene(L2.sceneBossIntro(this), () => { this.mode = 'boss'; this.arena.startFight(); });
  }
  restartBoss() {
    const run = this.run;
    const pl = new Game.Player(L2.ARENA_X + 150, L2.GROUND);
    pl.ammo = Object.assign({}, this.carry.ammo); pl.ammo.bottles = Math.max(pl.ammo.bottles || 0, 3); pl.bottleHits = 8; pl.weapon = 'bottles';
    run.player = pl;
    this.arena = new L2.Arena(this, run);
    this.arena.startFight();
    Music.play('boss');
    G.say(pl, 'Второй раунд, Кеша!', 1.5);
  }
  bossDefeated() { this.playScene(L2.sceneFinale(this), () => { this.mode = 'done'; G.onLevelComplete(this); }); }
  update(dt) {
    if (this.mode === 'scene') { Scene.tick(dt); if (this.updateScene) this.updateScene(dt); }
    else if (this.mode === 'run') { this.run.update(dt); FX.update(dt); G.updateBubbles(dt); }
    else if (this.mode === 'boss') { this.arena.update(dt); FX.update(dt); G.updateBubbles(dt); }
  }
  draw(c) {
    if (this.mode === 'scene' && this.drawScene) { this.drawScene(c); if (Scene.t < 3) G.text('Esc — пропустить', W - 8, H - 12, { align: 'right', size: 8, color: 'rgba(255,255,255,0.5)' }); }
    else if (this.mode === 'run') this.run.draw(c);
    else if (this.mode === 'boss') this.arena.draw(c);
  }
  get canPause() { return this.mode === 'run' || this.mode === 'boss'; }
};
