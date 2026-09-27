'use strict';
// ============ УРОВЕНЬ 1: «СЕВМОЛОТ. ДЕНЬ ПЕРВЫЙ» ============
const L1 = {};
G.L1 = L1;
const Rr = Art.R;

// =====================================================================
// 1. ПОСТРОЕНИЕ УРОВНЯ (вертикальный подъём на кран)
// =====================================================================
L1.build = function () {
  const rng = U.seeded(1987);
  const D = { plats: [], ladders: [], enemies: [], pickups: [], checkpoints: [], hints: [], vents: [], sparks: [], groups: [], posters: [], gullZones: [], bottleZone: null, galleries: [] };
  const P = (x, y, w, look = 'girder', extra = {}) => {
    const p = Object.assign({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: 8, oneway: true, look }, extra);
    D.plats.push(p); return p;
  };
  const pick = (kind, x, y) => D.pickups.push({ kind, x, y });
  let cur, dir = 1;
  const mid = p => (p.x1 + p.x2) / 2;

  // ---- обучение на полу цеха ----
  P(0, 0, 640, 'floor', { h: 60, oneway: false });
  P(196, -28, 38, 'crate', { h: 28, oneway: false });
  D.enemies.push({ type: 'rat', x: 330, y: 0, x1: 280, x2: 410 });
  pick('nutsbox', 452, 0);
  D.ladders.push({ x: 572, y: -150, w: 16, h: 150 });
  P(470, -150, 150);
  D.hints.push({ x: 380, y: -250, w: 260, h: 100, text: 'Сверху падает всякое! Смотри на «!» и прячься под балками.' });
  D.posters.push({ x: 40, y: -110, kind: 'tb' }, { x: 120, y: -150, kind: 'helmet' }, { x: 250, y: -130, kind: 'load' });
  cur = { x1: 470, x2: 620, y: -150 };
  dir = -1;

  // ---- «такты» уровня ----
  const zig = (n, look = 'girder', o = {}) => {
    for (let i = 0; i < n; i++) {
      const w = rng.int(o.wmin || 84, o.wmax || 150);
      const ny = cur.y - rng.int(o.dmin || 56, o.dmax || 70);
      let cx = mid(cur) + dir * rng.int(80, 170);
      if (cx < w / 2 + 24 || cx > W - w / 2 - 24) { dir = -dir; cx = mid(cur) + dir * rng.int(80, 170); }
      cx = U.clamp(cx, w / 2 + 24, W - w / 2 - 24);
      let x1 = cx - w / 2, x2 = cx + w / 2;
      const gap = Math.max(x1 - cur.x2, cur.x1 - x2);
      if (gap > 68) { const sh = gap - 68; if (x1 > cur.x2) { x1 -= sh; x2 -= sh; } else { x1 += sh; x2 += sh; } }
      const extra = o.crumble ? { crumble: { state: 'idle' } } : {};
      P(x1, ny, x2 - x1, o.crumble ? 'pallet' : look, extra);
      const r = rng();
      if (r < 0.28) pick('coin', (x1 + x2) / 2, ny);
      else if (r < 0.36) pick('pie', (x1 + x2) / 2, ny);
      if (o.rats && x2 - x1 >= 120 && rng() < 0.45) D.enemies.push({ type: 'rat', x: x1 + 20, y: ny, x1: x1 + 10, x2: x2 - 10 });
      cur = { x1, x2, y: ny };
      if (rng() < 0.7) dir = -dir;
    }
  };
  const ladder = (len, look = 'girder') => {
    const lx = U.clamp(rng.int(cur.x1 + 12, cur.x2 - 28), 30, 594);
    const top = cur.y - len;
    D.ladders.push({ x: lx, y: top, w: 16, h: len });
    const w = rng.int(120, 170);
    const x1 = U.clamp(lx + 8 - w / 2 + rng.int(-30, 30), 20, 620 - w);
    P(x1, top, w, look);
    cur = { x1, x2: x1 + w, y: top };
  };
  const hook = () => {
    const goRight = mid(cur) < 320;
    const mw = 64;
    const sx = U.clamp(mid(cur) - mw / 2, 24, 552);
    const sy = cur.y - 44;
    const ex = goRight ? 520 : 56;
    const ey = sy - 84;
    P(sx, sy, mw, 'hook', { mover: { x1: sx, y1: sy, x2: ex, y2: ey, speed: 62, pause: 1.0 } });
    const lw = 140;
    const lx = goRight ? U.clamp(ex - 30, 20, 620 - lw) : U.clamp(ex + mw + 30 - lw, 20, 620 - lw);
    P(lx, ey - 52, lw);
    pick('coin', lx + lw / 2, ey - 52);
    cur = { x1: lx, x2: lx + lw, y: ey - 52 };
    dir = goRight ? -1 : 1;
  };
  const elevator = () => {
    const lw = 60;
    const lx = U.clamp(mid(cur) - lw / 2, 30, 550);
    const y1 = cur.y - 42, y2 = cur.y - 290;
    P(lx, y1, lw, 'lift', { mover: { x1: lx, y1, x2: lx, y2, speed: 55, pause: 1.2 } });
    const right = lx < 320;
    const tx = right ? lx + lw + 16 : lx - 16 - 150;
    P(tx, y2 - 18, 150);
    // бонус на полпути
    const bx = right ? lx - 16 - 90 : lx + lw + 16;
    if (bx > 20 && bx < 540) { P(bx, cur.y - 170, 90, 'scaffold'); pick(rng() < 0.5 ? 'kefir' : 'nutsbox', bx + 45, cur.y - 170); }
    cur = { x1: tx, x2: tx + 150, y: y2 - 18 };
    dir = right ? 1 : -1;
  };
  const wide = (w, look = 'girder') => {
    const ny = cur.y - rng.int(58, 68);
    const x1 = U.clamp(mid(cur) - w / 2 + rng.int(-60, 60), 24, W - 24 - w);
    P(x1, ny, w, look);
    cur = { x1, x2: x1 + w, y: ny };
    return cur;
  };
  const steam = () => {
    const c = wide(rng.int(320, 400), 'pipe');
    const n = 3;
    for (let i = 0; i < n; i++) D.vents.push({ x: c.x1 + (c.x2 - c.x1) * (i + 0.5) / n - 8, y: c.y, w: 16, off: i * 0.75 });
    D.hints.push({ x: c.x1, y: c.y - 90, w: c.x2 - c.x1, h: 100, once: true, text: 'Паровые клапаны! Проходи, когда пар стихнет.' });
  };
  const sparks = () => {
    const c = wide(rng.int(300, 380));
    for (let i = 0; i < 2; i++) D.sparks.push({ x: c.x1 + (c.x2 - c.x1) * (i + 1) / 3 - 4, y: c.y - 70, w: 8, h: 70, off: i * 1.1 });
  };
  const balcony = (enemy, loot) => {
    const c = wide(rng.int(260, 340), 'scaffold');
    if (enemy === 'drunk') D.enemies.push({ type: 'drunk', x: rng() < 0.5 ? c.x1 + 40 : c.x2 - 40, y: c.y, x1: c.x1 + 12, x2: c.x2 - 12 });
    if (enemy === 'rats') { D.enemies.push({ type: 'rat', x: c.x1 + 30, y: c.y, x1: c.x1 + 10, x2: c.x2 - 10 }); D.enemies.push({ type: 'rat', x: c.x2 - 40, y: c.y, x1: c.x1 + 10, x2: c.x2 - 10 }); }
    if (loot) pick(loot, (c.x1 + c.x2) / 2 + 20, c.y);
  };
  const checkpoint = () => {
    const c = wide(210);
    D.checkpoints.push({ x: (c.x1 + c.x2) / 2 - 20, y: c.y });
    pick('pie', (c.x1 + c.x2) / 2 + 30, c.y);
  };
  const bonus = kind => {
    // боковая площадка в стороне от пути
    const left = mid(cur) > 320;
    const w = 70;
    const x1 = left ? cur.x1 - 64 - w : cur.x2 + 64;
    if (x1 < 16 || x1 + w > 624) return;
    P(x1, cur.y - 44, w, 'scaffold');
    pick(kind, x1 + w / 2, cur.y - 44);
  };
  const gulls = (h) => D.gullZones.push({ y1: cur.y - h, y2: cur.y + 40 });

  // ---- сценарий подъёма ----
  zig(4, 'scaffold');
  bonus('badge');
  ladder(150);
  zig(3, 'girder', { rats: true });
  balcony('rats', 'nutsbox');
  zig(3);
  checkpoint();
  D.hints.push({ x: 0, y: cur.y - 90, w: 640, h: 100, once: true, text: 'Флажок — контрольная точка. Если что — начнёшь отсюда.' });
  hook();
  D.hints.push({ x: 0, y: cur.y + 40, w: 640, h: 90, once: true, text: 'Запрыгивай на груз на крюке — он довезёт!' });
  zig(4, 'pipe');
  steam();
  zig(3, 'girder', { rats: true });
  bonus('pelmeni');
  zig(3, 'pallet', { crumble: true });
  D.hints.push({ x: 0, y: cur.y - 20, w: 640, h: 200, once: true, text: 'Гнилые поддоны рассыпаются. Не стой на них долго!' });
  balcony('drunk', 'bricks');
  D.hints.push({ x: 0, y: cur.y - 90, w: 640, h: 100, once: true, text: 'Пьяный слесарь! Бей, пока он замахивается, и отходи.' });
  checkpoint();
  gulls(700);
  elevator();
  zig(4, 'girder');
  sparks();
  zig(2, 'scaffold');
  bonus('badge');
  hook();
  zig(3, 'girder', { rats: true });
  ladder(180);
  balcony('drunk', 'wrenchpk');
  D.hints.push({ x: 0, y: cur.y - 90, w: 640, h: 100, once: true, text: 'Гаечный ключ летит бумерангом и возвращается! {throw}' });
  zig(2);
  checkpoint();
  zig(3, 'pallet', { crumble: true });
  zig(3, 'pipe', { rats: true });
  steam();
  gulls(500);
  zig(3, 'girder');
  bonus('badge');
  balcony('drunk', 'kefir');
  zig(2, 'scaffold');
  checkpoint();
  // ---- финальная лестница к кабине ----
  const lx = U.clamp(mid(cur) - 8, 60, 560);
  const topY = cur.y - 300;
  D.ladders.push({ x: lx, y: topY, w: 16, h: 300 });
  // пара площадок-передышек вдоль лестницы
  P(lx < 320 ? lx + 30 : lx - 110, cur.y - 110, 96, 'scaffold');
  pick('pie', lx < 320 ? lx + 78 : lx - 62, cur.y - 110);
  P(lx < 320 ? lx - 100 : lx + 20, cur.y - 210, 96, 'scaffold');
  D.bottleZone = { y1: topY - 40, y2: cur.y + 10 };
  D.hints.push({ x: 0, y: cur.y - 300, w: 640, h: 310, once: true, text: 'Кто-то швыряет бутылки из кабины! Лезь быстрее!' });
  // площадка кабины
  P(0, topY, 640, 'cab');
  D.cabDoor = { x: lx < 320 ? 520 : 40, y: topY - 70, w: 90, h: 70 };
  D.topY = topY;

  // ---- сдвиг: пол внизу мира ----
  const off = -topY + 220;
  const sh = o => { o.y += off; };
  D.plats.forEach(p => { p.y += off; if (p.mover) { p.mover.y1 += off; p.mover.y2 += off; } });
  D.ladders.forEach(sh); D.enemies.forEach(sh); D.pickups.forEach(sh); D.checkpoints.forEach(sh);
  D.hints.forEach(sh); D.vents.forEach(sh); D.sparks.forEach(sh); D.posters.forEach(sh); sh(D.cabDoor);
  D.gullZones.forEach(z => { z.y1 += off; z.y2 += off; });
  D.bottleZone.y1 += off; D.bottleZone.y2 += off;
  D.topY += off;
  D.floorY = off;
  D.worldH = off + 60;

  // ---- фоновые галереи с рабочими ----
  const types = ['weld', 'drink', 'argue', 'lathe', 'smoke', 'domino', 'hammer', 'foreman', 'sleep', 'drink', 'argue', 'weld', 'smoke', 'lathe', 'domino', 'foreman', 'drink', 'hammer'];
  let gi = 0;
  for (let y = D.floorY - 250; y > D.topY + 200; y -= rng.int(230, 290)) {
    const left = gi % 2 === 0;
    D.galleries.push({ y, x1: left ? 18 : 380, x2: left ? 260 : 622, type: types[gi % types.length] });
    gi++;
  }
  // плакаты по высоте
  const pk = ['drunk', 'glory', 'plan', 'helmet', 'load', 'clock', 'board', 'navy', 'slow'];
  let k = 0;
  for (let y = D.floorY - 420; y > D.topY + 150; y -= rng.int(260, 360)) {
    D.posters.push({ x: rng.int(40, 560), y, kind: pk[k++ % pk.length] });
  }
  return D;
};

