'use strict';
// ============ Ур.7 v4: карты локаций. V4.MAPS[id](run) -> D (см. V4.Run.load) ============
V4.MAPS = {};
const Act = (st, x, f, anim, o = {}) => { const q = new G.Actor(st, x, V4.GY, f); q.setAnim(anim); q.animT = Math.random() * 3; return Object.assign(q, o); };

// толпа: подходят к цели шагом; фотографы щёлкают вспышками
V4.crowdTick = function (dt, run) {
  if (this.walker != null) { if (Math.abs(this.x - this.walker) > 1) { this.facing = Math.sign(this.walker - this.x); this.x = U.approach(this.x, this.walker, 34 * dt); this.setAnim('walk'); } else this.setAnim(this.idle || (this.style === 'richw4' ? 'stand' : 'talk')); }
  if (this.cam) { this.camT = (this.camT || U.rand(0.5, 2)) - dt; if (this.camT <= 0) { this.camT = U.rand(0.8, 2.6); this.flashT = 0.16; Sound.play('blip', 1800); } if (this.flashT > 0) this.flashT -= dt; this.setAnim(this.flashT > 0 ? 'shoot' : 'stand'); }
};
V4.drawFlashes = function (c, cx, run) {
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const q of run.crowd) if (q.flashT > 0) { const x = q.x - cx + q.facing * 30, y = q.y - 62; const gr = c.createRadialGradient(x, y, 2, x, y, 90); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(x - 90, y - 90, 180, 180); Spr.draw(c, 'fx4', 8 + Math.min(2, ((0.16 - q.flashT) / 0.055) | 0), x, y + 12, 1, { scale: 0.7 }); }
  c.restore();
};
// машина из Flow (арки колёс тёмные, без колёс) + крутящиеся колёса cars4 6..9 ПОВЕРХ арок.
// CAR_WHEEL[fr] = [центр заднего, центр переднего (доли ширины кадра), диаметр колеса (доля ширины)] — замерено по аркам
V4.CAR_WHEEL = { 0: [0.163, 0.879, 0.097, 11], 1: [0.1, 0.505, 0.13], 2: [0.188, 0.829, 0.14, 8.5], 3: [0.125, 0.635, 0.13], 4: [0.195, 0.82, 0.2, 18], 5: [0.197, 0.814, 0.165, 12] };   // 4-е число — подъём кузова (px): верх колеса = верх арки
V4.drawCar = function (c, fr, x, y, flip = 1, t = 0, mv = 0) {
  const f = Spr.frame('cars4', fr); if (!f) return;
  const w = f[2] / 2, q = V4.CAR_WHEEL[fr] || [0.18, 0.82, 0.14], d = q[2] * w, ph = mv ? Math.floor(t * 18) % 4 : 0;
  const lift = q[3] !== undefined ? q[3] : d * 0.24;   // кузов приподнят: колёса выступают ниже порогов и стоят на земле (y)
  Spr.draw(c, 'cars4', fr, x, y - lift, flip);
  const ax = f[4] / 2;   // якорь кадра (не всегда по центру)
  for (const k of [q[0], q[1]]) { const dx = (w * k - ax) * (flip > 0 ? 1 : -1); Spr.drawC(c, 'cars4', 6 + ph, x + dx, y - d / 2, 0, d / 30); }
};

