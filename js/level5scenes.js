'use strict';
// ============ УРОВЕНЬ 5: катсцены по ТЗ ============
// 1) Вова везёт Валеру по городу, из-под руля дым -> Валера пересаживается за руль -> «ты ж права не получил» ->
//    догоняет милиция, громкоговоритель -> «Русские не сдаются!» -> Вова разбивает заднее стекло, вылезает с «Осеменителем 3000» и стреляет.
// 2) Граблионок на матизе: «Эй, посоны, давайте погоняем!» -> гонка.
// 3) У заводоуправления: вывеска «Третий съезд инженеров из столицы», нарядные люди с дорогими машинами идут ко входу.
// «Копейка» из конца 4 уровня — отдельный объект: кузов (спрайт l5kop 0..6) + вращающиеся колёса (l5kop 7), без людей внутри.
// кадры сцены: 0,1,2 цела; 3,4,5 заднее стекло выбито; 6,7 милицейская (красная/синяя мигалка); 8 милицейская разбитая
L5.KOP_BODY = [0, 0, 0, 1, 1, 1, 4, 5, 6];
L5.KOP_W = { 0: [-56, 68, 23.3], 1: [-56, 68, 23.3], 4: [-56, 68, 37], 5: [-56, 68, 37], 6: [-56, 68, 37] };
L5.drawCar = function (c, fr, x, y, flip = 1, sc = 1, t = 0, o = {}) {
  const body = L5.KOP_BODY[fr] != null ? L5.KOP_BODY[fr] : 0, w = L5.KOP_W[body] || L5.KOP_W[0];
  const bob = Math.sin(t * 17) * (o.speed ? 0.7 : 0) + (o.bob || 0), rot = o.rot || 0;
  c.save(); c.translate(x, y + bob); c.rotate(rot); c.scale(sc, sc);
  const bh = (body >= 4 ? 93 : 65.5) / 2; // половина высоты кадра в логических px
  Spr.drawC(c, 'l5kop', body, 0, -bh + 3, 0, 1);
  for (const wx of [w[0], w[1]]) Spr.drawC(c, 'l5kop', 7, wx, -bh + 3 + w[2] + 7, (o.wheel || 0), 0.6);
  c.restore();
};
// Вова с «Осеменителем 3000» (режим против зомби) вылезает по пояс из ЗАДНЕГО окна: кадры l5vrear 0 вылезает, 1 целится, 2 стреляет, 3 смеётся
L5.VWIN = { x: -50, y: -34, s: 0.62 };
// дуло «Осеменителя»: три ствола на левом краю кадра 2 (стреляет), пули летят строго по горизонтали
L5.vovaMuzzle = function (cx, cy) {
  const f = Spr.size('l5vrear', 2), k = L5.VWIN.s / 2 * 2, w = f[0] * 2 * L5.VWIN.s / 2, h = f[1] * 2 * L5.VWIN.s / 2;
  const gx = cx + L5.VWIN.x + 2 - w / 2, gy = cy + L5.VWIN.y - f[1] * L5.VWIN.s / 2;   // центр кадра -> левый край / центр по высоте
  return { x: gx + w * 0.2, ys: [0.34, 0.55, 0.77].map(r => gy - h / 2 + h * r) };
};
L5.drawVovaWindow = function (c, x, y, sc, fr) {
  const f = Spr.size('l5vrear', fr); if (!f[0]) return;
  c.save(); c.translate(x, y); c.scale(sc, sc);
  // L5.VWIN: масштаб Вовы и точка «привязки» к заднему окну машины (низ спрайта сидит на уровне подоконника)
  Spr.drawC(c, 'l5vrear', fr, L5.VWIN.x + (fr === 2 ? 2 : 0), L5.VWIN.y - f[1] * L5.VWIN.s / 2, 0, L5.VWIN.s);
  c.restore();
};

