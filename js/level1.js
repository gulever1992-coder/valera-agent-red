'use strict';
// ============ УРОВЕНЬ 1: «СЕВМАШ. ДЕНЬ ПЕРВЫЙ» ============
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
  D.hints.push({ x: 0, y: -90, w: 170, h: 100, text: 'Добро пожаловать на Севмаш! {left} {right} — ходить.' });
  D.hints.push({ x: 170, y: -90, w: 100, h: 100, text: '{jump} — прыжок. Держи дольше — прыгнешь выше.' });
  D.hints.push({ x: 270, y: -90, w: 150, h: 100, text: '{punch} — удар. Жми 3 раза подряд — серия с апперкотом!' });
  D.hints.push({ x: 420, y: -90, w: 110, h: 100, text: 'Гайки! {throw} — бросить. {switch} — сменить снаряд.' });
  D.hints.push({ x: 530, y: -150, w: 110, h: 160, text: '{up} у лестницы — лезть наверх, {down} — вниз.' });
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
  const types = ['lathe', 'drink', 'argue', 'weld', 'smoke', 'domino', 'hammer', 'sleep', 'lathe', 'drink', 'argue', 'weld', 'smoke', 'hammer', 'domino', 'sleep', 'drink', 'argue'];
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
// 2. ФОН ЦЕХА (кэш кусками, параллакс)
// =====================================================================
const SLOGANS = ['СЛАВА КОРАБЕЛАМ!', 'ПЛАН — ЗАКОН!', 'СЕВМАШ — ФЛОТУ РОССИИ', 'ТРУД — ДЕЛО ЧЕСТИ', 'КАЧЕСТВО — НАШЕ ЛИЦО'];
L1.BG = class {
  constructor(D) {
    this.D = D;
    this.farH = H + (D.worldH - H) * 0.5;
    this.far = new Map(); this.mid = new Map();
  }
  farChunk(i) {
    if (this.far.has(i)) return this.far.get(i);
    const [cv, c] = G.makeCanvas(W, H);
    const top = i * H;
    c.translate(0, -top);
    Rr(c, 0, top, W, H, '#3a3f45');
    for (let y = Math.floor(top / 48) * 48; y < top + H; y += 48) Rr(c, 0, y, W, 1, '#333840');
    // окна-ленты
    const bandTop = 60, bandStep = 300, bandH = 130;
    for (let j = Math.max(0, Math.floor((top - bandTop - bandH) / bandStep)); ; j++) {
      const y0 = bandTop + j * bandStep;
      if (y0 > top + H) break;
      const r = U.seeded(j * 97 + 3);
      Rr(c, 0, y0 - 4, W, bandH + 8, '#2a2f34');
      for (let x = 4; x < W; x += 20) for (let y = y0; y < y0 + bandH; y += 22) {
        const q = r();
        Rr(c, x, y, 17, 19, q < 0.07 ? '#1d2126' : q < 0.4 ? '#7d8a95' : q < 0.8 ? '#8a97a2' : '#6e7a85');
        if (q > 0.93) Rr(c, x + 3, y + 3, 6, 1, '#b4c0c8');
      }
      // лучи света из окон
      c.fillStyle = 'rgba(200,215,225,0.045)';
      for (let s = 0; s < 3; s++) {
        const sx = 60 + ((j * 211 + s * 197) % 520);
        c.beginPath(); c.moveTo(sx, y0 + bandH); c.lineTo(sx + 50, y0 + bandH); c.lineTo(sx + 170, y0 + bandH + 170); c.lineTo(sx + 90, y0 + bandH + 170); c.fill();
      }
      if (j % 2 === 1) {
        const txt = SLOGANS[(j >> 1) % SLOGANS.length];
        const bw = txt.length * 8 + 24;
        const bx = (W - bw) / 2 + ((j * 53) % 120) - 60;
        Rr(c, bx, y0 + bandH + 30, bw, 18, '#7c201c'); Rr(c, bx, y0 + bandH + 30, bw, 2, '#9c302a');
        c.font = '8px "Press Start 2P", monospace'; c.textBaseline = 'top'; c.fillStyle = '#d8ccb0';
        c.fillText(txt, bx + 12, y0 + bandH + 35);
      }
    }
    // колонны
    for (let x = 40; x < W; x += 128) {
      Rr(c, x, top, 22, H, '#30353b'); Rr(c, x + 2, top, 3, H, '#40464d'); Rr(c, x + 18, top, 2, H, '#262a2f');
    }
    // крыша с фермами
    if (top < 80) {
      Rr(c, 0, 0, W, 50, '#22262b');
      c.strokeStyle = '#3c424a'; c.lineWidth = 2;
      for (let x = 0; x < W; x += 40) { c.beginPath(); c.moveTo(x, 50); c.lineTo(x + 20, 14); c.lineTo(x + 40, 50); c.stroke(); }
      Rr(c, 0, 48, W, 4, '#3c424a');
    }
    this.far.set(i, cv);
    return cv;
  }
  midChunk(i) {
    if (this.mid.has(i)) return this.mid.get(i);
    const D = this.D;
    const [cv, c] = G.makeCanvas(W, H);
    const top = i * H;
    c.translate(0, -top);
    const vis = (y1, y2) => y2 >= top - 20 && y1 <= top + H + 20;
    // трубы вертикальные
    [[26, '#4a5a52'], [606, '#5a4a44']].forEach(([x, col]) => {
      Rr(c, x, top, 8, H, '#15171a'); Rr(c, x + 1, top, 6, H, col); Rr(c, x + 2, top, 1, H, 'rgba(255,255,255,0.15)');
      for (let y = Math.ceil(top / 90) * 90; y < top + H; y += 90) Rr(c, x - 2, y, 12, 4, '#2a2e33');
    });
    // двутавры по краям
    [0, 624].forEach(x => {
      Rr(c, x, top, 16, H, '#15171a'); Rr(c, x + 1, top, 14, H, '#4c535a'); Rr(c, x + 5, top, 6, H, '#3a4046');
      for (let y = Math.ceil(top / 24) * 24; y < top + H; y += 24) { Rr(c, x + 2, y, 2, 2, '#2a2e33'); Rr(c, x + 12, y, 2, 2, '#2a2e33'); }
    });
    // подводная лодка внизу
    if (vis(D.floorY - 280, D.floorY)) {
      for (let x = 300; x < 640; x += 90) Rr(c, x, D.floorY - 22, 34, 22, '#4a3e32');
      Art.submarine(c, 190, D.floorY - 22 - 29, 560, 2.4);
    }
    // галереи
    for (const g of D.galleries) {
      if (!vis(g.y - 40, g.y + 30)) continue;
      Rr(c, g.x1, g.y, g.x2 - g.x1, 5, '#1c1f23'); Rr(c, g.x1, g.y + 1, g.x2 - g.x1, 3, '#555c64');
      for (let x = g.x1; x < g.x2; x += 4) Rr(c, x, g.y + 2, 1, 1, '#2a2e33');
      Rr(c, g.x1, g.y - 22, g.x2 - g.x1, 2, '#555c64');
      Rr(c, g.x1, g.y - 12, g.x2 - g.x1, 1, '#454b52');
      for (let x = g.x1; x <= g.x2; x += 24) Rr(c, x, g.y - 22, 2, 22, '#454b52');
      // кронштейны
      for (let x = g.x1 + 20; x < g.x2; x += 90) { c.strokeStyle = '#3a3f45'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, g.y + 5); c.lineTo(x + 20, g.y + 30); c.stroke(); }
    }
    // лампы
    for (let y = D.floorY - 200; y > D.topY; y -= 340) {
      if (!vis(y - 60, y + 120)) continue;
      [160, 480].forEach(x => {
        const xx = x + ((y / 7) % 60);
        Rr(c, xx, y - 60, 1, 50, '#222');
        c.fillStyle = '#2a2e33'; c.beginPath(); c.moveTo(xx - 10, y - 4); c.lineTo(xx + 11, y - 4); c.lineTo(xx + 5, y - 12); c.lineTo(xx - 4, y - 12); c.fill();
        Rr(c, xx - 4, y - 4, 9, 2, '#f8e8a8');
        c.fillStyle = 'rgba(255,230,160,0.06)'; c.beginPath(); c.moveTo(xx - 8, y - 2); c.lineTo(xx + 9, y - 2); c.lineTo(xx + 50, y + 110); c.lineTo(xx - 50, y + 110); c.fill();
      });
    }
    // плакаты
    for (const p of D.posters) if (vis(p.y - 60, p.y + 10)) L1.drawPoster(c, p);
    // горизонтальные трубы
    for (let y = D.floorY - 520; y > D.topY + 100; y -= 610) {
      if (!vis(y - 10, y + 10)) continue;
      Rr(c, 16, y, 608, 7, '#15171a'); Rr(c, 16, y + 1, 608, 5, '#6a5040'); Rr(c, 16, y + 1, 608, 1, '#8a6a54');
      for (let x = 60; x < 600; x += 130) { Rr(c, x, y - 3, 6, 13, '#2a2e33'); Rr(c, x - 3, y - 6, 12, 3, '#b8342e'); }
    }
    // мостовой кран наверху
    if (vis(D.topY - 200, D.topY + 20)) {
      const by = D.topY - 150;
      Rr(c, 0, by, W, 26, '#15171a'); Rr(c, 0, by + 1, W, 24, '#d8a820');
      for (let x = 0; x < W; x += 26) { c.fillStyle = '#15171a'; c.beginPath(); c.moveTo(x, by + 25); c.lineTo(x + 13, by + 1); c.lineTo(x + 18, by + 1); c.lineTo(x + 5, by + 25); c.fill(); }
      c.font = '8px "Press Start 2P", monospace'; c.textBaseline = 'top'; c.fillStyle = '#15171a';
      Rr(c, 250, by + 6, 140, 14, '#d8a820'); c.fillText('Q = 400 т', 268, by + 9);
      // кабина
      const cd = D.cabDoor;
      const cx = cd.x - 20;
      Rr(c, cx, by + 26, 130, D.topY - by - 26, '#15171a');
      Rr(c, cx + 2, by + 28, 126, D.topY - by - 30, '#5a6068');
      Rr(c, cx + 10, by + 40, 50, 30, '#8a9aa6'); Rr(c, cx + 70, by + 40, 50, 30, '#8a9aa6');
      Rr(c, cx + 12, by + 42, 20, 3, '#c0ccd4');
      Rr(c, cd.x + 20, D.topY - 62, 34, 62, '#2a2e33'); Rr(c, cd.x + 22, D.topY - 60, 30, 60, '#3a3f45'); Rr(c, cd.x + 46, D.topY - 32, 3, 3, '#c8a020');
      c.fillStyle = '#e8dcc0'; c.fillText('КАБИНА', cx + 38, by + 80);
    }
    this.mid.set(i, cv);
    return cv;
  }
  drawFar(c, camY) {
    const fy = camY * 0.5;
    const i0 = Math.floor(fy / H);
    for (let i = i0; i <= i0 + 1; i++) c.drawImage(this.farChunk(i), 0, Math.round(i * H - fy));
  }
  drawMid(c, camY) {
    const i0 = Math.floor(camY / H);
    for (let i = i0; i <= i0 + 1; i++) if (i * H < this.D.worldH) c.drawImage(this.midChunk(i), 0, Math.round(i * H - camY));
  }
};