// ---------------- A: КПП → забор → люк ----------------
V4.MAPS.A = function (run) {
  const D = V4.buildA(); const m = D.manX;
  Object.assign(D, { rain: true, far: true, admin: { x: 198 }, maxX: m + 60, task: 'обойти толпу и пробраться к заводу' });
  D.crowd = () => [
    Act('cmd4', 172, 1, 'stand', { guard: true }), Act('cmd4', 292, -1, 'stand', { guard: true }),
    Act('richw4', 360, -1, 'stand'), Act('richm4', 388, -1, 'laugh'), Act('richm4', 470, -1, 'talk'),
    Act('photo4', 330, -1, 'stand', { cam: 1 }), Act('photo4', 505, -1, 'stand', { cam: 1 }), Act('tv4', 545, -1, 'film'), Act('rep4', 425, 1, 'talk', { voice: 360 }),
    Act('richm4', 820, -1, 'walk', { walker: 585 }), Act('richw4', 880, -1, 'walk', { walker: 615 }),
    Act('cmd4', m + 96, -1, 'stand', { guard: true }), Act('photo4', m + 130, 1, 'stand', { cam: 1 }), Act('richm4', m + 165, 1, 'laugh'), Act('richw4', m + 190, -1, 'stand'),
    Act('tv4', m + 228, -1, 'film'), Act('rep4', m + 262, -1, 'talk'), Act('richm4', m + 300, -1, 'talk'), Act('photo4', m + 336, -1, 'stand', { cam: 1 }),
  ].map(q => Object.assign(q, { tick: V4.crowdTick }));
  D.guards = [{ x: 1580, x1: 1180, x2: 1660, facing: -1, range: 150, sp: 30 }];
  D.cars = null; D.carsA = [{ fr: 0, x: 420, y: H - 2 }, { fr: 2, x: 760, y: H - 2 }, { fr: 0, x: m + 250, y: H - 2 }];   // колёса видны целиком
  D.drawFront = (c, cx, run) => { V4.drawFlashes(c, cx, run); if (run.flags.van) V4.drawBigVan(c, { x: D.van.x - cx, y: D.van.y, empty: true }, run.t); for (const q of D.carsA) V4.drawCar(c, q.fr, q.x - cx, q.y); };
  D.van = { x: 560, y: V4.GY + 46, mv: false, crew: false, door: false, idle: false };   // фургон Стаса и Макса стоит у КПП
  D.ints = [{ x: m, r: 26, label: 'спуститься в люк', act: r => { const pl = r.player; pl.controls = false; pl.crouch = false; r.near = null;
    pl.auto = { i: 0, sp: 46, anim: 'climb', clipY: V4.GY + 2, keepClip: true, path: [{ x: m, y: V4.GY, anim: 'walk' }, { x: m, y: V4.GY + 100 }], done: () => r.level.toSewer(r) }; } }];
  D.hints = [{ x1: 0, x2: 820, text: 'Иди ВПРАВО — обойти толпу вдоль забора' }, { x1: 1050, x2: 1400, text: 'Спецназ! {down} — на четвереньки в куст и жди. Прошёл мимо — {punch} сзади!', cond: r => r.guards.some(g => g.alive) }];
  D.trig = [{ x: m - 260, fn: r => G.say(r.player, 'Опять толпа и спецназ... А вот и люк. Открытый!', 2.4) }];
  return D;
};

