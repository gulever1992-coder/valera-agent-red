'use strict';
// ============ УРОВЕНЬ 7: катсцены на движке (трасса, фургон, площадь, автобус, главный зал) и класс уровня ============
WHO.stas = { name: 'СТАС', color: '#8cc8ff', voice: 250 };
WHO.maxim = { name: 'МАКСИМ', color: '#e0c070', voice: 200 };
WHO.biker7 = { name: 'БАЙКЕР', color: '#e08050', voice: 110 };
WHO.leather = { name: 'КОЖАНЫЙ', color: '#f070c0', voice: 300 };
WHO.cmd7 = { name: 'СПЕЦНАЗ НА ВХОДЕ', color: '#8ac070', voice: 160 };
WHO.cmdr7 = { name: 'КОМАНДИР СПЕЦНАЗА', color: '#8ac070', voice: 130 };
WHO.deniso = { name: 'ДЕНИС О.', color: '#d0d0ff', voice: 230 };
WHO.denisch = { name: 'ДЕНИС Ч.', color: '#f0f0f0', voice: 270 };
WHO.mrx = { name: 'ГОСПОДИН ИКС', color: '#ff4040', voice: 90 };
// пассажиры автобуса — персонажи ур.2 и ур.4
Spr.ANIM.gop7 = { stand: { fr: [['gopnik', 1]], fps: 1 }, walk: { fr: [['gopnik', 2], ['gopnik', 3]], fps: 5 } };
Spr.ANIM.bomzh7 = { stand: { fr: [['bomzh', 0]], fps: 1 }, walk: { fr: [['bomzh', 0], ['bomzh', 1]], fps: 4 } };
Spr.ANIM.alkash7 = { stand: { fr: [['bomzh', 4]], fps: 1 }, walk: { fr: [['bomzh', 4], ['bomzh', 5]], fps: 3 } };

L7.Scenes = {};
// общий каркас сцены: фон-функция, актёры, обновление
L7.stage = function (level, o) {
  const st = Object.assign({ fade: 1, title: null, titleK: 0, t: 0, actors: [], flashes: [] }, o);
  st.rain = typeof o.rain === 'number' ? new L7.Rain(o.rain) : o.rain || null;
  level.drawScene = c => {
    st.bg(c, st);
    const list = st.actors.slice().sort((a, b) => (a.z || 0) - (b.z || 0));
    for (const a of list) a.draw(c, st.cx || 0, 0);
    if (st.over) st.over(c, st);
    for (const f of st.flashes) { c.fillStyle = `rgba(255,255,255,${0.9 * (1 - f.t / 0.15)})`; c.beginPath(); c.arc(f.x, f.y, 10 + f.t * 60, 0, 7); c.fill(); }
    if (st.rain) st.rain.draw(c);
    c.save(); c.translate(-(st.cx || 0), 0); FX.draw(c); c.restore();
    G.drawBubbles(c, st.cx || 0, 0);
    Scene.drawDialog(c);
    if (st.title) G.bigTitle(c, st.title, st.titleK, { size: st.titleSize || 16, color: '#ffd84a', y: st.titleY || 300 });
    if (st.fade > 0) { c.fillStyle = `rgba(0,0,0,${st.fade})`; c.fillRect(0, 0, W, H); }
  };
  level.updateScene = dt => {
    st.t += dt; for (const a of st.actors) a.update(dt); FX.update(dt); G.updateBubbles(dt);
    if (st.rain) st.rain.update(dt);
    for (const f of st.flashes) f.t += dt; st.flashes = st.flashes.filter(f => f.t < 0.15);
    if (st.tick) st.tick(dt, st);
  };
  return st;
};
L7.actor = (st, style, x, f = 1, o = {}) => { const a = Object.assign(new G.Actor(style, x, L7.GY, f), o); st.actors.push(a); return a; };
L7.fullBG = (img, fill = '#141820') => c => { if (img) c.drawImage(img, 0, 0, W, H); else { c.fillStyle = fill; c.fillRect(0, 0, W, H); } };