// слои города из уровня 2 (небо, дальний город, дома, асфальт) — бесшовная прокрутка
L5.cityBg = function () {
  const B = window.BUILDINGS || {}, names = ['workshop', 'nine', 'garages', 'shop', 'hrush', 'park', 'dk', 'embank', 'stele', 'pipes', 'gate'], lst = []; let x = 0;
  for (const n of names) { const b = B[n]; if (!b) continue; lst.push({ name: n, x, w: b.w, h: b.h }); x += b.w + 30; }
  const tot = x || 1;
  return {
    tot,
    draw(c, scroll) {
      const base = ((scroll % tot) + tot) % tot;
      L2.drawLayers(c, scroll);
      L2.drawBuildings(c, base, lst); L2.drawBuildings(c, base - tot, lst);
      L2.drawGround(c, scroll, null);
    },
  };
};

L5.sceneIntro = level => function* () {
  const city = L5.cityBg(), GY = L2.GROUND + 34;
  const val = new G.Actor('valera4', 0, GY, 1), vov = new G.Actor('vova', 0, GY, 1);
  val.visible = vov.visible = false;
  const vg = new G.Actor('vovagun', 0, 0, -1); try { vg.setAnim('hold'); } catch (e) {}
  let climb = 0, wh = 0, scroll = 0, speed = 200, carX = 250, carFr = 0, sway = 0, bob = 0, t = 0, pol = null, glassK = 0, fade = 1, bullets = [], gun = false, shake = 0, smoke = true, flashCop = 0, crash = 0, parked = false, cx0 = 0;
  level.drawScene = c => {
    c.save(); c.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    city.draw(c, scroll);
    if (pol) { L5.drawCar(c, pol.crashed ? 8 : 6 + (Math.floor(t * 5) % 2), pol.x, GY + 6 + (pol.dy || 0) + Math.sin(t * 9) * 0.6, 1, 1, t, { speed: 1, wheel: wh * 0.9 }); }
    L5.drawCar(c, carFr, carX + sway, GY + 4, 1, 1, t, { speed: speed > 20 ? 1 : 0, wheel: wh, rot: Math.sin(t * 2.2) * 0.02 * Math.min(1, speed / 150) + (carFr >= 4 && carFr <= 5 ? -0.012 : 0) });
    if (carFr >= 3 && carFr <= 5) L5.drawVovaWindow(c, carX + sway, GY + 4, 1, climb > 0 ? 0 : carFr === 4 ? 2 : carFr === 5 ? 3 : 1);
    val.draw(c); vov.draw(c);
    for (const b of bullets) Spr.drawC(c, 'l5dec', 19, b.x, b.y, 0, 0.9);
    c.restore();
    FX.draw(c);
    if (fade > 0) { c.fillStyle = 'rgba(0,0,0,' + fade + ')'; c.fillRect(0, 0, W, H); }
  };
  let smokeT = 0, bT = 0, honkT = 0;
  level.updateScene = dt => {
    t += dt; if (climb > 0) climb -= dt; wh += speed * dt / 20; if (vg.update) vg.update(dt); scroll += speed * dt; bob = Math.sin(t * 13) * 0.8 * Math.min(1, speed / 120); if (shake > 0) shake = Math.max(0, shake - dt * 8);
    val.update(dt); vov.update(dt);
    sway = (carFr === 0 || carFr === 1) && !parked ? Math.sin(t * 2.2) * 30 : Math.sin(t * 1.2) * 3 * Math.min(1, speed / 100);
    if (carFr === 0 || carFr === 1) carFr = Math.floor(t * 4) % 2 && !parked ? 1 : 0;
    smokeT -= dt;
    if (smokeT <= 0 && smoke) { smokeT = 0.04; FX.spawn({ x: carX + sway + 6 + U.rand(-5, 5), y: GY - 66 + U.rand(-5, 5), vx: U.rand(-150, -60) * Math.min(1.4, 0.3 + speed / 150), vy: U.rand(-48, -22), life: 1.0, size: 4, grav: -12, color: '#9a9aa0', type: 'puff' }); if (Math.random() < 0.5) FX.spawn({ x: carX + sway + 62, y: GY - 40, vx: U.rand(-100, -40), vy: U.rand(-40, -15), life: 0.8, size: 3.5, grav: -8, color: '#7a7a80', type: 'puff' }); }
    if (gun) { bT -= dt; if (bT <= 0) { bT = 0.12; const mz = L5.vovaMuzzle(carX + sway, GY + 4); for (const my of mz.ys) bullets.push({ x: mz.x, y: my, vx: -560, vy: 0 }); Sound.play('zap'); carFr = carFr === 4 ? 3 : 4; FX.burst(mz.x, mz.ys[1], 3, { colors: ['#9cff40', '#fff'], speed: 90, life: 0.2, grav: 0 }); } }
    for (const b of bullets) { b.x += b.vx * dt; b.y += b.vy * dt; if (pol && b.x < pol.x + 100 && b.x > pol.x - 60 && !b.hit) { b.hit = true; b.x = -999; FX.burst(pol.x + 90, GY - 40, 6, { colors: ['#9cff40', '#fff', '#ffd84a'], speed: 140, life: 0.4, grav: 0 }); Sound.play('hit'); } }
    bullets = bullets.filter(b => b.x > -20);
    if (pol && !pol.crashed) { pol.x += (pol.tx - pol.x) * Math.min(1, dt * 1.6); }
    if (pol && pol.crashed) { pol.x -= 120 * dt; pol.dy = Math.sin(t * 30) * 1; }
  };
  pol = { x: -470, tx: -400, siren: true }; // милиция уже сидит на хвосте, пока за кадром
  Music.play('cutscene');
  // 1. едут по городу, Вова за рулём плохо рулит, из-под руля дым
  yield* Scene.tween(0.8, k => { fade = 1 - k; });
  Sound.play('honk'); yield 1.1; honkT = 1;
  for (let i = 0; i < 4; i++) { Sound.play('steam'); FX.popText(carX + sway + 24, GY - 118, i % 2 ? 'буль-буль' : 'бульк', '#c8d8e0'); yield 0.5; }
  yield* Scene.say('valera', 'Ты чё, с ума сошёл? Я с тобой таким не поеду!', null);
  Sound.play('honk'); shake = 6;
  yield* Scene.say('vova', 'Ладно, ладно. Давай поменяемся, садись за руль. Ты ж наконец-то получил права.', null);

  // 2. тормозят, меняются местами
  yield* Scene.tween(1.2, k => { speed = 200 * (1 - k); });
  speed = 0; parked = true; carFr = 0; sway = 0; yield 0.4; Sound.play('door');
  // ноги — на уровне колёс (низ шин), заднее сиденье — у задней двери, водительское — у передней
  const doorL = carX - 34, doorR = carX + 40, FY = GY + 18;
  val.y = vov.y = FY;
  // Вова выходит из-за машины (сзади) и садится на заднее сиденье; Валера выходит спереди и садится за руль
  vov.x = carX - 135; val.x = carX + 140; val.facing = -1; vov.facing = 1;
  val.setAnim('stand'); vov.setAnim('stand'); smoke = true; yield 0.4;
  vov.visible = true; yield 0.35; val.visible = true; Sound.play('door');
  const jv = Scene.moveTo(vov, doorL, 55, 'walk'), jl = Scene.moveTo(val, doorR, 55, 'walk');
  yield* jv; yield* jl;
  val.facing = -1; vov.facing = 1; val.setAnim('stand'); vov.setAnim('stand');
  yield 0.4;
  Sound.play('door'); vov.visible = false; yield 0.35; Sound.play('door'); val.visible = false; smoke = false; carFr = 2; yield 0.5;
  // 3. Валера за рулём
  speed = 0; yield* Scene.tween(1.4, k => { speed = 210 * k; });


  // 4. догоняет милиция
  pol.tx = carX - 190; Sound.play('warn'); yield 1.2; Sound.play('honk');
  yield () => pol.x > carX - 210;
  yield 0.4;
  yield* Scene.say('cop', 'Срочно остановите машину! От вас за километр воняет!', null);

  yield* Scene.say('vova', 'Русские не сдаются!', null);
  // 5. разбивает заднее стекло, вылезает с «Осеменителем 3000», стреляет
  Sound.play('glass'); G.flash(0.15, '#ffffff'); carFr = 3; climb = 0.9; shake = 10;
  FX.burst(carX + sway - 74, GY - 66, 26, { colors: ['#bfe4ff', '#ffffff', '#8cc8ff'], speed: 240, life: 1.0, grav: 380, type: 'shard' });
  yield 0.9;


  gun = true; yield 1.8;
  pol.tx = carX - 175; yield 0.9;
  pol.crashed = true; Sound.play('boom'); G.shake(5, 0.4); FX.burst(pol.x + 100, GY - 40, 24, { colors: ['#ffd84a', '#ff8a2a', '#444'], speed: 220, life: 0.9, grav: 0, size: 3 }); yield 0.8;
  yield* Scene.say('vova', 'Едем к заводоуправлению, Валерчик!', null);
  gun = false; carFr = 5; speed = 480; yield* Scene.tween(0.9, k => { fade = k; });
  Scene.dialog = null;
};

