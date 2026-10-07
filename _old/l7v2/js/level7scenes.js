'use strict';
// ============ УРОВЕНЬ 7: катсцены (трасса, фургон, проходная, площадь, финал в актовом зале) и класс уровня ============
WHO.stas = { name: 'СТАС', color: '#8cc8ff', voice: 250 };
WHO.maxim = { name: 'МАКСИМ', color: '#e0c070', voice: 200 };
WHO.biker = WHO.biker || { name: 'БАЙКЕР', color: '#c8a0a0', voice: 120 };
WHO.leather = { name: 'КОЖАНЫЙ', color: '#b0b0b0', voice: 180 };
WHO.boss7 = { name: 'КОМАНДИР СПЕЦНАЗА', color: '#e8b0a0', voice: 140 };

// ---------- 1. трасса у леса: автостоп ----------
L7.sceneRoad = function (level) {
  const st = { fade: 1, title: null, t: 0 };
  const v = new G.Actor('valera7', -40, 292, 1);
  const lm = new G.Actor('leather', 430, 292, -1); lm.setAnim('thumb');
  const veh = { bike: { set: 'solo', x: -260, y: 336, on: true }, van: { set: 'empty', x: -360, y: 338, on: false } };
  // кадры cars7: пары [стоит, едет] — при движении чередуются (колёса/пыль)
  const VF = Spr.sheets.cars7 && Spr.sheets.cars7.f.length >= 10 ? { solo: [2, 5], duo: [3, 6], wave: [7, 6], empty: [0, 4], open: [1, 1], hero: [8, 9] }
    : { solo: [2, 2], duo: [3, 3], wave: [3, 3], empty: [0, 0], open: [1, 1], hero: [0, 0] };
  const actors = [v, lm];
  const pseudo = (o, dx, h) => ({ get x() { return o.x + dx; }, get y() { return o.y; }, headH: h, voice: 150 });
  const bikeHead = pseudo(veh.bike, 20, 120), vanHead = pseudo(veh.van, 50, 112);
  level.drawScene = c => {
    const I = L7.img;
    if (I.road) c.drawImage(I.road, 0, 0, W, H); else { c.fillStyle = '#3a4a3a'; c.fillRect(0, 0, W, H); c.fillStyle = '#333'; c.fillRect(0, 290, W, 70); }
    for (const k of ['van', 'bike']) { const q = veh[k]; if (q.on && L7.has('cars7')) Spr.draw(c, 'cars7', VF[q.set][q.mv ? Math.floor(st.t * 9) % 2 : 0], q.x, q.y + (q.mv && Math.floor(st.t * 9) % 2 ? -1 : 0), 1); }
    for (const a of actors) a.draw(c);
    G.drawBubbles(c, 0, 0);
    Scene.drawDialog(c);
    if (st.title) G.bigTitle(c, st.title, st.titleK, { size: 16, color: '#ffd84a', y: 70 });
    if (st.fade > 0) { c.fillStyle = `rgba(0,0,0,${st.fade})`; c.fillRect(0, 0, W, H); }
  };
  level.updateScene = dt => { st.t += dt; for (const a of actors) a.update(dt); FX.update(dt); G.updateBubbles(dt); };
  const drive = function* (q, x1, dur, ease = 'out') { const x0 = q.x; q.mv = true; yield* Scene.tween(dur, k => { q.x = U.lerp(x0, x1, ease === 'out' ? U.easeOut(k) : k * k); }); q.mv = false; };
  return function* () {
    Music.play('cutscene');
    st.title = 'Трасса у леса. Вечер.'; st.titleK = 0;
    yield* Scene.tween(1, k => { st.fade = 1 - k; st.titleK = k; });
    yield* Scene.moveTo(v, 250, 60, 'walk');
    st.title = null;
    v.setAnim('peek'); yield 0.5;
    yield* Scene.say('valera', 'Фух, выбрался из леса... Весь в грязи. Надо поймать попутку до города.', v);
    v.setAnim('thumb'); yield 0.6;
    Sound.play('honk');
    yield* drive(veh.bike, 330, 1.6);
    yield* Scene.say('biker', 'Красавчик, запрыгивай!', bikeHead);
    v.setAnim('point'); G.say(v, 'О! Спасибо, братан!', 1.2); yield 0.4;
    yield* Scene.moveTo(v, 290, 50, 'walk');
    yield* Scene.say('biker', 'Это я не тебе.', bikeHead);
    v.setAnim('dazed');
    yield* Scene.moveTo(lm, 360, 120, 'run');
    lm.visible = false; veh.bike.set = 'duo'; Sound.play('land'); yield 0.5;
    G.say(bikeHead, 'Держись крепче!', 1.2); veh.bike.set = 'wave'; yield 0.6;
    Sound.play('honk'); yield* drive(veh.bike, W + 300, 1.4, 'in'); veh.bike.on = false;
    v.facing = -1; v.setAnim('dazed');
    yield* Scene.say('valera', '...Ну и ладно. Не очень-то и хотелось.', v);
    yield 0.6;
    veh.van.on = true; Sound.play('honk');
    yield* drive(veh.van, 300, 2.2);
    v.facing = 1; veh.van.set = 'open'; Sound.play('door'); yield 0.5;
    yield* Scene.say('stas', 'Ты шо такой грязный, буська? Тебе куды надо?', vanHead);
    yield* Scene.say('valera', 'В заводоуправление!', v);
    yield* Scene.say('maxim', 'Так мы тудой и едем! Садись давай, подкынем сюдой!', vanHead);
    yield* Scene.moveTo(v, 340, 60, 'walk');
    yield* Scene.tween(0.4, k => { v.alpha = 1 - k; }); v.visible = false;
    veh.van.set = 'hero'; Sound.play('door'); yield 0.5;
    yield* drive(veh.van, W + 400, 2, 'in');
    yield* Scene.tween(0.5, k => { st.fade = k; });
  };
};