// =====================================================================
// 2. ФОН ЦЕХА (сгенерированные картинки, параллакс)
// =====================================================================
L1.BG = class {
  constructor(D) {
    this.D = D;
    // склеиваем верх и низ цеха в одну высокую картинку с плавным швом
    const top = G.bg.climbTop, bot = G.bg.climbBottom;
    const ov = 160;
    const cv = document.createElement('canvas');
    cv.width = 1280; cv.height = top.height + bot.height - ov;
    const x = cv.getContext('2d');
    x.drawImage(bot, 0, top.height - ov);
    const tmp = document.createElement('canvas'); tmp.width = 1280; tmp.height = top.height;
    const tx = tmp.getContext('2d');
    tx.drawImage(top, 0, 0);
    // маска: сверху полностью видно, внизу плавный переход в нижнюю картинку
    const mk = document.createElement('canvas'); mk.width = 1280; mk.height = top.height;
    const mx = mk.getContext('2d');
    mx.fillStyle = '#000'; mx.fillRect(0, 0, 1280, top.height - ov);
    const g = mx.createLinearGradient(0, top.height - ov, 0, top.height);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    mx.fillStyle = g; mx.fillRect(0, top.height - ov, 1280, ov);
    tx.globalCompositeOperation = 'destination-in';
    tx.drawImage(mk, 0, 0);
    x.drawImage(tmp, 0, 0);
    this.img = cv;
    this.farH = cv.height / 2;
    this.p = (this.farH - H) / (D.worldH - H);
  }
  drawFar(c, camY) {
    const fy = camY * this.p;
    c.drawImage(this.img, 0, fy * 2, 1280, H * 2, 0, 0, W, H);
  }
  drawGalleries(c, camY) {
    for (const g of this.D.galleries) {
      const y = g.y - camY;
      if (y < -40 || y > H + 30) continue;
      c.save(); c.globalAlpha = 0.85;
      Spr.slice3(c, 'props', Art.PROP.girder, g.x1, y, g.x2 - g.x1, { h: 9 });
      c.restore();
      Art.R(c, g.x1, y - 22, g.x2 - g.x1, 2, '#4a4f55');
      Art.R(c, g.x1, y - 12, g.x2 - g.x1, 1, '#3c4147');
      for (let x = g.x1; x <= g.x2; x += 24) Art.R(c, x, y - 22, 2, 22, '#3c4147');
    }
  }
};

// =====================================================================
// 3. РАБОЧИЕ НА ФОНЕ (спрайты)
// =====================================================================
const CHAT = {
  drink: ['Будем!', 'Наливай!', 'За флот!', 'Ну, за план!', 'Закусывай, Петрович!'],
  argue: ['Ты кому ключ на 12 отдал?!', 'Сам дурак!', '#@%&!!', 'Я мастеру скажу!', 'Твоя смена — ты и неси!'],
  lathe: ['План горит!', 'Где резец?!', 'Опять брак...'],
  weld: ['Не смотри на дугу!', 'Шов — загляденье!'],
  smoke: ['Скорей бы пятница...', 'Опять кран встал.', 'Валера, ты куда полез?!'],
  sleep: ['Хрррр...', 'Ммм... премия...'],
  domino: ['Рыба!', 'Ходи давай!', 'Дупль шесть!'],
  hammer: ['Эх, ухнем!', 'Кувалда — друг человека!'],
  foreman: ['Кто пьёт на рабочем месте?!', 'Лишу премии!', 'План, товарищи, план!'],
};
const GROUP_SPR = {
  weld: ['wk_a', [0, 1], 7], lathe: ['wk_a', [2, 3], 3], drink: ['wk_a', [4, 5], 0.6], smoke: ['wk_a', [6], 0], sleep: ['wk_a', [7], 0],
  argue: ['wk_b', [0, 1], 2.5], domino: ['wk_b', [2, 3], 0.8], hammer: ['wk_b', [4, 5], 1.6], foreman: ['wk_b', [6, 7], 0.7],
};
L1.Group = class {
  constructor(g, rng) {
    this.g = g; this.type = g.type; this.t = rng() * 10; this.chatT = 2 + rng() * 6;
    this.x = g.x1 + (g.x2 - g.x1) * (0.3 + rng() * 0.4);
    this.facing = rng() < 0.5 ? 1 : -1;
    this.y = g.y; this.headH = 66; this.voice = 150 + rng() * 150;
    this.lastFr = 0;
  }
  update(dt, onScreen) {
    this.t += dt;
    if (!onScreen) return;
    const [, frs, fps] = GROUP_SPR[this.type];
    const fi = fps ? Math.floor(this.t * fps) % frs.length : 0;
    if (fi !== this.lastFr) {
      this.lastFr = fi;
      if (this.type === 'hammer' && fi === 1) FX.burst(this.x + 10 * this.facing, this.y - 12, 5, { colors: ['#ffd84a', '#fff'], speed: 90, life: 0.3 });
    }
    if (this.type === 'weld' && Math.random() < dt * 14) FX.burst(this.x + 12 * this.facing, this.y - 10, 2, { colors: ['#ffd84a', '#fff', '#8cf'], speed: 90, life: 0.35, grav: 500 });
    if (this.type === 'smoke' && Math.random() < dt * 1.2) FX.spawn({ x: this.x + 8 * this.facing, y: this.y - 58, vx: 8, vy: -14, grav: -5, life: 1.8, color: '#8a8f94', size: 2, type: 'puff' });
    this.chatT -= dt;
    if (this.chatT <= 0) { this.chatT = U.rand(6, 11); G.say(this, U.choice(CHAT[this.type]), 2.0, { sound: false }); }
  }
  draw(c, cx, cy) {
    const [sheet, frs, fps] = GROUP_SPR[this.type];
    const fi = fps ? Math.floor(this.t * fps) % frs.length : 0;
    Spr.draw(c, sheet, frs[fi], this.x, this.y - cy + 1, this.facing);
  }
};