L1.drawPoster = function (c, p) {
  const x = p.x, y = p.y;
  const f = (t, px, py, col = '#1a1a1a', sz = 8) => { c.font = sz + 'px "Press Start 2P", monospace'; c.textBaseline = 'top'; c.fillStyle = col; c.fillText(t, px, py); };
  switch (p.kind) {
    case 'tb': Rr(c, x, y, 64, 44, '#15171a'); Rr(c, x + 2, y + 2, 60, 40, '#d8cfb4'); Rr(c, x + 2, y + 2, 60, 10, '#b8342e'); f('ТЕХНИКА', x + 5, y + 4, '#fff', 6); f('БЕЗОПАС-', x + 5, y + 16, '#1a1a1a', 6); f('НОСТИ', x + 5, y + 25, '#1a1a1a', 6); Rr(c, x + 5, y + 34, 50, 2, '#555'); break;
    case 'helmet': Rr(c, x, y, 60, 50, '#15171a'); Rr(c, x + 2, y + 2, 56, 46, '#e8c21c'); Art.item(c, 'helmetRaw', x + 30, y + 22, 0, 1.4); f('РАБОТАЙ', x + 4, y + 30, '#1a1a1a', 6); f('В КАСКЕ!', x + 4, y + 39, '#b8342e', 6); break;
    case 'load': Rr(c, x, y, 72, 50, '#15171a'); Rr(c, x + 2, y + 2, 68, 46, '#f0ece0'); c.fillStyle = '#b8342e'; c.beginPath(); c.moveTo(x + 36, y + 5); c.lineTo(x + 50, y + 28); c.lineTo(x + 22, y + 28); c.fill(); Art.item(c, 'brick', x + 36, y + 20, 0.3, 0.7); f('НЕ СТОЙ', x + 8, y + 31, '#1a1a1a', 6); f('ПОД ГРУЗОМ', x + 5, y + 40, '#b8342e', 6); break;
    case 'drunk': Rr(c, x, y, 76, 52, '#15171a'); Rr(c, x + 2, y + 2, 72, 48, '#e8e0cc'); Art.item(c, 'bottle', x + 20, y + 20, 0, 1.4); c.strokeStyle = '#c01818'; c.lineWidth = 3; c.beginPath(); c.arc(x + 20, y + 20, 12, 0, 7); c.moveTo(x + 11, y + 11); c.lineTo(x + 29, y + 29); c.stroke(); f('ПЬЯН-', x + 38, y + 10, '#c01818', 6); f('СТВУ', x + 38, y + 19, '#c01818', 6); f('— БОЙ!', x + 6, y + 38, '#1a1a1a', 7); break;
    case 'glory': Rr(c, x, y, 90, 30, '#15171a'); Rr(c, x + 2, y + 2, 86, 26, '#9c2a26'); f('СЛАВА', x + 24, y + 5, '#f0d040', 7); f('ТРУДУ!', x + 22, y + 16, '#f0d040', 7); break;
    case 'plan': Rr(c, x, y, 80, 40, '#15171a'); Rr(c, x + 2, y + 2, 76, 36, '#d8d0b8'); f('ПЛАН', x + 24, y + 6, '#b8342e', 8); f('ВЫПОЛНЕН', x + 8, y + 18, '#1a1a1a', 6); f('НА 146%', x + 12, y + 28, '#1a1a1a', 6); break;
    case 'clock': c.fillStyle = '#15171a'; c.beginPath(); c.arc(x + 20, y + 20, 18, 0, 7); c.fill(); c.fillStyle = '#e8e4d8'; c.beginPath(); c.arc(x + 20, y + 20, 16, 0, 7); c.fill(); Rr(c, x + 19, y + 7, 2, 13, '#111'); c.strokeStyle = '#111'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 20, y + 20); c.lineTo(x + 28, y + 16); c.stroke(); f('16:55', x - 2, y + 42, '#d8ccb0', 8); break;
    case 'board': Rr(c, x, y, 100, 56, '#15171a'); Rr(c, x + 2, y + 2, 96, 52, '#8a2420'); f('ДОСКА ПОЧЁТА', x + 5, y + 5, '#f0d040', 6);
      for (let i = 0; i < 4; i++) { Rr(c, x + 6 + i * 23, y + 17, 20, 26, '#e8e0cc'); Rr(c, x + 9 + i * 23, y + 20, 14, 18, ['#8a7a6a', '#7a6a5a', '#6a7a8a', '#9a8a7a'][i]); }
      if (G.img.valeraHud) c.drawImage(G.img.valeraHud, 0, 0, 26, 27, x + 75, y + 18, 17, 18);
      break;
    case 'navy': Rr(c, x, y, 110, 26, '#15171a'); Rr(c, x + 2, y + 2, 106, 22, '#2a4a7a'); f('ФЛОТ — ГОРДОСТЬ', x + 6, y + 9, '#e8e8e0', 6); break;
    case 'slow': Rr(c, x, y, 96, 36, '#15171a'); Rr(c, x + 2, y + 2, 92, 32, '#d8cfb4'); f('ТИШЕ ЕДЕШЬ —', x + 6, y + 7, '#1a1a1a', 6); f('ДАЛЬШЕ БУДЕШЬ', x + 5, y + 19, '#1a1a1a', 6); break;
  }
};

