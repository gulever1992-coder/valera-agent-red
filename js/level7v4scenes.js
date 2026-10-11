'use strict';
// ============ Ур.7 v4: катсцены и класс уровня ============
// Сцены на отдельном фоне — через L7.stage (трасса, салон фургона, трос, финал); сцены на карте — Scene.run поверх V4.Run.
Object.assign(WHO, {
  stas: { name: 'СТАС', color: '#8cc8ff', voice: 250 }, maxim: { name: 'МАКСИМ', color: '#e0c070', voice: 200 }, biker7: { name: 'БАЙКЕР', color: '#e08050', voice: 110 },
  leather: { name: 'КОЖАНЫЙ', color: '#f070c0', voice: 300 }, cmd7: { name: 'СПЕЦНАЗ НА ВХОДЕ', color: '#8ac070', voice: 160 }, cmdr7: { name: 'ГЛАВАРЬ СПЕЦНАЗА', color: '#8ac070', voice: 130 },
  deniso: { name: 'ДЕНИС О.', color: '#d0d0ff', voice: 230 }, denisch: { name: 'ДЕНИС Ч.', color: '#f0f0f0', voice: 270 }, mrx: { name: 'ГОСПОДИН ИКС', color: '#ff4040', voice: 90 },
  grab: { name: 'ГРАБЛИОНОК', color: '#ffd84a', voice: 320 }, bomzh: { name: 'БОМЖ', color: '#c8a070', voice: 140 },
});
const say4 = (who, text, actor, auto = 2.4) => Scene.say(who, text, actor, { auto });

// сцена на отдельном фоне в грозу (небо + слой + дождь)
V4.stormStage = function (level, o) {
  const storm = new V4.Storm();
  const st = L7.stage(level, Object.assign({ rain: null }, o, {
    bg: (c, st) => { storm.drawSky(c, st.cx || 0); if (o.bg) o.bg(c, st); },
    over: (c, st) => { if (o.over) o.over(c, st); storm.drawFlash(c); storm.drawRain(c, st.cx || 0); },
  }));
  const tick0 = o.tick; st.tick = (dt, st) => { storm.update(dt, true); if (tick0) tick0(dt, st); };
  st.storm = storm; return st;
};
// слой-полоса с зеркальным тайлом (трасса)
V4.tileLayer = function (c, img, cx, s, fy, par = 1) {
  if (!img) return; const w = img.width * s, h = img.height * s, y = V4.GY - fy * s, off = cx * par;
  let x = -(((off % (w * 2)) + w * 2) % (w * 2));
  for (; x < W; x += w) { const odd = Math.floor((off + x) / w + 0.001) % 2 !== 0;
    if (odd) { c.save(); c.translate(Math.round(x) + w, 0); c.scale(-1, 1); c.drawImage(img, 0, y, w, h); c.restore(); } else c.drawImage(img, Math.round(x), y, w, h); }
};