// --- 2. Встреча с Граблионком: мир застыл, диалог в кадре
L5.sceneMatch = level => function* () {
  const pl0 = level.pl, SR = L5.S_RACE;
  // милиция исчезает, «копейка» плавно встаёт ровно на линию старта, сзади догоняет Граблионок и встаёт рядом
  level.cars = level.cars.filter(c => c === pl0 || !(c.cop || c.d.boss)); level.ebullets = []; level.bullets = []; level.clouds = [];
  const pA = L5.at(SR, { lane: 24 }), mB = L5.at(SR, { lane: -24 }), back = L5.at(SR - 780, { lane: -24 });
  const m0 = level.matiz = new L5.Car('matiz', back.x, back.y, back.ang); m0.invul = 1e9; m0.isMatiz = true; m0.lane = -24; m0.s = SR - 780; level.cars.push(m0);
  const p0 = { x: pl0.x, y: pl0.y, ang: pl0.ang }, angD = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
  pl0.vx = pl0.vy = 0; pl0.thr = pl0.brk = pl0.str = 0;
  level.drawScene = c => { L5.R.world(level, c); level.drawHUD(c); };
  level.updateScene = dt => { level.t += dt; for (const e of L5.fxs) e.t += dt; level.cam.x = pl0.x; level.cam.y = pl0.y; };
  Sound.play('honk');
  yield* Scene.tween(2.0, k => {
    const e1 = 1 - Math.pow(1 - Math.min(1, k * 1.5), 3), e2 = 1 - Math.pow(1 - k, 2.2);
    pl0.x = p0.x + (pA.x - p0.x) * e1; pl0.y = p0.y + (pA.y - p0.y) * e1; pl0.ang = p0.ang + angD(p0.ang, pA.ang) * e1; pl0.vx = pl0.vy = 0; pl0.s = L5.proj(pl0.x, pl0.y, SR, 400).s;
    m0.x = back.x + (mB.x - back.x) * e2; m0.y = back.y + (mB.y - back.y) * e2; m0.ang = back.ang; m0.vx = m0.vy = 0; m0.s = SR - 780 + 780 * e2;
  });
  pl0.x = pA.x; pl0.y = pA.y; pl0.ang = pA.ang; pl0.s = SR; m0.x = mB.x; m0.y = mB.y; m0.ang = mB.ang; m0.s = SR;
  Sound.play('honk');
  yield* Scene.say('grab', 'Эй, посоны! Ставлю Валерину задницу на то, что я на матизе вас обгоню!', null);
  yield* Scene.say('valera', 'Не подведи меня.', null);
  G.flash(0.2, '#ffffff'); Sound.play('honk');
};