// =====================================================================
// 4. РЕЖИМ ПОДЪЁМА
// =====================================================================
L1.Climb = class {
  constructor(level) {
    this.level = level;
    const D = this.D = L1.build();
    const wd = this.world = new Game.World(W, D.worldH);
    wd.stats = level.stats; wd.score = level.score || 0;
    wd.addScore = n => { wd.score += n; level.score = wd.score; };
    D.plats.forEach(p => wd.addPlat(Object.assign({}, p, { crumble: p.crumble ? { state: 'idle' } : undefined })));
    wd.ladders = D.ladders.map(l => Object.assign({}, l));
    this.spawnAll();
    wd.checkpoints = D.checkpoints.map(c => Object.assign({ active: false }, c));
    wd.hints = D.hints.map(h => Object.assign({ shown: 0 }, h));
    wd.vents = D.vents.map(v => Object.assign({ t: v.off }, v));
    wd.sparks = D.sparks.map(s => Object.assign({ t: s.off }, s));
    this.bg = new L1.BG(D);
    const rng = U.seeded(77);
    this.groups = D.galleries.map(g => new L1.Group(g, rng));
    this.player = new Game.Player(60, D.floorY);
    this.respawn = { x: 60, y: D.floorY };
    wd.cam.y = D.worldH - H;
    this.spawnT = 3; this.gullT = 4; this.hint = null; this.hintA = 0; this.fade = 1; this.done = false; this.respawning = 0;
    wd.playerAttack = (hb, dmg, atk, pl) => this.playerAttack(hb, dmg, atk, pl);
    wd.spawnPlayerProj = (k, x, y, d) => wd.projs.push(new Game.Proj(k, x, y, d));
    this.quipT = 25;
    this.tut = new Game.Tutorial([
      { id: 'move', text: 'Идти', prompt: 'Иди вправо' },
      { id: 'jump', text: 'Прыжок', prompt: 'Перепрыгни ящик' },
      { id: 'crouch', text: 'Присесть', prompt: 'Присядь' },
      { id: 'punch', text: 'Удар', prompt: 'Ударь крысу' },
      { id: 'upper', text: 'Серия+апперкот', prompt: 'Жми 3 раза подряд' },
      { id: 'throw', text: 'Бросок', prompt: 'Подбери гайки и брось' },
      { id: 'climb', text: 'Лестница', prompt: 'Лезь по лестнице' },
    ]);
    wd.ev = id => this.tut.ev(id);
  }
  spawnAll() {
    const wd = this.world, D = this.D;
    wd.enemies = D.enemies.map(e => e.type === 'rat' ? new Game.Rat(e.x, e.y, e.x1, e.x2) : e.type === 'drunk' ? new Game.Drunk(e.x, e.y, e.x1, e.x2) : null).filter(Boolean);
    if (!this.pickedUp) this.pickedUp = new Set();
    wd.pickups = D.pickups.map((p, i) => { const o = new Game.Pickup(p.kind, p.x, p.y); o.id = i; return o; }).filter(p => !this.pickedUp.has(p.id));
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
        if (killed) { wd.addScore(e.score); wd.stats.kills++; FX.popText(e.x, e.y - 30, '+' + e.score); }
      }
    }
    for (const h of wd.hazards) {
      if (h.deflected || atk.hit.has(h)) continue;
      if (U.overlap(hb, h.box)) {
        atk.hit.add(h);
        h.deflected = true; h.vx = pl.facing * 320; h.vy = -260; h.vr = 20;
        wd.stats.deflect++; wd.addScore(50);
        Sound.play('deflect'); FX.popText(h.x, h.y - 10, 'ОТБИЛ! +50', '#8cd0ff');
      }
    }
  }
  update(dt) {
    const wd = this.world, pl = this.player, D = this.D;
    wd.t += dt;
    if (!this.done) this.level.stats.time += dt;
    this.tut.update(dt);
    if (pl.y < D.floorY - 400) this.tut.hidden = true;
    if (this.fade > 0 && !this.respawning && !this.done) this.fade = Math.max(0, this.fade - dt * 2);
    wd.updatePlats(dt);
    pl.update(dt, wd);
    for (const e of wd.enemies) e.update(dt, wd, pl);
    wd.enemies = wd.enemies.filter(e => !e.dead);
    for (const h of wd.hazards) h.update(dt, wd, pl);
    wd.hazards = wd.hazards.filter(h => !h.dead);
    for (const p of wd.projs) {
      p.update(dt, wd, pl);
      for (const e of wd.enemies) {
        if (p.dead || e.dieT != null || p.hitSet.has(e)) continue;
        if (U.overlap(p.box, e.box)) {
          p.hitSet.add(e);
          const killed = e.hit(p.dmg, p.dir);
          Sound.play('hit');
          if (killed) { wd.addScore(e.score); wd.stats.kills++; FX.popText(e.x, e.y - 30, '+' + e.score); }
          if (!p.pierce) { p.dead = true; p.poof(); }
        }
      }
    }
    wd.projs = wd.projs.filter(p => !p.dead);
    for (const p of wd.pickups) { p.update(dt, wd, pl); if (p.dead && p.id != null) this.pickedUp.add(p.id); }
    wd.pickups = wd.pickups.filter(p => !p.dead);

    // пар
    for (const v of wd.vents) {
      v.t += dt;
      const ph = v.t % 3.0;
      v.state = ph < 1.5 ? 'off' : ph < 2.0 ? 'warn' : 'on';
      const onScreen = v.y > wd.cam.y && v.y < wd.cam.y + H;
      if (v.state === 'warn' && Math.random() < dt * 20) FX.spawn({ x: v.x + 8 + U.rand(-3, 3), y: v.y, vx: 0, vy: -40, grav: -20, life: 0.5, color: '#d8dde0', size: 2, type: 'puff' });
      if (v.state === 'on') {
        if (Math.random() < dt * 60) FX.spawn({ x: v.x + 8 + U.rand(-5, 5), y: v.y, vx: U.rand(-15, 15), vy: -220, grav: -30, life: 0.45, color: '#e8ecee', size: 4, type: 'puff' });
        if (onScreen && ph - dt < 2.0) Sound.play('steam');
        if (U.overlap({ x: v.x, y: v.y - 80, w: v.w, h: 80 }, pl.box)) pl.hurt(10, v.x + 8, wd);
      }
    }
    // искрящие провода
    for (const s of wd.sparks) {
      s.t += dt;
      const ph = s.t % 2.6;
      s.on = ph > 1.5;
      const onScreen = s.y > wd.cam.y - 60 && s.y < wd.cam.y + H;
      if (s.on) {
        if (Math.random() < dt * 30) FX.burst(s.x + 4, s.y + U.rand(0, s.h), 2, { colors: ['#bff', '#fff', '#8cf'], speed: 100, life: 0.2, grav: 0 });
        if (onScreen && ph - dt <= 1.5) Sound.play('zap');
        if (U.overlap({ x: s.x - 4, y: s.y, w: s.w + 8, h: s.h }, pl.box)) pl.hurt(12, s.x, wd);
      }
    }
    // чекпоинты
    for (const cp of wd.checkpoints) {
      if (!cp.active && Math.abs(pl.x - cp.x) < 24 && Math.abs(pl.y - cp.y) < 20 && !pl.dead) {
        wd.checkpoints.forEach(c => { if (c.y >= cp.y) c.active = true; });
        cp.active = true; this.respawn = { x: cp.x, y: cp.y };
        Sound.play('checkpoint'); FX.popText(cp.x, cp.y - 60, 'КОНТРОЛЬНАЯ ТОЧКА', '#8cf08c');
        pl.heal(25);
        if (Math.random() < 0.7) G.say(pl, U.choice(['Перекур!', 'Полпути... наверное.', 'Ух, высоко!']), 1.6);
      }
    }
    // подсказки
    let hint = null;
    const pb = pl.box;
    for (const h of wd.hints) {
      if (h.done) continue;
      if (U.overlap(pb, h)) { hint = h; h.shown += dt; if (h.once && h.shown > 5) h.done = true; }
    }
    if (hint) { this.hint = hint; this.hintA = Math.min(1, this.hintA + dt * 4); }
    else this.hintA = Math.max(0, this.hintA - dt * 3);

    // падающие предметы
    const prog = U.clamp((D.floorY - pl.y) / (D.floorY - D.topY), 0, 1);
    const inBottle = D.bottleZone && pl.y < D.bottleZone.y2 && pl.y > D.bottleZone.y1 - 100;
    const nearCP = wd.checkpoints.some(c => Math.abs(c.y - pl.y) < 30 && Math.abs(c.x - pl.x) < 90);
    if (!pl.dead && pl.y < D.floorY - 180 && !nearCP) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawnT = inBottle ? U.rand(0.7, 1.1) : U.lerp(3.0, 1.35, prog) * U.rand(0.8, 1.2);
        const x = U.clamp(Math.random() < 0.7 ? pl.x + U.rand(-140, 140) : U.rand(30, 610), 24, 616);
        let kind;
        if (inBottle) kind = 'bottle';
        else { const r = Math.random(); kind = r < 0.35 ? 'bolt' : r < 0.6 ? 'brick' : r < 0.8 ? 'wrench' : 'bottle'; }
        if (!inBottle && Math.random() < 0.08) {
          wd.warnings.push({ x, t: 0.8, good: true, spawn: () => { const p = new Game.Pickup(Math.random() < 0.7 ? 'pie' : 'kefir', x, wd.cam.y - 10); p.falling = true; wd.pickups.push(p); } });
        } else {
          wd.warnings.push({ x, t: inBottle ? 0.6 : 0.85, spawn: () => wd.hazards.push(new Game.Hazard(kind, x, wd.cam.y - 14, inBottle ? U.rand(-40, 40) : 0, 60)) });
        }
        Sound.play('warn');
      }
    }
    for (const w of wd.warnings) { w.t -= dt; if (w.t <= 0 && !w.fired) { w.fired = true; w.spawn(); } }
    wd.warnings = wd.warnings.filter(w => !w.fired);
    // чайки
    const gz = D.gullZones.find(z => pl.y > z.y1 && pl.y < z.y2);
    if (gz && !pl.dead) {
      this.gullT -= dt;
      if (this.gullT <= 0) {
        this.gullT = U.rand(3.5, 6);
        const d = Math.random() < 0.5 ? 1 : -1;
        wd.enemies.push(new Game.Gull(d > 0 ? -30 : W + 30, wd.cam.y + U.rand(30, 110), d));
        Sound.play('gull');
      }
    }
    // фоновые группы
    for (const g of this.groups) g.update(dt, g.g.y > wd.cam.y - 40 && g.g.y < wd.cam.y + H + 40);
    // реплики Валеры
    this.quipT -= dt;
    if (this.quipT <= 0 && !pl.dead) {
      this.quipT = U.rand(22, 35);
      G.say(pl, U.choice(['Кто так строит?!', 'Наташка, я иду!', 'Лишь бы не на голову...', 'Тут пол-завода пьёт!', 'Высоко... не смотреть вниз.', 'Премию мне за это!']), 2);
    }
    // камера
    const ty = U.clamp(pl.y - H * 0.6, 0, D.worldH - H);
    wd.cam.y += (ty - wd.cam.y) * Math.min(1, dt * 6);
    wd.cam.y = U.clamp(wd.cam.y, 0, D.worldH - H);
    // смерть и возрождение
    if (pl.dead && pl.deadT > 1.6 && !this.respawning) { this.respawning = 1; }
    if (this.respawning) {
      this.fade = Math.min(1, this.fade + dt * 2.5);
      if (this.fade >= 1) {
        this.respawning = 0;
        this.level.stats.deaths++;
        const np = new Game.Player(this.respawn.x, this.respawn.y);
        np.ammo = { nuts: Math.max(pl.ammo.nuts, 5), wrench: pl.ammo.wrench, bricks: pl.ammo.bricks }; np.weapon = pl.weapon;
        this.player = np;
        wd.hazards = []; wd.warnings = []; this.spawnT = 3;
        wd.enemies = wd.enemies.filter(e => e.kind !== 'gull');
        wd.cam.y = U.clamp(np.y - H * 0.6, 0, D.worldH - H);
        G.say(np, U.choice(['Так, ещё раз!', 'Я живучий!', 'Не дождётесь!']), 1.6);
      }
    }
    // дошёл до кабины
    if (!this.done && !pl.dead && U.overlap(pl.box, D.cabDoor) && pl.onGround) {
      this.done = true; pl.controls = false;
      this.level.climbDone();
    }
  }
  draw(c) {
    const wd = this.world, cy = Math.round(wd.cam.y);
    this.bg.drawFar(c, cy);
    c.fillStyle = 'rgba(14,18,24,0.22)'; c.fillRect(0, 0, W, H);
    this.bg.drawGalleries(c, cy);
    for (const g of this.groups) if (g.g.y > cy - 80 && g.g.y < cy + H + 80) g.draw(c, 0, cy);
    c.fillStyle = 'rgba(14,18,24,0.25)'; c.fillRect(0, 0, W, H);
    // дверь кабины наверху
    const cd = this.D.cabDoor;
    if (cd.y - cy > -80 && cd.y - cy < H) {
      const dx = cd.x + 20, dy = cd.y + cd.h - cy;
      Rr(c, dx - 4, dy - 70, 50, 70, '#15171a'); Rr(c, dx, dy - 66, 42, 66, '#3a4046'); Rr(c, dx + 4, dy - 62, 34, 22, '#8a9aa6');
      Rr(c, dx + 34, dy - 34, 3, 4, '#c8a020');
      Rr(c, dx - 12, dy - 88, 66, 14, '#b8342e'); G.text('КАБИНА', dx + 21, dy - 85, { align: 'center', size: 8, color: '#fff' });
    }
    // лестницы и платформы
    for (const l of wd.ladders) if (l.y < cy + H && l.y + l.h > cy) Art.ladder(c, { x: l.x, y: l.y - cy, w: l.w, h: l.h });
    for (const p of wd.plats) if (p.y > cy - 30 && p.y < cy + H + 30) Art.platform(c, { ...p, y: p.y - cy }, wd.t);
    // клапаны пара
    for (const v of wd.vents) {
      if (v.y < cy - 20 || v.y > cy + H + 20) continue;
      Art.valve(c, v.x + 8, v.y - cy + 1);
    }
    // провода
    for (const s of wd.sparks) {
      if (s.y > cy + H || s.y + s.h < cy) continue;
      const sy = s.y - cy;
      Rr(c, s.x + 3, sy - 400, 2, 400 + s.h - 16, '#111');
      Rr(c, s.x + 2, sy + s.h - 18, 4, 4, '#c8a020');
      if (s.on) { c.strokeStyle = (G.t * 30 | 0) % 2 ? '#bff' : '#fff'; c.lineWidth = 2; c.beginPath(); let yy = sy; c.moveTo(s.x + 4, yy); while (yy < sy + s.h) { yy += 8; c.lineTo(s.x + 4 + U.rand(-6, 6), yy); } c.stroke(); }
    }
    for (const cp of wd.checkpoints) if (cp.y > cy - 10 && cp.y < cy + H + 50) Art.checkpoint(c, cp.x, cp.y - cy, cp.active, wd.t);
    for (const p of wd.pickups) p.draw(c, 0, cy);
    for (const e of wd.enemies) e.draw(c, 0, cy);
    this.player.draw(c, 0, cy);
    for (const h of wd.hazards) h.draw(c, 0, cy);
    for (const p of wd.projs) p.draw(c, 0, cy);
    c.save(); c.translate(0, -cy); FX.draw(c); c.restore();
    G.drawBubbles(c, 0, cy);
    // предупреждения сверху
    for (const w of wd.warnings) {
      if ((G.t * 10 | 0) % 2) continue;
      const col = w.good ? '#48c048' : '#e03030';
      c.fillStyle = '#111'; c.beginPath(); c.moveTo(w.x, 44); c.lineTo(w.x - 9, 28); c.lineTo(w.x + 9, 28); c.fill();
      c.fillStyle = col; c.beginPath(); c.moveTo(w.x, 41); c.lineTo(w.x - 6, 30); c.lineTo(w.x + 6, 30); c.fill();
      G.text(w.good ? '+' : '!', w.x, 30, { align: 'center', size: 8, color: '#fff', shadow: false });
    }
    Game.drawHUD(c, this.player, wd);
    this.tut.draw(c, this.player.x, this.player.y - cy);
    const m = Math.max(0, Math.round((this.player.y - this.D.topY) / 16));
    G.text('ДО КАБИНЫ: ' + m + ' м', W - 8, 22, { align: 'right', color: '#c8d0d8' });
    if (this.hint) Game.drawHint(c, this.hint.text, this.hintA);
    if (this.fade > 0) { c.fillStyle = `rgba(0,0,0,${this.fade})`; c.fillRect(0, 0, W, H); }
  }
};