// ---------------- B: канализация (драка с крысами и бомжами) ----------------
V4.SEW_L = 200; V4.SEW_R = 2040;   // x лестниц в канализации
// лестница в канализации (Flow, sew_ladder.png — только лестница, без люка): от пола уходит за верх экрана (копии стыкуются по шагу ступеней)
V4.drawSewLadder = function (c, x) {
  const img = V4.img.sew_ladder; if (!img) return;
  const s = 0.4, w = img.width * s, h = img.height * s;
  for (let y = V4.GY + 2 - h; y > -h; y -= h) c.drawImage(img, Math.round(x - w / 2), y, w, h);
};
V4.MAPS.B = function (run) {
  const D = { w: 2200, bg: { k: 'sewer', s: 0.62, fy: 504 }, dark: 0.12, task: 'пройти канализацию к люку', suspK: 0 };
  // предметы — крупнее и на переднем плане (ближе к камере): Валера и враги проходят ЗА ними
  D.bgFn = (c, cx) => { V4.drawSewLadder(c, V4.SEW_L - cx); V4.drawSewLadder(c, V4.SEW_R - cx); };
  const fp = (fr, x, s = 1.6, dy = 4) => ({ sh: 'sewp4', fr, x, y: V4.GY + dy, s, pass: 'front' });
  D.props = [fp(0, 430), fp(1, 760, 1.5), fp(6, 1130, 1.55), fp(4, 1420, 1.6, 3), fp(1, 1660, 1.5)];   // труб нет; у лестниц (x 200 и 2120) свободно
  // по зелёной реке плывут поддон и мусор: дрейфуют по течению, покачиваются, низ — под водой
  D.floaters = [{ sh: 'sewp4', fr: 5, x: 300, s: 1.3, sp: 16 }, { sh: 'sewp4', fr: 4, x: 900, s: 1.1, sp: 13 }, { sh: 'props4', fr: 6, x: 1350, s: 0.9, sp: 15 },
    { sh: 'sewp4', fr: 5, x: 1750, s: 1.1, sp: 12 }, { sh: 'sewp4', fr: 4, x: 2200, s: 0.9, sp: 17 }];
  D.drawFront = (c, cx, run) => {
    const span = D.w + 300, WY = H - 6;
    c.save(); c.beginPath(); c.rect(0, 0, W, WY); c.clip();   // ниже — «под водой»
    for (const q of D.floaters) {
      const x = ((q.x + run.t * q.sp) % span + span) % span - 150 - cx; if (x < -120 || x > W + 120) continue;
      const bob = Math.sin(run.t * 1.7 + q.x) * 2, tilt = Math.sin(run.t * 1.1 + q.x * 0.5) * 0.05 + (q.rot || 0);
      c.save(); c.translate(Math.round(x), WY + 8 + bob); c.rotate(tilt); Spr.draw(c, q.sh, q.fr, 0, 0, 1, { scale: q.s }); c.restore();
    }
    c.restore();
  };
  D.enemies = [{ kind: 'rat', x: 420 }, { kind: 'rat', x: 520 }, { kind: 'bomzh', x: 860, x1: 700, x2: 1000 }, { kind: 'rat', x: 1050 }, { kind: 'alk', x: 1300, x1: 1150, x2: 1450 },
    { kind: 'gop', x: 1560, x1: 1450, x2: 1700 }, { kind: 'rat', x: 1760 }, { kind: 'rat', x: 1820 }, { kind: 'bomzh', x: 1950, x1: 1850, x2: 2060 }];
  D.ints = [{ x: V4.SEW_R, r: 30, label: 'вылезти наверх', cond: r => r.enemies.length === 0 || r.flags['clear:B'], act: r => { const pl = r.player; pl.controls = false; r.near = null;
    pl.auto = { i: 0, sp: 110, anim: 'climb', path: [{ x: V4.SEW_R, y: V4.GY, anim: 'walk' }, { x: V4.SEW_R, y: 40 }], done: () => r.level.sewerExit(r) }; } }];
  D.hints = [{ x1: 0, x2: 300, text: 'Тут живут! Бей: {punch}. Прыжок: {jump}' }, { x1: 2000, x2: 2200, text: 'Сначала разберись со всеми!', cond: r => r.enemies.length > 0 }];
  D.trig = [{ x: 200, fn: r => G.say(r.player, 'Фу-у... Ну и вонь. Кто тут шуршит?', 1.8) }];
  return D;
};