// ---------- 1. трасса: автостоп ----------
L7.sceneRoad = function (level) {
  const road = L7.img.road || (typeof L6 !== 'undefined' && L6.img.bgf);
  const st = L7.stage(level, { rain: 120, bg: (c, st) => { L7.fullBG(road)(c); }, over: null });
  const bike = { set: 'solo', x: -200, y: L7.GY + 2, pose: 'idle', mv: false, on: true };
  const van = { x: -320, y: L7.GY + 2, mv: false, crew: true, door: false, on: false };
  st.actors.push({ z: 1, update() {}, draw(c) { if (bike.on) L7.drawBike(c, bike, st.t); if (van.on) L7.drawVan(c, van, st.t); } });
  const v = L7.actor(st, 'valera7', -40, 1, { z: 2 });
  const lm = L7.actor(st, 'leather7', 470, -1, { z: 2 }); lm.setAnim('thumb');
  const head = (q, dx, h) => ({ get x() { return q.x + dx; }, get y() { return q.y; }, headH: h, voice: 150 });
  const bikeHead = head(bike, 6, 92), vanHead = head(van, 40, 96);
  const drive = function* (q, x1, dur, ease = 'out') { const x0 = q.x; q.mv = true; if (q.set) q.pose = 'ride'; yield* Scene.tween(dur, k => { q.x = U.lerp(x0, x1, ease === 'out' ? U.easeOut(k) : k * k); }); q.mv = false; if (q.set) q.pose = 'idle'; };
  return function* () {
    Music.play('cutscene');
    st.title = 'Трасса у леса. Вечер. Дождь.'; st.titleY = 60; st.titleSize = 12;
    yield* Scene.tween(1, k => { st.fade = 1 - k; st.titleK = k; });
    yield* Scene.moveTo(v, 230, 60, 'walk');
    st.title = null; v.setAnim('sigh'); yield 0.5;
    yield* Scene.say('valera', 'Фух, выбрался из леса... Весь мокрый и в грязи. Надо поймать попутку до города.', v);
    v.setAnim('thumb'); yield 0.6;
    lm.facing = -1; lm.setAnim('look'); yield 0.7;
    yield* Scene.say('leather', 'О папа мия! Фу какой!', lm);
    lm.setAnim('walk'); yield* Scene.moveTo(lm, 540, 40, 'walk'); lm.facing = -1; lm.setAnim('thumb');
    Sound.play('honk');
    yield* drive(bike, 360, 1.8);
    bike.pose = 'beckon';
    yield* Scene.say('biker7', 'РРРР... Крррасавчик, прррыгай, подвезузузу!', bikeHead);
    v.setAnim('stand'); G.say(v, 'О! Спасибо, братан!', 1.2); yield 0.3;
    yield* Scene.moveTo(v, 300, 55, 'walk');
    bike.pose = 'frown';
    yield* Scene.say('biker7', 'Я не тебе, парень! И лицо у тебя знакомое... прррротокольное.', bikeHead);
    v.setAnim('dazed');
    lm.facing = -1;
    yield* Scene.moveTo(lm, 330, 160, 'run');
    lm.setAnim('push'); Sound.play('punch'); G.say(lm, 'Фу фу фу, папа мия! Ми папа ждёт!', 1.6);
    yield* Scene.tween(0.35, k => { v.x = 300 - k * 40; }); v.setAnim('dazed');
    lm.facing = 1; yield* Scene.moveTo(lm, 352, 90, 'run');
    lm.visible = false; bike.set = 'duo'; bike.pose = 'idle'; Sound.play('land'); yield 0.6;
    bike.pose = 'wave'; yield 0.8;
    Sound.play('honk'); yield* drive(bike, W + 260, 1.6, 'in'); bike.on = false;
    v.facing = 1; v.setAnim('sigh');
    yield* Scene.say('valera', 'Эхх...', v);
    yield 0.6;
    van.on = true; Sound.play('honk');
    yield* drive(van, 330, 2.4);
    van.idle = true; v.facing = 1; van.door = true; Sound.play('door'); yield 0.5;
    yield* Scene.say('stas', 'Ты шо такой грязный, буська? Тебе куды надо?', vanHead);
    yield* Scene.say('valera', 'В заводоуправление!', v);
    yield* Scene.say('maxim', 'Так мы тудой и едем! Садись давай, подкынем сюдой!', vanHead);
    yield* Scene.moveTo(v, 320, 60, 'walk');
    yield* Scene.tween(0.4, k => { v.alpha = 1 - k; }); v.visible = false;
    van.door = false; Sound.play('door'); yield 0.5;
    van.idle = false; yield* drive(van, W + 400, 2.2, 'in');
    yield* Scene.tween(0.5, k => { st.fade = k; });
  };
};