// =====================================================================
// 5. АРЕНА НА МОСТУ КРАНА и БОСС НАТАШКА
// =====================================================================
L1.FLOOR = 210;
L1.Natasha = class {
  constructor(x) {
    this.x = x; this.y = L1.FLOOR; this.facing = -1; this.anim = 'idle';
    this.maxHp = 60; this.hp = 60; this.combo = 0; this.lastHit = -9; this.inv = 0;
    this.state = 'idle'; this.st = 0; this.t = 0; this.flash = 0; this.actions = 0; this.volley = 0; this.throwT = 0;
    this.headH = 88; this.voice = 330; this.vx = 0; this.name = 'natasha';
  }
  get box() { return { x: this.x - 14, y: this.y - 70, w: 28, h: 70 }; }
  get weak() { return this.state === 'drink' || this.state === 'dizzy'; }
  get phase2() { return this.hp <= this.maxHp * 0.6; }
  set(s) { this.state = s; this.st = 0; }
  update(dt, arena) {
    const pl = arena.player;
    this.t += dt; this.st += dt; if (this.flash > 0) this.flash -= dt; if (this.inv > 0) this.inv -= dt;
    const dx = pl.x - this.x, adx = Math.abs(dx);
    const spd = this.phase2 ? 1.35 : 1.1;
    let a = 'idle';
    switch (this.state) {
      case 'wait': a = 'idle'; break;
      case 'idle':
        this.facing = dx > 0 ? 1 : -1;
        if (this.st > 0.6 / spd) {
          if (this.actions >= 2) {
            this.actions = 0; this.pickEnd(pl);
            if (this.phase2 && Math.random() < 0.5) { this.set('chargeWind'); G.say(this, 'Задавлю-у-у!', 1.4, { shout: true }); }
            else { this.set('retreat'); G.say(this, U.choice(['Отстань, окаянный!', 'Ишь, какой!', 'Сейчас-сейчас...']), 1.4); }
          } else this.set('walk');
        }
        break;
      case 'walk':
        this.facing = dx > 0 ? 1 : -1;
        this.x += this.facing * 60 * spd * dt;
        a = 'walk';
        if (adx < 42) this.set('wind');
        else if (this.st > 1.8) { this.actions++; this.set('idle'); }
        break;
      case 'wind':
        this.facing = dx > 0 ? 1 : -1; a = 'wind';
        if (this.st > 0.5 / spd) { this.set('slap'); Sound.play('throw'); }
        break;
      case 'slap':
        a = 'slap';
        if (this.st < 0.14) { const hb = { x: this.x + (this.facing > 0 ? 4 : -38), y: this.y - 64, w: 34, h: 40 }; if (U.overlap(hb, pl.box)) pl.hurt(14, this.x, arena.world); }
        if (this.st > 0.55) { this.actions++; this.set('idle'); }
        break;
      case 'retreat':
        this.facing = this.target > this.x ? 1 : -1; a = 'run';
        this.x = U.approach(this.x, this.target, 140 * spd * dt);
        if (Math.abs(this.x - this.target) < 2) { this.set('throw'); this.volley = this.phase2 ? 5 : 4; this.throwT = 0.35; }
        break;
      case 'throw':
        this.facing = dx > 0 ? 1 : -1;
        this.throwT -= dt;
        if (adx < 46) { this.set('wind'); this.st = 0.2; G.say(this, 'Не подходи!', 1); a = 'wind'; break; }
        a = this.throwT < 0.25 ? 'throw' : 'idle';
        if (this.throwT <= 0) {
          if (this.volley > 0) {
            this.volley--; this.throwT = this.phase2 ? 0.45 : 0.55;
            arena.throwBottle(this, pl);
            if (Math.random() < 0.35) G.say(this, U.choice(['Получай, сопляк!', 'На, закуси!', 'Лови, стропаль!']), 1.2);
          } else { this.set('drink'); G.say(this, 'Буль-буль... ик!', 1.8); Sound.play('swig'); }
        }
        break;
      case 'drink': a = 'drink'; if (this.st > 1.8) { this.set('idle'); this.actions = 0; } break;
      case 'chargeWind':
        this.facing = this.target > this.x ? 1 : -1; a = 'wind';
        if (this.st > 0.9) { this.set('charge'); Sound.play('shout'); }
        break;
      case 'charge':
        this.x += this.facing * 220 * dt; a = 'charge';
        if (Math.random() < dt * 20) FX.dust(this.x - this.facing * 10, this.y, 1);
        if (U.overlap(this.box, pl.box)) pl.hurt(16, this.x, arena.world);
        if (this.x < 150 || this.x > 600) { this.x = U.clamp(this.x, 150, 600); this.set('dizzy'); G.shake(6, 0.3); Sound.play('boom'); G.say(this, 'Ой-ёй-ёй...', 1.6); }
        break;
      case 'dizzy': a = 'dizzy'; if (this.st > 1.8) { this.set('idle'); this.actions = 0; } break;
      case 'shove':
        a = 'slap';
        if (this.st < 0.12 && adx < 56) { pl.hurt(5, this.x, arena.world); pl.vx = (dx > 0 ? 1 : -1) * 320; }
        if (this.st > 0.4) { this.pickEnd(pl); this.set('retreat'); }
        break;
      case 'hurt':
        a = 'hurt'; this.x += this.vx * dt; this.vx *= 0.88;
        if (this.st > 0.28) this.set('idle');
        break;
      case 'down': a = 'sitFloor'; break;
    }
    this.x = U.clamp(this.x, 40, 606);
    if (a !== this.anim) { this.anim = a; this.animT = 0; } else this.animT = (this.animT || 0) + dt;
  }
  pickEnd(pl) { this.target = pl.x < 380 ? 590 : 160; }
  hit(dmg, dir, arena) {
    if (this.state === 'down' || this.state === 'wait' || this.state === 'shove') return;
    if (this.inv > 0 && !this.weak) return;
    const mult = this.weak ? 2 : 1;
    if (!this.weak) this.inv = 0.15;
    this.hp -= dmg * mult; this.flash = 0.12;
    Sound.play('hit'); G.hitStop = 0.06;
    if (mult > 1) FX.popText(this.x, this.y - 90, 'x2!', '#ffd84a', 16);
    if (this.hp <= 0) { this.hp = 0; this.set('down'); arena.bossDown(); return; }
    if (!this.weak) {
      this.combo = this.t - this.lastHit < 1.1 ? this.combo + 1 : 1; this.lastHit = this.t;
      if (this.combo >= 3 && ['idle', 'walk', 'wind', 'hurt'].includes(this.state)) {
        this.combo = 0; this.set('shove'); Sound.play('shout');
        G.say(this, U.choice(['А ну брысь!', 'Отвали, окаянный!', 'Кыш!']), 1.2);
        return;
      }
    }
    if (['idle', 'walk'].includes(this.state)) { this.set('hurt'); this.vx = dir * 140; if (Math.random() < 0.3) G.say(this, U.choice(['Ай, ирод!', 'Ой, батюшки!', 'Я на тебя жаловаться буду!']), 1.2); }
  }
  draw(c) {
    let rot = 0;
    if (this.anim === 'idle') rot = Math.sin(this.t * 2.2) * 0.05;
    if (this.anim === 'charge') rot = Math.sin(this.t * 20) * 0.05;
    const y = this.anim === 'run' || this.anim === 'walk' ? this.y - Math.abs(Math.sin(this.t * 10)) * 1.5 : this.y;
    Spr.drawAnim(c, 'natasha', this.anim, this.animT || 0, this.x, y, this.facing, { rot, flash: this.flash > 0 ? '#ffffff' : null });
    if (this.weak && (G.t * 6 | 0) % 2) G.text('СЛАБОЕ МЕСТО!', this.x, this.y - 100, { align: 'center', color: '#ffd84a', size: 8, outline: true });
  }
};