// =====================================================================
// 3. РАБОЧИЕ НА ФОНЕ
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
};
L1.DRINK_SIT = t => { const p = Hum.P.sitBench(t); p.sr = 2.5; p.er = 1.9; p.head = -0.3; p.item = 'bottle'; return p; };
L1.SLAM_SIT = t => { const p = Hum.P.sitBench(t); const k = Math.min(1, t * 5); p.sr = U.lerp(2.6, 1.3, k); p.er = 0.2; return p; };
L1.Group = class {
  constructor(g, rng) {
    this.g = g; this.type = g.type; this.t = rng() * 10; this.chatT = 2 + rng() * 6; this.m = [];
    const cx = (g.x1 + g.x2) / 2, y = g.y;
    const mk = (x, f) => {
      const a = new G.Actor('worker', x, y, f, {
        helmet: rng.pick(['#e8c21c', '#f2f2ee', '#d84a2a', '#3a7ad8']),
        mustache: rng() < 0.5 ? rng.pick(['#3a2a1a', '#8a8a80', '#5a3a20']) : null,
        skin: rng.pick(['#e0a98a', '#d49a7a', '#e8b89a']),
        jacket: rng.pick(['#35507a', '#3e4a5a', '#4a5a44']),
      });
      a.rig.st.scale = 0.85; a.headH = 52; a.voice = 150 + rng() * 150; this.m.push(a); return a;
    };
    this.cx = cx;
    switch (this.type) {
      case 'lathe': mk(cx - 30, 1).setAnim('lathe'); break;
      case 'weld': mk(cx - 16, 1).setAnim('weld'); break;
      case 'drink': mk(cx - 24, 1).setAnim('sitBench'); mk(cx + 24, -1).setAnim('sitBench'); break;
      case 'argue': mk(cx - 18, 1).setAnim('argue'); mk(cx + 18, -1).setAnim('argue'); break;
      case 'smoke': { const a = mk(cx, rng() < 0.5 ? 1 : -1); a.setAnim('smoke'); break; }
      case 'sleep': mk(cx, 1).setAnim('sleep'); break;
      case 'domino': mk(cx - 24, 1).setAnim('sitBench'); mk(cx + 24, -1).setAnim('sitBench'); break;
      case 'hammer': mk(cx - 20, 1).setAnim(t => Hum.P.throwDown((t % 0.9) / 0.5)); break;
    }
    this.hitPh = 0;
  }
  update(dt, onScreen) {
    this.t += dt;
    for (const a of this.m) a.update(dt);
    const y = this.g.y, cx = this.cx;
    if (!onScreen) return;
    if (this.type === 'drink' || this.type === 'domino') {
      const period = this.type === 'drink' ? 4 : 3, act = this.type === 'drink' ? 1.3 : 0.6;
      const idx = (this.t / period | 0) % 2, on = (this.t % period) < act;
      this.m.forEach((b, i) => {
        const want = on && i === idx ? this.type : 'sit';
        if (b._w !== want) { b._w = want; b.setAnim(want === 'sit' ? 'sitBench' : want === 'drink' ? L1.DRINK_SIT : L1.SLAM_SIT); }
      });
    }
    if (this.type === 'weld' && Math.random() < dt * 12) FX.burst(cx + 4, y - 6, 2, { colors: ['#ffd84a', '#fff', '#ff9a3a'], speed: 90, life: 0.4, grav: 500 });
    if (this.type === 'lathe' && Math.random() < dt * 5) FX.burst(cx + 6, y - 22, 1, { colors: ['#ffb84a', '#fff'], speed: 70, life: 0.35, grav: 500 });
    if (this.type === 'smoke' && Math.random() < dt * 1.5) FX.spawn({ x: this.m[0].x + this.m[0].facing * 8, y: y - 58, vx: 8, vy: -14, grav: -5, life: 1.8, color: '#8a8f94', size: 2, type: 'puff' });
    if (this.type === 'hammer') { const ph = (this.t % 0.9) / 0.9; if (this.hitPh < 0.55 && ph >= 0.55) { FX.burst(cx + 2, y - 10, 4, { colors: ['#ffd84a', '#fff'], speed: 80, life: 0.3 }); } this.hitPh = ph; }
    if (this.type === 'sleep' && Math.random() < dt * 0.8) FX.spawn({ x: cx + 8, y: y - 40, vx: 10, vy: -18, grav: 0, life: 1.6, type: 'text', text: 'z', color: '#c8d0e0', size: 8 });
    this.chatT -= dt;
    if (this.chatT <= 0) {
      this.chatT = U.rand(5, 10);
      const a = U.choice(this.m);
      G.say(a, U.choice(CHAT[this.type]), 2.0, { sound: false });
    }
  }
  draw(c, cx, cy) {
    const y = this.g.y - cy, x = this.cx;
    // реквизит
    switch (this.type) {
      case 'lathe': {
        Rr(c, x - 6, y - 30, 50, 30, '#15171a'); Rr(c, x - 5, y - 29, 48, 28, '#4e6a5a'); Rr(c, x - 5, y - 29, 48, 3, '#6a8a78');
        Rr(c, x - 2, y - 24, 10, 10, '#2a2e33');
        const a = this.t * 20; Rr(c, x + 2 + Math.cos(a) * 3, y - 20 + Math.sin(a) * 3, 2, 2, '#aab4bc');
        Rr(c, x + 8, y - 21, 26, 3, '#9aa4ae'); Rr(c, x + 34, y - 25, 6, 10, '#2a2e33');
        break;
      }
      case 'weld': Rr(c, x - 2, y - 10, 30, 10, '#15171a'); Rr(c, x - 1, y - 9, 28, 8, '#5a626a'); if ((this.t * 18 | 0) % 3) { c.fillStyle = 'rgba(180,230,255,0.5)'; c.beginPath(); c.arc(x + 4, y - 8, 7, 0, 7); c.fill(); } break;
      case 'drink': case 'domino':
        Rr(c, x - 14, y - 16, 28, 3, '#15171a'); Rr(c, x - 13, y - 16, 26, 2, '#8a6a42'); Rr(c, x - 10, y - 13, 2, 13, '#5a4428'); Rr(c, x + 8, y - 13, 2, 13, '#5a4428');
        if (this.type === 'drink') { Art.item(c, 'bottle', x - 4, y - 23, 0, 0.8); Art.item(c, 'bottle', x + 5, y - 23, 0, 0.8); Rr(c, x - 12, y - 18, 6, 2, '#e8e0cc'); }
        else { for (let i = 0; i < 5; i++) Rr(c, x - 10 + i * 5, y - 18, 3, 2, '#f0f0e8'); }
        Rr(c, x - 36, y - 10, 16, 3, '#5a4428'); Rr(c, x + 20, y - 10, 16, 3, '#5a4428');
        break;
      case 'sleep': Rr(c, x - 14, y - 10, 34, 3, '#5a4428'); Rr(c, x - 12, y - 7, 2, 7, '#3a2a18'); Rr(c, x + 16, y - 7, 2, 7, '#3a2a18'); break;
      case 'hammer': Rr(c, x - 2, y - 10, 14, 10, '#2a2e33'); Rr(c, x - 4, y - 12, 18, 3, '#4a4f55'); break;
    }
    for (const a of this.m) a.draw(c, 0, cy);
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
    this.bg.drawMid(c, cy);
    for (const g of this.groups) if (g.g.y > cy - 80 && g.g.y < cy + H + 80) g.draw(c, 0, cy);
    c.fillStyle = 'rgba(16,20,26,0.42)'; c.fillRect(0, 0, W, H);
    // лестницы и платформы
    for (const l of wd.ladders) if (l.y < cy + H && l.y + l.h > cy) Art.ladder(c, { x: l.x, y: l.y - cy, w: l.w, h: l.h });
    for (const p of wd.plats) if (p.y > cy - 30 && p.y < cy + H + 30) Art.platform(c, { ...p, y: p.y - cy }, wd.t);
    // клапаны пара
    for (const v of wd.vents) {
      if (v.y < cy - 20 || v.y > cy + H + 20) continue;
      Rr(c, v.x, v.y - 8 - cy, 16, 8, '#15171a'); Rr(c, v.x + 1, v.y - 7 - cy, 14, 6, v.state === 'warn' ? '#c86a2a' : '#6a727a'); Rr(c, v.x + 5, v.y - 10 - cy, 6, 3, '#b8342e');
      if (v.state === 'on') { c.fillStyle = 'rgba(235,240,242,0.55)'; c.fillRect(v.x - 2, v.y - 88 - cy, 20, 80); }
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
    const m = Math.max(0, Math.round((this.player.y - this.D.topY) / 16));
    G.text('ДО КАБИНЫ: ' + m + ' м', W - 8, 22, { align: 'right', color: '#c8d0d8' });
    if (this.hint) Game.drawHint(c, this.hint.text, this.hintA);
    if (this.fade > 0) { c.fillStyle = `rgba(0,0,0,${this.fade})`; c.fillRect(0, 0, W, H); }
  }
};

// =====================================================================
// 5. АРЕНА НА КРАНЕ и БОСС НАТАШКА
// =====================================================================
L1.FLOOR = 282;
L1.buildArenaBG = function () {
  const [cv, c] = G.makeCanvas(W, H);
  const rng = U.seeded(404);
  Rr(c, 0, 0, W, H, '#2e3339');
  // дальняя стена с окнами
  for (let x = 0; x < W; x += 20) for (let y = 60; y < 180; y += 22) { const q = rng(); Rr(c, x + 2, y, 16, 19, q < 0.08 ? '#1d2126' : q < 0.5 ? '#6e7a85' : '#7a8691'); }
  Rr(c, 0, 56, W, 4, '#22262b'); Rr(c, 0, 180, W, 4, '#22262b');
  for (let x = 40; x < W; x += 128) { Rr(c, x, 0, 20, H, '#2a2f35'); Rr(c, x + 2, 0, 3, H, '#3a4047'); }
  // фермы крыши
  Rr(c, 0, 0, W, 40, '#1c2025');
  c.strokeStyle = '#3c424a'; c.lineWidth = 2;
  for (let x = 0; x < W; x += 40) { c.beginPath(); c.moveTo(x, 40); c.lineTo(x + 20, 8); c.lineTo(x + 40, 40); c.stroke(); }
  Rr(c, 0, 38, W, 4, '#3c424a');
  // лучи
  c.fillStyle = 'rgba(200,215,225,0.05)';
  for (let s = 0; s < 4; s++) { const sx = 60 + s * 150; c.beginPath(); c.moveTo(sx, 180); c.lineTo(sx + 40, 180); c.lineTo(sx + 150, H); c.lineTo(sx + 80, H); c.fill(); }
  // глубина цеха внизу
  const g = c.createLinearGradient(0, 200, 0, H);
  g.addColorStop(0, 'rgba(20,24,30,0)'); g.addColorStop(1, 'rgba(20,24,30,0.9)');
  c.fillStyle = g; c.fillRect(0, 200, W, H - 200);
  // подкрановый путь сзади
  Rr(c, 0, 250, W, 6, '#3a3f45');
  // конструкция моста под ногами
  Rr(c, 150, L1.FLOOR + 8, W - 150, 22, '#15171a'); Rr(c, 150, L1.FLOOR + 9, W - 150, 20, '#b89418');
  for (let x = 150; x < W; x += 20) { c.fillStyle = '#15171a'; c.beginPath(); c.moveTo(x, L1.FLOOR + 29); c.lineTo(x + 10, L1.FLOOR + 9); c.lineTo(x + 14, L1.FLOOR + 9); c.lineTo(x + 4, L1.FLOOR + 29); c.fill(); }
  Rr(c, 150, L1.FLOOR + 30, W - 150, 3, '#6a5410');
  // пропасть цеха: далеко внизу пол и лодка
  Rr(c, 150, L1.FLOOR + 33, W - 150, H - L1.FLOOR - 33, '#1a1e23');
  c.fillStyle = '#23282e'; c.beginPath(); c.ellipse(430, H + 6, 170, 26, 0, Math.PI, 0); c.fill();
  Rr(c, 470, H - 34, 24, 16, '#23282e');
  for (let i = 0; i < 12; i++) Rr(c, 160 + i * 40, H - 6, 2, 3, '#e8c21c');
  // перила
  for (let x = 160; x < W; x += 32) Rr(c, x, L1.FLOOR - 24, 2, 24, '#6a6e72');
  Rr(c, 150, L1.FLOOR - 24, W - 150, 2, '#8a8e92'); Rr(c, 150, L1.FLOOR - 12, W - 150, 1, '#6a6e72');
  // кабина крановщицы
  Rr(c, 4, 170, 150, L1.FLOOR - 170 + 44, '#15171a');
  Rr(c, 6, 172, 146, L1.FLOOR - 172, '#4a545e');
  Rr(c, 6, 172, 146, 6, '#3a424a');
  Rr(c, 14, 184, 60, 44, '#8a9aa6'); Rr(c, 16, 186, 20, 3, '#c0ccd4'); Rr(c, 44, 186, 1, 40, '#6a7a86');
  Rr(c, 6, L1.FLOOR, 148, 44, '#3a424a'); Rr(c, 6, L1.FLOOR + 40, 148, 4, '#15171a');
  // пульт и рычаги
  Rr(c, 16, 246, 40, 36, '#2a2e33'); Rr(c, 18, 248, 36, 4, '#5a626a');
  [[22, '#c01818'], [32, '#1a1a1a'], [42, '#1a1a1a']].forEach(([x, col]) => { Rr(c, x, 232, 2, 16, '#888'); Rr(c, x - 2, 229, 6, 5, col); });
  Rr(c, 20, 256, 4, 3, '#48c048'); Rr(c, 28, 256, 4, 3, '#e0b020'); Rr(c, 36, 256, 4, 3, '#e03030');
  // радио, календарь
  Rr(c, 84, 196, 26, 16, '#2a2020'); Rr(c, 88, 200, 10, 8, '#6a5a4a'); Rr(c, 100, 200, 6, 6, '#111');
  Rr(c, 118, 186, 26, 32, '#e8e0cc'); Rr(c, 118, 186, 26, 8, '#b8342e');
  c.font = '6px "Press Start 2P", monospace'; c.textBaseline = 'top'; c.fillStyle = '#fff'; c.fillText('2003', 120, 187);
  c.fillStyle = '#1a1a1a'; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) Rr(c, 121 + j * 7, 198 + i * 5, 5, 3, '#8a8478');
  // табличка
  Rr(c, 84, 220, 50, 12, '#e8e0cc'); c.fillStyle = '#b8342e'; c.fillText('НЕ КУРИТЬ', 86, 223);
  // бутылки на полу
  [[100, 0], [108, 0.3], [128, 1.57], [116, 0]].forEach(([x, r]) => Art.item(c, 'bottle', x, L1.FLOOR - (r > 1 ? 3 : 8), r));
  // дверной проём
  Rr(c, 150, 196, 6, L1.FLOOR - 196, '#15171a');
  // люк с лестницей
  Rr(c, 190, L1.FLOOR + 2, 26, 6, '#15171a');
  return cv;
};