// ---------- 2. в салоне фургона ----------
L7.sceneVan = function (level) {
  const img = L7.img.van_in;
  const st = L7.stage(level, { bg: (c, st) => { const j = Math.round(Math.sin(st.t * 23) * 0.7); c.drawImage(img || new Image(), 0, j, W, H); } });
  if (!img) st.bg = (c) => { c.fillStyle = '#2a2a30'; c.fillRect(0, 0, W, H); };
  // кабина слева (руль у левого края): все лицом влево
  const s = L7.actor(st, 'stas7', 232, -1, { y: 326, scale: 1.6 }); s.setAnim('sit');
  const v = L7.actor(st, 'valera7', 296, -1, { y: 328, scale: 1.5 }); v.setAnim('sitCross');
  const m = L7.actor(st, 'max7', 360, -1, { y: 326, scale: 1.6 }); m.setAnim('sit');
  for (const a of [s, v, m]) a.headH = 150;
  st.tick = (dt, st) => { for (const a of [s, v, m]) a.y = (a.y0 || (a.y0 = a.y)) + (Math.sin(st.t * 23 + a.x) > 0.6 ? -1 : 0); };
  return function* () {
    Music.play('cutscene');
    yield* Scene.tween(0.6, k => { st.fade = 1 - k; });
    yield 0.4;
    v.setAnim('sit');
    yield* Scene.say('valera', 'У вас номера не наши. Вы откуда? Что забыли в Выборгске?', v);
    m.setAnim('sitTalk');
    yield* Scene.say('maxim', 'Да мы импортом занимаемся. Сами-то мы в столице Лемурии живём, но говорят, тут перспективное направление!', m);
    m.setAnim('sit'); s.setAnim('sitTalk');
    yield* Scene.say('stas', 'Вон, глянь на ароматизатор — флажок Ясногории. А на заднем стекле наклейка: «Лучший пряник — картопляник!»', s);
    s.setAnim('sit'); v.setAnim('sitCross');
    G.say(v, '(Понаехали тут... Скоро и туалетную бумагу из-за бугра возить начнут. По три рубля сверху.)', 3.2, { think: true });
    yield 3.4;
    s.setAnim('sitTalk');
    yield* Scene.say('stas', 'Почти приехали, буська! Сегодня там какой-то съезд — костюмы, лимузины...', s);
    s.setAnim('sit');
    yield* Scene.tween(0.6, k => { st.fade = k; });
  };
};