L1.Arena = class {
  constructor(level) {
    this.level = level;
    const wd = this.world = new Game.World(W, H);
    wd.stats = level.stats; wd.score = level.score;
    wd.addScore = n => { wd.score += n; level.score = wd.score; };
    wd.addPlat({ x: 0, y: L1.FLOOR, w: W, h: 150, oneway: false, look: 'none' });
    this.player = null; this.boss = null; this.fighting = false;
    wd.playerAttack = (hb, dmg, atk, pl) => this.playerAttack(hb, dmg, atk, pl);
    wd.spawnPlayerProj = (k, x, y, d) => wd.projs.push(new Game.Proj(k, x, y, d));
    wd.onDeflectedHazard = h => {
      const b = this.boss;
      if (b && b.hit && U.overlap(h.box, b.box) && b.state !== 'down') { h.shatter(wd); b.hit(4, h.vx > 0 ? 1 : -1, this); FX.popText(b.x, b.y - 80, 'ВОЗВРАТ ТАРЫ!', '#8cd0ff'); wd.addScore(300); }
    };
    this.quipT = 3; this.dropped = {}; this.birds = 0; this.hint = null; this.hintA = 0; this.hintT = 0;
    this.actors = []; this.ropes = [];
  }
  startFight(pl, boss) {
    this.player = pl; this.boss = boss; this.fighting = true; pl.controls = true;
    boss.set('idle');
    this.hint = 'Бей Наташку {punch}! Бутылки можно отбить ударом — прямо ей в лоб!'; this.hintT = 6;
  }
  throwBottle(b, pl) {
    const sx = b.x + b.facing * 12, sy = b.y - 72;
    const tx = U.clamp(pl.x + pl.vx * 0.3 + U.rand(-24, 24), 20, 620), ty = L1.FLOOR - 6;
    const T = 0.95 + Math.abs(tx - sx) / 800;
    const g = GRAV * 0.6;
    this.world.hazards.push(new Game.Hazard('bottle', sx, sy, (tx - sx) / T, (ty - sy - 0.5 * g * T * T) / T));
    Sound.play('throw');
  }
  playerAttack(hb, dmg, atk, pl) {
    const wd = this.world, b = this.boss;
    if (b && b.hit && !atk.hit.has(b) && U.overlap(hb, b.box) && b.state !== 'down') {
      atk.hit.add(b); b.hit(dmg, pl.facing, this);
      G.shake(2, 0.1); wd.addScore(100 * dmg);
      FX.burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 7, { colors: ['#fff', '#ffd84a'], speed: 130, life: 0.25, grav: 0 });
      if (b.weak && Math.random() < 0.5) G.say(pl, U.choice(['Ахахахах!', 'Лол!']), 1.2);
    }
    for (const h of wd.hazards) {
      if (h.deflected || atk.hit.has(h)) continue;
      if (U.overlap(hb, h.box)) {
        atk.hit.add(h); h.deflected = true; h.vx = pl.facing * 400; h.vy = -60; h.grav = 120; h.vr = 25;
        wd.stats.deflect++; Sound.play('deflect'); FX.popText(h.x, h.y - 10, 'ОТБИЛ!', '#8cd0ff');
      }
    }
  }
  bossDown() {
    this.fighting = false; this.player.controls = false; this.hintT = 0; this.hintA = 0;
    this.world.hazards.forEach(h => h.shatter(this.world)); this.world.hazards = [];
    this.world.addScore(5000); this.level.stats.kills++;
    G.shake(8, 0.5); G.flash(0.2);
    Music.stop(); Sound.play('boom');
    setTimeout(() => this.level.bossDefeated(), 1400);
  }
  update(dt) {
    const wd = this.world, pl = this.player, b = this.boss;
    wd.t += dt;
    if (this.fighting) this.level.stats.time += dt;
    if (pl) { pl.update(dt, wd); pl.x = U.clamp(pl.x, 14, 612); }
    if (b && b.update) b.update(dt, this);
    for (const h of wd.hazards) h.update(dt, wd, pl);
    wd.hazards = wd.hazards.filter(h => !h.dead);
    for (const p of wd.projs) {
      p.update(dt, wd, pl);
      if (b && b.hit && !p.dead && !p.hitSet.has(b) && b.state !== 'down' && U.overlap(p.box, b.box)) { p.hitSet.add(b); b.hit(p.dmg, p.dir, this); wd.addScore(80); if (!p.pierce) { p.dead = true; p.poof(); } }
    }
    wd.projs = wd.projs.filter(p => !p.dead);
    if (pl) for (const p of wd.pickups) p.update(dt, wd, pl);
    wd.pickups = wd.pickups.filter(p => !p.dead);
    for (const a of this.actors) a.update(dt);
    if (this.fighting) {
      [40, 20].forEach(th => { if (b.hp <= th && !this.dropped[th]) { this.dropped[th] = 1; const p = new Game.Pickup(th === 40 ? 'pie' : 'kefir', U.rand(200, 560), -10); p.falling = true; wd.pickups.push(p); } });
      this.quipT -= dt;
      if (this.quipT <= 0) { this.quipT = U.rand(6, 9); G.say(pl, U.choice(['Слабая женщина!', 'Это всё в твоей голове, сног!', 'Ахахахах!', 'Лол!', 'Чё, рак, ты живой?']), 1.8); }
      if (pl.dead && pl.deadT > 1.6 && !this.resetting) {
        this.resetting = true; this.level.stats.deaths++;
        setTimeout(() => { this.resetting = false; this.level.restartBoss(); }, 400);
      }
    }
    if (this.hintT > 0) { this.hintT -= dt; this.hintA = Math.min(1, this.hintA + dt * 4); } else this.hintA = Math.max(0, this.hintA - dt * 3);
    for (const r of this.ropes) r.len = Math.min(r.max, r.len + dt * 420);
  }
  draw(c) {
    const wd = this.world;
    c.drawImage(G.bg.arena, 0, 0, W, H);
    for (const r of this.ropes) {
      if (!r.actor || r.actor.anim !== 'rappel') continue;
      const f = Spr.frame('cmd', 0), len = r.actor.y - f[5] / 2 + 6;
      if (len <= 0) continue;
      Art.R(c, r.x, 0, 2, len, '#2a2418'); Art.R(c, r.x, 0, 1, len, '#6a5a3e');
      for (let y = (G.t * 60) % 6; y < len; y += 6) Art.R(c, r.x, y, 2, 1, '#1a160e');
    }
    for (const p of wd.pickups) p.draw(c, 0, 0);
    for (const a of this.actors) a.draw(c, 0, 0);
    if (this.boss && this.boss.draw) this.boss.draw(c);
    if (this.player) this.player.draw(c, 0, 0);
    for (const h of wd.hazards) h.draw(c, 0, 0);
    for (const p of wd.projs) p.draw(c, 0, 0);
    if (this.birds && this.boss) {
      const b = this.boss;
      for (let i = 0; i < 3; i++) {
        const a = G.t * 3 + i * 2.1;
        const bx = b.x + Math.cos(a) * 16, by = b.y - 58 + Math.sin(a) * 5;
        Art.R(c, bx - 2, by - 1, 5, 3, '#f0d040'); Art.R(c, bx + 2, by - 2, 2, 2, '#f0d040'); Art.R(c, bx + 4, by - 1, 1, 1, '#e07020');
        if ((G.t * 8 + i | 0) % 2) Art.R(c, bx - 1, by - 3, 3, 2, '#d8b020');
      }
      if (Math.random() < 0.02) Sound.play('bird');
    }
    FX.draw(c);
    G.drawBubbles(c, 0, 0);
    if (this.player && this.fighting) Game.drawHUD(c, this.player, wd);
    if (this.boss && this.fighting) {
      const b = this.boss;
      Art.R(c, 160, H - 26, 320, 16, '#111'); Art.R(c, 162, H - 24, 316, 12, '#3a1010');
      Art.R(c, 162, H - 24, Math.round(316 * b.hp / b.maxHp), 12, b.weak ? '#ffd84a' : '#d83040');
      G.text('НАТАШКА — КРАНОВЩИЦА 6-го РАЗРЯДА', W / 2, H - 40, { align: 'center', color: '#ffb0b8', outline: true });
    }
    if (this.hint) Game.drawHint(c, this.hint, this.hintA, 44);
  }
};

