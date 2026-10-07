'use strict';
// ============ УРОВЕНЬ 7: катсцены (дорога у леса, фургон, проходная, финал в актовом зале) и класс уровня ============
WHO.stas = { name: 'СТАС', color: '#8cc8ff', voice: 250 };
WHO.maxim = { name: 'МАКСИМ', color: '#e0c070', voice: 200 };
WHO.biker = WHO.biker || { name: 'БАЙКЕР', color: '#c8a0a0', voice: 120 };
WHO.leather = { name: 'КОЖАНЫЙ', color: '#b0b0b0', voice: 180 };
WHO.guard7 = { name: 'СПЕЦНАЗ НА ПРОХОДНОЙ', color: '#8ac070', voice: 160 };
WHO.deniso = { name: 'ДЕНИС О.', color: '#d0d0ff', voice: 230 };
WHO.denisch = { name: 'ДЕНИС Ч.', color: '#f0f0f0', voice: 270 };

// ---------- 1. дорога у леса: автостоп (спрайты едут поверх фона) ----------
L7.sceneRoad = function (level) {
  const st = { fade: 1, title: null, t: 0 };
  const v = new G.Actor('valera7', -40, 292, 1);
  const lm = new G.Actor('leather', 430, 292, -1);
  const veh = { bike: { set: 'solo', x: -260, y: 336, on: true }, van: { set: 'empty', x: -360, y: 338, on: false } };
  // кадры cars7: пары [стоит, едет] — при движении чередуются (колёса/пыль)
  const VF = Spr.sheets.cars7 && Spr.sheets.cars7.f.length >= 10 ? { solo: [2, 5], duo: [3, 6], wave: [7, 6], empty: [0, 4], open: [1, 1], hero: [8, 9] }
    : { solo: [2, 2], duo: [3, 3], wave: [3, 3], empty: [0, 0], open: [1, 1], hero: [0, 0] };
  lm.setAnim('thumb');
  const actors = [v, lm];
  const pseudo = (o, dx, h) => ({ get x() { return o.x + dx; }, get y() { return o.y; }, headH: h, voice: 150 });
  const bikeHead = pseudo(veh.bike, 20, 120), vanHead = pseudo(veh.van, 50, 112);
  level.drawScene = c => {
    const I = L7.img;
    if (I.road) c.drawImage(I.road, 0, 0, W, H); else { c.fillStyle = '#3a4a3a'; c.fillRect(0, 0, W, H); c.fillStyle = '#333'; c.fillRect(0, 290, W, 70); }
    for (const k of ['van', 'bike']) { const q = veh[k]; if (q.on) Spr.draw(c, 'cars7', VF[q.set][q.mv ? Math.floor(st.t * 9) % 2 : 0], q.x, q.y + (q.mv && Math.floor(st.t * 9) % 2 ? -1 : 0), 1); }
    for (const a of actors) a.draw(c);
    G.drawBubbles(c, 0, 0);
    Scene.drawDialog(c);
    if (st.title) { G.bigTitle(c, st.title, st.titleK, { size: 16, color: '#ffd84a', y: 70 }); }
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
  { image: L7.img.comic_van, sfx: 'door', cap: 'По дороге в Выборгск...', lines: [
    ['У вас номера не Лемурии. Вы откуда? Что забыли в Выборгске?', 470, 40],
    ['Да мы импортом занимаемся. Сами-то мы в столице Лемурии живём, но говорят, тут перспективное направление!', 170, 60]] },
  { image: L7.img.comic_van, sfx: 'blip', cap: 'Валера молчит. Про себя: «Понаехали тут с чужбины...»', lines: [['...', 470, 50]] },
  { image: L7.img.comic_gate, sfx: 'door', cap: 'Заводоуправление «Севмолота». Элитные машины, костюмы, вечерние платья.', lines: [
    ['Внутри увидымся, буська!', 160, 40],
    ['Стоять. Фоторобот совпадает. ДОСТУП ЗАКРЫТ!', 470, 64, true]] },
  { image: L7.img.comic_gate, sfx: 'sting', lines: [['Ах так?! Ничего... Я найду другой вход.', 300, 50]], title: 'УРОВЕНЬ 7: ЗАВОДОУПРАВЛЕНИЕ' },
]);