// ---------- ИНТРО 1: трасса в грозу, автостоп ----------
// фургон Стаса и Максима крупно (Flow: van_big.png 1364x617 без колёс, пропорции исходного van7; арки x 260 и 1114, земля на 680;
// van_wheels.png — 4 фазы по 126)
V4.drawBigVan = function (c, q, t) {
  const im = q.empty ? V4.img.van_empty : V4.img.van_big, wh = V4.img.van_wheels; if (!im) return L7.drawVan(c, q, t);
  const k = 0.2126, w = 1364 * k, jig = q.mv ? Math.floor(t * 14) % 2 : 0, left = q.x - w / 2, top = q.y - 680 * k;
  c.drawImage(im, left, top - jig, w, 617 * k);
  if (wh) { const ph = q.mv ? Math.floor(t * 18) % 4 : 0, d = 200 * k; for (const ax of [260, 1114.5]) c.drawImage(wh, ph * 126, 0, 126, 126, left + ax * k - d / 2, q.y - d, d, d); }
  if (q.mv || q.idle) Spr.drawC(c, 'van7', 7 + Math.floor(t * 8) % 3, left - 10 - (t * 40 % 12), q.y - 10, 0, 1.2);
};
V4.sceneRoad = function (level) {
  const road = V4.img.road;
  const st = V4.stormStage(level, { bg: (c, st) => { if (road) { V4.drawFar(c, st.t * 8); V4.tileLayer(c, road, 0, 0.5, 614); } else if (L6.img.bgf) c.drawImage(L6.img.bgf, 0, 0, W, H); } });
  const RY = V4.GY + 34;   // полоса дороги (ближе к камере)
  const bike = { set: 'solo', x: -220, y: RY, pose: 'idle', mv: false, on: true };
  const van = { x: -340, y: RY - 4, mv: false, on: false };   // дальняя полоса: Валера подходит к двери перед фургоном
  st.actors.push({ z: 3, update() {}, draw(c) { if (bike.on) L7.drawBike(c, bike, st.t); if (van.on) V4.drawBigVan(c, van, st.t); } });
  const v = L7.actor(st, 'valera7', -40, 1, { z: 2 });
  const lm = L7.actor(st, 'leather7', 470, -1, { z: 2 }); lm.setAnim('thumb');
  const head = (q, dx, h) => ({ get x() { return q.x + dx; }, get y() { return q.y; }, headH: h, voice: 150 });
  const bikeHead = head(bike, 6, 92), vanHead = head(van, 40, 94);
  const drive = function* (q, x1, dur, ease = 'out') { const x0 = q.x; q.mv = true; if (q.set) q.pose = 'ride'; yield* Scene.tween(dur, k => { q.x = U.lerp(x0, x1, ease === 'out' ? U.easeOut(k) : k * k); }); q.mv = false; if (q.set) q.pose = 'idle'; };
  return function* () {
    Music.play('cutscene');
    st.title = 'Трасса у леса. Вечер. Гроза.'; st.titleY = 60; st.titleSize = 12;
    yield* Scene.tween(1, k => { st.fade = 1 - k; st.titleK = k; });
    st.storm.strike(true);
    yield* Scene.moveTo(v, 230, 60, 'walk'); st.title = null; v.setAnim('sigh'); yield 0.5;
    yield* say4('valera', 'Фух, выбрался из леса... Весь мокрый и в грязи. Надо поймать попутку.', v);
    v.setAnim('thumb'); yield 0.6;
    lm.facing = -1; lm.setAnim('look'); yield 0.7;
    yield* say4('leather', 'О, папа мия! Фу, какой!', lm, 1.6);
    yield* Scene.moveTo(lm, 540, 40, 'walk'); lm.facing = -1; lm.setAnim('thumb');
    Sound.play('honk'); yield* drive(bike, 360, 1.8); bike.pose = 'beckon';
    yield* say4('biker7', 'Р-Р-Р... Кр-р-расавчик, пр-р-рыгай, подвезу-зу-зу!', bikeHead);
    v.setAnim('stand'); G.say(v, 'О! Спасибо, братан!', 1.2); yield 0.3;
    yield* Scene.moveTo(v, 300, 55, 'walk'); bike.pose = 'frown';
    yield* say4('biker7', 'Я не тебе, парень! И лицо у тебя знакомое... пр-р-ротокольное.', bikeHead);
    v.setAnim('dazed'); lm.facing = -1;
    yield* Scene.moveTo(lm, 330, 160, 'run');
    lm.setAnim('push'); Sound.play('punch'); G.say(lm, 'Фу-фу-фу, папа мия! Ми папа ждёт!', 1.6);
    yield* Scene.tween(0.35, k => { v.x = 300 - k * 40; }); v.setAnim('dazed');
    lm.facing = 1; yield* Scene.moveTo(lm, 352, 90, 'run');
    lm.visible = false; bike.set = 'duo'; bike.pose = 'idle'; Sound.play('land'); yield 0.6;
    bike.pose = 'wave'; yield 0.8;
    Sound.play('honk'); yield* drive(bike, W + 260, 1.6, 'in'); bike.on = false;
    v.facing = 1; v.setAnim('sigh'); yield* say4('valera', 'Эхх...', v, 1.2); yield 0.6;
    van.on = true; Sound.play('honk'); yield* drive(van, 450, 2.4);
    van.idle = true; yield 0.5;
    yield* say4('stas', 'Ты шо такой грязный, буська? Тебе куды надо?', vanHead);
    yield* say4('valera', 'Мне в заводоуправление!', v, 1.4);
    yield* say4('maxim', 'Так мы тудой и едем, буська! Садись давай сюдой, вперёд — подкынем тудой!', vanHead);
    // садится ВПЕРЁД, в кабину к Стасу и Максиму (перед фургона справа)
    // спускается с обочины на дорогу и идёт к передней двери (перед фургоном, ноги на уровне колёс)
    const x0 = v.x, y0 = v.y, cabX = van.x + 44, doorY = van.y + 3;
    v.z = 4; v.facing = 1; v.setAnim('walk');
    yield* Scene.tween(Math.abs(cabX - x0) / 60, k => { v.x = U.lerp(x0, cabX, k); v.y = U.lerp(y0, doorY, Math.min(1, k * 1.6)); });
    v.setAnim('stand'); Sound.play('door'); yield 0.25;
    yield* Scene.tween(0.4, k => { v.alpha = 1 - k; v.y = doorY - k * 10; }); v.visible = false;
    Sound.play('door'); yield 0.5;
    van.idle = false; yield* drive(van, W + 400, 2.2, 'in');
    yield* Scene.tween(0.5, k => { st.fade = k; });
  };
};