// =====================================================================
// 6. КАТСЦЕНЫ
// =====================================================================
// --- 6.1 Вид на Севмолот: «ДЕНЬ ПЕРВЫЙ» ---
L1.sceneAerial = function (level) {
  const st = { pan: 0, cap: '', title: 0, fade: 1, gulls: [] };
  const img = G.bg.aerial, iw = img.width / 2;
  for (let i = 0; i < 7; i++) st.gulls.push({ x: U.rand(0, iw), y: U.rand(60, 220), s: U.rand(15, 35), p: U.rand(0, 6) });
  level.drawScene = c => {
    const off = st.pan;
    c.drawImage(img, -off, 0, iw, H);
    c.save(); c.translate(-off, 0); FX.draw(c); c.restore();
    for (const g of st.gulls) {
      const x = g.x - off, f = Math.sin(G.t * 8 + g.p) * 2;
      c.fillStyle = '#e8ecee'; c.fillRect(x - 2, g.y, 5, 1.5); c.fillRect(x - 5, g.y - f, 3, 1); c.fillRect(x + 3, g.y - f, 3, 1);
    }
    if (st.cap) { Art.R(c, 14, 14, G.textWidth(st.cap, 8) + 16, 20, 'rgba(0,0,0,0.6)'); G.text(st.cap, 22, 20, { color: '#e8e0c8' }); }
    if (st.title > 0) { c.fillStyle = `rgba(0,0,0,${0.35 * st.title})`; c.fillRect(0, 0, W, H); }
    G.bigTitle(c, 'ДЕНЬ ПЕРВЫЙ', st.title, { size: 32, y: H / 2 - 10 });
    if (st.title > 0) G.text('Выборгск. Судоверфь «Севмолот»', W / 2, H / 2 + 26, { align: 'center', color: '#c8d0d8', outline: true });
    if (st.fade > 0) { c.fillStyle = `rgba(0,0,0,${st.fade})`; c.fillRect(0, 0, W, H); }
  };
  level.updateScene = dt => {
    for (const g of st.gulls) { g.x += g.s * dt; if (g.x > iw + 20) g.x = -20; }
    FX.update(dt);
  };
  return function* () {
    Music.play('intro');
    yield* Scene.tween(1.0, k => { st.fade = 1 - k; });
    const full = 'Выборгск, Лемурия. 2003 год.';
    for (let i = 1; i <= full.length; i++) { st.cap = full.slice(0, i); Sound.play('blip', 500); yield Scene.fast ? 0 : 0.05; }
    yield* Scene.tween(5.0, k => { st.pan = U.easeInOut(k) * (iw - W); });
    Sound.play('boom'); G.shake(5, 0.4);
    yield* Scene.tween(0.5, k => { st.title = k; });
    yield 2.4;
    yield* Scene.tween(0.8, k => { st.fade = k; });
    FX.list = [];
  };
};