// --- 3. Финал: финиш на краю обрыва у моря, Граблионок сбрасывает «копейку» вниз, затем комикс
L5.sceneEnd = level => function* () {
  const bg = L5.img.l5_cliff_bg, GY = 300, FY = GY + 18;
  const val = new G.Actor('valera4', 150, FY, 1), vov = new G.Actor('vova', 118, FY, 1);
  let carX = 330, carY = GY + 4, carRot = 0, carVis = true, carFr = 2, mx = -260, mFr = 0, mVis = true, fade = 1, shake = 0, t = 0, fall = 0, vy = 0;
  level.drawScene = c => {
    c.save(); c.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    if (bg) c.drawImage(bg, 0, 0, W, H); else { c.fillStyle = '#c8a070'; c.fillRect(0, 0, W, H); }
    if (carVis) L5.drawCar(c, carFr, carX, carY, 1, 1, t, { speed: 0, rot: carRot });
    if (mVis && L5.has('l5msd')) {
      // золотистый матиз Граблионка: кузов (кадры 0 цел, 1 разбит) + вращающиеся колёса (кадр 2)
      const [bw, bh] = Spr.size('l5msd', mFr), cy = GY + 12 - (bh || 60) / 2 + 10, rot = mx / 14.5 + (mFr ? t * 3 : 0);
      for (const fx of [0.19, 0.82]) Spr.drawC(c, 'l5msd', 2, mx + (fx - 0.5) * bw, cy + (bh || 60) / 2 - 0.085 * bw, rot, 1);
      Spr.drawC(c, 'l5msd', mFr, mx, cy, 0, 1);
    }
    vov.draw(c); val.draw(c);
    FX.draw(c);
    c.restore();
    if (fade > 0) { c.fillStyle = 'rgba(0,0,0,' + fade + ')'; c.fillRect(0, 0, W, H); }
  };
  level.updateScene = dt => {
    t += dt; if (shake > 0) shake = Math.max(0, shake - dt * 10); val.update(dt); vov.update(dt); FX.update(dt);
    if (fall) { vy += 380 * dt; carX += 70 * dt; carY += vy * dt; carRot += 1.3 * dt; }
  };
  Music.play('cutscene');
  yield* Scene.tween(0.8, k => { fade = 1 - k; });
  val.facing = 1; vov.facing = 1; val.setAnim('stand'); vov.setAnim('stand');
  yield* Scene.say('valera', 'Ха-ха! Моя задница осталась при мне!', null);
  yield* Scene.say('vova', 'Твою задницу буду прикрывать только я!', null);
  yield* Scene.say('valera', 'Ха-ха! Лох этот Граблионок!', null);
    // садятся в «копейку»
  yield* Scene.moveTo(val, carX - 40, 55, 'walk'); Sound.play('door'); val.visible = false; yield 0.3;
  yield* Scene.moveTo(vov, carX - 70, 55, 'walk'); Sound.play('door'); vov.visible = false; carFr = 2; yield 0.6;
  // из-за кадра несётся разъярённый Граблионок
  Sound.play('honk'); mFr = 0; const tm = { v: 0 };
  yield* Scene.tween(1.5, k => { mx = -260 + k * (carX - 235 + 260); });
  yield* Scene.say('grab', 'Эй, посоны, не обессудьте! Вы будете героями моего следующего детектива!', null);
  Sound.play('honk'); yield 0.5;
  yield* Scene.tween(0.55, k => { mx = carX - 235 + k * 170; });
  // удар
  mFr = 1; Sound.play('crash'); G.shake(8, 0.5); shake = 14; G.flash(0.2, '#ffffff'); FX.burst(carX - 90, GY - 20, 22, { colors: ['#ffd84a', '#ff8a2a', '#fff', '#8a8a90'], speed: 220, life: 0.7, grav: 120 });
  fall = 1; vy = -40; Sound.play('boom');
  FX.popText(carX, GY - 80, 'А-А-А-А!!!', '#ffd84a');
  yield 0.9;
  yield* Scene.tween(0.9, k => { fade = k; });
  carVis = false; mVis = false; fall = 0;
  // комикс — как на уровне 3
  L3.img.l5c1 = L5.img.l5_comic_end1; L3.img.l5c2 = L5.img.l5_comic_end2;
  yield* L3.comic(level, [
    { img: 'l5c1', sfx: 'crash', cap: 'Где-то внизу, на пустыре...', lines: [['Ох... голова... Вова? Ты живой?', 140, 60]] },
    { img: 'l5c2', sfx: 'splash', cap: 'Тишина. Только ветер.', lines: [['Вова?.. Куда он делся? Только следы...', 150, 56], ['Сколько я был в отключке?', 150, 120]], title: 'КОНЕЦ УРОВНЯ 5' }
  ])();
  Scene.dialog = null;
};