// ---------- ИНТРО 2: в кабине фургона (вид с капота через лобовое стекло) ----------
// cabin.png: окна и углы прозрачные — за ними мелькает трасса; поверх стекла — два дворника (wiper.png, шарнир слева) и дождь
V4.sceneVan = function (level) {
  const cab = V4.img.cabin, wip = V4.img.wiper, road = V4.img.road;
  let jy = 0, bump = 0, run = 0;
  const win = (c, x0, x1, fn) => { c.save(); c.beginPath(); c.rect(x0, 0, x1 - x0, H); c.clip(); fn(); c.restore(); };
  const wiper = (c, px, py, a) => { if (!wip) return; c.save(); c.translate(px, py + jy); c.rotate(a); c.scale(0.16, 0.16); c.drawImage(wip, -24, -70); c.restore(); };
  const st = V4.stormStage(level, {
    bg: (c, st) => {
      if (road) {
        win(c, 0, 172, () => V4.tileLayer(c, road, run, 0.5, 640));             // левое боковое окно
        win(c, 172, 468, () => V4.tileLayer(c, road, run * 0.16, 0.3, 867));    // заднее окно: дорога убегает медленнее
        win(c, 468, W, () => V4.tileLayer(c, road, -run, 0.5, 640));            // правое боковое окно
      }
      if (cab) c.drawImage(cab, 0, jy, W, H + 2);
    },
    over: (c, st) => {
      const a = -(0.5 - 0.5 * Math.cos(st.t * 4.6)) * 1.7;                        // взмах от капота вверх и обратно
      wiper(c, 150, 277, a); wiper(c, 410, 277, a);
    },
    tick: (dt, st) => {
      run += dt * 520; bump = Math.max(0, bump - dt * 5);
      if (Math.random() < dt * 0.5) bump = 1;                                     // кочка
      jy = Math.round(Math.sin(st.t * 23) * 0.7 - bump * 2);
    },
  });
  const seat = (x, h) => ({ x, y: 300, headH: h, voice: 150 });
  const v = seat(142, 196), m = seat(320, 204), s = seat(498, 200);
  return function* () {
    Scene.dialogTop = false;   // реплики внизу, на капоте: лица, зеркало и дворники видны
    yield* Scene.tween(0.6, k => { st.fade = 1 - k; });
    yield 0.8;
    yield* say4('valera', 'У вас номера не Лемурии. Вы откуда, парни? Что забыли в Выборгске?', v, 3);
    yield* say4('stas', 'Да мы импортом занимаемся тудой-сюдой. Картоплю возим. Сами-то мы в столице Лемурии живём.', s, 3);
    yield* say4('maxim', 'Говорят, тут перспективное направление! А нам шо — рубль копейку греет!', m, 3);
    st.storm.strike(true);
    G.say(v, '(Понаехали с чужбины... Скоро туалетной бумаги не то что по 3 рубля не будет — вовсе не останется...)', 3.6, { think: true }); yield 3.8;
    yield* say4('stas', 'Почти приехали, буська! Там сегодня съезд — костюмы, лимузины...', s, 2.4);
    yield* Scene.tween(0.6, k => { st.fade = k; });
  };
};