// ---------- 2-3. комикс: в фургоне и на проходной ----------
L7.comicIntro = level => L3.comic(level, [
  { image: L7.img.comic_van, sfx: 'door', cap: 'По дороге в Выборгск. В салоне — мешки картошки до потолка.', lines: [
    ['У вас номера не наши. Вы откуда? Что забыли в Выборгске?', 470, 40],
    ['Да мы импортом занимаемся. Сами-то мы в столице Лемурии живём, но говорят, тут перспективное направление!', 170, 60]] },
  { image: L7.img.comic_van, sfx: 'blip', cap: 'Валера молчит. Про себя: «Понаехали тут с чужбины...»', lines: [['...', 470, 50]] },
  { image: L7.img.comic_gate, sfx: 'door', cap: 'Заводоуправление «Севмолота». Элитные машины, костюмы, вечерние платья.', lines: [
    ['Внутри увидымся, буська!', 160, 40],
    ['Стоять. Фоторобот совпадает. ДОСТУП ЗАКРЫТ!', 470, 64, true]] },
  { image: L7.img.comic_gate, sfx: 'sting', lines: [['Ах так?! Ничего... Пойду в обход — через гаражи и заводской двор!', 300, 50]], title: 'УРОВЕНЬ 7: СЕВМОЛОТ' },
]);

// ---------- 4. площадь: выход командира ----------
L7.sceneBossIntro = function (level) {
  const ar = level.arena;
  const k = new G.Actor('boss7', L7.ARENA_X + 440, L7.GROUND, -1); k.setAnim('idle'); k.voice = 140; k.headH = 100;
  const v = new G.Actor('valera7', ar.player.x, L7.GROUND, 1);
  ar.boss.draw = () => {};
  const pl = ar.player; ar.player = null;
  ar.actors = [k, v];
  const st = { title: 0 };
  level.drawScene = c => { ar.draw(c); G.bigTitle(c, 'БОЙ!', st.title, { size: 32, color: '#ff5a3a' }); Scene.drawDialog(c); };
  level.updateScene = dt => { ar.update(dt); FX.update(dt); G.updateBubbles(dt); };
  return function* () {
    Music.play('cutscene');
    yield* Scene.moveTo(v, L7.ARENA_X + 200, 60, 'walk');
    v.setAnim('stand');
    k.setAnim('radio');
    yield* Scene.say('boss7', 'Объект на площади. Рыжий, грязный, с фоторобота. Беру лично.', k);
    k.setAnim('idle');
    yield* Scene.say('boss7', 'Гражданин! Мероприятие закрытое. Для своих — из Столицы.', k);
    v.setAnim('shoutFist');
    yield* Scene.say('valera', 'Это мой завод и мой город! Я тут каждую гайку знаю!', v);
    k.setAnim('wind');
    yield* Scene.say('boss7', 'Значит, пойдёшь по статье «Сопротивление». Ко мне!', k);
    Music.play('boss');
    yield* Scene.tween(0.3, kk => { st.title = kk; });
    yield 0.8;
    st.title = 0;
    pl.x = v.x; pl.facing = 1; ar.player = pl;
    delete ar.boss.draw;
    ar.actors = [];
  };
};