// ---------- 3. площадь у заводоуправления ----------
L7.scenePlaza = function (level) {
  const st = L7.stage(level, { rain: 140, bg: L7.fullBG(L7.img.plaza) });
  const prop = (sheet, fr, x, f = 1, z = 0) => st.actors.push({ z, update() {}, draw(c) { Spr.draw(c, sheet, fr, x, L7.GY + 2, f); } });
  prop('car7', 0, 90, 1, 0); prop('car7', 3, 560, -1, 0);
  const guests = [[0, 230, 1], [1, 258, -1], [2, 400, -1], [0, 438, 1], [1, 470, -1]].map(([t, x, f]) => { const a = L7.actor(st, 'guest' + t, x, f, { z: 1 }); a.setAnim('chat'); a.animT = Math.random() * 2; return a; });
  const ph = L7.actor(st, 'photo7', 180, 1, { z: 1 }); ph.setAnim('shoot');
  const cm = L7.actor(st, 'cam7', 520, -1, { z: 1 }); cm.setAnim('film');
  const rp = L7.actor(st, 'rep7', 548, -1, { z: 1 }); rp.setAnim('talk');
  const g1 = L7.actor(st, 'guard7', 300, 1, { z: 1 }), g2 = L7.actor(st, 'guard7', 350, -1, { z: 1 });
  const van = { x: -260, y: L7.GY + 6, mv: false, crew: true, door: false };
  st.actors.push({ z: 3, update() {}, draw(c) { L7.drawVan(c, van, st.t); } });
  const s = L7.actor(st, 'stas7', 0, 1, { z: 4, visible: false }), m = L7.actor(st, 'max7', 0, 1, { z: 4, visible: false }), v = L7.actor(st, 'valera7', 0, 1, { z: 4, visible: false });
  st.tick = (dt, st) => { if (Math.random() < dt * 1.3) { st.flashes.push({ x: ph.x + 18, y: ph.y - 66, t: 0 }); Sound.play('blip', 900); } };
  return function* () {
    Music.play('cutscene');
    st.title = 'Заводоуправление. Съезд «для своих»'; st.titleY = 60; st.titleSize = 12;
    yield* Scene.tween(1, k => { st.fade = 1 - k; st.titleK = k; });
    van.mv = true; yield* Scene.tween(2, k => { van.x = U.lerp(-260, 110, U.easeOut(k)); }); van.mv = false; van.door = true; Sound.play('door');
    st.title = null;
    for (const a of [s, m, v]) { a.x = 120; a.visible = true; a.setAnim('stand'); }
    m.x = 140; v.x = 100;
    yield 0.4;
    yield* Scene.moveTo(s, 270, 60, 'walk'); s.setAnim('stand');
    m.x = 140; yield* Scene.moveTo(m, 240, 60, 'walk'); m.setAnim('stand');
    yield* Scene.say('stas', 'Внутри увидымся, буська!', s);
    yield* Scene.moveTo(s, 330, 50, 'walk'); s.visible = false; yield* Scene.moveTo(m, 330, 50, 'walk'); m.visible = false;
    yield* Scene.moveTo(v, 285, 55, 'walk');
    g1.setAnim('point');
    yield* Scene.say('cmd7', 'Так-так-так... Фоторобот совпадает. Вам, Мистер Рэд, в доступе отказано!', g1);
    v.setAnim('dazed');
    s.visible = true; s.x = 360; s.facing = -1; s.setAnim('shrug'); m.visible = true; m.x = 385; m.facing = -1; m.setAnim('wave');
    yield* Scene.say('maxim', 'Не грусти, буська, выпей бульбяночку!', m);
    s.visible = false; m.visible = false; g1.setAnim('stand');
    v.facing = -1; v.setAnim('sigh'); yield 0.6;
    v.facing = 1; yield* Scene.moveTo(v, 450, 70, 'walk');
    v.setAnim('shoutFist');
    yield* Scene.say('valera', 'Стропальщики шестого разряда не сдаются!.. Пойду в обход — через парковку.', v);
    yield* Scene.moveTo(v, W + 40, 90, 'duckRun');
    st.title = 'УРОВЕНЬ 7: ЗАВОДОУПРАВЛЕНИЕ'; st.titleY = H / 2; st.titleSize = 20; st.titleK = 0;
    yield* Scene.tween(0.6, k => { st.titleK = k; }); Sound.play('sting'); yield 1.4;
    yield* Scene.tween(0.6, k => { st.fade = k; });
  };
};