// ---------- ИНТРО 3: приезд к КПП (на карте A) ----------
// несколько актёров идут одновременно к своим точкам
const walkTogether = function* (list, sp) {
  for (const [a, x] of list) a.facing = Math.sign(x - a.x) || a.facing;
  while (list.some(([a, x]) => Math.abs(a.x - x) > 0.5)) {
    for (const [a, x] of list) { if (Math.abs(a.x - x) > 0.5) { a.x = U.approach(a.x, x, sp * G.dt); a.setAnim('walk'); } else a.setAnim('stand'); }
    yield;
  }
  for (const [a] of list) a.setAnim('stand');
};
V4.sceneArrive = function (level, run) {
  const pl = run.player, wd = run.world;
  const van = { x: -320, y: V4.GY + 46, mv: false, crew: true, door: false, idle: true };
  run.hidePlayer = true; run.camLock = true; wd.cam.x = 0;
  const s = Act('stas7', 0, 1, 'stand', { visible: false }), m = Act('max7', 0, 1, 'stand', { visible: false }), v = Act('valera7', 0, 1, 'stand', { visible: false });
  run.crowd.push(s, m, v);
  const guard = run.crowd.find(q => q.guard), guard2 = run.crowd.filter(q => q.guard)[1];
  const prevFront = run.D.drawFront;
  run.D.drawFront = (c, cx, r) => { V4.drawBigVan(c, { x: van.x - cx, y: van.y, mv: van.mv, idle: van.idle, empty: !van.crew }, r.t); if (prevFront) prevFront(c, cx, r); };
  return function* () {
    run.fade = 1; yield* Scene.tween(0.8, k => { run.fade = 1 - k; });
    level.titleT = 2.6;
    van.mv = true; Sound.play('honk'); yield* Scene.tween(2.2, k => { van.x = U.lerp(-320, 560, U.easeOut(k)); }); van.mv = false; van.door = true; Sound.play('door');
    for (const a of [s, m, v]) { a.visible = true; a.x = 560; a.facing = -1; }
    m.x = 585; v.x = 612; Sound.play('door'); yield 0.3; van.crew = false;
    // все трое вместе идут к шлагбауму
    yield* walkTogether([[s, 330], [m, 358], [v, 395]], 52);
    van.door = false; Sound.play('door');
    guard.setAnim('point');
    yield* say4('cmd7', 'Так-так-так... Вы двое в списках, вас уже ждёт Господин Икс. А вам, Мистер Рэд, в доступе отказано!', guard, 3.2);
    guard.setAnim('stand'); v.setAnim('dazed');
    s.facing = 1; s.setAnim('shrug'); m.facing = 1; m.setAnim('wave');
    yield* say4('stas', 'Не грусти, буська! Выпей бульбяночку — уже продаётся у вас в магазине «Под горлышко».', s, 3);
    yield* say4('maxim', 'Ну, пока-пока, буська! Фургон наш не трогай!', m, 1.6);
    // уходят вдвоём за шлагбаум — по аллее к зданию (тают); фургон остаётся на стоянке
    s.facing = -1; m.facing = -1;
    yield* walkTogether([[s, 232], [m, 252]], 50);
    yield* Scene.tween(0.9, k => { for (const a of [s, m]) { a.alpha = 1 - k; a.y = V4.GY - 10 * k; a.setAnim('walk'); } }); s.visible = m.visible = false;
    v.facing = -1; v.setAnim('sigh'); yield 0.6;
    v.facing = 1;
    yield* Scene.tween(2.6, k => { wd.cam.x = U.lerp(0, 380, k * k * (3 - 2 * k)); });
    yield* Scene.moveTo(v, 700, 70, 'walk');
    v.setAnim('shoutFist');
    yield* say4('valera', 'Стропальщики шестого разряда не сдаются! По крайней мере, просто так! А то заладили: агент Рэд, агент Рэд...', v, 3);
    v.setAnim('stand'); G.say(v, 'Через толпу не пролезу. Обойду вдоль забора — где-то тут был люк...', 2.6); yield 2.4;
    pl.x = v.x; pl.facing = 1; v.visible = false; run.crowd = run.crowd.filter(a => a !== s && a !== m && a !== v);
    run.D.drawFront = prevFront; run.flags.van = 1; run.hidePlayer = false;
  };
};

// ---------- Матиз Граблионка пробивает забор (карта A2) ----------
V4.sceneMatiz = function (level, run) {
  // Матиз едет по дороге слева направо, у угла сворачивает в съезд и врезается в стену, идущую к зрителю
  const pl = run.player, D = run.D, RY = V4.GY + 58, mz = { x: 0, x0: 0, y: RY, rot: 0 };
  run.matiz = { draw(c, cx) { V4.drawMatiz(c, mz.x - cx, mz.y, mz.rot, (mz.x - mz.x0) / 14); } };
  return function* () {
    pl.vx = 0; pl.facing = 1; run.camLock = true; const c0 = run.world.cam.x;
    G.say(pl, 'Тихо тут... Слишком тихо.', 1.4);
    yield* Scene.tween(1.2, k => { run.world.cam.x = U.lerp(c0, D.w - W, U.easeOut(k)); });
    Sound.play('honk'); yield 0.3;
    const x0 = run.world.cam.x - 200, x1 = D.cornerX - 10; mz.x0 = x0; mz.x = x0;
    yield* Scene.tween(1.3, k => { mz.x = U.lerp(x0, x1, k); });
    G.say(pl, 'Это что — ЗОЛОТОЙ МАТИЗ?!', 1.2);
    // занос в съезд и удар носом в стену
    yield* Scene.tween(0.4, k => { mz.x = U.lerp(x1, D.crashX, k); mz.y = U.lerp(RY, D.crashY, k); mz.rot = 0.28 * k; });
    run.flags.breach = 1; run.matiz = null; Sound.play('brick'); Sound.play('glass'); G.shake(8, 0.6); G.flash(0.12, '#fff');
    for (let i = 0; i < 3; i++) FX.burst(D.holeX + U.rand(-20, 20), D.holeY, 10, { colors: ['#9a6a50', '#c8c0b0', '#6a5040'], speed: 160, life: 0.8, grav: 500 });
    yield 0.9;
    const car = { x: D.crashX, y: D.crashY - 20, headH: 40, voice: 320 };
    yield* say4('grab', 'А-а-а! Тормоза-а-а! Кто поставил тут забор?!', car, 2);
    yield* say4('grab', 'Валерчик?! Опять ты! Ты мне за гонку ещё должен!.. Ой, моя ласточка...', car, 2.6);
    yield* say4('valera', 'Спасибо, Граблионок! Как раз дырку искал. Не болей!', pl, 2);
  };
};