// --- 6.2 В цеху: стропы, «Вира!», каска об пол, кирпич ---
L1.sceneIntro = function (level) {
  const st = { lift: 0, fade: 1, helmet: null, brick: null, obj: 0 };
  const FL = 332;
  const v = new G.Actor('valera', 330, FL, 1); v.helmet = true; v.setAnim('work');
  const smoker = { x: 70, y: FL };
  level.drawScene = c => {
    const img = G.bg.hall;
    c.drawImage(img, 0, 0, W, H);
    // подлодка — отдельный спрайт, крюк висит на тросах мостового крана
    const sx = L1.SUB_X, sy = L1.SUB_Y - st.lift;
    const f = Spr.frame('sub', 0);
    if (f) {
      const hx = sx + (f[6] - f[4]) / 2, hy = sy + (f[7] - f[5]) / 2;
      Art.R(c, hx - 4, L1.TROLLEY_Y, 2, hy - L1.TROLLEY_Y + 4, '#1a1a1a'); Art.R(c, hx + 2, L1.TROLLEY_Y, 2, hy - L1.TROLLEY_Y + 4, '#1a1a1a');
    }
    Spr.draw(c, 'sub', 0, sx, sy, 1);
    Spr.draw(c, 'wk_a', 6, smoker.x, smoker.y, 1);
    v.draw(c);
    if (st.helmet) Art.item(c, 'helmet', st.helmet.x, st.helmet.y, st.helmet.r, 1.2);
    if (st.brick) Art.item(c, 'brick', st.brick.x, st.brick.y, st.brick.r, 1.3);
    FX.draw(c);
    G.drawBubbles(c, 0, 0);
    Scene.drawDialog(c);
    if (st.obj > 0) {
      c.globalAlpha = Math.min(1, st.obj);
      Art.R(c, 0, 120, W, 60, 'rgba(0,0,0,0.75)');
      G.text('ЗАДАНИЕ', W / 2, 130, { align: 'center', color: '#ffd84a', size: 8 });
      G.text('ЗАБЕРИСЬ НА КРАН!', W / 2, 146, { align: 'center', size: 16, outline: true });
      c.globalAlpha = 1;
    }
    if (st.fade > 0) { c.fillStyle = `rgba(0,0,0,${st.fade})`; c.fillRect(0, 0, W, H); }
  };
  level.updateScene = dt => {
    v.update(dt);
    if (Math.random() < dt * 1.2) FX.spawn({ x: smoker.x + 10, y: smoker.y - 58, vx: 8, vy: -14, grav: -5, life: 1.8, color: '#8a8f94', size: 2, type: 'puff' });
    if (st.helmet && !st.helmet.rest) {
      const h = st.helmet; h.vy += 900 * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.r += h.vr * dt;
      if (h.y > FL - 5) { h.y = FL - 5; if (Math.abs(h.vy) > 80) { h.vy *= -0.4; h.vx *= 0.6; Sound.play('clank', 0.8); } else { h.rest = true; h.r = 0; } }
    }
    if (st.brick && !st.brick.rest) { const b = st.brick; b.vy += 1400 * dt; b.y += b.vy * dt; b.r += 6 * dt; if (b.y > FL - 5) { b.y = FL - 5; b.rest = true; b.r = 0.2; Sound.play('brick'); G.shake(6, 0.3); FX.dust(b.x, FL, 10); FX.burst(b.x, FL - 4, 8, { colors: ['#a8452e', '#7a2e1e'], speed: 120, size: 3 }); } }
    FX.update(dt); G.updateBubbles(dt);
  };
  const liftTry = function* () {
    Sound.play('crane');
    yield* Scene.tween(0.7, k => { st.lift = 10 * k; });
    yield 0.25;
    yield* Scene.tween(0.12, k => { st.lift = 10 * (1 - k); });
    st.lift = 0;
    Sound.play('boom'); G.shake(7, 0.35);
    FX.dust(200, 290, 10); FX.dust(450, 290, 10);
  };
  return function* () {
    Music.play('cutscene');
    yield* Scene.tween(0.8, k => { st.fade = 1 - k; });
    yield 1.4;
    v.setAnim('walk');
    yield* Scene.moveTo(v, 250, 55, 'walk');
    v.facing = 1; v.setAnim('lookUpHat');
    yield 0.6;
    v.setAnim('shout'); Sound.play('shout');
    G.say(v, 'ВИРА-А-А!!!', 1.6, { shout: true });
    yield 1.3;
    v.setAnim('lookUpHat');
    yield* liftTry();
    v.setAnim('scared'); yield 0.5; v.setAnim('lookUpHat');
    yield 0.4;
    v.setAnim('shout'); Sound.play('shout');
    G.say(v, 'МАЙНА!.. Тьфу! ВИРА, ГОВОРЮ!!!', 1.8, { shout: true });
    yield 1.5;
    v.setAnim('lookUpHat');
    yield* liftTry();
    yield 0.4;
    v.setAnim('stomp');
    yield* Scene.say('valera', 'Да что ж такое-то! Наташка опять уснула в кабине?!', v);
    // швыряет каску об пол
    v.helmet = false;
    v.setAnim('slamHat'); Sound.play('throw');
    yield 0.35;
    Sound.play('clank', 0.8); G.shake(2, 0.15);
    yield 0.7;
    st.helmet = { x: v.x + 23, y: FL - 5, r: 0, rest: true };
    v.setAnim('hips');
    yield* Scene.say('valera', 'Приходится всё делать самому!', v);
    v.setAnim('stand');
    yield 0.3;
    Sound.play('warn');
    st.brick = { x: v.x + 26, y: -20, vy: 200, r: 0 };
    yield () => st.brick.rest;
    v.setAnim('scared');
    G.say(v, '!!!', 1.0, { shout: true });
    yield 1.0;
    v.setAnim('lookUp');
    G.say(v, 'Та-а-ак...', 1.4);
    yield 1.4;
    yield* Scene.tween(0.4, k => { st.obj = k; });
    Sound.play('confirm');
    yield 1.6;
    yield* Scene.tween(0.6, k => { st.fade = k; });
    st.obj = 0;
    FX.list = [];
  };
};

// --- 6.3 В кабине: разговор с Наташкой ---
L1.CHAIR_X = 52;
L1.SUB_X = 373; L1.SUB_Y = 288; L1.TROLLEY_Y = 58; L1.ROPE_DX = 3;
L1.sceneCab = function (level) {
  const ar = level.arena;
  const st = { fade: 1, title: 0 };
  const v = new G.Actor('valera', 582, L1.FLOOR + 90, -1);
  v.clipY = L1.FLOOR + 2;
  const n = new G.Actor('natasha', L1.CHAIR_X, L1.FLOOR, 1); n.setAnim('sitChair'); n.voice = 330;
  ar.actors = [n, v];
  level.drawScene = c => {
    ar.draw(c);
    G.bigTitle(c, 'БОЙ!', st.title, { size: 32, color: '#ff5a3a' });
    Scene.drawDialog(c);
    if (st.fade > 0) { c.fillStyle = `rgba(0,0,0,${st.fade})`; c.fillRect(0, 0, W, H); }
  };
  level.updateScene = dt => { ar.update(dt); FX.update(dt); G.updateBubbles(dt); };
  return function* () {
    Scene.dialogTop = true;
    Music.play('cutscene');
    v.setAnim('climb');
    yield* Scene.tween(0.6, k => { st.fade = 1 - k; });
    yield* Scene.tween(1.4, k => { v.y = L1.FLOOR + 90 - 90 * k; });
    v.y = L1.FLOOR; v.setAnim('stand'); Sound.play('land');
    yield 0.3;
    yield* Scene.moveTo(v, 150, 70, 'walk');
    v.facing = -1;
    yield* Scene.say('natasha', 'Ты что делаешь? У меня смена закончилась!', n);
    v.setAnim('point');
    yield* Scene.say('valera', 'Наташка, пусти меня за кран, я всё сам сделаю!', v);
    v.setAnim('stand');
    yield* Scene.say('natasha', 'Краник у тебя ещё не дорос!', n);
    v.setAnim('stomp');
    yield 1.1;
    yield* Scene.say('valera', 'Сейчас я с тобой разберусь, стерва!', v);
    n.setAnim('stand');
    yield 0.3;
    Sound.play('jump');
    const x0 = n.x;
    n.setAnim('jump');
    yield* Scene.tween(0.8, k => { n.x = U.lerp(x0, 360, k); n.y = L1.FLOOR - Math.sin(k * Math.PI) * 90; });
    n.y = L1.FLOOR; n.setAnim('stand'); n.facing = -1; Sound.play('stomp'); G.shake(4, 0.2);
    G.say(n, 'Ну иди сюда, сопляк!', 1.6);
    Music.play('boss');
    yield* Scene.tween(0.3, k => { st.title = k; });
    yield 0.9;
    st.title = 0;
  };
};