// ---------------- A2: улица у бетонного... кирпичного забора, Матиз Граблионка пробивает дыру ----------------
// конец улицы — картинка corner.png (выбрана пользователем): забор вдоль дороги -> угловой столб (x 960) -> справа стена идёт К ЗРИТЕЛЮ.
// Матиз сворачивает в съезд и врезается в эту правую стену; Валера уходит туда по съезду.
V4.CORNER = { s: 0.469, fy: 608, pillar: 960, hole: [1150, 470], crash: [1095, 650] };
V4.MAPS.A2 = function (run) {
  const C = V4.CORNER;
  const segs = [{ k: 'fence', s: 0.33, fy: 625 }, { k: 'fence', s: 0.33, fy: 625, ov: 70, flip: true }, { k: 'corner', s: C.s, fy: C.fy, ov: 60 }];
  const D = { strip: V4.buildStrip(segs), rain: true, far: true, task: 'найти проход на территорию' };
  const P = D.strip.placed[2], X = px => P.x + px * C.s, Y = py => V4.GY - (C.fy - py) * C.s;
  D.w = D.strip.w; D.cornerX = X(C.pillar); D.maxX = D.cornerX - 14;
  D.holeX = X(C.hole[0]); D.holeY = Y(C.hole[1]); D.crashX = X(C.crash[0]); D.crashY = Y(C.crash[1]);
  D.trees = []; let tx = 20, i = 0; const seq = [2, 0, 5, 4, 1, 3];
  while (tx < P.x + 40) { D.trees.push({ fr: seq[i++ % seq.length], x: tx, y: 240, s: 0.9, ph: tx * 0.017 }); tx += 60 + (tx * 7919 % 50); }
  D.seam = D.strip.placed.slice(1).map((p, k) => ({ fr: k % 2, x: p.x + p.ov / 2, y: V4.GY - 4, s: 0.8, ph: k }));
  D.manX = 120;
  D.props = [{ sh: 'props4', fr: 3, x: 120, y: V4.GY + 8, s: 1.4 }, ...D.seam.map(q => ({ sh: 'props4', fr: 0, x: q.x + 4, y: V4.GY + 6, s: 1.1 }))];
  D.drawMid = (c, cx, run) => {
    const img = V4.img.corner_b;   // после удара — тот же кадр Flow с проломом (правая часть поверх полосы)
    if (run.flags.breach && img) { const sx = 820; c.drawImage(img, sx, 0, img.width - sx, img.height, Math.round(P.x + sx * C.s - cx), Math.round(P.y), (img.width - sx) * C.s, img.height * C.s); }
  };
  D.drawFront = (c, cx, run) => {
    if (run.matiz) run.matiz.draw(c, cx);
    else if (run.flags.breach) V4.drawMatiz(c, D.crashX - cx, D.crashY, 0.28, 0);
  };
  D.ints = [{ x: D.maxX - 4, r: 30, label: 'пролезть в дыру', cond: r => r.flags.breach, act: r => {   // по съезду к пролому
    const pl = r.player; pl.controls = false; r.near = null; r.flags.breach = 2;
    pl.auto = { i: 0, sp: 60, path: [{ x: D.cornerX + 6, y: V4.GY + 10 }, { x: D.holeX - 30, y: D.crashY - 6 }], done: () => r.go('C', 90, 'Пролезаем на парковку...') };
  } }];
  D.trig = [{ x: D.cornerX - 330, fn: r => r.level.matizScene(r) }];
  D.hints = [{ x1: D.cornerX - 420, x2: D.w, text: 'Пролом за углом! Подойди и нажми {up}', cond: r => r.flags.breach === 1 }];
  return D;
};
// золотой Матиз (l5msd: 0 — кузов без колёс, 2 — колесо, как в ур.5): колёса в арках (0.19 / 0.82 ширины), крутятся по пройденному пути
V4.MATIZ_S = 1.3;
V4.drawMatiz = function (c, x, y, rot, wheelRot) {
  const S = V4.MATIZ_S, [bw, bh] = Spr.size('l5msd', 0), w = bw * S, h = bh * S, cy = -h / 2 - 4 * S;
  c.save(); c.translate(x, y); c.rotate(rot);
  Spr.drawC(c, 'l5msd', 0, 0, cy, 0, S);
  for (const fx of [0.19, 0.82]) Spr.drawC(c, 'l5msd', 2, (fx - 0.5) * w, cy + h / 2 - 0.085 * w, wheelRot || 0, S);   // поверх тёмных арок
  c.restore();
};