// ---------- автобус у сортировочного цеха (карта C) ----------
V4.sceneBus = function (level, run) {
  const pl = run.player, D = run.D, wd = run.world;
  const bus = { x: wd.cam.x - 500, door: false, mv: false };
  // автобус: кузов (арки тёмные), поверх — колёса в арках (0.32 и 0.745 длины), вращаются по пройденному пути
  run.bus = { draw(c, cx) {
    const S = 0.8, f = Spr.frame('bus7', 0), w = f[2] / 2 * S, x = bus.x - cx, y = V4.GY + 10, wr = 20, rot = bus.x / wr;
    Spr.draw(c, 'bus7', bus.door ? 1 : 0, x, y - 11, 1, { scale: S });
    for (const k of [0.32, 0.745]) Spr.drawC(c, 'bus7', 2, x - w / 2 + w * k, y - wr, rot, wr * 2 / 40);
  } };
  const gd = Act('cmd4', D.doorX + 10, -1, 'stand', { front: true }); run.crowd.push(gd);   // все — ПЕРЕД автобусом (front), у его передней двери
  const exitX = () => bus.x + 126, LOW = V4.GY + 10;   // передняя дверь автобуса; земля у колёс (ниже тротуара)
  const pax = [['bomzh4', -20], ['alk4', 10], ['gop4', 40], ['bomzh4', 70], ['gop4', 100]].map(([st, dx]) => Act(st, 0, 1, 'walk', { visible: false, dx, front: true }));
  run.crowd.push(...pax);
  let doorOpen = false; const prevMid = D.drawMid;
  D.drawMid = (c, cx, r) => { D.doorOpenScene = doorOpen; if (prevMid) prevMid(c, cx, r); };   // створки разъезжаются сами (D.drawMid карты C)
  return function* () {
    pl.vx = 0; pl.forcePose = 'crouch'; pl.x = D.tiresX - 40; pl.facing = 1; run.camLock = true;
    yield* Scene.tween(1.2, k => { wd.cam.x = U.lerp(wd.cam.x, D.doorX - 360, k); });
    G.say(pl, 'Тс-с... Кто-то едет.', 1.2); Sound.play('honk');
    bus.mv = true; yield* Scene.tween(2.4, k => { bus.x = U.lerp(D.doorX - 900, D.doorX - 190, U.easeOut(k)); }); bus.mv = false;
    bus.door = true; Sound.play('door'); yield 0.4;
    { const x0 = gd.x; gd.facing = -1; gd.setAnim('walk'); yield* Scene.tween(2, k => { gd.x = U.lerp(x0, D.doorX - 112, k); gd.y = U.lerp(V4.GY, LOW + 2, Math.min(1, k * 2.5)); }); }
    gd.facing = 1; gd.setAnim('point');
    yield* say4('cmd7', 'Так-так-так... Выходим! Сейчас вас покормят и нальют!', gd, 2.4);
    gd.setAnim('stand');
    pax.forEach((p, i) => { p.wait = 0.05 + i * 0.9; p.facing = 1; });   // выходят по одному из передней двери автобуса и идут к двери цеха
    const walkAll = function* () { for (let t = 0; t < 30 && pax.some(p => !p.gone); t += G.dt) {
      for (const p of pax) if (!p.gone) {
        if (p.wait > 0) { p.wait -= G.dt; if (p.wait <= 0) { p.visible = true; p.x = exitX(); p.y = LOW; p.alpha = 0; p.out = 0; } continue; }
        p.setAnim('walk'); p.x += 44 * G.dt; p.out += G.dt; p.y = U.lerp(LOW, V4.GY, U.clamp((p.x - exitX() - 16) / 34, 0, 1));
        if (p.x > D.doorX - 6) { p.alpha = Math.max(0, p.alpha - G.dt * 2.5); if (p.alpha <= 0) { p.visible = false; p.gone = true; } } else p.alpha = Math.min(1, p.out * 4);
      }
      yield; } };
    doorOpen = true; Sound.play('door');
    G.say(pax[0], 'А водка будет?!', 1.8, { shout: true });
    yield* walkAll();
    G.say(gd, 'Будет, будет... всё будет.', 1.4); yield 0.8;
    doorOpen = false; Sound.play('door'); run.flags.bus = 1; Sound.play('warn'); yield 0.6;
    bus.door = false; Sound.play('door'); bus.mv = true; yield* Scene.tween(2, k => { bus.x = U.lerp(D.doorX - 190, D.doorX - 1200, k * k); }); bus.mv = false; run.bus = null;
    { const x0 = gd.x, y0 = gd.y; gd.facing = 1; gd.setAnim('walk'); yield* Scene.tween(2.6, k => { gd.x = U.lerp(x0, D.doorX + 30, k); gd.y = U.lerp(y0, V4.GY, Math.min(1, k * 2)); }); } gd.visible = false; run.crowd = run.crowd.filter(a => !pax.includes(a) && a !== gd);
    run.guards.push(Object.assign(new L7.Guard({ x: D.doorX + 30, kind: 'post', facing: -1, range: 150 }), { door: true, draw: V4.drawGuard, id: 'Cdoor' }));
    pl.facing = 1; G.say(pl, 'Что за чертовщина тут творится?! Надо внутрь...', 2.4); yield 1.6;
    run.camLock = false; D.drawMid = prevMid;
    run.hints = [{ x1: 0, x2: D.w, text: 'Охранник у двери. Подкрадись, когда отвернётся — {punch} сзади. Потом {up} у панели', cond: r => !r.flags.door }];
  };
};