// ---------- 4. двор: автобус с людьми, конвейер, железная дверь ----------
L7.sceneBus = function (level, run) {
  const cx = U.clamp(L7.GATE_X - W + 120, 0, L7.OUT_W - W);
  const v = run.player;
  const st = L7.stage(level, { bg: c => { run.world.cam.x = cx; run.drawBG(c, cx); run.drawProps(c, cx, 0, 'behind'); run.drawProps(c, cx, 0, 'mid'); }, cx: 0 });
  st.rain = run.rain;
  const gx = L7.GATE_X - cx;
  const bus = { x: -260, mv: false, open: false };
  const conv = gx - 130;
  st.actors.push({ z: 0, update() {}, draw(c) {
    Spr.draw(c, 'bus7', 6, conv, L7.GY + 2, 1);   // конвейер
    // дверь: открыта — зелёный свет
    Spr.draw(c, 'bus7', st.doorOpen ? 8 : 7, gx, L7.GY + 2, 1);
    if (st.doorOpen && (G.t * 4 | 0) % 2) { c.fillStyle = 'rgba(80,255,120,0.18)'; c.fillRect(gx - 40, L7.GY - 104, 80, 104); }
    Spr.draw(c, 'bus7', 9, gx, L7.GY - 106, 1);
    // автобус
    const jig = bus.mv ? Math.floor(st.t * 14) % 2 : 0, ph = bus.mv ? Math.floor(st.t * 16) % 4 : 0;
    Spr.draw(c, 'bus7', bus.open ? 1 : 0, bus.x, L7.GY - 14 - jig, 1);
    for (const dx of [-77, 108]) Spr.drawC(c, 'bus7', 2 + ph, bus.x + dx, L7.GY - 19, 0, 1);
  } });
  const pass = [['bomzh7', 1], ['gop7', 1], ['sailor', -1], ['alkash7', 1], ['gop7', 1], ['sailor', -1]].map(([s, f]) => L7.actor(st, s, 0, 1, { visible: false, z: 2, flipAnim: f }));
  const boss = L7.actor(st, 'guard7', gx - 210, 1, { z: 2 });
  const hero = L7.actor(st, 'valera7', gx - 90, 1, { z: 5 }); hero.setAnim('peek');
  st.over = c => { Spr.draw(c, 'pr7', 4, gx - 90 + 12, L7.GY + 2, 1); };   // ящик перед Валерой
  st.fade = 0;
  return function* () {
    Music.play('cutscene');
    G.say(hero, 'Тихо... Кто-то едет.', 1.4); yield 1;
    bus.mv = true; Sound.play('honk');
    yield* Scene.tween(2.6, k => { bus.x = U.lerp(-260, gx - 400, U.easeOut(k)); }); bus.mv = false;
    bus.open = true; Sound.play('door'); yield 0.5;
    boss.facing = -1;
    yield* Scene.say('cmdr7', 'Так-так... Выходим! Скоро вам дадут покушать и выпить.', boss);
    st.doorOpen = true; Sound.play('door');
    for (const [i, p] of pass.entries()) { p.visible = true; p.x = bus.x + 60; p.setAnim('walk'); }
    // по одному: к конвейеру, по ленте — в дверь
    const go = function* (p, i) { yield* Scene.moveTo(p, conv - 110 + i * 4, 70, 'walk'); p.setAnim('stand'); };
    for (let i = 0; i < pass.length; i++) { const p = pass[i]; p.x = bus.x + 70; p.visible = true; yield* go(p, i); }
    G.say(pass[0], 'Покушать — это хорошо...', 1.4);
    yield* Scene.tween(3.2, k => { pass.forEach((p, i) => { const x = conv - 110 + i * 4 + k * (260 - i * 22); p.x = Math.min(x, gx); p.y = L7.GY - (p.x > conv - 105 ? 14 : 0); p.setAnim('stand'); if (p.x >= gx - 4) p.visible = false; }); });
    for (const p of pass) p.visible = false;
    yield 0.3; st.doorOpen = false; Sound.play('clank'); G.shake(2, 0.2); yield 0.6;
    bus.open = false; bus.mv = true; yield* Scene.tween(1.8, k => { bus.x = U.lerp(gx - 400, -300, k * k); }); bus.mv = false;
    hero.setAnim('dazed');
    yield* Scene.say('valera', 'Что за чертовщина тут творится?!', hero);
    yield* Scene.moveTo(boss, gx - 340, 50, 'walk'); boss.visible = false;
    yield* Scene.moveTo(hero, gx - 30, 60, 'walk');
    G.say(hero, 'Над дверью: «ДОСТУП ЗАПРЕЩЁН». А вот соседняя — служебная — открыта!', 2.4); yield 2.4;
    yield* Scene.tween(0.6, k => { st.fade = k; });
  };
};

// ---------- записка с кодом ----------
L7.sceneNote = function (level, run) {
  level.drawScene = c => { run.draw(c); Scene.drawDialog(c); };
  level.updateScene = dt => { G.updateBubbles(dt); };
  const pl = run.player;
  return function* () {
    pl.setAnim('peek');
    yield* Scene.say('valera', 'Кабинет зам. зама. Календарь: «Купить шпроты», «День рождения тёщи»... А внизу: «КОД ОТ ГЛАВНОГО ЗАЛА — ' + run.code.split('').join(' ') + '». Гениально.', pl);
  };
};