// ---------- финал: актовый зал ----------
L7.comicFinale = level => L3.comic(level, [
  { image: L7.img.comic_stage, sfx: 'bell', cap: 'Актовый зал. Элита Выборгска и гости из Столицы.', lines: [
    ['Дамы и господа! С сегодняшнего дня завод и весь Выборгск переходят под управление Столицы и мистера Икс!', 470, 40],
    ['Завод перепрофилируем: научная инженерия и биотехнологии! Новые возможности для населения!', 170, 64]] },
  { image: L7.img.comic_stage, sfx: 'blip', cap: 'Наверху, в тени, мистер Икс довольно потирает биомеханические руки...', lines: [
    ['Все деньги города пойдут в Столицу — на улучшение качества жизни... Столицы.', 470, 40],
    ['А из жителей Выборгска мы высосем все соки. Во благо науки!', 170, 64]] },
  { image: L7.img.comic_shout, sfx: 'shout', lines: [
    ['Это мой город! Наши деньги останутся у нас! Вы уже совсем зажрались в своей столице!', 320, 36, true],
    ['Туалетная бумага стала неподъёмных денег — подорожала на 3 рубля!', 320, 96, true]] },
  { image: L7.img.comic_shout, sfx: 'warn', lines: [['Это он!..', 470, 50], ['Бежим!!!', 560, 90, true]] },
  { image: L7.img.comic_raid, sfx: 'boom', cap: 'Спецназ спускается с потолка. Дротики превращают гостей в зомби!', lines: [['ВЗЯТЬ ЕГО!!!', 200, 50, true], ['Бюдже-е-ет... мозги-и-и...', 480, 80]], title: 'КОНЕЦ УРОВНЯ 7' },
]);

// ---------- записка с кодом (календарь в бухгалтерии) ----------
L7.sceneNote = function (level, run) {
  level.drawScene = c => { run.draw(c); Scene.drawDialog(c); };
  level.updateScene = dt => { G.updateBubbles(dt); };
  const pl = run.player;
  return function* () {
    pl.setAnim('peek');
    yield* Scene.say('valera', 'Календарь... «День рождения тёщи», «Купить шпроты»... А внизу: «КОД СЕЙФА — ' + run.code.split('').join(' ') + '». Гениально.', pl);
  };
};

// ---------- уровень ----------
L7.Level = class {
  constructor() {
    this.id = 7;
    this.stats = { time: 0, dmg: 0, kills: 0, deaths: 0, caught: 0 };
    this.score = 0; this.mode = null;
  }
  start(opts = {}) {
    L7.setupAnims();
    G.portraits.valera = G.portraits.valera6 || G.portraits.valera;
    if (opts.inside) { this.startRun('in', opts.floor ? L7.fy(opts.floor) : L7.fy(4), opts.x || (opts.floor ? 150 : 1830)); return; }
    if (opts.yard) { this.startRun('out', L7.GY, L7.FENCE_X + 70); return; }
    if (opts.scaff) { this.startRun('out', L7.GY, L7.FAC_X - 40); return; }
    if (opts.finale) { this.mode = 'scene'; this.playScene(L7.comicFinale(this), () => { this.mode = 'done'; G.onLevelComplete(this); }); return; }
    if (opts.run) { this.startRun('out', L7.GY, 60); return; }
    this.mode = 'scene';
    this.playScene(L7.sceneRoad(this), () => this.playScene(L7.comicIntro(this), () => this.startRun('out', L7.GY, 60)));
  }
  playScene(gen, next) { this.mode = 'scene'; Scene.run(gen, next); }
  startRun(map, y, x) {
    FX.list = []; G.bubbles = [];
    this.run = new L7.Run(this, map, x, y);
    if (map === 'out') this.run.player.bones = 2;
    this.run.saveCP(map, x, y);
    this.mode = 'run';
  }
  backToRun() { this.mode = 'run'; this.run.player.forcePose = null; this.run.player.controls = true; }
  reachHall(run) {
    run.trans = null;
    this.playScene(L7.comicFinale(this), () => { this.mode = 'done'; G.onLevelComplete(this); });
  }
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