// ---------- антенна → трос → окно заводоуправления ----------
// ---------- крыша цеха издалека (как вид с парковки): маленький Валера выходит на крышу, цепляется за трос и уезжает ----------
// Здание — слой shopfar (px картинки -> экран: ROOF.x + px * s, ROOF.y + py * s); перед ним — забор и парковка (тот же фон, что на карте C).
V4.ROOF = { x: 18, y: -6, s: 0.44, door: [1010, 196], mast: [826, 150], end: [-60, 300], k: 0.22 };
V4.sceneRoof = function (level) {
  const R = V4.ROOF, P = p => [R.x + p[0] * R.s, R.y + p[1] * R.s];
  const strip = V4.roofStrip || (V4.roofStrip = V4.buildStrip([{ k: 'park', s: 0.9, fy: 476 }, { k: 'park', s: 0.9, fy: 476, ov: 80, flip: true }]));
  const [mx, my] = P(R.mast), [ex, ey] = P(R.end);
  const st = V4.stormStage(level, {
    bg: (c, st) => {
      V4.drawFar(c, 300);
      const im = V4.img.shopfar; if (im) c.drawImage(im, R.x, R.y, im.width * R.s, im.height * R.s);
      V4.drawCable(c, mx, my, ex, ey, 10, 'rgba(170,180,200,0.85)');
    },
    over: (c) => { c.drawImage(strip.cv, 600, 0, W * 2, H * 2, 0, 64, W, H); },
  });
  const [dx, dy] = P(R.door);
  const v = L7.actor(st, 'valera7', dx, -1, { y: dy, z: 2, scale: R.k, alpha: 0 }); v.setAnim('stand');
  const HANG = 84 * R.k;
  return function* () {
    yield* Scene.tween(0.6, k => { st.fade = 1 - k; });
    yield* Scene.tween(0.5, k => { v.alpha = k; });
    G.say(v, 'Крыша! А вон и трос...', 1.6); yield 1.2;
    v.setAnim('walk'); yield* Scene.tween(2.2, k => { v.x = U.lerp(dx, mx + 6, k); v.y = U.lerp(dy, my + HANG, k); });
    v.setAnim('hang4'); st.storm.strike(true); yield 0.5;
    G.say(v, 'Поехали!', 1, { shout: true });
    yield* Scene.tween(2.6, k => { const q = k * k, sag = 10 * 4 * q * (1 - q) * 0.5; v.x = U.lerp(mx + 6, ex, q); v.y = U.lerp(my, ey, q) + sag + HANG; });
    yield* Scene.tween(0.5, k => { st.fade = k; });
  };
};
V4.sceneCable = function (level, run) {
  const pl = run.player, D = run.D;
  return function* () {
    pl.vx = 0; pl.x = D.antX; pl.facing = 1; run.hidePlayer = true; run.camLock = true;
    const v = Act('valera7', D.antX, -1, 'climb'); run.crowd.push(v);
    yield* Scene.tween(3, k => { v.y = U.lerp(V4.GY, D.cableY + 84, k); v.setAnim('climb'); });
    v.setAnim('hang4'); G.say(v, 'Вот он, трос! Прямо в окно заводоуправления. Ну, держитесь!', 2); yield 1.8;
    run.fade = 0; yield* Scene.tween(0.4, k => { run.fade = k; });
  };
};
// полёт по тросу — отдельный фон: гроза, впереди растёт фасад заводоуправления; трос идёт из-за спины (с антенны цеха)
// точно в верхнее окно правого крыла (V4.ADMIN_WIN) — туда Валера и въезжает
V4.ADMIN_WIN = [1177, 360];   // px на admin.png
V4.adminWin = a => { const img = V4.img.admin, s = a.s, w = (img ? img.width : 1376) * s, h = (img ? img.height : 768) * s;
  return [a.x - w / 2 - (a.cx || 0) * (a.par || 0) + V4.ADMIN_WIN[0] * s, a.y - h + V4.ADMIN_WIN[1] * s]; };