// ---------- 5. главный зал ----------
L7.sceneHall = function (level) {
  const st = L7.stage(level, { bg: L7.fullBG(L7.img.hall) });
  const SY = 266;   // пол сцены
  const dO = L7.actor(st, 'deniso', 430, -1, { y: SY, z: 1 }), dC = L7.actor(st, 'denisch', 500, -1, { y: SY, z: 1 });
  dO.setAnim('stand'); dC.setAnim('stand');
  const guests = [];
  for (let i = 0; i < 9; i++) { const a = L7.actor(st, 'guest' + (i % 3), 40 + i * 34 + (i % 2) * 8, 1, { y: 352 - (i % 2) * 10, z: 3 + (i % 2) }); a.setAnim('stand'); guests.push(a); }
  const v = L7.actor(st, 'valera7', 200, 1, { y: 342, z: 4 }); v.setAnim('stand');
  const troops = [L7.actor(st, 'guard7', 600, -1, { y: SY, z: 1, visible: false }), L7.actor(st, 'guard7', 640, -1, { y: SY, z: 1, visible: false })];
  st.dark = 0; st.spot = 0; st.box = 0;
  st.over = c => {
    if (st.dark > 0) { c.fillStyle = `rgba(0,0,0,${st.dark})`; c.fillRect(0, 0, W, H); }
    if (st.spot > 0) {   // прожектор на Валеру
      c.save(); c.globalAlpha = st.spot; const g = c.createRadialGradient(v.x, v.y - 40, 6, v.x, v.y - 40, 70);
      g.addColorStop(0, 'rgba(255,250,220,0.55)'); g.addColorStop(1, 'rgba(255,250,220,0)'); c.fillStyle = g; c.fillRect(v.x - 80, 0, 160, H);
      c.restore(); v.draw(c);
    }
    if (st.box > 0 && L7.img.mrx_box) {   // ложа наверху: в тени — глаза, улыбка, биомеханическая рука
      const k = st.box, bw = 150 * k, bh = 168 * k;
      Art.R(c, 18, 18, bw + 6, bh + 6, '#0a0a0c'); c.drawImage(L7.img.mrx_box, 21, 21, bw, bh);
      if ((G.t * 2 | 0) % 2) { c.fillStyle = 'rgba(255,40,40,0.25)'; c.fillRect(21, 21, bw, bh); }
    }
  };
  return function* () {
    Music.play('cutscene');
    st.title = 'Главный зал. Элита и гости из Столицы'; st.titleY = 330; st.titleSize = 12;
    yield* Scene.tween(1, k => { st.fade = 1 - k; st.titleK = k; });
    yield 0.6; st.title = null;
    dO.setAnim('talk');
    yield* Scene.say('deniso', 'Дамы и господа! С сегодняшнего дня завод и весь Выборгск переходят под управление Столицы и Господина Икс!', dO);
    dO.setAnim('stand'); dC.setAnim('talk');
    yield* Scene.say('denisch', 'Завод перепрофилируем: научная инженерия и биотехнологии! Новые возможности для населения!', dC);
    dC.setAnim('stand'); dO.setAnim('talk');
    yield* Scene.say('deniso', 'Все деньги города пойдут в Столицу — на улучшение качества жизни... Столицы.', dO);
    dO.setAnim('stand'); dC.setAnim('rub');
    yield* Scene.say('denisch', 'А из жителей Выборгска мы высосем все соки. Во благо науки!', dC);
    dO.setAnim('fist'); dC.setAnim('fist');
    for (const g of guests) g.setAnim('clap'); Sound.play('bell');
    yield* Scene.say('deniso', 'Слава Господину Икс!', dO);
    for (const g of guests) g.setAnim('stand');
    yield* Scene.tween(0.5, k => { st.box = k; });
    yield* Scene.say('mrx', '...А сейчас — сюрприз.', null);
    yield* Scene.tween(0.4, k => { st.box = 1 - k; });
    Sound.play('lever'); yield* Scene.tween(0.6, k => { st.dark = k * 0.55; st.spot = k; });
    dO.setAnim('point');
    yield* Scene.say('deniso', 'Вот он — Агент Ред, собственной персоной! Мы вас ждали, Валерий.', dO);
    for (const g of guests) { g.setAnim('shock'); g.facing = Math.sign(v.x - g.x) || 1; }
    v.setAnim('shoutFist');
    yield* Scene.say('valera', 'Это мой город! Наши деньги останутся у нас! Вы уже совсем зажрались в своей столице!', v);
    yield* Scene.say('valera', 'Туалетная бумага стала неподъёмных денег — подорожала на три рубля!', v);
    dO.setAnim('scared'); dC.setAnim('scared');
    dO.facing = 1; dC.facing = 1;
    yield* Scene.tween(0.8, k => { dO.x = 430 + k * 120; dC.x = 500 + k * 120; dO.alpha = dC.alpha = 1 - k; dO.setAnim('run'); dC.setAnim('run'); });
    dO.visible = dC.visible = false;
    for (const t of troops) { t.visible = true; t.setAnim('aim'); }
    st.dark = 0.3;
    yield* Scene.say('cmdr7', 'ВЗЯТЬ ЕГО!!!', troops[0]);
    // дротики: гости превращаются в зомби
    Music.play('alarm');
    for (let i = 0; i < guests.length; i++) {
      const g = guests[i]; Sound.play('shot'); FX.burst(g.x, g.y - 50, 6, { colors: ['#8cf08c', '#3a8a3a'], speed: 90, life: 0.4, grav: 0 });
      yield 0.18;
      g.style = 'zomb' + (i % 8); g.setAnim('stand'); g.facing = Math.sign(v.x - g.x) || 1;
      if (i % 3 === 0) G.say(g, U.choice(['Бюдже-е-ет...', 'Мозги-и-и...', 'Откаты-ы-ы...']), 1.2);
    }
    for (const g of guests) g.setAnim('walk');
    st.spot = 0;
    v.setAnim('duckRun'); G.say(v, 'Ну уж нет! Ноги в руки!', 1.2);
    yield* Scene.moveTo(v, W + 50, 140, 'duckRun');
    st.title = 'КОНЕЦ УРОВНЯ 7'; st.titleY = H / 2; st.titleSize = 24; st.titleK = 0;
    yield* Scene.tween(0.6, k => { st.titleK = k; }); Sound.play('sting'); yield 1.6;
    yield* Scene.tween(0.6, k => { st.fade = k; });
  };
};