// ---------------- C: парковка (стелс) → сортировочный цех ----------------
V4.MAPS.C = function (run) {
  const segs = [{ k: 'park', s: 0.9, fy: 476 }, { k: 'park', s: 0.9, fy: 476, ov: 80, flip: true }, { k: 'shopbig', s: 0.675, fy: 660, ov: 80, hardY: 630, cap: 'shopcap', capY: 634 }];   // цех — громадная зловещая стена, уходит за верх экрана
  const D = { strip: V4.buildStrip(segs), rain: true, far: true, task: r => !r.flags.bus ? 'пробраться через парковку к цеху' : !r.flags.door ? 'вырубить охрану и взломать панель у двери' : 'войти в цех' };
  D.w = D.strip.w; const shopX = D.strip.placed[2].x; D.maxX = D.w - 20;
  // передний план (тёмные силуэты, едут быстрее камеры — параллакс): фонари, покрышки, бочки, барьеры, кусты
  D.fg = [{ fr: 4, x: 260, s: 1.7, dy: 30 }, { sh: 'pprops4', fr: 4, x: 620, s: 2.0 }, { fr: 8, x: 980, s: 1.7 }, { fr: 0, x: 1320, s: 1.5 }, { fr: 4, x: 1650, s: 1.7, dy: 30 },
    { sh: 'pprops4', fr: 6, x: 1980, s: 1.9 }, { sh: 'pprops4', fr: 5, x: 2330, s: 1.8 }, { fr: 8, x: 2680, s: 1.7 }, { fr: 4, x: 3020, s: 1.7, dy: 30 }, { sh: 'pprops4', fr: 4, x: 3330, s: 2.0 }, { fr: 0, x: 3620, s: 1.5 }];
  const SW = 1376 * 0.675;
  D.layers = [{ k: 'shopfar', x: 925, s: 0.44, fy: 725, par: 0.45, gy: 262 }];   // издали корпус нависает над забором парковки
  D.tiresX = shopX + 60; D.doorX = shopX + 0.578 * SW; D.panelX = shopX + 0.652 * SW; D.gateX = shopX + 0.12 * SW;
  D.props = [
    { sh: 'pprops4', fr: 5, x: 1210, y: V4.GY + 6, s: 1.5, cover: true, cw: 40 }, { sh: 'pprops4', fr: 6, x: 1370, y: V4.GY + 4, s: 1.4, cover: true, cw: 30 }, { sh: 'pprops4', fr: 7, x: 1395, y: V4.GY + 6, s: 1.4 },   // бочки — на месте бывшей трансформаторной будки
    { sh: 'pprops4', fr: 4, x: 830, y: V4.GY + 6, s: 1.15 },
    { sh: 'pprops4', fr: 4, x: D.tiresX, y: V4.GY + 6, s: 1.45, cover: true, cw: 42 },
  ];
  // машины на стоянке — укрытия (пригнись за ними)
  D.parked = [{ fr: 2, x: 300 }, { fr: 4, x: 560 }, { fr: 5, x: 1560 }, { fr: 2, x: 1800 }, { fr: 4, x: 2060 }];
  for (const q of D.parked) D.props.push({ car: q, x: q.x, cover: true, cw: 70, sh: 'cars4', fr: -1 });
  D.hides = [];   // будку и туалет убрали: прятаться — за машинами, бочками и покрышками
  D.guards = [{ x: 760, x1: 420, x2: 900, facing: -1, range: 160, sp: 32 }, { x: 1700, x1: 1460, x2: 1960, facing: 1, range: 160, sp: 32 }];
  D.dogs = [{ x: 1080, x1: 1000, x2: 1260, range: 120 }, { x: 2120, x1: 2020, x2: 2300, range: 120 }];
  D.cams = [{ x: 980, y: 150, a0: 1.35, a1: 2.1, per: 7, range: 240, half: 0.2, pole: true }];   // простой столб с камерой
  D.walls = [];
  // дверь цеха: створки (вырезаны из shopbig.jpg) разъезжаются влево и вправо внутрь стены
  const DS = 0.675, dL = shopX + 740 * DS, dM = shopX + 816 * DS, dR = shopX + 852 * DS, dT = V4.GY - (660 - 472) * DS, dH = 156 * DS;
  D.doorK = 0;
  D.drawMid = (c, cx, run) => {
    const want = run.flags.door || D.doorOpenScene ? 1 : 0;
    const dt = Math.min(0.5, run.t - (D.doorT === undefined ? run.t : D.doorT)); D.doorT = run.t;
    D.doorK = U.clamp(D.doorK + (want > D.doorK ? 1 : -1) * dt * 1.3, 0, 1); if (Math.abs(want - D.doorK) < 0.02) D.doorK = want;
    if (D.doorK > 0) {
      const k = U.easeOut ? D.doorK * (2 - D.doorK) : D.doorK, l = V4.img.shopdoor_l, r = V4.img.shopdoor_r;
      c.save(); c.beginPath(); c.rect(dL - cx, dT, dR - dL, dH); c.clip();
      const inn = V4.img.stair;   // за дверью — лестничная клетка цеха (тот же фон, что на карте D1), в полутьме
      if (inn) { c.drawImage(inn, 440, 110, 420, 584, dL - cx, dT, dR - dL, dH); c.fillStyle = 'rgba(4,6,10,0.25)'; c.fillRect(dL - cx, dT, dR - dL, dH); }
      if (l) c.drawImage(l, dL - cx - k * (dM - dL), dT, dM - dL, dH);
      if (r) c.drawImage(r, dM - cx + k * (dR - dM), dT, dR - dM, dH);
      c.restore();
    }
    if (run.bus) run.bus.draw(c, cx, run);
  };
  // машины рисуем в проходе «cover» (перед Валерой) — переопределяем отрисовку реквизита
  D.drawCover = true;
  D.drawFront = (c, cx, run) => {
    // вывеска над дверью: одна большая табличка (нарисована на стене), на ней надпись, горит ровно
    const sx = D.doorX + 5 - cx;
    const g = c.createRadialGradient(sx, 108, 6, sx, 108, 110); g.addColorStop(0, 'rgba(255,90,50,0.20)'); g.addColorStop(1, 'rgba(255,90,50,0)'); c.fillStyle = g; c.fillRect(sx - 110, 70, 220, 76);
    G.text('ЦЕХ', sx, 107, { align: 'center', size: 11, color: '#ffb46a', outline: true }); G.text('СОРТИРОВКИ', sx, 122, { align: 'center', size: 11, color: '#ffb46a', outline: true });
  };
  D.ints = [
    { x: D.panelX, r: 26, label: 'взломать панель', cond: r => r.flags.bus && !r.flags.door, act: r => {
      if (r.guards.some(g => g.alive && g.door)) { G.say(r.player, 'Сначала охранник. Подкрадусь, пока он отвернулся.', 2); return; }
      r.player.setAnim('panel4'); r.startMG('wires', ok => { if (ok) { r.flags.door = 1; Sound.play('lever'); G.say(r.player, 'Щёлк! Дверь открыта.', 1.6); r.arrow = { x: D.doorX, y: 230 }; } }); r.mg.title = 'ВЗЛОМ ВХОДНОЙ ДВЕРИ'; r.mg.okMsg = 'ЗАМОК ОТКРЫТ!'; } },
    { x: D.doorX, r: 26, label: 'войти в цех', cond: r => r.flags.door, act: r => { r.arrow = null; r.level.enterShop(r); } },
  ];
  D.trig = [{ x: D.tiresX - 70, fn: r => r.level.busScene(r) }];
  D.hints = [
    { x1: 0, x2: 260, text: 'Охрана! Пригнись за машиной ({down}), жди, пока отвернётся' },
    { x1: 900, x2: 1200, text: 'Собака! Иди на четвереньках ({down}) — примет за своего. {throw} — гавкнуть' },
    { x1: 1300, x2: 1470, text: 'Камера! Пригнись за бочками ({down}) и проползи, когда отвернётся' },
    { x1: 2000, x2: 2300, text: 'Ещё собака: мимо — только на четвереньках ({down})' },
  ];
  return D;
};

// ---------------- E: крыша цеха, антенна, трос ----------------
V4.MAPS.E = function (run) {
  const D = { w: 1128, rain: true, far: true, admin: { x: 140, par: 0.25, s: 0.22, y: 250 }, layers: [{ k: 'roof', x: 0, s: 0.82, fy: 476 }], task: 'залезть на антенну и зацепиться за трос' };
  D.admin.s = 0.22;
  D.antX = 968; D.maxX = 1100;
  D.ints = [{ x: D.antX, r: 30, label: 'залезть на антенну', act: r => r.level.climbAntenna(r) }];
  D.hints = [{ x1: 0, x2: 900, text: 'Иди к антенне справа. Наверху — трос к заводоуправлению!' }];
  D.cableY = 24;   // трос крепится к мачте антенны чуть ниже крестовины и уходит к окну правого крыла заводоуправления
  D.drawMid = (c, cx) => { const [ex, ey] = V4.adminWin(Object.assign({ cx }, D.admin)); V4.drawCable(c, D.antX - cx, D.cableY, ex, ey, 14); };
  return D;
};