V4.drawCable = function (c, x0, y0, x1, y1, sag = 10, col) {   // трос (тонкая линия — как и было согласовано)
  c.strokeStyle = col || 'rgba(18,18,24,0.95)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1); c.stroke();
};
V4.sceneSlide = function (level) {
  const adm = k => ({ x: U.lerp(6, -404, k) + U.lerp(0.25, 0.7, k) * 688, s: U.lerp(0.25, 0.7, k), y: U.lerp(252, 486, k), par: 0 });
  const st = V4.stormStage(level, { bg: (c, st) => {
    V4.drawFar(c, st.t * 40);
    V4.drawAdmin(c, 0, adm(st.k));
  }, over: (c, st) => { const [ex, ey] = V4.adminWin(adm(st.k)); V4.drawCable(c, W + 30, -30, ex, ey, 6); } });
  st.k = 0;
  const v = L7.actor(st, 'valera7', W - 20, -1, { y: 70, z: 2 }); v.setAnim('hang4');
  const HANG = 84;   // от рук до ног в кадре «висит»
  return function* () {
    yield* Scene.tween(0.5, k => { st.fade = 1 - k; });
    st.storm.strike(true);
    G.say(v, 'А-А-А-А!', 1.6, { shout: true });
    yield* Scene.tween(3.4, k => { st.k = k; const [ex, ey] = V4.adminWin(adm(k)), q = Math.min(1, k * 1.02); const hx = U.lerp(W + 30, ex, q), hy = U.lerp(-30, ey, q); v.x = hx; v.y = hy + HANG; });
    const [ex, ey] = V4.adminWin(adm(1));
    v.setAnim('kick4'); Sound.play('glass'); G.shake(8, 0.5); G.flash(0.15, '#fff');
    FX.burst(ex, ey + 20, 16, { colors: ['#cfe8ff', '#ffffff', '#8ab0d0'], speed: 200, life: 0.7, grav: 400 });
    G.say(v, 'Окно... вдребезги!', 1); yield 0.8;
    yield* Scene.tween(0.6, k => { st.fade = k; });
  };
};
V4.sceneScaff = function (level) {
  const st = V4.stormStage(level, { bg: (c) => { const img = V4.img.scaff; if (img) c.drawImage(img, 0, 0, 1121, img.height, -110, -60, 1121 * 0.62, img.height * 0.62); } });   // справа на картинке нарисована молния — обрезаем
  const v = L7.actor(st, 'valera7', 560, -1, { y: 94, z: 2 }); v.setAnim('dazed');
  return function* () {
    yield* Scene.tween(0.5, k => { st.fade = 1 - k; });
    yield* say4('valera', 'Приземлился... на строительные леса. Стропальщики и не такое видали!', v, 2.4);
    yield* Scene.moveTo(v, 512, 40, 'walk');
    G.say(v, 'Окно я сам и разбил. Захожу!', 1.4); yield 1.2;
    yield* Scene.tween(0.5, k => { v.alpha = 1 - k; st.fade = k; });
  };
};