// ---------- уровень ----------
L7.Level = class {
  constructor() { this.id = 7; this.stats = { time: 0, dmg: 0, kills: 0, deflect: 0, secrets: 0, food: 0, deaths: 0, caught: 0 }; this.score = 0; this.mode = null; }
  start(opts = {}) {
    L7.setupAnims();
    G.portraits.valera = G.portraits.valera6 || G.portraits.valera;
    const run = (map, x) => this.startRun(map, x);
    if (opts.wall) return run('out', L7.FENCE_X + 60);
    if (opts.yard) return run('out', L7.YARD_X + 40);
    if (opts.sewer) return run('sewer', 90);
    if (opts.inside) return run('in', 70);
    if (opts.run) return run('out', 70);
    if (opts.hall) return this.playScene(L7.sceneHall(this), () => this.finish());
    if (opts.van) return this.playScene(L7.sceneVan(this), () => this.playScene(L7.scenePlaza(this), () => run('out', 70)));
    if (opts.plaza) return this.playScene(L7.scenePlaza(this), () => run('out', 70));
    if (opts.bus) { this.startRun('out', L7.GATE_X - 120); this.reachGate(this.run); return; }
    this.playScene(L7.sceneRoad(this), () => this.playScene(L7.sceneVan(this), () => this.playScene(L7.scenePlaza(this), () => run('out', 70))));
  }
  playScene(gen, next) { this.mode = 'scene'; Scene.run(gen, next); }
  startRun(map, x) {
    FX.list = []; G.bubbles = [];
    this.run = new L7.Run(this, map, x);
    this.run.player.bones = 0; this.run.player.nuts = 5;
    this.run.saveCP(map, x);
    this.mode = 'run';
  }
  backToRun() { this.mode = 'run'; this.run.player.forcePose = null; this.run.player.controls = true; }
  reachGate(run) {
    this.playScene(L7.sceneBus(this, run), () => {
      FX.list = []; G.bubbles = [];
      run.done = false; run.saveCP('in', 70); run.load('in', 70, run.player); run.cps.forEach(c => c.active = c.x === 70); run.fade = 1;
      this.mode = 'run';
      G.say(run.player, 'Я внутри. Где у них тут главный зал?..', 2);
    });
  }
  reachHall() { this.playScene(L7.sceneHall(this), () => this.finish()); }
  finish() { this.mode = 'done'; G.onLevelComplete(this); }
  update(dt) {
    if (this.mode === 'scene') { Scene.tick(dt); if (this.updateScene) this.updateScene(dt); }
    else if (this.mode === 'run') { this.run.update(dt); FX.update(dt); G.updateBubbles(dt); }
  }
  draw(c) {
    if (this.mode === 'scene' && this.drawScene) { this.drawScene(c); if (Scene.t < 3) G.text('Esc — пропустить', W - 8, H - 12, { align: 'right', size: 8, color: 'rgba(255,255,255,0.5)' }); }
    else if (this.mode === 'run') this.run.draw(c);
  }
  get canPause() { return this.mode === 'run' && !this.run.mg; }
};