// --- 6.4 После боя: записка, кран, спецназ из Индии ---
L1.sceneFinale = function (level) {
  const ar = level.arena;
  const st = { fade: 0, title: 0, lifted: 0 };
  const b = ar.boss;
  const v = new G.Actor('valera', ar.player.x, L1.FLOOR, ar.player.facing);
  const n = new G.Actor('natasha', b.x, L1.FLOOR, b.facing); n.setAnim('sitFloor'); n.voice = 330; n.headH = 60;
  ar.player = null; ar.birds = 1;
  ar.boss = { x: n.x, y: L1.FLOOR };
  ar.actors = [n, v];
  ar.world.pickups = [];
  const cmd = [];
  level.drawScene = c => {
    ar.draw(c);
    if (st.lifted > 0) { c.globalAlpha = Math.min(1, st.lifted); G.text('СТРОПЫ ПОДНЯТЫ!', W / 2, 110, { align: 'center', size: 16, color: '#8cf08c', outline: true }); c.globalAlpha = 1; }
    Scene.drawDialog(c);
    G.bigTitle(c, 'КОНЕЦ УРОВНЯ 1', st.title, { size: 24, color: '#ffd84a' });
    if (st.fade > 0) { c.fillStyle = `rgba(0,0,0,${st.fade})`; c.fillRect(0, 0, W, H); }
  };
  level.updateScene = dt => { ar.boss.x = n.x; ar.update(dt); FX.update(dt); G.updateBubbles(dt); };
  const fakeBottom = { x: 430, y: H + 30, bx: 430, by: H - 20 };
  return function* () {
    Scene.dialogTop = true;
    Music.play('cutscene');
    yield 0.8;
    n.facing = v.x > n.x ? 1 : -1;
    yield* Scene.say('natasha', 'Я на тебя служебную записку напишу!', n);
    v.facing = n.x > v.x ? 1 : -1;
    v.setAnim('hips'); yield 0.8;
    v.setAnim('stand');
    yield* Scene.say('valera', 'А вот теперь у меня смена кончилась!', v);
    yield* Scene.moveTo(v, L1.CHAIR_X + 4, 80, 'walk');
    v.facing = 1;
    v.setAnim('lever');
    yield 0.4;
    Sound.play('lever'); yield 0.3; Sound.play('crane');
    G.shake(2, 1.2);
    yield 1.2;
    Sound.play('crane');
    yield* Scene.tween(0.4, k => { st.lifted = k; });
    Sound.play('checkpoint');
    G.say(fakeBottom, 'УРА-А-А! ВАЛЕРА!', 1.8);
    yield 1.4;
    yield* Scene.tween(0.4, k => { st.lifted = 1 - k; });
    v.setAnim('sitChair');
    yield 1.0;
    v.setAnim('yawn'); v.facing = 1;
    yield 1.2;
    v.setAnim('tired');
    yield* Scene.say('valera', 'Ух, вот это денёк... Я устал, пойду домой.', v);
    yield* Scene.moveTo(v, 700, 60, 'walk');
    v.visible = false;
    yield 1.2;
    Music.stop();
    Sound.play('rope');
    const xs = [290, 370, 460, 540];
    xs.forEach(x => ar.ropes.push({ x, len: 0, max: L1.FLOOR - 4 }));
    yield 0.8;
    Music.play('sting');
    xs.forEach((x, i) => {
      const a = new G.Actor('commando', x + 2, -40 - i * 40, 1);
      a.setAnim('rappel'); a.voice = i === 1 ? 150 : 170;
      cmd.push(a); ar.actors.push(a);
      const f = Spr.frame('cmd', 0); ar.ropes[i].x = x + 2 + (L1.ROPE_DX || 0); ar.ropes[i].actor = a;
    });
    Sound.play('rope');
    yield* Scene.tween(1.6, k => { cmd.forEach((a, i) => { const kk = U.clamp(k * 1.3 - i * 0.1, 0, 1); a.y = U.lerp(-40 - i * 40, L1.FLOOR, U.easeOut(kk)); }); });
    cmd.forEach((a, i) => { a.y = L1.FLOOR; a.setAnim(i < 2 ? 'rifle' : 'rifleL'); a.facing = i < 2 ? 1 : -1; });
    cmd[1].setAnim('point'); cmd[1].facing = 1;
    cmd[0].setAnim('surprised'); cmd[0].facing = 1;
    Sound.play('stomp'); G.shake(3, 0.2);
    ar.ropes = [];
    yield 0.6;
    yield* Scene.say('commando', 'Кто этот герой?', cmd[0]);
    yield* Scene.say('commando2', 'Это агент RED! Его нужно устранить.', cmd[1]);
    Sound.play('sting'); G.shake(3, 0.3);
    yield 1.0;
    yield* Scene.tween(0.5, k => { st.title = k; });
    yield 2.0;
    yield* Scene.tween(0.8, k => { st.fade = k; });
  };
};

// =====================================================================
// 7. КОНТРОЛЛЕР УРОВНЯ
// =====================================================================
L1.Level = class {
  constructor() {
    this.stats = { time: 0, dmg: 0, kills: 0, deflect: 0, secrets: 0, food: 0, deaths: 0 };
    this.score = 0; this.mode = null; this.drawScene = null; this.updateScene = null;
  }
  start(skipIntro) {
    if (skipIntro) return this.startClimb();
    this.playScene(L1.sceneAerial(this), () => this.playScene(L1.sceneIntro(this), () => this.startClimb()));
  }
  playScene(gen, next) {
    this.mode = 'scene';
    Scene.run(gen, next);
  }
  startClimb() {
    this.mode = 'climb';
    FX.list = []; G.bubbles = [];
    this.climb = new L1.Climb(this);
    Music.play('level');
    G.say(this.climb.player, 'Ну, Наташка, держись!', 2);
  }
  climbDone() {
    const pl = this.climb.player;
    this.carry = { ammo: pl.ammo, weapon: pl.weapon, hp: pl.hp };
    setTimeout(() => {
      Music.stop();
      FX.list = []; G.bubbles = [];
      this.arena = new L1.Arena(this);
      this.playScene(L1.sceneCab(this), () => this.startBoss());
    }, 500);
  }
  startBoss(restart) {
    const ar = this.arena;
    FX.list = []; G.bubbles = [];
    ar.actors = [];
    ar.world.hazards = []; ar.world.projs = []; ar.world.pickups = [];
    ar.dropped = {};
    const pl = new Game.Player(150, L1.FLOOR);
    pl.ammo = Object.assign({}, this.carry.ammo); pl.weapon = this.carry.weapon;
    pl.ammo.nuts = Math.max(pl.ammo.nuts, 8);
    pl.hp = restart ? 100 : Math.max(this.carry.hp, 70);
    const boss = new L1.Natasha(360); boss.facing = -1;
    ar.startFight(pl, boss);
    this.mode = 'boss';
    Music.play('boss');
    if (restart) G.say(pl, 'Второй раунд, Наташка!', 1.6);
  }
  restartBoss() { this.startBoss(true); }
  bossDefeated() {
    this.playScene(L1.sceneFinale(this), () => { this.mode = 'done'; G.onLevelComplete(this); });
  }
  update(dt) {
    if (this.mode === 'scene') { Scene.tick(dt); if (this.updateScene) this.updateScene(dt); }
    else if (this.mode === 'climb') { this.climb.update(dt); FX.update(dt); G.updateBubbles(dt); }
    else if (this.mode === 'boss') { this.arena.update(dt); FX.update(dt); G.updateBubbles(dt); }
  }
  draw(c) {
    if (this.mode === 'scene' && this.drawScene) {
      this.drawScene(c);
      if (Scene.t < 3) G.text('Esc — пропустить', W - 8, H - 12, { align: 'right', size: 8, color: 'rgba(255,255,255,0.5)' });
    }
    else if (this.mode === 'climb') this.climb.draw(c);
    else if (this.mode === 'boss') this.arena.draw(c);
  }
  get canPause() { return this.mode === 'climb' || this.mode === 'boss'; }
};