L1.Natasha = class {
  constructor(x) {
    this.x = x; this.y = L1.FLOOR; this.facing = -1; this.rig = new Hum.Rig('natasha');
    this.maxHp = 40; this.hp = 40; this.inv = 0; this.combo = 0; this.lastHit = -9; this.state = 'idle'; this.st = 0; this.t = 0; this.flash = 0; this.actions = 0; this.volley = 0; this.throwT = 0;
    this.headH = 62; this.voice = 330; this.vx = 0; this.dead = false; this.name = 'natasha';
  }
  get box() { return { x: this.x - 12, y: this.y - 56, w: 24, h: 56 }; }
  get weak() { return this.state === 'drink' || this.state === 'dizzy'; }
  get phase2() { return this.hp <= this.maxHp / 2; }
  set(s) { this.state = s; this.st = 0; }
  update(dt, arena) {
    const pl = arena.player;
    this.t += dt; this.st += dt; if (this.flash > 0) this.flash -= dt; if (this.inv > 0) this.inv -= dt;
    const dx = pl.x - this.x, adx = Math.abs(dx);
    const spd = this.phase2 ? 1.3 : 1;
    let pose;
    switch (this.state) {
      case 'wait': pose = Hum.P.stand(this.t); break;
      case 'idle':
        this.facing = dx > 0 ? 1 : -1;
        pose = Hum.P.dizzy(this.t * 0.6);
        if (this.st > 0.4 / spd) {
          if (this.actions >= (this.phase2 ? 2 : 3)) { this.actions = 0; this.set(this.phase2 && Math.random() < 0.5 ? 'chargeWind' : 'retreat'); this.pickEnd(pl); if (this.state === 'retreat') G.say(this, U.choice(['Отстань, окаянный!', 'Ишь, какой!', 'Сейчас-сейчас...']), 1.4); else G.say(this, 'Задавлю-у-у!', 1.4, { shout: true }); }
          else this.set('walk');
        }
        break;
      case 'walk':
        this.facing = dx > 0 ? 1 : -1;
        this.x += this.facing * 70 * spd * dt;
        pose = Hum.P.walk(this.t);
        if (adx < 40) { this.set('wind'); }
        else if (this.st > 1.8) { this.actions++; this.set('idle'); }
        break;
      case 'wind':
        this.facing = dx > 0 ? 1 : -1;
        pose = Hum.P.slapWind(this.t);
        if (this.st > 0.5 / spd) { this.set('slap'); Sound.play('throw'); }
        break;
      case 'slap':
        pose = Hum.P.slap(this.t);
        if (this.st < 0.14) { const hb = { x: this.x + (this.facing > 0 ? 4 : -36), y: this.y - 54, w: 32, h: 34 }; if (U.overlap(hb, pl.box)) pl.hurt(12, this.x, arena.world); }
        if (this.st > 0.5) { this.actions++; this.set('idle'); }
        break;
      case 'retreat':
        this.facing = this.target > this.x ? 1 : -1;
        this.x = U.approach(this.x, this.target, 160 * spd * dt);
        pose = Hum.P.flail(this.t); pose.face = 'angry';
        if (Math.abs(this.x - this.target) < 2) { this.set('throw'); this.volley = this.phase2 ? 5 : 3; this.throwT = 0.3; }
        break;
      case 'throw':
        this.facing = dx > 0 ? 1 : -1;
        this.throwT -= dt;
        if (adx < 46 && Math.abs(pl.y - this.y) < 30) { this.set('wind'); this.st = 0.2; G.say(this, 'Не подходи!', 1); pose = Hum.P.slapWind(this.t); break; }
        pose = Hum.P.throw(U.clamp(1 - this.throwT / 0.45, 0, 1)); pose.item = this.throwT > 0.15 ? 'bottle' : null;
        if (this.throwT <= 0) {
          if (this.volley > 0) {
            this.volley--; this.throwT = (this.phase2 ? 0.5 : 0.65);
            arena.throwBottle(this, pl);
            if (Math.random() < 0.35) G.say(this, U.choice(['Получай, сопляк!', 'На, закуси!', 'Лови, стропаль!']), 1.2);
          } else { this.set('drink'); G.say(this, 'Буль-буль... ик!', 1.8); Sound.play('swig'); }
        }
        break;
      case 'drink':
        pose = Hum.P.drink(this.t);
        if (this.st > 2.1) { this.set('idle'); this.actions = 0; }
        break;
      case 'chargeWind':
        this.facing = this.target > this.x ? 1 : -1;
        pose = Hum.P.slapWind(this.t); pose.lean = -0.3;
        if (this.st > 0.7) { this.set('charge'); Sound.play('shout'); }
        break;
      case 'charge':
        this.x += this.facing * 250 * dt;
        pose = Hum.P.flail(this.t);
        if (Math.random() < dt * 20) FX.dust(this.x - this.facing * 10, this.y, 1);
        if (U.overlap(this.box, pl.box)) pl.hurt(15, this.x, arena.world);
        if (this.x < 175 || this.x > 615) {
          this.x = U.clamp(this.x, 175, 615);
          this.set('dizzy'); G.shake(6, 0.3); Sound.play('boom'); G.say(this, 'Ой-ёй-ёй...', 1.6);
        }
        break;
      case 'dizzy':
        pose = Hum.P.dizzy(this.t);
        if (this.st > 1.9) { this.set('idle'); this.actions = 0; }
        break;
      case 'hurt':
        pose = Hum.P.hurt(this.t);
        this.x += this.vx * dt; this.vx *= 0.88;
        if (this.st > 0.28) this.set(this.resume || 'idle');
        break;
      case 'shove':
        pose = Hum.P.slap(this.t); pose.lean = 0.5;
        if (this.st < 0.12 && adx < 56) { pl.hurt(9, this.x, arena.world); pl.vx = (dx > 0 ? 1 : -1) * 320; }
        if (this.st > 0.4) { this.pickEnd(pl); this.set('retreat'); }
        break;
      case 'down':
        pose = Hum.P.sitFloor(this.t);
        break;
    }
    this.x = U.clamp(this.x, 172, 620);
    this.rig.update(dt, pose || Hum.P.stand(this.t));
  }
  pickEnd(pl) { this.target = pl.x < 400 ? 600 : 190; }
  hit(dmg, dir, arena) {
    if (this.state === 'down' || this.state === 'wait' || this.state === 'shove') return;
    if (this.inv > 0 && !this.weak) return;
    const mult = this.weak ? 2 : 1;
    if (!this.weak) this.inv = 0.22;
    this.hp -= dmg * mult; this.flash = 0.12;
    Sound.play('hit'); G.hitStop = 0.06;
    if (mult > 1) { FX.popText(this.x, this.y - 80, 'x2!', '#ffd84a', 16); }
    if (this.hp <= 0) { this.hp = 0; this.set('down'); arena.bossDown(); return; }
    if (!this.weak) {
      this.combo = this.t - this.lastHit < 1.1 ? this.combo + 1 : 1; this.lastHit = this.t;
      if (this.combo >= 3 && ['idle', 'walk', 'wind', 'hurt'].includes(this.state)) {
        this.combo = 0; this.set('shove'); Sound.play('shout');
        G.say(this, U.choice(['А ну брысь!', 'Отвали, окаянный!', 'Кыш!']), 1.2);
        return;
      }
    }
    if (['idle', 'walk'].includes(this.state)) { this.set('hurt'); this.resume = 'idle'; this.vx = dir * 140; if (Math.random() < 0.3) G.say(this, U.choice(['Ай, ирод!', 'Ой, батюшки!', 'Я на тебя жаловаться буду!']), 1.2); }
  }
  draw(c) {
    if (this.flash > 0) Hum.drawFlash(c, this.rig, this.x, this.y, this.facing);
    else this.rig.draw(c, this.x, this.y, this.facing);
    if (this.weak && (G.t * 6 | 0) % 2) G.text('СЛАБОЕ МЕСТО!', this.x, this.y - 88, { align: 'center', color: '#ffd84a', size: 8, outline: true });
  }
};