// ---------- 5. финал: актовый зал ----------
L7.comicFinale = level => L3.comic(level, [
  { image: L7.img.comic_stage, sfx: 'bell', cap: 'Актовый зал. Элита Выборгска и гости из Столицы.', lines: [
    ['Дамы и господа! С сегодняшнего дня завод и весь Выборгск переходят под управление Столицы и мистера Икс!', 470, 40],
    ['Завод перепрофилируем: научная инженерия и биотехнологии! Новые возможности для населения!', 170, 64]] },
  { image: L7.img.comic_stage, sfx: 'blip', cap: 'Наверху, в тени, мистер Икс довольно потирает биомеханические руки...', lines: [
    ['Все деньги города пойдут в Столицу — на улучшение качества жизни... Столицы.', 470, 40],
    ['А из жителей Выборгска мы высосем все соки. Во благо науки!', 170, 64]] },
  { image: L7.img.comic_shout || L7.img.comic_stage, sfx: 'shout', lines: [
    ['Это мой город! Наши деньги останутся у нас! Вы уже совсем зажрались в своей столице!', 320, 36, true],
    ['Туалетная бумага стала неподъёмных денег — подорожала на 3 рубля!', 320, 96, true]] },
  { image: L7.img.comic_shout || L7.img.comic_stage, sfx: 'warn', lines: [['Это он!..', 470, 50], ['Бежим!!!', 560, 90, true]] },
  { image: L7.img.comic_raid, sfx: 'boom', cap: 'Спецназ спускается с потолка. Дротики превращают гостей в зомби!', lines: [['ВЗЯТЬ ЕГО!!!', 200, 50, true], ['Бюдже-е-ет... мозги-и-и...', 480, 80]], title: 'КОНЕЦ УРОВНЯ 7' },
]);

L7.sceneBossDown = function (level) {
  const ar = level.arena, b = ar.boss;
  const k = new G.Actor('boss7', b.x, L7.GROUND, b.facing); k.setAnim('ko');
  const v = new G.Actor('valera7', ar.player.x, L7.GROUND, ar.player.facing);
  ar.boss = null; ar.player = null; ar.actors = [k, v];
  const st = { fade: 0 };
  level.drawScene = c => { ar.draw(c); Scene.drawDialog(c); if (st.fade > 0) { c.fillStyle = `rgba(0,0,0,${st.fade})`; c.fillRect(0, 0, W, H); } };
  level.updateScene = dt => { ar.update(dt); FX.update(dt); G.updateBubbles(dt); };
  return function* () {
    Music.play('cutscene');
    yield 0.8;
    yield* Scene.say('boss7', 'Ох... Пропуск... выдан...', k);
    v.facing = 1;
    yield* Scene.say('valera', 'Вот и поговорили. Посмотрим, что там за «съезд» для своих.', v);
    yield* Scene.moveTo(v, L7.ARENA_X + 330, 60, 'walk');
    Sound.play('door');
    yield* Scene.tween(0.6, kk => { v.alpha = 1 - kk; });
    yield* Scene.tween(0.6, kk => { st.fade = kk; });
  };
};

// ---------- уровень ----------
L7.Level = class {
  constructor(carry) {
    this.id = 7;
    this.stats = { time: 0, dmg: 0, kills: 0, deflect: 0, secrets: 0, food: 0, deaths: 0 };
    this.score = 0; this.mode = null;
    this.carry = carry || { ammo: { nuts: 6, wrench: 0, bricks: 0, bottles: 0 }, weapon: 'nuts' };
  }
  start(opts = {}) {
    L7.setupAnims();
    G.portraits.valera = G.portraits.valera6 || G.portraits.valera;
    if (opts.boss) { this.startX = L7.ARENA_X - 60; this.startRun(); return; }
    if (opts.finale) { this.playScene(L7.comicFinale(this), () => { this.mode = 'done'; G.onLevelComplete(this); }); return; }
    if (opts.x != null) { this.startX = opts.x; this.startRun(); return; }
    if (opts.run) { this.startRun(); return; }
    this.playScene(L7.sceneRoad(this), () => this.playScene(L7.comicIntro(this), () => this.startRun()));
  }
  playScene(gen, next) { this.mode = 'scene'; Scene.run(gen, next); }
  startRun() { this.mode = 'run'; FX.list = []; G.bubbles = []; this.run = new L7.Run(this); Music.play('city'); }
  reachSquare(run) {
    this.carry = { ammo: run.player.ammo, weapon: run.player.weapon };
    this.arena = new L7.Arena(this, run);
    this.playScene(L7.sceneBossIntro(this), () => { this.mode = 'boss'; this.arena.startFight(); });
  }
  restartBoss() {
    const run = this.run;
    const pl = new L7.Player(L7.ARENA_X + 150, L7.GROUND);
    pl.ammo = Object.assign({}, this.carry.ammo); pl.ammo.nuts = Math.max(pl.ammo.nuts || 0, 6); pl.weapon = this.carry.weapon || 'nuts';
    run.player = pl;
    this.arena = new L7.Arena(this, run);
    this.arena.startFight();
    Music.play('boss');
    G.say(pl, 'Второй раунд, служивый!', 1.5);
  }
  bossDefeated() { this.playScene(L7.sceneBossDown(this), () => this.playScene(L7.comicFinale(this), () => { this.mode = 'done'; G.onLevelComplete(this); })); }
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