// ---------- класс уровня ----------
V4.Level = class {
  constructor() { this.id = 7; this.stats = { time: 0, dmg: 0, kills: 0, deflect: 0, secrets: 0, food: 0, deaths: 0, caught: 0 }; this.score = 0; this.mode = 'run'; this.scene = false; }
  start(opts = {}) {
    V4.setupAnims();
    G.portraits.valera = G.portraits.valera6 || G.portraits.valera;
    if (V4.pCmd) G.portraits.cmd7 = V4.pCmd;
    FX.list = []; G.bubbles = [];
    this.run = new V4.Run(this);
    const st = opts.stage || 'intro';
    const at = { A: ['A', 700, 1], B: ['B', 200, 1], A2: ['A2', 140, 1], C: ['C', 90, 1], E: ['E', 80, 1], D: ['D', 40, 1], D1: ['D', 40, 1], F4: ['F4', 1060, -1], F3: ['F3', 346, 1], F2: ['F2', 346, 1], F1: ['F1', 346, 1], RA1: ['RA1', 600, -1], RA2: ['RA2', 600, -1], RB1: ['RB1', 600, -1], RA0: ['RA0', 600, -1], RB3: ['RB3', 40, 1] }[st];
    if (opts.flags) Object.assign(this.run.flags, opts.flags);
    if (st === 'hall') return this.toHall(this.run);
    if (st === 'roof') { this.run.flags.dIn = 1; this.run.load('D', 40, 1); return this.roofExit(this.run); }
    if (at) { this.run.load(...at); this.mode = 'run'; return; }
    if (st === 'arrive') return this.arrive();
    this.playStage(V4.sceneRoad(this), () => this.playStage(V4.sceneVan(this), () => this.arrive()));
  }
  // сцена на отдельном фоне
  playStage(gen, next) { this.mode = 'stage'; this.scene = true; Scene.run(gen, () => { this.scene = false; next && next(); }); }
  // сцена поверх карты
  playOnMap(gen, next) { this.scene = true; const pl = this.run.player; pl.controls = false; pl.vx = 0; Scene.run(gen, () => { this.scene = false; pl.controls = true; pl.forcePose = null; this.run.camLock = false; next && next(); }); }
  arrive() { this.mode = 'run'; this.run.load('A', 700, 1); this.playOnMap(V4.sceneArrive(this, this.run)); }
  toSewer(run) {   // спускается по скобам шахты сверху вниз
    run.arrive = (pl, r) => { pl.y = 30; pl.controls = false; pl.facing = 1; pl.auto = { i: 0, sp: 115, anim: 'climb', path: [{ x: V4.SEW_L, y: V4.GY }], done: () => { pl.controls = true; pl.setAnim('stand'); } }; };
    run.go('B', V4.SEW_L, 'Вниз по скобам...');
  }
  sewerExit(run) {   // вылезает из люка на улице
    run.arrive = (pl, r) => { pl.y = V4.GY + 100; pl.controls = false; pl.clipY = V4.GY + 2; pl.auto = { i: 0, sp: 46, anim: 'climb', clipY: V4.GY + 2, path: [{ x: r.D.manX, y: V4.GY }, { x: r.D.manX + 30, y: V4.GY, anim: 'walk' }], done: () => { pl.controls = true; pl.setAnim('stand'); } }; };
    run.go('A2', 120, 'Вверх по скобам...');
  }
  matizScene(run) { this.playOnMap(V4.sceneMatiz(this, run)); }
  busScene(run) { this.playOnMap(V4.sceneBus(this, run)); }
  enterShop(run) { delete run.flags.dSeg; delete run.flags.dCp; delete run.flags.dIn; run.go('D', 40, 'Цех сортировки', 1); }
  roofExit(run) {   // дверь на крышу -> мини-сцена издалека -> полёт по тросу -> леса -> заводоуправление
    run.player.controls = false;
    this.playStage(V4.sceneRoof(this), () => this.playStage(V4.sceneSlide(this), () => this.playStage(V4.sceneScaff(this), () => { this.mode = 'run'; this.run.hidePlayer = false; this.run.player = null; this.run.load('F4', 1060, -1); G.say(this.run.player, 'Заводоуправление. Мрамор, бархат... На наши деньги!', 2.2); })));
  }
  climbAntenna(run) {
    this.playOnMap(V4.sceneCable(this, run), () => this.playStage(V4.sceneSlide(this), () => this.playStage(V4.sceneScaff(this), () => { this.mode = 'run'; this.run.hidePlayer = false; this.run.player = null; this.run.load('F4', 1060, -1); G.say(this.run.player, 'Заводоуправление. Мрамор, бархат... На наши деньги!', 2.2); })));
  }
  toHall(run) { this.playStage(V4.sceneHall(this), () => this.finish()); }
  finish() { this.mode = 'done'; G.onLevelComplete(this); }
  update(dt) {
    if (this.titleT > 0) this.titleT -= dt;
    if (this.mode === 'stage') { Scene.tick(dt); if (this.updateScene) this.updateScene(dt); return; }
    if (this.mode === 'run') { if (this.scene) Scene.tick(dt); if (this.mode !== 'run') return; this.run.update(dt); FX.update(dt); G.updateBubbles(dt); this.stats.time += dt; }
  }
  draw(c) {
    if (this.mode === 'stage' && this.drawScene) { this.drawScene(c); if (Scene.t < 3) G.text('Esc — пропустить', W - 8, H - 12, { align: 'right', size: 8, color: 'rgba(255,255,255,0.5)' }); return; }
    if (this.mode === 'run') {
      this.run.draw(c);
      if (this.scene) Scene.drawDialog(c);
      if (this.titleT > 0) G.bigTitle(c, 'УРОВЕНЬ 7: ЗАВОДОУПРАВЛЕНИЕ', Math.min(1, this.titleT), { size: 18, color: '#ffd84a', y: 70 });
    }
  }
  get canPause() { return this.mode === 'run' && !this.scene && !this.run.mg; }
};