L1.Arena = class {
  constructor(level) {
    this.level = level;
    const wd = this.world = new Game.World(W, H);
    wd.stats = level.stats; wd.score = level.score;
    wd.addScore = n => { wd.score += n; level.score = wd.score; };
    wd.addPlat({ x: 0, y: L1.FLOOR, w: W, h: 80, oneway: false, look: 'none' });
    wd.addPlat({ x: 262, y: 200, w: 280, look: 'girder' });
    wd.addPlat({ x: 400, y: 250, w: 64, h: 32, oneway: false, look: 'trolley' });
    this.bg = G.img.arenaBG;
    this.player = null; this.boss = null; this.fighting = false;
    wd.playerAttack = (hb, dmg, atk, pl) => this.playerAttack(hb, dmg, atk, pl);
    wd.spawnPlayerProj = (k, x, y, d) => wd.projs.push(new Game.Proj(k, x, y, d));
    wd.onDeflectedHazard = h => {
      const b = this.boss;
      if (b && U.overlap(h.box, b.box) && b.state !== 'down') { h.shatter(wd); b.hit(4, h.vx > 0 ? 1 : -1, this); FX.popText(b.x, b.y - 70, 'ВОЗВРАТ ТАРЫ!', '#8cd0ff'); wd.addScore(300); }
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
    const sx = b.x + b.facing * 10, sy = b.y - 62;
    const tx = U.clamp(pl.x + pl.vx * 0.35 + U.rand(-20, 20), 170, 630), ty = L1.FLOOR - 6;
    const T = 0.85 + Math.abs(tx - sx) / 900;
    const g = GRAV * 0.6;
    const vx = (tx - sx) / T, vy = (ty - sy - 0.5 * g * T * T) / T;
    this.world.hazards.push(new Game.Hazard('bottle', sx, sy, vx, vy));
    Sound.play('throw');
  }
  playerAttack(hb, dmg, atk, pl) {
    const wd = this.world, b = this.boss;
    if (b && !atk.hit.has(b) && U.overlap(hb, b.box) && b.state !== 'down') {
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
    if (pl) {
      pl.update(dt, wd);
      if (pl.x < 12) pl.x = 12;
    }
    if (b) b.update(dt, this);
    for (const h of wd.hazards) h.update(dt, wd, pl);
    wd.hazards = wd.hazards.filter(h => !h.dead);
    for (const p of wd.projs) {
      p.update(dt, wd, pl);
      if (b && !p.dead && !p.hitSet.has(b) && b.state !== 'down' && U.overlap(p.box, b.box)) { p.hitSet.add(b); b.hit(p.dmg, p.dir, this); wd.addScore(80); if (!p.pierce) { p.dead = true; p.poof(); } }
    }
    wd.projs = wd.projs.filter(p => !p.dead);
    for (const p of wd.pickups) p.update(dt, wd, pl);
    wd.pickups = wd.pickups.filter(p => !p.dead);
    for (const a of this.actors) a.update(dt);
    if (this.fighting) {
      // подарки сверху
      [26, 12].forEach(th => { if (b.hp <= th && !this.dropped[th]) { this.dropped[th] = 1; const p = new Game.Pickup(th === 26 ? 'pie' : 'kefir', U.rand(220, 560), -10); p.falling = true; wd.pickups.push(p); } });
      this.quipT -= dt;
      if (this.quipT <= 0) {
        this.quipT = U.rand(6, 9);
        G.say(pl, U.choice(['Слабая женщина!', 'Это всё в твоей голове, сног!', 'Ахахахах!', 'Лол!', 'Чё, рак, ты живой?']), 1.8);
      }
      if (pl.dead && pl.deadT > 1.6 && !this.resetting) {
        this.resetting = true;
        this.level.stats.deaths++;
        setTimeout(() => { this.resetting = false; this.level.restartBoss(); }, 400);
      }
    }
    if (this.hintT > 0) { this.hintT -= dt; this.hintA = Math.min(1, this.hintA + dt * 4); } else this.hintA = Math.max(0, this.hintA - dt * 3);
    for (const r of this.ropes) r.len = Math.min(r.max, r.len + dt * 420);
  }
  draw(c) {
    const wd = this.world;
    c.drawImage(this.bg, 0, 0);
    // верхняя балка и тележка
    Art.platform(c, { x: 262, y: 200, w: 280, look: 'girder' }, wd.t);
    Rr(c, 330, 160, 2, 40, '#3a3f45'); Rr(c, 470, 160, 2, 40, '#3a3f45');
    // тележка крана
    Rr(c, 398, 248, 68, 36, '#15171a'); Rr(c, 400, 250, 64, 32, '#e0b428'); Rr(c, 404, 254, 24, 14, '#3a3a3a'); Rr(c, 436, 256, 22, 6, '#9a7a18');
    c.fillStyle = '#15171a'; c.beginPath(); c.arc(410, 282, 5, 0, 7); c.arc(454, 282, 5, 0, 7); c.fill();
    // трос вниз (к стропам)
    const cable = this.cableY || 0;
    Rr(c, 430, 282, 2, H - 282, '#2a2a2a');
    for (let y = 290 + ((cable * 30) % 12); y < H; y += 12) Rr(c, 429, y, 4, 2, '#5a5a5a');
    // пол-мост
    Rr(c, 150, L1.FLOOR, W - 150, 9, '#15171a'); Rr(c, 150, L1.FLOOR + 1, W - 150, 3, '#c8a020'); Rr(c, 150, L1.FLOOR + 4, W - 150, 4, '#5c636a');
    for (let x = 150; x < W - 6; x += 12) { c.fillStyle = '#1a1a1a'; c.beginPath(); c.moveTo(x + 2, L1.FLOOR + 1); c.lineTo(x + 6, L1.FLOOR + 1); c.lineTo(x + 4, L1.FLOOR + 4); c.lineTo(x, L1.FLOOR + 4); c.fill(); }
    // верёвки спецназа
    for (const r of this.ropes) Rr(c, r.x, 0, 2, r.len, '#8a7a5a');
    for (const p of wd.pickups) p.draw(c, 0, 0);
    if (this.showChair) { Rr(c, 58, L1.FLOOR - 16, 26, 4, '#3a2a20'); Rr(c, 56, L1.FLOOR - 42, 5, 30, '#3a2a20'); Rr(c, 69, L1.FLOOR - 12, 3, 12, '#222'); Rr(c, 62, L1.FLOOR - 2, 18, 2, '#222'); }
    for (const a of this.actors) a.draw(c, 0, 0);
    if (this.boss) this.boss.draw(c);
    if (this.player) this.player.draw(c, 0, 0);
    for (const h of wd.hazards) h.draw(c, 0, 0);
    for (const p of wd.projs) p.draw(c, 0, 0);
    // птички над головой
    if (this.birds && this.boss) {
      const b = this.boss;
      for (let i = 0; i < 3; i++) {
        const a = G.t * 3 + i * 2.1;
        const bx = b.x + Math.cos(a) * 16, by = b.y - 64 + Math.sin(a) * 5;
        Rr(c, bx - 2, by - 1, 5, 3, '#f0d040'); Rr(c, bx + 2, by - 2, 2, 2, '#f0d040'); Rr(c, bx + 4, by - 1, 1, 1, '#e07020');
        if ((G.t * 8 + i | 0) % 2) Rr(c, bx - 1, by - 3, 3, 2, '#d8b020');
      }
      if (Math.random() < 0.02) Sound.play('bird');
    }
    FX.draw(c);
    G.drawBubbles(c, 0, 0);
    if (this.player && this.fighting) Game.drawHUD(c, this.player, wd);
    if (this.boss && this.fighting) {
      const b = this.boss;
      Rr(c, 160, H - 26, 320, 16, '#111'); Rr(c, 162, H - 24, 316, 12, '#3a1010');
      Rr(c, 162, H - 24, Math.round(316 * b.hp / b.maxHp), 12, b.weak ? '#ffd84a' : '#d83040');
      G.text('НАТАШКА — КРАНОВЩИЦА 6-го РАЗРЯДА', W / 2, H - 40, { align: 'center', color: '#ffb0b8' });
    }
    if (this.hint) Game.drawHint(c, this.hint, this.hintA, 44);
  }
};

// =====================================================================
// 6. КАТСЦЕНЫ
// =====================================================================
// --- 6.1 Вид на Севмаш сверху: «ДЕНЬ ПЕРВЫЙ» ---
L1.sceneAerial = function (level) {
  const st = { pan: 0, cap: '', title: 0, fade: 1, gulls: [] };
  for (let i = 0; i < 6; i++) st.gulls.push({ x: U.rand(0, 1100), y: U.rand(40, 200), s: U.rand(20, 40), p: U.rand(0, 6) });
  level.drawScene = c => {
    const off = Math.round(st.pan);
    c.drawImage(G.img.aerial, -off, 0);
    // дым из труб
    c.save(); c.translate(-off, 0); FX.draw(c); c.restore();
    for (const g of st.gulls) {
      const x = g.x - off, f = Math.sin(G.t * 8 + g.p) * 3;
      c.fillStyle = '#e8ecee'; c.fillRect(x - 3, g.y, 7, 2); c.fillRect(x - 6, g.y - f, 3, 1); c.fillRect(x + 4, g.y - f, 3, 1);
    }
    if (st.cap) { Rr(c, 14, 14, G.textWidth(st.cap, 8) + 16, 20, 'rgba(0,0,0,0.6)'); G.text(st.cap, 22, 20, { color: '#e8e0c8' }); }
    G.bigTitle(c, 'ДЕНЬ ПЕРВЫЙ', st.title, { size: 32, y: H / 2 - 10 });
    if (st.title > 0) G.text('Северодвинск. Судостроительный завод', W / 2, H / 2 + 26, { align: 'center', color: '#c8d0d8' });
    if (st.fade > 0) { c.fillStyle = `rgba(0,0,0,${st.fade})`; c.fillRect(0, 0, W, H); }
  };
  level.updateScene = dt => {
    for (const g of st.gulls) { g.x += g.s * dt; if (g.x > 1150) g.x = -20; }
    [[153, 50], [171, 50], [863, 75], [883, 75]].forEach(([x, y]) => { if (Math.random() < dt * 8) FX.spawn({ x: x + U.rand(-2, 2), y, vx: U.rand(10, 25), vy: U.rand(-18, -8), grav: -4, life: 4, color: U.choice(['#5a5f65', '#6a6f75', '#4a4f55']), size: 4, type: 'puff' }); });
    FX.update(dt);
  };
  return function* () {
    Music.play('intro');
    yield* Scene.tween(1.0, k => { st.fade = 1 - k; });
    const full = 'Северодвинск, 2003 год.';
    for (let i = 1; i <= full.length; i++) { st.cap = full.slice(0, i); Sound.play('blip', 500); yield Scene.fast ? 0 : 0.05; }
    yield* Scene.tween(4.5, k => { st.pan = U.easeInOut(k) * (1100 - W); });
    Sound.play('boom');
    G.shake(5, 0.4);
    yield* Scene.tween(0.5, k => { st.title = k; });
    yield 2.4;
    yield* Scene.tween(0.8, k => { st.fade = k; });
    FX.list = [];
  };
};

// --- 6.2 Внутри цеха: стропы, «Вира!», каска об пол, кирпич ---
L1.sceneIntro = function (level) {
  const st = { hookY: 110, subY: 256, fade: 1, helmet: null, brick: null, obj: 0 };
  const v = new G.Actor('valera', 330, 300, 1); v.helmet = true; v.setAnim('work');
  const worker = new G.Actor('worker', 70, 300, 1, { helmet: '#e8c21c', mustache: '#5a3a20' }); worker.setAnim('smoke'); worker.headH = 58;
  level.drawScene = c => {
    c.drawImage(G.img.hall, 0, 0);
    worker.draw(c);
    Art.submarine(c, 250, Math.round(st.subY), 520, 2.0);
    const hx = 470;
    Art.drawOverheadCrane(c, Math.round(st.hookY), hx);
    // стропы
    const top = st.subY - 66;
    c.strokeStyle = '#1a1a1a'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(hx, st.hookY + 26); c.lineTo(380, top); c.moveTo(hx, st.hookY + 26); c.lineTo(580, top); c.stroke();
    c.strokeStyle = '#d8c070'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(hx, st.hookY + 26); c.lineTo(380, top); c.moveTo(hx, st.hookY + 26); c.lineTo(580, top); c.stroke();
    v.draw(c);
    if (st.helmet) Art.item(c, 'helmetRaw', st.helmet.x, st.helmet.y, st.helmet.r);
    if (st.brick) Art.item(c, 'brick', st.brick.x, st.brick.y, st.brick.r);
    FX.draw(c);
    G.drawBubbles(c, 0, 0);
    Scene.drawDialog(c);
    if (st.obj > 0) {
      c.globalAlpha = Math.min(1, st.obj);
      Rr(c, 0, 120, W, 60, 'rgba(0,0,0,0.75)');
      G.text('ЗАДАНИЕ', W / 2, 130, { align: 'center', color: '#ffd84a', size: 8 });
      G.text('ЗАБЕРИСЬ НА КРАН!', W / 2, 146, { align: 'center', size: 16, outline: true });
      c.globalAlpha = 1;
    }
    if (st.fade > 0) { c.fillStyle = `rgba(0,0,0,${st.fade})`; c.fillRect(0, 0, W, H); }
  };
  level.updateScene = dt => {
    v.update(dt); worker.update(dt);
    if (st.helmet && !st.helmet.rest) {
      const h = st.helmet; h.vy += 900 * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.r += h.vr * dt;
      if (h.y > 296) { h.y = 296; if (Math.abs(h.vy) > 80) { h.vy *= -0.4; h.vx *= 0.6; Sound.play('clank', 0.8); } else { h.rest = true; h.r = 0; } }
    }
    if (st.brick && !st.brick.rest) { const b = st.brick; b.vy += 1400 * dt; b.y += b.vy * dt; b.r += 6 * dt; if (b.y > 296) { b.y = 296; b.rest = true; b.r = 0.2; Sound.play('brick'); G.shake(6, 0.3); FX.dust(b.x, 300, 10); FX.burst(b.x, 296, 8, { colors: ['#a8452e', '#7a2e1e'], speed: 120, size: 3 }); } }
    FX.update(dt); G.updateBubbles(dt);
  };
  const liftTry = function* () {
    Sound.play('crane');
    yield* Scene.tween(0.7, k => { st.hookY = 110 - 14 * k; st.subY = 256 - 7 * k; });
    yield 0.25;
    yield* Scene.tween(0.12, k => { st.hookY = 96 + 14 * k; st.subY = 249 + 7 * k; });
    Sound.play('boom'); G.shake(7, 0.35);
    FX.dust(300, 300, 10); FX.dust(520, 300, 10);
  };
  return function* () {
    Music.play('cutscene');
    yield* Scene.tween(0.8, k => { st.fade = 1 - k; });
    yield 1.4;
    v.setAnim('stand');
    yield* Scene.moveTo(v, 230, 60);
    v.facing = 1; v.setAnim('lookUp');
    yield 0.5;
    v.setAnim('shout'); Sound.play('shout');
    G.say(v, 'ВИРА-А-А!!!', 1.6, { shout: true });
    yield 1.3;
    v.setAnim('lookUp');
    yield* liftTry();
    v.setAnim('scared'); yield 0.5; v.setAnim('lookUp');
    yield 0.4;
    v.setAnim('shout'); Sound.play('shout');
    G.say(v, 'МАЙНА!.. Тьфу! ВИРА, ГОВОРЮ!!!', 1.8, { shout: true });
    yield 1.5;
    v.setAnim('lookUp');
    yield* liftTry();
    yield 0.4;
    v.setAnim('hips');
    yield* Scene.say('valera', 'Да что ж такое-то! Наташка опять уснула в кабине?!', v, { face: 'angry' });
    // снимает каску и швыряет на пол
    v.setAnim(t => Hum.P.helmetOff(t * 2.5));
    yield 0.45;
    v.helmet = false; v.item = 'helmet';
    v.setAnim(t => Hum.P.throwDown(t * 3));
    yield 0.28;
    v.item = null;
    st.helmet = { x: v.x + 14, y: 262, vx: 110, vy: 120, r: 0, vr: 12 };
    Sound.play('throw');
    yield 0.6;
    v.setAnim('hips');
    yield* Scene.say('valera', 'Приходится всё делать самому!', v, { face: 'angry' });
    v.setAnim('stand');
    yield 0.3;
    // кирпич
    Sound.play('warn');
    st.brick = { x: v.x + 22, y: -20, vy: 200, r: 0 };
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
L1.sceneCab = function (level) {
  const ar = level.arena;
  const st = { fade: 1, title: 0 };
  const v = new G.Actor('valera', 203, L1.FLOOR + 70, 1);
  const n = new G.Actor('natasha', 74, L1.FLOOR, 1); n.setAnim('sitChair'); n.headH = 62; n.voice = 330;
  ar.actors = [n, v]; ar.showChair = true; v.clipY = L1.FLOOR + 2;
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
    yield* Scene.tween(1.2, k => { v.y = L1.FLOOR + 70 - 70 * k; });
    v.setAnim('stand'); v.y = L1.FLOOR;
    Sound.play('land');
    yield 0.3;
    yield* Scene.moveTo(v, 150, 70);
    v.facing = -1;
    n.facing = 1;
    yield* Scene.say('natasha', 'Ты что делаешь? У меня смена закончилась!', n);
    v.setAnim('point');
    yield* Scene.say('valera', 'Наташка, пусти меня за кран, я всё сам сделаю!', v, { face: 'angry' });
    v.setAnim('stand');
    yield* Scene.say('natasha', 'Краник у тебя ещё не дорос!', n);
    v.setAnim('hips');
    yield 1.0;
    yield* Scene.say('valera', 'Сейчас я с тобой разберусь, стерва!', v, { face: 'angry' });
    // Наташка встаёт и выпрыгивает на мост
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
  const st = { fade: 0, title: 0, lifted: 0, cheer: false };
  const b = ar.boss;
  const v = new G.Actor('valera', ar.player.x, L1.FLOOR, ar.player.facing);
  const n = new G.Actor('natasha', b.x, L1.FLOOR, b.facing); n.setAnim('sitFloor'); n.headH = 44; n.voice = 330;
  ar.player = null; ar.boss = null; ar.birds = 1;
  ar.boss = { x: n.x, y: L1.FLOOR + 18, draw() { }, update() { } };
  ar.actors = [n, v]; ar.showChair = true; v.clipY = L1.FLOOR + 2;
  ar.world.pickups = [];
  const cmd = [];
  level.drawScene = c => {
    ar.draw(c);
    if (st.lifted > 0) { c.globalAlpha = Math.min(1, st.lifted); G.text('СТРОПЫ ПОДНЯТЫ!', W / 2, 90, { align: 'center', size: 16, color: '#8cf08c', outline: true }); c.globalAlpha = 1; }
    Scene.drawDialog(c);
    G.bigTitle(c, 'КОНЕЦ УРОВНЯ 1', st.title, { size: 24, color: '#ffd84a' });
    if (st.fade > 0) { c.fillStyle = `rgba(0,0,0,${st.fade})`; c.fillRect(0, 0, W, H); }
  };
  level.updateScene = dt => {
    ar.boss.x = n.x;
    ar.update(dt); FX.update(dt); G.updateBubbles(dt);
    if (st.cranking) ar.cableY = (ar.cableY || 0) + dt;
  };
  const fakeBottom = { x: 430, y: H + 30, headH: 20, bx: 430, by: H - 20 };
  return function* () {
    Scene.dialogTop = true;
    Music.play('cutscene');
    yield 0.8;
    n.facing = v.x > n.x ? 1 : -1;
    yield* Scene.say('natasha', 'Я на тебя служебную записку напишу!', n, { face: 'dizzy' });
    v.facing = n.x > v.x ? 1 : -1;
    v.setAnim('hips'); yield 0.8;
    v.setAnim('stand');
    yield* Scene.say('valera', 'А вот теперь у меня смена кончилась!', v);
    // в кабину
    yield* Scene.moveTo(v, 74, 80);
    v.facing = -1;
    v.setAnim('sitChair');
    yield 0.4;
    v.setAnim('lever');
    Sound.play('lever'); yield 0.3; Sound.play('crane');
    st.cranking = true;
    yield 1.2;
    Sound.play('crane');
    yield* Scene.tween(0.4, k => { st.lifted = k; });
    Sound.play('checkpoint');
    G.say(fakeBottom, 'УРА-А-А! ВАЛЕРА!', 1.8);
    yield 1.4;
    st.cranking = false;
    yield* Scene.tween(0.4, k => { st.lifted = 1 - k; });
    v.setAnim('stand'); v.facing = 1;
    yield 0.3;
    v.setAnim('yawn');
    yield 1.2;
    v.setAnim('stand');
    yield* Scene.say('valera', 'Ух, вот это денёк... Я устал, пойду домой.', v);
    yield* Scene.moveTo(v, 203, 70);
    v.setAnim('climb');
    yield* Scene.tween(1.2, k => { v.y = L1.FLOOR + 90 * k; });
    v.visible = false;
    yield 1.2;
    // верёвки и спецназ
    Music.stop();
    Sound.play('rope');
    const xs = [300, 380, 470, 560];
    xs.forEach(x => ar.ropes.push({ x, len: 0, max: L1.FLOOR - 4 }));
    yield 0.8;
    Music.play('sting');
    xs.forEach((x, i) => {
      const a = new G.Actor('commando', x - 2, -10 - i * 40, x < 430 ? 1 : -1, i === 1 ? { beard: true } : {});
      a.setAnim('rappel'); a.headH = 66; a.voice = i === 1 ? 150 : 170;
      cmd.push(a); ar.actors.push(a);
    });
    Sound.play('rope');
    yield* Scene.tween(1.6, k => { cmd.forEach((a, i) => { const kk = U.clamp(k * 1.3 - i * 0.1, 0, 1); a.y = U.lerp(-10 - i * 40, L1.FLOOR, U.easeOut(kk)); }); });
    cmd.forEach(a => { a.y = L1.FLOOR; a.setAnim('rifle'); });
    Sound.play('stomp'); G.shake(3, 0.2);
    yield 0.6;
    cmd[0].facing = 1; cmd[1].facing = -1;
    yield* Scene.say('commando', 'Кто этот герой?', cmd[0]);
    yield* Scene.say('commando2', 'Это агент RED! Его нужно устранить.', cmd[1]);
    Sound.play('sting');
    G.shake(3, 0.3);
    yield 1.0;
    yield* Scene.tween(0.5, k => { st.title = k; });
    yield 2.0;
    yield* Scene.tween(0.8, k => { st.fade = k; });
    ar.ropes = [];
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
